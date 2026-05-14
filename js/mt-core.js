// ============================================================
// mt-core.js - 多维表格数据层核心
// 职责：命名空间、事件总线、数据持久化、CRUD、数据管道、撤销重做、公式引擎
// ============================================================

window.MT = window.MT || {};

MT.Core = {
    STORAGE_KEY: 'zhqf_mt_workspace',
    workspace: null,
    _listeners: {},
    _saveTimer: null,

    // ===== 初始化 =====
    init() {
        this.loadWorkspace();
    },

    // ===== 事件总线 =====
    on(event, fn) {
        if (!this._listeners[event]) this._listeners[event] = [];
        this._listeners[event].push(fn);
    },
    off(event, fn) {
        if (!this._listeners[event]) return;
        this._listeners[event] = this._listeners[event].filter(f => f !== fn);
    },
    emit(event, data) {
        (this._listeners[event] || []).forEach(fn => fn(data));
        if (event !== 'data:changed') {
            (this._listeners['data:changed'] || []).forEach(fn => fn({ event, data }));
        }
    },

    // ===== 持久化 =====
    loadWorkspace() {
        const raw = localStorage.getItem(this.STORAGE_KEY);
        if (raw) {
            try {
                this.workspace = JSON.parse(raw);
                this.migrateV1toV2();
            } catch (e) {
                console.error('MT: workspace parse error', e);
                this.workspace = this.createDemoWorkspace();
            }
        } else {
            this.workspace = this.createDemoWorkspace();
        }
        this.save();
    },
    save() {
        clearTimeout(this._saveTimer);
        this._saveTimer = setTimeout(() => {
            try {
                localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.workspace));
            } catch (e) {
                console.warn('MT: save failed (quota?)', e);
                this.emit('storage:warning', this.getStorageUsage());
            }
        }, 200);
    },
    saveImmediate() {
        clearTimeout(this._saveTimer);
        try {
            localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.workspace));
        } catch (e) {
            console.warn('MT: save failed', e);
        }
    },
    getStorageUsage() {
        const data = localStorage.getItem(this.STORAGE_KEY) || '';
        const usedKB = Math.round(data.length / 1024);
        return { usedKB, limitKB: 5120, percent: Math.round(usedKB / 5120 * 100) };
    },

    // ===== 数据迁移 =====
    migrateV1toV2() {
        const ws = this.workspace;
        if (ws.version >= 2) return;
        ws.version = 2;
        ws.undoStack = ws.undoStack || [];
        ws.redoStack = ws.redoStack || [];
        ws.dashboards = ws.dashboards || [];
        (ws.tables || []).forEach(t => {
            t.autoNumberCounters = t.autoNumberCounters || {};
            (t.views || []).forEach(v => {
                v.groupBy = v.groupBy || null;
                v.fieldOrder = v.fieldOrder || [];
                v.rowHeight = v.rowHeight || 'medium';
                v.frozenColumns = v.frozenColumns || 0;
                v.colorRules = v.colorRules || [];
                v.hiddenFields = v.hiddenFields || [];
            });
        });
    },

    // ===== 访问器 =====
    getState() { return this.workspace; },
    getCurrentTable() { return this.tbl(); },
    getCurrentView() { return this.viw(); },
    tbl() {
        return this.workspace.tables.find(t => t.id === this.workspace.activeTableId) || this.workspace.tables[0];
    },
    viw() {
        const t = this.tbl();
        return t.views.find(v => v.id === t.activeViewId) || t.views[0];
    },
    field(fldId) {
        return this.tbl().fields.find(f => f.id === fldId);
    },
    record(recId) {
        return this.tbl().records.find(r => r.id === recId);
    },
    tableById(tid) {
        return this.workspace.tables.find(t => t.id === tid);
    },

    // ===== 表CRUD =====
    addTable(name) {
        const id = this.genId('tbl');
        const icons = ['📊', '📋', '📁', '💰', '📈', '🗂️'];
        const vId = this.genId('viw');
        this.workspace.tables.push({
            id, name: name || '新数据表',
            icon: icons[this.workspace.tables.length % icons.length],
            autoNumberCounters: {},
            fields: [
                { id: this.genId('fld'), name: '标题', type: 'text', isPrimary: true, width: 200, visible: true, config: {} }
            ],
            records: [],
            views: [{ id: vId, name: '网格视图', type: 'grid', filters: [], sorts: [], groupBy: null, hiddenFields: [], fieldOrder: [], rowHeight: 'medium', frozenColumns: 0, colorRules: [] }],
            activeViewId: vId
        });
        this.workspace.activeTableId = id;
        this.save();
        this.emit('table:add', { id });
    },
    renameTable(id, name) {
        const t = this.workspace.tables.find(x => x.id === id);
        if (t && name && name.trim()) { t.name = name.trim(); this.save(); this.emit('table:rename', { id }); }
    },
    deleteTable(id) {
        if (this.workspace.tables.length <= 1) return;
        this.workspace.tables = this.workspace.tables.filter(t => t.id !== id);
        if (this.workspace.activeTableId === id) this.workspace.activeTableId = this.workspace.tables[0].id;
        this.save();
        this.emit('table:delete', { id });
    },
    switchTable(id) {
        if (this.workspace.activeTableId === id) return;
        this.workspace.activeTableId = id;
        this.save();
        this.emit('table:switch', { id });
    },
    dupTable(id) {
        const src = this.workspace.tables.find(t => t.id === id);
        if (!src) return;
        const copy = JSON.parse(JSON.stringify(src));
        copy.id = this.genId('tbl');
        copy.name += ' (副本)';
        copy.views.forEach(v => { v.id = this.genId('viw'); });
        copy.activeViewId = copy.views[0].id;
        this.workspace.tables.push(copy);
        this.workspace.activeTableId = copy.id;
        this.save();
        this.emit('table:add', { id: copy.id });
    },

    // ===== 字段CRUD =====
    addField(fieldDef) {
        const t = this.tbl();
        const fld = { id: this.genId('fld'), visible: true, width: 120, isPrimary: false, config: {}, ...fieldDef };
        t.fields.push(fld);
        t.records.forEach(r => { r.values[fld.id] = this.defaultVal(fld); });
        if (fld.type === 'auto_number') {
            t.autoNumberCounters[fld.id] = t.records.length;
            t.records.forEach((r, i) => {
                const prefix = (fld.config && fld.config.prefix) || '';
                const digits = (fld.config && fld.config.digits) || 4;
                r.values[fld.id] = prefix + String(i + 1).padStart(digits, '0');
            });
        }
        this.save();
        this.emit('field:add', { id: fld.id });
        return fld;
    },
    deleteField(fldId) {
        const t = this.tbl();
        const fld = t.fields.find(f => f.id === fldId);
        if (!fld || fld.isPrimary) return;
        this.pushUndo({ type: 'deleteField', tableId: t.id, field: JSON.parse(JSON.stringify(fld)), values: t.records.map(r => ({ recId: r.id, value: r.values[fldId] })) });
        t.fields = t.fields.filter(f => f.id !== fldId);
        t.records.forEach(r => { delete r.values[fldId]; });
        this.save();
        this.emit('field:delete', { id: fldId });
    },
    renameField(fldId, name) {
        const fld = this.field(fldId);
        if (fld && name && name.trim()) { fld.name = name.trim(); this.save(); this.emit('field:rename', { id: fldId }); }
    },
    updateFieldConfig(fldId, config) {
        const fld = this.field(fldId);
        if (fld) { Object.assign(fld.config, config); this.save(); this.emit('field:update', { id: fldId }); }
    },
    reorderFields(fieldIds) {
        const t = this.tbl();
        const map = {};
        t.fields.forEach(f => { map[f.id] = f; });
        t.fields = fieldIds.map(id => map[id]).filter(Boolean);
        this.save();
        this.emit('field:reorder', {});
    },
    defaultVal(fld) {
        switch (fld.type) {
            case 'number': case 'currency': return 0;
            case 'checkbox': return false;
            case 'rating': case 'progress': return 0;
            case 'multiselect': return [];
            case 'link': return [];
            case 'attachment': return [];
            case 'person': return fld.config && fld.config.allowMultiple ? [] : null;
            case 'created_time': case 'updated_time': return new Date().toISOString();
            case 'auto_number': return '';
            case 'formula': case 'lookup': return null;
            case 'location': return { address: '', lat: null, lng: null };
            default: return '';
        }
    },

    // ===== 记录CRUD =====
    addRecord(defaults) {
        const t = this.tbl();
        const now = new Date().toISOString();
        const rec = { id: this.genId('rec'), values: {}, createdAt: now, updatedAt: now };
        t.fields.forEach(f => {
            if (f.type === 'created_time') rec.values[f.id] = now;
            else if (f.type === 'updated_time') rec.values[f.id] = now;
            else if (f.type === 'auto_number') {
                const counter = (t.autoNumberCounters[f.id] || 0) + 1;
                t.autoNumberCounters[f.id] = counter;
                const prefix = (f.config && f.config.prefix) || '';
                const digits = (f.config && f.config.digits) || 4;
                rec.values[f.id] = prefix + String(counter).padStart(digits, '0');
            } else {
                rec.values[f.id] = this.defaultVal(f);
            }
        });
        if (defaults) Object.assign(rec.values, defaults);
        t.records.push(rec);
        this.recalcComputedFields(t);
        this.save();
        this.emit('record:add', { id: rec.id });
        return rec;
    },
    updateRecordField(recId, fldId, val) {
        const t = this.tbl();
        const rec = t.records.find(r => r.id === recId);
        if (!rec) return;
        const oldVal = rec.values[fldId];
        this.pushUndo({ type: 'updateField', tableId: t.id, recordId: recId, fieldId: fldId, oldValue: JSON.parse(JSON.stringify(oldVal !== undefined ? oldVal : null)) });
        rec.values[fldId] = val;
        rec.updatedAt = new Date().toISOString();
        t.fields.forEach(f => { if (f.type === 'updated_time') rec.values[f.id] = rec.updatedAt; });
        this.recalcComputedFields(t);
        this.save();
        this.emit('record:update', { id: recId, fieldId: fldId });
    },
    deleteRecord(recId) {
        const t = this.tbl();
        const rec = t.records.find(r => r.id === recId);
        if (!rec) return;
        this.pushUndo({ type: 'deleteRecord', tableId: t.id, record: JSON.parse(JSON.stringify(rec)) });
        t.records = t.records.filter(r => r.id !== recId);
        this.save();
        this.emit('record:delete', { id: recId });
    },
    deleteRecords(recIds) {
        const t = this.tbl();
        const ids = new Set(recIds);
        const deleted = t.records.filter(r => ids.has(r.id));
        this.pushUndo({ type: 'deleteRecords', tableId: t.id, records: JSON.parse(JSON.stringify(deleted)) });
        t.records = t.records.filter(r => !ids.has(r.id));
        this.save();
        this.emit('record:delete', { ids: recIds });
    },
    batchUpdate(recIds, fldId, val) {
        const t = this.tbl();
        const oldValues = [];
        recIds.forEach(rid => {
            const rec = t.records.find(r => r.id === rid);
            if (rec) {
                oldValues.push({ recId: rid, oldValue: rec.values[fldId] });
                rec.values[fldId] = val;
                rec.updatedAt = new Date().toISOString();
            }
        });
        this.pushUndo({ type: 'batchUpdate', tableId: t.id, fieldId: fldId, oldValues });
        this.recalcComputedFields(t);
        this.save();
        this.emit('record:batch', { ids: recIds, fieldId: fldId });
    },
    duplicateRecord(recId) {
        const t = this.tbl();
        const src = t.records.find(r => r.id === recId);
        if (!src) return null;
        const now = new Date().toISOString();
        const rec = { id: this.genId('rec'), values: JSON.parse(JSON.stringify(src.values)), createdAt: now, updatedAt: now };
        t.fields.forEach(f => {
            if (f.type === 'created_time') rec.values[f.id] = now;
            if (f.type === 'updated_time') rec.values[f.id] = now;
            if (f.type === 'auto_number') {
                const counter = (t.autoNumberCounters[f.id] || 0) + 1;
                t.autoNumberCounters[f.id] = counter;
                const prefix = (f.config && f.config.prefix) || '';
                const digits = (f.config && f.config.digits) || 4;
                rec.values[f.id] = prefix + String(counter).padStart(digits, '0');
            }
        });
        t.records.push(rec);
        this.save();
        this.emit('record:add', { id: rec.id });
        return rec;
    },

    // ===== 视图管理 =====
    addView(type, extraConfig) {
        const t = this.tbl();
        const names = { grid: '网格视图', kanban: '看板视图', gallery: '画廊视图', gantt: '甘特图', calendar: '日历视图', form: '表单视图' };
        const count = t.views.filter(v => v.type === type).length;
        const v = {
            id: this.genId('viw'),
            name: names[type] + (count ? ` ${count + 1}` : ''),
            type,
            filters: [], sorts: [], groupBy: null, hiddenFields: [], fieldOrder: [],
            rowHeight: 'medium', frozenColumns: 0, colorRules: [],
            ...extraConfig
        };
        if (type === 'kanban') {
            const selFld = t.fields.find(f => f.type === 'select');
            v.kanbanField = selFld ? selFld.id : null;
            v.kanbanCardFields = [];
        }
        if (type === 'gallery') { v.galleryColumns = 4; v.galleryCardFields = []; v.galleryCoverField = null; }
        if (type === 'gantt') {
            const dateFlds = t.fields.filter(f => f.type === 'date');
            v.ganttStartField = dateFlds[0] ? dateFlds[0].id : null;
            v.ganttEndField = dateFlds[1] ? dateFlds[1].id : null;
            v.ganttGroupField = null;
            v.ganttScale = 'week';
            v.ganttProgressField = null;
        }
        if (type === 'calendar') {
            const dateFld = t.fields.find(f => f.type === 'date');
            v.calendarDateField = dateFld ? dateFld.id : null;
            v.calendarEndDateField = null;
            v.calendarTitleField = t.fields.find(f => f.isPrimary) ? t.fields.find(f => f.isPrimary).id : null;
            v.calendarColorField = null;
            v.calendarView = 'month';
        }
        if (type === 'form') {
            v.formTitle = '提交记录';
            v.formDescription = '';
            v.formFields = t.fields.filter(f => !f.isPrimary && f.type !== 'created_time' && f.type !== 'updated_time' && f.type !== 'auto_number' && f.type !== 'formula' && f.type !== 'lookup').map(f => ({ fieldId: f.id, required: false, helpText: '' }));
            v.formSubmitText = '提交';
            v.formSuccessMessage = '提交成功！';
        }
        t.views.push(v);
        t.activeViewId = v.id;
        this.save();
        this.emit('view:add', { id: v.id });
        return v;
    },
    switchView(viwId) {
        const t = this.tbl();
        if (t.activeViewId === viwId) return;
        t.activeViewId = viwId;
        this.save();
        this.emit('view:switch', { id: viwId });
    },
    deleteView(viwId) {
        const t = this.tbl();
        if (t.views.length <= 1) return;
        t.views = t.views.filter(v => v.id !== viwId);
        if (t.activeViewId === viwId) t.activeViewId = t.views[0].id;
        this.save();
        this.emit('view:delete', { id: viwId });
    },
    updateView(viwId, changes) {
        const t = this.tbl();
        const v = t.views.find(x => x.id === viwId);
        if (v) { Object.assign(v, changes); this.save(); this.emit('view:update', { id: viwId }); }
    },

    // ===== 数据管道 =====
    getProcessedRecords() {
        const t = this.tbl();
        const v = this.viw();
        let data = [...t.records];
        if (v.filters && v.filters.length) data = this.applyFilters(data, v.filters);
        if (v.sorts && v.sorts.length) data = this.applySorts(data, v.sorts);
        if (this._searchQuery) data = this.applySearch(data, this._searchQuery);
        return data;
    },
    getGroupedRecords() {
        const v = this.viw();
        const data = this.getProcessedRecords();
        if (!v.groupBy || !v.groupBy.fieldId) return null;
        return this.applyGroupBy(data, v.groupBy);
    },
    _searchQuery: '',
    setSearchQuery(q) { this._searchQuery = q; },

    applyFilters(data, filters) {
        return data.filter(rec => filters.every(f => {
            const val = rec.values[f.field];
            const target = f.value;
            switch (f.op) {
                case 'eq': return String(val) === String(target);
                case 'neq': return String(val) !== String(target);
                case 'contains': return String(val || '').toLowerCase().includes((target || '').toLowerCase());
                case 'not_contains': return !String(val || '').toLowerCase().includes((target || '').toLowerCase());
                case 'gt': return parseFloat(val) > parseFloat(target);
                case 'lt': return parseFloat(val) < parseFloat(target);
                case 'gte': return parseFloat(val) >= parseFloat(target);
                case 'lte': return parseFloat(val) <= parseFloat(target);
                case 'empty': return !val || val === '' || (Array.isArray(val) && val.length === 0);
                case 'not_empty': return val && val !== '' && !(Array.isArray(val) && val.length === 0);
                case 'is_true': return val === true;
                case 'is_false': return val !== true;
                case 'date_before': return val && new Date(val) < new Date(target);
                case 'date_after': return val && new Date(val) > new Date(target);
                default: return true;
            }
        }));
    },
    applySorts(data, sorts) {
        return [...data].sort((a, b) => {
            for (const s of sorts) {
                let va = a.values[s.field] || '', vb = b.values[s.field] || '';
                const fld = this.tbl().fields.find(f => f.id === s.field);
                if (fld && ['number', 'currency', 'rating', 'progress'].includes(fld.type)) { va = parseFloat(va) || 0; vb = parseFloat(vb) || 0; }
                if (fld && ['date', 'created_time', 'updated_time'].includes(fld.type)) { va = new Date(va || 0).getTime(); vb = new Date(vb || 0).getTime(); }
                if (va < vb) return s.order === 'asc' ? -1 : 1;
                if (va > vb) return s.order === 'asc' ? 1 : -1;
            }
            return 0;
        });
    },
    applySearch(data, q) {
        const lq = q.toLowerCase();
        const fields = this.tbl().fields;
        return data.filter(rec => fields.some(f => {
            const v = rec.values[f.id];
            if (v === null || v === undefined) return false;
            if (Array.isArray(v)) return v.some(x => String(x).toLowerCase().includes(lq));
            return String(v).toLowerCase().includes(lq);
        }));
    },
    applyGroupBy(data, groupBy) {
        const fld = this.tbl().fields.find(f => f.id === groupBy.fieldId);
        if (!fld) return [{ groupName: '全部', records: data }];
        const groups = {};
        data.forEach(rec => {
            let key = rec.values[fld.id];
            if (Array.isArray(key)) key = key.join(', ');
            if (key === null || key === undefined || key === '') key = '(空)';
            key = String(key);
            if (!groups[key]) groups[key] = [];
            groups[key].push(rec);
        });
        let result = Object.entries(groups).map(([name, records]) => ({ groupName: name, records }));
        if (groupBy.order === 'desc') result.reverse();
        return result;
    },

    // ===== 撤销/重做 =====
    pushUndo(action) {
        this.workspace.undoStack.push(action);
        if (this.workspace.undoStack.length > 50) this.workspace.undoStack.shift();
        this.workspace.redoStack = [];
    },
    canUndo() { return this.workspace.undoStack.length > 0; },
    canRedo() { return this.workspace.redoStack.length > 0; },
    undo() {
        if (!this.canUndo()) return;
        const action = this.workspace.undoStack.pop();
        this._applyUndoAction(action);
        this.workspace.redoStack.push(action);
        this.save();
        this.emit('undo', action);
    },
    redo() {
        if (!this.canRedo()) return;
        const action = this.workspace.redoStack.pop();
        this._applyRedoAction(action);
        this.workspace.undoStack.push(action);
        this.save();
        this.emit('redo', action);
    },
    _applyUndoAction(action) {
        const t = this.workspace.tables.find(x => x.id === action.tableId);
        if (!t) return;
        switch (action.type) {
            case 'updateField': {
                const rec = t.records.find(r => r.id === action.recordId);
                if (rec) { action.newValue = rec.values[action.fieldId]; rec.values[action.fieldId] = action.oldValue; }
                break;
            }
            case 'deleteRecord': {
                t.records.push(action.record);
                break;
            }
            case 'deleteRecords': {
                action.records.forEach(r => t.records.push(r));
                break;
            }
            case 'deleteField': {
                t.fields.push(action.field);
                action.values.forEach(v => {
                    const rec = t.records.find(r => r.id === v.recId);
                    if (rec) rec.values[action.field.id] = v.value;
                });
                break;
            }
            case 'batchUpdate': {
                action.oldValues.forEach(v => {
                    const rec = t.records.find(r => r.id === v.recId);
                    if (rec) { v.newValue = rec.values[action.fieldId]; rec.values[action.fieldId] = v.oldValue; }
                });
                break;
            }
        }
    },
    _applyRedoAction(action) {
        const t = this.workspace.tables.find(x => x.id === action.tableId);
        if (!t) return;
        switch (action.type) {
            case 'updateField': {
                const rec = t.records.find(r => r.id === action.recordId);
                if (rec) { rec.values[action.fieldId] = action.newValue; }
                break;
            }
            case 'deleteRecord': {
                t.records = t.records.filter(r => r.id !== action.record.id);
                break;
            }
            case 'deleteRecords': {
                const ids = new Set(action.records.map(r => r.id));
                t.records = t.records.filter(r => !ids.has(r.id));
                break;
            }
            case 'deleteField': {
                t.fields = t.fields.filter(f => f.id !== action.field.id);
                t.records.forEach(r => { delete r.values[action.field.id]; });
                break;
            }
            case 'batchUpdate': {
                action.oldValues.forEach(v => {
                    const rec = t.records.find(r => r.id === v.recId);
                    if (rec) rec.values[action.fieldId] = v.newValue;
                });
                break;
            }
        }
    },

    // ===== 公式引擎 =====
    evaluateFormula(expression, record, fields) {
        if (!expression) return null;
        try {
            let expr = expression;
            // 替换 {字段名} 为实际值
            fields.forEach(f => {
                const re = new RegExp('\\{' + f.name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '\\}', 'g');
                let val = record.values[f.id];
                if (val === null || val === undefined) val = 0;
                if (typeof val === 'string' && !isNaN(val)) val = parseFloat(val);
                if (typeof val === 'string') val = '"' + val + '"';
                if (typeof val === 'boolean') val = val ? 1 : 0;
                expr = expr.replace(re, val);
            });
            return this._safeEval(expr);
        } catch (e) {
            return '#ERROR';
        }
    },
    _safeEval(expr) {
        // 简单安全求值器：只允许数字、运算符和预定义函数
        expr = expr.trim();
        // 处理内置函数
        expr = expr.replace(/IF\s*\(([^,]+),([^,]+),([^)]+)\)/gi, (_, cond, t, f) => {
            return this._safeEval(cond) ? this._safeEval(t) : this._safeEval(f);
        });
        expr = expr.replace(/ABS\s*\(([^)]+)\)/gi, (_, v) => Math.abs(this._safeEval(v)));
        expr = expr.replace(/ROUND\s*\(([^,]+),([^)]+)\)/gi, (_, v, d) => {
            const val = this._safeEval(v), dec = this._safeEval(d);
            return parseFloat(val.toFixed(dec));
        });
        expr = expr.replace(/MAX\s*\(([^)]+)\)/gi, (_, args) => Math.max(...args.split(',').map(a => this._safeEval(a))));
        expr = expr.replace(/MIN\s*\(([^)]+)\)/gi, (_, args) => Math.min(...args.split(',').map(a => this._safeEval(a))));
        expr = expr.replace(/SUM\s*\(([^)]+)\)/gi, (_, args) => args.split(',').map(a => this._safeEval(a)).reduce((s, v) => s + v, 0));
        expr = expr.replace(/AVG\s*\(([^)]+)\)/gi, (_, args) => { const arr = args.split(',').map(a => this._safeEval(a)); return arr.reduce((s, v) => s + v, 0) / arr.length; });
        expr = expr.replace(/LEN\s*\(([^)]+)\)/gi, (_, v) => String(v).replace(/"/g, '').length);
        expr = expr.replace(/TODAY\s*\(\)/gi, () => Date.now());
        expr = expr.replace(/CONCAT\s*\(([^)]+)\)/gi, (_, args) => args.split(',').map(a => String(a).replace(/"/g, '').trim()).join(''));

        // 检查是否只包含安全字符
        const safePattern = /^[\d\s+\-*/().%<>=!&|"',]+$/;
        if (!safePattern.test(expr)) return expr; // 返回字符串结果

        // 比较运算符
        if (expr.includes('==')) { const [l, r] = expr.split('=='); return this._safeEval(l) == this._safeEval(r) ? 1 : 0; }
        if (expr.includes('!=')) { const [l, r] = expr.split('!='); return this._safeEval(l) != this._safeEval(r) ? 1 : 0; }
        if (expr.includes('>=')) { const [l, r] = expr.split('>='); return this._safeEval(l) >= this._safeEval(r) ? 1 : 0; }
        if (expr.includes('<=')) { const [l, r] = expr.split('<='); return this._safeEval(l) <= this._safeEval(r) ? 1 : 0; }
        if (expr.includes('>') && !expr.includes('>=')) { const parts = expr.split('>'); return this._safeEval(parts[0]) > this._safeEval(parts[1]) ? 1 : 0; }
        if (expr.includes('<') && !expr.includes('<=')) { const parts = expr.split('<'); return this._safeEval(parts[0]) < this._safeEval(parts[1]) ? 1 : 0; }

        // 基本算术
        try {
            const fn = new Function('return (' + expr + ')');
            const result = fn();
            return typeof result === 'number' ? result : String(result);
        } catch (e) {
            return '#ERROR';
        }
    },
    recalcComputedFields(table) {
        const formulaFields = table.fields.filter(f => f.type === 'formula');
        const lookupFields = table.fields.filter(f => f.type === 'lookup');
        table.records.forEach(rec => {
            formulaFields.forEach(f => {
                const expr = f.config && f.config.expression;
                if (expr) rec.values[f.id] = this.evaluateFormula(expr, rec, table.fields);
            });
            lookupFields.forEach(f => {
                rec.values[f.id] = this.evaluateLookup(f.config, rec, table);
            });
        });
    },
    evaluateLookup(config, record, table) {
        if (!config || !config.sourceTableId || !config.sourceFieldId || !config.linkFieldId) return null;
        const linkVal = record.values[config.linkFieldId];
        if (!linkVal || !Array.isArray(linkVal) || !linkVal.length) return null;
        const sourceTable = this.tableById(config.sourceTableId);
        if (!sourceTable) return null;
        const linkedRecords = linkVal.map(link => sourceTable.records.find(r => r.id === link.recordId)).filter(Boolean);
        const values = linkedRecords.map(r => r.values[config.sourceFieldId]).filter(v => v !== null && v !== undefined);
        return values.length === 1 ? values[0] : values.join(', ');
    },

    // ===== 仪表盘 =====
    addDashboard(name, tableId) {
        const dash = { id: this.genId('dash'), name: name || '仪表盘', tableId: tableId || this.tbl().id, widgets: [] };
        this.workspace.dashboards.push(dash);
        this.save();
        this.emit('dashboard:add', { id: dash.id });
        return dash;
    },
    deleteDashboard(id) {
        this.workspace.dashboards = this.workspace.dashboards.filter(d => d.id !== id);
        this.save();
        this.emit('dashboard:delete', { id });
    },
    addWidget(dashId, widget) {
        const dash = this.workspace.dashboards.find(d => d.id === dashId);
        if (!dash) return null;
        widget.id = this.genId('wgt');
        dash.widgets.push(widget);
        this.save();
        return widget;
    },
    updateWidget(dashId, wgtId, changes) {
        const dash = this.workspace.dashboards.find(d => d.id === dashId);
        if (!dash) return;
        const wgt = dash.widgets.find(w => w.id === wgtId);
        if (wgt) { Object.assign(wgt, changes); this.save(); }
    },
    deleteWidget(dashId, wgtId) {
        const dash = this.workspace.dashboards.find(d => d.id === dashId);
        if (!dash) return;
        dash.widgets = dash.widgets.filter(w => w.id !== wgtId);
        this.save();
    },
    aggregateData(tableId, fieldId, aggregation, filters) {
        const t = this.workspace.tables.find(x => x.id === tableId);
        if (!t) return 0;
        let records = [...t.records];
        if (filters && filters.length) records = this.applyFilters(records, filters);
        if (aggregation === 'count') return records.length;
        const values = records.map(r => parseFloat(r.values[fieldId]) || 0);
        switch (aggregation) {
            case 'sum': return values.reduce((s, v) => s + v, 0);
            case 'avg': return values.length ? values.reduce((s, v) => s + v, 0) / values.length : 0;
            case 'min': return values.length ? Math.min(...values) : 0;
            case 'max': return values.length ? Math.max(...values) : 0;
            default: return values.length;
        }
    },

    // ===== 导入/导出 =====
    exportCSV() {
        const t = this.tbl();
        const fields = t.fields.filter(f => f.visible);
        const header = fields.map(f => '"' + f.name.replace(/"/g, '""') + '"').join(',');
        const rows = t.records.map(rec => fields.map(f => {
            let v = rec.values[f.id];
            if (Array.isArray(v)) v = v.join('; ');
            if (v === null || v === undefined) v = '';
            if (typeof v === 'object') v = JSON.stringify(v);
            return '"' + String(v).replace(/"/g, '""') + '"';
        }).join(',')).join('\n');
        const csv = '\uFEFF' + header + '\n' + rows;
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url; a.download = t.name + '.csv';
        a.click(); URL.revokeObjectURL(url);
    },
    importCSV(csvText) {
        const lines = csvText.split(/\r?\n/).filter(l => l.trim());
        if (lines.length < 2) return { headers: [], rows: [] };
        const parseRow = (line) => {
            const cells = []; let cell = ''; let inQuote = false;
            for (let i = 0; i < line.length; i++) {
                const ch = line[i];
                if (ch === '"') { if (inQuote && line[i + 1] === '"') { cell += '"'; i++; } else { inQuote = !inQuote; } }
                else if ((ch === ',' || ch === '\t' || ch === ';') && !inQuote) { cells.push(cell.trim()); cell = ''; }
                else { cell += ch; }
            }
            cells.push(cell.trim());
            return cells;
        };
        const headers = parseRow(lines[0]);
        const rows = lines.slice(1).map(l => parseRow(l));
        return { headers, rows };
    },
    applyImport(headers, rows, mapping) {
        // mapping: { csvColIndex: fieldId }
        const t = this.tbl();
        rows.forEach(row => {
            const rec = this.addRecord();
            Object.entries(mapping).forEach(([colIdx, fldId]) => {
                const fld = t.fields.find(f => f.id === fldId);
                if (!fld) return;
                let val = row[parseInt(colIdx)] || '';
                if (fld.type === 'number' || fld.type === 'currency') val = parseFloat(val) || 0;
                else if (fld.type === 'checkbox') val = ['true', '1', 'yes', '是'].includes(val.toLowerCase());
                else if (fld.type === 'rating' || fld.type === 'progress') val = parseInt(val) || 0;
                else if (fld.type === 'multiselect') val = val.split(/[;,]/).map(s => s.trim()).filter(Boolean);
                this.updateRecordField(rec.id, fldId, val);
            });
        });
    },

    // ===== 工具函数 =====
    genId(prefix) { return prefix + '_' + Date.now().toString(36) + '_' + Math.random().toString(36).substr(2, 5); },
    esc(s) { if (!s) return ''; const d = document.createElement('div'); d.textContent = String(s); return d.innerHTML; },
    fmtDate(d) { if (!d) return ''; try { return new Date(d).toLocaleDateString('zh-CN'); } catch (e) { return d; } },
    fmtDateTime(d) { if (!d) return ''; try { return new Date(d).toLocaleString('zh-CN'); } catch (e) { return d; } },
    fmtNum(n, dec) { return parseFloat(n || 0).toLocaleString('zh-CN', { minimumFractionDigits: dec || 0, maximumFractionDigits: dec || 0 }); },
    debounce(fn, ms) { let t; return function (...args) { clearTimeout(t); t = setTimeout(() => fn.apply(this, args), ms); }; },

    // ===== Demo数据 =====
    createDemoWorkspace() {
        const tbl1Id = this.genId('tbl');
        const f1 = { id: this.genId('fld'), name: '任务名称', type: 'text', isPrimary: true, width: 200, visible: true, config: {} };
        const f2 = { id: this.genId('fld'), name: '状态', type: 'select', isPrimary: false, width: 100, visible: true, config: { options: [{ label: '未开始', color: 8 }, { label: '进行中', color: 0 }, { label: '已完成', color: 1 }, { label: '已搁置', color: 4 }] } };
        const f3 = { id: this.genId('fld'), name: '优先级', type: 'select', isPrimary: false, width: 90, visible: true, config: { options: [{ label: '紧急', color: 4 }, { label: '高', color: 3 }, { label: '中', color: 2 }, { label: '低', color: 8 }] } };
        const f4 = { id: this.genId('fld'), name: '负责人', type: 'text', isPrimary: false, width: 100, visible: true, config: {} };
        const f5 = { id: this.genId('fld'), name: '截止日期', type: 'date', isPrimary: false, width: 120, visible: true, config: {} };
        const f6 = { id: this.genId('fld'), name: '预算', type: 'currency', isPrimary: false, width: 120, visible: true, config: { symbol: '¥', decimals: 2 } };
        const f7 = { id: this.genId('fld'), name: '进度', type: 'progress', isPrimary: false, width: 130, visible: true, config: { max: 100, color: '#4f46e5' } };
        const f8 = { id: this.genId('fld'), name: '已完成', type: 'checkbox', isPrimary: false, width: 80, visible: true, config: {} };
        const f9 = { id: this.genId('fld'), name: '描述', type: 'longtext', isPrimary: false, width: 200, visible: true, config: {} };
        const f10 = { id: this.genId('fld'), name: '标签', type: 'multiselect', isPrimary: false, width: 150, visible: true, config: { options: [{ label: '前端', color: 0 }, { label: '后端', color: 5 }, { label: '设计', color: 6 }, { label: '测试', color: 1 }, { label: '文档', color: 2 }] } };
        const f11 = { id: this.genId('fld'), name: '评分', type: 'rating', isPrimary: false, width: 110, visible: true, config: { max: 5 } };
        const f12 = { id: this.genId('fld'), name: '编号', type: 'auto_number', isPrimary: false, width: 90, visible: true, config: { prefix: 'T-', digits: 4 } };
        const fields1 = [f1, f2, f3, f4, f5, f6, f7, f8, f9, f10, f11, f12];
        const now = new Date();
        const tasks = [
            { name: 'CRM首页改版', status: '进行中', priority: '高', person: '张伟', days: 7, budget: 15000, progress: 60, done: false, desc: '重新设计首页布局和数据展示', tags: ['前端', '设计'], rating: 4 },
            { name: '数据库性能优化', status: '未开始', priority: '紧急', person: '李娜', days: 3, budget: 5000, progress: 0, done: false, desc: '优化慢查询，添加索引', tags: ['后端'], rating: 3 },
            { name: '用户权限系统', status: '进行中', priority: '高', person: '王强', days: 14, budget: 25000, progress: 35, done: false, desc: '实现RBAC权限管理', tags: ['后端', '前端'], rating: 4 },
            { name: '客户导入功能', status: '已完成', priority: '中', person: '赵敏', days: -5, budget: 8000, progress: 100, done: true, desc: '支持CSV和Excel导入客户数据', tags: ['前端', '后端'], rating: 5 },
            { name: '报表导出PDF', status: '未开始', priority: '中', person: '孙丽', days: 10, budget: 6000, progress: 0, done: false, desc: '生成可打印的PDF报表', tags: ['前端'], rating: 2 },
            { name: '接口文档编写', status: '已完成', priority: '低', person: '马晓', days: -10, budget: 2000, progress: 100, done: true, desc: '使用Swagger编写API文档', tags: ['文档'], rating: 4 },
            { name: '单元测试覆盖', status: '已搁置', priority: '低', person: '张伟', days: 20, budget: 3000, progress: 15, done: false, desc: '提升测试覆盖率到80%', tags: ['测试'], rating: 1 },
            { name: '移动端适配', status: '进行中', priority: '高', person: '赵敏', days: 5, budget: 12000, progress: 45, done: false, desc: '响应式布局适配手机端', tags: ['前端', '设计'], rating: 3 },
        ];
        const recs1 = tasks.map((t, i) => {
            const d = new Date(now.getTime() + t.days * 86400000);
            const created = new Date(now.getTime() - (30 - i) * 86400000).toISOString();
            const vals = {};
            vals[f1.id] = t.name; vals[f2.id] = t.status; vals[f3.id] = t.priority; vals[f4.id] = t.person;
            vals[f5.id] = d.toISOString().split('T')[0]; vals[f6.id] = t.budget; vals[f7.id] = t.progress;
            vals[f8.id] = t.done; vals[f9.id] = t.desc; vals[f10.id] = t.tags; vals[f11.id] = t.rating;
            vals[f12.id] = 'T-' + String(i + 1).padStart(4, '0');
            return { id: this.genId('rec'), values: vals, createdAt: created, updatedAt: created };
        });

        const tbl2Id = this.genId('tbl');
        const g1 = { id: this.genId('fld'), name: '客户名称', type: 'text', isPrimary: true, width: 160, visible: true, config: {} };
        const g2 = { id: this.genId('fld'), name: '联系人', type: 'text', isPrimary: false, width: 100, visible: true, config: {} };
        const g3 = { id: this.genId('fld'), name: '邮箱', type: 'email', isPrimary: false, width: 180, visible: true, config: {} };
        const g4 = { id: this.genId('fld'), name: '电话', type: 'phone', isPrimary: false, width: 130, visible: true, config: {} };
        const g5 = { id: this.genId('fld'), name: '网站', type: 'url', isPrimary: false, width: 180, visible: true, config: {} };
        const g6 = { id: this.genId('fld'), name: '等级', type: 'select', isPrimary: false, width: 80, visible: true, config: { options: [{ label: 'A', color: 1 }, { label: 'B', color: 0 }, { label: 'C', color: 2 }, { label: 'D', color: 8 }] } };
        const g7 = { id: this.genId('fld'), name: '行业', type: 'multiselect', isPrimary: false, width: 140, visible: true, config: { options: [{ label: '科技', color: 0 }, { label: '金融', color: 5 }, { label: '制造', color: 3 }, { label: '教育', color: 1 }, { label: '医疗', color: 4 }] } };
        const g8 = { id: this.genId('fld'), name: '合同金额', type: 'currency', isPrimary: false, width: 120, visible: true, config: { symbol: '¥', decimals: 2 } };
        const g9 = { id: this.genId('fld'), name: '满意度', type: 'rating', isPrimary: false, width: 110, visible: true, config: { max: 5 } };
        const g10 = { id: this.genId('fld'), name: '活跃', type: 'checkbox', isPrimary: false, width: 70, visible: true, config: {} };
        const fields2 = [g1, g2, g3, g4, g5, g6, g7, g8, g9, g10];
        const customers = [
            { name: '杭州锐创科技', contact: '陈总', email: 'chen@ruichuang.com', phone: '0571-88001234', url: 'https://ruichuang.com', level: 'A', tags: ['科技'], amount: 280000, rating: 5, active: true },
            { name: '浙江星辰教育', contact: '李主任', email: 'li@xingchen.edu', phone: '0571-85005678', url: 'https://xingchen.edu.cn', level: 'B', tags: ['教育'], amount: 150000, rating: 4, active: true },
            { name: '鑫源投资集团', contact: '王总', email: 'wang@xinyuan.cn', phone: '021-62001111', url: 'https://xinyuan.cn', level: 'A', tags: ['金融'], amount: 500000, rating: 5, active: true },
            { name: '万达制造有限', contact: '赵经理', email: 'zhao@wanda-mfg.com', phone: '0571-86002222', url: '', level: 'C', tags: ['制造'], amount: 80000, rating: 3, active: false },
            { name: '新华医疗器械', contact: '刘博士', email: 'liu@xinhua-med.cn', phone: '010-58003333', url: 'https://xinhua-med.cn', level: 'B', tags: ['医疗', '科技'], amount: 200000, rating: 4, active: true },
        ];
        const recs2 = customers.map((c, i) => {
            const created = new Date(now.getTime() - (20 - i) * 86400000).toISOString();
            const vals = {};
            vals[g1.id] = c.name; vals[g2.id] = c.contact; vals[g3.id] = c.email; vals[g4.id] = c.phone;
            vals[g5.id] = c.url; vals[g6.id] = c.level; vals[g7.id] = c.tags; vals[g8.id] = c.amount;
            vals[g9.id] = c.rating; vals[g10.id] = c.active;
            return { id: this.genId('rec'), values: vals, createdAt: created, updatedAt: created };
        });

        const v1Id = this.genId('viw'), v2Id = this.genId('viw');
        return {
            version: 2,
            activeTableId: tbl1Id,
            undoStack: [],
            redoStack: [],
            dashboards: [],
            tables: [
                {
                    id: tbl1Id, name: '项目任务', icon: '📋',
                    autoNumberCounters: { [f12.id]: 8 },
                    fields: fields1, records: recs1,
                    views: [
                        { id: v1Id, name: '网格视图', type: 'grid', filters: [], sorts: [], groupBy: null, hiddenFields: [], fieldOrder: [], rowHeight: 'medium', frozenColumns: 0, colorRules: [] },
                        { id: v2Id, name: '看板视图', type: 'kanban', filters: [], sorts: [], groupBy: null, hiddenFields: [], fieldOrder: [], rowHeight: 'medium', frozenColumns: 0, colorRules: [], kanbanField: f2.id, kanbanCardFields: [f3.id, f4.id, f7.id] }
                    ],
                    activeViewId: v1Id
                },
                {
                    id: tbl2Id, name: '客户信息', icon: '👥',
                    autoNumberCounters: {},
                    fields: fields2, records: recs2,
                    views: [{ id: this.genId('viw'), name: '网格视图', type: 'grid', filters: [], sorts: [], groupBy: null, hiddenFields: [], fieldOrder: [], rowHeight: 'medium', frozenColumns: 0, colorRules: [] }],
                    activeViewId: null
                }
            ]
        };
    }
};
