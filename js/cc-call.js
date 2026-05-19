/**
 * 呼叫中心 · 通话记录与录音管理 - cc-call.js
 * 包含：通话记录列表、通话详情、录音管理、智能质检
 * 数据存储：localStorage（cc_call_records / cc_call_events / cc_quality_records）
 * UI风格：黑金奢华主题
 * 依赖：cc-core.js（ccGenerateId / ccShowToast / ccEscapeHtml / ccFormatDateTime / ccCloseModal / AgentStorage）
 */

/* ========================================================================
   0. 注入专属样式（录音播放器、时间轴、质检评分）
   ======================================================================== */
(function () {
    if (document.getElementById('cc-call-styles')) return;
    const style = document.createElement('style');
    style.id = 'cc-call-styles';
    style.textContent = `
        .cc-audio-player { background: #1A1A24; border: 1px solid rgba(212,175,55,0.2); border-radius: 8px; padding: 16px; margin-top: 16px; }
        .cc-audio-waveform { display: flex; align-items: center; gap: 2px; height: 40px; margin: 12px 0; }
        .cc-audio-bar { width: 3px; background: linear-gradient(to top, #B8860B, #D4AF37); border-radius: 2px; animation: ccWave 1.2s ease-in-out infinite; }
        .cc-audio-bar:nth-child(odd) { animation-delay: 0.2s; }
        .cc-audio-bar:nth-child(3n) { animation-delay: 0.4s; }
        .cc-audio-bar:nth-child(4n) { animation-delay: 0.6s; }
        .cc-audio-bar:nth-child(5n) { animation-delay: 0.8s; }
        .cc-audio-bar.cc-paused { animation-play-state: paused; opacity: .5; }
        @keyframes ccWave { 0%,100% { height: 20%; } 50% { height: 80%; } }
        .cc-audio-controls { display: flex; align-items: center; gap: 12px; }
        .cc-audio-btn { width: 36px; height: 36px; border-radius: 50%; border: 1px solid #D4AF37; background: transparent; color: #D4AF37; cursor: pointer; display: flex; align-items: center; justify-content: center; font-size: 14px; transition: all .25s; }
        .cc-audio-btn:hover { background: rgba(212,175,55,.15); }
        .cc-audio-progress { flex: 1; height: 4px; background: #333; border-radius: 2px; position: relative; cursor: pointer; }
        .cc-audio-progress-fill { height: 100%; background: linear-gradient(90deg, #B8860B, #D4AF37); border-radius: 2px; width: 30%; transition: width .2s; }
        .cc-audio-time { font-size: 11px; color: #A0A0B0; font-family: monospace; min-width: 88px; text-align: right; }
        .cc-timeline { position: relative; padding-left: 24px; }
        .cc-timeline::before { content: ''; position: absolute; left: 8px; top: 0; bottom: 0; width: 2px; background: rgba(212,175,55,0.2); }
        .cc-timeline-item { position: relative; margin-bottom: 16px; padding: 10px 14px; background: #1A1A24; border-radius: 8px; border: 1px solid rgba(212,175,55,0.1); }
        .cc-timeline-item::before { content: ''; position: absolute; left: -20px; top: 14px; width: 10px; height: 10px; border-radius: 50%; background: #D4AF37; border: 2px solid #0A0A0F; box-shadow: 0 0 0 2px rgba(212,175,55,0.25); }
        .cc-timeline-time { font-size: 11px; color: #999; font-family: monospace; letter-spacing: .5px; }
        .cc-timeline-event { font-size: 13px; color: #fff; margin-top: 4px; }
        .cc-timeline-event .cc-evt-icon { display: inline-block; width: 22px; text-align: center; margin-right: 6px; color: #D4AF37; }
        .cc-quality-scores { display: grid; grid-template-columns: repeat(5, 1fr); gap: 12px; margin: 16px 0; }
        .cc-quality-score-item { text-align: center; padding: 14px 8px; background: #1A1A24; border-radius: 8px; border: 1px solid rgba(212,175,55,0.1); position: relative; overflow: hidden; }
        .cc-quality-score-item::after { content: ''; position: absolute; left: 0; right: 0; bottom: 0; height: 3px; background: linear-gradient(90deg, #B8860B, #D4AF37); opacity: .8; }
        .cc-quality-score-value { font-size: 26px; font-weight: 700; color: #D4AF37; letter-spacing: 1px; }
        .cc-quality-score-label { font-size: 11px; color: #A0A0B0; margin-top: 4px; letter-spacing: .5px; }
        .cc-quality-score-max { font-size: 10px; color: #555; }
        .cc-call-tag { display: inline-block; padding: 2px 8px; border-radius: 10px; font-size: 11px; letter-spacing: .5px; margin-right: 4px; }
        .cc-tag-in { background: rgba(33,150,243,.12); color: #4FC3F7; border: 1px solid rgba(79,195,247,.3); }
        .cc-tag-out { background: rgba(212,175,55,.12); color: #D4AF37; border: 1px solid rgba(212,175,55,.3); }
        .cc-tag-internal { background: rgba(186,104,200,.12); color: #BA68C8; border: 1px solid rgba(186,104,200,.3); }
        .cc-tag-success { background: rgba(76,175,80,.12); color: #66BB6A; border: 1px solid rgba(102,187,106,.3); }
        .cc-tag-fail { background: rgba(255,77,79,.12); color: #FF6B6E; border: 1px solid rgba(255,107,110,.3); }
        .cc-tag-warn { background: rgba(255,167,38,.12); color: #FFB74D; border: 1px solid rgba(255,183,77,.3); }
        .cc-rate-stars { color: #D4AF37; letter-spacing: 2px; font-size: 14px; }
        .cc-rate-stars .cc-rate-empty { color: #444; }
        .cc-quality-radar { display: grid; grid-template-columns: 1fr; gap: 10px; padding: 16px; background: #1A1A24; border-radius: 8px; border: 1px solid rgba(212,175,55,.1); }
        .cc-radar-row { display: flex; align-items: center; gap: 12px; }
        .cc-radar-label { width: 88px; font-size: 12px; color: #A0A0B0; }
        .cc-radar-bar { flex: 1; height: 10px; background: #2a2a36; border-radius: 5px; position: relative; overflow: hidden; }
        .cc-radar-bar-fill { position: absolute; left: 0; top: 0; bottom: 0; background: linear-gradient(90deg, #B8860B, #D4AF37); border-radius: 5px; transition: width .4s ease-out; }
        .cc-radar-value { width: 60px; text-align: right; font-size: 12px; color: #D4AF37; font-family: monospace; }
        .cc-pagination { display: flex; align-items: center; justify-content: space-between; padding: 14px 4px 0; }
        .cc-pagination-info { color: #A0A0B0; font-size: 12px; }
        .cc-pagination-pages { display: flex; gap: 4px; }
        .cc-page-btn { min-width: 30px; height: 30px; padding: 0 8px; background: transparent; border: 1px solid rgba(212,175,55,.2); color: #A0A0B0; border-radius: 4px; cursor: pointer; font-size: 12px; }
        .cc-page-btn:hover:not(:disabled) { border-color: #D4AF37; color: #D4AF37; }
        .cc-page-btn.active { background: linear-gradient(135deg,#B8860B,#D4AF37); color:#000; border-color: transparent; font-weight: 600; }
        .cc-page-btn:disabled { opacity: .3; cursor: not-allowed; }
        .cc-filter-bar { background: #1A1A24; border: 1px solid rgba(212,175,55,.12); border-radius: 8px; padding: 14px 16px; margin-bottom: 16px; display: flex; flex-wrap: wrap; gap: 12px; align-items: flex-end; }
        .cc-filter-item { display: flex; flex-direction: column; gap: 4px; }
        .cc-filter-item label { font-size: 11px; color: #888; letter-spacing: .5px; }
        .cc-filter-item .cc-form-input,
        .cc-filter-item .cc-form-select { min-width: 110px; height: 32px; padding: 4px 10px; font-size: 12px; }
        .cc-summary-strip { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; margin-bottom: 16px; }
        .cc-summary-cell { background: linear-gradient(135deg, #16161e, #1d1d28); border: 1px solid rgba(212,175,55,.1); border-radius: 8px; padding: 14px 16px; }
        .cc-summary-label { font-size: 11px; color: #888; letter-spacing: .5px; }
        .cc-summary-value { font-size: 22px; font-weight: 700; color: #D4AF37; margin-top: 4px; letter-spacing: 1px; }
        .cc-sub-tabs { display: flex; gap: 4px; padding: 4px; background: #14141c; border: 1px solid rgba(212,175,55,.08); border-radius: 8px; margin-bottom: 16px; width: fit-content; }
        .cc-sub-tab { padding: 8px 18px; background: transparent; border: none; color: #A0A0B0; font-size: 12px; cursor: pointer; border-radius: 6px; letter-spacing: .5px; }
        .cc-sub-tab.active { background: linear-gradient(135deg,#B8860B,#D4AF37); color: #000; font-weight: 600; }
        .cc-keyword-chip { display: inline-block; padding: 3px 10px; margin: 2px 4px 2px 0; border-radius: 12px; font-size: 11px; background: rgba(212,175,55,.12); color: #D4AF37; border: 1px solid rgba(212,175,55,.3); cursor: pointer; user-select: none; }
        .cc-keyword-chip.active { background: linear-gradient(135deg,#B8860B,#D4AF37); color: #000; }
        .cc-asr-text { background: #14141c; border: 1px solid rgba(212,175,55,.1); border-radius: 6px; padding: 12px 14px; max-height: 220px; overflow: auto; font-size: 12px; line-height: 1.8; color: #ccc; }
        .cc-asr-text mark { background: rgba(212,175,55,.2); color: #D4AF37; padding: 0 2px; border-radius: 2px; }
        .cc-detail-grid { display: grid; grid-template-columns: 1.1fr 1fr; gap: 16px; }
        @media (max-width: 1100px) { .cc-detail-grid { grid-template-columns: 1fr; } .cc-summary-strip { grid-template-columns: repeat(2, 1fr); } .cc-quality-scores { grid-template-columns: repeat(2, 1fr); } }
        .cc-slider { width: 100%; -webkit-appearance: none; height: 4px; border-radius: 2px; background: #2a2a36; outline: none; }
        .cc-slider::-webkit-slider-thumb { -webkit-appearance: none; width: 16px; height: 16px; border-radius: 50%; background: #D4AF37; cursor: pointer; box-shadow: 0 0 0 3px rgba(212,175,55,.2); }
        .cc-slider::-moz-range-thumb { width: 16px; height: 16px; border-radius: 50%; background: #D4AF37; cursor: pointer; border: none; }
        .cc-recording-row-player { padding: 12px 16px; background: #14141c; border-top: 1px solid rgba(212,175,55,.08); }
    `;
    document.head.appendChild(style);
})();

