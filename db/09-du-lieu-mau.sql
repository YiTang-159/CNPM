/* =====================================================================
   DUBCHEF - DỮ LIỆU MẪU ĐỂ TRÌNH BÀY BÁO CÁO
   Cách dùng : mở trong SSMS, bấm Execute (F5). Sau đó chạy BAO-CAO-DUBCHEF.sql.
   An toàn   : - Chỉ THÊM dòng mới, không sửa hay xóa dữ liệu thật.
               - Mọi dữ liệu mẫu có email @demo.dubchef.local (hoặc mã khách bắt đầu bằng 'demo-').
               - Tài khoản mẫu KHÔNG đăng nhập được (mật khẩu bị vô hiệu).
               - Chạy lại không tạo trùng. Muốn xóa: chạy XOA-DU-LIEU-MAU.sql.
   ===================================================================== */
USE DubchefDB;
GO
SET NOCOUNT ON;
SET XACT_ABORT ON;

IF EXISTS (SELECT 1 FROM dbo.NguoiDung WHERE Email LIKE N'%@demo.dubchef.local')
BEGIN
    PRINT N'Dữ liệu mẫu đã có sẵn, không thêm lần nữa. Muốn làm lại: chạy XOA-DU-LIEU-MAU.sql trước.';
    RETURN;
END;

BEGIN TRY
BEGIN TRANSACTION;

DECLARE @now DATETIME2(0) = SYSUTCDATETIME();

/* ---- Người dùng (5) ------------------------------------------------- */
INSERT dbo.NguoiDung (HoTen, Email, MatKhauBam, VaiTro, TrangThai, NgayTao) VALUES
 (N'Nguyễn Minh Anh', N'minhanh@demo.dubchef.local', 'DEMO-KHONG-DANG-NHAP', 'user', 'active', DATEADD(DAY, -21, @now)),
 (N'Trần Quốc Bảo',   N'quocbao@demo.dubchef.local', 'DEMO-KHONG-DANG-NHAP', 'user', 'active', DATEADD(DAY, -18, @now)),
 (N'Lê Thu Hà',       N'thuha@demo.dubchef.local',   'DEMO-KHONG-DANG-NHAP', 'user', 'active', DATEADD(DAY, -12, @now)),
 (N'Phạm Gia Huy',    N'giahuy@demo.dubchef.local',  'DEMO-KHONG-DANG-NHAP', 'user', 'active', DATEADD(DAY, -9,  @now)),
 (N'Võ Ngọc Lan',     N'ngoclan@demo.dubchef.local', 'DEMO-KHONG-DANG-NHAP', 'user', 'locked', DATEADD(DAY, -6, @now));

INSERT dbo.LichSuDangNhap (MaNguoiDung, ThoiGian, DiaChiIP)
SELECT u.MaNguoiDung, DATEADD(HOUR, -(k.n * 29 + u.MaNguoiDung % 7), @now), N'203.0.113.' + CAST(10 + k.n AS NVARCHAR(3))
FROM dbo.NguoiDung u
CROSS JOIN (VALUES (1), (2), (3), (4)) AS k(n)
WHERE u.Email LIKE N'%@demo.dubchef.local' AND u.TrangThai = 'active';

/* ---- Video (8) ------------------------------------------------------ */
CREATE TABLE #v (Email NVARCHAR(254), TieuDe NVARCHAR(200), TenTep NVARCHAR(255), MB INT, Ngon VARCHAR(8), TrangThai VARCHAR(20), Ngay INT);
INSERT #v VALUES
 (N'minhanh@demo.dubchef.local', N'Hướng dẫn nấu phở bò',   N'pho-bo.mp4',        48, 'vi', 'completed',  18),
 (N'minhanh@demo.dubchef.local', N'Cách làm bánh mì Sài Gòn', N'banh-mi.mp4',      62, 'vi', 'completed',  12),
 (N'quocbao@demo.dubchef.local', N'Bún chả Hà Nội',          N'bun-cha.mp4',       35, 'vi', 'completed',  15),
 (N'quocbao@demo.dubchef.local', N'Fresh spring rolls',      N'goi-cuon.mp4',      28, 'en', 'completed',   9),
 (N'thuha@demo.dubchef.local',   N'Chè khúc bạch',           N'che-khuc-bach.mp4', 41, 'vi', 'processing',  1),
 (N'thuha@demo.dubchef.local',   N'Cơm tấm sườn nướng',      N'com-tam.mp4',       55, 'vi', 'completed',   6),
 (N'giahuy@demo.dubchef.local',  N'Mì Quảng',                N'mi-quang.mp4',      70, 'vi', 'failed',      3),
 (N'giahuy@demo.dubchef.local',  N'Bánh xèo miền Tây',       N'banh-xeo.mp4',      33, 'vi', 'uploaded',    0);

