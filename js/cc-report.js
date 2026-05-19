/**
 * 呼叫中心 · 话务报表分析 - cc-report.js
 * 包含：话务统计、坐席绩效、客户分析、质检报表
 * 数据：实时计算自 CallRecordStorage / AgentStorage / QualityRecordStorage
 * UI 风格：黑金奢华主题，纯 CSS 图表（柱状 / 折线 / 热力 / 进度 / 饼图 / 堆叠条）
 * 依赖：cc-core.js、cc-call.js
 */

/* ========================================================================
   0. 注入专属样式
   ======================================================================== */
(function () {
    if (document.getElementById('cc-report-styles')) return;
    const style = document.createElement('style');
    style.id = 'cc-report-styles';
    style.textContent = `
        .cc-report-tabs { display: flex; gap: 0; margin-bottom: 20px; }
        .cc-report-tab { padding: 10px 20px; background: transparent; border: 1px solid rgba(212,175,55,0.15); color: #A0A0B0; cursor: pointer; font-size: 13px; transition: all 0.2s; letter-spacing: .5px; }
        .cc-report-tab:first-child { border-radius: 6px 0 0 6px; }
        .cc-report-tab:last-child { border-radius: 0 6px 6px 0; }
        .cc-report-tab + .cc-report-tab { border-left: none; }
        .cc-report-tab:hover { color: #D4AF37; }
        .cc-report-tab.active { background: rgba(212,175,55,0.15); color: #D4AF37; border-color: #D4AF37; }
        .cc-date-range { display: flex; gap: 8px; margin-bottom: 20px; }
        .cc-date-btn { padding: 6px 14px; border-radius: 6px; border: 1px solid rgba(212,175,55,0.15); background: transparent; color: #A0A0B0; cursor: pointer; font-size: 12px; }
        .cc-date-btn:hover { color: #D4AF37; border-color: rgba(212,175,55,0.4); }
        .cc-date-btn.active { background: rgba(212,175,55,0.2); color: #D4AF37; border-color: #D4AF37; }
        .cc-chart-container { padding: 20px; background: #12121A; border: 1px solid rgba(212,175,55,0.1); border-radius: 10px; margin-bottom: 20px; }
        .cc-chart-title { font-size: 14px; color: #D4AF37; margin-bottom: 16px; font-weight: 600; letter-spacing: .5px; display: flex; align-items: center; justify-content: space-between; }
        .cc-chart-legend { display: flex; gap: 14px; font-size: 11px; color: #A0A0B0; font-weight: 400; }
        .cc-chart-legend .cc-lg-dot { display: inline-block; width: 10px; height: 10px; border-radius: 2px; vertical-align: middle; margin-right: 4px; }
        .cc-bar-chart { display: flex; align-items: flex-end; gap: 3px; height: 180px; padding: 0 10px; border-bottom: 1px solid rgba(212,175,55,0.1); }
        .cc-bar-col { flex: 1; min-width: 8px; display: flex; flex-direction: column; justify-content: flex-end; gap: 2px; height: 100%; position: relative; }
        .cc-bar { width: 100%; border-radius: 3px 3px 0 0; transition: height 0.5s ease-out; position: relative; cursor: pointer; }
        .cc-bar-in { background: linear-gradient(to top, #B8860B, #D4AF37); }
        .cc-bar-out { background: linear-gradient(to top, #1E40AF, #5B8DEF); }
        .cc-bar-single { background: linear-gradient(to top, #B8860B, #D4AF37); }
        .cc-bar-col:hover .cc-bar-tooltip { display: block; }
        .cc-bar-tooltip { display: none; position: absolute; bottom: 100%; left: 50%; transform: translateX(-50%); font-size: 10px; color: #fff; background: rgba(0,0,0,.85); padding: 4px 8px; border-radius: 4px; white-space: nowrap; z-index: 10; margin-bottom: 4px; border: 1px solid rgba(212,175,55,0.3); }
        .cc-bar-axis { display: flex; gap: 3px; padding: 6px 10px 0; font-size: 10px; color: #666; }
        .cc-bar-axis div { flex: 1; min-width: 8px; text-align: center; }
        .cc-heatmap { display: grid; grid-template-columns: 50px repeat(24, 1fr); gap: 2px; }
        .cc-heatmap-cell { aspect-ratio: 1; border-radius: 3px; cursor: pointer; position: relative; min-height: 18px; transition: transform .15s; }
        .cc-heatmap-cell:hover { transform: scale(1.25); z-index: 5; box-shadow: 0 0 0 1px #D4AF37; }
        .cc-heatmap-cell:hover::after { content: attr(data-tip); position: absolute; bottom: 110%; left: 50%; transform: translateX(-50%); font-size: 10px; color: #fff; background: rgba(0,0,0,.85); padding: 3px 8px; border-radius: 4px; white-space: nowrap; z-index: 10; border: 1px solid rgba(212,175,55,0.4); }
        .cc-heatmap-label { font-size: 11px; color: #A0A0B0; display: flex; align-items: center; padding-right: 6px; }
        .cc-heatmap-axis { font-size: 9px; color: #666; display: flex; align-items: center; justify-content: center; }
        .cc-rank-1 { color: #FFD700; font-weight: 700; }
        .cc-rank-2 { color: #C0C0C0; font-weight: 700; }
        .cc-rank-3 { color: #CD7F32; font-weight: 700; }
        .cc-rank-medal { display: inline-block; width: 20px; text-align: center; }
        .cc-stacked-bar { display: flex; height: 28px; border-radius: 4px; overflow: hidden; margin-bottom: 8px; background: #1A1A24; }
        .cc-stacked-segment { height: 100%; transition: width 0.5s; position: relative; cursor: pointer; display: flex; align-items: center; justify-content: center; font-size: 10px; color: #fff; overflow: hidden; }
        .cc-stacked-segment:hover::after { content: attr(data-label); position: absolute; bottom: 110%; left: 50%; transform: translateX(-50%); font-size: 10px; color: #fff; background: rgba(0,0,0,.85); padding: 3px 8px; border-radius: 4px; white-space: nowrap; z-index: 10; border: 1px solid rgba(212,175,55,0.4); }
        .cc-kpi-progress { height: 10px; background: #1A1A24; border-radius: 5px; overflow: hidden; margin-top: 8px; position: relative; }
        .cc-kpi-fill { height: 100%; border-radius: 5px; transition: width 0.5s; background: linear-gradient(90deg, #B8860B, #D4AF37); }
        .cc-kpi-fill.cc-fill-good { background: linear-gradient(90deg, #2E7D32, #66BB6A); }
        .cc-kpi-fill.cc-fill-warn { background: linear-gradient(90deg, #B8860B, #D4AF37); }
        .cc-kpi-fill.cc-fill-bad { background: linear-gradient(90deg, #B71C1C, #FF6B6E); }
        .cc-kpi-target { position: absolute; top: -2px; bottom: -2px; width: 2px; background: #fff; opacity: .55; }
        .cc-rpt-grid-8 { display: grid; grid-template-columns: repeat(4, 1fr); gap: 14px; margin-bottom: 20px; }
        @media (max-width: 1100px) { .cc-rpt-grid-8 { grid-template-columns: repeat(2, 1fr); } }
        .cc-rpt-kpi { background: linear-gradient(135deg, #16161e, #1d1d28); border: 1px solid rgba(212,175,55,.12); border-radius: 10px; padding: 16px 18px; position: relative; overflow: hidden; }
        .cc-rpt-kpi::before { content: ''; position: absolute; left: 0; top: 0; bottom: 0; width: 3px; background: linear-gradient(180deg, #D4AF37, #B8860B); }
        .cc-rpt-kpi-label { font-size: 11px; color: #888; letter-spacing: .5px; }
        .cc-rpt-kpi-value { font-size: 26px; font-weight: 700; color: #D4AF37; margin-top: 6px; letter-spacing: 1px; font-family: 'Bebas Neue', monospace; }
        .cc-rpt-kpi-unit { font-size: 13px; color: #888; margin-left: 4px; font-weight: 400; }
        .cc-rpt-kpi-sub { font-size: 11px; color: #66BB6A; margin-top: 4px; }
        .cc-rpt-kpi-sub.cc-down { color: #FF6B6E; }
        .cc-rpt-grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 20px; }
        .cc-rpt-grid-3 { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 16px; margin-bottom: 20px; }
        @media (max-width: 1100px) { .cc-rpt-grid-2, .cc-rpt-grid-3 { grid-template-columns: 1fr; } }
        .cc-svc-list { display: flex; flex-direction: column; gap: 16px; }
        .cc-svc-item { padding: 12px 14px; background: #1A1A24; border-radius: 8px; border: 1px solid rgba(212,175,55,.1); }
        .cc-svc-row { display: flex; justify-content: space-between; align-items: baseline; }
        .cc-svc-label { font-size: 13px; color: #fff; letter-spacing: .5px; }
        .cc-svc-target { font-size: 11px; color: #888; }
        .cc-svc-value { font-size: 22px; font-weight: 700; color: #D4AF37; font-family: monospace; }
        .cc-rpt-table { width: 100%; border-collapse: separate; border-spacing: 0; font-size: 13px; }
        .cc-rpt-table th { background: rgba(212,175,55,0.08); color: #D4AF37; font-weight: 600; padding: 10px 12px; text-align: left; font-size: 12px; letter-spacing: .5px; cursor: pointer; user-select: none; border-bottom: 1px solid rgba(212,175,55,0.2); }
        .cc-rpt-table th.cc-sortable:hover { background: rgba(212,175,55,0.15); }
        .cc-rpt-table th .cc-sort-icon { font-size: 9px; margin-left: 4px; opacity: .5; }
        .cc-rpt-table th.cc-sorted .cc-sort-icon { opacity: 1; color: #D4AF37; }
        .cc-rpt-table td { padding: 10px 12px; color: #ccc; border-bottom: 1px solid rgba(255,255,255,0.04); }
        .cc-rpt-table tr:hover td { background: rgba(212,175,55,0.04); }
        .cc-rpt-table tr.cc-row-active td { background: rgba(212,175,55,0.1); }
        .cc-rpt-table .cc-tnum { font-family: monospace; color: #D4AF37; }
        .cc-rpt-table .cc-tdim { color: #666; font-size: 11px; }
        .cc-line-chart { position: relative; height: 180px; padding: 10px 10px 0; border-bottom: 1px solid rgba(212,175,55,0.1); }
        .cc-line-svg { width: 100%; height: 100%; overflow: visible; }
        .cc-line-path { fill: none; stroke: #D4AF37; stroke-width: 2; }
        .cc-line-area { fill: url(#cc-line-grad); opacity: .35; }
        .cc-line-dot { fill: #D4AF37; stroke: #0A0A0F; stroke-width: 2; cursor: pointer; }
        .cc-line-dot:hover { r: 6; }
        .cc-pie-wrap { display: flex; gap: 24px; align-items: center; flex-wrap: wrap; }
        .cc-pie { width: 180px; height: 180px; border-radius: 50%; flex-shrink: 0; box-shadow: inset 0 0 0 1px rgba(212,175,55,0.2); position: relative; }
        .cc-pie-center { position: absolute; top: 50%; left: 50%; transform: translate(-50%,-50%); width: 70px; height: 70px; background: #12121A; border-radius: 50%; display: flex; align-items: center; justify-content: center; flex-direction: column; }
        .cc-pie-center-num { font-size: 20px; font-weight: 700; color: #D4AF37; font-family: monospace; }
        .cc-pie-center-lbl { font-size: 10px; color: #888; }
        .cc-pie-legend { flex: 1; min-width: 200px; display: flex; flex-direction: column; gap: 8px; }
        .cc-pie-legend-item { display: flex; align-items: center; gap: 8px; font-size: 12px; color: #ccc; }
        .cc-pie-legend-color { width: 12px; height: 12px; border-radius: 2px; }
        .cc-pie-legend-pct { margin-left: auto; color: #D4AF37; font-family: monospace; font-weight: 600; }
        .cc-rpt-empty { padding: 40px 20px; text-align: center; color: #666; font-size: 13px; }
        .cc-rpt-empty-icon { font-size: 48px; color: #2a2a36; margin-bottom: 8px; }
        .cc-dim-bar { display: flex; flex-direction: column; gap: 12px; }
        .cc-dim-row { display: flex; align-items: center; gap: 12px; }
        .cc-dim-label { width: 96px; font-size: 12px; color: #A0A0B0; }
        .cc-dim-track { flex: 1; height: 14px; background: #1A1A24; border-radius: 7px; overflow: hidden; position: relative; }
        .cc-dim-fill { height: 100%; background: linear-gradient(90deg, #B8860B, #D4AF37); border-radius: 7px; transition: width .5s; }
        .cc-dim-value { width: 70px; text-align: right; font-family: monospace; color: #D4AF37; font-size: 12px; }
        .cc-rpt-tip { font-size: 11px; color: #666; margin-top: 8px; line-height: 1.6; }
    `;
    document.head.appendChild(style);
})();

