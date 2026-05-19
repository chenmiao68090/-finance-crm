<template>
  <div class="page-container lead-page">
    <!-- 搜索栏 -->
    <div class="search-bar">
      <el-form :model="queryParams" inline>
        <el-form-item :label="$t('crm.lead.name')">
          <el-input v-model="queryParams.name" :placeholder="$t('crm.lead.name')" clearable @keyup.enter="loadData" />
        </el-form-item>
        <el-form-item :label="$t('crm.lead.source')">
          <el-select v-model="queryParams.source" :placeholder="$t('crm.lead.source')" clearable>
            <el-option :label="$t('crm.lead.sourceOptions.website')" :value="1" />
            <el-option :label="$t('crm.lead.sourceOptions.phone')" :value="2" />
            <el-option :label="$t('crm.lead.sourceOptions.referral')" :value="3" />
            <el-option :label="$t('crm.lead.sourceOptions.ad')" :value="4" />
          </el-select>
        </el-form-item>
        <el-form-item :label="$t('crm.lead.status')">
          <el-select v-model="queryParams.status" :placeholder="$t('crm.lead.status')" clearable>
            <el-option :label="$t('crm.lead.statusOptions.new')" :value="1" />
            <el-option :label="$t('crm.lead.statusOptions.following')" :value="2" />
            <el-option :label="$t('crm.lead.statusOptions.converted')" :value="3" />
            <el-option :label="$t('crm.lead.statusOptions.invalid')" :value="4" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="loadData">{{ $t('common.search') }}</el-button>
          <el-button @click="resetQuery">{{ $t('common.reset') }}</el-button>
        </el-form-item>
      </el-form>
      <el-button type="primary" @click="handleAdd">{{ $t('common.add') }}</el-button>
    </div>

    <!-- 表格 -->
    <el-table :data="tableData" v-loading="loading" stripe>
      <el-table-column prop="name" :label="$t('crm.lead.name')" min-width="120" />
      <el-table-column prop="company" :label="$t('crm.lead.company')" min-width="150" />
      <el-table-column prop="phone" :label="$t('crm.lead.phone')" width="130" />
      <el-table-column prop="source" :label="$t('crm.lead.source')" width="100">
        <template #default="{ row }">
          <el-tag size="small" :type="sourceTagType(row.source)">{{ sourceLabel(row.source) }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="status" :label="$t('crm.lead.status')" width="100">
        <template #default="{ row }">
          <el-tag size="small" :type="statusTagType(row.status)">{{ statusLabel(row.status) }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="createTime" :label="$t('crm.lead.createTime')" width="170" />
      <el-table-column :label="$t('common.edit')" width="200" fixed="right">
        <template #default="{ row }">
          <el-button link type="primary" size="small" @click="handleEdit(row)">{{ $t('common.edit') }}</el-button>
          <el-button link type="warning" size="small" @click="handleConvert(row)" :disabled="row.status === 3">{{ $t('crm.lead.convert') }}</el-button>
          <el-button link type="danger" size="small" @click="handleDelete(row)">{{ $t('common.delete') }}</el-button>
        </template>
      </el-table-column>
    </el-table>

    <!-- 分页 -->
    <div class="pagination-wrapper">
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
    <el-dialog v-model="dialogVisible" :title="isEdit ? $t('common.edit') : $t('common.add')" width="550px" destroy-on-close>
      <el-form ref="formRef" :model="formData" :rules="rules" label-width="100px">
        <el-form-item :label="$t('crm.lead.name')" prop="name">
          <el-input v-model="formData.name" />
        </el-form-item>
        <el-form-item :label="$t('crm.lead.company')">
          <el-input v-model="formData.company" />
        </el-form-item>
        <el-form-item :label="$t('crm.lead.phone')">
          <el-input v-model="formData.phone" />
        </el-form-item>
        <el-form-item :label="$t('crm.lead.email')">
          <el-input v-model="formData.email" />
        </el-form-item>
        <el-form-item :label="$t('crm.lead.source')" prop="source">
          <el-select v-model="formData.source" style="width: 100%">
            <el-option :label="$t('crm.lead.sourceOptions.website')" :value="1" />
            <el-option :label="$t('crm.lead.sourceOptions.phone')" :value="2" />
            <el-option :label="$t('crm.lead.sourceOptions.referral')" :value="3" />
            <el-option :label="$t('crm.lead.sourceOptions.ad')" :value="4" />
          </el-select>
        </el-form-item>
        <el-form-item :label="$t('crm.lead.remark')">
          <el-input v-model="formData.remark" type="textarea" :rows="3" />
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
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox, type FormInstance } from 'element-plus'
import { useI18n } from 'vue-i18n'
import { leadApi } from '@/api/crm'

const { t } = useI18n()
const loading = ref(false)
const tableData = ref<any[]>([])
const total = ref(0)
const dialogVisible = ref(false)
const isEdit = ref(false)
const formRef = ref<FormInstance>()

const queryParams = reactive({
  pageNum: 1,
  pageSize: 10,
  name: '',
  source: undefined as number | undefined,
  status: undefined as number | undefined
})

const formData = ref({
  id: undefined as number | undefined,
  name: '',
  company: '',
  phone: '',
  email: '',
  source: 1,
  remark: ''
})

const rules = {
  name: [{ required: true, message: t('crm.lead.name'), trigger: 'blur' }],
  source: [{ required: true, message: t('crm.lead.source'), trigger: 'change' }]
}

const sourceLabel = (val: number) => {
  const map: Record<number, string> = { 1: t('crm.lead.sourceOptions.website'), 2: t('crm.lead.sourceOptions.phone'), 3: t('crm.lead.sourceOptions.referral'), 4: t('crm.lead.sourceOptions.ad') }
  return map[val] || '-'
}
const sourceTagType = (val: number) => {
  const map: Record<number, string> = { 1: '', 2: 'success', 3: 'warning', 4: 'danger' }
  return map[val] || ''
}
const statusLabel = (val: number) => {
  const map: Record<number, string> = { 1: t('crm.lead.statusOptions.new'), 2: t('crm.lead.statusOptions.following'), 3: t('crm.lead.statusOptions.converted'), 4: t('crm.lead.statusOptions.invalid') }
  return map[val] || '-'
}
const statusTagType = (val: number) => {
  const map: Record<number, string> = { 1: 'info', 2: '', 3: 'success', 4: 'danger' }
  return map[val] || ''
}

const loadData = async () => {
  loading.value = true
  try {
    const res = await leadApi.list(queryParams)
    tableData.value = res.data?.records || []
    total.value = res.data?.total || 0
  } finally {
    loading.value = false
  }
}

const resetQuery = () => {
  queryParams.name = ''
  queryParams.source = undefined
  queryParams.status = undefined
  queryParams.pageNum = 1
  loadData()
}

const handleAdd = () => {
  isEdit.value = false
  formData.value = { id: undefined, name: '', company: '', phone: '', email: '', source: 1, remark: '' }
  dialogVisible.value = true
}

const handleEdit = (row: any) => {
  isEdit.value = true
  formData.value = { ...row }
  dialogVisible.value = true
}

const submitForm = async () => {
  await formRef.value?.validate()
  if (isEdit.value) {
    await leadApi.update(formData.value)
  } else {
    await leadApi.create(formData.value)
  }
  ElMessage.success(t('common.success'))
  dialogVisible.value = false
  loadData()
}

const handleDelete = (row: any) => {
  ElMessageBox.confirm(t('common.confirm') + '?', '', { type: 'warning' }).then(async () => {
    await leadApi.remove(row.id)
    ElMessage.success(t('common.success'))
    loadData()
  })
}

const handleConvert = (row: any) => {
  ElMessageBox.confirm(t('crm.lead.convertConfirm'), '', { type: 'warning' }).then(async () => {
    await leadApi.convert(row.id)
    ElMessage.success(t('crm.lead.convertSuccess'))
    loadData()
  })
}

onMounted(() => loadData())
</script>

<style scoped>
.lead-page {
  padding: 20px;
}
.search-bar {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 16px;
}
.pagination-wrapper {
  display: flex;
  justify-content: flex-end;
  margin-top: 16px;
}
</style>
