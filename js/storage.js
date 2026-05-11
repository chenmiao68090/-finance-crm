// 本地存储管理模块

const Storage = {
    // 获取所有数据
    getAll() {
        return {
            customers: this.get('customers') || [],
            contracts: this.get('contracts') || [],
            finances: this.get('finances') || [],
            invoices: this.get('invoices') || []
        };
    },

    // 获取指定类型数据
    get(key) {
        try {
            const data = localStorage.getItem(`crm_${key}`);
            return data ? JSON.parse(data) : [];
        } catch (e) {
            console.error('读取数据失败:', e);
            return [];
        }
    },

    // 保存指定类型数据
    set(key, data) {
        try {
            localStorage.setItem(`crm_${key}`, JSON.stringify(data));
            return true;
        } catch (e) {
            console.error('保存数据失败:', e);
            return false;
        }
    },

    // 添加记录
    add(key, record) {
        const data = this.get(key);
        record.id = Date.now().toString();
        record.created_at = new Date().toISOString();
        data.push(record);
        return this.set(key, data) ? record : null;
    },

    // 更新记录
    update(key, id, updates) {
        const data = this.get(key);
        const index = data.findIndex(item => item.id === id);
        if (index !== -1) {
            data[index] = { ...data[index], ...updates, updated_at: new Date().toISOString() };
            return this.set(key, data);
        }
        return false;
    },

    // 删除记录
    delete(key, id) {
        const data = this.get(key);
        const filtered = data.filter(item => item.id !== id);
        return this.set(key, filtered);
    },

    // 获取单条记录
    getById(key, id) {
        const data = this.get(key);
        return data.find(item => item.id === id);
    },

    // 清空所有数据
    clear() {
        ['customers', 'contracts', 'finances', 'invoices'].forEach(key => {
            localStorage.removeItem(`crm_${key}`);
        });
    },

    // 导入数据
    import(data) {
        if (data.customers) this.set('customers', data.customers);
        if (data.contracts) this.set('contracts', data.contracts);
        if (data.finances) this.set('finances', data.finances);
        if (data.invoices) this.set('invoices', data.invoices);
    },

    // 导出数据
    export() {
        return this.getAll();
    }
};

// 初始化示例数据（首次使用）
function initSampleData() {
    if (localStorage.getItem('crm_initialized')) return;

    const sampleData = {
        customers: [
            {
                id: '1',
                name: '北京科技有限公司',
                contact: '张总',
                phone: '13800138000',
                email: 'zhang@example.com',
                address: '北京市朝阳区建国路88号',
                notes: '长期合作客户',
                created_at: '2024-01-15T10:00:00Z'
            },
            {
                id: '2',
                name: '上海贸易集团',
                contact: '李经理',
                phone: '13900139000',
                email: 'li@shtrade.com',
                address: '上海市浦东新区陆家嘴金融中心',
                notes: '',
                created_at: '2024-02-20T14:30:00Z'
            },
            {
                id: '3',
                name: '深圳创新科技',
                contact: '王总监',
                phone: '13700137000',
                email: 'wang@sztech.com',
                address: '深圳市南山区科技园',
                notes: '新客户',
                created_at: '2024-03-10T09:15:00Z'
            }
        ],
        contracts: [
            {
                id: '1',
                customer_id: '1',
                name: '年度财务顾问合同',
                amount: 120000,
                start_date: '2024-01-01',
                end_date: '2024-12-31',
                notes: '包含月度财务报表分析',
                created_at: '2024-01-05T10:00:00Z'
            },
            {
                id: '2',
                customer_id: '2',
                name: '税务筹划服务合同',
                amount: 80000,
                start_date: '2024-03-01',
                end_date: '2024-08-31',
                notes: '',
                created_at: '2024-02-25T11:00:00Z'
            }
        ],
        finances: [
            {
                id: '1',
                type: 'income',
                amount: 50000,
                date: '2024-03-15',
                customer_id: '1',
                description: '第一季度财务顾问费',
                created_at: '2024-03-15T10:00:00Z'
            },
            {
                id: '2',
                type: 'income',
                amount: 30000,
                date: '2024-03-20',
                customer_id: '2',
                description: '税务筹划服务费',
                created_at: '2024-03-20T14:00:00Z'
            },
            {
                id: '3',
                type: 'expense',
                amount: 5000,
                date: '2024-03-25',
                customer_id: '',
                description: '办公用品采购',
                created_at: '2024-03-25T09:00:00Z'
            }
        ],
        invoices: [
            {
                id: '1',
                customer_id: '1',
                invoice_number: 'INV-2024-001',
                type: '增值税专用发票',
                amount: 50000,
                invoice_date: '2024-03-15',
                status: '已开具',
                created_at: '2024-03-15T10:00:00Z'
            },
            {
                id: '2',
                customer_id: '2',
                invoice_number: 'INV-2024-002',
                type: '增值税普通发票',
                amount: 30000,
                invoice_date: '2024-03-20',
                status: '已开具',
                created_at: '2024-03-20T14:00:00Z'
            }
        ]
    };

    Storage.import(sampleData);
    localStorage.setItem('crm_initialized', 'true');
}

// 页面加载时初始化
document.addEventListener('DOMContentLoaded', initSampleData);
