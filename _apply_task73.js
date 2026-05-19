const fs = require('fs');
const filePath = 'd:\\zhehang-erp\\zhehang-erp-ui\\src\\views\\crm\\lead.vue';
let rawContent = fs.readFileSync(filePath, 'utf8');
const hadCRLF = rawContent.includes('\r\n');
let content = rawContent.replace(/\r\n/g, '\n');
const original = content;

function replace(oldStr, newStr, label) {
  const occ = content.split(oldStr).length - 1;
  if (occ !== 1) {
    throw new Error(`[${label}] expected exactly 1 occurrence, got ${occ}`);
  }
  content = content.replace(oldStr, newStr);
  console.log(`[${label}] OK`);
}

// 1) Add FollowUpRecord interface + followUpRecords field to Lead
replace(
  `interface Lead {
  id: number
  name: string
  company: string
  phone: string
  registerDate: string
  email: string
  source: number
  status: number
  pool: number
  ownerId: number | null
  ownerName: string
  lastFollowTime: string
  createTime: string
  remark: string
}`,
  `interface FollowUpRecord {
  content: string
  operator: string
  time: string
}

interface Lead {
  id: number
  name: string
  company: string
  phone: string
  registerDate: string
  email: string
  source: number
  status: number
  pool: number
  ownerId: number | null
  ownerName: string
  lastFollowTime: string
  createTime: string
  remark: string
  followUpRecords?: FollowUpRecord[]
}`,
  'Lead interface + FollowUpRecord'
);

// 2) Add reactive vars after selectedRows declaration
replace(
  `const selectedRows = ref<Lead[]>([])`,
  `const selectedRows = ref<Lead[]>([])

// ============ 跟进线索弹窗 ============
const followUpVisible = ref(false)
const followUpContent = ref('')
const currentFollowUpLead = ref<Lead | null>(null)
const currentFollowUpRecords = computed(() => {
  if (!currentFollowUpLead.value?.followUpRecords) return []
  return [...currentFollowUpLead.value.followUpRecords].reverse()
})
const openFollowUp = (row: Lead) => {
  currentFollowUpLead.value = row
  followUpContent.value = ''
  followUpVisible.value = true
}
const saveFollowUp = () => {
  if (!followUpContent.value.trim() || !currentFollowUpLead.value) return
  const now = new Date()
  const timeStr = now.getFullYear() + '-' +
    String(now.getMonth() + 1).padStart(2, '0') + '-' +
    String(now.getDate()).padStart(2, '0') + ' ' +
    String(now.getHours()).padStart(2, '0') + ':' +
    String(now.getMinutes()).padStart(2, '0')
  const record: FollowUpRecord = {
    content: followUpContent.value.trim(),
    operator: 'admin',
    time: timeStr
  }
  if (!currentFollowUpLead.value.followUpRecords) {
    currentFollowUpLead.value.followUpRecords = []
  }
  currentFollowUpLead.value.followUpRecords.push(record)
  saveToStorage()
  followUpContent.value = ''
  ElMessage.success('跟进记录已保存')
}`,
  'reactive vars + computed + functions'
);

// 3) Modify "跟进/编辑" button click handler
replace(
  `<el-button size="small" link @click="openEdit(row)">{{ activeTab === 'my' ? '跟进' : '编辑' }}</el-button>`,
  `<el-button size="small" link @click="activeTab === 'my' ? openFollowUp(row) : openEdit(row)">{{ activeTab === 'my' ? '跟进' : '编辑' }}</el-button>`,
  'follow/edit button click'
);

// 4) Insert the new follow-up dialog right after the duplicate (查重) dialog closes
const followUpDialog = `
    <!-- 跟进线索弹窗 -->
    <el-dialog v-model="followUpVisible" title="跟进线索" width="750px" destroy-on-close>
      <div style="display: flex; gap: 20px; min-height: 400px;">
        <!-- 左侧：输入区 -->
        <div style="flex: 0 0 40%;">
          <el-form label-position="top">
            <el-form-item label="跟进内容">
              <el-input v-model="followUpContent" type="textarea" :rows="8" placeholder="请输入跟进内容..." />
            </el-form-item>
          </el-form>
          <el-button type="primary" @click="saveFollowUp" :disabled="!followUpContent.trim()">保存</el-button>
        </div>
        <!-- 右侧：历史记录 -->
        <div style="flex: 1; border-left: 1px solid var(--gold-border, #333); padding-left: 20px; overflow-y: auto; max-height: 450px;">
          <h4 style="margin: 0 0 15px; color: var(--gold-primary, #D4AF37);">跟进记录</h4>
          <el-timeline v-if="currentFollowUpLead?.followUpRecords?.length">
            <el-timeline-item
              v-for="(record, idx) in currentFollowUpRecords"
              :key="idx"
              :timestamp="record.time + ' - ' + record.operator"
              placement="top"
            >
              <p style="margin: 0; white-space: pre-wrap;">{{ record.content }}</p>
            </el-timeline-item>
          </el-timeline>
          <el-empty v-else description="暂无跟进记录" />
        </div>
      </div>
    </el-dialog>
`;

replace(
  `      <template #footer>
        <el-button @click="dupDialog.visible = false">关闭</el-button>
      </template>
    </el-dialog>
  </div>
</template>`,
  `      <template #footer>
        <el-button @click="dupDialog.visible = false">关闭</el-button>
      </template>
    </el-dialog>
${followUpDialog}  </div>
</template>`,
  'insert follow-up dialog'
);

if (content === original) {
  throw new Error('No changes were made!');
}

const finalContent = hadCRLF ? content.replace(/\n/g, '\r\n') : content;
fs.writeFileSync(filePath, finalContent, 'utf8');
console.log('\nWritten. CRLF:', hadCRLF, ' length:', finalContent.length);
console.log('Line count:', content.split('\n').length);
