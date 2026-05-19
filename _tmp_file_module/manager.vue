<template>
  <div class="file-manager">
    <!-- Left Panel: Folder Tree -->
    <div class="file-manager__sidebar">
      <div class="sidebar-header">
        <span class="sidebar-title">{{ $t('file.folders') }}</span>
        <el-button type="primary" link @click="handleCreateFolder(0)">
          <el-icon><Plus /></el-icon>
        </el-button>
      </div>
      <el-tree
        ref="treeRef"
        :data="folderTree"
        node-key="id"
        :props="{ label: 'label', children: 'children' }"
        highlight-current
        default-expand-all
        @node-click="handleFolderClick"
        @node-contextmenu="handleFolderContextMenu"
      >
        <template #default="{ data }">
          <span class="tree-node">
            <el-icon><Folder /></el-icon>
            <span>{{ data.label }}</span>
          </span>
        </template>
      </el-tree>
    </div>

    <!-- Right Panel: File Content -->
    <div class="file-manager__content">
      <!-- Toolbar -->
      <div class="content-toolbar">
        <div class="toolbar-left">
          <el-breadcrumb separator="/">
            <el-breadcrumb-item @click="handleFolderClick({ id: null })">
              {{ $t('file.allFiles') }}
            </el-breadcrumb-item>
            <el-breadcrumb-item v-if="currentFolder">
              {{ currentFolder.label }}
            </el-breadcrumb-item>
          </el-breadcrumb>
        </div>
        <div class="toolbar-right">
          <el-input
            v-model="searchKeyword"
            :placeholder="$t('file.searchFile')"
            prefix-icon="Search"
            clearable
            style="width: 200px"
            @keyup.enter="handleSearch"
            @clear="loadFiles"
          />
          <el-button-group>
            <el-button :type="viewMode === 'list' ? 'primary' : ''" @click="viewMode = 'list'">
              <el-icon><List /></el-icon>
            </el-button>
            <el-button :type="viewMode === 'grid' ? 'primary' : ''" @click="viewMode = 'grid'">
              <el-icon><Grid /></el-icon>
            </el-button>
          </el-button-group>
          <el-button type="primary" @click="handleUpload">
            <el-icon><Upload /></el-icon>
            {{ $t('file.upload') }}
          </el-button>
          <el-button @click="handleCreateFolder(currentFolderId)">
            <el-icon><FolderAdd /></el-icon>
            {{ $t('file.newFolder') }}
          </el-button>
        </div>
      </div>

      <!-- File List View -->
      <div v-if="viewMode === 'list'" class="file-list">
        <el-table :data="fileList" style="width: 100%" @row-contextmenu="handleFileContextMenu">
          <el-table-column prop="name" :label="$t('file.fileName')" min-width="250">
            <template #default="{ row }">
              <div class="file-name-cell">
                <el-icon :size="20" :color="getFileIconColor(row.fileType)">
                  <component :is="getFileIcon(row.fileType)" />
                </el-icon>
                <span>{{ row.name }}</span>
              </div>
            </template>
          </el-table-column>
          <el-table-column prop="fileSize" :label="$t('file.fileSize')" width="120">
            <template #default="{ row }">{{ formatFileSize(row.fileSize) }}</template>
          </el-table-column>
          <el-table-column prop="fileType" :label="$t('file.fileType')" width="100" />
          <el-table-column prop="updateTime" :label="$t('file.modifiedTime')" width="180" />
          <el-table-column :label="$t('common.edit')" width="200" fixed="right">
            <template #default="{ row }">
              <el-button link type="primary" @click="handleDownload(row)">{{ $t('file.download') }}</el-button>
              <el-button link type="primary" @click="handlePreview(row)">{{ $t('file.preview') }}</el-button>
              <el-dropdown trigger="click">
                <el-button link type="primary">{{ $t('common.more') }}</el-button>
                <template #dropdown>
                  <el-dropdown-menu>
                    <el-dropdown-item @click="handleRenameFile(row)">{{ $t('file.rename') }}</el-dropdown-item>
                    <el-dropdown-item @click="handleMoveFile(row)">{{ $t('file.move') }}</el-dropdown-item>
                    <el-dropdown-item @click="handleVersionHistory(row)">{{ $t('file.versionHistory') }}</el-dropdown-item>
                    <el-dropdown-item divided @click="handleDeleteFile(row)">
                      <span style="color: #f56c6c">{{ $t('common.delete') }}</span>
                    </el-dropdown-item>
                  </el-dropdown-menu>
                </template>
              </el-dropdown>
            </template>
          </el-table-column>
        </el-table>
        <el-pagination
          v-model:current-page="pagination.pageNum"
          v-model:page-size="pagination.pageSize"
          :total="pagination.total"
          :page-sizes="[10, 20, 50]"
          layout="total, sizes, prev, pager, next"
          @change="loadFiles"
          style="margin-top: 16px; justify-content: flex-end"
        />
      </div>

      <!-- File Grid View -->
      <div v-else class="file-grid">
        <div
          v-for="file in fileList"
          :key="file.id"
          class="file-card"
          @dblclick="handlePreview(file)"
          @contextmenu.prevent="handleFileContextMenu($event, file)"
        >
          <div class="file-card__icon">
            <el-icon :size="48" :color="getFileIconColor(file.fileType)">
              <component :is="getFileIcon(file.fileType)" />
            </el-icon>
          </div>
          <div class="file-card__name" :title="file.name">{{ file.name }}</div>
          <div class="file-card__info">{{ formatFileSize(file.fileSize) }}</div>
        </div>
        <el-empty v-if="fileList.length === 0" :description="$t('common.noData')" />
      </div>
    </div>

    <!-- Upload Dialog -->
    <el-dialog v-model="uploadVisible" :title="$t('file.uploadFile')" width="500px">
      <el-upload
        ref="uploadRef"
        drag
        multiple
        :auto-upload="false"
        :file-list="uploadFileList"
        :on-change="handleUploadChange"
      >
        <el-icon class="el-icon--upload"><Upload /></el-icon>
        <div class="el-upload__text">{{ $t('file.dragUpload') }}</div>
      </el-upload>
      <template #footer>
        <el-button @click="uploadVisible = false">{{ $t('common.cancel') }}</el-button>
        <el-button type="primary" :loading="uploading" @click="submitUpload">{{ $t('file.upload') }}</el-button>
      </template>
    </el-dialog>

    <!-- Version History Dialog -->
    <el-dialog v-model="versionVisible" :title="$t('file.versionHistory')" width="700px">
      <el-table :data="versionList">
        <el-table-column prop="version" :label="$t('file.version')" width="80">
          <template #default="{ row }">v{{ row.version }}</template>
        </el-table-column>
        <el-table-column prop="fileSize" :label="$t('file.fileSize')" width="100">
          <template #default="{ row }">{{ formatFileSize(row.fileSize) }}</template>
        </el-table-column>
        <el-table-column prop="changeLog" :label="$t('file.changeLog')" />
        <el-table-column prop="createTime" :label="$t('file.uploadTime')" width="180" />
      </el-table>
      <template #footer>
        <el-button @click="handleUploadNewVersion">{{ $t('file.uploadNewVersion') }}</el-button>
      </template>
    </el-dialog>

    <!-- Preview Dialog -->
    <el-dialog v-model="previewVisible" :title="previewFile?.name" width="80%" top="5vh">
      <div class="file-preview">
        <img v-if="isImage(previewFile?.mimeType)" :src="previewUrl" style="max-width: 100%; max-height: 70vh" />
        <iframe v-else-if="isPdf(previewFile?.mimeType)" :src="previewUrl" style="width: 100%; height: 70vh; border: none" />
        <div v-else class="preview-info">
          <el-icon :size="64" color="#909399"><Document /></el-icon>
          <p>{{ previewFile?.name }}</p>
          <p>{{ $t('file.fileType') }}: {{ previewFile?.fileType }}</p>
          <p>{{ $t('file.fileSize') }}: {{ formatFileSize(previewFile?.fileSize) }}</p>
          <el-button type="primary" @click="handleDownload(previewFile)">{{ $t('file.download') }}</el-button>
        </div>
      </div>
    </el-dialog>

    <!-- Folder Context Menu -->
    <div
      v-show="folderMenuVisible"
      class="context-menu"
      :style="{ left: menuPosition.x + 'px', top: menuPosition.y + 'px' }"
    >
      <div class="context-menu-item" @click="handleCreateFolder(contextFolder?.id)">{{ $t('file.newFolder') }}</div>
      <div class="context-menu-item" @click="handleRenameFolderCtx">{{ $t('file.rename') }}</div>
      <div class="context-menu-item danger" @click="handleDeleteFolderCtx">{{ $t('common.delete') }}</div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, onBeforeUnmount } from 'vue'
