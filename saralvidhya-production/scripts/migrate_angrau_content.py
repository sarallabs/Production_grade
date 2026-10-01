# -*- coding: utf-8 -*-
"""
ANGRAU Content Migration Script
================================
Reads the messy existing structure from saralvidhya-mvp/public/generated_resources/angrau/
Writes a clean canonical structure to saralvidhya-production/content/angrau/entomology/

CANONICAL OUTPUT SCHEMA (per chapter/level):
  {university}/{subject}/chapter_{nn}/{level}/summary.md
  {university}/{subject}/chapter_{nn}/{level}/flashcards.json
  {university}/{subject}/chapter_{nn}/{level}/mindmap.json
  {university}/{subject}/chapter_{nn}/{level}/quiz.json
  {university}/{subject}/chapter_{nn}/metadata.json

READS FROM (never modified):
  saralvidhya-mvp/public/generated_resources/angrau/

WRITES TO (new clean structure):
  saralvidhya-production/content/angrau/entomology/

Run: python scripts/migrate_angrau_content.py
"""

import sys
import os
import json
import shutil
from pathlib import Path

sys.stdout.reconfigure(encoding='utf-8')

# ── Paths ─────────────────────────────────────────────────────────────────────
SOURCE_ROOT = Path(r"d:\SV-Medha_ production_grade\saralvidhya-mvp\public\generated_resources\angrau")
DEST_ROOT   = Path(r"d:\SV-Medha_ production_grade\saralvidhya-production\content\angrau\entomology")

LEVELS   = ["beginner", "intermediate", "advanced"]
CHAPTERS = ["chapter_01", "chapter_02", "chapter_03", "chapter_04"]

# ── File resolution maps ───────────────────────────────────────────────────────
# Maps canonical filename -> ordered list of source paths to try (relative to chapter/level dir)
# Mirrors exactly what getResourceFileCandidates() does in the MVP code — but we do it once,
# at migration time, not at runtime on every page load.

def get_source_candidates(canonical_file: str, level: str) -> list:
    """
    Returns candidate source paths relative to the chapter root dir.
    Covers ALL actual paths found in the ANGRAU folder scan.
    """
    assessment_level = "easy" if level == "beginner" else ("hard" if level == "advanced" else "medium")
    lv = level  # beginner / intermediate / advanced

    candidates = {
        "summary.md": [
            f"{lv}/Learn/Quick_Summary/quick_summary_{lv}.md",
            f"{lv}/Read/Quick_Summary/quick_summary_{lv}.md",
            f"{lv}/Reading/Quick Study/quick_summary_{lv}.md",
            f"{lv}/summary.md",
            f"{lv}/quick_summary_{lv}.md",
        ],
        "flashcards.json": [
            # JSON first (preferred)
            f"{lv}/flashcards.json",
            f"{lv}/flashcards_{lv}.json",
            f"{lv}/Learn/Flashcards/flashcards.json",
            f"{lv}/Learn/Flashcards/flashcards_{lv}.json",
            # MD fallback — all actual paths found in scan
            f"{lv}/flashcards_{lv}.md",
            f"{lv}/flashcards.md",
            f"{lv}/Learn/Flashcards/flashcards_{lv}.md",
            f"Practice/Revise (Flashcards)/flashcards_{lv}.md",
            f"Practice/Revise (Flashcards)/flashcards_revise.md",
            f"{lv}/prep_flashcards.md",
            "prep_flashcards.md",
            "flashcards.md",
        ],
        "mindmap.json": [
            f"{lv}/Learn/Mindmaps/mindmap.json",
            f"{lv}/Learn/Mindmaps/mindmap_{lv}.json",
            f"{lv}/mindmap.json",
            f"{lv}/Learn/Mindmaps/mindmap.md",
            f"{lv}/mindmap.md",
        ],
        "quiz.json": [
            # JSON first
            f"{lv}/quiz.json",
            f"{lv}/question_bank.json",
            f"{lv}/Learn/Assessments/MCQ/mcq_{assessment_level}.json",
            # MD fallback — all actual paths found in scan
            f"{lv}/quiz.md",
            f"{lv}/mcq.md",
            f"{lv}/assessment.md",
            f"{lv}/question_bank.md",
            f"{lv}/Learn/Assessments/MCQ/mcq_{assessment_level}.md",
            f"Practice/Assessments/MCQ/mcq_{assessment_level}.md",
            f"Practice/Assessments/MCQ/{assessment_level}_mcq_10.md",
            f"Practice/Question Bank/question_bank.md",
            "question_bank.md",
        ],
    }
    return candidates.get(canonical_file, [f"{lv}/{canonical_file}"])


def find_source_file(chapter_path: Path, candidates: list) -> Path | None:
    """Try each candidate path, return the first one that exists."""
    for candidate in candidates:
        full = chapter_path / candidate
        if full.exists():
            return full
    return None


