# DUBCHEF - BÁO CÁO NGHIỆM THU KỸ THUẬT (14/11/2026)

**Trạng thái tổng thể: CHƯA ĐẠT nghiệm thu 10/10.** Kết quả dưới đây thực hiện trên mã từ bản cung cấp `CNPM (5).zip` sau chỉnh sửa. Máy kiểm tra có Node.js v22, FFmpeg/FFprobe; **không có Docker, SQL Server hay eSpeak NG**, không có account payOS/VPS hoặc truy cập GitHub để force-push. Không giả lập bằng chứng. Tất cả lệnh và output có thể xem ở thư mục `docs/evidence/`.

## 1. Tự chấm sáu tiêu chí gốc (chỉ là ước lượng có điều kiện)

| Tiêu chí | Điểm tạm tính | Bằng chứng / giới hạn |
|---|---:|---|
| Chức năng dịch-video-thuyết minh-thanh toán-Admin | 2,2/2,5 | `server/src/app.js`, `server/src/localTranslate.js`, `server/src/audioExport.js`; chưa smoke Docker thật |
| CSDL, logic quyền sử dụng gói | 1,7/2,0 | `server/src/entitlements.js`, `server/test/sql.integration.test.mjs`; thiếu SQL thực tế ở môi trường kiểm tra |
| Bảo mật | 0,9/1,5 | `.gitignore`, `.githooks/pre-commit`, `docs/SECURITY.md`, `docs/evidence/security/package-share-check.txt`; chưa xoay vòng khóa/xóa lịch sử từ GitHub |
| Kiểm thử, chất lượng mã | 1,1/1,5 | `docs/evidence/tests/`; ba bài tích hợp thất bại vì thiếu công cụ/SQL (KHÔNG SKIP) và web test/build chưa chạy thành công |
| Triển khai, sao lưu, giám sát | 1,0/1,5 | `docker-compose.yml`, `web/Dockerfile`, `scripts/backup-dubchef.mjs`, `docs/RUNBOOK.md`; chưa xác minh Docker hay URL public |
| Trải nghiệm thương mại | 0,6/1,0 | Chưa nâng cấp TTS tự nhiên, Lighthouse/hiệu năng thực chưa đo |
| **Tổng tạm tính** | **7,5/10** | **Không đại diện chứng nhận doanh nghiệp hoặc 10/10** |

## 2. Báo cáo theo từng phần yêu cầu

### Phần 1 - Bảo mật dữ liệu: HOÀN THÀNH PHẦN MÃ NGUỒN, CHƯA HOÀN TẤT XỬ LÝ SỰ CỐ LỘ KHÓA

- Đã dùng `git rm --cached` để gỡ khỏi index `.env`, `web/.env`, `mobile/android/app/debug.keystore`, `db/data/*.json`, `test-errors.txt`, `web/test-errors.txt` (file vật lý và Docker SQL volume được giữ nguyên). Có script `scripts/untrack-private.ps1` và `scripts/untrack-private.sh` để áp dụng lên Git clone thật của chủ repo.
- `.gitignore`, `.dockerignore`, `web/.dockerignore` loại secret, DB, uploads, backup, video đầu ra và dependencies. `scripts/package-share.py` loại chúng khỏi ZIP kể cả `.git`.
- `.env.example`, `web/.env.example` chỉ có giá trị mẫu/biến public; `scripts/setup-local.mjs` tạo bí mật mới cho máy mới, giữ mật khẩu SQL cũ khi nâng cấp và di trú `PAYMENT_DEMO=true` thành `PAYMENT_MODE=demo`.
- `server/src/securityConfig.js` ngăn dùng placeholder Admin, DB/token yếu trong production ngoài local, hạn chế CORS, demo payment ngoài loopback. `server/src/app.js` bổ sung header bảo mật và giới hạn request login/register/translation/orders/checkout/demo-pay/webhook, thông báo lỗi không chứa stacktrace.
- `docs/SECURITY.md` liệt kê key cần rotate, quy trình `git filter-repo`, lực đẩy và yêu cầu clone lại. Keystore debug đã được sinh **tại môi trường kiểm tra**, bị loại khỏi ZIP; script `scripts/new-debug-keystore.sh` cho máy người dùng.
- `.github/workflows/ci.yml` thêm Gitleaks và npm audit; `.githooks/pre-commit` fail nếu thiếu Gitleaks hoặc có secret.
- **ĐÃ CHẠY:** `python scripts/package-share.py --check` -> PASS (xem log); `npm audit --offline --prefix server|web|mobile --audit-level=high` -> `found 0 vulnerabilities` trên dữ liệu audit offline đang có. Không thay thế online audit hoặc quét lịch sử.
- **CHƯA:** chưa thực thi Gitleaks CLI cục bộ (không có binary), chưa rewrite/force push lịch sử GitHub vì cần quyền/quy trình phối hợp, chưa thu hồi/rotate secret trong dịch vụ thật. Chưa thử tạo Admin trên DB mới vì không có SQL Server.

