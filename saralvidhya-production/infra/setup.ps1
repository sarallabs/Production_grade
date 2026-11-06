<#
.SYNOPSIS
    Provisions GCP infrastructure for SaralVidhya Multi-Tenant Registry & Publishing Platform.

.DESCRIPTION
    Phase 0 setup script:
    1. Enables Firestore, Secret Manager, Cloud Resource Manager, and IAM APIs.
    2. Initializes Firestore Native Database in asia-south1.
    3. Creates Service Accounts (sv-api, sv-publisher, sv-deployer) with least-privilege IAM roles.
    4. Provisions Secret Manager secret (sv-session-secret) with a 256-bit cryptographically secure token.
    5. Applies CORS configuration and staging lifecycle rules to gs://saralvidhya-artifacts.
    6. (Optional) Sets up Workload Identity Federation (WIF) for GitHub Actions CI/CD.

.PARAMETER ProjectId
    GCP Project ID (default: 'saralvidhya-production')

.PARAMETER Region
    GCP region for Firestore and Cloud Run (default: 'asia-south1')

.PARAMETER BucketName
    GCS Bucket name for artifacts (default: 'saralvidhya-artifacts')

.PARAMETER GitHubRepo
    GitHub repository in 'owner/repo' format for WIF (default: 'sarallabs/Production_grade')

.PARAMETER SetupWIF
    Switch to configure Workload Identity Federation for keyless GitHub Actions deploys.
#>

[CmdletBinding()]
param(
    [string]$ProjectId = "saralvidhya-production",
    [string]$Region = "asia-south1",
    [string]$BucketName = "saralvidhya-artifacts",
    [string]$GitHubRepo = "sarallabs/Production_grade",
    [switch]$SetupWIF,
    [switch]$DryRun
)

$ErrorActionPreference = "Stop"

Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host " SaralVidhya GCP Phase 0 Infrastructure Setup" -ForegroundColor Cyan
Write-Host " Project: $ProjectId | Region: $Region" -ForegroundColor Cyan
Write-Host "==========================================================" -ForegroundColor Cyan

# ── 1. Context & Authentication Verification ────────────────────────
Write-Host "`n[1/7] Verifying gcloud authentication & project..." -ForegroundColor Yellow
$currentAccount = gcloud config get-value account 2>$null
if (-not $currentAccount) {
    throw "No active gcloud account found. Run 'gcloud auth login' first."
}
Write-Host "  Active Account : $currentAccount" -ForegroundColor Green

gcloud config set project $ProjectId --quiet 2>&1 | Out-Null
$activeProject = gcloud config get-value project 2>$null
if ($activeProject -ne $ProjectId) {
    throw "Active project mismatch: Expected $ProjectId, got $activeProject"
}
Write-Host "  Active Project : $activeProject" -ForegroundColor Green

$projectNumber = gcloud projects describe $ProjectId --format="value(projectNumber)" 2>$null
if (-not $projectNumber) {
    throw "Could not retrieve project number for $ProjectId."
}
Write-Host "  Project Number : $projectNumber" -ForegroundColor Green

if ($DryRun) {
    Write-Host "`n[DRY RUN] Skipping mutating actions." -ForegroundColor Magenta
    return
}

# ── 2. Enable Required APIs ──────────────────────────────────────────
Write-Host "`n[2/7] Enabling Required GCP APIs..." -ForegroundColor Yellow
$apis = @(
    "firestore.googleapis.com",
    "secretmanager.googleapis.com",
    "cloudresourcemanager.googleapis.com",
    "iam.googleapis.com",
    "iamcredentials.googleapis.com",
    "run.googleapis.com",
    "artifactregistry.googleapis.com",
    "storage.googleapis.com"
)

foreach ($api in $apis) {
    Write-Host "  Enabling $api..." -NoNewline
    gcloud services enable $api --project=$ProjectId --quiet 2>&1 | Out-Null
    Write-Host " Done." -ForegroundColor Green
}

# ── 3. Initialize Firestore Native Mode ──────────────────────────────
Write-Host "`n[3/7] Configuring Firestore Native Mode..." -ForegroundColor Yellow
$dbList = gcloud firestore databases list --project=$ProjectId --format="value(name)" 2>$null
$defaultExists = $dbList -like "*(default)*"

if ($defaultExists) {
    Write-Host "  Firestore (default) database already exists." -ForegroundColor Green
} else {
    Write-Host "  Creating Firestore (default) database in $Region (Native mode)..." -NoNewline
    gcloud firestore databases create --project=$ProjectId --location=$Region --type=firestore-native --quiet 2>&1 | Out-Null
    Write-Host " Done." -ForegroundColor Green
}

# ── 4. Service Accounts & IAM Least-Privilege Roles ─────────────────
Write-Host "`n[4/7] Setting up Service Accounts and IAM Roles..." -ForegroundColor Yellow