INSERT dbo.Video (MaNguoiDung, TieuDe, TenTep, DungLuong, DinhDang, DuongDan, NgonNguGoc, TrangThai, NgayTaiLen)
SELECT u.MaNguoiDung, v.TieuDe, v.TenTep, CAST(v.MB AS BIGINT) * 1048576, 'video/mp4',
       CASE WHEN v.TrangThai = 'completed' THEN N'demo/' + v.TenTep END,
       v.Ngon, v.TrangThai, DATEADD(DAY, -v.Ngay, DATEADD(HOUR, -v.MB % 11, @now))
FROM #v v JOIN dbo.NguoiDung u ON u.Email = v.Email;
DROP TABLE #v;

/* ---- Thuyết minh và phụ đề cho video hoàn thành (vi + en) ------------- */
INSERT dbo.ThuyetMinh (MaVideo, NgonNgu, NoiDung, TrangThaiDuyet, NguoiSua, NgayTao, NgayCapNhat)
SELECT v.MaVideo, l.Ngon,
       CASE l.Ngon
         WHEN 'vi' THEN N'[{"start":0,"end":4,"text":"Xin chào các bạn, hôm nay chúng ta cùng nấu một món ngon."},{"start":4,"end":9,"text":"Đầu tiên, hãy chuẩn bị đầy đủ nguyên liệu."}]'
         ELSE N'[{"start":0,"end":4,"text":"Hello everyone, today we are cooking a delicious dish together."},{"start":4,"end":9,"text":"First, let us prepare all of the ingredients."}]'
       END,
       CASE WHEN v.MaVideo % 2 = 1 THEN 'published' ELSE 'draft' END,
       N'admin@dubchef.vn', v.NgayTaiLen, v.NgayTaiLen
FROM dbo.Video v
JOIN dbo.NguoiDung u ON u.MaNguoiDung = v.MaNguoiDung AND u.Email LIKE N'%@demo.dubchef.local'
CROSS JOIN (VALUES ('vi'), ('en')) AS l(Ngon)
WHERE v.TrangThai = 'completed';

INSERT dbo.PhuDe (MaVideo, NgonNgu, NoiDung, TrangThaiDuyet, NguoiSua, NgayTao, NgayCapNhat)
SELECT v.MaVideo, l.Ngon,
       CASE l.Ngon
         WHEN 'vi' THEN N'[{"start":0,"end":4,"text":"Xin chào các bạn, hôm nay chúng ta cùng nấu một món ngon."},{"start":4,"end":9,"text":"Đầu tiên, hãy chuẩn bị đầy đủ nguyên liệu."}]'
         ELSE N'[{"start":0,"end":4,"text":"Hello everyone, today we are cooking a delicious dish together."},{"start":4,"end":9,"text":"First, let us prepare all of the ingredients."}]'
       END,
       CASE WHEN v.MaVideo % 2 = 1 THEN 'published' ELSE 'draft' END,
       N'admin@dubchef.vn', v.NgayTaiLen, v.NgayTaiLen
FROM dbo.Video v
JOIN dbo.NguoiDung u ON u.MaNguoiDung = v.MaNguoiDung AND u.Email LIKE N'%@demo.dubchef.local'
CROSS JOIN (VALUES ('vi'), ('en')) AS l(Ngon)
WHERE v.TrangThai = 'completed';

/* ---- Đơn hàng (7) và giao dịch ----------------------------------------
   Tiền lưu theo đơn vị nhỏ nhất: VND = đồng, USD = cent, CNY = xu. */
