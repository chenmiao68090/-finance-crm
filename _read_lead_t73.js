const fs = require('fs');
try {
  const path = 'd:\\zhehang-erp\\zhehang-erp-ui\\src\\views\\crm\\lead.vue';
  console.log('exists:', fs.existsSync(path));
  if (fs.existsSync(path)) {
    const content = fs.readFileSync(path, 'utf8');
    console.log('TOTAL_LINES:', content.split('\n').length);
    fs.writeFileSync('d:\\陈苗\\_lead_t73_full.txt', content, 'utf8');
    console.log('Written to _lead_t73_full.txt');
  } else {
    // Search for similar files
    const dir = 'd:\\zhehang-erp';
    console.log('zhehang-erp exists:', fs.existsSync(dir));
    if (fs.existsSync(dir)) {
      console.log('contents:', fs.readdirSync(dir));
    }
  }
} catch(e) {
  console.error('ERR:', e.message);
}
