# DubchefDB — Từ điển dữ liệu thiết kế

**Phạm vi:** Các cột đặc trưng và quan hệ của schema mục tiêu theo `db/migrations/001...021`. **Không giả định các migration đã được chạy trên CSDL của người sử dụng.** Muốn xuất *mọi cột* và kiểu dữ liệu từ database thật (kể cả cột cũ và cột mới), chạy `db/tests/schema-catalog.sql`: truy vấn trả về danh sách đầy đủ, thứ tự cột, kiểu SQL, NOT NULL, DEFAULT, PK, FK (với ON DELETE), CHECK, INDEX và collation thực tế.

## Quy ước

- Mã `Ma*` là khóa định danh; `PK_*`, `FK_*`, `CK_*`, `DF_*`, `UQ_*`, `IX_*` đặt tên tường minh. Một số tên constraint lịch sử khác chuẩn có thể còn; kiểm chứng với catalog trước khi đổi tên.
- Tiền `BIGINT` theo **đơn vị nhỏ nhất**, không làm tròn bằng FLOAT. `TyGia.VNDChoMotDonVi` là `DECIMAL(19,6)`.
- Thời điểm `DATETIME2(0)` UTC; nhóm báo cáo theo UTC+7. Text tiếng Việt/Trung `NVARCHAR`.
- Cột `NgayTao`, `NgayCapNhat` và `ROWVERSION` hiện **không đồng đều trên tất cả bảng lịch sử**; chưa được chứng nhận tuân thủ 100%, các cột dưới đây mô tả bản thiết kế/trạng thái đã mã hóa.

## Tài khoản, hoạt động và nội dung

| Bảng | Khóa / cột cốt lõi | Vai trò và ràng buộc |
|---|---|---|
| `NguoiDung` | `MaNguoiDung` PK; `Email` UNIQUE; `MatKhauBam`; `VaiTro`; `TrangThai`; `NgayXoa`, `NgayCapNhat` | Tài khoản, hash mật khẩu, vai trò `user/admin`, khóa/ẩn danh hóa thay xóa vật lý; không lưu mật khẩu gốc |
| `NgonNgu` | `MaNgonNgu` PK (`vi`, `en`, `zh`); `TenNgonNgu`, `TenTiengAnh`, `TrangThai` | Danh mục ngôn ngữ; FK tới Video/ThuyetMinh/PhuDe/luồng sử dụng |
| `Video` | `MaVideo` PK, `MaNguoiDung` FK, `NgonNguGoc` FK, `TenTep`, `DungLuong`, `DinhDang`, `ThoiLuong`, `Sha256`, `Nguon`, `TrangThai` | Metadata file; giới hạn dung lượng đọc `CauHinhHeThong.video.maxBytes`; chủ sở hữu được bảo vệ nếu đã tính lượt |
| `ThuyetMinh` | `MaThuyetMinh` PK; `MaVideo` FK; `NgonNgu` FK; `NoiDung` JSON; `TrangThaiDuyet`; `NguoiSuaId` FK tùy chọn | Nội dung lời thuyết minh và duyệt |
| `PhuDe` | `MaPhuDe` PK; `MaVideo` FK; `NgonNgu` FK; `NoiDung` JSON; `TrangThaiDuyet`; `NguoiSuaId` FK tùy chọn | Phụ đề có dữ liệu JSON và lịch sử duyệt |
| `LichSuNoiDung` | `MaLichSu` PK; `MaVideo` FK có thể NULL sau xóa video; `NgonNgu` FK; `NoiDung` JSON; `NguoiSuaId` FK | Nhật ký bản sửa; giữ nội dung khi xóa file |
| `PhanHoi` | `MaPhanHoi` PK; `MaNguoiDung`, `MaVideo` FK; `TrangThai`, `UuTien`; `NguoiXuLyId` | Phản hồi người dùng theo trạng thái |
| `LienHe` | `MaLienHe` PK; `Email`, `NoiDung`, `TrangThai`, `UuTien`; `NguoiXuLyId` FK | Tin nhắn liên hệ và xử lý Admin |
| `LichSuXuLyPhanHoi` | `MaLichSu` PK; `MaPhanHoi` hoặc `MaLienHe` FK, đúng một có giá trị; `NguoiXuLyId` FK | Audit nghiệp vụ, giữ cột `Nguon`, `MaBanGhi` di sản để tương thích |
| `LichSuDangNhap` | Khóa chính lịch sử; tài khoản; dấu thời điểm | Lịch sử đăng nhập; không lưu mật khẩu |
| `LuotTruyCap` | `MaLuot` PK, `MaKhach`, `DuongDan`, `NgonNgu` FK, `NgayTruyCap` | Thống kê truy cập |
| `LuotQuetQR` | `MaLuotQuet` PK, `MaKhach`, `NgonNgu` FK, `NgayQuet` | Thống kê quét QR |

