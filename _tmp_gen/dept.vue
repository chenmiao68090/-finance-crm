<template>
  <div class="page-container dept-page">
    <div class="dept-layout">
      <!-- 左侧部门树 -->
      <div class="dept-tree-panel">
        <div class="panel-header">
          <span>{{ $t('org.deptTree') }}</span>
          <el-button type="primary" size="small" @click="handleAddRoot">
            <el-icon><Plus /></el-icon>
          </el-button>
        </div>
        <el-input v-model="treeFilter" :placeholder="$t('org.searchDept')" clearable class="tree-filter" />
        <el-tree
          ref="treeRef"
          :data="deptTree"
          :props="{ label: 'deptName', children: 'children' }"
          node-key="id"
          default-expand-all
          highlight-current
          :filter-node-method="filterNode"
          @node-click="handleNodeClick"
        >
          <template #default="{ data }">
            <span class="tree-node">
              <span>{{ data.deptName }}</span>
              <span class="tree-actions">
                <el-icon class="action-icon" @click.stop="handleAdd(data)"><Plus /></el-icon>
                <el-icon class="action-icon" @click.stop="handleEdit(data)"><Edit /></el-icon>
                <el-icon class="action-icon danger" @click.stop="handleDelete(data)"><Delete /></el-icon>
              </span>
            </span>
          </template>
        </el-tree>
      </div>

      <!-- 右侧详情 -->
      <div class="dept-detail-panel">
        <template v-if="currentDept">
          <div class="detail-header">
            <h3>{{ currentDept.deptName }}</h3>
            <el-tag :type="currentDept.status === 0 ? 'success' : 'danger'" size="small">
              {{ currentDept.status === 0 ? $t('org.statusNormal') : $t('org.statusDisabled') }}
            </el-tag>
          </div>
          <el-descriptions :column="2" border>
            <el-descriptions-item :label="$t('org.deptName')">{{ currentDept.deptName }}</el-descriptions-item>
            <el-descriptions-item :label="$t('org.leader')">{{ currentDept.leader || '-' }}</el-descriptions-item>
            <el-descriptions-item :label="$t('org.phone')">{{ currentDept.phone || '-' }}</el-descriptions-item>
            <el-descriptions-item :label="$t('org.email')">{{ currentDept.email || '-' }}</el-descriptions-item>
            <el-descriptions-item :label="$t('org.sort')">{{ currentDept.orderNum }}</el-descriptions-item>
            <el-descriptions-item :label="$t('org.status')">
              {{ currentDept.status === 0 ? $t('org.statusNormal') : $t('org.statusDisabled') }}
            </el-descriptions-item>
          </el-descriptions>

          <div class="sub-dept-section" v-if="currentDept.children && currentDept.children.length">
            <h4>{{ $t('org.subDepts') }}</h4>
            <el-table :data="currentDept.children" stripe size="small">
              <el-table-column prop="deptName" :label="$t('org.deptName')" />
              <el-table-column prop="leader" :label="$t('org.leader')" />
              <el-table-column prop="orderNum" :label="$t('org.sort')" width="80" />
              <el-table-column prop="status" :label="$t('org.status')" width="80">
                <template #default="{ row }">
                  <el-tag :type="row.status === 0 ? 'success' : 'danger'" size="small">
                    {{ row.status === 0 ? $t('org.statusNormal') : $t('org.statusDisabled') }}
                  </el-tag>
                </template>
              </el-table-column>
            </el-table>
          </div>
        </template>
        <el-empty v-else :description="$t('org.selectDeptTip')" />
      </div>
    </div>

    <!-- 新增/编辑弹窗 -->
    <el-dialog v-model="dialogVisible" :title="dialogTitle" width="500px" destroy-on-close>
      <el-form ref="formRef" :model="formData" :rules="rules" label-width="100px">
        <el-form-item :label="$t('org.parentDept')" prop="parentId">
          <el-tree-select
            v-model="formData.parentId"
            :data="deptTree"
            :props="{ label: 'deptName', value: 'id', children: 'children' }"
            :placeholder="$t('org.selectParentDept')"
            check-strictly
            clearable
            style="width: 100%"
          />
        </el-form-item>
        <el-form-item :label="$t('org.deptName')" prop="deptName">
          <el-input v-model="formData.deptName" :placeholder="$t('org.inputDeptName')" />
        </el-form-item>
        <el-form-item :label="$t('org.sort')" prop="orderNum">
          <el-input-number v-model="formData.orderNum" :min="0" controls-position="right" />
        </el-form-item>
        <el-form-item :label="$t('org.leader')">
          <el-input v-model="formData.leader" :placeholder="$t('org.inputLeader')" />
        </el-form-item>
        <el-form-item :label="$t('org.phone')">
          <el-input v-model="formData.phone" :placeholder="$t('org.inputPhone')" />
        </el-form-item>
        <el-form-item :label="$t('org.email')">
          <el-input v-model="formData.email" :placeholder="$t('org.inputEmail')" />
        </el-form-item>
        <el-form-item :label="$t('org.status')">
          <el-radio-group v-model="formData.status">
            <el-radio :value="0">{{ $t('org.statusNormal') }}</el-radio>
            <el-radio :value="1">{{ $t('org.statusDisabled') }}</el-radio>
          </el-radio-group>
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
import { ref, watch, nextTick } from 'vue'
import { ElMessage, ElMessageBox, type FormInstance } from 'element-plus'
import { Plus, Edit, Delete } from '@element-plus/icons-vue'
import { useI18n } from 'vue-i18n'
import { deptApi } from '@/api/org'

