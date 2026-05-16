// 合同管理模块 - 浙杭企服（代理记账业务系统）
// 功能：合同模板、全生命周期管控、到期提醒、合规审计、电子签名

const Contracts = {
    currentTab: 'list',

    init() { this.checkExpiry(); this.render(); this.bindEvents(); },
    destroy() {},

    loadData() { const d = localStorage.getItem('biz_contracts'); if (!d) { localStorage.setItem('biz_contracts', JSON.stringify(defaultContracts)); return [...defaultContracts]; } return JSON.parse(d); },
    saveData(data) { localStorage.setItem('biz_contracts', JSON.stringify(data)); },

    // ===== 到期检查 =====
    checkExpiry() {
        const contracts = this.loadData();
        const now = Date.now();
        let warnCount = 0;
        contracts.forEach(c => {
            if (c.status !== 'active') return;
            const end = new Date(c.end_date).getTime();
            const daysLeft = Math.floor((end - now) / 86400000);
            c.days_left = daysLeft;
            if (daysLeft <= 7) { c.expiry_level = 'urgent'; warnCount++; }
            else if (daysLeft <= 30) { c.expiry_level = 'warning'; warnCount++; }
            else if (daysLeft <= 90) c.expiry_level = 'notice';
            else c.expiry_level = 'normal';
        });
        this.saveData(contracts);
        if (warnCount > 0) setTimeout(() => showToast(`${warnCount}份合同即将到期，请及时续签`, 'warning'), 500);
    },

    render() {
        const contentArea = document.querySelector('.content-area');
        contentArea.innerHTML = `
            <div class="biz-module">
                <div class="biz-module-header"><h2><i class="fa-solid fa-file-contract"></i> 合同管理</h2>
                    <div class="biz-header-actions"><button class="btn-primary" id="btn-new-contract"><i class="fa-solid fa-plus"></i> 新建合同</button></div>
                </div>
                <div class="biz-tabs">
                    <button class="biz-tab active" data-tab="list"><i class="fa-solid fa-list"></i> 合同列表</button>
                    <button class="biz-tab" data-tab="expiry"><i class="fa-solid fa-bell"></i> 到期提醒</button>
                    <button class="biz-tab" data-tab="templates"><i class="fa-solid fa-file-lines"></i> 合同模板</button>
                    <button class="biz-tab" data-tab="audit"><i class="fa-solid fa-shield-check"></i> 合规审计</button>
                </div>
                <div class="biz-tab-content" id="contracts-tab-content"></div>
            </div>
            <div id="contracts-modals"></div>
        `;
        this.renderTab();
    },

    renderTab() {
        const container = document.getElementById('contracts-tab-content');
        switch (this.currentTab) {
            case 'list': container.innerHTML = this.renderList(); break;
            case 'expiry': container.innerHTML = this.renderExpiry(); break;
            case 'templates': container.innerHTML = this.renderTemplates(); break;
            case 'audit': container.innerHTML = this.renderAudit(); break;
        }
    },

    renderList() {
        const contracts = this.loadData();
        const statusMap = { draft: '草稿', pending_sign: '待签署', active: '生效中', expired: '已到期', terminated: '已终止' };
        const typeMap = { bookkeeping: '代理记账', address: '挂靠地址', business: '工商代办' };
        const stats = { total: contracts.length, active: contracts.filter(c => c.status === 'active').length, expiring: contracts.filter(c => c.days_left <= 30 && c.status === 'active').length, totalAmount: contracts.reduce((s, c) => s + (c.amount || 0), 0) };

        return `
            <div class="biz-stats-row">
                <div class="biz-stat-card"><span class="stat-val">${stats.total}</span><span class="stat-lbl">合同总数</span></div>
                <div class="biz-stat-card"><span class="stat-val c-green">${stats.active}</span><span class="stat-lbl">生效中</span></div>
                <div class="biz-stat-card"><span class="stat-val c-orange">${stats.expiring}</span><span class="stat-lbl">即将到期</span></div>
                <div class="biz-stat-card"><span class="stat-val c-blue">¥${(stats.totalAmount / 10000).toFixed(1)}万</span><span class="stat-lbl">合同总额</span></div>
            </div>
            <div class="biz-table-wrap"><table class="biz-table"><thead><tr><th>合同编号</th><th>客户</th><th>类型</th><th>金额</th><th>有效期</th><th>状态</th><th>剩余天数</th><th>操作</th></tr></thead><tbody>
                ${contracts.map(c => `<tr>
                    <td><strong>${escapeHtml(c.contract_no)}</strong></td>
                    <td>${escapeHtml(c.customer_name)}</td>
                    <td><span class="type-badge type-${c.service_type}">${typeMap[c.service_type] || c.service_type}</span></td>
                    <td class="td-money">¥${(c.amount || 0).toLocaleString()}</td>
                    <td class="td-time">${c.start_date} ~ ${c.end_date}</td>
                    <td><span class="status-tag st-${c.status === 'active' ? 'ok' : c.status === 'expired' ? 'danger' : 'info'}">${statusMap[c.status]}</span></td>
                    <td>${c.status === 'active' ? (c.days_left <= 30 ? `<span class="c-red">${c.days_left}天</span>` : `${c.days_left || '-'}天`) : '-'}</td>
                    <td><button class="btn-mini btn-view" data-action="view-contract" data-id="${c.id}">详情</button></td>
                </tr>`).join('')}
            </tbody></table></div>
        `;
    },

    renderExpiry() {
        const contracts = this.loadData().filter(c => c.status === 'active' && c.days_left <= 90).sort((a, b) => (a.days_left || 999) - (b.days_left || 999));
        return `
            <div class="expiry-section">
                <h4><i class="fa-solid fa-clock"></i> 合同到期预警</h4>
                <p class="hint-text">系统自动在到期前 90天/30天/7天 发送分级提醒至客户经理、法务、财务</p>
                <div class="expiry-list">${contracts.length === 0 ? '<div class="empty-state">暂无即将到期合同</div>' : contracts.map(c => `
                    <div class="expiry-card expiry-${c.expiry_level}">
                        <div class="expiry-card-left">
                            <span class="expiry-icon"><i class="fa-solid ${c.expiry_level === 'urgent' ? 'fa-exclamation-triangle' : 'fa-clock'}"></i></span>
                            <div><strong>${escapeHtml(c.customer_name)}</strong><br><span class="text-muted">${c.contract_no} · ${c.service_type === 'bookkeeping' ? '代理记账' : c.service_type === 'address' ? '挂靠地址' : '工商代办'}</span></div>
                        </div>
                        <div class="expiry-card-right">
                            <span class="expiry-days">${c.days_left}天后到期</span>
                            <span class="expiry-date">${c.end_date}</span>
                        </div>
                    </div>
                `).join('')}</div>
                <div class="expiry-actions"><p><i class="fa-solid fa-paper-plane"></i> 自动续签提醒已开启（企业微信/短信/邮件） <span class="backend-badge">需后端支持</span></p></div>
            </div>
        `;
    },

    renderTemplates() {
        const templates = [
            { name: '代理记账服务合同(标准版)', type: 'bookkeeping', clauses: ['服务范围(含具体税种)', '计费规则(按账套量)', '数据保密条款', '服务质量标准', '违约责任'] },
            { name: '代理记账服务合同(增值版)', type: 'bookkeeping', clauses: ['基础服务范围', '附加服务(税筹/审计)', '分期付款条款', '服务升级机制', '数据保密条款'] },
            { name: '挂靠地址租赁协议', type: 'address', clauses: ['地址使用范围', '使用期限及续约', '费用及支付方式', '退出机制', '违约责任'] },
            { name: '工商代办服务协议', type: 'business', clauses: ['服务内容及时限', '材料交接清单', '费用结算方式', '加急条款', '免责声明'] }
        ];
        return `
            <div class="templates-section">
                <h4><i class="fa-solid fa-file-lines"></i> 合同模板库</h4>
                <div class="template-cards">${templates.map(t => `
                    <div class="template-card">
                        <div class="template-header"><strong>${escapeHtml(t.name)}</strong><span class="type-badge type-${t.type}">${t.type}</span></div>
                        <div class="template-body"><p class="text-muted">核心条款：</p><ul>${t.clauses.map(c => `<li>${escapeHtml(c)}</li>`).join('')}</ul></div>
                        <div class="template-footer"><span class="hint-text">符合《个人信息保护法》</span></div>
                    </div>
                `).join('')}</div>
                <p class="hint-text" style="margin-top:14px;"><i class="fa-solid fa-signature"></i> 电子签名集成（e签宝/法大大） <span class="backend-badge">需后端支持</span></p>
            </div>
        `;
    },

    renderAudit() {
        const contracts = this.loadData();
        const logs = [];
        contracts.forEach(c => {
            if (c.audit_log) c.audit_log.forEach(l => logs.push({ ...l, contract_no: c.contract_no, customer: c.customer_name }));
        });
        logs.sort((a, b) => new Date(b.timestamp || 0) - new Date(a.timestamp || 0));
        return `
            <div class="audit-section">
                <h4><i class="fa-solid fa-shield-check"></i> 合规审计日志</h4>
                <p class="hint-text">所有合同变更需走审批流，并记录变更版本含差异对比</p>
                <div class="biz-table-wrap"><table class="biz-table"><thead><tr><th>时间</th><th>合同</th><th>客户</th><th>操作</th><th>操作人</th></tr></thead><tbody>
                    ${logs.slice(0, 30).map(l => `<tr><td class="td-time">${l.timestamp ? new Date(l.timestamp).toLocaleString('zh-CN') : '-'}</td><td>${escapeHtml(l.contract_no || '')}</td><td>${escapeHtml(l.customer || '')}</td><td>${escapeHtml(l.action || '')}</td><td>${escapeHtml(l.operator || '')}</td></tr>`).join('')}
                    ${logs.length === 0 ? '<tr><td colspan="5" class="empty-state">暂无审计记录</td></tr>' : ''}
                </tbody></table></div>
                <p class="hint-text" style="margin-top:12px;"><i class="fa-solid fa-lock"></i> 数据脱敏：客户身份证号仅保留后4位，操作需二次认证 <span class="backend-badge">需后端支持</span></p>
            </div>
        `;
    },

    // ===== 新建合同 =====
    showNewContractModal() {
        document.getElementById('contracts-modals').innerHTML = `
            <div class="modal active" id="new-contract-modal"><div class="modal-content" style="max-width:600px;">
                <div class="modal-header"><h3>新建合同</h3><button class="modal-close" id="close-contract-modal">&times;</button></div>
                <form id="new-contract-form" class="modal-body-form">
                    <div class="form-row"><div class="form-group"><label>客户名称 *</label><input type="text" name="customer_name" required></div><div class="form-group"><label>服务类型 *</label><select name="service_type" required><option value="bookkeeping">代理记账</option><option value="address">挂靠地址</option><option value="business">工商代办</option></select></div></div>
                    <div class="form-row"><div class="form-group"><label>合同金额(元)</label><input type="number" name="amount" min="0" step="0.01"></div><div class="form-group"><label>关联订单号</label><input type="text" name="order_no" placeholder="如ZH20240001"></div></div>
                    <div class="form-row"><div class="form-group"><label>开始日期 *</label><input type="date" name="start_date" required></div><div class="form-group"><label>结束日期 *</label><input type="date" name="end_date" required></div></div>
                    <div class="form-group"><label>合同条款摘要</label><textarea name="terms" rows="3" placeholder="服务范围、计费规则等关键条款"></textarea></div>
                    <div class="form-actions"><button type="button" class="btn-secondary" id="cancel-contract-modal">取消</button><button type="submit" class="btn-primary">创建合同</button></div>
                </form>
            </div></div>
        `;
        document.getElementById('close-contract-modal').addEventListener('click', () => document.getElementById('new-contract-modal').remove());
        document.getElementById('cancel-contract-modal').addEventListener('click', () => document.getElementById('new-contract-modal').remove());
        document.getElementById('new-contract-form').addEventListener('submit', (e) => {
            e.preventDefault();
            const fd = new FormData(e.target);
            const data = Object.fromEntries(fd);
            const contracts = this.loadData();
            contracts.unshift({
                id: 'ctr_' + Date.now().toString(36),
                contract_no: 'HT' + new Date().getFullYear() + String(contracts.length + 1).padStart(4, '0'),
                customer_name: data.customer_name,
                service_type: data.service_type,
                amount: parseFloat(data.amount) || 0,
                order_no: data.order_no || '',
                start_date: data.start_date,
                end_date: data.end_date,
                terms: data.terms || '',
                status: 'active',
                days_left: Math.floor((new Date(data.end_date).getTime() - Date.now()) / 86400000),
                expiry_level: 'normal',
                audit_log: [{ action: '创建合同', operator: 'admin', timestamp: new Date().toISOString() }],
                created_at: new Date().toISOString()
            });
            this.saveData(contracts);
            document.getElementById('new-contract-modal').remove();
            this.renderTab();
            showToast('合同创建成功', 'success');
        });
    },

    bindEvents() {
        const module = document.querySelector('.biz-module');
        if (!module) return;
        module.addEventListener('click', (e) => {
            const tab = e.target.closest('.biz-tab');
            if (tab) { this.currentTab = tab.dataset.tab; module.querySelectorAll('.biz-tab').forEach(t => t.classList.remove('active')); tab.classList.add('active'); this.renderTab(); }
        });
        document.getElementById('btn-new-contract').addEventListener('click', () => this.showNewContractModal());
    }
};

