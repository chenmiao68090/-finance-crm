/**
 * 呼叫中心 - 实时监控大屏（cc-monitor.js）
 * 数据源：AgentStorage / SkillGroupStorage / QueueStorage / CallRecordStorage
 * UI风格：黑金奢华 · 控制中心
 * 暴露：window.CCMonitor
 */

/* ========================================================================
   1. 样式注入（IIFE）
   ======================================================================== */
(function () {
    if (typeof document === 'undefined') return;
    if (document.getElementById('cc-monitor-styles')) return;
    const style = document.createElement('style');
    style.id = 'cc-monitor-styles';
    style.textContent = ''
        + '.cc-monitor-fullscreen{position:fixed;top:0;left:0;width:100vw;height:100vh;z-index:9999;overflow-y:auto;padding:24px;background:#0A0A0F;}'
        + '.cc-monitor-fullscreen::before{content:"";position:absolute;top:0;left:0;right:0;height:1px;background:linear-gradient(90deg,transparent,#D4AF37,transparent);pointer-events:none;}'
        + '.cc-mon-header{display:flex;justify-content:space-between;align-items:center;margin-bottom:18px;flex-wrap:wrap;gap:14px;padding:14px 18px;background:linear-gradient(135deg,rgba(212,175,55,0.05),rgba(212,175,55,0.01));border:1px solid rgba(212,175,55,0.18);border-radius:12px;}'
        + '.cc-mon-subtabs{display:flex;gap:6px;}'
        + '.cc-mon-subtab{padding:8px 18px;border:1px solid rgba(212,175,55,0.2);background:transparent;color:#A0A0B0;border-radius:8px;cursor:pointer;font-size:13px;letter-spacing:.5px;transition:all .25s;font-family:inherit;}'
        + '.cc-mon-subtab:hover{border-color:rgba(212,175,55,0.4);color:#D4AF37;}'
        + '.cc-mon-subtab.active{background:linear-gradient(135deg,#B8860B,#D4AF37);color:#0A0A0F;border-color:#D4AF37;font-weight:600;box-shadow:0 4px 14px rgba(212,175,55,0.25);}'
        + '.cc-mon-controls{display:flex;align-items:center;gap:14px;font-size:12px;color:#A0A0B0;}'
        + '.cc-mon-refresh-time{font-size:11px;color:#666;letter-spacing:.5px;font-family:monospace;}'
        + '.cc-mon-switch{position:relative;display:inline-flex;align-items:center;cursor:pointer;gap:8px;}'
        + '.cc-mon-switch-track{width:38px;height:20px;border-radius:10px;background:#222;border:1px solid rgba(212,175,55,0.2);transition:all .25s;position:relative;}'
        + '.cc-mon-switch-track::after{content:"";position:absolute;top:2px;left:2px;width:14px;height:14px;border-radius:50%;background:#666;transition:all .25s;}'
        + '.cc-mon-switch.on .cc-mon-switch-track{background:rgba(0,208,132,0.15);border-color:#00D084;}'
        + '.cc-mon-switch.on .cc-mon-switch-track::after{left:20px;background:#00D084;box-shadow:0 0 8px rgba(0,208,132,0.6);}'
        + '.cc-mon-fs-btn{padding:6px 14px;border:1px solid rgba(212,175,55,0.3);background:transparent;color:#D4AF37;border-radius:6px;cursor:pointer;font-size:12px;letter-spacing:.5px;transition:all .25s;font-family:inherit;}'
        + '.cc-mon-fs-btn:hover{background:rgba(212,175,55,0.1);}'
        + '.cc-big-grid{display:grid;grid-template-columns:repeat(6,1fr);gap:12px;margin-bottom:20px;}'
        + '@media(max-width:1280px){.cc-big-grid{grid-template-columns:repeat(3,1fr);}}'
        + '.cc-big-card{position:relative;background:linear-gradient(135deg,#12121A,#0E0E14);border:1px solid rgba(212,175,55,0.15);border-radius:12px;padding:18px 16px;overflow:hidden;transition:all .35s;}'
        + '.cc-big-card::before{content:"";position:absolute;top:0;left:0;right:0;height:2px;background:linear-gradient(90deg,transparent,#D4AF37,transparent);opacity:.5;}'
        + '.cc-big-card:hover{border-color:rgba(212,175,55,0.35);transform:translateY(-2px);box-shadow:0 12px 28px rgba(0,0,0,0.4);}'
        + '.cc-big-card-tag{font-size:10px;color:#666;letter-spacing:1.5px;font-weight:600;text-transform:uppercase;margin-bottom:6px;}'
        + '.cc-big-number{font-size:34px;font-weight:700;color:#D4AF37;line-height:1;letter-spacing:.5px;font-family:"Trajan Pro","Optima",Georgia,serif;display:flex;align-items:baseline;gap:6px;}'
        + '.cc-big-number-suffix{font-size:13px;color:#A0A0B0;font-weight:400;}'
        + '.cc-big-label{font-size:12px;color:#A0A0B0;margin-top:8px;letter-spacing:.5px;}'
        + '.cc-big-sub{font-size:11px;color:#00D084;margin-top:4px;letter-spacing:.5px;display:flex;align-items:center;gap:4px;}'
        + '.cc-big-sub.warn{color:#F59E0B;}'
        + '.cc-big-sub.danger{color:#FF4D4F;}'
        + '.cc-live-dot{display:inline-block;width:8px;height:8px;border-radius:50%;background:#00D084;animation:ccPulse 1.5s infinite;margin-right:6px;box-shadow:0 0 6px rgba(0,208,132,0.6);}'
        + '@keyframes ccPulse{0%,100%{opacity:1;transform:scale(1);}50%{opacity:.5;transform:scale(1.4);}}'
        + '.cc-mon-grid-2{display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-bottom:20px;}'
        + '@media(max-width:1100px){.cc-mon-grid-2{grid-template-columns:1fr;}}'
        + '.cc-mon-grid-3{display:grid;grid-template-columns:2fr 1fr 1fr;gap:16px;margin-bottom:20px;}'
        + '@media(max-width:1100px){.cc-mon-grid-3{grid-template-columns:1fr;}}'
        + '.cc-panel{background:#12121A;border:1px solid rgba(212,175,55,0.12);border-radius:12px;padding:18px;}'
        + '.cc-panel-title{font-size:13px;color:#D4AF37;letter-spacing:1.5px;font-weight:600;margin-bottom:14px;display:flex;align-items:center;justify-content:space-between;text-transform:uppercase;}'
        + '.cc-panel-title-cn{color:#fff;font-size:14px;letter-spacing:1px;}'
        + '.cc-mon-table{width:100%;border-collapse:collapse;font-size:13px;}'
        + '.cc-mon-table th{text-align:left;padding:10px 12px;color:#666;font-weight:500;font-size:11px;letter-spacing:1px;text-transform:uppercase;border-bottom:1px solid rgba(212,175,55,0.12);}'
        + '.cc-mon-table td{padding:11px 12px;color:#E0E0E8;border-bottom:1px solid rgba(255,255,255,0.04);}'
        + '.cc-mon-table tbody tr{transition:background .2s;}'
        + '.cc-mon-table tbody tr:hover{background:rgba(212,175,55,0.04);}'
        + '.cc-live-row{animation:ccFadeIn .5s;}'
        + '@keyframes ccFadeIn{from{opacity:0;transform:translateY(-5px);}to{opacity:1;transform:translateY(0);}}'
        + '.cc-row-talking{background:rgba(212,175,55,0.06);position:relative;}'
        + '.cc-row-talking::before{content:"";position:absolute;left:0;top:0;bottom:0;width:2px;background:#D4AF37;animation:ccGoldPulse 1.4s infinite;}'
        + '@keyframes ccGoldPulse{0%,100%{opacity:1;}50%{opacity:.3;}}'
        + '.cc-tag-mini{display:inline-flex;align-items:center;gap:5px;padding:3px 10px;border-radius:10px;font-size:11px;letter-spacing:.5px;font-weight:500;}'
        + '.cc-tag-talking{background:rgba(212,175,55,0.15);color:#D4AF37;border:1px solid rgba(212,175,55,0.3);}'
        + '.cc-tag-ready{background:rgba(0,208,132,0.12);color:#00D084;border:1px solid rgba(0,208,132,0.3);}'
        + '.cc-tag-break{background:rgba(139,123,255,0.12);color:#8B7BFF;border:1px solid rgba(139,123,255,0.3);}'
        + '.cc-tag-after{background:rgba(60,160,255,0.12);color:#3CA0FF;border:1px solid rgba(60,160,255,0.3);}'
        + '.cc-tag-offline{background:rgba(120,120,140,0.1);color:#888;border:1px solid rgba(120,120,140,0.3);}'
        + '.cc-tag-ringing{background:rgba(245,158,11,0.12);color:#F59E0B;border:1px solid rgba(245,158,11,0.3);}'
        + '.cc-chart-bar-wrap{display:flex;align-items:flex-end;gap:6px;height:140px;padding:10px 0 24px;position:relative;}'
        + '.cc-chart-bar-wrap::after{content:"";position:absolute;left:0;right:0;bottom:22px;height:1px;background:rgba(212,175,55,0.15);}'
        + '.cc-chart-bar{flex:1;background:linear-gradient(to top,rgba(184,134,11,0.3),#D4AF37);border-radius:3px 3px 0 0;transition:height .6s cubic-bezier(.34,1.56,.64,1);min-width:14px;position:relative;cursor:pointer;}'
        + '.cc-chart-bar:hover{background:linear-gradient(to top,#B8860B,#F4D03F);box-shadow:0 0 12px rgba(212,175,55,0.5);}'
        + '.cc-chart-bar-label{position:absolute;bottom:-20px;left:50%;transform:translateX(-50%);font-size:9px;color:#666;white-space:nowrap;font-family:monospace;letter-spacing:.5px;}'
        + '.cc-chart-bar-value{position:absolute;top:-18px;left:50%;transform:translateX(-50%);font-size:10px;color:#D4AF37;font-weight:600;font-family:monospace;opacity:0;transition:opacity .25s;}'
        + '.cc-chart-bar:hover .cc-chart-bar-value{opacity:1;}'
        + '.cc-chart-bar.peak{background:linear-gradient(to top,#FF6B35,#F4D03F);}'
        + '.cc-donut-wrap{display:flex;flex-direction:column;align-items:center;gap:14px;}'
        + '.cc-donut{position:relative;width:170px;height:170px;border-radius:50%;display:flex;align-items:center;justify-content:center;}'
        + '.cc-donut-hole{position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);width:118px;height:118px;border-radius:50%;background:#12121A;border:1px solid rgba(212,175,55,0.12);display:flex;flex-direction:column;align-items:center;justify-content:center;}'
        + '.cc-donut-total{font-size:30px;font-weight:700;color:#D4AF37;line-height:1;font-family:"Trajan Pro","Optima",Georgia,serif;}'
        + '.cc-donut-label{font-size:10px;color:#A0A0B0;letter-spacing:1.5px;margin-top:4px;text-transform:uppercase;}'
        + '.cc-donut-legend{display:grid;grid-template-columns:1fr 1fr;gap:6px 14px;width:100%;}'
        + '.cc-donut-leg-item{display:flex;align-items:center;gap:8px;font-size:12px;color:#A0A0B0;}'
        + '.cc-donut-leg-dot{width:10px;height:10px;border-radius:2px;flex-shrink:0;}'
        + '.cc-donut-leg-name{flex:1;}'
        + '.cc-donut-leg-num{color:#fff;font-weight:600;font-family:monospace;}'
        + '.cc-alert-list{display:flex;flex-direction:column;gap:8px;}'
        + '.cc-alert-item{padding:12px 14px;border-radius:8px;display:flex;align-items:center;gap:10px;animation:ccFadeIn .4s;}'
        + '.cc-alert-danger{background:rgba(255,77,79,0.08);border:1px solid rgba(255,77,79,0.3);}'
        + '.cc-alert-danger .cc-alert-icon{color:#FF4D4F;}'
        + '.cc-alert-warning{background:rgba(245,158,11,0.08);border:1px solid rgba(245,158,11,0.3);}'
        + '.cc-alert-warning .cc-alert-icon{color:#F59E0B;}'
        + '.cc-alert-icon{font-size:18px;flex-shrink:0;}'
        + '.cc-alert-body{flex:1;}'
        + '.cc-alert-type{font-size:11px;color:#fff;font-weight:600;letter-spacing:.8px;text-transform:uppercase;}'
        + '.cc-alert-text{font-size:12px;color:#A0A0B0;margin-top:2px;}'
        + '.cc-alert-time{font-size:10px;color:#666;font-family:monospace;letter-spacing:.5px;}'
        + '.cc-alert-empty{padding:30px 16px;text-align:center;color:#444;font-size:12px;letter-spacing:1px;}'
        + '.cc-agent-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(220px,1fr));gap:14px;}'
        + '.cc-agent-card{background:linear-gradient(160deg,#12121A,#0E0E14);border:1px solid rgba(212,175,55,0.15);border-radius:14px;padding:18px 16px;text-align:center;transition:all .35s;position:relative;overflow:hidden;}'
        + '.cc-agent-card::before{content:"";position:absolute;top:-50%;left:-50%;width:200%;height:200%;background:radial-gradient(circle,rgba(212,175,55,0.06),transparent 40%);opacity:0;transition:opacity .35s;pointer-events:none;}'
        + '.cc-agent-card:hover::before{opacity:1;}'
        + '.cc-agent-card:hover{border-color:rgba(212,175,55,0.35);transform:translateY(-3px);box-shadow:0 14px 32px rgba(0,0,0,0.5);}'
        + '.cc-agent-card.is-talking{border-color:rgba(212,175,55,0.4);background:linear-gradient(160deg,#1A1610,#0E0E14);}'
        + '.cc-agent-avatar{width:54px;height:54px;border-radius:50%;display:flex;align-items:center;justify-content:center;margin:0 auto 10px;font-size:20px;font-weight:700;color:#0A0A0F;letter-spacing:.5px;background:linear-gradient(135deg,#D4AF37,#B8860B);position:relative;}'
        + '.cc-agent-avatar.online{box-shadow:0 0 0 3px #00D084,0 0 12px rgba(0,208,132,0.4);}'
        + '.cc-agent-avatar.busy{box-shadow:0 0 0 3px #D4AF37,0 0 14px rgba(212,175,55,0.5);animation:ccGoldGlow 2s infinite;}'
        + '@keyframes ccGoldGlow{0%,100%{box-shadow:0 0 0 3px #D4AF37,0 0 14px rgba(212,175,55,0.5);}50%{box-shadow:0 0 0 3px #D4AF37,0 0 22px rgba(212,175,55,0.8);}}'
        + '.cc-agent-avatar.break{box-shadow:0 0 0 3px #8B7BFF,0 0 12px rgba(139,123,255,0.4);}'
        + '.cc-agent-avatar.after{box-shadow:0 0 0 3px #3CA0FF,0 0 12px rgba(60,160,255,0.4);}'
        + '.cc-agent-avatar.offline{background:#2A2A35;color:#555;box-shadow:0 0 0 3px #444;}'
        + '.cc-agent-name{font-size:14px;color:#fff;font-weight:600;letter-spacing:.5px;}'
        + '.cc-agent-no{font-size:11px;color:#D4AF37;letter-spacing:1px;font-family:monospace;margin-top:2px;}'
        + '.cc-agent-status-line{margin:10px 0;display:flex;justify-content:center;align-items:center;gap:6px;}'
        + '.cc-agent-duration{font-size:10px;color:#666;font-family:monospace;letter-spacing:.5px;}'
        + '.cc-agent-meta{display:flex;justify-content:space-between;align-items:center;font-size:11px;color:#666;padding:8px 0;border-top:1px solid rgba(255,255,255,0.04);border-bottom:1px solid rgba(255,255,255,0.04);margin:8px 0;letter-spacing:.5px;}'
        + '.cc-agent-meta strong{color:#D4AF37;font-weight:600;font-family:monospace;font-size:13px;}'
        + '.cc-signal{display:inline-flex;gap:2px;align-items:flex-end;height:12px;}'
        + '.cc-signal-bar{width:3px;background:#00D084;border-radius:1px;}'
        + '.cc-signal-bar.dim{background:#333;}'
        + '.cc-agent-actions{display:flex;flex-wrap:wrap;gap:5px;justify-content:center;margin-top:8px;}'
        + '.cc-mini-btn{padding:5px 10px;font-size:11px;border:1px solid rgba(212,175,55,0.2);background:transparent;color:#A0A0B0;border-radius:5px;cursor:pointer;letter-spacing:.5px;transition:all .2s;font-family:inherit;}'
        + '.cc-mini-btn:hover{border-color:#D4AF37;color:#D4AF37;background:rgba(212,175,55,0.05);}'
        + '.cc-mini-btn.danger:hover{border-color:#FF4D4F;color:#FF4D4F;background:rgba(255,77,79,0.06);}'
        + '.cc-skill-table-prog{display:inline-block;width:60px;height:6px;background:#1F1F2A;border-radius:3px;overflow:hidden;vertical-align:middle;margin-left:6px;}'
        + '.cc-skill-table-prog-fill{height:100%;background:linear-gradient(90deg,#B8860B,#D4AF37);transition:width .4s;}'
        + '.cc-mon-num{font-family:monospace;color:#fff;font-weight:600;}'
        + '.cc-mon-num.gold{color:#D4AF37;}'
        + '.cc-mon-num.green{color:#00D084;}'
        + '.cc-mon-num.warn{color:#F59E0B;}'
        + '.cc-mon-num.danger{color:#FF4D4F;}'
        + '.cc-mon-empty{padding:50px 16px;text-align:center;color:#444;font-size:12px;letter-spacing:1.5px;text-transform:uppercase;}'
        ;
    document.head.appendChild(style);
})();

