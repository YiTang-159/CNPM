# Dubchef — Kiểm toán cấu hình Admin (15/11/2026)

Không nhầm mã nguồn đã bổ sung với việc đã chạy thành công migration trên SQL thật. Các API/bảng bên dưới **đã viết mã, CHƯA chạy kiểm thử tích hợp SQL Docker** trong môi trường sửa file.

| Cấu hình | Nguồn hiện tại trong luồng nghiệp vụ mới | Quyền Admin | Giới hạn / việc còn lại |
|---|---|---|---|
| Đơn giá video đăng / dịch VND | `dbo.BangGia` theo `LoaiTien='VND'`, `GET /api/pricing`, order snapshot trong `dbo.DonHang` | Trang `/admin/pricing` có form Lưu/Hủy/lý do/lịch sử, API PUT | Chưa test SQL thực; legacy `shared/pricing.js` vẫn còn cho unit tests/dev fallback |
| Đơn giá USD/CNY | `dbo.BangGia` theo tiền tệ | Có form sửa từng tiền tệ | Đơn USD/CNY chỉ nên dùng demo, payOS chỉ nhận VND; chưa có tỷ giá quy đổi động |
| Giới hạn video/lượt, bản dịch/video | `BangGia.GioiHanVideo`, `GioiHanBanDich`; máy chủ kiểm ở tạo đơn | Có form sửa | Cần kiểm cả luồng upload, job xuất video thực trên DB test |
| % giảm năm | `BangGia.GiamGiaNamPct` | Có form sửa | Trang giá cho thấy **ước tính**; chưa có hợp đồng thuê bao/thu tiền định kỳ |
| Danh sách gói, tên, số lượt, sắp xếp, bật/tắt | `dbo.GoiDichVu`, đọc qua GET /api/pricing | **CHƯA** có API/form sửa gói | Bảng Admin hiện chỉ đọc; cần triển khai transaction + audit gói |
| Lịch sử thay đổi giá | `dbo.LichSuBangGia` | Có trang xem | Chưa chạy test hai Admin/SQL transaction thật |
| Ảnh chụp giá khi tạo đơn | `DonHang.*Snapshot`, `SoTien` | Chỉ đọc | Chưa nghiệm thu đơn cũ, hóa đơn, payOS webhook thật |
| Email liên hệ | Public build config `VITE_CONTACT_EMAIL` | **CHƯA** chỉnh từ Admin | Cần bảng cấu hình/endpoint; email thật do chủ dự án cung cấp |
| Email quyền riêng tư | Có chỗ dùng trong nội dung tĩnh/i18n | **CHƯA** | Đồng bộ config và duyệt pháp lý |
| QR public URL | `VITE_PUBLIC_BASE_URL` (HTTPS lúc build) | **CHƯA** | Cần tên miền thật; QR không thể tự biết IP điện thoại, phải rebuild khi đổi URL |
| Điều khoản / chính sách | Nội dung trang Legal tĩnh | **CHƯA** | Cần quản lý phiên bản có người duyệt |
| Lượt miễn phí lúc đăng ký | Luồng cấp lượt/SQL | **CHƯA** | Cần một nguồn cấu hình SQL và test nghiệp vụ |
| Tiến độ tải video, Whisper, TTS giọng | UI/backend code | **CHƯA** | Cần kiểm thử thiết bị thật và năng lực máy chủ |

Không coi việc lưu một giá SQL là đã hoàn tất yêu cầu **tất cả** gói, cấu hình, giới hạn job, hiển thị lịch sử và đồng bộ điện thoại. Các tệp còn số tiền cứng phải được triệt tiêu sau khi thay đổi toàn bộ fallback, với unit tests mới cho mã tính giá thuần.
