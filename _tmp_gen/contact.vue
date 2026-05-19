<template>
  <div class="page-container contact-page">
    <!-- 搜索栏 -->
    <div class="search-bar">
      <el-form :model="queryParams" inline>
        <el-form-item :label="$t('crm.opportunity.customer')">
          <el-select v-model="queryParams.customerId" :placeholder="$t('crm.opportunity.customer')" clearable filterable>
            <el-option v-for="c in customerList" :key="c.id" :label="c.name" :value="c.id" />
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
      <el-table-column prop="name" :label="$t('crm.contact.name')" width="120" />
      <el-table-column prop="gender" :label="$t('crm.contact.gender')" width="80">
        <template #default="{ row }">{{ row.gender === 0 ? $t('crm.contact.male') : $t('crm.contact.female') }}</template>
      </el-table-column>
      <el-table-column prop="position" :label="$t('crm.contact.position')" width="120" />
      <el-table-column prop="phone" :label="$t('crm.contact.phone')" width="130" />
      <el-table-column prop="mobile" :label="$t('crm.contact.mobile')" width="130" />
      <el-table-column prop="email" :label="$t('crm.contact.email')" min-width="160" />
      <el-table-column prop="wechat" :label="$t('crm.contact.wechat')" width="120" />
      <el-table-column prop="isPrimary" :label="$t('crm.contact.isPrimary')" width="110">
        <template #default="{ row }">
          <el-tag v-if="row.isPrimary === 1" type="success" size="small">{{ $t('crm.contact.isPrimary') }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column :label="$t('common.edit')" width="150" fixed="right">
        <template #default="{ row }">
          <el-button link type="primary" size="small" @click="handleEdit(row)">{{ $t('common.edit') }}</el-button>
          <el-button link type="danger" size="small" @click="handleDelete(row)">{{ $t('common.delete') }}</el-button>
        </template>
      </el-table-column>
    </el-table>

    <!-- 新增/编辑弹窗 -->
    <el-dialog v-model="dialogVisible" :title="isEdit ? $t('common.edit') : $t('common.add')" width="550px" destroy-on-close>
      <el-form ref="formRef" :model="formData" :rules="rules" label-width="100px">
        <el-form-item :label="$t('crm.opportunity.customer')" prop="customerId">
          <el-select v-model="formData.customerId" style="width: 100%" filterable>
            <el-option v-for="c in customerList" :key="c.id" :label="c.name" :value="c.id" />
          </el-select>
        </el-form-item>
        <el-form-item :label="$t('crm.contact.name')" prop="name">
          <el-input v-model="formData.name" />
        </el-form-item>
        <el-form-item :label="$t('crm.contact.gender')">
          <el-radio-group v-model="formData.gender">
            <el-radio :value="0">{{ $t('crm.contact.male') }}</el-radio>
            <el-radio :value="1">{{ $t('crm.contact.female') }}</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item :label="$t('crm.contact.position')">
          <el-input v-model="formData.position" />
        </el-form-item>
        <el-form-item :label="$t('crm.contact.phone')">
          <el-input v-model="formData.phone" />
        </el-form-item>
        <el-form-item :label="$t('crm.contact.mobile')">
          <el-input v-model="formData.mobile" />
        </el-form-item>
        <el-form-item :label="$t('crm.contact.email')">
          <el-input v-model="formData.email" />
        </el-form-item>
        <el-form-item :label="$t('crm.contact.wechat')">
          <el-input v-model="formData.wechat" />
        </el-form-item>
        <el-form-item :label="$t('crm.contact.isPrimary')">
          <el-switch v-model="formData.isPrimary" :active-value="1" :inactive-value="0" />
        </el-form-item>
        <el-form-item :label="$t('crm.contact.remark')">
          <el-input v-model="formData.remark" type="textarea" :rows="2" />
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
import { contactApi, customerApi } from '@/api/crm'

const { t } = useI18n()
const loading = ref(false)
const tableData = ref<any[]>([])
const dialogVisible = ref(false)
const isEdit = ref(false)
const formRef = ref<FormInstance>()
const customerList = ref<any[]>([])

const queryParams = reactive({ customerId: undefined as number | undefined })

const formData = ref({
  id: undefined as number | undefined,
  customerId: undefined as number | undefined,
  name: '', gender: 0, position: '', phone: '', mobile: '', email: '', wechat: '', isPrimary: 0, remark: ''
})

const rules = {
  customerId: [{ required: true, message: t('crm.opportunity.customer'), trigger: 'change' }],
  name: [{ required: true, message: t('crm.contact.name'), trigger: 'blur' }]
}

const loadCustomers = async () => {
  const res = await customerApi.list({ pageSize: 1000 })
  customerList.value = res.data?.records || []
}

const loadData = async () => {
  if (!queryParams.customerId) { tableData.value = []; return }
  loading.value = true
  try {
    const res = await contactApi.list(queryParams.customerId)
    tableData.value = res.data || []
  } finally {
    loading.value = false
  }
}

const resetQuery = () => { queryParams.customerId = undefined; tableData.value = [] }

const handleAdd = () => {
  isEdit.value = false
  formData.value = { id: undefined, customerId: queryParams.customerId, name: '', gender: 0, position: '', phone: '', mobile: '', email: '', wechat: '', isPrimary: 0, remark: '' }
  dialogVisible.value = true
}

const handleEdit = (row: any) => {
  isEdit.value = true
  formData.value = { ...row }
  dialogVisible.value = true
}

const submitForm = async () => {
  await formRef.value?.validate()
  if (isEdit.value) { await contactApi.update(formData.value) } else { await contactApi.create(formData.value) }
  ElMessage.success(t('common.success'))
  dialogVisible.value = false
  loadData()
}

const handleDelete = (row: any) => {
  ElMessageBox.confirm(t('common.confirm') + '?', '', { type: 'warning' }).then(async () => {
    await contactApi.remove(row.id)
    ElMessage.success(t('common.success'))
    loadData()
  })
}

onMounted(() => { loadCustomers() })
</script>

<style scoped>
.contact-page { padding: 20px; }
.search-bar { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 16px; }
</style>
