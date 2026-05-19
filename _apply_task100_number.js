// Transforms number.vue: replaces hardcoded Chinese with $t() / t() calls.
const fs = require('fs');
const file = 'd:\\zhehang-erp\\zhehang-erp-ui\\src\\views\\call-center\\number.vue';
let s = fs.readFileSync(file, 'utf8');
const hadCRLF = /\r\n/.test(s);
if (hadCRLF) s = s.replace(/\r\n/g, '\n');

function rep(o, n) {
  if (s.indexOf(o) === -1) {
    console.warn('NOT FOUND:', JSON.stringify(o.slice(0, 80)));
    return;
  }
  s = s.replace(o, n);
}

// ============ <script setup> imports ============
rep(
  "import {\n  Search, Plus, Upload, UploadFilled, Refresh, Location\n} from '@element-plus/icons-vue'",
  "import { useI18n } from 'vue-i18n'\nimport {\n  Search, Plus, Upload, UploadFilled, Refresh, Location\n} from '@element-plus/icons-vue'"
);
rep(
  "} from '@/api/call-center'\n\n// ============= 状态 =============",
  "} from '@/api/call-center'\n\nconst { t } = useI18n()\n\n// ============= 状态 ============="
);

// ============ Header ============
rep(
  '<span>02 · 号码与线路 / Number &amp; Line</span>',
  '<span>{{ t(\'cc.number.headerEyebrow\') }}</span>'
);
rep(
  '<span class="title-serif">号码池</span>',
  '<span class="title-serif">{{ t(\'cc.number.titleLeft\') }}</span>'
);
rep(
  '<span class="title-serif italic">SIP 中继</span>',
  '<span class="title-serif italic">{{ t(\'cc.number.titleRight\') }}</span>'
);
rep(
  '<p class="header-sub">\n          统一管理外呼/呼入号码资源、绑定坐席与路由策略，监控 SIP 中继的并发占用与连通状态。\n        </p>',
  '<p class="header-sub">\n          {{ t(\'cc.number.headerDesc\') }}\n        </p>'
);

// stat tiles
rep(
  '<div class="stat-label">在册号码</div>',
  '<div class="stat-label">{{ t(\'cc.number.stats.totalNumbers\') }}</div>'
);
rep(
  '<span class="dot dot-idle"></span>空闲 {{ stats.idleNumbers }}',
  '<span class="dot dot-idle"></span>{{ t(\'cc.number.status.idle\') }} {{ stats.idleNumbers }}'
);
rep(
  '<div class="stat-label">中继并发</div>',
  '<div class="stat-label">{{ t(\'cc.number.stats.trunkConcurrent\') }}</div>'
);
rep(
  '<span class="dot dot-busy"></span>占用率 {{ stats.concurrentRate }}%',
  '<span class="dot dot-busy"></span>{{ t(\'cc.number.stats.usageRate\') }} {{ stats.concurrentRate }}%'
);
rep(
  '<div class="stat-label">在线中继</div>',
  '<div class="stat-label">{{ t(\'cc.number.stats.onlineTrunks\') }}</div>'
);
rep(
  '<span class="dot dot-online"></span>SIP 链路活跃',
  '<span class="dot dot-online"></span>{{ t(\'cc.number.stats.sipActive\') }}'
);

// ============ Tab labels ============
rep(
  '<span class="tab-name">号码池管理</span>',
  '<span class="tab-name">{{ t(\'cc.number.tab.numberPoolMgmt\') }}</span>'
);
rep(
  '<span class="tab-name">SIP 中继管理</span>',
  '<span class="tab-name">{{ t(\'cc.number.tab.trunkMgmt\') }}</span>'
);

