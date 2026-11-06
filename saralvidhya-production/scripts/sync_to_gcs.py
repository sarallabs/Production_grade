# -*- coding: utf-8 -*-
"""
GCS Sync Helper — saralvidhya-production
=========================================
Use this script to push new or updated content to GCS.

Usage:
  # Sync a specific chapter
  python scripts/sync_to_gcs.py --chapter chapter_02

  # Sync a specific file
  python scripts/sync_to_gcs.py --file angrau/entomology/chapter_02/practice/mcq/easy.json

  # Sync everything (full re-upload)
  python scripts/sync_to_gcs.py --all

  # Dry run (see what would be uploaded, no actual upload)
  python scripts/sync_to_gcs.py --chapter chapter_02 --dry-run
"""

import sys
import subprocess
import argparse
from pathlib import Path

sys.stdout.reconfigure(encoding='utf-8')

BUCKET       = "gs://saralvidhya-artifacts"
CONTENT_ROOT = Path(__file__).parent.parent / "content"


def run(cmd: list[str], dry_run: bool) -> None:
    print(f"  {'[DRY RUN] ' if dry_run else ''}$ {' '.join(cmd)}")
    if not dry_run:
        result = subprocess.run(cmd, capture_output=False)
        if result.returncode != 0:
            print(f"  ERROR: command failed with code {result.returncode}")
        else:
            print(f"  ✅ Done")


def sync_chapter(chapter: str, university: str, subject: str, dry_run: bool) -> None:
    local = CONTENT_ROOT / university / subject / chapter
    remote = f"{BUCKET}/{university}/{subject}/{chapter}/"

    if not local.exists():
        print(f"ERROR: {local} does not exist locally. Run migrate script first.")
        return

    print(f"\nSyncing {chapter} → {remote}")
    run(["gcloud", "storage", "rsync", "-r", str(local) + "/", remote], dry_run)


def sync_file(rel_path: str, dry_run: bool) -> None:
    local  = CONTENT_ROOT / rel_path
    remote = f"{BUCKET}/{rel_path}"

    if not local.exists():
        print(f"ERROR: {local} does not exist locally.")
        return

    print(f"\nUploading {rel_path} → {remote}")
    run(["gcloud", "storage", "cp", str(local), remote], dry_run)


def sync_all(dry_run: bool) -> None:
    print(f"\nSyncing ALL content → {BUCKET}/")
    run(["gcloud", "storage", "rsync", "-r",
         str(CONTENT_ROOT) + "/", BUCKET + "/"], dry_run)


def main():
    parser = argparse.ArgumentParser(description="Sync local content to GCS bucket")
    parser.add_argument("--chapter", help="Chapter to sync (e.g. chapter_02)")
    parser.add_argument("--file",    help="Relative path of single file to upload (e.g. angrau/entomology/chapter_02/practice/mcq/easy.json)")
    parser.add_argument("--all",     action="store_true", help="Sync all content")
    parser.add_argument("--university", default="angrau",    help="University folder (default: angrau)")
    parser.add_argument("--subject",    default="entomology", help="Subject folder (default: entomology)")
    parser.add_argument("--dry-run", action="store_true",  help="Print commands without executing")
    args = parser.parse_args()

    if not any([args.chapter, args.file, args.all]):
        parser.print_help()
        return

    if args.dry_run:
        print("⚠️  DRY RUN — no files will be uploaded\n")

    if args.all:
        sync_all(args.dry_run)
    elif args.chapter:
        sync_chapter(args.chapter, args.university, args.subject, args.dry_run)
    elif args.file:
        sync_file(args.file, args.dry_run)


if __name__ == "__main__":
    main()