import { useI18n } from 'vue-i18n'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Folder, Plus, Upload, List, Grid, Document, FolderAdd } from '@element-plus/icons-vue'
import { fileFolderApi, fileInfoApi } from '@/api/file'

const { t } = useI18n()

// State
const folderTree = ref<any[]>([])
const fileList = ref<any[]>([])
const currentFolder = ref<any>(null)
const currentFolderId = ref<number | null>(null)
const searchKeyword = ref('')
const viewMode = ref<'list' | 'grid'>('list')
const treeRef = ref()

// Pagination
const pagination = reactive({ pageNum: 1, pageSize: 20, total: 0 })

// Upload
const uploadVisible = ref(false)
const uploadRef = ref()
const uploadFileList = ref<any[]>([])
const uploading = ref(false)

// Version history
const versionVisible = ref(false)
const versionList = ref<any[]>([])
const currentVersionFile = ref<any>(null)

// Preview
const previewVisible = ref(false)
const previewFile = ref<any>(null)
const previewUrl = ref('')

// Context menu
const folderMenuVisible = ref(false)
const contextFolder = ref<any>(null)
const menuPosition = reactive({ x: 0, y: 0 })

onMounted(() => {
  loadFolderTree()
  loadFiles()
  document.addEventListener('click', closeContextMenu)
})

