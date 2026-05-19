/* Task #104: i18n refactor for Softphone.vue & CallPopup.vue */
const fs = require('fs');
const path = require('path');

const SOFT = 'd:\\zhehang-erp\\zhehang-erp-ui\\src\\components\\call-center\\Softphone.vue';
const POPUP = 'd:\\zhehang-erp\\zhehang-erp-ui\\src\\components\\call-center\\CallPopup.vue';

function applyReplacements(file, repls) {
  let src = fs.readFileSync(file, 'utf8');
  let okCount = 0;
  for (const [from, to] of repls) {
    if (!src.includes(from)) {
      console.error('[MISS]', file, '\n--- looking for ---\n' + from);
      throw new Error('replacement target not found');
    }
    // ensure unique
    const first = src.indexOf(from);
    const last = src.lastIndexOf(from);
    if (first !== last) {
      console.error('[NOT-UNIQUE]', file, '\n--- target ---\n' + from);
      throw new Error('replacement target not unique');
    }
    src = src.slice(0, first) + to + src.slice(first + from.length);
    okCount++;
  }
  fs.writeFileSync(file, src, 'utf8');
  console.log('[DONE]', file, 'replacements=', okCount);
}

/* ============ Softphone.vue ============ */
const softReps = [
  // 1. 收起 title
  [
    `<button class="sp-icon-btn" title="收起" @click="expanded = false">`,
    `<button class="sp-icon-btn" :title="t('cc.softphone.collapse')" @click="expanded = false">`
  ],
  // 2. 装饰品牌行
  [
    `<span class="brand-text">SOFT&nbsp;PHONE&nbsp;·&nbsp;软电话</span>`,
    `<span class="brand-text">{{ t('cc.softphone.brand') }}</span>`
  ],
  // 3. 拨号输入框 placeholder
  [
    `placeholder="输入号码或分机"`,
    `:placeholder="t('cc.softphone.dial.inputPlaceholder')"`
  ],
  // 4. 拨打按钮文本
  [
    `<el-icon :size="20"><PhoneFilled /></el-icon>
                <span>拨打</span>`,
    `<el-icon :size="20"><PhoneFilled /></el-icon>
                <span>{{ t('cc.softphone.dial.callBtn') }}</span>`
  ],
  // 5. dial-meta 今日 / 总时长
  [
    `<div class="dial-meta">
              <span>今日 {{ store.todayCallCount }} 通</span>
              <span class="meta-divider">|</span>
              <span>总时长 {{ formatSec(store.todayTalkSec) }}</span>
            </div>`,
    `<div class="dial-meta">
              <span>{{ t('cc.softphone.dial.todayCalls', { count: store.todayCallCount }) }}</span>
              <span class="meta-divider">|</span>
              <span>{{ t('cc.softphone.dial.todayDuration', { duration: formatSec(store.todayTalkSec) }) }}</span>
            </div>`
  ],
  // 6. ringing 文案
  [
    `<p class="ring-label">来电接入</p>
              <p class="ring-name">{{ store.currentCall?.peerName || '未知联系人' }}</p>`,
    `<p class="ring-label">{{ t('cc.softphone.ringing.label') }}</p>
              <p class="ring-name">{{ store.currentCall?.peerName || t('cc.softphone.ringing.unknownContact') }}</p>`
  ],
  // 7. 拒接 / 接听
  [
    `<span class="round-label">拒接</span>`,
    `<span class="round-label">{{ t('cc.softphone.ringing.reject') }}</span>`
  ],
  [
    `<span class="round-label">接听</span>`,
    `<span class="round-label">{{ t('cc.softphone.ringing.accept') }}</span>`
  ],
  // 8. 通话方向
  [
    `<p class="talk-direction">
                {{ store.currentCall?.direction === 'inbound' ? '↓ 来电' : '↑ 去电' }}
              </p>
              <p class="talk-peer__name">{{ store.currentCall?.peerName || '联系人' }}</p>`,
    `<p class="talk-direction">
                {{ store.currentCall?.direction === 'inbound' ? t('cc.softphone.talking.directionIn') : t('cc.softphone.talking.directionOut') }}
              </p>
              <p class="talk-peer__name">{{ store.currentCall?.peerName || t('cc.softphone.talking.contact') }}</p>`
  ],
  // 9. 静音 / 保持 / 转接 / 拨号 / 挂断
  [
    `<span class="op-label">{{ store.muted ? '已静音' : '静音' }}</span>`,
    `<span class="op-label">{{ store.muted ? t('cc.softphone.talking.muted') : t('cc.softphone.talking.mute') }}</span>`
  ],
  [
    `<span class="op-label">{{ store.onHold ? '已保持' : '保持' }}</span>`,
    `<span class="op-label">{{ store.onHold ? t('cc.softphone.talking.held') : t('cc.softphone.talking.holdBtn') }}</span>`
  ],
  [
    `<span class="op-label">转接</span>`,
    `<span class="op-label">{{ t('cc.softphone.talking.transfer') }}</span>`
  ],
  [
    `<span class="op-label">拨号</span>`,
    `<span class="op-label">{{ t('cc.softphone.talking.keypad') }}</span>`
  ],
  [
    `<el-icon :size="22"><PhoneFilled /></el-icon>
              <span>挂断</span>`,
    `<el-icon :size="22"><PhoneFilled /></el-icon>
              <span>{{ t('cc.softphone.talking.hangup') }}</span>`
  ],
  // 10. afterwork
  [
    `<span class="aw-unit">秒</span>`,
    `<span class="aw-unit">{{ t('cc.softphone.afterwork.unitSec') }}</span>`
  ],
  [
    `<p class="aw-tip">话后处理中·请完善客户记录</p>
            <textarea v-model="awNote" class="aw-note" placeholder="输入跟进备注·可选"></textarea>
            <button class="finish-btn" @click="onFinishAfterwork">
              <el-icon :size="18"><Select /></el-icon>
              <span>完成后处理</span>
            </button>`,
    `<p class="aw-tip">{{ t('cc.softphone.afterwork.tip') }}</p>
            <textarea v-model="awNote" class="aw-note" :placeholder="t('cc.softphone.afterwork.notePlaceholder')"></textarea>
            <button class="finish-btn" @click="onFinishAfterwork">
              <el-icon :size="18"><Select /></el-icon>
              <span>{{ t('cc.softphone.afterwork.finish') }}</span>
            </button>`
  ],
  // 11. footer EXT
  [
    `<span class="ext-tag">EXT {{ store.currentAgentNo || '----' }}</span>`,
    `<span class="ext-tag">{{ t('cc.softphone.footer.ext') }} {{ store.currentAgentNo || '----' }}</span>`
  ],
  // 12. script: 引入 useI18n
  [
    `import { useCallCenterStore } from '@/stores/call-center'
import type { AgentStatus } from '@/api/call-center'

const store = useCallCenterStore()`,
    `import { useI18n } from 'vue-i18n'
import { useCallCenterStore } from '@/stores/call-center'
import type { AgentStatus } from '@/api/call-center'

const { t } = useI18n()
const store = useCallCenterStore()`
  ],
  // 13. phaseLabel computed
  [
    `const phaseLabel = computed(() => {
  const m: Record<string, string> = {
    idle: '空闲', dialing: '拨号中', ringing: '来电',
    talking: '通话中', hold: '保持中', afterwork: '后处理'
  }
  return m[store.phoneState] || '-'
})`,
    `const phaseLabel = computed(() => {
  const m: Record<string, string> = {
    idle: t('cc.softphone.phase.idle'),
    dialing: t('cc.softphone.phase.dialing'),
    ringing: t('cc.softphone.phase.ringing'),
    talking: t('cc.softphone.phase.talking'),
    hold: t('cc.softphone.phase.hold'),
    afterwork: t('cc.softphone.phase.afterwork')
  }
  return m[store.phoneState] || '-'
})`
  ],
  // 14. agentStatusLabel
  [
    `const agentStatusLabel = computed(() => {
  const m: Record<AgentStatus, string> = {
    offline: '离线', idle: '空闲', busy: '忙碌',
    afterwork: '后处理', break: '休息'
  }
  return '坐席状态：' + (m[store.currentAgentStatus] || '-')
})`,
    `const agentStatusLabel = computed(() => {
  const m: Record<AgentStatus, string> = {
    offline: t('cc.softphone.agentStatus.offline'),
    idle: t('cc.softphone.agentStatus.idle'),
    busy: t('cc.softphone.agentStatus.busy'),
    afterwork: t('cc.softphone.agentStatus.afterwork'),
    break: t('cc.softphone.agentStatus.break')
  }
  return t('cc.softphone.agentStatus.prefix') + (m[store.currentAgentStatus] || '-')
})`
  ],
  // 15. DTMF 提示
  [
    `function onDtmf(num: string) {
  // 模拟 DTMF
  ElMessage.success('发送 DTMF：' + num)
}`,
    `function onDtmf(num: string) {
  // 模拟 DTMF
  ElMessage.success(t('cc.softphone.talking.dtmfSent', { key: num }))
}`
  ],
  // 16. 离线告警
  [
    `if (store.currentAgentStatus === 'offline') {
    ElMessage.warning('请先上线后再拨号')
    return
  }`,
    `if (store.currentAgentStatus === 'offline') {
    ElMessage.warning(t('cc.softphone.dial.loginFirst'))
    return
  }`
  ],
  // 17. transfer prompt
  [
    `function onTransfer() {
  ElMessageBox.prompt('请输入转接目标分机 / 号码', '转接通话', {
    confirmButtonText: '转接',
    cancelButtonText: '取消',
    inputPattern: /^[\\d#*]+$/,
    inputErrorMessage: '号码格式不正确'
  }).then(({ value }) => {
    ElMessage.success('已转接至 ' + value)
    store.endCall()
  }).catch(() => {})
}`,
    `function onTransfer() {
  ElMessageBox.prompt(t('cc.softphone.transfer.prompt'), t('cc.softphone.transfer.title'), {
    confirmButtonText: t('cc.softphone.transfer.confirmBtn'),
    cancelButtonText: t('cc.softphone.transfer.cancelBtn'),
    inputPattern: /^[\\d#*]+$/,
    inputErrorMessage: t('cc.softphone.transfer.formatError')
  }).then(({ value }) => {
    ElMessage.success(t('cc.softphone.transfer.success', { target: value }))
    store.endCall()
  }).catch(() => {})
}`
  ]
];

