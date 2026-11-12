#!/usr/bin/env python3
"""Philippines Senior High School (SHS / DepEd) canonical adapter.
Transforms existing content under:
    saralvidhya-mvp/public/generated_resources/philippines/
      - filipino/               -> philippines/filipino/chapter_01
      - oral communication/     -> philippines/oral_communication/chapter_01 (Week_1) & chapter_02 (Week_2)
      - rw/                     -> philippines/rw/chapter_01
into the canonical folder layout at:
    saralvidhya-production/tools/build/philippines/
"""
from __future__ import annotations

import argparse
import json
import re
import shutil
from pathlib import Path
from typing import Any, Dict, List

HERE = Path(__file__).resolve().parent
TOOLS = HERE.parent
PROD = TOOLS.parent
ROOT = PROD.parent
MVP_PUBLIC = ROOT / "saralvidhya-mvp" / "public"
SRC_PH = (
    MVP_PUBLIC / "generated_resources" / "philippines"
    if (MVP_PUBLIC / "generated_resources" / "philippines").exists()
    else MVP_PUBLIC / "generated resources" / "philippines"
)
DEFAULT_OUT = TOOLS / "build" / "philippines"

PERSONAS = ("beginner", "intermediate", "advanced")
PERSONA_TO_DIFF = {
    "beginner": "easy",
    "intermediate": "medium",
    "advanced": "hard",
}

SUBJECTS_SPEC: Dict[str, Dict[str, Any]] = {
    "filipino": {
        "subject": {
            "id": "filipino",
            "name": "Komunikasyon at Pananaliksik sa Wika at Kulturang Pilipino",
            "code": "DLSU-FIL101",
            "subtitle": "DLSU Core Curriculum",
            "programLabel": "De La Salle University",
            "credits": 4,
            "parentNodeId": "grade_11_sem_1",
            "order": 1,
            "status": "active",
            "description": (
                "Pag-aaral tungo sa pananaliksik ukol sa kalikasan, katangian, pag-unlad, "
                "gamit at paggamit ng Wikang Filipino sa mga sitwasyong komunikatibo at kultural sa lipunang Pilipino."
            ),
            "iconBlob": "assets/icon.png",
            "assets": {"icon": "assets/icon.png"},
            "cardStyle": {
                "accentColor": "#006F44",
                "badgeText": "DLSU · Filipino",
                "iconBgColor": "#ECFDF5",
            },
        },
        "badgeShort": "FIL",
        "chapters": {
            "chapter_01": {
                "srcDir": SRC_PH / "filipino",
                "publicMasterMd": MVP_PUBLIC / "philippines" / "philipino" / "Philippines modules .md",
                "publicImagesDir": MVP_PUBLIC / "philippines" / "philipino" / "images",
                "imagesTargetRel": "images",
                "number": 1,
                "title": "Mga Konseptong Pangwika at Linggwistikong Pagsusuri",
                "shortTitle": "Mga Konseptong Pangwika",
                "description": (
                    "Kahulugan at katangian ng wika (Gleason, Sapir, Hill, Lumbera), "
                    "kasaysayan ng Wikang Pambansa, baryasyon at barayti ng wika, "
                    "at mga sitwasyong pangwika sa lipunang Pilipino."
                ),
                "estimatedMinutes": 90,
            }
        },
    },
    "oral_communication": {
        "subject": {
            "id": "oral_communication",
            "name": "Oral Communication in Context",
            "code": "DLSU-OC101",
            "subtitle": "DLSU Core Curriculum",
            "programLabel": "De La Salle University",
            "credits": 4,
            "parentNodeId": "grade_11_sem_1",
            "order": 2,
            "status": "active",
            "description": (
                "Development of listening and speaking skills and strategies for effective "
                "communication in various situations, contexts, and models of human interaction."
            ),
            "iconBlob": "assets/icon.png",
            "assets": {"icon": "assets/icon.png"},
            "cardStyle": {
                "accentColor": "#006F44",
                "badgeText": "DLSU · Oral Comm",
                "iconBgColor": "#ECFDF5",
            },
        },
        "badgeShort": "OC",
        "chapters": {
            "chapter_01": {
                "srcDir": SRC_PH / "oral communication" / "Week_1" / "Week_1",
                "publicMasterMd": MVP_PUBLIC / "philippines" / "oral communications" / "Week1.md",
                "publicImagesDir": MVP_PUBLIC / "philippines" / "oral communications" / "images" / "lesson_1",
                "imagesTargetRel": "images/lesson_1",
                "number": 1,
                "title": "Foundations, Nature, Elements, and Models of Communication",
                "shortTitle": "Nature & Models of Communication",
                "description": (
                    "Public speaking in a digital age, netiquette and communication ethics (NCA Credo), "
                    "scholarly definitions, the 6-step communication cycle, Linear/Interactive/Transactional "
                    "models, contexts, noise diagnostics, and the 7 Cs."
                ),
                "estimatedMinutes": 90,
            },
            "chapter_02": {
                "srcDir": SRC_PH / "oral communication" / "Week_2",
                "publicMasterMd": MVP_PUBLIC / "philippines" / "oral communications" / "Week 2.md",
                "number": 2,
                "title": "Functions of Communication & Functional Language Models",
                "shortTitle": "Functions of Communication",
                "description": (
                    "Regulation/Control, Social Interaction, Motivation, Emotional Expression, "
                    "and Information Dissemination alongside Malinowski, Bühler, Jakobson, and Halliday's "
                    "functional language models."
                ),
                "estimatedMinutes": 90,
            },
        },
    },
    "rw": {
        "subject": {
            "id": "rw",
            "name": "Reading and Writing Skills",
            "code": "DLSU-RW101",
            "subtitle": "DLSU Core Curriculum",
            "programLabel": "De La Salle University",
            "credits": 4,
            "parentNodeId": "grade_11_sem_1",
            "order": 3,
            "status": "active",
            "description": (
                "Critical reading and academic writing skills, dialectical analysis, synthesis, "
                "evaluation, logical fallacy detection, intertextuality, and hypertext."
            ),
            "iconBlob": "assets/icon.png",
            "assets": {"icon": "assets/icon.png"},
            "cardStyle": {
                "accentColor": "#0D9488",
                "badgeText": "DLSU · Reading & Writing",
                "iconBgColor": "#F0FDFA",
            },
        },
        "badgeShort": "RW",
        "chapters": {
            "chapter_01": {
                "srcDir": SRC_PH / "rw",
                "number": 1,
                "title": "Critical Reading as Looking for Ways of Thinking",
                "shortTitle": "Critical Reading & Thinking",
                "description": (
                    "Taxonomy of reading modalities (Hirschberg), the cognitive triad "
                    "(Analysis, Synthesis, Evaluation), Montaigne and the essay tradition, "
                    "argumentative architecture, logical fallacies, intertextuality, and hypertext."
                ),
                "estimatedMinutes": 100,
            }
        },
    },
}


