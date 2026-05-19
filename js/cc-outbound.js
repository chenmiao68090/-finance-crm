/**
 * 呼叫中心 - 外呼任务管理模块
 * 提供：外呼任务CRUD、号码清单管理、预测式外呼算法可视化
 * 数据存储：localStorage（cc_outbound_tasks / cc_outbound_phones）
 * UI风格：黑金奢华主题（cc-style.css）
 */

/* ============================================================
   1. 常量
   ============================================================ */
const CC_OUTBOUND_KEYS = {
    TASKS: 'cc_outbound_tasks',
    PHONES: 'cc_outbound_phones'
};

const OB_TASK_TYPE_MAP = { 1: '营销', 2: '回访', 3: '通知', 4: '催收', 5: '调研' };
const OB_DIAL_MODE_MAP = { 1: '预览式', 2: '预测式', 3: '自动语音' };
const OB_DIAL_MODE_DESC = {
    1: '坐席先看号码资料，确认后点击拨打',
    2: '系统按倍率预拨号，接通后转给空闲坐席',
    3: '系统自动播放语音，无需人工介入'
};
const OB_TASK_STATUS_MAP = { 0: '草稿', 1: '执行中', 2: '暂停', 3: '已完成', 4: '已终止' };
const OB_PHONE_STATUS_MAP = {
    0: '待拨打', 1: '拨打中', 2: '已接通', 3: '未接通',
    4: '空号', 5: '停机', 6: '拒接', 7: '预约回拨'
};
const OB_INTENT_LEVEL_MAP = {
    1: 'A级(高意向)', 2: 'B级(有意向)', 3: 'C级(一般)', 4: 'D级(无意向)'
};

/* ============================================================
   2. 样式注入
   ============================================================ */
(function () {
    if (document.getElementById('cc-outbound-styles')) return;
    const style = document.createElement('style');
    style.id = 'cc-outbound-styles';
    style.textContent = ''
        + '.cc-progress-bar { height: 6px; background: #1A1A24; border-radius: 3px; overflow: hidden; }'
        + '.cc-progress-fill { height: 100%; border-radius: 3px; transition: width 0.5s; }'
        + '.cc-progress-fill-gold { background: linear-gradient(90deg, #B8860B, #D4AF37); }'
        + '.cc-progress-fill-green { background: linear-gradient(90deg, #059669, #00D084); }'
        + '.cc-progress-fill-red { background: linear-gradient(90deg, #DC2626, #FF4D4F); }'
        + '.cc-intent-a { background: rgba(255,77,79,0.15); color: #FF4D4F; padding: 2px 8px; border-radius: 4px; font-size: 11px; }'
        + '.cc-intent-b { background: rgba(245,158,11,0.15); color: #F59E0B; padding: 2px 8px; border-radius: 4px; font-size: 11px; }'
        + '.cc-intent-c { background: rgba(91,141,239,0.15); color: #5B8DEF; padding: 2px 8px; border-radius: 4px; font-size: 11px; }'
        + '.cc-intent-d { background: rgba(107,114,128,0.15); color: #6B7280; padding: 2px 8px; border-radius: 4px; font-size: 11px; }'
        + '.cc-step-section { margin-bottom: 24px; padding: 20px; background: #0A0A0F; border: 1px solid rgba(212,175,55,0.1); border-radius: 8px; }'
        + '.cc-step-title { font-size: 14px; color: #D4AF37; margin-bottom: 12px; font-weight: 600; }'
        + '.cc-dial-mode-cards { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; }'
        + '.cc-dial-mode-card { padding: 16px; background: #12121A; border: 2px solid rgba(212,175,55,0.15); border-radius: 8px; cursor: pointer; text-align: center; transition: all 0.2s; }'
        + '.cc-dial-mode-card.selected { border-color: #D4AF37; background: rgba(212,175,55,0.05); }'
        + '.cc-dial-mode-card:hover { border-color: rgba(212,175,55,0.4); }'
        + '.cc-predictive-panel { background: #12121A; border: 1px solid rgba(212,175,55,0.2); border-radius: 10px; padding: 20px; }'
        + '.cc-predictive-slider { width: 100%; appearance: none; height: 4px; background: #333; border-radius: 2px; outline: none; }'
        + '.cc-predictive-slider::-webkit-slider-thumb { appearance: none; width: 16px; height: 16px; border-radius: 50%; background: #D4AF37; cursor: pointer; }'
        + '.cc-task-status-0 { background:rgba(107,114,128,0.18); color:#9CA3AF; padding:2px 10px; border-radius:4px; font-size:11px; }'
        + '.cc-task-status-1 { background:rgba(0,208,132,0.18); color:#00D084; padding:2px 10px; border-radius:4px; font-size:11px; }'
        + '.cc-task-status-2 { background:rgba(245,158,11,0.18); color:#F59E0B; padding:2px 10px; border-radius:4px; font-size:11px; }'
        + '.cc-task-status-3 { background:rgba(91,141,239,0.18); color:#5B8DEF; padding:2px 10px; border-radius:4px; font-size:11px; }'
        + '.cc-task-status-4 { background:rgba(255,77,79,0.18); color:#FF4D4F; padding:2px 10px; border-radius:4px; font-size:11px; }'
        + '.cc-ob-tag { display:inline-block; padding:2px 8px; border-radius:4px; font-size:11px; background:rgba(212,175,55,0.12); color:#D4AF37; }'
        + '.cc-metric-card { background:#0F0F18; border:1px solid rgba(212,175,55,0.12); border-radius:8px; padding:16px; }'
        + '.cc-metric-value { font-size:22px; font-weight:700; color:#D4AF37; line-height:1; }'
        + '.cc-metric-label { font-size:11px; color:#9CA3AF; margin-top:6px; }'
        + '.cc-ob-subtab { display:flex; gap:4px; border-bottom:1px solid rgba(212,175,55,0.15); margin-bottom:16px; }'
        + '.cc-ob-subtab > button { background:transparent; border:none; padding:10px 18px; color:#9CA3AF; cursor:pointer; font-size:13px; border-bottom:2px solid transparent; }'
        + '.cc-ob-subtab > button.active { color:#D4AF37; border-bottom-color:#D4AF37; }';
    document.head.appendChild(style);
})();

/* ============================================================
   3. Storage
   ============================================================ */
const OutboundTaskStorage = {
    _read: function () {
        try { return JSON.parse(localStorage.getItem(CC_OUTBOUND_KEYS.TASKS) || '[]'); }
        catch (e) { return []; }
    },
    _write: function (list) {
        localStorage.setItem(CC_OUTBOUND_KEYS.TASKS, JSON.stringify(list));
    },
    getAll: function () {
        return this._read().filter(function (t) { return !t.deleted; });
    },
    getRaw: function () { return this._read(); },
    getById: function (id) {
        return this._read().find(function (t) { return t.task_id === id; });
    },
    add: function (item) {
        const list = this._read();
        list.push(item);
        this._write(list);
        return item;
    },
    update: function (id, patch) {
        const list = this._read();
        const idx = list.findIndex(function (t) { return t.task_id === id; });
        if (idx < 0) return null;
        list[idx] = Object.assign({}, list[idx], patch, { update_time: new Date().toISOString() });
        this._write(list);
        return list[idx];
    },
    delete: function (id) { return this.update(id, { deleted: true }); }
};

