<template>
  <div class="lead-page">
    <!-- 顶部 Tab 切换 -->
    <div class="page-header">
      <el-tabs v-model="activeTab" class="lead-tabs" @tab-change="handleTabChange">
        <el-tab-pane label="线索池" name="pool" />
        <el-tab-pane label="我的线索" name="my" />
        <el-tab-pane label="全部线索" name="all" />
      </el-tabs>
    </div>

    <!-- 筛选搜索区 -->
    <div class="filter-bar">
      <div class="filter-left">
        <el-select v-model="queryParams.source" placeholder="来源" clearable style="width: 120px">
          <el-option label="网站" :value="1" />
          <el-option label="电话" :value="2" />
          <el-option label="推荐" :value="3" />
          <el-option label="广告" :value="4" />
        </el-select>
        <el-select v-model="queryParams.status" placeholder="状态" clearable style="width: 120px">
          <el-option label="新建" :value="1" />
          <el-option label="跟进中" :value="2" />
          <el-option label="已转化" :value="3" />
          <el-option label="无效" :value="4" />
        </el-select>
        <el-input
          v-model="queryParams.keyword"
          placeholder="线索名称 / 手机号"
          clearable
          style="width: 240px"
          @keyup.enter="handleSearch"
        >
          <template #prefix><el-icon><Search /></el-icon></template>
        </el-input>
        <el-button type="primary" plain @click="handleSearch">查询</el-button>
        <el-button plain @click="handleReset">重置</el-button>
      </div>
      <div class="filter-right">
        <el-button type="primary" @click="openCreate">
          <el-icon><Plus /></el-icon>新建
        </el-button>
        <el-dropdown trigger="click" @command="handleMore">
          <el-button plain>
            更多<el-icon class="el-icon--right"><ArrowDown /></el-icon>
          </el-button>
          <template #dropdown>
            <el-dropdown-menu>
              <el-dropdown-item command="import"><el-icon><Upload /></el-icon>导入线索</el-dropdown-item>
              <el-dropdown-item command="export"><el-icon><Download /></el-icon>导出线索</el-dropdown-item>
              <el-dropdown-item divided command="rules"><el-icon><Setting /></el-icon>设置公海规则</el-dropdown-item>
              <el-dropdown-item command="duplicate"><el-icon><Search /></el-icon>查重工具</el-dropdown-item>
            </el-dropdown-menu>
          </template>
        </el-dropdown>
      </div>
    </div>

    <!-- 批量操作栏 -->
    <div v-if="selectedRows.length > 0" class="batch-bar">
      <span class="batch-info">已选 <em>{{ selectedRows.length }}</em> 条</span>
      <div class="batch-actions">
        <template v-if="activeTab === 'pool'">
          <el-button type="primary" size="small" @click="handleClaim">领取</el-button>
          <el-button size="small" @click="openDistribute">分配</el-button>
        </template>
        <template v-else-if="activeTab === 'my'">
          <el-button size="small" @click="openReturnPool">退回公海</el-button>
          <el-button type="danger" size="small" @click="handleBatchDelete">删除</el-button>
        </template>
        <template v-else>
          <el-button size="small" @click="openDistribute">分配</el-button>
          <el-button type="danger" size="small" @click="handleBatchDelete">删除</el-button>
        </template>
        <el-button text @click="clearSelection">取消选择</el-button>
      </div>
    </div>

    <!-- 数据表格 -->
    <div class="table-wrap">
      <el-table
        ref="tableRef"
        v-loading="loading"
        :data="filteredList"
        stripe
        border
        height="calc(100vh - 320px)"
        @selection-change="handleSelectionChange"
      >
        <el-table-column type="selection" width="50" />
        <el-table-column label="线索名称" prop="name" min-width="140">
          <template #default="{ row }">
            <a class="link-text" @click="openEdit(row)">{{ row.name }}</a>
          </template>
        </el-table-column>
        <el-table-column label="公司名称" prop="company" min-width="180" show-overflow-tooltip />
        <el-table-column label="手机号码" prop="phone" width="140" />
        <el-table-column label="来源" width="100">
          <template #default="{ row }">
            <el-tag :type="sourceTagType(row.source)" effect="dark">{{ sourceLabel(row.source) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="statusTagType(row.status)" effect="plain">{{ statusLabel(row.status) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="负责人" prop="ownerName" width="110">
          <template #default="{ row }">
            <span v-if="row.ownerName">{{ row.ownerName }}</span>
            <span v-else class="muted">— 公海 —</span>
          </template>
        </el-table-column>
        <el-table-column label="最近跟进" prop="lastFollowTime" width="160" />
        <el-table-column label="创建时间" prop="createTime" width="160" />
        <el-table-column label="操作" width="220" fixed="right">
          <template #default="{ row }">
            <el-button v-if="activeTab === 'pool'" size="small" type="primary" link @click="handleClaimSingle(row)">领取</el-button>
            <el-button size="small" link @click="openEdit(row)">编辑</el-button>
            <el-button size="small" type="success" link @click="handleConvert(row)">转化</el-button>
            <el-button size="small" type="danger" link @click="handleDelete(row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>

      <div class="pagination-wrap">
        <el-pagination
          v-model:current-page="queryParams.page"
          v-model:page-size="queryParams.size"
          :page-sizes="[10, 20, 50, 100]"
          :total="totalCount"
          layout="total, sizes, prev, pager, next, jumper"
          background
        />
      </div>
    </div>

    <!-- 新增 / 编辑弹窗 -->
    <el-dialog v-model="formDialog.visible" :title="formDialog.isEdit ? '编辑线索' : '新建线索'" width="640px" destroy-on-close>
      <el-form ref="formRef" :model="formData" :rules="formRules" label-width="100px">
        <el-row :gutter="16">
          <el-col :span="12">
            <el-form-item label="线索名称" prop="name">
              <el-input v-model="formData.name" placeholder="请输入线索名称" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="公司名称" prop="company">
              <el-input v-model="formData.company" placeholder="请输入公司名称" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="手机号码" prop="phone">
              <el-input v-model="formData.phone" placeholder="请输入手机号" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="邮箱" prop="email">
              <el-input v-model="formData.email" placeholder="请输入邮箱" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="来源" prop="source">
              <el-select v-model="formData.source" placeholder="请选择来源" style="width: 100%">
                <el-option label="网站" :value="1" />
                <el-option label="电话" :value="2" />
                <el-option label="推荐" :value="3" />
                <el-option label="广告" :value="4" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="24">
            <el-form-item label="备注" prop="remark">
              <el-input v-model="formData.remark" type="textarea" :rows="3" placeholder="补充信息" />
            </el-form-item>
          </el-col>
        </el-row>
      </el-form>
      <template #footer>
        <el-button @click="formDialog.visible = false">取消</el-button>
        <el-button type="primary" @click="submitForm">保存</el-button>
      </template>
    </el-dialog>

    <!-- 分配弹窗 -->
    <el-dialog v-model="distributeDialog.visible" title="分配线索" width="420px">
      <el-form label-width="90px">
        <el-form-item label="负责人">
          <el-select v-model="distributeDialog.ownerId" placeholder="请选择负责人" style="width: 100%">
            <el-option v-for="u in mockUsers" :key="u.id" :label="u.name" :value="u.id" />
          </el-select>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="distributeDialog.visible = false">取消</el-button>
        <el-button type="primary" @click="submitDistribute">确认分配</el-button>
      </template>
    </el-dialog>

    <!-- 退回公海弹窗 -->
    <el-dialog v-model="returnDialog.visible" title="退回公海" width="420px">
      <el-form label-width="90px">
        <el-form-item label="退回原因">
          <el-input v-model="returnDialog.reason" type="textarea" :rows="3" placeholder="请输入退回原因" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="returnDialog.visible = false">取消</el-button>
        <el-button type="primary" @click="submitReturn">确认退回</el-button>
      </template>
    </el-dialog>

    <!-- 公海规则设置弹窗 -->
    <el-dialog v-model="rulesDialog.visible" title="公海规则设置" width="800px" top="6vh">
      <el-tabs v-model="rulesDialog.activeTab" class="rules-inner-tabs">
        <el-tab-pane label="分配规则" name="distribute">
          <el-table :data="rulesDialog.distributeRules" border>
            <el-table-column label="规则名称" min-width="140">
              <template #default="{ row }">
                <el-input v-model="row.name" size="small" placeholder="规则名称" />
              </template>
            </el-table-column>
            <el-table-column label="触发条件" width="140">
              <template #default="{ row }">
                <el-select v-model="row.trigger" size="small" style="width: 100%">
                  <el-option label="新建线索" value="onCreate" />
                  <el-option label="进入公海" value="onPool" />
                  <el-option label="导入时" value="onImport" />
                </el-select>
              </template>
            </el-table-column>
            <el-table-column label="分配方式" width="130">
              <template #default="{ row }">
                <el-select v-model="row.mode" size="small" style="width: 100%">
                  <el-option label="轮询" value="round" />
                  <el-option label="按地区" value="region" />
                  <el-option label="指定人员" value="specify" />
                </el-select>
              </template>
            </el-table-column>
            <el-table-column label="分配对象" min-width="140">
              <template #default="{ row }">
                <el-input v-model="row.target" size="small" placeholder="销售/部门" />
              </template>
            </el-table-column>
            <el-table-column label="最大保有量" width="110">
              <template #default="{ row }">
                <el-input-number v-model="row.maxHold" :min="0" size="small" controls-position="right" style="width: 100%" />
              </template>
            </el-table-column>
            <el-table-column label="优先级" width="90">
              <template #default="{ row }">
                <el-input-number v-model="row.priority" :min="1" :max="99" size="small" controls-position="right" style="width: 100%" />
              </template>
            </el-table-column>
            <el-table-column label="启用" width="70">
              <template #default="{ row }">
                <el-switch v-model="row.enabled" />
              </template>
            </el-table-column>
            <el-table-column label="操作" width="70" fixed="right">
              <template #default="{ $index }">
                <el-button type="danger" link size="small" @click="rulesDialog.distributeRules.splice($index, 1)">删除</el-button>
              </template>
            </el-table-column>
          </el-table>
          <div class="rule-add-bar">
            <el-button plain size="small" @click="addDistributeRule"><el-icon><Plus /></el-icon>添加规则</el-button>
          </div>
        </el-tab-pane>

        <el-tab-pane label="自动回收规则" name="recycle">
          <el-table :data="rulesDialog.recycleRules" border>
            <el-table-column label="规则名称" min-width="140">
              <template #default="{ row }">
                <el-input v-model="row.name" size="small" placeholder="规则名称" />
              </template>
            </el-table-column>
            <el-table-column label="回收条件" width="170">
              <template #default="{ row }">
                <el-select v-model="row.condition" size="small" style="width: 100%">
                  <el-option label="未跟进" value="noFollow" />
                  <el-option label="未成交" value="noDeal" />
                  <el-option label="未联系" value="noContact" />
                </el-select>
              </template>
            </el-table-column>
            <el-table-column label="天数" width="110">
              <template #default="{ row }">
                <el-input-number v-model="row.days" :min="1" size="small" controls-position="right" style="width: 100%" />
              </template>
            </el-table-column>
            <el-table-column label="适用范围" width="160">
              <template #default="{ row }">
                <el-select v-model="row.scope" size="small" style="width: 100%">
                  <el-option label="全部线索" value="all" />
                  <el-option label="按来源" value="source" />
                  <el-option label="按部门" value="dept" />
                </el-select>
              </template>
            </el-table-column>
            <el-table-column label="启用" width="80">
              <template #default="{ row }">
                <el-switch v-model="row.enabled" />
              </template>
            </el-table-column>
            <el-table-column label="操作" width="80" fixed="right">
              <template #default="{ $index }">
                <el-button type="danger" link size="small" @click="rulesDialog.recycleRules.splice($index, 1)">删除</el-button>
              </template>
            </el-table-column>
          </el-table>
          <div class="rule-add-bar">
            <el-button plain size="small" @click="addRecycleRule"><el-icon><Plus /></el-icon>添加规则</el-button>
          </div>
        </el-tab-pane>
      </el-tabs>
      <template #footer>
        <el-button @click="rulesDialog.visible = false">取消</el-button>
        <el-button type="primary" @click="savePoolRules">保存</el-button>
      </template>
    </el-dialog>

    <!-- 导入弹窗 -->
    <el-dialog v-model="importDialog.visible" title="导入线索" width="640px">
      <div class="import-tip">
        <el-icon><InfoFilled /></el-icon>
        <span>支持 CSV / Excel 文件导入，建议先下载模板按格式填写</span>
        <el-button link type="primary" @click="downloadTemplate">下载模板</el-button>
      </div>
      <el-upload
        class="import-upload"
        drag
        :auto-upload="false"
        :on-change="handleFileChange"
        :limit="1"
        accept=".csv,.xlsx,.xls"
      >
        <el-icon class="el-icon--upload"><UploadFilled /></el-icon>
        <div class="el-upload__text">将文件拖到此处，或<em>点击选择文件</em></div>
      </el-upload>
      <div v-if="importDialog.preview.length" class="import-preview">
        <div class="preview-title">预览（前 5 行）</div>
        <el-table :data="importDialog.preview" size="small" border>
          <el-table-column prop="name" label="线索名称" />
          <el-table-column prop="company" label="公司" />
          <el-table-column prop="phone" label="手机号" />
          <el-table-column prop="email" label="邮箱" />
        </el-table>
      </div>
      <template #footer>
        <el-button @click="importDialog.visible = false">取消</el-button>
        <el-button type="primary" :disabled="!importDialog.preview.length" @click="confirmImport">确认导入</el-button>
      </template>
    </el-dialog>

    <!-- 查重工具弹窗 -->
    <el-dialog v-model="dupDialog.visible" title="查重工具" width="640px">
      <el-form inline>
        <el-form-item label="查重字段">
          <el-radio-group v-model="dupDialog.field">
            <el-radio label="phone">手机号</el-radio>
            <el-radio label="name">线索名称</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="查重值">
          <el-input v-model="dupDialog.value" placeholder="请输入要查重的内容" style="width: 240px" />
        </el-form-item>
        <el-button type="primary" @click="runDuplicate">查重</el-button>
      </el-form>
      <div v-if="dupDialog.searched" class="dup-result">
        <el-alert
          :title="`匹配到 ${dupDialog.results.length} 条记录`"
          :type="dupDialog.results.length ? 'warning' : 'success'"
          :closable="false"
          show-icon
        />
        <el-table v-if="dupDialog.results.length" :data="dupDialog.results" size="small" border style="margin-top: 12px">
          <el-table-column prop="name" label="线索名称" />
          <el-table-column prop="company" label="公司" />
          <el-table-column prop="phone" label="手机号" />
          <el-table-column prop="ownerName" label="负责人" />
        </el-table>
      </div>
      <template #footer>
        <el-button @click="dupDialog.visible = false">关闭</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox, type FormInstance, type FormRules } from 'element-plus'
import {
  Search, Plus, ArrowDown, Upload, Download, Setting,
  InfoFilled, UploadFilled
} from '@element-plus/icons-vue'
import { leadApi } from '@/api/crm'

interface Lead {
  id: number
  name: string
  company: string
  phone: string
  email: string
  source: number
  status: number
  pool: number
  ownerId: number | null
  ownerName: string
  lastFollowTime: string
  createTime: string
  remark: string
}

const STORAGE_KEY = 'crm_leads_data'
const RULES_KEY = 'lead_pool_rules'
const CURRENT_USER_ID = 1
const CURRENT_USER_NAME = '我'

const mockUsers = [
  { id: 1, name: '张三' },
  { id: 2, name: '李四' },
  { id: 3, name: '王五' },
  { id: 4, name: '赵六' }
]

const activeTab = ref<'pool' | 'my' | 'all'>('pool')
const loading = ref(false)
const tableRef = ref()
const allLeads = ref<Lead[]>([])
const selectedRows = ref<Lead[]>([])

const queryParams = reactive({
  page: 1,
  size: 20,
  source: null as number | null,
  status: null as number | null,
  keyword: ''
})

// ============ 数据初始化 ============
const seedData = (): Lead[] => {
  const sources = [1, 2, 3, 4]
  const statuses = [1, 2, 3, 4]
  const companies = ['星辰科技', '宏途集团', '金辉资本', '云智软件', '盛世传媒', '远翔物流', '锦程贸易', '弘毅咨询', '海纳信息', '博远教育']
  const names = ['陈先生', '林女士', '王经理', '赵总', '李主管', '周小姐', '吴先生', '郑女士', '黄总监', '徐经理']
  const phones = ['13812345678', '13987654321', '13700001234', '13600009999', '13511112222', '13422223333', '13333334444', '13244445555', '13155556666', '13066667777']
  const list: Lead[] = []
  for (let i = 0; i < 10; i++) {
    const isPool = i % 2 === 0
    list.push({
      id: 1000 + i,
      name: names[i],
      company: companies[i],
      phone: phones[i],
      email: `lead${i}@demo.com`,
      source: sources[i % 4],
      status: statuses[i % 4],
      pool: isPool ? 1 : 0,
      ownerId: isPool ? null : (i % 4) + 1,
      ownerName: isPool ? '' : mockUsers[(i % 4)].name,
      lastFollowTime: `2026-05-${String(10 + i).padStart(2, '0')} 10:30`,
      createTime: `2026-05-${String(1 + i).padStart(2, '0')} 09:00`,
      remark: ''
    })
  }
  return list
}

const loadFromStorage = (): Lead[] => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) return JSON.parse(raw) as Lead[]
  } catch {}
  return []
}

