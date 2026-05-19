// Convert skill.vue to use i18n
const fs = require('fs')
const FILE = 'd:/zhehang-erp/zhehang-erp-ui/src/views/call-center/skill.vue'

let s = fs.readFileSync(FILE, 'utf8')
s = s.replace(/\r\n/g, '\n')

const checks = []
function rep(a, b) {
  if (s.indexOf(a) === -1) {
    checks.push('NOT FOUND: ' + a.slice(0, 80).replace(/\n/g, '\\n'))
    return
  }
  s = s.split(a).join(b)
}

// ===== 1. Imports =====
rep(
  "import { ref, reactive, computed, onMounted } from 'vue'",
  "import { ref, reactive, computed, onMounted } from 'vue'\nimport { useI18n } from 'vue-i18n'"
)
rep(
  "} from '@/api/call-center'\n\ninterface SkillRow",
  "} from '@/api/call-center'\n\nconst { t } = useI18n()\n\ninterface SkillRow"
)

// ===== 2. Top mark =====
rep('<span class="mark-en">SKILL · ACD</span>\n      <span class="mark-cn">\u6280\u80fd\u7ec4\u4e0e\u667a\u80fd\u8def\u7531</span>',
    '<span class="mark-en">{{ t(\'cc.skill.ext.markEn\') }}</span>\n      <span class="mark-cn">{{ t(\'cc.skill.ext.markCn\') }}</span>')

// ===== 3. Panel title / hint =====
rep('<span class="text">\u6280\u80fd\u7ec4\u5217\u8868</span>\n          <span class="hint">ACD \u00b7 \u81ea\u52a8\u547c\u53eb\u5206\u914d \u00b7 \u961f\u5217\u7ba1\u7406</span>',
    '<span class="text">{{ t(\'cc.skill.ext.panelTitle\') }}</span>\n          <span class="hint">{{ t(\'cc.skill.ext.panelHint\') }}</span>')

// ===== 4. Search input =====
rep('placeholder="\u641c\u7d22\u6280\u80fd\u7ec4\u540d\u79f0 / \u7f16\u7801"',
    ':placeholder="t(\'cc.skill.ext.searchPlaceholder\')"')

// ===== 5. Refresh / Create buttons =====
rep('<el-icon><Refresh /></el-icon>&nbsp;\u5237\u65b0',
    '<el-icon><Refresh /></el-icon>&nbsp;{{ t(\'cc.skill.ext.refreshBtn\') }}')
rep('<el-icon><Plus /></el-icon>&nbsp;\u65b0\u5efa\u6280\u80fd\u7ec4',
    '<el-icon><Plus /></el-icon>&nbsp;{{ t(\'cc.skill.ext.createBtn\') }}')

// ===== 6. Table column labels =====
rep('<el-table-column label="\u6280\u80fd\u7ec4" min-width="260">',
    '<el-table-column :label="t(\'cc.skill.ext.colSkill\')" min-width="260">')
rep('<el-table-column label="\u5206\u914d\u7b56\u7565" min-width="160">',
    '<el-table-column :label="t(\'cc.skill.ext.colStrategy\')" min-width="160">')
rep('<el-table-column label="\u6210\u5458" width="120" align="center">',
    '<el-table-column :label="t(\'cc.skill.ext.colMembers\')" width="120" align="center">')
rep('<el-table-column label="\u5f53\u524d\u6392\u961f" width="150" align="center">',
    '<el-table-column :label="t(\'cc.skill.ext.colCurrentQueue\')" width="150" align="center">')
rep('<el-table-column label="\u72b6\u6001" width="100" align="center">',
    '<el-table-column :label="t(\'cc.skill.ext.colStatus\')" width="100" align="center">')
rep('<el-table-column prop="createdAt" label="\u521b\u5efa\u65f6\u95f4" width="170" />',
    '<el-table-column prop="createdAt" :label="t(\'cc.skill.ext.colCreatedAt\')" width="170" />')
rep('<el-table-column label="\u64cd\u4f5c" fixed="right" width="270" align="center">',
    '<el-table-column :label="t(\'cc.skill.ext.colOperation\')" fixed="right" width="270" align="center">')

