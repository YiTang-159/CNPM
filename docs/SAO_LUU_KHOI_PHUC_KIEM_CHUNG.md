# Dubchef — Sao lưu, thử khôi phục và khôi phục dữ liệu (Windows 11 + Docker Desktop)

## Phạm vi và yêu cầu an toàn

Bộ công cụ này dành cho cấu hình Dubchef hiện tại:

- `dubchef-db`: SQL Server 2022, database **DubchefDB**, dữ liệu chính trong Docker volume `dubchef_dubchef-data`.
- `dubchef-api`: video/đầu ra nhị phân trong Docker volume `dubchef_dubchef-uploads`.
- `dubchef-ollama`: mô hình Ollama là tài nguyên có thể tải lại, **không** nằm trong bản sao lưu này.
- `.env` chứa thông tin bí mật và **không được** chép vào bản sao lưu tự động. Hãy lưu riêng bằng kho bí mật được mã hóa.

Bộ công cụ không thay `docker-compose.yml`, không khởi tạo/xóa dữ liệu trong quá trình sao lưu và không chạm DB thật khi **thử** khôi phục. Nó chỉ tạm dừng API trong quá trình chụp dữ liệu cho nhất quán rồi khởi động lại nếu trước đó API đang chạy. SQL Server vẫn hoạt động. Không cho phép nhập liệu bằng SSMS hoặc ứng dụng khác trong thời gian sao lưu.

> **KHÔNG** chạy `docker compose down -v`. Backup `.bak` và archive video có chứa thông tin khách hàng: bảo vệ bằng quyền truy cập, ổ mã hóa (BitLocker) hoặc kho lưu trữ mã hóa; không upload lên GitHub hoặc chat công khai.

## A. Cài bộ công cụ vào dự án hiện tại

1. Sao lưu thư mục dự án trước khi chép vá. Trong bản vá chỉ có file mới thuộc `scripts/`, `server/scripts/`, `docs/` và `.gitignore`. Không có thay đổi API, `.env`, SQL schema hoặc Docker Compose.
2. Mở Docker Desktop, đứng trong thư mục gốc `CNPM` (có `docker-compose.yml`).
3. Chạy:

```powershell
# Chỉ build image để chứa công cụ bảo trì; không xóa database/volume
 docker compose build api
 docker compose up -d db
 docker compose ps -a
```

Cần có ít nhất SQL container `dubchef-db` đang chạy. API có thể đang chạy hoặc đã dừng do sự cố. Máy cần đủ dung lượng cho bản `.bak` và video, cộng dung lượng tạm để kiểm thử khôi phục SQL.

## B. Tạo sao lưu VÀ kiểm chứng khôi phục

Ở thư mục **CNPM**:

```powershell
node scripts/backup-dubchef.mjs backup
```

Chương trình sẽ:

1. Xác nhận SQL Docker đang chạy và xác định volume lưu video.
2. Nếu API đang chạy: dừng API để ngăn ghi đồng thời.
3. Gọi SQL Server `BACKUP DATABASE [DubchefDB] WITH COPY_ONLY, COMPRESSION, CHECKSUM`.
4. Sao chép `.bak` ra máy và tạo `uploads.tar.gz` bằng container tạm của dịch vụ API qua Docker Compose, từ volume video hiện tại (không tra cứu mã image SHA cũ).
5. **Khởi động lại API** nếu trước đó API đang chạy, kể cả khi sao lưu lỗi.
6. Tính SHA-256 và kích thước của hai tệp, ghi `manifest.json`.
7. Sao chép `.bak` trở lại SQL container, `RESTORE VERIFYONLY WITH CHECKSUM`, **RESTORE vào database tạm** `DubchefRestoreCheck_...`, chạy `DBCC CHECKDB`, kiểm tra có bảng nghiệp vụ, rồi xóa DB tạm.
8. Kiểm tra cấu trúc `uploads.tar.gz` và tạo `verification.json` nếu toàn bộ bước đều thành công.

