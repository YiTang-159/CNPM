# DUBCHEF – Hướng dẫn sử dụng bản quản trị nghiệp vụ và SQL

> Bản chỉnh sửa dựa trên ZIP gần nhất. Không đặt lại mật khẩu, không đổi `localhost,1433`, không xóa `DubchefDB`. **Sao lưu DB trước khi nâng cấp.**

## A. Các phần đã bổ sung

| Nhóm | Trang Admin | Bảng SQL | Công việc |
|---|---|---|---|
| Tài khoản | `/admin/users` | `NguoiDung`, `LichSuDangNhap` | Xem, khóa/mở khóa, theo dõi đăng nhập |
| Video | `/admin/videos` | `Video` | Danh sách video, tình trạng, chủ sở hữu |
| Thuyết minh | `/admin/narrations` | `ThuyetMinh`, `LichSuNoiDung` | Tìm kiếm, tạo bản theo video+ngôn ngữ, biên tập từng câu/mốc thời gian, kiểm duyệt, lịch sử |
| Phụ đề | `/admin/subtitles` | `PhuDe`, `LichSuNoiDung` | Như thuyết minh nhưng quản lý phụ đề độc lập |
| Phản hồi | `/admin/feedback` | `PhanHoi`, `LienHe`, `LichSuXuLyPhanHoi` | Hàng đợi, lọc theo ưu tiên/trạng thái, phản hồi, xử lý, nhật ký |
| Đơn hàng | `/admin/orders` | `DonHang`, `GiaoDich` | Tra cứu đơn và giao dịch **mô phỏng** |
| Ngôn ngữ | `/admin/languages` | `NgonNgu` | Danh mục ngôn ngữ |
| Mã QR | `/admin/qr` | `LuotQuetQR` | Theo dõi lượt quét |
| Tổng quan | `/admin/dashboard` | Nhiều bảng | KPI, hàng chờ duyệt, phản hồi ưu tiên cao, đơn chờ |

**Lưu ý:** Trong bản này `ThuyetMinh.NoiDung` là JSON chứa **văn bản và mốc thời gian**, **chưa phải file audio**. Thêm ngôn ngữ vào bảng không tự tạo mô hình dịch/TTS. Không quảng cáo tính năng là đã có đầu ra thuyết minh giọng nói nếu chưa tích hợp công nghệ đó.

## B. Tập tin SQL: không nên chạy tất cả cùng lúc

Những file SQL có **vai trò khác nhau**, không phải file nào mở và F5 cũng trả bảng kết quả.

| File trong `db/` | Mục đích | Cách dùng |
|---|---|---|
| `01-create-database.sql` | Tạo database nếu chưa có | Chạy lần đầu |
| `02-schema.sql` | Tạo bảng gốc, index, view | Chạy lần đầu; Backend tự kiểm tra khi khởi động |
| `04-workflows.sql` | Tạo bảng Video, PhuDe, ThuyetMinh, PhanHoi, lịch sử login | Chạy sau file 02; Backend tự kiểm tra |
| `07-quan-tri-nghiep-vu.sql` | **Migration mới:** cột duyệt, phiên bản, ưu tiên, bảng audit, views | Chạy sau 04; Backend cũng tự kiểm tra khi khởi động |
| `03-admin.sql` | Tạo/cập nhật stored procedure thống kê SQL | Dành cho quản trị SQL; không phải file báo cáo |
| `05-sqlserver-tai-khoan.sql` | Tương thích quy trình đăng nhập SQL cũ | **Lưu trữ tham khảo, KHÔNG chạy để đăng ký tài khoản website hiện tại**; khác cơ chế mật khẩu scrypt của Node.js |
| `supabase-accounts.sql`, `supabase-qr.sql` | **PostgreSQL/Supabase**, không phải T-SQL | **KHÔNG chạy trong SSMS** |
| `00-CAI-DAT-KHONG-XOA.sql` | Tập hợp các lệnh tạo bảng không DROP, đã tích hợp migration 07 | Chỉ dùng sau khi backup và kiểm tra cấu trúc khi cài thủ công |
| `00-KIEM-TRA-CAU-TRUC.sql` | Liệt kê tình trạng bảng gốc | Chạy kiểm tra trước khi cài |
| `06-kiem-tra-dong-bo-ssms.sql` | Truy vấn đối chiếu dữ liệu | Chạy sau khi thao tác User/Admin |
| `bao-cao/00..06*.sql` | **Báo cáo CHỈ ĐỌC theo từng nghiệp vụ** | Mở từng file và nhấn F5 trong SSMS |
| **`BAO_CAO_TONG_HOP.sql`** | **Một file tổng hợp toàn bộ các báo cáo** | Mở một file rồi nhấn F5 để xuất nhiều bảng Results |
| `queries.sql` | Bản tổng hợp tương đương để thuận tiện thói quen cũ | F5; không tự tạo dữ liệu test |

