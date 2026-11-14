# DUBCHEF — QA REPORT (15/11/2026)

**Kết luận: HOÀN THÀNH MỘT PHẦN, CHƯA ĐẠT TIÊU CHUẨN NGHIỆM THU DOANH NGHIỆP.** Đã đối chiếu source trong `Dubchef_Enterprise_Hardening_2026-11-14.zip`. Đây là bản sửa trên bản sao, **không phải** thay đổi trực tiếp Docker/SQL Server hay GitHub của người dùng.

## Phần A — giao diện công khai

| Mã | Mức độ | Phát hiện / xử lý | File | Bằng chứng |
|---|---|---|---|---|
| A1 | Medium | Hai nút cùng dẫn về Admin; bỏ banner trùng, chỉ giữ nút trong header khi Admin xem trang công khai | `web/src/components/Layout.jsx`, `Header.jsx`, `styles.css` | `docs/evidence/qa/source-contracts.txt` (source contract PASS); **chưa chạy browser** |
| A2 | Medium | Header dùng sticky top=0; bổ sung CSS z-index, focus, heading balance/responsive. **Chưa xác nhận** khoảng trống 60px ở 360/768/1280, cần Playwright/browser thực | `web/src/styles.css` | `web-lint-direct.txt` PASS; không có screenshot viewport |
| A3 | High | Localhost QR không phù hợp điện thoại. Thêm `VITE_PUBLIC_BASE_URL` HTTPS; ẩn QR và vô hiệu Copy/Download khi chưa có URL công khai thay vì xuất QR sai; vẫn còn cần cấu hình host thật và quét điện thoại thực | `web/src/api/qr.js`, `Home.jsx`, `AdminQr.jsx`, `web/.env.example` | `source-contracts.txt` PASS; backend QR `/api/qr-scan` và bảng `LuotQuetQR` đã có trong bản gốc |
| A4 | Low | Footer/menu đã trỏ các route cụ thể; thay email giả `.example` bằng `VITE_CONTACT_EMAIL`, nếu chưa có email thì dẫn tới trang Liên hệ. Form Contact đã gọi SQL API, thêm chống double-submit và loading. **Chưa thử ghi SQL thật** | `Footer.jsx`, `Contact.jsx`, `shared/publicConfig.js` | `source-contracts.txt` PASS; xem `server/src/app.js` và `db/02-schema.sql` |
| A5 | High | Các lời quảng cáo về giọng tự nhiên, đơn vị và kỹ thuật nấu ăn **chưa có bài kiểm định ngôn ngữ/giọng TTS chuẩn**. Chưa điều chỉnh các phát biểu chưa xác minh, cần duyệt nội dung và kiểm chứng riêng | `shared/i18n.js`, `server/src/localTranslate.js`, `server/src/audioExport.js` | CHƯA XÁC MINH |
| A6 | Low | Thêm `text-wrap:balance`, `overflow-wrap` cho heading; chưa chụp cuộn thực | `web/src/styles.css` | Static source only |

## Phần B — kiểm kê & kiểm thử

- `docs/UI_INVENTORY.md` gồm 27 route tìm trong `web/src/App.jsx`, thống kê component và thẻ tương tác trực tiếp theo mã nguồn. Không coi static scan là kiểm kê tuyệt đối modal/child/conditional controls.
- `tests/e2e/ui-crawler.spec.mjs` thêm smoke crawler theo 3 vai trò. **CHƯA CHẠY** vì môi trường hiện không có Playwright browser và không có tài khoản test SQL. Bài kiểm tra đòi `DUBCHEF_E2E_BASE_URL`, `CUSTOMER_EMAIL/PASSWORD`, `ADMIN_EMAIL/PASSWORD` và môi trường test riêng; không skip khi thiếu cấu hình. Crawler hiện mới đi qua route, link/ảnh/h1/placeholder và phân quyền UI; **chưa click mọi nút, chưa kiểm request 4xx/5xx và chưa đo axe/Lighthouse**.
- Chưa xác minh đủ luồng quên mật khẩu/đổi mật khẩu, webhook, video, tất cả thao tác Admin hay lỗi console thực tế.

## Phần C — SQL Server

- Source: `server/src/db.js` tự chạy các script `db/*.sql` ở startup. `dbo.NguoiDung`, `dbo.DonHang`, `dbo.GiaoDich`, `dbo.LienHe`, `dbo.LuotQuetQR` và các bảng nghiệp vụ hiện hữu; repo dùng truy vấn tham số cho các đường tạo đơn/liên hệ/QR đã kiểm tra.
- Tạo `docs/DATABASE.md`, `docs/ERD.md` (ERD phần dữ liệu xác minh được). **CHƯA** chạy SQL Server, migration+seed từ DB trắng/idempotence thực, chuẩn hóa toàn bộ FK/INDEX, SchemaMigrations, tổ chức lại toàn bộ `db/` vì thay đổi schema mà không có SQL thử có nguy cơ làm hỏng DB đang chạy.

