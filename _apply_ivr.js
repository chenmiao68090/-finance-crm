// Convert ivr.vue
const fs = require('fs')
const FILE = 'd:/zhehang-erp/zhehang-erp-ui/src/views/call-center/ivr.vue'

let s = fs.readFileSync(FILE, 'utf8')
// Normalize CRLF to LF for replacement; will keep LF on write
s = s.replace(/\r\n/g, '\n')

// 1. Add useI18n import after 'import { ref, computed, ...' line
s = s.replace(
  "import { ref, computed, onMounted, markRaw } from 'vue'",
  "import { ref, computed, onMounted, markRaw } from 'vue'\nimport { useI18n } from 'vue-i18n'"
)

// 2. Add `const { t } = useI18n()` after the api import block
s = s.replace(
  "} from '@/api/call-center'\n\ntype Mode",
  "} from '@/api/call-center'\n\nconst { t } = useI18n()\n\ntype Mode"
)

// 3. Template replacements
const tpl = [
  // Hero eyebrow
  ['CALL CENTER · IVR ENGINE / 浙杭企服', "{{ t('cc.ivr.list.heroEyebrow') }}"],
  // Hero title (split) - using simpler match
  ['交互语音流程', "{{ t('cc.ivr.list.heroTitleMain') }}"],
  ['<em>设计中枢</em>', "<em>{{ t('cc.ivr.list.heroTitleEm') }}</em>"],
  // Hero sub
  ['可视化编排呼入路由 ／ 复用预置模板 ／ 协同上线发布', "{{ t('cc.ivr.list.heroSub') }}"],
  // Stats labels
  ["                <div class=\"l\">流程总数</div>", "                <div class=\"l\">{{ t('cc.ivr.stats.totalFlows') }}</div>"],
  ["                <div class=\"l\">在线运行</div>", "                <div class=\"l\">{{ t('cc.ivr.stats.onlineFlows') }}</div>"],
  ["                <div class=\"l\">节点累计</div>", "                <div class=\"l\">{{ t('cc.ivr.stats.totalNodes') }}</div>"],
  // Toolbar
  ['placeholder="按流程名称搜索"', ':placeholder="t(\'cc.ivr.filter.searchPlaceholder\')"'],
  ['placeholder="状态筛选"', ':placeholder="t(\'cc.ivr.filter.statusPlaceholder\')"'],
  ['<el-option label="全部状态" value="" />', '<el-option :label="t(\'cc.ivr.filter.statusAll\')" value="" />'],
  ['<el-option label="已发布" value="enabled" />', '<el-option :label="t(\'cc.ivr.status.published\')" value="enabled" />'],
  ['<el-option label="草稿" value="disabled" />', '<el-option :label="t(\'cc.ivr.status.draft\')" value="disabled" />'],
  ['<el-button :icon="Refresh" plain @click="loadFlows">刷新</el-button>',
   '<el-button :icon="Refresh" plain @click="loadFlows">{{ t(\'cc.ivr.actionExt.refresh\') }}</el-button>'],
  // Template dropdown
  ['              从模板创建\n              <el-icon class="el-icon--right">',
   '              {{ t(\'cc.ivr.actionExt.createFromTemplate\') }}\n              <el-icon class="el-icon--right">'],
  ['          <el-button type="primary" :icon="Plus" @click="createBlank">\n            新建空白流程\n          </el-button>',
   '          <el-button type="primary" :icon="Plus" @click="createBlank">\n            {{ t(\'cc.ivr.actionExt.createBlank\') }}\n          </el-button>'],
  // Table columns
  ['<el-table-column label="流程名称" min-width="280">', '<el-table-column :label="t(\'cc.ivr.column.name\')" min-width="280">'],
  ['<el-table-column label="状态" width="110" align="center">', '<el-table-column :label="t(\'cc.ivr.column.status\')" width="110" align="center">'],
  ['<el-table-column label="节点 / 连线" width="140" align="center">', '<el-table-column :label="t(\'cc.ivr.list.nodesEdges\')" width="140" align="center">'],
  ['<el-table-column label="版本" width="80" align="center">', '<el-table-column :label="t(\'cc.ivr.column.version\')" width="80" align="center">'],
  ['            label="更新时间"', '            :label="t(\'cc.ivr.list.updatedTime\')"'],
  ['            label="操作"', '            :label="t(\'cc.ivr.column.operation\')"'],
  // Bind numbers tag
  ['                绑号 {{ row.bindNumbers.length }}', '                {{ t(\'cc.ivr.list.bindNumbers\') }} {{ row.bindNumbers.length }}'],
  // No description
  ["                {{ row.description || '— 暂无描述 —' }}", "                {{ row.description || t('cc.ivr.list.noDescription') }}"],
  // Status tag
  ["                {{ row.enabled ? '已发布' : '草稿' }}", "                {{ row.enabled ? t('cc.ivr.status.published') : t('cc.ivr.status.draft') }}"],
  // Action buttons
  ['              >编辑</el-button>', "              >{{ t('cc.ivr.action.design') }}</el-button>"],
  ['              >复制</el-button>', "              >{{ t('cc.ivr.action.copy') }}</el-button>"],
  ["                {{ row.enabled ? '停用' : '发布' }}", "                {{ row.enabled ? t('cc.ivr.action.unpublish') : t('cc.ivr.action.publish') }}"],
  ['              >删除</el-button>', "              >{{ t('common.delete') }}</el-button>"],
  // Empty
  ['<div class="et">尚未创建任何流程，从右上角开始</div>', "<div class=\"et\">{{ t('cc.ivr.list.emptyTip') }}</div>"]
]

