<template>
  <div class="page-container structure-page">
    <div class="toolbar">
      <el-button-group>
        <el-button @click="zoomIn"><el-icon><ZoomIn /></el-icon></el-button>
        <el-button @click="zoomOut"><el-icon><ZoomOut /></el-icon></el-button>
        <el-button @click="resetZoom"><el-icon><RefreshRight /></el-icon></el-button>
      </el-button-group>
    </div>

    <div class="org-chart-wrapper" ref="chartWrapper" @mousedown="startDrag" @wheel="handleWheel">
      <div class="org-chart-content" :style="contentStyle">
        <div class="org-tree" v-if="treeData.length">
          <OrgNode :nodes="treeData" @node-click="handleNodeClick" />
        </div>
        <el-empty v-else :description="$t('common.noData')" />
      </div>
    </div>

    <!-- 部门详情弹窗 -->
    <el-dialog v-model="detailVisible" :title="$t('org.deptDetail')" width="400px">
      <el-descriptions :column="1" border v-if="selectedNode">
        <el-descriptions-item :label="$t('org.deptName')">{{ selectedNode.label }}</el-descriptions-item>
        <el-descriptions-item :label="$t('org.leader')">{{ selectedNode.leader || '-' }}</el-descriptions-item>
        <el-descriptions-item :label="$t('org.memberCount')">{{ selectedNode.memberCount || 0 }}</el-descriptions-item>
        <el-descriptions-item :label="$t('org.status')">
          <el-tag :type="selectedNode.status === 0 ? 'success' : 'danger'" size="small">
            {{ selectedNode.status === 0 ? $t('org.statusNormal') : $t('org.statusDisabled') }}
          </el-tag>
        </el-descriptions-item>
      </el-descriptions>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted, defineComponent, h } from 'vue'
import { ZoomIn, ZoomOut, RefreshRight } from '@element-plus/icons-vue'
import { useI18n } from 'vue-i18n'
import { structureApi } from '@/api/org'

const { t } = useI18n()
const chartWrapper = ref<HTMLElement>()
const treeData = ref<any[]>([])
const detailVisible = ref(false)
const selectedNode = ref<any>(null)

const transform = reactive({ scale: 1, x: 0, y: 0 })
const isDragging = ref(false)
const dragStart = reactive({ x: 0, y: 0 })

const contentStyle = computed(() => ({
  transform: `translate(${transform.x}px, ${transform.y}px) scale(${transform.scale})`,
  transformOrigin: 'center top'
}))

const zoomIn = () => { transform.scale = Math.min(transform.scale + 0.1, 2) }
const zoomOut = () => { transform.scale = Math.max(transform.scale - 0.1, 0.3) }
const resetZoom = () => { transform.scale = 1; transform.x = 0; transform.y = 0 }

const handleWheel = (e: WheelEvent) => {
  e.preventDefault()
  if (e.deltaY < 0) zoomIn()
  else zoomOut()
}

const startDrag = (e: MouseEvent) => {
  isDragging.value = true
  dragStart.x = e.clientX - transform.x
  dragStart.y = e.clientY - transform.y
  const onMove = (ev: MouseEvent) => {
    if (!isDragging.value) return
    transform.x = ev.clientX - dragStart.x
    transform.y = ev.clientY - dragStart.y
  }
  const onUp = () => {
    isDragging.value = false
    document.removeEventListener('mousemove', onMove)
    document.removeEventListener('mouseup', onUp)
  }
  document.addEventListener('mousemove', onMove)
  document.addEventListener('mouseup', onUp)
}

const handleNodeClick = (node: any) => {
  selectedNode.value = node
  detailVisible.value = true
}

const loadTree = async () => {
  try {
    const res = await structureApi.tree()
    treeData.value = res.data || []
  } catch (e) { console.error(e) }
}

onMounted(loadTree)
</script>