// ===== 7. Member unit + action buttons =====
rep('<span class="m-num">{{ row.agentCount }}</span><span class="m-unit"> \u4eba</span>',
    '<span class="m-num">{{ row.agentCount }}</span><span class="m-unit"> {{ t(\'cc.skill.ext.colMemberUnit\') }}</span>')
rep('<el-button link class="op" @click="openEdit(row)">\u7f16\u8f91</el-button>',
    '<el-button link class="op" @click="openEdit(row)">{{ t(\'cc.skill.ext.btnEdit\') }}</el-button>')
rep('<el-button link class="op" @click="openMembers(row)">\u6210\u5458\u7ba1\u7406</el-button>',
    '<el-button link class="op" @click="openMembers(row)">{{ t(\'cc.skill.ext.btnMembers\') }}</el-button>')
rep('<el-button link class="op" @click="openQueue(row)">\u6392\u961f\u8bbe\u7f6e</el-button>',
    '<el-button link class="op" @click="openQueue(row)">{{ t(\'cc.skill.ext.btnQueue\') }}</el-button>')
rep('<el-button link class="op danger" @click="onDelete(row)">\u5220\u9664</el-button>',
    '<el-button link class="op danger" @click="onDelete(row)">{{ t(\'cc.skill.ext.btnDelete\') }}</el-button>')

// ===== 8. Empty text =====
rep('<span class="empty-text">\u6682\u65e0\u6280\u80fd\u7ec4\u6570\u636e\uff0c\u70b9\u51fb\u53f3\u4e0a\u89d2\u300c\u65b0\u5efa\u6280\u80fd\u7ec4\u300d\u5f00\u59cb\u914d\u7f6e</span>',
    '<span class="empty-text">{{ t(\'cc.skill.ext.emptyText\') }}</span>')

// ===== 9. Form dialog title =====
rep(":title=\"formMode === 'edit' ? '\u7f16\u8f91\u6280\u80fd\u7ec4' : '\u65b0\u5efa\u6280\u80fd\u7ec4'\"",
    ":title=\"formMode === 'edit' ? t('cc.skill.ext.dlgEditTitle') : t('cc.skill.ext.dlgCreateTitle')\"")

// ===== 10. Form items =====
rep('<el-form-item label="\u6280\u80fd\u7ec4\u540d\u79f0" prop="name">',
    '<el-form-item :label="t(\'cc.skill.ext.labelName\')" prop="name">')
rep('placeholder="\u4f8b\u5982\uff1a\u5ba2\u670d\u4e00\u7ec4"',
    ':placeholder="t(\'cc.skill.ext.phName\')"')
rep('<el-form-item label="\u6280\u80fd\u7ec4\u7f16\u7801" prop="code">',
    '<el-form-item :label="t(\'cc.skill.ext.labelCode\')" prop="code">')
rep('placeholder="\u4f8b\u5982\uff1acs-01\uff08\u82f1\u6587/\u6570\u5b57/\u4e2d\u5212\u7ebf\uff09"',
    ':placeholder="t(\'cc.skill.ext.phCode\')"')
rep('<el-form-item label="\u63cf\u8ff0">',
    '<el-form-item :label="t(\'cc.skill.ext.labelDesc\')">')
rep('placeholder="\u4e00\u53e5\u8bdd\u8bf4\u660e\u8be5\u6280\u80fd\u7ec4\u7684\u670d\u52a1\u8303\u56f4\uff0c\u4fbf\u4e8e\u6210\u5458\u7406\u89e3"',
    ':placeholder="t(\'cc.skill.ext.phDesc\')"')
rep('<el-form-item label="\u5206\u914d\u7b56\u7565" prop="strategy" class="strategy-form-item">',
    '<el-form-item :label="t(\'cc.skill.ext.labelStrategy\')" prop="strategy" class="strategy-form-item">')
rep('<el-form-item label="\u57fa\u7840\u6743\u91cd">',
    '<el-form-item :label="t(\'cc.skill.ext.labelWeight\')">')
