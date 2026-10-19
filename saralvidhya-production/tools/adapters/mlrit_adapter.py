"""Adapter: legacy MLRIT/DBMS folder layout -> canonical sv-publish folder.

Usage (from repo root):
    python saralvidhya-production/tools/adapters/mlrit_adapter.py \
        --src MLRIT/DBMS --out saralvidhya-production/tools/build/mlrit

Then:
    sv-publish validate saralvidhya-production/tools/build/mlrit

Only copies files; the source folder is never modified.
"""
import argparse
import json
import re
import shutil
from pathlib import Path

TOOLS = Path(__file__).resolve().parent.parent

REPO_ROOT = TOOLS.parent.parent
MVP_PUBLIC = REPO_ROOT / "saralvidhya-mvp" / "public"

SUBJECT = {
    "id": "dbms",
    "name": "Database Management Systems",
    "code": "CS302PC",
    "subtitle": "B.Tech CSE",
    "programLabel": "B.Tech Computer Science & Engineering",
    "description": "Database system concepts, ER & EER modeling, relational foundations, integrity constraints, and SQL design.",
    "credits": 4,
    "order": 1,
    "status": "active",
    "parentNodeId": "sem_3",
    "iconBlob": "assets/icon.png",
    "assets": {
        "icon": "assets/icon.png",
    },
    "cardStyle": {
        "accentColor": "#365345",
        "badgeText": "Core CSE",
    },
}

VIDEOS = [
    {
        "id": "vid_dbms_01",
        "title": "Part 1: Database System Concepts & Architecture",
        "provider": "youtube",
        "videoId": "lBf1H_J6tj4",
        "duration": "16:20min",
        "durationSeconds": 980,
        "topics": [
            "Database Fundamentals & 3-Schema Engine Architecture",
            "Data Independence (Logical vs Physical) & DBMS Engine Components",
            "Database Users, DBA Roles & System Environment"
        ],
        "order": 1
    },
    {
        "id": "vid_dbms_02",
        "title": "Part 2: Entity-Relationship (ER) & Extended ER Modeling",
        "provider": "youtube",
        "videoId": "mYWnYfsHQoQ",
        "duration": "15:12min",
        "durationSeconds": 912,
        "topics": [
            "Entity Types, Attributes, Keys & Relationship Cardinalities",
            "Weak Entities, Identifying Relationships & Participation Constraints",
            "Advanced ER & Extended ER (EER) Specialization/Generalization"
        ],
        "order": 2
    },
    {
        "id": "vid_dbms_03",
        "title": "Part 3: Relational Model & Integrity Constraints",
        "provider": "youtube",
        "videoId": "JA0_3WDjasY",
        "duration": "15:52min",
        "durationSeconds": 952,
        "topics": [
            "Relational Model Foundations, Domains & Relation Schemas",
            "Superkeys, Candidate Keys, Primary Keys & Foreign Key Rules",
            "Domain, Entity Integrity & Referential Integrity Constraints"
        ],
        "order": 3
    },
    {
        "id": "vid_dbms_04",
        "title": "Part 4: Logical Database Design, SQL Views & Schema Evolution",
        "provider": "youtube",
        "videoId": "Cmc0E1CMa3A",
        "duration": "3:59min",
        "durationSeconds": 239,
        "topics": [
            "Logical Database Design: 7-Step ER-to-Relational Schema Translation",
            "Mapping Weak Entities, M:N Relationships & EER Hierarchies",
            "Relational Querying Foundations, SQL Views & Schema Evolution"
        ],
        "order": 4
    },
    {
        "id": "vid_dbms_complete",
        "title": "DBMS Complete Lecture: Database System Concepts, ER Model & Relational Design",
        "provider": "youtube",
        "videoId": "EQl-5nKXme0",
        "duration": "51:23min",
        "durationSeconds": 3083,
        "topics": [
            "Database Fundamentals & 3-Schema Engine Architecture",
            "Conceptual Database Design, ER & Extended ER (EER) Modeling",
            "Relational Model, Integrity Constraints, 7-Step Mapping & SQL Views"
        ],
        "order": 5
    }
]

