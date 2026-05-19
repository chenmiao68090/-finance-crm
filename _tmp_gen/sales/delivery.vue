<template>
  <div class="page-container delivery-page">
    <!-- 搜索栏 -->
    <div class="search-bar">
      <el-form :model="queryParams" inline>
        <el-form-item :label="$t('sales.delivery.deliveryNo')">
          <el-input v-model="queryParams.deliveryNo" :placeholder="$t('sales.delivery.deliveryNo')" clearable @keyup.enter="loadData" />
        </el-form-item>
        <el-form-item :label="$t('sales.delivery.orderNo')">
          <el-input v-model="queryParams.orderNo" :placeholder="$t('sales.delivery.orderNo')" clearable />
        </el-form-item>
        <el-form-item :label="$t('sales.delivery.customer')">
          <el-input v-model="queryParams.customerName" :placeholder="$t('sales.delivery.customer')" clearable />
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
      <el-table-column prop="deliveryNo" :label="$t('sales.delivery.deliveryNo')" width="160" />
      <el-table-column prop="orderNo" :label="$t('sales.delivery.orderNo')" width="160" />
      <el-table-column prop="customerName" :label="$t('sales.delivery.customer')" min-width="140" />
      <el-table-column prop="deliveryDate" :label="$t('sales.delivery.deliveryDate')" width="120" />
      <el-table-column prop="logisticsCompany" :label="$t('sales.delivery.logisticsCompany')" width="130" />
      <el-table-column prop="trackingNo" :label="$t('sales.delivery.trackingNo')" width="160" />
      <el-table-column prop="status" :label="$t('sales.delivery.status')" width="100">
        <template #default="{ row }">
          <el-tag :type="statusTagType(row.status)" size="small">{{ statusLabel(row.status) }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column :label="$t('common.edit')" width="180" fixed="right">
        <template #default="{ row }">
          <el-button link type="primary" size="small" @click="handleEdit(row)">{{ $t('common.edit') }}</el-button>
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
    <el-dialog v-model="dialogVisible" :title="isEdit ? $t('common.edit') : $t('common.add')" width="600px" destroy-on-close>
      <el-form ref="formRef" :model="formData" :rules="rules" label-width="100px">
        <el-form-item :label="$t('sales.delivery.orderNo')" prop="orderNo">
          <el-input v-model="formData.orderNo" />
        </el-form-item>
        <el-form-item :label="$t('sales.delivery.customer')" prop="customerName">
          <el-input v-model="formData.customerName" />
        </el-form-item>
        <el-form-item :label="$t('sales.delivery.deliveryDate')">
          <el-date-picker v-model="formData.deliveryDate" type="date" value-format="YYYY-MM-DD" style="width: 100%" />
        </el-form-item>
        <el-form-item :label="$t('sales.delivery.logisticsCompany')">
          <el-input v-model="formData.logisticsCompany" />
        </el-form-item>
        <el-form-item :label="$t('sales.delivery.trackingNo')">
          <el-input v-model="formData.trackingNo" />
        </el-form-item>
        <el-form-item :label="$t('sales.delivery.status')">
          <el-select v-model="formData.status" style="width: 100%">
            <el-option :label="$t('sales.delivery.statusOptions.pending')" :value="0" />
            <el-option :label="$t('sales.delivery.statusOptions.shipped')" :value="1" />
            <el-option :label="$t('sales.delivery.statusOptions.received')" :value="2" />
          </el-select>
        </el-form-item>
        <el-form-item :label="$t('sales.delivery.remark')">
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
import { deliveryApi } from '@/api/sales'

const { t } = useI18n()
const loading = ref(false)
const tableData = ref<any[]>([])
const total = ref(0)
const dialogVisible = ref(false)
const isEdit = ref(false)
const formRef = ref<FormInstance>()

const queryParams = reactive({
  pageNum: 1, pageSize: 10, deliveryNo: '', orderNo: '', customerName: ''
})

const formData = ref<any>({
  id: undefined, orderNo: '', customerName: '', deliveryDate: '', logisticsCompany: '', trackingNo: '', status: 0, remark: ''
})

const rules = {
  orderNo: [{ required: true, message: t('sales.delivery.orderNo'), trigger: 'blur' }],
  customerName: [{ required: true, message: t('sales.delivery.customer'), trigger: 'blur' }]
}

const statusTagType = (val: number) => {
  const map: Record<number, string> = { 0: 'info', 1: 'warning', 2: 'success' }
  return map[val] || ''
}

const statusLabel = (val: number) => {
  const map: Record<number, string> = {
    0: t('sales.delivery.statusOptions.pending'),
    1: t('sales.delivery.statusOptions.shipped'),
    2: t('sales.delivery.statusOptions.received')
  }
  return map[val] || '-'
}

const loadData = async () => {
  loading.value = true
  try {
    const res = await deliveryApi.list(queryParams)
    tableData.value = res.data?.records || []
    total.value = res.data?.total || 0
  } finally {
    loading.value = false
  }
}

const resetQuery = () => {
  queryParams.deliveryNo = ''; queryParams.orderNo = ''; queryParams.customerName = ''; queryParams.pageNum = 1
  loadData()
}

const handleAdd = () => {
  isEdit.value = false
  formData.value = { id: undefined, orderNo: '', customerName: '', deliveryDate: '', logisticsCompany: '', trackingNo: '', status: 0, remark: '' }
  dialogVisible.value = true
}

const handleEdit = (row: any) => {
  isEdit.value = true
  formData.value = { ...row }
  dialogVisible.value = true
}

const submitForm = async () => {
  await formRef.value?.validate()
  if (isEdit.value) { await deliveryApi.update(formData.value) } else { await deliveryApi.create(formData.value) }
  ElMessage.success(t('common.success'))
  dialogVisible.value = false
  loadData()
}

const handleDelete = (row: any) => {
  ElMessageBox.confirm(t('common.confirm') + '?', '', { type: 'warning' }).then(async () => {
    await deliveryApi.remove(row.id)
    ElMessage.success(t('common.success'))
    loadData()
  })
}

onMounted(() => loadData())
</script>

<style scoped>
.delivery-page { padding: 20px; }
.search-bar { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 16px; }
.pagination-wrapper { display: flex; justify-content: flex-end; margin-top: 16px; }
</style>
