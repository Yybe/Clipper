# Clipper - schedule skill-edit clips (posts/skill-edit/) into local Postiz from a JSON manifest.
#
# SAFETY: dry-run unless -Post is passed. With -Post it uploads each video and creates a
# SCHEDULED post (never posts immediately) for the YouTube integration named in the manifest.
#
# Manifest format (array of objects):
#   { "file":"2026-..._name.mp4", "date":"2026-09-20T10:00:00", "tzOffsetHours":8,
#     "title":"...", "caption":"...", "integrationId":"cm..." }
#
# Usage:
#   schedule-skill-edit.ps1                          # dry-run: validate manifest, list dates
#   schedule-skill-edit.ps1 -Post                    # upload + schedule everything in manifest
#   schedule-skill-edit.ps1 -Post -OnlyIndex 3       # single entry
# Keep this file ASCII-only - PowerShell 5.1 misparses BOM-less UTF-8 punctuation.
param(
  [string]$Manifest = "",
  [switch]$Post,
  [int]$OnlyIndex = -1
)
$ErrorActionPreference = "Stop"
$root = Split-Path -Parent $PSScriptRoot
if (-not $Manifest) { $Manifest = Join-Path $root "posts\skill-edit\schedule-manifest.json" }
if (-not (Test-Path $Manifest)) { Write-Host "missing manifest: $Manifest"; exit 1 }

$pzKey = $null; $pzBase = ""
foreach ($line in Get-Content (Join-Path $root ".env")) {
  if ($line -match '^\s*POSTIZ_API_KEY\s*=\s*(.+?)\s*$')  { $pzKey = $Matches[1] }
  if ($line -match '^\s*POSTIZ_BASE_URL\s*=\s*(.+?)\s*$') { $pzBase = $Matches[1].TrimEnd('/') }
}
if (-not $pzBase) { $pzBase = "http://localhost:4007" }
$pzApi = "$pzBase/api/public/v1"

# PS 5.1 wraps a JSON array in a single Object[] item - enumerate it explicitly.
$entries = @((Get-Content $Manifest -Raw | ConvertFrom-Json) | ForEach-Object { $_ })
$dir = Split-Path -Parent $Manifest

# Postiz public API compares the raw Authorization header to the org apiKey - no "Bearer " prefix.
try {
  $int = @((Invoke-WebRequest -Uri "$pzApi/integrations" -Headers @{ Authorization = "$pzKey" } -UseBasicParsing -TimeoutSec 10).Content | ConvertFrom-Json)
} catch {
  Write-Host "Postiz unreachable / key rejected: $($_.Exception.Message)"; exit 1
}
Write-Host "Connected channels:"
foreach ($c in $int) { Write-Host ("  - {0} [{1}] id={2}" -f $c.name, $c.identifier, $c.id) }
Write-Host ""

for ($i = 0; $i -lt $entries.Count; $i++) {
  $e = $entries[$i]
  if ($OnlyIndex -ge 0 -and $OnlyIndex -ne $i) { continue }
  $path = Join-Path $dir $e.file
  if (-not (Test-Path $path)) { Write-Host "[$i] MISSING FILE $path"; exit 1 }
  # manifest dates are wall-clock local times; ToUniversalTime() applies the machine offset
  $utc = [DateTime]::Parse($e.date).ToUniversalTime()
  Write-Host ("[{0}] {1} -> {2} UTC  ({3})" -f $i, $e.file, $utc.ToString("yyyy-MM-dd HH:mm"), $e.title)
  if (-not $Post) { continue }

  $upRaw = & curl.exe -sS --max-time 900 -X POST "$pzApi/upload" -H "Authorization: $pzKey" -F "file=@$path"
  if ($LASTEXITCODE -ne 0) { Write-Host "upload failed: $upRaw"; exit 1 }
  $media = $upRaw | ConvertFrom-Json
  if (-not $media.id) { Write-Host "upload response had no id: $upRaw"; exit 1 }

  $tags = @([regex]::Matches($e.caption, "#\w+") | ForEach-Object { $_.Value.TrimStart('#').ToLower() } | Select-Object -Unique | Select-Object -First 10)
  $settings = @{
    __type = "youtube"; title = $e.title; type = "public"; selfDeclaredMadeForKids = "no"
    tags = @($tags | ForEach-Object { @{ value = $_; label = $_ } })
  }
  $posts = @(@{
    integration = @{ id = "$($e.integrationId)" }
    value       = @(@{ content = $e.caption; image = @(@{ id = "$($media.id)"; path = "$($media.path)" }) })
    settings    = $settings
  })
  $payload = @{
    type = "schedule"; date = $utc.ToString("yyyy-MM-ddTHH:mm:ss.000Z")
    shortLink = $false; tags = @(); posts = $posts
  }
  try {
    $r = Invoke-RestMethod -Uri "$pzApi/posts" -Method Post -Headers @{ Authorization = "$pzKey" } -Body ($payload | ConvertTo-Json -Depth 10) -ContentType "application/json"
    Write-Host ("   scheduled id={0}" -f ($r | ConvertTo-Json -Depth 4 -Compress))
  } catch {
    Write-Host "   Postiz rejected post: $($_.ErrorDetails.Message)"; exit 1
  }
}
if (-not $Post) { Write-Host ""; Write-Host "DRY-RUN. Add -Post to upload + schedule." }
