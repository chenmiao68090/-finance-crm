<template>
  <div class="page-container">
    <!-- 搜索栏 -->
    <div class="search-bar">
      <el-form :model="queryParams" inline>
        <el-form-item :label="$t('org.empName')">
          <el-input v-model="queryParams.name" :placeholder="$t('org.inputEmpName')" clearable @keyup.enter="handleSearch" />
        </el-form-item>
        <el-form-item :label="$t('org.deptName')">
          <el-tree-select
            v-model="queryParams.deptId"
            :data="deptTree"
            :props="{ label: 'deptName', value: 'id', children: 'children' }"
            :placeholder="$t('org.selectDept')"
            check-strictly
            clearable
            style="width: 180px"
          />
        </el-form-item>
        <el-form-item :label="$t('org.postName')">
          <el-select v-model="queryParams.postId" :placeholder="$t('org.selectPost')" clearable style="width: 150px">
            <el-option v-for="p in postList" :key="p.id" :label="p.postName" :value="p.id" />
          </el-select>
        </el-form-item>
        <el-form-item :label="$t('org.status')">
          <el-select v-model="queryParams.status" :placeholder="$t('org.selectStatus')" clearable style="width: 120px">
            <el-option :label="$t('org.empStatusActive')" :value="1" />
            <el-option :label="$t('org.empStatusTrial')" :value="2" />
            <el-option :label="$t('org.empStatusLeft')" :value="3" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleSearch">{{ $t('common.search') }}</el-button>
          <el-button @click="handleReset">{{ $t('common.reset') }}</el-button>
        </el-form-item>
      </el-form>
      <el-button type="primary" @click="handleAdd">
        <el-icon><Plus /></el-icon>{{ $t('common.add') }}
      </el-button>
    </div>

    <!-- 数据表格 -->
    <el-table :data="tableData" v-loading="loading" stripe border @row-click="handleRowClick">
      <el-table-column prop="empCode" :label="$t('org.empCode')" width="120" />
      <el-table-column prop="name" :label="$t('org.empName')" width="100" />
      <el-table-column prop="deptName" :label="$t('org.deptName')" width="140" />
      <el-table-column prop="postName" :label="$t('org.postName')" width="140" />
      <el-table-column prop="phone" :label="$t('org.phone')" width="130" />
      <el-table-column prop="hireDate" :label="$t('org.hireDate')" width="120" />
      <el-table-column prop="status" :label="$t('org.status')" width="90" align="center">
        <template #default="{ row }">
          <el-tag :type="empStatusType(row.status)" size="small">{{ empStatusText(row.status) }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column :label="$t('org.actions')" width="160" align="center" fixed="right">
        <template #default="{ row }">
          <el-button type="primary" link size="small" @click.stop="handleEdit(row)">{{ $t('common.edit') }}</el-button>
          <el-button type="danger" link size="small" @click.stop="handleDelete(row)">{{ $t('common.delete') }}</el-button>
        </template>
      </el-table-column>
    </el-table>

    <!-- 分页 -->
    <div class="pagination-wrap">
      <el-pagination
        v-model:current-page="queryParams.pageNum"
        v-model:page-size="queryParams.pageSize"
        :total="total"
        :page-sizes="[10, 20, 50]"
        layout="total, sizes, prev, pager, next, jumper"
        @size-change="loadData"
        @current-change="loadData"
      />
    </div>

    <!-- 新增/编辑弹窗 -->
    <el-dialog v-model="dialogVisible" :title="dialogTitle" width="700px" destroy-on-close>
      <el-form ref="formRef" :model="formData" :rules="rules" label-width="100px">
        <el-tabs v-model="activeTab">
          <el-tab-pane :label="$t('org.tabBasic')" name="basic">
            <el-row :gutter="16">
              <el-col :span="12">
                <el-form-item :label="$t('org.empName')" prop="name">
                  <el-input v-model="formData.name" />
                </el-form-item>
              </el-col>
              <el-col :span="12">
                <el-form-item :label="$t('org.gender')">
                  <el-radio-group v-model="formData.gender">
                    <el-radio :value="0">{{ $t('org.male') }}</el-radio>
                    <el-radio :value="1">{{ $t('org.female') }}</el-radio>
                  </el-radio-group>
                </el-form-item>
              </el-col>
              <el-col :span="12">
                <el-form-item :label="$t('org.birthDate')">
                  <el-date-picker v-model="formData.birthDate" type="date" value-format="YYYY-MM-DD" style="width: 100%" />
                </el-form-item>
              </el-col>
              <el-col :span="12">
                <el-form-item :label="$t('org.idCard')">
                  <el-input v-model="formData.idCard" />
                </el-form-item>
              </el-col>
              <el-col :span="12">
                <el-form-item :label="$t('org.phone')">
                  <el-input v-model="formData.phone" />
                </el-form-item>
              </el-col>
              <el-col :span="12">
                <el-form-item :label="$t('org.email')">
                  <el-input v-model="formData.email" />
                </el-form-item>
              </el-col>
              <el-col :span="24">
                <el-form-item :label="$t('org.address')">
                  <el-input v-model="formData.address" />
                </el-form-item>
              </el-col>
            </el-row>
          </el-tab-pane>

          <el-tab-pane :label="$t('org.tabPosition')" name="position">
            <el-row :gutter="16">
              <el-col :span="12">
                <el-form-item :label="$t('org.empCode')" prop="empCode">
                  <el-input v-model="formData.empCode" />
                </el-form-item>
              </el-col>
              <el-col :span="12">
                <el-form-item :label="$t('org.deptName')" prop="deptId">
                  <el-tree-select
                    v-model="formData.deptId"
                    :data="deptTree"
                    :props="{ label: 'deptName', value: 'id', children: 'children' }"
                    check-strictly
                    style="width: 100%"
                  />
                </el-form-item>
              </el-col>
              <el-col :span="12">
                <el-form-item :label="$t('org.postName')" prop="postId">
                  <el-select v-model="formData.postId" style="width: 100%">
                    <el-option v-for="p in postList" :key="p.id" :label="p.postName" :value="p.id" />
                  </el-select>
                </el-form-item>
              </el-col>
              <el-col :span="12">
                <el-form-item :label="$t('org.hireDate')">
                  <el-date-picker v-model="formData.hireDate" type="date" value-format="YYYY-MM-DD" style="width: 100%" />
                </el-form-item>
              </el-col>
              <el-col :span="12">
                <el-form-item :label="$t('org.regularDate')">
                  <el-date-picker v-model="formData.regularDate" type="date" value-format="YYYY-MM-DD" style="width: 100%" />
                </el-form-item>
              </el-col>
              <el-col :span="12">
                <el-form-item :label="$t('org.status')">
                  <el-select v-model="formData.status" style="width: 100%">
                    <el-option :label="$t('org.empStatusActive')" :value="1" />
                    <el-option :label="$t('org.empStatusTrial')" :value="2" />
                    <el-option :label="$t('org.empStatusLeft')" :value="3" />
                  </el-select>
                </el-form-item>
              </el-col>
            </el-row>
          </el-tab-pane>

          <el-tab-pane :label="$t('org.tabContract')" name="contract">
            <el-row :gutter="16">
              <el-col :span="12">
                <el-form-item :label="$t('org.contractStart')">
                  <el-date-picker v-model="formData.contractStart" type="date" value-format="YYYY-MM-DD" style="width: 100%" />
                </el-form-item>
              </el-col>
              <el-col :span="12">
                <el-form-item :label="$t('org.contractEnd')">
                  <el-date-picker v-model="formData.contractEnd" type="date" value-format="YYYY-MM-DD" style="width: 100%" />
                </el-form-item>
              </el-col>
            </el-row>
          </el-tab-pane>

          <el-tab-pane :label="$t('org.tabEducation')" name="education">
            <el-row :gutter="16">
              <el-col :span="12">
                <el-form-item :label="$t('org.education')">
                  <el-select v-model="formData.education" style="width: 100%">
                    <el-option label="博士" value="博士" />
                    <el-option label="硕士" value="硕士" />
                    <el-option label="本科" value="本科" />
                    <el-option label="大专" value="大专" />
                    <el-option label="高中" value="高中" />
                    <el-option label="其他" value="其他" />
                  </el-select>
                </el-form-item>
              </el-col>
              <el-col :span="12">
                <el-form-item :label="$t('org.university')">
                  <el-input v-model="formData.university" />
                </el-form-item>
              </el-col>
              <el-col :span="12">
                <el-form-item :label="$t('org.major')">
                  <el-input v-model="formData.major" />
                </el-form-item>
              </el-col>
            </el-row>
          </el-tab-pane>

          <el-tab-pane :label="$t('org.tabEmergency')" name="emergency">
            <el-row :gutter="16">
              <el-col :span="12">
                <el-form-item :label="$t('org.emergencyContact')">
                  <el-input v-model="formData.emergencyContact" />
                </el-form-item>
              </el-col>
              <el-col :span="12">
                <el-form-item :label="$t('org.emergencyPhone')">
                  <el-input v-model="formData.emergencyPhone" />
                </el-form-item>
              </el-col>
            </el-row>
          </el-tab-pane>
        </el-tabs>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">{{ $t('common.cancel') }}</el-button>
        <el-button type="primary" @click="submitForm">{{ $t('common.confirm') }}</el-button>
      </template>
    </el-dialog>

    <!-- 员工详情抽屉 -->
    <el-drawer v-model="drawerVisible" :title="$t('org.empDetail')" size="500px">
      <template v-if="detailData">
        <el-descriptions :column="1" border>
          <el-descriptions-item :label="$t('org.empCode')">{{ detailData.empCode }}</el-descriptions-item>
          <el-descriptions-item :label="$t('org.empName')">{{ detailData.name }}</el-descriptions-item>
          <el-descriptions-item :label="$t('org.gender')">{{ detailData.gender === 0 ? $t('org.male') : $t('org.female') }}</el-descriptions-item>
          <el-descriptions-item :label="$t('org.birthDate')">{{ detailData.birthDate || '-' }}</el-descriptions-item>
          <el-descriptions-item :label="$t('org.idCard')">{{ detailData.idCard || '-' }}</el-descriptions-item>
          <el-descriptions-item :label="$t('org.phone')">{{ detailData.phone || '-' }}</el-descriptions-item>
          <el-descriptions-item :label="$t('org.email')">{{ detailData.email || '-' }}</el-descriptions-item>
          <el-descriptions-item :label="$t('org.address')">{{ detailData.address || '-' }}</el-descriptions-item>
          <el-descriptions-item :label="$t('org.deptName')">{{ detailData.deptName || '-' }}</el-descriptions-item>
          <el-descriptions-item :label="$t('org.postName')">{{ detailData.postName || '-' }}</el-descriptions-item>
          <el-descriptions-item :label="$t('org.hireDate')">{{ detailData.hireDate || '-' }}</el-descriptions-item>
          <el-descriptions-item :label="$t('org.regularDate')">{{ detailData.regularDate || '-' }}</el-descriptions-item>
          <el-descriptions-item :label="$t('org.contractStart')">{{ detailData.contractStart || '-' }}</el-descriptions-item>
          <el-descriptions-item :label="$t('org.contractEnd')">{{ detailData.contractEnd || '-' }}</el-descriptions-item>
          <el-descriptions-item :label="$t('org.education')">{{ detailData.education || '-' }}</el-descriptions-item>
          <el-descriptions-item :label="$t('org.university')">{{ detailData.university || '-' }}</el-descriptions-item>
          <el-descriptions-item :label="$t('org.major')">{{ detailData.major || '-' }}</el-descriptions-item>
          <el-descriptions-item :label="$t('org.emergencyContact')">{{ detailData.emergencyContact || '-' }}</el-descriptions-item>
          <el-descriptions-item :label="$t('org.emergencyPhone')">{{ detailData.emergencyPhone || '-' }}</el-descriptions-item>
        </el-descriptions>
      </template>
    </el-drawer>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox, type FormInstance } from 'element-plus'