const OutboundPhoneStorage = {
    _read: function () {
        try { return JSON.parse(localStorage.getItem(CC_OUTBOUND_KEYS.PHONES) || '[]'); }
        catch (e) { return []; }
    },
    _write: function (list) {
        localStorage.setItem(CC_OUTBOUND_KEYS.PHONES, JSON.stringify(list));
    },
    getAll: function () {
        return this._read().filter(function (p) { return !p.deleted; });
    },
    getRaw: function () { return this._read(); },
    getByTaskId: function (taskId) {
        return this._read().filter(function (p) { return !p.deleted && p.task_id === taskId; });
    },
    getById: function (id) {
        return this._read().find(function (p) { return p.phone_id === id; });
    },
    add: function (item) {
        const list = this._read();
        list.push(item);
        this._write(list);
        return item;
    },
    addBatch: function (items) {
        const list = this._read();
        items.forEach(function (it) { list.push(it); });
        this._write(list);
        return items.length;
    },
    update: function (id, patch) {
        const list = this._read();
        const idx = list.findIndex(function (p) { return p.phone_id === id; });
        if (idx < 0) return null;
        list[idx] = Object.assign({}, list[idx], patch, { update_time: new Date().toISOString() });
        this._write(list);
        return list[idx];
    },
    delete: function (id) { return this.update(id, { deleted: true }); },
    getStats: function (taskId) {
        const list = this.getByTaskId(taskId);
        const stat = {
            total: list.length, pending: 0, dialing: 0, connected: 0,
            unreached: 0, invalid: 0, stopped: 0, rejected: 0, callback: 0
        };
        const map = { 0: 'pending', 1: 'dialing', 2: 'connected', 3: 'unreached', 4: 'invalid', 5: 'stopped', 6: 'rejected', 7: 'callback' };
        list.forEach(function (p) {
            const k = map[p.status]; if (k) stat[k]++;
        });
        stat.completed = stat.connected + stat.unreached + stat.invalid + stat.stopped + stat.rejected + stat.callback;
        stat.connect_rate = stat.completed > 0 ? Math.round(stat.connected / stat.completed * 100) : 0;
        stat.progress = stat.total > 0 ? Math.round(stat.completed / stat.total * 100) : 0;
        return stat;
    }
};

/* ============================================================
   4. 工具函数（兼容已有的全局工具）
   ============================================================ */
if (typeof window.ccGenerateId !== 'function') {
    window.ccGenerateId = function (prefix) {
        return (prefix || '') + Date.now().toString(36) + Math.random().toString(36).substr(2, 6);
    };
}
if (typeof window.ccShowToast !== 'function') {
    window.ccShowToast = function (msg, type) {
        type = type || 'success';
        const t = document.createElement('div');
        t.className = 'cc-toast cc-toast-' + type;
        t.textContent = msg;
        document.body.appendChild(t);
        setTimeout(function () { t.style.opacity = '0'; setTimeout(function () { t.remove(); }, 300); }, 2200);
    };
}
function obEsc(s) {
    if (s === null || s === undefined) return '';
    return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}
function obFmtTime(ts) {
    if (!ts) return '-';
    const d = new Date(ts);
    const pad = function (n) { return n < 10 ? '0' + n : '' + n; };
    return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate())
        + ' ' + pad(d.getHours()) + ':' + pad(d.getMinutes());
}
function obFmtDuration(sec) {
    if (!sec || sec <= 0) return '-';
    const m = Math.floor(sec / 60), s = sec % 60;
    return (m > 0 ? m + '分' : '') + s + '秒';
}

/* ============================================================
   5. CCOutbound 主对象
   ============================================================ */
