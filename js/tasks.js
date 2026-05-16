// 任务管理模块 - 浙杭企服（代理记账业务系统）
// 功能：任务看板、智能分配、进度追踪、自动化干预、甘特图

const Tasks = {
    currentTab: 'board',
    filterStatus: 'all',
    filterAssignee: 'all',

    init() { this.autoEscalation(); this.render(); this.bindEvents(); },
    destroy() {},

    loadData() { const d = localStorage.getItem('biz_tasks'); if (!d) { localStorage.setItem('biz_tasks', JSON.stringify(defaultTasks)); return [...defaultTasks]; } return JSON.parse(d); },
    saveData(data) { localStorage.setItem('biz_tasks', JSON.stringify(data)); },

    // ===== 自动升级（超时检测） =====
    autoEscalation() {
        const tasks = this.loadData();
        const now = Date.now();
        let changed = false;
        tasks.forEach(t => {
            if (t.status === 'pending' && t.due_date) {
                const due = new Date(t.due_date).getTime();
                if (now > due) { t.status = 'overdue'; t.priority = 'urgent'; changed = true; }
            }
        });
        if (changed) this.saveData(tasks);
    },

    render() {
        const contentArea = document.querySelector('.content-area');
        contentArea.innerHTML = `
            <div class="biz-module">
                <div class="biz-module-header"><h2><i class="fa-solid fa-tasks"></i> 任务管理</h2>
                    <div class="biz-header-actions"><button class="btn-primary" id="btn-new-task"><i class="fa-solid fa-plus"></i> 新建任务</button><button class="btn-secondary" id="btn-auto-assign"><i class="fa-solid fa-magic"></i> 智能分配</button></div>
                </div>
                <div class="biz-tabs">
                    <button class="biz-tab active" data-tab="board"><i class="fa-solid fa-columns"></i> 任务看板</button>
                    <button class="biz-tab" data-tab="list"><i class="fa-solid fa-list"></i> 列表视图</button>
                    <button class="biz-tab" data-tab="gantt"><i class="fa-solid fa-chart-gantt"></i> 甘特图</button>
                    <button class="biz-tab" data-tab="allocation"><i class="fa-solid fa-people-arrows"></i> 负载分析</button>
                </div>
                <div class="biz-tab-content" id="tasks-tab-content"></div>
            </div>
            <div id="tasks-modals"></div>
        `;
        this.renderTab();
    },

    renderTab() {
        const container = document.getElementById('tasks-tab-content');
        switch (this.currentTab) {
            case 'board': container.innerHTML = this.renderBoard(); break;
            case 'list': container.innerHTML = this.renderList(); break;
            case 'gantt': container.innerHTML = this.renderGantt(); break;
            case 'allocation': container.innerHTML = this.renderAllocation(); break;
        }
    },

    // ===== 看板视图 =====
    renderBoard() {
        const tasks = this.loadData();
        const columns = [
            { key: 'pending', label: '待处理', color: '#3b82f6', icon: 'fa-hourglass-start' },
            { key: 'in_progress', label: '进行中', color: '#f59e0b', icon: 'fa-spinner' },
            { key: 'review', label: '待审核', color: '#8b5cf6', icon: 'fa-eye' },
            { key: 'completed', label: '已完成', color: '#10b981', icon: 'fa-check-circle' },
            { key: 'overdue', label: '已超时', color: '#dc2626', icon: 'fa-exclamation-circle' }
        ];
        return `<div class="task-board">${columns.map(col => {
            const colTasks = tasks.filter(t => t.status === col.key);
            return `<div class="board-column"><div class="board-col-header" style="border-top:3px solid ${col.color}"><i class="fa-solid ${col.icon}" style="color:${col.color}"></i> ${col.label} <span class="col-count">${colTasks.length}</span></div>
                <div class="board-col-body">${colTasks.map(t => `
                    <div class="task-card priority-${t.priority}" data-id="${t.id}">
                        <div class="task-card-top"><span class="task-priority-dot priority-${t.priority}"></span><span class="task-type-tag">${this.getTypeLabel(t.service_type)}</span></div>
                        <div class="task-card-title">${escapeHtml(t.title)}</div>
                        <div class="task-card-meta"><span>${escapeHtml(t.customer_name || '')}</span><span>${escapeHtml(t.assigned_to || '未分配')}</span></div>
                        ${t.due_date ? `<div class="task-card-due ${new Date(t.due_date) < new Date() && t.status !== 'completed' ? 'overdue' : ''}"><i class="fa-solid fa-clock"></i> ${t.due_date}</div>` : ''}
                    </div>
                `).join('')}</div>
            </div>`;
        }).join('')}</div>`;
    },

    getTypeLabel(type) { return { bookkeeping: '记账', address: '地址', business: '工商' }[type] || '其他'; },

    // ===== 列表视图 =====
    renderList() {
        const tasks = this.loadData();
        const statusMap = { pending: '待处理', in_progress: '进行中', review: '待审核', completed: '已完成', overdue: '已超时', waiting: '等待前置' };
        const priorityMap = { urgent: '紧急', high: '高', medium: '中', low: '低' };
        return `
            <div class="biz-toolbar">
                <select class="filter-select" id="task-filter-status"><option value="all">全部状态</option>${Object.entries(statusMap).map(([k, v]) => `<option value="${k}">${v}</option>`).join('')}</select>
                <select class="filter-select" id="task-filter-assignee"><option value="all">负责人</option>${[...new Set(tasks.map(t => t.assigned_to).filter(Boolean))].map(n => `<option value="${n}">${n}</option>`).join('')}</select>
            </div>
            <div class="biz-table-wrap"><table class="biz-table"><thead><tr><th>任务</th><th>关联订单</th><th>客户</th><th>优先级</th><th>状态</th><th>负责人</th><th>截止日期</th><th>操作</th></tr></thead><tbody>
                ${tasks.filter(t => (this.filterStatus === 'all' || t.status === this.filterStatus) && (this.filterAssignee === 'all' || t.assigned_to === this.filterAssignee)).map(t => `<tr>
                    <td><strong>${escapeHtml(t.title)}</strong></td>
                    <td>${escapeHtml(t.order_no || '-')}</td>
                    <td>${escapeHtml(t.customer_name || '-')}</td>
                    <td><span class="priority-tag p-${t.priority}">${priorityMap[t.priority] || t.priority}</span></td>
                    <td><span class="status-tag st-${t.status === 'completed' ? 'ok' : t.status === 'overdue' ? 'danger' : 'info'}">${statusMap[t.status] || t.status}</span></td>
                    <td>${escapeHtml(t.assigned_to) || '<em class="text-muted">未分配</em>'}</td>
                    <td class="td-time">${t.due_date || '-'}</td>
                    <td><button class="btn-mini btn-operate" data-action="update-task" data-id="${t.id}">更新</button></td>
                </tr>`).join('')}
            </tbody></table></div>
        `;
    },

    // ===== 甘特图 =====
    renderGantt() {
        const tasks = this.loadData().filter(t => t.due_date).slice(0, 15);
        const now = new Date();
        const startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        const days = 30;
        return `
            <div class="gantt-section">
                <h4><i class="fa-solid fa-chart-gantt"></i> 任务时间线（本月）</h4>
                <div class="gantt-chart">
                    <div class="gantt-header"><div class="gantt-label-col">任务</div><div class="gantt-timeline">${Array.from({length: days}, (_, i) => `<span class="gantt-day ${i + 1 === now.getDate() ? 'today' : ''}">${i + 1}</span>`).join('')}</div></div>
                    ${tasks.map(t => {
                        const due = new Date(t.due_date);
                        const created = t.created_at ? new Date(t.created_at) : startDate;
                        const startDay = Math.max(1, Math.min(days, created.getDate()));
                        const endDay = Math.max(1, Math.min(days, due.getDate()));
                        const left = ((startDay - 1) / days * 100).toFixed(1);
                        const width = Math.max(3, ((endDay - startDay + 1) / days * 100)).toFixed(1);
                        const color = t.status === 'completed' ? '#10b981' : t.status === 'overdue' ? '#dc2626' : '#4f46e5';
                        return `<div class="gantt-row"><div class="gantt-label-col">${escapeHtml(t.title.slice(0, 10))}</div><div class="gantt-timeline"><div class="gantt-bar" style="left:${left}%;width:${width}%;background:${color};" title="${t.title} (${t.due_date})"></div></div></div>`;
                    }).join('')}
                </div>
            </div>
        `;
    },

    // ===== 负载分析 =====
    renderAllocation() {
        const tasks = this.loadData();
        const employees = ['王芳', '李强', '张伟', '陈丽', '赵敏'];
        const stats = employees.map(name => {
            const myTasks = tasks.filter(t => t.assigned_to === name);
            const active = myTasks.filter(t => t.status === 'pending' || t.status === 'in_progress').length;
            const completed = myTasks.filter(t => t.status === 'completed').length;
            const overdue = myTasks.filter(t => t.status === 'overdue').length;
            const capacity = 8; // 日均处理能力
            const load = (active / capacity * 100).toFixed(0);
            return { name, active, completed, overdue, load: Math.min(100, load) };
        });
        const maxLoad = Math.max(...stats.map(s => parseInt(s.load)), 1);

        return `
            <div class="allocation-section">
                <h4><i class="fa-solid fa-chart-bar"></i> 员工负载分析</h4>
                <p class="hint-text">负载率 = 当前活跃任务数 / 日均处理能力(8)</p>
                <div class="load-chart">${stats.map(s => `
                    <div class="load-row">
                        <span class="load-name">${s.name}</span>
                        <div class="load-bar-wrap"><div class="load-bar-bg"><div class="load-bar-fill" style="width:${s.load}%;background:${parseInt(s.load) > 80 ? '#dc2626' : parseInt(s.load) > 50 ? '#f59e0b' : '#10b981'};"></div></div></div>
                        <span class="load-pct">${s.load}%</span>
                        <span class="load-detail">活跃${s.active} / 完成${s.completed} / 超时${s.overdue}</span>
                    </div>
                `).join('')}</div>
                <div class="allocation-rules">
                    <h4><i class="fa-solid fa-gears"></i> 智能分配算法</h4>
                    <ul class="rule-list">
                        <li><strong>技能匹配</strong>：按任务类型匹配员工专长（记账→会计组，工商→工商组）</li>
                        <li><strong>负载均衡</strong>：优先分配给当前负载最低的员工</li>
                        <li><strong>冲突检测</strong>：避免同一员工同时段分配冲突任务</li>
                        <li><strong>超时升级</strong>：超时1小时自动转派备用池 <span class="backend-badge">需后端支持</span></li>
                    </ul>
                </div>
            </div>
        `;
    },

    // ===== 智能分配 =====
    autoAssign() {
        const tasks = this.loadData();
        const employees = ['王芳', '李强', '张伟', '陈丽', '赵敏'];
        const skillMap = { bookkeeping: ['王芳', '张伟', '陈丽'], address: ['李强', '赵敏'], business: ['李强', '陈丽', '赵敏'] };
        let assignCount = 0;
        tasks.forEach(t => {
            if (t.assigned_to || t.status === 'completed') return;
            const candidates = skillMap[t.service_type] || employees;
            const loads = candidates.map(name => ({ name, load: tasks.filter(tt => tt.assigned_to === name && tt.status !== 'completed').length }));
            loads.sort((a, b) => a.load - b.load);
            t.assigned_to = loads[0].name;
            if (t.status === 'waiting') t.status = 'pending';
            assignCount++;
        });
        this.saveData(tasks);
        this.renderTab();
        showToast(`智能分配完成，已分配 ${assignCount} 个任务`, 'success');
    },

    // ===== 事件绑定 =====
    bindEvents() {
        const module = document.querySelector('.biz-module');
        if (!module) return;
        module.addEventListener('click', (e) => {
            const tab = e.target.closest('.biz-tab');
            if (tab) { this.currentTab = tab.dataset.tab; module.querySelectorAll('.biz-tab').forEach(t => t.classList.remove('active')); tab.classList.add('active'); this.renderTab(); return; }
            const actionBtn = e.target.closest('[data-action]');
            if (actionBtn) {
                if (actionBtn.dataset.action === 'update-task') this.updateTaskStatus(actionBtn.dataset.id);
            }
        });
        document.getElementById('btn-new-task').addEventListener('click', () => this.showNewTaskModal());
        document.getElementById('btn-auto-assign').addEventListener('click', () => this.autoAssign());
    },

    updateTaskStatus(id) {
        const tasks = this.loadData();
        const task = tasks.find(t => t.id === id);
        if (!task) return;
        const flow = { pending: 'in_progress', in_progress: 'review', review: 'completed', overdue: 'in_progress' };
        const next = flow[task.status];
        if (!next) { showToast('该任务无法继续推进', 'warning'); return; }
        task.status = next;
        if (next === 'completed') task.completed_at = new Date().toISOString();
        task.updated_at = new Date().toISOString();
        this.saveData(tasks);
        // 联动绩效
        if (next === 'completed') {
            const perfData = JSON.parse(localStorage.getItem('biz_perf_records') || '[]');
            perfData.push({ employee: task.assigned_to, task_id: task.id, task_title: task.title, completed_at: task.completed_at, time_spent: task.time_spent || 0 });
            localStorage.setItem('biz_perf_records', JSON.stringify(perfData));
        }
        this.renderTab();
        showToast(`任务已推进至：${next}`, 'success');
    },

    showNewTaskModal() {
        document.getElementById('tasks-modals').innerHTML = `
            <div class="modal active" id="new-task-modal"><div class="modal-content" style="max-width:500px;">
                <div class="modal-header"><h3>新建任务</h3><button class="modal-close" id="close-task-modal">&times;</button></div>
                <form id="new-task-form" class="modal-body-form">
                    <div class="form-group"><label>任务标题 *</label><input type="text" name="title" required></div>
                    <div class="form-row"><div class="form-group"><label>服务类型</label><select name="service_type"><option value="bookkeeping">代理记账</option><option value="address">挂靠地址</option><option value="business">工商代办</option></select></div><div class="form-group"><label>优先级</label><select name="priority"><option value="medium">中</option><option value="high">高</option><option value="urgent">紧急</option><option value="low">低</option></select></div></div>
                    <div class="form-row"><div class="form-group"><label>客户名称</label><input type="text" name="customer_name"></div><div class="form-group"><label>负责人</label><select name="assigned_to"><option value="">自动分配</option><option value="王芳">王芳</option><option value="李强">李强</option><option value="张伟">张伟</option><option value="陈丽">陈丽</option><option value="赵敏">赵敏</option></select></div></div>
                    <div class="form-group"><label>截止日期</label><input type="date" name="due_date"></div>
                    <div class="form-actions"><button type="button" class="btn-secondary" id="cancel-task-modal">取消</button><button type="submit" class="btn-primary">创建</button></div>
                </form>
            </div></div>
        `;
        document.getElementById('close-task-modal').addEventListener('click', () => document.getElementById('new-task-modal').remove());
        document.getElementById('cancel-task-modal').addEventListener('click', () => document.getElementById('new-task-modal').remove());
        document.getElementById('new-task-form').addEventListener('submit', (e) => {
            e.preventDefault();
            const fd = new FormData(e.target);
            const data = Object.fromEntries(fd);
            const tasks = this.loadData();
            tasks.unshift({ id: 'tsk_' + Date.now().toString(36), title: data.title, service_type: data.service_type, customer_name: data.customer_name, priority: data.priority, assigned_to: data.assigned_to, status: 'pending', order_id: '', order_no: '', due_date: data.due_date, created_at: new Date().toISOString(), completed_at: '', time_spent: 0 });
            this.saveData(tasks);
            document.getElementById('new-task-modal').remove();
            this.renderTab();
            showToast('任务创建成功', 'success');
        });
    }
};

