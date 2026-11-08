# Bản sửa CI/CD Dubchef

## Đã sửa
- Cấu hình Vitest tách riêng khỏi web/.env: test lưu tạm dùng môi trường demo được bật riêng cho test; không bật demo khi phát hành.
- Test QR chờ hàm async và kiểm tra đúng cấu trúc { success, alreadyScanned }.
- Test quản trị phản hồi/video khớp giao diện hiện tại: trạng thái new/reviewing/resolved, độ ưu tiên, nút Lưu xử lý, tải lại và token.
- Bổ sung hàm request đang bị thiếu trong client.js mà projectApi.js đã import: hỗ trợ token, upload tệp, JSON, blob và mã lỗi HTTP.
- Thêm test QR gọi Backend bằng HTTP giả lập: chống đếm lại trong phiên, không ghi thành công giả khi API lỗi, thử lại, token quản trị.
- CI chạy thêm test tính giá dùng chung.
- CD Web dùng npm ci theo lockfile; tự chạy khi CI của push main thành công và checkout đúng SHA đã kiểm tra. Khi CI lỗi, CD bỏ qua triển khai. Chạy tay vẫn kiểm tra lint/test/build.
- CD truyền cả VITE_PAYMENT_API_URL, VITE_PUBLIC_URL và tắt demo khi build phát hành.

## Áp dụng vào project hiện tại
Giải nén ZIP. Nếu project trên máy bạn đã có thay đổi mới, chỉ sao chép các tệp dưới đây từ CNPM-main vào đúng vị trí trong project:

1. .github/workflows/ci.yml
2. .github/workflows/cd-web.yml
3. web/vite.config.js
4. web/src/api/client.js
5. web/src/api/projectApi.test.js
6. web/src/api/qr.remote.test.js (tệp mới)
7. web/src/test/qr.test.jsx
8. web/src/test/adminServices.test.jsx

Không cần sửa docker-compose.yml, kết nối SQL Server hoặc web/.env để áp dụng bản sửa này.

Trong terminal tại thư mục gốc project:

```powershell
npm --prefix web ci
npm --prefix web run lint
npm --prefix web test
npm --prefix web run build
git add .github/workflows/ci.yml .github/workflows/cd-web.yml web/vite.config.js web/src/api/client.js web/src/api/projectApi.test.js web/src/api/qr.remote.test.js web/src/test/qr.test.jsx web/src/test/adminServices.test.jsx
git commit -m "Fix web tests and gate Pages deployment on CI"
git push origin main
```

Nếu đang làm trên nhánh khác, push nhánh đó và hợp nhất vào main theo quy trình nhóm.
Sau khi push: GitHub > Actions > CI. Khi CI thành công, lần chạy CD Web mới tự xuất hiện. Dấu đỏ của các lần chạy cũ vẫn được giữ như lịch sử.

## GitHub Pages và Backend
- Repository > Settings > Pages > Build and deployment > Source: GitHub Actions.
- Settings > Secrets and variables > Actions > Variables:
  - VITE_API_URL: địa chỉ HTTPS Backend thực sự truy cập được trên Internet.
  - VITE_PAYMENT_API_URL: nếu cùng Backend thì có thể bỏ trống; workflow tự dùng VITE_API_URL.
  - VITE_PUBLIC_URL: có thể bỏ trống để QR dùng địa chỉ web đang mở.
- Không nhập mật khẩu SQL Server hay JWT secret vào biến VITE_*.
- GitHub Pages chỉ chứa frontend tĩnh. Docker/API/SQL Server chạy trên laptop không tự được đưa lên Pages bởi workflow này. API cần được triển khai riêng, có HTTPS và CORS cho địa chỉ Pages để đăng nhập, thanh toán và lưu SQL hoạt động trên web công khai.
- /backend chỉ là proxy khi chạy npm run dev trên máy; không dùng /backend, localhost hoặc IP LAN làm Backend của Pages công khai.

## Kết quả xác minh bản sửa
- Web ESLint: thành công.
- Web Vitest: 14 tệp, 102 test thành công; không bỏ hoặc skip test lỗi.
- Web build production: thành công.
- Shared i18n + pricing và server orders: 17 test thành công.
- Đồng bộ shared: không phát sinh thay đổi.
- Cấu trúc YAML của ba workflow đọc được.
- Mobile không sửa; chưa chạy lại Mobile tại môi trường này. Lần chạy GitHub trước đó của Mobile đã thành công.
- Chưa push hay triển khai lên GitHub từ bản ZIP này. Trạng thái Actions thực tế chỉ xác nhận sau khi bạn push.

Các cảnh báo deprecated, React Router và npm audit trong log cũ không phải bước làm workflow dừng ở lần chạy đã xem. Không chạy npm audit fix --force chỉ để chữa lỗi test vì có thể nâng thư viện gây thay đổi lớn. Bản sửa này không xử lý toàn bộ lỗ hổng dependency mà npm audit đã báo.