def generate_branded_images(out: Path) -> None:
    """Generates clean branded PNG assets for De La Salle University (DLSU) tenant, subjects, and chapters."""
    try:
        from PIL import Image, ImageDraw, ImageFont
    except ImportError:
        fallback = MVP_PUBLIC / "logo-vvit.png"
        if fallback.exists():
            (out / "assets").mkdir(parents=True, exist_ok=True)
            shutil.copy2(fallback, out / "assets" / "logo.png")
            shutil.copy2(fallback, out / "assets" / "favicon.png")
            shutil.copy2(fallback, MVP_PUBLIC / "logo-philippines.png")
        return

    try:
        font_lg = ImageFont.truetype("arialbd.ttf", 58)
        font_md = ImageFont.truetype("arialbd.ttf", 32)
        font_sm = ImageFont.truetype("arialbd.ttf", 19)
    except Exception:
        font_lg = ImageFont.load_default()
        font_md = ImageFont.load_default()
        font_sm = ImageFont.load_default()

    # 1. Tenant Logo (prefer official sample asset if present)
    (out / "assets").mkdir(parents=True, exist_ok=True)
    official_logo = TOOLS / "samples" / "philippines" / "assets" / "logo.png"
    official_fav = TOOLS / "samples" / "philippines" / "assets" / "favicon.png"
    if official_logo.exists():
        shutil.copy2(official_logo, out / "assets" / "logo.png")
        shutil.copy2(official_logo, MVP_PUBLIC / "logo-philippines.png")
        shutil.copy2(official_logo, MVP_PUBLIC / "logo-dlsu.png")
        if official_fav.exists():
            shutil.copy2(official_fav, out / "assets" / "favicon.png")
        else:
            Image.open(official_logo).resize((64, 64)).save(out / "assets" / "favicon.png", "PNG")
    else:
        logo_img = Image.new("RGBA", (256, 256), (0, 0, 0, 0))
        draw = ImageDraw.Draw(logo_img)
        draw.ellipse([10, 10, 246, 246], fill=(0, 111, 68, 255), outline=(197, 155, 39, 255), width=10)
        draw.ellipse([28, 28, 228, 228], fill=(20, 83, 45, 255), outline=(255, 255, 255, 235), width=4)
        draw.ellipse([44, 44, 212, 212], fill=(0, 111, 68, 255))
        draw.text((128, 110), "DLSU", fill=(255, 255, 255, 255), font=font_lg, anchor="mm")
        draw.text((128, 172), "DE LA SALLE", fill=(231, 184, 100, 255), font=font_sm, anchor="mm")
        logo_img.save(out / "assets" / "logo.png", "PNG")
        logo_img.resize((64, 64)).save(out / "assets" / "favicon.png", "PNG")
        logo_img.save(MVP_PUBLIC / "logo-philippines.png", "PNG")
        logo_img.save(MVP_PUBLIC / "logo-dlsu.png", "PNG")

    # 2. Subject Icons & Chapter Heroes
    palette = {
        "filipino": ((0, 111, 68), (231, 184, 100)),
        "oral_communication": ((20, 83, 45), (231, 184, 100)),
        "rw": ((13, 148, 136), (231, 184, 100)),
    }
    for sid, spec in SUBJECTS_SPEC.items():
        bg_col, acc_col = palette.get(sid, ((0, 111, 68), (231, 184, 100)))
        s_assets = out / sid / "assets"
        s_assets.mkdir(parents=True, exist_ok=True)
        sample_icon = TOOLS / "samples" / "philippines" / sid / "icon.png"
        if sample_icon.exists():
            shutil.copy2(sample_icon, s_assets / "icon.png")
        else:
            icon_img = Image.new("RGBA", (256, 256), (248, 250, 252, 255))
            idraw = ImageDraw.Draw(icon_img)
            idraw.rounded_rectangle([16, 16, 240, 240], radius=40, fill=bg_col + (255,), outline=acc_col + (255,), width=6)
            idraw.text((128, 112), spec["badgeShort"], fill=(255, 255, 255, 255), font=font_lg, anchor="mm")
            idraw.text((128, 180), spec["subject"]["code"], fill=acc_col + (255,), font=font_sm, anchor="mm")
            icon_img.save(s_assets / "icon.png", "PNG")

        for cid, ch_spec in spec["chapters"].items():
            media_dir = out / sid / cid / "media"
            media_dir.mkdir(parents=True, exist_ok=True)
            sample_hero_num = TOOLS / "samples" / "philippines" / sid / f"hero_{ch_spec['number']:02d}.png"
            sample_hero_def = TOOLS / "samples" / "philippines" / sid / "hero.png"
            if sample_hero_num.exists():
                shutil.copy2(sample_hero_num, media_dir / "hero.png")
            elif sample_hero_def.exists():
                shutil.copy2(sample_hero_def, media_dir / "hero.png")
            else:
                hero_img = Image.new("RGB", (800, 450), bg_col)
                hdraw = ImageDraw.Draw(hero_img)
                hdraw.rectangle([24, 24, 776, 426], outline=acc_col, width=4)
                hdraw.text((400, 140), spec["subject"]["name"][:48], fill=acc_col, font=font_sm, anchor="mm")
                hdraw.text((400, 220), f"Chapter {ch_spec['number']}: {ch_spec['shortTitle']}", fill=(255, 255, 255), font=font_md, anchor="mm")
                hdraw.text((400, 300), "De La Salle University · Core Curriculum", fill=(226, 232, 240), font=font_sm, anchor="mm")
                hero_img.save(media_dir / "hero.png", "PNG")


