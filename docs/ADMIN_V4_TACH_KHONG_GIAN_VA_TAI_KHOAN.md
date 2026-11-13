# Dubchef Admin V4 — tách rõ Admin và website công khai

## Thay đổi đã thực hiện

- Giữ **đăng nhập Admin từ SQL Server**, tiếp tục điều hướng sau đăng nhập vào `#/admin/dashboard` (logic đã có từ V3).
- Khu vực `#/admin/...` sử dụng **AdminLayout** và sidebar nghiệp vụ riêng; **không dùng** Header/Footer công khai.
- Khi Admin chủ động mở website công khai (`#/` hoặc các trang khác) sẽ thấy nhãn **Chế độ xem website công khai**, nút nổi bật **Về trang quản trị** và lời nhắc đây là website dành cho khách hàng. Menu khách hàng không hiển thị trong header ở chế độ Admin xem trước.
- Menu tài khoản Admin ở góc phải: **Hồ sơ & bảo mật**, **Xem website công khai**, **Đăng xuất**. Bấm ra ngoài hoặc Esc để đóng.
- Trang mới `#/admin/profile`: cập nhật tên hiển thị, đổi mật khẩu bằng API `/api/me` và `/api/me/password` đã có. Không thay đổi email/role.
- Khi Admin xem Bảng giá công khai, chức năng mua hàng được thay bằng liên kết **Quản lý chính sách giá**.
- Backend `/api/orders` và `/api/orders/:id/pay` chỉ cho vai trò `user` dùng. Admin không thể tạo đơn/mua gói/chạy thanh toán mô phỏng qua API. Backend vẫn kiểm tra token và vai trò từ SQL Server.

## Cách cập nhật bản đang chạy

1. **Sao lưu** dự án CNPM đang chạy. Nếu có thay đổi thủ công ở các tệp trong bản vá, dùng công cụ so sánh file trước khi ghi đè.
2. Tải **Dubchef_Admin_V4_BanVa.zip** và giải nén. Sao chép **nội dung thư mục `CNPM/` bên trong ZIP** vào thư mục `CNPM/` hiện tại; chọn thay thế các tệp trùng tên.
3. **Không xóa** `db`, **không đổi** `.env`, `docker-compose.yml` và **không chạy** `docker compose down -v`.
4. Từ terminal VS Code tại thư mục dự án `CNPM`:

   ```powershell
   docker compose up -d --build
   cd web
   npm run dev
   ```

   Nếu Vite đã chạy, bấm `Ctrl+C` trước. Nếu thư viện chưa cài, chạy `npm install` trong `web` trước `npm run dev`.
5. Trên trình duyệt mở `http://localhost:5173/#/login` và nhấn **Ctrl+Shift+R** để tải lại.

## Kiểm thử trên Windows

1. Đăng nhập Admin: tự chuyển tới `#/admin/dashboard`, thấy menu quản trị, **không có** menu Tính năng / Trải nghiệm / Bảng giá trong thanh quản trị.
2. Bấm **Xem website**: sang `#/`, có nhãn chế độ xem trước và **Về trang quản trị**. Bấm quay lại và xác nhận hoạt động.
3. Bấm biểu tượng tài khoản: xem thông tin Admin, vào **Hồ sơ & bảo mật**. Lưu tên và đổi mật khẩu để kiểm tra dữ liệu SQL. Khi đổi mật khẩu thật, cần nhớ mật khẩu mới.
4. Vào `#/pricing` khi còn đăng nhập Admin: không có nút tạo đơn/thanh toán, có lối về trang quản lý giá.
5. Đăng xuất → vào tài khoản khách hàng: menu Tính năng, Trải nghiệm, Bảng giá vẫn đầy đủ, đặt hàng thử theo luồng thanh toán mô phỏng nếu `PAYMENT_DEMO=true`.
6. Kiểm tra không đăng nhập và khách hàng không vào được API quản trị. Admin gọi API tạo đơn phải nhận `403 Forbidden`.

**Kiểm tra tự động:**

```powershell
cd server
npm test
cd ..\web
npm install
npm run lint
npm run test -- src/test/adminRoleNavigation.test.jsx
npm run build
```

**Phạm vi kiểm thử đã thực hiện tại đây:** backend 31 kiểm thử thành công, 1 SQL integration bị bỏ qua do không có SQL Server; kiểm tra cú pháp JS/JSX và ESLint thành công. Build và test Vite/Vitest chưa chạy trọn vẹn tại đây vì thiếu gói Rollup Linux trong phụ thuộc đã có sẵn. Bạn cần chạy lại trên Windows để xác nhận giao diện và kết nối API.

## Những thứ KHÔNG bị xóa hay sửa cấu hình

- Không xóa trang Features, Demo, Pricing, About, Contact, Footer; đây là các trang công khai dành cho khách hàng.
- Không sửa `.env`, `docker-compose.yml`, `db/*.sql`, mạch đăng nhập SQL, dữ liệu đã lưu, hoặc định tuyến quản trị hiện có.
- Không cài thêm thư viện mới; giao diện dùng React/React Router đã có trong dự án.
- Không bổ sung thanh toán ngân hàng thật; thanh toán mô phỏng vẫn là mô phỏng.
