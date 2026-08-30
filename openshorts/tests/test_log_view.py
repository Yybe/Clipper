from log_view import friendly_log_line, friendly_logs

# Raw lines captured from a real production job.
RAW_JOB = [
    "Job started by worker.",
    "🎙️  Transcribing video...",
    "🎙️ Transcribing… 25% (3s)",
    "🎙️ Transcribing… 100% (7s)",
    "🎙️ [ASR] parakeet ok: lang=es segments=43",
    "🔥 Found 2 viral clips!",
    "🎬 Processing Clip 1: 0.004s - 35.336s",
    "🎞️ [Encoder] video encoder: h264_nvenc (FFMPEG_ENCODER=auto)",
    "🎬 Processing clip: output/e7f00666/temp_e7f00666_agente-ia_clip_1.mp4",
    "✅ Found 2 scenes.",
    "🧠 Step 2: Preparing Active Tracking...",
    "🤖 Step 3: Analyzing Scenes for Strategy (Single vs Group)...",
    "✂️ Step 4: Processing video frames...",
    "🔊 Step 5: Extracting audio...",
    "✨ Step 6: Merging...",
    "✅ Clip saved to output/e7f00666/e7f00666_agente-ia_clip_1.mp4",
    "✅ Clip 1 ready: output/e7f00666/e7f00666_agente-ia_clip_1.mp4",
    "Process finished successfully.",
]


def test_real_job_produces_clean_user_view():
    assert friendly_logs(RAW_JOB) == [
        "Job started by worker.",
        "🎙️ Transcribing audio…",
        "🎙️ Transcribing… 25% (3s)",
        "🎙️ Transcribing… 100% (7s)",
        "🔥 Found 2 viral clips!",
        "🎬 Creating clip 1…",
        "✅ Clip 1 ready",
        "Process finished successfully.",
    ]


def test_no_paths_ever_leak():
    for line in friendly_logs(RAW_JOB):
        assert "output/" not in line
        assert ".mp4" not in line


def test_technical_lines_are_hidden():
    assert friendly_log_line("🎙️ [ASR] parakeet ok: lang=es segments=43") is None
    assert friendly_log_line("🎞️ [Encoder] video encoder: h264_nvenc") is None
    assert friendly_log_line("🧠 Step 2: Preparing Active Tracking...") is None
    assert friendly_log_line("yt-dlp downloading format 137") is None


def test_errors_kept_without_paths():
    assert friendly_log_line("Process failed with exit code 1") == \
        "Process failed with exit code 1"
    out = friendly_log_line("❌ Could not read output/abc/clip.mp4")
    assert out is not None and "output/" not in out


def test_consecutive_duplicates_collapse():
    logs = ["🎙️  Transcribing video...", "🎙️  Transcribing audio from: x.mp4"]
    assert friendly_logs(logs) == ["🎙️ Transcribing audio…"]
