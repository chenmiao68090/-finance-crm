<template>
  <div class="page-container customer-page">
    <!-- 搜索栏 -->
    <div class="search-bar">
      <el-form :model="queryParams" inline>
        <el-form-item :label="$t('crm.customer.name')">
          <el-input v-model="queryParams.name" :placeholder="$t('crm.customer.name')" clearable @keyup.enter="loadData" />
        </el-form-item>
        <el-form-item :label="$t('crm.customer.level')">
          <el-select v-model="queryParams.level" :placeholder="$t('crm.customer.level')" clearable>
            <el-option label="A" value="A" />
            <el-option label="B" value="B" />
            <el-option label="C" value="C" />
            <el-option label="D" value="D" />
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
    <el-table :data="tableData" v-loading="loading" stripe @row-click="handleRowClick">
      <el-table-column prop="name" :label="$t('crm.customer.name')" min-width="160" />
      <el-table-column prop="level" :label="$t('crm.customer.level')" width="100">
        <template #default="{ row }">
          <el-tag size="small" :type="levelTagType(row.level)">{{ row.level }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="industry" :label="$t('crm.customer.industry')" width="120" />
      <el-table-column prop="taxpayerType" :label="$t('crm.customer.taxpayerType')" width="130">
        <template #default="{ row }">
          {{ row.taxpayerType === 1 ? $t('crm.customer.taxpayerOptions.general') : $t('crm.customer.taxpayerOptions.small') }}
        </template>
      </el-table-column>
      <el-table-column prop="createTime" :label="$t('crm.customer.createTime')" width="170" />
      <el-table-column :label="$t('common.edit')" width="200" fixed="right">
        <template #default="{ row }">
          <el-button link type="primary" size="small" @click.stop="handleEdit(row)">{{ $t('common.edit') }}</el-button>
          <el-button link type="warning" size="small" @click.stop="handleToPool(row)">{{ $t('crm.customer.toPool') }}</el-button>
          <el-button link type="danger" size="small" @click.stop="handleDelete(row)">{{ $t('common.delete') }}</el-button>
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

    <!-- 客户详情抽屉 -->
    <el-drawer v-model="drawerVisible" :title="currentCustomer?.name" size="60%" destroy-on-close>
      <el-tabs v-model="activeTab">
        <el-tab-pane :label="$t('crm.customer.tabs.basic')" name="basic">
          <el-descriptions :column="2" border>
            <el-descriptions-item :label="$t('crm.customer.name')">{{ currentCustomer?.name }}</el-descriptions-item>
            <el-descriptions-item :label="$t('crm.customer.shortName')">{{ currentCustomer?.shortName || '-' }}</el-descriptions-item>
            <el-descriptions-item :label="$t('crm.customer.industry')">{{ currentCustomer?.industry || '-' }}</el-descriptions-item>
            <el-descriptions-item :label="$t('crm.customer.scale')">{{ currentCustomer?.scale || '-' }}</el-descriptions-item>
            <el-descriptions-item :label="$t('crm.customer.level')">{{ currentCustomer?.level }}</el-descriptions-item>
            <el-descriptions-item :label="$t('crm.customer.taxpayerType')">{{ currentCustomer?.taxpayerType === 1 ? $t('crm.customer.taxpayerOptions.general') : $t('crm.customer.taxpayerOptions.small') }}</el-descriptions-item>
            <el-descriptions-item :label="$t('crm.customer.creditCode')">{{ currentCustomer?.creditCode || '-' }}</el-descriptions-item>
            <el-descriptions-item :label="$t('crm.customer.address')">{{ currentCustomer?.address || '-' }}</el-descriptions-item>
            <el-descriptions-item :label="$t('crm.customer.servicePackage')">{{ currentCustomer?.servicePackage || '-' }}</el-descriptions-item>
            <el-descriptions-item :label="$t('crm.customer.billingCycle')">{{ currentCustomer?.billingCycle || '-' }}</el-descriptions-item>
          </el-descriptions>
        </el-tab-pane>
        <el-tab-pane :label="$t('crm.customer.tabs.contacts')" name="contacts">
          <el-button type="primary" size="small" style="margin-bottom: 12px" @click="showContactDialog">{{ $t('common.add') }}</el-button>
          <el-table :data="contacts" size="small">
            <el-table-column prop="name" :label="$t('crm.contact.name')" />
            <el-table-column prop="position" :label="$t('crm.contact.position')" />
            <el-table-column prop="mobile" :label="$t('crm.contact.mobile')" />
            <el-table-column prop="email" :label="$t('crm.contact.email')" />
            <el-table-column prop="isPrimary" :label="$t('crm.contact.isPrimary')" width="100">
              <template #default="{ row }">
                <el-tag v-if="row.isPrimary === 1" type="success" size="small">{{ $t('crm.contact.isPrimary') }}</el-tag>
              </template>
            </el-table-column>
          </el-table>
        </el-tab-pane>
        <el-tab-pane :label="$t('crm.customer.tabs.follows')" name="follows">
          <el-button type="primary" size="small" style="margin-bottom: 12px" @click="showFollowDialog">{{ $t('crm.follow.addFollow') }}</el-button>
          <el-timeline>
            <el-timeline-item v-for="item in follows" :key="item.id" :timestamp="item.createTime" placement="top">
              <el-card shadow="hover">
                <p><el-tag size="small">{{ followTypeLabel(item.type) }}</el-tag></p>
                <p>{{ item.content }}</p>
                <p v-if="item.nextTime" style="color: #999; font-size: 12px;">{{ $t('crm.follow.nextTime') }}: {{ item.nextTime }}</p>
              </el-card>
            </el-timeline-item>
          </el-timeline>
        </el-tab-pane>
        <el-tab-pane :label="$t('crm.customer.tabs.opportunities')" name="opportunities">
          <el-table :data="opportunities" size="small">
            <el-table-column prop="name" :label="$t('crm.opportunity.name')" />
            <el-table-column prop="amount" :label="$t('crm.opportunity.amount')" width="120">
              <template #default="{ row }">¥{{ row.amount?.toLocaleString() }}</template>
            </el-table-column>
            <el-table-column prop="stage" :label="$t('crm.opportunity.stage')" width="120">
              <template #default="{ row }">{{ stageLabel(row.stage) }}</template>
            </el-table-column>
            <el-table-column prop="winRate" :label="$t('crm.opportunity.winRate')" width="100">
              <template #default="{ row }">{{ row.winRate }}%</template>
            </el-table-column>
          </el-table>
        </el-tab-pane>
        <el-tab-pane :label="$t('crm.customer.tabs.contracts')" name="contracts">
          <el-table :data="contracts" size="small">
            <el-table-column prop="contractNo" :label="$t('crm.contract.contractNo')" />
            <el-table-column prop="title" :label="$t('crm.contract.contractTitle')" />
            <el-table-column prop="amount" :label="$t('crm.contract.amount')" width="120">
              <template #default="{ row }">¥{{ row.amount?.toLocaleString() }}</template>
            </el-table-column>
            <el-table-column prop="status" :label="$t('crm.contract.status')" width="100">
              <template #default="{ row }">{{ contractStatusLabel(row.status) }}</template>
            </el-table-column>
          </el-table>
        </el-tab-pane>
      </el-tabs>
    </el-drawer>

    <!-- 新增/编辑客户弹窗 -->
    <el-dialog v-model="dialogVisible" :title="isEdit ? $t('common.edit') : $t('common.add')" width="650px" destroy-on-close>
      <el-form ref="formRef" :model="formData" :rules="rules" label-width="120px">
        <el-row :gutter="16">
          <el-col :span="12">
            <el-form-item :label="$t('crm.customer.name')" prop="name">
              <el-input v-model="formData.name" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item :label="$t('crm.customer.shortName')">
              <el-input v-model="formData.shortName" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item :label="$t('crm.customer.industry')">
              <el-input v-model="formData.industry" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item :label="$t('crm.customer.scale')">
              <el-input v-model="formData.scale" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item :label="$t('crm.customer.level')" prop="level">
              <el-select v-model="formData.level" style="width: 100%">
                <el-option label="A" value="A" />
                <el-option label="B" value="B" />
                <el-option label="C" value="C" />
                <el-option label="D" value="D" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item :label="$t('crm.customer.taxpayerType')">
              <el-select v-model="formData.taxpayerType" style="width: 100%">
                <el-option :label="$t('crm.customer.taxpayerOptions.general')" :value="1" />
                <el-option :label="$t('crm.customer.taxpayerOptions.small')" :value="2" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item :label="$t('crm.customer.creditCode')">
              <el-input v-model="formData.creditCode" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item :label="$t('crm.customer.website')">
              <el-input v-model="formData.website" />
            </el-form-item>
          </el-col>
          <el-col :span="24">
            <el-form-item :label="$t('crm.customer.address')">
              <el-input v-model="formData.address" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item :label="$t('crm.customer.servicePackage')">
              <el-input v-model="formData.servicePackage" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item :label="$t('crm.customer.billingCycle')">
              <el-input v-model="formData.billingCycle" />
            </el-form-item>
          </el-col>
          <el-col :span="24">
            <el-form-item :label="$t('crm.customer.remark')">
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

    <!-- 新增联系人弹窗 -->
    <el-dialog v-model="contactDialogVisible" :title="$t('common.add')" width="500px" destroy-on-close>
      <el-form ref="contactFormRef" :model="contactForm" label-width="100px">
        <el-form-item :label="$t('crm.contact.name')" prop="name">
          <el-input v-model="contactForm.name" />
        </el-form-item>
        <el-form-item :label="$t('crm.contact.position')">
          <el-input v-model="contactForm.position" />
        </el-form-item>
        <el-form-item :label="$t('crm.contact.mobile')">
          <el-input v-model="contactForm.mobile" />
        </el-form-item>
        <el-form-item :label="$t('crm.contact.email')">
          <el-input v-model="contactForm.email" />
        </el-form-item>
        <el-form-item :label="$t('crm.contact.wechat')">
          <el-input v-model="contactForm.wechat" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="contactDialogVisible = false">{{ $t('common.cancel') }}</el-button>
        <el-button type="primary" @click="submitContact">{{ $t('common.confirm') }}</el-button>
      </template>
    </el-dialog>

    <!-- 新增跟进弹窗 -->
    <el-dialog v-model="followDialogVisible" :title="$t('crm.follow.addFollow')" width="500px" destroy-on-close>
      <el-form ref="followFormRef" :model="followForm" label-width="120px">
        <el-form-item :label="$t('crm.follow.type')">
          <el-select v-model="followForm.type" style="width: 100%">
            <el-option :label="$t('crm.follow.typeOptions.phone')" :value="1" />
            <el-option :label="$t('crm.follow.typeOptions.visit')" :value="2" />
            <el-option :label="$t('crm.follow.typeOptions.wechat')" :value="3" />
            <el-option :label="$t('crm.follow.typeOptions.email')" :value="4" />
          </el-select>
        </el-form-item>
        <el-form-item :label="$t('crm.follow.content')" prop="content">
          <el-input v-model="followForm.content" type="textarea" :rows="4" />
        </el-form-item>
        <el-form-item :label="$t('crm.follow.nextTime')">
          <el-date-picker v-model="followForm.nextTime" type="datetime" style="width: 100%" />
        </el-form-item>
        <el-form-item :label="$t('crm.follow.nextContent')">
          <el-input v-model="followForm.nextContent" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="followDialogVisible = false">{{ $t('common.cancel') }}</el-button>
        <el-button type="primary" @click="submitFollow">{{ $t('common.confirm') }}</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox, type FormInstance } from 'element-plus'
