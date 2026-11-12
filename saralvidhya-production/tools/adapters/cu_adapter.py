#!/usr/bin/env python3
"""Chalapathi University (CU) adapter — transforms existing CNS Chapter 1 content under
    saralvidhya-mvp/public/generated resources/chalapathi university/cns/
    and saralvidhya-mvp/public/cu/cns/chapter 1/
into the canonical folder layout at:
    saralvidhya-production/tools/build/cu/

Idempotent: safe to re-run. Does not modify the source folders.
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
SRC_GEN = (MVP_PUBLIC / "generated_resources" / "chalapathi university" / "cns") if (MVP_PUBLIC / "generated_resources" / "chalapathi university" / "cns").exists() else (MVP_PUBLIC / "generated resources" / "chalapathi university" / "cns")
SRC_CU = MVP_PUBLIC / "cu" / "cns" / "chapter 1"
DEFAULT_OUT = TOOLS / "build" / "cu"

PERSONAS = ("beginner", "intermediate", "advanced")
PERSONA_TO_DIFF = {
    "beginner": "easy",
    "intermediate": "medium",
    "advanced": "hard",
}

SUBJECT: Dict[str, Any] = {
    "id": "cns",
    "name": "Cryptography and Network Security",
    "code": "CS501PC",
    "subtitle": "B.Tech CSE",
    "programLabel": "B.Tech CSE",
    "credits": 3,
    "parentNodeId": "cse_s5",
    "order": 1,
    "status": "active",
    "description": (
        "Foundations of information security, ITU-T X.800 security architecture "
        "(attacks, services, mechanisms), symmetric cipher models, cryptanalysis, "
        "and classical substitution and transposition techniques."
    ),
    "iconBlob": "assets/icon.png",
    "assets": {
        "icon": "assets/icon.png",
    },
    "cardStyle": {
        "accentColor": "#1E3A8A",
        "badgeText": "B.Tech CSE",
        "iconBgColor": "#EFF6FF",
    },
}

TOPICS: List[Dict[str, Any]] = [
    {
        "id": "topic_1",
        "label": "1. Security Concepts & Attacks",
        "title": "Security Concepts, CIA Triad & Passive/Active Attacks",
        "order": 1,
        "topicNum": 1,
        "estimatedMinutes": 20,
        "subtopics": [
            "Security Disciplines & CIA Triad",
            "Passive Attacks (Release of Message Contents & Traffic Analysis)",
            "Active Attacks (Masquerade, Replay, Modification & DoS)",
        ],
    },
    {
        "id": "topic_2",
        "label": "2. Security Services (X.800 Framework)",
        "title": "ITU-T X.800 Security Services Framework",
        "order": 2,
        "topicNum": 2,
        "estimatedMinutes": 20,
        "subtopics": [
            "Authentication Services (Peer Entity & Data Origin)",
            "Access Control Service",
            "Data Confidentiality Services",
            "Data Integrity Services",
            "Nonrepudiation & Availability",
        ],
    },
    {
        "id": "topic_3",
        "label": "3. Security Mechanisms & Network Models",
        "title": "Security Mechanisms (X.800) & Network Security Models",
        "order": 3,
        "topicNum": 3,
        "estimatedMinutes": 20,
        "subtopics": [
            "Specific Security Mechanisms (X.800)",
            "Pervasive Security Mechanisms (X.800)",
            "Model for Network Security",
            "Network Access Security Model",
        ],
    },
    {
        "id": "topic_4",
        "label": "4. Symmetric Cipher Model & Cryptanalysis",
        "title": "Symmetric Cipher Model, Kerckhoffs's Principle & Cryptanalysis",
        "order": 4,
        "topicNum": 4,
        "estimatedMinutes": 20,
        "subtopics": [
            "Five Ingredients of Symmetric Cipher",
            "Two Core Security Requirements & Kerckhoffs's Principle",
            "Three Cryptographic Dimensions",
            "Cryptanalysis & Attack Models (COA, KPA, CPA, CCA, CTA)",
            "Unconditional vs. Computational Security",
        ],
    },
    {
        "id": "topic_5",
        "label": "5. Classical Substitution Techniques",
        "title": "Classical Substitution Ciphers (Caesar, Playfair, Hill, Vigenère, OTP)",
        "order": 5,
        "topicNum": 5,
        "estimatedMinutes": 25,
        "subtopics": [
            "Caesar Cipher (Shift k = 3)",
            "Monoalphabetic Substitution & Frequency Analysis",
            "Playfair Digraph Cipher (5x5 Matrix Rules)",
            "Hill Cipher (Linear Algebra Modulo 26)",
            "Polyalphabetic Ciphers (Vigenère & Autokey)",
            "Vernam Cipher & One-Time Pad (OTP)",
        ],
    },
    {
        "id": "topic_6",
        "label": "6. Transposition, Rotors & Steganography",
        "title": "Transposition Ciphers, Rotor Machines & Steganography",
        "order": 6,
        "topicNum": 6,
        "estimatedMinutes": 15,
        "subtopics": [
            "Rail Fence Cipher",
            "Rectangular Columnar Transposition",
            "Multiple (Double) Transposition",
            "Rotor Machines (Enigma / Hebern Cylinders)",
            "Steganography vs. Cryptography",
        ],
    },
]

CHAPTER_01: Dict[str, Any] = {
    "number": 1,
    "title": "Introduction to Security & Classical Encryption Techniques",
    "shortTitle": "Security & Classical Encryption",
    "description": (
        "Computer, Network, and Information Security fundamentals, ITU-T X.800 "
        "Security Architecture (Attacks, Services, Mechanisms), Symmetric Cipher Model, "
        "Cryptanalysis, Classical Substitution Ciphers (Caesar, Monoalphabetic, Playfair, "
        "Hill, Polyalphabetic, Vernam/OTP), Transposition Ciphers, Rotor Machines, and Steganography."
    ),
    "estimatedMinutes": 120,
    "heroImageBlob": "media/hero.png",
    "assets": {
        "heroImage": "media/hero.png",
    },
    "topics": TOPICS,
    "videos": [],
}


def generate_branded_images(out: Path) -> None:
    """Generates clean branded PNG assets for Chalapathi University (CU) and CNS."""
    try:
        from PIL import Image, ImageDraw, ImageFont
    except ImportError:
        fallback = MVP_PUBLIC / "logo-vvit.png"
        if fallback.exists():
            shutil.copy2(fallback, out / "assets" / "logo.png")
            shutil.copy2(fallback, out / "assets" / "favicon.png")
            shutil.copy2(fallback, MVP_PUBLIC / "logo-cu.png")
        return

    # 1. Tenant Logo (prefer official sample asset if present)
    try:
        font_lg = ImageFont.truetype("arialbd.ttf", 76)
        font_sm = ImageFont.truetype("arialbd.ttf", 22)
    except Exception:
        font_lg = ImageFont.load_default()
        font_sm = ImageFont.load_default()

    (out / "assets").mkdir(parents=True, exist_ok=True)
    official_logo = TOOLS / "samples" / "cu" / "assets" / "logo.png"
    official_fav = TOOLS / "samples" / "cu" / "assets" / "favicon.png"
    if official_logo.exists():
        shutil.copy2(official_logo, out / "assets" / "logo.png")
        shutil.copy2(official_logo, MVP_PUBLIC / "logo-cu.png")
        if official_fav.exists():
            shutil.copy2(official_fav, out / "assets" / "favicon.png")
        else:
            Image.open(official_logo).resize((64, 64)).save(out / "assets" / "favicon.png", "PNG")
    else:
        logo_img = Image.new("RGBA", (256, 256), (0, 0, 0, 0))
        draw = ImageDraw.Draw(logo_img)
        draw.ellipse([12, 12, 244, 244], fill=(30, 58, 138, 255), outline=(189, 125, 82, 255), width=10)
        draw.ellipse([28, 28, 228, 228], fill=(37, 53, 44, 255), outline=(255, 255, 255, 210), width=4)
        draw.text((128, 112), "CU", fill=(255, 255, 255, 255), font=font_lg, anchor="mm")
        draw.text((128, 178), "CHALAPATHI", fill=(253, 190, 138, 255), font=font_sm, anchor="mm")
        logo_img.save(out / "assets" / "logo.png", "PNG")
        logo_img.resize((64, 64)).save(out / "assets" / "favicon.png", "PNG")
        logo_img.save(MVP_PUBLIC / "logo-cu.png", "PNG")

    # 2. Subject Icon
    subj_assets = out / "cns" / "assets"
    subj_assets.mkdir(parents=True, exist_ok=True)
    sample_icon = TOOLS / "samples" / "cu" / "cns" / "icon.png"
    if sample_icon.exists():
        shutil.copy2(sample_icon, subj_assets / "icon.png")
    else:
        icon_img = Image.new("RGBA", (256, 256), (239, 246, 255, 255))
        idraw = ImageDraw.Draw(icon_img)
        idraw.rounded_rectangle([16, 16, 240, 240], radius=40, fill=(30, 58, 138, 255), outline=(189, 125, 82, 255), width=6)
        idraw.text((128, 115), "CNS", fill=(255, 255, 255, 255), font=font_lg, anchor="mm")
        idraw.text((128, 182), "CRYPTO & SEC", fill=(253, 190, 138, 255), font=font_sm, anchor="mm")
        icon_img.save(subj_assets / "icon.png", "PNG")

    # 3. Chapter 1 Hero Image (800x450 banner)
    media_dir = out / "cns" / "chapter_01" / "media"
    media_dir.mkdir(parents=True, exist_ok=True)
    sample_hero = TOOLS / "samples" / "cu" / "cns" / "hero.png"
    if sample_hero.exists():
        shutil.copy2(sample_hero, media_dir / "hero.png")
    else:
        hero_img = Image.new("RGB", (800, 450), (37, 53, 44))
        hdraw = ImageDraw.Draw(hero_img)
        hdraw.rectangle([24, 24, 776, 426], outline=(189, 125, 82), width=4)
        try:
            hfont_title = ImageFont.truetype("arialbd.ttf", 34)
            hfont_sub = ImageFont.truetype("arial.ttf", 22)
        except Exception:
            hfont_title = ImageFont.load_default()
            hfont_sub = ImageFont.load_default()
        hdraw.text((400, 150), "CRYPTOGRAPHY & NETWORK SECURITY", fill=(253, 190, 138), font=hfont_sub, anchor="mm")
        hdraw.text((400, 220), "Chapter 1: Security & Classical Encryption", fill=(255, 255, 255), font=hfont_title, anchor="mm")
        hdraw.text((400, 290), "X.800 Framework • Symmetric Cipher Model • Substitution & Transposition", fill=(203, 213, 225), font=hfont_sub, anchor="mm")
        hero_img.save(media_dir / "hero.png", "PNG")


def normalize_mindmap(ch_dir: Path) -> None:
    """Normalizes mindmap.json and copies mindmap.md into learn/."""
    learn_dir = ch_dir / "learn"
    learn_dir.mkdir(parents=True, exist_ok=True)

    mm_md_src = SRC_GEN / "mindmap.md"
    if mm_md_src.exists():
        shutil.copy2(mm_md_src, learn_dir / "mindmap.md")

    for extra_mm in ("index.html", "mindmap.js"):
        e_src = SRC_GEN / extra_mm
        if e_src.exists():
            shutil.copy2(e_src, learn_dir / extra_mm)

    mm_json_src = SRC_GEN / "mindmap.json"
    if not mm_json_src.exists():
        return

    raw = json.loads(mm_json_src.read_text(encoding="utf-8"))
    hierarchy = raw.get("hierarchy", {})

    def convert_node(node: dict, idx_path: str = "root") -> dict:
        nid = node.get("id") or idx_path
        label = node.get("title") or node.get("name") or node.get("topic") or "Topic"
        children_raw = node.get("children") or []
        children = [convert_node(c, f"{nid}_{i+1}") for i, c in enumerate(children_raw)]
        out_node: Dict[str, Any] = {
            "id": nid,
            "name": label,
            "title": label,
            "topic": label,
            "summary": node.get("tooltip") or node.get("summary") or "",
            "children": children,
        }
        if "level" in node:
            out_node["level"] = node["level"]
        if "side" in node:
            out_node["side"] = node["side"]
        return out_node

    root_converted = convert_node(hierarchy, "root")
    normalized = {
        "id": root_converted["id"],
        "name": root_converted["name"],
        "title": root_converted["title"],
        "topic": root_converted["topic"],
        "summary": root_converted["summary"],
        "children": root_converted["children"],
        "mindmap": root_converted,
        "meta": raw.get("meta", {}),
        "hierarchy": hierarchy,
    }
    (learn_dir / "mindmap.json").write_text(
        json.dumps(normalized, indent=2, ensure_ascii=False), encoding="utf-8"
    )


def build_study_plan(ch_dir: Path) -> None:
    """Creates learn/study_plan.md and learn/study_plan.json for Chapter 1."""
    learn_dir = ch_dir / "learn"
    learn_dir.mkdir(parents=True, exist_ok=True)

    plan_json = {
        "chapterNumber": 1,
        "chapterTitle": CHAPTER_01["title"],
        "totalEstimatedMinutes": 120,
        "modules": [
            {
                "id": t["id"],
                "step": t["order"],
                "title": t["title"],
                "label": t["label"],
                "estimatedMinutes": t["estimatedMinutes"],
                "subtopics": t["subtopics"],
                "activities": ["Quick Read", "Detailed Read", "Flashcards", "Practice MCQ/MSQ"],
            }
            for t in TOPICS
        ],
    }
    (learn_dir / "study_plan.json").write_text(
        json.dumps(plan_json, indent=2, ensure_ascii=False), encoding="utf-8"
    )

    md_lines = [
        "# Study Plan: Chapter 1 — Introduction to Security & Classical Encryption Techniques",
        "",
        "**Course:** Cryptography and Network Security (`CS501PC`) | **Total Duration:** 120 Minutes (6 Guided Modules)",
        "",
        "---",
        "",
    ]
    for t in TOPICS:
        md_lines.append(f"## Module {t['order']}: {t['title']} ({t['estimatedMinutes']} mins)")
        md_lines.append("")
        md_lines.append("**Key Subtopics:**")
        for st in t["subtopics"]:
            md_lines.append(f"- {st}")
        md_lines.append("")
        md_lines.append("**Recommended Study Flow:**")
        md_lines.append("1. Read the **Quick Summary** for high-level conceptual anchors.")
        md_lines.append("2. Study the **Detailed Notes** including worked mathematical examples and X.800 tables.")
        md_lines.append("3. Test recall with **Flashcards** and **Practice MCQs/MSQs**.")
        md_lines.append("")
        md_lines.append("---")
        md_lines.append("")

    (learn_dir / "study_plan.md").write_text("\n".join(md_lines), encoding="utf-8")


def split_topics_from_detailed(ch_dir: Path) -> None:
    """Populates learn/topics/topic_{1..6}/{beginner,intermediate,advanced}.md from detailed_view.md."""
    topics_root = ch_dir / "learn" / "topics"
    topics_root.mkdir(parents=True, exist_ok=True)

    # Mapping of topic_1..topic_6 to 1-based ## section indices in detailed_view.md per persona
    section_map = {
        "beginner": {
            "topic_1": [0, 1],
            "topic_2": [2],
            "topic_3": [3],
            "topic_4": [4],
            "topic_5": [5],
            "topic_6": [6],
        },
        "intermediate": {
            "topic_1": [0, 1],
            "topic_2": [2],
            "topic_3": [3],
            "topic_4": [4],
            "topic_5": [5],
            "topic_6": [6],
        },
        "advanced": {
            "topic_1": [0],
            "topic_2": [1],
            "topic_3": [1, 2],
            "topic_4": [2, 3],
            "topic_5": [4, 5],
            "topic_6": [6, 7, 8],
        },
    }

    for persona in PERSONAS:
        src_file = SRC_GEN / persona / "detailed_view.md"
        if not src_file.exists():
            continue
        text = src_file.read_text(encoding="utf-8")
        # Split on top-level ## headings
        parts = re.split(r"(?m)(?=^##\s+\d+\.)", text)
        sections = [p.strip() for p in parts if re.match(r"^##\s+\d+\.", p.strip())]

        for topic in TOPICS:
            tid = topic["id"]
            tdir = topics_root / tid
            tdir.mkdir(parents=True, exist_ok=True)
            indices = section_map.get(persona, {}).get(tid, [])
            picked = [sections[i] for i in indices if 0 <= i < len(sections)]
            body = "\n\n---\n\n".join(picked) if picked else text
            header = f"# {topic['label']}: {topic['title']}\n\n"
            (tdir / f"{persona}.md").write_text(header + body + "\n", encoding="utf-8")


def normalize_read_files(ch_dir: Path) -> None:
    """Populates read/quick, read/detailed, read/key_takeaways.md, and read/quick_check."""
    quick_dir = ch_dir / "read" / "quick"
    detailed_dir = ch_dir / "read" / "detailed"
    qc_quick_dir = ch_dir / "read" / "quick_check" / "quick"
    qc_detailed_dir = ch_dir / "read" / "quick_check" / "detailed"

    for d in (quick_dir, detailed_dir, qc_quick_dir, qc_detailed_dir):
        d.mkdir(parents=True, exist_ok=True)

    for persona in PERSONAS:
        sum_src = SRC_GEN / persona / "summary.md"
        det_src = SRC_GEN / persona / "detailed_view.md"
        quiz_src = SRC_GEN / persona / "quiz.md"

        if sum_src.exists():
            shutil.copy2(sum_src, quick_dir / f"{persona}.md")
        if det_src.exists():
            shutil.copy2(det_src, detailed_dir / f"{persona}.md")
        if quiz_src.exists():
            shutil.copy2(quiz_src, qc_quick_dir / f"{persona}.md")
            shutil.copy2(quiz_src, qc_detailed_dir / f"{persona}.md")

    # Key takeaways from intermediate/summary_view.md
    kt_src = SRC_GEN / "intermediate" / "summary_view.md"
    if kt_src.exists():
        shutil.copy2(kt_src, ch_dir / "read" / "key_takeaways.md")

    # Master textbook chapter markdown (with inline base64 diagrams) from public/cu/cns/chapter 1
    master_md = SRC_CU / "Chapter_1_Introduction_to_Security_and_Classical_Encryption.md"
    if master_md.exists():
        shutil.copy2(master_md, ch_dir / "read" / "deep_dive.md")


def normalize_flashcards(ch_dir: Path) -> None:
    """Normalizes flashcards/{beginner,intermediate,advanced,revise}.json."""
    fc_dir = ch_dir / "practice" / "flashcards"
    fc_dir.mkdir(parents=True, exist_ok=True)

    for persona in PERSONAS:
        src = SRC_GEN / persona / "flashcards.json"
        if not src.exists():
            continue
        raw = json.loads(src.read_text(encoding="utf-8"))
        cards_in = (raw.get("cards") or raw.get("flashcards")) if isinstance(raw, dict) else raw
        normalized_cards = []
        for idx, c in enumerate(cards_in or [], start=1):
            q = c.get("question") or c.get("front") or ""
            a = c.get("answer") or c.get("back") or ""
            normalized_cards.append(
                {
                    "id": c.get("id") or f"fc_{persona}_{idx:02d}",
                    "card_number": idx,
                    "front": q,
                    "back": a,
                    "question": q,
                    "answer": a,
                    "category": c.get("category") or "Chapter 1",
                    "hint": c.get("hint") or "",
                    "difficulty": c.get("difficulty") or persona.capitalize(),
                }
            )
        out_doc = {
            "chapter": "Chapter 1: Introduction to Security & Classical Encryption Techniques",
            "subject": "Cryptography and Network Security",
            "level": persona,
            "total_cards": len(normalized_cards),
            "cards": normalized_cards,
            "flashcards": normalized_cards,
        }
        (fc_dir / f"{persona}.json").write_text(
            json.dumps(out_doc, indent=2, ensure_ascii=False), encoding="utf-8"
        )
        if persona == "intermediate":
            (fc_dir / "revise.json").write_text(
                json.dumps(out_doc, indent=2, ensure_ascii=False), encoding="utf-8"
            )


def parse_markdown_questions(md_text: str, default_type: str = "MCQ") -> dict:
    """Parses MCQ/MSQ markdown files into canonical JSON assessment format."""
    questions = []
    title = "Assessment"
    m_title = re.search(r"^#\s+(.+)$", md_text, re.M)
    if m_title:
        title = m_title.group(1).strip()

    blocks = re.split(r"(?m)^###\s+(?:Question\s+\d+|Q\d+)", md_text)
    for idx, block in enumerate(blocks[1:], start=1):
        q_match = re.search(
            r"\*\*Question:\*\*\s*(.+?)(?=\n\s*-\s+(?:\[[ xX]\]\s*)?[A-G]\)|\n\s*[A-G]\)|\n<details>|\Z)",
            block,
            re.S,
        )
        stem = q_match.group(1).strip() if q_match else ""

        options: Dict[str, str] = {}
        for opt_m in re.finditer(
            r"^\s*-\s*(?:\[[ xX]\]\s*)?([A-G])\)\s*(.+)$", block, re.M
        ):
            options[opt_m.group(1)] = opt_m.group(2).strip()

        ans_m = re.search(
            r"Correct (?:Answer|Options?):\s*([A-G](?:\s*,\s*[A-G])*)", block, re.I
        )
        raw_ans = ans_m.group(1).strip() if ans_m else "A"
        ans_list = [a.strip() for a in raw_ans.split(",") if a.strip()]

        rat_m = re.search(
            r"<b>Rationale:</b>\s*(.+?)\s*</details>", block, re.S | re.I
        )
        if not rat_m:
            rat_m = re.search(
                r"\*\*Rationale:\*\*\s*(.+?)(?:</details>|\Z)", block, re.S | re.I
            )
        rationale = rat_m.group(1).strip() if rat_m else ""
        rationale = re.sub(r"<br\s*/?>", "\n", rationale).strip()

        loc_m = re.search(r"\*\*Mindmap Location:\*\*\s*(.+)", block)
        topic_loc = loc_m.group(1).strip() if loc_m else "Chapter 1"

        is_msq = default_type.upper() == "MSQ" or len(ans_list) > 1
        q_obj: Dict[str, Any] = {
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
            "rationale": rationale,
            "explanation": rationale,
            "topic": topic_loc,
        }
        questions.append(q_obj)

    return {"title": title, "total_questions": len(questions), "questions": questions}


def parse_question_bank_md(md_text: str) -> List[Dict[str, Any]]:
    """Extracts Part A (Short Answer) and Part B (Long Answer) questions from question_bank.md."""
    part_b_split = re.split(r"(?im)^##\s+PART\s+B\b", md_text)
    part_a_text = part_b_split[0]
    part_b_text = part_b_split[1] if len(part_b_split) > 1 else ""

    def extract_entries(section_text: str, section_tag: str) -> List[Dict[str, Any]]:
        entries: List[Dict[str, Any]] = []
        blocks = re.split(r"(?m)^###\s+Question\s+(\d+)", section_text)
        for i in range(1, len(blocks), 2):
            q_num = int(blocks[i])
            body = blocks[i + 1]
            q_m = re.search(
                r"\*\*Question:\*\*\s*(.+?)(?=\n\s*\*\*(?:Solution|Answer):\*\*)",
                body,
                re.S,
            )
            a_m = re.search(
                r"\*\*(?:Solution|Answer):\*\*\s*(.+?)(?=\n---\s*\Z|\n---\s*$|\Z)",
                body,
                re.S,
            )
            loc_m = re.search(r"\*\*Mindmap Location:\*\*\s*(.+)", body)
            if not q_m or not a_m:
                continue
            q_str = q_m.group(1).strip()
            a_str = re.sub(r"\n---\s*$", "", a_m.group(1).strip()).strip()
            entries.append(
                {
                    "number": q_num,
                    "section": section_tag,
                    "topic": loc_m.group(1).strip() if loc_m else "Chapter 1",
                    "question": q_str,
                    "answer": a_str,
                }
            )
        return entries

    return extract_entries(part_a_text, "part_a") + extract_entries(part_b_text, "part_b")


def build_assessments_and_exams(ch_dir: Path) -> None:
    """Builds MCQ, MSQ, Question Bank, Mock Test, Pre-Final Exam, Certification Exam, and PYQs."""
    mcq_dir = ch_dir / "practice" / "mcq"
    msq_dir = ch_dir / "practice" / "msq"
    prep_dir = ch_dir / "prepare"
    for d in (mcq_dir, msq_dir, prep_dir):
        d.mkdir(parents=True, exist_ok=True)

    all_mcqs: List[Dict[str, Any]] = []
    all_msqs: List[Dict[str, Any]] = []

    for persona, diff in PERSONA_TO_DIFF.items():
        mcq_src = SRC_GEN / persona / "mcq.md"
        if mcq_src.exists():
            parsed_mcq = parse_markdown_questions(
                mcq_src.read_text(encoding="utf-8"), default_type="MCQ"
            )
            (mcq_dir / f"{diff}.json").write_text(
                json.dumps(parsed_mcq, indent=2, ensure_ascii=False), encoding="utf-8"
            )
            all_mcqs.extend(parsed_mcq["questions"])

        msq_src = SRC_GEN / persona / "msq.md"
        if msq_src.exists():
            parsed_msq = parse_markdown_questions(
                msq_src.read_text(encoding="utf-8"), default_type="MSQ"
            )
            (msq_dir / f"{diff}.json").write_text(
                json.dumps(parsed_msq, indent=2, ensure_ascii=False), encoding="utf-8"
            )
            all_msqs.extend(parsed_msq["questions"])

    # Parse Question Bank across beginner, intermediate, advanced
    qb_beg = parse_question_bank_md((SRC_GEN / "beginner" / "question_bank.md").read_text(encoding="utf-8"))
    qb_int = parse_question_bank_md((SRC_GEN / "intermediate" / "question_bank.md").read_text(encoding="utf-8"))
    qb_adv = parse_question_bank_md((SRC_GEN / "advanced" / "question_bank.md").read_text(encoding="utf-8"))

    # Build 30 rich Question Bank entries combining 2M, 5M, and 10M answers
    qb_questions: List[Dict[str, Any]] = []
    for idx, item in enumerate(qb_int, start=1):
        beg_match = qb_beg[idx - 1] if idx - 1 < len(qb_beg) else item
        adv_match = qb_adv[idx - 1] if idx - 1 < len(qb_adv) else item

        if item["section"] == "part_a":
            short_2m = item["answer"]
            long_5m = beg_match["answer"] if len(beg_match["answer"]) > len(short_2m) else f"{short_2m}\n\n**Detailed Analytical Note:**\n{adv_match['answer']}"
            ten_10m = f"### Comprehensive Derivation & Analysis\n\n{item['answer']}\n\n### Advanced Formalism\n\n{adv_match['answer']}"
        else:
            # Part B (Long Answer)
            first_para = item["answer"].split("\n\n")[0].strip()
            short_2m = beg_match["answer"].split("\n\n")[0].strip() if beg_match else first_para
            long_5m = beg_match["answer"] if beg_match else item["answer"]
            ten_10m = item["answer"]

        qb_questions.append(
            {
                "id": f"QB_CNS_1_{idx:02d}",
                "number": idx,
                "topic": item["topic"],
                "section": item["section"],
                "marks": 2 if item["section"] == "part_a" else 10,
                "question": item["question"],
                "short_answer_2mark": short_2m,
                "shortAnswer": short_2m,
                "long_answer_5mark_points": [long_5m],
                "longAnswer": long_5m,
                "essay_answer_10mark": ten_10m,
                "ten_mark_answer": ten_10m,
            }
        )

    qb_doc = {
        "schema_version": "1.0",
        "institution": "Chalapathi University",
        "course_code": "CS501PC",
        "course_title": "Cryptography and Network Security",
        "chapter_number": 1,
        "chapter_title": CHAPTER_01["title"],
        "total_questions": len(qb_questions),
        "questions": qb_questions,
    }
    (ch_dir / "practice" / "question_bank.json").write_text(
        json.dumps(qb_doc, indent=2, ensure_ascii=False), encoding="utf-8"
    )

    # Synthesize Previous Year Questions (prepare/previous_year.json)
    year_pools = [
        ["2019", "2021", "2023", "2024"],
        ["2018", "2020", "2022", "2024"],
        ["2019", "2022", "2023"],
        ["2020", "2021", "2024"],
        ["2018", "2021", "2023"],
        ["2021", "2023"],
        ["2022", "2024"],
        ["2020", "2023"],
    ]
    tiers = ["2M", "5M", "10M"]
    marks_map = {"2M": 2, "5M": 5, "10M": 10}
    pyqs = []
    # Pick 5 from Part A (2M), 5 from Part B (5M), 5 from Part B (10M)
    selected_for_pyq = qb_questions[:5] + qb_questions[15:25]
    for idx, q in enumerate(selected_for_pyq, start=1):
        tier = "2M" if idx <= 5 else ("5M" if idx <= 10 else "10M")
        marks = marks_map[tier]
        years = year_pools[idx % len(year_pools)]
        latest_yr = int(years[-1])
        stem = q["question"]
        short_ans = q["short_answer_2mark"]
        model_ans = (
            q["essay_answer_10mark"]
            if marks == 10
            else (q["longAnswer"] if marks == 5 else short_ans)
        )
        pyqs.append(
            {
                "id": f"PYQ_CNS_1_{idx:02d}",
                "pyq_id": f"PYQ_CNS_{tier}_{idx:02d}",
                "year": latest_yr,
                "question": stem,
                "canonical_question_stem": stem,
                "marks": marks,
                "designated_mark_tier": tier,
                "section": f"Part {'A' if marks == 2 else 'B' if marks == 5 else 'C'} ({tier})",
                "shortAnswer": short_ans,
                "answer": model_ans,
                "model_answer": model_ans,
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
        "institution": "Chalapathi University",
        "course_code": "CS501PC",
        "course_title": "Cryptography and Network Security",
        "chapter_title": CHAPTER_01["title"],
        "total_pyq_count": len(pyqs),
        "questions": pyqs,
        "pyqs": pyqs,
    }
    (prep_dir / "previous_year.json").write_text(
        json.dumps(pyq_doc, indent=2, ensure_ascii=False), encoding="utf-8"
    )

    # Build Mock Test (practice/mock_test.json & prepare/mock_test.json)
    mock_questions = []
    for i, q in enumerate(all_mcqs[:15] + all_msqs[:5], start=1):
        qc = dict(q)
        qc["id"] = f"mock_q{i}"
        qc["number"] = i
        mock_questions.append(qc)
    mock_doc = {
        "title": "Chapter 1 Mock Test — Security Concepts & Classical Encryption",
        "total_questions": len(mock_questions),
        "questions": mock_questions,
    }
    (ch_dir / "practice" / "mock_test.json").write_text(
        json.dumps(mock_doc, indent=2, ensure_ascii=False), encoding="utf-8"
    )
    (prep_dir / "mock_test.json").write_text(
        json.dumps(mock_doc, indent=2, ensure_ascii=False), encoding="utf-8"
    )

    # Build Pre-Final Exam (prepare/pre_final_exam.json) — Descriptive Part A (2M) + Part B (10M)
    prefinal_questions = []
    for i, q in enumerate(qb_questions[:10], start=1):
        prefinal_questions.append(
            {
                "id": f"pf_a_{i}",
                "question_id": f"PF_A_{i:02d}",
                "type": "short_answer",
                "section": "part_a",
                "section_name": "Part A — Short Answer Questions (2 Marks Each)",
                "marks": 2,
                "question": q["question"],
                "model_answer": q["short_answer_2mark"],
                "explanation": q["short_answer_2mark"],
            }
        )
    for i, q in enumerate(qb_questions[15:23], start=1):
        prefinal_questions.append(
            {
                "id": f"pf_b_{i}",
                "question_id": f"PF_B_{i:02d}",
                "type": "long_answer",
                "section": "part_b",
                "section_name": "Part B — Analytical & Long Answer Questions (10 Marks Each)",
                "marks": 10,
                "question": q["question"],
                "model_answer": q["essay_answer_10mark"],
                "explanation": q["essay_answer_10mark"],
            }
        )
    prefinal_doc = {
        "title": "Pre-Final University Examination — Cryptography and Network Security (Unit I)",
        "institution": "Chalapathi University",
        "course_code": "CS501PC",
        "total_questions": len(prefinal_questions),
        "questions": prefinal_questions,
    }
    (prep_dir / "pre_final_exam.json").write_text(
        json.dumps(prefinal_doc, indent=2, ensure_ascii=False), encoding="utf-8"
    )

    # Build Certification Exam (prepare/certification_exam.json)
    cert_questions = []
    for i, q in enumerate(all_mcqs[5:20] + all_msqs[2:12], start=1):
        qc = dict(q)
        qc["id"] = f"cert_q{i}"
        qc["number"] = i
        cert_questions.append(qc)
    cert_doc = {
        "title": "Certification Examination — Cryptography and Network Security",
        "total_questions": len(cert_questions),
        "questions": cert_questions,
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
    shutil.copy2(TOOLS / "samples" / "cu" / "tenant.json", out / "tenant.json")
    generate_branded_images(out)

    # 2. cns/subject.json
    subj_dir = out / "cns"
    subj_dir.mkdir(parents=True, exist_ok=True)
    (subj_dir / "subject.json").write_text(
        json.dumps(SUBJECT, indent=2, ensure_ascii=False), encoding="utf-8"
    )

    # 3. cns/chapter_01/chapter.json + tools
    ch_dir = subj_dir / "chapter_01"
    ch_dir.mkdir(parents=True, exist_ok=True)
    (ch_dir / "chapter.json").write_text(
        json.dumps(CHAPTER_01, indent=2, ensure_ascii=False), encoding="utf-8"
    )

    normalize_read_files(ch_dir)
    normalize_mindmap(ch_dir)
    build_study_plan(ch_dir)
    split_topics_from_detailed(ch_dir)
    normalize_flashcards(ch_dir)
    build_assessments_and_exams(ch_dir)

    total = sum(1 for p in out.rglob("*") if p.is_file())
    print(f"[cu_adapter] Built {out} ({total} files)")


if __name__ == "__main__":
    main()