/* ========================================================================
   2. CCMonitor - 主对象
   ======================================================================== */
const CCMonitor = {
    currentView: 'dashboard',         // dashboard | agents
    refreshTimer: null,
    isFullscreen: false,
    autoRefresh: true,
    lastRefreshAt: Date.now(),
    _container: null,
    _eventBound: false,
    _clickHandler: null,
    _fsOriginalParent: null,
    _fsRestoreFn: null,

    // 模拟运行时数据（每次刷新更新）
    _runtime: {
        liveCalls: [],            // 实时通话列表
        queueTrend: [],           // 12个5分钟桶的排队数
        peakIndex: -1,
        statusDurations: {}       // agentId -> sinceTs
    },

    /* ---------- 生命周期 ---------- */
    render(container) {
        if (container) this._container = container;
        if (!this._container) return;

        this.initSeedData();
        this._ensureRuntime();
        this.lastRefreshAt = Date.now();

        const html = ''
            + '<div class="cc-module' + (this.isFullscreen ? ' cc-monitor-fullscreen' : '') + '" data-cc-monitor>'
            + this._renderHeader()
            + (this.currentView === 'agents' ? this.renderAgentMonitor() : this.renderDashboard())
            + '</div>';

        this._container.innerHTML = html;
        this._bindEvents();

        if (this.autoRefresh && !this.refreshTimer) {
            this.startAutoRefresh();
        }
    },

    destroy() {
        this.stopAutoRefresh();
        if (this.isFullscreen) this._exitFullscreen(true);
        if (this._clickHandler && this._container) {
            this._container.removeEventListener('click', this._clickHandler);
        }
        this._eventBound = false;
        this._clickHandler = null;
    },

    initSeedData() {
        // 不需要新种子；依赖已有 AgentStorage / SkillGroupStorage / CallRecordStorage
    },

    /* ---------- 数据访问（带 fallback） ---------- */
    _agents() {
        if (typeof window !== 'undefined' && window.AgentStorage) return window.AgentStorage.getAll();
        try {
            const raw = localStorage.getItem('cc_agents');
            return raw ? JSON.parse(raw).filter(a => !a.deleted) : [];
        } catch (e) { return []; }
    },

    _skillGroups() {
        if (typeof window !== 'undefined' && window.SkillGroupStorage) return window.SkillGroupStorage.getAll();
        try {
            const raw = localStorage.getItem('cc_skill_groups');
            return raw ? JSON.parse(raw).filter(g => !g.deleted) : [];
        } catch (e) { return []; }
    },

    _queues() {
        if (typeof window !== 'undefined' && window.QueueStorage) return window.QueueStorage.getAll();
        try {
            const raw = localStorage.getItem('cc_queues');
            return raw ? JSON.parse(raw).filter(q => !q.deleted) : [];
        } catch (e) { return []; }
    },

    _calls() {
        if (typeof window !== 'undefined' && window.CallRecordStorage) return window.CallRecordStorage.getAll();
        try {
            const raw = localStorage.getItem('cc_call_records');
            return raw ? JSON.parse(raw).filter(r => !r.deleted) : [];
        } catch (e) { return []; }
    },

    _esc(s) {
        if (typeof window !== 'undefined' && typeof window.ccEscapeHtml === 'function') return window.ccEscapeHtml(s);
        if (s == null) return '';
        return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
    },

    _fmtDuration(sec) {
        if (typeof window !== 'undefined' && typeof window.ccFormatDuration === 'function') return window.ccFormatDuration(sec);
        if (!sec || sec <= 0) return '0:00';
        const m = Math.floor(sec / 60), s = sec % 60;
        return m + ':' + (s < 10 ? '0' + s : s);
    },

    _toast(msg, type) {
        if (typeof window !== 'undefined' && typeof window.ccShowToast === 'function') {
            window.ccShowToast(msg, type);
        } else if (typeof console !== 'undefined') {
            console.log('[Toast] ' + msg);
        }
    },

    /* ---------- runtime 初始化 ---------- */
    _ensureRuntime() {
        const r = this._runtime;
        if (!r.queueTrend || r.queueTrend.length === 0) {
            r.queueTrend = [];
            for (let i = 0; i < 12; i++) {
                r.queueTrend.push(Math.floor(Math.random() * 6) + (i === 7 ? Math.floor(Math.random() * 4) : 0));
            }
        }
        if (!r.liveCalls || r.liveCalls.length === 0) {
            this._seedLiveCalls();
        }
        // 状态持续时间起点
        const agents = this._agents();
        agents.forEach(a => {
            if (!r.statusDurations[a.id]) {
                r.statusDurations[a.id] = Date.now() - Math.floor(Math.random() * 1800 * 1000);
            }
        });
    },

    _seedLiveCalls() {
        const agents = this._agents();
        const list = [];
        const now = Date.now();
        const len = Math.min(20, Math.max(8, agents.length * 2));
        const statuses = ['talking', 'talking', 'talking', 'ringing', 'ended', 'ended'];
        for (let i = 0; i < len; i++) {
            const a = agents[i % Math.max(agents.length, 1)] || { name: '系统', agent_no: '----' };
            const st = statuses[Math.floor(Math.random() * statuses.length)];
            list.push({
                id: 'live_' + i + '_' + now,
                ts: now - i * 60 * 1000 - Math.floor(Math.random() * 60000),
                caller: this._randPhone(),
                agent: a.name,
                agent_no: a.agent_no,
                status: st,
                duration: st === 'talking' ? 30 + Math.floor(Math.random() * 600)
                        : st === 'ringing' ? Math.floor(Math.random() * 20)
                        : 60 + Math.floor(Math.random() * 900)
            });
        }
        this._runtime.liveCalls = list;
    },

    _randPhone() {
        const segs = ['138', '139', '186', '188', '135', '152', '180', '199', '177'];
        const head = segs[Math.floor(Math.random() * segs.length)];
        let tail = '';
        for (let i = 0; i < 8; i++) tail += Math.floor(Math.random() * 10);
        return head + tail;
    },

    /* ====================================================================
       3. 顶部控制栏
       ==================================================================== */
    _renderHeader() {
        const dt = new Date(this.lastRefreshAt);
        const pad = (n) => (n < 10 ? '0' + n : '' + n);
        const t = pad(dt.getHours()) + ':' + pad(dt.getMinutes()) + ':' + pad(dt.getSeconds());

        let html = '<div class="cc-mon-header">';
        html += '<div style="display:flex;align-items:center;gap:18px;">';
        html += '<div style="display:flex;align-items:center;gap:10px;">';
        html += '<span class="cc-live-dot"></span>';
        html += '<div>';
        html += '<div style="font-size:14px;color:#fff;font-weight:600;letter-spacing:1px;">实时监控大屏</div>';
        html += '<div style="font-size:10px;color:#666;letter-spacing:2px;text-transform:uppercase;">LIVE OPS · CONTROL TOWER</div>';
        html += '</div>';
        html += '</div>';
        html += '<div class="cc-mon-subtabs">';
        html += '<button class="cc-mon-subtab' + (this.currentView === 'dashboard' ? ' active' : '') + '" data-cc-monaction="view-dashboard">话务大屏</button>';
        html += '<button class="cc-mon-subtab' + (this.currentView === 'agents' ? ' active' : '') + '" data-cc-monaction="view-agents">坐席监控</button>';
        html += '</div>';
        html += '</div>';

        html += '<div class="cc-mon-controls">';
        html += '<span class="cc-mon-refresh-time">最后刷新 · ' + t + '</span>';
        html += '<label class="cc-mon-switch' + (this.autoRefresh ? ' on' : '') + '" data-cc-monaction="toggle-auto">';
        html += '<span class="cc-mon-switch-track"></span>';
        html += '<span style="font-size:11px;letter-spacing:.5px;">自动刷新</span>';
        html += '</label>';
        html += '<button class="cc-mon-fs-btn" data-cc-monaction="toggle-fs">' + (this.isFullscreen ? '↙ 退出全屏' : '↗ 全屏') + '</button>';
        html += '</div>';
        html += '</div>';
        return html;
    },

    /* ====================================================================
       4. renderDashboard - 话务监控大屏
       ==================================================================== */
    renderDashboard() {
        const agents = this._agents();
        const calls = this._calls();
        const todayStart = new Date(); todayStart.setHours(0, 0, 0, 0);
        const todayCalls = calls.filter(c => (c.start_time || c.created_at || 0) >= todayStart.getTime());
        const inbound = todayCalls.filter(c => c.call_type === 1);
        const outbound = todayCalls.filter(c => c.call_type === 2);
        const inboundAns = inbound.filter(c => c.status === 1).length;
        const outboundAns = outbound.filter(c => c.status === 1).length;
        const inboundRate = inbound.length ? Math.round(inboundAns / inbound.length * 100) : 0;
        const outboundRate = outbound.length ? Math.round(outboundAns / outbound.length * 100) : 0;
        const totalDuration = todayCalls.reduce((s, c) => s + (c.duration || 0), 0);
        const avgDuration = todayCalls.length ? Math.round(totalDuration / todayCalls.length) : 0;

        const total = agents.length;
        const online = agents.filter(a => a.status !== 0).length;

        // ----- a) 顶部六大数字 -----
        let html = '<div class="cc-big-grid">';
        html += this._bigCard('INBOUND', '呼入总量', inbound.length || this._fakeNum(120, 240), '今日累计', '');
        html += this._bigCard('IN ANSWERED', '呼入接通', inboundAns || this._fakeNum(100, 220), '接通率 ' + (inbound.length ? inboundRate : this._fakeNum(80, 96)) + '%', inboundRate < 60 && inbound.length ? 'warn' : '');
        html += this._bigCard('OUTBOUND', '呼出总量', outbound.length || this._fakeNum(80, 180), '今日累计', '');
        html += this._bigCard('OUT ANSWERED', '呼出接通', outboundAns || this._fakeNum(60, 150), '接通率 ' + (outbound.length ? outboundRate : this._fakeNum(70, 90)) + '%', '');
        html += this._bigCardSplit('AGENTS', '在线坐席', online, total, '当前在岗 / 团队总数');
        html += this._bigCard('AVG DURATION', '平均通话', this._fmtDuration(avgDuration || 180), '今日均值', '');
        html += '</div>';

        // ----- b) 三栏布局：技能组表格 / 状态环形 / 告警面板 -----
        html += '<div class="cc-mon-grid-3">';
        html += this._renderSkillGroupTable();
        html += this._renderStatusDonut();
        html += this._renderAlertPanel();
        html += '</div>';

        // ----- c) 实时通话列表 + 队列趋势 -----
        html += '<div class="cc-mon-grid-2">';
        html += this._renderLiveCalls();
        html += this._renderQueueTrend();
        html += '</div>';

        return html;
    },

    _fakeNum(min, max) { return min + Math.floor(Math.random() * (max - min)); },

    _bigCard(tag, label, value, sub, subCls) {
        let html = '<div class="cc-big-card">';
        html += '<div class="cc-big-card-tag">' + tag + '</div>';
        html += '<div class="cc-big-number">' + this._esc(String(value)) + '</div>';
        html += '<div class="cc-big-label">' + this._esc(label) + '</div>';
        if (sub) html += '<div class="cc-big-sub' + (subCls ? ' ' + subCls : '') + '">' + this._esc(sub) + '</div>';
        html += '</div>';
        return html;
    },

    _bigCardSplit(tag, label, val, total, sub) {
        let html = '<div class="cc-big-card">';
        html += '<div class="cc-big-card-tag">' + tag + '</div>';
        html += '<div class="cc-big-number">' + val + '<span class="cc-big-number-suffix">/ ' + total + '</span></div>';
        html += '<div class="cc-big-label">' + this._esc(label) + '</div>';
        html += '<div class="cc-big-sub">' + this._esc(sub) + '</div>';
        html += '</div>';
        return html;
    },

    /* ----- 技能组状态表 ----- */
    _renderSkillGroupTable() {
        const groups = this._skillGroups();
        const agents = this._agents();
        const queues = this._queues();

        let html = '<div class="cc-panel">';
        html += '<div class="cc-panel-title"><span class="cc-panel-title-cn">⌬ 技能组实时状态</span><span style="color:#666;font-size:10px;letter-spacing:1.5px;">SKILL GROUPS</span></div>';

        if (groups.length === 0) {
            html += '<div class="cc-mon-empty">暂无技能组数据</div>';
            html += '</div>';
            return html;
        }

        html += '<div style="overflow-x:auto;"><table class="cc-mon-table"><thead><tr>';
        html += '<th>技能组</th><th>在线</th><th>通话</th><th>排队</th><th>就绪</th><th>等待</th>';
        html += '</tr></thead><tbody>';

        groups.forEach(g => {
            const ids = Array.isArray(g.agent_ids) ? g.agent_ids : [];
            const groupAgents = agents.filter(a => ids.indexOf(a.id) !== -1
                || (g.name && (a.skillgroup_ids || '').indexOf(g.name) !== -1));
            const onlineNum = groupAgents.filter(a => a.status !== 0).length;
            const talkingNum = groupAgents.filter(a => a.status === 2).length;
            const readyNum = groupAgents.filter(a => a.status === 1).length;
            const groupQueues = queues.filter(q => q.skillgroup_id === g.id || q.group_name === g.name);
            const queueNum = groupQueues.length || Math.floor(Math.random() * 4);
            const avgWait = groupQueues.length
                ? Math.round(groupQueues.reduce((s, q) => s + (q.wait_seconds || 0), 0) / groupQueues.length)
                : 8 + Math.floor(Math.random() * 30);
            const totalAgents = groupAgents.length || 1;
            const onlineRatio = Math.round(onlineNum / totalAgents * 100);

            html += '<tr>';
            html += '<td><div style="font-weight:600;color:#fff;">' + this._esc(g.name) + '</div>';
            html += '<div style="font-size:10px;color:#666;letter-spacing:.5px;margin-top:2px;">在线率 ' + onlineRatio + '%';
            html += '<span class="cc-skill-table-prog"><span class="cc-skill-table-prog-fill" style="width:' + onlineRatio + '%"></span></span></div></td>';
            html += '<td><span class="cc-mon-num green">' + onlineNum + '</span><span style="color:#444;"> / ' + totalAgents + '</span></td>';
            html += '<td><span class="cc-mon-num gold">' + talkingNum + '</span></td>';
            html += '<td><span class="cc-mon-num ' + (queueNum > 5 ? 'danger' : queueNum > 2 ? 'warn' : '') + '">' + queueNum + '</span></td>';
            html += '<td><span class="cc-mon-num green">' + readyNum + '</span></td>';
            html += '<td><span class="cc-mon-num">' + this._fmtDuration(avgWait) + '</span></td>';
            html += '</tr>';
        });

        html += '</tbody></table></div></div>';
        return html;
    },

    /* ----- 坐席状态环形图 ----- */
    _renderStatusDonut() {
        const agents = this._agents();
        const total = agents.length || 1;
        const buckets = [
            { key: 'talking', label: '通话中', color: '#D4AF37', count: agents.filter(a => a.status === 2).length },
            { key: 'ready',   label: '就绪',   color: '#00D084', count: agents.filter(a => a.status === 1).length },
            { key: 'break',   label: '小休',   color: '#8B7BFF', count: agents.filter(a => a.status === 3 || a.status === 5 || a.status === 6).length },
            { key: 'after',   label: '后处理', color: '#3CA0FF', count: agents.filter(a => a.status === 4).length },
            { key: 'offline', label: '离线',   color: '#555',    count: agents.filter(a => a.status === 0).length }
        ];

        // 构建 conic-gradient
        let acc = 0;
        const segs = [];
        buckets.forEach(b => {
            const start = acc;
            const pct = (b.count / total) * 100;
            const end = acc + pct;
            if (pct > 0) segs.push(b.color + ' ' + start.toFixed(2) + '% ' + end.toFixed(2) + '%');
            acc = end;
        });
        if (segs.length === 0) segs.push('#222 0% 100%');
        const gradient = 'conic-gradient(from 0deg,' + segs.join(',') + ')';

        let html = '<div class="cc-panel">';
        html += '<div class="cc-panel-title"><span class="cc-panel-title-cn">◉ 坐席状态分布</span><span style="color:#666;font-size:10px;letter-spacing:1.5px;">STATUS</span></div>';
        html += '<div class="cc-donut-wrap">';
        html += '<div class="cc-donut" style="background:' + gradient + ';">';
        html += '<div class="cc-donut-hole">';
        html += '<div class="cc-donut-total">' + total + '</div>';
        html += '<div class="cc-donut-label">TOTAL</div>';
        html += '</div></div>';
        html += '<div class="cc-donut-legend">';
        buckets.forEach(b => {
            const pct = total ? Math.round(b.count / total * 100) : 0;
            html += '<div class="cc-donut-leg-item">';
            html += '<span class="cc-donut-leg-dot" style="background:' + b.color + ';"></span>';
            html += '<span class="cc-donut-leg-name">' + b.label + '</span>';
            html += '<span class="cc-donut-leg-num">' + b.count + ' · ' + pct + '%</span>';
            html += '</div>';
        });
        html += '</div></div></div>';
        return html;
    },

    /* ----- 告警面板 ----- */
    _renderAlertPanel() {
        const agents = this._agents();
        const queues = this._queues();
        const total = agents.length;
        const ready = agents.filter(a => a.status === 1).length;
        const talking = agents.filter(a => a.status === 2).length;
        const online = agents.filter(a => a.status !== 0).length;
        const queueNum = queues.length || (this._runtime.queueTrend[this._runtime.queueTrend.length - 1] || 0);

        // 接通率
        const calls = this._calls();
        const todayStart = new Date(); todayStart.setHours(0, 0, 0, 0);
        const todayInbound = calls.filter(c => c.call_type === 1 && (c.start_time || c.created_at || 0) >= todayStart.getTime());
        const inboundAns = todayInbound.filter(c => c.status === 1).length;
        const inboundRate = todayInbound.length ? Math.round(inboundAns / todayInbound.length * 100) : 100;

        const alerts = [];
        const now = Date.now();

        if (queueNum > 5) {
            alerts.push({ type: 'danger', icon: '⚠', kind: '队列拥堵', text: '当前排队呼入 ' + queueNum + ' 路，已超过阈值（5）', ts: now - 60000 });
        }
        if (todayInbound.length > 5 && inboundRate < 60) {
            alerts.push({ type: 'danger', icon: '⛔', kind: '接通率告警', text: '今日呼入接通率 ' + inboundRate + '% 低于 60% 阈值', ts: now - 180000 });
        }
        if (total > 0 && online > 0 && ready === 0 && talking === online) {
            alerts.push({ type: 'danger', icon: '◉', kind: '坐席全忙', text: '所有在线坐席均处于通话中，无可用就绪坐席', ts: now - 30000 });
        }
        if (online > 0 && ready / Math.max(online, 1) < 0.3) {
            alerts.push({ type: 'warning', icon: '◐', kind: '就绪不足', text: '就绪坐席比例 ' + Math.round(ready / online * 100) + '%，建议调度增援', ts: now - 240000 });
        }
        if (queueNum > 2 && queueNum <= 5) {
            alerts.push({ type: 'warning', icon: '⌚', kind: '排队提醒', text: '当前排队 ' + queueNum + ' 路，请关注响应速度', ts: now - 90000 });
        }

        let html = '<div class="cc-panel">';
        html += '<div class="cc-panel-title"><span class="cc-panel-title-cn">✦ 实时告警</span><span style="color:#666;font-size:10px;letter-spacing:1.5px;">ALERTS · ' + alerts.length + '</span></div>';

        if (alerts.length === 0) {
            html += '<div style="padding:30px 16px;text-align:center;">';
            html += '<div style="font-size:32px;color:#00D084;margin-bottom:6px;">✓</div>';
            html += '<div style="font-size:12px;color:#A0A0B0;letter-spacing:1px;">系统运行正常</div>';
            html += '<div style="font-size:10px;color:#444;letter-spacing:2px;margin-top:4px;text-transform:uppercase;">ALL CLEAR</div>';
            html += '</div>';
        } else {
            html += '<div class="cc-alert-list">';
            alerts.forEach(a => {
                const tStr = this._fmtTimeAgo(a.ts);
                html += '<div class="cc-alert-item cc-alert-' + a.type + '">';
                html += '<span class="cc-alert-icon">' + a.icon + '</span>';
                html += '<div class="cc-alert-body">';
                html += '<div class="cc-alert-type">' + this._esc(a.kind) + '</div>';
                html += '<div class="cc-alert-text">' + this._esc(a.text) + '</div>';
                html += '</div>';
                html += '<span class="cc-alert-time">' + tStr + '</span>';
                html += '</div>';
            });
            html += '</div>';
        }

        html += '</div>';
        return html;
    },

    _fmtTimeAgo(ts) {
        const diff = Math.max(0, Date.now() - ts);
        const sec = Math.floor(diff / 1000);
        if (sec < 60) return sec + ' 秒前';
        if (sec < 3600) return Math.floor(sec / 60) + ' 分钟前';
        return Math.floor(sec / 3600) + ' 小时前';
    },

    /* ----- 实时通话列表 ----- */
    _renderLiveCalls() {
        const list = (this._runtime.liveCalls || []).slice(0, 20);
        let html = '<div class="cc-panel">';
        html += '<div class="cc-panel-title"><span class="cc-panel-title-cn"><span class="cc-live-dot"></span>实时通话</span>';
        html += '<span style="color:#666;font-size:10px;letter-spacing:1.5px;">LIVE FEED · ' + list.length + '</span></div>';

        if (list.length === 0) {
            html += '<div class="cc-mon-empty">暂无通话</div>';
            html += '</div>';
            return html;
        }

        html += '<div style="overflow-x:auto;max-height:380px;overflow-y:auto;">';
        html += '<table class="cc-mon-table"><thead><tr>';
        html += '<th>时间</th><th>主叫号码</th><th>坐席</th><th>状态</th><th style="text-align:right;">通话时长</th>';
        html += '</tr></thead><tbody>';

        list.forEach(c => {
            const dt = new Date(c.ts);
            const pad = (n) => (n < 10 ? '0' + n : '' + n);
            const tStr = pad(dt.getHours()) + ':' + pad(dt.getMinutes()) + ':' + pad(dt.getSeconds());
            let stTag = '', stCls = '';
            if (c.status === 'talking') { stTag = '通话中'; stCls = 'cc-tag-talking'; }
            else if (c.status === 'ringing') { stTag = '振铃'; stCls = 'cc-tag-ringing'; }
            else { stTag = '已结束'; stCls = 'cc-tag-offline'; }

            html += '<tr class="cc-live-row' + (c.status === 'talking' ? ' cc-row-talking' : '') + '">';
            html += '<td style="font-family:monospace;color:#A0A0B0;font-size:12px;">' + tStr + '</td>';
            html += '<td style="font-family:monospace;color:#fff;">' + this._esc(c.caller) + '</td>';
            html += '<td>' + this._esc(c.agent) + ' <span style="color:#666;font-size:11px;">· ' + this._esc(c.agent_no) + '</span></td>';
            html += '<td><span class="cc-tag-mini ' + stCls + '">' + stTag + '</span></td>';
            html += '<td style="text-align:right;font-family:monospace;color:#D4AF37;font-weight:600;">' + this._fmtDuration(c.duration) + '</td>';
            html += '</tr>';
        });

        html += '</tbody></table></div></div>';
        return html;
    },

    /* ----- 队列等待趋势（柱状图） ----- */
    _renderQueueTrend() {
        const trend = this._runtime.queueTrend || [];
        const max = Math.max.apply(null, trend.concat([1]));
        const peakIdx = trend.indexOf(max);

        let html = '<div class="cc-panel">';
        html += '<div class="cc-panel-title"><span class="cc-panel-title-cn">∎ 排队趋势 · 最近1小时</span>';
        html += '<span style="color:#666;font-size:10px;letter-spacing:1.5px;">QUEUE / 5MIN</span></div>';

        // 摘要
        const total = trend.reduce((s, n) => s + n, 0);
        const avg = trend.length ? (total / trend.length).toFixed(1) : '0';
        html += '<div style="display:flex;gap:18px;margin-bottom:8px;font-size:11px;color:#A0A0B0;letter-spacing:.5px;">';
        html += '<span>峰值：<strong style="color:#FF6B35;font-family:monospace;">' + max + '</strong></span>';
        html += '<span>均值：<strong style="color:#D4AF37;font-family:monospace;">' + avg + '</strong></span>';
        html += '<span>累计：<strong style="color:#fff;font-family:monospace;">' + total + '</strong></span>';
        html += '</div>';

        html += '<div class="cc-chart-bar-wrap">';
        const now = new Date();
        trend.forEach((v, i) => {
            const minsAgo = (trend.length - 1 - i) * 5;
            const t = new Date(now.getTime() - minsAgo * 60000);
            const pad = (n) => (n < 10 ? '0' + n : '' + n);
            const lbl = pad(t.getHours()) + ':' + pad(t.getMinutes());
            const h = max > 0 ? Math.max(6, Math.round(v / max * 100)) : 6;
            html += '<div class="cc-chart-bar' + (i === peakIdx && v > 0 ? ' peak' : '') + '" style="height:' + h + '%;">';
            html += '<span class="cc-chart-bar-value">' + v + '</span>';
            html += '<span class="cc-chart-bar-label">' + lbl + '</span>';
            html += '</div>';
        });
        html += '</div></div>';
        return html;
    },

    /* ====================================================================
       5. renderAgentMonitor - 坐席监控面板
       ==================================================================== */
    renderAgentMonitor() {
        const agents = this._agents();
        let html = '';

        // 上方汇总
        const total = agents.length;
        const talking = agents.filter(a => a.status === 2).length;
        const ready = agents.filter(a => a.status === 1).length;
        const breakNum = agents.filter(a => a.status === 3 || a.status === 5 || a.status === 6).length;
        const offline = agents.filter(a => a.status === 0).length;

        html += '<div class="cc-big-grid" style="grid-template-columns:repeat(5,1fr);">';
        html += this._bigCard('TOTAL', '坐席总数', total, '团队规模', '');
        html += this._bigCard('TALKING', '通话中', talking, talking > 0 ? '◉ 业务进行中' : '— 空闲', talking > 0 ? '' : '');
        html += this._bigCard('READY', '就绪', ready, '可立即接听', '');
        html += this._bigCard('BREAK', '小休/培训', breakNum, '暂离岗位', 'warn');
        html += this._bigCard('OFFLINE', '离线', offline, '未在岗', '');
        html += '</div>';

        if (agents.length === 0) {
            html += '<div class="cc-panel"><div class="cc-mon-empty">暂无坐席数据，请先在【坐席档案】添加坐席</div></div>';
            return html;
        }

        html += '<div class="cc-panel">';
        html += '<div class="cc-panel-title"><span class="cc-panel-title-cn">◇ 坐席状态卡片</span>';
        html += '<span style="color:#666;font-size:10px;letter-spacing:1.5px;">AGENTS · ' + agents.length + '</span></div>';
        html += '<div class="cc-agent-grid">';
        agents.forEach(a => { html += this._renderAgentCard(a); });
        html += '</div></div>';

        return html;
    },

    _renderAgentCard(a) {
        const initial = (a.name || '?').substr(0, 1).toUpperCase();
        const statusInfo = this._agentStatusInfo(a.status);
        const sinceTs = this._runtime.statusDurations[a.id] || Date.now();
        const durSec = Math.floor((Date.now() - sinceTs) / 1000);
        const signalStrength = a.status === 0 ? 0 : (1 + Math.floor(Math.random() * 3));

        let html = '<div class="cc-agent-card' + (a.status === 2 ? ' is-talking' : '') + '" data-agent-id="' + this._esc(a.id) + '">';
        html += '<div class="cc-agent-avatar ' + statusInfo.avatarCls + '">' + this._esc(initial) + '</div>';
        html += '<div class="cc-agent-name">' + this._esc(a.name) + '</div>';
        html += '<div class="cc-agent-no">' + this._esc(a.agent_no) + ' · ' + this._esc(a.extension || '----') + '</div>';

        html += '<div class="cc-agent-status-line">';
        html += '<span class="cc-tag-mini ' + statusInfo.tagCls + '">' + statusInfo.label + '</span>';
        html += '<span class="cc-agent-duration">' + this._fmtDuration(durSec) + '</span>';
        html += '</div>';

        html += '<div class="cc-agent-meta">';
        html += '<span>今日 <strong>' + (a.today_calls || 0) + '</strong></span>';
        html += '<span class="cc-signal" title="网络信号 ' + signalStrength + '/3">';
        for (let i = 1; i <= 3; i++) {
            const cls = i <= signalStrength ? '' : ' dim';
            html += '<span class="cc-signal-bar' + cls + '" style="height:' + (4 + i * 3) + 'px;"></span>';
        }
        html += '</span>';
        html += '</div>';

        // 操作按钮
        html += '<div class="cc-agent-actions">';
        if (a.status === 2) {
            html += '<button class="cc-mini-btn" data-cc-monaction="agent-listen" data-agent-id="' + this._esc(a.id) + '">监听</button>';
            html += '<button class="cc-mini-btn" data-cc-monaction="agent-barge" data-agent-id="' + this._esc(a.id) + '">强插</button>';
            html += '<button class="cc-mini-btn" data-cc-monaction="agent-whisper" data-agent-id="' + this._esc(a.id) + '">密语</button>';
        } else if (a.status === 1 || a.status === 3 || a.status === 5 || a.status === 6) {
            html += '<button class="cc-mini-btn danger" data-cc-monaction="agent-force-logout" data-agent-id="' + this._esc(a.id) + '">强制签出</button>';
            if (a.status !== 1) {
                html += '<button class="cc-mini-btn" data-cc-monaction="agent-force-ready" data-agent-id="' + this._esc(a.id) + '">强制就绪</button>';
            }
        } else if (a.status === 4) {
            html += '<button class="cc-mini-btn" data-cc-monaction="agent-force-ready" data-agent-id="' + this._esc(a.id) + '">强制就绪</button>';
        } else if (a.status === 0) {
            html += '<button class="cc-mini-btn" disabled style="opacity:.4;cursor:not-allowed;">坐席离线</button>';
        }
        html += '</div>';

        html += '</div>';
        return html;
    },

    _agentStatusInfo(s) {
        switch (s) {
            case 1: return { label: '就绪',   avatarCls: 'online',  tagCls: 'cc-tag-ready' };
            case 2: return { label: '通话中', avatarCls: 'busy',    tagCls: 'cc-tag-talking' };
            case 3: return { label: '小休',   avatarCls: 'break',   tagCls: 'cc-tag-break' };
            case 4: return { label: '后处理', avatarCls: 'after',   tagCls: 'cc-tag-after' };
            case 5: return { label: '培训',   avatarCls: 'break',   tagCls: 'cc-tag-break' };
            case 6: return { label: '会议',   avatarCls: 'break',   tagCls: 'cc-tag-break' };
            default: return { label: '离线',  avatarCls: 'offline', tagCls: 'cc-tag-offline' };
        }
    },

    /* ====================================================================
       6. 事件处理
       ==================================================================== */
    _bindEvents() {
        if (!this._container) return;
        if (this._clickHandler) {
            this._container.removeEventListener('click', this._clickHandler);
        }
        this._clickHandler = (e) => this.handleEvents(e);
        this._container.addEventListener('click', this._clickHandler);
        this._eventBound = true;
    },

    handleEvents(e) {
        const el = e.target.closest('[data-cc-monaction]');
        if (!el || !this._container.contains(el)) return;
        const action = el.dataset.ccMonaction;
        const agentId = el.dataset.agentId;

        switch (action) {
            case 'view-dashboard':
                if (this.currentView !== 'dashboard') {
                    this.currentView = 'dashboard';
                    this.render();
                }
                break;
            case 'view-agents':
                if (this.currentView !== 'agents') {
                    this.currentView = 'agents';
                    this.render();
                }
                break;
            case 'toggle-auto':
                e.preventDefault();
                this.autoRefresh = !this.autoRefresh;
                if (this.autoRefresh) {
                    this.startAutoRefresh();
                    this._toast('已开启自动刷新（5秒）', 'success');
                } else {
                    this.stopAutoRefresh();
                    this._toast('已关闭自动刷新', 'warning');
                }
                this.render();
                break;
            case 'toggle-fs':
                this._toggleFullscreen();
                break;
            case 'agent-listen':
                this._toast('监听操作已执行', 'success');
                break;
            case 'agent-barge':
                this._toast('强插操作已执行', 'success');
                break;
            case 'agent-whisper':
                this._toast('密语操作已执行', 'success');
                break;
            case 'agent-force-logout':
                this._forceLogout(agentId);
                break;
            case 'agent-force-ready':
                this._forceReady(agentId);
                break;
            default: break;
        }
    },

    _forceLogout(agentId) {
        if (!agentId) return;
        const a = this._getAgentById(agentId);
        if (!a) { this._toast('坐席不存在', 'error'); return; }
        if (!window.confirm('确认强制将坐席「' + a.name + '」签出？')) return;
        const fromStatus = a.status;
        if (typeof window !== 'undefined' && window.AgentStorage) {
            window.AgentStorage.update({ id: a.id, status: 0 });
        }
        if (typeof window !== 'undefined' && window.AgentStatusLogStorage) {
            window.AgentStatusLogStorage.add({
                agent_id: a.id,
                agent_no: a.agent_no,
                agent_name: a.name,
                from_status: fromStatus,
                to_status: 0,
                reason: '管理员强制签出',
                operator: 'monitor'
            });
        }
        this._runtime.statusDurations[a.id] = Date.now();
        this._toast('坐席「' + a.name + '」已强制签出', 'success');
        this.render();
    },

    _forceReady(agentId) {
        if (!agentId) return;
        const a = this._getAgentById(agentId);
        if (!a) { this._toast('坐席不存在', 'error'); return; }
        const fromStatus = a.status;
        if (typeof window !== 'undefined' && window.AgentStorage) {
            window.AgentStorage.update({ id: a.id, status: 1 });
        }
        if (typeof window !== 'undefined' && window.AgentStatusLogStorage) {
            window.AgentStatusLogStorage.add({
                agent_id: a.id,
                agent_no: a.agent_no,
                agent_name: a.name,
                from_status: fromStatus,
                to_status: 1,
                reason: '管理员强制就绪',
                operator: 'monitor'
            });
        }
        this._runtime.statusDurations[a.id] = Date.now();
        this._toast('坐席「' + a.name + '」已切换为就绪', 'success');
        this.render();
    },

    _getAgentById(id) {
        if (typeof window !== 'undefined' && window.AgentStorage) return window.AgentStorage.getById(id);
        return this._agents().find(a => a.id === id) || null;
    },

    /* ====================================================================
       7. 自动刷新 & 数据模拟
       ==================================================================== */
    startAutoRefresh() {
        this.stopAutoRefresh();
        this.refreshTimer = setInterval(() => {
            if (!this._container || !document.body.contains(this._container)) {
                this.stopAutoRefresh();
                return;
            }
            this.simulateDataChange();
            this.render();
        }, 5000);
    },

    stopAutoRefresh() {
        if (this.refreshTimer) {
            clearInterval(this.refreshTimer);
            this.refreshTimer = null;
        }
    },

    simulateDataChange() {
        // 1) 推进队列趋势：丢掉最旧一格，追加新值
        const trend = this._runtime.queueTrend;
        if (trend && trend.length > 0) {
            const last = trend[trend.length - 1];
            // 微小波动，偶尔出现峰值
            let next = last + Math.floor(Math.random() * 5) - 2;
            if (Math.random() < 0.08) next = Math.min(12, last + 4);
            next = Math.max(0, Math.min(15, next));
            trend.push(next);
            if (trend.length > 12) trend.shift();
        }

        // 2) 实时通话列表：递进时长 + 偶尔新增/转结束
        const live = this._runtime.liveCalls;
        if (live && live.length > 0) {
            live.forEach(c => {
                if (c.status === 'talking') c.duration += 5;
                else if (c.status === 'ringing') {
                    c.duration += 5;
                    if (c.duration > 15) { c.status = 'talking'; c.duration = 1; }
                }
            });

            // 随机将一通通话置为已结束
            if (Math.random() < 0.4) {
                const tIdx = live.findIndex(c => c.status === 'talking');
                if (tIdx > -1) live[tIdx].status = 'ended';
            }
            // 新增一通通话
            if (Math.random() < 0.7) {
                const agents = this._agents();
                const a = agents[Math.floor(Math.random() * Math.max(agents.length, 1))] || { name: '系统', agent_no: '----' };
                const isRinging = Math.random() < 0.3;
                live.unshift({
                    id: 'live_new_' + Date.now(),
                    ts: Date.now(),
                    caller: this._randPhone(),
                    agent: a.name,
                    agent_no: a.agent_no,
                    status: isRinging ? 'ringing' : 'talking',
                    duration: isRinging ? 0 : 5
                });
            }
            if (live.length > 30) live.length = 30;
        }

        // 3) 随机切换 1 个坐席状态（仅修改内存中的状态，不写日志，避免污染）
        const agents = this._agents();
        if (agents.length > 0 && Math.random() < 0.6) {
            const idx = Math.floor(Math.random() * agents.length);
            const a = agents[idx];
            const nextStatusPool = {
                0: [0, 0, 1],
                1: [1, 2, 1, 3, 1],
                2: [2, 2, 4, 1],
                3: [3, 1],
                4: [4, 1],
                5: [5, 1],
                6: [6, 1]
            };
            const pool = nextStatusPool[a.status] || [a.status];
            const ns = pool[Math.floor(Math.random() * pool.length)];
            if (ns !== a.status) {
                if (typeof window !== 'undefined' && window.AgentStorage) {
                    window.AgentStorage.update({ id: a.id, status: ns });
                }
                this._runtime.statusDurations[a.id] = Date.now();
            }
        }
    },

    /* ====================================================================
       8. 全屏模式
       ==================================================================== */
    _toggleFullscreen() {
        if (this.isFullscreen) this._exitFullscreen();
        else this._enterFullscreen();
    },

    _enterFullscreen() {
        if (!this._container) return;
        // 寻找 .cc-module 节点
        const module = this._container.querySelector('.cc-module') || this._container;
        // 隐藏侧栏 / 顶栏（项目通用容器选择器）
        const hidden = [];
        ['.sidebar', '#sidebar', '.app-sidebar', '.layout-sidebar',
         '.topbar', '#topbar', '.app-header', '.layout-header', '.main-header'].forEach(sel => {
            document.querySelectorAll(sel).forEach(el => {
                if (el && el.style && el.style.display !== 'none') {
                    hidden.push({ el: el, prev: el.style.display });
                    el.style.display = 'none';
                }
            });
        });
        // 把 module 移动到 body 末尾以避免父容器溢出限制
        this._fsOriginalParent = module.parentNode;
        this._fsOriginalNext = module.nextSibling;
        document.body.appendChild(module);
        this.isFullscreen = true;

        this._fsRestoreFn = () => {
            hidden.forEach(h => { h.el.style.display = h.prev || ''; });
            if (this._fsOriginalParent) {
                if (this._fsOriginalNext && this._fsOriginalNext.parentNode === this._fsOriginalParent) {
                    this._fsOriginalParent.insertBefore(module, this._fsOriginalNext);
                } else {
                    this._fsOriginalParent.appendChild(module);
                }
            }
            this._fsOriginalParent = null;
            this._fsOriginalNext = null;
        };

        this.render();
    },

    _exitFullscreen(silent) {
        if (this._fsRestoreFn) {
            try { this._fsRestoreFn(); } catch (e) {}
            this._fsRestoreFn = null;
        }
        this.isFullscreen = false;
        if (!silent) this.render();
    }
};

/* ========================================================================
   9. 暴露到全局
   ======================================================================== */
if (typeof window !== 'undefined') {
    window.CCMonitor = CCMonitor;
}
