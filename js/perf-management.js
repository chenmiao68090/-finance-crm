// 绩效管理模块 - 浙杭企服（代理记账业务系统）
// 功能：多维度考核、手动评分、目标管理、趋势分析、考核配置

const PerfManagement = {
    currentTab: 'dashboard',
    currentPeriod: '',
    selectedEmployee: null,

    init() {
        this.currentPeriod = this.getCurrentPeriod();
        this.autoCalc();
        this.render();
        this.bindEvents();
    },
    destroy() {},

    getCurrentPeriod() {
        const d = new Date();
        return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    },

    // ===== 数据存储 =====
    loadScores() {
        const d = localStorage.getItem('biz_perf_scores');
        if (!d) { localStorage.setItem('biz_perf_scores', JSON.stringify(defaultPerfScores)); return JSON.parse(JSON.stringify(defaultPerfScores)); }
        return JSON.parse(d);
    },
    saveScores(data) { localStorage.setItem('biz_perf_scores', JSON.stringify(data)); },

    loadGoals() {
        const d = localStorage.getItem('biz_perf_goals');
        if (!d) { localStorage.setItem('biz_perf_goals', JSON.stringify(defaultPerfGoals)); return JSON.parse(JSON.stringify(defaultPerfGoals)); }
        return JSON.parse(d);
    },
    saveGoals(data) { localStorage.setItem('biz_perf_goals', JSON.stringify(data)); },

    loadHistory() {
        const d = localStorage.getItem('biz_perf_history');
        if (!d) { localStorage.setItem('biz_perf_history', JSON.stringify(defaultPerfHistory)); return JSON.parse(JSON.stringify(defaultPerfHistory)); }
        return JSON.parse(d);
    },
    saveHistory(data) { localStorage.setItem('biz_perf_history', JSON.stringify(data)); },

    loadConfig() {
        const d = localStorage.getItem('biz_perf_config');
        if (!d) { localStorage.setItem('biz_perf_config', JSON.stringify(defaultPerfConfig)); return JSON.parse(JSON.stringify(defaultPerfConfig)); }
        return JSON.parse(d);
    },
    saveConfig(data) { localStorage.setItem('biz_perf_config', JSON.stringify(data)); },

    // ===== 自动计算绩效 =====
    autoCalc() {
        const tasks = JSON.parse(localStorage.getItem('biz_tasks') || '[]');
        const config = this.loadConfig();
        const scores = this.loadScores();

        config.employees.forEach(emp => {
            let existing = scores.find(s => s.name === emp.name);
            if (!existing) {
                existing = { name: emp.name, department: emp.department, role: emp.role, efficiency: 0, quality: 0, satisfaction: 0, total: 0, rank: 0, tasks_total: 0, tasks_completed: 0, tasks_overdue: 0, avg_time: '0', period: this.currentPeriod, bonus_points: 0, deduct_points: 0, evaluations: [] };
                scores.push(existing);
            }
            // 从任务数据自动采集
            const myTasks = tasks.filter(t => t.assigned_to === emp.name);
            const completed = myTasks.filter(t => t.status === 'completed');
            const overdue = myTasks.filter(t => t.status === 'overdue');
            const completionRate = myTasks.length > 0 ? completed.length / myTasks.length : 0;
            const overdueRate = myTasks.length > 0 ? overdue.length / myTasks.length : 0;

            existing.efficiency = Math.max(0, Math.round(Math.min(100, completionRate * 100 - overdueRate * 30)));
            existing.tasks_total = myTasks.length;
            existing.tasks_completed = completed.length;
            existing.tasks_overdue = overdue.length;
            existing.avg_time = completed.length > 0 ? (completed.reduce((s, t) => s + (t.time_spent || 0), 0) / completed.length).toFixed(1) : '0';
            existing.department = emp.department;
            existing.role = emp.role;

            // 计算总分（含加减分）
            const w = config.weights;
            existing.total = Math.round(
                existing.efficiency * (w.efficiency / 100) +
                existing.quality * (w.quality / 100) +
                existing.satisfaction * (w.satisfaction / 100) +
                (existing.bonus_points || 0) - (existing.deduct_points || 0)
            );
            existing.total = Math.max(0, Math.min(100, existing.total));
            existing.period = this.currentPeriod;
        });

        // 排名
        scores.sort((a, b) => b.total - a.total);
        scores.forEach((s, i) => s.rank = i + 1);
        // 评级
        scores.forEach(s => {
            if (s.total >= 90) s.grade = 'S';
            else if (s.total >= 80) s.grade = 'A';
            else if (s.total >= 70) s.grade = 'B';
            else if (s.total >= 60) s.grade = 'C';
            else s.grade = 'D';
        });
        this.saveScores(scores);
    },

    // ===== 主渲染 =====
    render() {
        const contentArea = document.querySelector('.content-area');
        contentArea.innerHTML = `
            <div class="biz-module">
                <div class="biz-module-header">
                    <h2><i class="fa-solid fa-trophy"></i> 绩效管理</h2>
                    <div class="biz-header-actions">
                        <select class="filter-select" id="perf-period-select">
                            ${this.getPeriodOptions()}
                        </select>
                        <button class="btn-primary" id="btn-recalc"><i class="fa-solid fa-calculator"></i> 重新计算</button>
                    </div>
                </div>
                <div class="biz-tabs">
                    <button class="biz-tab ${this.currentTab === 'dashboard' ? 'active' : ''}" data-tab="dashboard"><i class="fa-solid fa-gauge-high"></i> 绩效看板</button>
                    <button class="biz-tab ${this.currentTab === 'scoring' ? 'active' : ''}" data-tab="scoring"><i class="fa-solid fa-pen-to-square"></i> 考核评分</button>
                    <button class="biz-tab ${this.currentTab === 'goals' ? 'active' : ''}" data-tab="goals"><i class="fa-solid fa-bullseye"></i> 目标管理</button>
                    <button class="biz-tab ${this.currentTab === 'detail' ? 'active' : ''}" data-tab="detail"><i class="fa-solid fa-table-cells"></i> 明细报表</button>
                    <button class="biz-tab ${this.currentTab === 'config' ? 'active' : ''}" data-tab="config"><i class="fa-solid fa-sliders"></i> 考核配置</button>
                </div>
                <div class="biz-tab-content" id="perf-tab-content"></div>
            </div>
            <div id="perf-modals"></div>
        `;
        this.renderTab();
    },

    getPeriodOptions() {
        const options = [];
        const now = new Date();
        for (let i = 0; i < 6; i++) {
            const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
            const val = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
            const label = `${d.getFullYear()}年${d.getMonth() + 1}月`;
            options.push(`<option value="${val}" ${val === this.currentPeriod ? 'selected' : ''}>${label}</option>`);
        }
        return options.join('');
    },

    renderTab() {
        const container = document.getElementById('perf-tab-content');
        if (!container) return;
        switch (this.currentTab) {
            case 'dashboard': container.innerHTML = this.renderDashboard(); break;
            case 'scoring': container.innerHTML = this.renderScoring(); break;
            case 'goals': container.innerHTML = this.renderGoals(); break;
            case 'detail': container.innerHTML = this.renderDetail(); break;
            case 'config': container.innerHTML = this.renderConfig(); break;
        }
    },

    // ===== 1. 绩效看板 =====
    renderDashboard() {
        const scores = this.loadScores();
        const history = this.loadHistory();
        const config = this.loadConfig();
        const avgTotal = scores.length > 0 ? (scores.reduce((s, p) => s + p.total, 0) / scores.length).toFixed(1) : 0;
        const topPerformer = scores[0] || { name: '-', total: 0 };
        const lowPerformer = scores[scores.length - 1] || { name: '-', total: 0 };
        const maxScore = Math.max(...scores.map(s => s.total), 1);
        const gradeCount = { S: 0, A: 0, B: 0, C: 0, D: 0 };
        scores.forEach(s => { gradeCount[s.grade] = (gradeCount[s.grade] || 0) + 1; });

        return `
            <div class="biz-stats-row">
                <div class="biz-stat-card"><span class="stat-val c-blue">${avgTotal}</span><span class="stat-lbl">团队均分</span></div>
                <div class="biz-stat-card"><span class="stat-val c-green">${escapeHtml(topPerformer.name)}</span><span class="stat-lbl">本月冠军 ${topPerformer.total}分</span></div>
                <div class="biz-stat-card"><span class="stat-val">${scores.length}</span><span class="stat-lbl">考核人数</span></div>
                <div class="biz-stat-card"><span class="stat-val c-orange">${gradeCount.S + gradeCount.A}人</span><span class="stat-lbl">优秀(S/A级)</span></div>
                <div class="biz-stat-card"><span class="stat-val c-red">${gradeCount.D}人</span><span class="stat-lbl">待改进(D级)</span></div>
            </div>
            <div class="dashboard-grid">
                <div class="dash-card">
                    <h4><i class="fa-solid fa-ranking-star"></i> 绩效排名</h4>
                    <div class="perf-ranking">${scores.map((s, i) => `
                        <div class="rank-item ${i === 0 ? 'rank-gold' : i === 1 ? 'rank-silver' : i === 2 ? 'rank-bronze' : ''}" data-action="view-employee" data-name="${escapeHtml(s.name)}" style="cursor:pointer;">
                            <span class="rank-pos">#${s.rank}</span>
                            <span class="rank-name">${escapeHtml(s.name)}</span>
                            <span class="perf-grade grade-${s.grade}">${s.grade}</span>
                            <div class="rank-bar"><div class="rank-bar-fill" style="width:${(s.total / maxScore * 100).toFixed(0)}%"></div></div>
                            <span class="rank-score">${s.total}分</span>
                        </div>
                    `).join('')}</div>
                </div>
                <div class="dash-card">
                    <h4><i class="fa-solid fa-chart-line"></i> 月度趋势</h4>
                    ${this.renderTrendChart(history)}
                    <h4 style="margin-top:18px;"><i class="fa-solid fa-chart-pie"></i> 等级分布</h4>
                    <div class="grade-distribution">
                        ${Object.entries(gradeCount).map(([g, c]) => `
                            <div class="grade-item">
                                <span class="perf-grade grade-${g}">${g}</span>
                                <div class="grade-bar"><div class="grade-bar-fill grade-fill-${g}" style="width:${scores.length > 0 ? (c / scores.length * 100).toFixed(0) : 0}%"></div></div>
                                <span class="grade-count">${c}人</span>
                            </div>
                        `).join('')}
                    </div>
                </div>
                <div class="dash-card" style="grid-column: 1/-1;">
                    <h4><i class="fa-solid fa-table"></i> 维度得分对比</h4>
                    <div class="biz-table-wrap"><table class="biz-table"><thead><tr><th>排名</th><th>员工</th><th>部门</th><th>效率(${config.weights.efficiency}%)</th><th>质量(${config.weights.quality}%)</th><th>评价(${config.weights.satisfaction}%)</th><th>加分</th><th>扣分</th><th>总分</th><th>等级</th></tr></thead><tbody>
                        ${scores.map(s => `<tr data-action="view-employee" data-name="${escapeHtml(s.name)}" style="cursor:pointer;">
                            <td><strong>#${s.rank}</strong></td>
                            <td>${escapeHtml(s.name)}</td>
                            <td><span class="dept-tag">${escapeHtml(s.department || '-')}</span></td>
                            <td><div class="mini-bar-cell"><div class="mini-bar-track"><div class="mini-bar-val" style="width:${s.efficiency}%;background:${s.efficiency >= 80 ? '#10b981' : s.efficiency >= 60 ? '#f59e0b' : '#dc2626'}"></div></div><span>${s.efficiency}</span></div></td>
                            <td><div class="mini-bar-cell"><div class="mini-bar-track"><div class="mini-bar-val" style="width:${s.quality}%;background:${s.quality >= 80 ? '#10b981' : s.quality >= 60 ? '#f59e0b' : '#dc2626'}"></div></div><span>${s.quality}</span></div></td>
                            <td><div class="mini-bar-cell"><div class="mini-bar-track"><div class="mini-bar-val" style="width:${s.satisfaction}%;background:${s.satisfaction >= 80 ? '#10b981' : s.satisfaction >= 60 ? '#f59e0b' : '#dc2626'}"></div></div><span>${s.satisfaction}</span></div></td>
                            <td>${s.bonus_points > 0 ? `<span class="c-green">+${s.bonus_points}</span>` : '-'}</td>
                            <td>${s.deduct_points > 0 ? `<span class="c-red">-${s.deduct_points}</span>` : '-'}</td>
                            <td><strong>${s.total}</strong></td>
                            <td><span class="perf-grade grade-${s.grade}">${s.grade}</span></td>
                        </tr>`).join('')}
                    </tbody></table></div>
                </div>
            </div>
        `;
    },

    renderTrendChart(history) {
        if (!history || history.length === 0) return '<p class="hint-text">暂无历史数据</p>';
        const months = [...new Set(history.map(h => h.period))].sort().slice(-4);
        const employees = [...new Set(history.map(h => h.name))];
        const colors = ['#4f46e5', '#10b981', '#f59e0b', '#dc2626', '#8b5cf6'];
        const maxVal = Math.max(...history.map(h => h.total), 1);

        return `
            <div class="trend-chart">
                <div class="trend-header">${months.map(m => `<span>${m.slice(5)}月</span>`).join('')}</div>
                ${employees.slice(0, 5).map((emp, ei) => {
                    const empData = months.map(m => {
                        const record = history.find(h => h.name === emp && h.period === m);
                        return record ? record.total : 0;
                    });
                    return `<div class="trend-row">
                        <span class="trend-name" style="color:${colors[ei]}">${emp}</span>
                        <div class="trend-bars">${empData.map(v => `<div class="trend-bar-col"><div class="trend-bar-val" style="height:${(v / maxVal * 100).toFixed(0)}%;background:${colors[ei]}"></div><span class="trend-bar-lbl">${v}</span></div>`).join('')}</div>
                    </div>`;
                }).join('')}
            </div>
        `;
    },

    // ===== 2. 考核评分 =====
    renderScoring() {
        const scores = this.loadScores();
        const config = this.loadConfig();
        return `
            <div class="scoring-section">
                <div class="scoring-header">
                    <h4><i class="fa-solid fa-pen-to-square"></i> 考核评分 - ${this.currentPeriod.replace('-', '年') + '月'}</h4>
                    <p class="hint-text">点击员工行的"评分"按钮进行考核打分，支持多维度独立评分和加减分操作</p>
                </div>
                <div class="biz-table-wrap"><table class="biz-table"><thead><tr>
                    <th>员工</th><th>部门</th><th>岗位</th>
                    <th>效率分</th><th>质量分</th><th>评价分</th>
                    <th>加/减分</th><th>当前总分</th><th>等级</th><th>操作</th>
                </tr></thead><tbody>
                    ${scores.map(s => `<tr>
                        <td><strong>${escapeHtml(s.name)}</strong></td>
                        <td>${escapeHtml(s.department || '-')}</td>
                        <td>${escapeHtml(s.role || '-')}</td>
                        <td><input type="number" class="score-input" data-name="${escapeHtml(s.name)}" data-field="efficiency" value="${s.efficiency}" min="0" max="100"></td>
                        <td><input type="number" class="score-input" data-name="${escapeHtml(s.name)}" data-field="quality" value="${s.quality}" min="0" max="100"></td>
                        <td><input type="number" class="score-input" data-name="${escapeHtml(s.name)}" data-field="satisfaction" value="${s.satisfaction}" min="0" max="100"></td>
                        <td>
                            <span class="c-green">+${s.bonus_points || 0}</span> /
                            <span class="c-red">-${s.deduct_points || 0}</span>
                            <button class="btn-mini" data-action="adjust-points" data-name="${escapeHtml(s.name)}" title="加减分">调整</button>
                        </td>
                        <td><span class="score-badge score-${s.total >= 80 ? 'high' : s.total >= 60 ? 'mid' : 'low'}">${s.total}</span></td>
                        <td><span class="perf-grade grade-${s.grade}">${s.grade}</span></td>
                        <td>
                            <button class="btn-mini btn-view" data-action="evaluate" data-name="${escapeHtml(s.name)}">评语</button>
                        </td>
                    </tr>`).join('')}
                </tbody></table></div>
                <div class="scoring-actions" style="margin-top:16px;display:flex;gap:10px;justify-content:flex-end;">
                    <button class="btn-secondary" id="btn-batch-save"><i class="fa-solid fa-save"></i> 保存评分</button>
                    <button class="btn-primary" id="btn-submit-perf"><i class="fa-solid fa-paper-plane"></i> 提交考核</button>
                </div>
                ${this.renderRecentEvaluations(scores)}
            </div>
        `;
    },

    renderRecentEvaluations(scores) {
        const allEvals = [];
        scores.forEach(s => {
            if (s.evaluations && s.evaluations.length > 0) {
                s.evaluations.forEach(ev => allEvals.push({ ...ev, name: s.name }));
            }
        });
        allEvals.sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0));
        if (allEvals.length === 0) return '';
        return `
            <div style="margin-top:24px;">
                <h4 style="font-size:14px;margin-bottom:12px;"><i class="fa-solid fa-comments"></i> 最近评语记录</h4>
                <div class="eval-list">${allEvals.slice(0, 8).map(ev => `
                    <div class="eval-item">
                        <div class="eval-item-header"><strong>${escapeHtml(ev.name)}</strong><span class="td-time">${ev.date ? new Date(ev.date).toLocaleDateString('zh-CN') : ''}</span></div>
                        <p class="eval-item-text">${escapeHtml(ev.content)}</p>
                        <span class="eval-item-author">—— ${escapeHtml(ev.evaluator || '管理员')}</span>
                    </div>
                `).join('')}</div>
            </div>
        `;
    },

    // ===== 3. 目标管理 =====
    renderGoals() {
        const goals = this.loadGoals();
        const scores = this.loadScores();
        return `
            <div class="goals-section">
                <div class="goals-header">
                    <h4><i class="fa-solid fa-bullseye"></i> KPI目标管理</h4>
                    <button class="btn-primary" id="btn-add-goal"><i class="fa-solid fa-plus"></i> 新增目标</button>
                </div>
                <div class="goals-grid">${goals.map(g => {
                    const progress = this.calcGoalProgress(g, scores);
                    return `
                    <div class="goal-card ${progress >= 100 ? 'goal-done' : progress >= 70 ? 'goal-good' : progress >= 40 ? 'goal-warn' : 'goal-risk'}">
                        <div class="goal-card-header">
                            <strong>${escapeHtml(g.title)}</strong>
                            <span class="goal-type-tag">${escapeHtml(g.type)}</span>
                        </div>
                        <div class="goal-card-body">
                            <p class="goal-desc">${escapeHtml(g.description || '')}</p>
                            <div class="goal-target"><span>目标值：</span><strong>${g.target}${g.unit}</strong></div>
                            <div class="goal-current"><span>当前值：</span><strong class="${progress >= 100 ? 'c-green' : 'c-blue'}">${g.current}${g.unit}</strong></div>
                            <div class="goal-progress-wrap">
                                <div class="goal-progress-bar"><div class="goal-progress-fill" style="width:${Math.min(100, progress)}%"></div></div>
                                <span class="goal-progress-pct">${progress.toFixed(0)}%</span>
                            </div>
                        </div>
                        <div class="goal-card-footer">
                            <span class="td-time">${escapeHtml(g.assignee || '全员')}</span>
                            <span class="td-time">截止 ${g.deadline || '-'}</span>
                            <button class="btn-mini" data-action="update-goal" data-id="${g.id}">更新</button>
                        </div>
                    </div>`;
                }).join('')}</div>
            </div>
        `;
    },

    calcGoalProgress(goal, scores) {
        if (goal.current !== undefined && goal.target > 0) {
            return (goal.current / goal.target) * 100;
        }
        return 0;
    },

    // ===== 4. 明细报表 =====
    renderDetail() {
        const scores = this.loadScores();
        const history = this.loadHistory();
        return `
            <div class="detail-section">
                <div class="detail-header">
                    <h4><i class="fa-solid fa-table-cells"></i> 绩效明细报表</h4>
                    <button class="btn-secondary" id="btn-export-perf"><i class="fa-solid fa-file-export"></i> 导出报表</button>
                </div>
                <div class="biz-table-wrap"><table class="biz-table"><thead><tr>
                    <th>排名</th><th>员工</th><th>部门</th><th>总任务</th><th>已完成</th><th>超时</th>
                    <th>平均耗时(h)</th><th>效率分</th><th>质量分</th><th>评价分</th>
                    <th>加分</th><th>扣分</th><th>总分</th><th>等级</th><th>环比</th>
                </tr></thead><tbody>
                    ${scores.map(s => {
                        const prevRecord = history.find(h => h.name === s.name && h.period !== this.currentPeriod);
                        const trend = prevRecord ? s.total - prevRecord.total : 0;
                        return `<tr>
                            <td><strong>#${s.rank}</strong></td>
                            <td>${escapeHtml(s.name)}</td>
                            <td>${escapeHtml(s.department || '-')}</td>
                            <td>${s.tasks_total || 0}</td>
                            <td>${s.tasks_completed || 0}</td>
                            <td>${s.tasks_overdue > 0 ? `<span class="c-red">${s.tasks_overdue}</span>` : '0'}</td>
                            <td>${s.avg_time || '-'}</td>
                            <td>${s.efficiency}</td>
                            <td>${s.quality}</td>
                            <td>${s.satisfaction}</td>
                            <td>${s.bonus_points > 0 ? `<span class="c-green">+${s.bonus_points}</span>` : '-'}</td>
                            <td>${s.deduct_points > 0 ? `<span class="c-red">-${s.deduct_points}</span>` : '-'}</td>
                            <td><span class="score-badge score-${s.total >= 80 ? 'high' : s.total >= 60 ? 'mid' : 'low'}">${s.total}</span></td>
                            <td><span class="perf-grade grade-${s.grade}">${s.grade}</span></td>
                            <td>${trend > 0 ? `<span class="c-green"><i class="fa-solid fa-arrow-up"></i> +${trend}</span>` : trend < 0 ? `<span class="c-red"><i class="fa-solid fa-arrow-down"></i> ${trend}</span>` : '<span class="text-muted">-</span>'}</td>
                        </tr>`;
                    }).join('')}
                </tbody></table></div>
                <div class="detail-summary" style="margin-top:18px;">
                    <div class="dashboard-grid">
                        <div class="dash-card">
                            <h4><i class="fa-solid fa-lightbulb"></i> 智能分析</h4>
                            <div class="ai-alert-list">
                                ${this.generateInsights(scores)}
                            </div>
                        </div>
                        <div class="dash-card">
                            <h4><i class="fa-solid fa-medal"></i> 部门排名</h4>
                            ${this.renderDeptRanking(scores)}
                        </div>
                    </div>
                </div>
            </div>
        `;
    },

    generateInsights(scores) {
        const insights = [];
        const avg = scores.reduce((s, p) => s + p.total, 0) / (scores.length || 1);
        const top = scores[0];
        const low = scores[scores.length - 1];
        if (top) insights.push(`<div class="ai-alert success"><i class="fa-solid fa-trophy"></i> <strong>${top.name}</strong>本月表现最优，总分${top.total}分，建议给予表彰</div>`);
        if (low && low.total < 60) insights.push(`<div class="ai-alert warn"><i class="fa-solid fa-triangle-exclamation"></i> <strong>${low.name}</strong>评分低于60分(${low.total}分)，建议安排一对一辅导</div>`);
        const highEfficiency = scores.filter(s => s.efficiency >= 85);
        if (highEfficiency.length > 0) insights.push(`<div class="ai-alert info"><i class="fa-solid fa-bolt"></i> 效率标兵：${highEfficiency.map(s => s.name).join('、')}，建议分享工作经验</div>`);
        const lowQuality = scores.filter(s => s.quality < 70);
        if (lowQuality.length > 0) insights.push(`<div class="ai-alert danger"><i class="fa-solid fa-exclamation-circle"></i> 质量待提升：${lowQuality.map(s => s.name).join('、')}，建议加强审核培训</div>`);
        if (avg >= 75) insights.push(`<div class="ai-alert success"><i class="fa-solid fa-chart-line"></i> 团队整体均分${avg.toFixed(1)}，处于良好水平</div>`);
        return insights.join('');
    },

    renderDeptRanking(scores) {
        const depts = {};
        scores.forEach(s => {
            const dept = s.department || '未分配';
            if (!depts[dept]) depts[dept] = { name: dept, scores: [], count: 0 };
            depts[dept].scores.push(s.total);
            depts[dept].count++;
        });
        const deptList = Object.values(depts).map(d => ({
            ...d,
            avg: (d.scores.reduce((a, b) => a + b, 0) / d.count).toFixed(1)
        })).sort((a, b) => b.avg - a.avg);
        const maxAvg = Math.max(...deptList.map(d => parseFloat(d.avg)), 1);

        return `<div class="chart-bars">${deptList.map(d => `
            <div class="chart-bar-item">
                <span class="bar-label">${escapeHtml(d.name)}</span>
                <div class="chart-bar"><div class="chart-bar-inner" style="width:${(parseFloat(d.avg) / maxAvg * 100).toFixed(0)}%;background:#4f46e5"></div></div>
                <span class="bar-pct">${d.avg}分(${d.count}人)</span>
            </div>
        `).join('')}</div>`;
    },

    // ===== 5. 考核配置 =====
    renderConfig() {
        const config = this.loadConfig();
        return `
            <div class="config-section">
                <h4><i class="fa-solid fa-sliders"></i> 考核权重配置</h4>
                <div class="config-weight-form">
                    <div class="weight-row">
                        <div class="weight-item">
                            <label>效率指标权重</label>
                            <div class="weight-input-wrap"><input type="number" class="weight-input" id="w-efficiency" value="${config.weights.efficiency}" min="0" max="100">%</div>
                            <p class="hint-text">任务完成率、处理时长、超时率</p>
                        </div>
                        <div class="weight-item">
                            <label>质量指标权重</label>
                            <div class="weight-input-wrap"><input type="number" class="weight-input" id="w-quality" value="${config.weights.quality}" min="0" max="100">%</div>
                            <p class="hint-text">差错率、返工率、NPS、一次通过率</p>
                        </div>
                        <div class="weight-item">
                            <label>客户评价权重</label>
                            <div class="weight-input-wrap"><input type="number" class="weight-input" id="w-satisfaction" value="${config.weights.satisfaction}" min="0" max="100">%</div>
                            <p class="hint-text">满意度评分、响应时效、续签率</p>
                        </div>
                    </div>
                    <p class="hint-text" id="weight-total-hint">权重总计：<strong id="weight-total">${config.weights.efficiency + config.weights.quality + config.weights.satisfaction}%</strong>（应等于100%）</p>
                    <button class="btn-primary" id="btn-save-weights" style="margin-top:12px;"><i class="fa-solid fa-save"></i> 保存权重</button>
                </div>

                <h4 style="margin-top:28px;"><i class="fa-solid fa-ruler-combined"></i> 等级划分规则</h4>
                <div class="biz-table-wrap"><table class="biz-table"><thead><tr><th>等级</th><th>分数区间</th><th>描述</th><th>建议措施</th></tr></thead><tbody>
                    <tr><td><span class="perf-grade grade-S">S</span></td><td>90-100分</td><td>卓越</td><td>晋升加薪、标杆表彰</td></tr>
                    <tr><td><span class="perf-grade grade-A">A</span></td><td>80-89分</td><td>优秀</td><td>绩效奖金、优先培训</td></tr>
                    <tr><td><span class="perf-grade grade-B">B</span></td><td>70-79分</td><td>良好</td><td>正常调薪</td></tr>
                    <tr><td><span class="perf-grade grade-C">C</span></td><td>60-69分</td><td>合格</td><td>制定改进计划</td></tr>
                    <tr><td><span class="perf-grade grade-D">D</span></td><td>0-59分</td><td>待改进</td><td>辅导面谈、PIP计划</td></tr>
                </tbody></table></div>

                <h4 style="margin-top:28px;"><i class="fa-solid fa-users"></i> 考核人员名单</h4>
                <div class="biz-table-wrap"><table class="biz-table"><thead><tr><th>姓名</th><th>部门</th><th>岗位</th><th>入职日期</th><th>操作</th></tr></thead><tbody>
                    ${config.employees.map(e => `<tr>
                        <td><strong>${escapeHtml(e.name)}</strong></td>
                        <td>${escapeHtml(e.department)}</td>
                        <td>${escapeHtml(e.role)}</td>
                        <td class="td-time">${e.joinDate || '-'}</td>
                        <td><button class="btn-mini btn-operate" data-action="remove-employee" data-name="${escapeHtml(e.name)}">移除</button></td>
                    </tr>`).join('')}
                </tbody></table></div>
                <button class="btn-secondary" id="btn-add-employee" style="margin-top:12px;"><i class="fa-solid fa-user-plus"></i> 添加人员</button>
            </div>
        `;
    },

    // ===== 弹窗：员工详情 =====
    showEmployeeDetail(name) {
        const scores = this.loadScores();
        const history = this.loadHistory();
        const goals = this.loadGoals();
        const emp = scores.find(s => s.name === name);
        if (!emp) return;
        const empHistory = history.filter(h => h.name === name).sort((a, b) => a.period.localeCompare(b.period));
        const empGoals = goals.filter(g => g.assignee === name || g.assignee === '全员');

        document.getElementById('perf-modals').innerHTML = `
            <div class="modal active" id="emp-detail-modal"><div class="modal-content" style="max-width:700px;">
                <div class="modal-header"><h3><i class="fa-solid fa-user"></i> ${escapeHtml(name)} - 绩效档案</h3><button class="modal-close" id="close-emp-modal">&times;</button></div>
                <div class="modal-body-form" style="padding:20px 24px;">
                    <div class="biz-stats-row" style="margin-bottom:18px;">
                        <div class="biz-stat-card"><span class="stat-val">${emp.total}</span><span class="stat-lbl">总分</span></div>
                        <div class="biz-stat-card"><span class="stat-val"><span class="perf-grade grade-${emp.grade}">${emp.grade}</span></span><span class="stat-lbl">等级</span></div>
                        <div class="biz-stat-card"><span class="stat-val">#${emp.rank}</span><span class="stat-lbl">排名</span></div>
                        <div class="biz-stat-card"><span class="stat-val">${emp.tasks_completed}/${emp.tasks_total}</span><span class="stat-lbl">完成/总任务</span></div>
                    </div>
                    <h4 style="font-size:14px;margin-bottom:10px;"><i class="fa-solid fa-chart-bar"></i> 维度得分</h4>
                    <div class="emp-dimensions">
                        <div class="dim-item"><span class="dim-label">效率</span><div class="dim-bar"><div class="dim-bar-fill" style="width:${emp.efficiency}%;background:#3b82f6"></div></div><span class="dim-val">${emp.efficiency}</span></div>
                        <div class="dim-item"><span class="dim-label">质量</span><div class="dim-bar"><div class="dim-bar-fill" style="width:${emp.quality}%;background:#10b981"></div></div><span class="dim-val">${emp.quality}</span></div>
                        <div class="dim-item"><span class="dim-label">评价</span><div class="dim-bar"><div class="dim-bar-fill" style="width:${emp.satisfaction}%;background:#f59e0b"></div></div><span class="dim-val">${emp.satisfaction}</span></div>
                    </div>
                    ${empHistory.length > 0 ? `
                        <h4 style="font-size:14px;margin:18px 0 10px;"><i class="fa-solid fa-clock-rotate-left"></i> 历史得分</h4>
                        <div class="emp-history-chart">${empHistory.map(h => `
                            <div class="history-month"><span class="history-label">${h.period.slice(5)}月</span><div class="history-bar-wrap"><div class="history-bar" style="width:${h.total}%;background:${h.total >= 80 ? '#10b981' : h.total >= 60 ? '#f59e0b' : '#dc2626'}"></div></div><span class="history-val">${h.total}分</span></div>
                        `).join('')}</div>
                    ` : ''}
                    ${emp.evaluations && emp.evaluations.length > 0 ? `
                        <h4 style="font-size:14px;margin:18px 0 10px;"><i class="fa-solid fa-comments"></i> 评语记录</h4>
                        <div class="eval-list">${emp.evaluations.map(ev => `
                            <div class="eval-item"><div class="eval-item-header"><span class="td-time">${ev.date ? new Date(ev.date).toLocaleDateString('zh-CN') : ''}</span></div><p class="eval-item-text">${escapeHtml(ev.content)}</p></div>
                        `).join('')}</div>
                    ` : ''}
                </div>
            </div></div>
        `;
        document.getElementById('close-emp-modal').addEventListener('click', () => document.getElementById('emp-detail-modal').remove());
    },

    // ===== 弹窗：评语 =====
    showEvaluateModal(name) {
        const scores = this.loadScores();
        const emp = scores.find(s => s.name === name);
        if (!emp) return;

        document.getElementById('perf-modals').innerHTML = `
            <div class="modal active" id="eval-modal"><div class="modal-content" style="max-width:500px;">
                <div class="modal-header"><h3><i class="fa-solid fa-pen"></i> 评价 - ${escapeHtml(name)}</h3><button class="modal-close" id="close-eval-modal">&times;</button></div>
                <form id="eval-form" class="modal-body-form">
                    <div class="form-group"><label>综合评语 *</label><textarea name="content" rows="4" required placeholder="请输入对该员工本月表现的评价..."></textarea></div>
                    <div class="form-row">
                        <div class="form-group"><label>评价人</label><input type="text" name="evaluator" value="管理员"></div>
                        <div class="form-group"><label>评价类型</label><select name="type"><option value="monthly">月度考核</option><option value="praise">表扬</option><option value="improvement">改进建议</option></select></div>
                    </div>
                    <div class="form-group"><label>快捷评语模板</label>
                        <div class="eval-templates">
                            <span class="eval-tpl-tag" data-tpl="本月工作表现优异，任务完成率高，继续保持。">表现优异</span>
                            <span class="eval-tpl-tag" data-tpl="工作态度积极，但需注意任务时效性，减少超时情况。">需改进时效</span>
                            <span class="eval-tpl-tag" data-tpl="专业能力突出，建议多参与团队协作和经验分享。">专业突出</span>
                            <span class="eval-tpl-tag" data-tpl="质量把控需加强，建议加强复核流程。">质量待提升</span>
                            <span class="eval-tpl-tag" data-tpl="客户反馈良好，服务意识强。">客户认可</span>
                        </div>
                    </div>
                    <div class="form-actions"><button type="button" class="btn-secondary" id="cancel-eval-modal">取消</button><button type="submit" class="btn-primary"><i class="fa-solid fa-check"></i> 提交评语</button></div>
                </form>
            </div></div>
        `;
        document.getElementById('close-eval-modal').addEventListener('click', () => document.getElementById('eval-modal').remove());
        document.getElementById('cancel-eval-modal').addEventListener('click', () => document.getElementById('eval-modal').remove());
        // 快捷模板点击
        document.querySelectorAll('.eval-tpl-tag').forEach(tag => {
            tag.addEventListener('click', () => {
                document.querySelector('#eval-form textarea[name="content"]').value = tag.dataset.tpl;
            });
        });
        document.getElementById('eval-form').addEventListener('submit', (e) => {
            e.preventDefault();
            const fd = new FormData(e.target);
            const data = Object.fromEntries(fd);
            const allScores = this.loadScores();
            const target = allScores.find(s => s.name === name);
            if (target) {
                if (!target.evaluations) target.evaluations = [];
                target.evaluations.unshift({ content: data.content, evaluator: data.evaluator, type: data.type, date: new Date().toISOString() });
                this.saveScores(allScores);
            }
            document.getElementById('eval-modal').remove();
            this.renderTab();
            showToast(`已为 ${name} 添加评语`, 'success');
        });
    },

    // ===== 弹窗：加减分 =====
    showAdjustModal(name) {
        const scores = this.loadScores();
        const emp = scores.find(s => s.name === name);
        if (!emp) return;

        document.getElementById('perf-modals').innerHTML = `
            <div class="modal active" id="adjust-modal"><div class="modal-content" style="max-width:450px;">
                <div class="modal-header"><h3><i class="fa-solid fa-plus-minus"></i> 加减分 - ${escapeHtml(name)}</h3><button class="modal-close" id="close-adjust-modal">&times;</button></div>
                <form id="adjust-form" class="modal-body-form">
                    <div class="form-row">
                        <div class="form-group"><label>加分</label><input type="number" name="bonus" value="${emp.bonus_points || 0}" min="0" max="20"></div>
                        <div class="form-group"><label>扣分</label><input type="number" name="deduct" value="${emp.deduct_points || 0}" min="0" max="20"></div>
                    </div>
                    <div class="form-group"><label>加分原因</label><input type="text" name="bonus_reason" placeholder="如：主动加班完成紧急任务" value="${emp.bonus_reason || ''}"></div>
                    <div class="form-group"><label>扣分原因</label><input type="text" name="deduct_reason" placeholder="如：客户投诉、重大差错" value="${emp.deduct_reason || ''}"></div>
                    <p class="hint-text">加减分范围 0-20 分，将直接影响总分计算</p>
                    <div class="form-actions"><button type="button" class="btn-secondary" id="cancel-adjust-modal">取消</button><button type="submit" class="btn-primary">确认</button></div>
                </form>
            </div></div>
        `;
        document.getElementById('close-adjust-modal').addEventListener('click', () => document.getElementById('adjust-modal').remove());
        document.getElementById('cancel-adjust-modal').addEventListener('click', () => document.getElementById('adjust-modal').remove());
        document.getElementById('adjust-form').addEventListener('submit', (e) => {
            e.preventDefault();
            const fd = new FormData(e.target);
            const data = Object.fromEntries(fd);
            const allScores = this.loadScores();
            const target = allScores.find(s => s.name === name);
            if (target) {
                target.bonus_points = parseInt(data.bonus) || 0;
                target.deduct_points = parseInt(data.deduct) || 0;
                target.bonus_reason = data.bonus_reason;
                target.deduct_reason = data.deduct_reason;
                // 重新计算总分
                const config = this.loadConfig();
                const w = config.weights;
                target.total = Math.round(target.efficiency * (w.efficiency / 100) + target.quality * (w.quality / 100) + target.satisfaction * (w.satisfaction / 100) + target.bonus_points - target.deduct_points);
                target.total = Math.max(0, Math.min(100, target.total));
                if (target.total >= 90) target.grade = 'S';
                else if (target.total >= 80) target.grade = 'A';
                else if (target.total >= 70) target.grade = 'B';
                else if (target.total >= 60) target.grade = 'C';
                else target.grade = 'D';
                // 重新排名
                allScores.sort((a, b) => b.total - a.total);
                allScores.forEach((s, i) => s.rank = i + 1);
                this.saveScores(allScores);
            }
            document.getElementById('adjust-modal').remove();
            this.renderTab();
            showToast(`${name} 加减分已更新`, 'success');
        });
    },

    // ===== 弹窗：新增目标 =====
    showAddGoalModal() {
        const config = this.loadConfig();
        document.getElementById('perf-modals').innerHTML = `
            <div class="modal active" id="goal-modal"><div class="modal-content" style="max-width:500px;">
                <div class="modal-header"><h3><i class="fa-solid fa-bullseye"></i> 新增KPI目标</h3><button class="modal-close" id="close-goal-modal">&times;</button></div>
                <form id="goal-form" class="modal-body-form">
                    <div class="form-group"><label>目标名称 *</label><input type="text" name="title" required placeholder="如：月度任务完成率≥90%"></div>
                    <div class="form-row">
                        <div class="form-group"><label>类型</label><select name="type"><option value="效率">效率</option><option value="质量">质量</option><option value="营收">营收</option><option value="客户">客户</option></select></div>
                        <div class="form-group"><label>负责人</label><select name="assignee"><option value="全员">全员</option>${config.employees.map(e => `<option value="${e.name}">${e.name}</option>`).join('')}</select></div>
                    </div>
                    <div class="form-row">
                        <div class="form-group"><label>目标值 *</label><input type="number" name="target" required min="1"></div>
                        <div class="form-group"><label>单位</label><input type="text" name="unit" value="%" placeholder="如：%、个、万元"></div>
                    </div>
                    <div class="form-row">
                        <div class="form-group"><label>当前值</label><input type="number" name="current" value="0" min="0"></div>
                        <div class="form-group"><label>截止日期</label><input type="date" name="deadline"></div>
                    </div>
                    <div class="form-group"><label>描述</label><textarea name="description" rows="2" placeholder="目标的具体说明..."></textarea></div>
                    <div class="form-actions"><button type="button" class="btn-secondary" id="cancel-goal-modal">取消</button><button type="submit" class="btn-primary"><i class="fa-solid fa-plus"></i> 创建</button></div>
                </form>
            </div></div>
        `;
        document.getElementById('close-goal-modal').addEventListener('click', () => document.getElementById('goal-modal').remove());
        document.getElementById('cancel-goal-modal').addEventListener('click', () => document.getElementById('goal-modal').remove());
        document.getElementById('goal-form').addEventListener('submit', (e) => {
            e.preventDefault();
            const fd = new FormData(e.target);
            const data = Object.fromEntries(fd);
            const goals = this.loadGoals();
            goals.unshift({
                id: 'goal_' + Date.now().toString(36),
                title: data.title,
                type: data.type,
                assignee: data.assignee,
                target: parseFloat(data.target),
                current: parseFloat(data.current) || 0,
                unit: data.unit || '%',
                deadline: data.deadline || '',
                description: data.description || '',
                created_at: new Date().toISOString()
            });
            this.saveGoals(goals);
            document.getElementById('goal-modal').remove();
            this.renderTab();
            showToast('KPI目标创建成功', 'success');
        });
    },

    // ===== 弹窗：更新目标进度 =====
    showUpdateGoalModal(id) {
        const goals = this.loadGoals();
        const goal = goals.find(g => g.id === id);
        if (!goal) return;

        document.getElementById('perf-modals').innerHTML = `
            <div class="modal active" id="update-goal-modal"><div class="modal-content" style="max-width:400px;">
                <div class="modal-header"><h3>更新目标进度</h3><button class="modal-close" id="close-ugoal-modal">&times;</button></div>
                <form id="update-goal-form" class="modal-body-form">
                    <p style="font-size:13px;color:#475569;margin-bottom:14px;"><strong>${escapeHtml(goal.title)}</strong><br>目标值：${goal.target}${goal.unit}</p>
                    <div class="form-group"><label>当前进度值</label><input type="number" name="current" value="${goal.current}" min="0" step="0.1" required></div>
                    <div class="form-actions"><button type="button" class="btn-secondary" id="cancel-ugoal-modal">取消</button><button type="submit" class="btn-primary">更新</button></div>
                </form>
            </div></div>
        `;
        document.getElementById('close-ugoal-modal').addEventListener('click', () => document.getElementById('update-goal-modal').remove());
        document.getElementById('cancel-ugoal-modal').addEventListener('click', () => document.getElementById('update-goal-modal').remove());
        document.getElementById('update-goal-form').addEventListener('submit', (e) => {
            e.preventDefault();
            const fd = new FormData(e.target);
            goal.current = parseFloat(fd.get('current')) || 0;
            this.saveGoals(goals);
            document.getElementById('update-goal-modal').remove();
            this.renderTab();
            showToast('目标进度已更新', 'success');
        });
    },

    // ===== 弹窗：添加考核人员 =====
    showAddEmployeeModal() {
        document.getElementById('perf-modals').innerHTML = `
            <div class="modal active" id="add-emp-modal"><div class="modal-content" style="max-width:450px;">
                <div class="modal-header"><h3>添加考核人员</h3><button class="modal-close" id="close-addemp-modal">&times;</button></div>
                <form id="add-emp-form" class="modal-body-form">
                    <div class="form-group"><label>姓名 *</label><input type="text" name="name" required></div>
                    <div class="form-row">
                        <div class="form-group"><label>部门 *</label><select name="department"><option value="会计部">会计部</option><option value="工商部">工商部</option><option value="顾问部">顾问部</option><option value="运营部">运营部</option></select></div>
                        <div class="form-group"><label>岗位</label><input type="text" name="role" placeholder="如：会计"></div>
                    </div>
                    <div class="form-group"><label>入职日期</label><input type="date" name="joinDate"></div>
                    <div class="form-actions"><button type="button" class="btn-secondary" id="cancel-addemp-modal">取消</button><button type="submit" class="btn-primary">添加</button></div>
                </form>
            </div></div>
        `;
        document.getElementById('close-addemp-modal').addEventListener('click', () => document.getElementById('add-emp-modal').remove());
        document.getElementById('cancel-addemp-modal').addEventListener('click', () => document.getElementById('add-emp-modal').remove());
        document.getElementById('add-emp-form').addEventListener('submit', (e) => {
            e.preventDefault();
            const fd = new FormData(e.target);
            const data = Object.fromEntries(fd);
            const config = this.loadConfig();
            if (config.employees.find(emp => emp.name === data.name)) { showToast('该员工已存在', 'warning'); return; }
            config.employees.push({ name: data.name, department: data.department, role: data.role || '', joinDate: data.joinDate || '' });
            this.saveConfig(config);
            document.getElementById('add-emp-modal').remove();
            this.autoCalc();
            this.renderTab();
            showToast(`已添加 ${data.name} 到考核名单`, 'success');
        });
    },

    // ===== 事件绑定 =====
    bindEvents() {
        const module = document.querySelector('.biz-module');
        if (!module) return;

        module.addEventListener('click', (e) => {
            // Tab切换
            const tab = e.target.closest('.biz-tab');
            if (tab) {
                this.currentTab = tab.dataset.tab;
                module.querySelectorAll('.biz-tab').forEach(t => t.classList.remove('active'));
                tab.classList.add('active');
                this.renderTab();
                this.rebindTabEvents();
                return;
            }
            // 按钮操作
            const actionEl = e.target.closest('[data-action]');
            if (actionEl) {
                const action = actionEl.dataset.action;
                const name = actionEl.dataset.name;
                const id = actionEl.dataset.id;
                if (action === 'view-employee') this.showEmployeeDetail(name);
                else if (action === 'evaluate') this.showEvaluateModal(name);
                else if (action === 'adjust-points') this.showAdjustModal(name);
                else if (action === 'update-goal') this.showUpdateGoalModal(id);
                else if (action === 'remove-employee') this.removeEmployee(name);
                return;
            }
        });

        // 头部按钮
        const recalcBtn = document.getElementById('btn-recalc');
        if (recalcBtn) recalcBtn.addEventListener('click', () => { this.autoCalc(); this.renderTab(); showToast('绩效已重新计算', 'success'); });

        const periodSelect = document.getElementById('perf-period-select');
        if (periodSelect) periodSelect.addEventListener('change', (e) => { this.currentPeriod = e.target.value; this.renderTab(); });

        this.rebindTabEvents();
    },

    rebindTabEvents() {
        // 评分页面的保存按钮
        const batchSaveBtn = document.getElementById('btn-batch-save');
        if (batchSaveBtn) batchSaveBtn.addEventListener('click', () => this.batchSaveScores());

        const submitBtn = document.getElementById('btn-submit-perf');
        if (submitBtn) submitBtn.addEventListener('click', () => this.submitPerformance());

        // 目标页面
        const addGoalBtn = document.getElementById('btn-add-goal');
        if (addGoalBtn) addGoalBtn.addEventListener('click', () => this.showAddGoalModal());

        // 配置页面
        const saveWeightsBtn = document.getElementById('btn-save-weights');
        if (saveWeightsBtn) saveWeightsBtn.addEventListener('click', () => this.saveWeights());

        const addEmpBtn = document.getElementById('btn-add-employee');
        if (addEmpBtn) addEmpBtn.addEventListener('click', () => this.showAddEmployeeModal());

        // 权重实时计算
        document.querySelectorAll('.weight-input').forEach(inp => {
            inp.addEventListener('input', () => {
                const e = parseInt(document.getElementById('w-efficiency').value) || 0;
                const q = parseInt(document.getElementById('w-quality').value) || 0;
                const s = parseInt(document.getElementById('w-satisfaction').value) || 0;
                const total = e + q + s;
                const el = document.getElementById('weight-total');
                if (el) { el.textContent = total + '%'; el.style.color = total === 100 ? '#10b981' : '#dc2626'; }
            });
        });

        // 导出按钮
        const exportBtn = document.getElementById('btn-export-perf');
        if (exportBtn) exportBtn.addEventListener('click', () => { showToast('报表导出成功（模拟）', 'success'); });
    },

    // ===== 操作方法 =====
    batchSaveScores() {
        const scores = this.loadScores();
        const config = this.loadConfig();
        const inputs = document.querySelectorAll('.score-input');
        inputs.forEach(inp => {
            const name = inp.dataset.name;
            const field = inp.dataset.field;
            const val = Math.max(0, Math.min(100, parseInt(inp.value) || 0));
            const emp = scores.find(s => s.name === name);
            if (emp) emp[field] = val;
        });
        // 重新计算总分和排名
        const w = config.weights;
        scores.forEach(s => {
            s.total = Math.round(s.efficiency * (w.efficiency / 100) + s.quality * (w.quality / 100) + s.satisfaction * (w.satisfaction / 100) + (s.bonus_points || 0) - (s.deduct_points || 0));
            s.total = Math.max(0, Math.min(100, s.total));
            if (s.total >= 90) s.grade = 'S';
            else if (s.total >= 80) s.grade = 'A';
            else if (s.total >= 70) s.grade = 'B';
            else if (s.total >= 60) s.grade = 'C';
            else s.grade = 'D';
        });
        scores.sort((a, b) => b.total - a.total);
        scores.forEach((s, i) => s.rank = i + 1);
        this.saveScores(scores);
        this.renderTab();
        this.rebindTabEvents();
        showToast('评分已保存，总分和排名已更新', 'success');
    },

    submitPerformance() {
        const scores = this.loadScores();
        const history = this.loadHistory();
        // 将当前评分保存到历史记录
        scores.forEach(s => {
            const existing = history.find(h => h.name === s.name && h.period === this.currentPeriod);
            if (existing) {
                existing.total = s.total;
                existing.grade = s.grade;
                existing.efficiency = s.efficiency;
                existing.quality = s.quality;
                existing.satisfaction = s.satisfaction;
            } else {
                history.push({ name: s.name, period: this.currentPeriod, total: s.total, grade: s.grade, efficiency: s.efficiency, quality: s.quality, satisfaction: s.satisfaction });
            }
        });
        this.saveHistory(history);
        showToast(`${this.currentPeriod} 考核已提交并归档`, 'success');
    },

    saveWeights() {
        const e = parseInt(document.getElementById('w-efficiency').value) || 0;
        const q = parseInt(document.getElementById('w-quality').value) || 0;
        const s = parseInt(document.getElementById('w-satisfaction').value) || 0;
        if (e + q + s !== 100) { showToast('权重总计必须等于100%', 'warning'); return; }
        const config = this.loadConfig();
        config.weights = { efficiency: e, quality: q, satisfaction: s };
        this.saveConfig(config);
        this.autoCalc();
        showToast('权重配置已保存，绩效已重新计算', 'success');
    },

    removeEmployee(name) {
        if (!confirm(`确定从考核名单移除 ${name}？`)) return;
        const config = this.loadConfig();
        config.employees = config.employees.filter(e => e.name !== name);
        this.saveConfig(config);
        const scores = this.loadScores();
        const newScores = scores.filter(s => s.name !== name);
        newScores.sort((a, b) => b.total - a.total);
        newScores.forEach((s, i) => s.rank = i + 1);
        this.saveScores(newScores);
        this.renderTab();
        this.rebindTabEvents();
        showToast(`已移除 ${name}`, 'success');
    }
};