CREATE TABLE #o (Ten NVARCHAR(100), Email NVARCHAR(254), Dang INT, Dich INT, Tien CHAR(3), SoTien BIGINT, TrangThai VARCHAR(10), Ngay INT, PhuongThuc VARCHAR(10), Ref VARCHAR(40));
INSERT #o VALUES
 (N'Nguyễn Minh Anh', N'minhanh@demo.dubchef.local', 3, 5,  'VND',  299000, 'paid',      17, 'card', 'DEMO-0001'),
 (N'Nguyễn Minh Anh', N'minhanh@demo.dubchef.local', 5, 10, 'VND',  790000, 'paid',       8, 'momo', 'DEMO-0002'),
 (N'Trần Quốc Bảo',   N'quocbao@demo.dubchef.local', 2, 4,  'VND',  199000, 'paid',      14, 'bank', 'DEMO-0003'),
 (N'Trần Quốc Bảo',   N'quocbao@demo.dubchef.local', 1, 2,  'USD',    1290, 'pending',    2, NULL,   NULL),
 (N'Lê Thu Hà',       N'thuha@demo.dubchef.local',   3, 6,  'VND',  490000, 'paid',       5, 'qr',   'DEMO-0004'),
 (N'Phạm Gia Huy',    N'giahuy@demo.dubchef.local',  1, 1,  'CNY',    5900, 'cancelled',  4, NULL,   NULL),
 (N'Võ Ngọc Lan',     N'ngoclan@demo.dubchef.local', 2, 3,  'USD',    1900, 'paid',       10, 'card', 'DEMO-0005');

INSERT dbo.DonHang (TenKhachHang, EmailKhachHang, SoVideoDang, SoVideoDich, LoaiTien, SoTien, TrangThai, NgayTao)
SELECT Ten, Email, Dang, Dich, Tien, SoTien, TrangThai, DATEADD(DAY, -Ngay, @now) FROM #o;

INSERT dbo.GiaoDich (MaDonHang, PhuongThuc, SoTien, LoaiTien, TrangThai, MaThamChieu, NgayThanhToan)
SELECT d.MaDonHang, o.PhuongThuc, o.SoTien, o.Tien, 'success', o.Ref, DATEADD(MINUTE, 7, d.NgayTao)
FROM #o o JOIN dbo.DonHang d ON d.EmailKhachHang = o.Email AND d.SoTien = o.SoTien AND d.LoaiTien = o.Tien
WHERE o.TrangThai = 'paid';

-- Một giao dịch thất bại cho đơn đang chờ thanh toán
INSERT dbo.GiaoDich (MaDonHang, PhuongThuc, SoTien, LoaiTien, TrangThai, MaThamChieu, NgayThanhToan)
SELECT d.MaDonHang, 'card', d.SoTien, d.LoaiTien, 'failed', 'DEMO-F001', DATEADD(MINUTE, 3, d.NgayTao)
FROM dbo.DonHang d WHERE d.EmailKhachHang = N'quocbao@demo.dubchef.local' AND d.TrangThai = 'pending';
DROP TABLE #o;

/* ---- Phản hồi (5) và liên hệ (3) -------------------------------------- */
INSERT dbo.PhanHoi (MaNguoiDung, MaVideo, NoiDung, TrangThai, TraLoi, UuTien, NguoiXuLy, NgayTao, NgayCapNhat, NgayGiaiQuyet)
SELECT u.MaNguoiDung,
       (SELECT TOP 1 v.MaVideo FROM dbo.Video v WHERE v.MaNguoiDung = u.MaNguoiDung AND v.TieuDe = f.TieuDeVideo),
       f.NoiDung, f.TrangThai, f.TraLoi, f.UuTien,
       CASE WHEN f.TrangThai <> 'new' THEN N'admin@dubchef.vn' END,
       DATEADD(DAY, -f.Ngay, @now), DATEADD(DAY, -f.Ngay, DATEADD(HOUR, 5, @now)),
       CASE WHEN f.TrangThai = 'resolved' THEN DATEADD(DAY, -f.Ngay, DATEADD(HOUR, 5, @now)) END
