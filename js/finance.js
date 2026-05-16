// 财务管理模块 - 浙杭企服（代理记账业务系统）
// 功能：收支总览、应收应付、发票管理、对账中心、风控预警

const Finance = {
    currentTab: 'overview',

    init() { this.render(); this.bindEvents(); },
    destroy() {},

    loadRecords() { const d = localStorage.getItem('biz_finance_records'); if (!d) { localStorage.setItem('biz_finance_records', JSON.stringify(defaultFinanceRecords)); return [...defaultFinanceRecords]; } return JSON.parse(d); },
    saveRecords(data) { localStorage.setItem('biz_finance_records', JSON.stringify(data)); },
    loadInvoices() { const d = localStorage.getItem('biz_invoices'); if (!d) { localStorage.setItem('biz_invoices', JSON.stringify(defaultInvoices)); return [...defaultInvoices]; } return JSON.parse(d); },

    render() {
        const contentArea = document.querySelector('.content-area');
        contentArea.innerHTML = `
            <div class="biz-module">
                <div class="biz-module-header"><h2><i class="fa-solid fa-coins"></i> 财务管理</h2></div>
                <div class="biz-tabs">
                    <button class="biz-tab active" data-tab="overview"><i class="fa-solid fa-gauge"></i> 收支总览</button>
                    <button class="biz-tab" data-tab="receivable"><i class="fa-solid fa-hand-holding-dollar"></i> 应收管理</button>
                    <button class="biz-tab" data-tab="invoice"><i class="fa-solid fa-file-invoice-dollar"></i> 发票管理</button>
                    <button class="biz-tab" data-tab="reconcile"><i class="fa-solid fa-scale-balanced"></i> 对账中心</button>
                    <button class="biz-tab" data-tab="risk"><i class="fa-solid fa-shield-exclamation"></i> 风控预警</button>
                </div>
                <div class="biz-tab-content" id="finance-tab-content"></div>
            </div>
        `;
        this.renderTab();
    },

    renderTab() {
        const container = document.getElementById('finance-tab-content');
        switch (this.currentTab) {
            case 'overview': container.innerHTML = this.renderOverview(); break;
            case 'receivable': container.innerHTML = this.renderReceivable(); break;
            case 'invoice': container.innerHTML = this.renderInvoice(); break;
            case 'reconcile': container.innerHTML = this.renderReconcile(); break;
            case 'risk': container.innerHTML = this.renderRisk(); break;
        }
    },

    renderOverview() {
        const records = this.loadRecords();
        const income = records.filter(r => r.type === 'income').reduce((s, r) => s + r.amount, 0);
        const expense = records.filter(r => r.type === 'expense').reduce((s, r) => s + r.amount, 0);
        const profit = income - expense;
        const monthlyIncome = {};
        records.filter(r => r.type === 'income').forEach(r => { const m = (r.date || '').slice(0, 7); monthlyIncome[m] = (monthlyIncome[m] || 0) + r.amount; });
        const catIncome = {};
        records.filter(r => r.type === 'income').forEach(r => { const cat = r.category === 'bookkeeping' ? '代理记账' : r.category === 'address' ? '挂靠地址' : r.category === 'business' ? '工商代办' : '其他'; catIncome[cat] = (catIncome[cat] || 0) + r.amount; });
        const maxCat = Math.max(...Object.values(catIncome), 1);

        return `
            <div class="biz-stats-row">
                <div class="biz-stat-card"><span class="stat-val c-green">¥${income.toLocaleString()}</span><span class="stat-lbl">总收入</span></div>
                <div class="biz-stat-card"><span class="stat-val c-red">¥${expense.toLocaleString()}</span><span class="stat-lbl">总支出</span></div>
                <div class="biz-stat-card"><span class="stat-val c-blue">¥${profit.toLocaleString()}</span><span class="stat-lbl">净利润</span></div>
                <div class="biz-stat-card"><span class="stat-val">${records.length}</span><span class="stat-lbl">记录数</span></div>
            </div>
            <div class="dashboard-grid">
                <div class="dash-card"><h4><i class="fa-solid fa-chart-bar"></i> 收入构成</h4>
                    <div class="chart-bars">${Object.entries(catIncome).sort((a, b) => b[1] - a[1]).map(([k, v]) => `<div class="chart-bar-item"><span class="bar-label">${k}</span><div class="chart-bar"><div class="chart-bar-inner" style="width:${(v / maxCat * 100).toFixed(0)}%;background:#4f46e5"></div></div><span class="bar-pct">¥${(v / 10000).toFixed(1)}万</span></div>`).join('')}</div>
                    <p class="hint-text" style="margin-top:10px;">收入确认规则：代理记账按服务完成进度确认；挂靠地址按天分摊（1/365）</p>
                </div>
                <div class="dash-card"><h4><i class="fa-solid fa-chart-line"></i> 月度收入趋势</h4>
                    <div class="chart-bars">${Object.entries(monthlyIncome).sort().slice(-6).map(([m, v]) => `<div class="chart-bar-item"><span class="bar-label">${m.slice(5)}月</span><div class="chart-bar"><div class="chart-bar-inner" style="width:${(v / Math.max(...Object.values(monthlyIncome), 1) * 100).toFixed(0)}%;background:#10b981"></div></div><span class="bar-pct">¥${(v / 1000).toFixed(0)}k</span></div>`).join('')}</div>
                </div>
                <div class="dash-card"><h4><i class="fa-solid fa-calculator"></i> 成本核算模型</h4>
                    <table class="mini-table"><thead><tr><th>成本项</th><th>类型</th><th>计算方式</th></tr></thead><tbody>
                        <tr><td>员工工时</td><td>直接成本</td><td>任务耗时 × 时薪</td></tr>
                        <tr><td>外勤交通</td><td>直接成本</td><td>按次补贴</td></tr>
                        <tr><td>系统维护</td><td>间接成本</td><td>按订单数分摊</td></tr>
                        <tr><td>办公租金</td><td>间接成本</td><td>按人数分摊</td></tr>
                    </tbody></table>
                    <p class="hint-text"><span class="backend-badge">精细成本核算需后端支持</span></p>
                </div>
            </div>
        `;
    },

    renderReceivable() {
        const orders = JSON.parse(localStorage.getItem('biz_orders') || '[]');
        const receivable = orders.filter(o => o.status === 'pending_payment' || (o.paid_amount < o.amount && o.status !== 'cancelled'));
        const totalAR = receivable.reduce((s, o) => s + (o.amount - (o.paid_amount || 0)), 0);
        return `
            <div class="biz-stats-row">
                <div class="biz-stat-card"><span class="stat-val c-red">¥${totalAR.toLocaleString()}</span><span class="stat-lbl">应收总额</span></div>
                <div class="biz-stat-card"><span class="stat-val c-orange">${receivable.length}</span><span class="stat-lbl">待收客户</span></div>
            </div>
            <div class="biz-table-wrap"><table class="biz-table"><thead><tr><th>客户</th><th>订单号</th><th>应收金额</th><th>已收金额</th><th>欠款</th><th>逾期</th></tr></thead><tbody>
                ${receivable.map(o => `<tr><td>${escapeHtml(o.customer_name)}</td><td>${o.order_no}</td><td class="td-money">¥${o.amount.toLocaleString()}</td><td class="td-money">¥${(o.paid_amount || 0).toLocaleString()}</td><td class="td-money c-red">¥${(o.amount - (o.paid_amount || 0)).toLocaleString()}</td><td>${o.overdue_days > 0 ? `<span class="c-red">${o.overdue_days}天</span>` : '-'}</td></tr>`).join('')}
                ${receivable.length === 0 ? '<tr><td colspan="6" class="empty-state">暂无应收款项</td></tr>' : ''}
            </tbody></table></div>
            <p class="hint-text"><i class="fa-solid fa-bell"></i> 逾期阶梯提醒：3天/7天/15天自动发送不同模板催收通知 <span class="backend-badge">需后端</span></p>
        `;
    },

    renderInvoice() {
        const invoices = this.loadInvoices();
        const statusMap = { issued: '已开具', pending: '待开具', cancelled: '已作废' };
        return `
            <h4 style="margin-bottom:14px;"><i class="fa-solid fa-file-invoice-dollar"></i> 发票列表</h4>
            <div class="biz-table-wrap"><table class="biz-table"><thead><tr><th>发票号</th><th>客户</th><th>金额</th><th>税目</th><th>状态</th><th>开具日期</th></tr></thead><tbody>
                ${invoices.map(inv => `<tr><td>${escapeHtml(inv.invoice_no)}</td><td>${escapeHtml(inv.customer)}</td><td class="td-money">¥${inv.amount.toLocaleString()}</td><td>${escapeHtml(inv.tax_item)}</td><td><span class="status-tag st-${inv.status === 'issued' ? 'ok' : 'warn'}">${statusMap[inv.status]}</span></td><td class="td-time">${inv.date || '-'}</td></tr>`).join('')}
            </tbody></table></div>
            <div class="invoice-features" style="margin-top:16px;">
                <p><i class="fa-solid fa-link"></i> 自动匹配合同条款生成发票信息（服务名称、税目编码）</p>
                <p><i class="fa-solid fa-robot"></i> 对接税控盘API，支持一键批量开具并上传电子税务局 <span class="backend-badge">需后端支持</span></p>
                <p><i class="fa-solid fa-triangle-exclamation"></i> 风险：发票金额与账单不匹配时阻断开票并触发人工核查</p>
            </div>
        `;
    },

    renderReconcile() {
        return `
            <div class="reconcile-section">
                <h4><i class="fa-solid fa-scale-balanced"></i> 银行对账中心</h4>
                <div class="biz-stats-row">
                    <div class="biz-stat-card"><span class="stat-val c-green">85%</span><span class="stat-lbl">自动匹配率</span></div>
                    <div class="biz-stat-card"><span class="stat-val c-orange">3</span><span class="stat-lbl">待核实项</span></div>
                </div>
                <div class="reconcile-rules">
                    <h5>匹配规则</h5>
                    <ul class="rule-list">
                        <li><strong>摘要关键词匹配</strong>：通过银行流水摘要中的"XX公司记账费"关键词匹配</li>
                        <li><strong>金额精确匹配</strong>：流水金额与应收账单金额双重比对</li>
                        <li><strong>未匹配项</strong>：自动标记为"待核实"，人工处理</li>
                    </ul>
                </div>
                <div class="reconcile-mock">
                    <h5>最近银行流水（模拟）</h5>
                    <table class="mini-table"><thead><tr><th>日期</th><th>摘要</th><th>金额</th><th>匹配状态</th></tr></thead><tbody>
                        <tr><td>2024-03-10</td><td>未来科技-记账费</td><td>¥6,000</td><td><span class="status-tag st-ok">已匹配</span></td></tr>
                        <tr><td>2024-03-08</td><td>恒通建设-地址费</td><td>¥3,000</td><td><span class="status-tag st-ok">已匹配</span></td></tr>
                        <tr><td>2024-03-06</td><td>转账-个人</td><td>¥15,000</td><td><span class="status-tag st-warn">待核实</span></td></tr>
                    </tbody></table>
                </div>
                <p class="hint-text"><span class="backend-badge">银行API对接需后端支持</span></p>
            </div>
        `;
    },

    renderRisk() {
        return `
            <div class="risk-section">
                <h4><i class="fa-solid fa-shield-exclamation"></i> 财务风控预警</h4>
                <div class="ai-alert-list">
                    <div class="ai-alert danger"><i class="fa-solid fa-exclamation-circle"></i> <strong>资金异常</strong>：3月6日出现¥15,000异常大额支出，未匹配到对应订单</div>
                    <div class="ai-alert warn"><i class="fa-solid fa-clock"></i> <strong>进项逾期</strong>：2张进项发票即将超过180天认证期限</div>
                    <div class="ai-alert warn"><i class="fa-solid fa-user-slash"></i> <strong>收款逾期</strong>：杭州云帆网络科技逾期15天未付款(¥2,400)</div>
                    <div class="ai-alert info"><i class="fa-solid fa-chart-line"></i> <strong>收入波动</strong>：本周收款较均值下降32%，建议检查催收进度</div>
                    <div class="ai-alert success"><i class="fa-solid fa-check-circle"></i> <strong>税务合规</strong>：本月纳税申报已全部按时完成</div>
                </div>
                <div class="risk-rules" style="margin-top:18px;">
                    <h5>预警规则配置</h5>
                    <table class="mini-table"><thead><tr><th>规则</th><th>触发条件</th><th>通知方式</th><th>状态</th></tr></thead><tbody>
                        <tr><td>大额异常</td><td>单笔>日均3倍</td><td>邮件+钉钉</td><td><span class="c-green">启用</span></td></tr>
                        <tr><td>收款骤降</td><td>日收款<均值50%</td><td>邮件</td><td><span class="c-green">启用</span></td></tr>
                        <tr><td>进项逾期</td><td>发票>150天未认证</td><td>系统提醒</td><td><span class="c-green">启用</span></td></tr>
                        <tr><td>客户信用</td><td>逾期≥3次</td><td>审批拦截</td><td><span class="c-green">启用</span></td></tr>
                    </tbody></table>
                    <p class="hint-text"><span class="backend-badge">完整规则引擎需后端支持</span></p>
                </div>
            </div>
        `;
    },

    bindEvents() {
        const module = document.querySelector('.biz-module');
        if (!module) return;
        module.addEventListener('click', (e) => {
            const tab = e.target.closest('.biz-tab');
            if (tab) { this.currentTab = tab.dataset.tab; module.querySelectorAll('.biz-tab').forEach(t => t.classList.remove('active')); tab.classList.add('active'); this.renderTab(); }
        });
    }
};

