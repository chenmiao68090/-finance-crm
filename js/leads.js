// 线索管理模块 - Phase 1 MVP
// 浙杭企服 CRM 线索管理（公海/私海）

// ===== 工具函数兜底定义 =====
if (typeof window.escapeHtml !== 'function') {
    window.escapeHtml = function(str) {
        if (!str) return '';
        return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
    };
}
function escapeHtml(str) {
    return window.escapeHtml ? window.escapeHtml(str) : (str ? String(str).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;') : '');
}

if (typeof window.showToast !== 'function') {
    window.showToast = function(message, type) {
        type = type || 'info';
        const toast = document.createElement('div');
        toast.className = 'toast toast-' + type;
        toast.textContent = message;
        document.body.appendChild(toast);
        setTimeout(() => toast.classList.add('show'), 10);
        setTimeout(() => { toast.classList.remove('show'); setTimeout(() => toast.remove(), 300); }, 3000);
    };
}
function showToast(msg, type) { window.showToast(msg, type); }

// ===== 生成唯一ID =====
function generateId(prefix) {
    return (prefix || '') + Date.now().toString(36) + Math.random().toString(36).substr(2, 8);
}

// ===== 当前用户（模拟） =====
function getCurrentUser() {
    try {
        const u = JSON.parse(localStorage.getItem('current_user') || '{}');
        return u.name || u.username || '当前用户';
    } catch(e) { return '当前用户'; }
}

// ===== 数据层 =====
const KEYS = {
    POOLS: 'crm_lead_pools',
    LEADS: 'crm_leads',
    FOLLOW_UPS: 'crm_follow_ups',
    ASSIGNMENTS: 'crm_lead_assignments',
    AUTO_ASSIGN_RULES: 'crm_auto_assign_rules',
    AUTO_RECYCLE_RULES: 'crm_auto_recycle_rules',
    HOLDING_LIMITS: 'crm_holding_limits',
    PICKUP_LIMITS: 'crm_pickup_limits',
    APPROVAL_RECORDS: 'crm_lead_approvals',
    RETURN_REASONS_CONFIG: 'crm_return_reasons_config',
    ROUND_ROBIN_CURSOR: 'crm_round_robin_cursor',
    CUSTOMERS: 'crm_customers',
    OPPORTUNITIES: 'crm_opportunities',
    NOTIFICATIONS: 'crm_notifications',
    CUSTOM_FIELD_CONFIG: 'crm_lead_custom_fields',
    COLUMN_CONFIG: 'crm_lead_column_config',
    API_CONFIG: 'crm_lead_api_config'
};

// ===== Phase 4 自定义字段存储 =====
const CustomFieldStorage = {
    getAll() {
        return JSON.parse(localStorage.getItem(KEYS.CUSTOM_FIELD_CONFIG) || '[]')
            .filter(f => !f.deleted)
            .sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0));
    },
    getById(id) { return this.getAll().find(f => f.field_id === id) || null; },
    getByPool(poolId) {
        // 返回该池专属 + 全局字段
        return this.getAll().filter(f => f.enabled && (f.pool_id === poolId || f.pool_id === 'global'));
    },
    add(field) {
        const all = JSON.parse(localStorage.getItem(KEYS.CUSTOM_FIELD_CONFIG) || '[]');
        all.push(field);
        localStorage.setItem(KEYS.CUSTOM_FIELD_CONFIG, JSON.stringify(all));
    },
    update(field) {
        const all = JSON.parse(localStorage.getItem(KEYS.CUSTOM_FIELD_CONFIG) || '[]');
        const idx = all.findIndex(f => f.field_id === field.field_id);
        if (idx !== -1) all[idx] = { ...all[idx], ...field };
        localStorage.setItem(KEYS.CUSTOM_FIELD_CONFIG, JSON.stringify(all));
    },
    delete(id) {
        const all = JSON.parse(localStorage.getItem(KEYS.CUSTOM_FIELD_CONFIG) || '[]');
        const idx = all.findIndex(f => f.field_id === id);
        if (idx !== -1) all[idx].deleted = true;
        localStorage.setItem(KEYS.CUSTOM_FIELD_CONFIG, JSON.stringify(all));
    }
};

// ===== Phase 4 列配置存储 =====
const ColumnConfigStorage = {
    getAll() { return JSON.parse(localStorage.getItem(KEYS.COLUMN_CONFIG) || '{}'); },
    get(viewType) {
        const all = this.getAll();
        return all[viewType] || null;
    },
    set(viewType, columns) {
        const all = this.getAll();
        all[viewType] = columns;
        localStorage.setItem(KEYS.COLUMN_CONFIG, JSON.stringify(all));
    }
};

// ===== Phase 4 API配置存储 =====
const ApiConfigStorage = {
    get() {
        return JSON.parse(localStorage.getItem(KEYS.API_CONFIG) || '{}');
    },
    save(config) {
        localStorage.setItem(KEYS.API_CONFIG, JSON.stringify(config));
    }
};

// ===== Phase 4 列元数据 =====
const ALL_COLUMNS = [
    { key: 'lead_name', label: '线索名称', fixed: true },
    { key: 'contact_name', label: '联系人' },
    { key: 'contact_phone', label: '电话' },
    { key: 'contact_email', label: '邮箱' },
    { key: 'lead_source', label: '来源' },
    { key: 'industry', label: '行业' },
    { key: 'status', label: '状态' },
    { key: 'priority', label: '优先级' },
    { key: 'owner_id', label: '负责人' },
    { key: 'ai_score', label: 'AI评分' },
    { key: 'estimated_amount', label: '预估金额' },
    { key: 'create_time', label: '创建时间' },
    { key: 'update_time', label: '更新时间' }
];
const DEFAULT_POOL_COLUMNS = ['lead_name', 'contact_name', 'contact_phone', 'lead_source', 'priority', 'status'];
const DEFAULT_MY_COLUMNS = ['lead_name', 'contact_name', 'contact_phone', 'lead_source', 'status', 'priority', 'ai_score', 'create_time'];

const PoolStorage = {
    getAll() {
        const data = JSON.parse(localStorage.getItem(KEYS.POOLS) || '[]');
        return data.filter(p => !p.deleted);
    },
    getById(id) {
        return this.getAll().find(p => p.pool_id === id) || null;
    },
    add(pool) {
        const all = JSON.parse(localStorage.getItem(KEYS.POOLS) || '[]');
        all.push(pool);
        localStorage.setItem(KEYS.POOLS, JSON.stringify(all));
    },
    update(pool) {
        const all = JSON.parse(localStorage.getItem(KEYS.POOLS) || '[]');
        const idx = all.findIndex(p => p.pool_id === pool.pool_id);
        if (idx !== -1) { all[idx] = { ...all[idx], ...pool }; }
        localStorage.setItem(KEYS.POOLS, JSON.stringify(all));
    },
    delete(id) {
        const all = JSON.parse(localStorage.getItem(KEYS.POOLS) || '[]');
        const idx = all.findIndex(p => p.pool_id === id);
        if (idx !== -1) { all[idx].deleted = true; }
        localStorage.setItem(KEYS.POOLS, JSON.stringify(all));
    }
};

const LeadStorage = {
    getAll() {
        const data = JSON.parse(localStorage.getItem(KEYS.LEADS) || '[]');
        return data.filter(l => !l.deleted);
    },
    getByPool(poolId) {
        return this.getAll().filter(l => l.pool_id === poolId);
    },
    getMyLeads(userId) {
        userId = userId || getCurrentUser();
        return this.getAll().filter(l => l.owner_id === userId);
    },
    getById(id) {
        return this.getAll().find(l => l.lead_id === id) || null;
    },
    add(lead) {
        const all = JSON.parse(localStorage.getItem(KEYS.LEADS) || '[]');
        all.push(lead);
        localStorage.setItem(KEYS.LEADS, JSON.stringify(all));
    },
    update(lead) {
        const all = JSON.parse(localStorage.getItem(KEYS.LEADS) || '[]');
        const idx = all.findIndex(l => l.lead_id === lead.lead_id);
        if (idx !== -1) { all[idx] = { ...all[idx], ...lead }; }
        localStorage.setItem(KEYS.LEADS, JSON.stringify(all));
    },
    delete(id) {
        const all = JSON.parse(localStorage.getItem(KEYS.LEADS) || '[]');
        const idx = all.findIndex(l => l.lead_id === id);
        if (idx !== -1) { all[idx].deleted = true; }
        localStorage.setItem(KEYS.LEADS, JSON.stringify(all));
    },
    bulkInsert(leads) {
        const all = JSON.parse(localStorage.getItem(KEYS.LEADS) || '[]');
        all.push(...leads);
        localStorage.setItem(KEYS.LEADS, JSON.stringify(all));
    },
    checkDuplicate(phone) {
        if (!phone) return null;
        return this.getAll().find(l => l.contact_phone === phone) || null;
    }
};

const FollowUpStorage = {
    getAll() {
        return JSON.parse(localStorage.getItem(KEYS.FOLLOW_UPS) || '[]');
    },
    getByLeadId(leadId) {
        return this.getAll().filter(f => f.biz_id === leadId).sort((a, b) => new Date(b.create_time) - new Date(a.create_time));
    },
    add(record) {
        const all = this.getAll();
        all.push(record);
        localStorage.setItem(KEYS.FOLLOW_UPS, JSON.stringify(all));
    }
};

const AssignmentStorage = {
    getAll() {
        return JSON.parse(localStorage.getItem(KEYS.ASSIGNMENTS) || '[]');
    },
    add(record) {
        const all = this.getAll();
        all.push(record);
        localStorage.setItem(KEYS.ASSIGNMENTS, JSON.stringify(all));
    },
    getTodayByUser(userId) {
        const today = new Date().toISOString().substring(0, 10);
        return this.getAll().filter(a => a.to_user === userId && (a.assign_type === 'self_pickup' || a.assign_type === 'apply_approve') && (a.create_time || '').substring(0, 10) === today);
    },
    getThisWeekByUser(userId) {
        const now = new Date();
        const day = now.getDay() || 7;
        const monday = new Date(now);
        monday.setDate(now.getDate() - day + 1);
        monday.setHours(0, 0, 0, 0);
        return this.getAll().filter(a => a.to_user === userId && (a.assign_type === 'self_pickup' || a.assign_type === 'apply_approve') && new Date(a.create_time) >= monday);
    }
};

const AutoAssignRuleStorage = {
    getAll() { return JSON.parse(localStorage.getItem(KEYS.AUTO_ASSIGN_RULES) || '[]'); },
    getEnabled() { return this.getAll().filter(r => r.enabled); },
    getByPool(poolId) { return this.getAll().find(r => r.pool_id === poolId) || null; },
    upsertByPool(poolId, data) {
        const all = this.getAll();
        const idx = all.findIndex(r => r.pool_id === poolId);
        if (idx !== -1) {
            all[idx] = { ...all[idx], ...data };
        } else {
            all.push({ rule_id: generateId('arule_'), pool_id: poolId, create_time: new Date().toISOString(), config: { members_weight: {}, region_map: {} }, ...data });
        }
        localStorage.setItem(KEYS.AUTO_ASSIGN_RULES, JSON.stringify(all));
    }
};

const AutoRecycleRuleStorage = {
    getAll() { return JSON.parse(localStorage.getItem(KEYS.AUTO_RECYCLE_RULES) || '[]'); },
    getEnabled() { return this.getAll().filter(r => r.enabled); },
    getByPool(poolId) { return this.getAll().find(r => r.pool_id === poolId) || null; },
    upsertByPool(poolId, data) {
        const all = this.getAll();
        const idx = all.findIndex(r => r.pool_id === poolId);
        if (idx !== -1) {
            all[idx] = { ...all[idx], ...data };
        } else {
            all.push({ rule_id: generateId('rrule_'), pool_id: poolId, create_time: new Date().toISOString(), ...data });
        }
        localStorage.setItem(KEYS.AUTO_RECYCLE_RULES, JSON.stringify(all));
    }
};

const HoldingLimitStorage = {
    getAll() { return JSON.parse(localStorage.getItem(KEYS.HOLDING_LIMITS) || '[]'); },
    getByPool(poolId) {
        const all = this.getAll();
        return all.find(c => c.pool_id === poolId) || all.find(c => c.pool_id === 'global') || null;
    },
    upsertByPool(poolId, data) {
        const all = this.getAll();
        const idx = all.findIndex(c => c.pool_id === poolId);
        if (idx !== -1) {
            all[idx] = { ...all[idx], ...data };
        } else {
            all.push({ config_id: generateId('hlim_'), pool_id: poolId, ...data });
        }
        localStorage.setItem(KEYS.HOLDING_LIMITS, JSON.stringify(all));
    }
};

const PickupLimitStorage = {
    getAll() { return JSON.parse(localStorage.getItem(KEYS.PICKUP_LIMITS) || '[]'); },
    getByPool(poolId) {
        const all = this.getAll();
        return all.find(c => c.pool_id === poolId) || all.find(c => c.pool_id === 'global') || null;
    },
    upsertByPool(poolId, data) {
        const all = this.getAll();
        const idx = all.findIndex(c => c.pool_id === poolId);
        if (idx !== -1) {
            all[idx] = { ...all[idx], ...data };
        } else {
            all.push({ config_id: generateId('plim_'), pool_id: poolId, ...data });
        }
        localStorage.setItem(KEYS.PICKUP_LIMITS, JSON.stringify(all));
    }
};

const ApprovalStorage = {
    getAll() { return JSON.parse(localStorage.getItem(KEYS.APPROVAL_RECORDS) || '[]'); },
    getPending() { return this.getAll().filter(a => a.status === 'pending'); },
    getById(id) { return this.getAll().find(a => a.approval_id === id) || null; },
    add(record) {
        const all = this.getAll();
        all.push(record);
        localStorage.setItem(KEYS.APPROVAL_RECORDS, JSON.stringify(all));
    },
    update(record) {
        const all = this.getAll();
        const idx = all.findIndex(a => a.approval_id === record.approval_id);
        if (idx !== -1) all[idx] = { ...all[idx], ...record };
        localStorage.setItem(KEYS.APPROVAL_RECORDS, JSON.stringify(all));
    }
};

// ===== Phase 3 客户存储 =====
const CustomerStorage = {
    getAll() {
        return JSON.parse(localStorage.getItem(KEYS.CUSTOMERS) || '[]').filter(c => !c.deleted);
    },
    getById(id) { return this.getAll().find(c => c.customer_id === id) || null; },
    getBySourceLead(leadId) { return this.getAll().find(c => c.source_lead_id === leadId) || null; },
    save(list) { localStorage.setItem(KEYS.CUSTOMERS, JSON.stringify(list)); },
    add(customer) {
        const all = JSON.parse(localStorage.getItem(KEYS.CUSTOMERS) || '[]');
        all.push(customer);
        localStorage.setItem(KEYS.CUSTOMERS, JSON.stringify(all));
    },
    update(customer) {
        const all = JSON.parse(localStorage.getItem(KEYS.CUSTOMERS) || '[]');
        const idx = all.findIndex(c => c.customer_id === customer.customer_id);
        if (idx !== -1) all[idx] = { ...all[idx], ...customer };
        localStorage.setItem(KEYS.CUSTOMERS, JSON.stringify(all));
    },
    delete(id) {
        const all = JSON.parse(localStorage.getItem(KEYS.CUSTOMERS) || '[]');
        const idx = all.findIndex(c => c.customer_id === id);
        if (idx !== -1) all[idx].deleted = true;
        localStorage.setItem(KEYS.CUSTOMERS, JSON.stringify(all));
    }
};

// ===== Phase 3 商机存储 =====
const OpportunityStorage = {
    getAll() {
        return JSON.parse(localStorage.getItem(KEYS.OPPORTUNITIES) || '[]').filter(o => !o.deleted);
    },
    getById(id) { return this.getAll().find(o => o.opportunity_id === id) || null; },
    getBySourceLead(leadId) { return this.getAll().find(o => o.source_lead_id === leadId) || null; },
    save(list) { localStorage.setItem(KEYS.OPPORTUNITIES, JSON.stringify(list)); },
    add(opp) {
        const all = JSON.parse(localStorage.getItem(KEYS.OPPORTUNITIES) || '[]');
        all.push(opp);
        localStorage.setItem(KEYS.OPPORTUNITIES, JSON.stringify(all));
    },
    update(opp) {
        const all = JSON.parse(localStorage.getItem(KEYS.OPPORTUNITIES) || '[]');
        const idx = all.findIndex(o => o.opportunity_id === opp.opportunity_id);
        if (idx !== -1) all[idx] = { ...all[idx], ...opp };
        localStorage.setItem(KEYS.OPPORTUNITIES, JSON.stringify(all));
    },
    delete(id) {
        const all = JSON.parse(localStorage.getItem(KEYS.OPPORTUNITIES) || '[]');
        const idx = all.findIndex(o => o.opportunity_id === id);
        if (idx !== -1) all[idx].deleted = true;
        localStorage.setItem(KEYS.OPPORTUNITIES, JSON.stringify(all));
    }
};

// ===== Phase 3 通知存储 =====
const NotificationStorage = {
    getAll() {
        return JSON.parse(localStorage.getItem(KEYS.NOTIFICATIONS) || '[]')
            .sort((a, b) => new Date(b.create_time) - new Date(a.create_time));
    },
    getRecent(limit) {
        return this.getAll().slice(0, limit || 20);
    },
    getUnreadCount() {
        return this.getAll().filter(n => !n.read).length;
    },
    save(list) { localStorage.setItem(KEYS.NOTIFICATIONS, JSON.stringify(list)); },
    add(record) {
        const all = JSON.parse(localStorage.getItem(KEYS.NOTIFICATIONS) || '[]');
        all.push(record);
        localStorage.setItem(KEYS.NOTIFICATIONS, JSON.stringify(all));
    },
    update(record) {
        const all = JSON.parse(localStorage.getItem(KEYS.NOTIFICATIONS) || '[]');
        const idx = all.findIndex(n => n.notify_id === record.notify_id);
        if (idx !== -1) all[idx] = { ...all[idx], ...record };
        localStorage.setItem(KEYS.NOTIFICATIONS, JSON.stringify(all));
    },
    markAsRead(id) {
        this.update({ notify_id: id, read: true });
    },
    markAllAsRead() {
        const all = JSON.parse(localStorage.getItem(KEYS.NOTIFICATIONS) || '[]');
        all.forEach(n => { n.read = true; });
        localStorage.setItem(KEYS.NOTIFICATIONS, JSON.stringify(all));
    },
    existsTodayFollowRemind(leadId) {
        const today = new Date().toISOString().substring(0, 10);
        return this.getAll().some(n => n.type === 'follow_remind' && n.lead_id === leadId && (n.create_time || '').substring(0, 10) === today);
    }
};

const ReturnReasonStorage = {
    getAll() {
        return JSON.parse(localStorage.getItem(KEYS.RETURN_REASONS_CONFIG) || '[]')
            .sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0));
    },
    getEnabled() { return this.getAll().filter(r => r.enabled); },
    getById(id) { return this.getAll().find(r => r.reason_id === id) || null; },
    add(record) {
        const all = this.getAll();
        all.push(record);
        localStorage.setItem(KEYS.RETURN_REASONS_CONFIG, JSON.stringify(all));
    },
    update(record) {
        const all = this.getAll();
        const idx = all.findIndex(r => r.reason_id === record.reason_id);
        if (idx !== -1) all[idx] = { ...all[idx], ...record };
        localStorage.setItem(KEYS.RETURN_REASONS_CONFIG, JSON.stringify(all));
    },
    delete(id) {
        const all = this.getAll().filter(r => r.reason_id !== id);
        localStorage.setItem(KEYS.RETURN_REASONS_CONFIG, JSON.stringify(all));
    }
};

// ===== 种子数据 =====
function initSeedData() {
    if (localStorage.getItem(KEYS.POOLS)) return; // 已有数据则跳过

    const now = new Date().toISOString();
    const pools = [
        { pool_id: 'pool_001', pool_name: '通用线索池', pool_code: 'GENERAL', admins: ['张经理'], members: ['王芳','李强','张伟','陈丽','赵敏'], member_can_view_detail: true, pickup_type: 'self_pickup', pickup_limit_enabled: true, pickup_notify: true, remark: '公司通用线索池，适用于所有行业', create_time: '2025-01-15T08:00:00.000Z', deleted: false },
        { pool_id: 'pool_002', pool_name: '科技行业线索池', pool_code: 'TECH', admins: ['张伟'], members: ['张伟','赵敏','刘洋'], member_can_view_detail: true, pickup_type: 'admin_assign', pickup_limit_enabled: true, pickup_notify: true, remark: '科技/互联网行业客户', create_time: '2025-02-01T08:00:00.000Z', deleted: false },
        { pool_id: 'pool_003', pool_name: '教育行业线索池', pool_code: 'EDU', admins: ['王芳'], members: ['王芳','李强','周燕'], member_can_view_detail: false, pickup_type: 'apply_approve', pickup_limit_enabled: false, pickup_notify: true, remark: '教育培训行业客户', create_time: '2025-03-10T08:00:00.000Z', deleted: false }
    ];

    const leads = [
        { lead_id: 'lead_001', lead_name: '杭州未来科技有限公司', contact_name: '张建国', contact_phone: '13800001001', contact_email: 'zhang@future-tech.cn', lead_source: '官网注册', industry: '科技', province: '浙江', city: '杭州', district: '西湖区', address: '文三路398号', demand_desc: '需要ERP系统定制开发', estimated_amount: 150000, priority: 'high', tags: ['大客户','科技'], status: 'pending', owner_id: '', pool_id: 'pool_002', create_time: '2025-04-01T09:00:00.000Z', update_time: '2025-04-01T09:00:00.000Z', create_by: '系统导入', deleted: false },
        { lead_id: 'lead_002', lead_name: '浙江盛达贸易有限公司', contact_name: '李明辉', contact_phone: '13800001002', contact_email: 'li@shengda.com', lead_source: '转介绍', industry: '零售业', province: '浙江', city: '杭州', district: '滨江区', address: '网商路599号', demand_desc: '进出口业务管理系统', estimated_amount: 80000, priority: 'medium', tags: ['贸易'], status: 'allocated', owner_id: '当前用户', pool_id: 'pool_001', create_time: '2025-04-02T10:00:00.000Z', update_time: '2025-04-05T14:00:00.000Z', create_by: '王芳', deleted: false },
        { lead_id: 'lead_003', lead_name: '杭州锐智教育科技有限公司', contact_name: '王丽萍', contact_phone: '13800001003', contact_email: 'wang@ruizhi.cn', lead_source: '展会活动', industry: '教育', province: '浙江', city: '杭州', district: '余杭区', address: '仓前街道文一西路1218号', demand_desc: '在线教育平台搭建', estimated_amount: 200000, priority: 'high', tags: ['教育','大客户'], status: 'following', owner_id: '当前用户', pool_id: 'pool_003', create_time: '2025-03-20T08:30:00.000Z', update_time: '2025-04-10T16:00:00.000Z', create_by: '李强', deleted: false },
        { lead_id: 'lead_004', lead_name: '浙江恒通建设工程有限公司', contact_name: '陈志强', contact_phone: '13800001004', contact_email: 'chen@hengtong.com', lead_source: '电话咨询', industry: '制造业', province: '浙江', city: '杭州', district: '拱墅区', address: '莫干山路110号', demand_desc: '项目管理信息化', estimated_amount: 300000, priority: 'high', tags: ['建筑','大客户'], status: 'pending', owner_id: '', pool_id: 'pool_001', create_time: '2025-04-05T11:00:00.000Z', update_time: '2025-04-05T11:00:00.000Z', create_by: '张经理', deleted: false },
        { lead_id: 'lead_005', lead_name: '杭州云帆网络科技', contact_name: '刘海', contact_phone: '13800001005', contact_email: 'liu@yunfan.cn', lead_source: '抖音', industry: '科技', province: '浙江', city: '杭州', district: '钱塘区', address: '白杨街道', demand_desc: '电商SaaS工具', estimated_amount: 50000, priority: 'low', tags: ['互联网'], status: 'pending', owner_id: '', pool_id: 'pool_002', create_time: '2025-04-08T14:00:00.000Z', update_time: '2025-04-08T14:00:00.000Z', create_by: '系统导入', deleted: false },
        { lead_id: 'lead_006', lead_name: '浙江绿源环保科技', contact_name: '赵国强', contact_phone: '13800001006', contact_email: 'zhao@greensource.cn', lead_source: '百度推广', industry: '制造业', province: '浙江', city: '杭州', district: '萧山区', address: '经济开发区', demand_desc: '环保数据监测平台', estimated_amount: 120000, priority: 'medium', tags: ['环保'], status: 'converted', owner_id: '张伟', pool_id: 'pool_001', create_time: '2025-02-15T09:00:00.000Z', update_time: '2025-04-12T10:00:00.000Z', create_by: '张伟', deleted: false },
        { lead_id: 'lead_007', lead_name: '杭州鼎盛餐饮管理', contact_name: '孙伟', contact_phone: '13800001007', contact_email: '', lead_source: '美团', industry: '其他', province: '浙江', city: '杭州', district: '上城区', address: '解放路56号', demand_desc: '餐饮连锁管理系统', estimated_amount: 35000, priority: 'low', tags: ['餐饮'], status: 'returned', owner_id: '', pool_id: 'pool_001', create_time: '2025-03-01T08:00:00.000Z', update_time: '2025-04-06T09:00:00.000Z', create_by: '李强', deleted: false },
        { lead_id: 'lead_008', lead_name: '浙江星辰医药科技', contact_name: '周星宇', contact_phone: '13800001008', contact_email: 'zhou@starmed.cn', lead_source: '微信', industry: '医疗', province: '浙江', city: '杭州', district: '富阳区', address: '银湖街道', demand_desc: '医药研发项目管理', estimated_amount: 250000, priority: 'high', tags: ['医药','大客户'], status: 'following', owner_id: '当前用户', pool_id: 'pool_001', create_time: '2025-03-18T10:00:00.000Z', update_time: '2025-04-11T15:00:00.000Z', create_by: '陈丽', deleted: false },
        { lead_id: 'lead_009', lead_name: '杭州创新教育集团', contact_name: '马晓燕', contact_phone: '13800001009', contact_email: 'ma@cxedu.cn', lead_source: '小红书', industry: '教育', province: '浙江', city: '杭州', district: '西湖区', address: '文二路388号', demand_desc: 'K12教育信息化', estimated_amount: 180000, priority: 'medium', tags: ['教育'], status: 'pending', owner_id: '', pool_id: 'pool_003', create_time: '2025-04-10T08:00:00.000Z', update_time: '2025-04-10T08:00:00.000Z', create_by: '王芳', deleted: false },
        { lead_id: 'lead_010', lead_name: '杭州智达信息技术', contact_name: '黄志远', contact_phone: '13800001010', contact_email: 'huang@zhida.cn', lead_source: '广告投放', industry: '科技', province: '浙江', city: '杭州', district: '滨江区', address: '江南大道588号', demand_desc: '企业数字化转型咨询', estimated_amount: 100000, priority: 'medium', tags: ['科技','数字化'], status: 'allocated', owner_id: '当前用户', pool_id: 'pool_002', create_time: '2025-04-12T09:00:00.000Z', update_time: '2025-04-12T09:00:00.000Z', create_by: '张伟', deleted: false }
    ];

    const followUps = [
        { follow_id: 'fu_001', biz_type: 'lead', biz_id: 'lead_003', follow_type: '电话', follow_content: '初次电话沟通，客户对在线教育平台有明确需求，预算充足，需要下周安排上门演示', customer_intent: 'high', next_follow_time: '2025-04-15T10:00:00.000Z', next_follow_content: '上门演示产品', create_time: '2025-04-10T16:00:00.000Z', create_by: '当前用户' },
        { follow_id: 'fu_002', biz_type: 'lead', biz_id: 'lead_003', follow_type: '上门拜访', follow_content: '上门演示了教育平台Demo，客户非常满意，要求出正式报价方案', customer_intent: 'high', next_follow_time: '2025-04-18T14:00:00.000Z', next_follow_content: '发送报价方案', create_time: '2025-04-15T11:30:00.000Z', create_by: '当前用户' },
        { follow_id: 'fu_003', biz_type: 'lead', biz_id: 'lead_008', follow_type: '微信', follow_content: '通过微信发送了医药项目管理解决方案白皮书，客户表示会在内部讨论', customer_intent: 'medium', next_follow_time: '2025-04-14T09:00:00.000Z', next_follow_content: '电话跟进讨论结果', create_time: '2025-04-11T15:00:00.000Z', create_by: '当前用户' },
        { follow_id: 'fu_004', biz_type: 'lead', biz_id: 'lead_008', follow_type: '电话', follow_content: '电话确认客户已在内部评审我们的方案，竞争对手有2家，需要突出研发管理特色', customer_intent: 'medium', next_follow_time: '2025-04-20T10:00:00.000Z', next_follow_content: '准备定制化演示', create_time: '2025-04-14T09:30:00.000Z', create_by: '当前用户' },
        { follow_id: 'fu_005', biz_type: 'lead', biz_id: 'lead_002', follow_type: '邮件', follow_content: '发送了进出口业务管理系统的功能清单和报价', customer_intent: 'low', next_follow_time: '2025-04-20T09:00:00.000Z', next_follow_content: '跟进客户反馈', create_time: '2025-04-05T14:00:00.000Z', create_by: '当前用户' }
    ];

    localStorage.setItem(KEYS.POOLS, JSON.stringify(pools));
    localStorage.setItem(KEYS.LEADS, JSON.stringify(leads));
    localStorage.setItem(KEYS.FOLLOW_UPS, JSON.stringify(followUps));
    localStorage.setItem(KEYS.ASSIGNMENTS, JSON.stringify([]));

    initPhase2SeedData();
}

