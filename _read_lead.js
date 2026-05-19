const fs = require('fs');
const path = 'd:/zhehang-erp/zhehang-erp-ui/src/views/crm/lead.vue';
const c = fs.readFileSync(path, 'utf8');
const lines = c.split('\n');
// Print all lines with line numbers
for (let i = 0; i < lines.length; i++) {
  console.log((i+1).toString().padStart(4, ' ') + ': ' + lines[i]);
}
