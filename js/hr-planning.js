// 人力资源规划模块 - 浙杭企服
const HrPlanning = {
    headcountPlans: [],
    currentTab: 'cost',

    defaultHeadcountPlans: [
        { id: 'HCP001', dept: '顾问部', year: 2025, quarter: 2, plannedHeadcount: 6, actualHeadcount: 5, budgetAmount: 420000, actualCost: 380000, openPositions: 1, notes: '计划招聘1名高级顾问' },
        { id: 'HCP002', dept: '会计部', year: 2025, quarter: 2, plannedHeadcount: 9, actualHeadcount: 8, budgetAmount: 480000, actualCost: 430000, openPositions: 1, notes: '代账组需补充1人' },
        { id: 'HCP003', dept: '工商部', year: 2025, quarter: 2, plannedHeadcount: 5, actualHeadcount: 4, budgetAmount: 280000, actualCost: 250000, openPositions: 1, notes: '' },
        { id: 'HCP004', dept: '刻章部', year: 2025, quarter: 2, plannedHeadcount: 3, actualHeadcount: 3, budgetAmount: 180000, actualCost: 170000, openPositions: 0, notes: '满编' },
        { id: 'HCP005', dept: '人事行政部', year: 2025, quarter: 2, plannedHeadcount: 4, actualHeadcount: 3, budgetAmount: 240000, actualCost: 210000, openPositions: 1, notes: '需招聘行政专员' },
        { id: 'HCP006', dept: '运营部', year: 2025, quarter: 2, plannedHeadcount: 6, actualHeadcount: 5, budgetAmount: 360000, actualCost: 320000, openPositions: 1, notes: '' },
        { id: 'HCP007', dept: '财务部', year: 2025, quarter: 2, plannedHeadcount: 3, actualHeadcount: 3, budgetAmount: 300000, actualCost: 290000, openPositions: 0, notes: '满编' },
        { id: 'HCP008', dept: '技术部', year: 2025, quarter: 2, plannedHeadcount: 5, actualHeadcount: 4, budgetAmount: 400000, actualCost: 350000, openPositions: 1, notes: '需招聘开发工程师' }
    ],

    loadData() {
        this.headcountPlans = JSON.parse(localStorage.getItem('hr_headcount_plans') || 'null') || [...this.defaultHeadcountPlans];
        if (!localStorage.getItem('hr_headcount_plans')) this.saveData();
    },

    saveData() {
        localStorage.setItem('hr_headcount_plans', JSON.stringify(this.headcountPlans));
    },

    generateId(prefix) { return prefix + Date.now().toString(36) + Math.random().toString(36).substr(2, 4); },

    init() { this.loadData(); this.render(); },
    destroy() {},

    render() {
        const contentArea = document.querySelector('.content-area');
        contentArea.innerHTML = `
        <div class="hr-module">
            <div class="hr-module-header">
                <h2><i class="fas fa-chart-pie"></i> 人力资源规划</h2>
                <div class="hr-header-actions">
                    <span class="org-stat-badge"><i class="fas fa-users"></i> 总编制 <strong>${this.headcountPlans.reduce((s,p)=>s+p.plannedHeadcount,0)}</strong></span>
                    <span class="org-stat-badge"><i class="fas fa-user-check"></i> 在岗 <strong>${this.headcountPlans.reduce((s,p)=>s+p.actualHeadcount,0)}</strong></span>
                </div>
            </div>
            <div class="hr-org-tabs">
                <button class="hr-org-tab ${this.currentTab==='cost'?'active':''}" data-tab="cost"><i class="fas fa-dollar-sign"></i> 人力成本</button>
                <button class="hr-org-tab ${this.currentTab==='talent'?'active':''}" data-tab="talent"><i class="fas fa-gem"></i> 人才盘点</button>
                <button class="hr-org-tab ${this.currentTab==='headcount'?'active':''}" data-tab="headcount"><i class="fas fa-users-cog"></i> 编制规划</button>
                <button class="hr-org-tab ${this.currentTab==='health'?'active':''}" data-tab="health"><i class="fas fa-heartbeat"></i> 组织健康</button>
                <button class="hr-org-tab ${this.currentTab==='insights'?'active':''}" data-tab="insights"><i class="fas fa-brain"></i> 智能洞察</button>
            </div>
            <div class="hr-module-body" id="planning-content">${this.renderTab()}</div>
        </div>`;
        this.bindEvents();
    },

    renderTab() {
        switch(this.currentTab) {
            case 'cost': return this.renderCost();
            case 'talent': return this.renderTalent();
            case 'headcount': return this.renderHeadcount();
            case 'health': return this.renderHealth();
            case 'insights': return this.renderInsights();
            default: return this.renderCost();
        }
    },

    // ===== 人力成本 =====
    renderCost() {
        const totalBudget = this.headcountPlans.reduce((s,p) => s+p.budgetAmount, 0);
        const totalActual = this.headcountPlans.reduce((s,p) => s+p.actualCost, 0);
        const utilizationRate = totalBudget ? Math.round(totalActual/totalBudget*100) : 0;

        return `
        <div class="hr-stat-cards" style="margin-bottom:20px;">
            <div class="hr-stat-card"><div class="hr-stat-number">${(totalBudget/10000).toFixed(1)}万</div><div class="hr-stat-label">总预算</div></div>
            <div class="hr-stat-card"><div class="hr-stat-number">${(totalActual/10000).toFixed(1)}万</div><div class="hr-stat-label">实际支出</div></div>
            <div class="hr-stat-card"><div class="hr-stat-number">${utilizationRate}%</div><div class="hr-stat-label">预算执行率</div></div>
            <div class="hr-stat-card"><div class="hr-stat-number">${((totalBudget-totalActual)/10000).toFixed(1)}万</div><div class="hr-stat-label">预算剩余</div></div>
        </div>
        <div class="rules-card">
            <h3><i class="fas fa-chart-bar"></i> 部门人力成本对比（预算 vs 实际）</h3>
            <div class="cost-chart" style="margin-top:16px;">
                ${this.headcountPlans.sort((a,b)=>b.budgetAmount-a.budgetAmount).map(p => {
                    const pct = totalBudget ? Math.round(p.actualCost/p.budgetAmount*100) : 0;
                    return `
                    <div class="cost-bar-row">
                        <span class="cost-dept-name">${p.dept}</span>
                        <div class="cost-bar-wrap">
                            <div class="cost-bar" style="width:${pct}%;${pct>100?'background:linear-gradient(90deg,#dc2626,#f87171);':''}">
                                <span class="cost-bar-label">${(p.actualCost/10000).toFixed(1)}万/${(p.budgetAmount/10000).toFixed(1)}万</span>
                            </div>
                        </div>
                        <span class="cost-headcount">${pct}%</span>
                    </div>`;
                }).join('')}
            </div>
        </div>`;
    },

    // ===== 人才盘点 =====
    renderTalent() {
        const results = JSON.parse(localStorage.getItem('hr_perf_results') || '[]');
        if (results.length === 0) {
            return '<div class="hr-empty"><i class="fas fa-gem" style="font-size:48px;color:#cbd5e1;"></i><p>暂无绩效结果数据，请先在绩效管理中完成评估</p></div>';
        }

        const gridLabels = [['待观察','稳定贡献者','核心骨干'],['需改进','潜力股','明星员工'],['高风险','待发展','超级明星']];
        const getGridPos = (r) => {
            const x = r.performanceLevel <= 2 ? 0 : r.performanceLevel <= 3 ? 1 : 2;
            const y = r.potentialLevel - 1;
            return { x, y };
        };
        const grid = Array.from({length:3}, () => Array.from({length:3}, () => []));
        results.forEach(r => { const pos = getGridPos(r); grid[pos.y][pos.x].push(r); });
        const cellColors = [['#fee2e2','#fef3c7','#d1fae5'],['#fef3c7','#dbeafe','#d1fae5'],['#ede9fe','#dbeafe','#d1fae5']];

        const stars = results.filter(r => r.performanceLevel >= 4 && r.potentialLevel >= 2);
        const risks = results.filter(r => r.performanceLevel <= 2 && r.potentialLevel <= 1);

        return `
        <div style="display:grid;grid-template-columns:2fr 1fr;gap:20px;">
            <div class="rules-card">
                <h3><i class="fas fa-th"></i> 人才九宫格</h3>
                <div class="nine-grid-container" style="margin-top:16px;">
                    <div class="nine-grid">
                        ${[2,1,0].map(y => [0,1,2].map(x => `
                            <div class="nine-grid-cell" style="background:${cellColors[y][x]};">
                                <div class="nine-grid-label">${gridLabels[y][x]}</div>
                                <div class="nine-grid-avatars">${grid[y][x].map(r=>`<span class="nine-grid-avatar" title="${r.empName}">${r.empName.charAt(0)}</span>`).join('')}</div>
                                <div class="nine-grid-count">${grid[y][x].length}人</div>
                            </div>`).join('')).join('')}
                    </div>
                </div>
            </div>
            <div>
                <div class="rules-card" style="margin-bottom:16px;">
                    <h3><i class="fas fa-crown" style="color:#f59e0b;"></i> 明星/高潜人才 (${stars.length}人)</h3>
                    <div style="margin-top:12px;">
                        ${stars.map(r => `<div style="display:flex;align-items:center;gap:8px;padding:8px 0;border-bottom:1px solid #f1f5f9;">
                            <span style="width:28px;height:28px;border-radius:50%;background:#4f46e5;color:#fff;display:flex;align-items:center;justify-content:center;font-size:12px;">${r.empName.charAt(0)}</span>
                            <div><div style="font-size:13px;font-weight:600;">${r.empName}</div><div style="font-size:11px;color:#64748b;">${r.dept} · ${r.grade}级</div></div>
                        </div>`).join('')}
                    </div>
                </div>
                <div class="rules-card">
                    <h3><i class="fas fa-exclamation-triangle" style="color:#dc2626;"></i> 风险关注 (${risks.length}人)</h3>
                    <div style="margin-top:12px;">
                        ${risks.length > 0 ? risks.map(r => `<div style="display:flex;align-items:center;gap:8px;padding:8px 0;border-bottom:1px solid #f1f5f9;">
                            <span style="width:28px;height:28px;border-radius:50%;background:#dc2626;color:#fff;display:flex;align-items:center;justify-content:center;font-size:12px;">${r.empName.charAt(0)}</span>
                            <div><div style="font-size:13px;font-weight:600;">${r.empName}</div><div style="font-size:11px;color:#64748b;">${r.dept} · ${r.grade}级</div></div>
                        </div>`).join('') : '<p style="font-size:13px;color:#94a3b8;">暂无高风险人员</p>'}
                    </div>
                </div>
            </div>
        </div>`;
    },

    // ===== 编制规划 =====
    renderHeadcount() {
        const totalPlanned = this.headcountPlans.reduce((s,p)=>s+p.plannedHeadcount,0);
        const totalActual = this.headcountPlans.reduce((s,p)=>s+p.actualHeadcount,0);
        const gap = totalPlanned - totalActual;

        return `
        <div class="hr-stat-cards" style="margin-bottom:20px;">
            <div class="hr-stat-card"><div class="hr-stat-number">${totalPlanned}</div><div class="hr-stat-label">总编制</div></div>
            <div class="hr-stat-card"><div class="hr-stat-number">${totalActual}</div><div class="hr-stat-label">实际在岗</div></div>
            <div class="hr-stat-card"><div class="hr-stat-number" style="color:${gap>0?'#d97706':'#059669'};">${gap}</div><div class="hr-stat-label">缺编人数</div></div>
            <div class="hr-stat-card"><div class="hr-stat-number">${this.headcountPlans.reduce((s,p)=>s+p.openPositions,0)}</div><div class="hr-stat-label">开放岗位</div></div>
        </div>
        <div style="margin-bottom:16px;display:flex;justify-content:flex-end;">
            <button class="btn-hr-primary" data-action="add-hcp"><i class="fas fa-plus"></i> 新增编制计划</button>
        </div>
        <table class="hr-table">
            <thead><tr><th>部门</th><th>编制人数</th><th>实际人数</th><th>缺编</th><th>预算(万)</th><th>实际(万)</th><th>执行率</th><th>备注</th><th>操作</th></tr></thead>
            <tbody>
                ${this.headcountPlans.map(p => {
                    const pGap = p.plannedHeadcount - p.actualHeadcount;
                    const rate = p.budgetAmount ? Math.round(p.actualCost/p.budgetAmount*100) : 0;
                    return `<tr>
                        <td><strong>${p.dept}</strong></td><td>${p.plannedHeadcount}</td><td>${p.actualHeadcount}</td>
                        <td><span class="${pGap>0?'text-red':'text-green'}">${pGap>0?'+'+pGap:pGap}</span></td>
                        <td>${(p.budgetAmount/10000).toFixed(1)}</td><td>${(p.actualCost/10000).toFixed(1)}</td>
                        <td><span class="${rate>100?'text-red':'text-green'}">${rate}%</span></td>
                        <td style="font-size:12px;color:#64748b;">${p.notes||'-'}</td>
                        <td><button class="hr-action-btn" data-action="edit-hcp" data-id="${p.id}"><i class="fas fa-edit"></i></button>
                            <button class="hr-action-btn danger" data-action="delete-hcp" data-id="${p.id}"><i class="fas fa-trash"></i></button></td>
                    </tr>`;
                }).join('')}
            </tbody>
        </table>`;
    },

    // ===== 组织健康 =====
    renderHealth() {
        const employees = JSON.parse(localStorage.getItem('hr_employees') || '[]');
        if (employees.length === 0) return '<div class="hr-empty">暂无员工数据</div>';

        // 性别分布
        const genderMap = {};
        employees.forEach(e => { genderMap[e.gender||'未知'] = (genderMap[e.gender||'未知']||0) + 1; });
        // 学历分布
        const eduMap = {};
        employees.forEach(e => { eduMap[e.education||'未知'] = (eduMap[e.education||'未知']||0) + 1; });
        // 司龄分布
        const tenureMap = {'<1年':0,'1-3年':0,'3-5年':0,'5年+':0};
        const now = new Date();
        employees.forEach(e => {
            if (!e.joinDate) return;
            const years = (now - new Date(e.joinDate)) / (365.25*24*3600*1000);
            if (years < 1) tenureMap['<1年']++;
            else if (years < 3) tenureMap['1-3年']++;
            else if (years < 5) tenureMap['3-5年']++;
            else tenureMap['5年+']++;
        });
        // 年龄分布
        const ageMap = {'<25':0,'25-30':0,'30-35':0,'35-40':0,'40+':0};
        employees.forEach(e => {
            const age = e.age || 0;
            if (age < 25) ageMap['<25']++;
            else if (age <= 30) ageMap['25-30']++;
            else if (age <= 35) ageMap['30-35']++;
            else if (age <= 40) ageMap['35-40']++;
            else ageMap['40+']++;
        });

        const avgAge = employees.reduce((s,e) => s+(e.age||0), 0) / employees.length;

        return `
        <div class="hr-stat-cards" style="margin-bottom:20px;">
            <div class="hr-stat-card"><div class="hr-stat-number">${employees.length}</div><div class="hr-stat-label">总人数</div></div>
            <div class="hr-stat-card"><div class="hr-stat-number">${avgAge.toFixed(1)}</div><div class="hr-stat-label">平均年龄</div></div>
            <div class="hr-stat-card"><div class="hr-stat-number">${genderMap['男']||0}:${genderMap['女']||0}</div><div class="hr-stat-label">男女比</div></div>
            <div class="hr-stat-card"><div class="hr-stat-number">${employees.filter(e=>e.education==='本科'||e.education==='硕士'||e.education==='博士').length}</div><div class="hr-stat-label">本科及以上</div></div>
        </div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:20px;">
            <div class="rules-card">
                <h3><i class="fas fa-venus-mars"></i> 性别分布</h3>
                ${this.renderMiniBar(genderMap, ['#4f46e5','#ec4899','#94a3b8'])}
            </div>
            <div class="rules-card">
                <h3><i class="fas fa-graduation-cap"></i> 学历分布</h3>
                ${this.renderMiniBar(eduMap, ['#06b6d4','#4f46e5','#059669','#d97706','#94a3b8'])}
            </div>
            <div class="rules-card">
                <h3><i class="fas fa-calendar-alt"></i> 司龄分布</h3>
                ${this.renderMiniBar(tenureMap, ['#f59e0b','#4f46e5','#059669','#7c3aed'])}
            </div>
            <div class="rules-card">
                <h3><i class="fas fa-birthday-cake"></i> 年龄分布</h3>
                ${this.renderMiniBar(ageMap, ['#06b6d4','#4f46e5','#059669','#d97706','#dc2626'])}
            </div>
        </div>`;
    },

    renderMiniBar(dataMap, colors) {
        const total = Object.values(dataMap).reduce((s,v)=>s+v, 0) || 1;
        return `<div style="margin-top:12px;">${Object.entries(dataMap).map(([key, val], i) => {
            const pct = Math.round(val/total*100);
            const color = colors[i % colors.length];
            return `<div class="cost-bar-row" style="margin-bottom:8px;">
                <span class="cost-dept-name">${key}</span>
                <div class="cost-bar-wrap"><div class="cost-bar" style="width:${pct}%;background:${color};"><span class="cost-bar-label">${val}人(${pct}%)</span></div></div>
            </div>`;
        }).join('')}</div>`;
    },

    // ===== 智能洞察 =====
    renderInsights() {
        const employees = JSON.parse(localStorage.getItem('hr_employees') || '[]');
        const results = JSON.parse(localStorage.getItem('hr_perf_results') || '[]');
        const departures = JSON.parse(localStorage.getItem('hr_departures') || '[]');

        // Mock turnover risk
        const riskEmployees = employees.filter(e => e.status === '在职').map(e => {
            const perfResult = results.find(r => r.empId === e.id);
            let risk = 20; // base
            if (e.joinDate) {
                const tenure = (new Date() - new Date(e.joinDate)) / (365.25*24*3600*1000);
                if (tenure < 1) risk += 25;
                else if (tenure < 2) risk += 15;
            }
            if (perfResult) {
                if (perfResult.grade === 'C') risk += 20;
                else if (perfResult.grade === 'D') risk += 35;
                else if (perfResult.grade === 'S') risk -= 10;
            }
            risk = Math.max(5, Math.min(95, risk + Math.floor(Math.random()*10-5)));
            return { name: e.name, dept: e.dept, risk, grade: perfResult?.grade || '-' };
        }).sort((a,b) => b.risk - a.risk);

        const totalOpen = this.headcountPlans.reduce((s,p)=>s+p.openPositions, 0);
        const departureRate = employees.length ? Math.round(departures.length / employees.length * 100) : 0;

        return `
        <div class="ai-insight-card" style="margin-bottom:20px;">
            <div class="ai-badge"><i class="fas fa-robot"></i> AI智能分析 <span class="ai-confidence">需后端支持</span></div>
            <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:16px;margin-top:16px;">
                <div style="text-align:center;padding:16px;background:#f8fafc;border-radius:8px;">
                    <div style="font-size:24px;font-weight:700;color:#d97706;">${totalOpen}</div>
                    <div style="font-size:12px;color:#64748b;">预计需招聘人数</div>
                </div>
                <div style="text-align:center;padding:16px;background:#f8fafc;border-radius:8px;">
                    <div style="font-size:24px;font-weight:700;color:#dc2626;">${departureRate}%</div>
                    <div style="font-size:12px;color:#64748b;">年度离职率</div>
                </div>
                <div style="text-align:center;padding:16px;background:#f8fafc;border-radius:8px;">
                    <div style="font-size:24px;font-weight:700;color:#4f46e5;">${riskEmployees.filter(r=>r.risk>=60).length}</div>
                    <div style="font-size:12px;color:#64748b;">高离职风险人数</div>
                </div>
            </div>
        </div>
        <div class="rules-card">
            <h3><i class="fas fa-exclamation-circle" style="color:#d97706;"></i> 离职风险预警排名</h3>
            <p style="font-size:12px;color:#94a3b8;margin-bottom:12px;">基于司龄、绩效等维度的综合风险评估（模拟算法，置信度参考）</p>
            <table class="hr-table">
                <thead><tr><th>员工</th><th>部门</th><th>绩效</th><th>风险分</th><th>风险等级</th></tr></thead>
                <tbody>
                    ${riskEmployees.slice(0, 10).map(r => {
                        const riskLevel = r.risk >= 70 ? '高' : r.risk >= 40 ? '中' : '低';
                        const riskClass = r.risk >= 70 ? 'danger' : r.risk >= 40 ? 'warning' : 'success';
                        return `<tr>
                            <td><strong>${r.name}</strong></td><td>${r.dept}</td>
                            <td>${r.grade}</td>
                            <td><div class="progress-bar-mini" style="width:80px;"><div class="progress-fill" style="width:${r.risk}%;background:${r.risk>=70?'#dc2626':r.risk>=40?'#d97706':'#059669'};"></div></div> ${r.risk}</td>
                            <td><span class="hr-badge ${riskClass}">${riskLevel}风险</span></td>
                        </tr>`;
                    }).join('')}
                </tbody>
            </table>
        </div>`;
    },

    // ===== 编制编辑模态框 =====
    showHcpModal(editId) {
        const hcp = editId ? this.headcountPlans.find(p => p.id === editId) : null;
        const title = hcp ? '编辑编制计划' : '新增编制计划';
        const deptSaved = localStorage.getItem('hr_departments');
        const depts = deptSaved ? JSON.parse(deptSaved).filter(d=>d.status==='active').map(d=>d.name) : [];

        const modal = document.createElement('div');
        modal.className = 'hr-modal-overlay';
        modal.id = 'planning-modal';
        modal.innerHTML = `
        <div class="hr-modal" style="width:520px;">
            <div class="hr-modal-header"><h3>${title}</h3><button class="hr-modal-close" data-action="close-modal">&times;</button></div>
            <div class="hr-modal-body">
                <div class="hr-form-row">
                    <div class="hr-form-item"><label>部门 *</label><select id="hcp-dept">${depts.map(d=>`<option value="${d}" ${hcp&&hcp.dept===d?'selected':''}>${d}</option>`).join('')}</select></div>
                    <div class="hr-form-item"><label>季度</label><select id="hcp-quarter"><option value="1" ${hcp&&hcp.quarter===1?'selected':''}>Q1</option><option value="2" ${hcp&&hcp.quarter===2?'selected':''}>Q2</option><option value="3" ${hcp&&hcp.quarter===3?'selected':''}>Q3</option><option value="4" ${hcp&&hcp.quarter===4?'selected':''}>Q4</option></select></div>
                </div>
                <div class="hr-form-row">
                    <div class="hr-form-item"><label>编制人数</label><input type="number" id="hcp-planned" value="${hcp?hcp.plannedHeadcount:5}" min="0"></div>
                    <div class="hr-form-item"><label>实际人数</label><input type="number" id="hcp-actual" value="${hcp?hcp.actualHeadcount:0}" min="0"></div>
                </div>
                <div class="hr-form-row">
                    <div class="hr-form-item"><label>预算(元)</label><input type="number" id="hcp-budget" value="${hcp?hcp.budgetAmount:0}" min="0"></div>
                    <div class="hr-form-item"><label>实际成本(元)</label><input type="number" id="hcp-cost" value="${hcp?hcp.actualCost:0}" min="0"></div>
                </div>
                <div class="hr-form-row">
                    <div class="hr-form-item"><label>开放岗位数</label><input type="number" id="hcp-open" value="${hcp?hcp.openPositions:0}" min="0"></div>
                    <div class="hr-form-item"><label>备注</label><input type="text" id="hcp-notes" value="${hcp?hcp.notes:''}"></div>
                </div>
            </div>
            <div class="hr-modal-footer">
                <button class="btn-hr-secondary" data-action="close-modal">取消</button>
                <button class="btn-hr-primary" data-action="save-hcp" data-edit-id="${editId||''}">保存</button>
            </div>
        </div>`;
        document.body.appendChild(modal);
        setTimeout(() => modal.classList.add('show'), 10);
        this.bindModalEvents(modal);
    },

    saveHcp(editId) {
        const data = {
            dept: document.getElementById('hcp-dept').value,
            year: 2025, quarter: parseInt(document.getElementById('hcp-quarter').value),
            plannedHeadcount: parseInt(document.getElementById('hcp-planned').value) || 0,
            actualHeadcount: parseInt(document.getElementById('hcp-actual').value) || 0,
            budgetAmount: parseInt(document.getElementById('hcp-budget').value) || 0,
            actualCost: parseInt(document.getElementById('hcp-cost').value) || 0,
            openPositions: parseInt(document.getElementById('hcp-open').value) || 0,
            notes: document.getElementById('hcp-notes').value.trim()
        };
        if (editId) {
            const idx = this.headcountPlans.findIndex(p => p.id === editId);
            if (idx > -1) this.headcountPlans[idx] = { ...this.headcountPlans[idx], ...data };
        } else {
            data.id = this.generateId('HCP');
            this.headcountPlans.push(data);
        }
        this.saveData(); this.closeModal(); this.render();
    },

    closeModal() {
        const modal = document.getElementById('planning-modal');
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
                case 'add-hcp': this.showHcpModal(); break;
                case 'edit-hcp': this.showHcpModal(id); break;
                case 'delete-hcp':
                    if (confirm('确定删除？')) { this.headcountPlans = this.headcountPlans.filter(p=>p.id!==id); this.saveData(); this.render(); }
                    break;
            }
        });
    },

    bindModalEvents(modal) {
        modal.addEventListener('click', (e) => {
            const btn = e.target.closest('[data-action]');
            if (!btn) { if (e.target === modal) this.closeModal(); return; }
            if (btn.dataset.action === 'close-modal') this.closeModal();
            else if (btn.dataset.action === 'save-hcp') this.saveHcp(btn.dataset.editId);
        });
    }
};
