# Auto-restore script for credentials and env files
$targetRoot = Split-Path -Parent $PSScriptRoot
if (-not (Test-Path "$targetRoot\saralvidhya-mvp")) {
    $targetRoot = $PSScriptRoot
}
Write-Host "Restoring environment credentials to: $targetRoot`n" -ForegroundColor Green

# 1. saralvidhya-mvp
if (Test-Path "$PSScriptRoot\saralvidhya-mvp") {
    $mvpTarget = "$targetRoot\saralvidhya-mvp"
    if (Test-Path $mvpTarget) {
        Get-ChildItem -Path "$PSScriptRoot\saralvidhya-mvp" -Force | ForEach-Object {
            Copy-Item $_.FullName -Destination $mvpTarget -Force
            Write-Host "  [+] Copied $($_.Name) -> saralvidhya-mvp\" -ForegroundColor Cyan
        }
    }
}

# 2. saralvidhya-medha
if (Test-Path "$PSScriptRoot\saralvidhya-medha") {
    $medhaTarget = "$targetRoot\saralvidhya-medha"
    if (Test-Path $medhaTarget) {
        Get-ChildItem -Path "$PSScriptRoot\saralvidhya-medha" -Force | ForEach-Object {
            Copy-Item $_.FullName -Destination $medhaTarget -Force
            Write-Host "  [+] Copied $($_.Name) -> saralvidhya-medha\" -ForegroundColor Cyan
        }
    }
}

Write-Host "`nAll credentials & .env files successfully restored!" -ForegroundColor Green
Write-Host "You can now run 'npm install' and 'npm run dev' inside saralvidhya-mvp." -ForegroundColor White
