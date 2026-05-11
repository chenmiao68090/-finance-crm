// 公司日记账模块 - 飞书多维表格风格
// 支持多表管理、工具栏（筛选/排序/分组/隐藏/搜索）、列右键菜单

const FinanceJournal = {
    workspaceKey: 'zhqf_fj_workspace',
    workspace: null,
    entries: [],
    columns: [],
    editingCell: null,
    searchQuery: '',
    activeDropdown: null,
    contextMenu: null,

    // ===== 默认列定义 =====
    defaultColumns: [
        { key: 'date', label: '日期', type: 'date', width: 120, visible: true },
        { key: 'type', label: '类型', type: 'select', width: 80, visible: true, options: ['收入', '支出', '转账'] },
        { key: 'category', label: '科目', type: 'select', width: 120, visible: true, options: ['服务收入', '咨询费', '工资', '房租', '办公用品', '交通费', '招待费', '税费', '社保', '广告费', '设备采购', '其他'] },
        { key: 'amount', label: '金额(元)', type: 'number', width: 130, visible: true },
        { key: 'counterparty', label: '往来单位/人', type: 'text', width: 160, visible: true },
        { key: 'account', label: '账户', type: 'select', width: 100, visible: true, options: ['基本户', '一般户', '现金', '支付宝', '微信'] },
        { key: 'handler', label: '经办人', type: 'text', width: 90, visible: true },
        { key: 'remark', label: '备注', type: 'text', width: 200, visible: true },
        { key: 'status', label: '审核状态', type: 'select', width: 100, visible: true, options: ['待审核', '已审核', '已驳回'] }
    ],

    // ===== 生命周期 =====
    init() {
        this.loadWorkspace();
        this.syncActiveTable();
        const contentArea = document.querySelector('.content-area');
        contentArea.innerHTML = this.render();
        this.bindEvents();
    },

    destroy() {
        this.editingCell = null;
        this.closeDropdown();
        this.closeContextMenu();
    },

    // ===== 数据层 =====
    loadWorkspace() {
        const saved = localStorage.getItem(this.workspaceKey);
        if (saved) {
            this.workspace = JSON.parse(saved);
            return;
        }
        // 尝试从旧版迁移
        const oldEntries = localStorage.getItem('zhqf_finance_journal_v2');
        const oldColumns = localStorage.getItem('zhqf_fj_columns');
        if (oldEntries || oldColumns) {
            this.migrateFromV1(oldEntries, oldColumns);
            return;
        }
        // 全新创建
        this.workspace = this.createDefaultWorkspace();
        this.saveWorkspace();
    },

    migrateFromV1(oldEntries, oldColumns) {
        const entries = oldEntries ? JSON.parse(oldEntries) : [];
        const columns = oldColumns ? JSON.parse(oldColumns) : JSON.parse(JSON.stringify(this.defaultColumns));
        columns.forEach(c => { if (c.visible === undefined) c.visible = true; });

        this.workspace = {
            version: 2,
            activeTableId: 'table_default',
            tables: [{
                id: 'table_default',
                name: '公司日记账',
                icon: '📊',
                columns: columns,
                entries: entries,
                views: [{ id: 'view_default', name: '表格视图', type: 'grid', filters: [], sorts: [], groupBy: null }],
                activeViewId: 'view_default'
            }]
        };
        this.saveWorkspace();
        localStorage.removeItem('zhqf_finance_journal_v2');
        localStorage.removeItem('zhqf_fj_columns');
    },

    createDefaultWorkspace() {
        const entries = this.generateMockData();
        return {
            version: 2,
            activeTableId: 'table_default',
            tables: [{
                id: 'table_default',
                name: '公司日记账',
                icon: '📊',
                columns: JSON.parse(JSON.stringify(this.defaultColumns)),
                entries: entries,
                views: [{ id: 'view_default', name: '表格视图', type: 'grid', filters: [], sorts: [], groupBy: null }],
                activeViewId: 'view_default'
            }]
        };
    },

    saveWorkspace() {
        localStorage.setItem(this.workspaceKey, JSON.stringify(this.workspace));
    },

    getActiveTable() {
        return this.workspace.tables.find(t => t.id === this.workspace.activeTableId) || this.workspace.tables[0];
    },

    getActiveView() {
        const table = this.getActiveTable();
        return table.views.find(v => v.id === table.activeViewId) || table.views[0];
    },

    syncActiveTable() {
        const table = this.getActiveTable();
        this.entries = table.entries;
        this.columns = table.columns;
    },

    // ===== 表格CRUD =====
    addTable(name) {
        const id = 'table_' + Date.now();
        const icons = ['📋', '📈', '📁', '💰', '📑', '🗂️'];
        const icon = icons[this.workspace.tables.length % icons.length];
        this.workspace.tables.push({
            id,
            name: name || '新建数据表',
            icon,
            columns: JSON.parse(JSON.stringify(this.defaultColumns)),
            entries: [],
            views: [{ id: 'view_' + Date.now(), name: '表格视图', type: 'grid', filters: [], sorts: [], groupBy: null }],
            activeViewId: 'view_' + Date.now()
        });
        this.workspace.activeTableId = id;
        this.saveWorkspace();
        this.syncActiveTable();
        this.refreshAll();
    },

    renameTable(tableId, newName) {
        const table = this.workspace.tables.find(t => t.id === tableId);
        if (table && newName.trim()) {
            table.name = newName.trim();
            this.saveWorkspace();
            this.refreshSidebar();
        }
    },

    deleteTable(tableId) {
        if (this.workspace.tables.length <= 1) return;
        this.workspace.tables = this.workspace.tables.filter(t => t.id !== tableId);
        if (this.workspace.activeTableId === tableId) {
            this.workspace.activeTableId = this.workspace.tables[0].id;
        }
        this.saveWorkspace();
        this.syncActiveTable();
        this.refreshAll();
    },

    switchTable(tableId) {
        if (this.workspace.activeTableId === tableId) return;
        this.workspace.activeTableId = tableId;
        this.saveWorkspace();
        this.syncActiveTable();
        this.searchQuery = '';
        this.refreshSidebar();
        this.refreshMain();
    },

    // ===== 数据管道 =====
    getProcessedData() {
        let data = [...this.entries];
        const view = this.getActiveView();

        // 筛选
        if (view.filters && view.filters.length > 0) {
            data = this.applyFilters(data, view.filters);
        }
        // 排序
        if (view.sorts && view.sorts.length > 0) {
            data = this.applySorts(data, view.sorts);
        }
        // 搜索
        if (this.searchQuery) {
            data = this.applySearch(data, this.searchQuery);
        }
        return data;
    },

    applyFilters(data, filters) {
        return data.filter(row => {
            return filters.every(f => {
                const val = row[f.field];
                const target = f.value;
                switch (f.operator) {
                    case 'equals': return String(val) === String(target);
                    case 'not_equals': return String(val) !== String(target);
                    case 'contains': return String(val || '').includes(target);
                    case 'gt': return parseFloat(val) > parseFloat(target);
                    case 'lt': return parseFloat(val) < parseFloat(target);
                    case 'is_empty': return !val || val === '';
                    case 'is_not_empty': return val && val !== '';
                    default: return true;
                }
            });
        });
    },

    applySorts(data, sorts) {
        return data.sort((a, b) => {
            for (const s of sorts) {
                let va = a[s.field] || '', vb = b[s.field] || '';
                const col = this.columns.find(c => c.key === s.field);
                if (col && col.type === 'number') { va = parseFloat(va) || 0; vb = parseFloat(vb) || 0; }
                if (va < vb) return s.order === 'asc' ? -1 : 1;
                if (va > vb) return s.order === 'asc' ? 1 : -1;
            }
            return 0;
        });
    },

    applySearch(data, query) {
        const q = query.toLowerCase();
        const visibleCols = this.columns.filter(c => c.visible);
        return data.filter(row => {
            return visibleCols.some(col => {
                const val = row[col.key];
                return val && String(val).toLowerCase().includes(q);
            });
        });
    },

    // ===== 渲染 =====
    render() {
        return `<div class="fj-page">
            ${this.renderSidebar()}
            <div class="fj-main">
                ${this.renderMain()}
            </div>
        </div>`;
    },

    renderSidebar() {
        const tables = this.workspace.tables;
        const activeId = this.workspace.activeTableId;
        return `<div class="fj-sidebar">
            <div class="fj-sidebar-header">
                <span class="fj-sidebar-title">数据表</span>
            </div>
            <div class="fj-sidebar-list">
                ${tables.map(t => `
                <div class="fj-sidebar-item ${t.id === activeId ? 'active' : ''}" data-table-id="${t.id}">
                    <span class="fj-table-icon">${t.icon}</span>
                    <span class="fj-table-name">${t.name}</span>
                    <span class="fj-table-menu-btn" data-table-id="${t.id}">&#8943;</span>
                </div>`).join('')}
            </div>
            <div class="fj-sidebar-add" id="fj-add-table-btn">
                <span>+ 新建数据表</span>
            </div>
        </div>`;
    },

    renderMain() {
        const table = this.getActiveTable();
        const view = this.getActiveView();
        const data = this.getProcessedData();
        const totalIncome = this.entries.filter(e => e.type === '收入').reduce((s, e) => s + (parseFloat(e.amount) || 0), 0);
        const totalExpense = this.entries.filter(e => e.type === '支出').reduce((s, e) => s + (parseFloat(e.amount) || 0), 0);

        const hasFilters = view.filters && view.filters.length > 0;
        const hasSorts = view.sorts && view.sorts.length > 0;
        const hasGroup = !!view.groupBy;

        return `
        <div class="fj-main-header">
            <h2 class="fj-main-title">${table.name}</h2>
            <span class="fj-record-count">${data.length} 条记录</span>
        </div>
        <div class="fj-toolbar">
            <button class="fj-toolbar-item ${hasFilters ? 'active' : ''}" data-tool="filter">
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M1.5 2.5h11L8 7.5v4l-2 1v-5L1.5 2.5z" stroke="currentColor" stroke-width="1.2"/></svg>
                筛选${hasFilters ? ' (' + view.filters.length + ')' : ''}
            </button>
            <button class="fj-toolbar-item ${hasSorts ? 'active' : ''}" data-tool="sort">
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M3 4l3-3 3 3M3 10l3 3 3-3M6 1v12" stroke="currentColor" stroke-width="1.2"/></svg>
                排序${hasSorts ? ' (' + view.sorts.length + ')' : ''}
            </button>
            <button class="fj-toolbar-item" data-tool="hide">
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M1 7s2.5-4 6-4 6 4 6 4-2.5 4-6 4-6-4-6-4z" stroke="currentColor" stroke-width="1.2"/><circle cx="7" cy="7" r="2" stroke="currentColor" stroke-width="1.2"/></svg>
                隐藏字段
            </button>
            <div class="fj-toolbar-spacer"></div>
            <div class="fj-toolbar-search">
                <input type="text" placeholder="搜索..." value="${this.searchQuery}" id="fj-search-input">
            </div>
        </div>
        <div class="fj-stats-bar">
            <span class="fj-stat income">收入 ¥${this.fmtNum(totalIncome)}</span>
            <span class="fj-stat expense">支出 ¥${this.fmtNum(totalExpense)}</span>
            <span class="fj-stat balance">结余 ¥${this.fmtNum(totalIncome - totalExpense)}</span>
        </div>
        <div class="fj-grid-container" id="fj-grid-container">
            ${this.renderGrid(data)}
        </div>
        <div class="fj-tips">
            <span>单击单元格编辑 | 双击列标题改名 | 右键列标题更多操作 | 拖拽列边界调整宽度</span>
        </div>`;
    },

    renderGrid(data) {
        const visibleCols = this.columns.filter(c => c.visible);
        const totalWidth = visibleCols.reduce((s, c) => s + c.width, 0) + 40 + 40 + 30;
        const view = this.getActiveView();

        // 分组
        let groups = null;
        if (view.groupBy) {
            groups = new Map();
            data.forEach(row => {
                const gVal = row[view.groupBy] || '(空)';
                if (!groups.has(gVal)) groups.set(gVal, []);
                groups.get(gVal).push(row);
            });
        }

        return `
        <div class="fj-grid" style="min-width:${totalWidth}px;">
            <div class="fj-grid-header">
                <div class="fj-grid-cell fj-cell-rownum" style="width:40px;">#</div>
                <div class="fj-grid-cell fj-cell-checkbox" style="width:40px;">
                    <input type="checkbox" id="fj-select-all">
                </div>
                ${visibleCols.map((col, idx) => `
                <div class="fj-grid-hcell" style="width:${col.width}px;" data-col-idx="${this.columns.indexOf(col)}" data-col-key="${col.key}">
                    <span class="fj-hcell-type-icon">${this.getTypeIcon(col.type)}</span>
                    <span class="fj-hcell-label" data-col-idx="${this.columns.indexOf(col)}">${col.label}</span>
                    <span class="fj-hcell-menu" data-col-idx="${this.columns.indexOf(col)}">▾</span>
                    <div class="fj-col-resize" data-col-idx="${this.columns.indexOf(col)}"></div>
                </div>`).join('')}
                <div class="fj-grid-cell fj-cell-add-col" id="fj-btn-add-col" style="width:30px;" title="添加列">+</div>
            </div>
            <div class="fj-grid-body">
                ${groups ? this.renderGroupedRows(groups, visibleCols) : this.renderRows(data, visibleCols)}
            </div>
            <div class="fj-grid-add-row" id="fj-inline-add-row">
                <span>+ 添加新记录</span>
            </div>
        </div>`;
    },

    renderRows(data, visibleCols, startIdx = 0) {
        return data.map((row, rIdx) => `
        <div class="fj-grid-row" data-row-id="${row.id}">
            <div class="fj-grid-cell fj-cell-rownum" style="width:40px;">${startIdx + rIdx + 1}</div>
            <div class="fj-grid-cell fj-cell-checkbox" style="width:40px;">
                <input type="checkbox" class="fj-row-check" value="${row.id}">
            </div>
            ${visibleCols.map(col => `
            <div class="fj-grid-cell fj-cell-data" style="width:${col.width}px;" data-row-id="${row.id}" data-col-key="${col.key}" data-col-idx="${this.columns.indexOf(col)}">
                ${this.renderCellContent(row, col)}
            </div>`).join('')}
        </div>`).join('');
    },

    renderGroupedRows(groups, visibleCols) {
        let html = '';
        let idx = 0;
        for (const [groupVal, rows] of groups) {
            html += `<div class="fj-group-header"><span class="fj-group-label">${groupVal}</span><span class="fj-group-count">${rows.length}</span></div>`;
            html += this.renderRows(rows, visibleCols, idx);
            idx += rows.length;
        }
        return html;
    },

    renderCellContent(row, col) {
        const val = row[col.key];
        if (col.key === 'amount' || col.type === 'number') {
            const type = row.type;
            const cls = type === '收入' ? 'income' : 'expense';
            const prefix = type === '收入' ? '+' : '-';
            return `<span class="fj-cell-amount ${cls}">${prefix}${this.fmtNum(val)}</span>`;
        }
        if (col.key === 'type') {
            const cls = val === '收入' ? 'fj-tag-income' : val === '支出' ? 'fj-tag-expense' : 'fj-tag-transfer';
            return `<span class="fj-cell-tag ${cls}">${val || ''}</span>`;
        }
        if (col.key === 'status') {
            const cls = val === '已审核' ? 'fj-tag-approved' : val === '已驳回' ? 'fj-tag-rejected' : 'fj-tag-pending';
            return `<span class="fj-cell-tag ${cls}">${val || ''}</span>`;
        }
        if (col.type === 'select' && val) {
            return `<span class="fj-cell-tag fj-tag-default">${val}</span>`;
        }
        return `<span class="fj-cell-text">${val !== undefined && val !== null ? val : ''}</span>`;
    },

    getTypeIcon(type) {
        const icons = { text: 'T', number: '#', date: '📅', select: '▤' };
        return icons[type] || 'T';
    },

    fmtNum(n) {
        return parseFloat(n || 0).toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    },

    // ===== 事件绑定 =====
    bindEvents() {
        const page = document.querySelector('.fj-page');
        if (!page) return;

        // 侧边栏
        page.addEventListener('click', (e) => {
            // 切换表格
            const sideItem = e.target.closest('.fj-sidebar-item');
            if (sideItem && !e.target.closest('.fj-table-menu-btn')) {
                this.switchTable(sideItem.dataset.tableId);
                return;
            }
            // 表格菜单按钮
            const menuBtn = e.target.closest('.fj-table-menu-btn');
            if (menuBtn) {
                e.stopPropagation();
                this.showTableContextMenu(menuBtn.dataset.tableId, e);
                return;
            }
            // 新建表格
            if (e.target.closest('#fj-add-table-btn')) {
                this.showAddTableDialog();
                return;
            }
        });

        // 侧边栏双击重命名
        page.addEventListener('dblclick', (e) => {
            const sideItem = e.target.closest('.fj-sidebar-item');
            if (sideItem) {
                this.startRenameSidebarItem(sideItem);
                return;
            }
        });

        // 主区域事件
        const main = page.querySelector('.fj-main');
        if (!main) return;

        // 工具栏
        main.addEventListener('click', (e) => {
            const toolItem = e.target.closest('.fj-toolbar-item');
            if (toolItem) {
                this.handleToolbarClick(toolItem.dataset.tool, toolItem);
                return;
            }
            // 添加列
            if (e.target.closest('#fj-btn-add-col')) {
                this.showAddColumnDialog();
                return;
            }
            // 添加行
            if (e.target.closest('#fj-inline-add-row')) {
                this.addRow();
                return;
            }
            // 列标题菜单
            const hcellMenu = e.target.closest('.fj-hcell-menu');
            if (hcellMenu) {
                e.stopPropagation();
                this.showColumnContextMenu(parseInt(hcellMenu.dataset.colIdx), e);
                return;
            }
            // 单元格编辑
            const cell = e.target.closest('.fj-cell-data');
            if (cell) {
                this.startEditCell(cell);
                return;
            }
        });

        // 双击列标题修改名称
        main.addEventListener('dblclick', (e) => {
            const label = e.target.closest('.fj-hcell-label');
            if (label) {
                this.startEditColumnLabel(label);
            }
        });

        // 右键列标题
        main.addEventListener('contextmenu', (e) => {
            const hcell = e.target.closest('.fj-grid-hcell');
            if (hcell) {
                e.preventDefault();
                this.showColumnContextMenu(parseInt(hcell.dataset.colIdx), e);
            }
        });

        // 列宽拖拽
        main.addEventListener('mousedown', (e) => {
            const resizer = e.target.closest('.fj-col-resize');
            if (resizer) {
                e.preventDefault();
                this.startResize(resizer, e);
            }
        });

        // 全选
        main.addEventListener('change', (e) => {
            if (e.target.id === 'fj-select-all') {
                main.querySelectorAll('.fj-row-check').forEach(cb => cb.checked = e.target.checked);
            }
        });

        // 搜索
        const searchInput = document.getElementById('fj-search-input');
        if (searchInput) {
            let timer;
            searchInput.addEventListener('input', (e) => {
                clearTimeout(timer);
                timer = setTimeout(() => {
                    this.searchQuery = e.target.value;
                    this.refreshGrid();
                }, 200);
            });
        }

        // 点击空白关闭
        document.addEventListener('click', (e) => {
            if (this.editingCell && !e.target.closest('.fj-cell-data') && !e.target.closest('.fj-edit-input')) {
                this.finishEdit();
            }
            if (this.activeDropdown && !e.target.closest('.fj-dropdown-panel') && !e.target.closest('.fj-toolbar-item')) {
                this.closeDropdown();
            }
            if (this.contextMenu && !e.target.closest('.fj-context-menu')) {
                this.closeContextMenu();
            }
        });
    },

    // ===== 工具栏 =====
    handleToolbarClick(tool, btn) {
        this.closeDropdown();
        if (tool === 'filter') this.showFilterPanel(btn);
        else if (tool === 'sort') this.showSortPanel(btn);
        else if (tool === 'hide') this.showHideFieldsPanel(btn);
    },

    showFilterPanel(anchor) {
        const view = this.getActiveView();
        const filters = view.filters || [];
        const visibleCols = this.columns.filter(c => c.visible);

        const html = `
        <div class="fj-dropdown-panel fj-filter-panel">
            <div class="fj-panel-header">
                <span>筛选条件</span>
                <button class="fj-panel-add-btn" id="fj-add-filter">+ 添加条件</button>
            </div>
            <div class="fj-panel-body" id="fj-filter-list">
                ${filters.length === 0 ? '<div class="fj-panel-empty">暂无筛选条件</div>' : ''}
                ${filters.map((f, i) => `
                <div class="fj-filter-row" data-idx="${i}">
                    <select class="fj-filter-field" data-idx="${i}">
                        ${visibleCols.map(c => `<option value="${c.key}" ${c.key === f.field ? 'selected' : ''}>${c.label}</option>`).join('')}
                    </select>
                    <select class="fj-filter-op" data-idx="${i}">
                        <option value="contains" ${f.operator === 'contains' ? 'selected' : ''}>包含</option>
                        <option value="equals" ${f.operator === 'equals' ? 'selected' : ''}>等于</option>
                        <option value="not_equals" ${f.operator === 'not_equals' ? 'selected' : ''}>不等于</option>
                        <option value="gt" ${f.operator === 'gt' ? 'selected' : ''}>大于</option>
                        <option value="lt" ${f.operator === 'lt' ? 'selected' : ''}>小于</option>
                        <option value="is_empty" ${f.operator === 'is_empty' ? 'selected' : ''}>为空</option>
                        <option value="is_not_empty" ${f.operator === 'is_not_empty' ? 'selected' : ''}>不为空</option>
                    </select>
                    <input class="fj-filter-value" data-idx="${i}" value="${f.value || ''}" placeholder="值">
                    <button class="fj-filter-del" data-idx="${i}">×</button>
                </div>`).join('')}
            </div>
            <div class="fj-panel-footer">
                <button class="fj-panel-apply" id="fj-apply-filter">应用</button>
                <button class="fj-panel-clear" id="fj-clear-filter">清除全部</button>
            </div>
        </div>`;

        this.showDropdown(html, anchor);
        this.bindFilterEvents();
    },

    bindFilterEvents() {
        const panel = document.querySelector('.fj-filter-panel');
        if (!panel) return;

        panel.querySelector('#fj-add-filter').addEventListener('click', () => {
            const view = this.getActiveView();
            view.filters = view.filters || [];
            const firstCol = this.columns.find(c => c.visible);
            view.filters.push({ field: firstCol ? firstCol.key : '', operator: 'contains', value: '' });
            this.saveWorkspace();
            this.closeDropdown();
            this.showFilterPanel(document.querySelector('[data-tool="filter"]'));
        });

        panel.querySelector('#fj-apply-filter').addEventListener('click', () => {
            const view = this.getActiveView();
            const rows = panel.querySelectorAll('.fj-filter-row');
            view.filters = Array.from(rows).map(row => ({
                field: row.querySelector('.fj-filter-field').value,
                operator: row.querySelector('.fj-filter-op').value,
                value: row.querySelector('.fj-filter-value').value
            }));
            this.saveWorkspace();
            this.closeDropdown();
            this.refreshMain();
        });

        panel.querySelector('#fj-clear-filter').addEventListener('click', () => {
            const view = this.getActiveView();
            view.filters = [];
            this.saveWorkspace();
            this.closeDropdown();
            this.refreshMain();
        });

        panel.querySelectorAll('.fj-filter-del').forEach(btn => {
            btn.addEventListener('click', () => {
                const view = this.getActiveView();
                view.filters.splice(parseInt(btn.dataset.idx), 1);
                this.saveWorkspace();
                this.closeDropdown();
                this.showFilterPanel(document.querySelector('[data-tool="filter"]'));
            });
        });
    },

    showSortPanel(anchor) {
        const view = this.getActiveView();
        const sorts = view.sorts || [];
        const visibleCols = this.columns.filter(c => c.visible);

        const html = `
        <div class="fj-dropdown-panel fj-sort-panel">
            <div class="fj-panel-header">
                <span>排序规则</span>
                <button class="fj-panel-add-btn" id="fj-add-sort">+ 添加排序</button>
            </div>
            <div class="fj-panel-body" id="fj-sort-list">
                ${sorts.length === 0 ? '<div class="fj-panel-empty">暂无排序规则</div>' : ''}
                ${sorts.map((s, i) => `
                <div class="fj-sort-row" data-idx="${i}">
                    <select class="fj-sort-field" data-idx="${i}">
                        ${visibleCols.map(c => `<option value="${c.key}" ${c.key === s.field ? 'selected' : ''}>${c.label}</option>`).join('')}
                    </select>
                    <select class="fj-sort-order" data-idx="${i}">
                        <option value="asc" ${s.order === 'asc' ? 'selected' : ''}>升序 A→Z</option>
                        <option value="desc" ${s.order === 'desc' ? 'selected' : ''}>降序 Z→A</option>
                    </select>
                    <button class="fj-sort-del" data-idx="${i}">×</button>
                </div>`).join('')}
            </div>
            <div class="fj-panel-footer">
                <button class="fj-panel-apply" id="fj-apply-sort">应用</button>
                <button class="fj-panel-clear" id="fj-clear-sort">清除全部</button>
            </div>
        </div>`;

        this.showDropdown(html, anchor);
        this.bindSortEvents();
    },

    bindSortEvents() {
        const panel = document.querySelector('.fj-sort-panel');
        if (!panel) return;

        panel.querySelector('#fj-add-sort').addEventListener('click', () => {
            const view = this.getActiveView();
            view.sorts = view.sorts || [];
            const firstCol = this.columns.find(c => c.visible);
            view.sorts.push({ field: firstCol ? firstCol.key : '', order: 'asc' });
            this.saveWorkspace();
            this.closeDropdown();
            this.showSortPanel(document.querySelector('[data-tool="sort"]'));
        });

        panel.querySelector('#fj-apply-sort').addEventListener('click', () => {
            const view = this.getActiveView();
            const rows = panel.querySelectorAll('.fj-sort-row');
            view.sorts = Array.from(rows).map(row => ({
                field: row.querySelector('.fj-sort-field').value,
                order: row.querySelector('.fj-sort-order').value
            }));
            this.saveWorkspace();
            this.closeDropdown();
            this.refreshMain();
        });

        panel.querySelector('#fj-clear-sort').addEventListener('click', () => {
            const view = this.getActiveView();
            view.sorts = [];
            this.saveWorkspace();
            this.closeDropdown();
            this.refreshMain();
        });

        panel.querySelectorAll('.fj-sort-del').forEach(btn => {
            btn.addEventListener('click', () => {
                const view = this.getActiveView();
                view.sorts.splice(parseInt(btn.dataset.idx), 1);
                this.saveWorkspace();
                this.closeDropdown();
                this.showSortPanel(document.querySelector('[data-tool="sort"]'));
            });
        });
    },

    showHideFieldsPanel(anchor) {
        const html = `
        <div class="fj-dropdown-panel fj-hide-panel">
            <div class="fj-panel-header"><span>显示/隐藏字段</span></div>
            <div class="fj-panel-body">
                ${this.columns.map((col, i) => `
                <label class="fj-hide-row">
                    <input type="checkbox" ${col.visible ? 'checked' : ''} data-col-idx="${i}">
                    <span class="fj-hide-icon">${this.getTypeIcon(col.type)}</span>
                    <span>${col.label}</span>
                </label>`).join('')}
            </div>
        </div>`;

        this.showDropdown(html, anchor);

        const panel = document.querySelector('.fj-hide-panel');
        panel.querySelectorAll('input[type="checkbox"]').forEach(cb => {
            cb.addEventListener('change', () => {
                const idx = parseInt(cb.dataset.colIdx);
                this.columns[idx].visible = cb.checked;
                this.saveWorkspace();
                this.refreshGrid();
            });
        });
    },

    showDropdown(html, anchor) {
        this.closeDropdown();
        const el = document.createElement('div');
        el.className = 'fj-dropdown-wrapper';
        el.innerHTML = html;
        const toolbar = document.querySelector('.fj-toolbar');
        toolbar.style.position = 'relative';
        toolbar.appendChild(el);
        this.activeDropdown = el;
    },

    closeDropdown() {
        if (this.activeDropdown) {
            this.activeDropdown.remove();
            this.activeDropdown = null;
        }
    },

    // ===== 列右键菜单 =====
    showColumnContextMenu(colIdx, event) {
        this.closeContextMenu();
        const col = this.columns[colIdx];
        if (!col) return;

        const menu = document.createElement('div');
        menu.className = 'fj-context-menu';
        menu.style.left = event.clientX + 'px';
        menu.style.top = event.clientY + 'px';
        menu.innerHTML = `
            <div class="fj-context-menu-item" data-action="rename" data-idx="${colIdx}">重命名</div>
            <div class="fj-context-menu-item" data-action="insert-left" data-idx="${colIdx}">在左侧插入列</div>
            <div class="fj-context-menu-item" data-action="insert-right" data-idx="${colIdx}">在右侧插入列</div>
            <div class="fj-context-menu-divider"></div>
            <div class="fj-context-menu-item" data-action="hide" data-idx="${colIdx}">隐藏此列</div>
            <div class="fj-context-menu-item fj-ctx-danger" data-action="delete" data-idx="${colIdx}">删除此列</div>
        `;
        document.body.appendChild(menu);
        this.contextMenu = menu;

        menu.addEventListener('click', (e) => {
            const item = e.target.closest('.fj-context-menu-item');
            if (!item) return;
            const action = item.dataset.action;
            const idx = parseInt(item.dataset.idx);
            this.closeContextMenu();
            this.handleColumnAction(action, idx);
        });
    },

    showTableContextMenu(tableId, event) {
        this.closeContextMenu();
        const menu = document.createElement('div');
        menu.className = 'fj-context-menu';
        menu.style.left = event.clientX + 'px';
        menu.style.top = event.clientY + 'px';
        menu.innerHTML = `
            <div class="fj-context-menu-item" data-action="rename-table" data-id="${tableId}">重命名</div>
            <div class="fj-context-menu-item" data-action="duplicate-table" data-id="${tableId}">复制</div>
            <div class="fj-context-menu-divider"></div>
            <div class="fj-context-menu-item fj-ctx-danger" data-action="delete-table" data-id="${tableId}">删除</div>
        `;
        document.body.appendChild(menu);
        this.contextMenu = menu;

        menu.addEventListener('click', (e) => {
            const item = e.target.closest('.fj-context-menu-item');
            if (!item) return;
            const action = item.dataset.action;
            const id = item.dataset.id;
            this.closeContextMenu();
            if (action === 'rename-table') {
                const name = prompt('请输入新名称');
                if (name) this.renameTable(id, name);
            } else if (action === 'duplicate-table') {
                const src = this.workspace.tables.find(t => t.id === id);
                if (src) {
                    const copy = JSON.parse(JSON.stringify(src));
                    copy.id = 'table_' + Date.now();
                    copy.name = src.name + ' (副本)';
                    this.workspace.tables.push(copy);
                    this.workspace.activeTableId = copy.id;
                    this.saveWorkspace();
                    this.syncActiveTable();
                    this.refreshAll();
                }
            } else if (action === 'delete-table') {
                if (confirm('确定删除此数据表？')) this.deleteTable(id);
            }
        });
    },

    closeContextMenu() {
        if (this.contextMenu) {
            this.contextMenu.remove();
            this.contextMenu = null;
        }
    },

    handleColumnAction(action, colIdx) {
        if (action === 'rename') {
            const label = document.querySelector(`.fj-hcell-label[data-col-idx="${colIdx}"]`);
            if (label) this.startEditColumnLabel(label);
        } else if (action === 'insert-left' || action === 'insert-right') {
            const pos = action === 'insert-left' ? colIdx : colIdx + 1;
            const key = 'custom_' + Date.now();
            const newCol = { key, label: '新列', type: 'text', width: 120, visible: true };
            this.columns.splice(pos, 0, newCol);
            this.entries.forEach(row => { row[key] = ''; });
            this.saveWorkspace();
            this.refreshGrid();
        } else if (action === 'hide') {
            this.columns[colIdx].visible = false;
            this.saveWorkspace();
            this.refreshGrid();
        } else if (action === 'delete') {
            if (!confirm('确定删除此列？')) return;
            const key = this.columns[colIdx].key;
            this.columns.splice(colIdx, 1);
            this.entries.forEach(row => { delete row[key]; });
            this.saveWorkspace();
            this.refreshGrid();
        }
    },

    // ===== 单元格编辑 =====
    startEditCell(cell) {
        if (this.editingCell) this.finishEdit();
        const rowId = cell.dataset.rowId;
        const colKey = cell.dataset.colKey;
        const col = this.columns.find(c => c.key === colKey);
        const row = this.entries.find(r => r.id === rowId);
        if (!col || !row) return;

        this.editingCell = { cell, rowId, colKey };
        cell.classList.add('editing');
        const currentVal = row[colKey] !== undefined ? row[colKey] : '';

        if (col.type === 'select' && col.options) {
            const select = document.createElement('select');
            select.className = 'fj-edit-input';
            col.options.forEach(opt => {
                const o = document.createElement('option');
                o.value = opt; o.textContent = opt;
                if (opt === String(currentVal)) o.selected = true;
                select.appendChild(o);
            });
            cell.innerHTML = '';
            cell.appendChild(select);
            select.focus();
            select.addEventListener('change', () => this.finishEdit());
            select.addEventListener('blur', () => this.finishEdit());
        } else if (col.type === 'date') {
            const input = document.createElement('input');
            input.type = 'date'; input.className = 'fj-edit-input'; input.value = currentVal;
            cell.innerHTML = ''; cell.appendChild(input); input.focus();
            input.addEventListener('change', () => this.finishEdit());
            input.addEventListener('blur', () => this.finishEdit());
        } else {
            const input = document.createElement('input');
            input.type = col.type === 'number' ? 'number' : 'text';
            input.className = 'fj-edit-input'; input.value = currentVal;
            if (col.type === 'number') input.step = '0.01';
            cell.innerHTML = ''; cell.appendChild(input); input.focus(); input.select();
            input.addEventListener('keydown', (e) => {
                if (e.key === 'Enter') this.finishEdit();
                if (e.key === 'Escape') { this.editingCell = null; this.refreshGrid(); }
                if (e.key === 'Tab') { e.preventDefault(); this.finishEdit(); this.editNextCell(cell, e.shiftKey); }
            });
            input.addEventListener('blur', () => this.finishEdit());
        }
    },

    finishEdit() {
        if (!this.editingCell) return;
        const { cell, rowId, colKey } = this.editingCell;
        const input = cell.querySelector('.fj-edit-input');
        if (!input) { this.editingCell = null; return; }
        const row = this.entries.find(r => r.id === rowId);
        const col = this.columns.find(c => c.key === colKey);
        if (row && col) {
            let val = input.value;
            if (col.type === 'number') val = parseFloat(val) || 0;
            row[colKey] = val;
            this.saveWorkspace();
        }
        this.editingCell = null;
        this.refreshGrid();
    },

    editNextCell(currentCell, backward) {
        const cells = Array.from(document.querySelectorAll('.fj-cell-data'));
        const idx = cells.indexOf(currentCell);
        const nextIdx = backward ? idx - 1 : idx + 1;
        if (nextIdx >= 0 && nextIdx < cells.length) {
            this.startEditCell(cells[nextIdx]);
        }
    },

    // ===== 列标题编辑 =====
    startEditColumnLabel(labelEl) {
        const idx = parseInt(labelEl.dataset.colIdx);
        const col = this.columns[idx];
        if (!col) return;
        const input = document.createElement('input');
        input.type = 'text'; input.className = 'fj-edit-input fj-edit-header'; input.value = col.label;
        labelEl.replaceWith(input); input.focus(); input.select();
        const finish = () => {
            const newLabel = input.value.trim();
            if (newLabel && newLabel !== col.label) { col.label = newLabel; this.saveWorkspace(); }
            this.refreshGrid();
        };
        input.addEventListener('keydown', (e) => { if (e.key === 'Enter') finish(); if (e.key === 'Escape') this.refreshGrid(); });
        input.addEventListener('blur', finish);
    },

    // ===== 列宽拖拽 =====
    startResize(resizer, e) {
        const idx = parseInt(resizer.dataset.colIdx);
        const col = this.columns[idx];
        const startX = e.clientX;
        const startWidth = col.width;
        const onMove = (ev) => {
            col.width = Math.max(60, startWidth + (ev.clientX - startX));
            document.querySelectorAll(`[data-col-idx="${idx}"]`).forEach(el => {
                if (el.classList.contains('fj-grid-hcell') || el.classList.contains('fj-cell-data')) {
                    el.style.width = col.width + 'px';
                }
            });
        };
        const onUp = () => {
            document.removeEventListener('mousemove', onMove);
            document.removeEventListener('mouseup', onUp);
            this.saveWorkspace();
        };
        document.addEventListener('mousemove', onMove);
        document.addEventListener('mouseup', onUp);
    },

    // ===== 行操作 =====
    addRow() {
        const newRow = { id: 'row_' + Date.now() };
        this.columns.forEach(col => {
            if (col.type === 'date') newRow[col.key] = new Date().toISOString().split('T')[0];
            else if (col.type === 'number') newRow[col.key] = 0;
            else if (col.type === 'select' && col.options) newRow[col.key] = col.options[0];
            else newRow[col.key] = '';
        });
        this.entries.unshift(newRow);
        this.saveWorkspace();
        this.refreshGrid();
        setTimeout(() => {
            const firstCell = document.querySelector(`.fj-cell-data[data-row-id="${newRow.id}"]`);
            if (firstCell) this.startEditCell(firstCell);
        }, 50);
    },

    deleteSelectedRows() {
        const checked = document.querySelectorAll('.fj-row-check:checked');
        if (checked.length === 0) return;
        if (!confirm(`确定删除选中的 ${checked.length} 行？`)) return;
        const ids = new Set(Array.from(checked).map(cb => cb.value));
        const table = this.getActiveTable();
        table.entries = table.entries.filter(e => !ids.has(e.id));
        this.syncActiveTable();
        this.saveWorkspace();
        this.refreshGrid();
    },

    // ===== 添加列 =====
    showAddColumnDialog() {
        const modal = document.createElement('div');
        modal.className = 'modal active';
        modal.innerHTML = `
            <div class="modal-content" style="max-width: 400px;">
                <div class="modal-header"><h3>添加列</h3><button class="modal-close">&times;</button></div>
                <form id="fj-add-col-form">
                    <div class="form-group"><label>列名称</label><input type="text" name="label" placeholder="输入列名" required></div>
                    <div class="form-group"><label>字段类型</label>
                        <select name="type"><option value="text">文本</option><option value="number">数字</option><option value="date">日期</option><option value="select">下拉选择</option></select>
                    </div>
                    <div class="form-group" id="fj-col-options-group" style="display:none;">
                        <label>选项（逗号分隔）</label><input type="text" name="options" placeholder="选项1,选项2,选项3">
                    </div>
                    <div class="form-actions"><button type="button" class="btn-secondary modal-cancel">取消</button><button type="submit" class="btn-primary">添加</button></div>
                </form>
            </div>`;
        document.body.appendChild(modal);
        const typeSelect = modal.querySelector('select[name="type"]');
        const optGroup = modal.querySelector('#fj-col-options-group');
        typeSelect.addEventListener('change', () => { optGroup.style.display = typeSelect.value === 'select' ? '' : 'none'; });
        modal.querySelector('.modal-close').addEventListener('click', () => modal.remove());
        modal.querySelector('.modal-cancel').addEventListener('click', () => modal.remove());
        modal.addEventListener('click', (e) => { if (e.target === modal) modal.remove(); });
        modal.querySelector('#fj-add-col-form').addEventListener('submit', (e) => {
            e.preventDefault();
            const form = e.target;
            const label = form.label.value.trim();
            if (!label) return;
            const type = form.type.value;
            const key = 'custom_' + Date.now();
            const newCol = { key, label, type, width: 120, visible: true };
            if (type === 'select') newCol.options = form.options.value.split(',').map(s => s.trim()).filter(Boolean);
            this.columns.push(newCol);
            this.entries.forEach(row => {
                if (type === 'number') row[key] = 0;
                else if (type === 'select' && newCol.options && newCol.options.length) row[key] = newCol.options[0];
                else row[key] = '';
            });
            this.saveWorkspace();
            modal.remove();
            this.refreshGrid();
        });
    },

    // ===== 新建表格对话框 =====
    showAddTableDialog() {
        const name = prompt('请输入数据表名称', '新数据表');
        if (name && name.trim()) this.addTable(name.trim());
    },

    // ===== 侧边栏重命名 =====
    startRenameSidebarItem(item) {
        const tableId = item.dataset.tableId;
        const nameEl = item.querySelector('.fj-table-name');
        const currentName = nameEl.textContent;
        const input = document.createElement('input');
        input.type = 'text'; input.className = 'fj-edit-input fj-sidebar-rename';
        input.value = currentName;
        nameEl.replaceWith(input); input.focus(); input.select();
        const finish = () => {
            const newName = input.value.trim();
            if (newName) this.renameTable(tableId, newName);
            else this.refreshSidebar();
        };
        input.addEventListener('keydown', (e) => { if (e.key === 'Enter') finish(); if (e.key === 'Escape') this.refreshSidebar(); });
        input.addEventListener('blur', finish);
    },

    // ===== 刷新 =====
    refreshAll() {
        const contentArea = document.querySelector('.content-area');
        contentArea.innerHTML = this.render();
        this.bindEvents();
    },

    refreshSidebar() {
        const sidebar = document.querySelector('.fj-sidebar');
        if (sidebar) sidebar.outerHTML = this.renderSidebar();
    },

    refreshMain() {
        const main = document.querySelector('.fj-main');
        if (main) {
            main.innerHTML = this.renderMain();
            // 重新绑定搜索
            const searchInput = document.getElementById('fj-search-input');
            if (searchInput) {
                let timer;
                searchInput.addEventListener('input', (e) => {
                    clearTimeout(timer);
                    timer = setTimeout(() => {
                        this.searchQuery = e.target.value;
                        this.refreshGrid();
                    }, 200);
                });
            }
        }
    },

    refreshGrid() {
        const container = document.getElementById('fj-grid-container');
        if (container) {
            const data = this.getProcessedData();
            container.innerHTML = this.renderGrid(data);
        }
    },

    // ===== Mock数据 =====
    generateMockData() {
        const now = new Date();
        const entries = [];
        const categories = { '收入': ['服务收入', '咨询费'], '支出': ['工资', '房租', '办公用品', '交通费', '招待费', '税费', '社保', '广告费', '设备采购'], '转账': ['其他'] };
        const counterparties = ['杭州锐创科技', '浙江星辰有限公司', '新华贸易集团', '鑫源投资公司', '万达物业', '中国电信', '阿里云', '顺丰速运'];
        const handlers = ['李娜', '杨梅', '孙丽', '马晓'];
        const accounts = ['基本户', '一般户', '现金', '支付宝', '微信'];
        const remarks = ['代理记账服务费', '工商注册代理费', '员工工资', '办公室租金', '办公用品采购', '出差交通', '客户接待', '增值税', '员工社保'];

        for (let i = 0; i < 25; i++) {
            const daysAgo = Math.floor(Math.random() * 45);
            const d = new Date(now.getTime() - daysAgo * 86400000);
            const type = ['收入', '支出', '支出', '支出', '收入', '转账'][Math.floor(Math.random() * 6)];
            const cats = categories[type];
            const category = cats[Math.floor(Math.random() * cats.length)];
            let amount;
            if (type === '收入') amount = (Math.random() * 50000 + 5000).toFixed(2);
            else if (category === '工资') amount = (Math.random() * 8000 + 5000).toFixed(2);
            else amount = (Math.random() * 5000 + 100).toFixed(2);

            entries.push({
                id: 'row_' + (i + 1),
                date: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`,
                type, category,
                amount: parseFloat(amount),
                counterparty: counterparties[Math.floor(Math.random() * counterparties.length)],
                account: accounts[Math.floor(Math.random() * accounts.length)],
                handler: handlers[Math.floor(Math.random() * handlers.length)],
                remark: remarks[Math.floor(Math.random() * remarks.length)],
                status: ['待审核', '已审核', '已审核', '已审核'][Math.floor(Math.random() * 4)]
            });
        }
        return entries.sort((a, b) => b.date.localeCompare(a.date));
    }
};
