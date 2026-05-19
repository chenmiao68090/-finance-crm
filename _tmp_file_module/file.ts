import { get, post, put, del } from './request'
import service from './request'

// File Folder API
export const fileFolderApi = {
  tree: () => get('/api/file/folder/tree'),
  create: (data: { name: string; parentId?: number }) => post('/api/file/folder', data),
  rename: (data: { id: number; name: string }) => put('/api/file/folder', data),
  remove: (id: number) => del(`/api/file/folder/${id}`),
  move: (id: number, targetParentId: number) => put('/api/file/folder/move', null, { params: { id, targetParentId } })
}

// File Info API
export const fileInfoApi = {
  list: (params: { pageNum?: number; pageSize?: number; folderId?: number; keyword?: string }) =>
    get('/api/file/info/list', params),
  upload: (file: File, folderId?: number) => {
    const formData = new FormData()
    formData.append('file', file)
    if (folderId) {
      formData.append('folderId', String(folderId))
    }
    return service.post('/api/file/info/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    })
  },
  download: (id: number) => get(`/api/file/info/download/${id}`, null, { responseType: 'blob' }),
  preview: (id: number) => get(`/api/file/info/preview/${id}`),
  remove: (id: number) => del(`/api/file/info/${id}`),
  move: (id: number, targetFolderId: number) => put('/api/file/info/move', null, { params: { id, targetFolderId } }),
  rename: (id: number, newName: string) => put(`/api/file/info/rename/${id}`, null, { params: { newName } }),
  versions: (id: number) => get(`/api/file/info/versions/${id}`),
  uploadVersion: (id: number, file: File, changeLog?: string) => {
    const formData = new FormData()
    formData.append('file', file)
    if (changeLog) {
      formData.append('changeLog', changeLog)
    }
    return service.post(`/api/file/info/upload-version/${id}`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    })
  },
  recycle: (params: { pageNum?: number; pageSize?: number }) => get('/api/file/info/recycle', params),
  restore: (id: number) => put(`/api/file/info/restore/${id}`),
  permanentDelete: (id: number) => del(`/api/file/info/permanent/${id}`),
  search: (params: { pageNum?: number; pageSize?: number; keyword?: string }) => get('/api/file/info/search', params)
}

// Knowledge Base Category API
export const kbCategoryApi = {
  tree: () => get('/api/kb/category/tree'),
  create: (data: { name: string; parentId?: number; icon?: string; sort?: number }) => post('/api/kb/category', data),
  update: (data: { id: number; name: string; icon?: string; sort?: number }) => put('/api/kb/category', data),
  remove: (id: number) => del(`/api/kb/category/${id}`)
}

// Knowledge Base Article API
export const kbArticleApi = {
  list: (params: { pageNum?: number; pageSize?: number; categoryId?: number; keyword?: string }) =>
    get('/api/kb/article/list', params),
  detail: (id: number) => get(`/api/kb/article/${id}`),
  create: (data: any) => post('/api/kb/article', data),
  update: (data: any) => put('/api/kb/article', data),
  remove: (id: number) => del(`/api/kb/article/${id}`),
  publish: (id: number) => put(`/api/kb/article/publish/${id}`),
  archive: (id: number) => put(`/api/kb/article/archive/${id}`),
  recent: (params: { pageNum?: number; pageSize?: number }) => get('/api/kb/article/recent', params),
  hot: (params: { pageNum?: number; pageSize?: number }) => get('/api/kb/article/hot', params),
  like: (id: number) => post(`/api/kb/article/like/${id}`)
}
