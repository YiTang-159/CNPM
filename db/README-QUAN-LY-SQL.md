# BỘ SQL DUBCHEF – SƠ ĐỒ VAI TRÒ

**Chọn `localhost,1433`, database `DubchefDB` trong SSMS.**

Mở `../HUONG_DAN_QUAN_TRI_THONG_MINH_VA_SQL.md` để xem bảng ánh xạ chức năng User/Admin → bảng SQL, thứ tự migration, cách nâng cấp và kiểm thử.

## 1. Bảng cấu trúc (chạy có thứ tự, không phải báo cáo)

- `01-create-database.sql` → `02-schema.sql` → `04-workflows.sql` → `07-quan-tri-nghiep-vu.sql`.
- `03-admin.sql`: stored procedures thống kê (tùy chọn, sau schema).
- `00-CAI-DAT-KHONG-XOA.sql`: bộ cài đặt tích hợp **các lệnh 01,02,04,03,07** để chạy thủ công, có IF EXISTS/CREATE OR ALTER; sao lưu trước.
- `05-sqlserver-tai-khoan.sql`: **legacy**, cơ chế SHA-256 không tương thích scrypt của website Node.js. **Không dùng để tạo tài khoản web**.
- `supabase-accounts.sql`, `supabase-qr.sql`: **PostgreSQL**, không dùng trong SSMS.

Backend Node khi khởi động tự kiểm tra/cài lần lượt 01, 02, 04, 07. Có thể dùng 07 cho nâng cấp database cũ, không cần chạy 00 nếu database đã đủ bảng.

## 2. Truy vấn báo cáo (F5 để xem Results)

- `bao-cao/00-TONG-HOP.sql`: KPI cơ bản.
- `bao-cao/01-NguoiDung.sql`: tài khoản, login.
- `bao-cao/02-Video-ThuyetMinh-PhuDe.sql`: video, nội dung, **tách JSON thành dòng phụ đề**.
- `bao-cao/03-PhanHoi-LienHe.sql`: khách gửi và Admin trả lời.
- `bao-cao/04-DonHang-DoanhThu.sql`: đơn và giao dịch **mô phỏng**.
- `bao-cao/05-NgonNgu-QR.sql`: danh mục ngôn ngữ, truy cập và QR.
- `bao-cao/06-KiemDuyet-LichSu.sql`: trạng thái duyệt, phiên bản, ưu tiên và audit.
- **`BAO_CAO_TONG_HOP.sql`** hoặc `queries.sql`: tất cả báo cáo trên trong một file để chạy F5 và xem nhiều bảng.

**Báo cáo không ghi dữ liệu.** Nếu kết quả rỗng, tạo dữ liệu bằng thao tác User/Admin trên website. Đừng chạy các file `supabase-*.sql` trong SSMS.

## 3. Xử lý lỗi

- API `Login failed for user sa`: kiểm tra `.env` và mật khẩu SQL thật, không xóa volume.
- `Invalid object name`: thiếu schema/migration; sao lưu rồi chạy file tạo bảng đúng thứ tự.
- `Invalid column name`: DB cũ chưa được nâng cấp 07 hoặc schema đã lệch; ngừng thử ALTER/DROP tùy tiện.
- Mất `localhost:3000/api/health`: kiểm tra `docker compose logs api --tail=80`.
