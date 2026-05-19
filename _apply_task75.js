const fs = require('fs');
const path = 'd:\\zhehang-erp\\zhehang-erp-ui\\src\\views\\crm\\lead.vue';

let content = fs.readFileSync(path, 'utf8');

const oldFn = `const handleCall = (phone: string) => {
  if (!phone) return
  window.location.href = \`tel:\${phone}\`
}`;

const newFn = `const handleCall = (phone: string) => {
  if (!phone) return
  const a = document.createElement('a')
  a.href = \`tel:\${phone}\`
  a.style.display = 'none'
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
}`;

if (!content.includes(oldFn)) {
  console.log('OLD_NOT_FOUND');
  // try to find current handleCall
  const m = content.match(/const handleCall[\s\S]*?\n\}/);
  console.log('CURRENT:\n' + (m ? m[0] : 'NONE'));
  process.exit(1);
}

if (content.includes(newFn)) {
  console.log('ALREADY_APPLIED');
  process.exit(0);
}

content = content.replace(oldFn, newFn);
fs.writeFileSync(path, content, 'utf8');

// verify
const after = fs.readFileSync(path, 'utf8');
if (after.includes(newFn) && !after.includes(oldFn)) {
  console.log('SUCCESS');
} else {
  console.log('VERIFY_FAILED');
  process.exit(1);
}
