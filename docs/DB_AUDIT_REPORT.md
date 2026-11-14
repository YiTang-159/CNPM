# BÁO CÁO RÀ SOÁT VÀ GIA CỐ TOÀN VẸN CSDL DUBCHEF — 15/11/2026

**Phạm vi:** chỉnh sửa bản mã nguồn Dubchef được cung cấp trong cuộc trò chuyện, SQL Server 2022, Node.js và cấu hình Docker. **Không truy cập được SQL Server thật trên máy người sử dụng, không chạy được migration lên database sống hoặc bản khôi phục ở môi trường sửa mã này.** Vì vậy **chưa nghiệm thu hoàn thành, chưa chứng nhận không còn lỗ hổng, không tự chấm 10/10.**

**Nguyên tắc giữ dữ liệu:** không có lệnh `DROP TABLE/DROP DATABASE` trong 16 file migration chuẩn; dữ liệu tiền/đơn hàng lịch sử mâu thuẫn khiến migration **THROW** chứ không xóa hoặc tự chỉnh. Bài test tích hợp dùng CSDL tạm tên ngẫu nhiên và chỉ xóa DB tạm do chính test tạo; không dùng `DubchefDB` của người dùng.

## I. Nhận định từ mã nguồn trước khi sửa (không phải output truy vấn SQL thật)

| Mức | Lỗ hổng phát hiện | Xử lý nguồn | Trạng thái nghiệm thu |
|---|---|---|---|
| **CRITICAL** | DB init trong `server/src/db.js` tự chạy các SQL rời theo danh sách thiếu bước, API có nguy cơ giữ quyền DDL | `migrationPlan.mjs`, `migrations.mjs`, `run-migrations.mjs`, dịch vụ `migrate` riêng, có `SchemaMigrations` SHA-256 | **Chưa chạy SQL** |
| **CRITICAL** | `GiaoDich` trước đó cho phép số tiền khác đơn; doanh thu nhầm demo và legacy | `015_financial_integrity.sql` FK phức hợp số tiền/loại tiền, UNIQUE success; `018_revenue_views.sql`, `020_admin_report_views.sql` thống nhất nguồn payOS UTC+7 | **Chưa chạy SQL** |
| **HIGH** | Thao tác thanh toán chưa có bảng nhận webhook/tính idempotent | `WebhookNhan`, kiểm eventId/sha256, cập nhật `server/src/db.js` & `app.js` | Unit tests một phần; chưa payOS thật |
| **HIGH** | Đơn cũ không có chủ; đơn mới thiếu snapshot lịch sử giá | `DonCu` đánh dấu dữ liệu cũ, `CK_DonHang_ChuVaGiaMoi`, `GiamGiaSnapshotPct`, composite FK quyền lợi | Chưa thử DB trắng & legacy |
| **HIGH** | Nhiều quan hệ ngôn ngữ/video/quyền lợi là quan hệ logic không có FK | `016_foreign_keys.sql`, `021_actor_identity.sql`; `WITH CHECK` nên dữ liệu sai cũ chặn nâng cấp | Chưa chạy SQL |
| **HIGH** | Bộ đếm quyền lợi có thể lệch sổ lượt dùng | `TR_SuDungQuyenLoi_BoDem`, `TR_QuyenLoiGoi_DemHopLe`; bỏ cập nhật trùng trong `entitlements.js` | Chưa kiểm thử SQL thật/concurrency |
| **HIGH** | Login fail counter trước đó nằm RAM, APP dùng `sa` | Bảng `LanDangNhapSai` keyed HMAC, `server/scripts/provision-db-users.mjs`, cấu hình DB_APP_USER tách migration | Chưa provision/login ít quyền trên live DB |
| **MEDIUM** | JSON, trạng thái duyệt/contact và dung lượng video thiếu kiểm soát DB | CHECK JSON/state, `video.maxBytes` ở `CauHinhHeThong` và trigger | Chưa thử constraint trên SQL |
| **MEDIUM** | FK thiếu index, tên constraint không chuẩn | Index mới, đặt tên PK cho bảng lịch sử, catalog kiểm tra metadata | Chưa đo execution plan và FK index thật |
| **HIGH** | API xóa tài khoản cũ có đường `DELETE FROM dbo.NguoiDung` | `server/src/db.js` chuyển endpoint DELETE sang ẩn danh hóa/khóa account, 409 với người dùng có đơn; `listUsers` không hiển thị user đã xóa mềm. Không xóa hàng ghi lịch sử | Unit API PASS; chưa SQL integration |
| **MEDIUM** | Các report cũ và SQL SHA2 tài khoản di sản dễ chạy nhầm | Chuyển các file SHA2/Supabase/report cũ sang `db/legacy`, khóa script cài cũ, `db/queries.sql` đọc chuẩn | Source thay đổi; cần kiểm tra tài liệu liên quan |

