// 招聘管理模块 - 完整CRUD + localStorage持久化

const HrRecruit = {
    POSITION_KEY: 'hr_positions',
    CANDIDATE_KEY: 'hr_candidates',
    positions: [],
    candidates: [],
    currentTab: 'positions',
    filterPositionId: '',

    defaultPositions: [
        { id: 'POS001', title: '财务顾问', dept: '顾问部', type: '全职', salaryMin: 6000, salaryMax: 10000, urgency: '急聘', headcount: 2, publishDate: '2025-04-01', status: '招聘中', requirements: '本科及以上，财务管理/会计学相关专业，2年以上工作经验', description: '负责为客户提供财务咨询服务，包括税务筹划、财务分析等' },
        { id: 'POS002', title: '代账会计', dept: '会计部', type: '全职', salaryMin: 5000, salaryMax: 8000, urgency: '普通', headcount: 1, publishDate: '2025-04-15', status: '招聘中', requirements: '大专及以上，会计从业资格证，熟悉代理记账流程', description: '负责客户企业的代理记账、报税等日常财务工作' },
        { id: 'POS003', title: '工商外勤', dept: '工商部', type: '全职', salaryMin: 4000, salaryMax: 6000, urgency: '普通', headcount: 1, publishDate: '2025-05-01', status: '招聘中', requirements: '大专及以上，有工商注册经验优先，能适应外勤工作', description: '负责工商注册、变更、注销等外勤业务办理' },
        { id: 'POS004', title: '新媒体运营', dept: '运营部', type: '全职', salaryMin: 6000, salaryMax: 9000, urgency: '急聘', headcount: 1, publishDate: '2025-03-20', status: '招聘中', requirements: '本科及以上，熟悉抖音/小红书运营，有成功案例优先', description: '负责公司新媒体平台的内容创作、运营推广' },
        { id: 'POS005', title: '行政助理', dept: '人事行政部', type: '全职', salaryMin: 4000, salaryMax: 5500, urgency: '普通', headcount: 1, publishDate: '2025-05-10', status: '暂停', requirements: '大专及以上，形象气质佳，office办公软件熟练', description: '负责公司行政事务、文档管理、来访接待等' },
    ],

    defaultCandidates: [
        { id: 'CAN001', name: '徐明', positionId: 'POS001', phone: '15512343001', education: '本科', school: '浙江工商大学', major: '财务管理', experience: '3年', applyDate: '2025-04-05', stage: '面试通过', rating: 4, notes: '沟通能力强，专业基础扎实', interviewDate: '2025-04-10', interviewer: '张经理' },
        { id: 'CAN002', name: '林小红', positionId: 'POS001', phone: '15512343002', education: '本科', school: '浙江财经大学', major: '会计学', experience: '2年', applyDate: '2025-04-08', stage: '二面', rating: 3, notes: '经验略少，但潜力不错', interviewDate: '2025-04-12', interviewer: '李总' },
        { id: 'CAN003', name: '何建国', positionId: 'POS001', phone: '15512343003', education: '硕士', school: '浙江大学', major: '工商管理', experience: '5年', applyDate: '2025-04-10', stage: '待入职', rating: 5, notes: '各方面优秀，已发offer', interviewDate: '2025-04-15', interviewer: '王总' },
        { id: 'CAN004', name: '吴佳', positionId: 'POS002', phone: '15512343004', education: '大专', school: '浙江经贸职院', major: '会计', experience: '4年', applyDate: '2025-04-20', stage: '初面', rating: 3, notes: '代账经验丰富', interviewDate: '2025-04-25', interviewer: '张经理' },
        { id: 'CAN005', name: '张小丽', positionId: 'POS004', phone: '15512343005', education: '本科', school: '浙江传媒学院', major: '新闻传播', experience: '2年', applyDate: '2025-03-25', stage: '面试通过', rating: 4, notes: '有运营大号经验，内容创作力强', interviewDate: '2025-04-01', interviewer: '刘总' },
        { id: 'CAN006', name: '王磊', positionId: 'POS004', phone: '15512343006', education: '本科', school: '杭州电子科技大学', major: '电子商务', experience: '1年', applyDate: '2025-04-01', stage: '已淘汰', rating: 2, notes: '经验不足，建议后续再看', interviewDate: '2025-04-05', interviewer: '刘总' },
        { id: 'CAN007', name: '赵晓华', positionId: 'POS003', phone: '15512343007', education: '大专', school: '浙江商业职院', major: '工商管理', experience: '3年', applyDate: '2025-05-05', stage: '初面', rating: 3, notes: '有相关经验', interviewDate: '2025-05-10', interviewer: '张经理' },
        { id: 'CAN008', name: '陈丽丽', positionId: 'POS004', phone: '15512343008', education: '本科', school: '浙江工业大学', major: '市场营销', experience: '3年', applyDate: '2025-04-02', stage: '二面', rating: 4, notes: '数据分析能力强', interviewDate: '2025-04-08', interviewer: '李总' },
    ],

    loadData() {
        const posData = localStorage.getItem(this.POSITION_KEY);
        this.positions = posData ? JSON.parse(posData) : JSON.parse(JSON.stringify(this.defaultPositions));
        const canData = localStorage.getItem(this.CANDIDATE_KEY);
        this.candidates = canData ? JSON.parse(canData) : JSON.parse(JSON.stringify(this.defaultCandidates));
        if (!posData) this.savePositions();
        if (!canData) this.saveCandidates();
    },

    savePositions() {
        localStorage.setItem(this.POSITION_KEY, JSON.stringify(this.positions));
    },

    saveCandidates() {
        localStorage.setItem(this.CANDIDATE_KEY, JSON.stringify(this.candidates));
    },

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
        const activePositions = this.positions.filter(p => p.status === '招聘中').length;
        const totalCandidates = this.candidates.length;
        const interviewingCount = this.candidates.filter(c => ['初面', '二面'].includes(c.stage)).length;
        const passedCount = this.candidates.filter(c => c.stage === '面试通过' || c.stage === '待入职').length;

        return `
        <div class="hr-recruit-page">
            <div class="hr-module-header">
                <div class="hr-module-title">
                    <h2>招聘管理</h2>
                    <p class="hr-module-desc">管理招聘职位、候选人、面试流程</p>
                </div>
                <div class="hr-header-actions">
                    <button class="btn-hr-primary" id="btn-add-position">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                        发布职位
                    </button>
                    <button class="btn-hr-secondary" id="btn-add-candidate">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M16 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="8.5" cy="7" r="4"/><line x1="20" y1="8" x2="20" y2="14"/><line x1="23" y1="11" x2="17" y2="11"/></svg>
                        添加候选人
                    </button>
                </div>
            </div>

            <div class="hr-stats-row">
                <div class="hr-stat-card">
                    <div class="hr-stat-icon" style="background:#dbeafe;color:#2563eb;">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 7V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v2"/></svg>
                    </div>
                    <div class="hr-stat-info">
                        <span class="hr-stat-num">${activePositions}</span>
                        <span class="hr-stat-label">在招职位</span>
                    </div>
                </div>
                <div class="hr-stat-card">
                    <div class="hr-stat-icon" style="background:#fce7f3;color:#db2777;">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M16 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="8.5" cy="7" r="4"/><line x1="20" y1="8" x2="20" y2="14"/><line x1="23" y1="11" x2="17" y2="11"/></svg>
                    </div>
                    <div class="hr-stat-info">
                        <span class="hr-stat-num">${totalCandidates}</span>
                        <span class="hr-stat-label">候选人</span>
                    </div>
                </div>
                <div class="hr-stat-card">
                    <div class="hr-stat-icon" style="background:#d1fae5;color:#059669;">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/></svg>
                    </div>
                    <div class="hr-stat-info">
                        <span class="hr-stat-num">${interviewingCount}</span>
                        <span class="hr-stat-label">面试中</span>
                    </div>
                </div>
                <div class="hr-stat-card">
                    <div class="hr-stat-icon" style="background:#fef3c7;color:#d97706;">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 11.08V12a10 10 0 11-5.93-9.14"/><polyline points="22,4 12,14.01 9,11.01"/></svg>
                    </div>
                    <div class="hr-stat-info">
                        <span class="hr-stat-num">${passedCount}</span>
                        <span class="hr-stat-label">已通过/待入职</span>
                    </div>
                </div>
            </div>

            <div class="hr-org-tabs">
                <button class="hr-org-tab ${this.currentTab === 'positions' ? 'active' : ''}" data-tab="positions">招聘职位</button>
                <button class="hr-org-tab ${this.currentTab === 'candidates' ? 'active' : ''}" data-tab="candidates">候选人管理</button>
                <button class="hr-org-tab ${this.currentTab === 'pipeline' ? 'active' : ''}" data-tab="pipeline">招聘漏斗</button>
            </div>

            <div class="hr-content-area" id="hr-recruit-content">
                ${this.currentTab === 'positions' ? this.renderPositions() : this.currentTab === 'candidates' ? this.renderCandidates() : this.renderPipeline()}
            </div>
        </div>`;
    },

    renderPositions() {
        return `
        <div class="hr-table-wrapper">
            <table class="hr-table">
                <thead>
                    <tr>
                        <th>职位名称</th>
                        <th>部门</th>
                        <th>薪资范围</th>
                        <th>招聘人数</th>
                        <th>已投递</th>
                        <th>面试中</th>
                        <th>紧急程度</th>
                        <th>状态</th>
                        <th>操作</th>
                    </tr>
                </thead>
                <tbody>
                    ${this.positions.map(pos => {
                        const applied = this.candidates.filter(c => c.positionId === pos.id).length;
                        const interviewing = this.candidates.filter(c => c.positionId === pos.id && ['初面', '二面'].includes(c.stage)).length;
                        return `
                    <tr>
                        <td><strong>${pos.title}</strong></td>
                        <td>${pos.dept}</td>
                        <td class="salary-text">${pos.salaryMin/1000}K-${pos.salaryMax/1000}K</td>
                        <td>${pos.headcount}人</td>
                        <td>${applied}</td>
                        <td>${interviewing}</td>
                        <td><span class="urgency-badge ${pos.urgency === '急聘' ? 'urgent' : 'normal'}">${pos.urgency}</span></td>
                        <td><span class="recruit-status ${pos.status === '招聘中' ? 'active' : 'paused'}">${pos.status}</span></td>
                        <td class="action-cell">
                            <button class="hr-action-btn" data-action="view-candidates" data-id="${pos.id}">查看候选人</button>
                            <button class="hr-action-btn" data-action="edit-position" data-id="${pos.id}">编辑</button>
                            <button class="hr-action-btn" data-action="toggle-position" data-id="${pos.id}">${pos.status === '招聘中' ? '暂停' : '恢复'}</button>
                            <button class="hr-action-btn danger" data-action="delete-position" data-id="${pos.id}">删除</button>
                        </td>
                    </tr>`;
                    }).join('')}
                </tbody>
            </table>
            <div class="hr-table-footer">共 ${this.positions.length} 个职位，在招 ${this.positions.filter(p=>p.status==='招聘中').length} 个</div>
        </div>`;
    },

    renderCandidates() {
        let filtered = this.candidates;
        if (this.filterPositionId) {
            filtered = filtered.filter(c => c.positionId === this.filterPositionId);
        }

        const stageColors = { '简历筛选': '#6b7280', '初面': '#3b82f6', '二面': '#8b5cf6', '面试通过': '#10b981', '待入职': '#059669', '已入职': '#047857', '已淘汰': '#ef4444' };

        return `
        <div class="hr-filter-bar">
            <select id="filter-position" class="hr-filter-select">
                <option value="">全部职位</option>
                ${this.positions.map(p => `<option value="${p.id}" ${this.filterPositionId === p.id ? 'selected' : ''}>${p.title}</option>`).join('')}
            </select>
            <button class="btn-hr-secondary btn-sm" id="btn-export-candidates">导出CSV</button>
        </div>
        <div class="hr-table-wrapper">
            <table class="hr-table">
                <thead>
                    <tr>
                        <th>姓名</th>
                        <th>应聘职位</th>
                        <th>学历</th>
                        <th>工作经验</th>
                        <th>投递时间</th>
                        <th>当前阶段</th>
                        <th>评分</th>
                        <th>操作</th>
                    </tr>
                </thead>
                <tbody>
                    ${filtered.map(can => {
                        const pos = this.positions.find(p => p.id === can.positionId);
                        const color = stageColors[can.stage] || '#6b7280';
                        return `
                    <tr>
                        <td><strong>${can.name}</strong></td>
                        <td>${pos ? pos.title : '-'}</td>
                        <td>${can.education}</td>
                        <td>${can.experience}</td>
                        <td>${can.applyDate}</td>
                        <td><span class="stage-badge" style="background:${color}20;color:${color}">${can.stage}</span></td>
                        <td>${'★'.repeat(can.rating)}${'☆'.repeat(5 - can.rating)}</td>
                        <td class="action-cell">
                            <button class="hr-action-btn" data-action="advance-candidate" data-id="${can.id}">推进</button>
                            <button class="hr-action-btn" data-action="edit-candidate" data-id="${can.id}">编辑</button>
                            <button class="hr-action-btn danger" data-action="eliminate-candidate" data-id="${can.id}">淘汰</button>
                            <button class="hr-action-btn danger" data-action="delete-candidate" data-id="${can.id}">删除</button>
                        </td>
                    </tr>`;
                    }).join('')}
                </tbody>
            </table>
            <div class="hr-table-footer">共 ${filtered.length} 位候选人</div>
        </div>`;
    },

    renderPipeline() {
        const stages = ['简历筛选', '初面', '二面', '面试通过', '待入职', '已入职', '已淘汰'];
        const colors = ['#6b7280', '#3b82f6', '#8b5cf6', '#10b981', '#059669', '#047857', '#ef4444'];
        const stageData = stages.map((stage, i) => ({
            name: stage,
            count: this.candidates.filter(c => c.stage === stage).length,
            color: colors[i]
        }));
        const maxCount = Math.max(...stageData.map(s => s.count), 1);
        const total = this.candidates.length;
        const passed = this.candidates.filter(c => ['面试通过', '待入职', '已入职'].includes(c.stage)).length;

        return `
        <div class="recruit-pipeline">
            <h3 class="pipeline-title">招聘漏斗分析</h3>
            <div class="pipeline-chart">
                ${stageData.map(stage => `
                <div class="pipeline-stage">
                    <span class="pipeline-label">${stage.name}</span>
                    <div class="pipeline-bar-wrap">
                        <div class="pipeline-bar" style="width:${(stage.count / maxCount) * 100}%;background:${stage.color}"></div>
                        <span class="pipeline-count">${stage.count}人</span>
                    </div>
                </div>
                `).join('')}
            </div>
            <div class="pipeline-summary">
                <div class="pipeline-metric">
                    <span class="metric-value">${total}</span>
                    <span class="metric-label">总候选人</span>
                </div>
                <div class="pipeline-metric">
                    <span class="metric-value">${total > 0 ? Math.round(passed / total * 100) : 0}%</span>
                    <span class="metric-label">通过率</span>
                </div>
                <div class="pipeline-metric">
                    <span class="metric-value">${this.positions.reduce((sum, p) => sum + p.headcount, 0)}</span>
                    <span class="metric-label">总需求人数</span>
                </div>
                <div class="pipeline-metric">
                    <span class="metric-value">${this.positions.filter(p => p.status === '招聘中').length}</span>
                    <span class="metric-label">在招职位数</span>
                </div>
            </div>
        </div>`;
    },

    showPositionModal(editId) {
        const pos = editId ? this.positions.find(p => p.id === editId) : null;
        const title = pos ? '编辑职位' : '发布新职位';
        const saved = localStorage.getItem('hr_departments');
        const depts = saved ? JSON.parse(saved).filter(d => d.status === 'active').map(d => d.name) : ['顾问部', '会计部', '工商部', '运营部', '人事行政部', '技术部', '市场部'];

        const html = `
        <div class="hr-modal-overlay" id="recruit-modal">
            <div class="hr-modal" style="max-width:600px;">
                <div class="hr-modal-header">
                    <h3>${title}</h3>
                    <button class="hr-modal-close" id="close-recruit-modal">&times;</button>
                </div>
                <div class="hr-modal-body">
                    <form id="position-form">
                        <div class="hr-form-section">
                            <div class="hr-form-grid">
                                <div class="hr-form-item">
                                    <label>职位名称 <span class="required">*</span></label>
                                    <input type="text" name="title" value="${pos ? pos.title : ''}" required>
                                </div>
                                <div class="hr-form-item">
                                    <label>所属部门 <span class="required">*</span></label>
                                    <select name="dept" required>
                                        <option value="">请选择</option>
                                        ${depts.map(d => `<option value="${d}" ${pos && pos.dept === d ? 'selected' : ''}>${d}</option>`).join('')}
                                    </select>
                                </div>
                                <div class="hr-form-item">
                                    <label>工作类型</label>
                                    <select name="type">
                                        <option value="全职" ${pos && pos.type === '全职' ? 'selected' : ''}>全职</option>
                                        <option value="兼职" ${pos && pos.type === '兼职' ? 'selected' : ''}>兼职</option>
                                        <option value="实习" ${pos && pos.type === '实习' ? 'selected' : ''}>实习</option>
                                    </select>
                                </div>
                                <div class="hr-form-item">
                                    <label>紧急程度</label>
                                    <select name="urgency">
                                        <option value="普通" ${pos && pos.urgency === '普通' ? 'selected' : ''}>普通</option>
                                        <option value="急聘" ${pos && pos.urgency === '急聘' ? 'selected' : ''}>急聘</option>
                                    </select>
                                </div>
                                <div class="hr-form-item">
                                    <label>最低薪资(元/月) <span class="required">*</span></label>
                                    <input type="number" name="salaryMin" value="${pos ? pos.salaryMin : ''}" required min="0">
                                </div>
                                <div class="hr-form-item">
                                    <label>最高薪资(元/月) <span class="required">*</span></label>
                                    <input type="number" name="salaryMax" value="${pos ? pos.salaryMax : ''}" required min="0">
                                </div>
                                <div class="hr-form-item">
                                    <label>招聘人数 <span class="required">*</span></label>
                                    <input type="number" name="headcount" value="${pos ? pos.headcount : 1}" required min="1">
                                </div>
                                <div class="hr-form-item">
                                    <label>发布日期</label>
                                    <input type="date" name="publishDate" value="${pos ? pos.publishDate : new Date().toISOString().split('T')[0]}">
                                </div>
                            </div>
                            <div class="hr-form-item" style="grid-column:1/-1;">
                                <label>任职要求</label>
                                <textarea name="requirements" rows="3">${pos ? pos.requirements : ''}</textarea>
                            </div>
                            <div class="hr-form-item" style="grid-column:1/-1;">
                                <label>职位描述</label>
                                <textarea name="description" rows="3">${pos ? pos.description : ''}</textarea>
                            </div>
                        </div>
                        <div class="hr-form-actions">
                            <button type="button" class="btn-hr-secondary" id="cancel-position-form">取消</button>
                            <button type="submit" class="btn-hr-primary">${pos ? '保存修改' : '发布职位'}</button>
                        </div>
                    </form>
                </div>
            </div>
        </div>`;

        document.body.insertAdjacentHTML('beforeend', html);
        document.getElementById('close-recruit-modal').onclick = () => this.closeModal();
        document.getElementById('cancel-position-form').onclick = () => this.closeModal();
        document.getElementById('position-form').onsubmit = (e) => {
            e.preventDefault();
            this.savePosition(editId);
        };
    },

    savePosition(editId) {
        const form = document.getElementById('position-form');
        if (!form.checkValidity()) { form.reportValidity(); return; }
        const fd = new FormData(form);
        const data = {
            title: fd.get('title'),
            dept: fd.get('dept'),
            type: fd.get('type'),
            urgency: fd.get('urgency'),
            salaryMin: parseInt(fd.get('salaryMin')),
            salaryMax: parseInt(fd.get('salaryMax')),
            headcount: parseInt(fd.get('headcount')),
            publishDate: fd.get('publishDate'),
            requirements: fd.get('requirements'),
            description: fd.get('description'),
        };
        if (editId) {
            const idx = this.positions.findIndex(p => p.id === editId);
            if (idx >= 0) this.positions[idx] = { ...this.positions[idx], ...data };
        } else {
            data.id = this.generateId('POS');
            data.status = '招聘中';
            this.positions.unshift(data);
        }
        this.savePositions();
        this.closeModal();
        this.refresh();
    },

    togglePosition(id) {
        const pos = this.positions.find(p => p.id === id);
        if (pos) {
            pos.status = pos.status === '招聘中' ? '暂停' : '招聘中';
            this.savePositions();
            this.refresh();
        }
    },

    deletePosition(id) {
        if (!confirm('确定删除该职位？关联的候选人不会被删除。')) return;
        this.positions = this.positions.filter(p => p.id !== id);
        this.savePositions();
        this.refresh();
    },

    showCandidateModal(editId) {
        const can = editId ? this.candidates.find(c => c.id === editId) : null;
        const title = can ? '编辑候选人' : '添加候选人';
        const stages = ['简历筛选', '初面', '二面', '面试通过', '待入职', '已入职', '已淘汰'];

        const html = `
        <div class="hr-modal-overlay" id="recruit-modal">
            <div class="hr-modal" style="max-width:600px;">
                <div class="hr-modal-header">
                    <h3>${title}</h3>
                    <button class="hr-modal-close" id="close-recruit-modal">&times;</button>
                </div>
                <div class="hr-modal-body">
                    <form id="candidate-form">
                        <div class="hr-form-section">
                            <div class="hr-form-grid">
                                <div class="hr-form-item">
                                    <label>姓名 <span class="required">*</span></label>
                                    <input type="text" name="name" value="${can ? can.name : ''}" required>
                                </div>
                                <div class="hr-form-item">
                                    <label>应聘职位 <span class="required">*</span></label>
                                    <select name="positionId" required>
                                        <option value="">请选择</option>
                                        ${this.positions.map(p => `<option value="${p.id}" ${can && can.positionId === p.id ? 'selected' : ''}>${p.title} - ${p.dept}</option>`).join('')}
                                    </select>
                                </div>
                                <div class="hr-form-item">
                                    <label>手机号 <span class="required">*</span></label>
                                    <input type="tel" name="phone" value="${can ? can.phone : ''}" required>
                                </div>
                                <div class="hr-form-item">
                                    <label>学历</label>
                                    <select name="education">
                                        ${['高中', '大专', '本科', '硕士', '博士'].map(e => `<option value="${e}" ${can && can.education === e ? 'selected' : ''}>${e}</option>`).join('')}
                                    </select>
                                </div>
                                <div class="hr-form-item">
                                    <label>毕业院校</label>
                                    <input type="text" name="school" value="${can ? can.school : ''}">
                                </div>
                                <div class="hr-form-item">
                                    <label>专业</label>
                                    <input type="text" name="major" value="${can ? can.major : ''}">
                                </div>
                                <div class="hr-form-item">
                                    <label>工作经验</label>
                                    <input type="text" name="experience" value="${can ? can.experience : ''}" placeholder="如：3年">
                                </div>
                                <div class="hr-form-item">
                                    <label>当前阶段</label>
                                    <select name="stage">
                                        ${stages.map(s => `<option value="${s}" ${can && can.stage === s ? 'selected' : ''}>${s}</option>`).join('')}
                                    </select>
                                </div>
                                <div class="hr-form-item">
                                    <label>评分(1-5)</label>
                                    <input type="number" name="rating" value="${can ? can.rating : 3}" min="1" max="5">
                                </div>
                                <div class="hr-form-item">
                                    <label>面试日期</label>
                                    <input type="date" name="interviewDate" value="${can ? can.interviewDate || '' : ''}">
                                </div>
                                <div class="hr-form-item">
                                    <label>面试官</label>
                                    <input type="text" name="interviewer" value="${can ? can.interviewer || '' : ''}">
                                </div>
                                <div class="hr-form-item">
                                    <label>投递日期</label>
                                    <input type="date" name="applyDate" value="${can ? can.applyDate : new Date().toISOString().split('T')[0]}">
                                </div>
                            </div>
                            <div class="hr-form-item" style="grid-column:1/-1;">
                                <label>备注</label>
                                <textarea name="notes" rows="3">${can ? can.notes : ''}</textarea>
                            </div>
                        </div>
                        <div class="hr-form-actions">
                            <button type="button" class="btn-hr-secondary" id="cancel-candidate-form">取消</button>
                            <button type="submit" class="btn-hr-primary">${can ? '保存修改' : '添加候选人'}</button>
                        </div>
                    </form>
                </div>
            </div>
        </div>`;

        document.body.insertAdjacentHTML('beforeend', html);
        document.getElementById('close-recruit-modal').onclick = () => this.closeModal();
        document.getElementById('cancel-candidate-form').onclick = () => this.closeModal();
        document.getElementById('candidate-form').onsubmit = (e) => {
            e.preventDefault();
            this.saveCandidate(editId);
        };
    },

    saveCandidate(editId) {
        const form = document.getElementById('candidate-form');
        if (!form.checkValidity()) { form.reportValidity(); return; }
        const fd = new FormData(form);
        const data = {
            name: fd.get('name'),
            positionId: fd.get('positionId'),
            phone: fd.get('phone'),
            education: fd.get('education'),
            school: fd.get('school'),
            major: fd.get('major'),
            experience: fd.get('experience'),
            stage: fd.get('stage'),
            rating: parseInt(fd.get('rating')),
            interviewDate: fd.get('interviewDate'),
            interviewer: fd.get('interviewer'),
            applyDate: fd.get('applyDate'),
            notes: fd.get('notes'),
        };
        if (editId) {
            const idx = this.candidates.findIndex(c => c.id === editId);
            if (idx >= 0) this.candidates[idx] = { ...this.candidates[idx], ...data };
        } else {
            data.id = this.generateId('CAN');
            this.candidates.unshift(data);
        }
        this.saveCandidates();
        this.closeModal();
        this.refresh();
    },

    advanceCandidate(id) {
        const stages = ['简历筛选', '初面', '二面', '面试通过', '待入职', '已入职'];
        const can = this.candidates.find(c => c.id === id);
        if (!can) return;
        if (can.stage === '已淘汰') { alert('该候选人已淘汰，无法推进'); return; }
        const idx = stages.indexOf(can.stage);
        if (idx < 0 || idx >= stages.length - 1) { alert('已是最终阶段'); return; }
        const nextStage = stages[idx + 1];
        if (confirm(`确定将 ${can.name} 推进到「${nextStage}」阶段？`)) {
            can.stage = nextStage;
            this.saveCandidates();
            this.refresh();
        }
    },

    eliminateCandidate(id) {
        const can = this.candidates.find(c => c.id === id);
        if (!can) return;
        if (confirm(`确定淘汰候选人 ${can.name}？`)) {
            can.stage = '已淘汰';
            this.saveCandidates();
            this.refresh();
        }
    },

    deleteCandidate(id) {
        if (!confirm('确定删除该候选人记录？此操作不可恢复。')) return;
        this.candidates = this.candidates.filter(c => c.id !== id);
        this.saveCandidates();
        this.refresh();
    },

    exportCandidates() {
        const headers = ['姓名', '应聘职位', '手机号', '学历', '院校', '专业', '工作经验', '投递日期', '当前阶段', '评分', '面试日期', '面试官', '备注'];
        const rows = this.candidates.map(c => {
            const pos = this.positions.find(p => p.id === c.positionId);
            return [c.name, pos ? pos.title : '', c.phone, c.education, c.school, c.major, c.experience, c.applyDate, c.stage, c.rating, c.interviewDate || '', c.interviewer || '', c.notes];
        });
        let csv = '\ufeff' + headers.join(',') + '\n';
        rows.forEach(r => { csv += r.map(v => `"${(v+'').replace(/"/g, '""')}"`).join(',') + '\n'; });
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url; a.download = `候选人数据_${new Date().toISOString().split('T')[0]}.csv`;
        a.click(); URL.revokeObjectURL(url);
    },

    closeModal() {
        const modal = document.getElementById('recruit-modal');
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
        const btnAddPos = document.getElementById('btn-add-position');
        if (btnAddPos) btnAddPos.onclick = () => this.showPositionModal();
        const btnAddCan = document.getElementById('btn-add-candidate');
        if (btnAddCan) btnAddCan.onclick = () => this.showCandidateModal();

        // Filter
        const filterSelect = document.getElementById('filter-position');
        if (filterSelect) {
            filterSelect.onchange = () => {
                this.filterPositionId = filterSelect.value;
                const content = document.getElementById('hr-recruit-content');
                content.innerHTML = this.renderCandidates();
                this.bindContentEvents();
            };
        }

        // Export
        const btnExport = document.getElementById('btn-export-candidates');
        if (btnExport) btnExport.onclick = () => this.exportCandidates();

        this.bindContentEvents();
    },

    bindContentEvents() {
        // Table action buttons
        document.querySelectorAll('[data-action]').forEach(btn => {
            btn.onclick = () => {
                const action = btn.dataset.action;
                const id = btn.dataset.id;
                switch(action) {
                    case 'view-candidates':
                        this.filterPositionId = id;
                        this.currentTab = 'candidates';
                        this.refresh();
                        break;
                    case 'edit-position': this.showPositionModal(id); break;
                    case 'toggle-position': this.togglePosition(id); break;
                    case 'delete-position': this.deletePosition(id); break;
                    case 'advance-candidate': this.advanceCandidate(id); break;
                    case 'edit-candidate': this.showCandidateModal(id); break;
                    case 'eliminate-candidate': this.eliminateCandidate(id); break;
                    case 'delete-candidate': this.deleteCandidate(id); break;
                }
            };
        });
    }
};
