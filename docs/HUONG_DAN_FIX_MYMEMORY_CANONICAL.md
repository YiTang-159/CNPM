# Sửa triệt để lỗi dịch MyMemory quay trở lại

## Nguyên nhân

Dự án có ba bản `translate.js`: `shared/translate.js` (nguồn chính), `web/src/shared/translate.js` và `mobile/src/shared/translate.js`. Trước đây bản vá chỉ sửa Web, trong khi `npm run sync` sao chép bản cũ từ `shared` đè lên Web và Mobile. Các unit test cũ cũng còn giả lập định dạng phản hồi MyMemory.

## Những file được sửa

- `shared/translate.js`, `web/src/shared/translate.js`, `mobile/src/shared/translate.js`: chỉ gọi `POST <API_DUBCHEF>/api/translate`; nguồn chính tương thích Node/Vite/Expo.
- `web/src/pages/Demo.jsx`, `mobile/src/screens/DemoScreen.js`: truyền đúng địa chỉ API và token của tài khoản đang đăng nhập.
- `shared/i18n.js` cùng hai bản sao của Web/Mobile: thông báo rõ khi máy chủ AI bận, chưa cài mô hình, lỗi xác thực hoặc không kết nối được Ollama.
- `shared/translate.test.mjs`: kiểm tra API nội bộ, lỗi HTTP, xác thực và ba bản sao đồng bộ.

Không chỉnh SQL Server, mật khẩu, Docker Compose, API Backend hay dữ liệu đã lưu. Giữ nguyên các bản vá payOS, MP3/MP4 và quyền sử dụng gói hiện tại.

## Cách cài

1. Sao lưu thư mục `CNPM`.
2. Giải nén ZIP **PATCH**, mở thư mục `CNPM` trong ZIP rồi sao chép nội dung vào `CNPM` hiện tại, chọn **Replace** khi được hỏi.
3. Mở VS Code Terminal ở thư mục gốc `CNPM`, chạy:

```powershell
npm run sync
npm run test:shared
```

4. Kiểm tra chắc chắn ba bản dịch không còn MyMemory:

```powershell
Select-String -Path .\shared\translate.js,.\web\src\shared\translate.js,.\mobile\src\shared\translate.js -Pattern 'api\.mymemory\.translated\.net'
```

**Kết quả mong đợi:** không có dòng nào được in ra. Lệnh `npm run sync` giờ có thể chạy an toàn.

## Bật Backend và Ollama

Trong Terminal tại `CNPM`:

```powershell
docker compose --profile local-ai up -d --build
docker exec dubchef-ollama ollama pull qwen2.5:3b
docker exec dubchef-ollama ollama list
```

Trong `web/.env`, đảm bảo `VITE_API_URL=http://localhost:3000` khi test trên chính máy Windows. Giữ nguyên cấu hình Docker và SQL đang dùng. Nếu truy cập bằng điện thoại qua mạng LAN, không dùng `localhost` cho API từ điện thoại.

Tại thư mục `CNPM/web`, chạy:

```powershell
npm run test
npm run build
npm run dev
```

**Lưu ý:** API `/api/translate` cần token của tài khoản đã đăng nhập. Không có API/token/mô hình, ứng dụng sẽ hiển thị lỗi tương ứng thay vì tự chuyển sang MyMemory. Khi `OLLAMA_URL` đã được tùy chỉnh trong `.env`, đảm bảo giá trị đó truy cập được từ container API. `ollama pull` cần Internet một lần; xử lý về sau chạy tại máy chủ Docker của bạn.

## Kiểm tra bằng trình duyệt

1. Đăng nhập tài khoản khách hàng bình thường.
2. Mở **Trải nghiệm**, tải một video ngắn, bật **Dịch sang ngôn ngữ khác**, chọn ngôn ngữ gốc và nhấn **Lồng tiếng**.
3. Mở F12 → Network, lọc `translate`: request phải đi tới `/api/translate` của Dubchef, không tới MyMemory.
4. Nếu báo `model_missing`, kiểm tra đã tải `qwen2.5:3b` và tên mô hình trong Docker; nếu `unavailable`, kiểm tra container Ollama; nếu `auth`, đăng nhập lại; nếu máy chủ bận thì thử lại sau.

## Kết quả kiểm tra tại môi trường tạo bản vá

- `npm run sync`: chạy thành công; nguồn và bản sao vẫn giống nhau.
- `npm run test:shared`: 24/24 bài đạt, gồm 10 bài riêng cho mô-đun dịch.
- `npm run test:server`: 42 bài đạt, 0 lỗi, 2 bỏ qua (môi trường tích hợp).
- ESLint tệp Web sửa đổi: đạt; phân tích cú pháp JSX Web/Mobile: đạt.
- Chưa chạy được toàn bộ Vitest/Web build và Ollama/SQL Docker thực tế trên máy Windows của bạn trong môi trường này.

**Không chạy `docker compose down -v`**, vì có thể xóa dữ liệu SQL Server.