import { Plus } from '@element-plus/icons-vue'
import { useI18n } from 'vue-i18n'
import { employeeApi, deptApi, postApi } from '@/api/org'

const { t } = useI18n()
const formRef = ref<FormInstance>()
const loading = ref(false)
const tableData = ref<any[]>([])
const total = ref(0)
const dialogVisible = ref(false)
const dialogTitle = ref('')
const isEdit = ref(false)
const activeTab = ref('basic')
const drawerVisible = ref(false)
const detailData = ref<any>(null)
const deptTree = ref<any[]>([])
const postList = ref<any[]>([])

const queryParams = reactive({
  pageNum: 1,
  pageSize: 10,
  name: '',
  deptId: undefined as number | undefined,
  postId: undefined as number | undefined,
  status: undefined as number | undefined
})

const defaultForm = () => ({
  id: undefined as number | undefined,
  empCode: '',
  name: '',
  gender: 0,
  birthDate: '',
  idCard: '',
  phone: '',
  email: '',
  address: '',
  deptId: undefined as number | undefined,
  postId: undefined as number | undefined,
  hireDate: '',
  regularDate: '',
  contractStart: '',
  contractEnd: '',
  education: '',
  university: '',
  major: '',
  emergencyContact: '',
  emergencyPhone: '',
  status: 2
})

