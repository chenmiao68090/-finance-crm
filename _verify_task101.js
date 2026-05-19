const fs = require('fs')
const files = [
  'd:/zhehang-erp/zhehang-erp-ui/src/views/call-center/ivr.vue',
  'd:/zhehang-erp/zhehang-erp-ui/src/views/call-center/components/IvrDesigner.vue',
  'd:/zhehang-erp/zhehang-erp-ui/src/views/call-center/skill.vue'
]
for (const f of files) {
  const c = fs.readFileSync(f, 'utf8')
  const styleStart = c.indexOf('<style')
  const codeOnly = c.slice(0, styleStart)
  // Strip HTML comments
  const noHtml = codeOnly.replace(/<!--[\s\S]*?-->/g, '')
  // Strip JS line comments
  const noLine = noHtml.replace(/\/\/[^\n]*\n/g, '\n')
  // Strip JS block comments
  const noBlock = noLine.replace(/\/\*[\s\S]*?\*\//g, '')
  const remaining = noBlock.match(/[\u4e00-\u9fff]+/g) || []
  const unique = [...new Set(remaining)]
  console.log('=== ' + f.split('/').pop() + ' ===')
  console.log('  total lines:', c.split('\n').length)
  console.log('  has useI18n:', c.includes('useI18n'))
  console.log('  has const { t }:', c.includes('const { t }'))
  console.log('  remaining user-visible Chinese chunks:', unique.length)
  if (unique.length) {
    console.log('  examples:', unique.slice(0, 8))
  }
  console.log('')
}
