#!/usr/bin/env bash
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
DEST="$ROOT/mobile/android/app/debug.keystore"
if [ -e "$DEST" ]; then
  echo 'Debug keystore exists. Move the old key outside this repo before rotating; refusing overwrite.' >&2
  exit 1
fi
command -v keytool >/dev/null || { echo 'JDK keytool is required.' >&2; exit 1; }
umask 077
keytool -genkeypair -v -storetype JKS -keystore "$DEST" \
  -alias androiddebugkey -keyalg RSA -keysize 2048 -validity 10000 \
  -storepass android -keypass android -dname 'CN=Android Debug,O=Android,C=US'
echo 'Created a LOCAL debug keystore excluded by .gitignore. NEVER commit it.'
