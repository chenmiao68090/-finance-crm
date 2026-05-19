$uiBase = "d:\zhehang-erp\zhehang-erp-ui\src"

$content = @'
<template>
  <div class="hrm-performance">
    <!-- Tabs for period type -->
    <el-card shadow="never" class="search-card">
      <el-form :model="queryParams" inline>
        <el-form-item :label="$t('hrm.performance.type')">
          <el-radio-group v-model="queryParams.type" @change="handleSearch">
            <el-radio-button :value="1">{{ $t('hrm.performance.typeMonthly') }}</el-radio-button>
            <el-radio-button :value="2">{{ $t('hrm.performance.typeQuarterly') }}</el-radio-button>
            <el-radio-button :value="3">{{ $t('hrm.performance.typeAnnual') }}</el-radio-button>
          </el-radio-group>
        </el-form-item>
        <el-form-item :label="$t('hrm.performance.period')">
          <el-input v-model="queryParams.period" clearable placeholder="e.g. 2026-Q1" style="width:140px" />
        </el-form-item>
        <el-form-item :label="$t('hrm.performance.status')">
          <el-select v-model="queryParams.status" clearable>
            <el-option :label="$t('hrm.performance.statusPending')" :value="0" />
            <el-option :label="$t('hrm.performance.statusSelfDone')" :value="1" />
            <el-option :label="$t('hrm.performance.statusCompleted')" :value="2" />
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
          <span>{{ $t('hrm.performance.title') }}</span>
          <el-button type="primary" @click="handleAdd">{{ $t('common.add') }}</el-button>
        </div>
      </template>

      <el-table :data="tableData" v-loading="loading" border stripe>
        <el-table-column prop="employeeId" :label="$t('hrm.performance.employee')" width="100" />
        <el-table-column prop="period" :label="$t('hrm.performance.period')" width="120" />
        <el-table-column :label="$t('hrm.performance.type')" width="100">
          <template #default="{ row }">{{ typeLabel(row.type) }}</template>
        </el-table-column>
        <el-table-column prop="score" :label="$t('hrm.performance.score')" width="100" align="center">
          <template #default="{ row }">
            <span class="score" v-if="row.score">{{ row.score }}</span>
            <span v-else>-</span>
          </template>
        </el-table-column>
        <el-table-column :label="$t('hrm.performance.level')" width="100" align="center">
          <template #default="{ row }">
            <el-tag v-if="row.level" :type="levelType(row.level)" effect="dark" size="small">
              {{ row.level }} - {{ levelLabel(row.level) }}
            </el-tag>
            <span v-else>-</span>
          </template>
        </el-table-column>
        <el-table-column prop="selfEvaluation" :label="$t('hrm.performance.selfEvaluation')" min-width="150" show-overflow-tooltip />
        <el-table-column prop="leaderEvaluation" :label="$t('hrm.performance.leaderEvaluation')" min-width="150" show-overflow-tooltip />
        <el-table-column :label="$t('hrm.performance.status')" width="100">
          <template #default="{ row }">
            <el-tag :type="statusType(row.status)">{{ statusLabel(row.status) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column :label="$t('common.operation')" width="150" fixed="right">
          <template #default="{ row }">
            <el-button link type="primary" @click="handleEvaluate(row)" v-if="row.status < 2">{{ $t('hrm.performance.evaluate') }}</el-button>
            <el-button link type="danger" @click="handleDelete(row)">{{ $t('common.delete') }}</el-button>
          </template>
        </el-table-column>
      </el-table>

      <el-pagination
        v-model:current-page="queryParams.pageNum"
        v-model:page-size="queryParams.pageSize"
        :total="total"
        :page-sizes="[10, 20, 50]"
        layout="total, sizes, prev, pager, next, jumper"
        @size-change="getList"
        @current-change="getList"
        class="pagination"
      />
    </el-card>

    <!-- Add Dialog -->
    <el-dialog v-model="addDialogVisible" :title="$t('common.add')" width="500px" destroy-on-close>
      <el-form :model="addForm" ref="addFormRef" label-width="90px">
        <el-form-item :label="$t('hrm.performance.employee')" prop="employeeId">
          <el-input-number v-model="addForm.employeeId" :min="1" controls-position="right" style="width:100%" />
        </el-form-item>
        <el-form-item :label="$t('hrm.performance.period')" prop="period">
          <el-input v-model="addForm.period" placeholder="e.g. 2026-05, 2026-Q1, 2026" />
        </el-form-item>
        <el-form-item :label="$t('hrm.performance.type')" prop="type">
          <el-radio-group v-model="addForm.type">
            <el-radio :value="1">{{ $t('hrm.performance.typeMonthly') }}</el-radio>
            <el-radio :value="2">{{ $t('hrm.performance.typeQuarterly') }}</el-radio>
            <el-radio :value="3">{{ $t('hrm.performance.typeAnnual') }}</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item :label="$t('hrm.performance.selfEvaluation')">
          <el-input v-model="addForm.selfEvaluation" type="textarea" :rows="3" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="addDialogVisible = false">{{ $t('common.cancel') }}</el-button>
        <el-button type="primary" @click="handleAddSubmit">{{ $t('common.confirm') }}</el-button>
      </template>
    </el-dialog>

    <!-- Evaluate Dialog -->
    <el-dialog v-model="evalDialogVisible" :title="$t('hrm.performance.evaluate')" width="500px" destroy-on-close>
      <el-form :model="evalForm" label-width="90px">
        <el-form-item :label="$t('hrm.performance.selfScore')">
          <el-slider v-model="evalForm.selfScore" :min="0" :max="100" show-input />
        </el-form-item>
        <el-form-item :label="$t('hrm.performance.leaderScore')">
          <el-slider v-model="evalForm.leaderScore" :min="0" :max="100" show-input />
        </el-form-item>
        <el-form-item :label="$t('hrm.performance.finalScore')">
          <div class="final-score">{{ computedFinalScore }}</div>
          <el-tag :type="levelType(computedLevel)" effect="dark" style="margin-left:8px">{{ computedLevel }} - {{ levelLabel(computedLevel) }}</el-tag>
        </el-form-item>
        <el-form-item :label="$t('hrm.performance.evaluation')">
          <el-input v-model="evalForm.evaluation" type="textarea" :rows="3" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="evalDialogVisible = false">{{ $t('common.cancel') }}</el-button>
        <el-button type="primary" @click="handleEvalSubmit">{{ $t('common.confirm') }}</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { ElMessage, ElMessageBox } from 'element-plus'
import { performanceApi } from '@/api/hrm'

const { t } = useI18n()
const loading = ref(false)
const tableData = ref<any[]>([])
const total = ref(0)
const addDialogVisible = ref(false)
const evalDialogVisible = ref(false)
const addFormRef = ref()

const queryParams = reactive({
  pageNum: 1, pageSize: 20,
  type: 1,
  period: '',
  status: undefined as number | undefined
})

const addForm = reactive({ employeeId: undefined as number | undefined, period: '', type: 1, selfEvaluation: '' })
const evalForm = reactive({ id: 0, selfScore: 80, leaderScore: 80, evaluation: '' })

const computedFinalScore = computed(() => {
  return (evalForm.selfScore * 0.3 + evalForm.leaderScore * 0.7).toFixed(1)
})

const computedLevel = computed(() => {
  const score = parseFloat(computedFinalScore.value)
  if (score >= 90) return 'A'
  if (score >= 80) return 'B'
  if (score >= 70) return 'C'
  if (score >= 60) return 'D'
  return 'E'
})

function typeLabel(type: number) {
  const map: Record<number, string> = { 1: t('hrm.performance.typeMonthly'), 2: t('hrm.performance.typeQuarterly'), 3: t('hrm.performance.typeAnnual') }
  return map[type] || ''
}

function statusLabel(status: number) {
  const map: Record<number, string> = { 0: t('hrm.performance.statusPending'), 1: t('hrm.performance.statusSelfDone'), 2: t('hrm.performance.statusCompleted') }
  return map[status] || ''
}

function statusType(status: number) {
  const map: Record<number, string> = { 0: 'info', 1: 'warning', 2: 'success' }
  return map[status] || 'info'
}

function levelLabel(level: string) {
  const map: Record<string, string> = { A: t('hrm.performance.levelA'), B: t('hrm.performance.levelB'), C: t('hrm.performance.levelC'), D: t('hrm.performance.levelD'), E: t('hrm.performance.levelE') }
  return map[level] || ''
}

function levelType(level: string) {
  const map: Record<string, string> = { A: 'success', B: '', C: 'warning', D: 'danger', E: 'danger' }
  return map[level] || 'info'
}

async function getList() {
  loading.value = true
  try {
    const res = await performanceApi.list(queryParams)
    tableData.value = res.data?.records || []
    total.value = res.data?.total || 0
  } finally { loading.value = false }
}

function handleSearch() { queryParams.pageNum = 1; getList() }
function handleReset() { queryParams.period = ''; queryParams.status = undefined; handleSearch() }

function handleAdd() {
  Object.assign(addForm, { employeeId: undefined, period: '', type: queryParams.type, selfEvaluation: '' })
  addDialogVisible.value = true
}

async function handleAddSubmit() {
  await performanceApi.create(addForm)
  ElMessage.success(t('common.success'))
  addDialogVisible.value = false
  getList()
}

function handleEvaluate(row: any) {
  evalForm.id = row.id
  evalForm.selfScore = 80
  evalForm.leaderScore = 80
  evalForm.evaluation = ''
  evalDialogVisible.value = true
}

async function handleEvalSubmit() {
  await performanceApi.evaluate(evalForm)
  ElMessage.success(t('common.success'))
  evalDialogVisible.value = false
  getList()
}

async function handleDelete(row: any) {
  await ElMessageBox.confirm(t('common.confirmDelete'), t('common.confirm'))
  await performanceApi.remove(row.id)
  ElMessage.success(t('common.success'))
  getList()
}

onMounted(() => { getList() })
</script>

<style scoped>
.hrm-performance { padding: 16px; }
.search-card { margin-bottom: 16px; }
.table-card .card-header { display: flex; justify-content: space-between; align-items: center; }
.pagination { margin-top: 16px; justify-content: flex-end; }
.score { font-size: 18px; font-weight: bold; color: #F26522; }
.final-score { font-size: 24px; font-weight: bold; color: #F26522; display: inline-block; }
</style>
'@

[IO.File]::WriteAllText("$uiBase\views\hrm\performance.vue", $content, [System.Text.Encoding]::UTF8)
Write-Host "performance.vue generated!"
