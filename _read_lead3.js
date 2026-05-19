const fs = require('fs');
const path = 'd:/zhehang-erp/zhehang-erp-ui/src/views/crm/lead.vue';
const c = fs.readFileSync(path, 'utf8');
const lines = c.split('\n');
const ranges = [[400, 440], [600, 670], [870, 920]];
ranges.forEach(([s,e]) => {
  console.log(`\n===== Lines ${s}-${e} =====`);
  for (let i = s-1; i < Math.min(e, lines.length); i++) {
    console.log((i+1).toString().padStart(4) + '| ' + lines[i]);
  }
});
