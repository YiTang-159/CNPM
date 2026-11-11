# Các thay đổi trong bản sửa ngày 11 tháng 11 năm 2026

- Thống nhất API videos, feedback và admin/media với cấu trúc SQL JSON. Gỡ các module cũ không được gắn vào ứng dụng và dùng bảng khác.
- Cập nhật bộ test Backend theo API thực đang dùng, thêm kiểm tra quyền, token có ID tài khoản, timestamp, phiên bản duyệt và thanh toán tắt/bật rõ ràng.
- Cài SQL có preflight và chọn đúng DB_NAME; thêm close pool và kiểm thử SQL trên database ngẫu nhiên riêng; CI chạy toàn bộ Backend và SQL.
- Web xem lại video/kết quả SQL từ Tài khoản và Admin; có đồng bộ phụ đề/TTS thiết bị. Tự tải lại Admin, giữ bản đang sửa và hiển thị ngày Việt Nam.
- Mobile lưu metadata, tệp video và kết quả vào cùng API/SQL; không báo lưu khi upload lỗi. Chế độ dữ liệu cục bộ chỉ bật có chủ đích ở dev/test.
- Danh mục ngôn ngữ bật/tắt ảnh hưởng lần dịch tiếp theo; giữ nguyên lời thoại nguồn. Ngoài vi/en/zh chưa có bộ dịch mới.
- 23 Use Case và Activity mới; DFD ngữ cảnh, mức 1, mức 2 và bản mức 2 một canvas; cập nhật Word, ERD, miền dữ liệu và kiến trúc.
- Sửa CD Web đòi Backend HTTPS; CD Mobile đòi URL API và chờ build EAS. Giữ nguyên host/port SQL và volume Docker.

Không thêm cổng thanh toán thật hoặc xuất video đã ghép giọng. SQL thật, EAS và APK điện thoại cần kiểm chứng trên máy/CI có dịch vụ tương ứng; xem KET_QUA_KIEM_TRA.md.