const saveToStorage = () => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(allLeads.value))
  } catch {}
}

const fetchLeads = async () => {
  loading.value = true
  try {
    let resp: any = null
    if (activeTab.value === 'pool') resp = await leadApi.poolList(queryParams)
    else if (activeTab.value === 'my') resp = await leadApi.myList(queryParams)
    else resp = await leadApi.list(queryParams)
    if (resp && Array.isArray(resp.records)) {
      allLeads.value = resp.records
      saveToStorage()
    } else {
      throw new Error('empty')
    }
  } catch {
    let cached = loadFromStorage()
    if (!cached.length) {
      cached = seedData()
      allLeads.value = cached
      saveToStorage()
    } else {
      allLeads.value = cached
    }
  } finally {
    loading.value = false
  }
}

// ============ 计算属性 ============
const filteredList = computed(() => {
  let list = allLeads.value.slice()
  if (activeTab.value === 'pool') list = list.filter(l => l.pool === 1)
  else if (activeTab.value === 'my') list = list.filter(l => l.pool === 0 && l.ownerId === CURRENT_USER_ID)
  if (queryParams.source != null) list = list.filter(l => l.source === queryParams.source)
  if (queryParams.status != null) list = list.filter(l => l.status === queryParams.status)
  const kw = queryParams.keyword.trim()
  if (kw) list = list.filter(l => l.name.includes(kw) || l.phone.includes(kw))
  return list
})

