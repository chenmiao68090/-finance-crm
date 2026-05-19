const fs = require('fs');

// Fix hrm.ts comments
const hrmTsPath = 'd:\\zhehang-erp\\zhehang-erp-ui\\src\\api\\hrm.ts';
let hrmTs = fs.readFileSync(hrmTsPath, 'utf8');
hrmTs = hrmTs.replace(/\/\/ [^\n]*\u62DB[^\n]*/g, '// \u62DB\u8058\u7BA1\u7406');
// Replace each garbled comment with proper Chinese using known line context
const lines = hrmTs.split('\n');
for (let i = 0; i < lines.length; i++) {
  const l = lines[i];
  if (l.startsWith('//') && /[^\x00-\x7F]/.test(l)) {
    // Comment with non-ASCII - replace based on context of next lines
    const next = lines[i + 1] || '';
    if (next.includes('recruitApi')) lines[i] = '// \u62DB\u8058\u7BA1\u7406'; // 招聘管理
    else if (next.includes('resumeApi')) lines[i] = '// \u7B80\u5386\u7BA1\u7406'; // 简历管理
    else if (next.includes('attendanceApi')) lines[i] = '// \u8003\u52E4\u7BA1\u7406'; // 考勤管理
    else if (next.includes('leaveApi')) lines[i] = '// \u8BF7\u5047\u7BA1\u7406'; // 请假管理
    else if (next.includes('salaryApi')) lines[i] = '// \u85AA\u8D44\u7BA1\u7406'; // 薪资管理
    else if (next.includes('performanceApi')) lines[i] = '// \u7EE9\u6548\u7BA1\u7406'; // 绩效管理
    else if (next.includes('trainingApi')) lines[i] = '// \u57F9\u8BAD\u7BA1\u7406'; // 培训管理
  }
}
fs.writeFileSync(hrmTsPath, lines.join('\n'), 'utf8');
console.log('hrm.ts fixed');

// Fix recruit.vue education options
const recruitPath = 'd:\\zhehang-erp\\zhehang-erp-ui\\src\\views\\hrm\\recruit.vue';
let recruit = fs.readFileSync(recruitPath, 'utf8');
const eduRegex = /<el-option label="[^"]*" value="[^"]*" \/>\s*\n\s*<el-option label="[^"]*" value="[^"]*" \/>\s*\n\s*<el-option label="[^"]*" value="[^"]*" \/>\s*\n\s*<el-option label="[^"]*" value="[^"]*" \/>/;
const newEdu = `<el-option label="\u5927\u4E13" value="\u5927\u4E13" />
            <el-option label="\u672C\u79D1" value="\u672C\u79D1" />
            <el-option label="\u7855\u58EB" value="\u7855\u58EB" />
            <el-option label="\u535A\u58EB" value="\u535A\u58EB" />`;
recruit = recruit.replace(eduRegex, newEdu);
fs.writeFileSync(recruitPath, recruit, 'utf8');
console.log('recruit.vue fixed');

// Fix attendance.vue weekDays
const attPath = 'd:\\zhehang-erp\\zhehang-erp-ui\\src\\views\\hrm\\attendance.vue';
let att = fs.readFileSync(attPath, 'utf8');
// Match the broken weekDays line
att = att.replace(/const weekDays = \[[^\]]*\]/m, 
  `const weekDays = ['\u4E00', '\u4E8C', '\u4E09', '\u56DB', '\u4E94', '\u516D', '\u65E5']`);
fs.writeFileSync(attPath, att, 'utf8');
console.log('attendance.vue fixed');
