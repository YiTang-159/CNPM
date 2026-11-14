/* =====================================================================
   DUBCHEF - BÁO CÁO QUẢN TRỊ (phiên bản trình bày)
   Cách dùng : mở tệp này trong SSMS, bấm Execute (F5). Chạy lại bao nhiêu lần cũng được.
   An toàn   : chỉ tạo VIEW và đọc dữ liệu; không thêm, sửa, xóa dữ liệu nào.
   Giờ       : hiển thị theo giờ Việt Nam (UTC+7); dữ liệu gốc lưu UTC.
   ===================================================================== */
USE DubchefDB;
GO
SET NOCOUNT ON;
GO
IF SCHEMA_ID(N'bc') IS NULL EXEC (N'CREATE SCHEMA bc');
GO

/* ---- 1. Báo cáo tổng hợp (dạng dọc: Nhóm / Chỉ số / Giá trị) ---------- */
CREATE OR ALTER VIEW bc.BaoCaoTongHop AS
SELECT STT, [Nhóm], [Chỉ số], [Giá trị], [Ghi chú]
FROM (VALUES
 (1 , N'Người dùng', N'Tổng số người dùng',            (SELECT COUNT(*) FROM dbo.NguoiDung WHERE VaiTro='user'), N''),
 (2 , N'Người dùng', N'Đăng ký mới trong 7 ngày',      (SELECT COUNT(*) FROM dbo.NguoiDung WHERE VaiTro='user' AND NgayTao >= DATEADD(DAY,-7,SYSUTCDATETIME())), N''),
 (3 , N'Người dùng', N'Tài khoản bị khóa',             (SELECT COUNT(*) FROM dbo.NguoiDung WHERE TrangThai='locked'), N''),
 (4 , N'Người dùng', N'Quản trị viên đang hoạt động',  (SELECT COUNT(*) FROM dbo.NguoiDung WHERE VaiTro='admin' AND TrangThai='active'), N'Phải lớn hơn 0'),
 (5 , N'Nội dung',   N'Tổng số video',                 (SELECT COUNT(*) FROM dbo.Video), N''),
 (6 , N'Nội dung',   N'Video hoàn thành',              (SELECT COUNT(*) FROM dbo.Video WHERE TrangThai='completed'), N''),
 (7 , N'Nội dung',   N'Video đang xử lý',              (SELECT COUNT(*) FROM dbo.Video WHERE TrangThai='processing'), N''),
 (8 , N'Nội dung',   N'Video xử lý thất bại',          (SELECT COUNT(*) FROM dbo.Video WHERE TrangThai='failed'), N''),
 (9 , N'Nội dung',   N'Dung lượng video (MB)',         (SELECT CAST(ISNULL(SUM(DungLuong),0)/1048576 AS BIGINT) FROM dbo.Video), N''),
 (10, N'Kinh doanh', N'Tổng số đơn hàng',              (SELECT COUNT(*) FROM dbo.DonHang), N''),
 (11, N'Kinh doanh', N'Đơn đã thanh toán',             (SELECT COUNT(*) FROM dbo.DonHang WHERE TrangThai='paid'), N''),
 (12, N'Kinh doanh', N'Đơn chờ thanh toán',            (SELECT COUNT(*) FROM dbo.DonHang WHERE TrangThai='pending'), N''),
 (13, N'Kinh doanh', N'Doanh thu payOS đã xác minh (VND)',    (SELECT ISNULL(SUM(SoTien),0) FROM dbo.GiaoDich WHERE TrangThai='success' AND NguonXacNhan='payos' AND LoaiTien='VND'), N'Chỉ tính giao dịch thành công'),
 (14, N'Tương tác',  N'Lượt truy cập website',         (SELECT COUNT(*) FROM dbo.LuotTruyCap), N''),
 (15, N'Tương tác',  N'Lượt truy cập 7 ngày gần nhất', (SELECT COUNT(*) FROM dbo.LuotTruyCap WHERE NgayTruyCap >= DATEADD(DAY,-7,SYSUTCDATETIME())), N''),
 (16, N'Tương tác',  N'Lượt quét mã QR',               (SELECT COUNT(*) FROM dbo.LuotQuetQR), N''),
 (17, N'Tương tác',  N'Số người quét mã QR',           (SELECT COUNT(DISTINCT MaKhach) FROM dbo.LuotQuetQR), N'Không tính trùng'),
 (18, N'Hỗ trợ',     N'Phản hồi chưa xử lý',           (SELECT COUNT(*) FROM dbo.PhanHoi WHERE TrangThai<>'resolved'), N''),
 (19, N'Hỗ trợ',     N'Tin nhắn liên hệ',              (SELECT COUNT(*) FROM dbo.LienHe), N'')
) AS t(STT, [Nhóm], [Chỉ số], [Giá trị], [Ghi chú]);
GO

