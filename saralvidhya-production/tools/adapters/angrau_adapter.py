"""Adapter: upgrades saralvidhya-production/content/angrau into a 100% canonical sv-publish bundle.

Populates:
  - tenant.json + assets/logo.png + assets/favicon.png
  - entomology/subject.json + entomology/assets/icon.png
  - entomology/chapter_01..04/chapter.json + media/hero.png + learn/videos.json
  - Normalizes legacy 'read/Quick Check/...' -> 'read/quick_check/{quick|detailed}/{persona}.{json,md}'
  - Converts any Markdown-in-.json files (mindmaps, flashcards, MCQs, mock tests, certification exams)
    into valid canonical JSON and packages flashcard images into practice/flashcards/images/.
  - Removes legacy 'metadata.json' so sv-publish validate passes with zero errors.
"""
import argparse
import json
import re
import shutil
import urllib.parse
from pathlib import Path

TOOLS = Path(__file__).resolve().parent.parent
REPO_ROOT = TOOLS.parent.parent
MVP_PUBLIC = REPO_ROOT / "saralvidhya-mvp" / "public"
MEDHA_PUBLIC = REPO_ROOT / "saralvidhya-medha" / "public" / "generated_resources" / "Entomology"
DEFAULT_OUT = TOOLS.parent / "content" / "angrau"

SUBJECT = {
    "id": "entomology",
    "name": "Fundamentals of Entomology",
    "code": "ENTO 131",
    "subtitle": "B.Sc Agriculture",
    "programLabel": "B.Sc. (Hons.) Agriculture",
    "description": "Insect morphology, digestive physiology, metamorphosis, weathering of rocks & minerals, and crop pollination.",
    "credits": 3,
    "parentNodeId": "bsc_agri",
    "order": 1,
    "status": "active",
    "iconBlob": "assets/icon.png",
    "assets": {
        "icon": "assets/icon.png",
    },
    "cardStyle": {
        "accentColor": "#059669",
        "badgeText": "Core Agriculture",
    },
}

