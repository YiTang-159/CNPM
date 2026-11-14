# MỞ FILE NÀY TRƯỚC — BẢN SỬA 14/11/2026

**Giữ nguyên** SQL Server `localhost,1433`, Login `sa`, Trust server certificate = Yes, mật khẩu trong `.env` được giữ theo file ZIP gốc; không tạo lại database, không xoá volume. Database `DubchefDB` nằm trong volume `dubchef_dubchef-data`. Nếu dùng bản an toàn cho GitHub, **không thay thế file `.env` đang dùng trên máy**.

1. Đóng ứng dụng Web đang chạy trước khi cập nhật. Giải nén đè **các file mã nguồn** vào thư mục `CNPM` hiện tại, không xóa thư mục `.git`, `node_modules`, `backups` hoặc Docker volumes. Hãy sao lưu dự án hiện tại trước khi chép.
2. Mở Docker Desktop, PowerShell ở thư mục `CNPM`:

```powershell
docker compose up -d --build
docker compose ps
docker compose logs --tail 70 api db
curl.exe http://localhost:3000/api/health
```

3. Mở Web (cửa sổ PowerShell khác):

```powershell
npm ci --prefix web
npm --prefix web run dev
```

4. Vào `http://localhost:5173` và thử đăng nhập, quản lý đơn; thử thanh toán **demo**, ghi nhận vào SQL. Ollama tải mô hình lần đầu qua Internet, SQL vẫn dùng được trong khi tải. Kiểm tra sau khi model đã tải:

```powershell
docker compose logs --tail 40 ollama-init
curl.exe http://localhost:3000/api/health/translation
docker compose exec -T api node scripts/test-ollama.mjs
```

5. Xem **hướng dẫn đầy đủ + kiểm thử lỗi + payOS/backup/giám sát**: `docs/HUONG_DAN_SUA_TOAN_BO_20261114.md`.

**KHÔNG chạy** `docker compose down -v`, **KHÔNG đổi mật khẩu SA**, **KHÔNG đưa file `.env` hoặc ZIP riêng tư có dữ liệu khách hàng lên GitHub**. Môi trường này không có Docker thật, nên đừng suy diễn backend/Ollama đã khởi động thành công trên laptop cho đến khi có kết quả các lệnh ở trên.
