import json
from pathlib import Path
import pytest

from sv_tools.validator import validate_canonical_folder


SAMPLES_DIR = Path(__file__).resolve().parent.parent / "samples"


def _write_json(path: Path, data: dict | list) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(data, indent=2), encoding="utf-8")


def _write_bytes(path: Path, content: bytes = b"fake-binary-asset") -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_bytes(content)


def _create_cloud_native_bundle(root: Path) -> None:
    _write_json(
        root / "tenant.json",
        {
            "id": "angrau",
            "name": "Acharya N.G. Ranga Agricultural University",
            "shortName": "ANGRAU",
            "academicTerm": "Sem I · 2026",
            "branding": {
                "appName": "Saral Vidhya",
                "primaryColor": "#059669",
                "logoBlob": "assets/logo.webp",
                "programLabel": "B.Sc. (Hons.) Agriculture",
            },
            "assets": {
                "logo": "assets/logo.webp",
                "favicon": "assets/favicon.png",
            },
            "hierarchy": ["program", "subject"],
            "nodes": [
                {
                    "id": "bsc_agri",
                    "type": "program",
                    "name": "B.Sc. (Hons.) Agriculture",
                    "order": 1,
                }
            ],
        },
    )
    _write_bytes(root / "assets" / "logo.webp")
    _write_bytes(root / "assets" / "favicon.png")

    subj = root / "entomology"
    _write_json(
        subj / "subject.json",
        {
            "id": "entomology",
            "name": "Entomology",
            "code": "ENTO 131",
            "subtitle": "B.Sc Agriculture",
            "programLabel": "B.Sc. (Hons.) Agriculture",
            "description": "Fundamentals of insect morphology, physiology, and systematics.",
            "credits": 3,
            "parentNodeId": "bsc_agri",
            "order": 1,
            "status": "active",
            "iconBlob": "assets/icon.webp",
            "assets": {
                "icon": "assets/icon.webp",
            },
            "cardStyle": {
                "accentColor": "#059669",
                "badgeText": "Core Course",
            },
        },
    )
    _write_bytes(subj / "assets" / "icon.webp")

    ch1 = subj / "chapter_01"
    _write_json(
        ch1 / "chapter.json",
        {
            "number": 1,
            "title": "Insect Morphology and Digestive System",
            "shortTitle": "Digestive System",
            "description": "Structure and physiology of the insect alimentary canal.",
            "estimatedMinutes": 45,
            "heroImageBlob": "media/hero.webp",
            "assets": {
                "heroImage": "media/hero.webp",
                "mindmapImage": "media/mindmap.png",
            },
            "topics": [
                {
                    "id": "topic_1",
                    "label": "Foregut, Midgut & Hindgut",
                    "order": 1,
                    "topicNum": 1,
                    "estimatedMinutes": 20,
                    "subtopics": ["Stomodaeum", "Mesenteron", "Proctodaeum"],
                }
            ],
            "videos": [
                {
                    "id": "vid_01",
                    "title": "Alimentary Canal Structure & Function",
                    "provider": "youtube",
                    "videoId": "Ioa25iYy53g",
                    "thumbnail": "media/vid_01_thumb.webp",
                    "duration": "14:20",
                    "durationSeconds": 860,
                    "topics": ["Foregut", "Midgut", "Filter Chamber"],
                    "order": 1,
                }
            ],
        },
    )
    _write_bytes(ch1 / "media" / "hero.webp")
    _write_bytes(ch1 / "media" / "mindmap.png")
    _write_bytes(ch1 / "media" / "vid_01_thumb.webp")
    (ch1 / "read" / "quick").mkdir(parents=True, exist_ok=True)
    (ch1 / "read" / "quick" / "beginner.md").write_text("# Quick Study\n", encoding="utf-8")

    # Flashcards with local image asset
    _write_json(
        ch1 / "practice" / "flashcards" / "beginner.json",
        {
            "cards": [
                {
                    "id": "fc_1",
                    "front": "What is the foregut also called?",
                    "back": "Stomodaeum",
                    "image": "images/card_easy_1.webp",
                }
            ]
        },
    )
    _write_bytes(ch1 / "practice" / "flashcards" / "images" / "card_easy_1.webp")