Kết quả ví dụ:

```text
CNPM/backups/dubchef_20261114_110000_a1b2c3d4/
  database.bak
  uploads.tar.gz
  manifest.json
  verification.json
```

**Chỉ khi có `verification.json` và dòng `BACKUP_AND_RESTORE_VERIFICATION_PASSED` mới xem bản backup là đã kiểm chứng.** Nếu lỗi, thư mục có thể chứa `BACKUP_FAILED.txt`; không dùng bản đó để khôi phục cho đến khi khắc phục nguyên nhân.

> Lưu ý: SQL khôi phục thử trên cùng SQL Server nhưng **bằng một tên DB riêng**. Nó không ghi đè `DubchefDB`, nhưng cần đủ dung lượng ổ đĩa chứa thêm một bản DB.

## C. Kiểm chứng lại một bản sao lưu cũ

Thay tên thư mục bằng tên được tạo tại bước B:

```powershell
node scripts/backup-dubchef.mjs verify backups/dubchef_20261114_110000_a1b2c3d4
```

Lệnh này sẽ kiểm tra SHA-256, mở archive video và **thử RESTORE vào DB riêng + DBCC CHECKDB** một lần nữa, không ghi đè SQL/Video hiện hành. Nếu archive bị thay đổi hoặc hỏng, lệnh sẽ dừng trước khi khôi phục.

## D. Chỉ khi CẦN CỨU DỮ LIỆU — khôi phục bản thật

**NGUY HIỂM: thao tác này ghi đè TOÀN BỘ `DubchefDB` và toàn bộ video trong volume uploads. Những thay đổi sau thời điểm sao lưu sẽ mất.** Trước khi khôi phục nên tạo bản backup mới của hiện trạng (nếu còn khả thi), lưu ở chỗ khác; đưa hệ thống vào bảo trì và xác nhận không còn chương trình nào ghi SQL.

Lệnh được bảo vệ bằng cụm xác nhận bắt buộc:

```powershell
node scripts/backup-dubchef.mjs restore backups/dubchef_20261114_110000_a1b2c3d4 RESTORE_DUBCHEF
```

Trình tự: kiểm tra SHA-256 + thử khôi phục DB tạm trước; tạm dừng API; khôi phục `DubchefDB` bằng SQL Server `RESTORE DATABASE ... WITH REPLACE` từ `.bak` và chạy `DBCC CHECKDB`; thay thế volume video bằng archive; khởi động lại API nếu ban đầu API đang chạy. **Nếu SQL restore thành công nhưng video restore thất bại**, không sử dụng ứng dụng: xem log và khôi phục lại đồng bộ cùng một bộ backup.

Lệnh thử khôi phục và lệnh khôi phục thật **không bao giờ chạy tự động khi `docker compose up` hoặc khi khởi động API**.

## E. Kiểm tra sau khôi phục thật

```powershell
docker compose ps -a
docker logs --tail 80 dubchef-api
curl.exe http://localhost:3000/api/health
```

Mở SSMS → `localhost,1433` → `DubchefDB`, chạy:

```sql
USE DubchefDB;
SELECT DB_NAME() AS TenCSDL;
SELECT COUNT(*) AS SoNguoiDung FROM dbo.NguoiDung;
SELECT COUNT(*) AS SoDonHang FROM dbo.DonHang;
SELECT COUNT(*) AS SoVideo FROM dbo.Video;
DBCC CHECKDB(N'DubchefDB') WITH NO_INFOMSGS;
```

Sau đó đăng nhập User/Admin; thử mở lại một video đã có; đối chiếu một đơn hàng cũ và tệp MP4/MP3 nếu đã xuất trước thời điểm backup.

## F. Bằng chứng để trình bày với giảng viên

Chụp màn hình/đính kèm trong báo cáo:

