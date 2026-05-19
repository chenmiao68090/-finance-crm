// 呼叫中心 - IVR语音导航设计器模块
// ========================================================================
// 功能：可视化IVR流程设计器
// 数据：localStorage 键 cc_ivr_flows
// 集成：作为 CCIvr 对象供 CallCenter 主模块在 Tab 切换时调用
// ========================================================================

/* ---------------- 1. 工具函数（避免全局污染冲突） ---------------- */
if (typeof window.ccGenerateId !== 'function') {
    window.ccGenerateId = function (prefix) {
        return (prefix || '') + Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
    };
}
if (typeof window.ccEscapeHtml !== 'function') {
    window.ccEscapeHtml = function (str) {
        if (str === null || str === undefined) return '';
        return String(str)
            .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
    };
}
if (typeof window.ccFormatDate !== 'function') {
    window.ccFormatDate = function (iso) {
        if (!iso) return '-';
        try {
            const d = new Date(iso);
            const pad = n => String(n).padStart(2, '0');
            return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate())
                + ' ' + pad(d.getHours()) + ':' + pad(d.getMinutes());
        } catch (e) { return iso; }
    };
}

/* ---------------- 2. 注入设计器专属样式 ---------------- */
(function injectIvrStyles() {
    if (document.getElementById('cc-ivr-styles')) return;
    const style = document.createElement('style');
    style.id = 'cc-ivr-styles';
    style.textContent = `
        .cc-ivr-toolbar { display: flex; gap: 12px; align-items: center; margin-bottom: 16px; flex-wrap: wrap; }
        .cc-ivr-toolbar .cc-form-input { width: 240px; }
        .cc-ivr-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 16px; }
        .cc-ivr-card { background: linear-gradient(160deg, #15151E 0%, #12121A 100%); border: 1px solid rgba(212,175,55,0.18); border-radius: 12px; padding: 18px; transition: all 0.25s ease; position: relative; overflow: hidden; }
        .cc-ivr-card::before { content: ''; position: absolute; top: 0; left: 0; right: 0; height: 2px; background: linear-gradient(90deg, transparent, rgba(212,175,55,0.6), transparent); }
        .cc-ivr-card:hover { border-color: rgba(212,175,55,0.5); transform: translateY(-2px); box-shadow: 0 8px 24px rgba(0,0,0,0.4), 0 0 20px rgba(212,175,55,0.1); }
        .cc-ivr-card-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 14px; }
        .cc-ivr-card-title { font-size: 15px; font-weight: 600; color: #FFF; margin: 0 0 4px; }
        .cc-ivr-card-meta { font-size: 11px; color: #888; }
        .cc-ivr-card-stats { display: grid; grid-template-columns: repeat(2, 1fr); gap: 8px; padding: 12px 0; border-top: 1px dashed rgba(212,175,55,0.12); border-bottom: 1px dashed rgba(212,175,55,0.12); margin-bottom: 12px; }
        .cc-ivr-stat { font-size: 11px; color: #999; }
        .cc-ivr-stat-num { font-size: 18px; color: #D4AF37; font-weight: 600; display: block; margin-bottom: 2px; }
        .cc-ivr-card-numbers { font-size: 11px; color: #BBB; margin-bottom: 12px; min-height: 18px; }
        .cc-ivr-card-actions { display: flex; gap: 6px; flex-wrap: wrap; }
        .cc-ivr-status-on { display: inline-block; padding: 2px 8px; border-radius: 10px; font-size: 10px; background: rgba(0,208,132,0.15); color: #00D084; border: 1px solid rgba(0,208,132,0.3); }
        .cc-ivr-status-off { display: inline-block; padding: 2px 8px; border-radius: 10px; font-size: 10px; background: rgba(255,77,79,0.15); color: #FF4D4F; border: 1px solid rgba(255,77,79,0.3); }
        .ivr-designer { display: flex; height: 640px; gap: 0; border: 1px solid rgba(212,175,55,0.18); border-radius: 12px; overflow: hidden; background: #0A0A0F; }
        .ivr-palette { width: 200px; background: #12121A; border-right: 1px solid rgba(212,175,55,0.15); padding: 14px; overflow-y: auto; }
        .ivr-palette-title { font-size: 12px; color: #D4AF37; font-weight: 600; margin: 0 0 12px; letter-spacing: 1px; text-transform: uppercase; }
        .ivr-palette-item { padding: 10px; margin-bottom: 8px; background: #1A1A24; border: 1px solid rgba(212,175,55,0.15); border-radius: 8px; cursor: grab; display: flex; align-items: center; gap: 8px; font-size: 12px; color: #FFF; transition: all 0.2s; user-select: none; }
        .ivr-palette-item:hover { border-color: rgba(212,175,55,0.45); background: #1E1E2A; transform: translateX(2px); }
        .ivr-palette-item:active { cursor: grabbing; }
        .ivr-palette-icon { width: 28px; height: 28px; border-radius: 6px; display: flex; align-items: center; justify-content: center; font-size: 14px; flex-shrink: 0; }
        .ivr-canvas-wrap { flex: 1; position: relative; overflow: hidden; }
        .ivr-canvas-toolbar { position: absolute; top: 12px; left: 12px; right: 12px; display: flex; justify-content: space-between; align-items: center; z-index: 100; pointer-events: none; }
        .ivr-canvas-toolbar > * { pointer-events: auto; }
        .ivr-canvas-info { background: rgba(18,18,26,0.85); backdrop-filter: blur(8px); border: 1px solid rgba(212,175,55,0.2); border-radius: 8px; padding: 6px 12px; font-size: 12px; color: #D4AF37; }
        .ivr-canvas { position: absolute; inset: 0; background: #0A0A0F; background-image: radial-gradient(circle, rgba(212,175,55,0.06) 1px, transparent 1px); background-size: 20px 20px; overflow: hidden; }
        .ivr-canvas.dragover { background-color: #0F0F18; box-shadow: inset 0 0 0 2px rgba(212,175,55,0.4); }
        .ivr-node { position: absolute; min-width: 130px; background: linear-gradient(160deg, #1E1E2A 0%, #1A1A24 100%); border: 2px solid rgba(212,175,55,0.3); border-radius: 10px; padding: 12px 10px 14px; cursor: move; text-align: center; transition: box-shadow 0.2s, border-color 0.2s; z-index: 10; user-select: none; }
        .ivr-node:hover { box-shadow: 0 0 18px rgba(212,175,55,0.25); }
        .ivr-node.selected { border-color: #D4AF37; box-shadow: 0 0 22px rgba(212,175,55,0.4); }
        .ivr-node.dragging { opacity: 0.85; cursor: grabbing; z-index: 50; }
        .ivr-node-icon { width: 36px; height: 36px; border-radius: 8px; display: flex; align-items: center; justify-content: center; margin: 0 auto 6px; font-size: 18px; color: #FFF; box-shadow: 0 2px 6px rgba(0,0,0,0.3); }
        .ivr-node-label { font-size: 12px; color: #FFF; font-weight: 500; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 130px; }
        .ivr-node-type-tag { font-size: 10px; color: #888; margin-top: 2px; }
        .ivr-node-port { position: absolute; width: 12px; height: 12px; background: #D4AF37; border: 2px solid #0A0A0F; border-radius: 50%; cursor: crosshair; z-index: 11; transition: transform 0.15s; }
        .ivr-node-port:hover { transform: scale(1.4); background: #F5D76E; }
        .ivr-node-port-in { top: -7px; left: 50%; transform: translateX(-50%); }
        .ivr-node-port-out { bottom: -7px; left: 50%; transform: translateX(-50%); }
        .ivr-node-delete { position: absolute; top: -8px; right: -8px; width: 18px; height: 18px; border-radius: 50%; background: #FF4D4F; color: #FFF; font-size: 12px; line-height: 16px; text-align: center; cursor: pointer; opacity: 0; transition: opacity 0.2s; border: 1px solid #0A0A0F; }
        .ivr-node:hover .ivr-node-delete, .ivr-node.selected .ivr-node-delete { opacity: 1; }
        .ivr-canvas-svg { position: absolute; inset: 0; pointer-events: none; z-index: 5; }
        .ivr-connection { stroke: rgba(212,175,55,0.55); stroke-width: 2; fill: none; transition: stroke 0.2s; }
        .ivr-connection-temp { stroke: #D4AF37; stroke-width: 2; stroke-dasharray: 6 4; fill: none; }
        .ivr-conn-label-bg { fill: #12121A; stroke: rgba(212,175,55,0.4); stroke-width: 1; }
        .ivr-conn-label { font-size: 10px; fill: #D4AF37; font-weight: 600; }
        .ivr-conn-delete { fill: rgba(255,77,79,0.8); cursor: pointer; pointer-events: auto; }
        .ivr-properties { width: 280px; background: #12121A; border-left: 1px solid rgba(212,175,55,0.15); padding: 16px; overflow-y: auto; }
        .ivr-props-title { font-size: 13px; color: #D4AF37; margin: 0 0 14px; font-weight: 600; letter-spacing: 1px; text-transform: uppercase; padding-bottom: 8px; border-bottom: 1px solid rgba(212,175,55,0.15); }
        .ivr-props-empty { color: #666; font-size: 12px; text-align: center; padding: 60px 12px; line-height: 1.7; }
        .ivr-props-empty-icon { font-size: 32px; margin-bottom: 8px; opacity: 0.4; }
        .ivr-prop-group { margin-bottom: 14px; }
        .ivr-prop-label { display: block; font-size: 11px; color: #999; margin-bottom: 5px; }
        .ivr-prop-input, .ivr-prop-textarea, .ivr-prop-select { width: 100%; padding: 8px 10px; background: #1A1A24; border: 1px solid rgba(212,175,55,0.2); border-radius: 6px; color: #FFF; font-size: 12px; font-family: inherit; box-sizing: border-box; }
        .ivr-prop-textarea { resize: vertical; min-height: 60px; }
        .ivr-prop-input:focus, .ivr-prop-textarea:focus, .ivr-prop-select:focus { outline: none; border-color: #D4AF37; }
        .ivr-prop-hint { font-size: 10px; color: #666; margin-top: 4px; line-height: 1.5; }
        .ivr-tpl-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
        .ivr-tpl-card { background: #1A1A24; border: 1px solid rgba(212,175,55,0.2); border-radius: 8px; padding: 14px; cursor: pointer; transition: all 0.2s; }
        .ivr-tpl-card:hover { border-color: #D4AF37; background: #1E1E2A; }
        .ivr-tpl-icon { font-size: 22px; margin-bottom: 8px; }
        .ivr-tpl-name { font-size: 13px; color: #FFF; font-weight: 600; margin-bottom: 4px; }
        .ivr-tpl-desc { font-size: 11px; color: #999; line-height: 1.5; }
    `;
    document.head.appendChild(style);
})();

