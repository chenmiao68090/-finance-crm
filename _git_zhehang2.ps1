$ErrorActionPreference = "Continue"
$env:PATH = "C:\Users\Administrator\AppData\Roaming\Qoder\SharedClientCache\cli\bin\git\cmd;" + $env:PATH
$env:GIT_TERMINAL_PROMPT = "0"
$env:GCM_INTERACTIVE = "never"

# Force UTF-8 console
chcp 65001 | Out-Null
[Console]::OutputEncoding = [System.Text.UTF8Encoding]::new($false)
$OutputEncoding = [System.Text.UTF8Encoding]::new($false)

$userName = (Get-Content "d:\$([char]0x9648)$([char]0x82D7)\_user_name.txt" -Encoding UTF8 -Raw).Trim()
$userEmail = "chenmiao@example.com"
$commitMsgFile = "d:\$([char]0x9648)$([char]0x82D7)\_commit_msg_zhehang.txt"

Set-Location d:\zhehang-erp

Write-Host "===== git --version ====="
git --version

Write-Host "===== git rev-parse check ====="
$inside = git rev-parse --is-inside-work-tree 2>$null
Write-Host ("inside-work-tree: " + $inside)

if ($inside -ne "true") {
    Write-Host "===== git init ====="
    git init
}

Write-Host "===== configure user ====="
git config user.name $userName
git config user.email $userEmail
Write-Host ("user.name : " + (git config --get user.name))
Write-Host ("user.email: " + (git config --get user.email))

Write-Host "===== git status (count) ====="
$st = git status --porcelain
Write-Host ("changed files: " + $st.Count)

Write-Host "===== git add . ====="
git add . 2>&1 | Select-Object -Last 10

Write-Host "===== git commit ====="
git commit -F $commitMsgFile 2>&1 | Select-Object -Last 30
Write-Host ("commit exit: " + $LASTEXITCODE)

Write-Host "===== git branch -M main ====="
git branch -M main

Write-Host "===== check remote ====="
$remoteList = git remote
Write-Host ("existing remotes: " + ($remoteList -join ","))
if ($remoteList -notcontains "origin") {
    Write-Host "===== add remote ====="
    git remote add origin https://github.com/chenmiao68090/zhehang-erp.git
} else {
    Write-Host "===== set remote url ====="
    git remote set-url origin https://github.com/chenmiao68090/zhehang-erp.git
}
git remote -v

Write-Host "===== git push -u origin main ====="
git push -u origin main 2>&1
Write-Host ("PUSH_EXIT_CODE: " + $LASTEXITCODE)
