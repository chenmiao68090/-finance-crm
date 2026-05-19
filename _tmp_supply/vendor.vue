<template>
  <div class="supply-vendor">
    <!-- Search Bar -->
    <el-card shadow="never" class="search-card">
      <el-form :model="queryParams" inline>
        <el-form-item :label="$t('supply.vendor.name')">
          <el-input v-model="queryParams.name" :placeholder="$t('common.pleaseInput')" clearable />
        </el-form-item>
        <el-form-item :label="$t('supply.vendor.rating')">
          <el-select v-model="queryParams.rating" :placeholder="$t('common.pleaseSelect')" clearable>
            <el-option v-for="i in 5" :key="i" :label="i + $t('supply.vendor.star')" :value="i" />
          </el-select>
        </el-form-item>
        <el-form-item :label="$t('supply.vendor.status')">
          <el-select v-model="queryParams.status" :placeholder="$t('common.pleaseSelect')" clearable>
            <el-option :label="$t('supply.vendor.statusNormal')" :value="0" />
            <el-option :label="$t('supply.vendor.statusDisabled')" :value="1" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleSearch">{{ $t('common.search') }}</el-button>
          <el-button @click="handleReset">{{ $t('common.reset') }}</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <!-- Table -->
    <el-card shadow="never" class="table-card">
      <template #header>
        <div class="card-header">
          <span>{{ $t('supply.vendor.title') }}</span>
          <el-button type="primary" @click="handleAdd">{{ $t('common.add') }}</el-button>
        </div>
      </template>

      <el-table :data="tableData" v-loading="loading" border stripe>
        <el-table-column prop="name" :label="$t('supply.vendor.name')" min-width="150" show-overflow-tooltip />
        <el-table-column prop="code" :label="$t('supply.vendor.code')" width="120" />
        <el-table-column prop="contactName" :label="$t('supply.vendor.contactName')" width="100" />
        <el-table-column prop="contactPhone" :label="$t('supply.vendor.contactPhone')" width="130" />
        <el-table-column prop="rating" :label="$t('supply.vendor.rating')" width="160">
          <template #default="{ row }">
            <el-rate v-model="row.rating" disabled />
          </template>
        </el-table-column>
        <el-table-column prop="status" :label="$t('supply.vendor.status')" width="90">
          <template #default="{ row }">
            <el-tag :type="row.status === 0 ? 'success' : 'danger'">
              {{ row.status === 0 ? $t('supply.vendor.statusNormal') : $t('supply.vendor.statusDisabled') }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="cooperationStart" :label="$t('supply.vendor.cooperationStart')" width="120" />
        <el-table-column :label="$t('common.operation')" width="200" fixed="right">
          <template #default="{ row }">
            <el-button link type="primary" @click="handleDetail(row)">{{ $t('supply.vendor.detail') }}</el-button>
            <el-button link type="primary" @click="handleEdit(row)">{{ $t('common.edit') }}</el-button>
            <el-button link type="danger" @click="handleDelete(row)">{{ $t('common.delete') }}</el-button>
          </template>
        </el-table-column>
      </el-table>

      <el-pagination
        v-model:current-page="queryParams.pageNum"
        v-model:page-size="queryParams.pageSize"
        :total="total"
        :page-sizes="[10, 20, 50, 100]"
        layout="total, sizes, prev, pager, next, jumper"
        @size-change="getList"
        @current-change="getList"
        class="pagination"
      />
    </el-card>

    <!-- Add/Edit Dialog -->
    <el-dialog v-model="dialogVisible" :title="dialogTitle" width="700px" destroy-on-close>
      <el-form :model="form" :rules="rules" ref="formRef" label-width="100px">
        <el-divider content-position="left">{{ $t('supply.vendor.basicInfo') }}</el-divider>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item :label="$t('supply.vendor.name')" prop="name">
              <el-input v-model="form.name" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item :label="$t('supply.vendor.code')" prop="code">
              <el-input v-model="form.code" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item :label="$t('supply.vendor.contactName')">
              <el-input v-model="form.contactName" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item :label="$t('supply.vendor.contactPhone')">
              <el-input v-model="form.contactPhone" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item :label="$t('supply.vendor.email')">
              <el-input v-model="form.email" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item :label="$t('supply.vendor.cooperationStart')">
              <el-date-picker v-model="form.cooperationStart" type="date" value-format="YYYY-MM-DD" style="width:100%" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-form-item :label="$t('supply.vendor.address')">
          <el-input v-model="form.address" />
        </el-form-item>

        <el-divider content-position="left">{{ $t('supply.vendor.bankInfo') }}</el-divider>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item :label="$t('supply.vendor.bankName')">
              <el-input v-model="form.bankName" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item :label="$t('supply.vendor.bankAccount')">
              <el-input v-model="form.bankAccount" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item :label="$t('supply.vendor.rating')">
              <el-rate v-model="form.rating" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item :label="$t('supply.vendor.status')">
              <el-select v-model="form.status" style="width:100%">
                <el-option :label="$t('supply.vendor.statusNormal')" :value="0" />
                <el-option :label="$t('supply.vendor.statusDisabled')" :value="1" />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">{{ $t('common.cancel') }}</el-button>
        <el-button type="primary" @click="handleSubmit" :loading="submitLoading">{{ $t('common.confirm') }}</el-button>
      </template>
    </el-dialog>

    <!-- Detail Drawer -->
    <el-drawer v-model="drawerVisible" :title="$t('supply.vendor.detail')" size="500px">
      <template v-if="detailData.vendor">
        <el-descriptions :column="1" border>
          <el-descriptions-item :label="$t('supply.vendor.name')">{{ detailData.vendor.name }}</el-descriptions-item>
          <el-descriptions-item :label="$t('supply.vendor.code')">{{ detailData.vendor.code }}</el-descriptions-item>
          <el-descriptions-item :label="$t('supply.vendor.contactName')">{{ detailData.vendor.contactName }}</el-descriptions-item>
          <el-descriptions-item :label="$t('supply.vendor.contactPhone')">{{ detailData.vendor.contactPhone }}</el-descriptions-item>
          <el-descriptions-item :label="$t('supply.vendor.email')">{{ detailData.vendor.email }}</el-descriptions-item>
          <el-descriptions-item :label="$t('supply.vendor.address')">{{ detailData.vendor.address }}</el-descriptions-item>
          <el-descriptions-item :label="$t('supply.vendor.bankName')">{{ detailData.vendor.bankName }}</el-descriptions-item>
          <el-descriptions-item :label="$t('supply.vendor.bankAccount')">{{ detailData.vendor.bankAccount }}</el-descriptions-item>
          <el-descriptions-item :label="$t('supply.vendor.rating')">
            <el-rate :model-value="detailData.vendor.rating" disabled />
          </el-descriptions-item>
          <el-descriptions-item :label="$t('supply.vendor.cooperationStart')">{{ detailData.vendor.cooperationStart }}</el-descriptions-item>
        </el-descriptions>

        <el-divider>{{ $t('supply.vendor.purchaseHistory') }}</el-divider>
        <el-table :data="detailData.orders || []" border size="small" max-height="300">
          <el-table-column prop="orderNo" :label="$t('supply.order.orderNo')" width="160" />
          <el-table-column prop="totalAmount" :label="$t('supply.order.totalAmount')" width="120" align="right">
            <template #default="{ row }">{{ formatAmount(row.totalAmount) }}</template>
          </el-table-column>
          <el-table-column prop="status" :label="$t('supply.order.status')" width="100">
            <template #default="{ row }">
              <el-tag :type="orderStatusType(row.status)" size="small">{{ orderStatusLabel(row.status) }}</el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="createTime" :label="$t('supply.order.createTime')" />
        </el-table>
      </template>
    </el-drawer>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { ElMessage, ElMessageBox } from 'element-plus'
import { vendorApi } from '@/api/supply'

const { t } = useI18n()

const loading = ref(false)
const submitLoading = ref(false)
const tableData = ref<any[]>([])
const total = ref(0)
const dialogVisible = ref(false)
const dialogTitle = ref('')
const drawerVisible = ref(false)
const formRef = ref()
const detailData = ref<any>({})

const queryParams = reactive({
  pageNum: 1,
  pageSize: 10,
  name: '',
  rating: undefined as number | undefined,
  status: undefined as number | undefined
})

const form = reactive({
  id: undefined as number | undefined,
  name: '',
  code: '',
  contactName: '',
  contactPhone: '',
  email: '',
  address: '',
  bankName: '',
  bankAccount: '',
  rating: 3,
  status: 0,
  cooperationStart: ''
})

const rules = {
  name: [{ required: true, message: () => t('supply.vendor.nameRequired'), trigger: 'blur' }],
  code: [{ required: true, message: () => t('supply.vendor.codeRequired'), trigger: 'blur' }]
}

function formatAmount(val: number) {
  return val != null ? Number(val).toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',') : '0.00'
}

