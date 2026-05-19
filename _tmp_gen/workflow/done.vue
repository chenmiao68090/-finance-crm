<template>
  <div class="workflow-done">
    <div class="page-header">
      <h2>{{ $t('workflow.done') }}</h2>
    </div>

    <!-- 已办列表 -->
    <el-table :data="doneList" v-loading="loading" stripe>
      <el-table-column prop="processName" :label="$t('workflow.processName')" min-width="120" />
      <el-table-column prop="instanceTitle" :label="$t('workflow.instanceTitle')" min-width="160" />
      <el-table-column prop="initiatorName" :label="$t('workflow.initiator')" width="100">
        <template #default="{ row }">
          {{ row.initiatorName || '用户' + row.initiatorId }}
        </template>
      </el-table-column>
      <el-table-column prop="status" :label="$t('workflow.myAction')" width="100" align="center">
        <template #default="{ row }">
          <el-tag :type="getActionType(row.status)" size="small">{{ getActionLabel(row.status) }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="handleTime" :label="$t('workflow.handleTime')" width="170" />
      <el-table-column :label="$t('common.edit')" width="100" fixed="right">
        <template #default="{ row }">
          <el-button type="primary" size="small" text @click="viewDetail(row)">{{ $t('workflow.viewDetail') }}</el-button>
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
    <el-empty v-if="!loading && doneList.length === 0" :description="$t('workflow.noDone')" />

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
            <el-empty v-if="Object.keys(parsedFormData).length === 0" :description="$t('common.noData')" :image-size="60" />
          </div>
        </div>
        <div class="detail-section">
          <h4>{{ $t('workflow.approvalTrack') }}</h4>
          <ApprovalTrack :histories="instanceDetail.histories || []" />
        </div>
      </div>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { taskApi, instanceApi, type TaskItem, type InstanceItem } from '@/api/workflow'
import ApprovalTrack from '@/components/workflow/ApprovalTrack.vue'

const { t } = useI18n()

const loading = ref(false)
const doneList = ref<TaskItem[]>([])
const pageNum = ref(1)
const pageSize = ref(10)
const total = ref(0)

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
    const res = await taskApi.done({ pageNum: pageNum.value, pageSize: pageSize.value })
    const data = (res as any).data || res
    doneList.value = data.records || data.list || []
    total.value = data.total || 0
  } catch (e) { /* ignore */ }
  loading.value = false
}

function getActionType(status: number) {
  switch (status) {
    case 1: return 'success'
    case 2: return 'danger'
    case 3: return 'warning'
    default: return 'info'
  }
}

function getActionLabel(status: number) {
  switch (status) {
    case 1: return t('workflow.actionApprove')
    case 2: return t('workflow.actionReject')
    case 3: return t('workflow.actionTransfer')
    default: return ''
  }
}

async function viewDetail(row: TaskItem) {
  try {
    const res = await instanceApi.detail(row.instanceId)
    instanceDetail.value = (res as any).data || res
    detailVisible.value = true
  } catch (e) { /* ignore */ }
}
</script>

<style scoped>
.workflow-done {
  padding: 20px;
}
.page-header {
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
