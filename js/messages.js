// 消息模块 - 内部沟通（支持云端存档）

const Messages = {
    conversations: [],
    currentConversation: null,
    currentUser: 'admin@zhqf.com',
    storageKey: 'zhqf_messages',

    // 模拟用户列表
    users: [
        { id: 'u1', name: '张伟', dept: '顾问部', avatar: '张', online: true },
        { id: 'u2', name: '李娜', dept: '会计部', avatar: '李', online: true },
        { id: 'u3', name: '王强', dept: '工商部', avatar: '王', online: false },
        { id: 'u4', name: '赵敏', dept: '刻章部', avatar: '赵', online: true },
        { id: 'u5', name: '陈浩', dept: '人事部', avatar: '陈', online: false },
        { id: 'u6', name: '刘洋', dept: '运营部', avatar: '刘', online: true },
        { id: 'u7', name: '周芳', dept: '顾问部', avatar: '周', online: false },
        { id: 'u8', name: '全体公告群', dept: '', avatar: '全', online: true, isGroup: true }
    ],

    init() {
        this.loadMessages();
        this.currentUser = (typeof Auth !== 'undefined' && Auth.currentUser) ? Auth.currentUser.email.split('@')[0] : 'admin';
        const contentArea = document.querySelector('.content-area');
        contentArea.innerHTML = this.render();
        this.bindEvents();
        // 默认选中第一个会话
        if (this.conversations.length > 0) {
            this.selectConversation(this.conversations[0].userId);
        }
    },

    destroy() {},

    loadMessages() {
        const saved = localStorage.getItem(this.storageKey);
        if (saved) {
            this.conversations = JSON.parse(saved);
        } else {
            this.seedMockData();
        }
    },

    saveMessages() {
        localStorage.setItem(this.storageKey, JSON.stringify(this.conversations));
        // 标记需要云端同步
        this.markForCloudSync();
    },

    markForCloudSync() {
        // 将消息标记为待同步状态，后续连接云端时批量上传
        const syncQueue = JSON.parse(localStorage.getItem('zhqf_msg_sync_queue') || '[]');
        syncQueue.push({
            timestamp: new Date().toISOString(),
            data: this.conversations
        });
        // 只保留最近10次变更
        if (syncQueue.length > 10) syncQueue.shift();
        localStorage.setItem('zhqf_msg_sync_queue', JSON.stringify(syncQueue));
    },

    seedMockData() {
        const now = new Date();
        this.conversations = [
            {
                userId: 'u8',
                messages: [
                    { from: '管理员', content: '各位同事，本周五下午3点在大会议室召开月度总结会，请准时参加。', time: this.timeAgo(now, 2) },
                    { from: '张伟', content: '收到，准时参加。', time: this.timeAgo(now, 1.5) },
                    { from: '李娜', content: '好的，我会准备好财务报表。', time: this.timeAgo(now, 1) }
                ]
            },
            {
                userId: 'u1',
                messages: [
                    { from: '张伟', content: '老板，杭州锐创科技那个项目方案我已经修改好了，您看下什么时候方便审批？', time: this.timeAgo(now, 5) },
                    { from: 'me', content: '好的，我下午看一下。报价方面有没有调整？', time: this.timeAgo(now, 4.5) },
                    { from: '张伟', content: '报价从15万调整到12.8万了，客户那边应该能接受。我附了详细的服务清单。', time: this.timeAgo(now, 4) },
                    { from: 'me', content: '可以，性价比合理。我审批后你就可以推进签约了。', time: this.timeAgo(now, 3) },
                    { from: '张伟', content: '好的谢谢老板！另外新华贸易那个项目也有进展了，对方下周一来拜访。', time: this.timeAgo(now, 0.5) }
                ]
            },
            {
                userId: 'u2',
                messages: [
                    { from: '李娜', content: '领导好，11月的财务报表已经出来了，整体营收环比增长8.5%。', time: this.timeAgo(now, 24) },
                    { from: 'me', content: '不错，利润率怎么样？', time: this.timeAgo(now, 23) },
                    { from: '李娜', content: '净利润率18.2%，比上月略有提升。主要是顾问部业绩带动的。', time: this.timeAgo(now, 22) },
                    { from: 'me', content: '好的，详细报表发我邮箱。', time: this.timeAgo(now, 21) },
                    { from: '李娜', content: '已发送，请查收。另外12月的税务申报下周截止，我这边已在准备。', time: this.timeAgo(now, 3) }
                ]
            },
            {
                userId: 'u3',
                messages: [
                    { from: '王强', content: '老板，工商部这个月目标完成了95%，最后几天我们全力冲刺。', time: this.timeAgo(now, 8) },
                    { from: 'me', content: '加油！还差多少？', time: this.timeAgo(now, 7) },
                    { from: '王强', content: '还差2单注册业务，已经有3个意向客户在跟进了。', time: this.timeAgo(now, 6) }
                ]
            },
            {
                userId: 'u6',
                messages: [
                    { from: '刘洋', content: '领导，这周的公众号数据：阅读量3200，新增粉丝158，转化线索12条。', time: this.timeAgo(now, 10) },
                    { from: 'me', content: '转化率不错，继续保持。下个月计划有什么新内容？', time: this.timeAgo(now, 9) },
                    { from: '刘洋', content: '计划做一期"创业必知的工商注册避坑指南"系列，预计能引流不少。', time: this.timeAgo(now, 8) }
                ]
            }
        ];
        this.saveMessages();
    },

    timeAgo(now, hoursAgo) {
        const d = new Date(now.getTime() - hoursAgo * 3600000);
        return d.toISOString();
    },

    formatTime(isoString) {
        const d = new Date(isoString);
        const now = new Date();
        const diff = now - d;
        if (diff < 60000) return '刚刚';
        if (diff < 3600000) return Math.floor(diff / 60000) + '分钟前';
        if (diff < 86400000) return Math.floor(diff / 3600000) + '小时前';
        if (diff < 172800000) return '昨天';
        return `${d.getMonth() + 1}/${d.getDate()}`;
    },

    render() {
        return `
        <div class="messages-page">
            <div class="messages-sidebar">
                <div class="messages-sidebar-header">
                    <h3>消息</h3>
                    <div class="messages-search">
                        <input type="text" placeholder="搜索联系人..." class="msg-search-input">
                    </div>
                </div>
                <div class="messages-contact-list">
                    ${this.renderContactList()}
                </div>
                <div class="messages-cloud-status">
                    <span class="cloud-icon">☁️</span>
                    <span class="cloud-text">消息已同步至云端 · 所有记录可追溯</span>
                </div>
            </div>
            <div class="messages-chat-area">
                <div class="messages-chat-empty">
                    <div class="chat-empty-icon">💬</div>
                    <p>选择一个对话开始聊天</p>
                    <p class="chat-empty-hint">所有消息将自动存档至云服务器</p>
                </div>
            </div>
        </div>`;
    },

    renderContactList() {
        return this.conversations.map(conv => {
            const user = this.users.find(u => u.id === conv.userId);
            if (!user) return '';
            const lastMsg = conv.messages[conv.messages.length - 1];
            const lastContent = lastMsg ? (lastMsg.from === 'me' ? '我: ' : '') + lastMsg.content : '';
            const lastTime = lastMsg ? this.formatTime(lastMsg.time) : '';
            return `
            <div class="msg-contact-item" data-user="${user.id}">
                <div class="msg-contact-avatar ${user.online ? 'online' : ''}">
                    <span>${user.avatar}</span>
                </div>
                <div class="msg-contact-info">
                    <div class="msg-contact-name-row">
                        <span class="msg-contact-name">${escapeHtml(user.name)}</span>
                        <span class="msg-contact-time">${lastTime}</span>
                    </div>
                    <p class="msg-contact-last">${escapeHtml(lastContent.substring(0, 30))}${lastContent.length > 30 ? '...' : ''}</p>
                </div>
            </div>`;
        }).join('');
    },

    renderChatArea(userId) {
        const user = this.users.find(u => u.id === userId);
        const conv = this.conversations.find(c => c.userId === userId);
        if (!user || !conv) return '';

        return `
        <div class="messages-chat-header">
            <div class="chat-header-info">
                <div class="msg-contact-avatar small ${user.online ? 'online' : ''}">
                    <span>${user.avatar}</span>
                </div>
                <div>
                    <h4>${escapeHtml(user.name)}</h4>
                    <span class="chat-header-status">${user.isGroup ? '群聊' : (user.online ? '在线' : '离线')}${user.dept ? ' · ' + user.dept : ''}</span>
                </div>
            </div>
            <div class="chat-header-actions">
                <button class="btn-chat-action" title="消息存档可通过云端随时调取">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="7,10 12,15 17,10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                </button>
            </div>
        </div>
        <div class="messages-chat-body" id="chat-body">
            ${conv.messages.map(msg => this.renderMessage(msg)).join('')}
        </div>
        <div class="messages-chat-input">
            <div class="chat-input-toolbar">
                <button class="btn-chat-tool" title="表情">😊</button>
                <button class="btn-chat-tool" title="文件">📎</button>
            </div>
            <div class="chat-input-row">
                <textarea id="msg-input" placeholder="输入消息... (Enter发送，Shift+Enter换行)" rows="1"></textarea>
                <button class="btn-send-msg" id="btn-send">发送</button>
            </div>
        </div>`;
    },

    renderMessage(msg) {
        const isMe = msg.from === 'me';
        const time = new Date(msg.time);
        const timeStr = `${time.getMonth() + 1}/${time.getDate()} ${String(time.getHours()).padStart(2, '0')}:${String(time.getMinutes()).padStart(2, '0')}`;
        return `
        <div class="chat-message ${isMe ? 'mine' : 'theirs'}">
            ${!isMe ? `<div class="chat-msg-avatar">${msg.from.charAt(0)}</div>` : ''}
            <div class="chat-msg-content">
                ${!isMe ? `<span class="chat-msg-sender">${escapeHtml(msg.from)}</span>` : ''}
                <div class="chat-msg-bubble">${escapeHtml(msg.content)}</div>
                <span class="chat-msg-time">${timeStr}</span>
            </div>
        </div>`;
    },

    selectConversation(userId) {
        this.currentConversation = userId;
        // 更新选中状态
        document.querySelectorAll('.msg-contact-item').forEach(el => {
            el.classList.toggle('active', el.dataset.user === userId);
        });
        // 渲染聊天区
        const chatArea = document.querySelector('.messages-chat-area');
        chatArea.innerHTML = this.renderChatArea(userId);
        // 滚动到底部
        const chatBody = document.getElementById('chat-body');
        if (chatBody) chatBody.scrollTop = chatBody.scrollHeight;
        // 绑定发送事件
        this.bindChatEvents();
    },

    bindEvents() {
        // 联系人点击
        document.querySelectorAll('.msg-contact-item').forEach(item => {
            item.addEventListener('click', () => {
                this.selectConversation(item.dataset.user);
            });
        });

        // 搜索
        const searchInput = document.querySelector('.msg-search-input');
        if (searchInput) {
            searchInput.addEventListener('input', (e) => {
                const keyword = e.target.value.toLowerCase();
                document.querySelectorAll('.msg-contact-item').forEach(item => {
                    const userId = item.dataset.user;
                    const user = this.users.find(u => u.id === userId);
                    const visible = !keyword || (user && (user.name.includes(keyword) || user.dept.includes(keyword)));
                    item.style.display = visible ? '' : 'none';
                });
            });
        }
    },

    bindChatEvents() {
        const input = document.getElementById('msg-input');
        const btnSend = document.getElementById('btn-send');
        if (!input || !btnSend) return;

        const sendMessage = () => {
            const content = input.value.trim();
            if (!content) return;

            const conv = this.conversations.find(c => c.userId === this.currentConversation);
            if (!conv) return;

            conv.messages.push({
                from: 'me',
                content: content,
                time: new Date().toISOString()
            });

            this.saveMessages();
            input.value = '';
            input.style.height = 'auto';

            // 刷新聊天区
            const chatBody = document.getElementById('chat-body');
            if (chatBody) {
                chatBody.innerHTML += this.renderMessage(conv.messages[conv.messages.length - 1]);
                chatBody.scrollTop = chatBody.scrollHeight;
            }

            // 更新联系人列表最后一条
            this.updateContactPreview(this.currentConversation);

            // 模拟回复
            setTimeout(() => this.simulateReply(), 1500 + Math.random() * 2000);
        };

        btnSend.addEventListener('click', sendMessage);
        input.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                sendMessage();
            }
        });

        // 自动调整高度
        input.addEventListener('input', () => {
            input.style.height = 'auto';
            input.style.height = Math.min(input.scrollHeight, 120) + 'px';
        });
    },

    simulateReply() {
        const conv = this.conversations.find(c => c.userId === this.currentConversation);
        const user = this.users.find(u => u.id === this.currentConversation);
        if (!conv || !user) return;

        const replies = [
            '好的，收到。', '我这边处理下。', '明白了，我马上安排。',
            '谢谢领导！', '没问题，今天就能完成。', '了解，我跟进一下。',
            '好的，稍后给您回复。', '收到，这就去办。'
        ];
        const reply = replies[Math.floor(Math.random() * replies.length)];

        conv.messages.push({
            from: user.name,
            content: reply,
            time: new Date().toISOString()
        });

        this.saveMessages();

        if (this.currentConversation === conv.userId) {
            const chatBody = document.getElementById('chat-body');
            if (chatBody) {
                chatBody.innerHTML += this.renderMessage(conv.messages[conv.messages.length - 1]);
                chatBody.scrollTop = chatBody.scrollHeight;
            }
        }
        this.updateContactPreview(conv.userId);
    },

    updateContactPreview(userId) {
        const conv = this.conversations.find(c => c.userId === userId);
        if (!conv) return;
        const lastMsg = conv.messages[conv.messages.length - 1];
        const item = document.querySelector(`.msg-contact-item[data-user="${userId}"]`);
        if (item && lastMsg) {
            const lastEl = item.querySelector('.msg-contact-last');
            const timeEl = item.querySelector('.msg-contact-time');
            if (lastEl) {
                const prefix = lastMsg.from === 'me' ? '我: ' : '';
                const text = prefix + lastMsg.content;
                lastEl.textContent = text.length > 30 ? text.substring(0, 30) + '...' : text;
            }
            if (timeEl) timeEl.textContent = this.formatTime(lastMsg.time);
        }
    }
};
