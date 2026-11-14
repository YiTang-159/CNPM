# Dubchef — Cấu hình bảo mật và ZIP chia sẻ an toàn

## Đã thay đổi ở bản này

- Không đóng gói `.env`, bản sao lưu DB/video, `db/data`, khóa ký Android, thư viện `node_modules`, thư mục `.git`, tệp tải lên. `scripts/package-share.py` tự loại những tệp đó khi tạo ZIP.
- SQL Server không còn mật khẩu SA mặc định trong Compose hay mã nguồn. `DB_PASSWORD` phải có trong `.env` riêng trên máy chạy Docker; **không** thêm `.env` vào GitHub/ZIP.
- Mặc định `1433` (SSMS) và `3000` (API) chỉ mở trên `127.0.0.1` ở máy chạy Docker, không công khai trong LAN/Internet.
- API yêu cầu `TOKEN_SECRET` cố định từ 32 ký tự, mật khẩu SQL đủ mạnh và danh sách `CORS_ORIGIN` hợp lệ khi chạy `NODE_ENV=production` (Dockerfile đã đặt production).
- API bổ sung kiểm tra origin chính xác, security headers, cache no-store cho API, 404 dạng JSON, giới hạn đăng ký 20 lần/15 phút/IP và đăng nhập 60 lần/15 phút/IP; cơ chế khóa sau 10 lần đăng nhập sai vẫn giữ.
- Xóa khóa debug Android đóng gói sẵn; bản Release không còn ký bằng khóa debug dùng chung. Cấu hình khóa phát hành riêng trong EAS/CI.
- **Không** thay đổi migration/schema, không xóa dữ liệu SQL, không chạy `docker compose down -v`.

## A. Máy mới / dự án mới chưa có dữ liệu

Tại thư mục `CNPM` có `docker-compose.yml`:

```powershell
npm run setup:local
# Mở .env cục bộ: mật khẩu SQL/Admin/token được tạo ngẫu nhiên nếu chưa có.
docker compose up -d --build
docker compose ps
```

Nếu bạn đã có `.env`, script **chỉ bổ sung giá trị còn thiếu**, không tự đổi mật khẩu SQL trên server cũ. Đảm bảo `DB_PASSWORD`, `TOKEN_SECRET`, `CORS_ORIGIN` hợp lệ. Không chia sẻ `.env` hoặc chụp màn hình lộ mật khẩu.

Một phần cấu hình máy cá nhân (các bí mật để riêng, không ghi vào tài liệu):

```dotenv
DB_BIND_ADDRESS=127.0.0.1
API_BIND_ADDRESS=127.0.0.1
DB_TRUST_SERVER_CERTIFICATE=true
CORS_ORIGIN=http://localhost:5173,http://127.0.0.1:5173
PAYMENT_MODE=disabled
```

Kiểm tra `http://localhost:3000/api/health`; SSMS kết nối `localhost,1433` bằng `sa` và mật khẩu thực trong `.env`. `DB_TRUST_SERVER_CERTIFICATE=true` chỉ chấp nhận chứng chỉ tự ký của SQL Server trên môi trường Docker local; khi triển khai doanh nghiệp cần chứng chỉ TLS hợp lệ và đặt `false`.

## B. Đã có SQL Server / dữ liệu khách hàng — BẮT BUỘC đọc trước

**Đừng tạo `.env` mới để ghi đè file cũ, đừng xóa volume.** Nếu mật khẩu SA từng có trong ZIP `.env` hay GitHub, hãy xem mật khẩu ấy đã lộ.

1. Sao lưu bằng công cụ của dự án ra vị trí an toàn, **không tải backup lên GitHub**: `node scripts/backup-dubchef.mjs backup` (cần Docker đang chạy). Giữ backup được xác minh trong ổ đĩa có quyền truy cập hạn chế.
2. Giữ SQL Server đang chạy; dừng API: `docker compose stop api`. Kết nối SSMS bằng mật khẩu SQL hiện tại.
3. Thay **mật khẩu login SA ngay trong SQL Server**, bằng giao diện SSMS (Security → Logins → sa → Properties → General) hoặc lệnh SQL sau, điền hai giá trị chỉ trên máy riêng:

   ```sql
   ALTER LOGIN [sa] WITH PASSWORD = N'<MAT_KHAU_MOI_DU_MANH>', OLD_PASSWORD = N'<MAT_KHAU_HIEN_TAI>';
   ```

   Nếu kết nối bằng quyền sysadmin, SSMS cũng có thể đổi từ Properties. Không lưu truy vấn chứa mật khẩu thực vào repository.
