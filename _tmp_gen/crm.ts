import { get, post, put, del } from './request'

// 线索管理
export const leadApi = {
  list: (params: any) => get('/api/crm/lead/list', params),
  detail: (id: number) => get(`/api/crm/lead/${id}`),
  create: (data: any) => post('/api/crm/lead', data),
  update: (data: any) => put('/api/crm/lead', data),
  remove: (id: number) => del(`/api/crm/lead/${id}`),
  convert: (id: number) => post(`/api/crm/lead/convert/${id}`),
  assign: (data: { id: number; ownerId: number }) => post('/api/crm/lead/assign', data)
}

// 客户管理
export const customerApi = {
  list: (params: any) => get('/api/crm/customer/list', params),
  detail: (id: number) => get(`/api/crm/customer/${id}`),
  create: (data: any) => post('/api/crm/customer', data),
  update: (data: any) => put('/api/crm/customer', data),
  remove: (id: number) => del(`/api/crm/customer/${id}`),
  toPool: (id: number, reason: string) => post(`/api/crm/customer/toPool/${id}`, { reason })
}

// 联系人管理
export const contactApi = {
  list: (customerId: number) => get('/api/crm/contact/list', { customerId }),
  create: (data: any) => post('/api/crm/contact', data),
  update: (data: any) => put('/api/crm/contact', data),
  remove: (id: number) => del(`/api/crm/contact/${id}`)
}

// 跟进记录
export const followApi = {
  list: (customerId: number) => get('/api/crm/follow/list', { customerId }),
  create: (data: any) => post('/api/crm/follow', data),
  timeline: (customerId: number) => get(`/api/crm/follow/timeline/${customerId}`)
}

// 商机管理
export const opportunityApi = {
  list: (params: any) => get('/api/crm/opportunity/list', params),
  detail: (id: number) => get(`/api/crm/opportunity/${id}`),
  create: (data: any) => post('/api/crm/opportunity', data),
  update: (data: any) => put('/api/crm/opportunity', data),
  remove: (id: number) => del(`/api/crm/opportunity/${id}`),
  funnel: () => get('/api/crm/opportunity/funnel')
}

// 合同管理
export const contractApi = {
  list: (params: any) => get('/api/crm/contract/list', params),
  detail: (id: number) => get(`/api/crm/contract/${id}`),
  create: (data: any) => post('/api/crm/contract', data),
  update: (data: any) => put('/api/crm/contract', data),
  changeStatus: (id: number, status: number) => put('/api/crm/contract/status', { id, status })
}

// 工单管理
export const ticketApi = {
  list: (params: any) => get('/api/crm/ticket/list', params),
  create: (data: any) => post('/api/crm/ticket', data),
  update: (data: any) => put('/api/crm/ticket', data)
}

// 公海池
export const poolApi = {
  list: (params: any) => get('/api/crm/pool/list', params),
  claim: (id: number, ownerId: number) => post(`/api/crm/pool/claim/${id}`, { ownerId })
}