### Phần 2 - Thanh toán nhất quán: SỬA CODE, CHƯA XÁC MINH GIAO DỊCH THẬT

- Chỉ backend `PAYMENT_MODE=disabled|demo|payos`; gỡ `PAYMENT_DEMO` khỏi Docker/code và chuyển đổi cấu hình legacy qua `scripts/setup-local.mjs`. `server/src/app.js`/`server/src/securityConfig.js` fail khi chọn `payos` không có khóa hợp lệ. Giữ nguyên SQL password/volume.
- Các kiểm thử sẵn có trong `server/test/payos.test.mjs` kiểm tra chữ ký HMAC đúng/sai, sai số tiền/tiền tệ và webhook lặp. `server/test/config-security.test.mjs` có test startup config.
- **CHƯA:** Docker demo end-to-end thực tế, giao dịch payOS với tiền thật, callback HTTPS thực, xử lý đầy đủ đơn hết hạn và ảnh/log nhà cung cấp. `docs/evidence/payment/README.md` ghi rõ không có bằng chứng giả.

### Phần 3 - Không được skip test: ĐÃ BỎ GUARD SKIP, CI CHƯA XÁC MINH

- Đã bỏ 3 điều kiện skip khỏi `server/test/audioExport.test.mjs`, `server/test/media.integration.test.mjs` và `server/test/sql.integration.test.mjs`; không hạ assertion hoặc thay test để dễ qua.
- CI `server` được cấu hình SQL Server service thật + FFmpeg + eSpeak NG và sẽ báo FAIL nếu bài nào skip; CI coverage bắt buộc 80% dòng của `entitlements.js`, `orders.js`, `payos.js`. CI kiểm tra `npm ci`, lint/test/build web, Docker build, audit và Gitleaks.
- **ĐÃ CHẠY:** `node --test shared/*.test.mjs`: **24 pass, 0 fail, 0 skip**; `npm --prefix server test`: **60 tests, 57 pass, 3 fail, 0 skip**; `node --test scripts/backup-dubchef.test.mjs`: **5 pass**. File log có kết quả chính xác.
- Ba thất bại do không có eSpeak NG (2 media tests) và không có DB_PASSWORD/SQL Server (1 integration test). Đây là trạng thái FAIL THẬT, không che bằng skip. Chưa được phép tuyên bố 60/60 PASS.
- Web ESLint **đã chạy trực tiếp bằng Node và exit 0** với dependencies trích từ ZIP. `npm ci --offline` không thành công vì cache thiếu gói; Vitest/Vite build Linux chưa PASS vì Rollup native Linux không có trong thư viện đi kèm từ ZIP. Cần CI Linux sạch có npm registry để xác minh. Chưa có Playwright E2E và chưa đạt coverage 80% được xác nhận.

### Phần 4 - Docker thực tế: ĐÃ THÊM CẤU HÌNH, CHƯA CHẠY

- `docker-compose.yml`: SQL, API, Ollama, ollama-init, web Nginx; healthcheck DB TCP, API DB query, Ollama, web; port host bind loopback và giữ nguyên volume CSDL.
- `web/Dockerfile`, `web/nginx.conf` build web sạch và proxy `/backend` tới API trong Docker; tránh nhúng secret frontend.
- `scripts/smoke-test.sh`: kiểm tra health SQL, model + 6 chiều dịch Ollama, MP3/MP4 thật, quyền gói/thanh toán demo SQL riêng và web.
- **THỬ CHẠY:** `bash scripts/smoke-test.sh` -> exit 2 `FAIL: docker not installed`. Vì vậy chưa thể xác nhận `docker compose up --build` hay tải model thật. Whisper preload/progress chưa hoàn thành.

### Phần 5 - Triển khai/sao lưu/giám sát: MỘT PHẦN

- `scripts/backup-dubchef.mjs` mặc định tạo backup trong `../DubchefBackups` (ngoài repo), có restore test + checksum trước khi ghi verification. Vẫn đọc backup cũ theo đường dẫn được nhập. `docs/RUNBOOK.md` hướng dẫn lịch Task Scheduler, offsite NAS, restore, rollback, monitoring/alert và rotation.
- API có `/api/health`, `/api/health/translation`, `/api/metrics` bearer auth; `scripts/monitor-system.mjs` ghi log local.
- **CHƯA:** chưa chạy backup/restore SQL ở môi trường này, không có `verification.json` mới được kiểm chứng; chưa có backend HTTPS public, URL uptime, Prometheus dashboard hoặc cảnh báo thực đến người nhận.

