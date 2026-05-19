$file = 'd:\zhehang-erp\zhehang-erp-ui\src\views\system\user.vue'
$content = Get-Content $file -Raw -Encoding UTF8

# 1. Remove all v-hasPermi directives
$content = $content -replace ' v-hasPermi="\[''system:user:add''\]"', ''
$content = $content -replace ' v-hasPermi="\[''system:user:remove''\]"', ''
$content = $content -replace ' v-hasPermi="\[''system:user:export''\]"', ''
$content = $content -replace ' v-hasPermi="\[''system:user:edit''\]"', ''
$content = $content -replace ' v-hasPermi="\[''system:user:resetPwd''\]"', ''

# 2. Change post dropdown to use roleList
$content = $content -replace 'placeholder="请选择岗位"', 'placeholder="请选择岗位角色"'
$content = $content -replace 'v-for="p in postList" :key="p.id" :label="p.postName" :value="p.id"', 'v-for="r in roleList" :key="r.id" :label="r.roleName" :value="r.id"'

# 3. Remove import { postApi } from '@/api/org'
$content = $content -replace "import \{ postApi \} from '@/api/org'\r?\n", ''

# 4. Remove postList ref declaration
$content = $content -replace "const postList = ref<any\[\]>\(\[\]\)\r?\n", ''

# 5. Remove postApi.all() try-catch blocks in handleAdd and handleEdit
# Pattern: "  // 加载岗位列表\n  try {\n    const postRes: any = await postApi.all()\n    postList.value = postRes.data || postRes || []\n  } catch (e) { console.warn('加载岗位列表失败', e) }\n"
$postBlock = "  // 加载岗位列表`r`n  try {`r`n    const postRes: any = await postApi.all()`r`n    postList.value = postRes.data || postRes || []`r`n  } catch (e) { console.warn('加载岗位列表失败', e) }`r`n"
$content = $content.Replace($postBlock, '')

# Also try with LF only line endings
$postBlockLF = "  // 加载岗位列表`n  try {`n    const postRes: any = await postApi.all()`n    postList.value = postRes.data || postRes || []`n  } catch (e) { console.warn('加载岗位列表失败', e) }`n"
$content = $content.Replace($postBlockLF, '')

[System.IO.File]::WriteAllText($file, $content, [System.Text.UTF8Encoding]::new($false))
Write-Host "Done! File updated successfully."