// ============ Number toolbar ============
rep(
  'placeholder="搜索号码 / 归属地 / 备注"',
  ':placeholder="t(\'cc.number.searchPlaceholder\')"'
);
rep(
  '<el-select v-model="numQuery.kind" placeholder="号码类型" clearable class="tool-select" @change="loadNumbers">',
  '<el-select v-model="numQuery.kind" :placeholder="t(\'cc.number.form.type\')" clearable class="tool-select" @change="loadNumbers">'
);
rep(
  '<el-option label="400 号码" value="400" />',
  '<el-option :label="t(\'cc.number.type.400\')" value="400" />'
);
rep(
  '<el-option label="固话" value="landline" />',
  '<el-option :label="t(\'cc.number.type.landline\')" value="landline" />'
);
rep(
  '<el-option label="手机" value="mobile" />',
  '<el-option :label="t(\'cc.number.type.mobile\')" value="mobile" />'
);
rep(
  '<el-select v-model="numQuery.status" placeholder="状态" clearable class="tool-select" @change="loadNumbers">',
  '<el-select v-model="numQuery.status" :placeholder="t(\'cc.number.column.status\')" clearable class="tool-select" @change="loadNumbers">'
);
rep(
  '<el-option label="空闲" value="idle" />',
  '<el-option :label="t(\'cc.number.status.idle\')" value="idle" />'
);
rep(
  '<el-option label="占用" value="busy" />',
  '<el-option :label="t(\'cc.number.status.busy\')" value="busy" />'
);
rep(
  '<el-option label="停用" value="disabled" />',
  '<el-option :label="t(\'cc.number.status.disabled\')" value="disabled" />'
);
rep(
  '<el-icon><Upload /></el-icon>批量导入',
  '<el-icon><Upload /></el-icon>{{ t(\'cc.number.action.batchImport\') }}'
);
rep(
  '<el-icon><Plus /></el-icon>新增号码',
  '<el-icon><Plus /></el-icon>{{ t(\'cc.number.action.addNumber\') }}'
);

// ============ Numbers table ============
rep(
  'empty-text="暂无号码记录"',
  ':empty-text="t(\'cc.number.emptyNumbers\')"'
);
rep(
  '<el-table-column label="号码" min-width="180">',
  '<el-table-column :label="t(\'cc.number.column.number\')" min-width="180">'
);
rep(
  '<el-table-column label="归属地" width="160">',
  '<el-table-column :label="t(\'cc.number.column.region\')" width="160">'
);
rep(
  '<el-table-column label="方向" width="120">',
  '<el-table-column :label="t(\'cc.number.column.direction\')" width="120">'
);
rep(
  '<el-table-column label="状态" width="130">',
  '<el-table-column :label="t(\'cc.number.column.status\')" width="130">'
);
rep(
  '<el-table-column label="绑定坐席" width="160">',
  '<el-table-column :label="t(\'cc.number.column.boundAgent\')" width="160">'
);
rep(
  '<el-table-column label="月租费" width="120" align="right">',
  '<el-table-column :label="t(\'cc.number.column.monthlyFee\')" width="120" align="right">'
);
rep(
  '<el-table-column label="操作" width="220" fixed="right">',
  '<el-table-column :label="t(\'common.operation\')" width="220" fixed="right">'
);
rep(
  '<span v-else class="text-muted">— 未绑定 —</span>',
  '<span v-else class="text-muted">— {{ t(\'cc.number.unbound\') }} —</span>'
);

// number row actions
rep(
  '<button class="link-act" @click="openNumberDialog(row)">编辑</button>',
  '<button class="link-act" @click="openNumberDialog(row)">{{ t(\'common.edit\') }}</button>'
);
rep(
  '{{ row.enabled ? \'停用\' : \'启用\' }}',
  '{{ row.enabled ? t(\'common.disable\') : t(\'common.enable\') }}'
);
rep(
  '<button class="link-act danger" @click="deleteNumber(row)">删除</button>',
  '<button class="link-act danger" @click="deleteNumber(row)">{{ t(\'common.delete\') }}</button>'
);

// ============ Trunk tab ============
rep(
  '<span class="sum-key">活跃链路</span>',
  '<span class="sum-key">{{ t(\'cc.number.trunk.activeLinks\') }}</span>'
);
rep(
  '<span class="sum-key">总并发</span>',
  '<span class="sum-key">{{ t(\'cc.number.trunk.totalConcurrent\') }}</span>'
);
rep(
  '<el-icon><Refresh /></el-icon>刷新',
  '<el-icon><Refresh /></el-icon>{{ t(\'common.refresh\') }}'
);
rep(
  '<el-icon><Plus /></el-icon>新增中继',
  '<el-icon><Plus /></el-icon>{{ t(\'cc.number.trunk.action.add\') }}'
);

