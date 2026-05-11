// 主应用逻辑 - 浙杭企服

const pageNames = {
    'home': '首页',
    'cockpit': '老板驾驶舱',
    'leads': '线索管理',
    'orders': '订单管理',
    'tasks': '任务管理',
    'contracts': '合同管理',
    'finance': '财务管理',
    'finance-journal': '公司日记账',
    'hr': '人事管理',
    'hr-org': '公司组织框架',
    'performance': '绩效管理',
    'perf-consultant': '顾问部绩效',
    'perf-accounting': '会计部绩效',
    'perf-business': '工商部绩效',
    'perf-seal': '刻章部绩效',
    'perf-hr': '人事部绩效',
    'perf-operation': '运营部绩效',
    'messages': '消息',
    'expense': '报销管理',
    'system': '系统管理',
    'system-permissions': '人员权限管理'
};

let currentPage = 'home';

const placeholderHTML = `
    <div class="content-placeholder">
        <div class="placeholder-icon">
            <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="#cbd5e1" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round">
                <rect x="3" y="3" width="7" height="7" rx="1"/>
                <rect x="14" y="3" width="7" height="7" rx="1"/>
                <rect x="3" y="14" width="7" height="7" rx="1"/>
                <rect x="14" y="14" width="7" height="7" rx="1"/>
            </svg>
        </div>
        <h2 id="content-title">首页</h2>
        <p>模块开发中，敬请期待</p>
    </div>
`;

// 左侧菜单点击事件（支持子菜单）
document.querySelector('.side-menu').addEventListener('click', (e) => {
    // 子菜单展开/收起
    const submenuCard = e.target.closest('.has-submenu');
    if (submenuCard) {
        e.preventDefault();
        const group = submenuCard.closest('.side-menu-group');
        if (group) group.classList.toggle('open');
        return;
    }

    // 子菜单项点击
    const subItem = e.target.closest('.side-submenu-item');
    if (subItem) {
        e.preventDefault();
        const page = subItem.dataset.page;
        // 更新激活状态
        document.querySelectorAll('.side-menu-card, .side-submenu-item').forEach(c => c.classList.remove('active'));
        subItem.classList.add('active');
        navigateTo(page);
        return;
    }

    // 普通菜单项点击
    const card = e.target.closest('.side-menu-card');
    if (card) {
        e.preventDefault();
        const page = card.dataset.page;
        // 更新激活状态
        document.querySelectorAll('.side-menu-card, .side-submenu-item').forEach(c => c.classList.remove('active'));
        card.classList.add('active');
        navigateTo(page);
    }
});

function navigateTo(page) {
    // 离开当前页面时清理
    if (currentPage === 'cockpit' && typeof Cockpit !== 'undefined') {
        Cockpit.destroy();
    }
    if (currentPage === 'leads' && typeof Leads !== 'undefined') {
        Leads.destroy();
    }
    if (currentPage === 'finance-journal' && typeof FinanceJournal !== 'undefined') {
        FinanceJournal.destroy();
    }

    currentPage = page;

    if (page === 'home') {
        Home.init();
    } else if (page === 'cockpit') {
        Cockpit.init();
    } else if (page === 'leads') {
        Leads.init();
    } else if (page === 'messages') {
        Messages.init();
    } else if (page === 'hr-org') {
        HrOrg.init();
    } else if (page === 'finance-journal') {
        FinanceJournal.init();
    } else if (page === 'system-permissions') {
        SystemPermissions.init();
    } else {
        // 其他页面显示占位
        const contentArea = document.querySelector('.content-area');
        contentArea.innerHTML = placeholderHTML;
        const titleEl = document.getElementById('content-title');
        if (titleEl) titleEl.textContent = pageNames[page] || page;
    }
}

// 工具函数
function formatMoney(amount) {
    return parseFloat(amount).toLocaleString('zh-CN', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    });
}

// 将refreshDashboard暴露给全局，供auth.js调用
window.refreshDashboard = function() {
    if (currentPage === 'cockpit' && typeof Cockpit !== 'undefined') {
        Cockpit.init();
    }
};

// 初始化
document.addEventListener('DOMContentLoaded', () => {
    // 认证初始化由 auth.js 处理
});
