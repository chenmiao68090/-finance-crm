// 绩效管理模块 - 浙杭企服（代理记账业务系统）
// 功能：多维度考核、自动采集、透明化看板、排名趋势

const PerfManagement = {
    currentTab: 'dashboard',

    init() { this.calcScores(); this.render(); this.bindEvents(); },
    destroy() {},

    loadScores() { const d = localStorage.getItem('biz_perf_scores'); if (!d) { localStorage.setItem('biz_perf_scores', JSON.stringify(defaultPerfScores)); return [...defaultPerfScores]; } return JSON.parse(d); },
    saveScores(data) { localStorage.setItem('biz_perf_scores', JSON.stringify(data)); },

    // ===== 自动计算绩效 =====
    calcScores() {
        const tasks = JSON.parse(localStorage.getItem('biz_tasks') || '[]');
        const employees = ['王芳', '李强', '张伟', '陈丽', '赵敏'];
        const scores = this.loadScores();

        employees.forEach(name => {
            let existing = scores.find(s => s.name === name);
            if (!existing) { existing = { name, efficiency: 0, quality: 0, satisfaction: 0, total: 0, rank: 0 }; scores.push(existing); }
            const myTasks = tasks.filter(t => t.assigned_to === name);
            const completed = myTasks.filter(t => t.status === 'completed');
            const overdue = myTasks.filter(t => t.status === 'overdue');
            // 效率分（40%）：基于完成率和超时率
            const completionRate = myTasks.length > 0 ? completed.length / myTasks.length : 0;
            const overdueRate = myTasks.length > 0 ? overdue.length / myTasks.length : 0;
            existing.efficiency = Math.round(Math.min(100, completionRate * 100 - overdueRate * 30));
            // 质量分（50%）：模拟返工率（随机但稳定）
            existing.quality = existing.quality || Math.round(70 + Math.random() * 25);
            // 客户评价（10%）：模拟NPS
            existing.satisfaction = existing.satisfaction || Math.round(60 + Math.random() * 35);
            // 总分
            existing.total = Math.round(existing.efficiency * 0.4 + existing.quality * 0.5 + existing.satisfaction * 0.1);
            // 额外数据
            existing.tasks_total = myTasks.length;
            existing.tasks_completed = completed.length;
            existing.tasks_overdue = overdue.length;
            existing.avg_time = completed.length > 0 ? (completed.reduce((s, t) => s + (t.time_spent || 0), 0) / completed.length).toFixed(1) : 0;
        });
        // 排名
        scores.sort((a, b) => b.total - a.total);
        scores.forEach((s, i) => s.rank = i + 1);
        this.saveScores(scores);
    },

    render() {
        const contentArea = document.querySelector('.content-area');
        contentArea.innerHTML = `
            <div class="biz-module">
                <div class="biz-module-header"><h2><i class="fa-solid fa-trophy"></i> 绩效管理</h2></div>
                <div class="biz-tabs">
                    <button class="biz-tab active" data-tab="dashboard"><i class="fa-solid fa-gauge-high"></i> 绩效看板</button>
                    <button class="biz-tab" data-tab="detail"><i class="fa-solid fa-table-cells"></i> 明细数据</button>
                    <button class="biz-tab" data-tab="metrics"><i class="fa-solid fa-ruler"></i> 考核指标</button>
                    <button class="biz-tab" data-tab="collection"><i class="fa-solid fa-robot"></i> 自动采集</button>
                </div>
                <div class="biz-tab-content" id="perf-tab-content"></div>
            </div>
        `;
        this.renderTab();
    },

    renderTab() {
        const container = document.getElementById('perf-tab-content');
        switch (this.currentTab) {
            case 'dashboard': container.innerHTML = this.renderDashboard(); break;
            case 'detail': container.innerHTML = this.renderDetail(); break;
            case 'metrics': container.innerHTML = this.renderMetrics(); break;
            case 'collection': container.innerHTML = this.renderCollection(); break;
        }
    },

    renderDashboard() {
        const scores = this.loadScores();
        const avgTotal = scores.length > 0 ? (scores.reduce((s, p) => s + p.total, 0) / scores.length).toFixed(1) : 0;
        const topPerformer = scores[0] || { name: '-', total: 0 };
        const maxScore = Math.max(...scores.map(s => s.total), 1);

        return `
            <div class="biz-stats-row">
                <div class="biz-stat-card"><span class="stat-val c-blue">${avgTotal}</span><span class="stat-lbl">团队均分</span></div>
                <div class="biz-stat-card"><span class="stat-val c-green">${topPerformer.name}</span><span class="stat-lbl">本月冠军</span></div>
                <div class="biz-stat-card"><span class="stat-val">${scores.length}</span><span class="stat-lbl">考核人数</span></div>
            </div>
            <div class="dashboard-grid">
                <div class="dash-card"><h4><i class="fa-solid fa-ranking-star"></i> 绩效排名</h4>
                    <div class="perf-ranking">${scores.map((s, i) => `
                        <div class="rank-item ${i === 0 ? 'rank-gold' : i === 1 ? 'rank-silver' : i === 2 ? 'rank-bronze' : ''}">
                            <span class="rank-pos">#${s.rank}</span>
                            <span class="rank-name">${escapeHtml(s.name)}</span>
                            <div class="rank-bar"><div class="rank-bar-fill" style="width:${(s.total / maxScore * 100).toFixed(0)}%"></div></div>
                            <span class="rank-score">${s.total}分</span>
                        </div>
                    `).join('')}</div>
                </div>
                <div class="dash-card"><h4><i class="fa-solid fa-chart-radar"></i> 能力雷达</h4>
                    <table class="mini-table"><thead><tr><th>员工</th><th>效率(40%)</th><th>质量(50%)</th><th>评价(10%)</th><th>总分</th></tr></thead><tbody>
                        ${scores.map(s => `<tr><td>${escapeHtml(s.name)}</td><td>${s.efficiency}</td><td>${s.quality}</td><td>${s.satisfaction}</td><td><strong>${s.total}</strong></td></tr>`).join('')}
                    </tbody></table>
                    <p class="hint-text" style="margin-top:8px;">公式：总分 = 效率分×40% + 质量分×50% + 客户评价×10%</p>
                </div>
            </div>
        `;
    },

    renderDetail() {
        const scores = this.loadScores();
        return `
            <h4 style="margin-bottom:14px;"><i class="fa-solid fa-table-cells"></i> 绩效明细</h4>
            <div class="biz-table-wrap"><table class="biz-table"><thead><tr><th>排名</th><th>员工</th><th>总任务</th><th>已完成</th><th>超时</th><th>平均耗时(h)</th><th>效率分</th><th>质量分</th><th>评价分</th><th>总分</th></tr></thead><tbody>
                ${scores.map(s => `<tr>
                    <td><strong>#${s.rank}</strong></td>
                    <td>${escapeHtml(s.name)}</td>
                    <td>${s.tasks_total || 0}</td>
                    <td>${s.tasks_completed || 0}</td>
                    <td>${s.tasks_overdue > 0 ? `<span class="c-red">${s.tasks_overdue}</span>` : '0'}</td>
                    <td>${s.avg_time || '-'}</td>
                    <td>${s.efficiency}</td>
                    <td>${s.quality}</td>
                    <td>${s.satisfaction}</td>
                    <td><span class="score-badge score-${s.total >= 80 ? 'high' : s.total >= 60 ? 'mid' : 'low'}">${s.total}</span></td>
                </tr>`).join('')}
            </tbody></table></div>
        `;
    },

    renderMetrics() {
        return `
            <div class="metrics-section">
                <h4><i class="fa-solid fa-ruler"></i> 考核指标体系</h4>
                <div class="metrics-cards">
                    <div class="metric-card">
                        <div class="metric-header"><i class="fa-solid fa-gauge-high"></i> 效率指标 (权重40%)</div>
                        <ul><li>任务平均处理时长（基准值：税务申报≤2h，做账≤4h）</li><li>任务完成率 = 已完成 / 总分配</li><li>超时率 = 超时任务 / 总分配（越低越好）</li><li>返工率 = 被退回任务 / 已完成</li></ul>
                    </div>
                    <div class="metric-card">
                        <div class="metric-header"><i class="fa-solid fa-star"></i> 质量指标 (权重50%)</div>
                        <ul><li>客户NPS评分（净推荐值）</li><li>审计差错率：内部审计发现的错误次数/月</li><li>税务申报成功率（一次通过比例）</li><li>客户投诉次数</li></ul>
                    </div>
                    <div class="metric-card">
                        <div class="metric-header"><i class="fa-solid fa-comments"></i> 客户评价 (权重10%)</div>
                        <ul><li>服务满意度评分（1-5星）</li><li>响应时效（首次回复时间）</li><li>客户续签率</li></ul>
                    </div>
                </div>
                <p class="hint-text" style="margin-top:14px;"><i class="fa-solid fa-lock"></i> 绩效数据透明化：员工可查看自己的分项得分及排名变动趋势</p>
            </div>
        `;
    },

    renderCollection() {
        return `
            <div class="collection-section">
                <h4><i class="fa-solid fa-robot"></i> 数据自动采集</h4>
                <div class="collection-items">
                    <div class="collection-card">
                        <div class="coll-icon"><i class="fa-solid fa-clock"></i></div>
                        <div class="coll-body"><strong>任务耗时</strong><p>系统实时记录每个任务从开始到完成的处理时长</p><span class="status-tag st-ok">已启用</span></div>
                    </div>
                    <div class="collection-card">
                        <div class="coll-icon"><i class="fa-solid fa-check-double"></i></div>
                        <div class="coll-body"><strong>完成率统计</strong><p>自动统计每位员工的任务完成量和超时量</p><span class="status-tag st-ok">已启用</span></div>
                    </div>
                    <div class="collection-card">
                        <div class="coll-icon"><i class="fa-solid fa-star"></i></div>
                        <div class="coll-body"><strong>客户评价</strong><p>集成企业微信评价插件，完成服务后自动推送评价链接</p><span class="backend-badge">需后端支持</span></div>
                    </div>
                    <div class="collection-card">
                        <div class="coll-icon"><i class="fa-solid fa-file-circle-check"></i></div>
                        <div class="coll-body"><strong>申报成功率</strong><p>通过RPA机器人从税务系统抓取申报结果</p><span class="backend-badge">需后端支持</span></div>
                    </div>
                    <div class="collection-card">
                        <div class="coll-icon"><i class="fa-solid fa-brain"></i></div>
                        <div class="coll-body"><strong>AI质量审计</strong><p>使用OCR识别票据信息，自动比对差错</p><span class="backend-badge">需后端支持</span></div>
                    </div>
                </div>
            </div>
        `;
    },

    bindEvents() {
        const module = document.querySelector('.biz-module');
        if (!module) return;
        module.addEventListener('click', (e) => {
            const tab = e.target.closest('.biz-tab');
            if (tab) { this.currentTab = tab.dataset.tab; module.querySelectorAll('.biz-tab').forEach(t => t.classList.remove('active')); tab.classList.add('active'); this.renderTab(); }
        });
    }
};

const defaultPerfScores = [
    { name: '王芳', efficiency: 85, quality: 90, satisfaction: 88, total: 88, rank: 1, tasks_total: 12, tasks_completed: 10, tasks_overdue: 0, avg_time: '2.8' },
    { name: '张伟', efficiency: 78, quality: 85, satisfaction: 82, total: 82, rank: 2, tasks_total: 10, tasks_completed: 7, tasks_overdue: 1, avg_time: '3.2' },
    { name: '陈丽', efficiency: 75, quality: 82, satisfaction: 85, total: 80, rank: 3, tasks_total: 9, tasks_completed: 6, tasks_overdue: 1, avg_time: '3.5' },
    { name: '李强', efficiency: 72, quality: 78, satisfaction: 80, total: 76, rank: 4, tasks_total: 8, tasks_completed: 5, tasks_overdue: 1, avg_time: '2.5' },
    { name: '赵敏', efficiency: 68, quality: 75, satisfaction: 78, total: 72, rank: 5, tasks_total: 6, tasks_completed: 4, tasks_overdue: 0, avg_time: '3.0' }
];
