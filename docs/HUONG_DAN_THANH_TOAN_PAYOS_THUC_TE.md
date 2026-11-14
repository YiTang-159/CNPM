# Dubchef V4 — Thanh toán QR/chuyển khoản payOS

## Cần phân biệt
- `PAYMENT_MODE=disabled`: mặc định an toàn; không thể trả tiền, đơn không được tự thành công.
- `PAYMENT_MODE=demo`: CHỈ DÙNG KIỂM THỬ. POST `/api/orders/:id/pay` có thể ghi giao dịch mô phỏng (`NguonXacNhan=demo`). **Không phải tiền thật.**
- `PAYMENT_MODE=payos`: tạo link QR/chuyển khoản payOS. Đơn được giữ `pending` đến khi nhận webhook HMAC hợp lệ, đối chiếu `orderCode`, VND và **chính xác số tiền trong SQL**. Webhook gửi lặp không trừ tiền hai lần.
- Dữ liệu cũ: `legacy_unknown`, không tự gắn nhãn giao dịch thật.

## 1. Sao lưu trước khi cài
1. Sao lưu toàn bộ thư mục `CNPM` đang chạy.
2. Sao lưu database DubchefDB trên SSMS (Back Up database); không chạy `docker compose down -v`.
3. Giải nén bản PATCH, sao chép nội dung của `CNPM` trong PATCH vào `CNPM` đang chạy. Chỉ thay các tệp trùng tên, giữ nguyên `.env` hiện có.
4. SQL migration `db/11-nguon-xac-nhan-thanh-toan.sql` được backend áp dụng an toàn khi khởi động. Migration không xóa đơn/giao dịch.

## 2. Đăng ký cổng thanh toán thật
1. Đăng ký/tạo kênh trên https://my.payos.vn, hoàn thành xác minh cần thiết và lấy `Client ID`, `API Key`, `Checksum Key` của **kênh của bạn**.
2. Triển khai API có domain HTTPS công khai (`https://api-your-domain.example`). Không thể nhận webhook từ Internet qua `localhost`.
3. Đăng ký URL webhook trên payOS: `https://api-your-domain.example/api/payments/payos/webhook` (bằng Dashboard hoặc confirm-webhook theo tài liệu payOS).
4. Trong `.env` ở thư mục `CNPM` thêm (ví dụ; các giá trị thật do bạn cấp):

```dotenv
PAYMENT_MODE=payos
PAYMENT_MODE=disabled
PAYOS_CLIENT_ID=<your-client-id>
PAYOS_API_KEY=<your-api-key>
PAYOS_CHECKSUM_KEY=<your-checksum-key>
PAYOS_RETURN_URL=https://your-website.example/#/pricing
PAYOS_CANCEL_URL=https://your-website.example/#/pricing
```

`PAYOS_RETURN_URL` và `PAYOS_CANCEL_URL` cần là HTTPS công khai. Đây chỉ là đường dẫn đưa khách về web, **không được dùng làm bằng chứng đã thanh toán**. Khách quay lại trang Bảng giá và bấm **Kiểm tra trạng thái đơn**, hoặc trang sẽ cập nhật nếu đang mở và webhook đã tới.

5. Trong `web/.env` dùng:

```dotenv
VITE_API_URL=http://localhost:3000
VITE_PAYMENT_API_URL=http://localhost:3000
VITE_ENABLE_PAYMENT_MODE=disabled
```

Khi chạy web ngoài Internet, thay địa chỉ localhost của frontend bằng HTTPS API truy cập được từ trình duyệt. Giữ nguyên các cấu hình DB Docker sẵn có.

## 3. Khởi động và kiểm tra
Tại thư mục gốc `CNPM` (Docker Desktop bật):

```powershell
docker compose up -d --build api
docker compose logs --tail=80 api
```

Trong Terminal khác:

```powershell
cd web
npm install
npm run test
npm run build
npm run dev
```

Kiểm tra `http://localhost:3000/api/payments/config` phải trả về `{"mode":"payos","methods":["qr","bank"],"supportedCurrencies":["VND"]}` nếu cấu hình hoàn tất.

## 4. Quy trình thử thật (trên môi trường thanh toán được phép)
1. Đăng nhập **khách hàng**, chọn ngôn ngữ VI (để tạo đơn tiền VND), chọn số video và bấm Thanh toán.
2. Chọn QR hoặc ngân hàng, trình duyệt nhận liên kết payOS. Đơn mới còn `pending` trong SQL.
3. Mở liên kết và thực hiện thanh toán theo hướng dẫn của payOS; **không nhập số thẻ hoặc mật khẩu ngân hàng vào Dubchef**.
4. Sau khi payOS xác nhận và webhook tới API, SQL cập nhật `DonHang.TrangThai='paid'`, thêm 1 `GiaoDich` với `NguonXacNhan='payos'`.
5. Tại trang Bảng giá bấm **Kiểm tra trạng thái đơn**; vào Admin → Đối soát thanh toán xem nguồn `payos`; chạy SSMS `db/bao-cao/09-KiemTraNguonThanhToan.sql`.
6. Gửi lại webhook hợp lệ -> không thêm giao dịch trùng; gửi webhook sai chữ ký/sai số tiền -> không chuyển `paid`.

## 5. Lưu ý và giới hạn
- Hiện payOS chỉ áp dụng cho đơn VND. Không cố chuyển giá USD/CNY sang VND mà không có báo giá và quy tắc quy đổi minh bạch.
- payOS sẽ không xác minh giao dịch nếu chưa có khóa thực, tài khoản/kênh hợp lệ và endpoint HTTPS công khai. Việc có code tích hợp **không chứng minh đã thu tiền thật**.
- `PAYMENT_MODE=demo` vẫn được giữ cho bài test cũ; chỉ bật khi cần diễn tập và nên dùng database thử nghiệm riêng.
- Nếu API không kết nối được, frontend **không tự lưu đơn paid ở localStorage** nữa (ngoại trừ bộ test tự động hoặc khi chủ dự án bật `VITE_ENABLE_PAYMENT_MODE=demo`).
- Giá dịch vụ theo tháng đang được giới thiệu trên trang Bảng giá, chưa phải thuê bao tự gia hạn. payOS ở bản này áp dụng cho đơn trả một lần.
- Hệ thống **chưa cấp/trừ quota sử dụng dịch vụ theo gói**; đây là nghiệp vụ tiếp theo cần triển khai trước khi kinh doanh thực tế.
- Không đưa `.env`, token, API key vào ZIP nộp bài/GitHub. Nếu đã lộ mật khẩu hoặc token secret, phải thay khóa.

## 6. Tài liệu payOS chính thức
- API: https://payos.vn/docs/api/
- Node.js: https://payos.vn/docs/sdks/back-end/node/
- Signature: https://payos.vn/docs/tich-hop-webhook/kiem-tra-du-lieu-voi-signature/
