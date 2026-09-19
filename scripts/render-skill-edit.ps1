# Clipper - batch driver for the market-skill edit path.
# Reads a TSV plan (src, start, end, clip_id, hook, title, caption), renders each clip with
# scripts\skill_edit.py, stages the results into posts\skill-edit\ (mp4 + srt + caption sidecar)
# and writes schedule-manifest.json with 2 slots per day over 5 days for scripts\schedule-skill-edit.ps1.
#
# Usage:
#   render-skill-edit.ps1 -Plan market_skill_run\plan.tsv
#   render-skill-edit.ps1 -Plan ... -StartDate 2026-09-20 -MorningHour 10 -EveningHour 18.5
# Keep this file ASCII-only - PowerShell 5.1 misparses BOM-less UTF-8 punctuation.
param(
  [Parameter(Mandatory=$true)][string]$Plan,
  [string]$StartDate = "2026-09-20",
  [double]$MorningHour = 10,
  [double]$EveningHour = 18.5,
  [double]$TzOffsetHours = 0,
  [switch]$Force
)
$ErrorActionPreference = "Stop"
$root = Split-Path -Parent $PSScriptRoot
$run  = Join-Path $root "market_skill_run"
$out  = Join-Path $root "posts\skill-edit"
if (-not (Test-Path $out)) { New-Item -ItemType Directory -Path $out | Out-Null }
if (-not $TzOffsetHours) { $TzOffsetHours = [double][TimeZoneInfo]::Local.GetUtcOffset((Get-Date)).TotalHours }
$py = "C:\Users\xxshi\AppData\Local\Programs\Python\Python311\python.exe"
if (-not (Test-Path $py)) { $py = "python" }

$rows = Get-Content $Plan | Where-Object { $_ -and $_ -notmatch "^src`t" } | ForEach-Object {
  $c = $_ -split "`t"
  [pscustomobject]@{ src=$c[0]; start=$c[1]; end=$c[2]; id=$c[3]; hook=$c[4]; title=$c[5]; caption=$c[6] }
}
Write-Host ("plan rows: {0}" -f $rows.Count)

$staged = @()
foreach ($r in $rows) {
  $srcVid = Join-Path $run ("v_" + $r.src + ".mp4")
  $segs   = Join-Path $run ("t_" + $r.src + ".json")
  if (-not (Test-Path $srcVid) -or -not (Test-Path $segs)) { Write-Host ("[{0}] SKIP - missing {1} or {2}" -f $r.id, $srcVid, $segs); continue }

  $date = (Get-Date -Format "yyyy-MM-dd")
  $stagedMp4 = Join-Path $out ($date + "_" + $r.id + "_SKILL-EDIT.mp4")
  if ((Test-Path $stagedMp4) -and -not $Force) { Write-Host ("[{0}] already staged" -f $r.id) }
  else {
    $env:SKILL_SOURCE = $srcVid
    $env:SKILL_SEGS   = $segs
    Write-Host ("[{0}] rendering {1}-{2}" -f $r.id, $r.start, $r.end)
    & $py (Join-Path $root "scripts\skill_edit.py") $r.start $r.end $r.id $r.hook 2>&1 |
      Where-Object { $_ -notmatch "^\[|^  lib|^ffmpeg|^Configuration|^Input|^Output|^Stream|^At least|^$" } |
      ForEach-Object { Write-Host ("   " + $_) }
    if ($LASTEXITCODE -ne 0) { Write-Host ("[{0}] RENDER FAILED" -f $r.id); exit 1 }
    $prod = Join-Path $root ("scripts\" + $r.id + ".mp4")
    if (-not (Test-Path $prod)) { Write-Host ("[{0}] no output produced" -f $r.id); exit 1 }
    Move-Item $prod $stagedMp4 -Force
    if (Test-Path (Join-Path $root ("scripts\" + $r.id + ".srt"))) {
      Move-Item (Join-Path $root ("scripts\" + $r.id + ".srt")) ($stagedMp4 -replace "\.mp4$", ".srt") -Force
    }
  }
  Set-Content -Path ($stagedMp4 -replace "\.mp4$", "_CAPTION.txt") -Value ("TITLE: " + $r.title + "`r`n`r`n" + $r.caption) -Encoding ASCII
  $staged += [pscustomobject]@{ file = (Split-Path -Leaf $stagedMp4); title = $r.title; caption = $r.caption }
}

# --- schedule: 2 slots per day, morning + evening, local time ----------------
$manifest = @()
$slots = @()
for ($d = 0; $d -lt 5; $d++) {
  $day = [DateTime]::Parse($StartDate).AddDays($d)
  foreach ($h in @($MorningHour, $EveningHour)) {
    $slots += $day.AddHours($h).ToString("yyyy-MM-ddTHH:mm:ss")
  }
}
for ($i = 0; $i -lt $staged.Count; $i++) {
  if ($i -ge $slots.Count) { Write-Host "more clips than 10 slots - stopping schedule at 10"; break }
  $manifest += [ordered]@{
    file = $staged[$i].file; date = $slots[$i]; tzOffsetHours = $TzOffsetHours
    title = $staged[$i].title; caption = $staged[$i].caption
    integrationId = "cmtyl9cnn0001lmbq35ej4p1r"
  }
}
$mf = Join-Path $out "schedule-manifest.json"
ConvertTo-Json $manifest -Depth 5 | Set-Content -Path $mf -Encoding ASCII
Write-Host ("manifest ({0} entries) -> {1}" -f $manifest.Count, $mf)
Write-Host "next: schedule-skill-edit.ps1 (dry-run) then add -Post"