rep('<span class="form-hint">\u6743\u91cd\u8d8a\u5927\u88ab\u5206\u914d\u6982\u7387\u8d8a\u9ad8</span>',
    '<span class="form-hint">{{ t(\'cc.skill.ext.hintWeight\') }}</span>')
rep('<el-form-item label="\u4f18\u5148\u7ea7">',
    '<el-form-item :label="t(\'cc.skill.ext.labelPriority\')">')
rep('<span class="form-hint">\u6570\u503c\u8d8a\u5927\u4f18\u5148\u7ea7\u8d8a\u9ad8\uff081-10\uff09</span>',
    '<span class="form-hint">{{ t(\'cc.skill.ext.hintPriority\') }}</span>')

// ===== 11. Form footer cancel/save buttons =====
rep('<el-button class="btn-ghost" @click="formVisible = false">\u53d6\u6d88</el-button>',
    '<el-button class="btn-ghost" @click="formVisible = false">{{ t(\'cc.skill.ext.btnCancel\') }}</el-button>')
rep('<el-button class="btn-gold" :loading="saving" @click="submitForm">\u4fdd\u5b58</el-button>',
    '<el-button class="btn-gold" :loading="saving" @click="submitForm">{{ t(\'cc.skill.ext.btnSave\') }}</el-button>')

// ===== 12. Member dialog =====
rep(":title=\"'\u6210\u5458\u7ba1\u7406 \u00b7 ' + (currentRow?.name || '')\"",
    ":title=\"t('cc.skill.ext.memberDlgPrefix') + (currentRow?.name || '')\"")
rep('<div class="member-tip">\n        \u4ece\u5168\u90e8\u5750\u5e2d\u4e2d\u52fe\u9009\u52a0\u5165\u672c\u6280\u80fd\u7ec4\uff0c\u652f\u6301\u5de5\u53f7 / \u59d3\u540d\u7b5b\u9009\u3002\u5df2\u505c\u7528\u5750\u5e2d\u4e0d\u53ef\u52a0\u5165\u3002\n      </div>',
    '<div class="member-tip">\n        {{ t(\'cc.skill.ext.memberTip\') }}\n      </div>')
rep('filter-placeholder="\u641c\u7d22\u5de5\u53f7\u6216\u59d3\u540d"',
    ':filter-placeholder="t(\'cc.skill.ext.filterAgent\')"')
rep(":titles=\"['\u53ef\u9009\u5750\u5e2d', '\u5df2\u9009\u5750\u5e2d']\"",
    ":titles=\"[t('cc.skill.ext.transferLeft'), t('cc.skill.ext.transferRight')]\"")
rep(":button-texts=\"['\u79fb\u9664', '\u52a0\u5165']\"",
    ":button-texts=\"[t('cc.skill.ext.btnRemove'), t('cc.skill.ext.btnAdd')]\"")
rep('<el-button class="btn-ghost" @click="memberVisible = false">\u53d6\u6d88</el-button>',
    '<el-button class="btn-ghost" @click="memberVisible = false">{{ t(\'cc.skill.ext.btnCancel\') }}</el-button>')
rep('<el-button class="btn-gold" @click="saveMembers">\n          \u4fdd\u5b58\u6210\u5458\uff08{{ memberSelected.length }} \u4eba\uff09\n        </el-button>',
    '<el-button class="btn-gold" @click="saveMembers">\n          {{ t(\'cc.skill.ext.btnSaveMember\') }}（{{ memberSelected.length }} {{ t(\'cc.skill.ext.memberUnit\') }}）\n        </el-button>')

// ===== 13. Queue dialog =====
rep(":title=\"'\u6392\u961f\u89c4\u5219 \u00b7 ' + (currentRow?.name || '')\"",
    ":title=\"t('cc.skill.ext.queueDlgPrefix') + (currentRow?.name || '')\"")
rep('<el-form-item label="\u6700\u5927\u6392\u961f\u6570">',
    '<el-form-item :label="t(\'cc.skill.ext.labelMaxQueue\')">')
rep('<el-form-item label="\u6392\u961f\u8d85\u65f6(\u79d2)">',
    '<el-form-item :label="t(\'cc.skill.ext.labelTimeoutSec\')">')
