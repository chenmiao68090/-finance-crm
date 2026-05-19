import { get, post, put } from './request'
import type { PageQuery, PageResult } from './types'

// ============= 类型定义 =============

export interface ProcessDef {
  id: number
  name: string
  processKey: string
  category: string
  version: number
  description: string
  formConfig: string
  processConfig: string
  status: number
  createTime: string
  updateTime: string
}

export interface ProcessDefDTO {
  id?: number
  name: string
  processKey: string
  category: string
  description: string
  formConfig: string
  processConfig: string
}

export interface TaskItem {
  id: number
  instanceId: number
  nodeName: string
  nodeType: string
  assigneeId: number
  assigneeName: string
  status: number
  comment: string
  handleTime: string
  createTime: string
  processName: string
  instanceTitle: string
  initiatorId: number
  initiatorName: string
  startTime: string
}

export interface InstanceItem {
  id: number
  processDefId: number
  processName: string
  title: string
  initiatorId: number
  initiatorName: string
  formData: string
  status: number
  startTime: string
  endTime: string
  currentAssigneeName: string
  currentNodeName: string
  histories: HistoryItem[]
}

export interface HistoryItem {
  id: number
  instanceId: number
  nodeName: string
  operatorId: number
  operatorName: string
  operatorAvatar: string
  action: string
  comment: string
  operTime: string
}

export interface ProcessTemplate {
  key: string
  name: string
  category: string
  formConfig: string
  processConfig: string
}

// ============= 流程定义 API =============

export const processApi = {
  list: (params?: { name?: string; category?: string; status?: number }) =>
    get<ProcessDef[]>('/api/workflow/process/list', params),
  detail: (id: number) =>
    get<ProcessDef>(`/api/workflow/process/${id}`),
  create: (data: ProcessDefDTO) =>
    post('/api/workflow/process', data),
  update: (data: ProcessDefDTO) =>
    put('/api/workflow/process', data),
  publish: (id: number) =>
    put(`/api/workflow/process/publish/${id}`),
  disable: (id: number) =>
    put(`/api/workflow/process/disable/${id}`),
  templates: () =>
    get<ProcessTemplate[]>('/api/workflow/process/templates')
}

// ============= 流程实例 API =============

export const instanceApi = {
  start: (data: { processKey: string; title: string; formData: Record<string, any> }) =>
    post('/api/workflow/instance/start', data),
  detail: (id: number) =>
    get<InstanceItem>(`/api/workflow/instance/detail/${id}`),
  cancel: (id: number) =>
    put(`/api/workflow/instance/cancel/${id}`)
}

// ============= 审批任务 API =============

export const taskApi = {
  todo: (params: PageQuery) =>
    get<PageResult<TaskItem>>('/api/workflow/task/todo', params),
  done: (params: PageQuery) =>
    get<PageResult<TaskItem>>('/api/workflow/task/done', params),
  started: (params: PageQuery) =>
    get<PageResult<InstanceItem>>('/api/workflow/task/started', params),
  approve: (id: number, data: { comment?: string }) =>
    put(`/api/workflow/task/approve/${id}`, data),
  reject: (id: number, data: { comment?: string }) =>
    put(`/api/workflow/task/reject/${id}`, data),
  transfer: (id: number, data: { comment?: string; targetUserId: number }) =>
    put(`/api/workflow/task/transfer/${id}`, data)
}
