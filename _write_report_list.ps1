$listVue = @'
<template>
  <div class="page-container report-list-page">
    <div class="report-layout">
      <!-- 左侧分类侧栏 -->
      <div class="category-sidebar">
        <h4>{{ $t('report.category') }}</h4>
        <ul class="category-list">
          <li v-for="cat in categories" :key="cat.value"
              :class="{ active: activeCategory === cat.value }"
              @click="activeCategory = cat.value; loadData()">
            <el-icon><component :is="cat.icon" /></el-icon>
            <span>{{ cat.label }}</span>
          </li>
        </ul>
      </div>

      <!-- 右侧内容 -->
      <div class="report-content">
        <!-- 顶部搜索 -->
        <div class="search-bar">
          <el-form :model="queryParams" inline>
            <el-form-item>
              <el-input v-model="queryParams.name" :placeholder="$t('report.name')" clearable @keyup.enter="loadData" prefix-icon="Search" />
            </el-form-item>
            <el-form-item>
              <el-select v-model="queryParams.type" :placeholder="$t('report.type')" clearable>
                <el-option :label="$t('report.typeTable')" value="table" />
                <el-option :label="$t('report.typeChart')" value="chart" />
                <el-option :label="$t('report.typeDashboard')" value="dashboard" />
              </el-select>
            </el-form-item>
            <el-form-item>
              <el-button type="primary" @click="loadData">{{ $t('common.search') }}</el-button>
              <el-button @click="resetQuery">{{ $t('common.reset') }}</el-button>
            </el-form-item>
          </el-form>
          <el-button type="primary" @click="handleCreate">
            <el-icon><Plus /></el-icon>{{ $t('report.newReport') }}
          </el-button>
        </div>

        <!-- 报表卡片网格 -->
        <div v-loading="loading" class="report-grid">
          <div v-if="reportList.length === 0 && !loading" class="empty-state">
            <el-empty :description="$t('common.noData')" />
          </div>
          <div v-for="item in reportList" :key="item.id" class="report-card" @click="handlePreview(item)">
            <div class="card-header">
              <div class="card-icon" :class="'type-' + item.type">
                <el-icon :size="28">
                  <DataLine v-if="item.type === 'chart'" />
                  <Grid v-else-if="item.type === 'table'" />
                  <DataAnalysis v-else />
                </el-icon>
              </div>
              <el-dropdown trigger="click" @command="(cmd: string) => handleCommand(cmd, item)" @click.stop>
                <el-icon class="card-more"><MoreFilled /></el-icon>
                <template #dropdown>
                  <el-dropdown-menu>
                    <el-dropdown-item command="preview"><el-icon><View /></el-icon>{{ $t('common.view') }}</el-dropdown-item>
                    <el-dropdown-item command="edit"><el-icon><Edit /></el-icon>{{ $t('common.edit') }}</el-dropdown-item>
                    <el-dropdown-item command="copy"><el-icon><CopyDocument /></el-icon>{{ $t('report.copyReport') }}</el-dropdown-item>
                    <el-dropdown-item command="subscribe"><el-icon><Bell /></el-icon>{{ $t('report.subscribe') }}</el-dropdown-item>
                    <el-dropdown-item command="delete" divided><el-icon><Delete /></el-icon>{{ $t('common.delete') }}</el-dropdown-item>
                  </el-dropdown-menu>
                </template>
              </el-dropdown>
            </div>
            <div class="card-body">
              <h3 class="card-title">{{ item.name }}</h3>
              <div class="card-tags">
                <el-tag size="small" type="info">{{ getCategoryLabel(item.category) }}</el-tag>
                <el-tag size="small" :type="item.status === 1 ? 'success' : 'warning'">
                  {{ item.status === 1 ? $t('report.statusPublished') : $t('report.statusDraft') }}
                </el-tag>
              </div>
            </div>
            <div class="card-footer">
              <span class="card-time">{{ item.createTime?.substring(0, 10) }}</span>
            </div>
          </div>
        </div>

        <!-- 分页 -->
        <div class="pagination-wrapper">
          <el-pagination
            v-model:current-page="queryParams.pageNum"
            v-model:page-size="queryParams.pageSize"
            :total="total"
            :page-sizes="[12, 24, 48]"
            layout="total, sizes, prev, pager, next"
            @size-change="loadData"
            @current-change="loadData"
          />
        </div>
      </div>
    </div>

    <!-- 订阅对话框 -->
    <el-dialog v-model="subscribeVisible" :title="$t('report.subscribeReport')" width="500px">
      <el-form :model="scheduleForm" label-width="100px">
        <el-form-item :label="$t('report.cronExpression')">
          <el-input v-model="scheduleForm.cronExpression" placeholder="0 0 8 * * ?" />
        </el-form-item>
        <el-form-item :label="$t('report.recipients')">
          <el-input v-model="scheduleForm.recipients" :placeholder="$t('report.recipients')" />
        </el-form-item>
        <el-form-item :label="$t('report.channel')">
          <el-select v-model="scheduleForm.channel">
            <el-option :label="$t('report.channelEmail')" value="email" />
            <el-option :label="$t('report.channelSms')" value="sms" />
            <el-option :label="$t('report.channelIm')" value="im" />
          </el-select>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="subscribeVisible = false">{{ $t('common.cancel') }}</el-button>
        <el-button type="primary" @click="submitSubscribe">{{ $t('common.confirm') }}</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus, Search, DataLine, Grid, DataAnalysis, MoreFilled, View, Edit, CopyDocument, Bell, Delete } from '@element-plus/icons-vue'
