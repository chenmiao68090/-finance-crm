// 考勤管理模块 - 完整CRUD + localStorage持久化

const HrAttendance = {
    ATTENDANCE_KEY: 'hr_attendance',
    LEAVE_KEY: 'hr_leaves',
    RULES_KEY: 'hr_attendance_rules',
    records: [],
    leaves: [],
    rules: {},
    currentTab: 'daily',
    selectedDate: '',

    defaultRules: {
        workStart: '09:00',
        workEnd: '18:00',
        lateThreshold: 10,
        earlyThreshold: 10,
        lunchStart: '12:00',
        lunchEnd: '13:30',
        overtimeStart: '19:00',
        workDays: [1, 2, 3, 4, 5],
        leaveTypes: ['事假', '病假', '年假', '婚假', '产假', '陪产假', '丧假', '调休']
    },

    defaultRecords: [
        { id: 'ATT001', empId: 'EMP002', name: '张伟', dept: '顾问部', date: '2025-05-16', clockIn: '08:55', clockOut: '18:30', status: '正常', remark: '' },
        { id: 'ATT002', empId: 'EMP003', name: '周芳', dept: '顾问部', date: '2025-05-16', clockIn: '09:12', clockOut: '18:05', status: '迟到', remark: '' },
        { id: 'ATT003', empId: 'EMP004', name: '李娜', dept: '会计部', date: '2025-05-16', clockIn: '08:48', clockOut: '19:00', status: '正常', remark: '加班' },
        { id: 'ATT004', empId: 'EMP005', name: '孙丽', dept: '会计部', date: '2025-05-16', clockIn: '09:01', clockOut: '18:10', status: '正常', remark: '' },
        { id: 'ATT005', empId: 'EMP006', name: '马晓', dept: '会计部', date: '2025-05-16', clockIn: '08:50', clockOut: '18:00', status: '正常', remark: '' },
        { id: 'ATT006', empId: 'EMP007', name: '王强', dept: '工商部', date: '2025-05-16', clockIn: '', clockOut: '', status: '外勤', remark: '工商局办事' },
        { id: 'ATT007', empId: 'EMP008', name: '赵敏', dept: '刻章部', date: '2025-05-16', clockIn: '08:58', clockOut: '18:02', status: '正常', remark: '' },
        { id: 'ATT008', empId: 'EMP009', name: '陈浩', dept: '人事行政部', date: '2025-05-16', clockIn: '08:45', clockOut: '18:30', status: '正常', remark: '' },
        { id: 'ATT009', empId: 'EMP010', name: '黄婷', dept: '人事行政部', date: '2025-05-16', clockIn: '09:05', clockOut: '18:00', status: '正常', remark: '' },
        { id: 'ATT010', empId: 'EMP011', name: '刘洋', dept: '运营部', date: '2025-05-16', clockIn: '09:20', clockOut: '20:00', status: '迟到', remark: '' },
        { id: 'ATT011', empId: 'EMP012', name: '杨梅', dept: '财务部', date: '2025-05-16', clockIn: '08:40', clockOut: '17:50', status: '早退', remark: '' },
        { id: 'ATT012', empId: 'EMP013', name: '李雪梅', dept: '会计部', date: '2025-05-16', clockIn: '08:55', clockOut: '18:05', status: '正常', remark: '' },
        { id: 'ATT013', empId: 'EMP014', name: '谢欣', dept: '运营部', date: '2025-05-16', clockIn: '', clockOut: '', status: '请假', remark: '年假' },
        { id: 'ATT014', empId: 'EMP015', name: '吴刚', dept: '人事行政部', date: '2025-05-16', clockIn: '08:50', clockOut: '18:00', status: '正常', remark: '' },
        { id: 'ATT015', empId: 'EMP002', name: '张伟', dept: '顾问部', date: '2025-05-15', clockIn: '08:50', clockOut: '18:10', status: '正常', remark: '' },
        { id: 'ATT016', empId: 'EMP003', name: '周芳', dept: '顾问部', date: '2025-05-15', clockIn: '08:58', clockOut: '18:00', status: '正常', remark: '' },
        { id: 'ATT017', empId: 'EMP004', name: '李娜', dept: '会计部', date: '2025-05-15', clockIn: '09:15', clockOut: '18:30', status: '迟到', remark: '' },
        { id: 'ATT018', empId: 'EMP005', name: '孙丽', dept: '会计部', date: '2025-05-15', clockIn: '08:55', clockOut: '18:05', status: '正常', remark: '' },
    ],

    defaultLeaves: [
        { id: 'LV001', empId: 'EMP014', name: '谢欣', dept: '运营部', type: '年假', startDate: '2025-05-16', endDate: '2025-05-17', days: 2, reason: '个人旅行', status: '已批准', approver: '刘洋', applyDate: '2025-05-10' },
        { id: 'LV002', empId: 'EMP003', name: '周芳', dept: '顾问部', type: '事假', startDate: '2025-05-20', endDate: '2025-05-20', days: 1, reason: '家中有事', status: '待审批', approver: '张伟', applyDate: '2025-05-15' },
        { id: 'LV003', empId: 'EMP013', name: '李雪梅', dept: '会计部', type: '病假', startDate: '2025-05-12', endDate: '2025-05-13', days: 2, reason: '感冒发烧', status: '已批准', approver: '李娜', applyDate: '2025-05-11' },
        { id: 'LV004', empId: 'EMP010', name: '黄婷', dept: '人事行政部', type: '调休', startDate: '2025-05-22', endDate: '2025-05-22', days: 1, reason: '上周加班调休', status: '待审批', approver: '陈浩', applyDate: '2025-05-16' },
        { id: 'LV005', empId: 'EMP005', name: '孙丽', dept: '会计部', type: '年假', startDate: '2025-05-26', endDate: '2025-05-28', days: 3, reason: '回老家', status: '待审批', approver: '李娜', applyDate: '2025-05-16' },
    ],

    loadData() {
        const attData = localStorage.getItem(this.ATTENDANCE_KEY);
        this.records = attData ? JSON.parse(attData) : JSON.parse(JSON.stringify(this.defaultRecords));
        const lvData = localStorage.getItem(this.LEAVE_KEY);
        this.leaves = lvData ? JSON.parse(lvData) : JSON.parse(JSON.stringify(this.defaultLeaves));
        const rulesData = localStorage.getItem(this.RULES_KEY);
        this.rules = rulesData ? JSON.parse(rulesData) : JSON.parse(JSON.stringify(this.defaultRules));
        if (!attData) this.saveRecords();
        if (!lvData) this.saveLeaves();
        if (!rulesData) this.saveRules();
        if (!this.selectedDate) this.selectedDate = '2025-05-16';
    },

    saveRecords() { localStorage.setItem(this.ATTENDANCE_KEY, JSON.stringify(this.records)); },
    saveLeaves() { localStorage.setItem(this.LEAVE_KEY, JSON.stringify(this.leaves)); },
    saveRules() { localStorage.setItem(this.RULES_KEY, JSON.stringify(this.rules)); },

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
        const dayRecords = this.records.filter(r => r.date === this.selectedDate);
        const normalCount = dayRecords.filter(r => r.status === '正常').length;
        const lateCount = dayRecords.filter(r => r.status === '迟到').length;
        const leaveCount = dayRecords.filter(r => r.status === '请假').length;
        const pendingLeaves = this.leaves.filter(l => l.status === '待审批').length;

        return `
        <div class="hr-attendance-page">
            <div class="hr-module-header">
                <div class="hr-module-title">
                    <h2>考勤管理</h2>
                    <p class="hr-module-desc">员工打卡记录、请假审批、考勤统计分析</p>
                </div>
                <div class="hr-header-actions">
                    <button class="btn-hr-primary" id="btn-clock-in">手动打卡</button>
                    <button class="btn-hr-secondary" id="btn-apply-leave">申请请假</button>
                    <button class="btn-hr-outline" id="btn-export-attendance">导出报表</button>
                </div>
            </div>

            <div class="hr-stats-row">
                <div class="hr-stat-card">
                    <div class="hr-stat-icon" style="background:#d1fae5;color:#059669;">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 11.08V12a10 10 0 11-5.93-9.14"/><polyline points="22,4 12,14.01 9,11.01"/></svg>
                    </div>
                    <div class="hr-stat-info">
                        <span class="hr-stat-num">${normalCount}</span>
                        <span class="hr-stat-label">正常出勤</span>
                    </div>
                </div>
                <div class="hr-stat-card">
                    <div class="hr-stat-icon" style="background:#fee2e2;color:#dc2626;">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                    </div>
                    <div class="hr-stat-info">
                        <span class="hr-stat-num">${lateCount}</span>
                        <span class="hr-stat-label">迟到</span>
                    </div>
                </div>
                <div class="hr-stat-card">
                    <div class="hr-stat-icon" style="background:#dbeafe;color:#2563eb;">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
                    </div>
                    <div class="hr-stat-info">
                        <span class="hr-stat-num">${leaveCount}</span>
                        <span class="hr-stat-label">请假</span>
                    </div>
                </div>
                <div class="hr-stat-card">
                    <div class="hr-stat-icon" style="background:#fef3c7;color:#d97706;">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12,6 12,12 16,14"/></svg>
                    </div>
                    <div class="hr-stat-info">
                        <span class="hr-stat-num">${pendingLeaves}</span>
                        <span class="hr-stat-label">待审批</span>
                    </div>
                </div>
            </div>

            <div class="hr-org-tabs">
                <button class="hr-org-tab ${this.currentTab === 'daily' ? 'active' : ''}" data-tab="daily">每日考勤</button>
                <button class="hr-org-tab ${this.currentTab === 'leave' ? 'active' : ''}" data-tab="leave">请假管理</button>
                <button class="hr-org-tab ${this.currentTab === 'stats' ? 'active' : ''}" data-tab="stats">考勤统计</button>
                <button class="hr-org-tab ${this.currentTab === 'rules' ? 'active' : ''}" data-tab="rules">考勤规则</button>
            </div>

            <div class="hr-content-area" id="hr-attendance-content">
                ${this.renderTabContent()}
            </div>
        </div>`;
    },

    renderTabContent() {
        switch(this.currentTab) {
            case 'daily': return this.renderDaily();
            case 'leave': return this.renderLeave();
            case 'stats': return this.renderStats();
            case 'rules': return this.renderRules();
            default: return this.renderDaily();
        }
    },

    renderDaily() {
        const dayRecords = this.records.filter(r => r.date === this.selectedDate);
        const total = dayRecords.length;
        const present = dayRecords.filter(r => r.status !== '请假').length;

        return `
        <div class="hr-filter-bar">
            <input type="date" id="attendance-date-picker" value="${this.selectedDate}" class="hr-filter-select">
            <span class="attendance-summary">出勤 ${present}/${total} 人</span>
        </div>
        <div class="hr-table-wrapper">
            <table class="hr-table">
                <thead>
                    <tr>
                        <th>姓名</th>
                        <th>部门</th>
                        <th>上班打卡</th>
                        <th>下班打卡</th>
                        <th>工时(h)</th>
                        <th>状态</th>
                        <th>备注</th>
                        <th>操作</th>
                    </tr>
                </thead>
                <tbody>
                    ${dayRecords.length > 0 ? dayRecords.map(record => {
                        const workHours = this.calcWorkHours(record.clockIn, record.clockOut);
                        return `
                    <tr>
                        <td><strong>${record.name}</strong></td>
                        <td>${record.dept}</td>
                        <td>${record.clockIn || '<span style="color:#9ca3af;">未打卡</span>'}</td>
                        <td>${record.clockOut || '<span style="color:#9ca3af;">未打卡</span>'}</td>
                        <td>${workHours > 0 ? workHours.toFixed(1) : '-'}</td>
                        <td><span class="attendance-status ${this.getStatusClass(record.status)}">${record.status}</span></td>
                        <td>${record.remark || '-'}</td>
                        <td class="action-cell">
                            <button class="hr-action-btn" data-action="edit-attendance" data-id="${record.id}">修改</button>
                            <button class="hr-action-btn danger" data-action="delete-attendance" data-id="${record.id}">删除</button>
                        </td>
                    </tr>`;
                    }).join('') : '<tr><td colspan="8" style="text-align:center;color:#9ca3af;padding:40px;">该日期暂无考勤记录</td></tr>'}
                </tbody>
            </table>
            <div class="hr-table-footer">共 ${dayRecords.length} 条记录</div>
        </div>`;
    },

    renderLeave() {
        return `
        <div class="hr-filter-bar">
            <select id="leave-status-filter" class="hr-filter-select">
                <option value="">全部状态</option>
                <option value="待审批">待审批</option>
                <option value="已批准">已批准</option>
                <option value="已拒绝">已拒绝</option>
            </select>
            <button class="btn-hr-primary btn-sm" id="btn-add-leave-inline">申请请假</button>
        </div>
        <div class="hr-table-wrapper">
            <table class="hr-table">
                <thead>
                    <tr>
                        <th>姓名</th>
                        <th>部门</th>
                        <th>假期类型</th>
                        <th>开始日期</th>
                        <th>结束日期</th>
                        <th>天数</th>
                        <th>原因</th>
                        <th>审批人</th>
                        <th>状态</th>
                        <th>操作</th>
                    </tr>
                </thead>
                <tbody>
                    ${this.leaves.map(leave => `
                    <tr>
                        <td><strong>${leave.name}</strong></td>
                        <td>${leave.dept}</td>
                        <td><span class="leave-type-badge">${leave.type}</span></td>
                        <td>${leave.startDate}</td>
                        <td>${leave.endDate}</td>
                        <td>${leave.days}天</td>
                        <td>${leave.reason}</td>
                        <td>${leave.approver}</td>
                        <td><span class="leave-status ${leave.status === '已批准' ? 'approved' : leave.status === '待审批' ? 'pending' : 'rejected'}">${leave.status}</span></td>
                        <td class="action-cell">
                            ${leave.status === '待审批' ? `
                            <button class="hr-action-btn" data-action="approve-leave" data-id="${leave.id}">通过</button>
                            <button class="hr-action-btn danger" data-action="reject-leave" data-id="${leave.id}">拒绝</button>
                            ` : ''}
                            <button class="hr-action-btn danger" data-action="delete-leave" data-id="${leave.id}">删除</button>
                        </td>
                    </tr>
                    `).join('')}
                </tbody>
            </table>
            <div class="hr-table-footer">共 ${this.leaves.length} 条请假记录，待审批 ${this.leaves.filter(l=>l.status==='待审批').length} 条</div>
        </div>`;
    },

    renderStats() {
        const allDates = [...new Set(this.records.map(r => r.date))].sort().reverse();
        const depts = [...new Set(this.records.map(r => r.dept))];
        const deptStats = depts.map(dept => {
            const deptRecords = this.records.filter(r => r.dept === dept);
            const totalDays = [...new Set(deptRecords.map(r => r.date))].length;
            return {
                dept,
                total: deptRecords.length,
                normal: deptRecords.filter(r => r.status === '正常').length,
                late: deptRecords.filter(r => r.status === '迟到').length,
                early: deptRecords.filter(r => r.status === '早退').length,
                leave: deptRecords.filter(r => r.status === '请假').length,
                outside: deptRecords.filter(r => r.status === '外勤').length,
            };
        });

        // 个人月度统计
        const empNames = [...new Set(this.records.map(r => r.name))];
        const empStats = empNames.map(name => {
            const empRecords = this.records.filter(r => r.name === name);
            return {
                name,
                dept: empRecords[0].dept,
                total: empRecords.length,
                normal: empRecords.filter(r => r.status === '正常').length,
                late: empRecords.filter(r => r.status === '迟到').length,
                early: empRecords.filter(r => r.status === '早退').length,
                leave: empRecords.filter(r => r.status === '请假').length,
            };
        });

        return `
        <div class="attendance-stats">
            <h3 class="stats-title">部门考勤汇总</h3>
            <div class="hr-table-wrapper">
                <table class="hr-table">
                    <thead>
                        <tr>
                            <th>部门</th>
                            <th>总记录</th>
                            <th>正常</th>
                            <th>迟到</th>
                            <th>早退</th>
                            <th>请假</th>
                            <th>外勤</th>
                            <th>出勤率</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${deptStats.map(s => `
                        <tr>
                            <td><strong>${s.dept}</strong></td>
                            <td>${s.total}</td>
                            <td style="color:#059669;">${s.normal}</td>
                            <td style="color:#dc2626;">${s.late}</td>
                            <td style="color:#d97706;">${s.early}</td>
                            <td style="color:#2563eb;">${s.leave}</td>
                            <td style="color:#6b7280;">${s.outside}</td>
                            <td>${s.total > 0 ? Math.round((s.normal + s.outside) / s.total * 100) : 0}%</td>
                        </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>

            <h3 class="stats-title" style="margin-top:24px;">个人考勤明细</h3>
            <div class="hr-table-wrapper">
                <table class="hr-table">
                    <thead>
                        <tr>
                            <th>姓名</th>
                            <th>部门</th>
                            <th>总天数</th>
                            <th>正常</th>
                            <th>迟到</th>
                            <th>早退</th>
                            <th>请假</th>
                            <th>出勤率</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${empStats.map(s => `
                        <tr>
                            <td><strong>${s.name}</strong></td>
                            <td>${s.dept}</td>
                            <td>${s.total}</td>
                            <td style="color:#059669;">${s.normal}</td>
                            <td style="color:#dc2626;">${s.late}</td>
                            <td style="color:#d97706;">${s.early}</td>
                            <td style="color:#2563eb;">${s.leave}</td>
                            <td>${s.total > 0 ? Math.round(s.normal / s.total * 100) : 0}%</td>
                        </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        </div>`;
    },

    renderRules() {
        return `
        <div class="attendance-rules">
            <div class="rules-card">
                <h3>考勤规则设置</h3>
                <form id="rules-form">
                    <div class="hr-form-grid">
                        <div class="hr-form-item">
                            <label>上班时间</label>
                            <input type="time" name="workStart" value="${this.rules.workStart}">
                        </div>
                        <div class="hr-form-item">
                            <label>下班时间</label>
                            <input type="time" name="workEnd" value="${this.rules.workEnd}">
                        </div>
                        <div class="hr-form-item">
                            <label>迟到容忍(分钟)</label>
                            <input type="number" name="lateThreshold" value="${this.rules.lateThreshold}" min="0" max="60">
                        </div>
                        <div class="hr-form-item">
                            <label>早退容忍(分钟)</label>
                            <input type="number" name="earlyThreshold" value="${this.rules.earlyThreshold}" min="0" max="60">
                        </div>
                        <div class="hr-form-item">
                            <label>午休开始</label>
                            <input type="time" name="lunchStart" value="${this.rules.lunchStart}">
                        </div>
                        <div class="hr-form-item">
                            <label>午休结束</label>
                            <input type="time" name="lunchEnd" value="${this.rules.lunchEnd}">
                        </div>
                        <div class="hr-form-item">
                            <label>加班起算时间</label>
                            <input type="time" name="overtimeStart" value="${this.rules.overtimeStart}">
                        </div>
                    </div>
                    <div class="hr-form-actions" style="margin-top:16px;">
                        <button type="submit" class="btn-hr-primary">保存规则</button>
                    </div>
                </form>
            </div>
            <div class="rules-card" style="margin-top:16px;">
                <h3>假期类型管理</h3>
                <div class="leave-types-grid">
                    ${this.rules.leaveTypes.map((type, i) => `
                    <div class="leave-type-item">
                        <span class="leave-type-name">${type}</span>
                        <button class="hr-action-btn danger btn-xs" data-action="remove-leave-type" data-index="${i}">&times;</button>
                    </div>
                    `).join('')}
                    <div class="leave-type-item add-type">
                        <input type="text" id="new-leave-type" placeholder="新假期类型" style="width:80px;padding:2px 6px;border:1px solid var(--border-color);border-radius:4px;">
                        <button class="hr-action-btn" id="btn-add-leave-type">添加</button>
                    </div>
                </div>
            </div>
        </div>`;
    },

    getStatusClass(status) {
        const map = { '正常': 'normal', '迟到': 'late', '早退': 'early', '外勤': 'outside', '请假': 'leave', '旷工': 'absent' };
        return map[status] || 'normal';
    },

    calcWorkHours(clockIn, clockOut) {
        if (!clockIn || !clockOut) return 0;
        const [h1, m1] = clockIn.split(':').map(Number);
        const [h2, m2] = clockOut.split(':').map(Number);
        let hours = (h2 + m2/60) - (h1 + m1/60);
        // 减去午休时间
        const [lh1, lm1] = this.rules.lunchStart.split(':').map(Number);
        const [lh2, lm2] = this.rules.lunchEnd.split(':').map(Number);
        const lunchHours = (lh2 + lm2/60) - (lh1 + lm1/60);
        if (h1 < lh2 && h2 > lh1) hours -= lunchHours;
        return Math.max(0, hours);
    },

    showClockInModal() {
        const employees = this.getEmployeeList();
        const html = `
        <div class="hr-modal-overlay" id="attendance-modal">
            <div class="hr-modal" style="max-width:500px;">
                <div class="hr-modal-header">
                    <h3>手动打卡</h3>
                    <button class="hr-modal-close" id="close-att-modal">&times;</button>
                </div>
                <div class="hr-modal-body">
                    <form id="clock-form">
                        <div class="hr-form-section">
                            <div class="hr-form-grid">
                                <div class="hr-form-item">
                                    <label>员工 <span class="required">*</span></label>
                                    <select name="empId" required>
                                        <option value="">请选择</option>
                                        ${employees.map(e => `<option value="${e.id}" data-name="${e.name}" data-dept="${e.dept}">${e.name} - ${e.dept}</option>`).join('')}
                                    </select>
                                </div>
                                <div class="hr-form-item">
                                    <label>日期 <span class="required">*</span></label>
                                    <input type="date" name="date" value="${this.selectedDate}" required>
                                </div>
                                <div class="hr-form-item">
                                    <label>上班打卡时间</label>
                                    <input type="time" name="clockIn" value="09:00">
                                </div>
                                <div class="hr-form-item">
                                    <label>下班打卡时间</label>
                                    <input type="time" name="clockOut" value="18:00">
                                </div>
                                <div class="hr-form-item">
                                    <label>状态</label>
                                    <select name="status">
                                        <option value="正常">正常</option>
                                        <option value="迟到">迟到</option>
                                        <option value="早退">早退</option>
                                        <option value="外勤">外勤</option>
                                        <option value="请假">请假</option>
                                    </select>
                                </div>
                                <div class="hr-form-item">
                                    <label>备注</label>
                                    <input type="text" name="remark" placeholder="可选">
                                </div>
                            </div>
                        </div>
                        <div class="hr-form-actions">
                            <button type="button" class="btn-hr-secondary" id="cancel-clock-form">取消</button>
                            <button type="submit" class="btn-hr-primary">确认打卡</button>
                        </div>
                    </form>
                </div>
            </div>
        </div>`;
        document.body.insertAdjacentHTML('beforeend', html);
        document.getElementById('close-att-modal').onclick = () => this.closeModal();
        document.getElementById('cancel-clock-form').onclick = () => this.closeModal();
        document.getElementById('clock-form').onsubmit = (e) => { e.preventDefault(); this.saveClock(); };
    },

    saveClock(editId) {
        const form = document.getElementById('clock-form');
        if (!form.checkValidity()) { form.reportValidity(); return; }
        const fd = new FormData(form);
        const empSelect = form.querySelector('[name=empId]');
        const selOption = empSelect.options[empSelect.selectedIndex];

        const data = {
            empId: fd.get('empId'),
            name: selOption.dataset.name || '',
            dept: selOption.dataset.dept || '',
            date: fd.get('date'),
            clockIn: fd.get('clockIn'),
            clockOut: fd.get('clockOut'),
            status: fd.get('status'),
            remark: fd.get('remark'),
        };

        if (editId) {
            const idx = this.records.findIndex(r => r.id === editId);
            if (idx >= 0) this.records[idx] = { ...this.records[idx], ...data };
        } else {
            data.id = this.generateId('ATT');
            this.records.push(data);
        }
        this.saveRecords();
        this.closeModal();
        this.refresh();
    },

    showEditAttendance(id) {
        const record = this.records.find(r => r.id === id);
        if (!record) return;
        const employees = this.getEmployeeList();
        const html = `
        <div class="hr-modal-overlay" id="attendance-modal">
            <div class="hr-modal" style="max-width:500px;">
                <div class="hr-modal-header">
                    <h3>修改考勤记录</h3>
                    <button class="hr-modal-close" id="close-att-modal">&times;</button>
                </div>
                <div class="hr-modal-body">
                    <form id="clock-form">
                        <div class="hr-form-section">
                            <div class="hr-form-grid">
                                <div class="hr-form-item">
                                    <label>员工</label>
                                    <select name="empId" required>
                                        ${employees.map(e => `<option value="${e.id}" data-name="${e.name}" data-dept="${e.dept}" ${e.id === record.empId ? 'selected' : ''}>${e.name} - ${e.dept}</option>`).join('')}
                                    </select>
                                </div>
                                <div class="hr-form-item">
                                    <label>日期</label>
                                    <input type="date" name="date" value="${record.date}" required>
                                </div>
                                <div class="hr-form-item">
                                    <label>上班打卡时间</label>
                                    <input type="time" name="clockIn" value="${record.clockIn}">
                                </div>
                                <div class="hr-form-item">
                                    <label>下班打卡时间</label>
                                    <input type="time" name="clockOut" value="${record.clockOut}">
                                </div>
                                <div class="hr-form-item">
                                    <label>状态</label>
                                    <select name="status">
                                        ${['正常','迟到','早退','外勤','请假','旷工'].map(s => `<option value="${s}" ${s === record.status ? 'selected' : ''}>${s}</option>`).join('')}
                                    </select>
                                </div>
                                <div class="hr-form-item">
                                    <label>备注</label>
                                    <input type="text" name="remark" value="${record.remark || ''}">
                                </div>
                            </div>
                        </div>
                        <div class="hr-form-actions">
                            <button type="button" class="btn-hr-secondary" id="cancel-clock-form">取消</button>
                            <button type="submit" class="btn-hr-primary">保存修改</button>
                        </div>
                    </form>
                </div>
            </div>
        </div>`;
        document.body.insertAdjacentHTML('beforeend', html);
        document.getElementById('close-att-modal').onclick = () => this.closeModal();
        document.getElementById('cancel-clock-form').onclick = () => this.closeModal();
        document.getElementById('clock-form').onsubmit = (e) => { e.preventDefault(); this.saveClock(id); };
    },

    deleteAttendance(id) {
        if (!confirm('确定删除该考勤记录？')) return;
        this.records = this.records.filter(r => r.id !== id);
        this.saveRecords();
        this.refresh();
    },

    showLeaveModal() {
        const employees = this.getEmployeeList();
        const html = `
        <div class="hr-modal-overlay" id="attendance-modal">
            <div class="hr-modal" style="max-width:550px;">
                <div class="hr-modal-header">
                    <h3>申请请假</h3>
                    <button class="hr-modal-close" id="close-att-modal">&times;</button>
                </div>
                <div class="hr-modal-body">
                    <form id="leave-form">
                        <div class="hr-form-section">
                            <div class="hr-form-grid">
                                <div class="hr-form-item">
                                    <label>员工 <span class="required">*</span></label>
                                    <select name="empId" required>
                                        <option value="">请选择</option>
                                        ${employees.map(e => `<option value="${e.id}" data-name="${e.name}" data-dept="${e.dept}">${e.name} - ${e.dept}</option>`).join('')}
                                    </select>
                                </div>
                                <div class="hr-form-item">
                                    <label>假期类型 <span class="required">*</span></label>
                                    <select name="type" required>
                                        ${this.rules.leaveTypes.map(t => `<option value="${t}">${t}</option>`).join('')}
                                    </select>
                                </div>
                                <div class="hr-form-item">
                                    <label>开始日期 <span class="required">*</span></label>
                                    <input type="date" name="startDate" required>
                                </div>
                                <div class="hr-form-item">
                                    <label>结束日期 <span class="required">*</span></label>
                                    <input type="date" name="endDate" required>
                                </div>
                                <div class="hr-form-item">
                                    <label>请假天数 <span class="required">*</span></label>
                                    <input type="number" name="days" min="0.5" step="0.5" required>
                                </div>
                                <div class="hr-form-item">
                                    <label>审批人</label>
                                    <input type="text" name="approver" placeholder="直属领导">
                                </div>
                            </div>
                            <div class="hr-form-item" style="grid-column:1/-1;">
                                <label>请假原因 <span class="required">*</span></label>
                                <textarea name="reason" rows="3" required placeholder="请填写请假原因"></textarea>
                            </div>
                        </div>
                        <div class="hr-form-actions">
                            <button type="button" class="btn-hr-secondary" id="cancel-leave-form">取消</button>
                            <button type="submit" class="btn-hr-primary">提交申请</button>
                        </div>
                    </form>
                </div>
            </div>
        </div>`;
        document.body.insertAdjacentHTML('beforeend', html);
        document.getElementById('close-att-modal').onclick = () => this.closeModal();
        document.getElementById('cancel-leave-form').onclick = () => this.closeModal();
        document.getElementById('leave-form').onsubmit = (e) => { e.preventDefault(); this.saveLeave(); };
    },

    saveLeave() {
        const form = document.getElementById('leave-form');
        if (!form.checkValidity()) { form.reportValidity(); return; }
        const fd = new FormData(form);
        const empSelect = form.querySelector('[name=empId]');
        const selOption = empSelect.options[empSelect.selectedIndex];

        const data = {
            id: this.generateId('LV'),
            empId: fd.get('empId'),
            name: selOption.dataset.name || '',
            dept: selOption.dataset.dept || '',
            type: fd.get('type'),
            startDate: fd.get('startDate'),
            endDate: fd.get('endDate'),
            days: parseFloat(fd.get('days')),
            reason: fd.get('reason'),
            approver: fd.get('approver') || '待指定',
            status: '待审批',
            applyDate: new Date().toISOString().split('T')[0],
        };
        this.leaves.unshift(data);
        this.saveLeaves();
        this.closeModal();
        this.currentTab = 'leave';
        this.refresh();
    },

    approveLeave(id) {
        const leave = this.leaves.find(l => l.id === id);
        if (leave && confirm(`确定批准 ${leave.name} 的${leave.type}申请？`)) {
            leave.status = '已批准';
            this.saveLeaves();
            this.refresh();
        }
    },

    rejectLeave(id) {
        const leave = this.leaves.find(l => l.id === id);
        if (leave && confirm(`确定拒绝 ${leave.name} 的${leave.type}申请？`)) {
            leave.status = '已拒绝';
            this.saveLeaves();
            this.refresh();
        }
    },

    deleteLeave(id) {
        if (!confirm('确定删除该请假记录？')) return;
        this.leaves = this.leaves.filter(l => l.id !== id);
        this.saveLeaves();
        this.refresh();
    },

    saveRulesForm() {
        const form = document.getElementById('rules-form');
        const fd = new FormData(form);
        this.rules.workStart = fd.get('workStart');
        this.rules.workEnd = fd.get('workEnd');
        this.rules.lateThreshold = parseInt(fd.get('lateThreshold'));
        this.rules.earlyThreshold = parseInt(fd.get('earlyThreshold'));
        this.rules.lunchStart = fd.get('lunchStart');
        this.rules.lunchEnd = fd.get('lunchEnd');
        this.rules.overtimeStart = fd.get('overtimeStart');
        this.saveRules();
        alert('考勤规则已保存');
    },

    addLeaveType() {
        const input = document.getElementById('new-leave-type');
        const val = input.value.trim();
        if (!val) return;
        if (this.rules.leaveTypes.includes(val)) { alert('该假期类型已存在'); return; }
        this.rules.leaveTypes.push(val);
        this.saveRules();
        this.refresh();
    },

    removeLeaveType(index) {
        if (!confirm(`确定删除假期类型「${this.rules.leaveTypes[index]}」？`)) return;
        this.rules.leaveTypes.splice(index, 1);
        this.saveRules();
        this.refresh();
    },

    exportReport() {
        const headers = ['姓名', '部门', '日期', '上班打卡', '下班打卡', '状态', '备注'];
        const rows = this.records.map(r => [r.name, r.dept, r.date, r.clockIn || '', r.clockOut || '', r.status, r.remark || '']);
        let csv = '\ufeff' + headers.join(',') + '\n';
        rows.forEach(r => { csv += r.map(v => `"${(v+'').replace(/"/g, '""')}"`).join(',') + '\n'; });
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url; a.download = `考勤记录_${new Date().toISOString().split('T')[0]}.csv`;
        a.click(); URL.revokeObjectURL(url);
    },

    getEmployeeList() {
        // 从考勤记录中提取员工列表，或从localStorage员工数据获取
        const empData = localStorage.getItem('hr_employees');
        if (empData) {
            const employees = JSON.parse(empData);
            return employees.map(e => ({ id: e.id, name: e.name, dept: e.dept }));
        }
        // fallback: 从考勤记录中提取
        const map = new Map();
        this.records.forEach(r => { if (!map.has(r.empId)) map.set(r.empId, { id: r.empId, name: r.name, dept: r.dept }); });
        return Array.from(map.values());
    },

    closeModal() {
        const modal = document.getElementById('attendance-modal');
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
        const btnClock = document.getElementById('btn-clock-in');
        if (btnClock) btnClock.onclick = () => this.showClockInModal();
        const btnLeave = document.getElementById('btn-apply-leave');
        if (btnLeave) btnLeave.onclick = () => this.showLeaveModal();
        const btnExport = document.getElementById('btn-export-attendance');
        if (btnExport) btnExport.onclick = () => this.exportReport();

        // Date picker
        const datePicker = document.getElementById('attendance-date-picker');
        if (datePicker) {
            datePicker.onchange = () => {
                this.selectedDate = datePicker.value;
                const content = document.getElementById('hr-attendance-content');
                content.innerHTML = this.renderDaily();
                this.bindContentEvents();
            };
        }

        // Inline leave button
        const btnAddLeaveInline = document.getElementById('btn-add-leave-inline');
        if (btnAddLeaveInline) btnAddLeaveInline.onclick = () => this.showLeaveModal();

        // Leave status filter
        const leaveFilter = document.getElementById('leave-status-filter');
        if (leaveFilter) {
            leaveFilter.onchange = () => {
                // simple client-side filter display
                const val = leaveFilter.value;
                const rows = document.querySelectorAll('#hr-attendance-content tbody tr');
                rows.forEach(row => {
                    if (!val) { row.style.display = ''; return; }
                    const statusCell = row.querySelector('.leave-status');
                    if (statusCell && statusCell.textContent.trim() === val) row.style.display = '';
                    else row.style.display = 'none';
                });
            };
        }

        // Rules form
        const rulesForm = document.getElementById('rules-form');
        if (rulesForm) rulesForm.onsubmit = (e) => { e.preventDefault(); this.saveRulesForm(); };

        // Add leave type
        const btnAddType = document.getElementById('btn-add-leave-type');
        if (btnAddType) btnAddType.onclick = () => this.addLeaveType();

        this.bindContentEvents();
    },

    bindContentEvents() {
        document.querySelectorAll('[data-action]').forEach(btn => {
            btn.onclick = () => {
                const action = btn.dataset.action;
                const id = btn.dataset.id;
                const index = btn.dataset.index;
                switch(action) {
                    case 'edit-attendance': this.showEditAttendance(id); break;
                    case 'delete-attendance': this.deleteAttendance(id); break;
                    case 'approve-leave': this.approveLeave(id); break;
                    case 'reject-leave': this.rejectLeave(id); break;
                    case 'delete-leave': this.deleteLeave(id); break;
                    case 'remove-leave-type': this.removeLeaveType(parseInt(index)); break;
                }
            };
        });
    }
};
