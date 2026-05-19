<template>
  <div class="workflow-todo">
    <div class="page-header">
      <h2>{{ $t('workflow.todo') }}</h2>
    </div>

    <!-- 待办列表 -->
    <el-table :data="todoList" v-loading="loading" stripe>
      <el-table-column prop="processName" :label="$t('workflow.processName')" min-width="120" />
      <el-table-column prop="instanceTitle" :label="$t('workflow.instanceTitle')" min-width="160" />
      <el-table-column prop="initiatorName" :label="$t('workflow.initiator')" width="100">
        <template #default="{ row }">
          {{ row.initiatorName || '用户' + row.initiatorId }}
        </template>
      </el-table-column>
      <el-table-column prop="startTime" :label="$t('workflow.initiateTime')" width="170" />
      <el-table-column prop="nodeName" :label="$t('workflow.currentNode')" width="140" />
      <el-table-column :label="$t('common.edit')" width="100" fixed="right">
        <template #default="{ row }">
          <el-button type="primary" size="small" @click="openApproveDialog(row)">{{ $t('workflow.approve') }}</el-button>
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
    <el-empty v-if="!loading && todoList.length === 0" :description="$t('workflow.noTodo')" />

    <!-- 审批弹窗 -->
    <el-dialog v-model="approveVisible" :title="$t('workflow.approveDialog')" width="700px" top="5vh">
      <div v-if="currentTask" class="approve-content">
        <!-- 表单数据展示 -->
        <div class="approve-section">
          <h4>{{ $t('workflow.formData') }}</h4>
          <div class="form-data-display">
            <div v-for="(val, key) in parsedFormData" :key="key" class="form-data-item">
              <span class="form-data-label">{{ key }}:</span>
              <span class="form-data-value">{{ val }}</span>
            </div>
            <el-empty v-if="Object.keys(parsedFormData).length === 0" :description="$t('common.noData')" :image-size="60" />
          </div>
        </div>

        <!-- 审批轨迹 -->
        <div class="approve-section">
          <h4>{{ $t('workflow.approvalTrack') }}</h4>
          <ApprovalTrack :histories="instanceDetail?.histories || []" :current-node-name="currentTask.nodeName" />
        </div>

        <!-- 审批意见 -->
        <div class="approve-section">
          <h4>{{ $t('workflow.comment') }}</h4>
          <el-input v-model="approveComment" type="textarea" :rows="3" :placeholder="$t('workflow.commentPlaceholder')" />
        </div>

        <!-- 转交选择 -->
        <div v-if="showTransfer" class="approve-section">
          <h4>{{ $t('workflow.transferTo') }}</h4>
          <el-input v-model="transferUserId" :placeholder="$t('workflow.selectUser') + ' (ID)'" type="number" />
        </div>
      </div>
      <template #footer>
        <div class="approve-actions">
          <el-button @click="approveVisible = false">{{ $t('common.cancel') }}</el-button>
          <el-button type="warning" @click="showTransfer = !showTransfer">{{ $t('workflow.transfer') }}</el-button>
          <el-button type="danger" @click="handleReject">{{ $t('workflow.reject') }}</el-button>
          <el-button v-if="showTransfer" type="warning" @click="handleTransfer">{{ $t('common.confirm') }} {{ $t('workflow.transfer') }}</el-button>
          <el-button v-else type="primary" @click="handleApprove">{{ $t('workflow.approve') }}</el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { ElMessage } from 'element-plus'
import { taskApi, instanceApi, type TaskItem, type InstanceItem } from '@/api/workflow'
import ApprovalTrack from '@/components/workflow/ApprovalTrack.vue'

const { t } = useI18n()

const loading = ref(false)
const todoList = ref<TaskItem[]>([])
const pageNum = ref(1)
const pageSize = ref(10)
const total = ref(0)

// 审批弹窗状态
const approveVisible = ref(false)
const currentTask = ref<TaskItem | null>(null)
const instanceDetail = ref<InstanceItem | null>(null)
const approveComment = ref('')
const showTransfer = ref(false)
const transferUserId = ref('')

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
    const res = await taskApi.todo({ pageNum: pageNum.value, pageSize: pageSize.value })
    const data = (res as any).data || res
    todoList.value = data.records || data.list || []
    total.value = data.total || 0
  } catch (e) { /* ignore */ }
  loading.value = false
}

async function openApproveDialog(row: TaskItem) {
  currentTask.value = row
  approveComment.value = ''
  showTransfer.value = false
  transferUserId.value = ''

  // 加载流程实例详情
  try {
    const res = await instanceApi.detail(row.instanceId)
    instanceDetail.value = (res as any).data || res
  } catch (e) {
    instanceDetail.value = null
  }

  approveVisible.value = true
}

async function handleApprove() {
  if (!currentTask.value) return
  try {
    await taskApi.approve(currentTask.value.id, { comment: approveComment.value })
    ElMessage.success(t('common.success'))
    approveVisible.value = false
    loadData()
  } catch (e: any) {
    ElMessage.error(e.message || t('common.failed'))
  }
}

async function handleReject() {
  if (!currentTask.value) return
  try {
    await taskApi.reject(currentTask.value.id, { comment: approveComment.value })
    ElMessage.success(t('common.success'))
    approveVisible.value = false
    loadData()
  } catch (e: any) {
    ElMessage.error(e.message || t('common.failed'))
  }
}

async function handleTransfer() {
  if (!currentTask.value || !transferUserId.value) {
    ElMessage.warning(t('workflow.selectUser'))
    return
  }
  try {
    await taskApi.transfer(currentTask.value.id, {
      comment: approveComment.value,
      targetUserId: Number(transferUserId.value)
    })
    ElMessage.success(t('common.success'))
    approveVisible.value = false
    loadData()
  } catch (e: any) {
    ElMessage.error(e.message || t('common.failed'))
  }
}
</script>

<style scoped>
.workflow-todo {
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
.approve-content {
  max-height: 60vh;
  overflow-y: auto;
}
.approve-section {
  margin-bottom: 20px;
}
.approve-section h4 {
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
.form-data-item:last-child {
  border-bottom: none;
}
.form-data-label {
  font-size: 13px;
  color: var(--el-text-color-secondary);
  min-width: 100px;
}
.form-data-value {
  font-size: 13px;
  color: var(--el-text-color-primary);
}
.approve-actions {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
}
</style>
