#!/usr/bin/env python3
"""
Strip generator-style preambles from NEB Nepal markdown (public/generated_resources/neb_nepal).

Usage:
  python scripts/strip_neb_ai_intros.py --root public/generated_resources/neb_nepal --stage 1
  python scripts/strip_neb_ai_intros.py --root public/generated_resources/neb_nepal --stage 2
  ...
  python scripts/strip_neb_ai_intros.py --root public/generated_resources/neb_nepal --stage all

Stages match the plan: 1=quiz, 2=video_script, 3=question_bank, 4=detailed_view, 5=summary, 6=podcast md
"""

from __future__ import annotations

import argparse
import re
import sys
from pathlib import Path

ROOT_DEFAULT = Path("public/generated_resources/neb_nepal")

QUIZ_LINE1 = re.compile(
    r"^(Here'?s a |Here is a |Here is an |Here is the |This quiz is designed)",
    re.IGNORECASE,
)

QB_LINE1 = re.compile(
    r"^(Here'?s a |Here is a |Here is an |Here is the |This question bank is designed|This expert-level question bank)",
    re.IGNORECASE,
)

QB_AFTER_HEADING = re.compile(r"^This question bank is designed", re.IGNORECASE)

QB_TOP_META_PARA = re.compile(
    r"^This question bank is designed for high-achieving|^This question bank is designed to assess|^This question bank is designed to challenge",
    re.IGNORECASE,
)

HR_LINE = re.compile(r"^\s*(---+|\*\*\*+|___+)\s*$")

HEADING = re.compile(r"^#{1,6}\s")


def _strip_leading_blank_lines(lines: list[str]) -> list[str]:
    i = 0
    while i < len(lines) and lines[i].strip() == "":
        i += 1
    return lines[i:]


def strip_quiz(text: str) -> str | None:
    lines = text.splitlines()
    lines = _strip_leading_blank_lines(lines)
    if not lines:
        return None
    if not QUIZ_LINE1.match(lines[0]):
        return None
    del lines[0]
    lines = _strip_leading_blank_lines(lines)
    if lines and HR_LINE.match(lines[0]):
        del lines[0]
        lines = _strip_leading_blank_lines(lines)
    return "\n".join(lines) + ("\n" if text.endswith("\n") else "")


def strip_question_bank(text: str) -> str | None:
    original = text
    lines = text.splitlines()
    lines = _strip_leading_blank_lines(lines)
    if not lines:
        return None
    changed = False
    if QB_LINE1.match(lines[0]):
        del lines[0]
        changed = True
        lines = _strip_leading_blank_lines(lines)
        if lines and HR_LINE.match(lines[0]):
            del lines[0]
            changed = True
            lines = _strip_leading_blank_lines(lines)
    # Remove meta paragraph immediately after top heading (## ...) before first --- 
    lines = _strip_leading_blank_lines(lines)
    if len(lines) >= 3 and HEADING.match(lines[0]):
        j = 1
        while j < len(lines) and lines[j].strip() == "":
            j += 1
        if j < len(lines) and QB_AFTER_HEADING.match(lines[j]):
            k = j
            while k < len(lines) and lines[k].strip() != "":
                k += 1
            del lines[j:k]
            changed = True
            lines = _strip_leading_blank_lines(lines)
            if lines and HR_LINE.match(lines[0]):
                del lines[0]
                changed = True
                lines = _strip_leading_blank_lines(lines)
    # Remove near-top "This question bank is designed..." paragraph (e.g. under ## Introduction)
    lines2 = list(lines)
    lines2 = _strip_leading_blank_lines(lines2)
    for idx, line in enumerate(lines2[:60]):
        if QB_TOP_META_PARA.match(line.strip()):
            k = idx
            while k < len(lines2) and lines2[k].strip() != "":
                k += 1
            del lines2[idx:k]
            changed = True
            lines2 = _strip_leading_blank_lines(lines2)
            if lines2 and HR_LINE.match(lines2[0]):
                del lines2[0]
                lines2 = _strip_leading_blank_lines(lines2)
            break
    if not changed:
        return None
    return "\n".join(lines2) + ("\n" if original.endswith("\n") else "")


