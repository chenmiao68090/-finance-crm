/**
 * 呼叫中心 - 号码与线路管理模块
 * 提供：号码池CRUD、SIP中继管理、智能外显策略配置
 * 数据持久化：localStorage
 */

// ===== 常量定义 =====
const CC_NUMBER_KEYS = {
    PHONES: 'cc_phone_numbers',
    TRUNKS: 'cc_sip_trunks',
    STRATEGY: 'cc_display_strategy'
};

// 号码类型
const NUMBER_TYPE_MAP = { 1: '固话', 2: '400号', 3: '95号', 4: '手机号', 5: '虚拟号' };
// 用途类型
const USAGE_TYPE_MAP = { 1: '呼入', 2: '呼出', 3: '双向', 4: '专属坐席' };
// 号码状态
const NUMBER_STATUS_MAP = { 0: '停用', 1: '正常', 2: '欠费', 3: '注销' };
// 中继类型
const TRUNK_TYPE_MAP = { 1: 'SIP中继', 2: 'E1', 3: 'IMS', 4: '云API' };
// 中继状态
const TRUNK_STATUS_MAP = { 0: '离线', 1: '在线', 2: '故障' };
// 外显策略
const DISPLAY_STRATEGIES = ['归属地匹配', '轮询', '随机', '固定号码'];

// ===== ID生成器 =====
// 与cc-core约定的命名风格：ccGenerateId(prefix)
if (typeof window.ccGenerateId !== 'function') {
    window.ccGenerateId = function (prefix) {
        return (prefix || '') + Date.now().toString(36) + Math.random().toString(36).substr(2, 6);
    };
}

// ===== Toast 工具 =====
function ccShowToast(msg, type) {
    type = type || 'success';
    const toast = document.createElement('div');
    toast.className = 'cc-toast cc-toast-' + type;
    toast.textContent = msg;
    document.body.appendChild(toast);
    setTimeout(function () {
        toast.style.transition = 'opacity .3s';
        toast.style.opacity = '0';
        setTimeout(function () { toast.remove(); }, 300);
    }, 2200);
}

// ===== Storage 工厂 =====
function ccCreateStorage(key, idField) {
    return {
        _read: function () {
            try {
                return JSON.parse(localStorage.getItem(key) || '[]');
            } catch (e) { return []; }
        },
        _write: function (list) {
            localStorage.setItem(key, JSON.stringify(list));
        },
        getAll: function () {
            return this._read().filter(function (it) { return !it.deleted; });
        },
        getRaw: function () { return this._read(); },
        getById: function (id) {
            return this._read().find(function (it) { return it[idField] === id; });
        },
        add: function (item) {
            const list = this._read();
            list.push(item);
            this._write(list);
            return item;
        },
        update: function (id, patch) {
            const list = this._read();
            const idx = list.findIndex(function (it) { return it[idField] === id; });
            if (idx >= 0) {
                list[idx] = Object.assign({}, list[idx], patch, { update_time: new Date().toISOString() });
                this._write(list);
                return list[idx];
            }
            return null;
        },
        delete: function (id) {
            return this.update(id, { deleted: true });
        },
        replaceAll: function (list) { this._write(list); }
    };
}

const PhoneNumberStorage = ccCreateStorage(CC_NUMBER_KEYS.PHONES, 'phone_id');
const SipTrunkStorage = ccCreateStorage(CC_NUMBER_KEYS.TRUNKS, 'trunk_id');

