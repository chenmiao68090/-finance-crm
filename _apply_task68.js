// Modify d:/zhehang-erp/zhehang-erp-ui/src/views/crm/lead.vue
// Add "公司注册日期" (registerDate) field after phone everywhere
const fs = require('fs');
const path = 'd:/zhehang-erp/zhehang-erp-ui/src/views/crm/lead.vue';
let c = fs.readFileSync(path, 'utf8');
const original = c;
const nl = c.includes('\r\n') ? '\r\n' : '\n';

function NL(s) { return s.replace(/\n/g, nl); }

function replaceOnce(find, replace, label) {
  find = NL(find);
  replace = NL(replace);
  const idx = c.indexOf(find);
  if (idx === -1) {
    throw new Error('NOT FOUND: ' + label);
  }
  if (c.indexOf(find, idx + 1) !== -1) {
    throw new Error('NOT UNIQUE: ' + label);
  }
  c = c.slice(0, idx) + replace + c.slice(idx + find.length);
  console.log('OK: ' + label);
}

// ===== 1. Table column - after phone column add registerDate column =====
replaceOnce(
  '<el-table-column label="\u624b\u673a\u53f7\u7801" prop="phone" width="140" />\n        <el-table-column label="\u6765\u6e90" width="100">',
  '<el-table-column label="\u624b\u673a\u53f7\u7801" prop="phone" width="140" />\n        <el-table-column prop="registerDate" label="\u516c\u53f8\u6ce8\u518c\u65e5\u671f" width="130" />\n        <el-table-column label="\u6765\u6e90" width="100">',
  'table column registerDate'
);

// ===== 2. Form item - after phone el-col add registerDate el-col =====
const phoneFormBlock = '          <el-col :span="12">\n            <el-form-item label="\u624b\u673a\u53f7\u7801" prop="phone">\n              <el-input v-model="formData.phone" placeholder="\u8bf7\u8f93\u5165\u624b\u673a\u53f7" />\n            </el-form-item>\n          </el-col>\n          <el-col :span="12">\n            <el-form-item label="\u516c\u53f8\u5730\u5740" prop="email">';
const phoneFormBlockNew = '          <el-col :span="12">\n            <el-form-item label="\u624b\u673a\u53f7\u7801" prop="phone">\n              <el-input v-model="formData.phone" placeholder="\u8bf7\u8f93\u5165\u624b\u673a\u53f7" />\n            </el-form-item>\n          </el-col>\n          <el-col :span="12">\n            <el-form-item label="\u516c\u53f8\u6ce8\u518c\u65e5\u671f">\n              <el-date-picker v-model="formData.registerDate" type="date" placeholder="\u9009\u62e9\u65e5\u671f" value-format="YYYY-MM-DD" style="width: 100%" />\n            </el-form-item>\n          </el-col>\n          <el-col :span="12">\n            <el-form-item label="\u516c\u53f8\u5730\u5740" prop="email">';
replaceOnce(phoneFormBlock, phoneFormBlockNew, 'form-item registerDate');

// ===== 3. Lead interface - add registerDate: string after phone =====
replaceOnce(
  'interface Lead {\n  id: number\n  name: string\n  company: string\n  phone: string\n  email: string',
  'interface Lead {\n  id: number\n  name: string\n  company: string\n  phone: string\n  registerDate: string\n  email: string',
  'Lead interface registerDate'
);

// ===== 4. formData reactive initial =====
replaceOnce(
  "const formData = reactive<Partial<Lead>>({\n  id: 0, name: '', company: '', phone: '', email: '', source: 1, status: 1, remark: ''\n})",
  "const formData = reactive<Partial<Lead>>({\n  id: 0, name: '', company: '', phone: '', registerDate: '', email: '', source: 1, status: 1, remark: ''\n})",
  'formData reactive initial'
);

// ===== 5. resetFormData =====
replaceOnce(
  "Object.assign(formData, { id: 0, name: '', company: '', phone: '', email: '', source: 1, status: 1, remark: '' })",
  "Object.assign(formData, { id: 0, name: '', company: '', phone: '', registerDate: '', email: '', source: 1, status: 1, remark: '' })",
  'resetFormData'
);

// ===== 6. seedData - add registerDate to each generated record =====
replaceOnce(
  "      id: 1000 + i,\n      name: companies[i],\n      company: contacts[i],\n      phone: phones[i],\n      email: addresses[i],",
  "      id: 1000 + i,\n      name: companies[i],\n      company: contacts[i],\n      phone: phones[i],\n      registerDate: `${2018 + Math.floor(Math.random() * 7)}-${String(Math.ceil(Math.random() * 12)).padStart(2, '0')}-${String(Math.ceil(Math.random() * 28)).padStart(2, '0')}`,\n      email: addresses[i],",
  'seedData registerDate'
);

// ===== 7. submitForm new lead - add registerDate =====
replaceOnce(
  "        name: formData.name || '',\n        company: formData.company || '',\n        phone: formData.phone || '',\n        email: formData.email || '',",
  "        name: formData.name || '',\n        company: formData.company || '',\n        phone: formData.phone || '',\n        registerDate: formData.registerDate || '',\n        email: formData.email || '',",
  'submitForm newLead registerDate'
);