onBeforeUnmount(() => {
  document.removeEventListener('click', closeContextMenu)
})

function closeContextMenu() {
  folderMenuVisible.value = false
}

async function loadFolderTree() {
  try {
    const res: any = await fileFolderApi.tree()
    folderTree.value = res.data || []
  } catch (e) { /* ignore */ }
}

async function loadFiles() {
  try {
    const res: any = await fileInfoApi.list({
      pageNum: pagination.pageNum,
      pageSize: pagination.pageSize,
      folderId: currentFolderId.value || undefined,
      keyword: searchKeyword.value || undefined
    })
    fileList.value = res.data?.records || []
    pagination.total = res.data?.total || 0
  } catch (e) { /* ignore */ }
}

function handleSearch() {
  pagination.pageNum = 1
  loadFiles()
}

function handleFolderClick(data: any) {
  currentFolder.value = data.id ? data : null
  currentFolderId.value = data.id || null
  pagination.pageNum = 1
  loadFiles()
}

function handleFolderContextMenu(event: MouseEvent, data: any) {
  event.preventDefault()
  contextFolder.value = data
  menuPosition.x = event.clientX
  menuPosition.y = event.clientY
  folderMenuVisible.value = true
}

function handleFileContextMenu(event: MouseEvent, row: any) {
  event.preventDefault()
}

async function handleCreateFolder(parentId: number | null) {
  const { value } = await ElMessageBox.prompt(t('file.enterFolderName'), t('file.newFolder'), {
    confirmButtonText: t('common.confirm'),
    cancelButtonText: t('common.cancel')
  })
  if (value) {
    await fileFolderApi.create({ name: value, parentId: parentId || 0 })
    ElMessage.success(t('common.success'))
    loadFolderTree()
  }
}