/* ---------------- 3. 常量定义 ---------------- */
const CC_IVR_KEYS = { FLOWS: 'cc_ivr_flows' };

const IVR_NODE_TYPES = {
    START: { id: 'start', label: '开始', icon: '▶', color: '#00D084' },
    PLAY_VOICE: { id: 'play_voice', label: '播放语音', icon: '🔊', color: '#5B8DEF' },
    COLLECT_DTMF: { id: 'collect_dtmf', label: '按键收集', icon: '⌨', color: '#8B7BFF' },
    TIME_CHECK: { id: 'time_check', label: '时间判断', icon: '⏰', color: '#F59E0B' },
    TRANSFER_AGENT: { id: 'transfer_agent', label: '转接坐席', icon: '👤', color: '#D4AF37' },
    TRANSFER_QUEUE: { id: 'transfer_queue', label: '转接队列', icon: '👥', color: '#E11D48' },
    HANGUP: { id: 'hangup', label: '挂断', icon: '📵', color: '#FF4D4F' },
    VOICEMAIL: { id: 'voicemail', label: '语音留言', icon: '📝', color: '#6B7280' }
};

function getNodeTypeMeta(typeId) {
    for (const k in IVR_NODE_TYPES) if (IVR_NODE_TYPES[k].id === typeId) return IVR_NODE_TYPES[k];
    return { id: typeId, label: typeId, icon: '?', color: '#888' };
}

/* ---------------- 4. Storage ---------------- */
const IvrFlowStorage = {
    _read() {
        try { return JSON.parse(localStorage.getItem(CC_IVR_KEYS.FLOWS) || '[]'); }
        catch (e) { return []; }
    },
    _write(list) {
        localStorage.setItem(CC_IVR_KEYS.FLOWS, JSON.stringify(list));
    },
    getAll(includeDeleted) {
        const all = this._read();
        return includeDeleted ? all : all.filter(f => !f.deleted);
    },
    getById(id) {
        return this._read().find(f => f.id === id) || null;
    },
    add(flow) {
        const list = this._read();
        const now = new Date().toISOString();
        const record = Object.assign({
            id: window.ccGenerateId('ivr_'),
            name: '未命名流程',
            status: 1,
            bind_numbers: [],
            flow_config: { nodes: [], connections: [] },
            deleted: false,
            created_at: now,
            updated_at: now
        }, flow);
        list.push(record);
        this._write(list);
        return record;
    },
    update(id, updates) {
        const list = this._read();
        const idx = list.findIndex(f => f.id === id);
        if (idx < 0) return null;
        list[idx] = Object.assign({}, list[idx], updates, { updated_at: new Date().toISOString() });
        this._write(list);
        return list[idx];
    },
    delete(id) {
        const list = this._read();
        const idx = list.findIndex(f => f.id === id);
        if (idx < 0) return false;
        list[idx].deleted = true;
        list[idx].updated_at = new Date().toISOString();
        this._write(list);
        return true;
    },
    duplicate(id) {
        const src = this.getById(id);
        if (!src) return null;
        const copy = JSON.parse(JSON.stringify(src));
        copy.id = window.ccGenerateId('ivr_');
        copy.name = src.name + ' 副本';
        copy.bind_numbers = [];
        copy.created_at = copy.updated_at = new Date().toISOString();
        // 重新生成节点和连线ID避免冲突
        const idMap = {};
        (copy.flow_config.nodes || []).forEach(n => {
            const newId = window.ccGenerateId('node_');
            idMap[n.id] = newId; n.id = newId;
        });
        (copy.flow_config.connections || []).forEach(c => {
            c.id = window.ccGenerateId('conn_');
            if (idMap[c.from]) c.from = idMap[c.from];
            if (idMap[c.to]) c.to = idMap[c.to];
        });
        const list = this._read();
        list.push(copy);
        this._write(list);
        return copy;
    }
};

/* ---------------- 5. 模板定义 ---------------- */
const IVR_TEMPLATES = [
    {
        key: 'sales',
        name: '售前咨询',
        icon: '🛒',
        desc: '欢迎语 → 按键路由（销售/技术/人工）',
        build: () => buildTemplate_Sales()
    },
    {
        key: 'aftersale',
        name: '售后服务',
        icon: '🛠',
        desc: '欢迎语 → 按键路由（退换/维修/投诉/人工）',
        build: () => buildTemplate_Aftersale()
    },
    {
        key: 'survey',
        name: '满意度调查',
        icon: '⭐',
        desc: '调查提示 → 按键评分(1-5) → 感谢语 → 挂断',
        build: () => buildTemplate_Survey()
    },
    {
        key: '24h',
        name: '24小时服务',
        icon: '🌙',
        desc: '时间判断 → 工作时间转人工 / 非工作时间留言',
        build: () => buildTemplate_24h()
    }
];

function _mkNode(type, label, x, y, config) {
    return { id: window.ccGenerateId('node_'), type, label, x, y, config: config || {} };
}
function _mkConn(from, to, label) {
    return { id: window.ccGenerateId('conn_'), from, to, label: label || '' };
}

function buildTemplate_Sales() {
    const n1 = _mkNode('start', '开始', 320, 30);
    const n2 = _mkNode('play_voice', '欢迎语', 320, 140, { text: '欢迎致电客服中心，请根据语音提示选择服务', repeat: 1, timeout: 5 });
    const n3 = _mkNode('collect_dtmf', '按键选择', 320, 260, { timeout: 5, valid_keys: '123', max_retries: 3, prompt: '销售请按1，技术请按2，人工请按3' });
    const n4 = _mkNode('transfer_queue', '转销售队列', 100, 400, { skillgroup_id: 1, priority: 5 });
    const n5 = _mkNode('transfer_queue', '转技术队列', 320, 400, { skillgroup_id: 2, priority: 5 });
    const n6 = _mkNode('transfer_agent', '转人工坐席', 540, 400, { agent_id: '', strategy: 'auto' });
    return {
        nodes: [n1, n2, n3, n4, n5, n6],
        connections: [
            _mkConn(n1.id, n2.id), _mkConn(n2.id, n3.id),
            _mkConn(n3.id, n4.id, '按键1'),
            _mkConn(n3.id, n5.id, '按键2'),
            _mkConn(n3.id, n6.id, '按键3')
        ]
    };
}

