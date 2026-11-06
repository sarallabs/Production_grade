"""Adapter: VVIT/MongoDB folder layout -> canonical sv-publish folder.

Usage (from repo root):
    python saralvidhya-production/tools/adapters/vvit_adapter.py \
        --src "D:/VVIT/MongoDB - Copy" \
        --out saralvidhya-production/tools/build/vvit
"""
import argparse
import base64
import json
import re
import shutil
from pathlib import Path

TOOLS = Path(__file__).resolve().parent.parent
REPO_ROOT = TOOLS.parent.parent
MVP_PUBLIC = REPO_ROOT / "saralvidhya-mvp" / "public"
VVIT_DIR = REPO_ROOT / "saralvidhya-mvp" / "VVIT"

SUBJECT = {
    "id": "mongodb",
    "name": "NoSQL & MongoDB Essentials",
    "code": "CS304PC",
    "subtitle": "B.Tech CSE / IT",
    "programLabel": "B.Tech Computer Science & Engineering",
    "description": "MongoDB database creation, capped and standard collections, BSON & ObjectId ingestion, cursor retrieval, filtering, projection, pagination, atomic updates, and three-tier deletion.",
    "credits": 3,
    "order": 1,
    "status": "active",
    "parentNodeId": "sem_3",
    "iconBlob": "assets/icon.png",
    "assets": {
        "icon": "assets/icon.png",
    },
    "cardStyle": {
        "accentColor": "#546C60",
        "badgeText": "Core NoSQL",
    },
}

TOPICS = [
    {
        "id": "topic_1",
        "label": "Database Creation & Lazy Instantiation",
        "order": 1,
        "topicNum": 1,
        "subtopics": [
            '1.1 "use <DATABASE_NAME>" Context Switch & Lazy Allocation',
            '1.2 "db" Global Reference & Active Namespace Verification',
            '1.3 "show dbs" Storage Threshold & Default System Databases',
        ],
    },
    {
        "id": "topic_2",
        "label": "Collection Lifecycle: Explicit, Capped & Drop",
        "order": 2,
        "topicNum": 2,
        "subtopics": [
            '2.1 "db.createCollection(name, options)" Explicit Provisioning',
            '2.2 Capped Collections ("capped: true", "size", "max") & Auto-FIFO Eviction',
            '2.3 Implicit Collection Creation & "db.<collection>.drop()" Cleanup',
        ],
    },
    {
        "id": "topic_3",
        "label": "Document Ingestion & ObjectId Architecture",
        "order": 3,
        "topicNum": 3,
        "subtopics": [
            '3.1 "insertOne()" & "insert()" Single-Document Write Mechanics',
            '3.2 "insertMany()" Batch Array Ingestion & 12-Byte "_id: ObjectId" Generation',
        ],
    },
    {
        "id": "topic_4",
        "label": "Document Retrieval: Find vs FindOne Cursors",
        "order": 4,
        "topicNum": 4,
        "subtopics": [
            '4.1 "find()" Cursor Iterator vs "findOne()" Single-Document Resolution',
            '4.2 "pretty()" JSON Formatting & Implicit Logical AND Compound Filters',
        ],
    },
    {
        "id": "topic_5",
        "label": "Query Filtering, Projection & Cursor Pagination",
        "order": 5,
        "topicNum": 5,
        "subtopics": [
            '5.1 Comparison Operators ("$eq", "$ne", "$gt", "$gte", "$lt", "$lte", "$in", "$nin") & Logical Operators ("$and", "$or", "$not", "$nor")',
            '5.2 Field Projection Rules: Inclusion ("1"), Exclusion ("0"), and the "_id" Exception',
            '5.3 Cursor Chaining Pipeline: "sort(1|-1)", "skip(n)", and "limit(n)" Execution Order',
        ],
    },
    {
        "id": "topic_6",
        "label": "In-Place Document Updates & Atomic Operators",
        "order": 6,
        "topicNum": 6,
        "subtopics": [
            '6.1 "updateOne()", "updateMany()", "replaceOne()" & Whole-Document Replacement Hazard',
            '6.2 Atomic Update Modifiers ("$set", "$unset", "$inc", "$push", "$pull") & "upsert: true" Semantics',
        ],
    },
    {
        "id": "topic_7",
        "label": "Three-Tier Deletion Hierarchy (Doc, Collection, DB)",
        "order": 7,
        "topicNum": 7,
        "subtopics": [
            '7.1 Document-Level Removal: "deleteOne()", "deleteMany()", "remove()" & "deleteMany({})" Preservation of Indexes',
            '7.2 Collection Drop ("db.collection.drop()") vs Database Drop ("db.dropDatabase()") Destruction Scope',
        ],
    },
]

