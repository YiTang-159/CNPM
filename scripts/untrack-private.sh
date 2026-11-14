#!/usr/bin/env bash
# Run once in an existing Git clone; never deletes local secret files.
set -euo pipefail
cd "$(dirname "${BASH_SOURCE[0]}")/.."
git rev-parse --is-inside-work-tree >/dev/null
git rm --cached -r --ignore-unmatch -- \
  .env web/.env mobile/android/app/debug.keystore db/data backups \
  uploads server/uploads node_modules server/node_modules web/node_modules \
  mobile/node_modules test-errors.txt web/test-errors.txt
while IFS= read -r -d '' file; do
  case "$file" in
    *.log|*.bak|*.mdf|*.ldf|*.sqlite|*.sqlite3|*.db|*.keystore|*.mp3|*.mp4|*.wav|*/test-errors.txt)
      git rm --cached --ignore-unmatch -- "$file" ;;
  esac
done < <(git ls-files -z)
python3 scripts/package-share.py --check
