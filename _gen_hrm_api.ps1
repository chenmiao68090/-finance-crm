$uiBase = "d:\zhehang-erp\zhehang-erp-ui\src"

$content = @'
import { get, post, put, del } from './request'

// 招聘管理
export const recruitApi = {
  list: (params: any) => get('/api/hrm/recruit/list', params),
  detail: (id: number) => get(`/api/hrm/recruit/${id}`),
  create: (data: any) => post('/api/hrm/recruit', data),
  update: (data: any) => put('/api/hrm/recruit', data),
  remove: (id: number) => del(`/api/hrm/recruit/${id}`),
  changeStatus: (data: { id: number; status: number }) => put('/api/hrm/recruit/status', data)
}

// 简历管理
export const resumeApi = {
  list: (params: any) => get('/api/hrm/resume/list', params),
  create: (data: any) => post('/api/hrm/resume', data),
  update: (data: any) => put('/api/hrm/resume', data),
  remove: (id: number) => del(`/api/hrm/resume/${id}`),
  changeStatus: (data: { id: number; status: number; evaluation?: string }) => put('/api/hrm/resume/status', data)
}

// 考勤管理
export const attendanceApi = {
  list: (params: any) => get('/api/hrm/attendance/list', params),
  clockIn: (employeeId: number) => post('/api/hrm/attendance/clock-in', { employeeId }),
  clockOut: (employeeId: number) => post('/api/hrm/attendance/clock-out', { employeeId }),
  stats: (params: { employeeId: number; month: string }) => get('/api/hrm/attendance/stats', params)
}

// 请假管理
export const leaveApi = {
  list: (params: any) => get('/api/hrm/leave/list', params),
  create: (data: any) => post('/api/hrm/leave', data),
  approve: (data: { id: number; approverId: number; approved: boolean }) => put('/api/hrm/leave/approve', data)
}

// 薪资管理
export const salaryApi = {
  list: (params: any) => get('/api/hrm/salary/list', params),
  create: (data: any) => post('/api/hrm/salary', data),
  update: (data: any) => put('/api/hrm/salary', data),
  calculate: (salaryMonth: string) => post('/api/hrm/salary/calculate', { salaryMonth }),
  pay: (salaryMonth: string) => post('/api/hrm/salary/pay', { salaryMonth }),
  slip: (id: number) => get(`/api/hrm/salary/slip/${id}`)
}

// 绩效管理
export const performanceApi = {
  list: (params: any) => get('/api/hrm/performance/list', params),
  create: (data: any) => post('/api/hrm/performance', data),
  update: (data: any) => put('/api/hrm/performance', data),
  remove: (id: number) => del(`/api/hrm/performance/${id}`),
  evaluate: (data: { id: number; selfScore: number; leaderScore: number; evaluation: string }) => put('/api/hrm/performance/evaluate', data),
  statistics: (params: { period?: string; type?: number }) => get('/api/hrm/performance/statistics', params)
}

// 培训管理
export const trainingApi = {
  list: (params: any) => get('/api/hrm/training/list', params),
  create: (data: any) => post('/api/hrm/training', data),
  update: (data: any) => put('/api/hrm/training', data),
  remove: (id: number) => del(`/api/hrm/training/${id}`),
  enroll: (data: { trainingId: number; employeeId: number }) => post('/api/hrm/training/enroll', data)
}
'@

[IO.File]::WriteAllText("$uiBase\api\hrm.ts", $content, [System.Text.Encoding]::UTF8)
Write-Host "API file generated!"