CHAPTER = {
    "number": 1,
    "title": "Database System Concepts, ER Model & Relational Design",
    "shortTitle": "Database Concepts",
    "description": "Foundations of database management systems, 3-schema architecture, ER/EER conceptual modeling, and relational schema translation.",
    "estimatedMinutes": 60,
    "heroImageBlob": "media/hero.png",
    "assets": {
        "heroImage": "media/hero.png",
        "mindmapImage": "media/mindmap.png",
    },
    "topics": [
        {"id": "topic_1", "label": "Database Fundamentals & Engine Architecture", "order": 1, "topicNum": 1},
        {"id": "topic_2", "label": "Conceptual Database Design & ER Modeling", "order": 2, "topicNum": 2},
        {"id": "topic_3", "label": "Advanced ER & Extended ER (EER) Mechanisms", "order": 3, "topicNum": 3},
        {"id": "topic_4", "label": "Relational Model Foundations & Integrity Constraints", "order": 4, "topicNum": 4},
        {"id": "topic_5", "label": "Logical Database Design (ER-to-Relational Translation)", "order": 5, "topicNum": 5},
        {"id": "topic_6", "label": "Relational Querying, Views & Schema Evolution", "order": 6, "topicNum": 6},
    ],
    "videos": VIDEOS,
}
LEVELS = ("beginner", "intermediate", "advanced")
DIFFICULTIES = ("easy", "medium", "hard")


