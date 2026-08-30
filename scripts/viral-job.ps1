# Clipper - submit a job in the VERIFIED VIRAL FORMAT profile (PLAN.md section 2) and wait.
#
# Format applied per job (all verified 2026 levers, see PLAN.md):
#   - auto hook text overlay burned in (style: outline - bold white + black outline)
#   - clip band 15-34s (the 15-30s retention sweet spot, with loop-rule trimming)
#   - punch-ins on audio beats + Gemini auto layout picker + speaker cuts/split
#   - karaoke captions are on by default (engine default)
#
# Usage: powershell -NoProfile -ExecutionPolicy Bypass -File scripts\viral-job.ps1 -Url "<video-or-stream-url>"
# NOTE: keep this file ASCII-only - Windows PowerShell 5.1 misparses UTF-8
#       punctuation (em-dashes etc.) in BOM-less .ps1 files.
param(
  [Parameter(Mandatory=$true)][string]$Url,
  [string]$Api = "http://localhost:8000",
  [int]$TargetClips = 5,
  [int]$MinSeconds = 15,
  [int]$MaxSeconds = 34,
  [string]$HookStyle = "outline",
  [string]$Layouts = "auto,punch_in,speaker_cut,split",
  [int]$MaxSourceHeight = 0,
  [switch]$ForceLowQuality,
  [int]$TimeoutMinutes = 90
)
$ErrorActionPreference = "Stop"

$root = Split-Path -Parent $PSScriptRoot
$key = $null
foreach ($line in Get-Content (Join-Path $root ".env")) {
  if ($line -match '^\s*GEMINI_API_KEY\s*=\s*(.+?)\s*$') { $key = $Matches[1] }
}
if (-not $key) { Write-Host "ERROR: GEMINI_API_KEY not found in $root\.env"; exit 1 }
$headers = @{ "X-Gemini-Key" = $key }

$body = @{
  url               = $Url
  acknowledged      = $true
  auto_hook         = $true
  auto_hook_style   = $HookStyle
  layouts           = $Layouts
  target_clips      = $TargetClips
  clip_min_seconds  = $MinSeconds
  clip_max_seconds  = $MaxSeconds
  force_low_quality = [bool]$ForceLowQuality
} | ConvertTo-Json
if ($MaxSourceHeight -gt 0) {
  # Cap the source download resolution (e.g. -MaxSourceHeight 720 for Twitch
  # 1080p60 sources on a flaky network; delivery is still 1080x1920).
  $bodyObj = $body | ConvertFrom-Json
  $bodyObj | Add-Member -NotePropertyName max_source_height -NotePropertyValue $MaxSourceHeight
  $body = $bodyObj | ConvertTo-Json
}

Write-Host "Submitting viral-format job ($TargetClips clips, ${MinSeconds}-${MaxSeconds}s, hook=$HookStyle, layouts=$Layouts)..."
try {
  $resp = Invoke-RestMethod -Uri "$Api/api/process" -Method Post -Headers $headers -Body $body -ContentType "application/json"
} catch {
  $detail = $_.ErrorDetails.Message
  if (-not $detail) { $detail = $_.Exception.Message }
  Write-Host "ERROR submitting job: $detail"
  exit 1
}
if ($resp.needs_confirmation) {
  $qc = $resp.quality_check
  Write-Host ("QUALITY GATE: source max resolution {0}p (min is {1}p). Re-run with -ForceLowQuality to accept." -f $qc.max_height, $qc.min_height)
  exit 2
}
$jobId = $resp.job_id
if (-not $jobId) { Write-Host "ERROR: no job_id in response: $($resp | ConvertTo-Json -Depth 5)"; exit 1 }
Write-Host "Job queued: $jobId"
Write-Host "Watch it in the UI: http://localhost:5175  (this window polls until done)"
Write-Host ""

$deadline = (Get-Date).AddMinutes($TimeoutMinutes)
$shownLogs = 0
$clips = $null
while ($true) {
  Start-Sleep -Seconds 15
  try { $st = Invoke-RestMethod -Uri "$Api/api/status/$jobId" -Headers $headers }
  catch { Write-Host ("  (status poll failed: {0} - retrying)" -f $_.Exception.Message); continue }

  $logs = @($st.logs)
  if ($logs.Count -gt $shownLogs) {
    for ($i = $shownLogs; $i -lt $logs.Count; $i++) {
      $t = [string]$logs[$i]
      if ($t.Trim()) { Write-Host ("  | {0}" -f $t) }
    }
    $shownLogs = $logs.Count
  }

  if ($st.status -eq "completed") { $clips = $st.result.clips; break }
  if ($st.status -eq "failed") {
    Write-Host ""
    Write-Host "JOB FAILED. Last logs above. Common causes: cookies for gated sources, no speech found, bad URL."
    exit 1
  }
  if ((Get-Date) -gt $deadline) { Write-Host "TIMED OUT after $TimeoutMinutes min - job $jobId may still finish; check the UI later."; exit 1 }
}

Write-Host ""
Write-Host "============================================================"
Write-Host " DONE - $jobId"
Write-Host "============================================================"
for ($i = 0; $i -lt $clips.Count; $i++) {
  $c = $clips[$i]
  $dur = ""
  if ($c.PSObject.Properties.Name -contains "start" -and $c.PSObject.Properties.Name -contains "end") {
    $dur = "{0}s" -f [math]::Round([double]$c.end - [double]$c.start)
  }
  $score = if ($c.PSObject.Properties.Name -contains "predicted_score") { $c.predicted_score } else { "?" }
  $hook  = if ($c.PSObject.Properties.Name -contains "viral_hook_text") { $c.viral_hook_text } else { "" }
  $yt    = if ($c.PSObject.Properties.Name -contains "video_title_for_youtube_short") { $c.video_title_for_youtube_short } else { "" }
  $file  = if ($c.PSObject.Properties.Name -contains "video_url") { $c.video_url } else { "" }
  Write-Host ("  [{0}] {1}  score={2}  hook='{3}'" -f $i, $dur, $score, $hook)
  Write-Host ("      YT title: {0}" -f $yt)
  Write-Host ("      file:     {0}" -f $file)
}
Write-Host ""
Write-Host "Finished MP4s are in openshorts\output\$jobId\ and in the review queue:"
Write-Host "  http://localhost:5175"
Write-Host "Review them, then post picks with: post-clip.bat $jobId (dry-run listing first)."
