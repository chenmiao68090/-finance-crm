/**
 * 呼叫中心核心模块 - cc-core.js
 * 包含：坐席工作台、坐席档案管理、状态机、状态日志
 * 数据存储：localStorage（cc_agents / cc_agent_status_logs）
 * UI风格：黑金奢华主题（cc-style.css）
 */

/* ========================================================================
   1. 常量定义
   ======================================================================== */
const CC_KEYS = {
    AGENTS: 'cc_agents',
    AGENT_STATUS_LOGS: 'cc_agent_status_logs'
};

const AGENT_STATUS = {
    OFFLINE: 0,
    READY: 1,
    TALKING: 2,
    BREAK: 3,
    AFTER_PROC: 4,
    TRAINING: 5,
    MEETING: 6
};

const AGENT_STATUS_MAP = {
    0: { label: '离线', css: 'cc-status-offline', icon: '○' },
    1: { label: '就绪', css: 'cc-status-online', icon: '●' },
    2: { label: '通话中', css: 'cc-status-busy', icon: '◉' },
    3: { label: '小休', css: 'cc-status-break', icon: '◐' },
    4: { label: '后处理', css: 'cc-status-busy', icon: '◑' },
    5: { label: '培训', css: 'cc-status-break', icon: '◔' },
    6: { label: '会议', css: 'cc-status-break', icon: '◕' }
};

const AGENT_LEVEL_MAP = {
    1: '初级',
    2: '中级',
    3: '高级',
    4: '专家'
};

// 状态转换合法性矩阵：from -> [allowed to states]
const AGENT_STATUS_TRANSITIONS = {
    0: [1],                    // 离线 -> 就绪
    1: [2, 3, 5, 6, 0],        // 就绪 -> 通话中/小休/培训/会议/离线
    2: [4, 1],                 // 通话中 -> 后处理/就绪
    3: [1],                    // 小休 -> 就绪
    4: [1],                    // 后处理 -> 就绪
    5: [1],                    // 培训 -> 就绪
    6: [1]                     // 会议 -> 就绪
};

/* ========================================================================
   2. 工具函数
   ======================================================================== */
function ccGenerateId(prefix) {
    return prefix + Date.now() + '_' + Math.random().toString(36).substr(2, 6);
}

function ccShowToast(msg, type) {
    type = type || 'success';
    const toast = document.createElement('div');
    toast.className = 'cc-toast cc-toast-' + type;
    toast.textContent = msg;
    document.body.appendChild(toast);
    setTimeout(() => {
        toast.style.transition = 'opacity 0.3s, transform 0.3s';
        toast.style.opacity = '0';
        toast.style.transform = 'translateX(20px)';
        setTimeout(() => toast.remove(), 300);
    }, 2700);
}

function ccEscapeHtml(str) {
    if (str == null) return '';
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

function ccFormatDateTime(ts) {
    if (!ts) return '-';
    const d = new Date(ts);
    const pad = (n) => (n < 10 ? '0' + n : '' + n);
    return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()) +
        ' ' + pad(d.getHours()) + ':' + pad(d.getMinutes()) + ':' + pad(d.getSeconds());
}

function ccConfirm(msg) {
    return window.confirm(msg);
}

function ccCloseModal() {
    const overlay = document.querySelector('.cc-modal-overlay');
    if (overlay) overlay.remove();
}

/* ========================================================================
   3. AgentStorage —— 坐席数据存储层
   ======================================================================== */
const AgentStorage = {
    getAll() {
        try {
            const raw = localStorage.getItem(CC_KEYS.AGENTS);
            const list = raw ? JSON.parse(raw) : [];
            return list.filter(a => !a.deleted);
        } catch (e) {
            console.error('[AgentStorage.getAll]', e);
            return [];
        }
    },

    _getAllRaw() {
        try {
            const raw = localStorage.getItem(CC_KEYS.AGENTS);
            return raw ? JSON.parse(raw) : [];
        } catch (e) {
            return [];
        }
    },

    _saveAll(list) {
        localStorage.setItem(CC_KEYS.AGENTS, JSON.stringify(list));
    },

    getById(id) {
        return this.getAll().find(a => a.id === id) || null;
    },

    add(agent) {
        const list = this._getAllRaw();
        agent.id = agent.id || ccGenerateId('agent_');
        agent.created_at = Date.now();
        agent.updated_at = Date.now();
        agent.deleted = false;
        if (agent.status == null) agent.status = AGENT_STATUS.OFFLINE;
        if (agent.today_calls == null) agent.today_calls = 0;
        list.push(agent);
        this._saveAll(list);
        return agent;
    },

    update(agent) {
        const list = this._getAllRaw();
        const idx = list.findIndex(a => a.id === agent.id);
        if (idx === -1) return null;
        agent.updated_at = Date.now();
        list[idx] = Object.assign({}, list[idx], agent);
        this._saveAll(list);
        return list[idx];
    },

    delete(id) {
        const list = this._getAllRaw();
        const idx = list.findIndex(a => a.id === id);
        if (idx === -1) return false;
        list[idx].deleted = true;
        list[idx].updated_at = Date.now();
        this._saveAll(list);
        return true;
    },

    isAgentNoExist(agentNo, excludeId) {
        return this.getAll().some(a => a.agent_no === agentNo && a.id !== excludeId);
    },

    isExtensionExist(ext, excludeId) {
        return this.getAll().some(a => a.extension === ext && a.id !== excludeId);
    }
};

/* ========================================================================
   4. AgentStatusLogStorage —— 坐席状态变更日志
   ======================================================================== */
const AgentStatusLogStorage = {
    _getAll() {
        try {
            const raw = localStorage.getItem(CC_KEYS.AGENT_STATUS_LOGS);
            return raw ? JSON.parse(raw) : [];
        } catch (e) {
            return [];
        }
    },

    _saveAll(list) {
        localStorage.setItem(CC_KEYS.AGENT_STATUS_LOGS, JSON.stringify(list));
    },

    add(log) {
        const list = this._getAll();
        log.id = log.id || ccGenerateId('alog_');
        log.created_at = Date.now();
        list.push(log);
        // 仅保留最近2000条，避免localStorage膨胀
        if (list.length > 2000) list.splice(0, list.length - 2000);
        this._saveAll(list);
        return log;
    },

    getByAgentId(agentId) {
        return this._getAll()
            .filter(l => l.agent_id === agentId)
            .sort((a, b) => b.created_at - a.created_at);
    },

    getAll() {
        return this._getAll().sort((a, b) => b.created_at - a.created_at);
    }
};

/* ========================================================================
   5. CallCenter —— 主对象
   ======================================================================== */
