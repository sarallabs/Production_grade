import os
import re
import json
import hashlib
import base64
import shutil
from io import BytesIO
from pathlib import Path
from PIL import Image

SRC = Path(r"C:\Users\Abhi\Downloads\All Units MP&OB")
MEDHA_PUBLIC = Path(r"d:\SV-Medha_ production_grade\saralvidhya-medha\public")
OUT_ROOT = MEDHA_PUBLIC / "generated_resources" / "Nagarjuna_University" / "MP_OB"
BANNER_SRC = Path(r"C:\Users\Abhi\.gemini\antigravity\brain\bc36d1f5-30e4-4aec-9ce0-6d716fdb09f2\mp_ob_banner_1794822383818.jpg")
BANNER_DST = MEDHA_PUBLIC / "mp_ob_banner.png"

UNIT_META = {
    1: {
        "name": "Introduction to Management Process & Organizational Behavior",
        "short": "Management Process & OB Foundations",
    },
    2: {
        "name": "Planning, Decision Making & Organizing",
        "short": "Planning, Decision Making & Organizing",
    },
    3: {
        "name": "Staffing, Directing, Leadership, Motivation & Controlling",
        "short": "Staffing, Directing & Controlling",
    },
    4: {
        "name": "Organisational Behaviour, Perception & Personality",
        "short": "OB Models, Perception & Personality",
    },
    5: {
        "name": "Group Dynamics, Transactional Analysis & Organizational Change",
        "short": "Group Dynamics, TA & Change",
    },
}

DATA_URI_RE = re.compile(r"data:image/([a-zA-Z0-9+.-]+);base64,([A-Za-z0-9+/=\r\n\s]+)")


def clean_treatment_leaks(text: str) -> str:
    # Replace internal generator file references like "MPOB-Introduction to ...-Treatment.md introduces"
    text = re.sub(
        r"MPOB-[^\n]*?-Treatment\.md\s+(introduces|states|lists|frames|notes|explains|defines|describes|highlights|quotes)",
        lambda m: f"The unit framework {m.group(1)}",
        text,
    )
    text = re.sub(r"MPOB-[^\n]*?-Treatment\.md", "the unit study material", text)
    return text


