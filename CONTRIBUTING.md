# Contributing

## What belongs in git

| ✅ Commit | ❌ Never commit | Where it goes instead |
|---|---|---|
| Source code, config, small icons/images (< 5 MB) | `*.apk`, `*.aab`, `*.ipa` | GitHub Releases (via `mobile-release.yml`) / EAS |
| `eas.json`, `app.json`, lockfiles | Keystores, `*.jks`, `*.p12`, service-account JSON | EAS credentials / GitHub encrypted secrets |
| Small fixtures | Generated content, audio/video, large JSON/MD | Google Cloud Storage (`GCS_API_BASE`) |

**Why:** GitHub rejects any file over 100 MB, and every committed binary stays in
history forever, so every clone downloads it. A 118 MB APK once blocked all pushes.

## Guardrails (automatic)

1. **Pre-commit hook** (`.githooks/pre-commit`): secret scan, then blocks build artifacts and files > 5 MB.
   It's enabled automatically by `npm install` in `saralvidhya-mobile`. To enable it manually:
   ```sh
   git config core.hooksPath .githooks
   ```
2. **CI** (`.github/workflows/repo-hygiene.yml`): the same check runs on every push and PR. `--no-verify` won't get you past it.
3. **Exceptions:** add a reviewed glob to `.large-files-allowlist`. Build artifacts can never be allowlisted.

If you're blocked:
```sh
git rm --cached path/to/file.apk   # keeps the file on disk
git commit --amend --no-edit       # only if the commit is NOT pushed yet
```

## Releasing the Android app

```sh
git tag android-v1.2.0
git push origin android-v1.2.0
```
CI type-checks, builds with EAS (`preview` profile → arm64 APK), enforces a size budget,
and attaches the build to a GitHub Release. Testers download it from **Releases**.

Manual runs: **Actions → Mobile Release (Android) → Run workflow**, then pick a profile:

| Profile | Output | ABIs | Use |
|---|---|---|---|
| `preview` | APK | arm64-v8a | Testers / sideload (≈45 MB) |
| `preview-universal` | APK | armeabi-v7a, arm64-v8a | Older 32-bit phones |
| `production` | AAB | armeabi-v7a, arm64-v8a | Play Store (per-device splits) |

> `x86` / `x86_64` are emulator-only and are excluded from release builds.
> `/android` is generated (CNG) and git-ignored, so set ABI targeting in `eas.json`, **not** `gradle.properties`.

One-time setup: `npx eas-cli init` in `saralvidhya-mobile`, set `android.package` in `app.json`,
and add the `EXPO_TOKEN` repo secret.
