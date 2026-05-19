<template>
  <div class="workflow-started">
    <div class="page-header">
      <div class="page-header__left">
        <h2>{{ $t('workflow.started') }}</h2>
      </div>
      <div class="page-header__right">
        <el-button type="primary" @click="openStartDialog">
          <el-icon><Plus /></el-icon>
          {{ $t('workflow.startProcess') }}
        </el-button>
      </div>
    </div>

    <!-- 发起列表 -->
    <el-table :data="startedList" v-loading="loading" stripe>
      <el-table-column prop="processName" :label="$t('workflow.processName')" min-width="120" />
      <el-table-column prop="title" :label="$t('workflow.instanceTitle')" min-width="160" />
      <el-table-column prop="status" :label="$t('workflow.status')" width="100" align="center">
        <template #default="{ row }">
          <el-tag :type="getStatusType(row.status)" size="small">{{ getStatusLabel(row.status) }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="currentNodeName" :label="$t('workflow.currentHandler')" width="130" />
      <el-table-column prop="startTime" :label="$t('workflow.initiateTime')" width="170" />
      <el-table-column :label="$t('common.edit')" width="160" fixed="right">
        <template #default="{ row }">
          <el-button type="primary" size="small" text @click="viewDetail(row)">{{ $t('workflow.viewDetail') }}</el-button>
          <el-button v-if="row.status === 0" type="danger" size="small" text @click="handleCancel(row)">{{ $t('workflow.revoke') }}</el-button>
        </template>
      </el-table-column>
    </el-table>

    <!-- 分页 -->
    <div class="pagination-wrap">
      <el-pagination
        v-model:current-page="pageNum"
        v-model:page-size="pageSize"
        :total="total"
        layout="total, sizes, prev, pager, next"
        :page-sizes="[10, 20, 50]"
        @change="loadData"
      />
    </div>

    <!-- 空状态 -->
    <el-empty v-if="!loading && startedList.length === 0" :description="$t('workflow.noStarted')" />

    <!-- 发起流程弹窗 -->
    <el-dialog v-model="startDialogVisible" :title="$t('workflow.startProcess')" width="600px">
      <el-steps :active="startStep" align-center style="margin-bottom: 24px">
        <el-step :title="$t('workflow.selectProcess')" />
        <el-step :title="$t('workflow.fillForm')" />
      </el-steps>

      <!-- 步骤1：选择流程 -->
      <div v-if="startStep === 0" class="process-select">
        <div v-for="proc in availableProcesses" :key="proc.id"
          class="process-select-item"
          :class="{ 'process-select-item--active': selectedProcess?.id === proc.id }"
          @click="selectedProcess = proc"
        >
          <div class="process-select-item__name">{{ proc.name }}</div>
          <div class="process-select-item__desc">{{ proc.description || proc.category }}</div>
        </div>
        <el-empty v-if="availableProcesses.length === 0" :description="$t('common.noData')" />
      </div>

      <!-- 步骤2：填写表单 -->
      <div v-if="startStep === 1" class="form-fill">
        <el-form :model="formValues" label-width="120px">
          <el-form-item :label="$t('workflow.instanceTitle')">
            <el-input v-model="processTitle" placeholder="请输入流程标题" />
          </el-form-item>
          <template v-for="field in formFields" :key="field.field">
            <el-form-item :label="field.label">
              <el-input v-if="field.type === 'text'" v-model="formValues[field.field]" />
              <el-input v-else-if="field.type === 'textarea'" v-model="formValues[field.field]" type="textarea" :rows="3" />
              <el-input-number v-else-if="field.type === 'number'" v-model="formValues[field.field]" :min="0" style="width: 100%" />
              <el-select v-else-if="field.type === 'select'" v-model="formValues[field.field]" style="width: 100%">
                <el-option v-for="opt in (field.options || [])" :key="opt" :label="opt" :value="opt" />
              </el-select>
              <el-input v-else v-model="formValues[field.field]" />
            </el-form-item>
          </template>
        </el-form>
      </div>

      <template #footer>
        <el-button @click="startDialogVisible = false">{{ $t('common.cancel') }}</el-button>
        <el-button v-if="startStep === 1" @click="startStep = 0">{{ $t('common.back') }}</el-button>
        <el-button v-if="startStep === 0" type="primary" :disabled="!selectedProcess" @click="startStep = 1; loadFormFields()">
          下一步
        </el-button>
        <el-button v-if="startStep === 1" type="primary" @click="submitProcess">{{ $t('workflow.submitProcess') }}</el-button>
      </template>
    </el-dialog>

    <!-- 详情弹窗 -->
    <el-dialog v-model="detailVisible" :title="$t('workflow.viewDetail')" width="650px" top="5vh">
      <div v-if="instanceDetail" class="detail-content">
        <div class="detail-section">
          <h4>{{ $t('workflow.formData') }}</h4>
          <div class="form-data-display">
            <div v-for="(val, key) in parsedFormData" :key="key" class="form-data-item">
              <span class="form-data-label">{{ key }}:</span>
              <span class="form-data-value">{{ val }}</span>
            </div>
          </div>
        </div>
        <div class="detail-section">
          <h4>{{ $t('workflow.approvalTrack') }}</h4>
          <ApprovalTrack :histories="instanceDetail.histories || []" :current-node-name="instanceDetail.currentNodeName" />
        </div>
      </div>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus } from '@element-plus/icons-vue'