/* ========================================================================
   1. 数据访问层（带 fallback）
   ======================================================================== */
function ccrGetRecords() {
    if (window.CallRecordStorage && typeof window.CallRecordStorage.getAll === 'function') {
        return window.CallRecordStorage.getAll();
    }
    try {
        const raw = localStorage.getItem('cc_call_records');
        const list = raw ? JSON.parse(raw) : [];
        return list.filter(r => !r.deleted);
    } catch (e) { return []; }
}

function ccrGetAgents() {
    if (window.AgentStorage && typeof window.AgentStorage.getAll === 'function') {
        return window.AgentStorage.getAll();
    }
    try {
        const raw = localStorage.getItem('cc_agents');
        const list = raw ? JSON.parse(raw) : [];
        return list.filter(a => !a.deleted);
    } catch (e) { return []; }
}

function ccrGetQuality() {
    if (window.QualityRecordStorage && typeof window.QualityRecordStorage.getAll === 'function') {
        return window.QualityRecordStorage.getAll();
    }
    try {
        const raw = localStorage.getItem('cc_quality_records');
        const list = raw ? JSON.parse(raw) : [];
        return list.filter(q => !q.deleted);
    } catch (e) { return []; }
}

/* ========================================================================
   2. 工具函数
   ======================================================================== */
