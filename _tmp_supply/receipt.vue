<template>
  <div class="supply-receipt">
    <el-tabs v-model="activeTab" type="border-card">
      <!-- Receipt Inspection Tab -->
      <el-tab-pane :label="$t('supply.receipt.title')" name="receipt">
        <el-form :model="receiptQuery" inline class="search-form">
          <el-form-item :label="$t('supply.receipt.receiptNo')">
            <el-input v-model="receiptQuery.receiptNo" :placeholder="$t('common.pleaseInput')" clearable />
          </el-form-item>
          <el-form-item :label="$t('supply.receipt.status')">
            <el-select v-model="receiptQuery.status" :placeholder="$t('common.pleaseSelect')" clearable>
              <el-option :label="$t('supply.receipt.statusPending')" :value="0" />
              <el-option :label="$t('supply.receipt.statusPassed')" :value="1" />
              <el-option :label="$t('supply.receipt.statusFailed')" :value="2" />
            </el-select>
          </el-form-item>
          <el-form-item>
            <el-button type="primary" @click="searchReceipt">{{ $t('common.search') }}</el-button>
            <el-button @click="resetReceipt">{{ $t('common.reset') }}</el-button>
            <el-button type="primary" @click="addReceipt">{{ $t('common.add') }}</el-button>
          </el-form-item>
        </el-form>

        <el-table :data="receiptList" v-loading="receiptLoading" border stripe>
          <el-table-column prop="receiptNo" :label="$t('supply.receipt.receiptNo')" width="170" />
          <el-table-column prop="orderId" :label="$t('supply.receipt.relatedOrder')" width="170">
            <template #default="{ row }">{{ getOrderNo(row.orderId) }}</template>
          </el-table-column>
          <el-table-column prop="vendorId" :label="$t('supply.order.vendor')" width="150">
            <template #default="{ row }">{{ getVendorName(row.vendorId) }}</template>
          </el-table-column>
          <el-table-column prop="receiptDate" :label="$t('supply.receipt.receiptDate')" width="120" />
          <el-table-column prop="status" :label="$t('supply.receipt.status')" width="100">
            <template #default="{ row }">
              <el-tag :type="receiptStatusType(row.status)">{{ receiptStatusLabel(row.status) }}</el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="createTime" :label="$t('supply.receipt.createTime')" width="170" />
          <el-table-column :label="$t('common.operation')" width="200" fixed="right">
            <template #default="{ row }">
              <el-button link type="success" @click="inspectPass(row)" v-if="row.status === 0">{{ $t('supply.receipt.pass') }}</el-button>
              <el-button link type="danger" @click="inspectFail(row)" v-if="row.status === 0">{{ $t('supply.receipt.fail') }}</el-button>
              <el-button link type="danger" @click="deleteReceipt(row)" v-if="row.status === 0">{{ $t('common.delete') }}</el-button>
            </template>
          </el-table-column>
        </el-table>

        <el-pagination v-model:current-page="receiptQuery.pageNum" v-model:page-size="receiptQuery.pageSize"
          :total="receiptTotal" :page-sizes="[10, 20, 50]" layout="total, sizes, prev, pager, next, jumper"
          @size-change="getReceiptList" @current-change="getReceiptList" class="pagination" />
      </el-tab-pane>

      <!-- Return Management Tab -->
      <el-tab-pane :label="$t('supply.return.title')" name="return">
        <el-form :model="returnQuery" inline class="search-form">
          <el-form-item :label="$t('supply.return.returnNo')">
            <el-input v-model="returnQuery.returnNo" :placeholder="$t('common.pleaseInput')" clearable />
          </el-form-item>
          <el-form-item :label="$t('supply.return.status')">
            <el-select v-model="returnQuery.status" :placeholder="$t('common.pleaseSelect')" clearable>
              <el-option :label="$t('supply.return.statusPending')" :value="0" />
              <el-option :label="$t('supply.return.statusProcessing')" :value="1" />
              <el-option :label="$t('supply.return.statusCompleted')" :value="2" />
            </el-select>
          </el-form-item>
          <el-form-item>
            <el-button type="primary" @click="searchReturn">{{ $t('common.search') }}</el-button>
            <el-button @click="resetReturn">{{ $t('common.reset') }}</el-button>
            <el-button type="primary" @click="addReturn">{{ $t('common.add') }}</el-button>
          </el-form-item>
        </el-form>

        <el-table :data="returnList" v-loading="returnLoading" border stripe>
          <el-table-column prop="returnNo" :label="$t('supply.return.returnNo')" width="170" />
          <el-table-column prop="orderId" :label="$t('supply.receipt.relatedOrder')" width="170">
            <template #default="{ row }">{{ getOrderNo(row.orderId) }}</template>
          </el-table-column>
          <el-table-column prop="vendorId" :label="$t('supply.order.vendor')" width="150">
            <template #default="{ row }">{{ getVendorName(row.vendorId) }}</template>
          </el-table-column>
          <el-table-column prop="reason" :label="$t('supply.return.reason')" min-width="180" show-overflow-tooltip />
          <el-table-column prop="amount" :label="$t('supply.return.amount')" width="130" align="right">
            <template #default="{ row }">{{ formatAmount(row.amount) }}</template>
          </el-table-column>
          <el-table-column prop="status" :label="$t('supply.return.status')" width="100">
            <template #default="{ row }">
              <el-tag :type="returnStatusType(row.status)">{{ returnStatusLabel(row.status) }}</el-tag>
            </template>
          </el-table-column>
          <el-table-column :label="$t('common.operation')" width="200" fixed="right">
            <template #default="{ row }">
              <el-button link type="warning" @click="processReturn(row)" v-if="row.status === 0">{{ $t('supply.return.process') }}</el-button>
              <el-button link type="success" @click="completeReturn(row)" v-if="row.status === 1">{{ $t('supply.return.complete') }}</el-button>
              <el-button link type="danger" @click="deleteReturn(row)" v-if="row.status === 0">{{ $t('common.delete') }}</el-button>
            </template>
          </el-table-column>
        </el-table>

        <el-pagination v-model:current-page="returnQuery.pageNum" v-model:page-size="returnQuery.pageSize"
          :total="returnTotal" :page-sizes="[10, 20, 50]" layout="total, sizes, prev, pager, next, jumper"
          @size-change="getReturnList" @current-change="getReturnList" class="pagination" />
      </el-tab-pane>
    </el-tabs>

    <!-- Receipt Dialog -->
    <el-dialog v-model="receiptDialogVisible" :title="$t('supply.receipt.addTitle')" width="550px" destroy-on-close>
      <el-form :model="receiptForm" :rules="receiptRules" ref="receiptFormRef" label-width="120px">
        <el-form-item :label="$t('supply.receipt.relatedOrder')" prop="orderId">
          <el-select v-model="receiptForm.orderId" :placeholder="$t('common.pleaseSelect')" filterable style="width:100%">
            <el-option v-for="o in arrivedOrders" :key="o.id" :label="o.orderNo" :value="o.id" />
          </el-select>
        </el-form-item>
        <el-form-item :label="$t('supply.order.vendor')" prop="vendorId">
          <el-select v-model="receiptForm.vendorId" :placeholder="$t('common.pleaseSelect')" filterable style="width:100%">
            <el-option v-for="v in vendorOptions" :key="v.id" :label="v.name" :value="v.id" />
          </el-select>
        </el-form-item>
        <el-form-item :label="$t('supply.receipt.receiptDate')" prop="receiptDate">
          <el-date-picker v-model="receiptForm.receiptDate" type="date" value-format="YYYY-MM-DD" style="width:100%" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="receiptDialogVisible = false">{{ $t('common.cancel') }}</el-button>
        <el-button type="primary" @click="submitReceiptForm" :loading="submitLoading">{{ $t('common.confirm') }}</el-button>
      </template>
    </el-dialog>

    <!-- Return Dialog -->
    <el-dialog v-model="returnDialogVisible" :title="$t('supply.return.addTitle')" width="550px" destroy-on-close>
      <el-form :model="returnForm" :rules="returnRules" ref="returnFormRef" label-width="120px">
        <el-form-item :label="$t('supply.receipt.relatedOrder')" prop="orderId">
          <el-select v-model="returnForm.orderId" :placeholder="$t('common.pleaseSelect')" filterable style="width:100%">
            <el-option v-for="o in allOrders" :key="o.id" :label="o.orderNo" :value="o.id" />
          </el-select>
        </el-form-item>
        <el-form-item :label="$t('supply.order.vendor')" prop="vendorId">
          <el-select v-model="returnForm.vendorId" :placeholder="$t('common.pleaseSelect')" filterable style="width:100%">
            <el-option v-for="v in vendorOptions" :key="v.id" :label="v.name" :value="v.id" />
          </el-select>
        </el-form-item>
        <el-form-item :label="$t('supply.return.reason')" prop="reason">
          <el-input v-model="returnForm.reason" type="textarea" :rows="3" />
        </el-form-item>
        <el-form-item :label="$t('supply.return.amount')" prop="amount">
          <el-input-number v-model="returnForm.amount" :precision="2" :min="0" style="width:100%" controls-position="right" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="returnDialogVisible = false">{{ $t('common.cancel') }}</el-button>
        <el-button type="primary" @click="submitReturnForm" :loading="submitLoading">{{ $t('common.confirm') }}</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { ElMessage, ElMessageBox } from 'element-plus'