/* ========================================================================
   1. 常量
   ======================================================================== */
const CC_CALL_KEYS = {
    RECORDS: 'cc_call_records',
    EVENTS: 'cc_call_events',
    QUALITY: 'cc_quality_records'
};

const CALL_TYPE_MAP = { 1: '呼入', 2: '呼出', 3: '内部' };
const CALL_TYPE_ICON = { 1: '⬇', 2: '⬆', 3: '⇆' };
const CALL_TYPE_TAG_CSS = { 1: 'cc-tag-in', 2: 'cc-tag-out', 3: 'cc-tag-internal' };

const CALL_STATUS_MAP = { 1: '已接通', 2: '未接通', 3: '通话中', 4: '已转接', 5: '会议' };
const CALL_STATUS_TAG_CSS = { 1: 'cc-tag-success', 2: 'cc-tag-fail', 3: 'cc-tag-warn', 4: 'cc-tag-warn', 5: 'cc-tag-warn' };

const HANGUP_BY_MAP = { 1: '客户', 2: '坐席', 3: '系统' };

const CALL_EVENT_TYPES = ['RING', 'ANSWER', 'HOLD', 'RESUME', 'TRANSFER', 'MERGE', 'HANGUP', 'MUTE', 'UNMUTE'];

const CALL_EVENT_INFO = {
    RING:     { icon: '📞', label: '振铃' },
    ANSWER:   { icon: '✅', label: '接听' },
    HOLD:     { icon: '⏸',  label: '保持' },
    RESUME:   { icon: '▶',  label: '恢复' },
    TRANSFER: { icon: '↪',  label: '转接' },
    MERGE:    { icon: '⇲',  label: '会议合并' },
    HANGUP:   { icon: '📴', label: '挂断' },
    MUTE:     { icon: '🔇', label: '静音' },
    UNMUTE:   { icon: '🔊', label: '取消静音' }
};

const QC_CHECK_TYPE_MAP = { 1: '自动质检', 2: '人工质检' };

const QC_DIMENSIONS = [
    { key: 'attitude',     label: '服务态度', max: 20 },
    { key: 'professional', label: '专业水平', max: 30 },
    { key: 'process',      label: '流程规范', max: 20 },
    { key: 'communication',label: '沟通技巧', max: 15 },
    { key: 'achievement',  label: '结果达成', max: 15 }
];

const QC_KEYWORDS_POOL = ['您好', '请稍等', '感谢您的来电', '解决方案', '尊敬的客户', '请问还有其他问题吗', '稍后回复', '抱歉打扰', '已记录', '将为您处理'];

const QC_ISSUE_POOL = [
    '通话开始未使用标准问候语',
    '客户重复询问相同问题，未及时澄清',
    '响应时长超过30秒',
    '客户情绪激动时未做安抚',
    '专业术语解释不充分',
    '结束语未确认客户满意度',
    '存在打断客户发言的情况',
    '关键信息未做二次确认'
];

/* ========================================================================
   2. 工具函数
   ======================================================================== */
function ccFormatDuration(seconds) {
    if (!seconds || seconds <= 0) return '0:00';
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return m + ':' + (s < 10 ? '0' : '') + s;
}

function ccFormatTime(ts) {
    if (!ts) return '-';
    const d = new Date(ts);
    const pad = (n) => (n < 10 ? '0' + n : '' + n);
    return pad(d.getHours()) + ':' + pad(d.getMinutes()) + ':' + pad(d.getSeconds());
}

function ccFormatDate(ts) {
    if (!ts) return '-';
    const d = new Date(ts);
    const pad = (n) => (n < 10 ? '0' + n : '' + n);
    return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate());
}

function ccFormatFileSize(bytes) {
    if (!bytes) return '0 KB';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / 1024 / 1024).toFixed(2) + ' MB';
}

function ccRandPick(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
}

function ccDateRangeStart(range) {
    const now = new Date();
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    if (range === 'today')   return startOfDay;
    if (range === 'week')    return startOfDay - 6 * 86400000;
    if (range === 'month')   return startOfDay - 29 * 86400000;
    return 0;
}

/* ========================================================================
   3. CallRecordStorage —— 通话记录
   ======================================================================== */
const CallRecordStorage = {
    _getAllRaw() {
        try {
            const raw = localStorage.getItem(CC_CALL_KEYS.RECORDS);
            return raw ? JSON.parse(raw) : [];
        } catch (e) { return []; }
    },
    _saveAll(list) {
        localStorage.setItem(CC_CALL_KEYS.RECORDS, JSON.stringify(list));
    },
    getAll() {
        return this._getAllRaw().filter(r => !r.deleted);
    },
    getById(id) {
        return this.getAll().find(r => r.id === id) || null;
    },
    add(record) {
        const list = this._getAllRaw();
        record.id = record.id || ccGenerateId('call_');
        record.created_at = record.created_at || Date.now();
        record.deleted = false;
        list.push(record);
        this._saveAll(list);
        return record;
    },
    update(record) {
        const list = this._getAllRaw();
        const idx = list.findIndex(r => r.id === record.id);
        if (idx === -1) return null;
        list[idx] = Object.assign({}, list[idx], record, { updated_at: Date.now() });
        this._saveAll(list);
        return list[idx];
    },
    delete(id) {
        const list = this._getAllRaw();
        const idx = list.findIndex(r => r.id === id);
        if (idx === -1) return false;
        list[idx].deleted = true;
        list[idx].updated_at = Date.now();
        this._saveAll(list);
        return true;
    },
    getByAgentId(agentId) {
        return this.getAll().filter(r => r.agent_id === agentId);
    },
    getByCustomerId(customerId) {
        return this.getAll().filter(r => r.customer_id === customerId);
    }
};

/* ========================================================================
   4. CallEventStorage —— 通话事件
   ======================================================================== */
const CallEventStorage = {
    _getAllRaw() {
        try {
            const raw = localStorage.getItem(CC_CALL_KEYS.EVENTS);
            return raw ? JSON.parse(raw) : [];
        } catch (e) { return []; }
    },
    _saveAll(list) {
        // 限制总量，避免localStorage膨胀
        if (list.length > 5000) list = list.slice(list.length - 5000);
        localStorage.setItem(CC_CALL_KEYS.EVENTS, JSON.stringify(list));
    },
    getAll() {
        return this._getAllRaw();
    },
    getByCallId(callId) {
        return this._getAllRaw()
            .filter(e => e.call_id === callId)
            .sort((a, b) => a.event_at - b.event_at);
    },
    add(evt) {
        const list = this._getAllRaw();
        evt.id = evt.id || ccGenerateId('event_');
        evt.created_at = evt.created_at || Date.now();
        list.push(evt);
        this._saveAll(list);
        return evt;
    }
};

/* ========================================================================
   5. QualityRecordStorage —— 质检记录
   ======================================================================== */
const QualityRecordStorage = {
    _getAllRaw() {
        try {
            const raw = localStorage.getItem(CC_CALL_KEYS.QUALITY);
            return raw ? JSON.parse(raw) : [];
        } catch (e) { return []; }
    },
    _saveAll(list) {
        localStorage.setItem(CC_CALL_KEYS.QUALITY, JSON.stringify(list));
    },
    getAll() {
        return this._getAllRaw().filter(q => !q.deleted);
    },
    getByCallId(callId) {
        return this.getAll().filter(q => q.call_id === callId);
    },
    add(qc) {
        const list = this._getAllRaw();
        qc.id = qc.id || ccGenerateId('qc_');
        qc.created_at = qc.created_at || Date.now();
        qc.deleted = false;
        list.push(qc);
        this._saveAll(list);
        return qc;
    },
    update(qc) {
        const list = this._getAllRaw();
        const idx = list.findIndex(q => q.id === qc.id);
        if (idx === -1) return null;
        list[idx] = Object.assign({}, list[idx], qc, { updated_at: Date.now() });
        this._saveAll(list);
        return list[idx];
    }
};

/* ========================================================================
   6. CCCall —— 主对象
   ======================================================================== */