function ccrEsc(s) {
    if (s == null) return '';
    return String(s).replace(/[<>&"']/g, function (c) {
        return { '<': '&lt;', '>': '&gt;', '&': '&amp;', '"': '&quot;', "'": '&#39;' }[c];
    });
}

function ccrDur(sec) {
    if (!sec || sec <= 0) return '0:00';
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    return m + ':' + (s < 10 ? '0' : '') + s;
}

function ccrPad2(n) { return n < 10 ? '0' + n : '' + n; }

function ccrDateStr(ts) {
    if (!ts) return '-';
    const d = new Date(ts);
    return d.getFullYear() + '-' + ccrPad2(d.getMonth() + 1) + '-' + ccrPad2(d.getDate());
}

function ccrDateTimeStr(ts) {
    if (!ts) return '-';
    const d = new Date(ts);
    return ccrDateStr(ts) + ' ' + ccrPad2(d.getHours()) + ':' + ccrPad2(d.getMinutes());
}

function ccrRangeStart(range) {
    const now = new Date();
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    if (range === 'today') return startOfDay;
    if (range === 'week') return startOfDay - 6 * 86400000;
    if (range === 'month') return startOfDay - 29 * 86400000;
    if (range === 'quarter') return startOfDay - 89 * 86400000;
    return 0;
}

function ccrRangeBuckets(range) {
    if (range === 'today') return { count: 24, unit: 'hour' };
    if (range === 'week') return { count: 7, unit: 'day' };
    if (range === 'month') return { count: 30, unit: 'day' };
    return { count: 90, unit: 'day' };
}

function ccrEmpty(text) {
    return '<div class="cc-rpt-empty"><div class="cc-rpt-empty-icon">∅</div><div>' + (text || '暂无数据') + '</div></div>';
}

/* ========================================================================
   3. CCReport 主对象
   ======================================================================== */
