// 订单管理模块 - 浙杭企服（代理记账业务系统）
// 功能：服务类型分类、状态机流转、支付联动、客户信用、数据看板

const Orders = {
    currentTab: 'list',
    searchText: '',
    filterType: 'all',
    filterStatus: 'all',

    init() { this.autoCheck(); this.render(); this.bindEvents(); },
    destroy() {},

    // ===== 数据存储 =====
    loadData() { const d = localStorage.getItem('biz_orders'); if (!d) { localStorage.setItem('biz_orders', JSON.stringify(defaultOrders)); return [...defaultOrders]; } return JSON.parse(d); },
    saveData(data) { localStorage.setItem('biz_orders', JSON.stringify(data)); },
    loadConfig() { const d = localStorage.getItem('biz_order_config'); if (!d) { localStorage.setItem('biz_order_config', JSON.stringify(defaultServiceConfig)); return {...defaultServiceConfig}; } return JSON.parse(d); },

    // ===== 自动检查（逾期、信用） =====
    autoCheck() {
        const orders = this.loadData();
        const now = Date.now();
        let changed = false;
        orders.forEach(o => {
            if (o.status === 'pending_payment' && o.payment_due) {
                const due = new Date(o.payment_due).getTime();
                if (now > due) { o.overdue_days = Math.floor((now - due) / 86400000); changed = true; }
            }
        });
        if (changed) this.saveData(orders);
    },

    // ===== 主渲染 =====
    render() {
        const contentArea = document.querySelector('.content-area');
        contentArea.innerHTML = `
            <div class="biz-module">
                <div class="biz-module-header"><h2><i class="fa-solid fa-file-invoice"></i> 订单管理</h2>
                    <div class="biz-header-actions"><button class="btn-primary" id="btn-new-order"><i class="fa-solid fa-plus"></i> 新建订单</button></div>
                </div>
                <div class="biz-tabs">
                    <button class="biz-tab active" data-tab="list"><i class="fa-solid fa-list"></i> 订单列表</button>
                    <button class="biz-tab" data-tab="dashboard"><i class="fa-solid fa-chart-pie"></i> 数据看板</button>
                    <button class="biz-tab" data-tab="payment"><i class="fa-solid fa-credit-card"></i> 收款管理</button>
                    <button class="biz-tab" data-tab="credit"><i class="fa-solid fa-user-shield"></i> 客户信用</button>
                    <button class="biz-tab" data-tab="config"><i class="fa-solid fa-sliders"></i> 服务配置</button>
                </div>
                <div class="biz-tab-content" id="orders-tab-content"></div>
            </div>
            <div id="orders-modals"></div>
        `;
        this.renderTab();
    },

    renderTab() {
        const container = document.getElementById('orders-tab-content');
        switch (this.currentTab) {
            case 'list': container.innerHTML = this.renderListTab(); this.renderTableRows(); break;
            case 'dashboard': container.innerHTML = this.renderDashboard(); break;
            case 'payment': container.innerHTML = this.renderPaymentTab(); break;
            case 'credit': container.innerHTML = this.renderCreditTab(); break;
            case 'config': container.innerHTML = this.renderConfigTab(); break;
        }
    },

    // ===== 订单列表 =====
    renderListTab() {
        const orders = this.loadData();
        const stats = this.calcStats(orders);
        return `
            <div class="biz-stats-row">
                <div class="biz-stat-card"><span class="stat-val">${stats.total}</span><span class="stat-lbl">总订单</span></div>
                <div class="biz-stat-card"><span class="stat-val c-blue">${stats.processing}</span><span class="stat-lbl">处理中</span></div>
                <div class="biz-stat-card"><span class="stat-val c-green">${stats.completed}</span><span class="stat-lbl">已完成</span></div>
                <div class="biz-stat-card"><span class="stat-val c-red">${stats.overdue}</span><span class="stat-lbl">逾期</span></div>
                <div class="biz-stat-card"><span class="stat-val c-orange">¥${(stats.revenue / 10000).toFixed(1)}万</span><span class="stat-lbl">总营收</span></div>
            </div>
            <div class="biz-toolbar">
                <div class="search-box"><i class="fa-solid fa-search"></i><input type="text" id="order-search" placeholder="搜索客户/订单号..." value="${escapeHtml(this.searchText)}"></div>
                <select class="filter-select" id="order-filter-type"><option value="all">服务类型</option><option value="bookkeeping">代理记账</option><option value="address">挂靠地址</option><option value="business">工商代办</option></select>
                <select class="filter-select" id="order-filter-status"><option value="all">状态</option><option value="pending_payment">待支付</option><option value="processing">处理中</option><option value="completed">已完成</option><option value="dispute">争议中</option><option value="cancelled">已取消</option></select>
            </div>
            <div class="biz-table-wrap"><table class="biz-table"><thead><tr>
                <th>订单号</th><th>客户</th><th>服务类型</th><th>金额</th><th>状态</th><th>创建时间</th><th>操作</th>
            </tr></thead><tbody id="orders-tbody"></tbody></table></div>
        `;
    },

    renderTableRows() {
        const tbody = document.getElementById('orders-tbody');
        if (!tbody) return;
        let orders = this.loadData();
        if (this.searchText) { const s = this.searchText.toLowerCase(); orders = orders.filter(o => (o.customer_name || '').toLowerCase().includes(s) || (o.order_no || '').includes(s)); }
        if (this.filterType !== 'all') orders = orders.filter(o => o.service_type === this.filterType);
        if (this.filterStatus !== 'all') orders = orders.filter(o => o.status === this.filterStatus);

        const typeMap = { bookkeeping: '代理记账', address: '挂靠地址', business: '工商代办' };
        const statusMap = { pending_payment: '待支付', processing: '处理中', completed: '已完成', dispute: '争议中', cancelled: '已取消', waiting_resource: '待资源', pending_approval: '待审批' };
        const statusClass = { pending_payment: 'st-warn', processing: 'st-info', completed: 'st-ok', dispute: 'st-danger', cancelled: 'st-muted', waiting_resource: 'st-warn', pending_approval: 'st-purple' };

        if (orders.length === 0) { tbody.innerHTML = '<tr><td colspan="7"><div class="empty-state">暂无订单数据</div></td></tr>'; return; }
        tbody.innerHTML = orders.map(o => `<tr>
            <td><strong>${escapeHtml(o.order_no)}</strong></td>
            <td>${escapeHtml(o.customer_name)}</td>
            <td><span class="type-badge type-${o.service_type}">${typeMap[o.service_type] || o.service_type}</span></td>
            <td class="td-money">¥${(o.amount || 0).toLocaleString()}</td>
            <td><span class="status-tag ${statusClass[o.status] || ''}">${statusMap[o.status] || o.status}</span></td>
            <td class="td-time">${o.created_at ? new Date(o.created_at).toLocaleDateString('zh-CN') : '-'}</td>
            <td><button class="btn-mini btn-view" data-action="view" data-id="${o.id}">详情</button> <button class="btn-mini btn-operate" data-action="status" data-id="${o.id}">操作</button></td>
        </tr>`).join('');
    },

    calcStats(orders) {
        return {
            total: orders.length,
            processing: orders.filter(o => o.status === 'processing').length,
            completed: orders.filter(o => o.status === 'completed').length,
            overdue: orders.filter(o => o.overdue_days > 0).length,
            revenue: orders.filter(o => o.status === 'completed').reduce((sum, o) => sum + (o.amount || 0), 0)
        };
    },

    // ===== 数据看板 =====
    renderDashboard() {
        const orders = this.loadData();
        const typeCount = { bookkeeping: 0, address: 0, business: 0 };
        const monthRevenue = {};
        orders.forEach(o => { typeCount[o.service_type] = (typeCount[o.service_type] || 0) + 1; if (o.status === 'completed') { const m = (o.created_at || '').slice(0, 7); monthRevenue[m] = (monthRevenue[m] || 0) + (o.amount || 0); } });
        const total = orders.length || 1;
        const sourceCount = {};
        orders.forEach(o => { const s = o.source || '其他'; sourceCount[s] = (sourceCount[s] || 0) + 1; });

        return `
            <div class="dashboard-grid">
                <div class="dash-card"><h4><i class="fa-solid fa-pie-chart"></i> 服务类型分布</h4>
                    <div class="chart-bars">${Object.entries(typeCount).map(([k, v]) => `<div class="chart-bar-item"><span class="bar-label">${k === 'bookkeeping' ? '代理记账' : k === 'address' ? '挂靠地址' : '工商代办'}</span><div class="chart-bar"><div class="chart-bar-inner" style="width:${(v / total * 100).toFixed(0)}%;background:${k === 'bookkeeping' ? '#4f46e5' : k === 'address' ? '#10b981' : '#f59e0b'}"></div></div><span class="bar-pct">${v}单</span></div>`).join('')}</div>
                </div>
                <div class="dash-card"><h4><i class="fa-solid fa-funnel-dollar"></i> 来源渠道</h4>
                    <div class="chart-bars">${Object.entries(sourceCount).sort((a, b) => b[1] - a[1]).map(([k, v]) => `<div class="chart-bar-item"><span class="bar-label">${escapeHtml(k)}</span><div class="chart-bar"><div class="chart-bar-inner" style="width:${(v / total * 100).toFixed(0)}%;background:#6366f1"></div></div><span class="bar-pct">${v}</span></div>`).join('')}</div>
                </div>
                <div class="dash-card"><h4><i class="fa-solid fa-chart-line"></i> 月度营收趋势</h4>
                    <div class="chart-bars">${Object.entries(monthRevenue).sort().slice(-6).map(([m, v]) => `<div class="chart-bar-item"><span class="bar-label">${m.slice(5)}月</span><div class="chart-bar"><div class="chart-bar-inner" style="width:${(v / (Math.max(...Object.values(monthRevenue)) || 1) * 100).toFixed(0)}%;background:#10b981"></div></div><span class="bar-pct">¥${(v / 10000).toFixed(1)}万</span></div>`).join('')}</div>
                </div>
                <div class="dash-card"><h4><i class="fa-solid fa-robot"></i> 智能预警 <span class="backend-badge">需后端支持</span></h4>
                    <div class="ai-alert-list">
                        <div class="ai-alert warn"><i class="fa-solid fa-triangle-exclamation"></i> ${orders.filter(o => o.overdue_days > 0).length}笔订单存在收款逾期</div>
                        <div class="ai-alert info"><i class="fa-solid fa-info-circle"></i> 本月代理记账订单较上月增长12%</div>
                        <div class="ai-alert danger"><i class="fa-solid fa-exclamation-circle"></i> 挂靠地址库存剩余3个，建议补充</div>
                    </div>
                </div>
            </div>
        `;
    },

    // ===== 收款管理 =====
    renderPaymentTab() {
        const orders = this.loadData();
        const pending = orders.filter(o => o.status === 'pending_payment' || o.overdue_days > 0);
        const paid = orders.filter(o => o.paid_amount > 0);
        const totalReceivable = pending.reduce((s, o) => s + (o.amount - (o.paid_amount || 0)), 0);
        return `
            <div class="biz-stats-row">
                <div class="biz-stat-card"><span class="stat-val c-red">¥${totalReceivable.toLocaleString()}</span><span class="stat-lbl">应收账款</span></div>
                <div class="biz-stat-card"><span class="stat-val c-orange">${pending.length}</span><span class="stat-lbl">待收款</span></div>
                <div class="biz-stat-card"><span class="stat-val c-green">${paid.length}</span><span class="stat-lbl">已收款</span></div>
            </div>
            <h4 style="margin:16px 0 10px;font-size:14px;">待收款订单</h4>
            <div class="biz-table-wrap"><table class="biz-table"><thead><tr><th>订单号</th><th>客户</th><th>应收</th><th>已收</th><th>逾期天数</th><th>操作</th></tr></thead><tbody>
                ${pending.map(o => `<tr>
                    <td>${escapeHtml(o.order_no)}</td><td>${escapeHtml(o.customer_name)}</td>
                    <td class="td-money">¥${(o.amount || 0).toLocaleString()}</td>
                    <td class="td-money">¥${(o.paid_amount || 0).toLocaleString()}</td>
                    <td>${o.overdue_days > 0 ? `<span class="c-red">${o.overdue_days}天</span>` : '-'}</td>
                    <td><button class="btn-mini btn-confirm-pay" data-action="pay" data-id="${o.id}">确认收款</button></td>
                </tr>`).join('') || '<tr><td colspan="6" class="empty-state">暂无待收款</td></tr>'}
            </tbody></table></div>
            <div class="payment-note"><p><i class="fa-solid fa-info-circle"></i> 分期支付：系统支持按比例分期，逾期自动发送阶梯提醒（3/7/15天） <span class="backend-badge">需后端支持</span></p></div>
        `;
    },

    // ===== 客户信用 =====
    renderCreditTab() {
        const orders = this.loadData();
        const customers = {};
        orders.forEach(o => {
            if (!customers[o.customer_name]) customers[o.customer_name] = { name: o.customer_name, total: 0, completed: 0, overdue: 0, revenue: 0 };
            customers[o.customer_name].total++;
            if (o.status === 'completed') customers[o.customer_name].completed++;
            if (o.overdue_days > 0) customers[o.customer_name].overdue++;
            customers[o.customer_name].revenue += (o.amount || 0);
        });
        const customerList = Object.values(customers).map(c => {
            c.score = Math.max(0, 100 - c.overdue * 15 + c.completed * 5);
            c.score = Math.min(100, c.score);
            c.level = c.score >= 80 ? 'A' : c.score >= 60 ? 'B' : c.score >= 40 ? 'C' : 'D';
            return c;
        }).sort((a, b) => b.score - a.score);

        return `
            <div class="credit-section">
                <h4><i class="fa-solid fa-shield-halved"></i> 客户信用评估</h4>
                <p class="hint-text">信用分=100 - 逾期次数×15 + 完成订单×5（上限100）</p>
                <div class="biz-table-wrap"><table class="biz-table"><thead><tr><th>客户</th><th>信用分</th><th>等级</th><th>订单数</th><th>已完成</th><th>逾期次数</th><th>累计金额</th></tr></thead><tbody>
                    ${customerList.map(c => `<tr>
                        <td><strong>${escapeHtml(c.name)}</strong></td>
                        <td><span class="score-badge score-${c.score >= 80 ? 'high' : c.score >= 60 ? 'mid' : 'low'}">${c.score}</span></td>
                        <td><span class="credit-level level-${c.level}">${c.level}</span></td>
                        <td>${c.total}</td><td>${c.completed}</td>
                        <td>${c.overdue > 0 ? `<span class="c-red">${c.overdue}</span>` : '0'}</td>
                        <td class="td-money">¥${c.revenue.toLocaleString()}</td>
                    </tr>`).join('')}
                </tbody></table></div>
                <p class="hint-text" style="margin-top:12px;"><i class="fa-solid fa-lock"></i> 信用分低于40的客户新订单需经理审批 <span class="backend-badge">规则引擎需后端</span></p>
            </div>
        `;
    },

    // ===== 服务配置 =====
    renderConfigTab() {
        const config = this.loadConfig();
        return `
            <div class="config-section">
                <h4><i class="fa-solid fa-cogs"></i> 服务类型配置</h4>
                <div class="config-cards">
                    ${config.services.map(s => `
                        <div class="config-card"><div class="config-card-header"><strong>${escapeHtml(s.name)}</strong><span class="type-badge type-${s.type}">${s.type}</span></div>
                        <div class="config-card-body">
                            <div class="config-field"><span>基础价格</span><strong>¥${s.basePrice}</strong></div>
                            <div class="config-field"><span>服务周期</span><strong>${s.cycle}</strong></div>
                            <div class="config-field"><span>必填字段</span><span class="text-muted">${s.requiredFields.join('、')}</span></div>
                            ${s.extras ? `<div class="config-field"><span>附加服务</span><span class="text-muted">${s.extras.join('、')}</span></div>` : ''}
                        </div></div>
                    `).join('')}
                </div>
                <p class="hint-text"><i class="fa-solid fa-wand-magic-sparkles"></i> 服务类型、定价规则、字段映射均支持后台动态配置 <span class="backend-badge">需后端支持</span></p>
            </div>
        `;
    },

    // ===== 新建订单弹窗 =====
    showNewOrderModal() {
        document.getElementById('orders-modals').innerHTML = `
            <div class="modal active" id="new-order-modal"><div class="modal-content" style="max-width:650px;">
                <div class="modal-header"><h3><i class="fa-solid fa-plus-circle"></i> 新建订单</h3><button class="modal-close" id="close-order-modal">&times;</button></div>
                <form id="new-order-form" class="modal-body-form">
                    <div class="form-row"><div class="form-group"><label>客户名称 *</label><input type="text" name="customer_name" required></div><div class="form-group"><label>联系电话</label><input type="tel" name="phone"></div></div>
                    <div class="form-row"><div class="form-group"><label>服务类型 *</label><select name="service_type" required id="order-service-type"><option value="">请选择</option><option value="bookkeeping">代理记账</option><option value="address">挂靠地址</option><option value="business">工商代办</option></select></div><div class="form-group"><label>来源渠道</label><select name="source"><option value="手工录入">手工录入</option><option value="美团">美团</option><option value="抖音">抖音</option><option value="转介绍">转介绍</option><option value="百度">百度</option></select></div></div>
                    <div id="service-extra-fields"></div>
                    <div class="form-row"><div class="form-group"><label>订单金额(元) *</label><input type="number" name="amount" required min="0" step="0.01"></div><div class="form-group"><label>付款期限</label><input type="date" name="payment_due"></div></div>
                    <div class="form-group"><label>备注</label><textarea name="notes" rows="2"></textarea></div>
                    <div class="form-actions"><button type="button" class="btn-secondary" id="cancel-order-modal">取消</button><button type="submit" class="btn-primary"><i class="fa-solid fa-check"></i> 创建订单</button></div>
                </form>
            </div></div>
        `;
        document.getElementById('close-order-modal').addEventListener('click', () => document.getElementById('new-order-modal').remove());
        document.getElementById('cancel-order-modal').addEventListener('click', () => document.getElementById('new-order-modal').remove());
        document.getElementById('order-service-type').addEventListener('change', (e) => this.renderExtraFields(e.target.value));
        document.getElementById('new-order-form').addEventListener('submit', (e) => this.handleCreateOrder(e));
    },

    renderExtraFields(type) {
        const container = document.getElementById('service-extra-fields');
        if (type === 'bookkeeping') {
            container.innerHTML = `<div class="form-row"><div class="form-group"><label>公司规模</label><select name="company_scale"><option value="small">小微企业</option><option value="general">一般纳税人</option></select></div><div class="form-group"><label>账套类型</label><select name="accounting_system"><option value="金蝶">金蝶</option><option value="用友">用友</option></select></div></div><div class="form-row"><div class="form-group"><label>服务周期</label><select name="service_cycle"><option value="monthly">月度</option><option value="quarterly">季度</option><option value="yearly">年度</option></select></div><div class="form-group"><label>附加服务</label><select name="extras" multiple><option value="税务筹划">税务筹划</option><option value="审计协助">审计协助</option><option value="年报编制">年报编制</option></select></div></div>`;
        } else if (type === 'address') {
            container.innerHTML = `<div class="form-row"><div class="form-group"><label>地址类型</label><select name="address_type"><option value="virtual">虚拟地址</option><option value="actual">实际地址</option></select></div><div class="form-group"><label>所属区域</label><select name="district"><option value="西湖区">西湖区</option><option value="滨江区">滨江区</option><option value="余杭区">余杭区</option><option value="萧山区">萧山区</option><option value="拱墅区">拱墅区</option></select></div></div><div class="form-row"><div class="form-group"><label>使用期限</label><select name="duration"><option value="1year">1年</option><option value="2year">2年</option><option value="3year">3年</option></select></div><div class="form-group"><label>含发票接收</label><select name="invoice_receive"><option value="yes">是</option><option value="no">否</option></select></div></div>`;
        } else if (type === 'business') {
            container.innerHTML = `<div class="form-row"><div class="form-group"><label>业务类型</label><select name="biz_type"><option value="register">公司注册</option><option value="change">变更</option><option value="cancel">注销</option></select></div><div class="form-group"><label>变更项</label><select name="change_item"><option value="">不适用</option><option value="legal_person">法人变更</option><option value="equity">股权变更</option><option value="scope">经营范围变更</option><option value="address">地址变更</option></select></div></div>`;
        } else {
            container.innerHTML = '';
        }
    },

    handleCreateOrder(e) {
        e.preventDefault();
        const fd = new FormData(e.target);
        const data = Object.fromEntries(fd);
        const orders = this.loadData();
        const order = {
            id: 'ord_' + Date.now().toString(36),
            order_no: 'ZH' + new Date().getFullYear() + String(orders.length + 1).padStart(4, '0'),
            customer_name: data.customer_name,
            phone: data.phone || '',
            service_type: data.service_type,
            source: data.source || '手工录入',
            amount: parseFloat(data.amount) || 0,
            paid_amount: 0,
            payment_due: data.payment_due || '',
            status: 'pending_payment',
            overdue_days: 0,
            notes: data.notes || '',
            extra: {},
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
        };
        // 存储额外字段
        ['company_scale', 'accounting_system', 'service_cycle', 'extras', 'address_type', 'district', 'duration', 'invoice_receive', 'biz_type', 'change_item'].forEach(k => { if (data[k]) order.extra[k] = data[k]; });
        // 唯一性校验
        const dup = orders.find(o => o.customer_name === order.customer_name && o.service_type === order.service_type && o.status !== 'completed' && o.status !== 'cancelled');
        if (dup) { if (!confirm(`该客户已有一笔未完成的同类型订单(${dup.order_no})，是否仍要创建？`)) return; }
        orders.unshift(order);
        this.saveData(orders);
        // 自动生成关联任务
        this.generateTasks(order);
        document.getElementById('new-order-modal').remove();
        this.renderTab();
        showToast('订单创建成功，已自动生成关联任务', 'success');
    },

    // ===== 生成关联任务（联动任务模块） =====
    generateTasks(order) {
        const tasks = JSON.parse(localStorage.getItem('biz_tasks') || '[]');
        const templates = { bookkeeping: ['收集客户资料', '建立账套', '月度做账', '纳税申报'], address: ['确认地址资源', '签署协议', '办理地址托管'], business: ['准备材料清单', '提交工商申请', '领取证照'] };
        const taskList = templates[order.service_type] || ['处理订单'];
        taskList.forEach((name, i) => {
            tasks.push({
                id: 'tsk_' + Date.now().toString(36) + '_' + i,
                title: name,
                order_id: order.id,
                order_no: order.order_no,
                customer_name: order.customer_name,
                service_type: order.service_type,
                status: i === 0 ? 'pending' : 'waiting',
                priority: i === 0 ? 'high' : 'medium',
                assigned_to: '',
                dependency: i > 0 ? taskList[i - 1] : '',
                created_at: new Date().toISOString(),
                due_date: '',
                completed_at: '',
                time_spent: 0
            });
        });
        localStorage.setItem('biz_tasks', JSON.stringify(tasks));
    },

    // ===== 操作：确认收款 =====
    confirmPayment(id) {
        const orders = this.loadData();
        const order = orders.find(o => o.id === id);
        if (!order) return;
        order.paid_amount = order.amount;
        order.status = 'processing';
        order.overdue_days = 0;
        order.updated_at = new Date().toISOString();
        this.saveData(orders);
        // 联动财务记录
        const records = JSON.parse(localStorage.getItem('biz_finance_records') || '[]');
        records.push({ id: 'fin_' + Date.now().toString(36), type: 'income', order_id: order.id, order_no: order.order_no, customer: order.customer_name, amount: order.amount, category: order.service_type, date: new Date().toISOString(), status: 'confirmed' });
        localStorage.setItem('biz_finance_records', JSON.stringify(records));
        this.renderTab();
        showToast('收款确认，订单已进入处理中', 'success');
    },

    // ===== 事件绑定 =====
    bindEvents() {
        const module = document.querySelector('.biz-module');
        if (!module) return;
        module.addEventListener('click', (e) => {
            const tab = e.target.closest('.biz-tab');
            if (tab) { this.currentTab = tab.dataset.tab; module.querySelectorAll('.biz-tab').forEach(t => t.classList.remove('active')); tab.classList.add('active'); this.renderTab(); this.rebindFilters(); return; }
            const actionBtn = e.target.closest('[data-action]');
            if (actionBtn) {
                const action = actionBtn.dataset.action, id = actionBtn.dataset.id;
                if (action === 'pay') this.confirmPayment(id);
                else if (action === 'status') this.showStatusModal(id);
                return;
            }
        });
        document.getElementById('btn-new-order').addEventListener('click', () => this.showNewOrderModal());
        this.rebindFilters();
    },

    rebindFilters() {
        const s = document.getElementById('order-search');
        if (s) { let t; s.addEventListener('input', () => { clearTimeout(t); t = setTimeout(() => { this.searchText = s.value.trim(); this.renderTableRows(); }, 300); }); }
        const ft = document.getElementById('order-filter-type');
        if (ft) ft.addEventListener('change', (e) => { this.filterType = e.target.value; this.renderTableRows(); });
        const fs = document.getElementById('order-filter-status');
        if (fs) fs.addEventListener('change', (e) => { this.filterStatus = e.target.value; this.renderTableRows(); });
    },

    showStatusModal(id) {
        const orders = this.loadData();
        const order = orders.find(o => o.id === id);
        if (!order) return;
        const newStatus = prompt(`当前状态：${order.status}\n输入新状态（processing/completed/dispute/cancelled）：`);
        if (!newStatus) return;
        order.status = newStatus;
        order.updated_at = new Date().toISOString();
        this.saveData(orders);
        this.renderTab();
        showToast('状态已更新', 'success');
    }
};

