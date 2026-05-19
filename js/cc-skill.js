/**
 * 呼叫中心 - 技能组与ACD分配模块（cc-skill.js）
 * 数据存储：localStorage（cc_skill_groups / cc_queues）
 * 暴露：window.CCSkill —— 供 CallCenter Tab 调用
 * UI风格：黑金奢华主题（cc-style.css）
 */

/* ========================================================================
   1. 常量定义
   ======================================================================== */
const CC_SKILL_KEYS = {
    GROUPS: 'cc_skill_groups',
    QUEUES: 'cc_queues'
};

// 8种ACD分配策略
const ASSIGN_STRATEGIES = [
    { id: 'round_robin',    name: '轮询分配',  icon: '⟳', desc: '按顺序轮流分配给坐席',                 hint: '保证坐席接听机会均等，适用于通用客服场景' },
    { id: 'least_calls',    name: '最少接听',  icon: '⌽', desc: '分配给今日接听最少的坐席',             hint: '优先空闲坐席，适合工作量平衡场景' },
    { id: 'longest_idle',   name: '最长空闲',  icon: '⌚', desc: '分配给空闲时间最长的坐席',             hint: '减少坐席等待焦虑，提升接通速度' },
    { id: 'random',         name: '随机分配',  icon: '※', desc: '随机选择一个空闲坐席',                 hint: '简单公平，适用于业务能力一致的小型团队' },
    { id: 'weighted',       name: '加权随机',  icon: '⚖', desc: '按坐席权重随机分配',                   hint: '可基于坐席等级或业绩调整分配概率' },
    { id: 'skill_priority', name: '技能优先',  icon: '★', desc: '优先分配给技能匹配度最高的坐席',       hint: '基于技能标签命中率，适合多技能复杂场景' },
    { id: 'vip_dedicated',  name: 'VIP专线',   icon: '◆', desc: 'VIP客户分配给指定高级坐席',             hint: '识别VIP来电并直接路由到专属团队' },
    { id: 'last_served',    name: '上次服务',  icon: '⌖', desc: '分配给上次服务该客户的坐席',           hint: '提升客户体验连续性，降低重复沟通成本' }
];

const BIZ_TYPES = [
    { id: 'presale',  name: '售前咨询' },
    { id: 'aftersale', name: '售后服务' },
    { id: 'tech',     name: '技术支持' },
    { id: 'complaint', name: '投诉处理' },
    { id: 'vip',      name: 'VIP服务' }
];

const QUEUE_PRIORITY_MAP = {
    1: { label: '普通', color: '#8B7BFF' },
    2: { label: '加急', color: '#D4AF37' },
    3: { label: '紧急', color: '#FF6B35' },
    4: { label: 'VIP',  color: '#F4D03F' }
};

/* ========================================================================
   2. SkillGroupStorage —— 技能组存储层
   ======================================================================== */
const SkillGroupStorage = {
    getAll() {
        try {
            const raw = localStorage.getItem(CC_SKILL_KEYS.GROUPS);
            const list = raw ? JSON.parse(raw) : [];
            return list.filter(g => !g.deleted);
        } catch (e) {
            console.error('[SkillGroupStorage.getAll]', e);
            return [];
        }
    },
    _getAllRaw() {
        try {
            const raw = localStorage.getItem(CC_SKILL_KEYS.GROUPS);
            return raw ? JSON.parse(raw) : [];
        } catch (e) { return []; }
    },
    _saveAll(list) {
        localStorage.setItem(CC_SKILL_KEYS.GROUPS, JSON.stringify(list));
    },
    getById(id) {
        return this.getAll().find(g => g.id === id) || null;
    },
    add(group) {
        const list = this._getAllRaw();
        group.id = group.id || ccGenerateId('skill_');
        group.created_at = Date.now();
        group.updated_at = Date.now();
        group.deleted = false;
        if (!Array.isArray(group.agent_ids)) group.agent_ids = [];
        list.push(group);
        this._saveAll(list);
        return group;
    },
    update(group) {
        const list = this._getAllRaw();
        const idx = list.findIndex(g => g.id === group.id);
        if (idx === -1) return null;
        group.updated_at = Date.now();
        list[idx] = Object.assign({}, list[idx], group);
        this._saveAll(list);
        return list[idx];
    },
    delete(id) {
        const list = this._getAllRaw();
        const idx = list.findIndex(g => g.id === id);
        if (idx === -1) return false;
        list[idx].deleted = true;
        list[idx].updated_at = Date.now();
        this._saveAll(list);
        return true;
    },
    isNameExist(name, excludeId) {
        return this.getAll().some(g => g.name === name && g.id !== excludeId);
    }
};

/* ========================================================================
   3. QueueStorage —— 排队呼叫存储层
   ======================================================================== */
const QueueStorage = {
    getAll() {
        try {
            const raw = localStorage.getItem(CC_SKILL_KEYS.QUEUES);
            const list = raw ? JSON.parse(raw) : [];
            return list.filter(q => !q.deleted);
        } catch (e) {
            console.error('[QueueStorage.getAll]', e);
            return [];
        }
    },
    _getAllRaw() {
        try {
            const raw = localStorage.getItem(CC_SKILL_KEYS.QUEUES);
            return raw ? JSON.parse(raw) : [];
        } catch (e) { return []; }
    },
    _saveAll(list) {
        localStorage.setItem(CC_SKILL_KEYS.QUEUES, JSON.stringify(list));
    },
    getByGroupId(groupId) {
        return this.getAll().filter(q => q.group_id === groupId && q.status === 'waiting');
    },
    add(queue) {
        const list = this._getAllRaw();
        queue.id = queue.id || ccGenerateId('queue_');
        queue.entered_at = queue.entered_at || Date.now();
        queue.deleted = false;
        if (!queue.status) queue.status = 'waiting';
        list.push(queue);
        this._saveAll(list);
        return queue;
    },
    update(queue) {
        const list = this._getAllRaw();
        const idx = list.findIndex(q => q.id === queue.id);
        if (idx === -1) return null;
        list[idx] = Object.assign({}, list[idx], queue);
        this._saveAll(list);
        return list[idx];
    },
    delete(id) {
        const list = this._getAllRaw();
        const idx = list.findIndex(q => q.id === id);
        if (idx === -1) return false;
        list[idx].deleted = true;
        this._saveAll(list);
        return true;
    },
    clearByGroupId(groupId) {
        const list = this._getAllRaw();
        list.forEach(q => { if (q.group_id === groupId) q.deleted = true; });
        this._saveAll(list);
    }
};

/* ========================================================================
   4. 工具函数
   ======================================================================== */
function _ccSkillGetStrategy(id) {
    return ASSIGN_STRATEGIES.find(s => s.id === id) || ASSIGN_STRATEGIES[0];
}
function _ccSkillGetBizType(id) {
    return BIZ_TYPES.find(b => b.id === id) || BIZ_TYPES[0];
}
function _ccSkillFormatDuration(sec) {
    sec = Math.max(0, parseInt(sec, 10) || 0);
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return (m < 10 ? '0' + m : m) + ':' + (s < 10 ? '0' + s : s);
}
function _ccSkillGetAgents() {
    if (window.AgentStorage && typeof window.AgentStorage.getAll === 'function') {
        return window.AgentStorage.getAll();
    }
    try {
        const raw = localStorage.getItem('cc_agents');
        const list = raw ? JSON.parse(raw) : [];
        return list.filter(a => !a.deleted);
    } catch (e) { return []; }
}
function _ccSkillStatusOf(agent) {
    const map = window.AGENT_STATUS_MAP || {
        0: { label: '离线', css: 'cc-status-offline' },
        1: { label: '就绪', css: 'cc-status-online' },
        2: { label: '通话中', css: 'cc-status-busy' },
        3: { label: '小休', css: 'cc-status-break' },
        4: { label: '后处理', css: 'cc-status-busy' },
        5: { label: '培训', css: 'cc-status-break' },
        6: { label: '会议', css: 'cc-status-break' }
    };
    return map[agent.status] || map[0];
}
function _ccSkillIsOnline(agent) {
    return agent.status !== undefined && agent.status !== 0;
}

/* ========================================================================
   5. CCSkill —— 主对象
   ======================================================================== */
