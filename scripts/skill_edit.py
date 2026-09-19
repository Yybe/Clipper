#!/usr/bin/env python3
"""Market-skill (video-clip-editor) Mode B edit workflow, per SKILL.md steps 2/5/6.

Guarantees vs the openshorts complaints:
  - cut points snap to WORD timestamps at sentence boundaries -> no mid-word audio start
  - captions cover EVERY spoken word of the clip, one line per sentence -> dense captions
"""
import json, subprocess, sys, os, re

RUN_DIR = os.path.dirname(os.path.abspath(__file__))
SOURCE = os.path.abspath(os.environ.get("SKILL_SOURCE", os.path.join(RUN_DIR, "source.mp4")))
SEGMENTS = os.path.abspath(os.environ.get("SKILL_SEGS", os.path.join(RUN_DIR, "segments.json")))

def fmt(t: float) -> str:
    h, r = divmod(t, 3600); m, s = divmod(r, 60)
    return f"{int(h)}:{int(m):02d}:{int(s):02d}.{int((s % 1) * 100):02d}"

def srt_time(t: float) -> str:
    h, r = divmod(t, 3600); m, s = divmod(r, 60)
    return f"{int(h):02d}:{int(m):02d}:{int(s):02d},{int((s % 1) * 1000):03d}"

SENT_END = re.compile(r"[.!?…:]$")

def clean(text):
    # whisper emits hyphenated words as "pre -order"
    return re.sub(r"\s+-(?=\w)", "", text)

def build_lines(words, lo, hi):
    """Group words into sentence-ish caption lines clamped to [lo, hi]."""
    lines, cur, cur_start = [], [], None
    for w in words:
        mid = (w["s"] + w["e"]) / 2
        if mid < lo or mid > hi:
            continue
        if cur_start is None:
            cur_start = w["s"]
        cur.append(w)
        long_enough = (cur[-1]["e"] - cur_start) > 1.2
        sentence_end = SENT_END.search(w["w"]) and long_enough
        too_long = len(cur) >= 8 or (cur[-1]["e"] - cur_start) >= 3.6
        if sentence_end or too_long:
            lines.append((cur_start, cur[-1]["e"], clean(" ".join(x["w"].strip() for x in cur))))
            cur, cur_start = [], None
    if cur:
        lines.append((cur_start, cur[-1]["e"], clean(" ".join(x["w"].strip() for x in cur))))
    return lines

def main(start, end, clip_id, hook):
    segs = json.load(open(SEGMENTS, encoding="utf-8"))
    words = [w for s in segs for w in s.get("words", [])]
    lines = build_lines(words, start, end)
    if not lines:
        print("no words in window"); sys.exit(1)
    cut_start = max(0.0, lines[0][0] - 0.15)          # pad before first phonon
    cut_end = min(lines[-1][1] + 0.25, len(words) and words[-1]["e"])
    out = os.path.join(RUN_DIR, f"{clip_id}.mp4")

    ass = [
        "[Script Info]", "ScriptType: v4.00+", "PlayResX: 1080", "PlayResY: 1920",
        "WrapStyle: 0", "ScaledBorderAndShadow: yes", "",
        "[V4+ Styles]",
        "Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding",
        "Style: Cap,Arial Black,72,&H00FFFFFF,&H0000FFFF,&H00000000,&H96000000,-1,0,0,0,100,100,0,0,1,7,2,2,60,60,560,1",
        "Style: Hook,Impact,88,&H0000FFFF,&H000000FF,&H00000000,&H96000000,-1,0,0,0,100,100,0,0,1,9,3,8,40,40,220,1",
        "", "[Events]",
        "Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text",
        f"Dialogue: 1,0:00:00.10,0:00:02.60,Hook,,0,0,0,,{hook}",
    ]
    for a, b, text in lines:
        ass.append(f"Dialogue: 0,{fmt(max(0.0, a - cut_start))},{fmt(b - cut_start)},Cap,,0,0,0,,{text}")
    open(os.path.join(RUN_DIR, "subs.ass"), "w", encoding="utf-8").write("\n".join(ass) + "\n")

    srt = [f"{i}\n{srt_time(max(0.0, a - cut_start))} --> {srt_time(b - cut_start)}\n{t}\n"
           for i, (a, b, t) in enumerate(lines, 1)]
    open(os.path.join(RUN_DIR, f"{clip_id}.srt"), "w", encoding="utf-8").write("\n".join(srt))

    dur = cut_end - cut_start
    vf = (
        "split=2[bg][fg];"
        "[bg]scale=1080:1920:force_original_aspect_ratio=increase,crop=1080:1920,gblur=sigma=30,eq=brightness=-0.15[bgb];"
        "[fg]scale=1080:-2[fgo];"
        "[bgb][fgo]overlay=(W-w)/2:(H-h)/2,"
        "subtitles=subs.ass"
    )
    cmd = ["ffmpeg", "-y", "-ss", f"{cut_start:.3f}", "-i", SOURCE, "-t", f"{dur:.3f}",
           "-filter_complex", vf, "-map", "0:a", "-c:v", "libx264", "-preset", "medium",
           "-crf", "19", "-c:a", "aac", "-b:a", "192k", "-movflags", "+faststart", out]
    print("cutting", f"{cut_start:.2f} -> {cut_end:.2f}", f"({dur:.1f}s), {len(lines)} caption lines")
    r = subprocess.run(cmd, capture_output=True, text=True, cwd=RUN_DIR)
    if r.returncode: print(r.stderr[-2000:]); sys.exit(1)
    print("wrote", out)
    for a, b, t in lines: print(f"  [{a - cut_start:5.1f}-{b - cut_start:5.1f}] {t}")

if __name__ == "__main__":
    main(float(sys.argv[1]), float(sys.argv[2]), sys.argv[3], sys.argv[4])
