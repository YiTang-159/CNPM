# Kiểm thử toàn bộ Dubchef

## Chuẩn bị

- Giải nén thư mục mới, dùng lại `.env` SQL hiện tại. Chạy `npm run setup:local` để thêm Admin/token còn thiếu; không đổi mật khẩu sa của volume cũ.
- `docker compose up -d --build`; `http://localhost:3000/api/health` phải trả `ok=true, db=true`.
- `npm ci --prefix web`, `npm run web`; mở `http://localhost:5173`.
- Mở SSMS `localhost,1433`, chọn DubchefDB. Chạy `db/queries.sql` hoặc câu SELECT theo từng chức năng. Không chạy các file Supabase trong SSMS.
- Cửa sổ A dùng tài khoản thành viên mới; cửa sổ ẩn danh B dùng Admin, thông tin trong `.env`.

## Checklist theo chức năng

| Bước | Thao tác | Kết quả cần thấy | Đối chiếu SQL |
|---|---|---|---|
| 1 | Đăng ký email mới; thử đăng ký lại email đó | Lần đầu thành công, lần sau báo trùng | NguoiDung đúng một dòng, mật khẩu băm |
| 2 | Đăng nhập sai rồi đúng | Sai bị từ chối; đúng có phiên | LichSuDangNhap ghi lần thành công |
| 3 | Tài khoản Web đổi họ tên | Tên hiện mới sau tải lại | NguoiDung.HoTen thay đổi |
| 4 | Đổi mật khẩu bằng mật khẩu cũ; đăng xuất và thử đăng nhập | Mật khẩu mới dùng được, cũ bị từ chối | MatKhauBam thay đổi, không có mật khẩu gốc |
| 5 | Khách chọn MP4 ngắn và xử lý | Phát kết quả tạm, thông báo cần đăng nhập để lưu | Không tạo video cho khách |
| 6 | Thành viên chọn MP4 ngắn và xử lý | Metadata và tệp lưu, kết quả lưu sau xử lý | Video + PhuDe + ThuyetMinh + LichSuNoiDung |
| 7 | Bật dịch Việt Anh Trung rồi xử lý | Chỉ dịch các mã hỗ trợ đang bật, vẫn giữ lời thoại nguồn | Nội dung JSON có text/start/end |
| 8 | Đổi giọng, tốc độ, phụ đề, vị trí video | Phát lại đồng bộ; thiếu giọng thiết bị được nhận biết | Không yêu cầu file TTS trong SQL |
| 9 | Tài khoản Web mở Xem kết quả; tải tệp gốc | Xem lại nội dung từ SQL và tệp đã lưu | Video.DuongDan tồn tại trong volume |
| 10 | Admin mở Người dùng, tìm và khóa thành viên | Trạng thái đổi; token cũ bị chặn request tiếp | NguoiDung.TrangThai=locked |
| 11 | Admin mở khóa; thử xóa tài khoản có video/đơn | Mở khóa được; xóa có dữ liệu bị từ chối | Dữ liệu liên kết vẫn còn |
| 12 | Admin mở Video, xem video, đổi trạng thái | Video mở được; trạng thái lưu sau tải lại | Video.TrangThai cập nhật |
| 13 | Admin mở thuyết minh/phụ đề, sửa câu hoặc mốc | Mốc sai/chồng lấn bị chặn; dữ liệu đúng lưu được | NoiDung, PhienBan, NguoiSua và lịch sử thay đổi |
| 14 | Thử xuất bản từ nháp; sau đó chờ duyệt rồi xuất bản | Nháp→published bị từ chối; reviewing→published không sửa nội dung được phép | TrangThaiDuyet và lịch sử đúng |
| 15 | Hai cửa sổ Admin cùng mở một bản; A lưu rồi B lưu | B bị báo phiên bản cũ; không đè dữ liệu A | PhienBan tăng đúng một lần mỗi lưu |
| 16 | Tắt en trong Ngôn ngữ; xử lý mới với nguồn vi | Không gọi dịch sang en; bản cũ vẫn được giữ | NgonNgu.en=inactive; bật lại sau test |
| 17 | Thành viên gửi phản hồi cho video của mình | Admin thấy phản hồi nguồn user | PhanHoi đúng MaNguoiDung/MaVideo |
| 18 | Khách gửi liên hệ | Admin thấy nguồn contact; không ghép thành lịch sử thành viên theo email | LienHe có dòng mới |
| 19 | Admin trả lời, đặt ưu tiên và đã giải quyết | Thiếu trả lời bị chặn; lưu đúng thì thành viên thấy trả lời riêng | PhanHoi/LienHe và LichSuXuLyPhanHoi |
| 20 | Thành viên B xem danh sách video/đơn/phản hồi | Không đọc được dữ liệu riêng của A | API lọc tài khoản hiện tại |
| 21 | Tạo đơn số video hợp lệ | Giá do server tính, trạng thái pending | DonHang có đơn mới |
| 22 | Bật PAYMENT_DEMO=true, xác nhận thanh toán mô phỏng | Một giao dịch success, đơn paid; lần trả lại không tạo giao dịch mới | DonHang và GiaoDich |
| 23 | Đặt PAYMENT_DEMO=false rồi dựng lại API | Xác nhận mô phỏng trả 503, không đổi pending thành paid | Không có giao dịch success mới |
| 24 | Mở liên kết QR /guest từ thiết bị khác | Thống kê QR tăng; không tự đổi trạng thái thanh toán | LuotQuetQR; tách biệt DonHang |
| 25 | Mở Tổng hợp, Tổng quan, QR, Đơn hàng | Dữ liệu SQL phù hợp; tiền tách loại tiền; ngày hiển thị Việt Nam | queries.sql và các bảng tương ứng |
| 26 | Nhập nội dung đang sửa, chờ hơn 15 giây | Không mất nội dung chưa lưu do tự tải lại | Không có lịch sử mới trước khi bấm Lưu |
| 27 | Khởi động lại API bằng docker compose restart api | Dữ liệu video/nội dung/đơn còn nguyên; token ổn định nếu giữ TOKEN_SECRET | Các dòng dữ liệu không mất |
| 28 | Xóa một video test bằng Admin | Mất video và phụ đề/thuyết minh liên quan; tệp gốc được dọn | Video/PhuDe/ThuyetMinh xóa; lịch sử nội dung vẫn giữ |

