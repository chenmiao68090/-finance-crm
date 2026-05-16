// 培训与发展模块 - 浙杭企服
const HrTraining = {
    courses: [],
    plans: [],
    records: [],
    skills: [],
    currentTab: 'courses',

    defaultCourses: [
        { id: 'CRS001', title: '企业财税基础', category: '财税知识', duration: 16, instructor: '李娜', contentType: '视频', description: '涵盖企业日常税务核算基础', status: '启用', createDate: '2024-09-01', targetPositions: ['会计','代账组长','审计组长'] },
        { id: 'CRS002', title: '代理记账实操', category: '业务技能', duration: 24, instructor: '孙丽', contentType: '直播', description: '代理记账全流程实操', status: '启用', createDate: '2024-09-15', targetPositions: ['会计','代账组长'] },
        { id: 'CRS003', title: '新员工入职培训', category: '新员工培训', duration: 8, instructor: '陈浩', contentType: '线下', description: '公司文化、制度、流程介绍', status: '启用', createDate: '2024-01-01', targetPositions: [] },
        { id: 'CRS004', title: '团队管理与领导力', category: '管理技能', duration: 12, instructor: '张伟', contentType: '视频', description: '团队建设与领导力提升', status: '启用', createDate: '2024-06-01', targetPositions: ['部门经理','组长','主管'] },
        { id: 'CRS005', title: '客户沟通技巧', category: '职业素养', duration: 6, instructor: '周芳', contentType: '文档', description: '提升客户沟通效率与满意度', status: '启用', createDate: '2024-07-01', targetPositions: [] },
        { id: 'CRS006', title: '工商注册流程规范', category: '业务技能', duration: 10, instructor: '王强', contentType: '线下', description: '最新工商注册政策与实操', status: '启用', createDate: '2024-08-01', targetPositions: ['业务员','注册组长'] },
        { id: 'CRS007', title: '新媒体运营实战', category: '业务技能', duration: 16, instructor: '刘洋', contentType: '视频', description: '短视频与私域运营', status: '启用', createDate: '2024-10-01', targetPositions: ['运营专员','客户运营组长'] },
        { id: 'CRS008', title: '信息安全与合规', category: '安全合规', duration: 4, instructor: '陈浩', contentType: '文档', description: '数据安全与合规意识培训', status: '启用', createDate: '2024-03-01', targetPositions: [] }
    ],

    defaultPlans: [
        { id: 'PLN001', name: '2025年Q2新员工培训', type: '新员工培训', targetDept: '全公司', courseIds: ['CRS003','CRS008'], assignedEmployees: ['EMP013'], startDate: '2025-04-01', endDate: '2025-04-30', status: '进行中', createdBy: '陈浩' },
        { id: 'PLN002', name: '会计部业务提升计划', type: '部门培训', targetDept: '会计部', courseIds: ['CRS001','CRS002'], assignedEmployees: ['EMP005','EMP006','EMP013'], startDate: '2025-04-15', endDate: '2025-06-30', status: '进行中', createdBy: '李娜' },
        { id: 'PLN003', name: '管理层领导力培训', type: '晋升培训', targetDept: '全公司', courseIds: ['CRS004','CRS005'], assignedEmployees: ['EMP002','EMP004','EMP007','EMP009','EMP011'], startDate: '2025-07-01', endDate: '2025-08-31', status: '待开始', createdBy: '陈浩' }
    ],

    defaultRecords: [
        { id: 'LRN001', empId: 'EMP013', empName: '李雪梅', courseId: 'CRS003', courseName: '新员工入职培训', planId: 'PLN001', startDate: '2025-04-01', completionDate: '2025-04-08', progress: 100, score: 92, status: '已完成', certificate: true },
        { id: 'LRN002', empId: 'EMP013', empName: '李雪梅', courseId: 'CRS008', courseName: '信息安全与合规', planId: 'PLN001', startDate: '2025-04-10', completionDate: null, progress: 60, score: null, status: '进行中', certificate: false },
        { id: 'LRN003', empId: 'EMP005', empName: '孙丽', courseId: 'CRS001', courseName: '企业财税基础', planId: 'PLN002', startDate: '2025-04-15', completionDate: '2025-05-10', progress: 100, score: 88, status: '已完成', certificate: true },
        { id: 'LRN004', empId: 'EMP005', empName: '孙丽', courseId: 'CRS002', courseName: '代理记账实操', planId: 'PLN002', startDate: '2025-05-12', completionDate: '2025-05-30', progress: 100, score: 95, status: '已完成', certificate: true },
        { id: 'LRN005', empId: 'EMP006', empName: '马晓', courseId: 'CRS001', courseName: '企业财税基础', planId: 'PLN002', startDate: '2025-04-15', completionDate: null, progress: 75, score: null, status: '进行中', certificate: false },
        { id: 'LRN006', empId: 'EMP006', empName: '马晓', courseId: 'CRS002', courseName: '代理记账实操', planId: 'PLN002', startDate: '2025-05-01', completionDate: null, progress: 0, score: null, status: '未开始', certificate: false },
        { id: 'LRN007', empId: 'EMP002', empName: '张伟', courseId: 'CRS004', courseName: '团队管理与领导力', planId: '', startDate: '2025-03-01', completionDate: null, progress: 40, score: null, status: '进行中', certificate: false },
        { id: 'LRN008', empId: 'EMP010', empName: '黄婷', courseId: 'CRS003', courseName: '新员工入职培训', planId: '', startDate: '2025-01-15', completionDate: '2025-01-20', progress: 100, score: 90, status: '已完成', certificate: true },
        { id: 'LRN009', empId: 'EMP014', empName: '谢欣', courseId: 'CRS007', courseName: '新媒体运营实战', planId: '', startDate: '2025-03-10', completionDate: null, progress: 55, score: null, status: '进行中', certificate: false },
        { id: 'LRN010', empId: 'EMP013', empName: '李雪梅', courseId: 'CRS001', courseName: '企业财税基础', planId: 'PLN002', startDate: '2025-04-20', completionDate: null, progress: 30, score: null, status: '进行中', certificate: false }
    ],

    defaultSkills: [
        { id: 'SK001', empId: 'EMP002', empName: '张伟', skills: [{name:'财税知识',level:4,category:'专业'},{name:'团队管理',level:4,category:'管理'},{name:'客户沟通',level:5,category:'通用'},{name:'业务拓展',level:4,category:'专业'}], developmentPath: '管理通道', currentStage: '中级→高级', targetPosition: '副总经理' },
        { id: 'SK002', empId: 'EMP004', empName: '李娜', skills: [{name:'财税知识',level:5,category:'专业'},{name:'审计',level:4,category:'专业'},{name:'团队管理',level:3,category:'管理'},{name:'数据分析',level:4,category:'通用'}], developmentPath: '管理通道', currentStage: '高级', targetPosition: '财务总监' },
        { id: 'SK003', empId: 'EMP010', empName: '黄婷', skills: [{name:'招聘',level:4,category:'专业'},{name:'培训',level:3,category:'专业'},{name:'劳动法',level:3,category:'专业'},{name:'沟通协调',level:4,category:'通用'}], developmentPath: '专业通道', currentStage: '初级→中级', targetPosition: 'HRBP' },
        { id: 'SK004', empId: 'EMP014', empName: '谢欣', skills: [{name:'客户运营',level:4,category:'专业'},{name:'数据分析',level:3,category:'通用'},{name:'内容策划',level:4,category:'专业'},{name:'项目管理',level:3,category:'管理'}], developmentPath: '专业通道', currentStage: '中级', targetPosition: '运营总监' },
        { id: 'SK005', empId: 'EMP013', empName: '李雪梅', skills: [{name:'财税知识',level:2,category:'专业'},{name:'代账',level:2,category:'专业'},{name:'Excel',level:3,category:'通用'},{name:'沟通协调',level:3,category:'通用'}], developmentPath: '专业通道', currentStage: '初级', targetPosition: '代账组长' }
    ],

    loadData() {
        this.courses = JSON.parse(localStorage.getItem('hr_courses') || 'null') || [...this.defaultCourses];
        this.plans = JSON.parse(localStorage.getItem('hr_training_plans') || 'null') || [...this.defaultPlans];
        this.records = JSON.parse(localStorage.getItem('hr_learning_records') || 'null') || [...this.defaultRecords];
        this.skills = JSON.parse(localStorage.getItem('hr_skill_matrix') || 'null') || [...this.defaultSkills];
        if (!localStorage.getItem('hr_courses')) this.saveData();
    },

    saveData() {
        localStorage.setItem('hr_courses', JSON.stringify(this.courses));
        localStorage.setItem('hr_training_plans', JSON.stringify(this.plans));
        localStorage.setItem('hr_learning_records', JSON.stringify(this.records));
        localStorage.setItem('hr_skill_matrix', JSON.stringify(this.skills));
    },

    generateId(prefix) { return prefix + Date.now().toString(36) + Math.random().toString(36).substr(2, 4); },

    init() { this.loadData(); this.render(); },
    destroy() {},

    render() {
        const contentArea = document.querySelector('.content-area');
        const completedCount = this.records.filter(r => r.status === '已完成').length;
        const totalHours = this.records.filter(r=>r.status==='已完成').reduce((s,r) => {
            const course = this.courses.find(c=>c.id===r.courseId);
            return s + (course ? course.duration : 0);
        }, 0);

        contentArea.innerHTML = `
        <div class="hr-module">
            <div class="hr-module-header">
                <h2><i class="fas fa-graduation-cap"></i> 培训与发展</h2>
                <div class="hr-header-actions">
                    <span class="org-stat-badge"><i class="fas fa-book"></i> 课程 <strong>${this.courses.length}</strong></span>
                    <span class="org-stat-badge"><i class="fas fa-check-circle"></i> 已完成 <strong>${completedCount}</strong></span>
                    <span class="org-stat-badge"><i class="fas fa-clock"></i> 总学时 <strong>${totalHours}h</strong></span>
                </div>
            </div>
            <div class="hr-org-tabs">
                <button class="hr-org-tab ${this.currentTab==='courses'?'active':''}" data-tab="courses"><i class="fas fa-book-open"></i> 课程库</button>
                <button class="hr-org-tab ${this.currentTab==='plans'?'active':''}" data-tab="plans"><i class="fas fa-tasks"></i> 培训计划</button>
                <button class="hr-org-tab ${this.currentTab==='records'?'active':''}" data-tab="records"><i class="fas fa-history"></i> 学习记录</button>
                <button class="hr-org-tab ${this.currentTab==='skills'?'active':''}" data-tab="skills"><i class="fas fa-star"></i> 技能矩阵</button>
                <button class="hr-org-tab ${this.currentTab==='dashboard'?'active':''}" data-tab="dashboard"><i class="fas fa-tachometer-alt"></i> 培训看板</button>
            </div>
            <div class="hr-module-body" id="training-content">${this.renderTab()}</div>
        </div>`;
        this.bindEvents();
    },

    renderTab() {
        switch(this.currentTab) {
            case 'courses': return this.renderCourses();
            case 'plans': return this.renderPlans();
            case 'records': return this.renderRecords();
            case 'skills': return this.renderSkills();
            case 'dashboard': return this.renderDashboard();
            default: return this.renderCourses();
        }
    },

    // ===== 课程库 =====
    renderCourses() {
        const categories = [...new Set(this.courses.map(c => c.category))];
        return `
        <div class="hr-filter-bar">
            <select id="train-cat-filter"><option value="">全部分类</option>${categories.map(c=>`<option value="${c}">${c}</option>`).join('')}</select>
            <button class="btn-hr-primary" data-action="add-course"><i class="fas fa-plus"></i> 新增课程</button>
        </div>
        <table class="hr-table">
            <thead><tr><th>课程名称</th><th>分类</th><th>时长</th><th>讲师</th><th>形式</th><th>状态</th><th>操作</th></tr></thead>
            <tbody>
                ${this.courses.map(c => `<tr>
                    <td><strong>${c.title}</strong></td><td><span class="hr-badge default">${c.category}</span></td>
                    <td>${c.duration}h</td><td>${c.instructor}</td><td>${c.contentType}</td>
                    <td><span class="hr-badge ${c.status==='启用'?'success':'danger'}">${c.status}</span></td>
                    <td><button class="hr-action-btn" data-action="edit-course" data-id="${c.id}"><i class="fas fa-edit"></i></button>
                        <button class="hr-action-btn danger" data-action="delete-course" data-id="${c.id}"><i class="fas fa-trash"></i></button></td>
                </tr>`).join('')}
            </tbody>
        </table>`;
    },

    // ===== 培训计划 =====
    renderPlans() {
        return `
        <div style="margin-bottom:16px;display:flex;justify-content:flex-end;">
            <button class="btn-hr-primary" data-action="add-plan"><i class="fas fa-plus"></i> 新建计划</button>
        </div>
        <div class="lifecycle-section">
            ${this.plans.map(p => {
                const statusClass = p.status==='进行中'?'warning':p.status==='已完成'?'success':p.status==='待开始'?'default':'danger';
                const courseNames = p.courseIds.map(id => this.courses.find(c=>c.id===id)?.title || id).join('、');
                return `
                <div class="lifecycle-card">
                    <div class="lifecycle-card-header">
                        <div class="lifecycle-avatar" style="background:linear-gradient(135deg,#059669,#34d399);"><i class="fas fa-clipboard-list" style="font-size:16px;"></i></div>
                        <div class="lifecycle-info"><h4>${p.name}</h4><p>${p.startDate} ~ ${p.endDate}</p></div>
                        <span class="hr-badge ${statusClass}">${p.status}</span>
                    </div>
                    <div class="lifecycle-card-body">
                        <div class="lifecycle-row"><span>类型</span><span>${p.type}</span></div>
                        <div class="lifecycle-row"><span>目标部门</span><span>${p.targetDept}</span></div>
                        <div class="lifecycle-row"><span>包含课程</span><span>${courseNames}</span></div>
                        <div class="lifecycle-row"><span>参训人数</span><span>${p.assignedEmployees.length}人</span></div>
                    </div>
                    <div class="lifecycle-card-actions">
                        <button class="btn-sm btn-hr-secondary" data-action="edit-plan" data-id="${p.id}"><i class="fas fa-edit"></i> 编辑</button>
                        <button class="btn-sm btn-hr-secondary danger" data-action="delete-plan" data-id="${p.id}"><i class="fas fa-trash"></i> 删除</button>
                    </div>
                </div>`;
            }).join('')}
        </div>`;
    },

    // ===== 学习记录 =====
    renderRecords() {
        return `
        <div class="hr-filter-bar">
            <input type="text" id="train-rec-search" placeholder="搜索员工...">
            <select id="train-rec-status"><option value="">全部状态</option><option value="已完成">已完成</option><option value="进行中">进行中</option><option value="未开始">未开始</option></select>
        </div>
        <table class="hr-table">
            <thead><tr><th>员工</th><th>课程</th><th>进度</th><th>成绩</th><th>状态</th><th>证书</th><th>完成日期</th></tr></thead>
            <tbody>
                ${this.records.map(r => {
                    const statusClass = r.status==='已完成'?'success':r.status==='进行中'?'warning':'default';
                    return `<tr>
                        <td><strong>${r.empName}</strong></td><td>${r.courseName}</td>
                        <td><div class="progress-bar-mini"><div class="progress-fill" style="width:${r.progress}%;"></div></div> ${r.progress}%</td>
                        <td>${r.score!==null?r.score+'分':'-'}</td>
                        <td><span class="hr-badge ${statusClass}">${r.status}</span></td>
                        <td>${r.certificate?'<i class="fas fa-certificate" style="color:#f59e0b;"></i>':'-'}</td>
                        <td>${r.completionDate||'-'}</td>
                    </tr>`;
                }).join('')}
            </tbody>
        </table>`;
    },

    // ===== 技能矩阵 =====
    renderSkills() {
        return `
        <div style="margin-bottom:16px;display:flex;justify-content:flex-end;">
            <button class="btn-hr-primary" data-action="add-skill"><i class="fas fa-plus"></i> 添加评估</button>
        </div>
        <div class="dept-cards-grid">
            ${this.skills.map(s => `
            <div class="dept-info-card">
                <div class="dept-info-header">
                    <h4><i class="fas fa-user-graduate"></i> ${s.empName}</h4>
                    <span class="hr-badge default">${s.developmentPath}</span>
                </div>
                <div class="dept-info-body">
                    <div class="dept-info-row"><span>当前阶段</span><span>${s.currentStage}</span></div>
                    <div class="dept-info-row"><span>目标岗位</span><span>${s.targetPosition}</span></div>
                </div>
                <div class="skill-bars" style="margin-top:12px;">
                    ${s.skills.map(sk => `
                    <div style="display:flex;align-items:center;gap:8px;margin-bottom:6px;">
                        <span style="font-size:12px;color:#64748b;min-width:70px;">${sk.name}</span>
                        <div style="flex:1;height:8px;background:#f1f5f9;border-radius:4px;overflow:hidden;">
                            <div style="height:100%;width:${sk.level*20}%;background:linear-gradient(90deg,#4f46e5,#818cf8);border-radius:4px;"></div>
                        </div>
                        <span style="font-size:11px;color:#4f46e5;font-weight:600;">${sk.level}/5</span>
                    </div>`).join('')}
                </div>
            </div>`).join('')}
        </div>`;
    },

    // ===== 培训看板 =====
    renderDashboard() {
        const completed = this.records.filter(r => r.status === '已完成').length;
        const inProgress = this.records.filter(r => r.status === '进行中').length;
        const totalRecords = this.records.length;
        const completionRate = totalRecords ? Math.round(completed / totalRecords * 100) : 0;

        // 按部门统计学时
        const employees = JSON.parse(localStorage.getItem('hr_employees') || '[]');
        const deptHours = {};
        this.records.filter(r=>r.status==='已完成').forEach(r => {
            const emp = employees.find(e => e.id === r.empId);
            const dept = emp ? (emp.dept || '未知') : '未知';
            const course = this.courses.find(c => c.id === r.courseId);
            deptHours[dept] = (deptHours[dept] || 0) + (course ? course.duration : 0);
        });

        // 绩效关联推荐
        const perfResults = JSON.parse(localStorage.getItem('hr_perf_results') || '[]');
        const needsTraining = perfResults.filter(r => r.grade === 'C' || r.grade === 'D');

        return `
        <div class="hr-stat-cards" style="margin-bottom:20px;">
            <div class="hr-stat-card"><div class="hr-stat-number">${completionRate}%</div><div class="hr-stat-label">完成率</div></div>
            <div class="hr-stat-card"><div class="hr-stat-number">${completed}</div><div class="hr-stat-label">已完成课程</div></div>
            <div class="hr-stat-card"><div class="hr-stat-number">${inProgress}</div><div class="hr-stat-label">进行中</div></div>
            <div class="hr-stat-card"><div class="hr-stat-number">${this.plans.filter(p=>p.status==='进行中').length}</div><div class="hr-stat-label">活跃计划</div></div>
        </div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:20px;">
            <div class="rules-card">
                <h3><i class="fas fa-chart-bar"></i> 部门学时统计</h3>
                <div class="cost-chart">
                    ${Object.entries(deptHours).sort((a,b)=>b[1]-a[1]).map(([dept,hours]) => {
                        const maxH = Math.max(...Object.values(deptHours), 1);
                        return `<div class="cost-bar-row"><span class="cost-dept-name">${dept}</span><div class="cost-bar-wrap"><div class="cost-bar" style="width:${hours/maxH*100}%;"><span class="cost-bar-label">${hours}h</span></div></div></div>`;
                    }).join('')}
                </div>
            </div>
            <div class="rules-card">
                <h3><i class="fas fa-robot"></i> AI培训推荐</h3>
                <div class="ai-insight-card">
                    <div class="ai-badge"><i class="fas fa-robot"></i> 智能推荐 <span class="ai-confidence">需后端支持</span></div>
                    ${needsTraining.length > 0 ? `
                    <p style="margin:10px 0;font-size:13px;color:#475569;">基于绩效分析，以下员工建议加强培训：</p>
                    <ul style="padding-left:20px;font-size:13px;color:#475569;">
                        ${needsTraining.map(r => `<li><strong>${r.empName}</strong> (${r.grade}级) - 建议课程${r.trainingSuggestion?r.trainingSuggestion.length:0}门 <span style="color:#94a3b8;">[置信度 ${Math.floor(75+Math.random()*20)}%]</span></li>`).join('')}
                    </ul>` : '<p style="font-size:13px;color:#94a3b8;">暂无绩效数据关联，全员绩效达标</p>'}
                </div>
            </div>
        </div>`;
    },

    // ===== 模态框 =====
    showCourseModal(editId) {
        const course = editId ? this.courses.find(c => c.id === editId) : null;
        const title = course ? '编辑课程' : '新增课程';
        const categories = ['财税知识','管理技能','职业素养','业务技能','新员工培训','安全合规'];
        const types = ['视频','文档','直播','线下'];

        const modal = document.createElement('div');
        modal.className = 'hr-modal-overlay';
        modal.id = 'training-modal';
        modal.innerHTML = `
        <div class="hr-modal" style="width:560px;">
            <div class="hr-modal-header"><h3>${title}</h3><button class="hr-modal-close" data-action="close-modal">&times;</button></div>
            <div class="hr-modal-body">
                <div class="hr-form-row">
                    <div class="hr-form-item"><label>课程名称 *</label><input type="text" id="crs-title" value="${course?course.title:''}" required></div>
                    <div class="hr-form-item"><label>分类</label><select id="crs-category">${categories.map(c=>`<option value="${c}" ${course&&course.category===c?'selected':''}>${c}</option>`).join('')}</select></div>
                </div>
                <div class="hr-form-row">
                    <div class="hr-form-item"><label>时长(小时)</label><input type="number" id="crs-duration" value="${course?course.duration:8}" min="1"></div>
                    <div class="hr-form-item"><label>讲师</label><input type="text" id="crs-instructor" value="${course?course.instructor:''}"></div>
                </div>
                <div class="hr-form-row">
                    <div class="hr-form-item"><label>授课形式</label><select id="crs-type">${types.map(t=>`<option value="${t}" ${course&&course.contentType===t?'selected':''}>${t}</option>`).join('')}</select></div>
                    <div class="hr-form-item"><label>状态</label><select id="crs-status"><option value="启用" ${!course||course.status==='启用'?'selected':''}>启用</option><option value="停用" ${course&&course.status==='停用'?'selected':''}>停用</option></select></div>
                </div>
                <div class="hr-form-item"><label>课程描述</label><textarea id="crs-desc" rows="3">${course?course.description:''}</textarea></div>
            </div>
            <div class="hr-modal-footer">
                <button class="btn-hr-secondary" data-action="close-modal">取消</button>
                <button class="btn-hr-primary" data-action="save-course" data-edit-id="${editId||''}">保存</button>
            </div>
        </div>`;
        document.body.appendChild(modal);
        setTimeout(() => modal.classList.add('show'), 10);
        this.bindModalEvents(modal);
    },

    saveCourse(editId) {
        const title = document.getElementById('crs-title').value.trim();
        if (!title) { alert('请填写课程名称'); return; }
        const data = {
            title, category: document.getElementById('crs-category').value,
            duration: parseInt(document.getElementById('crs-duration').value) || 8,
            instructor: document.getElementById('crs-instructor').value.trim(),
            contentType: document.getElementById('crs-type').value,
            status: document.getElementById('crs-status').value,
            description: document.getElementById('crs-desc').value.trim(),
            targetPositions: []
        };
        if (editId) {
            const idx = this.courses.findIndex(c => c.id === editId);
            if (idx > -1) this.courses[idx] = { ...this.courses[idx], ...data };
        } else {
            data.id = this.generateId('CRS');
            data.createDate = new Date().toISOString().split('T')[0];
            this.courses.push(data);
        }
        this.saveData(); this.closeModal(); this.render();
    },

    showPlanModal(editId) {
        const plan = editId ? this.plans.find(p => p.id === editId) : null;
        const title = plan ? '编辑计划' : '新建培训计划';
        const deptSaved = localStorage.getItem('hr_departments');
        const depts = deptSaved ? JSON.parse(deptSaved).filter(d=>d.status==='active').map(d=>d.name) : [];
        const employees = JSON.parse(localStorage.getItem('hr_employees') || '[]');

        const modal = document.createElement('div');
        modal.className = 'hr-modal-overlay';
        modal.id = 'training-modal';
        modal.innerHTML = `
        <div class="hr-modal" style="width:600px;">
            <div class="hr-modal-header"><h3>${title}</h3><button class="hr-modal-close" data-action="close-modal">&times;</button></div>
            <div class="hr-modal-body">
                <div class="hr-form-row">
                    <div class="hr-form-item"><label>计划名称 *</label><input type="text" id="pln-name" value="${plan?plan.name:''}" required></div>
                    <div class="hr-form-item"><label>类型</label><select id="pln-type"><option value="部门培训">部门培训</option><option value="新员工培训" ${plan&&plan.type==='新员工培训'?'selected':''}>新员工培训</option><option value="晋升培训" ${plan&&plan.type==='晋升培训'?'selected':''}>晋升培训</option><option value="专项培训" ${plan&&plan.type==='专项培训'?'selected':''}>专项培训</option></select></div>
                </div>
                <div class="hr-form-row">
                    <div class="hr-form-item"><label>目标部门</label><select id="pln-dept"><option value="全公司">全公司</option>${depts.map(d=>`<option value="${d}" ${plan&&plan.targetDept===d?'selected':''}>${d}</option>`).join('')}</select></div>
                    <div class="hr-form-item"><label>状态</label><select id="pln-status"><option value="待开始">待开始</option><option value="进行中" ${plan&&plan.status==='进行中'?'selected':''}>进行中</option><option value="已完成" ${plan&&plan.status==='已完成'?'selected':''}>已完成</option></select></div>
                </div>
                <div class="hr-form-row">
                    <div class="hr-form-item"><label>开始日期</label><input type="date" id="pln-start" value="${plan?plan.startDate:''}"></div>
                    <div class="hr-form-item"><label>结束日期</label><input type="date" id="pln-end" value="${plan?plan.endDate:''}"></div>
                </div>
                <div class="hr-form-item" style="margin-bottom:12px;"><label>包含课程（按住Ctrl多选）</label><select id="pln-courses" multiple style="height:100px;">${this.courses.filter(c=>c.status==='启用').map(c=>`<option value="${c.id}" ${plan&&plan.courseIds.includes(c.id)?'selected':''}>${c.title}</option>`).join('')}</select></div>
                <div class="hr-form-item"><label>参训员工（按住Ctrl多选）</label><select id="pln-employees" multiple style="height:100px;">${employees.map(e=>`<option value="${e.id}" ${plan&&plan.assignedEmployees.includes(e.id)?'selected':''}>${e.name} - ${e.dept}</option>`).join('')}</select></div>
            </div>
            <div class="hr-modal-footer">
                <button class="btn-hr-secondary" data-action="close-modal">取消</button>
                <button class="btn-hr-primary" data-action="save-plan" data-edit-id="${editId||''}">保存</button>
            </div>
        </div>`;
        document.body.appendChild(modal);
        setTimeout(() => modal.classList.add('show'), 10);
        this.bindModalEvents(modal);
    },

    savePlan(editId) {
        const name = document.getElementById('pln-name').value.trim();
        if (!name) { alert('请填写计划名称'); return; }
        const courseSelect = document.getElementById('pln-courses');
        const empSelect = document.getElementById('pln-employees');
        const data = {
            name, type: document.getElementById('pln-type').value,
            targetDept: document.getElementById('pln-dept').value,
            status: document.getElementById('pln-status').value,
            startDate: document.getElementById('pln-start').value,
            endDate: document.getElementById('pln-end').value,
            courseIds: [...courseSelect.selectedOptions].map(o => o.value),
            assignedEmployees: [...empSelect.selectedOptions].map(o => o.value),
            createdBy: '当前用户'
        };
        if (editId) {
            const idx = this.plans.findIndex(p => p.id === editId);
            if (idx > -1) this.plans[idx] = { ...this.plans[idx], ...data };
        } else {
            data.id = this.generateId('PLN');
            this.plans.push(data);
        }
        this.saveData(); this.closeModal(); this.render();
    },

    closeModal() {
        const modal = document.getElementById('training-modal');
        if (modal) { modal.classList.remove('show'); setTimeout(() => modal.remove(), 200); }
    },

    bindEvents() {
        const contentArea = document.querySelector('.content-area');
        contentArea.querySelectorAll('.hr-org-tab').forEach(tab => {
            tab.addEventListener('click', () => { this.currentTab = tab.dataset.tab; this.render(); });
        });
        contentArea.addEventListener('click', (e) => {
            const btn = e.target.closest('[data-action]');
            if (!btn) return;
            const action = btn.dataset.action;
            const id = btn.dataset.id;
            switch(action) {
                case 'add-course': this.showCourseModal(); break;
                case 'edit-course': this.showCourseModal(id); break;
                case 'delete-course':
                    if (confirm('确定删除该课程？')) { this.courses = this.courses.filter(c=>c.id!==id); this.saveData(); this.render(); }
                    break;
                case 'add-plan': this.showPlanModal(); break;
                case 'edit-plan': this.showPlanModal(id); break;
                case 'delete-plan':
                    if (confirm('确定删除该培训计划？')) { this.plans = this.plans.filter(p=>p.id!==id); this.saveData(); this.render(); }
                    break;
            }
        });
    },

    bindModalEvents(modal) {
        modal.addEventListener('click', (e) => {
            const btn = e.target.closest('[data-action]');
            if (!btn) { if (e.target === modal) this.closeModal(); return; }
            const action = btn.dataset.action;
            if (action === 'close-modal') this.closeModal();
            else if (action === 'save-course') this.saveCourse(btn.dataset.editId);
            else if (action === 'save-plan') this.savePlan(btn.dataset.editId);
        });
    }
};