// ===== 默认合同数据 =====
const defaultContracts = [
    { id: 'ctr_001', contract_no: 'HT20240001', customer_name: '杭州未来科技有限公司', service_type: 'bookkeeping', amount: 6000, order_no: 'ZH20240001', start_date: '2024-01-15', end_date: '2025-01-14', terms: '年度代理记账服务，含月度做账及纳税申报', status: 'active', days_left: 280, expiry_level: 'normal', audit_log: [{ action: '创建合同', operator: 'admin', timestamp: '2024-01-15T08:00:00Z' }, { action: '双方签署', operator: 'admin', timestamp: '2024-01-16T10:00:00Z' }], created_at: '2024-01-15T08:00:00Z' },
    { id: 'ctr_002', contract_no: 'HT20240002', customer_name: '浙江盛达贸易有限公司', service_type: 'bookkeeping', amount: 9600, order_no: 'ZH20240002', start_date: '2024-01-10', end_date: '2025-01-09', terms: '年度代理记账+出口退税服务', status: 'active', days_left: 275, expiry_level: 'normal', audit_log: [{ action: '创建合同', operator: 'admin', timestamp: '2024-01-10T08:00:00Z' }], created_at: '2024-01-10T08:00:00Z' },
    { id: 'ctr_003', contract_no: 'HT20240003', customer_name: '浙江恒通建设工程', service_type: 'address', amount: 3000, order_no: 'ZH20240004', start_date: '2024-02-01', end_date: '2025-01-31', terms: '虚拟地址挂靠一年', status: 'active', days_left: 300, expiry_level: 'normal', audit_log: [{ action: '创建合同', operator: 'admin', timestamp: '2024-02-01T08:00:00Z' }], created_at: '2024-02-01T08:00:00Z' },
    { id: 'ctr_004', contract_no: 'HT20240004', customer_name: '杭州鼎盛餐饮管理', service_type: 'business', amount: 1500, order_no: 'ZH20240005', start_date: '2024-02-25', end_date: '2024-04-25', terms: '公司注册代办服务', status: 'active', days_left: 25, expiry_level: 'warning', audit_log: [{ action: '创建合同', operator: 'admin', timestamp: '2024-02-25T08:00:00Z' }], created_at: '2024-02-25T08:00:00Z' },
    { id: 'ctr_005', contract_no: 'HT20230015', customer_name: '杭州蓝天物流有限公司', service_type: 'bookkeeping', amount: 3600, order_no: '', start_date: '2023-06-01', end_date: '2024-05-31', terms: '年度代理记账服务', status: 'expired', days_left: -30, expiry_level: 'urgent', audit_log: [{ action: '合同到期', operator: 'system', timestamp: '2024-05-31T00:00:00Z' }], created_at: '2023-06-01T08:00:00Z' }
];
