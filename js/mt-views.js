// ============================================================
// mt-views.js - 看板、画廊、甘特图、日历、表单视图
// ============================================================

MT.Views = {
    // ===== 看板视图 =====
    renderKanban(records, table, view) {
        let kfId = view.kanbanField;
        const kField = table.fields.find(f => f.id === kfId && f.type === 'select');
        if (!kField) {
            const selField = table.fields.find(f => f.type === 'select');
            if (!selField) return '<div class="mt-kanban-empty">需要至少一个单选字段才能使用看板视图<br><small>请添加一个"单选"类型的字段</small></div>';
            kfId = selField.id;
            view.kanbanField = kfId;
            MT.Core.save();
        }
        const opts = (kField ? kField.config && kField.config.options : []) || [];
        const cols = {};
        opts.forEach(o => { cols[o.label] = []; });
        cols['未分类'] = [];
        records.forEach(rec => {
            const val = rec.values[kfId] || '';
            if (cols[val]) cols[val].push(rec);
            else cols['未分类'].push(rec);
        });
        const primary = table.fields.find(f => f.isPrimary);
        const cardFields = (view.kanbanCardFields && view.kanbanCardFields.length)
            ? view.kanbanCardFields.map(id => table.fields.find(f => f.id === id)).filter(Boolean)
            : table.fields.filter(f => !f.isPrimary && f.visible && f.type !== 'longtext').slice(0, 3);
        const coverField = view.kanbanCardCover ? table.fields.find(f => f.id === view.kanbanCardCover && f.type === 'attachment') : null;

        return `<div class="mt-kanban-header">
            <span>分组字段：</span>
            <select id="mt-kanban-field">${table.fields.filter(f => f.type === 'select').map(f =>
                `<option value="${f.id}" ${f.id === kfId ? 'selected' : ''}>${MT.Core.esc(f.name)}</option>`).join('')}</select>
        </div>
        <div class="mt-kanban-board">
            ${Object.entries(cols).map(([colName, cards]) => {
                const opt = opts.find(o => o.label === colName);
                const color = opt ? MT.Fields.COLORS[opt.color || 0] : { bg: '#f3f4f6', text: '#374151' };
                return `<div class="mt-kanban-col" data-col="${MT.Core.esc(colName)}" data-fid="${kfId}">
                    <div class="mt-kanban-col-head">
                        <span class="mt-kanban-col-tag" style="background:${color.bg};color:${color.text}">${MT.Core.esc(colName)}</span>
                        <span class="mt-kanban-col-count">${cards.length}</span>
                    </div>
                    <div class="mt-kanban-col-body" data-col="${MT.Core.esc(colName)}" data-fid="${kfId}">
                        ${cards.map(rec => {
                            const coverHtml = coverField && Array.isArray(rec.values[coverField.id]) && rec.values[coverField.id].length
                                ? `<img class="mt-kcard-cover" src="${rec.values[coverField.id][0].dataUrl}" alt="">`
                                : '';
                            return `<div class="mt-kanban-card" draggable="true" data-rid="${rec.id}">
                                ${coverHtml}
                                <div class="mt-kcard-title">${MT.Core.esc(primary ? String(rec.values[primary.id] || '') : rec.id)}</div>
                                ${cardFields.map(sf => `<div class="mt-kcard-field">
                                    <span class="mt-kcard-label">${MT.Core.esc(sf.name)}</span>
                                    <span class="mt-kcard-value">${MT.Fields.renderCell(rec.values[sf.id], sf)}</span>
                                </div>`).join('')}
                            </div>`;
                        }).join('')}
                    </div>
                    <div class="mt-kanban-add-card" data-col="${MT.Core.esc(colName)}" data-fid="${kfId}" data-action="kanban-add">+ 添加</div>
                </div>`;
            }).join('')}
        </div>`;
    },

    // ===== 画廊视图 =====
    renderGallery(records, table, view) {
        const cols = view.galleryColumns || 4;
        const primary = table.fields.find(f => f.isPrimary);
        const coverField = view.galleryCoverField ? table.fields.find(f => f.id === view.galleryCoverField) : null;
        const cardFields = (view.galleryCardFields && view.galleryCardFields.length)
            ? view.galleryCardFields.map(id => table.fields.find(f => f.id === id)).filter(Boolean)
            : table.fields.filter(f => !f.isPrimary && f.visible).slice(0, 4);

        return `<div class="mt-gallery-header">
            <span>每行列数：</span>
            <select id="mt-gallery-cols">
                ${[2, 3, 4, 5].map(n => `<option value="${n}" ${n === cols ? 'selected' : ''}>${n}列</option>`).join('')}
            </select>
        </div>
        <div class="mt-gallery mt-gallery-${cols}">
            ${records.map(rec => {
                let coverHtml = '<div class="mt-gallery-cover">📄</div>';
                if (coverField && Array.isArray(rec.values[coverField.id]) && rec.values[coverField.id].length) {
                    const file = rec.values[coverField.id][0];
                    if (file.type && file.type.startsWith('image/')) {
                        coverHtml = `<div class="mt-gallery-cover"><img src="${file.dataUrl}" alt=""></div>`;
                    }
                }
                return `<div class="mt-gallery-card" data-rid="${rec.id}" data-action="expand-record">
                    ${coverHtml}
                    <div class="mt-gallery-body">
                        <div class="mt-gallery-title">${MT.Core.esc(primary ? String(rec.values[primary.id] || '') : '')}</div>
                        ${cardFields.map(f => `<div class="mt-gallery-field">
                            <span class="mt-gallery-field-label">${MT.Core.esc(f.name)}</span>
                            <span class="mt-gallery-field-value">${MT.Fields.renderCell(rec.values[f.id], f)}</span>
                        </div>`).join('')}
                    </div>
                </div>`;
            }).join('')}
        </div>`;
    },

    // ===== 甘特图视图 =====
    renderGantt(records, table, view) {
        const startField = view.ganttStartField ? table.fields.find(f => f.id === view.ganttStartField) : null;
        const endField = view.ganttEndField ? table.fields.find(f => f.id === view.ganttEndField) : null;
        const primary = table.fields.find(f => f.isPrimary);
        const scale = view.ganttScale || 'week';
        const progressField = view.ganttProgressField ? table.fields.find(f => f.id === view.ganttProgressField) : null;

        if (!startField) {
            return `<div class="mt-kanban-empty">需要至少一个日期字段作为开始日期<br><small>请在视图设置中配置甘特图字段</small></div>`;
        }

        // 计算时间范围
        let minDate = Infinity, maxDate = -Infinity;
        const now = new Date();
        records.forEach(rec => {
            const s = rec.values[startField.id] ? new Date(rec.values[startField.id]).getTime() : 0;
            const e = endField && rec.values[endField.id] ? new Date(rec.values[endField.id]).getTime() : s + 7 * 86400000;
            if (s && s < minDate) minDate = s;
            if (e && e > maxDate) maxDate = e;
        });
        if (minDate === Infinity) { minDate = now.getTime() - 14 * 86400000; maxDate = now.getTime() + 30 * 86400000; }
        minDate -= 7 * 86400000;
        maxDate += 14 * 86400000;

        // 生成时间轴
        const dayMs = 86400000;
        const cellWidth = scale === 'day' ? 40 : scale === 'week' ? 20 : 8;
        const days = Math.ceil((maxDate - minDate) / dayMs);
        const totalWidth = days * cellWidth;
        const startDate = new Date(minDate);

        const headerCells = [];
        for (let i = 0; i < days; i++) {
            const d = new Date(minDate + i * dayMs);
            const isWeekend = d.getDay() === 0 || d.getDay() === 6;
            const isToday = d.toDateString() === now.toDateString();
            let label = '';
            if (scale === 'day') label = `${d.getMonth() + 1}/${d.getDate()}`;
            else if (scale === 'week' && d.getDay() === 1) label = `${d.getMonth() + 1}/${d.getDate()}`;
            else if (scale === 'month' && d.getDate() === 1) label = `${d.getMonth() + 1}月`;
            headerCells.push(`<div class="mt-gantt-header-cell ${isWeekend ? 'mt-gantt-weekend' : ''} ${isToday ? 'mt-gantt-today' : ''}" style="min-width:${cellWidth}px;width:${cellWidth}px;">${label}</div>`);
        }

        // 计算今日线位置
        const todayOffset = ((now.getTime() - minDate) / dayMs) * cellWidth;

        // 渲染条形
        const bars = records.map(rec => {
            const s = rec.values[startField.id] ? new Date(rec.values[startField.id]).getTime() : 0;
            const e = endField && rec.values[endField.id] ? new Date(rec.values[endField.id]).getTime() : s + 7 * dayMs;
            if (!s) return '';
            const left = ((s - minDate) / dayMs) * cellWidth;
            const width = Math.max(cellWidth, ((e - s) / dayMs) * cellWidth);
            const progress = progressField ? (parseInt(rec.values[progressField.id]) || 0) : 0;
            const label = primary ? String(rec.values[primary.id] || '').substring(0, 10) : '';
            return `<div class="mt-gantt-row">
                <div class="mt-gantt-bar" style="left:${left}px;width:${width}px;" data-rid="${rec.id}" title="${MT.Core.esc(label)}">
                    ${progress > 0 ? `<div class="mt-gantt-bar-progress" style="width:${progress}%"></div>` : ''}
                    <span>${MT.Core.esc(label)}</span>
                    <div class="mt-gantt-bar-handle mt-gantt-bar-handle-left"></div>
                    <div class="mt-gantt-bar-handle mt-gantt-bar-handle-right"></div>
                </div>
            </div>`;
        }).join('');

        return `<div class="mt-gantt-controls">
            <span>缩放：</span>
            <button data-action="gantt-scale" data-val="day" class="${scale === 'day' ? 'active' : ''}">日</button>
            <button data-action="gantt-scale" data-val="week" class="${scale === 'week' ? 'active' : ''}">周</button>
            <button data-action="gantt-scale" data-val="month" class="${scale === 'month' ? 'active' : ''}">月</button>
            <span style="margin-left:16px;">开始字段：</span>
            <select id="mt-gantt-start">${table.fields.filter(f => f.type === 'date').map(f => `<option value="${f.id}" ${f.id === view.ganttStartField ? 'selected' : ''}>${MT.Core.esc(f.name)}</option>`).join('')}</select>
            <span>结束字段：</span>
            <select id="mt-gantt-end"><option value="">无</option>${table.fields.filter(f => f.type === 'date').map(f => `<option value="${f.id}" ${f.id === view.ganttEndField ? 'selected' : ''}>${MT.Core.esc(f.name)}</option>`).join('')}</select>
        </div>
        <div class="mt-gantt">
            <div class="mt-gantt-sidebar">
                <div class="mt-gantt-sidebar-head">任务名称</div>
                ${records.map(rec => `<div class="mt-gantt-sidebar-row" data-rid="${rec.id}" data-action="expand-record">${MT.Core.esc(primary ? String(rec.values[primary.id] || '') : rec.id)}</div>`).join('')}
            </div>
            <div class="mt-gantt-timeline">
                <div class="mt-gantt-header" style="width:${totalWidth}px;">${headerCells.join('')}</div>
                <div class="mt-gantt-body" style="width:${totalWidth}px;">
                    ${bars}
                    <div class="mt-gantt-today-line" style="left:${todayOffset}px;"></div>
                </div>
            </div>
        </div>`;
    },

    // ===== 日历视图 =====
    renderCalendar(records, table, view) {
        const dateField = view.calendarDateField ? table.fields.find(f => f.id === view.calendarDateField) : null;
        const titleField = view.calendarTitleField ? table.fields.find(f => f.id === view.calendarTitleField) : table.fields.find(f => f.isPrimary);
        if (!dateField) {
            return `<div class="mt-kanban-empty">需要至少一个日期字段<br><small>请在视图设置中配置日历字段</small></div>`;
        }

        const calView = view.calendarView || 'month';
        const now = new Date();
        const year = this._calYear || now.getFullYear();
        const month = this._calMonth !== undefined ? this._calMonth : now.getMonth();

        if (calView === 'month') return this._renderMonthView(records, dateField, titleField, year, month, now);
        return this._renderMonthView(records, dateField, titleField, year, month, now);
    },
    _calYear: null,
    _calMonth: null,

    _renderMonthView(records, dateField, titleField, year, month, now) {
        const firstDay = new Date(year, month, 1);
        const lastDay = new Date(year, month + 1, 0);
        const startOffset = firstDay.getDay(); // 0=周日
        const daysInMonth = lastDay.getDate();
        const todayStr = now.toISOString().split('T')[0];
        const monthNames = ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月'];

        // 按日期索引记录
        const recsByDate = {};
        records.forEach(rec => {
            const d = rec.values[dateField.id];
            if (!d) return;
            const key = d.substring(0, 10);
            if (!recsByDate[key]) recsByDate[key] = [];
            recsByDate[key].push(rec);
        });

        // 生成日历网格
        const cells = [];
        const totalCells = Math.ceil((startOffset + daysInMonth) / 7) * 7;
        for (let i = 0; i < totalCells; i++) {
            const dayNum = i - startOffset + 1;
            const isOther = dayNum < 1 || dayNum > daysInMonth;
            const actualDate = new Date(year, month, dayNum);
            const dateStr = actualDate.toISOString().split('T')[0];
            const isToday = dateStr === todayStr;
            const dayRecs = recsByDate[dateStr] || [];
            const maxShow = 3;

            cells.push(`<div class="mt-calendar-day ${isOther ? 'mt-cal-other' : ''} ${isToday ? 'mt-cal-today' : ''}" data-date="${dateStr}" data-action="calendar-day-click">
                <div class="mt-calendar-day-num">${actualDate.getDate()}</div>
                ${dayRecs.slice(0, maxShow).map(rec => {
                    const title = titleField ? String(rec.values[titleField.id] || '') : '';
                    return `<div class="mt-calendar-event" data-rid="${rec.id}" data-action="expand-record">${MT.Core.esc(title.substring(0, 12))}</div>`;
                }).join('')}
                ${dayRecs.length > maxShow ? `<div class="mt-calendar-more">+${dayRecs.length - maxShow}更多</div>` : ''}
            </div>`);
        }

        return `<div class="mt-calendar">
            <div class="mt-calendar-header">
                <div class="mt-calendar-nav">
                    <button data-action="cal-prev">◀</button>
                    <span class="mt-calendar-title">${year}年 ${monthNames[month]}</span>
                    <button data-action="cal-next">▶</button>
                    <button data-action="cal-today" style="margin-left:12px;">今天</button>
                </div>
                <div>
                    <select id="mt-cal-date-field">${MT.Core.tbl().fields.filter(f => f.type === 'date').map(f =>
                        `<option value="${f.id}" ${f.id === dateField.id ? 'selected' : ''}>${MT.Core.esc(f.name)}</option>`).join('')}
                    </select>
                </div>
            </div>
            <div class="mt-calendar-weekdays">
                <div class="mt-calendar-weekday">日</div><div class="mt-calendar-weekday">一</div>
                <div class="mt-calendar-weekday">二</div><div class="mt-calendar-weekday">三</div>
                <div class="mt-calendar-weekday">四</div><div class="mt-calendar-weekday">五</div>
                <div class="mt-calendar-weekday">六</div>
            </div>
            <div class="mt-calendar-grid">${cells.join('')}</div>
        </div>`;
    },

    calNavigate(direction) {
        const now = new Date();
        if (this._calYear === null) { this._calYear = now.getFullYear(); this._calMonth = now.getMonth(); }
        if (direction === 'prev') { this._calMonth--; if (this._calMonth < 0) { this._calMonth = 11; this._calYear--; } }
        else if (direction === 'next') { this._calMonth++; if (this._calMonth > 11) { this._calMonth = 0; this._calYear++; } }
        else { this._calYear = now.getFullYear(); this._calMonth = now.getMonth(); }
        MT.Core.emit('view:refresh', {});
    },

    // ===== 表单视图 =====
    renderForm(table, view) {
        const formTitle = view.formTitle || '提交记录';
        const formDesc = view.formDescription || '';
        const submitText = view.formSubmitText || '提交';
        const formFields = view.formFields || table.fields.filter(f => !f.isPrimary && !MT.Fields.isReadOnly(f.type)).map(f => ({ fieldId: f.id, required: false, helpText: '' }));

        return `<div class="mt-form-wrapper">
            <div class="mt-form-card" id="mt-form-card">
                <div class="mt-form-title">${MT.Core.esc(formTitle)}</div>
                ${formDesc ? `<div class="mt-form-desc">${MT.Core.esc(formDesc)}</div>` : ''}
                <form id="mt-form-submit">
                    ${formFields.map(ff => {
                        const fld = table.fields.find(f => f.id === ff.fieldId);
                        if (!fld) return '';
                        return `<div class="mt-form-field">
                            <label class="mt-form-label">${MT.Core.esc(fld.name)}${ff.required ? '<span class="mt-form-required">*</span>' : ''}</label>
                            ${this._renderFormInput(fld, ff)}
                            ${ff.helpText ? `<div class="mt-form-help">${MT.Core.esc(ff.helpText)}</div>` : ''}
                        </div>`;
                    }).join('')}
                    <button type="submit" class="mt-form-submit">${MT.Core.esc(submitText)}</button>
                </form>
            </div>
        </div>`;
    },
    _renderFormInput(field, config) {
        const req = config.required ? 'required' : '';
        switch (field.type) {
            case 'text': case 'url': case 'email': case 'phone': case 'barcode':
                return `<input type="${field.type === 'email' ? 'email' : field.type === 'url' ? 'url' : 'text'}" class="mt-form-input" name="${field.id}" ${req} placeholder="${MT.Core.esc(field.name)}">`;
            case 'longtext':
                return `<textarea class="mt-form-input mt-form-textarea" name="${field.id}" ${req} placeholder="${MT.Core.esc(field.name)}"></textarea>`;
            case 'number': case 'currency':
                return `<input type="number" class="mt-form-input" name="${field.id}" ${req} step="${field.type === 'currency' ? '0.01' : '1'}">`;
            case 'date':
                return `<input type="date" class="mt-form-input" name="${field.id}" ${req}>`;
            case 'select': {
                const opts = (field.config && field.config.options) || [];
                return `<select class="mt-form-input" name="${field.id}" ${req}>
                    <option value="">请选择</option>
                    ${opts.map(o => `<option value="${MT.Core.esc(o.label)}">${MT.Core.esc(o.label)}</option>`).join('')}
                </select>`;
            }
            case 'multiselect': {
                const opts = (field.config && field.config.options) || [];
                return `<div name="${field.id}" class="mt-rp-msel" data-fid="${field.id}">${opts.map(o =>
                    `<label class="mt-rp-msel-opt"><input type="checkbox" name="${field.id}_ms" value="${MT.Core.esc(o.label)}">${MT.Core.esc(o.label)}</label>`).join('')}</div>`;
            }
            case 'checkbox':
                return `<label style="display:flex;align-items:center;gap:8px;"><input type="checkbox" name="${field.id}"> 是</label>`;
            case 'rating': {
                const max = (field.config && field.config.max) || 5;
                return `<input type="range" class="mt-form-input" name="${field.id}" min="0" max="${max}" value="0" style="max-width:200px;">`;
            }
            case 'progress':
                return `<input type="range" class="mt-form-input" name="${field.id}" min="0" max="100" value="0" style="max-width:200px;">`;
            default:
                return `<input type="text" class="mt-form-input" name="${field.id}" ${req}>`;
        }
    },
    handleFormSubmit(form, table, view) {
        const formFields = view.formFields || [];
        const values = {};
        const fields = table.fields;
        fields.forEach(f => {
            if (MT.Fields.isReadOnly(f.type)) return;
            const input = form.querySelector(`[name="${f.id}"]`);
            if (!input) return;
            if (f.type === 'checkbox') values[f.id] = input.checked;
            else if (f.type === 'number' || f.type === 'currency') values[f.id] = parseFloat(input.value) || 0;
            else if (f.type === 'rating' || f.type === 'progress') values[f.id] = parseInt(input.value) || 0;
            else if (f.type === 'multiselect') {
                const cbs = form.querySelectorAll(`[name="${f.id}_ms"]:checked`);
                values[f.id] = Array.from(cbs).map(cb => cb.value);
            } else {
                values[f.id] = input.value;
            }
        });
        MT.Core.addRecord(values);
        // 显示成功
        const card = document.getElementById('mt-form-card');
        if (card) {
            card.innerHTML = `<div class="mt-form-success">
                <div class="mt-form-success-icon">✅</div>
                <div class="mt-form-success-msg">${MT.Core.esc(view.formSuccessMessage || '提交成功！')}</div>
                <button class="mt-form-again" data-action="form-again">再提交一条</button>
            </div>`;
        }
    }
};