const CCOutbound = {
    currentView: 'tasks',     // tasks | taskDetail | phones
    selectedTaskId: null,
    detailTab: 'phones',      // phones | predictive | logs
    taskFilter: 'all',
    phoneFilter: 'all',
    searchKeyword: '',
    currentPage: 1,
    pageSize: 20,
    _modalEl: null,
    _statTimer: null,
    _predictiveRate: 2.0,

    /* ---------- 渲染入口 ---------- */
    render: function (container) {
        this.initSeedData();
        const html = '<div class="cc-outbound-module">' + this._renderContent() + '</div>';
        if (container) {
            container.innerHTML = html;
            this._bindEvents(container);
        }
        return html;
    },

    _renderContent: function () {
        if (this.currentView === 'taskDetail' && this.selectedTaskId) {
            return this.renderTaskDetail(this.selectedTaskId);
        }
        return this.renderTaskList();
    },

    _bindEvents: function (root) {
        const self = this;
        if (root._ccObBound) return;
        root._ccObBound = true;
        root.addEventListener('click', function (e) { self.handleEvents(e); });
        root.addEventListener('input', function (e) { self.handleEvents(e); });
        root.addEventListener('change', function (e) { self.handleEvents(e); });
    },

    _refresh: function () {
        const root = document.querySelector('.cc-outbound-module');
        if (!root) return;
        root.innerHTML = this._renderContent();
    },

    /* ---------- 5.1 任务列表 ---------- */
    renderTaskList: function () {
        const all = OutboundTaskStorage.getAll();
        const kw = this.searchKeyword.trim().toLowerCase();
        const self = this;
        const filtered = all.filter(function (t) {
            if (self.taskFilter !== 'all' && String(t.status) !== self.taskFilter) return false;
            if (!kw) return true;
            return (t.name || '').toLowerCase().indexOf(kw) >= 0;
        });

        // 全局统计
        const totalTasks = all.length;
        const runningTasks = all.filter(function (t) { return t.status === 1; }).length;
        let totalDial = 0, totalConn = 0;
        all.forEach(function (t) {
            const s = OutboundPhoneStorage.getStats(t.task_id);
            totalDial += s.completed;
            totalConn += s.connected;
        });
        const todayRate = totalDial > 0 ? Math.round(totalConn / totalDial * 100) : 0;

        let html = '';
        // 工具栏
        html += '<div class="cc-toolbar">';
        html += '<input type="text" class="cc-search-input" placeholder="搜索任务名称" data-act="search" value="' + obEsc(this.searchKeyword) + '" />';
        html += '<select class="cc-form-select" style="width:140px;" data-act="task-filter">';
        html += '<option value="all"' + (this.taskFilter === 'all' ? ' selected' : '') + '>全部状态</option>';
        Object.keys(OB_TASK_STATUS_MAP).forEach(function (k) {
            html += '<option value="' + k + '"' + (self.taskFilter === k ? ' selected' : '') + '>' + OB_TASK_STATUS_MAP[k] + '</option>';
        });
        html += '</select>';
        html += '<button class="cc-btn cc-btn-primary" data-act="new-task">+ 新建外呼任务</button>';
        html += '</div>';

        // 统计卡
        html += '<div class="cc-stat-grid" style="grid-template-columns:repeat(4,1fr);">';
        html += this._statCard('总任务数', totalTasks);
        html += this._statCard('执行中', runningTasks);
        html += this._statCard('今日接通率', todayRate + '%');
        html += this._statCard('总拨打量', totalDial.toLocaleString());
        html += '</div>';

        // 表格
        html += '<div class="cc-table-wrapper"><table class="cc-table">';
        html += '<thead><tr>';
        html += '<th>任务名称</th><th>类型</th><th>拨号方式</th><th style="width:140px;">号码数(完成/总)</th>';
        html += '<th style="width:160px;">接通率</th><th>状态</th><th>创建时间</th><th style="width:240px;">操作</th>';
        html += '</tr></thead><tbody>';

        if (filtered.length === 0) {
            html += '<tr><td colspan="8"><div class="cc-empty"><div class="cc-empty-icon">📞</div><div class="cc-empty-text">暂无外呼任务，点击右上角创建</div></div></td></tr>';
        } else {
            filtered.forEach(function (t) {
                const stat = OutboundPhoneStorage.getStats(t.task_id);
                html += '<tr>';
                html += '<td style="font-weight:600;color:var(--cc-gold,#D4AF37);cursor:pointer;" data-act="view-task" data-id="' + t.task_id + '">' + obEsc(t.name) + '</td>';
                html += '<td><span class="cc-ob-tag">' + (OB_TASK_TYPE_MAP[t.task_type] || '-') + '</span></td>';
                html += '<td>' + (OB_DIAL_MODE_MAP[t.dial_mode] || '-') + '</td>';
                html += '<td><span style="color:#00D084;">' + stat.completed + '</span> / ' + stat.total + '</td>';
                html += '<td>';
                html += '<div style="display:flex;align-items:center;gap:8px;">';
                html += '<div class="cc-progress-bar" style="flex:1;">';
                html += '<div class="cc-progress-fill cc-progress-fill-gold" style="width:' + stat.connect_rate + '%;"></div>';
                html += '</div>';
                html += '<span style="font-size:11px;color:#9CA3AF;width:38px;text-align:right;">' + stat.connect_rate + '%</span>';
                html += '</div>';
                html += '</td>';
                html += '<td><span class="cc-task-status-' + t.status + '">' + (OB_TASK_STATUS_MAP[t.status] || '-') + '</span></td>';
                html += '<td style="font-size:12px;color:#9CA3AF;">' + obFmtTime(t.create_time) + '</td>';
                html += '<td>' + self._taskActionButtons(t) + '</td>';
                html += '</tr>';
            });
        }
        html += '</tbody></table></div>';
        return html;
    },

    _taskActionButtons: function (t) {
        const id = t.task_id;
        let html = '';
        if (t.status === 0) {
            html += '<button class="cc-btn cc-btn-outline cc-btn-sm" data-act="edit-task" data-id="' + id + '">编辑</button> ';
            html += '<button class="cc-btn cc-btn-primary cc-btn-sm" data-act="start-task" data-id="' + id + '">启动</button> ';
            html += '<button class="cc-btn cc-btn-danger cc-btn-sm" data-act="delete-task" data-id="' + id + '">删除</button>';
        } else if (t.status === 1) {
            html += '<button class="cc-btn cc-btn-outline cc-btn-sm" data-act="pause-task" data-id="' + id + '">暂停</button> ';
            html += '<button class="cc-btn cc-btn-danger cc-btn-sm" data-act="terminate-task" data-id="' + id + '">终止</button> ';
            html += '<button class="cc-btn cc-btn-outline cc-btn-sm" data-act="view-task" data-id="' + id + '">查看</button>';
        } else if (t.status === 2) {
            html += '<button class="cc-btn cc-btn-primary cc-btn-sm" data-act="resume-task" data-id="' + id + '">恢复</button> ';
            html += '<button class="cc-btn cc-btn-danger cc-btn-sm" data-act="terminate-task" data-id="' + id + '">终止</button> ';
            html += '<button class="cc-btn cc-btn-outline cc-btn-sm" data-act="view-task" data-id="' + id + '">查看</button>';
        } else {
            html += '<button class="cc-btn cc-btn-outline cc-btn-sm" data-act="view-task" data-id="' + id + '">查看</button> ';
            html += '<button class="cc-btn cc-btn-outline cc-btn-sm" data-act="copy-task" data-id="' + id + '">复制</button>';
        }
        return html;
    },

    /* ---------- 5.2 任务详情 ---------- */
    renderTaskDetail: function (taskId) {
        const t = OutboundTaskStorage.getById(taskId);
        if (!t) {
            return '<div class="cc-empty"><div class="cc-empty-text">任务不存在</div>'
                + '<button class="cc-btn cc-btn-outline cc-btn-sm" data-act="back-to-list">返回列表</button></div>';
        }
        const stat = OutboundPhoneStorage.getStats(taskId);
        const dialRate = t.status === 1 ? (15 + Math.floor(Math.random() * 25)) : 0;

        let html = '';
        // 顶部返回 + 操作
        html += '<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:16px;">';
        html += '<button class="cc-btn cc-btn-outline cc-btn-sm" data-act="back-to-list">‹ 返回任务列表</button>';
        html += '<div>' + this._taskActionButtons(t) + '</div>';
        html += '</div>';

        // 基本信息卡
        html += '<div class="cc-card" style="margin-bottom:16px;">';
        html += '<div style="display:grid;grid-template-columns:repeat(5,1fr);gap:16px;">';
        html += this._infoBlock('任务名称', '<span style="color:#D4AF37;font-weight:600;">' + obEsc(t.name) + '</span>');
        html += this._infoBlock('类型', '<span class="cc-ob-tag">' + (OB_TASK_TYPE_MAP[t.task_type] || '-') + '</span>');
        html += this._infoBlock('拨号方式', OB_DIAL_MODE_MAP[t.dial_mode] || '-');
        html += this._infoBlock('时间范围', obEsc((t.start_date || '-') + ' ~ ' + (t.end_date || '-')));
        html += this._infoBlock('状态', '<span class="cc-task-status-' + t.status + '">' + (OB_TASK_STATUS_MAP[t.status] || '-') + '</span>');
        html += '</div></div>';

        // 执行统计面板
        html += '<div class="cc-card" style="margin-bottom:16px;">';
        html += '<div class="cc-card-header"><div class="cc-card-title">实时执行统计</div>';
        html += '<span style="color:#9CA3AF;font-size:12px;">拨号速率：<span style="color:#00D084;font-weight:600;">' + dialRate + '</span> 通/分钟</span>';
        html += '</div>';
        html += '<div style="display:grid;grid-template-columns:repeat(6,1fr);gap:12px;margin-bottom:16px;">';
        html += this._metric(stat.completed, '已拨打', '#D4AF37');
        html += this._metric(stat.connected, '已接通', '#00D084');
        html += this._metric(stat.connect_rate + '%', '接通率', '#5B8DEF');
        html += this._metric(stat.unreached, '未接通', '#9CA3AF');
        html += this._metric(stat.rejected, '拒接', '#FF4D4F');
        html += this._metric(stat.invalid, '空号', '#F59E0B');
        html += '</div>';
        html += '<div>';
        html += '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px;">';
        html += '<span style="color:#9CA3AF;font-size:12px;">完成进度</span>';
        html += '<span style="color:#D4AF37;font-size:12px;font-weight:600;">' + stat.completed + ' / ' + stat.total + ' (' + stat.progress + '%)</span>';
        html += '</div>';
        html += '<div class="cc-progress-bar" style="height:8px;">';
        html += '<div class="cc-progress-fill cc-progress-fill-gold" style="width:' + stat.progress + '%;"></div>';
        html += '</div></div>';
        html += '</div>';

        // 详情子Tab
        html += '<div class="cc-ob-subtab">';
        html += '<button class="' + (this.detailTab === 'phones' ? 'active' : '') + '" data-act="detail-tab" data-tab="phones">号码清单（' + stat.total + '）</button>';
        html += '<button class="' + (this.detailTab === 'predictive' ? 'active' : '') + '" data-act="detail-tab" data-tab="predictive">预测式外呼</button>';
        html += '<button class="' + (this.detailTab === 'logs' ? 'active' : '') + '" data-act="detail-tab" data-tab="logs">执行日志</button>';
        html += '</div>';

        if (this.detailTab === 'phones') {
            html += this.renderPhoneList(taskId);
        } else if (this.detailTab === 'predictive') {
            html += this.renderPredictiveContent(taskId);
        } else {
            html += this.renderExecutionLogs(taskId);
        }

        return html;
    },

    _infoBlock: function (label, value) {
        return '<div><div style="font-size:11px;color:#9CA3AF;margin-bottom:4px;">' + label + '</div>'
            + '<div style="font-size:13px;color:#E5E7EB;">' + value + '</div></div>';
    },
    _metric: function (val, label, color) {
        return '<div class="cc-metric-card"><div class="cc-metric-value" style="color:' + color + ';">'
            + val + '</div><div class="cc-metric-label">' + label + '</div></div>';
    },
    _statCard: function (label, value) {
        return '<div class="cc-stat-card"><div class="cc-stat-value">' + value + '</div><div class="cc-stat-label">' + label + '</div></div>';
    },

    /* ---------- 5.3 号码清单 ---------- */
    renderPhoneList: function (taskId) {
        const all = OutboundPhoneStorage.getByTaskId(taskId);
        const kw = this.searchKeyword.trim().toLowerCase();
        const self = this;
        const filtered = all.filter(function (p) {
            if (self.phoneFilter !== 'all' && String(p.status) !== self.phoneFilter) return false;
            if (!kw) return true;
            return (p.customer_name || '').toLowerCase().indexOf(kw) >= 0
                || (p.phone || '').indexOf(kw) >= 0;
        });

        let html = '';
        html += '<div class="cc-toolbar">';
        html += '<input type="text" class="cc-search-input" placeholder="搜索姓名 / 电话" data-act="search" value="' + obEsc(this.searchKeyword) + '" />';
        html += '<select class="cc-form-select" style="width:140px;" data-act="phone-filter">';
        html += '<option value="all"' + (this.phoneFilter === 'all' ? ' selected' : '') + '>全部状态</option>';
        Object.keys(OB_PHONE_STATUS_MAP).forEach(function (k) {
            html += '<option value="' + k + '"' + (self.phoneFilter === k ? ' selected' : '') + '>' + OB_PHONE_STATUS_MAP[k] + '</option>';
        });
        html += '</select>';
        html += '<button class="cc-btn cc-btn-primary" data-act="import-phones" data-id="' + taskId + '">📥 导入号码</button>';
        html += '<button class="cc-btn cc-btn-outline" data-act="dedupe-phones" data-id="' + taskId + '">🧹 清洗去重</button>';
        html += '</div>';

        html += '<div class="cc-table-wrapper"><table class="cc-table">';
        html += '<thead><tr>';
        html += '<th>客户姓名</th><th>电话号码</th><th>归属地</th><th>状态</th>';
        html += '<th>拨打次数</th><th>最后拨打</th><th>通话时长</th><th>意向等级</th>';
        html += '<th style="width:220px;">操作</th>';
        html += '</tr></thead><tbody>';

        if (filtered.length === 0) {
            html += '<tr><td colspan="9"><div class="cc-empty"><div class="cc-empty-icon">📋</div><div class="cc-empty-text">暂无号码，点击导入号码批量录入</div></div></td></tr>';
        } else {
            filtered.slice(0, 200).forEach(function (p) {
                html += '<tr>';
                html += '<td>' + obEsc(p.customer_name || '-') + '</td>';
                html += '<td style="font-family:monospace;color:#D4AF37;">' + obEsc(p.phone) + '</td>';
                html += '<td style="font-size:12px;color:#9CA3AF;">' + (obEsc((p.province || '') + (p.city ? ' / ' + p.city : '')) || '-') + '</td>';
                html += '<td>' + self._renderPhoneStatus(p.status) + '</td>';
                html += '<td>' + (p.dial_count || 0) + '</td>';
                html += '<td style="font-size:12px;color:#9CA3AF;">' + obFmtTime(p.last_dial_time) + '</td>';
                html += '<td>' + obFmtDuration(p.duration_sec) + '</td>';
                html += '<td>' + self._renderIntent(p.intent_level) + '</td>';
                html += '<td>';
                html += '<button class="cc-btn cc-btn-outline cc-btn-sm" data-act="mark-intent" data-id="' + p.phone_id + '">标意向</button> ';
                html += '<button class="cc-btn cc-btn-outline cc-btn-sm" data-act="view-feedback" data-id="' + p.phone_id + '">反馈</button> ';
                html += '<button class="cc-btn cc-btn-danger cc-btn-sm" data-act="remove-phone" data-id="' + p.phone_id + '">移除</button>';
                html += '</td></tr>';
            });
            if (filtered.length > 200) {
                html += '<tr><td colspan="9" style="text-align:center;color:#9CA3AF;font-size:12px;padding:12px;">共 ' + filtered.length + ' 条记录，仅显示前 200 条</td></tr>';
            }
        }
        html += '</tbody></table></div>';
        return html;
    },

    _renderPhoneStatus: function (s) {
        const text = OB_PHONE_STATUS_MAP[s] || '-';
        const colorMap = {
            0: '#9CA3AF', 1: '#F59E0B', 2: '#00D084', 3: '#9CA3AF',
            4: '#FF4D4F', 5: '#FF4D4F', 6: '#FF4D4F', 7: '#5B8DEF'
        };
        const c = colorMap[s] || '#9CA3AF';
        return '<span style="background:' + c + '22;color:' + c + ';padding:2px 8px;border-radius:4px;font-size:11px;">' + text + '</span>';
    },

    _renderIntent: function (lvl) {
        if (!lvl) return '<span style="color:#6B7280;font-size:11px;">未标记</span>';
        const cls = ['', 'cc-intent-a', 'cc-intent-b', 'cc-intent-c', 'cc-intent-d'][lvl];
        return '<span class="' + cls + '">' + (OB_INTENT_LEVEL_MAP[lvl] || '-') + '</span>';
    },

    /* ---------- 5.4 预测式外呼 / 执行日志 ---------- */
    renderPredictiveContent: function (taskId) {
        const stat = OutboundPhoneStorage.getStats(taskId);
        const rate = this._predictiveRate;
        const idleAgents = 4 + Math.floor(Math.random() * 6);
        const dialing = Math.round(idleAgents * rate);
        const queueing = Math.max(0, dialing - idleAgents - 2);
        const abandonRate = (Math.random() * 2.5 + 0.3).toFixed(2);

        let html = '<div class="cc-predictive-panel">';
        html += '<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:18px;">';
        html += '<div style="font-size:15px;color:#D4AF37;font-weight:600;">⚡ 预测式外呼算法可视化</div>';
        html += '<span class="cc-ob-tag">弃呼率目标 &lt; 3%</span>';
        html += '</div>';

        // 倍率滑块
        html += '<div class="cc-step-section">';
        html += '<div class="cc-step-title">🎚 当前拨号倍率：<span style="color:#fff;">' + rate.toFixed(1) + 'x</span></div>';
        html += '<input type="range" min="1.5" max="3.0" step="0.1" value="' + rate + '" class="cc-predictive-slider" data-act="rate-slider" />';
        html += '<div style="display:flex;justify-content:space-between;font-size:11px;color:#9CA3AF;margin-top:6px;">';
        html += '<span>1.5x（保守）</span><span>2.0x（推荐）</span><span>3.0x（激进）</span>';
        html += '</div></div>';

        // 实时指标
        html += '<div class="cc-step-section">';
        html += '<div class="cc-step-title">📡 实时指标</div>';
        html += '<div style="display:grid;grid-template-columns:repeat(4,1fr);gap:12px;">';
        html += this._metric(idleAgents, '空闲坐席数', '#00D084');
        html += this._metric(dialing, '正在拨打', '#D4AF37');
        html += this._metric(queueing, '接通排队', '#5B8DEF');
        html += this._metric(abandonRate + '%', '当前弃呼率', parseFloat(abandonRate) > 3 ? '#FF4D4F' : '#00D084');
        html += '</div></div>';

        // 算法说明
        html += '<div class="cc-step-section">';
        html += '<div class="cc-step-title">🧠 算法逻辑说明</div>';
        html += '<div style="color:#9CA3AF;font-size:12px;line-height:1.8;">';
        html += '<p>1. <strong style="color:#D4AF37;">预拨号策略</strong>：系统根据空闲坐席数 × 拨号倍率，预先批量拨出号码。例如 ' + idleAgents + ' 个空闲坐席 × ' + rate.toFixed(1) + 'x = ' + dialing + ' 通预拨。</p>';
        html += '<p>2. <strong style="color:#D4AF37;">实时调整</strong>：根据接通率与弃呼率反馈，每 30 秒动态调整倍率。当弃呼率 &gt; 3% 时自动降低倍率。</p>';
        html += '<p>3. <strong style="color:#D4AF37;">弃呼控制</strong>：被叫接通但无空闲坐席时，5 秒内未接入则播放抱歉提示，记入弃呼率。</p>';
        html += '<p>4. <strong style="color:#D4AF37;">归属地匹配</strong>：拨出时优先选择与被叫归属地一致的外显号码以提升接通率。</p>';
        html += '<p>5. <strong style="color:#D4AF37;">话务平滑</strong>：高峰段降速、低谷段提速，避免坐席空转或客户等待。</p>';
        html += '</div></div>';

        html += '</div>';
        return html;
    },

    renderExecutionLogs: function (taskId) {
        // 模拟最近日志
        const list = OutboundPhoneStorage.getByTaskId(taskId)
            .filter(function (p) { return p.last_dial_time; })
            .sort(function (a, b) { return (b.last_dial_time || '').localeCompare(a.last_dial_time || ''); })
            .slice(0, 30);

        let html = '<div class="cc-card">';
        html += '<div style="font-size:13px;color:#D4AF37;margin-bottom:12px;">📜 近期拨打日志（最近 30 条）</div>';
        if (list.length === 0) {
            html += '<div class="cc-empty"><div class="cc-empty-text">暂无日志</div></div>';
        } else {
            html += '<div style="font-family:monospace;font-size:12px;line-height:1.8;max-height:420px;overflow:auto;">';
            list.forEach(function (p) {
                const status = OB_PHONE_STATUS_MAP[p.status] || '-';
                let color = '#9CA3AF';
                if (p.status === 2) color = '#00D084';
                else if (p.status === 4 || p.status === 5 || p.status === 6) color = '#FF4D4F';
                html += '<div style="border-bottom:1px dashed rgba(212,175,55,0.08);padding:6px 0;">';
                html += '<span style="color:#6B7280;">[' + obFmtTime(p.last_dial_time) + ']</span> ';
                html += '<span style="color:#D4AF37;">' + obEsc(p.phone) + '</span> ';
                html += '<span style="color:#E5E7EB;">' + obEsc(p.customer_name || '-') + '</span> ';
                html += '→ <span style="color:' + color + ';">' + status + '</span>';
                if (p.duration_sec > 0) html += ' <span style="color:#9CA3AF;">通话 ' + obFmtDuration(p.duration_sec) + '</span>';
                html += '</div>';
            });
            html += '</div>';
        }
        html += '</div>';
        return html;
    }
};