import { receiptApi, returnApi, purchaseOrderApi, vendorApi } from '@/api/supply'

const { t } = useI18n()
const activeTab = ref('receipt')
const submitLoading = ref(false)
const vendorOptions = ref<any[]>([])
const arrivedOrders = ref<any[]>([])
const allOrders = ref<any[]>([])

// ===== Receipt =====
const receiptLoading = ref(false)
const receiptList = ref<any[]>([])
const receiptTotal = ref(0)
const receiptDialogVisible = ref(false)
const receiptFormRef = ref()
const receiptQuery = reactive({ pageNum: 1, pageSize: 10, receiptNo: '', status: undefined as number | undefined })
const receiptForm = reactive({ orderId: undefined as number | undefined, vendorId: undefined as number | undefined, receiptDate: '' })
const receiptRules = { orderId: [{ required: true, message: () => t('supply.receipt.orderRequired'), trigger: 'change' }] }

function receiptStatusLabel(s: number) {
  const map: Record<number, string> = { 0: t('supply.receipt.statusPending'), 1: t('supply.receipt.statusPassed'), 2: t('supply.receipt.statusFailed') }
  return map[s] || ''
}
function receiptStatusType(s: number) {
  const map: Record<number, string> = { 0: 'info', 1: 'success', 2: 'danger' }
  return map[s] || 'info'
}

