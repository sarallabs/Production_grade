# -*- coding: utf-8 -*-
"""
ANGRAU Content Audit Script
Scans the existing generated_resources/angrau folder and outputs:
1. What files exist per chapter/level
2. What's missing against the canonical schema
3. Loose folders at root that need to be categorized
"""

import sys
import os
import json
from pathlib import Path

# Force UTF-8 output on Windows
sys.stdout.reconfigure(encoding='utf-8')


# ── Config ───────────────────────────────────────────────────────────────────
ANGRAU_ROOT = Path(r"d:\SV-Medha_ production_grade\saralvidhya-mvp\public\generated_resources\angrau")

# Canonical files every level folder MUST have
CANONICAL_FILES = [
    "summary.md",
    "flashcards.json",
    "mindmap.json",
    "quiz.json",
    "podcast.mp3",
]

LEVELS = ["beginner", "intermediate", "advanced"]

# ── Helpers ──────────────────────────────────────────────────────────────────
def check_level(level_path: Path) -> dict:
    result = {}
    for f in CANONICAL_FILES:
        result[f] = (level_path / f).exists()
    return result

def find_all_files_recursive(folder: Path) -> list:
    """Finds all files recursively, returns relative paths."""
    files = []
    for p in folder.rglob("*"):
        if p.is_file():
            files.append(str(p.relative_to(folder)))
    return sorted(files)

# ── Main Audit ───────────────────────────────────────────────────────────────
def audit():
    print("=" * 80)
    print("  ANGRAU CONTENT AUDIT")
    print("=" * 80)

    if not ANGRAU_ROOT.exists():
        print(f"ERROR: ANGRAU root not found at {ANGRAU_ROOT}")
        return

    # 1. Find chapter folders vs loose folders
    all_items = list(ANGRAU_ROOT.iterdir())
    chapter_folders = sorted([d for d in all_items if d.is_dir() and d.name.startswith("chapter_")])
    loose_folders   = sorted([d for d in all_items if d.is_dir() and not d.name.startswith("chapter_")])
    root_files      = [f for f in all_items if f.is_file()]

    # 2. Audit each chapter
    audit_results = {}
    for chapter in chapter_folders:
        chapter_name = chapter.name
        audit_results[chapter_name] = {}
        
        # Check for metadata.json at chapter root
        audit_results[chapter_name]["metadata.json"] = (chapter / "metadata.json").exists()

        # List all subfolders in this chapter
        subfolders = [d.name for d in chapter.iterdir() if d.is_dir()]
        audit_results[chapter_name]["_subfolders"] = sorted(subfolders)

        for level in LEVELS:
            level_path = chapter / level
            if level_path.exists():
                audit_results[chapter_name][level] = check_level(level_path)
            else:
                audit_results[chapter_name][level] = None  # Level folder missing entirely

    # ── Print Chapter/Level Table ─────────────────────────────────────────────
    print("\n[*] CHAPTER × LEVEL × FILE STATUS")
    print("-" * 80)
    
    for chapter_name, data in audit_results.items():
        print(f"\n  [DIR] {chapter_name}")
        print(f"     Subfolders: {', '.join(data['_subfolders'])}")
        print(f"     metadata.json: {'YES' if data['metadata.json'] else 'NO MISSING'}")
        
        for level in LEVELS:
            level_data = data.get(level)
            if level_data is None:
                print(f"     [{level:12s}] NO LEVEL FOLDER MISSING ENTIRELY")
            else:
                statuses = []
                for f in CANONICAL_FILES:
                    icon = "YES" if level_data[f] else "NO"
                    statuses.append(f"{icon}{f}")
                print(f"     [{level:12s}] " + "  ".join(statuses))

    # ── Summary Table ─────────────────────────────────────────────────────────
    print("\n\n[SUMMARY] SUMMARY (YES = exists, NO = missing)")
    print("-" * 80)
    header = f"{'Chapter':<12} {'Level':<14} " + "  ".join(f"{f[:10]:<12}" for f in CANONICAL_FILES)
    print(header)
    print("-" * 80)

    missing_count = 0
    total_count = 0

    for chapter_name, data in audit_results.items():
        for level in LEVELS:
            level_data = data.get(level)
            row = f"{chapter_name:<12} {level:<14} "
            if level_data is None:
                row += "NO (entire level folder missing)"
                missing_count += len(CANONICAL_FILES)
            else:
                for f in CANONICAL_FILES:
                    icon = "YES" if level_data[f] else "NO"
                    row += f"{icon:<14}"
                    if not level_data[f]:
                        missing_count += 1
            total_count += len(CANONICAL_FILES)
            print(row)

    print("-" * 80)
    print(f"  Total files needed : {total_count}")
    print(f"  Present            : {total_count - missing_count}")
    print(f"  Missing            : {missing_count}")
    print(f"  Completion         : {round((total_count - missing_count) / total_count * 100)}%")

    # ── Loose Folders ─────────────────────────────────────────────────────────
    print("\n\n[LOOSE]  LOOSE FOLDERS AT ANGRAU ROOT (not inside any chapter)")
    print("   These need to be either mapped to a chapter or deleted.\n")
    if loose_folders:
        for f in loose_folders:
            files_inside = find_all_files_recursive(f)
            print(f"   [DIR] {f.name}/ ({len(files_inside)} files)")
            for fp in files_inside[:5]:
                print(f"      - {fp}")
            if len(files_inside) > 5:
                print(f"      ... and {len(files_inside) - 5} more")
    else:
        print("   None — clean!")

    # ── Non-standard subfolders inside chapters ────────────────────────────────
    print("\n\n[WARN]  NON-STANDARD SUBFOLDERS INSIDE CHAPTERS")
    print("   (anything that's not beginner/intermediate/advanced)\n")
    standard = {"beginner", "intermediate", "advanced"}
    for chapter_name, data in audit_results.items():
        non_standard = [s for s in data["_subfolders"] if s.lower() not in standard]
        if non_standard:
            print(f"   {chapter_name}: {', '.join(non_standard)}")

    # ── Save JSON report ──────────────────────────────────────────────────────
    report_path = Path(r"d:\SV-Medha_ production_grade\saralvidhya-production") / "angrau_audit.json"
    with open(report_path, "w", encoding="utf-8") as f:
        json.dump({
            "chapters": audit_results,
            "loose_folders": [d.name for d in loose_folders],
            "summary": {
                "total_needed": total_count,
                "present": total_count - missing_count,
                "missing": missing_count,
                "completion_pct": round((total_count - missing_count) / total_count * 100)
            }
        }, f, indent=2, default=str)
    
    print(f"\n\n[SAVED] Full JSON report saved to: {report_path}")
    print("=" * 80)

if __name__ == "__main__":
    audit()
