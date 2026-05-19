<template>
  <div class="supply-purchase">
    <el-tabs v-model="activeTab" type="border-card">
      <!-- Purchase Request Tab -->
      <el-tab-pane :label="$t('supply.req.title')" name="req">
        <el-form :model="reqQuery" inline class="search-form">
          <el-form-item :label="$t('supply.req.reqNo')">
            <el-input v-model="reqQuery.reqNo" :placeholder="$t('common.pleaseInput')" clearable />
          </el-form-item>
          <el-form-item :label="$t('supply.req.status')">
            <el-select v-model="reqQuery.status" :placeholder="$t('common.pleaseSelect')" clearable>
              <el-option :label="$t('supply.req.statusDraft')" :value="0" />
              <el-option :label="$t('supply.req.statusPending')" :value="1" />
              <el-option :label="$t('supply.req.statusApproved')" :value="2" />
              <el-option :label="$t('supply.req.statusRejected')" :value="3" />
              <el-option :label="$t('supply.req.statusOrdered')" :value="4" />
            </el-select>
          </el-form-item>
          <el-form-item>
            <el-button type="primary" @click="searchReq">{{ $t('common.search') }}</el-button>
            <el-button @click="resetReq">{{ $t('common.reset') }}</el-button>
            <el-button type="primary" @click="addReq">{{ $t('common.add') }}</el-button>
          </el-form-item>
        </el-form>

        <el-table :data="reqList" v-loading="reqLoading" border stripe>
          <el-table-column prop="reqNo" :label="$t('supply.req.reqNo')" width="170" />
          <el-table-column prop="reason" :label="$t('supply.req.reason')" min-width="200" show-overflow-tooltip />
          <el-table-column prop="totalAmount" :label="$t('supply.req.totalAmount')" width="130" align="right">
            <template #default="{ row }">{{ formatAmount(row.totalAmount) }}</template>
          </el-table-column>
          <el-table-column prop="status" :label="$t('supply.req.status')" width="100">
            <template #default="{ row }">
              <el-tag :type="reqStatusType(row.status)">{{ reqStatusLabel(row.status) }}</el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="createTime" :label="$t('supply.req.createTime')" width="170" />
          <el-table-column :label="$t('common.operation')" width="250" fixed="right">
            <template #default="{ row }">
              <el-button link type="primary" @click="editReq(row)" v-if="row.status === 0">{{ $t('common.edit') }}</el-button>
              <el-button link type="success" @click="submitReq(row)" v-if="row.status === 0">{{ $t('supply.req.submit') }}</el-button>
              <el-button link type="success" @click="approveReq(row)" v-if="row.status === 1">{{ $t('supply.req.approve') }}</el-button>
              <el-button link type="danger" @click="rejectReq(row)" v-if="row.status === 1">{{ $t('supply.req.reject') }}</el-button>
              <el-button link type="danger" @click="deleteReq(row)" v-if="row.status === 0">{{ $t('common.delete') }}</el-button>
            </template>
          </el-table-column>
        </el-table>

        <el-pagination v-model:current-page="reqQuery.pageNum" v-model:page-size="reqQuery.pageSize"
          :total="reqTotal" :page-sizes="[10, 20, 50]" layout="total, sizes, prev, pager, next, jumper"
          @size-change="getReqList" @current-change="getReqList" class="pagination" />
      </el-tab-pane>

      <!-- Purchase Order Tab -->
      <el-tab-pane :label="$t('supply.order.title')" name="order">
        <el-form :model="orderQuery" inline class="search-form">
          <el-form-item :label="$t('supply.order.orderNo')">
            <el-input v-model="orderQuery.orderNo" :placeholder="$t('common.pleaseInput')" clearable />
          </el-form-item>
          <el-form-item :label="$t('supply.order.status')">
            <el-select v-model="orderQuery.status" :placeholder="$t('common.pleaseSelect')" clearable>
              <el-option :label="$t('supply.order.statusPending')" :value="0" />
              <el-option :label="$t('supply.order.statusConfirmed')" :value="1" />
              <el-option :label="$t('supply.order.statusProduction')" :value="2" />
              <el-option :label="$t('supply.order.statusShipped')" :value="3" />
              <el-option :label="$t('supply.order.statusArrived')" :value="4" />
              <el-option :label="$t('supply.order.statusInspected')" :value="5" />
            </el-select>
          </el-form-item>
          <el-form-item>
            <el-button type="primary" @click="searchOrder">{{ $t('common.search') }}</el-button>
            <el-button @click="resetOrder">{{ $t('common.reset') }}</el-button>
            <el-button type="primary" @click="addOrder">{{ $t('common.add') }}</el-button>
          </el-form-item>
        </el-form>

        <el-table :data="orderList" v-loading="orderLoading" border stripe>
          <el-table-column prop="orderNo" :label="$t('supply.order.orderNo')" width="170" />
          <el-table-column prop="vendorId" :label="$t('supply.order.vendor')" width="150">
            <template #default="{ row }">{{ getVendorName(row.vendorId) }}</template>
          </el-table-column>
          <el-table-column prop="totalAmount" :label="$t('supply.order.totalAmount')" width="130" align="right">
            <template #default="{ row }">{{ formatAmount(row.totalAmount) }}</template>
          </el-table-column>
          <el-table-column prop="status" :label="$t('supply.order.status')" width="100">
            <template #default="{ row }">
              <el-tag :type="orderStatusType(row.status)">{{ orderStatusLabel(row.status) }}</el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="expectedDate" :label="$t('supply.order.expectedDate')" width="120" />
          <el-table-column prop="actualDate" :label="$t('supply.order.actualDate')" width="120" />
          <el-table-column :label="$t('common.operation')" width="280" fixed="right">
            <template #default="{ row }">
              <el-button link type="primary" @click="editOrder(row)" v-if="row.status === 0">{{ $t('common.edit') }}</el-button>
              <el-button link type="success" @click="confirmOrder(row)" v-if="row.status === 0">{{ $t('supply.order.confirm') }}</el-button>
              <el-button link type="warning" @click="shipOrder(row)" v-if="row.status === 1">{{ $t('supply.order.markShipped') }}</el-button>
              <el-button link type="success" @click="arriveOrder(row)" v-if="row.status === 3">{{ $t('supply.order.markArrived') }}</el-button>
              <el-button link type="danger" @click="deleteOrder(row)" v-if="row.status === 0">{{ $t('common.delete') }}</el-button>
            </template>
          </el-table-column>
        </el-table>

        <el-pagination v-model:current-page="orderQuery.pageNum" v-model:page-size="orderQuery.pageSize"
          :total="orderTotal" :page-sizes="[10, 20, 50]" layout="total, sizes, prev, pager, next, jumper"
          @size-change="getOrderList" @current-change="getOrderList" class="pagination" />
      </el-tab-pane>
    </el-tabs>

    <!-- Purchase Request Dialog -->
    <el-dialog v-model="reqDialogVisible" :title="reqDialogTitle" width="600px" destroy-on-close>
      <el-form :model="reqForm" :rules="reqRules" ref="reqFormRef" label-width="100px">
        <el-form-item :label="$t('supply.req.reason')" prop="reason">
          <el-input v-model="reqForm.reason" type="textarea" :rows="3" />
        </el-form-item>
        <el-form-item :label="$t('supply.req.totalAmount')" prop="totalAmount">
          <el-input-number v-model="reqForm.totalAmount" :precision="2" :min="0" style="width:100%" controls-position="right" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="reqDialogVisible = false">{{ $t('common.cancel') }}</el-button>
        <el-button type="primary" @click="submitReqForm" :loading="submitLoading">{{ $t('common.confirm') }}</el-button>
      </template>
    </el-dialog>

    <!-- Purchase Order Dialog -->
    <el-dialog v-model="orderDialogVisible" :title="orderDialogTitle" width="650px" destroy-on-close>
      <el-form :model="orderForm" :rules="orderRules" ref="orderFormRef" label-width="120px">
        <el-form-item :label="$t('supply.order.vendor')" prop="vendorId">
          <el-select v-model="orderForm.vendorId" :placeholder="$t('common.pleaseSelect')" filterable style="width:100%">
            <el-option v-for="v in vendorOptions" :key="v.id" :label="v.name" :value="v.id" />
          </el-select>
        </el-form-item>
        <el-form-item :label="$t('supply.order.relatedReq')">
          <el-select v-model="orderForm.reqId" :placeholder="$t('common.pleaseSelect')" clearable style="width:100%">
            <el-option v-for="r in approvedReqs" :key="r.id" :label="r.reqNo + ' - ' + r.reason" :value="r.id" />
          </el-select>
        </el-form-item>
        <el-form-item :label="$t('supply.order.totalAmount')" prop="totalAmount">
          <el-input-number v-model="orderForm.totalAmount" :precision="2" :min="0" style="width:100%" controls-position="right" />
        </el-form-item>
        <el-form-item :label="$t('supply.order.expectedDate')" prop="expectedDate">
          <el-date-picker v-model="orderForm.expectedDate" type="date" value-format="YYYY-MM-DD" style="width:100%" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="orderDialogVisible = false">{{ $t('common.cancel') }}</el-button>
        <el-button type="primary" @click="submitOrderForm" :loading="submitLoading">{{ $t('common.confirm') }}</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { ElMessage, ElMessageBox } from 'element-plus'