const CCReport = {
    container: null,
    currentView: 'traffic',     // traffic | agent | customer | quality
    dateRange: 'week',          // today | week | month | quarter
    selectedAgentId: null,
    sortField: 'callCount',
    sortDir: 'desc',
    _delegateClick: null,

    /* ---------- 生命周期 ---------- */
    render(container) {
        this.container = container || this.container || document.querySelector('.content-area') || document.body;
        const html =
            '<div class="cc-report-tabs">' +
                this._tab('traffic', '📊 话务统计') +
                this._tab('agent', '👤 坐席绩效') +
                this._tab('customer', '📞 客户分析') +
                this._tab('quality', '🎯 质检报表') +
            '</div>' +
            '<div id="cc-report-body">' + this._renderBody() + '</div>';
        this.container.innerHTML = html;
        this._bindEvents();
    },

    init(container) { this.render(container); },

    destroy() {
        if (this._delegateClick && this.container) {
            this.container.removeEventListener('click', this._delegateClick);
        }
        this._delegateClick = null;
    },

    _tab(key, label) {
        return '<button class="cc-report-tab' + (this.currentView === key ? ' active' : '') +
               '" data-cc-action="switch-view" data-view="' + key + '">' + label + '</button>';
    },

    _renderBody() {
        if (this.currentView === 'traffic')  return this.renderTrafficReport();
        if (this.currentView === 'agent')    return this.renderAgentReport();
        if (this.currentView === 'customer') return this.renderCustomerReport();
        if (this.currentView === 'quality')  return this.renderQualityReport();
        return '';
    },

    _bindEvents() {
        if (this._delegateClick && this.container) {
            this.container.removeEventListener('click', this._delegateClick);
        }
        const self = this;
        this._delegateClick = function (e) { self.handleEvents(e); };
        this.container.addEventListener('click', this._delegateClick);
    },

    /* ---------- 事件分发 ---------- */
    handleEvents(e) {
        const t = e.target.closest('[data-cc-action]');
        if (!t) return;
        const act = t.dataset.ccAction;
        if (act === 'switch-view') {
            this.currentView = t.dataset.view;
            this.selectedAgentId = null;
            this.render(this.container);
        } else if (act === 'set-range') {
            this.dateRange = t.dataset.range;
            this.render(this.container);
        } else if (act === 'select-agent') {
            const id = t.dataset.agentId;
            this.selectedAgentId = (this.selectedAgentId === id) ? null : id;
            this.render(this.container);
        } else if (act === 'sort-rank') {
            const f = t.dataset.field;
            if (this.sortField === f) {
                this.sortDir = this.sortDir === 'desc' ? 'asc' : 'desc';
            } else {
                this.sortField = f;
                this.sortDir = 'desc';
            }
            this.render(this.container);
        }
    },

    /* ---------- 公共：日期范围条 ---------- */
    _rangeBar() {
        const opts = [['today', '今天'], ['week', '本周'], ['month', '本月'], ['quarter', '本季度']];
        let h = '<div class="cc-date-range">';
        opts.forEach(o => {
            h += '<button class="cc-date-btn' + (this.dateRange === o[0] ? ' active' : '') +
                 '" data-cc-action="set-range" data-range="' + o[0] + '">' + o[1] + '</button>';
        });
        h += '</div>';
        return h;
    },

    /* ====================================================================
       4. 话务统计报表
       ==================================================================== */
    renderTrafficReport() {
        const all = ccrGetRecords();
        const records = all.filter(r => (r.start_time || 0) >= ccrRangeStart(this.dateRange));
        const stats = this.calculateTrafficStats(records, this.dateRange);

        let h = this._rangeBar();

        if (records.length === 0) {
            return h + ccrEmpty('当前时间范围内暂无通话数据');
        }

        // —— 8 个核心指标卡片 ——
        h += '<div class="cc-rpt-grid-8">';
        h += this._kpi('呼入总量',  stats.inboundTotal,           '通');
        h += this._kpi('呼入接通',  stats.inboundAnswered,        '通');
        h += this._kpi('呼入接通率', stats.inboundRate + '%',     '',  stats.inboundRate >= 80 ? 'cc-up' : 'cc-down');
        h += this._kpi('呼损率',    stats.lossRate + '%',         '',  stats.lossRate <= 20 ? 'cc-up' : 'cc-down');
        h += this._kpi('呼出总量',  stats.outboundTotal,          '通');
        h += this._kpi('呼出接通',  stats.outboundAnswered,       '通');
        h += this._kpi('呼出接通率', stats.outboundRate + '%',    '',  stats.outboundRate >= 60 ? 'cc-up' : 'cc-down');
        h += this._kpi('平均通话',  ccrDur(stats.avgDuration),    '');
        h += '</div>';

        // —— 趋势柱状图 ——
        h += '<div class="cc-chart-container">' +
                '<div class="cc-chart-title">话务趋势' +
                    '<div class="cc-chart-legend">' +
                        '<span><span class="cc-lg-dot" style="background:linear-gradient(135deg,#B8860B,#D4AF37);"></span>呼入</span>' +
                        '<span><span class="cc-lg-dot" style="background:linear-gradient(135deg,#1E40AF,#5B8DEF);"></span>呼出</span>' +
                    '</div>' +
                '</div>' +
                this._renderTrendBars(records) +
             '</div>';

        // —— 7×24 高峰热力图 ——
        const heat = this.calculateHeatmapData(all);
        h += '<div class="cc-chart-container">' +
                '<div class="cc-chart-title">高峰时段热力图（7天 × 24小时）<span class="cc-chart-legend"><span style="color:#666;">基于全部历史数据 · 颜色越深话务越密</span></span></div>' +
                this._renderHeatmap(heat) +
             '</div>';

        // —— 服务水平指标 ——
        h += '<div class="cc-chart-container">' +
                '<div class="cc-chart-title">服务水平指标</div>' +
                this._renderServiceLevel(stats) +
             '</div>';

        return h;
    },

    _kpi(label, value, unit, trendClass) {
        let h = '<div class="cc-rpt-kpi">';
        h += '<div class="cc-rpt-kpi-label">' + ccrEsc(label) + '</div>';
        h += '<div class="cc-rpt-kpi-value">' + ccrEsc(value);
        if (unit) h += '<span class="cc-rpt-kpi-unit">' + ccrEsc(unit) + '</span>';
        h += '</div>';
        if (trendClass === 'cc-up') h += '<div class="cc-rpt-kpi-sub">▲ 达标</div>';
        else if (trendClass === 'cc-down') h += '<div class="cc-rpt-kpi-sub cc-down">▼ 待优化</div>';
        h += '</div>';
        return h;
    },

    _renderTrendBars(records) {
        const range = this.dateRange;
        const buckets = ccrRangeBuckets(range);
        const now = new Date();
        const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
        const inArr = new Array(buckets.count).fill(0);
        const outArr = new Array(buckets.count).fill(0);

        records.forEach(r => {
            if (!r.start_time) return;
            let idx;
            if (buckets.unit === 'hour') {
                if (r.start_time < startOfDay) return;
                idx = new Date(r.start_time).getHours();
            } else {
                const recDay = new Date(r.start_time);
                const dayKey = new Date(recDay.getFullYear(), recDay.getMonth(), recDay.getDate()).getTime();
                const diff = Math.floor((startOfDay - dayKey) / 86400000);
                idx = buckets.count - 1 - diff;
            }
            if (idx < 0 || idx >= buckets.count) return;
            if (r.call_type === 1) inArr[idx]++;
            else if (r.call_type === 2) outArr[idx]++;
        });

        let max = 1;
        for (let i = 0; i < buckets.count; i++) {
            const v = Math.max(inArr[i], outArr[i]);
            if (v > max) max = v;
        }

        let bars = '<div class="cc-bar-chart">';
        for (let i = 0; i < buckets.count; i++) {
            const inH = Math.round(inArr[i] / max * 100);
            const outH = Math.round(outArr[i] / max * 100);
            const lbl = this._trendLabel(i, range, buckets);
            bars += '<div class="cc-bar-col">';
            bars += '<div class="cc-bar-tooltip">' + lbl + '<br>呼入 ' + inArr[i] + ' · 呼出 ' + outArr[i] + '</div>';
            bars += '<div style="display:flex;gap:1px;align-items:flex-end;width:100%;height:100%;">';
            bars += '<div class="cc-bar cc-bar-in" style="height:' + inH + '%;flex:1;"></div>';
            bars += '<div class="cc-bar cc-bar-out" style="height:' + outH + '%;flex:1;"></div>';
            bars += '</div>';
            bars += '</div>';
        }
        bars += '</div>';

        // 坐标
        let axis = '<div class="cc-bar-axis">';
        for (let i = 0; i < buckets.count; i++) {
            const lbl = this._trendAxisLabel(i, range, buckets);
            axis += '<div>' + (lbl || '') + '</div>';
        }
        axis += '</div>';

        return bars + axis;
    },

    _trendLabel(i, range, buckets) {
        if (range === 'today') return ccrPad2(i) + ':00';
        const now = new Date();
        const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
        const ts = startOfDay - (buckets.count - 1 - i) * 86400000;
        return ccrDateStr(ts);
    },

    _trendAxisLabel(i, range, buckets) {
        if (range === 'today') return (i % 3 === 0) ? ccrPad2(i) : '';
        if (range === 'week') {
            const now = new Date();
            const ts = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime() - (6 - i) * 86400000;
            const d = new Date(ts);
            return (d.getMonth() + 1) + '/' + d.getDate();
        }
        if (range === 'month') {
            const now = new Date();
            const ts = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime() - (29 - i) * 86400000;
            const d = new Date(ts);
            return (d.getDate() % 2 === 0) ? d.getDate() : '';
        }
        // quarter
        const now = new Date();
        const ts = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime() - (89 - i) * 86400000;
        const d = new Date(ts);
        return (i % 10 === 0) ? ((d.getMonth() + 1) + '/' + d.getDate()) : '';
    },

    _renderHeatmap(matrix) {
        let max = 0;
        for (let d = 0; d < 7; d++) for (let h = 0; h < 24; h++) if (matrix[d][h] > max) max = matrix[d][h];

        const days = ['周一', '周二', '周三', '周四', '周五', '周六', '周日'];
        let h = '<div class="cc-heatmap">';
        // 第一行：小时坐标
        h += '<div class="cc-heatmap-axis"></div>';
        for (let i = 0; i < 24; i++) h += '<div class="cc-heatmap-axis">' + i + '</div>';
        // 7 行
        for (let d = 0; d < 7; d++) {
            h += '<div class="cc-heatmap-label">' + days[d] + '</div>';
            for (let hr = 0; hr < 24; hr++) {
                const v = matrix[d][hr] || 0;
                const op = max ? (0.05 + (v / max) * 0.75) : 0.05;
                h += '<div class="cc-heatmap-cell" style="background:rgba(212,175,55,' + op.toFixed(2) + ');" data-tip="' + days[d] + ' ' + hr + ':00 — ' + v + ' 通"></div>';
            }
        }
        h += '</div>';
        return h;
    },

    _renderServiceLevel(stats) {
        const fill20 = stats.within20sRate;
        const fill20Class = fill20 >= 80 ? 'cc-fill-good' : fill20 >= 60 ? 'cc-fill-warn' : 'cc-fill-bad';
        const utilClass = stats.utilization >= 75 ? 'cc-fill-good' : stats.utilization >= 50 ? 'cc-fill-warn' : 'cc-fill-bad';

        let h = '<div class="cc-svc-list">';
        h += '<div class="cc-svc-item">' +
                '<div class="cc-svc-row"><span class="cc-svc-label">20秒接通率</span><span class="cc-svc-target">目标 80%</span></div>' +
                '<div class="cc-svc-row"><span class="cc-svc-value">' + fill20 + '%</span></div>' +
                '<div class="cc-kpi-progress"><div class="cc-kpi-fill ' + fill20Class + '" style="width:' + fill20 + '%;"></div>' +
                    '<div class="cc-kpi-target" style="left:80%;"></div>' +
                '</div>' +
             '</div>';

        h += '<div class="cc-svc-item">' +
                '<div class="cc-svc-row"><span class="cc-svc-label">平均等待时长</span><span class="cc-svc-target">越短越好</span></div>' +
                '<div class="cc-svc-row"><span class="cc-svc-value">' + ccrDur(stats.avgWait) + '</span></div>' +
             '</div>';

        h += '<div class="cc-svc-item">' +
                '<div class="cc-svc-row"><span class="cc-svc-label">队列放弃率</span><span class="cc-svc-target">目标 ≤10%</span></div>' +
                '<div class="cc-svc-row"><span class="cc-svc-value">' + stats.abandonRate + '%</span></div>' +
                '<div class="cc-kpi-progress"><div class="cc-kpi-fill ' + (stats.abandonRate <= 10 ? 'cc-fill-good' : 'cc-fill-bad') + '" style="width:' + Math.min(100, stats.abandonRate * 4) + '%;"></div></div>' +
             '</div>';

        h += '<div class="cc-svc-item">' +
                '<div class="cc-svc-row"><span class="cc-svc-label">坐席利用率</span><span class="cc-svc-target">目标 75%</span></div>' +
                '<div class="cc-svc-row"><span class="cc-svc-value">' + stats.utilization + '%</span></div>' +
                '<div class="cc-kpi-progress"><div class="cc-kpi-fill ' + utilClass + '" style="width:' + stats.utilization + '%;"></div>' +
                    '<div class="cc-kpi-target" style="left:75%;"></div>' +
                '</div>' +
             '</div>';

        h += '</div>';
        return h;
    },

    /* ====================================================================
       5. 数据计算
       ==================================================================== */
    calculateTrafficStats(records, range) {
        const inc = records.filter(r => r.call_type === 1);
        const out = records.filter(r => r.call_type === 2);
        const incAns = inc.filter(r => r.status === 1);
        const outAns = out.filter(r => r.status === 1);
        const allAns = records.filter(r => r.status === 1);
        const totalDur = allAns.reduce((s, r) => s + (r.duration || 0), 0);

        const within20 = incAns.filter(r => (r.queue_duration || 0) <= 20).length;
        const within20sRate = inc.length ? Math.round(within20 / inc.length * 100) : 0;
        const avgWait = incAns.length ? Math.round(incAns.reduce((s, r) => s + (r.queue_duration || 0), 0) / incAns.length) : 0;
        const abandoned = inc.length - incAns.length;
        const abandonRate = inc.length ? Math.round(abandoned / inc.length * 100) : 0;

        // 利用率 = 通话总时长 / (在线坐席数 × 范围时长 × 60%)
        const agents = ccrGetAgents();
        const onlineAgents = agents.filter(a => a.status !== 0).length || agents.length || 1;
        let rangeSec = 86400;
        if (range === 'week')    rangeSec = 7 * 86400;
        if (range === 'month')   rangeSec = 30 * 86400;
        if (range === 'quarter') rangeSec = 90 * 86400;
        // 工作时长按 8 小时 × 天数估算
        const workSec = onlineAgents * (rangeSec / 86400) * 8 * 3600;
        const utilization = workSec ? Math.min(100, Math.round(totalDur / workSec * 100)) : 0;

        return {
            inboundTotal: inc.length,
            inboundAnswered: incAns.length,
            inboundRate: inc.length ? Math.round(incAns.length / inc.length * 100) : 0,
            outboundTotal: out.length,
            outboundAnswered: outAns.length,
            outboundRate: out.length ? Math.round(outAns.length / out.length * 100) : 0,
            avgDuration: allAns.length ? Math.round(totalDur / allAns.length) : 0,
            lossRate: abandonRate,
            avgWait: avgWait,
            within20sRate: within20sRate,
            abandonRate: abandonRate,
            utilization: utilization,
            totalDuration: totalDur
        };
    },

    calculateHourlyDistribution(records) {
        const arr = new Array(24).fill(0);
        records.forEach(r => {
            if (!r.start_time) return;
            arr[new Date(r.start_time).getHours()]++;
        });
        return arr;
    },

    calculateHeatmapData(records) {
        const m = [];
        for (let i = 0; i < 7; i++) m.push(new Array(24).fill(0));
        records.forEach(r => {
            if (!r.start_time) return;
            const d = new Date(r.start_time);
            const day = (d.getDay() + 6) % 7; // Mon=0 ... Sun=6
            m[day][d.getHours()]++;
        });
        return m;
    },

    calculateAgentStats(records, agents) {
        const quality = ccrGetQuality();
        return agents.map(a => {
            const recs = records.filter(r => r.agent_id === a.id);
            const ans = recs.filter(r => r.status === 1);
            const totalDur = ans.reduce((s, r) => s + (r.duration || 0), 0);
            const satRecs = recs.filter(r => r.satisfaction > 0);
            const qcs = quality.filter(q => {
                const rec = recs.find(rr => rr.id === q.call_id);
                return !!rec;
            });
            return {
                agent_id: a.id,
                agent_no: a.agent_no || '-',
                name: a.name || '-',
                callCount: recs.length,
                answered: ans.length,
                answerRate: recs.length ? Math.round(ans.length / recs.length * 100) : 0,
                avgDuration: ans.length ? Math.round(totalDur / ans.length) : 0,
                totalDuration: totalDur,
                satisfaction: satRecs.length ? +(satRecs.reduce((s, r) => s + (r.satisfaction || 0), 0) / satRecs.length).toFixed(1) : 0,
                qcScore: qcs.length ? Math.round(qcs.reduce((s, q) => s + (q.total_score || 0), 0) / qcs.length) : 0
            };
        });
    },

    /* ====================================================================
       6. 坐席绩效报表
       ==================================================================== */
    renderAgentReport() {
        const all = ccrGetRecords();
        const records = all.filter(r => (r.start_time || 0) >= ccrRangeStart(this.dateRange));
        const agents = ccrGetAgents();
        const stats = this.calculateAgentStats(records, agents);

        let h = this._rangeBar();

        if (agents.length === 0) return h + ccrEmpty('暂无坐席数据');

        // 排序
        const sorted = stats.slice().sort((a, b) => {
            const va = a[this.sortField], vb = b[this.sortField];
            if (this.sortDir === 'asc') return (va > vb ? 1 : va < vb ? -1 : 0);
            return (va < vb ? 1 : va > vb ? -1 : 0);
        });

        h += '<div class="cc-chart-container">' +
                '<div class="cc-chart-title">坐席排行榜<span class="cc-chart-legend"><span style="color:#666;">点击列头排序 · 点击行查看个人详情</span></span></div>' +
                this._renderAgentRanking(sorted) +
             '</div>';

        if (this.selectedAgentId) {
            const cur = stats.find(s => s.agent_id === this.selectedAgentId);
            const ag = agents.find(a => a.id === this.selectedAgentId);
            if (cur && ag) {
                h += '<div class="cc-rpt-grid-2">';
                h += '<div class="cc-chart-container">' +
                        '<div class="cc-chart-title">坐席工时统计 — ' + ccrEsc(ag.name) + ' (' + ccrEsc(ag.agent_no) + ')</div>' +
                        this._renderWorkHours(cur, records) +
                     '</div>';
                h += '<div class="cc-chart-container">' +
                        '<div class="cc-chart-title">近 7 天通话量趋势</div>' +
                        this._renderAgentTrend(this.selectedAgentId, all) +
                     '</div>';
                h += '</div>';
            }
        }
        return h;
    },

    _renderAgentRanking(stats) {
        if (stats.length === 0) return ccrEmpty('暂无数据');
        const fields = [
            ['rank',         '排名',   false],
            ['name',         '坐席',   false],
            ['callCount',    '通话量', true],
            ['answerRate',   '接通率', true],
            ['avgDuration',  '平均时长', true],
            ['satisfaction', '满意度', true],
            ['qcScore',      '质检分', true]
        ];

        let h = '<div style="overflow-x:auto;"><table class="cc-rpt-table"><thead><tr>';
        fields.forEach(f => {
            const sortable = f[2];
            const isSorted = this.sortField === f[0];
            const arrow = isSorted ? (this.sortDir === 'desc' ? '▼' : '▲') : '◇';
            h += '<th' + (sortable ? ' class="cc-sortable' + (isSorted ? ' cc-sorted' : '') + '" data-cc-action="sort-rank" data-field="' + f[0] + '"' : '') + '>' +
                    f[1] + (sortable ? '<span class="cc-sort-icon">' + arrow + '</span>' : '') + '</th>';
        });
        h += '</tr></thead><tbody>';

        stats.forEach((s, idx) => {
            const rank = idx + 1;
            let medal = '';
            if (rank === 1) medal = '<span class="cc-rank-medal cc-rank-1">🥇</span>';
            else if (rank === 2) medal = '<span class="cc-rank-medal cc-rank-2">🥈</span>';
            else if (rank === 3) medal = '<span class="cc-rank-medal cc-rank-3">🥉</span>';
            else medal = '<span class="cc-rank-medal" style="color:#666;">' + rank + '</span>';

            const isActive = this.selectedAgentId === s.agent_id;
            h += '<tr class="' + (isActive ? 'cc-row-active' : '') + '" style="cursor:pointer;" data-cc-action="select-agent" data-agent-id="' + s.agent_id + '">';
            h += '<td>' + medal + '</td>';
            h += '<td><div style="font-weight:600;color:#fff;">' + ccrEsc(s.name) + '</div><div class="cc-tdim">' + ccrEsc(s.agent_no) + '</div></td>';
            h += '<td class="cc-tnum">' + s.callCount + '</td>';
            h += '<td class="cc-tnum">' + s.answerRate + '%</td>';
            h += '<td class="cc-tnum">' + ccrDur(s.avgDuration) + '</td>';
            h += '<td class="cc-tnum">' + (s.satisfaction || '-') + (s.satisfaction ? ' ★' : '') + '</td>';
            h += '<td class="cc-tnum">' + (s.qcScore || '-') + (s.qcScore ? ' / 100' : '') + '</td>';
            h += '</tr>';
        });

        h += '</tbody></table></div>';
        h += '<div class="cc-rpt-tip">前三名以金、银、铜色奖牌标记。点击任意行可查看该坐席详情。</div>';
        return h;
    },

    _renderWorkHours(stat, records) {
        // 模拟工时分布（基于通话时长合理推算）
        const callSec = stat.totalDuration;
        // 常见配比：通话40% / 就绪35% / 后处理10% / 小休10% / 其他5%
        const loginSec = Math.max(callSec / 0.4, 8 * 3600); // 至少 8h
        const readySec = Math.round(loginSec * 0.35);
        const afterSec = Math.round(loginSec * 0.1);
        const breakSec = Math.round(loginSec * 0.1);
        const otherSec = loginSec - callSec - readySec - afterSec - breakSec;

        const total = loginSec;
        const seg = [
            { label: '通话',   sec: callSec,  color: 'linear-gradient(90deg,#B8860B,#D4AF37)' },
            { label: '就绪',   sec: readySec, color: 'linear-gradient(90deg,#2E7D32,#66BB6A)' },
            { label: '后处理', sec: afterSec, color: 'linear-gradient(90deg,#1565C0,#5B8DEF)' },
            { label: '小休',   sec: breakSec, color: 'linear-gradient(90deg,#6A1B9A,#BA68C8)' },
            { label: '其他',   sec: otherSec, color: '#3a3a48' }
        ];

        let h = '<div class="cc-svc-row" style="margin-bottom:12px;">';
        h += '<span class="cc-svc-label">登录总时长</span>';
        h += '<span class="cc-svc-value">' + Math.round(total / 3600) + 'h ' + Math.round((total % 3600) / 60) + 'm</span>';
        h += '</div>';

        h += '<div class="cc-stacked-bar">';
        seg.forEach(s => {
            const w = total ? (s.sec / total * 100).toFixed(1) : 0;
            h += '<div class="cc-stacked-segment" style="width:' + w + '%;background:' + s.color + ';" data-label="' + s.label + ' ' + Math.round(s.sec / 60) + ' 分钟 (' + w + '%)">' + (parseFloat(w) >= 6 ? s.label : '') + '</div>';
        });
        h += '</div>';

        // 图例
        h += '<div style="display:flex;flex-wrap:wrap;gap:14px;margin-top:14px;font-size:11px;color:#A0A0B0;">';
        seg.forEach(s => {
            h += '<span style="display:flex;align-items:center;gap:6px;"><span style="display:inline-block;width:10px;height:10px;border-radius:2px;background:' + s.color + ';"></span>' +
                 s.label + '<span style="color:#D4AF37;font-family:monospace;margin-left:4px;">' + ccrDur(s.sec) + '</span></span>';
        });
        h += '</div>';
        return h;
    },

    _renderAgentTrend(agentId, allRecords) {
        const now = new Date();
        const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
        const days = 7;
        const arr = new Array(days).fill(0);
        allRecords.filter(r => r.agent_id === agentId).forEach(r => {
            if (!r.start_time) return;
            const d = new Date(r.start_time);
            const dayKey = new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
            const diff = Math.floor((startOfDay - dayKey) / 86400000);
            const idx = days - 1 - diff;
            if (idx >= 0 && idx < days) arr[idx]++;
        });

        const max = Math.max(1, ...arr);
        // 折线 SVG
        const w = 100, hh = 100;
        const stepX = arr.length > 1 ? w / (arr.length - 1) : 0;
        const pts = arr.map((v, i) => (i * stepX).toFixed(2) + ',' + (hh - (v / max) * (hh - 10)).toFixed(2));
        const linePath = 'M ' + pts.join(' L ');
        const areaPath = linePath + ' L ' + (w).toFixed(2) + ',' + hh + ' L 0,' + hh + ' Z';

        let svg = '<div class="cc-line-chart">';
        svg += '<svg class="cc-line-svg" viewBox="0 0 ' + w + ' ' + hh + '" preserveAspectRatio="none">';
        svg += '<defs><linearGradient id="cc-line-grad" x1="0" y1="0" x2="0" y2="1">' +
                  '<stop offset="0%" stop-color="#D4AF37" stop-opacity=".5"/>' +
                  '<stop offset="100%" stop-color="#D4AF37" stop-opacity="0"/>' +
               '</linearGradient></defs>';
        svg += '<path class="cc-line-area" d="' + areaPath + '"/>';
        svg += '<path class="cc-line-path" d="' + linePath + '"/>';
        arr.forEach((v, i) => {
            const cx = (i * stepX).toFixed(2);
            const cy = (hh - (v / max) * (hh - 10)).toFixed(2);
            svg += '<circle class="cc-line-dot" cx="' + cx + '" cy="' + cy + '" r="3"><title>' + this._dayLabel(i, days) + '：' + v + ' 通</title></circle>';
        });
        svg += '</svg></div>';

        // 坐标
        let axis = '<div class="cc-bar-axis">';
        for (let i = 0; i < days; i++) axis += '<div>' + this._dayLabel(i, days) + '</div>';
        axis += '</div>';

        // 数值标记
        let nums = '<div style="display:flex;gap:0;padding:0 10px 0;font-family:monospace;font-size:11px;color:#D4AF37;">';
        for (let i = 0; i < days; i++) nums += '<div style="flex:1;text-align:center;">' + arr[i] + '</div>';
        nums += '</div>';

        return svg + nums + axis;
    },

    _dayLabel(i, totalDays) {
        const now = new Date();
        const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
        const d = new Date(startOfDay - (totalDays - 1 - i) * 86400000);
        return (d.getMonth() + 1) + '/' + d.getDate();
    },

    /* ====================================================================
       7. 客户分析报表
       ==================================================================== */
    renderCustomerReport() {
        const all = ccrGetRecords();
        const records = all.filter(r => (r.start_time || 0) >= ccrRangeStart(this.dateRange));
        const inbound = records.filter(r => r.call_type === 1);

        let h = this._rangeBar();

        if (inbound.length === 0) return h + ccrEmpty('当前时间范围内暂无来电数据');

        // a) TOP10
        h += '<div class="cc-chart-container">' +
                '<div class="cc-chart-title">高频来电 TOP 10</div>' +
                this._renderTopCallers(inbound) +
             '</div>';

        // b) 来电时段分布
        h += '<div class="cc-rpt-grid-2">';
        h += '<div class="cc-chart-container">' +
                '<div class="cc-chart-title">来电时段分布（24小时）</div>' +
                this._renderHourlyBars(inbound) +
             '</div>';

        // c) 来电原因分类（饼图）
        h += '<div class="cc-chart-container">' +
                '<div class="cc-chart-title">来电原因分类</div>' +
                this._renderReasonPie(inbound.length) +
             '</div>';
        h += '</div>';

        // d) 满意度趋势
        h += '<div class="cc-chart-container">' +
                '<div class="cc-chart-title">近 7 天满意度趋势（满分 5）</div>' +
                this._renderSatisfactionTrend(all) +
             '</div>';

        return h;
    },

    _renderTopCallers(inbound) {
        const map = {};
        inbound.forEach(r => {
            const phone = r.caller_no || '-';
            if (!map[phone]) map[phone] = { phone: phone, count: 0, dur: 0, last: 0 };
            map[phone].count++;
            map[phone].dur += (r.duration || 0);
            if ((r.start_time || 0) > map[phone].last) map[phone].last = r.start_time;
        });
        const list = Object.values(map).sort((a, b) => b.count - a.count).slice(0, 10);

        if (list.length === 0) return ccrEmpty('暂无数据');

        let h = '<div style="overflow-x:auto;"><table class="cc-rpt-table"><thead><tr>' +
                '<th>排名</th><th>号码</th><th>来电次数</th><th>总通话时长</th><th>最近来电</th>' +
                '</tr></thead><tbody>';
        list.forEach((c, i) => {
            const rank = i + 1;
            let medal = rank;
            if (rank <= 3) medal = '<span class="cc-rank-' + rank + '">' + rank + '</span>';
            h += '<tr>';
            h += '<td>' + medal + '</td>';
            h += '<td class="cc-tnum">' + ccrEsc(c.phone) + '</td>';
            h += '<td class="cc-tnum">' + c.count + '</td>';
            h += '<td class="cc-tnum">' + ccrDur(c.dur) + '</td>';
            h += '<td class="cc-tdim">' + ccrDateTimeStr(c.last) + '</td>';
            h += '</tr>';
        });
        h += '</tbody></table></div>';
        return h;
    },

    _renderHourlyBars(records) {
        const arr = this.calculateHourlyDistribution(records);
        const max = Math.max(1, ...arr);

        let h = '<div class="cc-bar-chart">';
        for (let i = 0; i < 24; i++) {
            const barH = Math.round(arr[i] / max * 100);
            h += '<div class="cc-bar-col">';
            h += '<div class="cc-bar-tooltip">' + ccrPad2(i) + ':00 — ' + arr[i] + ' 通</div>';
            h += '<div class="cc-bar cc-bar-single" style="height:' + barH + '%;"></div>';
            h += '</div>';
        }
        h += '</div>';

        let axis = '<div class="cc-bar-axis">';
        for (let i = 0; i < 24; i++) axis += '<div>' + (i % 3 === 0 ? ccrPad2(i) : '') + '</div>';
        axis += '</div>';
        return h + axis;
    },

    _renderReasonPie(total) {
        // 模拟分布
        const reasons = [
            { label: '咨询',     pct: 40, color: '#D4AF37' },
            { label: '售后',     pct: 25, color: '#5B8DEF' },
            { label: '投诉',     pct: 15, color: '#FF6B6E' },
            { label: '技术支持', pct: 12, color: '#66BB6A' },
            { label: '其他',     pct: 8,  color: '#BA68C8' }
        ];

        // conic-gradient
        let acc = 0;
        const stops = reasons.map(r => {
            const start = acc;
            acc += r.pct;
            return r.color + ' ' + start + '% ' + acc + '%';
        }).join(', ');

        let h = '<div class="cc-pie-wrap">';
        h += '<div class="cc-pie" style="background:conic-gradient(' + stops + ');">' +
                '<div class="cc-pie-center">' +
                    '<div class="cc-pie-center-num">' + total + '</div>' +
                    '<div class="cc-pie-center-lbl">来电总数</div>' +
                '</div>' +
             '</div>';
        h += '<div class="cc-pie-legend">';
        reasons.forEach(r => {
            const cnt = Math.round(total * r.pct / 100);
            h += '<div class="cc-pie-legend-item">' +
                    '<span class="cc-pie-legend-color" style="background:' + r.color + ';"></span>' +
                    r.label +
                    '<span style="color:#666;font-size:11px;margin-left:6px;">' + cnt + ' 通</span>' +
                    '<span class="cc-pie-legend-pct">' + r.pct + '%</span>' +
                 '</div>';
        });
        h += '</div></div>';
        return h;
    },

    _renderSatisfactionTrend(all) {
        const days = 7;
        const sums = new Array(days).fill(0);
        const cnts = new Array(days).fill(0);
        const now = new Date();
        const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();

        all.forEach(r => {
            if (!r.start_time || !r.satisfaction || r.satisfaction <= 0) return;
            const d = new Date(r.start_time);
            const dayKey = new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
            const diff = Math.floor((startOfDay - dayKey) / 86400000);
            const idx = days - 1 - diff;
            if (idx < 0 || idx >= days) return;
            sums[idx] += r.satisfaction;
            cnts[idx]++;
        });

        const avg = sums.map((s, i) => cnts[i] ? +(s / cnts[i]).toFixed(2) : 0);
        const max = 5;

        // SVG 折线
        const w = 100, hh = 100;
        const stepX = days > 1 ? w / (days - 1) : 0;
        const pts = avg.map((v, i) => (i * stepX).toFixed(2) + ',' + (hh - (v / max) * (hh - 10)).toFixed(2));
        const linePath = 'M ' + pts.join(' L ');
        const areaPath = linePath + ' L ' + w.toFixed(2) + ',' + hh + ' L 0,' + hh + ' Z';

        let svg = '<div class="cc-line-chart">';
        svg += '<svg class="cc-line-svg" viewBox="0 0 ' + w + ' ' + hh + '" preserveAspectRatio="none">';
        svg += '<defs><linearGradient id="cc-line-grad" x1="0" y1="0" x2="0" y2="1">' +
                  '<stop offset="0%" stop-color="#D4AF37" stop-opacity=".5"/>' +
                  '<stop offset="100%" stop-color="#D4AF37" stop-opacity="0"/>' +
               '</linearGradient></defs>';
        svg += '<path class="cc-line-area" d="' + areaPath + '"/>';
        svg += '<path class="cc-line-path" d="' + linePath + '"/>';
        avg.forEach((v, i) => {
            const cx = (i * stepX).toFixed(2);
            const cy = (hh - (v / max) * (hh - 10)).toFixed(2);
            svg += '<circle class="cc-line-dot" cx="' + cx + '" cy="' + cy + '" r="3"><title>' + this._dayLabel(i, days) + '：' + v + ' 分</title></circle>';
        });
        svg += '</svg></div>';

        let nums = '<div style="display:flex;gap:0;padding:0 10px 0;font-family:monospace;font-size:11px;color:#D4AF37;">';
        for (let i = 0; i < days; i++) nums += '<div style="flex:1;text-align:center;">' + (avg[i] || '-') + '</div>';
        nums += '</div>';

        let axis = '<div class="cc-bar-axis">';
        for (let i = 0; i < days; i++) axis += '<div>' + this._dayLabel(i, days) + '</div>';
        axis += '</div>';

        return svg + nums + axis;
    },

    /* ====================================================================
       8. 质检报表
       ==================================================================== */
    renderQualityReport() {
        const all = ccrGetRecords();
        const records = all.filter(r => (r.start_time || 0) >= ccrRangeStart(this.dateRange));
        const allQc = ccrGetQuality();
        // 与时间范围内的通话关联
        const recIds = new Set(records.map(r => r.id));
        const qcs = allQc.filter(q => recIds.has(q.call_id));

        let h = this._rangeBar();
        if (qcs.length === 0) return h + ccrEmpty('当前时间范围内暂无质检记录');

        // a) 概览
        const total = qcs.length;
        const avg = total ? Math.round(qcs.reduce((s, q) => s + (q.total_score || 0), 0) / total) : 0;
        const excellent = qcs.filter(q => (q.total_score || 0) >= 80).length;
        const failed = qcs.filter(q => (q.total_score || 0) < 60).length;
        const excellentRate = total ? Math.round(excellent / total * 100) : 0;
        const failRate = total ? Math.round(failed / total * 100) : 0;

        h += '<div class="cc-rpt-grid-8" style="grid-template-columns:repeat(4,1fr);">';
        h += this._kpi('质检总数',  total,         '次');
        h += this._kpi('平均得分',  avg,           '分');
        h += this._kpi('优秀率',    excellentRate + '%', '', excellentRate >= 60 ? 'cc-up' : 'cc-down');
        h += this._kpi('不合格率',  failRate + '%',      '', failRate <= 10 ? 'cc-up' : 'cc-down');
        h += '</div>';

        // b) 五维评分平均
        h += '<div class="cc-chart-container">' +
                '<div class="cc-chart-title">五维评分平均</div>' +
                this._renderDimensionAvg(qcs) +
             '</div>';

        // c) 坐席质检排名
        h += '<div class="cc-chart-container">' +
                '<div class="cc-chart-title">坐席质检排名</div>' +
                this._renderQualityRanking(qcs, records) +
             '</div>';

        return h;
    },

    _renderDimensionAvg(qcs) {
        const dims = (window.QC_DIMENSIONS || [
            { key: 'attitude',     label: '服务态度', max: 20 },
            { key: 'professional', label: '专业水平', max: 30 },
            { key: 'process',      label: '流程规范', max: 20 },
            { key: 'communication',label: '沟通技巧', max: 15 },
            { key: 'achievement',  label: '结果达成', max: 15 }
        ]);

        let h = '<div class="cc-dim-bar">';
        dims.forEach(d => {
            const sum = qcs.reduce((s, q) => s + ((q.scores && q.scores[d.key]) || 0), 0);
            const avg = qcs.length ? +(sum / qcs.length).toFixed(1) : 0;
            const pct = d.max ? Math.round(avg / d.max * 100) : 0;
            h += '<div class="cc-dim-row">';
            h += '<div class="cc-dim-label">' + ccrEsc(d.label) + '</div>';
            h += '<div class="cc-dim-track"><div class="cc-dim-fill" style="width:' + pct + '%;"></div></div>';
            h += '<div class="cc-dim-value">' + avg + ' / ' + d.max + '</div>';
            h += '</div>';
        });
        h += '</div>';
        return h;
    },

    _renderQualityRanking(qcs, records) {
        // 按 agent 聚合
        const map = {};
        qcs.forEach(q => {
            const rec = records.find(r => r.id === q.call_id);
            if (!rec) return;
            const aid = rec.agent_id;
            if (!map[aid]) {
                map[aid] = {
                    agent_id: aid,
                    name: rec.agent_name || '-',
                    agent_no: rec.agent_no || '-',
                    scores: []
                };
            }
            map[aid].scores.push(q.total_score || 0);
        });

        const list = Object.values(map).map(g => {
            const cnt = g.scores.length;
            const sum = g.scores.reduce((a, b) => a + b, 0);
            const avg = cnt ? Math.round(sum / cnt) : 0;
            const max = cnt ? Math.max.apply(null, g.scores) : 0;
            const min = cnt ? Math.min.apply(null, g.scores) : 0;
            const passed = g.scores.filter(s => s >= 60).length;
            return {
                agent_id: g.agent_id,
                name: g.name,
                agent_no: g.agent_no,
                count: cnt,
                avg: avg,
                max: max,
                min: min,
                passRate: cnt ? Math.round(passed / cnt * 100) : 0
            };
        }).sort((a, b) => b.avg - a.avg);

        if (list.length === 0) return ccrEmpty('暂无数据');

        let h = '<div style="overflow-x:auto;"><table class="cc-rpt-table"><thead><tr>' +
                '<th>排名</th><th>坐席</th><th>质检次数</th><th>平均分</th><th>最高分</th><th>最低分</th><th>合格率</th>' +
                '</tr></thead><tbody>';
        list.forEach((s, i) => {
            const rank = i + 1;
            let medal = rank;
            if (rank <= 3) medal = '<span class="cc-rank-' + rank + '">' + rank + '</span>';
            h += '<tr>';
            h += '<td>' + medal + '</td>';
            h += '<td><div style="font-weight:600;color:#fff;">' + ccrEsc(s.name) + '</div><div class="cc-tdim">' + ccrEsc(s.agent_no) + '</div></td>';
            h += '<td class="cc-tnum">' + s.count + '</td>';
            h += '<td class="cc-tnum">' + s.avg + '</td>';
            h += '<td class="cc-tnum" style="color:#66BB6A;">' + s.max + '</td>';
            h += '<td class="cc-tnum" style="color:#FF6B6E;">' + s.min + '</td>';
            h += '<td class="cc-tnum">' + s.passRate + '%</td>';
            h += '</tr>';
        });
        h += '</tbody></table></div>';
        return h;
    }
};

/* ========================================================================
   9. 暴露到全局
   ======================================================================== */
if (typeof window !== 'undefined') {
    window.CCReport = CCReport;
}