// ===== 默认数据 =====
const defaultPerfScores = [
    { name: '王芳', department: '会计部', role: '高级会计', efficiency: 85, quality: 90, satisfaction: 88, total: 88, rank: 1, grade: 'A', tasks_total: 12, tasks_completed: 10, tasks_overdue: 0, avg_time: '2.8', bonus_points: 3, deduct_points: 0, bonus_reason: '主动加班完成紧急报税', deduct_reason: '', period: '2024-03', evaluations: [{ content: '本月工作表现优异，专业能力突出，客户反馈极佳。', evaluator: '管理员', type: 'monthly', date: '2024-03-28T10:00:00Z' }] },
    { name: '张伟', department: '会计部', role: '会计', efficiency: 78, quality: 85, satisfaction: 82, total: 82, rank: 2, grade: 'A', tasks_total: 10, tasks_completed: 7, tasks_overdue: 1, avg_time: '3.2', bonus_points: 0, deduct_points: 0, bonus_reason: '', deduct_reason: '', period: '2024-03', evaluations: [{ content: '整体表现良好，需关注超时任务的控制。', evaluator: '管理员', type: 'monthly', date: '2024-03-28T10:00:00Z' }] },
    { name: '陈丽', department: '工商部', role: '工商专员', efficiency: 75, quality: 82, satisfaction: 85, total: 80, rank: 3, grade: 'A', tasks_total: 9, tasks_completed: 6, tasks_overdue: 1, avg_time: '3.5', bonus_points: 2, deduct_points: 0, bonus_reason: '协助新人带教', deduct_reason: '', period: '2024-03', evaluations: [] },
    { name: '李强', department: '工商部', role: '工商专员', efficiency: 72, quality: 78, satisfaction: 80, total: 76, rank: 4, grade: 'B', tasks_total: 8, tasks_completed: 5, tasks_overdue: 1, avg_time: '2.5', bonus_points: 0, deduct_points: 2, bonus_reason: '', deduct_reason: '客户投诉1次', period: '2024-03', evaluations: [] },
    { name: '赵敏', department: '顾问部', role: '财税顾问', efficiency: 68, quality: 75, satisfaction: 78, total: 72, rank: 5, grade: 'B', tasks_total: 6, tasks_completed: 4, tasks_overdue: 0, avg_time: '3.0', bonus_points: 0, deduct_points: 0, bonus_reason: '', deduct_reason: '', period: '2024-03', evaluations: [{ content: '工作态度积极，但效率有提升空间。', evaluator: '管理员', type: 'improvement', date: '2024-03-28T10:00:00Z' }] }
];