import { purchaseReqApi, purchaseOrderApi, vendorApi } from '@/api/supply'

const { t } = useI18n()
const activeTab = ref('req')
const submitLoading = ref(false)
const vendorOptions = ref<any[]>([])
const approvedReqs = ref<any[]>([])

// ===== Purchase Request =====
const reqLoading = ref(false)
const reqList = ref<any[]>([])
const reqTotal = ref(0)
const reqDialogVisible = ref(false)
const reqDialogTitle = ref('')
const reqFormRef = ref()

const reqQuery = reactive({ pageNum: 1, pageSize: 10, reqNo: '', status: undefined as number | undefined })
const reqForm = reactive({ id: undefined as number | undefined, reason: '', totalAmount: 0 })
const reqRules = { reason: [{ required: true, message: () => t('supply.req.reasonRequired'), trigger: 'blur' }] }

function reqStatusLabel(s: number) {
  const map: Record<number, string> = { 0: t('supply.req.statusDraft'), 1: t('supply.req.statusPending'), 2: t('supply.req.statusApproved'), 3: t('supply.req.statusRejected'), 4: t('supply.req.statusOrdered') }
  return map[s] || ''
}
function reqStatusType(s: number) {
  const map: Record<number, string> = { 0: 'info', 1: 'warning', 2: 'success', 3: 'danger', 4: '' }
  return map[s] || 'info'
}

