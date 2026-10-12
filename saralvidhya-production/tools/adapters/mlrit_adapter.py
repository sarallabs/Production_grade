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

SUBJECT = {"id": "dbms", "name": "Database Management Systems", "code": "DBMS", "order": 1, "parentNodeId": "sem_3"}
CHAPTER = {
    "number": 1,
    "title": "Database System Concepts, ER Model & Relational Design",
    "topics": [
        {"id": "topic_1", "label": "Database Fundamentals & Engine Architecture", "order": 1, "topicNum": 1},
        {"id": "topic_2", "label": "Conceptual Database Design & ER Modeling", "order": 2, "topicNum": 2},
        {"id": "topic_3", "label": "Advanced ER & Extended ER (EER) Mechanisms", "order": 3, "topicNum": 3},
        {"id": "topic_4", "label": "Relational Model Foundations & Integrity Constraints", "order": 4, "topicNum": 4},
        {"id": "topic_5", "label": "Logical Database Design (ER-to-Relational Translation)", "order": 5, "topicNum": 5},
        {"id": "topic_6", "label": "Relational Querying, Views & Schema Evolution", "order": 6, "topicNum": 6},
    ],
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

    # tenant + subject + chapter metadata
    out.mkdir(parents=True)
    shutil.copy2(TOOLS / "samples" / "mlrit" / "tenant.json", out / "tenant.json")
    (out / "dbms").mkdir(parents=True, exist_ok=True)
    (out / "dbms" / "subject.json").write_text(json.dumps(SUBJECT, indent=2), encoding="utf-8")
    ch.mkdir(parents=True, exist_ok=True)
    (ch / "chapter.json").write_text(json.dumps(CHAPTER, indent=2), encoding="utf-8")

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