const defaultPerfHistory = [
    { name: '王芳', period: '2024-01', total: 82, grade: 'A', efficiency: 80, quality: 85, satisfaction: 85 },
    { name: '王芳', period: '2024-02', total: 85, grade: 'A', efficiency: 82, quality: 88, satisfaction: 86 },
    { name: '王芳', period: '2024-03', total: 88, grade: 'A', efficiency: 85, quality: 90, satisfaction: 88 },
    { name: '张伟', period: '2024-01', total: 76, grade: 'B', efficiency: 72, quality: 80, satisfaction: 78 },
    { name: '张伟', period: '2024-02', total: 79, grade: 'B', efficiency: 75, quality: 82, satisfaction: 80 },
    { name: '张伟', period: '2024-03', total: 82, grade: 'A', efficiency: 78, quality: 85, satisfaction: 82 },
    { name: '陈丽', period: '2024-01', total: 74, grade: 'B', efficiency: 70, quality: 78, satisfaction: 80 },
    { name: '陈丽', period: '2024-02', total: 77, grade: 'B', efficiency: 73, quality: 80, satisfaction: 82 },
    { name: '陈丽', period: '2024-03', total: 80, grade: 'A', efficiency: 75, quality: 82, satisfaction: 85 },
    { name: '李强', period: '2024-01', total: 70, grade: 'B', efficiency: 68, quality: 72, satisfaction: 75 },
    { name: '李强', period: '2024-02', total: 73, grade: 'B', efficiency: 70, quality: 75, satisfaction: 78 },
    { name: '李强', period: '2024-03', total: 76, grade: 'B', efficiency: 72, quality: 78, satisfaction: 80 },
    { name: '赵敏', period: '2024-01', total: 68, grade: 'C', efficiency: 62, quality: 72, satisfaction: 75 },
    { name: '赵敏', period: '2024-02', total: 70, grade: 'B', efficiency: 65, quality: 73, satisfaction: 76 },
    { name: '赵敏', period: '2024-03', total: 72, grade: 'B', efficiency: 68, quality: 75, satisfaction: 78 }
];

