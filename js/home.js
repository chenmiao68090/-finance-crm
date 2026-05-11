// 首页模块 - 包含公司公告

var escapeHtml = escapeHtml || function(str) {
    if (!str) return '';
    return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
};

const Home = {
    // 模拟公告数据
    mockAnnouncements: [
        {
            id: 1,
            title: '关于2024年度年终奖发放通知',
            content: '各位同事，经公司管理层研究决定，2024年度年终奖将于1月15日统一发放至工资卡。具体金额以部门考核结果为准，请各位注意查收。如有疑问请联系人事部。',
            author: '人事行政部',
            date: '2024-12-28',
            priority: 'high',
            pinned: true
        },
        {
            id: 2,
            title: '新年放假安排通知',
            content: '根据国务院办公厅通知，2025年元旦放假安排如下：1月1日（周三）放假，与周末连休。请各部门做好工作交接，确保假期期间紧急事务有人值守。',
            author: '综合管理部',
            date: '2024-12-25',
            priority: 'high',
            pinned: true
        },
        {
            id: 3,
            title: '办公系统升级维护通知',
            content: '为提升系统性能和安全性，IT部门计划于本周六（12月21日）22:00-次日06:00进行系统升级维护。届时OA系统、邮件系统将暂停服务，请提前做好准备。',
            author: 'IT技术部',
            date: '2024-12-20',
            priority: 'normal',
            pinned: false
        },
        {
            id: 4,
            title: '公司团建活动报名通知',
            content: '为丰富员工业余生活、增强团队凝聚力，公司定于1月18日（周六）举办年度团建活动，地点为千岛湖度假村。请各部门于1月10日前完成报名统计。费用由公司全额承担。',
            author: '人事行政部',
            date: '2024-12-18',
            priority: 'normal',
            pinned: false
        },
        {
            id: 5,
            title: '关于规范考勤打卡的通知',
            content: '近期发现部分员工存在忘记打卡、代打卡等情况。现重申：上班时间为9:00-18:00，迟到早退按公司制度处理。请各位严格遵守考勤纪律，如有特殊情况请提前向主管报备。',
            author: '人事行政部',
            date: '2024-12-15',
            priority: 'normal',
            pinned: false
        },
        {
            id: 6,
            title: '12月销售冲刺动员令',
            content: '距离年度目标还有最后冲刺阶段！目前全公司完成率87%，顾问部和工商部表现优异。请各团队抓住最后机会，全力以赴完成年度目标。完成目标的团队将获得额外奖励！',
            author: '总经理办公室',
            date: '2024-12-10',
            priority: 'high',
            pinned: false
        },
        {
            id: 7,
            title: '新员工入职欢迎',
            content: '欢迎以下新同事加入浙杭企服大家庭：会计部-李雪梅、工商部-陈志强、运营部-王小丽。请各部门做好新人引导工作，帮助新同事尽快融入团队。',
            author: '人事行政部',
            date: '2024-12-08',
            priority: 'normal',
            pinned: false
        },
        {
            id: 8,
            title: '关于办公区域禁烟通知',
            content: '为营造健康、清洁的办公环境，自即日起严禁在办公区域内吸烟（含电子烟）。吸烟请到指定区域（B栋1楼东侧吸烟区）。违反规定者，首次警告，再次将按公司制度处罚。',
            author: '综合管理部',
            date: '2024-12-05',
            priority: 'normal',
            pinned: false
        }
    ],

    init() {
        const contentArea = document.querySelector('.content-area');
        contentArea.innerHTML = this.render();
        this.bindEvents();
    },

    destroy() {},

    render() {
        const now = new Date();
        const hour = now.getHours();
        let greeting = '早上好';
        if (hour >= 12 && hour < 14) greeting = '中午好';
        else if (hour >= 14 && hour < 18) greeting = '下午好';
        else if (hour >= 18) greeting = '晚上好';

        const user = (typeof Auth !== 'undefined' && Auth.currentUser) ? Auth.currentUser.email : '管理员';

        // 快捷入口
        const shortcuts = [
            { icon: '📊', label: '驾驶舱', page: 'cockpit' },
            { icon: '💬', label: '消息', page: 'messages' },
            { icon: '📋', label: '线索管理', page: 'leads' },
            { icon: '📁', label: '合同管理', page: 'contracts' },
            { icon: '💰', label: '财务管理', page: 'finance' },
            { icon: '📝', label: '日记账', page: 'finance-journal' }
        ];

        const pinnedAnnouncements = this.mockAnnouncements.filter(a => a.pinned);
        const normalAnnouncements = this.mockAnnouncements.filter(a => !a.pinned);

        return `
        <div class="home-page">
            <div class="home-welcome">
                <div class="welcome-text">
                    <h2>${greeting}，${escapeHtml(user.split('@')[0])}</h2>
                    <p>今天是 ${now.getFullYear()}年${now.getMonth() + 1}月${now.getDate()}日，祝您工作愉快</p>
                </div>
            </div>

            <div class="home-shortcuts">
                ${shortcuts.map(s => `
                    <a href="#" class="home-shortcut-item" data-page="${s.page}">
                        <span class="shortcut-icon">${s.icon}</span>
                        <span class="shortcut-label">${s.label}</span>
                    </a>
                `).join('')}
            </div>

            <div class="home-content-grid">
                <div class="home-announcements">
                    <div class="home-section-header">
                        <h3>公司公告</h3>
                        <span class="announcement-count">${this.mockAnnouncements.length} 条公告</span>
                    </div>

                    ${pinnedAnnouncements.length > 0 ? `
                    <div class="announcement-pinned-list">
                        ${pinnedAnnouncements.map(a => this.renderAnnouncementCard(a, true)).join('')}
                    </div>
                    ` : ''}

                    <div class="announcement-list">
                        ${normalAnnouncements.map(a => this.renderAnnouncementCard(a, false)).join('')}
                    </div>
                </div>

                <div class="home-sidebar-widgets">
                    <div class="home-widget">
                        <h4>待办事项</h4>
                        <div class="todo-widget-list">
                            <div class="todo-widget-item">
                                <span class="todo-dot urgent"></span>
                                <span class="todo-text">跟进客户：杭州锐创科技</span>
                            </div>
                            <div class="todo-widget-item">
                                <span class="todo-dot warning"></span>
                                <span class="todo-text">合同审批：浙江星辰有限公司</span>
                            </div>
                            <div class="todo-widget-item">
                                <span class="todo-dot normal"></span>
                                <span class="todo-text">完成12月绩效自评</span>
                            </div>
                            <div class="todo-widget-item">
                                <span class="todo-dot normal"></span>
                                <span class="todo-text">提交报销单据</span>
                            </div>
                        </div>
                    </div>
                    <div class="home-widget">
                        <h4>快速数据</h4>
                        <div class="quick-stats-widget">
                            <div class="quick-stat-row">
                                <span class="quick-stat-label">本月新增线索</span>
                                <span class="quick-stat-value">32</span>
                            </div>
                            <div class="quick-stat-row">
                                <span class="quick-stat-label">待处理订单</span>
                                <span class="quick-stat-value">8</span>
                            </div>
                            <div class="quick-stat-row">
                                <span class="quick-stat-label">本月营收</span>
                                <span class="quick-stat-value">¥128.5万</span>
                            </div>
                            <div class="quick-stat-row">
                                <span class="quick-stat-label">未读消息</span>
                                <span class="quick-stat-value">5</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>`;
    },

    renderAnnouncementCard(announcement, isPinned) {
        const priorityClass = announcement.priority === 'high' ? 'priority-high' : '';
        return `
        <div class="announcement-card ${priorityClass}" data-id="${announcement.id}">
            <div class="announcement-card-header">
                ${isPinned ? '<span class="pin-badge">置顶</span>' : ''}
                ${announcement.priority === 'high' ? '<span class="priority-badge">重要</span>' : ''}
                <span class="announcement-date">${escapeHtml(announcement.date)}</span>
            </div>
            <h4 class="announcement-title">${escapeHtml(announcement.title)}</h4>
            <p class="announcement-excerpt">${escapeHtml(announcement.content.substring(0, 80))}...</p>
            <div class="announcement-footer">
                <span class="announcement-author">${escapeHtml(announcement.author)}</span>
                <button class="btn-read-more" data-id="${announcement.id}">查看详情</button>
            </div>
        </div>`;
    },

    bindEvents() {
        // 快捷入口点击
        document.querySelectorAll('.home-shortcut-item').forEach(item => {
            item.addEventListener('click', (e) => {
                e.preventDefault();
                const page = item.dataset.page;
                if (typeof navigateTo === 'function') navigateTo(page);
            });
        });

        // 公告详情
        document.querySelectorAll('.btn-read-more').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const id = parseInt(e.target.dataset.id);
                this.showAnnouncementDetail(id);
            });
        });
    },

    showAnnouncementDetail(id) {
        const announcement = this.mockAnnouncements.find(a => a.id === id);
        if (!announcement) return;

        const modal = document.createElement('div');
        modal.className = 'modal active';
        modal.innerHTML = `
            <div class="modal-content" style="max-width: 600px;">
                <div class="modal-header">
                    <h3>${escapeHtml(announcement.title)}</h3>
                    <button class="modal-close">&times;</button>
                </div>
                <div style="padding: 24px;">
                    <div style="display: flex; gap: 16px; margin-bottom: 16px; color: #64748b; font-size: 13px;">
                        <span>发布部门：${escapeHtml(announcement.author)}</span>
                        <span>发布时间：${escapeHtml(announcement.date)}</span>
                    </div>
                    <div style="font-size: 14px; line-height: 1.8; color: #334155;">
                        ${escapeHtml(announcement.content)}
                    </div>
                </div>
            </div>
        `;

        document.body.appendChild(modal);
        modal.querySelector('.modal-close').addEventListener('click', () => modal.remove());
        modal.addEventListener('click', (e) => { if (e.target === modal) modal.remove(); });
    }
};