const CCSkill = {
    container: null,
    currentView: 'groups',          // groups | detail | queues
    selectedGroupId: null,
    searchKeyword: '',
    eventHandlers: [],
    _modalDelegate: null,

    /* ---------- 入口 ---------- */
    render(container) {
        this.container = container || this.container || document.querySelector('.content-area') || document.body;
        if (!this.container) return;
        this.initSeedData();
        this._unbindEvents();

        let html = '<div class="cc-skill-root">';
        // 内层子导航
        html += this._renderSubNav();

        if (this.currentView === 'detail' && this.selectedGroupId) {
            html += this.renderGroupDetail(this.selectedGroupId);
        } else if (this.currentView === 'queues') {
            html += this.renderQueues();
        } else {
            html += this.renderGroupList();
        }

        html += '</div>';

        // 注入样式（仅注入一次）
        this._injectStyles();

        // 写入容器
        this.container.innerHTML = html;
        this._bindEvents();
    },

    _renderSubNav() {
        const groups = SkillGroupStorage.getAll();
        const totalQueueing = QueueStorage.getAll().filter(q => q.status === 'waiting').length;

        let html = '<div class="cc-skill-subnav">';
        html += '<div class="cc-skill-subnav-tabs">';
        html += '<button class="cc-skill-subtab' + (this.currentView !== 'queues' ? ' active' : '') + '" data-action="ccs-view-groups">';
        html += '<span class="cc-skill-subtab-ico">⌬</span>';
        html += '<span>技能组管理</span>';
        html += '<span class="cc-skill-subtab-badge">' + groups.length + '</span>';
        html += '</button>';
        html += '<button class="cc-skill-subtab' + (this.currentView === 'queues' ? ' active' : '') + '" data-action="ccs-view-queues">';
        html += '<span class="cc-skill-subtab-ico">⏳</span>';
        html += '<span>排队管理</span>';
        html += '<span class="cc-skill-subtab-badge cc-skill-subtab-badge-hot">' + totalQueueing + '</span>';
        html += '</button>';
        html += '</div>';
        html += '<div class="cc-skill-subnav-meta">ACD · AUTOMATIC CALL DISTRIBUTION</div>';
        html += '</div>';
        return html;
    },

    /* ====================================================================
       6. 技能组列表
       ==================================================================== */
    renderGroupList() {
        let groups = SkillGroupStorage.getAll();
        const kw = (this.searchKeyword || '').trim().toLowerCase();
        if (kw) {
            groups = groups.filter(g =>
                (g.name || '').toLowerCase().includes(kw) ||
                (_ccSkillGetBizType(g.biz_type).name || '').toLowerCase().includes(kw) ||
                (_ccSkillGetStrategy(g.assign_strategy).name || '').toLowerCase().includes(kw)
            );
        }
        // 按优先级降序
        groups.sort((a, b) => (b.priority || 0) - (a.priority || 0));

        const agents = _ccSkillGetAgents();
        const allQueues = QueueStorage.getAll().filter(q => q.status === 'waiting');

        let html = '';
        // 工具栏
        html += '<div class="cc-toolbar">';
        html += '<div style="position:relative;flex:1;min-width:240px;">';
        html += '<span style="position:absolute;left:12px;top:50%;transform:translateY(-50%);color:var(--cc-text-muted);font-size:14px;">⌕</span>';
        html += '<input type="text" class="cc-search-input" data-ccs-search placeholder="搜索技能组名称 / 业务类型 / 策略..." value="' + ccEscapeHtml(this.searchKeyword) + '">';
        html += '</div>';
        html += '<button class="cc-btn cc-btn-outline" data-action="ccs-refresh">⟳ 刷新</button>';
        html += '<button class="cc-btn cc-btn-primary" data-action="ccs-new-group">＋ 新建技能组</button>';
        html += '</div>';

        // 全局统计条
        const totalAgents = agents.length;
        const onlineAgents = agents.filter(_ccSkillIsOnline).length;
        const totalQueueing = allQueues.length;
        const longestWait = allQueues.reduce((m, q) => Math.max(m, Math.floor((Date.now() - q.entered_at) / 1000)), 0);

        html += '<div class="cc-skill-overview">';
        html += this._overviewItem('技能组总数', groups.length, '⌬');
        html += this._overviewItem('在线坐席', onlineAgents + ' / ' + totalAgents, '◉');
        html += this._overviewItem('当前排队', totalQueueing, '⏳');
        html += this._overviewItem('最长等待', _ccSkillFormatDuration(longestWait), '⌚');
        html += '</div>';

        // 卡片网格
        if (groups.length === 0) {
            html += '<div class="cc-empty">';
            html += '<div class="cc-empty-icon">∅</div>';
            html += '<div class="cc-empty-text">' + (kw ? '未找到匹配的技能组' : '暂无技能组，点击"新建技能组"开始配置') + '</div>';
            html += '</div>';
            return html;
        }

        html += '<div class="cc-skill-grid">';
        groups.forEach(g => {
            const strategy = _ccSkillGetStrategy(g.assign_strategy);
            const bizType = _ccSkillGetBizType(g.biz_type);
            const groupAgents = agents.filter(a => (g.agent_ids || []).indexOf(a.id) !== -1);
            const onlineCount = groupAgents.filter(_ccSkillIsOnline).length;
            const queueCount = allQueues.filter(q => q.group_id === g.id).length;
            const fullness = groupAgents.length > 0 ? Math.round(onlineCount / groupAgents.length * 100) : 0;

            html += '<div class="cc-skill-card" data-action="ccs-view-detail" data-group-id="' + g.id + '">';
            // 顶部装饰条
            html += '<div class="cc-skill-card-stripe"></div>';

            // 头部
            html += '<div class="cc-skill-card-head">';
            html += '<div class="cc-skill-card-title-wrap">';
            html += '<div class="cc-skill-card-title">' + ccEscapeHtml(g.name) + '</div>';
            html += '<span class="cc-skill-biz-tag">' + ccEscapeHtml(bizType.name) + '</span>';
            html += '</div>';
            html += '<div class="cc-skill-card-priority">P' + (g.priority || 1) + '</div>';
            html += '</div>';

            // 策略卡
            html += '<div class="cc-skill-strategy-row">';
            html += '<div class="cc-skill-strategy-icon">' + strategy.icon + '</div>';
            html += '<div>';
            html += '<div class="cc-skill-strategy-name">' + ccEscapeHtml(strategy.name) + '</div>';
            html += '<div class="cc-skill-strategy-desc">' + ccEscapeHtml(strategy.desc) + '</div>';
            html += '</div>';
            html += '</div>';

            // 数据区
            html += '<div class="cc-skill-metrics">';
            html += '<div class="cc-skill-metric">';
            html += '<div class="cc-skill-metric-num"><span style="color:var(--cc-status-online);">' + onlineCount + '</span><span class="cc-skill-metric-sep">/</span>' + groupAgents.length + '</div>';
            html += '<div class="cc-skill-metric-label">在线坐席</div>';
            html += '</div>';
            html += '<div class="cc-skill-metric">';
            html += '<div class="cc-skill-metric-num">' + queueCount + '</div>';
            html += '<div class="cc-skill-metric-label">排队中</div>';
            html += '</div>';
            html += '<div class="cc-skill-metric">';
            html += '<div class="cc-skill-metric-num">' + (g.max_queue_wait || 0) + '<span class="cc-skill-metric-unit">s</span></div>';
            html += '<div class="cc-skill-metric-label">最大等待</div>';
            html += '</div>';
            html += '</div>';

            // 进度条 - 在线率
            html += '<div class="cc-skill-progress-wrap">';
            html += '<div class="cc-skill-progress-label">';
            html += '<span>团队在线率</span>';
            html += '<span style="color:var(--cc-gold);">' + fullness + '%</span>';
            html += '</div>';
            html += '<div class="cc-skill-progress"><div class="cc-skill-progress-bar" style="width:' + fullness + '%;"></div></div>';
            html += '</div>';

            // 操作按钮
            html += '<div class="cc-skill-card-actions" data-stop-prop>';
            html += '<button class="cc-btn cc-btn-outline cc-btn-sm" data-action="ccs-view-detail" data-group-id="' + g.id + '">查看详情</button>';
            html += '<button class="cc-btn cc-btn-outline cc-btn-sm" data-action="ccs-edit-group" data-group-id="' + g.id + '">编辑</button>';
            html += '<button class="cc-btn cc-btn-sm cc-skill-danger-btn" data-action="ccs-delete-group" data-group-id="' + g.id + '">删除</button>';
            html += '</div>';

            html += '</div>'; // .cc-skill-card
        });
        html += '</div>'; // .cc-skill-grid

        return html;
    },

    _overviewItem(label, value, icon) {
        let html = '<div class="cc-skill-overview-item">';
        html += '<div class="cc-skill-overview-icon">' + icon + '</div>';
        html += '<div>';
        html += '<div class="cc-skill-overview-value">' + ccEscapeHtml(String(value)) + '</div>';
        html += '<div class="cc-skill-overview-label">' + ccEscapeHtml(label) + '</div>';
        html += '</div>';
        html += '</div>';
        return html;
    },

    /* ====================================================================
       7. 技能组详情
       ==================================================================== */
    renderGroupDetail(groupId) {
        const g = SkillGroupStorage.getById(groupId);
        if (!g) {
            return '<div class="cc-empty"><div class="cc-empty-icon">∅</div><div class="cc-empty-text">技能组不存在或已被删除</div></div>';
        }

        const strategy = _ccSkillGetStrategy(g.assign_strategy);
        const bizType = _ccSkillGetBizType(g.biz_type);
        const allAgents = _ccSkillGetAgents();
        const memberAgents = allAgents.filter(a => (g.agent_ids || []).indexOf(a.id) !== -1);
        const queues = QueueStorage.getByGroupId(groupId);
        const overflow = g.overflow_target_id ? SkillGroupStorage.getById(g.overflow_target_id) : null;

        let html = '';

        // 返回栏
        html += '<div class="cc-skill-breadcrumb">';
        html += '<button class="cc-btn cc-btn-outline cc-btn-sm" data-action="ccs-back-list">← 返回列表</button>';
        html += '<span style="color:var(--cc-text-muted);font-size:12px;letter-spacing:.5px;">技能组管理 / ' + ccEscapeHtml(g.name) + '</span>';
        html += '</div>';

        // 顶部Hero卡
        html += '<div class="cc-skill-hero">';
        html += '<div class="cc-skill-hero-stripe"></div>';
        html += '<div class="cc-skill-hero-main">';
        html += '<div class="cc-skill-hero-left">';
        html += '<div class="cc-skill-hero-icon">' + strategy.icon + '</div>';
        html += '<div>';
        html += '<div class="cc-skill-hero-title">' + ccEscapeHtml(g.name) + '</div>';
        html += '<div class="cc-skill-hero-sub">';
        html += '<span class="cc-skill-biz-tag">' + ccEscapeHtml(bizType.name) + '</span>';
        html += '<span class="cc-skill-hero-divider"></span>';
        html += '<span>分配策略 · <strong style="color:var(--cc-gold);">' + ccEscapeHtml(strategy.name) + '</strong></span>';
        html += '<span class="cc-skill-hero-divider"></span>';
        html += '<span>优先级 · <strong style="color:var(--cc-gold);">P' + (g.priority || 1) + '</strong></span>';
        html += '</div>';
        html += '</div>';
        html += '</div>';
        html += '<div class="cc-skill-hero-actions">';
        html += '<button class="cc-btn cc-btn-outline" data-action="ccs-edit-group" data-group-id="' + g.id + '">✎ 编辑配置</button>';
        html += '<button class="cc-btn cc-btn-primary" data-action="ccs-add-member" data-group-id="' + g.id + '">＋ 添加成员</button>';
        html += '</div>';
        html += '</div>';
        html += '</div>';

        // 两栏布局
        html += '<div class="cc-skill-detail-grid">';

        // 左侧
        html += '<div class="cc-skill-detail-col">';

        // 基本信息
        html += '<div class="cc-card">';
        html += '<div class="cc-card-header"><div class="cc-card-title">▣ 基本信息</div></div>';
        html += this._kvRow('技能组名称', g.name);
        html += this._kvRow('业务类型', bizType.name);
        html += this._kvRow('分配策略', strategy.name + '（' + strategy.desc + '）');
        html += this._kvRow('优先级', 'P' + (g.priority || 1));
        html += this._kvRow('最大排队等待', (g.max_queue_wait || 0) + ' 秒');
        html += this._kvRow('溢出目标', overflow ? overflow.name : '—');
        html += this._kvRow('工作时间', (g.work_time_start || '00:00') + ' — ' + (g.work_time_end || '23:59'));
        html += this._kvRow('成员数量', memberAgents.length);
        html += '</div>';

        // 成员列表
        html += '<div class="cc-card">';
        html += '<div class="cc-card-header">';
        html += '<div class="cc-card-title">◇ 成员列表 <span style="color:var(--cc-text-muted);font-size:12px;font-weight:400;margin-left:8px;">共 ' + memberAgents.length + ' 人</span></div>';
        html += '<button class="cc-btn cc-btn-outline cc-btn-sm" data-action="ccs-add-member" data-group-id="' + g.id + '">＋ 添加</button>';
        html += '</div>';

        if (memberAgents.length === 0) {
            html += '<div class="cc-empty"><div class="cc-empty-icon">∅</div><div class="cc-empty-text">尚未添加成员，点击右上角"添加"</div></div>';
        } else {
            html += '<div class="cc-skill-member-list">';
            memberAgents.forEach(a => {
                const st = _ccSkillStatusOf(a);
                html += '<div class="cc-skill-member-item">';
                html += '<div class="cc-skill-member-avatar">' + ccEscapeHtml((a.name || '?').substr(0, 1)) + '</div>';
                html += '<div class="cc-skill-member-info">';
                html += '<div class="cc-skill-member-name">' + ccEscapeHtml(a.name) + '<span class="cc-skill-member-no">' + ccEscapeHtml(a.agent_no) + '</span></div>';
                html += '<div class="cc-skill-member-meta">分机 ' + ccEscapeHtml(a.extension || '-') + ' · 今日 ' + (a.today_calls || 0) + ' 通</div>';
                html += '</div>';
                html += '<span class="cc-status ' + st.css + '"><span class="cc-status-dot"></span>' + st.label + '</span>';
                html += '<button class="cc-btn cc-btn-sm cc-skill-danger-btn" data-action="ccs-remove-member" data-group-id="' + g.id + '" data-agent-id="' + a.id + '">移除</button>';
                html += '</div>';
            });
            html += '</div>';
        }
        html += '</div>';
        html += '</div>'; // 左侧

        // 右侧
        html += '<div class="cc-skill-detail-col">';

        // 策略详情卡
        html += '<div class="cc-card">';
        html += '<div class="cc-card-header"><div class="cc-card-title">⚡ 当前策略</div>';
        html += '<button class="cc-btn cc-btn-outline cc-btn-sm" data-action="ccs-strategy-detail" data-strategy-id="' + strategy.id + '">查看说明 →</button>';
        html += '</div>';
        html += '<div class="cc-skill-strategy-spotlight">';
        html += '<div class="cc-skill-strategy-spotlight-icon">' + strategy.icon + '</div>';
        html += '<div class="cc-skill-strategy-spotlight-title">' + ccEscapeHtml(strategy.name) + '</div>';
        html += '<div class="cc-skill-strategy-spotlight-hint">' + ccEscapeHtml(strategy.hint) + '</div>';
        html += '</div>';
        html += '</div>';

        // 溢出规则
        html += '<div class="cc-card">';
        html += '<div class="cc-card-header"><div class="cc-card-title">↯ 溢出规则</div></div>';
        html += '<div style="font-size:13px;color:var(--cc-text-secondary);line-height:1.8;">';
        html += '当排队超过 <strong style="color:var(--cc-gold);">' + (g.max_queue_wait || 0) + ' 秒</strong> 仍未应答，';
        if (overflow) {
            html += '将自动转接至 <strong style="color:var(--cc-gold);">' + ccEscapeHtml(overflow.name) + '</strong>。';
        } else {
            html += '当前 <span style="color:var(--cc-status-ringing);">未配置溢出目标</span>，呼叫将提示客户稍后再拨。';
        }
        html += '</div>';
        html += '</div>';

        // 工作时间
        html += '<div class="cc-card">';
        html += '<div class="cc-card-header"><div class="cc-card-title">⌚ 工作时间</div></div>';
        html += '<div class="cc-skill-time-display">';
        html += '<div class="cc-skill-time-block"><div class="cc-skill-time-label">开始</div><div class="cc-skill-time-value">' + (g.work_time_start || '09:00') + '</div></div>';
        html += '<div class="cc-skill-time-arrow">→</div>';
        html += '<div class="cc-skill-time-block"><div class="cc-skill-time-label">结束</div><div class="cc-skill-time-value">' + (g.work_time_end || '18:00') + '</div></div>';
        html += '</div>';
        html += '<div style="margin-top:12px;font-size:12px;color:var(--cc-text-muted);">非工作时间将根据溢出规则路由或播放语音提示。</div>';
        html += '</div>';

        // 当前排队
        html += '<div class="cc-card">';
        html += '<div class="cc-card-header"><div class="cc-card-title">⏳ 当前排队 <span style="color:var(--cc-text-muted);font-size:12px;font-weight:400;margin-left:8px;">' + queues.length + ' 通</span></div></div>';
        if (queues.length === 0) {
            html += '<div class="cc-empty" style="padding:30px 20px;"><div class="cc-empty-icon">✓</div><div class="cc-empty-text">暂无排队呼叫，运行通畅</div></div>';
        } else {
            html += '<div class="cc-skill-mini-queue">';
            queues.slice(0, 5).forEach(q => {
                const wait = Math.floor((Date.now() - q.entered_at) / 1000);
                const pri = QUEUE_PRIORITY_MAP[q.priority] || QUEUE_PRIORITY_MAP[1];
                html += '<div class="cc-skill-mini-queue-item">';
                html += '<span style="color:' + pri.color + ';font-size:11px;font-weight:600;">' + pri.label + '</span>';
                html += '<span style="font-family:monospace;color:var(--cc-text-primary);">' + ccEscapeHtml(q.caller_no) + '</span>';
                html += '<span style="color:var(--cc-text-muted);font-size:12px;">等待 ' + _ccSkillFormatDuration(wait) + '</span>';
                html += '</div>';
            });
            html += '</div>';
        }
        html += '</div>';

        html += '</div>'; // 右侧
        html += '</div>'; // detail-grid

        return html;
    },

    _kvRow(label, value) {
        return '<div class="cc-skill-kv">'
             + '<div class="cc-skill-kv-k">' + ccEscapeHtml(label) + '</div>'
             + '<div class="cc-skill-kv-v">' + ccEscapeHtml(value == null || value === '' ? '-' : value) + '</div>'
             + '</div>';
    },

    /* ====================================================================
       8. 排队管理
       ==================================================================== */
    renderQueues() {
        const groups = SkillGroupStorage.getAll();
        const allQueues = QueueStorage.getAll().filter(q => q.status === 'waiting');
        const abandoned = QueueStorage.getAll().filter(q => q.status === 'abandoned');

        const totalQueueing = allQueues.length;
        const longestWait = allQueues.reduce((m, q) => Math.max(m, Math.floor((Date.now() - q.entered_at) / 1000)), 0);
        const avgWait = allQueues.length ? Math.floor(allQueues.reduce((s, q) => s + Math.floor((Date.now() - q.entered_at) / 1000), 0) / allQueues.length) : 0;

        let html = '';

        // 统计卡片
        html += '<div class="cc-stat-grid">';
        html += this._statCard('总排队数', totalQueueing, totalQueueing > 5 ? '⚠ 排队较多' : '✓ 通畅', totalQueueing > 5 ? 'warn' : 'ok');
        html += this._statCard('平均等待', _ccSkillFormatDuration(avgWait), '↗ 实时统计', 'ok');
        html += this._statCard('最长等待', _ccSkillFormatDuration(longestWait), longestWait > 60 ? '⚠ 超过1分钟' : '◉ 监控中', longestWait > 60 ? 'warn' : 'ok');
        html += this._statCard('今日放弃', abandoned.length, '∎ 累计统计', 'ok');
        html += '</div>';

        // 排队超时规则配置面板
        html += '<div class="cc-card" style="margin-bottom:20px;">';
        html += '<div class="cc-card-header"><div class="cc-card-title">⚙ 排队超时规则</div></div>';
        html += '<div class="cc-skill-rules">';
        html += '<div class="cc-skill-rule-item"><div class="cc-skill-rule-num">15s</div><div class="cc-skill-rule-text">播放<strong>等待提示音</strong>，告知客户当前排队位置</div></div>';
        html += '<div class="cc-skill-rule-item"><div class="cc-skill-rule-num">30s</div><div class="cc-skill-rule-text">播放<strong>第一段安抚音乐</strong>，提供"留下回拨号码"按键选项</div></div>';
        html += '<div class="cc-skill-rule-item"><div class="cc-skill-rule-num">60s</div><div class="cc-skill-rule-text">触发<strong>溢出策略</strong>，转接至备用技能组</div></div>';
        html += '<div class="cc-skill-rule-item"><div class="cc-skill-rule-num">120s</div><div class="cc-skill-rule-text">引导客户<strong>留言或预约回呼</strong>，主动挂断并记录</div></div>';
        html += '</div>';
        html += '</div>';

        // 按技能组分组
        if (groups.length === 0) {
            html += '<div class="cc-empty"><div class="cc-empty-icon">∅</div><div class="cc-empty-text">尚无技能组，请先创建</div></div>';
            return html;
        }

        groups.forEach(g => {
            const groupQueues = allQueues.filter(q => q.group_id === g.id)
                .sort((a, b) => (b.priority || 1) - (a.priority || 1) || a.entered_at - b.entered_at);
            const strategy = _ccSkillGetStrategy(g.assign_strategy);
            const bizType = _ccSkillGetBizType(g.biz_type);

            html += '<div class="cc-card" style="margin-bottom:16px;">';
            html += '<div class="cc-card-header">';
            html += '<div class="cc-card-title">';
            html += '<span style="color:var(--cc-gold);">' + strategy.icon + '</span> ' + ccEscapeHtml(g.name);
            html += ' <span class="cc-skill-biz-tag" style="margin-left:8px;">' + ccEscapeHtml(bizType.name) + '</span>';
            html += ' <span style="color:var(--cc-text-muted);font-size:12px;font-weight:400;margin-left:8px;">' + groupQueues.length + ' 通排队</span>';
            html += '</div>';
            html += '<button class="cc-btn cc-btn-outline cc-btn-sm" data-action="ccs-view-detail" data-group-id="' + g.id + '">查看技能组 →</button>';
            html += '</div>';

            if (groupQueues.length === 0) {
                html += '<div class="cc-empty" style="padding:30px 20px;"><div class="cc-empty-icon">✓</div><div class="cc-empty-text">该技能组无排队呼叫</div></div>';
            } else {
                html += '<div class="cc-table-wrapper"><table class="cc-table">';
                html += '<thead><tr><th style="width:60px;">序号</th><th>主叫号码</th><th>优先级</th><th>等待时长</th><th>进入时间</th><th style="text-align:right;width:280px;">操作</th></tr></thead><tbody>';
                groupQueues.forEach((q, idx) => {
                    const wait = Math.floor((Date.now() - q.entered_at) / 1000);
                    const pri = QUEUE_PRIORITY_MAP[q.priority] || QUEUE_PRIORITY_MAP[1];
                    const waitClass = wait > 60 ? 'cc-skill-wait-danger' : (wait > 30 ? 'cc-skill-wait-warn' : 'cc-skill-wait-ok');
                    html += '<tr>';
                    html += '<td><span class="cc-skill-queue-rank">' + (idx + 1) + '</span></td>';
                    html += '<td style="font-family:monospace;color:var(--cc-text-primary);font-weight:600;">' + ccEscapeHtml(q.caller_no) + '</td>';
                    html += '<td><span class="cc-skill-priority-tag" style="color:' + pri.color + ';border-color:' + pri.color + ';">' + pri.label + '</span></td>';
                    html += '<td><span class="' + waitClass + '">' + _ccSkillFormatDuration(wait) + '</span></td>';
                    html += '<td style="color:var(--cc-text-secondary);font-size:12px;">' + ccFormatDateTime(q.entered_at) + '</td>';
                    html += '<td style="text-align:right;white-space:nowrap;">';
                    html += '<button class="cc-btn cc-btn-outline cc-btn-sm" data-action="ccs-queue-up" data-queue-id="' + q.id + '" title="提升优先级">↑</button> ';
                    html += '<button class="cc-btn cc-btn-outline cc-btn-sm" data-action="ccs-queue-down" data-queue-id="' + q.id + '" title="降低优先级">↓</button> ';
                    html += '<button class="cc-btn cc-btn-outline cc-btn-sm" data-action="ccs-queue-transfer" data-queue-id="' + q.id + '">转接</button> ';
                    html += '<button class="cc-btn cc-btn-sm cc-skill-danger-btn" data-action="ccs-queue-remove" data-queue-id="' + q.id + '">移出</button>';
                    html += '</td>';
                    html += '</tr>';
                });
                html += '</tbody></table></div>';
            }

            html += '</div>';
        });

        return html;
    },

    _statCard(label, value, extra, tone) {
        const toneColor = tone === 'warn' ? 'var(--cc-status-ringing)' : 'var(--cc-text-muted)';
        let html = '<div class="cc-stat-card">';
        html += '<div class="cc-stat-value">' + ccEscapeHtml(String(value)) + '</div>';
        html += '<div class="cc-stat-label">' + ccEscapeHtml(label) + '</div>';
        if (extra) {
            html += '<div style="margin-top:8px;font-size:11px;color:' + toneColor + ';letter-spacing:.5px;">' + ccEscapeHtml(extra) + '</div>';
        }
        html += '</div>';
        return html;
    },

    /* ====================================================================
       9. 模态框 - 新增/编辑技能组
       ==================================================================== */
    showGroupModal(groupId) {
        const isEdit = !!groupId;
        const g = isEdit ? SkillGroupStorage.getById(groupId) : {
            name: '', biz_type: 'presale', assign_strategy: 'round_robin',
            priority: 5, max_queue_wait: 60, overflow_target_id: '',
            work_time_start: '09:00', work_time_end: '18:00', agent_ids: []
        };
        if (isEdit && !g) { ccShowToast('技能组不存在', 'error'); return; }

        ccCloseModal();
        const allGroups = SkillGroupStorage.getAll().filter(x => x.id !== groupId);

        const overlay = document.createElement('div');
        overlay.className = 'cc-modal-overlay';
        overlay.dataset.modal = 'ccs-group-form';

        let body = '<div class="cc-modal" style="max-width:760px;">';
        body += '<div class="cc-modal-header">';
        body += '<div class="cc-modal-title">' + (isEdit ? '✎ 编辑技能组' : '＋ 新建技能组') + '</div>';
        body += '<button class="cc-modal-close" data-action="ccs-close-modal">×</button>';
        body += '</div>';
        body += '<div class="cc-modal-body">';
        body += '<form data-ccs-group-form>';
        if (isEdit) body += '<input type="hidden" name="id" value="' + ccEscapeHtml(g.id) + '">';

        // 名称 + 业务类型
        body += '<div class="cc-grid-2">';
        body += '<div class="cc-form-group">';
        body += '<label class="cc-form-label">技能组名称 <span style="color:var(--cc-btn-hangup);">*</span></label>';
        body += '<input class="cc-form-input" type="text" name="name" value="' + ccEscapeHtml(g.name) + '" required placeholder="如：销售一部">';
        body += '</div>';
        body += '<div class="cc-form-group">';
        body += '<label class="cc-form-label">业务类型</label>';
        body += '<select class="cc-form-select" name="biz_type">';
        BIZ_TYPES.forEach(b => {
            body += '<option value="' + b.id + '"' + (b.id === g.biz_type ? ' selected' : '') + '>' + b.name + '</option>';
        });
        body += '</select></div>';
        body += '</div>';

        // 策略卡片选择
        body += '<div class="cc-form-group">';
        body += '<label class="cc-form-label">分配策略 <span style="color:var(--cc-btn-hangup);">*</span></label>';
        body += '<div class="cc-skill-strategy-grid">';
        ASSIGN_STRATEGIES.forEach(s => {
            const sel = (s.id === g.assign_strategy) ? ' selected' : '';
            body += '<label class="cc-skill-strategy-pick' + sel + '" data-pick-strategy="' + s.id + '">';
            body += '<input type="radio" name="assign_strategy" value="' + s.id + '"' + (sel ? ' checked' : '') + ' style="position:absolute;opacity:0;">';
            body += '<div class="cc-skill-strategy-pick-icon">' + s.icon + '</div>';
            body += '<div class="cc-skill-strategy-pick-name">' + s.name + '</div>';
            body += '<div class="cc-skill-strategy-pick-desc">' + s.desc + '</div>';
            body += '<div class="cc-skill-strategy-pick-check">✓</div>';
            body += '</label>';
        });
        body += '</div>';
        body += '</div>';

        // 优先级 + 最大等待
        body += '<div class="cc-grid-2">';
        body += '<div class="cc-form-group">';
        body += '<label class="cc-form-label">优先级 <span style="color:var(--cc-text-muted);">(1-10)</span></label>';
        body += '<div class="cc-skill-slider-wrap">';
        body += '<input type="range" min="1" max="10" step="1" name="priority" value="' + (g.priority || 5) + '" class="cc-skill-slider" data-ccs-priority>';
        body += '<div class="cc-skill-slider-value" data-ccs-priority-val>P' + (g.priority || 5) + '</div>';
        body += '</div>';
        body += '</div>';

        body += '<div class="cc-form-group">';
        body += '<label class="cc-form-label">最大排队等待（秒）</label>';
        body += '<input class="cc-form-input" type="number" min="0" name="max_queue_wait" value="' + (g.max_queue_wait || 60) + '" placeholder="60">';
        body += '</div>';
        body += '</div>';

        // 溢出 + 工作时间
        body += '<div class="cc-form-group">';
        body += '<label class="cc-form-label">溢出目标技能组</label>';
        body += '<select class="cc-form-select" name="overflow_target_id">';
        body += '<option value="">—— 不配置 ——</option>';
        allGroups.forEach(x => {
            body += '<option value="' + x.id + '"' + (x.id === g.overflow_target_id ? ' selected' : '') + '>' + ccEscapeHtml(x.name) + '</option>';
        });
        body += '</select></div>';

        body += '<div class="cc-grid-2">';
        body += '<div class="cc-form-group">';
        body += '<label class="cc-form-label">工作开始时间</label>';
        body += '<input class="cc-form-input" type="time" name="work_time_start" value="' + ccEscapeHtml(g.work_time_start || '09:00') + '">';
        body += '</div>';
        body += '<div class="cc-form-group">';
        body += '<label class="cc-form-label">工作结束时间</label>';
        body += '<input class="cc-form-input" type="time" name="work_time_end" value="' + ccEscapeHtml(g.work_time_end || '18:00') + '">';
        body += '</div>';
        body += '</div>';

        body += '</form>';
        body += '</div>';
        body += '<div class="cc-modal-footer">';
        body += '<button class="cc-btn cc-btn-outline" data-action="ccs-close-modal">取消</button>';
        body += '<button class="cc-btn cc-btn-primary" data-action="ccs-save-group">保存</button>';
        body += '</div>';
        body += '</div>';

        overlay.innerHTML = body;
        document.body.appendChild(overlay);

        // slider 实时显示
        const slider = overlay.querySelector('[data-ccs-priority]');
        const sliderVal = overlay.querySelector('[data-ccs-priority-val]');
        if (slider && sliderVal) {
            slider.addEventListener('input', () => { sliderVal.textContent = 'P' + slider.value; });
        }
        // 策略卡片点击切换
        overlay.querySelectorAll('[data-pick-strategy]').forEach(el => {
            el.addEventListener('click', () => {
                overlay.querySelectorAll('[data-pick-strategy]').forEach(x => x.classList.remove('selected'));
                el.classList.add('selected');
                const radio = el.querySelector('input[type=radio]');
                if (radio) radio.checked = true;
            });
        });
    },

    saveGroupFromForm() {
        const form = document.querySelector('[data-ccs-group-form]');
        if (!form) return;
        const fd = new FormData(form);
        const id = fd.get('id');
        const data = {
            name: (fd.get('name') || '').trim(),
            biz_type: fd.get('biz_type') || 'presale',
            assign_strategy: fd.get('assign_strategy') || 'round_robin',
            priority: parseInt(fd.get('priority'), 10) || 5,
            max_queue_wait: parseInt(fd.get('max_queue_wait'), 10) || 60,
            overflow_target_id: fd.get('overflow_target_id') || '',
            work_time_start: fd.get('work_time_start') || '09:00',
            work_time_end: fd.get('work_time_end') || '18:00'
        };

        if (!data.name) { ccShowToast('技能组名称必填', 'error'); return; }
        if (SkillGroupStorage.isNameExist(data.name, id)) {
            ccShowToast('技能组名称已存在：' + data.name, 'error');
            return;
        }

        if (id) {
            data.id = id;
            SkillGroupStorage.update(data);
            ccShowToast('技能组已更新', 'success');
        } else {
            data.agent_ids = [];
            SkillGroupStorage.add(data);
            ccShowToast('技能组已创建', 'success');
        }
        ccCloseModal();
        this.render();
    },

    /* ====================================================================
       10. 模态框 - 策略详情
       ==================================================================== */
    showStrategyDetail(strategyId) {
        const s = _ccSkillGetStrategy(strategyId);
        ccCloseModal();
        const overlay = document.createElement('div');
        overlay.className = 'cc-modal-overlay';
        overlay.dataset.modal = 'ccs-strategy-info';

        let body = '<div class="cc-modal" style="max-width:560px;">';
        body += '<div class="cc-modal-header">';
        body += '<div class="cc-modal-title">⚡ 分配策略说明</div>';
        body += '<button class="cc-modal-close" data-action="ccs-close-modal">×</button>';
        body += '</div>';
        body += '<div class="cc-modal-body">';
        body += '<div class="cc-skill-strategy-detail-hero">';
        body += '<div class="cc-skill-strategy-detail-icon">' + s.icon + '</div>';
        body += '<div class="cc-skill-strategy-detail-name">' + ccEscapeHtml(s.name) + '</div>';
        body += '<div class="cc-skill-strategy-detail-desc">' + ccEscapeHtml(s.desc) + '</div>';
        body += '</div>';
        body += '<div class="cc-skill-strategy-detail-section">';
        body += '<div class="cc-skill-strategy-detail-label">适用场景</div>';
        body += '<div class="cc-skill-strategy-detail-text">' + ccEscapeHtml(s.hint) + '</div>';
        body += '</div>';
        body += '</div>';
        body += '<div class="cc-modal-footer">';
        body += '<button class="cc-btn cc-btn-primary" data-action="ccs-close-modal">了解</button>';
        body += '</div>';
        body += '</div>';
        overlay.innerHTML = body;
        document.body.appendChild(overlay);
    },

    /* ====================================================================
       11. 模态框 - 添加成员
       ==================================================================== */
    showAddMemberModal(groupId) {
        const g = SkillGroupStorage.getById(groupId);
        if (!g) { ccShowToast('技能组不存在', 'error'); return; }
        const allAgents = _ccSkillGetAgents();
        const existing = new Set(g.agent_ids || []);
        const candidates = allAgents.filter(a => !existing.has(a.id));

        ccCloseModal();
        const overlay = document.createElement('div');
        overlay.className = 'cc-modal-overlay';
        overlay.dataset.modal = 'ccs-add-member';

        let body = '<div class="cc-modal" style="max-width:680px;">';
        body += '<div class="cc-modal-header">';
        body += '<div class="cc-modal-title">＋ 添加成员到「' + ccEscapeHtml(g.name) + '」</div>';
        body += '<button class="cc-modal-close" data-action="ccs-close-modal">×</button>';
        body += '</div>';
        body += '<div class="cc-modal-body">';
        body += '<input type="hidden" data-ccs-member-group-id value="' + ccEscapeHtml(g.id) + '">';

        if (candidates.length === 0) {
            body += '<div class="cc-empty"><div class="cc-empty-icon">∅</div><div class="cc-empty-text">所有坐席已加入该技能组</div></div>';
        } else {
            body += '<div style="font-size:12px;color:var(--cc-text-secondary);margin-bottom:12px;">勾选要添加的坐席：</div>';
            body += '<div class="cc-skill-candidate-list">';
            candidates.forEach(a => {
                const st = _ccSkillStatusOf(a);
                body += '<label class="cc-skill-candidate">';
                body += '<input type="checkbox" name="member_ids" value="' + a.id + '" class="cc-skill-candidate-cb">';
                body += '<div class="cc-skill-candidate-avatar">' + ccEscapeHtml((a.name || '?').substr(0, 1)) + '</div>';
                body += '<div class="cc-skill-candidate-info">';
                body += '<div class="cc-skill-candidate-name">' + ccEscapeHtml(a.name) + ' <span class="cc-skill-member-no">' + ccEscapeHtml(a.agent_no) + '</span></div>';
                body += '<div class="cc-skill-candidate-meta">分机 ' + ccEscapeHtml(a.extension || '-') + '</div>';
                body += '</div>';
                body += '<span class="cc-status ' + st.css + '"><span class="cc-status-dot"></span>' + st.label + '</span>';
                body += '</label>';
            });
            body += '</div>';
        }
        body += '</div>';
        body += '<div class="cc-modal-footer">';
        body += '<button class="cc-btn cc-btn-outline" data-action="ccs-close-modal">取消</button>';
        if (candidates.length > 0) {
            body += '<button class="cc-btn cc-btn-primary" data-action="ccs-confirm-add-members">确认添加</button>';
        }
        body += '</div>';
        body += '</div>';
        overlay.innerHTML = body;
        document.body.appendChild(overlay);
    },

    confirmAddMembers() {
        const overlay = document.querySelector('[data-modal="ccs-add-member"]');
        if (!overlay) return;
        const idEl = overlay.querySelector('[data-ccs-member-group-id]');
        const groupId = idEl ? (idEl.value || idEl.getAttribute('value')) : null;
        const g = SkillGroupStorage.getById(groupId);
        if (!g) { ccShowToast('技能组不存在', 'error'); return; }
        const checked = Array.from(overlay.querySelectorAll('.cc-skill-candidate-cb:checked')).map(cb => cb.value);
        if (checked.length === 0) { ccShowToast('请至少选择一个坐席', 'warning'); return; }
        const newIds = (g.agent_ids || []).slice();
        checked.forEach(id => { if (newIds.indexOf(id) === -1) newIds.push(id); });
        SkillGroupStorage.update({ id: g.id, agent_ids: newIds });
        ccShowToast('已添加 ' + checked.length + ' 位成员', 'success');
        ccCloseModal();
        this.render();
    },

    /* ====================================================================
       12. 业务操作
       ==================================================================== */
    deleteGroup(groupId) {
        const g = SkillGroupStorage.getById(groupId);
        if (!g) return;
        if (!ccConfirm('确认删除技能组「' + g.name + '」？该组的排队呼叫也将一并清除。')) return;
        SkillGroupStorage.delete(groupId);
        QueueStorage.clearByGroupId(groupId);
        ccShowToast('技能组已删除', 'success');
        if (this.selectedGroupId === groupId) {
            this.currentView = 'groups';
            this.selectedGroupId = null;
        }
        this.render();
    },

    removeMember(groupId, agentId) {
        const g = SkillGroupStorage.getById(groupId);
        if (!g) return;
        if (!ccConfirm('确认从该技能组移除该坐席？')) return;
        const newIds = (g.agent_ids || []).filter(id => id !== agentId);
        SkillGroupStorage.update({ id: g.id, agent_ids: newIds });
        ccShowToast('已移除成员', 'success');
        this.render();
    },

    queueAdjustPriority(queueId, delta) {
        const q = QueueStorage.getAll().find(x => x.id === queueId);
        if (!q) return;
        const newPri = Math.max(1, Math.min(4, (q.priority || 1) + delta));
        if (newPri === q.priority) {
            ccShowToast(delta > 0 ? '已是最高优先级' : '已是最低优先级', 'warning');
            return;
        }
        QueueStorage.update({ id: queueId, priority: newPri });
        const pri = QUEUE_PRIORITY_MAP[newPri];
        ccShowToast('优先级已调整为：' + pri.label, 'success');
        this.render();
    },

    queueRemove(queueId) {
        const q = QueueStorage.getAll().find(x => x.id === queueId);
        if (!q) return;
        if (!ccConfirm('确认将该来电「' + q.caller_no + '」移出队列？')) return;
        QueueStorage.update({ id: queueId, status: 'abandoned' });
        ccShowToast('已移出队列', 'success');
        this.render();
    },

    queueTransfer(queueId) {
        const q = QueueStorage.getAll().find(x => x.id === queueId);
        if (!q) return;
        const groups = SkillGroupStorage.getAll().filter(g => g.id !== q.group_id);
        if (groups.length === 0) { ccShowToast('无其他技能组可转接', 'warning'); return; }
        // 简化：转到优先级最高的另一个组
        const target = groups.sort((a, b) => (b.priority || 0) - (a.priority || 0))[0];
        QueueStorage.update({ id: queueId, group_id: target.id });
        ccShowToast('已转接至：' + target.name, 'success');
        this.render();
    },

    /* ====================================================================
       13. 事件委托
       ==================================================================== */
    handleEvents(e) {
        // 容器内点击
        const actionEl = e.target.closest('[data-action]');
        if (!actionEl) return;
        const action = actionEl.dataset.action;
        const groupId = actionEl.dataset.groupId;
        const agentId = actionEl.dataset.agentId;
        const queueId = actionEl.dataset.queueId;
        const strategyId = actionEl.dataset.strategyId;

        switch (action) {
            case 'ccs-view-groups':
                this.currentView = 'groups';
                this.selectedGroupId = null;
                this.searchKeyword = '';
                this.render();
                break;
            case 'ccs-view-queues':
                this.currentView = 'queues';
                this.selectedGroupId = null;
                this.render();
                break;
            case 'ccs-refresh':
                this.render();
                ccShowToast('已刷新', 'success');
                break;
            case 'ccs-new-group':
                this.showGroupModal(null);
                break;
            case 'ccs-edit-group':
                e.stopPropagation();
                this.showGroupModal(groupId);
                break;
            case 'ccs-delete-group':
                e.stopPropagation();
                this.deleteGroup(groupId);
                break;
            case 'ccs-view-detail':
                this.selectedGroupId = groupId;
                this.currentView = 'detail';
                this.render();
                break;
            case 'ccs-back-list':
                this.currentView = 'groups';
                this.selectedGroupId = null;
                this.render();
                break;
            case 'ccs-add-member':
                this.showAddMemberModal(groupId);
                break;
            case 'ccs-remove-member':
                this.removeMember(groupId, agentId);
                break;
            case 'ccs-strategy-detail':
                this.showStrategyDetail(strategyId);
                break;
            case 'ccs-queue-up':
                this.queueAdjustPriority(queueId, 1);
                break;
            case 'ccs-queue-down':
                this.queueAdjustPriority(queueId, -1);
                break;
            case 'ccs-queue-transfer':
                this.queueTransfer(queueId);
                break;
            case 'ccs-queue-remove':
                this.queueRemove(queueId);
                break;
            default: break;
        }
    },

    handleModalEvents(e) {
        const overlay = e.target.closest('.cc-modal-overlay');
        if (!overlay) return;
        if (!overlay.dataset.modal || overlay.dataset.modal.indexOf('ccs-') !== 0) return;
        // 点击遮罩
        if (e.target === overlay) { ccCloseModal(); return; }
        const actionEl = e.target.closest('[data-action]');
        if (!actionEl) return;
        const action = actionEl.dataset.action;
        switch (action) {
            case 'ccs-close-modal':
                ccCloseModal();
                break;
            case 'ccs-save-group':
                this.saveGroupFromForm();
                break;
            case 'ccs-confirm-add-members':
                this.confirmAddMembers();
                break;
            default: break;
        }
    },

    _bindEvents() {
        const root = this.container.querySelector('.cc-skill-root');
        if (!root) return;

        const clickHandler = (e) => this.handleEvents(e);
        root.addEventListener('click', clickHandler);
        this.eventHandlers.push({ el: root, evt: 'click', fn: clickHandler });

        const search = root.querySelector('[data-ccs-search]');
        if (search) {
            const onInput = (e) => {
                this.searchKeyword = e.target.value;
                this._refreshList();
            };
            search.addEventListener('input', onInput);
            this.eventHandlers.push({ el: search, evt: 'input', fn: onInput });
        }

        if (!this._modalDelegate) {
            this._modalDelegate = (e) => this.handleModalEvents(e);
            document.addEventListener('click', this._modalDelegate);
        }
    },

    _unbindEvents() {
        this.eventHandlers.forEach(h => {
            if (h.el && h.fn) {
                try { h.el.removeEventListener(h.evt, h.fn); } catch (e) {}
            }
        });
        this.eventHandlers = [];
    },

    _refreshList() {
        // 仅更新列表区，保持input焦点
        const root = this.container.querySelector('.cc-skill-root');
        if (!root) { this.render(); return; }
        const search = root.querySelector('[data-ccs-search]');
        const cursor = search ? search.selectionStart : null;
        // 重新渲染整个内容
        let html = this._renderSubNav();
        if (this.currentView === 'detail' && this.selectedGroupId) {
            html += this.renderGroupDetail(this.selectedGroupId);
        } else if (this.currentView === 'queues') {
            html += this.renderQueues();
        } else {
            html += this.renderGroupList();
        }
        root.innerHTML = html;
        const newSearch = root.querySelector('[data-ccs-search]');
        if (newSearch && search) {
            newSearch.focus();
            try { newSearch.setSelectionRange(cursor, cursor); } catch (e) {}
            const onInput = (ev) => { this.searchKeyword = ev.target.value; this._refreshList(); };
            newSearch.addEventListener('input', onInput);
            this.eventHandlers.push({ el: newSearch, evt: 'input', fn: onInput });
        }
    },

    /* ====================================================================
       14. 种子数据
       ==================================================================== */
    initSeedData() {
        const existing = SkillGroupStorage.getAll();
        if (existing.length > 0) return;

        const agents = _ccSkillGetAgents();
        // 简单按下标分配：让每个组都有些坐席
        const a = agents.map(x => x.id);

        const seedGroups = [
            { name: '销售一部', biz_type: 'presale',   assign_strategy: 'round_robin',    priority: 8,  max_queue_wait: 60, work_time_start: '09:00', work_time_end: '18:00', agent_ids: a.slice(0, 3) },
            { name: '客服中心', biz_type: 'aftersale', assign_strategy: 'longest_idle',   priority: 7,  max_queue_wait: 45, work_time_start: '08:30', work_time_end: '21:00', agent_ids: a.slice(1, 4) },
            { name: '售后支持', biz_type: 'aftersale', assign_strategy: 'skill_priority', priority: 6,  max_queue_wait: 90, work_time_start: '09:00', work_time_end: '18:00', agent_ids: a.slice(2, 5) },
            { name: 'VIP专线',  biz_type: 'vip',       assign_strategy: 'vip_dedicated',  priority: 10, max_queue_wait: 30, work_time_start: '00:00', work_time_end: '23:59', agent_ids: a.slice(0, 2).concat(a.slice(3, 4)) },
            { name: '技术支持', biz_type: 'tech',      assign_strategy: 'weighted',       priority: 5,  max_queue_wait: 120, work_time_start: '09:00', work_time_end: '20:00', agent_ids: a.slice(4, 8) }
        ];

        seedGroups.forEach(g => SkillGroupStorage.add(g));

        // 设置溢出关系
        const all = SkillGroupStorage.getAll();
        const findIdByName = (n) => (all.find(x => x.name === n) || {}).id || '';
        all.forEach(x => {
            let target = '';
            if (x.name === '销售一部') target = findIdByName('客服中心');
            else if (x.name === '客服中心') target = findIdByName('售后支持');
            else if (x.name === '售后支持') target = findIdByName('技术支持');
            else if (x.name === 'VIP专线') target = findIdByName('销售一部');
            if (target) SkillGroupStorage.update({ id: x.id, overflow_target_id: target });
        });

        // 模拟排队数据
        const groupsAfter = SkillGroupStorage.getAll();
        const now = Date.now();
        const seedQueues = [
            { group_name: 'VIP专线',  caller_no: '13800001234', priority: 4, wait: 12 },
            { group_name: 'VIP专线',  caller_no: '13800002345', priority: 4, wait: 35 },
            { group_name: '销售一部', caller_no: '13900003456', priority: 2, wait: 24 },
            { group_name: '销售一部', caller_no: '13700004567', priority: 1, wait: 8 },
            { group_name: '客服中心', caller_no: '13600005678', priority: 1, wait: 52 },
            { group_name: '客服中心', caller_no: '13500006789', priority: 3, wait: 78 },
            { group_name: '售后支持', caller_no: '13400007890', priority: 2, wait: 18 },
            { group_name: '技术支持', caller_no: '13300008901', priority: 1, wait: 95 }
        ];
        seedQueues.forEach(q => {
            const grp = groupsAfter.find(x => x.name === q.group_name);
            if (!grp) return;
            QueueStorage.add({
                group_id: grp.id,
                caller_no: q.caller_no,
                priority: q.priority,
                entered_at: now - q.wait * 1000,
                status: 'waiting'
            });
        });
    },

    /* ====================================================================
       15. 样式注入
       ==================================================================== */
    _injectStyles() {
        if (document.getElementById('cc-skill-styles')) return;
        const style = document.createElement('style');
        style.id = 'cc-skill-styles';
        style.textContent = CC_SKILL_CSS;
        document.head.appendChild(style);
    }
};

