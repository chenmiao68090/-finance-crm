# This script appends i18n content to the locale files

$zhFile = "d:\zhehang-erp\zhehang-erp-ui\src\locales\zh-CN.ts"
$enFile = "d:\zhehang-erp\zhehang-erp-ui\src\locales\en-US.ts"

# Read zh-CN.ts
$zhContent = Get-Content $zhFile -Raw -Encoding UTF8

# Insert file and kb sections before the last closing brace
$zhInsert = @"
,
  file: {
    folders: '文件夹',
    allFiles: '全部文件',
    searchFile: '搜索文件',
    upload: '上传',
    uploadFile: '上传文件',
    newFolder: '新建文件夹',
    fileName: '文件名',
    fileSize: '文件大小',
    fileType: '文件类型',
    modifiedTime: '修改时间',
    download: '下载',
    preview: '预览',
    rename: '重命名',
    move: '移动',
    versionHistory: '版本历史',
    version: '版本',
    changeLog: '变更说明',
    uploadTime: '上传时间',
    uploadNewVersion: '上传新版本',
    dragUpload: '将文件拖到此处，或点击上传',
    enterFolderName: '请输入文件夹名称',
    enterFileName: '请输入文件名',
    enterTargetFolder: '请输入目标文件夹ID',
    enterChangeLog: '请输入变更说明',
    confirmDeleteFolder: '确定删除此文件夹吗？',
    confirmDeleteFile: '确定删除此文件吗？删除后将移入回收站',
    recycle: '回收站',
    restore: '恢复',
    permanentDelete: '永久删除'
  },
  kb: {
    categories: '知识分类',
    searchArticle: '搜索文章',
    newArticle: '新建文章',
    newCategory: '新建分类',
    enterCategoryName: '请输入分类名称',
    latest: '最新',
    hot: '热门',
    draft: '草稿',
    published: '已发布',
    archived: '已归档',
    like: '点赞',
    saveDraft: '保存草稿',
    publish: '发布',
    enterTitle: '请输入文章标题',
    selectCategory: '选择分类',
    addTag: '添加标签',
    write: '编辑',
    preview: '预览',
    enterContent: '请输入文章内容（支持 Markdown）',
    titleRequired: '请输入文章标题'
  }
"@

$zhContent = $zhContent -replace '\}\s*$', ($zhInsert + "`n}")
Set-Content $zhFile $zhContent -Encoding UTF8 -NoNewline

# Read en-US.ts
$enContent = Get-Content $enFile -Raw -Encoding UTF8

$enInsert = @"
,
  file: {
    folders: 'Folders',
    allFiles: 'All Files',
    searchFile: 'Search files',
    upload: 'Upload',
    uploadFile: 'Upload File',
    newFolder: 'New Folder',
    fileName: 'File Name',
    fileSize: 'Size',
    fileType: 'Type',
    modifiedTime: 'Modified',
    download: 'Download',
    preview: 'Preview',
    rename: 'Rename',
    move: 'Move',
    versionHistory: 'Version History',
    version: 'Version',
    changeLog: 'Change Log',
    uploadTime: 'Upload Time',
    uploadNewVersion: 'Upload New Version',
    dragUpload: 'Drop files here or click to upload',
    enterFolderName: 'Enter folder name',
    enterFileName: 'Enter file name',
    enterTargetFolder: 'Enter target folder ID',
    enterChangeLog: 'Enter change log',
    confirmDeleteFolder: 'Are you sure to delete this folder?',
    confirmDeleteFile: 'Are you sure to delete this file? It will be moved to recycle bin.',
    recycle: 'Recycle Bin',
    restore: 'Restore',
    permanentDelete: 'Permanent Delete'
  },
  kb: {
    categories: 'Categories',
    searchArticle: 'Search articles',
    newArticle: 'New Article',
    newCategory: 'New Category',
    enterCategoryName: 'Enter category name',
    latest: 'Latest',
    hot: 'Hot',
    draft: 'Draft',
    published: 'Published',
    archived: 'Archived',
    like: 'Like',
    saveDraft: 'Save Draft',
    publish: 'Publish',
    enterTitle: 'Enter article title',
    selectCategory: 'Select category',
    addTag: 'Add Tag',
    write: 'Write',
    preview: 'Preview',
    enterContent: 'Enter article content (Markdown supported)',
    titleRequired: 'Please enter article title'
  }
"@

$enContent = $enContent -replace '\}\s*$', ($enInsert + "`n}")
Set-Content $enFile $enContent -Encoding UTF8 -NoNewline

Write-Host "i18n files updated!"
