// 公司日记账模块 - 飞书多维表格风格

const FinanceJournal = {
    storageKey: 'zhqf_finance_journal',
    entries: [],
    currentView: 'table',
    sortField: 'date',
    sortOrder: 'desc',
    filters: {},
    selectedRows: new Set(),

    // 字段定义（多维表格的列）
    fields: [
        { key: 'date', label: '日期', type: 'date', width: 110 },
        { key: 'type', label: '类型', type: 'select', width: 80, options: ['收入', '支出', '转账'] },
        { key: 'category', label: '科目', type: 'select', width: 120, options: ['服务收入', '咨询费', '工资', '房租', '办公用品', '交通费', '招待费', '税费', '社保', '广告费', '设备采购', '其他'] },
        { key: 'amount', label: '金额(元)', type: 'number', width: 120 },
        { key: 'counterparty', label: '往来单位/人', type: 'text', width: 150 },
        { key: 'account', label: '账户', type: 'select', width: 100, options: ['基本户', '一般户', '现金', '支付宝', '微信'] },
        { key: 'handler', label: '经办人', type: 'text', width: 80 },
        { key: 'remark', label: '备注', type: 'text', width: 180 },
        { key: 'status', label: '审核状态', type: 'select', width: 90, options: ['待审核', '已审核', '已驳回'] }
    ],

    // 权限配置
    permissions: {
        'admin': { canView: true, canEdit: true, canDelete: true, canApprove: true, viewAll: true },
        'finance': { canView: true, canEdit: true, canDelete: false, canApprove: true, viewAll: true },
        'manager': { canView: true, canEdit: false, canDelete: false, canApprove: false, viewAll: true },
        'staff': { canView: true, canEdit: false, canDelete: false, canApprove: false, viewAll: false }
    },

    currentRole: 'admin',

    init() {
        this.loadData();
        const contentArea = document.querySelector('.content-area');
        contentArea.innerHTML = this.render();
        this.bindEvents();
    },

    destroy() {},

    loadData() {
        const saved = localStorage.getItem(this.storageKey);
        if (saved) {
            this.entries = JSON.parse(saved);
        } else {
            this.seedMockData();
        }
    },

    saveData() {
        localStorage.setItem(this.storageKey, JSON.stringify(this.entries));
    },

    seedMockData() {
        const now = new Date();
        const entries = [];
        const categories = {
            '收入': ['服务收入', '咨询费'],
            '支出': ['工资', '房租', '办公用品', '交通费', '招待费', '税费', '社保', '广告费', '设备采购'],
            '转账': ['其他']
        };
        const counterparties = ['杭州锐创科技', '浙江星辰有限公司', '新华贸易集团', '鑫源投资公司', '万达物业', '中国电信', '阿里云', '顺丰速运', '内部转账', '杭州恒信企业', '金茂建设', '长江科技'];
        const handlers = ['李娜', '杨梅', '孙丽', '马晓'];
        const accounts = ['基本户', '一般户', '现金', '支付宝', '微信'];

        for (let i = 0; i < 50; i++) {
            const daysAgo = Math.floor(Math.random() * 60);
            const d = new Date(now.getTime() - daysAgo * 86400000);
            const type = ['收入', '支出', '支出', '支出', '收入', '转账'][Math.floor(Math.random() * 6)];
            const cats = categories[type];
            const category = cats[Math.floor(Math.random() * cats.length)];
            let amount;
            if (type === '收入') amount = (Math.random() * 50000 + 5000).toFixed(2);
            else if (category === '工资') amount = (Math.random() * 8000 + 5000).toFixed(2);
            else if (category === '房租') amount = 28000;
            else amount = (Math.random() * 5000 + 100).toFixed(2);

            entries.push({
                id: i + 1,
                date: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`,
                type: type,
                category: category,
                amount: parseFloat(amount),
                counterparty: counterparties[Math.floor(Math.random() * counterparties.length)],
                account: accounts[Math.floor(Math.random() * accounts.length)],
                handler: handlers[Math.floor(Math.random() * handlers.length)],
                remark: this.generateRemark(type, category),
                status: ['待审核', '已审核', '已审核', '已审核', '已驳回'][Math.floor(Math.random() * 5)]
            });
        }

        this.entries = entries.sort((a, b) => b.date.localeCompare(a.date));
        this.saveData();
    },

    generateRemark(type, category) {
        const remarks = {
            '服务收入': ['代理记账服务费', '工商注册代理费', '税务筹划咨询费', '年度审计服务费'],
            '咨询费': ['企业管理咨询', '财税顾问服务', '法律顾问费'],
            '工资': ['12月工资发放', '绩效奖金', '加班补贴'],
            '房租': ['办公室租金', '仓库租金'],
            '办公用品': ['打印纸/墨盒', '办公桌椅', '电脑耗材'],
            '交通费': ['出差交通', '快递费用', '油费报销'],
            '招待费': ['客户接待', '商务宴请', '送礼费用'],
            '税费': ['增值税', '企业所得税', '印花税'],
            '社保': ['员工社保', '公积金缴纳'],
            '广告费': ['百度推广', '抖音广告', '公众号推广'],
            '设备采购': ['电脑采购', '打印机', '服务器'],
            '其他': ['内部资金调拨', '备用金补充']
        };
        const list = remarks[category] || ['日常业务'];
        return list[Math.floor(Math.random() * list.length)];
    },

    render() {
        const perm = this.permissions[this.currentRole];
        const totalIncome = this.entries.filter(e => e.type === '收入').reduce((s, e) => s + e.amount, 0);
        const totalExpense = this.entries.filter(e => e.type === '支出').reduce((s, e) => s + e.amount, 0);
        const balance = totalIncome - totalExpense;

        return `
        <div class="fj-page">
            <div class="fj-header">
                <div class="fj-header-left">
                    <h2>公司日记账</h2>
                    <div class="fj-view-switcher">
                        <button class="fj-view-btn active" data-view="table" title="表格视图">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2"/><line x1="3" y1="9" x2="21" y2="9"/><line x1="3" y1="15" x2="21" y2="15"/><line x1="9" y1="3" x2="9" y2="21"/></svg>
                        </button>
                        <button class="fj-view-btn" data-view="summary" title="汇总视图">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>
                        </button>
                    </div>
                </div>
                <div class="fj-header-right">
                    <div class="fj-role-badge" title="当前权限角色">
                        <span>权限: ${this.currentRole === 'admin' ? '管理员' : this.currentRole}</span>
                    </div>
                    ${perm.canEdit ? '<button class="btn-primary btn-small" id="btn-add-entry">+ 新增记录</button>' : ''}
                </div>
            </div>

            <div class="fj-summary-bar">
                <div class="fj-summary-item income">
                    <span class="fj-summary-label">收入合计</span>
                    <span class="fj-summary-value">¥${this.formatNumber(totalIncome)}</span>
                </div>
                <div class="fj-summary-item expense">
                    <span class="fj-summary-label">支出合计</span>
                    <span class="fj-summary-value">¥${this.formatNumber(totalExpense)}</span>
                </div>
                <div class="fj-summary-item balance">
                    <span class="fj-summary-label">结余</span>
                    <span class="fj-summary-value ${balance >= 0 ? 'positive' : 'negative'}">¥${this.formatNumber(balance)}</span>
                </div>
                <div class="fj-summary-item count">
                    <span class="fj-summary-label">记录数</span>
                    <span class="fj-summary-value">${this.entries.length}</span>
                </div>
            </div>

            <div class="fj-filter-bar">
                <input type="text" class="fj-search" placeholder="搜索往来单位、备注..." id="fj-search">
                <select class="fj-filter-select" id="fj-type-filter">
                    <option value="">全部类型</option>
                    <option value="收入">收入</option>
                    <option value="支出">支出</option>
                    <option value="转账">转账</option>
                </select>
                <select class="fj-filter-select" id="fj-status-filter">
                    <option value="">全部状态</option>
                    <option value="待审核">待审核</option>
                    <option value="已审核">已审核</option>
                    <option value="已驳回">已驳回</option>
                </select>
                <select class="fj-filter-select" id="fj-account-filter">
                    <option value="">全部账户</option>
                    ${['基本户', '一般户', '现金', '支付宝', '微信'].map(a => `<option value="${a}">${a}</option>`).join('')}
                </select>
            </div>

            <div class="fj-content" id="fj-content">
                ${this.renderTable()}
            </div>
        </div>`;
    },

    renderTable() {
        let data = this.getFilteredData();

        // 排序
        data.sort((a, b) => {
            let va = a[this.sortField], vb = b[this.sortField];
            if (this.sortField === 'amount') { va = parseFloat(va); vb = parseFloat(vb); }
            if (va < vb) return this.sortOrder === 'asc' ? -1 : 1;
            if (va > vb) return this.sortOrder === 'asc' ? 1 : -1;
            return 0;
        });

        return `
        <div class="fj-table-wrapper">
            <table class="fj-table">
                <thead>
                    <tr>
                        <th class="fj-th-checkbox"><input type="checkbox" id="fj-select-all"></th>
                        ${this.fields.map(f => `
                        <th class="fj-th-sortable" data-field="${f.key}" style="width:${f.width}px;">
                            ${f.label}
                            <span class="fj-sort-icon">${this.sortField === f.key ? (this.sortOrder === 'asc' ? '↑' : '↓') : ''}</span>
                        </th>
                        `).join('')}
                        <th style="width:80px;">操作</th>
                    </tr>
                </thead>
                <tbody>
                    ${data.map(entry => `
                    <tr class="fj-row" data-id="${entry.id}">
                        <td><input type="checkbox" class="fj-row-check" value="${entry.id}"></td>
                        <td>${entry.date}</td>
                        <td><span class="fj-type-badge fj-type-${entry.type === '收入' ? 'income' : entry.type === '支出' ? 'expense' : 'transfer'}">${entry.type}</span></td>
                        <td>${entry.category}</td>
                        <td class="fj-amount ${entry.type === '收入' ? 'income' : 'expense'}">${entry.type === '收入' ? '+' : '-'}${this.formatNumber(entry.amount)}</td>
                        <td>${entry.counterparty}</td>
                        <td>${entry.account}</td>
                        <td>${entry.handler}</td>
                        <td class="fj-remark" title="${entry.remark}">${entry.remark}</td>
                        <td><span class="fj-status fj-status-${entry.status === '已审核' ? 'approved' : entry.status === '已驳回' ? 'rejected' : 'pending'}">${entry.status}</span></td>
                        <td class="fj-actions">
                            ${this.permissions[this.currentRole].canApprove && entry.status === '待审核' ? `<button class="fj-btn-approve" data-id="${entry.id}" title="审核">✓</button>` : ''}
                            ${this.permissions[this.currentRole].canDelete ? `<button class="fj-btn-delete" data-id="${entry.id}" title="删除">×</button>` : ''}
                        </td>
                    </tr>
                    `).join('')}
                </tbody>
            </table>
        </div>
        ${data.length === 0 ? '<div class="empty-state"><p>暂无匹配记录</p></div>' : ''}`;
    },

    renderSummary() {
        const data = this.getFilteredData();
        // 按科目汇总
        const byCategory = {};
        data.forEach(e => {
            if (!byCategory[e.category]) byCategory[e.category] = { income: 0, expense: 0, count: 0 };
            if (e.type === '收入') byCategory[e.category].income += e.amount;
            else byCategory[e.category].expense += e.amount;
            byCategory[e.category].count++;
        });

        // 按账户汇总
        const byAccount = {};
        data.forEach(e => {
            if (!byAccount[e.account]) byAccount[e.account] = { income: 0, expense: 0 };
            if (e.type === '收入') byAccount[e.account].income += e.amount;
            else byAccount[e.account].expense += e.amount;
        });

        return `
        <div class="fj-summary-grid">
            <div class="fj-summary-card">
                <h4>按科目汇总</h4>
                <table class="fj-summary-table">
                    <thead><tr><th>科目</th><th>收入</th><th>支出</th><th>笔数</th></tr></thead>
                    <tbody>
                        ${Object.entries(byCategory).sort((a, b) => (b[1].income + b[1].expense) - (a[1].income + a[1].expense)).map(([cat, val]) => `
                        <tr>
                            <td>${cat}</td>
                            <td class="fj-amount income">${val.income > 0 ? '+' + this.formatNumber(val.income) : '-'}</td>
                            <td class="fj-amount expense">${val.expense > 0 ? '-' + this.formatNumber(val.expense) : '-'}</td>
                            <td>${val.count}</td>
                        </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
            <div class="fj-summary-card">
                <h4>按账户汇总</h4>
                <table class="fj-summary-table">
                    <thead><tr><th>账户</th><th>收入</th><th>支出</th><th>结余</th></tr></thead>
                    <tbody>
                        ${Object.entries(byAccount).map(([acc, val]) => `
                        <tr>
                            <td>${acc}</td>
                            <td class="fj-amount income">${this.formatNumber(val.income)}</td>
                            <td class="fj-amount expense">${this.formatNumber(val.expense)}</td>
                            <td class="fj-amount ${val.income - val.expense >= 0 ? 'income' : 'expense'}">${this.formatNumber(val.income - val.expense)}</td>
                        </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        </div>`;
    },

    getFilteredData() {
        const search = document.getElementById('fj-search');
        const typeFilter = document.getElementById('fj-type-filter');
        const statusFilter = document.getElementById('fj-status-filter');
        const accountFilter = document.getElementById('fj-account-filter');

        let data = [...this.entries];
        const keyword = search ? search.value.toLowerCase() : '';
        const type = typeFilter ? typeFilter.value : '';
        const status = statusFilter ? statusFilter.value : '';
        const account = accountFilter ? accountFilter.value : '';

        if (keyword) data = data.filter(e => e.counterparty.toLowerCase().includes(keyword) || e.remark.toLowerCase().includes(keyword) || e.category.includes(keyword));
        if (type) data = data.filter(e => e.type === type);
        if (status) data = data.filter(e => e.status === status);
        if (account) data = data.filter(e => e.account === account);

        return data;
    },

    formatNumber(num) {
        return parseFloat(num).toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    },

    bindEvents() {
        // 视图切换
        document.querySelectorAll('.fj-view-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                document.querySelectorAll('.fj-view-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                this.currentView = btn.dataset.view;
                const content = document.getElementById('fj-content');
                content.innerHTML = this.currentView === 'table' ? this.renderTable() : this.renderSummary();
                this.bindTableEvents();
            });
        });

        // 筛选
        ['fj-search', 'fj-type-filter', 'fj-status-filter', 'fj-account-filter'].forEach(id => {
            const el = document.getElementById(id);
            if (el) el.addEventListener(id === 'fj-search' ? 'input' : 'change', () => {
                const content = document.getElementById('fj-content');
                content.innerHTML = this.currentView === 'table' ? this.renderTable() : this.renderSummary();
                this.bindTableEvents();
            });
        });

        // 新增按钮
        const btnAdd = document.getElementById('btn-add-entry');
        if (btnAdd) btnAdd.addEventListener('click', () => this.showAddForm());

        this.bindTableEvents();
    },

    bindTableEvents() {
        // 排序
        document.querySelectorAll('.fj-th-sortable').forEach(th => {
            th.addEventListener('click', () => {
                const field = th.dataset.field;
                if (this.sortField === field) {
                    this.sortOrder = this.sortOrder === 'asc' ? 'desc' : 'asc';
                } else {
                    this.sortField = field;
                    this.sortOrder = 'desc';
                }
                const content = document.getElementById('fj-content');
                content.innerHTML = this.renderTable();
                this.bindTableEvents();
            });
        });

        // 全选
        const selectAll = document.getElementById('fj-select-all');
        if (selectAll) {
            selectAll.addEventListener('change', (e) => {
                document.querySelectorAll('.fj-row-check').forEach(cb => {
                    cb.checked = e.target.checked;
                });
            });
        }

        // 审核
        document.querySelectorAll('.fj-btn-approve').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const id = parseInt(btn.dataset.id);
                const entry = this.entries.find(e => e.id === id);
                if (entry) {
                    entry.status = '已审核';
                    this.saveData();
                    this.refreshView();
                }
            });
        });

        // 删除
        document.querySelectorAll('.fj-btn-delete').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const id = parseInt(btn.dataset.id);
                if (confirm('确定删除这条记录？')) {
                    this.entries = this.entries.filter(e => e.id !== id);
                    this.saveData();
                    this.refreshView();
                }
            });
        });
    },

    refreshView() {
        const content = document.getElementById('fj-content');
        if (content) {
            content.innerHTML = this.currentView === 'table' ? this.renderTable() : this.renderSummary();
            this.bindTableEvents();
        }
    },

    showAddForm() {
        const modal = document.createElement('div');
        modal.className = 'modal active';
        modal.innerHTML = `
            <div class="modal-content" style="max-width: 560px;">
                <div class="modal-header">
                    <h3>新增日记账</h3>
                    <button class="modal-close">&times;</button>
                </div>
                <form id="fj-add-form">
                    <div class="form-row">
                        <div class="form-group">
                            <label>日期</label>
                            <input type="date" name="date" value="${new Date().toISOString().split('T')[0]}" required>
                        </div>
                        <div class="form-group">
                            <label>类型</label>
                            <select name="type" required>
                                <option value="收入">收入</option>
                                <option value="支出" selected>支出</option>
                                <option value="转账">转账</option>
                            </select>
                        </div>
                    </div>
                    <div class="form-row">
                        <div class="form-group">
                            <label>科目</label>
                            <select name="category" required>
                                ${this.fields.find(f => f.key === 'category').options.map(o => `<option value="${o}">${o}</option>`).join('')}
                            </select>
                        </div>
                        <div class="form-group">
                            <label>金额(元)</label>
                            <input type="number" name="amount" step="0.01" min="0" required>
                        </div>
                    </div>
                    <div class="form-row">
                        <div class="form-group">
                            <label>往来单位/人</label>
                            <input type="text" name="counterparty" required>
                        </div>
                        <div class="form-group">
                            <label>账户</label>
                            <select name="account" required>
                                ${this.fields.find(f => f.key === 'account').options.map(o => `<option value="${o}">${o}</option>`).join('')}
                            </select>
                        </div>
                    </div>
                    <div class="form-row">
                        <div class="form-group">
                            <label>经办人</label>
                            <input type="text" name="handler" required>
                        </div>
                        <div class="form-group">
                            <label>审核状态</label>
                            <select name="status">
                                <option value="待审核">待审核</option>
                                <option value="已审核">已审核</option>
                            </select>
                        </div>
                    </div>
                    <div class="form-group">
                        <label>备注</label>
                        <textarea name="remark" rows="2"></textarea>
                    </div>
                    <div class="form-actions">
                        <button type="button" class="btn-secondary modal-cancel">取消</button>
                        <button type="submit" class="btn-primary">保存</button>
                    </div>
                </form>
            </div>
        `;

        document.body.appendChild(modal);
        modal.querySelector('.modal-close').addEventListener('click', () => modal.remove());
        modal.querySelector('.modal-cancel').addEventListener('click', () => modal.remove());
        modal.addEventListener('click', (e) => { if (e.target === modal) modal.remove(); });

        modal.querySelector('#fj-add-form').addEventListener('submit', (e) => {
            e.preventDefault();
            const form = e.target;
            const newEntry = {
                id: Date.now(),
                date: form.date.value,
                type: form.type.value,
                category: form.category.value,
                amount: parseFloat(form.amount.value),
                counterparty: form.counterparty.value,
                account: form.account.value,
                handler: form.handler.value,
                remark: form.remark.value || '',
                status: form.status.value
            };
            this.entries.unshift(newEntry);
            this.saveData();
            modal.remove();
            this.init();
        });
    }
};