const totalCount = computed(() => filteredList.value.length)

// ============ 标签辅助 ============
const sourceLabel = (s: number) => ({ 1: '网站', 2: '电话', 3: '推荐', 4: '广告' } as any)[s] || '未知'
const sourceTagType = (s: number) => (['', 'success', 'warning', 'info', 'danger'] as const)[s] || ''
const statusLabel = (s: number) => ({ 1: '新建', 2: '跟进中', 3: '已转化', 4: '无效' } as any)[s] || '未知'
const statusTagType = (s: number): 'info' | 'warning' | 'success' | 'danger' => {
  if (s === 1) return 'info'
  if (s === 2) return 'warning'
  if (s === 3) return 'success'
  return 'danger'
}

// ============ 交互 ============
const handleTabChange = () => {
  selectedRows.value = []
  queryParams.page = 1
  fetchLeads()
}
const handleSearch = () => { queryParams.page = 1 }
const handleReset = () => {
  queryParams.source = null
  queryParams.status = null
  queryParams.keyword = ''
  queryParams.page = 1
}
const handleSelectionChange = (rows: Lead[]) => { selectedRows.value = rows }
const clearSelection = () => { tableRef.value?.clearSelection() }

// ============ 新建 / 编辑 ============
const formRef = ref<FormInstance>()
const formDialog = reactive({ visible: false, isEdit: false })
const formData = reactive<Partial<Lead>>({
  id: 0, name: '', company: '', phone: '', email: '', source: 1, status: 1, remark: ''
})
const formRules: FormRules = {
  name: [{ required: true, message: '请输入线索名称', trigger: 'blur' }],
  phone: [{ required: true, message: '请输入手机号', trigger: 'blur' }],
  source: [{ required: true, message: '请选择来源', trigger: 'change' }]
}