/* ============================================================
   6. 事件委托
   ============================================================ */
CCOutbound.handleEvents = function (e) {
    const target = e.target;
    if (!target || !target.closest) return;
    const self = this;

    // input - 搜索
    if (e.type === 'input') {
        if (target.matches('[data-act="search"]')) {
            this.searchKeyword = target.value;
            this._refresh();
            const root = document.querySelector('.cc-outbound-module');
            if (root) {
                const sb = root.querySelector('[data-act="search"]');
                if (sb) { sb.focus(); sb.setSelectionRange(sb.value.length, sb.value.length); }
            }
        }
        return;
    }

    // change - 筛选 / 滑块
    if (e.type === 'change') {
        if (target.matches('[data-act="task-filter"]')) {
            this.taskFilter = target.value; this._refresh(); return;
        }
        if (target.matches('[data-act="phone-filter"]')) {
            this.phoneFilter = target.value; this._refresh(); return;
        }
    }

    // 滑块用 input 也可以，这里用 change
    if (target.matches('[data-act="rate-slider"]')) {
        this._predictiveRate = parseFloat(target.value) || 2.0;
        this._refresh();
        return;
    }

    if (e.type !== 'click') return;
    const actEl = target.closest('[data-act]');
    if (!actEl) return;
    const act = actEl.dataset.act;
    const id = actEl.dataset.id;

    switch (act) {
        case 'new-task': this.showTaskModal(); break;
        case 'edit-task': this.showTaskModal(id); break;
        case 'view-task':
            this.selectedTaskId = id;
            this.currentView = 'taskDetail';
            this.detailTab = 'phones';
            this.searchKeyword = '';
            this.phoneFilter = 'all';
            this._refresh();
            break;
        case 'back-to-list':
            this.currentView = 'tasks';
            this.selectedTaskId = null;
            this.searchKeyword = '';
            this._refresh();
            break;
        case 'detail-tab':
            this.detailTab = actEl.dataset.tab;
            this._refresh();
            break;
        case 'start-task': this._changeTaskStatus(id, 1, '任务已启动'); break;
        case 'pause-task': this._changeTaskStatus(id, 2, '任务已暂停'); break;
        case 'resume-task': this._changeTaskStatus(id, 1, '任务已恢复'); break;
        case 'terminate-task':
            if (confirm('终止后任务将无法恢复，是否继续？')) {
                this._changeTaskStatus(id, 4, '任务已终止');
            }
            break;
        case 'delete-task':
            if (confirm('确定删除该任务？相关号码记录会一并清除。')) {
                OutboundTaskStorage.delete(id);
                OutboundPhoneStorage.getByTaskId(id).forEach(function (p) { OutboundPhoneStorage.delete(p.phone_id); });
                ccShowToast('已删除', 'success');
                this._refresh();
            }
            break;
        case 'copy-task': this._copyTask(id); break;
        case 'import-phones': this.showImportModal(id); break;
        case 'dedupe-phones': this._dedupePhones(id); break;
        case 'mark-intent': this._markIntent(id); break;
        case 'view-feedback': this._viewFeedback(id); break;
        case 'remove-phone':
            if (confirm('确定移除该号码？')) {
                OutboundPhoneStorage.delete(id);
                ccShowToast('已移除', 'success');
                this._refresh();
            }
            break;
    }
};