VIDEOS = [
    {
        "id": "vid_1",
        "order": 1,
        "title": "Part 1: Database Creation & Collection Lifecycle",
        "provider": "youtube",
        "videoId": "Zyqv9fMnTrc",
        "url": "https://www.youtube.com/watch?v=Zyqv9fMnTrc",
        "introEndTime": 70,
        "topics": [
            "use <DATABASE_NAME> Context Switch & Lazy Allocation",
            "db Global Reference & show dbs Storage Threshold",
            "Explicit Collection Provisioning: db.createCollection(name, options)",
            "Capped Collections (capped: true, size, max) & Auto-FIFO Eviction",
            "Implicit Collection Auto-Creation & db.<collection>.drop()",
        ],
    },
    {
        "id": "vid_2",
        "order": 2,
        "title": "Part 2: Document Ingestion & Cursor Retrieval",
        "provider": "youtube",
        "videoId": "TWtsTE0sLAQ",
        "url": "https://www.youtube.com/watch?v=TWtsTE0sLAQ",
        "introEndTime": 68,
        "topics": [
            "Single-Document Write Mechanics: insertOne() & insert()",
            "Batch Array Ingestion: insertMany() & 12-Byte _id: ObjectId Architecture",
            "Cursor Iteration with find() vs Single-Document findOne()",
            "JSON Formatting with pretty() & Implicit Logical AND Filters",
        ],
    },
    {
        "id": "vid_3",
        "order": 3,
        "title": "Part 3: Query Filtering, Projection & Cursor Pagination",
        "provider": "youtube",
        "videoId": "i1eoBK9RUDk",
        "url": "https://www.youtube.com/watch?v=i1eoBK9RUDk",
        "introEndTime": 0,
        "topics": [
            "Comparison Operators ($eq, $ne, $gt, $gte, $lt, $lte, $in, $nin)",
            "Logical Operators ($and, $or, $not, $nor) & Compound Queries",
            "Field Projection Rules: Inclusion (1), Exclusion (0) & _id Exception",
            "Cursor Chaining Pipeline: sort(1|-1), skip(n) & limit(n) Execution Order",
        ],
    },
    {
        "id": "vid_4",
        "order": 4,
        "title": "Part 4: In-Place Atomic Updates & Three-Tier Deletion",
        "provider": "youtube",
        "videoId": "K0lv_ubMinE",
        "url": "https://www.youtube.com/watch?v=K0lv_ubMinE",
        "introEndTime": 40,
        "topics": [
            "updateOne(), updateMany(), replaceOne() & Whole-Document Replacement",
            "Atomic Update Modifiers ($set, $unset, $inc, $push, $pull) & Upsert",
            "Document-Level Removal: deleteOne(), deleteMany() & Index Preservation",
            "Collection Drop (db.collection.drop()) vs Database Drop (db.dropDatabase())",
        ],
    },
    {
        "id": "vid_5",
        "order": 5,
        "title": "Complete Video: Databases, Collections & CRUD Operations",
        "provider": "youtube",
        "videoId": "g37gQCAyKf8",
        "url": "https://www.youtube.com/watch?v=g37gQCAyKf8",
        "introEndTime": 70,
        "topics": [
            "Database Creation & Lazy Instantiation (use, db, show dbs)",
            "Collection Lifecycle: Explicit Provisioning, Capped & Drop",
            "Document Ingestion & 12-Byte ObjectId Architecture",
            "Document Retrieval: find() Cursor vs findOne() & pretty()",
            "Query Filtering, Projection Rules & Cursor Pagination",
            "In-Place Document Updates & Atomic Operators ($set, $inc, $push)",
            "Three-Tier Deletion Hierarchy (Document, Collection & Database)",
        ],
    },
]