$saConfigs = @(
    @{
        Id = "sv-api"
        DisplayName = "SaralVidhya API Runtime"
        Roles = @(
            "roles/datastore.user",
            "roles/secretmanager.secretAccessor"
        )
    },
    @{
        Id = "sv-publisher"
        DisplayName = "SaralVidhya Content Publisher"
        Roles = @()
    },
    @{
        Id = "sv-deployer"
        DisplayName = "SaralVidhya CI/CD Deployer"
        Roles = @(
            "roles/run.admin",
            "roles/artifactregistry.writer"
        )
    }
)

foreach ($sa in $saConfigs) {
    $saEmail = "$($sa.Id)@$ProjectId.iam.gserviceaccount.com"
    $exists = gcloud iam service-accounts list --project=$ProjectId --filter="email:$saEmail" --format="value(email)" 2>$null

    if (-not $exists) {
        Write-Host "  Creating Service Account: $($sa.Id)..." -NoNewline
        gcloud iam service-accounts create $sa.Id --project=$ProjectId --display-name="$($sa.DisplayName)" --quiet 2>&1 | Out-Null
        Write-Host " Created." -ForegroundColor Green
    } else {
        Write-Host "  Service Account $($sa.Id) already exists." -ForegroundColor Green
    }

    # Bind project-level roles
    foreach ($role in $sa.Roles) {
        Write-Host "    Binding $role to $($sa.Id)..." -NoNewline
        gcloud projects add-iam-policy-binding $ProjectId `
            --member="serviceAccount:$saEmail" `
            --role=$role `
            --condition=None `
            --quiet 2>&1 | Out-Null
        Write-Host " Done." -ForegroundColor Green
    }
}

# sv-api: Token Creator on itself (required for self-signed GCS URLs without service account keys)
$apiSaEmail = "sv-api@$ProjectId.iam.gserviceaccount.com"
Write-Host "    Binding roles/iam.serviceAccountTokenCreator to sv-api on itself..." -NoNewline
gcloud iam service-accounts add-iam-policy-binding $apiSaEmail `
    --member="serviceAccount:$apiSaEmail" `
    --role="roles/iam.serviceAccountTokenCreator" `
    --project=$ProjectId `
    --quiet 2>&1 | Out-Null
Write-Host " Done." -ForegroundColor Green

# sv-api: Object Admin on artifacts bucket
Write-Host "    Binding roles/storage.objectAdmin to sv-api on bucket gs://$BucketName..." -NoNewline
gcloud storage buckets add-iam-policy-binding "gs://$BucketName" `
    --member="serviceAccount:$apiSaEmail" `
    --role="roles/storage.objectAdmin" `
    --quiet 2>&1 | Out-Null
Write-Host " Done." -ForegroundColor Green

# sv-deployer: Service Account User on sv-api (so CI/CD can deploy Cloud Run with sv-api identity)
$deployerSaEmail = "sv-deployer@$ProjectId.iam.gserviceaccount.com"
Write-Host "    Binding roles/iam.serviceAccountUser to sv-deployer on sv-api..." -NoNewline
gcloud iam service-accounts add-iam-policy-binding $apiSaEmail `
    --member="serviceAccount:$deployerSaEmail" `
    --role="roles/iam.serviceAccountUser" `
    --project=$ProjectId `
    --quiet 2>&1 | Out-Null
Write-Host " Done." -ForegroundColor Green

# sv-publisher: Storage Object Creator on bucket (allows staging uploads)
$publisherSaEmail = "sv-publisher@$ProjectId.iam.gserviceaccount.com"
Write-Host "    Binding roles/storage.objectCreator to sv-publisher on gs://$BucketName..." -NoNewline
gcloud storage buckets add-iam-policy-binding "gs://$BucketName" `
    --member="serviceAccount:$publisherSaEmail" `
    --role="roles/storage.objectCreator" `
    --quiet 2>&1 | Out-Null
Write-Host " Done." -ForegroundColor Green

# ── 5. Secret Manager: Session Secret ────────────────────────────────
Write-Host "`n[5/7] Provisioning Secret Manager session secret..." -ForegroundColor Yellow
$secretName = "sv-session-secret"
$secretExists = gcloud secrets list --project=$ProjectId --filter="name:$secretName" --format="value(name)" --quiet 2>$null

if (-not $secretExists) {
    Write-Host "  Creating secret $secretName..." -NoNewline
    gcloud secrets create $secretName --project=$ProjectId --replication-policy="automatic" --quiet 2>&1 | Out-Null
    
    # Generate 32 bytes (256 bits) secure random hex string
    $rng = [System.Security.Cryptography.RandomNumberGenerator]::Create()
    $bytes = New-Object byte[] 32
    $rng.GetBytes($bytes)
    $secretValue = [BitConverter]::ToString($bytes).Replace("-", "").ToLower()
    
    # Write to a temporary file on D: then add version
    $tmpSecretFile = [System.IO.Path]::GetTempFileName()
    try {
        [System.IO.File]::WriteAllText($tmpSecretFile, $secretValue)
        gcloud secrets versions add $secretName --project=$ProjectId --data-file=$tmpSecretFile --quiet 2>&1 | Out-Null
    } finally {
        if (Test-Path $tmpSecretFile) { Remove-Item $tmpSecretFile -Force }
    }
    Write-Host " Created with 256-bit token." -ForegroundColor Green
} else {
    Write-Host "  Secret $secretName already exists." -ForegroundColor Green
}