CCOutbound._changeTaskStatus = function (id, status, msg) {
    OutboundTaskStorage.update(id, { status: status });
    ccShowToast(msg || '状态已更新', 'success');
    this._refresh();
};

CCOutbound._copyTask = function (id) {
    const t = OutboundTaskStorage.getById(id);
    if (!t) return;
    const copy = Object.assign({}, t, {
        task_id: ccGenerateId('obt_'),
        name: t.name + '（副本）',
        status: 0,
        create_time: new Date().toISOString(),
        deleted: false
    });
    OutboundTaskStorage.add(copy);
    ccShowToast('已复制为草稿', 'success');
    this._refresh();
};

CCOutbound._dedupePhones = function (taskId) {
    const list = OutboundPhoneStorage.getByTaskId(taskId);
    const seen = {};
    let removed = 0;
    list.forEach(function (p) {
        const key = (p.phone || '').replace(/[^0-9]/g, '');
        if (!key) return;
        if (seen[key]) {
            OutboundPhoneStorage.delete(p.phone_id);
            removed++;
        } else {
            seen[key] = true;
        }
    });
    ccShowToast(removed > 0 ? '清洗完成，去重 ' + removed + ' 条' : '没有发现重复号码', 'success');
    this._refresh();
};

CCOutbound._markIntent = function (phoneId) {
    const p = OutboundPhoneStorage.getById(phoneId);
    if (!p) return;
    const ans = prompt('意向等级：1=A高意向 / 2=B有意向 / 3=C一般 / 4=D无意向', String(p.intent_level || 3));
    if (ans === null) return;
    const lvl = parseInt(ans, 10);
    if ([1, 2, 3, 4].indexOf(lvl) < 0) {
        ccShowToast('请输入 1-4', 'error'); return;
    }
    OutboundPhoneStorage.update(phoneId, { intent_level: lvl });
    ccShowToast('已标记 ' + (OB_INTENT_LEVEL_MAP[lvl] || ''), 'success');
    this._refresh();
};

