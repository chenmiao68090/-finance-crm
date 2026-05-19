// Convert IvrDesigner.vue to use i18n
const fs = require('fs')
const FILE = 'd:/zhehang-erp/zhehang-erp-ui/src/views/call-center/components/IvrDesigner.vue'

let s = fs.readFileSync(FILE, 'utf8')
// Normalize CRLF to LF for replacement
s = s.replace(/\r\n/g, '\n')

const checks = []
function rep(a, b) {
  if (s.indexOf(a) === -1) {
    checks.push('NOT FOUND: ' + a.slice(0, 70).replace(/\n/g, '\\n'))
    return
  }
  s = s.split(a).join(b)
}

// ===== 1. Add useI18n import =====
rep(
  "import { ref, reactive, computed, watch, onMounted, onBeforeUnmount, markRaw } from 'vue'",
  "import { ref, reactive, computed, watch, onMounted, onBeforeUnmount, markRaw } from 'vue'\nimport { useI18n } from 'vue-i18n'"
)

// ===== 2. Add const { t } after imports =====
rep(
  "import type { IvrFlow, IvrNode, IvrEdge } from '@/api/call-center'\n\nconst props",
  "import type { IvrFlow, IvrNode, IvrEdge } from '@/api/call-center'\n\nconst { t } = useI18n()\n\nconst props"
)

// ===== 3. Toolbar =====
rep(
  '<el-button :icon="ArrowLeft" plain @click="emit(\'back\')">返回列表</el-button>',
  '<el-button :icon="ArrowLeft" plain @click="emit(\'back\')">{{ t(\'cc.ivr.designer.extra.backToList\') }}</el-button>'
)
rep('placeholder="请输入流程名称"', ':placeholder="t(\'cc.ivr.designer.extra.namePlaceholder\')"')
rep(
  "{{ local.enabled ? '已发布' : '草稿' }} · v{{ local.version }}",
  "{{ local.enabled ? t('cc.ivr.designer.extra.publishedStatus') : t('cc.ivr.designer.extra.draftStatus') }} · v{{ local.version }}"
)
rep('content="自动布局" placement="bottom"', ':content="t(\'cc.ivr.designer.extra.tipAutoLayout\')" placement="bottom"')
rep('content="清空画布" placement="bottom"', ':content="t(\'cc.ivr.designer.extra.tipClearCanvas\')" placement="bottom"')
rep('content="JSON 预览" placement="bottom"', ':content="t(\'cc.ivr.designer.extra.tipJsonPreview\')" placement="bottom"')
rep(
  '<el-button type="primary" :icon="Check" @click="onSave">保存流程</el-button>',
  '<el-button type="primary" :icon="Check" @click="onSave">{{ t(\'cc.ivr.designer.extra.saveBtn\') }}</el-button>'
)

// ===== 4. Section titles =====
rep('<span>节点组件</span>', '<span>{{ t(\'cc.ivr.designer.extra.secNodeComponents\') }}</span>')
rep('<span>流程统计</span>', '<span>{{ t(\'cc.ivr.designer.extra.secFlowStats\') }}</span>')
rep('<span>属性配置</span>', '<span>{{ t(\'cc.ivr.designer.extra.secProperties\') }}</span>')

// ===== 5. Stats labels =====
rep('<div class="dz-stat-lab">节点</div>', '<div class="dz-stat-lab">{{ t(\'cc.ivr.designer.extra.statNodes\') }}</div>')
rep('<div class="dz-stat-lab">连线</div>', '<div class="dz-stat-lab">{{ t(\'cc.ivr.designer.extra.statEdges\') }}</div>')

// ===== 6. Palette items: change template to use paletteLabel/paletteDesc =====
rep(
  '<div class="dz-pi-name">{{ np.label }}</div>\n            <div class="dz-pi-desc">{{ np.desc }}</div>',
  '<div class="dz-pi-name">{{ paletteLabel(np.type) }}</div>\n            <div class="dz-pi-desc">{{ paletteDesc(np.type) }}</div>'
)