## II. Chuỗi migration & phương pháp kiểm chứng

**Có 16 file SQL chuẩn** trong `db/migrations/`, phiên bản: `001, 002, 004, 007, 010, 011, 012, 013, 014, 015, 016, 017, 018, 019, 020, 021` (không tạo record giả cho số bỏ trống do SQL SHA2 và báo cáo di sản). Danh sách duy nhất: `server/src/migrationPlan.mjs`; runner Node: `server/src/migrations.mjs`; file dùng trong SSMS: `db/migrations/RUN_ALL_IN_SSMS.sql` sinh từ cùng source, so SHA-256. Có transaction + `sp_getapplock`, ghi checksum và actor.

**Lệnh thực đã chạy:**

```text
node db/scripts/export-ssms.mjs
→ SSMS script: .../db/migrations/RUN_ALL_IN_SSMS.sql (16 migrations; SHA-256 verified)

node --test server/test/migration-plan.test.mjs
→ tests 3; pass 3; fail 0; skipped 0

python scripts/package-share.py --check
→ PASS: 542 file nguồn; loại 1 file riêng tư, tệp rác hoặc thư viện.
```

**Không có output của SQL Server**: cả preflight, 16 migration trên DB trắng/legacy, chạy lại lần 2, catalog, kiểm tra dữ liệu sai và `integrity-audit.sql` đều **CHƯA XÁC MINH**. Nếu chưa có backup đã khôi phục thử, chưa nên chạy file migration trên `DubchefDB` đang dùng.

## III. Bằng chứng test (chạy thật tại môi trường hiện tại)

| Lệnh thực đã chạy | PASS | FAIL | SKIP | Bằng chứng |
|---|---:|---:|---:|---|
| `node --test shared/*.test.mjs` | 24 | 0 | 0 | `docs/evidence/database/shared-test.txt` |
| `node --test server/test/*.test.mjs` | 71 | **4** | 0 | `docs/evidence/database/backend-test.txt` |
| `node --test server/test/migration-plan.test.mjs` | 3 | 0 | 0 | `docs/evidence/database/migrations-source-test.txt` |
| `node --check` (6 tệp source/test JS) | hoàn thành | 0 cú pháp | — | `docs/evidence/database/node-syntax-check.txt` |
| `python scripts/package-share.py --check` | PASS | 0 lỗi package | — | `docs/evidence/database/package-check.txt` |

**Bốn thất bại backend, không bị bỏ qua:**
1. `audioExport.test.mjs`: `export_unavailable` do môi trường hiện không có eSpeak NG.
2. `media.integration.test.mjs`: `export_unavailable` vì thiếu engine eSpeak NG/FFmpeg thật.
3. `integrity.integration.test.mjs`: `DB_PASSWORD required; use CI SQL Server service`; không kết nối DB.
4. `sql.integration.test.mjs`: `DB_PASSWORD required`; không kết nối DB.

Đã chỉnh CI (`.github/workflows/ci.yml`) để chạy **cả hai** SQL integration tests với SQL Server service container và `DB_TRUST_SERVER_CERTIFICATE=true` cho chứng chỉ tự ký ở CI. Đây là **cấu hình chưa được GitHub Actions chạy/xác nhận**, không phải bằng chứng CI xanh.

## IV. Integrity audit và dữ liệu sai (chưa nghiệm thu SQL)

- **Trước migration:** `db/tests/preflight-existing.sql` trả số dòng bảng và sự kiện thanh toán mâu thuẫn, không thay đổi dữ liệu, dùng được trước khi có các bảng mới.
- **Sau migration:** `db/tests/integrity-audit.sql` in `PASS/FAIL/WARN` cho PK, FK/CHECK trusted, payment/order mismatch, success duplicate, quyền lợi, video owner, JSON, ngôn ngữ, ẩn danh/legacy, doanh thu, FK index, quyền `dubchef_app`; `THROW 51999` khi có FAIL.
- **Danh mục metadata thực tế:** `db/tests/schema-catalog.sql` truy vấn `sys.columns`, `sys.foreign_keys`, `sys.index_columns`, `sys.check_constraints`, `SchemaMigrations`; có kiểm tra collation.
- **Bộ negative tests SQL:** `server/test/integrity.integration.test.mjs` cố tình chèn đơn âm, ngôn ngữ `xx`, giao dịch sai tiền, giao dịch thành công thứ hai, JSON hỏng, tiêu lượt của video người khác, vượt quota; tạo DB tạm và rollback/xóa *chỉ DB tạm*. **Chưa chạy được do không có SQL Server trong môi trường này**.

