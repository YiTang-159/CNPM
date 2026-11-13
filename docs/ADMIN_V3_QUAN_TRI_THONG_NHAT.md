# DUBCHEF — ADMIN V3 (chuẩn hóa phân bổ nghiệp vụ)

## Mục đích

Bản này phát triển từ **Dubchef_NangCap_ChatLuong_SOURCE_20261112**. Cấu trúc Admin trước đó có một số điểm gây khó hiểu: quản lý đơn hàng lẫn thanh toán, không có nơi xem chính sách giá từ góc nhìn Admin, và phải tự gõ lại email/video khi đi qua nhiều trang quản trị.

Bản V3 tổ chức lại thành 5 nhóm và 14 mục:

1. **Điều hành:** Tổng quan; Việc cần xử lý.
2. **Khách hàng:** Người dùng; Phản hồi & hỗ trợ.
3. **Kinh doanh:** Gói dịch vụ & bảng giá; Đơn hàng; Đối soát thanh toán.
4. **Sản xuất nội dung:** Video; Phụ đề; Thuyết minh; Ngôn ngữ.
5. **Báo cáo & hệ thống:** Thống kê truy cập; Báo cáo lượt quét QR; Nhật ký quản trị.

Menu Ctrl+K và tiêu đề trang dùng chung danh sách trong `web/src/components/AdminNavigation.js`. Các đường dẫn cũ `/admin`, `/admin/dashboard`, `/admin/orders`, `/admin/videos`, v.v. vẫn hoạt động.

## Cải tiến có thật trong code

- **Trang Người dùng:** thêm bộ lọc trạng thái và nút `Hồ sơ`. Từ hồ sơ có thể mở danh sách Đơn hàng, Video, Phản hồi theo email khách. Khóa/mở tài khoản và xóa vẫn dùng API cũ.
- **Trang Đơn hàng:** tập trung tra cứu, trạng thái và liên kết khách hàng; nút `Chi tiết` hiển thị bản ghi và mở được đối soát của đúng mã đơn. **Không cập nhật thanh toán ở đây.**
- **Trang Đối soát thanh toán:** mới, đọc dữ liệu từ `/api/admin/orders`, phân loại đơn chờ, đơn đã hủy, đơn `paid` thiếu mã tham chiếu và đơn `paid` chưa liên kết ID khách. Trang này **chỉ đọc**, không xác minh ngân hàng, không sửa trạng thái giao dịch.
- **Trang Gói dịch vụ & bảng giá:** mới, hiển thị đơn giá và gói mẫu từ cùng công thức `shared/pricing.js` mà backend sử dụng; bảng giá định kỳ từ `shared/i18n.js`. Đây là **màn hình kiểm tra chính sách giá**, hiện **không có CRUD giá** trong SQL Server. Thay đổi giá vẫn cần chỉnh mã nguồn và triển khai đồng bộ.
- **Trang Video:** tìm nhanh theo email/mã video từ liên kết trang khác; thêm khu vực liên kết sang khách hàng, phụ đề và thuyết minh cho cùng video.
- **Trang Phụ đề/Thuyết minh:** liên kết ngược về video và hồ sơ khách hàng; tiếp tục giữ editor chuyên biệt đã triển khai ở bản trước.
- **Trang Phản hồi:** nhận liên kết lọc theo email; nếu phản hồi gắn video, có thể vào video đó. Quy trình trả lời và lịch sử xử lý giữ nguyên.
- **Tổng quan:** thêm điều hướng tuần tự theo quy trình khách hàng → giá → đơn hàng → đối soát → video/nội dung.
- **Các trang lọc sâu:** có dải hiển thị điều kiện từ trang trước và nút `Xem toàn bộ danh sách` để tránh hiểu nhầm danh sách thiếu bản ghi.
- **Việc cần xử lý:** mở đúng đơn hoặc video cụ thể, thay vì chỉ chuyển đến bảng tổng chung.

## Không thay đổi

- Đăng ký, đăng nhập User/Admin và xác minh phân quyền API.
- Backend `server/`, SQL `db/`, `docker-compose.yml`, file giá `shared/`.
- Cấu hình `.env`, thông tin kết nối SQL Server, volume Docker và dữ liệu đang lưu.
- Các thao tác quản lý người dùng, video, nội dung, phản hồi đã có; thanh toán mô phỏng vẫn là mô phỏng.