def process_banner():
    if not BANNER_SRC.exists():
        print("[WARN] Banner source not found:", BANNER_SRC)
        return
    im = Image.open(BANNER_SRC).convert("RGB")
    w, h = im.size
    # Detect dark inner square vs light outer border
    px = im.load()
    # Scan diagonal from top-left to find dark square boundary
    left, top, right, bottom = 0, 0, w, h
    for i in range(w // 3):
        r, g, b = px[i, h // 2]
        if r < 80 and g < 80 and b < 90:
            left = i
            break
    for i in range(h // 3):
        r, g, b = px[w // 2, i]
        if r < 80 and g < 80 and b < 90:
            top = i
            break
    for i in range(w - 1, 2 * w // 3, -1):
        r, g, b = px[i, h // 2]
        if r < 80 and g < 80 and b < 90:
            right = i + 1
            break
    for i in range(h - 1, 2 * h // 3, -1):
        r, g, b = px[w // 2, i]
        if r < 80 and g < 80 and b < 90:
            bottom = i + 1
            break
    if right - left > w * 0.6 and bottom - top > h * 0.6:
        im = im.crop((left + 2, top + 2, right - 2, bottom - 2))
    im = im.resize((768, 768), Image.Resampling.LANCZOS)
    im.save(BANNER_DST, format="PNG", optimize=True)
    print(f"[BANNER] Saved cropped 768x768 banner -> {BANNER_DST} ({BANNER_DST.stat().st_size} B)")


class ChapterMediaStore:
    def __init__(self, unit_num: int, ch_dir: Path):
        self.unit_num = unit_num
        self.media_dir = ch_dir / "media"
        self.media_dir.mkdir(parents=True, exist_ok=True)
        self.url_prefix = f"/generated_resources/Nagarjuna_University/MP_OB/chapter_{unit_num}/media"
        self.saved = {}

    def save_b64(self, subtype: str, b64_str: str) -> str:
        clean_b64 = re.sub(r"\s+", "", b64_str)
        raw_bytes = base64.b64decode(clean_b64)
        digest = hashlib.sha1(raw_bytes).hexdigest()[:16]
        ext = "jpg" if subtype.lower() == "jpeg" else subtype.lower()
        fname = f"img_{digest}.{ext}"
        if fname not in self.saved:
            # Verify valid image with Pillow
            with Image.open(BytesIO(raw_bytes)) as img:
                img.verify()
            out_path = self.media_dir / fname
            out_path.write_bytes(raw_bytes)
            self.saved[fname] = out_path
        return f"{self.url_prefix}/{fname}"


def sanitize_study_markdown(raw_md: str, media_store: ChapterMediaStore) -> str:
    txt = raw_md.replace("\r\n", "\n")
    txt = clean_treatment_leaks(txt)

    # Replace all inline data:image/* URIs with deduplicated /generated_resources/... URLs
    def _repl_img(m):
        url = media_store.save_b64(m.group(1), m.group(2))
        return url

    txt = DATA_URI_RE.sub(_repl_img, txt)

    # Upgrade inline <img> style inside <figure> so af-markdown.css max-height: 400px doesn't squash tall infographics
    txt = re.sub(
        r'(<img\b[^>]*?\bstyle=")([^"]*?)(")',
        lambda m: f'{m.group(1)}max-width: min(100%, 860px); max-height: none; height: auto; border-radius: 10px; box-shadow: 0 4px 14px rgba(0,0,0,0.12);{m.group(3)}',
        txt,
    )

    # Ensure display math $$...$$ has blank lines before & after so remark-math v6 always parses display blocks cleanly
    # Handle multiline $$\n...\n$$
    txt = re.sub(
        r"([^\n])\n(\$\$\s*\n[\s\S]*?\n\$\$)",
        r"\1\n\n\2",
        txt,
    )
    txt = re.sub(
        r"(\$\$\s*\n[\s\S]*?\n\$\$)\n([^\n])",
        r"\1\n\n\2",
        txt,
    )
    # Handle single-line $$...$$
    txt = re.sub(
        r"([^\n])\n(\$\$[^\n]+?\$\$)",
        r"\1\n\n\2",
        txt,
    )
    txt = re.sub(
        r"(\$\$[^\n]+?\$\$)\n([^\n])",
        r"\1\n\n\2",
        txt,
    )

    # Collapse 3+ consecutive blank lines to 2
    txt = re.sub(r"\n{3,}", "\n\n", txt).strip() + "\n"
    return txt


def parse_flashcards_md(raw_md: str, media_store: ChapterMediaStore, level: str):
    txt = raw_md.replace("\r\n", "\n")
    txt = clean_treatment_leaks(txt)
    # Split by ### Q<num>)
    parts = re.split(r"^###\s+Q(\d+)\)\s*$", txt, flags=re.M)
    # parts[0] is preamble, then pairs of (q_num, body)
    cards = []
    for i in range(1, len(parts), 2):
        q_num = int(parts[i])
        body = parts[i + 1]
        ans_split = re.split(r"^###\s+Ans\)\s*$", body, maxsplit=1, flags=re.M)
        if len(ans_split) != 2:
            raise ValueError(f"Card Q{q_num} missing '### Ans)' separator")
        front = ans_split[0].strip()
        ans_raw = ans_split[1].strip()
        # Strip trailing --- separator if present
        ans_raw = re.sub(r"\n---\s*$", "", ans_raw).strip()

        # Extract embedded image
        img_match = DATA_URI_RE.search(ans_raw)
        if not img_match:
            raise ValueError(f"Card Q{q_num} missing embedded data:image infographic")
        info_url = media_store.save_b64(img_match.group(1), img_match.group(2))

        # Clean back text for left 35% card pane (remove HTML figure block, redundant bridge text & mermaid block)
        back = re.sub(r"<div\b[\s\S]*?</div>", "", ans_raw, flags=re.I)
        back = re.sub(r"<figure\b[\s\S]*?</figure>", "", back, flags=re.I)
        back = re.sub(r"```mermaid[\s\S]*?```", "", back)
        back = re.sub(r"^The concept flow below summarizes this relationship\.\s*$", "", back, flags=re.M)
        back = re.sub(r"^Review the visual summary below to anchor this concept\.\s*$", "", back, flags=re.M)
        back = re.sub(r"^Connect this takeaway to practical workplace management decisions\.\s*$", "", back, flags=re.M)
        back = re.sub(r"\n---\s*$", "", back)
        back = re.sub(r"\n{3,}", "\n\n", back).strip()

        if not front or not back:
            raise ValueError(f"Card Q{q_num} has empty front or back")

        cards.append(
            {
                "id": f"fc_{level}_{q_num:02d}",
                "front": front,
                "back": back,
                "infographicUrl": info_url,
                "level": level,
            }
        )
    return cards


def format_flashcards_md(cards, title: str) -> str:
    lines = [f"# {title}", ""]
    for idx, c in enumerate(cards, 1):
        lines.append(f"## Card {idx}")
        lines.append("")
        lines.append(f"**Front:** {c['front']}")
        lines.append("")
        lines.append(f"**Back:** {c['back']}")
        lines.append("")
        lines.append(f"![Card {idx} Infographic]({c['infographicUrl']})")
        lines.append("")
        lines.append("---")
        lines.append("")
    return "\n".join(lines)


def parse_questions_md(raw_md: str, expected_count: int, label: str):
    txt = raw_md.replace("\r\n", "\n")
    txt = clean_treatment_leaks(txt)
    parts = re.split(r"^###\s+Q(\d+)\)\s*$", txt, flags=re.M)
    questions = []
    for i in range(1, len(parts), 2):
        q_num = int(parts[i])
        block = parts[i + 1].strip()
        block = re.sub(r"\n---\s*$", "", block).strip()
        # Strip <details> and <summary> wrappers while keeping inner answer/rationale
        block_clean = re.sub(r"</?details>", "", block, flags=re.I)
        block_clean = re.sub(r"<summary>[\s\S]*?</summary>", "", block_clean, flags=re.I)

        # Extract options: - **A)** text  OR  - A) text
        opt_matches = list(
            re.finditer(r"^[ \t]*[-*][ \t]+(?:\*\*([A-F])\)\*\*|\*\*([A-F])\*\*|([A-F])\))[ \t]+(.+)$", block_clean, flags=re.M)
        )
        if len(opt_matches) < 2:
            raise ValueError(f"[{label}] Q{q_num}: found only {len(opt_matches)} options:\n{block_clean[:300]}")

        first_opt_start = opt_matches[0].start()
        stem = block_clean[:first_opt_start].strip()
        stem = re.sub(r"\*\*Options:\*\*\s*$", "", stem, flags=re.I).strip()
        # Remove section headers like "## Multiple Choice Questions (MSQ)" if attached
        stem = re.sub(r"\n+##\s+Multiple[^\n]*$", "", stem, flags=re.I).strip()

        options = []
        letters = []
        for m in opt_matches:
            ltr = (m.group(1) or m.group(2) or m.group(3)).upper()
            opt_txt = m.group(4).strip()
            letters.append(ltr)
            options.append(opt_txt)

        after_opts = block_clean[opt_matches[-1].end():]
        after_opts_no_bt = after_opts.replace("`", "")
        ans_m = re.search(r"\*\*Correct Answers?:\*\*\s*([A-F](?:\s*,\s*[A-F])*)", after_opts_no_bt, flags=re.I)
        if not ans_m:
            raise ValueError(f"[{label}] Q{q_num}: missing Correct Answer in:\n{after_opts[:300]}")
        ans_letters = [x.strip().upper() for x in ans_m.group(1).split(",") if x.strip()]
        for al in ans_letters:
            if al not in letters:
                raise ValueError(f"[{label}] Q{q_num}: answer {al} not in option letters {letters}")

        rat_m = re.search(r"\*\*Rationale:\*\*\s*([\s\S]*?)(?=\n##\s+|\n---\s*|$)", after_opts, flags=re.I)
        rationale = rat_m.group(1).strip() if rat_m else ""
        # Remove any trailing section header like "## Multiple Select Questions (MSQ)"
        rationale = re.sub(r"\n+##\s+[^\n]+$", "", rationale).strip()

        is_msq = len(ans_letters) > 1 or "select all that apply" in stem.lower() or "msq" in label.lower()
        questions.append(
            {
                "id": f"{label}_q{q_num:02d}",
                "type": "msq" if is_msq else "mcq",
                "stem": stem,
                "question": stem,
                "options": options,
                "letters": letters,
                "answer": ans_letters if is_msq else ans_letters[0],
                "explanation": rationale,
            }
        )

    if len(questions) != expected_count:
        raise ValueError(f"[{label}] Expected {expected_count} questions, parsed {len(questions)}")
    return questions


def format_questions_md(questions, title: str) -> str:
    """Formats questions in exact syntax compatible with parseAssessmentMarkdown() in assessmentService.ts."""
    lines = [f"# {title}", ""]
    for idx, q in enumerate(questions, 1):
        lines.append(f"### Question {idx}")
        lines.append("")
        lines.append(f"**Question:** {q['stem']}")
        lines.append("")
        for ltr, opt in zip(q["letters"], q["options"]):
            lines.append(f"- {ltr}) {opt}")
        lines.append("")
        ans_str = ", ".join(q["answer"]) if isinstance(q["answer"], list) else q["answer"]
        label_key = "Correct Answers" if isinstance(q["answer"], list) else "Correct Answer"
        lines.append(f"**{label_key}:** {ans_str}")
        lines.append("")
        if q["explanation"]:
            lines.append(f"**Rationale:** {q['explanation']}")
            lines.append("")
        lines.append("---")
        lines.append("")
    return "\n".join(lines)


def build_unit_mindmap(unit_num: int, indepth_md: str):
    """Builds both mindmap.json and mindmap.md from H2 and H3 headings in In_Depth_intermediate.md."""
    root_title = f"Unit {unit_num}: {UNIT_META[unit_num]['short']}"
    topics = []
    cur_h2 = None
    for line in indepth_md.splitlines():
        m2 = re.match(r"^##\s+(.+)$", line.strip())
        m3 = re.match(r"^###\s+(.+)$", line.strip())
        if m2:
            lbl = re.sub(r"\*+", "", m2.group(1)).strip()
            if lbl.lower().startswith("executive summary"):
                continue
            cur_h2 = {"name": lbl, "children": []}
            topics.append(cur_h2)
        elif m3 and cur_h2 is not None:
            lbl = re.sub(r"\*+", "", m3.group(1)).strip()
            cur_h2["children"].append({"name": lbl})

    tree = {"name": root_title, "children": topics}

    # Build mermaid mindmap
    def _safe_mm(s: str) -> str:
        return s.replace('"', "'").replace("(", "[").replace(")", "]")

    mm_lines = [f"# {UNIT_META[unit_num]['name']} — Mindmap", "", "```mermaid", "mindmap", f'  root(("{_safe_mm(root_title)}"))']
    for i, t in enumerate(topics, 1):
        mm_lines.append(f'    T{i}["{_safe_mm(t["name"])}"]')
        for j, c in enumerate(t.get("children", [])[:8], 1):
            mm_lines.append(f'      S{i}_{j}["{_safe_mm(c["name"])}"]')
    mm_lines.append("```")
    mm_lines.append("")
    return tree, "\n".join(mm_lines)


def main():
    process_banner()
    if OUT_ROOT.exists():
        shutil.rmtree(OUT_ROOT)
    OUT_ROOT.mkdir(parents=True, exist_ok=True)

    total_unique_images = 0
    total_questions = 0
    total_learn_cards = 0
    total_revise_cards = 0

    for u in range(1, 6):
        src_u = SRC / f"Unit-{u} MP&OB"
        ch_dir = OUT_ROOT / f"chapter_{u}"
        ch_dir.mkdir(parents=True, exist_ok=True)
        media_store = ChapterMediaStore(u, ch_dir)

        # 1. Essentials -> Learn/Quick_Summary/quick_summary_{tier}.md
        qs_dir = ch_dir / "Learn" / "Quick_Summary"
        qs_dir.mkdir(parents=True, exist_ok=True)
        for tier in ("beginner", "intermediate", "advanced"):
            raw_ess = (src_u / "Learn" / "Essentials" / f"Unit{u}_Essentials_{tier}.md").read_text(encoding="utf-8")
            clean_ess = sanitize_study_markdown(raw_ess, media_store)
            (qs_dir / f"quick_summary_{tier}.md").write_text(clean_ess, encoding="utf-8")

        # 2. In_Depth -> Learn/Detailed_Summary/detailed_summary_{tier}.md
        ds_dir = ch_dir / "Learn" / "Detailed_Summary"
        ds_dir.mkdir(parents=True, exist_ok=True)
        indepth_inter_clean = ""
        for tier in ("beginner", "intermediate", "advanced"):
            raw_ind = (src_u / "Learn" / "In_Depth" / f"Unit{u}_In_Depth_{tier}.md").read_text(encoding="utf-8")
            clean_ind = sanitize_study_markdown(raw_ind, media_store)
            (ds_dir / f"detailed_summary_{tier}.md").write_text(clean_ind, encoding="utf-8")
            if tier == "intermediate":
                indepth_inter_clean = clean_ind

        # 3. Mindmap -> Learn/Mindmaps/{mindmap.json, mindmap.md}
        mm_dir = ch_dir / "Learn" / "Mindmaps"
        mm_dir.mkdir(parents=True, exist_ok=True)
        mm_tree, mm_md = build_unit_mindmap(u, indepth_inter_clean)
        (mm_dir / "mindmap.json").write_text(json.dumps(mm_tree, indent=2, ensure_ascii=False), encoding="utf-8")
        (mm_dir / "mindmap.md").write_text(mm_md, encoding="utf-8")
        (ch_dir / "mindmap.json").write_text(json.dumps(mm_tree, indent=2, ensure_ascii=False), encoding="utf-8")

        # 4. Learn Flashcards -> Learn/Flashcards/flashcards_{tier}.{json,md}
        fc_dir = ch_dir / "Learn" / "Flashcards"
        fc_dir.mkdir(parents=True, exist_ok=True)
        for tier in ("beginner", "intermediate", "advanced"):
            raw_fc = (src_u / "Learn" / "Flashcards" / f"Unit{u}_Flashcards_{tier}.md").read_text(encoding="utf-8")
            cards = parse_flashcards_md(raw_fc, media_store, tier)
            assert len(cards) == 15, f"Unit {u} {tier} flashcards != 15"
            total_learn_cards += len(cards)
            fc_payload = {
                "chapter": f"Unit {u}: {UNIT_META[u]['name']}",
                "subject": "mp_ob",
                "persona": tier,
                "flashcards": cards,
            }
            (fc_dir / f"flashcards_{tier}.json").write_text(
                json.dumps(fc_payload, indent=2, ensure_ascii=False), encoding="utf-8"
            )
            (fc_dir / f"flashcards_{tier}.md").write_text(
                format_flashcards_md(cards, f"Unit {u}: {UNIT_META[u]['name']} ({tier.title()})"),
                encoding="utf-8",
            )

        # 5. Prepare Revise Flashcards -> Prepare/Revise/flashcards_revise.{json,md}
        rev_dir = ch_dir / "Prepare" / "Revise"
        rev_dir.mkdir(parents=True, exist_ok=True)
        raw_rev = (src_u / "Prepare" / "Revise" / f"Unit{u}_Revise_Flashcards.md").read_text(encoding="utf-8")
        rev_cards = parse_flashcards_md(raw_rev, media_store, "mixed")
        assert len(rev_cards) == 45, f"Unit {u} revise flashcards != 45"
        total_revise_cards += len(rev_cards)
        (rev_dir / "flashcards_revise.json").write_text(
            json.dumps({"chapter": f"Unit {u}", "subject": "mp_ob", "flashcards": rev_cards}, indent=2, ensure_ascii=False),
            encoding="utf-8",
        )
        (rev_dir / "flashcards_revise.md").write_text(
            format_flashcards_md(rev_cards, f"Unit {u}: Comprehensive Revision Flashcards"),
            encoding="utf-8",
        )

        # 6. Assessments MCQ & MSQ -> Learn/Assessments/{MCQ,MSQ}/{mcq,msq}_{diff}.{json,md}
        for kind, expected in (("MCQ", 10), ("MSQ", 10)):
            out_a_dir = ch_dir / "Learn" / "Assessments" / kind
            out_a_dir.mkdir(parents=True, exist_ok=True)
            prefix_low = kind.lower()
            for diff in ("easy", "medium", "hard"):
                raw_q = (src_u / "Learn" / "Assessments" / kind / f"Unit{u}_{kind}_{diff}.md").read_text(encoding="utf-8")
                qs = parse_questions_md(raw_q, expected, f"u{u}_{prefix_low}_{diff}")
                total_questions += len(qs)
                (out_a_dir / f"{prefix_low}_{diff}.json").write_text(
                    json.dumps({"unit": u, "difficulty": diff, "questions": qs}, indent=2, ensure_ascii=False),
                    encoding="utf-8",
                )
                (out_a_dir / f"{prefix_low}_{diff}.md").write_text(
                    format_questions_md(qs, f"Unit {u} {kind} Assessment ({diff.title()})"),
                    encoding="utf-8",
                )

        # 7. Mock Test (20 Qs) -> Prepare/Mock_Test/mock_test.{json,md} & mock_test_chapter_{u}.{json,md}
        mt_dir = ch_dir / "Prepare" / "Mock_Test"
        mt_dir.mkdir(parents=True, exist_ok=True)
        raw_mt = (src_u / "Prepare" / "Mock_Test" / f"Unit{u}_Mock_Test.md").read_text(encoding="utf-8")
        mt_qs = parse_questions_md(raw_mt, 20, f"u{u}_mock")
        total_questions += len(mt_qs)
        mt_json = json.dumps({"unit": u, "type": "mock_test", "questions": mt_qs}, indent=2, ensure_ascii=False)
        mt_md = format_questions_md(mt_qs, f"Unit {u}: Mock Test")
        for base_name in ("mock_test", f"mock_test_chapter_{u}"):
            (mt_dir / f"{base_name}.json").write_text(mt_json, encoding="utf-8")
            (mt_dir / f"{base_name}.md").write_text(mt_md, encoding="utf-8")

        # 8. Exam Prep (25 Qs) -> Examination/pre_final_exam.{json,md}
        ex_dir = ch_dir / "Examination"
        ex_dir.mkdir(parents=True, exist_ok=True)
        raw_ep = (src_u / "Examine" / "Exam_Prep" / f"Unit{u}_Exam_Prep.md").read_text(encoding="utf-8")
        ep_qs = parse_questions_md(raw_ep, 25, f"u{u}_exam_prep")
        total_questions += len(ep_qs)
        (ex_dir / "pre_final_exam.json").write_text(
            json.dumps({"unit": u, "type": "exam_prep", "questions": ep_qs}, indent=2, ensure_ascii=False),
            encoding="utf-8",
        )
        (ex_dir / "pre_final_exam.md").write_text(
            format_questions_md(ep_qs, f"Unit {u}: Exam Prep"),
            encoding="utf-8",
        )

        # 9. Certification Exam (25 Qs) -> Examination/certification_exam.{json,md}
        raw_ce = (src_u / "Examine" / "Certification_Exam" / f"Unit{u}_Certification_Exam.md").read_text(encoding="utf-8")
        ce_qs = parse_questions_md(raw_ce, 25, f"u{u}_cert_exam")
        total_questions += len(ce_qs)
        (ex_dir / "certification_exam.json").write_text(
            json.dumps({"unit": u, "type": "certification_exam", "questions": ce_qs}, indent=2, ensure_ascii=False),
            encoding="utf-8",
        )
        (ex_dir / "certification_exam.md").write_text(
            format_questions_md(ce_qs, f"Unit {u}: Certification Exam"),
            encoding="utf-8",
        )

        # 10. Chapter metadata.json
        meta_payload = {
            "chapter_number": u,
            "chapter_name": UNIT_META[u]["name"],
            "completed": ["summary", "detailed_view", "flashcards", "quiz", "mindmap"],
        }
        (ch_dir / "metadata.json").write_text(json.dumps(meta_payload, indent=2, ensure_ascii=False), encoding="utf-8")

        unit_imgs = len(media_store.saved)
        total_unique_images += unit_imgs
        print(
            f"[UNIT {u}] OK — {UNIT_META[u]['name']} | unique_webp={unit_imgs}, "
            f"learn_fc=45, revise_fc=45, questions=130"
        )

    print(
        f"\n[COMPLETE] All 5 MP&OB units built at {OUT_ROOT}\n"
        f"  Unique verified images : {total_unique_images}\n"
        f"  Learn flashcards       : {total_learn_cards}\n"
        f"  Revise flashcards      : {total_revise_cards}\n"
        f"  Parsed exam/quiz items : {total_questions}"
    )


if __name__ == "__main__":
    main()