/* ========================================================================
   16. 模块专属样式
   ======================================================================== */
const CC_SKILL_CSS = `
.cc-skill-root { display:block; }
.cc-skill-subnav {
    display:flex;align-items:center;justify-content:space-between;
    margin-bottom:24px;padding:6px 8px;
    background:linear-gradient(135deg, rgba(212,175,55,0.06), rgba(212,175,55,0.0) 60%);
    border:1px solid rgba(212,175,55,0.12);
    border-radius:14px;
}
.cc-skill-subnav-tabs { display:flex;gap:6px; }
.cc-skill-subtab {
    display:inline-flex;align-items:center;gap:8px;
    padding:10px 18px;border:none;background:transparent;cursor:pointer;
    color:var(--cc-text-secondary);font-size:13px;font-weight:500;
    border-radius:10px;transition:all .25s ease;letter-spacing:.3px;
}
.cc-skill-subtab:hover { color:var(--cc-gold-light); background:rgba(212,175,55,0.06); }
.cc-skill-subtab.active {
    color:#000;
    background:linear-gradient(135deg, var(--cc-gold), var(--cc-gold-dark));
    box-shadow:0 4px 16px rgba(212,175,55,0.25);
}
.cc-skill-subtab-ico { font-size:14px;opacity:.85; }
.cc-skill-subtab-badge {
    display:inline-flex;align-items:center;justify-content:center;
    min-width:20px;height:20px;padding:0 7px;border-radius:10px;
    font-size:11px;font-weight:600;
    background:rgba(255,255,255,0.08);color:inherit;
}
.cc-skill-subtab.active .cc-skill-subtab-badge { background:rgba(0,0,0,0.18);color:#000; }
.cc-skill-subtab-badge-hot { background:rgba(255,107,53,0.18) !important;color:var(--cc-status-ringing) !important; }
.cc-skill-subtab.active .cc-skill-subtab-badge-hot { background:rgba(0,0,0,0.18) !important;color:#000 !important; }
.cc-skill-subnav-meta {
    color:var(--cc-text-muted);font-size:11px;letter-spacing:2px;font-family:monospace;padding-right:14px;
}

/* 概览栏 */
.cc-skill-overview {
    display:grid;grid-template-columns:repeat(auto-fit, minmax(180px, 1fr));
    gap:12px;margin-bottom:20px;
}
.cc-skill-overview-item {
    display:flex;align-items:center;gap:14px;
    padding:16px 18px;
    background:var(--cc-bg-card);
    border:1px solid var(--cc-gold-border-light);
    border-radius:12px;
    transition:all .25s ease;
}
.cc-skill-overview-item:hover { border-color:var(--cc-gold-border); transform:translateY(-1px); }
.cc-skill-overview-icon {
    width:42px;height:42px;border-radius:10px;
    display:flex;align-items:center;justify-content:center;
    background:linear-gradient(135deg, rgba(212,175,55,0.18), rgba(212,175,55,0.04));
    color:var(--cc-gold);font-size:20px;
    border:1px solid var(--cc-gold-border-light);
}
.cc-skill-overview-value { font-size:20px;font-weight:700;color:var(--cc-text-primary);line-height:1.2; }
.cc-skill-overview-label { font-size:11px;color:var(--cc-text-muted);letter-spacing:.5px;text-transform:uppercase;margin-top:2px; }

/* 卡片网格 */
.cc-skill-grid {
    display:grid;grid-template-columns:repeat(auto-fill, minmax(340px, 1fr));
    gap:18px;
}
.cc-skill-card {
    position:relative;
    background:linear-gradient(180deg, var(--cc-bg-card), #0F0F16);
    border:1px solid var(--cc-gold-border-light);
    border-radius:14px;padding:20px 20px 16px;
    cursor:pointer;transition:all .3s cubic-bezier(.4,0,.2,1);
    overflow:hidden;
}
.cc-skill-card::before {
    content:'';position:absolute;inset:0;
    background:radial-gradient(circle at top right, rgba(212,175,55,0.08), transparent 50%);
    opacity:0;transition:opacity .3s ease;pointer-events:none;
}
.cc-skill-card:hover { border-color:var(--cc-gold-border);transform:translateY(-3px);box-shadow:0 10px 32px rgba(0,0,0,0.4), 0 0 30px rgba(212,175,55,0.08); }
.cc-skill-card:hover::before { opacity:1; }
.cc-skill-card-stripe {
    position:absolute;top:0;left:0;right:0;height:3px;
    background:linear-gradient(90deg, transparent, var(--cc-gold), transparent);
    opacity:.6;
}
.cc-skill-card-head {
    display:flex;align-items:flex-start;justify-content:space-between;gap:12px;margin-bottom:14px;
}
.cc-skill-card-title-wrap { flex:1;min-width:0; }
.cc-skill-card-title {
    font-size:17px;font-weight:600;color:var(--cc-text-primary);
    margin-bottom:6px;letter-spacing:.3px;
    white-space:nowrap;overflow:hidden;text-overflow:ellipsis;
}
.cc-skill-biz-tag {
    display:inline-block;padding:3px 10px;
    background:rgba(212,175,55,0.08);
    border:1px solid var(--cc-gold-border-light);
    border-radius:10px;font-size:11px;color:var(--cc-gold);letter-spacing:.5px;
}
.cc-skill-card-priority {
    flex-shrink:0;
    padding:4px 10px;border-radius:8px;
    background:linear-gradient(135deg, var(--cc-gold), var(--cc-gold-dark));
    color:#000;font-weight:700;font-size:12px;letter-spacing:1px;
}

.cc-skill-strategy-row {
    display:flex;align-items:center;gap:12px;
    padding:12px 14px;margin-bottom:14px;
    background:rgba(212,175,55,0.04);
    border:1px solid var(--cc-gold-border-light);
    border-radius:10px;
}
.cc-skill-strategy-icon {
    width:40px;height:40px;flex-shrink:0;
    display:flex;align-items:center;justify-content:center;
    font-size:20px;color:var(--cc-gold);
    background:rgba(0,0,0,0.4);border-radius:10px;
    border:1px solid var(--cc-gold-border);
}
.cc-skill-strategy-name { font-size:13px;font-weight:600;color:var(--cc-text-primary);margin-bottom:2px; }
.cc-skill-strategy-desc { font-size:11px;color:var(--cc-text-muted);letter-spacing:.3px;line-height:1.5; }

.cc-skill-metrics {
    display:grid;grid-template-columns:repeat(3, 1fr);gap:8px;margin-bottom:14px;
}
.cc-skill-metric {
    text-align:center;padding:10px 6px;
    background:rgba(255,255,255,0.02);border-radius:8px;
}
.cc-skill-metric-num { font-size:18px;font-weight:700;color:var(--cc-text-primary);font-family:monospace; }
.cc-skill-metric-sep { color:var(--cc-text-muted);margin:0 2px;font-weight:400; }
.cc-skill-metric-unit { font-size:11px;color:var(--cc-text-muted);margin-left:1px;font-weight:400; }
.cc-skill-metric-label { font-size:10px;color:var(--cc-text-muted);letter-spacing:.5px;margin-top:2px;text-transform:uppercase; }

.cc-skill-progress-wrap { margin-bottom:14px; }
.cc-skill-progress-label {
    display:flex;justify-content:space-between;
    font-size:11px;color:var(--cc-text-muted);
    margin-bottom:6px;letter-spacing:.5px;
}
.cc-skill-progress { height:4px;background:rgba(255,255,255,0.06);border-radius:2px;overflow:hidden; }
.cc-skill-progress-bar {
    height:100%;background:linear-gradient(90deg, var(--cc-gold-dark), var(--cc-gold-light));
    border-radius:2px;transition:width .6s ease;
    box-shadow:0 0 8px rgba(212,175,55,0.4);
}
.cc-skill-card-actions {
    display:flex;gap:6px;flex-wrap:wrap;
    padding-top:12px;border-top:1px solid var(--cc-gold-border-light);
}

/* 详情页 */
.cc-skill-breadcrumb { display:flex;align-items:center;gap:12px;margin-bottom:20px; }
.cc-skill-hero {
    position:relative;background:linear-gradient(135deg, var(--cc-bg-card), #14141C);
    border:1px solid var(--cc-gold-border);
    border-radius:14px;padding:28px;margin-bottom:20px;overflow:hidden;
}
.cc-skill-hero-stripe {
    position:absolute;top:0;left:0;width:4px;bottom:0;
    background:linear-gradient(180deg, var(--cc-gold-light), var(--cc-gold-dark));
}
.cc-skill-hero-main { display:flex;align-items:center;justify-content:space-between;gap:20px;flex-wrap:wrap; }
.cc-skill-hero-left { display:flex;align-items:center;gap:18px; }
.cc-skill-hero-icon {
    width:64px;height:64px;border-radius:14px;
    display:flex;align-items:center;justify-content:center;
    font-size:30px;color:#000;
    background:linear-gradient(135deg, var(--cc-gold-light), var(--cc-gold-dark));
    box-shadow:0 8px 24px rgba(212,175,55,0.3);
}
.cc-skill-hero-title { font-size:22px;font-weight:700;color:var(--cc-text-primary);margin-bottom:8px;letter-spacing:.5px; }
.cc-skill-hero-sub {
    display:flex;align-items:center;gap:10px;flex-wrap:wrap;
    font-size:12px;color:var(--cc-text-secondary);letter-spacing:.5px;
}
.cc-skill-hero-divider { width:1px;height:12px;background:var(--cc-gold-border-light); }
.cc-skill-hero-actions { display:flex;gap:10px;flex-wrap:wrap; }

.cc-skill-detail-grid { display:grid;grid-template-columns:1fr 1fr;gap:16px; }
@media (max-width:1100px) { .cc-skill-detail-grid { grid-template-columns:1fr; } }
.cc-skill-detail-col { display:flex;flex-direction:column;gap:16px; }

.cc-skill-kv {
    display:flex;padding:10px 0;border-bottom:1px solid rgba(255,255,255,0.04);font-size:13px;
}
.cc-skill-kv:last-child { border-bottom:none; }
.cc-skill-kv-k { width:120px;color:var(--cc-text-muted);font-size:12px;letter-spacing:.5px; }
.cc-skill-kv-v { flex:1;color:var(--cc-text-primary); }

.cc-skill-member-list { display:flex;flex-direction:column;gap:8px; }
.cc-skill-member-item {
    display:flex;align-items:center;gap:12px;
    padding:10px 12px;
    background:rgba(255,255,255,0.02);
    border:1px solid rgba(255,255,255,0.04);
    border-radius:10px;transition:all .2s ease;
}
.cc-skill-member-item:hover { background:rgba(212,175,55,0.04);border-color:var(--cc-gold-border-light); }
.cc-skill-member-avatar {
    width:36px;height:36px;border-radius:10px;flex-shrink:0;
    display:flex;align-items:center;justify-content:center;
    background:linear-gradient(135deg, var(--cc-gold-dark), var(--cc-gold));
    color:#000;font-weight:700;font-size:14px;
}
.cc-skill-member-info { flex:1;min-width:0; }
.cc-skill-member-name { font-size:13px;font-weight:600;color:var(--cc-text-primary); }
.cc-skill-member-no { color:var(--cc-text-muted);font-size:11px;font-family:monospace;margin-left:6px;letter-spacing:.5px; }
.cc-skill-member-meta { font-size:11px;color:var(--cc-text-muted);margin-top:2px; }

.cc-skill-strategy-spotlight {
    text-align:center;padding:24px 16px;
    background:radial-gradient(circle at center, rgba(212,175,55,0.08), transparent 70%);
    border-radius:10px;
}
.cc-skill-strategy-spotlight-icon {
    font-size:42px;color:var(--cc-gold);margin-bottom:12px;
    text-shadow:0 0 20px rgba(212,175,55,0.5);
}
.cc-skill-strategy-spotlight-title { font-size:18px;font-weight:700;color:var(--cc-text-primary);margin-bottom:8px;letter-spacing:.5px; }
.cc-skill-strategy-spotlight-hint { font-size:12px;color:var(--cc-text-secondary);line-height:1.7;max-width:360px;margin:0 auto; }

.cc-skill-time-display {
    display:flex;align-items:center;justify-content:center;gap:18px;padding:14px 0;
}
.cc-skill-time-block { text-align:center; }
.cc-skill-time-label { font-size:11px;color:var(--cc-text-muted);letter-spacing:.5px;margin-bottom:6px;text-transform:uppercase; }
.cc-skill-time-value {
    font-size:26px;font-weight:700;color:var(--cc-gold);font-family:monospace;letter-spacing:1px;
}
.cc-skill-time-arrow { font-size:24px;color:var(--cc-text-muted); }

.cc-skill-mini-queue { display:flex;flex-direction:column;gap:8px; }
.cc-skill-mini-queue-item {
    display:flex;align-items:center;gap:12px;
    padding:10px 12px;background:rgba(255,255,255,0.02);
    border:1px solid rgba(255,255,255,0.04);border-radius:8px;font-size:13px;
}

/* 排队 */
.cc-skill-rules { display:grid;grid-template-columns:repeat(auto-fit, minmax(260px,1fr));gap:12px; }
.cc-skill-rule-item {
    display:flex;align-items:center;gap:14px;
    padding:14px 16px;
    background:linear-gradient(135deg, rgba(212,175,55,0.04), transparent);
    border:1px solid var(--cc-gold-border-light);border-radius:10px;
}
.cc-skill-rule-num {
    flex-shrink:0;width:48px;height:48px;border-radius:10px;
    display:flex;align-items:center;justify-content:center;
    font-size:13px;font-weight:700;color:var(--cc-gold);font-family:monospace;
    background:rgba(0,0,0,0.4);border:1px solid var(--cc-gold-border);
}
.cc-skill-rule-text { font-size:12px;color:var(--cc-text-secondary);line-height:1.6; }
.cc-skill-rule-text strong { color:var(--cc-gold); }

.cc-skill-queue-rank {
    display:inline-flex;align-items:center;justify-content:center;
    width:24px;height:24px;border-radius:50%;
    background:rgba(212,175,55,0.12);color:var(--cc-gold);
    font-size:11px;font-weight:700;font-family:monospace;
}
.cc-skill-priority-tag {
    display:inline-block;padding:2px 8px;border-radius:8px;
    background:transparent;border:1px solid;
    font-size:11px;font-weight:600;letter-spacing:.5px;
}
.cc-skill-wait-ok { color:var(--cc-text-primary);font-family:monospace; }
.cc-skill-wait-warn { color:var(--cc-gold);font-family:monospace;font-weight:600; }
.cc-skill-wait-danger {
    color:var(--cc-status-ringing);font-family:monospace;font-weight:700;
    animation:ccSkillBlink 1.2s infinite;
}
@keyframes ccSkillBlink { 0%,100% { opacity:1; } 50% { opacity:0.55; } }

.cc-skill-danger-btn {
    background:rgba(255,77,79,0.10);
    color:var(--cc-btn-hangup);
    border:1px solid rgba(255,77,79,0.3);
}
.cc-skill-danger-btn:hover { background:rgba(255,77,79,0.18); }

/* 策略选择卡片（Modal） */
.cc-skill-strategy-grid {
    display:grid;grid-template-columns:repeat(auto-fill, minmax(160px,1fr));gap:10px;margin-top:6px;
}
.cc-skill-strategy-pick {
    position:relative;display:block;cursor:pointer;
    padding:16px 14px;border-radius:10px;
    background:rgba(255,255,255,0.02);
    border:1px solid var(--cc-gold-border-light);
    transition:all .25s ease;
}
.cc-skill-strategy-pick:hover { border-color:var(--cc-gold-border);background:rgba(212,175,55,0.04); }
.cc-skill-strategy-pick.selected {
    border-color:var(--cc-gold);
    background:linear-gradient(135deg, rgba(212,175,55,0.12), rgba(212,175,55,0.04));
    box-shadow:0 0 0 1px var(--cc-gold), 0 6px 18px rgba(212,175,55,0.15);
}
.cc-skill-strategy-pick-icon { font-size:24px;color:var(--cc-gold);margin-bottom:8px; }
.cc-skill-strategy-pick-name { font-size:13px;font-weight:600;color:var(--cc-text-primary);margin-bottom:4px; }
.cc-skill-strategy-pick-desc { font-size:11px;color:var(--cc-text-muted);line-height:1.5;letter-spacing:.3px; }
.cc-skill-strategy-pick-check {
    position:absolute;top:10px;right:10px;
    width:20px;height:20px;border-radius:50%;
    display:flex;align-items:center;justify-content:center;
    background:var(--cc-gold);color:#000;
    font-size:11px;font-weight:700;
    opacity:0;transform:scale(0.6);transition:all .25s ease;
}
.cc-skill-strategy-pick.selected .cc-skill-strategy-pick-check { opacity:1;transform:scale(1); }

/* 优先级滑块 */
.cc-skill-slider-wrap { display:flex;align-items:center;gap:14px; }
.cc-skill-slider {
    flex:1;-webkit-appearance:none;appearance:none;
    height:6px;border-radius:3px;
    background:linear-gradient(90deg, var(--cc-gold-dark), var(--cc-gold-light));
    outline:none;cursor:pointer;
}
.cc-skill-slider::-webkit-slider-thumb {
    -webkit-appearance:none;appearance:none;
    width:18px;height:18px;border-radius:50%;
    background:var(--cc-gold);border:2px solid #000;
    box-shadow:0 0 0 2px var(--cc-gold), 0 4px 12px rgba(212,175,55,0.4);
    cursor:pointer;
}
.cc-skill-slider::-moz-range-thumb {
    width:18px;height:18px;border-radius:50%;
    background:var(--cc-gold);border:2px solid #000;
    box-shadow:0 0 0 2px var(--cc-gold);cursor:pointer;
}
.cc-skill-slider-value {
    flex-shrink:0;min-width:48px;text-align:center;
    padding:6px 10px;border-radius:8px;
    background:linear-gradient(135deg, var(--cc-gold), var(--cc-gold-dark));
    color:#000;font-weight:700;font-size:13px;letter-spacing:.5px;
}

/* 策略详情 modal */
.cc-skill-strategy-detail-hero { text-align:center;padding:20px 16px 24px; }
.cc-skill-strategy-detail-icon {
    font-size:54px;color:var(--cc-gold);
    text-shadow:0 0 24px rgba(212,175,55,0.5);margin-bottom:14px;
}
.cc-skill-strategy-detail-name { font-size:20px;font-weight:700;color:var(--cc-text-primary);margin-bottom:8px;letter-spacing:.5px; }
.cc-skill-strategy-detail-desc { font-size:13px;color:var(--cc-text-secondary);line-height:1.6; }
.cc-skill-strategy-detail-section {
    padding:16px;border-top:1px solid var(--cc-gold-border-light);
}
.cc-skill-strategy-detail-label {
    font-size:11px;color:var(--cc-gold);letter-spacing:1px;
    text-transform:uppercase;margin-bottom:8px;font-weight:600;
}
.cc-skill-strategy-detail-text { font-size:13px;color:var(--cc-text-secondary);line-height:1.7; }

/* 候选成员选择 */
.cc-skill-candidate-list { display:flex;flex-direction:column;gap:8px;max-height:400px;overflow-y:auto; }
.cc-skill-candidate {
    display:flex;align-items:center;gap:12px;
    padding:10px 12px;cursor:pointer;
    background:rgba(255,255,255,0.02);
    border:1px solid rgba(255,255,255,0.04);
    border-radius:10px;transition:all .2s ease;
}
.cc-skill-candidate:hover { background:rgba(212,175,55,0.04);border-color:var(--cc-gold-border-light); }
.cc-skill-candidate-cb {
    width:18px;height:18px;cursor:pointer;
    accent-color:var(--cc-gold);
}
.cc-skill-candidate-avatar {
    width:32px;height:32px;border-radius:8px;flex-shrink:0;
    display:flex;align-items:center;justify-content:center;
    background:linear-gradient(135deg, var(--cc-gold-dark), var(--cc-gold));
    color:#000;font-weight:700;font-size:13px;
}
.cc-skill-candidate-info { flex:1;min-width:0; }
.cc-skill-candidate-name { font-size:13px;font-weight:600;color:var(--cc-text-primary); }
.cc-skill-candidate-meta { font-size:11px;color:var(--cc-text-muted);margin-top:2px; }

@media (max-width:768px) {
    .cc-skill-grid { grid-template-columns:1fr; }
    .cc-skill-overview { grid-template-columns:repeat(2,1fr); }
    .cc-skill-hero-main { flex-direction:column;align-items:flex-start; }
}
`;

/* ========================================================================
   17. 暴露到全局
   ======================================================================== */
if (typeof window !== 'undefined') {
    window.CCSkill = CCSkill;
    window.SkillGroupStorage = SkillGroupStorage;
    window.QueueStorage = QueueStorage;
    window.CC_SKILL_KEYS = CC_SKILL_KEYS;
    window.ASSIGN_STRATEGIES = ASSIGN_STRATEGIES;
}
