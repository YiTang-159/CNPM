# Áp dụng bản vá bảo mật Dubchef (giữ nguyên dữ liệu Docker)

**Đọc `docs/BAO_MAT_VA_CHIA_SE.md` trước khi khởi động sau khi vá.**

1. **Backup dữ liệu trước.** Nếu SQL Server đang chạy, dùng `node scripts/backup-dubchef.mjs backup` và giữ backup ở máy cá nhân (không đưa vào Git/ZIP).
2. Với bản vá: giải nén và chép các file vào đúng gốc `CNPM`, giữ nguyên `.env` hiện tại. Với bản mã nguồn đầy đủ: giải nén vào thư mục riêng, chép `.env` cũ vào thư mục mới ở **máy cá nhân** nếu cần, giữ các Docker volume cũ, không chép bản backup vào ZIP.
3. Nếu `DB_PASSWORD` cũ là mật khẩu mặc định/mật khẩu đã công khai, phải **đổi trong SQL Server bằng SSMS trước**, sau đó thay `DB_PASSWORD` trong `.env`. Chỉ sửa `.env` mà không đổi mật khẩu SA trong SQL Server sẽ gây lỗi kết nối.
4. Chạy `npm run setup:local` để tự sinh các biến còn thiếu, **không ghi đè mật khẩu cũ**. Sau đó kiểm tra `TOKEN_SECRET` >=32 ký tự, `CORS_ORIGIN` là danh sách origin, và `DB_PASSWORD` không phải mật khẩu mẫu.
5. Khởi động: `docker compose up -d --build`; kiểm tra `docker compose ps`, `docker compose logs --tail=60 api`, `http://localhost:3000/api/health`.
6. Kiểm tra đăng nhập Admin/khách, tra cứu và liên kết đơn hàng cũ, quyền sử dụng gói, danh sách video/SSMS. Không chạy `docker compose down -v`.
7. Mặc định cổng 3000 và 1433 chỉ truy cập được ngay trên máy Docker. Nếu cần dùng điện thoại, làm theo mục C trong tài liệu bảo mật để bật cổng API trong LAN có kiểm soát.
8. Nếu repository Git cũ đã theo dõi `mobile/android/app/debug.keystore` hoặc `.env`, phải gỡ theo dõi và đổi khóa bị lộ. Có thể dùng `git rm --cached -- mobile/android/app/debug.keystore` và `git rm --cached -- .env` (nếu được Git theo dõi), sau đó xóa debug key cũ cục bộ; Gradle sẽ dùng khóa debug riêng của máy. Không xóa khóa release thật nếu chưa sao lưu ở kho bí mật riêng.
9. Chỉ chia sẻ ZIP tạo bởi `python scripts/package-share.py`. Không gửi cả thư mục dự án (vì có thể còn `.env`, backup hoặc lịch sử Git cũ).

Bản vá này **không thay đổi** bảng dữ liệu SQL hoặc migration 13 của chức năng liên kết đơn hàng cũ; không tự ghi đè cấu hình mật khẩu của cài đặt đang hoạt động.
