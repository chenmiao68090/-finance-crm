const fs = require('fs');
const p = 'd:/zhehang-erp/zhehang-erp-ui/src/views/crm/lead.vue';
let c = fs.readFileSync(p, 'utf8');
const orig = c;

// 1. Phone icon import
const iconImportRegex = /import\s*\{([^}]*)\}\s*from\s*['"]@element-plus\/icons-vue['"]/;
const m = c.match(iconImportRegex);
if (m) {
  const names = m[1].split(',').map(s => s.trim()).filter(Boolean);
  if (!names.includes('Phone')) {
    names.push('Phone');
    const newImport = `import { ${names.join(', ')} } from '@element-plus/icons-vue'`;
    c = c.replace(iconImportRegex, newImport);
    console.log('[1] Added Phone to existing icons-vue import');
  } else {
    console.log('[1] Phone already imported');
  }
} else {
  // add new import after first <script>
  const scriptIdx = c.indexOf('<script');
  const scriptEnd = c.indexOf('>', scriptIdx) + 1;
  c = c.slice(0, scriptEnd) + `\nimport { Phone } from '@element-plus/icons-vue'` + c.slice(scriptEnd);
  console.log('[1] Inserted new Phone import');
}

// 2. Replace phone column
const oldCol = `<el-table-column label="联系电话" prop="phone" width="140" />`;
const newCol = `<el-table-column prop="phone" label="联系电话" width="180">
          <template #default="{ row }">
            <span>{{ row.phone }}</span>
            <el-button
              v-if="row.phone"
              type="success"
              link
              size="small"
              style="margin-left: 6px;"
              @click="handleCall(row.phone)"
            >
              <el-icon><Phone /></el-icon>
            </el-button>
          </template>
        </el-table-column>`;
if (c.includes(oldCol)) {
  c = c.replace(oldCol, newCol);
  console.log('[2] Phone column replaced with slot template');
} else {
  console.log('[2] WARN: original phone column not found');
}

// 3. Add handleCall function
if (!c.includes('const handleCall')) {
  // Insert before the script closing tag
  const handleCallFn = `
const handleCall = (phone: string) => {
  if (!phone) return
  window.location.href = \`tel:\${phone}\`
}
`;
  // Find end of <script setup ...> block (last </script>)
  const closeIdx = c.lastIndexOf('</script>');
  if (closeIdx !== -1) {
    c = c.slice(0, closeIdx) + handleCallFn + '\n' + c.slice(closeIdx);
    console.log('[3] handleCall function added');
  } else {
    console.log('[3] ERROR: </script> not found');
  }
} else {
  console.log('[3] handleCall already exists');
}

if (c === orig) {
  console.log('No changes made.');
} else {
  fs.writeFileSync(p, c, 'utf8');
  console.log('File written. New length:', c.length);
}
