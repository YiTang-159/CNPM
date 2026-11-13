# Dubchef V4 — Xuất MP3/MP4 lồng tiếng có âm thanh thật

## Đã thay đổi

- `server/src/audioExport.js`: nhận các dòng thuyết minh đã xuất bản từ SQL, dùng **eSpeak NG** tổng hợp giọng VI/EN/ZH ra WAV theo từng câu và **FFmpeg** ghép vào timeline rồi mã hóa thành MP3.
- MP4 được tạo từ **video gốc đã tải lên + giọng đọc MP3 mới**; âm thanh gốc được **thay thế** (không giữ tiếng nền). Video sẽ được mã hóa sang H.264 khi codec gốc không phù hợp.
- `server/src/app.js`: API xuất tệp bảo vệ bằng đăng nhập, kiểm tra quyền sở hữu video, yêu cầu trạng thái `published`. Mỗi lần xuất chỉ có 1 job đồng thời nhằm bảo vệ máy demo.
- `server/Dockerfile`: cài `ffmpeg`, `espeak-ng` trong container API.
- `web/src/components/AdminMediaEditors.jsx`: thêm nút **Tải MP3 giọng đọc** và **Tải MP4 đã lồng tiếng** khi mở kịch bản đã xuất bản.
- `web/src/pages/Account.jsx`: khách chỉ được xem/tải kết quả đã duyệt của video thuộc tài khoản của mình.
- Không thay đổi SQL schema, tài khoản, giá, dữ liệu cũ hoặc Docker volume.

## Cài bản vá từ VS Code — Windows 11

1. Sao lưu thư mục `CNPM` hiện đang chạy. Đừng xóa `db`, volume Docker hoặc `.env`.
2. Giải nén PATCH; sao chép thư mục `CNPM/server`, `CNPM/web`, `CNPM/docs` vào `CNPM` hiện tại và chọn Replace file trùng tên. Bản vá không có `.env`.
3. Mở Docker Desktop và Terminal trong thư mục gốc `CNPM`:

   ```powershell
   docker compose up -d --build api
   docker compose ps
   docker exec dubchef-api ffmpeg -version
   docker exec dubchef-api espeak-ng --voices=vi
   ```

4. Chạy frontend (nếu Terminal đang ở `CNPM`):

   ```powershell
   cd web
   npm run dev
   ```

   Nếu Vite đang chạy, bấm Ctrl+C trước khi khởi động. Mở `http://localhost:5173`, Ctrl+Shift+R.

5. Nếu cần test:

   ```powershell
   npm run build
   npm run test
   ```

   Backend tests từ thư mục gốc `CNPM`: `npm run test:server`. SQL integration riêng vẫn cần Docker/SSMS thực tế.

## Cách dùng — Admin

1. Đăng nhập Admin → **Thuyết minh**.
2. Chọn một video đã được khách tải lên, chọn ngôn ngữ **vi/en/zh**, nhập lời đọc từng đoạn và đặt thời gian **Bắt đầu/Kết thúc** không chồng nhau, nằm trong thời lượng video.
3. **Lưu vào SQL Server** với trạng thái **Bản nháp**.
4. Mở lại bản ghi; chuyển **Chờ duyệt** và bấm Lưu. Mở lại, chuyển **Đã xuất bản** và bấm Lưu.
5. **Mở lại bản ghi đã xuất bản**. Hai nút Tải MP3 / Tải MP4 sẽ được bật. Mỗi lần bấm, máy chủ thực sự tổng hợp lời nói và gửi tệp để trình duyệt tải về.
6. MP3 có thể tạo nếu có kịch bản xuất bản; MP4 còn yêu cầu file video gốc đã tải lên thành công.

## Cách dùng — Khách hàng

Đăng nhập khách → **Tài khoản** → **Video của tôi** → **Tệp lồng tiếng đã duyệt** → chọn tải MP3/MP4 theo ngôn ngữ có sẵn. Khách khác không thể tải video của tài khoản này.

## Giới hạn và cách xử lý lỗi

| Mã lỗi | Ý nghĩa / xử lý |
|---|---|
| `narration_not_published` | Kịch bản chưa duyệt và xuất bản; mở trang Admin thực hiện quy trình 2 bước |
| `invalid_timeline` | Có câu thiếu timestamp, không đúng thứ tự hoặc trùng mốc; sửa và lưu SQL |
| `speech_too_long` | Câu quá dài so với khoảng thời gian; kéo dài thời gian hoặc rút ngắn lời đọc |
| `timeline_overflow` | Mốc kết thúc vượt quá độ dài video gốc |
| `video_file_missing` | Không có file video gốc đã tải vào volume, MP3 có thể vẫn xuất được |
| `export_busy` | Có job xuất đang chạy; tải lại sau khi job trước kết thúc |
| `export_unavailable` | Container chưa cài eSpeak NG/FFmpeg; build lại Docker API |
| `export_too_large` | Giới hạn demo: tối đa 600 giây, 100 đoạn, 12.000 ký tự |

**Lưu ý kỹ thuật và minh bạch:**
- Đây là tệp MP3/MP4 **thật**, không phải bản đổi đuôi hoặc chỉ phát trên trình duyệt.
- eSpeak NG là TTS cục bộ, nghe **khá máy móc**, chất lượng chưa tương đương giọng AI tự nhiên. Phải thay thế bằng TTS chất lượng cao có giấy phép phù hợp để triển khai doanh nghiệp.
- Chức năng **thay** tiếng gốc bằng tiếng mới; chưa hỗ trợ giữ nhạc nền, tách giọng gốc, căn chỉnh nâng cao, xuất đồng thời nhiều job, hàng đợi/job worker, hoặc lưu lịch sử tệp đã dựng. Các file đầu ra được dựng theo yêu cầu, tải về rồi xóa tệp tạm trên server. **Kịch bản/phiên bản vẫn lưu SQL Server**.
- Thanh toán vẫn có thể là mô phỏng. Cài bản này **không tự động nâng** dịch vụ Dubchef thành sản phẩm doanh nghiệp hoàn chỉnh.
- Nếu phân phối eSpeak NG/FFmpeg như một sản phẩm, hãy kiểm tra nghĩa vụ giấy phép các thành phần phụ thuộc.
- Không chạy `docker compose down -v` để tránh xóa dữ liệu SQL Server.
