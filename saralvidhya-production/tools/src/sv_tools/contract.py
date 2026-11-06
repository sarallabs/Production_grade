"""Contract loader: reads contract/v1 (schemas + tools.json) and classifies files into tools.

This module holds NO tool or path knowledge of its own. Everything comes from
contract/v1/tools.json, which the backend and frontend also read.
"""
import json
import re
from functools import lru_cache
from pathlib import Path
from typing import Any, Dict, List, Optional, Tuple

CONTRACT_DIR = Path(__file__).resolve().parents[3].parent / "contract" / "v1"
if not CONTRACT_DIR.exists():  # editable-install fallback
    CONTRACT_DIR = Path(__file__).resolve().parents[2].parent / "contract" / "v1"


@lru_cache(maxsize=None)
def load_json(name: str) -> Dict[str, Any]:
    with open(CONTRACT_DIR / name, "r", encoding="utf-8") as f:
        return json.load(f)


def load_schema(name: str) -> Dict[str, Any]:
    return load_json(f"{name}.schema.json")


def _compile(pattern: str, params: Dict[str, List[str]]) -> re.Pattern:
    """'read/quick/{persona}.md' -> regex with named groups. Known params match their allowed
    values; unknown placeholders match a safe slug."""
    out, pos = "", 0
    for m in re.finditer(r"\{(\w+)\}", pattern):
        out += re.escape(pattern[pos:m.start()])
        name = m.group(1)
        allowed = params.get(name)
        out += f"(?P<{name}>{'|'.join(map(re.escape, allowed))})" if allowed else f"(?P<{name}>[A-Za-z0-9_-]+)"
        pos = m.end()
    out += re.escape(pattern[pos:])
    return re.compile(f"^{out}$")


@lru_cache(maxsize=None)
def _matchers() -> List[Tuple[str, re.Pattern]]:
    reg = load_json("tools.json")
    params = dict(reg.get("params", {}))
    params.setdefault("ext", reg.get("assets", {}).get("allowedAudio", ["m4a", "mp3"]))
    return [(t["id"], _compile(p, params)) for t in reg["tools"] for p in t["patterns"]]


def tool_registry() -> List[Dict[str, Any]]:
    return load_json("tools.json")["tools"]


def classify(chapter_rel_path: str) -> Optional[str]:
    """Return the tool id a chapter-relative path belongs to, or None if it is not a tool file."""
    for tool_id, rx in _matchers():
        if rx.match(chapter_rel_path):
            return tool_id
    return None


def is_chapter_support_file(chapter_rel_path: str) -> bool:
    """chapter.json and anything under chapterSupportPrefixes (e.g. media/, practice/flashcards/images/) are valid support files."""
    reg = load_json("tools.json")
    prefixes = reg.get("assets", {}).get("chapterSupportPrefixes", ["media/"])
    return (
        chapter_rel_path in reg.get("chapterMetaFiles", ["chapter.json"])
        or any(chapter_rel_path.startswith(p) for p in prefixes)
    )


def is_subject_support_file(subject_rel_path: str) -> bool:
    """subject.json and anything under <subjectId>/assets/ are valid subject-level files."""
    reg = load_json("tools.json")
    return (
        subject_rel_path in reg.get("subjectMetaFiles", ["subject.json"])
        or subject_rel_path.startswith("assets/")
    )


def is_tenant_support_file(tenant_rel_path: str) -> bool:
    """tenant.json and anything under root assets/ are valid tenant-level files."""
    reg = load_json("tools.json")
    return (
        tenant_rel_path in reg.get("tenantMetaFiles", ["tenant.json"])
        or tenant_rel_path.startswith("assets/")
    )