const resetFormData = () => {
  Object.assign(formData, { id: 0, name: '', company: '', phone: '', email: '', source: 1, status: 1, remark: '' })
}
const openCreate = () => {
  formDialog.isEdit = false
  resetFormData()
  formDialog.visible = true
}
const openEdit = (row: Lead) => {
  formDialog.isEdit = true
  Object.assign(formData, row)
  formDialog.visible = true
}
const submitForm = async () => {
  if (!formRef.value) return
  await formRef.value.validate(async (valid) => {
    if (!valid) return
    if (formDialog.isEdit) {
      try { await leadApi.update(formData) } catch {}
      const idx = allLeads.value.findIndex(l => l.id === formData.id)
      if (idx >= 0) Object.assign(allLeads.value[idx], formData)
      ElMessage.success('已更新')
    } else {
      const newLead: Lead = {
        id: Date.now(),
        name: formData.name || '',
        company: formData.company || '',
        phone: formData.phone || '',
        email: formData.email || '',
        source: formData.source || 1,
        status: 1,
        pool: 0,
        ownerId: CURRENT_USER_ID,
        ownerName: CURRENT_USER_NAME,
        lastFollowTime: '',
        createTime: new Date().toISOString().slice(0, 16).replace('T', ' '),
        remark: formData.remark || ''
      }
      try { await leadApi.create(newLead) } catch {}
      allLeads.value.unshift(newLead)
      ElMessage.success('已创建')
    }
    saveToStorage()
    formDialog.visible = false
  })
}