FROM (VALUES
 (N'minhanh@demo.dubchef.local', N'Hướng dẫn nấu phở bò', N'Phụ đề tiếng Anh chưa khớp ở đoạn 0:45, nhờ bên mình kiểm tra lại.', 'reviewing', CAST(NULL AS NVARCHAR(2000)), 'high',   4),
 (N'quocbao@demo.dubchef.local', CAST(NULL AS NVARCHAR(200)), N'Mong có thêm gói thuyết minh giọng nữ.', 'new', NULL, 'normal', 2),
 (N'thuha@demo.dubchef.local',   N'Chè khúc bạch',     N'Video xử lý quá lâu, nhờ kiểm tra giúp.', 'new', NULL, 'high', 1),
 (N'giahuy@demo.dubchef.local',  N'Mì Quảng',          N'Video báo lỗi khi xử lý.', 'resolved', N'Chúng tôi đã khắc phục lỗi, bạn vui lòng tải video lên lại nhé.', 'normal', 3),
 (N'minhanh@demo.dubchef.local', CAST(NULL AS NVARCHAR(200)), N'Cảm ơn Dubchef, dịch vụ rất tiện lợi.', 'resolved', N'Cảm ơn bạn đã ủng hộ Dubchef!', 'low', 7)
) AS f(Email, TieuDeVideo, NoiDung, TrangThai, TraLoi, UuTien, Ngay)
JOIN dbo.NguoiDung u ON u.Email = f.Email;

INSERT dbo.LienHe (HoTen, Email, NoiDung, NgayTao, TrangThai, TraLoi, UuTien, NgayCapNhat)
VALUES
 (N'Đặng Thanh Tùng', N'thanhtung@demo.dubchef.local', N'Cho mình hỏi gói doanh nghiệp có hỗ trợ xuất hóa đơn không?', DATEADD(DAY, -3, @now), 'new', NULL, 'normal', DATEADD(DAY, -3, @now)),
 (N'Hoàng Mai Chi',   N'maichi@demo.dubchef.local',    N'Website có hỗ trợ dịch sang tiếng Trung không?', DATEADD(DAY, -5, @now), 'resolved', N'Có, Dubchef hỗ trợ tiếng Việt, tiếng Anh và tiếng Trung.', 'normal', DATEADD(DAY, -5, @now)),
 (N'Bùi Khánh Linh',  N'khanhlinh@demo.dubchef.local', N'Tôi muốn hợp tác quảng bá dịch vụ.', DATEADD(DAY, -1, @now), 'reviewing', NULL, 'high', DATEADD(DAY, -1, @now));

/* ---- Truy cập website (120 lượt) và quét QR (24 lượt) ----------------- */
INSERT dbo.LuotTruyCap (MaKhach, DuongDan, NgonNgu, NgayTruyCap)
SELECT 'demo-' + CAST(n % 30 AS VARCHAR(3)),
       CHOOSE(n % 5 + 1, N'/', N'/features', N'/pricing', N'/demo', N'/about'),
       CHOOSE(n % 3 + 1, 'vi', 'vi', 'en'),
       DATEADD(MINUTE, -((n * 241) % 28800), @now)
FROM (SELECT TOP (120) CAST(ROW_NUMBER() OVER (ORDER BY (SELECT NULL)) AS INT) AS n FROM sys.all_objects a CROSS JOIN sys.all_objects b) x;

INSERT dbo.LuotQuetQR (MaKhach, NgonNgu, NgayQuet)
SELECT 'demo-qr-' + CAST(n % 15 AS VARCHAR(3)),
       CHOOSE(n % 3 + 1, 'vi', 'en', 'vi'),
       DATEADD(MINUTE, -((n * 977) % 14400), @now)
FROM (SELECT TOP (24) CAST(ROW_NUMBER() OVER (ORDER BY (SELECT NULL)) AS INT) AS n FROM sys.all_objects a CROSS JOIN sys.all_objects b) x;

COMMIT TRANSACTION;
PRINT N'Đã thêm dữ liệu mẫu: 5 người dùng, 8 video, 7 đơn hàng, 5 phản hồi, 3 liên hệ, 120 lượt truy cập, 24 lượt quét QR.';
PRINT N'Bước tiếp theo: chạy BAO-CAO-DUBCHEF.sql hoặc npm run report.';
END TRY
BEGIN CATCH
    IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION;
    IF OBJECT_ID('tempdb..#v') IS NOT NULL DROP TABLE #v;
    IF OBJECT_ID('tempdb..#o') IS NOT NULL DROP TABLE #o;
    PRINT N'Không thêm được dữ liệu mẫu (đã hoàn tác, không có gì bị thay đổi). Lỗi: ' + ERROR_MESSAGE();
END CATCH;
