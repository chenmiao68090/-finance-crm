<template>
  <div class="page-container contract-page">
    <!-- 搜索栏 -->
    <div class="search-bar">
      <el-form :model="queryParams" inline>
        <el-form-item :label="$t('crm.contract.contractNo')">
          <el-input v-model="queryParams.contractNo" :placeholder="$t('crm.contract.contractNo')" clearable @keyup.enter="loadData" />
        </el-form-item>
        <el-form-item :label="$t('crm.contract.customer')">
          <el-select v-model="queryParams.customerId" :placeholder="$t('crm.contract.customer')" clearable filterable>
            <el-option v-for="c in customerList" :key="c.id" :label="c.name" :value="c.id" />
          </el-select>
        </el-form-item>
        <el-form-item :label="$t('crm.contract.status')">
          <el-select v-model="queryParams.status" :placeholder="$t('crm.contract.status')" clearable>
            <el-option v-for="s in statusOptions" :key="s.value" :label="s.label" :value="s.value" />
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
      <el-table-column prop="contractNo" :label="$t('crm.contract.contractNo')" width="140" />
      <el-table-column prop="title" :label="$t('crm.contract.contractTitle')" min-width="180" />
      <el-table-column prop="amount" :label="$t('crm.contract.amount')" width="130">
        <template #default="{ row }">¥{{ row.amount?.toLocaleString() }}</template>
      </el-table-column>
      <el-table-column prop="signDate" :label="$t('crm.contract.signDate')" width="120" />
      <el-table-column prop="startDate" :label="$t('crm.contract.startDate')" width="120" />
      <el-table-column prop="endDate" :label="$t('crm.contract.endDate')" width="120" />
      <el-table-column prop="status" :label="$t('crm.contract.status')" width="100">
        <template #default="{ row }">
          <el-tag size="small" :type="statusTagType(row.status)">{{ statusLabel(row.status) }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column :label="$t('common.edit')" width="150" fixed="right">
        <template #default="{ row }">
          <el-button link type="primary" size="small" @click="handleEdit(row)">{{ $t('common.edit') }}</el-button>
          <el-dropdown trigger="click" @command="(cmd: number) => handleChangeStatus(row, cmd)">
            <el-button link type="warning" size="small">{{ $t('crm.contract.status') }}</el-button>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item v-for="s in statusOptions" :key="s.value" :command="s.value">{{ s.label }}</el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
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
    <el-dialog v-model="dialogVisible" :title="isEdit ? $t('common.edit') : $t('common.add')" width="600px" destroy-on-close>
      <el-form ref="formRef" :model="formData" :rules="rules" label-width="120px">
        <el-form-item :label="$t('crm.contract.customer')" prop="customerId">
          <el-select v-model="formData.customerId" style="width: 100%" filterable>
            <el-option v-for="c in customerList" :key="c.id" :label="c.name" :value="c.id" />
          </el-select>
        </el-form-item>
        <el-form-item :label="$t('crm.contract.contractNo')" prop="contractNo">
          <el-input v-model="formData.contractNo" />
        </el-form-item>
        <el-form-item :label="$t('crm.contract.contractTitle')" prop="title">
          <el-input v-model="formData.title" />
        </el-form-item>
        <el-form-item :label="$t('crm.contract.amount')">
          <el-input-number v-model="formData.amount" :min="0" :precision="2" controls-position="right" style="width: 100%" />
        </el-form-item>
        <el-row :gutter="16">
          <el-col :span="12">
            <el-form-item :label="$t('crm.contract.startDate')">
              <el-date-picker v-model="formData.startDate" type="date" value-format="YYYY-MM-DD" style="width: 100%" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item :label="$t('crm.contract.endDate')">
              <el-date-picker v-model="formData.endDate" type="date" value-format="YYYY-MM-DD" style="width: 100%" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-form-item :label="$t('crm.contract.signDate')">
          <el-date-picker v-model="formData.signDate" type="date" value-format="YYYY-MM-DD" style="width: 100%" />
        </el-form-item>
        <el-form-item :label="$t('crm.contract.content')">
          <el-input v-model="formData.content" type="textarea" :rows="4" />
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
import { ref, reactive, computed, onMounted } from 'vue'
import { ElMessage, type FormInstance } from 'element-plus'
import { useI18n } from 'vue-i18n'
import { contractApi, customerApi } from '@/api/crm'

const { t } = useI18n()
const loading = ref(false)
const tableData = ref<any[]>([])
const total = ref(0)
const dialogVisible = ref(false)
const isEdit = ref(false)
const formRef = ref<FormInstance>()
const customerList = ref<any[]>([])

const statusOptions = computed(() => [
  { value: 1, label: t('crm.contract.statusOptions.draft') },
  { value: 2, label: t('crm.contract.statusOptions.approving') },
  { value: 3, label: t('crm.contract.statusOptions.signed') },
  { value: 4, label: t('crm.contract.statusOptions.executing') },
  { value: 5, label: t('crm.contract.statusOptions.completed') },
  { value: 6, label: t('crm.contract.statusOptions.terminated') }
])

const queryParams = reactive({
  pageNum: 1, pageSize: 10,
  contractNo: '', customerId: undefined as number | undefined, status: undefined as number | undefined
})

const formData = ref({
  id: undefined as number | undefined,
  customerId: undefined as number | undefined,
  contractNo: '', title: '', amount: 0, startDate: '', endDate: '', signDate: '', content: ''
})

const rules = {
  customerId: [{ required: true, message: t('crm.contract.customer'), trigger: 'change' }],
  contractNo: [{ required: true, message: t('crm.contract.contractNo'), trigger: 'blur' }],
  title: [{ required: true, message: t('crm.contract.contractTitle'), trigger: 'blur' }]
}

const statusLabel = (val: number) => statusOptions.value.find(s => s.value === val)?.label || '-'
const statusTagType = (val: number) => {
  const map: Record<number, string> = { 1: 'info', 2: 'warning', 3: 'success', 4: '', 5: 'success', 6: 'danger' }
  return map[val] || ''
}

const loadData = async () => {
  loading.value = true
  try {
    const res = await contractApi.list(queryParams)
    tableData.value = res.data?.records || []
    total.value = res.data?.total || 0
  } finally {
    loading.value = false
  }
}

const resetQuery = () => {
  queryParams.contractNo = ''; queryParams.customerId = undefined; queryParams.status = undefined; queryParams.pageNum = 1
  loadData()
}

const handleAdd = () => {
  isEdit.value = false
  formData.value = { id: undefined, customerId: undefined, contractNo: '', title: '', amount: 0, startDate: '', endDate: '', signDate: '', content: '' }
  dialogVisible.value = true
}

const handleEdit = (row: any) => {
  isEdit.value = true
  formData.value = { ...row }
  dialogVisible.value = true
}

const submitForm = async () => {
  await formRef.value?.validate()
  if (isEdit.value) { await contractApi.update(formData.value) } else { await contractApi.create(formData.value) }
  ElMessage.success(t('common.success'))
  dialogVisible.value = false
  loadData()
}

const handleChangeStatus = async (row: any, status: number) => {
  await contractApi.changeStatus(row.id, status)
  ElMessage.success(t('common.success'))
  loadData()
}

onMounted(async () => {
  const res = await customerApi.list({ pageSize: 1000 })
  customerList.value = res.data?.records || []
  loadData()
})
</script>

<style scoped>
.contract-page { padding: 20px; }
.search-bar { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 16px; }
.pagination-wrapper { display: flex; justify-content: flex-end; margin-top: 16px; }
</style>
