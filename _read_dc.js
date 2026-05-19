const fs = require('fs');
const path = 'd:/zhehang-erp/docker-compose.yml';
try {
  const content = fs.readFileSync(path, 'utf8');
  fs.writeFileSync('d:/陈苗/_tmp_dc_read.txt', content, 'utf8');
  console.log('SUCCESS len=' + content.length);
} catch(e) {
  console.log('ERROR: ' + e.message);
}