VIDEO_PREAMBLE_OK = re.compile(
    r"(Here'?s a scene-by-scene|Here'?s an easy-level|Here'?s an expert-level|"
    r"Here is a .*scene-by-scene|Here is an .*scene-by-scene|"
    r"Here is a moderate-level AI video|Here is an easy-level scene-by-scene|"
    r"Here is an expert-level, scene-by-scene|Here is an easy-level, scene-by-scene|"
    r"This video script is designed|This script is designed)",
    re.IGNORECASE | re.DOTALL,
)


def strip_video_script(text: str) -> str | None:
    lines = text.splitlines()
    if not lines:
        return None
    # Find first horizontal rule
    first_hr = None
    for i, line in enumerate(lines):
        if HR_LINE.match(line):
            first_hr = i
            break
    if first_hr is None:
        return None
    preamble = "\n".join(lines[:first_hr])
    if not VIDEO_PREAMBLE_OK.search(preamble):
        return None
    # Only strip if preamble is "short" (avoid deleting mid-file --- by mistake)
    if first_hr > 25:
        return None
    new_lines = lines[first_hr + 1 :]
    new_lines = _strip_leading_blank_lines(new_lines)
    return "\n".join(new_lines) + ("\n" if text.endswith("\n") else "")


DET_VIEW_PREAMBLE = re.compile(
    r"(Here is a STANDARD-LEVEL|This expert-level, detailed view is tailored|"
    r"This expert-level view is designed|This detailed view is tailored|"
    r"Let'?s make learning|Here is an EASY-LEVEL|Here is a moderate-level detailed view|"
    r"Here is a STANDARD-LEVEL DETAILED VIEW)",
    re.IGNORECASE | re.DOTALL,
)


def strip_detailed_view(text: str) -> str | None:
    lines = text.splitlines()
    if not lines:
        return None
    heading_idx = None
    for i, line in enumerate(lines):
        if HEADING.match(line):
            heading_idx = i
            break
    if heading_idx is None:
        return None
    hr_idx = None
    for i in range(0, heading_idx):
        if HR_LINE.match(lines[i]):
            hr_idx = i
            break
    if hr_idx is not None:
        preamble = "\n".join(lines[:hr_idx])
        if DET_VIEW_PREAMBLE.search(preamble):
            new_lines = lines[hr_idx + 1 :]
            new_lines = _strip_leading_blank_lines(new_lines)
            return "\n".join(new_lines) + ("\n" if text.endswith("\n") else "")
    # Single-line wrappers (no --- before heading)
    first = lines[0].strip()
    if DET_VIEW_PREAMBLE.search(first):
        # Only remove first line if it's clearly a wrapper sentence (long meta line)
        if len(first) < 300 and "\n" not in lines[0]:
            del lines[0]
            lines = _strip_leading_blank_lines(lines)
            if lines and HR_LINE.match(lines[0]):
                del lines[0]
                lines = _strip_leading_blank_lines(lines)
            return "\n".join(lines) + ("\n" if text.endswith("\n") else "")
    return None


SUMMARY_HOOK = re.compile(
    r"^(Imagine |Let'?s |Science is like|Welcome to|Today,? we)",
    re.IGNORECASE,
)


def strip_summary(text: str) -> str | None:
    lines = text.splitlines()
    lines = _strip_leading_blank_lines(lines)
    if not lines:
        return None
    if not SUMMARY_HOOK.match(lines[0]):
        return None
    # Remove first paragraph (non-empty lines until first blank line)
    i = 0
    while i < len(lines) and lines[i].strip() != "":
        i += 1
    lines = lines[i:]
    lines = _strip_leading_blank_lines(lines)
    if not lines:
        return None
    if not HEADING.match(lines[0]):
        lines.insert(0, "## Summary")
        lines.insert(1, "")
    return "\n".join(lines) + ("\n" if text.endswith("\n") else "")