## Đơn hàng, giá và thanh toán

| Bảng | Khóa / cột cốt lõi | Vai trò và ràng buộc |
|---|---|---|
| `DonHang` | `MaDonHang` PK, `MaNguoiDung` FK nullable **chỉ cho lịch sử**, `DonCu` BIT, `SoVideoDang`, `SoVideoDich`, `LoaiTien`, `SoTien`, `TrangThai`, `DonGiaDangSnapshot`, `DonGiaDichSnapshot`, `PhienBanGiaSnapshot`, `GiamGiaSnapshotPct`, `ThoiHanSnapshotNgay` | Một đơn của người mua; đơn mới yêu cầu chủ sở hữu/snapshot; số bản dịch ≤ 3×video; tổng số lượng dương; bản gốc cũ không tự định giá lại |
| `GiaoDich` | `MaGiaoDich` PK; `(MaDonHang,LoaiTien,SoTien)` FK phức hợp tới đơn; `TrangThai`, `PhuongThuc`, `NguonXacNhan`, `PayOSOrderCode`, `PaymentLinkId`, `NgayHetHan` | Trạng thái payment `pending/success/failed/cancelled/expired/refunded`, phương thức `payos` và cũ, mỗi đơn tối đa một `success`; kiểm tra tiền/tiền tệ ở DB |
| `WebhookNhan` | `MaWebhook` PK, `EventId` UNIQUE, `NhaCungCap`, `MaDonHang` FK, `ChuKyHopLe`, `PayloadSha256`, `KetQua`, `NgayNhan` | Chống nhận callback trùng, không lưu raw payload có PII/secret |
| `BangGia` | `LoaiTien` PK, `DonGiaDangMinor`, `DonGiaDichMinor`, `GioiHanVideo`, `GioiHanBanDich`, `PhienBan`, `RowVer` | Giá/giới hạn đang dùng bởi pricing API, version chống sửa ghi đè |
| `BangGiaDonVi` | `MaGia` PK, `LoaiTien`, `DonGiaDangMinor`, `DonGiaDichMinor`, `HieuLucTu` | Lịch sử đơn giá theo hiệu lực, unique tiền tệ và thời điểm (đã thiết kế; kết nối runtime cần kiểm thử thêm) |
| `GoiDichVu` | `MaGoi` PK, tên/giá/số lượt, thời hạn, hiển thị | Cấu hình gói thương mại; chưa chứng nhận toàn bộ màn hình Admin CRUD |
| `TyGia` | `MaTyGia` PK, `LoaiTien`, `VNDChoMotDonVi`, `NgayHieuLuc` | Tỷ giá hiển thị; payOS thu VND; không sử dụng tỷ giá để thay đổi tiền đơn cũ |
| `LichSuBangGia` | Khóa lịch sử; `LoaiTien`, phiên bản cũ/mới, người sửa | Lịch sử thay đổi giá hiện hành |
| `LichSuDoiGia` | `MaLichSu` PK; `LoaiTien`, `MaNguoiDung` FK, `GiaCu/GiaMoi` JSON, `LyDo` | Audit thay đổi giá mở rộng |
| `CauHinhHeThong` | `Khoa` PK, `KieuGiaTri`, `GiaTri`, `PhienBan` ROWVERSION, `NguoiSua` | Cấu hình có kiểm kiểu; ví dụ `video.maxBytes` |

