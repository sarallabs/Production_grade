#!/usr/bin/env python3
"""Clean podcast markdown scripts for TTS (single-voice or dual-host)."""

from __future__ import annotations

import argparse
import re
import sys
from pathlib import Path

ROOT_DEFAULT = Path("public/generated_resources/neb_nepal")

SPEAKER_LINE = re.compile(
    r"^(Man|Woman|Host|Guest|Bot|Girl|Boy|Speaker|Narrator|AI|Assistant)\s*:\s*(.*)$",
    re.IGNORECASE,
)
PERSONA_LINE = re.compile(
    r"^(Hi,?\s+)?I['']?m\s+(your\s+)?(AI\s+)?(assistant|bot|host)\b|"
    r"^I am a (bot|girl|boy|AI)\b|"
    r"I['']?m your host\b|"
    r"^This (episode|dialogue|podcast) (was|is) (generated|created) by\b|"
    r"Welcome to .+, the podcast that",
    re.IGNORECASE,
)
PERSONA_INLINE = re.compile(
    r"\[Boy's Name\]|\[Girl's Name\]|I'm your host,?",
    re.IGNORECASE,
)


def strip_markdown_inline(text: str) -> str:
    text = re.sub(r"\*\*([^*]+)\*\*", r"\1", text)
    text = re.sub(r"\*([^*]+)\*", r"\1", text)
    text = text.replace("`", "")
    return re.sub(r"\s+", " ", text).strip()


def normalize_label(label: str) -> str:
    s = label.strip().lower()
    if s in ("woman", "girl", "guest"):
        return "Woman"
    return "Man"


def clean_line_single(line: str) -> str | None:
    raw = line.rstrip()
    if not raw.strip():
        return None
    if PERSONA_LINE.search(raw.strip()):
        return None
    cleaned = SPEAKER_LINE.sub(r"\2", raw.strip())
    cleaned = strip_markdown_inline(cleaned)
    cleaned = PERSONA_INLINE.sub("", cleaned).strip()
    return cleaned or None


def strip_persona_artifacts(text: str) -> str:
    text = PERSONA_INLINE.sub("", text)
    text = re.sub(r"^And I'?m(?:\s+\[[^\]]+\])?\s*!\s*", "", text, flags=re.I)
    text = re.sub(r"^And I'?m\s*!\s*", "", text, flags=re.I)
    text = re.sub(r"^And I'?m\.\s*", "", text, flags=re.I)
    text = re.sub(r",\s*!\s*", ". ", text)
    text = re.sub(r"\s+!\s+", ". ", text)
    text = re.sub(r"\s+", " ", text).strip()
    if re.match(r"^And I'?m\s*!?\s*\.?$", text, re.I):
        return ""
    return text


def is_persona_body(body: str) -> bool:
    return bool(PERSONA_LINE.search(body) or re.search(r"Welcome to .+, the podcast that", body, re.I))


def clean_line_dual(line: str, *, hide_labels: bool = False) -> str | None:
    raw = line.rstrip()
    if not raw.strip():
        return None
    if PERSONA_LINE.search(raw.strip()):
        return None
    m = SPEAKER_LINE.match(raw.strip())
    if m:
        label, body = m.group(1), m.group(2)
        body = strip_markdown_inline(body)
        if is_persona_body(body):
            return None
        body = strip_persona_artifacts(body)
        if not body or len(body) < 3:
            return None
        if hide_labels:
            return body
        return f"{normalize_label(label)}: {body}"
    body = strip_markdown_inline(raw.strip())
    body = strip_persona_artifacts(body)
    if not body or len(body) < 3:
        return None
    return body


def clean_text(text: str, *, dual_voice: bool, hide_labels: bool = False) -> str:
    if dual_voice or hide_labels:
        lines: list[str] = []
        for raw in text.splitlines():
            part = clean_line_dual(raw, hide_labels=hide_labels)
            if part is None:
                continue
            lines.append(part)
        out = "\n\n".join(lines)
        return out + ("\n" if text.endswith("\n") else "")

    paragraphs: list[str] = []
    current: list[str] = []
    for raw in text.splitlines():
        part = clean_line_single(raw)
        if part is None:
            if current:
                paragraphs.append(" ".join(current))
                current = []
            continue
        current.append(part)
    if current:
        paragraphs.append(" ".join(current))
    return "\n\n".join(paragraphs) + ("\n" if text.endswith("\n") else "")


def iter_script_paths(root: Path) -> list[Path]:
    paths: list[Path] = []
    seen_parents: set[tuple[Path, str]] = set()
    for p in sorted(root.rglob("*.md")):
        name = p.name.lower()
        kind: str | None = None
        if name == "short_podcast.md" or ("short" in name and "podcast" in name):
            kind = "short"
        elif name == "long_podcast.md" or ("long" in name and "podcast" in name):
            kind = "long"
        if kind is None:
            continue
        key = (p.parent, kind)
        if key in seen_parents:
            continue
        seen_parents.add(key)
        canonical = p.parent / f"{kind}_podcast.md"
        paths.append(canonical if canonical.is_file() else p)
    return paths


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--root", type=Path, default=ROOT_DEFAULT)
    ap.add_argument("--dual-voice", action="store_true")
    ap.add_argument(
        "--hide-labels",
        action="store_true",
        help="Dual-voice persona strip; output body only (no Man:/Woman: prefixes)",
    )
    ap.add_argument("--dry-run", action="store_true")
    args = ap.parse_args()

    root = args.root.resolve()
    if not root.is_dir():
        print(f"Root not found: {root}", file=sys.stderr)
        return 1

    changed = 0
    for path in iter_script_paths(root):
        old = path.read_text(encoding="utf-8")
        new = clean_text(
            old,
            dual_voice=args.dual_voice,
            hide_labels=args.hide_labels,
        )
        if new == old and path.name in ("short_podcast.md", "long_podcast.md"):
            continue
        kind = "short" if "short" in path.name.lower() else "long"
        out = path.parent / f"{kind}_podcast.md"
        changed += 1
        rel = out.relative_to(root)
        if args.hide_labels:
            mode = "hide-labels"
        elif args.dual_voice:
            mode = "dual-voice"
        else:
            mode = "single-voice"
        print(f"{'[dry-run] ' if args.dry_run else ''}updated ({mode}): {rel}")
        if not args.dry_run:
            out.write_text(new, encoding="utf-8", newline="\n")
            if path.resolve() != out.resolve() and path.is_file():
                path.unlink()

    print(f"{'[dry-run] ' if args.dry_run else ''}changed: {changed}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
