// 公司组织框架模块

const HrOrg = {
    orgData: {
        name: '浙杭企服',
        title: '总经理',
        person: '陈总',
        children: [
            {
                name: '顾问部',
                title: '部门经理',
                person: '张伟',
                headcount: 8,
                children: [
                    { name: '顾问一组', title: '组长', person: '张伟(兼)', headcount: 4 },
                    { name: '顾问二组', title: '组长', person: '周芳', headcount: 4 }
                ]
            },
            {
                name: '会计部',
                title: '部门经理',
                person: '李娜',
                headcount: 6,
                children: [
                    { name: '代账组', title: '组长', person: '孙丽', headcount: 3 },
                    { name: '审计组', title: '组长', person: '马晓', headcount: 3 }
                ]
            },
            {
                name: '工商部',
                title: '部门经理',
                person: '王强',
                headcount: 5,
                children: [
                    { name: '注册组', title: '组长', person: '郑明', headcount: 3 },
                    { name: '变更组', title: '组长', person: '林海', headcount: 2 }
                ]
            },
            {
                name: '刻章部',
                title: '部门主管',
                person: '赵敏',
                headcount: 3,
                children: []
            },
            {
                name: '人事行政部',
                title: '部门经理',
                person: '陈浩',
                headcount: 4,
                children: [
                    { name: '招聘培训', title: '专员', person: '黄婷', headcount: 2 },
                    { name: '行政后勤', title: '专员', person: '吴刚', headcount: 2 }
                ]
            },
            {
                name: '运营部',
                title: '部门经理',
                person: '刘洋',
                headcount: 5,
                children: [
                    { name: '新媒体组', title: '组长', person: '刘洋(兼)', headcount: 3 },
                    { name: '客户运营', title: '组长', person: '谢欣', headcount: 2 }
                ]
            },
            {
                name: '财务部',
                title: '财务总监',
                person: '杨梅',
                headcount: 3,
                children: []
            }
        ]
    },

    // 员工花名册
    employees: [
        { id: 1, name: '陈总', dept: '总经理办公室', position: '总经理', phone: '138****1001', joinDate: '2018-03-01', status: '在职' },
        { id: 2, name: '张伟', dept: '顾问部', position: '部门经理', phone: '138****1002', joinDate: '2019-05-15', status: '在职' },
        { id: 3, name: '周芳', dept: '顾问部', position: '组长', phone: '138****1003', joinDate: '2020-02-20', status: '在职' },
        { id: 4, name: '李娜', dept: '会计部', position: '部门经理', phone: '138****1004', joinDate: '2019-01-10', status: '在职' },
        { id: 5, name: '孙丽', dept: '会计部', position: '代账组长', phone: '138****1005', joinDate: '2020-06-01', status: '在职' },
        { id: 6, name: '马晓', dept: '会计部', position: '审计组长', phone: '138****1006', joinDate: '2020-09-15', status: '在职' },
        { id: 7, name: '王强', dept: '工商部', position: '部门经理', phone: '138****1007', joinDate: '2019-03-20', status: '在职' },
        { id: 8, name: '郑明', dept: '工商部', position: '注册组长', phone: '138****1008', joinDate: '2020-11-01', status: '在职' },
        { id: 9, name: '林海', dept: '工商部', position: '变更组长', phone: '138****1009', joinDate: '2021-04-10', status: '在职' },
        { id: 10, name: '赵敏', dept: '刻章部', position: '部门主管', phone: '138****1010', joinDate: '2020-01-15', status: '在职' },
        { id: 11, name: '陈浩', dept: '人事行政部', position: '部门经理', phone: '138****1011', joinDate: '2019-08-01', status: '在职' },
        { id: 12, name: '黄婷', dept: '人事行政部', position: '招聘培训专员', phone: '138****1012', joinDate: '2021-07-01', status: '在职' },
        { id: 13, name: '吴刚', dept: '人事行政部', position: '行政后勤专员', phone: '138****1013', joinDate: '2022-01-10', status: '在职' },
        { id: 14, name: '刘洋', dept: '运营部', position: '部门经理', phone: '138****1014', joinDate: '2020-03-01', status: '在职' },
        { id: 15, name: '谢欣', dept: '运营部', position: '客户运营组长', phone: '138****1015', joinDate: '2021-09-15', status: '在职' },
        { id: 16, name: '杨梅', dept: '财务部', position: '财务总监', phone: '138****1016', joinDate: '2018-06-01', status: '在职' },
        { id: 17, name: '李雪梅', dept: '会计部', position: '会计', phone: '138****1017', joinDate: '2024-12-01', status: '在职' },
        { id: 18, name: '陈志强', dept: '工商部', position: '业务员', phone: '138****1018', joinDate: '2024-12-01', status: '在职' },
        { id: 19, name: '王小丽', dept: '运营部', position: '运营专员', phone: '138****1019', joinDate: '2024-12-01', status: '在职' }
    ],

    currentTab: 'orgchart',

    init() {
        const contentArea = document.querySelector('.content-area');
        contentArea.innerHTML = this.render();
        this.bindEvents();
    },

    destroy() {},

    render() {
        const totalHeadcount = this.employees.length;
        const depts = [...new Set(this.employees.map(e => e.dept))];

        return `
        <div class="hr-org-page">
            <div class="hr-org-header">
                <h2>公司组织框架</h2>
                <div class="hr-org-stats">
                    <span class="org-stat-badge">总人数 <strong>${totalHeadcount}</strong></span>
                    <span class="org-stat-badge">部门 <strong>${depts.length}</strong></span>
                </div>
            </div>

            <div class="hr-org-tabs">
                <button class="hr-org-tab active" data-tab="orgchart">组织架构图</button>
                <button class="hr-org-tab" data-tab="roster">员工花名册</button>
                <button class="hr-org-tab" data-tab="deptinfo">部门信息</button>
            </div>

            <div class="hr-org-content" id="hr-org-content">
                ${this.renderOrgChart()}
            </div>
        </div>`;
    },

    renderOrgChart() {
        return `
        <div class="org-chart-container">
            <div class="org-chart">
                <div class="org-node root">
                    <div class="org-node-card root-card">
                        <div class="org-node-title">${this.orgData.name}</div>
                        <div class="org-node-person">${this.orgData.person}</div>
                        <div class="org-node-role">${this.orgData.title}</div>
                    </div>
                </div>
                <div class="org-tree-line"></div>
                <div class="org-level-2">
                    ${this.orgData.children.map(dept => `
                    <div class="org-dept-branch">
                        <div class="org-node-card dept-card">
                            <div class="org-node-title">${dept.name}</div>
                            <div class="org-node-person">${dept.person}</div>
                            <div class="org-node-role">${dept.title} · ${dept.headcount}人</div>
                        </div>
                        ${dept.children && dept.children.length > 0 ? `
                        <div class="org-sub-nodes">
                            ${dept.children.map(sub => `
                            <div class="org-node-card sub-card">
                                <div class="org-node-title">${sub.name}</div>
                                <div class="org-node-person">${sub.person}</div>
                                <div class="org-node-role">${sub.title} · ${sub.headcount}人</div>
                            </div>
                            `).join('')}
                        </div>` : ''}
                    </div>
                    `).join('')}
                </div>
            </div>
        </div>`;
    },

    renderRoster() {
        return `
        <div class="roster-container">
            <div class="roster-toolbar">
                <input type="text" class="search-input roster-search" placeholder="搜索员工姓名、部门...">
                <select class="filter-select roster-dept-filter">
                    <option value="">全部部门</option>
                    ${[...new Set(this.employees.map(e => e.dept))].map(d => `<option value="${d}">${d}</option>`).join('')}
                </select>
            </div>
            <div class="table-container">
                <table class="data-table">
                    <thead>
                        <tr>
                            <th>姓名</th>
                            <th>部门</th>
                            <th>职位</th>
                            <th>联系电话</th>
                            <th>入职日期</th>
                            <th>状态</th>
                        </tr>
                    </thead>
                    <tbody id="roster-tbody">
                        ${this.employees.map(emp => `
                        <tr>
                            <td><strong>${emp.name}</strong></td>
                            <td>${emp.dept}</td>
                            <td>${emp.position}</td>
                            <td>${emp.phone}</td>
                            <td>${emp.joinDate}</td>
                            <td><span class="status-badge status-active">${emp.status}</span></td>
                        </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        </div>`;
    },

    renderDeptInfo() {
        const deptStats = this.orgData.children.map(dept => {
            const empList = this.employees.filter(e => e.dept === dept.name || e.dept.includes(dept.name.replace('部', '')));
            return { ...dept, actualCount: empList.length };
        });

        return `
        <div class="dept-info-container">
            <div class="dept-cards-grid">
                ${deptStats.map(dept => `
                <div class="dept-info-card">
                    <div class="dept-info-header">
                        <h4>${dept.name}</h4>
                        <span class="dept-headcount">${dept.headcount}人</span>
                    </div>
                    <div class="dept-info-body">
                        <div class="dept-info-row">
                            <span class="dept-info-label">部门负责人</span>
                            <span class="dept-info-value">${dept.person}</span>
                        </div>
                        <div class="dept-info-row">
                            <span class="dept-info-label">职务</span>
                            <span class="dept-info-value">${dept.title}</span>
                        </div>
                        <div class="dept-info-row">
                            <span class="dept-info-label">下设团队</span>
                            <span class="dept-info-value">${dept.children && dept.children.length > 0 ? dept.children.map(c => c.name).join('、') : '无'}</span>
                        </div>
                    </div>
                </div>
                `).join('')}
            </div>
        </div>`;
    },

    bindEvents() {
        // Tab切换
        document.querySelectorAll('.hr-org-tab').forEach(tab => {
            tab.addEventListener('click', () => {
                document.querySelectorAll('.hr-org-tab').forEach(t => t.classList.remove('active'));
                tab.classList.add('active');
                this.currentTab = tab.dataset.tab;
                const content = document.getElementById('hr-org-content');
                if (this.currentTab === 'orgchart') content.innerHTML = this.renderOrgChart();
                else if (this.currentTab === 'roster') {
                    content.innerHTML = this.renderRoster();
                    this.bindRosterFilter();
                }
                else if (this.currentTab === 'deptinfo') content.innerHTML = this.renderDeptInfo();
            });
        });
    },

    bindRosterFilter() {
        const search = document.querySelector('.roster-search');
        const deptFilter = document.querySelector('.roster-dept-filter');
        const filterRoster = () => {
            const keyword = (search ? search.value : '').toLowerCase();
            const dept = deptFilter ? deptFilter.value : '';
            const filtered = this.employees.filter(emp => {
                const matchKeyword = !keyword || emp.name.includes(keyword) || emp.dept.includes(keyword) || emp.position.includes(keyword);
                const matchDept = !dept || emp.dept === dept;
                return matchKeyword && matchDept;
            });
            const tbody = document.getElementById('roster-tbody');
            if (tbody) {
                tbody.innerHTML = filtered.map(emp => `
                    <tr>
                        <td><strong>${emp.name}</strong></td>
                        <td>${emp.dept}</td>
                        <td>${emp.position}</td>
                        <td>${emp.phone}</td>
                        <td>${emp.joinDate}</td>
                        <td><span class="status-badge status-active">${emp.status}</span></td>
                    </tr>
                `).join('');
            }
        };
        if (search) search.addEventListener('input', filterRoster);
        if (deptFilter) deptFilter.addEventListener('change', filterRoster);
    }
};
