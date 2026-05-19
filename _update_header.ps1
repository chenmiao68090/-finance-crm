$utf8 = New-Object System.Text.UTF8Encoding $false

$content = @"
<template>
  <header class="header">
    <div class="header-left">
      <el-icon class="collapse-btn" @click="appStore.toggleSidebar">
        <Fold v-if="!appStore.sidebarCollapsed" />
        <Expand v-else />
      </el-icon>
      <Breadcrumb />
    </div>
    <div class="header-right">
      <el-input
        v-model="searchText"
        :placeholder="`$`t('common.search')"
        prefix-icon="Search"
        class="global-search"
        clearable
      />
      <MessageCenter />
      <el-switch
        v-model="appStore.isDark"
        :active-icon="Moon"
        :inactive-icon="Sunny"
        @change="appStore.toggleDark"
        class="theme-switch"
      />
      <el-dropdown trigger="click">
        <div class="user-info">
          <el-avatar :size="32" src="" />
          <span class="username">{{ userStore.userInfo?.nickname || '管理员' }}</span>
          <el-icon><ArrowDown /></el-icon>
        </div>
        <template #dropdown>
          <el-dropdown-menu>
            <el-dropdown-item>个人中心</el-dropdown-item>
            <el-dropdown-item divided @click="handleLogout">退出登录</el-dropdown-item>
          </el-dropdown-menu>
        </template>
      </el-dropdown>
    </div>
  </header>
</template>

<script setup lang="ts">
import { ref, shallowRef } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { ElMessageBox } from 'element-plus'
import { Fold, Expand, ArrowDown, Moon, Sunny } from '@element-plus/icons-vue'
import { useAppStore } from '@/stores/app'
import { useUserStore } from '@/stores/user'
import Breadcrumb from './Breadcrumb.vue'
import MessageCenter from '@/components/MessageCenter.vue'

const router = useRouter()
const { t } = useI18n()
const appStore = useAppStore()
const userStore = useUserStore()
const searchText = ref('')

async function handleLogout() {
  await ElMessageBox.confirm('确定退出登录吗？', '提示', { type: 'warning' })
  await userStore.logout()
  router.push('/login')
}
</script>

<style lang="scss" scoped>
.header {
  height: 56px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 24px;
  background-color: #fff;
  border-bottom: 1px solid #e2e8f0;
  flex-shrink: 0;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 12px;
}

.collapse-btn {
  font-size: 20px;
  cursor: pointer;
  color: #64748b;

  &:hover {
    color: #F26522;
  }
}

.header-right {
  display: flex;
  align-items: center;
  gap: 16px;
}

.global-search {
  width: 200px;
}

.theme-switch {
  --el-switch-on-color: #1e293b;
}

.user-info {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;

  .username {
    font-size: 14px;
    color: #334155;
  }
}
</style>
"@

[System.IO.File]::WriteAllText("d:\zhehang-erp\zhehang-erp-ui\src\components\layout\Header.vue", $content, $utf8)

Write-Host "Header.vue updated successfully!"