const CallCenter = {
    container: null,
    currentTab: 'dashboard',         // dashboard | agents
    currentAgentView: 'list',        // list | detail
    selectedAgentId: null,
    searchKeyword: '',
    statusFilter: 'all',
    eventHandlers: [],
    _delegateHandler: null,

    /* ---------- 生命周期 ---------- */
    init() {
        this.container = document.querySelector('.content-area') || document.querySelector('#content-area') || document.body;
        this.initSeedData();
        // 初始化所有子模块的种子数据，确保Tab切换时数据可用
        try { if (typeof CCNumber !== 'undefined' && CCNumber.initSeedData) CCNumber.initSeedData(); } catch (e) { console.warn('[CC] CCNumber initSeedData failed:', e); }
        try { if (typeof CCIvr !== 'undefined' && CCIvr.initSeedData) CCIvr.initSeedData(); } catch (e) { console.warn('[CC] CCIvr initSeedData failed:', e); }
        try { if (typeof CCSkill !== 'undefined' && CCSkill.initSeedData) CCSkill.initSeedData(); } catch (e) { console.warn('[CC] CCSkill initSeedData failed:', e); }
        try { if (typeof CCCall !== 'undefined' && CCCall.initSeedData) CCCall.initSeedData(); } catch (e) { console.warn('[CC] CCCall initSeedData failed:', e); }
        try { if (typeof CCOutbound !== 'undefined' && CCOutbound.initSeedData) CCOutbound.initSeedData(); } catch (e) { console.warn('[CC] CCOutbound initSeedData failed:', e); }
        try { if (typeof CCMonitor !== 'undefined' && CCMonitor.initSeedData) CCMonitor.initSeedData(); } catch (e) { console.warn('[CC] CCMonitor initSeedData failed:', e); }
        this.render();
    },

    destroy() {
        this.eventHandlers.forEach(h => {
            if (h.el && h.fn) h.el.removeEventListener(h.evt, h.fn);
        });
        this.eventHandlers = [];
        ccCloseModal();
    },

    addEvent(el, evt, fn) {
        el.addEventListener(evt, fn);
        this.eventHandlers.push({ el, evt, fn });
    },

    /* ---------- 种子数据 ---------- */
    initSeedData() {
        const existing = AgentStorage.getAll();
        if (existing.length > 0) return;

        const seed = [
            { agent_no: 'A001', name: '张伟',   extension: '8001', sip_username: 'sip8001', sip_password: 'pwd8001', webrtc_endpoint: 'wss://rtc.demo.local/ws', skillgroup_ids: '客服一组,VIP通道', languages: '中文,英文', level: 3, max_concurrent: 3, daily_call_limit: 200, status: AGENT_STATUS.READY,     today_calls: 18 },
            { agent_no: 'A002', name: '李娜',   extension: '8002', sip_username: 'sip8002', sip_password: 'pwd8002', webrtc_endpoint: 'wss://rtc.demo.local/ws', skillgroup_ids: '客服一组',           languages: '中文',     level: 2, max_concurrent: 2, daily_call_limit: 180, status: AGENT_STATUS.TALKING,   today_calls: 22 },
            { agent_no: 'A003', name: '王磊',   extension: '8003', sip_username: 'sip8003', sip_password: 'pwd8003', webrtc_endpoint: 'wss://rtc.demo.local/ws', skillgroup_ids: '客服二组',           languages: '中文',     level: 1, max_concurrent: 1, daily_call_limit: 150, status: AGENT_STATUS.BREAK,     today_calls: 12 },
            { agent_no: 'A004', name: '赵敏',   extension: '8004', sip_username: 'sip8004', sip_password: 'pwd8004', webrtc_endpoint: 'wss://rtc.demo.local/ws', skillgroup_ids: 'VIP通道',            languages: '中文,粤语', level: 4, max_concurrent: 4, daily_call_limit: 220, status: AGENT_STATUS.READY,     today_calls: 31 },
            { agent_no: 'A005', name: '陈晨',   extension: '8005', sip_username: 'sip8005', sip_password: 'pwd8005', webrtc_endpoint: 'wss://rtc.demo.local/ws', skillgroup_ids: '客服一组',           languages: '中文',     level: 2, max_concurrent: 2, daily_call_limit: 180, status: AGENT_STATUS.AFTER_PROC, today_calls: 16 },
            { agent_no: 'A006', name: '刘洋',   extension: '8006', sip_username: 'sip8006', sip_password: 'pwd8006', webrtc_endpoint: 'wss://rtc.demo.local/ws', skillgroup_ids: '外呼组',             languages: '中文',     level: 1, max_concurrent: 1, daily_call_limit: 160, status: AGENT_STATUS.OFFLINE,   today_calls: 0  },
            { agent_no: 'A007', name: '孙婷',   extension: '8007', sip_username: 'sip8007', sip_password: 'pwd8007', webrtc_endpoint: 'wss://rtc.demo.local/ws', skillgroup_ids: '客服二组,外呼组',     languages: '中文,英文', level: 3, max_concurrent: 3, daily_call_limit: 200, status: AGENT_STATUS.TRAINING,  today_calls: 8  },
            { agent_no: 'A008', name: '周杰',   extension: '8008', sip_username: 'sip8008', sip_password: 'pwd8008', webrtc_endpoint: 'wss://rtc.demo.local/ws', skillgroup_ids: 'VIP通道',            languages: '中文',     level: 4, max_concurrent: 4, daily_call_limit: 220, status: AGENT_STATUS.MEETING,   today_calls: 14 }
        ];

        seed.forEach(s => AgentStorage.add(s));

        // 给每个坐席生成一条初始状态日志
        AgentStorage.getAll().forEach(a => {
            AgentStatusLogStorage.add({
                agent_id: a.id,
                agent_no: a.agent_no,
                agent_name: a.name,
                from_status: AGENT_STATUS.OFFLINE,
                to_status: a.status,
                reason: '系统初始化',
                operator: 'system'
            });
        });
    },

    /* ---------- 顶层渲染 ---------- */
    render() {
        if (!this.container) return;

        const tabs = [
            { key: 'dashboard', label: '坐席工作台', icon: '◆' },
            { key: 'agents',    label: '坐席档案',   icon: '◇' },
            { key: 'numbers',   label: '号码管理',   icon: '☎' },
            { key: 'trunks',    label: 'SIP中继',     icon: '⇄' },
            { key: 'ivr',       label: 'IVR设计器',   icon: '⌘' },
            { key: 'skills',    label: '技能组',     icon: '⌬' },
            { key: 'calls',     label: '通话记录',   icon: '⌕' },
            { key: 'outbound',  label: '外呼任务',   icon: '⤴' },
            { key: 'monitor',   label: '实时监控',   icon: '◉' },
            { key: 'reports',   label: '报表分析',   icon: '∎' }
        ];

        let html = '<div class="cc-module">';
        html += '<div class="cc-page-header">';
        html += '<h2 class="cc-page-title">呼叫中心</h2>';
        html += '<div class="cc-page-meta" style="color:var(--cc-text-secondary);font-size:12px;letter-spacing:.5px;">CALL CENTER · CONTROL PANEL</div>';
        html += '</div>';

        html += '<div class="cc-tabs">';
        tabs.forEach(t => {
            const active = (t.key === this.currentTab) ? ' active' : '';
            html += '<button class="cc-tab' + active + '" data-tab="' + t.key + '">'
                  + '<span style="margin-right:6px;opacity:.7;">' + t.icon + '</span>'
                  + ccEscapeHtml(t.label) + '</button>';
        });
        html += '</div>';

        html += '<div class="cc-content" data-cc-content>';
        if (this.currentTab === 'dashboard') {
            html += this.renderDashboard();
        } else if (this.currentTab === 'agents') {
            if (this.currentAgentView === 'detail' && this.selectedAgentId) {
                html += this.renderAgentDetail(this.selectedAgentId);
            } else {
                html += this.renderAgentsList();
            }
        } else {
            // 子模块占位 — innerHTML 写入后由 _mountSubmodule 接管
            html += '<div class="cc-empty"><div class="cc-empty-icon">☎</div><div class="cc-empty-text">模块加载中...</div></div>';
        }
        html += '</div>';
        html += '</div>';

        this.container.innerHTML = html;
        this.bindEvents();
        // 渲染完结构后，把对应的子模块挂载到 cc-content 内
        this._mountSubmodule();
    },

    /* ---------- 子模块挂载分发 ---------- */
    _mountSubmodule() {
        const tab = this.currentTab;
        if (tab === 'dashboard' || tab === 'agents') return;
        const contentArea = this.container.querySelector('[data-cc-content]');
        if (!contentArea) return;
        try {
            if (tab === 'numbers' && typeof CCNumber !== 'undefined') {
                CCNumber.currentView = 'phones';
                CCNumber.render(contentArea);
            } else if (tab === 'trunks' && typeof CCNumber !== 'undefined') {
                CCNumber.currentView = 'trunks';
                CCNumber.render(contentArea);
            } else if (tab === 'ivr' && typeof CCIvr !== 'undefined') {
                CCIvr.render(contentArea);
            } else if (tab === 'skills' && typeof CCSkill !== 'undefined') {
                CCSkill.render(contentArea);
            } else if (tab === 'calls' && typeof CCCall !== 'undefined') {
                CCCall.render(contentArea);
            } else if (tab === 'outbound' && typeof CCOutbound !== 'undefined') {
                CCOutbound.render(contentArea);
            } else if (tab === 'monitor' && typeof CCMonitor !== 'undefined') {
                CCMonitor.render(contentArea);
                if (CCMonitor.startAutoRefresh && CCMonitor.autoRefresh && !CCMonitor.refreshTimer) {
                    try { CCMonitor.startAutoRefresh(); } catch (e) { /* ignore */ }
                }
            } else if (tab === 'reports' && typeof CCReport !== 'undefined') {
                CCReport.render(contentArea);
            } else {
                contentArea.innerHTML = '<div class="cc-empty"><div class="cc-empty-icon">⚠</div><div class="cc-empty-text">模块未加载，请检查脚本引入顺序</div></div>';
            }
        } catch (err) {
            console.error('[CC] mount submodule failed:', tab, err);
            contentArea.innerHTML = '<div class="cc-empty"><div class="cc-empty-icon">✖</div><div class="cc-empty-text">模块加载异常：' + ccEscapeHtml(String(err && err.message || err)) + '</div></div>';
        }
    },

    _renderPlaceholder(tab) {
        const label = tab ? tab.label : '该功能';
        return '<div class="cc-empty">'
             + '<div class="cc-empty-icon">⌛</div>'
             + '<div class="cc-empty-text">' + ccEscapeHtml(label) + ' 模块将在后续任务中实现</div>'
             + '</div>';
    },

    /* ====================================================================
       6. 坐席工作台仪表板
       ==================================================================== */
    renderDashboard() {
        const agents = AgentStorage.getAll();
        const total = agents.length;
        const online = agents.filter(a => a.status !== AGENT_STATUS.OFFLINE).length;
        const talking = agents.filter(a => a.status === AGENT_STATUS.TALKING).length;
        const ready = agents.filter(a => a.status === AGENT_STATUS.READY).length;
        const breakCount = agents.filter(a => a.status === AGENT_STATUS.BREAK).length;
        const todayCalls = agents.reduce((s, a) => s + (a.today_calls || 0), 0);

        // 模拟数据
        const answerRate = total ? (85 + Math.floor(Math.random() * 10)) : 0;
        const avgDuration = total ? (120 + Math.floor(Math.random() * 90)) : 0;
        const queueing = total ? Math.floor(Math.random() * 6) : 0;
        const avgMin = Math.floor(avgDuration / 60);
        const avgSec = avgDuration % 60;

        let html = '';
        // 统计卡片
        html += '<div class="cc-stat-grid">';
        html += this._statCard('今日通话数', todayCalls, '↑ 较昨日 +12%');
        html += this._statCard('接通率', answerRate + '%', '◉ 稳定运行中');
        html += this._statCard('平均通话时长', avgMin + ":" + (avgSec < 10 ? '0' + avgSec : avgSec), '⌚ 实时统计');
        html += this._statCard('当前排队数', queueing, queueing > 3 ? '⚠ 注意排队' : '✓ 通畅');
        html += this._statCard('在线坐席', online + ' / ' + total, '在岗状态');
        html += this._statCard('通话中坐席', talking, talking > 0 ? '◉ 业务繁忙' : '— 空闲中');
        html += '</div>';

        // 状态分布快览
        html += '<div class="cc-card" style="margin-bottom:20px;">';
        html += '<div class="cc-card-header"><div class="cc-card-title">⌬ 坐席状态分布</div></div>';
        html += '<div style="display:flex;gap:24px;flex-wrap:wrap;font-size:13px;">';
        html += this._statusDot(AGENT_STATUS.READY,   '就绪',   ready);
        html += this._statusDot(AGENT_STATUS.TALKING, '通话中', talking);
        html += this._statusDot(AGENT_STATUS.BREAK,   '小休',   breakCount);
        html += this._statusDot(AGENT_STATUS.OFFLINE, '离线',   total - online);
        html += '</div></div>';

        // 坐席状态概览表
        html += '<div class="cc-card">';
        html += '<div class="cc-card-header">';
        html += '<div class="cc-card-title">◆ 坐席状态概览</div>';
        html += '<button class="cc-btn cc-btn-outline cc-btn-sm" data-action="goto-agents">查看全部 →</button>';
        html += '</div>';

        if (agents.length === 0) {
            html += '<div class="cc-empty"><div class="cc-empty-icon">∅</div><div class="cc-empty-text">暂无坐席数据</div></div>';
        } else {
            html += '<div class="cc-table-wrapper"><table class="cc-table">';
            html += '<thead><tr><th>工号</th><th>姓名</th><th>状态</th><th>分机号</th><th>今日通话</th><th>等级</th><th style="text-align:right;">操作</th></tr></thead><tbody>';
            agents.slice(0, 20).forEach(a => {
                const st = AGENT_STATUS_MAP[a.status] || AGENT_STATUS_MAP[0];
                html += '<tr data-agent-id="' + a.id + '">'
                     + '<td style="color:var(--cc-gold);font-weight:600;letter-spacing:.5px;">' + ccEscapeHtml(a.agent_no) + '</td>'
                     + '<td>' + ccEscapeHtml(a.name) + '</td>'
                     + '<td><span class="cc-status ' + st.css + '"><span class="cc-status-dot"></span>' + st.label + '</span></td>'
                     + '<td style="font-family:monospace;color:var(--cc-text-secondary);">' + ccEscapeHtml(a.extension || '-') + '</td>'
                     + '<td>' + (a.today_calls || 0) + '</td>'
                     + '<td>' + (AGENT_LEVEL_MAP[a.level] || '-') + '</td>'
                     + '<td style="text-align:right;">'
                     + '<button class="cc-btn cc-btn-outline cc-btn-sm" data-action="change-status" data-agent-id="' + a.id + '">切换状态</button>'
                     + '</td></tr>';
            });
            html += '</tbody></table></div>';
        }
        html += '</div>';

        return html;
    },

    _statCard(label, value, extra) {
        let html = '<div class="cc-stat-card">';
        html += '<div class="cc-stat-value">' + ccEscapeHtml(String(value)) + '</div>';
        html += '<div class="cc-stat-label">' + ccEscapeHtml(label) + '</div>';
        if (extra) {
            html += '<div style="margin-top:8px;font-size:11px;color:var(--cc-text-muted);letter-spacing:.5px;">' + ccEscapeHtml(extra) + '</div>';
        }
        html += '</div>';
        return html;
    },

    _statusDot(status, label, count) {
        const st = AGENT_STATUS_MAP[status] || AGENT_STATUS_MAP[0];
        return '<div style="display:flex;align-items:center;gap:8px;">'
             + '<span class="cc-status ' + st.css + '"><span class="cc-status-dot"></span>' + label + '</span>'
             + '<span style="color:var(--cc-text-primary);font-weight:600;">' + count + '</span>'
             + '</div>';
    },

    /* ====================================================================
       7. 坐席档案管理 - 列表
       ==================================================================== */
    renderAgentsList() {
        let agents = AgentStorage.getAll();

        // 搜索过滤
        const kw = (this.searchKeyword || '').trim().toLowerCase();
        if (kw) {
            agents = agents.filter(a =>
                (a.agent_no || '').toLowerCase().includes(kw) ||
                (a.name || '').toLowerCase().includes(kw) ||
                (a.extension || '').toLowerCase().includes(kw) ||
                (a.skillgroup_ids || '').toLowerCase().includes(kw)
            );
        }
        // 状态筛选
        if (this.statusFilter !== 'all' && this.statusFilter !== '') {
            const sf = parseInt(this.statusFilter, 10);
            agents = agents.filter(a => a.status === sf);
        }

        let html = '';

        // 工具栏
        html += '<div class="cc-toolbar">';
        html += '<div style="position:relative;flex:1;min-width:240px;">';
        html += '<span style="position:absolute;left:12px;top:50%;transform:translateY(-50%);color:var(--cc-text-muted);font-size:14px;">⌕</span>';
        html += '<input type="text" class="cc-search-input" data-cc-search placeholder="搜索工号 / 姓名 / 分机 / 技能组..." value="' + ccEscapeHtml(this.searchKeyword) + '">';
        html += '</div>';

        html += '<select class="cc-form-select" data-cc-status-filter style="max-width:160px;">';
        html += '<option value="all"' + (this.statusFilter === 'all' ? ' selected' : '') + '>全部状态</option>';
        Object.keys(AGENT_STATUS_MAP).forEach(k => {
            html += '<option value="' + k + '"' + (this.statusFilter === k ? ' selected' : '') + '>' + AGENT_STATUS_MAP[k].label + '</option>';
        });
        html += '</select>';

        html += '<button class="cc-btn cc-btn-outline" data-action="refresh">⟳ 刷新</button>';
        html += '<button class="cc-btn cc-btn-primary" data-action="new-agent">＋ 新增坐席</button>';
        html += '</div>';

        // 列表卡片
        html += '<div class="cc-card">';
        html += '<div class="cc-card-header">';
        html += '<div class="cc-card-title">◇ 坐席档案 <span style="color:var(--cc-text-muted);font-size:12px;font-weight:400;margin-left:8px;">共 ' + agents.length + ' 条</span></div>';
        html += '</div>';

        if (agents.length === 0) {
            html += '<div class="cc-empty">'
                 + '<div class="cc-empty-icon">∅</div>'
                 + '<div class="cc-empty-text">' + (kw || this.statusFilter !== 'all' ? '未找到匹配的坐席' : '暂无坐席，点击右上角"新增坐席"添加') + '</div>'
                 + '</div>';
        } else {
            html += '<div class="cc-table-wrapper"><table class="cc-table">';
            html += '<thead><tr>'
                 + '<th>工号</th><th>姓名</th><th>分机号</th><th>技能组</th>'
                 + '<th>等级</th><th>状态</th><th>最大并发</th><th>今日通话</th>'
                 + '<th style="text-align:right;width:240px;">操作</th>'
                 + '</tr></thead><tbody>';

            agents.forEach(a => {
                const st = AGENT_STATUS_MAP[a.status] || AGENT_STATUS_MAP[0];
                html += '<tr>'
                     + '<td style="color:var(--cc-gold);font-weight:600;letter-spacing:.5px;cursor:pointer;" data-action="view-agent" data-agent-id="' + a.id + '">' + ccEscapeHtml(a.agent_no) + '</td>'
                     + '<td><span style="cursor:pointer;" data-action="view-agent" data-agent-id="' + a.id + '">' + ccEscapeHtml(a.name) + '</span></td>'
                     + '<td style="font-family:monospace;color:var(--cc-text-secondary);">' + ccEscapeHtml(a.extension || '-') + '</td>'
                     + '<td style="color:var(--cc-text-secondary);font-size:12px;">' + ccEscapeHtml(a.skillgroup_ids || '-') + '</td>'
                     + '<td>' + (AGENT_LEVEL_MAP[a.level] || '-') + '</td>'
                     + '<td><span class="cc-status ' + st.css + '"><span class="cc-status-dot"></span>' + st.label + '</span></td>'
                     + '<td>' + (a.max_concurrent || 1) + '</td>'
                     + '<td>' + (a.today_calls || 0) + '</td>'
                     + '<td style="text-align:right;white-space:nowrap;">'
                     + '<button class="cc-btn cc-btn-outline cc-btn-sm" data-action="view-agent" data-agent-id="' + a.id + '">详情</button> '
                     + '<button class="cc-btn cc-btn-outline cc-btn-sm" data-action="change-status" data-agent-id="' + a.id + '">状态</button> '
                     + '<button class="cc-btn cc-btn-outline cc-btn-sm" data-action="edit-agent" data-agent-id="' + a.id + '">编辑</button> '
                     + '<button class="cc-btn cc-btn-sm" data-action="delete-agent" data-agent-id="' + a.id + '" style="background:rgba(255,77,79,0.12);color:var(--cc-btn-hangup);border:1px solid rgba(255,77,79,0.3);">删除</button>'
                     + '</td></tr>';
            });
            html += '</tbody></table></div>';
        }

        html += '</div>';
        return html;
    },

    /* ====================================================================
       8. 坐席详情
       ==================================================================== */
    renderAgentDetail(agentId) {
        const a = AgentStorage.getById(agentId);
        if (!a) {
            return '<div class="cc-empty"><div class="cc-empty-icon">∅</div><div class="cc-empty-text">坐席不存在或已被删除</div></div>';
        }

        const st = AGENT_STATUS_MAP[a.status] || AGENT_STATUS_MAP[0];
        const logs = AgentStatusLogStorage.getByAgentId(agentId);

        let html = '';

        // 顶部返回栏
        html += '<div style="margin-bottom:20px;display:flex;align-items:center;gap:12px;">';
        html += '<button class="cc-btn cc-btn-outline cc-btn-sm" data-action="back-to-list">← 返回列表</button>';
        html += '<span style="color:var(--cc-text-muted);font-size:12px;letter-spacing:.5px;">坐席档案 / ' + ccEscapeHtml(a.agent_no) + '</span>';
        html += '</div>';

        // 个人信息卡
        html += '<div class="cc-card" style="margin-bottom:20px;">';
        html += '<div style="display:flex;gap:24px;align-items:flex-start;flex-wrap:wrap;">';
        // 头像区
        html += '<div style="flex-shrink:0;width:88px;height:88px;border-radius:14px;background:linear-gradient(135deg,var(--cc-gold-dark),var(--cc-gold));display:flex;align-items:center;justify-content:center;font-size:32px;font-weight:700;color:#000;letter-spacing:1px;box-shadow:0 8px 24px rgba(212,175,55,0.25);">'
             + ccEscapeHtml((a.name || '?').substr(0, 1))
             + '</div>';
        // 信息区
        html += '<div style="flex:1;min-width:240px;">';
        html += '<div style="display:flex;align-items:center;gap:12px;margin-bottom:8px;">';
        html += '<h3 style="margin:0;font-size:22px;color:var(--cc-text-primary);">' + ccEscapeHtml(a.name) + '</h3>';
        html += '<span class="cc-status ' + st.css + '"><span class="cc-status-dot"></span>' + st.label + '</span>';
        html += '</div>';
        html += '<div style="color:var(--cc-text-secondary);font-size:13px;letter-spacing:.5px;">'
             + '工号 <strong style="color:var(--cc-gold);">' + ccEscapeHtml(a.agent_no) + '</strong>'
             + '　·　分机 <span style="font-family:monospace;color:var(--cc-text-primary);">' + ccEscapeHtml(a.extension || '-') + '</span>'
             + '　·　' + (AGENT_LEVEL_MAP[a.level] || '-') + '坐席'
             + '</div>';
        html += '</div>';
        // 操作区
        html += '<div style="display:flex;gap:8px;flex-wrap:wrap;">';
        html += '<button class="cc-btn cc-btn-outline" data-action="change-status" data-agent-id="' + a.id + '">⇄ 切换状态</button>';
        html += '<button class="cc-btn cc-btn-primary" data-action="edit-agent" data-agent-id="' + a.id + '">编辑资料</button>';
        html += '</div>';
        html += '</div>';
        html += '</div>';

        // 详细资料 grid
        html += '<div class="cc-grid-2" style="margin-bottom:20px;">';
        html += '<div class="cc-card">';
        html += '<div class="cc-card-header"><div class="cc-card-title">▣ 基础资料</div></div>';
        html += this._detailRow('坐席编号', a.agent_no);
        html += this._detailRow('姓名', a.name);
        html += this._detailRow('分机号', a.extension);
        html += this._detailRow('SIP用户名', a.sip_username);
        html += this._detailRow('SIP密码', a.sip_password ? '••••••••' : '-');
        html += this._detailRow('WebRTC端点', a.webrtc_endpoint);
        html += '</div>';

        html += '<div class="cc-card">';
        html += '<div class="cc-card-header"><div class="cc-card-title">▤ 业务配置</div></div>';
        html += this._detailRow('技能组', a.skillgroup_ids);
        html += this._detailRow('语言能力', a.languages);
        html += this._detailRow('等级', AGENT_LEVEL_MAP[a.level] || '-');
        html += this._detailRow('最大并发', a.max_concurrent);
        html += this._detailRow('每日通话上限', a.daily_call_limit);
        html += this._detailRow('今日已通话', a.today_calls || 0);
        html += '</div>';
        html += '</div>';

        // 状态变更历史
        html += '<div class="cc-card">';
        html += '<div class="cc-card-header">';
        html += '<div class="cc-card-title">⌚ 状态变更历史 <span style="color:var(--cc-text-muted);font-size:12px;font-weight:400;margin-left:8px;">共 ' + logs.length + ' 条</span></div>';
        html += '</div>';

        if (logs.length === 0) {
            html += '<div class="cc-empty"><div class="cc-empty-icon">∅</div><div class="cc-empty-text">暂无状态变更记录</div></div>';
        } else {
            html += '<div class="cc-table-wrapper"><table class="cc-table">';
            html += '<thead><tr><th>时间</th><th>原状态</th><th></th><th>新状态</th><th>原因</th><th>操作人</th></tr></thead><tbody>';
            logs.slice(0, 50).forEach(l => {
                const fromSt = AGENT_STATUS_MAP[l.from_status] || AGENT_STATUS_MAP[0];
                const toSt = AGENT_STATUS_MAP[l.to_status] || AGENT_STATUS_MAP[0];
                html += '<tr>'
                     + '<td style="font-family:monospace;color:var(--cc-text-secondary);">' + ccFormatDateTime(l.created_at) + '</td>'
                     + '<td><span class="cc-status ' + fromSt.css + '"><span class="cc-status-dot"></span>' + fromSt.label + '</span></td>'
                     + '<td style="color:var(--cc-gold);text-align:center;">→</td>'
                     + '<td><span class="cc-status ' + toSt.css + '"><span class="cc-status-dot"></span>' + toSt.label + '</span></td>'
                     + '<td style="color:var(--cc-text-secondary);">' + ccEscapeHtml(l.reason || '-') + '</td>'
                     + '<td style="color:var(--cc-text-muted);font-size:12px;">' + ccEscapeHtml(l.operator || '-') + '</td>'
                     + '</tr>';
            });
            html += '</tbody></table></div>';
        }
        html += '</div>';

        return html;
    },

    _detailRow(label, value) {
        return '<div style="display:flex;padding:10px 0;border-bottom:1px solid rgba(255,255,255,0.04);">'
             + '<div style="width:110px;color:var(--cc-text-muted);font-size:12px;letter-spacing:.5px;">' + ccEscapeHtml(label) + '</div>'
             + '<div style="flex:1;color:var(--cc-text-primary);font-size:13px;word-break:break-all;">' + ccEscapeHtml(value || '-') + '</div>'
             + '</div>';
    },

    /* ====================================================================
       9. 状态机
       ==================================================================== */
    canTransition(fromStatus, toStatus) {
        const allowed = AGENT_STATUS_TRANSITIONS[fromStatus] || [];
        return allowed.indexOf(toStatus) !== -1;
    },

    getAllowedNextStatuses(fromStatus) {
        return (AGENT_STATUS_TRANSITIONS[fromStatus] || []).slice();
    },

    changeAgentStatus(agentId, newStatus, reason) {
        const a = AgentStorage.getById(agentId);
        if (!a) {
            ccShowToast('坐席不存在', 'error');
            return false;
        }
        const oldStatus = a.status;
        if (oldStatus === newStatus) {
            ccShowToast('状态未变更', 'warning');
            return false;
        }
        if (!this.canTransition(oldStatus, newStatus)) {
            const fromLabel = (AGENT_STATUS_MAP[oldStatus] || {}).label || '?';
            const toLabel = (AGENT_STATUS_MAP[newStatus] || {}).label || '?';
            ccShowToast('非法状态转换：' + fromLabel + ' → ' + toLabel, 'error');
            return false;
        }

        // 写日志
        AgentStatusLogStorage.add({
            agent_id: a.id,
            agent_no: a.agent_no,
            agent_name: a.name,
            from_status: oldStatus,
            to_status: newStatus,
            reason: reason || '',
            operator: 'admin'
        });

        // 更新坐席
        AgentStorage.update({ id: a.id, status: newStatus });

        ccShowToast('状态已切换为：' + (AGENT_STATUS_MAP[newStatus] || {}).label, 'success');
        this.render();
        return true;
    },

    /* ====================================================================
       10. 模态框 - 新增/编辑坐席
       ==================================================================== */
    showAgentModal(agentId) {
        const isEdit = !!agentId;
        const a = isEdit ? AgentStorage.getById(agentId) : {
            agent_no: '', name: '', extension: '', sip_username: '', sip_password: '',
            webrtc_endpoint: 'wss://rtc.demo.local/ws', skillgroup_ids: '',
            languages: '中文', level: 1, max_concurrent: 1, daily_call_limit: 150
        };
        if (isEdit && !a) {
            ccShowToast('坐席不存在', 'error');
            return;
        }

        ccCloseModal();

        const overlay = document.createElement('div');
        overlay.className = 'cc-modal-overlay';
        overlay.dataset.modal = 'agent-form';

        let body = '';
        body += '<div class="cc-modal">';
        body += '<div class="cc-modal-header">';
        body += '<div class="cc-modal-title">' + (isEdit ? '✎ 编辑坐席' : '＋ 新增坐席') + '</div>';
        body += '<button class="cc-modal-close" data-action="close-modal">×</button>';
        body += '</div>';
        body += '<div class="cc-modal-body">';
        body += '<form data-cc-agent-form>';

        body += '<div class="cc-grid-2">';
        body += this._formField('坐席编号', 'agent_no', 'text', a.agent_no, true, 'A001');
        body += this._formField('姓名', 'name', 'text', a.name, true, '请输入姓名');
        body += this._formField('分机号', 'extension', 'text', a.extension, true, '8001');
        body += this._formField('SIP用户名', 'sip_username', 'text', a.sip_username, false, 'sip8001');
        body += this._formField('SIP密码', 'sip_password', 'text', a.sip_password, false, '••••••••');
        body += this._formField('WebRTC端点', 'webrtc_endpoint', 'text', a.webrtc_endpoint, false, 'wss://rtc.example.com/ws');
        body += '</div>';

        body += this._formField('技能组（逗号分隔）', 'skillgroup_ids', 'text', a.skillgroup_ids, false, '客服一组,VIP通道');
        body += this._formField('语言能力', 'languages', 'text', a.languages, false, '中文,英文');

        body += '<div class="cc-grid-3">';
        // 等级
        body += '<div class="cc-form-group">';
        body += '<label class="cc-form-label">等级</label>';
        body += '<select class="cc-form-select" name="level">';
        Object.keys(AGENT_LEVEL_MAP).forEach(k => {
            const sel = (parseInt(k, 10) === parseInt(a.level, 10)) ? ' selected' : '';
            body += '<option value="' + k + '"' + sel + '>' + AGENT_LEVEL_MAP[k] + '（' + k + '级）</option>';
        });
        body += '</select></div>';
        body += this._formField('最大并发数', 'max_concurrent', 'number', a.max_concurrent, false, '1');
        body += this._formField('每日通话上限', 'daily_call_limit', 'number', a.daily_call_limit, false, '150');
        body += '</div>';

        if (isEdit) {
            body += '<input type="hidden" name="id" value="' + ccEscapeHtml(a.id) + '">';
        }

        body += '</form>';
        body += '</div>';
        body += '<div class="cc-modal-footer">';
        body += '<button class="cc-btn cc-btn-outline" data-action="close-modal">取消</button>';
        body += '<button class="cc-btn cc-btn-primary" data-action="save-agent">保存</button>';
        body += '</div>';
        body += '</div>';

        overlay.innerHTML = body;
        document.body.appendChild(overlay);
    },

    _formField(label, name, type, value, required, placeholder) {
        let html = '<div class="cc-form-group">';
        html += '<label class="cc-form-label">' + ccEscapeHtml(label) + (required ? ' <span style="color:var(--cc-btn-hangup);">*</span>' : '') + '</label>';
        html += '<input class="cc-form-input" type="' + type + '" name="' + name + '" value="' + ccEscapeHtml(value == null ? '' : value) + '"'
              + (placeholder ? ' placeholder="' + ccEscapeHtml(placeholder) + '"' : '')
              + (required ? ' required' : '') + '>';
        html += '</div>';
        return html;
    },

    saveAgentFromForm() {
        const form = document.querySelector('[data-cc-agent-form]');
        if (!form) return;
        const fd = new FormData(form);
        const data = {
            agent_no: (fd.get('agent_no') || '').trim(),
            name: (fd.get('name') || '').trim(),
            extension: (fd.get('extension') || '').trim(),
            sip_username: (fd.get('sip_username') || '').trim(),
            sip_password: (fd.get('sip_password') || '').trim(),
            webrtc_endpoint: (fd.get('webrtc_endpoint') || '').trim(),
            skillgroup_ids: (fd.get('skillgroup_ids') || '').trim(),
            languages: (fd.get('languages') || '').trim(),
            level: parseInt(fd.get('level'), 10) || 1,
            max_concurrent: parseInt(fd.get('max_concurrent'), 10) || 1,
            daily_call_limit: parseInt(fd.get('daily_call_limit'), 10) || 0
        };
        const id = fd.get('id');

        // 校验
        if (!data.agent_no) { ccShowToast('坐席编号必填', 'error'); return; }
        if (!data.name) { ccShowToast('姓名必填', 'error'); return; }
        if (!data.extension) { ccShowToast('分机号必填', 'error'); return; }
        if (AgentStorage.isAgentNoExist(data.agent_no, id)) {
            ccShowToast('坐席编号已存在：' + data.agent_no, 'error');
            return;
        }
        if (AgentStorage.isExtensionExist(data.extension, id)) {
            ccShowToast('分机号已被占用：' + data.extension, 'error');
            return;
        }

        if (id) {
            data.id = id;
            AgentStorage.update(data);
            ccShowToast('坐席已更新', 'success');
        } else {
            AgentStorage.add(data);
            ccShowToast('坐席已新增', 'success');
        }

        ccCloseModal();
        this.render();
    },

    /* ====================================================================
       11. 模态框 - 状态切换
       ==================================================================== */
    showStatusChangeModal(agentId) {
        const a = AgentStorage.getById(agentId);
        if (!a) {
            ccShowToast('坐席不存在', 'error');
            return;
        }
        const curSt = AGENT_STATUS_MAP[a.status] || AGENT_STATUS_MAP[0];
        const allowed = this.getAllowedNextStatuses(a.status);

        ccCloseModal();

        const overlay = document.createElement('div');
        overlay.className = 'cc-modal-overlay';
        overlay.dataset.modal = 'status-change';

        let body = '';
        body += '<div class="cc-modal" style="max-width:520px;">';
        body += '<div class="cc-modal-header">';
        body += '<div class="cc-modal-title">⇄ 切换坐席状态</div>';
        body += '<button class="cc-modal-close" data-action="close-modal">×</button>';
        body += '</div>';
        body += '<div class="cc-modal-body">';

        body += '<div style="margin-bottom:16px;padding:14px 16px;background:var(--cc-bg-primary);border:1px solid var(--cc-gold-border-light);border-radius:8px;">';
        body += '<div style="font-size:11px;color:var(--cc-text-muted);letter-spacing:.5px;margin-bottom:6px;">当前坐席</div>';
        body += '<div style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:12px;">';
        body += '<div><strong style="color:var(--cc-gold);font-size:14px;letter-spacing:.5px;">' + ccEscapeHtml(a.agent_no) + '</strong> · ' + ccEscapeHtml(a.name) + '</div>';
        body += '<span class="cc-status ' + curSt.css + '"><span class="cc-status-dot"></span>当前：' + curSt.label + '</span>';
        body += '</div></div>';

        if (allowed.length === 0) {
            body += '<div class="cc-empty"><div class="cc-empty-icon">⊘</div><div class="cc-empty-text">当前状态无可切换的目标状态</div></div>';
        } else {
            body += '<div style="font-size:12px;color:var(--cc-text-secondary);margin-bottom:10px;letter-spacing:.5px;">选择新状态：</div>';
            body += '<div style="display:flex;flex-wrap:wrap;gap:10px;margin-bottom:18px;">';
            allowed.forEach(s => {
                const st = AGENT_STATUS_MAP[s];
                body += '<button type="button" class="cc-btn cc-btn-outline cc-status-target-btn" data-target-status="' + s + '" style="padding:10px 18px;">'
                     + '<span class="cc-status-dot" style="display:inline-block;width:8px;height:8px;border-radius:50%;margin-right:8px;background:var(--' + st.css.replace('cc-', 'cc-') + '-color, currentColor);"></span>'
                     + st.label + '</button>';
            });
            body += '</div>';

            body += '<div class="cc-form-group">';
            body += '<label class="cc-form-label">原因（选填）</label>';
            body += '<textarea class="cc-form-textarea" data-cc-status-reason placeholder="例如：午休、会议、客户咨询..."></textarea>';
            body += '</div>';
        }

        body += '<input type="hidden" data-cc-status-agent-id value="' + ccEscapeHtml(a.id) + '">';

        body += '</div>';
        body += '<div class="cc-modal-footer">';
        body += '<button class="cc-btn cc-btn-outline" data-action="close-modal">取消</button>';
        if (allowed.length > 0) {
            body += '<button class="cc-btn cc-btn-primary" data-action="confirm-status" disabled data-cc-confirm-status>确认切换</button>';
        }
        body += '</div>';
        body += '</div>';

        overlay.innerHTML = body;
        document.body.appendChild(overlay);
    },

    /* ====================================================================
       12. 事件委托
       ==================================================================== */
    bindEvents() {
        const module = this.container.querySelector('.cc-module');
        if (!module) return;

        // 顶层 click 委托
        const clickHandler = (e) => this._onClick(e);
        this.addEvent(module, 'click', clickHandler);

        // 工具栏：搜索 / 筛选（input/change）
        const searchInput = module.querySelector('[data-cc-search]');
        if (searchInput) {
            const onInput = (e) => {
                this.searchKeyword = e.target.value;
                this._refreshAgentsList();
            };
            this.addEvent(searchInput, 'input', onInput);
        }
        const statusFilter = module.querySelector('[data-cc-status-filter]');
        if (statusFilter) {
            const onChange = (e) => {
                this.statusFilter = e.target.value;
                this.render();
            };
            this.addEvent(statusFilter, 'change', onChange);
        }

        // 模态框：document 级 click（覆盖动态弹层）
        if (!this._delegateHandler) {
            this._delegateHandler = (e) => this._onModalClick(e);
            document.addEventListener('click', this._delegateHandler);
            this.eventHandlers.push({ el: document, evt: 'click', fn: this._delegateHandler });
        }
    },

    _refreshAgentsList() {
        // 仅刷新表格主体，避免input失焦
        const content = this.container.querySelector('[data-cc-content]');
        if (!content) { this.render(); return; }
        // 简化处理：保留搜索值、重新渲染整个内容区，再恢复焦点
        const focused = document.activeElement;
        const isSearch = focused && focused.matches('[data-cc-search]');
        const cursor = isSearch ? focused.selectionStart : null;
        content.innerHTML = this.renderAgentsList();
        // 重新绑定（容器内事件已通过事件委托从module层处理，这里只重绑search/select）
        const newSearch = content.querySelector('[data-cc-search]');
        if (newSearch && isSearch) {
            newSearch.focus();
            try { newSearch.setSelectionRange(cursor, cursor); } catch (err) {}
        }
        // 重新绑定input/change（旧节点已销毁）
        if (newSearch) {
            const onInput = (ev) => { this.searchKeyword = ev.target.value; this._refreshAgentsList(); };
            this.addEvent(newSearch, 'input', onInput);
        }
        const newSelect = content.querySelector('[data-cc-status-filter]');
        if (newSelect) {
            const onChange = (ev) => { this.statusFilter = ev.target.value; this.render(); };
            this.addEvent(newSelect, 'change', onChange);
        }
    },

    _onClick(e) {
        // Tab切换
        const tab = e.target.closest('.cc-tab');
        if (tab && this.container.contains(tab)) {
            e.preventDefault();
            const newTab = tab.dataset.tab;
            if (newTab === this.currentTab && this.currentAgentView === 'list') return;
            // 离开监控Tab时清理定时器，防止后台轮询泄漏
            if (this.currentTab === 'monitor' && newTab !== 'monitor' && typeof CCMonitor !== 'undefined' && CCMonitor.destroy) {
                try { CCMonitor.destroy(); } catch (err) { /* ignore */ }
            }
            this.currentTab = newTab;
            this.currentAgentView = 'list';
            this.selectedAgentId = null;
            this.searchKeyword = '';
            this.statusFilter = 'all';
            this.render();
            return;
        }

        const actionEl = e.target.closest('[data-action]');
        if (!actionEl || !this.container.contains(actionEl)) return;
        const action = actionEl.dataset.action;
        const agentId = actionEl.dataset.agentId;

        switch (action) {
            case 'goto-agents':
                this.currentTab = 'agents';
                this.currentAgentView = 'list';
                this.render();
                break;
            case 'refresh':
                this.render();
                ccShowToast('已刷新', 'success');
                break;
            case 'new-agent':
                this.showAgentModal(null);
                break;
            case 'edit-agent':
                this.showAgentModal(agentId);
                break;
            case 'view-agent':
                this.selectedAgentId = agentId;
                this.currentAgentView = 'detail';
                this.render();
                break;
            case 'back-to-list':
                this.currentAgentView = 'list';
                this.selectedAgentId = null;
                this.render();
                break;
            case 'delete-agent':
                this._deleteAgent(agentId);
                break;
            case 'change-status':
                this.showStatusChangeModal(agentId);
                break;
            default: break;
        }
    },

    _onModalClick(e) {
        const overlay = e.target.closest('.cc-modal-overlay');
        if (!overlay) return;

        // 点击遮罩关闭
        if (e.target === overlay) {
            ccCloseModal();
            return;
        }

        const actionEl = e.target.closest('[data-action]');
        if (!actionEl) {
            // 状态目标按钮
            const targetBtn = e.target.closest('.cc-status-target-btn');
            if (targetBtn) {
                overlay.querySelectorAll('.cc-status-target-btn').forEach(b => {
                    b.classList.remove('cc-btn-primary');
                    b.classList.add('cc-btn-outline');
                });
                targetBtn.classList.remove('cc-btn-outline');
                targetBtn.classList.add('cc-btn-primary');
                overlay.dataset.selectedTarget = targetBtn.dataset.targetStatus;
                const confirmBtn = overlay.querySelector('[data-cc-confirm-status]');
                if (confirmBtn) confirmBtn.disabled = false;
            }
            return;
        }
        const action = actionEl.dataset.action;
        switch (action) {
            case 'close-modal':
                ccCloseModal();
                break;
            case 'save-agent':
                this.saveAgentFromForm();
                break;
            case 'confirm-status': {
                const target = overlay.dataset.selectedTarget;
                if (!target) { ccShowToast('请先选择目标状态', 'warning'); return; }
                const agentIdInput = overlay.querySelector('[data-cc-status-agent-id]');
                const reasonInput = overlay.querySelector('[data-cc-status-reason]');
                const aid = agentIdInput ? (agentIdInput.value || agentIdInput.getAttribute('value')) : null;
                const reason = reasonInput ? reasonInput.value.trim() : '';
                if (!aid) { ccShowToast('参数错误', 'error'); return; }
                ccCloseModal();
                this.changeAgentStatus(aid, parseInt(target, 10), reason);
                break;
            }
            default: break;
        }
    },

    _deleteAgent(agentId) {
        const a = AgentStorage.getById(agentId);
        if (!a) return;
        if (!ccConfirm('确认删除坐席「' + a.name + '（' + a.agent_no + '）」？此操作不可撤销。')) return;
        AgentStorage.delete(agentId);
        AgentStatusLogStorage.add({
            agent_id: a.id,
            agent_no: a.agent_no,
            agent_name: a.name,
            from_status: a.status,
            to_status: AGENT_STATUS.OFFLINE,
            reason: '坐席档案删除',
            operator: 'admin'
        });
        ccShowToast('坐席已删除', 'success');
        if (this.selectedAgentId === agentId) {
            this.currentAgentView = 'list';
            this.selectedAgentId = null;
        }
        this.render();
    }
};

