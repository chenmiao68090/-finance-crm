// ============================================================
// mt-grid.js - 增强网格视图
// 支持：分组、冻结列、条件着色、行高、键盘导航、复制粘贴、列宽拖拽
// ============================================================

MT.Grid = {
    focusedCell: null, // { row, col }
    editingCell: null,

    getRowHeightPx(setting) {
        return setting === 'compact' ? 28 : setting === 'tall' ? 54 : 38;
    },

    render(records, table, view) {
        const fields = this.getVisibleFields(table, view);
        const rowClass = view.rowHeight === 'compact' ? 'mt-row-compact' : view.rowHeight === 'tall' ? 'mt-row-tall' : '';
        const grouped = MT.Core.getGroupedRecords();

        if (grouped) {
            return `<div class="mt-grid ${rowClass}" id="mt-grid">
                ${this.renderHead(fields, view)}
                <div class="mt-grid-body" id="mt-grid-body">
                    ${grouped.map(g => this.renderGroup(g, fields, view)).join('')}
                </div>
                ${this.renderAddRow()}
            </div>`;
        }

        const totalW = fields.reduce((s, f) => s + (f.width || 120), 0) + 90 + 36;
        return `<div class="mt-grid ${rowClass}" id="mt-grid" style="min-width:${totalW}px;">
            ${this.renderHead(fields, view)}
            <div class="mt-grid-body" id="mt-grid-body">
                ${records.map((rec, i) => this.renderRow(rec, fields, i, view)).join('')}
            </div>
            ${this.renderAddRow()}
        </div>`;
    },

    getVisibleFields(table, view) {
        const hidden = view.hiddenFields || [];
        let fields = table.fields.filter(f => f.visible && !hidden.includes(f.id));
        if (view.fieldOrder && view.fieldOrder.length) {
            const ordered = [];
            view.fieldOrder.forEach(id => {
                const f = fields.find(x => x.id === id);
                if (f) ordered.push(f);
            });
            fields.forEach(f => { if (!ordered.includes(f)) ordered.push(f); });
            fields = ordered;
        }
        return fields;
    },

    renderHead(fields, view) {
        const frozen = view.frozenColumns || 0;
        let leftOffset = 90; // rownum(50) + check(40)
        return `<div class="mt-grid-head">
            <div class="mt-gh-cell mt-gh-rownum mt-frozen" style="width:50px;left:0;">#</div>
            <div class="mt-gh-cell mt-gh-check mt-frozen" style="width:40px;left:50px;"><input type="checkbox" id="mt-select-all"></div>
            ${fields.map((f, i) => {
                const isFrozen = i < frozen;
                const frozenStyle = isFrozen ? `position:sticky;left:${leftOffset}px;z-index:6;background:#f8fafc;` : '';
                const html = `<div class="mt-gh-cell ${isFrozen ? 'mt-frozen' : ''}" style="width:${f.width || 120}px;${frozenStyle}" data-fid="${f.id}" data-col="${i}">
                    <span class="mt-gh-icon">${MT.Fields.getTypeIcon(f.type)}</span>
                    <span class="mt-gh-label" data-fid="${f.id}">${MT.Core.esc(f.name)}</span>
                    ${f.isPrimary ? '<span class="mt-gh-primary">主</span>' : ''}
                    <span class="mt-gh-menu" data-action="field-menu" data-id="${f.id}">▾</span>
                    <div class="mt-col-resizer" data-fid="${f.id}"></div>
                </div>`;
                if (isFrozen) leftOffset += (f.width || 120);
                return html;
            }).join('')}
            <div class="mt-gh-cell mt-gh-addcol" data-action="add-field" style="width:36px">+</div>
        </div>`;
    },

    renderRow(rec, fields, index, view) {
        const frozen = view.frozenColumns || 0;
        let leftOffset = 90;
        const colorStyle = this.getRowColorStyle(rec, fields, view);
        return `<div class="mt-grid-row" data-rid="${rec.id}" data-row="${index}" ${colorStyle ? `style="${colorStyle}"` : ''}>
            <div class="mt-g-cell mt-g-rownum mt-frozen" style="width:50px;left:0;">
                <span class="mt-rownum-text">${index + 1}</span>
                <span class="mt-row-expand" data-rid="${rec.id}" data-action="expand-record">⤢</span>
            </div>
            <div class="mt-g-cell mt-g-check mt-frozen" style="width:40px;left:50px;"><input type="checkbox" class="mt-row-check" value="${rec.id}"></div>
            ${fields.map((f, i) => {
                const isFrozen = i < frozen;
                const frozenStyle = isFrozen ? `position:sticky;left:${leftOffset}px;z-index:6;background:inherit;` : '';
                const cellColor = this.getCellColorStyle(rec, f, view);
                const html = `<div class="mt-g-cell mt-g-data ${isFrozen ? 'mt-frozen' : ''}" style="width:${f.width || 120}px;${frozenStyle}${cellColor}" data-rid="${rec.id}" data-fid="${f.id}" data-row="${index}" data-col="${i}">
                    ${MT.Fields.renderCell(rec.values[f.id], f)}
                </div>`;
                if (isFrozen) leftOffset += (f.width || 120);
                return html;
            }).join('')}
        </div>`;
    },

    renderGroup(group, fields, view) {
        const collapsed = view.groupBy && view.groupBy.collapsed && view.groupBy.collapsed.includes(group.groupName);
        return `<div class="mt-group-header ${collapsed ? 'collapsed' : ''}" data-group="${MT.Core.esc(group.groupName)}" data-action="toggle-group">
            <span class="mt-group-toggle">▼</span>
            <span class="mt-group-name">${MT.Core.esc(group.groupName)}</span>
            <span class="mt-group-count">${group.records.length}</span>
            ${this.renderGroupSummary(group.records, fields)}
        </div>
        ${collapsed ? '' : group.records.map((rec, i) => this.renderRow(rec, fields, i, view)).join('')}`;
    },

    renderGroupSummary(records, fields) {
        const numFields = fields.filter(f => ['number', 'currency', 'progress'].includes(f.type));
        if (!numFields.length) return '';
        const first = numFields[0];
        const sum = records.reduce((s, r) => s + (parseFloat(r.values[first.id]) || 0), 0);
        const sym = first.type === 'currency' ? ((first.config && first.config.symbol) || '¥') : '';
        return `<span class="mt-group-summary">${first.name}: ${sym}${MT.Core.fmtNum(sum, 2)}</span>`;
    },

    renderAddRow() {
        return `<div class="mt-grid-addrow" data-action="add-record"><span>+ 添加记录</span></div>`;
    },

    // ===== 条件着色 =====
    getRowColorStyle(rec, fields, view) {
        if (!view.colorRules || !view.colorRules.length) return '';
        for (const rule of view.colorRules) {
            if (this._matchColorRule(rec, rule)) {
                return `background:${rule.bgColor || ''};color:${rule.textColor || ''};`;
            }
        }
        return '';
    },
    getCellColorStyle(rec, field, view) {
        if (!view.colorRules || !view.colorRules.length) return '';
        for (const rule of view.colorRules) {
            if (rule.fieldId === field.id && this._matchColorRule(rec, rule)) {
                return `background:${rule.bgColor || ''};color:${rule.textColor || ''};`;
            }
        }
        return '';
    },
    _matchColorRule(rec, rule) {
        const val = rec.values[rule.fieldId];
        const target = rule.value;
        switch (rule.operator) {
            case 'eq': return String(val) === String(target);
            case 'neq': return String(val) !== String(target);
            case 'contains': return String(val || '').toLowerCase().includes((target || '').toLowerCase());
            case 'gt': return parseFloat(val) > parseFloat(target);
            case 'lt': return parseFloat(val) < parseFloat(target);
            case 'empty': return !val || val === '';
            case 'not_empty': return val && val !== '';
            case 'is_true': return val === true;
            case 'is_false': return val !== true;
            default: return false;
        }
    },

    // ===== 编辑 =====
    startEdit(cell) {
        if (this.editingCell) this.finishEdit();
        const rid = cell.dataset.rid, fid = cell.dataset.fid;
        const rec = MT.Core.record(rid);
        const fld = MT.Core.field(fid);
        if (!rec || !fld) return;
        if (MT.Fields.isReadOnly(fld.type)) return;

        this.editingCell = { cell, rid, fid, row: parseInt(cell.dataset.row), col: parseInt(cell.dataset.col) };
        cell.classList.add('editing');
        const val = rec.values[fid];
        const result = MT.Fields.createEditor(cell, fld, val, rid);

        if (result === 'instant') {
            this.editingCell = null;
            cell.classList.remove('editing');
            MT.Core.emit('view:refresh', {});
            return;
        }
        if (result === 'dropdown') {
            // 下拉编辑器，等待外部点击关闭
            return;
        }
        // 文本类输入框
        if (result && result.tagName) {
            const input = result;
            input.addEventListener('keydown', e => {
                if (e.key === 'Enter' && fld.type !== 'longtext') this.finishEdit();
                if (e.key === 'Escape') { this.editingCell = null; MT.Core.emit('view:refresh', {}); }
                if (e.key === 'Tab') { e.preventDefault(); this.finishEdit(); this.moveCell(e.shiftKey ? -1 : 1, 0); }
            });
            input.addEventListener('blur', () => setTimeout(() => this.finishEdit(), 150));
        }
    },
    finishEdit() {
        if (!this.editingCell) return;
        const { cell, rid, fid } = this.editingCell;
        const fld = MT.Core.field(fid);
        const input = cell.querySelector('.mt-edit-input') || cell.querySelector('input[type="range"]');
        if (input && fld) {
            let val;
            if (input._getVal) val = input._getVal();
            else val = MT.Fields.getEditValue(input, fld);
            if (val !== null) MT.Core.updateRecordField(rid, fid, val);
        }
        this.editingCell = null;
        MT.Core.emit('view:refresh', {});
    },

    // ===== 键盘导航 =====
    handleKeydown(e) {
        if (this.editingCell) return; // 编辑模式下不处理导航
        if (!this.focusedCell) return;

        switch (e.key) {
            case 'ArrowUp': e.preventDefault(); this.moveCell(0, -1); break;
            case 'ArrowDown': e.preventDefault(); this.moveCell(0, 1); break;
            case 'ArrowLeft': e.preventDefault(); this.moveCell(-1, 0); break;
            case 'ArrowRight': e.preventDefault(); this.moveCell(1, 0); break;
            case 'Enter': e.preventDefault(); this.editFocusedCell(); break;
            case 'Delete': case 'Backspace':
                if (!this.editingCell) { e.preventDefault(); this.clearFocusedCell(); }
                break;
            case 'Tab':
                e.preventDefault();
                this.moveCell(e.shiftKey ? -1 : 1, 0);
                break;
        }
    },
    setFocusedCell(row, col) {
        this.clearFocus();
        this.focusedCell = { row, col };
        const cell = document.querySelector(`.mt-g-data[data-row="${row}"][data-col="${col}"]`);
        if (cell) cell.classList.add('mt-cell-focused');
    },
    clearFocus() {
        document.querySelectorAll('.mt-cell-focused').forEach(el => el.classList.remove('mt-cell-focused'));
        this.focusedCell = null;
    },
    moveCell(dx, dy) {
        if (!this.focusedCell) { this.setFocusedCell(0, 0); return; }
        const { row, col } = this.focusedCell;
        const newRow = row + dy;
        const newCol = col + dx;
        const maxRow = document.querySelectorAll('.mt-grid-row').length - 1;
        const maxCol = document.querySelectorAll('.mt-grid-head .mt-gh-cell[data-fid]').length - 1;
        if (newRow < 0 || newRow > maxRow || newCol < 0 || newCol > maxCol) return;
        this.setFocusedCell(newRow, newCol);
    },
    editFocusedCell() {
        if (!this.focusedCell) return;
        const cell = document.querySelector(`.mt-g-data[data-row="${this.focusedCell.row}"][data-col="${this.focusedCell.col}"]`);
        if (cell) this.startEdit(cell);
    },
    clearFocusedCell() {
        if (!this.focusedCell) return;
        const cell = document.querySelector(`.mt-g-data[data-row="${this.focusedCell.row}"][data-col="${this.focusedCell.col}"]`);
        if (cell) {
            const rid = cell.dataset.rid, fid = cell.dataset.fid;
            const fld = MT.Core.field(fid);
            if (fld && !MT.Fields.isReadOnly(fld.type)) {
                MT.Core.updateRecordField(rid, fid, MT.Core.defaultVal(fld));
                MT.Core.emit('view:refresh', {});
            }
        }
    },

    // ===== 复制粘贴 =====
    handleCopy() {
        if (!this.focusedCell) return;
        const cell = document.querySelector(`.mt-g-data[data-row="${this.focusedCell.row}"][data-col="${this.focusedCell.col}"]`);
        if (!cell) return;
        const rid = cell.dataset.rid, fid = cell.dataset.fid;
        const rec = MT.Core.record(rid);
        if (!rec) return;
        let val = rec.values[fid];
        if (Array.isArray(val)) val = val.join(', ');
        if (typeof val === 'object' && val !== null) val = JSON.stringify(val);
        if (val === null || val === undefined) val = '';
        navigator.clipboard.writeText(String(val)).catch(() => {});
    },
    handlePaste() {
        if (!this.focusedCell) return;
        navigator.clipboard.readText().then(text => {
            if (!text) return;
            const cell = document.querySelector(`.mt-g-data[data-row="${this.focusedCell.row}"][data-col="${this.focusedCell.col}"]`);
            if (!cell) return;
            const rid = cell.dataset.rid, fid = cell.dataset.fid;
            const fld = MT.Core.field(fid);
            if (!fld || MT.Fields.isReadOnly(fld.type)) return;

            // 多单元格粘贴
            const rows = text.split('\n').filter(r => r);
            if (rows.length === 1 && !rows[0].includes('\t')) {
                // 单个值
                let val = text.trim();
                if (fld.type === 'number' || fld.type === 'currency') val = parseFloat(val) || 0;
                else if (fld.type === 'checkbox') val = ['true', '1', 'yes'].includes(val.toLowerCase());
                MT.Core.updateRecordField(rid, fid, val);
            } else {
                // 多行多列粘贴
                const table = MT.Core.tbl();
                const view = MT.Core.viw();
                const fields = this.getVisibleFields(table, view);
                const records = MT.Core.getProcessedRecords();
                const startRow = this.focusedCell.row;
                const startCol = this.focusedCell.col;
                rows.forEach((rowText, ri) => {
                    const cols = rowText.split('\t');
                    cols.forEach((colText, ci) => {
                        const recIdx = startRow + ri;
                        const fldIdx = startCol + ci;
                        if (recIdx >= records.length || fldIdx >= fields.length) return;
                        const targetRec = records[recIdx];
                        const targetFld = fields[fldIdx];
                        if (MT.Fields.isReadOnly(targetFld.type)) return;
                        let val = colText.trim();
                        if (targetFld.type === 'number' || targetFld.type === 'currency') val = parseFloat(val) || 0;
                        MT.Core.updateRecordField(targetRec.id, targetFld.id, val);
                    });
                });
            }
            MT.Core.emit('view:refresh', {});
        }).catch(() => {});
    },

    // ===== 列宽拖拽 =====
    startResize(resizer, e) {
        const fid = resizer.dataset.fid;
        const fld = MT.Core.field(fid);
        if (!fld) return;
        e.preventDefault();
        const startX = e.clientX, startW = fld.width || 120;
        const onMove = ev => {
            fld.width = Math.max(60, startW + ev.clientX - startX);
            document.querySelectorAll(`[data-fid="${fid}"]`).forEach(el => {
                if (el.classList.contains('mt-gh-cell') || el.classList.contains('mt-g-data'))
                    el.style.width = fld.width + 'px';
            });
        };
        const onUp = () => {
            document.removeEventListener('mousemove', onMove);
            document.removeEventListener('mouseup', onUp);
            MT.Core.save();
        };
        document.addEventListener('mousemove', onMove);
        document.addEventListener('mouseup', onUp);
    },

    // ===== 全选 =====
    toggleSelectAll(checked) {
        document.querySelectorAll('.mt-row-check').forEach(cb => cb.checked = checked);
    },
    getSelectedIds() {
        return Array.from(document.querySelectorAll('.mt-row-check:checked')).map(cb => cb.value);
    }
};