**Không sử dụng `docker compose down -v`:** lệnh này có thể xóa volume chứa dữ liệu SQL Server.

## Cài bản vá trên Windows

1. **Sao lưu** thư mục `CNPM` hiện tại trước.
2. Giải nén `Dubchef_Admin_V3_PATCH.zip`. Mở thư mục `CNPM` bên trong file ZIP, sao chép các thư mục `web`, `scripts`, `docs` vào `CNPM` đang chạy và chọn thay thế **chỉ những tệp trùng tên**.
3. Giữ nguyên file `.env` ở gốc và trong `web/` (bản vá không mang theo file `.env`).
4. Mở VS Code tại `CNPM`, chạy:

```powershell
# Nếu Docker và API đã đang chạy, chỉ cần frontend:
cd web
npm install
npm run dev
```

Nếu cần khởi động lại API sau khi đã sao lưu:

```powershell
# Tại thư mục CNPM
 docker compose up -d --build
```

5. Mở **`http://localhost:5173/#/admin/dashboard`** (ứng dụng hiện dùng HashRouter) rồi đăng nhập Admin như trước.

## Kiểm tra nhanh (trước khi trình bày)

1. **Menu:** Admin có 5 nhóm/14 mục; `Ctrl+K` tìm được chức năng mới.
2. **Khách hàng → Đơn hàng:** tại `/admin/users`, chọn Hồ sơ → Đơn hàng. Bảng phải lọc đúng email. Chọn `Xem toàn bộ danh sách` để xóa lọc.
3. **Đơn → Đối soát:** mở chi tiết đơn, bấm Đối soát. Trang Đối soát phải hiện mã đơn được chọn, tham chiếu giao dịch hoặc lý do cần rà soát.
4. **Khách hàng → Video:** chọn Video từ hồ sơ, chọn một video và bấm Liên kết để đi đến phụ đề/thuyết minh của video.
5. **Phản hồi:** mở yêu cầu gắn video (nếu có), bấm mở Video liên quan.
6. **Giá:** vào Gói dịch vụ & bảng giá, đổi VND/USD/CNY, kiểm tra gói mẫu tương ứng trang khách hàng. Không có nút sửa giá.
7. **Quyền:** đăng xuất Admin, đăng nhập khách hàng thường. Các trang `/admin/*` phải bị chặn; không nhầm việc thấy trang Bảng giá công khai với quyền quản trị.
8. **SQL:** tạo một đơn qua luồng khách hàng nếu cần, sau đó kiểm tra `MaNguoiDung`, `GiaoDich` và các bảng hiện có bằng truy vấn chỉ đọc.

## Kiểm tra tự động

Ở thư mục `CNPM`:

```powershell
node scripts/check-admin-workflow.mjs
npm run test:shared
npm --prefix server test
npm --prefix web run lint
npm --prefix web test
npm --prefix web run build
```

Trong môi trường tạo bản V3, đã kiểm tra cú pháp JavaScript/JSX, 22 kiểm thử shared, 9 kiểm thử backend độc lập và các ràng buộc điều hướng mới. **Chưa xác nhận** kết nối SQL Server trên máy bạn, build web và toàn bộ test frontend; việc cài các package npm bị giới hạn trong môi trường kiểm tra.

## Hạn chế còn lại

- Bảng giá chưa quản lý CRUD trong SQL. Muốn Admin thực sự chỉnh giá và mọi kênh có hiệu lực đồng bộ phải xây dựng bảng SQL/endpoint có kiểm duyệt, phiên bản và kiểm thử tính tiền.
- Đối soát hiện chỉ so sánh dữ liệu ghi nhận ở hệ thống, chưa xác minh giao dịch ngân hàng hay thanh toán thực.
- Không tự động xác nhận MP3 thuyết minh hoặc các tính năng xử lý âm thanh chưa được triển khai backend.
- Danh sách API vẫn giới hạn số bản ghi; lọc ở frontend chỉ trong phạm vi dữ liệu được API trả về (thường tối đa 500 gần nhất).

Đây là bản nâng cấp **phân bổ chức năng và trải nghiệm quản trị**, không phải cam kết đã hoàn thành tất cả chức năng doanh nghiệp.
