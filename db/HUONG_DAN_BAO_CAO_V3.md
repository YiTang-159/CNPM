# SQL Server của phiên bản hiện tại

Cấu trúc chuẩn là `NgonNgu` trong PhuDe/ThuyetMinh, `NoiDung` JSON các dòng text/start/end, metadata Video gồm TenTep/DungLuong/DinhDang. Tên `MaNgonNgu` vẫn là khóa chính của bảng danh mục NgonNgu; không nhầm với cột của bảng nội dung.

## Cài và nâng cấp

Khuyến nghị chạy Docker API: `docker compose up -d --build`. `openRepo()` tự chạy preflight, 02-schema, 04-workflows và 07-quan-tri-nghiep-vu. Tên database được chọn từ DB_NAME, mặc định DubchefDB; API không thực thi USE DubchefDB bên trong pool của database khác. DB_SKIP_CREATE=true dùng khi database đã có và login không có quyền tạo database.

Nếu cài bằng SSMS, chạy **00-CAI-DAT-KHONG-XOA.sql** một lần, trên cùng SQL Server API sử dụng. Đây là file tổng hợp không xóa dữ liệu và không chèn dữ liệu mẫu; chạy lại chỉ bổ sung cấu trúc còn thiếu. Không cần chạy lần lượt tất cả file trong thư mục.

Nếu preflight phát hiện cấu trúc cũ MaNgonNgu/ThuTu/BatDau/KetThuc trong bảng nội dung hoặc Video thiếu metadata, lệnh dừng trước khi áp dụng migration. Sao lưu database và đối chiếu cấu trúc; không xóa bảng để vượt qua lỗi. Bộ ZIP gốc được kiểm tra dùng bộ 04-workflows JSON; script 06-service tạo cấu trúc khác đã được thay bằng chỉ dẫn tương thích để tránh tạo nhầm.

## Tra cứu và báo cáo

- `queries.sql`, `BAO_CAO_TONG_HOP.sql`, `bao-cao/00-TONG-HOP.sql`: truy vấn tổng hợp chỉ đọc.
- `bao-cao/01..09`: truy vấn theo từng chức năng, gồm lịch sử đăng nhập và đối soát.
- `03-admin.sql`, `08-bao-cao-chuyen-nghiep.sql`: thủ tục/view tùy chọn cho SSMS; API dùng truy vấn tham số hóa trực tiếp.
- `05-sqlserver-tai-khoan.sql`: tiện ích tài khoản cũ, không cần chạy cho đăng ký qua Web/Mobile; không tự thay mật khẩu tài khoản hiện tại.
- `09-du-lieu-mau.sql` và `09b-xoa-du-lieu-mau.sql`: chỉ dùng chủ động cho dữ liệu mẫu; không nằm trong cài tự động.
- `supabase-*.sql`: PostgreSQL cho phương án Supabase cũ, **không chạy trong SSMS**. Cấu hình `/backend` trong bản này dùng SQL Server.
- `06-service.sql`, `07-service-queries.sql`: chỉ thông báo đường chạy chuẩn; không tạo bộ bảng thứ hai.

Mật khẩu đăng nhập ứng dụng không phải mật khẩu sa. Giữ DB_PASSWORD cũ khi dùng volume SQL đã có: đổi biến môi trường không đổi mật khẩu sa của volume cũ. Không chạy docker compose down -v nếu muốn giữ dữ liệu.

## Dữ liệu cần kiểm tra

```sql
USE DubchefDB;
SELECT TOP(20) MaNguoiDung,HoTen,Email,VaiTro,TrangThai FROM dbo.NguoiDung ORDER BY MaNguoiDung DESC;
SELECT TOP(20) * FROM dbo.Video ORDER BY MaVideo DESC;
SELECT TOP(20) * FROM dbo.ThuyetMinh ORDER BY MaThuyetMinh DESC;
SELECT TOP(20) * FROM dbo.PhuDe ORDER BY MaPhuDe DESC;
SELECT TOP(20) * FROM dbo.PhanHoi ORDER BY MaPhanHoi DESC;
SELECT TOP(20) * FROM dbo.LienHe ORDER BY MaLienHe DESC;
SELECT TOP(20) * FROM dbo.DonHang ORDER BY MaDonHang DESC;
SELECT TOP(20) * FROM dbo.GiaoDich ORDER BY MaGiaoDich DESC;
SELECT * FROM dbo.NgonNgu;
SELECT TOP(20) * FROM dbo.LichSuNoiDung ORDER BY MaLichSu DESC;
SELECT TOP(20) * FROM dbo.LichSuXuLyPhanHoi ORDER BY MaLichSu DESC;
SELECT TOP(20) * FROM dbo.LichSuDangNhap ORDER BY MaLichSu DESC;
```

Trong PhuDe/ThuyetMinh, NoiDung là JSON. Tệp video gốc nằm trong volume uploads; TTS chưa được xuất thành tệp audio. Thời gian lưu UTC, báo cáo hiển thị Việt Nam bằng DATEADD(HOUR,7,...). DonHang và GiaoDich hiện chỉ mô phỏng khi PAYMENT_DEMO=true.
