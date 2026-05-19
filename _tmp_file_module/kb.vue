<template>
  <div class="kb-page">
    <!-- Left: Category Tree -->
    <div class="kb-sidebar">
      <div class="sidebar-header">
        <span class="sidebar-title">{{ $t('kb.categories') }}</span>
        <el-button type="primary" link @click="handleCreateCategory">
          <el-icon><Plus /></el-icon>
        </el-button>
      </div>
      <el-tree
        :data="categoryTree"
        node-key="id"
        :props="{ label: 'label', children: 'children' }"
        highlight-current
        default-expand-all
        @node-click="handleCategoryClick"
      >
        <template #default="{ data }">
          <span class="tree-node">
            <el-icon><Folder /></el-icon>
            <span>{{ data.label }}</span>
          </span>
        </template>
      </el-tree>
    </div>

    <!-- Right: Article List -->
    <div class="kb-content">
      <!-- Search & Actions -->
      <div class="kb-toolbar">
        <el-input
          v-model="searchKeyword"
          :placeholder="$t('kb.searchArticle')"
          prefix-icon="Search"
          clearable
          style="width: 300px"
          @keyup.enter="handleSearch"
          @clear="loadArticles"
        />
        <el-button type="primary" @click="handleNewArticle">
          <el-icon><Plus /></el-icon>
          {{ $t('kb.newArticle') }}
        </el-button>
      </div>

      <!-- Tabs -->
      <el-tabs v-model="activeTab" @tab-change="handleTabChange">
        <el-tab-pane :label="$t('kb.latest')" name="latest" />
        <el-tab-pane :label="$t('kb.hot')" name="hot" />
      </el-tabs>

      <!-- Article Cards -->
      <div class="article-list">
        <div v-for="article in articleList" :key="article.id" class="article-card" @click="viewArticle(article)">
          <div class="article-card__header">
            <h3 class="article-title">{{ article.title }}</h3>
            <el-tag v-if="article.status === 0" type="info" size="small">{{ $t('kb.draft') }}</el-tag>
            <el-tag v-else-if="article.status === 1" type="success" size="small">{{ $t('kb.published') }}</el-tag>
            <el-tag v-else-if="article.status === 2" type="warning" size="small">{{ $t('kb.archived') }}</el-tag>
          </div>
          <p class="article-summary">{{ getArticleSummary(article.content) }}</p>
          <div class="article-card__footer">
            <div class="article-meta">
              <span v-if="article.tags" class="article-tags">
                <el-tag v-for="tag in article.tags.split(',')" :key="tag" size="small" type="info">{{ tag }}</el-tag>
              </span>
            </div>
            <div class="article-stats">
              <span><el-icon><View /></el-icon> {{ article.viewCount || 0 }}</span>
              <span><el-icon><Star /></el-icon> {{ article.likeCount || 0 }}</span>
              <span class="article-time">{{ article.createTime }}</span>
            </div>
          </div>
        </div>
        <el-empty v-if="articleList.length === 0" :description="$t('common.noData')" />
      </div>

      <!-- Pagination -->
      <el-pagination
        v-model:current-page="pagination.pageNum"
        v-model:page-size="pagination.pageSize"
        :total="pagination.total"
        :page-sizes="[10, 20, 50]"
        layout="total, sizes, prev, pager, next"
        @change="loadArticles"
        style="margin-top: 16px; justify-content: flex-end"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus, Folder, View, Star } from '@element-plus/icons-vue'
import { kbCategoryApi, kbArticleApi } from '@/api/file'

const { t } = useI18n()
const router = useRouter()

const categoryTree = ref<any[]>([])
const articleList = ref<any[]>([])
const searchKeyword = ref('')
const activeTab = ref('latest')
const currentCategoryId = ref<number | null>(null)

const pagination = reactive({ pageNum: 1, pageSize: 10, total: 0 })

onMounted(() => {
  loadCategoryTree()
  loadArticles()
})

async function loadCategoryTree() {
  try {
    const res: any = await kbCategoryApi.tree()
    categoryTree.value = res.data || []
  } catch (e) { /* ignore */ }
}

async function loadArticles() {
  try {
    let res: any
    if (activeTab.value === 'hot') {
      res = await kbArticleApi.hot({ pageNum: pagination.pageNum, pageSize: pagination.pageSize })
    } else if (searchKeyword.value || currentCategoryId.value) {
      res = await kbArticleApi.list({
        pageNum: pagination.pageNum,
        pageSize: pagination.pageSize,
        categoryId: currentCategoryId.value || undefined,
        keyword: searchKeyword.value || undefined
      })
    } else {
      res = await kbArticleApi.recent({ pageNum: pagination.pageNum, pageSize: pagination.pageSize })
    }
    articleList.value = res.data?.records || []
    pagination.total = res.data?.total || 0
  } catch (e) { /* ignore */ }
}

function handleSearch() {
  pagination.pageNum = 1
  loadArticles()
}

function handleTabChange() {
  pagination.pageNum = 1
  loadArticles()
}

function handleCategoryClick(data: any) {
  currentCategoryId.value = data.id
  pagination.pageNum = 1
  loadArticles()
}

async function handleCreateCategory() {
  const { value } = await ElMessageBox.prompt(t('kb.enterCategoryName'), t('kb.newCategory'), {
    confirmButtonText: t('common.confirm'),
    cancelButtonText: t('common.cancel')
  })
  if (value) {
    await kbCategoryApi.create({ name: value, parentId: 0 })
    ElMessage.success(t('common.success'))
    loadCategoryTree()
  }
}

function handleNewArticle() {
  router.push('/file/article')
}

function viewArticle(article: any) {
  router.push(`/file/article?id=${article.id}`)
}

function getArticleSummary(content: string): string {
  if (!content) return ''
  // Strip markdown and get first 150 chars
  const plain = content.replace(/[#*`>\[\]()!-]/g, '').replace(/\n/g, ' ')
  return plain.length > 150 ? plain.substring(0, 150) + '...' : plain
}
</script>

<style scoped>
.kb-page {
  display: flex;
  height: calc(100vh - 120px);
  background: var(--el-bg-color);
  border-radius: 8px;
  overflow: hidden;
}

.kb-sidebar {
  width: 240px;
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

.kb-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  padding: 16px 24px;
  overflow: hidden;
}

.kb-toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.article-list {
  flex: 1;
  overflow-y: auto;
}

.article-card {
  padding: 16px 20px;
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 8px;
  margin-bottom: 12px;
  cursor: pointer;
  transition: all 0.2s;
}

.article-card:hover {
  border-color: #F26522;
  box-shadow: 0 2px 8px rgba(242, 101, 34, 0.1);
}

.article-card__header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
}

.article-title {
  font-size: 16px;
  font-weight: 600;
  margin: 0;
  flex: 1;
}

.article-summary {
  font-size: 14px;
  color: var(--el-text-color-secondary);
  margin: 0 0 12px 0;
  line-height: 1.6;
}

.article-card__footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.article-tags {
  display: flex;
  gap: 4px;
}

.article-stats {
  display: flex;
  align-items: center;
  gap: 12px;
  font-size: 13px;
  color: var(--el-text-color-secondary);
}

.article-stats span {
  display: flex;
  align-items: center;
  gap: 3px;
}

.article-time {
  font-size: 12px;
}
</style>
