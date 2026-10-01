#!/usr/bin/env python3
"""Restore podcast .md scripts from a git commit into canonical short/long_podcast.md names."""

from __future__ import annotations

import argparse
import subprocess
import sys
from pathlib import Path

ROOT_DEFAULT = Path("public/generated_resources/neb_nepal")
DEFAULT_COMMIT = "8eb7339"


def git_show(commit: str, path: str) -> str | None:
    r = subprocess.run(
        ["git", "show", f"{commit}:{path}"],
        capture_output=True,
        text=True,
    )
    if r.returncode != 0:
        return None
    return r.stdout


def git_list(commit: str, prefix: str) -> list[str]:
    r = subprocess.run(
        ["git", "ls-tree", "-r", commit, "--name-only", prefix],
        capture_output=True,
        text=True,
    )
    if r.returncode != 0:
        return []
    return [ln for ln in r.stdout.splitlines() if "podcast" in ln.lower() and ln.endswith(".md")]


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--root", type=Path, default=ROOT_DEFAULT / "class_12")
    ap.add_argument("--commit", default=DEFAULT_COMMIT)
    ap.add_argument("--dry-run", action="store_true")
    args = ap.parse_args()

    repo = Path(__file__).resolve().parents[1]
    root = args.root.resolve()
    prefix = str(root.relative_to(repo)).replace("\\", "/")

    paths = git_list(args.commit, prefix)
    restored = 0
    for git_path in sorted(paths):
        if not git_path.endswith(".md"):
            continue
        name = Path(git_path).name.lower()
        if "short" in name and "podcast" in name:
            kind = "short"
        elif "long" in name and "podcast" in name:
            kind = "long"
        else:
            continue
        content = git_show(args.commit, git_path)
        if content is None:
            continue
        out = repo / Path(git_path).parent / f"{kind}_podcast.md"
        restored += 1
        rel = out.relative_to(repo)
        print(f"{'[dry-run] ' if args.dry_run else ''}restore: {rel} <- {git_path}")
        if not args.dry_run:
            out.parent.mkdir(parents=True, exist_ok=True)
            out.write_text(content, encoding="utf-8", newline="\n")

    print(f"{'[dry-run] ' if args.dry_run else ''}restored: {restored}")
    return 0 if restored else 1


if __name__ == "__main__":
    raise SystemExit(main())
