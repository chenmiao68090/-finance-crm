const fs = require('fs');
const path = 'd:/zhehang-erp/zhehang-erp-ui/src/views/crm/lead.vue';
const c = fs.readFileSync(path, 'utf8');
const lines = c.split('\n');

// Search for key patterns
const patterns = [
  /prop="phone"/,
  /formData\.phone/,
  /registerDate/,
  /interface\s+Lead/i,
  /handleAdd/,
  /formData\s*[:=]/,
  /reset.*formData|formData\s*=\s*\{/,
  /CSV|csv|export|import/i,
  /Math\.random/,
  /mock|Mock|seed|Seed/,
  /phone:/,
  /headers\s*=|template.*csv/i,
];

const matches = {};
lines.forEach((line, i) => {
  patterns.forEach(p => {
    if (p.test(line)) {
      const key = p.toString();
      if (!matches[key]) matches[key] = [];
      matches[key].push(i+1);
    }
  });
});

for (const k in matches) {
  console.log(k, '->', matches[k].join(','));
}