CCOutbound._viewFeedback = function (phoneId) {
    const p = OutboundPhoneStorage.getById(phoneId);
    if (!p) return;
    const lines = [
        '客户：' + (p.customer_name || '-'),
        '电话：' + p.phone,
        '归属地：' + (p.province || '-') + ' / ' + (p.city || '-'),
        '状态：' + (OB_PHONE_STATUS_MAP[p.status] || '-'),
        '拨打次数：' + (p.dial_count || 0),
        '通话时长：' + obFmtDuration(p.duration_sec),
        '意向等级：' + (OB_INTENT_LEVEL_MAP[p.intent_level] || '未标记'),
        '反馈备注：' + (p.feedback || '（无）')
    ];
    alert(lines.join('\n'));
};

/* ============================================================
   7. 模态框基础
   ============================================================ */
CCOutbound._openModal = function (title, bodyHtml, onSubmit, opts) {
    this._closeModal();
    opts = opts || {};
    const overlay = document.createElement('div');
    overlay.className = 'cc-modal-overlay';
    let html = '<div class="cc-modal" style="max-width:' + (opts.width || '760px') + ';">';
    html += '<div class="cc-modal-header">';
    html += '<div class="cc-modal-title">' + obEsc(title) + '</div>';
    html += '<button class="cc-modal-close" data-modal-act="close">×</button>';
    html += '</div>';
    html += '<div class="cc-modal-body">' + bodyHtml + '</div>';
    html += '<div class="cc-modal-footer">';
    html += '<button class="cc-btn cc-btn-outline" data-modal-act="close">取消</button>';
    html += '<button class="cc-btn cc-btn-primary" data-modal-act="submit">' + (opts.submitText || '确定') + '</button>';
    html += '</div></div>';
    overlay.innerHTML = html;
    document.body.appendChild(overlay);
    this._modalEl = overlay;

    const self = this;
    overlay.addEventListener('click', function (e) {
        if (e.target === overlay) { self._closeModal(); return; }
        const card = e.target.closest('.cc-dial-mode-card');
        if (card) {
            overlay.querySelectorAll('.cc-dial-mode-card').forEach(function (c) { c.classList.remove('selected'); });
            card.classList.add('selected');
            const hid = overlay.querySelector('[data-field="dial_mode"]');
            if (hid) hid.value = card.dataset.mode;
            return;
        }
        const btn = e.target.closest('[data-modal-act]');
        if (!btn) return;
        const act = btn.dataset.modalAct;
        if (act === 'close') self._closeModal();
        else if (act === 'submit') {
            const ok = onSubmit ? onSubmit(overlay) : true;
            if (ok !== false) self._closeModal();
        }
    });
    overlay.addEventListener('input', function (e) {
        if (e.target.matches('[data-act="import-preview"]')) {
            CCOutbound._updateImportPreview(overlay);
        }
    });
};

CCOutbound._closeModal = function () {
    if (this._modalEl) { this._modalEl.remove(); this._modalEl = null; }
};

CCOutbound._collect = function (overlay) {
    const obj = {};
    overlay.querySelectorAll('[data-field]').forEach(function (el) {
        const key = el.dataset.field;
        if (el.type === 'checkbox') obj[key] = el.checked;
        else obj[key] = el.value;
    });
    return obj;
};

CCOutbound._formField = function (label, html) {
    return '<div class="cc-form-group"><label class="cc-form-label">' + label + '</label>' + html + '</div>';
};

CCOutbound._select = function (field, map, value) {
    let html = '<select class="cc-form-select" data-field="' + field + '">';
    Object.keys(map).forEach(function (k) {
        const sel = String(k) === String(value) ? ' selected' : '';
        html += '<option value="' + k + '"' + sel + '>' + map[k] + '</option>';
    });
    html += '</select>';
    return html;
};

/* ============================================================
   8. 任务新建/编辑 模态框
   ============================================================ */
