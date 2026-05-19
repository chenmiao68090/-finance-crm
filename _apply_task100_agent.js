// Transforms agent.vue: replaces hardcoded Chinese with $t() / t() calls.
const fs = require('fs');
const file = 'd:\\zhehang-erp\\zhehang-erp-ui\\src\\views\\call-center\\agent.vue';
let s = fs.readFileSync(file, 'utf8');

function rep(o, n) {
  if (s.indexOf(o) === -1) {
    console.warn('NOT FOUND:', JSON.stringify(o.slice(0, 80)));
    return;
  }
  s = s.replace(o, n);
}

// ============ <script setup> imports ============
rep(
  "import type { FormInstance, FormRules } from 'element-plus'",
  "import type { FormInstance, FormRules } from 'element-plus'\nimport { useI18n } from 'vue-i18n'"
);

rep(
  "  type SkillGroup\n} from '@/api/call-center'",
  "  type SkillGroup\n} from '@/api/call-center'\n\nconst { t } = useI18n()"
);

// ============ Template: header ============
rep(
  '<div class="eyebrow">CALL · CENTER / AGENTS</div>',
  '<div class="eyebrow">{{ t(\'cc.agent.eyebrow\') }}</div>'
);
rep(
  '<h2 class="title">坐席管理</h2>',
  '<h2 class="title">{{ t(\'cc.agent.title\') }}</h2>'
);
rep(
  '<p class="subtitle">管理坐席档案 · 监测在线状态 · 调度技能分组</p>',
  '<p class="subtitle">{{ t(\'cc.agent.subtitle\') }}</p>'
);
rep(
  '<div class="now-tag">实时</div>',
  '<div class="now-tag">{{ t(\'cc.agent.live\') }}</div>'
);

// stat-card unit "人"
rep(
  '<span class="unit">人</span>',
  '<span class="unit">{{ t(\'cc.monitor.kpi.unit.person\') }}</span>'
);

// ============ Toolbar ============
rep(
  'placeholder="搜索工号 / 姓名 / 分机"',
  ':placeholder="t(\'cc.agent.filter.keywordPlaceholder\')"'
);
rep(
  'placeholder="全部状态"',
  ':placeholder="t(\'cc.agent.filter.statusAll\')"'
);
rep(
  '<el-button :icon="Refresh" @click="resetFilter">重置</el-button>',
  '<el-button :icon="Refresh" @click="resetFilter">{{ t(\'common.reset\') }}</el-button>'
);
rep(
  '<el-button type="primary" :icon="Plus" @click="handleAdd">新增坐席</el-button>',
  '<el-button type="primary" :icon="Plus" @click="handleAdd">{{ t(\'cc.agent.action.add\') }}</el-button>'
);

// ============ Table columns ============
rep(
  '<el-table-column label="工号" width="110">',
  '<el-table-column :label="t(\'cc.agent.column.agentNo\')" width="110">'
);
rep(
  '<el-table-column label="姓名" min-width="180">',
  '<el-table-column :label="t(\'cc.agent.column.name\')" min-width="180">'
);
rep(
  '<el-table-column prop="extension" label="分机号" width="110">',
  '<el-table-column prop="extension" :label="t(\'cc.agent.column.extension\')" width="110">'
);
rep(
  '<el-table-column label="技能组" min-width="220">',
  '<el-table-column :label="t(\'cc.agent.column.skillGroups\')" min-width="220">'
);
rep(
  '<span v-else class="muted">未分配</span>',
  '<span v-else class="muted">{{ t(\'cc.agent.unassigned\') }}</span>'
);
rep(
  '<el-table-column label="当前状态" width="160">',
  '<el-table-column :label="t(\'cc.agent.column.status\')" width="160">'
);
rep(
  '<el-table-column label="在线时长" width="140">',
  '<el-table-column :label="t(\'cc.agent.column.onlineDuration\')" width="140">'
);
rep(
  '<el-table-column label="操作" width="290" fixed="right">',
  '<el-table-column :label="t(\'common.operation\')" width="290" fixed="right">'
);

// ============ Row actions ============
rep(
  '<el-button link type="primary" size="small" @click="handleEdit(row)">编辑</el-button>',
  '<el-button link type="primary" size="small" @click="handleEdit(row)">{{ t(\'common.edit\') }}</el-button>'
);
rep(
  '              切换状态<el-icon class="el-icon--right"><ArrowDown /></el-icon>',
  '              {{ t(\'cc.agent.action.switchStatus\') }}<el-icon class="el-icon--right"><ArrowDown /></el-icon>'
);

