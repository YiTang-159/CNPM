# DUBCHEF — QA và nghiệm thu tạm thời, 15/11/2026

**Trạng thái: BẢN SỬA MỘT PHẦN — CHƯA ĐẠT NGHIỆM THU 10/10.**

Báo cáo này chỉ phản ánh việc thay đổi mã nguồn ZIP và chạy các lệnh trong môi trường làm việc hiện tại. **Không có quyền truy cập SQL Server/WSL/Docker Windows, GitHub remote, payOS, tài khoản hosting hoặc thiết bị điện thoại thật của người dùng.** Không được xem các kết quả tĩnh/unit tests là chứng nhận sản phẩm chạy được thương mại. Không tác động Docker volume, mật khẩu SQL hay `.env` đang dùng trên máy người dùng.

## Nhóm 1 — chặn demo / bảo mật

| Phát hiện | Xử lý trong source | Bằng chứng / còn thiếu |
|---|---|---|
| CSDL trắng thiếu Admin nhưng API vẫn start | `server/src/adminBootstrap.js`, `server/src/index.js` ngăn khởi động nếu không có Admin và thiếu mật khẩu hợp lệ; nếu đã tồn tại Admin trong SQL, **giữ nguyên** mật khẩu cũ. `scripts/setup-local.mjs` sinh mật khẩu Admin ≥12 ký tự, chỉ in một lần khi chạy terminal tương tác, không in trong log CI | `server/test/admin-bootstrap.test.mjs` unit 4 PASS. Chưa test SQL trắng thực |
| `.env`, dữ liệu, keystore, `.git`, backup bị mang vào ZIP | `scripts/package-share.py` loại dữ liệu riêng, quét secret; Git hook/CI từ bản trước; không chứa `.git`/tệp `.env` trong ZIP đầu ra | `docs/evidence/qa-2026-11-15/package-check.txt` PASS. **Chưa tẩy lịch sử GitHub hoặc xoay vòng secret**; cần chủ repo theo `docs/SECURITY.md` |
| URL localhost sai khi dùng điện thoại | `web/.env.example` dùng `/backend`, Docker Nginx reverse proxy; `VITE_PUBLIC_BASE_URL` chỉ nhận URL HTTPS khi có host public, QR không hiện nếu chưa cấu hình | Source và lint; chưa có domain public, test quét QR thực |

## Nhóm 2 — giá SQL và Admin sửa giá

- `db/migrations/014_pricing.sql`, `db/seed/001_pricing_defaults.sql`: thêm `SchemaMigrations`, `BangGia`, `LichSuBangGia`, `GoiDichVu`, snapshot giá lên `DonHang`, seed chỉ chạy nếu chưa có giá. **Chưa chạy migration trên SQL thật.** Phải sao lưu trước khi áp dụng; test ở DB trắng/thử nghiệm trước. Hệ thống hiện còn các SQL script legacy không versioned.
- `server/src/pricingRepo.js`, `pricingPolicy.js`, `db.js`, `app.js`: API giá công khai, API chỉnh giá Admin, audit actor/lý do, kiểm version tránh hai Admin ghi đè, máy chủ tính tiền và lưu snapshot trong giao dịch SQL; không tin giá client. `server/test/pricing-policy.test.mjs`, `pricing-api.test.mjs` PASS unit/mock (không phải E2E SQL).
- `web/src/pages/AdminPricing.jsx`: nhập đơn giá, giới hạn, % giảm năm; có Lưu/Hủy, xác nhận, lịch sử, thông báo lỗi. Giữ draft người đang sửa khi polling mỗi 10 giây. **Bảng gói chỉ đọc, chưa thêm/sửa/ẩn được gói.**
- `web/src/pages/Pricing.jsx`, `Checkout.jsx`, `hooks/usePricingPolicy.js`, `mobile/src/screens/PricingScreen.js`: giá/giới hạn hiển thị từ API, polling 10 giây/focus, yêu cầu xác nhận giá mới khi đổi; mobile có nút Thử lại lúc lỗi mạng. `docs/ADMIN_CONFIG_AUDIT.md` ghi rõ các nguồn chưa đồng nhất.
- **Chưa đạt yêu cầu hết hard-code:** `shared/pricing.js`, hai bản copy web/mobile và legacy dev fallback còn các hằng 20000/10000/500/3; các trang khác và luồng tiêu lượt video cần kiểm chứng thêm. Chưa có test PayOS webhook/giá snapshot trên SQL thật, e2e hai trình duyệt chưa chạy.

