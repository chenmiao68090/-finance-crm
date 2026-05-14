// ============================================================
// mt-fields.js - 23种字段类型渲染器与编辑器
// ============================================================

MT.Fields = {
    TYPES: [
        { type: 'text', label: '单行文本', icon: 'T', group: '基础' },
        { type: 'longtext', label: '多行文本', icon: '¶', group: '基础' },
        { type: 'number', label: '数字', icon: '#', group: '基础' },
        { type: 'currency', label: '货币', icon: '¥', group: '基础' },
        { type: 'date', label: '日期', icon: '📅', group: '基础' },
        { type: 'select', label: '单选', icon: '◉', group: '选择' },
        { type: 'multiselect', label: '多选', icon: '☑', group: '选择' },
        { type: 'checkbox', label: '复选框', icon: '✓', group: '选择' },
        { type: 'url', label: '链接', icon: '🔗', group: '基础' },
        { type: 'email', label: '邮箱', icon: '✉', group: '基础' },
        { type: 'phone', label: '电话', icon: '📞', group: '基础' },
        { type: 'rating', label: '评分', icon: '★', group: '基础' },
        { type: 'progress', label: '进度', icon: '📊', group: '高级' },
        { type: 'auto_number', label: '自动编号', icon: '🔢', group: '系统' },
        { type: 'formula', label: '公式', icon: 'ƒ', group: '高级' },
        { type: 'lookup', label: '查找引用', icon: '🔍', group: '关联' },
        { type: 'link', label: '关联', icon: '⛓', group: '关联' },
        { type: 'person', label: '人员', icon: '👤', group: '高级' },
        { type: 'attachment', label: '附件', icon: '📎', group: '高级' },
        { type: 'barcode', label: '条码', icon: '⫶', group: '高级' },
        { type: 'location', label: '地理位置', icon: '📍', group: '高级' },
        { type: 'created_time', label: '创建时间', icon: '⏱', group: '系统' },
        { type: 'updated_time', label: '更新时间', icon: '⏰', group: '系统' },
    ],

    COLORS: [
        { bg: '#dbeafe', text: '#1e40af' },
        { bg: '#d1fae5', text: '#065f46' },
        { bg: '#fef3c7', text: '#92400e' },
        { bg: '#fed7aa', text: '#9a3412' },
        { bg: '#fee2e2', text: '#991b1b' },
        { bg: '#e9d5ff', text: '#6b21a8' },
        { bg: '#fce7f3', text: '#9d174d' },
        { bg: '#ccfbf1', text: '#115e59' },
        { bg: '#f3f4f6', text: '#374151' },
    ],

    getTypeIcon(type) {
        const t = this.TYPES.find(x => x.type === type);
        return t ? t.icon : 'T';
    },
    getTypeLabel(type) {
        const t = this.TYPES.find(x => x.type === type);
        return t ? t.label : type;
    },
    isReadOnly(type) {
        return ['created_time', 'updated_time', 'auto_number', 'formula', 'lookup'].includes(type);
    },

    // ===== 单元格渲染 =====
    renderCell(value, field) {
        const esc = MT.Core.esc;
        if (value === null || value === undefined) value = '';
        switch (field.type) {
            case 'text':
                return `<span class="mt-v-text">${esc(String(value))}</span>`;
            case 'longtext':
                return `<span class="mt-v-text mt-v-long">${esc(String(value).substring(0, 60))}${String(value).length > 60 ? '...' : ''}</span>`;
            case 'number': {
                const dec = (field.config && field.config.decimals) || 0;
                return `<span class="mt-v-num">${MT.Core.fmtNum(value, dec)}</span>`;
            }
            case 'currency': {
                const sym = (field.config && field.config.symbol) || '¥';
                const dec = (field.config && field.config.decimals) || 2;
                return `<span class="mt-v-num">${sym}${MT.Core.fmtNum(value, dec)}</span>`;
            }
            case 'date':
                return `<span class="mt-v-date">${MT.Core.fmtDate(value)}</span>`;
            case 'select': {
                if (!value) return '';
                const opts = (field.config && field.config.options) || [];
                const opt = opts.find(o => o.label === value);
                const c = opt ? this.COLORS[opt.color || 0] : this.COLORS[8];
                return `<span class="mt-v-tag" style="background:${c.bg};color:${c.text}">${esc(value)}</span>`;
            }
            case 'multiselect': {
                if (!Array.isArray(value) || !value.length) return '';
                const opts = (field.config && field.config.options) || [];
                return value.map(v => {
                    const opt = opts.find(o => o.label === v);
                    const c = opt ? this.COLORS[opt.color || 0] : this.COLORS[8];
                    return `<span class="mt-v-tag" style="background:${c.bg};color:${c.text}">${esc(v)}</span>`;
                }).join(' ');
            }
            case 'checkbox':
                return `<span class="mt-v-check">${value ? '✅' : '⬜'}</span>`;
            case 'url':
                return value ? `<a class="mt-v-link" href="${esc(value)}" target="_blank" onclick="event.stopPropagation()">${esc(String(value).substring(0, 30))}</a>` : '';
            case 'email':
                return value ? `<a class="mt-v-link" href="mailto:${esc(value)}" onclick="event.stopPropagation()">${esc(value)}</a>` : '';
            case 'phone':
                return value ? `<a class="mt-v-link" href="tel:${esc(value)}" onclick="event.stopPropagation()">${esc(value)}</a>` : '';
            case 'rating': {
                const max = (field.config && field.config.max) || 5;
                const v = parseInt(value) || 0;
                return `<span class="mt-v-rating">${'★'.repeat(Math.min(v, max))}${'☆'.repeat(Math.max(0, max - v))}</span>`;
            }
            case 'progress': {
                const pct = Math.min(100, Math.max(0, parseInt(value) || 0));
                return `<div class="mt-v-progress"><div class="mt-v-progress-bar"><div class="mt-v-progress-fill" style="width:${pct}%"></div></div><span class="mt-v-progress-text">${pct}%</span></div>`;
            }
            case 'auto_number':
                return `<span class="mt-v-auto-num">${esc(String(value))}</span>`;
            case 'formula': {
                if (value === '#ERROR') return `<span style="color:#ef4444">#ERROR</span>`;
                if (value === null) return '';
                const rt = field.config && field.config.resultType;
                if (rt === 'number') return `<span class="mt-v-formula">${MT.Core.fmtNum(value, 2)}</span>`;
                return `<span class="mt-v-formula">${esc(String(value))}</span>`;
            }
            case 'lookup':
                return value !== null && value !== undefined ? `<span class="mt-v-text">${esc(String(value))}</span>` : '';
            case 'link': {
                if (!Array.isArray(value) || !value.length) return '';
                return value.map(link => {
                    const targetTbl = MT.Core.tableById(link.tableId);
                    if (!targetTbl) return '';
                    const targetRec = targetTbl.records.find(r => r.id === link.recordId);
                    if (!targetRec) return '';
                    const primaryField = targetTbl.fields.find(f => f.isPrimary);
                    const label = primaryField ? targetRec.values[primaryField.id] : link.recordId;
                    return `<span class="mt-v-link-tag">${esc(String(label))}</span>`;
                }).join('');
            }
            case 'person': {
                if (!value) return '';
                const persons = Array.isArray(value) ? value : [value];
                return persons.filter(p => p && p.name).map(p => {
                    const initial = p.name.charAt(0);
                    return `<span class="mt-v-person"><span class="mt-v-person-avatar">${esc(initial)}</span>${esc(p.name)}</span>`;
                }).join(' ');
            }
            case 'attachment': {
                if (!Array.isArray(value) || !value.length) return '';
                return `<span class="mt-v-attach"><span class="mt-v-attach-icon">📎</span>${value.length}个文件</span>`;
            }
            case 'barcode':
                return value ? `<span class="mt-v-auto-num">${esc(String(value))}</span>` : '';
            case 'location': {
                if (!value || typeof value !== 'object') return '';
                return `<span class="mt-v-location">📍 ${esc(value.address || '')}</span>`;
            }
            case 'created_time':
                return `<span class="mt-v-time">${MT.Core.fmtDateTime(value)}</span>`;
            case 'updated_time':
                return `<span class="mt-v-time">${MT.Core.fmtDateTime(value)}</span>`;
            default:
                return esc(String(value));
        }
    },

    // ===== 行内编辑器 =====
    createEditor(cell, field, value, recordId) {
        if (this.isReadOnly(field.type)) return;

        if (field.type === 'checkbox') {
            MT.Core.updateRecordField(recordId, field.id, !value);
            return 'instant';
        }
        if (field.type === 'rating') {
            const max = (field.config && field.config.max) || 5;
            const cur = parseInt(value) || 0;
            MT.Core.updateRecordField(recordId, field.id, cur >= max ? 0 : cur + 1);
            return 'instant';
        }
        if (field.type === 'select') {
            this._showSelectEditor(cell, field, value, recordId);
            return 'dropdown';
        }
        if (field.type === 'multiselect') {
            this._showMultiSelectEditor(cell, field, value, recordId);
            return 'dropdown';
        }
        if (field.type === 'person') {
            this._showPersonEditor(cell, field, value, recordId);
            return 'dropdown';
        }
        if (field.type === 'progress') {
            return this._createProgressEditor(cell, field, value, recordId);
        }
        if (field.type === 'attachment') {
            this._showAttachmentEditor(cell, field, value, recordId);
            return 'dropdown';
        }
        if (field.type === 'link') {
            this._showLinkEditor(cell, field, value, recordId);
            return 'dropdown';
        }

        // 文本类编辑器
        let input;
        if (field.type === 'longtext') {
            input = document.createElement('textarea');
            input.className = 'mt-edit-input mt-edit-textarea';
            input.value = value || '';
            input.rows = 3;
        } else if (field.type === 'date') {
            input = document.createElement('input');
            input.type = 'date';
            input.className = 'mt-edit-input';
            input.value = value || '';
        } else if (field.type === 'number' || field.type === 'currency') {
            input = document.createElement('input');
            input.type = 'number';
            input.className = 'mt-edit-input';
            input.value = value || 0;
            input.step = field.type === 'currency' ? '0.01' : (field.config && field.config.decimals ? Math.pow(10, -field.config.decimals).toString() : '1');
        } else if (field.type === 'email') {
            input = document.createElement('input');
            input.type = 'email';
            input.className = 'mt-edit-input';
            input.value = value || '';
        } else if (field.type === 'url') {
            input = document.createElement('input');
            input.type = 'url';
            input.className = 'mt-edit-input';
            input.value = value || '';
            input.placeholder = 'https://';
        } else if (field.type === 'phone') {
            input = document.createElement('input');
            input.type = 'tel';
            input.className = 'mt-edit-input';
            input.value = value || '';
        } else if (field.type === 'barcode') {
            input = document.createElement('input');
            input.type = 'text';
            input.className = 'mt-edit-input';
            input.value = value || '';
            input.placeholder = '输入条码内容';
        } else if (field.type === 'location') {
            input = document.createElement('input');
            input.type = 'text';
            input.className = 'mt-edit-input';
            input.value = (value && value.address) || '';
            input.placeholder = '输入地址';
            input._isLocation = true;
        } else {
            input = document.createElement('input');
            input.type = 'text';
            input.className = 'mt-edit-input';
            input.value = value || '';
        }
        cell.innerHTML = '';
        cell.appendChild(input);
        input.focus();
        if (input.select) input.select();
        return input;
    },

    getEditValue(input, field) {
        if (!input) return null;
        let val = input.value;
        if (field.type === 'number' || field.type === 'currency') val = parseFloat(val) || 0;
        if (field.type === 'location' || input._isLocation) val = { address: val, lat: null, lng: null };
        return val;
    },

    _createProgressEditor(cell, field, value, recordId) {
        const pct = Math.min(100, Math.max(0, parseInt(value) || 0));
        const container = document.createElement('div');
        container.style.cssText = 'display:flex;align-items:center;gap:6px;width:100%;padding:2px 4px;';
        const input = document.createElement('input');
        input.type = 'range';
        input.min = '0';
        input.max = '100';
        input.value = pct;
        input.style.cssText = 'flex:1;';
        const span = document.createElement('span');
        span.textContent = pct + '%';
        span.style.cssText = 'font-size:11px;min-width:32px;text-align:right;';
        input.addEventListener('input', () => { span.textContent = input.value + '%'; });
        container.appendChild(input);
        container.appendChild(span);
        cell.innerHTML = '';
        cell.appendChild(container);
        input.focus();
        input._getVal = () => parseInt(input.value) || 0;
        return input;
    },

    _showSelectEditor(cell, field, curVal, recordId) {
        const opts = (field.config && field.config.options) || [];
        const dd = document.createElement('div');
        dd.className = 'mt-select-dropdown';
        dd.innerHTML = opts.map(o => {
            const c = this.COLORS[o.color || 0];
            return `<div class="mt-sel-opt ${o.label === curVal ? 'selected' : ''}" data-val="${MT.Core.esc(o.label)}" style="background:${c.bg};color:${c.text}">${MT.Core.esc(o.label)}</div>`;
        }).join('') + `<div class="mt-sel-opt mt-sel-clear" data-val="">清除</div>`;
        cell.style.overflow = 'visible';
        cell.appendChild(dd);
        dd.addEventListener('click', e => {
            const opt = e.target.closest('.mt-sel-opt');
            if (!opt) return;
            MT.Core.updateRecordField(recordId, field.id, opt.dataset.val || '');
            MT.Core.emit('view:refresh', {});
        });
    },
    _showMultiSelectEditor(cell, field, curVal, recordId) {
        const opts = (field.config && field.config.options) || [];
        const selected = Array.isArray(curVal) ? [...curVal] : [];
        const dd = document.createElement('div');
        dd.className = 'mt-select-dropdown mt-multisel-dropdown';
        dd.innerHTML = opts.map(o => {
            const c = this.COLORS[o.color || 0];
            const checked = selected.includes(o.label);
            return `<label class="mt-msel-opt"><input type="checkbox" value="${MT.Core.esc(o.label)}" ${checked ? 'checked' : ''}><span class="mt-msel-tag" style="background:${c.bg};color:${c.text}">${MT.Core.esc(o.label)}</span></label>`;
        }).join('');
        cell.style.overflow = 'visible';
        cell.appendChild(dd);
        dd.addEventListener('change', e => {
            const cb = e.target;
            if (cb.checked) { if (!selected.includes(cb.value)) selected.push(cb.value); }
            else { const i = selected.indexOf(cb.value); if (i > -1) selected.splice(i, 1); }
            MT.Core.updateRecordField(recordId, field.id, [...selected]);
        });
    },
    _showPersonEditor(cell, field, value, recordId) {
        const persons = (field.config && field.config.options) || [
            { name: '张伟' }, { name: '李娜' }, { name: '王强' }, { name: '赵敏' }, { name: '孙丽' }, { name: '马晓' }
        ];
        const dd = document.createElement('div');
        dd.className = 'mt-person-dropdown';
        const current = value && value.name ? value.name : '';
        dd.innerHTML = persons.map(p => {
            const initial = p.name.charAt(0);
            return `<div class="mt-person-option ${p.name === current ? 'selected' : ''}" data-name="${MT.Core.esc(p.name)}"><span class="mt-v-person-avatar">${MT.Core.esc(initial)}</span>${MT.Core.esc(p.name)}</div>`;
        }).join('') + `<div class="mt-person-option" data-name="">清除</div>`;
        cell.style.overflow = 'visible';
        cell.appendChild(dd);
        dd.addEventListener('click', e => {
            const opt = e.target.closest('.mt-person-option');
            if (!opt) return;
            const name = opt.dataset.name;
            MT.Core.updateRecordField(recordId, field.id, name ? { name, avatar: null } : null);
            MT.Core.emit('view:refresh', {});
        });
    },
    _showAttachmentEditor(cell, field, value, recordId) {
        const dd = document.createElement('div');
        dd.className = 'mt-select-dropdown';
        dd.style.minWidth = '240px';
        dd.style.padding = '12px';
        const files = Array.isArray(value) ? value : [];
        dd.innerHTML = `
            <div class="mt-attach-dropzone" id="mt-attach-zone">点击或拖拽上传文件<br><small>单文件最大2MB</small></div>
            <input type="file" id="mt-attach-file" style="display:none" multiple>
            <div class="mt-attach-list">${files.map((f, i) => `<div class="mt-attach-item"><span>${MT.Core.esc(f.name)}</span><span class="mt-attach-item-remove" data-i="${i}">×</span></div>`).join('')}</div>`;
        cell.style.overflow = 'visible';
        cell.appendChild(dd);
        const fileInput = dd.querySelector('#mt-attach-file');
        const zone = dd.querySelector('#mt-attach-zone');
        zone.addEventListener('click', () => fileInput.click());
        fileInput.addEventListener('change', () => {
            Array.from(fileInput.files).forEach(file => {
                if (file.size > 2 * 1024 * 1024) { alert('文件超过2MB限制: ' + file.name); return; }
                const reader = new FileReader();
                reader.onload = (e) => {
                    files.push({ name: file.name, dataUrl: e.target.result, size: file.size, type: file.type, uploadedAt: new Date().toISOString() });
                    MT.Core.updateRecordField(recordId, field.id, [...files]);
                    MT.Core.emit('view:refresh', {});
                };
                reader.readAsDataURL(file);
            });
        });
        dd.querySelector('.mt-attach-list').addEventListener('click', e => {
            const rm = e.target.closest('.mt-attach-item-remove');
            if (rm) {
                files.splice(parseInt(rm.dataset.i), 1);
                MT.Core.updateRecordField(recordId, field.id, [...files]);
                MT.Core.emit('view:refresh', {});
            }
        });
    },
    _showLinkEditor(cell, field, value, recordId) {
        const targetTableId = field.config && field.config.targetTableId;
        const targetTable = targetTableId ? MT.Core.tableById(targetTableId) : null;
        const dd = document.createElement('div');
        dd.className = 'mt-select-dropdown';
        dd.style.minWidth = '240px';
        if (!targetTable) {
            dd.innerHTML = '<div style="padding:12px;color:#94a3b8;font-size:12px;">请先配置关联表</div>';
            cell.style.overflow = 'visible';
            cell.appendChild(dd);
            return;
        }
        const primaryField = targetTable.fields.find(f => f.isPrimary);
        const linked = Array.isArray(value) ? value : [];
        const linkedIds = new Set(linked.map(l => l.recordId));
        dd.innerHTML = `<div style="padding:4px;"><input type="text" placeholder="搜索..." class="mt-edit-input" id="mt-link-search" style="margin-bottom:6px;border:1px solid #e2e8f0;border-radius:4px;padding:6px 8px;"></div>
            <div id="mt-link-options" style="max-height:180px;overflow-y:auto;">
                ${targetTable.records.map(r => {
                    const label = primaryField ? r.values[primaryField.id] : r.id;
                    const checked = linkedIds.has(r.id);
                    return `<label class="mt-msel-opt" style="padding:6px 8px;"><input type="checkbox" value="${r.id}" ${checked ? 'checked' : ''}><span>${MT.Core.esc(String(label))}</span></label>`;
                }).join('')}
            </div>`;
        cell.style.overflow = 'visible';
        cell.appendChild(dd);
        const optContainer = dd.querySelector('#mt-link-options');
        const searchInput = dd.querySelector('#mt-link-search');
        searchInput.addEventListener('input', () => {
            const q = searchInput.value.toLowerCase();
            optContainer.querySelectorAll('.mt-msel-opt').forEach(opt => {
                const text = opt.textContent.toLowerCase();
                opt.style.display = text.includes(q) ? '' : 'none';
            });
        });
        optContainer.addEventListener('change', e => {
            const cb = e.target;
            const newLinked = [];
            optContainer.querySelectorAll('input:checked').forEach(c => {
                newLinked.push({ tableId: targetTableId, recordId: c.value });
            });
            MT.Core.updateRecordField(recordId, field.id, newLinked);
        });
    },

    // ===== 详情面板编辑器 =====
    renderPanelEditor(record, field) {
        const val = record.values[field.id];
        const esc = MT.Core.esc;
        const fid = field.id;
        const rid = record.id;

        if (field.type === 'created_time' || field.type === 'updated_time')
            return `<span class="mt-rp-readonly">${MT.Core.fmtDateTime(val)}</span>`;
        if (field.type === 'auto_number')
            return `<span class="mt-rp-readonly">${esc(String(val || ''))}</span>`;
        if (field.type === 'formula')
            return `<span class="mt-rp-readonly">${val === '#ERROR' ? '<span style="color:#ef4444">#ERROR</span>' : esc(String(val || ''))}</span>`;
        if (field.type === 'lookup')
            return `<span class="mt-rp-readonly">${esc(String(val || ''))}</span>`;

        if (field.type === 'checkbox')
            return `<input type="checkbox" class="mt-rp-input" data-fid="${fid}" data-rid="${rid}" ${val ? 'checked' : ''}>`;

        if (field.type === 'select') {
            const opts = (field.config && field.config.options) || [];
            return `<select class="mt-rp-input mt-rp-select" data-fid="${fid}" data-rid="${rid}">
                <option value="">--</option>
                ${opts.map(o => `<option value="${esc(o.label)}" ${o.label === val ? 'selected' : ''}>${esc(o.label)}</option>`).join('')}
            </select>`;
        }
        if (field.type === 'multiselect') {
            const opts = (field.config && field.config.options) || [];
            const sel = Array.isArray(val) ? val : [];
            return `<div class="mt-rp-msel" data-fid="${fid}" data-rid="${rid}">
                ${opts.map(o => `<label class="mt-rp-msel-opt"><input type="checkbox" value="${esc(o.label)}" ${sel.includes(o.label) ? 'checked' : ''}>${esc(o.label)}</label>`).join('')}
            </div>`;
        }
        if (field.type === 'longtext')
            return `<textarea class="mt-rp-input mt-rp-textarea" data-fid="${fid}" data-rid="${rid}" rows="4">${esc(String(val || ''))}</textarea>`;
        if (field.type === 'number')
            return `<input type="number" class="mt-rp-input" data-fid="${fid}" data-rid="${rid}" value="${val || 0}" step="${field.config && field.config.decimals ? Math.pow(10, -field.config.decimals) : 1}">`;
        if (field.type === 'currency')
            return `<input type="number" class="mt-rp-input" data-fid="${fid}" data-rid="${rid}" value="${val || 0}" step="0.01">`;
        if (field.type === 'date')
            return `<input type="date" class="mt-rp-input" data-fid="${fid}" data-rid="${rid}" value="${val || ''}">`;
        if (field.type === 'rating') {
            const max = (field.config && field.config.max) || 5;
            const v = parseInt(val) || 0;
            return `<input type="range" class="mt-rp-input" data-fid="${fid}" data-rid="${rid}" min="0" max="${max}" value="${v}"> <span>${'★'.repeat(v)}${'☆'.repeat(max - v)}</span>`;
        }
        if (field.type === 'progress') {
            const pct = parseInt(val) || 0;
            return `<input type="range" class="mt-rp-input" data-fid="${fid}" data-rid="${rid}" min="0" max="100" value="${pct}"> <span>${pct}%</span>`;
        }
        if (field.type === 'person') {
            const persons = (field.config && field.config.options) || [
                { name: '张伟' }, { name: '李娜' }, { name: '王强' }, { name: '赵敏' }, { name: '孙丽' }, { name: '马晓' }
            ];
            const cur = val && val.name ? val.name : '';
            return `<select class="mt-rp-input mt-rp-select" data-fid="${fid}" data-rid="${rid}" data-type="person">
                <option value="">--</option>
                ${persons.map(p => `<option value="${esc(p.name)}" ${p.name === cur ? 'selected' : ''}>${esc(p.name)}</option>`).join('')}
            </select>`;
        }
        if (field.type === 'attachment') {
            const files = Array.isArray(val) ? val : [];
            return `<div data-fid="${fid}" data-rid="${rid}" data-type="attachment">
                <div class="mt-attach-list">${files.map((f, i) => `<div class="mt-attach-item"><span>${esc(f.name)}</span></div>`).join('')}</div>
                <button class="mt-btn-secondary" style="margin-top:8px;font-size:11px;" data-action="upload-attach" data-fid="${fid}" data-rid="${rid}">+ 上传附件</button>
            </div>`;
        }
        if (field.type === 'link') {
            const links = Array.isArray(val) ? val : [];
            return `<div data-fid="${fid}" data-rid="${rid}" data-type="link">
                ${links.map(l => {
                    const tbl = MT.Core.tableById(l.tableId);
                    const rec = tbl ? tbl.records.find(r => r.id === l.recordId) : null;
                    const primary = tbl ? tbl.fields.find(f => f.isPrimary) : null;
                    const label = rec && primary ? rec.values[primary.id] : l.recordId;
                    return `<span class="mt-v-link-tag">${esc(String(label))}</span>`;
                }).join(' ')}
                <button class="mt-btn-secondary" style="margin-top:8px;font-size:11px;" data-action="edit-link" data-fid="${fid}" data-rid="${rid}">编辑关联</button>
            </div>`;
        }
        if (field.type === 'barcode')
            return `<input type="text" class="mt-rp-input" data-fid="${fid}" data-rid="${rid}" value="${esc(String(val || ''))}" placeholder="输入条码内容">`;
        if (field.type === 'location') {
            const addr = (val && typeof val === 'object') ? val.address || '' : '';
            return `<input type="text" class="mt-rp-input" data-fid="${fid}" data-rid="${rid}" data-type="location" value="${esc(addr)}" placeholder="输入地址">`;
        }
        if (field.type === 'email')
            return `<input type="email" class="mt-rp-input" data-fid="${fid}" data-rid="${rid}" value="${esc(String(val || ''))}">`;
        if (field.type === 'url')
            return `<input type="url" class="mt-rp-input" data-fid="${fid}" data-rid="${rid}" value="${esc(String(val || ''))}" placeholder="https://">`;
        if (field.type === 'phone')
            return `<input type="tel" class="mt-rp-input" data-fid="${fid}" data-rid="${rid}" value="${esc(String(val || ''))}">`;
        return `<input type="text" class="mt-rp-input" data-fid="${fid}" data-rid="${rid}" value="${esc(String(val || ''))}">`;
    },

    getPanelEditValue(input, field) {
        if (field.type === 'checkbox') return input.checked;
        if (field.type === 'number' || field.type === 'currency') return parseFloat(input.value) || 0;
        if (field.type === 'rating' || field.type === 'progress') return parseInt(input.value) || 0;
        if (field.type === 'person') return input.value ? { name: input.value, avatar: null } : null;
        if (field.type === 'location') return { address: input.value, lat: null, lng: null };
        return input.value;
    },

    // ===== 添加字段对话框HTML =====
    renderAddFieldDialog() {
        const groups = {};
        this.TYPES.forEach(t => {
            if (!groups[t.group]) groups[t.group] = [];
            groups[t.group].push(t);
        });
        return `<div class="mt-modal-overlay" data-action="close-modal">
            <div class="mt-modal" onclick="event.stopPropagation()">
                <div class="mt-modal-header"><h3>添加字段</h3><button class="mt-btn-icon" data-action="close-modal"><i class="fas fa-times"></i></button></div>
                <div class="mt-modal-body">
                    <div class="mt-form-group"><label>字段名称</label><input type="text" id="field-name-input" class="mt-input" placeholder="输入字段名称"></div>
                    <div class="mt-form-group"><label>字段类型</label>
                        <select id="field-type-select" class="mt-input" onchange="MT.Fields._onTypeChange(this.value)">
                            ${Object.entries(groups).map(([group, types]) => `<optgroup label="${group}">${types.map(t => `<option value="${t.type}">${t.icon} ${t.label}</option>`).join('')}</optgroup>`).join('')}
                        </select>
                    </div>
                    <div id="field-config-area">${this.getFieldConfigHTML('text')}</div>
                </div>
                <div class="mt-modal-footer">
                    <button class="mt-btn" data-action="close-modal">取消</button>
                    <button class="mt-btn mt-btn-primary" data-action="confirm-add-field">添加</button>
                </div>
            </div>
        </div>`;
    },
    _onTypeChange(type) {
        const area = document.getElementById('field-config-area');
        if (area) area.innerHTML = this.getFieldConfigHTML(type);
    },
    getFieldConfigHTML(type) {
        switch (type) {
            case 'number': return '<div class="mt-form-group"><label>小数位数</label><input type="number" name="decimals" value="0" min="0" max="4"></div>';
            case 'currency': return '<div class="mt-form-group"><label>货币符号</label><input type="text" name="symbol" value="¥"></div><div class="mt-form-group"><label>小数位数</label><input type="number" name="decimals" value="2" min="0" max="4"></div>';
            case 'rating': return '<div class="mt-form-group"><label>最高分</label><input type="number" name="max" value="5" min="1" max="10"></div>';
            case 'progress': return '<div class="mt-form-group"><label>进度颜色</label><input type="color" name="color" value="#4f46e5"></div>';
            case 'select': case 'multiselect': return '<div class="mt-form-group"><label>选项（逗号分隔）</label><input type="text" name="options" placeholder="选项1,选项2,选项3"></div>';
            case 'auto_number': return '<div class="mt-form-group"><label>前缀</label><input type="text" name="prefix" value="" placeholder="如：NO-"></div><div class="mt-form-group"><label>位数</label><input type="number" name="digits" value="4" min="1" max="8"></div>';
            case 'formula': return '<div class="mt-form-group"><label>公式表达式</label><input type="text" name="expression" placeholder="{字段A} + {字段B}"><div class="mt-formula-help">支持: +, -, *, /, IF(), SUM(), AVG(), MAX(), MIN(), LEN(), ABS(), ROUND()</div></div>';
            case 'link': {
                const tables = MT.Core.workspace.tables;
                return `<div class="mt-form-group"><label>关联表</label><select name="targetTableId">${tables.map(t => `<option value="${t.id}">${MT.Core.esc(t.name)}</option>`).join('')}</select></div>`;
            }
            case 'lookup': {
                const tables = MT.Core.workspace.tables;
                const currentTable = MT.Core.tbl();
                const linkFields = currentTable.fields.filter(f => f.type === 'link');
                return `<div class="mt-form-group"><label>关联字段</label><select name="linkFieldId">${linkFields.map(f => `<option value="${f.id}">${MT.Core.esc(f.name)}</option>`).join('')}</select></div>
                    <div class="mt-form-group"><label>源表</label><select name="sourceTableId">${tables.map(t => `<option value="${t.id}">${MT.Core.esc(t.name)}</option>`).join('')}</select></div>
                    <div class="mt-form-group"><label>源字段ID</label><input type="text" name="sourceFieldId" placeholder="字段ID"></div>`;
            }
            case 'barcode': return '<div class="mt-form-group"><label>条码格式</label><select name="format"><option value="CODE128">CODE128</option><option value="EAN13">EAN-13</option></select></div>';
            default: return '';
        }
    },
    parseFieldConfig(type, container) {
        const config = {};
        const get = (name) => {
            if (!container) return '';
            const el = container.querySelector ? container.querySelector(`[name="${name}"]`) : null;
            return el ? el.value : '';
        };
        switch (type) {
            case 'number':
                config.decimals = parseInt(get('decimals')) || 0;
                break;
            case 'currency':
                config.symbol = get('symbol') || '¥';
                config.decimals = parseInt(get('decimals')) || 2;
                break;
            case 'rating':
                config.max = parseInt(get('max')) || 5;
                break;
            case 'progress':
                config.max = 100;
                config.color = get('color') || '#4f46e5';
                break;
            case 'select': case 'multiselect':
                config.options = (get('options') || '').split(',').map((s, i) => ({ label: s.trim(), color: i % this.COLORS.length })).filter(o => o.label);
                break;
            case 'auto_number':
                config.prefix = get('prefix') || '';
                config.digits = parseInt(get('digits')) || 4;
                break;
            case 'formula':
                config.expression = get('expression') || '';
                config.resultType = 'number';
                break;
            case 'link':
                config.targetTableId = get('targetTableId') || '';
                break;
            case 'lookup':
                config.linkFieldId = get('linkFieldId') || '';
                config.sourceTableId = get('sourceTableId') || '';
                config.sourceFieldId = get('sourceFieldId') || '';
                break;
            case 'barcode':
                config.format = get('format') || 'CODE128';
                break;
        }
        return config;
    }
};
