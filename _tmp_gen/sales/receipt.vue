<template>
  <div class="page-container receipt-page">
    <!-- 顶部统计卡片 -->
    <div class="stats-cards">
      <div class="stat-card">
        <div class="stat-label">{{ $t('sales.receipt.monthlyDue') }}</div>
        <div class="stat-value">¥{{ stats.totalDue?.toLocaleString() || '0' }}</div>
      </div>
      <div class="stat-card">
        <div class="stat-label">{{ $t('sales.receipt.monthlyReceived') }}</div>
        <div class="stat-value success">¥{{ stats.totalReceived?.toLocaleString() || '0' }}</div>
      </div>
      <div class="stat-card">
        <div class="stat-label">{{ $t('sales.receipt.overdueAmount') }}</div>
        <div class="stat-value danger">¥{{ stats.overdueAmount?.toLocaleString() || '0' }}</div>
      </div>
      <div class="stat-card chart-card">
        <div class="stat-label">{{ $t('sales.receipt.receiptRate') }}</div>
        <div ref="chartRef" class="rate-chart"></div>
      </div>
    </div>

    <!-- 搜索栏 -->
    <div class="search-bar">
      <el-form :model="queryParams" inline>
        <el-form-item :label="$t('sales.receipt.customer')">
          <el-input v-model="queryParams.customerName" :placeholder="$t('sales.receipt.customer')" clearable />
        </el-form-item>
        <el-form-item :label="$t('sales.receipt.status')">
          <el-select v-model="queryParams.status" :placeholder="$t('sales.receipt.status')" clearable>
            <el-option :label="$t('sales.receipt.statusOptions.pending')" :value="0" />
            <el-option :label="$t('sales.receipt.statusOptions.partial')" :value="1" />
            <el-option :label="$t('sales.receipt.statusOptions.completed')" :value="2" />
            <el-option :label="$t('sales.receipt.statusOptions.overdue')" :value="3" />
          </el-select>
        </el-form-item>
        <el-form-item :label="$t('sales.receipt.receiptDate')">
          <el-date-picker v-model="dateRange" type="daterange" value-format="YYYY-MM-DD" range-separator="-" />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="loadData">{{ $t('common.search') }}</el-button>
          <el-button @click="resetQuery">{{ $t('common.reset') }}</el-button>
        </el-form-item>
      </el-form>
      <el-button type="primary" @click="handleAdd">{{ $t('common.add') }}</el-button>
    </div>

    <!-- 表格 -->
    <el-table :data="tableData" v-loading="loading" stripe :row-class-name="rowClassName">
      <el-table-column prop="customerName" :label="$t('sales.receipt.customer')" min-width="140" />
      <el-table-column prop="orderNo" :label="$t('sales.receipt.order')" width="140" />
      <el-table-column prop="amount" :label="$t('sales.receipt.amount')" width="130">
        <template #default="{ row }">¥{{ row.amount?.toLocaleString() }}</template>
      </el-table-column>
      <el-table-column prop="receivedAmount" :label="$t('sales.receipt.receivedAmount')" width="130">
        <template #default="{ row }">¥{{ row.receivedAmount?.toLocaleString() || '0' }}</template>
      </el-table-column>
      <el-table-column prop="dueDate" :label="$t('sales.receipt.dueDate')" width="120" />
      <el-table-column prop="receiptDate" :label="$t('sales.receipt.receiptDate')" width="120" />
      <el-table-column prop="paymentMethod" :label="$t('sales.receipt.paymentMethod')" width="110">
        <template #default="{ row }">{{ paymentLabel(row.paymentMethod) }}</template>
      </el-table-column>
      <el-table-column prop="status" :label="$t('sales.receipt.status')" width="100">
        <template #default="{ row }">
          <el-tag :type="statusTagType(row.status)" size="small">{{ statusLabel(row.status) }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column :label="$t('common.edit')" width="160" fixed="right">
        <template #default="{ row }">
          <el-button link type="primary" size="small" @click="handleEdit(row)">{{ $t('common.edit') }}</el-button>
          <el-button link type="danger" size="small" @click="handleDelete(row)">{{ $t('common.delete') }}</el-button>
        </template>
      </el-table-column>
    </el-table>

    <!-- 分页 -->
    <div class="pagination-wrapper">
      <el-pagination
        v-model:current-page="queryParams.pageNum"
        v-model:page-size="queryParams.pageSize"
        :total="total"
        :page-sizes="[10, 20, 50]"
        layout="total, sizes, prev, pager, next, jumper"
        @size-change="loadData"
        @current-change="loadData"
      />
    </div>

    <!-- 新增/编辑弹窗 -->
    <el-dialog v-model="dialogVisible" :title="isEdit ? $t('common.edit') : $t('common.add')" width="600px" destroy-on-close>
      <el-form ref="formRef" :model="formData" :rules="rules" label-width="100px">
        <el-form-item :label="$t('sales.receipt.customer')" prop="customerName">
          <el-input v-model="formData.customerName" />
        </el-form-item>
        <el-form-item :label="$t('sales.receipt.order')">
          <el-input v-model="formData.orderNo" />
        </el-form-item>
        <el-row :gutter="16">
          <el-col :span="12">
            <el-form-item :label="$t('sales.receipt.amount')" prop="amount">
              <el-input-number v-model="formData.amount" :min="0" :precision="2" controls-position="right" style="width: 100%" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item :label="$t('sales.receipt.receivedAmount')">
              <el-input-number v-model="formData.receivedAmount" :min="0" :precision="2" controls-position="right" style="width: 100%" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="16">
          <el-col :span="12">
            <el-form-item :label="$t('sales.receipt.dueDate')">
              <el-date-picker v-model="formData.dueDate" type="date" value-format="YYYY-MM-DD" style="width: 100%" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item :label="$t('sales.receipt.receiptDate')">
              <el-date-picker v-model="formData.receiptDate" type="date" value-format="YYYY-MM-DD" style="width: 100%" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-form-item :label="$t('sales.receipt.paymentMethod')">
          <el-select v-model="formData.paymentMethod" style="width: 100%">
            <el-option :label="$t('sales.receipt.paymentOptions.transfer')" :value="1" />
            <el-option :label="$t('sales.receipt.paymentOptions.check')" :value="2" />
            <el-option :label="$t('sales.receipt.paymentOptions.cash')" :value="3" />
            <el-option :label="$t('sales.receipt.paymentOptions.other')" :value="4" />
          </el-select>
        </el-form-item>
        <el-form-item :label="$t('sales.receipt.status')">
          <el-select v-model="formData.status" style="width: 100%">
            <el-option :label="$t('sales.receipt.statusOptions.pending')" :value="0" />
            <el-option :label="$t('sales.receipt.statusOptions.partial')" :value="1" />
            <el-option :label="$t('sales.receipt.statusOptions.completed')" :value="2" />
            <el-option :label="$t('sales.receipt.statusOptions.overdue')" :value="3" />
          </el-select>
        </el-form-item>
        <el-form-item :label="$t('sales.receipt.remark')">
          <el-input v-model="formData.remark" type="textarea" :rows="2" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">{{ $t('common.cancel') }}</el-button>
        <el-button type="primary" @click="submitForm">{{ $t('common.confirm') }}</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, nextTick, watch } from 'vue'