const CCCall = {
    container: null,
    currentView: 'records',         // records | detail | recording | quality
    qualitySubTab: 'tasks',         // tasks | results | stats
    selectedRecordId: null,
    selectedQualityId: null,
    expandedRecordingId: null,      // 录音管理内联展开
    isPlaying: false,
    filters: {
        dateRange: 'today',
        callType: 'all',
        status: 'all',
        agentId: 'all',
        durationMin: '',
        durationMax: '',
        keyword: ''
    },
    currentPage: 1,
    pageSize: 15,
    eventHandlers: [],

    /* ---------- 生命周期 ---------- */
    render(container) {
        this.container = container || this.container;
        if (!this.container) return;
        this.initSeedData();

        // 卸载旧事件
        this.eventHandlers.forEach(h => { try { h.el.removeEventListener(h.evt, h.fn); } catch (e) {} });
        this.eventHandlers = [];

        const subTabs = [
            { key: 'records',   label: '通话记录', icon: '⌕' },
            { key: 'recording', label: '录音管理', icon: '◉' },
            { key: 'quality',   label: '智能质检', icon: '✦' }
        ];

        let html = '<div class="cc-call-module">';
        html += '<div class="cc-sub-tabs">';
        subTabs.forEach(t => {
            const active = (this.currentView === t.key || (this.currentView === 'detail' && t.key === 'records')) ? ' active' : '';
            html += '<button class="cc-sub-tab' + active + '" data-cc-action="switch-view" data-view="' + t.key + '">'
                  + '<span style="margin-right:6px;opacity:.7;">' + t.icon + '</span>'
                  + ccEscapeHtml(t.label) + '</button>';
        });
        html += '</div>';

        html += '<div class="cc-call-body" data-cc-call-body>';
        if (this.currentView === 'records') {
            html += this.renderRecordList();
        } else if (this.currentView === 'detail') {
            html += this.renderRecordDetail(this.selectedRecordId);
        } else if (this.currentView === 'recording') {
            html += this.renderRecording();
        } else if (this.currentView === 'quality') {
            html += this.renderQuality();
        }
        html += '</div>';
        html += '</div>';

        this.container.innerHTML = html;
        this._bindEvents();
    },

    refresh() {
        const body = this.container && this.container.querySelector('[data-cc-call-body]');
        if (!body) { this.render(); return; }
        if (this.currentView === 'records') {
            body.innerHTML = this.renderRecordList();
        } else if (this.currentView === 'detail') {
            body.innerHTML = this.renderRecordDetail(this.selectedRecordId);
        } else if (this.currentView === 'recording') {
            body.innerHTML = this.renderRecording();
        } else if (this.currentView === 'quality') {
            body.innerHTML = this.renderQuality();
        }
    },

    _addEvent(el, evt, fn) {
        if (!el) return;
        el.addEventListener(evt, fn);
        this.eventHandlers.push({ el, evt, fn });
    },

    _bindEvents() {
        const root = this.container;
        if (!root) return;
        const click = (e) => this.handleEvents(e);
        const change = (e) => this._onChange(e);
        const input = (e) => this._onInput(e);
        this._addEvent(root, 'click', click);
        this._addEvent(root, 'change', change);
        this._addEvent(root, 'input', input);

        // 模态框 click 委托（一次性绑到document）
        if (!this._modalDelegate) {
            this._modalDelegate = (e) => this._onModalEvent(e);
            document.addEventListener('click', this._modalDelegate);
            document.addEventListener('input', this._modalDelegate);
            document.addEventListener('change', this._modalDelegate);
            this.eventHandlers.push({ el: document, evt: 'click', fn: this._modalDelegate });
            this.eventHandlers.push({ el: document, evt: 'input', fn: this._modalDelegate });
            this.eventHandlers.push({ el: document, evt: 'change', fn: this._modalDelegate });
        }
    },

    /* ====================================================================
       7. 通话记录列表
       ==================================================================== */
    renderRecordList() {
        const filtered = this._getFilteredRecords();
        const total = filtered.length;
        const answered = filtered.filter(r => r.status === 1).length;
        const answerRate = total ? Math.round(answered / total * 100) : 0;
        const avgDuration = answered ? Math.round(filtered.filter(r => r.status === 1).reduce((s, r) => s + (r.duration || 0), 0) / answered) : 0;

        let html = '';

        // —— 筛选栏 ——
        html += '<div class="cc-filter-bar">';
        html += '<div class="cc-filter-item"><label>时间范围</label>';
        html += '<select class="cc-form-select" data-cc-filter="dateRange">';
        [['today','今天'], ['week','本周'], ['month','本月'], ['all','全部']].forEach(([v, l]) => {
            html += '<option value="' + v + '"' + (this.filters.dateRange === v ? ' selected' : '') + '>' + l + '</option>';
        });
        html += '</select></div>';

        html += '<div class="cc-filter-item"><label>通话类型</label>';
        html += '<select class="cc-form-select" data-cc-filter="callType">';
        html += '<option value="all"' + (this.filters.callType === 'all' ? ' selected' : '') + '>全部</option>';
        Object.keys(CALL_TYPE_MAP).forEach(k => {
            html += '<option value="' + k + '"' + (this.filters.callType === k ? ' selected' : '') + '>' + CALL_TYPE_MAP[k] + '</option>';
        });
        html += '</select></div>';

        html += '<div class="cc-filter-item"><label>状态</label>';
        html += '<select class="cc-form-select" data-cc-filter="status">';
        html += '<option value="all"' + (this.filters.status === 'all' ? ' selected' : '') + '>全部</option>';
        html += '<option value="1"' + (this.filters.status === '1' ? ' selected' : '') + '>已接通</option>';
        html += '<option value="2"' + (this.filters.status === '2' ? ' selected' : '') + '>未接通</option>';
        html += '</select></div>';

        html += '<div class="cc-filter-item"><label>坐席</label>';
        html += '<select class="cc-form-select" data-cc-filter="agentId">';
        html += '<option value="all"' + (this.filters.agentId === 'all' ? ' selected' : '') + '>全部坐席</option>';
        if (typeof AgentStorage !== 'undefined') {
            AgentStorage.getAll().forEach(a => {
                html += '<option value="' + a.id + '"' + (this.filters.agentId === a.id ? ' selected' : '') + '>' + ccEscapeHtml(a.agent_no + ' ' + a.name) + '</option>';
            });
        }
        html += '</select></div>';

        html += '<div class="cc-filter-item"><label>时长(秒)</label>';
        html += '<div style="display:flex;gap:4px;">';
        html += '<input class="cc-form-input" type="number" placeholder="最小" style="width:80px;" data-cc-filter="durationMin" value="' + ccEscapeHtml(this.filters.durationMin) + '">';
        html += '<span style="line-height:32px;color:#666;">—</span>';
        html += '<input class="cc-form-input" type="number" placeholder="最大" style="width:80px;" data-cc-filter="durationMax" value="' + ccEscapeHtml(this.filters.durationMax) + '">';
        html += '</div></div>';

        html += '<div class="cc-filter-item" style="flex:1;min-width:180px;"><label>关键词（号码/备注）</label>';
        html += '<input class="cc-form-input" type="text" placeholder="搜索号码或备注..." data-cc-filter="keyword" value="' + ccEscapeHtml(this.filters.keyword) + '"></div>';

        html += '<div class="cc-filter-item">';
        html += '<button class="cc-btn cc-btn-outline cc-btn-sm" data-cc-action="reset-filters">⟲ 重置</button>';
        html += '</div>';
        html += '</div>';

        // —— 统计摘要 ——
        html += '<div class="cc-summary-strip">';
        html += this._summaryCell('总通话数', total);
        html += this._summaryCell('接通数', answered);
        html += this._summaryCell('接通率', answerRate + '%');
        html += this._summaryCell('平均时长', ccFormatDuration(avgDuration));
        html += '</div>';

        // —— 列表 ——
        html += '<div class="cc-card">';
        html += '<div class="cc-card-header">';
        html += '<div class="cc-card-title">⌕ 通话记录 <span style="color:#888;font-size:12px;font-weight:400;margin-left:8px;">共 ' + total + ' 条</span></div>';
        html += '<button class="cc-btn cc-btn-outline cc-btn-sm" data-cc-action="refresh">⟳ 刷新</button>';
        html += '</div>';

        // 分页
        const totalPages = Math.max(1, Math.ceil(total / this.pageSize));
        if (this.currentPage > totalPages) this.currentPage = totalPages;
        const pageStart = (this.currentPage - 1) * this.pageSize;
        const pageRecords = filtered.slice(pageStart, pageStart + this.pageSize);

        if (pageRecords.length === 0) {
            html += '<div class="cc-empty"><div class="cc-empty-icon">∅</div><div class="cc-empty-text">未找到符合条件的通话记录</div></div>';
        } else {
            html += '<div class="cc-table-wrapper"><table class="cc-table">';
            html += '<thead><tr>'
                  + '<th style="width:140px;">时间</th>'
                  + '<th style="width:70px;">类型</th>'
                  + '<th>主叫</th>'
                  + '<th>被叫</th>'
                  + '<th>坐席</th>'
                  + '<th style="width:80px;">时长</th>'
                  + '<th style="width:90px;">状态</th>'
                  + '<th style="width:60px;text-align:center;">录音</th>'
                  + '<th style="width:160px;text-align:right;">操作</th>'
                  + '</tr></thead><tbody>';

            pageRecords.forEach(r => {
                const typeLabel = CALL_TYPE_MAP[r.call_type] || '-';
                const typeIcon = CALL_TYPE_ICON[r.call_type] || '·';
                const typeCss = CALL_TYPE_TAG_CSS[r.call_type] || 'cc-tag-internal';
                const stLabel = CALL_STATUS_MAP[r.status] || '-';
                const stCss = CALL_STATUS_TAG_CSS[r.status] || 'cc-tag-warn';
                html += '<tr>'
                      + '<td style="font-family:monospace;color:#A0A0B0;font-size:12px;">' + ccFormatDateTime(r.start_time) + '</td>'
                      + '<td><span class="cc-call-tag ' + typeCss + '">' + typeIcon + ' ' + typeLabel + '</span></td>'
                      + '<td style="font-family:monospace;">' + ccEscapeHtml(r.caller_no || '-') + '</td>'
                      + '<td style="font-family:monospace;">' + ccEscapeHtml(r.callee_no || '-') + '</td>'
                      + '<td>' + ccEscapeHtml(r.agent_name || '-') + (r.agent_no ? ' <span style="color:#888;font-size:11px;">(' + ccEscapeHtml(r.agent_no) + ')</span>' : '') + '</td>'
                      + '<td style="font-family:monospace;color:#D4AF37;">' + ccFormatDuration(r.duration) + '</td>'
                      + '<td><span class="cc-call-tag ' + stCss + '">' + stLabel + '</span></td>'
                      + '<td style="text-align:center;font-size:14px;">' + (r.recording_url ? '<span style="color:#D4AF37;" title="有录音">◉</span>' : '<span style="color:#444;" title="无录音">○</span>') + '</td>'
                      + '<td style="text-align:right;white-space:nowrap;">'
                      + '<button class="cc-btn cc-btn-outline cc-btn-sm" data-cc-action="view-detail" data-record-id="' + r.id + '">详情</button> '
                      + '<button class="cc-btn cc-btn-outline cc-btn-sm" data-cc-action="quality-modal" data-record-id="' + r.id + '">质检</button>'
                      + '</td></tr>';
            });
            html += '</tbody></table></div>';

            // 分页控件
            html += '<div class="cc-pagination">';
            html += '<div class="cc-pagination-info">第 ' + this.currentPage + ' / ' + totalPages + ' 页 · 共 ' + total + ' 条</div>';
            html += '<div class="cc-pagination-pages">';
            html += '<button class="cc-page-btn" data-cc-action="page" data-page="prev"' + (this.currentPage <= 1 ? ' disabled' : '') + '>‹</button>';
            const pageBtns = this._buildPageNumbers(this.currentPage, totalPages);
            pageBtns.forEach(p => {
                if (p === '...') html += '<button class="cc-page-btn" disabled>…</button>';
                else html += '<button class="cc-page-btn' + (p === this.currentPage ? ' active' : '') + '" data-cc-action="page" data-page="' + p + '">' + p + '</button>';
            });
            html += '<button class="cc-page-btn" data-cc-action="page" data-page="next"' + (this.currentPage >= totalPages ? ' disabled' : '') + '>›</button>';
            html += '</div></div>';
        }

        html += '</div>';
        return html;
    },

    _summaryCell(label, value) {
        return '<div class="cc-summary-cell">'
             + '<div class="cc-summary-label">' + ccEscapeHtml(label) + '</div>'
             + '<div class="cc-summary-value">' + ccEscapeHtml(String(value)) + '</div>'
             + '</div>';
    },

    _buildPageNumbers(cur, total) {
        const arr = [];
        if (total <= 7) {
            for (let i = 1; i <= total; i++) arr.push(i);
            return arr;
        }
        arr.push(1);
        if (cur > 3) arr.push('...');
        const s = Math.max(2, cur - 1);
        const e = Math.min(total - 1, cur + 1);
        for (let i = s; i <= e; i++) arr.push(i);
        if (cur < total - 2) arr.push('...');
        arr.push(total);
        return arr;
    },

    _getFilteredRecords() {
        let list = CallRecordStorage.getAll().slice();
        const f = this.filters;

        const startTs = ccDateRangeStart(f.dateRange);
        if (startTs > 0) list = list.filter(r => (r.start_time || 0) >= startTs);

        if (f.callType !== 'all') list = list.filter(r => String(r.call_type) === String(f.callType));
        if (f.status !== 'all')   list = list.filter(r => String(r.status) === String(f.status));
        if (f.agentId !== 'all')  list = list.filter(r => r.agent_id === f.agentId);

        const dMin = parseInt(f.durationMin, 10);
        const dMax = parseInt(f.durationMax, 10);
        if (!isNaN(dMin)) list = list.filter(r => (r.duration || 0) >= dMin);
        if (!isNaN(dMax)) list = list.filter(r => (r.duration || 0) <= dMax);

        const kw = (f.keyword || '').trim().toLowerCase();
        if (kw) {
            list = list.filter(r =>
                (r.caller_no || '').toLowerCase().includes(kw) ||
                (r.callee_no || '').toLowerCase().includes(kw) ||
                (r.remark || '').toLowerCase().includes(kw) ||
                (r.tags || '').toLowerCase().includes(kw)
            );
        }

        list.sort((a, b) => (b.start_time || 0) - (a.start_time || 0));
        return list;
    },

    /* ====================================================================
       8. 通话详情
       ==================================================================== */
    renderRecordDetail(recordId) {
        const r = CallRecordStorage.getById(recordId);
        if (!r) {
            return '<div class="cc-empty"><div class="cc-empty-icon">∅</div><div class="cc-empty-text">通话记录不存在或已被删除</div></div>';
        }

        const events = CallEventStorage.getByCallId(recordId);
        const qcList = QualityRecordStorage.getByCallId(recordId);

        const typeLabel = CALL_TYPE_MAP[r.call_type] || '-';
        const typeCss = CALL_TYPE_TAG_CSS[r.call_type] || 'cc-tag-internal';
        const stLabel = CALL_STATUS_MAP[r.status] || '-';
        const stCss = CALL_STATUS_TAG_CSS[r.status] || 'cc-tag-warn';

        let html = '';

        // 顶部
        html += '<div style="margin-bottom:16px;display:flex;align-items:center;gap:12px;flex-wrap:wrap;">';
        html += '<button class="cc-btn cc-btn-outline cc-btn-sm" data-cc-action="back-to-records">← 返回列表</button>';
        html += '<span style="color:#888;font-size:12px;letter-spacing:.5px;">通话记录 / ' + ccEscapeHtml(r.id) + '</span>';
        html += '<div style="margin-left:auto;display:flex;gap:8px;">';
        html += '<button class="cc-btn cc-btn-outline cc-btn-sm" data-cc-action="quality-modal" data-record-id="' + r.id + '">✦ 提交质检</button>';
        html += '</div></div>';

        // 标题
        html += '<div class="cc-card" style="margin-bottom:16px;">';
        html += '<div style="display:flex;align-items:center;gap:14px;flex-wrap:wrap;">';
        html += '<div style="font-size:20px;font-weight:700;color:#fff;letter-spacing:.5px;">' + ccEscapeHtml(r.caller_no) + ' <span style="color:#666;margin:0 6px;">→</span> ' + ccEscapeHtml(r.callee_no) + '</div>';
        html += '<span class="cc-call-tag ' + typeCss + '">' + (CALL_TYPE_ICON[r.call_type] || '') + ' ' + typeLabel + '</span>';
        html += '<span class="cc-call-tag ' + stCss + '">' + stLabel + '</span>';
        html += '<span style="color:#A0A0B0;font-size:12px;font-family:monospace;margin-left:auto;">' + ccFormatDateTime(r.start_time) + '</span>';
        html += '</div></div>';

        // 主体两栏
        html += '<div class="cc-detail-grid">';

        // 左：基本信息
        html += '<div class="cc-card">';
        html += '<div class="cc-card-header"><div class="cc-card-title">▣ 通话基本信息</div></div>';
        html += this._row('通话ID', r.id);
        html += this._row('通话方向', typeLabel);
        html += this._row('主叫号码', r.caller_no);
        html += this._row('被叫号码', r.callee_no);
        html += this._row('坐席', (r.agent_name || '-') + (r.agent_no ? ' （' + r.agent_no + '）' : ''));
        html += this._row('通话时长', ccFormatDuration(r.duration));
        html += this._row('振铃时长', ccFormatDuration(r.ring_duration) + ' （' + (r.ring_duration || 0) + 's）');
        html += this._row('排队时长', ccFormatDuration(r.queue_duration) + ' （' + (r.queue_duration || 0) + 's）');
        html += this._row('后处理时长', ccFormatDuration(r.after_duration) + ' （' + (r.after_duration || 0) + 's）');
        html += this._row('开始时间', ccFormatDateTime(r.start_time));
        html += this._row('结束时间', ccFormatDateTime(r.end_time));
        html += this._row('挂断方', HANGUP_BY_MAP[r.hangup_by] || '-');
        html += this._row('挂断原因', r.hangup_reason);
        html += this._row('标签', r.tags);
        html += this._row('备注', r.remark);
        html += this._row('满意度', this._renderStars(r.satisfaction));
        html += '</div>';

        // 右：时间轴
        html += '<div class="cc-card">';
        html += '<div class="cc-card-header"><div class="cc-card-title">⌚ 通话事件时间轴 <span style="color:#888;font-size:12px;font-weight:400;margin-left:8px;">共 ' + events.length + ' 条</span></div></div>';
        if (events.length === 0) {
            html += '<div class="cc-empty"><div class="cc-empty-icon">∅</div><div class="cc-empty-text">暂无事件记录</div></div>';
        } else {
            html += '<div class="cc-timeline">';
            events.forEach(ev => {
                const info = CALL_EVENT_INFO[ev.event_type] || { icon: '·', label: ev.event_type };
                html += '<div class="cc-timeline-item">';
                html += '<div class="cc-timeline-time">' + ccFormatTime(ev.event_at) + '</div>';
                html += '<div class="cc-timeline-event"><span class="cc-evt-icon">' + info.icon + '</span>'
                      + ccEscapeHtml(info.label)
                      + (ev.detail ? ' <span style="color:#A0A0B0;font-size:12px;margin-left:8px;">' + ccEscapeHtml(ev.detail) + '</span>' : '')
                      + '</div>';
                html += '</div>';
            });
            html += '</div>';
        }
        html += '</div>';

        html += '</div>'; // /detail-grid

        // 录音播放器
        if (r.recording_url) {
            html += '<div class="cc-card" style="margin-top:16px;">';
            html += '<div class="cc-card-header"><div class="cc-card-title">◉ 录音播放</div>';
            html += '<a class="cc-btn cc-btn-outline cc-btn-sm" href="' + ccEscapeHtml(r.recording_url) + '" download data-cc-action="download-recording" data-record-id="' + r.id + '">⬇ 下载录音</a>';
            html += '</div>';
            html += this._renderAudioPlayer(r);
            html += '</div>';
        }

        // 质检记录
        if (qcList.length > 0) {
            html += '<div class="cc-card" style="margin-top:16px;">';
            html += '<div class="cc-card-header"><div class="cc-card-title">✦ 质检记录 <span style="color:#888;font-size:12px;font-weight:400;margin-left:8px;">共 ' + qcList.length + ' 条</span></div></div>';
            html += '<div class="cc-table-wrapper"><table class="cc-table">';
            html += '<thead><tr><th>时间</th><th>类型</th><th>质检员</th><th>总分</th><th>问题数</th><th></th></tr></thead><tbody>';
            qcList.forEach(q => {
                html += '<tr>'
                      + '<td style="font-family:monospace;font-size:12px;color:#A0A0B0;">' + ccFormatDateTime(q.created_at) + '</td>'
                      + '<td>' + (QC_CHECK_TYPE_MAP[q.check_type] || '-') + '</td>'
                      + '<td>' + ccEscapeHtml(q.checker || '-') + '</td>'
                      + '<td style="color:#D4AF37;font-weight:600;">' + (q.total_score || 0) + ' / 100</td>'
                      + '<td>' + ((q.issues || []).length) + '</td>'
                      + '<td style="text-align:right;"><button class="cc-btn cc-btn-outline cc-btn-sm" data-cc-action="view-quality" data-quality-id="' + q.id + '">查看</button></td>'
                      + '</tr>';
            });
            html += '</tbody></table></div></div>';
        }

        return html;
    },

    _row(label, value) {
        const v = value === 0 || value ? value : '-';
        const isHtml = typeof v === 'string' && v.indexOf('<') === 0;
        return '<div style="display:flex;padding:9px 0;border-bottom:1px solid rgba(255,255,255,0.04);">'
             + '<div style="width:100px;color:#888;font-size:12px;letter-spacing:.5px;">' + ccEscapeHtml(label) + '</div>'
             + '<div style="flex:1;color:#fff;font-size:13px;word-break:break-all;">' + (isHtml ? v : ccEscapeHtml(String(v))) + '</div>'
             + '</div>';
    },

    _renderStars(score) {
        const s = parseInt(score, 10) || 0;
        if (!s) return '<span style="color:#666;">未评分</span>';
        let str = '<span class="cc-rate-stars">';
        for (let i = 1; i <= 5; i++) {
            str += i <= s ? '★' : '<span class="cc-rate-empty">★</span>';
        }
        str += ' <span style="color:#A0A0B0;font-size:12px;margin-left:6px;">' + s + ' / 5</span></span>';
        return str;
    },

    _renderAudioPlayer(r) {
        const dur = r.duration || 0;
        const playing = !!this.isPlaying;
        let bars = '';
        for (let i = 0; i < 60; i++) {
            const cls = 'cc-audio-bar' + (playing ? '' : ' cc-paused');
            const h = 20 + Math.floor(Math.random() * 60);
            bars += '<div class="' + cls + '" style="height:' + h + '%;"></div>';
        }
        let html = '<div class="cc-audio-player">';
        html += '<div style="display:flex;justify-content:space-between;align-items:center;font-size:12px;color:#A0A0B0;">';
        html += '<span>录音文件 · ' + ccEscapeHtml(r.recording_url || '-') + '</span>';
        html += '<span style="font-family:monospace;">' + ccFormatFileSize(r.recording_size || 0) + '</span>';
        html += '</div>';
        html += '<div class="cc-audio-waveform">' + bars + '</div>';
        html += '<div class="cc-audio-controls">';
        html += '<button class="cc-audio-btn" data-cc-action="toggle-play">' + (playing ? '⏸' : '▶') + '</button>';
        html += '<div class="cc-audio-progress" data-cc-action="seek-progress"><div class="cc-audio-progress-fill" style="width:' + (playing ? '45%' : '0%') + '"></div></div>';
        html += '<div class="cc-audio-time">' + ccFormatDuration(playing ? Math.floor(dur * 0.45) : 0) + ' / ' + ccFormatDuration(dur) + '</div>';
        html += '</div>';
        html += '</div>';
        return html;
    }
};