CHAPTER_CONFIGS = {
    "chapter_01": {
        "heroSource": "chapter-digestive-hero.png",
        "chapter": {
            "number": 1,
            "title": "Insect Digestive System",
            "shortTitle": "Digestive System",
            "description": "Anatomy and physiology of the insect alimentary canal: foregut, midgut, hindgut, symbiotic digestion, and excretory integration.",
            "estimatedMinutes": 45,
            "heroImageBlob": "media/hero.png",
            "assets": {
                "heroImage": "media/hero.png",
                "mindmapImage": "learn/mindmap.jpeg",
            },
            "topics": [
                {
                    "id": "topic_1",
                    "label": "Three Primary Gut Regions",
                    "order": 1,
                    "topicNum": 1,
                    "subtopics": [
                        "Foregut / Stomodaeum Anatomy",
                        "Proventriculus Cuticular Teeth",
                        "Peritrophic Membrane Barrier",
                    ],
                },
                {
                    "id": "topic_2",
                    "label": "Salivary Glands & Specialised Secretions",
                    "order": 2,
                    "topicNum": 2,
                    "subtopics": [
                        "Protease & Amylase Secretion",
                        "Symbiotic Digestion & Microflora",
                        "Termite Hindgut Fermentation",
                    ],
                },
                {
                    "id": "topic_3",
                    "label": "Specialized Physiological Adaptations",
                    "order": 3,
                    "topicNum": 3,
                    "subtopics": [
                        "Alkaline Midgut in Lepidoptera",
                        "Bt Cry Toxin Receptor Binding",
                        "Endocrine Control of Digestion",
                    ],
                },
                {
                    "id": "topic_4",
                    "label": "Excretory Integration & Gut Renewal",
                    "order": 4,
                    "topicNum": 4,
                    "subtopics": [
                        "Malpighian Tubules Excretion",
                        "Cryptonephridial Water Extraction",
                        "Rectal Pads & Osmoregulation",
                    ],
                },
            ],
            "videos": [
                {
                    "id": "vid_ento_ch1_01",
                    "title": "Insects Digestive System",
                    "provider": "youtube",
                    "videoId": "Ioa25iYy53g",
                    "thumbnail": "media/hero.png",
                    "duration": "10:15min",
                    "durationSeconds": 615,
                    "topics": [
                        "Anatomy of the Insect Alimentary Canal: Foregut, Midgut & Hindgut",
                        "Stomodaeal Specializations: Pharynx, Crop, and Proventriculus (Gizzard)",
                        "Mesenteron Physiology: Secretory Epithelium & Peritrophic Membrane",
                        "Proctodaeum & Excretion: Malpighian Tubules & Water Reabsorption",
                        "Enzymatic Digestion & Nutritional Adaptations in Insects",
                    ],
                    "order": 1,
                }
            ],
        },
    },
    "chapter_02": {
        "heroSource": "chapter-metamorphosis-hero.png",
        "chapter": {
            "number": 2,
            "title": "Metamorphosis & Diapause",
            "shortTitle": "Metamorphosis",
            "description": "Post-embryonic morphogenesis, ametabolous, hemimetabolous and holometabolous development, endocrine regulation, and diapause.",
            "estimatedMinutes": 50,
            "heroImageBlob": "media/hero.png",
            "assets": {
                "heroImage": "media/hero.png",
                "mindmapImage": "learn/mindmap.png",
            },
            "topics": [
                {
                    "id": "topic_1",
                    "label": "Morphogenesis Framework",
                    "order": 1,
                    "topicNum": 1,
                    "subtopics": [
                        "Post-Embryonic Morphogenesis Phases",
                        "Apolysis & Ecdysis Cycle",
                    ],
                },
                {
                    "id": "topic_2",
                    "label": "Types of Metamorphosis",
                    "order": 2,
                    "topicNum": 2,
                    "subtopics": [
                        "Ametabolous & Hemimetabolous Systems",
                        "Holometabolous Metamorphosis",
                    ],
                },
                {
                    "id": "topic_3",
                    "label": "Immature & Pupal Classifications",
                    "order": 3,
                    "topicNum": 3,
                    "subtopics": [
                        "Histolysis & Histogenesis in Pupae",
                        "Imaginal Discs Morphogenesis",
                    ],
                },
                {
                    "id": "topic_4",
                    "label": "Hypermetamorphosis",
                    "order": 4,
                    "topicNum": 4,
                    "subtopics": ["Blister Beetle Larval Instars"],
                },
                {
                    "id": "topic_5",
                    "label": "Endocrine Regulation",
                    "order": 5,
                    "topicNum": 5,
                    "subtopics": [
                        "Prothoracicotropic Hormone (PTTH)",
                        "Ecdysone & Juvenile Hormone (JH)",
                        "Bursicon Cuticle Tanning Cascade",
                    ],
                },
                {
                    "id": "topic_6",
                    "label": "Diapause & Dormancy",
                    "order": 6,
                    "topicNum": 6,
                    "subtopics": [
                        "Photoperiodic Induction of Diapause",
                        "Supercooling & Cryoprotectants",
                        "Termination of Diapause Signaling",
                    ],
                },
            ],
            "videos": [
                {
                    "id": "vid_ento_ch2_01",
                    "title": "Insect Metamorphosis & Diapause",
                    "provider": "youtube",
                    "videoId": "7TyeiuOEVBo",
                    "thumbnail": "media/hero.png",
                    "duration": "10:30min",
                    "durationSeconds": 630,
                    "topics": [
                        "Morphogenesis Framework: Three Categories of Insect Metamorphosis",
                        "Types of Metamorphosis: Ametabolous, Hemimetabolous & Holometabolous",
                        "Immature Stages & Pupal Classifications",
                        "Hypermetamorphosis & Endocrine Regulation (Ecdysone & Juvenile Hormone)",
                        "Diapause & Dormancy in Pest Management",
                    ],
                    "order": 1,
                }
            ],
        },
    },
    "chapter_03": {
        "heroSource": "chapter-weathering-hero.png",
        "chapter": {
            "number": 3,
            "title": "Weathering of Rocks and Minerals",
            "shortTitle": "Weathering",
            "description": "Physical, chemical, and biological weathering processes, regolith formation, Goldich stability series, and soil pedogenesis.",
            "estimatedMinutes": 45,
            "heroImageBlob": "media/hero.png",
            "assets": {
                "heroImage": "media/hero.png",
            },
            "topics": [
                {
                    "id": "topic_1",
                    "label": "Fundamentals & Regolith Genesis",
                    "order": 1,
                    "topicNum": 1,
                    "subtopics": [
                        "Regolith Formation & Bedrock Mantle",
                        "Soil Pedogenesis & Soil Horizons",
                    ],
                },
                {
                    "id": "topic_2",
                    "label": "Physical Weathering (Mechanical Agents)",
                    "order": 2,
                    "topicNum": 2,
                    "subtopics": [
                        "Mechanical & Physical Disintegration",
                        "Thermal Expansion & Frost Wedging",
                    ],
                },
                {
                    "id": "topic_3",
                    "label": "Biological Weathering (Living Agents)",
                    "order": 3,
                    "topicNum": 3,
                    "subtopics": [
                        "Biological Weathering by Arthropods",
                        "Organic Acid Secretion & Chelation",
                        "Burrowing Insects & Bioturbation",
                    ],
                },
                {
                    "id": "topic_4",
                    "label": "Synthesis & Quantitative Summary",
                    "order": 4,
                    "topicNum": 4,
                    "subtopics": ["Master Metric Reference Matrix"],
                },
            ],
            "videos": [
                {
                    "id": "vid_ento_ch3_01",
                    "title": "Weathering of Rocks and Minerals",
                    "provider": "youtube",
                    "videoId": "UMJFfCFFF4M",
                    "thumbnail": "media/hero.png",
                    "duration": "11:45min",
                    "durationSeconds": 705,
                    "topics": [
                        "Foundations of Weathering & Regolith-Saprolite Boundary Dynamics",
                        "Physical Weathering: Hydraulic Forces, Frost Wedging (9% Expansion) & Exfoliation",
                        "Chemical Weathering: Hydrolysis, Hydration, Carbonation, Oxidation & Reduction",
                        "Biological Agents: Pioneer Lichens, Microbial Geochemistry & Tree Root Wedging",
                        "Goldich Mineral Weathering Stability Series vs Bowen's Reaction Series",
                    ],
                    "order": 1,
                }
            ],
        },
    },
    "chapter_04": {
        "heroSource": "chapter-pollination-hero.png",
        "chapter": {
            "number": 4,
            "title": "Pollination, Pollinizers & Parthenocarpy",
            "shortTitle": "Pollination",
            "description": "Floral biology, autogamy, allogamy, entomophilous pollination vectors, orchard pollinizer geometry, and parthenocarpy.",
            "estimatedMinutes": 55,
            "heroImageBlob": "media/hero.png",
            "assets": {
                "heroImage": "media/hero.png",
                "mindmapImage": "learn/mindmap.png",
            },
            "topics": [
                {
                    "id": "topic_1",
                    "label": "Fundamentals of Floral Biology & Pollination Anatomy",
                    "order": 1,
                    "topicNum": 1,
                    "subtopics": ["Floral Biology & Pollination Anatomy"],
                },
                {
                    "id": "topic_2",
                    "label": "Self-Pollination (Autogamy) & Inbreeding Mechanisms",
                    "order": 2,
                    "topicNum": 2,
                    "subtopics": ["Autogamy & Inbreeding Depression"],
                },
                {
                    "id": "topic_3",
                    "label": "Cross-Pollination (Allogamy / Xenogamy) & Outcrossing",
                    "order": 3,
                    "topicNum": 3,
                    "subtopics": [
                        "Allogamy & Outcrossing Adaptations",
                        "Dichogamy & Herkogamy Systems",
                    ],
                },
                {
                    "id": "topic_4",
                    "label": "Pollinators & Pollination Vectors (Abiotic & Biotic)",
                    "order": 4,
                    "topicNum": 4,
                    "subtopics": [
                        "Entomophilous Pollinators & Vectors",
                        "Apis Cerana & Honeybee Foraging",
                        "Solitary Bees & Syrphid Vectors",
                    ],
                },
                {
                    "id": "topic_5",
                    "label": "Pollinizers & Orchard Layout Management",
                    "order": 5,
                    "topicNum": 5,
                    "subtopics": [
                        "Pollinizers & Orchard Layout Design",
                        "Pollen Trapping & Hive Density",
                    ],
                },
                {
                    "id": "topic_6",
                    "label": "Parthenocarpy (Seedless Fruit Development)",
                    "order": 6,
                    "topicNum": 6,
                    "subtopics": ["Parthenocarpy & Fruit Set Physiology"],
                },
            ],
            "videos": [
                {
                    "id": "vid_ento_ch4_01",
                    "title": "Pollination, Pollinizers & Parthenocarpy in Fruit Crops",
                    "provider": "youtube",
                    "videoId": "elWWuKv5b9Q",
                    "thumbnail": "media/hero.png",
                    "duration": "14:20min",
                    "durationSeconds": 860,
                    "topics": [
                        "Floral Biology Architecture & Angiosperm Double Fertilization",
                        "Self-Pollination (Autogamy): Homogamy, Cleistogamy & Chasmogamy",
                        "Cross-Pollination (Allogamy) & Self-Incompatibility (GSI vs SSI Systems)",
                        "Pollinizer Cultivar Proportion & Commercial Orchard Planting Geometry",
                        "Parthenocarpy: Vegetative, Stimulative & Stenospermocarpy Mechanisms",
                    ],
                    "order": 1,
                }
            ],
        },
    },
}