# ── Migration logic ────────────────────────────────────────────────────────────

def migrate():
    print("=" * 70)
    print("  ANGRAU CONTENT MIGRATION")
    print("  Source: saralvidhya-mvp/public/generated_resources/angrau/")
    print("  Dest:   saralvidhya-production/content/angrau/entomology/")
    print("=" * 70)

    if not SOURCE_ROOT.exists():
        print(f"ERROR: Source not found: {SOURCE_ROOT}")
        return

    DEST_ROOT.mkdir(parents=True, exist_ok=True)

    canonical_files = ["summary.md", "flashcards.json", "mindmap.json", "quiz.json"]

    total_copied  = 0
    total_missing = 0
    report = {}

    for chapter in CHAPTERS:
        chapter_src  = SOURCE_ROOT / chapter
        chapter_dest = DEST_ROOT / chapter

        if not chapter_src.exists():
            print(f"\n[SKIP] {chapter} — source folder not found")
            continue

        chapter_dest.mkdir(parents=True, exist_ok=True)

        # Copy metadata.json
        meta_src = chapter_src / "metadata.json"
        if meta_src.exists():
            shutil.copy2(meta_src, chapter_dest / "metadata.json")
            print(f"\n[OK] {chapter}/metadata.json")
        else:
            print(f"\n[--] {chapter}/metadata.json  MISSING — will need to create")

        report[chapter] = {}

        for level in LEVELS:
            level_dest = chapter_dest / level
            level_dest.mkdir(parents=True, exist_ok=True)
            report[chapter][level] = {}

            print(f"\n  [{level}]")

            for canonical_file in canonical_files:
                candidates = get_source_candidates(canonical_file, level)
                source_file = find_source_file(chapter_src, candidates)

                if source_file:
                    dest_file = level_dest / canonical_file
                    shutil.copy2(source_file, dest_file)
                    rel = str(source_file.relative_to(SOURCE_ROOT))
                    print(f"    [OK] {canonical_file:20s} <- {rel}")
                    report[chapter][level][canonical_file] = str(source_file.relative_to(SOURCE_ROOT))
                    total_copied += 1
                else:
                    print(f"    [--] {canonical_file:20s}  NOT FOUND (needs generation)")
                    report[chapter][level][canonical_file] = None
                    total_missing += 1

        # ── Audio files — copy once at chapter level (not per level) ──────────
        podcasts_src = chapter_src / "Podcasts"
        podcasts_dest = chapter_dest / "podcasts"
        if podcasts_src.exists():
            podcasts_dest.mkdir(parents=True, exist_ok=True)
            audio_copied = 0
            for audio in sorted(podcasts_src.iterdir()):
                if audio.suffix.lower() in ['.m4a', '.mp3', '.wav', '.aac']:
                    size_mb = audio.stat().st_size / (1024*1024)
                    # Classify
                    name_lower = audio.name.lower()
                    if 'long' in name_lower:
                        dest_name = 'long_podcast.m4a'
                    elif 'short' in name_lower:
                        dest_name = 'short_podcast.m4a'
                    else:
                        dest_name = audio.name  # microcasts keep original name
                    shutil.copy2(audio, podcasts_dest / dest_name)
                    print(f"    [OK] podcasts/{dest_name:<40} ({size_mb:.1f} MB)")
                    audio_copied += 1
                    total_copied += 1
            if audio_copied == 0:
                print(f"    [--] podcasts/ — no audio files found in Podcasts/")
        else:
            print(f"    [--] podcasts/ — Podcasts/ folder not found")

    # ── Save migration report ──────────────────────────────────────────────────
    report_path = DEST_ROOT.parent.parent / "angrau_migration_report.json"
    with open(report_path, "w", encoding="utf-8") as f:
        json.dump({
            "source": str(SOURCE_ROOT),
            "destination": str(DEST_ROOT),
            "chapters": report,
            "summary": {
                "copied": total_copied,
                "missing": total_missing,
                "total": total_copied + total_missing
            }
        }, f, indent=2, default=str)

    print("\n" + "=" * 70)
    print(f"  DONE")
    print(f"  Copied  : {total_copied} files")
    print(f"  Missing : {total_missing} files (need AI generation or manual upload)")
    print(f"  Report  : {report_path}")
    print("=" * 70)
    print("\nNEXT STEPS:")
    print("  1. Review content/ folder — verify migrated files look correct")
    print("  2. For missing files — run AI generation pipeline")
    print("  3. Upload content/ to GCS: gsutil -m rsync -r content/ gs://saralvidhya-content/")
    print("  4. Upload podcasts separately (large files, direct GCS upload)")


if __name__ == "__main__":
    migrate()
