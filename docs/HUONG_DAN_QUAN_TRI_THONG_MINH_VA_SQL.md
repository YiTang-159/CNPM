# Quản trị và SQL của bản hiện tại

Các trang Admin dùng API trong server/src/app.js, truy vấn trong db.js, workflows.js và adminOperations.js. Không dùng bộ serviceRepo/serviceRoutes cũ. Thuyết minh và phụ đề dùng chung AdminMediaResults cùng API /api/admin/media; lịch sử được ghi trong transaction SQL.

Tài khoản: xem khóa mở xóa tài khoản không có dữ liệu liên kết. Video: xem tệp bảo vệ đổi trạng thái và xóa. Nội dung: tạo nháp biên tập duyệt xuất bản theo phiên bản. Hỗ trợ: phân loại ưu tiên trả lời và lịch sử. Đơn: chỉ tra cứu giao dịch mô phỏng. Ngôn ngữ: thêm sửa bật tắt danh mục; bộ dịch hỗ trợ vi en zh. Tổng hợp/QR/truy cập: lấy số liệu SQL.

Các trang tự tải lại 15 giây; QR 5 giây; thống kê tổng hợp 20 giây. Khi sửa nội dung hoặc phản hồi chưa lưu, tạm dừng tải lại để giữ nội dung. Nút Làm mới dùng khi muốn nạp ngay dữ liệu SQL.

Hướng dẫn cài đặt xem README.md, kiểm thử xem docs/KIEM_THU.md, bảng/SQL xem db/README-QUAN-LY-SQL.md. Giữ nguyên mật khẩu và volume SQL đang có; chạy npm run setup:local để bổ sung tài khoản Admin và TOKEN_SECRET còn thiếu.
