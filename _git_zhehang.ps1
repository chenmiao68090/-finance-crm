$ErrorActionPreference = "Continue"
$env:PATH = "C:\Users\Administrator\AppData\Roaming\Qoder\SharedClientCache\cli\bin\git\cmd;" + $env:PATH

Set-Location d:\zhehang-erp

Write-Host "===== git --version ====="
git --version

Write-Host "===== git rev-parse check ====="
$inside = git rev-parse --is-inside-work-tree 2>$null
Write-Host "inside-work-tree: $inside"

if ($inside -ne "true") {
    Write-Host "===== git init ====="
    git init
}

Write-Host "===== configure user ====="
git config user.name "陈苗"
git config user.email "chenmiao@example.com"
Write-Host ("user.name : " + (git config --get user.name))
Write-Host ("user.email: " + (git config --get user.email))

Write-Host "===== git status (short) ====="
git status -s | Select-Object -First 30

Write-Host "===== git add . ====="
git add . 2>&1 | Select-Object -Last 20

Write-Host "===== git commit ====="
git commit -m "feat: 浙杭企服ERP完整项目 - 含呼叫中心i18n国际化" 2>&1 | Select-Object -Last 30

Write-Host "===== git branch -M main ====="
git branch -M main

Write-Host "===== check remote ====="
$remote = git remote 2>$null
Write-Host "existing remotes: $remote"
if ($remote -notcontains "origin") {
    Write-Host "===== add remote ====="
    git remote add origin https://github.com/chenmiao68090/zhehang-erp.git
} else {
    Write-Host "===== set remote url ====="
    git remote set-url origin https://github.com/chenmiao68090/zhehang-erp.git
}
git remote -v

Write-Host "===== git push -u origin main ====="
git push -u origin main 2>&1
Write-Host "PUSH_EXIT_CODE: $LASTEXITCODE"