import { reportDefinitionApi, reportScheduleApi } from '@/api/report'
import type { ReportDefinition, ReportSchedule } from '@/api/report'

const { t } = useI18n()
const router = useRouter()

const loading = ref(false)
const reportList = ref<ReportDefinition[]>([])
const total = ref(0)
const activeCategory = ref('')
const subscribeVisible = ref(false)
const currentReport = ref<ReportDefinition | null>(null)

const queryParams = reactive({
  pageNum: 1,
  pageSize: 12,
  name: '',
  type: '',
  category: ''
})

const scheduleForm = reactive<Partial<ReportSchedule>>({
  cronExpression: '0 0 8 * * ?',
  recipients: '',
  channel: 'email',
  status: 1
})

const categories = computed(() => [
  { value: '', label: t('report.categoryAll'), icon: 'Grid' },
  { value: 'crm', label: t('report.categoryCrm'), icon: 'User' },
  { value: 'finance', label: t('report.categoryFinance'), icon: 'Money' },
  { value: 'hrm', label: t('report.categoryHrm'), icon: 'Avatar' },
  { value: 'sales', label: t('report.categorySales'), icon: 'ShoppingCart' },
  { value: 'supply', label: t('report.categorySupply'), icon: 'Van' },
  { value: 'other', label: t('report.categoryOther'), icon: 'More' }
])

function getCategoryLabel(cat: string) {
  const found = categories.value.find(c => c.value === cat)
  return found ? found.label : cat
}

async function loadData() {
  loading.value = true
  queryParams.category = activeCategory.value
  try {
    const res: any = await reportDefinitionApi.list(queryParams)
    reportList.value = res.data?.records || res.data?.list || []
    total.value = res.data?.total || 0
  } finally {
    loading.value = false
  }
}

function resetQuery() {
  queryParams.name = ''
  queryParams.type = ''
  activeCategory.value = ''
  loadData()
}

function handleCreate() {
  router.push('/report/designer')
}

function handlePreview(item: ReportDefinition) {
  router.push({ path: '/report/preview', query: { id: String(item.id) } })
}

function handleCommand(cmd: string, item: ReportDefinition) {
  switch (cmd) {
    case 'preview': handlePreview(item); break
    case 'edit': router.push({ path: '/report/designer', query: { id: String(item.id) } }); break
    case 'copy': handleCopy(item); break
    case 'subscribe': showSubscribe(item); break
    case 'delete': handleDelete(item); break
  }
}