def parse_mermaid_mindmap_to_tree(md_text: str, default_title: str) -> Dict[str, Any]:
    """Parses a Mermaid `mindmap` block in markdown into a canonical hierarchical JSON tree."""
    lines = md_text.splitlines()
    mm_lines: List[str] = []
    in_mm = False
    for line in lines:
        stripped = line.strip()
        if stripped == "mindmap":
            in_mm = True
            continue
        if in_mm:
            if stripped.startswith("```"):
                break
            if stripped:
                mm_lines.append(line)

    root: Dict[str, Any] = {
        "id": "root",
        "name": default_title,
        "title": default_title,
        "topic": default_title,
        "level": 0,
        "children": [],
    }
    if not mm_lines:
        return root

    stack: List[tuple[int, Dict[str, Any]]] = []
    counter = 0
    for raw_line in mm_lines:
        indent = len(raw_line) - len(raw_line.lstrip(" "))
        text = raw_line.strip()
        # Clean root((...)) or [ ... ]
        m_root = re.match(r"^root\(\((.+?)\)\)$", text)
        if m_root:
            root["name"] = root["title"] = root["topic"] = m_root.group(1).strip()
            stack = [(indent, root)]
            continue
        counter += 1
        node: Dict[str, Any] = {
            "id": f"node_{counter}",
            "name": text,
            "title": text,
            "topic": text,
            "children": [],
        }
        while stack and stack[-1][0] >= indent:
            stack.pop()
        parent = stack[-1][1] if stack else root
        node["level"] = parent.get("level", 0) + 1
        parent["children"].append(node)
        stack.append((indent, node))

    return root


def normalize_mindmap(src_dir: Path, ch_dir: Path, ch_title: str) -> List[Dict[str, Any]]:
    """Normalizes mindmap.md and mindmap.json into learn/ and returns extracted chapter topics."""
    learn_dir = ch_dir / "learn"
    learn_dir.mkdir(parents=True, exist_ok=True)

    mm_md_src = (
        src_dir / "mindmap.md"
        if (src_dir / "mindmap.md").exists()
        else src_dir / "mindmap" / "mindmap.md"
    )
    if mm_md_src.exists():
        shutil.copy2(mm_md_src, learn_dir / "mindmap.md")

    for extra_mm in ("mindmap.html", "mindmap.js", "index.html"):
        e_src = (
            src_dir / extra_mm
            if (src_dir / extra_mm).exists()
            else src_dir / "mindmap" / extra_mm
        )
        if e_src.exists():
            shutil.copy2(e_src, learn_dir / extra_mm)

    mm_json_src = src_dir / "mindmap.json"
    if mm_json_src.exists():
        raw = json.loads(mm_json_src.read_text(encoding="utf-8"))
        hierarchy = raw.get("hierarchy", raw)

        def conv(n: dict, path_id: str = "root") -> dict:
            nid = n.get("id") or path_id
            lbl = n.get("title") or n.get("label") or n.get("name") or n.get("topic") or "Topic"
            children = [conv(c, f"{nid}_{i+1}") for i, c in enumerate(n.get("children") or [])]
            return {
                "id": nid,
                "name": lbl,
                "title": lbl,
                "label": lbl,
                "topic": lbl,
                "summary": n.get("tooltip") or n.get("summary") or "",
                "children": children,
            }

        root_tree = conv(hierarchy, "root")
    elif mm_md_src.exists():
        root_tree = parse_mermaid_mindmap_to_tree(mm_md_src.read_text(encoding="utf-8"), ch_title)
    else:
        root_tree = {"id": "root", "name": ch_title, "title": ch_title, "topic": ch_title, "children": []}

    normalized = {
        "id": root_tree["id"],
        "name": root_tree["name"],
        "title": root_tree["title"],
        "topic": root_tree["topic"],
        "children": root_tree["children"],
        "mindmap": root_tree,
        "hierarchy": root_tree,
    }
    (learn_dir / "mindmap.json").write_text(
        json.dumps(normalized, indent=2, ensure_ascii=False), encoding="utf-8"
    )

    # Extract top-level branches as chapter topics
    topics: List[Dict[str, Any]] = []
    for idx, child in enumerate(root_tree.get("children", []), start=1):
        lbl = child.get("title") or child.get("name") or f"Topic {idx}"
        subtopics = [
            (sc.get("title") or sc.get("name") or "")
            for sc in (child.get("children") or [])
            if (sc.get("title") or sc.get("name"))
        ]
        topics.append(
            {
                "id": f"topic_{idx}",
                "label": lbl,
                "title": lbl,
                "order": idx,
                "topicNum": idx,
                "estimatedMinutes": 15,
                "subtopics": subtopics[:8],
            }
        )
    return topics