// ===== Phase 2 种子数据（独立 guard，可单独初始化） =====
function initPhase2SeedData() {
    if (!localStorage.getItem(KEYS.AUTO_ASSIGN_RULES)) {
        localStorage.setItem(KEYS.AUTO_ASSIGN_RULES, JSON.stringify([
            { rule_id: 'arule_001', pool_id: 'pool_001', rule_type: 'round_robin', enabled: false, config: { members_weight: { '王芳': 3, '李强': 2, '张伟': 1 }, region_map: { '王芳': '杭州', '李强': '宁波', '张伟': '温州' } }, create_time: '2025-04-01T08:00:00.000Z' },
            { rule_id: 'arule_002', pool_id: 'pool_002', rule_type: 'weight', enabled: false, config: { members_weight: { '张伟': 2, '赵敏': 1, '刘洋': 1 }, region_map: {} }, create_time: '2025-04-01T08:00:00.000Z' }
        ]));
    }
    if (!localStorage.getItem(KEYS.AUTO_RECYCLE_RULES)) {
        localStorage.setItem(KEYS.AUTO_RECYCLE_RULES, JSON.stringify([
            { rule_id: 'rrule_001', pool_id: 'pool_001', days_no_follow: 7, enabled: false, notify_before_days: 1, create_time: '2025-04-01T08:00:00.000Z' },
            { rule_id: 'rrule_002', pool_id: 'pool_002', days_no_follow: 14, enabled: false, notify_before_days: 2, create_time: '2025-04-01T08:00:00.000Z' }
        ]));
    }
    if (!localStorage.getItem(KEYS.HOLDING_LIMITS)) {
        localStorage.setItem(KEYS.HOLDING_LIMITS, JSON.stringify([
            { config_id: 'hlim_global', pool_id: 'global', max_count: 50, enabled: true },
            { config_id: 'hlim_001', pool_id: 'pool_001', max_count: 30, enabled: true }
        ]));
    }
    if (!localStorage.getItem(KEYS.PICKUP_LIMITS)) {
        localStorage.setItem(KEYS.PICKUP_LIMITS, JSON.stringify([
            { config_id: 'plim_global', pool_id: 'global', daily_limit: 5, weekly_limit: 20, enabled: true }
        ]));
    }
    if (!localStorage.getItem(KEYS.APPROVAL_RECORDS)) {
        localStorage.setItem(KEYS.APPROVAL_RECORDS, JSON.stringify([
            { approval_id: 'appr_001', lead_id: 'lead_009', pool_id: 'pool_003', applicant: '李强', approver: '王芳', status: 'pending', remark: '我熟悉教育行业客户，请求分配此线索跟进', create_time: '2025-04-12T10:00:00.000Z', process_time: '' }
        ]));
    }
    if (!localStorage.getItem(KEYS.RETURN_REASONS_CONFIG)) {
        localStorage.setItem(KEYS.RETURN_REASONS_CONFIG, JSON.stringify([
            { reason_id: 'rsn_001', reason_text: '联系不上', sort_order: 1, enabled: true, create_time: '2025-01-01T00:00:00.000Z' },
            { reason_id: 'rsn_002', reason_text: '暂无需求', sort_order: 2, enabled: true, create_time: '2025-01-01T00:00:00.000Z' },
            { reason_id: 'rsn_003', reason_text: '需求不匹配', sort_order: 3, enabled: true, create_time: '2025-01-01T00:00:00.000Z' },
            { reason_id: 'rsn_004', reason_text: '竞争对手已签约', sort_order: 4, enabled: true, create_time: '2025-01-01T00:00:00.000Z' },
            { reason_id: 'rsn_005', reason_text: '信息有误', sort_order: 5, enabled: true, create_time: '2025-01-01T00:00:00.000Z' }
        ]));
    }
    initPhase4SeedData();
}

// ===== Phase 4 种子数据 =====
function initPhase4SeedData() {
    if (!localStorage.getItem(KEYS.CUSTOM_FIELD_CONFIG)) {
        localStorage.setItem(KEYS.CUSTOM_FIELD_CONFIG, JSON.stringify([
            {
                field_id: 'cf_001', pool_id: 'global', field_name: '合作模式', field_type: 'select',
                field_config: { options: [{ label: '项目制', color: 0 }, { label: '年费制', color: 1 }, { label: '产品销售', color: 2 }, { label: '定制开发', color: 3 }], required: false, placeholder: '请选择合作模式' },
                sort_order: 1, enabled: true, create_time: '2025-04-01T00:00:00.000Z'
            },
            {
                field_id: 'cf_002', pool_id: 'global', field_name: '客户等级', field_type: 'select',
                field_config: { options: [{ label: 'S级-战略', color: 0 }, { label: 'A级-重点', color: 1 }, { label: 'B级-一般', color: 2 }, { label: 'C级-观察', color: 3 }], required: false, placeholder: '' },
                sort_order: 2, enabled: true, create_time: '2025-04-01T00:00:00.000Z'
            },
            {
                field_id: 'cf_003', pool_id: 'pool_002', field_name: '预算周期', field_type: 'date',
                field_config: { options: [], required: false, placeholder: '' },
                sort_order: 3, enabled: true, create_time: '2025-04-01T00:00:00.000Z'
            }
        ]));
    }
    if (!localStorage.getItem(KEYS.API_CONFIG)) {
        localStorage.setItem(KEYS.API_CONFIG, JSON.stringify({
            webhook_url: '',
            events: { create: false, assign: false, convert: false, return: false }
        }));
    }
}

// ===== 常量 =====
const LEAD_SOURCES = ['电话咨询','官网注册','展会活动','转介绍','广告投放','抖音','微信','美团','百度推广','小红书','批量导入','其他'];
const LEAD_INDUSTRIES = ['制造业','零售业','金融业','教育','医疗','科技','其他'];
const FOLLOW_TYPES = ['电话','微信','邮件','上门拜访','短信','其他','拜访签到'];
const RETURN_REASONS = ['联系不上','暂无需求','需求不匹配','竞争对手已签约','信息有误','其他'];
const STATUS_MAP = { pending: '待分配', allocated: '待跟进', following: '跟进中', converted: '已转化', returned: '已退回', closed: '已关闭' };
const STATUS_COLORS = { pending: '#f59e0b', allocated: '#3b82f6', following: '#8b5cf6', converted: '#10b981', returned: '#ef4444', closed: '#6b7280' };
const PRIORITY_MAP = { high: '高', medium: '中', low: '低' };
const PRIORITY_COLORS = { high: '#ef4444', medium: '#f59e0b', low: '#6b7280' };
const PICKUP_LIMIT = 20;