const defaultPerfGoals = [
    { id: 'goal_001', title: '月度任务完成率', type: '效率', assignee: '全员', target: 90, current: 78, unit: '%', deadline: '2024-03-31', description: '团队月度任务按时完成率目标' },
    { id: 'goal_002', title: '客户满意度NPS', type: '客户', assignee: '全员', target: 85, current: 82, unit: '分', deadline: '2024-03-31', description: '服务满意度综合评分目标' },
    { id: 'goal_003', title: '税务申报零差错', type: '质量', assignee: '王芳', target: 100, current: 95, unit: '%', deadline: '2024-03-31', description: '当月税务申报一次通过率' },
    { id: 'goal_004', title: '新客户转化数', type: '营收', assignee: '全员', target: 15, current: 11, unit: '个', deadline: '2024-03-31', description: '本月新签约客户数量目标' },
    { id: 'goal_005', title: '工商办理时效', type: '效率', assignee: '李强', target: 5, current: 6.5, unit: '天', deadline: '2024-03-31', description: '平均工商代办完成天数（越低越好）' }
];

const defaultPerfConfig = {
    weights: { efficiency: 40, quality: 50, satisfaction: 10 },
    employees: [
        { name: '王芳', department: '会计部', role: '高级会计', joinDate: '2021-03-15' },
        { name: '张伟', department: '会计部', role: '会计', joinDate: '2022-06-01' },
        { name: '陈丽', department: '工商部', role: '工商专员', joinDate: '2022-01-10' },
        { name: '李强', department: '工商部', role: '工商专员', joinDate: '2023-02-20' },
        { name: '赵敏', department: '顾问部', role: '财税顾问', joinDate: '2023-07-15' }
    ]
};