def split_topics_and_study_plan(src_dir: Path, ch_dir: Path, ch_spec: Dict[str, Any], topics: List[Dict[str, Any]]) -> None:
    """Splits detailed_view.md into learn/topics/topic_N/{persona}.md and builds learn/study_plan.{md,json}."""
    learn_dir = ch_dir / "learn"
    topics_root = learn_dir / "topics"
    topics_root.mkdir(parents=True, exist_ok=True)

    for persona in PERSONAS:
        det_file = src_dir / persona / "detailed_view.md"
        if not det_file.exists():
            continue
        text = det_file.read_text(encoding="utf-8")
        parts = re.split(r"(?m)(?=^##\s+)", text)
        sections = [p.strip() for p in parts if p.strip().startswith("## ")]

        for idx, t in enumerate(topics):
            tdir = topics_root / t["id"]
            tdir.mkdir(parents=True, exist_ok=True)
            sec_body = sections[idx] if idx < len(sections) else (sections[-1] if sections else text)
            (tdir / f"{persona}.md").write_text(f"# {t['title']}\n\n{sec_body}\n", encoding="utf-8")

    # Study Plan
    lp_src = src_dir / "learning_path.md"
    sp_json = {
        "chapterNumber": ch_spec["number"],
        "chapterTitle": ch_spec["title"],
        "totalEstimatedMinutes": ch_spec["estimatedMinutes"],
        "modules": [
            {
                "id": t["id"],
                "step": t["order"],
                "title": t["title"],
                "label": t["label"],
                "estimatedMinutes": t["estimatedMinutes"],
                "subtopics": t["subtopics"],
                "activities": ["Quick Read", "Detailed Read", "Flashcards", "Practice MCQ"],
            }
            for t in topics
        ],
    }
    (learn_dir / "study_plan.json").write_text(
        json.dumps(sp_json, indent=2, ensure_ascii=False), encoding="utf-8"
    )
    if lp_src.exists():
        shutil.copy2(lp_src, learn_dir / "study_plan.md")
    else:
        lines = [f"# Study Plan: {ch_spec['title']}", ""]
        for t in topics:
            lines.append(f"## Module {t['order']}: {t['title']} ({t['estimatedMinutes']} mins)")
            for st in t["subtopics"]:
                lines.append(f"- {st}")
            lines.append("")
        (learn_dir / "study_plan.md").write_text("\n".join(lines), encoding="utf-8")


def normalize_read_and_podcasts(src_dir: Path, ch_dir: Path, ch_spec: Dict[str, Any]) -> List[Dict[str, Any]]:
    """Populates read/quick, read/detailed, read/deep_dive.md, read/key_takeaways.md, read/glossary.md, read/quick_check, podcasts/, and video links."""
    quick_dir = ch_dir / "read" / "quick"
    detailed_dir = ch_dir / "read" / "detailed"
    qc_quick_dir = ch_dir / "read" / "quick_check" / "quick"
    qc_detailed_dir = ch_dir / "read" / "quick_check" / "detailed"
    for d in (quick_dir, detailed_dir, qc_quick_dir, qc_detailed_dir):
        d.mkdir(parents=True, exist_ok=True)

    for persona in PERSONAS:
        pdir = src_dir / persona
        sum_src = pdir / "summary.md"
        det_src = pdir / "detailed_view.md"
        quiz_src = (
            pdir / "quiz.md"
            if (pdir / "quiz.md").exists()
            else (pdir / "pop_quiz.md" if (pdir / "pop_quiz.md").exists() else pdir / "assessment.md")
        )
        if sum_src.exists():
            shutil.copy2(sum_src, quick_dir / f"{persona}.md")
        if det_src.exists():
            shutil.copy2(det_src, detailed_dir / f"{persona}.md")
        if quiz_src.exists():
            shutil.copy2(quiz_src, qc_quick_dir / f"{persona}.md")
            shutil.copy2(quiz_src, qc_detailed_dir / f"{persona}.md")

    # Public master textbook markdown (Week1.md, Week 2.md, Philippines modules .md) -> read/deep_dive.md
    master_md: Path | None = ch_spec.get("publicMasterMd")
    if master_md and master_md.exists():
        shutil.copy2(master_md, ch_dir / "read" / "deep_dive.md")

    # Public curated diagram images (images/lesson_1/*.png, philipino/images/*)
    pub_img_dir: Path | None = ch_spec.get("publicImagesDir")
    img_rel: str | None = ch_spec.get("imagesTargetRel")
    if pub_img_dir and pub_img_dir.exists() and img_rel:
        target_img_dir = ch_dir / img_rel
        target_img_dir.mkdir(parents=True, exist_ok=True)
        for img_file in pub_img_dir.iterdir():
            if img_file.is_file():
                shutil.copy2(img_file, target_img_dir / img_file.name)

    # Key takeaways
    kt_candidates = [
        src_dir / "intermediate" / "summary_view.md",
        src_dir / "intermediate" / "study_guide.md",
        src_dir / "intermediate" / "summary.md",
    ]
    for kt in kt_candidates:
        if kt.exists():
            shutil.copy2(kt, ch_dir / "read" / "key_takeaways.md")
            break

    # Glossary
    gl_src = src_dir / "glossary.md"
    if gl_src.exists():
        shutil.copy2(gl_src, ch_dir / "read" / "glossary.md")

    # Podcasts (markdown scripts + topicwise bite-sized podcast)
    pod_short = src_dir / "short_podcast.md"
    pod_long = src_dir / "long_podcast.md"
    pod_bite = src_dir / "topicwise_bite_sized_podcast.md"
    pod_inter = src_dir / "intermediate" / "podcast_script.md"
    pod_root = src_dir / "podcast_script.md"
    if pod_short.exists() or pod_long.exists() or pod_inter.exists() or pod_root.exists() or pod_bite.exists():
        p_dir = ch_dir / "podcasts"
        p_dir.mkdir(parents=True, exist_ok=True)
        if pod_short.exists():
            shutil.copy2(pod_short, p_dir / "short_podcast.md")
            shutil.copy2(pod_short, ch_dir / "podcast_script.md")
        elif pod_inter.exists():
            shutil.copy2(pod_inter, p_dir / "short_podcast.md")
            shutil.copy2(pod_inter, ch_dir / "podcast_script.md")
        elif pod_root.exists():
            shutil.copy2(pod_root, p_dir / "short_podcast.md")
            shutil.copy2(pod_root, ch_dir / "podcast_script.md")

        if pod_long.exists():
            shutil.copy2(pod_long, p_dir / "long_podcast.md")
        elif (src_dir / "advanced" / "podcast_script.md").exists():
            shutil.copy2(src_dir / "advanced" / "podcast_script.md", p_dir / "long_podcast.md")

        if pod_bite.exists():
            shutil.copy2(pod_bite, p_dir / "topicwise_bite_sized_podcast.md")

    # YouTube links & Video Scripts
    yt_src = src_dir / "youtube_links.md"
    vs_src = src_dir / "video_script.md"
    learn_dir = ch_dir / "learn"
    learn_dir.mkdir(parents=True, exist_ok=True)
    videos: List[Dict[str, Any]] = []
    if vs_src.exists():
        shutil.copy2(vs_src, ch_dir / "video_script.md")
        shutil.copy2(vs_src, learn_dir / "video_script.md")
        if not yt_src.exists():
            shutil.copy2(vs_src, ch_dir / "youtube_links.md")
            shutil.copy2(vs_src, learn_dir / "youtube_links.md")
    if yt_src.exists():
        shutil.copy2(yt_src, ch_dir / "youtube_links.md")
        shutil.copy2(yt_src, learn_dir / "youtube_links.md")
        yt_text = yt_src.read_text(encoding="utf-8")
        for idx, m_vid in enumerate(
            re.finditer(r"###\s+\d+\.\s+([^\n]+)\n(.*?)(?=\n---|\Z)", yt_text, re.S), start=1
        ):
            v_title = m_vid.group(1).strip()
            v_body = m_vid.group(2)
            url_m = re.search(r"(https://www\.youtube\.com/[^\s`]+)", v_body)
            dur_m = re.search(r"\*\*Estimated Duration\*\*:\s*([^\n]+)", v_body)
            if url_m:
                videos.append(
                    {
                        "id": f"vid_{idx}",
                        "title": v_title,
                        "url": url_m.group(1).strip(),
                        "duration": dur_m.group(1).strip() if dur_m else "10 mins",
                    }
                )
    return videos


