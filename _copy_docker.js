const fs = require('fs');
const path = require('path');

const dir = 'd:/zhehang-erp/zhehang-erp-server';
if (!fs.existsSync(dir)) {
  fs.mkdirSync(dir, { recursive: true });
}

fs.copyFileSync('d:/陈苗/_tmp_dockerfile', path.join(dir, 'Dockerfile'));
fs.copyFileSync('d:/陈苗/_tmp_dockerignore', path.join(dir, '.dockerignore'));

console.log('Dockerfile bytes:', fs.statSync(path.join(dir, 'Dockerfile')).size);
console.log('.dockerignore bytes:', fs.statSync(path.join(dir, '.dockerignore')).size);
console.log('Done!');
