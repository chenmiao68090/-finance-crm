// ============================================================
// mt-toolbar.js - 工具栏面板系统
// 筛选、排序、分组、隐藏字段、行高、冻结列、条件着色、CSV导入
// ============================================================

MT.Toolbar = {
    activeDropdown: null,

    render(table, view) {
        const hasFilters = view.filters && view.filters.length > 0;
        const hasSorts = view.sorts && view.sorts.length > 0;
        const hasGroup = view.groupBy && view.groupBy.fieldId;
        return `<div class="mt-toolbar" id="mt-toolbar">
            <button class="mt-tool-btn ${hasFilters ? 'active' : ''}" data-action="tool-filter">
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M1.5 2.5h11L8 7.5v4l-2 1v-5L1.5 2.5z" stroke="currentColor" stroke-width="1.2"/></svg>
                筛选${hasFilters ? ' (' + view.filters.length + ')' : ''}
            </button>
            <button class="mt-tool-btn ${hasSorts ? 'active' : ''}" data-action="tool-sort">
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M4 3v8M4 3L2 5M4 3l2 2M10 11V3M10 11l-2-2M10 11l2-2" stroke="currentColor" stroke-width="1.2" stroke-linecap="round"/></svg>
                排序${hasSorts ? ' (' + view.sorts.length + ')' : ''}
            </button>
            <button class="mt-tool-btn ${hasGroup ? 'active' : ''}" data-action="tool-group">分组${hasGroup ? ' (1)' : ''}</button>
            <button class="mt-tool-btn" data-action="tool-hide">隐藏字段</button>
            <button class="mt-tool-btn" data-action="tool-rowheight">行高</button>
            <button class="mt-tool-btn" data-action="tool-color">着色</button>
            <button class="mt-tool-btn mt-tool-danger" data-action="delete-selected">删除选中</button>
            <button class="mt-tool-btn" data-action="export-csv">导出</button>
            <button class="mt-tool-btn" data-action="import-csv">导入</button>
            ${MT.Core.canUndo() ? '<button class="mt-tool-btn" data-action="undo" title="撤销 Ctrl+Z">↩</button>' : ''}
            ${MT.Core.canRedo() ? '<button class="mt-tool-btn" data-action="redo" title="重做 Ctrl+Y">↪</button>' : ''}
            <div class="mt-tool-spacer"></div>
            <div class="mt-tool-search">
                <input type="text" placeholder="搜索..." id="mt-search-input" value="${MT.Core.esc(MT.Core._searchQuery)}">
            </div>
        </div>`;
    },

    showPanel(tool) {
        this.closeDropdown();
        switch (tool) {
            case 'filter': this.showFilterPanel(); break;
            case 'sort': this.showSortPanel(); break;
            case 'group': this.showGroupPanel(); break;
            case 'hide': this.showHidePanel(); break;
            case 'rowheight': this.showRowHeightPanel(); break;
            case 'color': this.showColorPanel(); break;
        }
    },

    showFilterPanel() {
        const v = MT.Core.viw();
        const fields = MT.Core.tbl().fields.filter(f => f.visible);
        const esc = MT.Core.esc;
        const html = `<div class="mt-dd-panel">
            <div class="mt-dd-head"><span>筛选条件</span><button class="mt-dd-add" data-action="filter-add">+ 添加</button></div>
            <div class="mt-dd-body" id="mt-f-list">
                ${(!v.filters || !v.filters.length) ? '<div class="mt-dd-empty">暂无筛选条件</div>' : ''}
                ${(v.filters || []).map((f, i) => `<div class="mt-f-row" data-i="${i}">
                    <select class="mt-f-field" data-i="${i}">${fields.map(fd => `<option value="${fd.id}" ${fd.id === f.field ? 'selected' : ''}>${esc(fd.name)}</option>`).join('')}</select>
                    <select class="mt-f-op" data-i="${i}">
                        <option value="contains" ${f.op === 'contains' ? 'selected' : ''}>包含</option>
                        <option value="eq" ${f.op === 'eq' ? 'selected' : ''}>等于</option>
                        <option value="neq" ${f.op === 'neq' ? 'selected' : ''}>不等于</option>
                        <option value="gt" ${f.op === 'gt' ? 'selected' : ''}>大于</option>
                        <option value="lt" ${f.op === 'lt' ? 'selected' : ''}>小于</option>
                        <option value="empty" ${f.op === 'empty' ? 'selected' : ''}>为空</option>
                        <option value="not_empty" ${f.op === 'not_empty' ? 'selected' : ''}>不为空</option>
                        <option value="date_before" ${f.op === 'date_before' ? 'selected' : ''}>日期早于</option>
                        <option value="date_after" ${f.op === 'date_after' ? 'selected' : ''}>日期晚于</option>
                    </select>
                    <input class="mt-f-val" data-i="${i}" value="${esc(f.value || '')}">
                    <button class="mt-f-del" data-action="filter-del" data-i="${i}">×</button>
                </div>`).join('')}
            </div>
            <div class="mt-dd-foot">
                <button class="mt-dd-apply" data-action="filter-apply">应用</button>
                <button class="mt-dd-clear" data-action="filter-clear">清除全部</button>
            </div>
        </div>`;
        this._showDropdown(html);
    },

    showSortPanel() {
        const v = MT.Core.viw();
        const fields = MT.Core.tbl().fields.filter(f => f.visible);
        const esc = MT.Core.esc;
        const html = `<div class="mt-dd-panel">
            <div class="mt-dd-head"><span>排序规则</span><button class="mt-dd-add" data-action="sort-add">+ 添加</button></div>
            <div class="mt-dd-body">
                ${(!v.sorts || !v.sorts.length) ? '<div class="mt-dd-empty">暂无排序</div>' : ''}
                ${(v.sorts || []).map((s, i) => `<div class="mt-s-row" data-i="${i}">
                    <select class="mt-s-field" data-i="${i}">${fields.map(fd => `<option value="${fd.id}" ${fd.id === s.field ? 'selected' : ''}>${esc(fd.name)}</option>`).join('')}</select>
                    <select class="mt-s-order" data-i="${i}"><option value="asc" ${s.order === 'asc' ? 'selected' : ''}>升序</option><option value="desc" ${s.order === 'desc' ? 'selected' : ''}>降序</option></select>
                    <button class="mt-s-del" data-action="sort-del" data-i="${i}">×</button>
                </div>`).join('')}
            </div>
            <div class="mt-dd-foot">
                <button class="mt-dd-apply" data-action="sort-apply">应用</button>
                <button class="mt-dd-clear" data-action="sort-clear">清除全部</button>
            </div>
        </div>`;
        this._showDropdown(html);
    },

    showGroupPanel() {
        const v = MT.Core.viw();
        const fields = MT.Core.tbl().fields.filter(f => f.visible && ['select', 'multiselect', 'checkbox', 'person', 'rating'].includes(f.type));
        const curField = v.groupBy ? v.groupBy.fieldId : '';
        const curOrder = v.groupBy ? v.groupBy.order : 'asc';
        const html = `<div class="mt-dd-panel">
            <div class="mt-dd-head"><span>分组</span></div>
            <div class="mt-dd-body">
                <div class="mt-form-group"><label>分组字段</label>
                    <select id="mt-group-field">
                        <option value="">不分组</option>
                        ${fields.map(f => `<option value="${f.id}" ${f.id === curField ? 'selected' : ''}>${MT.Core.esc(f.name)}</option>`).join('')}
                    </select>
                </div>
                <div class="mt-form-group"><label>排序方向</label>
                    <select id="mt-group-order">
                        <option value="asc" ${curOrder === 'asc' ? 'selected' : ''}>升序</option>
                        <option value="desc" ${curOrder === 'desc' ? 'selected' : ''}>降序</option>
                    </select>
                </div>
            </div>
            <div class="mt-dd-foot">
                <button class="mt-dd-apply" data-action="group-apply">应用</button>
                <button class="mt-dd-clear" data-action="group-clear">清除</button>
            </div>
        </div>`;
        this._showDropdown(html);
    },

    showHidePanel() {
        const fields = MT.Core.tbl().fields;
        const v = MT.Core.viw();
        const hidden = v.hiddenFields || [];
        const html = `<div class="mt-dd-panel">
            <div class="mt-dd-head"><span>显示/隐藏字段</span></div>
            <div class="mt-dd-body">
                ${fields.map(f => `<label class="mt-hide-row">
                    <input type="checkbox" data-fid="${f.id}" ${!hidden.includes(f.id) ? 'checked' : ''} data-action="toggle-field">
                    <span>${MT.Fields.getTypeIcon(f.type)} ${MT.Core.esc(f.name)}</span>
                    ${f.isPrimary ? '<span class="mt-badge-primary">主</span>' : ''}
                </label>`).join('')}
            </div>
        </div>`;
        this._showDropdown(html);
    },

    showRowHeightPanel() {
        const v = MT.Core.viw();
        const cur = v.rowHeight || 'medium';
        const html = `<div class="mt-dd-panel">
            <div class="mt-dd-head"><span>行高设置</span></div>
            <div class="mt-dd-body">
                <div class="mt-rowheight-options">
                    <div class="mt-rowheight-opt ${cur === 'compact' ? 'active' : ''}" data-action="set-rowheight" data-val="compact">紧凑</div>
                    <div class="mt-rowheight-opt ${cur === 'medium' ? 'active' : ''}" data-action="set-rowheight" data-val="medium">标准</div>
                    <div class="mt-rowheight-opt ${cur === 'tall' ? 'active' : ''}" data-action="set-rowheight" data-val="tall">宽松</div>
                </div>
            </div>
        </div>`;
        this._showDropdown(html);
    },

    showColorPanel() {
        const v = MT.Core.viw();
        const fields = MT.Core.tbl().fields;
        const rules = v.colorRules || [];
        const esc = MT.Core.esc;
        const colors = ['#fee2e2', '#fef3c7', '#d1fae5', '#dbeafe', '#e9d5ff', '#fce7f3', '#f3f4f6'];
        const html = `<div class="mt-dd-panel" style="min-width:400px;">
            <div class="mt-dd-head"><span>条件着色</span><button class="mt-dd-add" data-action="color-add">+ 添加规则</button></div>
            <div class="mt-dd-body" id="mt-color-rules">
                ${!rules.length ? '<div class="mt-dd-empty">暂无着色规则</div>' : ''}
                ${rules.map((r, i) => `<div class="mt-color-rule-row" data-i="${i}">
                    <select class="mt-cr-field" data-i="${i}">${fields.map(f => `<option value="${f.id}" ${f.id === r.fieldId ? 'selected' : ''}>${esc(f.name)}</option>`).join('')}</select>
                    <select class="mt-cr-op" data-i="${i}">
                        <option value="eq" ${r.operator === 'eq' ? 'selected' : ''}>等于</option>
                        <option value="contains" ${r.operator === 'contains' ? 'selected' : ''}>包含</option>
                        <option value="gt" ${r.operator === 'gt' ? 'selected' : ''}>大于</option>
                        <option value="lt" ${r.operator === 'lt' ? 'selected' : ''}>小于</option>
                        <option value="is_true" ${r.operator === 'is_true' ? 'selected' : ''}>为真</option>
                    </select>
                    <input class="mt-cr-val" data-i="${i}" value="${esc(r.value || '')}" style="width:60px;">
                    <input type="color" class="mt-color-picker mt-cr-bg" data-i="${i}" value="${r.bgColor || '#fee2e2'}">
                    <button class="mt-f-del" data-action="color-del" data-i="${i}">×</button>
                </div>`).join('')}
            </div>
            <div class="mt-dd-foot">
                <button class="mt-dd-apply" data-action="color-apply">应用</button>
                <button class="mt-dd-clear" data-action="color-clear">清除全部</button>
            </div>
        </div>`;
        this._showDropdown(html);
    },

    showImportCSVDialog() {
        const modal = document.createElement('div');
        modal.className = 'mt-modal';
        modal.id = 'mt-import-modal';
        modal.innerHTML = `<div class="mt-modal-content" style="max-width:600px;">
            <div class="mt-modal-header"><h3>导入CSV</h3><button class="mt-modal-close" data-action="close-modal">×</button></div>
            <div class="mt-modal-body">
                <div class="mt-form-group">
                    <label>选择CSV文件</label>
                    <input type="file" id="mt-csv-file" accept=".csv,.tsv,.txt">
                </div>
                <div id="mt-csv-preview-area"></div>
            </div>
        </div>`;
        document.body.appendChild(modal);

        modal.querySelector('#mt-csv-file').addEventListener('change', e => {
            const file = e.target.files[0];
            if (!file) return;
            const reader = new FileReader();
            reader.onload = ev => {
                const result = MT.Core.importCSV(ev.target.result);
                this._renderCSVPreview(result, modal);
            };
            reader.readAsText(file, 'utf-8');
        });
        modal.addEventListener('click', e => { if (e.target === modal) modal.remove(); });
    },
    _renderCSVPreview(result, modal) {
        const { headers, rows } = result;
        if (!headers.length) return;
        const fields = MT.Core.tbl().fields;
        const previewArea = modal.querySelector('#mt-csv-preview-area');
        const previewRows = rows.slice(0, 5);
        previewArea.innerHTML = `
            <h4 style="margin:12px 0 8px;font-size:13px;">预览（前5行）</h4>
            <div class="mt-csv-preview"><table><tr>${headers.map(h => `<th>${MT.Core.esc(h)}</th>`).join('')}</tr>${previewRows.map(r => `<tr>${r.map(c => `<td>${MT.Core.esc(c)}</td>`).join('')}</tr>`).join('')}</table></div>
            <h4 style="margin:12px 0 8px;font-size:13px;">字段映射</h4>
            <div class="mt-csv-mapping">${headers.map((h, i) => `<div class="mt-csv-map-row">
                <span style="min-width:100px;">${MT.Core.esc(h)}</span>
                <span>→</span>
                <select data-col="${i}" class="mt-csv-map-select">
                    <option value="">跳过</option>
                    ${fields.map(f => `<option value="${f.id}" ${f.name === h ? 'selected' : ''}>${MT.Core.esc(f.name)}</option>`).join('')}
                </select>
            </div>`).join('')}</div>
            <div style="margin-top:16px;text-align:right;">
                <button class="mt-btn-primary" id="mt-csv-import-btn">导入 ${rows.length} 条记录</button>
            </div>`;
        previewArea.querySelector('#mt-csv-import-btn').addEventListener('click', () => {
            const mapping = {};
            previewArea.querySelectorAll('.mt-csv-map-select').forEach(sel => {
                if (sel.value) mapping[sel.dataset.col] = sel.value;
            });
            MT.Core.applyImport(headers, rows, mapping);
            modal.remove();
            MT.Core.emit('view:refresh', {});
        });
    },

    // ===== 面板事件处理 =====
    handlePanelAction(action, target) {
        const v = MT.Core.viw();
        switch (action) {
            case 'filter-add':
                v.filters = v.filters || [];
                v.filters.push({ field: MT.Core.tbl().fields[0].id, op: 'contains', value: '' });
                MT.Core.save(); this.closeDropdown(); this.showFilterPanel(); break;
            case 'filter-del': {
                const i = parseInt(target.dataset.i);
                v.filters.splice(i, 1); MT.Core.save(); this.closeDropdown(); this.showFilterPanel(); break;
            }
            case 'filter-apply': {
                const rows = document.querySelectorAll('.mt-f-row');
                v.filters = Array.from(rows).map(r => ({
                    field: r.querySelector('.mt-f-field').value,
                    op: r.querySelector('.mt-f-op').value,
                    value: r.querySelector('.mt-f-val').value
                }));
                MT.Core.save(); this.closeDropdown(); MT.Core.emit('view:refresh', {}); break;
            }
            case 'filter-clear':
                v.filters = []; MT.Core.save(); this.closeDropdown(); MT.Core.emit('view:refresh', {}); break;
            case 'sort-add':
                v.sorts = v.sorts || [];
                v.sorts.push({ field: MT.Core.tbl().fields[0].id, order: 'asc' });
                MT.Core.save(); this.closeDropdown(); this.showSortPanel(); break;
            case 'sort-del': {
                const i = parseInt(target.dataset.i);
                v.sorts.splice(i, 1); MT.Core.save(); this.closeDropdown(); this.showSortPanel(); break;
            }
            case 'sort-apply': {
                const rows = document.querySelectorAll('.mt-s-row');
                v.sorts = Array.from(rows).map(r => ({
                    field: r.querySelector('.mt-s-field').value,
                    order: r.querySelector('.mt-s-order').value
                }));
                MT.Core.save(); this.closeDropdown(); MT.Core.emit('view:refresh', {}); break;
            }
            case 'sort-clear':
                v.sorts = []; MT.Core.save(); this.closeDropdown(); MT.Core.emit('view:refresh', {}); break;
            case 'group-apply': {
                const fieldId = document.getElementById('mt-group-field').value;
                const order = document.getElementById('mt-group-order').value;
                v.groupBy = fieldId ? { fieldId, order, collapsed: [] } : null;
                MT.Core.save(); this.closeDropdown(); MT.Core.emit('view:refresh', {}); break;
            }
            case 'group-clear':
                v.groupBy = null; MT.Core.save(); this.closeDropdown(); MT.Core.emit('view:refresh', {}); break;
            case 'toggle-field': {
                const fid = target.dataset.fid;
                v.hiddenFields = v.hiddenFields || [];
                if (target.checked) v.hiddenFields = v.hiddenFields.filter(x => x !== fid);
                else if (!v.hiddenFields.includes(fid)) v.hiddenFields.push(fid);
                MT.Core.save(); MT.Core.emit('view:refresh', {}); break;
            }
            case 'set-rowheight':
                v.rowHeight = target.dataset.val; MT.Core.save(); this.closeDropdown(); MT.Core.emit('view:refresh', {}); break;
            case 'color-add':
                v.colorRules = v.colorRules || [];
                v.colorRules.push({ fieldId: MT.Core.tbl().fields[0].id, operator: 'eq', value: '', bgColor: '#fee2e2', textColor: '' });
                MT.Core.save(); this.closeDropdown(); this.showColorPanel(); break;
            case 'color-del': {
                const i = parseInt(target.dataset.i);
                v.colorRules.splice(i, 1); MT.Core.save(); this.closeDropdown(); this.showColorPanel(); break;
            }
            case 'color-apply': {
                const rows = document.querySelectorAll('.mt-color-rule-row');
                v.colorRules = Array.from(rows).map(r => ({
                    fieldId: r.querySelector('.mt-cr-field').value,
                    operator: r.querySelector('.mt-cr-op').value,
                    value: r.querySelector('.mt-cr-val').value,
                    bgColor: r.querySelector('.mt-cr-bg').value,
                    textColor: ''
                }));
                MT.Core.save(); this.closeDropdown(); MT.Core.emit('view:refresh', {}); break;
            }
            case 'color-clear':
                v.colorRules = []; MT.Core.save(); this.closeDropdown(); MT.Core.emit('view:refresh', {}); break;
        }
    },

    // ===== 右键菜单 =====
    showFieldMenu(fid, e) {
        this.closeContextMenu();
        const fld = MT.Core.field(fid);
        if (!fld) return;
        const menu = document.createElement('div');
        menu.className = 'mt-ctx-menu';
        menu.id = 'mt-ctx-menu';
        menu.style.left = e.clientX + 'px';
        menu.style.top = e.clientY + 'px';
        menu.innerHTML = `
            <div class="mt-ctx-item" data-action="ctx-rename-field" data-fid="${fid}">重命名</div>
            <div class="mt-ctx-item" data-action="ctx-insert-field">插入列</div>
            <div class="mt-ctx-item" data-action="ctx-hide-field" data-fid="${fid}">隐藏</div>
            <div class="mt-ctx-item" data-action="ctx-freeze" data-fid="${fid}">冻结到此列</div>
            ${fld.isPrimary ? '' : '<div class="mt-ctx-divider"></div><div class="mt-ctx-item mt-ctx-danger" data-action="ctx-delete-field" data-fid="' + fid + '">删除列</div>'}`;
        document.body.appendChild(menu);
    },
    showTableMenu(tid, e) {
        this.closeContextMenu();
        const menu = document.createElement('div');
        menu.className = 'mt-ctx-menu';
        menu.id = 'mt-ctx-menu';
        menu.style.left = e.clientX + 'px';
        menu.style.top = e.clientY + 'px';
        menu.innerHTML = `
            <div class="mt-ctx-item" data-action="ctx-rename-table" data-tid="${tid}">重命名</div>
            <div class="mt-ctx-item" data-action="ctx-dup-table" data-tid="${tid}">复制</div>
            <div class="mt-ctx-divider"></div>
            <div class="mt-ctx-item mt-ctx-danger" data-action="ctx-delete-table" data-tid="${tid}">删除</div>`;
        document.body.appendChild(menu);
    },
    closeContextMenu() {
        const m = document.getElementById('mt-ctx-menu');
        if (m) m.remove();
    },

    _showDropdown(html) {
        this.closeDropdown();
        const el = document.createElement('div');
        el.className = 'mt-dd-wrapper';
        el.id = 'mt-dd-wrapper';
        el.innerHTML = html;
        const tb = document.getElementById('mt-toolbar');
        if (tb) tb.appendChild(el);
        this.activeDropdown = el;
    },
    closeDropdown() {
        if (this.activeDropdown) { this.activeDropdown.remove(); this.activeDropdown = null; }
        const el = document.getElementById('mt-dd-wrapper');
        if (el) el.remove();
    }
};