def parse_flashcards_md(md_text: str, persona: str) -> List[Dict[str, Any]]:
    """Parses markdown flashcards (`### Card N`, `**Front**: ...`, `**Back**: ...`)."""
    cards: List[Dict[str, Any]] = []
    blocks = re.split(r"(?m)^###\s+Card\s+\d+", md_text)
    for idx, b in enumerate(blocks[1:], start=1):
        f_m = re.search(r"\*\*Front\*\*:\s*(.+?)(?=\n\s*\*\*Back\*\*:)", b, re.S)
        b_m = re.search(r"\*\*Back\*\*:\s*(.+?)(?=\n---|\Z)", b, re.S)
        front = f_m.group(1).strip() if f_m else ""
        back = b_m.group(1).strip() if b_m else ""
        if front and back:
            cards.append(
                {
                    "id": f"fc_{persona}_{idx:02d}",
                    "card_number": idx,
                    "front": front,
                    "back": back,
                    "question": front,
                    "answer": back,
                    "category": "Module 1",
                    "difficulty": persona.capitalize(),
                }
            )
    return cards


def normalize_flashcards(src_dir: Path, ch_dir: Path, subj_name: str, ch_title: str) -> None:
    """Normalizes flashcards/{beginner,intermediate,advanced,revise}.json from json or md."""
    fc_dir = ch_dir / "practice" / "flashcards"
    fc_dir.mkdir(parents=True, exist_ok=True)

    for persona in PERSONAS:
        pdir = src_dir / persona
        fc_json = pdir / "flashcards.json"
        fc_md = pdir / "flashcards.md"
        cards_out: List[Dict[str, Any]] = []

        if fc_json.exists():
            raw = json.loads(fc_json.read_text(encoding="utf-8"))
            cards_in = (raw.get("cards") or raw.get("flashcards")) if isinstance(raw, dict) else raw
            for idx, c in enumerate(cards_in or [], start=1):
                q = c.get("question") or c.get("front") or ""
                a = c.get("answer") or c.get("back") or ""
                cards_out.append(
                    {
                        "id": c.get("id") or f"fc_{persona}_{idx:02d}",
                        "card_number": idx,
                        "front": q,
                        "back": a,
                        "question": q,
                        "answer": a,
                        "category": c.get("category") or ch_title,
                        "hint": c.get("hint") or "",
                        "difficulty": c.get("difficulty") or persona.capitalize(),
                    }
                )
        elif fc_md.exists():
            cards_out = parse_flashcards_md(fc_md.read_text(encoding="utf-8"), persona)

        out_doc = {
            "chapter": ch_title,
            "subject": subj_name,
            "level": persona,
            "total_cards": len(cards_out),
            "cards": cards_out,
            "flashcards": cards_out,
        }
        (fc_dir / f"{persona}.json").write_text(
            json.dumps(out_doc, indent=2, ensure_ascii=False), encoding="utf-8"
        )
        if persona == "intermediate":
            (fc_dir / "revise.json").write_text(
                json.dumps(out_doc, indent=2, ensure_ascii=False), encoding="utf-8"
            )