**Không thể ghi PASS trước/sau ở đây.** Chỉ điền số liệu vào báo cáo nghiệm thu khi các câu truy vấn được chạy trên một bản khôi phục đã kiểm chứng, với output thực tế. Cũng cần chạy actual execution plans cho `db/queries.sql` để đánh giá index và kế hoạch truy vấn.

## V. Hạng mục chưa hoàn chỉnh hoặc còn rủi ro

1. **CSDL lịch sử thực tế chưa được đối chiếu:** có thể tồn tại giao dịch sai số tiền/đơn thiếu thành công, ngôn ngữ mồ côi, đếm lượt lệch. Migration có chủ đích dừng khi vi phạm; cần đối soát được phê duyệt, không tự sửa số tiền cũ.
2. **Cấu hình runtime local có thể dùng `sa`**, vì không thể tự tạo/đổi mật khẩu database trên máy người dùng. Chỉ sau khi chạy script provisioning và cấu hình `DB_APP_USER` mới có thể chứng minh app ít quyền. Tài khoản migrator hiện dùng db_ddladmin (không sysadmin), nhưng không phải tối thiểu theo mô hình cấp phép chi tiết từng object.
3. **Chưa chuẩn hóa tất cả `CreatedAt`/`UpdatedAt` và RowVersion trên bảng di sản**. FK actor được thêm dưới dạng nullable để bảo toàn dữ liệu cũ, chưa thể buộc `NOT NULL` với lịch sử không xác minh.
4. **Giới hạn số lượng bản dịch** còn đang phản ánh tối đa 3 ngôn ngữ theo CK; tùy chọn giới hạn động từ bảng giá cần kiểm tra chéo backend/triggers.
5. **Giá lịch sử có nhiều bảng (`BangGia`, `BangGiaDonVi`, `LichSuBangGia`, `LichSuDoiGia`)**: bảng đang sử dụng bởi API là `BangGia`; các bảng mới lưu chính sách/lịch sử chưa được tích hợp đầy đủ vào API. Không tuyên bố đã có một nguồn giá hoàn toàn thống nhất.
6. **CSDL không thể dùng CHECK để bảo đảm mọi đơn `paid` có transaction `success` trong mọi thứ tự giao dịch**; audit phát hiện tình trạng lệch, nhưng chưa có transaction/procedure thống nhất để ngăn toàn bộ trường hợp trực tiếp sửa `TrangThai`. Cần thêm quy trình giao dịch trả tiền đã được SQL integration chứng minh.
7. **Chưa kiểm thử concurrency thực** của webhook, trừ lượt/rollback, hai tiến trình API và migration. Chưa thử soft-delete làm sạch PII ở tất cả bảng phụ.
8. **Chưa thực thi xóa/khôi phục quyền cấp độ SQL và cấu hình production** trên môi trường người dùng. Hướng dẫn chỉ là các bước để quản trị viên thực hiện.
9. **Không đạt chuẩn tuyệt đối 100% SQL parameterization** cho từng câu query chưa được static scanner toàn diện truy theo mã nguồn; các tên bảng/DB dynamic dùng whitelist nội bộ, cần code review bổ sung.

## VI. Kế hoạch nghiệm thu bắt buộc trên máy có Docker/SQL thật

1. Sao lưu SQL, **khôi phục** thành database staging riêng; giữ `.env`, SQL volume cũ.
2. Chạy `db/tests/preflight-existing.sql` trên bản staging và lưu kết quả đếm sai lệch không chứa thông tin riêng tư.
3. Nếu dữ liệu không mâu thuẫn, chọn DB staging trong SSMS chạy `db/migrations/RUN_ALL_IN_SSMS.sql` (hoặc `node server/scripts/run-migrations.mjs` với `DB_NAME=...` staging), không chạy lên DB production.
4. Chạy lại lần 2, kiểm checksum trong `SchemaMigrations`, chạy `db/tests/integrity-audit.sql` và `db/tests/schema-catalog.sql`, xuất output thật.
5. Chạy hai SQL integration tests trong CI/service SQL Server, có eSpeak/FFmpeg; phải PASS tất cả, 0 SKIP. Kiểm tra xóa user/ẩn danh không mất lịch sử và query plan của báo cáo.
6. Chỉ sau khi tất cả PASS, thử upgrade production theo runbook, có backup và kịch bản rollback sẵn.

**Kết luận:** Đã gia cố mã nguồn, hình thức migration và lớp kiểm tra SQL; **chưa có bằng chứng để khẳng định CSDL DubchefDB trên máy người dùng không còn lỗ hổng hoặc đạt 10/10**. Mọi kết quả unit và kiểm tra nguồn đã ghi theo lệnh/output thật, không thay thế nghiệm thu SQL.