function buildTemplate_Aftersale() {
    const n1 = _mkNode('start', '开始', 380, 30);
    const n2 = _mkNode('play_voice', '欢迎语', 380, 140, { text: '欢迎致电售后服务中心', repeat: 1, timeout: 5 });
    const n3 = _mkNode('collect_dtmf', '按键选择', 380, 260, { timeout: 5, valid_keys: '1234', max_retries: 3, prompt: '退换货按1，维修按2，投诉按3，人工按4' });
    const n4 = _mkNode('transfer_queue', '转退换货', 80, 400, { skillgroup_id: 3 });
    const n5 = _mkNode('transfer_queue', '转维修', 280, 400, { skillgroup_id: 4 });
    const n6 = _mkNode('transfer_queue', '转投诉', 480, 400, { skillgroup_id: 5 });
    const n7 = _mkNode('transfer_agent', '转人工', 680, 400, { strategy: 'auto' });
    return {
        nodes: [n1, n2, n3, n4, n5, n6, n7],
        connections: [
            _mkConn(n1.id, n2.id), _mkConn(n2.id, n3.id),
            _mkConn(n3.id, n4.id, '按键1'),
            _mkConn(n3.id, n5.id, '按键2'),
            _mkConn(n3.id, n6.id, '按键3'),
            _mkConn(n3.id, n7.id, '按键4')
        ]
    };
}

function buildTemplate_Survey() {
    const n1 = _mkNode('start', '开始', 300, 30);
    const n2 = _mkNode('play_voice', '调查提示', 300, 140, { text: '本次服务请您打分，1分最低5分最高', repeat: 1, timeout: 6 });
    const n3 = _mkNode('collect_dtmf', '评分按键', 300, 260, { timeout: 8, valid_keys: '12345', max_retries: 2, prompt: '请按1-5评分' });
    const n4 = _mkNode('play_voice', '感谢语', 300, 380, { text: '感谢您的反馈，再见', repeat: 1, timeout: 3 });
    const n5 = _mkNode('hangup', '挂断', 300, 500, { text: '' });
    return {
        nodes: [n1, n2, n3, n4, n5],
        connections: [
            _mkConn(n1.id, n2.id), _mkConn(n2.id, n3.id),
            _mkConn(n3.id, n4.id, '评分1-5'), _mkConn(n4.id, n5.id)
        ]
    };
}

function buildTemplate_24h() {
    const n1 = _mkNode('start', '开始', 320, 30);
    const n2 = _mkNode('time_check', '时间判断', 320, 140, { work_start: '09:00', work_end: '18:00', work_days: '1,2,3,4,5' });
    const n3 = _mkNode('transfer_agent', '工作时间转人工', 130, 280, { strategy: 'auto' });
    const n4 = _mkNode('play_voice', '非工作时间提示', 510, 280, { text: '当前为非工作时间，请留言', repeat: 1, timeout: 4 });
    const n5 = _mkNode('voicemail', '语音留言', 510, 400, { max_duration: 60, mailbox: 'default' });
    return {
        nodes: [n1, n2, n3, n4, n5],
        connections: [
            _mkConn(n1.id, n2.id),
            _mkConn(n2.id, n3.id, '工作时间'),
            _mkConn(n2.id, n4.id, '非工作时间'),
            _mkConn(n4.id, n5.id)
        ]
    };
}

