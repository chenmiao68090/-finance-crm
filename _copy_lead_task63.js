const fs = require('fs');
const path = require('path');

const stagingDir = path.join(__dirname, '_staging');
const targetDir = 'd:\\zhehang-erp\\zhehang-erp-ui';

const copies = [
  { src: 'crm.ts', dst: path.join(targetDir, 'src', 'api', 'crm.ts') },
  { src: 'lead.vue', dst: path.join(targetDir, 'src', 'views', 'crm', 'lead.vue') }
];

for (const c of copies) {
  const srcPath = path.join(stagingDir, c.src);
  if (!fs.existsSync(srcPath)) {
    console.error('Missing staging file:', srcPath);
    process.exit(1);
  }
  fs.mkdirSync(path.dirname(c.dst), { recursive: true });
  const content = fs.readFileSync(srcPath, 'utf8');
  fs.writeFileSync(c.dst, content, 'utf8');
  const lines = content.split(/\r?\n/).length;
  console.log(`OK -> ${c.dst} (${lines} lines)`);
}
console.log('All files written.');
