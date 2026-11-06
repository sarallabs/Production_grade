import sys
import os
import json
import argparse
import secrets
import string
import requests

DEFAULT_API_URL = os.environ.get(
    "SV_API_URL", "https://saralvidhya-api-193782571555.asia-south1.run.app"
)

def get_headers(admin_key: str = None) -> dict:
    key = admin_key or os.environ.get("ADMIN_API_KEY", "")
    headers = {"Content-Type": "application/json"}
    if key:
        headers["X-Admin-Key"] = key
    return headers

def generate_passphrase() -> str:
    words = ["Delta", "Harbor", "Peak", "Summit", "Nexus", "Crest", "Solar", "Falcon", "River"]
    w = secrets.choice(words)
    num = secrets.randbelow(9000) + 1000
    return f"{w}-{num}"

def cmd_requests(args):
    api_url = args.api_url or DEFAULT_API_URL
    url = f"{api_url.rstrip('/')}/v2/publish/requests"
    headers = get_headers(args.admin_key)

    try:
        resp = requests.get(url, headers=headers, timeout=15)
        if resp.status_code == 200:
            data = resp.json()
            requests_list = data.get("requests", [])
            if not requests_list:
                print("No pending publish requests found.")
                return

            print(f"Found {len(requests_list)} pending publish request(s):\n")
            for r in requests_list:
                print(f"  ID        : {r.get('id')}")
                print(f"  Tenant    : {r.get('tenantId')}")
                print(f"  Scope     : {r.get('scope')}")
                print(f"  Files     : {len(r.get('files', []))}")
                print(f"  Submitted : {r.get('submittedAt')} by {r.get('submittedBy')}")
                print("-" * 50)
        else:
            print(f"[FAIL] Server returned {resp.status_code}: {resp.text}")
    except Exception as e:
        print(f"[ERROR] {e}")

def cmd_show(args):
    api_url = args.api_url or DEFAULT_API_URL
    url = f"{api_url.rstrip('/')}/v2/publish/requests/{args.request_id}"
    headers = get_headers(args.admin_key)

    try:
        resp = requests.get(url, headers=headers, timeout=15)
        if resp.status_code == 200:
            print(json.dumps(resp.json(), indent=2))
        else:
            print(f"[FAIL] Server returned {resp.status_code}: {resp.text}")
    except Exception as e:
        print(f"[ERROR] {e}")

def cmd_approve(args):
    api_url = args.api_url or DEFAULT_API_URL
    url = f"{api_url.rstrip('/')}/v2/publish/requests/{args.request_id}/approve"
    headers = get_headers(args.admin_key)

    try:
        resp = requests.post(url, headers=headers, json={"approvedBy": args.approver or "admin"}, timeout=60)
        if resp.status_code == 200:
            data = resp.json()
            print(f"[SUCCESS] {data.get('message')}")
            if data.get("generatedPassword"):
                print(f"\n[CREDENTIALS] Initial student access password generated:")
                print(f"  Password: {data.get('generatedPassword')}")
                print(f"  Note: Please record this password or share it with the institution.")
        else:
            print(f"[FAIL] Server returned {resp.status_code}: {resp.text}")
    except Exception as e:
        print(f"[ERROR] {e}")

def cmd_reject(args):
    api_url = args.api_url or DEFAULT_API_URL
    url = f"{api_url.rstrip('/')}/v2/publish/requests/{args.request_id}/reject"
    headers = get_headers(args.admin_key)

    try:
        resp = requests.post(
            url,
            headers=headers,
            json={"note": args.note or "", "decidedBy": args.approver or "admin"},
            timeout=30,
        )
        if resp.status_code == 200:
            print(f"[SUCCESS] {resp.json().get('message')}")
        else:
            print(f"[FAIL] Server returned {resp.status_code}: {resp.text}")
    except Exception as e:
        print(f"[ERROR] {e}")