PERSONAS = ("beginner", "intermediate", "advanced")


def _clean_mermaid_label(s: str) -> str:
    s = s.strip()
    for pat in (
        r"^root\(\((.+?)\)\)$",
        r"^root\((.+?)\)$",
        r"^root\[(.+?)\]$",
        r"^\(\((.+?)\)\)$",
        r"^\((.+?)\)$",
        r"^\[\[(.+?)\]\]$",
        r"^\[(.+?)\]$",
        r"^\{(.+?)\}$",
        r'^"(.+?)"$',
    ):
        s = re.sub(pat, r"\1", s, flags=re.IGNORECASE)
    s = re.sub(r"^[-*+]\s+", "", s)
    return s.strip()


def parse_mermaid_mindmap_to_json(raw: str) -> dict:
    """Converts a Mermaid mindmap Markdown document into a canonical JSON node tree."""
    m = re.search(r"```mermaid\s*([\s\S]*?)```", raw, flags=re.IGNORECASE)
    body = m.group(1) if m else raw
    lines = body.splitlines()
    flat = []
    for line in lines:
        t = line.strip()
        if not t or t.startswith("%%") or t.lower() == "mindmap":
            continue
        indent = len(line) - len(line.lstrip(" "))
        depth = indent // 2
        label = _clean_mermaid_label(t)
        if label:
            flat.append({"depth": depth, "label": label})

    if not flat:
        return {"id": "root", "name": "Mindmap", "title": "Mindmap", "children": []}

    root_obj = {"depth": flat[0]["depth"], "label": flat[0]["label"], "children": []}
    stack = [root_obj]
    for item in flat[1:]:
        node = {"depth": item["depth"], "label": item["label"], "children": []}
        while len(stack) > 1 and stack[-1]["depth"] >= item["depth"]:
            stack.pop()
        stack[-1]["children"].append(node)
        stack.append(node)

    counter = {"topic": 1, "concept": 1, "node": 1}

    def to_tree(obj: dict, depth: int) -> dict:
        is_leaf = len(obj["children"]) == 0 and depth >= 1
        if depth == 0:
            nid = "root"
        elif is_leaf:
            nid = f"concept_{counter['concept']}"
            counter["concept"] += 1
        elif depth == 1:
            nid = f"topic_{counter['topic']}"
            counter["topic"] += 1
        else:
            nid = f"node_{counter['node']}"
            counter["node"] += 1
        res = {
            "id": nid,
            "name": obj["label"],
            "title": obj["label"],
            "topic": obj["label"],
        }
        if obj["children"]:
            res["children"] = [to_tree(c, depth + 1) for c in obj["children"]]
        return res

    tree = to_tree(root_obj, 0)
    tree["mindmap"] = {
        "id": tree["id"],
        "name": tree["name"],
        "title": tree["title"],
        "children": tree.get("children", []),
    }
    return tree


