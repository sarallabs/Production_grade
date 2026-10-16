# Enterprise Secrets Management & DevSecOps Architecture

> **Repository**: `sarallabs/Production_grade`  
> **Environment**: Google Cloud Platform (Cloud Run, GCS, Firestore), Cloudflare Pages, Firebase  
> **Standard**: Zero-Static-Keys, Workload Identity Federation (OIDC), GCP Secret Manager, Automated Pre-Deployment Verification

---

## 1. Secrets Management Principles

1. **Zero Static Credentials in CI/CD**:
   * Never store long-lived service account JSON keys (`GOOGLE_APPLICATION_CREDENTIALS`) in GitHub repository secrets.
   * Authentication to GCP is handled strictly via **Workload Identity Federation (WIF)** using short-lived OIDC tokens.
2. **Runtime Secret Injection**:
   * Production secrets (`SESSION_SECRET`, `GEMINI_API_KEY`) are stored in **GCP Secret Manager** and mounted as environment variables at Cloud Run runtime.
   * They never appear in Docker images, build logs, or git commits.
3. **Strict Separation of Public vs. Secret Variables**:
   * Any variable prefixed with `VITE_` is baked into frontend JavaScript bundles and is publicly readable by anyone opening browser developer tools.
   * Never prefix private API keys, service account tokens, or database credentials with `VITE_`.
4. **Automated Secret Scanning Gate**:
   * All pull requests and pushes to `main`, `master`, and active feature branches are scanned by **Gitleaks** and **TruffleHog OSS** in GitHub Actions.
   * Pull requests with leaked secrets are automatically blocked from merging.

---

## 2. GitHub Actions Secrets Matrix

Configure the following secrets under **Settings > Secrets and variables > Actions**:

| Secret Name | Scope | Description | Example / Format |
|---|---|---|---|
| `GCP_WIF_PROVIDER` | Repository / Environment | Full resource path of GCP Workload Identity Provider | `projects/193782571555/locations/global/workloadIdentityPools/github-actions-pool/providers/github-actions-provider` |
| `GCP_DEPLOYER_SA` | Repository / Environment | Service Account email with deployer permissions | `sv-deployer@saralvidhya-production.iam.gserviceaccount.com` |
| `CLOUDFLARE_API_TOKEN` | Repository / Environment | Cloudflare API token with Pages edit permissions | `v1.0-...` |
| `CLOUDFLARE_ACCOUNT_ID` | Repository / Environment | Cloudflare Account ID | `32-char hex string` |

---

## 3. Workload Identity Federation (WIF) Setup

Run these commands in Google Cloud Shell or PowerShell with `gcloud` authenticated as project owner:

```bash
PROJECT_ID="saralvidhya-production"
POOL_NAME="github-actions-pool"
PROVIDER_NAME="github-actions-provider"
REPO="sarallabs/Production_grade"

# 1. Create Workload Identity Pool
gcloud iam workload-identity-pools create "$POOL_NAME" \
  --project="$PROJECT_ID" \
  --location="global" \
  --display-name="GitHub Actions Pool"

# 2. Create OIDC Provider for GitHub Actions
gcloud iam workload-identity-pools providers create-oidc "$PROVIDER_NAME" \
  --project="$PROJECT_ID" \
  --location="global" \
  --workload-identity-pool="$POOL_NAME" \
  --display-name="GitHub Actions Provider" \
  --issuer-uri="https://token.actions.githubusercontent.com" \
  --attribute-mapping="google.subject=assertion.sub,attribute.actor=assertion.actor,attribute.repository=assertion.repository" \
  --attribute-condition="assertion.repository == '$REPO'"

# 3. Bind Deployer Service Account to the Workload Identity Pool
gcloud iam service-accounts add-iam-policy-binding "sv-deployer@$PROJECT_ID.iam.gserviceaccount.com" \
  --project="$PROJECT_ID" \
  --role="roles/iam.workloadIdentityUser" \
  --member="principalSet://iam.googleapis.com/projects/193782571555/locations/global/workloadIdentityPools/$POOL_NAME/attribute.repository/$REPO"
```

---

## 4. GCP Secret Manager Configuration

Store sensitive production secrets in Secret Manager:

```bash
# 1. Create session secret
echo -n "$(openssl rand -hex 32)" | gcloud secrets create sv-session-secret \
  --data-file=- \
  --project="saralvidhya-production"

# 2. Create Gemini API key secret
echo -n "YOUR_GEMINI_API_KEY" | gcloud secrets create gemini-api-key \
  --data-file=- \
  --project="saralvidhya-production"

# 3. Grant Secret Accessor role to the Cloud Run Runtime Service Account
gcloud secrets add-iam-policy-binding sv-session-secret \
  --member="serviceAccount:sv-api@saralvidhya-production.iam.gserviceaccount.com" \
  --role="roles/secretmanager.secretAccessor" \
  --project="saralvidhya-production"

gcloud secrets add-iam-policy-binding gemini-api-key \
  --member="serviceAccount:sv-api@saralvidhya-production.iam.gserviceaccount.com" \
  --role="roles/secretmanager.secretAccessor" \
  --project="saralvidhya-production"
```

---

## 5. Local Developer Workflow & Protection

1. **Copy templates**:
   * Backend: `cp saralvidhya-production/backend/.env.example saralvidhya-production/backend/.env`
   * Frontend: `cp saralvidhya-production/frontend/.env.example saralvidhya-production/frontend/.env.local`
   * MVP: `cp saralvidhya-mvp/.env.example saralvidhya-mvp/.env.local`
2. **Verification before commit**:
   * `.gitignore` automatically ignores `.env`, `.env.local`, `.key`, `.pem`, and service account JSONs.
   * Run local gitleaks scan before pushing:
     ```bash
     gitleaks detect --config .gitleaks.toml --verbose
     ```
