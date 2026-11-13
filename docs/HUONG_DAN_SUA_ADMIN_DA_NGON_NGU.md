# Dubchef V4 — Sửa chuyển đổi ngôn ngữ Admin (VI / EN / 中文)

## Phạm vi chỉnh sửa

- Chuyển tất cả nhãn giao diện đã rà soát của 21 trang/thành phần Admin sang bộ từ điển chung `web/src/shared/i18n.js`.
- Bổ sung `web/src/components/AdminTranslation.jsx` để các trang cập nhật văn bản ngay khi chuyển VI / EN / 中文.
- Chuẩn hóa tên menu/sidebar, tìm kiếm nhanh, breadcrumb, nhãn trạng thái, bộ lọc, nút bấm, thông báo và các bảng dữ liệu của Admin.
- Chuyển tên gói dịch vụ theo ngôn ngữ giao diện; lựa chọn VND/USD/CNY chỉ làm thay đổi số tiền hiển thị, không đổi ngôn ngữ.
- Giữ nguyên mã trạng thái gốc gửi API (`paid`, `draft`, `active`...), tên/email khách, tiêu đề video và dữ liệu từ SQL Server.
- Tên hiển thị từ người dùng và nội dung do khách nhập không tự động dịch.

## Cài đặt trên dự án đang chạy

1. **Sao lưu** toàn bộ thư mục `CNPM` hiện tại.
2. Giải nén `Dubchef_V4_ADMIN_DA_NGON_NGU_PATCH.zip`.
3. Sao chép thư mục `CNPM/web/src` trong bản vá vào `CNPM/web/src` trên máy; chỉ thay thế các file trùng tên.
4. **Không xóa hay chép đè** `.env`, `server`, `db` hay `docker-compose.yml`.
5. Mở VS Code ở thư mục gốc `CNPM`. Trong Terminal:

   ```powershell
   cd web
   npm run dev
   ```

   Nếu frontend đang chạy, nhấn `Ctrl+C` rồi chạy lại. Trên trình duyệt dùng `Ctrl+Shift+R`.

## Tự kiểm tra trên Windows

Nếu chưa cài thư viện frontend trong thư mục `web`, chạy `npm install`.

```powershell
cd web
npm run test -- src/test/adminI18n.test.jsx
npm run build
```

Đăng nhập Admin, thử chuyển **VI → EN → 中文 → VI** tại: Tổng quan, Người dùng, Phản hồi, Đơn hàng, Đối soát thanh toán, Gói dịch vụ, Video, Phụ đề, Thuyết minh, Ngôn ngữ, Nhật ký.

Kỳ vọng: Tiêu đề, menu, nút bấm, trạng thái và nhãn trong bảng đổi ngôn ngữ **ngay trên trang**, nhưng email, nội dung khách nhập và mã trạng thái dùng để lưu SQL không thay đổi. Trở lại trang khác thì ngôn ngữ đã chọn được ghi nhớ.

## Ghi chú giới hạn

- Bản sửa chỉ xử lý **ngôn ngữ giao diện Admin**, không bổ sung ngôn ngữ dịch giọng nói/video ở backend.
- Nội dung trả về từ API không biết trước hoặc thông báo lỗi từ dịch vụ ngoài có thể vẫn hiển thị theo ngôn ngữ nguyên bản.
- Môi trường tạo bản vá đã kiểm tra cú pháp và thử render React ba ngôn ngữ, **chưa chạy được toàn bộ bài test Vite/Vitest và quy trình kết nối SQL Server trên máy Windows của bạn**.

## Xử lý khi gặp trang trắng

Mở trình duyệt → F12 → tab **Console** → chụp lỗi màu đỏ. Không xóa SQL hay Docker volume để chữa lỗi giao diện.