def normalize_mindmap(ch_dir: Path, cid: str) -> None:
    mm_json = ch_dir / "learn" / "mindmap.json"
    if cid == "chapter_01":
        src_jpeg = MEDHA_PUBLIC / "chapter_01" / "Learn" / "Mindmaps" / "Digestive System Mindmaps.jpeg"
        if src_jpeg.exists():
            shutil.copy2(src_jpeg, ch_dir / "learn" / "mindmap.jpeg")

    if not mm_json.exists():
        return
    raw = mm_json.read_text(encoding="utf-8", errors="replace").strip()
    if not raw.startswith("{"):
        # Save original Mermaid markdown as mindmap.md
        (ch_dir / "learn" / "mindmap.md").write_text(raw, encoding="utf-8")
        tree = parse_mermaid_mindmap_to_json(raw)
        mm_json.write_text(json.dumps(tree, indent=2, ensure_ascii=False), encoding="utf-8")
    else:
        data = json.loads(raw)
        if "mindmap" in data and isinstance(data["mindmap"], dict) and "children" not in data:
            mm_root = data["mindmap"]
            data["id"] = mm_root.get("id", "root")
            data["name"] = mm_root.get("title") or mm_root.get("name") or "Mindmap"
            data["title"] = data["name"]
            data["children"] = mm_root.get("children", [])
            mm_json.write_text(json.dumps(data, indent=2, ensure_ascii=False), encoding="utf-8")