1. Terminal báo `BACKUP_AND_RESTORE_VERIFICATION_PASSED`.
2. Thư mục backup có đủ 4 file (nhưng **không** chia sẻ `.bak` thật chứa dữ liệu cá nhân).
3. `verification.json` có `databaseRestore: PASS`, `integrityCheck: PASS`, `uploadsArchive: PASS`, `sha256: PASS`.
4. Log `RESTORE_TEST_OK` và `DBCC_CHECKDB_OK`.
5. Bản ghi video/đơn hàng trong SSMS trước và sau một **lần thử khôi phục ở môi trường riêng**.

Không được khẳng định “đã kiểm chứng khôi phục” chỉ vì tạo được `.bak`. Phải thực sự chạy lệnh verify thành công trên máy có Docker/SQL của bạn.

## G. Giới hạn của giải pháp

- Đây là sao lưu SQL **đầy đủ theo thời điểm**, không phải backup transaction-log để khôi phục đến từng phút (PITR).
- Tạm dừng API khi sao lưu; để doanh nghiệp hoạt động 24/7 cần thiết kế snapshot/backup trực tuyến và đồng bộ media chuyên nghiệp hơn.
- Không tự sao lưu `.env` hoặc trọng số Ollama. Hãy dùng kho bí mật riêng và ghi lại mô hình `qwen2.5:3b` để tải lại bằng `docker exec dubchef-ollama ollama pull qwen2.5:3b`.
- File backup đang nằm trên cùng máy Windows; **chưa** có bản sao ở nơi khác, mã hóa tự động hoặc lịch sao lưu định kỳ. Nên mã hóa rồi chuyển bản sao sang ổ đĩa/cloud độc lập, áp dụng nguyên tắc 3-2-1 và thử khôi phục định kỳ.
- Nếu thay đổi tên project/volume Docker Compose, cần sửa tên `dubchef_dubchef-uploads` trong công cụ.
- Khi khôi phục DB từ mã nguồn phiên bản cũ, đồng bộ phiên bản API/migration để tránh chạy migration mới ngoài ý muốn.

Nếu lệnh bị dừng đột ngột bằng Ctrl+C trong lúc API đang tạm dừng, kiểm tra trạng thái và tự khởi động lại API bằng:

```powershell
docker compose start api
docker compose ps -a
```


## H. Khắc phục lỗi Docker `No such image: sha256:...` khi sao lưu video

Nếu Terminal báo `SQL_BACKUP_OK` rồi `docker: Error response from daemon: No such image: sha256:...` thì **bản sao lưu CHƯA hoàn tất**, dù file `database.bak` đã được chép về máy. File `.bak` đơn lẻ chưa đủ để khôi phục video, và chưa có `verification.json`.

Nguyên nhân của script cũ là lấy image API theo ID `docker compose images -q api`, trong khi image có thể đã bị Docker xóa sau khi build/đổi phiên bản. Bản vá này không dùng ID đó nữa; bước sao lưu video chạy `docker compose run --rm -T --no-deps --entrypoint sh ... api` và dùng chung volume video của API.

Tại thư mục gốc CNPM, sau khi chép **file `scripts/backup-dubchef.mjs` bản mới**, chạy:

```powershell
Test-Path .\scripts\backup-dubchef.mjs
node --test .\scripts\backup-dubchef.test.mjs
node .\scripts\backup-dubchef.mjs backup
```

**Không** chạy `restore ... RESTORE_DUBCHEF` chỉ để kiểm tra. Chỉ kết luận thử khôi phục đã thành công khi có thông báo `BACKUP_AND_RESTORE_VERIFICATION_PASSED` và file `verification.json` trong thư mục backup mới. Những thư mục backup có `BACKUP_FAILED.txt` là bản sao lưu chưa đủ và không dùng để khôi phục sản xuất.

Nếu xuất hiện lỗi mới từ `docker compose run`, xem toàn bộ dòng báo lỗi mới và kiểm tra `docker compose ps -a`; tránh xóa volume/SQL Server.