// ===== 8. CSV template header & sample =====
replaceOnce(
  "  const header = '\u516c\u53f8\u540d\u79f0,\u8054\u7cfb\u4eba,\u624b\u673a\u53f7\u7801,\u6765\u6e90(1\u5929\u773c\u67e5/2\u8f6c\u4ecb\u7ecd/3\u7f8e\u56e2/4\u6296\u97f3/5\u7ebf\u4e0b),\u516c\u53f8\u5730\u5740,\u5907\u6ce8\\n'\n  const sample = '\u676d\u5dde\u793a\u4f8b\u79d1\u6280\u6709\u9650\u516c\u53f8,\u5f20\u4e09,13800000000,1,\u676d\u5dde\u5e02\u897f\u6e56\u533a\u793a\u4f8b\u8def 1 \u53f7,\u793a\u4f8b\u5907\u6ce8\\n'",
  "  const header = '\u516c\u53f8\u540d\u79f0,\u8054\u7cfb\u4eba,\u624b\u673a\u53f7\u7801,\u516c\u53f8\u6ce8\u518c\u65e5\u671f,\u6765\u6e90(1\u5929\u773c\u67e5/2\u8f6c\u4ecb\u7ecd/3\u7f8e\u56e2/4\u6296\u97f3/5\u7ebf\u4e0b),\u516c\u53f8\u5730\u5740,\u5907\u6ce8\\n'\n  const sample = '\u676d\u5dde\u793a\u4f8b\u79d1\u6280\u6709\u9650\u516c\u53f8,\u5f20\u4e09,13800000000,2020-01-15,1,\u676d\u5dde\u5e02\u897f\u6e56\u533a\u793a\u4f8b\u8def 1 \u53f7,\u793a\u4f8b\u5907\u6ce8\\n'",
  'CSV template header'
);

// ===== 9. CSV import parse - shift columns =====
replaceOnce(
  "      rows.push({\n        name: cols[0]?.trim() || '',\n        company: cols[1]?.trim() || '',\n        phone: cols[2]?.trim() || '',\n        source: Number(cols[3]?.trim()) || 1,\n        email: cols[4]?.trim() || '',\n        remark: cols[5]?.trim() || ''\n      })",
  "      rows.push({\n        name: cols[0]?.trim() || '',\n        company: cols[1]?.trim() || '',\n        phone: cols[2]?.trim() || '',\n        registerDate: cols[3]?.trim() || '',\n        source: Number(cols[4]?.trim()) || 1,\n        email: cols[5]?.trim() || '',\n        remark: cols[6]?.trim() || ''\n      })",
  'CSV import parse'
);

// ===== 10. confirmImport - new leads include registerDate =====
replaceOnce(
  "      name: r.name, company: r.company, phone: r.phone, email: r.email,",
  "      name: r.name, company: r.company, phone: r.phone, registerDate: r.registerDate || '', email: r.email,",
  'confirmImport newLead registerDate'
);

// ===== 11. CSV export header and rows =====
replaceOnce(
  "  const header = ['\u516c\u53f8\u540d\u79f0', '\u8054\u7cfb\u4eba', '\u624b\u673a\u53f7\u7801', '\u6765\u6e90', '\u516c\u53f8\u5730\u5740', '\u72b6\u6001', '\u8d1f\u8d23\u4eba', '\u6700\u8fd1\u8ddf\u8fdb', '\u521b\u5efa\u65f6\u95f4']",
  "  const header = ['\u516c\u53f8\u540d\u79f0', '\u8054\u7cfb\u4eba', '\u624b\u673a\u53f7\u7801', '\u516c\u53f8\u6ce8\u518c\u65e5\u671f', '\u6765\u6e90', '\u516c\u53f8\u5730\u5740', '\u72b6\u6001', '\u8d1f\u8d23\u4eba', '\u6700\u8fd1\u8ddf\u8fdb', '\u521b\u5efa\u65f6\u95f4']",
  'CSV export header'
);

replaceOnce(
  "    lines.push([\n      r.name, r.company, r.phone,\n      sourceLabel(r.source), r.email,\n      statusLabel(r.status),\n      r.ownerName || '\u516c\u6d77', r.lastFollowTime || '', r.createTime\n    ].map(v => `\"${String(v).replace(/\"/g, '\"\"')}\"`).join(','))",
  "    lines.push([\n      r.name, r.company, r.phone, r.registerDate || '',\n      sourceLabel(r.source), r.email,\n      statusLabel(r.status),\n      r.ownerName || '\u516c\u6d77', r.lastFollowTime || '', r.createTime\n    ].map(v => `\"${String(v).replace(/\"/g, '\"\"')}\"`).join(','))",
  'CSV export rows'
);

if (c === original) {
  throw new Error('No changes were made');
}

fs.writeFileSync(path, c, 'utf8');
console.log('\nFile written. Length:', c.length);