const formData = ref(defaultForm())

const rules = {
  name: [{ required: true, message: t('org.inputEmpName'), trigger: 'blur' }],
  empCode: [{ required: true, message: t('org.inputEmpCode'), trigger: 'blur' }],
  deptId: [{ required: true, message: t('org.selectDept'), trigger: 'change' }],
  postId: [{ required: true, message: t('org.selectPost'), trigger: 'change' }]
}

const empStatusType = (status: number) => {
  const map: Record<number, string> = { 1: 'success', 2: 'warning', 3: 'info' }
  return (map[status] || 'info') as any
}

const empStatusText = (status: number) => {
  const map: Record<number, string> = { 1: t('org.empStatusActive'), 2: t('org.empStatusTrial'), 3: t('org.empStatusLeft') }
  return map[status] || '-'
}

const loadData = async () => {
  loading.value = true
  try {
    const res = await employeeApi.list(queryParams)
    const data = res.data
    tableData.value = data.records || data.list || []
    total.value = data.total || 0
  } catch (e) {
    console.error(e)
  } finally {
    loading.value = false
  }
}

const loadDeptTree = async () => {
  try {
    const res = await deptApi.tree()
    deptTree.value = res.data || []
  } catch (e) { console.error(e) }
}

const loadPostList = async () => {
  try {
    const res = await postApi.all()
    postList.value = res.data || []
  } catch (e) { console.error(e) }
}