PODCAST_TITLE_LINE = re.compile(
    r"^Class \d+ .* \((?:dialogue|recap|intermediate recap|beginner-level dialogue|intermediate dialogue|advanced dialogue|advanced long dialogue|short dialogue)\)\.?\s*$",
    re.IGNORECASE,
)

SPEAKER_LINE = re.compile(r"^(Man|Woman|Bot|Girl)\s*:", re.IGNORECASE)

CLASS_TITLE_ONLY = re.compile(r"^Class \d+ .+\.\s*$", re.IGNORECASE)


def strip_podcast_meta(text: str) -> str | None:
    lines = text.splitlines()
    lines = _strip_leading_blank_lines(lines)
    if not lines:
        return None
    changed = False
    if PODCAST_TITLE_LINE.match(lines[0]):
        del lines[0]
        changed = True
    elif CLASS_TITLE_ONLY.match(lines[0]):
        tmp = _strip_leading_blank_lines(lines[1:])
        if tmp and SPEAKER_LINE.match(tmp[0]):
            del lines[0]
            changed = True
    if not changed:
        return None
    lines = _strip_leading_blank_lines(lines)
    return "\n".join(lines) + ("\n" if text.endswith("\n") else "")


def iter_files(root: Path, glob: str) -> list[Path]:
    return sorted(root.rglob(glob))


def process_stage(root: Path, stage: int, dry_run: bool) -> tuple[int, int]:
    changed = 0
    scanned = 0

    def write_if_changed(path: Path, new_text: str | None) -> None:
        nonlocal changed, scanned
        scanned += 1
        if new_text is None:
            return
        old = path.read_text(encoding="utf-8")
        if old == new_text:
            return
        changed += 1
        if not dry_run:
            path.write_text(new_text, encoding="utf-8", newline="\n")
        print(f"{'[dry-run] ' if dry_run else ''}updated: {path.relative_to(root)}")

    if stage == 1:
        for path in iter_files(root, "**/quiz.md"):
            write_if_changed(path, strip_quiz(path.read_text(encoding="utf-8")))
    elif stage == 2:
        for path in iter_files(root, "**/video_script.md"):
            write_if_changed(path, strip_video_script(path.read_text(encoding="utf-8")))
    elif stage == 3:
        for path in iter_files(root, "**/question_bank.md"):
            write_if_changed(path, strip_question_bank(path.read_text(encoding="utf-8")))
    elif stage == 4:
        for path in iter_files(root, "**/detailed_view.md"):
            write_if_changed(path, strip_detailed_view(path.read_text(encoding="utf-8")))
    elif stage == 5:
        for path in iter_files(root, "**/summary.md"):
            write_if_changed(path, strip_summary(path.read_text(encoding="utf-8")))
    elif stage == 6:
        for path in root.rglob("*.md"):
            name = path.name.lower()
            if "long_podcast" not in name and "short_podcast" not in name:
                continue
            write_if_changed(path, strip_podcast_meta(path.read_text(encoding="utf-8")))
    else:
        raise SystemExit(f"Unknown stage: {stage}")

    return scanned, changed


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--root", type=Path, default=ROOT_DEFAULT)
    ap.add_argument("--stage", required=True, help="1-6 or 'all'")
    ap.add_argument("--dry-run", action="store_true")
    args = ap.parse_args()
    root: Path = args.root
    if not root.is_dir():
        print(f"Root not found: {root}", file=sys.stderr)
        sys.exit(1)
    stages = list(range(1, 7)) if args.stage == "all" else [int(args.stage)]
    total_changed = 0
    for st in stages:
        scanned, changed = process_stage(root, st, args.dry_run)
        print(f"stage {st}: scanned={scanned} changed={changed}")
        total_changed += changed
    print(f"total changed: {total_changed}")


if __name__ == "__main__":
    main()
