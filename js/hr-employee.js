// 员工档案管理模块 - 完整CRUD功能 + localStorage持久化

const HrEmployee = {
    STORAGE_KEY: 'hr_employees',

    defaultEmployees: [
        { id: 'EMP001', name: '陈总', gender: '男', age: 42, dept: '总经理办公室', position: '总经理', level: 'L10', phone: '13800001001', email: 'chen@zhqf.com', idCard: '330102198301011001', education: '本科', school: '浙江大学', major: '工商管理', joinDate: '2018-03-01', contractEnd: '2028-03-01', probationEnd: '', status: '在职', workYears: 6, emergencyContact: '陈夫人', emergencyPhone: '13900002001', address: '杭州市西湖区', bankAccount: '6222021234568001', socialSecurity: '已缴纳', housingFund: '已缴纳' },
        { id: 'EMP002', name: '张伟', gender: '男', age: 35, dept: '顾问部', position: '部门经理', level: 'L7', phone: '13800001002', email: 'zhangwei@zhqf.com', idCard: '330102198901011002', education: '本科', school: '浙江工商大学', major: '财务管理', joinDate: '2019-05-15', contractEnd: '2026-05-15', probationEnd: '', status: '在职', workYears: 5, emergencyContact: '张父', emergencyPhone: '13900002002', address: '杭州市拱墅区', bankAccount: '6222021234568002', socialSecurity: '已缴纳', housingFund: '已缴纳' },
        { id: 'EMP003', name: '周芳', gender: '女', age: 29, dept: '顾问部', position: '组长', level: 'L5', phone: '13800001003', email: 'zhoufang@zhqf.com', idCard: '330102199501011003', education: '本科', school: '杭州电子科技大学', major: '会计学', joinDate: '2020-02-20', contractEnd: '2026-02-20', probationEnd: '', status: '在职', workYears: 4, emergencyContact: '周母', emergencyPhone: '13900002003', address: '杭州市江干区', bankAccount: '6222021234568003', socialSecurity: '已缴纳', housingFund: '已缴纳' },
        { id: 'EMP004', name: '李娜', gender: '女', age: 33, dept: '会计部', position: '部门经理', level: 'L7', phone: '13800001004', email: 'lina@zhqf.com', idCard: '330102199201011004', education: '硕士', school: '浙江财经大学', major: '会计学', joinDate: '2019-01-10', contractEnd: '2026-01-10', probationEnd: '', status: '在职', workYears: 5, emergencyContact: '李父', emergencyPhone: '13900002004', address: '杭州市上城区', bankAccount: '6222021234568004', socialSecurity: '已缴纳', housingFund: '已缴纳' },
        { id: 'EMP005', name: '孙丽', gender: '女', age: 28, dept: '会计部', position: '代账组长', level: 'L5', phone: '13800001005', email: 'sunli@zhqf.com', idCard: '330102199701011005', education: '本科', school: '浙江工业大学', major: '财务管理', joinDate: '2020-06-01', contractEnd: '2026-06-01', probationEnd: '', status: '在职', workYears: 4, emergencyContact: '孙母', emergencyPhone: '13900002005', address: '杭州市滨江区', bankAccount: '6222021234568005', socialSecurity: '已缴纳', housingFund: '已缴纳' },
        { id: 'EMP006', name: '马晓', gender: '女', age: 30, dept: '会计部', position: '审计组长', level: 'L5', phone: '13800001006', email: 'maxiao@zhqf.com', idCard: '330102199401011006', education: '本科', school: '浙江理工大学', major: '审计学', joinDate: '2020-09-15', contractEnd: '2026-09-15', probationEnd: '', status: '在职', workYears: 4, emergencyContact: '马父', emergencyPhone: '13900002006', address: '杭州市萧山区', bankAccount: '6222021234568006', socialSecurity: '已缴纳', housingFund: '已缴纳' },
        { id: 'EMP007', name: '王强', gender: '男', age: 36, dept: '工商部', position: '部门经理', level: 'L7', phone: '13800001007', email: 'wangqiang@zhqf.com', idCard: '330102198801011007', education: '本科', school: '浙江大学城市学院', major: '法学', joinDate: '2019-03-20', contractEnd: '2026-03-20', probationEnd: '', status: '在职', workYears: 5, emergencyContact: '王母', emergencyPhone: '13900002007', address: '杭州市余杭区', bankAccount: '6222021234568007', socialSecurity: '已缴纳', housingFund: '已缴纳' },
        { id: 'EMP008', name: '赵敏', gender: '女', age: 31, dept: '刻章部', position: '部门主管', level: 'L6', phone: '13800001010', email: 'zhaomin@zhqf.com', idCard: '330102199301011010', education: '大专', school: '浙江经贸职业技术学院', major: '行政管理', joinDate: '2020-01-15', contractEnd: '2026-01-15', probationEnd: '', status: '在职', workYears: 4, emergencyContact: '赵父', emergencyPhone: '13900002010', address: '杭州市下城区', bankAccount: '6222021234568010', socialSecurity: '已缴纳', housingFund: '已缴纳' },
        { id: 'EMP009', name: '陈浩', gender: '男', age: 34, dept: '人事行政部', position: '部门经理', level: 'L7', phone: '13800001011', email: 'chenhao@zhqf.com', idCard: '330102199001011011', education: '本科', school: '浙江工商大学', major: '人力资源管理', joinDate: '2019-08-01', contractEnd: '2026-08-01', probationEnd: '', status: '在职', workYears: 5, emergencyContact: '陈母', emergencyPhone: '13900002011', address: '杭州市西湖区', bankAccount: '6222021234568011', socialSecurity: '已缴纳', housingFund: '已缴纳' },
        { id: 'EMP010', name: '黄婷', gender: '女', age: 26, dept: '人事行政部', position: '招聘培训专员', level: 'L4', phone: '13800001012', email: 'huangting@zhqf.com', idCard: '330102199901011012', education: '本科', school: '杭州师范大学', major: '人力资源', joinDate: '2021-07-01', contractEnd: '2027-07-01', probationEnd: '', status: '在职', workYears: 3, emergencyContact: '黄母', emergencyPhone: '13900002012', address: '杭州市拱墅区', bankAccount: '6222021234568012', socialSecurity: '已缴纳', housingFund: '已缴纳' },
        { id: 'EMP011', name: '刘洋', gender: '男', age: 32, dept: '运营部', position: '部门经理', level: 'L7', phone: '13800001014', email: 'liuyang@zhqf.com', idCard: '330102199201011014', education: '本科', school: '浙江传媒学院', major: '新媒体', joinDate: '2020-03-01', contractEnd: '2026-03-01', probationEnd: '', status: '在职', workYears: 4, emergencyContact: '刘父', emergencyPhone: '13900002014', address: '杭州市江干区', bankAccount: '6222021234568014', socialSecurity: '已缴纳', housingFund: '已缴纳' },
        { id: 'EMP012', name: '杨梅', gender: '女', age: 38, dept: '财务部', position: '财务总监', level: 'L8', phone: '13800001016', email: 'yangmei@zhqf.com', idCard: '330102198601011016', education: '硕士', school: '浙江大学', major: '会计学', joinDate: '2018-06-01', contractEnd: '2028-06-01', probationEnd: '', status: '在职', workYears: 6, emergencyContact: '杨父', emergencyPhone: '13900002016', address: '杭州市西湖区', bankAccount: '6222021234568016', socialSecurity: '已缴纳', housingFund: '已缴纳' },
        { id: 'EMP013', name: '李雪梅', gender: '女', age: 25, dept: '会计部', position: '会计', level: 'L3', phone: '13800001017', email: 'lixuemei@zhqf.com', idCard: '330102200001011017', education: '本科', school: '浙江财经大学', major: '会计学', joinDate: '2024-12-01', contractEnd: '2027-12-01', probationEnd: '2025-03-01', status: '在职', workYears: 0, emergencyContact: '李母', emergencyPhone: '13900002017', address: '杭州市滨江区', bankAccount: '6222021234568017', socialSecurity: '已缴纳', housingFund: '已缴纳' },
        { id: 'EMP014', name: '谢欣', gender: '女', age: 27, dept: '运营部', position: '客户运营组长', level: 'L5', phone: '13800001015', email: 'xiexin@zhqf.com', idCard: '330102199801011015', education: '本科', school: '浙江工商大学', major: '市场营销', joinDate: '2021-09-15', contractEnd: '2027-09-15', probationEnd: '', status: '在职', workYears: 3, emergencyContact: '谢父', emergencyPhone: '13900002015', address: '杭州市上城区', bankAccount: '6222021234568015', socialSecurity: '已缴纳', housingFund: '已缴纳' },
        { id: 'EMP015', name: '吴刚', gender: '男', age: 29, dept: '人事行政部', position: '行政后勤专员', level: 'L4', phone: '13800001013', email: 'wugang@zhqf.com', idCard: '330102199601011013', education: '大专', school: '浙江经济职业技术学院', major: '行政管理', joinDate: '2022-01-10', contractEnd: '2028-01-10', probationEnd: '', status: '在职', workYears: 2, emergencyContact: '吴母', emergencyPhone: '13900002013', address: '杭州市余杭区', bankAccount: '6222021234568013', socialSecurity: '已缴纳', housingFund: '已缴纳' }
    ],

    employees: [],
    currentView: 'list',
    selectedEmployee: null,
    searchKeyword: '',
    filterDept: '',
    filterStatus: '',

    loadData() {
        const stored = localStorage.getItem(this.STORAGE_KEY);
        this.employees = stored ? JSON.parse(stored) : [...this.defaultEmployees];
    },

    saveData() {
        localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.employees));
    },

    generateId() {
        const maxNum = this.employees.reduce((max, e) => {
            const num = parseInt(e.id.replace('EMP', ''));
            return num > max ? num : max;
        }, 0);
        return 'EMP' + String(maxNum + 1).padStart(3, '0');
    },

    getDepts() {
        // 从共享部门数据读取
        const saved = localStorage.getItem('hr_departments');
        if (saved) {
            const depts = JSON.parse(saved);
            return depts.filter(d => d.status === 'active').map(d => d.name);
        }
        return ['总经理办公室', '顾问部', '会计部', '工商部', '刻章部', '人事行政部', '运营部', '财务部', '技术部', '招商加盟部'];
    },

    init() {
        this.loadData();
        const contentArea = document.querySelector('.content-area');
        contentArea.innerHTML = this.render();
        this.bindEvents();
    },

    destroy() {},

    render() {
        const depts = [...new Set(this.employees.map(e => e.dept))];
        const activeCount = this.employees.filter(e => e.status === '在职').length;
        const trialCount = this.employees.filter(e => e.probationEnd && new Date(e.probationEnd) > new Date()).length;

        return `
        <div class="hr-employee-page">
            <div class="hr-module-header">
                <div class="hr-module-title">
                    <h2>员工档案</h2>
                    <p class="hr-module-desc">全面管理员工信息，支持增删改查和数据持久化</p>
                </div>
                <div class="hr-header-actions">
                    <button class="btn-hr-outline" onclick="HrEmployee.exportData()">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="7,10 12,15 17,10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                        导出
                    </button>
                    <button class="btn-hr-primary" onclick="HrEmployee.showAddModal()">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                        添加员工
                    </button>
                </div>
            </div>

            <div class="hr-stats-row">
                <div class="hr-stat-card">
                    <div class="hr-stat-icon" style="background:#dbeafe;color:#2563eb;">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87"/><path d="M16 3.13a4 4 0 010 7.75"/></svg>
                    </div>
                    <div class="hr-stat-info">
                        <span class="hr-stat-num">${this.employees.length}</span>
                        <span class="hr-stat-label">总人数</span>
                    </div>
                </div>
                <div class="hr-stat-card">
                    <div class="hr-stat-icon" style="background:#d1fae5;color:#059669;">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 11.08V12a10 10 0 11-5.93-9.14"/><polyline points="22,4 12,14.01 9,11.01"/></svg>
                    </div>
                    <div class="hr-stat-info">
                        <span class="hr-stat-num">${activeCount}</span>
                        <span class="hr-stat-label">在职</span>
                    </div>
                </div>
                <div class="hr-stat-card">
                    <div class="hr-stat-icon" style="background:#fef3c7;color:#d97706;">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12,6 12,12 16,14"/></svg>
                    </div>
                    <div class="hr-stat-info">
                        <span class="hr-stat-num">${trialCount}</span>
                        <span class="hr-stat-label">试用期</span>
                    </div>
                </div>
                <div class="hr-stat-card">
                    <div class="hr-stat-icon" style="background:#ede9fe;color:#7c3aed;">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2"/><line x1="3" y1="9" x2="21" y2="9"/><line x1="9" y1="21" x2="9" y2="9"/></svg>
                    </div>
                    <div class="hr-stat-info">
                        <span class="hr-stat-num">${depts.length}</span>
                        <span class="hr-stat-label">部门</span>
                    </div>
                </div>
            </div>

            <div class="hr-toolbar">
                <div class="hr-toolbar-left">
                    <div class="hr-search-box">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
                        <input type="text" class="hr-search-input" id="emp-search" placeholder="搜索姓名、工号、部门..." value="${this.searchKeyword}">
                    </div>
                    <select class="hr-filter-select" id="emp-dept-filter">
                        <option value="">全部部门</option>
                        ${depts.map(d => `<option value="${d}" ${this.filterDept === d ? 'selected' : ''}>${d}</option>`).join('')}
                    </select>
                    <select class="hr-filter-select" id="emp-status-filter">
                        <option value="">全部状态</option>
                        <option value="在职" ${this.filterStatus === '在职' ? 'selected' : ''}>在职</option>
                        <option value="试用期" ${this.filterStatus === '试用期' ? 'selected' : ''}>试用期</option>
                        <option value="已离职" ${this.filterStatus === '已离职' ? 'selected' : ''}>已离职</option>
                    </select>
                </div>
                <div class="hr-toolbar-right">
                    <button class="hr-view-btn ${this.currentView === 'list' ? 'active' : ''}" data-view="list" title="列表视图">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></svg>
                    </button>
                    <button class="hr-view-btn ${this.currentView === 'card' ? 'active' : ''}" data-view="card" title="卡片视图">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/></svg>
                    </button>
                </div>
            </div>

            <div class="hr-content-area" id="hr-emp-content">
                ${this.currentView === 'list' ? this.renderListView() : this.renderCardView()}
            </div>
        </div>
        <div class="hr-modal-overlay" id="hr-modal-overlay" style="display:none;"></div>`;
    },

    renderListView() {
        const filtered = this.getFilteredEmployees();
        return `
        <div class="hr-table-wrapper">
            <table class="hr-table">
                <thead>
                    <tr>
                        <th>工号</th>
                        <th>姓名</th>
                        <th>部门</th>
                        <th>职位</th>
                        <th>职级</th>
                        <th>手机</th>
                        <th>入职日期</th>
                        <th>状态</th>
                        <th>操作</th>
                    </tr>
                </thead>
                <tbody>
                    ${filtered.map(emp => `
                    <tr class="hr-table-row">
                        <td class="emp-id">${emp.id}</td>
                        <td class="emp-name">
                            <div class="emp-avatar-sm">${emp.name.charAt(0)}</div>
                            <span>${emp.name}</span>
                        </td>
                        <td>${emp.dept}</td>
                        <td>${emp.position}</td>
                        <td><span class="level-badge">${emp.level}</span></td>
                        <td>${emp.phone}</td>
                        <td>${emp.joinDate}</td>
                        <td><span class="status-dot ${emp.status === '在职' ? 'active' : emp.status === '试用期' ? 'trial' : 'left'}">${emp.status}</span></td>
                        <td class="action-cell">
                            <button class="hr-action-btn" onclick="HrEmployee.viewDetail('${emp.id}')">查看</button>
                            <button class="hr-action-btn" onclick="HrEmployee.showEditModal('${emp.id}')">编辑</button>
                            <button class="hr-action-btn reject-btn" onclick="HrEmployee.deleteEmployee('${emp.id}')">删除</button>
                        </td>
                    </tr>
                    `).join('')}
                </tbody>
            </table>
            ${filtered.length === 0 ? '<div class="hr-empty">暂无匹配的员工数据</div>' : ''}
            <div class="hr-table-footer">共 ${filtered.length} 条记录</div>
        </div>`;
    },

    renderCardView() {
        const filtered = this.getFilteredEmployees();
        return `
        <div class="hr-card-grid">
            ${filtered.map(emp => `
            <div class="hr-emp-card" onclick="HrEmployee.viewDetail('${emp.id}')">
                <div class="hr-emp-card-header">
                    <div class="emp-avatar-lg">${emp.name.charAt(0)}</div>
                    <div class="emp-card-info">
                        <h4>${emp.name}</h4>
                        <p>${emp.position}</p>
                    </div>
                    <span class="status-dot ${emp.status === '在职' ? 'active' : 'left'}">${emp.status}</span>
                </div>
                <div class="hr-emp-card-body">
                    <div class="emp-card-row"><span>工号</span><span>${emp.id}</span></div>
                    <div class="emp-card-row"><span>部门</span><span>${emp.dept}</span></div>
                    <div class="emp-card-row"><span>职级</span><span>${emp.level}</span></div>
                    <div class="emp-card-row"><span>手机</span><span>${emp.phone}</span></div>
                    <div class="emp-card-row"><span>入职</span><span>${emp.joinDate}</span></div>
                </div>
            </div>
            `).join('')}
        </div>`;
    },

    getFilteredEmployees() {
        return this.employees.filter(emp => {
            const matchSearch = !this.searchKeyword ||
                emp.name.includes(this.searchKeyword) ||
                emp.id.toLowerCase().includes(this.searchKeyword.toLowerCase()) ||
                emp.dept.includes(this.searchKeyword) ||
                emp.position.includes(this.searchKeyword) ||
                emp.phone.includes(this.searchKeyword);
            const matchDept = !this.filterDept || emp.dept === this.filterDept;
            const matchStatus = !this.filterStatus || emp.status === this.filterStatus;
            return matchSearch && matchDept && matchStatus;
        });
    },

    // ========= 添加员工 =========
    showAddModal() {
        const depts = this.getDepts();
        this.showFormModal('添加员工', null, depts);
    },

    // ========= 编辑员工 =========
    showEditModal(id) {
        const emp = this.employees.find(e => e.id === id);
        if (!emp) return;
        const depts = this.getDepts();
        this.showFormModal('编辑员工', emp, depts);
    },

    showFormModal(title, emp, depts) {
        const isEdit = !!emp;
        const modalHTML = `
        <div class="hr-modal" id="hr-emp-modal">
            <div class="hr-modal-header">
                <h3>${title}</h3>
                <button class="hr-modal-close" onclick="HrEmployee.closeModal()">&times;</button>
            </div>
            <div class="hr-modal-body">
                <form id="emp-form" class="hr-form">
                    <div class="hr-form-section">
                        <h4>基本信息</h4>
                        <div class="hr-form-grid">
                            <div class="hr-form-group">
                                <label>姓名 <span class="required">*</span></label>
                                <input type="text" name="name" value="${isEdit ? emp.name : ''}" required placeholder="请输入姓名">
                            </div>
                            <div class="hr-form-group">
                                <label>性别 <span class="required">*</span></label>
                                <select name="gender" required>
                                    <option value="">请选择</option>
                                    <option value="男" ${isEdit && emp.gender === '男' ? 'selected' : ''}>男</option>
                                    <option value="女" ${isEdit && emp.gender === '女' ? 'selected' : ''}>女</option>
                                </select>
                            </div>
                            <div class="hr-form-group">
                                <label>年龄</label>
                                <input type="number" name="age" value="${isEdit ? emp.age : ''}" placeholder="请输入年龄" min="18" max="65">
                            </div>
                            <div class="hr-form-group">
                                <label>手机号 <span class="required">*</span></label>
                                <input type="tel" name="phone" value="${isEdit ? emp.phone : ''}" required placeholder="请输入手机号">
                            </div>
                            <div class="hr-form-group">
                                <label>邮箱</label>
                                <input type="email" name="email" value="${isEdit ? emp.email : ''}" placeholder="请输入邮箱">
                            </div>
                            <div class="hr-form-group">
                                <label>身份证号</label>
                                <input type="text" name="idCard" value="${isEdit ? emp.idCard : ''}" placeholder="请输入身份证号">
                            </div>
                            <div class="hr-form-group">
                                <label>住址</label>
                                <input type="text" name="address" value="${isEdit ? emp.address : ''}" placeholder="请输入住址">
                            </div>
                            <div class="hr-form-group">
                                <label>紧急联系人</label>
                                <input type="text" name="emergencyContact" value="${isEdit ? emp.emergencyContact : ''}" placeholder="紧急联系人姓名">
                            </div>
                            <div class="hr-form-group">
                                <label>紧急联系电话</label>
                                <input type="tel" name="emergencyPhone" value="${isEdit ? emp.emergencyPhone : ''}" placeholder="紧急联系人电话">
                            </div>
                        </div>
                    </div>
                    <div class="hr-form-section">
                        <h4>岗位信息</h4>
                        <div class="hr-form-grid">
                            <div class="hr-form-group">
                                <label>部门 <span class="required">*</span></label>
                                <select name="dept" required>
                                    <option value="">请选择部门</option>
                                    ${depts.map(d => `<option value="${d}" ${isEdit && emp.dept === d ? 'selected' : ''}>${d}</option>`).join('')}
                                </select>
                            </div>
                            <div class="hr-form-group">
                                <label>职位 <span class="required">*</span></label>
                                <input type="text" name="position" value="${isEdit ? emp.position : ''}" required placeholder="请输入职位">
                            </div>
                            <div class="hr-form-group">
                                <label>直属上级</label>
                                <input type="text" name="supervisor" value="${isEdit ? (emp.supervisor || '') : ''}" placeholder="直属上级姓名">
                            </div>
                            <div class="hr-form-group">
                                <label>职级</label>
                                <select name="level">
                                    <option value="">请选择职级</option>
                                    ${['L3','L4','L5','L6','L7','L8','L9','L10'].map(l => `<option value="${l}" ${isEdit && emp.level === l ? 'selected' : ''}>${l}</option>`).join('')}
                                </select>
                            </div>
                            <div class="hr-form-group">
                                <label>入职日期 <span class="required">*</span></label>
                                <input type="date" name="joinDate" value="${isEdit ? emp.joinDate : ''}" required>
                            </div>
                            <div class="hr-form-group">
                                <label>试用期截止</label>
                                <input type="date" name="probationEnd" value="${isEdit ? emp.probationEnd : ''}">
                            </div>
                            <div class="hr-form-group">
                                <label>合同到期日</label>
                                <input type="date" name="contractEnd" value="${isEdit ? emp.contractEnd : ''}">
                            </div>
                            <div class="hr-form-group">
                                <label>状态</label>
                                <select name="status">
                                    <option value="在职" ${isEdit && emp.status === '在职' ? 'selected' : ''}>在职</option>
                                    <option value="试用期" ${isEdit && emp.status === '试用期' ? 'selected' : ''}>试用期</option>
                                    <option value="已离职" ${isEdit && emp.status === '已离职' ? 'selected' : ''}>已离职</option>
                                </select>
                            </div>
                        </div>
                    </div>
                    <div class="hr-form-section">
                        <h4>教育与财务</h4>
                        <div class="hr-form-grid">
                            <div class="hr-form-group">
                                <label>学历</label>
                                <select name="education">
                                    <option value="">请选择</option>
                                    ${['高中','大专','本科','硕士','博士'].map(e => `<option value="${e}" ${isEdit && emp.education === e ? 'selected' : ''}>${e}</option>`).join('')}
                                </select>
                            </div>
                            <div class="hr-form-group">
                                <label>毕业院校</label>
                                <input type="text" name="school" value="${isEdit ? emp.school : ''}" placeholder="请输入毕业院校">
                            </div>
                            <div class="hr-form-group">
                                <label>专业</label>
                                <input type="text" name="major" value="${isEdit ? emp.major : ''}" placeholder="请输入专业">
                            </div>
                            <div class="hr-form-group">
                                <label>银行卡号</label>
                                <input type="text" name="bankAccount" value="${isEdit ? emp.bankAccount : ''}" placeholder="工资卡号">
                            </div>
                            <div class="hr-form-group">
                                <label>社保</label>
                                <select name="socialSecurity">
                                    <option value="未缴纳" ${isEdit && emp.socialSecurity === '未缴纳' ? 'selected' : ''}>未缴纳</option>
                                    <option value="已缴纳" ${isEdit && emp.socialSecurity === '已缴纳' ? 'selected' : ''}>已缴纳</option>
                                </select>
                            </div>
                            <div class="hr-form-group">
                                <label>公积金</label>
                                <select name="housingFund">
                                    <option value="未缴纳" ${isEdit && emp.housingFund === '未缴纳' ? 'selected' : ''}>未缴纳</option>
                                    <option value="已缴纳" ${isEdit && emp.housingFund === '已缴纳' ? 'selected' : ''}>已缴纳</option>
                                </select>
                            </div>
                        </div>
                    </div>
                </form>
            </div>
            <div class="hr-modal-footer">
                <button class="btn-hr-outline" onclick="HrEmployee.closeModal()">取消</button>
                <button class="btn-hr-primary" onclick="HrEmployee.saveEmployee('${isEdit ? emp.id : ''}')">保存</button>
            </div>
        </div>`;

        const overlay = document.getElementById('hr-modal-overlay');
        if (overlay) {
            overlay.innerHTML = modalHTML;
            overlay.style.display = 'flex';
        } else {
            const div = document.createElement('div');
            div.className = 'hr-modal-overlay';
            div.id = 'hr-modal-overlay';
            div.style.display = 'flex';
            div.innerHTML = modalHTML;
            document.body.appendChild(div);
        }
    },

    saveEmployee(editId) {
        const form = document.getElementById('emp-form');
        if (!form.checkValidity()) {
            form.reportValidity();
            return;
        }

        const formData = new FormData(form);
        const data = {};
        formData.forEach((val, key) => { data[key] = val; });
        data.age = parseInt(data.age) || 0;
        data.workYears = data.joinDate ? Math.floor((new Date() - new Date(data.joinDate)) / (365.25 * 24 * 3600 * 1000)) : 0;
        if (data.workYears < 0) data.workYears = 0;

        if (editId) {
            // 编辑
            const idx = this.employees.findIndex(e => e.id === editId);
            if (idx !== -1) {
                this.employees[idx] = { ...this.employees[idx], ...data };
            }
        } else {
            // 新增
            data.id = this.generateId();
            this.employees.push(data);
        }

        this.saveData();
        this.closeModal();
        this.init();
    },

    deleteEmployee(id) {
        const emp = this.employees.find(e => e.id === id);
        if (!emp) return;
        if (!confirm(`确定要删除员工「${emp.name}」吗？此操作不可恢复。`)) return;
        this.employees = this.employees.filter(e => e.id !== id);
        this.saveData();
        this.init();
    },

    closeModal() {
        const overlay = document.getElementById('hr-modal-overlay');
        if (overlay) overlay.style.display = 'none';
    },

    // ========= 查看详情 =========
    viewDetail(id) {
        const emp = this.employees.find(e => e.id === id);
        if (!emp) return;
        this.selectedEmployee = emp;

        const contentArea = document.querySelector('.content-area');
        contentArea.innerHTML = `
        <div class="hr-employee-page">
            <div class="hr-detail-header">
                <button class="hr-back-btn" onclick="HrEmployee.init()">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="15,18 9,12 15,6"/></svg>
                    返回列表
                </button>
                <div class="hr-detail-actions">
                    <button class="btn-hr-outline" onclick="HrEmployee.showEditModal('${emp.id}')">编辑信息</button>
                    <button class="btn-hr-primary" onclick="HrEmployee.deleteEmployee('${emp.id}')">删除员工</button>
                </div>
            </div>

            <div class="hr-detail-profile">
                <div class="hr-detail-avatar">${emp.name.charAt(0)}</div>
                <div class="hr-detail-basic">
                    <h2>${emp.name} <span class="level-badge">${emp.level || ''}</span></h2>
                    <p>${emp.dept} · ${emp.position}</p>
                    <div class="hr-detail-tags">
                        <span class="status-dot ${emp.status === '在职' ? 'active' : emp.status === '试用期' ? 'trial' : 'left'}">${emp.status}</span>
                        ${emp.education ? `<span class="hr-tag">${emp.education}</span>` : ''}
                        <span class="hr-tag">工龄 ${emp.workYears || 0} 年</span>
                        <span class="hr-tag">工号 ${emp.id}</span>
                    </div>
                </div>
            </div>

            <div class="hr-detail-tabs">
                <button class="hr-detail-tab active" data-tab="basic">基本信息</button>
                <button class="hr-detail-tab" data-tab="job">岗位信息</button>
                <button class="hr-detail-tab" data-tab="contract">合同社保</button>
                <button class="hr-detail-tab" data-tab="education">教育经历</button>
            </div>

            <div class="hr-detail-content" id="hr-detail-content">
                ${this.renderDetailBasic(emp)}
            </div>
        </div>
        <div class="hr-modal-overlay" id="hr-modal-overlay" style="display:none;"></div>`;

        this.bindDetailEvents(emp);
    },

    renderDetailBasic(emp) {
        return `
        <div class="hr-detail-section">
            <div class="hr-info-grid">
                <div class="hr-info-item"><label>姓名</label><span>${emp.name}</span></div>
                <div class="hr-info-item"><label>性别</label><span>${emp.gender || '-'}</span></div>
                <div class="hr-info-item"><label>年龄</label><span>${emp.age ? emp.age + '岁' : '-'}</span></div>
                <div class="hr-info-item"><label>手机</label><span>${emp.phone || '-'}</span></div>
                <div class="hr-info-item"><label>邮箱</label><span>${emp.email || '-'}</span></div>
                <div class="hr-info-item"><label>身份证</label><span>${emp.idCard || '-'}</span></div>
                <div class="hr-info-item"><label>住址</label><span>${emp.address || '-'}</span></div>
                <div class="hr-info-item"><label>紧急联系人</label><span>${emp.emergencyContact || '-'}</span></div>
                <div class="hr-info-item"><label>紧急电话</label><span>${emp.emergencyPhone || '-'}</span></div>
                <div class="hr-info-item"><label>银行卡号</label><span>${emp.bankAccount || '-'}</span></div>
            </div>
        </div>`;
    },

    renderDetailJob(emp) {
        return `
        <div class="hr-detail-section">
            <div class="hr-info-grid">
                <div class="hr-info-item"><label>工号</label><span>${emp.id}</span></div>
                <div class="hr-info-item"><label>部门</label><span>${emp.dept}</span></div>
                <div class="hr-info-item"><label>职位</label><span>${emp.position}</span></div>
                <div class="hr-info-item"><label>职级</label><span>${emp.level || '-'}</span></div>
                <div class="hr-info-item"><label>入职日期</label><span>${emp.joinDate}</span></div>
                <div class="hr-info-item"><label>工龄</label><span>${emp.workYears || 0} 年</span></div>
                <div class="hr-info-item"><label>试用期截止</label><span>${emp.probationEnd || '已过试用期'}</span></div>
                <div class="hr-info-item"><label>状态</label><span>${emp.status}</span></div>
            </div>
        </div>`;
    },

    renderDetailContract(emp) {
        return `
        <div class="hr-detail-section">
            <div class="hr-info-grid">
                <div class="hr-info-item"><label>合同到期</label><span>${emp.contractEnd || '-'}</span></div>
                <div class="hr-info-item"><label>社保</label><span>${emp.socialSecurity || '未缴纳'}</span></div>
                <div class="hr-info-item"><label>公积金</label><span>${emp.housingFund || '未缴纳'}</span></div>
            </div>
        </div>`;
    },

    renderDetailEducation(emp) {
        return `
        <div class="hr-detail-section">
            <div class="hr-info-grid">
                <div class="hr-info-item"><label>学历</label><span>${emp.education || '-'}</span></div>
                <div class="hr-info-item"><label>毕业院校</label><span>${emp.school || '-'}</span></div>
                <div class="hr-info-item"><label>专业</label><span>${emp.major || '-'}</span></div>
            </div>
        </div>`;
    },

    bindDetailEvents(emp) {
        document.querySelectorAll('.hr-detail-tab').forEach(tab => {
            tab.addEventListener('click', () => {
                document.querySelectorAll('.hr-detail-tab').forEach(t => t.classList.remove('active'));
                tab.classList.add('active');
                const content = document.getElementById('hr-detail-content');
                const tabName = tab.dataset.tab;
                if (tabName === 'basic') content.innerHTML = this.renderDetailBasic(emp);
                else if (tabName === 'job') content.innerHTML = this.renderDetailJob(emp);
                else if (tabName === 'contract') content.innerHTML = this.renderDetailContract(emp);
                else if (tabName === 'education') content.innerHTML = this.renderDetailEducation(emp);
            });
        });
    },

    exportData() {
        const headers = ['工号','姓名','性别','年龄','部门','职位','职级','手机','邮箱','入职日期','合同到期','状态'];
        const rows = this.employees.map(e => [e.id, e.name, e.gender, e.age, e.dept, e.position, e.level, e.phone, e.email, e.joinDate, e.contractEnd, e.status]);
        const csv = '\uFEFF' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `员工档案_${new Date().toISOString().slice(0,10)}.csv`;
        link.click();
    },

    bindEvents() {
        const search = document.getElementById('emp-search');
        const deptFilter = document.getElementById('emp-dept-filter');
        const statusFilter = document.getElementById('emp-status-filter');

        if (search) search.addEventListener('input', (e) => {
            this.searchKeyword = e.target.value;
            this.refreshList();
        });
        if (deptFilter) deptFilter.addEventListener('change', (e) => {
            this.filterDept = e.target.value;
            this.refreshList();
        });
        if (statusFilter) statusFilter.addEventListener('change', (e) => {
            this.filterStatus = e.target.value;
            this.refreshList();
        });

        document.querySelectorAll('.hr-view-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                document.querySelectorAll('.hr-view-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                this.currentView = btn.dataset.view;
                this.refreshList();
            });
        });
    },

    refreshList() {
        const content = document.getElementById('hr-emp-content');
        if (content) {
            content.innerHTML = this.currentView === 'list' ? this.renderListView() : this.renderCardView();
        }
    }
};