def cp(src: Path, dst: Path, log: list):
    if not src.exists():
        log.append(f"MISSING  {src}")
        return
    dst.parent.mkdir(parents=True, exist_ok=True)
    shutil.copy2(src, dst)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--src", default="MLRIT/DBMS")
    ap.add_argument("--out", default=str(TOOLS / "build" / "mlrit"))
    a = ap.parse_args()
    src, out = Path(a.src), Path(a.out)
    log: list = []

    if out.exists():
        shutil.rmtree(out)
    ch = out / "dbms" / "chapter_01"

    # tenant + subject + chapter metadata + visual assets
    out.mkdir(parents=True)
    shutil.copy2(TOOLS / "samples" / "mlrit" / "tenant.json", out / "tenant.json")
    cp(MVP_PUBLIC / "brand-tree-cropped.png", out / "assets" / "logo.png", log)
    cp(MVP_PUBLIC / "brand-tree-cropped.png", out / "assets" / "favicon.png", log)

    (out / "dbms").mkdir(parents=True, exist_ok=True)
    (out / "dbms" / "subject.json").write_text(json.dumps(SUBJECT, indent=2), encoding="utf-8")
    cp(MVP_PUBLIC / "subject-dbms-icon.png", out / "dbms" / "assets" / "icon.png", log)

    ch.mkdir(parents=True, exist_ok=True)
    (ch / "chapter.json").write_text(json.dumps(CHAPTER, indent=2), encoding="utf-8")
    cp(MVP_PUBLIC / "chapter-dbms-hero.png", ch / "media" / "hero.png", log)
    (ch / "learn").mkdir(parents=True, exist_ok=True)
    (ch / "learn" / "videos.json").write_text(json.dumps({"videos": VIDEOS}, indent=2), encoding="utf-8")

    # read
    for lvl in LEVELS:
        cp(src / f"Learn/Read/Quick_Study/DBMS_UNIT_I_Quick_Study_{lvl}.md", ch / f"read/quick/{lvl}.md", log)
        cp(src / f"Learn/Read/Detailed_Study/DBMS_UNIT_I_Detailed_Study_{lvl}.md", ch / f"read/detailed/{lvl}.md", log)
    cp(src / "Resources/Key Takeaways/key_takeaways.md", ch / "read/key_takeaways.md", log)

    # learn
    cp(src / "Resources/Mindmaps/DBMS_UNIT_I_Mindmap.json", ch / "learn/mindmap.json", log)
    cp(src / "Resources/Mindmaps/DBMS_UNIT_I_Mindmap.md", ch / "learn/mindmap.md", log)
    cp(src / "Resources/Mindmaps/NotebookLM Mind Map.png", ch / "media/mindmap.png", log)
    cp(src / "Prepare/Study Plan/study_plan.md", ch / "learn/study_plan.md", log)
    cp(src / "Prepare/Study Plan/study_plan.json", ch / "learn/study_plan.json", log)
    for t in CHAPTER["topics"]:
        n = t["topicNum"]
        folders = list((src / "Learn/Read/Topic_Level").glob(f"Topic_{n}_*"))
        if not folders:
            log.append(f"MISSING  topic folder {n}")
            continue
        for lvl in LEVELS:
            cp(folders[0] / f"DBMS_UNIT_I_Topic_{n}_{lvl}.md", ch / f"learn/topics/{t['id']}/{lvl}.md", log)

    # practice
    for kind in ("MCQ", "MSQ"):
        for d in DIFFICULTIES:
            cp(src / f"Practice/Assessment/{kind}/DBMS_UNIT_I_{kind}_{d.capitalize()}.json",
               ch / f"practice/{kind.lower()}/{d}.json", log)
    cp(src / "Practice/Question Bank/dbms_question_bank_v2.json", ch / "practice/question_bank.json", log)
    for persona in LEVELS + ("revise",):
        cp(src / f"Practice/Revise/DBMS_UNIT_I_Flashcards_{persona}.json",
           ch / f"practice/flashcards/{persona}.json", log)
    fc_images_dir = MVP_PUBLIC / "generated_resources" / "mlrit" / "dbms" / "chapter_01" / "practice" / "flashcards" / "images"
    if fc_images_dir.exists():
        for img_file in sorted(fc_images_dir.glob("*.*")):
            cp(img_file, ch / "practice" / "flashcards" / "images" / img_file.name, log)


    # prepare
    cp(src / "Prepare/PYQ/dbms_pyq.json", ch / "prepare/previous_year.json", log)
    cp(src / "Prepare/Preparation Exam/pre_final_exam.json", ch / "prepare/pre_final_exam.json", log)
    cp(src / "Prepare/Preparation Exam/certification_exam.json", ch / "prepare/certification_exam.json", log)
    cp(src / "Prepare/Preparation Exam/final_examination.json", ch / "prepare/final_exam.json", log)
    # exam markdown + answer keys (read by assessmentService / examiner flow)
    for name in ("pre_final_exam", "certification_exam"):
        cp(src / f"Prepare/Preparation Exam/{name}.md", ch / f"prepare/{name}.md", log)
    cp(src / "Prepare/Preparation Exam/final_examination.md", ch / "prepare/final_exam.md", log)
    cp(src / "Prepare/Preparation Exam/exam_rubric_and_keys.json", ch / "prepare/exam_rubric_and_keys.json", log)
    cp(src / "Prepare/Preparation Exam/examination_manifest.json", ch / "prepare/examination_manifest.json", log)

    # podcasts (audio + transcripts)
    listen = src / "Learn/Listen"
    cp(listen / "DBMS_Short_Podcast.m4a", ch / "podcasts/short_podcast.m4a", log)
    cp(listen / "DBMS_Long_Podcast.m4a", ch / "podcasts/long_podcast.m4a", log)
    for f in sorted(listen.glob("[1-9].*.m4a")):
        n = int(re.match(r"(\d+)\.", f.name).group(1))
        cp(f, ch / f"podcasts/microcast_{n:02d}.m4a", log)
    tr = src / "Learn/Listen/Transcript"
    cp(tr / "DBMS_Short_Podcast_transcript.md", ch / "podcasts/short_podcast.md", log)
    cp(tr / "DBMS_Long_Podcast_transcript.md", ch / "podcasts/long_podcast.md", log)
    for f in sorted(tr.glob("[1-9].*_transcript.md")):
        n = int(re.match(r"(\d+)\.", f.name).group(1))
        cp(f, ch / f"podcasts/microcast_{n:02d}.md", log)
    # timed transcripts (PodcastsView reads *_transcript.json for synced captions)
    cp(tr / "DBMS_Short_Podcast_transcript.json", ch / "podcasts/short_podcast.transcript.json", log)
    cp(tr / "DBMS_Long_Podcast_transcript.json", ch / "podcasts/long_podcast.transcript.json", log)
    for f in sorted(tr.glob("[1-9].*_transcript.json")):
        n = int(re.match(r"(\d+)\.", f.name).group(1))
        cp(f, ch / f"podcasts/microcast_{n:02d}.transcript.json", log)

    total = sum(1 for p in out.rglob("*") if p.is_file())
    print(f"Wrote {total} files to {out}")
    for line in log:
        print(line)


if __name__ == "__main__":
    main()