// ===== 7. Helper text =====
rep(
  '<div class="dz-helper">\n          <span><b>拖拽</b>左侧节点入画布</span>\n          <i class="dot">◆</i>\n          <span><b>点击端口</b>拖出连线</span>\n          <i class="dot">◆</i>\n          <span><b>空白拖动</b>平移画布</span>\n          <i class="dot">◆</i>\n          <span><b>Delete</b>删除选中</span>\n        </div>',
  '<div class="dz-helper">\n          <span><b>{{ t(\'cc.ivr.designer.extra.helperDrag\') }}</b>{{ t(\'cc.ivr.designer.extra.helperDragText\') }}</span>\n          <i class="dot">◆</i>\n          <span><b>{{ t(\'cc.ivr.designer.extra.helperPort\') }}</b>{{ t(\'cc.ivr.designer.extra.helperPortText\') }}</span>\n          <i class="dot">◆</i>\n          <span><b>{{ t(\'cc.ivr.designer.extra.helperBlank\') }}</b>{{ t(\'cc.ivr.designer.extra.helperBlankText\') }}</span>\n          <i class="dot">◆</i>\n          <span><b>{{ t(\'cc.ivr.designer.extra.helperDelete\') }}</b>{{ t(\'cc.ivr.designer.extra.helperDeleteText\') }}</span>\n        </div>'
)

// ===== 8. Empty state =====
rep(
  '<div class="dz-empty-text">\n            选中节点或连线<br />开始编辑属性\n          </div>\n          <div class="dz-empty-tip">\n            提示：从左侧拖拽组件即可创建新节点\n          </div>',
  '<div class="dz-empty-text">\n            {{ t(\'cc.ivr.designer.extra.emptyTitle\') }}<br />{{ t(\'cc.ivr.designer.extra.emptySubtitle\') }}\n          </div>\n          <div class="dz-empty-tip">\n            {{ t(\'cc.ivr.designer.extra.emptyTip\') }}\n          </div>'
)

// ===== 9. Property panel (form labels for all node types) =====
rep('<el-form-item label="节点名称">', '<el-form-item :label="t(\'cc.ivr.designer.extra.form.nodeName\')">')

// play
rep('<el-form-item label="音频文件">', '<el-form-item :label="t(\'cc.ivr.designer.extra.form.audioFile\')">')
rep('placeholder="welcome.wav"', ':placeholder="t(\'cc.ivr.designer.extra.form.audioPlaceholder\')"')
rep('<el-form-item label="备注文本">', '<el-form-item :label="t(\'cc.ivr.designer.extra.form.remarkText\')">')
rep('placeholder="对应播放语的文字描述"', ':placeholder="t(\'cc.ivr.designer.extra.form.remarkPlaceholder\')"')

// tts
rep('<el-form-item label="TTS 文本">', '<el-form-item :label="t(\'cc.ivr.designer.extra.form.ttsText\')">')
rep('placeholder="请输入合成文本"', ':placeholder="t(\'cc.ivr.designer.extra.form.ttsPlaceholder\')"')
rep('<el-form-item label="发音人">', '<el-form-item :label="t(\'cc.ivr.designer.extra.form.voice\')">')
rep('<el-option label="女声 · 标准" value="female-std" />', '<el-option :label="t(\'cc.ivr.designer.extra.form.voiceFemaleStd\')" value="female-std" />')
rep('<el-option label="男声 · 标准" value="male-std" />', '<el-option :label="t(\'cc.ivr.designer.extra.form.voiceMaleStd\')" value="male-std" />')
rep('<el-option label="女声 · 温柔" value="female-soft" />', '<el-option :label="t(\'cc.ivr.designer.extra.form.voiceFemaleSoft\')" value="female-soft" />')
rep('<el-option label="男声 · 沉稳" value="male-deep" />', '<el-option :label="t(\'cc.ivr.designer.extra.form.voiceMaleDeep\')" value="male-deep" />')

// menu
rep('<el-form-item label="菜单提示语">', '<el-form-item :label="t(\'cc.ivr.designer.extra.form.menuPrompt\')">')
rep('<el-form-item label="按键超时（秒）">', '<el-form-item :label="t(\'cc.ivr.designer.extra.form.keyTimeout\')">')
rep('<el-form-item label="按键映射">', '<el-form-item :label="t(\'cc.ivr.designer.extra.form.keyMapping\')">')
rep('placeholder="未映射"', ':placeholder="t(\'cc.ivr.designer.extra.form.keyUnmapped\')"')

