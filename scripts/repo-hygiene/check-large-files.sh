#!/usr/bin/env sh
# -----------------------------------------------------------------------------
# Repo hygiene gate: blocks build artifacts and oversized files from git.
#
# Shared by the local pre-commit hook (.githooks/pre-commit) and CI
# (.github/workflows/repo-hygiene.yml) so both enforce identical rules.
#
# Usage:
#   check-large-files.sh --staged          # files staged for commit
#   check-large-files.sh --range A..B      # files added/modified between commits
#
# Config (env):
#   MAX_FILE_KB   size limit per file in KB (default 5120 = 5 MB)
#
# Exceptions: add glob patterns to .large-files-allowlist (repo root).
# Background: a 118 MB APK exceeded GitHub's 100 MB hard limit and blocked
# pushes. Build outputs belong in GitHub Releases / EAS, not in git history.
# -----------------------------------------------------------------------------
set -eu

MAX_FILE_KB="${MAX_FILE_KB:-5120}"
MAX_BYTES=$((MAX_FILE_KB * 1024))
ROOT="$(git rev-parse --show-toplevel)"
ALLOWLIST="$ROOT/.large-files-allowlist"

MODE="${1:-}"
case "$MODE" in
  --staged)
    REV=""
    FILES="$(git diff --cached --name-only --diff-filter=AM)"
    ;;
  --range)
    RANGE="${2:?--range requires A..B}"
    REV="${RANGE##*..}"
    FILES="$(git diff --name-only --diff-filter=AM "$RANGE")"
    ;;
  *)
    echo "usage: $0 --staged | --range A..B" >&2
    exit 2
    ;;
esac

[ -z "$FILES" ] && exit 0

is_allowlisted() {
  [ -f "$ALLOWLIST" ] || return 1
  while IFS= read -r pattern || [ -n "$pattern" ]; do
    case "$pattern" in ''|'#'*) continue ;; esac
    # shellcheck disable=SC2254
    case "$1" in $pattern) return 0 ;; esac
  done < "$ALLOWLIST"
  return 1
}

violations=0
OLDIFS="$IFS"
IFS='
'
for f in $FILES; do
  # 1) Build artifacts / signing material are never allowed (no allowlist).
  case "$f" in
    *.apk|*.aab|*.ipa|*.apks|*.xapk|*.keystore|*.jks|*.p12|*.mobileprovision)
      echo "  BLOCKED  $f  (build artifact / signing material - publish via GitHub Releases or EAS)"
      violations=$((violations + 1))
      continue
      ;;
  esac

  # 2) Size limit, with explicit allowlist for legacy content.
  size="$(git cat-file -s "${REV}:$f" 2>/dev/null || echo 0)"
  if [ "$size" -gt "$MAX_BYTES" ]; then
    if is_allowlisted "$f"; then
      echo "  allowed  $f  ($((size / 1024)) KB, allowlisted)"
    else
      echo "  BLOCKED  $f  ($((size / 1024)) KB > ${MAX_FILE_KB} KB limit)"
      violations=$((violations + 1))
    fi
  fi
done
IFS="$OLDIFS"

if [ "$violations" -gt 0 ]; then
  cat >&2 <<EOF

Repo hygiene check failed: $violations file(s) blocked.
  - APK/AAB/IPA: run 'git rm --cached <file>' and publish via GitHub Releases / EAS.
  - Large assets: upload to GCS, or add a reviewed glob to .large-files-allowlist.
  - See CONTRIBUTING.md -> "What belongs in git".
EOF
  exit 1
fi
exit 0