// ============ 删除 / 转化 ============
const handleDelete = async (row: Lead) => {
  await ElMessageBox.confirm(`确定删除线索「${row.name}」？`, '提示', { type: 'warning' })
  try { await leadApi.remove(row.id) } catch {}
  allLeads.value = allLeads.value.filter(l => l.id !== row.id)
  saveToStorage()
  ElMessage.success('已删除')
}
const handleBatchDelete = async () => {
  await ElMessageBox.confirm(`确定删除选中的 ${selectedRows.value.length} 条线索？`, '提示', { type: 'warning' })
  const ids = selectedRows.value.map(r => r.id)
  allLeads.value = allLeads.value.filter(l => !ids.includes(l.id))
  saveToStorage()
  selectedRows.value = []
  ElMessage.success('已删除')
}
const handleConvert = async (row: Lead) => {
  await ElMessageBox.confirm(`确定将「${row.name}」转化为客户？`, '提示', { type: 'info' })
  try { await leadApi.convert(row.id) } catch {}
  row.status = 3
  saveToStorage()
  ElMessage.success('已转化')
}

// ============ 领取 / 退回 / 分配 ============
const handleClaimSingle = async (row: Lead) => {
  try { await leadApi.claim([row.id]) } catch {}
  row.pool = 0
  row.ownerId = CURRENT_USER_ID
  row.ownerName = CURRENT_USER_NAME
  saveToStorage()
  ElMessage.success(`已领取「${row.name}」`)
}
const handleClaim = async () => {
  const ids = selectedRows.value.map(r => r.id)
  try { await leadApi.claim(ids) } catch {}
  allLeads.value.forEach(l => {
    if (ids.includes(l.id)) {
      l.pool = 0
      l.ownerId = CURRENT_USER_ID
      l.ownerName = CURRENT_USER_NAME
    }
  })
  saveToStorage()
  selectedRows.value = []
  ElMessage.success(`已领取 ${ids.length} 条`)
}

