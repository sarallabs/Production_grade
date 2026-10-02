# -*- coding: utf-8 -*-
"""
ANGRAU Content Migration Script  v2 — Canonical Schema
=======================================================
Canonical GCS Schema (mirrors UI section tabs exactly):

  {university}/{subject}/chapter_{nn}/
  ├── metadata.json
  ├── read/
  │   ├── quick/
  │   │   ├── beginner.md
  │   │   ├── intermediate.md
  │   │   └── advanced.md
  │   ├── detailed/
  │   │   ├── beginner.md
  │   │   ├── intermediate.md
  │   │   └── advanced.md
  │   ├── key_takeaways.md       (shared, no persona)
  │   └── glossary.md            (shared, where available)
  ├── learn/
  │   ├── mindmap.json           (shared)
  │   ├── mindmap.png            (optional visual)
  │   └── study_plan.md          (shared)
  ├── practice/
  │   ├── flashcards/
  │   │   ├── beginner.json      (persona as filename, NOT folder)
  │   │   ├── intermediate.json
  │   │   └── advanced.json
  │   ├── mcq/
  │   │   ├── easy.json          (difficulty as filename, NOT folder)
  │   │   ├── medium.json
  │   │   └── hard.json
  │   ├── msq/
  │   │   ├── easy.json
  │   │   ├── medium.json
  │   │   └── hard.json
  │   ├── mock_test.json         (shared)
  │   └── question_bank.json     (shared)
  ├── prepare/
  │   ├── pre_final_exam.json
  │   ├── certification_exam.json
  │   └── previous_year.json     (where available)
  └── podcasts/
      ├── microcast_01.m4a
      ├── microcast_01.md        (transcript)
      ├── short_podcast.m4a
      ├── short_podcast.md
      ├── long_podcast.m4a
      └── long_podcast.md

Rules:
  - Persona (beginner/intermediate/advanced) = FILENAME, never a folder
  - Difficulty (easy/medium/hard) = FILENAME, never a folder
  - Shared files (mindmap, key_takeaways, etc.) = single file, no persona

SOURCE: saralvidhya-mvp/public/generated_resources/angrau/   (READ ONLY)
DEST:   saralvidhya-production/content/angrau/entomology/
"""

import sys
import os
import json
import shutil
from pathlib import Path

sys.stdout.reconfigure(encoding='utf-8')

SOURCE_ROOT = Path(r"d:\SV-Medha_ production_grade\saralvidhya-mvp\public\generated_resources\angrau")
DEST_ROOT   = Path(r"d:\SV-Medha_ production_grade\saralvidhya-production\content\angrau\entomology")

CHAPTERS = ["chapter_01", "chapter_02", "chapter_03", "chapter_04"]
PERSONAS  = ["beginner", "intermediate", "advanced"]
DIFFS     = ["easy", "medium", "hard"]


# ── Utility ───────────────────────────────────────────────────────────────────

def first_existing(chapter_src: Path, candidates: list) -> Path | None:
    """Return the first path that exists, or None."""
    for c in candidates:
        p = chapter_src / c
        if p.exists():
            return p
    return None

def copy_file(src: Path, dest: Path, label: str, report: dict) -> bool:
    """Copy src → dest, print status, update report. Returns True if copied."""
    dest.parent.mkdir(parents=True, exist_ok=True)
    if src and src.exists():
        shutil.copy2(src, dest)
        size = src.stat().st_size / 1024
        print(f"    [OK] {label:<45} ({size:.0f}KB)")
        report[label] = str(src)
        return True
    else:
        print(f"    [--] {label:<45} NOT FOUND")
        report[label] = None
        return False


# ── Section: READ ─────────────────────────────────────────────────────────────

