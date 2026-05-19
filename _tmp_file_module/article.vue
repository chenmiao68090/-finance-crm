<template>
  <div class="article-page">
    <!-- View Mode -->
    <div v-if="mode === 'view'" class="article-view">
      <div class="article-view__header">
        <el-button @click="goBack" type="default">
          <el-icon><ArrowLeft /></el-icon>
          {{ $t('common.back') }}
        </el-button>
        <el-button type="primary" @click="switchToEdit">{{ $t('common.edit') }}</el-button>
      </div>
      <div class="article-view__content">
        <h1 class="article-view__title">{{ article.title }}</h1>
        <div class="article-view__meta">
          <span>{{ article.createTime }}</span>
          <span><el-icon><View /></el-icon> {{ article.viewCount || 0 }}</span>
          <span><el-icon><Star /></el-icon> {{ article.likeCount || 0 }}</span>
          <el-tag v-if="article.status === 0" type="info" size="small">{{ $t('kb.draft') }}</el-tag>
          <el-tag v-else-if="article.status === 1" type="success" size="small">{{ $t('kb.published') }}</el-tag>
          <el-tag v-else-if="article.status === 2" type="warning" size="small">{{ $t('kb.archived') }}</el-tag>
        </div>
        <div v-if="article.tags" class="article-view__tags">
          <el-tag v-for="tag in article.tags.split(',')" :key="tag" size="small">{{ tag }}</el-tag>
        </div>
        <div class="article-view__body markdown-body" v-html="renderedContent"></div>
        <div class="article-view__actions">
          <el-button @click="handleLike" :type="liked ? 'primary' : 'default'" round>
            <el-icon><Star /></el-icon>
            {{ $t('kb.like') }} ({{ article.likeCount || 0 }})
          </el-button>
        </div>
      </div>
    </div>

    <!-- Edit Mode -->
    <div v-else class="article-edit">
      <div class="article-edit__header">
        <el-button @click="goBack">
          <el-icon><ArrowLeft /></el-icon>
          {{ $t('common.back') }}
        </el-button>
        <div class="header-actions">
          <el-button @click="handleSaveDraft" :loading="saving">{{ $t('kb.saveDraft') }}</el-button>
          <el-button type="primary" @click="handlePublish" :loading="saving">{{ $t('kb.publish') }}</el-button>
        </div>
      </div>
      <div class="article-edit__form">
        <el-input
          v-model="form.title"
          :placeholder="$t('kb.enterTitle')"
          class="title-input"
        />
        <div class="form-row">
          <el-tree-select
            v-model="form.categoryId"
            :data="categoryTree"
            :props="{ label: 'label', children: 'children', value: 'id' }"
            :placeholder="$t('kb.selectCategory')"
            clearable
            style="width: 200px"
          />
          <div class="tag-input-wrapper">
            <el-tag
              v-for="tag in tagList"
              :key="tag"
              closable
              @close="removeTag(tag)"
              style="margin-right: 4px"
            >{{ tag }}</el-tag>
            <el-input
              v-if="tagInputVisible"
              ref="tagInputRef"
              v-model="tagInputValue"
              size="small"
              style="width: 100px"
              @keyup.enter="confirmTag"
              @blur="confirmTag"
            />
            <el-button v-else size="small" @click="showTagInput">+ {{ $t('kb.addTag') }}</el-button>
          </div>
        </div>
        <!-- Editor -->
        <div class="editor-container">
          <div class="editor-tabs">
            <el-radio-group v-model="editorMode" size="small">
              <el-radio-button value="write">{{ $t('kb.write') }}</el-radio-button>
              <el-radio-button value="preview">{{ $t('kb.preview') }}</el-radio-button>
            </el-radio-group>
          </div>
          <div v-show="editorMode === 'write'" class="editor-write">
            <el-input
              v-model="form.content"
              type="textarea"
              :rows="20"
              :placeholder="$t('kb.enterContent')"
              resize="none"
            />
          </div>
          <div v-show="editorMode === 'preview'" class="editor-preview markdown-body" v-html="previewContent"></div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, nextTick } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { ElMessage } from 'element-plus'
import { ArrowLeft, View, Star } from '@element-plus/icons-vue'
import { kbArticleApi, kbCategoryApi } from '@/api/file'

const { t } = useI18n()
const route = useRoute()
const router = useRouter()

const mode = ref<'view' | 'edit'>('edit')
const article = ref<any>({})
const form = ref<any>({ title: '', content: '', categoryId: null, tags: '', contentType: 'markdown' })
const categoryTree = ref<any[]>([])
const saving = ref(false)
const liked = ref(false)

// Tags
const tagList = ref<string[]>([])
const tagInputVisible = ref(false)
const tagInputValue = ref('')
const tagInputRef = ref()

// Editor
const editorMode = ref<'write' | 'preview'>('write')

onMounted(async () => {
  await loadCategoryTree()
  const id = route.query.id as string
  const isEdit = route.query.edit === 'true'
  if (id) {
    await loadArticle(Number(id))
    mode.value = isEdit ? 'edit' : 'view'
  } else {
    mode.value = 'edit'
  }
})

async function loadCategoryTree() {
  try {
    const res: any = await kbCategoryApi.tree()
    categoryTree.value = res.data || []
  } catch (e) { /* ignore */ }
}

async function loadArticle(id: number) {
  try {
    const res: any = await kbArticleApi.detail(id)
    article.value = res.data || {}
    form.value = {
      id: article.value.id,
      title: article.value.title || '',
      content: article.value.content || '',
      categoryId: article.value.categoryId,
      tags: article.value.tags || '',
      contentType: article.value.contentType || 'markdown',
      status: article.value.status
    }
    tagList.value = article.value.tags ? article.value.tags.split(',').filter(Boolean) : []
  } catch (e) { /* ignore */ }
}

