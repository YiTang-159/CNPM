#!/usr/bin/env bash
# Local Docker smoke tests. Exits nonzero on every failure; never invents evidence.
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"
if ! command -v docker >/dev/null; then echo 'FAIL: docker not installed' >&2; exit 2; fi
if ! command -v curl >/dev/null; then echo 'FAIL: curl not installed' >&2; exit 2; fi
printf '[1/6] API and real SQL health\n'
curl --fail --silent --show-error --max-time 10 http://127.0.0.1:3000/api/health | grep -q '"db":true'
printf '[2/6] Model downloaded and actual VI/EN/ZH translation\n'
docker compose exec -T api node scripts/test-ollama.mjs
printf '[3/6] REAL MP3/MP4 media integration; no skips\n'
docker compose exec -T -e MEDIA_INTEGRATION=true api node --test test/media.integration.test.mjs
printf '[4/6] SQL isolated payments, credits, admin, ownership and restart test\n'
docker compose exec -T -e DB_INTEGRATION=true api node --test test/sql.integration.test.mjs
printf '[5/6] Assert demo configuration\n'
# Real payment deployment intentionally fails this demo assertion.
curl --fail --silent --show-error --max-time 10 http://127.0.0.1:3000/api/payments/config | grep -q '"mode":"demo"'
printf '[6/6] Web response\n'
curl --fail --silent --show-error --max-time 10 http://127.0.0.1:5173/ | grep -qi 'html'
printf 'PASS: local Docker smoke tests (not a production payment or uptime proof)\n'
