const fs = require('fs');
const path = require('path');

const copies = [
  ['d:\\陈苗\\_staging\\permission_directive.ts', 'd:\\zhehang-erp\\zhehang-erp-ui\\src\\directives\\permission.ts'],
  ['d:\\陈苗\\_staging\\routes.ts',               'd:\\zhehang-erp\\zhehang-erp-ui\\src\\router\\routes.ts'],
  ['d:\\陈苗\\_staging\\request.ts',              'd:\\zhehang-erp\\zhehang-erp-ui\\src\\api\\request.ts'],
];

for (const [src, dst] of copies) {
  const bytes = fs.readFileSync(src);
  fs.writeFileSync(dst, bytes);
  console.log(`Copied ${src} -> ${dst} (${bytes.length} bytes)`);
}
console.log('All done.');