const renderedContent = computed(() => {
  return renderMarkdown(article.value.content || '')
})

const previewContent = computed(() => {
  return renderMarkdown(form.value.content || '')
})

function renderMarkdown(text: string): string {
  // Simple markdown rendering
  let html = text
    .replace(/^### (.+)$/gm, '<h3>$1</h3>')
    .replace(/^## (.+)$/gm, '<h2>$1</h2>')
    .replace(/^# (.+)$/gm, '<h1>$1</h1>')
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    .replace(/`(.+?)`/g, '<code>$1</code>')
    .replace(/^\- (.+)$/gm, '<li>$1</li>')
    .replace(/^\d+\. (.+)$/gm, '<li>$1</li>')
    .replace(/\n\n/g, '</p><p>')
    .replace(/\n/g, '<br>')
  return '<p>' + html + '</p>'
}

function goBack() {
  router.push('/file/kb')
}

function switchToEdit() {
  form.value = {
    id: article.value.id,
    title: article.value.title || '',
    content: article.value.content || '',
    categoryId: article.value.categoryId,
    tags: article.value.tags || '',
    contentType: article.value.contentType || 'markdown',
    status: article.value.status
  }
  tagList.value = article.value.tags ? article.value.tags.split(',').filter(Boolean) : []
  mode.value = 'edit'
}

async function handleSaveDraft() {
  if (!form.value.title) {
    ElMessage.warning(t('kb.titleRequired'))
    return
  }
  saving.value = true
  try {
    form.value.tags = tagList.value.join(',')
    form.value.status = 0
    if (form.value.id) {
      await kbArticleApi.update(form.value)
    } else {
      await kbArticleApi.create(form.value)
    }
    ElMessage.success(t('common.success'))
  } finally {
    saving.value = false
  }
}

async function handlePublish() {
  if (!form.value.title) {
    ElMessage.warning(t('kb.titleRequired'))
    return
  }
  saving.value = true
  try {
    form.value.tags = tagList.value.join(',')
    form.value.status = 1
    if (form.value.id) {
      await kbArticleApi.update(form.value)
      await kbArticleApi.publish(form.value.id)
    } else {
      const res: any = await kbArticleApi.create(form.value)
      // If the API returns the created ID, publish it
    }
    ElMessage.success(t('common.success'))
    router.push('/file/kb')
  } finally {
    saving.value = false
  }
}

async function handleLike() {
  if (article.value.id) {
    await kbArticleApi.like(article.value.id)
    article.value.likeCount = (article.value.likeCount || 0) + 1
    liked.value = true
  }
}

// Tag management
function removeTag(tag: string) {
  tagList.value = tagList.value.filter(t => t !== tag)
}

function showTagInput() {
  tagInputVisible.value = true
  nextTick(() => {
    tagInputRef.value?.focus()
  })
}

function confirmTag() {
  if (tagInputValue.value && !tagList.value.includes(tagInputValue.value)) {
    tagList.value.push(tagInputValue.value)
  }
  tagInputVisible.value = false
  tagInputValue.value = ''
}
</script>

<style scoped>
.article-page {
  height: calc(100vh - 120px);
  background: var(--el-bg-color);
  border-radius: 8px;
  overflow-y: auto;
}

.article-view,
.article-edit {
  max-width: 900px;
  margin: 0 auto;
  padding: 24px;
}

.article-view__header,
.article-edit__header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
}

.header-actions {
  display: flex;
  gap: 8px;
}

.article-view__title {
  font-size: 28px;
  font-weight: 700;
  margin: 0 0 16px 0;
}

.article-view__meta {
  display: flex;
  align-items: center;
  gap: 16px;
  font-size: 14px;
  color: var(--el-text-color-secondary);
  margin-bottom: 12px;
}

.article-view__meta span {
  display: flex;
  align-items: center;
  gap: 4px;
}

.article-view__tags {
  display: flex;
  gap: 6px;
  margin-bottom: 24px;
}

.article-view__body {
  line-height: 1.8;
  font-size: 15px;
  min-height: 300px;
  padding: 20px 0;
  border-top: 1px solid var(--el-border-color-lighter);
}

.article-view__actions {
  padding-top: 24px;
  border-top: 1px solid var(--el-border-color-lighter);
  text-align: center;
}

.article-edit__form {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.title-input :deep(.el-input__inner) {
  font-size: 22px;
  font-weight: 600;
  border: none;
  border-bottom: 2px solid var(--el-border-color);
  border-radius: 0;
  padding: 12px 0;
}

.form-row {
  display: flex;
  align-items: center;
  gap: 16px;
}

.tag-input-wrapper {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 4px;
}

.editor-container {
  border: 1px solid var(--el-border-color);
  border-radius: 8px;
  overflow: hidden;
}

.editor-tabs {
  padding: 8px 12px;
  background: var(--el-fill-color-lighter);
  border-bottom: 1px solid var(--el-border-color-lighter);
}

.editor-write :deep(.el-textarea__inner) {
  border: none;
  border-radius: 0;
  font-family: 'Courier New', monospace;
  font-size: 14px;
  line-height: 1.6;
  padding: 16px;
  min-height: 400px;
}

.editor-preview {
  padding: 16px;
  min-height: 400px;
  line-height: 1.8;
  font-size: 15px;
}

.markdown-body h1 { font-size: 24px; margin: 16px 0 8px; }
.markdown-body h2 { font-size: 20px; margin: 14px 0 6px; }
.markdown-body h3 { font-size: 17px; margin: 12px 0 6px; }
.markdown-body code { background: var(--el-fill-color); padding: 2px 6px; border-radius: 3px; font-size: 13px; }
.markdown-body li { margin: 4px 0; }
</style>