rep('<el-form-item label="\u8d85\u65f6\u5904\u7406\u7b56\u7565">',
    '<el-form-item :label="t(\'cc.skill.ext.labelTimeoutAction\')">')
rep('<el-radio-button value="transfer">\u8f6c\u5176\u4ed6\u6280\u80fd\u7ec4</el-radio-button>',
    '<el-radio-button value="transfer">{{ t(\'cc.skill.ext.actTransfer\') }}</el-radio-button>')
rep('<el-radio-button value="hangup">\u63d0\u793a\u540e\u6302\u65ad</el-radio-button>',
    '<el-radio-button value="hangup">{{ t(\'cc.skill.ext.actHangup\') }}</el-radio-button>')
rep('<el-radio-button value="voicemail">\u8f6c\u8bed\u97f3\u7559\u8a00</el-radio-button>',
    '<el-radio-button value="voicemail">{{ t(\'cc.skill.ext.actVoicemail\') }}</el-radio-button>')
rep('<el-form-item label="\u76ee\u6807\u6280\u80fd\u7ec4" v-if="queueForm.timeoutAction === \'transfer\'">',
    '<el-form-item :label="t(\'cc.skill.ext.labelTransferTo\')" v-if="queueForm.timeoutAction === \'transfer\'">')
rep('placeholder="\u9009\u62e9\u8f6c\u63a5\u7684\u6280\u80fd\u7ec4"',
    ':placeholder="t(\'cc.skill.ext.phTransferTo\')"')
rep('<el-form-item label="\u6392\u961f\u97f3\u4e50">',
    '<el-form-item :label="t(\'cc.skill.ext.labelMusic\')">')
rep('<el-form-item label="\u6392\u961f\u516c\u544a\u8bed">',
    '<el-form-item :label="t(\'cc.skill.ext.labelAnnouncement\')">')
rep('placeholder="\u60a8\u524d\u9762\u8fd8\u6709 {n} \u4f4d\u5ba2\u6237\u5728\u6392\u961f\uff0c\u8bf7\u8010\u5fc3\u7b49\u5019\u2026"',
    ':placeholder="t(\'cc.skill.ext.phAnnouncement\')"')
rep('<el-form-item label="\u6ea2\u51fa\u7b56\u7565">',
    '<el-form-item :label="t(\'cc.skill.ext.labelOverflow\')">')
rep('<el-radio-button value="reject">\u76f4\u63a5\u62d2\u63a5</el-radio-button>',
    '<el-radio-button value="reject">{{ t(\'cc.skill.ext.ovReject\') }}</el-radio-button>')
rep('<el-radio-button value="voicemail">\u8f6c\u7559\u8a00</el-radio-button>',
    '<el-radio-button value="voicemail">{{ t(\'cc.skill.ext.ovVoicemail\') }}</el-radio-button>')
rep('<el-radio-button value="callback">\u56de\u547c\u767b\u8bb0</el-radio-button>',
    '<el-radio-button value="callback">{{ t(\'cc.skill.ext.ovCallback\') }}</el-radio-button>')
rep('<el-button class="btn-ghost" @click="queueVisible = false">\u53d6\u6d88</el-button>',
    '<el-button class="btn-ghost" @click="queueVisible = false">{{ t(\'cc.skill.ext.btnCancel\') }}</el-button>')
rep('<el-button class="btn-gold" @click="saveQueue">\u4fdd\u5b58\u89c4\u5219</el-button>',
    '<el-button class="btn-gold" @click="saveQueue">{{ t(\'cc.skill.ext.btnSaveQueue\') }}</el-button>')