async function getReqList() {
  reqLoading.value = true
  try {
    const res = await purchaseReqApi.list(reqQuery)
    reqList.value = res.data?.records || []
    reqTotal.value = res.data?.total || 0
  } finally { reqLoading.value = false }
}
function searchReq() { reqQuery.pageNum = 1; getReqList() }
function resetReq() { reqQuery.reqNo = ''; reqQuery.status = undefined; searchReq() }
function addReq() { reqDialogTitle.value = t('common.add'); Object.assign(reqForm, { id: undefined, reason: '', totalAmount: 0 }); reqDialogVisible.value = true }
function editReq(row: any) { reqDialogTitle.value = t('common.edit'); Object.assign(reqForm, { ...row }); reqDialogVisible.value = true }

async function submitReqForm() {
  await reqFormRef.value?.validate()
  submitLoading.value = true
  try {
    if (reqForm.id) { await purchaseReqApi.update(reqForm) } else { await purchaseReqApi.add(reqForm) }
    ElMessage.success(t('common.success')); reqDialogVisible.value = false; getReqList()
  } finally { submitLoading.value = false }
}
async function submitReq(row: any) { await ElMessageBox.confirm(t('supply.req.confirmSubmit'), t('common.confirm')); await purchaseReqApi.submit(row.id); ElMessage.success(t('common.success')); getReqList() }
async function approveReq(row: any) { await ElMessageBox.confirm(t('supply.req.confirmApprove'), t('common.confirm')); await purchaseReqApi.approve(row.id); ElMessage.success(t('common.success')); getReqList() }
async function rejectReq(row: any) { await ElMessageBox.confirm(t('supply.req.confirmReject'), t('common.confirm')); await purchaseReqApi.reject(row.id); ElMessage.success(t('common.success')); getReqList() }
async function deleteReq(row: any) { await ElMessageBox.confirm(t('supply.req.confirmDelete'), t('common.confirm')); await purchaseReqApi.remove(row.id); ElMessage.success(t('common.success')); getReqList() }

