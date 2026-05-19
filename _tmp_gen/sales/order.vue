<template>
  <div class="page-container order-page">
    <!-- 搜索栏 -->
    <div class="search-bar">
      <el-form :model="queryParams" inline>
        <el-form-item :label="$t('sales.order.orderNo')">
          <el-input v-model="queryParams.orderNo" :placeholder="$t('sales.order.orderNo')" clearable @keyup.enter="loadData" />
        </el-form-item>
        <el-form-item :label="$t('sales.order.customer')">
          <el-input v-model="queryParams.customerName" :placeholder="$t('sales.order.customer')" clearable />
        </el-form-item>
        <el-form-item :label="$t('sales.order.status')">
          <el-select v-model="queryParams.status" :placeholder="$t('sales.order.status')" clearable>
            <el-option :label="$t('sales.order.statusOptions.draft')" :value="0" />
            <el-option :label="$t('sales.order.statusOptions.pending')" :value="1" />
            <el-option :label="$t('sales.order.statusOptions.approved')" :value="2" />
            <el-option :label="$t('sales.order.statusOptions.executing')" :value="3" />
            <el-option :label="$t('sales.order.statusOptions.completed')" :value="4" />
            <el-option :label="$t('sales.order.statusOptions.cancelled')" :value="5" />
          </el-select>
        </el-form-item>
        <el-form-item :label="$t('sales.order.deliveryDate')">
          <el-date-picker v-model="queryParams.deliveryDate" type="date" value-format="YYYY-MM-DD" clearable />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="loadData">{{ $t('common.search') }}</el-button>
          <el-button @click="resetQuery">{{ $t('common.reset') }}</el-button>
        </el-form-item>
      </el-form>
      <div>
        <el-button type="primary" @click="handleAdd">{{ $t('common.add') }}</el-button>
      </div>
    </div>

    <!-- 表格 -->
    <el-table :data="tableData" v-loading="loading" stripe>
      <el-table-column prop="orderNo" :label="$t('sales.order.orderNo')" width="160" />
      <el-table-column prop="customerName" :label="$t('sales.order.customer')" min-width="140" />
      <el-table-column prop="quotationId" :label="$t('sales.order.quotation')" width="120">
        <template #default="{ row }">{{ row.quotationId ? 'QT-' + row.quotationId : '-' }}</template>
      </el-table-column>
      <el-table-column prop="totalAmount" :label="$t('sales.order.totalAmount')" width="130">
        <template #default="{ row }">¥{{ row.totalAmount?.toLocaleString() }}</template>
      </el-table-column>
      <el-table-column prop="deliveryDate" :label="$t('sales.order.deliveryDate')" width="120" />
      <el-table-column prop="status" :label="$t('sales.order.status')" width="100">
        <template #default="{ row }">
          <el-tag :type="statusTagType(row.status)" size="small">{{ statusLabel(row.status) }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column :label="$t('common.edit')" width="240" fixed="right">
        <template #default="{ row }">
          <el-button link type="primary" size="small" @click="handleEdit(row)">{{ $t('common.edit') }}</el-button>
          <el-button link type="success" size="small" v-if="row.status === 1" @click="handleApprove(row)">{{ $t('sales.order.approve') }}</el-button>
          <el-button link type="warning" size="small" v-if="row.status === 0" @click="handleSubmit(row)">{{ $t('common.send') }}</el-button>
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
    <el-dialog v-model="dialogVisible" :title="isEdit ? $t('common.edit') : $t('common.add')" width="650px" destroy-on-close>
      <el-form ref="formRef" :model="formData" :rules="rules" label-width="100px">
        <el-row :gutter="16">
          <el-col :span="12">
            <el-form-item :label="$t('sales.order.customer')" prop="customerName">
              <el-input v-model="formData.customerName" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item :label="$t('sales.order.totalAmount')" prop="totalAmount">
              <el-input-number v-model="formData.totalAmount" :min="0" :precision="2" controls-position="right" style="width: 100%" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item :label="$t('sales.order.deliveryDate')">
              <el-date-picker v-model="formData.deliveryDate" type="date" value-format="YYYY-MM-DD" style="width: 100%" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item :label="$t('sales.order.status')">
              <el-select v-model="formData.status" style="width: 100%">
                <el-option :label="$t('sales.order.statusOptions.draft')" :value="0" />
                <el-option :label="$t('sales.order.statusOptions.pending')" :value="1" />
                <el-option :label="$t('sales.order.statusOptions.approved')" :value="2" />
                <el-option :label="$t('sales.order.statusOptions.executing')" :value="3" />
                <el-option :label="$t('sales.order.statusOptions.completed')" :value="4" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="24">
            <el-form-item :label="$t('sales.order.remark')">
              <el-input v-model="formData.remark" type="textarea" :rows="3" />
            </el-form-item>
          </el-col>
        </el-row>
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
import { salesOrderApi } from '@/api/sales'

const { t } = useI18n()
const loading = ref(false)
const tableData = ref<any[]>([])
const total = ref(0)
const dialogVisible = ref(false)
const isEdit = ref(false)
const formRef = ref<FormInstance>()

const queryParams = reactive({
  pageNum: 1, pageSize: 10, orderNo: '', customerName: '', status: undefined as number | undefined, deliveryDate: ''
})

const formData = ref<any>({
  id: undefined, customerName: '', totalAmount: 0, deliveryDate: '', status: 0, remark: ''
})

const rules = {
  customerName: [{ required: true, message: t('sales.order.customer'), trigger: 'blur' }],
  totalAmount: [{ required: true, message: t('sales.order.totalAmount'), trigger: 'blur' }]
}

const statusTagType = (val: number) => {
  const map: Record<number, string> = { 0: 'info', 1: 'warning', 2: 'success', 3: '', 4: 'success', 5: 'danger' }
  return map[val] || ''
}

const statusLabel = (val: number) => {
  const map: Record<number, string> = {
    0: t('sales.order.statusOptions.draft'),
    1: t('sales.order.statusOptions.pending'),
    2: t('sales.order.statusOptions.approved'),
    3: t('sales.order.statusOptions.executing'),
    4: t('sales.order.statusOptions.completed'),
    5: t('sales.order.statusOptions.cancelled')
  }
  return map[val] || '-'
}

const loadData = async () => {
  loading.value = true
  try {
    const res = await salesOrderApi.list(queryParams)
    tableData.value = res.data?.records || []
    total.value = res.data?.total || 0
  } finally {
    loading.value = false
  }
}

const resetQuery = () => {
  queryParams.orderNo = ''; queryParams.customerName = ''; queryParams.status = undefined; queryParams.deliveryDate = ''; queryParams.pageNum = 1
  loadData()
}

const handleAdd = () => {
  isEdit.value = false
  formData.value = { id: undefined, customerName: '', totalAmount: 0, deliveryDate: '', status: 0, remark: '' }
  dialogVisible.value = true
}

const handleEdit = (row: any) => {
  isEdit.value = true
  formData.value = { ...row }
  dialogVisible.value = true
}

const submitForm = async () => {
  await formRef.value?.validate()
  if (isEdit.value) { await salesOrderApi.update(formData.value) } else { await salesOrderApi.create(formData.value) }
  ElMessage.success(t('common.success'))
  dialogVisible.value = false
  loadData()
}

const handleDelete = (row: any) => {
  ElMessageBox.confirm(t('common.confirm') + '?', '', { type: 'warning' }).then(async () => {
    await salesOrderApi.remove(row.id)
    ElMessage.success(t('common.success'))
    loadData()
  })
}

const handleApprove = (row: any) => {
  ElMessageBox.confirm(t('sales.order.approve') + '?', '', { type: 'info' }).then(async () => {
    await salesOrderApi.approve(row.id)
    ElMessage.success(t('common.success'))
    loadData()
  })
}

const handleSubmit = (row: any) => {
  ElMessageBox.confirm(t('common.send') + '?', '', { type: 'info' }).then(async () => {
    await salesOrderApi.changeStatus({ id: row.id, status: 1 })
    ElMessage.success(t('common.success'))
    loadData()
  })
}

onMounted(() => loadData())
</script>

<style scoped>
.order-page { padding: 20px; }
.search-bar { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 16px; }
.pagination-wrapper { display: flex; justify-content: flex-end; margin-top: 16px; }
</style>
