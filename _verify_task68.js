const fs = require('fs');
const path = 'd:/zhehang-erp/zhehang-erp-ui/src/views/crm/lead.vue';
const c = fs.readFileSync(path, 'utf8');
const lines = c.split('\n');

// Verify by checking lines that should now contain registerDate
const checks = [];
lines.forEach((line, i) => {
  if (line.includes('registerDate') || line.includes('\u516c\u53f8\u6ce8\u518c\u65e5\u671f')) {
    checks.push((i+1).toString().padStart(4) + '| ' + line.replace(/\r$/, ''));
  }
});
console.log('Lines containing registerDate or 公司注册日期:');
console.log(checks.join('\n'));
console.log('\nTotal matches:', checks.length);
console.log('File length:', c.length, 'lines:', lines.length);