import { useI18n } from 'vue-i18n'
import { customerApi, contactApi, followApi, opportunityApi, contractApi } from '@/api/crm'

const { t } = useI18n()
const loading = ref(false)
const tableData = ref<any[]>([])
const total = ref(0)
const dialogVisible = ref(false)
const isEdit = ref(false)
const formRef = ref<FormInstance>()
const drawerVisible = ref(false)
const currentCustomer = ref<any>(null)
const activeTab = ref('basic')
const contacts = ref<any[]>([])
const follows = ref<any[]>([])
const opportunities = ref<any[]>([])
const contracts = ref<any[]>([])
const contactDialogVisible = ref(false)
const followDialogVisible = ref(false)
const contactFormRef = ref<FormInstance>()
const followFormRef = ref<FormInstance>()

const queryParams = reactive({
  pageNum: 1, pageSize: 10, name: '', level: undefined as string | undefined, status: undefined as number | undefined
})

const formData = ref({
  id: undefined as number | undefined,
  name: '', shortName: '', industry: '', scale: '', level: 'C', taxpayerType: 1,
  creditCode: '', address: '', website: '', servicePackage: '', billingCycle: '', remark: ''
})

const contactForm = ref({ name: '', position: '', mobile: '', email: '', wechat: '', customerId: 0 })
const followForm = ref({ type: 1, content: '', nextTime: '', nextContent: '', customerId: 0 })