/* ========================================================================
   9. 录音管理列表（CCCall 方法补充）
   ======================================================================== */
CCCall.renderRecording = function () {
    let list = CallRecordStorage.getAll().filter(r => r.recording_url);
    const f = this.filters;

    const startTs = ccDateRangeStart(f.dateRange);
    if (startTs > 0) list = list.filter(r => (r.start_time || 0) >= startTs);
    if (f.agentId !== 'all') list = list.filter(r => r.agent_id === f.agentId);
    list.sort((a, b) => (b.start_time || 0) - (a.start_time || 0));

    const totalSize = list.reduce((s, r) => s + (r.recording_size || 0), 0);
    const totalDur = list.reduce((s, r) => s + (r.duration || 0), 0);

    let html = '';

    // 筛选
    html += '<div class="cc-filter-bar">';
    html += '<div class="cc-filter-item"><label>日期范围</label>';
    html += '<select class="cc-form-select" data-cc-filter="dateRange">';
    [['today','今天'], ['week','本周'], ['month','本月'], ['all','全部']].forEach(([v, l]) => {
        html += '<option value="' + v + '"' + (this.filters.dateRange === v ? ' selected' : '') + '>' + l + '</option>';
    });
    html += '</select></div>';

    html += '<div class="cc-filter-item"><label>坐席</label>';
    html += '<select class="cc-form-select" data-cc-filter="agentId">';
    html += '<option value="all"' + (this.filters.agentId === 'all' ? ' selected' : '') + '>全部坐席</option>';
    if (typeof AgentStorage !== 'undefined') {
        AgentStorage.getAll().forEach(a => {
            html += '<option value="' + a.id + '"' + (this.filters.agentId === a.id ? ' selected' : '') + '>' + ccEscapeHtml(a.agent_no + ' ' + a.name) + '</option>';
        });
    }
    html += '</select></div>';

    html += '<div class="cc-filter-item">';
    html += '<button class="cc-btn cc-btn-outline cc-btn-sm" data-cc-action="reset-filters">⟲ 重置</button>';
    html += '</div></div>';

    // 摘要
    html += '<div class="cc-summary-strip">';
    html += this._summaryCell('录音文件数', list.length);
    html += this._summaryCell('总时长', ccFormatDuration(totalDur));
    html += this._summaryCell('总大小', ccFormatFileSize(totalSize));
    html += this._summaryCell('平均时长', list.length ? ccFormatDuration(Math.round(totalDur / list.length)) : '0:00');
    html += '</div>';

    // 列表
    html += '<div class="cc-card">';
    html += '<div class="cc-card-header"><div class="cc-card-title">◉ 录音列表 <span style="color:#888;font-size:12px;font-weight:400;margin-left:8px;">共 ' + list.length + ' 条</span></div></div>';

    if (list.length === 0) {
        html += '<div class="cc-empty"><div class="cc-empty-icon">∅</div><div class="cc-empty-text">未找到录音文件</div></div>';
    } else {
        html += '<div class="cc-table-wrapper"><table class="cc-table">';
        html += '<thead><tr>'
              + '<th style="width:140px;">通话时间</th>'
              + '<th>坐席</th>'
              + '<th>主叫</th>'
              + '<th>被叫</th>'
              + '<th style="width:80px;">时长</th>'
              + '<th style="width:90px;">大小</th>'
              + '<th style="width:240px;text-align:right;">操作</th>'
              + '</tr></thead><tbody>';

        list.slice(0, 100).forEach(r => {
            const isExpanded = (this.expandedRecordingId === r.id);
            html += '<tr>'
                  + '<td style="font-family:monospace;font-size:12px;color:#A0A0B0;">' + ccFormatDateTime(r.start_time) + '</td>'
                  + '<td>' + ccEscapeHtml(r.agent_name || '-') + ' <span style="color:#888;font-size:11px;">' + ccEscapeHtml(r.agent_no || '') + '</span></td>'
                  + '<td style="font-family:monospace;">' + ccEscapeHtml(r.caller_no) + '</td>'
                  + '<td style="font-family:monospace;">' + ccEscapeHtml(r.callee_no) + '</td>'
                  + '<td style="font-family:monospace;color:#D4AF37;">' + ccFormatDuration(r.duration) + '</td>'
                  + '<td style="font-family:monospace;color:#A0A0B0;font-size:12px;">' + ccFormatFileSize(r.recording_size) + '</td>'
                  + '<td style="text-align:right;white-space:nowrap;">'
                  + '<button class="cc-btn cc-btn-outline cc-btn-sm" data-cc-action="toggle-recording" data-record-id="' + r.id + '">' + (isExpanded ? '▼ 收起' : '▶ 播放') + '</button> '
                  + '<button class="cc-btn cc-btn-outline cc-btn-sm" data-cc-action="download-recording" data-record-id="' + r.id + '">⬇ 下载</button> '
                  + '<button class="cc-btn cc-btn-outline cc-btn-sm" data-cc-action="quality-modal" data-record-id="' + r.id + '">质检</button>'
                  + '</td></tr>';
            if (isExpanded) {
                html += '<tr><td colspan="7" class="cc-recording-row-player">' + this._renderAudioPlayer(r) + '</td></tr>';
            }
        });

        html += '</tbody></table></div>';
    }
    html += '</div>';
    return html;
};