Các file `db/data/*.json` là dữ liệu cũ/minh họa, không phải bảng SQL Server mà Backend hiện tại tự động ghi.

## C. Cập nhật vào máy Windows đang kết nối SSMS `localhost,1433`

1. **Sao lưu `DubchefDB` trên SQL Server** (SSMS > Databases > DubchefDB > Tasks > Back Up). Sao lưu `.env` tại thư mục dự án nhưng không đăng nội dung lên mạng.
2. Giải nén ZIP mới sang **thư mục khác**; chuyển các biến bí mật từ `.env` cũ sang `.env` trong thư mục mới (không lấy `.env.example` làm mật khẩu thật).
3. Cấu hình DB trong Docker giữ **`DB_HOST=db`, `DB_PORT=1433`** ở API, còn SSMS ngoài Windows dùng **`localhost,1433`**. Hai cách trỏ đến cùng SQL container nếu Docker mapping như dự án.
4. SQL mới là migration **không xóa dữ liệu**. Có thể mở `db/07-quan-tri-nghiep-vu.sql` trong SSMS, chọn `DubchefDB`, nhấn F5. Nếu đã chạy rồi thì script kiểm tra cột/bảng và không tạo lại. Nếu báo lỗi, **dừng và chụp log**, không chạy DROP/CREATE thay thế.
5. Trong thư mục gốc của bản mới chạy `docker compose up -d --build api`. API sẽ chạy 01, 02, 04, 07 để kiểm tra schema khi khởi động. Nếu vẫn dùng `docker compose up -d --no-deps --build api` thì SQL container phải đang hoạt động trước.
6. Chạy `docker compose logs api --tail=60`. Phải thấy `SQL Server sẵn sàng.` và `API chạy ở http://localhost:3000`.
7. Kiểm tra `http://localhost:3000/api/health`; sau đó trong `web`: `npm ci` và `npm run dev`; mở `http://localhost:5173`.
8. Đăng nhập Admin, mở `/admin/dashboard`.
9. **Đừng chạy** `docker compose down -v`: lệnh này có thể xóa volume dữ liệu DB và video.

## D. Quy trình thuyết minh và phụ đề

1. Khách hàng đăng nhập, tải video từ trang xử lý. Backend lưu metadata vào `dbo.Video`, tệp trong Docker volume.
2. Kết quả dịch/nhận dạng được lưu vào `ThuyetMinh`/`PhuDe` dạng JSON, kèm **bản nháp** và bản ghi lịch sử.
3. Admin mở `/admin/narrations` hoặc `/admin/subtitles`. Dùng thanh tìm kiếm, lọc trạng thái/ngôn ngữ, nhấn **Mở**.
4. Sửa từng dòng `Bắt đầu`, `Kết thúc`, `Nội dung`. Các đoạn phải có mốc thời gian tăng, không chồng lấn.
5. Lưu **Bản nháp**, sau đó chọn **Chờ duyệt**, lưu. Mở lại bản đã duyệt và chọn **Đã xuất bản**, lưu.
6. SQL tạo `PhienBan` mới và bản ghi `LichSuNoiDung` cho mỗi lần lưu. Hai Admin ghi cùng phiên bản thì người lưu sau gặp lỗi xung đột và phải tải lại.
7. Bản **đã xuất bản** không bị ghi đè nếu khách hàng xử lý lại video. Nếu Admin muốn sửa, phải chuyển thành **Bản nháp** trước.
8. Chưa có công cụ phát audio/TTS, phát hành phụ đề `.srt`, quy trình phân quyền nhiều tầng biên tập viên – kiểm duyệt viên, hay gửi email thông báo sau duyệt.

