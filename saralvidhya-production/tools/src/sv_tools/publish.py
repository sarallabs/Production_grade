import sys
import os
import json
import argparse
import requests
import mimetypes
from pathlib import Path
from sv_tools.validator import validate_canonical_folder

mimetypes.add_type("image/webp", ".webp")
mimetypes.add_type("audio/mp4", ".m4a")

DEFAULT_API_URL = os.environ.get(
    "SV_API_URL", "https://saralvidhya-api-193782571555.asia-south1.run.app"
)
BUCKET_NAME = os.environ.get("GCS_BUCKET_NAME", "saralvidhya-artifacts")


def _publisher_headers(admin_key: str = ""):
    headers = {}
    pub_key = os.environ.get("SV_PUBLISH_KEY", "")
    adm_key = admin_key or os.environ.get("SV_ADMIN_KEY") or os.environ.get("ADMIN_API_KEY", "")
    if pub_key:
        headers["X-Publish-Key"] = pub_key
    if adm_key:
        headers["X-Admin-Key"] = adm_key
    return headers

def cmd_validate(args):
    folder = args.folder
    scope = getattr(args, "scope", "full") or "full"
    print(f"[sv-publish] Validating folder: {folder} (scope: {scope})")
    is_valid, errors, valid_files = validate_canonical_folder(folder, scope=scope)

    if errors:
        print(f"\n[FAIL] Found {len(errors)} validation error(s):")
        for err in errors:
            print(f"  - {err}")
        sys.exit(1)

    print(f"\n[SUCCESS] Folder structure is valid. Found {len(valid_files)} artifact(s).")


def cmd_submit(args):
    folder = args.folder
    scope = args.scope or "full"
    api_url = args.api_url or DEFAULT_API_URL
    is_valid, errors, valid_files = validate_canonical_folder(folder, scope=scope)

    if not is_valid:
        print(f"[FAIL] Cannot submit invalid folder. Run 'sv-publish validate' first.")
        for err in errors:
            print(f"  - {err}")
        sys.exit(1)

    base = Path(folder).resolve()
    tenant_json_path = base / "tenant.json"
    with open(tenant_json_path, "r", encoding="utf-8") as f:
        tenant_data = json.load(f)

    tenant_id = tenant_data.get("id", base.name)
    print(f"[sv-publish] Preparing publish request for tenant: {tenant_id} (scope: {scope})")

    # Prepare file manifest (server assigns the staging location)
    manifest_files = []
    for f in valid_files:
        manifest_files.append(
            {
                "path": f["path"],
                "size": f["size"],
                "sha256": f.get("sha256"),
                "contentType": mimetypes.guess_type(f["path"])[0] or "application/octet-stream",
            }
        )

    payload = {
        "tenantId": tenant_id,
        "tenantConfig": tenant_data,
        "scope": scope,
        "files": manifest_files,
        "submittedBy": args.submitted_by or os.environ.get("USER", "sv-publisher"),
    }

    if getattr(args, "dry_run", False):
        print(f"\n[DRY-RUN] Validation passed. Would submit {len(manifest_files)} file(s) for tenant '{tenant_id}':")
        for mf in manifest_files[:25]:
            print(f"  - {mf['path']} ({mf['size']} bytes, {mf['contentType']})")
        if len(manifest_files) > 25:
            print(f"  ... and {len(manifest_files) - 25} more file(s)")
        return
    headers = _publisher_headers(getattr(args, "admin_key", ""))
    base_url = api_url.rstrip("/")
    submit_url = f"{base_url}/v2/publish/submit"
    try:
        resp = requests.post(submit_url, json=payload, headers=headers, timeout=60)
    except Exception as e:
        print(f"\n[ERROR] Failed to reach API at {submit_url}: {e}")
        sys.exit(1)
    if resp.status_code not in [200, 201]:
        print(f"\n[FAIL] Server returned {resp.status_code}: {resp.text}")
        sys.exit(1)

    data = resp.json()
    request_id = data.get("requestId")
    uploads = {u["path"]: u for u in data.get("uploads", [])}
    local = {f["path"]: f["localPath"] for f in valid_files}
    print(f"  Request ID : {request_id}")
    print(f"  Uploading {len(uploads)} file(s) to staging...")

    failed = []
    for i, (path, up) in enumerate(uploads.items(), 1):
        try:
            with open(local[path], "rb") as fh:
                put = requests.put(
                    up["url"], data=fh, headers={"Content-Type": up["contentType"]}, timeout=600
                )
            if put.status_code not in (200, 201):
                failed.append((path, f"HTTP {put.status_code}: {put.text[:200]}"))
        except Exception as e:
            failed.append((path, str(e)))
        if i % 10 == 0 or i == len(uploads):
            print(f"    {i}/{len(uploads)}")

    if failed:
        print(f"\n[FAIL] {len(failed)} upload(s) failed:")
        for p, err in failed[:10]:
            print(f"  - {p}: {err}")
        print("Re-run 'sv-publish submit' to try again.")
        sys.exit(1)

    done = requests.post(
        f"{base_url}/v2/publish/requests/{request_id}/complete", headers=headers, timeout=120
    )
    if done.status_code != 200:
        print(f"\n[FAIL] Could not finalize request: {done.status_code} {done.text}")
        sys.exit(1)

    print(f"\n[SUCCESS] Publish request created and finalized in staging.")
    print(f"  Request ID : {request_id}")
    print(f"  Status     : {done.json().get('status')}")

    if getattr(args, "approve", False):
        adm_headers = _publisher_headers(getattr(args, "admin_key", ""))
        if "X-Admin-Key" not in adm_headers:
            print("\n[WARN] --approve specified, but SV_ADMIN_KEY / --admin-key is not set. Skipping auto-approval.")
            return
        print(f"  Auto-approving request {request_id} -> promoting to live GCS + Firestore registry...")
        app_resp = requests.post(
            f"{base_url}/v2/publish/requests/{request_id}/approve",
            headers=adm_headers,
            json={"approvedBy": args.submitted_by or "sv-publish-auto"},
            timeout=180,
        )
        if app_resp.status_code == 200:
            app_data = app_resp.json()
            print(f"[LIVE] {app_data.get('message')}")
            if app_data.get("generatedPassword"):
                print(f"  Generated Tenant Password: {app_data.get('generatedPassword')}")
        else:
            print(f"[FAIL] Auto-approval returned {app_resp.status_code}: {app_resp.text}")
            sys.exit(1)

