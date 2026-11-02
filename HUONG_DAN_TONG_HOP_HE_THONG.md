# Dubchef – Bản tổ chức chức năng và báo cáo SQL (01/11/2026)

## Đã bổ sung

- Trang quản trị **Tổng hợp hệ thống**: `http://localhost:5173/admin/dashboard`.
- Admin chia menu rõ: Tổng quan → Tài khoản & giao dịch → Xử lý video → Tương tác.
- Endpoint mới **GET `/api/admin/dashboard`** (chỉ Admin) lấy tổng hợp và các bản ghi mới từ SQL Server.
- Lưu **lịch sử đăng nhập thành công** vào bảng `dbo.LichSuDangNhap`. Không lưu mật khẩu; ghi email qua khóa ngoại tài khoản.
- SQL reports chia theo nhóm dưới `db/bao-cao/`, mở độc lập trong SSMS và nhấn **F5** để hiện nhiều bảng giống ảnh tham khảo. **Chỉ hiển thị dữ liệu thật**.
- File `db/00-KIEM-TRA-CAU-TRUC.sql` kiểm tra các bảng; `db/00-CAI-DAT-KHONG-XOA.sql` tạo các bảng còn thiếu. Thứ tự đã ghép cho phù hợp.
- `db/05-sqlserver-tai-khoan.sql`: bỏ những câu lệnh tự tạo admin và tự thêm tài khoản mẫu / liên hệ / lượt QR. Đây là SQL legacy, không phải code login được Backend sử dụng.

## Cực kỳ quan trọng khi nâng cấp trên máy đã chạy Docker/SQL Server

1. **Sao lưu** dự án đang chạy và DB `DubchefDB`, đặc biệt file `.env` ở thư mục gốc. ZIP **không** đi kèm file `.env` gốc (vì chứa mật khẩu). Giữ nguyên file `.env` hiện tại của bạn.
2. Sao chép mã nguồn mới vào dự án (hoặc giải nén ZIP ra thư mục riêng rồi chuyển riêng `.env` hiện tại sang). **Không đổi** `DB_HOST=db` bên trong container và không thay port SSMS `localhost,1433`.
3. Trong SSMS kết nối `localhost,1433`, chọn database `DubchefDB`; mở `db/00-KIEM-TRA-CAU-TRUC.sql` rồi nhấn `F5`. Nếu thiếu bảng, **sau khi sao lưu dữ liệu**, mở `db/00-CAI-DAT-KHONG-XOA.sql` rồi F5. Nếu bảng cũ bị trùng tên nhưng khác cột, dừng lại để so sánh và viết migration riêng; **không xóa bảng**.
4. Trong VS Code terminal gốc dự án, cập nhật API mà không động vào container SQL:

   ```powershell
   docker compose up -d --no-deps --build api
   docker compose logs api --tail=40
   ```

   Cần thấy `SQL Server sẵn sàng.` và `API chạy ở http://localhost:3000`.
5. Mở `http://localhost:3000/api/health` → mong đợi `{"ok":true,"db":true}`.
6. Trong terminal mới chạy giao diện:

   ```powershell
   cd web
   npm ci
   npm run dev
   ```

7. Đăng nhập tài khoản Admin hiện có, vào `http://localhost:5173/admin/dashboard`. Làm mới để nhận dữ liệu mới.
8. Trong SSMS, **mở một file bất kỳ** thuộc `db/bao-cao` (ví dụ `00-TONG-HOP.sql`) nhấn **F5**. Các bảng Results hiện theo từng chức năng.

## Cách kiểm thử User → SQL → Admin

| Test | Thao tác Web User | Kết quả SQL | Chỗ xem trong Admin |
|---|---|---|---|
| Tài khoản | Đăng ký và đăng nhập thử | `dbo.NguoiDung`, `dbo.LichSuDangNhap` | Tổng hợp; Người dùng |
| Video | Đăng nhập rồi tải video ở `/demo` | `dbo.Video` | Video |
| Thuyết minh, phụ đề | Xử lý video thành công, lưu kết quả | `dbo.ThuyetMinh`, `dbo.PhuDe` | Thuyết minh; Phụ đề |
| Phản hồi | Gửi từ `/account`, hoặc khách dùng `/contact` | `dbo.PhanHoi` hoặc `dbo.LienHe` | Phản hồi |
| Đơn hàng | Tạo đơn từ `/pricing` | `dbo.DonHang` | Đơn hàng |
| QR/truy cập | Mở trang web/quét QR trải nghiệm | `dbo.LuotTruyCap`, `dbo.LuotQuetQR` | Tổng quan; QR |

**Lưu ý:** SQL không tự tạo những bản ghi chỉ vì bạn mở và chạy báo cáo. Các kết quả trong ảnh ví dụ là minh họa; báo cáo mới không tự thêm video, tài khoản, phản hồi hay đơn hàng. Trong dự án, thanh toán hiện là **mô phỏng**, không phải tiền thực đã được xác nhận. Các bản thuyết minh đang lưu văn bản và timeline, không phải audio lồng tiếng xuất sẵn.

## Những phần chưa thể xác minh ngoài máy của bạn

- Không thể chạy trực tiếp kết nối `localhost,1433` trên máy bạn từ môi trường đóng gói.
- Không thể kiểm thử toàn bộ luồng đăng ký/video/phụ đề với SQL thật hoặc build React nếu môi trường tạo ZIP thiếu thư viện npm.
- Chỉ khởi tạo bảng **mới** khi chưa tồn tại. Với database cũ trùng tên bảng nhưng khác cột cần đối chiếu migration trước khi áp dụng, không tự thay đổi dữ liệu.

Xem thêm: `db/README-QUAN-LY-SQL.md`, `HUONG_DAN_BAN_DA_CHINH_SUA.md`.