def migrate_read(ch_src: Path, ch_dest: Path, report: dict):
    print("\n  [read/]")
    report["read"] = {}

    # quick/{persona}.md
    for persona in PERSONAS:
        src = first_existing(ch_src, [
            f"Reading/Quick Study/quick_summary_{persona}.md",
            f"Reading/Quick Study/quick_summary_{persona}.json",
            f"beginner/summary.md" if persona == "beginner" else
            f"intermediate/summary.md" if persona == "intermediate" else
            f"advanced/summary.md",
        ])
        copy_file(src, ch_dest / "read/quick" / f"{persona}.md",
                  f"read/quick/{persona}.md", report["read"])

    # detailed/{persona}.md
    for persona in PERSONAS:
        src = first_existing(ch_src, [
            f"Reading/Detailed Study/detailed_summary_{persona}.md",
            f"Reading/Detailed Study/detailed_summary_{persona}.json",
            f"beginner/detailed_view.md" if persona == "beginner" else
            f"intermediate/detailed_view.md" if persona == "intermediate" else
            f"advanced/detailed_view.md",
        ])
        copy_file(src, ch_dest / "read/detailed" / f"{persona}.md",
                  f"read/detailed/{persona}.md", report["read"])

    # key_takeaways.md (shared)
    src = first_existing(ch_src, [
        "Reading/Key Takeaways/key_takeaways.md",
        "Reading/Key Takeaways/key_takeaways.json",
        "Reading/key_takeaways.md",
        "key_takeaways.md",
    ])
    copy_file(src, ch_dest / "read/key_takeaways.md",
              "read/key_takeaways.md", report["read"])

    # glossary.md (shared, optional)
    src = first_existing(ch_src, [
        "Reading/Glossary/glossary.md",
        "Reading/Glossary/glossary.json",
        "glossary.md",
    ])
    if src:
        copy_file(src, ch_dest / "read/glossary.md",
                  "read/glossary.md", report["read"])


# ── Section: LEARN ────────────────────────────────────────────────────────────

def migrate_learn(ch_src: Path, ch_dest: Path, report: dict):
    print("\n  [learn/]")
    report["learn"] = {}

    # mindmap.json (shared)
    src = first_existing(ch_src, [
        "Foundation/Mind Maps/Pollination_Mindmap.json",
        "Foundation/Mind Maps/mindmap.json",
        "Foundation/Mind Maps/mindmap.md",
        "mindmap.json",
        "mindmap.md",
        "beginner/mindmap.md",
    ])
    copy_file(src, ch_dest / "learn/mindmap.json",
              "learn/mindmap.json", report["learn"])

    # mindmap.png (optional visual)
    src = first_existing(ch_src, [
        "Foundation/Mind Maps/Pollination_Mind Map.png",
        "Foundation/Mind Maps/mindmap.png",
        "mindmap.png",
    ])
    if src:
        copy_file(src, ch_dest / "learn/mindmap.png",
                  "learn/mindmap.png", report["learn"])

    # study_plan.md (shared)
    src = first_existing(ch_src, [
        "Foundation/Study Plan/study_plan.md",
        "Foundation/Study Plan/study_plan.json",
        "study_plan.md",
    ])
    copy_file(src, ch_dest / "learn/study_plan.md",
              "learn/study_plan.md", report["learn"])


# ── Section: PRACTICE ─────────────────────────────────────────────────────────

