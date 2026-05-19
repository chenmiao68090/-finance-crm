$uiBase = "d:\zhehang-erp\zhehang-erp-ui\src\views\finance"
$utf8NoBom = New-Object System.Text.UTF8Encoding($false)

# Read the current voucher.vue and fix the garbled Chinese
$content = [System.IO.File]::ReadAllText("$uiBase\voucher.vue", [System.Text.Encoding]::GetEncoding("GB2312"))
# Write it properly as UTF-8 without BOM
[System.IO.File]::WriteAllText("$uiBase\voucher.vue", $content, $utf8NoBom)
Write-Host "voucher.vue re-encoded!"

$content = [System.IO.File]::ReadAllText("$uiBase\ledger.vue", [System.Text.Encoding]::GetEncoding("GB2312"))
[System.IO.File]::WriteAllText("$uiBase\ledger.vue", $content, $utf8NoBom)
Write-Host "ledger.vue re-encoded!"

$content = [System.IO.File]::ReadAllText("$uiBase\report.vue", [System.Text.Encoding]::GetEncoding("GB2312"))
[System.IO.File]::WriteAllText("$uiBase\report.vue", $content, $utf8NoBom)
Write-Host "report.vue re-encoded!"

$content = [System.IO.File]::ReadAllText("$uiBase\tax.vue", [System.Text.Encoding]::GetEncoding("GB2312"))
[System.IO.File]::WriteAllText("$uiBase\tax.vue", $content, $utf8NoBom)
Write-Host "tax.vue re-encoded!"

$content = [System.IO.File]::ReadAllText("$uiBase\invoice.vue", [System.Text.Encoding]::GetEncoding("GB2312"))
[System.IO.File]::WriteAllText("$uiBase\invoice.vue", $content, $utf8NoBom)
Write-Host "invoice.vue re-encoded!"

$content = [System.IO.File]::ReadAllText("$uiBase\reimburse.vue", [System.Text.Encoding]::GetEncoding("GB2312"))
[System.IO.File]::WriteAllText("$uiBase\reimburse.vue", $content, $utf8NoBom)
Write-Host "reimburse.vue re-encoded!"