CCOutbound.showTaskModal = function (taskId) {
    const isEdit = !!taskId;
    const data = isEdit ? (OutboundTaskStorage.getById(taskId) || {}) : {};
    const phoneNumbers = (window.PhoneNumberStorage && window.PhoneNumberStorage.getAll)
        ? window.PhoneNumberStorage.getAll()
        : (function () { try { return JSON.parse(localStorage.getItem('cc_phone_numbers') || '[]').filter(function (n) { return !n.deleted; }); } catch (e) { return []; } })();
    const dialMode = data.dial_mode || 1;

    let body = '';
    // 区域1 - 基本信息
    body += '<div class="cc-step-section">';
    body += '<div class="cc-step-title">① 基本信息</div>';
    body += '<div class="cc-grid-2">';
    body += this._formField('任务名称 *', '<input type="text" class="cc-form-input" data-field="name" value="' + obEsc(data.name || '') + '" placeholder="如 2026春季营销外呼" />');
    body += this._formField('任务类型', this._select('task_type', OB_TASK_TYPE_MAP, data.task_type || 1));
    body += '</div>';
    body += '<div class="cc-form-group"><label class="cc-form-label">拨号方式</label>';
    body += '<input type="hidden" data-field="dial_mode" value="' + dialMode + '" />';
    body += '<div class="cc-dial-mode-cards">';
    Object.keys(OB_DIAL_MODE_MAP).forEach(function (k) {
        const sel = String(k) === String(dialMode) ? ' selected' : '';
        body += '<div class="cc-dial-mode-card' + sel + '" data-mode="' + k + '">';
        body += '<div style="font-size:14px;font-weight:600;color:#D4AF37;margin-bottom:6px;">' + OB_DIAL_MODE_MAP[k] + '</div>';
        body += '<div style="font-size:11px;color:#9CA3AF;line-height:1.5;">' + OB_DIAL_MODE_DESC[k] + '</div>';
        body += '</div>';
    });
    body += '</div></div>';
    body += '</div>';

    // 区域2 - 时间计划
    body += '<div class="cc-step-section">';
    body += '<div class="cc-step-title">② 时间计划</div>';
    body += '<div class="cc-grid-2">';
    body += this._formField('开始日期', '<input type="date" class="cc-form-input" data-field="start_date" value="' + obEsc(data.start_date || '') + '" />');
    body += this._formField('结束日期', '<input type="date" class="cc-form-input" data-field="end_date" value="' + obEsc(data.end_date || '') + '" />');
    body += this._formField('每日开始时间', '<input type="time" class="cc-form-input" data-field="dial_time_start" value="' + obEsc(data.dial_time_start || '09:00') + '" />');
    body += this._formField('每日结束时间', '<input type="time" class="cc-form-input" data-field="dial_time_end" value="' + obEsc(data.dial_time_end || '20:00') + '" />');
    body += '</div>';
    body += '</div>';

    // 区域3 - 拨号设置
    body += '<div class="cc-step-section">';
    body += '<div class="cc-step-title">③ 拨号设置</div>';
    body += '<div class="cc-grid-2">';
    body += this._formField('并发限制', '<input type="number" class="cc-form-input" data-field="concurrent_limit" value="' + (data.concurrent_limit || 10) + '" min="1" max="500" />');
    body += this._formField('最大重试次数', '<input type="number" class="cc-form-input" data-field="max_retry" value="' + (data.max_retry != null ? data.max_retry : 3) + '" min="0" max="10" />');

    // 外显号码下拉
    let numOpts = '<option value="">-- 自动选择 --</option>';
    phoneNumbers.forEach(function (n) {
        const lab = (n.number || '') + (n.province ? ' (' + n.province + ')' : '');
        numOpts += '<option value="' + n.phone_id + '"' + (data.display_number_id === n.phone_id ? ' selected' : '') + '>' + obEsc(lab) + '</option>';
    });
    body += this._formField('外显号码', '<select class="cc-form-select" data-field="display_number_id">' + numOpts + '</select>');
    body += this._formField('指定技能组', '<input type="text" class="cc-form-input" data-field="assigned_skillgroup_id" value="' + obEsc(data.assigned_skillgroup_id || '') + '" placeholder="技能组ID（可选）" />');
    body += '</div>';
    body += '</div>';

    // 区域4 - 话术脚本
    body += '<div class="cc-step-section">';
    body += '<div class="cc-step-title">④ 话术脚本</div>';
    body += '<textarea class="cc-form-textarea" data-field="script" rows="6" placeholder="您好，我是XX公司的客户经理...">' + obEsc(data.script || '') + '</textarea>';
    body += '</div>';

    const self = this;
    this._openModal(isEdit ? '编辑外呼任务' : '新建外呼任务', body, function (overlay) {
        const v = self._collect(overlay);
        if (!v.name || !v.name.trim()) { ccShowToast('请输入任务名称', 'error'); return false; }
        const payload = {
            name: v.name.trim(),
            task_type: parseInt(v.task_type, 10) || 1,
            dial_mode: parseInt(v.dial_mode, 10) || 1,
            start_date: v.start_date || '',
            end_date: v.end_date || '',
            dial_time_start: v.dial_time_start || '09:00',
            dial_time_end: v.dial_time_end || '20:00',
            concurrent_limit: parseInt(v.concurrent_limit, 10) || 10,
            max_retry: parseInt(v.max_retry, 10) || 3,
            display_number_id: v.display_number_id || '',
            assigned_skillgroup_id: v.assigned_skillgroup_id || '',
            script: v.script || ''
        };
        if (isEdit) {
            OutboundTaskStorage.update(taskId, payload);
            ccShowToast('已更新', 'success');
        } else {
            payload.task_id = ccGenerateId('obt_');
            payload.status = 0;
            payload.create_time = new Date().toISOString();
            payload.deleted = false;
            OutboundTaskStorage.add(payload);
            ccShowToast('已创建', 'success');
        }
        self._refresh();
        return true;
    }, { width: '820px' });
};

/* ============================================================
   9. 号码导入 模态框
   ============================================================ */
CCOutbound.showImportModal = function (taskId) {
    let body = '';
    body += '<div class="cc-step-section">';
    body += '<div class="cc-step-title">📋 文本导入</div>';
    body += '<div style="color:#9CA3AF;font-size:12px;margin-bottom:8px;line-height:1.7;">';
    body += '请按格式输入，每行一条：<code style="color:#D4AF37;">姓名,电话,省份,城市</code><br/>';
    body += '示例：<code style="color:#D4AF37;">张先生,13800138001,浙江,杭州</code><br/>';
    body += '已存在的号码会自动跳过。';
    body += '</div>';
    body += '<textarea class="cc-form-textarea" data-field="raw" data-act="import-preview" rows="10" placeholder="张先生,13800138001,浙江,杭州&#10;李女士,13900139002,广东,深圳"></textarea>';
    body += '</div>';
    body += '<div class="cc-step-section">';
    body += '<div class="cc-step-title">👀 解析预览</div>';
    body += '<div data-preview style="font-size:12px;color:#9CA3AF;">尚未输入数据</div>';
    body += '</div>';

    const self = this;
    this._openModal('导入号码', body, function (overlay) {
        const v = self._collect(overlay);
        const parsed = self._parseImport(v.raw || '');
        if (parsed.valid.length === 0) { ccShowToast('请输入有效的号码数据', 'error'); return false; }

        // 去重
        const existing = {};
        OutboundPhoneStorage.getByTaskId(taskId).forEach(function (p) {
            existing[(p.phone || '').replace(/[^0-9]/g, '')] = true;
        });

        const items = [];
        let skipped = 0;
        parsed.valid.forEach(function (row) {
            const key = row.phone.replace(/[^0-9]/g, '');
            if (!key || existing[key]) { skipped++; return; }
            existing[key] = true;
            items.push({
                phone_id: ccGenerateId('obp_'),
                task_id: taskId,
                customer_name: row.name,
                phone: row.phone,
                province: row.province || '',
                city: row.city || '',
                status: 0,
                dial_count: 0,
                last_dial_time: null,
                duration_sec: 0,
                intent_level: 0,
                feedback: '',
                create_time: new Date().toISOString(),
                deleted: false
            });
        });
        if (items.length > 0) OutboundPhoneStorage.addBatch(items);
        ccShowToast('导入完成：新增 ' + items.length + ' 条' + (skipped ? '，跳过 ' + skipped + ' 条' : ''), 'success');
        self._refresh();
        return true;
    }, { submitText: '开始导入', width: '720px' });
};