const handleSearch = () => {
  queryParams.pageNum = 1
  loadData()
}

const handleReset = () => {
  queryParams.name = ''
  queryParams.deptId = undefined
  queryParams.postId = undefined
  queryParams.status = undefined
  handleSearch()
}

const handleAdd = () => {
  isEdit.value = false
  dialogTitle.value = t('org.addEmployee')
  formData.value = defaultForm()
  activeTab.value = 'basic'
  dialogVisible.value = true
}

const handleEdit = (row: any) => {
  isEdit.value = true
  dialogTitle.value = t('org.editEmployee')
  formData.value = { ...row }
  activeTab.value = 'basic'
  dialogVisible.value = true
}

const handleDelete = (row: any) => {
  ElMessageBox.confirm(t('org.confirmDeleteEmployee'), t('common.confirm'), { type: 'warning' })
    .then(async () => {
      await employeeApi.remove(row.id)
      ElMessage.success(t('common.success'))
      loadData()
    })
    .catch(() => {})
}

const handleRowClick = async (row: any) => {
  try {
    const res = await employeeApi.detail(row.id)
    detailData.value = res.data
    drawerVisible.value = true
  } catch (e) { console.error(e) }
}

const submitForm = async () => {
  const valid = await formRef.value?.validate().catch(() => false)
  if (!valid) return
  try {
    if (isEdit.value) {
      await employeeApi.update(formData.value)
    } else {
      await employeeApi.create(formData.value)
    }
    ElMessage.success(t('common.success'))
    dialogVisible.value = false
    loadData()
  } catch (e) { console.error(e) }
}

onMounted(() => {
  loadData()
  loadDeptTree()
  loadPostList()
})
</script>

<style scoped>
.search-bar {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 16px;
  flex-wrap: wrap;
  gap: 12px;
}
.pagination-wrap {
  display: flex;
  justify-content: flex-end;
  margin-top: 16px;
}
</style>
