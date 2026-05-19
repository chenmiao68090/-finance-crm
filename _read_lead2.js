const fs = require('fs');
const path = 'd:/zhehang-erp/zhehang-erp-ui/src/views/crm/lead.vue';
const c = fs.readFileSync(path, 'utf8');
const lines = c.split('\n');

// Print specific ranges
const ranges = [
  [85, 110],   // table column with phone
  [145, 180],  // form-item with phone
  [340, 410],  // other tables, interface Lead
  [440, 480],  // phone usages around 457
  [555, 605],  // formData definition
  [670, 700],  // mock data 676
  [790, 870],  // CSV headers/export/import around 800
  [990, 1015], // CSV end
];

ranges.forEach(([s,e]) => {
  console.log(`\n===== Lines ${s}-${e} =====`);
  for (let i = s-1; i < Math.min(e, lines.length); i++) {
    console.log((i+1).toString().padStart(4) + '| ' + lines[i]);
  }
});
