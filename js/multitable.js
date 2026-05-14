// ============================================================
// 多维表格 Facade 编排层
// 职责：页面布局、事件委托、模块协调、记录详情面板
// 依赖：MT.Core, MT.Fields, MT.Grid, MT.Views, MT.Toolbar, MT.Dashboard
// ============================================================

const MultiTable = {
  container: null,
  currentMode: 'table', // 'table' | 'dashboard'
  recordPanel: null,

  // ===== 生命周期 =====
  init() {
    MT.Core.init();
    const ca = document.querySelector('.content-area');
    ca.innerHTML = this.renderPage();
    this.container = ca.querySelector('.mt-page');
    this.bindEvents();
    this.refresh();
    // 监听核心事件（保存绑定引用以便off）
    this._boundDataChanged = this._onDataChanged.bind(this);
    this._boundViewSwitch = this._onViewSwitched.bind(this);
    this._boundTableSwitch = this._onTableSwitched.bind(this);
    this._boundDashRefresh = this._onDashboardRefresh.bind(this);
    MT.Core.on('data:changed', this._boundDataChanged);
    MT.Core.on('view:switch', this._boundViewSwitch);
    MT.Core.on('table:switch', this._boundTableSwitch);
    MT.Core.on('dashboard:refresh', this._boundDashRefresh);
  },

  destroy() {
    MT.Core.off('data:changed', this._boundDataChanged);
    MT.Core.off('view:switch', this._boundViewSwitch);
    MT.Core.off('table:switch', this._boundTableSwitch);
    MT.Core.off('dashboard:refresh', this._boundDashRefresh);
    MT.Dashboard.destroyAllCharts();
    if (this._globalKeyHandler) {
      document.removeEventListener('keydown', this._globalKeyHandler);
      this._globalKeyHandler = null;
    }
    this.container = null;
    this.recordPanel = null;
  },

  // ===== 页面骨架 =====
  renderPage() {
    return `<div class="mt-page">
      <div class="mt-sidebar">${this.renderSidebar()}</div>
      <div class="mt-main">
        <div class="mt-topbar">${this.renderTopbar()}</div>
        <div class="mt-toolbar-area"></div>
        <div class="mt-content-area"></div>
      </div>
    </div>`;
  },

  // ===== 侧边栏 =====
  renderSidebar() {
    const ws = MT.Core.getState();
    const tables = ws.tables || [];
    const curTable = MT.Core.getCurrentTable();
    const dashboards = ws.dashboards || [];
    let html = '<div class="mt-sidebar-header"><span class="mt-sidebar-title">多维表格</span>';
    html += '<button class="mt-btn-icon mt-sidebar-add" data-action="add-table" title="新建表"><i class="fas fa-plus"></i></button></div>';
    html += '<div class="mt-sidebar-tables">';
    tables.forEach(function(t) {
      const active = curTable && t.id === curTable.id ? ' active' : '';
      html += '<div class="mt-sidebar-table-item' + active + '" data-action="switch-table" data-id="' + t.id + '">';
      html += '<i class="fas fa-table"></i><span>' + MT.Core.esc(t.name) + '</span>';
      html += '<button class="mt-btn-icon mt-table-menu-btn" data-action="table-menu" data-id="' + t.id + '"><i class="fas fa-ellipsis-h"></i></button>';
      html += '</div>';
    });
    html += '</div>';
    // 仪表盘入口
    html += '<div class="mt-sidebar-section"><span class="mt-sidebar-section-title">仪表盘</span></div>';
    html += '<div class="mt-sidebar-dashboards">';
    if (dashboards.length) {
      dashboards.forEach(function(d) {
        html += '<div class="mt-sidebar-table-item' + (MultiTable.currentMode === 'dashboard' ? ' active' : '') + '" data-action="switch-dashboard" data-id="' + d.id + '">';
        html += '<i class="fas fa-chart-pie"></i><span>' + MT.Core.esc(d.name) + '</span></div>';
      });
    } else {
      html += '<div class="mt-sidebar-table-item" data-action="add-dashboard"><i class="fas fa-plus"></i><span>新建仪表盘</span></div>';
    }
    html += '</div>';
    return html;
  },

  // ===== 顶部视图切换栏 =====
  renderTopbar() {
    if (this.currentMode === 'dashboard') {
      return '<div class="mt-view-tabs"><span class="mt-view-tab active"><i class="fas fa-chart-pie"></i> 仪表盘</span></div>';
    }
    const table = MT.Core.getCurrentTable();
    if (!table) return '';
    const views = table.views || [];
    const curView = MT.Core.getCurrentView();
    let html = '<div class="mt-view-tabs">';
    views.forEach(function(v) {
      const active = curView && v.id === curView.id ? ' active' : '';
      const icons = { grid: 'fa-th-list', kanban: 'fa-columns', gallery: 'fa-th-large', gantt: 'fa-stream', calendar: 'fa-calendar-alt', form: 'fa-wpforms' };
      const icon = icons[v.type] || 'fa-th-list';
      html += '<span class="mt-view-tab' + active + '" data-action="switch-view" data-id="' + v.id + '">';
      html += '<i class="fas ' + icon + '"></i> ' + MT.Core.esc(v.name) + '</span>';
    });
    html += '<button class="mt-btn-icon" data-action="add-view" title="新建视图"><i class="fas fa-plus"></i></button>';
    html += '</div>';
    return html;
  },

  // ===== 刷新主内容 =====
  refresh() {
    if (!this.container) return;
    // 侧边栏
    const sidebar = this.container.querySelector('.mt-sidebar');
    if (sidebar) sidebar.innerHTML = this.renderSidebar();
    // 顶栏
    const topbar = this.container.querySelector('.mt-topbar');
    if (topbar) topbar.innerHTML = this.renderTopbar();

    if (this.currentMode === 'dashboard') {
      this.renderDashboard();
      return;
    }

    const table = MT.Core.getCurrentTable();
    const view = MT.Core.getCurrentView();
    if (!table || !view) return;

    // 工具栏
    const toolbarArea = this.container.querySelector('.mt-toolbar-area');
    if (toolbarArea) toolbarArea.innerHTML = MT.Toolbar.render(table, view);

    // 内容区
    const contentArea = this.container.querySelector('.mt-content-area');
    if (!contentArea) return;

    const records = MT.Core.getProcessedRecords();

    switch (view.type) {
      case 'grid':
        contentArea.innerHTML = MT.Grid.render(records, table, view);
        break;
      case 'kanban':
        contentArea.innerHTML = MT.Views.renderKanban(records, table, view);
        break;
      case 'gallery':
        contentArea.innerHTML = MT.Views.renderGallery(records, table, view);
        break;
      case 'gantt':
        contentArea.innerHTML = MT.Views.renderGantt(records, table, view);
        break;
      case 'calendar':
        contentArea.innerHTML = MT.Views.renderCalendar(records, table, view);
        break;
      case 'form':
        contentArea.innerHTML = MT.Views.renderForm(table, view);
        break;
      default:
        contentArea.innerHTML = MT.Grid.render(records, table, view);
    }
  },

  // ===== 仪表盘渲染 =====
  renderDashboard() {
    const toolbarArea = this.container.querySelector('.mt-toolbar-area');
    if (toolbarArea) toolbarArea.innerHTML = '';
    const contentArea = this.container.querySelector('.mt-content-area');
    if (!contentArea) return;
    const ws = MT.Core.getState();
    const dashboard = (ws.dashboards || [])[0];
    contentArea.innerHTML = MT.Dashboard.render(dashboard);
    // 延迟渲染图表（需要DOM就绪）
    setTimeout(function() { MT.Dashboard.renderCharts(dashboard); }, 50);
  },

  // ===== 事件委托 =====
  bindEvents() {
    const self = this;
    this.container.addEventListener('click', function(e) { self.handleClick(e); });
    this.container.addEventListener('dblclick', function(e) { self.handleDblClick(e); });
    this.container.addEventListener('input', function(e) { self.handleInput(e); });
    this.container.addEventListener('keydown', function(e) { self.handleKeydown(e); });
    this.container.addEventListener('mousedown', function(e) { self.handleMouseDown(e); });
    this.container.addEventListener('change', function(e) { self.handleChange(e); });
    // 全局键盘快捷键
    this._globalKeyHandler = function(e) { self.handleGlobalKey(e); };
    document.addEventListener('keydown', this._globalKeyHandler);
  },

  handleClick(e) {
    const target = e.target.closest('[data-action]');
    if (!target) {
      // 点击单元格设置焦点（用于键盘导航）
      const cell = e.target.closest('.mt-g-data');
      if (cell && cell.dataset.row !== undefined) {
        MT.Grid.setFocusedCell(parseInt(cell.dataset.row), parseInt(cell.dataset.col));
      }
      // 点击空白处关闭下拉
      MT.Toolbar.closeDropdown();
      MT.Toolbar.closeContextMenu();
      return;
    }
    const action = target.dataset.action;
    e.stopPropagation();

    switch (action) {
      // --- 表操作 ---
      case 'add-table': this.addTable(); break;
      case 'switch-table': MT.Core.switchTable(target.dataset.id); break;
      case 'table-menu': MT.Toolbar.showTableMenu(target.dataset.id, e); break;
      
      // --- 视图操作 ---
      case 'switch-view': MT.Core.switchView(target.dataset.id); break;
      case 'add-view': this.showAddViewDialog(); break;
      
      // --- 记录操作 ---
      case 'add-record': this.addRecord(); break;
      case 'open-record': this.openRecordPanel(target.dataset.id || target.closest('[data-record-id]').dataset.recordId); break;
      case 'delete-selected': this.deleteSelected(); break;
      case 'dup-record': this.duplicateRecord(target.dataset.id); break;
      
      // --- 字段操作 ---
      case 'add-field': this.showAddFieldDialog(); break;
      case 'field-menu': MT.Toolbar.showFieldMenu(target.dataset.id, e); break;
      
      // --- 工具栏面板 ---
      case 'tool-filter': case 'show-filter': MT.Toolbar.showFilterPanel(); break;
      case 'tool-sort': case 'show-sort': MT.Toolbar.showSortPanel(); break;
      case 'tool-group': case 'show-group': MT.Toolbar.showGroupPanel(); break;
      case 'tool-hide': case 'show-hide': MT.Toolbar.showHidePanel(); break;
      case 'tool-rowheight': case 'show-row-height': MT.Toolbar.showRowHeightPanel(); break;
      case 'tool-color': case 'show-color': MT.Toolbar.showColorPanel(); break;
      case 'export-csv': MT.Core.exportCSV(); break;
      case 'import-csv': MT.Toolbar.showImportCSVDialog(); break;
      case 'undo': MT.Core.undo(); break;
      case 'redo': MT.Core.redo(); break;
      
      // --- 仪表盘 ---
      case 'switch-dashboard': this.currentMode = 'dashboard'; this.refresh(); break;
      case 'add-dashboard': MT.Core.addDashboard('仪表盘'); this.currentMode = 'dashboard'; this.refresh(); break;
      case 'add-widget': this.showAddWidgetDialog(); break;
      case 'confirm-add-widget': MT.Dashboard.handleAddWidget(); this.closeModal(); this.renderDashboard(); break;
      case 'widget-config': this.showWidgetConfigDialog(target.dataset.widget); break;
      case 'confirm-widget-config': MT.Dashboard.handleWidgetConfig(); this.closeModal(); this.renderDashboard(); break;
      case 'widget-delete': MT.Dashboard.deleteWidget(target.dataset.widget); this.renderDashboard(); break;
      case 'dashboard-fullscreen': this.toggleFullscreen(); break;

      // --- 记录面板 ---
      case 'close-record-panel': this.closeRecordPanel(); break;
      case 'delete-record-panel': this.deleteRecordFromPanel(); break;
      
      // --- 模态框 ---
      case 'close-modal': this.closeModal(); break;
      case 'confirm-add-field': this.confirmAddField(); break;
      case 'confirm-add-view': this.confirmAddView(); break;
      
      // --- 选择操作 ---
      case 'select-all': {
        const cb = target.querySelector('input[type="checkbox"]') || target;
        MT.Grid.toggleSelectAll(cb.checked);
        break;
      }
      case 'select-row': break;

      // --- 记录展开/分组折叠 ---
      case 'expand-record': this.openRecordPanel(target.dataset.rid || target.closest('[data-rid]').dataset.rid); break;
      case 'toggle-group': {
        const groupName = target.dataset.group || target.closest('[data-group]').dataset.group;
        const view = MT.Core.getCurrentView();
        if (view && view.groupBy) {
          view.groupBy.collapsed = view.groupBy.collapsed || [];
          const idx = view.groupBy.collapsed.indexOf(groupName);
          if (idx > -1) view.groupBy.collapsed.splice(idx, 1);
          else view.groupBy.collapsed.push(groupName);
          MT.Core.save();
          this.refreshContent();
        }
        break;
      }

      // --- 看板拖拽 ---
      case 'kanban-card': this.openRecordPanel(target.dataset.recordId || target.closest('[data-record-id]').dataset.recordId); break;

      // --- 日历导航 ---
      case 'cal-prev': MT.Views.calNavigate(-1); this.refreshContent(); break;
      case 'cal-next': MT.Views.calNavigate(1); this.refreshContent(); break;
      case 'cal-today': MT.Views.calNavigate(0); this.refreshContent(); break;

      // --- 甘特图缩放 ---
      case 'gantt-scale': this.setGanttScale(target.dataset.scale); break;

      // --- 表单 ---
      case 'form-again': this.refreshContent(); break;

      // --- 表单提交 ---
      case 'submit-form': {
        const form = this.container.querySelector('.mt-form-view');
        if (form) MT.Views.handleFormSubmit(form, MT.Core.getCurrentTable(), MT.Core.getCurrentView());
        break;
      }

      default:
        // 委托给工具栏处理面板内操作
        MT.Toolbar.handlePanelAction(action, target);
        break;
    }
  },

  handleDblClick(e) {
    // 双击单元格进入编辑
    const cell = e.target.closest('.mt-cell');
    if (cell && !cell.classList.contains('mt-cell-checkbox') && !cell.classList.contains('mt-cell-index')) {
      MT.Grid.startEdit(cell);
    }
    // 双击表名编辑
    const tableItem = e.target.closest('.mt-sidebar-table-item');
    if (tableItem && tableItem.dataset.action === 'switch-table') {
      this.renameTable(tableItem.dataset.id);
    }
  },

  handleInput(e) {
    // 搜索框
    if (e.target.id === 'mt-search-input') {
      MT.Core.setSearchQuery(e.target.value);
      this.refreshContent();
    }
  },

  handleKeydown(e) {
    // Grid键盘导航
    const contentArea = this.container.querySelector('.mt-content-area');
    if (contentArea && contentArea.querySelector('.mt-grid')) {
      MT.Grid.handleKeydown(e);
    }
  },

  handleMouseDown(e) {
    // 列宽调整
    const resizer = e.target.closest('.mt-col-resizer');
    if (resizer) {
      e.preventDefault();
      MT.Grid.startResize(resizer, e);
    }
  },

  handleChange(e) {
    // 全选checkbox
    if (e.target.id === 'mt-select-all') {
      MT.Grid.toggleSelectAll(e.target.checked);
      return;
    }
    // 行选择checkbox
    if (e.target.classList.contains('mt-row-check')) {
      // Selection state is managed by the checkbox itself
    }
    // 表单字段
    if (e.target.closest('.mt-form-view')) {
      // handled by form submit
    }
  },

  handleGlobalKey(e) {
    if (!this.container) return;
    // Ctrl+Z / Ctrl+Y
    if (e.ctrlKey && e.key === 'z' && !e.shiftKey) { e.preventDefault(); MT.Core.undo(); this.refresh(); }
    if (e.ctrlKey && (e.key === 'y' || (e.key === 'z' && e.shiftKey))) { e.preventDefault(); MT.Core.redo(); this.refresh(); }
    // Ctrl+C / Ctrl+V in grid
    if (e.ctrlKey && e.key === 'c') { MT.Grid.handleCopy(e); }
    if (e.ctrlKey && e.key === 'v') { MT.Grid.handlePaste(e); }
    // Escape closes panels/modals
    if (e.key === 'Escape') {
      this.closeModal();
      this.closeRecordPanel();
      MT.Toolbar.closeDropdown();
      MT.Toolbar.closeContextMenu();
    }
  },

  // ===== 事件回调 =====
  _onDataChanged() { this.refresh(); },
  _onViewSwitched() { this.currentMode = 'table'; this.refresh(); },
  _onTableSwitched() { this.currentMode = 'table'; this.refresh(); },
  _onDashboardRefresh() { if (this.currentMode === 'dashboard') this.renderDashboard(); },

  // ===== 仅刷新内容区（不刷新侧边栏） =====
  refreshContent() {
    if (this.currentMode === 'dashboard') { this.renderDashboard(); return; }
    const table = MT.Core.getCurrentTable();
    const view = MT.Core.getCurrentView();
    if (!table || !view) return;
    const contentArea = this.container.querySelector('.mt-content-area');
    if (!contentArea) return;
    const records = MT.Core.getProcessedRecords();
    switch (view.type) {
      case 'grid': contentArea.innerHTML = MT.Grid.render(records, table, view); break;
      case 'kanban': contentArea.innerHTML = MT.Views.renderKanban(records, table, view); break;
      case 'gallery': contentArea.innerHTML = MT.Views.renderGallery(records, table, view); break;
      case 'gantt': contentArea.innerHTML = MT.Views.renderGantt(records, table, view); break;
      case 'calendar': contentArea.innerHTML = MT.Views.renderCalendar(records, table, view); break;
      case 'form': contentArea.innerHTML = MT.Views.renderForm(table, view); break;
      default: contentArea.innerHTML = MT.Grid.render(records, table, view);
    }
  },

  // ===== 记录详情面板 =====
  openRecordPanel(recordId) {
    const table = MT.Core.getCurrentTable();
    if (!table) return;
    const record = (table.records || []).find(function(r) { return r.id === recordId; });
    if (!record) return;

    let html = '<div class="mt-record-panel">';
    html += '<div class="mt-record-panel-header">';
    html += '<h3>记录详情</h3>';
    html += '<div class="mt-record-panel-actions">';
    html += '<button class="mt-btn-icon" data-action="dup-record" data-id="' + recordId + '" title="复制记录"><i class="fas fa-copy"></i></button>';
    html += '<button class="mt-btn-icon" data-action="delete-record-panel" data-id="' + recordId + '" title="删除记录"><i class="fas fa-trash"></i></button>';
    html += '<button class="mt-btn-icon" data-action="close-record-panel"><i class="fas fa-times"></i></button>';
    html += '</div></div>';
    html += '<div class="mt-record-panel-body">';
    table.fields.forEach(function(field) {
      html += '<div class="mt-record-field">';
      html += '<label class="mt-record-field-label">' + MT.Core.esc(field.name) + '</label>';
      html += '<div class="mt-record-field-value">';
      html += MT.Fields.renderPanelEditor(record, field);
      html += '</div></div>';
    });
    html += '</div>';
    html += '<div class="mt-record-panel-footer">';
    html += '<span class="mt-record-meta">创建: ' + MT.Core.fmtDateTime(record.createdAt) + '</span>';
    html += '<span class="mt-record-meta">更新: ' + MT.Core.fmtDateTime(record.updatedAt) + '</span>';
    html += '</div></div>';

    // 移除旧面板
    this.closeRecordPanel();
    const panel = document.createElement('div');
    panel.className = 'mt-record-panel-overlay';
    panel.innerHTML = html;
    this.container.appendChild(panel);
    this.recordPanel = panel;

    // 面板内输入事件
    const self = this;
    panel.addEventListener('change', function(e) {
      self.handlePanelFieldChange(e, record, table);
    });
    panel.addEventListener('input', function(e) {
      if (e.target.dataset.fieldId && (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA')) {
        // debounce save
        clearTimeout(self._panelSaveTimer);
        self._panelSaveTimer = setTimeout(function() {
          self.handlePanelFieldChange(e, record, table);
        }, 300);
      }
    });
  },

  handlePanelFieldChange(e, record, table) {
    const fieldId = e.target.dataset.fieldId;
    if (!fieldId) return;
    const field = table.fields.find(function(f) { return f.id === fieldId; });
    if (!field) return;
    const value = MT.Fields.getPanelEditValue(e.target, field);
    MT.Core.updateRecordField(record.id, fieldId, value);
  },

  closeRecordPanel() {
    if (this.recordPanel) {
      this.recordPanel.remove();
      this.recordPanel = null;
    }
    // 也移除 overlay
    if (this.container) {
      const overlay = this.container.querySelector('.mt-record-panel-overlay');
      if (overlay) overlay.remove();
    }
  },

  deleteRecordFromPanel() {
    const btn = this.container.querySelector('[data-action="delete-record-panel"]');
    if (btn && btn.dataset.id) {
      MT.Core.deleteRecord(btn.dataset.id);
      this.closeRecordPanel();
      this.refreshContent();
    }
  },

  // ===== 操作方法 =====
  addTable() {
    const name = prompt('新表名称:', '新数据表');
    if (name) {
      MT.Core.addTable(name);
      this.refresh();
    }
  },

  renameTable(tableId) {
    const ws = MT.Core.getState();
    const table = ws.tables.find(function(t) { return t.id === tableId; });
    if (!table) return;
    const name = prompt('重命名表:', table.name);
    if (name && name !== table.name) {
      MT.Core.renameTable(tableId, name);
      this.refresh();
    }
  },

  addRecord() {
    MT.Core.addRecord();
    this.refreshContent();
  },

  deleteSelected() {
    const ids = MT.Grid.getSelectedIds();
    if (ids.length && confirm('确定删除选中的 ' + ids.length + ' 条记录？')) {
      MT.Core.deleteRecords(ids);
      this.refreshContent();
    }
  },

  duplicateRecord(recordId) {
    MT.Core.duplicateRecord(recordId);
    this.refreshContent();
  },

  // ===== 添加字段对话框 =====
  showAddFieldDialog() {
    const html = MT.Fields.renderAddFieldDialog();
    this.showModal(html);
  },

  confirmAddField() {
    const nameInput = document.getElementById('field-name-input');
    const typeSelect = document.getElementById('field-type-select');
    if (!nameInput || !typeSelect) return;
    const name = nameInput.value.trim();
    const type = typeSelect.value;
    if (!name) { nameInput.focus(); return; }
    const config = MT.Fields.parseFieldConfig(type, document.getElementById('field-config-area'));
    MT.Core.addField({ name: name, type: type, config: config });
    this.closeModal();
    this.refresh();
  },

  // ===== 添加视图对话框 =====
  showAddViewDialog() {
    let html = '<div class="mt-modal-overlay" data-action="close-modal">';
    html += '<div class="mt-modal" onclick="event.stopPropagation()">';
    html += '<div class="mt-modal-header"><h3>新建视图</h3><button class="mt-btn-icon" data-action="close-modal"><i class="fas fa-times"></i></button></div>';
    html += '<div class="mt-modal-body">';
    html += '<div class="mt-form-group"><label>视图名称</label><input type="text" id="view-name-input" class="mt-input" placeholder="视图名称"></div>';
    html += '<div class="mt-form-group"><label>视图类型</label><select id="view-type-select" class="mt-input">';
    html += '<option value="grid">表格视图</option>';
    html += '<option value="kanban">看板视图</option>';
    html += '<option value="gallery">画廊视图</option>';
    html += '<option value="gantt">甘特图</option>';
    html += '<option value="calendar">日历视图</option>';
    html += '<option value="form">表单视图</option>';
    html += '</select></div></div>';
    html += '<div class="mt-modal-footer"><button class="mt-btn" data-action="close-modal">取消</button>';
    html += '<button class="mt-btn mt-btn-primary" data-action="confirm-add-view">创建</button></div>';
    html += '</div></div>';
    this.showModal(html);
  },

  confirmAddView() {
    const nameInput = document.getElementById('view-name-input');
    const typeSelect = document.getElementById('view-type-select');
    if (!nameInput || !typeSelect) return;
    const name = nameInput.value.trim() || (typeSelect.value + '视图');
    MT.Core.addView(name, typeSelect.value);
    this.closeModal();
    this.refresh();
  },

  // ===== 仪表盘操作 =====
  showAddWidgetDialog() {
    const html = MT.Dashboard.showAddWidgetDialog();
    this.showModal(html);
  },

  showWidgetConfigDialog(widgetId) {
    const html = MT.Dashboard.showWidgetConfig(widgetId);
    this.showModal(html);
  },

  // ===== 甘特图缩放 =====
  setGanttScale(scale) {
    const view = MT.Core.getCurrentView();
    if (view) {
      view.config = view.config || {};
      view.config.scale = scale;
      MT.Core.save();
      this.refreshContent();
    }
  },

  // ===== 全屏 =====
  toggleFullscreen() {
    if (this.container) {
      this.container.classList.toggle('mt-fullscreen');
    }
  },

  // ===== 模态框管理 =====
  showModal(html) {
    this.closeModal();
    const div = document.createElement('div');
    div.className = 'mt-modal-container';
    div.innerHTML = html;
    this.container.appendChild(div);
  },

  closeModal() {
    if (!this.container) return;
    const modal = this.container.querySelector('.mt-modal-container');
    if (modal) modal.remove();
    const overlay = this.container.querySelector('.mt-modal-overlay');
    if (overlay) overlay.remove();
  }
};