// ===== HTML 转义 =====
function ccEsc(s) {
    if (s === null || s === undefined) return '';
    return String(s)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

// ===== 主对象 =====
const CCNumber = {
    currentView: 'phones', // phones | trunks | strategy
    searchKeyword: '',
    statusFilter: 'all',
    typeFilter: 'all',
    _modalEl: null,

    // 渲染入口 - 被 CallCenter 调用
    render: function (container) {
        this.initSeedData();
        const html = this._renderContent();
        if (container) {
            container.innerHTML = html;
            this._bindEvents(container);
        }
        return html;
    },

    _renderContent: function () {
        let html = '<div class="cc-number-module">';
        // 子Tab
        html += '<div class="cc-tabs" style="margin-bottom:20px;">';
        html += '<button class="cc-tab ' + (this.currentView === 'phones' ? 'active' : '') + '" data-subtab="phones">号码管理</button>';
        html += '<button class="cc-tab ' + (this.currentView === 'trunks' ? 'active' : '') + '" data-subtab="trunks">SIP中继</button>';
        html += '<button class="cc-tab ' + (this.currentView === 'strategy' ? 'active' : '') + '" data-subtab="strategy">外显策略</button>';
        html += '</div>';

        html += '<div class="cc-number-body">';
        if (this.currentView === 'phones') html += this.renderPhoneNumbers();
        else if (this.currentView === 'trunks') html += this.renderTrunks();
        else html += this.renderDisplayStrategy();
        html += '</div></div>';
        return html;
    },

    _bindEvents: function (root) {
        const self = this;
        if (root._ccBound) return;
        root._ccBound = true;
        root.addEventListener('click', function (e) { self.handleEvents(e); });
        root.addEventListener('input', function (e) { self.handleEvents(e); });
        root.addEventListener('change', function (e) { self.handleEvents(e); });
    },

    _refresh: function () {
        const root = document.querySelector('.cc-number-module');
        if (!root) return;
        // 仅替换内容区，保留事件
        const body = root.querySelector('.cc-number-body');
        if (!body) return;
        if (this.currentView === 'phones') body.innerHTML = this.renderPhoneNumbers();
        else if (this.currentView === 'trunks') body.innerHTML = this.renderTrunks();
        else body.innerHTML = this.renderDisplayStrategy();
        // 同步Tab高亮
        root.querySelectorAll('.cc-tabs .cc-tab').forEach(function (t) {
            t.classList.toggle('active', t.dataset.subtab === CCNumber.currentView);
        });
    },

    // ===== 号码管理列表 =====
    renderPhoneNumbers: function () {
        const list = PhoneNumberStorage.getAll();
        const trunks = SipTrunkStorage.getAll();
        const trunkMap = {};
        trunks.forEach(function (t) { trunkMap[t.trunk_id] = t.name; });

        const kw = this.searchKeyword.trim().toLowerCase();
        const filtered = list.filter(function (p) {
            if (CCNumber.statusFilter !== 'all' && String(p.status) !== CCNumber.statusFilter) return false;
            if (CCNumber.typeFilter !== 'all' && String(p.number_type) !== CCNumber.typeFilter) return false;
            if (!kw) return true;
            return (p.number || '').toLowerCase().indexOf(kw) >= 0
                || (p.province || '').toLowerCase().indexOf(kw) >= 0
                || (p.city || '').toLowerCase().indexOf(kw) >= 0
                || (p.carrier || '').toLowerCase().indexOf(kw) >= 0;
        });

        let html = '';
        // 工具栏
        html += '<div class="cc-toolbar">';
        html += '<input type="text" class="cc-search-input" placeholder="搜索号码 / 归属地 / 运营商" data-act="search" value="' + ccEsc(this.searchKeyword) + '" />';
        html += '<select class="cc-form-select" style="width:140px;" data-act="type-filter">';
        html += '<option value="all"' + (this.typeFilter === 'all' ? ' selected' : '') + '>全部类型</option>';
        Object.keys(NUMBER_TYPE_MAP).forEach(function (k) {
            html += '<option value="' + k + '"' + (CCNumber.typeFilter === k ? ' selected' : '') + '>' + NUMBER_TYPE_MAP[k] + '</option>';
        });
        html += '</select>';
        html += '<select class="cc-form-select" style="width:140px;" data-act="status-filter">';
        html += '<option value="all"' + (this.statusFilter === 'all' ? ' selected' : '') + '>全部状态</option>';
        Object.keys(NUMBER_STATUS_MAP).forEach(function (k) {
            html += '<option value="' + k + '"' + (CCNumber.statusFilter === k ? ' selected' : '') + '>' + NUMBER_STATUS_MAP[k] + '</option>';
        });
        html += '</select>';
        html += '<button class="cc-btn cc-btn-primary" data-act="add-phone">+ 新增号码</button>';
        html += '<button class="cc-btn cc-btn-outline" data-act="batch-import">批量导入</button>';
        html += '</div>';

        // 统计
        html += '<div class="cc-stat-grid" style="grid-template-columns:repeat(4,1fr);">';
        html += this._statCard('号码总数', list.length);
        html += this._statCard('正常号码', list.filter(function (p) { return p.status === 1; }).length);
        html += this._statCard('停用号码', list.filter(function (p) { return p.status === 0; }).length);
        html += this._statCard('SIP中继', trunks.length);
        html += '</div>';

        // 表格
        html += '<div class="cc-table-wrapper"><table class="cc-table">';
        html += '<thead><tr>';
        html += '<th>号码</th><th>类型</th><th>归属地</th><th>运营商</th><th>用途</th>';
        html += '<th>关联中继</th><th>状态</th><th>到期日期</th><th style="width:200px;">操作</th>';
        html += '</tr></thead><tbody>';

        if (filtered.length === 0) {
            html += '<tr><td colspan="9"><div class="cc-empty"><div class="cc-empty-icon">📞</div><div class="cc-empty-text">暂无号码数据</div></div></td></tr>';
        } else {
            filtered.forEach(function (p) {
                html += '<tr>';
                html += '<td style="font-weight:600;color:var(--cc-gold);">' + ccEsc(p.number) + '</td>';
                html += '<td>' + (NUMBER_TYPE_MAP[p.number_type] || '-') + '</td>';
                html += '<td>' + ccEsc(p.province || '') + (p.city ? ' / ' + ccEsc(p.city) : '') + '</td>';
                html += '<td>' + ccEsc(p.carrier || '-') + '</td>';
                html += '<td>' + (USAGE_TYPE_MAP[p.usage_type] || '-') + '</td>';
                html += '<td>' + ccEsc(trunkMap[p.trunk_id] || '-') + '</td>';
                html += '<td>' + CCNumber._renderNumberStatus(p.status) + '</td>';
                html += '<td>' + ccEsc(p.expire_date || '-') + '</td>';
                html += '<td>';
                html += '<button class="cc-btn cc-btn-outline cc-btn-sm" data-act="edit-phone" data-id="' + p.phone_id + '">编辑</button> ';
                if (p.status === 1) {
                    html += '<button class="cc-btn cc-btn-outline cc-btn-sm" data-act="toggle-phone" data-id="' + p.phone_id + '">停用</button> ';
                } else {
                    html += '<button class="cc-btn cc-btn-outline cc-btn-sm" data-act="toggle-phone" data-id="' + p.phone_id + '">启用</button> ';
                }
                html += '<button class="cc-btn cc-btn-danger cc-btn-sm" data-act="delete-phone" data-id="' + p.phone_id + '">删除</button>';
                html += '</td></tr>';
            });
        }
        html += '</tbody></table></div>';
        return html;
    },

    _statCard: function (label, value) {
        return '<div class="cc-stat-card"><div class="cc-stat-value">' + value + '</div><div class="cc-stat-label">' + label + '</div></div>';
    },

    _renderNumberStatus: function (s) {
        const text = NUMBER_STATUS_MAP[s] || '-';
        let cls = 'cc-status-offline';
        if (s === 1) cls = 'cc-status-online';
        else if (s === 2) cls = 'cc-status-busy';
        else if (s === 3) cls = 'cc-status-ringing';
        return '<span class="cc-status ' + cls + '"><span class="cc-status-dot"></span>' + text + '</span>';
    },

    // ===== SIP 中继列表 =====
    renderTrunks: function () {
        const list = SipTrunkStorage.getAll();
        const kw = this.searchKeyword.trim().toLowerCase();
        const filtered = list.filter(function (t) {
            if (!kw) return true;
            return (t.name || '').toLowerCase().indexOf(kw) >= 0
                || (t.supplier || '').toLowerCase().indexOf(kw) >= 0
                || (t.server_host || '').toLowerCase().indexOf(kw) >= 0;
        });

        let html = '';
        html += '<div class="cc-toolbar">';
        html += '<input type="text" class="cc-search-input" placeholder="搜索中继名称 / 供应商 / 服务器" data-act="search" value="' + ccEsc(this.searchKeyword) + '" />';
        html += '<button class="cc-btn cc-btn-primary" data-act="add-trunk">+ 新增中继</button>';
        html += '</div>';

        // 概览卡
        const onlineCount = list.filter(function (t) { return t.status === 1; }).length;
        const usedConcurrent = list.reduce(function (s, t) { return s + (t.current_concurrent || 0); }, 0);
        const totalConcurrent = list.reduce(function (s, t) { return s + (t.max_concurrent || 0); }, 0);
        html += '<div class="cc-stat-grid" style="grid-template-columns:repeat(4,1fr);">';
        html += this._statCard('中继总数', list.length);
        html += this._statCard('在线中继', onlineCount);
        html += this._statCard('占用并发', usedConcurrent + ' / ' + totalConcurrent);
        html += this._statCard('故障数', list.filter(function (t) { return t.status === 2; }).length);
        html += '</div>';

        html += '<div class="cc-table-wrapper"><table class="cc-table">';
        html += '<thead><tr>';
        html += '<th>名称</th><th>类型</th><th>供应商</th><th>服务器地址</th>';
        html += '<th style="width:160px;">并发占用</th><th>费率(元/分)</th><th>状态</th><th style="width:240px;">操作</th>';
        html += '</tr></thead><tbody>';

        if (filtered.length === 0) {
            html += '<tr><td colspan="8"><div class="cc-empty"><div class="cc-empty-icon">🔌</div><div class="cc-empty-text">暂无中继配置</div></div></td></tr>';
        } else {
            filtered.forEach(function (t) {
                const max = t.max_concurrent || 0;
                const cur = t.current_concurrent || 0;
                const pct = max > 0 ? Math.round(cur / max * 100) : 0;
                let barColor = 'var(--cc-status-online)';
                if (pct >= 90) barColor = 'var(--cc-btn-hangup)';
                else if (pct >= 70) barColor = 'var(--cc-gold)';

                html += '<tr>';
                html += '<td style="font-weight:600;">' + ccEsc(t.name) + '</td>';
                html += '<td>' + (TRUNK_TYPE_MAP[t.trunk_type] || '-') + '</td>';
                html += '<td>' + ccEsc(t.supplier || '-') + '</td>';
                html += '<td><code style="color:var(--cc-text-secondary);font-size:12px;">' + ccEsc(t.server_host || '-') + '</code></td>';
                html += '<td>';
                html += '<div style="display:flex;align-items:center;gap:8px;">';
                html += '<div style="flex:1;height:6px;background:rgba(255,255,255,0.06);border-radius:3px;overflow:hidden;">';
                html += '<div style="width:' + pct + '%;height:100%;background:' + barColor + ';transition:width .3s;"></div>';
                html += '</div>';
                html += '<span style="font-size:11px;color:var(--cc-text-secondary);white-space:nowrap;">' + cur + '/' + max + '</span>';
                html += '</div>';
                html += '</td>';
                html += '<td>' + (t.rate_per_minute != null ? Number(t.rate_per_minute).toFixed(2) : '-') + '</td>';
                html += '<td>' + CCNumber._renderTrunkStatus(t.status) + '</td>';
                html += '<td>';
                html += '<button class="cc-btn cc-btn-outline cc-btn-sm" data-act="edit-trunk" data-id="' + t.trunk_id + '">编辑</button> ';
                html += '<button class="cc-btn cc-btn-outline cc-btn-sm" data-act="test-trunk" data-id="' + t.trunk_id + '">测试连通</button> ';
                html += '<button class="cc-btn cc-btn-danger cc-btn-sm" data-act="delete-trunk" data-id="' + t.trunk_id + '">删除</button>';
                html += '</td></tr>';
            });
        }
        html += '</tbody></table></div>';
        return html;
    },

    _renderTrunkStatus: function (s) {
        const text = TRUNK_STATUS_MAP[s] || '-';
        let cls = 'cc-status-offline';
        if (s === 1) cls = 'cc-status-online';
        else if (s === 2) cls = 'cc-status-ringing';
        return '<span class="cc-status ' + cls + '"><span class="cc-status-dot"></span>' + text + '</span>';
    },

    // ===== 外显策略 =====
    renderDisplayStrategy: function () {
        const cfg = JSON.parse(localStorage.getItem(CC_NUMBER_KEYS.STRATEGY) || '{}');
        const current = cfg.current || '归属地匹配';
        const rules = cfg.region_rules || [
            { region: '华东', priority: 1, prefer_carrier: '电信' },
            { region: '华南', priority: 2, prefer_carrier: '联通' },
            { region: '华北', priority: 3, prefer_carrier: '移动' }
        ];

        let html = '';
        html += '<div class="cc-card" style="margin-bottom:20px;">';
        html += '<div class="cc-card-header"><div class="cc-card-title">智能外显策略配置</div></div>';
        html += '<div style="color:var(--cc-text-secondary);font-size:13px;margin-bottom:16px;">选择呼出时使用的号码外显策略，系统将根据策略自动匹配最合适的主叫号码。</div>';

        html += '<div class="cc-grid-4" style="margin-bottom:8px;">';
        DISPLAY_STRATEGIES.forEach(function (s) {
            const active = s === current;
            html += '<label class="cc-card" style="cursor:pointer;display:flex;align-items:flex-start;gap:10px;'
                + (active ? 'border-color:var(--cc-gold);box-shadow:0 0 0 2px rgba(212,175,55,.15);' : '') + '">';
            html += '<input type="radio" name="cc-strategy" value="' + s + '"' + (active ? ' checked' : '') + ' data-act="strategy-radio" style="margin-top:4px;accent-color:var(--cc-gold);" />';
            html += '<div>';
            html += '<div style="font-weight:600;color:var(--cc-text-primary);margin-bottom:4px;">' + s + '</div>';
            html += '<div style="font-size:11px;color:var(--cc-text-muted);">' + CCNumber._strategyDesc(s) + '</div>';
            html += '</div>';
            html += '</label>';
        });
        html += '</div>';
        html += '</div>';

        // 归属地匹配规则
        html += '<div class="cc-card">';
        html += '<div class="cc-card-header">';
        html += '<div class="cc-card-title">归属地匹配规则</div>';
        html += '<button class="cc-btn cc-btn-outline cc-btn-sm" data-act="add-region-rule">+ 新增规则</button>';
        html += '</div>';
        html += '<div class="cc-table-wrapper"><table class="cc-table">';
        html += '<thead><tr><th>区域</th><th>优先级</th><th>优先运营商</th><th style="width:120px;">操作</th></tr></thead><tbody>';
        if (rules.length === 0) {
            html += '<tr><td colspan="4"><div class="cc-empty"><div class="cc-empty-text">暂无规则</div></div></td></tr>';
        } else {
            rules.forEach(function (r, i) {
                html += '<tr>';
                html += '<td>' + ccEsc(r.region) + '</td>';
                html += '<td><span class="cc-badge">' + r.priority + '</span></td>';
                html += '<td>' + ccEsc(r.prefer_carrier) + '</td>';
                html += '<td><button class="cc-btn cc-btn-danger cc-btn-sm" data-act="del-region-rule" data-idx="' + i + '">删除</button></td>';
                html += '</tr>';
            });
        }
        html += '</tbody></table></div>';
        html += '<div style="margin-top:16px;text-align:right;">';
        html += '<button class="cc-btn cc-btn-primary" data-act="save-strategy">保存策略</button>';
        html += '</div>';
        html += '</div>';
        return html;
    },

    _strategyDesc: function (s) {
        const map = {
            '归属地匹配': '根据被叫归属地选择同区域号码',
            '轮询': '号码池中按顺序轮流使用',
            '随机': '从可用号码中随机选取',
            '固定号码': '所有外呼使用固定指定号码'
        };
        return map[s] || '';
    },

    // ===== 事件委托 =====
    handleEvents: function (e) {
        const target = e.target;
        if (!target || !target.closest) return;

        // 子Tab切换
        const tabBtn = target.closest('.cc-number-module > .cc-tabs .cc-tab');
        if (tabBtn && e.type === 'click') {
            this.currentView = tabBtn.dataset.subtab;
            this.searchKeyword = '';
            this.statusFilter = 'all';
            this.typeFilter = 'all';
            this._refresh();
            return;
        }

        // input 事件 - 搜索
        if (e.type === 'input') {
            const search = target.closest('[data-act="search"]');
            if (search) {
                this.searchKeyword = search.value;
                this._refresh();
                // 重新聚焦
                const root = document.querySelector('.cc-number-module');
                if (root) {
                    const sb = root.querySelector('[data-act="search"]');
                    if (sb) { sb.focus(); sb.setSelectionRange(sb.value.length, sb.value.length); }
                }
            }
            return;
        }

        // change 事件 - 筛选
        if (e.type === 'change') {
            if (target.matches('[data-act="type-filter"]')) {
                this.typeFilter = target.value;
                this._refresh();
                return;
            }
            if (target.matches('[data-act="status-filter"]')) {
                this.statusFilter = target.value;
                this._refresh();
                return;
            }
            if (target.matches('[data-act="strategy-radio"]')) {
                this._currentStrategySelected = target.value;
                return;
            }
        }

        // click 事件
        if (e.type !== 'click') return;
        const actEl = target.closest('[data-act]');
        if (!actEl) return;
        const act = actEl.dataset.act;
        const id = actEl.dataset.id;

        switch (act) {
            case 'add-phone': this.showPhoneModal(); break;
            case 'edit-phone': this.showPhoneModal(id); break;
            case 'toggle-phone': this._togglePhoneStatus(id); break;
            case 'delete-phone': this._deletePhone(id); break;
            case 'batch-import': this.showBatchImportModal(); break;
            case 'add-trunk': this.showTrunkModal(); break;
            case 'edit-trunk': this.showTrunkModal(id); break;
            case 'delete-trunk': this._deleteTrunk(id); break;
            case 'test-trunk': this._testTrunk(id); break;
            case 'add-region-rule': this._addRegionRule(); break;
            case 'del-region-rule': this._delRegionRule(parseInt(actEl.dataset.idx, 10)); break;
            case 'save-strategy': this._saveStrategy(); break;
        }
    },

    _togglePhoneStatus: function (id) {
        const p = PhoneNumberStorage.getById(id);
        if (!p) return;
        const next = p.status === 1 ? 0 : 1;
        PhoneNumberStorage.update(id, { status: next });
        ccShowToast(next === 1 ? '已启用' : '已停用', 'success');
        this._refresh();
    },

    _deletePhone: function (id) {
        if (!confirm('确定删除该号码？删除后将无法恢复。')) return;
        PhoneNumberStorage.delete(id);
        ccShowToast('已删除', 'success');
        this._refresh();
    },

    _deleteTrunk: function (id) {
        // 检查是否有号码关联
        const used = PhoneNumberStorage.getAll().some(function (p) { return p.trunk_id === id; });
        if (used) {
            ccShowToast('该中继下仍有号码，无法删除', 'error');
            return;
        }
        if (!confirm('确定删除该SIP中继？')) return;
        SipTrunkStorage.delete(id);
        ccShowToast('已删除', 'success');
        this._refresh();
    },

    _testTrunk: function (id) {
        const t = SipTrunkStorage.getById(id);
        if (!t) return;
        ccShowToast('正在测试 ' + t.name + ' ...', 'warning');
        setTimeout(function () {
            // 模拟连通成功
            SipTrunkStorage.update(id, { status: 1, last_check_time: new Date().toISOString() });
            ccShowToast(t.name + ' 连通成功', 'success');
            CCNumber._refresh();
        }, 2000);
    },

    _addRegionRule: function () {
        const region = prompt('输入区域名称（如 华东）：');
        if (!region) return;
        const carrier = prompt('优先运营商（电信/联通/移动）：') || '电信';
        const cfg = JSON.parse(localStorage.getItem(CC_NUMBER_KEYS.STRATEGY) || '{}');
        cfg.region_rules = cfg.region_rules || [];
        cfg.region_rules.push({ region: region, priority: cfg.region_rules.length + 1, prefer_carrier: carrier });
        localStorage.setItem(CC_NUMBER_KEYS.STRATEGY, JSON.stringify(cfg));
        ccShowToast('已添加规则', 'success');
        this._refresh();
    },

    _delRegionRule: function (idx) {
        const cfg = JSON.parse(localStorage.getItem(CC_NUMBER_KEYS.STRATEGY) || '{}');
        if (!cfg.region_rules || idx < 0 || idx >= cfg.region_rules.length) return;
        cfg.region_rules.splice(idx, 1);
        localStorage.setItem(CC_NUMBER_KEYS.STRATEGY, JSON.stringify(cfg));
        ccShowToast('已删除规则', 'success');
        this._refresh();
    },

    _saveStrategy: function () {
        const cfg = JSON.parse(localStorage.getItem(CC_NUMBER_KEYS.STRATEGY) || '{}');
        const root = document.querySelector('.cc-number-module');
        const checked = root && root.querySelector('[data-act="strategy-radio"]:checked');
        cfg.current = checked ? checked.value : (this._currentStrategySelected || '归属地匹配');
        cfg.update_time = new Date().toISOString();
        localStorage.setItem(CC_NUMBER_KEYS.STRATEGY, JSON.stringify(cfg));
        ccShowToast('策略已保存：' + cfg.current, 'success');
    },

    // ===== 模态框基础 =====
    _openModal: function (title, bodyHtml, onSubmit, footerExtra) {
        this._closeModal();
        const overlay = document.createElement('div');
        overlay.className = 'cc-modal-overlay';
        let html = '<div class="cc-modal">';
        html += '<div class="cc-modal-header">';
        html += '<div class="cc-modal-title">' + ccEsc(title) + '</div>';
        html += '<button class="cc-modal-close" data-modal-act="close">×</button>';
        html += '</div>';
        html += '<div class="cc-modal-body">' + bodyHtml + '</div>';
        html += '<div class="cc-modal-footer">';
        if (footerExtra) html += footerExtra;
        html += '<button class="cc-btn cc-btn-outline" data-modal-act="close">取消</button>';
        html += '<button class="cc-btn cc-btn-primary" data-modal-act="submit">确定</button>';
        html += '</div></div>';
        overlay.innerHTML = html;
        document.body.appendChild(overlay);
        this._modalEl = overlay;

        const self = this;
        overlay.addEventListener('click', function (e) {
            if (e.target === overlay) { self._closeModal(); return; }
            const btn = e.target.closest('[data-modal-act]');
            if (!btn) return;
            const act = btn.dataset.modalAct;
            if (act === 'close') self._closeModal();
            else if (act === 'submit') {
                const ok = onSubmit ? onSubmit(overlay) : true;
                if (ok !== false) self._closeModal();
            }
        });
    },

    _closeModal: function () {
        if (this._modalEl) {
            this._modalEl.remove();
            this._modalEl = null;
        }
    },

    // ===== 号码 新增/编辑 弹窗 =====
    showPhoneModal: function (phoneId) {
        const isEdit = !!phoneId;
        const data = isEdit ? (PhoneNumberStorage.getById(phoneId) || {}) : {};
        const trunks = SipTrunkStorage.getAll();

        let body = '<div class="cc-grid-2">';
        body += this._formField('号码 *', '<input type="text" class="cc-form-input" data-field="number" value="' + ccEsc(data.number || '') + '" placeholder="如 4008001234" />');
        body += this._formField('号码类型', this._select('number_type', NUMBER_TYPE_MAP, data.number_type || 2));
        body += this._formField('省份', '<input type="text" class="cc-form-input" data-field="province" value="' + ccEsc(data.province || '') + '" placeholder="如 浙江" />');
        body += this._formField('城市', '<input type="text" class="cc-form-input" data-field="city" value="' + ccEsc(data.city || '') + '" placeholder="如 杭州" />');
        body += this._formField('运营商', '<input type="text" class="cc-form-input" data-field="carrier" value="' + ccEsc(data.carrier || '') + '" placeholder="电信/联通/移动" />');
        body += this._formField('用途', this._select('usage_type', USAGE_TYPE_MAP, data.usage_type || 3));

        // 关联中继
        let trunkOpts = '<option value="">-- 不关联 --</option>';
        trunks.forEach(function (t) {
            trunkOpts += '<option value="' + t.trunk_id + '"' + (data.trunk_id === t.trunk_id ? ' selected' : '') + '>' + ccEsc(t.name) + '</option>';
        });
        body += this._formField('关联SIP中继', '<select class="cc-form-select" data-field="trunk_id">' + trunkOpts + '</select>');

        body += this._formField('绑定技能组', '<input type="text" class="cc-form-input" data-field="bind_skillgroup_id" value="' + ccEsc(data.bind_skillgroup_id || '') + '" placeholder="技能组ID（可选）" />');

        // 外显策略
        let stratOpts = '';
        DISPLAY_STRATEGIES.forEach(function (s) {
            stratOpts += '<option value="' + s + '"' + (data.display_strategy === s ? ' selected' : '') + '>' + s + '</option>';
        });
        body += this._formField('外显策略', '<select class="cc-form-select" data-field="display_strategy">' + stratOpts + '</select>');

        body += this._formField('到期日期', '<input type="date" class="cc-form-input" data-field="expire_date" value="' + ccEsc(data.expire_date || '') + '" />');
        body += this._formField('状态', this._select('status', NUMBER_STATUS_MAP, data.status != null ? data.status : 1));
        body += '</div>';

        const self = this;
        this._openModal(isEdit ? '编辑号码' : '新增号码', body, function (overlay) {
            const v = self._collect(overlay);
            if (!v.number) { ccShowToast('请输入号码', 'error'); return false; }
            const payload = {
                number: v.number,
                number_type: parseInt(v.number_type, 10) || 2,
                province: v.province || '',
                city: v.city || '',
                carrier: v.carrier || '',
                usage_type: parseInt(v.usage_type, 10) || 3,
                trunk_id: v.trunk_id || '',
                bind_skillgroup_id: v.bind_skillgroup_id || '',
                display_strategy: v.display_strategy || '归属地匹配',
                expire_date: v.expire_date || '',
                status: parseInt(v.status, 10)
            };
            if (isEdit) {
                PhoneNumberStorage.update(phoneId, payload);
                ccShowToast('已更新', 'success');
            } else {
                payload.phone_id = ccGenerateId('phone_');
                payload.create_time = new Date().toISOString();
                payload.deleted = false;
                PhoneNumberStorage.add(payload);
                ccShowToast('已新增', 'success');
            }
            self._refresh();
            return true;
        });
    },

    // ===== SIP中继 弹窗 =====
    showTrunkModal: function (trunkId) {
        const isEdit = !!trunkId;
        const data = isEdit ? (SipTrunkStorage.getById(trunkId) || {}) : {};

        let body = '<div class="cc-grid-2">';
        body += this._formField('名称 *', '<input type="text" class="cc-form-input" data-field="name" value="' + ccEsc(data.name || '') + '" placeholder="如 电信SIP中继-华东" />');
        body += this._formField('中继类型', this._select('trunk_type', TRUNK_TYPE_MAP, data.trunk_type || 1));
        body += this._formField('供应商', '<input type="text" class="cc-form-input" data-field="supplier" value="' + ccEsc(data.supplier || '') + '" placeholder="电信/联通/阿里云通信" />');
        body += this._formField('服务器地址 *', '<input type="text" class="cc-form-input" data-field="server_host" value="' + ccEsc(data.server_host || '') + '" placeholder="sip.example.com:5060" />');
        body += this._formField('用户名', '<input type="text" class="cc-form-input" data-field="username" value="' + ccEsc(data.username || '') + '" />');
        body += this._formField('密码', '<input type="password" class="cc-form-input" data-field="password" value="' + ccEsc(data.password || '') + '" />');
        body += this._formField('最大并发数', '<input type="number" class="cc-form-input" data-field="max_concurrent" value="' + (data.max_concurrent != null ? data.max_concurrent : 30) + '" min="1" />');
        body += this._formField('告警阈值(%)', '<input type="number" class="cc-form-input" data-field="alert_threshold" value="' + (data.alert_threshold != null ? data.alert_threshold : 80) + '" min="0" max="100" />');
        body += this._formField('每分钟费率(元)', '<input type="number" step="0.01" class="cc-form-input" data-field="rate_per_minute" value="' + (data.rate_per_minute != null ? data.rate_per_minute : 0.08) + '" min="0" />');
        body += this._formField('状态', this._select('status', TRUNK_STATUS_MAP, data.status != null ? data.status : 1));
        // 录音开关
        const recOn = data.recording_enabled !== false;
        const switchHtml = '<label style="display:inline-flex;align-items:center;gap:8px;cursor:pointer;">'
            + '<input type="checkbox" data-field="recording_enabled"' + (recOn ? ' checked' : '') + ' style="width:18px;height:18px;accent-color:var(--cc-gold);" />'
            + '<span style="color:var(--cc-text-secondary);font-size:13px;">开启通话录音</span></label>';
        body += this._formField('通话录音', switchHtml);
        body += '</div>';

        const self = this;
        this._openModal(isEdit ? '编辑SIP中继' : '新增SIP中继', body, function (overlay) {
            const v = self._collect(overlay);
            if (!v.name) { ccShowToast('请输入中继名称', 'error'); return false; }
            if (!v.server_host) { ccShowToast('请输入服务器地址', 'error'); return false; }
            const max = parseInt(v.max_concurrent, 10) || 30;
            const payload = {
                name: v.name,
                trunk_type: parseInt(v.trunk_type, 10) || 1,
                supplier: v.supplier || '',
                server_host: v.server_host,
                username: v.username || '',
                password: v.password || '',
                max_concurrent: max,
                alert_threshold: parseInt(v.alert_threshold, 10) || 80,
                rate_per_minute: parseFloat(v.rate_per_minute) || 0,
                recording_enabled: !!v.recording_enabled,
                status: parseInt(v.status, 10)
            };
            if (isEdit) {
                SipTrunkStorage.update(trunkId, payload);
                ccShowToast('已更新', 'success');
            } else {
                payload.trunk_id = ccGenerateId('trunk_');
                payload.current_concurrent = 0;
                payload.create_time = new Date().toISOString();
                payload.deleted = false;
                SipTrunkStorage.add(payload);
                ccShowToast('已新增', 'success');
            }
            self._refresh();
            return true;
        });
    },

    // ===== 批量导入 弹窗 =====
    showBatchImportModal: function () {
        const trunks = SipTrunkStorage.getAll();
        let trunkOpts = '<option value="">-- 不关联 --</option>';
        trunks.forEach(function (t) {
            trunkOpts += '<option value="' + t.trunk_id + '">' + ccEsc(t.name) + '</option>';
        });

        let body = '';
        body += '<div style="color:var(--cc-text-secondary);font-size:12px;margin-bottom:12px;">每行一个号码，将批量创建。已存在的号码会被跳过。</div>';
        body += '<div class="cc-grid-3">';
        body += this._formField('号码类型', this._select('number_type', NUMBER_TYPE_MAP, 2));
        body += this._formField('用途', this._select('usage_type', USAGE_TYPE_MAP, 3));
        body += this._formField('关联中继', '<select class="cc-form-select" data-field="trunk_id">' + trunkOpts + '</select>');
        body += '</div>';
        body += this._formField('号码列表 *', '<textarea class="cc-form-textarea" data-field="numbers" rows="10" placeholder="4008001234&#10;0571-88888888&#10;13800138000"></textarea>');

        const self = this;
        this._openModal('批量导入号码', body, function (overlay) {
            const v = self._collect(overlay);
            const lines = (v.numbers || '').split(/[\r\n,;\s]+/).map(function (s) { return s.trim(); }).filter(Boolean);
            if (lines.length === 0) { ccShowToast('请输入至少一个号码', 'error'); return false; }

            const existing = {};
            PhoneNumberStorage.getAll().forEach(function (p) { existing[p.number] = true; });

            let added = 0, skipped = 0;
            lines.forEach(function (n) {
                if (existing[n]) { skipped++; return; }
                PhoneNumberStorage.add({
                    phone_id: ccGenerateId('phone_'),
                    number: n,
                    number_type: parseInt(v.number_type, 10) || 2,
                    province: '', city: '', carrier: '',
                    usage_type: parseInt(v.usage_type, 10) || 3,
                    trunk_id: v.trunk_id || '',
                    bind_skillgroup_id: '',
                    display_strategy: '归属地匹配',
                    expire_date: '',
                    status: 1,
                    create_time: new Date().toISOString(),
                    deleted: false
                });
                added++;
            });
            ccShowToast('导入完成：新增 ' + added + ' 条' + (skipped ? '，跳过 ' + skipped + ' 条' : ''), 'success');
            self._refresh();
            return true;
        });
    },

    // ===== 表单工具 =====
    _formField: function (label, controlHtml) {
        return '<div class="cc-form-group"><label class="cc-form-label">' + label + '</label>' + controlHtml + '</div>';
    },

    _select: function (field, map, value) {
        let html = '<select class="cc-form-select" data-field="' + field + '">';
        Object.keys(map).forEach(function (k) {
            const sel = String(k) === String(value) ? ' selected' : '';
            html += '<option value="' + k + '"' + sel + '>' + map[k] + '</option>';
        });
        html += '</select>';
        return html;
    },

    _collect: function (overlay) {
        const obj = {};
        overlay.querySelectorAll('[data-field]').forEach(function (el) {
            const key = el.dataset.field;
            if (el.type === 'checkbox') obj[key] = el.checked;
            else obj[key] = el.value;
        });
        return obj;
    },

    // ===== 种子数据 =====
    initSeedData: function () {
        const trunks = SipTrunkStorage.getRaw();
        if (trunks.length === 0) {
            const seedTrunks = [
                { name: '电信SIP中继-华东', trunk_type: 1, supplier: '中国电信', server_host: 'sip.ct-east.com:5060', username: 'ctcc_001', password: '******', max_concurrent: 100, current_concurrent: 32, alert_threshold: 85, rate_per_minute: 0.08, recording_enabled: true, status: 1 },
                { name: '联通SIP中继-华南', trunk_type: 1, supplier: '中国联通', server_host: 'sip.cu-south.com:5060', username: 'cucc_002', password: '******', max_concurrent: 60, current_concurrent: 48, alert_threshold: 80, rate_per_minute: 0.10, recording_enabled: true, status: 1 },
                { name: '阿里云通信-云API', trunk_type: 4, supplier: '阿里云通信', server_host: 'dyvms.aliyuncs.com', username: 'LTAI******', password: '******', max_concurrent: 200, current_concurrent: 56, alert_threshold: 90, rate_per_minute: 0.06, recording_enabled: true, status: 1 },
                { name: '移动IMS中继', trunk_type: 3, supplier: '中国移动', server_host: 'ims.cmcc.com:5060', username: 'cmcc_003', password: '******', max_concurrent: 50, current_concurrent: 0, alert_threshold: 80, rate_per_minute: 0.09, recording_enabled: false, status: 0 },
                { name: '备用E1中继', trunk_type: 2, supplier: '本地机房', server_host: '192.168.10.21:5060', username: 'e1_local', password: '******', max_concurrent: 30, current_concurrent: 5, alert_threshold: 70, rate_per_minute: 0.05, recording_enabled: true, status: 2 }
            ];
            seedTrunks.forEach(function (t) {
                t.trunk_id = ccGenerateId('trunk_');
                t.create_time = new Date().toISOString();
                t.deleted = false;
                SipTrunkStorage.add(t);
            });
        }

        const phones = PhoneNumberStorage.getRaw();
        if (phones.length === 0) {
            const allTrunks = SipTrunkStorage.getAll();
            const trunkId = function (i) { return allTrunks[i % allTrunks.length] ? allTrunks[i % allTrunks.length].trunk_id : ''; };
            const seedPhones = [
                { number: '4008001234', number_type: 2, province: '浙江', city: '杭州', carrier: '中国电信', usage_type: 3, trunk_idx: 0, status: 1, expire_date: '2027-12-31' },
                { number: '4006002345', number_type: 2, province: '广东', city: '深圳', carrier: '中国联通', usage_type: 1, trunk_idx: 1, status: 1, expire_date: '2027-06-30' },
                { number: '95566001', number_type: 3, province: '北京', city: '北京', carrier: '中国移动', usage_type: 3, trunk_idx: 3, status: 0, expire_date: '2026-12-31' },
                { number: '0571-88880001', number_type: 1, province: '浙江', city: '杭州', carrier: '中国电信', usage_type: 2, trunk_idx: 0, status: 1, expire_date: '2026-08-15' },
                { number: '0571-88880002', number_type: 1, province: '浙江', city: '杭州', carrier: '中国电信', usage_type: 2, trunk_idx: 0, status: 1, expire_date: '2026-08-15' },
                { number: '021-66660001', number_type: 1, province: '上海', city: '上海', carrier: '中国联通', usage_type: 2, trunk_idx: 1, status: 1, expire_date: '2027-03-20' },
                { number: '020-55550001', number_type: 1, province: '广东', city: '广州', carrier: '中国电信', usage_type: 2, trunk_idx: 0, status: 2, expire_date: '2026-05-30' },
                { number: '13800138001', number_type: 4, province: '浙江', city: '杭州', carrier: '中国移动', usage_type: 2, trunk_idx: 2, status: 1, expire_date: '2028-01-01' },
                { number: '13900139002', number_type: 4, province: '广东', city: '深圳', carrier: '中国联通', usage_type: 2, trunk_idx: 2, status: 1, expire_date: '2028-01-01' },
                { number: '15800158003', number_type: 4, province: '上海', city: '上海', carrier: '中国移动', usage_type: 4, trunk_idx: 2, status: 1, expire_date: '2028-01-01' },
                { number: '17000170001', number_type: 5, province: '虚拟', city: '虚拟', carrier: '虚拟运营商', usage_type: 2, trunk_idx: 2, status: 1, expire_date: '2027-12-31' },
                { number: '17100171002', number_type: 5, province: '虚拟', city: '虚拟', carrier: '虚拟运营商', usage_type: 2, trunk_idx: 2, status: 3, expire_date: '2025-01-01' },
                { number: '4001003456', number_type: 2, province: '江苏', city: '南京', carrier: '中国电信', usage_type: 1, trunk_idx: 0, status: 1, expire_date: '2027-09-15' }
            ];
            seedPhones.forEach(function (p) {
                const item = {
                    phone_id: ccGenerateId('phone_'),
                    number: p.number,
                    number_type: p.number_type,
                    province: p.province,
                    city: p.city,
                    carrier: p.carrier,
                    usage_type: p.usage_type,
                    trunk_id: trunkId(p.trunk_idx),
                    bind_skillgroup_id: '',
                    display_strategy: '归属地匹配',
                    expire_date: p.expire_date,
                    status: p.status,
                    create_time: new Date().toISOString(),
                    deleted: false
                };
                PhoneNumberStorage.add(item);
            });
        }

        // 默认外显策略
        if (!localStorage.getItem(CC_NUMBER_KEYS.STRATEGY)) {
            localStorage.setItem(CC_NUMBER_KEYS.STRATEGY, JSON.stringify({
                current: '归属地匹配',
                region_rules: [
                    { region: '华东', priority: 1, prefer_carrier: '电信' },
                    { region: '华南', priority: 2, prefer_carrier: '联通' },
                    { region: '华北', priority: 3, prefer_carrier: '移动' }
                ],
                update_time: new Date().toISOString()
            }));
        }
    }
};

// 暴露到全局，供 CallCenter 主模块调用
window.CCNumber = CCNumber;
window.PhoneNumberStorage = PhoneNumberStorage;
window.SipTrunkStorage = SipTrunkStorage;
