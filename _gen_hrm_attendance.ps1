$uiBase = "d:\zhehang-erp\zhehang-erp-ui\src"

$content = @'
<template>
  <div class="hrm-attendance">
    <!-- Stats Cards -->
    <el-row :gutter="16" class="stats-row">
      <el-col :span="4" v-for="(item, key) in statsCards" :key="key">
        <el-card shadow="never" class="stat-card" :class="item.class">
          <div class="stat-value">{{ stats[key] || 0 }}</div>
          <div class="stat-label">{{ item.label }}</div>
        </el-card>
      </el-col>
      <el-col :span="4">
        <el-card shadow="never" class="stat-card clock-card">
          <el-button type="primary" size="large" @click="handleClockIn" :disabled="clockedIn" class="clock-btn">
            {{ $t('hrm.attendance.clockIn') }}
          </el-button>
          <el-button type="success" size="large" @click="handleClockOut" :disabled="!clockedIn || clockedOut" class="clock-btn">
            {{ $t('hrm.attendance.clockOut') }}
          </el-button>
        </el-card>
      </el-col>
    </el-row>

    <!-- Filter & Table -->
    <el-card shadow="never" class="table-card">
      <template #header>
        <div class="card-header">
          <div class="header-left">
            <span>{{ $t('hrm.attendance.title') }}</span>
            <el-date-picker v-model="selectedMonth" type="month" value-format="YYYY-MM" :placeholder="$t('hrm.attendance.month')" @change="handleMonthChange" style="margin-left:16px;width:160px" />
          </div>
          <div>
            <el-button :type="viewMode === 'list' ? 'primary' : 'default'" @click="viewMode = 'list'">{{ $t('hrm.attendance.listView') }}</el-button>
            <el-button :type="viewMode === 'calendar' ? 'primary' : 'default'" @click="viewMode = 'calendar'">{{ $t('hrm.attendance.calendarView') }}</el-button>
            <el-button type="warning" @click="leaveDialogVisible = true">{{ $t('hrm.attendance.leave') }}</el-button>
          </div>
        </div>
      </template>

      <!-- List View -->
      <el-table v-if="viewMode === 'list'" :data="tableData" v-loading="loading" border stripe>
        <el-table-column prop="attendanceDate" :label="$t('hrm.attendance.date')" width="120" />
        <el-table-column prop="clockIn" :label="$t('hrm.attendance.clockIn')" width="100" />
        <el-table-column prop="clockOut" :label="$t('hrm.attendance.clockOut')" width="100" />
        <el-table-column prop="workHours" :label="$t('hrm.attendance.workHours')" width="100" align="center">
          <template #default="{ row }">{{ row.workHours ? row.workHours + 'h' : '-' }}</template>
        </el-table-column>
        <el-table-column :label="$t('hrm.attendance.status')" width="100">
          <template #default="{ row }">
            <el-tag :type="attendanceStatusType(row.status)">{{ attendanceStatusLabel(row.status) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="remark" :label="$t('hrm.attendance.remark')" min-width="150" show-overflow-tooltip />
      </el-table>

      <!-- Calendar View -->
      <div v-else class="calendar-grid">
        <div class="calendar-header">
          <div v-for="d in weekDays" :key="d" class="calendar-header-cell">{{ d }}</div>
        </div>
        <div class="calendar-body">
          <div v-for="(day, idx) in calendarDays" :key="idx" class="calendar-cell" :class="{ 'other-month': !day.current, 'today': day.isToday }">
            <div class="day-num">{{ day.day }}</div>
            <div v-if="day.record" class="day-status">
              <el-tag size="small" :type="attendanceStatusType(day.record.status)">{{ attendanceStatusLabel(day.record.status) }}</el-tag>
            </div>
          </div>
        </div>
      </div>

      <el-pagination
        v-if="viewMode === 'list'"
        v-model:current-page="queryParams.pageNum"
        v-model:page-size="queryParams.pageSize"
        :total="total"
        :page-sizes="[10, 20, 50]"
        layout="total, sizes, prev, pager, next, jumper"
        @size-change="getList"
        @current-change="getList"
        class="pagination"
      />
    </el-card>

    <!-- Leave Dialog -->
    <el-dialog v-model="leaveDialogVisible" :title="$t('hrm.attendance.leave')" width="500px" destroy-on-close>
      <el-form :model="leaveForm" ref="leaveFormRef" label-width="90px">
        <el-form-item :label="$t('hrm.attendance.leaveType')" prop="leaveType">
          <el-select v-model="leaveForm.leaveType" style="width:100%">
            <el-option :label="$t('hrm.attendance.leaveTypeAnnual')" :value="1" />
            <el-option :label="$t('hrm.attendance.leaveTypeSick')" :value="2" />
            <el-option :label="$t('hrm.attendance.leaveTypePersonal')" :value="3" />
            <el-option :label="$t('hrm.attendance.leaveTypeMaternity')" :value="4" />
            <el-option :label="$t('hrm.attendance.leaveTypeMarriage')" :value="5" />
            <el-option :label="$t('hrm.attendance.leaveTypeOther')" :value="6" />
          </el-select>
        </el-form-item>
        <el-form-item :label="$t('hrm.attendance.leaveStart')" prop="startTime">
          <el-date-picker v-model="leaveForm.startTime" type="datetime" style="width:100%" />
        </el-form-item>
        <el-form-item :label="$t('hrm.attendance.leaveEnd')" prop="endTime">
          <el-date-picker v-model="leaveForm.endTime" type="datetime" style="width:100%" />
        </el-form-item>
        <el-form-item :label="$t('hrm.attendance.leaveDuration')">
          <el-input :model-value="computedDuration" disabled>
            <template #append>{{ $t('hrm.attendance.days') }}</template>
          </el-input>
        </el-form-item>
        <el-form-item :label="$t('hrm.attendance.leaveReason')" prop="reason">
          <el-input v-model="leaveForm.reason" type="textarea" :rows="3" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="leaveDialogVisible = false">{{ $t('common.cancel') }}</el-button>
        <el-button type="primary" @click="handleLeaveSubmit">{{ $t('common.confirm') }}</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { ElMessage } from 'element-plus'
import { attendanceApi, leaveApi } from '@/api/hrm'

const { t } = useI18n()
const loading = ref(false)
const tableData = ref<any[]>([])
const total = ref(0)
const viewMode = ref<'list' | 'calendar'>('list')
const clockedIn = ref(false)
const clockedOut = ref(false)
const leaveDialogVisible = ref(false)
const leaveFormRef = ref()

const now = new Date()
const selectedMonth = ref(`${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`)
const currentEmployeeId = 1 // mock current user

const queryParams = reactive({ pageNum: 1, pageSize: 20, employeeId: currentEmployeeId, month: selectedMonth.value })

const stats = ref<Record<string, number>>({ normal: 0, late: 0, early: 0, absent: 0, total: 0 })

const statsCards = computed(() => ({
  normal: { label: t('hrm.attendance.statsNormal'), class: 'stat-normal' },
  late: { label: t('hrm.attendance.statsLate'), class: 'stat-late' },
  early: { label: t('hrm.attendance.statsEarly'), class: 'stat-early' },
  absent: { label: t('hrm.attendance.statsAbsent'), class: 'stat-absent' },
  total: { label: t('hrm.attendance.statsTotal'), class: 'stat-total' }
}))

const weekDays = ['一', '二', '三', '四', '五', '六', '日']

const calendarDays = computed(() => {
  const [year, month] = selectedMonth.value.split('-').map(Number)
  const firstDay = new Date(year, month - 1, 1)
  const lastDay = new Date(year, month, 0)
  const startWeekDay = firstDay.getDay() || 7
  const days: any[] = []
  const today = new Date()

  // Previous month padding
  for (let i = startWeekDay - 1; i > 0; i--) {
    const d = new Date(year, month - 1, 1 - i)
    days.push({ day: d.getDate(), current: false, record: null, isToday: false })
  }
  // Current month
  for (let i = 1; i <= lastDay.getDate(); i++) {
    const isToday = year === today.getFullYear() && month === today.getMonth() + 1 && i === today.getDate()
    const record = tableData.value.find((r: any) => {
      const d = new Date(r.attendanceDate)
      return d.getDate() === i
    })
    days.push({ day: i, current: true, record, isToday })
  }
  // Next month padding
  const remaining = 42 - days.length
  for (let i = 1; i <= remaining; i++) {
    days.push({ day: i, current: false, record: null, isToday: false })
  }
  return days
})

const leaveForm = reactive({ leaveType: 1, startTime: '', endTime: '', reason: '', employeeId: currentEmployeeId })

const computedDuration = computed(() => {
  if (!leaveForm.startTime || !leaveForm.endTime) return '0'
  const diff = new Date(leaveForm.endTime).getTime() - new Date(leaveForm.startTime).getTime()
  return (diff / (1000 * 60 * 60 * 24)).toFixed(1)
})

function attendanceStatusLabel(status: number) {
  const map: Record<number, string> = {
    0: t('hrm.attendance.statusNormal'), 1: t('hrm.attendance.statusLate'),
    2: t('hrm.attendance.statusEarly'), 3: t('hrm.attendance.statusAbsent')
  }
  return map[status] || ''
}

function attendanceStatusType(status: number) {
  const map: Record<number, string> = { 0: 'success', 1: 'warning', 2: 'warning', 3: 'danger' }
  return map[status] || 'info'
}

async function getList() {
  loading.value = true
  try {
    queryParams.month = selectedMonth.value
    const res = await attendanceApi.list(queryParams)
    tableData.value = res.data?.records || []
    total.value = res.data?.total || 0
  } finally { loading.value = false }
}

async function getStats() {
  const res = await attendanceApi.stats({ employeeId: currentEmployeeId, month: selectedMonth.value })
  stats.value = res.data || {}
}

function handleMonthChange() { getList(); getStats() }

async function handleClockIn() {
  await attendanceApi.clockIn(currentEmployeeId)
  ElMessage.success(t('hrm.attendance.clockInSuccess'))
  clockedIn.value = true
  getList(); getStats()
}

async function handleClockOut() {
  await attendanceApi.clockOut(currentEmployeeId)
  ElMessage.success(t('hrm.attendance.clockOutSuccess'))
  clockedOut.value = true
  getList(); getStats()
}

async function handleLeaveSubmit() {
  const data = { ...leaveForm, duration: parseFloat(computedDuration.value) }
  await leaveApi.create(data)
  ElMessage.success(t('common.success'))
  leaveDialogVisible.value = false
}

onMounted(() => { getList(); getStats() })
</script>

<style scoped>
.hrm-attendance { padding: 16px; }
.stats-row { margin-bottom: 16px; }
.stat-card { text-align: center; padding: 12px 0; }
.stat-value { font-size: 28px; font-weight: bold; }
.stat-normal .stat-value { color: #67c23a; }
.stat-late .stat-value { color: #e6a23c; }
.stat-early .stat-value { color: #e6a23c; }
.stat-absent .stat-value { color: #f56c6c; }
.stat-total .stat-value { color: #F26522; }
.stat-label { font-size: 13px; color: #909399; margin-top: 4px; }
.clock-card { display: flex; flex-direction: column; gap: 8px; align-items: center; justify-content: center; }
.clock-btn { width: 100%; }
.table-card .card-header { display: flex; justify-content: space-between; align-items: center; }
.header-left { display: flex; align-items: center; }
.pagination { margin-top: 16px; justify-content: flex-end; }
.calendar-grid { border: 1px solid #ebeef5; border-radius: 4px; }
.calendar-header { display: grid; grid-template-columns: repeat(7, 1fr); background: #f5f7fa; }
.calendar-header-cell { padding: 8px; text-align: center; font-weight: bold; font-size: 13px; }
.calendar-body { display: grid; grid-template-columns: repeat(7, 1fr); }
.calendar-cell { min-height: 70px; padding: 6px; border: 1px solid #ebeef5; }
.calendar-cell.other-month { background: #fafafa; color: #c0c4cc; }
.calendar-cell.today { background: #ecf5ff; }
.day-num { font-size: 14px; font-weight: 500; }
.day-status { margin-top: 4px; }
</style>
'@

[IO.File]::WriteAllText("$uiBase\views\hrm\attendance.vue", $content, [System.Text.Encoding]::UTF8)
Write-Host "attendance.vue generated!"