// ===== 14. Script: stats computed - convert label/unit/trend to t() =====
rep(
  "    { key: 'total', label: '\u603b\u6280\u80fd\u7ec4\u6570', value: total, unit: '\u7ec4', icon: Connection, trend: '\u2191 \u6bd4\u4e0a\u6708 +2', spark: sparkLines[0] },\n    { key: 'active', label: '\u6d3b\u8dc3\u6280\u80fd\u7ec4', value: active, unit: '\u7ec4', icon: BellFilled, trend: '\u5728\u7ebf\u670d\u52a1\u4e2d', spark: sparkLines[1] },\n    { key: 'agents', label: '\u603b\u5750\u5e2d\u6570', value: agents, unit: '\u4eba', icon: Headset, trend: '\u8986\u76d6 4 \u4e2a\u90e8\u95e8', spark: sparkLines[2] },\n    { key: 'queues', label: '\u5f53\u524d\u603b\u6392\u961f', value: queues, unit: '\u901a', icon: User, trend: '\u5b9e\u65f6\u5237\u65b0', spark: sparkLines[3] }",
  "    { key: 'total', label: t('cc.skill.ext.stat.total'), value: total, unit: t('cc.skill.ext.stat.unitGroup'), icon: Connection, trend: t('cc.skill.ext.stat.trendTotal'), spark: sparkLines[0] },\n    { key: 'active', label: t('cc.skill.ext.stat.active'), value: active, unit: t('cc.skill.ext.stat.unitGroup'), icon: BellFilled, trend: t('cc.skill.ext.stat.trendActive'), spark: sparkLines[1] },\n    { key: 'agents', label: t('cc.skill.ext.stat.agents'), value: agents, unit: t('cc.skill.ext.stat.unitPerson'), icon: Headset, trend: t('cc.skill.ext.stat.trendAgents'), spark: sparkLines[2] },\n    { key: 'queues', label: t('cc.skill.ext.stat.queues'), value: queues, unit: t('cc.skill.ext.stat.unitCall'), icon: User, trend: t('cc.skill.ext.stat.trendQueues'), spark: sparkLines[3] }"
)

// ===== 15. strategyOptions: convert from static const to computed =====
rep(
  "const strategyOptions = [\n  { value: 'round_robin', label: '\u8f6e\u8be2', glyph: '\u27f3', desc: '\u6309\u987a\u5e8f\u4f9d\u6b21\u5206\u914d\uff0c\u6700\u6734\u7d20\u4e5f\u6700\u516c\u5e73' },\n  { value: 'longest_idle', label: '\u6700\u957f\u7a7a\u95f2', glyph: '\u25cc', desc: '\u4f18\u5148\u5206\u914d\u7ed9\u7a7a\u95f2\u65f6\u95f4\u6700\u4e45\u7684\u5750\u5e2d' },\n  { value: 'skill_first', label: '\u6280\u80fd\u4f18\u5148', glyph: '\u2605', desc: '\u6309\u6280\u80fd\u7b49\u7ea7\u5339\u914d\u6700\u9002\u5408\u7684\u5750\u5e2d' },\n  { value: 'random', label: '\u968f\u673a', glyph: '\u2726', desc: '\u5b8c\u5168\u968f\u673a\u62bd\u9009\uff0c\u5206\u5e03\u5747\u5300' },\n  { value: 'weighted_round_robin', label: '\u52a0\u6743\u8f6e\u8be2', glyph: '\u2696', desc: '\u6309\u6743\u91cd\u6bd4\u4f8b\u8fdb\u884c\u8f6e\u8be2\u5206\u914d' },\n  { value: 'least_calls', label: '\u6700\u5c11\u901a\u8bdd', glyph: '\u2193', desc: '\u4eca\u65e5\u901a\u8bdd\u91cf\u6700\u5c11\u8005\u4f18\u5148' },\n  { value: 'priority', label: '\u4f18\u5148\u7ea7', glyph: '\u2b06', desc: '\u6309\u5750\u5e2d\u9884\u8bbe\u4f18\u5148\u7ea7\u5206\u914d' },\n  { value: 'memory_optimal', label: '\u5185\u5b58\u6700\u4f18', glyph: '\u273a', desc: '\u7efc\u5408\u8bc4\u5206\u52a8\u6001\u9009\u4f18' }\n]",
  "const strategyOptions = computed(() => [\n  { value: 'round_robin', label: t('cc.skill.ext.strategyOpt.round_robin'), glyph: '\u27f3', desc: t('cc.skill.ext.strategyOpt.round_robin_desc') },\n  { value: 'longest_idle', label: t('cc.skill.ext.strategyOpt.longest_idle'), glyph: '\u25cc', desc: t('cc.skill.ext.strategyOpt.longest_idle_desc') },\n  { value: 'skill_first', label: t('cc.skill.ext.strategyOpt.skill_first'), glyph: '\u2605', desc: t('cc.skill.ext.strategyOpt.skill_first_desc') },\n  { value: 'random', label: t('cc.skill.ext.strategyOpt.random'), glyph: '\u2726', desc: t('cc.skill.ext.strategyOpt.random_desc') },\n  { value: 'weighted_round_robin', label: t('cc.skill.ext.strategyOpt.weighted_round_robin'), glyph: '\u2696', desc: t('cc.skill.ext.strategyOpt.weighted_round_robin_desc') },\n  { value: 'least_calls', label: t('cc.skill.ext.strategyOpt.least_calls'), glyph: '\u2193', desc: t('cc.skill.ext.strategyOpt.least_calls_desc') },\n  { value: 'priority', label: t('cc.skill.ext.strategyOpt.priority'), glyph: '\u2b06', desc: t('cc.skill.ext.strategyOpt.priority_desc') },\n  { value: 'memory_optimal', label: t('cc.skill.ext.strategyOpt.memory_optimal'), glyph: '\u273a', desc: t('cc.skill.ext.strategyOpt.memory_optimal_desc') }\n])"
)

