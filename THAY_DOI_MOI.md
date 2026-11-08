# Các thay đổi lần này

**Backend**
- Xóa mã cũ không còn dùng: `server/src/serviceRoutes.js`, `serviceRepo.js`, `db/06-service.sql`, `db/07-service-queries.sql` (thuộc thiết kế cũ, không khớp schema `04-workflows.sql`; không có trang nào đang gọi).
- `auth.js`: nhận băm SHA-256 cũ (`sha256$salt$hash`, mật khẩu UTF-16LE); chuỗi băm hỏng bị từ chối thay vì ném lỗi.
- `app.js`: đăng nhập bằng băm cũ tự nâng lên scrypt; chặn đăng nhập sai quá 60 lần/15 phút/IP (HTTP 429); JSON hỏng trả 400 `invalid_json`, thân quá lớn trả 413 `too_large`.
- `workflows.js`: thêm `updatePasswordHash`.
- `index.js`, `docker-compose.yml`: bỏ mật khẩu admin mặc định `admin12345`. Admin chỉ được tạo khi `ADMIN_PASSWORD` >= 12 ký tự (chạy `npm run setup:local`). Admin đã có trong DB không bị ảnh hưởng.
- Test mới: `server/test/security.test.mjs` (thay `service.test.mjs` cũ).

**Web**
- Xóa mã cũ không được route nào dùng: `AdminNarrations`, `AdminSubtitles`, `AdminServiceTools`, `services.js`, `projectApi.js` và test của chúng. Giữ lại test xuất SRT.

**Mobile**
- `api/client.js`: thêm API có token (`videos`, `orders`, `feedback`, `sendFeedback`).
- `AccountScreen.js`: hiện video, đơn hàng, phản hồi và form gửi phản hồi.
- `shared/i18n.js`: thêm chuỗi `acc_*` (3 ngôn ngữ), đã chạy `npm run sync`.

**Chưa làm / cần bạn kiểm tra**
- Chưa chạy được test web, mobile, server (cần `npm install`): chỉ kiểm cú pháp, test `shared/` và các hàm `auth.js`.
- Chưa có test UI cho màn Tài khoản mobile.
- Chưa có thuyết minh dạng file âm thanh (vẫn dùng TTS của trình duyệt).
- `db/supabase-accounts.sql` vẫn seed admin với mật khẩu `admin12345` (đường Supabase tùy chọn): hãy đổi nếu dùng.
- Mobile chưa có upload video lên Backend.