def parse_markdown_flashcards(raw: str, ch_dir: Path, persona: str) -> dict:
    """Parses Markdown ### Card N blocks into canonical JSON and copies local images."""
    images_dir = ch_dir / "practice" / "flashcards" / "images"
    images_dir.mkdir(parents=True, exist_ok=True)
    medha_mindmaps_dir = MEDHA_PUBLIC / "chapter_01" / "Learn" / "Mindmaps"

    blocks = re.split(r"(?m)^###\s+Card\s+\d+\b", raw)
    cards = []
    for idx, blk in enumerate(blocks[1:], start=1):
        q_match = re.search(r"\*\*Q:\*\*\s*(.+)", blk)
        a_match = re.search(r"\*\*A:\*\*\s*(.+)", blk)
        img_match = re.search(r"!\[[^\]]*\]\(([^)]+)\)", blk)
        if not q_match or not a_match:
            continue
        front = q_match.group(1).strip()
        back = a_match.group(1).strip()
        info_url = None
        if img_match:
            raw_path = urllib.parse.unquote(img_match.group(1).strip())
            if raw_path.startswith("../Mindmaps/"):
                rel_in_mm = raw_path[len("../Mindmaps/") :]
                candidate = medha_mindmaps_dir / rel_in_mm
                if candidate.exists():
                    safe_name = f"card_{persona}_{idx}{candidate.suffix.lower()}"
                    shutil.copy2(candidate, images_dir / safe_name)
                    info_url = f"images/{safe_name}"
        card_obj = {
            "id": f"card_{idx}",
            "front": front,
            "back": back,
        }
        if info_url:
            card_obj["infographicUrl"] = info_url
        cards.append(card_obj)

    return {
        "chapter": CHAPTER_CONFIGS[ch_dir.name]["chapter"]["title"],
        "subject": "entomology",
        "level": persona,
        "flashcards": cards,
    }


