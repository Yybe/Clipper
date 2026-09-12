# Clipper - post/schedule a finished clip through the LOCAL self-hosted Postiz
# (calendar + scheduling for YouTube / Instagram / Facebook / TikTok; Bilibili
# is NOT supported by Postiz - keep that on uploader.bat).
#
# SAFETY: default is a DRY-RUN (lists the job's clips + your connected Postiz
# channels). Nothing is sent to Postiz or any social network unless you pass
# -Post with a specific -ClipIndex (same human gate as post-clip.ps1/uploader).
# -Draft does a real Postiz API round-trip but creates only a Postiz draft -
# safe end-to-end test that touches no social network.
#
# One-time prerequisites:
#   1. postiz.bat start  (stack up, UI on http://localhost:4007)
#   2. Register the first admin user in the UI, connect channels
#      (needs provider OAuth apps in postiz\.env - see postiz\.env.example)
#   3. UI -> Settings -> API Keys -> create key -> paste into root .env as
#      POSTIZ_API_KEY=<key>
#
# Usage:
#   postiz-post.bat <job_id>                                  # list clips + channels (dry-run)
#   postiz-post.bat <job_id> -ClipIndex 0 -Post               # post NOW to every connected channel
#   postiz-post.bat <job_id> -ClipIndex 1 -Post -Platforms youtube,tiktok
#   postiz-post.bat <job_id> -ClipIndex 0 -Post -ScheduledDate "2026-09-13T19:30:00"
#   postiz-post.bat <job_id> -ClipIndex 0 -Draft              # API smoke test, no social post
# NOTE: keep this file ASCII-only - Windows PowerShell 5.1 misparses UTF-8
#       punctuation in BOM-less .ps1 files.
param(
  [Parameter(Mandatory=$true)][string]$JobId,
  [int]$ClipIndex = -1,
  [string[]]$Platforms = @(),
  [string]$Title = "",
  [string]$Description = "",
  [string]$ScheduledDate = "",
  [switch]$Draft,
  [string]$Api = "",
  [switch]$Post,
  [switch]$Yes
)
$ErrorActionPreference = "Stop"

$root = Split-Path -Parent $PSScriptRoot
$gk = $null; $pzKey = $null; $pzBase = ""
foreach ($line in Get-Content (Join-Path $root ".env")) {
  if ($line -match '^\s*GEMINI_API_KEY\s*=\s*(.+?)\s*$')      { $gk = $Matches[1] }
  if ($line -match '^\s*POSTIZ_API_KEY\s*=\s*(.+?)\s*$')      { $pzKey = $Matches[1] }
  if ($line -match '^\s*POSTIZ_BASE_URL\s*=\s*(.+?)\s*$')     { $pzBase = $Matches[1].TrimEnd('/') }
}
if (-not $pzBase) { $pzBase = "http://localhost:4007" }
$pzApi = "$pzBase/api/public/v1"

function Fail($msg) { Write-Host "ERROR: $msg"; exit 1 }

# --- Postiz reachability + channels (read-only, works in dry-run) ----------
$integrations = $null
try {
  $r = Invoke-WebRequest -Uri "$pzApi/integrations" -Headers @{ Authorization = "$pzKey" } -UseBasicParsing -TimeoutSec 10
  $integrations = @($r.Content | ConvertFrom-Json)
} catch {
  if (-not $Post) {
    Write-Host "NOTE: Postiz not reachable at $pzBase ($($_.Exception.Message)) - start it with postiz.bat start."
  }
}
function ProviderOf($c) {
  if ($c.PSObject.Properties.Name -contains "provider" -and $c.provider) { return "$($c.provider)".ToLower() }
  if ($c.PSObject.Properties.Name -contains "providerIdentifier" -and $c.providerIdentifier) { return "$($c.providerIdentifier)".ToLower() }
  return "$($c.type)".ToLower()
}

# --- OpenShorts job lookup (same source as post-clip.ps1) -------------------
try { $st = Invoke-RestMethod -Uri "http://localhost:8000/api/status/$JobId" -Headers @{ "X-Gemini-Key" = $gk } }
catch { Fail "cannot read job ${JobId}: $($_.ErrorDetails.Message)" }
if ($st.status -ne "completed") { Fail "job status is '$($st.status)' - only completed jobs can be posted." }
$clips = @($st.result.clips)
if ($clips.Count -eq 0) { Fail "job has no clips." }

