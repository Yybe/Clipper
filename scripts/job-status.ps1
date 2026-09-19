param([string]$JobId)
$key = $null
foreach ($line in Get-Content "$PSScriptRoot\..\.env") {
  if ($line -match '^\s*GEMINI_API_KEY\s*=\s*(.+?)\s*$') { $key = $Matches[1] }
}
$s = Invoke-RestMethod -Uri "http://localhost:8000/api/status/$JobId" -Headers @{ "X-Gemini-Key" = $key }
Write-Host "STATUS: $($s.status)"
$s.logs | Select-Object -Last 10 | ForEach-Object { Write-Host (($_ -replace '[^\x20-\x7E]','')) }
if ($s.status -eq 'completed') {
  $s.result.clips | ForEach-Object { Write-Host ("CLIP: {0}s score={1} hook={2} file={3}" -f [math]::Round($_.end - $_.start), $_.predicted_score, $_.viral_hook_text, $_.video_url) }
}