// ============ Trunk table ============
rep(
  'empty-text="暂无中继配置"',
  ':empty-text="t(\'cc.number.emptyTrunks\')"'
);
rep(
  '<el-table-column label="中继名称" min-width="200">',
  '<el-table-column :label="t(\'cc.number.trunk.column.name\')" min-width="200">'
);
rep(
  '<el-table-column label="IP 地址" width="180">',
  '<el-table-column :label="t(\'cc.number.trunk.column.ipAddr\')" width="180">'
);
rep(
  '<el-table-column label="端口" width="100" align="center">',
  '<el-table-column :label="t(\'cc.number.trunk.column.port\')" width="100" align="center">'
);
rep(
  '<el-table-column label="协议" width="110" align="center">',
  '<el-table-column :label="t(\'cc.number.trunk.column.protocol\')" width="110" align="center">'
);
rep(
  '<el-table-column label="并发占用" width="200">',
  '<el-table-column :label="t(\'cc.number.trunk.column.concurrent\')" width="200">'
);
rep(
  '<el-table-column label="状态" width="130">',
  '<el-table-column :label="t(\'cc.number.trunk.column.status\')" width="130">'
);
rep(
  '<el-table-column label="操作" width="260" fixed="right">',
  '<el-table-column :label="t(\'common.operation\')" width="260" fixed="right">'
);
rep(
  '<button class="link-act" @click="openTrunkDialog(row)">编辑</button>',
  '<button class="link-act" @click="openTrunkDialog(row)">{{ t(\'common.edit\') }}</button>'
);
rep(
  '<button class="link-act" @click="testTrunk(row)">连通性</button>',
  '<button class="link-act" @click="testTrunk(row)">{{ t(\'cc.number.trunk.action.test\') }}</button>'
);
rep(
  "{{ row.status === 'offline' ? '启用' : '禁用' }}",
  "{{ row.status === 'offline' ? t('common.enable') : t('common.disable') }}"
);

// ============ Number Dialog ============
rep(
  ':title="numberDialog.id ? \'编辑号码\' : \'新增号码\'"',
  ':title="numberDialog.id ? t(\'cc.number.form.editTitle\') : t(\'cc.number.form.addTitle\')"'
);
rep(
  '<el-form-item label="号码">\n          <el-input v-model="numberDialog.form.number" placeholder="如 4001008888 / 057188889999" />',
  '<el-form-item :label="t(\'cc.number.form.number\')">\n          <el-input v-model="numberDialog.form.number" :placeholder="t(\'cc.number.form.numberPlaceholder\')" />'
);
rep(
  '<el-form-item label="归属省">\n          <el-input v-model="numberDialog.form.province" placeholder="例：浙江" />',
  '<el-form-item :label="t(\'cc.number.form.province\')">\n          <el-input v-model="numberDialog.form.province" :placeholder="t(\'cc.number.form.provincePlaceholder\')" />'
);
rep(
  '<el-form-item label="归属市">\n          <el-input v-model="numberDialog.form.city" placeholder="例：杭州" />',
  '<el-form-item :label="t(\'cc.number.form.city\')">\n          <el-input v-model="numberDialog.form.city" :placeholder="t(\'cc.number.form.cityPlaceholder\')" />'
);
rep(
  '<el-form-item label="呼叫方向">',
  '<el-form-item :label="t(\'cc.number.form.direction\')">'
);
rep(
  '<el-option label="呼入 Inbound" value="inbound" />',
  '<el-option :label="t(\'cc.number.direction.inbound\')" value="inbound" />'
);
rep(
  '<el-option label="外呼 Outbound" value="outbound" />',
  '<el-option :label="t(\'cc.number.direction.outbound\')" value="outbound" />'
);
rep(
  '<el-option label="双向 Both" value="both" />',
  '<el-option :label="t(\'cc.number.direction.both\')" value="both" />'
);
rep(
  '<el-form-item label="月租费 (¥)">',
  '<el-form-item :label="t(\'cc.number.form.monthlyFee\')">'
);
rep(
  '<el-form-item label="主叫显示">\n          <el-input v-model="numberDialog.form.callerIdName" placeholder="对外显示名称" />',
  '<el-form-item :label="t(\'cc.number.form.callerIdName\')">\n          <el-input v-model="numberDialog.form.callerIdName" :placeholder="t(\'cc.number.form.callerIdNamePlaceholder\')" />'
);
rep(
  '<el-form-item label="备注">\n          <el-input v-model="numberDialog.form.remark" type="textarea" :rows="2" />\n        </el-form-item>\n      </el-form>\n      <template #footer>\n        <el-button @click="numberDialog.visible = false">取消</el-button>\n        <el-button class="btn-gold" @click="submitNumber">确认提交</el-button>',
  '<el-form-item :label="t(\'common.remark\')">\n          <el-input v-model="numberDialog.form.remark" type="textarea" :rows="2" />\n        </el-form-item>\n      </el-form>\n      <template #footer>\n        <el-button @click="numberDialog.visible = false">{{ t(\'common.cancel\') }}</el-button>\n        <el-button class="btn-gold" @click="submitNumber">{{ t(\'cc.number.form.submit\') }}</el-button>'
);