async function handleRenameFolderCtx() {
  folderMenuVisible.value = false
  if (!contextFolder.value) return
  const { value } = await ElMessageBox.prompt(t('file.enterFolderName'), t('file.rename'), {
    confirmButtonText: t('common.confirm'),
    cancelButtonText: t('common.cancel'),
    inputValue: contextFolder.value.label
  })
  if (value) {
    await fileFolderApi.rename({ id: contextFolder.value.id, name: value })
    ElMessage.success(t('common.success'))
    loadFolderTree()
  }
}

async function handleDeleteFolderCtx() {
  folderMenuVisible.value = false
  if (!contextFolder.value) return
  await ElMessageBox.confirm(t('file.confirmDeleteFolder'), t('common.confirm'))
  await fileFolderApi.remove(contextFolder.value.id)
  ElMessage.success(t('common.success'))
  loadFolderTree()
}

// File operations
function handleUpload() {
  uploadFileList.value = []
  uploadVisible.value = true
}

function handleUploadChange(file: any) {
  uploadFileList.value.push(file)
}

async function submitUpload() {
  if (uploadFileList.value.length === 0) return
  uploading.value = true
  try {
    for (const item of uploadFileList.value) {
      await fileInfoApi.upload(item.raw, currentFolderId.value || undefined)
    }
    ElMessage.success(t('common.success'))
    uploadVisible.value = false
    loadFiles()
  } finally {
    uploading.value = false
  }
}

function handleDownload(row: any) {
  window.open(`${import.meta.env.VITE_API_BASE_URL}/api/file/info/download/${row.id}`, '_blank')
}

async function handlePreview(row: any) {
  try {
    const res: any = await fileInfoApi.preview(row.id)
    previewFile.value = res.data
    previewUrl.value = `${import.meta.env.VITE_API_BASE_URL}${res.data.previewUrl}`
    previewVisible.value = true
  } catch (e) { /* ignore */ }
}

async function handleRenameFile(row: any) {
  const { value } = await ElMessageBox.prompt(t('file.enterFileName'), t('file.rename'), {
    confirmButtonText: t('common.confirm'),
    cancelButtonText: t('common.cancel'),
    inputValue: row.name
  })
  if (value) {
    await fileInfoApi.rename(row.id, value)
    ElMessage.success(t('common.success'))
    loadFiles()
  }
}

async function handleMoveFile(row: any) {
  // Simple move - prompt for folder ID
  const { value } = await ElMessageBox.prompt(t('file.enterTargetFolder'), t('file.move'), {
    confirmButtonText: t('common.confirm'),
    cancelButtonText: t('common.cancel')
  })
  if (value) {
    await fileInfoApi.move(row.id, Number(value))
    ElMessage.success(t('common.success'))
    loadFiles()
  }
}

async function handleDeleteFile(row: any) {
  await ElMessageBox.confirm(t('file.confirmDeleteFile'), t('common.confirm'))
  await fileInfoApi.remove(row.id)
  ElMessage.success(t('common.success'))
  loadFiles()
}

async function handleVersionHistory(row: any) {
  currentVersionFile.value = row
  const res: any = await fileInfoApi.versions(row.id)
  versionList.value = res.data || []
  versionVisible.value = true
}

function handleUploadNewVersion() {
  const input = document.createElement('input')
  input.type = 'file'
  input.onchange = async (e: any) => {
    const file = e.target.files[0]
    if (!file) return
    const changeLog = prompt(t('file.enterChangeLog')) || ''
    await fileInfoApi.uploadVersion(currentVersionFile.value.id, file, changeLog)
    ElMessage.success(t('common.success'))
    handleVersionHistory(currentVersionFile.value)
    loadFiles()
  }
  input.click()
}