import { ElMessage, ElMessageBox, type FormInstance } from 'element-plus'
import { useI18n } from 'vue-i18n'
import { receiptApi } from '@/api/sales'
import * as echarts from 'echarts'

const { t } = useI18n()
const loading = ref(false)
const tableData = ref<any[]>([])
const total = ref(0)
const dialogVisible = ref(false)
const isEdit = ref(false)
const formRef = ref<FormInstance>()
const chartRef = ref<HTMLElement>()
const dateRange = ref<string[]>([])
let chartInstance: echarts.ECharts | null = null

const stats = ref<any>({ totalDue: 0, totalReceived: 0, overdueAmount: 0, receiptRate: 0 })

const queryParams = reactive({
  pageNum: 1, pageSize: 10, customerName: '', status: undefined as number | undefined, startDate: '', endDate: ''
})

const formData = ref<any>({
  id: undefined, customerName: '', orderNo: '', amount: 0, receivedAmount: 0,
  dueDate: '', receiptDate: '', paymentMethod: 1, status: 0, remark: ''
})

const rules = {
  customerName: [{ required: true, message: t('sales.receipt.customer'), trigger: 'blur' }],
  amount: [{ required: true, message: t('sales.receipt.amount'), trigger: 'blur' }]
}

const statusTagType = (val: number) => {
  const map: Record<number, string> = { 0: 'info', 1: 'warning', 2: 'success', 3: 'danger' }
  return map[val] || ''
}