/* ---------------- 6. 主对象 CCIvr ---------------- */
const CCIvr = {
    container: null,
    currentView: 'list',     // list | designer
    selectedFlowId: null,
    searchKeyword: '',
    eventHandlers: [],

    designerState: {
        nodes: [],
        connections: [],
        selectedNodeId: null,
        dragging: null,           // { nodeId, offsetX, offsetY }
        connecting: null,         // { fromNodeId, x, y }
        canvasOffset: { x: 0, y: 0 }
    },

    /* ----------- 入口 ----------- */
    render(container) {
        this.initSeedData();
        this.container = container || document.querySelector('.cc-content') || document.querySelector('.content-area');
        if (!this.container) return;
        this._unbindAll();
        if (this.currentView === 'designer' && this.selectedFlowId) {
            this.renderDesigner();
        } else {
            this.renderFlowList();
        }
        this._bindContainerEvents();
    },

    _bindContainerEvents() {
        const handler = (e) => this.handleEvents(e);
        const changeHandler = (e) => this.handleEvents(e);
        const inputHandler = (e) => this.handleEvents(e);
        this.container.addEventListener('click', handler);
        this.container.addEventListener('change', changeHandler);
        this.container.addEventListener('input', inputHandler);
        this.eventHandlers.push({ el: this.container, evt: 'click', fn: handler });
        this.eventHandlers.push({ el: this.container, evt: 'change', fn: changeHandler });
        this.eventHandlers.push({ el: this.container, evt: 'input', fn: inputHandler });
    },

    _unbindAll() {
        this.eventHandlers.forEach(h => { try { h.el.removeEventListener(h.evt, h.fn); } catch (e) { } });
        this.eventHandlers = [];
        // 清理可能挂在 document 上的拖拽 handler
        if (this._docMouseMove) document.removeEventListener('mousemove', this._docMouseMove);
        if (this._docMouseUp) document.removeEventListener('mouseup', this._docMouseUp);
        this._docMouseMove = null; this._docMouseUp = null;
    },

    destroy() { this._unbindAll(); },

    /* ----------- 流程列表 ----------- */
    renderFlowList() {
        const all = IvrFlowStorage.getAll();
        const kw = (this.searchKeyword || '').trim().toLowerCase();
        const list = kw ? all.filter(f => (f.name || '').toLowerCase().includes(kw)
            || (f.bind_numbers || []).some(n => String(n).toLowerCase().includes(kw))) : all;

        let html = '<div class="cc-ivr-page">';
        html += '<div class="cc-ivr-toolbar">';
        html += `<input class="cc-form-input" id="ccIvrSearch" placeholder="搜索流程名称/绑定号码" value="${window.ccEscapeHtml(this.searchKeyword)}" />`;
        html += '<button class="cc-btn cc-btn-primary" data-act="ivr-new">+ 新建流程</button>';
        html += '<button class="cc-btn cc-btn-outline" data-act="ivr-template">📦 从模板创建</button>';
        html += `<div style="margin-left:auto;font-size:12px;color:#888;">共 ${list.length} 个流程</div>`;
        html += '</div>';

        if (!list.length) {
            html += '<div class="cc-empty"><div class="cc-empty-icon">📞</div>'
                + '<div class="cc-empty-text">暂无IVR流程，点击"新建流程"或"从模板创建"开始</div></div>';
        } else {
            html += '<div class="cc-ivr-grid">';
            list.forEach(f => { html += this._renderFlowCard(f); });
            html += '</div>';
        }
        html += '</div>';
        this.container.innerHTML = html;
    },

    _renderFlowCard(f) {
        const nodeCount = (f.flow_config && f.flow_config.nodes || []).length;
        const numCount = (f.bind_numbers || []).length;
        const numText = (f.bind_numbers || []).slice(0, 2).join('、') + (numCount > 2 ? ` 等${numCount}个` : '') || '未绑定';
        const statusCls = f.status === 1 ? 'cc-ivr-status-on' : 'cc-ivr-status-off';
        const statusText = f.status === 1 ? '启用' : '禁用';
        const toggleText = f.status === 1 ? '禁用' : '启用';
        return `<div class="cc-ivr-card" data-flow-id="${f.id}">
            <div class="cc-ivr-card-header">
                <div>
                    <h3 class="cc-ivr-card-title">${window.ccEscapeHtml(f.name)}</h3>
                    <div class="cc-ivr-card-meta">更新于 ${window.ccFormatDate(f.updated_at)}</div>
                </div>
                <span class="${statusCls}">${statusText}</span>
            </div>
            <div class="cc-ivr-card-stats">
                <div class="cc-ivr-stat"><span class="cc-ivr-stat-num">${nodeCount}</span>节点数量</div>
                <div class="cc-ivr-stat"><span class="cc-ivr-stat-num">${numCount}</span>绑定号码</div>
            </div>
            <div class="cc-ivr-card-numbers">📱 ${window.ccEscapeHtml(numText)}</div>
            <div class="cc-ivr-card-actions">
                <button class="cc-btn cc-btn-primary cc-btn-sm" data-act="ivr-design" data-id="${f.id}">编辑流程</button>
                <button class="cc-btn cc-btn-outline cc-btn-sm" data-act="ivr-edit-info" data-id="${f.id}">基本信息</button>
                <button class="cc-btn cc-btn-outline cc-btn-sm" data-act="ivr-toggle" data-id="${f.id}">${toggleText}</button>
                <button class="cc-btn cc-btn-outline cc-btn-sm" data-act="ivr-copy" data-id="${f.id}">复制</button>
                <button class="cc-btn cc-btn-danger cc-btn-sm" data-act="ivr-del" data-id="${f.id}">删除</button>
            </div>
        </div>`;
    },

    /* ----------- 设计器 ----------- */
    renderDesigner() {
        const flow = IvrFlowStorage.getById(this.selectedFlowId);
        if (!flow) { this.currentView = 'list'; this.renderFlowList(); return; }

        // 加载到 designerState
        this.designerState.nodes = JSON.parse(JSON.stringify(flow.flow_config.nodes || []));
        this.designerState.connections = JSON.parse(JSON.stringify(flow.flow_config.connections || []));
        this.designerState.selectedNodeId = null;
        this.designerState.dragging = null;
        this.designerState.connecting = null;

        let html = '<div class="cc-ivr-designer-wrap">';
        html += '<div class="cc-ivr-toolbar">';
        html += `<button class="cc-btn cc-btn-outline" data-act="ivr-back">← 返回列表</button>`;
        html += `<div style="font-size:15px;color:#D4AF37;font-weight:600;">🎯 ${window.ccEscapeHtml(flow.name)}</div>`;
        html += `<div style="font-size:11px;color:#888;">流程ID：${flow.id}</div>`;
        html += `<div style="margin-left:auto;display:flex;gap:8px;">`;
        html += `<button class="cc-btn cc-btn-outline" data-act="ivr-add-start">+ 开始节点</button>`;
        html += `<button class="cc-btn cc-btn-outline" data-act="ivr-clear">清空画布</button>`;
        html += `<button class="cc-btn cc-btn-primary" data-act="ivr-save">💾 保存流程</button>`;
        html += `</div>`;
        html += '</div>';

        html += '<div class="ivr-designer">';
        // 左侧节点面板
        html += '<div class="ivr-palette">';
        html += '<h4 class="ivr-palette-title">节点面板</h4>';
        html += '<div style="font-size:10px;color:#666;margin-bottom:10px;line-height:1.5;">点击节点添加到画布，或拖拽到指定位置</div>';
        Object.values(IVR_NODE_TYPES).forEach(t => {
            html += `<div class="ivr-palette-item" data-act="ivr-add-node" data-node-type="${t.id}" draggable="true">
                <div class="ivr-palette-icon" style="background:${t.color};">${t.icon}</div>
                <span>${t.label}</span>
            </div>`;
        });
        html += '<div style="margin-top:18px;padding-top:12px;border-top:1px dashed rgba(212,175,55,0.15);font-size:10px;color:#666;line-height:1.7;">'
            + '💡 操作提示：<br>• 拖拽节点到画布<br>• 点击节点端口连线<br>• Delete键删除选中节点<br>• 双击连线删除</div>';
        html += '</div>';

        // 中间画布
        html += '<div class="ivr-canvas-wrap">';
        html += `<div class="ivr-canvas" id="ccIvrCanvas">`;
        html += this._renderCanvasNodes();
        html += this._renderCanvasSvg();
        html += '</div>';
        html += '</div>';

        // 右侧属性面板
        html += '<div class="ivr-properties" id="ccIvrProps">';
        html += this._renderPropertiesPanel();
        html += '</div>';

        html += '</div>'; // ivr-designer
        html += '</div>'; // wrap
        this.container.innerHTML = html;

        // 启用画布拖放和键盘事件
        this._bindDesignerHandlers();
    },

    _renderCanvasNodes() {
        const sel = this.designerState.selectedNodeId;
        return this.designerState.nodes.map(n => {
            const meta = getNodeTypeMeta(n.type);
            const selCls = (n.id === sel) ? ' selected' : '';
            const isStart = n.type === 'start';
            const isEnd = (n.type === 'hangup' || n.type === 'voicemail');
            const inPort = isStart ? '' : `<div class="ivr-node-port ivr-node-port-in" data-port="in" data-node-id="${n.id}"></div>`;
            const outPort = isEnd ? '' : `<div class="ivr-node-port ivr-node-port-out" data-port="out" data-node-id="${n.id}"></div>`;
            return `<div class="ivr-node${selCls}" data-node-id="${n.id}" style="left:${n.x}px;top:${n.y}px;">
                ${inPort}
                <div class="ivr-node-icon" style="background:${meta.color};">${meta.icon}</div>
                <div class="ivr-node-label">${window.ccEscapeHtml(n.label || meta.label)}</div>
                <div class="ivr-node-type-tag">${meta.label}</div>
                ${outPort}
                <div class="ivr-node-delete" data-act="ivr-delete-node" data-node-id="${n.id}" title="删除节点">×</div>
            </div>`;
        }).join('');
    },

    _renderCanvasSvg() {
        const conns = this.designerState.connections;
        const nodes = this.designerState.nodes;
        let svg = `<svg class="ivr-canvas-svg" id="ccIvrSvg" xmlns="http://www.w3.org/2000/svg"><defs>`
            + `<marker id="ivrArrow" markerWidth="10" markerHeight="10" refX="9" refY="3" orient="auto" markerUnits="strokeWidth">`
            + `<path d="M0,0 L0,6 L9,3 z" fill="rgba(212,175,55,0.7)" /></marker>`
            + `</defs>`;
        conns.forEach(c => {
            const from = nodes.find(n => n.id === c.from);
            const to = nodes.find(n => n.id === c.to);
            if (!from || !to) return;
            const x1 = from.x + 65, y1 = from.y + 90;
            const x2 = to.x + 65, y2 = to.y - 4;
            const cx1 = x1, cy1 = y1 + Math.max(40, (y2 - y1) / 2);
            const cx2 = x2, cy2 = y2 - Math.max(40, (y2 - y1) / 2);
            const d = `M ${x1},${y1} C ${cx1},${cy1} ${cx2},${cy2} ${x2},${y2}`;
            svg += `<path class="ivr-connection" d="${d}" marker-end="url(#ivrArrow)" data-conn-id="${c.id}" style="pointer-events:auto;cursor:pointer;" />`;
            if (c.label) {
                const mx = (x1 + x2) / 2, my = (y1 + y2) / 2;
                const w = Math.max(40, c.label.length * 9);
                svg += `<rect class="ivr-conn-label-bg" x="${mx - w / 2}" y="${my - 9}" width="${w}" height="18" rx="4" />`;
                svg += `<text class="ivr-conn-label" x="${mx}" y="${my + 4}" text-anchor="middle">${window.ccEscapeHtml(c.label)}</text>`;
            }
            // 删除连线小按钮
            const dx = (x1 + x2) / 2 + (c.label ? Math.max(40, c.label.length * 9) / 2 + 10 : 0);
            const dy = (y1 + y2) / 2;
            svg += `<circle class="ivr-conn-delete" cx="${dx}" cy="${dy}" r="6" data-act="ivr-delete-conn" data-conn-id="${c.id}" />`;
            svg += `<text x="${dx}" y="${dy + 3}" text-anchor="middle" font-size="10" fill="#fff" pointer-events="none">×</text>`;
        });
        // 临时连线
        if (this.designerState.connecting) {
            const c = this.designerState.connecting;
            const from = nodes.find(n => n.id === c.fromNodeId);
            if (from) {
                const x1 = from.x + 65, y1 = from.y + 90;
                svg += `<path class="ivr-connection-temp" d="M ${x1},${y1} L ${c.x},${c.y}" />`;
            }
        }
        svg += `</svg>`;
        return svg;
    },

    _renderPropertiesPanel() {
        const sel = this.designerState.selectedNodeId;
        if (!sel) {
            return `<div class="ivr-props-empty">
                <div class="ivr-props-empty-icon">⚙</div>
                选择一个节点<br>查看和编辑其参数
            </div>`;
        }
        const node = this.designerState.nodes.find(n => n.id === sel);
        if (!node) return '<div class="ivr-props-empty">节点不存在</div>';
        const meta = getNodeTypeMeta(node.type);
        let html = `<h4 class="ivr-props-title">${meta.icon} ${meta.label} 配置</h4>`;
        html += `<div class="ivr-prop-group"><label class="ivr-prop-label">节点名称</label>`
            + `<input class="ivr-prop-input" data-prop="label" value="${window.ccEscapeHtml(node.label || '')}" placeholder="${meta.label}"/></div>`;

        const cfg = node.config || {};
        switch (node.type) {
            case 'start':
                html += `<div class="ivr-prop-hint">流程入口节点，无需额外配置。请确保只有一个开始节点。</div>`;
                break;
            case 'play_voice':
                html += `<div class="ivr-prop-group"><label class="ivr-prop-label">语音文本（TTS）</label>`
                    + `<textarea class="ivr-prop-textarea" data-prop="config.text" placeholder="请输入需要朗读的文字...">${window.ccEscapeHtml(cfg.text || '')}</textarea></div>`;
                html += `<div class="ivr-prop-group"><label class="ivr-prop-label">播放次数</label>`
                    + `<input class="ivr-prop-input" type="number" min="1" max="10" data-prop="config.repeat" value="${cfg.repeat || 1}"/></div>`;
                html += `<div class="ivr-prop-group"><label class="ivr-prop-label">超时秒数</label>`
                    + `<input class="ivr-prop-input" type="number" min="1" max="60" data-prop="config.timeout" value="${cfg.timeout || 5}"/></div>`;
                break;
            case 'collect_dtmf':
                html += `<div class="ivr-prop-group"><label class="ivr-prop-label">提示语</label>`
                    + `<textarea class="ivr-prop-textarea" data-prop="config.prompt">${window.ccEscapeHtml(cfg.prompt || '')}</textarea></div>`;
                html += `<div class="ivr-prop-group"><label class="ivr-prop-label">等待时长（秒）</label>`
                    + `<input class="ivr-prop-input" type="number" min="1" max="60" data-prop="config.timeout" value="${cfg.timeout || 5}"/></div>`;
                html += `<div class="ivr-prop-group"><label class="ivr-prop-label">有效按键范围</label>`
                    + `<input class="ivr-prop-input" data-prop="config.valid_keys" value="${window.ccEscapeHtml(cfg.valid_keys || '0123456789')}" placeholder="如: 123 表示按键1/2/3有效"/>`
                    + `<div class="ivr-prop-hint">输入允许的按键字符，可包含 0-9、*、#</div></div>`;
                html += `<div class="ivr-prop-group"><label class="ivr-prop-label">最大重试次数</label>`
                    + `<input class="ivr-prop-input" type="number" min="0" max="5" data-prop="config.max_retries" value="${cfg.max_retries || 3}"/></div>`;
                html += `<div class="ivr-prop-hint">提示：从此节点拉出多条连线，连线标签设为"按键1"、"按键2"等以区分路由分支</div>`;
                break;
            case 'time_check':
                html += `<div class="ivr-prop-group"><label class="ivr-prop-label">工作开始时间</label>`
                    + `<input class="ivr-prop-input" type="time" data-prop="config.work_start" value="${cfg.work_start || '09:00'}"/></div>`;
                html += `<div class="ivr-prop-group"><label class="ivr-prop-label">工作结束时间</label>`
                    + `<input class="ivr-prop-input" type="time" data-prop="config.work_end" value="${cfg.work_end || '18:00'}"/></div>`;
                html += `<div class="ivr-prop-group"><label class="ivr-prop-label">工作日（1=周一）</label>`
                    + `<input class="ivr-prop-input" data-prop="config.work_days" value="${window.ccEscapeHtml(cfg.work_days || '1,2,3,4,5')}" placeholder="如: 1,2,3,4,5"/></div>`;
                html += `<div class="ivr-prop-group"><label class="ivr-prop-label">节假日配置</label>`
                    + `<textarea class="ivr-prop-textarea" data-prop="config.holidays" placeholder="2024-10-01,2024-10-02">${window.ccEscapeHtml(cfg.holidays || '')}</textarea></div>`;
                html += `<div class="ivr-prop-hint">从此节点拉出连线，标签设为"工作时间"、"非工作时间"区分分支</div>`;
                break;
            case 'transfer_agent':
                html += `<div class="ivr-prop-group"><label class="ivr-prop-label">分配策略</label>`
                    + `<select class="ivr-prop-select" data-prop="config.strategy">`
                    + `<option value="auto" ${cfg.strategy === 'auto' ? 'selected' : ''}>自动分配</option>`
                    + `<option value="specified" ${cfg.strategy === 'specified' ? 'selected' : ''}>指定坐席</option>`
                    + `<option value="recent" ${cfg.strategy === 'recent' ? 'selected' : ''}>最近接听</option>`
                    + `</select></div>`;
                html += `<div class="ivr-prop-group"><label class="ivr-prop-label">指定坐席ID（可选）</label>`
                    + `<input class="ivr-prop-input" data-prop="config.agent_id" value="${window.ccEscapeHtml(cfg.agent_id || '')}" placeholder="为空表示自动分配"/></div>`;
                html += `<div class="ivr-prop-group"><label class="ivr-prop-label">超时时长（秒）</label>`
                    + `<input class="ivr-prop-input" type="number" min="5" max="120" data-prop="config.timeout" value="${cfg.timeout || 30}"/></div>`;
                break;
            case 'transfer_queue':
                html += `<div class="ivr-prop-group"><label class="ivr-prop-label">技能组ID</label>`
                    + `<input class="ivr-prop-input" type="number" data-prop="config.skillgroup_id" value="${cfg.skillgroup_id || ''}" placeholder="如：1"/></div>`;
                html += `<div class="ivr-prop-group"><label class="ivr-prop-label">优先级（1-10）</label>`
                    + `<input class="ivr-prop-input" type="number" min="1" max="10" data-prop="config.priority" value="${cfg.priority || 5}"/></div>`;
                html += `<div class="ivr-prop-group"><label class="ivr-prop-label">排队等待提示语</label>`
                    + `<textarea class="ivr-prop-textarea" data-prop="config.queue_prompt">${window.ccEscapeHtml(cfg.queue_prompt || '')}</textarea></div>`;
                break;
            case 'hangup':
                html += `<div class="ivr-prop-group"><label class="ivr-prop-label">挂断前提示语</label>`
                    + `<textarea class="ivr-prop-textarea" data-prop="config.text" placeholder="可选，挂断前的告别语">${window.ccEscapeHtml(cfg.text || '')}</textarea></div>`;
                html += `<div class="ivr-prop-hint">该节点为流程终点，无需配置出口连线</div>`;
                break;
            case 'voicemail':
                html += `<div class="ivr-prop-group"><label class="ivr-prop-label">最长录音时长（秒）</label>`
                    + `<input class="ivr-prop-input" type="number" min="10" max="600" data-prop="config.max_duration" value="${cfg.max_duration || 60}"/></div>`;
                html += `<div class="ivr-prop-group"><label class="ivr-prop-label">信箱标识</label>`
                    + `<input class="ivr-prop-input" data-prop="config.mailbox" value="${window.ccEscapeHtml(cfg.mailbox || 'default')}" placeholder="default"/></div>`;
                html += `<div class="ivr-prop-group"><label class="ivr-prop-label">提示语</label>`
                    + `<textarea class="ivr-prop-textarea" data-prop="config.prompt">${window.ccEscapeHtml(cfg.prompt || '请在嘀声后留言，按#结束')}</textarea></div>`;
                break;
        }

        // 连线管理
        const outConns = this.designerState.connections.filter(c => c.from === sel);
        if (outConns.length) {
            html += `<h4 class="ivr-props-title" style="margin-top:18px;">出口连线</h4>`;
            outConns.forEach(c => {
                const target = this.designerState.nodes.find(n => n.id === c.to);
                html += `<div class="ivr-prop-group" style="background:#1A1A24;padding:8px;border-radius:6px;border:1px solid rgba(212,175,55,0.1);">
                    <div style="font-size:11px;color:#999;margin-bottom:4px;">→ ${target ? window.ccEscapeHtml(target.label) : '未知'}</div>
                    <input class="ivr-prop-input" data-conn-label="${c.id}" value="${window.ccEscapeHtml(c.label || '')}" placeholder="连线条件标签（可选）"/>
                </div>`;
            });
        }

        html += `<div style="margin-top:18px;display:flex;gap:8px;">`
            + `<button class="cc-btn cc-btn-danger cc-btn-sm" data-act="ivr-delete-node" data-node-id="${sel}" style="flex:1;">删除节点</button>`
            + `</div>`;
        return html;
    },

    /* ----------- 设计器交互绑定 ----------- */
    _bindDesignerHandlers() {
        const canvas = document.getElementById('ccIvrCanvas');
        if (!canvas) return;

        // 画布上的鼠标按下：开始拖动节点 / 开始连线
        const onMouseDown = (e) => {
            const port = e.target.closest('.ivr-node-port');
            const node = e.target.closest('.ivr-node');
            const deleteBtn = e.target.closest('.ivr-node-delete');
            if (deleteBtn) return; // 让 click 处理
            // 出口端口：开始连线
            if (port && port.dataset.port === 'out') {
                const nodeId = port.dataset.nodeId;
                const rect = canvas.getBoundingClientRect();
                this.designerState.connecting = { fromNodeId: nodeId, x: e.clientX - rect.left, y: e.clientY - rect.top };
                e.preventDefault();
                return;
            }
            // 入口端口（仅在连线状态下生效）
            if (port && port.dataset.port === 'in' && this.designerState.connecting) {
                const fromId = this.designerState.connecting.fromNodeId;
                const toId = port.dataset.nodeId;
                if (fromId && toId && fromId !== toId) {
                    // 避免重复连线
                    if (!this.designerState.connections.some(c => c.from === fromId && c.to === toId)) {
                        this.designerState.connections.push({ id: window.ccGenerateId('conn_'), from: fromId, to: toId, label: '' });
                    }
                }
                this.designerState.connecting = null;
                this._updateCanvas();
                return;
            }
            // 节点：开始拖动
            if (node) {
                const nodeId = node.dataset.nodeId;
                this.designerState.selectedNodeId = nodeId;
                const n = this.designerState.nodes.find(x => x.id === nodeId);
                if (!n) return;
                const rect = canvas.getBoundingClientRect();
                this.designerState.dragging = {
                    nodeId,
                    offsetX: e.clientX - rect.left - n.x,
                    offsetY: e.clientY - rect.top - n.y
                };
                node.classList.add('dragging');
                this._refreshSelection();
                e.preventDefault();
                return;
            }
            // 点击空白：取消选择
            if (e.target === canvas || e.target.classList.contains('ivr-canvas')) {
                this.designerState.selectedNodeId = null;
                this.designerState.connecting = null;
                this._refreshSelection();
                this._updateCanvas();
            }
        };
        canvas.addEventListener('mousedown', onMouseDown);
        this.eventHandlers.push({ el: canvas, evt: 'mousedown', fn: onMouseDown });

        // 全局 mousemove / mouseup（支持拖出画布也能继续）
        const onMouseMove = (e) => {
            const rect = canvas.getBoundingClientRect();
            const mx = e.clientX - rect.left;
            const my = e.clientY - rect.top;
            if (this.designerState.dragging) {
                const d = this.designerState.dragging;
                const n = this.designerState.nodes.find(x => x.id === d.nodeId);
                if (!n) return;
                n.x = Math.max(0, mx - d.offsetX);
                n.y = Math.max(0, my - d.offsetY);
                const el = canvas.querySelector(`.ivr-node[data-node-id="${d.nodeId}"]`);
                if (el) { el.style.left = n.x + 'px'; el.style.top = n.y + 'px'; }
                this._updateSvg();
            } else if (this.designerState.connecting) {
                this.designerState.connecting.x = mx;
                this.designerState.connecting.y = my;
                this._updateSvg();
            }
        };
        const onMouseUp = (e) => {
            if (this.designerState.dragging) {
                const el = canvas.querySelector(`.ivr-node[data-node-id="${this.designerState.dragging.nodeId}"]`);
                if (el) el.classList.remove('dragging');
                this.designerState.dragging = null;
            }
            // 如果是连线但松开在端口外，取消连线
            if (this.designerState.connecting) {
                const el = document.elementFromPoint(e.clientX, e.clientY);
                const port = el && el.closest && el.closest('.ivr-node-port');
                if (!port || port.dataset.port !== 'in') {
                    this.designerState.connecting = null;
                    this._updateSvg();
                }
            }
        };
        document.addEventListener('mousemove', onMouseMove);
        document.addEventListener('mouseup', onMouseUp);
        this._docMouseMove = onMouseMove;
        this._docMouseUp = onMouseUp;

        // HTML5 拖放：左侧节点面板 → 画布
        const onDragOver = (e) => { e.preventDefault(); canvas.classList.add('dragover'); };
        const onDragLeave = (e) => { canvas.classList.remove('dragover'); };
        const onDrop = (e) => {
            e.preventDefault();
            canvas.classList.remove('dragover');
            const typeId = e.dataTransfer.getData('text/ivr-node-type');
            if (!typeId) return;
            const rect = canvas.getBoundingClientRect();
            const x = Math.max(0, e.clientX - rect.left - 65);
            const y = Math.max(0, e.clientY - rect.top - 30);
            this._addNode(typeId, x, y);
        };
        canvas.addEventListener('dragover', onDragOver);
        canvas.addEventListener('dragleave', onDragLeave);
        canvas.addEventListener('drop', onDrop);
        this.eventHandlers.push({ el: canvas, evt: 'dragover', fn: onDragOver });
        this.eventHandlers.push({ el: canvas, evt: 'dragleave', fn: onDragLeave });
        this.eventHandlers.push({ el: canvas, evt: 'drop', fn: onDrop });

        // 调色板 dragstart
        document.querySelectorAll('.ivr-palette-item').forEach(el => {
            const onDragStart = (e) => {
                e.dataTransfer.setData('text/ivr-node-type', el.dataset.nodeType);
                e.dataTransfer.effectAllowed = 'copy';
            };
            el.addEventListener('dragstart', onDragStart);
            this.eventHandlers.push({ el, evt: 'dragstart', fn: onDragStart });
        });

        // 键盘：Delete 删除选中节点
        const onKeyDown = (e) => {
            if ((e.key === 'Delete' || e.key === 'Backspace')
                && this.designerState.selectedNodeId
                && document.activeElement.tagName !== 'INPUT'
                && document.activeElement.tagName !== 'TEXTAREA') {
                this._deleteNode(this.designerState.selectedNodeId);
                e.preventDefault();
            } else if (e.key === 'Escape') {
                this.designerState.connecting = null;
                this.designerState.selectedNodeId = null;
                this._refreshSelection();
                this._updateSvg();
            }
        };
        document.addEventListener('keydown', onKeyDown);
        this.eventHandlers.push({ el: document, evt: 'keydown', fn: onKeyDown });

        // 双击连线删除
        const svg = document.getElementById('ccIvrSvg');
        if (svg) {
            const onDblClick = (e) => {
                const path = e.target.closest('.ivr-connection');
                if (path) {
                    const cid = path.dataset.connId;
                    this.designerState.connections = this.designerState.connections.filter(c => c.id !== cid);
                    this._updateSvg();
                }
            };
            svg.addEventListener('dblclick', onDblClick);
            this.eventHandlers.push({ el: svg, evt: 'dblclick', fn: onDblClick });
        }
    },

    _refreshSelection() {
        const canvas = document.getElementById('ccIvrCanvas');
        if (!canvas) return;
        canvas.querySelectorAll('.ivr-node').forEach(el => {
            if (el.dataset.nodeId === this.designerState.selectedNodeId) el.classList.add('selected');
            else el.classList.remove('selected');
        });
        const props = document.getElementById('ccIvrProps');
        if (props) props.innerHTML = this._renderPropertiesPanel();
    },

    _updateSvg() {
        const old = document.getElementById('ccIvrSvg');
        if (!old) return;
        const wrap = old.parentNode;
        old.outerHTML = this._renderCanvasSvg();
        // 重新绑定双击事件
        const svg = document.getElementById('ccIvrSvg');
        if (svg) {
            const onDblClick = (e) => {
                const path = e.target.closest('.ivr-connection');
                if (path) {
                    const cid = path.dataset.connId;
                    this.designerState.connections = this.designerState.connections.filter(c => c.id !== cid);
                    this._updateSvg();
                }
            };
            svg.addEventListener('dblclick', onDblClick);
            this.eventHandlers.push({ el: svg, evt: 'dblclick', fn: onDblClick });
        }
    },

    _updateCanvas() {
        const canvas = document.getElementById('ccIvrCanvas');
        if (!canvas) return;
        canvas.innerHTML = this._renderCanvasNodes() + this._renderCanvasSvg();
        this._refreshSelection();
        // 重新绑定 svg 双击
        const svg = document.getElementById('ccIvrSvg');
        if (svg) {
            const onDblClick = (e) => {
                const path = e.target.closest('.ivr-connection');
                if (path) {
                    const cid = path.dataset.connId;
                    this.designerState.connections = this.designerState.connections.filter(c => c.id !== cid);
                    this._updateSvg();
                }
            };
            svg.addEventListener('dblclick', onDblClick);
            this.eventHandlers.push({ el: svg, evt: 'dblclick', fn: onDblClick });
        }
    },

    _addNode(typeId, x, y) {
        const meta = getNodeTypeMeta(typeId);
        // 限制开始节点只能存在一个
        if (typeId === 'start' && this.designerState.nodes.some(n => n.type === 'start')) {
            this._toast('每个流程只能有一个"开始"节点');
            return;
        }
        const node = {
            id: window.ccGenerateId('node_'),
            type: typeId,
            label: meta.label,
            x: x || 200,
            y: y || 100,
            config: this._defaultConfig(typeId)
        };
        this.designerState.nodes.push(node);
        this.designerState.selectedNodeId = node.id;
        this._updateCanvas();
    },

    _defaultConfig(typeId) {
        switch (typeId) {
            case 'play_voice': return { text: '', repeat: 1, timeout: 5 };
            case 'collect_dtmf': return { prompt: '', timeout: 5, valid_keys: '0123456789', max_retries: 3 };
            case 'time_check': return { work_start: '09:00', work_end: '18:00', work_days: '1,2,3,4,5', holidays: '' };
            case 'transfer_agent': return { strategy: 'auto', agent_id: '', timeout: 30 };
            case 'transfer_queue': return { skillgroup_id: '', priority: 5, queue_prompt: '' };
            case 'hangup': return { text: '' };
            case 'voicemail': return { max_duration: 60, mailbox: 'default', prompt: '请在嘀声后留言，按#结束' };
            default: return {};
        }
    },

    _deleteNode(nodeId) {
        if (!confirm('确认删除该节点？关联连线也将一并删除。')) return;
        this.designerState.nodes = this.designerState.nodes.filter(n => n.id !== nodeId);
        this.designerState.connections = this.designerState.connections.filter(c => c.from !== nodeId && c.to !== nodeId);
        if (this.designerState.selectedNodeId === nodeId) this.designerState.selectedNodeId = null;
        this._updateCanvas();
    },

    _saveDesigner() {
        const flow = IvrFlowStorage.getById(this.selectedFlowId);
        if (!flow) return;
        // 校验：必须有开始节点
        if (!this.designerState.nodes.some(n => n.type === 'start')) {
            if (!confirm('当前流程没有"开始"节点，确认保存吗？')) return;
        }
        IvrFlowStorage.update(this.selectedFlowId, {
            flow_config: {
                nodes: this.designerState.nodes,
                connections: this.designerState.connections
            }
        });
        this._toast('✓ 流程已保存');
    },

    _toast(msg) {
        const t = document.createElement('div');
        t.textContent = msg;
        t.style.cssText = 'position:fixed;top:20%;left:50%;transform:translateX(-50%);padding:12px 24px;background:rgba(18,18,26,0.95);color:#D4AF37;border:1px solid #D4AF37;border-radius:8px;font-size:13px;z-index:99999;box-shadow:0 4px 20px rgba(0,0,0,0.5);';
        document.body.appendChild(t);
        setTimeout(() => { t.style.transition = 'opacity 0.4s'; t.style.opacity = '0'; setTimeout(() => t.remove(), 400); }, 1800);
    },

    /* ----------- 事件路由 ----------- */
    handleEvents(e) {
        // 输入：搜索关键字
        if (e.type === 'input') {
            if (e.target.id === 'ccIvrSearch') {
                this.searchKeyword = e.target.value;
                // 仅重渲染列表区域（避免输入框失焦的简单做法：直接更新列表DOM）
                clearTimeout(this._searchTimer);
                this._searchTimer = setTimeout(() => {
                    const cur = this.container.querySelector('#ccIvrSearch');
                    const focused = cur === document.activeElement;
                    const pos = focused ? cur.selectionStart : 0;
                    this.renderFlowList();
                    if (focused) {
                        const fresh = this.container.querySelector('#ccIvrSearch');
                        if (fresh) { fresh.focus(); try { fresh.setSelectionRange(pos, pos); } catch (e) { } }
                    }
                }, 150);
                return;
            }
            // 设计器属性面板输入
            if (e.target.matches('[data-prop]')) {
                this._applyPropChange(e.target);
                return;
            }
            if (e.target.matches('[data-conn-label]')) {
                const cid = e.target.getAttribute('data-conn-label');
                const conn = this.designerState.connections.find(c => c.id === cid);
                if (conn) { conn.label = e.target.value; this._updateSvg(); }
                return;
            }
        }
        if (e.type === 'change') {
            if (e.target.matches('[data-prop]')) { this._applyPropChange(e.target); return; }
        }
        if (e.type !== 'click') return;

        const btn = e.target.closest('[data-act]');
        if (!btn) return;
        const act = btn.dataset.act;
        const id = btn.dataset.id;

        switch (act) {
            case 'ivr-new': this.showFlowModal(); break;
            case 'ivr-template': this.showTemplateModal(); break;
            case 'ivr-design':
                this.selectedFlowId = id;
                this.currentView = 'designer';
                this.render(this.container);
                break;
            case 'ivr-edit-info': this.showFlowModal(id); break;
            case 'ivr-toggle': {
                const f = IvrFlowStorage.getById(id);
                if (f) { IvrFlowStorage.update(id, { status: f.status === 1 ? 0 : 1 }); this.renderFlowList(); }
                break;
            }
            case 'ivr-copy': {
                const c = IvrFlowStorage.duplicate(id);
                if (c) { this._toast('已复制：' + c.name); this.renderFlowList(); }
                break;
            }
            case 'ivr-del':
                if (confirm('确认删除该IVR流程？')) {
                    IvrFlowStorage.delete(id); this.renderFlowList();
                }
                break;
            case 'ivr-back':
                this.currentView = 'list';
                this.selectedFlowId = null;
                this.render(this.container);
                break;
            case 'ivr-save': this._saveDesigner(); break;
            case 'ivr-clear':
                if (confirm('清空当前画布所有节点和连线？')) {
                    this.designerState.nodes = [];
                    this.designerState.connections = [];
                    this.designerState.selectedNodeId = null;
                    this._updateCanvas();
                }
                break;
            case 'ivr-add-start':
                this._addNode('start', 320, 30);
                break;
            case 'ivr-add-node':
                this._addNode(btn.dataset.nodeType, 200 + Math.random() * 100, 100 + Math.random() * 80);
                break;
            case 'ivr-delete-node':
                this._deleteNode(btn.dataset.nodeId);
                break;
            case 'ivr-delete-conn': {
                const cid = btn.getAttribute('data-conn-id');
                this.designerState.connections = this.designerState.connections.filter(c => c.id !== cid);
                this._updateSvg();
                break;
            }
            case 'ivr-modal-close': this._closeModal(); break;
            case 'ivr-modal-save': this._saveFlowModal(); break;
            case 'ivr-tpl-pick': this._createFromTemplate(btn.dataset.tplKey); break;
        }
    },

    _applyPropChange(input) {
        const sel = this.designerState.selectedNodeId;
        if (!sel) return;
        const node = this.designerState.nodes.find(n => n.id === sel);
        if (!node) return;
        const prop = input.dataset.prop;
        let val = input.value;
        if (input.type === 'number') val = val === '' ? '' : Number(val);
        if (prop === 'label') {
            node.label = val;
            // 局部更新节点标签
            const el = this.container.querySelector(`.ivr-node[data-node-id="${sel}"] .ivr-node-label`);
            if (el) el.textContent = val || getNodeTypeMeta(node.type).label;
        } else if (prop.indexOf('config.') === 0) {
            const k = prop.slice('config.'.length);
            if (!node.config) node.config = {};
            node.config[k] = val;
        }
    },

    /* ----------- 流程信息编辑模态框 ----------- */
    showFlowModal(flowId) {
        const flow = flowId ? IvrFlowStorage.getById(flowId) : null;
        const isEdit = !!flow;
        const data = flow || { name: '', bind_numbers: [], status: 1 };
        const html = `<div class="cc-modal-overlay" id="ccIvrModal">
            <div class="cc-modal" style="max-width:520px;">
                <div class="cc-modal-header">
                    <h3 class="cc-modal-title">${isEdit ? '编辑流程信息' : '新建IVR流程'}</h3>
                    <button class="cc-modal-close" data-act="ivr-modal-close">×</button>
                </div>
                <div class="cc-modal-body">
                    <input type="hidden" id="ccIvrFlowId" value="${data.id || ''}"/>
                    <div class="cc-form-group">
                        <label class="cc-form-label">流程名称 <span style="color:#FF4D4F;">*</span></label>
                        <input class="cc-form-input" id="ccIvrFlowName" value="${window.ccEscapeHtml(data.name)}" placeholder="如：售前咨询IVR"/>
                    </div>
                    <div class="cc-form-group">
                        <label class="cc-form-label">绑定号码（每行一个）</label>
                        <textarea class="cc-form-textarea" id="ccIvrFlowNumbers" rows="3" placeholder="400-888-8888&#10;010-12345678">${(data.bind_numbers || []).join('\n')}</textarea>
                    </div>
                    <div class="cc-form-group">
                        <label class="cc-form-label">状态</label>
                        <select class="cc-form-select" id="ccIvrFlowStatus">
                            <option value="1" ${data.status === 1 ? 'selected' : ''}>启用</option>
                            <option value="0" ${data.status === 0 ? 'selected' : ''}>禁用</option>
                        </select>
                    </div>
                </div>
                <div class="cc-modal-footer">
                    <button class="cc-btn cc-btn-outline" data-act="ivr-modal-close">取消</button>
                    <button class="cc-btn cc-btn-primary" data-act="ivr-modal-save">保存</button>
                </div>
            </div>
        </div>`;
        this._openModal(html);
    },

    _saveFlowModal() {
        const id = document.getElementById('ccIvrFlowId').value;
        const name = (document.getElementById('ccIvrFlowName').value || '').trim();
        if (!name) { this._toast('请填写流程名称'); return; }
        const numbersRaw = (document.getElementById('ccIvrFlowNumbers').value || '').trim();
        const numbers = numbersRaw ? numbersRaw.split(/\r?\n/).map(s => s.trim()).filter(Boolean) : [];
        const status = Number(document.getElementById('ccIvrFlowStatus').value);
        if (id) {
            IvrFlowStorage.update(id, { name, bind_numbers: numbers, status });
        } else {
            IvrFlowStorage.add({ name, bind_numbers: numbers, status, flow_config: { nodes: [], connections: [] } });
        }
        this._closeModal();
        this.renderFlowList();
    },

    /* ----------- 模板模态框 ----------- */
    showTemplateModal() {
        let tpl = `<div class="cc-modal-overlay" id="ccIvrModal">
            <div class="cc-modal" style="max-width:680px;">
                <div class="cc-modal-header">
                    <h3 class="cc-modal-title">📦 从模板创建IVR流程</h3>
                    <button class="cc-modal-close" data-act="ivr-modal-close">×</button>
                </div>
                <div class="cc-modal-body">
                    <div style="font-size:12px;color:#999;margin-bottom:14px;">选择一个预置模板，自动生成节点和连线，可在设计器中进一步调整：</div>
                    <div class="ivr-tpl-grid">`;
        IVR_TEMPLATES.forEach(t => {
            tpl += `<div class="ivr-tpl-card" data-act="ivr-tpl-pick" data-tpl-key="${t.key}">
                <div class="ivr-tpl-icon">${t.icon}</div>
                <div class="ivr-tpl-name">${t.name}</div>
                <div class="ivr-tpl-desc">${t.desc}</div>
            </div>`;
        });
        tpl += `</div>
                </div>
                <div class="cc-modal-footer">
                    <button class="cc-btn cc-btn-outline" data-act="ivr-modal-close">取消</button>
                </div>
            </div>
        </div>`;
        this._openModal(tpl);
    },

    _createFromTemplate(key) {
        const tpl = IVR_TEMPLATES.find(t => t.key === key);
        if (!tpl) return;
        const cfg = tpl.build();
        const flow = IvrFlowStorage.add({
            name: tpl.name + 'IVR流程',
            bind_numbers: [],
            status: 1,
            flow_config: cfg
        });
        this._closeModal();
        this._toast('✓ 已根据"' + tpl.name + '"模板创建流程');
        this.selectedFlowId = flow.id;
        this.currentView = 'designer';
        this.render(this.container);
    },

    /* ----------- 模态框工具 ----------- */
    _openModal(html) {
        this._closeModal();
        const wrap = document.createElement('div');
        wrap.innerHTML = html;
        const node = wrap.firstElementChild;
        // 兜底样式（若全局没有定义）
        if (node && !document.getElementById('cc-ivr-modal-fallback')) {
            const s = document.createElement('style');
            s.id = 'cc-ivr-modal-fallback';
            s.textContent = `
                .cc-modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.6); backdrop-filter: blur(4px); z-index: 9000; display: flex; align-items: center; justify-content: center; }
                .cc-modal { background: linear-gradient(160deg, #15151E 0%, #12121A 100%); border: 1px solid rgba(212,175,55,0.3); border-radius: 12px; width: 90%; max-height: 90vh; overflow: auto; box-shadow: 0 20px 60px rgba(0,0,0,0.6); }
                .cc-modal-header { display: flex; justify-content: space-between; align-items: center; padding: 16px 20px; border-bottom: 1px solid rgba(212,175,55,0.15); }
                .cc-modal-title { margin: 0; font-size: 15px; color: #D4AF37; font-weight: 600; }
                .cc-modal-close { background: none; border: none; color: #888; font-size: 22px; cursor: pointer; line-height: 1; }
                .cc-modal-close:hover { color: #D4AF37; }
                .cc-modal-body { padding: 20px; }
                .cc-modal-footer { display: flex; justify-content: flex-end; gap: 10px; padding: 14px 20px; border-top: 1px solid rgba(212,175,55,0.15); }
            `;
            document.head.appendChild(s);
        }
        document.body.appendChild(node);
        // 模态框内的事件复用 container 委托不到 body，单独绑定
        const onClick = (e) => this.handleEvents(e);
        const onChange = (e) => this.handleEvents(e);
        const onInput = (e) => this.handleEvents(e);
        node.addEventListener('click', onClick);
        node.addEventListener('change', onChange);
        node.addEventListener('input', onInput);
        this._modalNode = node;
        this._modalHandlers = [
            { evt: 'click', fn: onClick }, { evt: 'change', fn: onChange }, { evt: 'input', fn: onInput }
        ];
    },

    _closeModal() {
        if (this._modalNode) {
            (this._modalHandlers || []).forEach(h => { try { this._modalNode.removeEventListener(h.evt, h.fn); } catch (e) { } });
            try { this._modalNode.remove(); } catch (e) { }
            this._modalNode = null; this._modalHandlers = null;
        }
    },

    /* ----------- 种子数据 ----------- */
    initSeedData() {
        if (localStorage.getItem('cc_ivr_seeded')) return;
        const seed1 = {
            id: window.ccGenerateId('ivr_'),
            name: '售前咨询IVR',
            status: 1,
            bind_numbers: ['400-888-8888', '400-888-8889'],
            flow_config: buildTemplate_Sales(),
            deleted: false,
            created_at: '2024-01-15T10:00:00.000Z',
            updated_at: '2024-03-20T14:30:00.000Z'
        };
        const seed2 = {
            id: window.ccGenerateId('ivr_'),
            name: '售后服务IVR',
            status: 1,
            bind_numbers: ['400-666-6666'],
            flow_config: buildTemplate_Aftersale(),
            deleted: false,
            created_at: '2024-02-01T09:00:00.000Z',
            updated_at: '2024-03-18T11:20:00.000Z'
        };
        const seed3 = {
            id: window.ccGenerateId('ivr_'),
            name: '客户满意度调查',
            status: 0,
            bind_numbers: [],
            flow_config: buildTemplate_Survey(),
            deleted: false,
            created_at: '2024-02-10T15:00:00.000Z',
            updated_at: '2024-02-10T15:00:00.000Z'
        };
        localStorage.setItem(CC_IVR_KEYS.FLOWS, JSON.stringify([seed1, seed2, seed3]));
        localStorage.setItem('cc_ivr_seeded', '1');
    }
};

// 暴露到全局供 CallCenter 主模块调用
window.CCIvr = CCIvr;
window.IvrFlowStorage = IvrFlowStorage;
window.IVR_NODE_TYPES = IVR_NODE_TYPES;
window.CC_IVR_KEYS = CC_IVR_KEYS;