CCOutbound._parseImport = function (raw) {
    const lines = (raw || '').split(/\r?\n/).map(function (s) { return s.trim(); }).filter(Boolean);
    const valid = [], invalid = [];
    lines.forEach(function (line) {
        const parts = line.split(/[,\t，]/).map(function (s) { return s.trim(); });
        let name = '', phone = '', province = '', city = '';
        if (parts.length === 1) { phone = parts[0]; }
        else if (parts.length === 2) { name = parts[0]; phone = parts[1]; }
        else { name = parts[0]; phone = parts[1]; province = parts[2] || ''; city = parts[3] || ''; }
        if (/^[0-9\-+()\s]{6,20}$/.test(phone)) {
            valid.push({ name: name, phone: phone, province: province, city: city });
        } else {
            invalid.push(line);
        }
    });
    return { valid: valid, invalid: invalid };
};

CCOutbound._updateImportPreview = function (overlay) {
    const ta = overlay.querySelector('[data-field="raw"]');
    const box = overlay.querySelector('[data-preview]');
    if (!ta || !box) return;
    const parsed = this._parseImport(ta.value);
    let html = '';
    html += '<div style="margin-bottom:8px;">';
    html += '<span style="color:#00D084;">✓ 有效 ' + parsed.valid.length + ' 条</span>';
    if (parsed.invalid.length > 0) {
        html += ' &nbsp; <span style="color:#FF4D4F;">✗ 无效 ' + parsed.invalid.length + ' 条</span>';
    }
    html += '</div>';
    if (parsed.valid.length > 0) {
        html += '<div style="max-height:140px;overflow:auto;background:#0A0A0F;border:1px solid rgba(212,175,55,0.1);border-radius:4px;padding:8px;font-family:monospace;font-size:11px;line-height:1.7;">';
        parsed.valid.slice(0, 10).forEach(function (r) {
            html += '<div>' + obEsc(r.name || '(无名)') + ' &nbsp; <span style="color:#D4AF37;">' + obEsc(r.phone) + '</span> &nbsp; <span style="color:#9CA3AF;">' + obEsc(r.province) + ' ' + obEsc(r.city) + '</span></div>';
        });
        if (parsed.valid.length > 10) html += '<div style="color:#6B7280;">...另 ' + (parsed.valid.length - 10) + ' 条</div>';
        html += '</div>';
    }
    box.innerHTML = html;
};

/* ============================================================
   10. 预测式外呼面板（弹窗形式）
   ============================================================ */
CCOutbound.showPredictivePanel = function (taskId) {
    this.selectedTaskId = taskId;
    this.currentView = 'taskDetail';
    this.detailTab = 'predictive';
    this._refresh();
};

/* ============================================================
   11. 种子数据
   ============================================================ */
CCOutbound.initSeedData = function () {
    const tasksRaw = OutboundTaskStorage.getRaw();
    if (tasksRaw.length > 0) return;

    const now = new Date();
    const today = now.toISOString().slice(0, 10);
    const future = new Date(now.getTime() + 30 * 86400000).toISOString().slice(0, 10);
    const past = new Date(now.getTime() - 7 * 86400000).toISOString().slice(0, 10);

    const seeds = [
        { name: '2026春季理财产品营销', task_type: 1, dial_mode: 2, status: 1, count: 35, distribution: [0.2, 0.05, 0.4, 0.2, 0.05, 0.02, 0.05, 0.03] },
        { name: 'VIP客户季度回访', task_type: 2, dial_mode: 1, status: 1, count: 28, distribution: [0.3, 0.05, 0.45, 0.1, 0.0, 0.0, 0.05, 0.05] },
        { name: '系统维护通知群发', task_type: 3, dial_mode: 3, status: 3, count: 40, distribution: [0.0, 0.0, 0.7, 0.15, 0.05, 0.05, 0.03, 0.02] },
        { name: '逾期账款催收', task_type: 4, dial_mode: 1, status: 2, count: 32, distribution: [0.25, 0.0, 0.3, 0.15, 0.05, 0.05, 0.15, 0.05] },
        { name: '客户满意度调研', task_type: 5, dial_mode: 2, status: 0, count: 20, distribution: [1.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0] }
    ];

    const provinces = [['浙江', '杭州'], ['浙江', '宁波'], ['江苏', '南京'], ['江苏', '苏州'], ['上海', '上海'], ['广东', '深圳'], ['广东', '广州'], ['北京', '北京'], ['四川', '成都'], ['湖北', '武汉']];
    const surnames = ['张', '王', '李', '赵', '刘', '陈', '杨', '黄', '周', '吴', '徐', '孙', '马', '朱', '胡'];
    const titles = ['先生', '女士', '总', '经理'];

    seeds.forEach(function (seed, idx) {
        const taskId = ccGenerateId('obt_');
        const task = {
            task_id: taskId,
            name: seed.name,
            task_type: seed.task_type,
            dial_mode: seed.dial_mode,
            status: seed.status,
            start_date: seed.status === 3 ? past : today,
            end_date: future,
            dial_time_start: '09:00',
            dial_time_end: '20:00',
            concurrent_limit: 10 + idx * 5,
            max_retry: 3,
            display_number_id: '',
            assigned_skillgroup_id: '',
            script: '您好，这里是XX公司客服中心...',
            create_time: new Date(now.getTime() - (idx + 1) * 86400000).toISOString(),
            deleted: false
        };
        OutboundTaskStorage.add(task);

        const phones = [];
        for (let i = 0; i < seed.count; i++) {
            const dist = seed.distribution;
            const r = Math.random();
            let acc = 0, status = 0;
            for (let s = 0; s < dist.length; s++) {
                acc += dist[s];
                if (r <= acc) { status = s; break; }
            }
            const loc = provinces[i % provinces.length];
            const name = surnames[i % surnames.length] + titles[i % titles.length];
            const dialed = status !== 0;
            const connected = status === 2;
            phones.push({
                phone_id: ccGenerateId('obp_'),
                task_id: taskId,
                customer_name: name,
                phone: '13' + (i % 10) + String(80000000 + idx * 1000 + i).slice(-8),
                province: loc[0],
                city: loc[1],
                status: status,
                dial_count: dialed ? (status === 3 ? 2 : 1) : 0,
                last_dial_time: dialed ? new Date(now.getTime() - i * 600000).toISOString() : null,
                duration_sec: connected ? 30 + Math.floor(Math.random() * 240) : 0,
                intent_level: connected ? (1 + Math.floor(Math.random() * 4)) : 0,
                feedback: connected ? '客户表示有兴趣，需要进一步跟进' : '',
                create_time: task.create_time,
                deleted: false
            });
        }
        OutboundPhoneStorage.addBatch(phones);
    });
};

/* ============================================================
   12. 全局暴露
   ============================================================ */
window.CCOutbound = CCOutbound;
window.OutboundTaskStorage = OutboundTaskStorage;
window.OutboundPhoneStorage = OutboundPhoneStorage;
