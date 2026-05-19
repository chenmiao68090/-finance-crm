$path = 'd:\zhehang-erp\zhehang-erp-ui\src\directives\permission.ts'
$enc  = [System.Text.UTF8Encoding]::new($false)
$content = [System.IO.File]::ReadAllText($path, $enc)

$old1 = @'
throw new Error(-hasPermi requires permission value, e.g. v-hasPermi="['system:user:add']")
'@

$new1 = @'
throw new Error('v-hasPermi requires permission value, e.g. v-hasPermi="[\'system:user:add\']"')
'@

$old2 = @'
throw new Error(-hasRole requires role value, e.g. v-hasRole="['admin']")
'@

$new2 = @'
throw new Error('v-hasRole requires role value, e.g. v-hasRole="[\'admin\']"')
'@

$content = $content.Replace($old1.Trim(), $new1.Trim())
$content = $content.Replace($old2.Trim(), $new2.Trim())
[System.IO.File]::WriteAllText($path, $content, $enc)
Write-Host "Task 1 Done: directives/permission.ts fixed"
