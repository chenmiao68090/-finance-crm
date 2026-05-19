const fs = require('fs');
const path = 'd:\\zhehang-erp\\zhehang-erp-ui\\src\\views\\crm\\lead.vue';

let content = fs.readFileSync(path, 'utf8');

// Find the phone column dial button v-if
const oldStr = 'v-if="row.phone"';
const newStr = 'v-if="row.phone && activeTab === \'my\'"';

const occurrences = (content.match(new RegExp(oldStr.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g')) || []).length;
console.log('Occurrences of original v-if="row.phone":', occurrences);

if (occurrences === 0) {
  console.error('Pattern not found!');
  // Search for phone-related buttons
  const lines = content.split('\n');
  lines.forEach((line, idx) => {
    if (line.includes('row.phone') || line.includes('Phone')) {
      console.log(`Line ${idx + 1}: ${line}`);
    }
  });
  process.exit(1);
}

const updated = content.replace(oldStr, newStr);
fs.writeFileSync(path, updated, 'utf8');

// Verify
const verify = fs.readFileSync(path, 'utf8');
if (verify.includes(newStr)) {
  console.log('SUCCESS: replacement applied.');
} else {
  console.log('FAIL: verification did not find the new string.');
}

// Show the surrounding context
const lines = verify.split('\n');
lines.forEach((line, idx) => {
  if (line.includes("activeTab === 'my'") && line.includes('row.phone')) {
    const start = Math.max(0, idx - 3);
    const end = Math.min(lines.length, idx + 3);
    console.log('--- Context ---');
    for (let i = start; i < end; i++) {
      console.log(`${i + 1}: ${lines[i]}`);
    }
  }
});