# ── 6. GCS Bucket Policies: CORS & Lifecycle ─────────────────────────
Write-Host "`n[6/7] Applying GCS Bucket Policies to gs://$BucketName..." -ForegroundColor Yellow
$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path

$corsFile = Join-Path $scriptDir "cors.json"
if (Test-Path $corsFile) {
    Write-Host "  Setting CORS configuration..." -NoNewline
    gcloud storage buckets update "gs://$BucketName" --cors-file=$corsFile --quiet 2>&1 | Out-Null
    Write-Host " Done." -ForegroundColor Green
}

$lifecycleFile = Join-Path $scriptDir "lifecycle.json"
if (Test-Path $lifecycleFile) {
    Write-Host "  Setting staging lifecycle rule (14 days auto-delete)..." -NoNewline
    gcloud storage buckets update "gs://$BucketName" --lifecycle-file=$lifecycleFile --quiet 2>&1 | Out-Null
    Write-Host " Done." -ForegroundColor Green
}

# ── 7. Workload Identity Federation (Optional for GitHub Actions) ────
if ($SetupWIF) {
    Write-Host "`n[7/7] Configuring Workload Identity Federation for GitHub Actions ($GitHubRepo)..." -ForegroundColor Yellow
    $poolId = "github-actions-pool"
    $providerId = "github-actions-provider"

    # Pool
    $poolExists = gcloud iam workload-identity-pools describe $poolId --project=$ProjectId --location="global" --format="value(name)" --quiet 2>$null
    if (-not $poolExists) {
        Write-Host "  Creating Workload Identity Pool: $poolId..." -NoNewline
        gcloud iam workload-identity-pools create $poolId `
            --project=$ProjectId `
            --location="global" `
            --display-name="GitHub Actions Pool" `
            --quiet 2>&1 | Out-Null
        Write-Host " Created." -ForegroundColor Green
    } else {
        Write-Host "  Pool $poolId already exists." -ForegroundColor Green
    }

    # Provider
    $providerExists = gcloud iam workload-identity-pools providers describe $providerId `
        --project=$ProjectId `
        --location="global" `
        --workload-identity-pool=$poolId `
        --format="value(name)" `
        --quiet 2>$null

    if (-not $providerExists) {
        Write-Host "  Creating Provider $providerId..." -NoNewline
        gcloud iam workload-identity-pools providers create-oidc $providerId `
            --project=$ProjectId `
            --location="global" `
            --workload-identity-pool=$poolId `
            --display-name="GitHub OIDC Provider" `
            --issuer-uri="https://token.actions.githubusercontent.com" `
            --attribute-mapping="google.subject=assertion.sub,attribute.actor=assertion.actor,attribute.repository=assertion.repository" `
            --attribute-condition="assertion.repository == '$GitHubRepo'" `
            --quiet 2>&1 | Out-Null
        Write-Host " Created." -ForegroundColor Green
    } else {
        Write-Host "  Provider $providerId already exists." -ForegroundColor Green
    }

    # Bind deployer SA to GitHub repo subject
    Write-Host "  Binding sv-deployer to GitHub repo $GitHubRepo..." -NoNewline
    $principalSet = "principalSet://iam.googleapis.com/projects/$projectNumber/locations/global/workloadIdentityPools/$poolId/attribute.repository/$GitHubRepo"
    gcloud iam service-accounts add-iam-policy-binding $deployerSaEmail `
        --project=$ProjectId `
        --role="roles/iam.workloadIdentityUser" `
        --member="$principalSet" `
        --quiet 2>&1 | Out-Null
    Write-Host " Done." -ForegroundColor Green

    $wifProviderResource = "projects/$projectNumber/locations/global/workloadIdentityPools/$poolId/providers/$providerId"
    Write-Host "`n  >>> GitHub Secrets to set: <<<" -ForegroundColor Cyan
    Write-Host "  GCP_WIF_PROVIDER : $wifProviderResource" -ForegroundColor White
    Write-Host "  GCP_DEPLOYER_SA  : $deployerSaEmail" -ForegroundColor White
} else {
    Write-Host "`n[7/7] WIF setup skipped. Run with -SetupWIF flag when configuring CI/CD." -ForegroundColor Gray
}

Write-Host "`n==========================================================" -ForegroundColor Green
Write-Host " Phase 0 Setup Finished Successfully!" -ForegroundColor Green
Write-Host "==========================================================" -ForegroundColor Green