/* ========================================================================
   10. 智能质检
   ======================================================================== */
CCCall.renderQuality = function () {
    const subTab = this.qualitySubTab || 'tasks';
    const qcAll = QualityRecordStorage.getAll();

    let html = '';

    // 子Tab
    html += '<div class="cc-sub-tabs">';
    [['tasks','质检任务','◇'], ['results','质检结果','▣'], ['stats','评分统计','∎']].forEach(([k, l, ic]) => {
        html += '<button class="cc-sub-tab' + (subTab === k ? ' active' : '') + '" data-cc-action="quality-sub-tab" data-sub="' + k + '"><span style="margin-right:6px;opacity:.7;">' + ic + '</span>' + l + '</button>';
    });
    html += '</div>';

    if (subTab === 'tasks') {
        html += this._renderQualityTasks(qcAll);
    } else if (subTab === 'results') {
        html += this._renderQualityResults(qcAll);
    } else {
        html += this._renderQualityStats(qcAll);
    }

    return html;
};

CCCall._renderQualityTasks = function (qcAll) {
    const sorted = qcAll.slice().sort((a, b) => (b.created_at || 0) - (a.created_at || 0));

    let html = '';
    html += '<div class="cc-summary-strip">';
    html += this._summaryCell('质检总数', sorted.length);
    html += this._summaryCell('自动质检', sorted.filter(q => q.check_type === 1).length);
    html += this._summaryCell('人工质检', sorted.filter(q => q.check_type === 2).length);
    html += this._summaryCell('平均得分', sorted.length ? Math.round(sorted.reduce((s, q) => s + (q.total_score || 0), 0) / sorted.length) : 0);
    html += '</div>';

    html += '<div class="cc-card">';
    html += '<div class="cc-card-header"><div class="cc-card-title">◇ 质检任务列表 <span style="color:#888;font-size:12px;font-weight:400;margin-left:8px;">共 ' + sorted.length + ' 条</span></div></div>';

    if (sorted.length === 0) {
        html += '<div class="cc-empty"><div class="cc-empty-icon">∅</div><div class="cc-empty-text">暂无质检记录，前往「通话记录」选择通话发起质检</div></div>';
    } else {
        html += '<div class="cc-table-wrapper"><table class="cc-table">';
        html += '<thead><tr>'
              + '<th style="width:140px;">时间</th>'
              + '<th>通话ID</th>'
              + '<th>坐席</th>'
              + '<th style="width:80px;">通话时长</th>'
              + '<th style="width:90px;">质检类型</th>'
              + '<th style="width:90px;">总分</th>'
              + '<th>质检员</th>'
              + '<th style="width:120px;text-align:right;">操作</th>'
              + '</tr></thead><tbody>';

        sorted.slice(0, 100).forEach(q => {
            const r = CallRecordStorage.getById(q.call_id) || {};
            const score = q.total_score || 0;
            const scoreClass = score >= 85 ? 'cc-tag-success' : score >= 70 ? 'cc-tag-warn' : 'cc-tag-fail';
            html += '<tr>'
                  + '<td style="font-family:monospace;font-size:12px;color:#A0A0B0;">' + ccFormatDateTime(q.created_at) + '</td>'
                  + '<td style="font-family:monospace;font-size:12px;color:#A0A0B0;">' + ccEscapeHtml((q.call_id || '').substr(0, 16)) + '...</td>'
                  + '<td>' + ccEscapeHtml(r.agent_name || '-') + '</td>'
                  + '<td style="font-family:monospace;">' + ccFormatDuration(r.duration) + '</td>'
                  + '<td>' + (QC_CHECK_TYPE_MAP[q.check_type] || '-') + '</td>'
                  + '<td><span class="cc-call-tag ' + scoreClass + '">' + score + ' / 100</span></td>'
                  + '<td>' + ccEscapeHtml(q.checker || '-') + '</td>'
                  + '<td style="text-align:right;white-space:nowrap;">'
                  + '<button class="cc-btn cc-btn-outline cc-btn-sm" data-cc-action="view-quality" data-quality-id="' + q.id + '">查看</button> '
                  + '<button class="cc-btn cc-btn-outline cc-btn-sm" data-cc-action="view-detail" data-record-id="' + q.call_id + '">通话</button>'
                  + '</td></tr>';
        });
        html += '</tbody></table></div>';
    }
    html += '</div>';
    return html;
};

