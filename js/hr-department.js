// 部门管理模块 - 浙杭企服
const HrDepartment = {
    departments: [],
    currentView: 'tree', // tree | list

    defaultDepartments: [
        { id: 'dept_001', name: '总经办', code: 'CEO', parentId: '', level: 1, manager: '陈总', managerPhone: '13800000001', status: 'active', headcount: 3, description: '公司最高管理层', createDate: '2020-01-01', sort: 1 },
        { id: 'dept_002', name: '顾问部', code: 'CONSULT', parentId: 'dept_001', level: 2, manager: '李明', managerPhone: '13800000002', status: 'active', headcount: 5, description: '企业顾问服务', createDate: '2020-01-15', sort: 1 },
        { id: 'dept_003', name: '会计部', code: 'ACCOUNT', parentId: 'dept_001', level: 2, manager: '王芳', managerPhone: '13800000003', status: 'active', headcount: 8, description: '财务会计核算', createDate: '2020-01-15', sort: 2 },
        { id: 'dept_004', name: '工商部', code: 'BUSINESS', parentId: 'dept_001', level: 2, manager: '张伟', managerPhone: '13800000004', status: 'active', headcount: 4, description: '工商注册变更', createDate: '2020-02-01', sort: 3 },
        { id: 'dept_005', name: '刻章部', code: 'SEAL', parentId: 'dept_001', level: 2, manager: '赵丽', managerPhone: '13800000005', status: 'active', headcount: 3, description: '公章刻制管理', createDate: '2020-02-01', sort: 4 },
        { id: 'dept_006', name: '人事部', code: 'HR', parentId: 'dept_001', level: 2, manager: '刘洋', managerPhone: '13800000006', status: 'active', headcount: 4, description: '人力资源管理', createDate: '2020-03-01', sort: 5 },
        { id: 'dept_007', name: '运营部', code: 'OPERATION', parentId: 'dept_001', level: 2, manager: '孙磊', managerPhone: '13800000007', status: 'active', headcount: 6, description: '市场运营推广', createDate: '2020-03-01', sort: 6 },
        { id: 'dept_008', name: '财务部', code: 'FINANCE', parentId: 'dept_001', level: 2, manager: '周敏', managerPhone: '13800000008', status: 'active', headcount: 3, description: '公司内部财务管理', createDate: '2020-01-15', sort: 7 },
        { id: 'dept_009', name: '技术部', code: 'TECH', parentId: 'dept_001', level: 2, manager: '吴强', managerPhone: '13800000009', status: 'active', headcount: 5, description: '信息技术支撑', createDate: '2021-06-01', sort: 8 },
        { id: 'dept_010', name: '招商加盟部', code: 'INVEST', parentId: 'dept_001', level: 2, manager: '郑浩', managerPhone: '13800000010', status: 'active', headcount: 4, description: '招商加盟拓展', createDate: '2022-01-01', sort: 9 },
    ],

    loadData() {
        const saved = localStorage.getItem('hr_departments');
        this.departments = saved ? JSON.parse(saved) : [...this.defaultDepartments];
        if (!saved) this.saveData();
    },

    saveData() {
        localStorage.setItem('hr_departments', JSON.stringify(this.departments));
    },

    generateId() {
        return 'dept_' + Date.now().toString(36) + Math.random().toString(36).substr(2, 5);
    },

    init() {
        this.loadData();
        this.render();
    },

    destroy() {},

    render() {
        const contentArea = document.querySelector('.content-area');
        contentArea.innerHTML = `
            <div class="hr-module">
                <div class="hr-module-header">
                    <h2><i class="fas fa-sitemap"></i> 部门管理</h2>
                    <div class="hr-header-actions">
                        <div class="hr-view-toggle">
                            <button class="btn-hr-toggle ${this.currentView === 'tree' ? 'active' : ''}" data-view="tree">
                                <i class="fas fa-project-diagram"></i> 树形
                            </button>
                            <button class="btn-hr-toggle ${this.currentView === 'list' ? 'active' : ''}" data-view="list">
                                <i class="fas fa-list"></i> 列表
                            </button>
                        </div>
                        <button class="btn-hr-primary" id="btn-add-dept">
                            <i class="fas fa-plus"></i> 新增部门
                        </button>
                    </div>
                </div>
                <div class="hr-module-stats">
                    ${this.renderStats()}
                </div>
                <div class="hr-module-body">
                    ${this.currentView === 'tree' ? this.renderTree() : this.renderList()}
                </div>
            </div>
        `;
        this.bindEvents();
    },

    renderStats() {
        const total = this.departments.length;
        const active = this.departments.filter(d => d.status === 'active').length;
        const totalHeadcount = this.departments.reduce((sum, d) => sum + (d.headcount || 0), 0);
        const topLevel = this.departments.filter(d => !d.parentId || d.parentId === '').length;
        return `
            <div class="hr-stat-cards">
                <div class="hr-stat-card">
                    <div class="hr-stat-number">${total}</div>
                    <div class="hr-stat-label">部门总数</div>
                </div>
                <div class="hr-stat-card">
                    <div class="hr-stat-number">${active}</div>
                    <div class="hr-stat-label">启用部门</div>
                </div>
                <div class="hr-stat-card">
                    <div class="hr-stat-number">${totalHeadcount}</div>
                    <div class="hr-stat-label">总编制人数</div>
                </div>
                <div class="hr-stat-card">
                    <div class="hr-stat-number">${topLevel}</div>
                    <div class="hr-stat-label">一级部门</div>
                </div>
            </div>
        `;
    },

    buildTree(parentId = '') {
        return this.departments
            .filter(d => (d.parentId || '') === parentId)
            .sort((a, b) => (a.sort || 0) - (b.sort || 0));
    },

    renderTree() {
        const roots = this.buildTree('');
        if (roots.length === 0) {
            return '<div class="hr-empty">暂无部门数据，请点击"新增部门"添加</div>';
        }
        return `<div class="dept-tree">${this.renderTreeNodes(roots)}</div>`;
    },

    renderTreeNodes(nodes, level = 0) {
        return nodes.map(node => {
            const children = this.buildTree(node.id);
            const hasChildren = children.length > 0;
            const statusClass = node.status === 'active' ? 'success' : 'danger';
            const statusText = node.status === 'active' ? '启用' : '停用';
            return `
                <div class="dept-tree-item" data-id="${node.id}" style="margin-left: ${level * 24}px;">
                    <div class="dept-tree-node">
                        <span class="dept-tree-expand ${hasChildren ? 'has-children' : ''}" data-action="toggle-expand" data-id="${node.id}">
                            ${hasChildren ? '<i class="fas fa-caret-down"></i>' : '<i class="fas fa-circle" style="font-size:6px;color:#cbd5e1;"></i>'}
                        </span>
                        <div class="dept-tree-info">
                            <span class="dept-tree-name">${node.name}</span>
                            <span class="dept-tree-code">${node.code}</span>
                            <span class="hr-badge ${statusClass}">${statusText}</span>
                        </div>
                        <div class="dept-tree-meta">
                            <span class="dept-tree-manager"><i class="fas fa-user-tie"></i> ${node.manager || '未设置'}</span>
                            <span class="dept-tree-count"><i class="fas fa-users"></i> ${node.headcount || 0}人</span>
                        </div>
                        <div class="dept-tree-actions">
                            <button class="hr-action-btn" data-action="add-child" data-id="${node.id}" title="添加子部门">
                                <i class="fas fa-plus"></i>
                            </button>
                            <button class="hr-action-btn" data-action="edit-dept" data-id="${node.id}" title="编辑">
                                <i class="fas fa-edit"></i>
                            </button>
                            <button class="hr-action-btn danger" data-action="delete-dept" data-id="${node.id}" title="删除">
                                <i class="fas fa-trash"></i>
                            </button>
                        </div>
                    </div>
                    ${hasChildren ? `<div class="dept-tree-children">${this.renderTreeNodes(children, level + 1)}</div>` : ''}
                </div>
            `;
        }).join('');
    },

    renderList() {
        if (this.departments.length === 0) {
            return '<div class="hr-empty">暂无部门数据</div>';
        }
        const rows = this.departments
            .sort((a, b) => (a.sort || 0) - (b.sort || 0))
            .map(dept => {
                const parent = this.departments.find(d => d.id === dept.parentId);
                const statusClass = dept.status === 'active' ? 'success' : 'danger';
                const statusText = dept.status === 'active' ? '启用' : '停用';
                return `
                    <tr>
                        <td>${dept.name}</td>
                        <td>${dept.code}</td>
                        <td>${parent ? parent.name : '—'}</td>
                        <td>${dept.manager || '未设置'}</td>
                        <td>${dept.headcount || 0}</td>
                        <td><span class="hr-badge ${statusClass}">${statusText}</span></td>
                        <td>${dept.createDate || ''}</td>
                        <td>
                            <button class="hr-action-btn" data-action="edit-dept" data-id="${dept.id}"><i class="fas fa-edit"></i></button>
                            <button class="hr-action-btn danger" data-action="delete-dept" data-id="${dept.id}"><i class="fas fa-trash"></i></button>
                        </td>
                    </tr>
                `;
            }).join('');

        return `
            <table class="hr-table">
                <thead>
                    <tr>
                        <th>部门名称</th>
                        <th>部门编码</th>
                        <th>上级部门</th>
                        <th>负责人</th>
                        <th>编制人数</th>
                        <th>状态</th>
                        <th>创建日期</th>
                        <th>操作</th>
                    </tr>
                </thead>
                <tbody>${rows}</tbody>
            </table>
        `;
    },

    showDeptModal(deptId, parentId) {
        const isEdit = !!deptId;
        const dept = isEdit ? this.departments.find(d => d.id === deptId) : null;
        const title = isEdit ? '编辑部门' : '新增部门';

        // 构建上级部门选项（排除自己及其子部门）
        const excludeIds = isEdit ? this.getDescendantIds(deptId).concat(deptId) : [];
        const parentOptions = this.departments
            .filter(d => !excludeIds.includes(d.id) && d.status === 'active')
            .map(d => `<option value="${d.id}" ${(dept ? dept.parentId : parentId || '') === d.id ? 'selected' : ''}>${d.name}</option>`)
            .join('');

        const modal = document.createElement('div');
        modal.className = 'hr-modal-overlay';
        modal.id = 'dept-modal';
        modal.innerHTML = `
            <div class="hr-modal" style="width:560px;">
                <div class="hr-modal-header">
                    <h3>${title}</h3>
                    <button class="hr-modal-close" data-action="close-modal">&times;</button>
                </div>
                <div class="hr-modal-body">
                    <form id="dept-form">
                        <input type="hidden" id="dept-id" value="${deptId || ''}">
                        <div class="hr-form-row">
                            <div class="hr-form-item">
                                <label>部门名称 <span class="required">*</span></label>
                                <input type="text" id="dept-name" value="${dept ? dept.name : ''}" required placeholder="请输入部门名称">
                            </div>
                            <div class="hr-form-item">
                                <label>部门编码 <span class="required">*</span></label>
                                <input type="text" id="dept-code" value="${dept ? dept.code : ''}" required placeholder="如: HR, TECH">
                            </div>
                        </div>
                        <div class="hr-form-row">
                            <div class="hr-form-item">
                                <label>上级部门</label>
                                <select id="dept-parent">
                                    <option value="">无（顶级部门）</option>
                                    ${parentOptions}
                                </select>
                            </div>
                            <div class="hr-form-item">
                                <label>排序号</label>
                                <input type="number" id="dept-sort" value="${dept ? (dept.sort || 1) : this.departments.length + 1}" min="1">
                            </div>
                        </div>
                        <div class="hr-form-row">
                            <div class="hr-form-item">
                                <label>部门负责人</label>
                                <input type="text" id="dept-manager" value="${dept ? (dept.manager || '') : ''}" placeholder="负责人姓名">
                            </div>
                            <div class="hr-form-item">
                                <label>负责人电话</label>
                                <input type="text" id="dept-manager-phone" value="${dept ? (dept.managerPhone || '') : ''}" placeholder="联系电话">
                            </div>
                        </div>
                        <div class="hr-form-row">
                            <div class="hr-form-item">
                                <label>编制人数</label>
                                <input type="number" id="dept-headcount" value="${dept ? (dept.headcount || 0) : 5}" min="0">
                            </div>
                            <div class="hr-form-item">
                                <label>状态</label>
                                <select id="dept-status">
                                    <option value="active" ${(!dept || dept.status === 'active') ? 'selected' : ''}>启用</option>
                                    <option value="inactive" ${dept && dept.status === 'inactive' ? 'selected' : ''}>停用</option>
                                </select>
                            </div>
                        </div>
                        <div class="hr-form-item" style="width:100%;">
                            <label>部门描述</label>
                            <textarea id="dept-desc" rows="3" placeholder="部门职责描述">${dept ? (dept.description || '') : ''}</textarea>
                        </div>
                    </form>
                </div>
                <div class="hr-modal-footer">
                    <button class="btn-hr-secondary" data-action="close-modal">取消</button>
                    <button class="btn-hr-primary" data-action="save-dept">保存</button>
                </div>
            </div>
        `;
        document.body.appendChild(modal);
        setTimeout(() => modal.classList.add('show'), 10);
        this.bindModalEvents(modal);
    },

    getDescendantIds(deptId) {
        const ids = [];
        const children = this.departments.filter(d => d.parentId === deptId);
        children.forEach(c => {
            ids.push(c.id);
            ids.push(...this.getDescendantIds(c.id));
        });
        return ids;
    },

    saveDept() {
        const form = document.getElementById('dept-form');
        const nameInput = document.getElementById('dept-name');
        const codeInput = document.getElementById('dept-code');
        if (!nameInput.value.trim() || !codeInput.value.trim()) {
            alert('请填写部门名称和部门编码');
            return;
        }

        const id = document.getElementById('dept-id').value;
        const parentId = document.getElementById('dept-parent').value;
        const parentDept = parentId ? this.departments.find(d => d.id === parentId) : null;
        const level = parentDept ? (parentDept.level || 1) + 1 : 1;

        const deptData = {
            name: nameInput.value.trim(),
            code: codeInput.value.trim().toUpperCase(),
            parentId: parentId,
            level: level,
            manager: document.getElementById('dept-manager').value.trim(),
            managerPhone: document.getElementById('dept-manager-phone').value.trim(),
            headcount: parseInt(document.getElementById('dept-headcount').value) || 0,
            status: document.getElementById('dept-status').value,
            description: document.getElementById('dept-desc').value.trim(),
            sort: parseInt(document.getElementById('dept-sort').value) || 1
        };

        if (id) {
            const idx = this.departments.findIndex(d => d.id === id);
            if (idx > -1) {
                this.departments[idx] = { ...this.departments[idx], ...deptData };
            }
        } else {
            deptData.id = this.generateId();
            deptData.createDate = new Date().toISOString().split('T')[0];
            this.departments.push(deptData);
        }

        this.saveData();
        this.closeModal();
        this.render();
    },

    deleteDept(id) {
        const dept = this.departments.find(d => d.id === id);
        if (!dept) return;
        const children = this.departments.filter(d => d.parentId === id);
        if (children.length > 0) {
            alert(`部门"${dept.name}"下还有${children.length}个子部门，请先删除或转移子部门`);
            return;
        }
        if (!confirm(`确定删除部门"${dept.name}"吗？`)) return;
        this.departments = this.departments.filter(d => d.id !== id);
        this.saveData();
        this.render();
    },

    closeModal() {
        const modal = document.getElementById('dept-modal');
        if (modal) {
            modal.classList.remove('show');
            setTimeout(() => modal.remove(), 200);
        }
    },

    bindEvents() {
        const contentArea = document.querySelector('.content-area');
        contentArea.addEventListener('click', (e) => {
            const btn = e.target.closest('[data-action]');
            if (!btn) return;
            const action = btn.dataset.action;
            const id = btn.dataset.id;

            switch (action) {
                case 'add-child':
                    this.showDeptModal(null, id);
                    break;
                case 'edit-dept':
                    this.showDeptModal(id);
                    break;
                case 'delete-dept':
                    this.deleteDept(id);
                    break;
                case 'toggle-expand':
                    const treeItem = btn.closest('.dept-tree-item');
                    if (treeItem) treeItem.classList.toggle('collapsed');
                    break;
            }
        });

        // 新增按钮
        const addBtn = document.getElementById('btn-add-dept');
        if (addBtn) addBtn.addEventListener('click', () => this.showDeptModal());

        // 视图切换
        contentArea.querySelectorAll('.btn-hr-toggle').forEach(btn => {
            btn.addEventListener('click', () => {
                this.currentView = btn.dataset.view;
                this.render();
            });
        });
    },

    bindModalEvents(modal) {
        modal.addEventListener('click', (e) => {
            const btn = e.target.closest('[data-action]');
            if (!btn) {
                if (e.target === modal) this.closeModal();
                return;
            }
            const action = btn.dataset.action;
            if (action === 'close-modal') this.closeModal();
            if (action === 'save-dept') this.saveDept();
        });
    },

    // 公共API：供其他模块调用获取部门列表
    getDepartments() {
        const saved = localStorage.getItem('hr_departments');
        return saved ? JSON.parse(saved) : this.defaultDepartments;
    },

    getActiveDepartments() {
        return this.getDepartments().filter(d => d.status === 'active');
    },

    getDeptName(id) {
        const depts = this.getDepartments();
        const dept = depts.find(d => d.id === id);
        return dept ? dept.name : '';
    }
};