const rules = {
  name: [{ required: true, message: t('crm.customer.name'), trigger: 'blur' }],
  level: [{ required: true, message: t('crm.customer.level'), trigger: 'change' }]
}

const levelTagType = (val: string) => {
  const map: Record<string, string> = { A: 'danger', B: 'warning', C: '', D: 'info' }
  return map[val] || ''
}

const followTypeLabel = (val: number) => {
  const map: Record<number, string> = { 1: t('crm.follow.typeOptions.phone'), 2: t('crm.follow.typeOptions.visit'), 3: t('crm.follow.typeOptions.wechat'), 4: t('crm.follow.typeOptions.email') }
  return map[val] || '-'
}

const stageLabel = (val: number) => {
  const map: Record<number, string> = { 1: t('crm.opportunity.stageOptions.initial'), 2: t('crm.opportunity.stageOptions.requirement'), 3: t('crm.opportunity.stageOptions.proposal'), 4: t('crm.opportunity.stageOptions.negotiation'), 5: t('crm.opportunity.stageOptions.won'), 6: t('crm.opportunity.stageOptions.lost') }
  return map[val] || '-'
}

const contractStatusLabel = (val: number) => {
  const map: Record<number, string> = { 1: t('crm.contract.statusOptions.draft'), 2: t('crm.contract.statusOptions.approving'), 3: t('crm.contract.statusOptions.signed'), 4: t('crm.contract.statusOptions.executing'), 5: t('crm.contract.statusOptions.completed'), 6: t('crm.contract.statusOptions.terminated') }
  return map[val] || '-'
}

