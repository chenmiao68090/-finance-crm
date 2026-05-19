$ErrorActionPreference = "Continue"
$env:PATH = "C:\Users\Administrator\AppData\Roaming\Qoder\SharedClientCache\cli\bin\git\cmd;" + $env:PATH
$env:GIT_TERMINAL_PROMPT = "0"
$env:GCM_INTERACTIVE = "never"

chcp 65001 | Out-Null
[Console]::OutputEncoding = [System.Text.UTF8Encoding]::new($false)
$OutputEncoding = [System.Text.UTF8Encoding]::new($false)

$workDir = "d:\$([char]0x9648)$([char]0x82D7)"
$commitMsgFile = Join-Path $workDir "_commit_msg_chenmiao.txt"

Set-Location $workDir

Write-Host "===== git --version ====="
git --version

Write-Host "===== current user config ====="
Write-Host ("user.name : " + (git config --get user.name))
Write-Host ("user.email: " + (git config --get user.email))

Write-Host "===== git status (count) ====="
$st = git status --porcelain
Write-Host ("changed files: " + $st.Count)

Write-Host "===== git add . ====="
git add . 2>&1 | Select-Object -Last 5
Write-Host ("add exit: " + $LASTEXITCODE)

Write-Host "===== git commit ====="
git commit -F $commitMsgFile 2>&1 | Select-Object -Last 30
Write-Host ("commit exit: " + $LASTEXITCODE)

Write-Host "===== git branch -M main ====="
git branch -M main

Write-Host "===== check remote ====="
$remoteList = git remote
Write-Host ("existing remotes: " + ($remoteList -join ","))
git remote -v

if ($remoteList -notcontains "origin") {
    Write-Host "===== add remote ====="
    git remote add origin https://github.com/chenmiao68090/chenmiao.git
} else {
    Write-Host "===== existing origin (will not modify) ====="
    git remote get-url origin
}

Write-Host "===== final remote -v ====="
git remote -v

Write-Host "===== git push -u origin main ====="
git push -u origin main 2>&1
Write-Host ("PUSH_EXIT_CODE: " + $LASTEXITCODE)