const distributeDialog = reactive({ visible: false, ownerId: null as number | null })
const openDistribute = () => {
  distributeDialog.ownerId = null
  distributeDialog.visible = true
}
const submitDistribute = async () => {
  if (!distributeDialog.ownerId) return ElMessage.warning('请选择负责人')
  const ids = selectedRows.value.map(r => r.id)
  const ownerId = distributeDialog.ownerId
  const ownerName = mockUsers.find(u => u.id === ownerId)?.name || ''
  try { await leadApi.distribute({ ids, ownerId }) } catch {}
  allLeads.value.forEach(l => {
    if (ids.includes(l.id)) {
      l.pool = 0
      l.ownerId = ownerId
      l.ownerName = ownerName
    }
  })
  saveToStorage()
  selectedRows.value = []
  distributeDialog.visible = false
  ElMessage.success('已分配')
}

const returnDialog = reactive({ visible: false, reason: '' })
const openReturnPool = () => {
  returnDialog.reason = ''
  returnDialog.visible = true
}
const submitReturn = async () => {
  const ids = selectedRows.value.map(r => r.id)
  try { await leadApi.returnToPool(ids, returnDialog.reason) } catch {}
  allLeads.value.forEach(l => {
    if (ids.includes(l.id)) {
      l.pool = 1
      l.ownerId = null
      l.ownerName = ''
    }
  })
  saveToStorage()
  selectedRows.value = []
  returnDialog.visible = false
  ElMessage.success('已退回公海')
}

// ============ 更多菜单 ============
const handleMore = (cmd: string) => {
  if (cmd === 'import') importDialog.visible = true
  else if (cmd === 'export') doExport()
  else if (cmd === 'rules') openRules()
  else if (cmd === 'duplicate') {
    dupDialog.field = 'phone'
    dupDialog.value = ''
    dupDialog.searched = false
    dupDialog.results = []
    dupDialog.visible = true
  }
}

// ============ 公海规则 ============
interface DistributeRule { name: string; trigger: string; mode: string; target: string; maxHold: number; priority: number; enabled: boolean }
interface RecycleRule { name: string; condition: string; days: number; scope: string; enabled: boolean }

const rulesDialog = reactive({
  visible: false,
  activeTab: 'distribute',
  distributeRules: [] as DistributeRule[],
  recycleRules: [] as RecycleRule[]
})

