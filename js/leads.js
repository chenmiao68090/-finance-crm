// 线索管理模块 - 浙杭企服

// ===== HTML转义，防止XSS =====
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
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

// ===== LeadsStorage - 本地存储 =====
const LeadsStorage = {
    KEY: 'crm_leads',

    getAll() {
        const data = localStorage.getItem(this.KEY);
        return data ? JSON.parse(data) : [];
    },

    save(leads) {
        localStorage.setItem(this.KEY, JSON.stringify(leads));
    },

    add(leadData) {
        const leads = this.getAll();
        const now = new Date().toISOString();
        const lead = {
            id: Date.now().toString(36) + Math.random().toString(36).slice(2, 8),
            name: '',
            phone: '',
            wechat: '',
            source: '',
            intent_level: 'C',
            company: '',
            position: '',
            industry: '',
            region: '',
            follow_records: [],
            next_contact_date: '',
            notes: '',
            status: 'new',
            owner: LeadsStorage.getCurrentOwner(),
            is_public: false,
            created_at: now,
            last_follow_date: '',
            updated_at: now,
            ...leadData
        };
        leads.unshift(lead);
        this.save(leads);
        return lead;
    },

    update(id, updates) {
        const leads = this.getAll();
        const idx = leads.findIndex(l => l.id === id);
        if (idx === -1) return null;
        leads[idx] = { ...leads[idx], ...updates, updated_at: new Date().toISOString() };
        this.save(leads);
        return leads[idx];
    },

    delete(id) {
        const leads = this.getAll().filter(l => l.id !== id);
        this.save(leads);
    },

    bulkInsert(items) {
        const leads = this.getAll();
        const now = new Date().toISOString();
        const owner = this.getCurrentOwner();
        const newLeads = items.map(item => ({
            id: Date.now().toString(36) + Math.random().toString(36).slice(2, 8) + Math.random().toString(36).slice(2, 4),
            name: '', phone: '', wechat: '', source: '', intent_level: 'C',
            company: '', position: '', industry: '', region: '',
            follow_records: [], next_contact_date: '', notes: '',
            status: 'new', owner, is_public: false,
            created_at: now, last_follow_date: '', updated_at: now,
            ...item
        }));
        this.save([...newLeads, ...leads]);
        return newLeads;
    },

    getCurrentOwner() {
        if (typeof Auth !== 'undefined' && Auth.currentUser) {
            return Auth.currentUser.email || 'admin';
        }
        return 'admin';
    }
};