async function handleCopy(item: ReportDefinition) {
  await ElMessageBox.confirm(t('report.confirmCopy'), t('report.copyReport'))
  await reportDefinitionApi.copy(item.id!)
  ElMessage.success(t('report.copySuccess'))
  loadData()
}

async function handleDelete(item: ReportDefinition) {
  await ElMessageBox.confirm(t('report.confirmDelete'), t('report.deleteReport'))
  await reportDefinitionApi.remove(item.id!)
  ElMessage.success(t('common.success'))
  loadData()
}

function showSubscribe(item: ReportDefinition) {
  currentReport.value = item
  subscribeVisible.value = true
}

async function submitSubscribe() {
  if (!currentReport.value) return
  await reportScheduleApi.create({
    reportId: currentReport.value.id!,
    cronExpression: scheduleForm.cronExpression!,
    recipients: scheduleForm.recipients!,
    channel: scheduleForm.channel as any,
    status: 1
  })
  ElMessage.success(t('common.success'))
  subscribeVisible.value = false
}

onMounted(() => {
  loadData()
})
</script>

<style scoped>
.report-list-page { height: 100%; }
.report-layout { display: flex; gap: 20px; height: 100%; }
.category-sidebar {
  width: 180px; flex-shrink: 0; background: var(--el-bg-color);
  border-radius: 8px; padding: 16px; border: 1px solid var(--el-border-color-lighter);
}
.category-sidebar h4 { margin: 0 0 12px; font-size: 14px; color: var(--el-text-color-secondary); }
.category-list { list-style: none; padding: 0; margin: 0; }
.category-list li {
  display: flex; align-items: center; gap: 8px; padding: 10px 12px;
  border-radius: 6px; cursor: pointer; font-size: 14px;
  color: var(--el-text-color-regular); transition: all 0.2s;
}
.category-list li:hover { background: var(--el-fill-color-light); }
.category-list li.active { background: rgba(242,101,34,0.1); color: #F26522; font-weight: 500; }
.report-content { flex: 1; min-width: 0; }
.search-bar { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 16px; flex-wrap: wrap; gap: 8px; }
.report-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 16px; min-height: 200px; }
.report-card {
  background: var(--el-bg-color); border: 1px solid var(--el-border-color-lighter);
  border-radius: 10px; padding: 20px; cursor: pointer; transition: all 0.3s;
}
.report-card:hover { transform: translateY(-2px); box-shadow: 0 8px 24px rgba(0,0,0,0.08); border-color: #F26522; }
.card-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 14px; }
.card-icon { width: 48px; height: 48px; border-radius: 10px; display: flex; align-items: center; justify-content: center; color: #fff; }
.card-icon.type-chart { background: linear-gradient(135deg, #F26522, #FF8C42); }
.card-icon.type-table { background: linear-gradient(135deg, #3B82F6, #60A5FA); }
.card-icon.type-dashboard { background: linear-gradient(135deg, #8B5CF6, #A78BFA); }
.card-more { font-size: 18px; color: var(--el-text-color-secondary); cursor: pointer; padding: 4px; }
.card-body { margin-bottom: 12px; }
.card-title { font-size: 15px; font-weight: 600; margin: 0 0 8px; color: var(--el-text-color-primary); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.card-tags { display: flex; gap: 6px; }
.card-footer { display: flex; justify-content: space-between; font-size: 12px; color: var(--el-text-color-secondary); }
.pagination-wrapper { margin-top: 20px; display: flex; justify-content: flex-end; }
.empty-state { grid-column: 1 / -1; display: flex; justify-content: center; align-items: center; min-height: 300px; }
</style>
'@

Set-Content -Path "d:\zhehang-erp\zhehang-erp-ui\src\views\report\list.vue" -Value $listVue -Encoding UTF8
Write-Output "list.vue done"