// collect
rep('<el-form-item label="变量名">', '<el-form-item :label="t(\'cc.ivr.designer.extra.form.varName\')">')
rep('placeholder="如 customerLevel"', ':placeholder="t(\'cc.ivr.designer.extra.form.varNamePlaceholder\')"')
rep('<el-form-item label="变量值">', '<el-form-item :label="t(\'cc.ivr.designer.extra.form.varValue\')">')
rep('<el-form-item label="持久化">', '<el-form-item :label="t(\'cc.ivr.designer.extra.form.persist\')">')
rep('active-text="保存到 CDR"', ':active-text="t(\'cc.ivr.designer.extra.form.persistText\')"')

// transfer
rep('<el-form-item label="坐席工号">', '<el-form-item :label="t(\'cc.ivr.designer.extra.form.agentNo\')">')
rep('placeholder="如 1001"', ':placeholder="t(\'cc.ivr.designer.extra.form.agentNoPlaceholder\')"')
rep('<el-form-item label="无人接听超时（秒）">', '<el-form-item :label="t(\'cc.ivr.designer.extra.form.noAnswerTimeout\')">')
rep('<el-form-item label="超时策略">', '<el-form-item :label="t(\'cc.ivr.designer.extra.form.fallback\')">')
rep('<el-radio value="hangup">挂断</el-radio>', '<el-radio value="hangup">{{ t(\'cc.ivr.designer.extra.form.fallbackHangup\') }}</el-radio>')
rep('<el-radio value="queue">转排队</el-radio>', '<el-radio value="queue">{{ t(\'cc.ivr.designer.extra.form.fallbackQueue\') }}</el-radio>')
rep('<el-radio value="voicemail">留言</el-radio>', '<el-radio value="voicemail">{{ t(\'cc.ivr.designer.extra.form.fallbackVoicemail\') }}</el-radio>')

// queue
rep('<el-form-item label="技能组 ID">', '<el-form-item :label="t(\'cc.ivr.designer.extra.form.skillGroupId\')">')
rep('<el-form-item label="排队提示音">', '<el-form-item :label="t(\'cc.ivr.designer.extra.form.queueAudio\')">')
rep('placeholder="hold-music.wav"', ':placeholder="t(\'cc.ivr.designer.extra.form.queueAudioPlaceholder\')"')
rep('<el-form-item label="最大等待秒数">', '<el-form-item :label="t(\'cc.ivr.designer.extra.form.maxWaitSec\')">')
rep('<el-form-item label="分配策略">', '<el-form-item :label="t(\'cc.ivr.designer.extra.form.strategy\')">')
rep('<el-option label="最闲优先" value="least-busy" />', '<el-option :label="t(\'cc.ivr.designer.extra.form.stLeastBusy\')" value="least-busy" />')
rep('<el-option label="轮询" value="round-robin" />', '<el-option :label="t(\'cc.ivr.designer.extra.form.stRoundRobin\')" value="round-robin" />')
rep('<el-option label="技能优先" value="skill-based" />', '<el-option :label="t(\'cc.ivr.designer.extra.form.stSkillBased\')" value="skill-based" />')
rep('<el-option label="VIP 优先" value="priority" />', '<el-option :label="t(\'cc.ivr.designer.extra.form.stPriority\')" value="priority" />')

// condition
rep('<el-form-item label="判断变量">', '<el-form-item :label="t(\'cc.ivr.designer.extra.form.judgeVar\')">')
rep('placeholder="caller / level / hour"', ':placeholder="t(\'cc.ivr.designer.extra.form.judgeVarPlaceholder\')"')
rep('<el-form-item label="运算符">', '<el-form-item :label="t(\'cc.ivr.designer.extra.form.operator\')">')
rep('<el-option label="等于  ==" value="==" />', '<el-option :label="t(\'cc.ivr.designer.extra.form.opEq\')" value="==" />')
rep('<el-option label="不等于  !=" value="!=" />', '<el-option :label="t(\'cc.ivr.designer.extra.form.opNeq\')" value="!=" />')
rep('<el-option label="包含  contains" value="contains" />', '<el-option :label="t(\'cc.ivr.designer.extra.form.opContains\')" value="contains" />')
rep('<el-option label="大于  >" value=">" />', '<el-option :label="t(\'cc.ivr.designer.extra.form.opGt\')" value=">" />')
rep('<el-option label="小于  <" value="<" />', '<el-option :label="t(\'cc.ivr.designer.extra.form.opLt\')" value="<" />')
rep('<el-option label="区间  [a,b]" value="between" />', '<el-option :label="t(\'cc.ivr.designer.extra.form.opBetween\')" value="between" />')
rep('<el-form-item label="对比值">', '<el-form-item :label="t(\'cc.ivr.designer.extra.form.compareValue\')">')

