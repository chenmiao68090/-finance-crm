// 系统管理 - 人员权限管理模块

const SystemPermissions = {
    storageKey: 'zhqf_permissions',
    roles: [],
    members: [],

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
            const data = JSON.parse(saved);
            this.roles = data.roles;
            this.members = data.members;
        } else {
            this.seedData();
        }
    },

    saveData() {
        localStorage.setItem(this.storageKey, JSON.stringify({ roles: this.roles, members: this.members }));
    },

    seedData() {
        this.roles = [
            {
                id: 'admin',
                name: '超级管理员',
                desc: '拥有系统所有权限，可管理所有模块和用户',
                permissions: ['dashboard', 'leads', 'orders', 'contracts', 'finance', 'finance_journal', 'hr', 'performance', 'messages', 'announcements', 'system', 'expense'],
                isSystem: true
            },
            {
                id: 'manager',
                name: '部门经理',
                desc: '可查看本部门数据，管理下属人员',
                permissions: ['dashboard', 'leads', 'orders', 'contracts', 'finance', 'hr', 'performance', 'messages', 'announcements'],
                isSystem: false
            },
            {
                id: 'finance',
                name: '财务人员',
                desc: '管理公司财务数据、日记账、报销审批',
                permissions: ['dashboard', 'finance', 'finance_journal', 'expense', 'contracts', 'messages', 'announcements'],
                isSystem: false
            },
            {
                id: 'sales',
                name: '业务人员',
                desc: '管理线索、订单和客户跟进',
                permissions: ['dashboard', 'leads', 'orders', 'contracts', 'messages', 'announcements'],
                isSystem: false
            },
            {
                id: 'hr_role',
                name: '人事专员',
                desc: '管理人事相关模块和员工信息',
                permissions: ['dashboard', 'hr', 'performance', 'messages', 'announcements'],
                isSystem: false
            },
            {
                id: 'viewer',
                name: '只读用户',
                desc: '仅查看权限，无法编辑任何数据',
                permissions: ['dashboard', 'messages', 'announcements'],
                isSystem: false
            }
        ];

        this.members = [
            { id: 1, name: '陈总', email: 'admin@zhqf.com', dept: '总经理办公室', role: 'admin', status: '启用' },
            { id: 2, name: '张伟', email: 'zhangwei@zhqf.com', dept: '顾问部', role: 'manager', status: '启用' },
            { id: 3, name: '李娜', email: 'lina@zhqf.com', dept: '会计部', role: 'finance', status: '启用' },
            { id: 4, name: '王强', email: 'wangqiang@zhqf.com', dept: '工商部', role: 'manager', status: '启用' },
            { id: 5, name: '赵敏', email: 'zhaomin@zhqf.com', dept: '刻章部', role: 'manager', status: '启用' },
            { id: 6, name: '陈浩', email: 'chenhao@zhqf.com', dept: '人事行政部', role: 'hr_role', status: '启用' },
            { id: 7, name: '刘洋', email: 'liuyang@zhqf.com', dept: '运营部', role: 'manager', status: '启用' },
            { id: 8, name: '杨梅', email: 'yangmei@zhqf.com', dept: '财务部', role: 'finance', status: '启用' },
            { id: 9, name: '周芳', email: 'zhoufang@zhqf.com', dept: '顾问部', role: 'sales', status: '启用' },
            { id: 10, name: '孙丽', email: 'sunli@zhqf.com', dept: '会计部', role: 'finance', status: '启用' },
            { id: 11, name: '郑明', email: 'zhengming@zhqf.com', dept: '工商部', role: 'sales', status: '启用' },
            { id: 12, name: '实习生-小李', email: 'xiaoli@zhqf.com', dept: '运营部', role: 'viewer', status: '启用' }
        ];

        this.saveData();
    },

    // 权限模块标签
    permissionLabels: {
        'dashboard': '驾驶舱',
        'leads': '线索管理',
        'orders': '订单管理',
        'contracts': '合同管理',
        'finance': '财务管理',
        'finance_journal': '公司日记账',
        'hr': '人事管理',
        'performance': '绩效管理',
        'messages': '消息',
        'announcements': '公告',
        'system': '系统管理',
        'expense': '报销管理'
    },

    currentTab: 'members',

    render() {
        return `
        <div class="sp-page">
            <div class="sp-header">
                <h2>人员权限管理</h2>
            </div>

            <div class="sp-tabs">
                <button class="sp-tab active" data-tab="members">成员管理</button>
                <button class="sp-tab" data-tab="roles">角色权限</button>
            </div>

            <div class="sp-content" id="sp-content">
                ${this.renderMembers()}
            </div>
        </div>`;
    },

    renderMembers() {
        return `
        <div class="sp-members">
            <div class="sp-toolbar">
                <input type="text" class="search-input sp-search" placeholder="搜索成员..." id="sp-member-search">
                <button class="btn-primary btn-small" id="btn-add-member">+ 添加成员</button>
            </div>
            <div class="table-container">
                <table class="data-table">
                    <thead>
                        <tr>
                            <th>姓名</th>
                            <th>邮箱</th>
                            <th>部门</th>
                            <th>角色</th>
                            <th>状态</th>
                            <th>操作</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${this.members.map(m => {
                            const role = this.roles.find(r => r.id === m.role);
                            return `
                            <tr>
                                <td><strong>${m.name}</strong></td>
                                <td>${m.email}</td>
                                <td>${m.dept}</td>
                                <td><span class="sp-role-tag">${role ? role.name : m.role}</span></td>
                                <td><span class="status-badge ${m.status === '启用' ? 'status-active' : 'status-expired'}">${m.status}</span></td>
                                <td>
                                    <button class="btn-small btn-primary sp-btn-edit" data-id="${m.id}">编辑</button>
                                    ${m.role !== 'admin' ? `<button class="btn-small btn-danger sp-btn-toggle" data-id="${m.id}">${m.status === '启用' ? '禁用' : '启用'}</button>` : ''}
                                </td>
                            </tr>`;
                        }).join('')}
                    </tbody>
                </table>
            </div>
        </div>`;
    },

    renderRoles() {
        return `
        <div class="sp-roles">
            ${this.roles.map(role => `
            <div class="sp-role-card">
                <div class="sp-role-header">
                    <div>
                        <h4>${role.name} ${role.isSystem ? '<span class="sp-system-badge">系统</span>' : ''}</h4>
                        <p class="sp-role-desc">${role.desc}</p>
                    </div>
                    <span class="sp-role-count">${this.members.filter(m => m.role === role.id).length} 人</span>
                </div>
                <div class="sp-role-perms">
                    ${role.permissions.map(p => `<span class="sp-perm-tag">${this.permissionLabels[p] || p}</span>`).join('')}
                </div>
            </div>
            `).join('')}
        </div>`;
    },

    bindEvents() {
        // Tab
        document.querySelectorAll('.sp-tab').forEach(tab => {
            tab.addEventListener('click', () => {
                document.querySelectorAll('.sp-tab').forEach(t => t.classList.remove('active'));
                tab.classList.add('active');
                this.currentTab = tab.dataset.tab;
                const content = document.getElementById('sp-content');
                content.innerHTML = this.currentTab === 'members' ? this.renderMembers() : this.renderRoles();
                this.bindContentEvents();
            });
        });

        this.bindContentEvents();
    },

    bindContentEvents() {
        // 搜索
        const search = document.getElementById('sp-member-search');
        if (search) {
            search.addEventListener('input', () => {
                const keyword = search.value.toLowerCase();
                document.querySelectorAll('.sp-members tbody tr').forEach(tr => {
                    const text = tr.textContent.toLowerCase();
                    tr.style.display = text.includes(keyword) ? '' : 'none';
                });
            });
        }

        // 添加成员
        const btnAdd = document.getElementById('btn-add-member');
        if (btnAdd) btnAdd.addEventListener('click', () => this.showMemberForm());

        // 编辑
        document.querySelectorAll('.sp-btn-edit').forEach(btn => {
            btn.addEventListener('click', () => {
                const id = parseInt(btn.dataset.id);
                const member = this.members.find(m => m.id === id);
                if (member) this.showMemberForm(member);
            });
        });

        // 启用/禁用
        document.querySelectorAll('.sp-btn-toggle').forEach(btn => {
            btn.addEventListener('click', () => {
                const id = parseInt(btn.dataset.id);
                const member = this.members.find(m => m.id === id);
                if (member) {
                    member.status = member.status === '启用' ? '禁用' : '启用';
                    this.saveData();
                    const content = document.getElementById('sp-content');
                    content.innerHTML = this.renderMembers();
                    this.bindContentEvents();
                }
            });
        });
    },

    showMemberForm(member) {
        const isEdit = !!member;
        const modal = document.createElement('div');
        modal.className = 'modal active';
        modal.innerHTML = `
            <div class="modal-content" style="max-width: 480px;">
                <div class="modal-header">
                    <h3>${isEdit ? '编辑成员' : '添加成员'}</h3>
                    <button class="modal-close">&times;</button>
                </div>
                <form id="sp-member-form">
                    <div class="form-group">
                        <label>姓名</label>
                        <input type="text" name="name" value="${isEdit ? member.name : ''}" required>
                    </div>
                    <div class="form-group">
                        <label>邮箱</label>
                        <input type="email" name="email" value="${isEdit ? member.email : ''}" required>
                    </div>
                    <div class="form-row">
                        <div class="form-group">
                            <label>部门</label>
                            <select name="dept" required>
                                ${['总经理办公室', '顾问部', '会计部', '工商部', '刻章部', '人事行政部', '运营部', '财务部'].map(d => `<option value="${d}" ${isEdit && member.dept === d ? 'selected' : ''}>${d}</option>`).join('')}
                            </select>
                        </div>
                        <div class="form-group">
                            <label>角色</label>
                            <select name="role" required>
                                ${this.roles.map(r => `<option value="${r.id}" ${isEdit && member.role === r.id ? 'selected' : ''}>${r.name}</option>`).join('')}
                            </select>
                        </div>
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

        modal.querySelector('#sp-member-form').addEventListener('submit', (e) => {
            e.preventDefault();
            const form = e.target;
            if (isEdit) {
                member.name = form.name.value;
                member.email = form.email.value;
                member.dept = form.dept.value;
                member.role = form.role.value;
            } else {
                this.members.push({
                    id: Date.now(),
                    name: form.name.value,
                    email: form.email.value,
                    dept: form.dept.value,
                    role: form.role.value,
                    status: '启用'
                });
            }
            this.saveData();
            modal.remove();
            const content = document.getElementById('sp-content');
            content.innerHTML = this.renderMembers();
            this.bindContentEvents();
        });
    }
};
