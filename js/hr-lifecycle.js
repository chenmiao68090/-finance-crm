// 入转调离管理模块 - 完整CRUD + localStorage持久化

const HrLifecycle = {
    ONBOARD_KEY: 'hr_onboarding',
    REGULAR_KEY: 'hr_regularization',
    TRANSFER_KEY: 'hr_transfers',
    DEPART_KEY: 'hr_departures',
    onboarding: [],
    regularization: [],
    transfers: [],
    departures: [],
    currentTab: 'onboarding',

    defaultOnboarding: [
        { id: 'ON001', name: '何建国', dept: '顾问部', position: '财务顾问', expectedDate: '2025-06-01', source: '招聘', mentor: '张伟', status: '待入职', phone: '15512343003', education: '硕士', checklist: { contract: true, health: true, badge: false, computer: false, account: false } },
        { id: 'ON002', name: '张小丽', dept: '运营部', position: '新媒体运营', expectedDate: '2025-06-15', source: '招聘', mentor: '刘洋', status: '待入职', phone: '15512343005', education: '本科', checklist: { contract: false, health: false, badge: false, computer: false, account: false } },
    ],

    defaultRegularization: [
        { id: 'REG001', empId: 'EMP013', name: '李雪梅', dept: '会计部', position: '会计', joinDate: '2024-12-01', probationEnd: '2025-03-01', applyDate: '2025-02-20', status: '已转正', evaluator: '李娜', score: 88, comment: '工作认真负责，业务能力提升快' },
        { id: 'REG002', empId: 'EMP019', name: '王小丽', dept: '运营部', position: '运营专员', joinDate: '2024-12-01', probationEnd: '2025-03-01', applyDate: '2025-02-25', status: '已转正', evaluator: '刘洋', score: 85, comment: '创意能力强，配合度高' },
    ],

    defaultTransfers: [
        { id: 'TR001', empId: 'EMP003', name: '周芳', fromDept: '顾问部', toDept: '顾问部', fromPosition: '顾问', toPosition: '组长', effectiveDate: '2024-06-01', type: '晋升', reason: '能力突出，带队能力强', approver: '张伟', status: '已生效' },
        { id: 'TR002', empId: 'EMP015', name: '吴刚', fromDept: '工商部', toDept: '人事行政部', fromPosition: '外勤', toPosition: '行政后勤专员', effectiveDate: '2024-08-01', type: '调岗', reason: '个人发展意愿+部门需求', approver: '陈浩', status: '已生效' },
        { id: 'TR003', empId: 'EMP005', name: '孙丽', fromDept: '会计部', toDept: '会计部', fromPosition: '会计', toPosition: '代账组长', effectiveDate: '2024-01-01', type: '晋升', reason: '业务精通，管理能力强', approver: '李娜', status: '已生效' },
    ],

    defaultDepartures: [
        { id: 'DEP001', name: '钱峰', dept: '工商部', position: '外勤专员', joinDate: '2021-03-01', applyDate: '2025-02-01', departDate: '2025-02-28', type: '主动离职', reason: '个人发展', handover: '郑明', status: '已完成', checklist: { workHandover: true, assetReturn: true, accountCancel: true, salarySettle: true, certificate: true } },
        { id: 'DEP002', name: '孙红梅', dept: '顾问部', position: '顾问', joinDate: '2022-06-01', applyDate: '2024-12-20', departDate: '2025-01-15', type: '主动离职', reason: '家庭原因回老家', handover: '周芳', status: '已完成', checklist: { workHandover: true, assetReturn: true, accountCancel: true, salarySettle: true, certificate: true } },
        { id: 'DEP003', name: '李伟', dept: '运营部', position: '运营实习', joinDate: '2024-09-01', applyDate: '2024-12-15', departDate: '2024-12-31', type: '合同到期', reason: '实习期满未续约', handover: '谢欣', status: '已完成', checklist: { workHandover: true, assetReturn: true, accountCancel: true, salarySettle: true, certificate: true } },
    ],

    checklistLabels: {
        contract: '劳动合同签订',
        health: '入职体检',
        badge: '工牌制作',
        computer: '电脑配置',
        account: '账号开通',
    },

    departChecklistLabels: {
        workHandover: '工作交接',
        assetReturn: '资产归还',
        accountCancel: '账号注销',
        salarySettle: '薪资结算',
        certificate: '离职证明',
    },

    loadData() {
        const onData = localStorage.getItem(this.ONBOARD_KEY);
        this.onboarding = onData ? JSON.parse(onData) : JSON.parse(JSON.stringify(this.defaultOnboarding));
        const regData = localStorage.getItem(this.REGULAR_KEY);
        this.regularization = regData ? JSON.parse(regData) : JSON.parse(JSON.stringify(this.defaultRegularization));
        const trData = localStorage.getItem(this.TRANSFER_KEY);
        this.transfers = trData ? JSON.parse(trData) : JSON.parse(JSON.stringify(this.defaultTransfers));
        const depData = localStorage.getItem(this.DEPART_KEY);
        this.departures = depData ? JSON.parse(depData) : JSON.parse(JSON.stringify(this.defaultDepartures));
        if (!onData) this.saveOnboarding();
        if (!regData) this.saveRegularization();
        if (!trData) this.saveTransfers();
        if (!depData) this.saveDepartures();
    },

    saveOnboarding() { localStorage.setItem(this.ONBOARD_KEY, JSON.stringify(this.onboarding)); },
    saveRegularization() { localStorage.setItem(this.REGULAR_KEY, JSON.stringify(this.regularization)); },
    saveTransfers() { localStorage.setItem(this.TRANSFER_KEY, JSON.stringify(this.transfers)); },
    saveDepartures() { localStorage.setItem(this.DEPART_KEY, JSON.stringify(this.departures)); },

    generateId(prefix) {
        return prefix + Date.now().toString(36) + Math.random().toString(36).substr(2, 4);
    },

    init() {
        this.loadData();
        const contentArea = document.querySelector('.content-area');
        contentArea.innerHTML = this.render();
        this.bindEvents();
    },

    destroy() {},

    render() {
        const pendingOnboard = this.onboarding.filter(o => o.status === '待入职').length;
        const pendingRegular = this.regularization.filter(r => r.status === '待转正').length;

        return `
        <div class="hr-lifecycle-page">
            <div class="hr-module-header">
                <div class="hr-module-title">
                    <h2>入转调离</h2>
                    <p class="hr-module-desc">员工全生命周期管理：入职、转正、调岗、离职</p>
                </div>
                <div class="hr-header-actions">
                    <button class="btn-hr-primary" id="btn-lifecycle-add">新增记录</button>
                </div>
            </div>

            <div class="hr-stats-row">
                <div class="hr-stat-card">
                    <div class="hr-stat-icon" style="background:#d1fae5;color:#059669;">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M16 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="8.5" cy="7" r="4"/><line x1="20" y1="8" x2="20" y2="14"/><line x1="23" y1="11" x2="17" y2="11"/></svg>
                    </div>
                    <div class="hr-stat-info">
                        <span class="hr-stat-num">${this.onboarding.length}</span>
                        <span class="hr-stat-label">入职记录</span>
                    </div>
                </div>
                <div class="hr-stat-card">
                    <div class="hr-stat-icon" style="background:#dbeafe;color:#2563eb;">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 11.08V12a10 10 0 11-5.93-9.14"/><polyline points="22,4 12,14.01 9,11.01"/></svg>
                    </div>
                    <div class="hr-stat-info">
                        <span class="hr-stat-num">${this.regularization.length}</span>
                        <span class="hr-stat-label">转正记录</span>
                    </div>
                </div>
                <div class="hr-stat-card">
                    <div class="hr-stat-icon" style="background:#fef3c7;color:#d97706;">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="17,1 21,5 17,9"/><path d="M3 11V9a4 4 0 014-4h14"/><polyline points="7,23 3,19 7,15"/><path d="M21 13v2a4 4 0 01-4 4H3"/></svg>
                    </div>
                    <div class="hr-stat-info">
                        <span class="hr-stat-num">${this.transfers.length}</span>
                        <span class="hr-stat-label">调岗/晋升</span>
                    </div>
                </div>
                <div class="hr-stat-card">
                    <div class="hr-stat-icon" style="background:#fee2e2;color:#dc2626;">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M16 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="8.5" cy="7" r="4"/><line x1="18" y1="8" x2="23" y2="13"/><line x1="23" y1="8" x2="18" y2="13"/></svg>
                    </div>
                    <div class="hr-stat-info">
                        <span class="hr-stat-num">${this.departures.length}</span>
                        <span class="hr-stat-label">离职记录</span>
                    </div>
                </div>
            </div>

            <div class="hr-org-tabs">
                <button class="hr-org-tab ${this.currentTab === 'onboarding' ? 'active' : ''}" data-tab="onboarding">入职管理</button>
                <button class="hr-org-tab ${this.currentTab === 'regularization' ? 'active' : ''}" data-tab="regularization">转正管理</button>
                <button class="hr-org-tab ${this.currentTab === 'transfer' ? 'active' : ''}" data-tab="transfer">调岗/晋升</button>
                <button class="hr-org-tab ${this.currentTab === 'departure' ? 'active' : ''}" data-tab="departure">离职管理</button>
            </div>

            <div class="hr-content-area" id="hr-lifecycle-content">
                ${this.renderTabContent()}
            </div>
        </div>`;
    },

    renderTabContent() {
        switch(this.currentTab) {
            case 'onboarding': return this.renderOnboarding();
            case 'regularization': return this.renderRegularization();
            case 'transfer': return this.renderTransfer();
            case 'departure': return this.renderDeparture();
            default: return this.renderOnboarding();
        }
    },

    renderOnboarding() {
        return `
        <div class="lifecycle-section">
            ${this.onboarding.map(item => `
            <div class="lifecycle-card onboarding-card">
                <div class="lifecycle-card-header">
                    <div class="lifecycle-avatar">${item.name.charAt(0)}</div>
                    <div class="lifecycle-info">
                        <h4>${item.name}</h4>
                        <p>${item.dept} · ${item.position}</p>
                    </div>
                    <span class="lifecycle-status ${item.status === '待入职' ? 'pending' : item.status === '已入职' ? 'completed' : 'cancelled'}">${item.status}</span>
                </div>
                <div class="lifecycle-card-body">
                    <div class="lifecycle-row"><span>预计入职</span><strong>${item.expectedDate}</strong></div>
                    <div class="lifecycle-row"><span>学历</span><span>${item.education || '-'}</span></div>
                    <div class="lifecycle-row"><span>手机号</span><span>${item.phone || '-'}</span></div>
                    <div class="lifecycle-row"><span>招聘来源</span><span>${item.source}</span></div>
                    <div class="lifecycle-row"><span>入职导师</span><span>${item.mentor}</span></div>
                </div>
                <div class="lifecycle-checklist">
                    <h5>入职清单</h5>
                    <div class="checklist-items">
                        ${Object.entries(this.checklistLabels).map(([key, label]) => `
                        <label class="checklist-item">
                            <input type="checkbox" ${item.checklist[key] ? 'checked' : ''} data-id="${item.id}" data-key="${key}" class="onboard-check">
                            <span>${label}</span>
                        </label>
                        `).join('')}
                    </div>
                </div>
                <div class="lifecycle-card-actions">
                    ${item.status === '待入职' ? `<button class="btn-hr-primary btn-sm" data-action="confirm-onboard" data-id="${item.id}">确认入职</button>` : ''}
                    <button class="hr-action-btn" data-action="edit-onboard" data-id="${item.id}">编辑</button>
                    <button class="hr-action-btn danger" data-action="delete-onboard" data-id="${item.id}">删除</button>
                </div>
            </div>
            `).join('')}
            ${this.onboarding.length === 0 ? '<div class="hr-empty" style="text-align:center;padding:40px;color:#9ca3af;">暂无入职记录</div>' : ''}
        </div>`;
    },

    renderRegularization() {
        return `
        <div class="hr-table-wrapper">
            <table class="hr-table">
                <thead>
                    <tr>
                        <th>姓名</th>
                        <th>部门</th>
                        <th>职位</th>
                        <th>入职日期</th>
                        <th>试用期截止</th>
                        <th>申请日期</th>
                        <th>评分</th>
                        <th>评估人</th>
                        <th>评语</th>
                        <th>状态</th>
                        <th>操作</th>
                    </tr>
                </thead>
                <tbody>
                    ${this.regularization.map(item => `
                    <tr>
                        <td><strong>${item.name}</strong></td>
                        <td>${item.dept}</td>
                        <td>${item.position}</td>
                        <td>${item.joinDate}</td>
                        <td>${item.probationEnd}</td>
                        <td>${item.applyDate}</td>
                        <td><span class="score-badge ${item.score >= 85 ? 'good' : item.score >= 70 ? 'normal' : 'bad'}">${item.score}分</span></td>
                        <td>${item.evaluator}</td>
                        <td class="notes-cell">${item.comment}</td>
                        <td><span class="lifecycle-status ${item.status === '已转正' ? 'completed' : 'pending'}">${item.status}</span></td>
                        <td class="action-cell">
                            ${item.status === '待转正' ? `<button class="hr-action-btn" data-action="approve-regular" data-id="${item.id}">通过</button>` : ''}
                            <button class="hr-action-btn danger" data-action="delete-regular" data-id="${item.id}">删除</button>
                        </td>
                    </tr>
                    `).join('')}
                </tbody>
            </table>
            <div class="hr-table-footer">共 ${this.regularization.length} 条转正记录</div>
        </div>`;
    },

    renderTransfer() {
        return `
        <div class="hr-table-wrapper">
            <table class="hr-table">
                <thead>
                    <tr>
                        <th>姓名</th>
                        <th>类型</th>
                        <th>原部门/职位</th>
                        <th>新部门/职位</th>
                        <th>生效日期</th>
                        <th>原因</th>
                        <th>审批人</th>
                        <th>状态</th>
                        <th>操作</th>
                    </tr>
                </thead>
                <tbody>
                    ${this.transfers.map(item => `
                    <tr>
                        <td><strong>${item.name}</strong></td>
                        <td><span class="transfer-type ${item.type === '晋升' ? 'promote' : 'transfer'}">${item.type}</span></td>
                        <td>${item.fromDept} / ${item.fromPosition}</td>
                        <td>${item.toDept} / ${item.toPosition}</td>
                        <td>${item.effectiveDate}</td>
                        <td class="notes-cell">${item.reason}</td>
                        <td>${item.approver}</td>
                        <td><span class="lifecycle-status ${item.status === '已生效' ? 'completed' : 'pending'}">${item.status}</span></td>
                        <td class="action-cell">
                            <button class="hr-action-btn danger" data-action="delete-transfer" data-id="${item.id}">删除</button>
                        </td>
                    </tr>
                    `).join('')}
                </tbody>
            </table>
            <div class="hr-table-footer">共 ${this.transfers.length} 条调岗/晋升记录</div>
        </div>`;
    },

    renderDeparture() {
        return `
        <div class="hr-table-wrapper">
            <table class="hr-table">
                <thead>
                    <tr>
                        <th>姓名</th>
                        <th>部门</th>
                        <th>职位</th>
                        <th>入职日期</th>
                        <th>离职日期</th>
                        <th>离职类型</th>
                        <th>原因</th>
                        <th>交接人</th>
                        <th>离职清单</th>
                        <th>状态</th>
                        <th>操作</th>
                    </tr>
                </thead>
                <tbody>
                    ${this.departures.map(item => {
                        const cl = item.checklist || {};
                        const total = Object.keys(this.departChecklistLabels).length;
                        const done = Object.values(cl).filter(v => v).length;
                        return `
                    <tr>
                        <td><strong>${item.name}</strong></td>
                        <td>${item.dept}</td>
                        <td>${item.position}</td>
                        <td>${item.joinDate}</td>
                        <td>${item.departDate}</td>
                        <td><span class="departure-type">${item.type}</span></td>
                        <td class="notes-cell">${item.reason}</td>
                        <td>${item.handover}</td>
                        <td><span class="${done === total ? 'text-green' : 'text-orange'}">${done}/${total}</span></td>
                        <td><span class="lifecycle-status ${item.status === '已完成' ? 'completed' : 'pending'}">${item.status}</span></td>
                        <td class="action-cell">
                            ${item.status !== '已完成' ? `<button class="hr-action-btn" data-action="edit-depart-checklist" data-id="${item.id}">办理</button>` : ''}
                            <button class="hr-action-btn danger" data-action="delete-departure" data-id="${item.id}">删除</button>
                        </td>
                    </tr>`;
                    }).join('')}
                </tbody>
            </table>
            <div class="hr-table-footer">共 ${this.departures.length} 条离职记录</div>
        </div>`;
    },

    // ====== Modals ======

    showOnboardModal(editId) {
        const item = editId ? this.onboarding.find(o => o.id === editId) : null;
        const title = item ? '编辑入职信息' : '新增入职';
        const deptSaved = localStorage.getItem('hr_departments');
        const depts = deptSaved ? JSON.parse(deptSaved).filter(d => d.status === 'active').map(d => d.name) : ['顾问部', '会计部', '工商部', '运营部', '人事行政部', '刻章部', '财务部', '技术部'];

        const html = `
        <div class="hr-modal-overlay" id="lifecycle-modal">
            <div class="hr-modal" style="max-width:550px;">
                <div class="hr-modal-header">
                    <h3>${title}</h3>
                    <button class="hr-modal-close" id="close-lc-modal">&times;</button>
                </div>
                <div class="hr-modal-body">
                    <form id="onboard-form">
                        <div class="hr-form-section">
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
                                    <label>职位 <span class="required">*</span></label>
                                    <input type="text" name="position" value="${item ? item.position : ''}" required>
                                </div>
                                <div class="hr-form-item">
                                    <label>预计入职日期 <span class="required">*</span></label>
                                    <input type="date" name="expectedDate" value="${item ? item.expectedDate : ''}" required>
                                </div>
                                <div class="hr-form-item">
                                    <label>手机号</label>
                                    <input type="tel" name="phone" value="${item ? item.phone || '' : ''}">
                                </div>
                                <div class="hr-form-item">
                                    <label>学历</label>
                                    <select name="education">
                                        ${['高中', '大专', '本科', '硕士', '博士'].map(e => `<option value="${e}" ${item && item.education === e ? 'selected' : ''}>${e}</option>`).join('')}
                                    </select>
                                </div>
                                <div class="hr-form-item">
                                    <label>招聘来源</label>
                                    <select name="source">
                                        ${['招聘', '内推', '猎头', '社招', '校招'].map(s => `<option value="${s}" ${item && item.source === s ? 'selected' : ''}>${s}</option>`).join('')}
                                    </select>
                                </div>
                                <div class="hr-form-item">
                                    <label>入职导师</label>
                                    <input type="text" name="mentor" value="${item ? item.mentor : ''}">
                                </div>
                            </div>
                        </div>
                        <div class="hr-form-actions">
                            <button type="button" class="btn-hr-secondary" id="cancel-onboard-form">取消</button>
                            <button type="submit" class="btn-hr-primary">${item ? '保存修改' : '确认添加'}</button>
                        </div>
                    </form>
                </div>
            </div>
        </div>`;

        document.body.insertAdjacentHTML('beforeend', html);
        document.getElementById('close-lc-modal').onclick = () => this.closeModal();
        document.getElementById('cancel-onboard-form').onclick = () => this.closeModal();
        document.getElementById('onboard-form').onsubmit = (e) => { e.preventDefault(); this.saveOnboardItem(editId); };
    },

    saveOnboardItem(editId) {
        const form = document.getElementById('onboard-form');
        if (!form.checkValidity()) { form.reportValidity(); return; }
        const fd = new FormData(form);
        const data = {
            name: fd.get('name'),
            dept: fd.get('dept'),
            position: fd.get('position'),
            expectedDate: fd.get('expectedDate'),
            phone: fd.get('phone'),
            education: fd.get('education'),
            source: fd.get('source'),
            mentor: fd.get('mentor'),
        };
        if (editId) {
            const idx = this.onboarding.findIndex(o => o.id === editId);
            if (idx >= 0) this.onboarding[idx] = { ...this.onboarding[idx], ...data };
        } else {
            data.id = this.generateId('ON');
            data.status = '待入职';
            data.checklist = { contract: false, health: false, badge: false, computer: false, account: false };
            this.onboarding.unshift(data);
        }
        this.saveOnboarding();
        this.closeModal();
        this.refresh();
    },

    confirmOnboard(id) {
        const item = this.onboarding.find(o => o.id === id);
        if (!item) return;
        const allDone = Object.values(item.checklist).every(v => v);
        if (!allDone) {
            if (!confirm('入职清单尚未全部完成，确认入职？')) return;
        }
        item.status = '已入职';
        this.saveOnboarding();
        this.refresh();
    },

    deleteOnboard(id) {
        if (!confirm('确定删除该入职记录？')) return;
        this.onboarding = this.onboarding.filter(o => o.id !== id);
        this.saveOnboarding();
        this.refresh();
    },

    showRegularModal() {
        const deptSaved = localStorage.getItem('hr_departments');
        const depts = deptSaved ? JSON.parse(deptSaved).filter(d => d.status === 'active').map(d => d.name) : ['顾问部', '会计部', '工商部', '运营部', '人事行政部', '刻章部', '财务部', '技术部'];
        const html = `
        <div class="hr-modal-overlay" id="lifecycle-modal">
            <div class="hr-modal" style="max-width:550px;">
                <div class="hr-modal-header">
                    <h3>转正申请</h3>
                    <button class="hr-modal-close" id="close-lc-modal">&times;</button>
                </div>
                <div class="hr-modal-body">
                    <form id="regular-form">
                        <div class="hr-form-section">
                            <div class="hr-form-grid">
                                <div class="hr-form-item">
                                    <label>员工姓名 <span class="required">*</span></label>
                                    <input type="text" name="name" required>
                                </div>
                                <div class="hr-form-item">
                                    <label>部门 <span class="required">*</span></label>
                                    <select name="dept" required>
                                        <option value="">请选择</option>
                                        ${depts.map(d => `<option value="${d}">${d}</option>`).join('')}
                                    </select>
                                </div>
                                <div class="hr-form-item">
                                    <label>职位 <span class="required">*</span></label>
                                    <input type="text" name="position" required>
                                </div>
                                <div class="hr-form-item">
                                    <label>入职日期 <span class="required">*</span></label>
                                    <input type="date" name="joinDate" required>
                                </div>
                                <div class="hr-form-item">
                                    <label>试用期截止 <span class="required">*</span></label>
                                    <input type="date" name="probationEnd" required>
                                </div>
                                <div class="hr-form-item">
                                    <label>评估分数(0-100)</label>
                                    <input type="number" name="score" min="0" max="100" value="80">
                                </div>
                                <div class="hr-form-item">
                                    <label>评估人</label>
                                    <input type="text" name="evaluator">
                                </div>
                                <div class="hr-form-item">
                                    <label>申请日期</label>
                                    <input type="date" name="applyDate" value="${new Date().toISOString().split('T')[0]}">
                                </div>
                            </div>
                            <div class="hr-form-item" style="grid-column:1/-1;">
                                <label>评语</label>
                                <textarea name="comment" rows="3" placeholder="对试用期表现的评价"></textarea>
                            </div>
                        </div>
                        <div class="hr-form-actions">
                            <button type="button" class="btn-hr-secondary" id="cancel-regular-form">取消</button>
                            <button type="submit" class="btn-hr-primary">提交转正申请</button>
                        </div>
                    </form>
                </div>
            </div>
        </div>`;

        document.body.insertAdjacentHTML('beforeend', html);
        document.getElementById('close-lc-modal').onclick = () => this.closeModal();
        document.getElementById('cancel-regular-form').onclick = () => this.closeModal();
        document.getElementById('regular-form').onsubmit = (e) => { e.preventDefault(); this.saveRegularItem(); };
    },

    saveRegularItem() {
        const form = document.getElementById('regular-form');
        if (!form.checkValidity()) { form.reportValidity(); return; }
        const fd = new FormData(form);
        const data = {
            id: this.generateId('REG'),
            empId: '',
            name: fd.get('name'),
            dept: fd.get('dept'),
            position: fd.get('position'),
            joinDate: fd.get('joinDate'),
            probationEnd: fd.get('probationEnd'),
            applyDate: fd.get('applyDate'),
            score: parseInt(fd.get('score')) || 0,
            evaluator: fd.get('evaluator'),
            comment: fd.get('comment'),
            status: '待转正',
        };
        this.regularization.unshift(data);
        this.saveRegularization();
        this.closeModal();
        this.refresh();
    },

    approveRegular(id) {
        const item = this.regularization.find(r => r.id === id);
        if (item && confirm(`确认 ${item.name} 转正？`)) {
            item.status = '已转正';
            this.saveRegularization();
            this.refresh();
        }
    },

    deleteRegular(id) {
        if (!confirm('确定删除该转正记录？')) return;
        this.regularization = this.regularization.filter(r => r.id !== id);
        this.saveRegularization();
        this.refresh();
    },

    showTransferModal() {
        const deptSaved = localStorage.getItem('hr_departments');
        const depts = deptSaved ? JSON.parse(deptSaved).filter(d => d.status === 'active').map(d => d.name) : ['顾问部', '会计部', '工商部', '运营部', '人事行政部', '刻章部', '财务部', '技术部'];
        const html = `
        <div class="hr-modal-overlay" id="lifecycle-modal">
            <div class="hr-modal" style="max-width:600px;">
                <div class="hr-modal-header">
                    <h3>调岗/晋升申请</h3>
                    <button class="hr-modal-close" id="close-lc-modal">&times;</button>
                </div>
                <div class="hr-modal-body">
                    <form id="transfer-form">
                        <div class="hr-form-section">
                            <div class="hr-form-grid">
                                <div class="hr-form-item">
                                    <label>员工姓名 <span class="required">*</span></label>
                                    <input type="text" name="name" required>
                                </div>
                                <div class="hr-form-item">
                                    <label>变动类型 <span class="required">*</span></label>
                                    <select name="type" required>
                                        <option value="调岗">调岗</option>
                                        <option value="晋升">晋升</option>
                                        <option value="降级">降级</option>
                                    </select>
                                </div>
                                <div class="hr-form-item">
                                    <label>原部门 <span class="required">*</span></label>
                                    <select name="fromDept" required>
                                        ${depts.map(d => `<option value="${d}">${d}</option>`).join('')}
                                    </select>
                                </div>
                                <div class="hr-form-item">
                                    <label>原职位 <span class="required">*</span></label>
                                    <input type="text" name="fromPosition" required>
                                </div>
                                <div class="hr-form-item">
                                    <label>新部门 <span class="required">*</span></label>
                                    <select name="toDept" required>
                                        ${depts.map(d => `<option value="${d}">${d}</option>`).join('')}
                                    </select>
                                </div>
                                <div class="hr-form-item">
                                    <label>新职位 <span class="required">*</span></label>
                                    <input type="text" name="toPosition" required>
                                </div>
                                <div class="hr-form-item">
                                    <label>生效日期 <span class="required">*</span></label>
                                    <input type="date" name="effectiveDate" value="${new Date().toISOString().split('T')[0]}" required>
                                </div>
                                <div class="hr-form-item">
                                    <label>审批人</label>
                                    <input type="text" name="approver">
                                </div>
                            </div>
                            <div class="hr-form-item" style="grid-column:1/-1;">
                                <label>变动原因 <span class="required">*</span></label>
                                <textarea name="reason" rows="3" required></textarea>
                            </div>
                        </div>
                        <div class="hr-form-actions">
                            <button type="button" class="btn-hr-secondary" id="cancel-transfer-form">取消</button>
                            <button type="submit" class="btn-hr-primary">提交申请</button>
                        </div>
                    </form>
                </div>
            </div>
        </div>`;

        document.body.insertAdjacentHTML('beforeend', html);
        document.getElementById('close-lc-modal').onclick = () => this.closeModal();
        document.getElementById('cancel-transfer-form').onclick = () => this.closeModal();
        document.getElementById('transfer-form').onsubmit = (e) => { e.preventDefault(); this.saveTransferItem(); };
    },

    saveTransferItem() {
        const form = document.getElementById('transfer-form');
        if (!form.checkValidity()) { form.reportValidity(); return; }
        const fd = new FormData(form);
        const data = {
            id: this.generateId('TR'),
            empId: '',
            name: fd.get('name'),
            type: fd.get('type'),
            fromDept: fd.get('fromDept'),
            fromPosition: fd.get('fromPosition'),
            toDept: fd.get('toDept'),
            toPosition: fd.get('toPosition'),
            effectiveDate: fd.get('effectiveDate'),
            reason: fd.get('reason'),
            approver: fd.get('approver') || '待审批',
            status: '已生效',
        };
        this.transfers.unshift(data);
        this.saveTransfers();
        this.closeModal();
        this.refresh();
    },

    deleteTransfer(id) {
        if (!confirm('确定删除该调岗记录？')) return;
        this.transfers = this.transfers.filter(t => t.id !== id);
        this.saveTransfers();
        this.refresh();
    },

    showDepartureModal() {
        const deptSaved = localStorage.getItem('hr_departments');
        const depts = deptSaved ? JSON.parse(deptSaved).filter(d => d.status === 'active').map(d => d.name) : ['顾问部', '会计部', '工商部', '运营部', '人事行政部', '刻章部', '财务部', '技术部'];
        const html = `
        <div class="hr-modal-overlay" id="lifecycle-modal">
            <div class="hr-modal" style="max-width:550px;">
                <div class="hr-modal-header">
                    <h3>离职申请</h3>
                    <button class="hr-modal-close" id="close-lc-modal">&times;</button>
                </div>
                <div class="hr-modal-body">
                    <form id="departure-form">
                        <div class="hr-form-section">
                            <div class="hr-form-grid">
                                <div class="hr-form-item">
                                    <label>员工姓名 <span class="required">*</span></label>
                                    <input type="text" name="name" required>
                                </div>
                                <div class="hr-form-item">
                                    <label>部门 <span class="required">*</span></label>
                                    <select name="dept" required>
                                        <option value="">请选择</option>
                                        ${depts.map(d => `<option value="${d}">${d}</option>`).join('')}
                                    </select>
                                </div>
                                <div class="hr-form-item">
                                    <label>职位</label>
                                    <input type="text" name="position">
                                </div>
                                <div class="hr-form-item">
                                    <label>离职类型 <span class="required">*</span></label>
                                    <select name="type" required>
                                        <option value="主动离职">主动离职</option>
                                        <option value="合同到期">合同到期</option>
                                        <option value="辞退">辞退</option>
                                        <option value="协商解除">协商解除</option>
                                    </select>
                                </div>
                                <div class="hr-form-item">
                                    <label>入职日期</label>
                                    <input type="date" name="joinDate">
                                </div>
                                <div class="hr-form-item">
                                    <label>预计离职日期 <span class="required">*</span></label>
                                    <input type="date" name="departDate" required>
                                </div>
                                <div class="hr-form-item">
                                    <label>交接人</label>
                                    <input type="text" name="handover">
                                </div>
                                <div class="hr-form-item">
                                    <label>申请日期</label>
                                    <input type="date" name="applyDate" value="${new Date().toISOString().split('T')[0]}">
                                </div>
                            </div>
                            <div class="hr-form-item" style="grid-column:1/-1;">
                                <label>离职原因 <span class="required">*</span></label>
                                <textarea name="reason" rows="3" required></textarea>
                            </div>
                        </div>
                        <div class="hr-form-actions">
                            <button type="button" class="btn-hr-secondary" id="cancel-departure-form">取消</button>
                            <button type="submit" class="btn-hr-primary">提交离职申请</button>
                        </div>
                    </form>
                </div>
            </div>
        </div>`;

        document.body.insertAdjacentHTML('beforeend', html);
        document.getElementById('close-lc-modal').onclick = () => this.closeModal();
        document.getElementById('cancel-departure-form').onclick = () => this.closeModal();
        document.getElementById('departure-form').onsubmit = (e) => { e.preventDefault(); this.saveDepartureItem(); };
    },

    saveDepartureItem() {
        const form = document.getElementById('departure-form');
        if (!form.checkValidity()) { form.reportValidity(); return; }
        const fd = new FormData(form);
        const data = {
            id: this.generateId('DEP'),
            name: fd.get('name'),
            dept: fd.get('dept'),
            position: fd.get('position'),
            type: fd.get('type'),
            joinDate: fd.get('joinDate'),
            departDate: fd.get('departDate'),
            handover: fd.get('handover') || '待指定',
            applyDate: fd.get('applyDate'),
            reason: fd.get('reason'),
            status: '办理中',
            checklist: { workHandover: false, assetReturn: false, accountCancel: false, salarySettle: false, certificate: false },
        };
        this.departures.unshift(data);
        this.saveDepartures();
        this.closeModal();
        this.refresh();
    },

    showDepartChecklist(id) {
        const item = this.departures.find(d => d.id === id);
        if (!item) return;
        const cl = item.checklist || {};

        const html = `
        <div class="hr-modal-overlay" id="lifecycle-modal">
            <div class="hr-modal" style="max-width:450px;">
                <div class="hr-modal-header">
                    <h3>${item.name} - 离职办理</h3>
                    <button class="hr-modal-close" id="close-lc-modal">&times;</button>
                </div>
                <div class="hr-modal-body">
                    <div class="lifecycle-checklist" style="padding:0;">
                        <div class="checklist-items">
                            ${Object.entries(this.departChecklistLabels).map(([key, label]) => `
                            <label class="checklist-item" style="padding:10px 0;border-bottom:1px solid var(--border-color);">
                                <input type="checkbox" ${cl[key] ? 'checked' : ''} data-key="${key}" class="depart-check">
                                <span style="font-size:14px;">${label}</span>
                            </label>
                            `).join('')}
                        </div>
                    </div>
                    <div class="hr-form-actions" style="margin-top:20px;">
                        <button type="button" class="btn-hr-secondary" id="cancel-depart-cl">关闭</button>
                        <button type="button" class="btn-hr-primary" id="save-depart-cl">保存并完成</button>
                    </div>
                </div>
            </div>
        </div>`;

        document.body.insertAdjacentHTML('beforeend', html);
        document.getElementById('close-lc-modal').onclick = () => this.closeModal();
        document.getElementById('cancel-depart-cl').onclick = () => this.closeModal();
        document.getElementById('save-depart-cl').onclick = () => {
            const checks = document.querySelectorAll('.depart-check');
            checks.forEach(ch => { item.checklist[ch.dataset.key] = ch.checked; });
            const allDone = Object.values(item.checklist).every(v => v);
            if (allDone) item.status = '已完成';
            this.saveDepartures();
            this.closeModal();
            this.refresh();
        };
    },

    deleteDeparture(id) {
        if (!confirm('确定删除该离职记录？')) return;
        this.departures = this.departures.filter(d => d.id !== id);
        this.saveDepartures();
        this.refresh();
    },

    closeModal() {
        const modal = document.getElementById('lifecycle-modal');
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

        // Main add button - context-sensitive
        const btnAdd = document.getElementById('btn-lifecycle-add');
        if (btnAdd) {
            btnAdd.onclick = () => {
                switch(this.currentTab) {
                    case 'onboarding': this.showOnboardModal(); break;
                    case 'regularization': this.showRegularModal(); break;
                    case 'transfer': this.showTransferModal(); break;
                    case 'departure': this.showDepartureModal(); break;
                }
            };
        }

        // Onboarding checklist checkboxes
        document.querySelectorAll('.onboard-check').forEach(ch => {
            ch.onchange = () => {
                const item = this.onboarding.find(o => o.id === ch.dataset.id);
                if (item) {
                    item.checklist[ch.dataset.key] = ch.checked;
                    this.saveOnboarding();
                }
            };
        });

        this.bindContentEvents();
    },

    bindContentEvents() {
        document.querySelectorAll('[data-action]').forEach(btn => {
            btn.onclick = () => {
                const action = btn.dataset.action;
                const id = btn.dataset.id;
                switch(action) {
                    case 'confirm-onboard': this.confirmOnboard(id); break;
                    case 'edit-onboard': this.showOnboardModal(id); break;
                    case 'delete-onboard': this.deleteOnboard(id); break;
                    case 'approve-regular': this.approveRegular(id); break;
                    case 'delete-regular': this.deleteRegular(id); break;
                    case 'delete-transfer': this.deleteTransfer(id); break;
                    case 'edit-depart-checklist': this.showDepartChecklist(id); break;
                    case 'delete-departure': this.deleteDeparture(id); break;
                }
            };
        });
    }
};