// rename v-for variable `t` → `tr` to avoid colliding with i18n's `t`
rep(
  `                  <el-dropdown-item
                    v-for="t in availableTransitions(row.status)"
                    :key="t"
                    :command="t"
                  >
                    <span class="status-dot" :style="{ background: statusColor(t), color: statusColor(t) }"></span>
                    转为「{{ statusLabel(t) }}」
                  </el-dropdown-item>`,
  `                  <el-dropdown-item
                    v-for="tr in availableTransitions(row.status)"
                    :key="tr"
                    :command="tr"
                  >
                    <span class="status-dot" :style="{ background: statusColor(tr), color: statusColor(tr) }"></span>
                    {{ t('cc.agent.action.transitionTo', { label: statusLabel(tr) }) }}
                  </el-dropdown-item>`
);

rep(
  '<el-dropdown-item v-else disabled>无可切换状态</el-dropdown-item>',
  '<el-dropdown-item v-else disabled>{{ t(\'cc.agent.action.noTransition\') }}</el-dropdown-item>'
);
rep(
  '<el-button link type="danger" size="small" @click="handleDelete(row)">删除</el-button>',
  '<el-button link type="danger" size="small" @click="handleDelete(row)">{{ t(\'common.delete\') }}</el-button>'
);
rep(
  '<el-empty description="暂无坐席数据" />',
  '<el-empty :description="t(\'cc.agent.empty\')" />'
);

// ============ Dialog ============
rep(
  ":title=\"dialogMode === 'add' ? '新增坐席' : '编辑坐席'\"",
  ":title=\"dialogMode === 'add' ? t('cc.agent.form.addTitle') : t('cc.agent.form.editTitle')\""
);
rep(
  '<el-form-item label="工号" prop="agentNo">',
  '<el-form-item :label="t(\'cc.agent.form.agentNo\')" prop="agentNo">'
);
rep(
  '<el-input v-model="form.agentNo" placeholder="如 1007" maxlength="8" />',
  '<el-input v-model="form.agentNo" :placeholder="t(\'cc.agent.form.agentNoPlaceholder\')" maxlength="8" />'
);
rep(
  '<el-form-item label="姓名" prop="name">',
  '<el-form-item :label="t(\'cc.agent.form.name\')" prop="name">'
);
rep(
  '<el-input v-model="form.name" placeholder="请输入姓名" maxlength="20" />',
  '<el-input v-model="form.name" :placeholder="t(\'cc.agent.form.namePlaceholder\')" maxlength="20" />'
);
rep(
  '<el-form-item label="手机号" prop="phone">',
  '<el-form-item :label="t(\'cc.agent.form.mobile\')" prop="phone">'
);
rep(
  '<el-input v-model="form.phone" placeholder="11 位手机号" maxlength="11" />',
  '<el-input v-model="form.phone" :placeholder="t(\'cc.agent.form.mobilePlaceholder\')" maxlength="11" />'
);
rep(
  '<el-form-item label="分机号" prop="extension">',
  '<el-form-item :label="t(\'cc.agent.form.extension\')" prop="extension">'
);
rep(
  '<el-input v-model="form.extension" placeholder="如 8007" maxlength="6" />',
  '<el-input v-model="form.extension" :placeholder="t(\'cc.agent.form.extensionPlaceholder\')" maxlength="6" />'
);
rep(
  '<el-form-item label="所属技能组" prop="skillGroupIds">',
  '<el-form-item :label="t(\'cc.agent.form.skillGroups\')" prop="skillGroupIds">'
);
rep(
  'placeholder="选择一个或多个技能组"',
  ':placeholder="t(\'cc.agent.form.skillGroupsPlaceholder\')"'
);
rep(
  '<el-form-item label="角色" prop="role">',
  '<el-form-item :label="t(\'cc.agent.form.role\')" prop="role">'
);
rep(
  '<el-radio-button value="agent">坐席</el-radio-button>',
  '<el-radio-button value="agent">{{ t(\'cc.agent.role.agent\') }}</el-radio-button>'
);
rep(
  '<el-radio-button value="leader">班长</el-radio-button>',
  '<el-radio-button value="leader">{{ t(\'cc.agent.role.supervisor\') }}</el-radio-button>'
);
rep(
  '<el-radio-button value="admin">管理员</el-radio-button>',
  '<el-radio-button value="admin">{{ t(\'cc.agent.role.admin\') }}</el-radio-button>'
);
rep(
  '<el-button @click="dialogVisible = false">取消</el-button>',
  '<el-button @click="dialogVisible = false">{{ t(\'common.cancel\') }}</el-button>'
);
rep(
  '<el-button type="primary" :loading="submitting" @click="handleSubmit">确定</el-button>',
  '<el-button type="primary" :loading="submitting" @click="handleSubmit">{{ t(\'common.confirm\') }}</el-button>'
);