## Nhóm 3 — UI/links/test crawler

- Từ bản QA trước: bỏ banner Admin trùng (`Layout.jsx`), dùng một nút về quản trị trong `Header.jsx`; email `.example` được tránh ở các điểm đã rà; QR không có URL HTTPS thì không xuất; form Liên hệ có loading. CSS focus, heading balance, footer, 27 route kiểm kê tại `docs/UI_INVENTORY.md`.
- Bổ sung `tests/e2e/mobile-layout.spec.mjs`, `tests/e2e/pricing-live.spec.mjs` và crawler `tests/e2e/ui-crawler.spec.mjs`. **Các Playwright spec chỉ được phân tích cú pháp, CHƯA chạy browser và không chứng minh “mọi nút” hoạt động.**
- Chưa thực hiện Lighthouse, axe, cuộn thật ở 360/768/1280, xác minh UI Admin mọi tab, toàn bộ validation/form/404 ở 3 vai trò.

## Nhóm 4 — SQL Server

- `db/migrations/014_pricing.sql`, `db/seed/001_pricing_defaults.sql`, `db/tests/014_pricing_smoke.sql`, `db/queries/00_suspicious_records.sql` bổ sung tách cấu hình và kiểm tra dữ liệu, không đụng đến volume người dùng.
- `docs/DATABASE.md`, `docs/ERD.md` mô tả một phần schema, kết nối SSMS `127.0.0.1,1433` không lộ mật khẩu.
- **Chưa** dọn sạch toàn bộ SQL trùng, không sửa `Supabase`/localStorage dev mode, không kiểm định mọi constraint/FK/index, migration hai lượt, DB trắng hoặc dữ liệu thật. Chưa chạy SQL test integration vì không có DB trong container hiện tại.

## Nhóm 5 — bằng chứng kiểm thử

| Lệnh đã chạy ở thư mục `CNPM/` | Kết quả thực | Log |
|---|---|---|
| `npm run test:shared` | **24 PASS, 0 FAIL, 0 SKIP** | `docs/evidence/qa-2026-11-15/shared.txt` |
| `npm run test:server` | **68 PASS, 3 FAIL, 0 SKIP** (71 bài; lỗi SQL thật và eSpeak) | `docs/evidence/qa-2026-11-15/backend.txt` |
| `(cd web && node node_modules/eslint/bin/eslint.js .)` | **PASS, exit 0** | `docs/evidence/qa-2026-11-15/web-eslint.txt` |
| `(cd web && node node_modules/vitest/vitest.mjs run)` | **FAIL** do thiếu module Rollup Linux ở bộ node_modules dùng để kiểm tra | `docs/evidence/qa-2026-11-15/web-vitest.txt` |
| `python scripts/package-share.py --check` | **PASS**, số tệp cập nhật theo lần đóng gói cuối | `docs/evidence/qa-2026-11-15/package-check.txt` |
| `node --check tests/e2e/mobile-layout.spec.mjs` và `pricing-live.spec.mjs` | **Parse PASS**, **không phải E2E PASS** | `docs/evidence/qa-2026-11-15/e2e-parse.txt` |
| Docker smoke, SQL thật, payOS checkout, Playwright browsers, iPhone/Android, Lighthouse, axe | **CHƯA THỰC HIỆN** | Chưa có bằng chứng, không đánh dấu PASS |

Không bỏ qua bất kỳ test thất bại nào; 3 bài FAIL cần CI có SQL Server và eSpeak/FFmpeg thật. Không lưu log mô phỏng. Chưa có test giao dịch tiền thật/sandbox; không sử dụng tiền thật khi chưa được chủ tài khoản cấp quyền.