async function getReceiptList() {
  receiptLoading.value = true
  try { const res = await receiptApi.list(receiptQuery); receiptList.value = res.data?.records || []; receiptTotal.value = res.data?.total || 0 }
  finally { receiptLoading.value = false }
}
function searchReceipt() { receiptQuery.pageNum = 1; getReceiptList() }
function resetReceipt() { receiptQuery.receiptNo = ''; receiptQuery.status = undefined; searchReceipt() }

async function addReceipt() {
  Object.assign(receiptForm, { orderId: undefined, vendorId: undefined, receiptDate: '' })
  const res = await purchaseOrderApi.list({ pageNum: 1, pageSize: 100, status: 4 })
  arrivedOrders.value = res.data?.records || []
  receiptDialogVisible.value = true
}

async function submitReceiptForm() {
  await receiptFormRef.value?.validate()
  submitLoading.value = true
  try { await receiptApi.add(receiptForm); ElMessage.success(t('common.success')); receiptDialogVisible.value = false; getReceiptList() }
  finally { submitLoading.value = false }
}
async function inspectPass(row: any) { await ElMessageBox.confirm(t('supply.receipt.confirmPass'), t('common.confirm')); await receiptApi.inspect(row.id, 1); ElMessage.success(t('common.success')); getReceiptList() }
async function inspectFail(row: any) { await ElMessageBox.confirm(t('supply.receipt.confirmFail'), t('common.confirm')); await receiptApi.inspect(row.id, 2); ElMessage.success(t('common.success')); getReceiptList() }
async function deleteReceipt(row: any) { await ElMessageBox.confirm(t('supply.receipt.confirmDelete'), t('common.confirm')); await receiptApi.remove(row.id); ElMessage.success(t('common.success')); getReceiptList() }