function orderStatusLabel(status: number) {
  const map: Record<number, string> = {
    0: t('supply.order.statusPending'),
    1: t('supply.order.statusConfirmed'),
    2: t('supply.order.statusProduction'),
    3: t('supply.order.statusShipped'),
    4: t('supply.order.statusArrived'),
    5: t('supply.order.statusInspected')
  }
  return map[status] || ''
}

function orderStatusType(status: number) {
  const map: Record<number, string> = { 0: 'info', 1: 'warning', 2: '', 3: '', 4: 'success', 5: 'success' }
  return map[status] || 'info'
}

async function getList() {
  loading.value = true
  try {
    const res = await vendorApi.list(queryParams)
    tableData.value = res.data?.records || []
    total.value = res.data?.total || 0
  } finally {
    loading.value = false
  }
}

function handleSearch() {
  queryParams.pageNum = 1
  getList()
}

function handleReset() {
  queryParams.name = ''
  queryParams.rating = undefined
  queryParams.status = undefined
  handleSearch()
}

function handleAdd() {
  dialogTitle.value = t('common.add')
  Object.assign(form, { id: undefined, name: '', code: '', contactName: '', contactPhone: '', email: '', address: '', bankName: '', bankAccount: '', rating: 3, status: 0, cooperationStart: '' })
  dialogVisible.value = true
}

function handleEdit(row: any) {
  dialogTitle.value = t('common.edit')
  Object.assign(form, { ...row })
  dialogVisible.value = true
}

async function handleDetail(row: any) {
  const res = await vendorApi.detail(row.id)
  detailData.value = res.data || {}
  drawerVisible.value = true
}

async function handleSubmit() {
  await formRef.value?.validate()
  submitLoading.value = true
  try {
    if (form.id) {
      await vendorApi.update(form)
    } else {
      await vendorApi.add(form)
    }
    ElMessage.success(t('common.success'))
    dialogVisible.value = false
    getList()
  } finally {
    submitLoading.value = false
  }
}

async function handleDelete(row: any) {
  await ElMessageBox.confirm(t('supply.vendor.confirmDelete'), t('common.confirm'))
  await vendorApi.remove(row.id)
  ElMessage.success(t('common.success'))
  getList()
}

onMounted(() => {
  getList()
})
</script>

<style scoped>
.supply-vendor {
  padding: 16px;
}
.search-card {
  margin-bottom: 16px;
}
.table-card .card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.pagination {
  margin-top: 16px;
  justify-content: flex-end;
}
</style>