// ===== 默认服务配置 =====
const defaultServiceConfig = {
    services: [
        { type: 'bookkeeping', name: '代理记账-小微企业', basePrice: 2400, cycle: '年度', requiredFields: ['公司规模', '账套类型', '服务周期'], extras: ['税务筹划', '审计协助', '年报编制'] },
        { type: 'bookkeeping', name: '代理记账-一般纳税人', basePrice: 6000, cycle: '年度', requiredFields: ['公司规模', '账套类型', '服务周期', '账目类型'], extras: ['税务筹划', '出口退税', '成本核算'] },
        { type: 'address', name: '挂靠地址-虚拟', basePrice: 3000, cycle: '年度', requiredFields: ['地址类型', '所属区域', '使用期限'], extras: [] },
        { type: 'address', name: '挂靠地址-实际办公', basePrice: 12000, cycle: '年度', requiredFields: ['地址类型', '所属区域', '使用期限', '面积'], extras: ['发票接收'] },
        { type: 'business', name: '公司注册', basePrice: 1500, cycle: '一次性', requiredFields: ['业务类型', '公司名称', '注册资本'], extras: ['加急办理'] },
        { type: 'business', name: '工商变更', basePrice: 800, cycle: '一次性', requiredFields: ['业务类型', '变更项'], extras: [] },
        { type: 'business', name: '公司注销', basePrice: 3000, cycle: '一次性', requiredFields: ['业务类型', '税务状态'], extras: ['税务清算'] }
    ]
};

