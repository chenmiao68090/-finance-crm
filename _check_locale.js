const fs = require('fs')
function check(file) {
  console.log('=== ' + file + ' ===')
  const t = fs.readFileSync(file, 'utf8')
  try {
    const m = JSON.parse(t.replace(/^export default /, ''))
    console.log('parses OK, lines:', t.split('\n').length)
    console.log('cc.ivr keys:', Object.keys(m.cc.ivr).join(','))
    console.log('cc.ivr.stats:', m.cc.ivr.stats ? Object.keys(m.cc.ivr.stats).join(',') : 'NO')
    console.log('cc.ivr.list:', m.cc.ivr.list ? Object.keys(m.cc.ivr.list).join(',') : 'NO')
    console.log('cc.ivr.tplFlow:', m.cc.ivr.tplFlow ? Object.keys(m.cc.ivr.tplFlow).length : 'NO')
    console.log('cc.ivr.designer.extra:', m.cc.ivr.designer && m.cc.ivr.designer.extra ? Object.keys(m.cc.ivr.designer.extra).join(',') : 'NO')
    console.log('cc.skill.ext:', m.cc.skill.ext ? Object.keys(m.cc.skill.ext).length : 'NO')
  } catch (e) {
    console.log('PARSE ERR:', e.message)
    // print last 500 chars
    console.log('--- tail:', t.slice(-300))
  }
}
check('d:/zhehang-erp/zhehang-erp-ui/src/locales/cc-zh-CN.ts')
check('d:/zhehang-erp/zhehang-erp-ui/src/locales/cc-en-US.ts')