## Phần E — quản lý giá (yêu cầu CRITICAL, CHƯA HOÀN TẤT)

- Đã truy vết hằng `20000`, `10000`, `500`, `3` và `PRICES` trong `shared/`, bản copy `web/src/shared/`, `mobile/`.
- Trang `web/src/pages/AdminPricing.jsx` hiện **chỉ đọc**, không có API cập nhật SQL. `server/src/orders.js` tính tiền từ `shared/pricing.js` bằng hằng. **Chưa cho phép Admin sửa giá** nhằm tránh rủi ro lệch tiền và gian lận nửa chừng.
- Chưa có SQL snapshot giá theo đơn, phiên bản/RowVersion, lịch sử sửa giá, điều khiển đồng thời hai admin và update web realtime; xem `docs/ADMIN_CONFIG_AUDIT.md`. **Toàn bộ bài kiểm thử E6 chưa đạt/chưa chạy**.

## Kết quả chạy thực tế tại môi trường sửa mã

| Lệnh chính xác | Output / trạng thái | File log |
|---|---|---|
| `npm run test:shared` | **24 PASS, 0 FAIL, 0 SKIP** | `docs/evidence/qa/shared-tests.txt` |
| `node --test scripts/qa-source-contracts.test.mjs` | **4 PASS, 0 FAIL, 0 SKIP**; đây là kiểm tra cấu trúc source, không thay browser E2E | `docs/evidence/qa/source-contracts.txt` |
| `npm run test:server` (dùng `node_modules` từ ZIP gốc chỉ để thử, không đóng gói) | **57 PASS, 3 FAIL, 0 SKIP**; thiếu SQL và eSpeak thật | `docs/evidence/qa/backend-tests.txt` |
| `node node_modules/eslint/bin/eslint.js .` (cwd `web/`) | **PASS, exit 0** | `docs/evidence/qa/web-lint-direct.txt` |
| `node node_modules/vitest/vitest.mjs run` (cwd `web/`) | **FAIL** thiếu `@rollup/rollup-linux-x64-gnu` trong modules gốc Windows; `npm ci` thử nhưng không hoàn tất | `docs/evidence/qa/web-test-direct.txt` |
| `python scripts/package-share.py --check` | **PASS** | `docs/evidence/qa/package-check.txt` |
| Docker smoke, SQL integration, payOS, Playwright, Lighthouse, axe | **KHÔNG CHẠY** (không có các dịch vụ, browser/cấu hình xác thực trong môi trường hiện tại) | Không có output giả |

## Rủi ro tồn đọng, ưu tiên sửa tiếp

1. **P0:** Chuyển giá/gói/giới hạn sang SQL đồng bộ và giao dịch snapshot, concurrency, audit, backend enforcement, payOS matching; test từ SQL sạch mới được sửa UI Admin cho phép lưu.
2. **P0:** Kiểm thử dịch, video MP3/MP4, thanh toán, khóa người dùng, phân quyền Admin trên Docker SQL test riêng.
3. **P1:** Nâng crawler thành thật sự duyệt mọi điều khiển an toàn, contract validation, axe/Lighthouse theo 360/768/1280 và ảnh chụp; đã cập nhật các test có hợp đồng cũ về QR localhost/nhãn Admin để khẳng định quy tắc MỚI nghiêm ngặt hơn (QR địa chỉ riêng phải bị ẩn, hai nút trùng phải còn một); chưa chạy được Vitest trên Linux do thiếu Rollup native.
4. **P1:** Migration versioning, rollback, backup thử và chuẩn hóa SQL; không thao tác trực tiếp trên volume sản xuất.
5. **P1:** Cấu hình URL HTTPS công khai và email liên hệ chính thức trước khi public; đảm bảo QR đếm trong SQL qua API, không dùng localStorage ở bản thương mại.

## Hướng dẫn áp dụng an toàn

1. Sao lưu cả thư mục Git/`.env` riêng tư và **Docker SQL volume hiện tại** trước khi thay file; không chạy `docker compose down -v`.
2. Chỉ chép thay những file đã sửa sau khi review diff; không chép đè `.env`, không reset SQL.
3. Docker web image build lại để nhận giá trị `VITE_` (biến compile-time); khi chưa có HTTPS public, QR được ẩn theo thiết kế an toàn.
4. Chạy test với SQL riêng và browser trước khi coi là bản doanh nghiệp; chưa khẳng định 10/10.
