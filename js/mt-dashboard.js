// ========== MT Dashboard Module ==========
// 仪表盘：Chart.js图表、统计卡片、12列网格布局、拖拽widget
(function() {
  'use strict';

  const Dashboard = {};

  // ===== 渲染仪表盘 =====
  Dashboard.render = function(dashboard) {
    if (!dashboard) return '<div class="mt-dashboard-empty">暂无仪表盘</div>';
    const widgets = dashboard.widgets || [];
    let html = '<div class="mt-dashboard">';
    html += '<div class="mt-dashboard-header">';
    html += '<h2 class="mt-dashboard-title">' + MT.Core.esc(dashboard.name || '仪表盘') + '</h2>';
    html += '<div class="mt-dashboard-actions">';
    html += '<button class="mt-btn mt-btn-sm" data-action="add-widget"><i class="fas fa-plus"></i> 添加组件</button>';
    html += '<button class="mt-btn mt-btn-sm" data-action="dashboard-fullscreen"><i class="fas fa-expand"></i></button>';
    html += '</div></div>';
    html += '<div class="mt-dashboard-grid">';
    widgets.forEach(function(w) {
      html += Dashboard.renderWidget(w);
    });
    html += '</div></div>';
    return html;
  };

  // ===== 渲染单个Widget =====
  Dashboard.renderWidget = function(widget) {
    const colSpan = widget.colSpan || 4;
    const rowSpan = widget.rowSpan || 2;
    let html = '<div class="mt-widget" data-widget-id="' + widget.id + '" ';
    html += 'style="grid-column: span ' + colSpan + '; grid-row: span ' + rowSpan + ';">';
    html += '<div class="mt-widget-header">';
    html += '<span class="mt-widget-title">' + MT.Core.esc(widget.title || '未命名组件') + '</span>';
    html += '<div class="mt-widget-menu">';
    html += '<button class="mt-btn-icon" data-action="widget-config" data-widget="' + widget.id + '"><i class="fas fa-cog"></i></button>';
    html += '<button class="mt-btn-icon" data-action="widget-delete" data-widget="' + widget.id + '"><i class="fas fa-trash"></i></button>';
    html += '</div></div>';
    html += '<div class="mt-widget-body" id="widget-body-' + widget.id + '">';
    html += Dashboard.renderWidgetContent(widget);
    html += '</div></div>';
    return html;
  };

  // ===== 渲染Widget内容 =====
  Dashboard.renderWidgetContent = function(widget) {
    switch (widget.type) {
      case 'stat': return Dashboard.renderStat(widget);
      case 'chart_bar': 
      case 'chart_line':
      case 'chart_pie':
      case 'chart_doughnut':
      case 'chart_radar':
        return '<canvas id="chart-' + widget.id + '"></canvas>';
      case 'table': return Dashboard.renderTableWidget(widget);
      case 'progress': return Dashboard.renderProgressWidget(widget);
      case 'list': return Dashboard.renderListWidget(widget);
      default: return '<div class="mt-widget-placeholder">选择组件类型</div>';
    }
  };

  // ===== 统计卡片 =====
  Dashboard.renderStat = function(widget) {
    const config = widget.config || {};
    const data = Dashboard.computeStatData(config);
    let html = '<div class="mt-stat-card">';
    html += '<div class="mt-stat-value">' + data.value + '</div>';
    html += '<div class="mt-stat-label">' + MT.Core.esc(config.label || '统计') + '</div>';
    if (data.trend !== null) {
      const cls = data.trend >= 0 ? 'mt-stat-trend-up' : 'mt-stat-trend-down';
      const icon = data.trend >= 0 ? 'fa-arrow-up' : 'fa-arrow-down';
      html += '<div class="mt-stat-trend ' + cls + '"><i class="fas ' + icon + '"></i> ' + Math.abs(data.trend) + '%</div>';
    }
    html += '</div>';
    return html;
  };

  Dashboard.computeStatData = function(config) {
    const ws = MT.Core.getState();
    const tableId = config.tableId || (ws.tables[0] && ws.tables[0].id);
    const table = ws.tables.find(function(t) { return t.id === tableId; });
    if (!table) return { value: 0, trend: null };
    
    const fieldId = config.fieldId;
    const agg = config.aggregate || 'count';
    const records = table.records || [];
    
    if (agg === 'count') return { value: records.length, trend: null };
    
    if (!fieldId) return { value: 0, trend: null };
    
    const values = records.map(function(r) { return parseFloat(r.values[fieldId]) || 0; });
    let result = 0;
    switch (agg) {
      case 'sum': result = values.reduce(function(a, b) { return a + b; }, 0); break;
      case 'avg': result = values.length ? values.reduce(function(a, b) { return a + b; }, 0) / values.length : 0; break;
      case 'max': result = values.length ? Math.max.apply(null, values) : 0; break;
      case 'min': result = values.length ? Math.min.apply(null, values) : 0; break;
    }
    return { value: MT.Core.fmtNum(result), trend: null };
  };

  // ===== 图表渲染 =====
  Dashboard.chartInstances = {};

  Dashboard.renderCharts = function(dashboard) {
    if (!dashboard || !dashboard.widgets) return;
    dashboard.widgets.forEach(function(w) {
      if (w.type && w.type.startsWith('chart_')) {
        Dashboard.renderChart(w);
      }
    });
  };

  Dashboard.renderChart = function(widget) {
    const canvas = document.getElementById('chart-' + widget.id);
    if (!canvas) return;
    
    // 销毁旧实例
    if (Dashboard.chartInstances[widget.id]) {
      Dashboard.chartInstances[widget.id].destroy();
    }
    
    const config = widget.config || {};
    const chartData = Dashboard.computeChartData(config);
    const chartType = widget.type.replace('chart_', '');
    
    const colors = [
      '#4f46e5', '#06b6d4', '#10b981', '#f59e0b', '#ef4444',
      '#8b5cf6', '#ec4899', '#14b8a6', '#f97316', '#6366f1'
    ];

    const ctx = canvas.getContext('2d');
    const chartConfig = {
      type: chartType,
      data: {
        labels: chartData.labels,
        datasets: [{
          label: config.label || '数据',
          data: chartData.values,
          backgroundColor: chartType === 'pie' || chartType === 'doughnut' || chartType === 'radar'
            ? colors.slice(0, chartData.values.length)
            : colors[0] + '33',
          borderColor: chartType === 'pie' || chartType === 'doughnut' || chartType === 'radar'
            ? colors.slice(0, chartData.values.length)
            : colors[0],
          borderWidth: chartType === 'line' ? 2 : 1,
          tension: 0.3,
          fill: chartType === 'line'
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: chartType === 'pie' || chartType === 'doughnut' || chartType === 'radar',
            position: 'bottom'
          }
        },
        scales: chartType === 'pie' || chartType === 'doughnut' || chartType === 'radar' ? {} : {
          y: { beginAtZero: true }
        }
      }
    };

    try {
      Dashboard.chartInstances[widget.id] = new Chart(ctx, chartConfig);
    } catch (e) {
      console.warn('Chart render failed:', e);
    }
  };

  Dashboard.computeChartData = function(config) {
    const ws = MT.Core.getState();
    const tableId = config.tableId || (ws.tables[0] && ws.tables[0].id);
    const table = ws.tables.find(function(t) { return t.id === tableId; });
    if (!table) return { labels: [], values: [] };
    
    const groupField = config.groupFieldId;
    const valueField = config.valueFieldId;
    const agg = config.aggregate || 'count';
    const records = table.records || [];
    
    if (!groupField) {
      return { labels: ['总计'], values: [records.length] };
    }
    
    // 按groupField分组
    const groups = {};
    records.forEach(function(r) {
      let key = r.values[groupField];
      if (Array.isArray(key)) key = key.join(', ');
      if (key === undefined || key === null || key === '') key = '(空)';
      key = String(key);
      if (!groups[key]) groups[key] = [];
      groups[key].push(r);
    });
    
    const labels = Object.keys(groups);
    const values = labels.map(function(label) {
      const recs = groups[label];
      if (agg === 'count') return recs.length;
      if (!valueField) return recs.length;
      const nums = recs.map(function(r) { return parseFloat(r.values[valueField]) || 0; });
      switch (agg) {
        case 'sum': return nums.reduce(function(a, b) { return a + b; }, 0);
        case 'avg': return nums.length ? nums.reduce(function(a, b) { return a + b; }, 0) / nums.length : 0;
        case 'max': return nums.length ? Math.max.apply(null, nums) : 0;
        case 'min': return nums.length ? Math.min.apply(null, nums) : 0;
        default: return recs.length;
      }
    });
    
    return { labels: labels, values: values };
  };

  // ===== 表格组件 =====
  Dashboard.renderTableWidget = function(widget) {
    const config = widget.config || {};
    const ws = MT.Core.getState();
    const tableId = config.tableId || (ws.tables[0] && ws.tables[0].id);
    const table = ws.tables.find(function(t) { return t.id === tableId; });
    if (!table) return '<div class="mt-widget-placeholder">无数据源</div>';
    
    const fields = (config.fieldIds || table.fields.slice(0, 4).map(function(f) { return f.id; }))
      .map(function(fid) { return table.fields.find(function(f) { return f.id === fid; }); })
      .filter(Boolean);
    const records = (table.records || []).slice(0, config.limit || 10);
    
    let html = '<table class="mt-widget-table"><thead><tr>';
    fields.forEach(function(f) { html += '<th>' + MT.Core.esc(f.name) + '</th>'; });
    html += '</tr></thead><tbody>';
    records.forEach(function(r) {
      html += '<tr>';
      fields.forEach(function(f) {
        html += '<td>' + MT.Fields.renderCell(r.values[f.id], f) + '</td>';
      });
      html += '</tr>';
    });
    html += '</tbody></table>';
    return html;
  };

  // ===== 进度组件 =====
  Dashboard.renderProgressWidget = function(widget) {
    const config = widget.config || {};
    const ws = MT.Core.getState();
    const tableId = config.tableId || (ws.tables[0] && ws.tables[0].id);
    const table = ws.tables.find(function(t) { return t.id === tableId; });
    if (!table) return '<div class="mt-widget-placeholder">无数据源</div>';
    
    const fieldId = config.fieldId;
    const records = table.records || [];
    
    // 计算各状态占比
    const statusField = table.fields.find(function(f) { return f.id === fieldId; });
    if (!statusField || statusField.type !== 'select') {
      // 数值进度
      const values = records.map(function(r) { return parseFloat(r.values[fieldId]) || 0; });
      const avg = values.length ? values.reduce(function(a, b) { return a + b; }, 0) / values.length : 0;
      return '<div class="mt-progress-widget">' +
        '<div class="mt-progress-bar-lg"><div class="mt-progress-fill-lg" style="width:' + Math.min(100, avg) + '%"></div></div>' +
        '<div class="mt-progress-text">' + Math.round(avg) + '%</div></div>';
    }
    
    // 选项分布
    const options = (statusField.config && statusField.config.options) || [];
    const counts = {};
    options.forEach(function(o) { counts[o] = 0; });
    records.forEach(function(r) {
      const v = r.values[fieldId];
      if (v && counts[v] !== undefined) counts[v]++;
    });
    
    let html = '<div class="mt-progress-widget">';
    const total = records.length || 1;
    options.forEach(function(o, i) {
      const pct = Math.round(counts[o] / total * 100);
      const color = MT.Fields.COLORS[i % MT.Fields.COLORS.length];
      html += '<div class="mt-progress-item">';
      html += '<span class="mt-progress-label">' + MT.Core.esc(o) + '</span>';
      html += '<div class="mt-progress-bar-sm"><div class="mt-progress-fill-sm" style="width:' + pct + '%;background:' + color.bg + '"></div></div>';
      html += '<span class="mt-progress-pct">' + pct + '%</span>';
      html += '</div>';
    });
    html += '</div>';
    return html;
  };

  // ===== 列表组件 =====
  Dashboard.renderListWidget = function(widget) {
    const config = widget.config || {};
    const ws = MT.Core.getState();
    const tableId = config.tableId || (ws.tables[0] && ws.tables[0].id);
    const table = ws.tables.find(function(t) { return t.id === tableId; });
    if (!table) return '<div class="mt-widget-placeholder">无数据源</div>';
    
    const titleField = config.titleFieldId || (table.fields[0] && table.fields[0].id);
    const subtitleField = config.subtitleFieldId;
    const records = (table.records || []).slice(0, config.limit || 8);
    
    let html = '<div class="mt-list-widget">';
    records.forEach(function(r) {
      html += '<div class="mt-list-item">';
      html += '<div class="mt-list-item-title">' + MT.Core.esc(String(r.values[titleField] || '')) + '</div>';
      if (subtitleField) {
        html += '<div class="mt-list-item-sub">' + MT.Core.esc(String(r.values[subtitleField] || '')) + '</div>';
      }
      html += '</div>';
    });
    html += '</div>';
    return html;
  };

  // ===== 添加Widget对话框 =====
  Dashboard.showAddWidgetDialog = function() {
    const ws = MT.Core.getState();
    const tables = ws.tables || [];
    
    let html = '<div class="mt-modal-overlay" data-action="close-modal">';
    html += '<div class="mt-modal" onclick="event.stopPropagation()">';
    html += '<div class="mt-modal-header"><h3>添加仪表盘组件</h3><button class="mt-btn-icon" data-action="close-modal"><i class="fas fa-times"></i></button></div>';
    html += '<div class="mt-modal-body">';
    html += '<div class="mt-form-group"><label>组件标题</label><input type="text" id="widget-title" class="mt-input" placeholder="组件名称"></div>';
    html += '<div class="mt-form-group"><label>组件类型</label><select id="widget-type" class="mt-input">';
    html += '<option value="stat">统计卡片</option>';
    html += '<option value="chart_bar">柱状图</option>';
    html += '<option value="chart_line">折线图</option>';
    html += '<option value="chart_pie">饼图</option>';
    html += '<option value="chart_doughnut">环形图</option>';
    html += '<option value="chart_radar">雷达图</option>';
    html += '<option value="table">表格</option>';
    html += '<option value="progress">进度</option>';
    html += '<option value="list">列表</option>';
    html += '</select></div>';
    html += '<div class="mt-form-group"><label>数据源表</label><select id="widget-table" class="mt-input">';
    tables.forEach(function(t) {
      html += '<option value="' + t.id + '">' + MT.Core.esc(t.name) + '</option>';
    });
    html += '</select></div>';
    html += '<div class="mt-form-group"><label>分组字段</label><select id="widget-group-field" class="mt-input"><option value="">无</option>';
    if (tables[0]) {
      tables[0].fields.forEach(function(f) {
        html += '<option value="' + f.id + '">' + MT.Core.esc(f.name) + '</option>';
      });
    }
    html += '</select></div>';
    html += '<div class="mt-form-group"><label>数值字段</label><select id="widget-value-field" class="mt-input"><option value="">无</option>';
    if (tables[0]) {
      tables[0].fields.forEach(function(f) {
        if (f.type === 'number' || f.type === 'currency' || f.type === 'progress' || f.type === 'rating') {
          html += '<option value="' + f.id + '">' + MT.Core.esc(f.name) + '</option>';
        }
      });
    }
    html += '</select></div>';
    html += '<div class="mt-form-group"><label>聚合方式</label><select id="widget-agg" class="mt-input">';
    html += '<option value="count">计数</option><option value="sum">求和</option><option value="avg">平均</option>';
    html += '<option value="max">最大</option><option value="min">最小</option>';
    html += '</select></div>';
    html += '<div class="mt-form-group"><label>列宽(1-12)</label><input type="number" id="widget-col" class="mt-input" value="4" min="1" max="12"></div>';
    html += '<div class="mt-form-group"><label>行高(1-4)</label><input type="number" id="widget-row" class="mt-input" value="2" min="1" max="4"></div>';
    html += '</div>';
    html += '<div class="mt-modal-footer"><button class="mt-btn" data-action="close-modal">取消</button>';
    html += '<button class="mt-btn mt-btn-primary" data-action="confirm-add-widget">添加</button></div>';
    html += '</div></div>';
    return html;
  };

  Dashboard.handleAddWidget = function() {
    const title = document.getElementById('widget-title').value || '新组件';
    const type = document.getElementById('widget-type').value;
    const tableId = document.getElementById('widget-table').value;
    const groupFieldId = document.getElementById('widget-group-field').value;
    const valueFieldId = document.getElementById('widget-value-field').value;
    const aggregate = document.getElementById('widget-agg').value;
    const colSpan = parseInt(document.getElementById('widget-col').value) || 4;
    const rowSpan = parseInt(document.getElementById('widget-row').value) || 2;
    
    const ws = MT.Core.getState();
    const dashboards = ws.dashboards || [];
    if (!dashboards.length) {
      MT.Core.addDashboard('仪表盘');
    }
    const dashboard = ws.dashboards[0];
    
    const widget = {
      id: MT.Core.genId(),
      title: title,
      type: type,
      colSpan: colSpan,
      rowSpan: rowSpan,
      config: {
        tableId: tableId,
        groupFieldId: groupFieldId || undefined,
        valueFieldId: valueFieldId || undefined,
        aggregate: aggregate,
        label: title
      }
    };
    
    dashboard.widgets = dashboard.widgets || [];
    dashboard.widgets.push(widget);
    MT.Core.save();
    MT.Core.emit('dashboard:refresh');
  };

  // ===== Widget配置对话框 =====
  Dashboard.showWidgetConfig = function(widgetId) {
    const ws = MT.Core.getState();
    const dashboard = (ws.dashboards || [])[0];
    if (!dashboard) return '';
    const widget = (dashboard.widgets || []).find(function(w) { return w.id === widgetId; });
    if (!widget) return '';
    
    const tables = ws.tables || [];
    const config = widget.config || {};
    
    let html = '<div class="mt-modal-overlay" data-action="close-modal">';
    html += '<div class="mt-modal" onclick="event.stopPropagation()">';
    html += '<div class="mt-modal-header"><h3>配置组件</h3><button class="mt-btn-icon" data-action="close-modal"><i class="fas fa-times"></i></button></div>';
    html += '<div class="mt-modal-body">';
    html += '<div class="mt-form-group"><label>标题</label><input type="text" id="wc-title" class="mt-input" value="' + MT.Core.esc(widget.title) + '"></div>';
    html += '<div class="mt-form-group"><label>类型</label><select id="wc-type" class="mt-input">';
    var types = [['stat','统计卡片'],['chart_bar','柱状图'],['chart_line','折线图'],['chart_pie','饼图'],['chart_doughnut','环形图'],['chart_radar','雷达图'],['table','表格'],['progress','进度'],['list','列表']];
    types.forEach(function(t) {
      html += '<option value="' + t[0] + '"' + (widget.type === t[0] ? ' selected' : '') + '>' + t[1] + '</option>';
    });
    html += '</select></div>';
    html += '<div class="mt-form-group"><label>数据源表</label><select id="wc-table" class="mt-input">';
    tables.forEach(function(t) {
      html += '<option value="' + t.id + '"' + (config.tableId === t.id ? ' selected' : '') + '>' + MT.Core.esc(t.name) + '</option>';
    });
    html += '</select></div>';
    html += '<div class="mt-form-group"><label>列宽</label><input type="number" id="wc-col" class="mt-input" value="' + (widget.colSpan || 4) + '" min="1" max="12"></div>';
    html += '<div class="mt-form-group"><label>行高</label><input type="number" id="wc-row" class="mt-input" value="' + (widget.rowSpan || 2) + '" min="1" max="4"></div>';
    html += '<input type="hidden" id="wc-widget-id" value="' + widget.id + '">';
    html += '</div>';
    html += '<div class="mt-modal-footer"><button class="mt-btn" data-action="close-modal">取消</button>';
    html += '<button class="mt-btn mt-btn-primary" data-action="confirm-widget-config">保存</button></div>';
    html += '</div></div>';
    return html;
  };

  Dashboard.handleWidgetConfig = function() {
    const widgetId = document.getElementById('wc-widget-id').value;
    const ws = MT.Core.getState();
    const dashboard = (ws.dashboards || [])[0];
    if (!dashboard) return;
    const widget = (dashboard.widgets || []).find(function(w) { return w.id === widgetId; });
    if (!widget) return;
    
    widget.title = document.getElementById('wc-title').value || widget.title;
    widget.type = document.getElementById('wc-type').value;
    widget.colSpan = parseInt(document.getElementById('wc-col').value) || 4;
    widget.rowSpan = parseInt(document.getElementById('wc-row').value) || 2;
    widget.config = widget.config || {};
    widget.config.tableId = document.getElementById('wc-table').value;
    
    MT.Core.save();
    MT.Core.emit('dashboard:refresh');
  };

  Dashboard.deleteWidget = function(widgetId) {
    const ws = MT.Core.getState();
    const dashboard = (ws.dashboards || [])[0];
    if (!dashboard) return;
    dashboard.widgets = (dashboard.widgets || []).filter(function(w) { return w.id !== widgetId; });
    // 销毁图表实例
    if (Dashboard.chartInstances[widgetId]) {
      Dashboard.chartInstances[widgetId].destroy();
      delete Dashboard.chartInstances[widgetId];
    }
    MT.Core.save();
    MT.Core.emit('dashboard:refresh');
  };

  // ===== 销毁所有图表 =====
  Dashboard.destroyAllCharts = function() {
    Object.keys(Dashboard.chartInstances).forEach(function(id) {
      if (Dashboard.chartInstances[id]) {
        Dashboard.chartInstances[id].destroy();
      }
    });
    Dashboard.chartInstances = {};
  };

  // 注册到命名空间
  window.MT = window.MT || {};
  window.MT.Dashboard = Dashboard;
})();
