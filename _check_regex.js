const fs = require('fs')
const t = fs.readFileSync('d:/zhehang-erp/zhehang-erp-ui/src/locales/cc-zh-CN.ts', 'utf8')
const r = new RegExp('("ivr": \\{\\s*\\n\\s*"title":[^\\n]+\\n\\s*"subtitle":[^\\n]+\\n\\s*"eyebrow":[^\\n]+\\n)')
const m = t.match(r)
console.log('match:', m ? 'YES, len ' + m[1].length : 'NO')
if (m) {
  console.log('---matched part---')
  console.log(m[1])
}
