# Dubchef – Tách giao diện quản lý phụ đề và thuyết minh

## 1. Lý do sửa

Ở bản gốc, cả hai màn hình `/admin/subtitles` và `/admin/narrations` cùng dùng `web/src/pages/AdminMediaResults.jsx`. Cơ sở dữ liệu đã tách hai bảng `dbo.PhuDe` và `dbo.ThuyetMinh` nhưng hai trang có cùng giao diện biên tập. Khi người dùng xử lý một video, backend có thể lưu cùng kịch bản ngôn ngữ vào cả hai bảng; điều đó **không phải bản ghi trùng SQL** vì đây là hai loại nội dung riêng, nhưng cần thể hiện rõ nghiệp vụ trên màn hình.

## 2. Đã sửa

- **Phụ đề:** Giao diện biên tập theo dòng và mốc thời gian; xem trước vị trí trên timeline; hiển thị số ký tự và cảnh báo tốc độ đọc cao (>20 ký tự/giây); tải tệp SRT hoặc WebVTT từ nội dung đang mở.
- **Thuyết minh:** Giao diện kịch bản từng đoạn; nghe thử một đoạn hoặc toàn bộ bằng `window.speechSynthesis`; chọn giọng có sẵn trên máy và tốc độ **chỉ để nghe thử**; tải kịch bản TXT. Duy trì start/end của từng đoạn trong phần 'Đồng bộ lời đọc với video'.
- Trang danh sách có tiêu đề, quy trình nghiệp vụ và nút mở biên tập khác nhau; vẫn dùng chung cơ chế trạng thái, lịch sử và version.
- **Không sửa** `docker-compose.yml`, `.env`, bất kỳ file `server/src/` hay `db/` nào. **Không xóa hoặc làm mới dữ liệu SQL.**

### Giới hạn đúng với tính năng hiện tại

Nút **Nghe toàn bộ/Nghe đoạn** dùng giọng nói được hỗ trợ bởi trình duyệt (Chrome/Edge), không tự tạo file MP3/WAV và không lưu cấu hình giọng/tốc độ trong SQL. Xuất SRT/VTT/TXT là thao tác tải tệp từ **nội dung đang biên tập**; muốn lưu thay đổi vào SQL cần nhấn **Lưu vào SQL Server**. Với nghiệp vụ audio thực sự cần backend TTS, lưu đường dẫn audio và quản lý job xử lý riêng.

## 3. File được thay đổi

1. `web/src/pages/AdminMediaResults.jsx` – tách giao diện theo nghiệp vụ.
2. `web/src/components/AdminMediaEditors.jsx` – mới: biên tập riêng phụ đề và thuyết minh.
3. `web/src/utils/adminMediaFormats.js` – mới: xuất SRT/VTT/TXT và xử lý timecode.
4. `web/src/styles.css` – bổ sung CSS trang quản trị.
5. `web/src/test/adminMedia.test.jsx` – cập nhật test cho hai giao diện.
6. `web/src/utils/adminMediaFormats.test.js` – mới: test định dạng phụ đề.
7. `docs/HUONG_DAN_SUA_ADMIN_PHU_DE_THUYET_MINH.md` – hướng dẫn này.

## 4. Cách cập nhật vào thư mục hiện tại (khuyến nghị)

1. Sao lưu thư mục `CNPM` hiện đang chạy.
2. Giải nén `Dubchef_Admin_PhuDe_ThuyetMinh_PATCH.zip`, mở thư mục chứa `web` và `docs` của bản vá.
3. Sao chép các thư mục `web` và `docs` vào **bên trong** thư mục `CNPM` hiện tại, chọn **Replace files / Thay thế các tệp trùng tên**. Các file khác được giữ nguyên.
4. Không xóa `.env` ở gốc hoặc `web/.env`; không chạy `docker compose down -v` vì lệnh này xóa volume SQL Server.
5. Mở VS Code tại thư mục `CNPM`. Docker Desktop phải chạy.
6. Trong Terminal tại gốc CNPM, nếu database/backend chưa chạy: `docker compose up -d --build`.
7. Mở Terminal mới: `cd web`, `npm install`, `npm run dev`.
8. Vào `http://localhost:5173/admin/subtitles` hoặc `/admin/narrations`, đăng nhập bằng tài khoản Admin.

Nếu đang chạy web và Vite không tự cập nhật, bấm `Ctrl+C` ở Terminal frontend rồi chạy lại `npm run dev`.

## 5. Thử nghiệm thủ công trên SQL Server

**Test phụ đề:** mở bản đã có -> thay một câu, sửa mốc thời gian -> nhấn `Lưu vào SQL Server` -> vào lại xem giá trị mới -> `Xuất SRT`/`Xuất VTT` -> kiểm tra timecode và chữ.

**Test thuyết minh:** mở cùng video/ngôn ngữ -> sửa kịch bản -> `Nghe đoạn`/`Nghe toàn bộ` trên Edge/Chrome (tùy giọng hệ điều hành) -> `Xuất kịch bản TXT` -> `Lưu vào SQL Server` -> vào lại xác nhận. Nếu không phát âm thanh, kiểm tra quyền âm thanh trình duyệt và giọng ngôn ngữ trên máy.

**Test độc lập dữ liệu:** sửa chỉ trong `/admin/subtitles` rồi xem `/admin/narrations`. Khi thao tác quản trị trực tiếp, hai bảng lưu độc lập. **Lưu ý:** nếu khách hàng chạy lại chức năng tự xử lý video, backend hiện tại vẫn có cơ chế cập nhật nội dung chưa xuất bản ở cả hai loại, vì nguồn đầu vào dùng chung phân đoạn lời nói.

**Test quy trình duyệt:** chuyển từ `Bản nháp` -> `Chờ duyệt` và lưu; sau đó mở lại, chuyển `Đã xuất bản` và lưu. Không sửa nội dung ngay khi xuất bản để tránh chính sách `review_required`.

Trong SSMS có thể chạy truy vấn xem bản cập nhật:

```sql
SELECT TOP (20) MaVideo, NgonNgu, PhienBan, TrangThaiDuyet, NoiDung, NgayCapNhat
FROM dbo.PhuDe ORDER BY NgayCapNhat DESC;
SELECT TOP (20) MaVideo, NgonNgu, PhienBan, TrangThaiDuyet, NoiDung, NgayCapNhat
FROM dbo.ThuyetMinh ORDER BY NgayCapNhat DESC;
```

## 6. Kiểm tra code

Chạy trong thư mục `CNPM/web`:

```powershell
npm run lint
npm run test
npm run build
```

Tại môi trường xây dựng bản vá, cú pháp JSX, ESLint và phép thử thuần cho SRT/VTT đã đạt. Chưa chạy được `npm run test`/`npm run build` đầy đủ vì gói `node_modules` trong ZIP ban đầu chứa binary dành cho Windows, trong khi môi trường kiểm tra là Linux và tải thêm binary bị gián đoạn. Cần chạy lại ba lệnh trên Windows của bạn.

## 7. Bảo mật

File bản vá và bản source đóng gói không chứa `.env`, `.git` hoặc `node_modules`. Hãy giữ nguyên file `.env` bản cũ tại máy. Không đẩy `.env` hay mật khẩu Admin/TOKEN_SECRET lên GitHub. Nếu những thông tin này từng xuất hiện công khai, nên thay mật khẩu/token.
