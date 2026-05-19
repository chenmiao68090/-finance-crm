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

# MySQL/Redis/ES data volumes
data/
*.sock
*.pid

# Java build outputs
target/
*.class
*.jar

# Misc
*.tmp
*.swp
"@
Set-Content -Path 'd:\zhehang-erp\.gitignore' -Value $content -Encoding UTF8
Get-Content 'd:\zhehang-erp\.gitignore'