## E. Quy trình tiếp nhận phản hồi

1. User gửi ở tài khoản → bảng `PhanHoi`. Khách chưa đăng nhập gửi trang Liên hệ → bảng `LienHe`.
2. Admin mở `/admin/feedback`, lọc theo `Mới`, `Đang xử lý`, `Đã giải quyết`; ưu tiên `Thấp`, `Bình thường`, `Cao`.
3. Ghi câu trả lời, trạng thái và ưu tiên rồi nhấn **Lưu xử lý**. Chuyển **Đã giải quyết** phải có câu trả lời.
4. Backend lưu `NguoiXuLy`, `NgayCapNhat`, `NgayGiaiQuyet` trong bảng gốc và ghi thêm `LichSuXuLyPhanHoi`.
5. Với User đã đăng nhập, trang tài khoản có thể đọc lời trả lời của Admin. Với khách liên hệ không đăng nhập, câu trả lời hiện mới lưu nội bộ; **chưa có hệ thống gửi email**.

## F. Kiểm tra trực tiếp trong SSMS

Mở `db/BAO_CAO_TONG_HOP.sql` → F5. Các phần cần đặc biệt chú ý:

- `NguoiDung`: khách mới; `LichSuDangNhap`: các lượt login thành công.
- `Video`: ai tải, khi nào, trạng thái.
- `ThuyetMinh`/`PhuDe`: dữ liệu JSON; file `bao-cao/02` còn bóc tách mỗi dòng theo mốc giây bằng `OPENJSON`.
- `vw_QuanTriNoiDung` và `LichSuNoiDung`: trạng thái kiểm duyệt, phiên bản, người sửa.
- `vw_QuanTriPhanHoi` và `LichSuXuLyPhanHoi`: hàng đợi và lịch sử trả lời.
- `DonHang`/`GiaoDich`: giao dịch mô phỏng, **không** phải tiền thật.

Để xem nhanh dữ liệu sau khi tương tác:

```sql
USE DubchefDB;
GO
SELECT TOP(20) * FROM dbo.vw_QuanTriNoiDung ORDER BY NgayCapNhat DESC;
SELECT TOP(20) * FROM dbo.LichSuNoiDung ORDER BY MaLichSu DESC;
SELECT TOP(20) * FROM dbo.vw_QuanTriPhanHoi ORDER BY NgayTao DESC;
SELECT TOP(20) * FROM dbo.LichSuXuLyPhanHoi ORDER BY MaLichSu DESC;
```

## G. Điều kiện **chưa đủ để bán chính thức**

Bản chỉnh sửa là một bước tiến tới sản phẩm, **không thể khẳng định đạt chuẩn thương mại chỉ bằng kiểm tra cú pháp/unit test**. Trước khi cung cấp khách hàng thật cần tối thiểu:

- Tích hợp, kiểm chứng cổng thanh toán thật; hiện code chỉ mô phỏng thanh toán, không xác nhận chuyển khoản thật.
- Tích hợp dịch/nhận dạng/TTS tin cậy, hàng đợi job dài, retry và lưu đầu ra video/audio; hiện phần `ThuyetMinh` là JSON văn bản.
- Bảo mật: không dùng mật khẩu Admin mặc định, thiết lập bí mật mạnh; HTTPS, reverse proxy, rate limiting, kiểm toán phân quyền, quét lỗ hổng, chính sách lưu token/cookie.
- Vận hành: sao lưu **và khôi phục thử** SQL + tệp video; lưu trữ đối tượng, giám sát, alert, log, CI/CD, stress test tải lớn.
- Pháp lý và dữ liệu cá nhân: chính sách quyền riêng tư, điều khoản sử dụng, quyền xử lý file khách tải lên, xóa/xuất dữ liệu, thời hạn lưu trữ, thông báo sự cố.
- Kiểm thử tích hợp trên **Docker+SQL Server thật**, E2E User/Admin, kiểm thử bảo mật, khả năng sử dụng và khả năng mở rộng. Các hạng mục này chưa được xác thực trong môi trường tạo ZIP.
