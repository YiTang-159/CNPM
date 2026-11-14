# Dubchef - runbook vận hành (chưa triển khai production được xác minh)

## Phạm vi

Local Windows 11, Docker Desktop, SQL Server trong volume `dubchef-data`, uploads trong `dubchef-uploads`, Ollama trong `dubchef-ollama`; giờ thống kê Việt Nam +7. API `localhost:3000`, web `localhost:5173`, SQL `127.0.0.1,1433`. Không xóa/tạo lại volume đã có dữ liệu.

## Khởi động và kiểm tra

1. `npm run setup:local` chỉ bổ sung các biến còn thiếu và bảo toàn mật khẩu DB hiện tại. Máy mới cần mật khẩu tự sinh để kết nối SQL mới.
2. `docker compose up -d --build`; `docker compose ps` phải hiển thị service là healthy. Trong trường hợp model tải lâu, `docker compose logs ollama-init` rồi thử lại.
3. `curl http://127.0.0.1:3000/api/health`; `curl http://127.0.0.1:3000/api/health/translation`; `bash scripts/smoke-test.sh` (môi trường demo).
4. `docker compose logs --tail 100 api` và `node scripts/monitor-system.mjs` ghi kết quả vào `.local-monitor/` (không commit). Lỗi `503` ở health đòi kiểm tra SQL/Ollama trước.

## Triển khai staging / production

- Không đăng public `1433`; dùng private network/VPN, đặt `NODE_ENV=production`, `LOCAL_DOCKER_INSTALL=false` (chỉ production công khai), CORS theo HTTPS domain thực tế.
- Secret giữ trong secret manager hoặc biến môi trường của host; không đưa vào Docker image, frontend `VITE_*`, ZIP/Git.
- `PAYMENT_MODE=payos` phải có `PAYOS_CLIENT_ID`, `PAYOS_API_KEY`, `PAYOS_CHECKSUM_KEY`, `PAYOS_RETURN_URL`, `PAYOS_CANCEL_URL`; thiếu một biến thì app fail startup. Đăng ký HTTPS webhook `/api/payments/payos/webhook`, test callback ký thật từ nhà cung cấp rồi mới mở thu tiền.
- Để deploy, cần domain, chứng chỉ HTTPS, account host, firewall và giám sát có cảnh báo. Không có URL production hoặc bằng chứng uptime trong bản bàn giao hiện tại.

## Sao lưu và khôi phục

- Sao lưu sau giờ cao điểm khi có tài khoản Docker + SSMS. `node scripts/backup-dubchef.mjs backup` tạo backup ngoài repo theo `BACKUP_ROOT` (mặc định thư mục `../DubchefBackups`), SQL backup, kho uploads, manifest và **kiểm tra restore thử**, ghi `verification.json` nếu thành công. Backup mới mặc định nằm **ngoài** repo; các backup cũ trong `backups/` vẫn được loại khỏi Git và ZIP. **Chuyển bản đã verify ngay sang ổ rời/NAS riêng**.
- `node scripts/backup-offsite.mjs --source <duong-dan-backup-tuyet-doi> --dest <o-dia-khac>` kiểm checksum và từ chối đích trên cùng ổ, tránh giả backup ngoại vi. Không gửi backup lên GitHub Actions artifact hay GitHub repository.
- Windows Task Scheduler: tạo task hằng ngày chạy `node <DUONG_DAN_DU_AN>\\scripts\\backup-dubchef.mjs backup` với `Start in` trỏ tới thư mục dự án; lên lịch riêng cho script offsite (phải có ổ rời/NAS). Giám sát kết quả chạy task và dung lượng ổ đích, kiểm thử restore định kỳ.
- **Khôi phục production là thao tác phá hủy dữ liệu hiện tại**. Sau khi chụp backup mới nhất và được phê duyệt, kiểm tra `node scripts/backup-dubchef.mjs verify <thu-muc>` trước; chỉ chạy `node scripts/backup-dubchef.mjs restore <thu-muc> RESTORE_DUBCHEF` khi đã xác nhận phạm vi ghi đè. Khởi động lại API, check health/SSMS, đối soát đơn và uploads.

## Rollback

- Giữ bản image/tag cũ trên registry và backup verified đúng phiên bản; nếu lỗi deploy, dừng giao dịch mới, đưa image phiên bản trước lên, kiểm tra tương thích schema, tránh tự động rollback SQL gây mất dữ liệu mới.
- Nếu cần rollback schema dữ liệu, làm trong cửa sổ bảo trì, có backup mới và phê duyệt phục hồi theo mục trên. `docker compose down` không xóa volume; tuyệt đối tránh `down -v`.

## Alert và dashboard

- API có `/api/health`, `/api/health/translation`, `/api/metrics`. `/api/metrics` dùng bearer `METRICS_TOKEN` (>=24 ký tự); endpoint trả 404 nếu chưa cấu hình, không public token.
- Dùng Uptime Kuma/Prometheus ở VPS riêng để thu số liệu, cảnh báo email/Telegram; chưa có máy chủ/tài khoản để xác nhận alert đã gửi được. Script `monitor-system.mjs` hiện là giám sát cục bộ theo lần chạy, không thay thế hệ thống alert.

## Xoay vòng secret và phản ứng sự cố

- Xem `docs/SECURITY.md`. Với DB đã tồn tại, đổi mật khẩu SQL **trong SQL trước**, sau đó cập nhật `.env`; giữ Docker volume. Với TOKEN_SECRET, thay khóa làm vô hiệu token cũ. Với payOS, thu hồi/cấp lại key trong dashboard, cập nhật biến host, xác thực lại giao dịch; rà soát log không chứa khóa.
- Nếu Git có lộ khóa, ngừng dùng key cũ ngay; làm sạch lịch sử trong clone riêng sau khi nhóm đồng ý; truy tìm artifact/fork và thông báo thành viên clone lại.
