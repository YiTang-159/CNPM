# Dubchef thuyết minh video đa ngôn ngữ

Bản thống nhất React Web, React Native Mobile, Node Express và SQL Server. Bộ sơ đồ UC Activity DFD nằm trong `docs/so-do`; tài liệu đã cập nhật là `docs/Dubchef_FocusedUseCases.docx`.

## Chạy trên máy Windows

1. Mở Docker Desktop, mở terminal tại thư mục có `docker-compose.yml`.
2. Chạy `npm run setup:local`. Máy mới sẽ được tạo mật khẩu SQL/Admin và token ngẫu nhiên trong `.env`. Máy đã có `.env` chỉ bổ sung biến còn thiếu, không tự thay mật khẩu SQL đã lưu. **Nếu dùng dữ liệu cũ, đọc `docs/BAO_MAT_VA_CHIA_SE.md` trước.**
3. Chạy `docker compose up -d --build`.
4. Mở `http://localhost:3000/api/health`: cần `ok: true`, `db: true`.
5. Chạy `npm ci --prefix web`, sau đó `npm run web`. Mở `http://localhost:5173`.
6. SSMS kết nối `localhost,1433`, SQL Server Authentication với thông tin SQL hiện tại; chọn `DubchefDB`. Chạy `db/queries.sql` để xem tổng hợp.

Không chạy `docker compose down -v` khi muốn giữ dữ liệu. Khi cập nhật, giải nén vào thư mục mới và dùng lại `.env` cũ; không chép `node_modules` hoặc `dist` từ bản cũ.

`web/.env` dùng `/backend` qua Vite proxy đến API cổng 3000. Bảo mật mặc định chỉ công bố cổng 3000/1433 trên `127.0.0.1`; muốn truy cập từ điện thoại hoặc máy khác phải cấu hình rõ `API_BIND_ADDRESS`/`DB_BIND_ADDRESS`, CORS và Firewall theo tài liệu bảo mật. Không đổi DB_HOST hoặc port Docker để chạy Web từ điện thoại. Web production GitHub Pages phải dùng URL Backend HTTPS công khai; proxy Vite không tồn tại trên Pages.

## Mobile

Chép `mobile/.env.example` thành `mobile/.env`. Đặt `EXPO_PUBLIC_API_URL=http://IP-LAN-MAY-CHAY-DOCKER:3000`, hoặc `http://10.0.2.2:3000` cho Android emulator. Chạy `npm ci --prefix mobile`, `npm run mobile`. Điện thoại thật và máy tính phải cùng mạng; cho phép cổng 3000 qua Windows Firewall khi cần.

Mobile có lưu metadata, tệp video và kết quả vào cùng Backend SQL sau khi xử lý. Khách chỉ xử lý tạm. Nhận diện Whisper native cần bản development có `whisper.rn` và model; Expo Go có thể dùng lời thoại nhập tay. Web tự nhận diện trong Worker, không có ô nhập URL/lời thoại.

## Admin và SQL

Các trang đang dùng chung bộ API `/api/videos`, `/api/feedback`, `/api/admin/media` và bảng SQL phiên bản JSON. Không còn bộ API projects/uploads riêng. SQL lưu văn bản/mốc thời gian và metadata; video nằm trong volume `dubchef-uploads`. Giọng đọc TTS chạy trên thiết bị, chưa xuất file audio/video ghép giọng.

Admin có: tổng hợp, truy cập, tài khoản, video, thuyết minh, phụ đề, ngôn ngữ, phản hồi/liên hệ, đơn/giao dịch và QR. Các trang tải lại định kỳ; trình sửa tạm dừng làm mới khi có dữ liệu đang nhập. Nội dung có draft → reviewing → published, số phiên bản và lịch sử SQL.

Xóa tài khoản có dữ liệu liên kết bị từ chối để bảo toàn lịch sử; dùng khóa tài khoản. Ngôn ngữ ngoài vi/en/zh được lưu danh mục nhưng chưa cài bộ dịch mới. Các mã vi/en/zh được tắt sẽ không được gọi dịch trong lần xử lý tiếp theo; lời thoại gốc vẫn được giữ.

## Thanh toán mô phỏng

`PAYMENT_MODE=demo` mới cho phép thanh toán mô phỏng trong môi trường thử nghiệm; mặc định `PAYMENT_MODE=disabled` trả 503, không ghi đơn paid. Không bật mô phỏng trong môi trường thu tiền thật. Quét QR ở ứng dụng ngân hàng không tự xác minh tiền; dự án chưa tích hợp webhook ngân hàng/cổng thanh toán. QR `/guest` là QR trải nghiệm để đếm lượt mở trang, độc lập với thanh toán.

## Kiểm thử

```sh
npm ci --prefix server
npm ci --prefix web
npm ci --prefix mobile
npm test --prefix server
node --test shared/*.test.mjs
npm run lint
npm test --prefix web
npm test --prefix mobile -- --runInBand
npm run build --prefix web
npm run bundle --prefix mobile
```

SQL integration cần SQL Server phát triển. Test tạo database tên ngẫu nhiên riêng, không sử dụng DB_NAME thật; kiểm thử tất cả module Admin và dữ liệu sau khởi động lại, rồi chỉ xóa database tạm. Xem `docs/KIEM_THU.md`.

CI chạy Shared, Web, Mobile, toàn bộ Backend và job SQL Server riêng. CD Web đòi biến GitHub `VITE_API_URL` HTTPS cùng Pages GitHub Actions. CD Mobile đòi `EXPO_TOKEN`, biến `EXPO_PUBLIC_API_URL` và dự án EAS đã liên kết; gắn tag `mobile-v*` hoặc chạy tay và chờ build hoàn thành. Có YAML không đồng nghĩa một lần triển khai đã thành công.

## Bảo mật / ZIP chia sẻ

- Đọc `docs/BAO_MAT_VA_CHIA_SE.md` trước khi đổi mật khẩu SQL, triển khai public hoặc mở port cho thiết bị khác.
- Tạo ZIP mã nguồn không kèm `.env`/backup: `python scripts/package-share.py` (ZIP được đặt ngoài thư mục CNPM).

## Tài liệu

- `docs/Dubchef_FocusedUseCases.docx`: 23 Use Case, Activity, DFD ngữ cảnh/mức 1/mức 2, dữ liệu và kiến trúc.
- `docs/so-do/*.drawio`: nguồn sửa bằng diagrams.net; PNG/SVG để xem.
- `docs/so-do/DFD_Muc_2_MotTrang.drawio`: toàn bộ mức 2 trên một canvas.
- `docs/KIEM_THU.md`: checklist test Web Mobile Admin SQL.
- `docs/KET_QUA_KIEM_TRA.md`: kết quả kiểm tra và giới hạn xác minh.
- `db/README-QUAN-LY-SQL.md`: đường chạy SQL chuẩn và các file tùy chọn.