// ===== UI 控制器 =====
const LeadsUI = {
    container: null,
    currentView: 'pools', // pools | pool_leads | my_leads | detail | rules
    currentTab: 'public', // public | private | rules | analytics
    currentPoolId: null,
    selectedLeadIds: [],
    selectedMyLeadIds: [],
    eventHandlers: [],
    autoRuleTimer: null,
    analyticsCharts: [],
    poolSortField: '',
    mySortField: '',
    mySortDir: 'desc',

    init() {
        initSeedData();
        initPhase2SeedData();
        initPhase4SeedData();
        // 为种子线索补上 AI 评分
        try { this.initialScoringForSeeds(); } catch (e) { console.error('[Leads] initialScoring error', e); }
        this.container = document.querySelector('.content-area');
        // hash 路由检测：扫码填写路径
        const hash = location.hash || '';
        if (hash.indexOf('lead-form') !== -1) {
            const m = hash.match(/pool_id=([^&]+)/);
            const poolId = m ? decodeURIComponent(m[1]) : '';
            if (poolId) {
                // 重置 hash 避免刷新重复触发
                try { history.replaceState(null, '', location.pathname + location.search); } catch (e) {}
                this.currentTab = 'public';
                this.currentView = 'pools';
                this.render();
                setTimeout(() => this.showLeadFormByQR(poolId), 50);
                this.autoRuleTimer = setInterval(() => {
                    try { this.checkAutoRules(); } catch (err) { console.error('[Leads] checkAutoRules error', err); }
                }, 60000);
                return;
            }
        }
        this.currentView = 'pools';
        this.currentTab = 'public';
        this.currentPoolId = null;
        this.selectedLeadIds = [];
        this.selectedMyLeadIds = [];
        this.render();
        // 规则引擎：首次运行 + 定时轮询
        try { this.checkAutoRules(); } catch (err) { console.error('[Leads] checkAutoRules error', err); }
        this.autoRuleTimer = setInterval(() => {
            try { this.checkAutoRules(); } catch (err) { console.error('[Leads] checkAutoRules error', err); }
        }, 60000);
    },

    destroy() {
        this.eventHandlers.forEach(h => {
            if (h.el && h.fn) h.el.removeEventListener(h.evt, h.fn);
        });
        this.eventHandlers = [];
        if (this.autoRuleTimer) {
            clearInterval(this.autoRuleTimer);
            this.autoRuleTimer = null;
        }
        this.destroyCharts();
        // 移除可能存在的模态框
        document.querySelectorAll('.leads-modal-overlay').forEach(m => m.remove());
    },

    destroyCharts() {
        if (this.analyticsCharts && this.analyticsCharts.length) {
            this.analyticsCharts.forEach(c => { try { c.destroy(); } catch (e) {} });
        }
        this.analyticsCharts = [];
    },

    addEvent(el, evt, fn) {
        el.addEventListener(evt, fn);
        this.eventHandlers.push({ el, evt, fn });
    },

    render() {
        if (!this.container) return;
        // 离开 analytics 需销毁图表
        if (this.currentTab !== 'analytics') {
            this.destroyCharts();
        }
        let html = '<div class="leads-module">';
        html += this.renderTabs();
        if (this.currentTab === 'public') {
            if (this.currentView === 'pools') {
                html += this.renderPoolsView();
            } else if (this.currentView === 'pool_leads') {
                html += this.renderPoolLeadsView();
            } else {
                this.currentView = 'pools';
                html += this.renderPoolsView();
            }
        } else if (this.currentTab === 'private') {
            if (this.currentView === 'detail') {
                html += this.renderDetailView();
            } else {
                html += this.renderMyLeadsView();
            }
        } else if (this.currentTab === 'rules') {
            html += this.renderRulesView();
        } else if (this.currentTab === 'analytics') {
            html += this.renderAnalyticsView();
        }
        html += '</div>';
        this.container.innerHTML = html;
        this.bindEvents();
        if (this.currentTab === 'analytics') {
            // 下一轮事件循环创建图表，确保DOM已就位
            requestAnimationFrame(() => this.renderAnalyticsCharts());
        }
    },

    // ===== Tab 渲染 =====
    renderTabs() {
        const pendingApprovalCount = ApprovalStorage.getPending().length;
        const badge = pendingApprovalCount > 0 ? `<span class="tab-badge">${pendingApprovalCount}</span>` : '';
        const unread = NotificationStorage.getUnreadCount();
        const unreadBadge = unread > 0 ? `<span class="notification-badge" style="position:absolute;top:-4px;right:-4px;background:#ef4444;color:#fff;font-size:10px;min-width:16px;height:16px;border-radius:8px;padding:0 4px;display:inline-flex;align-items:center;justify-content:center;line-height:1;">${unread > 99 ? '99+' : unread}</span>` : '';
        return `
        <div class="leads-main-tabs" style="display:flex;align-items:center;">
            <button class="leads-main-tab ${this.currentTab === 'public' ? 'active' : ''}" data-tab="public">
                <i class="fa-solid fa-water"></i> 线索池（公海）
            </button>
            <button class="leads-main-tab ${this.currentTab === 'private' ? 'active' : ''}" data-tab="private">
                <i class="fa-solid fa-user-lock"></i> 我的线索（私海）
            </button>
            <button class="leads-main-tab ${this.currentTab === 'rules' ? 'active' : ''}" data-tab="rules">
                <i class="fa-solid fa-sliders"></i> 规则设置${badge}
            </button>
            <button class="leads-main-tab ${this.currentTab === 'analytics' ? 'active' : ''}" data-tab="analytics">
                <i class="fa-solid fa-chart-line"></i> 数据分析
            </button>
            <div class="notification-bell" id="btnNotification" title="通知" style="margin-left:auto;">
                <i class="fa-solid fa-bell"></i>${unreadBadge}
            </div>
        </div>`;
    },

    renderNotificationPanel() {
        const notifs = NotificationStorage.getRecent(20);
        const iconMap = {
            follow_remind: 'fa-clock',
            convert: 'fa-handshake',
            assign: 'fa-share',
            recycle: 'fa-recycle'
        };
        const colorMap = {
            follow_remind: '#f59e0b',
            convert: '#10b981',
            assign: '#3b82f6',
            recycle: '#ef4444'
        };
        let items = '';
        if (notifs.length === 0) {
            items = '<div style="padding:32px 16px;text-align:center;color:#94a3b8;font-size:13px;"><i class="fa-solid fa-bell-slash" style="font-size:28px;display:block;margin-bottom:8px;"></i>暂无通知</div>';
        } else {
            notifs.forEach(n => {
                const icon = iconMap[n.type] || 'fa-bell';
                const color = colorMap[n.type] || '#d4af37';
                items += `
                <div class="notification-item" data-notify-id="${n.notify_id}" data-lead-id="${escapeHtml(n.lead_id || '')}" style="display:flex;gap:10px;padding:12px 14px;border-bottom:1px solid rgba(212,175,55,0.08);cursor:pointer;${!n.read ? 'background:rgba(212,175,55,0.04);' : ''}">
                    <div style="width:32px;height:32px;border-radius:50%;background:${color}20;color:${color};display:flex;align-items:center;justify-content:center;flex-shrink:0;"><i class="fa-solid ${icon}"></i></div>
                    <div style="flex:1;min-width:0;">
                        <div style="color:#f1f5f9;font-size:13px;${!n.read ? 'font-weight:600;' : ''}margin-bottom:2px;">${escapeHtml(n.title)}</div>
                        <div style="color:#94a3b8;font-size:12px;line-height:1.5;">${escapeHtml(n.content)}</div>
                        <div style="color:#64748b;font-size:11px;margin-top:4px;">${new Date(n.create_time).toLocaleString('zh-CN')}</div>
                    </div>
                    ${!n.read ? '<div style="width:8px;height:8px;border-radius:50%;background:#ef4444;flex-shrink:0;margin-top:6px;"></div>' : ''}
                </div>`;
            });
        }
        return `
        <div class="leads-notification-panel" id="notificationPanel" style="position:absolute;top:48px;right:0;width:380px;max-height:480px;background:linear-gradient(135deg,#1a1a1a,#222);border:1px solid rgba(212,175,55,0.3);border-radius:12px;box-shadow:0 12px 32px rgba(0,0,0,0.5);z-index:1000;display:flex;flex-direction:column;overflow:hidden;">
            <div style="display:flex;justify-content:space-between;align-items:center;padding:14px 16px;border-bottom:1px solid rgba(212,175,55,0.15);">
                <h4 style="color:#d4af37;margin:0;font-size:14px;"><i class="fa-solid fa-bell"></i> 通知中心</h4>
                <button class="modal-close" id="btnCloseNotification" style="background:none;border:none;color:#94a3b8;font-size:20px;cursor:pointer;">&times;</button>
            </div>
            <div class="notification-list" style="flex:1;overflow-y:auto;">${items}</div>
            <div style="padding:10px 16px;border-top:1px solid rgba(212,175,55,0.15);text-align:right;">
                <button class="btn-sm" id="btnMarkAllRead" style="background:rgba(212,175,55,0.12);color:#d4af37;border:1px solid rgba(212,175,55,0.3);padding:6px 12px;border-radius:6px;cursor:pointer;font-size:12px;">全部标为已读</button>
            </div>
        </div>`;
    },

    // ===== 线索池视图 =====
    renderPoolsView() {
        const pools = PoolStorage.getAll();
        let html = `
        <div class="leads-module-header">
            <h2><i class="fa-solid fa-bullseye"></i> 线索池管理</h2>
            <div class="leads-header-actions">
                <div class="search-box">
                    <i class="fa-solid fa-search"></i>
                    <input type="text" id="poolSearchInput" placeholder="搜索线索池...">
                </div>
                <button class="btn-accent" id="btnCreatePool"><i class="fa-solid fa-plus"></i> 新建线索池</button>
            </div>
        </div>
        <div class="leads-pool-grid" id="poolGrid">`;
        if (pools.length === 0) {
            html += '<div class="empty-state"><i class="fa-solid fa-inbox" style="font-size:48px;color:#cbd5e1;"></i><p>暂无线索池，请新建</p></div>';
        } else {
            pools.forEach(pool => {
                const leadCount = LeadStorage.getByPool(pool.pool_id).length;
                const pendingCount = LeadStorage.getByPool(pool.pool_id).filter(l => l.status === 'pending').length;
                html += `
                <div class="pool-card" data-pool-id="${pool.pool_id}">
                    <div class="pool-card-header">
                        <h3 class="pool-card-title">${escapeHtml(pool.pool_name)}</h3>
                        <div class="pool-card-actions">
                            <button class="btn-icon btn-qr-pool" data-pool-id="${pool.pool_id}" title="生成二维码"><i class="fa-solid fa-qrcode"></i></button>
                            <button class="btn-icon btn-edit-pool" data-pool-id="${pool.pool_id}" title="编辑"><i class="fa-solid fa-pen"></i></button>
                            <button class="btn-icon btn-delete-pool" data-pool-id="${pool.pool_id}" title="删除"><i class="fa-solid fa-trash"></i></button>
                        </div>
                    </div>
                    <div class="pool-card-stats">
                        <span class="pool-stat"><i class="fa-solid fa-file-lines"></i> 线索 ${leadCount}</span>
                        <span class="pool-stat pending"><i class="fa-solid fa-clock"></i> 待分配 ${pendingCount}</span>
                    </div>
                    <div class="pool-card-info">
                        <span><i class="fa-solid fa-user-shield"></i> ${escapeHtml(pool.admins.join(', '))}</span>
                        <span><i class="fa-solid fa-users"></i> ${pool.members.length}人</span>
                    </div>
                    <div class="pool-card-footer">
                        <span class="pool-code">${escapeHtml(pool.pool_code)}</span>
                        <span class="pool-time">${new Date(pool.create_time).toLocaleDateString('zh-CN')}</span>
                    </div>
                </div>`;
            });
        }
        html += '</div>';
        return html;
    },

    // ===== 池内线索列表 =====
    renderPoolLeadsView() {
        const pool = PoolStorage.getById(this.currentPoolId);
        if (!pool) { this.currentView = 'pools'; return this.renderPoolsView(); }
        const leads = LeadStorage.getByPool(this.currentPoolId);
        const pickupType = pool.pickup_type || 'self_pickup';
        const hasSelection = this.selectedLeadIds.length > 0;
        const columns = this.getColumns('pool');
        let html = `
        <div class="leads-breadcrumb">
            <a href="#" class="breadcrumb-link" data-action="backToPools"><i class="fa-solid fa-arrow-left"></i> 线索池</a>
            <span class="breadcrumb-sep">/</span>
            <span class="breadcrumb-current">${escapeHtml(pool.pool_name)}</span>
            <span class="pool-pickup-tag" style="margin-left:12px;padding:2px 10px;border-radius:10px;background:rgba(212,175,55,0.12);color:#d4af37;font-size:12px;">${pickupType === 'self_pickup' ? '自主领取' : pickupType === 'apply_approve' ? '申请审批' : '管理员分配'}</span>
        </div>
        <div class="leads-toolbar">
            <div class="toolbar-left">
                <button class="btn-accent" id="btnAddLead"><i class="fa-solid fa-plus"></i> 新增线索</button>
                <button class="btn-outline" id="btnBulkImport"><i class="fa-solid fa-file-import"></i> 批量导入</button>
                <button class="btn-outline" id="btnBulkAssign" ${hasSelection ? '' : 'disabled'}><i class="fa-solid fa-share"></i> 批量分配${hasSelection ? `(${this.selectedLeadIds.length})` : ''}</button>
                <button class="btn-outline" id="btnBulkExportPool" ${hasSelection ? '' : 'disabled'}><i class="fa-solid fa-file-export"></i> 批量导出${hasSelection ? `(${this.selectedLeadIds.length})` : ''}</button>
                ${hasSelection ? `<button class="btn-outline" id="btnBulkReturn" style="color:#ef4444;border-color:#ef4444;"><i class="fa-solid fa-rotate-left"></i> 批量退回(${this.selectedLeadIds.length})</button>` : ''}
                <button class="btn-outline" id="btnPoolColumnConfig"><i class="fa-solid fa-columns"></i> 列设置</button>
            </div>
            <div class="toolbar-right">
                <div class="search-box">
                    <i class="fa-solid fa-search"></i>
                    <input type="text" id="leadSearchInput" placeholder="搜索线索...">
                </div>
            </div>
        </div>
        <div class="leads-table-wrapper">
            <table class="leads-table" id="poolLeadsTable">
                <thead>
                    <tr>
                        <th><input type="checkbox" id="selectAllLeads"></th>
                        ${columns.map(c => `<th>${escapeHtml(c.label)}</th>`).join('')}
                        <th>操作</th>
                    </tr>
                </thead>
                <tbody>`;
        if (leads.length === 0) {
            html += `<tr><td colspan="${columns.length + 2}" class="empty-cell">暂无线索数据</td></tr>`;
        } else {
            leads.forEach(lead => {
                const checked = this.selectedLeadIds.indexOf(lead.lead_id) !== -1 ? 'checked' : '';
                let actionHtml = '';
                if (lead.status === 'pending') {
                    actionHtml += `<button class="btn-sm btn-assign" data-lead-id="${lead.lead_id}">分配</button>`;
                    if (pickupType === 'self_pickup') {
                        actionHtml += `<button class="btn-sm btn-pickup" data-lead-id="${lead.lead_id}">领取</button>`;
                    } else if (pickupType === 'apply_approve') {
                        actionHtml += `<button class="btn-sm btn-apply" data-lead-id="${lead.lead_id}" data-pool-id="${lead.pool_id}">申领</button>`;
                    }
                } else {
                    actionHtml = `<span class="text-muted">${STATUS_MAP[lead.status] || '已分配'}</span>`;
                }
                html += `
                    <tr data-lead-id="${lead.lead_id}">
                        <td><input type="checkbox" class="lead-checkbox" value="${lead.lead_id}" ${checked}></td>
                        ${columns.map(c => `<td>${this.renderCellValue(lead, c)}</td>`).join('')}
                        <td class="action-cell">${actionHtml}</td>
                    </tr>`;
            });
        }
        html += '</tbody></table></div>';
        return html;
    },

    // ===== 我的线索视图 =====
    renderMyLeadsView() {
        const myLeads = LeadStorage.getMyLeads();
        const hasSelection = this.selectedMyLeadIds.length > 0;
        const columns = this.getColumns('my');
        let html = `
        <div class="leads-module-header">
            <h2><i class="fa-solid fa-user"></i> 我的线索</h2>
        </div>
        <div class="leads-toolbar">
            <div class="toolbar-left">
                <select class="filter-select" id="filterStatus">
                    <option value="">全部状态</option>
                    <option value="allocated">待跟进</option>
                    <option value="following">跟进中</option>
                    <option value="converted">已转化</option>
                </select>
                <select class="filter-select" id="filterSource">
                    <option value="">全部来源</option>
                    ${LEAD_SOURCES.map(s => `<option value="${s}">${s}</option>`).join('')}
                </select>
                <select class="filter-select" id="filterPriority">
                    <option value="">全部优先级</option>
                    <option value="high">高</option>
                    <option value="medium">中</option>
                    <option value="low">低</option>
                </select>
                ${hasSelection ? `<button class="btn-outline" id="btnMyBulkReturn" style="color:#ef4444;border-color:#ef4444;"><i class="fa-solid fa-rotate-left"></i> 批量退回(${this.selectedMyLeadIds.length})</button>
                <button class="btn-outline" id="btnMyBulkTransfer"><i class="fa-solid fa-arrow-right-arrow-left"></i> 批量转移(${this.selectedMyLeadIds.length})</button>
                <button class="btn-outline" id="btnMyBulkExport"><i class="fa-solid fa-file-export"></i> 批量导出(${this.selectedMyLeadIds.length})</button>` : ''}
                <button class="btn-outline" id="btnMyColumnConfig"><i class="fa-solid fa-columns"></i> 列设置</button>
            </div>
        </div>
        <div class="leads-table-wrapper">
            <table class="leads-table" id="myLeadsTable">
                <thead>
                    <tr>
                        <th><input type="checkbox" id="selectAllMyLeads"></th>
                        ${columns.map(c => {
                            const sortIcon = (c.key === 'ai_score' || c.key === 'estimated_amount' || c.key === 'create_time' || c.key === 'update_time')
                                ? `<i class="fa-solid fa-sort" data-sort-key="${c.key}" style="margin-left:6px;cursor:pointer;color:#94a3b8;"></i>` : '';
                            return `<th>${escapeHtml(c.label)}${sortIcon}</th>`;
                        }).join('')}
                        <th>最近跟进</th>
                        <th>下次跟进</th>
                        <th>操作</th>
                    </tr>
                </thead>
                <tbody id="myLeadsBody">`;
        let filtered = this.filterMyLeads(myLeads);
        // 排序
        if (this.mySortField) {
            const dir = this.mySortDir === 'asc' ? 1 : -1;
            filtered = filtered.slice().sort((a, b) => {
                const av = a[this.mySortField] || 0;
                const bv = b[this.mySortField] || 0;
                if (av < bv) return -1 * dir;
                if (av > bv) return 1 * dir;
                return 0;
            });
        }
        if (filtered.length === 0) {
            html += `<tr><td colspan="${columns.length + 4}" class="empty-cell">暂无线索</td></tr>`;
        } else {
            filtered.forEach(lead => {
                const followUps = FollowUpStorage.getByLeadId(lead.lead_id);
                const lastFollow = followUps[0];
                const nextTime = lastFollow && lastFollow.next_follow_time ? new Date(lastFollow.next_follow_time).toLocaleDateString('zh-CN') : '-';
                const lastTime = lastFollow ? new Date(lastFollow.create_time).toLocaleDateString('zh-CN') : '-';
                const checked = this.selectedMyLeadIds.indexOf(lead.lead_id) !== -1 ? 'checked' : '';
                html += `
                    <tr data-lead-id="${lead.lead_id}">
                        <td><input type="checkbox" class="my-lead-checkbox" value="${lead.lead_id}" ${checked}></td>
                        ${columns.map(c => `<td>${this.renderCellValue(lead, c, true)}</td>`).join('')}
                        <td>${lastTime}</td>
                        <td>${nextTime}</td>
                        <td class="action-cell">
                            ${lead.status === 'converted'
                                ? `<button class="btn-sm btn-detail btn-view-convert" data-lead-id="${lead.lead_id}" style="background:rgba(16,185,129,0.18);color:#10b981;"><i class="fa-solid fa-circle-check"></i> 查看转化</button>`
                                : `<button class="btn-sm btn-follow" data-lead-id="${lead.lead_id}">跟进</button>
                            <button class="btn-sm btn-return" data-lead-id="${lead.lead_id}">退回</button>
                            <button class="btn-sm btn-detail" data-lead-id="${lead.lead_id}">详情</button>`}
                        </td>
                    </tr>`;
            });
        }
        html += '</tbody></table></div>';
        return html;
    },

    filterMyLeads(leads) {
        // 读取筛选条件（初次渲染时DOM还未创建，返回全部）
        const statusEl = document.getElementById('filterStatus');
        const sourceEl = document.getElementById('filterSource');
        const priorityEl = document.getElementById('filterPriority');
        let result = leads;
        if (statusEl && statusEl.value) result = result.filter(l => l.status === statusEl.value);
        if (sourceEl && sourceEl.value) result = result.filter(l => l.lead_source === sourceEl.value);
        if (priorityEl && priorityEl.value) result = result.filter(l => l.priority === priorityEl.value);
        return result;
    },

    // ===== 线索详情视图 =====
    renderDetailView() {
        const lead = LeadStorage.getById(this.detailLeadId);
        if (!lead) { this.currentView = 'my_leads'; return this.renderMyLeadsView(); }
        const followUps = FollowUpStorage.getByLeadId(lead.lead_id);
        // 转化信息卡片（仅在状态为 converted 时显示）
        let convertedCardHtml = '';
        if (lead.status === 'converted') {
            const cust = CustomerStorage.getBySourceLead(lead.lead_id);
            const opp = OpportunityStorage.getBySourceLead(lead.lead_id);
            const items = [];
            if (cust) items.push(`<div class="detail-item"><label>关联客户</label><span style="color:#10b981;"><i class="fa-solid fa-building"></i> ${escapeHtml(cust.customer_name)}</span></div>`);
            if (opp) items.push(`<div class="detail-item"><label>关联商机</label><span style="color:#10b981;"><i class="fa-solid fa-bullseye"></i> ${escapeHtml(opp.opportunity_name)}</span></div>`);
            if (opp && opp.estimated_amount) items.push(`<div class="detail-item"><label>预计金额</label><span>¥${(opp.estimated_amount || 0).toLocaleString()}</span></div>`);
            const convertTime = (cust && cust.create_time) || (opp && opp.create_time) || lead.update_time;
            if (convertTime) items.push(`<div class="detail-item"><label>转化时间</label><span>${new Date(convertTime).toLocaleString('zh-CN')}</span></div>`);
            if (items.length === 0) items.push('<div class="detail-item full-width"><span style="color:#94a3b8;">暂无关联客户/商机记录</span></div>');
            convertedCardHtml = `
            <div class="detail-card" style="margin-bottom:16px;background:linear-gradient(135deg,rgba(16,185,129,0.08),rgba(16,185,129,0.02));border:1px solid rgba(16,185,129,0.3);">
                <div class="detail-card-header" style="border-bottom:1px solid rgba(16,185,129,0.2);">
                    <h3 style="color:#10b981;"><i class="fa-solid fa-circle-check"></i> 转化信息</h3>
                </div>
                <div class="detail-grid">${items.join('')}</div>
            </div>`;
        }
        // 转化按钮（仅未转化状态可点）
        const canConvert = ['allocated', 'following'].indexOf(lead.status) !== -1;
        let html = `
        <div class="leads-breadcrumb">
            <a href="#" class="breadcrumb-link" data-action="backToMyLeads"><i class="fa-solid fa-arrow-left"></i> 我的线索</a>
            <span class="breadcrumb-sep">/</span>
            <span class="breadcrumb-current">${escapeHtml(lead.lead_name)}</span>
        </div>
        <div class="lead-detail-layout">
            <div class="lead-detail-left">
                ${convertedCardHtml}
                <div class="detail-card">
                    <div class="detail-card-header">
                        <h3>基本信息</h3>
                        <div class="detail-actions">
                            <button class="btn-outline btn-edit-lead" data-lead-id="${lead.lead_id}"><i class="fa-solid fa-pen"></i> 编辑</button>
                            ${canConvert ? `<button class="btn-accent btn-convert-lead" data-lead-id="${lead.lead_id}" style="background:linear-gradient(135deg,#10b981,#059669);"><i class="fa-solid fa-handshake"></i> 转化</button>` : ''}
                            <button class="btn-outline btn-return-lead" data-lead-id="${lead.lead_id}" style="color:#ef4444;border-color:#ef4444;"><i class="fa-solid fa-rotate-left"></i> 退回</button>
                        </div>
                    </div>
                    <div class="detail-grid">
                        <div class="detail-item"><label>线索名称</label><span>${escapeHtml(lead.lead_name)}</span></div>
                        <div class="detail-item"><label>联系人</label><span>${escapeHtml(lead.contact_name)}</span></div>
                        <div class="detail-item"><label>联系电话</label><span>${escapeHtml(lead.contact_phone)}</span></div>
                        <div class="detail-item"><label>邮箱</label><span>${escapeHtml(lead.contact_email) || '-'}</span></div>
                        <div class="detail-item"><label>来源</label><span>${escapeHtml(lead.lead_source)}</span></div>
                        <div class="detail-item"><label>行业</label><span>${escapeHtml(lead.industry) || '-'}</span></div>
                        <div class="detail-item"><label>地区</label><span>${escapeHtml([lead.province, lead.city, lead.district].filter(Boolean).join(' '))}</span></div>
                        <div class="detail-item"><label>预计金额</label><span>¥${(lead.estimated_amount || 0).toLocaleString()}</span></div>
                        <div class="detail-item"><label>优先级</label><span class="priority-badge" style="color:${PRIORITY_COLORS[lead.priority]}">${PRIORITY_MAP[lead.priority]}</span></div>
                        <div class="detail-item"><label>状态</label><span class="status-badge" style="background:${STATUS_COLORS[lead.status]}20;color:${STATUS_COLORS[lead.status]}">${STATUS_MAP[lead.status]}</span></div>
                        <div class="detail-item"><label>标签</label><span>${(lead.tags || []).map(t => '<span class="tag-chip">' + escapeHtml(t) + '</span>').join(' ') || '-'}</span></div>
                        <div class="detail-item"><label>负责人</label><span>${escapeHtml(lead.owner_id) || '-'}</span></div>
                        <div class="detail-item full-width"><label>需求描述</label><span>${escapeHtml(lead.demand_desc) || '-'}</span></div>
                        ${this.renderCustomFieldDetail(lead)}
                    </div>
                </div>
                ${this.renderAIAnalysisCard(lead)}
            </div>
            <div class="lead-detail-right">
                <div class="detail-card">
                    <div class="detail-card-header">
                        <h3>跟进记录</h3>
                        <div class="detail-actions">
                            <button class="btn-accent btn-add-follow" data-lead-id="${lead.lead_id}"><i class="fa-solid fa-plus"></i> 新增跟进</button>
                            <button class="btn-outline btn-check-in" data-lead-id="${lead.lead_id}" style="color:#d4af37;border-color:rgba(212,175,55,0.5);"><i class="fa-solid fa-map-marker-alt"></i> 拜访签到</button>
                        </div>
                    </div>
                    <div class="follow-timeline">`;
        if (followUps.length === 0) {
            html += '<div class="empty-state" style="padding:32px 0;"><i class="fa-solid fa-comments" style="font-size:36px;color:#cbd5e1;"></i><p>暂无跟进记录</p></div>';
        } else {
            followUps.forEach(fu => {
                const isCheckIn = fu.follow_type === '拜访签到';
                const tIcon = isCheckIn ? 'fa-map-marker-alt' : 'fa-tag';
                const tColor = isCheckIn ? '#d4af37' : '';
                html += `
                        <div class="timeline-item">
                            <div class="timeline-dot" ${isCheckIn ? 'style="background:#d4af37;"' : ''}></div>
                            <div class="timeline-content">
                                <div class="timeline-header">
                                    <span class="timeline-type" ${tColor ? `style="color:${tColor};"` : ''}><i class="fa-solid ${tIcon}"></i> ${escapeHtml(fu.follow_type)}</span>
                                    <span class="timeline-time">${new Date(fu.create_time).toLocaleString('zh-CN')}</span>
                                </div>
                                <div class="timeline-body">${escapeHtml(fu.follow_content)}</div>
                                ${isCheckIn && (fu.check_in_address || fu.check_in_time) ? `
                                <div class="timeline-checkin" style="margin-top:8px;padding:8px 10px;background:rgba(212,175,55,0.06);border-left:3px solid #d4af37;border-radius:4px;font-size:12px;color:#cbd5e1;">
                                    ${fu.check_in_address ? `<div><i class="fa-solid fa-location-dot" style="color:#d4af37;"></i> 签到地点：${escapeHtml(fu.check_in_address)}</div>` : ''}
                                    ${fu.check_in_time ? `<div style="margin-top:4px;"><i class="fa-solid fa-clock" style="color:#d4af37;"></i> 签到时间：${new Date(fu.check_in_time).toLocaleString('zh-CN')}</div>` : ''}
                                    ${fu.check_in_photo ? `<div style="margin-top:4px;"><i class="fa-solid fa-image" style="color:#d4af37;"></i> 照片凭证：${escapeHtml(fu.check_in_photo)}</div>` : ''}
                                </div>` : ''}
                                <div class="timeline-footer">
                                    <span>操作人：${escapeHtml(fu.create_by)}</span>
                                    ${fu.customer_intent ? `<span>意向：${PRIORITY_MAP[fu.customer_intent] || fu.customer_intent}</span>` : ''}
                                    ${fu.next_follow_time ? `<span>下次跟进：${new Date(fu.next_follow_time).toLocaleDateString('zh-CN')}</span>` : ''}
                                </div>
                            </div>
                        </div>`;
            });
        }
        html += '</div></div></div></div>';
        return html;
    },

    // ===== 事件绑定 =====
    bindEvents() {
        const module = this.container.querySelector('.leads-module');
        if (!module) return;

        const handler = (e) => {
            // Tab切换
            const tab = e.target.closest('.leads-main-tab');
            if (tab) {
                e.preventDefault();
                this.currentTab = tab.dataset.tab;
                if (this.currentTab === 'public') this.currentView = 'pools';
                else if (this.currentTab === 'private') this.currentView = 'my_leads';
                else if (this.currentTab === 'rules') this.currentView = 'rules';
                else if (this.currentTab === 'analytics') this.currentView = 'analytics';
                this.selectedLeadIds = [];
                this.selectedMyLeadIds = [];
                this.render();
                return;
            }

            // 面包屑返回
            const breadcrumb = e.target.closest('[data-action]');
            if (breadcrumb) {
                e.preventDefault();
                const action = breadcrumb.dataset.action;
                if (action === 'backToPools') { this.currentView = 'pools'; this.render(); }
                if (action === 'backToMyLeads') { this.currentView = 'my_leads'; this.render(); }
                return;
            }

            // 新建线索池
            if (e.target.closest('#btnCreatePool')) { this.showPoolModal(); return; }

            // 编辑线索池
            const editPoolBtn = e.target.closest('.btn-edit-pool');
            if (editPoolBtn) { e.stopPropagation(); this.showPoolModal(editPoolBtn.dataset.poolId); return; }

            // 删除线索池
            const deletePoolBtn = e.target.closest('.btn-delete-pool');
            if (deletePoolBtn) { e.stopPropagation(); this.confirmDeletePool(deletePoolBtn.dataset.poolId); return; }

            // 点击池卡片进入
            const poolCard = e.target.closest('.pool-card');
            if (poolCard && !e.target.closest('.pool-card-actions')) {
                this.currentPoolId = poolCard.dataset.poolId;
                this.currentView = 'pool_leads';
                this.selectedLeadIds = [];
                this.render();
                return;
            }

            // 新增线索
            if (e.target.closest('#btnAddLead')) { this.showLeadModal(); return; }

            // 批量导入
            if (e.target.closest('#btnBulkImport')) { this.showImportModal(); return; }

            // 批量分配
            if (e.target.closest('#btnBulkAssign')) { this.showBatchAssignModal(this.selectedLeadIds); return; }

            // 公海批量导出
            if (e.target.closest('#btnBulkExportPool')) { this.handleBatchExport(this.selectedLeadIds); return; }

            // 私海批量转移
            if (e.target.closest('#btnMyBulkTransfer')) { this.showBatchTransferModal(this.selectedMyLeadIds); return; }

            // 私海批量导出
            if (e.target.closest('#btnMyBulkExport')) { this.handleBatchExport(this.selectedMyLeadIds); return; }

            // 拜访签到按钮
            const checkInBtn = e.target.closest('.btn-check-in');
            if (checkInBtn) { this.showCheckInModal(checkInBtn.dataset.leadId); return; }

            // 转化按钮
            const convertBtn = e.target.closest('.btn-convert-lead');
            if (convertBtn) { this.showConvertModal(convertBtn.dataset.leadId); return; }

            // 通知铃铛
            if (e.target.closest('#btnNotification')) {
                e.stopPropagation();
                this.toggleNotificationPanel();
                return;
            }
            if (e.target.closest('#btnCloseNotification')) {
                this.closeNotificationPanel();
                return;
            }
            if (e.target.closest('#btnMarkAllRead')) {
                NotificationStorage.markAllAsRead();
                showToast('已标记所有通知为已读', 'success');
                this.closeNotificationPanel();
                this.render();
                return;
            }
            const notifyItem = e.target.closest('.notification-item');
            if (notifyItem) {
                const notifyId = notifyItem.dataset.notifyId;
                const leadId = notifyItem.dataset.leadId;
                if (notifyId) NotificationStorage.markAsRead(notifyId);
                this.closeNotificationPanel();
                if (leadId) {
                    const lead = LeadStorage.getById(leadId);
                    if (lead) {
                        this.detailLeadId = leadId;
                        this.currentTab = 'private';
                        this.currentView = 'detail';
                    }
                }
                this.render();
                return;
            }

            // 批量分配
            // (保留占位，避免重复)

            // 批量退回（公海选中）
            if (e.target.closest('#btnBulkReturn')) { this.showBatchReturnModal(this.selectedLeadIds); return; }

            // 批量退回（私海选中）
            if (e.target.closest('#btnMyBulkReturn')) { this.showBatchReturnModal(this.selectedMyLeadIds); return; }

            // 单个分配
            const assignBtn = e.target.closest('.btn-assign');
            if (assignBtn) { this.showAssignModal([assignBtn.dataset.leadId]); return; }

            // 领取
            const pickupBtn = e.target.closest('.btn-pickup');
            if (pickupBtn) { this.handlePickup(pickupBtn.dataset.leadId); return; }

            // 申领
            const applyBtn = e.target.closest('.btn-apply');
            if (applyBtn) { this.showApplyModal(applyBtn.dataset.leadId, applyBtn.dataset.poolId); return; }

            // 公海全选
            if (e.target.id === 'selectAllLeads') {
                const checked = e.target.checked;
                module.querySelectorAll('.lead-checkbox').forEach(cb => { cb.checked = checked; });
                this.updateSelectedLeads();
                this.render();
                return;
            }
            // 私海全选
            if (e.target.id === 'selectAllMyLeads') {
                const checked = e.target.checked;
                module.querySelectorAll('.my-lead-checkbox').forEach(cb => { cb.checked = checked; });
                this.updateSelectedMyLeads();
                this.render();
                return;
            }

            // 公海单选
            if (e.target.classList.contains('lead-checkbox')) {
                this.updateSelectedLeads();
                this.render();
                return;
            }
            // 私海单选
            if (e.target.classList.contains('my-lead-checkbox')) {
                this.updateSelectedMyLeads();
                this.render();
                return;
            }

            // 跟进按钮
            const followBtn = e.target.closest('.btn-follow') || e.target.closest('.btn-add-follow');
            if (followBtn) { this.showFollowUpModal(followBtn.dataset.leadId); return; }

            // 退回按钮
            const returnBtn = e.target.closest('.btn-return') || e.target.closest('.btn-return-lead');
            if (returnBtn) { this.showReturnModal(returnBtn.dataset.leadId); return; }

            // 详情按钮 或 名称链接
            const detailBtn = e.target.closest('.btn-detail');
            const nameLink = e.target.closest('.lead-name-link');
            if (detailBtn || nameLink) {
                const leadId = (detailBtn || nameLink).dataset.leadId;
                this.detailLeadId = leadId;
                this.currentView = 'detail';
                this.render();
                return;
            }

            // 编辑线索（详情页）
            const editLeadBtn = e.target.closest('.btn-edit-lead');
            if (editLeadBtn) { this.showLeadModal(editLeadBtn.dataset.leadId); return; }

            // ===== 规则设置页交互 =====
            // 保存自动分配规则
            if (e.target.closest('#btnSaveAutoAssign')) { this.handleSaveAutoAssign(); return; }
            // 保存自动回收规则
            if (e.target.closest('#btnSaveAutoRecycle')) { this.handleSaveAutoRecycle(); return; }
            // 保存保有量上限
            if (e.target.closest('#btnSaveHoldingLimit')) { this.handleSaveHoldingLimit(); return; }
            // 保存领取限制
            if (e.target.closest('#btnSavePickupLimit')) { this.handleSavePickupLimit(); return; }
            // 手动触发规则引擎
            if (e.target.closest('#btnRunRulesNow')) {
                this.checkAutoRules();
                showToast('规则引擎已手动运行', 'success');
                this.render();
                return;
            }
            // 退回原因管理
            if (e.target.closest('#btnAddReturnReason')) { this.showReturnReasonModal(); return; }
            const editReasonBtn = e.target.closest('.btn-edit-reason');
            if (editReasonBtn) { this.showReturnReasonModal(editReasonBtn.dataset.reasonId); return; }
            const delReasonBtn = e.target.closest('.btn-del-reason');
            if (delReasonBtn) {
                if (confirm('确定删除该退回原因吗？')) {
                    ReturnReasonStorage.delete(delReasonBtn.dataset.reasonId);
                    showToast('退回原因已删除', 'success');
                    this.render();
                }
                return;
            }
            const toggleReasonBtn = e.target.closest('.btn-toggle-reason');
            if (toggleReasonBtn) {
                const reason = ReturnReasonStorage.getById(toggleReasonBtn.dataset.reasonId);
                if (reason) {
                    ReturnReasonStorage.update({ reason_id: reason.reason_id, enabled: !reason.enabled });
                    this.render();
                }
                return;
            }
            // 审核操作
            const approveBtn = e.target.closest('.btn-approve-pickup');
            if (approveBtn) { this.handleApprove(approveBtn.dataset.approvalId); return; }
            const rejectBtn = e.target.closest('.btn-reject-pickup');
            if (rejectBtn) { this.handleReject(rejectBtn.dataset.approvalId); return; }

            // ===== Phase 4 交互 =====
            // 二维码按钮
            const qrBtn = e.target.closest('.btn-qr-pool');
            if (qrBtn) { e.stopPropagation(); this.showQRCodeModal(qrBtn.dataset.poolId); return; }
            // 列设置
            if (e.target.closest('#btnPoolColumnConfig')) { this.showColumnConfigModal('pool'); return; }
            if (e.target.closest('#btnMyColumnConfig')) { this.showColumnConfigModal('my'); return; }
            // 排序头
            const sortIcon = e.target.closest('[data-sort-key]');
            if (sortIcon) {
                const key = sortIcon.dataset.sortKey;
                if (this.mySortField === key) {
                    this.mySortDir = this.mySortDir === 'asc' ? 'desc' : 'asc';
                } else {
                    this.mySortField = key;
                    this.mySortDir = 'desc';
                }
                this.render();
                return;
            }
            // 自定义字段管理
            if (e.target.closest('#btnAddCustomField')) { this.showCustomFieldModal(); return; }
            const editCfBtn = e.target.closest('.btn-edit-cfield');
            if (editCfBtn) { this.showCustomFieldModal(editCfBtn.dataset.fieldId); return; }
            const delCfBtn = e.target.closest('.btn-del-cfield');
            if (delCfBtn) {
                if (confirm('确定删除该自定义字段吗？')) {
                    CustomFieldStorage.delete(delCfBtn.dataset.fieldId);
                    showToast('自定义字段已删除', 'success');
                    this.render();
                }
                return;
            }
            const toggleCfBtn = e.target.closest('.btn-toggle-cfield');
            if (toggleCfBtn) {
                const f = CustomFieldStorage.getById(toggleCfBtn.dataset.fieldId);
                if (f) {
                    CustomFieldStorage.update({ field_id: f.field_id, enabled: !f.enabled });
                    this.render();
                }
                return;
            }
            // 保存 Webhook
            if (e.target.closest('#btnSaveWebhook')) { this.handleSaveWebhook(); return; }
        };

        this.addEvent(module, 'click', handler);

        // 筛选事件（私海视图）
        const filterHandler = () => { this.render(); };
        ['filterStatus', 'filterSource', 'filterPriority'].forEach(id => {
            const el = document.getElementById(id);
            if (el) this.addEvent(el, 'change', filterHandler);
        });

        // 搜索事件
        const poolSearch = document.getElementById('poolSearchInput');
        if (poolSearch) {
            this.addEvent(poolSearch, 'input', () => this.handlePoolSearch(poolSearch.value));
        }
        const leadSearch = document.getElementById('leadSearchInput');
        if (leadSearch) {
            this.addEvent(leadSearch, 'input', () => this.handleLeadSearch(leadSearch.value));
        }
    },

    updateSelectedLeads() {
        const checkboxes = this.container.querySelectorAll('.lead-checkbox:checked');
        this.selectedLeadIds = Array.from(checkboxes).map(cb => cb.value);
        const bulkBtn = document.getElementById('btnBulkAssign');
        if (bulkBtn) bulkBtn.disabled = this.selectedLeadIds.length === 0;
    },

    updateSelectedMyLeads() {
        const checkboxes = this.container.querySelectorAll('.my-lead-checkbox:checked');
        this.selectedMyLeadIds = Array.from(checkboxes).map(cb => cb.value);
    },

    handlePoolSearch(keyword) {
        const cards = this.container.querySelectorAll('.pool-card');
        cards.forEach(card => {
            const name = card.querySelector('.pool-card-title').textContent;
            card.style.display = name.includes(keyword) ? '' : 'none';
        });
    },

    handleLeadSearch(keyword) {
        const rows = this.container.querySelectorAll('#poolLeadsTable tbody tr');
        rows.forEach(row => {
            const text = row.textContent;
            row.style.display = text.includes(keyword) ? '' : 'none';
        });
    },

    // ===== 领取 =====
    handlePickup(leadId) {
        const user = getCurrentUser();
        const lead = LeadStorage.getById(leadId);
        if (!lead || lead.status !== 'pending') {
            showToast('该线索无法领取', 'error');
            return;
        }
        // 保有量上限校验
        if (!this.checkHoldingLimit(user, lead.pool_id)) return;
        // 领取频率限制校验
        if (!this.checkPickupLimit(user, lead.pool_id)) return;

        const now = new Date().toISOString();
        LeadStorage.update({ lead_id: leadId, owner_id: user, status: 'allocated', update_time: now });
        AssignmentStorage.add({ assign_id: generateId('asgn_'), lead_id: leadId, from_user: '', to_user: user, assign_type: 'self_pickup', remark: '自主领取', create_time: now });
        showToast('领取成功！', 'success');
        this.render();
    },

    // ===== 保有量上限校验 =====
    checkHoldingLimit(userId, poolId) {
        const cfg = HoldingLimitStorage.getByPool(poolId);
        if (!cfg || !cfg.enabled) return true;
        const activeStatus = ['returned', 'closed', 'converted'];
        const count = LeadStorage.getAll().filter(l => l.owner_id === userId && l.pool_id === poolId && activeStatus.indexOf(l.status) === -1).length;
        if (count >= cfg.max_count) {
            showToast(`已达保有量上限(${cfg.max_count}条)`, 'error');
            return false;
        }
        return true;
    },

    // ===== 领取频率限制校验 =====
    checkPickupLimit(userId, poolId) {
        const cfg = PickupLimitStorage.getByPool(poolId);
        if (!cfg || !cfg.enabled) return true;
        const todayCount = AssignmentStorage.getTodayByUser(userId).length;
        if (cfg.daily_limit && todayCount >= cfg.daily_limit) {
            showToast(`已达今日领取上限(${cfg.daily_limit}条)`, 'error');
            return false;
        }
        const weekCount = AssignmentStorage.getThisWeekByUser(userId).length;
        if (cfg.weekly_limit && weekCount >= cfg.weekly_limit) {
            showToast(`已达本周领取上限(${cfg.weekly_limit}条)`, 'error');
            return false;
        }
        return true;
    },

    // ===== 线索池弹窗 =====
    showPoolModal(poolId) {
        const pool = poolId ? PoolStorage.getById(poolId) : null;
        const title = pool ? '编辑线索池' : '新建线索池';
        const html = `
        <div class="leads-modal-overlay" id="poolModal">
            <div class="leads-modal">
                <div class="modal-header"><h3>${title}</h3><button class="modal-close" data-close>&times;</button></div>
                <div class="modal-body">
                    <div class="form-group"><label>线索池名称 <span class="required">*</span></label><input type="text" id="poolName" value="${escapeHtml(pool ? pool.pool_name : '')}" placeholder="如：上海区线索池"></div>
                    <div class="form-group"><label>编码 <span class="required">*</span></label><input type="text" id="poolCode" value="${escapeHtml(pool ? pool.pool_code : '')}" placeholder="如：SHANGHAI"></div>
                    <div class="form-group"><label>管理员（逗号分隔）</label><input type="text" id="poolAdmins" value="${pool ? pool.admins.join(',') : ''}" placeholder="如：张经理,李主管"></div>
                    <div class="form-group"><label>成员（逗号分隔）</label><input type="text" id="poolMembers" value="${pool ? pool.members.join(',') : ''}" placeholder="如：王芳,李强,张伟"></div>
                    <div class="form-group"><label>领取方式</label>
                        <select id="poolPickupType">
                            <option value="self_pickup" ${pool && pool.pickup_type === 'self_pickup' ? 'selected' : ''}>自主领取</option>
                            <option value="admin_assign" ${pool && pool.pickup_type === 'admin_assign' ? 'selected' : ''}>管理员分配</option>
                            <option value="apply_approve" ${pool && pool.pickup_type === 'apply_approve' ? 'selected' : ''}>申请审批</option>
                        </select>
                    </div>
                    <div class="form-group"><label>备注</label><textarea id="poolRemark" rows="3" placeholder="线索池说明...">${escapeHtml(pool ? pool.remark : '')}</textarea></div>
                </div>
                <div class="modal-footer">
                    <button class="btn-outline" data-close>取消</button>
                    <button class="btn-accent" id="btnSavePool">保存</button>
                </div>
            </div>
        </div>`;
        document.body.insertAdjacentHTML('beforeend', html);
        const modal = document.getElementById('poolModal');
        requestAnimationFrame(() => modal.classList.add('active'));
        modal.addEventListener('click', (e) => {
            if (e.target.closest('[data-close]') || e.target === modal) { modal.remove(); }
            if (e.target.closest('#btnSavePool')) {
                const name = document.getElementById('poolName').value.trim();
                const code = document.getElementById('poolCode').value.trim();
                if (!name || !code) { showToast('名称和编码为必填', 'error'); return; }
                const data = {
                    pool_name: name,
                    pool_code: code,
                    admins: document.getElementById('poolAdmins').value.split(',').map(s => s.trim()).filter(Boolean),
                    members: document.getElementById('poolMembers').value.split(',').map(s => s.trim()).filter(Boolean),
                    pickup_type: document.getElementById('poolPickupType').value,
                    remark: document.getElementById('poolRemark').value.trim(),
                    member_can_view_detail: true,
                    pickup_limit_enabled: true,
                    pickup_notify: true
                };
                if (pool) {
                    PoolStorage.update({ ...data, pool_id: pool.pool_id });
                    showToast('线索池已更新', 'success');
                } else {
                    PoolStorage.add({ ...data, pool_id: generateId('pool_'), create_time: new Date().toISOString(), deleted: false });
                    showToast('线索池已创建', 'success');
                }
                modal.remove();
                this.render();
            }
        });
    },

    confirmDeletePool(poolId) {
        const pool = PoolStorage.getById(poolId);
        if (!pool) return;
        const leadCount = LeadStorage.getByPool(poolId).length;
        if (!confirm(`确定删除线索池「${pool.pool_name}」吗？\n该池中有 ${leadCount} 条线索将不再可见。`)) return;
        PoolStorage.delete(poolId);
        showToast('线索池已删除', 'success');
        this.render();
    },

    // ===== 新增/编辑线索弹窗 =====
    showLeadModal(leadId) {
        const lead = leadId ? LeadStorage.getById(leadId) : null;
        const title = lead ? '编辑线索' : '新增线索';
        const html = `
        <div class="leads-modal-overlay" id="leadModal">
            <div class="leads-modal leads-modal-lg">
                <div class="modal-header"><h3>${title}</h3><button class="modal-close" data-close>&times;</button></div>
                <div class="modal-body">
                    <div class="form-row">
                        <div class="form-group"><label>线索名称 <span class="required">*</span></label><input type="text" id="leadName" value="${escapeHtml(lead ? lead.lead_name : '')}" placeholder="客户公司名或姓名"></div>
                        <div class="form-group"><label>联系人 <span class="required">*</span></label><input type="text" id="leadContact" value="${escapeHtml(lead ? lead.contact_name : '')}" placeholder="联系人姓名"></div>
                    </div>
                    <div class="form-row">
                        <div class="form-group"><label>联系电话 <span class="required">*</span></label><input type="text" id="leadPhone" value="${escapeHtml(lead ? lead.contact_phone : '')}" placeholder="手机号或座机"></div>
                        <div class="form-group"><label>邮箱</label><input type="text" id="leadEmail" value="${escapeHtml(lead ? lead.contact_email : '')}" placeholder="email@example.com"></div>
                    </div>
                    <div class="form-row">
                        <div class="form-group"><label>来源 <span class="required">*</span></label>
                            <select id="leadSource">
                                <option value="">请选择</option>
                                ${LEAD_SOURCES.map(s => `<option value="${s}" ${lead && lead.lead_source === s ? 'selected' : ''}>${s}</option>`).join('')}
                            </select>
                        </div>
                        <div class="form-group"><label>行业</label>
                            <select id="leadIndustry">
                                <option value="">请选择</option>
                                ${LEAD_INDUSTRIES.map(s => `<option value="${s}" ${lead && lead.industry === s ? 'selected' : ''}>${s}</option>`).join('')}
                            </select>
                        </div>
                    </div>
                    <div class="form-row three-col">
                        <div class="form-group"><label>省</label><input type="text" id="leadProvince" value="${escapeHtml(lead ? lead.province : '')}" placeholder="省份"></div>
                        <div class="form-group"><label>市</label><input type="text" id="leadCity" value="${escapeHtml(lead ? lead.city : '')}" placeholder="城市"></div>
                        <div class="form-group"><label>区</label><input type="text" id="leadDistrict" value="${escapeHtml(lead ? lead.district : '')}" placeholder="区/县"></div>
                    </div>
                    <div class="form-group"><label>需求描述</label><textarea id="leadDemand" rows="3" placeholder="客户需求详细描述...">${escapeHtml(lead ? lead.demand_desc : '')}</textarea></div>
                    <div class="form-row">
                        <div class="form-group"><label>预计金额（元）</label><input type="number" id="leadAmount" value="${lead ? lead.estimated_amount || '' : ''}" placeholder="0"></div>
                        <div class="form-group"><label>优先级</label>
                            <div class="radio-group">
                                <label><input type="radio" name="leadPriority" value="high" ${lead && lead.priority === 'high' ? 'checked' : ''}> 高</label>
                                <label><input type="radio" name="leadPriority" value="medium" ${(!lead || lead.priority === 'medium') ? 'checked' : ''}> 中</label>
                                <label><input type="radio" name="leadPriority" value="low" ${lead && lead.priority === 'low' ? 'checked' : ''}> 低</label>
                            </div>
                        </div>
                    </div>
                    <div class="form-group"><label>标签（逗号分隔）</label><input type="text" id="leadTags" value="${lead ? (lead.tags || []).join(',') : ''}" placeholder="如：大客户,科技"></div>
                    ${this.renderCustomFieldsForLead(lead)}
                </div>
                <div class="modal-footer">
                    <button class="btn-outline" data-close>取消</button>
                    <button class="btn-accent" id="btnSaveLead">保存</button>
                </div>
            </div>
        </div>`;
        document.body.insertAdjacentHTML('beforeend', html);
        const modal = document.getElementById('leadModal');
        requestAnimationFrame(() => modal.classList.add('active'));
        modal.addEventListener('click', (e) => {
            if (e.target.closest('[data-close]') || e.target === modal) { modal.remove(); }
            if (e.target.closest('#btnSaveLead')) { this.handleSaveLead(modal, lead); }
        });
    },

    handleSaveLead(modal, existingLead) {
        const name = document.getElementById('leadName').value.trim();
        const contact = document.getElementById('leadContact').value.trim();
        const phone = document.getElementById('leadPhone').value.trim();
        const source = document.getElementById('leadSource').value;
        if (!name) { showToast('请填写线索名称', 'error'); return; }
        if (!contact) { showToast('请填写联系人', 'error'); return; }
        if (!phone) { showToast('请填写联系电话', 'error'); return; }
        if (!source) { showToast('请选择来源', 'error'); return; }

        const doSave = () => {
            const priority = document.querySelector('input[name="leadPriority"]:checked');
            const customData = this.collectCustomFieldData(existingLead);
            const data = {
                lead_name: name,
                contact_name: contact,
                contact_phone: phone,
                contact_email: document.getElementById('leadEmail').value.trim(),
                lead_source: source,
                industry: document.getElementById('leadIndustry').value,
                province: document.getElementById('leadProvince').value.trim(),
                city: document.getElementById('leadCity').value.trim(),
                district: document.getElementById('leadDistrict').value.trim(),
                demand_desc: document.getElementById('leadDemand').value.trim(),
                estimated_amount: parseFloat(document.getElementById('leadAmount').value) || 0,
                priority: priority ? priority.value : 'medium',
                tags: document.getElementById('leadTags').value.split(',').map(s => s.trim()).filter(Boolean),
                custom_data: customData,
                update_time: new Date().toISOString()
            };
            let savedLead;
            if (existingLead) {
                savedLead = { ...existingLead, ...data, lead_id: existingLead.lead_id };
                LeadStorage.update({ ...data, lead_id: existingLead.lead_id });
                showToast('线索已更新', 'success');
            } else {
                const newLead = {
                    ...data,
                    lead_id: generateId('lead_'),
                    status: 'pending',
                    owner_id: '',
                    pool_id: this.currentPoolId || 'pool_001',
                    create_time: new Date().toISOString(),
                    create_by: getCurrentUser(),
                    deleted: false
                };
                LeadStorage.add(newLead);
                savedLead = newLead;
                showToast('线索已创建', 'success');
            }
            // AI 评分
            try {
                const score = this.calculateLeadScore(savedLead);
                const grade = this.getScoreGrade(score);
                LeadStorage.update({ lead_id: savedLead.lead_id, ai_score: score, ai_grade: grade });
                savedLead.ai_score = score;
                savedLead.ai_grade = grade;
            } catch (err) { console.error('[Leads] AI score error', err); }
            // Webhook 触发
            if (!existingLead) {
                this.triggerWebhook('create', savedLead);
            }
            modal.remove();
            this.render();
        };

        // 查重逻辑（仅新增时）
        if (!existingLead) {
            const dup = LeadStorage.checkDuplicate(phone);
            if (dup) {
                if (confirm(`发现重复线索：\n名称：${dup.lead_name}\n联系人：${dup.contact_name}\n电话：${dup.contact_phone}\n状态：${STATUS_MAP[dup.status]}\n\n是否仍然新建？`)) {
                    doSave();
                }
                return;
            }
        }
        doSave();
    },

    // ===== 批量导入弹窗 =====
    showImportModal() {
        const html = `
        <div class="leads-modal-overlay" id="importModal">
            <div class="leads-modal leads-modal-lg">
                <div class="modal-header"><h3>批量导入线索</h3><button class="modal-close" data-close>&times;</button></div>
                <div class="modal-body">
                    <div class="import-actions">
                        <button class="btn-outline" id="btnDownloadTemplate"><i class="fa-solid fa-download"></i> 下载模板</button>
                    </div>
                    <div class="import-upload-area" id="importUploadArea">
                        <i class="fa-solid fa-cloud-arrow-up" style="font-size:36px;color:#94a3b8;"></i>
                        <p>点击或拖拽CSV文件到此处</p>
                        <input type="file" id="importFileInput" accept=".csv" style="display:none;">
                    </div>
                    <div class="import-preview" id="importPreview" style="display:none;">
                        <div class="import-summary" id="importSummary"></div>
                        <div class="import-errors" id="importErrors"></div>
                    </div>
                </div>
                <div class="modal-footer">
                    <button class="btn-outline" data-close>取消</button>
                    <button class="btn-accent" id="btnConfirmImport" disabled>确认导入</button>
                </div>
            </div>
        </div>`;
        document.body.insertAdjacentHTML('beforeend', html);
        const modal = document.getElementById('importModal');
        requestAnimationFrame(() => modal.classList.add('active'));
        let parsedLeads = [];

        modal.addEventListener('click', (e) => {
            if (e.target.closest('[data-close]') || e.target === modal) { modal.remove(); }
            if (e.target.closest('#btnDownloadTemplate')) { this.downloadTemplate(); }
            if (e.target.closest('#importUploadArea')) { document.getElementById('importFileInput').click(); }
            if (e.target.closest('#btnConfirmImport') && parsedLeads.length > 0) {
                LeadStorage.bulkInsert(parsedLeads);
                showToast(`成功导入 ${parsedLeads.length} 条线索`, 'success');
                modal.remove();
                this.render();
            }
        });

        document.getElementById('importFileInput').addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (!file) return;
            const reader = new FileReader();
            reader.onload = (evt) => {
                const result = this.parseCSV(evt.target.result);
                parsedLeads = result.valid;
                const preview = document.getElementById('importPreview');
                preview.style.display = 'block';
                document.getElementById('importSummary').innerHTML = `<p>总行数：${result.total} | <span style="color:#10b981;">成功：${result.valid.length}</span> | <span style="color:#ef4444;">失败：${result.errors.length}</span></p>`;
                if (result.errors.length > 0) {
                    document.getElementById('importErrors').innerHTML = '<ul>' + result.errors.map(err => `<li>第${err.row}行：${escapeHtml(err.reason)}</li>`).join('') + '</ul>';
                }
                document.getElementById('btnConfirmImport').disabled = parsedLeads.length === 0;
            };
            reader.readAsText(file, 'UTF-8');
        });
    },

    downloadTemplate() {
        const header = '线索名称,联系人,联系电话,邮箱,来源,行业,省,市,区,需求描述,预计金额,优先级';
        const sample = '示例公司,张三,13800138000,zhangsan@example.com,官网注册,科技,浙江,杭州,西湖区,需要CRM系统,100000,中';
        const csv = header + '\n' + sample;
        const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url; a.download = '线索导入模板.csv'; a.click();
        URL.revokeObjectURL(url);
    },

    parseCSV(text) {
        const lines = text.replace(/\r\n/g, '\n').split('\n').filter(l => l.trim());
        if (lines.length < 2) return { total: 0, valid: [], errors: [{ row: 1, reason: '文件为空或缺少数据行' }] };
        const headers = lines[0].split(',');
        const result = { total: lines.length - 1, valid: [], errors: [] };
        const now = new Date().toISOString();
        for (let i = 1; i < lines.length; i++) {
            const cols = lines[i].split(',');
            const name = (cols[0] || '').trim();
            const contact = (cols[1] || '').trim();
            const phone = (cols[2] || '').trim();
            if (!name) { result.errors.push({ row: i + 1, reason: '线索名称为空' }); continue; }
            if (!contact) { result.errors.push({ row: i + 1, reason: '联系人为空' }); continue; }
            if (!phone) { result.errors.push({ row: i + 1, reason: '联系电话为空' }); continue; }
            const priorityVal = (cols[11] || '').trim();
            let priority = 'medium';
            if (priorityVal === '高' || priorityVal === 'high') priority = 'high';
            if (priorityVal === '低' || priorityVal === 'low') priority = 'low';
            result.valid.push({
                lead_id: generateId('lead_'),
                lead_name: name,
                contact_name: contact,
                contact_phone: phone,
                contact_email: (cols[3] || '').trim(),
                lead_source: (cols[4] || '').trim() || '批量导入',
                industry: (cols[5] || '').trim(),
                province: (cols[6] || '').trim(),
                city: (cols[7] || '').trim(),
                district: (cols[8] || '').trim(),
                demand_desc: (cols[9] || '').trim(),
                estimated_amount: parseFloat(cols[10]) || 0,
                priority: priority,
                tags: [],
                status: 'pending',
                owner_id: '',
                pool_id: this.currentPoolId || 'pool_001',
                create_time: now,
                update_time: now,
                create_by: getCurrentUser(),
                deleted: false
            });
        }
        return result;
    },

    // ===== 分配弹窗 =====
    showAssignModal(leadIds) {
        if (!leadIds || leadIds.length === 0) { showToast('请先选择要分配的线索', 'error'); return; }
        const pool = PoolStorage.getById(this.currentPoolId);
        const members = pool ? pool.members : ['王芳','李强','张伟','陈丽','赵敏'];
        const html = `
        <div class="leads-modal-overlay" id="assignModal">
            <div class="leads-modal">
                <div class="modal-header"><h3>分配线索（${leadIds.length}条）</h3><button class="modal-close" data-close>&times;</button></div>
                <div class="modal-body">
                    <div class="form-group"><label>分配给 <span class="required">*</span></label>
                        <select id="assignTo">
                            <option value="">请选择成员</option>
                            ${members.map(m => `<option value="${m}">${m}</option>`).join('')}
                        </select>
                    </div>
                    <div class="form-group"><label>分配备注</label><textarea id="assignRemark" rows="2" placeholder="可选备注..."></textarea></div>
                </div>
                <div class="modal-footer">
                    <button class="btn-outline" data-close>取消</button>
                    <button class="btn-accent" id="btnConfirmAssign">确认分配</button>
                </div>
            </div>
        </div>`;
        document.body.insertAdjacentHTML('beforeend', html);
        const modal = document.getElementById('assignModal');
        requestAnimationFrame(() => modal.classList.add('active'));
        modal.addEventListener('click', (e) => {
            if (e.target.closest('[data-close]') || e.target === modal) { modal.remove(); }
            if (e.target.closest('#btnConfirmAssign')) {
                const to = document.getElementById('assignTo').value;
                if (!to) { showToast('请选择分配对象', 'error'); return; }
                // 保有量上限校验（针对被分配人）
                const targetPoolId = this.currentPoolId || (LeadStorage.getById(leadIds[0]) || {}).pool_id;
                if (!this.checkHoldingLimit(to, targetPoolId)) return;
                const remark = document.getElementById('assignRemark').value.trim();
                const now = new Date().toISOString();
                leadIds.forEach(id => {
                    LeadStorage.update({ lead_id: id, owner_id: to, status: 'allocated', update_time: now });
                    AssignmentStorage.add({ assign_id: generateId('asgn_'), lead_id: id, from_user: getCurrentUser(), to_user: to, assign_type: 'admin_assign', remark: remark, create_time: now });
                });
                showToast(`已成功分配 ${leadIds.length} 条线索给 ${to}`, 'success');
                modal.remove();
                this.selectedLeadIds = [];
                this.render();
            }
        });
    },

    // ===== 新增跟进弹窗 =====
    showFollowUpModal(leadId) {
        const html = `
        <div class="leads-modal-overlay" id="followModal">
            <div class="leads-modal">
                <div class="modal-header"><h3>新增跟进记录</h3><button class="modal-close" data-close>&times;</button></div>
                <div class="modal-body">
                    <div class="form-group"><label>跟进方式 <span class="required">*</span></label>
                        <select id="followType">
                            <option value="">请选择</option>
                            ${FOLLOW_TYPES.map(t => `<option value="${t}">${t}</option>`).join('')}
                        </select>
                    </div>
                    <div class="form-group"><label>跟进内容 <span class="required">*</span></label><textarea id="followContent" rows="4" placeholder="本次跟进的详细内容..."></textarea></div>
                    <div class="form-group"><label>客户意向</label>
                        <div class="radio-group">
                            <label><input type="radio" name="followIntent" value="high"> 高</label>
                            <label><input type="radio" name="followIntent" value="medium" checked> 中</label>
                            <label><input type="radio" name="followIntent" value="low"> 低</label>
                        </div>
                    </div>
                    <div class="form-group"><label>下次跟进时间</label><input type="date" id="followNextTime"></div>
                    <div class="form-group"><label>下次跟进内容</label><input type="text" id="followNextContent" placeholder="下次需要做什么..."></div>
                </div>
                <div class="modal-footer">
                    <button class="btn-outline" data-close>取消</button>
                    <button class="btn-accent" id="btnSaveFollow">保存</button>
                </div>
            </div>
        </div>`;
        document.body.insertAdjacentHTML('beforeend', html);
        const modal = document.getElementById('followModal');
        requestAnimationFrame(() => modal.classList.add('active'));
        modal.addEventListener('click', (e) => {
            if (e.target.closest('[data-close]') || e.target === modal) { modal.remove(); }
            if (e.target.closest('#btnSaveFollow')) {
                const type = document.getElementById('followType').value;
                const content = document.getElementById('followContent').value.trim();
                if (!type) { showToast('请选择跟进方式', 'error'); return; }
                if (!content) { showToast('请填写跟进内容', 'error'); return; }
                const intent = document.querySelector('input[name="followIntent"]:checked');
                const nextTime = document.getElementById('followNextTime').value;
                const nextContent = document.getElementById('followNextContent').value.trim();
                const now = new Date().toISOString();
                FollowUpStorage.add({
                    follow_id: generateId('fu_'),
                    biz_type: 'lead',
                    biz_id: leadId,
                    follow_type: type,
                    follow_content: content,
                    customer_intent: intent ? intent.value : 'medium',
                    next_follow_time: nextTime ? new Date(nextTime).toISOString() : '',
                    next_follow_content: nextContent,
                    create_time: now,
                    create_by: getCurrentUser()
                });
                // 更新线索状态
                const lead = LeadStorage.getById(leadId);
                if (lead && lead.status === 'allocated') {
                    LeadStorage.update({ lead_id: leadId, status: 'following', update_time: now });
                } else if (lead) {
                    LeadStorage.update({ lead_id: leadId, update_time: now });
                }
                // 跟进后重新计算 AI 评分
                try {
                    const updated = LeadStorage.getById(leadId);
                    if (updated) {
                        const score = this.calculateLeadScore(updated);
                        const grade = this.getScoreGrade(score);
                        LeadStorage.update({ lead_id: leadId, ai_score: score, ai_grade: grade });
                    }
                } catch (err) { console.error('[Leads] re-score error', err); }
                showToast('跟进记录已保存', 'success');
                modal.remove();
                this.render();
            }
        });
    },

    // ===== 退回弹窗 =====
    showReturnModal(leadId) {
        const reasons = this.getActiveReturnReasons();
        const html = `
        <div class="leads-modal-overlay" id="returnModal">
            <div class="leads-modal">
                <div class="modal-header"><h3>退回线索</h3><button class="modal-close" data-close>&times;</button></div>
                <div class="modal-body">
                    <div class="form-group"><label>退回原因 <span class="required">*</span></label>
                        <select id="returnReason">
                            <option value="">请选择</option>
                            ${reasons.map(r => `<option value="${escapeHtml(r)}">${escapeHtml(r)}</option>`).join('')}
                            <option value="__other__">其他...</option>
                        </select>
                    </div>
                    <div class="form-group" id="returnOtherWrap" style="display:none;"><label>请输入原因 <span class="required">*</span></label><input type="text" id="returnOtherText" placeholder="请输入退回原因"></div>
                    <div class="form-group"><label>补充说明</label><textarea id="returnNote" rows="3" placeholder="退回原因说明..."></textarea></div>
                </div>
                <div class="modal-footer">
                    <button class="btn-outline" data-close>取消</button>
                    <button class="btn-accent" id="btnConfirmReturn" style="background:linear-gradient(135deg,#ef4444,#dc2626);">确认退回</button>
                </div>
            </div>
        </div>`;
        document.body.insertAdjacentHTML('beforeend', html);
        const modal = document.getElementById('returnModal');
        requestAnimationFrame(() => modal.classList.add('active'));
        const reasonSel = document.getElementById('returnReason');
        reasonSel.addEventListener('change', () => {
            document.getElementById('returnOtherWrap').style.display = reasonSel.value === '__other__' ? '' : 'none';
        });
        modal.addEventListener('click', (e) => {
            if (e.target.closest('[data-close]') || e.target === modal) { modal.remove(); }
            if (e.target.closest('#btnConfirmReturn')) {
                let reason = reasonSel.value;
                if (!reason) { showToast('请选择退回原因', 'error'); return; }
                if (reason === '__other__') {
                    const otherText = document.getElementById('returnOtherText').value.trim();
                    if (!otherText) { showToast('请输入其他退回原因', 'error'); return; }
                    reason = otherText;
                }
                const note = document.getElementById('returnNote').value.trim();
                const now = new Date().toISOString();
                LeadStorage.update({ lead_id: leadId, owner_id: '', status: 'returned', update_time: now });
                AssignmentStorage.add({ assign_id: generateId('asgn_'), lead_id: leadId, from_user: getCurrentUser(), to_user: '', assign_type: 'manual_return', remark: `${reason}${note ? ' / ' + note : ''}`, create_time: now });
                FollowUpStorage.add({
                    follow_id: generateId('fu_'),
                    biz_type: 'lead',
                    biz_id: leadId,
                    follow_type: '其他',
                    follow_content: `退回线索 - 原因：${reason}${note ? '，说明：' + note : ''}`,
                    customer_intent: 'low',
                    next_follow_time: '',
                    next_follow_content: '',
                    create_time: now,
                    create_by: getCurrentUser()
                });
                showToast('线索已退回公海', 'success');
                modal.remove();
                if (this.currentView === 'detail') this.currentView = 'my_leads';
                this.render();
            }
        });
    },

    // 获取启用的退回原因文本列表（有配置取配置、否则回退默认常量）
    getActiveReturnReasons() {
        const enabled = ReturnReasonStorage.getEnabled();
        if (enabled.length > 0) return enabled.map(r => r.reason_text);
        return RETURN_REASONS.filter(r => r !== '其他');
    },

    // ============================================================
    // ===== Phase 2 新增：规则设置主视图 =====
    // ============================================================
    renderRulesView() {
        const pools = PoolStorage.getAll();
        const poolOptions = pools.map(p => `<option value="${p.pool_id}">${escapeHtml(p.pool_name)}</option>`).join('');
        const firstPoolId = pools[0] ? pools[0].pool_id : '';
        const assignRule = firstPoolId ? (AutoAssignRuleStorage.getByPool(firstPoolId) || {}) : {};
        const recycleRule = firstPoolId ? (AutoRecycleRuleStorage.getByPool(firstPoolId) || {}) : {};
        const holdingCfg = HoldingLimitStorage.getByPool(firstPoolId) || {};
        const pickupCfg = PickupLimitStorage.getByPool(firstPoolId) || {};

        let html = `
        <div class="leads-module-header">
            <h2><i class="fa-solid fa-sliders"></i> 规则设置</h2>
            <div class="leads-header-actions">
                <button class="btn-outline" id="btnRunRulesNow"><i class="fa-solid fa-bolt"></i> 立即运行规则</button>
            </div>
        </div>
        <div class="rules-grid" style="display:grid;grid-template-columns:repeat(auto-fit,minmax(420px,1fr));gap:20px;">
            ${this.renderAutoAssignPanel(poolOptions, assignRule)}
            ${this.renderAutoRecyclePanel(poolOptions, recycleRule)}
            ${this.renderHoldingLimitPanel(poolOptions, holdingCfg)}
            ${this.renderPickupLimitPanel(poolOptions, pickupCfg)}
        </div>
        ${this.renderReturnReasonPanel()}
        ${this.renderCustomFieldPanel()}
        ${this.renderAPIPanel()}
        ${this.renderApprovalView()}`;
        return html;
    },

    // ----- 自动分配规则面板 -----
    renderAutoAssignPanel(poolOptions, rule) {
        const ruleType = rule.rule_type || 'round_robin';
        const enabled = !!rule.enabled;
        const cfg = rule.config || { members_weight: {}, region_map: {} };
        return `
        <div class="rules-panel" style="background:linear-gradient(135deg,#1a1a1a,#222);border:1px solid rgba(212,175,55,0.25);border-radius:12px;padding:20px;">
            <div class="rules-panel-header" style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px;border-bottom:1px solid rgba(212,175,55,0.15);padding-bottom:12px;">
                <h3 style="color:#d4af37;font-size:16px;margin:0;"><i class="fa-solid fa-shuffle"></i> 自动分配规则</h3>
                <label class="rules-toggle" style="display:flex;align-items:center;gap:8px;color:#cbd5e1;">
                    <input type="checkbox" id="autoAssignEnabled" ${enabled ? 'checked' : ''}>
                    <span>启用</span>
                </label>
            </div>
            <div class="form-group"><label>关联线索池</label>
                <select id="autoAssignPool">${poolOptions}</select>
            </div>
            <div class="form-group"><label>分配方式</label>
                <div class="radio-group">
                    <label><input type="radio" name="autoAssignType" value="round_robin" ${ruleType === 'round_robin' ? 'checked' : ''}> 轮询</label>
                    <label><input type="radio" name="autoAssignType" value="weight" ${ruleType === 'weight' ? 'checked' : ''}> 权重</label>
                    <label><input type="radio" name="autoAssignType" value="region" ${ruleType === 'region' ? 'checked' : ''}> 区域</label>
                </div>
            </div>
            <div class="form-group"><label>权重配置（成员:权重，分号分隔）</label>
                <input type="text" id="autoAssignWeight" value="${escapeHtml(Object.entries(cfg.members_weight || {}).map(([k, v]) => `${k}:${v}`).join(';'))}" placeholder="如：王芳:3;李强:2;张伟:1">
            </div>
            <div class="form-group"><label>区域映射（成员:区域，分号分隔）</label>
                <input type="text" id="autoAssignRegion" value="${escapeHtml(Object.entries(cfg.region_map || {}).map(([k, v]) => `${k}:${v}`).join(';'))}" placeholder="如：王芳:杭州;李强:宁波">
            </div>
            <div style="text-align:right;margin-top:12px;">
                <button class="btn-accent" id="btnSaveAutoAssign">保存分配规则</button>
            </div>
        </div>`;
    },

    handleSaveAutoAssign() {
        const poolId = document.getElementById('autoAssignPool').value;
        if (!poolId) { showToast('请先创建线索池', 'error'); return; }
        const enabled = document.getElementById('autoAssignEnabled').checked;
        const ruleType = (document.querySelector('input[name="autoAssignType"]:checked') || {}).value || 'round_robin';
        const weightStr = document.getElementById('autoAssignWeight').value.trim();
        const regionStr = document.getElementById('autoAssignRegion').value.trim();
        const members_weight = {};
        weightStr.split(';').filter(Boolean).forEach(item => {
            const [k, v] = item.split(':').map(s => (s || '').trim());
            if (k) members_weight[k] = parseInt(v, 10) || 1;
        });
        const region_map = {};
        regionStr.split(';').filter(Boolean).forEach(item => {
            const [k, v] = item.split(':').map(s => (s || '').trim());
            if (k && v) region_map[k] = v;
        });
        AutoAssignRuleStorage.upsertByPool(poolId, { enabled, rule_type: ruleType, config: { members_weight, region_map } });
        showToast('自动分配规则已保存', 'success');
        if (enabled) this.checkAutoAssign();
        this.render();
    },

    // ----- 自动回收规则面板 -----
    renderAutoRecyclePanel(poolOptions, rule) {
        const enabled = !!rule.enabled;
        return `
        <div class="rules-panel" style="background:linear-gradient(135deg,#1a1a1a,#222);border:1px solid rgba(212,175,55,0.25);border-radius:12px;padding:20px;">
            <div class="rules-panel-header" style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px;border-bottom:1px solid rgba(212,175,55,0.15);padding-bottom:12px;">
                <h3 style="color:#d4af37;font-size:16px;margin:0;"><i class="fa-solid fa-recycle"></i> 自动回收规则</h3>
                <label class="rules-toggle" style="display:flex;align-items:center;gap:8px;color:#cbd5e1;">
                    <input type="checkbox" id="autoRecycleEnabled" ${enabled ? 'checked' : ''}>
                    <span>启用</span>
                </label>
            </div>
            <div class="form-group"><label>关联线索池</label>
                <select id="autoRecyclePool">${poolOptions}</select>
            </div>
            <div class="form-group"><label>未跟进天数阈值</label>
                <input type="number" id="autoRecycleDays" min="1" value="${rule.days_no_follow || 7}" placeholder="超过天数未跟进则回收">
            </div>
            <div class="form-group"><label>提前通知天数</label>
                <input type="number" id="autoRecycleNotify" min="0" value="${rule.notify_before_days || 1}" placeholder="回收前多少天提醒">
            </div>
            <div style="color:#94a3b8;font-size:12px;margin-top:8px;">提示：最后跟进时间按该线索最新跟进记录计算，无记录则取线索更新时间。</div>
            <div style="text-align:right;margin-top:12px;">
                <button class="btn-accent" id="btnSaveAutoRecycle">保存回收规则</button>
            </div>
        </div>`;
    },

    handleSaveAutoRecycle() {
        const poolId = document.getElementById('autoRecyclePool').value;
        if (!poolId) { showToast('请先创建线索池', 'error'); return; }
        const enabled = document.getElementById('autoRecycleEnabled').checked;
        const days = parseInt(document.getElementById('autoRecycleDays').value, 10) || 7;
        const notify = parseInt(document.getElementById('autoRecycleNotify').value, 10) || 0;
        AutoRecycleRuleStorage.upsertByPool(poolId, { enabled, days_no_follow: days, notify_before_days: notify });
        showToast('自动回收规则已保存', 'success');
        if (enabled) this.checkAutoRecycle();
        this.render();
    },

    // ----- 保有量上限面板 -----
    renderHoldingLimitPanel(poolOptions, cfg) {
        const enabled = !!cfg.enabled;
        return `
        <div class="rules-panel" style="background:linear-gradient(135deg,#1a1a1a,#222);border:1px solid rgba(212,175,55,0.25);border-radius:12px;padding:20px;">
            <div class="rules-panel-header" style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px;border-bottom:1px solid rgba(212,175,55,0.15);padding-bottom:12px;">
                <h3 style="color:#d4af37;font-size:16px;margin:0;"><i class="fa-solid fa-warehouse"></i> 保有量上限</h3>
                <label class="rules-toggle" style="display:flex;align-items:center;gap:8px;color:#cbd5e1;">
                    <input type="checkbox" id="holdingEnabled" ${enabled ? 'checked' : ''}>
                    <span>启用</span>
                </label>
            </div>
            <div class="form-group"><label>关联线索池</label>
                <select id="holdingPool">${poolOptions}</select>
            </div>
            <div class="form-group"><label>个人最大保有数量</label>
                <input type="number" id="holdingMax" min="1" value="${cfg.max_count || 30}" placeholder="超过该数量将无法领取/被分配">
            </div>
            <div style="color:#94a3b8;font-size:12px;margin-top:8px;">说明：统计状态为待跟进 / 跟进中的线索，已退回、已转化、已关闭不计入。</div>
            <div style="text-align:right;margin-top:12px;">
                <button class="btn-accent" id="btnSaveHoldingLimit">保存保有量</button>
            </div>
        </div>`;
    },

    handleSaveHoldingLimit() {
        const poolId = document.getElementById('holdingPool').value;
        if (!poolId) { showToast('请先创建线索池', 'error'); return; }
        const enabled = document.getElementById('holdingEnabled').checked;
        const max = parseInt(document.getElementById('holdingMax').value, 10) || 30;
        HoldingLimitStorage.upsertByPool(poolId, { enabled, max_count: max });
        showToast('保有量上限已保存', 'success');
        this.render();
    },

    // ----- 领取限制面板 -----
    renderPickupLimitPanel(poolOptions, cfg) {
        const enabled = !!cfg.enabled;
        return `
        <div class="rules-panel" style="background:linear-gradient(135deg,#1a1a1a,#222);border:1px solid rgba(212,175,55,0.25);border-radius:12px;padding:20px;">
            <div class="rules-panel-header" style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px;border-bottom:1px solid rgba(212,175,55,0.15);padding-bottom:12px;">
                <h3 style="color:#d4af37;font-size:16px;margin:0;"><i class="fa-solid fa-hand-holding"></i> 领取限制</h3>
                <label class="rules-toggle" style="display:flex;align-items:center;gap:8px;color:#cbd5e1;">
                    <input type="checkbox" id="pickupEnabled" ${enabled ? 'checked' : ''}>
                    <span>启用</span>
                </label>
            </div>
            <div class="form-group"><label>关联线索池</label>
                <select id="pickupPool">${poolOptions}</select>
            </div>
            <div class="form-row">
                <div class="form-group"><label>每日限制</label>
                    <input type="number" id="pickupDaily" min="0" value="${cfg.daily_limit || 5}" placeholder="0=不限">
                </div>
                <div class="form-group"><label>每周限制</label>
                    <input type="number" id="pickupWeekly" min="0" value="${cfg.weekly_limit || 20}" placeholder="0=不限">
                </div>
            </div>
            <div style="color:#94a3b8;font-size:12px;margin-top:8px;">说明：限制计算范围为自主领取 + 申请通过计入领取。</div>
            <div style="text-align:right;margin-top:12px;">
                <button class="btn-accent" id="btnSavePickupLimit">保存领取限制</button>
            </div>
        </div>`;
    },

    handleSavePickupLimit() {
        const poolId = document.getElementById('pickupPool').value;
        if (!poolId) { showToast('请先创建线索池', 'error'); return; }
        const enabled = document.getElementById('pickupEnabled').checked;
        const daily = parseInt(document.getElementById('pickupDaily').value, 10) || 0;
        const weekly = parseInt(document.getElementById('pickupWeekly').value, 10) || 0;
        PickupLimitStorage.upsertByPool(poolId, { enabled, daily_limit: daily, weekly_limit: weekly });
        showToast('领取限制已保存', 'success');
        this.render();
    },

    // ============================================================
    // ===== Phase 2 退回原因管理 =====
    // ============================================================
    renderReturnReasonPanel() {
        const reasons = ReturnReasonStorage.getAll();
        let rows = '';
        if (reasons.length === 0) {
            rows = '<tr><td colspan="5" class="empty-cell">暂无退回原因配置</td></tr>';
        } else {
            reasons.forEach(r => {
                rows += `
                <tr>
                    <td>${r.sort_order || 0}</td>
                    <td>${escapeHtml(r.reason_text)}</td>
                    <td>
                        <button class="btn-sm btn-toggle-reason" data-reason-id="${r.reason_id}" style="background:${r.enabled ? 'rgba(16,185,129,0.18)' : 'rgba(148,163,184,0.18)'};color:${r.enabled ? '#10b981' : '#94a3b8'};">${r.enabled ? '已启用' : '已禁用'}</button>
                    </td>
                    <td>${new Date(r.create_time).toLocaleDateString('zh-CN')}</td>
                    <td class="action-cell">
                        <button class="btn-sm btn-edit-reason" data-reason-id="${r.reason_id}">编辑</button>
                        <button class="btn-sm btn-del-reason" data-reason-id="${r.reason_id}" style="color:#ef4444;">删除</button>
                    </td>
                </tr>`;
            });
        }
        return `
        <div class="rules-section" style="margin-top:24px;background:linear-gradient(135deg,#1a1a1a,#222);border:1px solid rgba(212,175,55,0.25);border-radius:12px;padding:20px;">
            <div class="rules-panel-header" style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px;border-bottom:1px solid rgba(212,175,55,0.15);padding-bottom:12px;">
                <h3 style="color:#d4af37;font-size:16px;margin:0;"><i class="fa-solid fa-tags"></i> 退回原因管理</h3>
                <button class="btn-accent" id="btnAddReturnReason"><i class="fa-solid fa-plus"></i> 新增原因</button>
            </div>
            <div class="leads-table-wrapper">
                <table class="leads-table">
                    <thead><tr><th style="width:80px;">排序</th><th>原因文本</th><th style="width:120px;">状态</th><th style="width:160px;">创建时间</th><th style="width:140px;">操作</th></tr></thead>
                    <tbody>${rows}</tbody>
                </table>
            </div>
        </div>`;
    },

    showReturnReasonModal(reasonId) {
        const reason = reasonId ? ReturnReasonStorage.getById(reasonId) : null;
        const title = reason ? '编辑退回原因' : '新增退回原因';
        const html = `
        <div class="leads-modal-overlay" id="reasonModal">
            <div class="leads-modal">
                <div class="modal-header"><h3>${title}</h3><button class="modal-close" data-close>&times;</button></div>
                <div class="modal-body">
                    <div class="form-group"><label>原因文本 <span class="required">*</span></label>
                        <input type="text" id="reasonText" value="${escapeHtml(reason ? reason.reason_text : '')}" placeholder="如：联系不上">
                    </div>
                    <div class="form-row">
                        <div class="form-group"><label>排序</label>
                            <input type="number" id="reasonOrder" value="${reason ? reason.sort_order : (ReturnReasonStorage.getAll().length + 1)}">
                        </div>
                        <div class="form-group"><label>状态</label>
                            <div class="radio-group">
                                <label><input type="radio" name="reasonEnabled" value="1" ${(!reason || reason.enabled) ? 'checked' : ''}> 启用</label>
                                <label><input type="radio" name="reasonEnabled" value="0" ${(reason && !reason.enabled) ? 'checked' : ''}> 禁用</label>
                            </div>
                        </div>
                    </div>
                </div>
                <div class="modal-footer">
                    <button class="btn-outline" data-close>取消</button>
                    <button class="btn-accent" id="btnSaveReason">保存</button>
                </div>
            </div>
        </div>`;
        document.body.insertAdjacentHTML('beforeend', html);
        const modal = document.getElementById('reasonModal');
        requestAnimationFrame(() => modal.classList.add('active'));
        modal.addEventListener('click', (e) => {
            if (e.target.closest('[data-close]') || e.target === modal) { modal.remove(); }
            if (e.target.closest('#btnSaveReason')) {
                const text = document.getElementById('reasonText').value.trim();
                if (!text) { showToast('请输入原因文本', 'error'); return; }
                const order = parseInt(document.getElementById('reasonOrder').value, 10) || 0;
                const enabledVal = (document.querySelector('input[name="reasonEnabled"]:checked') || {}).value || '1';
                const enabled = enabledVal === '1';
                if (reason) {
                    ReturnReasonStorage.update({ reason_id: reason.reason_id, reason_text: text, sort_order: order, enabled });
                    showToast('退回原因已更新', 'success');
                } else {
                    ReturnReasonStorage.add({ reason_id: generateId('rsn_'), reason_text: text, sort_order: order, enabled, create_time: new Date().toISOString() });
                    showToast('退回原因已新增', 'success');
                }
                modal.remove();
                this.render();
            }
        });
    },

    // ============================================================
    // ===== Phase 2 申领 + 审核 =====
    // ============================================================
    showApplyModal(leadId, poolId) {
        const lead = LeadStorage.getById(leadId);
        if (!lead) { showToast('线索不存在', 'error'); return; }
        const html = `
        <div class="leads-modal-overlay" id="applyModal">
            <div class="leads-modal">
                <div class="modal-header"><h3>申领线索</h3><button class="modal-close" data-close>&times;</button></div>
                <div class="modal-body">
                    <div class="apply-summary" style="background:rgba(212,175,55,0.08);border:1px solid rgba(212,175,55,0.2);padding:12px;border-radius:8px;margin-bottom:16px;">
                        <div style="color:#d4af37;font-weight:600;margin-bottom:6px;">${escapeHtml(lead.lead_name)}</div>
                        <div style="color:#cbd5e1;font-size:13px;">联系人：${escapeHtml(lead.contact_name)} · 电话：${escapeHtml(lead.contact_phone)}</div>
                        <div style="color:#94a3b8;font-size:12px;margin-top:4px;">来源：${escapeHtml(lead.lead_source)} · 行业：${escapeHtml(lead.industry || '-')}</div>
                    </div>
                    <div class="form-group"><label>申领理由 <span class="required">*</span></label>
                        <textarea id="applyReason" rows="4" placeholder="请说明为什么适合跟进该线索..."></textarea>
                    </div>
                </div>
                <div class="modal-footer">
                    <button class="btn-outline" data-close>取消</button>
                    <button class="btn-accent" id="btnSubmitApply">提交申领</button>
                </div>
            </div>
        </div>`;
        document.body.insertAdjacentHTML('beforeend', html);
        const modal = document.getElementById('applyModal');
        requestAnimationFrame(() => modal.classList.add('active'));
        modal.addEventListener('click', (e) => {
            if (e.target.closest('[data-close]') || e.target === modal) { modal.remove(); }
            if (e.target.closest('#btnSubmitApply')) {
                const remark = document.getElementById('applyReason').value.trim();
                if (!remark) { showToast('请填写申领理由', 'error'); return; }
                const pool = PoolStorage.getById(poolId);
                const approver = pool && pool.admins && pool.admins.length > 0 ? pool.admins[0] : '管理员';
                ApprovalStorage.add({
                    approval_id: generateId('appr_'),
                    lead_id: leadId,
                    pool_id: poolId,
                    applicant: getCurrentUser(),
                    approver,
                    status: 'pending',
                    remark,
                    create_time: new Date().toISOString(),
                    process_time: ''
                });
                showToast('申领已提交，等待审核', 'success');
                modal.remove();
                this.render();
            }
        });
    },

    // 审核视图（嵌入在规则设置页）
    renderApprovalView() {
        const pending = ApprovalStorage.getPending();
        let rows = '';
        if (pending.length === 0) {
            rows = '<tr><td colspan="6" class="empty-cell">暂无待审核申领</td></tr>';
        } else {
            pending.forEach(a => {
                const lead = LeadStorage.getById(a.lead_id);
                const pool = PoolStorage.getById(a.pool_id);
                rows += `
                <tr>
                    <td>${escapeHtml(a.applicant)}</td>
                    <td>${lead ? escapeHtml(lead.lead_name) : '<span class="text-muted">线索已删除</span>'}</td>
                    <td>${pool ? escapeHtml(pool.pool_name) : '-'}</td>
                    <td>${new Date(a.create_time).toLocaleString('zh-CN')}</td>
                    <td style="max-width:280px;color:#cbd5e1;">${escapeHtml(a.remark)}</td>
                    <td class="action-cell">
                        <button class="btn-sm btn-approve-pickup" data-approval-id="${a.approval_id}" style="background:rgba(16,185,129,0.18);color:#10b981;">通过</button>
                        <button class="btn-sm btn-reject-pickup" data-approval-id="${a.approval_id}" style="background:rgba(239,68,68,0.18);color:#ef4444;">驳回</button>
                    </td>
                </tr>`;
            });
        }
        return `
        <div class="rules-section" style="margin-top:24px;background:linear-gradient(135deg,#1a1a1a,#222);border:1px solid rgba(212,175,55,0.25);border-radius:12px;padding:20px;">
            <div class="rules-panel-header" style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px;border-bottom:1px solid rgba(212,175,55,0.15);padding-bottom:12px;">
                <h3 style="color:#d4af37;font-size:16px;margin:0;"><i class="fa-solid fa-clipboard-check"></i> 待审核申领 <span style="color:#94a3b8;font-size:13px;font-weight:normal;">(${pending.length})</span></h3>
            </div>
            <div class="leads-table-wrapper">
                <table class="leads-table">
                    <thead><tr><th style="width:120px;">申领人</th><th>线索名称</th><th style="width:160px;">所属池</th><th style="width:160px;">申领时间</th><th>理由</th><th style="width:160px;">操作</th></tr></thead>
                    <tbody>${rows}</tbody>
                </table>
            </div>
        </div>`;
    },

    handleApprove(approvalId) {
        const approval = ApprovalStorage.getById(approvalId);
        if (!approval) return;
        const lead = LeadStorage.getById(approval.lead_id);
        if (!lead) {
            showToast('线索已删除，无法审批', 'error');
            ApprovalStorage.update({ approval_id: approvalId, status: 'rejected', process_time: new Date().toISOString() });
            this.render();
            return;
        }
        if (lead.owner_id) {
            showToast(`该线索已分配给 ${lead.owner_id}`, 'error');
            ApprovalStorage.update({ approval_id: approvalId, status: 'rejected', process_time: new Date().toISOString() });
            this.render();
            return;
        }
        // 保有量校验
        if (!this.checkHoldingLimit(approval.applicant, approval.pool_id)) return;
        const now = new Date().toISOString();
        LeadStorage.update({ lead_id: approval.lead_id, owner_id: approval.applicant, status: 'allocated', update_time: now });
        ApprovalStorage.update({ approval_id: approvalId, status: 'approved', process_time: now });
        AssignmentStorage.add({ assign_id: generateId('asgn_'), lead_id: approval.lead_id, from_user: getCurrentUser(), to_user: approval.applicant, assign_type: 'apply_approve', remark: '申领审核通过', create_time: now });
        showToast(`已通过申领，线索分配给 ${approval.applicant}`, 'success');
        this.render();
    },

    handleReject(approvalId) {
        const approval = ApprovalStorage.getById(approvalId);
        if (!approval) return;
        ApprovalStorage.update({ approval_id: approvalId, status: 'rejected', process_time: new Date().toISOString() });
        showToast('已驳回申领', 'success');
        this.render();
    },

    // ============================================================
    // ===== Phase 2 批量退回 =====
    // ============================================================
    showBatchReturnModal(leadIds) {
        if (!leadIds || leadIds.length === 0) { showToast('请先选择要退回的线索', 'error'); return; }
        const reasons = this.getActiveReturnReasons();
        const html = `
        <div class="leads-modal-overlay" id="batchReturnModal">
            <div class="leads-modal">
                <div class="modal-header"><h3>批量退回线索</h3><button class="modal-close" data-close>&times;</button></div>
                <div class="modal-body">
                    <div style="background:rgba(239,68,68,0.08);border:1px solid rgba(239,68,68,0.25);padding:12px 16px;border-radius:8px;margin-bottom:16px;color:#fca5a5;">
                        <i class="fa-solid fa-triangle-exclamation"></i> 即将退回 <strong style="color:#fff;">${leadIds.length}</strong> 条线索到公海，请谨慎操作。
                    </div>
                    <div class="form-group"><label>退回原因 <span class="required">*</span></label>
                        <select id="batchReturnReason">
                            <option value="">请选择</option>
                            ${reasons.map(r => `<option value="${escapeHtml(r)}">${escapeHtml(r)}</option>`).join('')}
                            <option value="__other__">其他...</option>
                        </select>
                    </div>
                    <div class="form-group" id="batchReturnOtherWrap" style="display:none;"><label>请输入原因 <span class="required">*</span></label><input type="text" id="batchReturnOtherText" placeholder="请输入退回原因"></div>
                    <div class="form-group"><label>备注</label><textarea id="batchReturnNote" rows="3" placeholder="退回说明..."></textarea></div>
                </div>
                <div class="modal-footer">
                    <button class="btn-outline" data-close>取消</button>
                    <button class="btn-accent" id="btnConfirmBatchReturn" style="background:linear-gradient(135deg,#ef4444,#dc2626);">确认退回</button>
                </div>
            </div>
        </div>`;
        document.body.insertAdjacentHTML('beforeend', html);
        const modal = document.getElementById('batchReturnModal');
        requestAnimationFrame(() => modal.classList.add('active'));
        const reasonSel = document.getElementById('batchReturnReason');
        reasonSel.addEventListener('change', () => {
            document.getElementById('batchReturnOtherWrap').style.display = reasonSel.value === '__other__' ? '' : 'none';
        });
        modal.addEventListener('click', (e) => {
            if (e.target.closest('[data-close]') || e.target === modal) { modal.remove(); }
            if (e.target.closest('#btnConfirmBatchReturn')) {
                let reason = reasonSel.value;
                if (!reason) { showToast('请选择退回原因', 'error'); return; }
                if (reason === '__other__') {
                    const other = document.getElementById('batchReturnOtherText').value.trim();
                    if (!other) { showToast('请输入其他退回原因', 'error'); return; }
                    reason = other;
                }
                const note = document.getElementById('batchReturnNote').value.trim();
                const now = new Date().toISOString();
                let count = 0;
                leadIds.forEach(id => {
                    const lead = LeadStorage.getById(id);
                    if (!lead) return;
                    LeadStorage.update({ lead_id: id, owner_id: '', status: 'returned', update_time: now });
                    AssignmentStorage.add({ assign_id: generateId('asgn_'), lead_id: id, from_user: getCurrentUser(), to_user: '', assign_type: 'batch_return', remark: `${reason}${note ? ' / ' + note : ''}`, create_time: now });
                    FollowUpStorage.add({
                        follow_id: generateId('fu_'),
                        biz_type: 'lead',
                        biz_id: id,
                        follow_type: '其他',
                        follow_content: `批量退回 - 原因：${reason}${note ? '，说明：' + note : ''}`,
                        customer_intent: 'low',
                        next_follow_time: '',
                        next_follow_content: '',
                        create_time: now,
                        create_by: getCurrentUser()
                    });
                    count++;
                });
                showToast(`已成功退回${count}条线索`, 'success');
                modal.remove();
                this.selectedLeadIds = [];
                this.selectedMyLeadIds = [];
                this.render();
            }
        });
    },

    // ============================================================
    // ===== Phase 2 规则引擎 =====
    // ============================================================
    checkAutoRules() {
        this.checkAutoAssign();
        this.checkAutoRecycle();
        this.checkFollowUpReminders();
    },

    // 轮询游标：记录每个池上次分配到的成员下标
    _getRoundRobinCursor(poolId) {
        const data = JSON.parse(localStorage.getItem(KEYS.ROUND_ROBIN_CURSOR) || '{}');
        return data[poolId] || 0;
    },
    _setRoundRobinCursor(poolId, idx) {
        const data = JSON.parse(localStorage.getItem(KEYS.ROUND_ROBIN_CURSOR) || '{}');
        data[poolId] = idx;
        localStorage.setItem(KEYS.ROUND_ROBIN_CURSOR, JSON.stringify(data));
    },

    checkAutoAssign() {
        const rules = AutoAssignRuleStorage.getEnabled();
        if (rules.length === 0) return 0;
        const now = new Date().toISOString();
        let totalAssigned = 0;
        rules.forEach(rule => {
            const pool = PoolStorage.getById(rule.pool_id);
            if (!pool || !pool.members || pool.members.length === 0) return;
            const members = pool.members;
            const pendingLeads = LeadStorage.getByPool(rule.pool_id).filter(l => l.status === 'pending' && !l.owner_id);
            if (pendingLeads.length === 0) return;

            // 权重模式预计算追型序列
            let weightSequence = [];
            if (rule.rule_type === 'weight') {
                const weights = (rule.config && rule.config.members_weight) || {};
                members.forEach(m => {
                    const w = parseInt(weights[m], 10) || 0;
                    for (let i = 0; i < w; i++) weightSequence.push(m);
                });
                if (weightSequence.length === 0) weightSequence = members.slice();
            }

            pendingLeads.forEach((lead, idx) => {
                let assignee = '';
                if (rule.rule_type === 'round_robin') {
                    const cursor = this._getRoundRobinCursor(rule.pool_id);
                    assignee = members[cursor % members.length];
                    this._setRoundRobinCursor(rule.pool_id, (cursor + 1) % members.length);
                } else if (rule.rule_type === 'weight') {
                    const cursor = this._getRoundRobinCursor(rule.pool_id + '_w');
                    assignee = weightSequence[cursor % weightSequence.length];
                    this._setRoundRobinCursor(rule.pool_id + '_w', (cursor + 1) % weightSequence.length);
                } else if (rule.rule_type === 'region') {
                    const regionMap = (rule.config && rule.config.region_map) || {};
                    const targetRegion = lead.city || lead.province || '';
                    const matched = Object.keys(regionMap).find(member => regionMap[member] && targetRegion && targetRegion.indexOf(regionMap[member]) !== -1);
                    if (matched && members.indexOf(matched) !== -1) {
                        assignee = matched;
                    } else {
                        // 未匹配区域：跳过
                        return;
                    }
                }
                if (!assignee) return;
                // 校验保有量（静默失败）
                const cfg = HoldingLimitStorage.getByPool(rule.pool_id);
                if (cfg && cfg.enabled) {
                    const activeStatus = ['returned', 'closed', 'converted'];
                    const cnt = LeadStorage.getAll().filter(l => l.owner_id === assignee && l.pool_id === rule.pool_id && activeStatus.indexOf(l.status) === -1).length;
                    if (cnt >= cfg.max_count) return;
                }
                LeadStorage.update({ lead_id: lead.lead_id, owner_id: assignee, status: 'allocated', update_time: now });
                AssignmentStorage.add({ assign_id: generateId('asgn_'), lead_id: lead.lead_id, from_user: 'system', to_user: assignee, assign_type: 'auto_assign', remark: `自动分配(${rule.rule_type})`, create_time: now });
                totalAssigned++;
            });
        });
        if (totalAssigned > 0) {
            showToast(`自动分配完成：${totalAssigned} 条线索已分配`, 'success');
        }
        return totalAssigned;
    },

    checkAutoRecycle() {
        const rules = AutoRecycleRuleStorage.getEnabled();
        if (rules.length === 0) return 0;
        const now = new Date();
        const nowIso = now.toISOString();
        let totalRecycled = 0;
        rules.forEach(rule => {
            const days = rule.days_no_follow || 7;
            const threshold = days * 24 * 60 * 60 * 1000;
            const candidates = LeadStorage.getByPool(rule.pool_id).filter(l => l.status === 'allocated' || l.status === 'following');
            candidates.forEach(lead => {
                const followUps = FollowUpStorage.getByLeadId(lead.lead_id);
                const lastActiveTime = followUps[0] ? followUps[0].create_time : (lead.update_time || lead.create_time);
                if (!lastActiveTime) return;
                const elapsed = now - new Date(lastActiveTime);
                if (elapsed >= threshold) {
                    LeadStorage.update({ lead_id: lead.lead_id, owner_id: '', status: 'pending', update_time: nowIso });
                    AssignmentStorage.add({ assign_id: generateId('asgn_'), lead_id: lead.lead_id, from_user: lead.owner_id || '', to_user: '', assign_type: 'auto_recycle', remark: `超过${days}天未跟进自动回收`, create_time: nowIso });
                    totalRecycled++;
                }
            });
        });
        if (totalRecycled > 0) {
            showToast(`自动回收完成：${totalRecycled} 条线索已退回公海`, 'info');
        }
        return totalRecycled;
    },

    // ============================================================
    // ===== Phase 3 跟进提醒 =====
    // ============================================================
    checkFollowUpReminders() {
        const candidates = LeadStorage.getAll().filter(l => l.status === 'allocated' || l.status === 'following');
        const nowIso = new Date().toISOString();
        let count = 0;
        candidates.forEach(lead => {
            const followUps = FollowUpStorage.getByLeadId(lead.lead_id);
            const last = followUps[0];
            if (!last || !last.next_follow_time) return;
            // 仅在下次跟进时间已到期时生成提醒
            if (last.next_follow_time > nowIso) return;
            // 当天去重
            if (NotificationStorage.existsTodayFollowRemind(lead.lead_id)) return;
            NotificationStorage.add({
                notify_id: generateId('notif_'),
                type: 'follow_remind',
                title: '跟进提醒',
                content: `${lead.lead_name} 需要跟进`,
                lead_id: lead.lead_id,
                read: false,
                create_time: nowIso
            });
            count++;
        });
        return count;
    },

    // ============================================================
    // ===== Phase 3 通知面板 =====
    // ============================================================
    toggleNotificationPanel() {
        const existing = document.getElementById('notificationPanel');
        if (existing) {
            this.closeNotificationPanel();
            return;
        }
        const area = this.container.querySelector('.leads-notification-area');
        if (!area) return;
        area.insertAdjacentHTML('beforeend', this.renderNotificationPanel());
        // 点击外部关闭
        setTimeout(() => {
            const closer = (ev) => {
                if (!ev.target.closest('#notificationPanel') && !ev.target.closest('#btnNotification')) {
                    this.closeNotificationPanel();
                    document.removeEventListener('click', closer);
                }
            };
            document.addEventListener('click', closer);
            this._notifCloser = closer;
        }, 0);
    },

    closeNotificationPanel() {
        const panel = document.getElementById('notificationPanel');
        if (panel) panel.remove();
        if (this._notifCloser) {
            document.removeEventListener('click', this._notifCloser);
            this._notifCloser = null;
        }
    },

    // ============================================================
    // ===== Phase 3 转化弹窗 =====
    // ============================================================
    showConvertModal(leadId) {
        const lead = LeadStorage.getById(leadId);
        if (!lead) { showToast('线索不存在', 'error'); return; }
        if (lead.status === 'converted') { showToast('该线索已转化', 'info'); return; }
        const todayDate = new Date(Date.now() + 7 * 86400000).toISOString().substring(0, 10);
        const html = `
        <div class="leads-modal-overlay" id="convertModal">
            <div class="leads-modal leads-modal-lg">
                <div class="modal-header"><h3><i class="fa-solid fa-handshake" style="color:#10b981;"></i> 线索转化</h3><button class="modal-close" data-close>&times;</button></div>
                <div class="modal-body">
                    <div class="convert-summary" style="background:rgba(212,175,55,0.08);border:1px solid rgba(212,175,55,0.25);padding:14px 16px;border-radius:8px;margin-bottom:16px;">
                        <div style="color:#d4af37;font-weight:600;font-size:15px;margin-bottom:8px;"><i class="fa-solid fa-bullseye"></i> ${escapeHtml(lead.lead_name)}</div>
                        <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;color:#cbd5e1;font-size:13px;">
                            <div>联系人：${escapeHtml(lead.contact_name)}</div>
                            <div>电话：${escapeHtml(lead.contact_phone)}</div>
                            <div>预计金额：¥${(lead.estimated_amount || 0).toLocaleString()}</div>
                            <div>来源：${escapeHtml(lead.lead_source)}</div>
                        </div>
                    </div>
                    <div class="form-group"><label style="color:#d4af37;font-weight:600;">转化选项</label>
                        <div style="display:flex;flex-direction:column;gap:10px;margin-top:8px;">
                            <label style="display:flex;align-items:center;gap:10px;padding:10px 12px;background:rgba(16,185,129,0.06);border:1px solid rgba(16,185,129,0.2);border-radius:8px;cursor:pointer;">
                                <input type="checkbox" id="convertToCustomer" checked> <i class="fa-solid fa-building" style="color:#10b981;"></i> <span>转为客户</span>
                                <span style="color:#94a3b8;font-size:12px;margin-left:auto;">创建客户记录</span>
                            </label>
                            <label style="display:flex;align-items:center;gap:10px;padding:10px 12px;background:rgba(59,130,246,0.06);border:1px solid rgba(59,130,246,0.2);border-radius:8px;cursor:pointer;">
                                <input type="checkbox" id="convertToOpportunity" checked> <i class="fa-solid fa-bullseye" style="color:#3b82f6;"></i> <span>转为商机</span>
                                <span style="color:#94a3b8;font-size:12px;margin-left:auto;">创建商机记录</span>
                            </label>
                            <label style="display:flex;align-items:center;gap:10px;padding:10px 12px;background:rgba(212,175,55,0.06);border:1px solid rgba(212,175,55,0.2);border-radius:8px;cursor:pointer;">
                                <input type="checkbox" id="convertCreateOrder"> <i class="fa-solid fa-file-invoice" style="color:#d4af37;"></i> <span>同时创建订单</span>
                                <span style="color:#94a3b8;font-size:12px;margin-left:auto;">同步到业务模块</span>
                            </label>
                        </div>
                    </div>
                    <div id="opportunityFields" class="form-row" style="display:flex;">
                        <div class="form-group"><label>预计成交日期</label><input type="date" id="convertCloseDate" value="${todayDate}"></div>
                        <div class="form-group"><label>商机阶段</label>
                            <select id="convertStage">
                                <option value="initial">初步接触</option>
                                <option value="negotiation">需求谈判</option>
                                <option value="proposal">方案报价</option>
                            </select>
                        </div>
                    </div>
                </div>
                <div class="modal-footer">
                    <button class="btn-outline" data-close>取消</button>
                    <button class="btn-accent" id="btnConfirmConvert" style="background:linear-gradient(135deg,#10b981,#059669);"><i class="fa-solid fa-check"></i> 确认转化</button>
                </div>
            </div>
        </div>`;
        document.body.insertAdjacentHTML('beforeend', html);
        const modal = document.getElementById('convertModal');
        requestAnimationFrame(() => modal.classList.add('active'));
        const oppCheckbox = document.getElementById('convertToOpportunity');
        const oppFieldsRow = document.getElementById('opportunityFields');
        const syncOppFields = () => { oppFieldsRow.style.display = oppCheckbox.checked ? '' : 'none'; };
        oppCheckbox.addEventListener('change', syncOppFields);
        syncOppFields();
        modal.addEventListener('click', (e) => {
            if (e.target.closest('[data-close]') || e.target === modal) { modal.remove(); return; }
            if (e.target.closest('#btnConfirmConvert')) { this.handleConfirmConvert(modal, lead); }
        });
    },

    handleConfirmConvert(modal, lead) {
        const toCustomer = document.getElementById('convertToCustomer').checked;
        const toOpp = document.getElementById('convertToOpportunity').checked;
        const createOrder = document.getElementById('convertCreateOrder').checked;
        if (!toCustomer && !toOpp) { showToast('请至少选择一项转化选项', 'error'); return; }
        const now = new Date().toISOString();
        let customerId = '';
        let customerName = '';
        let oppName = '';
        // 1. 转为客户
        if (toCustomer) {
            customerId = generateId('cust_');
            customerName = lead.lead_name;
            CustomerStorage.add({
                customer_id: customerId,
                customer_name: lead.lead_name,
                contact_name: lead.contact_name,
                contact_phone: lead.contact_phone,
                contact_email: lead.contact_email || '',
                industry: lead.industry || '',
                province: lead.province || '',
                city: lead.city || '',
                district: lead.district || '',
                address: lead.address || '',
                source_lead_id: lead.lead_id,
                source_lead_name: lead.lead_name,
                demand_desc: lead.demand_desc || '',
                estimated_amount: lead.estimated_amount || 0,
                tags: lead.tags || [],
                owner_id: lead.owner_id || getCurrentUser(),
                status: 'active',
                create_time: now,
                create_by: getCurrentUser(),
                deleted: false
            });
        }
        // 2. 转为商机
        if (toOpp) {
            const closeDate = document.getElementById('convertCloseDate').value;
            const stage = document.getElementById('convertStage').value || 'initial';
            oppName = lead.lead_name + ' - 商机';
            OpportunityStorage.add({
                opportunity_id: generateId('opp_'),
                opportunity_name: oppName,
                customer_id: customerId,
                customer_name: customerName,
                source_lead_id: lead.lead_id,
                source_lead_name: lead.lead_name,
                estimated_amount: lead.estimated_amount || 0,
                expected_close_date: closeDate ? new Date(closeDate).toISOString() : '',
                stage: stage,
                owner_id: lead.owner_id || getCurrentUser(),
                pool_id: lead.pool_id || '',
                create_time: now,
                create_by: getCurrentUser(),
                deleted: false
            });
        }
        // 3. 同时创建订单
        if (createOrder) {
            try {
                const orders = JSON.parse(localStorage.getItem('biz_orders') || '[]');
                const year = new Date().getFullYear();
                const seq = String(orders.length + 1).padStart(5, '0');
                orders.push({
                    id: 'ord_' + Date.now(),
                    order_no: 'ZH' + year + seq,
                    customer_name: lead.lead_name,
                    phone: lead.contact_phone,
                    service_type: 'business',
                    source: '线索转化',
                    amount: lead.estimated_amount || 0,
                    paid_amount: 0,
                    payment_due: '',
                    status: 'pending_payment',
                    overdue_days: 0,
                    extra: {},
                    created_at: now,
                    updated_at: now
                });
                localStorage.setItem('biz_orders', JSON.stringify(orders));
            } catch (err) { console.error('[Leads] create order error', err); }
        }
        // 4. 更新线索状态
        LeadStorage.update({ lead_id: lead.lead_id, status: 'converted', update_time: now });
        // 5. 记录跟进
        const tagText = [toCustomer ? '客户' : '', toOpp ? '商机' : ''].filter(Boolean).join('/');
        FollowUpStorage.add({
            follow_id: generateId('fu_'),
            biz_type: 'lead',
            biz_id: lead.lead_id,
            follow_type: '其他',
            follow_content: `线索已转化为${tagText}${createOrder ? '，并创建订单' : ''}`,
            customer_intent: 'high',
            next_follow_time: '',
            next_follow_content: '',
            create_time: now,
            create_by: getCurrentUser()
        });
        // 6. 创建通知
        NotificationStorage.add({
            notify_id: generateId('notif_'),
            type: 'convert',
            title: '线索转化成功',
            content: `${lead.lead_name} 已转化为${tagText}`,
            lead_id: lead.lead_id,
            read: false,
            create_time: now
        });
        showToast('线索转化成功', 'success');
        // Webhook 触发
        try { this.triggerWebhook('convert', { ...lead, status: 'converted' }); } catch (err) {}
        modal.remove();
        this.render();
    },

    // ============================================================
    // ===== Phase 3 拜访签到弹窗 =====
    // ============================================================
    showCheckInModal(leadId) {
        const lead = LeadStorage.getById(leadId);
        if (!lead) { showToast('线索不存在', 'error'); return; }
        const nowDisplay = new Date().toLocaleString('zh-CN');
        const tomorrow = new Date(Date.now() + 86400000).toISOString().substring(0, 10);
        const html = `
        <div class="leads-modal-overlay" id="checkInModal">
            <div class="leads-modal">
                <div class="modal-header"><h3><i class="fa-solid fa-map-marker-alt" style="color:#d4af37;"></i> 拜访签到</h3><button class="modal-close" data-close>&times;</button></div>
                <div class="modal-body">
                    <div style="background:rgba(212,175,55,0.08);border:1px solid rgba(212,175,55,0.2);padding:10px 14px;border-radius:8px;margin-bottom:16px;color:#d4af37;font-size:13px;">
                        <i class="fa-solid fa-info-circle"></i> 客户：${escapeHtml(lead.lead_name)} · 联系人：${escapeHtml(lead.contact_name)}
                    </div>
                    <div class="form-group"><label>签到时间</label><input type="text" id="checkInTime" value="${nowDisplay}" disabled style="background:rgba(255,255,255,0.04);color:#94a3b8;cursor:not-allowed;"></div>
                    <div class="form-group"><label>签到地址 <span class="required">*</span></label><input type="text" id="checkInAddress" placeholder="请输入当前拜访地点"></div>
                    <div class="form-group"><label>拜访内容 <span class="required">*</span></label><textarea id="checkInContent" rows="3" placeholder="本次拜访的详细内容..."></textarea></div>
                    <div class="form-group"><label>照片凭证</label>
                        <input type="file" id="checkInPhoto" accept="image/*" style="color:#cbd5e1;">
                        <div id="checkInPhotoName" style="margin-top:6px;color:#94a3b8;font-size:12px;"></div>
                    </div>
                    <div class="form-row">
                        <div class="form-group"><label>客户意向</label>
                            <select id="checkInIntent">
                                <option value="high">高</option>
                                <option value="medium" selected>中</option>
                                <option value="low">低</option>
                            </select>
                        </div>
                        <div class="form-group"><label>下次跟进时间</label><input type="date" id="checkInNextTime" value="${tomorrow}"></div>
                    </div>
                    <div class="form-group"><label>下次跟进内容</label><input type="text" id="checkInNextContent" placeholder="下次需要做什么..."></div>
                </div>
                <div class="modal-footer">
                    <button class="btn-outline" data-close>取消</button>
                    <button class="btn-accent" id="btnConfirmCheckIn"><i class="fa-solid fa-check"></i> 确认签到</button>
                </div>
            </div>
        </div>`;
        document.body.insertAdjacentHTML('beforeend', html);
        const modal = document.getElementById('checkInModal');
        requestAnimationFrame(() => modal.classList.add('active'));
        const photoInput = document.getElementById('checkInPhoto');
        photoInput.addEventListener('change', () => {
            const file = photoInput.files && photoInput.files[0];
            document.getElementById('checkInPhotoName').textContent = file ? `已选择：${file.name}` : '';
        });
        modal.addEventListener('click', (e) => {
            if (e.target.closest('[data-close]') || e.target === modal) { modal.remove(); return; }
            if (e.target.closest('#btnConfirmCheckIn')) {
                const address = document.getElementById('checkInAddress').value.trim();
                const content = document.getElementById('checkInContent').value.trim();
                if (!address) { showToast('请输入签到地址', 'error'); return; }
                if (!content) { showToast('请输入拜访内容', 'error'); return; }
                const intent = document.getElementById('checkInIntent').value;
                const nextTime = document.getElementById('checkInNextTime').value;
                const nextContent = document.getElementById('checkInNextContent').value.trim();
                const photoFile = photoInput.files && photoInput.files[0];
                const now = new Date().toISOString();
                FollowUpStorage.add({
                    follow_id: generateId('fu_'),
                    biz_type: 'lead',
                    biz_id: leadId,
                    follow_type: '拜访签到',
                    follow_content: content,
                    customer_intent: intent,
                    next_follow_time: nextTime ? new Date(nextTime).toISOString() : '',
                    next_follow_content: nextContent,
                    check_in_time: now,
                    check_in_address: address,
                    check_in_photo: photoFile ? photoFile.name : '',
                    create_time: now,
                    create_by: getCurrentUser()
                });
                if (lead.status === 'allocated') {
                    LeadStorage.update({ lead_id: leadId, status: 'following', update_time: now });
                } else {
                    LeadStorage.update({ lead_id: leadId, update_time: now });
                }
                showToast('签到成功', 'success');
                modal.remove();
                this.render();
            }
        });
    },

    // ============================================================
    // ===== Phase 3 批量分配弹窗 =====
    // ============================================================
    showBatchAssignModal(leadIds) {
        if (!leadIds || leadIds.length === 0) { showToast('请先选择要分配的线索', 'error'); return; }
        const pool = PoolStorage.getById(this.currentPoolId);
        const members = pool ? pool.members : ['王芳','李强','张伟','陈丽','赵敏'];
        const html = `
        <div class="leads-modal-overlay" id="batchAssignModal">
            <div class="leads-modal">
                <div class="modal-header"><h3><i class="fa-solid fa-share"></i> 批量分配线索</h3><button class="modal-close" data-close>&times;</button></div>
                <div class="modal-body">
                    <div style="background:rgba(59,130,246,0.08);border:1px solid rgba(59,130,246,0.2);padding:12px 16px;border-radius:8px;margin-bottom:16px;color:#93c5fd;">
                        <i class="fa-solid fa-info-circle"></i> 即将分配 <strong style="color:#fff;">${leadIds.length}</strong> 条线索。
                    </div>
                    <div class="form-group"><label>选择目标成员 <span class="required">*</span></label>
                        <select id="batchAssignTo">
                            <option value="">请选择成员</option>
                            ${members.map(m => `<option value="${escapeHtml(m)}">${escapeHtml(m)}</option>`).join('')}
                        </select>
                    </div>
                    <div class="form-group"><label>分配备注</label><textarea id="batchAssignRemark" rows="2" placeholder="可选备注..."></textarea></div>
                </div>
                <div class="modal-footer">
                    <button class="btn-outline" data-close>取消</button>
                    <button class="btn-accent" id="btnConfirmBatchAssign">确认分配</button>
                </div>
            </div>
        </div>`;
        document.body.insertAdjacentHTML('beforeend', html);
        const modal = document.getElementById('batchAssignModal');
        requestAnimationFrame(() => modal.classList.add('active'));
        modal.addEventListener('click', (e) => {
            if (e.target.closest('[data-close]') || e.target === modal) { modal.remove(); return; }
            if (e.target.closest('#btnConfirmBatchAssign')) {
                const to = document.getElementById('batchAssignTo').value;
                if (!to) { showToast('请选择分配对象', 'error'); return; }
                const remark = document.getElementById('batchAssignRemark').value.trim();
                const now = new Date().toISOString();
                let count = 0;
                leadIds.forEach(id => {
                    const lead = LeadStorage.getById(id);
                    if (!lead) return;
                    LeadStorage.update({ lead_id: id, owner_id: to, status: 'allocated', update_time: now });
                    AssignmentStorage.add({ assign_id: generateId('asgn_'), lead_id: id, from_user: getCurrentUser(), to_user: to, assign_type: 'batch_assign', remark: remark, create_time: now });
                    count++;
                });
                NotificationStorage.add({
                    notify_id: generateId('notif_'),
                    type: 'assign',
                    title: '批量分配完成',
                    content: `已将 ${count} 条线索分配给 ${to}`,
                    lead_id: '',
                    read: false,
                    create_time: now
                });
                showToast(`已成功分配 ${count} 条线索给 ${to}`, 'success');
                modal.remove();
                this.selectedLeadIds = [];
                this.render();
            }
        });
    },

    // ============================================================
    // ===== Phase 3 批量转移弹窗 =====
    // ============================================================
    showBatchTransferModal(leadIds) {
        if (!leadIds || leadIds.length === 0) { showToast('请先选择要转移的线索', 'error'); return; }
        // 从所选线索的所在池中提取成员
        const memberSet = new Set();
        leadIds.forEach(id => {
            const lead = LeadStorage.getById(id);
            if (lead) {
                const pool = PoolStorage.getById(lead.pool_id);
                if (pool && pool.members) pool.members.forEach(m => memberSet.add(m));
            }
        });
        if (memberSet.size === 0) {
            ['王芳','李强','张伟','陈丽','赵敏'].forEach(m => memberSet.add(m));
        }
        const me = getCurrentUser();
        const members = Array.from(memberSet).filter(m => m !== me);
        const html = `
        <div class="leads-modal-overlay" id="batchTransferModal">
            <div class="leads-modal">
                <div class="modal-header"><h3><i class="fa-solid fa-arrow-right-arrow-left"></i> 批量转移线索</h3><button class="modal-close" data-close>&times;</button></div>
                <div class="modal-body">
                    <div style="background:rgba(212,175,55,0.08);border:1px solid rgba(212,175,55,0.25);padding:12px 16px;border-radius:8px;margin-bottom:16px;color:#d4af37;">
                        <i class="fa-solid fa-info-circle"></i> 即将转移 <strong style="color:#fff;">${leadIds.length}</strong> 条线索给其他成员。
                    </div>
                    <div class="form-group"><label>目标成员 <span class="required">*</span></label>
                        <select id="batchTransferTo">
                            <option value="">请选择成员</option>
                            ${members.map(m => `<option value="${escapeHtml(m)}">${escapeHtml(m)}</option>`).join('')}
                        </select>
                    </div>
                    <div class="form-group"><label>转移原因 <span class="required">*</span></label><textarea id="batchTransferReason" rows="3" placeholder="请说明转移原因..."></textarea></div>
                </div>
                <div class="modal-footer">
                    <button class="btn-outline" data-close>取消</button>
                    <button class="btn-accent" id="btnConfirmBatchTransfer">确认转移</button>
                </div>
            </div>
        </div>`;
        document.body.insertAdjacentHTML('beforeend', html);
        const modal = document.getElementById('batchTransferModal');
        requestAnimationFrame(() => modal.classList.add('active'));
        modal.addEventListener('click', (e) => {
            if (e.target.closest('[data-close]') || e.target === modal) { modal.remove(); return; }
            if (e.target.closest('#btnConfirmBatchTransfer')) {
                const to = document.getElementById('batchTransferTo').value;
                if (!to) { showToast('请选择转移对象', 'error'); return; }
                const reason = document.getElementById('batchTransferReason').value.trim();
                if (!reason) { showToast('请填写转移原因', 'error'); return; }
                const now = new Date().toISOString();
                let count = 0;
                leadIds.forEach(id => {
                    const lead = LeadStorage.getById(id);
                    if (!lead) return;
                    LeadStorage.update({ lead_id: id, owner_id: to, update_time: now });
                    AssignmentStorage.add({ assign_id: generateId('asgn_'), lead_id: id, from_user: getCurrentUser(), to_user: to, assign_type: 'transfer', remark: reason, create_time: now });
                    count++;
                });
                showToast(`已成功转移 ${count} 条线索给 ${to}`, 'success');
                modal.remove();
                this.selectedMyLeadIds = [];
                this.render();
            }
        });
    },

    // ============================================================
    // ===== Phase 3 批量导出 CSV =====
    // ============================================================
    handleBatchExport(leadIds) {
        if (!leadIds || leadIds.length === 0) { showToast('请先选择要导出的线索', 'error'); return; }
        const escapeCsv = (val) => {
            const s = (val == null ? '' : String(val));
            if (/[",\n]/.test(s)) return '"' + s.replace(/"/g, '""') + '"';
            return s;
        };
        const headers = ['线索名称','联系人','电话','邮箱','来源','行业','状态','负责人','创建时间'];
        const rows = [headers.join(',')];
        let count = 0;
        leadIds.forEach(id => {
            const lead = LeadStorage.getById(id);
            if (!lead) return;
            rows.push([
                escapeCsv(lead.lead_name),
                escapeCsv(lead.contact_name),
                escapeCsv(lead.contact_phone),
                escapeCsv(lead.contact_email),
                escapeCsv(lead.lead_source),
                escapeCsv(lead.industry),
                escapeCsv(STATUS_MAP[lead.status] || lead.status),
                escapeCsv(lead.owner_id),
                escapeCsv(new Date(lead.create_time).toLocaleString('zh-CN'))
            ].join(','));
            count++;
        });
        const csv = rows.join('\n');
        const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        const dateStr = new Date().toISOString().substring(0, 10);
        a.href = url;
        a.download = `线索导出_${dateStr}.csv`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        showToast(`已导出 ${count} 条线索`, 'success');
    },

    // ============================================================
    // ===== Phase 3 统计数据 =====
    // ============================================================
    getStats() {
        const leads = LeadStorage.getAll();
        const now = new Date();
        const thisMonth = now.getFullYear() + '-' + String(now.getMonth() + 1).padStart(2, '0');
        const distribution = { pending: 0, allocated: 0, following: 0, converted: 0, returned: 0, closed: 0 };
        leads.forEach(l => {
            if (distribution.hasOwnProperty(l.status)) distribution[l.status]++;
        });
        const total = leads.length;
        const converted = distribution.converted || 0;
        const conversionRate = total > 0 ? ((converted / total) * 100).toFixed(1) + '%' : '0.0%';
        const thisMonthNew = leads.filter(l => (l.create_time || '').startsWith(thisMonth)).length;
        const pools = PoolStorage.getAll().map(p => ({
            pool_id: p.pool_id,
            pool_name: p.pool_name,
            leadCount: LeadStorage.getByPool(p.pool_id).length
        }));
        return {
            total,
            statusDistribution: distribution,
            thisMonthNew,
            conversionRate,
            pools
        };
    },

    // ============================================================
    // ===== Phase 4 列配置与单元格渲染 =====
    // ============================================================
    getColumns(viewType) {
        const stored = ColumnConfigStorage.get(viewType);
        const customFields = CustomFieldStorage.getAll().filter(f => f.enabled).map(f => ({
            key: 'cf:' + f.field_id,
            label: f.field_name,
            isCustom: true,
            field: f
        }));
        const fixedKeys = stored ? stored : (viewType === 'pool' ? DEFAULT_POOL_COLUMNS : DEFAULT_MY_COLUMNS);
        const allMap = {};
        ALL_COLUMNS.forEach(c => { allMap[c.key] = c; });
        customFields.forEach(c => { allMap[c.key] = c; });
        return fixedKeys.map(k => allMap[k]).filter(Boolean);
    },

    renderCellValue(lead, col, isMyView) {
        const k = col.key;
        if (col.isCustom) {
            const data = lead.custom_data || {};
            const v = data[col.field.field_id];
            if (v == null || v === '') return '<span class="text-muted">-</span>';
            if (col.field.field_type === 'multiselect' && Array.isArray(v)) {
                return v.map(x => `<span class="tag-chip">${escapeHtml(x)}</span>`).join(' ');
            }
            if (col.field.field_type === 'date') {
                return escapeHtml(new Date(v).toLocaleDateString('zh-CN'));
            }
            return escapeHtml(String(v));
        }
        if (k === 'lead_name') {
            return isMyView
                ? `<span class="lead-name-link" data-lead-id="${lead.lead_id}">${escapeHtml(lead.lead_name)}</span>`
                : `<span class="lead-name-cell">${escapeHtml(lead.lead_name)}</span>`;
        }
        if (k === 'priority') {
            return `<span class="priority-badge" style="color:${PRIORITY_COLORS[lead.priority]}">${PRIORITY_MAP[lead.priority] || '中'}</span>`;
        }
        if (k === 'status') {
            return `<span class="status-badge" style="background:${STATUS_COLORS[lead.status]}20;color:${STATUS_COLORS[lead.status]}">${STATUS_MAP[lead.status] || lead.status}</span>`;
        }
        if (k === 'ai_score') {
            const score = lead.ai_score || 0;
            const grade = lead.ai_grade || this.getScoreGrade(score);
            const colorMap = { A: '#10b981', B: '#3b82f6', C: '#f59e0b', D: '#94a3b8' };
            const c = colorMap[grade] || '#94a3b8';
            return `<span style="display:inline-flex;align-items:center;gap:6px;"><span style="width:8px;height:8px;border-radius:50%;background:${c};"></span><strong style="color:${c};">${score}</strong><span style="color:#94a3b8;font-size:11px;">${grade}</span></span>`;
        }
        if (k === 'estimated_amount') {
            return '¥' + (lead.estimated_amount || 0).toLocaleString();
        }
        if (k === 'create_time' || k === 'update_time') {
            return lead[k] ? new Date(lead[k]).toLocaleDateString('zh-CN') : '-';
        }
        return escapeHtml(lead[k] || '') || '<span class="text-muted">-</span>';
    },

    showColumnConfigModal(viewType) {
        const current = this.getColumns(viewType).map(c => c.key);
        const customFields = CustomFieldStorage.getAll().filter(f => f.enabled).map(f => ({
            key: 'cf:' + f.field_id, label: f.field_name
        }));
        const allList = ALL_COLUMNS.concat(customFields);
        // 以当前顺序在前，未选中的在后
        const ordered = [];
        current.forEach(k => {
            const f = allList.find(c => c.key === k);
            if (f) ordered.push({ ...f, checked: true });
        });
        allList.forEach(c => {
            if (current.indexOf(c.key) === -1) ordered.push({ ...c, checked: false });
        });
        const items = ordered.map((c, i) => `
            <div class="col-cfg-item" data-key="${c.key}" style="display:flex;align-items:center;gap:10px;padding:10px 12px;border:1px solid rgba(212,175,55,0.18);border-radius:8px;margin-bottom:8px;background:rgba(212,175,55,0.04);">
                <input type="checkbox" ${c.checked ? 'checked' : ''} ${c.fixed ? 'disabled' : ''} class="col-cfg-check">
                <span style="flex:1;color:#e2e8f0;">${escapeHtml(c.label)}${c.fixed ? '<span style="margin-left:8px;color:#d4af37;font-size:11px;">[固定]</span>' : ''}</span>
                <button class="btn-icon col-cfg-up" title="上移" style="background:none;border:1px solid rgba(212,175,55,0.25);color:#d4af37;border-radius:4px;width:26px;height:26px;cursor:pointer;"><i class="fa-solid fa-arrow-up"></i></button>
                <button class="btn-icon col-cfg-down" title="下移" style="background:none;border:1px solid rgba(212,175,55,0.25);color:#d4af37;border-radius:4px;width:26px;height:26px;cursor:pointer;"><i class="fa-solid fa-arrow-down"></i></button>
            </div>`).join('');
        const html = `
        <div class="leads-modal-overlay" id="colCfgModal">
            <div class="leads-modal">
                <div class="modal-header"><h3><i class="fa-solid fa-columns"></i> 列设置（${viewType === 'pool' ? '公海' : '私海'}）</h3><button class="modal-close" data-close>&times;</button></div>
                <div class="modal-body" style="max-height:480px;overflow-y:auto;">
                    <div style="color:#94a3b8;font-size:12px;margin-bottom:12px;"><i class="fa-solid fa-info-circle"></i> 勾选要显示的列，使用上下箭头调整顺序。名称列为固定列不可取消。</div>
                    <div id="colCfgList">${items}</div>
                </div>
                <div class="modal-footer">
                    <button class="btn-outline" data-close>取消</button>
                    <button class="btn-accent" id="btnSaveColCfg">保存</button>
                </div>
            </div>
        </div>`;
        document.body.insertAdjacentHTML('beforeend', html);
        const modal = document.getElementById('colCfgModal');
        requestAnimationFrame(() => modal.classList.add('active'));
        modal.addEventListener('click', (e) => {
            if (e.target.closest('[data-close]') || e.target === modal) { modal.remove(); return; }
            const item = e.target.closest('.col-cfg-item');
            if (e.target.closest('.col-cfg-up') && item) {
                const prev = item.previousElementSibling;
                if (prev) item.parentNode.insertBefore(item, prev);
                return;
            }
            if (e.target.closest('.col-cfg-down') && item) {
                const next = item.nextElementSibling;
                if (next) item.parentNode.insertBefore(next, item);
                return;
            }
            if (e.target.closest('#btnSaveColCfg')) {
                const list = modal.querySelectorAll('.col-cfg-item');
                const selected = [];
                list.forEach(it => {
                    const cb = it.querySelector('.col-cfg-check');
                    if (cb && (cb.checked || cb.disabled)) selected.push(it.dataset.key);
                });
                if (selected.indexOf('lead_name') === -1) selected.unshift('lead_name');
                ColumnConfigStorage.set(viewType, selected);
                showToast('列设置已保存', 'success');
                modal.remove();
                this.render();
            }
        });
    },

    // ============================================================
    // ===== Phase 4 自定义字段表单与详情呈现 =====
    // ============================================================
    renderCustomFieldsForLead(lead) {
        const poolId = lead ? lead.pool_id : (this.currentPoolId || 'global');
        const fields = CustomFieldStorage.getByPool(poolId);
        if (!fields || fields.length === 0) return '';
        const data = (lead && lead.custom_data) || {};
        let html = '<div class="form-group" style="border-top:1px dashed rgba(212,175,55,0.25);margin-top:14px;padding-top:14px;"><label style="color:#d4af37;"><i class="fa-solid fa-star"></i> 自定义字段</label></div>';
        fields.forEach(f => {
            const v = data[f.field_id];
            const required = f.field_config && f.field_config.required;
            const placeholder = (f.field_config && f.field_config.placeholder) || '';
            const star = required ? ' <span class="required">*</span>' : '';
            html += `<div class="form-group" data-cf-id="${f.field_id}"><label>${escapeHtml(f.field_name)}${star}</label>`;
            if (f.field_type === 'text' || f.field_type === 'phone' || f.field_type === 'email') {
                html += `<input type="text" class="cf-input" data-cf-id="${f.field_id}" value="${escapeHtml(v || '')}" placeholder="${escapeHtml(placeholder)}">`;
            } else if (f.field_type === 'number') {
                html += `<input type="number" class="cf-input" data-cf-id="${f.field_id}" value="${v != null ? v : ''}" placeholder="${escapeHtml(placeholder)}">`;
            } else if (f.field_type === 'date') {
                const dv = v ? String(v).substring(0, 10) : '';
                html += `<input type="date" class="cf-input" data-cf-id="${f.field_id}" value="${dv}">`;
            } else if (f.field_type === 'select') {
                const opts = (f.field_config && f.field_config.options) || [];
                html += `<select class="cf-input" data-cf-id="${f.field_id}"><option value="">${escapeHtml(placeholder || '请选择')}</option>`;
                opts.forEach(o => {
                    html += `<option value="${escapeHtml(o.label)}" ${v === o.label ? 'selected' : ''}>${escapeHtml(o.label)}</option>`;
                });
                html += '</select>';
            } else if (f.field_type === 'multiselect') {
                const opts = (f.field_config && f.field_config.options) || [];
                const arr = Array.isArray(v) ? v : [];
                html += '<div class="cf-multi" style="display:flex;flex-wrap:wrap;gap:8px;">';
                opts.forEach(o => {
                    const checked = arr.indexOf(o.label) !== -1 ? 'checked' : '';
                    html += `<label style="display:inline-flex;align-items:center;gap:4px;color:#cbd5e1;"><input type="checkbox" class="cf-multi-input" data-cf-id="${f.field_id}" value="${escapeHtml(o.label)}" ${checked}> ${escapeHtml(o.label)}</label>`;
                });
                html += '</div>';
            }
            html += '</div>';
        });
        return html;
    },

    collectCustomFieldData(existingLead) {
        const result = (existingLead && existingLead.custom_data) ? { ...existingLead.custom_data } : {};
        const poolId = (existingLead && existingLead.pool_id) || this.currentPoolId || 'global';
        const fields = CustomFieldStorage.getByPool(poolId);
        fields.forEach(f => {
            if (f.field_type === 'multiselect') {
                const arr = [];
                document.querySelectorAll(`.cf-multi-input[data-cf-id="${f.field_id}"]:checked`).forEach(cb => arr.push(cb.value));
                result[f.field_id] = arr;
            } else {
                const el = document.querySelector(`.cf-input[data-cf-id="${f.field_id}"]`);
                if (el) result[f.field_id] = el.value;
            }
        });
        return result;
    },

    renderCustomFieldDetail(lead) {
        const fields = CustomFieldStorage.getByPool(lead.pool_id);
        if (!fields || fields.length === 0) return '';
        const data = lead.custom_data || {};
        return fields.map(f => {
            let v = data[f.field_id];
            if (Array.isArray(v)) v = v.join('、');
            if (!v) v = '-';
            else if (f.field_type === 'date') v = new Date(v).toLocaleDateString('zh-CN');
            return `<div class="detail-item"><label>${escapeHtml(f.field_name)}</label><span>${escapeHtml(String(v))}</span></div>`;
        }).join('');
    },

    // ============================================================
    // ===== Phase 4 自定义字段管理面板 =====
    // ============================================================
    renderCustomFieldPanel() {
        const fields = CustomFieldStorage.getAll();
        const pools = PoolStorage.getAll();
        const poolMap = {};
        pools.forEach(p => { poolMap[p.pool_id] = p.pool_name; });
        poolMap['global'] = '全局';
        const typeIcon = {
            text: 'fa-font', number: 'fa-hashtag', select: 'fa-list', multiselect: 'fa-list-check',
            date: 'fa-calendar', phone: 'fa-phone', email: 'fa-envelope'
        };
        const typeLabel = { text: '文本', number: '数字', select: '单选', multiselect: '多选', date: '日期', phone: '电话', email: '邮箱' };
        let rows = '';
        if (fields.length === 0) {
            rows = '<tr><td colspan="6" class="empty-cell">暂无自定义字段，点击右上角“新增字段”</td></tr>';
        } else {
            fields.forEach(f => {
                const icon = typeIcon[f.field_type] || 'fa-font';
                rows += `
                <tr>
                    <td>${f.sort_order || 0}</td>
                    <td><i class="fa-solid ${icon}" style="color:#d4af37;margin-right:6px;"></i>${escapeHtml(f.field_name)}</td>
                    <td><span style="padding:2px 8px;background:rgba(212,175,55,0.12);color:#d4af37;border-radius:10px;font-size:12px;">${typeLabel[f.field_type] || f.field_type}</span></td>
                    <td>${escapeHtml(poolMap[f.pool_id] || f.pool_id)}</td>
                    <td>
                        <button class="btn-sm btn-toggle-cfield" data-field-id="${f.field_id}" style="background:${f.enabled ? 'rgba(16,185,129,0.18)' : 'rgba(148,163,184,0.18)'};color:${f.enabled ? '#10b981' : '#94a3b8'};">${f.enabled ? '已启用' : '已禁用'}</button>
                    </td>
                    <td class="action-cell">
                        <button class="btn-sm btn-edit-cfield" data-field-id="${f.field_id}">编辑</button>
                        <button class="btn-sm btn-del-cfield" data-field-id="${f.field_id}" style="color:#ef4444;">删除</button>
                    </td>
                </tr>`;
            });
        }
        return `
        <div class="rules-section" style="margin-top:24px;background:linear-gradient(135deg,#1a1a1a,#222);border:1px solid rgba(212,175,55,0.25);border-radius:12px;padding:20px;">
            <div class="rules-panel-header" style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px;border-bottom:1px solid rgba(212,175,55,0.15);padding-bottom:12px;">
                <h3 style="color:#d4af37;font-size:16px;margin:0;"><i class="fa-solid fa-list-ol"></i> 自定义字段管理</h3>
                <button class="btn-accent" id="btnAddCustomField"><i class="fa-solid fa-plus"></i> 新增字段</button>
            </div>
            <div class="leads-table-wrapper">
                <table class="leads-table">
                    <thead><tr><th style="width:70px;">排序</th><th>字段名称</th><th style="width:100px;">类型</th><th style="width:160px;">关联池</th><th style="width:120px;">状态</th><th style="width:140px;">操作</th></tr></thead>
                    <tbody>${rows}</tbody>
                </table>
            </div>
        </div>`;
    },

    showCustomFieldModal(fieldId) {
        const field = fieldId ? CustomFieldStorage.getById(fieldId) : null;
        const title = field ? '编辑自定义字段' : '新增自定义字段';
        const pools = PoolStorage.getAll();
        const types = [
            { v: 'text', l: '文本' }, { v: 'number', l: '数字' },
            { v: 'select', l: '单选' }, { v: 'multiselect', l: '多选' },
            { v: 'date', l: '日期' }, { v: 'phone', l: '电话' }, { v: 'email', l: '邮箱' }
        ];
        const cfg = (field && field.field_config) || { options: [], required: false, placeholder: '' };
        const opts = cfg.options || [];
        const html = `
        <div class="leads-modal-overlay" id="cfModal">
            <div class="leads-modal leads-modal-lg">
                <div class="modal-header"><h3>${title}</h3><button class="modal-close" data-close>&times;</button></div>
                <div class="modal-body">
                    <div class="form-row">
                        <div class="form-group"><label>字段名称 <span class="required">*</span></label><input type="text" id="cfName" value="${escapeHtml(field ? field.field_name : '')}" placeholder="如：合作模式"></div>
                        <div class="form-group"><label>字段类型 <span class="required">*</span></label>
                            <select id="cfType">${types.map(t => `<option value="${t.v}" ${field && field.field_type === t.v ? 'selected' : ''}>${t.l}</option>`).join('')}</select>
                        </div>
                    </div>
                    <div class="form-row">
                        <div class="form-group"><label>关联线索池</label>
                            <select id="cfPool">
                                <option value="global" ${field && field.pool_id === 'global' ? 'selected' : (!field ? 'selected' : '')}>全局（所有池）</option>
                                ${pools.map(p => `<option value="${p.pool_id}" ${field && field.pool_id === p.pool_id ? 'selected' : ''}>${escapeHtml(p.pool_name)}</option>`).join('')}
                            </select>
                        </div>
                        <div class="form-group"><label>排序</label><input type="number" id="cfOrder" value="${field ? field.sort_order : (CustomFieldStorage.getAll().length + 1)}"></div>
                    </div>
                    <div class="form-group"><label>占位提示</label><input type="text" id="cfPlaceholder" value="${escapeHtml(cfg.placeholder || '')}" placeholder="如：请选择合作模式"></div>
                    <div class="form-group" id="cfOptionsWrap" style="display:none;"><label>选项管理</label>
                        <div id="cfOptionsList">${opts.map(o => `
                            <div class="cf-opt-item" style="display:flex;gap:8px;align-items:center;margin-bottom:6px;">
                                <input type="text" class="cf-opt-input" value="${escapeHtml(o.label)}" placeholder="选项名" style="flex:1;">
                                <button class="btn-sm cf-opt-del" type="button" style="color:#ef4444;">删除</button>
                            </div>`).join('')}</div>
                        <button class="btn-outline" id="cfOptAdd" type="button" style="margin-top:6px;"><i class="fa-solid fa-plus"></i> 添加选项</button>
                    </div>
                    <div class="form-group">
                        <label style="display:flex;align-items:center;gap:8px;"><input type="checkbox" id="cfRequired" ${cfg.required ? 'checked' : ''}> 是否必填</label>
                    </div>
                </div>
                <div class="modal-footer">
                    <button class="btn-outline" data-close>取消</button>
                    <button class="btn-accent" id="btnSaveCField">保存</button>
                </div>
            </div>
        </div>`;
        document.body.insertAdjacentHTML('beforeend', html);
        const modal = document.getElementById('cfModal');
        requestAnimationFrame(() => modal.classList.add('active'));
        const typeSel = document.getElementById('cfType');
        const optsWrap = document.getElementById('cfOptionsWrap');
        const syncOptsVisible = () => {
            const v = typeSel.value;
            optsWrap.style.display = (v === 'select' || v === 'multiselect') ? '' : 'none';
        };
        typeSel.addEventListener('change', syncOptsVisible);
        syncOptsVisible();
        modal.addEventListener('click', (e) => {
            if (e.target.closest('[data-close]') || e.target === modal) { modal.remove(); return; }
            if (e.target.closest('#cfOptAdd')) {
                const div = document.createElement('div');
                div.className = 'cf-opt-item';
                div.style.cssText = 'display:flex;gap:8px;align-items:center;margin-bottom:6px;';
                div.innerHTML = '<input type="text" class="cf-opt-input" placeholder="选项名" style="flex:1;"><button class="btn-sm cf-opt-del" type="button" style="color:#ef4444;">删除</button>';
                document.getElementById('cfOptionsList').appendChild(div);
                return;
            }
            if (e.target.closest('.cf-opt-del')) {
                e.target.closest('.cf-opt-item').remove();
                return;
            }
            if (e.target.closest('#btnSaveCField')) {
                const name = document.getElementById('cfName').value.trim();
                if (!name) { showToast('请输入字段名称', 'error'); return; }
                const type = typeSel.value;
                const poolId = document.getElementById('cfPool').value || 'global';
                const order = parseInt(document.getElementById('cfOrder').value, 10) || 0;
                const placeholder = document.getElementById('cfPlaceholder').value.trim();
                const required = document.getElementById('cfRequired').checked;
                let options = [];
                if (type === 'select' || type === 'multiselect') {
                    document.querySelectorAll('.cf-opt-input').forEach((inp, idx) => {
                        const v = inp.value.trim();
                        if (v) options.push({ label: v, color: idx % 6 });
                    });
                    if (options.length === 0) { showToast('请至少添加一个选项', 'error'); return; }
                }
                const cfg = { options, required, placeholder };
                if (field) {
                    CustomFieldStorage.update({ field_id: field.field_id, field_name: name, field_type: type, pool_id: poolId, sort_order: order, field_config: cfg });
                    showToast('自定义字段已更新', 'success');
                } else {
                    CustomFieldStorage.add({
                        field_id: generateId('cf_'), pool_id: poolId, field_name: name, field_type: type,
                        field_config: cfg, sort_order: order, enabled: true,
                        create_time: new Date().toISOString()
                    });
                    showToast('自定义字段已新增', 'success');
                }
                modal.remove();
                this.render();
            }
        });
    },

    // ============================================================
    // ===== Phase 4 API对接面板 =====
    // ============================================================
    renderAPIPanel() {
        const cfg = ApiConfigStorage.get();
        const events = cfg.events || {};
        const baseUrl = (typeof location !== 'undefined' ? location.origin : 'https://crm.example.com') + '/api/leads';
        const endpoints = [
            {
                method: 'POST', path: '/api/leads', name: '创建线索',
                req: { lead_name: '示例公司', contact_name: '张三', contact_phone: '13800138000', lead_source: 'API', industry: '科技', estimated_amount: 100000 },
                res: { code: 0, message: 'success', data: { lead_id: 'lead_xxx', status: 'pending' } }
            },
            {
                method: 'POST', path: '/api/leads/batch', name: '批量创建',
                req: { leads: [{ lead_name: '示例 A', contact_name: '联系人 A', contact_phone: '13800138001' }, { lead_name: '示例 B', contact_name: '联系人 B', contact_phone: '13800138002' }] },
                res: { code: 0, data: { success: 2, duplicates: 0, errors: 0 } }
            },
            {
                method: 'GET', path: '/api/leads?status=pending&page=1&size=20', name: '查询线索',
                req: null,
                res: { code: 0, data: { total: 100, list: [{ lead_id: 'lead_xxx', lead_name: '示例公司' }] } }
            },
            {
                method: 'PUT', path: '/api/leads/{lead_id}', name: '更新线索',
                req: { status: 'allocated', owner_id: '张伟', estimated_amount: 200000 },
                res: { code: 0, message: 'updated' }
            }
        ];
        const cards = endpoints.map(ep => {
            const methodColor = { GET: '#10b981', POST: '#3b82f6', PUT: '#f59e0b', DELETE: '#ef4444' }[ep.method] || '#94a3b8';
            return `
            <div class="api-card" style="background:rgba(212,175,55,0.04);border:1px solid rgba(212,175,55,0.18);border-radius:8px;padding:14px;margin-bottom:12px;">
                <div style="display:flex;align-items:center;gap:10px;margin-bottom:10px;">
                    <span style="padding:3px 10px;border-radius:4px;background:${methodColor}22;color:${methodColor};font-weight:600;font-size:12px;font-family:monospace;">${ep.method}</span>
                    <code style="color:#e2e8f0;font-family:monospace;font-size:13px;">${ep.path}</code>
                    <span style="color:#94a3b8;font-size:12px;margin-left:auto;">${ep.name}</span>
                </div>
                ${ep.req ? `<details style="margin-bottom:6px;"><summary style="color:#d4af37;cursor:pointer;font-size:12px;">请求示例</summary><pre style="background:#0f0f0f;border:1px solid rgba(212,175,55,0.15);border-radius:6px;padding:10px;color:#cbd5e1;font-size:12px;overflow:auto;margin:6px 0 0 0;"><code>${escapeHtml(JSON.stringify(ep.req, null, 2))}</code></pre></details>` : ''}
                <details><summary style="color:#d4af37;cursor:pointer;font-size:12px;">响应示例</summary><pre style="background:#0f0f0f;border:1px solid rgba(212,175,55,0.15);border-radius:6px;padding:10px;color:#cbd5e1;font-size:12px;overflow:auto;margin:6px 0 0 0;"><code>${escapeHtml(JSON.stringify(ep.res, null, 2))}</code></pre></details>
            </div>`;
        }).join('');
        return `
        <div class="rules-section" style="margin-top:24px;background:linear-gradient(135deg,#1a1a1a,#222);border:1px solid rgba(212,175,55,0.25);border-radius:12px;padding:20px;">
            <div class="rules-panel-header" style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px;border-bottom:1px solid rgba(212,175,55,0.15);padding-bottom:12px;">
                <h3 style="color:#d4af37;font-size:16px;margin:0;"><i class="fa-solid fa-plug"></i> API 对接</h3>
                <span style="color:#94a3b8;font-size:12px;"><i class="fa-solid fa-link"></i> Base URL: ${escapeHtml(baseUrl)}</span>
            </div>
            <div class="api-endpoints" style="margin-bottom:18px;">${cards}</div>
            <div class="webhook-config" style="background:rgba(59,130,246,0.06);border:1px solid rgba(59,130,246,0.2);border-radius:8px;padding:14px;">
                <h4 style="color:#3b82f6;margin:0 0 10px 0;font-size:14px;"><i class="fa-solid fa-bolt"></i> Webhook 配置</h4>
                <div class="form-group"><label>Webhook URL</label><input type="text" id="webhookUrl" value="${escapeHtml(cfg.webhook_url || '')}" placeholder="https://your-server.com/hooks/leads"></div>
                <div class="form-group"><label>触发事件</label>
                    <div style="display:flex;gap:14px;flex-wrap:wrap;color:#cbd5e1;">
                        <label><input type="checkbox" class="webhook-event" data-event="create" ${events.create ? 'checked' : ''}> 新增</label>
                        <label><input type="checkbox" class="webhook-event" data-event="assign" ${events.assign ? 'checked' : ''}> 分配</label>
                        <label><input type="checkbox" class="webhook-event" data-event="convert" ${events.convert ? 'checked' : ''}> 转化</label>
                        <label><input type="checkbox" class="webhook-event" data-event="return" ${events.return ? 'checked' : ''}> 退回</label>
                    </div>
                </div>
                <div style="text-align:right;"><button class="btn-accent" id="btnSaveWebhook">保存 Webhook</button></div>
            </div>
        </div>`;
    },

    handleSaveWebhook() {
        const url = document.getElementById('webhookUrl').value.trim();
        const events = {};
        document.querySelectorAll('.webhook-event').forEach(cb => { events[cb.dataset.event] = cb.checked; });
        ApiConfigStorage.save({ webhook_url: url, events });
        showToast('Webhook 配置已保存', 'success');
    },

    triggerWebhook(event, data) {
        try {
            const cfg = ApiConfigStorage.get();
            if (!cfg.webhook_url || !cfg.events || !cfg.events[event]) return;
            console.log(`[Webhook] POST ${cfg.webhook_url}`, { event, data });
        } catch (e) { console.error('[Leads] webhook error', e); }
    },

    importFromAPI(dataArray) {
        if (!Array.isArray(dataArray)) return { success: 0, duplicates: 0, errors: 0 };
        let success = 0, duplicates = 0, errors = 0;
        const now = new Date().toISOString();
        dataArray.forEach(item => {
            if (!item || !item.contact_phone) { errors++; return; }
            const dup = LeadStorage.checkDuplicate(item.contact_phone);
            if (dup) { duplicates++; return; }
            const lead = {
                lead_id: generateId('lead_'),
                lead_name: item.lead_name || item.company_name || '未命名',
                contact_name: item.contact_name || item.contact || '',
                contact_phone: item.contact_phone,
                contact_email: item.contact_email || item.email || '',
                lead_source: item.lead_source || 'API',
                industry: item.industry || '',
                province: item.province || '',
                city: item.city || '',
                district: item.district || '',
                demand_desc: item.demand_desc || item.description || '',
                estimated_amount: parseFloat(item.estimated_amount) || 0,
                priority: item.priority || 'medium',
                tags: Array.isArray(item.tags) ? item.tags : [],
                custom_data: item.custom_data || {},
                status: 'pending',
                owner_id: '',
                pool_id: item.pool_id || 'pool_001',
                create_time: now,
                update_time: now,
                create_by: 'API导入',
                deleted: false
            };
            try {
                lead.ai_score = this.calculateLeadScore(lead);
                lead.ai_grade = this.getScoreGrade(lead.ai_score);
            } catch (e) {}
            LeadStorage.add(lead);
            success++;
        });
        if (success > 0) {
            try { this.render(); } catch (e) {}
        }
        return { success, duplicates, errors };
    },

    // ============================================================
    // ===== Phase 4 二维码与扫码填写 =====
    // ============================================================
    showQRCodeModal(poolId) {
        const pool = PoolStorage.getById(poolId);
        if (!pool) { showToast('线索池不存在', 'error'); return; }
        const url = `${location.origin}${location.pathname}#lead-form?pool_id=${encodeURIComponent(poolId)}`;
        const html = `
        <div class="leads-modal-overlay" id="qrModal">
            <div class="leads-modal" style="max-width:420px;">
                <div class="modal-header"><h3><i class="fa-solid fa-qrcode"></i> 线索收集二维码</h3><button class="modal-close" data-close>&times;</button></div>
                <div class="modal-body" style="text-align:center;">
                    <div style="color:#d4af37;margin-bottom:12px;font-weight:600;">${escapeHtml(pool.pool_name)}</div>
                    <div id="qrCodeContainer" style="display:inline-block;padding:14px;background:#1a1a2e;border:1px solid rgba(212,175,55,0.3);border-radius:10px;"></div>
                    <div style="margin-top:14px;color:#94a3b8;font-size:12px;word-break:break-all;background:rgba(212,175,55,0.05);border:1px solid rgba(212,175,55,0.15);border-radius:6px;padding:8px 10px;">${escapeHtml(url)}</div>
                    <div style="margin-top:10px;color:#cbd5e1;font-size:13px;"><i class="fa-solid fa-info-circle"></i> 客户扫码后可填写信息，产生的线索自动进入该池。</div>
                </div>
                <div class="modal-footer">
                    <button class="btn-outline" data-close>关闭</button>
                    <button class="btn-accent" id="btnDownloadQR"><i class="fa-solid fa-download"></i> 下载二维码</button>
                </div>
            </div>
        </div>`;
        document.body.insertAdjacentHTML('beforeend', html);
        const modal = document.getElementById('qrModal');
        requestAnimationFrame(() => modal.classList.add('active'));
        const container = document.getElementById('qrCodeContainer');
        let qrInstance = null;
        if (typeof QRCode !== 'undefined' && container) {
            try {
                qrInstance = new QRCode(container, { text: url, width: 200, height: 200, colorDark: '#d4af37', colorLight: '#1a1a2e' });
            } catch (e) {
                container.innerHTML = '<div style="color:#ef4444;padding:30px;">二维码生成失败</div>';
            }
        } else {
            container.innerHTML = '<div style="color:#ef4444;padding:30px;">QRCode库未加载</div>';
        }
        modal.addEventListener('click', (e) => {
            if (e.target.closest('[data-close]') || e.target === modal) { modal.remove(); return; }
            if (e.target.closest('#btnDownloadQR')) {
                const canvas = container.querySelector('canvas');
                if (!canvas) { showToast('二维码未生成', 'error'); return; }
                const a = document.createElement('a');
                a.href = canvas.toDataURL('image/png');
                a.download = `线索池_${pool.pool_name}_QR.png`;
                a.click();
                showToast('二维码已下载', 'success');
            }
        });
    },

    showLeadFormByQR(poolId) {
        const pool = PoolStorage.getById(poolId);
        if (!pool) { showToast('线索池不存在或已删除', 'error'); return; }
        const customFields = CustomFieldStorage.getByPool(poolId);
        const cfHtml = customFields.length === 0 ? '' : ('<div style="border-top:1px dashed rgba(212,175,55,0.25);margin-top:14px;padding-top:14px;"></div>' + customFields.map(f => {
            const placeholder = (f.field_config && f.field_config.placeholder) || '';
            const required = f.field_config && f.field_config.required;
            const star = required ? ' <span class="required">*</span>' : '';
            if (f.field_type === 'select') {
                const opts = (f.field_config && f.field_config.options) || [];
                return `<div class="form-group"><label>${escapeHtml(f.field_name)}${star}</label><select class="qr-cf-input" data-cf-id="${f.field_id}"><option value="">请选择</option>${opts.map(o => `<option value="${escapeHtml(o.label)}">${escapeHtml(o.label)}</option>`).join('')}</select></div>`;
            }
            if (f.field_type === 'date') {
                return `<div class="form-group"><label>${escapeHtml(f.field_name)}${star}</label><input type="date" class="qr-cf-input" data-cf-id="${f.field_id}"></div>`;
            }
            if (f.field_type === 'number') {
                return `<div class="form-group"><label>${escapeHtml(f.field_name)}${star}</label><input type="number" class="qr-cf-input" data-cf-id="${f.field_id}" placeholder="${escapeHtml(placeholder)}"></div>`;
            }
            return `<div class="form-group"><label>${escapeHtml(f.field_name)}${star}</label><input type="text" class="qr-cf-input" data-cf-id="${f.field_id}" placeholder="${escapeHtml(placeholder)}"></div>`;
        }).join(''));
        const html = `
        <div class="leads-modal-overlay" id="qrFormModal">
            <div class="leads-modal">
                <div class="modal-header" style="background:linear-gradient(135deg,rgba(212,175,55,0.15),rgba(212,175,55,0.05));"><h3><i class="fa-solid fa-qrcode" style="color:#d4af37;"></i> 扫码填写 · ${escapeHtml(pool.pool_name)}</h3></div>
                <div class="modal-body">
                    <div style="background:rgba(212,175,55,0.06);border:1px solid rgba(212,175,55,0.2);padding:10px 12px;border-radius:6px;margin-bottom:14px;color:#d4af37;font-size:13px;"><i class="fa-solid fa-info-circle"></i> 请填写您的联系信息，我们会在 24 小时内与您联系。</div>
                    <div class="form-group"><label>公司名称 <span class="required">*</span></label><input type="text" id="qrLeadName" placeholder="请输入公司名称"></div>
                    <div class="form-row">
                        <div class="form-group"><label>联系人 <span class="required">*</span></label><input type="text" id="qrContact" placeholder="联系人姓名"></div>
                        <div class="form-group"><label>联系电话 <span class="required">*</span></label><input type="text" id="qrPhone" placeholder="手机号"></div>
                    </div>
                    <div class="form-group"><label>邮箱</label><input type="text" id="qrEmail" placeholder="email@example.com"></div>
                    <div class="form-group"><label>需求描述</label><textarea id="qrDemand" rows="3" placeholder="请简要描述您的需求..."></textarea></div>
                    ${cfHtml}
                </div>
                <div class="modal-footer">
                    <button class="btn-outline" data-close>取消</button>
                    <button class="btn-accent" id="btnSubmitQRLead"><i class="fa-solid fa-paper-plane"></i> 提交</button>
                </div>
            </div>
        </div>`;
        document.body.insertAdjacentHTML('beforeend', html);
        const modal = document.getElementById('qrFormModal');
        requestAnimationFrame(() => modal.classList.add('active'));
        modal.addEventListener('click', (e) => {
            if (e.target.closest('[data-close]') || e.target === modal) { modal.remove(); return; }
            if (e.target.closest('#btnSubmitQRLead')) {
                const name = document.getElementById('qrLeadName').value.trim();
                const contact = document.getElementById('qrContact').value.trim();
                const phone = document.getElementById('qrPhone').value.trim();
                if (!name) { showToast('请输入公司名称', 'error'); return; }
                if (!contact) { showToast('请输入联系人', 'error'); return; }
                if (!phone) { showToast('请输入联系电话', 'error'); return; }
                if (LeadStorage.checkDuplicate(phone)) { showToast('该手机号已存在于系统，如需重复提交请联系管理员', 'warning'); return; }
                const customData = {};
                document.querySelectorAll('.qr-cf-input').forEach(el => { customData[el.dataset.cfId] = el.value; });
                const now = new Date().toISOString();
                const lead = {
                    lead_id: generateId('lead_'),
                    lead_name: name,
                    contact_name: contact,
                    contact_phone: phone,
                    contact_email: document.getElementById('qrEmail').value.trim(),
                    lead_source: '扫码填写',
                    industry: '',
                    province: '', city: '', district: '',
                    demand_desc: document.getElementById('qrDemand').value.trim(),
                    estimated_amount: 0,
                    priority: 'medium',
                    tags: ['扫码'],
                    custom_data: customData,
                    status: 'pending', owner_id: '',
                    pool_id: poolId,
                    create_time: now, update_time: now,
                    create_by: '扫码填写',
                    deleted: false
                };
                try {
                    lead.ai_score = this.calculateLeadScore(lead);
                    lead.ai_grade = this.getScoreGrade(lead.ai_score);
                } catch (e) {}
                LeadStorage.add(lead);
                this.triggerWebhook('create', lead);
                showToast('提交成功！我们会尽快与您联系', 'success');
                modal.remove();
                this.render();
            }
        });
    },

    // ============================================================
    // ===== Phase 4 AI 评分 =====
    // ============================================================
    calculateLeadScore(lead) {
        if (!lead) return 0;
        let score = 0;
        // 1. 预算金额 (0-25)
        const amt = lead.estimated_amount || 0;
        if (amt >= 500000) score += 25;
        else if (amt >= 200000) score += 20;
        else if (amt >= 100000) score += 15;
        else if (amt >= 50000) score += 10;
        else score += 5;
        // 2. 来源质量 (0-20)
        const sourceScores = { '转介绍': 20, '官网注册': 18, '展会活动': 15, '百度推广': 12, '广告投放': 10 };
        score += sourceScores[lead.lead_source] || 8;
        // 3. 行业匹配 (0-15)
        const industryScores = { '科技': 15, '金融': 15, '制造业': 12, '教育': 12 };
        score += industryScores[lead.industry] || 8;
        // 4. 跟进活跃度 (0-20)
        const followUps = FollowUpStorage.getByLeadId(lead.lead_id) || [];
        const followCount = Math.min(followUps.length, 5);
        score += followCount * 2;
        if (followUps.length > 0) {
            const sorted = followUps.slice().sort((a, b) => (b.create_time || '').localeCompare(a.create_time || ''));
            const lastFollow = new Date(sorted[0].create_time || Date.now());
            const daysSince = (Date.now() - lastFollow) / 86400000;
            if (daysSince <= 3) score += 10;
            else if (daysSince <= 7) score += 7;
            else if (daysSince <= 14) score += 4;
            else score += 1;
        }
        // 5. 客户意向 (0-20)
        const intentScores = { high: 20, medium: 12, low: 5 };
        if (followUps.length > 0) {
            const sorted = followUps.slice().sort((a, b) => (b.create_time || '').localeCompare(a.create_time || ''));
            score += intentScores[sorted[0].customer_intent] || 0;
        }
        return Math.min(score, 100);
    },

    getScoreGrade(score) {
        if (score >= 80) return 'A';
        if (score >= 60) return 'B';
        if (score >= 40) return 'C';
        return 'D';
    },

    getScoreDimensions(lead) {
        const amt = lead.estimated_amount || 0;
        let amtScore = 5;
        if (amt >= 500000) amtScore = 25;
        else if (amt >= 200000) amtScore = 20;
        else if (amt >= 100000) amtScore = 15;
        else if (amt >= 50000) amtScore = 10;
        const sourceScores = { '转介绍': 20, '官网注册': 18, '展会活动': 15, '百度推广': 12, '广告投放': 10 };
        const sourceScore = sourceScores[lead.lead_source] || 8;
        const industryScores = { '科技': 15, '金融': 15, '制造业': 12, '教育': 12 };
        const industryScore = industryScores[lead.industry] || 8;
        const followUps = FollowUpStorage.getByLeadId(lead.lead_id) || [];
        const followCount = Math.min(followUps.length, 5);
        let followScore = followCount * 2;
        if (followUps.length > 0) {
            const sorted = followUps.slice().sort((a, b) => (b.create_time || '').localeCompare(a.create_time || ''));
            const daysSince = (Date.now() - new Date(sorted[0].create_time || Date.now())) / 86400000;
            if (daysSince <= 3) followScore += 10;
            else if (daysSince <= 7) followScore += 7;
            else if (daysSince <= 14) followScore += 4;
            else followScore += 1;
        }
        const intentScores = { high: 20, medium: 12, low: 5 };
        let intentScore = 0;
        if (followUps.length > 0) {
            const sorted = followUps.slice().sort((a, b) => (b.create_time || '').localeCompare(a.create_time || ''));
            intentScore = intentScores[sorted[0].customer_intent] || 0;
        }
        return [
            { label: '预算金额', value: amtScore, max: 25 },
            { label: '来源质量', value: sourceScore, max: 20 },
            { label: '行业匹配', value: industryScore, max: 15 },
            { label: '跟进活跃度', value: followScore, max: 20 },
            { label: '客户意向', value: intentScore, max: 20 }
        ];
    },

    generateAISuggestion(lead, score, grade) {
        const suggestions = [];
        const amt = lead.estimated_amount || 0;
        const followUps = FollowUpStorage.getByLeadId(lead.lead_id) || [];
        // 1. 基于金额和行业
        if (amt >= 200000 || lead.industry === '科技' || lead.industry === '金融') {
            suggestions.push('高价值客户，建议 3 天内安排一次上门拜访，并准备定制化方案。');
        } else if (amt < 50000) {
            suggestions.push('金额较小，可以采用标准化产品话术，控制跟进成本。');
        } else {
            suggestions.push('中等价值客户，建议周跟进 1-2 次，推荐优势产品。');
        }
        // 2. 基于来源
        if (lead.lead_source === '转介绍') {
            suggestions.push('转介绍线索信任度较高，优先电话沟通并快速预约面谈。');
        } else if (['百度推广', '广告投放'].indexOf(lead.lead_source) !== -1) {
            suggestions.push('付费渠道线索，建议优先使用企微/朋友圈预热后再电话。');
        } else if (['护音', '小红书', '微信', '美团'].indexOf(lead.lead_source) !== -1) {
            suggestions.push('社交媒体线索，建议先通过微信存亲并发送产品手册。');
        }
        // 3. 基于跟进次数与意向
        const sortedFu = followUps.slice().sort((a, b) => (b.create_time || '').localeCompare(a.create_time || ''));
        const lastIntent = sortedFu[0] ? sortedFu[0].customer_intent : '';
        if (lastIntent === 'high' && followUps.length >= 3) {
            suggestions.push('客户意向高且已多次跟进，进入促成阶段，建议这周内推进合同签订。');
        } else if (lastIntent === 'low') {
            suggestions.push('客户意向偏低，建议重新评估需求匹配度，必要时可退回公海。');
        } else if (followUps.length === 0) {
            suggestions.push('该线索尚未跟进，建议 24 小时内进行首次电话接触。');
        }
        return suggestions.slice(0, 3);
    },

    renderAIAnalysisCard(lead) {
        const score = lead.ai_score || this.calculateLeadScore(lead);
        const grade = lead.ai_grade || this.getScoreGrade(score);
        const colorMap = { A: '#10b981', B: '#3b82f6', C: '#f59e0b', D: '#94a3b8' };
        const c = colorMap[grade];
        const dims = this.getScoreDimensions(lead);
        const sugs = this.generateAISuggestion(lead, score, grade);
        const ringDeg = (score / 100) * 360;
        const ring = `
            <div style="position:relative;width:120px;height:120px;border-radius:50%;background:conic-gradient(${c} 0deg ${ringDeg}deg, rgba(212,175,55,0.08) ${ringDeg}deg 360deg);display:flex;align-items:center;justify-content:center;">
                <div style="width:90px;height:90px;border-radius:50%;background:#1a1a1a;display:flex;flex-direction:column;align-items:center;justify-content:center;">
                    <div style="font-size:28px;font-weight:700;color:${c};line-height:1;">${score}</div>
                    <div style="font-size:11px;color:#94a3b8;margin-top:2px;">/ 100</div>
                </div>
                <div style="position:absolute;top:-8px;right:-8px;width:32px;height:32px;border-radius:50%;background:${c};color:#fff;display:flex;align-items:center;justify-content:center;font-weight:700;border:3px solid #1a1a1a;">${grade}</div>
            </div>`;
        const dimRows = dims.map(d => {
            const pct = (d.value / d.max) * 100;
            return `
                <div style="margin-bottom:10px;">
                    <div style="display:flex;justify-content:space-between;font-size:12px;color:#cbd5e1;margin-bottom:4px;"><span>${d.label}</span><span style="color:#d4af37;">${d.value} / ${d.max}</span></div>
                    <div style="height:6px;border-radius:3px;background:rgba(212,175,55,0.08);overflow:hidden;"><div style="height:100%;width:${pct}%;background:linear-gradient(90deg,#d4af37,#f4d061);"></div></div>
                </div>`;
        }).join('');
        const sugHtml = sugs.length === 0 ? '<div style="color:#94a3b8;font-size:13px;">暂无专属建议</div>' :
            sugs.map(s => `<div style="display:flex;gap:10px;padding:10px 12px;background:rgba(212,175,55,0.05);border-left:3px solid #d4af37;border-radius:4px;margin-bottom:8px;"><i class="fa-solid fa-lightbulb" style="color:#d4af37;margin-top:3px;"></i><div style="flex:1;color:#cbd5e1;font-size:13px;line-height:1.6;">${escapeHtml(s)}</div></div>`).join('');
        return `
        <div class="detail-card" style="margin-top:16px;background:linear-gradient(135deg,rgba(212,175,55,0.06),rgba(212,175,55,0.02));border:1px solid rgba(212,175,55,0.3);">
            <div class="detail-card-header" style="border-bottom:1px solid rgba(212,175,55,0.2);">
                <h3 style="color:#d4af37;"><i class="fa-solid fa-brain"></i> AI 智能分析</h3>
                <span style="color:#94a3b8;font-size:12px;">基于 5 个维度的智能评分</span>
            </div>
            <div style="display:grid;grid-template-columns:160px 1fr;gap:24px;padding:18px 4px 4px 4px;">
                <div style="display:flex;flex-direction:column;align-items:center;gap:10px;">${ring}
                    <div style="font-size:13px;color:${c};font-weight:600;">${grade === 'A' ? '优质线索' : grade === 'B' ? '良好线索' : grade === 'C' ? '一般线索' : '待提升'}</div>
                </div>
                <div>${dimRows}</div>
            </div>
            <div style="margin-top:12px;padding-top:12px;border-top:1px dashed rgba(212,175,55,0.18);">
                <h4 style="color:#d4af37;font-size:14px;margin:0 0 10px 0;"><i class="fa-solid fa-comments"></i> 智能建议</h4>
                ${sugHtml}
            </div>
        </div>`;
    },

    initialScoringForSeeds() {
        // 仅为未打分的线索补充评分
        const all = LeadStorage.getAll();
        let touched = false;
        all.forEach(lead => {
            if (lead.ai_score == null) {
                const s = this.calculateLeadScore(lead);
                LeadStorage.update({ lead_id: lead.lead_id, ai_score: s, ai_grade: this.getScoreGrade(s) });
                touched = true;
            }
        });
        return touched;
    },

    // ============================================================
    // ===== Phase 4 数据分析 =====
    // ============================================================
    renderAnalyticsView() {
        const stats = this.getAnalyticsStats();
        const kpiHtml = `
        <div class="analytics-kpi" style="display:grid;grid-template-columns:repeat(5,1fr);gap:14px;margin-bottom:20px;">
            ${[
                { label: '总线索数', value: stats.total, icon: 'fa-database', color: '#d4af37' },
                { label: '本月新增', value: stats.thisMonthNew, icon: 'fa-plus', color: '#3b82f6' },
                { label: '转化率', value: stats.conversionRate, icon: 'fa-handshake', color: '#10b981' },
                { label: '平均跟进周期', value: stats.avgFollowDays + ' 天', icon: 'fa-clock', color: '#f59e0b' },
                { label: '待跟进数', value: stats.toFollow, icon: 'fa-bell', color: '#ef4444' }
            ].map(k => `
                <div style="background:linear-gradient(135deg,#1a1a1a,#222);border:1px solid rgba(212,175,55,0.2);border-radius:12px;padding:18px;display:flex;justify-content:space-between;align-items:center;">
                    <div>
                        <div style="color:#94a3b8;font-size:12px;margin-bottom:6px;">${k.label}</div>
                        <div style="color:${k.color};font-size:26px;font-weight:700;">${k.value}</div>
                    </div>
                    <i class="fa-solid ${k.icon}" style="font-size:30px;color:${k.color}33;"></i>
                </div>`).join('')}
        </div>`;
        return `
        <div class="leads-module-header">
            <h2><i class="fa-solid fa-chart-line"></i> 数据分析</h2>
            <div class="leads-header-actions"><span style="color:#94a3b8;font-size:12px;">数据仅供参考</span></div>
        </div>
        ${kpiHtml}
        <div class="analytics-charts" style="display:grid;grid-template-columns:1fr 1fr;gap:18px;">
            <div class="chart-panel" style="background:linear-gradient(135deg,#1a1a1a,#222);border:1px solid rgba(212,175,55,0.2);border-radius:12px;padding:18px;height:340px;">
                <h3 style="color:#d4af37;font-size:14px;margin:0 0 12px 0;"><i class="fa-solid fa-filter"></i> 转化漏斗</h3>
                <div style="position:relative;height:280px;"><canvas id="chartFunnel"></canvas></div>
            </div>
            <div class="chart-panel" style="background:linear-gradient(135deg,#1a1a1a,#222);border:1px solid rgba(212,175,55,0.2);border-radius:12px;padding:18px;height:340px;">
                <h3 style="color:#d4af37;font-size:14px;margin:0 0 12px 0;"><i class="fa-solid fa-bullhorn"></i> 来源效果</h3>
                <div style="position:relative;height:280px;"><canvas id="chartSource"></canvas></div>
            </div>
            <div class="chart-panel" style="background:linear-gradient(135deg,#1a1a1a,#222);border:1px solid rgba(212,175,55,0.2);border-radius:12px;padding:18px;height:340px;">
                <h3 style="color:#d4af37;font-size:14px;margin:0 0 12px 0;"><i class="fa-solid fa-trophy"></i> 成员排行（Top10）</h3>
                <div style="position:relative;height:280px;"><canvas id="chartRanking"></canvas></div>
            </div>
            <div class="chart-panel" style="background:linear-gradient(135deg,#1a1a1a,#222);border:1px solid rgba(212,175,55,0.2);border-radius:12px;padding:18px;height:340px;">
                <h3 style="color:#d4af37;font-size:14px;margin:0 0 12px 0;"><i class="fa-solid fa-chart-line"></i> 趋势分析（近 6 个月）</h3>
                <div style="position:relative;height:280px;"><canvas id="chartTrend"></canvas></div>
            </div>
        </div>`;
    },

    getAnalyticsStats() {
        const leads = LeadStorage.getAll();
        const now = new Date();
        const thisMonth = now.getFullYear() + '-' + String(now.getMonth() + 1).padStart(2, '0');
        const total = leads.length;
        const converted = leads.filter(l => l.status === 'converted').length;
        const conversionRate = total > 0 ? ((converted / total) * 100).toFixed(1) + '%' : '0.0%';
        const thisMonthNew = leads.filter(l => (l.create_time || '').startsWith(thisMonth)).length;
        const toFollow = leads.filter(l => l.status === 'allocated' || l.status === 'following').length;
        // 平均跟进周期：已转化线索从创建到转化的天数平均
        const convertedLeads = leads.filter(l => l.status === 'converted');
        let avgFollowDays = 0;
        if (convertedLeads.length > 0) {
            const sum = convertedLeads.reduce((acc, l) => {
                const c = new Date(l.create_time || Date.now());
                const u = new Date(l.update_time || l.create_time || Date.now());
                return acc + Math.max(0, (u - c) / 86400000);
            }, 0);
            avgFollowDays = (sum / convertedLeads.length).toFixed(1);
        }
        return { total, conversionRate, thisMonthNew, toFollow, avgFollowDays };
    },

    renderAnalyticsCharts() {
        if (typeof Chart === 'undefined') return;
        this.destroyCharts();
        const leads = LeadStorage.getAll();
        const commonOpts = {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { labels: { color: '#a0a0a0' } }
            },
            scales: {
                x: { ticks: { color: '#a0a0a0' }, grid: { color: 'rgba(255,255,255,0.05)' } },
                y: { ticks: { color: '#a0a0a0' }, grid: { color: 'rgba(255,255,255,0.05)' } }
            }
        };
        // 1. 转化漏斗
        const funnelCanvas = document.getElementById('chartFunnel');
        if (funnelCanvas) {
            const stages = ['pending', 'allocated', 'following', 'converted'];
            const labels = ['待分配', '已分配', '跟进中', '已转化'];
            const data = stages.map(s => leads.filter(l => l.status === s).length);
            const c1 = new Chart(funnelCanvas.getContext('2d'), {
                type: 'bar',
                data: { labels, datasets: [{ label: '线索数', data, backgroundColor: ['#d4af3766', '#d4af3799', '#d4af37cc', '#d4af37'], borderColor: '#d4af37', borderWidth: 1 }] },
                options: { ...commonOpts, indexAxis: 'y' }
            });
            this.analyticsCharts.push(c1);
        }
        // 2. 来源效果 (bar+line)
        const sourceCanvas = document.getElementById('chartSource');
        if (sourceCanvas) {
            const sources = LEAD_SOURCES.filter(s => leads.some(l => l.lead_source === s));
            const counts = sources.map(s => leads.filter(l => l.lead_source === s).length);
            const rates = sources.map(s => {
                const arr = leads.filter(l => l.lead_source === s);
                if (arr.length === 0) return 0;
                const conv = arr.filter(l => l.status === 'converted').length;
                return Number(((conv / arr.length) * 100).toFixed(1));
            });
            const c2 = new Chart(sourceCanvas.getContext('2d'), {
                type: 'bar',
                data: {
                    labels: sources,
                    datasets: [
                        { type: 'bar', label: '线索数', data: counts, backgroundColor: '#d4af3799', borderColor: '#d4af37', borderWidth: 1, yAxisID: 'y' },
                        { type: 'line', label: '转化率(%)', data: rates, borderColor: '#10b981', backgroundColor: '#10b98133', tension: 0.3, yAxisID: 'y1', pointBackgroundColor: '#10b981' }
                    ]
                },
                options: {
                    ...commonOpts,
                    scales: {
                        x: { ticks: { color: '#a0a0a0' }, grid: { color: 'rgba(255,255,255,0.05)' } },
                        y: { position: 'left', ticks: { color: '#a0a0a0' }, grid: { color: 'rgba(255,255,255,0.05)' } },
                        y1: { position: 'right', ticks: { color: '#10b981' }, grid: { display: false } }
                    }
                }
            });
            this.analyticsCharts.push(c2);
        }
        // 3. 成员排行
        const rankingCanvas = document.getElementById('chartRanking');
        if (rankingCanvas) {
            const map = {};
            leads.filter(l => l.owner_id && (l.status === 'allocated' || l.status === 'following')).forEach(l => {
                map[l.owner_id] = (map[l.owner_id] || 0) + 1;
            });
            const entries = Object.entries(map).sort((a, b) => b[1] - a[1]).slice(0, 10);
            const c3 = new Chart(rankingCanvas.getContext('2d'), {
                type: 'bar',
                data: {
                    labels: entries.map(e => e[0]),
                    datasets: [{ label: '活跃线索', data: entries.map(e => e[1]), backgroundColor: '#d4af37cc', borderColor: '#d4af37', borderWidth: 1 }]
                },
                options: { ...commonOpts, indexAxis: 'y' }
            });
            this.analyticsCharts.push(c3);
        }
        // 4. 趋势分析
        const trendCanvas = document.getElementById('chartTrend');
        if (trendCanvas) {
            const months = [];
            const now = new Date();
            for (let i = 5; i >= 0; i--) {
                const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
                months.push(d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0'));
            }
            const newCounts = months.map(m => leads.filter(l => (l.create_time || '').startsWith(m)).length);
            const convCounts = months.map(m => leads.filter(l => l.status === 'converted' && (l.update_time || '').startsWith(m)).length);
            const c4 = new Chart(trendCanvas.getContext('2d'), {
                type: 'line',
                data: {
                    labels: months,
                    datasets: [
                        { label: '月新增', data: newCounts, borderColor: '#d4af37', backgroundColor: '#d4af3733', tension: 0.3, fill: true, pointBackgroundColor: '#d4af37' },
                        { label: '月转化', data: convCounts, borderColor: '#10b981', backgroundColor: '#10b98133', tension: 0.3, fill: true, pointBackgroundColor: '#10b981' }
                    ]
                },
                options: commonOpts
            });
            this.analyticsCharts.push(c4);
        }
    }
};
const Leads = {
    init() { LeadsUI.init(); },
    destroy() { LeadsUI.destroy(); },
    getStats() { return LeadsUI.getStats(); },
    getCustomers() { return CustomerStorage.getAll(); },
    getOpportunities() { return OpportunityStorage.getAll(); },
    getNotifications() { return NotificationStorage.getAll(); },
    importFromAPI(data) { return LeadsUI.importFromAPI(data); }
};