const defaultFinanceRecords = [
    { id: 'fin_001', type: 'income', order_id: 'ord_001', order_no: 'ZH20240001', customer: '杭州未来科技', amount: 6000, category: 'bookkeeping', date: '2024-02-01T10:00:00Z', status: 'confirmed' },
    { id: 'fin_002', type: 'income', order_id: 'ord_002', order_no: 'ZH20240002', customer: '浙江盛达贸易', amount: 9600, category: 'bookkeeping', date: '2024-01-20T10:00:00Z', status: 'confirmed' },
    { id: 'fin_003', type: 'income', order_id: 'ord_004', order_no: 'ZH20240004', customer: '浙江恒通建设', amount: 3000, category: 'address', date: '2024-02-15T10:00:00Z', status: 'confirmed' },
    { id: 'fin_004', type: 'income', order_id: 'ord_005', order_no: 'ZH20240005', customer: '杭州鼎盛餐饮', amount: 1500, category: 'business', date: '2024-03-01T10:00:00Z', status: 'confirmed' },
    { id: 'fin_005', type: 'income', order_id: 'ord_006', order_no: 'ZH20240006', customer: '浙江绿源环保', amount: 3600, category: 'bookkeeping', date: '2024-03-05T10:00:00Z', status: 'confirmed' },
    { id: 'fin_006', type: 'income', order_id: 'ord_007', order_no: 'ZH20240007', customer: '杭州锐智教育', amount: 800, category: 'business', date: '2024-03-05T10:00:00Z', status: 'confirmed' },
    { id: 'fin_007', type: 'expense', order_id: '', order_no: '', customer: '办公租金', amount: 8000, category: 'overhead', date: '2024-03-01T10:00:00Z', status: 'confirmed' },
    { id: 'fin_008', type: 'expense', order_id: '', order_no: '', customer: '员工工资', amount: 35000, category: 'salary', date: '2024-03-05T10:00:00Z', status: 'confirmed' },
    { id: 'fin_009', type: 'expense', order_id: '', order_no: '', customer: '系统维护费', amount: 2000, category: 'overhead', date: '2024-03-01T10:00:00Z', status: 'confirmed' }
];

const defaultInvoices = [
    { id: 'inv_001', invoice_no: 'FP2024030001', customer: '杭州未来科技有限公司', amount: 6000, tax_item: '代理记账服务费', status: 'issued', date: '2024-02-05' },
    { id: 'inv_002', invoice_no: 'FP2024030002', customer: '浙江盛达贸易有限公司', amount: 9600, tax_item: '代理记账服务费', status: 'issued', date: '2024-01-25' },
    { id: 'inv_003', invoice_no: 'FP2024030003', customer: '浙江恒通建设工程', amount: 3000, tax_item: '地址托管服务费', status: 'issued', date: '2024-02-18' },
    { id: 'inv_004', invoice_no: '', customer: '杭州鼎盛餐饮管理', amount: 1500, tax_item: '工商代办服务费', status: 'pending', date: '' },
    { id: 'inv_005', invoice_no: '', customer: '浙江绿源环保科技', amount: 7200, tax_item: '代理记账服务费', status: 'pending', date: '' }
];
