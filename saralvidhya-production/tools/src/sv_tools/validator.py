import os
import json
import re
import hashlib
from pathlib import Path
from typing import Dict, List, Any, Tuple, Optional, Set
import jsonschema

from sv_tools.contract import (
    load_schema,
    classify,
    is_chapter_support_file,
    is_subject_support_file,
    is_tenant_support_file,
    tool_registry,
)


def _is_external_url(ref: str) -> bool:
    return ref.startswith(("http://", "https://", "data:"))


def _sha256_file(path: Path) -> str:
    h = hashlib.sha256()
    with open(path, "rb") as f:
        for chunk in iter(lambda: f.read(65536), b""):
            h.update(chunk)
    return h.hexdigest()


def _check_asset_ref(
    ref: Optional[str],
    context_label: str,
    candidate_prefixes: List[str],
    all_paths: Set[str],
    errors: List[str],
) -> None:
    if not ref or not isinstance(ref, str) or _is_external_url(ref):
        return
    clean_ref = ref.lstrip("/")
    for prefix in candidate_prefixes:
        candidate = f"{prefix.rstrip('/')}/{clean_ref}" if prefix else clean_ref
        if candidate in all_paths:
            return
    expected = (
        f"{candidate_prefixes[0].rstrip('/')}/{clean_ref}"
        if candidate_prefixes and candidate_prefixes[0]
        else clean_ref
    )
    errors.append(f"{context_label}: referenced asset '{ref}' not found (expected '{expected}')")


