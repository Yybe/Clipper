param([string]$Path = "/api/public/v1/integrations")
$ErrorActionPreference = "Stop"
$root = Split-Path -Parent $PSScriptRoot
$k = $null
foreach ($line in Get-Content (Join-Path $root ".env")) {
  if ($line -match '^\s*POSTIZ_API_KEY\s*=\s*(.+?)\s*$') { $k = $Matches[1] }
}
if (-not $k) { Write-Host "NO POSTIZ_API_KEY in .env"; exit 1 }
# Postiz public API compares the raw Authorization header to the org apiKey - no "Bearer " prefix.
$h = @{ Authorization = $k }
try {
  $r = Invoke-RestMethod -Uri ("http://localhost:4007" + $Path) -Headers $h
  $r | ConvertTo-Json -Depth 6
} catch {
  Write-Host ("ERR: " + $_.Exception.Message)
  if ($_.ErrorDetails) { Write-Host $_.ErrorDetails.Message }
  exit 1
}
