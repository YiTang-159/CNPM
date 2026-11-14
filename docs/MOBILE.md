# Dubchef trên điện thoại — hướng dẫn & giới hạn xác minh

**Trạng thái:** Đã thêm cấu hình LAN, PWA và metadata Expo trong mã nguồn. **CHƯA chạy trên iPhone/Android thật**, chưa có URL HTTPS staging, chưa có video bằng chứng. Không coi file này là giấy chứng nhận hoạt động.

## A. Cùng Wi-Fi riêng — không cần mở API hoặc SQL

Điện thoại và laptop cùng Wi-Fi riêng ở chế độ **Private**. Dùng PowerShell trong thư mục `CNPM`:

```powershell
# Chỉ chạy khi Docker Engine đang hoạt động và bạn đã sao lưu DB riêng.
npm run lan
# Nếu Firewall chặn, mở PowerShell với quyền Administrator và chỉ mở đúng cổng web
powershell -ExecutionPolicy Bypass -File scripts/lan-firewall.ps1
# Gỡ quy tắc firewall khi demo xong
powershell -ExecutionPolicy Bypass -File scripts/lan-firewall.ps1 -Remove
```

`npm run lan` chỉ đổi bind của web sang `0.0.0.0:5173`. Hai biến API và SQL vẫn `127.0.0.1:3000` và `127.0.0.1:1433`. Nginx chuyển `/backend/...` đến API qua mạng Docker, vì thế điện thoại không cần gọi trực tiếp cổng 3000. Script in URL dạng `http://IP-LAN:5173/#/guest` và thử in QR terminal (cần `python -m pip install qrcode`, chỉ bổ sung nếu muốn QR). Nếu có nhiều card Wi-Fi/VPN, xác nhận IP bằng `ipconfig` và dùng IP của Wi-Fi thực.

**Không dùng LAN trên Wi-Fi công cộng.** Trình duyệt iOS có thể hạn chế một số Web API ở HTTP; chế độ này chỉ dùng demo nội bộ. Nếu web không vào được, kiểm tra Windows Firewall và mạng Wi-Fi có bật AP/client isolation không. Nếu cần mã QR trên trang chủ với URL public, dùng HTTPS ở cách B, không dùng localhost.

## B. HTTPS public cho giảng viên ở xa

Không có tài khoản hosting/tên miền/secret nên **chưa có link public**. Để xem thử từ xa, có thể mở Cloudflare Tunnel vào **web** chứ không đưa 1433/3000 ra Internet:

```powershell
cloudflared tunnel --url http://localhost:5173
```

Dùng tên miền HTTPS mà Tunnel trả về. Với URL cố định/staging, đặt URL HTTPS tại `VITE_PUBLIC_BASE_URL` của build web; dùng proxy `/backend` cho API; webhook payOS (nếu được triển khai thật) phải trỏ tới endpoint HTTPS chính xác. Khi muốn QR trỏ tới một domain mới, **rebuild frontend** để cập nhật biến Vite; không giả định biến được cập nhật động. Không bật `PAYMENT_MODE=demo` trên staging public dùng để xử lý tiền; chỉ trình diễn không thu tiền, kiểm soát truy cập riêng hoặc dùng môi trường thử nghiệm riêng. Bảo vệ tài khoản Admin, rate limit, sao lưu riêng và HTTPS bắt buộc.

## C. Expo Go / APK

```powershell
cd mobile
# Tạo file .env cục bộ (đã ignore); dùng HTTPS public URL API, ví dụ https://<staging>/backend
# EXPO_PUBLIC_API_URL=https://<staging>/backend
npm ci
npx expo start
# Đăng nhập đúng tài khoản Expo/EAS của chủ dự án trước khi build
npx eas-cli login
npx eas-cli init
npx eas-cli build -p android --profile preview
```

`mobile/app.json` không còn `owner`/`projectId` của tài khoản EAS cũ; cần `eas init` cho workspace thực. Không commit debug.keystore. APK release phải dùng HTTPS; HTTP LAN chỉ cho mục đích phát triển, không phải phát hành. App hiện có năm màn hình Home, Demo, Pricing, Account, Info; không tương đương mọi tác vụ Admin trên web. Giá trên màn hình Pricing đã chuyển sang `GET /api/pricing` và tự làm mới khi app active; các màn hình khác cần kiểm thử thực tế.

## PWA và tính năng web mobile

Web có viewport `viewport-fit=cover`, manifest/icon, service worker chỉ lưu giao diện tĩnh (KHÔNG cache `/backend`, API, giá, người dùng, thanh toán), thanh tab dưới và nút ngôn ngữ trên header mobile, `playsInline` cho video, safe-area. Chrome Android: menu **Add to Home screen**; iOS Safari: **Share → Add to Home Screen**. **Chưa kiểm chứng install trên thiết bị thật**.

Nút **Thử với video mẫu** dùng video đồ họa/3 bản dịch soạn trước, không gọi Whisper/Ollama, không trừ lượt và không giả là kết quả AI thật. Giọng mẫu phát qua SpeechSynthesis nếu điện thoại có giọng tương ứng; không đảm bảo mọi thiết bị có giọng Việt/Trung. Upload/Whisper thật, MP3/MP4 iOS, nền tảng thanh toán ngân hàng và mạng chập chờn vẫn cần chạy test thiết bị.

## Bảng nghiệm thu thiết bị

| Thiết bị | Safari/Chrome | Mở web | Đăng nhập | Dịch AI | MP3/MP4 | Demo payment | Admin giá | Ghi chú |
|---|---|---|---|---|---|---|---|---|
| iPhone thực | Safari | CHƯA XÁC MINH | CHƯA | CHƯA | CHƯA | CHƯA | CHƯA | Chưa có thiết bị kết nối |
| Android thực | Chrome | CHƯA XÁC MINH | CHƯA | CHƯA | CHƯA | CHƯA | CHƯA | Chưa có thiết bị kết nối |
| Playwright Pixel/iPhone | Chromium/WebKit | CHƯA CHẠY | CHƯA | CHƯA | CHƯA | CHƯA | CHƯA | Cần browser và SQL test |

Lưu screenshot/video có ghi rõ thiết bị và browser dưới `docs/evidence/mobile/` sau khi tự chạy; **không thêm bằng chứng mô phỏng**.

## Kiểm thử tự động đề xuất (chưa chạy)

```powershell
# Chạy trên Docker/SQL test riêng; không dùng dữ liệu thật.
npm install --no-save @playwright/test
npx playwright install chromium webkit
$env:DUBCHEF_E2E_BASE_URL='http://127.0.0.1:5173'
npx playwright test tests/e2e/ui-crawler.spec.mjs tests/e2e/mobile-layout.spec.mjs
# Giá: chỉ trên database riêng, phải có tài khoản Admin/Customer riêng và thông tin đăng nhập.
$env:DUBCHEF_E2E_ISOLATED='1'
npx playwright test tests/e2e/pricing-live.spec.mjs
```

Các lệnh ở trên là **hướng dẫn**, không phải bằng chứng lệnh đã chạy. Các thông tin tài khoản đi qua biến môi trường cục bộ, không commit. Nên chụp video/screenshot thiết bị thật sau khi chạy để bổ sung `docs/evidence/mobile/`.
