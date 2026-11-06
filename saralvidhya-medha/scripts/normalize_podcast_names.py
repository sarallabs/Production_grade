#!/usr/bin/env python3
"""Rename non-standard podcast .md and .mp3 files to canonical names."""

from __future__ import annotations

import argparse
import json
import re
import sys
from datetime import datetime, timezone
from pathlib import Path

ROOT_DEFAULT = Path("public/generated_resources/neb_nepal")
LEVELS = {"beginner", "intermediate", "advanced"}
CANONICAL_MD = {"short_podcast.md", "long_podcast.md"}
CANONICAL_MP3 = {"short_podcast.mp3", "long_podcast.mp3"}


def kind_from_name(name: str) -> str | None:
    lower = name.lower()
    if "short" in lower and "podcast" in lower and name.endswith(".md"):
        return "short"
    if "long" in lower and "podcast" in lower and name.endswith(".md"):
        return "long"
    if name.endswith(".mp3"):
        if re.search(r"short", lower) and not re.search(r"long", lower):
            return "short"
        if re.search(r"long", lower):
            return "long"
    return None


def discover_level_dirs(root: Path) -> list[Path]:
    if root.is_dir() and root.name in LEVELS:
        return [root]
    dirs: list[Path] = []
    for p in root.rglob("*"):
        if p.is_dir() and p.name in LEVELS:
            dirs.append(p)
    return sorted(set(dirs))


def pick_source(files: list[Path], kind: str, ext: str) -> Path | None:
  canonical = f"{kind}_podcast{ext}"
  non_std = [f for f in files if f.name != canonical and kind_from_name(f.name) == kind]
  if not non_std:
    return None
  return sorted(non_std, key=lambda p: p.stat().st_mtime, reverse=True)[0]


def merge_or_rename(src: Path, dst: Path, *, dry_run: bool) -> str:
    if dst.exists() and dst.resolve() != src.resolve():
        src_size = src.stat().st_size
        dst_size = dst.stat().st_size
        if src_size > dst_size:
            action = "replace"
            if not dry_run:
                dst.unlink()
                src.rename(dst)
        else:
            action = "drop_duplicate"
            if not dry_run:
                src.unlink()
        return action
    if not dry_run:
        src.rename(dst)
    return "rename"


def normalize_dir(level_dir: Path, *, dry_run: bool) -> list[dict]:
    actions: list[dict] = []
    md_files = list(level_dir.glob("*.md"))
    mp3_files = list(level_dir.glob("*.mp3"))

    for kind, ext, canonical_name in (
        ("short", ".md", "short_podcast.md"),
        ("long", ".md", "long_podcast.md"),
        ("short", ".mp3", "short_podcast.mp3"),
        ("long", ".mp3", "long_podcast.mp3"),
    ):
        dst = level_dir / canonical_name
        if dst.exists():
            continue
        pool = md_files if ext == ".md" else mp3_files
        src = pick_source(pool, kind, ext)
        if src is None:
            continue
        action = merge_or_rename(src, dst, dry_run=dry_run)
        actions.append(
            {
                "level_dir": str(level_dir),
                "kind": kind,
                "type": ext.lstrip("."),
                "from": src.name,
                "to": canonical_name,
                "action": action,
            }
        )
    return actions


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--root", type=Path, default=ROOT_DEFAULT)
    ap.add_argument("--dry-run", action="store_true")
    ap.add_argument("--manifest", type=Path, default=None)
    args = ap.parse_args()

    root = args.root.resolve()
    if not root.is_dir():
        print(f"Root not found: {root}", file=sys.stderr)
        return 1

    all_actions: list[dict] = []
    for level_dir in discover_level_dirs(root):
        all_actions.extend(normalize_dir(level_dir, dry_run=args.dry_run))

    manifest_path = args.manifest or (root / "PODCAST_RENAME_MANIFEST.json")
    payload = {
        "generated_at": datetime.now(timezone.utc).isoformat(),
        "root": str(root),
        "dry_run": args.dry_run,
        "renames": all_actions,
    }

    if not args.dry_run:
        manifest_path.write_text(json.dumps(payload, indent=2) + "\n", encoding="utf-8")

    prefix = "[dry-run] " if args.dry_run else ""
    for a in all_actions:
        print(f"{prefix}{a['action']}: {a['level_dir']}/{a['from']} -> {a['to']}")
    print(f"{prefix}total actions: {len(all_actions)}")
    if not args.dry_run:
        print(f"manifest: {manifest_path}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
