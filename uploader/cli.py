"""CLI entry: python -m uploader <command> (see uploader.bat)."""

import argparse
import sys

from .config import Config, setup_console
from .engine import run_check, run_doctor, run_list, run_post

ALL_PLATFORMS = ["youtube", "instagram", "bilibili", "facebook", "tiktok"]


def _platforms_arg(raw: str) -> list:
    platforms = [p.strip() for p in raw.split(",") if p.strip()]
    bad = [p for p in platforms if p not in ALL_PLATFORMS]
    if bad:
        raise SystemExit(f"ERROR: unknown platform(s) {bad} - choose from {ALL_PLATFORMS}")
    return platforms


def main(argv=None) -> int:
    setup_console()
    parser = argparse.ArgumentParser(
        prog="uploader",
        description="Clipper self-hosted multi-platform poster (YouTube / Instagram / Bilibili / Facebook / TikTok) - dry-run by default.",
    )
    sub = parser.add_subparsers(dest="command", required=True)

    p_list = sub.add_parser("list", help="list a job's clips with score/hook/copy (dry-run)")
    p_list.add_argument("--job", required=True)

    p_post = sub.add_parser("post", help="dry-run a clip's payloads; add --post to really upload")
    p_post.add_argument("--job", required=True)
    p_post.add_argument("--clip", type=int, default=-1, help="clip index (required for a real post)")
    p_post.add_argument("--platforms", default="", help="comma list, default: POST_PLATFORMS env or all five (youtube,instagram,bilibili,facebook,tiktok)")
    p_post.add_argument("--title", default="", help="override title (YT/Bilibili)")
    p_post.add_argument("--desc", default="", help="override description/caption")
    p_post.add_argument("--tags", default="", help="comma list; overrides platform defaults")
    p_post.add_argument("--post", action="store_true", help="PERFORM the real upload (default is dry-run)")
    p_post.add_argument("--yes", action="store_true", help="skip the interactive POST confirmation")

    p_check = sub.add_parser("check", help="non-destructive credential/readiness check per platform")
    p_check.add_argument("--platforms", default="")

    sub.add_parser("doctor", help="environment/dependency readiness report")

    p_login = sub.add_parser("login", help="one-time credential setup (only youtube needs this flow)")
    p_login.add_argument("--platform", required=True, choices=ALL_PLATFORMS)

    args = parser.parse_args(argv)
    cfg = Config()

    if args.command == "list":
        return run_list(cfg, args.job)

    if args.command == "check":
        return run_check(cfg, _platforms_arg(args.platforms) if args.platforms else cfg.default_platforms)

    if args.command == "doctor":
        return run_doctor(cfg)

    if args.command == "login":
        if args.platform != "youtube":
            print(f"{args.platform} credentials are set in the root .env (see `uploader.bat check`).")
            return 0
        from .platforms import ADAPTERS, SetupError

        try:
            print(ADAPTERS["youtube"](cfg).login_interactive())
            return 0
        except SetupError as exc:
            print(str(exc))
            return 1

    # post
    platforms = _platforms_arg(args.platforms) if args.platforms else cfg.default_platforms
    if args.post and args.clip < 0:
        print("ERROR: a real post needs a specific --clip <N> (human gate, same rule as post-clip.ps1).")
        return 1
    return run_post(cfg, args.job, args.clip, platforms, args.title, args.desc, args.tags, args.post, args.yes)


if __name__ == "__main__":
    try:
        sys.exit(main())
    except KeyboardInterrupt:
        print("\nInterrupted.")
        sys.exit(130)
