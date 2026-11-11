# GitHub Pages và SQL trên laptop

Pages phục vụ React tĩnh tại https://yitang-159.github.io/CNPM/. Chưa có VITE_API_URL thì trang công khai vẫn xuất bản, nhưng đăng nhập/lưu dữ liệu/Admin SQL chưa dùng được. Không bật tài khoản local giả và không tự chuyển sang Supabase.

## Kết nối SQL Docker trên laptop để demo

1. Lấy code mới về máy bằng git pull. Giữ nguyên .env, DB_PASSWORD và các volume SQL hiện tại.
2. Mở Docker Desktop, chạy npm run setup:local nếu chưa có ADMIN_PASSWORD/TOKEN_SECRET. Kiểm tra .env có tài khoản Admin riêng; không dùng tài khoản mặc định giả trong FE.
3. Trong .env gốc, đặt CORS_ORIGIN=http://localhost:5173,http://192.168.0.109:5173,https://yitang-159.github.io. Origin của Pages chỉ là scheme và hostname, không thêm /CNPM.
4. Chạy docker compose up -d --build api. Mở http://localhost:3000/api/health phải thấy ok=true và db=true.
5. Cài cloudflared trên Windows: winget install --id Cloudflare.cloudflared --exact. Mở terminal mới sau khi cài.
6. Chạy cloudflared tunnel --url http://localhost:3000. Giữ terminal mở; dùng HTTPS trycloudflare.com mà lệnh in ra. Tunnel chỉ chuyển tiếp API 3000; không chuyển tiếp SQL 1433.
7. Mở URL tunnel thêm /api/health để xác nhận kết nối.
8. GitHub repository → Settings → Secrets and variables → Actions → Variables → New repository variable:
   - VITE_API_URL = URL HTTPS tunnel, không thêm /api/health.
   - VITE_PAYMENT_API_URL có thể để trống để dùng chung VITE_API_URL.
   - VITE_PUBLIC_URL có thể để trống; QR dùng địa chỉ website đang mở.
9. Actions → CD Web → Run workflow → main → Run workflow. Sau khi thành công, mở https://yitang-159.github.io/CNPM/ và tải lại trang.
10. Đăng ký một tài khoản test trên Pages rồi SELECT NguoiDung trong SSMS laptop. Kiểm tra User → video → Admin → phụ đề/phản hồi và SQL theo docs/KIEM_THU.md.

Laptop, Docker và terminal tunnel phải bật khi dùng chức năng SQL từ Pages. Quick Tunnel là đường demo tạm; dừng rồi mở lại sẽ đổi hostname, cần cập nhật VITE_API_URL và build Pages lại. Trang tĩnh vẫn có thể mở khi laptop tắt, nhưng API/SQL không hoạt động.

Tham khảo chính thức: https://developers.cloudflare.com/tunnel/get-started/quick-tunnels/

## Nếu lỗi

- CD Web đỏ ở cấu hình Backend: VITE_API_URL không phải URL HTTPS hợp lệ.
- /api/health tunnel lỗi: kiểm tra Docker API cổng 3000 và tunnel đang chạy.
- /api/health mở được nhưng trình duyệt báo CORS: kiểm tra CORS_ORIGIN trong .env có https://yitang-159.github.io rồi tạo lại container API bằng docker compose up -d --build api.
- SQL đăng nhập thất bại: giữ DB_PASSWORD đúng với volume cũ. Không dùng down -v để khắc phục.
- Không có biến VITE_API_URL: Pages chỉ ở chế độ xem/processing trên thiết bị; không có dữ liệu SQL giả.