// ============ Trunk Dialog ============
rep(
  ':title="trunkDialog.id ? \'编辑 SIP 中继\' : \'新增 SIP 中继\'"',
  ':title="trunkDialog.id ? t(\'cc.number.trunk.form.editTitle\') : t(\'cc.number.trunk.form.addTitle\')"'
);
rep(
  '<el-form-item label="中继名称">\n          <el-input v-model="trunkDialog.form.name" placeholder="例：联通-杭州主干" />',
  '<el-form-item :label="t(\'cc.number.trunk.form.name\')">\n          <el-input v-model="trunkDialog.form.name" :placeholder="t(\'cc.number.trunk.form.namePlaceholder\')" />'
);
rep(
  '<el-form-item label="IP 地址">\n          <el-input v-model="trunkDialog.form.host" placeholder="例：120.78.x.x" />',
  '<el-form-item :label="t(\'cc.number.trunk.form.ipAddr\')">\n          <el-input v-model="trunkDialog.form.host" :placeholder="t(\'cc.number.trunk.form.hostPlaceholder\')" />'
);
rep(
  '<el-form-item label="端口">',
  '<el-form-item :label="t(\'cc.number.trunk.form.port\')">'
);
rep(
  '<el-form-item label="协议">',
  '<el-form-item :label="t(\'cc.number.trunk.form.protocol\')">'
);
rep(
  '<el-form-item label="最大并发数">',
  '<el-form-item :label="t(\'cc.number.trunk.form.maxChannels\')">'
);
rep(
  '<el-form-item label="认证用户名">',
  '<el-form-item :label="t(\'cc.number.trunk.form.username\')">'
);
rep(
  '<el-form-item label="认证密码">',
  '<el-form-item :label="t(\'cc.number.trunk.form.password\')">'
);
rep(
  '<el-form-item label="备注">\n          <el-input v-model="trunkDialog.form.remark" type="textarea" :rows="2" />\n        </el-form-item>\n      </el-form>\n      <template #footer>\n        <el-button @click="trunkDialog.visible = false">取消</el-button>\n        <el-button class="btn-ghost" @click="testTrunkForm">测试连通性</el-button>\n        <el-button class="btn-gold" @click="submitTrunk">确认提交</el-button>',
  '<el-form-item :label="t(\'common.remark\')">\n          <el-input v-model="trunkDialog.form.remark" type="textarea" :rows="2" />\n        </el-form-item>\n      </el-form>\n      <template #footer>\n        <el-button @click="trunkDialog.visible = false">{{ t(\'common.cancel\') }}</el-button>\n        <el-button class="btn-ghost" @click="testTrunkForm">{{ t(\'cc.number.trunk.action.test\') }}</el-button>\n        <el-button class="btn-gold" @click="submitTrunk">{{ t(\'cc.number.form.submit\') }}</el-button>'
);

// ============ Import Dialog ============
rep(
  'title="批量导入号码"',
  ':title="t(\'cc.number.form.importTitle\')"'
);
rep(
  '<span class="hint-bullet">①</span> 模板字段顺序：',
  '<span class="hint-bullet">①</span> {{ t(\'cc.number.import.fieldOrder\') }}'
);
rep(
  '<div class="upload-title">将 CSV / Excel 拖拽至此</div>',
  '<div class="upload-title">{{ t(\'cc.number.import.dragHint\') }}</div>'
);
rep(
  '<div class="upload-sub">或 <em>点击选择文件</em>，仅支持 .csv / .xls / .xlsx</div>',
  '<div class="upload-sub">{{ t(\'cc.number.import.or\') }}<em>{{ t(\'cc.number.import.clickSelect\') }}</em>{{ t(\'cc.number.import.fileTypes\') }}</div>'
);
rep(
  '<span class="preview-title">解析预览</span>',
  '<span class="preview-title">{{ t(\'cc.number.import.previewTitle\') }}</span>'
);