def normalize_flashcards(ch_dir: Path, cid: str) -> None:
    fc_dir = ch_dir / "practice" / "flashcards"
    if not fc_dir.exists():
        return
    images_dir = fc_dir / "images"
    images_dir.mkdir(parents=True, exist_ok=True)

    for persona in PERSONAS:
        f = fc_dir / f"{persona}.json"
        if not f.exists():
            continue
        raw = f.read_text(encoding="utf-8", errors="replace").strip()
        if not raw.startswith("{") and not raw.startswith("["):
            parsed_data = parse_markdown_flashcards(raw, ch_dir, persona)
            f.write_text(json.dumps(parsed_data, indent=2, ensure_ascii=False), encoding="utf-8")
            continue

        data = json.loads(raw)
        cards = data.get("flashcards") or data.get("cards") or []
        for idx, card in enumerate(cards, start=1):
            # Normalize front/back aliases so both front/back and question/answer exist
            if "front" not in card and "question" in card:
                card["front"] = card["question"]
            if "back" not in card and "answer" in card:
                card["back"] = card["answer"]

            # Chapter 02: copy /generated_resources/Entomology/chapter_02/generated_infographics/... into images/
            info_url = card.get("infographicUrl")
            if isinstance(info_url, str) and "generated_infographics/" in info_url:
                rel_part = info_url.split("generated_infographics/", 1)[1]
                src_img = MEDHA_PUBLIC / "chapter_02" / "generated_infographics" / rel_part
                if src_img.exists():
                    safe_name = f"card_{persona}_{idx}{src_img.suffix.lower()}"
                    shutil.copy2(src_img, images_dir / safe_name)
                    card["infographicUrl"] = f"images/{safe_name}"
                else:
                    card.pop("infographicUrl", None)

            # Chapter 03: remove broken infographic_ref pointing to non-existent webp files
            if "infographic_ref" in card:
                ref_path = fc_dir / str(card["infographic_ref"])
                if not ref_path.exists():
                    card.pop("infographic_ref", None)
                    card["has_infographic"] = False

        data["flashcards"] = cards
        f.write_text(json.dumps(data, indent=2, ensure_ascii=False), encoding="utf-8")


