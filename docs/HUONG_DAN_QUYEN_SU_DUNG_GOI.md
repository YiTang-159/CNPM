# Dubchef – Quản lý quyền sử dụng gói đã mua

## Mục tiêu

- Đơn `pending`: không cấp quyền.
- Thanh toán **payOS**: chỉ cấp quyền sau khi webhook có chữ ký hợp lệ và số tiền/đơn khớp, trong transaction `payOrder`.
- Chế độ `PAYMENT_MODE=demo`: có thể cấp lượt **thử nghiệm** để trình diễn, ghi nguồn `demo`, không gọi là tiền thật.
- Đơn cũ `paid`, chưa rõ nguồn (`legacy_unknown`) hoặc không có `MaNguoiDung`: không cấp tự động.
- Mỗi **video mới** chiếm 1 lượt tải. Mỗi **ngôn ngữ đích mới** (khác ngôn ngữ gốc) của một video chiếm 1 lượt dịch. Mỗi đoạn phụ đề và thuyết minh KHÔNG bị tính hai lượt.
- Chỉnh sửa hoặc lưu lại đúng cặp video–ngôn ngữ không tính thêm. Nội dung đã tồn tại trước migration không bị tính lượt mới khi chỉnh sửa.
- Giao dịch cập nhật quota đều thực hiện bên trong SQL transaction và có khóa theo tài khoản.
- Hủy một video chỉ mới tạo thông tin, **chưa tải xong file** sẽ hoàn lại 1 lượt. Video đã tải xong sẽ không tự hoàn lượt khi xóa; cần quy trình xử lý khiếu nại nếu muốn hoàn thủ công có kiểm soát.
- **Chưa triển khai** thuê bao tháng/năm thực sự, hạn sử dụng, chuyển gói hoặc tự động gia hạn. Các bảng giá định kỳ trên website chỉ là phần giới thiệu, không tự cấp hạn mức thuê bao.

## Cài đặt an toàn

1. Sao lưu `CNPM` và sao lưu database `DubchefDB` trong SSMS.
2. Nếu đang dùng bản Dubchef payOS + MP3/MP4 gần nhất, giải nén PATCH rồi chép đè đúng cấu trúc `CNPM` vào thư mục hiện tại. Giữ nguyên mọi `.env`.
3. Đứng tại thư mục `CNPM`, chạy `docker compose up -d --build api` để backend tự chạy migration `12-quyen-su-dung-goi.sql`. **Không** chạy `docker compose down -v`.
4. Chạy `cd web`, `npm install`, `npm run build`, `npm run dev`.
5. Trong SSMS chọn `DubchefDB`, chạy file **chỉ đọc** `db/bao-cao/10-KiemTraQuyenSuDungGoi.sql`.

## Demo với một tài khoản mới

1. Dùng tài khoản **khách hàng**, đăng nhập và vào **Tài khoản của tôi**: hạn mức ban đầu 0/0.
2. Mua gói 3 lượt tải + 3 lượt dịch. Ở chế độ thử nghiệm đặt `PAYMENT_MODE=demo` *chỉ trên máy demo*, thanh toán theo flow mô phỏng. Nếu dùng payOS thật phải cấu hình tài khoản/kênh webhook công khai hợp lệ.
3. Chỉ sau khi đơn `paid` mới thấy 3 lượt tải và 3 lượt dịch ở `Tài khoản của tôi`. Giao dịch thử nghiệm được gắn nguồn **demo**.
4. Tạo video thứ nhất: còn 2 lượt tải. Tạo phụ đề/giọng đọc bằng tiếng gốc không tốn lượt dịch; thêm tiếng Anh: còn 2 lượt dịch. Lưu lại tiếng Anh không giảm tiếp.
5. Thêm tiếng Trung cho cùng video: còn 1 lượt dịch. Sau khi dùng hết lượt, API trả 409 (`quota_upload_exceeded` hoặc `quota_translation_exceeded`).
6. Tạo metadata video nhưng tải file thất bại: mở **Tài khoản → Video của tôi → Hủy bản tải lên dở** để hoàn lượt; hoặc thử tải lại file vào đúng video ID.
7. Đăng nhập Admin → Người dùng → Hồ sơ → Quyền lợi theo đơn hàng để xem số lượt của từng khách (Admin không được tiêu thụ hạn mức của khách).
8. Chạy báo cáo SSMS: đối chiếu `QuyenLoiGoi` và `SuDungQuyenLoi`. Khởi động lại Docker để xác nhận số lượt giữ nguyên.

## Lệnh kiểm thử

Tại thư mục CNPM: `npm --prefix server test` (kiểm thử API; SQL integration riêng, mặc định bỏ qua).
Tại thư mục `CNPM/web`: `npm run test` và `npm run build`.
Kiểm thử SQL tích hợp **chỉ chạy trên database thử nghiệm tự tạo**, theo hướng dẫn `server/test/sql.integration.test.mjs` với `DB_INTEGRATION=true`. KHÔNG dùng môi trường dữ liệu thật để thử xóa/khởi tạo DB.

## Vấn đề cần lưu ý

- Giao diện Demo có thể xử lý thử video cục bộ khi không đăng nhập, nhưng chỉ tài khoản có quyền lợi mới ghi video mới và bản dịch mới lên SQL Server.
- Hạn mức kinh doanh được đếm theo **số video** và **số ngôn ngữ đích** (không theo số câu, thời lượng, số lần bấm hay số lượt tải MP3/MP4).
- Cần backup DB trước khi nâng cấp. Không tự gán đơn `legacy_unknown` cho tài khoản chỉ dựa trên email.
- Nếu cần gói tháng/năm thật, phải thêm ngày bắt đầu/kết thúc, chính sách gia hạn và xử lý hoàn/hủy; chưa có ở bản sửa này.
