# Clipper - check the Upload-Post key and connected platform accounts (read-only).
# Shows the profile name to use with post-clip.ps1 -Profile, and which
# platforms are actually connected (TikTok / Instagram / YouTube).
param([string]$Api = "http://localhost:8000")
$ErrorActionPreference = "Stop"
$root = Split-Path -Parent $PSScriptRoot
$upKey = $null
foreach ($line in Get-Content (Join-Path $root ".env")) {
  if ($line -match '^\s*UPLOAD_POST_API_KEY\s*=\s*(.+?)\s*$') { $upKey = $Matches[1] }
}
if (-not $upKey) {
  Write-Host "UPLOAD_POST_API_KEY is empty/missing in $root\.env."
  Write-Host "To enable posting: create an account at https://app.upload-post.com,"
  Write-Host "copy the API key into .env as UPLOAD_POST_API_KEY=<key>, connect your"
  Write-Host "TikTok / Instagram / YouTube accounts in its dashboard, then re-run this."
  exit 1
}
try {
  $out = Invoke-RestMethod -Uri "$Api/api/social/user" -Headers @{ "X-Upload-Post-Key" = $upKey }
} catch {
  Write-Host "Upload-Post rejected the key or the API is down:"
  Write-Host $_.ErrorDetails.Message
  exit 1
}
$out | ConvertTo-Json -Depth 8 | Write-Host
