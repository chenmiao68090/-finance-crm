$uiBase = "d:\zhehang-erp\zhehang-erp-ui\src"

$content = @'
<template>
  <div class="hrm-recruit">
    <!-- Search -->
    <el-card shadow="never" class="search-card">
      <el-form :model="queryParams" inline>
        <el-form-item :label="$t('hrm.recruit.postTitle')">
          <el-input v-model="queryParams.title" clearable />
        </el-form-item>
        <el-form-item :label="$t('hrm.recruit.status')">
          <el-select v-model="queryParams.status" clearable>
            <el-option :label="$t('hrm.recruit.statusDraft')" :value="0" />
            <el-option :label="$t('hrm.recruit.statusRecruiting')" :value="1" />
            <el-option :label="$t('hrm.recruit.statusCompleted')" :value="2" />
            <el-option :label="$t('hrm.recruit.statusClosed')" :value="3" />
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
          <span>{{ $t('hrm.recruit.title') }}</span>
          <el-button type="primary" @click="handleAdd">{{ $t('common.add') }}</el-button>
        </div>
      </template>

      <el-table :data="tableData" v-loading="loading" border stripe @expand-change="handleExpand">
        <el-table-column type="expand">
          <template #default="{ row }">
            <div class="resume-section" v-loading="row._resumeLoading">
              <div class="resume-header">
                <span>{{ $t('hrm.recruit.resume') }}</span>
                <el-button size="small" type="primary" @click="handleAddResume(row)">{{ $t('common.add') }}</el-button>
              </div>
              <el-table :data="row._resumes || []" size="small" border>
                <el-table-column prop="name" :label="$t('hrm.recruit.resumeName')" width="100" />
                <el-table-column prop="phone" :label="$t('hrm.recruit.resumePhone')" width="130" />
                <el-table-column prop="education" :label="$t('hrm.recruit.resumeEducation')" width="80" />
                <el-table-column prop="experienceYears" :label="$t('hrm.recruit.resumeExperience')" width="90" />
                <el-table-column prop="currentCompany" :label="$t('hrm.recruit.resumeCompany')" width="140" show-overflow-tooltip />
                <el-table-column prop="expectedSalary" :label="$t('hrm.recruit.resumeExpectedSalary')" width="110" align="right">
                  <template #default="{ row: r }">{{ r.expectedSalary ? formatAmount(r.expectedSalary) : '-' }}</template>
                </el-table-column>
                <el-table-column :label="$t('hrm.recruit.resumeStatus')" width="100">
                  <template #default="{ row: r }">
                    <el-tag :type="resumeStatusType(r.status)">{{ resumeStatusLabel(r.status) }}</el-tag>
                  </template>
                </el-table-column>
                <el-table-column :label="$t('common.operation')" width="200">
                  <template #default="{ row: r }">
                    <el-button link type="primary" size="small" v-if="r.status === 0" @click="handleResumeStatus(r, 1)">{{ $t('hrm.recruit.interview') }}</el-button>
                    <el-button link type="success" size="small" v-if="r.status === 1" @click="handleResumeStatus(r, 2)">{{ $t('hrm.recruit.hire') }}</el-button>
                    <el-button link type="danger" size="small" v-if="r.status < 2" @click="handleResumeStatus(r, 3)">{{ $t('hrm.recruit.reject') }}</el-button>
                  </template>
                </el-table-column>
              </el-table>
            </div>
          </template>
        </el-table-column>
        <el-table-column prop="title" :label="$t('hrm.recruit.postTitle')" min-width="160" show-overflow-tooltip />
        <el-table-column prop="deptId" :label="$t('hrm.recruit.dept')" width="120" />
        <el-table-column prop="headcount" :label="$t('hrm.recruit.headcount')" width="90" align="center" />
        <el-table-column :label="$t('hrm.recruit.salaryRange')" width="160" align="center">
          <template #default="{ row }">
            {{ row.salaryMin ? formatAmount(row.salaryMin) : '0' }} - {{ row.salaryMax ? formatAmount(row.salaryMax) : '0' }}
          </template>
        </el-table-column>
        <el-table-column :label="$t('hrm.recruit.status')" width="100">
          <template #default="{ row }">
            <el-tag :type="recruitStatusType(row.status)">{{ recruitStatusLabel(row.status) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="publishDate" :label="$t('hrm.recruit.publishDate')" width="120" />
        <el-table-column :label="$t('common.operation')" width="200" fixed="right">
          <template #default="{ row }">
            <el-button link type="primary" @click="handleEdit(row)">{{ $t('common.edit') }}</el-button>
            <el-button link type="success" v-if="row.status === 0" @click="handleChangeStatus(row, 1)">{{ $t('hrm.recruit.publish') }}</el-button>
            <el-button link type="danger" v-if="row.status === 1" @click="handleChangeStatus(row, 3)">{{ $t('hrm.recruit.close') }}</el-button>
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

    <!-- Add/Edit Recruit Dialog -->
    <el-dialog v-model="dialogVisible" :title="dialogTitle" width="600px" destroy-on-close>
      <el-form :model="form" :rules="rules" ref="formRef" label-width="100px">
        <el-form-item :label="$t('hrm.recruit.postTitle')" prop="title">
          <el-input v-model="form.title" />
        </el-form-item>
        <el-row :gutter="16">
          <el-col :span="12">
            <el-form-item :label="$t('hrm.recruit.dept')" prop="deptId">
              <el-input-number v-model="form.deptId" :min="1" controls-position="right" style="width:100%" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item :label="$t('hrm.recruit.headcount')" prop="headcount">
              <el-input-number v-model="form.headcount" :min="1" controls-position="right" style="width:100%" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="16">
          <el-col :span="12">
            <el-form-item :label="$t('hrm.recruit.salaryMin')">
              <el-input-number v-model="form.salaryMin" :min="0" :precision="0" controls-position="right" style="width:100%" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item :label="$t('hrm.recruit.salaryMax')">
              <el-input-number v-model="form.salaryMax" :min="0" :precision="0" controls-position="right" style="width:100%" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-form-item :label="$t('hrm.recruit.requirements')">
          <el-input v-model="form.requirements" type="textarea" :rows="4" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">{{ $t('common.cancel') }}</el-button>
        <el-button type="primary" @click="handleSubmit" :loading="submitLoading">{{ $t('common.confirm') }}</el-button>
      </template>
    </el-dialog>

    <!-- Add Resume Dialog -->
    <el-dialog v-model="resumeDialogVisible" :title="$t('hrm.recruit.resume')" width="500px" destroy-on-close>
      <el-form :model="resumeForm" ref="resumeFormRef" label-width="90px">
        <el-form-item :label="$t('hrm.recruit.resumeName')" prop="name">
          <el-input v-model="resumeForm.name" />
        </el-form-item>
        <el-form-item :label="$t('hrm.recruit.resumePhone')">
          <el-input v-model="resumeForm.phone" />
        </el-form-item>
        <el-form-item :label="$t('hrm.recruit.resumeEmail')">
          <el-input v-model="resumeForm.email" />
        </el-form-item>
        <el-form-item :label="$t('hrm.recruit.resumeEducation')">
          <el-select v-model="resumeForm.education" style="width:100%">
            <el-option label="大专" value="大专" />
            <el-option label="本科" value="本科" />
            <el-option label="硕士" value="硕士" />
            <el-option label="博士" value="博士" />
          </el-select>
        </el-form-item>
        <el-form-item :label="$t('hrm.recruit.resumeExperience')">
          <el-input-number v-model="resumeForm.experienceYears" :min="0" controls-position="right" style="width:100%" />
        </el-form-item>
        <el-form-item :label="$t('hrm.recruit.resumeExpectedSalary')">
          <el-input-number v-model="resumeForm.expectedSalary" :min="0" :precision="0" controls-position="right" style="width:100%" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="resumeDialogVisible = false">{{ $t('common.cancel') }}</el-button>
        <el-button type="primary" @click="handleResumeSubmit">{{ $t('common.confirm') }}</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { ElMessage, ElMessageBox } from 'element-plus'
import { recruitApi, resumeApi } from '@/api/hrm'

const { t } = useI18n()
const loading = ref(false)
const submitLoading = ref(false)
const tableData = ref<any[]>([])
const total = ref(0)
const dialogVisible = ref(false)
const dialogTitle = ref('')
const formRef = ref()
const resumeDialogVisible = ref(false)
const resumeFormRef = ref()
let currentRecruitRow: any = null

const queryParams = reactive({
  pageNum: 1,
  pageSize: 10,
  title: '',
  status: undefined as number | undefined
})

const form = reactive({
  id: undefined as number | undefined,
  title: '',
  deptId: undefined as number | undefined,
  headcount: 1,
  salaryMin: undefined as number | undefined,
  salaryMax: undefined as number | undefined,
  requirements: ''
})

const resumeForm = reactive({
  recruitId: undefined as number | undefined,
  name: '',
  phone: '',
  email: '',
  education: '',
  experienceYears: 0,
  expectedSalary: undefined as number | undefined
})

const rules = {
  title: [{ required: true, message: () => t('common.pleaseInput'), trigger: 'blur' }],
  deptId: [{ required: true, message: () => t('common.pleaseInput'), trigger: 'blur' }],
  headcount: [{ required: true, message: () => t('common.pleaseInput'), trigger: 'blur' }]
}

function recruitStatusLabel(status: number) {
  const map: Record<number, string> = {
    0: t('hrm.recruit.statusDraft'), 1: t('hrm.recruit.statusRecruiting'),
    2: t('hrm.recruit.statusCompleted'), 3: t('hrm.recruit.statusClosed')
  }
  return map[status] || ''
}

function recruitStatusType(status: number) {
  const map: Record<number, string> = { 0: 'info', 1: 'success', 2: '', 3: 'danger' }
  return map[status] || 'info'
}

function resumeStatusLabel(status: number) {
  const map: Record<number, string> = {
    0: t('hrm.recruit.resumeStatusPending'), 1: t('hrm.recruit.resumeStatusInterviewing'),
    2: t('hrm.recruit.resumeStatusHired'), 3: t('hrm.recruit.resumeStatusRejected')
  }
  return map[status] || ''
}

function resumeStatusType(status: number) {
  const map: Record<number, string> = { 0: 'info', 1: 'warning', 2: 'success', 3: 'danger' }
  return map[status] || 'info'
}

function formatAmount(val: number) {
  return val != null ? Number(val).toFixed(0).replace(/\B(?=(\d{3})+(?!\d))/g, ',') : '0'
}

async function getList() {
  loading.value = true
  try {
    const res = await recruitApi.list(queryParams)
    tableData.value = (res.data?.records || []).map((r: any) => ({ ...r, _resumes: [], _resumeLoading: false }))
    total.value = res.data?.total || 0
  } finally {
    loading.value = false
  }
}

async function handleExpand(row: any, expanded: any[]) {
  if (expanded.length && !row._resumesLoaded) {
    row._resumeLoading = true
    try {
      const res = await resumeApi.list({ recruitId: row.id, pageNum: 1, pageSize: 100 })
      row._resumes = res.data?.records || []
      row._resumesLoaded = true
    } finally {
      row._resumeLoading = false
    }
  }
}

function handleSearch() { queryParams.pageNum = 1; getList() }
function handleReset() { queryParams.title = ''; queryParams.status = undefined; handleSearch() }

function handleAdd() {
  dialogTitle.value = t('common.add')
  Object.assign(form, { id: undefined, title: '', deptId: undefined, headcount: 1, salaryMin: undefined, salaryMax: undefined, requirements: '' })
  dialogVisible.value = true
}

function handleEdit(row: any) {
  dialogTitle.value = t('common.edit')
  Object.assign(form, { ...row })
  dialogVisible.value = true
}

async function handleSubmit() {
  await formRef.value?.validate()
  submitLoading.value = true
  try {
    if (form.id) { await recruitApi.update(form) } else { await recruitApi.create(form) }
    ElMessage.success(t('common.success'))
    dialogVisible.value = false
    getList()
  } finally { submitLoading.value = false }
}

async function handleDelete(row: any) {
  await ElMessageBox.confirm(t('common.confirmDelete'), t('common.confirm'))
  await recruitApi.remove(row.id)
  ElMessage.success(t('common.success'))
  getList()
}

async function handleChangeStatus(row: any, status: number) {
  await recruitApi.changeStatus({ id: row.id, status })
  ElMessage.success(t('common.success'))
  getList()
}

function handleAddResume(row: any) {
  currentRecruitRow = row
  Object.assign(resumeForm, { recruitId: row.id, name: '', phone: '', email: '', education: '', experienceYears: 0, expectedSalary: undefined })
  resumeDialogVisible.value = true
}

async function handleResumeSubmit() {
  await resumeApi.create(resumeForm)
  ElMessage.success(t('common.success'))
  resumeDialogVisible.value = false
  if (currentRecruitRow) {
    currentRecruitRow._resumesLoaded = false
    handleExpand(currentRecruitRow, [true])
  }
}

async function handleResumeStatus(row: any, status: number) {
  await resumeApi.changeStatus({ id: row.id, status })
  ElMessage.success(t('common.success'))
  if (currentRecruitRow) {
    currentRecruitRow._resumesLoaded = false
    handleExpand(currentRecruitRow, [true])
  } else {
    getList()
  }
}

onMounted(() => { getList() })
</script>

<style scoped>
.hrm-recruit { padding: 16px; }
.search-card { margin-bottom: 16px; }
.table-card .card-header { display: flex; justify-content: space-between; align-items: center; }
.pagination { margin-top: 16px; justify-content: flex-end; }
.resume-section { padding: 12px 24px; }
.resume-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px; font-weight: bold; }
</style>
'@

[IO.File]::WriteAllText("$uiBase\views\hrm\recruit.vue", $content, [System.Text.Encoding]::UTF8)
Write-Host "recruit.vue generated!"
