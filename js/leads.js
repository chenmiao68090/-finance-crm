// 线索管理模块 - 浙杭企服 (全面重写版)
// 支持：手工录入(企业信息自动填充)、批量导入、线上平台推送
// 功能：智能分配、线索评分、状态机、去重、数据看板、操作审计

// ===== HTML转义 =====
function escapeHtml(str) {
    if (!str) return '';
    return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

// ===== Toast 通知 =====
function showToast(message, type = 'info') {
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.textContent = message;
    document.body.appendChild(toast);
    setTimeout(() => toast.classList.add('show'), 10);
    setTimeout(() => { toast.classList.remove('show'); setTimeout(() => toast.remove(), 300); }, 3000);
}

// ===== 模拟企业工商数据库（模拟天眼查/企查查API返回） =====
const MockCompanyDB = [
    { name: '杭州未来科技有限公司', legalPerson: '张建国', regCapital: '500万', foundDate: '2018-03-15', address: '杭州市西湖区文三路398号', creditCode: '91330106MA2H0K7X5A', scope: '软件开发、技术咨询、信息服务', industry: '信息技术', phone: '0571-88888001', website: 'www.future-tech.cn', employees: 85 },
    { name: '浙江盛达贸易有限公司', legalPerson: '李明辉', regCapital: '1000万', foundDate: '2015-06-20', address: '杭州市滨江区网商路599号', creditCode: '91330108MA27W0YP3X', scope: '国内贸易、进出口业务', industry: '贸易', phone: '0571-88888002', website: 'www.shengda-trade.com', employees: 120 },
    { name: '杭州锐智教育科技有限公司', legalPerson: '王丽萍', regCapital: '300万', foundDate: '2020-01-10', address: '杭州市余杭区仓前街道文一西路1218号', creditCode: '91330110MA2GYR6T4B', scope: '教育软件开发、在线教育服务', industry: '教育', phone: '0571-88888003', website: 'www.ruizhi-edu.cn', employees: 45 },
    { name: '浙江恒通建设工程有限公司', legalPerson: '陈志强', regCapital: '5000万', foundDate: '2010-08-05', address: '杭州市拱墅区莫干山路110号', creditCode: '91330105561234567X', scope: '建筑工程施工、装饰装修', industry: '建筑', phone: '0571-88888004', website: 'www.hengtong-build.com', employees: 350 },
    { name: '杭州云帆网络科技有限公司', legalPerson: '刘海', regCapital: '200万', foundDate: '2021-05-18', address: '杭州市钱塘区白杨街道', creditCode: '91330114MA2KXYZ123', scope: '网络技术开发、电子商务', industry: '互联网', phone: '0571-88888005', website: 'www.yunfan-net.cn', employees: 28 },
    { name: '浙江绿源环保科技股份有限公司', legalPerson: '赵国强', regCapital: '3000万', foundDate: '2012-11-22', address: '杭州市萧山区经济开发区', creditCode: '91330109MA2B0K9X7C', scope: '环保设备研发、污水处理工程', industry: '环保', phone: '0571-88888006', website: 'www.greensource.cn', employees: 200 },
    { name: '杭州鼎盛餐饮管理有限公司', legalPerson: '孙伟', regCapital: '100万', foundDate: '2019-09-01', address: '杭州市上城区解放路56号', creditCode: '91330102MA2D0YTR8N', scope: '餐饮管理、食品经营', industry: '餐饮', phone: '0571-88888007', website: '', employees: 60 },
    { name: '浙江星辰医药科技有限公司', legalPerson: '周星宇', regCapital: '2000万', foundDate: '2016-04-12', address: '杭州市富阳区银湖街道', creditCode: '91330183MA28NXYZ9K', scope: '医药研发、生物技术咨询', industry: '医药', phone: '0571-88888008', website: 'www.starmed.cn', employees: 150 }
];

// ===== 模拟线上平台推送数据 =====
const MockPlatformLeads = [
    { platform: '美团', name: '陈经理', phone: '13812345678', company: '杭州味道餐饮店', content: '咨询工商注册+代理记账服务', time: '2分钟前', priority: 'high' },
    { platform: '抖音', name: '林女士', phone: '13987654321', company: '浙江创新电商有限公司', content: '通过短视频广告咨询公司注册流程', time: '5分钟前', priority: 'high' },
    { platform: '美团', name: '黄总', phone: '15012349876', company: '杭州新锐广告传媒', content: '需要变更公司经营范围', time: '18分钟前', priority: 'high' },
    { platform: '抖音', name: '吴先生', phone: '18611223344', company: '', content: '个体户升级为公司，咨询费用', time: '35分钟前', priority: 'medium' },
    { platform: '百度推广', name: '马总', phone: '13566778899', company: '浙江鸿达实业', content: '需要税务筹划和代理记账', time: '1小时前', priority: 'medium' }
];

// ===== 分配规则配置 =====
const DefaultAllocationRules = [
    { id: 'r1', name: '地域匹配', type: 'region', enabled: true, priority: 1, config: { '西湖区': '王芳', '滨江区': '李强', '余杭区': '张伟', '萧山区': '陈丽', '拱墅区': '王芳', '上城区': '李强' } },
    { id: 'r2', name: '行业匹配', type: 'industry', enabled: true, priority: 2, config: { '信息技术': '张伟', '互联网': '张伟', '贸易': '王芳', '建筑': '陈丽', '餐饮': '李强', '教育': '王芳', '医药': '陈丽', '环保': '张伟' } },
    { id: 'r3', name: '负载均衡', type: 'load_balance', enabled: true, priority: 3, config: { sales: ['王芳', '李强', '张伟', '陈丽', '赵敏'] } },
    { id: 'r4', name: '线上平台优先', type: 'platform_priority', enabled: true, priority: 0, config: { topSales: '李强', platforms: ['美团', '抖音'] } }
];

// ===== 默认种子数据 =====
const defaultLeadsData = [
    { id: 'ld001', name: '张经理', phone: '13800001111', wechat: 'zhang_mgr', source: '抖音', source_platform: '抖音', intent_level: 'A', company: '杭州未来科技有限公司', position: '财务总监', industry: '信息技术', region: '西湖区', status: 'following', score: 88, priority: 'high', assigned_to: '李强', assigned_at: '2024-03-10T09:00:00Z', owner: 'admin', is_public: false, tags: ['大客户', '科技企业'], company_info: { legalPerson: '张建国', regCapital: '500万', creditCode: '91330106MA2H0K7X5A' }, follow_records: [{ date: '2024-03-10T10:00:00Z', content: '初次电话联系，对代理记账有兴趣', operator: '李强' }, { date: '2024-03-12T14:00:00Z', content: '发送方案报价，等待反馈', operator: '李强' }], next_contact_date: '2024-03-15', notes: '大型科技企业，潜力客户', created_at: '2024-03-09T08:00:00Z', last_follow_date: '2024-03-12T14:00:00Z', updated_at: '2024-03-12T14:00:00Z' },
    { id: 'ld002', name: '李总', phone: '13900002222', wechat: '', source: '美团', source_platform: '美团', intent_level: 'A', company: '浙江盛达贸易有限公司', position: '总经理', industry: '贸易', region: '滨江区', status: 'qualified', score: 92, priority: 'high', assigned_to: '王芳', assigned_at: '2024-03-08T09:00:00Z', owner: 'admin', is_public: false, tags: ['高意向', '贸易企业'], company_info: { legalPerson: '李明辉', regCapital: '1000万', creditCode: '91330108MA27W0YP3X' }, follow_records: [{ date: '2024-03-08T11:00:00Z', content: '美团平台咨询，需要进出口资质代办', operator: '王芳' }, { date: '2024-03-09T15:00:00Z', content: '上门拜访，详谈需求', operator: '王芳' }, { date: '2024-03-11T10:00:00Z', content: '已发送合同，等待签约', operator: '王芳' }], next_contact_date: '2024-03-14', notes: '千万级注册资本，意向很强', created_at: '2024-03-07T16:00:00Z', last_follow_date: '2024-03-11T10:00:00Z', updated_at: '2024-03-11T10:00:00Z' },
    { id: 'ld003', name: '王丽', phone: '13700003333', wechat: 'wangli_edu', source: '百度', source_platform: '百度推广', intent_level: 'B', company: '杭州锐智教育科技有限公司', position: '行政主管', industry: '教育', region: '余杭区', status: 'following', score: 72, priority: 'medium', assigned_to: '张伟', assigned_at: '2024-03-11T09:00:00Z', owner: 'admin', is_public: false, tags: ['教育行业'], company_info: { legalPerson: '王丽萍', regCapital: '300万' }, follow_records: [{ date: '2024-03-11T14:00:00Z', content: '电话沟通，了解代理记账需求', operator: '张伟' }], next_contact_date: '2024-03-16', notes: '', created_at: '2024-03-10T20:00:00Z', last_follow_date: '2024-03-11T14:00:00Z', updated_at: '2024-03-11T14:00:00Z' },
    { id: 'ld004', name: '陈总', phone: '13600004444', wechat: '', source: '转介绍', source_platform: '手工录入', intent_level: 'A', company: '浙江恒通建设工程有限公司', position: '董事长', industry: '建筑', region: '拱墅区', status: 'converted', score: 95, priority: 'high', assigned_to: '陈丽', assigned_at: '2024-02-20T09:00:00Z', owner: 'admin', is_public: false, tags: ['大客户', '已签约', '转介绍'], company_info: { legalPerson: '陈志强', regCapital: '5000万', creditCode: '91330105561234567X' }, follow_records: [{ date: '2024-02-20T10:00:00Z', content: '朋友介绍，初步沟通', operator: '陈丽' }, { date: '2024-02-22T14:00:00Z', content: '上门详谈，确认税务筹划需求', operator: '陈丽' }, { date: '2024-02-28T10:00:00Z', content: '签约成功，年度代理记账+税筹', operator: '陈丽' }], next_contact_date: '', notes: '五千万建筑企业，年度大客户', created_at: '2024-02-19T09:00:00Z', last_follow_date: '2024-02-28T10:00:00Z', updated_at: '2024-02-28T10:00:00Z' },
    { id: 'ld005', name: '刘海', phone: '13500005555', wechat: 'liuhai_yf', source: '电话营销', source_platform: '手工录入', intent_level: 'C', company: '杭州云帆网络科技有限公司', position: '创始人', industry: '互联网', region: '钱塘区', status: 'new', score: 55, priority: 'low', assigned_to: '', assigned_at: '', owner: 'admin', is_public: true, tags: [], company_info: { legalPerson: '刘海', regCapital: '200万' }, follow_records: [], next_contact_date: '', notes: '小型互联网公司，暂无明确需求', created_at: '2024-03-12T09:00:00Z', last_follow_date: '', updated_at: '2024-03-12T09:00:00Z' },
    { id: 'ld006', name: '赵总', phone: '13400006666', wechat: '', source: '抖音', source_platform: '抖音', intent_level: 'B', company: '浙江绿源环保科技股份有限公司', position: '副总经理', industry: '环保', region: '萧山区', status: 'allocated', score: 78, priority: 'medium', assigned_to: '张伟', assigned_at: '2024-03-13T09:00:00Z', owner: 'admin', is_public: false, tags: ['环保行业', '股份公司'], company_info: { legalPerson: '赵国强', regCapital: '3000万', creditCode: '91330109MA2B0K9X7C' }, follow_records: [], next_contact_date: '2024-03-14', notes: '三千万环保企业，通过抖音广告进入', created_at: '2024-03-13T08:00:00Z', last_follow_date: '', updated_at: '2024-03-13T09:00:00Z' },
    { id: 'ld007', name: '孙伟', phone: '13300007777', wechat: 'sunwei_ds', source: '美团', source_platform: '美团', intent_level: 'B', company: '杭州鼎盛餐饮管理有限公司', position: '老板', industry: '餐饮', region: '上城区', status: 'following', score: 68, priority: 'medium', assigned_to: '李强', assigned_at: '2024-03-11T09:00:00Z', owner: 'admin', is_public: false, tags: ['餐饮'], company_info: { legalPerson: '孙伟', regCapital: '100万' }, follow_records: [{ date: '2024-03-11T16:00:00Z', content: '美团咨询，需要注册新的分公司', operator: '李强' }], next_contact_date: '2024-03-15', notes: '', created_at: '2024-03-11T07:00:00Z', last_follow_date: '2024-03-11T16:00:00Z', updated_at: '2024-03-11T16:00:00Z' },
    { id: 'ld008', name: '周星宇', phone: '13200008888', wechat: '', source: '百度', source_platform: '百度推广', intent_level: 'C', company: '浙江星辰医药科技有限公司', position: 'CFO', industry: '医药', region: '富阳区', status: 'invalid', score: 45, priority: 'low', assigned_to: '陈丽', assigned_at: '2024-03-05T09:00:00Z', owner: 'admin', is_public: false, tags: ['医药'], company_info: { legalPerson: '周星宇', regCapital: '2000万' }, follow_records: [{ date: '2024-03-05T14:00:00Z', content: '电话联系，已有合作的代账公司', operator: '陈丽' }, { date: '2024-03-07T10:00:00Z', content: '二次跟进，明确表示暂不更换', operator: '陈丽' }], next_contact_date: '', notes: '暂无机会，3个月后再跟进', created_at: '2024-03-04T11:00:00Z', last_follow_date: '2024-03-07T10:00:00Z', updated_at: '2024-03-07T10:00:00Z' },
    { id: 'ld009', name: '马先生', phone: '13100009999', wechat: 'masheng_hd', source: '转介绍', source_platform: '手工录入', intent_level: 'B', company: '浙江鸿达实业有限公司', position: '总经理', industry: '制造', region: '萧山区', status: 'following', score: 74, priority: 'medium', assigned_to: '赵敏', assigned_at: '2024-03-09T09:00:00Z', owner: 'admin', is_public: false, tags: ['制造业', '转介绍'], company_info: { legalPerson: '马盛', regCapital: '800万' }, follow_records: [{ date: '2024-03-09T11:00:00Z', content: '老客户介绍，初步电话了解', operator: '赵敏' }], next_contact_date: '2024-03-16', notes: '', created_at: '2024-03-09T08:00:00Z', last_follow_date: '2024-03-09T11:00:00Z', updated_at: '2024-03-09T11:00:00Z' },
    { id: 'ld010', name: '蒋女士', phone: '18800101010', wechat: '', source: '小红书', source_platform: '小红书', intent_level: 'C', company: '杭州小蜜蜂家政服务', position: '负责人', industry: '服务', region: '上城区', status: 'new', score: 50, priority: 'low', assigned_to: '', assigned_at: '', owner: 'admin', is_public: true, tags: [], company_info: {}, follow_records: [], next_contact_date: '', notes: '个体户，咨询营业执照办理', created_at: '2024-03-13T10:00:00Z', last_follow_date: '', updated_at: '2024-03-13T10:00:00Z' }
];

// ===== LeadsStorage =====
const LeadsStorage = {
    KEY: 'crm_leads',
    RULES_KEY: 'crm_leads_rules',
    LOG_KEY: 'crm_leads_audit_log',

    getAll() {
        const data = localStorage.getItem(this.KEY);
        if (!data) { this.save(defaultLeadsData); return [...defaultLeadsData]; }
        return JSON.parse(data);
    },
    save(leads) { localStorage.setItem(this.KEY, JSON.stringify(leads)); },
    getRules() {
        const data = localStorage.getItem(this.RULES_KEY);
        if (!data) { localStorage.setItem(this.RULES_KEY, JSON.stringify(DefaultAllocationRules)); return [...DefaultAllocationRules]; }
        return JSON.parse(data);
    },
    saveRules(rules) { localStorage.setItem(this.RULES_KEY, JSON.stringify(rules)); },
    getAuditLog() { return JSON.parse(localStorage.getItem(this.LOG_KEY) || '[]'); },
    addAuditLog(entry) {
        const logs = this.getAuditLog();
        logs.unshift({ ...entry, id: Date.now().toString(36), timestamp: new Date().toISOString(), operator: this.getCurrentOwner() });
        if (logs.length > 500) logs.length = 500;
        localStorage.setItem(this.LOG_KEY, JSON.stringify(logs));
    },
    add(leadData) {
        const leads = this.getAll();
        const now = new Date().toISOString();
        const lead = {
            id: Date.now().toString(36) + Math.random().toString(36).slice(2, 8),
            name: '', phone: '', wechat: '', source: '', source_platform: '手工录入',
            intent_level: 'C', company: '', position: '', industry: '', region: '',
            follow_records: [], next_contact_date: '', notes: '',
            status: 'new', score: 0, priority: 'low', tags: [],
            assigned_to: '', assigned_at: '', owner: this.getCurrentOwner(),
            is_public: false, company_info: {},
            created_at: now, last_follow_date: '', updated_at: now,
            ...leadData
        };
        lead.score = LeadsScoring.calculate(lead);
        lead.priority = LeadsScoring.getPriority(lead.score, lead.source_platform);
        leads.unshift(lead);
        this.save(leads);
        this.addAuditLog({ action: '新增线索', target: lead.name, detail: `来源：${lead.source_platform}` });
        return lead;
    },
    update(id, updates) {
        const leads = this.getAll();
        const idx = leads.findIndex(l => l.id === id);
        if (idx === -1) return null;
        const oldStatus = leads[idx].status;
        leads[idx] = { ...leads[idx], ...updates, updated_at: new Date().toISOString() };
        if (updates.status && updates.status !== oldStatus) {
            this.addAuditLog({ action: '状态变更', target: leads[idx].name, detail: `${oldStatus} → ${updates.status}` });
        }
        this.save(leads);
        return leads[idx];
    },
    delete(id) {
        const leads = this.getAll();
        const lead = leads.find(l => l.id === id);
        if (lead) this.addAuditLog({ action: '删除线索', target: lead.name, detail: '' });
        this.save(leads.filter(l => l.id !== id));
    },
    bulkInsert(items) {
        const leads = this.getAll();
        const now = new Date().toISOString();
        const newLeads = items.map(item => {
            const lead = {
                id: Date.now().toString(36) + Math.random().toString(36).slice(2, 10),
                name: '', phone: '', wechat: '', source: '批量导入', source_platform: '批量导入',
                intent_level: 'C', company: '', position: '', industry: '', region: '',
                follow_records: [], next_contact_date: '', notes: '',
                status: 'new', score: 0, priority: 'low', tags: [],
                assigned_to: '', assigned_at: '', owner: LeadsStorage.getCurrentOwner(),
                is_public: false, company_info: {},
                created_at: now, last_follow_date: '', updated_at: now, ...item
            };
            lead.score = LeadsScoring.calculate(lead);
            lead.priority = LeadsScoring.getPriority(lead.score, lead.source_platform);
            return lead;
        });
        this.save([...newLeads, ...leads]);
        this.addAuditLog({ action: '批量导入', target: `${newLeads.length}条线索`, detail: '' });
        return newLeads;
    },
    getCurrentOwner() {
        if (typeof Auth !== 'undefined' && Auth.currentUser) return Auth.currentUser.email || 'admin';
        return 'admin';
    }
};

// ===== 线索评分引擎 =====
const LeadsScoring = {
    calculate(lead) {
        let score = 30; // 基础分
        // 来源加分
        const sourceScores = { '美团': 20, '抖音': 20, '百度推广': 15, '小红书': 12, '转介绍': 18, '电话营销': 8, '批量导入': 5, '手工录入': 10 };
        score += (sourceScores[lead.source_platform] || 5);
        // 企业规模
        if (lead.company_info) {
            const cap = lead.company_info.regCapital || '';
            const capNum = parseFloat(cap);
            if (capNum >= 5000) score += 20;
            else if (capNum >= 1000) score += 15;
            else if (capNum >= 500) score += 10;
            else if (capNum >= 100) score += 5;
            if (lead.company_info.employees >= 200) score += 10;
            else if (lead.company_info.employees >= 50) score += 5;
        }
        // 意向等级
        const intentScores = { A: 15, B: 8, C: 0, D: -5 };
        score += (intentScores[lead.intent_level] || 0);
        // 有跟进记录加分
        if (lead.follow_records && lead.follow_records.length > 0) score += 5;
        return Math.min(100, Math.max(0, score));
    },
    getPriority(score, platform) {
        if (platform === '美团' || platform === '抖音') return 'high';
        if (score >= 80) return 'high';
        if (score >= 60) return 'medium';
        return 'low';
    }
};

// ===== 查重引擎 =====
const LeadsDuplication = {
    check(lead, existingLeads) {
        const dupes = [];
        existingLeads.forEach(existing => {
            if (existing.id === lead.id) return;
            let similarity = 0;
            if (lead.phone && lead.phone === existing.phone) similarity += 50;
            if (lead.company && existing.company && this.stringSimilarity(lead.company, existing.company) > 0.8) similarity += 30;
            if (lead.name && lead.name === existing.name) similarity += 20;
            if (similarity >= 50) dupes.push({ lead: existing, similarity });
        });
        return dupes.sort((a, b) => b.similarity - a.similarity);
    },
    stringSimilarity(a, b) {
        if (!a || !b) return 0;
        a = a.toLowerCase(); b = b.toLowerCase();
        if (a === b) return 1;
        const longer = a.length > b.length ? a : b;
        const shorter = a.length > b.length ? b : a;
        if (longer.length === 0) return 1;
        let matches = 0;
        for (let i = 0; i < shorter.length; i++) {
            if (longer.includes(shorter[i])) matches++;
        }
        return matches / longer.length;
    }
};

// ===== 智能分配引擎 =====
const AllocationEngine = {
    allocate(lead) {
        const rules = LeadsStorage.getRules().filter(r => r.enabled).sort((a, b) => a.priority - b.priority);
        for (const rule of rules) {
            const result = this.applyRule(rule, lead);
            if (result) return result;
        }
        return this.roundRobin();
    },
    applyRule(rule, lead) {
        switch (rule.type) {
            case 'platform_priority':
                if (rule.config.platforms.includes(lead.source_platform)) return rule.config.topSales;
                break;
            case 'region':
                if (lead.region && rule.config[lead.region]) return rule.config[lead.region];
                break;
            case 'industry':
                if (lead.industry && rule.config[lead.industry]) return rule.config[lead.industry];
                break;
            case 'load_balance':
                return this.roundRobin(rule.config.sales);
                break;
        }
        return null;
    },
    roundRobin(salesList) {
        const list = salesList || ['王芳', '李强', '张伟', '陈丽', '赵敏'];
        const leads = LeadsStorage.getAll();
        const counts = {};
        list.forEach(s => { counts[s] = leads.filter(l => l.assigned_to === s && l.status !== 'converted' && l.status !== 'invalid' && l.status !== 'lost').length; });
        let minSales = list[0], minCount = counts[list[0]];
        list.forEach(s => { if (counts[s] < minCount) { minSales = s; minCount = counts[s]; } });
        return minSales;
    }
};

// ===== Leads 主模块 =====
const Leads = {
    currentTab: 'list',
    currentListTab: 'my',
    searchText: '',
    filterIntent: 'all',
    filterSource: 'all',
    filterStatus: 'all',
    filterPriority: 'all',
    detailLeadId: null,
    sortField: 'created_at',
    sortOrder: 'desc',

    init() {
        this.autoReclaimCheck();
        this.renderPage();
        this.bindEvents();
    },

    destroy() {
        const panel = document.getElementById('lead-detail-panel');
        if (panel) panel.classList.remove('open');
    },

    // ===== 自动回收检查 =====
    autoReclaimCheck() {
        const leads = LeadsStorage.getAll();
        const SEVEN_DAYS = 7 * 24 * 60 * 60 * 1000;
        const now = Date.now();
        let count = 0;
        leads.forEach(lead => {
            if (lead.is_public || lead.status === 'converted' || lead.status === 'invalid' || lead.status === 'lost') return;
            const refDate = lead.last_follow_date || lead.created_at;
            if (!refDate) return;
            if (now - new Date(refDate).getTime() > SEVEN_DAYS) {
                lead.is_public = true; lead.status = 'pending_reclaim'; lead.assigned_to = ''; count++;
            }
        });
        if (count > 0) {
            LeadsStorage.save(leads);
            LeadsStorage.addAuditLog({ action: '自动回收', target: `${count}条线索`, detail: '超7天未跟进' });
            setTimeout(() => showToast(`${count}条线索因超7天未跟进已自动退回公海`, 'warning'), 500);
        }
    },

    // ===== 主页面渲染 =====
    renderPage() {
        const contentArea = document.querySelector('.content-area');
        contentArea.innerHTML = `
            <div class="leads-module">
                <div class="leads-module-header">
                    <h2><i class="fa-solid fa-bullseye"></i> 线索管理</h2>
                    <div class="leads-header-actions">
                        <button class="btn-primary" id="btn-add-lead"><i class="fa-solid fa-plus"></i> 手工录入</button>
                        <button class="btn-secondary" id="btn-batch-import"><i class="fa-solid fa-file-import"></i> 批量导入</button>
                        <button class="btn-accent" id="btn-platform-leads"><i class="fa-solid fa-satellite-dish"></i> 平台线索 <span class="notif-badge">${MockPlatformLeads.length}</span></button>
                    </div>
                </div>
                <div class="leads-main-tabs">
                    <button class="leads-main-tab active" data-tab="list"><i class="fa-solid fa-list"></i> 线索列表</button>
                    <button class="leads-main-tab" data-tab="dashboard"><i class="fa-solid fa-chart-pie"></i> 数据看板</button>
                    <button class="leads-main-tab" data-tab="allocation"><i class="fa-solid fa-people-arrows"></i> 智能分配</button>
                    <button class="leads-main-tab" data-tab="scoring"><i class="fa-solid fa-star-half-stroke"></i> 线索评分</button>
                    <button class="leads-main-tab" data-tab="audit"><i class="fa-solid fa-clock-rotate-left"></i> 操作日志</button>
                </div>
                <div class="leads-tab-content" id="leads-tab-content"></div>
            </div>
            <!-- 弹窗容器 -->
            <div id="leads-modals"></div>
            <!-- 详情面板 -->
            <div id="lead-detail-panel" class="leads-detail-panel"><div id="detail-content"></div></div>
        `;
        this.renderTabContent();
    },

    renderTabContent() {
        const container = document.getElementById('leads-tab-content');
        switch (this.currentTab) {
            case 'list': container.innerHTML = this.renderListTab(); break;
            case 'dashboard': container.innerHTML = this.renderDashboardTab(); break;
            case 'allocation': container.innerHTML = this.renderAllocationTab(); break;
            case 'scoring': container.innerHTML = this.renderScoringTab(); break;
            case 'audit': container.innerHTML = this.renderAuditTab(); break;
        }
    },

    // ===== 线索列表Tab =====
    renderListTab() {
        const leads = LeadsStorage.getAll();
        const owner = LeadsStorage.getCurrentOwner();
        const myCount = leads.filter(l => !l.is_public).length;
        const publicCount = leads.filter(l => l.is_public).length;
        const todayFollow = leads.filter(l => l.next_contact_date === new Date().toISOString().slice(0, 10) && !l.is_public).length;
        const highPriority = leads.filter(l => l.priority === 'high' && !l.is_public && l.status !== 'converted').length;

        return `
            <div class="leads-stats-row">
                <div class="leads-stat-card"><div class="stat-icon" style="background:#eef2ff;color:#4f46e5;"><i class="fa-solid fa-database"></i></div><div class="stat-info"><span class="stat-value">${leads.length}</span><span class="stat-label">总线索</span></div></div>
                <div class="leads-stat-card"><div class="stat-icon" style="background:#fef3c7;color:#d97706;"><i class="fa-solid fa-fire"></i></div><div class="stat-info"><span class="stat-value">${highPriority}</span><span class="stat-label">高优先级</span></div></div>
                <div class="leads-stat-card"><div class="stat-icon" style="background:#dcfce7;color:#16a34a;"><i class="fa-solid fa-clock"></i></div><div class="stat-info"><span class="stat-value">${todayFollow}</span><span class="stat-label">今日待跟进</span></div></div>
                <div class="leads-stat-card"><div class="stat-icon" style="background:#fee2e2;color:#dc2626;"><i class="fa-solid fa-water"></i></div><div class="stat-info"><span class="stat-value">${publicCount}</span><span class="stat-label">公海线索</span></div></div>
            </div>
            <div class="leads-list-tabs">
                <button class="leads-sub-tab ${this.currentListTab === 'my' ? 'active' : ''}" data-listtab="my">我的线索 (${myCount})</button>
                <button class="leads-sub-tab ${this.currentListTab === 'public' ? 'active' : ''}" data-listtab="public">公海池 (${publicCount})</button>
                <button class="leads-sub-tab ${this.currentListTab === 'all' ? 'active' : ''}" data-listtab="all">全部 (${leads.length})</button>
            </div>
            <div class="leads-toolbar">
                <div class="toolbar-left">
                    <div class="search-box"><i class="fa-solid fa-search"></i><input type="text" id="leads-search" placeholder="搜索姓名/电话/公司..." value="${escapeHtml(this.searchText)}"></div>
                </div>
                <div class="toolbar-right">
                    <select class="filter-select" id="filter-priority"><option value="all">优先级</option><option value="high" ${this.filterPriority === 'high' ? 'selected' : ''}>高</option><option value="medium" ${this.filterPriority === 'medium' ? 'selected' : ''}>中</option><option value="low" ${this.filterPriority === 'low' ? 'selected' : ''}>低</option></select>
                    <select class="filter-select" id="filter-intent"><option value="all">意向</option><option value="A" ${this.filterIntent === 'A' ? 'selected' : ''}>A-高</option><option value="B" ${this.filterIntent === 'B' ? 'selected' : ''}>B-中</option><option value="C" ${this.filterIntent === 'C' ? 'selected' : ''}>C-一般</option><option value="D" ${this.filterIntent === 'D' ? 'selected' : ''}>D-低</option></select>
                    <select class="filter-select" id="filter-source"><option value="all">来源</option><option value="美团" ${this.filterSource === '美团' ? 'selected' : ''}>美团</option><option value="抖音" ${this.filterSource === '抖音' ? 'selected' : ''}>抖音</option><option value="百度" ${this.filterSource === '百度' ? 'selected' : ''}>百度</option><option value="小红书" ${this.filterSource === '小红书' ? 'selected' : ''}>小红书</option><option value="转介绍" ${this.filterSource === '转介绍' ? 'selected' : ''}>转介绍</option><option value="电话营销" ${this.filterSource === '电话营销' ? 'selected' : ''}>电话营销</option></select>
                    <select class="filter-select" id="filter-status"><option value="all">状态</option><option value="new" ${this.filterStatus === 'new' ? 'selected' : ''}>新建</option><option value="allocated" ${this.filterStatus === 'allocated' ? 'selected' : ''}>已分配</option><option value="following" ${this.filterStatus === 'following' ? 'selected' : ''}>跟进中</option><option value="qualified" ${this.filterStatus === 'qualified' ? 'selected' : ''}>有效</option><option value="converted" ${this.filterStatus === 'converted' ? 'selected' : ''}>已成交</option><option value="invalid" ${this.filterStatus === 'invalid' ? 'selected' : ''}>无效</option><option value="lost" ${this.filterStatus === 'lost' ? 'selected' : ''}>已流失</option></select>
                </div>
            </div>
            <div class="leads-table-wrap">
                <table class="leads-data-table">
                    <thead><tr>
                        <th class="th-sortable" data-sort="priority">优先</th>
                        <th class="th-sortable" data-sort="name">姓名</th>
                        <th>电话</th>
                        <th class="th-sortable" data-sort="company">公司</th>
                        <th class="th-sortable" data-sort="score">评分</th>
                        <th>意向</th>
                        <th>状态</th>
                        <th>来源</th>
                        <th>负责人</th>
                        <th class="th-sortable" data-sort="created_at">创建时间</th>
                        <th>操作</th>
                    </tr></thead>
                    <tbody id="leads-table-body"></tbody>
                </table>
            </div>
        `;
    },

    renderTableRows() {
        const filtered = this.getFilteredLeads();
        const tbody = document.getElementById('leads-table-body');
        if (!tbody) return;
        if (filtered.length === 0) {
            tbody.innerHTML = `<tr><td colspan="11"><div class="empty-state"><i class="fa-solid fa-inbox"></i><p>暂无线索数据</p></div></td></tr>`;
            return;
        }
        const statusMap = { new: '新建', allocated: '已分配', following: '跟进中', qualified: '有效', converted: '已成交', invalid: '无效', lost: '已流失', pending_reclaim: '待回收' };
        const statusClasses = { new: 'status-new', allocated: 'status-allocated', following: 'status-following', qualified: 'status-qualified', converted: 'status-converted', invalid: 'status-invalid', lost: 'status-lost', pending_reclaim: 'status-reclaim' };
        const priorityIcons = { high: '<span class="priority-dot high"></span>', medium: '<span class="priority-dot medium"></span>', low: '<span class="priority-dot low"></span>' };

        tbody.innerHTML = filtered.map(lead => `
            <tr class="lead-row ${lead.priority === 'high' ? 'highlight-row' : ''}" data-lead-id="${lead.id}">
                <td>${priorityIcons[lead.priority] || ''}</td>
                <td><strong>${escapeHtml(lead.name)}</strong></td>
                <td>${escapeHtml(lead.phone) || '-'}</td>
                <td class="td-company">${escapeHtml(lead.company) || '-'}</td>
                <td><span class="score-badge score-${lead.score >= 80 ? 'high' : lead.score >= 60 ? 'mid' : 'low'}">${lead.score}</span></td>
                <td><span class="intent-badge intent-${(lead.intent_level || 'C').toLowerCase()}">${lead.intent_level || 'C'}</span></td>
                <td><span class="lead-status ${statusClasses[lead.status] || ''}">${statusMap[lead.status] || lead.status}</span></td>
                <td><span class="source-tag">${escapeHtml(lead.source_platform || lead.source) || '-'}</span></td>
                <td>${escapeHtml(lead.assigned_to) || '<span class="text-muted">未分配</span>'}</td>
                <td class="td-time">${lead.created_at ? new Date(lead.created_at).toLocaleDateString('zh-CN') : '-'}</td>
                <td class="action-cell">
                    ${lead.is_public ? `<button class="btn-mini btn-claim" data-action="claim" data-id="${lead.id}">领取</button>` : `<button class="btn-mini btn-follow" data-action="follow" data-id="${lead.id}">跟进</button>`}
                </td>
            </tr>
        `).join('');
    },

    getFilteredLeads() {
        let leads = LeadsStorage.getAll();
        if (this.currentListTab === 'public') leads = leads.filter(l => l.is_public);
        else if (this.currentListTab === 'my') leads = leads.filter(l => !l.is_public);

        if (this.searchText) {
            const s = this.searchText.toLowerCase();
            leads = leads.filter(l => (l.name && l.name.toLowerCase().includes(s)) || (l.phone && l.phone.includes(s)) || (l.company && l.company.toLowerCase().includes(s)));
        }
        if (this.filterIntent !== 'all') leads = leads.filter(l => l.intent_level === this.filterIntent);
        if (this.filterSource !== 'all') leads = leads.filter(l => (l.source_platform || l.source || '').includes(this.filterSource));
        if (this.filterStatus !== 'all') leads = leads.filter(l => l.status === this.filterStatus);
        if (this.filterPriority !== 'all') leads = leads.filter(l => l.priority === this.filterPriority);

        leads.sort((a, b) => {
            let va = a[this.sortField], vb = b[this.sortField];
            if (this.sortField === 'score') { va = va || 0; vb = vb || 0; }
            if (va < vb) return this.sortOrder === 'asc' ? -1 : 1;
            if (va > vb) return this.sortOrder === 'asc' ? 1 : -1;
            return 0;
        });
        return leads;
    },

    // ===== 数据看板Tab =====
    renderDashboardTab() {
        const leads = LeadsStorage.getAll();
        const total = leads.length;
        const statusCounts = {};
        leads.forEach(l => { statusCounts[l.status] = (statusCounts[l.status] || 0) + 1; });
        const sourceCounts = {};
        leads.forEach(l => { const s = l.source_platform || l.source || '其他'; sourceCounts[s] = (sourceCounts[s] || 0) + 1; });
        const converted = statusCounts['converted'] || 0;
        const convRate = total > 0 ? ((converted / total) * 100).toFixed(1) : 0;

        // 转化漏斗数据
        const funnel = [
            { label: '线索接入', count: total, pct: 100 },
            { label: '已分配', count: (statusCounts['allocated'] || 0) + (statusCounts['following'] || 0) + (statusCounts['qualified'] || 0) + converted, pct: 0 },
            { label: '跟进中', count: (statusCounts['following'] || 0) + (statusCounts['qualified'] || 0) + converted, pct: 0 },
            { label: '有效线索', count: (statusCounts['qualified'] || 0) + converted, pct: 0 },
            { label: '成交', count: converted, pct: 0 }
        ];
        funnel.forEach(f => { f.pct = total > 0 ? ((f.count / total) * 100).toFixed(0) : 0; });

        // 销售效率
        const salesStats = {};
        leads.filter(l => l.assigned_to).forEach(l => {
            if (!salesStats[l.assigned_to]) salesStats[l.assigned_to] = { total: 0, converted: 0, following: 0 };
            salesStats[l.assigned_to].total++;
            if (l.status === 'converted') salesStats[l.assigned_to].converted++;
            if (l.status === 'following') salesStats[l.assigned_to].following++;
        });

        return `
            <div class="dashboard-grid">
                <div class="dash-card dash-summary">
                    <h4><i class="fa-solid fa-chart-simple"></i> 核心指标</h4>
                    <div class="dash-kpi-row">
                        <div class="kpi-item"><span class="kpi-value">${total}</span><span class="kpi-label">总线索量</span></div>
                        <div class="kpi-item"><span class="kpi-value" style="color:#16a34a">${convRate}%</span><span class="kpi-label">转化率</span></div>
                        <div class="kpi-item"><span class="kpi-value" style="color:#d97706">${statusCounts['following'] || 0}</span><span class="kpi-label">跟进中</span></div>
                        <div class="kpi-item"><span class="kpi-value" style="color:#dc2626">${statusCounts['invalid'] || 0}</span><span class="kpi-label">无效线索</span></div>
                    </div>
                </div>
                <div class="dash-card dash-funnel">
                    <h4><i class="fa-solid fa-filter"></i> 转化漏斗</h4>
                    <div class="funnel-chart">
                        ${funnel.map((f, i) => `<div class="funnel-step"><div class="funnel-bar" style="width:${Math.max(20, f.pct)}%;background:hsl(${240 - i * 30},70%,${55 + i * 5}%);">${f.count}</div><span class="funnel-label">${f.label} (${f.pct}%)</span></div>`).join('')}
                    </div>
                </div>
                <div class="dash-card dash-source">
                    <h4><i class="fa-solid fa-diagram-project"></i> 来源分布</h4>
                    <div class="source-bars">
                        ${Object.entries(sourceCounts).sort((a, b) => b[1] - a[1]).map(([src, cnt]) => `<div class="source-bar-item"><span class="src-name">${escapeHtml(src)}</span><div class="src-bar"><div class="src-bar-fill" style="width:${(cnt / total * 100).toFixed(0)}%"></div></div><span class="src-count">${cnt}</span></div>`).join('')}
                    </div>
                </div>
                <div class="dash-card dash-sales">
                    <h4><i class="fa-solid fa-users"></i> 销售效率</h4>
                    <table class="mini-table"><thead><tr><th>销售</th><th>线索数</th><th>跟进中</th><th>成交</th><th>转化率</th></tr></thead><tbody>
                        ${Object.entries(salesStats).map(([name, s]) => `<tr><td>${escapeHtml(name)}</td><td>${s.total}</td><td>${s.following}</td><td>${s.converted}</td><td>${s.total > 0 ? ((s.converted / s.total) * 100).toFixed(0) : 0}%</td></tr>`).join('')}
                    </tbody></table>
                </div>
                <div class="dash-card dash-ai">
                    <h4><i class="fa-solid fa-brain"></i> 智能预警 <span class="backend-badge"><i class="fa-solid fa-lock"></i> 需后端支持</span></h4>
                    <div class="ai-alert-list">
                        <div class="ai-alert warn"><i class="fa-solid fa-triangle-exclamation"></i> 3条高优先级线索超过24小时未跟进</div>
                        <div class="ai-alert info"><i class="fa-solid fa-chart-line"></i> 本周抖音渠道线索量较上周增长35%</div>
                        <div class="ai-alert danger"><i class="fa-solid fa-arrow-down"></i> 美团渠道近3天线索量下降60%，建议检查投放</div>
                        <div class="ai-alert success"><i class="fa-solid fa-trophy"></i> 李强本周转化率达42%，高于团队均值</div>
                    </div>
                </div>
            </div>
        `;
    },

    // ===== 智能分配Tab =====
    renderAllocationTab() {
        const rules = LeadsStorage.getRules();
        return `
            <div class="allocation-section">
                <div class="section-header">
                    <h4><i class="fa-solid fa-gears"></i> 分配规则引擎</h4>
                    <span class="backend-badge"><i class="fa-solid fa-lock"></i> 完整规则引擎需后端支持</span>
                </div>
                <div class="rules-list">
                    ${rules.map(rule => `
                        <div class="rule-card ${rule.enabled ? '' : 'disabled'}">
                            <div class="rule-header">
                                <div class="rule-title">
                                    <label class="switch-label"><input type="checkbox" class="rule-toggle" data-rule-id="${rule.id}" ${rule.enabled ? 'checked' : ''}><span class="switch-slider"></span></label>
                                    <strong>${escapeHtml(rule.name)}</strong>
                                    <span class="rule-priority">优先级: ${rule.priority}</span>
                                </div>
                                <span class="rule-type-badge">${this.getRuleTypeLabel(rule.type)}</span>
                            </div>
                            <div class="rule-detail">${this.renderRuleDetail(rule)}</div>
                        </div>
                    `).join('')}
                </div>
                <div class="allocation-test">
                    <h4><i class="fa-solid fa-flask"></i> 分配测试</h4>
                    <p class="hint-text">输入线索信息测试分配结果：</p>
                    <div class="test-form">
                        <input type="text" id="test-region" placeholder="地区（如：西湖区）" class="test-input">
                        <input type="text" id="test-industry" placeholder="行业（如：信息技术）" class="test-input">
                        <select id="test-platform" class="test-input"><option value="手工录入">手工录入</option><option value="美团">美团</option><option value="抖音">抖音</option><option value="百度推广">百度推广</option></select>
                        <button class="btn-primary" id="btn-test-allocate">测试分配</button>
                    </div>
                    <div id="allocation-result" class="allocation-result"></div>
                </div>
                <div class="allocation-stats">
                    <h4><i class="fa-solid fa-chart-bar"></i> 当前负载分布</h4>
                    <div id="load-distribution">${this.renderLoadDistribution()}</div>
                </div>
            </div>
        `;
    },

    getRuleTypeLabel(type) {
        const map = { region: '地域匹配', industry: '行业匹配', load_balance: '负载均衡', platform_priority: '平台优先' };
        return map[type] || type;
    },

    renderRuleDetail(rule) {
        if (rule.type === 'region') {
            return `<div class="rule-mappings">${Object.entries(rule.config).map(([k, v]) => `<span class="mapping-chip">${k} → ${v}</span>`).join('')}</div>`;
        }
        if (rule.type === 'industry') {
            return `<div class="rule-mappings">${Object.entries(rule.config).map(([k, v]) => `<span class="mapping-chip">${k} → ${v}</span>`).join('')}</div>`;
        }
        if (rule.type === 'load_balance') {
            return `<div class="rule-mappings">参与分配人员：${rule.config.sales.map(s => `<span class="mapping-chip">${s}</span>`).join('')}</div>`;
        }
        if (rule.type === 'platform_priority') {
            return `<div class="rule-mappings">平台 ${rule.config.platforms.join('/')} → 优先分配给 <strong>${rule.config.topSales}</strong></div>`;
        }
        return '';
    },

    renderLoadDistribution() {
        const leads = LeadsStorage.getAll();
        const sales = ['王芳', '李强', '张伟', '陈丽', '赵敏'];
        const maxLoad = Math.max(...sales.map(s => leads.filter(l => l.assigned_to === s && !['converted', 'invalid', 'lost'].includes(l.status)).length), 1);
        return `<div class="load-bars">${sales.map(s => {
            const count = leads.filter(l => l.assigned_to === s && !['converted', 'invalid', 'lost'].includes(l.status)).length;
            return `<div class="load-bar-item"><span class="load-name">${s}</span><div class="load-bar"><div class="load-bar-fill" style="width:${(count / maxLoad * 100).toFixed(0)}%"></div></div><span class="load-count">${count}条</span></div>`;
        }).join('')}</div>`;
    },

    // ===== 线索评分Tab =====
    renderScoringTab() {
        const leads = LeadsStorage.getAll();
        const avgScore = leads.length > 0 ? (leads.reduce((sum, l) => sum + (l.score || 0), 0) / leads.length).toFixed(1) : 0;
        const highScoreLeads = leads.filter(l => l.score >= 80).sort((a, b) => b.score - a.score).slice(0, 10);
        const scoreDistribution = [
            { range: '90-100', count: leads.filter(l => l.score >= 90).length, color: '#16a34a' },
            { range: '80-89', count: leads.filter(l => l.score >= 80 && l.score < 90).length, color: '#65a30d' },
            { range: '60-79', count: leads.filter(l => l.score >= 60 && l.score < 80).length, color: '#d97706' },
            { range: '40-59', count: leads.filter(l => l.score >= 40 && l.score < 60).length, color: '#ea580c' },
            { range: '0-39', count: leads.filter(l => l.score < 40).length, color: '#dc2626' }
        ];

        return `
            <div class="scoring-section">
                <div class="scoring-overview">
                    <div class="score-summary-card">
                        <div class="score-circle"><span>${avgScore}</span></div>
                        <div class="score-info"><h4>平均评分</h4><p>基于${leads.length}条线索计算</p></div>
                    </div>
                    <div class="score-distribution">
                        <h4>评分分布</h4>
                        ${scoreDistribution.map(d => `<div class="score-dist-item"><span class="dist-range">${d.range}分</span><div class="dist-bar"><div class="dist-bar-fill" style="width:${leads.length > 0 ? (d.count / leads.length * 100) : 0}%;background:${d.color}"></div></div><span class="dist-count">${d.count}</span></div>`).join('')}
                    </div>
                </div>
                <div class="scoring-rules-card">
                    <h4><i class="fa-solid fa-calculator"></i> 评分规则说明</h4>
                    <table class="scoring-rules-table">
                        <thead><tr><th>维度</th><th>加分项</th><th>分值</th></tr></thead>
                        <tbody>
                            <tr><td>基础分</td><td>所有线索</td><td>30分</td></tr>
                            <tr><td>来源渠道</td><td>美团/抖音</td><td>+20分</td></tr>
                            <tr><td>来源渠道</td><td>转介绍</td><td>+18分</td></tr>
                            <tr><td>来源渠道</td><td>百度推广</td><td>+15分</td></tr>
                            <tr><td>企业规模</td><td>注册资本≥5000万</td><td>+20分</td></tr>
                            <tr><td>企业规模</td><td>注册资本≥1000万</td><td>+15分</td></tr>
                            <tr><td>企业规模</td><td>员工≥200人</td><td>+10分</td></tr>
                            <tr><td>意向等级</td><td>A级意向</td><td>+15分</td></tr>
                            <tr><td>意向等级</td><td>B级意向</td><td>+8分</td></tr>
                            <tr><td>跟进情况</td><td>有跟进记录</td><td>+5分</td></tr>
                        </tbody>
                    </table>
                    <p class="hint-text"><i class="fa-solid fa-wand-magic-sparkles"></i> AI机器学习评分模型 <span class="backend-badge">需后端支持</span></p>
                </div>
                <div class="top-leads-card">
                    <h4><i class="fa-solid fa-ranking-star"></i> TOP 10 高分线索</h4>
                    <table class="mini-table"><thead><tr><th>排名</th><th>姓名</th><th>公司</th><th>评分</th><th>状态</th></tr></thead><tbody>
                        ${highScoreLeads.map((l, i) => `<tr><td><strong>#${i + 1}</strong></td><td>${escapeHtml(l.name)}</td><td>${escapeHtml(l.company) || '-'}</td><td><span class="score-badge score-high">${l.score}</span></td><td>${l.status}</td></tr>`).join('')}
                    </tbody></table>
                </div>
            </div>
        `;
    },

    // ===== 操作日志Tab =====
    renderAuditTab() {
        const logs = LeadsStorage.getAuditLog();
        return `
            <div class="audit-section">
                <div class="audit-header">
                    <h4><i class="fa-solid fa-scroll"></i> 操作审计日志</h4>
                    <span class="hint-text">记录所有线索操作，最多保留500条</span>
                </div>
                <div class="audit-list">
                    ${logs.length === 0 ? '<div class="empty-state"><i class="fa-solid fa-clipboard-check"></i><p>暂无操作记录</p></div>' : ''}
                    ${logs.slice(0, 50).map(log => `
                        <div class="audit-item">
                            <div class="audit-icon"><i class="fa-solid ${this.getAuditIcon(log.action)}"></i></div>
                            <div class="audit-body">
                                <div class="audit-main"><strong>${escapeHtml(log.action)}</strong> - ${escapeHtml(log.target)} ${log.detail ? `<span class="audit-detail">${escapeHtml(log.detail)}</span>` : ''}</div>
                                <div class="audit-meta"><span>${escapeHtml(log.operator || 'system')}</span> · <span>${log.timestamp ? new Date(log.timestamp).toLocaleString('zh-CN') : ''}</span></div>
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
    },

    getAuditIcon(action) {
        if (action.includes('新增') || action.includes('导入')) return 'fa-plus-circle';
        if (action.includes('删除')) return 'fa-trash';
        if (action.includes('状态')) return 'fa-exchange-alt';
        if (action.includes('分配')) return 'fa-user-check';
        if (action.includes('回收')) return 'fa-recycle';
        return 'fa-pen';
    },

    // ===== 事件绑定 =====
    bindEvents() {
        const module = document.querySelector('.leads-module');
        if (!module) return;

        // 主Tab切换
        module.addEventListener('click', (e) => {
            const mainTab = e.target.closest('.leads-main-tab');
            if (mainTab) {
                this.currentTab = mainTab.dataset.tab;
                module.querySelectorAll('.leads-main-tab').forEach(t => t.classList.remove('active'));
                mainTab.classList.add('active');
                this.renderTabContent();
                if (this.currentTab === 'list') setTimeout(() => this.renderTableRows(), 0);
                this.rebindTabEvents();
                return;
            }
            // 子Tab切换
            const subTab = e.target.closest('.leads-sub-tab');
            if (subTab) {
                this.currentListTab = subTab.dataset.listtab;
                module.querySelectorAll('.leads-sub-tab').forEach(t => t.classList.remove('active'));
                subTab.classList.add('active');
                this.renderTableRows();
                return;
            }
            // 表格行点击 -> 详情
            const row = e.target.closest('.lead-row');
            if (row && !e.target.closest('.action-cell')) {
                this.showDetail(row.dataset.leadId);
                return;
            }
            // 操作按钮
            const actionBtn = e.target.closest('[data-action]');
            if (actionBtn) {
                e.stopPropagation();
                const action = actionBtn.dataset.action;
                const id = actionBtn.dataset.id;
                if (action === 'claim') this.claimLead(id);
                else if (action === 'follow') this.openFollowModal(id);
                return;
            }
            // 排序
            const sortTh = e.target.closest('.th-sortable');
            if (sortTh) {
                const field = sortTh.dataset.sort;
                if (this.sortField === field) this.sortOrder = this.sortOrder === 'desc' ? 'asc' : 'desc';
                else { this.sortField = field; this.sortOrder = 'desc'; }
                this.renderTableRows();
            }
        });

        // 按钮事件
        document.getElementById('btn-add-lead').addEventListener('click', () => this.showAddLeadModal());
        document.getElementById('btn-batch-import').addEventListener('click', () => this.showBatchImportModal());
        document.getElementById('btn-platform-leads').addEventListener('click', () => this.showPlatformLeadsModal());

        // 详情面板事件
        document.getElementById('lead-detail-panel').addEventListener('click', (e) => {
            if (e.target.closest('.close-panel')) this.hideDetail();
            const detailAction = e.target.closest('[data-detail-action]');
            if (detailAction) this.handleDetailAction(detailAction.dataset.detailAction);
        });

        // 初始渲染表格
        if (this.currentTab === 'list') setTimeout(() => { this.renderTableRows(); this.bindListEvents(); }, 0);
    },

    bindListEvents() {
        // 搜索
        const searchInput = document.getElementById('leads-search');
        if (searchInput) {
            let timer;
            searchInput.addEventListener('input', () => { clearTimeout(timer); timer = setTimeout(() => { this.searchText = searchInput.value.trim(); this.renderTableRows(); }, 300); });
        }
        // 筛选
        const filterMap = { 'filter-priority': 'filterPriority', 'filter-intent': 'filterIntent', 'filter-source': 'filterSource', 'filter-status': 'filterStatus' };
        Object.entries(filterMap).forEach(([elId, prop]) => {
            const el = document.getElementById(elId);
            if (el) el.addEventListener('change', (e) => { this[prop] = e.target.value; this.renderTableRows(); });
        });
    },

    rebindTabEvents() {
        if (this.currentTab === 'list') setTimeout(() => this.bindListEvents(), 0);
        if (this.currentTab === 'allocation') setTimeout(() => this.bindAllocationEvents(), 0);
    },

    bindAllocationEvents() {
        // 规则开关
        document.querySelectorAll('.rule-toggle').forEach(toggle => {
            toggle.addEventListener('change', (e) => {
                const ruleId = e.target.dataset.ruleId;
                const rules = LeadsStorage.getRules();
                const rule = rules.find(r => r.id === ruleId);
                if (rule) { rule.enabled = e.target.checked; LeadsStorage.saveRules(rules); }
            });
        });
        // 分配测试
        const testBtn = document.getElementById('btn-test-allocate');
        if (testBtn) {
            testBtn.addEventListener('click', () => {
                const region = document.getElementById('test-region').value;
                const industry = document.getElementById('test-industry').value;
                const platform = document.getElementById('test-platform').value;
                const testLead = { region, industry, source_platform: platform };
                const result = AllocationEngine.allocate(testLead);
                document.getElementById('allocation-result').innerHTML = `<div class="test-result"><i class="fa-solid fa-check-circle"></i> 分配结果：<strong>${result}</strong></div>`;
            });
        }
    },

    // ===== 弹窗：手工录入 =====
    showAddLeadModal() {
        const modals = document.getElementById('leads-modals');
        modals.innerHTML = `
            <div class="modal active" id="add-lead-modal">
                <div class="modal-content" style="max-width:700px;">
                    <div class="modal-header"><h3><i class="fa-solid fa-user-plus"></i> 手工录入线索</h3><button class="modal-close" id="close-add-modal">&times;</button></div>
                    <div class="add-lead-steps">
                        <div class="step-indicator">
                            <span class="step active" data-step="1">① 基本信息</span>
                            <span class="step" data-step="2">② 企业信息</span>
                            <span class="step" data-step="3">③ 附加信息</span>
                        </div>
                        <form id="add-lead-form">
                            <div class="step-content active" data-step="1">
                                <div class="form-row"><div class="form-group"><label>姓名 *</label><input type="text" name="name" required></div><div class="form-group"><label>电话 *</label><input type="tel" name="phone" required></div></div>
                                <div class="form-row"><div class="form-group"><label>微信</label><input type="text" name="wechat"></div><div class="form-group"><label>意向等级</label><select name="intent_level"><option value="C">C-一般</option><option value="A">A-高意向</option><option value="B">B-有意向</option><option value="D">D-低意向</option></select></div></div>
                                <div class="form-row"><div class="form-group"><label>来源渠道</label><select name="source"><option value="">请选择</option><option value="抖音">抖音</option><option value="美团">美团</option><option value="小红书">小红书</option><option value="百度">百度推广</option><option value="转介绍">转介绍</option><option value="电话营销">电话营销</option><option value="其他">其他</option></select></div><div class="form-group"><label>职位</label><input type="text" name="position"></div></div>
                                <div class="step-actions"><button type="button" class="btn-primary btn-next-step" data-next="2">下一步 →</button></div>
                            </div>
                            <div class="step-content" data-step="2">
                                <div class="form-group company-input-group">
                                    <label>公司名称 <span class="auto-fill-hint">（输入后自动获取工商信息）</span></label>
                                    <div class="company-input-wrap"><input type="text" name="company" id="company-input" autocomplete="off"><button type="button" class="btn-fetch-company" id="btn-fetch-company"><i class="fa-solid fa-search"></i> 查询</button></div>
                                    <div id="company-suggestions" class="company-suggestions"></div>
                                </div>
                                <div id="company-auto-fill" class="company-auto-fill" style="display:none;">
                                    <div class="auto-fill-header"><span><i class="fa-solid fa-building"></i> 企业工商信息（自动填充）</span><button type="button" class="btn-clear-auto" id="btn-clear-auto">清空自动数据</button></div>
                                    <div class="form-row"><div class="form-group"><label>法定代表人</label><input type="text" name="legalPerson" readonly></div><div class="form-group"><label>注册资本</label><input type="text" name="regCapital" readonly></div></div>
                                    <div class="form-row"><div class="form-group"><label>成立日期</label><input type="text" name="foundDate" readonly></div><div class="form-group"><label>统一社会信用代码</label><input type="text" name="creditCode" readonly></div></div>
                                    <div class="form-group"><label>注册地址</label><input type="text" name="address" readonly></div>
                                    <div class="form-group"><label>经营范围</label><input type="text" name="scope" readonly></div>
                                </div>
                                <div class="form-row"><div class="form-group"><label>行业</label><input type="text" name="industry" id="industry-input"></div><div class="form-group"><label>地区</label><input type="text" name="region"></div></div>
                                <div class="step-actions"><button type="button" class="btn-secondary btn-prev-step" data-prev="1">← 上一步</button><button type="button" class="btn-primary btn-next-step" data-next="3">下一步 →</button></div>
                            </div>
                            <div class="step-content" data-step="3">
                                <div class="form-row"><div class="form-group"><label>下次联系时间</label><input type="date" name="next_contact_date"></div><div class="form-group"><label>标签</label><input type="text" name="tags" placeholder="多个标签用逗号分隔"></div></div>
                                <div class="form-group"><label>备注</label><textarea name="notes" rows="3"></textarea></div>
                                <div id="duplicate-warning" class="duplicate-warning" style="display:none;"></div>
                                <div class="step-actions"><button type="button" class="btn-secondary btn-prev-step" data-prev="2">← 上一步</button><button type="submit" class="btn-primary"><i class="fa-solid fa-check"></i> 保存线索</button></div>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        `;
        this.bindAddLeadEvents();
    },

    bindAddLeadEvents() {
        const modal = document.getElementById('add-lead-modal');
        document.getElementById('close-add-modal').addEventListener('click', () => modal.remove());
        // 分步导航
        modal.querySelectorAll('.btn-next-step').forEach(btn => {
            btn.addEventListener('click', () => {
                const next = btn.dataset.next;
                modal.querySelectorAll('.step-content').forEach(s => s.classList.remove('active'));
                modal.querySelector(`.step-content[data-step="${next}"]`).classList.add('active');
                modal.querySelectorAll('.step-indicator .step').forEach(s => s.classList.remove('active'));
                modal.querySelector(`.step-indicator .step[data-step="${next}"]`).classList.add('active');
            });
        });
        modal.querySelectorAll('.btn-prev-step').forEach(btn => {
            btn.addEventListener('click', () => {
                const prev = btn.dataset.prev;
                modal.querySelectorAll('.step-content').forEach(s => s.classList.remove('active'));
                modal.querySelector(`.step-content[data-step="${prev}"]`).classList.add('active');
                modal.querySelectorAll('.step-indicator .step').forEach(s => s.classList.remove('active'));
                modal.querySelector(`.step-indicator .step[data-step="${prev}"]`).classList.add('active');
            });
        });
        // 公司名称自动填充
        const companyInput = document.getElementById('company-input');
        let sugTimer;
        companyInput.addEventListener('input', () => {
            clearTimeout(sugTimer);
            sugTimer = setTimeout(() => this.searchCompany(companyInput.value), 300);
        });
        document.getElementById('btn-fetch-company').addEventListener('click', () => this.searchCompany(companyInput.value));
        document.getElementById('btn-clear-auto').addEventListener('click', () => {
            document.getElementById('company-auto-fill').style.display = 'none';
            modal.querySelectorAll('#company-auto-fill input').forEach(inp => { inp.value = ''; inp.removeAttribute('readonly'); });
        });
        // 表单提交
        document.getElementById('add-lead-form').addEventListener('submit', (e) => this.handleAddSubmit(e));
    },

    searchCompany(keyword) {
        if (!keyword || keyword.length < 2) { document.getElementById('company-suggestions').innerHTML = ''; return; }
        const results = MockCompanyDB.filter(c => c.name.includes(keyword));
        const sugDiv = document.getElementById('company-suggestions');
        if (results.length === 0) {
            sugDiv.innerHTML = `<div class="sug-empty">未找到匹配企业 <span class="backend-badge">完整查询需对接天眼查API</span></div>`;
            return;
        }
        sugDiv.innerHTML = results.map(c => `<div class="sug-item" data-company="${escapeHtml(c.name)}"><strong>${escapeHtml(c.name)}</strong><span>${c.legalPerson} · ${c.regCapital} · ${c.industry}</span></div>`).join('');
        sugDiv.querySelectorAll('.sug-item').forEach(item => {
            item.addEventListener('click', () => {
                const name = item.dataset.company;
                this.fillCompanyInfo(name);
                sugDiv.innerHTML = '';
            });
        });
    },

    fillCompanyInfo(companyName) {
        const info = MockCompanyDB.find(c => c.name === companyName);
        if (!info) return;
        document.getElementById('company-input').value = companyName;
        document.getElementById('industry-input').value = info.industry || '';
        const autoFill = document.getElementById('company-auto-fill');
        autoFill.style.display = 'block';
        autoFill.querySelector('[name="legalPerson"]').value = info.legalPerson || '';
        autoFill.querySelector('[name="regCapital"]').value = info.regCapital || '';
        autoFill.querySelector('[name="foundDate"]').value = info.foundDate || '';
        autoFill.querySelector('[name="creditCode"]').value = info.creditCode || '';
        autoFill.querySelector('[name="address"]').value = info.address || '';
        autoFill.querySelector('[name="scope"]').value = info.scope || '';
    },

    handleAddSubmit(e) {
        e.preventDefault();
        const form = e.target;
        const fd = new FormData(form);
        const data = Object.fromEntries(fd);
        // 查重
        const existing = LeadsStorage.getAll();
        const dupes = LeadsDuplication.check(data, existing);
        if (dupes.length > 0) {
            const warnDiv = document.getElementById('duplicate-warning');
            warnDiv.style.display = 'block';
            warnDiv.innerHTML = `<i class="fa-solid fa-triangle-exclamation"></i> 检测到${dupes.length}条疑似重复线索：${dupes.map(d => `<strong>${d.lead.name}(${d.lead.phone})</strong> 相似度${d.similarity}%`).join('、')}<br><button type="button" class="btn-mini btn-confirm-add">仍然添加</button>`;
            warnDiv.querySelector('.btn-confirm-add').addEventListener('click', () => this.doAddLead(data));
            return;
        }
        this.doAddLead(data);
    },

    doAddLead(data) {
        const tags = data.tags ? data.tags.split(/[,，]/).map(t => t.trim()).filter(t => t) : [];
        const company_info = {};
        ['legalPerson', 'regCapital', 'foundDate', 'creditCode', 'address', 'scope'].forEach(k => { if (data[k]) company_info[k] = data[k]; });
        const companyMatch = MockCompanyDB.find(c => c.name === data.company);
        if (companyMatch) company_info.employees = companyMatch.employees;

        const lead = LeadsStorage.add({
            name: data.name, phone: data.phone, wechat: data.wechat,
            source: data.source, source_platform: data.source || '手工录入',
            intent_level: data.intent_level || 'C',
            company: data.company, position: data.position,
            industry: data.industry, region: data.region,
            next_contact_date: data.next_contact_date, notes: data.notes,
            tags, company_info
        });
        // 智能分配
        const assignee = AllocationEngine.allocate(lead);
        if (assignee) {
            LeadsStorage.update(lead.id, { assigned_to: assignee, assigned_at: new Date().toISOString(), status: 'allocated' });
            LeadsStorage.addAuditLog({ action: '智能分配', target: lead.name, detail: `→ ${assignee}` });
        }
        document.getElementById('add-lead-modal').remove();
        this.renderTabContent();
        setTimeout(() => this.renderTableRows(), 0);
        setTimeout(() => this.bindListEvents(), 50);
        showToast(`线索添加成功，已分配给 ${assignee || '未分配'}`, 'success');
    },

    // ===== 弹窗：批量导入 =====
    showBatchImportModal() {
        const modals = document.getElementById('leads-modals');
        modals.innerHTML = `
            <div class="modal active" id="batch-import-modal">
                <div class="modal-content" style="max-width:650px;">
                    <div class="modal-header"><h3><i class="fa-solid fa-file-import"></i> 批量导入线索</h3><button class="modal-close" id="close-import-modal">&times;</button></div>
                    <div class="import-body">
                        <div class="import-tabs">
                            <button class="import-tab active" data-import="text">文本粘贴</button>
                            <button class="import-tab" data-import="file">Excel/CSV上传 <span class="backend-badge">需后端</span></button>
                        </div>
                        <div class="import-content active" data-import="text">
                            <p class="import-hint">每行一条线索，格式：<code>姓名 电话 公司 行业 地区</code>（空格或Tab分隔，公司后字段可选）</p>
                            <div class="import-template"><button type="button" class="btn-mini" id="btn-fill-template">填入示例数据</button></div>
                            <textarea id="import-textarea" rows="10" placeholder="张三 13800138000 ABC公司 信息技术 西湖区&#10;李四 13900139000 XYZ贸易 贸易 滨江区&#10;王五 13700137000"></textarea>
                            <div id="import-preview" class="import-preview"></div>
                            <div id="import-validation" class="import-validation"></div>
                        </div>
                        <div class="import-content" data-import="file">
                            <div class="file-upload-area">
                                <i class="fa-solid fa-cloud-arrow-up"></i>
                                <p>拖拽文件到此处或点击上传</p>
                                <span>支持 .xlsx, .csv 格式</span>
                                <span class="backend-badge">文件解析需后端支持</span>
                            </div>
                        </div>
                        <div class="form-actions"><button type="button" class="btn-secondary" id="close-import-modal2">取消</button><button type="button" class="btn-primary" id="btn-do-import"><i class="fa-solid fa-check"></i> 确认导入</button></div>
                    </div>
                </div>
            </div>
        `;
        this.bindImportEvents();
    },

    bindImportEvents() {
        const modal = document.getElementById('batch-import-modal');
        document.getElementById('close-import-modal').addEventListener('click', () => modal.remove());
        document.getElementById('close-import-modal2').addEventListener('click', () => modal.remove());
        // Tab切换
        modal.querySelectorAll('.import-tab').forEach(tab => {
            tab.addEventListener('click', () => {
                modal.querySelectorAll('.import-tab').forEach(t => t.classList.remove('active'));
                modal.querySelectorAll('.import-content').forEach(c => c.classList.remove('active'));
                tab.classList.add('active');
                modal.querySelector(`.import-content[data-import="${tab.dataset.import}"]`).classList.add('active');
            });
        });
        // 填入示例
        document.getElementById('btn-fill-template').addEventListener('click', () => {
            document.getElementById('import-textarea').value = '张三 13800138001 杭州新创科技 信息技术 西湖区\n李四 13900139002 浙江通达贸易 贸易 滨江区\n王五 13700137003 绿叶环保科技 环保 萧山区\n赵六 13600136004\n钱七 13500135005 天翼教育 教育 余杭区';
            this.updateImportPreview();
        });
        // 实时预览
        document.getElementById('import-textarea').addEventListener('input', () => this.updateImportPreview());
        // 确认导入
        document.getElementById('btn-do-import').addEventListener('click', () => this.doImport());
    },

    updateImportPreview() {
        const text = document.getElementById('import-textarea').value;
        const lines = text.split('\n').map(l => l.trim()).filter(l => l);
        const preview = document.getElementById('import-preview');
        const validation = document.getElementById('import-validation');
        if (lines.length === 0) { preview.innerHTML = ''; validation.innerHTML = ''; return; }

        let valid = 0, invalid = 0;
        lines.forEach(line => {
            const parts = line.split(/[\s\t]+/);
            if (parts[0] && parts[1] && /^1\d{10}$/.test(parts[1])) valid++;
            else invalid++;
        });
        preview.innerHTML = `<span>识别到 <strong>${lines.length}</strong> 条数据</span>`;
        validation.innerHTML = `<span class="valid-count"><i class="fa-solid fa-check"></i> 有效 ${valid} 条</span>${invalid > 0 ? `<span class="invalid-count"><i class="fa-solid fa-xmark"></i> 格式问题 ${invalid} 条（缺少姓名或电话格式不对）</span>` : ''}`;
    },

    doImport() {
        const text = document.getElementById('import-textarea').value;
        const lines = text.split('\n').map(l => l.trim()).filter(l => l);
        if (lines.length === 0) { showToast('请输入线索数据', 'warning'); return; }

        const items = [];
        lines.forEach(line => {
            const parts = line.split(/[\s\t]+/);
            if (parts[0]) {
                items.push({ name: parts[0], phone: parts[1] || '', company: parts[2] || '', industry: parts[3] || '', region: parts[4] || '' });
            }
        });
        // 查重
        const existing = LeadsStorage.getAll();
        let dupCount = 0;
        const uniqueItems = items.filter(item => {
            const dupes = LeadsDuplication.check(item, existing);
            if (dupes.length > 0) { dupCount++; return false; }
            return true;
        });

        LeadsStorage.bulkInsert(uniqueItems);
        document.getElementById('batch-import-modal').remove();
        this.renderTabContent();
        setTimeout(() => { this.renderTableRows(); this.bindListEvents(); }, 50);
        const msg = dupCount > 0 ? `导入 ${uniqueItems.length} 条，${dupCount} 条重复已跳过` : `成功导入 ${uniqueItems.length} 条线索`;
        showToast(msg, 'success');
    },

    // ===== 弹窗：平台线索 =====
    showPlatformLeadsModal() {
        const modals = document.getElementById('leads-modals');
        modals.innerHTML = `
            <div class="modal active" id="platform-leads-modal">
                <div class="modal-content" style="max-width:700px;">
                    <div class="modal-header"><h3><i class="fa-solid fa-satellite-dish"></i> 线上平台实时线索</h3><button class="modal-close" id="close-platform-modal">&times;</button></div>
                    <div class="platform-body">
                        <div class="platform-status">
                            <div class="platform-item connected"><i class="fa-solid fa-circle"></i> 美团 <span class="status-text">已连接</span></div>
                            <div class="platform-item connected"><i class="fa-solid fa-circle"></i> 抖音 <span class="status-text">已连接</span></div>
                            <div class="platform-item"><i class="fa-solid fa-circle"></i> 百度推广 <span class="status-text">已连接</span></div>
                            <div class="platform-item disconnected"><i class="fa-solid fa-circle"></i> 小红书 <span class="status-text">未配置</span> <span class="backend-badge">需后端</span></div>
                        </div>
                        <div class="platform-leads-list">
                            ${MockPlatformLeads.map((pl, i) => `
                                <div class="platform-lead-card ${pl.priority === 'high' ? 'high-priority' : ''}">
                                    <div class="pl-header">
                                        <span class="pl-platform ${pl.platform === '美团' ? 'meituan' : pl.platform === '抖音' ? 'douyin' : 'baidu'}">${pl.platform}</span>
                                        <span class="pl-time">${pl.time}</span>
                                        ${pl.priority === 'high' ? '<span class="pl-priority">高优先</span>' : ''}
                                    </div>
                                    <div class="pl-body">
                                        <div class="pl-info"><strong>${escapeHtml(pl.name)}</strong> · ${escapeHtml(pl.phone)} ${pl.company ? `· ${escapeHtml(pl.company)}` : ''}</div>
                                        <div class="pl-content">${escapeHtml(pl.content)}</div>
                                    </div>
                                    <div class="pl-actions">
                                        <button class="btn-primary btn-mini btn-accept-platform" data-idx="${i}"><i class="fa-solid fa-check"></i> 接入系统</button>
                                        <button class="btn-secondary btn-mini btn-ignore-platform" data-idx="${i}">忽略</button>
                                    </div>
                                </div>
                            `).join('')}
                        </div>
                        <div class="platform-footer">
                            <button class="btn-primary" id="btn-accept-all"><i class="fa-solid fa-check-double"></i> 全部接入</button>
                            <span class="hint-text">实时Webhook推送需后端配置 <span class="backend-badge">需后端支持</span></span>
                        </div>
                    </div>
                </div>
            </div>
        `;
        this.bindPlatformEvents();
    },

    bindPlatformEvents() {
        const modal = document.getElementById('platform-leads-modal');
        document.getElementById('close-platform-modal').addEventListener('click', () => modal.remove());
        // 单条接入
        modal.querySelectorAll('.btn-accept-platform').forEach(btn => {
            btn.addEventListener('click', () => {
                const idx = parseInt(btn.dataset.idx);
                const pl = MockPlatformLeads[idx];
                if (!pl) return;
                const lead = LeadsStorage.add({
                    name: pl.name, phone: pl.phone, company: pl.company,
                    source: pl.platform, source_platform: pl.platform,
                    intent_level: 'B', notes: pl.content, priority: pl.priority,
                    tags: ['线上平台', pl.platform]
                });
                const assignee = AllocationEngine.allocate(lead);
                if (assignee) LeadsStorage.update(lead.id, { assigned_to: assignee, assigned_at: new Date().toISOString(), status: 'allocated' });
                btn.closest('.platform-lead-card').style.opacity = '0.4';
                btn.textContent = '已接入';
                btn.disabled = true;
                showToast(`${pl.name} 已接入并分配给 ${assignee}`, 'success');
            });
        });
        // 全部接入
        document.getElementById('btn-accept-all').addEventListener('click', () => {
            MockPlatformLeads.forEach(pl => {
                const lead = LeadsStorage.add({
                    name: pl.name, phone: pl.phone, company: pl.company,
                    source: pl.platform, source_platform: pl.platform,
                    intent_level: 'B', notes: pl.content, priority: pl.priority,
                    tags: ['线上平台', pl.platform]
                });
                const assignee = AllocationEngine.allocate(lead);
                if (assignee) LeadsStorage.update(lead.id, { assigned_to: assignee, assigned_at: new Date().toISOString(), status: 'allocated' });
            });
            modal.remove();
            this.renderTabContent();
            setTimeout(() => { this.renderTableRows(); this.bindListEvents(); }, 50);
            showToast(`已接入 ${MockPlatformLeads.length} 条平台线索并自动分配`, 'success');
        });
    },

    // ===== 弹窗：快速跟进 =====
    openFollowModal(leadId) {
        this.detailLeadId = leadId;
        const modals = document.getElementById('leads-modals');
        modals.innerHTML = `
            <div class="modal active" id="follow-modal">
                <div class="modal-content" style="max-width:450px;">
                    <div class="modal-header"><h3>添加跟进记录</h3><button class="modal-close" id="close-follow-modal">&times;</button></div>
                    <form id="follow-form">
                        <div class="form-group"><label>跟进内容 *</label><textarea name="content" rows="3" required></textarea></div>
                        <div class="form-row"><div class="form-group"><label>下次联系</label><input type="date" name="next_contact_date"></div><div class="form-group"><label>更新意向</label><select name="intent_level"><option value="">不变</option><option value="A">A-高意向</option><option value="B">B-有意向</option><option value="C">C-一般</option><option value="D">D-低意向</option></select></div></div>
                        <div class="form-actions"><button type="button" class="btn-secondary" id="close-follow-modal2">取消</button><button type="submit" class="btn-primary">保存</button></div>
                    </form>
                </div>
            </div>
        `;
        document.getElementById('close-follow-modal').addEventListener('click', () => document.getElementById('follow-modal').remove());
        document.getElementById('close-follow-modal2').addEventListener('click', () => document.getElementById('follow-modal').remove());
        document.getElementById('follow-form').addEventListener('submit', (e) => {
            e.preventDefault();
            const fd = new FormData(e.target);
            const content = fd.get('content');
            const nextDate = fd.get('next_contact_date');
            const intentUpdate = fd.get('intent_level');
            const leads = LeadsStorage.getAll();
            const lead = leads.find(l => l.id === this.detailLeadId);
            if (!lead) return;
            lead.follow_records = lead.follow_records || [];
            lead.follow_records.push({ date: new Date().toISOString(), content, operator: LeadsStorage.getCurrentOwner() });
            lead.last_follow_date = new Date().toISOString();
            if (nextDate) lead.next_contact_date = nextDate;
            if (intentUpdate) lead.intent_level = intentUpdate;
            if (lead.status === 'new' || lead.status === 'allocated') lead.status = 'following';
            lead.updated_at = new Date().toISOString();
            LeadsStorage.save(leads);
            LeadsStorage.addAuditLog({ action: '添加跟进', target: lead.name, detail: content.slice(0, 30) });
            document.getElementById('follow-modal').remove();
            this.renderTableRows();
            showToast('跟进记录已添加', 'success');
        });
    },

    // ===== 详情面板 =====
    showDetail(id) {
        const leads = LeadsStorage.getAll();
        const lead = leads.find(l => l.id === id);
        if (!lead) return;
        this.detailLeadId = id;

        const statusMap = { new: '新建', allocated: '已分配', following: '跟进中', qualified: '有效', converted: '已成交', invalid: '无效', lost: '已流失', pending_reclaim: '待回收' };
        const intentMap = { A: 'A-高意向', B: 'B-有意向', C: 'C-一般', D: 'D-低意向' };
        const records = (lead.follow_records || []).sort((a, b) => new Date(b.date) - new Date(a.date));

        document.getElementById('detail-content').innerHTML = `
            <div class="detail-header">
                <div><h3>${escapeHtml(lead.name)}</h3><div class="detail-badges"><span class="intent-badge intent-${(lead.intent_level || 'C').toLowerCase()}">${intentMap[lead.intent_level] || 'C'}</span><span class="score-badge score-${lead.score >= 80 ? 'high' : lead.score >= 60 ? 'mid' : 'low'}">${lead.score}分</span><span class="priority-badge priority-${lead.priority}">${lead.priority === 'high' ? '高优' : lead.priority === 'medium' ? '中' : '低'}</span></div></div>
                <button class="close-panel">&times;</button>
            </div>
            <div class="detail-section">
                <h4><i class="fa-solid fa-user"></i> 基本信息</h4>
                <div class="detail-fields-grid">
                    <div><span class="detail-field-label">电话</span><span class="detail-field-value">${escapeHtml(lead.phone) || '-'} ${lead.phone ? '<i class="fa-solid fa-phone action-icon" title="一键拨号"></i>' : ''}</span></div>
                    <div><span class="detail-field-label">微信</span><span class="detail-field-value">${escapeHtml(lead.wechat) || '-'}</span></div>
                    <div><span class="detail-field-label">来源</span><span class="detail-field-value"><span class="source-tag">${escapeHtml(lead.source_platform || lead.source) || '-'}</span></span></div>
                    <div><span class="detail-field-label">负责人</span><span class="detail-field-value">${escapeHtml(lead.assigned_to) || '未分配'}</span></div>
                    <div><span class="detail-field-label">下次联系</span><span class="detail-field-value">${lead.next_contact_date || '-'}</span></div>
                    <div><span class="detail-field-label">创建时间</span><span class="detail-field-value">${lead.created_at ? new Date(lead.created_at).toLocaleString('zh-CN') : '-'}</span></div>
                </div>
                ${lead.tags && lead.tags.length > 0 ? `<div class="detail-tags">${lead.tags.map(t => `<span class="tag-chip">${escapeHtml(t)}</span>`).join('')}</div>` : ''}
            </div>
            <div class="detail-section">
                <h4><i class="fa-solid fa-building"></i> 企业信息</h4>
                <div class="detail-fields-grid">
                    <div><span class="detail-field-label">公司</span><span class="detail-field-value">${escapeHtml(lead.company) || '-'}</span></div>
                    <div><span class="detail-field-label">职位</span><span class="detail-field-value">${escapeHtml(lead.position) || '-'}</span></div>
                    <div><span class="detail-field-label">行业</span><span class="detail-field-value">${escapeHtml(lead.industry) || '-'}</span></div>
                    <div><span class="detail-field-label">地区</span><span class="detail-field-value">${escapeHtml(lead.region) || '-'}</span></div>
                    ${lead.company_info && lead.company_info.legalPerson ? `<div><span class="detail-field-label">法定代表人</span><span class="detail-field-value">${escapeHtml(lead.company_info.legalPerson)}</span></div>` : ''}
                    ${lead.company_info && lead.company_info.regCapital ? `<div><span class="detail-field-label">注册资本</span><span class="detail-field-value">${escapeHtml(lead.company_info.regCapital)}</span></div>` : ''}
                    ${lead.company_info && lead.company_info.creditCode ? `<div><span class="detail-field-label">信用代码</span><span class="detail-field-value">${escapeHtml(lead.company_info.creditCode)}</span></div>` : ''}
                </div>
            </div>
            <div class="detail-section">
                <h4><i class="fa-solid fa-arrows-spin"></i> 状态管理</h4>
                <div class="detail-status-row">
                    <select id="detail-status-select" class="filter-select">
                        ${Object.entries(statusMap).map(([k, v]) => `<option value="${k}" ${lead.status === k ? 'selected' : ''}>${v}</option>`).join('')}
                    </select>
                    ${lead.is_public ? `<button class="btn-primary btn-small" data-detail-action="claim">领取线索</button>` : `<button class="btn-secondary btn-small" data-detail-action="release">退回公海</button>`}
                    <button class="btn-primary btn-small" data-detail-action="reallocate"><i class="fa-solid fa-shuffle"></i> 重新分配</button>
                </div>
            </div>
            <div class="detail-section">
                <div class="detail-section-header"><h4><i class="fa-solid fa-comments"></i> 跟进记录 (${records.length})</h4><button class="btn-primary btn-small" data-detail-action="follow">+ 添加跟进</button></div>
                ${records.length > 0 ? `<div class="follow-timeline">${records.map(r => `<div class="follow-item"><div class="follow-dot"></div><div class="follow-body"><span class="follow-date">${new Date(r.date).toLocaleString('zh-CN')}</span><span class="follow-operator">${escapeHtml(r.operator || '')}</span><p class="follow-content">${escapeHtml(r.content)}</p></div></div>`).join('')}</div>` : '<p class="empty-hint">暂无跟进记录</p>'}
            </div>
            <div class="detail-section detail-actions-section">
                <button class="btn-danger" data-detail-action="delete" style="width:100%;"><i class="fa-solid fa-trash"></i> 删除线索</button>
            </div>
        `;

        // 状态变更事件
        const statusSelect = document.getElementById('detail-status-select');
        if (statusSelect) statusSelect.addEventListener('change', () => this.updateStatus(id, statusSelect.value));

        document.getElementById('lead-detail-panel').classList.add('open');
    },

    hideDetail() {
        document.getElementById('lead-detail-panel').classList.remove('open');
        this.detailLeadId = null;
    },

    handleDetailAction(action) {
        if (!this.detailLeadId) return;
        if (action === 'claim') this.claimLead(this.detailLeadId);
        else if (action === 'release') this.releaseLead(this.detailLeadId);
        else if (action === 'follow') this.openFollowModal(this.detailLeadId);
        else if (action === 'delete') this.deleteLead(this.detailLeadId);
        else if (action === 'reallocate') this.reallocateLead(this.detailLeadId);
    },

    // ===== 操作方法 =====
    claimLead(id) {
        LeadsStorage.update(id, { is_public: false, owner: LeadsStorage.getCurrentOwner(), assigned_to: LeadsStorage.getCurrentOwner(), status: 'allocated' });
        LeadsStorage.addAuditLog({ action: '领取线索', target: id, detail: '' });
        this.renderTableRows();
        if (this.detailLeadId === id) this.showDetail(id);
        showToast('线索已领取', 'success');
    },

    releaseLead(id) {
        if (!confirm('确定退回公海？')) return;
        LeadsStorage.update(id, { is_public: true, owner: '', assigned_to: '', status: 'pending_reclaim' });
        LeadsStorage.addAuditLog({ action: '退回公海', target: id, detail: '' });
        this.renderTableRows();
        if (this.detailLeadId === id) this.hideDetail();
        showToast('已退回公海', 'info');
    },

    reallocateLead(id) {
        const leads = LeadsStorage.getAll();
        const lead = leads.find(l => l.id === id);
        if (!lead) return;
        const newAssignee = AllocationEngine.allocate(lead);
        LeadsStorage.update(id, { assigned_to: newAssignee, assigned_at: new Date().toISOString(), status: 'allocated' });
        LeadsStorage.addAuditLog({ action: '重新分配', target: lead.name, detail: `→ ${newAssignee}` });
        this.showDetail(id);
        showToast(`已重新分配给 ${newAssignee}`, 'success');
    },

    updateStatus(id, status) {
        LeadsStorage.update(id, { status });
        this.renderTableRows();
        showToast('状态已更新', 'success');
    },

    deleteLead(id) {
        if (!confirm('确定删除该线索？此操作不可恢复。')) return;
        LeadsStorage.delete(id);
        this.hideDetail();
        this.renderTabContent();
        setTimeout(() => { this.renderTableRows(); this.bindListEvents(); }, 50);
        showToast('线索已删除', 'info');
    }
};