const addDistributeRule = () => {
  rulesDialog.distributeRules.push({
    name: '新规则', trigger: 'onCreate', mode: 'round', target: '', maxHold: 100, priority: 10, enabled: true
  })
}
const addRecycleRule = () => {
  rulesDialog.recycleRules.push({ name: '新规则', condition: 'noFollow', days: 15, scope: 'all', enabled: true })
}

const openRules = async () => {
  try {
    const resp: any = await leadApi.getPoolRules()
    rulesDialog.distributeRules = resp?.distributeRules || []
    rulesDialog.recycleRules = resp?.recycleRules || []
  } catch {
    try {
      const raw = localStorage.getItem(RULES_KEY)
      if (raw) {
        const data = JSON.parse(raw)
        rulesDialog.distributeRules = data.distributeRules || []
        rulesDialog.recycleRules = data.recycleRules || []
      } else {
        rulesDialog.distributeRules = [
          { name: '默认轮询', trigger: 'onCreate', mode: 'round', target: '销售一部', maxHold: 200, priority: 10, enabled: true }
        ]
        rulesDialog.recycleRules = [
          { name: '15 天未跟进', condition: 'noFollow', days: 15, scope: 'all', enabled: true }
        ]
      }
    } catch {}
  }
  rulesDialog.visible = true
}

const savePoolRules = async () => {
  const payload = {
    distributeRules: rulesDialog.distributeRules,
    recycleRules: rulesDialog.recycleRules
  }
  try {
    await leadApi.savePoolRules(payload)
    ElMessage.success('规则已保存到服务端')
  } catch {
    try { localStorage.setItem(RULES_KEY, JSON.stringify(payload)) } catch {}
    ElMessage.success('规则已保存到本地')
  }
  rulesDialog.visible = false
}

// ============ 导入 ============
const importDialog = reactive({
  visible: false,
  preview: [] as any[],
  rows: [] as any[]
})

