# Clipper - post/schedule a finished clip via OpenShorts' Upload-Post integration.
#
# SAFETY: default is a DRY-RUN (lists the job's clips and the exact payload).
# Nothing is sent anywhere unless you pass -Post with a specific -ClipIndex.
# That is the human gate from PLAN.md section 3: review in the UI, then post picks.
#
# One-time prerequisite: connect YouTube + Instagram in the Upload-Post
# dashboard (https://app.upload-post.com) and pass your profile name as
# -Profile (scripts\check-social.ps1 shows it). Bilibili is NOT supported
# by Upload-Post - post those manually (PLAN.md section 3).
#
# Usage:
#   post-clip.bat <job_id>                                  # list clips (dry-run)
#   post-clip.bat <job_id> -ClipIndex 0 -Post -Profile me   # post now, default platforms
#   post-clip.bat <job_id> -ClipIndex 1 -Post -Profile me -Platforms youtube
#   post-clip.bat <job_id> -ClipIndex 0 -Post -Profile me -Yes   # skip the POST prompt
#   post-clip.bat <job_id> -ClipIndex 0 -Post -Profile me -ScheduledDate "2026-09-01T19:30:00" -Timezone "Asia/Kolkata"
# Every successful -Post also saves a clean-named copy to posts\<date>_<title-slug>_<score>.mp4
# (originals keep their pipeline names - the backend references them by path).
# NOTE: keep this file ASCII-only - Windows PowerShell 5.1 misparses UTF-8
#       punctuation (em-dashes etc.) in BOM-less .ps1 files.
param(
  [Parameter(Mandatory=$true)][string]$JobId,
  [int]$ClipIndex = -1,
  [string[]]$Platforms = @("youtube","instagram"),
  [string]$Title = "",
  [string]$Description = "",
  [string]$ScheduledDate = "",
  [string]$Timezone = "UTC",
  [string]$Profile = "",
  [string]$Api = "http://localhost:8000",
  [switch]$Post,
  [switch]$Yes
)
$ErrorActionPreference = "Stop"

$root = Split-Path -Parent $PSScriptRoot
$upKey = $null; $gk = $null
foreach ($line in Get-Content (Join-Path $root ".env")) {
  if ($line -match '^\s*UPLOAD_POST_API_KEY\s*=\s*(.+?)\s*$') { $upKey = $Matches[1] }
  if ($line -match '^\s*GEMINI_API_KEY\s*=\s*(.+?)\s*$')      { $gk = $Matches[1] }
}
if (-not $upKey -and $Post) {
  Write-Host "ERROR: UPLOAD_POST_API_KEY is empty/missing in $root\.env."
  Write-Host "Get a key at https://app.upload-post.com (API settings), paste it into .env,"
  Write-Host "then run check-social.bat to see your profile name and connected platforms."
  exit 1
}

try { $st = Invoke-RestMethod -Uri "$Api/api/status/$JobId" -Headers @{ "X-Gemini-Key" = $gk } }
catch { Write-Host "ERROR: cannot read job ${JobId}: $($_.ErrorDetails.Message)"; exit 1 }
if ($st.status -ne "completed") { Write-Host "Job status is '$($st.status)' - only completed jobs can be posted."; exit 1 }
$clips = @($st.result.clips)
if ($clips.Count -eq 0) { Write-Host "Job has no clips."; exit 1 }

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
  Write-Host ("      file:   {0}" -f $c.video_url)
}

Write-Host "Clips for job ${JobId}:"
for ($i = 0; $i -lt $clips.Count; $i++) { Show-Clip $clips[$i] $i; Write-Host "" }

if (-not $Post) {
  Write-Host "DRY-RUN ONLY. To post clip N to all platforms:"
  Write-Host "  post-clip.bat $JobId -ClipIndex <N> -Post -Profile <upload-post-profile>"
  Write-Host 'Add -ScheduledDate "YYYY-MM-DDTHH:mm:ss" -Timezone "<tz>" to schedule instead.'
  exit 0
}

if ($ClipIndex -lt 0 -or $ClipIndex -ge $clips.Count) {
  Write-Host "ERROR: -Post needs a valid -ClipIndex (0..$($clips.Count-1))."
  exit 1
}
if (-not $upKey) {
  Write-Host "ERROR: UPLOAD_POST_API_KEY is empty/missing in $root\.env - posting is blocked until it is set."
  exit 1
}
if (-not $Profile) {
  Write-Host "ERROR: -Post needs -Profile <your Upload-Post profile name>."
  Write-Host "Run scripts\check-social.ps1 to see your profile and connected platforms."
  exit 1
}

$c = $clips[$ClipIndex]
$finalTitle = if ($Title) { $Title } elseif ($c.video_title_for_youtube_short) { $c.video_title_for_youtube_short } else { "Viral Short" }
$finalDesc  = if ($Description) { $Description } elseif ($c.video_description_for_instagram) { $c.video_description_for_instagram } elseif ($c.video_description_for_tiktok) { $c.video_description_for_tiktok } else { "Check this out!" }

$payload = @{
  job_id      = $JobId
  clip_index  = $ClipIndex
  platforms   = $Platforms
  title       = $finalTitle
  description = $finalDesc
  api_key     = $upKey
  user_id     = $Profile
  timezone    = $Timezone
}
if ($ScheduledDate) { $payload.scheduled_date = $ScheduledDate }

Write-Host "------------------------------------------------------------"
Write-Host " Posting clip [$ClipIndex] to: $($Platforms -join ', ')"
if ($ScheduledDate) { Write-Host " Scheduled for: $ScheduledDate ($Timezone)" } else { Write-Host " Posting IMMEDIATELY." }
Write-Host " Title:       $finalTitle"
Write-Host " Description: $finalDesc"
Write-Host "------------------------------------------------------------"
$answer = if ($Yes) { "POST" } else { Read-Host "Type POST to confirm, anything else aborts" }
if ($answer -cne "POST") { Write-Host "Aborted - nothing was posted."; exit 1 }

try {
  $out = Invoke-RestMethod -Uri "$Api/api/social/post" -Method Post -Body ($payload | ConvertTo-Json -Depth 5) -ContentType "application/json"
} catch {
  Write-Host "ERROR posting: $($_.ErrorDetails.Message)"
  exit 1
}
Write-Host "Upload-Post response:"
$out | ConvertTo-Json -Depth 5 | Write-Host

# Keep a human-findable copy of everything that was actually posted:
#   posts\<date>_<youtube-title-slug>_<score>.mp4
# The originals keep their pipeline names (the backend/UI reference them by
# path), so this is a copy, never a rename.
$localFile = Join-Path $root ("openshorts\output\" + $JobId + "\" + ($c.video_url -split '/')[-1])
if (Test-Path $localFile) {
  $slug = ($finalTitle -replace '[^A-Za-z0-9]+', '-').Trim('-').ToLower()
  if ($slug.Length -gt 40) { $slug = $slug.Substring(0, 40).Trim('-') }
  $score = if ($c.PSObject.Properties.Name -contains "predicted_score") { $c.predicted_score } else { "x" }
  $postsDir = Join-Path $root "posts"
  if (-not (Test-Path $postsDir)) { New-Item -ItemType Directory -Path $postsDir | Out-Null }
  $exportPath = Join-Path $postsDir ((Get-Date -Format "yyyy-MM-dd") + "_" + $slug + "_" + $score + ".mp4")
  Copy-Item $localFile $exportPath -Force
  Write-Host "Clean-named copy saved: $exportPath"
}
