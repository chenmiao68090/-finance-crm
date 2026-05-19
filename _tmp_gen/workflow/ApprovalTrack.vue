<template>
  <div class="approval-track">
    <el-timeline>
      <el-timeline-item
        v-for="item in histories"
        :key="item.id"
        :type="getTimelineType(item.action)"
        :hollow="false"
        :timestamp="item.operTime"
        placement="top"
      >
        <div class="track-item" :class="{ 'track-item--active': isCurrentNode(item) }">
          <div class="track-item__header">
            <div class="track-item__avatar">
              <el-avatar :size="32" :src="item.operatorAvatar">
                {{ (item.operatorName || '系统').charAt(0) }}
              </el-avatar>
            </div>
            <div class="track-item__info">
              <span class="track-item__name">{{ item.operatorName || $t('workflow.actionStart') }}</span>
              <el-tag
                :type="getActionTagType(item.action)"
                size="small"
                class="track-item__action"
              >
                {{ getActionLabel(item.action) }}
              </el-tag>
            </div>
          </div>
          <div v-if="item.comment" class="track-item__comment">
            {{ item.comment }}
          </div>
          <div class="track-item__node">
            <span class="track-item__node-label">{{ item.nodeName }}</span>
          </div>
        </div>
      </el-timeline-item>
    </el-timeline>
    <el-empty v-if="!histories || histories.length === 0" :description="$t('common.noData')" />
  </div>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import type { HistoryItem } from '@/api/workflow'

const { t } = useI18n()

interface Props {
  histories: HistoryItem[]
  currentNodeName?: string
}

const props = withDefaults(defineProps<Props>(), {
  histories: () => [],
  currentNodeName: ''
})

function getTimelineType(action: string) {
  switch (action) {
    case 'start': return 'primary'
    case 'approve': return 'success'
    case 'reject': return 'danger'
    case 'transfer': return 'warning'
    case 'cancel': return 'info'
    default: return 'primary'
  }
}

function getActionTagType(action: string) {
  switch (action) {
    case 'start': return ''
    case 'approve': return 'success'
    case 'reject': return 'danger'
    case 'transfer': return 'warning'
    case 'cancel': return 'info'
    default: return ''
  }
}

function getActionLabel(action: string) {
  switch (action) {
    case 'start': return t('workflow.actionStart')
    case 'approve': return t('workflow.actionApprove')
    case 'reject': return t('workflow.actionReject')
    case 'transfer': return t('workflow.actionTransfer')
    case 'cancel': return t('workflow.actionCancel')
    default: return action
  }
}

function isCurrentNode(item: HistoryItem) {
  return props.currentNodeName && item.nodeName === props.currentNodeName
}
</script>

<style scoped>
.approval-track {
  padding: 16px 0;
}
.track-item {
  padding: 8px 12px;
  border-radius: 6px;
  background: var(--el-bg-color-page);
  transition: all 0.3s;
}
.track-item--active {
  background: rgba(242, 101, 34, 0.05);
  border-left: 3px solid #F26522;
}
.track-item__header {
  display: flex;
  align-items: center;
  gap: 10px;
}
.track-item__info {
  display: flex;
  align-items: center;
  gap: 8px;
}
.track-item__name {
  font-weight: 500;
  font-size: 14px;
  color: var(--el-text-color-primary);
}
.track-item__action {
  margin-left: 4px;
}
.track-item__comment {
  margin-top: 8px;
  padding: 8px 12px;
  background: var(--el-fill-color-lighter);
  border-radius: 4px;
  font-size: 13px;
  color: var(--el-text-color-regular);
}
.track-item__node {
  margin-top: 6px;
}
.track-item__node-label {
  font-size: 12px;
  color: var(--el-text-color-secondary);
}
</style>
