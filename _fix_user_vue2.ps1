$file = 'd:\zhehang-erp\zhehang-erp-ui\src\views\system\user.vue'
$lines = [System.IO.File]::ReadAllLines($file, [System.Text.Encoding]::UTF8)

# Fix placeholder on line 126 (0-indexed: 125)
$lines[125] = $lines[125].Replace('placeholder="请选择岗位"', 'placeholder="请选择岗位角色"')

# Remove postApi blocks in handleAdd (lines 274-278, 0-indexed: 273-277)
# Line 274: "  // 加载岗位列表"
# Line 275: "  try {"
# Line 276: "    const postRes: any = await postApi.all()"
# Line 277: "    postList.value = postRes.data || postRes || []"
# Line 278: "  } catch (e) { console.warn('加载岗位列表失败', e) }"

# We need to remove lines 274-278 and 294-298 (1-indexed)
# Convert to list for easier removal
$lineList = [System.Collections.Generic.List[string]]::new($lines)

# Remove second block first (higher index) - lines 294-298 (0-indexed: 293-297)
$lineList.RemoveRange(293, 5)
# Now remove first block - lines 274-278 (0-indexed: 273-277)
$lineList.RemoveRange(273, 5)

$result = $lineList -join "`r`n"
[System.IO.File]::WriteAllText($file, $result, [System.Text.UTF8Encoding]::new($false))
Write-Host "Done! Remaining fixes applied."
