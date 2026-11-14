# DubchefDB — SQL Server 2022: vận hành an toàn

**Trạng thái:** Bộ migration và kiểm thử trong repository đã được viết, **CHƯA chạy được với SQL Server thật trong môi trường xây dựng tài liệu này**. Đừng áp dụng vào cơ sở dữ liệu chứa dữ liệu quan trọng khi chưa thử trên bản sao lưu đã khôi phục.

## 1. SSMS và nguồn dữ liệu

- Server: `127.0.0.1,1433` (Docker hiện chỉ publish ra loopback).
- Authentication: **SQL Server Authentication**, tên tài khoản trong biến `DB_USER` hoặc `DB_APP_USER` của `.env` riêng trên máy; mật khẩu trong `DB_PASSWORD` hoặc `DB_APP_PASSWORD`. Không sao chép mật khẩu vào tài liệu, screenshot, Git hay chat.
- Database: `DubchefDB` (nếu `DB_NAME` không được thay đổi).
- Nguồn dữ liệu nghiệp vụ duy nhất: **SQL Server**; tệp `db/data/*.json`, Supabase PostgreSQL, localStorage không được xem là dữ liệu sản xuất.
- Ngày/giờ lưu `DATETIME2` UTC; doanh thu nhóm theo **ngày Việt Nam UTC+07:00** qua `dbo.vw_DoanhThuNgay`. Nhóm tiền theo `LoaiTien`; không cộng chung VND/USD/CNY.
- Collation hiện hữu phải đọc bằng `SELECT DATABASEPROPERTYEX(DB_NAME(),'Collation')`, **không áp đặt collation mới lên database cũ** vì có thể đổi so sánh email/unique. Khi tạo môi trường mới, ghi lại collation trong log nghiệm thu và so sánh với staging.

## 2. Quy trình an toàn cho CSDL đang có dữ liệu

1. **Giữ `.env`, volume và mật khẩu cũ.** Không chạy `docker compose down -v`, không xóa `DubchefDB`, không đổi `sa` trong SQL đang chạy.
2. Sao lưu toàn bộ SQL bằng phương pháp đã xác nhận; **kiểm tra khôi phục thành công vào DB test riêng**. Nên lưu một bản backup ở nơi tách biệt, có quyền truy cập hạn chế.
3. Chọn `DubchefDB` trong SSMS và chạy `db/tests/preflight-existing.sql` để tìm đơn/tiền/quyền lợi mâu thuẫn. Lưu output không chứa PII vào thư mục bằng chứng riêng.
4. Khôi phục backup sang DB staging; chọn staging trong dropdown SSMS rồi chạy `db/migrations/RUN_ALL_IN_SSMS.sql`. Dừng ngay nếu `THROW` báo dữ liệu cũ vi phạm; **đối soát và viết migration dữ liệu riêng được duyệt**, không xóa/cập nhật bừa các số tiền gốc.
5. Trên staging, chạy `db/tests/integrity-audit.sql` (chỉ đọc, in PASS/FAIL/WARN, `THROW` nếu có FAIL) và `db/tests/schema-catalog.sql` để xuất danh mục bảng/cột/FK thực tế. Chạy lại migration lần 2, kiểm tra `ALREADY APPLIED`/checksum không đổi.
6. Chỉ sau khi bước 2–5 đạt và có phương án rollback được chứng minh, đưa thay đổi lên production trong cửa sổ bảo trì. Giữ backup trước nâng cấp.

**Không chạy file `db/00-CAI-DAT-KHONG-XOA.sql` cũ**: đó chỉ là biển cảnh báo. Bộ chuẩn duy nhất nằm trong `db/migrations/`.

## 3. Chạy migration trên SQL Server mới (không chứa dữ liệu)

Ở thư mục gốc của dự án, trong môi trường đã cài Node.js và module từ `npm ci --prefix server`, dùng tài khoản migration có quyền DDL:

```powershell
# Chỉ trong môi trường test; DB_CREATE_IF_MISSING có thể tạo CSDL trắng.
$env:DB_NAME = 'DubchefIntegrityStaging'
$env:DB_CREATE_IF_MISSING = 'true'
# DB_PASSWORD và DB_MIGRATION_PASSWORD phải được cấp qua biến môi trường/secret manager, không gõ vào log.
node server/scripts/run-migrations.mjs
node server/scripts/run-migrations.mjs
```

Lệnh tự chạy migration tuần tự từ `server/src/migrationPlan.mjs`, kiểm tra checksum SHA-256 của bản đã chạy, có `sp_getapplock` và transaction. Trong SSMS chạy `db/migrations/RUN_ALL_IN_SSMS.sql` (sinh tự động bằng `node db/scripts/export-ssms.mjs`) **trên đúng DB đang được chọn**. Hai cách dùng cùng nội dung file migration và checksum.