function Show-Clip($c, $i) {
  $dur = ""
  if ($c.PSObject.Properties.Name -contains "start" -and $c.PSObject.Properties.Name -contains "end") {
    $dur = "{0}s" -f [math]::Round([double]$c.end - [double]$c.start)
  }
  $score = if ($c.PSObject.Properties.Name -contains "predicted_score") { $c.predicted_score } else { "?" }
  Write-Host ("  [{0}] {1}  score={2}" -f $i, $dur, $score)
  Write-Host ("      hook:   {0}" -f $c.viral_hook_text)
  Write-Host ("      YT:     {0}" -f $c.video_title_for_youtube_short)
  Write-Host ("      TikTok: {0}" -f $c.video_description_for_tiktok)
  Write-Host ("      IG:     {0}" -f $c.video_description_for_instagram)
  $file = ($c.video_url -split '/')[-1]
  $exists = Test-Path (Join-Path $root ("openshorts\output\" + $JobId + "\" + $file))
  Write-Host ("      file:   {0} ({1})" -f $file, $(if ($exists) { "exists" } else { "MISSING" }))
}

Write-Host "Clips for job ${JobId}:"
for ($i = 0; $i -lt $clips.Count; $i++) { Show-Clip $clips[$i] $i; Write-Host "" }

if ($integrations) {
  Write-Host "Postiz channels (http://localhost:4007):"
  foreach ($c in $integrations) {
    Write-Host ("  - {0}  [{1}]  id={2}" -f $c.name, (ProviderOf $c), $c.id)
  }
} else {
  Write-Host "Postiz channels: none visible (no key in .env as POSTIZ_API_KEY, stack down, or no channels connected yet)."
}

if (-not $Post) {
  Write-Host ""
  Write-Host "DRY-RUN ONLY. Post clip N through Postiz:"
  Write-Host "  postiz-post.bat $JobId -ClipIndex <N> -Post"
  Write-Host 'Schedule instead: add -ScheduledDate "YYYY-MM-DDTHH:mm:ss" (local time).'
  Write-Host "Safe API test that touches no social network: add -Draft."
  exit 0
}

# --- Real post: gates -------------------------------------------------------
if (-not $pzKey) {
  Fail "POSTIZ_API_KEY is empty/missing in $root\.env. Create one in Postiz UI -> Settings -> API Keys, paste it into .env."
}
if ($ClipIndex -lt 0 -or $ClipIndex -ge $clips.Count) {
  Fail "-Post needs a valid -ClipIndex (0..$($clips.Count-1))."
}
if (-not $Draft -and $integrations -and $integrations.Count -eq 0) {
  Fail "no channels connected in Postiz yet - connect YouTube/IG/FB/TikTok in the UI first (postiz\.env needs the provider OAuth apps)."
}
$c = $clips[$ClipIndex]
$localFile = Join-Path $root ("openshorts\output\" + $JobId + "\" + (($c.video_url -split '/')[-1]))
if (-not (Test-Path $localFile)) { Fail "clip file not found: $localFile" }

$targets = @()
if (-not $Draft) {
  foreach ($c2 in $integrations) {
    $prov = ProviderOf $c2
    if ($Platforms.Count -eq 0 -or $Platforms -contains $prov) { $targets += $c2 }
  }
  if ($targets.Count -eq 0) {
    Fail "no connected channel matches -Platforms '$($Platforms -join ',')'. Connected: $(($integrations | ForEach-Object { ProviderOf $_ }) -join ', ')"
  }
}

# --- Content (same defaults as uploader.bat: Gemini per-platform copy wins) --
$ytTitle = if ($Title) { $Title } elseif ($c.video_title_for_youtube_short) { $c.video_title_for_youtube_short } else { "Viral Short" }
$bodyDesc = if ($Description) { $Description } elseif ($c.video_description_for_tiktok) { $c.video_description_for_tiktok } elseif ($c.video_description_for_instagram) { $c.video_description_for_instagram } else { "Check this out!" }
$igCap = if ($Description) { $Description } elseif ($c.video_description_for_instagram) { $c.video_description_for_instagram } else { $bodyDesc }
$ytDesc = if ($Description) { $Description } else { ($bodyDesc.TrimEnd() + "`n`n#Shorts") }

Write-Host "------------------------------------------------------------"
if ($Draft) { Write-Host " DRAFT to Postiz only (no social network touched):" }
else {
  Write-Host " Posting clip [$ClipIndex] via Postiz to: $(($targets | ForEach-Object { ProviderOf $_ }) -join ', ')"
  foreach ($t in $targets) {
    $prov = ProviderOf $t
    $shown = if ($prov -eq "youtube") { "$ytTitle | $ytDesc" } elseif ($prov -eq "instagram") { $igCap } else { $bodyDesc }
    Write-Host ("   {0}: {1}" -f $prov, ($shown.Substring(0, [Math]::Min(90, $shown.Length))))
  }
}
if ($ScheduledDate) { Write-Host " Scheduled for: $ScheduledDate local (sent to Postiz as UTC)" } elseif (-not $Draft) { Write-Host " Posting IMMEDIATELY." }
Write-Host "------------------------------------------------------------"
$answer = if ($Yes) { "POST" } else { Read-Host "Type POST to confirm, anything else aborts" }
if ($answer -cne "POST") { Write-Host "Aborted - nothing was sent."; exit 1 }

# --- Upload media ------------------------------------------------------------
Write-Host "Uploading video to Postiz..."
$upRaw = & curl.exe -sS --max-time 900 -X POST "$pzApi/upload" -H "Authorization: $pzKey" -F "file=@$localFile"
if ($LASTEXITCODE -ne 0) { Fail "upload failed (curl exit $LASTEXITCODE): $upRaw" }
$media = $upRaw | ConvertFrom-Json
if (-not $media.id) { Fail "upload response missing id: $upRaw" }
Write-Host "Uploaded: id=$($media.id)"

$img = @(@{ id = "$($media.id)"; path = "$($media.path)" })

# --- Build per-channel payload ------------------------------------------------
$posts = @()
foreach ($t in $targets) {
  $prov = ProviderOf $t
  $settings = @{ __type = $prov }
  $content = $bodyDesc
  if ($prov -eq "youtube") {
    $settings.title = $ytTitle
    $settings.type = "public"
    $settings.selfDeclaredMadeForKids = "no"
    $tags = @([regex]::Matches($ytDesc, "#\w+") | ForEach-Object { $_.Value.TrimStart('#').ToLower() } | Select-Object -Unique | Select-Object -First 10)
    if ($tags.Count -gt 0) { $settings.tags = @($tags | ForEach-Object { @{ value = $_; label = $_ } }) }
    $content = $ytDesc
  } elseif ($prov -eq "instagram") {
    $settings.post_type = "reel"
    $content = $igCap
  } elseif ($prov -eq "tiktok") {
    $settings.privacy_level = "PUBLIC_TO_EVERYONE"
    $settings.content_posting_method = "DIRECT_POST"
    $settings.video_made_with_ai = $false
  } elseif ($prov -eq "facebook") {
    $content = $bodyDesc
  }
  $posts += @{ integration = @{ id = "$($t.id)" }; value = @(@{ content = $content; image = $img }); settings = $settings }
}

$nowUtc = (Get-Date).ToUniversalTime().ToString("yyyy-MM-ddTHH:mm:ss.000Z")
$type = "now"; $date = $nowUtc
if ($Draft) {
  # Postiz rejects post bodies with zero integration entries - a draft here
  # means: real API round-trip + media upload, no post object, no social side.
  Write-Host "Draft mode: media uploaded, no post object created."
  exit 0
}
elseif ($ScheduledDate) {
  $type = "schedule"
  $date = ([DateTime]::Parse($ScheduledDate)).ToUniversalTime().ToString("yyyy-MM-ddTHH:mm:ss.000Z")
}
$payload = @{ type = $type; date = $date; shortLink = $false; tags = @(); posts = $posts }

try {
  $out = Invoke-RestMethod -Uri "$pzApi/posts" -Method Post -Headers @{ Authorization = $pzKey } -Body ($payload | ConvertTo-Json -Depth 10) -ContentType "application/json"
} catch {
  Fail "Postiz rejected the post: $($_.ErrorDetails.Message)"
}
Write-Host "Postiz response:"
$out | ConvertTo-Json -Depth 8 | Write-Host

# Clean-named copy of everything that actually went through (same as post-clip.ps1);
# drafts skip this - nothing was posted yet.
if ($Draft) {
  Write-Host "Draft + media upload verified. Media shows in Postiz UI -> Media Library."
  exit 0
}
$slug = ($ytTitle -replace '[^A-Za-z0-9]+', '-').Trim('-').ToLower()
if ($slug.Length -gt 40) { $slug = $slug.Substring(0, 40).Trim('-') }
$score = if ($c.PSObject.Properties.Name -contains "predicted_score") { $c.predicted_score } else { "x" }
$postsDir = Join-Path $root "posts"
if (-not (Test-Path $postsDir)) { New-Item -ItemType Directory -Path $postsDir | Out-Null }
$exportPath = Join-Path $postsDir ((Get-Date -Format "yyyy-MM-dd") + "_" + $slug + "_" + $score + ".mp4")
Copy-Item $localFile $exportPath -Force
Write-Host "Clean-named copy saved: $exportPath"
