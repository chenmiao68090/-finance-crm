import { get, post, put, del } from './request'

// 部门管理
export const deptApi = {
  tree: () => get('/api/org/dept/tree'),
  detail: (id: number) => get(`/api/org/dept/${id}`),
  create: (data: any) => post('/api/org/dept', data),
  update: (data: any) => put('/api/org/dept', data),
  remove: (id: number) => del(`/api/org/dept/${id}`)
}

// 岗位管理
export const postApi = {
  list: (params: any) => get('/api/org/post/list', params),
  all: () => get('/api/org/post/all'),
  detail: (id: number) => get(`/api/org/post/${id}`),
  create: (data: any) => post('/api/org/post', data),
  update: (data: any) => put('/api/org/post', data),
  remove: (id: number) => del(`/api/org/post/${id}`)
}

// 员工管理
export const employeeApi = {
  list: (params: any) => get('/api/org/employee/list', params),
  detail: (id: number) => get(`/api/org/employee/${id}`),
  create: (data: any) => post('/api/org/employee', data),
  update: (data: any) => put('/api/org/employee', data),
  remove: (id: number) => del(`/api/org/employee/${id}`)
}

// 异动管理
export const transferApi = {
  list: (params: any) => get('/api/org/transfer/list', params),
  create: (data: any) => post('/api/org/transfer', data),
  approve: (data: any) => put('/api/org/transfer/approve', data)
}

// 组织架构
export const structureApi = {
  tree: () => get('/api/org/structure/tree')
}
