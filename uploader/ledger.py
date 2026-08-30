"""Post ledger: append-only JSON record of every real upload attempt.

Lives in uploader/credentials/ (gitignored) next to the tokens it audits.
"""

import json
from datetime import datetime, timezone

from .config import CRED_DIR, LEDGER_PATH


def record(entry: dict) -> None:
    CRED_DIR.mkdir(parents=True, exist_ok=True)
    ledger = []
    if LEDGER_PATH.exists():
        try:
            ledger = json.loads(LEDGER_PATH.read_text(encoding="utf-8"))
        except (json.JSONDecodeError, OSError):
            ledger = []
    entry = {"ts": datetime.now(timezone.utc).isoformat(timespec="seconds"), **entry}
    ledger.append(entry)
    LEDGER_PATH.write_text(json.dumps(ledger, indent=2, ensure_ascii=False), encoding="utf-8")
