# Dubchef – Hoàn thiện chất lượng trước khi bảo vệ đồ án

## 1. Đã thay đổi trong bản này

1. **Đơn hàng–tài khoản:** API `/api/orders` sử dụng `MaNguoiDung` của người đăng nhập đã xác minh qua SQL Server để ghi đơn. Không nhận `userId` từ trình duyệt. Trả `account_unavailable` khi không tạo được đơn.
2. **Quyền giao dịch:** thanh toán chỉ cho phép chủ đơn đã liên kết theo ID. Đơn lịch sử `MaNguoiDung IS NULL` được giữ nguyên trong SQL và Admin, nhưng không hiển thị/không cho thanh toán từ tài khoản dựa trên việc đoán email.
3. **Ràng buộc SQL:** migration `db/10-an-toan-don-hang-va-nhat-ky.sql` an toàn khi chạy lại; bổ sung cột nếu thiếu, chỉ tạo khóa ngoại nếu dữ liệu hợp lệ; chặn >1 giao dịch `success`/đơn nếu lịch sử không có trùng.
4. **Nhật ký quản trị:** bảng `dbo.NhatKyQuanTri`, API `/api/admin/audit`, trang `/admin/audit`. Chỉ ghi trạng thái tài khoản/video khi thực sự thay đổi; lịch sử phụ đề/thuyết minh/phản hồi vẫn ở bảng chuyên biệt hiện có.
5. **Ngôn ngữ:** chỉ `vi`, `en`, `zh` có bộ xử lý tích hợp; thêm ngôn ngữ khác thì lưu danh mục ở trạng thái `inactive` và không cho kích hoạt khi chưa có tích hợp.
6. **Bảo mật và giao diện:** đăng nhập sai tối đa 10 lần/15 phút/IP (giới hạn trong RAM). Trang đơn hàng hiển thị mã tài khoản hoặc cảnh báo `Chưa xác minh`; phân biệt thanh toán mô phỏng và tiền thật.
7. **Kiểm tra:** có file đối soát chỉ đọc `db/bao-cao/08-KiemTraChatLuongSauNangCap.sql` và kiểm thử API.

**Không thay:** `docker-compose.yml`, cổng SQL 1433, API 3000, Web 5173, tên database `DubchefDB`, tệp `.env` cá nhân, các bản ghi cũ. KHÔNG chạy `docker compose down -v`.

## 2. Cài an toàn trên Windows + VS Code

- Sao lưu thư mục dự án hiện tại và SQL Server trước khi chép đè bản sửa.
- Với bản vá PATCH, giải nén và sao chép nguyên **đường dẫn thư mục** `server`, `web`, `db`, `docs` vào thư mục gốc `CNPM`. Giữ nguyên `.env`.
- Với bản SOURCE, đó là mã nguồn đã tích hợp, không chứa `.env`/`node_modules`/`.git`: mang `.env` của dự án cũ vào đúng vị trí, không chép các secret vào GitHub.
- Trong VS Code Terminal, từ thư mục `CNPM`:

```powershell
docker compose up -d --build
cd web
npm install
npm run dev
```

- Mở `http://localhost:5173`; sau đó vào `Admin > Nhật ký thao tác` (`/admin/audit` trong router). API khởi động sẽ chạy migration mới trên `DubchefDB` và không tự động gán đơn cũ.
- Khi thay backend, **bắt buộc** chạy lại `docker compose up -d --build`, chỉ `npm run dev` không cập nhật code backend bên trong Docker.

## 3. Chụp bằng chứng trên SSMS

Chạy file `db/bao-cao/08-KiemTraChatLuongSauNangCap.sql`. Nên có:

- `FK DonHang -> NguoiDung = CO`; `Chi 1 giao dich success/don = CO` nếu dữ liệu lịch sử không sai.
- Các đơn *mới tạo bằng tài khoản đăng nhập* có `MaNguoiDung` khác `NULL` và đúng ID của tài khoản.
- Bốn đơn cũ hiện `NULL` vẫn giữ nguyên; **không tự gán bằng email**. Muốn sửa lịch sử phải đối soát chứng cứ mua hàng thật, mã giao dịch, người tạo và có xác nhận trước khi cập nhật.
- Sau khi Admin khóa/mở user hoặc đổi trạng thái video, `dbo.NhatKyQuanTri` có dòng tương ứng.
- Một giao dịch thành công trong SQL khi `PAYMENT_DEMO=true` chỉ xác nhận **giao dịch mô phỏng**, không xác minh ngân hàng.

## 4. Kịch bản demo cho giảng viên (10–15 phút)