// ===== Return =====
const returnLoading = ref(false)
const returnList = ref<any[]>([])
const returnTotal = ref(0)
const returnDialogVisible = ref(false)
const returnFormRef = ref()
const returnQuery = reactive({ pageNum: 1, pageSize: 10, returnNo: '', status: undefined as number | undefined })
const returnForm = reactive({ orderId: undefined as number | undefined, vendorId: undefined as number | undefined, reason: '', amount: 0 })
const returnRules = {
  orderId: [{ required: true, message: () => t('supply.return.orderRequired'), trigger: 'change' }],
  reason: [{ required: true, message: () => t('supply.return.reasonRequired'), trigger: 'blur' }]
}

function returnStatusLabel(s: number) {
  const map: Record<number, string> = { 0: t('supply.return.statusPending'), 1: t('supply.return.statusProcessing'), 2: t('supply.return.statusCompleted') }
  return map[s] || ''
}
function returnStatusType(s: number) {
  const map: Record<number, string> = { 0: 'info', 1: 'warning', 2: 'success' }
  return map[s] || 'info'
}

async function getReturnList() {
  returnLoading.value = true
  try { const res = await returnApi.list(returnQuery); returnList.value = res.data?.records || []; returnTotal.value = res.data?.total || 0 }
  finally { returnLoading.value = false }
}
function searchReturn() { returnQuery.pageNum = 1; getReturnList() }
function resetReturn() { returnQuery.returnNo = ''; returnQuery.status = undefined; searchReturn() }

async function addReturn() {
  Object.assign(returnForm, { orderId: undefined, vendorId: undefined, reason: '', amount: 0 })
  const res = await purchaseOrderApi.list({ pageNum: 1, pageSize: 200 })
  allOrders.value = res.data?.records || []
  returnDialogVisible.value = true
}

async function submitReturnForm() {
  await returnFormRef.value?.validate()
  submitLoading.value = true
  try { await returnApi.add(returnForm); ElMessage.success(t('common.success')); returnDialogVisible.value = false; getReturnList() }
  finally { submitLoading.value = false }
}
async function processReturn(row: any) { await ElMessageBox.confirm(t('supply.return.confirmProcess'), t('common.confirm')); await returnApi.process(row.id); ElMessage.success(t('common.success')); getReturnList() }
async function completeReturn(row: any) { await ElMessageBox.confirm(t('supply.return.confirmComplete'), t('common.confirm')); await returnApi.complete(row.id); ElMessage.success(t('common.success')); getReturnList() }
async function deleteReturn(row: any) { await ElMessageBox.confirm(t('supply.return.confirmDelete'), t('common.confirm')); await returnApi.remove(row.id); ElMessage.success(t('common.success')); getReturnList() }

// ===== Helpers =====
function formatAmount(val: number) {
  return val != null ? Number(val).toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',') : '0.00'
}
function getVendorName(id: number) { const v = vendorOptions.value.find((x: any) => x.id === id); return v ? v.name : id }
function getOrderNo(id: number) { const o = allOrders.value.find((x: any) => x.id === id); return o ? o.orderNo : id }

onMounted(async () => {
  getReceiptList()
  getReturnList()
  const vRes = await vendorApi.all()
  vendorOptions.value = vRes.data || []
  const oRes = await purchaseOrderApi.list({ pageNum: 1, pageSize: 200 })
  allOrders.value = oRes.data?.records || []
})
</script>

<style scoped>
.supply-receipt {
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
