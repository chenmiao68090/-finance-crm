$uiBase = "d:\zhehang-erp\zhehang-erp-ui\src"

$content = @'
<template>
  <div class="hrm-salary">
    <!-- Search -->
    <el-card shadow="never" class="search-card">
      <el-form :model="queryParams" inline>
        <el-form-item :label="$t('hrm.salary.salaryMonth')">
          <el-date-picker v-model="queryParams.salaryMonth" type="month" value-format="YYYY-MM" style="width:160px" />
        </el-form-item>
        <el-form-item :label="$t('hrm.salary.status')">
          <el-select v-model="queryParams.status" clearable>
            <el-option :label="$t('hrm.salary.statusPending')" :value="0" />
            <el-option :label="$t('hrm.salary.statusCalculated')" :value="1" />
            <el-option :label="$t('hrm.salary.statusPaid')" :value="2" />
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
          <span>{{ $t('hrm.salary.title') }}</span>
          <div>
            <el-button type="warning" @click="handleCalculate">{{ $t('hrm.salary.batchCalculate') }}</el-button>
            <el-button type="success" @click="handlePay">{{ $t('hrm.salary.batchPay') }}</el-button>
            <el-button type="primary" @click="handleAdd">{{ $t('common.add') }}</el-button>
          </div>
        </div>
      </template>

      <el-table :data="tableData" v-loading="loading" border stripe show-summary :summary-method="getSummaries">
        <el-table-column prop="employeeId" :label="$t('hrm.salary.employee')" width="100" />
        <el-table-column prop="salaryMonth" :label="$t('hrm.salary.salaryMonth')" width="100" />
        <el-table-column prop="baseSalary" :label="$t('hrm.salary.baseSalary')" width="110" align="right">
          <template #default="{ row }">{{ formatAmount(row.baseSalary) }}</template>
        </el-table-column>
        <el-table-column prop="performanceBonus" :label="$t('hrm.salary.performanceBonus')" width="110" align="right">
          <template #default="{ row }">{{ formatAmount(row.performanceBonus) }}</template>
        </el-table-column>
        <el-table-column prop="overtimePay" :label="$t('hrm.salary.overtimePay')" width="90" align="right">
          <template #default="{ row }">{{ formatAmount(row.overtimePay) }}</template>
        </el-table-column>
        <el-table-column prop="allowance" :label="$t('hrm.salary.allowance')" width="80" align="right">
          <template #default="{ row }">{{ formatAmount(row.allowance) }}</template>
        </el-table-column>
        <el-table-column prop="deduction" :label="$t('hrm.salary.deduction')" width="80" align="right">
          <template #default="{ row }"><span class="deduct">-{{ formatAmount(row.deduction) }}</span></template>
        </el-table-column>
        <el-table-column prop="socialInsurance" :label="$t('hrm.salary.socialInsurance')" width="80" align="right">
          <template #default="{ row }"><span class="deduct">-{{ formatAmount(row.socialInsurance) }}</span></template>
        </el-table-column>
        <el-table-column prop="housingFund" :label="$t('hrm.salary.housingFund')" width="80" align="right">
          <template #default="{ row }"><span class="deduct">-{{ formatAmount(row.housingFund) }}</span></template>
        </el-table-column>
        <el-table-column prop="tax" :label="$t('hrm.salary.tax')" width="80" align="right">
          <template #default="{ row }"><span class="deduct">-{{ formatAmount(row.tax) }}</span></template>
        </el-table-column>
        <el-table-column prop="actualSalary" :label="$t('hrm.salary.actualSalary')" width="120" align="right">
          <template #default="{ row }"><span class="actual">{{ formatAmount(row.actualSalary) }}</span></template>
        </el-table-column>
        <el-table-column :label="$t('hrm.salary.status')" width="90">
          <template #default="{ row }">
            <el-tag :type="salaryStatusType(row.status)">{{ salaryStatusLabel(row.status) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column :label="$t('common.operation')" width="120" fixed="right">
          <template #default="{ row }">
            <el-button link type="primary" @click="handleViewSlip(row)">{{ $t('hrm.salary.paySlip') }}</el-button>
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

    <!-- Pay Slip Dialog -->
    <el-dialog v-model="slipDialogVisible" :title="$t('hrm.salary.paySlip')" width="500px">
      <div class="pay-slip" v-if="slipData">
        <div class="slip-header">{{ slipData.salary?.salaryMonth }} {{ $t('hrm.salary.paySlip') }}</div>
        <el-descriptions :column="1" border size="small">
          <el-descriptions-item :label="$t('hrm.salary.baseSalary')">{{ formatAmount(slipData.salary?.baseSalary) }}</el-descriptions-item>
          <el-descriptions-item :label="$t('hrm.salary.performanceBonus')">{{ formatAmount(slipData.salary?.performanceBonus) }}</el-descriptions-item>
          <el-descriptions-item :label="$t('hrm.salary.overtimePay')">{{ formatAmount(slipData.salary?.overtimePay) }}</el-descriptions-item>
          <el-descriptions-item :label="$t('hrm.salary.allowance')">{{ formatAmount(slipData.salary?.allowance) }}</el-descriptions-item>
          <el-descriptions-item :label="$t('hrm.salary.income')"><span class="income-text">{{ formatAmount(slipData.income) }}</span></el-descriptions-item>
          <el-descriptions-item :label="$t('hrm.salary.deduction')">-{{ formatAmount(slipData.salary?.deduction) }}</el-descriptions-item>
          <el-descriptions-item :label="$t('hrm.salary.socialInsurance')">-{{ formatAmount(slipData.salary?.socialInsurance) }}</el-descriptions-item>
          <el-descriptions-item :label="$t('hrm.salary.housingFund')">-{{ formatAmount(slipData.salary?.housingFund) }}</el-descriptions-item>
          <el-descriptions-item :label="$t('hrm.salary.tax')">-{{ formatAmount(slipData.salary?.tax) }}</el-descriptions-item>
          <el-descriptions-item :label="$t('hrm.salary.deductions')"><span class="deduct-text">{{ formatAmount(slipData.deductions) }}</span></el-descriptions-item>
        </el-descriptions>
        <div class="slip-footer">
          <span>{{ $t('hrm.salary.actualSalary') }}</span>
          <span class="slip-actual">{{ formatAmount(slipData.salary?.actualSalary) }}</span>
        </div>
      </div>
    </el-dialog>

    <!-- Add Dialog -->
    <el-dialog v-model="addDialogVisible" :title="$t('common.add')" width="600px" destroy-on-close>
      <el-form :model="form" ref="formRef" label-width="90px">
        <el-row :gutter="16">
          <el-col :span="12">
            <el-form-item :label="$t('hrm.salary.employee')" prop="employeeId">
              <el-input-number v-model="form.employeeId" :min="1" controls-position="right" style="width:100%" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item :label="$t('hrm.salary.salaryMonth')" prop="salaryMonth">
              <el-date-picker v-model="form.salaryMonth" type="month" value-format="YYYY-MM" style="width:100%" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="16">
          <el-col :span="12"><el-form-item :label="$t('hrm.salary.baseSalary')"><el-input-number v-model="form.baseSalary" :min="0" :precision="2" controls-position="right" style="width:100%" /></el-form-item></el-col>
          <el-col :span="12"><el-form-item :label="$t('hrm.salary.performanceBonus')"><el-input-number v-model="form.performanceBonus" :min="0" :precision="2" controls-position="right" style="width:100%" /></el-form-item></el-col>
        </el-row>
        <el-row :gutter="16">
          <el-col :span="12"><el-form-item :label="$t('hrm.salary.overtimePay')"><el-input-number v-model="form.overtimePay" :min="0" :precision="2" controls-position="right" style="width:100%" /></el-form-item></el-col>
          <el-col :span="12"><el-form-item :label="$t('hrm.salary.allowance')"><el-input-number v-model="form.allowance" :min="0" :precision="2" controls-position="right" style="width:100%" /></el-form-item></el-col>
        </el-row>
        <el-row :gutter="16">
          <el-col :span="12"><el-form-item :label="$t('hrm.salary.deduction')"><el-input-number v-model="form.deduction" :min="0" :precision="2" controls-position="right" style="width:100%" /></el-form-item></el-col>
          <el-col :span="12"><el-form-item :label="$t('hrm.salary.socialInsurance')"><el-input-number v-model="form.socialInsurance" :min="0" :precision="2" controls-position="right" style="width:100%" /></el-form-item></el-col>
        </el-row>
        <el-row :gutter="16">
          <el-col :span="12"><el-form-item :label="$t('hrm.salary.housingFund')"><el-input-number v-model="form.housingFund" :min="0" :precision="2" controls-position="right" style="width:100%" /></el-form-item></el-col>
          <el-col :span="12"><el-form-item :label="$t('hrm.salary.tax')"><el-input-number v-model="form.tax" :min="0" :precision="2" controls-position="right" style="width:100%" /></el-form-item></el-col>
        </el-row>
      </el-form>
      <template #footer>
        <el-button @click="addDialogVisible = false">{{ $t('common.cancel') }}</el-button>
        <el-button type="primary" @click="handleSubmit">{{ $t('common.confirm') }}</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { ElMessage, ElMessageBox } from 'element-plus'
import { salaryApi } from '@/api/hrm'

const { t } = useI18n()
const loading = ref(false)
const tableData = ref<any[]>([])
const total = ref(0)
const slipDialogVisible = ref(false)
const addDialogVisible = ref(false)
const slipData = ref<any>(null)
const formRef = ref()

const now = new Date()
const queryParams = reactive({
  pageNum: 1, pageSize: 20,
  salaryMonth: `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`,
  status: undefined as number | undefined
})

const form = reactive({
  employeeId: undefined as number | undefined,
  salaryMonth: queryParams.salaryMonth,
  baseSalary: 0, performanceBonus: 0, overtimePay: 0, allowance: 0,
  deduction: 0, socialInsurance: 0, housingFund: 0, tax: 0
})

function salaryStatusLabel(status: number) {
  const map: Record<number, string> = { 0: t('hrm.salary.statusPending'), 1: t('hrm.salary.statusCalculated'), 2: t('hrm.salary.statusPaid') }
  return map[status] || ''
}

function salaryStatusType(status: number) {
  const map: Record<number, string> = { 0: 'info', 1: 'warning', 2: 'success' }
  return map[status] || 'info'
}

function formatAmount(val: any) {
  if (val == null) return '0.00'
  return Number(val).toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',')
}

function getSummaries({ columns, data }: any) {
  const sums: string[] = []
  columns.forEach((col: any, idx: number) => {
    if (idx === 0) { sums[idx] = t('common.total'); return }
    const prop = col.property
    const numFields = ['baseSalary', 'performanceBonus', 'overtimePay', 'allowance', 'deduction', 'socialInsurance', 'housingFund', 'tax', 'actualSalary']
    if (numFields.includes(prop)) {
      const sum = data.reduce((s: number, r: any) => s + (Number(r[prop]) || 0), 0)
      sums[idx] = formatAmount(sum)
    } else { sums[idx] = '' }
  })
  return sums
}

async function getList() {
  loading.value = true
  try {
    const res = await salaryApi.list(queryParams)
    tableData.value = res.data?.records || []
    total.value = res.data?.total || 0
  } finally { loading.value = false }
}

function handleSearch() { queryParams.pageNum = 1; getList() }
function handleReset() { queryParams.status = undefined; handleSearch() }

async function handleCalculate() {
  await ElMessageBox.confirm(t('hrm.salary.confirmCalculate'), t('common.confirm'))
  await salaryApi.calculate(queryParams.salaryMonth)
  ElMessage.success(t('common.success'))
  getList()
}

async function handlePay() {
  await ElMessageBox.confirm(t('hrm.salary.confirmPay'), t('common.confirm'))
  await salaryApi.pay(queryParams.salaryMonth)
  ElMessage.success(t('common.success'))
  getList()
}

async function handleViewSlip(row: any) {
  const res = await salaryApi.slip(row.id)
  slipData.value = res.data
  slipDialogVisible.value = true
}

function handleAdd() {
  Object.assign(form, { employeeId: undefined, salaryMonth: queryParams.salaryMonth, baseSalary: 0, performanceBonus: 0, overtimePay: 0, allowance: 0, deduction: 0, socialInsurance: 0, housingFund: 0, tax: 0 })
  addDialogVisible.value = true
}

async function handleSubmit() {
  await salaryApi.create(form)
  ElMessage.success(t('common.success'))
  addDialogVisible.value = false
  getList()
}

onMounted(() => { getList() })
</script>

<style scoped>
.hrm-salary { padding: 16px; }
.search-card { margin-bottom: 16px; }
.table-card .card-header { display: flex; justify-content: space-between; align-items: center; }
.pagination { margin-top: 16px; justify-content: flex-end; }
.deduct { color: #f56c6c; }
.actual { color: #F26522; font-weight: bold; font-size: 15px; }
.pay-slip { padding: 0 16px; }
.slip-header { text-align: center; font-size: 18px; font-weight: bold; margin-bottom: 16px; color: #303133; }
.income-text { color: #67c23a; font-weight: bold; }
.deduct-text { color: #f56c6c; font-weight: bold; }
.slip-footer { display: flex; justify-content: space-between; align-items: center; margin-top: 16px; padding: 12px 16px; background: linear-gradient(135deg, #fff7f0, #fff); border-radius: 8px; border: 1px solid #F26522; }
.slip-actual { font-size: 24px; font-weight: bold; color: #F26522; }
</style>
'@

[IO.File]::WriteAllText("$uiBase\views\hrm\salary.vue", $content, [System.Text.Encoding]::UTF8)
Write-Host "salary.vue generated!"