CHAPTER = {
    "number": 1,
    "title": "Databases, Collections & CRUD Operations",
    "shortTitle": "Databases, Collections & CRUD",
    "description": "Lazy database instantiation, collection provisioning & capped eviction, single/batch document ingestion with 12-byte ObjectId, find/findOne cursors, operators/projection/pagination, in-place atomic updates, and three-level deletion hierarchy.",
    "estimatedMinutes": 60,
    "heroImageBlob": "media/hero.png",
    "assets": {
        "heroImage": "media/hero.png",
    },
    "topics": TOPICS,
    "videos": VIDEOS,
}

LEVELS = ("beginner", "intermediate", "advanced")
DIFFICULTIES = ("easy", "medium", "hard")


def _normalize_md_base64(md_text: str) -> str:
    return re.sub(
        r"(data:image/[a-zA-Z0-9+.-]+;base64,)[A-Za-z0-9+/=\s]+",
        lambda m: m.group(1) + re.sub(r"\s+", "", m.group(0)[len(m.group(1)) :]),
        md_text,
    )


def cp(src: Path, dst: Path, log: list):
    if not src.exists():
        log.append(f"MISSING  {src}")
        return
    dst.parent.mkdir(parents=True, exist_ok=True)
    if dst.suffix.lower() == ".md":
        txt = src.read_text(encoding="utf-8")
        dst.write_text(_normalize_md_base64(txt), encoding="utf-8")
    else:
        shutil.copy2(src, dst)