def migrate_practice(ch_src: Path, ch_dest: Path, report: dict):
    print("\n  [practice/]")
    report["practice"] = {}

    # flashcards/{persona}.json
    for persona in PERSONAS:
        src = first_existing(ch_src, [
            f"Practice/Revise (Flashcards)/flashcards_{persona}.json",
            f"Practice/Revise (Flashcards)/flashcards_{persona}.md",
            f"{persona}/flashcards.json",
            f"{persona}/flashcards_{persona}.json",
            f"{persona}/flashcards_{persona}.md",
            f"{persona}/flashcards.md",
        ])
        copy_file(src, ch_dest / "practice/flashcards" / f"{persona}.json",
                  f"practice/flashcards/{persona}.json", report["practice"])

    # mcq/{difficulty}.json
    diff_map = {"easy": ["easy", "easy_mcq_10"], "medium": ["medium", "medium_mcq_10", "med"], "hard": ["hard", "hard_mcq_10"]}
    for diff, aliases in diff_map.items():
        candidates = []
        for a in aliases:
            candidates += [
                f"Practice/Assessments/MCQ/mcq_{a}.json",
                f"Practice/Assessments/MCQ/mcq_{a}.md",
                f"Practice/Assessments/MCQ/{a}_mcq_10.json",
                f"Practice/Assessments/MCQ/{a}_mcq_10.md",
            ]
        candidates += [
            f"Learn/Assessments/MCQ/mcq_{diff}.json",
            f"Learn/Assessments/MCQ/mcq_{diff}.md",
        ]
        src = first_existing(ch_src, candidates)
        copy_file(src, ch_dest / "practice/mcq" / f"{diff}.json",
                  f"practice/mcq/{diff}.json", report["practice"])

    # msq/{difficulty}.json
    for diff, aliases in diff_map.items():
        candidates = []
        for a in aliases:
            candidates += [
                f"Practice/Assessments/MSQ/msq_{a}.json",
                f"Practice/Assessments/MSQ/msq_{a}.md",
                f"Practice/Assessments/MSQ/{a}_msq_10.json",
                f"Practice/Assessments/MSQ/{a}_msq_10.md",
            ]
        src = first_existing(ch_src, candidates)
        copy_file(src, ch_dest / "practice/msq" / f"{diff}.json",
                  f"practice/msq/{diff}.json", report["practice"])

    # mock_test.json (shared)
    src = first_existing(ch_src, [
        "Practice/Assessments/Mock_Test/mock_test_lec_5_weathering.json",
        "Practice/Assessments/Mock_Test/mock_test.json",
        "Practice/Assessments/Mock_Test/mock_test.md",
        "Prepare/Mock_Test/mock_test.json",
        "Prepare/Mock_Test/mock_test.md",
        "mock_test.md",
    ])
    if src:
        copy_file(src, ch_dest / "practice/mock_test.json",
                  "practice/mock_test.json", report["practice"])

    # question_bank.json (shared)
    src = first_existing(ch_src, [
        "Practice/Question Bank/question_bank.json",
        "Practice/Question Bank/question_bank.md",
        "question_bank.json",
        "question_bank.md",
    ])
    copy_file(src, ch_dest / "practice/question_bank.json",
              "practice/question_bank.json", report["practice"])


# ── Section: PREPARE ──────────────────────────────────────────────────────────

def migrate_prepare(ch_src: Path, ch_dest: Path, report: dict):
    print("\n  [prepare/]")
    report["prepare"] = {}

    # pre_final_exam.json
    src = first_existing(ch_src, [
        "Preparation/Prep. Exam/pre_final_exam_40.json",
        "Preparation/Prep. Exam/pre_final_exam.json",
        "Preparation/Prep. Exam/pre_final_exam.md",
        "pre_final_exam.md",
    ])
    if src:
        copy_file(src, ch_dest / "prepare/pre_final_exam.json",
                  "prepare/pre_final_exam.json", report["prepare"])

    # certification_exam.json
    src = first_existing(ch_src, [
        "Preparation/Prep. Exam/certification_exam_80.json",
        "Preparation/Prep. Exam/certification_exam.json",
        "Preparation/Prep. Exam/certification_exam.md",
        "certification_exam.md",
    ])
    if src:
        copy_file(src, ch_dest / "prepare/certification_exam.json",
                  "prepare/certification_exam.json", report["prepare"])

    # mock_test_prep.json (prep-style, larger exam)
    src = first_existing(ch_src, [
        "Preparation/Prep. Exam/mock_test_50.json",
        "Preparation/Prep. Exam/mock_test_50.md",
        "Prepare/Mock_Test/mock_test.json",
        "Prepare/Mock_Test/mock_test.md",
    ])
    if src:
        copy_file(src, ch_dest / "prepare/mock_test.json",
                  "prepare/mock_test.json", report["prepare"])


# ── Section: PODCASTS ─────────────────────────────────────────────────────────