def cmd_status(args):
    api_url = args.api_url or DEFAULT_API_URL
    request_id = args.request_id
    url = f"{api_url.rstrip('/')}/v2/publish/requests/{request_id}"

    headers = {}
    admin_key = os.environ.get("ADMIN_API_KEY", "")
    if admin_key:
        headers["X-Admin-Key"] = admin_key

    try:
        resp = requests.get(url, headers=headers, timeout=15)
        if resp.status_code == 200:
            data = resp.json()
            print(json.dumps(data, indent=2))
        else:
            print(f"[FAIL] Server returned {resp.status_code}: {resp.text}")
            sys.exit(1)
    except Exception as e:
        print(f"[ERROR] Failed to fetch status: {e}")
        sys.exit(1)


def main():
    parser = argparse.ArgumentParser(description="SaralVidhya Content Publisher CLI")
    subparsers = parser.add_subparsers(dest="command", required=True)

    # validate
    p_val = subparsers.add_parser("validate", help="Validate canonical folder structure")
    p_val.add_argument("folder", help="Path to local canonical directory")
    p_val.add_argument(
        "--scope", default="full", help="Optional scope filter (e.g. full, dbms, dbms/chapter_01)"
    )

    # submit
    p_sub = subparsers.add_parser("submit", help="Validate and submit publish request")
    p_sub.add_argument("folder", help="Path to local canonical directory")
    p_sub.add_argument("--api-url", default=DEFAULT_API_URL, help="Base API URL")
    p_sub.add_argument(
        "--scope", default="full", help="Scope of change (e.g. full, cs_201/chapter_03)"
    )
    p_sub.add_argument("--submitted-by", help="Name or email of publisher")
    p_sub.add_argument(
        "--dry-run",
        action="store_true",
        help="Validate and print manifest without uploading to GCS",
    )
    p_sub.add_argument(
        "--approve",
        action="store_true",
        help="Immediately approve and promote the bundle to live GCS + Firestore (requires SV_ADMIN_KEY or --admin-key)",
    )
    p_sub.add_argument("--admin-key", default="", help="Admin API key for auto-approval or auto-creating new tenants")
    # status
    p_stat = subparsers.add_parser("status", help="Check status of a publish request")
    p_stat.add_argument("request_id", help="Publish Request ID")
    p_stat.add_argument("--api-url", default=DEFAULT_API_URL, help="Base API URL")

    args = parser.parse_args()
    if args.command == "validate":
        cmd_validate(args)
    elif args.command == "submit":
        cmd_submit(args)
    elif args.command == "status":
        cmd_status(args)


if __name__ == "__main__":
    main()