1. Đăng nhập tài khoản Admin, mở Tổng quan và Việc cần xử lý (dữ liệu lấy từ SQL).
2. Tạo tài khoản khách **mới**, đăng nhập, mua 1 gói nhỏ; xem đơn hàng ban đầu `pending` trong SQL.
3. Trên khách thử thanh toán mô phỏng; đơn đổi `paid`, có đúng một `GiaoDich success`. Bấm thanh toán lần thứ hai phải báo lỗi `409`.
4. Trở lại Admin > Đơn hàng: xem `MaNguoiDung` khớp đúng tài khoản đã mua; mở file SQL đối soát.
5. Đăng nhập khách thứ hai, không được xem hoặc thanh toán đơn của khách thứ nhất.
6. Tải lên video, tạo dữ liệu phụ đề, biên tập từng mốc thời gian và xuất SRT; phần thuyết minh biên tập kịch bản và nghe thử qua trình duyệt.
7. Admin duyệt nội dung, xem lịch sử phiên bản. Giải quyết một phản hồi, xem lịch sử xử lý.
8. Admin đổi trạng thái video hoặc khóa/mở khách, vào **Nhật ký thao tác** xem ai thực hiện và thời gian VN.
9. Thử thêm ngôn ngữ không được bộ xử lý hỗ trợ: mục mới chỉ ở trạng thái tạm ngưng.
10. Khởi động lại API Docker và xác nhận dữ liệu SQL vẫn còn.

## 5. Kiểm thử tự động

```powershell
# Terminal trong CNPM\server
npm install
npm test

# Terminal trong CNPM\web
npm install
npm run lint
npm test
npm run build
```

Các test SQL thực cần một SQL Server riêng và quyền tạo database thử nghiệm:

```powershell
# Trong CNPM\server. Script tự tạo và xóa DUY NHẤT DB thử tên DubchefIntegration_...
$env:DB_INTEGRATION = 'true'
$env:DB_HOST = 'localhost'
$env:DB_PORT = '1433'
$env:DB_USER = 'sa'
$env:DB_PASSWORD = Read-Host 'Mat khau SQL Server'
npm test
Remove-Item Env:\DB_INTEGRATION
```

**Chỉ chạy test tích hợp khi bạn hiểu việc tạo/xóa DB tạm và có bản backup.** Không chạy trên máy chủ sản xuất, không trỏ test này vào database dùng thật.

## 6. Sao lưu SQL Server (không xóa dữ liệu)

Trong SSMS chạy (đổi ngày/tên file khi sao lưu lần khác):

```sql
BACKUP DATABASE [DubchefDB]
TO DISK=N'/var/opt/mssql/data/DubchefDB_before_quality_update_20261112.bak'
WITH COPY_ONLY, INIT, CHECKSUM, STATS=10;

RESTORE VERIFYONLY
FROM DISK=N'/var/opt/mssql/data/DubchefDB_before_quality_update_20261112.bak'
WITH CHECKSUM;
```

Trong PowerShell tại máy Windows (đưa bản sao ra ngoài Docker volume):

```powershell
docker cp dubchef-db:/var/opt/mssql/data/DubchefDB_before_quality_update_20261112.bak .\DubchefDB_before_quality_update_20261112.bak
```

Lưu bản sao ở ổ ngoài. **VERIFYONLY kiểm tra cấu trúc backup nhưng không thay thế cho thử khôi phục thực tế**. Nếu cần thử RESTORE, khôi phục vào một DB thử riêng sau khi kiểm tra logical file names; không ghi đè `DubchefDB` đang chạy.

## 7. Việc còn thiếu để tuyên bố hệ thống sẵn sàng kinh doanh

- Kết nối cổng thanh toán thực có chữ ký callback/webhook, xác nhận tiền, idempotency webhook, xử lý hoàn tiền và đối soát ngân hàng. `PAYMENT_DEMO=true` không đủ để nhận thanh toán thật.
- Dịch máy và TTS thực tế: hiện thuyết minh mới là kịch bản lời đọc; nghe thử trong browser không phải file MP3/WAV có thể tải và đồng bộ server-side.
- Xác minh email, đổi mật khẩu qua email, quản lý phiên đăng nhập, giới hạn login phân tán nếu mở nhiều API instance, log chống chỉnh sửa, test phục hồi backup và tải video lớn.
- Kiểm thử end-to-end trên **máy của bạn** với SQL Server thật, chạy bộ test SQL integration và kiểm tra dữ liệu sau restart.

Mục tiêu 9–10 điểm là **mục tiêu phấn đấu**, không phải cam kết điểm: điểm thực tế phụ thuộc đề bài, rubric của giảng viên và kết quả demo/kiểm thử.