Quét QR ngân hàng không xác minh tiền thật. Test thanh toán ở đây chỉ kiểm tra API mô phỏng và tính nhất quán SQL.

## Mobile và nhiều thiết bị

1. Tạo `mobile/.env` từ `.env.example`, đặt API theo IP LAN cổng 3000. Không dùng localhost trên điện thoại thật.
2. `npm ci --prefix mobile`, `npm run mobile`; đăng nhập đúng tài khoản đã dùng trên Web.
3. Tải video và nhập lời thoại hoặc dùng bản native có Whisper. Sau xử lý, chờ thông báo đã lưu. Mất kết nối phải báo chưa lưu.
4. Mở Tài khoản Mobile và bấm Làm mới; Admin Web phải đọc được cùng Video, PhuDe, ThuyetMinh trong SQL.
5. Điện thoại thứ hai dùng tài khoản khác không nhìn thấy dữ liệu riêng của tài khoản thứ nhất.
6. Expo Go có thể không hỗ trợ whisper.rn; dùng lời thoại nhập tay hoặc build development native để kiểm tra nhận diện.

## Test tự động

```sh
npm ci --prefix server
npm ci --prefix web
npm ci --prefix mobile
npm test --prefix server
node --test shared/*.test.mjs
npm run lint
npm test --prefix web
npm test --prefix mobile -- --runInBand
npm run build --prefix web
npm run bundle --prefix mobile
```

Test SQL thật trên PowerShell (SQL Server phát triển):

```powershell
$env:DB_INTEGRATION='true'
$env:DB_HOST='localhost'
$env:DB_PORT='1433'
$env:DB_USER='sa'
# Đặt DB_PASSWORD bằng mật khẩu SQL phát triển hiện tại, không commit vào Git.
$env:DB_PASSWORD='<mat-khau-SQL-phat-trien>'
node --test server/test/sql.integration.test.mjs
```

Test chỉ tạo và xóa database có tiền tố DubchefIntegration với phần ngẫu nhiên do test sinh; không dùng hoặc xóa DB_NAME của bạn. Đòi quyền tạo database trên SQL Server phát triển. CI có job SQL integration riêng dùng SQL Server tạm; các job test giả không thay thế job này.

## Demo giảng viên

Trình bày theo thứ tự: đăng ký/đăng nhập → xử lý một video ngắn → mở SQL xác nhận dữ liệu → Admin xem và sửa phụ đề → duyệt nội dung và xem lịch sử → phản hồi và trả lời → đơn hàng/thanh toán mô phỏng → thống kê → Mobile đọc/lưu cùng Backend → giới thiệu sơ đồ và CI/CD. Chuẩn bị sẵn video ngắn và tải model trước buổi demo. Không gọi paid mô phỏng là tiền đã về ngân hàng.
