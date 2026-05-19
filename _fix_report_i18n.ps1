# Fix zh-CN.ts - replace the old simple report section with comprehensive one
$zhFile = "d:\zhehang-erp\zhehang-erp-ui\src\locales\zh-CN.ts"
$lines = Get-Content $zhFile -Encoding UTF8

# Find the old report section (around line 920) and remove it
$output = @()
$skipMode = $false
$braceCount = 0
$oldReportDone = $false

for ($i = 0; $i -lt $lines.Count; $i++) {
    $line = $lines[$i]
    
    # Detect the FIRST top-level report: { (the old simple one)
    if (-not $oldReportDone -and $line -match '^\s{2}report:\s*\{' -and -not $line.StartsWith('    ')) {
        $skipMode = $true
        $braceCount = 1
        $oldReportDone = $true
        continue
    }
    
    if ($skipMode) {
        # Count braces
        foreach ($char in $line.ToCharArray()) {
            if ($char -eq '{') { $braceCount++ }
            elseif ($char -eq '}') { $braceCount-- }
        }
        if ($braceCount -le 0) {
            $skipMode = $false
            # Check if line ends with comma, if so skip it too
        }
        continue
    }
    
    $output += $line
}

Set-Content $zhFile -Value ($output -join "`n") -Encoding UTF8 -NoNewline
Write-Output "zh-CN fixed: removed old report section"

# Fix en-US.ts - remove the old simple report section (the first one at ~920)
$enFile = "d:\zhehang-erp\zhehang-erp-ui\src\locales\en-US.ts"
$lines = Get-Content $enFile -Encoding UTF8

$output = @()
$skipMode = $false
$braceCount = 0
$oldReportDone = $false

for ($i = 0; $i -lt $lines.Count; $i++) {
    $line = $lines[$i]
    
    if (-not $oldReportDone -and $line -match '^\s{2}report:\s*\{' -and -not $line.StartsWith('    ')) {
        $skipMode = $true
        $braceCount = 1
        $oldReportDone = $true
        continue
    }
    
    if ($skipMode) {
        foreach ($char in $line.ToCharArray()) {
            if ($char -eq '{') { $braceCount++ }
            elseif ($char -eq '}') { $braceCount-- }
        }
        if ($braceCount -le 0) {
            $skipMode = $false
        }
        continue
    }
    
    $output += $line
}

Set-Content $enFile -Value ($output -join "`n") -Encoding UTF8 -NoNewline
Write-Output "en-US fixed: removed old report section"