// ===== 默认订单数据 =====
const defaultOrders = [
    { id: 'ord_001', order_no: 'ZH20240001', customer_name: '杭州未来科技有限公司', phone: '13800001111', service_type: 'bookkeeping', source: '抖音', amount: 6000, paid_amount: 6000, payment_due: '2024-02-01', status: 'processing', overdue_days: 0, extra: { company_scale: 'general', accounting_system: '金蝶', service_cycle: 'yearly' }, notes: '一般纳税人，年度代账', created_at: '2024-01-15T08:00:00Z', updated_at: '2024-02-01T10:00:00Z' },
    { id: 'ord_002', order_no: 'ZH20240002', customer_name: '浙江盛达贸易有限公司', phone: '13900002222', service_type: 'bookkeeping', source: '美团', amount: 9600, paid_amount: 9600, payment_due: '2024-01-20', status: 'completed', overdue_days: 0, extra: { company_scale: 'general', accounting_system: '用友', service_cycle: 'yearly', extras: '出口退税' }, notes: '含出口退税服务', created_at: '2024-01-10T08:00:00Z', updated_at: '2024-03-01T10:00:00Z' },
    { id: 'ord_003', order_no: 'ZH20240003', customer_name: '杭州云帆网络科技', phone: '13500005555', service_type: 'bookkeeping', source: '百度', amount: 2400, paid_amount: 0, payment_due: '2024-03-01', status: 'pending_payment', overdue_days: 15, extra: { company_scale: 'small', service_cycle: 'yearly' }, notes: '', created_at: '2024-02-20T08:00:00Z', updated_at: '2024-02-20T08:00:00Z' },
    { id: 'ord_004', order_no: 'ZH20240004', customer_name: '浙江恒通建设工程', phone: '13600004444', service_type: 'address', source: '转介绍', amount: 3000, paid_amount: 3000, payment_due: '2024-02-15', status: 'completed', overdue_days: 0, extra: { address_type: 'virtual', district: '西湖区', duration: '1year' }, notes: '挂靠注册地址', created_at: '2024-02-01T08:00:00Z', updated_at: '2024-02-15T10:00:00Z' },
    { id: 'ord_005', order_no: 'ZH20240005', customer_name: '杭州鼎盛餐饮管理', phone: '13300007777', service_type: 'business', source: '美团', amount: 1500, paid_amount: 1500, payment_due: '2024-03-01', status: 'processing', overdue_days: 0, extra: { biz_type: 'register' }, notes: '新公司注册', created_at: '2024-02-25T08:00:00Z', updated_at: '2024-03-01T10:00:00Z' },
    { id: 'ord_006', order_no: 'ZH20240006', customer_name: '浙江绿源环保科技', phone: '13400006666', service_type: 'bookkeeping', source: '抖音', amount: 7200, paid_amount: 3600, payment_due: '2024-03-10', status: 'processing', overdue_days: 0, extra: { company_scale: 'general', extras: '税务筹划' }, notes: '分期付款，首付50%', created_at: '2024-03-01T08:00:00Z', updated_at: '2024-03-05T10:00:00Z' },
    { id: 'ord_007', order_no: 'ZH20240007', customer_name: '杭州锐智教育科技', phone: '13700003333', service_type: 'business', source: '手工录入', amount: 800, paid_amount: 800, payment_due: '2024-03-05', status: 'completed', overdue_days: 0, extra: { biz_type: 'change', change_item: 'scope' }, notes: '经营范围变更', created_at: '2024-03-02T08:00:00Z', updated_at: '2024-03-10T10:00:00Z' },
    { id: 'ord_008', order_no: 'ZH20240008', customer_name: '杭州味道餐饮店', phone: '13812345678', service_type: 'bookkeeping', source: '美团', amount: 2400, paid_amount: 0, payment_due: '2024-03-15', status: 'pending_payment', overdue_days: 0, extra: { company_scale: 'small' }, notes: '', created_at: '2024-03-12T08:00:00Z', updated_at: '2024-03-12T08:00:00Z' }
];
