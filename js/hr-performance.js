// 绩效管理模块 - 浙杭企服
const HrPerformance = {
    cycles: [],
    goals: [],
    evaluations: [],
    results: [],
    currentTab: 'cycles',

    defaultCycles: [
        { id: 'CYC001', name: '2025年Q1季度绩效', type: '季度', year: 2025, quarter: 1, startDate: '2025-01-01', endDate: '2025-03-31', status: '已结束', dimensions: [{name:'工作业绩',weight:40,desc:'核心KPI完成情况'},{name:'工作态度',weight:20,desc:'责任心与主动性'},{name:'专业能力',weight:25,desc:'岗位技能水平'},{name:'团队协作',weight:15,desc:'跨部门沟通配合'}], evaluationMethod: '自评+上级' },
        { id: 'CYC002', name: '2025年Q2季度绩效', type: '季度', year: 2025, quarter: 2, startDate: '2025-04-01', endDate: '2025-06-30', status: '进行中', dimensions: [{name:'工作业绩',weight:40,desc:'核心KPI完成情况'},{name:'工作态度',weight:20,desc:'责任心与主动性'},{name:'专业能力',weight:25,desc:'岗位技能水平'},{name:'团队协作',weight:15,desc:'跨部门沟通配合'}], evaluationMethod: '自评+上级' }
    ],

    defaultGoals: [
        { id: 'GOAL001', cycleId: 'CYC002', empId: '', empName: '', dept: '', level: '公司', parentGoalId: '', title: 'Q2营收目标增长20%', keyResults: [{description:'总营收达到150万',target:150,current:98,unit:'万元'},{description:'新客户签约40家',target:40,current:22,unit:'家'}], progress: 55, status: '进行中', dueDate: '2025-06-30' },
        { id: 'GOAL002', cycleId: 'CYC002', empId: '', empName: '', dept: '顾问部', level: '部门', parentGoalId: 'GOAL001', title: '顾问部新增客户30家', keyResults: [{description:'新签客户30家',target:30,current:16,unit:'家'},{description:'续费率达90%',target:90,current:85,unit:'%'}], progress: 53, status: '进行中', dueDate: '2025-06-30' },
        { id: 'GOAL003', cycleId: 'CYC002', empId: '', empName: '', dept: '会计部', level: '部门', parentGoalId: 'GOAL001', title: '会计部代账客户留存率95%', keyResults: [{description:'留存率95%',target:95,current:92,unit:'%'},{description:'客户满意度4.5+',target:4.5,current:4.3,unit:'分'}], progress: 80, status: '进行中', dueDate: '2025-06-30' },
        { id: 'GOAL004', cycleId: 'CYC002', empId: 'EMP002', empName: '张伟', dept: '顾问部', level: '个人', parentGoalId: 'GOAL002', title: '个人签约15家新客户', keyResults: [{description:'新签客户15家',target:15,current:9,unit:'家'}], progress: 60, status: '进行中', dueDate: '2025-06-30' },
        { id: 'GOAL005', cycleId: 'CYC002', empId: 'EMP003', empName: '周芳', dept: '顾问部', level: '个人', parentGoalId: 'GOAL002', title: '带队完成客户维护20家', keyResults: [{description:'维护客户20家',target:20,current:14,unit:'家'}], progress: 70, status: '进行中', dueDate: '2025-06-30' },
        { id: 'GOAL006', cycleId: 'CYC002', empId: 'EMP004', empName: '李娜', dept: '会计部', level: '个人', parentGoalId: 'GOAL003', title: '代账出错率控制在1%以下', keyResults: [{description:'出错率<1%',target:1,current:0.8,unit:'%'}], progress: 80, status: '进行中', dueDate: '2025-06-30' },
        { id: 'GOAL007', cycleId: 'CYC002', empId: 'EMP011', empName: '刘洋', dept: '运营部', level: '个人', parentGoalId: 'GOAL001', title: '新媒体粉丝增长5000', keyResults: [{description:'全平台粉丝+5000',target:5000,current:3200,unit:'人'}], progress: 64, status: '进行中', dueDate: '2025-06-30' },
        { id: 'GOAL008', cycleId: 'CYC002', empId: 'EMP009', empName: '陈浩', dept: '人事行政部', level: '个人', parentGoalId: 'GOAL001', title: '完成Q2招聘3人到岗', keyResults: [{description:'招聘到岗3人',target:3,current:1,unit:'人'}], progress: 33, status: '进行中', dueDate: '2025-06-30' }
    ],

    defaultEvaluations: [
        { id: 'EVAL001', cycleId: 'CYC001', empId: 'EMP002', empName: '张伟', dept: '顾问部', position: '部门经理', selfScores: {工作业绩:85,工作态度:90,专业能力:88,团队协作:85}, selfComment: '完成年度目标的95%', managerScores: {工作业绩:88,工作态度:85,专业能力:90,团队协作:88}, managerComment: '业务能力强，需加强团队培养', compositeScore: 87.6, grade: 'A', status: '已完成', submitDate: '2025-04-05' },
        { id: 'EVAL002', cycleId: 'CYC001', empId: 'EMP003', empName: '周芳', dept: '顾问部', position: '组长', selfScores: {工作业绩:80,工作态度:85,专业能力:82,团队协作:80}, selfComment: '客户维护稳定', managerScores: {工作业绩:82,工作态度:83,专业能力:80,团队协作:82}, managerComment: '工作稳定，需提升主动性', compositeScore: 81.5, grade: 'A', status: '已完成', submitDate: '2025-04-05' },
        { id: 'EVAL003', cycleId: 'CYC001', empId: 'EMP004', empName: '李娜', dept: '会计部', position: '部门经理', selfScores: {工作业绩:92,工作态度:90,专业能力:95,团队协作:88}, selfComment: '零差错完成Q1核算', managerScores: {工作业绩:93,工作态度:88,专业能力:94,团队协作:90}, managerComment: '专业能力突出', compositeScore: 91.8, grade: 'S', status: '已完成', submitDate: '2025-04-05' },
        { id: 'EVAL004', cycleId: 'CYC001', empId: 'EMP005', empName: '孙丽', dept: '会计部', position: '代账组长', selfScores: {工作业绩:78,工作态度:82,专业能力:80,团队协作:75}, selfComment: '代账工作基本达标', managerScores: {工作业绩:80,工作态度:78,专业能力:79,团队协作:78}, managerComment: '需提高效率', compositeScore: 79.1, grade: 'B', status: '已完成', submitDate: '2025-04-05' },
        { id: 'EVAL005', cycleId: 'CYC001', empId: 'EMP006', empName: '马晓', dept: '会计部', position: '审计组长', selfScores: {工作业绩:72,工作态度:78,专业能力:76,团队协作:70}, selfComment: '审计项目延期1周', managerScores: {工作业绩:74,工作态度:75,专业能力:76,团队协作:72}, managerComment: '时间管理需加强', compositeScore: 74.4, grade: 'B', status: '已完成', submitDate: '2025-04-05' },
        { id: 'EVAL006', cycleId: 'CYC001', empId: 'EMP007', empName: '王强', dept: '工商部', position: '部门经理', selfScores: {工作业绩:82,工作态度:80,专业能力:85,团队协作:78}, selfComment: '完成注册业务指标', managerScores: {工作业绩:80,工作态度:78,专业能力:82,团队协作:80}, managerComment: '业务达标，团队管理有提升空间', compositeScore: 80.7, grade: 'A', status: '已完成', submitDate: '2025-04-05' },
        { id: 'EVAL007', cycleId: 'CYC001', empId: 'EMP008', empName: '赵敏', dept: '刻章部', position: '部门主管', selfScores: {工作业绩:70,工作态度:75,专业能力:72,团队协作:68}, selfComment: '刻章业务稳定', managerScores: {工作业绩:72,工作态度:73,专业能力:70,团队协作:70}, managerComment: '可考虑拓展业务范围', compositeScore: 71.5, grade: 'B', status: '已完成', submitDate: '2025-04-05' },
        { id: 'EVAL008', cycleId: 'CYC001', empId: 'EMP009', empName: '陈浩', dept: '人事行政部', position: '部门经理', selfScores: {工作业绩:86,工作态度:88,专业能力:84,团队协作:85}, selfComment: '完成年度招聘计划', managerScores: {工作业绩:85,工作态度:86,专业能力:85,团队协作:86}, managerComment: '人事工作有序推进', compositeScore: 85.3, grade: 'A', status: '已完成', submitDate: '2025-04-05' },
        { id: 'EVAL009', cycleId: 'CYC001', empId: 'EMP011', empName: '刘洋', dept: '运营部', position: '部门经理', selfScores: {工作业绩:88,工作态度:85,专业能力:90,团队协作:82}, selfComment: '新媒体数据增长显著', managerScores: {工作业绩:89,工作态度:85,专业能力:88,团队协作:85}, managerComment: '运营创新能力强', compositeScore: 87.6, grade: 'A', status: '已完成', submitDate: '2025-04-05' },
        { id: 'EVAL010', cycleId: 'CYC001', empId: 'EMP012', empName: '杨梅', dept: '财务部', position: '财务总监', selfScores: {工作业绩:93,工作态度:92,专业能力:95,团队协作:90}, selfComment: '财务管理体系完善', managerScores: {工作业绩:92,工作态度:90,专业能力:94,团队协作:91}, managerComment: '财务管控有效，值得肯定', compositeScore: 92.3, grade: 'S', status: '已完成', submitDate: '2025-04-05' },
        { id: 'EVAL011', cycleId: 'CYC001', empId: 'EMP013', empName: '李雪梅', dept: '会计部', position: '会计', selfScores: {工作业绩:65,工作态度:72,专业能力:60,团队协作:70}, selfComment: '作为新人还在学习中', managerScores: {工作业绩:68,工作态度:70,专业能力:62,团队协作:72}, managerComment: '新人期，需加强培训', compositeScore: 66.4, grade: 'C', status: '已完成', submitDate: '2025-04-05' },
        { id: 'EVAL012', cycleId: 'CYC001', empId: 'EMP010', empName: '黄婷', dept: '人事行政部', position: '招聘培训专员', selfScores: {工作业绩:76,工作态度:80,专业能力:74,团队协作:78}, selfComment: '完成招聘任务', managerScores: {工作业绩:78,工作态度:79,专业能力:76,团队协作:80}, managerComment: '工作认真，专业能力需提升', compositeScore: 77.6, grade: 'B', status: '已完成', submitDate: '2025-04-05' },
        { id: 'EVAL013', cycleId: 'CYC001', empId: 'EMP014', empName: '谢欣', dept: '运营部', position: '客户运营组长', selfScores: {工作业绩:84,工作态度:82,专业能力:80,团队协作:83}, selfComment: '客户满意度提升', managerScores: {工作业绩:83,工作态度:82,专业能力:82,团队协作:84}, managerComment: '客户运营有成效', compositeScore: 82.7, grade: 'A', status: '已完成', submitDate: '2025-04-05' }
    ],

    defaultResults: [
        { id: 'RES001', cycleId: 'CYC001', empId: 'EMP002', empName: '张伟', dept: '顾问部', compositeScore: 87.6, grade: 'A', performanceLevel: 4, potentialLevel: 3, salaryAdjustSuggestion: '+10%', trainingSuggestion: [], calibrated: true },
        { id: 'RES002', cycleId: 'CYC001', empId: 'EMP003', empName: '周芳', dept: '顾问部', compositeScore: 81.5, grade: 'A', performanceLevel: 4, potentialLevel: 2, salaryAdjustSuggestion: '+10%', trainingSuggestion: [], calibrated: true },
        { id: 'RES003', cycleId: 'CYC001', empId: 'EMP004', empName: '李娜', dept: '会计部', compositeScore: 91.8, grade: 'S', performanceLevel: 5, potentialLevel: 3, salaryAdjustSuggestion: '+15%', trainingSuggestion: [], calibrated: true },
        { id: 'RES004', cycleId: 'CYC001', empId: 'EMP005', empName: '孙丽', dept: '会计部', compositeScore: 79.1, grade: 'B', performanceLevel: 3, potentialLevel: 2, salaryAdjustSuggestion: '+5%', trainingSuggestion: ['CRS001'], calibrated: true },
        { id: 'RES005', cycleId: 'CYC001', empId: 'EMP006', empName: '马晓', dept: '会计部', compositeScore: 74.4, grade: 'B', performanceLevel: 3, potentialLevel: 1, salaryAdjustSuggestion: '+5%', trainingSuggestion: ['CRS001'], calibrated: true },
        { id: 'RES006', cycleId: 'CYC001', empId: 'EMP007', empName: '王强', dept: '工商部', compositeScore: 80.7, grade: 'A', performanceLevel: 4, potentialLevel: 2, salaryAdjustSuggestion: '+10%', trainingSuggestion: [], calibrated: true },
        { id: 'RES007', cycleId: 'CYC001', empId: 'EMP008', empName: '赵敏', dept: '刻章部', compositeScore: 71.5, grade: 'B', performanceLevel: 3, potentialLevel: 1, salaryAdjustSuggestion: '+5%', trainingSuggestion: ['CRS004'], calibrated: true },
        { id: 'RES008', cycleId: 'CYC001', empId: 'EMP009', empName: '陈浩', dept: '人事行政部', compositeScore: 85.3, grade: 'A', performanceLevel: 4, potentialLevel: 2, salaryAdjustSuggestion: '+10%', trainingSuggestion: [], calibrated: true },
        { id: 'RES009', cycleId: 'CYC001', empId: 'EMP011', empName: '刘洋', dept: '运营部', compositeScore: 87.6, grade: 'A', performanceLevel: 4, potentialLevel: 3, salaryAdjustSuggestion: '+10%', trainingSuggestion: [], calibrated: true },
        { id: 'RES010', cycleId: 'CYC001', empId: 'EMP012', empName: '杨梅', dept: '财务部', compositeScore: 92.3, grade: 'S', performanceLevel: 5, potentialLevel: 3, salaryAdjustSuggestion: '+15%', trainingSuggestion: [], calibrated: true },
        { id: 'RES011', cycleId: 'CYC001', empId: 'EMP013', empName: '李雪梅', dept: '会计部', compositeScore: 66.4, grade: 'C', performanceLevel: 2, potentialLevel: 1, salaryAdjustSuggestion: '0', trainingSuggestion: ['CRS001','CRS002','CRS003'], calibrated: true },
        { id: 'RES012', cycleId: 'CYC001', empId: 'EMP010', empName: '黄婷', dept: '人事行政部', compositeScore: 77.6, grade: 'B', performanceLevel: 3, potentialLevel: 2, salaryAdjustSuggestion: '+5%', trainingSuggestion: ['CRS004'], calibrated: true },
        { id: 'RES013', cycleId: 'CYC001', empId: 'EMP014', empName: '谢欣', dept: '运营部', compositeScore: 82.7, grade: 'A', performanceLevel: 4, potentialLevel: 2, salaryAdjustSuggestion: '+10%', trainingSuggestion: [], calibrated: true }
    ],

    loadData() {
        this.cycles = JSON.parse(localStorage.getItem('hr_perf_cycles') || 'null') || [...this.defaultCycles];
        this.goals = JSON.parse(localStorage.getItem('hr_perf_goals') || 'null') || [...this.defaultGoals];
        this.evaluations = JSON.parse(localStorage.getItem('hr_perf_evaluations') || 'null') || [...this.defaultEvaluations];
        this.results = JSON.parse(localStorage.getItem('hr_perf_results') || 'null') || [...this.defaultResults];
        if (!localStorage.getItem('hr_perf_cycles')) this.saveData();
    },

    saveData() {
        localStorage.setItem('hr_perf_cycles', JSON.stringify(this.cycles));
        localStorage.setItem('hr_perf_goals', JSON.stringify(this.goals));
        localStorage.setItem('hr_perf_evaluations', JSON.stringify(this.evaluations));
        localStorage.setItem('hr_perf_results', JSON.stringify(this.results));
    },

    generateId(prefix) {
        return prefix + Date.now().toString(36) + Math.random().toString(36).substr(2, 4);
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
                <h2><i class="fas fa-chart-line"></i> 绩效管理</h2>
                <div class="hr-header-actions">
                    <span class="org-stat-badge"><i class="fas fa-sync"></i> 周期 <strong>${this.cycles.filter(c=>c.status==='进行中').length}</strong>个进行中</span>
                </div>
            </div>
            <div class="hr-org-tabs">
                <button class="hr-org-tab ${this.currentTab==='cycles'?'active':''}" data-tab="cycles"><i class="fas fa-calendar-alt"></i> 考核周期</button>
                <button class="hr-org-tab ${this.currentTab==='goals'?'active':''}" data-tab="goals"><i class="fas fa-bullseye"></i> 目标管理</button>
                <button class="hr-org-tab ${this.currentTab==='evaluations'?'active':''}" data-tab="evaluations"><i class="fas fa-clipboard-check"></i> 考核评价</button>
                <button class="hr-org-tab ${this.currentTab==='results'?'active':''}" data-tab="results"><i class="fas fa-trophy"></i> 绩效结果</button>
                <button class="hr-org-tab ${this.currentTab==='ninegrid'?'active':''}" data-tab="ninegrid"><i class="fas fa-th"></i> 九宫格</button>
                <button class="hr-org-tab ${this.currentTab==='application'?'active':''}" data-tab="application"><i class="fas fa-link"></i> 结果应用</button>
            </div>
            <div class="hr-module-body" id="perf-content">${this.renderTab()}</div>
        </div>`;
        this.bindEvents();
    },

    renderTab() {
        switch(this.currentTab) {
            case 'cycles': return this.renderCycles();
            case 'goals': return this.renderGoals();
            case 'evaluations': return this.renderEvaluations();
            case 'results': return this.renderResults();
            case 'ninegrid': return this.renderNineGrid();
            case 'application': return this.renderApplication();
            default: return this.renderCycles();
        }
    },

    // ===== 考核周期 =====
    renderCycles() {
        return `
        <div style="margin-bottom:16px;display:flex;justify-content:flex-end;">
            <button class="btn-hr-primary" data-action="add-cycle"><i class="fas fa-plus"></i> 新建周期</button>
        </div>
        <div class="lifecycle-section">
            ${this.cycles.map(c => {
                const statusClass = c.status==='进行中'?'warning':c.status==='已结束'?'success':'default';
                return `
                <div class="lifecycle-card">
                    <div class="lifecycle-card-header">
                        <div class="lifecycle-avatar" style="background:linear-gradient(135deg,#4f46e5,#818cf8);">${c.type.charAt(0)}</div>
                        <div class="lifecycle-info"><h4>${c.name}</h4><p>${c.startDate} ~ ${c.endDate}</p></div>
                        <span class="hr-badge ${statusClass}">${c.status}</span>
                    </div>
                    <div class="lifecycle-card-body">
                        <div class="lifecycle-row"><span>考核类型</span><span>${c.type}</span></div>
                        <div class="lifecycle-row"><span>评估方式</span><span>${c.evaluationMethod}</span></div>
                        <div class="lifecycle-row"><span>评分维度</span><span>${c.dimensions.map(d=>d.name+'('+d.weight+'%)').join('、')}</span></div>
                    </div>
                    <div class="lifecycle-card-actions">
                        <button class="btn-sm btn-hr-secondary" data-action="edit-cycle" data-id="${c.id}"><i class="fas fa-edit"></i> 编辑</button>
                        <button class="btn-sm btn-hr-secondary danger" data-action="delete-cycle" data-id="${c.id}"><i class="fas fa-trash"></i> 删除</button>
                    </div>
                </div>`;
            }).join('')}
        </div>`;
    },

    // ===== 目标管理 OKR =====
    renderGoals() {
        const cycleOptions = this.cycles.map(c => `<option value="${c.id}" ${c.status==='进行中'?'selected':''}>${c.name}</option>`).join('');
        const activeCycleId = this.cycles.find(c=>c.status==='进行中')?.id || this.cycles[0]?.id;
        const cycleGoals = this.goals.filter(g => g.cycleId === activeCycleId);
        const companyGoals = cycleGoals.filter(g => g.level === '公司');

        return `
        <div class="hr-filter-bar">
            <select id="perf-goal-cycle">${cycleOptions}</select>
            <button class="btn-hr-primary" data-action="add-goal"><i class="fas fa-plus"></i> 新增目标</button>
        </div>
        <div class="okr-tree">
            ${companyGoals.map(cg => this.renderGoalNode(cg, cycleGoals, 0)).join('')}
            ${companyGoals.length===0 ? '<div class="hr-empty">当前周期暂无目标，请点击新增</div>' : ''}
        </div>`;
    },

    renderGoalNode(goal, allGoals, level) {
        const children = allGoals.filter(g => g.parentGoalId === goal.id);
        const levelColors = {'公司':'#4f46e5','部门':'#059669','个人':'#d97706'};
        const color = levelColors[goal.level] || '#64748b';
        return `
        <div class="okr-node" style="margin-left:${level*28}px;">
            <div class="okr-node-header">
                <span class="okr-level-badge" style="background:${color}20;color:${color};">${goal.level}</span>
                <span class="okr-node-title">${goal.title}</span>
                ${goal.empName ? `<span class="okr-node-owner"><i class="fas fa-user"></i> ${goal.empName}</span>` : ''}
                <span class="okr-node-progress">${goal.progress}%</span>
                <div class="okr-actions">
                    <button class="hr-action-btn" data-action="edit-goal" data-id="${goal.id}" title="编辑"><i class="fas fa-edit"></i></button>
                    <button class="hr-action-btn danger" data-action="delete-goal" data-id="${goal.id}" title="删除"><i class="fas fa-trash"></i></button>
                </div>
            </div>
            <div class="okr-progress-bar"><div class="okr-progress-fill" style="width:${goal.progress}%;background:${color};"></div></div>
            ${goal.keyResults ? `<div class="okr-krs">${goal.keyResults.map(kr => `
                <div class="okr-kr-item"><span>${kr.description}</span><span class="okr-kr-value">${kr.current}/${kr.target}${kr.unit}</span></div>
            `).join('')}</div>` : ''}
            ${children.map(child => this.renderGoalNode(child, allGoals, level + 1)).join('')}
        </div>`;
    },

    // ===== 考核评价 =====
    renderEvaluations() {
        const cycleId = this.cycles.find(c=>c.status==='已结束')?.id || this.cycles[0]?.id;
        const evals = this.evaluations.filter(e => e.cycleId === cycleId);
        const statusCounts = { '已完成': evals.filter(e=>e.status==='已完成').length, '待自评': evals.filter(e=>e.status==='待自评').length, '待上级评': evals.filter(e=>e.status==='待上级评').length };

        return `
        <div class="hr-stat-cards" style="margin-bottom:20px;">
            <div class="hr-stat-card"><div class="hr-stat-number">${evals.length}</div><div class="hr-stat-label">参评人数</div></div>
            <div class="hr-stat-card"><div class="hr-stat-number" style="color:#059669;">${statusCounts['已完成']}</div><div class="hr-stat-label">已完成</div></div>
            <div class="hr-stat-card"><div class="hr-stat-number" style="color:#d97706;">${statusCounts['待自评']}</div><div class="hr-stat-label">待自评</div></div>
            <div class="hr-stat-card"><div class="hr-stat-number" style="color:#2563eb;">${statusCounts['待上级评']}</div><div class="hr-stat-label">待上级评</div></div>
        </div>
        <table class="hr-table">
            <thead><tr><th>员工</th><th>部门</th><th>职位</th><th>自评均分</th><th>上级均分</th><th>综合分</th><th>等级</th><th>状态</th><th>操作</th></tr></thead>
            <tbody>
                ${evals.map(ev => {
                    const selfAvg = ev.selfScores ? Math.round(Object.values(ev.selfScores).reduce((a,b)=>a+b,0)/Object.values(ev.selfScores).length) : '-';
                    const mgrAvg = ev.managerScores ? Math.round(Object.values(ev.managerScores).reduce((a,b)=>a+b,0)/Object.values(ev.managerScores).length) : '-';
                    const gradeClass = {'S':'success','A':'success','B':'warning','C':'danger','D':'danger'}[ev.grade]||'default';
                    return `<tr>
                        <td><strong>${ev.empName}</strong></td><td>${ev.dept}</td><td>${ev.position}</td>
                        <td>${selfAvg}</td><td>${mgrAvg}</td>
                        <td><strong>${ev.compositeScore?.toFixed(1)||'-'}</strong></td>
                        <td><span class="hr-badge ${gradeClass}">${ev.grade||'-'}</span></td>
                        <td><span class="hr-badge ${ev.status==='已完成'?'success':'warning'}">${ev.status}</span></td>
                        <td><button class="hr-action-btn" data-action="view-eval" data-id="${ev.id}"><i class="fas fa-eye"></i></button>
                            <button class="hr-action-btn" data-action="edit-eval" data-id="${ev.id}"><i class="fas fa-edit"></i></button></td>
                    </tr>`;
                }).join('')}
            </tbody>
        </table>`;
    },

    // ===== 绩效结果 =====
    renderResults() {
        const gradeCount = { S:0, A:0, B:0, C:0, D:0 };
        this.results.forEach(r => { if(gradeCount[r.grade]!==undefined) gradeCount[r.grade]++; });
        const total = this.results.length;

        return `
        <div class="hr-stat-cards" style="margin-bottom:20px;">
            <div class="hr-stat-card"><div class="hr-stat-number" style="color:#7c3aed;">${gradeCount.S}</div><div class="hr-stat-label">S 卓越</div></div>
            <div class="hr-stat-card"><div class="hr-stat-number" style="color:#059669;">${gradeCount.A}</div><div class="hr-stat-label">A 优秀</div></div>
            <div class="hr-stat-card"><div class="hr-stat-number" style="color:#2563eb;">${gradeCount.B}</div><div class="hr-stat-label">B 良好</div></div>
            <div class="hr-stat-card"><div class="hr-stat-number" style="color:#d97706;">${gradeCount.C}</div><div class="hr-stat-label">C 待改进</div></div>
        </div>
        <div class="ai-insight-card" style="margin-bottom:20px;">
            <div class="ai-badge"><i class="fas fa-robot"></i> AI分析 <span class="ai-confidence">需后端支持</span></div>
            <p>绩效分布：S级占${total?Math.round(gradeCount.S/total*100):0}%，A级占${total?Math.round(gradeCount.A/total*100):0}%，B级占${total?Math.round(gradeCount.B/total*100):0}%，建议关注C/D级员工的能力提升计划。</p>
        </div>
        <table class="hr-table">
            <thead><tr><th>员工</th><th>部门</th><th>综合分</th><th>等级</th><th>绩效等级</th><th>潜力等级</th><th>调薪建议</th><th>培训建议</th></tr></thead>
            <tbody>
                ${this.results.sort((a,b)=>b.compositeScore-a.compositeScore).map(r => {
                    const gradeClass = {'S':'success','A':'success','B':'warning','C':'danger','D':'danger'}[r.grade]||'default';
                    return `<tr>
                        <td><strong>${r.empName}</strong></td><td>${r.dept}</td>
                        <td><strong>${r.compositeScore.toFixed(1)}</strong></td>
                        <td><span class="hr-badge ${gradeClass}">${r.grade}</span></td>
                        <td>${'★'.repeat(r.performanceLevel)}${'☆'.repeat(5-r.performanceLevel)}</td>
                        <td>${'●'.repeat(r.potentialLevel)}${'○'.repeat(3-r.potentialLevel)}</td>
                        <td><span class="${r.salaryAdjustSuggestion!=='0'?'text-green':'text-red'}">${r.salaryAdjustSuggestion}</span></td>
                        <td>${r.trainingSuggestion&&r.trainingSuggestion.length>0?'<span class="hr-badge warning">需培训</span>':'<span class="hr-badge success">无</span>'}</td>
                    </tr>`;
                }).join('')}
            </tbody>
        </table>`;
    },

    // ===== 九宫格 =====
    renderNineGrid() {
        const gridLabels = [
            ['待观察','稳定贡献者','核心骨干'],
            ['需改进','潜力股','明星员工'],
            ['高风险','待发展','超级明星']
        ];
        // X: performanceLevel (1-5 mapped to 1-3: 1-2→低, 3→中, 4-5→高)
        // Y: potentialLevel (1-3: 低/中/高)
        const getGridPos = (r) => {
            const x = r.performanceLevel <= 2 ? 0 : r.performanceLevel <= 3 ? 1 : 2;
            const y = r.potentialLevel - 1;
            return { x, y };
        };

        const grid = Array.from({length:3}, () => Array.from({length:3}, () => []));
        this.results.forEach(r => {
            const pos = getGridPos(r);
            grid[pos.y][pos.x].push(r);
        });

        const cellColors = [
            ['#fee2e2','#fef3c7','#d1fae5'],
            ['#fef3c7','#dbeafe','#d1fae5'],
            ['#ede9fe','#dbeafe','#d1fae5']
        ];

        return `
        <div class="nine-grid-container">
            <div class="nine-grid-ylabel">潜力 →</div>
            <div class="nine-grid">
                ${[2,1,0].map(y => [0,1,2].map(x => `
                    <div class="nine-grid-cell" style="background:${cellColors[y][x]};">
                        <div class="nine-grid-label">${gridLabels[y][x]}</div>
                        <div class="nine-grid-avatars">
                            ${grid[y][x].map(r => `<span class="nine-grid-avatar" title="${r.empName} (${r.compositeScore.toFixed(1)})">${r.empName.charAt(0)}</span>`).join('')}
                        </div>
                        <div class="nine-grid-count">${grid[y][x].length}人</div>
                    </div>
                `).join('')).join('')}
            </div>
            <div class="nine-grid-xlabel">绩效 →</div>
        </div>
        <div class="ai-insight-card" style="margin-top:20px;">
            <div class="ai-badge"><i class="fas fa-robot"></i> 人才盘点建议 <span class="ai-confidence">需后端支持</span></div>
            <ul style="margin:10px 0;padding-left:20px;font-size:13px;color:#475569;">
                <li>明星员工${grid[2][2].length}人，建议重点培养并给予晋升机会</li>
                <li>高风险员工${grid[0][0].length}人，建议安排专项辅导或考虑调岗</li>
                <li>潜力股${grid[1][1].length}人，建议增加挑战性任务以激发潜力</li>
            </ul>
        </div>`;
    },

    // ===== 结果应用 =====
    renderApplication() {
        const salaryAdj = this.results.filter(r => r.salaryAdjustSuggestion && r.salaryAdjustSuggestion !== '0');
        const trainingNeeds = this.results.filter(r => r.trainingSuggestion && r.trainingSuggestion.length > 0);

        return `
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:20px;">
            <div class="rules-card">
                <h3><i class="fas fa-dollar-sign"></i> 调薪建议 (${salaryAdj.length}人)</h3>
                <table class="hr-table">
                    <thead><tr><th>员工</th><th>等级</th><th>建议调幅</th><th>操作</th></tr></thead>
                    <tbody>
                        ${salaryAdj.map(r => `<tr>
                            <td><strong>${r.empName}</strong></td>
                            <td><span class="hr-badge success">${r.grade}</span></td>
                            <td class="text-green"><strong>${r.salaryAdjustSuggestion}</strong></td>
                            <td><button class="btn-sm btn-hr-secondary" data-action="apply-salary" data-id="${r.empId}">推送至薪酬</button></td>
                        </tr>`).join('')}
                    </tbody>
                </table>
            </div>
            <div class="rules-card">
                <h3><i class="fas fa-graduation-cap"></i> 培训建议 (${trainingNeeds.length}人)</h3>
                <table class="hr-table">
                    <thead><tr><th>员工</th><th>等级</th><th>建议课程数</th><th>操作</th></tr></thead>
                    <tbody>
                        ${trainingNeeds.map(r => `<tr>
                            <td><strong>${r.empName}</strong></td>
                            <td><span class="hr-badge danger">${r.grade}</span></td>
                            <td>${r.trainingSuggestion.length}门</td>
                            <td><button class="btn-sm btn-hr-secondary" data-action="apply-training" data-id="${r.empId}">推送至培训</button></td>
                        </tr>`).join('')}
                    </tbody>
                </table>
            </div>
        </div>`;
    },

    // ===== 模态框 =====
    showCycleModal(editId) {
        const cycle = editId ? this.cycles.find(c => c.id === editId) : null;
        const title = cycle ? '编辑考核周期' : '新建考核周期';
        const dims = cycle ? cycle.dimensions : [{name:'工作业绩',weight:40,desc:''},{name:'工作态度',weight:20,desc:''},{name:'专业能力',weight:25,desc:''},{name:'团队协作',weight:15,desc:''}];

        const modal = document.createElement('div');
        modal.className = 'hr-modal-overlay';
        modal.id = 'perf-modal';
        modal.innerHTML = `
        <div class="hr-modal" style="width:600px;">
            <div class="hr-modal-header"><h3>${title}</h3><button class="hr-modal-close" data-action="close-modal">&times;</button></div>
            <div class="hr-modal-body">
                <div class="hr-form-row">
                    <div class="hr-form-item"><label>周期名称 *</label><input type="text" id="cyc-name" value="${cycle?cycle.name:''}" required></div>
                    <div class="hr-form-item"><label>类型</label><select id="cyc-type"><option value="季度" ${cycle&&cycle.type==='季度'?'selected':''}>季度</option><option value="半年度" ${cycle&&cycle.type==='半年度'?'selected':''}>半年度</option><option value="年度" ${cycle&&cycle.type==='年度'?'selected':''}>年度</option></select></div>
                </div>
                <div class="hr-form-row">
                    <div class="hr-form-item"><label>开始日期</label><input type="date" id="cyc-start" value="${cycle?cycle.startDate:''}"></div>
                    <div class="hr-form-item"><label>结束日期</label><input type="date" id="cyc-end" value="${cycle?cycle.endDate:''}"></div>
                </div>
                <div class="hr-form-item" style="margin-bottom:12px;"><label>评估方式</label><select id="cyc-method"><option value="自评+上级">自评+上级</option><option value="360度" ${cycle&&cycle.evaluationMethod==='360度'?'selected':''}>360度</option></select></div>
                <div class="hr-form-section-title">评分维度（权重之和须为100%）</div>
                <div id="cyc-dims">
                    ${dims.map((d,i) => `<div class="hr-form-row" style="margin-bottom:8px;"><div class="hr-form-item"><input type="text" placeholder="维度名称" value="${d.name}" class="dim-name"></div><div class="hr-form-item"><input type="number" placeholder="权重%" value="${d.weight}" class="dim-weight" min="0" max="100"></div></div>`).join('')}
                </div>
                <button class="btn-sm btn-hr-secondary" id="add-dim-btn"><i class="fas fa-plus"></i> 添加维度</button>
            </div>
            <div class="hr-modal-footer">
                <button class="btn-hr-secondary" data-action="close-modal">取消</button>
                <button class="btn-hr-primary" data-action="save-cycle" data-edit-id="${editId||''}">保存</button>
            </div>
        </div>`;
        document.body.appendChild(modal);
        setTimeout(() => modal.classList.add('show'), 10);
        document.getElementById('add-dim-btn').addEventListener('click', () => {
            document.getElementById('cyc-dims').insertAdjacentHTML('beforeend', `<div class="hr-form-row" style="margin-bottom:8px;"><div class="hr-form-item"><input type="text" placeholder="维度名称" class="dim-name"></div><div class="hr-form-item"><input type="number" placeholder="权重%" class="dim-weight" min="0" max="100" value="0"></div></div>`);
        });
        this.bindModalEvents(modal);
    },

    saveCycle(editId) {
        const name = document.getElementById('cyc-name').value.trim();
        if (!name) { alert('请填写周期名称'); return; }
        const dims = [];
        document.querySelectorAll('#cyc-dims .hr-form-row').forEach(row => {
            const n = row.querySelector('.dim-name').value.trim();
            const w = parseInt(row.querySelector('.dim-weight').value) || 0;
            if (n) dims.push({ name: n, weight: w, desc: '' });
        });
        const totalWeight = dims.reduce((s, d) => s + d.weight, 0);
        if (totalWeight !== 100) { alert(`维度权重之和为${totalWeight}%，须为100%`); return; }

        const data = {
            name, type: document.getElementById('cyc-type').value,
            startDate: document.getElementById('cyc-start').value,
            endDate: document.getElementById('cyc-end').value,
            evaluationMethod: document.getElementById('cyc-method').value,
            dimensions: dims, status: '待开始'
        };
        if (editId) {
            const idx = this.cycles.findIndex(c => c.id === editId);
            if (idx > -1) this.cycles[idx] = { ...this.cycles[idx], ...data };
        } else {
            data.id = this.generateId('CYC');
            data.year = new Date(data.startDate).getFullYear();
            data.quarter = Math.ceil((new Date(data.startDate).getMonth()+1)/3);
            this.cycles.push(data);
        }
        this.saveData(); this.closeModal(); this.render();
    },

    showGoalModal(editId) {
        const goal = editId ? this.goals.find(g => g.id === editId) : null;
        const title = goal ? '编辑目标' : '新增目标';
        const activeCycleId = this.cycles.find(c=>c.status==='进行中')?.id || this.cycles[0]?.id;
        const employees = JSON.parse(localStorage.getItem('hr_employees') || '[]');
        const deptSaved = localStorage.getItem('hr_departments');
        const depts = deptSaved ? JSON.parse(deptSaved).filter(d=>d.status==='active').map(d=>d.name) : [];

        const modal = document.createElement('div');
        modal.className = 'hr-modal-overlay';
        modal.id = 'perf-modal';
        modal.innerHTML = `
        <div class="hr-modal" style="width:580px;">
            <div class="hr-modal-header"><h3>${title}</h3><button class="hr-modal-close" data-action="close-modal">&times;</button></div>
            <div class="hr-modal-body">
                <div class="hr-form-row">
                    <div class="hr-form-item"><label>目标层级 *</label><select id="goal-level"><option value="公司" ${goal&&goal.level==='公司'?'selected':''}>公司级</option><option value="部门" ${goal&&goal.level==='部门'?'selected':''}>部门级</option><option value="个人" ${goal&&goal.level==='个人'?'selected':''}>个人级</option></select></div>
                    <div class="hr-form-item"><label>所属部门</label><select id="goal-dept"><option value="">全公司</option>${depts.map(d=>`<option value="${d}" ${goal&&goal.dept===d?'selected':''}>${d}</option>`).join('')}</select></div>
                </div>
                <div class="hr-form-row">
                    <div class="hr-form-item"><label>责任人</label><select id="goal-emp"><option value="">无（部门/公司目标）</option>${employees.map(e=>`<option value="${e.id}" ${goal&&goal.empId===e.id?'selected':''}>${e.name} - ${e.dept}</option>`).join('')}</select></div>
                    <div class="hr-form-item"><label>上级目标</label><select id="goal-parent"><option value="">无</option>${this.goals.filter(g=>g.cycleId===activeCycleId&&g.level!=='个人').map(g=>`<option value="${g.id}" ${goal&&goal.parentGoalId===g.id?'selected':''}>[${g.level}] ${g.title}</option>`).join('')}</select></div>
                </div>
                <div class="hr-form-item" style="margin-bottom:12px;"><label>目标标题 *</label><input type="text" id="goal-title" value="${goal?goal.title:''}" placeholder="如：Q2营收增长20%"></div>
                <div class="hr-form-item"><label>截止日期</label><input type="date" id="goal-due" value="${goal?goal.dueDate:''}"></div>
            </div>
            <div class="hr-modal-footer">
                <button class="btn-hr-secondary" data-action="close-modal">取消</button>
                <button class="btn-hr-primary" data-action="save-goal" data-edit-id="${editId||''}">保存</button>
            </div>
        </div>`;
        document.body.appendChild(modal);
        setTimeout(() => modal.classList.add('show'), 10);
        this.bindModalEvents(modal);
    },

    saveGoal(editId) {
        const title = document.getElementById('goal-title').value.trim();
        if (!title) { alert('请填写目标标题'); return; }
        const empSelect = document.getElementById('goal-emp');
        const empOption = empSelect.options[empSelect.selectedIndex];
        const data = {
            cycleId: this.cycles.find(c=>c.status==='进行中')?.id || this.cycles[0]?.id,
            level: document.getElementById('goal-level').value,
            dept: document.getElementById('goal-dept').value,
            empId: empSelect.value,
            empName: empSelect.value ? empOption.text.split(' - ')[0] : '',
            parentGoalId: document.getElementById('goal-parent').value,
            title, dueDate: document.getElementById('goal-due').value,
            keyResults: [], progress: 0, status: '进行中'
        };
        if (editId) {
            const idx = this.goals.findIndex(g => g.id === editId);
            if (idx > -1) this.goals[idx] = { ...this.goals[idx], ...data };
        } else {
            data.id = this.generateId('GOAL');
            this.goals.push(data);
        }
        this.saveData(); this.closeModal(); this.render();
    },

    showEvalModal(evalId) {
        const ev = this.evaluations.find(e => e.id === evalId);
        if (!ev) return;
        const cycle = this.cycles.find(c => c.id === ev.cycleId);
        const dims = cycle ? cycle.dimensions : [];

        const modal = document.createElement('div');
        modal.className = 'hr-modal-overlay';
        modal.id = 'perf-modal';
        modal.innerHTML = `
        <div class="hr-modal" style="width:680px;">
            <div class="hr-modal-header"><h3>评价详情 - ${ev.empName}</h3><button class="hr-modal-close" data-action="close-modal">&times;</button></div>
            <div class="hr-modal-body">
                <div class="hr-form-section-title">评分详情 (${ev.dept} · ${ev.position})</div>
                <table class="hr-table">
                    <thead><tr><th>维度</th><th>权重</th><th>自评</th><th>上级评</th><th>加权分</th></tr></thead>
                    <tbody>
                        ${dims.map(d => {
                            const self = ev.selfScores?.[d.name] || 0;
                            const mgr = ev.managerScores?.[d.name] || 0;
                            const weighted = ((self * 0.3 + mgr * 0.7) * d.weight / 100).toFixed(1);
                            return `<tr><td>${d.name}</td><td>${d.weight}%</td><td>${self}</td><td>${mgr}</td><td>${weighted}</td></tr>`;
                        }).join('')}
                        <tr style="font-weight:700;background:#f8fafc;"><td>综合</td><td>100%</td><td>-</td><td>-</td><td>${ev.compositeScore?.toFixed(1)||'-'}</td></tr>
                    </tbody>
                </table>
                <div style="margin-top:16px;display:grid;grid-template-columns:1fr 1fr;gap:16px;">
                    <div><strong>自评评语：</strong><p style="color:#64748b;font-size:13px;">${ev.selfComment||'无'}</p></div>
                    <div><strong>上级评语：</strong><p style="color:#64748b;font-size:13px;">${ev.managerComment||'无'}</p></div>
                </div>
                <div style="margin-top:16px;padding:12px 16px;background:#f8fafc;border-radius:8px;">
                    <strong>最终等级：</strong><span class="hr-badge ${{'S':'success','A':'success','B':'warning','C':'danger','D':'danger'}[ev.grade]||'default'}" style="font-size:16px;padding:4px 12px;">${ev.grade} (${ev.compositeScore?.toFixed(1)}分)</span>
                </div>
            </div>
            <div class="hr-modal-footer"><button class="btn-hr-secondary" data-action="close-modal">关闭</button></div>
        </div>`;
        document.body.appendChild(modal);
        setTimeout(() => modal.classList.add('show'), 10);
        this.bindModalEvents(modal);
    },

    closeModal() {
        const modal = document.getElementById('perf-modal');
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
                case 'add-cycle': this.showCycleModal(); break;
                case 'edit-cycle': this.showCycleModal(id); break;
                case 'delete-cycle':
                    if (confirm('确定删除该考核周期？')) { this.cycles = this.cycles.filter(c=>c.id!==id); this.saveData(); this.render(); }
                    break;
                case 'add-goal': this.showGoalModal(); break;
                case 'edit-goal': this.showGoalModal(id); break;
                case 'delete-goal':
                    if (confirm('确定删除该目标？')) { this.goals = this.goals.filter(g=>g.id!==id); this.saveData(); this.render(); }
                    break;
                case 'view-eval': case 'edit-eval': this.showEvalModal(id); break;
                case 'apply-salary': alert('已推送调薪建议至薪酬模块（模拟）'); break;
                case 'apply-training': alert('已推送培训建议至培训模块（模拟）'); break;
            }
        });
    },

    bindModalEvents(modal) {
        modal.addEventListener('click', (e) => {
            const btn = e.target.closest('[data-action]');
            if (!btn) { if (e.target === modal) this.closeModal(); return; }
            const action = btn.dataset.action;
            if (action === 'close-modal') this.closeModal();
            else if (action === 'save-cycle') this.saveCycle(btn.dataset.editId);
            else if (action === 'save-goal') this.saveGoal(btn.dataset.editId);
        });
    }
};