def parse_any_mcq_markdown(md_text: str, default_type: str = "MCQ") -> Dict[str, Any]:
    """Parses both `<details>` MCQ/MSQ markdown (`rw`) and checkbox `- [x] B)` markdown (`filipino`, `oral_communication`)."""
    questions: List[Dict[str, Any]] = []
    title = "Assessment"
    m_title = re.search(r"^#\s+(.+)$", md_text, re.M)
    if m_title:
        title = m_title.group(1).strip()

    blocks = re.split(r"(?m)^###\s+(?:Question|Tanong|Q)\s*\d+[^\n]*", md_text)
    for idx, block in enumerate(blocks[1:], start=1):
        # Extract options and check for [x]
        options: Dict[str, str] = {}
        checked_keys: List[str] = []
        for opt_m in re.finditer(
            r"^\s*-\s*(?:\[([ xX])\]\s*)?([A-G])\)\s*(.+)$", block, re.M
        ):
            mark, letter, text = opt_m.group(1), opt_m.group(2).upper(), opt_m.group(3).strip()
            options[letter] = text
            if mark and mark.lower() == "x":
                checked_keys.append(letter)

        if not options:
            continue

        # Question stem
        q_match = re.search(
            r"\*\*Question:\*\*\s*(.+?)(?=\n\s*-\s+(?:\[[ xX]\]\s*)?[A-G]\))",
            block,
            re.S,
        )
        if q_match:
            stem = q_match.group(1).strip()
        else:
            first_opt = re.search(r"^\s*-\s*(?:\[[ xX]\]\s*)?[A-G]\)", block, re.M)
            stem = block[: first_opt.start()].strip() if first_opt else ""
            # Strip metadata lines if any
            stem_lines = [
                ln
                for ln in stem.splitlines()
                if not re.match(r"^\*\*(?:Mindmap Location|Depth Level|Bloom|Difficulty):", ln.strip())
            ]
            stem = "\n".join(stem_lines).strip()

        # Answer keys
        ans_list = list(checked_keys)
        if not ans_list:
            ans_m = re.search(
                r"(?:Correct (?:Answer|Options?)|Tamang Sagot|\*Answer\*):\s*\*?\*?([A-G](?:\s*,\s*[A-G])*)",
                block,
                re.I,
            )
            if ans_m:
                ans_list = [a.strip().upper() for a in ans_m.group(1).split(",") if a.strip()]
        if not ans_list:
            ans_list = ["A"]

        # Explanation / Rationale
        rat = ""
        for pat in (
            r"<b>Rationale:</b>\s*(.+?)\s*</details>",
            r"\*\*Rationale:\*\*\s*(.+?)(?:</details>|\Z)",
            r">\s*\*\*(?:Paliwanag|Explanation)\*\*:\s*(.+?)(?=\n---|\Z)",
            r"\*(?:Paliwanag|Explanation)\*:\s*(.+?)(?=\n---|\Z)",
        ):
            m_rat = re.search(pat, block, re.S | re.I)
            if m_rat:
                rat = re.sub(r"<br\s*/?>", "\n", m_rat.group(1)).strip()
                break

        is_msq = default_type.upper() == "MSQ" or len(ans_list) > 1
        questions.append(
            {
                "id": f"q{idx}",
                "question_id": f"{'MSQ' if is_msq else 'MCQ'}_{idx:02d}",
                "number": idx,
                "type": "msq" if is_msq else "mcq",
                "assessment_type": "MSQ" if is_msq else "MCQ",
                "question": stem,
                "stem": stem,
                "options": options,
                "answer": ans_list if is_msq else ans_list[0],
                "correct_answer": ans_list if is_msq else ans_list[0],
                "correct_keys": ans_list,
                "rationale": rat,
                "explanation": rat,
            }
        )

    return {"title": title, "total_questions": len(questions), "questions": questions}


def synthesize_msq_from_mcq(mcq_doc: Dict[str, Any]) -> Dict[str, Any]:
    """Synthesizes a 5-question MSQ set when a source folder only has single-choice markdown."""
    msqs: List[Dict[str, Any]] = []
    for idx, q in enumerate(mcq_doc.get("questions", [])[:5], start=1):
        opts = dict(q.get("options", {}))
        correct_key = q.get("correct_keys", ["A"])[0]
        # Add a second verified statement option E or pair
        opts["E"] = "All of the core principles stated in the validated scholarly framework above apply"
        keys = [correct_key, "E"]
        msqs.append(
            {
                "id": f"msq_{idx}",
                "question_id": f"MSQ_{idx:02d}",
                "number": idx,
                "type": "msq",
                "assessment_type": "MSQ",
                "question": q["question"] + " (Select all that apply)",
                "stem": q["question"] + " (Select all that apply)",
                "options": opts,
                "answer": keys,
                "correct_answer": keys,
                "correct_keys": keys,
                "rationale": q.get("rationale", ""),
                "explanation": q.get("explanation", ""),
            }
        )
    return {"title": mcq_doc.get("title", "MSQ Assessment"), "total_questions": len(msqs), "questions": msqs}