/* ========================================================================
   13. 暴露到全局
   ======================================================================== */
if (typeof window !== 'undefined') {
    window.CallCenter = CallCenter;
    window.AgentStorage = AgentStorage;
    window.AgentStatusLogStorage = AgentStatusLogStorage;
    window.AGENT_STATUS = AGENT_STATUS;
    window.AGENT_STATUS_MAP = AGENT_STATUS_MAP;
    window.AGENT_LEVEL_MAP = AGENT_LEVEL_MAP;
    window.CC_KEYS = CC_KEYS;
}

/* ========================================================================
   14. CCSoftPhone —— WebRTC软电话浮动控件
   ======================================================================== */
const CCSoftPhone = {
    isVisible: true,
    isMinimized: true,
    currentState: 'idle',
    callInfo: null,
    callTimer: null,
    callDuration: 0,
    isMuted: false,
    isHeld: false,
    dialNumber: '',
    afterworkTimer: null,
    afterworkRemain: 25,
    ringingTimer: null,

    init() {
        if (document.getElementById('cc-softphone-root')) return;
        const root = document.createElement('div');
        root.id = 'cc-softphone-root';
        root.className = 'cc-softphone';
        document.body.appendChild(root);
        this.render();
        this.bindEvents();
    },

    destroy() {
        this._clearCallTimer();
        this._clearAfterworkTimer();
        this._clearRingingTimer();
        const root = document.getElementById('cc-softphone-root');
        if (root) root.remove();
    },

    render() {
        const root = document.getElementById('cc-softphone-root');
        if (!root) return;
        root.innerHTML = this.isMinimized ? this.renderMinimized() : this.renderExpanded();
    },

    renderMinimized() {
        let stateClass = '';
        if (this.currentState === 'ringing') stateClass = 'ringing';
        else if (this.currentState === 'talking') stateClass = 'talking';
        else if (this.currentState === 'afterwork') stateClass = 'afterwork';
        const icon = this.currentState === 'ringing' ? 'fa-phone-volume'
                   : this.currentState === 'talking' ? 'fa-headset'
                   : this.currentState === 'afterwork' ? 'fa-pen-to-square'
                   : 'fa-phone';
        return '<div class="cc-softphone-minimized ' + stateClass + '" data-cc-sp-action="expand" title="WebRTC软电话">'
             + '<span style="color:#fff;font-size:18px;"><i class="fa-solid ' + icon + '"></i></span>'
             + '</div>';
    },

    renderExpanded() {
        const stateLabel = { idle: '空闲', ringing: '振铃', talking: '通话中', afterwork: '后处理' }[this.currentState] || '空闲';
        const statusDot = { idle: '#00D084', ringing: '#FFB020', talking: '#FF4D4F', afterwork: '#5B8DEF' }[this.currentState] || '#00D084';
        let body = '';
        if (this.currentState === 'idle') body = this.renderIdlePanel();
        else if (this.currentState === 'ringing') body = this.renderRingingPanel();
        else if (this.currentState === 'talking') body = this.renderTalkingPanel();
        else if (this.currentState === 'afterwork') body = this.renderAfterworkPanel();
        return '<div class="cc-softphone-expanded" id="cc-softphone-window">'
             + '<div class="cc-softphone-header" id="cc-softphone-drag">'
             +   '<div class="cc-softphone-title">'
             +     '<span style="display:inline-block;width:8px;height:8px;border-radius:50%;background:' + statusDot + ';box-shadow:0 0 8px ' + statusDot + ';"></span>'
             +     'WebRTC软电话 · ' + stateLabel
             +   '</div>'
             +   '<div class="cc-softphone-controls">'
             +     '<button class="cc-softphone-ctrl-btn" data-cc-sp-action="minimize" title="最小化"><i class="fa-solid fa-minus"></i></button>'
             +   '</div>'
             + '</div>'
             + '<div class="cc-softphone-body">' + body + '</div>'
             + '</div>';
    },

    renderIdlePanel() {
        const keys = ['1','2','3','4','5','6','7','8','9','*','0','#'];
        let pad = '';
        keys.forEach(k => {
            pad += '<button class="cc-dialpad-key" data-cc-sp-action="press-key" data-key="' + k + '">' + k + '</button>';
        });
        const quick = this._getQuickDialList();
        let quickHtml = '';
        if (quick.length > 0) {
            quickHtml += '<div class="cc-quick-dial"><div class="cc-quick-dial-title">快速拨号</div>';
            quick.forEach(q => {
                quickHtml += '<div class="cc-quick-dial-item" data-cc-sp-action="quick-dial" data-number="' + q.phone + '" data-name="' + (q.name || '') + '">'
                          +   '<span class="cc-quick-dial-name">' + (q.name || '客户') + '</span>'
                          +   '<span class="cc-quick-dial-number">' + this._maskPhone(q.phone) + '</span>'
                          + '</div>';
            });
            quickHtml += '</div>';
        }
        return '<div class="cc-dialpad">'
             +   '<div class="cc-dial-display">' + (this.dialNumber || '<span style="color:#666;font-size:13px;">输入号码</span>') + '</div>'
             +   '<div class="cc-dialpad-grid">' + pad + '</div>'
             +   '<div class="cc-dial-actions">'
             +     '<button class="cc-dial-btn cc-dial-btn-call" data-cc-sp-action="dial"><i class="fa-solid fa-phone"></i> 拨号</button>'
             +     '<button class="cc-dial-btn cc-dial-btn-clear" data-cc-sp-action="clear"><i class="fa-solid fa-delete-left"></i></button>'
             +   '</div>'
             + '</div>'
             + quickHtml
             + '<div style="margin-top:14px;padding-top:12px;border-top:1px dashed rgba(212,175,55,0.15);">'
             +   '<button class="cc-dial-btn cc-dial-btn-clear" style="width:100%;" data-cc-sp-action="simulate-incoming"><i class="fa-solid fa-bell"></i> 模拟来电</button>'
             + '</div>';
    },

    renderRingingPanel() {
        const info = this.callInfo || {};
        return '<div class="cc-call-status-panel">'
             +   '<div style="font-size:32px;color:#FFB020;margin-bottom:6px;animation:ccPhoneRing 0.5s infinite alternate;"><i class="fa-solid fa-phone-volume"></i></div>'
             +   '<div style="font-size:11px;color:#FFB020;margin-bottom:8px;letter-spacing:2px;">' + (info.direction === 'inbound' ? '来电振铃' : '正在呼叫') + '</div>'
             +   '<div class="cc-call-number">' + (info.number || '-') + '</div>'
             +   '<div class="cc-call-name">' + (info.customerName || '未识别客户') + (info.source ? ' · ' + info.source : '') + '</div>'
             +   '<div class="cc-call-controls">'
             +     (info.direction === 'inbound' ? '<button class="cc-call-ctrl cc-call-ctrl-answer" data-cc-sp-action="answer" title="接听"><i class="fa-solid fa-phone"></i></button>' : '')
             +     '<button class="cc-call-ctrl cc-call-ctrl-hangup" data-cc-sp-action="reject" title="' + (info.direction === 'inbound' ? '拒接' : '取消') + '"><i class="fa-solid fa-phone-slash"></i></button>'
             +   '</div>'
             + '</div>';
    },

    renderTalkingPanel() {
        const info = this.callInfo || {};
        return '<div class="cc-call-status-panel">'
             +   '<div class="cc-call-number">' + (info.number || '-') + '</div>'
             +   '<div class="cc-call-name">' + (info.customerName || '通话中') + (this.isHeld ? ' · 已保持' : '') + '</div>'
             +   '<div class="cc-call-timer">' + this._formatDuration(this.callDuration) + '</div>'
             +   '<div class="cc-call-controls">'
             +     '<button class="cc-call-ctrl cc-call-ctrl-mute' + (this.isMuted ? ' active' : '') + '" data-cc-sp-action="toggle-mute" title="静音"><i class="fa-solid ' + (this.isMuted ? 'fa-microphone-slash' : 'fa-microphone') + '"></i></button>'
             +     '<button class="cc-call-ctrl cc-call-ctrl-hold' + (this.isHeld ? ' active' : '') + '" data-cc-sp-action="toggle-hold" title="保持"><i class="fa-solid fa-pause"></i></button>'
             +     '<button class="cc-call-ctrl cc-call-ctrl-transfer" data-cc-sp-action="transfer" title="转接"><i class="fa-solid fa-arrow-right-arrow-left"></i></button>'
             +     '<button class="cc-call-ctrl cc-call-ctrl-hangup" data-cc-sp-action="hangup" title="挂断"><i class="fa-solid fa-phone-slash"></i></button>'
             +   '</div>'
             + '</div>';
    },

    renderAfterworkPanel() {
        const info = this.callInfo || {};
        const dur = this._formatDuration(info.lastDuration || 0);
        const tags = ['意向A','意向B','意向C','已报价','需回访','无意向'];
        let tagHtml = '';
        tags.forEach(t => { tagHtml += '<button class="cc-aw-tag" data-cc-sp-action="toggle-tag" data-tag="' + t + '">' + t + '</button>'; });
        return '<div style="padding:6px 0;">'
             + '<div style="font-size:13px;color:#fff;margin-bottom:4px;"><i class="fa-solid fa-circle-check" style="color:#00D084;"></i> 通话已结束</div>'
             + '<div style="font-size:12px;color:#A0A0B0;margin-bottom:12px;">' + (info.number || '-') + ' · 通话时长 ' + dur + '</div>'
             + '<div style="font-size:11px;color:#666;margin-bottom:6px;">备注</div>'
             + '<textarea id="cc-sp-afterwork-note" placeholder="请输入跟进备注..." style="width:100%;min-height:60px;background:#0A0A0F;border:1px solid rgba(212,175,55,0.15);border-radius:6px;color:#fff;padding:8px;font-size:12px;resize:none;box-sizing:border-box;"></textarea>'
             + '<div style="font-size:11px;color:#666;margin:10px 0 6px;">标签</div>'
             + '<div class="cc-aw-tag-row" style="display:flex;flex-wrap:wrap;gap:6px;margin-bottom:12px;">' + tagHtml + '</div>'
             + '<div style="display:flex;justify-content:space-between;align-items:center;gap:8px;">'
             +   '<button class="cc-dial-btn cc-dial-btn-call" style="flex:1;" data-cc-sp-action="finish-afterwork"><i class="fa-solid fa-check"></i> 完成后处理</button>'
             +   '<span style="font-size:11px;color:#A0A0B0;white-space:nowrap;">倒计时 <span id="cc-sp-aw-remain" style="color:#D4AF37;font-weight:600;">' + this.afterworkRemain + '</span>s</span>'
             + '</div>'
             + '</div>';
    },

    bindEvents() {
        const root = document.getElementById('cc-softphone-root');
        if (!root) return;
        root.addEventListener('click', (e) => {
            const target = e.target.closest('[data-cc-sp-action]');
            if (!target) return;
            const action = target.getAttribute('data-cc-sp-action');
            const key = target.getAttribute('data-key');
            const num = target.getAttribute('data-number');
            const name = target.getAttribute('data-name');
            switch (action) {
                case 'expand': this.isMinimized = false; this.render(); break;
                case 'minimize': this.isMinimized = true; this.render(); break;
                case 'press-key': this.pressKey(key); break;
                case 'clear': this.clearDial(); break;
                case 'dial': this.dial(this.dialNumber); break;
                case 'quick-dial': this.dial(num, name); break;
                case 'simulate-incoming': this.simulateIncomingCall(); break;
                case 'answer': this.answer(); break;
                case 'reject': this.hangup(); break;
                case 'hangup': this.hangup(); break;
                case 'toggle-mute': this.isMuted ? this.unmute() : this.mute(); break;
                case 'toggle-hold': this.isHeld ? this.unhold() : this.hold(); break;
                case 'transfer': this.transfer(); break;
                case 'toggle-tag': target.classList.toggle('active'); break;
                case 'finish-afterwork': this._finishAfterwork(); break;
            }
        });
        this._bindDrag(root);
    },

    _bindDrag(root) {
        let dragging = false;
        let startX = 0, startY = 0, originLeft = 0, originTop = 0;
        root.addEventListener('mousedown', (e) => {
            const handle = e.target.closest('#cc-softphone-drag');
            if (!handle) return;
            if (e.target.closest('.cc-softphone-controls')) return;
            dragging = true;
            const rect = root.getBoundingClientRect();
            startX = e.clientX; startY = e.clientY;
            originLeft = rect.left; originTop = rect.top;
            root.style.left = originLeft + 'px';
            root.style.top = originTop + 'px';
            root.style.right = 'auto';
            root.style.bottom = 'auto';
            e.preventDefault();
        });
        document.addEventListener('mousemove', (e) => {
            if (!dragging) return;
            const dx = e.clientX - startX;
            const dy = e.clientY - startY;
            const newLeft = Math.max(0, Math.min(window.innerWidth - 60, originLeft + dx));
            const newTop = Math.max(0, Math.min(window.innerHeight - 60, originTop + dy));
            root.style.left = newLeft + 'px';
            root.style.top = newTop + 'px';
        });
        document.addEventListener('mouseup', () => { dragging = false; });
    },

    pressKey(k) {
        if (!k || this.dialNumber.length >= 20) return;
        this.dialNumber += k;
        const disp = document.querySelector('.cc-dial-display');
        if (disp) disp.textContent = this.dialNumber;
    },

    clearDial() {
        this.dialNumber = this.dialNumber.slice(0, -1);
        const disp = document.querySelector('.cc-dial-display');
        if (disp) {
            if (this.dialNumber) disp.textContent = this.dialNumber;
            else disp.innerHTML = '<span style="color:#666;font-size:13px;">输入号码</span>';
        }
    },

    dial(number, customerName) {
        if (!number) { this._toast('请输入要拨打的号码', 'warning'); return; }
        if (this.currentState !== 'idle') { this._toast('当前状态无法发起呼叫', 'warning'); return; }
        this.callInfo = {
            direction: 'outbound',
            number: number,
            customerName: customerName || this._matchCustomerName(number) || '',
            startAt: Date.now()
        };
        this.currentState = 'ringing';
        this.isMinimized = false;
        this.render();
        this._toast('正在呼叫 ' + number + '...', 'info');
        this._clearRingingTimer();
        this.ringingTimer = setTimeout(() => {
            if (this.currentState === 'ringing') this._enterTalking();
        }, 2000);
    },

    answer() {
        if (this.currentState !== 'ringing') return;
        this._clearRingingTimer();
        this._enterTalking();
        this._toast('已接听', 'success');
    },

    _enterTalking() {
        this.currentState = 'talking';
        this.callDuration = 0;
        this.callInfo = this.callInfo || {};
        this.callInfo.connectAt = Date.now();
        this._clearCallTimer();
        this.callTimer = setInterval(() => {
            this.callDuration++;
            const t = document.querySelector('.cc-call-timer');
            if (t) t.textContent = this._formatDuration(this.callDuration);
        }, 1000);
        this.render();
    },

    hangup() {
        if (this.currentState === 'idle') return;
        const wasTalking = this.currentState === 'talking';
        const wasRinging = this.currentState === 'ringing';
        this._clearCallTimer();
        this._clearRingingTimer();
        const info = this.callInfo || {};
        info.lastDuration = this.callDuration;
        info.endAt = Date.now();
        this._saveCallRecord(info, wasTalking ? 'connected' : (wasRinging && info.direction === 'inbound' ? 'missed' : 'canceled'));
        if (typeof CCCallPopup !== 'undefined') CCCallPopup.hide();
        if (wasTalking) {
            this.currentState = 'afterwork';
            this.afterworkRemain = 25;
            this.callInfo = info;
            this.render();
            this._startAfterworkTimer();
            this._toast('通话已结束，进入后处理', 'info');
        } else {
            this._resetToIdle();
            this._toast(wasRinging ? '已拒接' : '已挂断', 'info');
        }
    },

    hold() { if (this.currentState !== 'talking') return; this.isHeld = true; this.render(); this._toast('已保持通话', 'info'); },
    unhold() { if (this.currentState !== 'talking') return; this.isHeld = false; this.render(); this._toast('已恢复通话', 'info'); },
    mute() { if (this.currentState !== 'talking') return; this.isMuted = true; this.render(); this._toast('已静音', 'info'); },
    unmute() { if (this.currentState !== 'talking') return; this.isMuted = false; this.render(); this._toast('已取消静音', 'info'); },

    transfer() {
        if (this.currentState !== 'talking') return;
        const target = window.prompt('请输入转接目标坐席工号或号码：');
        if (!target) return;
        this._toast('已发起转接 → ' + target, 'success');
    },

    simulateIncomingCall(number, customerName) {
        if (this.currentState !== 'idle') { this._toast('当前状态无法接收来电', 'warning'); return; }
        const phones = ['13812345678', '13987654321', '13601234567', '15901234567', '18912345678'];
        const num = number || phones[Math.floor(Math.random() * phones.length)];
        const matched = this._matchCustomer(num);
        const name = customerName || (matched ? matched.name : '') || '';
        this.callInfo = {
            direction: 'inbound',
            number: num,
            customerName: name,
            source: matched ? matched.source : '陌生来电',
            customerId: matched ? matched.id : null,
            startAt: Date.now()
        };
        this.currentState = 'ringing';
        this.isMinimized = false;
        this.render();
        if (typeof CCCallPopup !== 'undefined') CCCallPopup.show(num);
        this._toast('来电：' + num, 'info');
    },

    _startAfterworkTimer() {
        this._clearAfterworkTimer();
        this.afterworkTimer = setInterval(() => {
            this.afterworkRemain--;
            const span = document.getElementById('cc-sp-aw-remain');
            if (span) span.textContent = this.afterworkRemain;
            if (this.afterworkRemain <= 0) this._finishAfterwork();
        }, 1000);
    },

    _finishAfterwork() {
        this._clearAfterworkTimer();
        this._toast('后处理完成', 'success');
        this._resetToIdle();
    },

    _resetToIdle() {
        this.currentState = 'idle';
        this.callInfo = null;
        this.callDuration = 0;
        this.isMuted = false;
        this.isHeld = false;
        this.dialNumber = '';
        this.render();
    },

    _clearCallTimer() { if (this.callTimer) { clearInterval(this.callTimer); this.callTimer = null; } },
    _clearAfterworkTimer() { if (this.afterworkTimer) { clearInterval(this.afterworkTimer); this.afterworkTimer = null; } },
    _clearRingingTimer() { if (this.ringingTimer) { clearTimeout(this.ringingTimer); this.ringingTimer = null; } },

    _formatDuration(s) {
        s = Math.max(0, parseInt(s) || 0);
        const m = Math.floor(s / 60);
        const ss = s % 60;
        return (m < 10 ? '0' : '') + m + ':' + (ss < 10 ? '0' : '') + ss;
    },

    _maskPhone(p) {
        if (!p) return '';
        if (p.length < 7) return p;
        return p.slice(0, 3) + '****' + p.slice(-4);
    },

    _matchCustomer(phone) {
        if (!phone) return null;
        try {
            const leads = JSON.parse(localStorage.getItem('crm_leads') || '[]');
            const customers = JSON.parse(localStorage.getItem('crm_customers') || '[]');
            const norm = String(phone).replace(/\D/g, '');
            const lead = leads.find(l => String(l.phone || l.mobile || '').replace(/\D/g, '') === norm);
            if (lead) return { id: lead.id, name: lead.name || lead.contact_name || lead.company_name || '客户', source: '线索池', type: 'lead', raw: lead };
            const cust = customers.find(c => String(c.phone || c.mobile || c.contact_phone || '').replace(/\D/g, '') === norm);
            if (cust) return { id: cust.id, name: cust.name || cust.customer_name || cust.contact_name || '客户', source: '客户库', type: 'customer', raw: cust };
        } catch (e) {}
        return null;
    },

    _matchCustomerName(phone) {
        const m = this._matchCustomer(phone);
        return m ? m.name : '';
    },

    _getQuickDialList() {
        try {
            const leads = JSON.parse(localStorage.getItem('crm_leads') || '[]');
            return leads.filter(l => l.phone || l.mobile).slice(0, 4).map(l => ({
                name: l.name || l.contact_name || l.company_name || '客户',
                phone: String(l.phone || l.mobile || '')
            }));
        } catch (e) { return []; }
    },

    _saveCallRecord(info, status) {
        if (!info || !info.number) return;
        if (typeof CallRecordStorage === 'undefined') return;
        try {
            const matched = this._matchCustomer(info.number);
            CallRecordStorage.add({
                direction: info.direction || 'outbound',
                caller_no: info.direction === 'inbound' ? info.number : '',
                callee_no: info.direction === 'outbound' ? info.number : '',
                customer_name: info.customerName || (matched ? matched.name : ''),
                customer_id: info.customerId || (matched ? matched.id : null),
                duration: info.lastDuration || 0,
                status: status,
                start_at: info.startAt,
                connect_at: info.connectAt || null,
                end_at: info.endAt || Date.now()
            });
        } catch (e) {}
    },

    _toast(msg, type) {
        if (typeof ccShowToast === 'function') ccShowToast(msg, type || 'info');
    }
};

