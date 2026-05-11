// 老板驾驶舱模块 - 浙杭企服

// HTML转义工具函数
var escapeHtml = escapeHtml || function(str) {
    if (!str) return '';
    return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
};

// ===== 模拟数据生成器 =====
const CockpitMockData = {
    seeded() {
        return localStorage.getItem('crm_cockpit_mock_seeded') === 'true';
    },

    seed() {
        if (this.seeded()) return;
        this.generateCustomers();
        this.generateContracts();
        this.generateFinances();
        this.generateLeads();
        this.generateInvoices();
        localStorage.setItem('crm_cockpit_mock_seeded', 'true');
    },

    // 工具函数
    randomPick(arr) { return arr[Math.floor(Math.random() * arr.length)]; },
    randomInt(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min; },
    randomDate(monthsAgo) {
        const d = new Date();
        d.setMonth(d.getMonth() - this.randomInt(0, monthsAgo));
        d.setDate(this.randomInt(1, 28));
        return d.toISOString().slice(0, 10);
    },
    dateInMonth(monthsAgo) {
        const d = new Date();
        d.setMonth(d.getMonth() - monthsAgo);
        d.setDate(this.randomInt(1, 28));
        return d.toISOString().slice(0, 10);
    },

    generateCustomers() {
        const cities = ['杭州', '上海', '北京', '深圳', '广州', '苏州', '南京', '宁波', '温州', '成都', '武汉', '厦门'];
        const industries = ['科技', '贸易', '投资', '传媒', '教育', '咨询', '制造', '新材料', '生物', '电商', '物流', '金融'];
        const suffixes = ['有限公司', '集团', '股份有限公司', '科技有限公司', '发展有限公司'];
        const surnames = ['张', '李', '王', '刘', '陈', '杨', '赵', '周', '吴', '徐', '孙', '马'];
        const titles = ['总', '经理', '总监', '董事长', '副总'];

        const customers = [];
        for (let i = 0; i < 25; i++) {
            customers.push({
                id: (i + 10).toString(),
                name: this.randomPick(cities) + this.randomPick(industries) + this.randomPick(suffixes),
                contact: this.randomPick(surnames) + this.randomPick(titles),
                phone: '1' + this.randomPick(['38', '39', '50', '51', '58', '77', '80', '85', '86', '88']) + String(this.randomInt(10000000, 99999999)),
                email: 'contact' + i + '@company.com',
                address: this.randomPick(cities) + '市高新区创业路' + this.randomInt(1, 200) + '号',
                notes: '',
                created_at: this.randomDate(11) + 'T10:00:00Z'
            });
        }
        localStorage.setItem('crm_customers', JSON.stringify(customers));
    },

    generateContracts() {
        const serviceTypes = ['年度财务顾问', '税务筹划服务', '工商注册代办', '代理记账服务', '审计报告服务', '知识产权代理', '企业资质办理', '法律咨询顾问', '人力资源外包', '企业融资顾问'];
        const contracts = [];
        for (let i = 0; i < 18; i++) {
            const startDate = this.randomDate(11);
            const endD = new Date(startDate);
            endD.setMonth(endD.getMonth() + this.randomInt(3, 12));
            contracts.push({
                id: (i + 10).toString(),
                customer_id: (this.randomInt(10, 34)).toString(),
                name: this.randomPick(serviceTypes) + '合同',
                amount: this.randomInt(3, 50) * 10000,
                start_date: startDate,
                end_date: endD.toISOString().slice(0, 10),
                notes: '',
                created_at: startDate + 'T10:00:00Z'
            });
        }
        localStorage.setItem('crm_contracts', JSON.stringify(contracts));
    },

    generateFinances() {
        const expenseTypes = ['办公租金', '员工薪资', '办公用品', '软件订阅', '差旅费', '营销推广', '水电费', '培训费用'];
        const finances = [];
        let id = 10;

        // 确保每个月都有收入和支出数据
        for (let m = 0; m < 12; m++) {
            // 每月4-6条收入
            const incomeCount = this.randomInt(4, 6);
            for (let j = 0; j < incomeCount; j++) {
                finances.push({
                    id: (id++).toString(),
                    type: 'income',
                    amount: this.randomInt(1, 10) * 10000 + this.randomInt(0, 9) * 1000,
                    date: this.dateInMonth(m),
                    customer_id: (this.randomInt(10, 34)).toString(),
                    description: this.randomPick(['财务顾问费', '代理记账费', '审计服务费', '咨询服务费', '注册代办费', '税务筹划费']),
                    created_at: this.dateInMonth(m) + 'T10:00:00Z'
                });
            }
            // 每月2-3条支出
            const expenseCount = this.randomInt(2, 3);
            for (let j = 0; j < expenseCount; j++) {
                finances.push({
                    id: (id++).toString(),
                    type: 'expense',
                    amount: this.randomInt(2, 30) * 1000,
                    date: this.dateInMonth(m),
                    customer_id: '',
                    description: this.randomPick(expenseTypes),
                    created_at: this.dateInMonth(m) + 'T10:00:00Z'
                });
            }
        }
        localStorage.setItem('crm_finances', JSON.stringify(finances));
    },

    generateLeads() {
        const names = ['张伟', '李芳', '王强', '赵丽', '刘洋', '陈静', '杨磊', '周婷', '吴鹏', '徐敏',
            '孙浩', '马艳', '朱明', '胡建', '郭丽', '何勇', '高峰', '林娜', '罗斌', '梁燕',
            '宋辉', '唐杰', '许倩', '韩波', '冯琳', '董超', '萧雅', '程鑫', '曹静', '邓军',
            '潘蕾', '蒋涛', '蔡丹', '贾勇', '余芬', '魏刚', '叶婷', '阎莉', '任飞', '姜红',
            '廖明', '石丽', '金波', '田甜', '方琪', '熊杰', '秦梅', '邱鹏', '侯伟', '谢婷'];
        const sources = ['抖音', '抖音', '抖音', '小红书', '小红书', '百度', '百度', '转介绍', '转介绍', '转介绍', '电话营销', '其他'];
        const intents = ['A', 'A', 'B', 'B', 'B', 'C', 'C', 'C', 'C', 'D', 'D'];
        const statuses = ['new', 'new', 'following', 'following', 'following', 'following', 'converted', 'converted', 'lost'];
        const companies = ['恒通科技', '鑫达贸易', '博雅教育', '华创投资', '中盛物流', '汇通金融', '明德咨询', '天宇制造',
            '锐创电商', '诺亚传媒', '盛世地产', '飞扬广告', '普华会计', '睿智信息', '嘉禾农业'];
        const followContents = ['电话沟通了解需求，客户对代理记账服务感兴趣', '微信发送了服务方案和报价', '客户表示需要内部商议',
            '二次电话跟进，约好下周面谈', '拜访客户公司，详细介绍了服务内容', '客户反馈价格偏高，正在协商优惠方案',
            '已发送合同模板，等待客户确认', '客户已确认合作意向，准备签约', '了解到客户还在对比其他服务商'];

        const leads = [];
        const today = new Date().toISOString().slice(0, 10);
        const owner = 'admin@zhqf.com';

        for (let i = 0; i < 50; i++) {
            const status = this.randomPick(statuses);
            const isPublic = Math.random() < 0.15;
            const created = this.randomDate(6);

            // 生成跟进记录
            const recordCount = this.randomInt(0, 4);
            const records = [];
            for (let r = 0; r < recordCount; r++) {
                const rd = new Date(created);
                rd.setDate(rd.getDate() + this.randomInt(1, 60));
                records.push({
                    date: rd.toISOString(),
                    content: this.randomPick(followContents)
                });
            }

            // 部分线索设置今天/明天需要跟进
            let nextContact = '';
            if (status === 'following' && Math.random() < 0.3) {
                const nc = new Date();
                nc.setDate(nc.getDate() + this.randomInt(-2, 3));
                nextContact = nc.toISOString().slice(0, 10);
            }

            leads.push({
                id: Date.now().toString(36) + Math.random().toString(36).slice(2, 8) + i,
                name: names[i] || this.randomPick(names),
                phone: '1' + this.randomPick(['38', '39', '50', '51', '58', '77', '80', '85']) + String(this.randomInt(10000000, 99999999)),
                wechat: 'wx_' + this.randomInt(100000, 999999),
                source: this.randomPick(sources),
                intent_level: this.randomPick(intents),
                company: this.randomPick(companies),
                position: this.randomPick(['总经理', '财务总监', '行政主管', '创始人', '合伙人', '财务经理', '人事经理']),
                industry: this.randomPick(['科技', '贸易', '教育', '金融', '制造', '服务', '零售']),
                region: this.randomPick(['杭州', '上海', '宁波', '温州', '嘉兴', '绍兴', '金华']),
                follow_records: records,
                next_contact_date: nextContact,
                notes: '',
                status: status,
                owner: isPublic ? '' : owner,
                is_public: isPublic,
                created_at: created + 'T10:00:00Z',
                last_follow_date: records.length > 0 ? records[records.length - 1].date : '',
                updated_at: new Date().toISOString()
            });
        }
        localStorage.setItem('crm_leads', JSON.stringify(leads));
    },

    generateInvoices() {
        const invoices = [];
        const finances = JSON.parse(localStorage.getItem('crm_finances') || '[]');
        const incomes = finances.filter(f => f.type === 'income').slice(0, 22);

        incomes.forEach((inc, i) => {
            const statusArr = ['已开具', '已开具', '已开具', '已开具', '已开具', '已开具', '已开具', '待开具', '待开具', '已作废'];
            invoices.push({
                id: (i + 100).toString(),
                customer_id: inc.customer_id,
                invoice_number: 'INV-2025-' + String(i + 1).padStart(3, '0'),
                type: Math.random() > 0.4 ? '增值税专用发票' : '增值税普通发票',
                amount: inc.amount,
                invoice_date: inc.date,
                status: this.randomPick(statusArr),
                created_at: inc.date + 'T10:00:00Z'
            });
        });
        localStorage.setItem('crm_invoices', JSON.stringify(invoices));
    }
};

