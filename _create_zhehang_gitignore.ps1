$content = @"
node_modules/
dist/
.env
.env.*
*.log
.DS_Store
Thumbs.db
.idea/
.vscode/
*.local
"@
Set-Content -Path 'd:\zhehang-erp\.gitignore' -Value $content -Encoding UTF8
Write-Host "Created .gitignore"
Get-Content 'd:\zhehang-erp\.gitignore'