// Utility functions
function formatFileSize(bytes: number | undefined): string {
  if (!bytes) return '0 B'
  const units = ['B', 'KB', 'MB', 'GB', 'TB']
  let i = 0
  let size = bytes
  while (size >= 1024 && i < units.length - 1) {
    size /= 1024
    i++
  }
  return size.toFixed(i > 0 ? 1 : 0) + ' ' + units[i]
}

function getFileIcon(fileType: string) {
  const iconMap: Record<string, string> = {
    pdf: 'Document', doc: 'Document', docx: 'Document',
    xls: 'Document', xlsx: 'Document',
    ppt: 'Document', pptx: 'Document',
    jpg: 'Picture', jpeg: 'Picture', png: 'Picture', gif: 'Picture', svg: 'Picture',
    zip: 'Files', rar: 'Files', '7z': 'Files',
    mp4: 'VideoCamera', avi: 'VideoCamera', mov: 'VideoCamera',
    mp3: 'Headset', wav: 'Headset'
  }
  return iconMap[fileType?.toLowerCase()] || 'Document'
}

function getFileIconColor(fileType: string): string {
  const colorMap: Record<string, string> = {
    pdf: '#f56c6c', doc: '#409eff', docx: '#409eff',
    xls: '#67c23a', xlsx: '#67c23a',
    ppt: '#e6a23c', pptx: '#e6a23c',
    jpg: '#F26522', jpeg: '#F26522', png: '#F26522', gif: '#F26522',
    zip: '#909399', rar: '#909399'
  }
  return colorMap[fileType?.toLowerCase()] || '#909399'
}

function isImage(mimeType: string | undefined): boolean {
  return !!mimeType?.startsWith('image/')
}

function isPdf(mimeType: string | undefined): boolean {
  return mimeType === 'application/pdf'
}
</script>

<style scoped>
.file-manager {
  display: flex;
  height: calc(100vh - 120px);
  background: var(--el-bg-color);
  border-radius: 8px;
  overflow: hidden;
}

.file-manager__sidebar {
  width: 260px;
  border-right: 1px solid var(--el-border-color-lighter);
  padding: 16px;
  overflow-y: auto;
}

.sidebar-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.sidebar-title {
  font-weight: 600;
  font-size: 15px;
}

.tree-node {
  display: flex;
  align-items: center;
  gap: 6px;
}

.file-manager__content {
  flex: 1;
  display: flex;
  flex-direction: column;
  padding: 16px;
  overflow: hidden;
}

.content-toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
  flex-wrap: wrap;
  gap: 8px;
}

.toolbar-right {
  display: flex;
  align-items: center;
  gap: 8px;
}

.file-list {
  flex: 1;
  overflow-y: auto;
}

.file-name-cell {
  display: flex;
  align-items: center;
  gap: 8px;
}

.file-grid {
  flex: 1;
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
  gap: 16px;
  align-content: start;
  overflow-y: auto;
}

.file-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 16px 8px;
  border-radius: 8px;
  cursor: pointer;
  transition: background 0.2s;
}

.file-card:hover {
  background: var(--el-fill-color-light);
}

.file-card__icon {
  margin-bottom: 8px;
}

.file-card__name {
  font-size: 13px;
  text-align: center;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  width: 100%;
}

.file-card__info {
  font-size: 12px;
  color: var(--el-text-color-secondary);
  margin-top: 4px;
}

.file-preview {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 300px;
}

.preview-info {
  text-align: center;
}

.context-menu {
  position: fixed;
  z-index: 9999;
  background: var(--el-bg-color);
  border: 1px solid var(--el-border-color);
  border-radius: 4px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
  padding: 4px 0;
}

.context-menu-item {
  padding: 8px 16px;
  cursor: pointer;
  font-size: 14px;
}

.context-menu-item:hover {
  background: var(--el-fill-color-light);
}

.context-menu-item.danger {
  color: #f56c6c;
}
</style>
