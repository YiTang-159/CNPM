# Liên kết đơn hàng lịch sử chưa có tài khoản – Dubchef

## Nguyên tắc an toàn

- Đơn cũ có `MaNguoiDung=NULL` **không tự được gán theo email**. Email chỉ tạo danh sách tài khoản *gợi ý*.
- Admin cần đối chiếu chứng từ độc lập (mã giao dịch đối chiếu, biên nhận xác nhận, phiếu hỗ trợ đã xác minh), nhập mã chứng từ + lý do và xác nhận chủ đơn trước khi liên kết.
- Ghi đầy đủ thời gian, nhân viên, tài khoản và căn cứ vào `dbo.XacMinhChuDonHang`, kèm nhật ký `dbo.NhatKyQuanTri`.
- Liên kết chủ đơn **không đổi `paid`, không đổi `NguonXacNhan`, không ghi giao dịch thành công và không cấp lượt**. Các giao dịch `legacy_unknown` tiếp tục là dữ liệu lịch sử chưa xác minh thanh toán thật.
- Nếu email không tìm được đúng một tài khoản, hoặc chưa có chứng cứ độc lập: **để nguyên chưa liên kết**. Không đổi dữ liệu SQL thủ công để ép đạt 0 bản ghi NULL.

## Cài đặt

1. Sao lưu thư mục mã nguồn và backup SQL Server. Không chạy `docker compose down -v`.
2. Chép nội dung `CNPM/` của bản vá vào thư mục `CNPM/` hiện tại, thay các file trùng tên và giữ nguyên `.env`.
3. Ở thư mục gốc `CNPM` chạy `docker compose up -d --build api`. Backend sẽ tự chạy migration 13.
4. Ở `CNPM/web`, chạy `npm run build`, `npm run test`, `npm run dev`.
5. Đăng nhập Admin, mở **Đối soát thanh toán → Chi tiết** của đơn chưa liên kết.
6. Trong **Xác minh chủ đơn hàng cũ**, xem tài khoản khớp email, kiểm tra giấy tờ bên ngoài, nhập loại + mã bằng chứng, ghi chú (15–500 ký tự), tick xác nhận rồi nhấn **Xác nhận liên kết tài khoản**.
7. Danh sách làm mới và chuyển `MaNguoiDung` sang mã khách đã được xác minh. Đơn không đủ bằng chứng được giữ nguyên.

## Kiểm tra SSMS

Mở `db/bao-cao/11-KiemTraVaDoiSoatChuDonCu.sql` và nhấn Execute. Đây là truy vấn **chỉ đọc**, gồm đơn chưa liên kết, nhật ký liên kết và số lượng đơn.

## Kiểm thử

- `cd server; npm test` – kiểm thử quyền Admin, dữ liệu đầu vào, trùng xác minh và lịch sử.
- `cd web; npm run test; npm run build` – kiểm thử frontend.
- Bài kiểm thử SQL tích hợp là tùy chọn, chỉ chạy với `DB_INTEGRATION=true` trong môi trường thử nghiệm; tự tạo một database riêng có tên ngẫu nhiên, **không dùng dữ liệu đang vận hành**.

## Giới hạn

Liên kết đơn cũ không đồng nghĩa chứng minh khách đã thanh toán thật hoặc sở hữu lượt sử dụng đã mua. Muốn cấp lượt từ giao dịch lịch sử phải có quy trình kiểm chứng thanh toán và phê duyệt bổ sung riêng, không thực hiện ngầm qua chức năng này.