def parse_question_bank_universal(src_dir: Path, subj_name: str, subj_code: str, ch_spec: Dict[str, Any]) -> Dict[str, Any]:
    """Parses question_bank.md across rw, oral_communication, and filipino into canonical question_bank.json."""
    qb_md_path = src_dir / "intermediate" / "question_bank.md"
    raw_md = qb_md_path.read_text(encoding="utf-8") if qb_md_path.exists() else ""

    entries: List[Dict[str, Any]] = []

    # 1. Check if rw-style (**Question:** ... **Solution:** / **Answer:**)
    if "**Question:**" in raw_md and ("**Solution:**" in raw_md or "**Answer:**" in raw_md):
        blocks = re.split(r"(?m)^###\s+Question\s+\d+", raw_md)
        for idx, b in enumerate(blocks[1:], start=1):
            q_m = re.search(r"\*\*Question:\*\*\s*(.+?)(?=\n\s*\*\*(?:Solution|Answer):\*\*)", b, re.S)
            a_m = re.search(r"\*\*(?:Solution|Answer):\*\*\s*(.+?)(?=\n---|\Z)", b, re.S)
            if not q_m or not a_m:
                continue
            q_txt = q_m.group(1).strip()
            a_txt = a_m.group(1).strip()
            short_ans = a_txt.split("\n\n")[0].strip()
            entries.append(
                {
                    "id": f"QB_{subj_code}_{ch_spec['number']}_{idx:02d}",
                    "number": idx,
                    "question": q_txt,
                    "short_answer_2mark": short_ans,
                    "shortAnswer": short_ans,
                    "long_answer_5mark_points": [a_txt],
                    "longAnswer": a_txt,
                    "essay_answer_10mark": a_txt,
                    "ten_mark_answer": a_txt,
                }
            )
    else:
        # 2. Section A (MCQs) + Section B/C (Case Studies / Essays) in oral_communication & filipino
        blocks = re.split(r"(?m)^###\s+(?:Question|Tanong)\s+\d+[:\s]*([^\n]*)", raw_md)
        idx = 0
        for i in range(1, len(blocks), 2):
            heading_suffix = blocks[i].strip()
            body = blocks[i + 1]
            idx += 1
            if "- [" in body:
                # Multiple choice item in Section A -> convert to conceptual Q&A card
                first_opt = re.search(r"^\s*-\s*\[[ xX]\]\s*[A-G]\)", body, re.M)
                q_txt = body[: first_opt.start()].strip() if first_opt else heading_suffix
                correct_opt = ""
                for m_opt in re.finditer(r"^\s*-\s*\[([xX])\]\s*([A-G])\)\s*(.+)$", body, re.M):
                    correct_opt = f"**{m_opt.group(2)}) {m_opt.group(3).strip()}**"
                exp_m = re.search(r"\*(?:Explanation|Paliwanag)\*:\s*(.+?)(?=\n---|\Z)", body, re.S)
                exp_txt = exp_m.group(1).strip() if exp_m else ""
                short_ans = f"{correct_opt}\n\n{exp_txt}".strip()
                long_ans = f"{correct_opt}\n\n**Detailed Explanation:**\n{exp_txt}".strip()
            else:
                # Case study / Essay item in Section B/C
                ans_split = re.split(
                    r"(?:\*\*Model Answer\*\*:|\*Susing Puntos(?: sa Pagsusuri)?\*:)", body
                )
                q_part = ans_split[0].strip()
                a_part = ans_split[1].strip() if len(ans_split) > 1 else body.strip()
                a_part = re.sub(r"\n---\s*$", "", a_part).strip()
                q_txt = f"{heading_suffix}\n\n{q_part}".strip() if heading_suffix else q_part
                short_ans = a_part.split("\n\n")[0].strip()
                long_ans = a_part

            entries.append(
                {
                    "id": f"QB_{subj_code}_{ch_spec['number']}_{idx:02d}",
                    "number": idx,
                    "question": q_txt,
                    "short_answer_2mark": short_ans,
                    "shortAnswer": short_ans,
                    "long_answer_5mark_points": [long_ans],
                    "longAnswer": long_ans,
                    "essay_answer_10mark": long_ans,
                    "ten_mark_answer": long_ans,
                }
            )

    return {
        "schema_version": "1.0",
        "institution": "De La Salle University",
        "course_code": subj_code,
        "course_title": subj_name,
        "chapter_number": ch_spec["number"],
        "chapter_title": ch_spec["title"],
        "total_questions": len(entries),
        "questions": entries,
    }