// hangup
rep('<el-form-item label="结束语音">', '<el-form-item :label="t(\'cc.ivr.designer.extra.form.endVoice\')">')
rep('placeholder="bye.wav"', ':placeholder="t(\'cc.ivr.designer.extra.form.endVoicePlaceholder\')"')
rep('<el-form-item label="挂断原因">', '<el-form-item :label="t(\'cc.ivr.designer.extra.form.hangupReason\')">')
rep('<el-option label="正常挂断" value="NORMAL_CLEARING" />', '<el-option :label="t(\'cc.ivr.designer.extra.form.reasonNormal\')" value="NORMAL_CLEARING" />')
rep('<el-option label="忙音" value="USER_BUSY" />', '<el-option :label="t(\'cc.ivr.designer.extra.form.reasonBusy\')" value="USER_BUSY" />')
rep('<el-option label="拒接" value="CALL_REJECTED" />', '<el-option :label="t(\'cc.ivr.designer.extra.form.reasonReject\')" value="CALL_REJECTED" />')
rep('<el-option label="超时" value="NO_ANSWER" />', '<el-option :label="t(\'cc.ivr.designer.extra.form.reasonTimeout\')" value="NO_ANSWER" />')

// coordinate / delete buttons
rep('<el-form-item label="坐标">', '<el-form-item :label="t(\'cc.ivr.designer.extra.form.coordinate\')">')
rep(
  '              >\n                删除节点\n              </el-button>\n            </el-form-item>\n          </el-form>\n        </div>\n\n        <div v-else-if="selectedEdge"',
  '              >\n                {{ t(\'cc.ivr.designer.extra.form.deleteNode\') }}\n              </el-button>\n            </el-form-item>\n          </el-form>\n        </div>\n\n        <div v-else-if="selectedEdge"'
)

// edge form
rep('<div class="dz-prop-title">连线</div>', '<div class="dz-prop-title">{{ t(\'cc.ivr.designer.extra.edgeLabel\') }}</div>')
rep('<el-form-item label="连线标签">', '<el-form-item :label="t(\'cc.ivr.designer.extra.form.edgeLabelLabel\')">')
rep('placeholder="如：按 1 / 工作时间 / 满足条件"', ':placeholder="t(\'cc.ivr.designer.extra.form.edgeLabelPlaceholder\')"')
rep('<el-form-item label="路径">', '<el-form-item :label="t(\'cc.ivr.designer.extra.form.edgePath\')">')
rep(
  '              >\n                删除连线\n              </el-button>',
  '              >\n                {{ t(\'cc.ivr.designer.extra.form.deleteEdge\') }}\n              </el-button>'
)

// JSON dialog
rep(
  'title="流程定义 JSON"',
  ':title="t(\'cc.ivr.designer.extra.msg.jsonTitle\')"'
)