// ===== 驾驶舱主模块 =====
const Cockpit = {
    charts: [],

    init() {
        CockpitMockData.seed();
        this.renderPage();
        this.computeAndFillKPIs();
        this.renderCharts();
        this.renderRanking();
        this.renderActivities();
    },

    destroy() {
        this.charts.forEach(c => c.destroy());
        this.charts = [];
    },

    // ===== 页面模板 =====
    renderPage() {
        const today = new Date().toLocaleDateString('zh-CN', { year: 'numeric', month: 'long', day: 'numeric', weekday: 'long' });
        const contentArea = document.querySelector('.content-area');
        contentArea.innerHTML = `
            <div class="cockpit-page">
                <div class="cockpit-header">
                    <h2>老板驾驶舱</h2>
                    <span class="cockpit-date">${today}</span>
                </div>

                <div class="cockpit-kpi-grid" id="cockpit-kpis"></div>

                <div class="cockpit-charts-grid">
                    <div class="cockpit-chart-card">
                        <div class="cockpit-chart-title"><span class="chart-dot" style="background:#4f46e5;"></span>营收趋势</div>
                        <div class="chart-canvas-wrap"><canvas id="chart-revenue-trend"></canvas></div>
                    </div>
                    <div class="cockpit-chart-card">
                        <div class="cockpit-chart-title"><span class="chart-dot" style="background:#06b6d4;"></span>线索来源分布</div>
                        <div class="chart-canvas-wrap"><canvas id="chart-lead-source"></canvas></div>
                    </div>
                    <div class="cockpit-chart-card">
                        <div class="cockpit-chart-title"><span class="chart-dot" style="background:#10b981;"></span>线索状态分布</div>
                        <div class="chart-canvas-wrap"><canvas id="chart-lead-status"></canvas></div>
                    </div>
                    <div class="cockpit-chart-card">
                        <div class="cockpit-chart-title"><span class="chart-dot" style="background:#f59e0b;"></span>意向等级分布</div>
                        <div class="chart-canvas-wrap"><canvas id="chart-lead-intent"></canvas></div>
                    </div>
                </div>

                <div class="cockpit-bottom-grid">
                    <div class="cockpit-card">
                        <div class="cockpit-card-title">客户营收排行榜</div>
                        <div id="cockpit-ranking"></div>
                    </div>
                    <div class="cockpit-card">
                        <div class="cockpit-card-title">近期待办与动态</div>
                        <div id="cockpit-activities"></div>
                    </div>
                </div>
            </div>
        `;
    },

    // ===== KPI 计算 =====
    computeAndFillKPIs() {
        const finances = JSON.parse(localStorage.getItem('crm_finances') || '[]');
        const customers = JSON.parse(localStorage.getItem('crm_customers') || '[]');
        const contracts = JSON.parse(localStorage.getItem('crm_contracts') || '[]');
        const leads = JSON.parse(localStorage.getItem('crm_leads') || '[]');

        const now = new Date();
        const thisMonth = now.toISOString().slice(0, 7);
        const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString().slice(0, 7);

        // 本月营收
        const thisMonthIncome = finances.filter(f => f.type === 'income' && f.date && f.date.startsWith(thisMonth)).reduce((s, f) => s + f.amount, 0);
        const lastMonthIncome = finances.filter(f => f.type === 'income' && f.date && f.date.startsWith(lastMonth)).reduce((s, f) => s + f.amount, 0);

        // 合同总额
        const totalContract = contracts.reduce((s, c) => s + c.amount, 0);

        // 转化率
        const convertedLeads = leads.filter(l => l.status === 'converted').length;
        const conversionRate = leads.length > 0 ? (convertedLeads / leads.length * 100).toFixed(1) : 0;

        // 净利润
        const totalIncome = finances.filter(f => f.type === 'income').reduce((s, f) => s + f.amount, 0);
        const totalExpense = finances.filter(f => f.type === 'expense').reduce((s, f) => s + f.amount, 0);
        const netProfit = totalIncome - totalExpense;

        // 上月对比
        const lastMonthExpense = finances.filter(f => f.type === 'expense' && f.date && f.date.startsWith(lastMonth)).reduce((s, f) => s + f.amount, 0);
        const thisMonthExpense = finances.filter(f => f.type === 'expense' && f.date && f.date.startsWith(thisMonth)).reduce((s, f) => s + f.amount, 0);

        function trendHtml(current, previous) {
            if (!previous || previous === 0) return '<span class="cockpit-kpi-trend up">--</span>';
            const pct = ((current - previous) / previous * 100).toFixed(1);
            if (pct >= 0) return `<span class="cockpit-kpi-trend up">&uarr; ${pct}%</span>`;
            return `<span class="cockpit-kpi-trend down">&darr; ${Math.abs(pct)}%</span>`;
        }

        function formatMoney(val) {
            if (val >= 10000) return (val / 10000).toFixed(1) + '万';
            return val.toLocaleString('zh-CN');
        }

        const kpis = [
            { label: '本月营收', value: '¥' + formatMoney(thisMonthIncome), trend: trendHtml(thisMonthIncome, lastMonthIncome), color: '#4f46e5', icon: '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6"/></svg>' },
            { label: '总客户数', value: customers.length + '家', trend: trendHtml(customers.length, Math.max(1, customers.length - 3)), color: '#06b6d4', icon: '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87"/><path d="M16 3.13a4 4 0 010 7.75"/></svg>' },
            { label: '合同总额', value: '¥' + formatMoney(totalContract), trend: trendHtml(totalContract, totalContract * 0.85), color: '#8b5cf6', icon: '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14,2 14,8 20,8"/></svg>' },
            { label: '线索总数', value: leads.length + '条', trend: trendHtml(leads.length, Math.max(1, leads.length - 8)), color: '#f59e0b', icon: '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 11.5a8.38 8.38 0 01-.9 3.8 8.5 8.5 0 01-7.6 4.7 8.38 8.38 0 01-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 01-.9-3.8 8.5 8.5 0 014.7-7.6 8.38 8.38 0 013.8-.9h.5a8.48 8.48 0 018 8v.5z"/></svg>' },
            { label: '转化率', value: conversionRate + '%', trend: trendHtml(parseFloat(conversionRate), parseFloat(conversionRate) * 0.9), color: '#10b981', icon: '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="22,12 18,12 15,21 9,3 6,12 2,12"/></svg>' },
            { label: '净利润', value: '¥' + formatMoney(netProfit), trend: trendHtml(thisMonthIncome - thisMonthExpense, lastMonthIncome - lastMonthExpense), color: '#ef4444', icon: '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>' }
        ];

        document.getElementById('cockpit-kpis').innerHTML = kpis.map(k => `
            <div class="cockpit-kpi-card" style="border-left: 3px solid ${k.color};">
                <div class="cockpit-kpi-icon" style="background: ${k.color}15; color: ${k.color};">${k.icon}</div>
                <div class="cockpit-kpi-info">
                    <div class="cockpit-kpi-value">${k.value}</div>
                    <div class="cockpit-kpi-label">${k.label}</div>
                    ${k.trend}
                </div>
            </div>
        `).join('');
    },

    // ===== 图表渲染 =====
    renderCharts() {
        this.renderRevenueTrend();
        this.renderLeadSource();
        this.renderLeadStatus();
        this.renderLeadIntent();
    },

    renderRevenueTrend() {
        const finances = JSON.parse(localStorage.getItem('crm_finances') || '[]');
        const months = [];
        const incomeData = [];
        const expenseData = [];

        for (let i = 11; i >= 0; i--) {
            const d = new Date();
            d.setMonth(d.getMonth() - i);
            const key = d.toISOString().slice(0, 7);
            const monthLabel = (d.getMonth() + 1) + '月';
            months.push(monthLabel);
            incomeData.push(finances.filter(f => f.type === 'income' && f.date && f.date.startsWith(key)).reduce((s, f) => s + f.amount, 0) / 10000);
            expenseData.push(finances.filter(f => f.type === 'expense' && f.date && f.date.startsWith(key)).reduce((s, f) => s + f.amount, 0) / 10000);
        }

        const ctx = document.getElementById('chart-revenue-trend');
        const chart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: months,
                datasets: [
                    {
                        label: '收入',
                        data: incomeData,
                        borderColor: '#4f46e5',
                        backgroundColor: 'rgba(79, 70, 229, 0.08)',
                        fill: true,
                        tension: 0.4,
                        pointRadius: 3,
                        pointHoverRadius: 6
                    },
                    {
                        label: '支出',
                        data: expenseData,
                        borderColor: '#ef4444',
                        backgroundColor: 'rgba(239, 68, 68, 0.05)',
                        fill: true,
                        tension: 0.4,
                        borderDash: [5, 5],
                        pointRadius: 3,
                        pointHoverRadius: 6
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { position: 'top', labels: { usePointStyle: true, padding: 20 } },
                    tooltip: { callbacks: { label: (ctx) => ctx.dataset.label + ': ¥' + ctx.raw.toFixed(1) + '万' } }
                },
                scales: {
                    y: { beginAtZero: true, ticks: { callback: v => '¥' + v + '万' }, grid: { color: '#f1f5f9' } },
                    x: { grid: { display: false } }
                }
            }
        });
        this.charts.push(chart);
    },

    renderLeadSource() {
        const leads = JSON.parse(localStorage.getItem('crm_leads') || '[]');
        const sourceMap = {};
        leads.forEach(l => {
            const s = l.source || '未知';
            sourceMap[s] = (sourceMap[s] || 0) + 1;
        });
        const labels = Object.keys(sourceMap);
        const data = Object.values(sourceMap);
        const colors = ['#4f46e5', '#06b6d4', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

        const ctx = document.getElementById('chart-lead-source');
        const chart = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: labels,
                datasets: [{ data: data, backgroundColor: colors.slice(0, labels.length), borderWidth: 2, borderColor: '#fff' }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                cutout: '65%',
                plugins: {
                    legend: { position: 'right', labels: { usePointStyle: true, padding: 12, font: { size: 12 } } },
                    tooltip: { callbacks: { label: (ctx) => ctx.label + ': ' + ctx.raw + '条 (' + (ctx.raw / leads.length * 100).toFixed(0) + '%)' } }
                }
            }
        });
        this.charts.push(chart);
    },

    renderLeadStatus() {
        const leads = JSON.parse(localStorage.getItem('crm_leads') || '[]');
        const statusMap = { new: 0, following: 0, converted: 0, lost: 0 };
        leads.forEach(l => { if (statusMap.hasOwnProperty(l.status)) statusMap[l.status]++; });
        const labels = ['新线索', '跟进中', '已转化', '已流失'];
        const data = [statusMap.new, statusMap.following, statusMap.converted, statusMap.lost];
        const colors = ['#6366f1', '#06b6d4', '#10b981', '#ef4444'];

        const ctx = document.getElementById('chart-lead-status');
        const chart = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: labels,
                datasets: [{ data: data, backgroundColor: colors, borderRadius: 6, barPercentage: 0.6 }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                indexAxis: 'y',
                plugins: {
                    legend: { display: false },
                    tooltip: { callbacks: { label: (ctx) => ctx.raw + '条' } }
                },
                scales: {
                    x: { beginAtZero: true, grid: { color: '#f1f5f9' }, ticks: { stepSize: 5 } },
                    y: { grid: { display: false } }
                }
            }
        });
        this.charts.push(chart);
    },

    renderLeadIntent() {
        const leads = JSON.parse(localStorage.getItem('crm_leads') || '[]');
        const intentMap = { A: 0, B: 0, C: 0, D: 0 };
        leads.forEach(l => { if (intentMap.hasOwnProperty(l.intent_level)) intentMap[l.intent_level]++; });
        const labels = ['A-高意向', 'B-有意向', 'C-一般', 'D-低意向'];
        const data = [intentMap.A, intentMap.B, intentMap.C, intentMap.D];
        const colors = ['#10b981', '#4f46e5', '#f59e0b', '#94a3b8'];

        const ctx = document.getElementById('chart-lead-intent');
        const chart = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: labels,
                datasets: [{ data: data, backgroundColor: colors, borderWidth: 2, borderColor: '#fff' }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                cutout: '60%',
                plugins: {
                    legend: { position: 'right', labels: { usePointStyle: true, padding: 12, font: { size: 12 } } },
                    tooltip: { callbacks: { label: (ctx) => ctx.label + ': ' + ctx.raw + '条' } }
                }
            }
        });
        this.charts.push(chart);
    },

    // ===== 客户排行榜 =====
    renderRanking() {
        const contracts = JSON.parse(localStorage.getItem('crm_contracts') || '[]');
        const customers = JSON.parse(localStorage.getItem('crm_customers') || '[]');

        // 按客户汇总合同金额
        const customerRevenue = {};
        contracts.forEach(c => {
            customerRevenue[c.customer_id] = (customerRevenue[c.customer_id] || 0) + c.amount;
        });

        // 排序取Top 8
        const sorted = Object.entries(customerRevenue)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 8);

        const maxVal = sorted.length > 0 ? sorted[0][1] : 1;
        const medals = ['&#x1F947;', '&#x1F948;', '&#x1F949;'];

        const html = sorted.map(([custId, amount], idx) => {
            const cust = customers.find(c => c.id === custId);
            const name = cust ? cust.name : '未知客户';
            const barWidth = (amount / maxVal * 100).toFixed(0);
            const medal = idx < 3 ? medals[idx] : `<span class="rank-num">${idx + 1}</span>`;
            const amountStr = (amount / 10000).toFixed(1);

            return `
                <div class="cockpit-ranking-item">
                    <div class="cockpit-ranking-medal">${medal}</div>
                    <div class="cockpit-ranking-info">
                        <div class="cockpit-ranking-name">${escapeHtml(name)}</div>
                        <div class="cockpit-ranking-bar-bg"><div class="cockpit-ranking-bar-fill" style="width:${barWidth}%;"></div></div>
                    </div>
                    <div class="cockpit-ranking-amount">¥${amountStr}万</div>
                </div>
            `;
        }).join('');

        document.getElementById('cockpit-ranking').innerHTML = html || '<p class="empty-hint">暂无数据</p>';
    },

    // ===== 近期待办与动态 =====
    renderActivities() {
        const leads = JSON.parse(localStorage.getItem('crm_leads') || '[]');
        const contracts = JSON.parse(localStorage.getItem('crm_contracts') || '[]');
        const today = new Date().toISOString().slice(0, 10);
        const activities = [];

        // 今日/逾期待跟进
        leads.forEach(l => {
            if (l.next_contact_date && l.next_contact_date <= today && l.status === 'following') {
                const isOverdue = l.next_contact_date < today;
                activities.push({
                    type: 'follow',
                    icon: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 16.92z"/></svg>',
                    text: `跟进线索: ${l.name} - ${l.company || ''}`,
                    time: isOverdue ? '已逾期' : '今天',
                    urgent: isOverdue ? 'overdue' : 'today',
                    date: l.next_contact_date
                });
            }
        });

        // 30天内到期合同
        const thirtyDaysLater = new Date();
        thirtyDaysLater.setDate(thirtyDaysLater.getDate() + 30);
        const thirtyStr = thirtyDaysLater.toISOString().slice(0, 10);
        contracts.forEach(c => {
            if (c.end_date >= today && c.end_date <= thirtyStr) {
                const daysLeft = Math.ceil((new Date(c.end_date) - new Date()) / (1000 * 60 * 60 * 24));
                activities.push({
                    type: 'contract',
                    icon: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14,2 14,8 20,8"/></svg>',
                    text: `合同即将到期: ${c.name}`,
                    time: daysLeft + '天后',
                    urgent: daysLeft <= 7 ? 'today' : 'normal',
                    date: c.end_date
                });
            }
        });

        // 最近新增线索
        const recentLeads = leads
            .filter(l => l.status === 'new')
            .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
            .slice(0, 3);
        recentLeads.forEach(l => {
            activities.push({
                type: 'new_lead',
                icon: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M16 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="8.5" cy="7" r="4"/><line x1="20" y1="8" x2="20" y2="14"/><line x1="23" y1="11" x2="17" y2="11"/></svg>',
                text: `新线索: ${l.name}（${l.source || '未知来源'}）`,
                time: '近期',
                urgent: 'normal',
                date: l.created_at
            });
        });

        // 排序：逾期优先，然后按日期
        activities.sort((a, b) => {
            if (a.urgent === 'overdue' && b.urgent !== 'overdue') return -1;
            if (b.urgent === 'overdue' && a.urgent !== 'overdue') return 1;
            if (a.urgent === 'today' && b.urgent === 'normal') return -1;
            if (b.urgent === 'today' && a.urgent === 'normal') return 1;
            return 0;
        });

        const html = activities.slice(0, 10).map(a => {
            const urgentClass = a.urgent === 'overdue' ? 'activity-urgent' : a.urgent === 'today' ? 'activity-warning' : '';
            const iconBg = a.type === 'follow' ? '#eef2ff' : a.type === 'contract' ? '#fef3c7' : '#d1fae5';
            const iconColor = a.type === 'follow' ? '#4f46e5' : a.type === 'contract' ? '#f59e0b' : '#10b981';

            return `
                <div class="cockpit-activity-item">
                    <div class="cockpit-activity-icon" style="background:${iconBg}; color:${iconColor};">${a.icon}</div>
                    <div class="cockpit-activity-text">${escapeHtml(a.text)}</div>
                    <div class="cockpit-activity-time ${urgentClass}">${a.time}</div>
                </div>
            `;
        }).join('');

        document.getElementById('cockpit-activities').innerHTML = html || '<p class="empty-hint">暂无待办事项</p>';
    }
};