def parse_markdown_questions(raw: str) -> dict:
    """Parses Markdown MCQ/MSQ assessment/exam files into canonical JSON."""
    header_pattern = re.compile(r"(?m)^(?:#{1,3})\s*(?:Question|Q)\.?\s*(\d+)\b[^\n]*$")
    matches = list(header_pattern.finditer(raw))
    questions = []

    for idx, m in enumerate(matches):
        q_num = int(m.group(1))
        start = m.end()
        end = matches[idx + 1].start() if idx + 1 < len(matches) else len(raw)
        blk = raw[start:end].strip()

        # Extract stem
        stem = ""
        q_inline = re.search(r"\*\*Question:\*\*\s*(.+)", blk)
        if q_inline:
            stem = q_inline.group(1).strip()
        else:
            # Take non-metadata, non-option lines before the first option
            stem_lines = []
            for line in blk.splitlines():
                s = line.strip()
                if not s or s == "#" or s == "---":
                    continue
                if re.match(r"^-\s*(?:\[\s*\]\s*)?(?:\*\*)?[\(\[]?[A-G][\)\]]?(?:\*\*)?\s+", s):
                    break
                if s.startswith("<details"):
                    break
                if re.match(r"^\*\*(?:Topic|Mindmap|Depth|Cognitive|Chapter|Action|Options)", s, re.I):
                    continue
                stem_lines.append(s)
            stem = " ".join(stem_lines).strip()

        # Extract options
        options = {}
        for line in blk.splitlines():
            s = line.strip()
            opt_m = re.match(
                r"^-\s*(?:\[\s*\]\s*)?(?:\*\*)?[\(\[]?([A-G])[\)\]]?(?:\*\*)?\s+(.+)$",
                s,
            )
            if opt_m:
                options[opt_m.group(1).upper()] = opt_m.group(2).strip()

        # Extract answer & rationale
        ans_letters = []
        rationale = ""
        det_m = re.search(r"<details[\s\S]*?</details>", blk, re.IGNORECASE)
        det_text = det_m.group(0) if det_m else blk

        ans_m1 = re.search(r"Correct\s+(?:Answer|Options?):\s*([A-G](?:\s*,\s*[A-G])*)", det_text, re.I)
        ans_m2 = re.search(r"\*\*Answer:\*\*\s*(.+?)(?:—|--|\n|<|$)", det_text, re.I)
        if ans_m1:
            ans_letters = re.findall(r"[A-G]", ans_m1.group(1).upper())
        elif ans_m2:
            ans_letters = re.findall(r"[A-G]", ans_m2.group(1).upper())

        rat_m1 = re.search(r"Rationale:\s*(.+?)(?:</details>|$)", det_text, re.I | re.S)
        rat_m2 = re.search(r"\*\*Answer:\*\*[^\n—-]+(?:—|--)\s*(.+?)(?:</details>|$)", det_text, re.I | re.S)
        if rat_m1:
            rationale = re.sub(r"\s+", " ", rat_m1.group(1)).strip()
        elif rat_m2:
            rationale = re.sub(r"\s+", " ", rat_m2.group(1)).strip()

        is_msq = len(ans_letters) > 1 or "- [ ]" in blk or "- **[A]**" in blk
        q_obj = {
            "id": f"q{q_num}",
            "number": q_num,
            "assessment_type": "MSQ" if is_msq else "MCQ",
            "question": stem,
            "stem": stem,
            "options": options,
            "correct_answer": ans_letters if is_msq else (ans_letters[0] if ans_letters else "A"),
            "rationale": rationale,
        }
        if stem and options:
            questions.append(q_obj)

    return {
        "total_questions": len(questions),
        "questions": questions,
    }


def normalize_assessments(ch_dir: Path) -> None:
    candidates = [
        ch_dir / "practice" / "mcq" / "easy.json",
        ch_dir / "practice" / "mcq" / "medium.json",
        ch_dir / "practice" / "mcq" / "hard.json",
        ch_dir / "practice" / "msq" / "easy.json",
        ch_dir / "practice" / "msq" / "medium.json",
        ch_dir / "practice" / "msq" / "hard.json",
        ch_dir / "practice" / "mock_test.json",
        ch_dir / "prepare" / "mock_test.json",
        ch_dir / "prepare" / "certification_exam.json",
    ]
    for f in candidates:
        if not f.exists():
            continue
        raw = f.read_text(encoding="utf-8", errors="replace").strip()
        if not raw.startswith("{") and not raw.startswith("["):
            parsed = parse_markdown_questions(raw)
            f.write_text(json.dumps(parsed, indent=2, ensure_ascii=False), encoding="utf-8")
        else:
            data = json.loads(raw)
            if isinstance(data, dict) and "sections" in data and "questions" not in data:
                flat_q = []
                for sec in data.get("sections", []):
                    for q in sec.get("questions", []):
                        if "correct_options" in q and "correct_answer" not in q:
                            q["correct_answer"] = q["correct_options"]
                        flat_q.append(q)
                data["questions"] = flat_q
                f.write_text(json.dumps(data, indent=2, ensure_ascii=False), encoding="utf-8")