CCCall._renderQualityResults = function (qcAll) {
    const qcId = this.selectedQualityId;
    let q = qcId ? qcAll.find(x => x.id === qcId) : null;
    if (!q) q = qcAll.length ? qcAll[qcAll.length - 1] : null;

    let html = '';
    html += '<div class="cc-card" style="margin-bottom:16px;">';
    html += '<div class="cc-card-header"><div class="cc-card-title">▣ 选择质检记录</div></div>';
    html += '<div style="display:flex;gap:8px;flex-wrap:wrap;">';
    if (qcAll.length === 0) {
        html += '<span style="color:#888;font-size:12px;">暂无质检记录</span>';
    } else {
        qcAll.slice().sort((a, b) => (b.created_at || 0) - (a.created_at || 0)).slice(0, 12).forEach(item => {
            const r = CallRecordStorage.getById(item.call_id) || {};
            const isActive = q && q.id === item.id;
            html += '<button class="cc-btn ' + (isActive ? 'cc-btn-primary' : 'cc-btn-outline') + ' cc-btn-sm" data-cc-action="select-quality" data-quality-id="' + item.id + '">'
                  + ccEscapeHtml((r.agent_name || '?'))
                  + ' · ' + (item.total_score || 0) + '分'
                  + '</button>';
        });
    }
    html += '</div></div>';

    if (!q) {
        html += '<div class="cc-empty"><div class="cc-empty-icon">∅</div><div class="cc-empty-text">请先创建质检记录</div></div>';
        return html;
    }

    const r = CallRecordStorage.getById(q.call_id) || {};
    const scores = q.scores || {};

    // 总分大卡
    html += '<div class="cc-card" style="margin-bottom:16px;">';
    html += '<div class="cc-card-header"><div class="cc-card-title">✦ 质检结果 · ' + ccEscapeHtml(r.agent_name || '-') + ' （' + ccFormatDateTime(q.created_at) + '）</div></div>';
    html += '<div style="display:flex;align-items:center;gap:24px;flex-wrap:wrap;">';
    const totalScore = q.total_score || 0;
    const grade = totalScore >= 90 ? 'A' : totalScore >= 80 ? 'B' : totalScore >= 70 ? 'C' : 'D';
    html += '<div style="text-align:center;padding:18px 28px;background:linear-gradient(135deg,#2a1f0c,#1A1A24);border:1px solid rgba(212,175,55,.3);border-radius:8px;">';
    html += '<div style="font-size:42px;font-weight:700;color:#D4AF37;letter-spacing:2px;">' + totalScore + '</div>';
    html += '<div style="font-size:11px;color:#888;margin-top:2px;">/ 100  ·  等级 ' + grade + '</div>';
    html += '</div>';
    html += '<div style="flex:1;min-width:240px;color:#A0A0B0;font-size:12px;line-height:2;">';
    html += '通话ID：<span style="font-family:monospace;color:#fff;">' + ccEscapeHtml(q.call_id) + '</span><br>';
    html += '质检类型：<span style="color:#fff;">' + (QC_CHECK_TYPE_MAP[q.check_type] || '-') + '</span><br>';
    html += '质检员：<span style="color:#fff;">' + ccEscapeHtml(q.checker || '-') + '</span>';
    html += '</div></div></div>';

    // 五维评分
    html += '<div class="cc-card" style="margin-bottom:16px;">';
    html += '<div class="cc-card-header"><div class="cc-card-title">▤ 五维评分</div></div>';
    html += '<div class="cc-quality-scores">';
    QC_DIMENSIONS.forEach(d => {
        const v = scores[d.key] || 0;
        html += '<div class="cc-quality-score-item">'
              + '<div class="cc-quality-score-value">' + v + '</div>'
              + '<div class="cc-quality-score-max">/ ' + d.max + '</div>'
              + '<div class="cc-quality-score-label">' + d.label + '</div>'
              + '</div>';
    });
    html += '</div>';

    // 雷达图（横条对比）
    html += '<div class="cc-quality-radar">';
    QC_DIMENSIONS.forEach(d => {
        const v = scores[d.key] || 0;
        const pct = d.max ? (v / d.max * 100) : 0;
        html += '<div class="cc-radar-row">';
        html += '<div class="cc-radar-label">' + d.label + '</div>';
        html += '<div class="cc-radar-bar"><div class="cc-radar-bar-fill" style="width:' + pct.toFixed(1) + '%;"></div></div>';
        html += '<div class="cc-radar-value">' + v + ' / ' + d.max + '</div>';
        html += '</div>';
    });
    html += '</div>';
    html += '</div>';

    // 问题标注
    html += '<div class="cc-card" style="margin-bottom:16px;">';
    html += '<div class="cc-card-header"><div class="cc-card-title">⚠ 问题标注 <span style="color:#888;font-size:12px;font-weight:400;margin-left:8px;">共 ' + ((q.issues || []).length) + ' 条</span></div></div>';
    if (!q.issues || q.issues.length === 0) {
        html += '<div style="padding:14px;color:#888;font-size:12px;">无问题记录</div>';
    } else {
        html += '<ul style="padding-left:20px;margin:0;color:#ccc;font-size:13px;line-height:2;">';
        q.issues.forEach(it => {
            html += '<li>' + ccEscapeHtml(it) + '</li>';
        });
        html += '</ul>';
    }
    html += '</div>';

    // 关键词命中
    html += '<div class="cc-card" style="margin-bottom:16px;">';
    html += '<div class="cc-card-header"><div class="cc-card-title">⌬ 关键词命中</div></div>';
    if (!q.keywords || q.keywords.length === 0) {
        html += '<div style="padding:6px 0;color:#888;font-size:12px;">未命中关键词</div>';
    } else {
        html += '<div>';
        q.keywords.forEach(k => {
            html += '<span class="cc-keyword-chip active">' + ccEscapeHtml(k) + '</span>';
        });
        html += '</div>';
    }
    html += '</div>';

    // ASR 转写文本
    if (q.asr_text) {
        html += '<div class="cc-card">';
        html += '<div class="cc-card-header"><div class="cc-card-title">⌨ ASR 转写文本</div></div>';
        let asr = ccEscapeHtml(q.asr_text);
        (q.keywords || []).forEach(k => {
            const re = new RegExp(ccEscapeHtml(k).replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g');
            asr = asr.replace(re, '<mark>' + ccEscapeHtml(k) + '</mark>');
        });
        html += '<div class="cc-asr-text">' + asr + '</div>';
        html += '</div>';
    }

    return html;
};

CCCall._renderQualityStats = function (qcAll) {
    let html = '';

    if (qcAll.length === 0) {
        html += '<div class="cc-empty"><div class="cc-empty-icon">∅</div><div class="cc-empty-text">暂无评分数据</div></div>';
        return html;
    }

    const sumByDim = {};
    QC_DIMENSIONS.forEach(d => sumByDim[d.key] = 0);
    qcAll.forEach(q => {
        QC_DIMENSIONS.forEach(d => {
            sumByDim[d.key] += (q.scores && q.scores[d.key]) || 0;
        });
    });

    html += '<div class="cc-card" style="margin-bottom:16px;">';
    html += '<div class="cc-card-header"><div class="cc-card-title">∎ 维度平均得分</div></div>';
    html += '<div class="cc-quality-radar">';
    QC_DIMENSIONS.forEach(d => {
        const avg = sumByDim[d.key] / qcAll.length;
        const pct = d.max ? (avg / d.max * 100) : 0;
        html += '<div class="cc-radar-row">';
        html += '<div class="cc-radar-label">' + d.label + '</div>';
        html += '<div class="cc-radar-bar"><div class="cc-radar-bar-fill" style="width:' + pct.toFixed(1) + '%;"></div></div>';
        html += '<div class="cc-radar-value">' + avg.toFixed(1) + ' / ' + d.max + '</div>';
        html += '</div>';
    });
    html += '</div></div>';

    const byAgent = {};
    qcAll.forEach(q => {
        const r = CallRecordStorage.getById(q.call_id);
        if (!r || !r.agent_id) return;
        if (!byAgent[r.agent_id]) byAgent[r.agent_id] = { name: r.agent_name, agent_no: r.agent_no, total: 0, count: 0 };
        byAgent[r.agent_id].total += (q.total_score || 0);
        byAgent[r.agent_id].count += 1;
    });
    const ranking = Object.values(byAgent).map(x => ({
        name: x.name, agent_no: x.agent_no, count: x.count,
        avg: x.count ? Math.round(x.total / x.count) : 0
    })).sort((a, b) => b.avg - a.avg);

    html += '<div class="cc-card">';
    html += '<div class="cc-card-header"><div class="cc-card-title">◆ 坐席质检排名</div></div>';
    html += '<div class="cc-table-wrapper"><table class="cc-table">';
    html += '<thead><tr><th style="width:60px;">排名</th><th>坐席</th><th>工号</th><th style="width:120px;">质检次数</th><th style="width:120px;">平均分</th><th>评级</th></tr></thead><tbody>';
    ranking.forEach((r, i) => {
        const grade = r.avg >= 90 ? 'A' : r.avg >= 80 ? 'B' : r.avg >= 70 ? 'C' : 'D';
        const gradeCss = r.avg >= 80 ? 'cc-tag-success' : r.avg >= 70 ? 'cc-tag-warn' : 'cc-tag-fail';
        const medal = i === 0 ? '①' : i === 1 ? '②' : i === 2 ? '③' : ('#' + (i + 1));
        html += '<tr>'
              + '<td style="text-align:center;font-weight:600;color:#D4AF37;">' + medal + '</td>'
              + '<td>' + ccEscapeHtml(r.name || '-') + '</td>'
              + '<td style="color:#D4AF37;font-family:monospace;">' + ccEscapeHtml(r.agent_no || '-') + '</td>'
              + '<td>' + r.count + '</td>'
              + '<td style="color:#D4AF37;font-weight:600;">' + r.avg + '</td>'
              + '<td><span class="cc-call-tag ' + gradeCss + '">' + grade + '</span></td>'
              + '</tr>';
    });
    html += '</tbody></table></div></div>';

    return html;
};

/* ========================================================================
   11. 事件处理
   ======================================================================== */
CCCall.handleEvents = function (e) {
    const actionEl = e.target.closest('[data-cc-action]');
    if (!actionEl || !this.container.contains(actionEl)) return;
    const action = actionEl.dataset.ccAction;
    const recordId = actionEl.dataset.recordId;
    const qualityId = actionEl.dataset.qualityId;

    switch (action) {
        case 'switch-view':
            this.currentView = actionEl.dataset.view;
            this.selectedRecordId = null;
            this.expandedRecordingId = null;
            this.isPlaying = false;
            this.currentPage = 1;
            this.render();
            break;
        case 'view-detail':
            this.selectedRecordId = recordId;
            this.currentView = 'detail';
            this.isPlaying = false;
            this.render();
            break;
        case 'back-to-records':
            this.currentView = 'records';
            this.selectedRecordId = null;
            this.isPlaying = false;
            this.render();
            break;
        case 'refresh':
            this.refresh();
            ccShowToast('已刷新', 'success');
            break;
        case 'reset-filters':
            this.filters = { dateRange: 'today', callType: 'all', status: 'all', agentId: 'all', durationMin: '', durationMax: '', keyword: '' };
            this.currentPage = 1;
            this.refresh();
            break;
        case 'page': {
            const p = actionEl.dataset.page;
            const totalPages = Math.max(1, Math.ceil(this._getFilteredRecords().length / this.pageSize));
            if (p === 'prev') this.currentPage = Math.max(1, this.currentPage - 1);
            else if (p === 'next') this.currentPage = Math.min(totalPages, this.currentPage + 1);
            else this.currentPage = parseInt(p, 10) || 1;
            this.refresh();
            break;
        }
        case 'toggle-recording':
            this.expandedRecordingId = (this.expandedRecordingId === recordId) ? null : recordId;
            this.isPlaying = !!this.expandedRecordingId;
            this.refresh();
            break;
        case 'toggle-play':
            this.isPlaying = !this.isPlaying;
            this.refresh();
            break;
        case 'download-recording': {
            const r = CallRecordStorage.getById(recordId);
            ccShowToast(r ? ('开始下载录音：' + (r.recording_url || '-')) : '录音不存在', r ? 'success' : 'error');
            break;
        }
        case 'quality-modal':
            this.showQualityModal(recordId);
            break;
        case 'quality-sub-tab':
            this.qualitySubTab = actionEl.dataset.sub;
            this.refresh();
            break;
        case 'select-quality':
            this.selectedQualityId = qualityId;
            this.refresh();
            break;
        case 'view-quality':
            this.currentView = 'quality';
            this.qualitySubTab = 'results';
            this.selectedQualityId = qualityId;
            this.render();
            break;
        case 'seek-progress':
            ccShowToast('已跳转播放位置（模拟）', 'success');
            break;
        default:
            break;
    }
};

CCCall._onChange = function (e) {
    const el = e.target.closest('[data-cc-filter]');
    if (!el || !this.container.contains(el)) return;
    const key = el.dataset.ccFilter;
    if (!(key in this.filters)) return;
    this.filters[key] = el.value;
    this.currentPage = 1;
    this.refresh();
};

CCCall._onInput = function (e) {
    const el = e.target.closest('[data-cc-filter]');
    if (!el || !this.container.contains(el)) return;
    const key = el.dataset.ccFilter;
    if (key !== 'keyword' && key !== 'durationMin' && key !== 'durationMax') return;
    this.filters[key] = el.value;
    this.currentPage = 1;
    const body = this.container.querySelector('[data-cc-call-body]');
    if (!body) return;
    const focused = document.activeElement;
    const focusKey = (focused && focused.dataset && focused.dataset.ccFilter) ? focused.dataset.ccFilter : null;
    const cursor = focused && focused.selectionStart != null ? focused.selectionStart : null;
    if (this.currentView === 'records') body.innerHTML = this.renderRecordList();
    else if (this.currentView === 'recording') body.innerHTML = this.renderRecording();
    if (focusKey) {
        const newEl = body.querySelector('[data-cc-filter="' + focusKey + '"]');
        if (newEl) {
            newEl.focus();
            try { if (cursor != null) newEl.setSelectionRange(cursor, cursor); } catch (err) {}
        }
    }
};

/* ========================================================================
   12. 模态框 - 质检评分
   ======================================================================== */
CCCall.showQualityModal = function (callId) {
    const r = CallRecordStorage.getById(callId);
    if (!r) {
        ccShowToast('通话记录不存在', 'error');
        return;
    }

    ccCloseModal();
    const overlay = document.createElement('div');
    overlay.className = 'cc-modal-overlay';
    overlay.dataset.modal = 'quality-form';
    overlay.dataset.callId = callId;

    let body = '';
    body += '<div class="cc-modal" style="max-width:680px;">';
    body += '<div class="cc-modal-header">';
    body += '<div class="cc-modal-title">✦ 提交质检评分</div>';
    body += '<button class="cc-modal-close" data-cc-modal-action="close-modal">×</button>';
    body += '</div>';
    body += '<div class="cc-modal-body">';

    body += '<div style="margin-bottom:16px;padding:12px 14px;background:#0f0f17;border:1px solid rgba(212,175,55,.15);border-radius:8px;">';
    body += '<div style="font-size:12px;color:#888;margin-bottom:4px;">通话信息</div>';
    body += '<div style="font-size:13px;color:#fff;">' + ccEscapeHtml(r.caller_no) + ' → ' + ccEscapeHtml(r.callee_no)
          + ' · ' + ccEscapeHtml(r.agent_name || '-')
          + ' · 时长 ' + ccFormatDuration(r.duration)
          + ' · ' + ccFormatDateTime(r.start_time) + '</div>';
    body += '</div>';

    body += '<div class="cc-form-group">';
    body += '<label class="cc-form-label">质检类型</label>';
    body += '<select class="cc-form-select" data-cc-qc-field="check_type">';
    Object.keys(QC_CHECK_TYPE_MAP).forEach(k => {
        body += '<option value="' + k + '">' + QC_CHECK_TYPE_MAP[k] + '</option>';
    });
    body += '</select></div>';

    body += '<div style="margin:14px 0 6px;font-size:12px;color:#A0A0B0;letter-spacing:.5px;">维度评分</div>';
    QC_DIMENSIONS.forEach(d => {
        const init = Math.floor(d.max * 0.85);
        body += '<div style="display:flex;align-items:center;gap:14px;padding:10px 12px;margin-bottom:6px;background:#0f0f17;border:1px solid rgba(212,175,55,.08);border-radius:8px;">';
        body += '<div style="width:96px;font-size:12px;color:#fff;">' + d.label + '</div>';
        body += '<input type="range" class="cc-slider" min="0" max="' + d.max + '" value="' + init + '" data-cc-qc-score="' + d.key + '" data-max="' + d.max + '" style="flex:1;">';
        body += '<div style="width:90px;text-align:right;font-family:monospace;color:#D4AF37;font-size:13px;font-weight:600;" data-cc-qc-display="' + d.key + '">' + init + ' / ' + d.max + '</div>';
        body += '</div>';
    });

    body += '<div style="display:flex;justify-content:space-between;align-items:center;padding:10px 14px;margin:8px 0 14px;background:linear-gradient(135deg,#221704,#1A1A24);border:1px solid rgba(212,175,55,.3);border-radius:8px;">';
    body += '<span style="font-size:12px;color:#A0A0B0;letter-spacing:1px;">综合总分</span>';
    body += '<span style="font-size:24px;font-weight:700;color:#D4AF37;font-family:monospace;" data-cc-qc-total>0 / 100</span>';
    body += '</div>';

    body += '<div class="cc-form-group">';
    body += '<label class="cc-form-label">关键词命中（多选）</label>';
    body += '<div data-cc-qc-keywords>';
    QC_KEYWORDS_POOL.forEach(k => {
        body += '<span class="cc-keyword-chip" data-cc-qc-keyword="' + ccEscapeHtml(k) + '">' + ccEscapeHtml(k) + '</span>';
    });
    body += '</div></div>';

    body += '<div class="cc-form-group">';
    body += '<label class="cc-form-label">问题描述（每行一条）</label>';
    body += '<textarea class="cc-form-textarea" rows="4" data-cc-qc-field="issues" placeholder="请输入问题描述，每行一条..."></textarea>';
    body += '</div>';

    body += '<div class="cc-form-group">';
    body += '<label class="cc-form-label">质检员</label>';
    body += '<input class="cc-form-input" type="text" data-cc-qc-field="checker" value="admin" placeholder="输入质检员姓名">';
    body += '</div>';

    body += '</div>';
    body += '<div class="cc-modal-footer">';
    body += '<button class="cc-btn cc-btn-outline" data-cc-modal-action="close-modal">取消</button>';
    body += '<button class="cc-btn cc-btn-primary" data-cc-modal-action="submit-quality">保存质检</button>';
    body += '</div>';
    body += '</div>';

    overlay.innerHTML = body;
    document.body.appendChild(overlay);

    this._updateQualityTotal(overlay);
};

CCCall._updateQualityTotal = function (overlay) {
    const sliders = overlay.querySelectorAll('[data-cc-qc-score]');
    let total = 0;
    sliders.forEach(s => {
        total += parseInt(s.value, 10) || 0;
        const key = s.dataset.ccQcScore;
        const max = s.dataset.max;
        const dispEl = overlay.querySelector('[data-cc-qc-display="' + key + '"]');
        if (dispEl) dispEl.textContent = s.value + ' / ' + max;
    });
    const totalEl = overlay.querySelector('[data-cc-qc-total]');
    if (totalEl) totalEl.textContent = total + ' / 100';
};

CCCall._onModalEvent = function (e) {
    const overlay = e.target.closest('.cc-modal-overlay[data-modal="quality-form"]');
    if (!overlay) return;

    if (e.type === 'click') {
        if (e.target === overlay) { ccCloseModal(); return; }

        const chip = e.target.closest('[data-cc-qc-keyword]');
        if (chip) {
            chip.classList.toggle('active');
            return;
        }

        const actionEl = e.target.closest('[data-cc-modal-action]');
        if (!actionEl) return;
        const act = actionEl.dataset.ccModalAction;
        if (act === 'close-modal') {
            ccCloseModal();
        } else if (act === 'submit-quality') {
            this._submitQualityForm(overlay);
        }
    } else if (e.type === 'input' || e.type === 'change') {
        if (e.target.matches('[data-cc-qc-score]')) {
            this._updateQualityTotal(overlay);
        }
    }
};

CCCall._submitQualityForm = function (overlay) {
    const callId = overlay.dataset.callId;
    if (!callId) { ccShowToast('参数错误', 'error'); return; }

    const checkType = parseInt(overlay.querySelector('[data-cc-qc-field="check_type"]').value, 10) || 1;
    const checker = (overlay.querySelector('[data-cc-qc-field="checker"]').value || '').trim() || 'admin';
    const issuesText = (overlay.querySelector('[data-cc-qc-field="issues"]').value || '').trim();
    const issues = issuesText ? issuesText.split(/\r?\n/).map(s => s.trim()).filter(Boolean) : [];

    const scores = {};
    let total = 0;
    overlay.querySelectorAll('[data-cc-qc-score]').forEach(s => {
        const v = parseInt(s.value, 10) || 0;
        scores[s.dataset.ccQcScore] = v;
        total += v;
    });

    const keywords = [];
    overlay.querySelectorAll('[data-cc-qc-keyword].active').forEach(c => {
        keywords.push(c.dataset.ccQcKeyword);
    });

    QualityRecordStorage.add({
        call_id: callId,
        check_type: checkType,
        checker: checker,
        scores: scores,
        total_score: total,
        issues: issues,
        keywords: keywords,
        asr_text: ''
    });

    ccCloseModal();
    ccShowToast('质检记录已保存（总分 ' + total + '）', 'success');
    this.refresh();
};

/* ========================================================================
   13. 种子数据
   ======================================================================== */
CCCall.initSeedData = function () {
    if (CallRecordStorage.getAll().length > 0) return;

    const agents = (typeof AgentStorage !== 'undefined') ? AgentStorage.getAll() : [];
    if (agents.length === 0) return;

    const phones = ['13812345678', '13987654321', '15012348888', '13601234567', '13988889999', '13511112222', '17712340000', '18000000001', '18712345678', '17600001234', '13399887766', '15533445566'];
    const tagsPool = ['咨询,产品', '投诉,VIP', '售后,紧急', '回访', '签约,商务', '一般咨询', 'VIP通道', '催收', '回拨'];
    const remarkPool = [
        '客户咨询产品功能，已发送资料',
        '客户投诉物流问题，已转交售后处理',
        '回访客户使用情况，反馈良好',
        '客户希望了解最新优惠活动',
        '客户表示稍后再联系',
        '电话占线，未接通',
        '客户反映系统登录异常',
        '已为客户开通VIP权限',
        '客户对服务表示满意',
        '需要技术专家二次跟进'
    ];
    const hangupReasonPool = ['正常结束', '客户主动挂断', '坐席结束通话', '网络中断', '客户长时间无应答'];

    const records = [];
    const events = [];
    const now = Date.now();
    const recordCount = 38;

    for (let i = 0; i < recordCount; i++) {
        const agent = ccRandPick(agents);
        const callType = ccRandPick([1, 1, 1, 2, 2, 3]);
        const isAnswered = Math.random() > 0.18;
        const status = isAnswered ? 1 : 2;

        const startOffset = Math.floor(Math.random() * 7 * 86400000);
        const startTime = now - startOffset;
        const ringDur = 3 + Math.floor(Math.random() * 12);
        const queueDur = callType === 1 ? Math.floor(Math.random() * 30) : 0;
        const duration = isAnswered ? (30 + Math.floor(Math.random() * 1770)) : 0;
        const afterDur = isAnswered ? Math.floor(Math.random() * 60) : 0;
        const endTime = startTime + (ringDur + queueDur + duration + afterDur) * 1000;
        const hasRecording = isAnswered && Math.random() > 0.15;

        const callerNo = callType === 1 ? ccRandPick(phones) : agent.extension;
        const calleeNo = callType === 1 ? agent.extension : ccRandPick(phones);

        const record = {
            id: ccGenerateId('call_'),
            call_type: callType,
            status: status,
            caller_no: callerNo,
            callee_no: calleeNo,
            agent_id: agent.id,
            agent_no: agent.agent_no,
            agent_name: agent.name,
            customer_id: 'cust_' + Math.floor(Math.random() * 1000),
            duration: duration,
            ring_duration: ringDur,
            queue_duration: queueDur,
            after_duration: afterDur,
            start_time: startTime,
            end_time: endTime,
            hangup_by: isAnswered ? ccRandPick([1, 2, 2]) : 3,
            hangup_reason: isAnswered ? ccRandPick(hangupReasonPool) : '客户长时间无应答',
            tags: ccRandPick(tagsPool),
            remark: ccRandPick(remarkPool),
            satisfaction: isAnswered ? ccRandPick([0, 3, 4, 4, 5, 5, 5]) : 0,
            recording_url: hasRecording ? ('/recordings/' + new Date(startTime).getFullYear() + '/' + agent.agent_no + '_' + startTime + '.mp3') : '',
            recording_size: hasRecording ? Math.floor(duration * 16 * 1024) : 0,
            asr_text: '',
            created_at: startTime
        };
        records.push(record);
        CallRecordStorage.add(record);

        events.push({ call_id: record.id, event_type: 'RING', event_at: startTime, detail: '振铃 ' + ringDur + 's' });
        if (isAnswered) {
            const answerTs = startTime + (ringDur + queueDur) * 1000;
            events.push({ call_id: record.id, event_type: 'ANSWER', event_at: answerTs, detail: '坐席接听' });

            const midCount = Math.floor(Math.random() * 3);
            let cursor = answerTs + Math.floor(duration * 1000 * 0.2);
            for (let j = 0; j < midCount; j++) {
                const evtType = ccRandPick(['HOLD', 'RESUME', 'TRANSFER', 'MUTE', 'UNMUTE']);
                events.push({ call_id: record.id, event_type: evtType, event_at: cursor, detail: '' });
                cursor += Math.floor(duration * 1000 / (midCount + 1));
            }

            events.push({ call_id: record.id, event_type: 'HANGUP', event_at: endTime, detail: '由' + (HANGUP_BY_MAP[record.hangup_by] || '系统') + '挂断' });
        } else {
            events.push({ call_id: record.id, event_type: 'HANGUP', event_at: endTime, detail: '未接通自动挂断' });
        }
    }

    events.forEach(ev => CallEventStorage.add(ev));

    // 质检记录
    const answered = records.filter(r => r.status === 1 && r.recording_url);
    const qcCount = Math.min(7, answered.length);
    for (let i = 0; i < qcCount; i++) {
        const target = answered[i];
        const scores = {};
        let total = 0;
        QC_DIMENSIONS.forEach(d => {
            const v = Math.floor(d.max * (0.6 + Math.random() * 0.4));
            scores[d.key] = v;
            total += v;
        });

        const issueCount = Math.floor(Math.random() * 3);
        const issues = [];
        const usedIssues = QC_ISSUE_POOL.slice();
        for (let k = 0; k < issueCount; k++) {
            const idx = Math.floor(Math.random() * usedIssues.length);
            issues.push(usedIssues.splice(idx, 1)[0]);
        }

        const kwCount = 2 + Math.floor(Math.random() * 3);
        const keywords = [];
        const usedKw = QC_KEYWORDS_POOL.slice();
        for (let k = 0; k < kwCount; k++) {
            const idx = Math.floor(Math.random() * usedKw.length);
            keywords.push(usedKw.splice(idx, 1)[0]);
        }

        const asrSnippets = [
            '您好，' + target.agent_name + '为您服务，请问有什么可以帮您？',
            '好的，请稍等，我帮您查询一下相关信息。',
            '您反馈的问题已记录，将为您处理，请稍后回复。',
            '尊敬的客户，感谢您的来电，请问还有其他问题吗？',
            '已为您安排专员跟进，预计24小时内联系您。'
        ];

        QualityRecordStorage.add({
            call_id: target.id,
            check_type: i % 2 === 0 ? 1 : 2,
            checker: i % 2 === 0 ? 'AI质检' : ccRandPick(['admin', '王主管', '李经理']),
            scores: scores,
            total_score: total,
            issues: issues,
            keywords: keywords,
            asr_text: asrSnippets.slice(0, 3 + Math.floor(Math.random() * 2)).join(' '),
            created_at: target.end_time + 3600000
        });
    }
};

/* ========================================================================
   14. 暴露到全局
   ======================================================================== */
if (typeof window !== 'undefined') {
    window.CCCall = CCCall;
    window.CallRecordStorage = CallRecordStorage;
    window.CallEventStorage = CallEventStorage;
    window.QualityRecordStorage = QualityRecordStorage;
    window.CC_CALL_KEYS = CC_CALL_KEYS;
    window.CALL_TYPE_MAP = CALL_TYPE_MAP;
    window.CALL_STATUS_MAP = CALL_STATUS_MAP;
    window.HANGUP_BY_MAP = HANGUP_BY_MAP;
    window.CALL_EVENT_TYPES = CALL_EVENT_TYPES;
    window.QC_CHECK_TYPE_MAP = QC_CHECK_TYPE_MAP;
    window.ccFormatDuration = ccFormatDuration;
}