def migrate_podcasts(ch_src: Path, ch_dest: Path, report: dict):
    print("\n  [podcasts/]")
    report["podcasts"] = {}

    podcasts_src = ch_src / "Podcasts"
    if not podcasts_src.exists():
        print("    [--] Podcasts/ folder not found")
        return

    transcripts_src = podcasts_src / "transcripts"
    (ch_dest / "podcasts").mkdir(parents=True, exist_ok=True)

    # Separate microcasts from long/short podcasts
    microcasts = []
    short_src = long_src = None

    for f in sorted(podcasts_src.iterdir()):
        if f.is_dir():
            continue
        if f.suffix.lower() not in ['.m4a', '.mp3', '.wav', '.aac']:
            continue
        name_lower = f.name.lower()
        if 'long' in name_lower:
            long_src = f
        elif 'short' in name_lower:
            short_src = f
        else:
            microcasts.append(f)

    # Copy microcasts + match transcripts
    for idx, audio in enumerate(microcasts, start=1):
        dest_audio = ch_dest / "podcasts" / f"microcast_{idx:02d}.m4a"
        shutil.copy2(audio, dest_audio)
        size = audio.stat().st_size / (1024*1024)
        print(f"    [OK] podcasts/microcast_{idx:02d}.m4a             ({size:.1f}MB) <- {audio.name}")
        report["podcasts"][f"microcast_{idx:02d}.m4a"] = audio.name

        # Match transcript by index
        if transcripts_src.exists():
            stem = audio.stem
            transcript_candidates = [
                transcripts_src / f"{stem}.md",
                transcripts_src / f"{stem}.json",
            ]
            transcript = next((t for t in transcript_candidates if t.exists()), None)
            if transcript:
                dest_t = ch_dest / "podcasts" / f"microcast_{idx:02d}.md"
                shutil.copy2(transcript, dest_t)
                print(f"    [OK] podcasts/microcast_{idx:02d}.md            (transcript)")
                report["podcasts"][f"microcast_{idx:02d}.md"] = transcript.name

    # Short podcast + transcript
    if short_src:
        dest = ch_dest / "podcasts" / "short_podcast.m4a"
        shutil.copy2(short_src, dest)
        size = short_src.stat().st_size / (1024*1024)
        print(f"    [OK] podcasts/short_podcast.m4a              ({size:.1f}MB)")
        report["podcasts"]["short_podcast.m4a"] = short_src.name
        if transcripts_src.exists():
            t = next((f for f in transcripts_src.iterdir()
                      if 'short' in f.name.lower() and f.suffix == '.md'), None)
            if t:
                shutil.copy2(t, ch_dest / "podcasts" / "short_podcast.md")
                print(f"    [OK] podcasts/short_podcast.md               (transcript)")

    # Long podcast + transcript
    if long_src:
        dest = ch_dest / "podcasts" / "long_podcast.m4a"
        shutil.copy2(long_src, dest)
        size = long_src.stat().st_size / (1024*1024)
        print(f"    [OK] podcasts/long_podcast.m4a               ({size:.1f}MB)")
        report["podcasts"]["long_podcast.m4a"] = long_src.name
        if transcripts_src.exists():
            t = next((f for f in transcripts_src.iterdir()
                      if 'long' in f.name.lower() and f.suffix == '.md'), None)
            if t:
                shutil.copy2(t, ch_dest / "podcasts" / "long_podcast.md")
                print(f"    [OK] podcasts/long_podcast.md                (transcript)")


# ── Main ──────────────────────────────────────────────────────────────────────

def migrate():
    print("=" * 70)
    print("  ANGRAU CONTENT MIGRATION  v2 — Canonical Schema")
    print("  chapter -> section -> tool -> content (persona as filename)")
    print("=" * 70)

    DEST_ROOT.mkdir(parents=True, exist_ok=True)
    full_report = {}

    for chapter in CHAPTERS:
        ch_src  = SOURCE_ROOT / chapter
        ch_dest = DEST_ROOT / chapter

        if not ch_src.exists():
            print(f"\n[SKIP] {chapter} — source not found")
            continue

        ch_dest.mkdir(parents=True, exist_ok=True)
        print(f"\n{'='*70}")
        print(f"  {chapter}")
        print(f"{'='*70}")
        full_report[chapter] = {}

        # metadata.json
        meta_src = ch_src / "metadata.json"
        if meta_src.exists():
            shutil.copy2(meta_src, ch_dest / "metadata.json")
            print(f"\n  [OK] metadata.json")

        migrate_read(ch_src, ch_dest, full_report[chapter])
        migrate_learn(ch_src, ch_dest, full_report[chapter])
        migrate_practice(ch_src, ch_dest, full_report[chapter])
        migrate_prepare(ch_src, ch_dest, full_report[chapter])
        migrate_podcasts(ch_src, ch_dest, full_report[chapter])

    # Report
    report_path = DEST_ROOT.parent.parent / "angrau_migration_report.json"
    with open(report_path, "w", encoding="utf-8") as f:
        json.dump({"schema": "v2-canonical", "chapters": full_report}, f, indent=2)

    print(f"\n{'='*70}")
    print(f"  DONE — report: {report_path}")
    print(f"{'='*70}")


if __name__ == "__main__":
    migrate()