### Phần 6 - Thương mại: CHƯA HOÀN TẤT

- Chưa tích hợp Piper/XTTS, mẫu giọng nói, hàng đợi xuất video, Lighthouse >=90, tải trước Whisper hoặc kiểm thử accessibility/multi-device bằng công cụ chuyên dụng. Không tuyên bố đã đạt yêu cầu thương mại.

### Phần 7 - Báo cáo nghiệm thu: ĐÃ TẠO

- Tài liệu này và output thật nằm ở `docs/evidence/`; thông tin nội bộ/secret/backup không được xuất bản.

## 3. Chỉ mục bằng chứng

| Lệnh / hạng mục | File thực tế | Kết quả |
|---|---|---|
| `node --test shared/*.test.mjs` | `docs/evidence/tests/shared-node-test.txt` | PASS 24/24 |
| `npm --prefix server test` | `docs/evidence/tests/backend-full-mandatory.txt` | FAIL 3, PASS 57, SKIP 0 |
| `node --test scripts/backup-dubchef.test.mjs` | `docs/evidence/tests/backup-unit-tests.txt` | PASS 5/5 |
| `python scripts/package-share.py --check` | `docs/evidence/security/package-share-check.txt` | PASS |
| `npm audit --offline --prefix server` | `docs/evidence/security/npm-audit-server.txt` | exit 0, found 0 (offline, có thể cũ) |
| `npm audit --offline --prefix web` | `docs/evidence/security/npm-audit-web.txt` | exit 0, found 0 (offline, có thể cũ) |
| `npm audit --offline --prefix mobile` | `docs/evidence/security/npm-audit-mobile.txt` | exit 0, found 0 (offline, có thể cũ) |
| `node node_modules/eslint/bin/eslint.js .` trong `web` | `docs/evidence/tests/web-eslint.txt` (rỗng, exit 0) | PASS cú pháp/lint trên gói trích ZIP |
| `npm ci --offline` trong `web` | `docs/evidence/tests/web-npm-ci-offline.txt` | FAIL thiếu cache |
| `node node_modules/vitest/vitest.mjs run` trong `web` | `docs/evidence/tests/web-vitest.txt` | FAIL Rollup native package |
| `node node_modules/vite/bin/vite.js build` trong `web` | `docs/evidence/tests/web-build.txt` | FAIL Rollup native package |
| `bash scripts/smoke-test.sh` | `docs/evidence/smoke/smoke-local-result.txt` | FAIL thiếu Docker |
| Gitleaks/pre-commit | `.github/workflows/ci.yml`, `.githooks/pre-commit` | đã cấu hình, chưa thực thi trong GitHub |
| webhook/giao dịch payOS thực tế | `docs/evidence/payment/README.md` | chưa có, không tạo mã đơn giả |
| khôi phục SQL + `verification.json` mới | `scripts/backup-dubchef.mjs` | chưa thực hiện được |
| URL backend HTTPS + uptime | `docs/RUNBOOK.md` | chưa có |

## 4. Rủi ro mở và điều kiện đạt nghiệm thu

1. Chủ repo cần xoay vòng secret đã lộ, filter lịch sử và push sau khi phối hợp thành viên; không chỉ tải ZIP mới rồi coi là đã xử lý lịch sử cũ.
2. Cài Docker Desktop, eSpeak NG, SQL Server trong container, chạy mọi test không skip; CI GitHub phải xanh **thực tế**, kể cả npm audit/Gitleaks và coverage >=80%.
3. Cần chạy smoke trên Docker, lưu log model/MP3/MP4 thật và giao dịch demo cấp-trừ lượt; kiểm tra trên SSMS, không giả SQL bằng mocks.
4. Chủ tài khoản payOS cần cung cấp khóa qua secret store và tự xác nhận giao dịch thật, webhook hợp lệ/đối soát/đơn hết hạn; không được commit chứng từ chứa PII.
5. Cần host công khai có HTTPS, uptime alert; test restore ngoài repo, kỳ hạn backup/giám sát.
6. Cần nâng cấp TTS, queue video, responsive/mobile, privacy/terms/accessibility và kiểm tra Lighthouse thực tế.

**Không đạt 10/10 ở thời điểm ký tài liệu**. Chỉ cập nhật điểm khi đã có bằng chứng cho các hạng mục mở.