def normalize_quick_check(ch_dir: Path) -> None:
    qc_legacy = ch_dir / "read" / "Quick Check"
    if not qc_legacy.exists():
        return

    mapping = {
        "Quick_Study": "quick",
        "Detailed_Study": "detailed",
    }
    for legacy_sub, canonical_sub in mapping.items():
        sub_dir = qc_legacy / legacy_sub
        if not sub_dir.exists():
            continue
        target_dir = ch_dir / "read" / "quick_check" / canonical_sub
        target_dir.mkdir(parents=True, exist_ok=True)
        for f in sub_dir.iterdir():
            if not f.is_file():
                continue
            name_lower = f.stem.lower()
            for p in PERSONAS:
                if name_lower.endswith(f"_{p}"):
                    dest = target_dir / f"{p}{f.suffix.lower()}"
                    shutil.copy2(f, dest)
                    break

    shutil.rmtree(qc_legacy)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--out", default=str(DEFAULT_OUT))
    args = ap.parse_args()
    out = Path(args.out).resolve()

    out.mkdir(parents=True, exist_ok=True)

    # 1. tenant.json + tenant assets
    shutil.copy2(TOOLS / "samples" / "angrau" / "tenant.json", out / "tenant.json")
    (out / "assets").mkdir(parents=True, exist_ok=True)
    logo_src = MVP_PUBLIC / "logo-angrau.png"
    if logo_src.exists():
        shutil.copy2(logo_src, out / "assets" / "logo.png")
        shutil.copy2(logo_src, out / "assets" / "favicon.png")

    # 2. entomology/subject.json + subject icon
    subj_dir = out / "entomology"
    subj_dir.mkdir(parents=True, exist_ok=True)
    (subj_dir / "subject.json").write_text(json.dumps(SUBJECT, indent=2), encoding="utf-8")
    (subj_dir / "assets").mkdir(parents=True, exist_ok=True)
    icon_src = MVP_PUBLIC / "subject-entomology-icon.png"
    if icon_src.exists():
        shutil.copy2(icon_src, subj_dir / "assets" / "icon.png")

    # 3. chapters
    for cid, cfg in CHAPTER_CONFIGS.items():
        ch_dir = subj_dir / cid
        ch_dir.mkdir(parents=True, exist_ok=True)

        # Normalize mindmap first (so mindmap.jpeg is copied before chapter.json validation)
        (ch_dir / "learn").mkdir(parents=True, exist_ok=True)
        normalize_mindmap(ch_dir, cid)

        # Write chapter.json
        ch_data = cfg["chapter"]
        (ch_dir / "chapter.json").write_text(json.dumps(ch_data, indent=2), encoding="utf-8")

        # Copy chapter hero illustration
        (ch_dir / "media").mkdir(parents=True, exist_ok=True)
        hero_src = MVP_PUBLIC / cfg["heroSource"]
        if hero_src.exists():
            shutil.copy2(hero_src, ch_dir / "media" / "hero.png")

        # Write learn/videos.json
        (ch_dir / "learn" / "videos.json").write_text(
            json.dumps({"videos": ch_data["videos"]}, indent=2), encoding="utf-8"
        )

        # Remove legacy metadata.json if present
        legacy_meta = ch_dir / "metadata.json"
        if legacy_meta.exists():
            legacy_meta.unlink()

        # Normalize legacy Quick Check directory, flashcards, and assessments
        normalize_quick_check(ch_dir)
        normalize_flashcards(ch_dir, cid)
        normalize_assessments(ch_dir)

    total = sum(1 for p in out.rglob("*") if p.is_file())
    print(f"[angrau_adapter] Upgraded {out} ({total} files)")


if __name__ == "__main__":
    main()