const downloadTemplate = () => {
  const header = '线索名称,公司,手机号,邮箱,来源(1网站/2电话/3推荐/4广告),备注\n'
  const sample = '示例客户,示例公司,13800000000,demo@x.com,1,示例备注\n'
  const blob = new Blob(['\uFEFF' + header + sample], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = 'lead_template.csv'
  a.click()
  URL.revokeObjectURL(url)
}

const handleFileChange = (file: any) => {
  const reader = new FileReader()
  reader.onload = (e) => {
    const text = (e.target?.result as string) || ''
    const lines = text.replace(/^\uFEFF/, '').split(/\r?\n/).filter(Boolean)
    if (lines.length < 2) {
      ElMessage.warning('文件内容为空')
      return
    }
    const rows: any[] = []
    for (let i = 1; i < lines.length; i++) {
      const cols = lines[i].split(',')
      rows.push({
        name: cols[0]?.trim() || '',
        company: cols[1]?.trim() || '',
        phone: cols[2]?.trim() || '',
        email: cols[3]?.trim() || '',
        source: Number(cols[4]?.trim()) || 1,
        remark: cols[5]?.trim() || ''
      })
    }
    importDialog.rows = rows
    importDialog.preview = rows.slice(0, 5)
  }
  reader.readAsText(file.raw, 'utf-8')
}

const confirmImport = async () => {
  try {
    const fd = new FormData()
    fd.append('rows', JSON.stringify(importDialog.rows))
    await leadApi.importLeads(fd)
  } catch {}
  const now = new Date().toISOString().slice(0, 16).replace('T', ' ')
  importDialog.rows.forEach((r: any, idx: number) => {
    allLeads.value.unshift({
      id: Date.now() + idx,
      name: r.name, company: r.company, phone: r.phone, email: r.email,
      source: r.source, status: 1, pool: 1,
      ownerId: null, ownerName: '',
      lastFollowTime: '', createTime: now, remark: r.remark || ''
    })
  })
  saveToStorage()
  ElMessage.success(`已导入 ${importDialog.rows.length} 条线索`)
  importDialog.preview = []
  importDialog.rows = []
  importDialog.visible = false
}

// ============ 导出 ============
const doExport = () => {
  const rows = filteredList.value
  if (!rows.length) return ElMessage.warning('当前没有可导出数据')
  const header = ['线索名称', '公司', '手机号', '邮箱', '来源', '状态', '负责人', '最近跟进', '创建时间']
  const lines = [header.join(',')]
  rows.forEach(r => {
    lines.push([
      r.name, r.company, r.phone, r.email,
      sourceLabel(r.source), statusLabel(r.status),
      r.ownerName || '公海', r.lastFollowTime || '', r.createTime
    ].map(v => `"${String(v).replace(/"/g, '""')}"`).join(','))
  })
  const blob = new Blob(['\uFEFF' + lines.join('\n')], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `线索导出_${Date.now()}.csv`
  a.click()
  URL.revokeObjectURL(url)
  ElMessage.success(`已导出 ${rows.length} 条`)
}

// ============ 查重 ============
const dupDialog = reactive({
  visible: false,
  field: 'phone' as 'phone' | 'name',
  value: '',
  searched: false,
  results: [] as Lead[]
})

const runDuplicate = async () => {
  const v = dupDialog.value.trim()
  if (!v) return ElMessage.warning('请输入查重值')
  try {
    const resp: any = await leadApi.checkDuplicate({ [dupDialog.field]: v })
    if (resp && Array.isArray(resp.records)) {
      dupDialog.results = resp.records
      dupDialog.searched = true
      return
    }
  } catch {}
  dupDialog.results = allLeads.value.filter(l => {
    if (dupDialog.field === 'phone') return l.phone.includes(v)
    return l.name.includes(v)
  })
  dupDialog.searched = true
}

onMounted(fetchLeads)
</script>

<style scoped>
.lead-page {
  padding: 16px 20px;
  background: var(--bg-card);
  min-height: calc(100vh - 60px);
  color: var(--text-primary);
}

.page-header {
  background: var(--bg-elevated);
  border: 1px solid var(--border-gold);
  border-radius: 8px 8px 0 0;
  padding: 4px 16px 0;
}
.lead-tabs :deep(.el-tabs__item) {
  color: var(--text-body);
  font-size: 14px;
}
.lead-tabs :deep(.el-tabs__item.is-active) {
  color: var(--gold-primary);
  font-weight: 600;
}
.lead-tabs :deep(.el-tabs__active-bar) {
  background: var(--gold-primary);
  height: 3px;
  border-radius: 2px;
}
.lead-tabs :deep(.el-tabs__nav-wrap::after) { background: var(--border-gold); }

.filter-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 14px 16px;
  background: var(--bg-elevated);
  border-left: 1px solid var(--border-gold);
  border-right: 1px solid var(--border-gold);
  border-bottom: 1px solid var(--border-gold);
}
.filter-left { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; }
.filter-right { display: flex; align-items: center; gap: 10px; }

.batch-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 16px;
  background: linear-gradient(90deg, rgba(212, 175, 55, 0.08), rgba(212, 175, 55, 0));
  border-left: 1px solid var(--border-gold);
  border-right: 1px solid var(--border-gold);
  border-bottom: 1px solid var(--border-gold);
}
.batch-info { color: var(--text-body); font-size: 13px; }
.batch-info em { font-style: normal; color: var(--gold-primary); font-weight: 600; padding: 0 4px; }
.batch-actions { display: flex; align-items: center; gap: 8px; }

.table-wrap {
  background: var(--bg-elevated);
  border: 1px solid var(--border-gold);
  border-top: none;
  border-radius: 0 0 8px 8px;
  padding: 8px 12px 12px;
}
.link-text { color: var(--gold-primary); cursor: pointer; }
.link-text:hover { color: var(--gold-champagne); text-decoration: underline; }
.muted { color: var(--text-body); font-size: 12px; }

.pagination-wrap {
  display: flex;
  justify-content: flex-end;
  margin-top: 12px;
  padding: 8px 4px;
}

.rules-inner-tabs :deep(.el-tabs__item.is-active) { color: var(--gold-primary); }
.rules-inner-tabs :deep(.el-tabs__active-bar) { background: var(--gold-primary); }
.rule-add-bar {
  margin-top: 12px;
  padding-top: 8px;
  border-top: 1px dashed var(--border-gold);
  text-align: center;
}

.import-tip {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 12px;
  background: rgba(212, 175, 55, 0.08);
  border: 1px solid var(--border-gold);
  border-radius: 6px;
  color: var(--text-body);
  font-size: 13px;
  margin-bottom: 14px;
}
.import-tip .el-icon { color: var(--warning); }
.import-upload :deep(.el-upload-dragger) {
  background: var(--bg-darkest);
  border-color: var(--border-gold);
}
.import-preview { margin-top: 16px; }
.preview-title { color: var(--gold-primary); font-size: 13px; margin-bottom: 8px; font-weight: 600; }

.dup-result { margin-top: 12px; }
</style>