## Quyền lợi, xác minh và vận hành

| Bảng | Khóa / cột cốt lõi | Vai trò và ràng buộc |
|---|---|---|
| `QuyenLoiGoi` | `MaQuyenLoi` PK; `MaDonHang`, `MaNguoiDung` FK phức hợp, số lượt mua/đã dùng, `NgayHetHan` | Quyền lợi sở hữu theo đơn; trigger kiểm tra bộ đếm khớp ledger |
| `SuDungQuyenLoi` | Mã sử dụng PK, `MaQuyenLoi` FK, `MaVideo` FK nullable, `Loai`, `NgonNgu` FK nullable với upload, `TrangThai` | Sổ cái sử dụng lượt, unique lượt tác vụ đang dùng, trigger tăng/giảm bộ đếm có ràng buộc trần |
| `XacMinhChuDonHang` | Khóa xác minh PK; `MaDonHang`, `MaNguoiDung` FK, `NguoiXacMinhId` FK | Gắn chủ cho đơn cũ dựa vào bằng chứng, không dựa vào email như khóa |
| `NhatKyQuanTri` | Khóa nhật ký PK; `NguoiThucHienId` FK, `GiaTriCu`, `GiaTriMoi` NVARCHAR(MAX) | Audit Admin; giữ email actor snapshot trước migration |
| `CongViecXuLy` | `MaCongViec` PK, `MaVideo`, `MaNguoiDung` FK, `Loai`, `TrangThai`, `TienDo`, `SoLanThu`, `Loi` | Hàng đợi ASR/dịch/TTS/xuất; cần worker thực hiện job để hoạt động toàn bộ |
| `TepXuat` | `MaTep` PK, `MaCongViec` FK, `MaVideo` FK, `Loai`, `DuongDan`, `DungLuong`, `Sha256`, `NgayHetHan` | Metadata MP3/MP4/subtitle, file thực lưu ngoài SQL |
| `MaDatLaiMatKhau` | `MaToken` PK, `MaNguoiDung` FK, `TokenSha256` UNIQUE, `NgayHetHan`, `DaDung` | Lưu **băm** token khôi phục, không lưu token thô |
| `LanDangNhapSai` | `IpHash` PK (HMAC), `SoLan`, `HanKhoa` | Giới hạn login phân tán, không lưu địa chỉ IP dạng rõ |
| `SchemaMigrations` | `Version` PK, `FileName`, `ChecksumSha256`, `AppliedAt`, `AppliedBy` | Kiểm soát migration, hash và người chạy; DB không cho chạy lại bản đã sửa hash |

## Về toàn vẹn và chính sách xóa

Mặc định mọi FK dùng `NO ACTION`; FK video gắn với nhật ký xử lý/lượt tiêu dùng có `SET NULL` để giữ lịch sử; FK trực tiếp tới `NguoiDung` không dùng cascade để không làm mất đơn. Người dùng được ẩn danh hóa thay vì xóa cứng. Các quan hệ đã xác minh bằng mã nguồn là **dự định áp dụng**; để biết toàn bộ `ON DELETE` chính xác sau nâng cấp, xem resultset thứ ba từ `db/tests/schema-catalog.sql`.

## Phần CHƯA XÁC MINH

Chưa truy xuất `sys.columns`, `sys.foreign_keys`, `sys.indexes` từ SQL Server sống, chưa đo execution plan hay khẳng định mọi cột lịch sử đã có `CreatedAt/UpdatedAt` và `RowVersion`. Một số bảng được thiết kế dự phòng nhưng backend chưa truy cập. Không diễn giải bảng từ điển này như bằng chứng nghiệm thu SQL chạy thành công.