**Lưu ý:** Nếu môi trường chưa có `DB_NAME`, mặc định `DubchefDB`. Không bật `DB_CREATE_IF_MISSING=true` trên production. Chỉ chạy `db/seed/001_pricing_defaults.sql` khi có chủ đích; không chèn dữ liệu mẫu khách hàng vào production.

## 4. Phân quyền ứng dụng và tách migration

- Ở production API không chạy DDL (`DB_MIGRATE_ON_START=false`, `DB_SKIP_CREATE=true`); dịch vụ migration chạy trước riêng biệt.
- Tạo tài khoản ít quyền bằng `node server/scripts/provision-db-users.mjs` với hai biến bảo mật riêng `DB_APP_PASSWORD` và `DB_MIGRATION_PASSWORD` (ít nhất 16 ký tự, không trùng nhau). Đây là thao tác cấu hình đặc quyền **phải thử trên staging**. Script không in secret hay đổi mật khẩu của login đã tồn tại.
- Đặt `DB_APP_USER=dubchef_app`, `DB_APP_PASSWORD` vào cấu hình API và `DB_MIGRATION_USER=dubchef_migrator`, `DB_MIGRATION_PASSWORD` ở bước migration. Tài khoản `dubchef_app` chỉ có read/write + EXECUTE, không có quyền sysadmin/db_owner/db_ddladmin.
- **Rủi ro còn lại:** cấu hình local mặc định vẫn có thể dùng `sa`; công việc chuyển thật sang user ít quyền cần người vận hành cung cấp secret và thực thi. Không tự cho rằng đã hoàn thành.

## 5. Quy tắc dữ liệu

- Giá gói và đơn mới có ảnh chụp giá. Đơn trước migration 015 được đánh dấu `DonCu=1`; lịch sử tiền không được tự tái dựng từ biểu giá mới. `DonCu=0` buộc có chủ và snapshot.
- Tiền lưu số nguyên đơn vị nhỏ nhất (BIGINT): VND đồng, USD cent, CNY xu. Không dùng FLOAT. Giao dịch bị ràng buộc với cùng `MaDonHang`, `LoaiTien`, `SoTien` của đơn và một đơn chỉ có tối đa một giao dịch `success`.
- `NguonXacNhan='payos'` là doanh thu thật; `demo` và `legacy_unknown` hiển thị riêng. Với dữ liệu di sản không rõ nguồn, không được đổi tự động thành payOS.
- Lượt quyền lợi có nhật ký `SuDungQuyenLoi`; trigger đối soát bộ đếm trên `QuyenLoiGoi`. Video đã tính lượt không thể đổi chủ sở hữu.
- Xóa mềm/ẩn danh hóa người dùng thông qua chức năng Admin, giữ `MaNguoiDung` để bảo vệ FK kế toán. Không xóa cứng người dùng đã có đơn.
- Chỉ nội dung tác nghiệp (`ThuyetMinh`, `PhuDe`, `LichSuNoiDung`) chấp nhận JSON hợp lệ. Upload có mã ngôn ngữ NULL; bản dịch phải tham chiếu NgonNgu tồn tại.

## 6. Truy vấn dùng để nghiệm thu

```sql
SELECT Version, FileName, ChecksumSha256, AppliedAt, AppliedBy
FROM dbo.SchemaMigrations ORDER BY Version;
SELECT Ngay,LoaiTien,SoGiaoDich,TongSoTien,
       SoGiaoDichMoPhong,TongTienMoPhong,
       SoGiaoDichChuaXacMinh,TongTienChuaXacMinh
FROM dbo.vw_DoanhThuNgay ORDER BY Ngay DESC;
SELECT name,is_disabled,is_not_trusted FROM sys.foreign_keys
WHERE is_disabled=1 OR is_not_trusted=1;
```

Chạy `db/tests/schema-catalog.sql` để nhận **từng cột/kiểu/FK/check thực tế của chính DB**. `docs/DATA_DICTIONARY.md` là bản mô tả thiết kế theo source, không thay cho kết quả xuất catalog sau migration.

## 7. Chứng cứ bắt buộc trước nghiệm thu

- Backup đã khôi phục vào staging, bản ghi kết quả kiểm tra trước/sau (không tiết lộ khách hàng).
- Migration trên DB trắng và dữ liệu cũ, chạy lặp lại, checksum khớp.
- `db/tests/integrity-audit.sql` trả PASS không có FAIL; truy vấn `db/tests/schema-catalog.sql` thể hiện khóa/kiểu/collation thực tế.
- SQL integration trong CI: `server/test/sql.integration.test.mjs` và `server/test/integrity.integration.test.mjs`, cả test dữ liệu sai và rollback/không ghi đè.
- Kế hoạch thực thi của truy vấn quan trọng trong `db/queries.sql` trên dữ liệu đại diện (actual execution plan, logical reads). Kết quả chưa có trong môi trường tạo gói này.