/* ---- 2. Người dùng ---------------------------------------------------- */
CREATE OR ALTER VIEW bc.NguoiDungHoatDong AS
SELECT
    u.MaNguoiDung AS [Mã],
    u.HoTen       AS [Họ tên],
    u.Email       AS [Email],
    CASE u.VaiTro WHEN 'admin' THEN N'Quản trị' ELSE N'Người dùng' END AS [Vai trò],
    CASE u.TrangThai WHEN 'locked' THEN N'Đã khóa' ELSE N'Hoạt động' END AS [Trạng thái],
    FORMAT(DATEADD(HOUR,7,u.NgayTao),'dd/MM/yyyy HH:mm') AS [Ngày đăng ký],
    (SELECT FORMAT(MAX(DATEADD(HOUR,7,l.ThoiGian)),'dd/MM/yyyy HH:mm')
       FROM dbo.LichSuDangNhap l WHERE l.MaNguoiDung=u.MaNguoiDung) AS [Đăng nhập gần nhất],
    (SELECT COUNT(*) FROM dbo.Video v WHERE v.MaNguoiDung=u.MaNguoiDung)   AS [Số video],
    (SELECT COUNT(*) FROM dbo.PhanHoi p WHERE p.MaNguoiDung=u.MaNguoiDung) AS [Số phản hồi]
FROM dbo.NguoiDung u;
GO

/* ---- 3. Video --------------------------------------------------------- */
CREATE OR ALTER VIEW bc.VideoChiTiet AS
SELECT
    v.MaVideo AS [Mã video],
    v.TieuDe  AS [Tiêu đề],
    u.Email   AS [Chủ sở hữu],
    CASE v.TrangThai WHEN 'uploaded' THEN N'Đã tải lên' WHEN 'processing' THEN N'Đang xử lý'
         WHEN 'completed' THEN N'Hoàn thành' WHEN 'failed' THEN N'Thất bại' ELSE N'Đã ẩn' END AS [Trạng thái],
    v.NgonNguGoc AS [Ngôn ngữ gốc],
    CAST(v.DungLuong/1048576.0 AS DECIMAL(10,2)) AS [Dung lượng (MB)],
    CASE WHEN v.DuongDan IS NULL THEN N'Chưa có tệp' ELSE N'Đã lưu tệp' END AS [Tệp video],
    (SELECT COUNT(*) FROM dbo.ThuyetMinh t WHERE t.MaVideo=v.MaVideo) AS [Bản thuyết minh],
    (SELECT COUNT(*) FROM dbo.PhuDe d WHERE d.MaVideo=v.MaVideo)      AS [Bản phụ đề],
    FORMAT(DATEADD(HOUR,7,v.NgayTaiLen),'dd/MM/yyyy HH:mm') AS [Ngày tải lên]
FROM dbo.Video v
JOIN dbo.NguoiDung u ON u.MaNguoiDung=v.MaNguoiDung;
GO

/* ---- 4. Đơn hàng ------------------------------------------------------ */
CREATE OR ALTER VIEW bc.DonHangChiTiet AS
SELECT
    d.MaDonHang AS [Mã đơn],
    d.TenKhachHang AS [Khách hàng],
    d.EmailKhachHang AS [Email],
    d.SoVideoDang AS [Video tải lên],
    d.SoVideoDich AS [Video dịch],
    d.LoaiTien AS [Tiền tệ],
    CAST(d.SoTien / CASE WHEN d.LoaiTien='VND' THEN 1.0 ELSE 100.0 END AS DECIMAL(18,2)) AS [Số tiền],
    CASE d.TrangThai WHEN 'paid' THEN N'Đã thanh toán' WHEN 'cancelled' THEN N'Đã hủy' ELSE N'Chờ thanh toán' END AS [Trạng thái],
    FORMAT(DATEADD(HOUR,7,d.NgayTao),'dd/MM/yyyy HH:mm') AS [Ngày tạo]
