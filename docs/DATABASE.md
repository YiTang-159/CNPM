# SQL Server — hướng dẫn kiểm tra an toàn

## Kết nối SSMS

- Server: `127.0.0.1,1433`
- Authentication: SQL Server Authentication
- User: lấy từ `DB_USER` (`sa` trong Docker cấu hình hiện tại)
- Password: lấy từ `.env` **riêng trên máy**, không đưa vào repo, ảnh chụp hoặc báo cáo.
- Database: `DubchefDB` (nếu giữ mặc định).

**Không chạy** `docker compose down -v` hoặc tạo lại SQL volume để thử migration.

## Hiện trạng mã nguồn

`server/src/db.js:openRepo()` hiện tự chạy lần lượt: `00-PREFLIGHT.sql`, `02-schema.sql`, `04-workflows.sql`, `07-quan-tri-nghiep-vu.sql`, `10-an-toan-don-hang-va-nhat-ky.sql`, `11-nguon-xac-nhan-thanh-toan.sql`, `12-quyen-su-dung-goi.sql`, `13-doi-soat-chu-don-hang-cu.sql`. Chưa có `SchemaMigrations` version tracking trên CSDL đang dùng. Nguồn dữ liệu nghiệp vụ hiện là SQL Server; không tái nhập `db/data/*.json` vào production.

## Các lệnh xác minh thủ công trong SSMS — chỉ đọc

```sql
SELECT name FROM sys.tables ORDER BY name;
SELECT TOP (10) * FROM dbo.DonHang ORDER BY MaDonHang DESC;
SELECT TOP (10) * FROM dbo.LuotQuetQR ORDER BY NgayQuet DESC;
SELECT TOP (10) * FROM dbo.LienHe ORDER BY MaLienHe DESC;
```

Tên cột/khóa phải đối chiếu trực tiếp schema trước khi thêm hoặc đổi. Không tuyên bố đã kiểm thử SQL trắng/khôi phục trên máy của người dùng: không có Docker/SQL Server trong runtime chỉnh sửa này.