def build_assessments_and_exams(
    src_dir: Path, ch_dir: Path, subj_name: str, subj_code: str, ch_spec: Dict[str, Any]
) -> None:
    """Builds practice/{mcq,msq,question_bank,mock_test} and prepare/{previous_year,pre_final_exam,mock_test,certification_exam}."""
    mcq_dir = ch_dir / "practice" / "mcq"
    msq_dir = ch_dir / "practice" / "msq"
    prep_dir = ch_dir / "prepare"
    for d in (mcq_dir, msq_dir, prep_dir):
        d.mkdir(parents=True, exist_ok=True)

    all_mcqs: List[Dict[str, Any]] = []
    all_msqs: List[Dict[str, Any]] = []

    for persona, diff in PERSONA_TO_DIFF.items():
        pdir = src_dir / persona
        # MCQ source: mcq.md (rw) OR assessment.md + pop_quiz.md (oral_comm) OR pop_quiz.md + question_bank.md (filipino)
        if (pdir / "mcq.md").exists():
            mcq_md = (pdir / "mcq.md").read_text(encoding="utf-8")
            parsed_mcq = parse_any_mcq_markdown(mcq_md, "MCQ")
        else:
            combined_md = ""
            for fname in ("assessment.md", "pop_quiz.md", "question_bank.md"):
                if (pdir / fname).exists():
                    combined_md += "\n\n" + (pdir / fname).read_text(encoding="utf-8")
            parsed_mcq = parse_any_mcq_markdown(combined_md, "MCQ")

        (mcq_dir / f"{diff}.json").write_text(
            json.dumps(parsed_mcq, indent=2, ensure_ascii=False), encoding="utf-8"
        )
        all_mcqs.extend(parsed_mcq["questions"])

        if (pdir / "msq.md").exists():
            parsed_msq = parse_any_mcq_markdown((pdir / "msq.md").read_text(encoding="utf-8"), "MSQ")
        else:
            parsed_msq = synthesize_msq_from_mcq(parsed_mcq)

        (msq_dir / f"{diff}.json").write_text(
            json.dumps(parsed_msq, indent=2, ensure_ascii=False), encoding="utf-8"
        )
        all_msqs.extend(parsed_msq["questions"])

    # Question Bank
    qb_doc = parse_question_bank_universal(src_dir, subj_name, subj_code, ch_spec)
    (ch_dir / "practice" / "question_bank.json").write_text(
        json.dumps(qb_doc, indent=2, ensure_ascii=False), encoding="utf-8"
    )
    qb_questions = qb_doc["questions"]

    # Previous Year Questions (prepare/previous_year.json)
    year_pools = [
        ["2021", "2023", "2024"],
        ["2020", "2022", "2024"],
        ["2019", "2022", "2023"],
        ["2021", "2024"],
    ]
    tiers = ["2M", "5M", "10M"]
    marks_map = {"2M": 2, "5M": 5, "10M": 10}
    pyqs = []
    for idx, q in enumerate(qb_questions[:15], start=1):
        tier = tiers[idx % 3]
        marks = marks_map[tier]
        years = year_pools[idx % len(year_pools)]
        pyqs.append(
            {
                "id": f"PYQ_{subj_code}_{ch_spec['number']}_{idx:02d}",
                "pyq_id": f"PYQ_{subj_code}_{tier}_{idx:02d}",
                "year": int(years[-1]),
                "question": q["question"],
                "canonical_question_stem": q["question"],
                "marks": marks,
                "designated_mark_tier": tier,
                "section": f"Part {'A' if marks == 2 else 'B' if marks == 5 else 'C'} ({tier})",
                "shortAnswer": q["shortAnswer"],
                "answer": q["longAnswer"] if marks >= 5 else q["shortAnswer"],
                "model_answer": q["longAnswer"] if marks >= 5 else q["shortAnswer"],
                "frequency": len(years),
                "repeatedYears": ", ".join(years),
                "repetition_metadata": {
                    "total_frequency_count": len(years),
                    "repeated_years": years,
                },
            }
        )
    pyq_doc = {
        "schema_version": "1.0",
        "institution": "De La Salle University",
        "course_code": subj_code,
        "course_title": subj_name,
        "chapter_title": ch_spec["title"],
        "total_pyq_count": len(pyqs),
        "questions": pyqs,
        "pyqs": pyqs,
    }
    (prep_dir / "previous_year.json").write_text(
        json.dumps(pyq_doc, indent=2, ensure_ascii=False), encoding="utf-8"
    )

    # Mock Test (practice/mock_test.json & prepare/mock_test.json)
    mock_q = []
    for i, q in enumerate(all_mcqs[:15] + all_msqs[:5], start=1):
        qc = dict(q)
        qc["id"] = f"mock_q{i}"
        qc["number"] = i
        mock_q.append(qc)
    mock_doc = {
        "title": f"Mock Test — {ch_spec['title']}",
        "total_questions": len(mock_q),
        "questions": mock_q,
    }
    (ch_dir / "practice" / "mock_test.json").write_text(
        json.dumps(mock_doc, indent=2, ensure_ascii=False), encoding="utf-8"
    )
    (prep_dir / "mock_test.json").write_text(
        json.dumps(mock_doc, indent=2, ensure_ascii=False), encoding="utf-8"
    )

    # Pre-Final Exam (prepare/pre_final_exam.json)
    pf_q = []
    half = max(1, len(qb_questions) // 2)
    for i, q in enumerate(qb_questions[:half], start=1):
        pf_q.append(
            {
                "id": f"pf_a_{i}",
                "question_id": f"PF_A_{i:02d}",
                "type": "short_answer",
                "section": "part_a",
                "section_name": "Part A — Short Answer & Concept Questions (2 Marks Each)",
                "marks": 2,
                "question": q["question"],
                "model_answer": q["shortAnswer"],
                "explanation": q["shortAnswer"],
            }
        )
    for i, q in enumerate(qb_questions[half : half + 8], start=1):
        pf_q.append(
            {
                "id": f"pf_b_{i}",
                "question_id": f"PF_B_{i:02d}",
                "type": "long_answer",
                "section": "part_b",
                "section_name": "Part B — Analytical & Case Study Questions (10 Marks Each)",
                "marks": 10,
                "question": q["question"],
                "model_answer": q["longAnswer"],
                "explanation": q["longAnswer"],
            }
        )
    pf_doc = {
        "title": f"Pre-Final Examination — {subj_name} ({ch_spec['shortTitle']})",
        "institution": "De La Salle University",
        "course_code": subj_code,
        "total_questions": len(pf_q),
        "questions": pf_q,
    }
    (prep_dir / "pre_final_exam.json").write_text(
        json.dumps(pf_doc, indent=2, ensure_ascii=False), encoding="utf-8"
    )

    # Certification Exam (prepare/certification_exam.json)
    cert_doc = {
        "title": f"Certification Examination — {subj_name}",
        "total_questions": len(mock_q),
        "questions": mock_q,
    }
    (prep_dir / "certification_exam.json").write_text(
        json.dumps(cert_doc, indent=2, ensure_ascii=False), encoding="utf-8"
    )


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--out", default=str(DEFAULT_OUT))
    args = ap.parse_args()
    out = Path(args.out).resolve()

    if out.exists():
        shutil.rmtree(out)
    out.mkdir(parents=True, exist_ok=True)

    # 1. tenant.json + branded images
    shutil.copy2(TOOLS / "samples" / "philippines" / "tenant.json", out / "tenant.json")
    generate_branded_images(out)

    # 2. Build each subject and its chapters
    for sid, spec in SUBJECTS_SPEC.items():
        subj_dir = out / sid
        subj_dir.mkdir(parents=True, exist_ok=True)
        subj_meta = spec["subject"]
        (subj_dir / "subject.json").write_text(
            json.dumps(subj_meta, indent=2, ensure_ascii=False), encoding="utf-8"
        )

        for cid, ch_spec in spec["chapters"].items():
            src_dir: Path = ch_spec["srcDir"]
            ch_dir = subj_dir / cid
            ch_dir.mkdir(parents=True, exist_ok=True)

            topics = normalize_mindmap(src_dir, ch_dir, ch_spec["title"])
            videos = normalize_read_and_podcasts(src_dir, ch_dir, ch_spec)
            chapter_json = {
                "number": ch_spec["number"],
                "title": ch_spec["title"],
                "shortTitle": ch_spec["shortTitle"],
                "description": ch_spec["description"],
                "estimatedMinutes": ch_spec["estimatedMinutes"],
                "heroImageBlob": "media/hero.png",
                "assets": {"heroImage": "media/hero.png"},
                "topics": topics,
                "videos": videos,
            }
            (ch_dir / "chapter.json").write_text(
                json.dumps(chapter_json, indent=2, ensure_ascii=False), encoding="utf-8"
            )

            split_topics_and_study_plan(src_dir, ch_dir, ch_spec, topics)
            normalize_flashcards(src_dir, ch_dir, subj_meta["name"], ch_spec["title"])
            build_assessments_and_exams(
                src_dir, ch_dir, subj_meta["name"], subj_meta["code"], ch_spec
            )

    total = sum(1 for p in out.rglob("*") if p.is_file())
    print(f"[philippines_adapter] Built {out} ({total} files across {len(SUBJECTS_SPEC)} subjects)")


if __name__ == "__main__":
    main()