def test_existing_apex_tech_sample_validates():
    apex_dir = SAMPLES_DIR / "apex_tech"
    is_valid, errors, valid_files = validate_canonical_folder(str(apex_dir))
    assert is_valid, f"Expected apex_tech sample to be valid, got errors: {errors}"
    assert len(valid_files) >= 5
    assert all("sha256" in f and len(f["sha256"]) == 64 for f in valid_files)


def test_cloud_native_bundle_validates_all_assets(tmp_path: Path):
    _create_cloud_native_bundle(tmp_path)
    is_valid, errors, valid_files = validate_canonical_folder(str(tmp_path))
    assert is_valid, f"Expected valid cloud-native bundle, got: {errors}"
    paths = {f["path"] for f in valid_files}
    assert "assets/logo.webp" in paths
    assert "entomology/assets/icon.webp" in paths
    assert "entomology/chapter_01/media/hero.webp" in paths
    assert "entomology/chapter_01/media/vid_01_thumb.webp" in paths
    assert "entomology/chapter_01/practice/flashcards/images/card_easy_1.webp" in paths


def test_missing_subject_icon_fails_validation(tmp_path: Path):
    _create_cloud_native_bundle(tmp_path)
    (tmp_path / "entomology" / "assets" / "icon.webp").unlink()
    is_valid, errors, _ = validate_canonical_folder(str(tmp_path))
    assert not is_valid
    assert any("icon.webp" in e for e in errors)


def test_missing_chapter_hero_or_video_thumb_fails_validation(tmp_path: Path):
    _create_cloud_native_bundle(tmp_path)
    (tmp_path / "entomology" / "chapter_01" / "media" / "hero.webp").unlink()
    (tmp_path / "entomology" / "chapter_01" / "media" / "vid_01_thumb.webp").unlink()
    is_valid, errors, _ = validate_canonical_folder(str(tmp_path))
    assert not is_valid
    assert any("hero.webp" in e for e in errors)
    assert any("vid_01_thumb.webp" in e for e in errors)


def test_missing_flashcard_image_fails_validation(tmp_path: Path):
    _create_cloud_native_bundle(tmp_path)
    (
        tmp_path
        / "entomology"
        / "chapter_01"
        / "practice"
        / "flashcards"
        / "images"
        / "card_easy_1.webp"
    ).unlink()
    is_valid, errors, _ = validate_canonical_folder(str(tmp_path))
    assert not is_valid
    assert any("card_easy_1.webp" in e for e in errors)


def test_scope_filtering_returns_scoped_files_plus_metadata(tmp_path: Path):
    _create_cloud_native_bundle(tmp_path)
    # Add a second chapter
    ch2 = tmp_path / "entomology" / "chapter_02"
    _write_json(ch2 / "chapter.json", {"number": 2, "title": "Metamorphosis"})
    (ch2 / "read" / "quick").mkdir(parents=True, exist_ok=True)
    (ch2 / "read" / "quick" / "beginner.md").write_text("# Ch2\n", encoding="utf-8")

    is_valid, errors, scoped_files = validate_canonical_folder(
        str(tmp_path), scope="entomology/chapter_01"
    )
    assert is_valid, f"Unexpected errors: {errors}"
    scoped_paths = {f["path"] for f in scoped_files}
    assert "tenant.json" in scoped_paths
    assert "entomology/subject.json" in scoped_paths
    assert "entomology/assets/icon.webp" in scoped_paths
    assert "entomology/chapter_01/chapter.json" in scoped_paths
    assert "entomology/chapter_02/chapter.json" not in scoped_paths
