# SQL Server — hướng dẫn kiểm tra an toàn

## Kết nối SSMS

- Server: `127.0.0.1,1433`
- Authentication: SQL Server Authentication
- User: lấy từ `DB_USER` (`sa` trong Docker cấu hình hiện tại)
- Password: lấy từ `.env` **riêng trên máy**, không đưa vào repo, ảnh chụp hoặc báo cáo.
- Database: `DubchefDB` (nếu giữ mặc định).

**Không chạy** `docker compose down -v` hoặc tạo lại SQL volume để thử migration.

## Hiện trạng mã nguồn

`server/src/db.js:openRepo()` hiện tự chạy lần lượt: `00-PREFLIGHT.sql`, `02-schema.sql`, `04-workflows.sql`, `07-quan-tri-nghiep-vu.sql`, `10-an-toan-don-hang-va-nhat-ky.sql`, `11-nguon-xac-nhan-thanh-toan.sql`, `12-quyen-su-dung-goi.sql`, `13-doi-soat-chu-don-hang-cu.sql`. Đã bổ sung `db/migrations/014_pricing.sql` tạo bảng `SchemaMigrations` và các bảng giá. **Chưa chạy/kiểm chứng trên SQL thật**; các script legacy vẫn chạy theo thứ tự cũ và chưa được chuyển toàn bộ sang runner versioned. Nguồn dữ liệu nghiệp vụ hiện là SQL Server; không tái nhập `db/data/*.json` vào production.

## Các lệnh xác minh thủ công trong SSMS — chỉ đọc

```sql
SELECT name FROM sys.tables ORDER BY name;
SELECT TOP (10) * FROM dbo.DonHang ORDER BY MaDonHang DESC;
SELECT TOP (10) * FROM dbo.LuotQuetQR ORDER BY NgayQuet DESC;
SELECT TOP (10) * FROM dbo.LienHe ORDER BY MaLienHe DESC;
```

Tên cột/khóa phải đối chiếu trực tiếp schema trước khi thêm hoặc đổi. Không tuyên bố đã kiểm thử SQL trắng/khôi phục trên máy của người dùng: không có Docker/SQL Server trong runtime chỉnh sửa này.

## Migration bổ sung (chỉ dùng SQL thử trước)

Trước khi nâng cấp trên dữ liệu thực phải sao lưu/kiểm tra restore. Khởi động `openRepo()` sẽ chạy `db/migrations/014_pricing.sql` và `db/seed/001_pricing_defaults.sql` sau 13 migration legacy. Migration có kiểm tra tồn tại để tránh tạo bảng/cột trùng; **chưa chứng minh idempotence bằng SQL thực**. Seed chỉ chèn giá mặc định nếu chưa có mã tiền tệ tương ứng, không ghi đè giá Admin đã sửa.

`db/tests/014_pricing_smoke.sql` và `db/queries/00_suspicious_records.sql` là truy vấn chỉ đọc; không chạy script dọn dữ liệu trực tiếp trên production.
