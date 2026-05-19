<template>
  <div class="page-container opportunity-page">
    <!-- 顶部操作 -->
    <div class="search-bar">
      <el-form :model="queryParams" inline>
        <el-form-item :label="$t('crm.opportunity.name')">
          <el-input v-model="queryParams.name" :placeholder="$t('crm.opportunity.name')" clearable @keyup.enter="loadData" />
        </el-form-item>
        <el-form-item :label="$t('crm.opportunity.stage')">
          <el-select v-model="queryParams.stage" :placeholder="$t('crm.opportunity.stage')" clearable>
            <el-option v-for="s in stageOptions" :key="s.value" :label="s.label" :value="s.value" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="loadData">{{ $t('common.search') }}</el-button>
          <el-button @click="resetQuery">{{ $t('common.reset') }}</el-button>
        </el-form-item>
      </el-form>
      <div class="top-actions">
        <el-radio-group v-model="viewMode" size="small" style="margin-right: 12px">
          <el-radio-button value="table">{{ $t('crm.opportunity.tableView') }}</el-radio-button>
          <el-radio-button value="board">{{ $t('crm.opportunity.boardView') }}</el-radio-button>
          <el-radio-button value="funnel">{{ $t('crm.opportunity.funnel') }}</el-radio-button>
        </el-radio-group>
        <el-button type="primary" @click="handleAdd">{{ $t('common.add') }}</el-button>
      </div>
    </div>

    <!-- 表格视图 -->
    <template v-if="viewMode === 'table'">
      <el-table :data="tableData" v-loading="loading" stripe>
        <el-table-column prop="name" :label="$t('crm.opportunity.name')" min-width="160" />
        <el-table-column prop="amount" :label="$t('crm.opportunity.amount')" width="130">
          <template #default="{ row }">¥{{ row.amount?.toLocaleString() }}</template>
        </el-table-column>
        <el-table-column prop="stage" :label="$t('crm.opportunity.stage')" width="120">
          <template #default="{ row }">
            <el-tag size="small" :type="stageTagType(row.stage)">{{ stageLabel(row.stage) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="expectedDate" :label="$t('crm.opportunity.expectedDate')" width="130" />
        <el-table-column prop="winRate" :label="$t('crm.opportunity.winRate')" width="120">
          <template #default="{ row }">
            <el-progress :percentage="row.winRate" :stroke-width="10" :color="'#F26522'" />
          </template>
        </el-table-column>
        <el-table-column prop="createTime" :label="$t('crm.lead.createTime')" width="170" />
        <el-table-column :label="$t('common.edit')" width="150" fixed="right">
          <template #default="{ row }">
            <el-button link type="primary" size="small" @click="handleEdit(row)">{{ $t('common.edit') }}</el-button>
            <el-button link type="danger" size="small" @click="handleDelete(row)">{{ $t('common.delete') }}</el-button>
          </template>
        </el-table-column>
      </el-table>
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
    </template>

    <!-- 看板视图 -->
    <template v-if="viewMode === 'board'">
      <div class="board-container">
        <div v-for="s in stageOptions" :key="s.value" class="board-column">
          <div class="board-column-header" :style="{ borderTopColor: '#F26522' }">
            <span>{{ s.label }}</span>
            <el-badge :value="boardData[s.value]?.length || 0" type="info" />
          </div>
          <div class="board-column-body">
            <div v-for="item in (boardData[s.value] || [])" :key="item.id" class="board-card" @click="handleEdit(item)">
              <div class="card-title">{{ item.name }}</div>
              <div class="card-amount">¥{{ item.amount?.toLocaleString() }}</div>
              <el-progress :percentage="item.winRate" :stroke-width="6" :color="'#F26522'" />
              <div class="card-date">{{ item.expectedDate || '-' }}</div>
            </div>
          </div>
        </div>
      </div>
    </template>

    <!-- 漏斗图 -->
    <template v-if="viewMode === 'funnel'">
      <div ref="funnelChartRef" class="funnel-chart"></div>
    </template>

    <!-- 新增/编辑弹窗 -->
    <el-dialog v-model="dialogVisible" :title="isEdit ? $t('common.edit') : $t('common.add')" width="550px" destroy-on-close>
      <el-form ref="formRef" :model="formData" :rules="rules" label-width="120px">
        <el-form-item :label="$t('crm.opportunity.customer')" prop="customerId">
          <el-select v-model="formData.customerId" style="width: 100%" filterable>
            <el-option v-for="c in customerList" :key="c.id" :label="c.name" :value="c.id" />
          </el-select>
        </el-form-item>
        <el-form-item :label="$t('crm.opportunity.name')" prop="name">
          <el-input v-model="formData.name" />
        </el-form-item>
        <el-form-item :label="$t('crm.opportunity.amount')">
          <el-input-number v-model="formData.amount" :min="0" :precision="2" controls-position="right" style="width: 100%" />
        </el-form-item>
        <el-form-item :label="$t('crm.opportunity.stage')">
          <el-select v-model="formData.stage" style="width: 100%">
            <el-option v-for="s in stageOptions" :key="s.value" :label="s.label" :value="s.value" />
          </el-select>
        </el-form-item>
        <el-form-item :label="$t('crm.opportunity.expectedDate')">
          <el-date-picker v-model="formData.expectedDate" type="date" value-format="YYYY-MM-DD" style="width: 100%" />
        </el-form-item>
        <el-form-item :label="$t('crm.opportunity.winRate')">
          <el-slider v-model="formData.winRate" :max="100" show-input />
        </el-form-item>
        <el-form-item :label="$t('crm.opportunity.remark')">
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
import { ref, reactive, computed, onMounted, watch, nextTick } from 'vue'
import { ElMessage, ElMessageBox, type FormInstance } from 'element-plus'
import { useI18n } from 'vue-i18n'
import { opportunityApi, customerApi } from '@/api/crm'
import * as echarts from 'echarts'

const { t } = useI18n()
const loading = ref(false)
const tableData = ref<any[]>([])
const total = ref(0)
const dialogVisible = ref(false)
const isEdit = ref(false)
const formRef = ref<FormInstance>()
const viewMode = ref('table')
const funnelChartRef = ref<HTMLElement>()
const customerList = ref<any[]>([])
const funnelData = ref<any[]>([])

const stageOptions = computed(() => [
  { value: 1, label: t('crm.opportunity.stageOptions.initial') },
  { value: 2, label: t('crm.opportunity.stageOptions.requirement') },
  { value: 3, label: t('crm.opportunity.stageOptions.proposal') },
  { value: 4, label: t('crm.opportunity.stageOptions.negotiation') },
  { value: 5, label: t('crm.opportunity.stageOptions.won') },
  { value: 6, label: t('crm.opportunity.stageOptions.lost') }
])

const queryParams = reactive({ pageNum: 1, pageSize: 10, name: '', stage: undefined as number | undefined })

const formData = ref({
  id: undefined as number | undefined,
  customerId: undefined as number | undefined,
  name: '', amount: 0, stage: 1, expectedDate: '', winRate: 20, remark: ''
})

const rules = {
  customerId: [{ required: true, message: t('crm.opportunity.customer'), trigger: 'change' }],
  name: [{ required: true, message: t('crm.opportunity.name'), trigger: 'blur' }]
}

const boardData = computed(() => {
  const grouped: Record<number, any[]> = {}
  tableData.value.forEach(item => {
    if (!grouped[item.stage]) grouped[item.stage] = []
    grouped[item.stage].push(item)
  })
  return grouped
})

const stageLabel = (val: number) => stageOptions.value.find(s => s.value === val)?.label || '-'
const stageTagType = (val: number) => {
  const map: Record<number, string> = { 1: 'info', 2: '', 3: 'warning', 4: '', 5: 'success', 6: 'danger' }
  return map[val] || ''
}

const loadData = async () => {
  loading.value = true
  try {
    const res = await opportunityApi.list({ ...queryParams, pageSize: viewMode.value === 'board' ? 1000 : queryParams.pageSize })
    tableData.value = res.data?.records || []
    total.value = res.data?.total || 0
  } finally {
    loading.value = false
  }
}

const loadFunnel = async () => {
  const res = await opportunityApi.funnel()
  funnelData.value = res.data || []
  await nextTick()
  renderFunnel()
}

const renderFunnel = () => {
  if (!funnelChartRef.value) return
  const chart = echarts.init(funnelChartRef.value)
  chart.setOption({
    tooltip: { trigger: 'item', formatter: '{b}: {c}' },
    color: ['#F26522', '#FF8C4B', '#FFB07A', '#FFD4AD', '#FFE8D6'],
    series: [{
      type: 'funnel', left: '10%', top: 60, bottom: 60, width: '80%', min: 0, max: 100, sort: 'descending', gap: 2,
      label: { show: true, position: 'inside', formatter: '{b}\n{c}' },
      data: funnelData.value.map((item: any, idx: number) => ({
        name: `${item.stageName} (${item.count})`,
        value: Math.max(100 - idx * 20, 10)
      }))
    }]
  })
}

const resetQuery = () => { queryParams.name = ''; queryParams.stage = undefined; queryParams.pageNum = 1; loadData() }

const handleAdd = () => {
  isEdit.value = false
  formData.value = { id: undefined, customerId: undefined, name: '', amount: 0, stage: 1, expectedDate: '', winRate: 20, remark: '' }
  dialogVisible.value = true
}

const handleEdit = (row: any) => {
  isEdit.value = true
  formData.value = { ...row }
  dialogVisible.value = true
}

const submitForm = async () => {
  await formRef.value?.validate()
  if (isEdit.value) { await opportunityApi.update(formData.value) } else { await opportunityApi.create(formData.value) }
  ElMessage.success(t('common.success'))
  dialogVisible.value = false
  loadData()
}

const handleDelete = (row: any) => {
  ElMessageBox.confirm(t('common.confirm') + '?', '', { type: 'warning' }).then(async () => {
    await opportunityApi.remove(row.id)
    ElMessage.success(t('common.success'))
    loadData()
  })
}

watch(viewMode, (val) => {
  if (val === 'funnel') loadFunnel()
  else if (val === 'board') loadData()
})

onMounted(async () => {
  const res = await customerApi.list({ pageSize: 1000 })
  customerList.value = res.data?.records || []
  loadData()
})
</script>

<style scoped>
.opportunity-page { padding: 20px; }
.search-bar { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 16px; }
.top-actions { display: flex; align-items: center; }
.pagination-wrapper { display: flex; justify-content: flex-end; margin-top: 16px; }
.board-container { display: flex; gap: 12px; overflow-x: auto; min-height: 500px; }
.board-column { flex: 1; min-width: 220px; background: #f5f5f5; border-radius: 8px; display: flex; flex-direction: column; }
.board-column-header { padding: 12px 16px; font-weight: 600; border-top: 3px solid #F26522; display: flex; justify-content: space-between; align-items: center; }
.board-column-body { padding: 8px; flex: 1; overflow-y: auto; }
.board-card { background: #fff; border-radius: 6px; padding: 12px; margin-bottom: 8px; cursor: pointer; box-shadow: 0 1px 3px rgba(0,0,0,0.08); transition: box-shadow 0.2s; }
.board-card:hover { box-shadow: 0 3px 8px rgba(242,101,34,0.15); }
.card-title { font-weight: 500; margin-bottom: 6px; }
.card-amount { color: #F26522; font-size: 16px; font-weight: 600; margin-bottom: 6px; }
.card-date { color: #999; font-size: 12px; margin-top: 6px; }
.funnel-chart { width: 100%; height: 500px; }
</style>