// ===== Purchase Order =====
const orderLoading = ref(false)
const orderList = ref<any[]>([])
const orderTotal = ref(0)
const orderDialogVisible = ref(false)
const orderDialogTitle = ref('')
const orderFormRef = ref()

const orderQuery = reactive({ pageNum: 1, pageSize: 10, orderNo: '', status: undefined as number | undefined })
const orderForm = reactive({ id: undefined as number | undefined, vendorId: undefined as number | undefined, reqId: undefined as number | undefined, totalAmount: 0, expectedDate: '' })
const orderRules = {
  vendorId: [{ required: true, message: () => t('supply.order.vendorRequired'), trigger: 'change' }],
  totalAmount: [{ required: true, message: () => t('supply.order.amountRequired'), trigger: 'blur' }]
}

function orderStatusLabel(s: number) {
  const map: Record<number, string> = { 0: t('supply.order.statusPending'), 1: t('supply.order.statusConfirmed'), 2: t('supply.order.statusProduction'), 3: t('supply.order.statusShipped'), 4: t('supply.order.statusArrived'), 5: t('supply.order.statusInspected') }
  return map[s] || ''
}
function orderStatusType(s: number) {
  const map: Record<number, string> = { 0: 'info', 1: 'warning', 2: '', 3: '', 4: 'success', 5: 'success' }
  return map[s] || 'info'
}

function getVendorName(id: number) {
  const v = vendorOptions.value.find((x: any) => x.id === id)
  return v ? v.name : id
}

async function getOrderList() {
  orderLoading.value = true
  try {
    const res = await purchaseOrderApi.list(orderQuery)
    orderList.value = res.data?.records || []
    orderTotal.value = res.data?.total || 0
  } finally { orderLoading.value = false }
}
function searchOrder() { orderQuery.pageNum = 1; getOrderList() }
function resetOrder() { orderQuery.orderNo = ''; orderQuery.status = undefined; searchOrder() }
async function addOrder() {
  orderDialogTitle.value = t('common.add')
  Object.assign(orderForm, { id: undefined, vendorId: undefined, reqId: undefined, totalAmount: 0, expectedDate: '' })
  // Load approved requests for selection
  const res = await purchaseReqApi.list({ pageNum: 1, pageSize: 100, status: 2 })
  approvedReqs.value = res.data?.records || []
  orderDialogVisible.value = true
}
function editOrder(row: any) { orderDialogTitle.value = t('common.edit'); Object.assign(orderForm, { ...row }); orderDialogVisible.value = true }

async function submitOrderForm() {
  await orderFormRef.value?.validate()
  submitLoading.value = true
  try {
    if (orderForm.id) { await purchaseOrderApi.update(orderForm) } else { await purchaseOrderApi.add(orderForm) }
    ElMessage.success(t('common.success')); orderDialogVisible.value = false; getOrderList()
  } finally { submitLoading.value = false }
}
async function confirmOrder(row: any) { await ElMessageBox.confirm(t('supply.order.confirmConfirm'), t('common.confirm')); await purchaseOrderApi.confirm(row.id); ElMessage.success(t('common.success')); getOrderList() }
async function shipOrder(row: any) { await ElMessageBox.confirm(t('supply.order.confirmShip'), t('common.confirm')); await purchaseOrderApi.ship(row.id); ElMessage.success(t('common.success')); getOrderList() }
async function arriveOrder(row: any) { await ElMessageBox.confirm(t('supply.order.confirmArrive'), t('common.confirm')); await purchaseOrderApi.arrive(row.id); ElMessage.success(t('common.success')); getOrderList() }
async function deleteOrder(row: any) { await ElMessageBox.confirm(t('supply.order.confirmDelete'), t('common.confirm')); await purchaseOrderApi.remove(row.id); ElMessage.success(t('common.success')); getOrderList() }

// ===== Init =====
function formatAmount(val: number) {
  return val != null ? Number(val).toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',') : '0.00'
}

onMounted(async () => {
  getReqList()
  getOrderList()
  const res = await vendorApi.all()
  vendorOptions.value = res.data || []
})
</script>

<style scoped>
.supply-purchase {
  padding: 16px;
}
.search-form {
  margin-bottom: 16px;
}
.pagination {
  margin-top: 16px;
  justify-content: flex-end;
}
</style>