// ===== 16. strategyLabel uses .value now =====
rep(
  "const strategyLabel = (s: string) => {\n  const key = strategyAlias[s] || s\n  return strategyOptions.find((o) => o.value === key)?.label || s\n}",
  "const strategyLabel = (s: string) => {\n  const key = strategyAlias[s] || s\n  return strategyOptions.value.find((o) => o.value === key)?.label || s\n}"
)

// Also v-for in template uses strategyOptions - now it needs to be a computed access. With computed, template auto-unwraps. So OK.

// ===== 17. rules validation messages =====
rep(
  "  name: [{ required: true, message: '\u8bf7\u8f93\u5165\u6280\u80fd\u7ec4\u540d\u79f0', trigger: 'blur' }],\n  code: [{ required: true, message: '\u8bf7\u8f93\u5165\u6280\u80fd\u7ec4\u7f16\u7801', trigger: 'blur' }],\n  strategy: [{ required: true, message: '\u8bf7\u9009\u62e9\u5206\u914d\u7b56\u7565', trigger: 'change' }]",
  "  name: [{ required: true, message: t('cc.skill.ext.msg.validName'), trigger: 'blur' }],\n  code: [{ required: true, message: t('cc.skill.ext.msg.validCode'), trigger: 'blur' }],\n  strategy: [{ required: true, message: t('cc.skill.ext.msg.validStrategy'), trigger: 'change' }]"
)

// ===== 18. ElMessage calls =====
rep("ElMessage.success('\u6280\u80fd\u7ec4\u5df2\u66f4\u65b0')", "ElMessage.success(t('cc.skill.ext.msg.updateSuccess'))")
rep("ElMessage.success('\u6280\u80fd\u7ec4\u5df2\u521b\u5efa')", "ElMessage.success(t('cc.skill.ext.msg.createSuccess'))")
rep("ElMessage.success(row.enabled ? '\u5df2\u542f\u7528' : '\u5df2\u505c\u7528')",
    "ElMessage.success(row.enabled ? t('cc.skill.ext.msg.enableSuccess') : t('cc.skill.ext.msg.disableSuccess'))")
rep("ElMessage.success('\u5df2\u5220\u9664')", "ElMessage.success(t('cc.skill.ext.msg.deleteSuccess'))")
rep("ElMessage.success('\u6392\u961f\u89c4\u5219\u5df2\u4fdd\u5b58')", "ElMessage.success(t('cc.skill.ext.msg.queueRuleSaved'))")

