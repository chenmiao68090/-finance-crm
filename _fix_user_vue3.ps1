$file = 'd:\zhehang-erp\zhehang-erp-ui\src\views\system\user.vue'
$lines = [System.IO.File]::ReadAllLines($file, [System.Text.Encoding]::UTF8)
$old = 'placeholder="'
$target = $lines[125]
# Replace the placeholder value between quotes on this line
$lines[125] = $target -replace 'placeholder="[^"]*"', 'placeholder="请选择岗位角色"'
$result = $lines -join "`r`n"
[System.IO.File]::WriteAllText($file, $result, [System.Text.UTF8Encoding]::new($false))
Write-Host "Line 126 is now:"
Write-Host $lines[125]