## Nhóm 6 — chất lượng thương mại / tài liệu

- Giọng đọc đang dùng eSpeak NG cho luồng MP3/MP4, speechSynthesis cho demo video mẫu; **chưa có Piper/Coqui tự nhiên và chưa kiểm chứng** các tuyên bố về giọng/định lượng/đơn vị nấu ăn.
- Whisper chưa được chứng minh chạy ổn trên điện thoại tầm trung. Chưa có số liệu hiệu năng/queue job/giới hạn đồng thời, chưa dọn toàn bộ tài liệu legacy nhằm tránh mất nội dung học thuật.

## Nhóm 7 — điện thoại

- `scripts/lan.mjs`, `scripts/lan-firewall.ps1`, `scripts/lan-qr.py`: mở **chỉ web** `0.0.0.0:5173` trên LAN Private; API/SQL giữ loopback, Nginx proxy `/backend`. Cần chạy trên Windows thật để chứng minh firewall/IP mạng.
- Web PWA: `web/index.html`, `web/public/manifest.webmanifest`, icons, `web/public/sw.js`, `web/src/main.jsx`; service worker chỉ cache static, **không cache dữ liệu cá nhân, giá, thanh toán, API**. CSS mobile safe-area/touch targets, tab dưới 4 mục, nút đổi ngôn ngữ; chưa chạy Safari/iPhone/Android.
- Expo `mobile/app.json`: loại owner/projectId của người khác, thêm icon/build metadata; cần `eas init` với chủ dự án và build preview. App không có đầy đủ Admin như web, chưa chạy CI APK.
- `docs/MOBILE.md` ghi hướng dẫn chi tiết và ma trận thiết bị **CHƯA XÁC MINH**.

## Nhóm 8 — chấm demo điện thoại

- `web/public/demo/recipe-demo.mp4`, `web/src/pages/Demo.jsx`: video đồ họa gốc với ba bản phụ đề **soạn sẵn, có ghi nhãn mẫu**; không yêu cầu Whisper/Ollama/lượt trả tiền; giọng nói mẫu từ thiết bị nếu hỗ trợ.
- `docs/DEPLOYMENT.md` phân tích SQL Server + Ollama, lựa chọn laptop Docker cho demo nội bộ; **CHƯA TRIỂN KHAI HTTPS STAGING, CHƯA CÓ URL công khai**, chưa có uptime, chưa quay video iPhone/Android, chưa nghiệm thu mở site từ xa.
- Dữ liệu thật SQL chưa được kiểm kê/dọn; script `db/queries/00_suspicious_records.sql` chỉ đọc; **không xóa bản ghi trước khi xác định chắc chắn là dữ liệu thử**.

## Rủi ro P0 / thao tác tiếp trên môi trường có quyền

1. **Sao lưu DB** và chạy migration `014_pricing.sql` + seed trong DB **thử riêng**, kiểm idempotence, kiểm giá/đơn cũ/quyền gói và giao dịch thực; không chạy `docker compose down -v`.
2. Thực hiện `npm ci`, lint, test, build web/mobile trên môi trường Linux sạch; chạy SQL/eSpeak media integration thật, Playwright 2 trình duyệt, Lighthouse/axe.
3. Với chủ repo: tẩy `.git` history bằng `git filter-repo`, force push có phối hợp và rotate mọi secret; không tự làm trên GitHub người dùng.
4. Hoàn thiện chỉnh sửa danh sách gói từ Admin, các giá trị config khác, xóa mọi fallback giá cứng và thêm test snapshot/webhook/giới hạn job.
5. Muốn giảng viên ở xa mở điện thoại cần **HTTPS tunnel/hosting thực** do chủ dự án cấu hình; không có URL nếu chưa triển khai.

**Không chấm 10/10 hoặc tuyên bố production-ready khi bất kỳ mục bắt buộc nào bên trên chưa có kết quả xác minh.**
