# Dubchef V3 — Bộ báo cáo quản trị doanh nghiệp dành cho SSMS

## 1. Mục tiêu

Kết hợp ưu điểm của hai bản trước:
- **Tổng quan gọn** để xem tình hình trong vài giây (chỉ 5 bảng `Results`).
- **Báo cáo chuyên sâu** đầy đủ khách hàng, đơn hàng, thanh toán, video, thuyết minh, phụ đề, phản hồi, ngôn ngữ, QR, truy cập, lịch sử đăng nhập, kiểm duyệt và nhật ký chỉnh sửa.
- **Đối soát** để thấy dữ liệu bất thường, không tự thay đổi dữ liệu.
- **Không lặp email vô ích:** Dashboard chỉ có email ở bảng khách hàng. Các bảng khác dùng mã bản ghi/mã người dùng; ở báo cáo nghiệp vụ có thể thấy email để hỗ trợ khách hàng.
- **Không gán đơn hàng bằng cách trùng email:** `SoDonLienKet` chỉ đếm đơn đã gắn `DonHang.MaNguoiDung`. Cột `SoDonTrungEmail_ChuaXacMinh` chỉ là dữ liệu tham khảo để tìm đơn chưa liên kết, **không xác nhận quyền sở hữu**. Xem `07-DoiSoatDuLieu.sql`.
- **Không cộng chung tiền tệ:** VND, USD và CNY tách riêng; các giao dịch `success` hiện có thể là thanh toán mô phỏng nếu website ở chế độ thử nghiệm.

## 2. Những file cần thay

Giải nén ZIP sao cho cấu trúc khớp dự án:

```text
CNPM/
└─ db/
   ├─ queries.sql                ← mở file này trong SSMS để xem Dashboard
   ├─ BAO_CAO_TONG_HOP.sql       ← bản Dashboard cùng nội dung
   ├─ HUONG_DAN_BAO_CAO_V3.md    ← file này
   └─ bao-cao/
      ├─ 00-TONG-HOP.sql          ← Dashboard, cùng nội dung với queries.sql
      ├─ 01-NguoiDung.sql        ← hồ sơ 1 tài khoản/1 dòng, số đơn, video, doanh thu tách tiền tệ
      ├─ 02-Video-ThuyetMinh-PhuDe.sql
      ├─ 03-PhanHoi-LienHe.sql
      ├─ 04-DonHang-DoanhThu.sql
      ├─ 05-NgonNgu-QR.sql
      ├─ 06-KiemDuyet-LichSu.sql
      ├─ 07-DoiSoatDuLieu.sql     ← kiểm tra trùng dữ liệu, sai lệch thanh toán
      ├─ 08-TraCuuMotKhach.sql   ← tra cứu một khách (sửa ID hoặc email)
      └─ 09-LichSuDangNhap.sql
```

**Sao lưu thư mục `CNPM/db/` trước khi chép đè.** Bộ V3 không thay file schema, server, Docker, API, `.env`, `vite.config.js`, hoặc dữ liệu SQL Server. Không chạy lại migration chỉ để xem báo cáo.

## 3. Cách chạy

1. Mở Docker Desktop, bảo đảm API và SQL Server đang chạy như hiện tại.
2. Mở SSMS, kết nối `localhost,1433`, chọn `DubchefDB`.
3. Mở `CNPM/db/queries.sql`, nhấn **Execute (F5)**. Kết quả gồm **5 bảng**:
   1. Chỉ số tổng quan (từng hàng, có đơn vị).
   2. 100 khách hàng mới nhất, không nhân bản bản ghi.
   3. 50 đơn hàng mới nhất, không lặp email.
   4. 60 việc cần xử lý (phản hồi, liên hệ, video).
   5. Doanh thu theo ngày và theo tiền tệ trong 30 ngày.
4. Muốn xem chi tiết, mở **một** file trong thư mục `bao-cao/` và chạy F5.
5. Muốn xem mọi khách hàng, dùng `01-NguoiDung.sql`. Muốn tra 1 khách, dùng `08-TraCuuMotKhach.sql` (đặt `@MaNguoiDung = 3` hoặc `@Email = N'...'`).
6. Nếu SSMS hiện lỗi, chuyển sang tab `Messages` để lấy số lỗi, dòng lỗi.

## 4. Nguyên tắc đọc báo cáo

- **Dữ liệu gốc** lưu ở bảng `dbo.NguoiDung`, `dbo.DonHang`, `dbo.GiaoDich`, ... trong `DubchefDB`, không lưu tại `queries.sql`. File SQL này chỉ dùng để hỏi dữ liệu.
- **Lịch sử đăng nhập bằng 0:** bảng `LichSuDangNhap` chưa có sự kiện được ghi; không thể từ đó kết luận người dùng chưa từng đăng nhập. Thử đăng xuất/đăng nhập mới qua web và kiểm tra log backend nếu vẫn trống.
- **`SoDonLienKet` bằng 0:** không có đơn gắn bằng mã tài khoản; `SoDonTrungEmail_ChuaXacMinh` có thể khác 0 vì backend ghi email của đơn mà chưa gắn mã người dùng. Không suy ra sở hữu từ email. Xem báo cáo đối soát.
- **`paid` trong DonHang khác với `success` trong GiaoDich:** doanh thu báo cáo chỉ tính các dòng giao dịch thành công; nếu hệ thống dùng thanh toán demo thì chưa phải tiền ngân hàng xác nhận.
- **Mốc thời gian:** SQL Server lưu UTC; báo cáo hiển thị +7 theo giờ Việt Nam, không thay cột gốc.
- **Các báo cáo có `TOP`:** chỉ giới hạn số dòng để SSMS dễ xem. 01-NguoiDung xem tất cả tài khoản; các báo cáo chuyên môn có thể chỉnh `TOP(200)` theo nhu cầu.
- **Các báo cáo theo migration 07:** `06-KiemDuyet-LichSu.sql` chỉ hiển thị thông báo khi view/bảng lịch sử chưa tồn tại; không tự cài đặt.
- **Phụ đề/thuyết minh có hai biến thể schema:** bộ báo cáo kiểm tra `MaNgonNgu` hoặc `NgonNgu` tự động, không yêu cầu sửa cơ sở dữ liệu.

## 5. An toàn và giới hạn

- Mọi file báo cáo chỉ sử dụng `SELECT`, `IF`, `DECLARE`, `EXEC sys.sp_executesql` với truy vấn SELECT, `USE`, `SET NOCOUNT`, `GO`.
- **Không có** `INSERT`, `UPDATE`, `DELETE`, `TRUNCATE`, `ALTER TABLE`, `CREATE TABLE` và không tự động đổi cấu trúc bảng.
- Không in mật khẩu băm, token phiên, thông tin thẻ ngân hàng. Khi chia sẻ ảnh SSMS, che email, IP và mã tham chiếu giao dịch nếu cần.
- Đã đối chiếu tên bảng/cột với các file `db/02-schema.sql`, `db/04-workflows.sql` và `db/07-quan-tri-nghiep-vu.sql` của `CNPM(1).zip`. **Chưa kiểm thử kết nối trực tiếp vào SQL Server của bạn**; nếu schema trên máy khác ZIP, có thể cần điều chỉnh thêm.
- Dùng SSMS cho quản trị kỹ thuật; với doanh nghiệp thật, nên đưa dashboard tổng quan lên giao diện Admin website có phân quyền và cơ chế ghi nhật ký.
