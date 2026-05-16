// 公司组织框架模块 - 浙杭企服（从共享部门/员工数据读取）

const HrOrg = {
    departments: [],
    employees: [],
    currentTab: 'orgchart',

    loadData() {
        // 从共享的部门管理模块读取
        const deptSaved = localStorage.getItem('hr_departments');
        this.departments = deptSaved ? JSON.parse(deptSaved) : (typeof HrDepartment !== 'undefined' ? HrDepartment.defaultDepartments : []);
        // 从员工档案模块读取
        const empSaved = localStorage.getItem('hr_employees');
        this.employees = empSaved ? JSON.parse(empSaved) : [];
    },

    init() {
        this.loadData();
        this.render();
    },

    destroy() {},

    render() {
        const contentArea = document.querySelector('.content-area');
        const activeDepts = this.departments.filter(d => d.status === 'active');
        const totalEmp = this.employees.length;

        contentArea.innerHTML = `
        <div class="hr-module">
            <div class="hr-module-header">
                <h2><i class="fas fa-building"></i> 公司组织框架</h2>
                <div class="hr-header-actions">
                    <span class="org-stat-badge"><i class="fas fa-sitemap"></i> 部门 <strong>${activeDepts.length}</strong></span>
                    <span class="org-stat-badge"><i class="fas fa-users"></i> 员工 <strong>${totalEmp}</strong></span>
                </div>
            </div>

            <div class="hr-org-tabs">
                <button class="hr-org-tab ${this.currentTab === 'orgchart' ? 'active' : ''}" data-tab="orgchart">
                    <i class="fas fa-project-diagram"></i> 组织架构图
                </button>
                <button class="hr-org-tab ${this.currentTab === 'roster' ? 'active' : ''}" data-tab="roster">
                    <i class="fas fa-address-book"></i> 员工花名册
                </button>
                <button class="hr-org-tab ${this.currentTab === 'deptinfo' ? 'active' : ''}" data-tab="deptinfo">
                    <i class="fas fa-info-circle"></i> 部门详情
                </button>
                <button class="hr-org-tab ${this.currentTab === 'hierarchy' ? 'active' : ''}" data-tab="hierarchy">
                    <i class="fas fa-stream"></i> 汇报关系
                </button>
            </div>

            <div class="hr-org-content" id="hr-org-content">
                ${this.renderCurrentTab()}
            </div>
        </div>`;
        this.bindEvents();
    },

    renderCurrentTab() {
        switch (this.currentTab) {
            case 'orgchart': return this.renderOrgChart();
            case 'roster': return this.renderRoster();
            case 'deptinfo': return this.renderDeptInfo();
            case 'hierarchy': return this.renderHierarchy();
            default: return this.renderOrgChart();
        }
    },

    // ===== 组织架构图 =====
    renderOrgChart() {
        const roots = this.departments.filter(d => (!d.parentId || d.parentId === '') && d.status === 'active');
        if (roots.length === 0) {
            return '<div class="hr-empty"><i class="fas fa-sitemap" style="font-size:48px;color:#cbd5e1;"></i><p>暂无组织数据，请先在"部门管理"中设置部门</p></div>';
        }

        return `
        <div class="org-chart-container">
            <div class="org-chart">
                ${roots.map(root => this.renderOrgNode(root, true)).join('')}
            </div>
        </div>`;
    },

    renderOrgNode(dept, isRoot) {
        const children = this.departments.filter(d => d.parentId === dept.id && d.status === 'active')
            .sort((a, b) => (a.sort || 0) - (b.sort || 0));
        const empCount = this.getEmpCountByDept(dept.name);
        const cardClass = isRoot ? 'root-card' : 'dept-card';

        return `
        <div class="org-dept-branch">
            <div class="org-node-card ${cardClass}" data-dept-id="${dept.id}">
                <div class="org-node-title">${dept.name}</div>
                <div class="org-node-person"><i class="fas fa-user-tie"></i> ${dept.manager || '未设置负责人'}</div>
                <div class="org-node-role">编制${dept.headcount || 0}人 · 实际${empCount}人</div>
            </div>
            ${children.length > 0 ? `
            <div class="org-sub-nodes">
                ${children.map(child => this.renderOrgNode(child, false)).join('')}
            </div>` : ''}
        </div>`;
    },

    getEmpCountByDept(deptName) {
        return this.employees.filter(e => e.department === deptName || e.dept === deptName).length;
    },

    // ===== 员工花名册 =====
    renderRoster() {
        const deptNames = [...new Set(this.departments.filter(d => d.status === 'active').map(d => d.name))];
        const empList = this.employees.length > 0 ? this.employees : [];

        return `
        <div class="roster-container">
            <div class="hr-filter-bar">
                <input type="text" class="roster-search" placeholder="搜索姓名、职位..." id="org-roster-search">
                <select class="roster-dept-filter" id="org-roster-dept">
                    <option value="">全部部门</option>
                    ${deptNames.map(d => `<option value="${d}">${d}</option>`).join('')}
                </select>
                <select id="org-roster-status">
                    <option value="">全部状态</option>
                    <option value="在职">在职</option>
                    <option value="试用期">试用期</option>
                    <option value="离职">离职</option>
                </select>
                <span class="roster-count" id="org-roster-count">共 ${empList.length} 人</span>
            </div>
            <div class="table-container">
                <table class="hr-table">
                    <thead>
                        <tr>
                            <th>姓名</th>
                            <th>部门</th>
                            <th>职位</th>
                            <th>直属上级</th>
                            <th>联系电话</th>
                            <th>入职日期</th>
                            <th>状态</th>
                        </tr>
                    </thead>
                    <tbody id="org-roster-tbody">
                        ${this.renderRosterRows(empList)}
                    </tbody>
                </table>
            </div>
            ${empList.length === 0 ? '<div class="hr-empty">暂无员工数据，请先在"员工档案"中添加员工</div>' : ''}
        </div>`;
    },

    renderRosterRows(list) {
        return list.map(emp => {
            const statusMap = { '在职': 'success', '试用期': 'warning', '离职': 'danger' };
            const statusClass = statusMap[emp.status] || 'default';
            return `
            <tr>
                <td><strong>${emp.name}</strong></td>
                <td>${emp.department || emp.dept || ''}</td>
                <td>${emp.position || ''}</td>
                <td>${emp.supervisor || '—'}</td>
                <td>${emp.phone || ''}</td>
                <td>${emp.joinDate || emp.entryDate || ''}</td>
                <td><span class="hr-badge ${statusClass}">${emp.status || '在职'}</span></td>
            </tr>`;
        }).join('');
    },

    // ===== 部门详情 =====
    renderDeptInfo() {
        const activeDepts = this.departments.filter(d => d.status === 'active')
            .sort((a, b) => (a.sort || 0) - (b.sort || 0));

        if (activeDepts.length === 0) {
            return '<div class="hr-empty">暂无部门数据</div>';
        }

        return `
        <div class="dept-info-container">
            <div class="dept-cards-grid">
                ${activeDepts.map(dept => {
                    const empCount = this.getEmpCountByDept(dept.name);
                    const children = this.departments.filter(d => d.parentId === dept.id && d.status === 'active');
                    const parent = this.departments.find(d => d.id === dept.parentId);
                    return `
                    <div class="dept-info-card" data-dept-id="${dept.id}">
                        <div class="dept-info-header">
                            <h4><i class="fas fa-building"></i> ${dept.name}</h4>
                            <span class="dept-headcount">${empCount}/${dept.headcount || 0}人</span>
                        </div>
                        <div class="dept-info-body">
                            <div class="dept-info-row">
                                <span class="dept-info-label">部门编码</span>
                                <span class="dept-info-value">${dept.code || '—'}</span>
                            </div>
                            <div class="dept-info-row">
                                <span class="dept-info-label">上级部门</span>
                                <span class="dept-info-value">${parent ? parent.name : '—'}</span>
                            </div>
                            <div class="dept-info-row">
                                <span class="dept-info-label">部门负责人</span>
                                <span class="dept-info-value"><i class="fas fa-user-tie"></i> ${dept.manager || '未设置'}</span>
                            </div>
                            <div class="dept-info-row">
                                <span class="dept-info-label">负责人电话</span>
                                <span class="dept-info-value">${dept.managerPhone || '—'}</span>
                            </div>
                            <div class="dept-info-row">
                                <span class="dept-info-label">下属部门</span>
                                <span class="dept-info-value">${children.length > 0 ? children.map(c => c.name).join('、') : '无'}</span>
                            </div>
                            <div class="dept-info-row">
                                <span class="dept-info-label">部门描述</span>
                                <span class="dept-info-value">${dept.description || '—'}</span>
                            </div>
                        </div>
                        <div class="dept-info-footer">
                            <button class="btn-sm btn-hr-secondary" data-action="view-dept-emp" data-dept="${dept.name}">
                                <i class="fas fa-users"></i> 查看成员(${empCount})
                            </button>
                        </div>
                    </div>`;
                }).join('')}
            </div>
        </div>`;
    },

    // ===== 汇报关系 =====
    renderHierarchy() {
        const activeDepts = this.departments.filter(d => d.status === 'active');
        const roots = activeDepts.filter(d => !d.parentId || d.parentId === '');

        return `
        <div class="hierarchy-container">
            <div class="hierarchy-desc">
                <i class="fas fa-info-circle"></i> 汇报关系展示各部门及成员的上下级关系。部门负责人向上级部门负责人汇报。
            </div>
            <div class="hierarchy-tree">
                ${roots.map(root => this.renderHierarchyNode(root, 0)).join('')}
            </div>
        </div>`;
    },

    renderHierarchyNode(dept, level) {
        const children = this.departments.filter(d => d.parentId === dept.id && d.status === 'active')
            .sort((a, b) => (a.sort || 0) - (b.sort || 0));
        const emps = this.employees.filter(e => (e.department === dept.name || e.dept === dept.name));
        const indent = level * 28;

        return `
        <div class="hierarchy-item" style="margin-left: ${indent}px;">
            <div class="hierarchy-dept-row">
                <span class="hierarchy-icon"><i class="fas fa-folder${children.length > 0 ? '-open' : ''}"></i></span>
                <span class="hierarchy-dept-name">${dept.name}</span>
                <span class="hierarchy-manager">${dept.manager ? `<i class="fas fa-crown"></i> ${dept.manager}` : ''}</span>
            </div>
            ${emps.length > 0 ? `
            <div class="hierarchy-members" style="margin-left: ${indent + 28}px;">
                ${emps.slice(0, 10).map(emp => `
                <div class="hierarchy-member">
                    <i class="fas fa-user"></i>
                    <span class="hierarchy-member-name">${emp.name}</span>
                    <span class="hierarchy-member-pos">${emp.position || ''}</span>
                    ${emp.supervisor ? `<span class="hierarchy-member-sup">→ ${emp.supervisor}</span>` : ''}
                </div>`).join('')}
                ${emps.length > 10 ? `<div class="hierarchy-more">...等${emps.length}人</div>` : ''}
            </div>` : ''}
            ${children.map(child => this.renderHierarchyNode(child, level + 1)).join('')}
        </div>`;
    },

    // ===== 事件绑定 =====
    bindEvents() {
        const contentArea = document.querySelector('.content-area');

        // Tab切换
        contentArea.querySelectorAll('.hr-org-tab').forEach(tab => {
            tab.addEventListener('click', () => {
                this.currentTab = tab.dataset.tab;
                this.render();
            });
        });

        // 花名册筛选
        if (this.currentTab === 'roster') {
            this.bindRosterFilter();
        }

        // 部门详情-查看成员
        contentArea.addEventListener('click', (e) => {
            const btn = e.target.closest('[data-action]');
            if (!btn) return;
            if (btn.dataset.action === 'view-dept-emp') {
                const deptName = btn.dataset.dept;
                this.showDeptEmpModal(deptName);
            }
        });
    },

    bindRosterFilter() {
        const search = document.getElementById('org-roster-search');
        const deptFilter = document.getElementById('org-roster-dept');
        const statusFilter = document.getElementById('org-roster-status');

        const doFilter = () => {
            const keyword = (search ? search.value : '').toLowerCase();
            const dept = deptFilter ? deptFilter.value : '';
            const status = statusFilter ? statusFilter.value : '';

            const filtered = this.employees.filter(emp => {
                const name = (emp.name || '').toLowerCase();
                const pos = (emp.position || '').toLowerCase();
                const empDept = emp.department || emp.dept || '';
                const empStatus = emp.status || '在职';
                const matchKw = !keyword || name.includes(keyword) || pos.includes(keyword);
                const matchDept = !dept || empDept === dept;
                const matchStatus = !status || empStatus === status;
                return matchKw && matchDept && matchStatus;
            });

            const tbody = document.getElementById('org-roster-tbody');
            if (tbody) tbody.innerHTML = this.renderRosterRows(filtered);
            const countEl = document.getElementById('org-roster-count');
            if (countEl) countEl.textContent = `共 ${filtered.length} 人`;
        };

        if (search) search.addEventListener('input', doFilter);
        if (deptFilter) deptFilter.addEventListener('change', doFilter);
        if (statusFilter) statusFilter.addEventListener('change', doFilter);
    },

    showDeptEmpModal(deptName) {
        const emps = this.employees.filter(e => (e.department === deptName || e.dept === deptName));
        const modal = document.createElement('div');
        modal.className = 'hr-modal-overlay';
        modal.id = 'dept-emp-modal';
        modal.innerHTML = `
            <div class="hr-modal" style="width:600px;">
                <div class="hr-modal-header">
                    <h3><i class="fas fa-users"></i> ${deptName} - 成员列表 (${emps.length}人)</h3>
                    <button class="hr-modal-close" onclick="document.getElementById('dept-emp-modal').remove()">&times;</button>
                </div>
                <div class="hr-modal-body">
                    ${emps.length > 0 ? `
                    <table class="hr-table">
                        <thead><tr><th>姓名</th><th>职位</th><th>直属上级</th><th>电话</th><th>状态</th></tr></thead>
                        <tbody>
                            ${emps.map(emp => `
                            <tr>
                                <td><strong>${emp.name}</strong></td>
                                <td>${emp.position || ''}</td>
                                <td>${emp.supervisor || '—'}</td>
                                <td>${emp.phone || ''}</td>
                                <td><span class="hr-badge ${emp.status === '在职' ? 'success' : 'warning'}">${emp.status || '在职'}</span></td>
                            </tr>`).join('')}
                        </tbody>
                    </table>` : '<div class="hr-empty">该部门暂无员工</div>'}
                </div>
                <div class="hr-modal-footer">
                    <button class="btn-hr-secondary" onclick="document.getElementById('dept-emp-modal').remove()">关闭</button>
                </div>
            </div>
        `;
        document.body.appendChild(modal);
        setTimeout(() => modal.classList.add('show'), 10);
        modal.addEventListener('click', (e) => {
            if (e.target === modal) modal.remove();
        });
    }
};