<script lang="ts">
// 递归组织节点组件
const OrgNode = defineComponent({
  name: 'OrgNode',
  props: { nodes: { type: Array as () => any[], default: () => [] } },
  emits: ['node-click'],
  setup(props, { emit }) {
    const handleClick = (node: any) => emit('node-click', node)
    return () => {
      if (!props.nodes.length) return null
      return h('ul', { class: 'org-tree-list' },
        props.nodes.map(node =>
          h('li', { key: node.id, class: 'org-tree-item' }, [
            h('div', {
              class: 'org-node-card',
              onClick: (e: Event) => { e.stopPropagation(); handleClick(node) }
            }, [
              h('div', { class: 'node-name' }, node.label),
              h('div', { class: 'node-info' }, [
                node.leader ? h('span', { class: 'node-leader' }, node.leader) : null,
                h('span', { class: 'node-count' }, `${node.memberCount || 0}人`)
              ])
            ]),
            node.children && node.children.length
              ? h(OrgNode, { nodes: node.children, 'onNode-click': handleClick })
              : null
          ])
        )
      )
    }
  }
})

export { OrgNode }
</script>

<style scoped>
.structure-page {
  display: flex;
  flex-direction: column;
  height: calc(100vh - 140px);
}
.toolbar {
  margin-bottom: 12px;
  flex-shrink: 0;
}
.org-chart-wrapper {
  flex: 1;
  overflow: hidden;
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 8px;
  background: var(--el-fill-color-lighter);
  cursor: grab;
  position: relative;
}
.org-chart-wrapper:active {
  cursor: grabbing;
}
.org-chart-content {
  display: inline-block;
  padding: 40px;
  min-width: 100%;
  min-height: 100%;
  transition: transform 0.1s ease;
}
.org-tree {
  display: flex;
  justify-content: center;
}
</style>

<style>
/* 组织架构树 CSS 样式 */
.org-tree-list {
  display: flex;
  padding: 0;
  margin: 0;
  list-style: none;
  position: relative;
  padding-top: 30px;
}
.org-tree-list::before {
  content: '';
  position: absolute;
  top: 0;
  left: 50%;
  width: 0;
  height: 30px;
  border-left: 2px solid #F26522;
}
.org-tree-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  position: relative;
  padding: 0 10px;
}
.org-tree-item::before,
.org-tree-item::after {
  content: '';
  position: absolute;
  top: 0;
  height: 30px;
  border-top: 2px solid #F26522;
}
.org-tree-item::before {
  left: 0;
  right: 50%;
  border-left: 2px solid #F26522;
}
.org-tree-item::after {
  left: 50%;
  right: 0;
  border-right: 2px solid #F26522;
}
.org-tree-item:first-child::before {
  border-left: none;
  left: 50%;
}
.org-tree-item:last-child::after {
  border-right: none;
  right: 50%;
}
.org-tree-item:only-child::before,
.org-tree-item:only-child::after {
  border-top: none;
}
.org-tree-list > .org-tree-item:only-child::before {
  border-left: 2px solid #F26522;
  left: 50%;
  right: auto;
  width: 0;
}
.org-node-card {
  padding: 12px 20px;
  background: #fff;
  border: 2px solid #F26522;
  border-radius: 8px;
  cursor: pointer;
  text-align: center;
  min-width: 120px;
  transition: all 0.2s;
  box-shadow: 0 2px 8px rgba(242, 101, 34, 0.1);
}
.org-node-card:hover {
  background: #FFF5F0;
  box-shadow: 0 4px 12px rgba(242, 101, 34, 0.2);
  transform: translateY(-2px);
}
.node-name {
  font-weight: 600;
  font-size: 14px;
  color: #333;
  margin-bottom: 4px;
}
.node-info {
  font-size: 12px;
  color: #666;
  display: flex;
  gap: 8px;
  justify-content: center;
}
.node-leader {
  color: #F26522;
}
.node-count {
  color: #999;
}
/* 子级列表 */
.org-tree-item > .org-tree-list {
  padding-top: 30px;
}
.org-tree-item > .org-tree-list::before {
  height: 30px;
}
</style>