def cmd_set_password(args):
    api_url = args.api_url or DEFAULT_API_URL
    url = f"{api_url.rstrip('/')}/v2/publish/set-password"
    headers = get_headers(args.admin_key)

    password = args.password
    if args.generate or not password:
        password = generate_passphrase()
        print(f"Generated passphrase: {password}")

    payload = {"tenantId": args.tenant, "password": password}

    try:
        resp = requests.post(url, headers=headers, json=payload, timeout=30)
        if resp.status_code == 200:
            print(f"[SUCCESS] Password updated for tenant '{args.tenant}'.")
            print(f"  Shared Password : {password}")
            print("  Make sure to share this passphrase securely with the institution.")
        else:
            print(f"[FAIL] Server returned {resp.status_code}: {resp.text}")
    except Exception as e:
        print(f"[ERROR] {e}")

def cmd_register_tenant(args):
    api_url = args.api_url or DEFAULT_API_URL
    url = f"{api_url.rstrip('/')}/v2/publish/register-tenant"
    headers = get_headers(args.admin_key)

    if args.config_file:
        with open(args.config_file, "r", encoding="utf-8") as f:
            payload = json.load(f)
    else:
        payload = {
            "id": args.tenant_id,
            "name": args.name,
            "shortName": args.short_name or args.name,
        }

    if args.password:
        payload["password"] = args.password

    try:
        resp = requests.post(url, headers=headers, json=payload, timeout=30)
        if resp.status_code == 200:
            print(f"[SUCCESS] {resp.json().get('message')}")
        else:
            print(f"[FAIL] Server returned {resp.status_code}: {resp.text}")
    except Exception as e:
        print(f"[ERROR] {e}")

def main():
    parser = argparse.ArgumentParser(description="SaralVidhya Platform Admin CLI")
    parser.add_argument("--api-url", default=DEFAULT_API_URL, help="Base API URL")
    parser.add_argument("--admin-key", help="Approver API key")
    subparsers = parser.add_subparsers(dest="command", required=True)

    # requests
    subparsers.add_parser("requests", help="List pending publish requests")

    # show
    p_show = subparsers.add_parser("show", help="Show publish request details")
    p_show.add_argument("request_id", help="Publish Request ID")

    # approve
    p_app = subparsers.add_parser("approve", help="Approve publish request")
    p_app.add_argument("request_id", help="Publish Request ID")
    p_app.add_argument("--approver", default="admin", help="Approver identity")

    # reject
    p_rej = subparsers.add_parser("reject", help="Reject publish request")
    p_rej.add_argument("request_id", help="Publish Request ID")
    p_rej.add_argument("--note", default="", help="Reason for rejection")
    p_rej.add_argument("--approver", default="admin", help="Approver identity")

    # set-password
    p_pwd = subparsers.add_parser("set-password", help="Set shared password for a tenant")
    p_pwd.add_argument("tenant", help="Tenant ID")
    p_pwd.add_argument("--password", help="Specific password to set")
    p_pwd.add_argument("--generate", action="store_true", help="Generate secure passphrase")

    # register-tenant
    p_reg = subparsers.add_parser("register-tenant", help="Register a tenant in Firestore")
    p_reg.add_argument("--config-file", help="Path to tenant.json config file")
    p_reg.add_argument("--tenant-id", help="Tenant ID")
    p_reg.add_argument("--name", help="Institution full name")
    p_reg.add_argument("--short-name", help="Institution short name")
    p_reg.add_argument("--password", help="Initial shared password")

    args = parser.parse_args()
    if args.command == "requests":
        cmd_requests(args)
    elif args.command == "show":
        cmd_show(args)
    elif args.command == "approve":
        cmd_approve(args)
    elif args.command == "reject":
        cmd_reject(args)
    elif args.command == "set-password":
        cmd_set_password(args)
    elif args.command == "register-tenant":
        cmd_register_tenant(args)

if __name__ == "__main__":
    main()