// ===== 19. ElMessageBox.confirm delete =====
rep(
  "  ElMessageBox.confirm(`\u786e\u5b9a\u5220\u9664\u6280\u80fd\u7ec4\u300c${row.name}\u300d\uff1f\u8be5\u64cd\u4f5c\u4e0d\u53ef\u6062\u590d\u3002`, '\u5371\u9669\u64cd\u4f5c', {\n    type: 'warning',\n    confirmButtonText: '\u5220\u9664',\n    cancelButtonText: '\u53d6\u6d88',\n    confirmButtonClass: 'el-button--danger'\n  })",
  "  ElMessageBox.confirm(t('cc.skill.message.deleteConfirm', { name: row.name }) + t('cc.skill.ext.msg.deleteConfirmText'), t('cc.skill.ext.msg.deleteTitle'), {\n    type: 'warning',\n    confirmButtonText: t('cc.skill.ext.btnDelete'),\n    cancelButtonText: t('cc.skill.ext.btnCancel'),\n    confirmButtonClass: 'el-button--danger'\n  })"
)

// ===== 20. saveMembers =====
rep(
  "  ElMessage.success(`\u5df2\u4fdd\u5b58 ${memberSelected.value.length} \u540d\u5750\u5e2d\u5230\u300c${currentRow.value.name}\u300d`)",
  "  ElMessage.success(`${t('cc.skill.ext.msg.saveMemberOk')} ${memberSelected.value.length} ${t('cc.skill.ext.msg.agentsTo')}\u300c${currentRow.value.name}\u300d`)"
)

// ===== 21. musicList: convert to computed =====
rep(
  "const musicList = [\n  { value: 'default', label: '\u9ed8\u8ba4\u8f7b\u97f3\u4e50', meta: '\u8212\u7f13 \u00b7 30s \u5faa\u73af' },\n  { value: 'canon', label: '\u53e4\u5178 \u00b7 \u5361\u519c', meta: 'Pachelbel' },\n  { value: 'jazz', label: '\u7235\u58eb \u00b7 Smooth', meta: 'Norah Jones \u98ce\u683c' },\n  { value: 'brand', label: '\u54c1\u724c\u5b9a\u5236\u97f3\u6548', meta: '\u6d59\u676d\u4f01\u670d\u4e13\u5c5e' }\n]",
  "const musicList = computed(() => [\n  { value: 'default', label: t('cc.skill.ext.music.default'), meta: t('cc.skill.ext.music.defaultMeta') },\n  { value: 'canon', label: t('cc.skill.ext.music.canon'), meta: t('cc.skill.ext.music.canonMeta') },\n  { value: 'jazz', label: t('cc.skill.ext.music.jazz'), meta: t('cc.skill.ext.music.jazzMeta') },\n  { value: 'brand', label: t('cc.skill.ext.music.brand'), meta: t('cc.skill.ext.music.brandMeta') }\n])"
)

// ===== 22. queueForm.announcement default literal (in const + openQueue) =====
rep(
  "  announcement: '\u60a8\u524d\u9762\u8fd8\u6709 {n} \u4f4d\u5ba2\u6237\u5728\u6392\u961f\uff0c\u8bf7\u8010\u5fc3\u7b49\u5019\u2026',",
  "  announcement: t('cc.skill.ext.phAnnouncement'),"
)
rep(
  "  queueForm.announcement = '\u60a8\u524d\u9762\u8fd8\u6709 {n} \u4f4d\u5ba2\u6237\u5728\u6392\u961f\uff0c\u8bf7\u8010\u5fc3\u7b49\u5019\u2026'",
  "  queueForm.announcement = t('cc.skill.ext.phAnnouncement')"
)

fs.writeFileSync(FILE, s, 'utf8')
console.log('=== skill.vue patched ===')
console.log('Final lines:', s.split('\n').length)
checks.forEach(c => console.log(c))

const styleStart = s.indexOf('<style')
const codeOnly = s.slice(0, styleStart)
const remaining = codeOnly.match(/[\u4e00-\u9fff]+/g) || []
const unique = [...new Set(remaining)]
console.log('\n=== Remaining Chinese chunks (' + unique.length + ') ===')
unique.forEach(z => {
  const i = codeOnly.indexOf(z)
  const ctx = codeOnly.slice(Math.max(0, i - 40), i + z.length + 40).replace(/\n/g, '\\n')
  console.log(JSON.stringify(z) + ' | ' + ctx)
})