4. Cập nhật **chính giá trị DB_PASSWORD trong `.env` cũ** thành mật khẩu SQL mới. **Chỉ thay `.env` mà không thay mật khẩu trong SQL thì API sẽ không kết nối được**, vì SQL volume giữ trạng thái mật khẩu trước đó.
5. Nếu `TOKEN_SECRET` đã lộ: sinh giá trị mới trên máy riêng (PowerShell / Node):

   ```powershell
   node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
   ```

   Dán vào `TOKEN_SECRET` của `.env`. Tất cả phiên đã đăng nhập phải đăng nhập lại. Nếu khóa payOS đã lộ, cần đổi tại nhà cung cấp; không thể chữa rò rỉ bằng cách xóa file trong ZIP mới.
6. Mật khẩu tài khoản Admin đã lưu trong SQL không được thay bằng cách sửa `ADMIN_PASSWORD` trong `.env` đơn thuần (biến này dùng để **khởi tạo** Admin). Hãy đổi mật khẩu tài khoản trong giao diện ứng dụng nếu nghi ngờ lộ.
7. Chạy lại `docker compose up -d --build`, sau đó `docker compose logs --tail=80 api` và mở `/api/health`. Kiểm tra đăng nhập, danh sách đơn hàng cũ, quyền gói, dữ liệu SSMS.

Với database cũ, tuyệt đối tránh `docker compose down -v` hoặc xóa thư mục chứa Docker volume. Nếu sao lưu có thông tin khách hàng, cần kiểm soát quyền và mã hóa nơi lưu, không gửi qua chat/GitHub công cộng.

## C. Muốn dùng điện thoại / máy tính khác trong cùng Wi-Fi

Do bảo mật mặc định chỉ bind `127.0.0.1`, thiết bị khác không gọi được API. Nếu **chủ động demo trong mạng nội bộ tin cậy**, đặt vào `.env`:

```dotenv
API_BIND_ADDRESS=0.0.0.0
# Chỉ mở DB_BIND_ADDRESS=0.0.0.0 khi thật sự phải dùng SSMS từ máy khác.
# DB_BIND_ADDRESS=0.0.0.0
CORS_ORIGIN=http://localhost:5173,http://127.0.0.1:5173,http://IP_LAN_CUA_MAY:5173
```

Sau đó `docker compose up -d --build`. Cấu hình Windows Firewall chỉ cho phép IP/mạng nội bộ tin cậy tới cổng 3000. Trên điện thoại đặt `EXPO_PUBLIC_API_URL=http://IP_LAN_CUA_MAY:3000` trong `mobile/.env`. Dùng HTTP qua Wi-Fi chỉ phù hợp môi trường demo kiểm soát được, **không** truyền dữ liệu khách hàng thật hoặc token thật qua mạng không đáng tin.

Với Web public (GitHub Pages), API cần endpoint HTTPS công khai, TLS tại reverse proxy/load balancer và thêm **đúng origin** của website vào `CORS_ORIGIN` (ví dụ `https://ten-tai-khoan.github.io`). Không mở SQL 1433 ra Internet. Cấu hình `API_BIND_ADDRESS` phía proxy theo kiến trúc deploy.

## D. Tạo ZIP sạch để nộp hoặc chia sẻ

Chạy Python 3 tại thư mục gốc `CNPM`:

```powershell
python scripts/package-share.py --check
python scripts/package-share.py
```

ZIP được tạo **ngoài** thư mục dự án, tên `Dubchef_Nguon_An_Toan_De_Chia_Se.zip`. Tool loại `.env`, `.git`, `backups/`, bản `.bak`, `.tar.gz`, `db/data`, `uploads`, khóa ký, `node_modules`, build và tệp tạm; đồng thời quét các dấu hiệu khóa cá nhân phổ biến trong mã nguồn. Quét tự động **không bảo đảm phát hiện mọi loại bí mật**: luôn rà soát tài liệu và commit trước khi phát hành.

Nếu trong repository cũ đã từng commit file bí mật/khóa ký, `.gitignore` không xóa chúng khỏi **lịch sử Git**. Thu hồi/đổi tất cả bí mật bị lộ; phải làm sạch lịch sử theo quy trình quản lý Git trước khi chia sẻ repository nguyên vẹn. Cố ý không đưa thư mục `.git` vào ZIP.

## E. Kiểm tra và giới hạn

```powershell
node --test shared/*.test.mjs
npm run test:server
npm --prefix web run lint
npm --prefix web test
```

Kiểm thử tích hợp SQL Server thực cần Docker/SQL đang chạy, dùng database test riêng (`DB_INTEGRATION=true`) chứ không chạy trên DB khách hàng. Các limiter hiện là **in-memory per API instance**; khi mở rộng nhiều replica phải chuyển sang rate limiter dùng Redis / gateway. Hệ thống chưa tự bảo đảm toàn bộ tiêu chuẩn doanh nghiệp: còn cần reverse proxy HTTPS, phân quyền SQL tối thiểu thay cho `sa`, kiểm tra phụ thuộc/vulnerability, log tập trung, sao lưu mã hóa và đánh giá bảo mật độc lập.