// ===== 10. Script: change palette to keep types/colors/icons static; replace label/desc with helper functions =====
// Replace palette literal label/desc strings with empty (kept for backwards compat) - and add helper functions
rep(
  "const palette = [\n  { type: 'start',     label: '\u5f00\u59cb\u8282\u70b9',   desc: '\u6d41\u7a0b\u5165\u53e3',       color: '#06D6A0', icon: markRaw(VideoPlay) },\n  { type: 'menu',      label: '\u83dc\u5355\u8282\u70b9',   desc: '\u6309\u952e\u9009\u62e9\u5206\u652f',   color: '#FFD166', icon: markRaw(Operation) },\n  { type: 'play',      label: '\u64ad\u653e\u8bed\u97f3',   desc: '\u64ad\u653e\u97f3\u9891\u6587\u4ef6',   color: '#C5A55A', icon: markRaw(Microphone) },\n  { type: 'tts',       label: '\u8bed\u97f3\u5408\u6210',   desc: 'TTS \u6587\u672c\u6717\u8bfb',   color: '#5B8DEF', icon: markRaw(ChatLineRound) },\n  { type: 'transfer',  label: '\u8f6c\u5750\u5e2d',     desc: '\u6307\u5b9a\u5de5\u53f7\u63a5\u542c',   color: '#B76E79', icon: markRaw(User) },\n  { type: 'queue',     label: '\u8f6c\u6280\u80fd\u7ec4',   desc: '\u6392\u961f\u5206\u914d\u5750\u5e2d',   color: '#8B7BFF', icon: markRaw(UserFilled) },\n  { type: 'condition', label: '\u6761\u4ef6\u5224\u65ad',   desc: '\u53d8\u91cf\u5206\u652f\u8df3\u8f6c',   color: '#FF9F43', icon: markRaw(SetUp) },\n  { type: 'collect',   label: '\u53d8\u91cf\u8d4b\u503c',   desc: '\u8bbe\u7f6e\u6d41\u7a0b\u53d8\u91cf',   color: '#D4AF37', icon: markRaw(Edit) },\n  { type: 'hangup',    label: '\u6302\u65ad\u8282\u70b9',   desc: '\u7ed3\u675f\u901a\u8bdd',       color: '#EF4444', icon: markRaw(CircleClose) }\n]",
  "const palette = [\n  { type: 'start',     color: '#06D6A0', icon: markRaw(VideoPlay) },\n  { type: 'menu',      color: '#FFD166', icon: markRaw(Operation) },\n  { type: 'play',      color: '#C5A55A', icon: markRaw(Microphone) },\n  { type: 'tts',       color: '#5B8DEF', icon: markRaw(ChatLineRound) },\n  { type: 'transfer',  color: '#B76E79', icon: markRaw(User) },\n  { type: 'queue',     color: '#8B7BFF', icon: markRaw(UserFilled) },\n  { type: 'condition', color: '#FF9F43', icon: markRaw(SetUp) },\n  { type: 'collect',   color: '#D4AF37', icon: markRaw(Edit) },\n  { type: 'hangup',    color: '#EF4444', icon: markRaw(CircleClose) }\n]\nconst paletteLabel = (type: string) => t(`cc.ivr.designer.extra.palette.${type}Label`)\nconst paletteDesc = (type: string) => t(`cc.ivr.designer.extra.palette.${type}Desc`)"
)

// ===== 11. typeLabelMap -> typeLabel function uses i18n =====
rep(
  "const typeLabelMap: Record<string, string> = {\n  start: '\u5f00\u59cb',\n  play: '\u64ad\u653e\u8bed\u97f3',\n  menu: '\u6309\u952e\u83dc\u5355',\n  collect: '\u53d8\u91cf\u8d4b\u503c',\n  transfer: '\u8f6c\u5750\u5e2d',\n  queue: '\u8f6c\u6280\u80fd\u7ec4',\n  condition: '\u6761\u4ef6\u5224\u65ad',\n  hangup: '\u6302\u65ad',\n  tts: '\u8bed\u97f3\u5408\u6210'\n}\nconst typeLabel = (t: string) => typeLabelMap[t] || t",
  "const typeLabel = (type: string) => t(`cc.ivr.designer.extra.typeLabel.${type}`)"
)

// ===== 12. metaText switch cases =====
rep(
  "    case 'play': return c.audio || c.text || '\u672a\u914d\u7f6e\u97f3\u9891'",
  "    case 'play': return c.audio || c.text || t('cc.ivr.designer.extra.msg.metaUnsetAudio')"
)
rep(
  "    case 'tts': return c.text ? c.text.slice(0, 14) : '\u672a\u914d\u7f6e\u6587\u672c'",
  "    case 'tts': return c.text ? c.text.slice(0, 14) : t('cc.ivr.designer.extra.msg.metaUnsetText')"
)
rep(
  "    case 'menu': return `${Object.keys(c.options || {}).length} \u4e2a\u5206\u652f`",
  "    case 'menu': return `${Object.keys(c.options || {}).length}${t('cc.ivr.designer.extra.msg.metaBranchSuffix')}`"
)
rep(
  "    case 'collect': return c.variable ? `${c.variable} = ${c.value ?? ''}` : '\u672a\u914d\u7f6e\u53d8\u91cf'",
  "    case 'collect': return c.variable ? `${c.variable} = ${c.value ?? ''}` : t('cc.ivr.designer.extra.msg.metaUnsetVar')"
)
rep(
  "    case 'transfer': return c.agentNo ? `\u5de5\u53f7 ${c.agentNo}` : '\u672a\u6307\u5b9a\u5750\u5e2d'",
  "    case 'transfer': return c.agentNo ? `${t('cc.ivr.designer.extra.msg.metaAgentPrefix')}${c.agentNo}` : t('cc.ivr.designer.extra.msg.metaUnsetAgent')"
)
rep(
  "    case 'queue': return c.skillGroupId ? `\u6280\u80fd\u7ec4 ${c.skillGroupId}` : '\u672a\u6307\u5b9a\u6280\u80fd\u7ec4'",
  "    case 'queue': return c.skillGroupId ? `${t('cc.ivr.designer.extra.msg.metaSkillPrefix')}${c.skillGroupId}` : t('cc.ivr.designer.extra.msg.metaUnsetSkill')"
)

