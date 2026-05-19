import { get, post, put, del } from './request'

// 线索管理
export const leadApi = {
  list: (params: any) => get('/crm/lead/list', params),
  detail: (id: number) => get(`/crm/lead/${id}`),
  create: (data: any) => post('/crm/lead', data),
  update: (data: any) => put('/crm/lead', data),
  remove: (id: number) => del(`/crm/lead/${id}`),
  convert: (id: number) => post(`/crm/lead/convert/${id}`),
  assign: (data: { id: number; ownerId: number }) => post('/crm/lead/assign', data),
  // 公海池
  poolList: (params: any) => get('/crm/lead/pool', params),
  myList: (params: any) => get('/crm/lead/my', params),
  claim: (ids: number[]) => post('/crm/lead/claim', { ids }),
  returnToPool: (ids: number[], reason: string) => post('/crm/lead/return', { ids, reason }),
  distribute: (data: { ids: number[]; ownerId: number }) => post('/crm/lead/distribute', data),
  importLeads: (formData: FormData) => post('/crm/lead/import', formData),
  exportLeads: (params: any) => get('/crm/lead/export', params),
  checkDuplicate: (params: { phone?: string; name?: string }) => get('/crm/lead/duplicate', params),
  getPoolRules: () => get('/crm/lead/pool-rules'),
  savePoolRules: (data: any) => post('/crm/lead/pool-rules', data)
}

// 客户管理
export const customerApi = {
  list: (params: any) => get('/crm/customer/list', params),
  detail: (id: number) => get(`/crm/customer/${id}`),
  create: (data: any) => post('/crm/customer', data),
  update: (data: any) => put('/crm/customer', data),
  remove: (id: number) => del(`/crm/customer/${id}`),
  toPool: (id: number, reason: string) => post(`/crm/customer/toPool/${id}`, { reason })
}

// 联系人管理
export const contactApi = {
  list: (customerId: number) => get('/crm/contact/list', { customerId }),
  create: (data: any) => post('/crm/contact', data),
  update: (data: any) => put('/crm/contact', data),
  remove: (id: number) => del(`/crm/contact/${id}`)
}

// 跟进记录
export const followApi = {
  list: (customerId: number) => get('/crm/follow/list', { customerId }),
  create: (data: any) => post('/crm/follow', data),
  timeline: (customerId: number) => get(`/crm/follow/timeline/${customerId}`)
}

// 商机管理
export const opportunityApi = {
  list: (params: any) => get('/crm/opportunity/list', params),
  detail: (id: number) => get(`/crm/opportunity/${id}`),
  create: (data: any) => post('/crm/opportunity', data),
  update: (data: any) => put('/crm/opportunity', data),
  remove: (id: number) => del(`/crm/opportunity/${id}`),
  funnel: () => get('/crm/opportunity/funnel')
}

// 合同管理
export const contractApi = {
  list: (params: any) => get('/crm/contract/list', params),
  detail: (id: number) => get(`/crm/contract/${id}`),
  create: (data: any) => post('/crm/contract', data),
  update: (data: any) => put('/crm/contract', data),
  changeStatus: (id: number, status: number) => put('/crm/contract/status', { id, status })
}

// 工单管理
export const ticketApi = {
  list: (params: any) => get('/crm/ticket/list', params),
  create: (data: any) => post('/crm/ticket', data),
  update: (data: any) => put('/crm/ticket', data)
}

// 公海池
export const poolApi = {
  list: (params: any) => get('/crm/pool/list', params),
  claim: (id: number, ownerId: number) => post(`/crm/pool/claim/${id}`, { ownerId })
}