def build_flashcards_with_images(src_json: Path, src_md: Path, dst_json: Path, ch_dir: Path, dst_persona: str, log: list):
    if not src_json.exists():
        log.append(f"MISSING  {src_json}")
        return
    jdata = json.loads(src_json.read_text(encoding="utf-8"))
    cards = jdata.get("cards", jdata if isinstance(jdata, list) else [])

    q_blocks = []
    if src_md.exists():
        md_text = src_md.read_text(encoding="utf-8")
        blocks = re.split(r"(?=^###\s+Q\d+\b)", md_text, flags=re.M)
        q_blocks = [b for b in blocks if re.match(r"^###\s+Q\d+\b", b)]

    img_dir = ch_dir / "practice" / "flashcards" / "images"
    img_dir.mkdir(parents=True, exist_ok=True)

    for idx, card in enumerate(cards):
        raw_id = card.get("card_id") or card.get("id") or f"FC-{idx + 1:03d}"
        if isinstance(card.get("back"), str):
            raw_back = card["back"].strip()
            cleaned_back = re.sub(r"^\s*(?:>\s*.*(?:\r?\n|$))+", "", raw_back).strip()
            if cleaned_back:
                card["back"] = cleaned_back
        if idx < len(q_blocks):
            m = re.search(r"(data:image/([a-zA-Z0-9+.-]+);base64,)([A-Za-z0-9+/=\s]+)", q_blocks[idx])
            if m:
                prefix = m.group(1)
                b64_clean = re.sub(r"\s+", "", m.group(3))
                data_uri = prefix + b64_clean
                img_rel = f"practice/flashcards/images/{raw_id}_{dst_persona}.webp"
                img_path = ch_dir / img_rel
                img_path.write_bytes(base64.b64decode(b64_clean))
                card["image"] = img_rel
                card["infographicUrl"] = data_uri

    dst_json.parent.mkdir(parents=True, exist_ok=True)
    dst_json.write_text(json.dumps(jdata, indent=2, ensure_ascii=False), encoding="utf-8")


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--src", default="D:/VVIT/MongoDB - Copy")
    ap.add_argument("--out", default=str(TOOLS / "build" / "vvit"))
    a = ap.parse_args()
    src, out = Path(a.src), Path(a.out)
    log: list = []

    if out.exists():
        shutil.rmtree(out)
    ch = out / "mongodb" / "chapter_01"

    # 1. Tenant + subject + chapter metadata + visual assets
    out.mkdir(parents=True, exist_ok=True)
    shutil.copy2(VVIT_DIR / "tenant.json", out / "tenant.json")
    logo_src = src / "VVIT_Logo.png" if (src / "VVIT_Logo.png").exists() else MVP_PUBLIC / "logo-vvit.png"
    cp(logo_src, out / "assets" / "logo.png", log)
    cp(logo_src, out / "assets" / "favicon.png", log)

    (out / "mongodb").mkdir(parents=True, exist_ok=True)
    (out / "mongodb" / "subject.json").write_text(json.dumps(SUBJECT, indent=2), encoding="utf-8")
    subj_icon = (
        src / "subject-mongodb-icon.png"
        if (src / "subject-mongodb-icon.png").exists()
        else MVP_PUBLIC / "subject-mongodb-icon.png"
    )
    cp(subj_icon, out / "mongodb" / "assets" / "icon.png", log)

    ch.mkdir(parents=True, exist_ok=True)
    (ch / "chapter.json").write_text(json.dumps(CHAPTER, indent=2), encoding="utf-8")
    ch_hero = (
        src / "chapter-mongodb-hero.png"
        if (src / "chapter-mongodb-hero.png").exists()
        else MVP_PUBLIC / "chapter-mongodb-hero.png"
    )
    cp(ch_hero, ch / "media" / "hero.png", log)

    # 2. Read (Chapter Quick & Detailed + QuickCheck + Key Takeaways + Glossary)
    for lvl in LEVELS:
        cp(src / f"Learn/Read/Quick_Study/VVIT_MongoDB_Quick_Study_{lvl}.md", ch / f"read/quick/{lvl}.md", log)
        cp(src / f"Learn/Read/Quick_Study/VVIT_MongoDB_Quick_Study_{lvl}.json", ch / f"read/quick/{lvl}.json", log)
        cp(src / f"Learn/Read/Detailed_Study/VVIT_MongoDB_Detailed_Study_{lvl}.md", ch / f"read/detailed/{lvl}.md", log)
        cp(src / f"Learn/Read/Detailed_Study/VVIT_MongoDB_Detailed_Study_{lvl}.json", ch / f"read/detailed/{lvl}.json", log)
        cp(src / f"Learn/Read/Quick Check/Quick_Study/VVIT_MongoDB_QuickCheck_Quick_{lvl}.md", ch / f"read/quick_check/quick/{lvl}.md", log)
        cp(src / f"Learn/Read/Quick Check/Quick_Study/VVIT_MongoDB_QuickCheck_Quick_{lvl}.json", ch / f"read/quick_check/quick/{lvl}.json", log)
        cp(src / f"Learn/Read/Quick Check/Detailed_Study/VVIT_MongoDB_QuickCheck_Detailed_{lvl}.md", ch / f"read/quick_check/detailed/{lvl}.md", log)
        cp(src / f"Learn/Read/Quick Check/Detailed_Study/VVIT_MongoDB_QuickCheck_Detailed_{lvl}.json", ch / f"read/quick_check/detailed/{lvl}.json", log)

    cp(src / "Resources/Key Takeaways/VVIT_MongoDB_Key_Takeaways.md", ch / "read/key_takeaways.md", log)
    cp(src / "Learn/Read/Glossary/VVIT_MongoDB_Glossary.md", ch / "read/glossary.md", log)

    # 3. Learn (Mindmap L1/L2, Study Plan, Level-1 Topics Quick/Detailed, Level-2 SubTopics Quick/Detailed)
    cp(src / "Resources/Mindmaps/VVIT_MongoDB_Mindmap_L1_L2.json", ch / "learn/mindmap.json", log)
    cp(src / "Resources/Mindmaps/VVIT_MongoDB_Mindmap_L1_L2.md", ch / "learn/mindmap.md", log)
    cp(src / "Prepare/Study Plan/study_plan.md", ch / "learn/study_plan.md", log)
    cp(src / "Prepare/Study Plan/study_plan.json", ch / "learn/study_plan.json", log)

    # Level-1 Topics (Quick + Detailed)
    for t in TOPICS:
        n = t["topicNum"]
        q_folders = list((src / "Learn/Read/Quick_Study/Topic_Level").glob(f"Topic_{n}_*"))
        if q_folders:
            for lvl in LEVELS:
                matches = list(q_folders[0].glob(f"*_{lvl}.md"))
                if matches:
                    cp(matches[0], ch / f"learn/topics/topic_{n}/{lvl}.md", log)
                else:
                    log.append(f"MISSING  L1 Quick topic_{n} {lvl}")
        else:
            log.append(f"MISSING  L1 Quick folder Topic_{n}_*")

        d_folders = list((src / "Learn/Read/Detailed_Study/Topic_Level").glob(f"Topic_{n}_*"))
        if d_folders:
            for lvl in LEVELS:
                matches = list(d_folders[0].glob(f"*_{lvl}.md"))
                if matches:
                    cp(matches[0], ch / f"learn/topics/topic_{n}_detailed/{lvl}.md", log)
                else:
                    log.append(f"MISSING  L1 Detailed topic_{n} {lvl}")
        else:
            log.append(f"MISSING  L1 Detailed folder Topic_{n}_*")

    # Level-2 SubTopics (Quick + Detailed)
    for q_sub_folder in sorted((src / "Learn/Read/Quick_Study/SubTopic_Level").glob("SubTopic_*")):
        m = re.match(r"SubTopic_(\d+)_(\d+)_", q_sub_folder.name)
        if not m:
            continue
        b_num, s_num = m.group(1), m.group(2)
        sub_id = f"subtopic_{b_num}_{s_num}"
        for lvl in LEVELS:
            matches = list(q_sub_folder.glob(f"*_{lvl}.md"))
            if matches:
                cp(matches[0], ch / f"learn/topics/{sub_id}/{lvl}.md", log)
            else:
                log.append(f"MISSING  L2 Quick {sub_id} {lvl}")

    for d_sub_folder in sorted((src / "Learn/Read/Detailed_Study/SubTopic_Level").glob("SubTopic_*")):
        m = re.match(r"SubTopic_(\d+)_(\d+)_", d_sub_folder.name)
        if not m:
            continue
        b_num, s_num = m.group(1), m.group(2)
        sub_id = f"subtopic_{b_num}_{s_num}_detailed"
        for lvl in LEVELS:
            matches = list(d_sub_folder.glob(f"*_{lvl}.md"))
            if matches:
                cp(matches[0], ch / f"learn/topics/{sub_id}/{lvl}.md", log)
            else:
                log.append(f"MISSING  L2 Detailed {sub_id} {lvl}")

    # 4. Practice (MCQ, MSQ, Question Bank, Flashcards)
    def copy_normalized_assessment(src_json: Path, dst_json: Path) -> None:
        if not src_json.exists():
            log.append(f"MISSING  {src_json}")
            return
        data = json.loads(src_json.read_text(encoding="utf-8"))
        for q in data.get("questions", []):
            if isinstance(q.get("question"), dict):
                q_obj = q["question"]
                if "stem" not in q and "stem" in q_obj:
                    q["stem"] = q_obj["stem"]
                if "options" not in q and "options" in q_obj:
                    q["options"] = q_obj["options"]
            if isinstance(q.get("answer"), dict):
                a_obj = q["answer"]
                if "correct_key" not in q and "key" in a_obj:
                    q["correct_key"] = a_obj["key"]
                if "correct_keys" not in q and "keys" in a_obj:
                    q["correct_keys"] = a_obj["keys"]
                if "explanation" not in q and "explanation" in a_obj:
                    q["explanation"] = a_obj["explanation"]
                if "model_answer" not in q and "model_answer" in a_obj:
                    q["model_answer"] = a_obj["model_answer"]
        dst_json.parent.mkdir(parents=True, exist_ok=True)
        dst_json.write_text(json.dumps(data, indent=2, ensure_ascii=False), encoding="utf-8")
        log.append(f"OK       {dst_json.relative_to(dst_json.parents[3])} (normalized questions)")

    for kind in ("MCQ", "MSQ"):
        for d in DIFFICULTIES:
            copy_normalized_assessment(
                src / f"Practice/Assessment/{kind}/VVIT_MongoDB_{kind}_{d}.json",
                ch / f"practice/{kind.lower()}/{d}.json",
            )
    cp(src / "Practice/Question Bank/VVIT_MongoDB_question_bank.json", ch / "practice/question_bank.json", log)
    for persona in LEVELS:
        build_flashcards_with_images(
            src / f"Practice/Revise/VVIT_MongoDB_Flashcards_{persona}.json",
            src / f"Practice/Revise/VVIT_MongoDB_Flashcards_{persona}.md",
            ch / f"practice/flashcards/{persona}.json",
            ch,
            persona,
            log,
        )
    build_flashcards_with_images(
        src / "Practice/Revise/VVIT_MongoDB_Flashcards_Revise.json",
        src / "Practice/Revise/VVIT_MongoDB_Flashcards_Revise.md",
        ch / "practice/flashcards/revise.json",
        ch,
        "revise",
        log,
    )

    # 5. Prepare (PYQ, Mock Test, Pre-Final Exam)
    cp(src / "Prepare/PYQ/VVIT_MongoDB_PYQ_Saralvidhya.json", ch / "prepare/previous_year.json", log)
    copy_normalized_assessment(src / "Prepare/Preparation Exam/VVIT_MongoDB_Mock_Test.json", ch / "practice/mock_test.json")
    copy_normalized_assessment(src / "Prepare/Preparation Exam/VVIT_MongoDB_Mock_Test.json", ch / "prepare/mock_test.json")
    cp(src / "Prepare/Preparation Exam/VVIT_MongoDB_Mock_Test.md", ch / "prepare/mock_test.md", log)
    copy_normalized_assessment(src / "Prepare/Preparation Exam/VVIT_MongoDB_Mock_Test.json", ch / "prepare/pre_final_exam.json")
    cp(src / "Prepare/Preparation Exam/VVIT_MongoDB_Mock_Test.md", ch / "prepare/pre_final_exam.md", log)

    # 6. Podcasts (Short, Long, 7 Level-1 Microcasts + Transcripts)
    listen = src / "Learn/Listen"
    trans_dir = listen / "Transcript"
    cp(listen / "Short Podcast.m4a", ch / "podcasts/short_podcast.m4a", log)
    cp(listen / "Long Podcast.m4a", ch / "podcasts/long_podcast.m4a", log)
    cp(trans_dir / "Short Podcast_transcript.json", ch / "podcasts/short_podcast.transcript.json", log)
    cp(trans_dir / "Short Podcast_transcript.txt", ch / "podcasts/short_podcast.md", log)
    cp(trans_dir / "Long Podcast_transcript.json", ch / "podcasts/long_podcast.transcript.json", log)
    cp(trans_dir / "Long Podcast_transcript.txt", ch / "podcasts/long_podcast.md", log)
    for f in sorted(listen.glob("[1-9]*.m4a")):
        m = re.match(r"(\d+)\.", f.name)
        if m:
            n = int(m.group(1))
            cp(f, ch / f"podcasts/microcast_{n:02d}.m4a", log)
            t_json = list(trans_dir.glob(f"{n}.*_transcript.json"))
            t_txt = list(trans_dir.glob(f"{n}.*_transcript.txt"))
            if t_json:
                cp(t_json[0], ch / f"podcasts/microcast_{n:02d}.transcript.json", log)
            if t_txt:
                cp(t_txt[0], ch / f"podcasts/microcast_{n:02d}.md", log)

    total = sum(1 for p in out.rglob("*") if p.is_file())
    print(f"Wrote {total} files to {out}")
    for line in log:
        print(line)


if __name__ == "__main__":
    main()
