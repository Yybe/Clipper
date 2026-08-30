"""Cloud-facing job log view.

Self-hosted instances see the raw pipeline output (useful for debugging).
Cloud/paying users get a curated, whitelist-based view: friendly progress
lines only — no file paths, model names, encoder details or pipeline
internals. Anything not matched by a rule is hidden.
"""
import re

# Strips any slashy path token (output/…/clip.mp4, /app/uploads/x.mp4, …).
_PATH_RE = re.compile(r'(?:/?[\w.\-]+/)+[\w.\-]+')


def _strip_paths(line):
    return _PATH_RE.sub('', line).rstrip(' :')


# Ordered rules; first match wins. Replacement is a template using the
# match's groups, or None to keep the (path-stripped) line verbatim.
_RULES = [
    # Worker/job lifecycle + errors: keep, minus any paths.
    (re.compile(r'^(Job started|Process finished|Process failed|'
                r'Execution error|No metadata|❌)'), None),
    # Live transcription progress emitted by transcribe_backends.
    (re.compile(r'^🎙️ Transcribing… \d+%'), None),
    (re.compile(r'Transcribing (video|audio)'), '🎙️ Transcribing audio…'),
    (re.compile(r'Found (\d+) viral clips'), '🔥 Found {0} viral clips!'),
    (re.compile(r'Processing Clip (\d+)'), '🎬 Creating clip {0}…'),
    (re.compile(r'Clip (\d+) ready'), '✅ Clip {0} ready'),
]


def friendly_log_line(line):
    """Map one raw log line to its cloud-visible form, or None to hide it."""
    stripped = line.strip()
    if not stripped:
        return None
    for pattern, template in _RULES:
        match = pattern.search(stripped)
        if match:
            if template is None:
                return _strip_paths(stripped)
            return template.format(*match.groups())
    return None


def friendly_logs(logs):
    """Curated log list for cloud users, consecutive duplicates collapsed."""
    out = []
    for line in logs:
        friendly = friendly_log_line(line)
        if friendly and (not out or out[-1] != friendly):
            out.append(friendly)
    return out