// ===== Leads 主模块 =====
const Leads = {
    currentTab: 'my',
    searchText: '',
    filterIntent: 'all',
    filterSource: 'all',
    filterStatus: 'all',
    detailLeadId: null,

    init() {
        this.autoReclaimCheck();
        this.renderPage();
        this.bindEvents();
    },

    destroy() {
        const panel = document.getElementById('lead-detail-panel');
        if (panel) panel.classList.remove('open');
    },

    // ===== 自动回收 =====
    autoReclaimCheck() {
        const leads = LeadsStorage.getAll();
        const SEVEN_DAYS = 7 * 24 * 60 * 60 * 1000;
        const now = Date.now();
        let count = 0;

        leads.forEach(lead => {
            if (lead.is_public) return;
            if (lead.status === 'converted' || lead.status === 'lost') return;
            const refDate = lead.last_follow_date || lead.created_at;
            if (!refDate) return;
            if (now - new Date(refDate).getTime() > SEVEN_DAYS) {
                lead.is_public = true;
                lead.owner = '';
                count++;
            }
        });

        if (count > 0) {
            LeadsStorage.save(leads);
            setTimeout(() => showToast(`${count}条线索因超过7天未跟进已自动退回公海`, 'warning'), 500);
        }
    },

    // ===== 页面渲染 =====
    renderPage() {
        const contentArea = document.querySelector('.content-area');
        contentArea.innerHTML = `
            <div id="leads-page">
                <div class="leads-header">
                    <h2>线索管理</h2>
                    <div class="leads-header-actions">
                        <button class="btn-primary" id="btn-add-lead">+ 新增线索</button>
                        <button class="btn-secondary" id="btn-batch-import">批量导入</button>
                    </div>
                </div>
                <div class="leads-stats-row" id="leads-stats"></div>
                <div class="leads-tabs">
                    <button class="leads-tab active" data-tab="my">我的线索</button>
                    <button class="leads-tab" data-tab="public">公海池</button>
                </div>
                <div class="leads-toolbar">
                    <input type="text" class="search-input" id="leads-search" placeholder="搜索姓名/电话/公司...">
                    <select class="filter-select" id="filter-intent">
                        <option value="all">意向等级</option>
                        <option value="A">A-高意向</option>
                        <option value="B">B-有意向</option>
                        <option value="C">C-一般</option>
                        <option value="D">D-低意向</option>
                    </select>
                    <select class="filter-select" id="filter-source">
                        <option value="all">来源渠道</option>
                        <option value="抖音">抖音</option>
                        <option value="小红书">小红书</option>
                        <option value="百度">百度</option>
                        <option value="转介绍">转介绍</option>
                        <option value="电话营销">电话营销</option>
                        <option value="其他">其他</option>
                    </select>
                    <select class="filter-select" id="filter-status">
                        <option value="all">状态</option>
                        <option value="new">新线索</option>
                        <option value="following">跟进中</option>
                        <option value="converted">已转化</option>
                        <option value="lost">已流失</option>
                    </select>
                </div>
                <div class="table-container">
                    <table class="data-table">
                        <thead>
                            <tr>
                                <th>姓名</th>
                                <th>电话</th>
                                <th>公司</th>
                                <th>意向</th>
                                <th>状态</th>
                                <th>来源</th>
                                <th>最近跟进</th>
                                <th>操作</th>
                            </tr>
                        </thead>
                        <tbody id="leads-table-body"></tbody>
                    </table>
                </div>
            </div>

            <!-- 新增线索弹窗 -->
            <div id="add-lead-modal" class="modal">
                <div class="modal-content" style="max-width:600px;">
                    <div class="modal-header">
                        <h3>新增线索</h3>
                        <button class="modal-close" data-close="add-lead-modal">&times;</button>
                    </div>
                    <form id="add-lead-form">
                        <div class="form-row">
                            <div class="form-group"><label>姓名 *</label><input type="text" name="name" required></div>
                            <div class="form-group"><label>电话 *</label><input type="tel" name="phone" required></div>
                        </div>
                        <div class="form-row">
                            <div class="form-group"><label>微信</label><input type="text" name="wechat"></div>
                            <div class="form-group"><label>意向等级</label>
                                <select name="intent_level">
                                    <option value="C">C-一般</option>
                                    <option value="A">A-高意向</option>
                                    <option value="B">B-有意向</option>
                                    <option value="D">D-低意向</option>
                                </select>
                            </div>
                        </div>
                        <div class="form-row">
                            <div class="form-group"><label>来源渠道</label>
                                <select name="source">
                                    <option value="">请选择</option>
                                    <option value="抖音">抖音</option>
                                    <option value="小红书">小红书</option>
                                    <option value="百度">百度</option>
                                    <option value="转介绍">转介绍</option>
                                    <option value="电话营销">电话营销</option>
                                    <option value="其他">其他</option>
                                </select>
                            </div>
                            <div class="form-group"><label>公司名称</label><input type="text" name="company"></div>
                        </div>
                        <div class="form-row">
                            <div class="form-group"><label>职位</label><input type="text" name="position"></div>
                            <div class="form-group"><label>行业</label><input type="text" name="industry"></div>
                        </div>
                        <div class="form-row">
                            <div class="form-group"><label>地区</label><input type="text" name="region"></div>
                            <div class="form-group"><label>下次联系时间</label><input type="date" name="next_contact_date"></div>
                        </div>
                        <div class="form-group"><label>备注</label><textarea name="notes" rows="2"></textarea></div>
                        <div class="form-actions">
                            <button type="button" class="btn-secondary" data-close="add-lead-modal">取消</button>
                            <button type="submit" class="btn-primary">保存</button>
                        </div>
                    </form>
                </div>
            </div>

            <!-- 批量导入弹窗 -->
            <div id="batch-import-modal" class="modal">
                <div class="modal-content" style="max-width:550px;">
                    <div class="modal-header">
                        <h3>批量导入线索</h3>
                        <button class="modal-close" data-close="batch-import-modal">&times;</button>
                    </div>
                    <form id="batch-import-form">
                        <p class="import-hint">每行一条线索，格式：姓名 电话 公司（空格或Tab分隔，公司可选）</p>
                        <div class="form-group">
                            <textarea id="import-textarea" rows="8" placeholder="张三 13800138000 ABC公司&#10;李四 13900139000&#10;王五 13700137000 XYZ科技"></textarea>
                        </div>
                        <div class="import-preview" id="import-preview"></div>
                        <div class="form-actions">
                            <button type="button" class="btn-secondary" data-close="batch-import-modal">取消</button>
                            <button type="submit" class="btn-primary">确认导入</button>
                        </div>
                    </form>
                </div>
            </div>

            <!-- 添加跟进弹窗 -->
            <div id="follow-up-modal" class="modal">
                <div class="modal-content" style="max-width:450px;">
                    <div class="modal-header">
                        <h3>添加跟进记录</h3>
                        <button class="modal-close" data-close="follow-up-modal">&times;</button>
                    </div>
                    <form id="follow-up-form">
                        <div class="form-group"><label>跟进内容 *</label><textarea name="content" rows="3" required></textarea></div>
                        <div class="form-group"><label>下次联系时间</label><input type="date" name="next_contact_date"></div>
                        <div class="form-actions">
                            <button type="button" class="btn-secondary" data-close="follow-up-modal">取消</button>
                            <button type="submit" class="btn-primary">保存</button>
                        </div>
                    </form>
                </div>
            </div>

            <!-- 详情面板 -->
            <div id="lead-detail-panel" class="leads-detail-panel">
                <div id="detail-content"></div>
            </div>
        `;
        this.renderStats();
        this.renderTable();
    },

    // ===== 统计卡片 =====
    renderStats() {
        const leads = LeadsStorage.getAll();
        const owner = LeadsStorage.getCurrentOwner();
        const myLeads = leads.filter(l => !l.is_public && l.owner === owner);
        const today = new Date().toISOString().slice(0, 10);
        const todayFollow = myLeads.filter(l => l.next_contact_date === today).length;
        const aLevel = myLeads.filter(l => l.intent_level === 'A').length;
        const publicCount = leads.filter(l => l.is_public).length;

        document.getElementById('leads-stats').innerHTML = `
            <div class="mini-stat"><div class="mini-stat-value">${myLeads.length}</div><div class="mini-stat-label">我的线索</div></div>
            <div class="mini-stat"><div class="mini-stat-value" style="color:#10b981;">${aLevel}</div><div class="mini-stat-label">A级线索</div></div>
            <div class="mini-stat"><div class="mini-stat-value" style="color:#f59e0b;">${todayFollow}</div><div class="mini-stat-label">今日待跟进</div></div>
            <div class="mini-stat"><div class="mini-stat-value" style="color:#6366f1;">${publicCount}</div><div class="mini-stat-label">公海线索</div></div>
        `;
    },

    // ===== 表格渲染 =====
    renderTable() {
        const filtered = this.getFilteredLeads();
        const tbody = document.getElementById('leads-table-body');
        if (!tbody) return;

        if (filtered.length === 0) {
            tbody.innerHTML = `<tr><td colspan="8"><div class="empty-state"><p>${this.currentTab === 'my' ? '暂无线索，点击"新增线索"添加' : '公海池暂无线索'}</p></div></td></tr>`;
            return;
        }

        tbody.innerHTML = filtered.map(lead => {
            const intentClass = `intent-${lead.intent_level.toLowerCase()}`;
            const statusMap = { new: '新线索', following: '跟进中', converted: '已转化', lost: '已流失' };
            const statusClassMap = { new: 'status-pending', following: 'status-active', converted: 'status-completed', lost: 'status-expired' };
            const lastFollow = lead.last_follow_date ? new Date(lead.last_follow_date).toLocaleDateString('zh-CN') : '-';
            const actions = this.currentTab === 'public'
                ? `<button class="btn-claim" data-action="claim" data-id="${lead.id}">领取</button>`
                : `<button class="btn-release" data-action="release" data-id="${lead.id}">退回公海</button>`;

            return `
                <tr class="clickable" data-lead-id="${lead.id}">
                    <td><strong>${escapeHtml(lead.name)}</strong></td>
                    <td>${escapeHtml(lead.phone) || '-'}</td>
                    <td>${escapeHtml(lead.company) || '-'}</td>
                    <td><span class="status-badge ${intentClass}">${escapeHtml(lead.intent_level)}</span></td>
                    <td><span class="status-badge ${statusClassMap[lead.status]}">${statusMap[lead.status]}</span></td>
                    <td>${escapeHtml(lead.source) || '-'}</td>
                    <td>${lastFollow}</td>
                    <td class="action-cell">${actions}</td>
                </tr>
            `;
        }).join('');
    },

    // ===== 筛选逻辑 =====
    getFilteredLeads() {
        const leads = LeadsStorage.getAll();
        const owner = LeadsStorage.getCurrentOwner();

        let filtered = this.currentTab === 'public'
            ? leads.filter(l => l.is_public)
            : leads.filter(l => !l.is_public && l.owner === owner);

        if (this.searchText) {
            const s = this.searchText.toLowerCase();
            filtered = filtered.filter(l =>
                (l.name && l.name.toLowerCase().includes(s)) ||
                (l.phone && l.phone.includes(s)) ||
                (l.company && l.company.toLowerCase().includes(s))
            );
        }
        if (this.filterIntent !== 'all') filtered = filtered.filter(l => l.intent_level === this.filterIntent);
        if (this.filterSource !== 'all') filtered = filtered.filter(l => l.source === this.filterSource);
        if (this.filterStatus !== 'all') filtered = filtered.filter(l => l.status === this.filterStatus);

        return filtered;
    },

    // ===== 事件绑定 =====
    bindEvents() {
        const page = document.getElementById('leads-page');
        if (!page) return;

        // Tab 切换
        page.addEventListener('click', (e) => {
            const tab = e.target.closest('.leads-tab');
            if (tab) {
                this.currentTab = tab.dataset.tab;
                page.querySelectorAll('.leads-tab').forEach(t => t.classList.remove('active'));
                tab.classList.add('active');
                this.renderTable();
                return;
            }

            // 表格行点击 -> 详情
            const row = e.target.closest('tr.clickable');
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
                else if (action === 'release') this.releaseLead(id);
                return;
            }
        });

        // 搜索
        const searchInput = document.getElementById('leads-search');
        let searchTimer;
        searchInput.addEventListener('input', () => {
            clearTimeout(searchTimer);
            searchTimer = setTimeout(() => {
                this.searchText = searchInput.value.trim();
                this.renderTable();
            }, 300);
        });

        // 筛选
        document.getElementById('filter-intent').addEventListener('change', (e) => { this.filterIntent = e.target.value; this.renderTable(); });
        document.getElementById('filter-source').addEventListener('change', (e) => { this.filterSource = e.target.value; this.renderTable(); });
        document.getElementById('filter-status').addEventListener('change', (e) => { this.filterStatus = e.target.value; this.renderTable(); });

        // 新增线索
        document.getElementById('btn-add-lead').addEventListener('click', () => this.openModal('add-lead-modal'));
        document.getElementById('add-lead-form').addEventListener('submit', (e) => this.handleAddSubmit(e));

        // 批量导入
        document.getElementById('btn-batch-import').addEventListener('click', () => this.openModal('batch-import-modal'));
        document.getElementById('import-textarea').addEventListener('input', (e) => this.updateImportPreview(e.target.value));
        document.getElementById('batch-import-form').addEventListener('submit', (e) => this.handleImportSubmit(e));

        // 跟进表单
        document.getElementById('follow-up-form').addEventListener('submit', (e) => this.handleFollowUpSubmit(e));

        // 关闭弹窗
        document.querySelectorAll('[data-close]').forEach(btn => {
            btn.addEventListener('click', () => this.closeModal(btn.dataset.close));
        });

        // 详情面板关闭
        document.getElementById('lead-detail-panel').addEventListener('click', (e) => {
            if (e.target.closest('.close-panel')) this.hideDetail();
            if (e.target.closest('[data-detail-action]')) {
                const action = e.target.closest('[data-detail-action]').dataset.detailAction;
                this.handleDetailAction(action);
            }
        });
    },

    // ===== 弹窗管理 =====
    openModal(id) { document.getElementById(id).classList.add('active'); },
    closeModal(id) {
        document.getElementById(id).classList.remove('active');
        const form = document.querySelector(`#${id} form`);
        if (form) form.reset();
        document.getElementById('import-preview') && (document.getElementById('import-preview').innerHTML = '');
    },

    // ===== 新增线索 =====
    handleAddSubmit(e) {
        e.preventDefault();
        const form = e.target;
        const data = Object.fromEntries(new FormData(form));
        LeadsStorage.add(data);
        this.closeModal('add-lead-modal');
        this.renderStats();
        this.renderTable();
        showToast('线索添加成功', 'success');
    },

    // ===== 批量导入 =====
    updateImportPreview(text) {
        const lines = text.split('\n').map(l => l.trim()).filter(l => l);
        const preview = document.getElementById('import-preview');
        preview.innerHTML = lines.length > 0 ? `<span>识别到 <strong>${lines.length}</strong> 条线索</span>` : '';
    },

    handleImportSubmit(e) {
        e.preventDefault();
        const text = document.getElementById('import-textarea').value;
        const lines = text.split('\n').map(l => l.trim()).filter(l => l);
        if (lines.length === 0) { showToast('请输入线索数据', 'warning'); return; }

        const items = lines.map(line => {
            const parts = line.split(/[\s\t]+/);
            return {
                name: parts[0] || '',
                phone: parts[1] || '',
                company: parts[2] || ''
            };
        }).filter(item => item.name);

        LeadsStorage.bulkInsert(items);
        this.closeModal('batch-import-modal');
        this.renderStats();
        this.renderTable();
        showToast(`成功导入 ${items.length} 条线索`, 'success');
    },

    // ===== 详情面板 =====
    showDetail(id) {
        const leads = LeadsStorage.getAll();
        const lead = leads.find(l => l.id === id);
        if (!lead) return;
        this.detailLeadId = id;

        const statusMap = { new: '新线索', following: '跟进中', converted: '已转化', lost: '已流失' };
        const intentMap = { A: 'A-高意向', B: 'B-有意向', C: 'C-一般', D: 'D-低意向' };
        const records = (lead.follow_records || []).sort((a, b) => new Date(b.date) - new Date(a.date));

        const isPublic = lead.is_public;
        const actionBtn = isPublic
            ? `<button class="btn-primary btn-small" data-detail-action="claim">领取线索</button>`
            : `<button class="btn-secondary btn-small" data-detail-action="release">退回公海</button>`;

        document.getElementById('detail-content').innerHTML = `
            <div class="detail-header">
                <div>
                    <h3>${escapeHtml(lead.name)}</h3>
                    <span class="status-badge intent-${lead.intent_level.toLowerCase()}">${intentMap[lead.intent_level]}</span>
                </div>
                <button class="close-panel">&times;</button>
            </div>
            <div class="detail-section">
                <h4>基本信息</h4>
                <div class="detail-fields-grid">
                    <div><span class="detail-field-label">电话</span><span class="detail-field-value">${escapeHtml(lead.phone) || '-'}</span></div>
                    <div><span class="detail-field-label">微信</span><span class="detail-field-value">${escapeHtml(lead.wechat) || '-'}</span></div>
                    <div><span class="detail-field-label">来源</span><span class="detail-field-value">${escapeHtml(lead.source) || '-'}</span></div>
                    <div><span class="detail-field-label">下次联系</span><span class="detail-field-value">${lead.next_contact_date || '-'}</span></div>
                </div>
            </div>
            <div class="detail-section">
                <h4>企业信息</h4>
                <div class="detail-fields-grid">
                    <div><span class="detail-field-label">公司</span><span class="detail-field-value">${escapeHtml(lead.company) || '-'}</span></div>
                    <div><span class="detail-field-label">职位</span><span class="detail-field-value">${escapeHtml(lead.position) || '-'}</span></div>
                    <div><span class="detail-field-label">行业</span><span class="detail-field-value">${escapeHtml(lead.industry) || '-'}</span></div>
                    <div><span class="detail-field-label">地区</span><span class="detail-field-value">${escapeHtml(lead.region) || '-'}</span></div>
                </div>
            </div>
            <div class="detail-section">
                <h4>状态管理</h4>
                <div class="detail-status-row">
                    <select id="detail-status-select" class="filter-select">
                        <option value="new" ${lead.status === 'new' ? 'selected' : ''}>新线索</option>
                        <option value="following" ${lead.status === 'following' ? 'selected' : ''}>跟进中</option>
                        <option value="converted" ${lead.status === 'converted' ? 'selected' : ''}>已转化</option>
                        <option value="lost" ${lead.status === 'lost' ? 'selected' : ''}>已流失</option>
                    </select>
                    ${actionBtn}
                </div>
            </div>
            <div class="detail-section">
                <div class="detail-section-header">
                    <h4>跟进记录</h4>
                    <button class="btn-primary btn-small" data-detail-action="follow">+ 添加跟进</button>
                </div>
                ${records.length > 0 ? `
                    <div class="follow-timeline">
                        ${records.map(r => `
                            <div class="follow-item">
                                <span class="follow-date">${new Date(r.date).toLocaleString('zh-CN')}</span>
                                <p class="follow-content">${escapeHtml(r.content)}</p>
                            </div>
                        `).join('')}
                    </div>
                ` : '<p class="empty-hint">暂无跟进记录</p>'}
            </div>
            <div class="detail-section">
                <button class="btn-danger" data-detail-action="delete" style="width:100%;">删除线索</button>
            </div>
        `;

        // 状态变更
        const statusSelect = document.getElementById('detail-status-select');
        if (statusSelect) {
            statusSelect.addEventListener('change', () => {
                this.updateStatus(id, statusSelect.value);
            });
        }

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
        else if (action === 'follow') this.openModal('follow-up-modal');
        else if (action === 'delete') this.deleteLead(this.detailLeadId);
    },

    // ===== 跟进记录 =====
    handleFollowUpSubmit(e) {
        e.preventDefault();
        if (!this.detailLeadId) return;
        const form = e.target;
        const content = form.querySelector('[name="content"]').value;
        const nextDate = form.querySelector('[name="next_contact_date"]').value;

        const leads = LeadsStorage.getAll();
        const lead = leads.find(l => l.id === this.detailLeadId);
        if (!lead) return;

        lead.follow_records = lead.follow_records || [];
        lead.follow_records.push({ date: new Date().toISOString(), content });
        lead.last_follow_date = new Date().toISOString();
        if (nextDate) lead.next_contact_date = nextDate;
        if (lead.status === 'new') lead.status = 'following';
        lead.updated_at = new Date().toISOString();

        LeadsStorage.save(leads);
        this.closeModal('follow-up-modal');
        this.showDetail(this.detailLeadId);
        this.renderTable();
        this.renderStats();
        showToast('跟进记录已添加', 'success');
    },

    // ===== 公海操作 =====
    claimLead(id) {
        LeadsStorage.update(id, { is_public: false, owner: LeadsStorage.getCurrentOwner() });
        this.renderTable();
        this.renderStats();
        if (this.detailLeadId === id) this.showDetail(id);
        showToast('线索已领取', 'success');
    },

    releaseLead(id) {
        if (!confirm('确定退回公海？')) return;
        LeadsStorage.update(id, { is_public: true, owner: '' });
        this.renderTable();
        this.renderStats();
        if (this.detailLeadId === id) this.hideDetail();
        showToast('已退回公海', 'info');
    },

    // ===== 状态变更 =====
    updateStatus(id, status) {
        LeadsStorage.update(id, { status });
        this.renderTable();
        showToast('状态已更新', 'success');
    },

    // ===== 删除 =====
    deleteLead(id) {
        if (!confirm('确定删除该线索？此操作不可恢复。')) return;
        LeadsStorage.delete(id);
        this.hideDetail();
        this.renderTable();
        this.renderStats();
        showToast('线索已删除', 'info');
    }
};