// ===== 13. ElMessage / ElMessageBox =====
rep("ElMessage.warning('\u5df2\u5b58\u5728\u5f00\u59cb\u8282\u70b9')", "ElMessage.warning(t('cc.ivr.designer.extra.msg.warnHasStart'))")
rep("ElMessage.warning('\u5df2\u5b58\u5728\u5f00\u59cb\u8282\u70b9')", "ElMessage.warning(t('cc.ivr.designer.extra.msg.warnHasStart'))") // both occurrences (split would have removed all already)
rep("ElMessage.warning('\u4e0d\u80fd\u8fde\u63a5\u5230\u81ea\u8eab')", "ElMessage.warning(t('cc.ivr.designer.extra.msg.warnNoSelfLoop'))")
rep("ElMessage.warning('\u5df2\u5b58\u5728\u8be5\u8fde\u7ebf')", "ElMessage.warning(t('cc.ivr.designer.extra.msg.warnEdgeExists'))")
rep("ElMessage.warning('\u5f00\u59cb\u8282\u70b9\u4e0d\u53ef\u5220\u9664')", "ElMessage.warning(t('cc.ivr.designer.extra.msg.warnStartUndeletable'))")
rep("ElMessage.warning('\u753b\u5e03\u65e0\u5f00\u59cb\u8282\u70b9\uff0c\u65e0\u6cd5\u5e03\u5c40')", "ElMessage.warning(t('cc.ivr.designer.extra.msg.warnNoStart'))")
rep("ElMessage.success('\u5df2\u6309\u5c42\u7ea7\u81ea\u52a8\u5e03\u5c40')", "ElMessage.success(t('cc.ivr.designer.extra.msg.successAutoLayout'))")
rep("ElMessage.warning('\u8bf7\u586b\u5199\u6d41\u7a0b\u540d\u79f0')", "ElMessage.warning(t('cc.ivr.designer.extra.msg.warnFlowName'))")
rep("ElMessage.warning('\u6d41\u7a0b\u5fc5\u987b\u5305\u542b\u5f00\u59cb\u8282\u70b9')", "ElMessage.warning(t('cc.ivr.designer.extra.msg.warnNoStartSave'))")

// ElMessageBox.confirm clearCanvas
rep(
  "    '\u786e\u8ba4\u6e05\u7a7a\u5f53\u524d\u753b\u5e03\uff1f\u6b64\u64cd\u4f5c\u4e0d\u53ef\u64a4\u9500',\n    '\u63d0\u793a',\n    { type: 'warning', confirmButtonText: '\u786e\u8ba4\u6e05\u7a7a', cancelButtonText: '\u53d6\u6d88' }",
  "    t('cc.ivr.designer.extra.msg.confirmClearText'),\n    t('cc.ivr.designer.extra.msg.confirmClearTitle'),\n    { type: 'warning', confirmButtonText: t('cc.ivr.designer.extra.msg.confirmClearOk'), cancelButtonText: t('common.cancel') }"
)

// applyDefault menu prompt
rep(
  "      node.config = { prompt: '\u8bf7\u6309\u952e\u9009\u62e9\u670d\u52a1', timeout: 5, options: {} }",
  "      node.config = { prompt: t('cc.ivr.designer.extra.msg.menuPromptDefault'), timeout: 5, options: {} }"
)

// onCanvasDrop also has another '已存在开始节点' - should be handled by split() but let me check by re-running.

fs.writeFileSync(FILE, s, 'utf8')
console.log('=== IvrDesigner.vue patched ===')
console.log('Final lines:', s.split('\n').length)
checks.forEach(c => console.log(c))

// Verify remaining Chinese
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
