import { get, post, put, del } from './request'

// 报价管理
export const quotationApi = {
  list: (params: any) => get('/api/sales/quotation/list', params),
  detail: (id: number) => get(`/api/sales/quotation/${id}`),
  create: (data: any) => post('/api/sales/quotation', data),
  update: (data: any) => put('/api/sales/quotation', data),
  remove: (id: number) => del(`/api/sales/quotation/${id}`),
  send: (id: number) => post(`/api/sales/quotation/send/${id}`),
  confirm: (id: number) => post(`/api/sales/quotation/confirm/${id}`),
  newVersion: (id: number) => post(`/api/sales/quotation/newVersion/${id}`)
}

// 销售订单
export const salesOrderApi = {
  list: (params: any) => get('/api/sales/order/list', params),
  detail: (id: number) => get(`/api/sales/order/${id}`),
  create: (data: any) => post('/api/sales/order', data),
  update: (data: any) => put('/api/sales/order', data),
  remove: (id: number) => del(`/api/sales/order/${id}`),
  approve: (id: number) => post(`/api/sales/order/approve/${id}`),
  changeStatus: (data: { id: number; status: number }) => post('/api/sales/order/changeStatus', data),
  fromQuotation: (quotationId: number) => post(`/api/sales/order/fromQuotation/${quotationId}`)
}

// 发货管理
export const deliveryApi = {
  list: (params: any) => get('/api/sales/delivery/list', params),
  detail: (id: number) => get(`/api/sales/delivery/${id}`),
  create: (data: any) => post('/api/sales/delivery', data),
  update: (data: any) => put('/api/sales/delivery', data),
  remove: (id: number) => del(`/api/sales/delivery/${id}`)
}

// 回款管理
export const receiptApi = {
  list: (params: any) => get('/api/sales/receipt/list', params),
  detail: (id: number) => get(`/api/sales/receipt/${id}`),
  create: (data: any) => post('/api/sales/receipt', data),
  update: (data: any) => put('/api/sales/receipt', data),
  remove: (id: number) => del(`/api/sales/receipt/${id}`),
  overdue: () => get('/api/sales/receipt/overdue'),
  stats: () => get('/api/sales/receipt/stats')
}

// 销售提成
export const commissionApi = {
  list: (params: any) => get('/api/sales/commission/list', params),
  calculate: (orderId: number) => post(`/api/sales/commission/calculate/${orderId}`),
  statistics: (period?: string) => get('/api/sales/commission/statistics', { period })
}