const loadData = async () => {
  loading.value = true
  try {
    const res = await customerApi.list(queryParams)
    tableData.value = res.data?.records || []
    total.value = res.data?.total || 0
  } finally {
    loading.value = false
  }
}

const resetQuery = () => {
  queryParams.name = ''; queryParams.level = undefined; queryParams.status = undefined; queryParams.pageNum = 1
  loadData()
}

const handleRowClick = async (row: any) => {
  currentCustomer.value = row
  activeTab.value = 'basic'
  drawerVisible.value = true
  // 加载关联数据
  const [cRes, fRes, oRes, ctRes] = await Promise.all([
    contactApi.list(row.id), followApi.list(row.id),
    opportunityApi.list({ customerId: row.id, pageSize: 100 }),
    contractApi.list({ customerId: row.id, pageSize: 100 })
  ])
  contacts.value = cRes.data || []
  follows.value = fRes.data || []
  opportunities.value = oRes.data?.records || []
  contracts.value = ctRes.data?.records || []
}

const handleAdd = () => {
  isEdit.value = false
  formData.value = { id: undefined, name: '', shortName: '', industry: '', scale: '', level: 'C', taxpayerType: 1, creditCode: '', address: '', website: '', servicePackage: '', billingCycle: '', remark: '' }
  dialogVisible.value = true
}

const handleEdit = (row: any) => {
  isEdit.value = true
  formData.value = { ...row }
  dialogVisible.value = true
}

const submitForm = async () => {
  await formRef.value?.validate()
  if (isEdit.value) { await customerApi.update(formData.value) } else { await customerApi.create(formData.value) }
  ElMessage.success(t('common.success'))
  dialogVisible.value = false
  loadData()
}

const handleDelete = (row: any) => {
  ElMessageBox.confirm(t('common.confirm') + '?', '', { type: 'warning' }).then(async () => {
    await customerApi.remove(row.id)
    ElMessage.success(t('common.success'))
    loadData()
  })
}

const handleToPool = (row: any) => {
  ElMessageBox.prompt(t('crm.customer.toPoolReason'), t('crm.customer.toPoolConfirm'), { type: 'warning' }).then(async ({ value }) => {
    await customerApi.toPool(row.id, value || '')
    ElMessage.success(t('common.success'))
    loadData()
  })
}

const showContactDialog = () => {
  contactForm.value = { name: '', position: '', mobile: '', email: '', wechat: '', customerId: currentCustomer.value.id }
  contactDialogVisible.value = true
}

const submitContact = async () => {
  await contactApi.create(contactForm.value)
  ElMessage.success(t('common.success'))
  contactDialogVisible.value = false
  contacts.value = (await contactApi.list(currentCustomer.value.id)).data || []
}

const showFollowDialog = () => {
  followForm.value = { type: 1, content: '', nextTime: '', nextContent: '', customerId: currentCustomer.value.id }
  followDialogVisible.value = true
}

const submitFollow = async () => {
  await followApi.create(followForm.value)
  ElMessage.success(t('common.success'))
  followDialogVisible.value = false
  follows.value = (await followApi.list(currentCustomer.value.id)).data || []
}

onMounted(() => loadData())
</script>

<style scoped>
.customer-page { padding: 20px; }
.search-bar { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 16px; }
.pagination-wrapper { display: flex; justify-content: flex-end; margin-top: 16px; }
</style>
