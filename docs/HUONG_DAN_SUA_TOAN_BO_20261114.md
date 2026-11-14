# DUBCHEF — BẢN SỬA KẾT NỐI & KIỂM THỬ (14/11/2026)

## 0. QUAN TRỌNG: KHÔNG ĐỔI MẬT KHẨU SQL, KHÔNG XÓA VOLUME

Bản ZIP này giữ nguyên `name: dubchef`, SQL Server 2022, volume `dubchef_dubchef-data`, database `DubchefDB`, cổng `1433`. File `.env` cá nhân trong bản tải về được giữ nguyên theo bản gốc. **Đừng xóa dữ liệu Docker, đừng chạy `docker compose down -v`, đừng đặt lại mật khẩu SA.**

Thông tin SSMS theo yêu cầu: **Server** `localhost,1433`; **Authentication** SQL Server Authentication; **Login** `sa`; **Password** `Dubchef@12345`; **Trust server certificate** bật. Trong Docker, API kết nối tới `DB_HOST=db`, không phải `localhost`; đây là DNS nội bộ Docker, không phải thay mật khẩu. File `web/.env` giữ trỏ tới `http://localhost:3000`.

> **Chú ý:** mật khẩu trên là mật khẩu đã dùng sẵn trên SQL Server volume, chỉ chấp nhận cho môi trường Docker cục bộ bind ở `127.0.0.1`. Khi đưa backend công khai, dùng tài khoản/quyền SQL thích hợp và đổi mật khẩu tại SQL Server **rồi mới** sửa `.env` cùng lúc. Không đưa `.env` hoặc `backups` lên GitHub, và không công khai ZIP riêng tư.

## 1. Chạy ở Windows 11, giữ database cũ

Mở Docker Desktop, mở PowerShell đúng thư mục `CNPM` (chứa `docker-compose.yml`):

```powershell
docker compose config
docker compose up -d --build
docker compose ps
docker compose logs --tail 80 db api
curl.exe http://localhost:3000/api/health
curl.exe http://localhost:3000/api/payments/config
```

`/api/health` phải ra `{"ok":true,"db":true}`. Nếu `api` lỗi, mở `docker compose logs --tail 100 api` để đọc lỗi; không sửa SQL password ngẫu nhiên. Nếu cổng `1433` bị chiếm bởi SQL Server cài trực tiếp trên Windows, dừng tiến trình chiếm cổng hoặc xác định đúng instance trước khi sửa cấu hình; không làm thay đổi mật khẩu trên volume.

**Ollama** tự khởi tạo 2 service `dubchef-ollama` + `dubchef-ollama-init`, tải `qwen2.5:3b` vào volume riêng (`dubchef_dubchef-ollama`). Lần đầu cần kết nối mạng và bộ nhớ tương ứng (model nhiều GB); trong lúc tải, backend và SQL **vẫn chạy độc lập**. Xem trạng thái:

```powershell
docker compose logs --tail 60 ollama-init
docker compose exec ollama ollama list
curl.exe http://localhost:3000/api/health/translation
# Sau khi model tải xong, kiểm tra nội dung dịch thực tế 6 chiều:
docker compose exec -T api node scripts/test-ollama.mjs
```

`/api/health/translation` trả `ok:true,reachable:true,modelReady:true` mới là mô hình sẵn sàng. Không tự tuyên bố bản dịch chính xác chỉ vì HTTP 200: cần xem thủ công 6 câu mẫu (đặc biệt số lượng và tên nguyên liệu). Không có Ollama thì báo lỗi `503 model_missing/unavailable`, không tự động gửi dữ liệu qua MyMemory.

Chạy Web trong một cửa sổ PowerShell khác:

```powershell
npm ci --prefix web
npm --prefix web run dev
```

Mở `http://localhost:5173`. File `web/.env` trong bản gốc có 3 URL `localhost` phù hợp với máy này. Khi deploy GitHub Pages, `localhost` **không** thể kết nối SQL trên laptop người truy cập: cần deploy Backend qua **HTTPS công khai**, rồi cấu hình biến GitHub `VITE_API_URL`, `VITE_PAYMENT_API_URL`, `VITE_PUBLIC_URL` cho đúng môi trường. Website tĩnh GitHub Pages không tự host Docker hoặc SQL Server.

