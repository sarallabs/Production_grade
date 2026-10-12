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
    """chapter.json and anything under media/ are valid but are not tools."""
    reg = load_json("tools.json")
    return chapter_rel_path in reg.get("chapterMetaFiles", []) or chapter_rel_path.startswith("media/")
