$path = 'd:\zhehang-erp\zhehang-erp-ui\src\stores\permission.ts'
$enc  = [System.Text.UTF8Encoding]::new($false)
$content = [System.IO.File]::ReadAllText($path, $enc)

$old = @'
const modulePath = ../views/+component+.vue
'@

$new = @'
const modulePath = `../views/${component}.vue`
'@

$content = $content.Replace($old.Trim(), $new.Trim())
[System.IO.File]::WriteAllText($path, $content, $enc)
Write-Host "Task 2 Done: stores/permission.ts fixed"
