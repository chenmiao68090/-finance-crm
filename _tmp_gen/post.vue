<template>
  <div class="page-container">
    <!-- 搜索栏 -->
    <div class="search-bar">
      <el-form :model="queryParams" inline>
        <el-form-item :label="$t('org.postName')">
          <el-input v-model="queryParams.postName" :placeholder="$t('org.inputPostName')" clearable @keyup.enter="handleSearch" />
        </el-form-item>
        <el-form-item :label="$t('org.status')">
          <el-select v-model="queryParams.status" :placeholder="$t('org.selectStatus')" clearable style="width: 120px">
            <el-option :label="$t('org.statusNormal')" :value="0" />
            <el-option :label="$t('org.statusDisabled')" :value="1" />
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
    <el-table :data="tableData" v-loading="loading" stripe border>
      <el-table-column prop="postCode" :label="$t('org.postCode')" width="150" />
      <el-table-column prop="postName" :label="$t('org.postName')" min-width="150" />
      <el-table-column prop="headcount" :label="$t('org.headcount')" width="100" align="center" />
      <el-table-column prop="sort" :label="$t('org.sort')" width="80" align="center" />
      <el-table-column prop="status" :label="$t('org.status')" width="90" align="center">
        <template #default="{ row }">
          <el-tag :type="row.status === 0 ? 'success' : 'danger'" size="small">
            {{ row.status === 0 ? $t('org.statusNormal') : $t('org.statusDisabled') }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="createTime" :label="$t('org.createTime')" width="170" />
      <el-table-column :label="$t('org.actions')" width="160" align="center" fixed="right">
        <template #default="{ row }">
          <el-button type="primary" link size="small" @click="handleEdit(row)">{{ $t('common.edit') }}</el-button>
          <el-button type="danger" link size="small" @click="handleDelete(row)">{{ $t('common.delete') }}</el-button>
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
    <el-dialog v-model="dialogVisible" :title="dialogTitle" width="520px" destroy-on-close>
      <el-form ref="formRef" :model="formData" :rules="rules" label-width="100px">
        <el-form-item :label="$t('org.postCode')" prop="postCode">
          <el-input v-model="formData.postCode" :placeholder="$t('org.inputPostCode')" />
        </el-form-item>
        <el-form-item :label="$t('org.postName')" prop="postName">
          <el-input v-model="formData.postName" :placeholder="$t('org.inputPostName')" />
        </el-form-item>
        <el-form-item :label="$t('org.sort')" prop="sort">
          <el-input-number v-model="formData.sort" :min="0" controls-position="right" />
        </el-form-item>
        <el-form-item :label="$t('org.headcount')">
          <el-input-number v-model="formData.headcount" :min="0" controls-position="right" />
        </el-form-item>
        <el-form-item :label="$t('org.responsibilities')">
          <el-input v-model="formData.responsibilities" type="textarea" :rows="3" :placeholder="$t('org.inputResponsibilities')" />
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
import { ref, reactive } from 'vue'
import { ElMessage, ElMessageBox, type FormInstance } from 'element-plus'
import { Plus } from '@element-plus/icons-vue'
import { useI18n } from 'vue-i18n'
import { postApi } from '@/api/org'

const { t } = useI18n()
const formRef = ref<FormInstance>()
const loading = ref(false)
const tableData = ref<any[]>([])
const total = ref(0)
const dialogVisible = ref(false)
const dialogTitle = ref('')
const isEdit = ref(false)

const queryParams = reactive({
  pageNum: 1,
  pageSize: 10,
  postName: '',
  status: undefined as number | undefined
})

const formData = ref({
  id: undefined as number | undefined,
  postCode: '',
  postName: '',
  sort: 0,
  headcount: 0,
  responsibilities: '',
  status: 0
})

const rules = {
  postCode: [{ required: true, message: t('org.inputPostCode'), trigger: 'blur' }],
  postName: [{ required: true, message: t('org.inputPostName'), trigger: 'blur' }]
}

const loadData = async () => {
  loading.value = true
  try {
    const res = await postApi.list(queryParams)
    const data = res.data
    tableData.value = data.records || data.list || []
    total.value = data.total || 0
  } catch (e) {
    console.error(e)
  } finally {
    loading.value = false
  }
}

const handleSearch = () => {
  queryParams.pageNum = 1
  loadData()
}

const handleReset = () => {
  queryParams.postName = ''
  queryParams.status = undefined
  handleSearch()
}

const handleAdd = () => {
  isEdit.value = false
  dialogTitle.value = t('org.addPost')
  formData.value = { id: undefined, postCode: '', postName: '', sort: 0, headcount: 0, responsibilities: '', status: 0 }
  dialogVisible.value = true
}

const handleEdit = (row: any) => {
  isEdit.value = true
  dialogTitle.value = t('org.editPost')
  formData.value = { ...row }
  dialogVisible.value = true
}

const handleDelete = (row: any) => {
  ElMessageBox.confirm(t('org.confirmDeletePost'), t('common.confirm'), { type: 'warning' })
    .then(async () => {
      await postApi.remove(row.id)
      ElMessage.success(t('common.success'))
      loadData()
    })
    .catch(() => {})
}

const submitForm = async () => {
  const valid = await formRef.value?.validate().catch(() => false)
  if (!valid) return
  try {
    if (isEdit.value) {
      await postApi.update(formData.value)
    } else {
      await postApi.create(formData.value)
    }
    ElMessage.success(t('common.success'))
    dialogVisible.value = false
    loadData()
  } catch (e) {
    console.error(e)
  }
}

loadData()
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