const statusLabel = (val: number) => {
  const map: Record<number, string> = {
    0: t('sales.receipt.statusOptions.pending'),
    1: t('sales.receipt.statusOptions.partial'),
    2: t('sales.receipt.statusOptions.completed'),
    3: t('sales.receipt.statusOptions.overdue')
  }
  return map[val] || '-'
}

const paymentLabel = (val: number) => {
  const map: Record<number, string> = {
    1: t('sales.receipt.paymentOptions.transfer'),
    2: t('sales.receipt.paymentOptions.check'),
    3: t('sales.receipt.paymentOptions.cash'),
    4: t('sales.receipt.paymentOptions.other')
  }
  return map[val] || '-'
}

const rowClassName = ({ row }: any) => {
  if (row.status === 3 || (row.dueDate && new Date(row.dueDate) < new Date() && row.status !== 2)) {
    return 'overdue-row'
  }
  return ''
}

const initChart = (rate: number) => {
  if (!chartRef.value) return
  if (!chartInstance) {
    chartInstance = echarts.init(chartRef.value)
  }
  chartInstance.setOption({
    series: [{
      type: 'gauge',
      startAngle: 90,
      endAngle: -270,
      radius: '90%',
      pointer: { show: false },
      progress: { show: true, overlap: false, roundCap: true, width: 12, itemStyle: { color: '#F26522' } },
      axisLine: { lineStyle: { width: 12, color: [[1, '#e6e6e6']] } },
      axisTick: { show: false },
      splitLine: { show: false },
      axisLabel: { show: false },
      detail: { fontSize: 16, fontWeight: 'bold', color: '#F26522', offsetCenter: [0, 0], formatter: '{value}%' },
      data: [{ value: rate }]
    }]
  })
}

watch(dateRange, (val) => {
  queryParams.startDate = val?.[0] || ''
  queryParams.endDate = val?.[1] || ''
})

const loadStats = async () => {
  try {
    const res = await receiptApi.stats()
    stats.value = res.data || { totalDue: 0, totalReceived: 0, overdueAmount: 0, receiptRate: 0 }
    nextTick(() => initChart(Number(stats.value.receiptRate) || 0))
  } catch { /* silent */ }
}

const loadData = async () => {
  loading.value = true
  try {
    const res = await receiptApi.list(queryParams)
    tableData.value = res.data?.records || []
    total.value = res.data?.total || 0
  } finally {
    loading.value = false
  }
}

const resetQuery = () => {
  queryParams.customerName = ''; queryParams.status = undefined; queryParams.startDate = ''; queryParams.endDate = ''
  dateRange.value = []; queryParams.pageNum = 1
  loadData()
}

const handleAdd = () => {
  isEdit.value = false
  formData.value = { id: undefined, customerName: '', orderNo: '', amount: 0, receivedAmount: 0, dueDate: '', receiptDate: '', paymentMethod: 1, status: 0, remark: '' }
  dialogVisible.value = true
}

const handleEdit = (row: any) => {
  isEdit.value = true
  formData.value = { ...row }
  dialogVisible.value = true
}

const submitForm = async () => {
  await formRef.value?.validate()
  if (isEdit.value) { await receiptApi.update(formData.value) } else { await receiptApi.create(formData.value) }
  ElMessage.success(t('common.success'))
  dialogVisible.value = false
  loadData()
  loadStats()
}

const handleDelete = (row: any) => {
  ElMessageBox.confirm(t('common.confirm') + '?', '', { type: 'warning' }).then(async () => {
    await receiptApi.remove(row.id)
    ElMessage.success(t('common.success'))
    loadData()
    loadStats()
  })
}

onMounted(() => {
  loadData()
  loadStats()
})
</script>

<style scoped>
.receipt-page { padding: 20px; }
.stats-cards { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; margin-bottom: 20px; }
.stat-card { background: #fff; border-radius: 8px; padding: 20px; box-shadow: 0 2px 8px rgba(0,0,0,0.06); }
.stat-label { font-size: 14px; color: #666; margin-bottom: 8px; }
.stat-value { font-size: 24px; font-weight: bold; color: #333; }
.stat-value.success { color: #67c23a; }
.stat-value.danger { color: #f56c6c; }
.chart-card { display: flex; flex-direction: column; }
.rate-chart { width: 100%; height: 80px; }
.search-bar { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 16px; }
.pagination-wrapper { display: flex; justify-content: flex-end; margin-top: 16px; }
:deep(.overdue-row) { background-color: #fef0f0 !important; }
:deep(.overdue-row td) { color: #f56c6c; }
</style>