// ============ Script: STATUS_META ============
const oldMeta = `const STATUS_META: Record<UiStatus, { label: string; tag: '' | 'success' | 'warning' | 'info' | 'danger' | 'primary'; color: string }> = {
  offline:   { label: '离线',   tag: 'danger',  color: '#5E5A52' },
  ready:     { label: '就绪',   tag: 'success', color: '#06D6A0' },
  talking:   { label: '通话中', tag: 'warning', color: '#FFD166' },
  break:     { label: '小休',   tag: 'info',    color: '#8B7BFF' },
  afterwork: { label: '后处理', tag: 'primary', color: '#D4AF37' },
  training:  { label: '培训',   tag: 'info',    color: '#5B8DEF' },
  meeting:   { label: '会议',   tag: 'info',    color: '#B76E79' }
}`;
const newMeta = `type StatusTag = '' | 'success' | 'warning' | 'info' | 'danger' | 'primary'
const STATUS_META = computed<Record<UiStatus, { label: string; tag: StatusTag; color: string }>>(() => ({
  offline:   { label: t('cc.agent.status.offline'),   tag: 'danger',  color: '#5E5A52' },
  ready:     { label: t('cc.agent.status.ready'),     tag: 'success', color: '#06D6A0' },
  talking:   { label: t('cc.agent.status.talking'),   tag: 'warning', color: '#FFD166' },
  break:     { label: t('cc.agent.status.break'),     tag: 'info',    color: '#8B7BFF' },
  afterwork: { label: t('cc.agent.status.afterwork'), tag: 'primary', color: '#D4AF37' },
  training:  { label: t('cc.agent.status.training'),  tag: 'info',    color: '#5B8DEF' },
  meeting:   { label: t('cc.agent.status.meeting'),   tag: 'info',    color: '#B76E79' }
}))`;
rep(oldMeta, newMeta);

const oldOpts = `const statusOptions = (Object.keys(STATUS_META) as UiStatus[]).map(k => ({
  value: k,
  label: STATUS_META[k].label,
  color: STATUS_META[k].color
}))`;
const newOpts = `const statusOptions = computed(() => (Object.keys(STATUS_META.value) as UiStatus[]).map(k => ({
  value: k,
  label: STATUS_META.value[k].label,
  color: STATUS_META.value[k].color
})))`;
rep(oldOpts, newOpts);

rep(
  'const statusLabel = (s: string) => STATUS_META[fromApiStatus(s)]?.label || s',
  'const statusLabel = (s: string) => STATUS_META.value[fromApiStatus(s)]?.label || s'
);
rep(
  "const statusColor = (s: string) => STATUS_META[fromApiStatus(s)]?.color || '#888'",
  "const statusColor = (s: string) => STATUS_META.value[fromApiStatus(s)]?.color || '#888'"
);
rep(
  "const statusTagType = (s: string) => STATUS_META[fromApiStatus(s)]?.tag || ''",
  "const statusTagType = (s: string) => STATUS_META.value[fromApiStatus(s)]?.tag || ''"
);