/* ============ CallPopup.vue ============ */
const popupReps = [
  // 1. 顶部
  [
    `<span class="head-label">INCOMING&nbsp;·&nbsp;来电识别</span>
          <h2 class="head-title">{{ data?.customerName || '未知客户' }}</h2>`,
    `<span class="head-label">{{ t('cc.popup.headLabel') }}</span>
          <h2 class="head-title">{{ data?.customerName || t('cc.popup.unknownCustomer') }}</h2>`
  ],
  // 2. 客户信息行
  [
    `<div class="card-row">
          <span class="row-key">手机</span>
          <span class="row-val phone-num">{{ data?.caller || '-' }}</span>
        </div>
        <div class="card-row">
          <span class="row-key">公司</span>
          <span class="row-val">{{ data?.companyName || '·' }}</span>
        </div>
        <div class="card-row">
          <span class="row-key">最后联系</span>
          <span class="row-val">{{ data?.lastCallTime || '·' }}</span>
        </div>`,
    `<div class="card-row">
          <span class="row-key">{{ t('cc.popup.row.mobile') }}</span>
          <span class="row-val phone-num">{{ data?.caller || '-' }}</span>
        </div>
        <div class="card-row">
          <span class="row-key">{{ t('cc.popup.row.company') }}</span>
          <span class="row-val">{{ data?.companyName || t('cc.popup.row.empty') }}</span>
        </div>
        <div class="card-row">
          <span class="row-key">{{ t('cc.popup.row.lastCall') }}</span>
          <span class="row-val">{{ data?.lastCallTime || t('cc.popup.row.empty') }}</span>
        </div>`
  ],
  // 3. VIP 标签
  [
    `<span v-if="data.isVip" class="tag tag--vip">VIP</span>`,
    `<span v-if="data.isVip" class="tag tag--vip">{{ t('cc.popup.tagVip') }}</span>`
  ],
  // 4. 三个快捷按钮
  [
    `<button class="quick-btn" @click="onCreateTicket">
          <el-icon :size="16"><Tickets /></el-icon>
          <span>创建工单</span>
        </button>
        <button class="quick-btn" @click="onAddFollow">
          <el-icon :size="16"><EditPen /></el-icon>
          <span>添加跟进</span>
        </button>
        <button class="quick-btn" @click="onTransfer">
          <el-icon :size="16"><Switch /></el-icon>
          <span>转接同事</span>
        </button>`,
    `<button class="quick-btn" @click="onCreateTicket">
          <el-icon :size="16"><Tickets /></el-icon>
          <span>{{ t('cc.popup.action.createTicket') }}</span>
        </button>
        <button class="quick-btn" @click="onAddFollow">
          <el-icon :size="16"><EditPen /></el-icon>
          <span>{{ t('cc.popup.action.addFollow') }}</span>
        </button>
        <button class="quick-btn" @click="onTransfer">
          <el-icon :size="16"><Switch /></el-icon>
          <span>{{ t('cc.popup.action.transfer') }}</span>
        </button>`
  ],
  // 5. timeline 行
  [
    `<p class="tl-line">坐席 <em>{{ r.agentName || '-' }}</em> · 时长 <em>{{ formatSec(r.totalDuration) }}</em></p>`,
    `<p class="tl-line">{{ t('cc.popup.timeline.agentLabel') }} <em>{{ r.agentName || '-' }}</em> · {{ t('cc.popup.timeline.durationLabel') }} <em>{{ formatSec(r.totalDuration) }}</em></p>`
  ],
  // 6. empty 提示
  [
    `<p v-if="!recentCalls.length" class="empty">暂无历史通话</p>`,
    `<p v-if="!recentCalls.length" class="empty">{{ t('cc.popup.timeline.emptyCalls') }}</p>`
  ],
  [
    `<li v-if="!recentOrders.length" class="empty">暂无订单记录</li>`,
    `<li v-if="!recentOrders.length" class="empty">{{ t('cc.popup.timeline.emptyOrders') }}</li>`
  ],
  [
    `<p v-if="!followList.length" class="empty">暂无跟进记录</p>`,
    `<p v-if="!followList.length" class="empty">{{ t('cc.popup.timeline.emptyFollow') }}</p>`
  ],
  // 7. footer
  [
    `<span class="foot-id">CALL ID · {{ store.currentCall?.callId || '-' }}</span>`,
    `<span class="foot-id">{{ t('cc.popup.footer.callId') }} · {{ store.currentCall?.callId || '-' }}</span>`
  ],
  // 8. script: 引入 useI18n
  [
    `import { Close, Tickets, EditPen, Switch } from '@element-plus/icons-vue'
import { useCallCenterStore } from '@/stores/call-center'
import type { CallDirection, CallResult } from '@/api/call-center'

const store = useCallCenterStore()`,
    `import { Close, Tickets, EditPen, Switch } from '@element-plus/icons-vue'
import { useI18n } from 'vue-i18n'
import { useCallCenterStore } from '@/stores/call-center'
import type { CallDirection, CallResult } from '@/api/call-center'

const { t } = useI18n()
const store = useCallCenterStore()`
  ],
  // 9. tabs computed
  [
    `const tabs = computed(() => [
  { key: 'calls', label: '通话', count: recentCalls.value.length },
  { key: 'orders', label: '订单', count: recentOrders.value.length },
  { key: 'follow', label: '跟进', count: followList.value.length }
])`,
    `const tabs = computed(() => [
  { key: 'calls', label: t('cc.popup.tab.calls'), count: recentCalls.value.length },
  { key: 'orders', label: t('cc.popup.tab.orders'), count: recentOrders.value.length },
  { key: 'follow', label: t('cc.popup.tab.follow'), count: followList.value.length }
])`
  ],
  // 10. dirText
  [
    `function dirText(d: CallDirection): string {
  return d === 'inbound' ? '来电' : d === 'outbound' ? '去电' : '内部'
}`,
    `function dirText(d: CallDirection): string {
  return d === 'inbound' ? t('cc.popup.direction.inbound') : d === 'outbound' ? t('cc.popup.direction.outbound') : t('cc.popup.direction.internal')
}`
  ],
  // 11. resultText
  [
    `function resultText(r: CallResult): string {
  const m: Record<CallResult, string> = {
    answered: '已接听', 'no-answer': '未接听', busy: '忙线', failed: '失败', abandoned: '放弃'
  }
  return m[r] || '-'
}`,
    `function resultText(r: CallResult): string {
  const m: Record<CallResult, string> = {
    answered: t('cc.popup.result.answered'),
    'no-answer': t('cc.popup.result.no-answer'),
    busy: t('cc.popup.result.busy'),
    failed: t('cc.popup.result.failed'),
    abandoned: t('cc.popup.result.abandoned')
  }
  return m[r] || '-'
}`
  ],
  // 12. formatSec
  [
    `function formatSec(sec: number): string {
  const m = Math.floor(sec / 60), s = sec % 60
  return \`\${m}分\${s}秒\`
}`,
    `function formatSec(sec: number): string {
  const m = Math.floor(sec / 60), s = sec % 60
  return t('cc.popup.timeline.durationFormat', { m, s })
}`
  ],
  // 13. mock 订单状态文本
  [
    `statusText: ['已付款', '待处理', '已发货'][i],`,
    `statusText: [t('cc.popup.orderStatus.paid'), t('cc.popup.orderStatus.pending'), t('cc.popup.orderStatus.shipped')][i],`
  ],
  // 14. mock follow type
  [
    `{ id: 1, time: '2026-05-18 16:24', by: '张敏', type: '电话跟进', content: '客户意向稳定，计划下周报价' },
    { id: 2, time: '2026-05-15 10:08', by: '李伟', type: '上门拜访', content: '拜访客户公司跟进项目充足度' }`,
    `{ id: 1, time: '2026-05-18 16:24', by: '张敏', type: t('cc.popup.followType.phone'), content: '客户意向稳定，计划下周报价' },
    { id: 2, time: '2026-05-15 10:08', by: '李伟', type: t('cc.popup.followType.visit'), content: '拜访客户公司跟进项目充足度' }`
  ],
  // 15. ElMessage
  [
    `function onCreateTicket() {
  ElMessage.success('已创建工单·跳转中')
}
function onAddFollow() {
  ElMessage.success('快捷跟进面板已开启')
}
function onTransfer() {
  ElMessage.success('请在软电话面板选择转接目标')
}`,
    `function onCreateTicket() {
  ElMessage.success(t('cc.popup.message.ticketCreated'))
}
function onAddFollow() {
  ElMessage.success(t('cc.popup.message.followOpened'))
}
function onTransfer() {
  ElMessage.success(t('cc.popup.message.transferTip'))
}`
  ]
];

applyReplacements(SOFT, softReps);
applyReplacements(POPUP, popupReps);
console.log('All replacements applied successfully.');