const { t } = useI18n()
const treeRef = ref()
const formRef = ref<FormInstance>()
const deptTree = ref<any[]>([])
const currentDept = ref<any>(null)
const treeFilter = ref('')
const dialogVisible = ref(false)
const dialogTitle = ref('')
const isEdit = ref(false)

const formData = ref({
  id: undefined as number | undefined,
  parentId: 0 as number,
  deptName: '',
  orderNum: 0,
  leader: '',
  phone: '',
  email: '',
  status: 0
})

const rules = {
  deptName: [{ required: true, message: t('org.inputDeptName'), trigger: 'blur' }],
  orderNum: [{ required: true, message: t('org.inputSort'), trigger: 'blur' }]
}

watch(treeFilter, (val) => {
  treeRef.value?.filter(val)
})

const filterNode = (value: string, data: any) => {
  if (!value) return true
  return data.deptName.includes(value)
}

const loadTree = async () => {
  try {
    const res = await deptApi.tree()
    deptTree.value = res.data || []
  } catch (e) {
    console.error(e)
  }
}

const handleNodeClick = (data: any) => {
  currentDept.value = data
}

const resetForm = () => {
  formData.value = { id: undefined, parentId: 0, deptName: '', orderNum: 0, leader: '', phone: '', email: '', status: 0 }
}

const handleAddRoot = () => {
  isEdit.value = false
  dialogTitle.value = t('org.addDept')
  resetForm()
  dialogVisible.value = true
}

const handleAdd = (data: any) => {
  isEdit.value = false
  dialogTitle.value = t('org.addDept')
  resetForm()
  formData.value.parentId = data.id
  dialogVisible.value = true
}

const handleEdit = (data: any) => {
  isEdit.value = true
  dialogTitle.value = t('org.editDept')
  formData.value = { ...data }
  dialogVisible.value = true
}

const handleDelete = (data: any) => {
  ElMessageBox.confirm(t('org.confirmDeleteDept'), t('common.confirm'), { type: 'warning' })
    .then(async () => {
      await deptApi.remove(data.id)
      ElMessage.success(t('common.success'))
      loadTree()
      if (currentDept.value?.id === data.id) currentDept.value = null
    })
    .catch(() => {})
}

const submitForm = async () => {
  const valid = await formRef.value?.validate().catch(() => false)
  if (!valid) return
  try {
    if (isEdit.value) {
      await deptApi.update(formData.value)
    } else {
      await deptApi.create(formData.value)
    }
    ElMessage.success(t('common.success'))
    dialogVisible.value = false
    loadTree()
  } catch (e) {
    console.error(e)
  }
}

loadTree()
</script>

<style scoped>
.dept-layout {
  display: flex;
  gap: 16px;
  height: calc(100vh - 140px);
}
.dept-tree-panel {
  width: 300px;
  flex-shrink: 0;
  background: var(--el-bg-color);
  border-radius: 8px;
  padding: 16px;
  overflow-y: auto;
  border: 1px solid var(--el-border-color-lighter);
}
.panel-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
  font-weight: 600;
  font-size: 15px;
}
.tree-filter {
  margin-bottom: 12px;
}
.tree-node {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 14px;
  padding-right: 8px;
}
.tree-actions {
  display: none;
}
.tree-node:hover .tree-actions {
  display: inline-flex;
  gap: 4px;
}
.action-icon {
  font-size: 14px;
  color: var(--el-color-primary);
  cursor: pointer;
}
.action-icon.danger {
  color: var(--el-color-danger);
}
.dept-detail-panel {
  flex: 1;
  background: var(--el-bg-color);
  border-radius: 8px;
  padding: 24px;
  border: 1px solid var(--el-border-color-lighter);
  overflow-y: auto;
}
.detail-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 20px;
}
.detail-header h3 {
  margin: 0;
}
.sub-dept-section {
  margin-top: 24px;
}
.sub-dept-section h4 {
  margin-bottom: 12px;
  color: var(--el-text-color-regular);
}
</style>