// ============ stats labels ============
rep(
  "{ key: 'online',  label: '在线坐席数', value: cnt(s => fromApiStatus(s) !== 'offline'), icon: User },",
  "{ key: 'online',  label: t('cc.agent.stats.online'),  value: cnt(s => fromApiStatus(s) !== 'offline'), icon: User },"
);
rep(
  "{ key: 'ready',   label: '就 绪 数',   value: cnt(s => fromApiStatus(s) === 'ready'),   icon: Headset },",
  "{ key: 'ready',   label: t('cc.agent.stats.ready'),   value: cnt(s => fromApiStatus(s) === 'ready'),   icon: Headset },"
);
rep(
  "{ key: 'talking', label: '通话中数',   value: cnt(s => fromApiStatus(s) === 'talking'), icon: PhoneFilled },",
  "{ key: 'talking', label: t('cc.agent.stats.talking'), value: cnt(s => fromApiStatus(s) === 'talking'), icon: PhoneFilled },"
);
rep(
  "{ key: 'break',   label: '小 休 数',   value: cnt(s => fromApiStatus(s) === 'break'),   icon: Coffee }",
  "{ key: 'break',   label: t('cc.agent.stats.break'),   value: cnt(s => fromApiStatus(s) === 'break'),   icon: Coffee }"
);

// ============ handleStatusChange ============
rep(
  "ElMessage.success(`「${row.name}」已切换为「${STATUS_META[target].label}」`)",
  "ElMessage.success(t('cc.agent.message.statusSwitched', { name: row.name, label: STATUS_META.value[target].label }))"
);
rep(
  "ElMessage.error('状态切换失败')",
  "ElMessage.error(t('cc.agent.message.statusSwitchFailed'))"
);

// ============ Validation rules ============
rep(
  "{ required: true, message: '请输入工号', trigger: 'blur' },",
  "{ required: true, message: t('cc.agent.validation.agentNoRequired'), trigger: 'blur' },"
);
rep(
  "{ pattern: /^\\d{3,8}$/, message: '工号为 3-8 位数字', trigger: 'blur' }",
  "{ pattern: /^\\d{3,8}$/, message: t('cc.agent.validation.agentNoFormat'), trigger: 'blur' }"
);
rep(
  "{ required: true, message: '请输入姓名', trigger: 'blur' },",
  "{ required: true, message: t('cc.agent.validation.nameRequired'), trigger: 'blur' },"
);
rep(
  "{ min: 2, max: 20, message: '姓名长度 2-20 个字符', trigger: 'blur' }",
  "{ min: 2, max: 20, message: t('cc.agent.validation.nameLength'), trigger: 'blur' }"
);
rep(
  "{ pattern: /^1\\d{10}$/, message: '请输入 11 位手机号', trigger: 'blur' }",
  "{ pattern: /^1\\d{10}$/, message: t('cc.agent.validation.mobileFormat'), trigger: 'blur' }"
);
rep(
  "{ required: true, message: '请输入分机号', trigger: 'blur' },",
  "{ required: true, message: t('cc.agent.validation.extensionRequired'), trigger: 'blur' },"
);
rep(
  "{ pattern: /^\\d{3,6}$/, message: '分机号为 3-6 位数字', trigger: 'blur' }",
  "{ pattern: /^\\d{3,6}$/, message: t('cc.agent.validation.extensionFormat'), trigger: 'blur' }"
);
rep(
  "{ type: 'array', required: true, message: '请至少选择 1 个技能组', trigger: 'change' }",
  "{ type: 'array', required: true, message: t('cc.agent.validation.skillGroupsRequired'), trigger: 'change' }"
);
rep(
  "{ required: true, message: '请选择角色', trigger: 'change' }",
  "{ required: true, message: t('cc.agent.validation.roleRequired'), trigger: 'change' }"
);

// ============ Submit messages ============
rep(
  "ElMessage.success('坐席新增成功')",
  "ElMessage.success(t('cc.agent.message.addSuccess'))"
);
rep(
  "ElMessage.success('坐席信息已保存')",
  "ElMessage.success(t('cc.agent.message.updateSuccess'))"
);

// ============ Delete confirm ============
const oldDel = `ElMessageBox.confirm(
    \`确定删除坐席「\${row.name}（工号 \${row.agentNo}）」？删除后将无法恢复。\`,
    '删除确认',
    { type: 'warning', confirmButtonText: '删除', cancelButtonText: '取消' }
  )`;
const newDel = `ElMessageBox.confirm(
    t('cc.agent.message.deleteConfirm', { name: row.name, agentNo: row.agentNo }),
    t('common.confirmDelete'),
    { type: 'warning', confirmButtonText: t('common.delete'), cancelButtonText: t('common.cancel') }
  )`;
rep(oldDel, newDel);

rep(
  "ElMessage.success('已删除')",
  "ElMessage.success(t('cc.agent.message.deleteSuccess'))"
);

fs.writeFileSync(file, s, 'utf8');
console.log('agent.vue done');
