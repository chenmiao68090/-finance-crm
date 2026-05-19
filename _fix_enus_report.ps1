# Remove duplicate simple report block in en-US.ts (the one before multidim)
$path = "d:\zhehang-erp\zhehang-erp-ui\src\locales\zh-CN.ts"  # placeholder
$path = "d:\zhehang-erp\zhehang-erp-ui\src\locales\en-US.ts"
$text = Get-Content -Path $path -Raw -Encoding UTF8

$NL = "`n"  # use LF since file has mixed line endings

# Find both "\n  report: {" occurrences (LF works for both, CRLF doesn't for the 2nd)
$first = $text.IndexOf("$NL  report: {")
if ($first -lt 0) { Write-Host "first report not found"; exit 1 }
$second = $text.IndexOf("$NL  report: {", $first + 1)
if ($second -lt 0) { Write-Host "second report not found - already cleaned?"; exit 0 }

# We want to KEEP the SECOND (comprehensive) and REMOVE the FIRST (simple).
# The first block ends at the next "\n  },\n" before $second.
$startRemove = $first + $NL.Length
$endMarker1 = "$NL  },`r`n"
$endMarker2 = "$NL  },$NL"
$endRel = $text.IndexOf($endMarker1, $startRemove)
$markerLen = $endMarker1.Length
if ($endRel -lt 0 -or $endRel -gt $second) {
    $endRel = $text.IndexOf($endMarker2, $startRemove)
    $markerLen = $endMarker2.Length
}
if ($endRel -lt 0 -or $endRel -gt $second) { Write-Host "first end not found"; exit 1 }
$endRemove = $endRel + $markerLen

$before = $text.Substring(0, $startRemove)
$after = $text.Substring($endRemove)
$result = $before + $after

[System.IO.File]::WriteAllText($path, $result, [System.Text.UTF8Encoding]::new($false))
Write-Host "en-US.ts duplicate report block removed ($($endRemove - $startRemove) chars)"
