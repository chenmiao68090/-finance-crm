<template>
  <div class="workflow-designer">
    <!-- 流程列表视图 -->
    <div v-if="!showDesigner" class="process-list-view">
      <div class="page-header">
        <div class="page-header__left">
          <h2>{{ $t('workflow.processList') }}</h2>
        </div>
        <div class="page-header__right">
          <el-button type="primary" @click="handleCreate">
            <el-icon><Plus /></el-icon>
            {{ $t('workflow.createProcess') }}
          </el-button>
        </div>
      </div>

      <!-- 搜索栏 -->
      <div class="search-bar">
        <el-input v-model="searchName" :placeholder="$t('workflow.processName')" clearable style="width: 200px" />
        <el-select v-model="searchCategory" :placeholder="$t('workflow.category')" clearable style="width: 150px">
          <el-option label="考勤" value="attendance" />
          <el-option label="财务" value="finance" />
          <el-option label="供应链" value="supply" />
          <el-option label="行政" value="admin" />
        </el-select>
        <el-select v-model="searchStatus" :placeholder="$t('workflow.status')" clearable style="width: 120px">
          <el-option :label="$t('workflow.draft')" :value="0" />
          <el-option :label="$t('workflow.published')" :value="1" />
          <el-option :label="$t('workflow.disabled')" :value="2" />
        </el-select>
        <el-button type="primary" @click="loadList">{{ $t('common.search') }}</el-button>
        <el-button @click="resetSearch">{{ $t('common.reset') }}</el-button>
      </div>

      <!-- 预设模板 -->
      <div class="templates-section">
        <h3>{{ $t('workflow.templates') }}</h3>
        <div class="templates-grid">
          <div v-for="tpl in templates" :key="tpl.key" class="template-card" @click="useTemplate(tpl)">
            <div class="template-card__icon">
              <el-icon :size="28">
                <component :is="getTemplateIcon(tpl.key)" />
              </el-icon>
            </div>
            <div class="template-card__name">{{ getTemplateName(tpl.key) }}</div>
            <el-button size="small" type="primary" text>{{ $t('workflow.useTemplate') }}</el-button>
          </div>
        </div>
      </div>

      <!-- 流程表格 -->
      <el-table :data="processList" v-loading="loading" stripe>
        <el-table-column prop="name" :label="$t('workflow.processName')" min-width="160" />
        <el-table-column prop="processKey" :label="$t('workflow.processKey')" width="140" />
        <el-table-column prop="category" :label="$t('workflow.category')" width="100" />
        <el-table-column prop="version" :label="$t('workflow.version')" width="80" align="center">
          <template #default="{ row }">
            <el-tag size="small">v{{ row.version }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="status" :label="$t('workflow.status')" width="100" align="center">
          <template #default="{ row }">
            <el-tag :type="getStatusType(row.status)" size="small">{{ getStatusLabel(row.status) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="createTime" label="创建时间" width="170" />
        <el-table-column :label="$t('common.edit')" width="240" fixed="right">
          <template #default="{ row }">
            <el-button size="small" type="primary" text @click="openDesigner(row)">{{ $t('workflow.design') }}</el-button>
            <el-button v-if="row.status !== 1" size="small" type="success" text @click="handlePublish(row)">{{ $t('workflow.publish') }}</el-button>
            <el-button v-if="row.status === 1" size="small" type="warning" text @click="handleDisable(row)">{{ $t('workflow.disable') }}</el-button>
            <el-button size="small" type="danger" text @click="handleDelete(row)">{{ $t('common.delete') }}</el-button>
          </template>
        </el-table-column>
      </el-table>
    </div>

    <!-- 流程设计器视图 -->
    <div v-else class="designer-view">
      <div class="designer-header">
        <el-button @click="closeDesigner"><el-icon><ArrowLeft /></el-icon> {{ $t('common.back') }}</el-button>
        <h3>{{ editingProcess.name || $t('workflow.designer') }}</h3>
        <el-button type="primary" @click="saveProcess">{{ $t('common.save') }}</el-button>
      </div>

      <!-- 基本信息表单 -->
      <el-collapse v-model="activeCollapse">
        <el-collapse-item name="basic" :title="$t('workflow.processConfig')">
          <el-form :model="editingProcess" label-width="100px" style="max-width: 500px">
            <el-form-item :label="$t('workflow.processName')">
              <el-input v-model="editingProcess.name" />
            </el-form-item>
            <el-form-item :label="$t('workflow.processKey')">
              <el-input v-model="editingProcess.processKey" :disabled="!!editingProcess.id" />
            </el-form-item>
            <el-form-item :label="$t('workflow.category')">
              <el-select v-model="editingProcess.category">
                <el-option label="考勤" value="attendance" />
                <el-option label="财务" value="finance" />
                <el-option label="供应链" value="supply" />
                <el-option label="行政" value="admin" />
              </el-select>
            </el-form-item>
            <el-form-item :label="$t('workflow.description')">
              <el-input v-model="editingProcess.description" type="textarea" :rows="2" />
            </el-form-item>
          </el-form>
        </el-collapse-item>
      </el-collapse>

      <!-- 流程节点设计器 (钉钉审批风格) -->
      <div class="flow-designer">
        <div class="flow-designer__canvas">
          <div v-for="(node, index) in designerNodes" :key="node.id" class="flow-node-wrapper">
            <!-- 节点卡片 -->
            <div class="flow-node" :class="['flow-node--' + node.type]" @click="editNode(node)">
              <div class="flow-node__header">
                <span class="flow-node__title">{{ node.name }}</span>
                <el-icon v-if="node.type !== 'start' && node.type !== 'end'" class="flow-node__delete" @click.stop="removeNode(index)"><Close /></el-icon>
              </div>
              <div class="flow-node__body">
                <template v-if="node.type === 'start'">
                  <span class="flow-node__desc">{{ $t('workflow.initiator') }}</span>
                </template>
                <template v-else-if="node.type === 'approval'">
                  <span class="flow-node__desc">{{ getAssigneeLabel(node) }}</span>
                </template>
                <template v-else-if="node.type === 'condition'">
                  <span class="flow-node__desc">{{ node.conditions?.length || 0 }} {{ $t('workflow.addCondition') }}</span>
                </template>
                <template v-else-if="node.type === 'end'">
                  <span class="flow-node__desc">{{ $t('workflow.endNode') }}</span>
                </template>
              </div>
            </div>

            <!-- 添加节点按钮 (在两个节点之间) -->
            <div v-if="index < designerNodes.length - 1" class="flow-add-btn">
              <div class="flow-line"></div>
              <el-dropdown trigger="click" @command="(cmd: string) => addNode(index, cmd)">
                <el-button circle size="small" type="primary" class="flow-add-btn__trigger">
                  <el-icon><Plus /></el-icon>
                </el-button>
                <template #dropdown>
                  <el-dropdown-menu>
                    <el-dropdown-item command="approval">{{ $t('workflow.approvalNode') }}</el-dropdown-item>
                    <el-dropdown-item command="condition">{{ $t('workflow.conditionNode') }}</el-dropdown-item>
                  </el-dropdown-menu>
                </template>
              </el-dropdown>
              <div class="flow-line"></div>
            </div>
          </div>
        </div>
      </div>

      <!-- 节点编辑弹窗 -->
      <el-dialog v-model="nodeDialogVisible" :title="$t('workflow.nodeConfig')" width="500px">
        <el-form v-if="editingNode" :model="editingNode" label-width="100px">
          <el-form-item :label="$t('workflow.nodeName')">
            <el-input v-model="editingNode.name" />
          </el-form-item>
          <template v-if="editingNode.type === 'approval'">
            <el-form-item :label="$t('workflow.assigneeType')">
              <el-select v-model="editingNode.assigneeType">
                <el-option :label="$t('workflow.specifyUser')" value="user" />
                <el-option :label="$t('workflow.specifyRole')" value="role" />
                <el-option :label="$t('workflow.deptLeader')" value="dept_leader" />
              </el-select>
            </el-form-item>
            <el-form-item :label="$t('workflow.assignee')">
              <el-input v-model="editingNode.assigneeValue" :placeholder="editingNode.assigneeType === 'user' ? '用户ID' : '角色标识'" />
            </el-form-item>
          </template>
          <template v-if="editingNode.type === 'condition'">
            <div v-for="(cond, ci) in editingNode.conditions" :key="ci" class="condition-row">
              <el-input v-model="cond.expression" :placeholder="'如: amount > 5000'" style="flex: 1" />
              <el-input v-model="cond.nextNode" placeholder="目标节点ID" style="width: 120px; margin-left: 8px" />
              <el-button type="danger" text @click="editingNode.conditions.splice(ci, 1)"><el-icon><Delete /></el-icon></el-button>
            </div>
            <el-button type="primary" text @click="editingNode.conditions.push({ expression: '', nextNode: '' })">
              + {{ $t('workflow.addCondition') }}
            </el-button>
          </template>
        </el-form>
        <template #footer>
          <el-button @click="nodeDialogVisible = false">{{ $t('common.cancel') }}</el-button>
          <el-button type="primary" @click="saveNodeConfig">{{ $t('common.confirm') }}</el-button>
        </template>
      </el-dialog>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus, ArrowLeft, Close, Delete, Calendar, Money, ShoppingCart, Stamp } from '@element-plus/icons-vue'
import { processApi, type ProcessDef, type ProcessTemplate } from '@/api/workflow'

const { t } = useI18n()

// 列表状态
const loading = ref(false)
const processList = ref<ProcessDef[]>([])
const templates = ref<ProcessTemplate[]>([])
const searchName = ref('')
const searchCategory = ref('')
const searchStatus = ref<number | undefined>(undefined)

// 设计器状态
const showDesigner = ref(false)
const activeCollapse = ref(['basic'])
const editingProcess = reactive<any>({
  id: null,
  name: '',
  processKey: '',
  category: '',
  description: '',
  formConfig: '[]',
  processConfig: ''
})

interface DesignerNode {
  id: string
  type: string
  name: string
  assigneeType?: string
  assigneeValue?: string
  conditions?: Array<{ expression: string; nextNode: string }>
}

const designerNodes = ref<DesignerNode[]>([
  { id: 'start', type: 'start', name: '开始' },
  { id: 'end', type: 'end', name: '结束' }
])

const nodeDialogVisible = ref(false)
const editingNode = ref<DesignerNode | null>(null)

onMounted(() => {
  loadList()
  loadTemplates()
})

async function loadList() {
  loading.value = true
  try {
    const params: any = {}
    if (searchName.value) params.name = searchName.value
    if (searchCategory.value) params.category = searchCategory.value
    if (searchStatus.value !== undefined) params.status = searchStatus.value
    const res = await processApi.list(params)
    processList.value = (res as any).data || res || []
  } catch (e) { /* ignore */ }
  loading.value = false
}

async function loadTemplates() {
  try {
    const res = await processApi.templates()
    templates.value = (res as any).data || res || []
  } catch (e) { /* ignore */ }
}

function resetSearch() {
  searchName.value = ''
  searchCategory.value = ''
  searchStatus.value = undefined
  loadList()
}

function getStatusType(status: number) {
  switch (status) {
    case 0: return 'info'
    case 1: return 'success'
    case 2: return 'warning'
    default: return 'info'
  }
}

function getStatusLabel(status: number) {
  switch (status) {
    case 0: return t('workflow.draft')
    case 1: return t('workflow.published')
    case 2: return t('workflow.disabled')
    default: return ''
  }
}

function getTemplateIcon(key: string) {
  switch (key) {
    case 'leave': return Calendar
    case 'expense': return Money
    case 'purchase': return ShoppingCart
    case 'seal': return Stamp
    default: return Calendar
  }
}

function getTemplateName(key: string) {
  switch (key) {
    case 'leave': return t('workflow.leaveApproval')
    case 'expense': return t('workflow.expenseApproval')
    case 'purchase': return t('workflow.purchaseApproval')
    case 'seal': return t('workflow.sealApproval')
    default: return key
  }
}

function handleCreate() {
  Object.assign(editingProcess, { id: null, name: '', processKey: '', category: '', description: '', formConfig: '[]', processConfig: '' })
  designerNodes.value = [
    { id: 'start', type: 'start', name: '开始' },
    { id: 'end', type: 'end', name: '结束' }
  ]
  showDesigner.value = true
}

function useTemplate(tpl: ProcessTemplate) {
  Object.assign(editingProcess, {
    id: null,
    name: tpl.name,
    processKey: tpl.key,
    category: tpl.category,
    description: '',
    formConfig: tpl.formConfig,
    processConfig: tpl.processConfig
  })
  // 解析节点
  try {
    const config = JSON.parse(tpl.processConfig)
    designerNodes.value = config.nodes || []
  } catch (e) {
    designerNodes.value = [
      { id: 'start', type: 'start', name: '开始' },
      { id: 'end', type: 'end', name: '结束' }
    ]
  }
  showDesigner.value = true
}

function openDesigner(row: ProcessDef) {
  Object.assign(editingProcess, {
    id: row.id,
    name: row.name,
    processKey: row.processKey,
    category: row.category,
    description: row.description,
    formConfig: row.formConfig || '[]',
    processConfig: row.processConfig || ''
  })
  try {
    const config = JSON.parse(row.processConfig || '{}')
    designerNodes.value = config.nodes || [
      { id: 'start', type: 'start', name: '开始' },
      { id: 'end', type: 'end', name: '结束' }
    ]
  } catch (e) {
    designerNodes.value = [
      { id: 'start', type: 'start', name: '开始' },
      { id: 'end', type: 'end', name: '结束' }
    ]
  }
  showDesigner.value = true
}

function closeDesigner() {
  showDesigner.value = false
}

function addNode(afterIndex: number, type: string) {
  const newId = 'node_' + Date.now()
  const node: DesignerNode = {
    id: newId,
    type,
    name: type === 'approval' ? t('workflow.approvalNode') : t('workflow.conditionNode'),
    assigneeType: type === 'approval' ? 'role' : undefined,
    assigneeValue: type === 'approval' ? 'dept_leader' : undefined,
    conditions: type === 'condition' ? [] : undefined
  }
  designerNodes.value.splice(afterIndex + 1, 0, node)
}

function removeNode(index: number) {
  designerNodes.value.splice(index, 1)
}

function editNode(node: DesignerNode) {
  if (node.type === 'start' || node.type === 'end') return
  editingNode.value = { ...node, conditions: node.conditions ? [...node.conditions] : [] }
  nodeDialogVisible.value = true
}

function saveNodeConfig() {
  if (!editingNode.value) return
  const idx = designerNodes.value.findIndex(n => n.id === editingNode.value!.id)
  if (idx >= 0) {
    designerNodes.value[idx] = { ...editingNode.value }
  }
  nodeDialogVisible.value = false
}

function getAssigneeLabel(node: DesignerNode) {
  if (node.assigneeType === 'user') return t('workflow.specifyUser') + ': ' + node.assigneeValue
  if (node.assigneeType === 'role') return t('workflow.specifyRole') + ': ' + node.assigneeValue
  if (node.assigneeType === 'dept_leader') return t('workflow.deptLeader')
  return ''
}

function buildProcessConfig() {
  const nodes = designerNodes.value
  const edges: Array<{ from: string; to: string }> = []
  for (let i = 0; i < nodes.length - 1; i++) {
    if (nodes[i].type === 'condition' && nodes[i].conditions) {
      for (const cond of nodes[i].conditions!) {
        if (cond.nextNode) {
          edges.push({ from: nodes[i].id, to: cond.nextNode })
        }
      }
    } else {
      edges.push({ from: nodes[i].id, to: nodes[i + 1].id })
    }
  }
  return JSON.stringify({ nodes, edges })
}

async function saveProcess() {
  editingProcess.processConfig = buildProcessConfig()
  try {
    if (editingProcess.id) {
      await processApi.update(editingProcess)
    } else {
      await processApi.create(editingProcess)
    }
    ElMessage.success(t('common.success'))
    closeDesigner()
    loadList()
  } catch (e: any) {
    ElMessage.error(e.message || t('common.failed'))
  }
}

async function handlePublish(row: ProcessDef) {
  await ElMessageBox.confirm(t('workflow.confirmPublish'), t('common.confirm'))
  try {
    await processApi.publish(row.id)
    ElMessage.success(t('common.success'))
    loadList()
  } catch (e: any) {
    ElMessage.error(e.message || t('common.failed'))
  }
}

async function handleDisable(row: ProcessDef) {
  await ElMessageBox.confirm(t('workflow.confirmDisable'), t('common.confirm'))
  try {
    await processApi.disable(row.id)
    ElMessage.success(t('common.success'))
    loadList()
  } catch (e: any) {
    ElMessage.error(e.message || t('common.failed'))
  }
}

function handleDelete(row: ProcessDef) {
  ElMessage.info('删除功能待实现')
}
</script>

<style scoped>
.workflow-designer {
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
.search-bar {
  display: flex;
  gap: 12px;
  margin-bottom: 20px;
  flex-wrap: wrap;
}
.templates-section {
  margin-bottom: 24px;
}
.templates-section h3 {
  margin: 0 0 12px 0;
  font-size: 15px;
  color: var(--el-text-color-primary);
}
.templates-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
  gap: 12px;
}
.template-card {
  padding: 16px;
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 8px;
  text-align: center;
  cursor: pointer;
  transition: all 0.3s;
}
.template-card:hover {
  border-color: #F26522;
  box-shadow: 0 2px 12px rgba(242, 101, 34, 0.15);
}
.template-card__icon {
  color: #F26522;
  margin-bottom: 8px;
}
.template-card__name {
  font-size: 14px;
  font-weight: 500;
  margin-bottom: 8px;
}

/* 设计器样式 */
.designer-header {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 20px;
  padding-bottom: 16px;
  border-bottom: 1px solid var(--el-border-color-lighter);
}
.designer-header h3 {
  flex: 1;
  margin: 0;
}
.flow-designer {
  margin-top: 24px;
  display: flex;
  justify-content: center;
}
.flow-designer__canvas {
  display: flex;
  flex-direction: column;
  align-items: center;
  min-width: 320px;
}
.flow-node-wrapper {
  display: flex;
  flex-direction: column;
  align-items: center;
}
.flow-node {
  width: 280px;
  border-radius: 8px;
  overflow: hidden;
  cursor: pointer;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  transition: all 0.3s;
}
.flow-node:hover {
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.12);
}
.flow-node__header {
  padding: 8px 12px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  color: #fff;
  font-size: 13px;
  font-weight: 500;
}
.flow-node--start .flow-node__header { background: #67c23a; }
.flow-node--end .flow-node__header { background: #909399; }
.flow-node--approval .flow-node__header { background: #F26522; }
.flow-node--condition .flow-node__header { background: #e6a23c; }
.flow-node__delete {
  cursor: pointer;
  opacity: 0.8;
}
.flow-node__delete:hover { opacity: 1; }
.flow-node__body {
  padding: 12px;
  background: #fff;
  min-height: 32px;
}
.flow-node__desc {
  font-size: 12px;
  color: var(--el-text-color-secondary);
}
.flow-add-btn {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 4px 0;
}
.flow-line {
  width: 2px;
  height: 16px;
  background: var(--el-border-color);
}
.flow-add-btn__trigger {
  z-index: 1;
}
.condition-row {
  display: flex;
  align-items: center;
  margin-bottom: 8px;
}
</style>