## 2. Thanh toán theo môi trường (không trộn demo và payOS)

- **Local demo mặc định**: `.env` đặt `PAYMENT_MODE=demo`, `PAYMENT_DEMO=true`. Cảnh báo trên UI; đơn ghi `NguonXacNhan=demo`. Tiền **không đi qua ngân hàng**. Chỉ dùng dữ liệu demo/test, tránh diễn giải là doanh thu đã nhận.
- **Dừng thanh toán**: `PAYMENT_MODE=disabled` rồi `docker compose up -d --no-deps --force-recreate api` (không đụng SQL).
- **payOS thực tế**: chuẩn bị tài khoản payOS và kênh đã xác minh; cấu hình **riêng** `PAYMENT_MODE=payos`, `PAYMENT_DEMO=false`, `PAYOS_CLIENT_ID`, `PAYOS_API_KEY`, `PAYOS_CHECKSUM_KEY`, `PAYOS_RETURN_URL` và `PAYOS_CANCEL_URL` là HTTPS đúng domain. Chỉ thay đổi chế độ ở môi trường triển khai thật khi có credentials; **không đưa keys vào ZIP hoặc Git**. Cần backend công khai HTTPS cho webhook `https://TEN-MIEN-BACKEND/api/payments/payos/webhook` và đăng ký/confirm webhook trên payOS. Kiểm tra log và mã ký.

payOS **không có sandbox tách biệt**; API của payOS là API production, có giao dịch ngân hàng thật. **Không thử chuyển tiền thật trước khi có tài khoản, URL và khóa hợp lệ.** Website không được đánh dấu `paid` từ `returnUrl`; chỉ webhook HMAC hợp lệ và số tiền/order/currency trùng với SQL mới ghi nhận thanh toán, cấp quyền trong cùng SQL transaction. Thử trả webhook ký sai phải là `400`, tiền sai là `409`, webhook trùng không được cộng quyền hai lần.

```powershell
curl.exe http://localhost:3000/api/payments/config
# Demo: mode=demo; production có cấu hình payOS hợp lệ: mode=payos
```

SQL kiểm tra nguồn thanh toán sau test (không chạy trên dữ liệu sản xuất ngoài ý muốn):

```sql
USE DubchefDB;
SELECT TOP (20) d.MaDonHang,d.TrangThai,g.MaThamChieu,g.NguonXacNhan
FROM dbo.DonHang d LEFT JOIN dbo.GiaoDich g ON g.MaDonHang=d.MaDonHang
ORDER BY d.MaDonHang DESC;
```

## 3. Kiểm thử / CI / xuất MP3 MP4

```powershell
node --test shared/*.test.mjs
npm ci --prefix server
npm test --prefix server
npm ci --prefix web
npm --prefix web run lint
npm --prefix web test
npm --prefix web run build
npm ci --prefix mobile
npm --prefix mobile run lint
npm --prefix mobile test
```

GitHub Actions `CI` có job SQL Server 2022 **cơ sở dữ liệu tạm**, cùng một job render MP3/MP4 thực bằng `espeak-ng` + `ffmpeg` và xác minh codec bằng ffprobe. Đây là workflow để chạy trên máy runner khi push code, **không đồng nghĩa đã chạy thành công trên GitHub cho ZIP này**. GitHub Pages CD chỉ triển khai web tĩnh sau khi CI của `main` thành công. Chọn backend/URL theo hướng dẫn ở mục 1 để tránh tình trạng web triển khai nhưng không liên kết backend.

Kiểm tra MP3/MP4 thủ công với dữ liệu video thực: đăng nhập và có quyền gói; tạo video tải lên; dịch và lưu timeline; Admin duyệt/publish lời thuyết minh; ở giao diện media xuất MP3 hoặc MP4; dùng ffprobe/VLC xác nhận audio track và video track. **Yêu cầu thực**: MP3 có codec mp3, MP4 có video h264 và âm thanh aac, file có thể phát. Chất lượng giọng hiện là eSpeak-ng tổng hợp, không phải giọng AI chuyên nghiệp.

## 4. Sao lưu, khôi phục xác minh và bản ngoài máy chủ