// preview-stat — replace whole inner content
rep(
  '<span class="preview-stat">\n            共 <b>{{ importDialog.preview.length }}</b> 条 ·\n            有效 <b class="ok">{{ importDialog.validCount }}</b> ·\n            异常 <b class="err">{{ importDialog.preview.length - importDialog.validCount }}</b>\n          </span>',
  '<span class="preview-stat">\n            {{ t(\'cc.number.import.previewStats\', { total: importDialog.preview.length, valid: importDialog.validCount, error: importDialog.preview.length - importDialog.validCount }) }}\n          </span>'
);

// preview table headers
rep(
  '<thead>\n              <tr>\n                <th>#</th>\n                <th>号码</th>\n                <th>省</th>\n                <th>市</th>\n                <th>方向</th>\n                <th>月租</th>\n                <th>状态</th>\n              </tr>\n            </thead>',
  '<thead>\n              <tr>\n                <th>#</th>\n                <th>{{ t(\'cc.number.column.number\') }}</th>\n                <th>{{ t(\'cc.number.import.province\') }}</th>\n                <th>{{ t(\'cc.number.import.city\') }}</th>\n                <th>{{ t(\'cc.number.column.direction\') }}</th>\n                <th>{{ t(\'cc.number.import.monthlyFee\') }}</th>\n                <th>{{ t(\'cc.number.column.status\') }}</th>\n              </tr>\n            </thead>'
);

// preview row status text
rep(
  "<span :class=\"p.valid ? 'pv-ok' : 'pv-err'\">{{ p.valid ? '可导入' : (p.error || '格式错误') }}</span>",
  "<span :class=\"p.valid ? 'pv-ok' : 'pv-err'\">{{ p.valid ? t('cc.number.import.importable') : (p.error || t('cc.number.validation.numberFormat')) }}</span>"
);

// import dialog footer
rep(
  '<el-button @click="importDialog.visible = false">取消</el-button>\n        <el-button class="btn-ghost" :disabled="!importDialog.preview.length" @click="resetImport">清空</el-button>\n        <el-button class="btn-gold" :disabled="!importDialog.validCount" @click="confirmImport">\n          导入 {{ importDialog.validCount }} 条\n        </el-button>',
  '<el-button @click="importDialog.visible = false">{{ t(\'common.cancel\') }}</el-button>\n        <el-button class="btn-ghost" :disabled="!importDialog.preview.length" @click="resetImport">{{ t(\'cc.number.import.clear\') }}</el-button>\n        <el-button class="btn-gold" :disabled="!importDialog.validCount" @click="confirmImport">\n          {{ t(\'cc.number.import.importBtn\', { count: importDialog.validCount }) }}\n        </el-button>'
);

// ============ Script: label functions ============
rep(
  "function kindLabel(k: string) { return k === '400' ? '400' : k === 'mobile' ? '手机' : '固话' }",
  "function kindLabel(k: string) { return k === '400' ? t('cc.number.type.400') : k === 'mobile' ? t('cc.number.type.mobile') : t('cc.number.type.landline') }"
);
rep(
  "function dirLabel(d: string) { return d === 'inbound' ? '呼入' : d === 'outbound' ? '外呼' : '双向' }",
  "function dirLabel(d: string) { return d === 'inbound' ? t('cc.number.direction.inbound') : d === 'outbound' ? t('cc.number.direction.outbound') : t('cc.number.direction.both') }"
);
rep(
  "function statusLabel(s: string) { return s === 'idle' ? '空闲' : s === 'busy' ? '占用' : '停用' }",
  "function statusLabel(s: string) { return s === 'idle' ? t('cc.number.status.idle') : s === 'busy' ? t('cc.number.status.busy') : t('cc.number.status.disabled') }"
);
rep(
  "function trunkStatusLabel(s: string) { return s === 'online' ? '在线' : s === 'offline' ? '离线' : '异常' }",
  "function trunkStatusLabel(s: string) { return s === 'online' ? t('cc.number.trunk.status.online') : s === 'offline' ? t('cc.number.trunk.status.offline') : t('cc.number.trunk.status.abnormal') }"
);

// ============ Script: number CRUD messages ============
rep(
  "ElMessage.warning('请填写号码')",
  "ElMessage.warning(t('cc.number.validation.numberRequired'))"
);
rep(
  "ElMessage.success('已更新号码')",
  "ElMessage.success(t('cc.number.message.updateSuccess'))"
);
rep(
  "ElMessage.success('已新增号码')",
  "ElMessage.success(t('cc.number.message.addSuccess'))"
);
rep(
  "ElMessage.success(row.enabled ? '号码已启用' : '号码已停用')",
  "ElMessage.success(row.enabled ? t('cc.number.message.enableSuccess') : t('cc.number.message.disableSuccess'))"
);