// ===== 默认任务数据 =====
const defaultTasks = [
    { id: 'tsk_001', title: '月度做账-未来科技', order_id: 'ord_001', order_no: 'ZH20240001', customer_name: '杭州未来科技有限公司', service_type: 'bookkeeping', status: 'in_progress', priority: 'high', assigned_to: '王芳', due_date: '2024-03-15', created_at: '2024-02-01T08:00:00Z', completed_at: '', time_spent: 3.5 },
    { id: 'tsk_002', title: '纳税申报-未来科技', order_id: 'ord_001', order_no: 'ZH20240001', customer_name: '杭州未来科技有限公司', service_type: 'bookkeeping', status: 'pending', priority: 'high', assigned_to: '王芳', due_date: '2024-03-20', created_at: '2024-02-01T08:00:00Z', completed_at: '', time_spent: 0 },
    { id: 'tsk_003', title: '出口退税申报-盛达贸易', order_id: 'ord_002', order_no: 'ZH20240002', customer_name: '浙江盛达贸易有限公司', service_type: 'bookkeeping', status: 'completed', priority: 'medium', assigned_to: '张伟', due_date: '2024-02-28', created_at: '2024-02-01T08:00:00Z', completed_at: '2024-02-25T10:00:00Z', time_spent: 4 },
    { id: 'tsk_004', title: '确认地址资源-恒通建设', order_id: 'ord_004', order_no: 'ZH20240004', customer_name: '浙江恒通建设工程', service_type: 'address', status: 'completed', priority: 'medium', assigned_to: '李强', due_date: '2024-02-10', created_at: '2024-02-01T08:00:00Z', completed_at: '2024-02-08T10:00:00Z', time_spent: 1 },
    { id: 'tsk_005', title: '公司注册-鼎盛餐饮', order_id: 'ord_005', order_no: 'ZH20240005', customer_name: '杭州鼎盛餐饮管理', service_type: 'business', status: 'in_progress', priority: 'high', assigned_to: '陈丽', due_date: '2024-03-10', created_at: '2024-02-25T08:00:00Z', completed_at: '', time_spent: 2 },
    { id: 'tsk_006', title: '经营范围变更-锐智教育', order_id: 'ord_007', order_no: 'ZH20240007', customer_name: '杭州锐智教育科技', service_type: 'business', status: 'review', priority: 'medium', assigned_to: '赵敏', due_date: '2024-03-08', created_at: '2024-03-02T08:00:00Z', completed_at: '', time_spent: 1.5 },
    { id: 'tsk_007', title: '月度做账-绿源环保', order_id: 'ord_006', order_no: 'ZH20240006', customer_name: '浙江绿源环保科技', service_type: 'bookkeeping', status: 'pending', priority: 'medium', assigned_to: '张伟', due_date: '2024-03-18', created_at: '2024-03-05T08:00:00Z', completed_at: '', time_spent: 0 },
    { id: 'tsk_008', title: '收集客户资料-味道餐饮', order_id: 'ord_008', order_no: 'ZH20240008', customer_name: '杭州味道餐饮店', service_type: 'bookkeeping', status: 'overdue', priority: 'urgent', assigned_to: '', due_date: '2024-03-10', created_at: '2024-03-01T08:00:00Z', completed_at: '', time_spent: 0 },
    { id: 'tsk_009', title: '税务筹划方案-绿源环保', order_id: 'ord_006', order_no: 'ZH20240006', customer_name: '浙江绿源环保科技', service_type: 'bookkeeping', status: 'waiting', priority: 'low', assigned_to: '', due_date: '2024-03-25', created_at: '2024-03-05T08:00:00Z', completed_at: '', time_spent: 0 }
];