Bản gốc đã có `scripts/backup-dubchef.mjs` kiểm tra restore thực vào một DB tạm (không ghi đè dữ liệu thật) và xác minh media archive. Không chạy restore-production nếu chưa có sự cố và xác nhận.

```powershell
node scripts/backup-dubchef.mjs backup
# Chọn đúng tên thư mục sinh ra, ví dụ:
node scripts/backup-dubchef.mjs verify backups/dubchef_YYYYMMDD_HHMMSS_XXXXXXXX
```

Chỉ khi có `verification.json` với `databaseRestore`, `integrityCheck`, `uploadsArchive`, `sha256` đều `PASS` mới chuyển sang ổ ngoài hoặc NAS **đã kết nối, khác ổ nguồn**:

```powershell
node scripts/backup-offsite.mjs --source backups/dubchef_YYYYMMDD_HHMMSS_XXXXXXXX --dest E:\DubchefBackups
```

Công cụ kiểm checksum của dữ liệu **trước và sau khi chép**, từ chối ghi đè bản sao cũ và từ chối ổ đích trùng ổ nguồn. Nên dùng ổ mã hóa BitLocker/NAS có mã hóa và phân quyền, áp dụng lịch sao lưu định kỳ; lưu riêng bí mật `.env` trong kho được mã hóa. Lệnh phá hủy `restore` chỉ dùng theo tài liệu `docs/SAO_LUU_KHOI_PHUC_KIEM_CHUNG.md` và yêu cầu chuỗi xác nhận `RESTORE_DUBCHEF`.

## 5. Giám sát, hiệu năng, xử lý sự cố

```powershell
node scripts/monitor-system.mjs
node scripts/perf-smoke.mjs --url http://localhost:3000 --requests 40 --concurrency 5
```

Giám sát ghi `.local-monitor/health.jsonl` (không chứa dữ liệu cá nhân/khóa), trạng thái `DOWN` nếu API/SQL hỏng, `DEGRADED` nếu Ollama hoặc model chưa sẵn sàng, `OK` nếu cả hai sẵn sàng. Có thể dùng Windows Task Scheduler lặp mỗi 5 phút; bảo đảm script kết thúc đúng mã lỗi để gửi cảnh báo. Performance smoke chỉ dùng GET `/api/health`, `/api/payments/config`, không tạo đơn và không làm tăng tiền.

Metrics có endpoint `/api/metrics` **chỉ hoạt động nếu** đặt `METRICS_TOKEN` đủ dài trong `.env`, sau đó restart riêng API. Gửi `Authorization: Bearer <token>` mới thấy các bộ đếm HTTP; mặc định endpoint là `404` để tránh công khai số liệu. Hệ thống chưa có Prometheus/Grafana hay alerting tự động cài sẵn; đây là nền tảng để tích hợp sau.

Quy trình khi lỗi: (1) xác nhận HTTP `/api/health`; (2) `docker compose ps`; (3) lấy log `docker compose logs --tail 200 api db ollama ollama-init`; (4) xác định SQL, model, cấu hình payOS hay volume media; (5) chỉ khởi động lại dịch vụ lỗi, **không xóa volume**; (6) nếu dữ liệu hỏng, xác minh SHA/DBCC và làm theo hướng dẫn restore có xác nhận; (7) lưu dấu vết thời gian, triệu chứng và bước sửa vào báo cáo sự cố. Khi SQL hoạt động mà web lỗi, kiểm `web/.env` và Network tab; khi SQL chưa hoạt động, sửa backend trước rồi mới debug Web.

## 6. Những gì bản ZIP chưa thể tự xác nhận

Môi trường sinh bản vá không có Docker Engine hoặc máy SQL/SSMS của bạn; không có payOS API keys hay URL webhook public và không tải model Ollama trực tiếp được. Vì vậy **không thể kết luận** đã chạy thành công SQL integration/restore thực, Ollama thực, webhook payOS thực hoặc end-to-end MP4 trên laptop người dùng. Mã nguồn đã được cập nhật và có bài kiểm thử cụ thể tương ứng, nhưng các bước ở trên cần chạy trên máy thực và quan sát kết quả. Bản ZIP gói nguồn không có `node_modules` và `.git` để không ghi đè repo GitHub hoặc mang binary Windows vô ích.