for (const [a, b] of tpl) {
  if (s.indexOf(a) === -1) {
    console.log('NOT FOUND:', a.slice(0, 60))
  }
  s = s.split(a).join(b)
}

// 4. JS replacements
const js = [
  // createBlank
  ["    name: '未命名流程',", "    name: t('cc.ivr.list.untitled'),"],
  ["      { id: 'n1', type: 'start', name: '开始', x: 120, y: 200, config: {} }",
   "      { id: 'n1', type: 'start', name: t('cc.ivr.list.startNodeName'), x: 120, y: 200, config: {} }"],
  // createFromTemplate message
  ["  ElMessage.success(`已加载模板：${tpl.name}`)", "  ElMessage.success(t('cc.ivr.list.templateLoadedPrefix') + tpl.name)"],
  // onDesignerSave
  ["    ElMessage.success('流程已保存')", "    ElMessage.success(t('cc.ivr.message.saveSuccess'))"],
  ["    ElMessage.error('保存失败')", "    ElMessage.error(t('cc.ivr.message.saveFailed'))"],
  // copyFlow
  ["      name: row.name + '（副本）',", "      name: row.name + t('cc.ivr.list.copySuffix'),"],
  ["    ElMessage.success('已复制流程')", "    ElMessage.success(t('cc.ivr.message.copySuccess'))"],
  ["    ElMessage.error('复制失败')", "    ElMessage.error(t('cc.ivr.list.copyFailed'))"],
  // toggleEnable
  ["  ElMessage.success(row.enabled ? '已停用' : '已发布上线')",
   "  ElMessage.success(row.enabled ? t('cc.ivr.message.unpublishSuccess') : t('cc.ivr.list.publishedOnline'))"],
  // removeFlow
  ["    `确认删除流程「${row.name}」？此操作不可撤销`,\n    '删除确认',\n    { type: 'warning', confirmButtonText: '确认删除', cancelButtonText: '取消' }",
   "    t('cc.ivr.message.deleteConfirm', { name: row.name }),\n    t('cc.ivr.list.deleteTitle'),\n    { type: 'warning', confirmButtonText: t('cc.ivr.list.confirmDeleteBtn'), cancelButtonText: t('common.cancel') }"],
  ["      ElMessage.success('已删除')", "      ElMessage.success(t('cc.ivr.message.deleteSuccess'))"],
  // Template list - presale
  ["    name: '售前咨询',\n    desc: '产品咨询 / 价格优惠 / 转人工三路分流',",
   "    name: t('cc.ivr.tplFlow.presaleName'),\n    desc: t('cc.ivr.tplFlow.presaleDesc'),"],
  ["      name: '售前咨询流程',\n      desc: '产品咨询 / 价格优惠 / 转人工三路分流',",
   "      name: t('cc.ivr.tplFlow.presaleFlowName'),\n      desc: t('cc.ivr.tplFlow.presaleDesc'),"],
  // presale node names
  ["{ id: 'n1', type: 'start', name: '开始', x: 80, y: 240, config: {} },\n        { id: 'n2', type: 'play', name: '欢迎语', x: 240, y: 240, config: { audio: 'welcome-sales.wav', text: '您好，欢迎致电浙杭企服售前咨询热线' } },\n        { id: 'n3', type: 'menu', name: '主菜单', x: 460, y: 240, config: { prompt: '产品咨询请按1，价格优惠请按2，转人工请按0', timeout: 5, options: { '1': 'n4', '2': 'n5', '0': 'n6' } } },\n        { id: 'n4', type: 'queue', name: '产品咨询组', x: 700, y: 80, config: { skillGroupId: 1, queueAudio: 'hold-music.wav', timeout: 60, strategy: 'least-busy' } },\n        { id: 'n5', type: 'transfer', name: '价格顾问', x: 700, y: 240, config: { agentNo: '1003', timeout: 30, fallback: 'queue' } },\n        { id: 'n6', type: 'transfer', name: '人工服务', x: 700, y: 400, config: { agentNo: '1001', timeout: 30, fallback: 'queue' } },\n        { id: 'n7', type: 'hangup', name: '结束', x: 940, y: 240, config: { byeAudio: 'bye.wav', cause: 'NORMAL_CLEARING' } }",
   "{ id: 'n1', type: 'start', name: t('cc.ivr.list.startNodeName'), x: 80, y: 240, config: {} },\n        { id: 'n2', type: 'play', name: t('cc.ivr.tplFlow.presaleNodeWelcome'), x: 240, y: 240, config: { audio: 'welcome-sales.wav', text: t('cc.ivr.tplFlow.presaleWelcome') } },\n        { id: 'n3', type: 'menu', name: t('cc.ivr.tplFlow.presaleNodeMain'), x: 460, y: 240, config: { prompt: t('cc.ivr.tplFlow.presaleMenu'), timeout: 5, options: { '1': 'n4', '2': 'n5', '0': 'n6' } } },\n        { id: 'n4', type: 'queue', name: t('cc.ivr.tplFlow.presaleNodeProduct'), x: 700, y: 80, config: { skillGroupId: 1, queueAudio: 'hold-music.wav', timeout: 60, strategy: 'least-busy' } },\n        { id: 'n5', type: 'transfer', name: t('cc.ivr.tplFlow.presaleNodePrice'), x: 700, y: 240, config: { agentNo: '1003', timeout: 30, fallback: 'queue' } },\n        { id: 'n6', type: 'transfer', name: t('cc.ivr.tplFlow.presaleNodeManual'), x: 700, y: 400, config: { agentNo: '1001', timeout: 30, fallback: 'queue' } },\n        { id: 'n7', type: 'hangup', name: t('cc.ivr.tplFlow.presaleNodeEnd'), x: 940, y: 240, config: { byeAudio: 'bye.wav', cause: 'NORMAL_CLEARING' } }"],
  // presale edge labels
  ["{ id: 'e3', source: 'n3', target: 'n4', label: '按1' },\n        { id: 'e4', source: 'n3', target: 'n5', label: '按2' },\n        { id: 'e5', source: 'n3', target: 'n6', label: '按0' },",
   "{ id: 'e3', source: 'n3', target: 'n4', label: t('cc.ivr.tplFlow.edgeKey1') },\n        { id: 'e4', source: 'n3', target: 'n5', label: t('cc.ivr.tplFlow.edgeKey2') },\n        { id: 'e5', source: 'n3', target: 'n6', label: t('cc.ivr.tplFlow.edgeKey0') },"],
  // aftersale name/desc
  ["    name: '售后服务',\n    desc: '投诉建议 / 维修服务 / 退换货受理',",
   "    name: t('cc.ivr.tplFlow.aftersaleName'),\n    desc: t('cc.ivr.tplFlow.aftersaleDesc'),"],
  ["      name: '售后服务流程',\n      desc: '投诉 / 维修 / 退换货受理',",
   "      name: t('cc.ivr.tplFlow.aftersaleFlowName'),\n      desc: t('cc.ivr.tplFlow.aftersaleFlowDesc'),"],
  // aftersale nodes
  ["{ id: 'n1', type: 'start', name: '开始', x: 80, y: 240, config: {} },\n        { id: 'n2', type: 'play', name: '欢迎语', x: 240, y: 240, config: { audio: 'as-welcome.wav', text: '欢迎致电售后服务中心' } },\n        { id: 'n3', type: 'collect', name: '客户级别', x: 420, y: 240, config: { variable: 'customerLevel', value: 'normal', persist: true } },\n        { id: 'n4', type: 'menu', name: '售后菜单', x: 600, y: 240, config: { prompt: '投诉建议按1，维修服务按2，退换货按3，转人工按0', timeout: 6, options: { '1': 'n5', '2': 'n6', '3': 'n7', '0': 'n8' } } },\n        { id: 'n5', type: 'queue', name: '投诉处理', x: 820, y: 60, config: { skillGroupId: 2, queueAudio: 'hold-music.wav', timeout: 90, strategy: 'skill-based' } },\n        { id: 'n6', type: 'queue', name: '维修分配', x: 820, y: 200, config: { skillGroupId: 2, queueAudio: 'hold-music.wav', timeout: 90, strategy: 'skill-based' } },\n        { id: 'n7', type: 'transfer', name: '退换货', x: 820, y: 340, config: { agentNo: '1004', timeout: 45, fallback: 'queue' } },\n        { id: 'n8', type: 'queue', name: '通用客服', x: 820, y: 480, config: { skillGroupId: 1, queueAudio: 'hold-music.wav', timeout: 60, strategy: 'least-busy' } },\n        { id: 'n9', type: 'hangup', name: '结束', x: 1060, y: 240, config: { byeAudio: 'bye.wav', cause: 'NORMAL_CLEARING' } }",
   "{ id: 'n1', type: 'start', name: t('cc.ivr.list.startNodeName'), x: 80, y: 240, config: {} },\n        { id: 'n2', type: 'play', name: t('cc.ivr.tplFlow.aftersaleNodeWelcome'), x: 240, y: 240, config: { audio: 'as-welcome.wav', text: t('cc.ivr.tplFlow.aftersaleWelcome') } },\n        { id: 'n3', type: 'collect', name: t('cc.ivr.tplFlow.aftersaleNodeLevel'), x: 420, y: 240, config: { variable: 'customerLevel', value: 'normal', persist: true } },\n        { id: 'n4', type: 'menu', name: t('cc.ivr.tplFlow.aftersaleNodeMenu'), x: 600, y: 240, config: { prompt: t('cc.ivr.tplFlow.aftersaleMenu'), timeout: 6, options: { '1': 'n5', '2': 'n6', '3': 'n7', '0': 'n8' } } },\n        { id: 'n5', type: 'queue', name: t('cc.ivr.tplFlow.aftersaleNodeComplaint'), x: 820, y: 60, config: { skillGroupId: 2, queueAudio: 'hold-music.wav', timeout: 90, strategy: 'skill-based' } },\n        { id: 'n6', type: 'queue', name: t('cc.ivr.tplFlow.aftersaleNodeRepair'), x: 820, y: 200, config: { skillGroupId: 2, queueAudio: 'hold-music.wav', timeout: 90, strategy: 'skill-based' } },\n        { id: 'n7', type: 'transfer', name: t('cc.ivr.tplFlow.aftersaleNodeReturn'), x: 820, y: 340, config: { agentNo: '1004', timeout: 45, fallback: 'queue' } },\n        { id: 'n8', type: 'queue', name: t('cc.ivr.tplFlow.aftersaleNodeGeneral'), x: 820, y: 480, config: { skillGroupId: 1, queueAudio: 'hold-music.wav', timeout: 60, strategy: 'least-busy' } },\n        { id: 'n9', type: 'hangup', name: t('cc.ivr.tplFlow.presaleNodeEnd'), x: 1060, y: 240, config: { byeAudio: 'bye.wav', cause: 'NORMAL_CLEARING' } }"],
  // aftersale edges
  ["{ id: 'e4', source: 'n4', target: 'n5', label: '按1' },\n        { id: 'e5', source: 'n4', target: 'n6', label: '按2' },\n        { id: 'e6', source: 'n4', target: 'n7', label: '按3' },\n        { id: 'e7', source: 'n4', target: 'n8', label: '按0' },",
   "{ id: 'e4', source: 'n4', target: 'n5', label: t('cc.ivr.tplFlow.edgeKey1') },\n        { id: 'e5', source: 'n4', target: 'n6', label: t('cc.ivr.tplFlow.edgeKey2') },\n        { id: 'e6', source: 'n4', target: 'n7', label: t('cc.ivr.tplFlow.edgeKey3') },\n        { id: 'e7', source: 'n4', target: 'n8', label: t('cc.ivr.tplFlow.edgeKey0') },"],
  // satisfaction
  ["    name: '满意度调查',\n    desc: '1-5 分评分采集 / 文字备注 / 致谢挂机',",
   "    name: t('cc.ivr.tplFlow.satisfactionName'),\n    desc: t('cc.ivr.tplFlow.satisfactionDesc'),"],
  ["      name: '满意度回访流程',\n      desc: '1-5 分评分采集 / 致谢挂机',",
   "      name: t('cc.ivr.tplFlow.satisfactionFlowName'),\n      desc: t('cc.ivr.tplFlow.satisfactionFlowDesc'),"],
  // satisfaction nodes
  ["{ id: 'n1', type: 'start', name: '开始', x: 80, y: 220, config: {} },\n        { id: 'n2', type: 'tts', name: '调研引导', x: 240, y: 220, config: { text: '感谢接听本次满意度回访，请在听到提示后为本次服务打1到5分', voice: 'female-soft' } },\n        { id: 'n3', type: 'menu', name: '评分采集', x: 460, y: 220, config: { prompt: '请按数字1至5为本次服务评分', timeout: 8, options: { '1': 'n4', '2': 'n4', '3': 'n4', '4': 'n5', '5': 'n5' } } },\n        { id: 'n4', type: 'collect', name: '低分原因', x: 680, y: 80, config: { variable: 'rating', value: 'low', persist: true } },\n        { id: 'n5', type: 'collect', name: '满意标记', x: 680, y: 360, config: { variable: 'rating', value: 'high', persist: true } },\n        { id: 'n6', type: 'transfer', name: '低分回访', x: 880, y: 80, config: { agentNo: '1004', timeout: 60, fallback: 'voicemail' } },\n        { id: 'n7', type: 'play', name: '致谢语', x: 880, y: 360, config: { audio: 'thanks.wav', text: '感谢您的支持，再见' } },\n        { id: 'n8', type: 'hangup', name: '结束', x: 1080, y: 220, config: { byeAudio: 'bye.wav', cause: 'NORMAL_CLEARING' } }",
   "{ id: 'n1', type: 'start', name: t('cc.ivr.list.startNodeName'), x: 80, y: 220, config: {} },\n        { id: 'n2', type: 'tts', name: t('cc.ivr.tplFlow.satisfactionNodeGuide'), x: 240, y: 220, config: { text: t('cc.ivr.tplFlow.satisfactionTtsText'), voice: 'female-soft' } },\n        { id: 'n3', type: 'menu', name: t('cc.ivr.tplFlow.satisfactionNodeRating'), x: 460, y: 220, config: { prompt: t('cc.ivr.tplFlow.satisfactionMenu'), timeout: 8, options: { '1': 'n4', '2': 'n4', '3': 'n4', '4': 'n5', '5': 'n5' } } },\n        { id: 'n4', type: 'collect', name: t('cc.ivr.tplFlow.satisfactionNodeLow'), x: 680, y: 80, config: { variable: 'rating', value: 'low', persist: true } },\n        { id: 'n5', type: 'collect', name: t('cc.ivr.tplFlow.satisfactionNodeHigh'), x: 680, y: 360, config: { variable: 'rating', value: 'high', persist: true } },\n        { id: 'n6', type: 'transfer', name: t('cc.ivr.tplFlow.satisfactionNodeCallback'), x: 880, y: 80, config: { agentNo: '1004', timeout: 60, fallback: 'voicemail' } },\n        { id: 'n7', type: 'play', name: t('cc.ivr.tplFlow.satisfactionNodeThanks'), x: 880, y: 360, config: { audio: 'thanks.wav', text: t('cc.ivr.tplFlow.satisfactionThanksText') } },\n        { id: 'n8', type: 'hangup', name: t('cc.ivr.tplFlow.presaleNodeEnd'), x: 1080, y: 220, config: { byeAudio: 'bye.wav', cause: 'NORMAL_CLEARING' } }"],
  // satisfaction edges
  ["{ id: 'e3', source: 'n3', target: 'n4', label: '1-3 分' },\n        { id: 'e4', source: 'n3', target: 'n5', label: '4-5 分' },",
   "{ id: 'e3', source: 'n3', target: 'n4', label: t('cc.ivr.tplFlow.satisfactionEdgeLow') },\n        { id: 'e4', source: 'n3', target: 'n5', label: t('cc.ivr.tplFlow.satisfactionEdgeHigh') },"],
  // 24h
  ["    name: '24小时服务',\n    desc: '工作时段 / 非工作时段智能路由',",
   "    name: t('cc.ivr.tplFlow.service24hName'),\n    desc: t('cc.ivr.tplFlow.service24hDesc'),"],
  ["      name: '24小时智能路由',\n      desc: '按时段自动分配人工或留言',",
   "      name: t('cc.ivr.tplFlow.service24hFlowName'),\n      desc: t('cc.ivr.tplFlow.service24hFlowDesc'),"],
  // 24h nodes
  ["{ id: 'n1', type: 'start', name: '开始', x: 80, y: 240, config: {} },\n        { id: 'n2', type: 'collect', name: '当前时段', x: 240, y: 240, config: { variable: 'hour', value: '${SYSTEM_HOUR}', persist: false } },\n        { id: 'n3', type: 'condition', name: '时段判断', x: 440, y: 240, config: { variable: 'hour', op: 'between', value: '9,18' } },\n        { id: 'n4', type: 'play', name: '工作时段欢迎', x: 660, y: 80, config: { audio: 'work-time.wav', text: '欢迎致电，正在为您接通人工坐席' } },\n        { id: 'n5', type: 'queue', name: '人工排队', x: 880, y: 80, config: { skillGroupId: 1, queueAudio: 'hold-music.wav', timeout: 90, strategy: 'least-busy' } },\n        { id: 'n6', type: 'play', name: '非工作时段', x: 660, y: 380, config: { audio: 'after-hours.wav', text: '当前为非工作时段，请按提示留言' } },\n        { id: 'n7', type: 'collect', name: '记录留言', x: 880, y: 380, config: { variable: 'leaveMsg', value: 'true', persist: true } },\n        { id: 'n8', type: 'tts', name: '致谢挂机', x: 1080, y: 380, config: { text: '感谢您的留言，工作日将尽快回电', voice: 'female-std' } },\n        { id: 'n9', type: 'hangup', name: '结束', x: 1280, y: 240, config: { byeAudio: 'bye.wav', cause: 'NORMAL_CLEARING' } }",
   "{ id: 'n1', type: 'start', name: t('cc.ivr.list.startNodeName'), x: 80, y: 240, config: {} },\n        { id: 'n2', type: 'collect', name: t('cc.ivr.tplFlow.service24hNodeHour'), x: 240, y: 240, config: { variable: 'hour', value: '${SYSTEM_HOUR}', persist: false } },\n        { id: 'n3', type: 'condition', name: t('cc.ivr.tplFlow.service24hNodeJudge'), x: 440, y: 240, config: { variable: 'hour', op: 'between', value: '9,18' } },\n        { id: 'n4', type: 'play', name: t('cc.ivr.tplFlow.service24hNodeWorkWelcome'), x: 660, y: 80, config: { audio: 'work-time.wav', text: t('cc.ivr.tplFlow.service24hWorkText') } },\n        { id: 'n5', type: 'queue', name: t('cc.ivr.tplFlow.service24hNodeWorkQueue'), x: 880, y: 80, config: { skillGroupId: 1, queueAudio: 'hold-music.wav', timeout: 90, strategy: 'least-busy' } },\n        { id: 'n6', type: 'play', name: t('cc.ivr.tplFlow.service24hNodeOff'), x: 660, y: 380, config: { audio: 'after-hours.wav', text: t('cc.ivr.tplFlow.service24hOffText') } },\n        { id: 'n7', type: 'collect', name: t('cc.ivr.tplFlow.service24hNodeRecord'), x: 880, y: 380, config: { variable: 'leaveMsg', value: 'true', persist: true } },\n        { id: 'n8', type: 'tts', name: t('cc.ivr.tplFlow.service24hNodeBye'), x: 1080, y: 380, config: { text: t('cc.ivr.tplFlow.service24hByeText'), voice: 'female-std' } },\n        { id: 'n9', type: 'hangup', name: t('cc.ivr.tplFlow.presaleNodeEnd'), x: 1280, y: 240, config: { byeAudio: 'bye.wav', cause: 'NORMAL_CLEARING' } }"],
  // 24h edges
  ["{ id: 'e3', source: 'n3', target: 'n4', label: '工作时间' },\n        { id: 'e4', source: 'n3', target: 'n6', label: '非工作' },",
   "{ id: 'e3', source: 'n3', target: 'n4', label: t('cc.ivr.tplFlow.service24hEdgeWork') },\n        { id: 'e4', source: 'n3', target: 'n6', label: t('cc.ivr.tplFlow.service24hEdgeOff') },"]
]

for (const [a, b] of js) {
  if (s.indexOf(a) === -1) {
    console.log('JS NOT FOUND:', a.slice(0, 60))
  }
  s = s.split(a).join(b)
}

fs.writeFileSync(FILE, s, 'utf8')
console.log('ivr.vue patched. Final lines:', s.split('\n').length)

// Verify no remaining hardcoded Chinese (in template/script section, not style)
const styleStart = s.indexOf('<style')
const codeOnly = s.slice(0, styleStart)
const remaining = codeOnly.match(/[\u4e00-\u9fff]+/g) || []
console.log('Remaining Chinese in code (top 30):')
console.log([...new Set(remaining)].slice(0, 30))