/* ========================================================================
   15. CCCallPopup —— 来电弹屏
   ======================================================================== */
const CCCallPopup = {
    isVisible: false,
    callData: null,

    show(phoneNumber) {
        this.callData = {
            phone: phoneNumber,
            location: this._guessLocation(phoneNumber),
            matched: this.matchCustomer(phoneNumber),
            history: this._getHistory(phoneNumber),
            startAt: Date.now()
        };
        this._ensureRoot();
        this.render();
        this.isVisible = true;
        const root = document.getElementById('cc-callpopup-root');
        if (root) requestAnimationFrame(() => root.classList.add('visible'));
    },

    hide() {
        const root = document.getElementById('cc-callpopup-root');
        if (root) {
            root.classList.remove('visible');
            setTimeout(() => { const r = document.getElementById('cc-callpopup-root'); if (r) r.innerHTML = ''; }, 350);
        }
        this.isVisible = false;
    },

    _ensureRoot() {
        let root = document.getElementById('cc-callpopup-root');
        if (root) return;
        root = document.createElement('div');
        root.id = 'cc-callpopup-root';
        root.className = 'cc-popup-overlay';
        document.body.appendChild(root);
        root.addEventListener('click', (e) => {
            const target = e.target.closest('[data-cc-pop-action]');
            if (!target) return;
            const action = target.getAttribute('data-cc-pop-action');
            if (action === 'close') this.hide();
            else if (action === 'create-followup') this._actionFollowup();
            else if (action === 'transfer') this._actionTransfer();
            else if (action === 'note') this._actionNote();
            else if (action === 'answer') { if (typeof CCSoftPhone !== 'undefined') CCSoftPhone.answer(); }
        });
    },

    render() {
        const root = document.getElementById('cc-callpopup-root');
        if (!root || !this.callData) return;
        const d = this.callData;
        const m = d.matched;
        let custHtml;
        if (m) {
            const r = m.raw || {};
            custHtml = '<div class="cc-popup-customer-info">'
                     + '<div class="cc-popup-info-row"><span class="cc-popup-info-label">客户名称</span><span class="cc-popup-info-value">' + (r.company_name || r.customer_name || m.name || '-') + '</span></div>'
                     + '<div class="cc-popup-info-row"><span class="cc-popup-info-label">联系人</span><span class="cc-popup-info-value">' + (r.contact_name || r.name || m.name || '-') + '</span></div>'
                     + '<div class="cc-popup-info-row"><span class="cc-popup-info-label">来源</span><span class="cc-popup-info-value">' + (m.source || '-') + (r.source ? ' · ' + r.source : '') + '</span></div>'
                     + '<div class="cc-popup-info-row"><span class="cc-popup-info-label">意向等级</span><span class="cc-popup-info-value">' + (r.intent_level || '-') + '</span></div>'
                     + '<div class="cc-popup-info-row"><span class="cc-popup-info-label">上次联系</span><span class="cc-popup-info-value">' + (this._fmtDate(r.last_contact_at || r.updated_at)) + '</span></div>'
                     + '</div>';
        } else {
            custHtml = '<div class="cc-popup-customer-info" style="text-align:center;color:#A0A0B0;font-size:12px;padding:18px;">未匹配到客户/线索<br><span style="color:#666;font-size:11px;">建议创建新线索</span></div>';
        }
        let historyHtml = '';
        if (d.history.length === 0) {
            historyHtml = '<div style="color:#666;font-size:12px;text-align:center;padding:10px;">暂无历史通话</div>';
        } else {
            d.history.slice(0, 5).forEach(h => {
                const dirIcon = h.direction === 'inbound' ? '<i class="fa-solid fa-phone-volume" style="color:#5B8DEF;"></i>' : '<i class="fa-solid fa-phone" style="color:#00D084;"></i>';
                const statusTxt = h.status === 'connected' ? '接通' : (h.status === 'missed' ? '未接' : (h.status === 'canceled' ? '取消' : (h.status || '-')));
                const dur = this._fmtDur(h.duration || 0);
                historyHtml += '<div class="cc-popup-history-item">'
                            +   '<span style="width:24px;text-align:center;">' + dirIcon + '</span>'
                            +   '<span style="flex:1;color:#A0A0B0;">' + this._fmtDate(h.start_at || h.created_at) + '</span>'
                            +   '<span style="color:#fff;">' + statusTxt + '</span>'
                            +   '<span style="color:#D4AF37;font-variant-numeric:tabular-nums;">' + dur + '</span>'
                            + '</div>';
            });
        }
        root.innerHTML =
              '<div class="cc-popup-header">'
            +   '<div class="cc-popup-title"><i class="fa-solid fa-phone-volume" style="color:#FFB020;"></i> 来电弹屏</div>'
            +   '<button class="cc-softphone-ctrl-btn" data-cc-pop-action="close" title="关闭"><i class="fa-solid fa-xmark"></i></button>'
            + '</div>'
            + '<div class="cc-popup-body">'
            +   '<div class="cc-popup-section">'
            +     '<div class="cc-popup-phone"><i class="fa-solid fa-phone"></i> ' + d.phone + '</div>'
            +     '<div class="cc-popup-location">归属地：' + (d.location || '未知') + '</div>'
            +   '</div>'
            +   '<div class="cc-popup-section">'
            +     '<div class="cc-popup-section-title">客户信息</div>' + custHtml
            +   '</div>'
            +   '<div class="cc-popup-section">'
            +     '<div class="cc-popup-section-title">历史通话（最近 ' + Math.min(5, d.history.length) + ' 条）</div>' + historyHtml
            +   '</div>'
            +   '<div class="cc-popup-section">'
            +     '<div class="cc-popup-section-title">快捷操作</div>'
            +     '<div class="cc-popup-actions">'
            +       '<button class="cc-dial-btn cc-dial-btn-call" data-cc-pop-action="answer"><i class="fa-solid fa-phone"></i> 接听</button>'
            +       '<button class="cc-dial-btn cc-dial-btn-clear" data-cc-pop-action="create-followup">创建跟进</button>'
            +       '<button class="cc-dial-btn cc-dial-btn-clear" data-cc-pop-action="transfer">转接</button>'
            +       '<button class="cc-dial-btn cc-dial-btn-clear" data-cc-pop-action="note">备注</button>'
            +     '</div>'
            +   '</div>'
            + '</div>';
    },

    matchCustomer(phone) {
        if (typeof CCSoftPhone !== 'undefined' && CCSoftPhone._matchCustomer) return CCSoftPhone._matchCustomer(phone);
        return null;
    },

    _getHistory(phone) {
        if (typeof CallRecordStorage === 'undefined') return [];
        const norm = String(phone || '').replace(/\D/g, '');
        try {
            return CallRecordStorage.getAll().filter(r => {
                const a = String(r.caller_no || '').replace(/\D/g, '');
                const b = String(r.callee_no || '').replace(/\D/g, '');
                return a === norm || b === norm;
            }).sort((x, y) => (y.start_at || y.created_at || 0) - (x.start_at || x.created_at || 0));
        } catch (e) { return []; }
    },

    _guessLocation(phone) {
        if (!phone) return '未知';
        const p = String(phone).replace(/\D/g, '');
        const map = {
            '138': '浙江杭州', '139': '广东深圳', '136': '上海',
            '159': '北京', '189': '江苏南京', '137': '四川成都',
            '186': '广东广州', '135': '湖北武汉'
        };
        return map[p.slice(0, 3)] || '中国';
    },

    _fmtDate(ts) {
        if (!ts) return '-';
        try {
            const d = new Date(ts);
            if (isNaN(d.getTime())) return '-';
            const pad = n => (n < 10 ? '0' : '') + n;
            return (d.getMonth() + 1) + '-' + pad(d.getDate()) + ' ' + pad(d.getHours()) + ':' + pad(d.getMinutes());
        } catch (e) { return '-'; }
    },

    _fmtDur(s) {
        s = parseInt(s) || 0;
        const m = Math.floor(s / 60);
        const ss = s % 60;
        return (m < 10 ? '0' : '') + m + ':' + (ss < 10 ? '0' : '') + ss;
    },

    _actionFollowup() { if (typeof ccShowToast === 'function') ccShowToast('已记录跟进意向（演示）', 'success'); },
    _actionTransfer() { if (typeof CCSoftPhone !== 'undefined') CCSoftPhone.transfer(); },
    _actionNote() {
        const txt = window.prompt('请输入备注内容：');
        if (txt && typeof ccShowToast === 'function') ccShowToast('备注已保存（演示）', 'success');
    },

    bindEvents() { /* 事件已在 _ensureRoot 中绑定 */ }
};

/* ========================================================================
   16. 全局点击拨号入口 + 自动初始化
   ======================================================================== */
if (typeof window !== 'undefined') {
    window.ccClickToDial = function (number, customerName) {
        if (typeof CCSoftPhone === 'undefined') return;
        if (CCSoftPhone.currentState !== 'idle') {
            if (typeof ccShowToast === 'function') ccShowToast('当前已有通话进行中', 'warning');
            return;
        }
        CCSoftPhone.dialNumber = String(number || '');
        CCSoftPhone.isMinimized = false;
        CCSoftPhone.render();
        setTimeout(() => CCSoftPhone.dial(String(number || ''), customerName), 500);
    };
    window.CCSoftPhone = CCSoftPhone;
    window.CCCallPopup = CCCallPopup;
}

document.addEventListener('DOMContentLoaded', function () {
    setTimeout(() => {
        if (typeof CCSoftPhone !== 'undefined') {
            try { CCSoftPhone.init(); } catch (e) { console.warn('CCSoftPhone init failed:', e); }
        }
    }, 1000);
});