// delete confirm
rep(
  "await ElMessageBox.confirm(`确定删除号码 ${row.number} ？`, '确认操作', {\n      type: 'warning',\n      confirmButtonText: '删除',\n      cancelButtonText: '取消'\n    })",
  "await ElMessageBox.confirm(t('cc.number.message.deleteConfirm', { number: row.number }), t('cc.number.message.deleteTitle'), {\n      type: 'warning',\n      confirmButtonText: t('common.delete'),\n      cancelButtonText: t('common.cancel')\n    })"
);
rep(
  "ElMessage.success('已删除')",
  "ElMessage.success(t('cc.number.message.deleteSuccess'))"
);

// ============ Script: trunk CRUD messages ============
rep(
  "ElMessage.warning('请填写中继名称与 IP')",
  "ElMessage.warning(t('cc.number.trunk.validation.required'))"
);
rep(
  "ElMessage.success('已更新中继配置')",
  "ElMessage.success(t('cc.number.message.trunkUpdateSuccess'))"
);
rep(
  "ElMessage.success('已新增中继')",
  "ElMessage.success(t('cc.number.message.trunkAddSuccess'))"
);

// testTrunk - timing-related strings
rep(
  "ElMessage.info(`正在测试 ${row.name} (${row.host}:${row.port}) ...`)",
  "ElMessage.info(t('cc.number.trunk.message.testing', { name: row.name, host: row.host, port: row.port }))"
);
rep(
  "if (ok) ElMessage.success(`${row.name} 连通正常 · 延迟 ${20 + Math.floor(Math.random() * 60)}ms`)",
  "if (ok) ElMessage.success(t('cc.number.trunk.message.testOk', { name: row.name, ms: 20 + Math.floor(Math.random() * 60) }))"
);
rep(
  "else ElMessage.warning(`${row.name} 连通失败 · 请检查 SIP 注册状态`)",
  "else ElMessage.warning(t('cc.number.trunk.message.testFail', { name: row.name }))"
);

// testTrunkForm
rep(
  "ElMessage.warning('请先填写 IP 地址')",
  "ElMessage.warning(t('cc.number.trunk.validation.hostRequired'))"
);
rep(
  "ElMessage.info(`正在测试 ${trunkDialog.form.host}:${trunkDialog.form.port} ...`)",
  "ElMessage.info(t('cc.number.trunk.message.testingHost', { host: trunkDialog.form.host, port: trunkDialog.form.port }))"
);
rep(
  "setTimeout(() => ElMessage.success('SIP OPTIONS 探测成功 · 链路可达'), 700)",
  "setTimeout(() => ElMessage.success(t('cc.number.trunk.message.testFormOk')), 700)"
);

// toggleTrunk
rep(
  "ElMessage.success(row.status === 'online' ? '中继已启用' : '中继已禁用')",
  "ElMessage.success(row.status === 'online' ? t('cc.number.trunk.message.enableSuccess') : t('cc.number.trunk.message.disableSuccess'))"
);

// ============ Import script ============
rep(
  "ElMessage.warning('文件内容为空或缺少表头')",
  "ElMessage.warning(t('cc.number.import.messages.empty'))"
);
rep(
  "if (!/^[0-9\\-]{5,}$/.test(item.number)) item.error = '号码格式错误'",
  "if (!/^[0-9\\-]{5,}$/.test(item.number)) item.error = t('cc.number.validation.numberFormat')"
);
rep(
  "else if (!['inbound', 'outbound', 'both'].includes(item.type)) item.error = '方向取值错误'",
  "else if (!['inbound', 'outbound', 'both'].includes(item.type)) item.error = t('cc.number.validation.directionFormat')"
);
rep(
  "ElMessage.info('已加载 Excel 示例预览（演示模式）')",
  "ElMessage.info(t('cc.number.import.messages.demoLoaded'))"
);
rep(
  "ElMessage.success(`成功导入 ${valid.length} 条号码`)",
  "ElMessage.success(t('cc.number.message.importSuccess', { count: valid.length }))"
);

if (hadCRLF) s = s.replace(/\n/g, '\r\n');
fs.writeFileSync(file, s, 'utf8');
console.log('number.vue done');