import { taskApi, instanceApi, processApi, type InstanceItem, type ProcessDef } from '@/api/workflow'
import ApprovalTrack from '@/components/workflow/ApprovalTrack.vue'

const { t } = useI18n()

const loading = ref(false)
const startedList = ref<InstanceItem[]>([])
const pageNum = ref(1)
const pageSize = ref(10)
const total = ref(0)

// 发起流程
const startDialogVisible = ref(false)
const startStep = ref(0)
const availableProcesses = ref<ProcessDef[]>([])
const selectedProcess = ref<ProcessDef | null>(null)
const processTitle = ref('')
const formFields = ref<any[]>([])
const formValues = reactive<Record<string, any>>({})

// 详情
const detailVisible = ref(false)
const instanceDetail = ref<InstanceItem | null>(null)

const parsedFormData = computed(() => {
  try {
    if (!instanceDetail.value?.formData) return {}
    return JSON.parse(instanceDetail.value.formData)
  } catch { return {} }
})

onMounted(() => {
  loadData()
})

async function loadData() {
  loading.value = true
  try {
    const res = await taskApi.started({ pageNum: pageNum.value, pageSize: pageSize.value })
    const data = (res as any).data || res
    startedList.value = data.records || data.list || []
    total.value = data.total || 0
  } catch (e) { /* ignore */ }
  loading.value = false
}

function getStatusType(status: number) {
  switch (status) {
    case 0: return 'primary'
    case 1: return 'success'
    case 2: return 'danger'
    case 3: return 'info'
    default: return 'info'
  }
}

function getStatusLabel(status: number) {
  switch (status) {
    case 0: return t('workflow.statusProcessing')
    case 1: return t('workflow.statusCompleted')
    case 2: return t('workflow.statusRejected')
    case 3: return t('workflow.statusCancelled')
    default: return ''
  }
}

async function openStartDialog() {
  startStep.value = 0
  selectedProcess.value = null
  processTitle.value = ''
  Object.keys(formValues).forEach(k => delete formValues[k])

  // 加载已发布的流程列表
  try {
    const res = await processApi.list({ status: 1 })
    availableProcesses.value = (res as any).data || res || []
  } catch (e) {
    availableProcesses.value = []
  }
  startDialogVisible.value = true
}

function loadFormFields() {
  if (!selectedProcess.value) return
  try {
    const config = JSON.parse(selectedProcess.value.formConfig || '[]')
    formFields.value = config
    // 初始化表单值
    for (const field of config) {
      if (!(field.field in formValues)) {
        formValues[field.field] = field.type === 'number' ? 0 : ''
      }
    }
  } catch {
    formFields.value = []
  }
}

async function submitProcess() {
  if (!selectedProcess.value) return
  if (!processTitle.value) {
    ElMessage.warning('请输入流程标题')
    return
  }
  try {
    await instanceApi.start({
      processKey: selectedProcess.value.processKey,
      title: processTitle.value,
      formData: { ...formValues }
    })
    ElMessage.success(t('common.success'))
    startDialogVisible.value = false
    loadData()
  } catch (e: any) {
    ElMessage.error(e.message || t('common.failed'))
  }
}

async function viewDetail(row: InstanceItem) {
  try {
    const res = await instanceApi.detail(row.id)
    instanceDetail.value = (res as any).data || res
    detailVisible.value = true
  } catch (e) { /* ignore */ }
}

async function handleCancel(row: InstanceItem) {
  await ElMessageBox.confirm(t('workflow.confirmCancel'), t('common.confirm'))
  try {
    await instanceApi.cancel(row.id)
    ElMessage.success(t('common.success'))
    loadData()
  } catch (e: any) {
    ElMessage.error(e.message || t('common.failed'))
  }
}
</script>

<style scoped>
.workflow-started {
  padding: 20px;
}
.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}
.page-header h2 {
  margin: 0;
  color: var(--el-text-color-primary);
}
.pagination-wrap {
  display: flex;
  justify-content: flex-end;
  margin-top: 16px;
}
.process-select {
  display: grid;
  gap: 12px;
}
.process-select-item {
  padding: 14px 16px;
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s;
}
.process-select-item:hover {
  border-color: #F26522;
}
.process-select-item--active {
  border-color: #F26522;
  background: rgba(242, 101, 34, 0.05);
}
.process-select-item__name {
  font-weight: 500;
  font-size: 14px;
  color: var(--el-text-color-primary);
}
.process-select-item__desc {
  font-size: 12px;
  color: var(--el-text-color-secondary);
  margin-top: 4px;
}
.detail-content {
  max-height: 60vh;
  overflow-y: auto;
}
.detail-section {
  margin-bottom: 20px;
}
.detail-section h4 {
  margin: 0 0 12px 0;
  font-size: 14px;
  color: var(--el-text-color-primary);
  border-left: 3px solid #F26522;
  padding-left: 8px;
}
.form-data-display {
  background: var(--el-bg-color-page);
  padding: 12px 16px;
  border-radius: 6px;
}
.form-data-item {
  display: flex;
  padding: 6px 0;
  border-bottom: 1px dashed var(--el-border-color-lighter);
}
.form-data-item:last-child { border-bottom: none; }
.form-data-label {
  font-size: 13px;
  color: var(--el-text-color-secondary);
  min-width: 100px;
}
.form-data-value {
  font-size: 13px;
  color: var(--el-text-color-primary);
}
</style>
