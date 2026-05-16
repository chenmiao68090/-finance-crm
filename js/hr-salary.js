// 薪酬管理模块 - 完整CRUD + localStorage持久化

const HrSalary = {
    PAYROLL_KEY: 'hr_payroll',
    STRUCTURE_KEY: 'hr_salary_structure',
    ADJUST_KEY: 'hr_salary_adjustments',
    payroll: [],
    structure: [],
    adjustments: [],
    currentTab: 'payroll',
    currentMonth: '2025-05',

    defaultStructure: [
        { level: 'L3', title: '初级', baseSalaryMin: 4000, baseSalaryMax: 5000, positionMin: 200, positionMax: 500 },
        { level: 'L4', title: '中级', baseSalaryMin: 5000, baseSalaryMax: 7000, positionMin: 500, positionMax: 1000 },
        { level: 'L5', title: '高级', baseSalaryMin: 7000, baseSalaryMax: 9000, positionMin: 800, positionMax: 1500 },
        { level: 'L6', title: '资深', baseSalaryMin: 9000, baseSalaryMax: 12000, positionMin: 1000, positionMax: 2000 },
        { level: 'L7', title: '经理', baseSalaryMin: 12000, baseSalaryMax: 16000, positionMin: 1500, positionMax: 2500 },
        { level: 'L8', title: '总监', baseSalaryMin: 16000, baseSalaryMax: 22000, positionMin: 2000, positionMax: 3500 },
        { level: 'L10', title: '总经理', baseSalaryMin: 30000, baseSalaryMax: 50000, positionMin: 3000, positionMax: 5000 },
    ],

    defaultPayroll: [
        { id: 'PAY001', empId: 'EMP002', name: '张伟', dept: '顾问部', position: '部门经理', level: 'L7', month: '2025-05', baseSalary: 14000, positionAllowance: 2000, performanceBonus: 3500, overtime: 0, mealAllowance: 500, transportAllowance: 300, socialInsurance: 1680, housingFund: 1400, tax: 580, otherDeduct: 0 },
        { id: 'PAY002', empId: 'EMP003', name: '周芳', dept: '顾问部', position: '组长', level: 'L5', month: '2025-05', baseSalary: 8000, positionAllowance: 1000, performanceBonus: 2000, overtime: 300, mealAllowance: 500, transportAllowance: 200, socialInsurance: 960, housingFund: 800, tax: 210, otherDeduct: 0 },
        { id: 'PAY003', empId: 'EMP004', name: '李娜', dept: '会计部', position: '部门经理', level: 'L7', month: '2025-05', baseSalary: 13000, positionAllowance: 2000, performanceBonus: 3000, overtime: 0, mealAllowance: 500, transportAllowance: 300, socialInsurance: 1560, housingFund: 1300, tax: 480, otherDeduct: 0 },
        { id: 'PAY004', empId: 'EMP005', name: '孙丽', dept: '会计部', position: '代账组长', level: 'L5', month: '2025-05', baseSalary: 7500, positionAllowance: 800, performanceBonus: 1800, overtime: 200, mealAllowance: 500, transportAllowance: 200, socialInsurance: 900, housingFund: 750, tax: 150, otherDeduct: 0 },
        { id: 'PAY005', empId: 'EMP006', name: '马晓', dept: '会计部', position: '审计组长', level: 'L5', month: '2025-05', baseSalary: 7500, positionAllowance: 800, performanceBonus: 1600, overtime: 0, mealAllowance: 500, transportAllowance: 200, socialInsurance: 900, housingFund: 750, tax: 130, otherDeduct: 0 },
        { id: 'PAY006', empId: 'EMP007', name: '王强', dept: '工商部', position: '部门经理', level: 'L7', month: '2025-05', baseSalary: 12000, positionAllowance: 1500, performanceBonus: 2800, overtime: 0, mealAllowance: 500, transportAllowance: 300, socialInsurance: 1440, housingFund: 1200, tax: 380, otherDeduct: 0 },
        { id: 'PAY007', empId: 'EMP008', name: '赵敏', dept: '刻章部', position: '部门主管', level: 'L6', month: '2025-05', baseSalary: 9000, positionAllowance: 1000, performanceBonus: 1500, overtime: 150, mealAllowance: 500, transportAllowance: 200, socialInsurance: 1080, housingFund: 900, tax: 200, otherDeduct: 0 },
        { id: 'PAY008', empId: 'EMP009', name: '陈浩', dept: '人事行政部', position: '部门经理', level: 'L7', month: '2025-05', baseSalary: 13000, positionAllowance: 1800, performanceBonus: 2500, overtime: 0, mealAllowance: 500, transportAllowance: 300, socialInsurance: 1560, housingFund: 1300, tax: 420, otherDeduct: 0 },
        { id: 'PAY009', empId: 'EMP010', name: '黄婷', dept: '人事行政部', position: '招聘培训专员', level: 'L4', month: '2025-05', baseSalary: 6000, positionAllowance: 500, performanceBonus: 1200, overtime: 200, mealAllowance: 500, transportAllowance: 200, socialInsurance: 720, housingFund: 600, tax: 80, otherDeduct: 0 },
        { id: 'PAY010', empId: 'EMP011', name: '刘洋', dept: '运营部', position: '部门经理', level: 'L7', month: '2025-05', baseSalary: 13000, positionAllowance: 1800, performanceBonus: 3200, overtime: 500, mealAllowance: 500, transportAllowance: 300, socialInsurance: 1560, housingFund: 1300, tax: 520, otherDeduct: 0 },
        { id: 'PAY011', empId: 'EMP012', name: '杨梅', dept: '财务部', position: '财务总监', level: 'L8', month: '2025-05', baseSalary: 18000, positionAllowance: 3000, performanceBonus: 4000, overtime: 0, mealAllowance: 500, transportAllowance: 500, socialInsurance: 2160, housingFund: 1800, tax: 1200, otherDeduct: 0 },
        { id: 'PAY012', empId: 'EMP013', name: '李雪梅', dept: '会计部', position: '会计', level: 'L3', month: '2025-05', baseSalary: 4500, positionAllowance: 300, performanceBonus: 800, overtime: 150, mealAllowance: 500, transportAllowance: 200, socialInsurance: 540, housingFund: 450, tax: 0, otherDeduct: 0 },
        { id: 'PAY013', empId: 'EMP014', name: '谢欣', dept: '运营部', position: '客户运营组长', level: 'L5', month: '2025-05', baseSalary: 8000, positionAllowance: 1000, performanceBonus: 2000, overtime: 300, mealAllowance: 500, transportAllowance: 200, socialInsurance: 960, housingFund: 800, tax: 200, otherDeduct: 0 },
        { id: 'PAY014', empId: 'EMP015', name: '吴刚', dept: '人事行政部', position: '行政后勤专员', level: 'L3', month: '2025-05', baseSalary: 5500, positionAllowance: 400, performanceBonus: 1000, overtime: 100, mealAllowance: 500, transportAllowance: 200, socialInsurance: 660, housingFund: 550, tax: 30, otherDeduct: 0 },
    ],

    defaultAdjustments: [
        { id: 'ADJ001', empId: 'EMP003', name: '周芳', dept: '顾问部', date: '2025-04-01', type: '晋升调薪', oldBase: 7000, newBase: 8000, oldLevel: 'L4', newLevel: 'L5', reason: '晋升为组长', approver: '张伟' },
        { id: 'ADJ002', empId: 'EMP010', name: '黄婷', dept: '人事行政部', date: '2025-03-01', type: '年度调薪', oldBase: 5500, newBase: 6000, oldLevel: 'L4', newLevel: 'L4', reason: '年度绩效优秀', approver: '陈浩' },
        { id: 'ADJ003', empId: 'EMP014', name: '谢欣', dept: '运营部', date: '2025-02-01', type: '晋升调薪', oldBase: 7000, newBase: 8000, oldLevel: 'L4', newLevel: 'L5', reason: '晋升为运营组长', approver: '刘洋' },
    ],

    loadData() {
        const payData = localStorage.getItem(this.PAYROLL_KEY);
        this.payroll = payData ? JSON.parse(payData) : JSON.parse(JSON.stringify(this.defaultPayroll));
        const strData = localStorage.getItem(this.STRUCTURE_KEY);
        this.structure = strData ? JSON.parse(strData) : JSON.parse(JSON.stringify(this.defaultStructure));
        const adjData = localStorage.getItem(this.ADJUST_KEY);
        this.adjustments = adjData ? JSON.parse(adjData) : JSON.parse(JSON.stringify(this.defaultAdjustments));
        if (!payData) this.savePayroll();
        if (!strData) this.saveStructure();
        if (!adjData) this.saveAdjustments();
    },

    savePayroll() { localStorage.setItem(this.PAYROLL_KEY, JSON.stringify(this.payroll)); },
    saveStructure() { localStorage.setItem(this.STRUCTURE_KEY, JSON.stringify(this.structure)); },
    saveAdjustments() { localStorage.setItem(this.ADJUST_KEY, JSON.stringify(this.adjustments)); },

    generateId(prefix) {
        return prefix + Date.now().toString(36) + Math.random().toString(36).substr(2, 4);
    },

    getNetSalary(item) {
        return item.baseSalary + item.positionAllowance + item.performanceBonus + item.overtime
            + (item.mealAllowance || 0) + (item.transportAllowance || 0)
            - item.socialInsurance - item.housingFund - item.tax - item.otherDeduct;
    },

    getGrossSalary(item) {
        return item.baseSalary + item.positionAllowance + item.performanceBonus + item.overtime
            + (item.mealAllowance || 0) + (item.transportAllowance || 0);
    },

    init() {
        this.loadData();
        const contentArea = document.querySelector('.content-area');
        contentArea.innerHTML = this.render();
        this.bindEvents();
    },

    destroy() {},

    render() {
        const monthPayroll = this.payroll.filter(p => p.month === this.currentMonth);
        const totalNet = monthPayroll.reduce((sum, p) => sum + this.getNetSalary(p), 0);
        const avgSalary = monthPayroll.length > 0 ? Math.round(totalNet / monthPayroll.length) : 0;
        const totalCost = monthPayroll.reduce((sum, p) => sum + this.getGrossSalary(p) + p.socialInsurance + p.housingFund, 0);

        return `
        <div class="hr-salary-page">
            <div class="hr-module-header">
                <div class="hr-module-title">
                    <h2>薪酬管理</h2>
                    <p class="hr-module-desc">薪酬架构、工资条、调薪记录、人力成本分析</p>
                </div>
                <div class="hr-header-actions">
                    <button class="btn-hr-primary" id="btn-add-payroll">新增工资条</button>
                    <button class="btn-hr-secondary" id="btn-add-adjustment">调薪申请</button>
                    <button class="btn-hr-outline" id="btn-export-payroll">导出工资表</button>
                </div>
            </div>

            <div class="hr-stats-row">
                <div class="hr-stat-card">
                    <div class="hr-stat-icon" style="background:#d1fae5;color:#059669;">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6"/></svg>
                    </div>
                    <div class="hr-stat-info">
                        <span class="hr-stat-num">${(totalNet / 10000).toFixed(1)}万</span>
                        <span class="hr-stat-label">本月发放总额</span>
                    </div>
                </div>
                <div class="hr-stat-card">
                    <div class="hr-stat-icon" style="background:#dbeafe;color:#2563eb;">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/></svg>
                    </div>
                    <div class="hr-stat-info">
                        <span class="hr-stat-num">${avgSalary.toLocaleString()}</span>
                        <span class="hr-stat-label">人均薪酬</span>
                    </div>
                </div>
                <div class="hr-stat-card">
                    <div class="hr-stat-icon" style="background:#fef3c7;color:#d97706;">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="1" y="4" width="22" height="16" rx="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg>
                    </div>
                    <div class="hr-stat-info">
                        <span class="hr-stat-num">${(totalCost / 10000).toFixed(1)}万</span>
                        <span class="hr-stat-label">人力总成本</span>
                    </div>
                </div>
                <div class="hr-stat-card">
                    <div class="hr-stat-icon" style="background:#ede9fe;color:#7c3aed;">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>
                    </div>
                    <div class="hr-stat-info">
                        <span class="hr-stat-num">${monthPayroll.length}</span>
                        <span class="hr-stat-label">发薪人数</span>
                    </div>
                </div>
            </div>

            <div class="hr-org-tabs">
                <button class="hr-org-tab ${this.currentTab === 'payroll' ? 'active' : ''}" data-tab="payroll">工资条</button>
                <button class="hr-org-tab ${this.currentTab === 'adjustments' ? 'active' : ''}" data-tab="adjustments">调薪记录</button>
                <button class="hr-org-tab ${this.currentTab === 'structure' ? 'active' : ''}" data-tab="structure">薪酬架构</button>
                <button class="hr-org-tab ${this.currentTab === 'cost' ? 'active' : ''}" data-tab="cost">人力成本</button>
            </div>

            <div class="hr-content-area" id="hr-salary-content">
                ${this.renderTabContent()}
            </div>
        </div>`;
    },

    renderTabContent() {
        switch(this.currentTab) {
            case 'payroll': return this.renderPayroll();
            case 'adjustments': return this.renderAdjustments();
            case 'structure': return this.renderStructure();
            case 'cost': return this.renderCost();
            default: return this.renderPayroll();
        }
    },

    renderPayroll() {
        const monthPayroll = this.payroll.filter(p => p.month === this.currentMonth);
        return `
        <div class="hr-filter-bar">
            <input type="month" id="salary-month-picker" value="${this.currentMonth}" class="hr-filter-select">
            <span class="attendance-summary">${this.currentMonth} 共 ${monthPayroll.length} 人</span>
        </div>
        <div class="hr-table-wrapper payroll-table">
            <table class="hr-table">
                <thead>
                    <tr>
                        <th>姓名</th>
                        <th>部门</th>
                        <th>职级</th>
                        <th>基本工资</th>
                        <th>岗位津贴</th>
                        <th>绩效奖金</th>
                        <th>加班费</th>
                        <th>餐补</th>
                        <th>交通补</th>
                        <th>社保</th>
                        <th>公积金</th>
                        <th>个税</th>
                        <th>实发</th>
                        <th>操作</th>
                    </tr>
                </thead>
                <tbody>
                    ${monthPayroll.map(item => `
                    <tr>
                        <td><strong>${item.name}</strong></td>
                        <td>${item.dept}</td>
                        <td>${item.level}</td>
                        <td>${item.baseSalary.toLocaleString()}</td>
                        <td>${item.positionAllowance.toLocaleString()}</td>
                        <td style="color:#059669;">${item.performanceBonus.toLocaleString()}</td>
                        <td>${item.overtime.toLocaleString()}</td>
                        <td>${(item.mealAllowance||0).toLocaleString()}</td>
                        <td>${(item.transportAllowance||0).toLocaleString()}</td>
                        <td style="color:#dc2626;">-${item.socialInsurance.toLocaleString()}</td>
                        <td style="color:#dc2626;">-${item.housingFund.toLocaleString()}</td>
                        <td style="color:#dc2626;">-${item.tax.toLocaleString()}</td>
                        <td class="salary-net"><strong>${this.getNetSalary(item).toLocaleString()}</strong></td>
                        <td class="action-cell">
                            <button class="hr-action-btn" data-action="edit-payroll" data-id="${item.id}">编辑</button>
                            <button class="hr-action-btn danger" data-action="delete-payroll" data-id="${item.id}">删除</button>
                        </td>
                    </tr>
                    `).join('')}
                </tbody>
                <tfoot>
                    <tr>
                        <td colspan="12"><strong>合计</strong></td>
                        <td class="salary-net"><strong>${monthPayroll.reduce((sum, p) => sum + this.getNetSalary(p), 0).toLocaleString()}</strong></td>
                        <td></td>
                    </tr>
                </tfoot>
            </table>
        </div>`;
    },

    renderAdjustments() {
        return `
        <div class="hr-table-wrapper">
            <table class="hr-table">
                <thead>
                    <tr>
                        <th>姓名</th>
                        <th>部门</th>
                        <th>调薪日期</th>
                        <th>调薪类型</th>
                        <th>原基本工资</th>
                        <th>新基本工资</th>
                        <th>调薪幅度</th>
                        <th>原职级</th>
                        <th>新职级</th>
                        <th>原因</th>
                        <th>审批人</th>
                        <th>操作</th>
                    </tr>
                </thead>
                <tbody>
                    ${this.adjustments.map(adj => {
                        const increase = adj.newBase - adj.oldBase;
                        const percent = ((increase / adj.oldBase) * 100).toFixed(1);
                        return `
                    <tr>
                        <td><strong>${adj.name}</strong></td>
                        <td>${adj.dept}</td>
                        <td>${adj.date}</td>
                        <td><span class="leave-type-badge">${adj.type}</span></td>
                        <td>${adj.oldBase.toLocaleString()}</td>
                        <td style="color:#059669;font-weight:600;">${adj.newBase.toLocaleString()}</td>
                        <td style="color:${increase >= 0 ? '#059669' : '#dc2626'};">${increase >= 0 ? '+' : ''}${increase.toLocaleString()} (${increase >= 0 ? '+' : ''}${percent}%)</td>
                        <td>${adj.oldLevel}</td>
                        <td>${adj.newLevel}</td>
                        <td>${adj.reason}</td>
                        <td>${adj.approver}</td>
                        <td class="action-cell">
                            <button class="hr-action-btn danger" data-action="delete-adjustment" data-id="${adj.id}">删除</button>
                        </td>
                    </tr>`;
                    }).join('')}
                </tbody>
            </table>
            <div class="hr-table-footer">共 ${this.adjustments.length} 条调薪记录</div>
        </div>`;
    },

    renderStructure() {
        return `
        <div class="salary-structure">
            <h3 class="structure-title">薪酬职级体系</h3>
            <div class="hr-table-wrapper">
                <table class="hr-table">
                    <thead>
                        <tr>
                            <th>职级</th>
                            <th>级别名称</th>
                            <th>基本工资范围</th>
                            <th>岗位津贴范围</th>
                            <th>当前人数</th>
                            <th>操作</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${this.structure.map(s => {
                            const count = this.payroll.filter(p => p.level === s.level && p.month === this.currentMonth).length;
                            return `
                        <tr>
                            <td><strong>${s.level}</strong></td>
                            <td>${s.title}</td>
                            <td>${s.baseSalaryMin.toLocaleString()} - ${s.baseSalaryMax.toLocaleString()}</td>
                            <td>${s.positionMin.toLocaleString()} - ${s.positionMax.toLocaleString()}</td>
                            <td>${count}人</td>
                            <td class="action-cell">
                                <button class="hr-action-btn" data-action="edit-level" data-level="${s.level}">编辑</button>
                            </td>
                        </tr>`;
                        }).join('')}
                    </tbody>
                </table>
            </div>
            <div class="salary-components" style="margin-top:24px;">
                <h3>薪酬构成说明</h3>
                <div class="component-list">
                    <div class="component-item">
                        <div class="component-bar" style="background:#3b82f6;width:40%"></div>
                        <span class="component-name">基本工资（40%）</span>
                        <span class="component-desc">根据职级确定</span>
                    </div>
                    <div class="component-item">
                        <div class="component-bar" style="background:#8b5cf6;width:15%"></div>
                        <span class="component-name">岗位津贴（15%）</span>
                        <span class="component-desc">根据岗位责任</span>
                    </div>
                    <div class="component-item">
                        <div class="component-bar" style="background:#10b981;width:25%"></div>
                        <span class="component-name">绩效奖金（25%）</span>
                        <span class="component-desc">月度绩效考核结果</span>
                    </div>
                    <div class="component-item">
                        <div class="component-bar" style="background:#f59e0b;width:10%"></div>
                        <span class="component-name">补贴（10%）</span>
                        <span class="component-desc">餐补+交通补贴+加班费</span>
                    </div>
                    <div class="component-item">
                        <div class="component-bar" style="background:#ef4444;width:10%"></div>
                        <span class="component-name">五险一金（扣除）</span>
                        <span class="component-desc">社保+公积金个人部分</span>
                    </div>
                </div>
            </div>
        </div>`;
    },

    renderCost() {
        const monthPayroll = this.payroll.filter(p => p.month === this.currentMonth);
        const depts = [...new Set(monthPayroll.map(p => p.dept))];
        const deptCosts = depts.map(dept => {
            const items = monthPayroll.filter(p => p.dept === dept);
            const totalGross = items.reduce((sum, i) => sum + this.getGrossSalary(i), 0);
            const totalNet = items.reduce((sum, i) => sum + this.getNetSalary(i), 0);
            const totalSocial = items.reduce((sum, i) => sum + i.socialInsurance + i.housingFund, 0);
            return { dept, headcount: items.length, totalGross, totalNet, totalSocial, avgSalary: Math.round(totalNet / items.length) };
        }).sort((a, b) => b.totalGross - a.totalGross);

        const maxCost = Math.max(...deptCosts.map(d => d.totalGross), 1);

        return `
        <div class="hr-cost-analysis">
            <h3 class="stats-title">部门人力成本分析（${this.currentMonth}）</h3>
            <div class="cost-chart">
                ${deptCosts.map(d => `
                <div class="cost-bar-row">
                    <span class="cost-dept-name">${d.dept}</span>
                    <div class="cost-bar-wrap">
                        <div class="cost-bar" style="width:${(d.totalGross / maxCost * 100)}%">
                            <span class="cost-bar-label">${(d.totalGross / 10000).toFixed(1)}万</span>
                        </div>
                    </div>
                    <span class="cost-headcount">${d.headcount}人</span>
                </div>
                `).join('')}
            </div>
            <div class="hr-table-wrapper" style="margin-top:24px;">
                <table class="hr-table">
                    <thead>
                        <tr>
                            <th>部门</th>
                            <th>人数</th>
                            <th>应发总额</th>
                            <th>实发总额</th>
                            <th>五险一金</th>
                            <th>人均薪酬</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${deptCosts.map(d => `
                        <tr>
                            <td><strong>${d.dept}</strong></td>
                            <td>${d.headcount}人</td>
                            <td>${d.totalGross.toLocaleString()}</td>
                            <td>${d.totalNet.toLocaleString()}</td>
                            <td>${d.totalSocial.toLocaleString()}</td>
                            <td>${d.avgSalary.toLocaleString()}</td>
                        </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        </div>`;
    },

    showPayrollModal(editId) {
        const item = editId ? this.payroll.find(p => p.id === editId) : null;
        const title = item ? '编辑工资条' : '新增工资条';
        const deptSaved = localStorage.getItem('hr_departments');
        const depts = deptSaved ? JSON.parse(deptSaved).filter(d => d.status === 'active').map(d => d.name) : ['顾问部', '会计部', '工商部', '运营部', '人事行政部', '刻章部', '财务部', '技术部'];
        const levels = this.structure.map(s => s.level);

        const html = `
        <div class="hr-modal-overlay" id="salary-modal">
            <div class="hr-modal" style="max-width:650px;">
                <div class="hr-modal-header">
                    <h3>${title}</h3>
                    <button class="hr-modal-close" id="close-salary-modal">&times;</button>
                </div>
                <div class="hr-modal-body">
                    <form id="payroll-form">
                        <div class="hr-form-section">
                            <h4 class="hr-form-section-title">员工信息</h4>
                            <div class="hr-form-grid">
                                <div class="hr-form-item">
                                    <label>姓名 <span class="required">*</span></label>
                                    <input type="text" name="name" value="${item ? item.name : ''}" required>
                                </div>
                                <div class="hr-form-item">
                                    <label>部门 <span class="required">*</span></label>
                                    <select name="dept" required>
                                        <option value="">请选择</option>
                                        ${depts.map(d => `<option value="${d}" ${item && item.dept === d ? 'selected' : ''}>${d}</option>`).join('')}
                                    </select>
                                </div>
                                <div class="hr-form-item">
                                    <label>职位</label>
                                    <input type="text" name="position" value="${item ? item.position : ''}">
                                </div>
                                <div class="hr-form-item">
                                    <label>职级</label>
                                    <select name="level">
                                        ${levels.map(l => `<option value="${l}" ${item && item.level === l ? 'selected' : ''}>${l}</option>`).join('')}
                                    </select>
                                </div>
                                <div class="hr-form-item">
                                    <label>月份 <span class="required">*</span></label>
                                    <input type="month" name="month" value="${item ? item.month : this.currentMonth}" required>
                                </div>
                            </div>
                        </div>
                        <div class="hr-form-section">
                            <h4 class="hr-form-section-title">收入项</h4>
                            <div class="hr-form-grid">
                                <div class="hr-form-item">
                                    <label>基本工资 <span class="required">*</span></label>
                                    <input type="number" name="baseSalary" value="${item ? item.baseSalary : ''}" required min="0">
                                </div>
                                <div class="hr-form-item">
                                    <label>岗位津贴</label>
                                    <input type="number" name="positionAllowance" value="${item ? item.positionAllowance : 0}" min="0">
                                </div>
                                <div class="hr-form-item">
                                    <label>绩效奖金</label>
                                    <input type="number" name="performanceBonus" value="${item ? item.performanceBonus : 0}" min="0">
                                </div>
                                <div class="hr-form-item">
                                    <label>加班费</label>
                                    <input type="number" name="overtime" value="${item ? item.overtime : 0}" min="0">
                                </div>
                                <div class="hr-form-item">
                                    <label>餐补</label>
                                    <input type="number" name="mealAllowance" value="${item ? item.mealAllowance || 500 : 500}" min="0">
                                </div>
                                <div class="hr-form-item">
                                    <label>交通补贴</label>
                                    <input type="number" name="transportAllowance" value="${item ? item.transportAllowance || 200 : 200}" min="0">
                                </div>
                            </div>
                        </div>
                        <div class="hr-form-section">
                            <h4 class="hr-form-section-title">扣除项</h4>
                            <div class="hr-form-grid">
                                <div class="hr-form-item">
                                    <label>社保(个人)</label>
                                    <input type="number" name="socialInsurance" value="${item ? item.socialInsurance : 0}" min="0">
                                </div>
                                <div class="hr-form-item">
                                    <label>公积金(个人)</label>
                                    <input type="number" name="housingFund" value="${item ? item.housingFund : 0}" min="0">
                                </div>
                                <div class="hr-form-item">
                                    <label>个人所得税</label>
                                    <input type="number" name="tax" value="${item ? item.tax : 0}" min="0">
                                </div>
                                <div class="hr-form-item">
                                    <label>其他扣除</label>
                                    <input type="number" name="otherDeduct" value="${item ? item.otherDeduct : 0}" min="0">
                                </div>
                            </div>
                        </div>
                        <div class="hr-form-actions">
                            <button type="button" class="btn-hr-secondary" id="cancel-payroll-form">取消</button>
                            <button type="submit" class="btn-hr-primary">${item ? '保存修改' : '添加工资条'}</button>
                        </div>
                    </form>
                </div>
            </div>
        </div>`;

        document.body.insertAdjacentHTML('beforeend', html);
        document.getElementById('close-salary-modal').onclick = () => this.closeModal();
        document.getElementById('cancel-payroll-form').onclick = () => this.closeModal();
        document.getElementById('payroll-form').onsubmit = (e) => { e.preventDefault(); this.savePayrollItem(editId); };
    },

    savePayrollItem(editId) {
        const form = document.getElementById('payroll-form');
        if (!form.checkValidity()) { form.reportValidity(); return; }
        const fd = new FormData(form);
        const data = {
            name: fd.get('name'),
            dept: fd.get('dept'),
            position: fd.get('position'),
            level: fd.get('level'),
            month: fd.get('month'),
            baseSalary: parseInt(fd.get('baseSalary')) || 0,
            positionAllowance: parseInt(fd.get('positionAllowance')) || 0,
            performanceBonus: parseInt(fd.get('performanceBonus')) || 0,
            overtime: parseInt(fd.get('overtime')) || 0,
            mealAllowance: parseInt(fd.get('mealAllowance')) || 0,
            transportAllowance: parseInt(fd.get('transportAllowance')) || 0,
            socialInsurance: parseInt(fd.get('socialInsurance')) || 0,
            housingFund: parseInt(fd.get('housingFund')) || 0,
            tax: parseInt(fd.get('tax')) || 0,
            otherDeduct: parseInt(fd.get('otherDeduct')) || 0,
        };
        if (editId) {
            const idx = this.payroll.findIndex(p => p.id === editId);
            if (idx >= 0) this.payroll[idx] = { ...this.payroll[idx], ...data };
        } else {
            data.id = this.generateId('PAY');
            data.empId = 'EMP' + Date.now().toString(36).substr(-3);
            this.payroll.push(data);
        }
        this.savePayroll();
        this.closeModal();
        this.refresh();
    },

    deletePayrollItem(id) {
        if (!confirm('确定删除该工资条？')) return;
        this.payroll = this.payroll.filter(p => p.id !== id);
        this.savePayroll();
        this.refresh();
    },

    showAdjustmentModal() {
        const html = `
        <div class="hr-modal-overlay" id="salary-modal">
            <div class="hr-modal" style="max-width:550px;">
                <div class="hr-modal-header">
                    <h3>调薪申请</h3>
                    <button class="hr-modal-close" id="close-salary-modal">&times;</button>
                </div>
                <div class="hr-modal-body">
                    <form id="adjustment-form">
                        <div class="hr-form-section">
                            <div class="hr-form-grid">
                                <div class="hr-form-item">
                                    <label>员工姓名 <span class="required">*</span></label>
                                    <select name="empName" required id="adj-emp-select">
                                        <option value="">请选择</option>
                                        ${this.payroll.filter(p => p.month === this.currentMonth).map(p => `<option value="${p.name}" data-dept="${p.dept}" data-empid="${p.empId}" data-base="${p.baseSalary}" data-level="${p.level}">${p.name} - ${p.dept}</option>`).join('')}
                                    </select>
                                </div>
                                <div class="hr-form-item">
                                    <label>调薪类型 <span class="required">*</span></label>
                                    <select name="type" required>
                                        <option value="年度调薪">年度调薪</option>
                                        <option value="晋升调薪">晋升调薪</option>
                                        <option value="特殊调薪">特殊调薪</option>
                                        <option value="试用期转正">试用期转正</option>
                                    </select>
                                </div>
                                <div class="hr-form-item">
                                    <label>生效日期 <span class="required">*</span></label>
                                    <input type="date" name="date" value="${new Date().toISOString().split('T')[0]}" required>
                                </div>
                                <div class="hr-form-item">
                                    <label>原基本工资</label>
                                    <input type="number" name="oldBase" id="adj-old-base" readonly>
                                </div>
                                <div class="hr-form-item">
                                    <label>新基本工资 <span class="required">*</span></label>
                                    <input type="number" name="newBase" required min="0">
                                </div>
                                <div class="hr-form-item">
                                    <label>原职级</label>
                                    <input type="text" name="oldLevel" id="adj-old-level" readonly>
                                </div>
                                <div class="hr-form-item">
                                    <label>新职级</label>
                                    <select name="newLevel">
                                        ${this.structure.map(s => `<option value="${s.level}">${s.level} - ${s.title}</option>`).join('')}
                                    </select>
                                </div>
                                <div class="hr-form-item">
                                    <label>审批人</label>
                                    <input type="text" name="approver" value="陈浩">
                                </div>
                            </div>
                            <div class="hr-form-item" style="grid-column:1/-1;">
                                <label>调薪原因 <span class="required">*</span></label>
                                <textarea name="reason" rows="3" required></textarea>
                            </div>
                        </div>
                        <div class="hr-form-actions">
                            <button type="button" class="btn-hr-secondary" id="cancel-adj-form">取消</button>
                            <button type="submit" class="btn-hr-primary">提交调薪</button>
                        </div>
                    </form>
                </div>
            </div>
        </div>`;

        document.body.insertAdjacentHTML('beforeend', html);
        document.getElementById('close-salary-modal').onclick = () => this.closeModal();
        document.getElementById('cancel-adj-form').onclick = () => this.closeModal();
        document.getElementById('adjustment-form').onsubmit = (e) => { e.preventDefault(); this.saveAdjustment(); };

        // Auto-fill old base when employee selected
        document.getElementById('adj-emp-select').onchange = (e) => {
            const opt = e.target.options[e.target.selectedIndex];
            document.getElementById('adj-old-base').value = opt.dataset.base || '';
            document.getElementById('adj-old-level').value = opt.dataset.level || '';
        };
    },

    saveAdjustment() {
        const form = document.getElementById('adjustment-form');
        if (!form.checkValidity()) { form.reportValidity(); return; }
        const fd = new FormData(form);
        const empSelect = document.getElementById('adj-emp-select');
        const opt = empSelect.options[empSelect.selectedIndex];

        const data = {
            id: this.generateId('ADJ'),
            empId: opt.dataset.empid || '',
            name: fd.get('empName'),
            dept: opt.dataset.dept || '',
            date: fd.get('date'),
            type: fd.get('type'),
            oldBase: parseInt(fd.get('oldBase')) || 0,
            newBase: parseInt(fd.get('newBase')),
            oldLevel: fd.get('oldLevel'),
            newLevel: fd.get('newLevel'),
            reason: fd.get('reason'),
            approver: fd.get('approver'),
        };
        this.adjustments.unshift(data);
        this.saveAdjustments();
        this.closeModal();
        this.currentTab = 'adjustments';
        this.refresh();
    },

    deleteAdjustment(id) {
        if (!confirm('确定删除该调薪记录？')) return;
        this.adjustments = this.adjustments.filter(a => a.id !== id);
        this.saveAdjustments();
        this.refresh();
    },

    showEditLevel(level) {
        const item = this.structure.find(s => s.level === level);
        if (!item) return;
        const html = `
        <div class="hr-modal-overlay" id="salary-modal">
            <div class="hr-modal" style="max-width:450px;">
                <div class="hr-modal-header">
                    <h3>编辑职级 ${item.level}</h3>
                    <button class="hr-modal-close" id="close-salary-modal">&times;</button>
                </div>
                <div class="hr-modal-body">
                    <form id="level-form">
                        <div class="hr-form-grid">
                            <div class="hr-form-item">
                                <label>级别名称</label>
                                <input type="text" name="title" value="${item.title}" required>
                            </div>
                            <div class="hr-form-item">
                                <label>基本工资下限</label>
                                <input type="number" name="baseSalaryMin" value="${item.baseSalaryMin}" min="0" required>
                            </div>
                            <div class="hr-form-item">
                                <label>基本工资上限</label>
                                <input type="number" name="baseSalaryMax" value="${item.baseSalaryMax}" min="0" required>
                            </div>
                            <div class="hr-form-item">
                                <label>岗位津贴下限</label>
                                <input type="number" name="positionMin" value="${item.positionMin}" min="0">
                            </div>
                            <div class="hr-form-item">
                                <label>岗位津贴上限</label>
                                <input type="number" name="positionMax" value="${item.positionMax}" min="0">
                            </div>
                        </div>
                        <div class="hr-form-actions">
                            <button type="button" class="btn-hr-secondary" id="cancel-level-form">取消</button>
                            <button type="submit" class="btn-hr-primary">保存</button>
                        </div>
                    </form>
                </div>
            </div>
        </div>`;
        document.body.insertAdjacentHTML('beforeend', html);
        document.getElementById('close-salary-modal').onclick = () => this.closeModal();
        document.getElementById('cancel-level-form').onclick = () => this.closeModal();
        document.getElementById('level-form').onsubmit = (e) => {
            e.preventDefault();
            const fd = new FormData(document.getElementById('level-form'));
            item.title = fd.get('title');
            item.baseSalaryMin = parseInt(fd.get('baseSalaryMin'));
            item.baseSalaryMax = parseInt(fd.get('baseSalaryMax'));
            item.positionMin = parseInt(fd.get('positionMin')) || 0;
            item.positionMax = parseInt(fd.get('positionMax')) || 0;
            this.saveStructure();
            this.closeModal();
            this.refresh();
        };
    },

    exportPayroll() {
        const monthPayroll = this.payroll.filter(p => p.month === this.currentMonth);
        const headers = ['姓名', '部门', '职位', '职级', '基本工资', '岗位津贴', '绩效奖金', '加班费', '餐补', '交通补', '社保', '公积金', '个税', '其他扣除', '实发工资'];
        const rows = monthPayroll.map(p => [p.name, p.dept, p.position, p.level, p.baseSalary, p.positionAllowance, p.performanceBonus, p.overtime, p.mealAllowance||0, p.transportAllowance||0, p.socialInsurance, p.housingFund, p.tax, p.otherDeduct, this.getNetSalary(p)]);
        let csv = '\ufeff' + headers.join(',') + '\n';
        rows.forEach(r => { csv += r.map(v => `"${(v+'').replace(/"/g, '""')}"`).join(',') + '\n'; });
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url; a.download = `工资表_${this.currentMonth}.csv`;
        a.click(); URL.revokeObjectURL(url);
    },

    closeModal() {
        const modal = document.getElementById('salary-modal');
        if (modal) modal.remove();
    },

    refresh() {
        const contentArea = document.querySelector('.content-area');
        contentArea.innerHTML = this.render();
        this.bindEvents();
    },

    bindEvents() {
        // Tab switching
        document.querySelectorAll('.hr-org-tab').forEach(tab => {
            tab.addEventListener('click', () => {
                this.currentTab = tab.dataset.tab;
                this.refresh();
            });
        });

        // Header buttons
        const btnAdd = document.getElementById('btn-add-payroll');
        if (btnAdd) btnAdd.onclick = () => this.showPayrollModal();
        const btnAdj = document.getElementById('btn-add-adjustment');
        if (btnAdj) btnAdj.onclick = () => this.showAdjustmentModal();
        const btnExport = document.getElementById('btn-export-payroll');
        if (btnExport) btnExport.onclick = () => this.exportPayroll();

        // Month picker
        const monthPicker = document.getElementById('salary-month-picker');
        if (monthPicker) {
            monthPicker.onchange = () => {
                this.currentMonth = monthPicker.value;
                this.refresh();
            };
        }

        this.bindContentEvents();
    },

    bindContentEvents() {
        document.querySelectorAll('[data-action]').forEach(btn => {
            btn.onclick = () => {
                const action = btn.dataset.action;
                const id = btn.dataset.id;
                const level = btn.dataset.level;
                switch(action) {
                    case 'edit-payroll': this.showPayrollModal(id); break;
                    case 'delete-payroll': this.deletePayrollItem(id); break;
                    case 'delete-adjustment': this.deleteAdjustment(id); break;
                    case 'edit-level': this.showEditLevel(level); break;
                }
            };
        });
    }
};