def validate_canonical_folder(
    folder_path: str, scope: str = "full"
) -> Tuple[bool, List[str], List[Dict[str, Any]]]:
    """
    Validates a canonical tenant directory structure using contract JSON schemas
    and tools.json rules, including all referenced visual/media assets.
    Returns: (is_valid, errors, valid_files)
    """
    errors: List[str] = []
    valid_files: List[Dict[str, Any]] = []
    base = Path(folder_path).resolve()

    if not base.exists() or not base.is_dir():
        return False, [f"Directory not found: {folder_path}"], []

    # 1. Validate tenant.json with schema
    tenant_json_path = base / "tenant.json"
    tenant_schema = load_schema("tenant")
    if not tenant_json_path.exists():
        errors.append("Missing required tenant.json at root")
        tenant_data: Dict[str, Any] = {}
    else:
        try:
            with open(tenant_json_path, "r", encoding="utf-8") as f:
                tenant_data = json.load(f)

            validator = jsonschema.Draft7Validator(tenant_schema)
            for err in validator.iter_errors(tenant_data):
                loc = " -> ".join([str(p) for p in err.path]) if err.path else "root"
                errors.append(f"tenant.json validation error at {loc}: {err.message}")
        except Exception as e:
            errors.append(f"Invalid JSON in tenant.json: {e}")
            tenant_data = {}

    # Check hierarchy vs nodes if nodes are specified
    nodes = tenant_data.get("nodes", [])
    hierarchy = tenant_data.get("hierarchy", [])
    valid_node_types = set(hierarchy[:-1]) if len(hierarchy) > 1 else set()
    node_ids = set()
    for node in nodes:
        node_id = node.get("id")
        node_ids.add(node_id)
        if node.get("type") not in valid_node_types:
            errors.append(
                f"Node '{node_id}' has type '{node.get('type')}', but hierarchy specifies levels: {valid_node_types}"
            )

    # 2. Walk directories and collect all files
    for root, _, files in os.walk(base):
        for file in files:
            full_path = Path(root) / file
            rel_path = full_path.relative_to(base).as_posix()

            if file.startswith(".") or file == "Thumbs.db":
                continue

            stat = full_path.stat()
            file_info = {
                "path": rel_path,
                "localPath": str(full_path),
                "size": stat.st_size,
                "sha256": _sha256_file(full_path),
            }

            if file.endswith(".json"):
                try:
                    with open(full_path, "r", encoding="utf-8") as jf:
                        json.load(jf)
                except Exception as je:
                    errors.append(f"Syntax error in JSON file {rel_path}: {je}")
                    continue

            valid_files.append(file_info)

    # 3. Validate tenant-level asset references
    paths = {f["path"] for f in valid_files}
    branding = tenant_data.get("branding") or {}
    t_assets = tenant_data.get("assets") or {}
    for field_name, ref in [
        ("branding.logoBlob", branding.get("logoBlob")),
        ("branding.faviconBlob", branding.get("faviconBlob")),
        ("branding.loginBannerBlob", branding.get("loginBannerBlob")),
        ("assets.logo", t_assets.get("logo")),
        ("assets.favicon", t_assets.get("favicon")),
        ("assets.loginBanner", t_assets.get("loginBanner")),
    ]:
        _check_asset_ref(ref, f"tenant.json ({field_name})", ["", "assets"], paths, errors)

    # 4. Validate subjects and chapters against schemas & tools
    subject_schema = load_schema("subject")
    chapter_schema = load_schema("chapter")
    video_item_schema = (
        chapter_schema.get("properties", {}).get("videos", {}).get("items", {"type": "object"})
    )

    subjects = sorted(
        {
            p.split("/")[0]
            for p in paths
            if "/" in p and p.split("/")[0] not in ("assets", "media")
        }
    )
    if not subjects:
        errors.append(
            "No subject folders found. Expected <subjectId>/subject.json and <subjectId>/chapter_NN/..."
        )

    for sid in subjects:
        if not re.fullmatch(r"[a-z0-9_-]+", sid):
            errors.append(f"Subject folder '{sid}' must match ^[a-z0-9_-]+$")

        sj = f"{sid}/subject.json"
        if sj not in paths:
            errors.append(f"Missing {sj}")
        else:
            try:
                with open(base / sj, "r", encoding="utf-8") as jf:
                    sdata = json.load(jf)
                v = jsonschema.Draft7Validator(subject_schema)
                for err in v.iter_errors(sdata):
                    loc = " -> ".join([str(p) for p in err.path]) if err.path else "root"
                    errors.append(f"{sj} validation error at {loc}: {err.message}")

                # Validate parentNodeId if nodes exist
                p_node = sdata.get("parentNodeId")
                if p_node and nodes and p_node not in node_ids:
                    errors.append(
                        f"{sj}: parentNodeId '{p_node}' does not exist in tenant.json nodes"
                    )

                # Validate subject-level asset references
                s_assets = sdata.get("assets") or {}
                s_faculty = sdata.get("faculty") or {}
                for field_name, ref in [
                    ("iconBlob", sdata.get("iconBlob")),
                    ("faculty.avatarBlob", s_faculty.get("avatarBlob")),
                    ("assets.icon", s_assets.get("icon")),
                    ("assets.banner", s_assets.get("banner")),
                    ("assets.thumbnail", s_assets.get("thumbnail")),
                ]:
                    _check_asset_ref(
                        ref, f"{sj} ({field_name})", [sid, f"{sid}/assets", ""], paths, errors
                    )
            except Exception as e:
                errors.append(f"Failed to read {sj}: {e}")

        # Verify any 2-segment files under <sid>/ are valid subject support files
        for p in paths:
            parts = p.split("/")
            if parts[0] == sid and len(parts) == 2 and not is_subject_support_file(parts[1]):
                errors.append(f"Unrecognized subject-level file: {p}")

        # Check chapters
        chapter_dirs = sorted(
            {
                p.split("/")[1]
                for p in paths
                if p.startswith(sid + "/")
                and len(p.split("/")) >= 3
                and p.split("/")[1] != "assets"
            }
        )
        if not chapter_dirs:
            errors.append(f"Subject '{sid}' has no chapter folders (chapter_01, chapter_02, ...)")

        for cid in chapter_dirs:
            if not re.fullmatch(r"chapter_\d{2,}", cid):
                errors.append(
                    f"Chapter folder '{sid}/{cid}' must be named chapter_NN (e.g. chapter_01)"
                )
                continue

            cj = f"{sid}/{cid}/chapter.json"
            if cj not in paths:
                errors.append(f"Missing {cj}")
                continue

            ch_prefix = f"{sid}/{cid}"
            try:
                with open(base / cj, "r", encoding="utf-8") as jf:
                    cdata = json.load(jf)
                v = jsonschema.Draft7Validator(chapter_schema)
                for err in v.iter_errors(cdata):
                    loc = " -> ".join([str(p) for p in err.path]) if err.path else "root"
                    errors.append(f"{cj} validation error at {loc}: {err.message}")

                # Validate chapter-level asset references
                c_assets = cdata.get("assets") or {}
                for field_name, ref in [
                    ("heroImageBlob", cdata.get("heroImageBlob")),
                    ("assets.heroImage", c_assets.get("heroImage")),
                    ("assets.thumbnail", c_assets.get("thumbnail")),
                    ("assets.mindmapImage", c_assets.get("mindmapImage")),
                ]:
                    _check_asset_ref(
                        ref,
                        f"{cj} ({field_name})",
                        [ch_prefix, f"{ch_prefix}/media", ""],
                        paths,
                        errors,
                    )

                # Validate video asset references inside chapter.json
                for idx, vid in enumerate(cdata.get("videos") or []):
                    if isinstance(vid, dict):
                        _check_asset_ref(
                            vid.get("thumbnail"),
                            f"{cj} (videos[{idx}].thumbnail)",
                            [ch_prefix, f"{ch_prefix}/media", ""],
                            paths,
                            errors,
                        )
                        _check_asset_ref(
                            vid.get("gcsPath"),
                            f"{cj} (videos[{idx}].gcsPath)",
                            [ch_prefix, f"{ch_prefix}/media", ""],
                            paths,
                            errors,
                        )
            except Exception as e:
                errors.append(f"Failed to read {cj}: {e}")

            # Verify files in this chapter map to known tools or support prefixes
            prefix = f"{sid}/{cid}/"
            chapter_files = [p[len(prefix) :] for p in paths if p.startswith(prefix)]
            detected_tools = set()

            for cf in chapter_files:
                tool_id = classify(cf)
                if tool_id:
                    detected_tools.add(tool_id)
                elif not is_chapter_support_file(cf):
                    errors.append(
                        f"Unrecognized artifact in {prefix}{cf}. Does not match any pattern in tools.json"
                    )

                # If learn/videos.json is present, validate its video items & asset refs
                if cf == "learn/videos.json":
                    vj_path = base / prefix / cf
                    try:
                        with open(vj_path, "r", encoding="utf-8") as vjf:
                            vdata = json.load(vjf)
                        vlist = vdata.get("videos", []) if isinstance(vdata, dict) else vdata
                        if not isinstance(vlist, list):
                            errors.append(f"{prefix}{cf}: expected a list of videos or {{'videos': [...]}}")
                        else:
                            vv = jsonschema.Draft7Validator(video_item_schema)
                            for idx, item in enumerate(vlist):
                                for err in vv.iter_errors(item):
                                    errors.append(
                                        f"{prefix}{cf} videos[{idx}] error: {err.message}"
                                    )
                                if isinstance(item, dict):
                                    _check_asset_ref(
                                        item.get("thumbnail"),
                                        f"{prefix}{cf} (videos[{idx}].thumbnail)",
                                        [ch_prefix, f"{ch_prefix}/media", ""],
                                        paths,
                                        errors,
                                    )
                                    _check_asset_ref(
                                        item.get("gcsPath"),
                                        f"{prefix}{cf} (videos[{idx}].gcsPath)",
                                        [ch_prefix, f"{ch_prefix}/media", ""],
                                        paths,
                                        errors,
                                    )
                    except Exception as e:
                        errors.append(f"Failed to validate {prefix}{cf}: {e}")

                # If practice/flashcards/*.json is present, validate any relative image references
                if cf.startswith("practice/flashcards/") and cf.endswith(".json"):
                    fc_path = base / prefix / cf
                    try:
                        with open(fc_path, "r", encoding="utf-8") as fcjf:
                            fc_data = json.load(fcjf)
                        cards = (
                            fc_data.get("cards") or fc_data.get("flashcards") or []
                            if isinstance(fc_data, dict)
                            else fc_data
                            if isinstance(fc_data, list)
                            else []
                        )
                        for idx, card in enumerate(cards):
                            if not isinstance(card, dict):
                                continue
                            img_ref = card.get("image") or card.get("imageUrl")
                            if (
                                img_ref
                                and isinstance(img_ref, str)
                                and not _is_external_url(img_ref)
                                and not img_ref.startswith("/generated_resources/")
                            ):
                                _check_asset_ref(
                                    img_ref,
                                    f"{prefix}{cf} (card[{idx}].image)",
                                    [
                                        ch_prefix,
                                        f"{ch_prefix}/practice/flashcards",
                                        f"{ch_prefix}/media",
                                    ],
                                    paths,
                                    errors,
                                )
                    except Exception as e:
                        errors.append(f"Failed to validate {prefix}{cf}: {e}")

    # 5. Apply scope filter to returned valid_files if scope != "full"
    if scope and scope != "full":
        norm_scope = scope.strip("/")
        scope_parts = norm_scope.split("/")
        subj_scope = scope_parts[0]
        filtered = [
            f
            for f in valid_files
            if is_tenant_support_file(f["path"])
            or f["path"] == f"{subj_scope}/subject.json"
            or f["path"].startswith(f"{subj_scope}/assets/")
            or f["path"] == norm_scope
            or f["path"].startswith(f"{norm_scope}/")
        ]
        if not any(f["path"].startswith(f"{norm_scope}/") or f["path"] == norm_scope for f in filtered):
            errors.append(f"Scope '{scope}' matched no files in {folder_path}")
        valid_files = filtered

    is_valid = len(errors) == 0
    return is_valid, errors, valid_files

