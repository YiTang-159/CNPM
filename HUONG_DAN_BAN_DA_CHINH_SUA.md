# DUBCHEF – HƯỚNG DẪN BẢN ĐÃ CHỈNH SỬA (01/11/2026)

## 1. Phạm vi thay đổi
- GIỮ NGUYÊN các biến `VITE_API_URL`, `VITE_PAYMENT_API_URL`, `VITE_PUBLIC_URL` trong `web/.env`, thông số SQL Server trong `docker-compose.yml`, tên CSDL `DubchefDB` và tài khoản hiện có. KHÔNG dùng `docker compose down -v` (lệnh này sẽ xóa volume dữ liệu).
- SQL Server tự tạo bổ sung bảng **Video, ThuyetMinh, PhuDe, PhanHoi**; bổ sung trạng thái/trả lời vào **LienHe** khi API khởi động. Script **db/04-workflows.sql** không thực hiện DROP, TRUNCATE hoặc xóa bảng hiện có. Script có thể chạy lại.
- Thông tin đăng ký, cập nhật hồ sơ, liên hệ, đơn hàng, metadata video, thuyết minh, phụ đề, phản hồi được lưu SQL Server. **Tệp video thực tế nằm ở volume `dubchef-uploads`** và SQL Server lưu đường dẫn, không lưu tệp lớn trong cột VARBINARY. Thuyết minh lưu đoạn văn bản có mốc thời gian; âm thanh Text-to-Speech hiện vẫn phát qua trình duyệt, CHƯA tạo/lưu file âm thanh lồng tiếng thành phẩm.
- Người dùng không đăng nhập vẫn có thể trải nghiệm xử lý trong trình duyệt, nhưng phải **đăng nhập** mới lưu được video và kết quả lên SQL Server. Chỉ ghi dữ liệu khi gửi biểu mẫu hoặc xác nhận thao tác, không lưu từng phím gõ.
- Quản trị: Người dùng, Video, Ngôn ngữ, Thuyết minh, Phụ đề, Phản hồi, Đơn hàng, Mã QR, thống kê tổng quan. Admin Video tự làm mới sau 15 giây; thống kê hệ thống tự làm mới sau 20 giây. Cập nhật phản hồi thủ công để không ghi đè nội dung Admin đang soạn.
- Hai ô mật khẩu đăng ký có nút hiện/ẩn riêng biệt. Đã ẩn nút hiện mật khẩu mặc định của Edge để tránh nút trùng nhau. Có trang `/account` để sửa hồ sơ, đổi mật khẩu, xem video/đơn hàng và phản hồi.
- Thanh toán trong mã gốc là **giả lập** (không xác nhận tiền đã chuyển qua ngân hàng). Không sử dụng với tiền thật mà chưa có cổng thanh toán/webhook được xác thực.

## 2. Chạy trong VS Code – giữ kết nối Docker/SSMS
1. **Sao lưu DB**/volume hiện tại trước khi cập nhật, đặc biệt nếu trong database đã có bảng Video hoặc ThuyetMinh tùy biến từ trước. Không nhập ghi đè hay tạo DB mới thủ công khi đang có dữ liệu.
2. Giải nén ZIP vào thư mục project riêng và mở thư mục `CNPM-main` trong VS Code.
3. Mở Docker Desktop, bật Docker Engine.
4. Terminal tại thư mục gốc:
   ```powershell
   docker compose up -d --build
   docker compose ps
   ```
   (Không cần sửa URL hay cổng; lệnh tự khởi tạo bảng bổ sung qua `server/src/db.js`.)
5. Kiểm tra API bằng trình duyệt: `http://localhost:3000/api/health` → kỳ vọng `{"ok":true,"db":true}`. Nếu API báo lỗi, xem `docker compose logs api --tail=100`. Xem log SQL bằng `docker compose logs db --tail=100`.
6. Chạy web trong terminal khác:
   ```powershell
   cd web
   npm ci
   npm run dev
   ```
7. Mở `http://localhost:5173`. Đăng ký thử tài khoản, đăng nhập, vào `/demo` chọn video, xử lý, vào `/account` kiểm tra lịch sử. Mở trang `/admin` bằng tài khoản quản trị đã có, kiểm tra Video, Phụ đề, Thuyết minh, Phản hồi và Thống kê.
8. Trong SSMS, dùng kết nối hiện tại của bạn và chạy `db/06-kiem-tra-dong-bo-ssms.sql`. Nếu truy vấn không thấy dòng mới, kiểm tra cùng database **DubchefDB** (đúng container/instance) và xem thông báo lỗi API.

## 3. Lưu ý quan trọng
- Nếu Docker hiện tại chạy SQL Server host port khác `1433`, **giữ đúng cấu hình đã có trên máy bạn**; không thay đổi Docker/SSMS chỉ vì ảnh chụp trước đây hiển thị một port khác. Bản ZIP giữ nguyên file cấu hình đầu vào mà bạn cung cấp, chỉ gắn thêm volume video.
- Khi cần giữ dữ liệu cũ, tuyệt đối không chạy `docker compose down -v`. `docker compose up -d --build` giữ các volume có tên.
- Nếu một bảng SQL cùng tên đã được tạo thủ công với **cấu trúc cột khác**, script `IF OBJECT_ID ... IS NULL` sẽ không phá bảng đó. Phải so sánh cột/khóa với `db/04-workflows.sql` và điều chỉnh migration riêng thay vì sửa mù hoặc xóa dữ liệu.
- Xóa người dùng có lịch sử/quan hệ khác có thể bị từ chối để bảo vệ tính toàn vẹn; dùng chức năng **Khóa**. Video bị xóa bởi Admin sẽ xóa nội dung thuyết minh/phụ đề liên quan.
- Giới hạn video upload: 150 MB/lần. Hiện việc nhận dạng và phát TTS dùng khả năng của trình duyệt, cần máy đủ tài nguyên và mạng khi tải mô hình.
- Kiểm soát phân quyền trên API, không dựa vào email tự khai báo; người dùng phải đăng nhập để tạo/xem đơn hàng của chính mình và truy cập video/feedback riêng tư.
- Chưa chứng thực đầu cuối trên máy/SQL Server thật của bạn trong môi trường tạo file này. Hãy làm theo bước 2 để kiểm tra kết nối và xác nhận đầy đủ.

## 4. Bảng/API tham khảo
| Chức năng | API | Bảng |
|---|---|---|
| Đăng ký / đăng nhập / hồ sơ | `/api/auth/*`, `/api/me` | NguoiDung |
| Đơn hàng/thanh toán giả lập | `/api/orders*` | DonHang, GiaoDich |
| Upload / trạng thái video | `/api/videos*` | Video + Docker volume |
| Kết quả video | `/api/videos/:id/results` | ThuyetMinh, PhuDe |
| Danh mục ngôn ngữ | `/api/languages`, `/api/admin/languages*` | NgonNgu |
| Phản hồi người dùng | `/api/feedback` | PhanHoi |
| Form liên hệ | `/api/contact` | LienHe |
| Quản trị phản hồi | `/api/admin/feedback*` | PhanHoi, LienHe |
| Dashboard / Video / Đơn hàng | `/api/admin/statistics`, `/api/admin/videos`, `/api/admin/orders` | Các bảng tương ứng |
