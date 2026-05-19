<template>
  <div class="page-container quotation-page">
    <!-- 搜索栏 -->
    <div class="search-bar">
      <el-form :model="queryParams" inline>
        <el-form-item :label="$t('sales.quotation.quotationNo')">
          <el-input v-model="queryParams.quotationNo" :placeholder="$t('sales.quotation.quotationNo')" clearable @keyup.enter="loadData" />
        </el-form-item>
        <el-form-item :label="$t('sales.quotation.customer')">
          <el-input v-model="queryParams.customerName" :placeholder="$t('sales.quotation.customer')" clearable />
        </el-form-item>
        <el-form-item :label="$t('sales.quotation.status')">
          <el-select v-model="queryParams.status" :placeholder="$t('sales.quotation.status')" clearable>
            <el-option :label="$t('sales.quotation.statusOptions.draft')" :value="0" />
            <el-option :label="$t('sales.quotation.statusOptions.sent')" :value="1" />
            <el-option :label="$t('sales.quotation.statusOptions.confirmed')" :value="2" />
            <el-option :label="$t('sales.quotation.statusOptions.rejected')" :value="3" />
            <el-option :label="$t('sales.quotation.statusOptions.expired')" :value="4" />
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
      <el-table-column prop="quotationNo" :label="$t('sales.quotation.quotationNo')" width="160" />
      <el-table-column prop="customerName" :label="$t('sales.quotation.customer')" min-width="140" />
      <el-table-column prop="title" :label="$t('sales.quotation.quotationTitle')" min-width="160" />
      <el-table-column prop="totalAmount" :label="$t('sales.quotation.totalAmount')" width="130">
        <template #default="{ row }">¥{{ row.totalAmount?.toLocaleString() }}</template>
      </el-table-column>
      <el-table-column prop="validUntil" :label="$t('sales.quotation.validUntil')" width="120" />
      <el-table-column prop="version" :label="$t('sales.quotation.version')" width="80" align="center">
        <template #default="{ row }">V{{ row.version }}</template>
      </el-table-column>
      <el-table-column prop="status" :label="$t('sales.quotation.status')" width="100">
        <template #default="{ row }">
          <el-tag :type="statusTagType(row.status)" size="small">{{ statusLabel(row.status) }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column :label="$t('common.edit')" width="260" fixed="right">
        <template #default="{ row }">
          <el-button link type="primary" size="small" @click="handleEdit(row)">{{ $t('common.edit') }}</el-button>
          <el-button link type="success" size="small" v-if="row.status === 0" @click="handleSend(row)">{{ $t('sales.quotation.send') }}</el-button>
          <el-button link type="warning" size="small" v-if="row.status === 1" @click="handleConfirm(row)">{{ $t('sales.quotation.confirm') }}</el-button>
          <el-button link size="small" @click="handleNewVersion(row)">{{ $t('sales.quotation.newVersion') }}</el-button>
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
    <el-dialog v-model="dialogVisible" :title="isEdit ? $t('common.edit') : $t('common.add')" width="750px" destroy-on-close>
      <el-form ref="formRef" :model="formData" :rules="rules" label-width="100px">
        <el-row :gutter="16">
          <el-col :span="12">
            <el-form-item :label="$t('sales.quotation.customer')" prop="customerName">
              <el-input v-model="formData.customerName" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item :label="$t('sales.quotation.quotationTitle')" prop="title">
              <el-input v-model="formData.title" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item :label="$t('sales.quotation.validUntil')">
              <el-date-picker v-model="formData.validUntil" type="date" value-format="YYYY-MM-DD" style="width: 100%" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item :label="$t('sales.quotation.totalAmount')">
              <el-input v-model="formData.totalAmount" disabled>
                <template #prefix>¥</template>
              </el-input>
            </el-form-item>
          </el-col>
          <el-col :span="24">
            <el-form-item :label="$t('sales.quotation.remark')">
              <el-input v-model="formData.remark" type="textarea" :rows="2" />
            </el-form-item>
          </el-col>
        </el-row>
        <!-- 明细行 -->
        <div class="items-section">
          <div class="items-header">
            <span>{{ $t('sales.quotation.items') }}</span>
            <el-button type="primary" size="small" @click="addItem">{{ $t('sales.quotation.addItem') }}</el-button>
          </div>
          <el-table :data="formData.itemsList" size="small" border>
            <el-table-column :label="$t('sales.quotation.itemName')" min-width="200">
              <template #default="{ row }">
                <el-input v-model="row.name" size="small" />
              </template>
            </el-table-column>
            <el-table-column :label="$t('sales.quotation.quantity')" width="100">
              <template #default="{ row }">
                <el-input-number v-model="row.quantity" :min="1" size="small" controls-position="right" @change="calcSubtotal(row)" />
              </template>
            </el-table-column>
            <el-table-column :label="$t('sales.quotation.unitPrice')" width="130">
              <template #default="{ row }">
                <el-input-number v-model="row.unitPrice" :min="0" :precision="2" size="small" controls-position="right" @change="calcSubtotal(row)" />
              </template>
            </el-table-column>
            <el-table-column :label="$t('sales.quotation.subtotal')" width="120">
              <template #default="{ row }">¥{{ (row.subtotal || 0).toLocaleString() }}</template>
            </el-table-column>
            <el-table-column width="60">
              <template #default="{ $index }">
                <el-button link type="danger" size="small" @click="removeItem($index)">
                  <el-icon><Delete /></el-icon>
                </el-button>
              </template>
            </el-table-column>
          </el-table>
          <div class="items-total">{{ $t('sales.quotation.totalAmount') }}：¥{{ formData.totalAmount?.toLocaleString() || '0' }}</div>
        </div>
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
import { Delete } from '@element-plus/icons-vue'
import { useI18n } from 'vue-i18n'
import { quotationApi } from '@/api/sales'

const { t } = useI18n()
const loading = ref(false)
const tableData = ref<any[]>([])
const total = ref(0)
const dialogVisible = ref(false)
const isEdit = ref(false)
const formRef = ref<FormInstance>()

const queryParams = reactive({
  pageNum: 1, pageSize: 10, quotationNo: '', customerName: '', status: undefined as number | undefined
})

interface ItemRow { name: string; quantity: number; unitPrice: number; subtotal: number }

const formData = ref<any>({
  id: undefined, customerName: '', title: '', totalAmount: 0,
  validUntil: '', remark: '', itemsList: [] as ItemRow[]
})

const rules = {
  customerName: [{ required: true, message: t('sales.quotation.customer'), trigger: 'blur' }],
  title: [{ required: true, message: t('sales.quotation.quotationTitle'), trigger: 'blur' }]
}

const statusTagType = (val: number) => {
  const map: Record<number, string> = { 0: 'info', 1: 'warning', 2: 'success', 3: 'danger', 4: '' }
  return map[val] || ''
}

const statusLabel = (val: number) => {
  const map: Record<number, string> = {
    0: t('sales.quotation.statusOptions.draft'),
    1: t('sales.quotation.statusOptions.sent'),
    2: t('sales.quotation.statusOptions.confirmed'),
    3: t('sales.quotation.statusOptions.rejected'),
    4: t('sales.quotation.statusOptions.expired')
  }
  return map[val] || '-'
}

const addItem = () => {
  formData.value.itemsList.push({ name: '', quantity: 1, unitPrice: 0, subtotal: 0 })
}

const removeItem = (index: number) => {
  formData.value.itemsList.splice(index, 1)
  calcTotal()
}

const calcSubtotal = (row: ItemRow) => {
  row.subtotal = (row.quantity || 0) * (row.unitPrice || 0)
  calcTotal()
}

const calcTotal = () => {
  formData.value.totalAmount = formData.value.itemsList.reduce((sum: number, r: ItemRow) => sum + (r.subtotal || 0), 0)
}

const loadData = async () => {
  loading.value = true
  try {
    const res = await quotationApi.list(queryParams)
    tableData.value = res.data?.records || []
    total.value = res.data?.total || 0
  } finally {
    loading.value = false
  }
}

const resetQuery = () => {
  queryParams.quotationNo = ''; queryParams.customerName = ''; queryParams.status = undefined; queryParams.pageNum = 1
  loadData()
}

const handleAdd = () => {
  isEdit.value = false
  formData.value = { id: undefined, customerName: '', title: '', totalAmount: 0, validUntil: '', remark: '', itemsList: [{ name: '', quantity: 1, unitPrice: 0, subtotal: 0 }] }
  dialogVisible.value = true
}

const handleEdit = (row: any) => {
  isEdit.value = true
  const itemsList = row.items ? JSON.parse(row.items) : []
  formData.value = { ...row, itemsList }
  dialogVisible.value = true
}

const submitForm = async () => {
  await formRef.value?.validate()
  const data = { ...formData.value, items: JSON.stringify(formData.value.itemsList) }
  delete data.itemsList
  if (isEdit.value) { await quotationApi.update(data) } else { await quotationApi.create(data) }
  ElMessage.success(t('common.success'))
  dialogVisible.value = false
  loadData()
}

const handleDelete = (row: any) => {
  ElMessageBox.confirm(t('common.confirm') + '?', '', { type: 'warning' }).then(async () => {
    await quotationApi.remove(row.id)
    ElMessage.success(t('common.success'))
    loadData()
  })
}

const handleSend = (row: any) => {
  ElMessageBox.confirm(t('sales.quotation.send') + '?', '', { type: 'info' }).then(async () => {
    await quotationApi.send(row.id)
    ElMessage.success(t('common.success'))
    loadData()
  })
}

const handleConfirm = (row: any) => {
  ElMessageBox.confirm(t('sales.quotation.confirm') + '?', '', { type: 'info' }).then(async () => {
    await quotationApi.confirm(row.id)
    ElMessage.success(t('common.success'))
    loadData()
  })
}

const handleNewVersion = (row: any) => {
  ElMessageBox.confirm(t('sales.quotation.newVersion') + '?', '', { type: 'info' }).then(async () => {
    await quotationApi.newVersion(row.id)
    ElMessage.success(t('common.success'))
    loadData()
  })
}

onMounted(() => loadData())
</script>

<style scoped>
.quotation-page { padding: 20px; }
.search-bar { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 16px; }
.pagination-wrapper { display: flex; justify-content: flex-end; margin-top: 16px; }
.items-section { margin-top: 16px; padding: 12px; background: var(--el-fill-color-lighter); border-radius: 8px; }
.items-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; font-weight: 500; }
.items-total { text-align: right; margin-top: 12px; font-weight: bold; color: #F26522; font-size: 16px; }
</style>
