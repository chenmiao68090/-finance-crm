const fs = require('fs');
const c = fs.readFileSync('d:/zhehang-erp/zhehang-erp-ui/src/views/crm/lead.vue', 'utf8');
const lines = c.split('\n');

// Hex-dump lines 95 and 96 to see exact whitespace
function hexLine(n) {
  const l = lines[n-1];
  let out = `Line ${n} (len=${l.length}): `;
  out += '|' + l + '|\n  hex: ';
  for (let i = 0; i < l.length; i++) {
    out += l.charCodeAt(i).toString(16).padStart(4,'0') + ' ';
  }
  console.log(out);
}
hexLine(95);
hexLine(96);
hexLine(151);
hexLine(152);
hexLine(157);
