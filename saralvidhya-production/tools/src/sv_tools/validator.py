import os
import json
import re
from pathlib import Path
from typing import Dict, List, Any, Tuple
import jsonschema

from sv_tools.contract import load_schema, classify, is_chapter_support_file, tool_registry

def validate_canonical_folder(folder_path: str) -> Tuple[bool, List[str], List[Dict[str, Any]]]:
    """
    Validates a canonical tenant directory structure using contract JSON schemas
    and tools.json rules.
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
        tenant_data = {}
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
            errors.append(f"Node '{node_id}' has type '{node.get('type')}', but hierarchy specifies levels: {valid_node_types}")

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
            }

            if file.endswith(".json"):
                try:
                    with open(full_path, "r", encoding="utf-8") as jf:
                        json.load(jf)
                except Exception as je:
                    errors.append(f"Syntax error in JSON file {rel_path}: {je}")
                    continue

            valid_files.append(file_info)

    # 3. Validate subjects and chapters against schemas & tools
    paths = {f["path"] for f in valid_files}
    subject_schema = load_schema("subject")
    chapter_schema = load_schema("chapter")

    subjects = sorted({p.split("/")[0] for p in paths if "/" in p and p.split("/")[0] not in ("assets", "media")})
    if not subjects:
        errors.append("No subject folders found. Expected <subjectId>/subject.json and <subjectId>/chapter_NN/...")

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
                    errors.append(f"{sj}: parentNodeId '{p_node}' does not exist in tenant.json nodes")
            except Exception as e:
                errors.append(f"Failed to read {sj}: {e}")

        # Check chapters
        chapter_dirs = sorted({
            p.split("/")[1]
            for p in paths
            if p.startswith(sid + "/") and len(p.split("/")) >= 3 and p.split("/")[1] != "assets"
        })
        if not chapter_dirs:
            errors.append(f"Subject '{sid}' has no chapter folders (chapter_01, chapter_02, ...)")

        for cid in chapter_dirs:
            if not re.fullmatch(r"chapter_\d{2,}", cid):
                errors.append(f"Chapter folder '{sid}/{cid}' must be named chapter_NN (e.g. chapter_01)")
                continue

            cj = f"{sid}/{cid}/chapter.json"
            if cj not in paths:
                errors.append(f"Missing {cj}")
                continue

            try:
                with open(base / cj, "r", encoding="utf-8") as jf:
                    cdata = json.load(jf)
                v = jsonschema.Draft7Validator(chapter_schema)
                for err in v.iter_errors(cdata):
                    loc = " -> ".join([str(p) for p in err.path]) if err.path else "root"
                    errors.append(f"{cj} validation error at {loc}: {err.message}")
            except Exception as e:
                errors.append(f"Failed to read {cj}: {e}")

            # Verify files in this chapter map to known tools or media/chapter.json
            prefix = f"{sid}/{cid}/"
            chapter_files = [p[len(prefix):] for p in paths if p.startswith(prefix)]
            detected_tools = set()

            for cf in chapter_files:
                tool_id = classify(cf)
                if tool_id:
                    detected_tools.add(tool_id)
                elif not is_chapter_support_file(cf):
                    # Unrecognized chapter file
                    errors.append(f"Unrecognized artifact in {prefix}{cf}. Does not match any pattern in tools.json")

    is_valid = len(errors) == 0
    return is_valid, errors, valid_files