FROM dbo.DonHang d;
GO

/* ---- 5. Doanh thu theo ngày ------------------------------------------ */
CREATE OR ALTER VIEW bc.DoanhThuNgay AS
SELECT v.Ngay AS [Ngày],v.LoaiTien AS [Tiền tệ],
 v.SoGiaoDich AS [Số giao dịch],
 CAST(CONVERT(DECIMAL(20,2),v.TongSoTien) / CASE WHEN v.LoaiTien='VND' THEN 1 ELSE 100 END AS DECIMAL(18,2)) AS [Doanh thu],
 CAST(CONVERT(DECIMAL(20,2),v.TongTienMoPhong) / CASE WHEN v.LoaiTien='VND' THEN 1 ELSE 100 END AS DECIMAL(18,2)) AS [Mô phỏng],
 CAST(CONVERT(DECIMAL(20,2),v.TongTienChuaXacMinh) / CASE WHEN v.LoaiTien='VND' THEN 1 ELSE 100 END AS DECIMAL(18,2)) AS [Chưa xác minh]
FROM dbo.vw_DoanhThuNgay v;
GO

/* ---- 6. Lượt quét QR theo ngày --------------------------------------- */
CREATE OR ALTER VIEW bc.QuetQRNgay AS
SELECT
    CAST(DATEADD(HOUR,7,NgayQuet) AS DATE) AS [Ngày],
    COUNT(*) AS [Lượt quét],
    COUNT(DISTINCT MaKhach) AS [Số người quét]
FROM dbo.LuotQuetQR
GROUP BY CAST(DATEADD(HOUR,7,NgayQuet) AS DATE);
GO

/* ---- 7. Phản hồi chưa xử lý ------------------------------------------ */
CREATE OR ALTER VIEW bc.PhanHoiChuaXuLy AS
SELECT
    p.MaPhanHoi AS [Mã],
    u.Email AS [Người gửi],
    p.MaVideo AS [Mã video],
    CASE p.TrangThai WHEN 'new' THEN N'Mới' ELSE N'Đang xem xét' END AS [Trạng thái],
    p.NoiDung AS [Nội dung],
    FORMAT(DATEADD(HOUR,7,p.NgayTao),'dd/MM/yyyy HH:mm') AS [Ngày gửi],
    DATEDIFF(HOUR,p.NgayTao,SYSUTCDATETIME()) AS [Số giờ chờ]
FROM dbo.PhanHoi p
JOIN dbo.NguoiDung u ON u.MaNguoiDung=p.MaNguoiDung
WHERE p.TrangThai<>'resolved';
GO

/* ---- 8. Kiểm tra toàn vẹn dữ liệu: không có dòng = dữ liệu sạch -------- */
CREATE OR ALTER VIEW bc.KiemTraToanVen AS
SELECT N'Video đã hoàn thành nhưng chưa có tệp' AS [Vấn đề], CAST(v.MaVideo AS NVARCHAR(20)) AS [Mã liên quan]
FROM dbo.Video v WHERE v.TrangThai='completed' AND v.DuongDan IS NULL
UNION ALL
SELECT N'Video đã hoàn thành nhưng thiếu thuyết minh hoặc phụ đề', CAST(v.MaVideo AS NVARCHAR(20))
FROM dbo.Video v
WHERE v.TrangThai='completed'
  AND (NOT EXISTS (SELECT 1 FROM dbo.ThuyetMinh t WHERE t.MaVideo=v.MaVideo)
    OR NOT EXISTS (SELECT 1 FROM dbo.PhuDe d WHERE d.MaVideo=v.MaVideo))
UNION ALL
SELECT N'Đơn đã thanh toán nhưng không có giao dịch thành công', CAST(d.MaDonHang AS NVARCHAR(20))
FROM dbo.DonHang d
WHERE d.TrangThai='paid'
  AND NOT EXISTS (SELECT 1 FROM dbo.GiaoDich g WHERE g.MaDonHang=d.MaDonHang AND g.TrangThai='success')
UNION ALL
SELECT N'Chưa có tài khoản quản trị đang hoạt động', N'-'
WHERE NOT EXISTS (SELECT 1 FROM dbo.NguoiDung WHERE VaiTro='admin' AND TrangThai='active');
GO


-- Presentation SELECT statements remain in the legacy report file.
