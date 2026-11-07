/*
 DUBCHEF - BO BAO CAO QUAN TRI V3 / SQL SERVER 2022 / DubchefDB
 CHI DOC: KHONG INSERT, UPDATE, DELETE, MERGE, CREATE, ALTER, DROP.
 Khong can doi .env, docker-compose.yml, API hoac ket noi SSMS.
 Thoi gian du lieu luu UTC; hien thi Viet Nam bang DATEADD(HOUR,7,...).
 Giao dich 'success' la thanh toan duoc DB ghi nhan; neu website dang mo phong thanh toan,
 KHONG hieu rang tien da duoc doi soat voi ngan hang.
*/
USE [DubchefDB];
GO
SET NOCOUNT ON;

-- 00 / DASHBOARD: chi 5 bang Results - tong quan -> khach hang -> don moi -> can xu ly -> doanh thu.
IF     OBJECT_ID(N'dbo.NguoiDung',N'U') IS NULL OR
    OBJECT_ID(N'dbo.DonHang',N'U') IS NULL OR
    OBJECT_ID(N'dbo.GiaoDich',N'U') IS NULL OR
    OBJECT_ID(N'dbo.Video',N'U') IS NULL OR
    OBJECT_ID(N'dbo.ThuyetMinh',N'U') IS NULL OR
    OBJECT_ID(N'dbo.PhuDe',N'U') IS NULL OR
    OBJECT_ID(N'dbo.PhanHoi',N'U') IS NULL OR
    OBJECT_ID(N'dbo.LienHe',N'U') IS NULL OR
    OBJECT_ID(N'dbo.LichSuDangNhap',N'U') IS NULL OR
    OBJECT_ID(N'dbo.NgonNgu',N'U') IS NULL OR
    OBJECT_ID(N'dbo.LuotQuetQR',N'U') IS NULL OR
    OBJECT_ID(N'dbo.LuotTruyCap',N'U') IS NULL
BEGIN
    SELECT N'Khong du bang trong DubchefDB. Kiem tra 02-schema.sql, 04-workflows.sql va khoi dong API.' AS HuongDan;
    RETURN;
END;

-- 1) KPI hang doc: 1 chi so / dong. Doanh thu chi tinh giao dich success; chi hien VND.
SELECT k.Nhom AS [Nhóm], k.ChiSo AS [Chỉ số], k.GiaTri AS [Giá trị], k.DonVi AS [Đơn vị]
FROM (
 SELECT 1 STT,N'Tài khoản' Nhom,N'Khách hàng' ChiSo,COUNT_BIG(*) GiaTri,N'tai khoan' DonVi FROM dbo.NguoiDung WHERE VaiTro='user'
 UNION ALL SELECT 2,N'Tài khoản',N'Quản trị viên',COUNT_BIG(*),N'tai khoan' FROM dbo.NguoiDung WHERE VaiTro='admin'
 UNION ALL SELECT 3,N'Tài khoản',N'Khách mới 7 ngày',COUNT_BIG(*),N'tai khoan' FROM dbo.NguoiDung WHERE VaiTro='user' AND NgayTao>=DATEADD(DAY,-7,SYSUTCDATETIME())
 UNION ALL SELECT 4,N'Tài khoản',N'Tài khoản bị khóa',COUNT_BIG(*),N'tai khoan' FROM dbo.NguoiDung WHERE TrangThai='locked'
 UNION ALL SELECT 5,N'Đơn hàng',N'Tổng đơn hàng',COUNT_BIG(*),N'don' FROM dbo.DonHang
 UNION ALL SELECT 6,N'Đơn hàng',N'Đơn đang chờ',COUNT_BIG(*),N'don' FROM dbo.DonHang WHERE TrangThai='pending'
 UNION ALL SELECT 7,N'Đơn hàng',N'Đơn đánh dấu đã thanh toán',COUNT_BIG(*),N'don' FROM dbo.DonHang WHERE TrangThai='paid'
 UNION ALL SELECT 8,N'Thanh toán',N'Giao dịch thành công (VND)',COUNT_BIG(*),N'giao dich' FROM dbo.GiaoDich WHERE TrangThai='success' AND LoaiTien='VND'
 UNION ALL SELECT 9,N'Thanh toán',N'Tổng giao dịch thành công (VND)',COALESCE(SUM(CONVERT(BIGINT,SoTien)),CONVERT(BIGINT,0)),N'VND' FROM dbo.GiaoDich WHERE TrangThai='success' AND LoaiTien='VND'
 UNION ALL SELECT 10,N'Nội dung',N'Video',COUNT_BIG(*),N'video' FROM dbo.Video
 UNION ALL SELECT 11,N'Nội dung',N'Thuyết minh',COUNT_BIG(*),N'ban' FROM dbo.ThuyetMinh
 UNION ALL SELECT 12,N'Nội dung',N'Phụ đề',COUNT_BIG(*),N'ban/doan' FROM dbo.PhuDe
 UNION ALL SELECT 13,N'Chăm sóc KH',N'Phản hồi chưa giải quyết',COUNT_BIG(*),N'yeu cau' FROM dbo.PhanHoi WHERE TrangThai<>'resolved'
 UNION ALL SELECT 14,N'Chăm sóc KH',N'Liên hệ chưa giải quyết',COUNT_BIG(*),N'yeu cau' FROM dbo.LienHe WHERE TrangThai NOT IN ('resolved','closed')
 UNION ALL SELECT 15,N'Tương tác',N'Lượt quét QR',COUNT_BIG(*),N'luot' FROM dbo.LuotQuetQR
 UNION ALL SELECT 16,N'Tương tác',N'Lượt truy cập',COUNT_BIG(*),N'luot' FROM dbo.LuotTruyCap
 UNION ALL SELECT 17,N'Tài khoản',N'Lượt đăng nhập đã ghi',COUNT_BIG(*),N'luot' FROM dbo.LichSuDangNhap
 UNION ALL SELECT 18,N'Danh mục',N'Ngôn ngữ',COUNT_BIG(*),N'ngon ngu' FROM dbo.NgonNgu
) k ORDER BY k.STT;

-- 2) Khach hang gan nhat: moi MaNguoiDung 1 dong, khong nhan ban ghi khi JOIN.
-- Don hang chi gan cho khach neu MaNguoiDung duoc backend gan ro rang, KHONG gan theo email.
IF COL_LENGTH('dbo.DonHang','MaNguoiDung') IS NOT NULL
 EXEC sys.sp_executesql N'
;WITH d AS (SELECT MaNguoiDung,COUNT_BIG(*) SoDon FROM dbo.DonHang WHERE MaNguoiDung IS NOT NULL GROUP BY MaNguoiDung),
e AS (SELECT LOWER(LTRIM(RTRIM(EmailKhachHang))) EmailChuanHoa,COUNT_BIG(*) SoDonTrungEmail FROM dbo.DonHang GROUP BY LOWER(LTRIM(RTRIM(EmailKhachHang)))),
v AS (SELECT MaNguoiDung,COUNT_BIG(*) SoVideo FROM dbo.Video GROUP BY MaNguoiDung),
l AS (SELECT MaNguoiDung,MAX(ThoiGian) DangNhapCuoi FROM dbo.LichSuDangNhap GROUP BY MaNguoiDung)
SELECT TOP(100) u.MaNguoiDung,u.HoTen,u.Email,u.TrangThai,
 COALESCE(d.SoDon,0) SoDonLienKet,COALESCE(e.SoDonTrungEmail,0) SoDonTrungEmail_ChuaXacMinh,COALESCE(v.SoVideo,0) SoVideo,
 DATEADD(HOUR,7,l.DangNhapCuoi) DangNhapCuoiVN
FROM dbo.NguoiDung u LEFT JOIN d ON d.MaNguoiDung=u.MaNguoiDung
LEFT JOIN e ON e.EmailChuanHoa=LOWER(LTRIM(RTRIM(u.Email)))
LEFT JOIN v ON v.MaNguoiDung=u.MaNguoiDung LEFT JOIN l ON l.MaNguoiDung=u.MaNguoiDung
WHERE u.VaiTro=''user'' ORDER BY u.MaNguoiDung DESC';
ELSE
 EXEC sys.sp_executesql N'
;WITH e AS (SELECT LOWER(LTRIM(RTRIM(EmailKhachHang))) EmailChuanHoa,COUNT_BIG(*) SoDonTrungEmail FROM dbo.DonHang GROUP BY LOWER(LTRIM(RTRIM(EmailKhachHang)))),
v AS (SELECT MaNguoiDung,COUNT_BIG(*) SoVideo FROM dbo.Video GROUP BY MaNguoiDung),
l AS (SELECT MaNguoiDung,MAX(ThoiGian) DangNhapCuoi FROM dbo.LichSuDangNhap GROUP BY MaNguoiDung)
SELECT TOP(100) u.MaNguoiDung,u.HoTen,u.Email,u.TrangThai,
 CAST(NULL AS BIGINT) SoDonLienKet,COALESCE(e.SoDonTrungEmail,0) SoDonTrungEmail_ChuaXacMinh,COALESCE(v.SoVideo,0) SoVideo,
 DATEADD(HOUR,7,l.DangNhapCuoi) DangNhapCuoiVN
FROM dbo.NguoiDung u LEFT JOIN e ON e.EmailChuanHoa=LOWER(LTRIM(RTRIM(u.Email)))
LEFT JOIN v ON v.MaNguoiDung=u.MaNguoiDung
LEFT JOIN l ON l.MaNguoiDung=u.MaNguoiDung
WHERE u.VaiTro=''user'' ORDER BY u.MaNguoiDung DESC';

-- 3) Don gan nhat: khong lap email. MaNguoiDung null = chua co lien ket chac chan.
DECLARE @OrderUserCol NVARCHAR(100)=CASE WHEN COL_LENGTH('dbo.DonHang','MaNguoiDung') IS NOT NULL THEN N'd.MaNguoiDung' ELSE N'CAST(NULL AS INT)' END;
DECLARE @SqlRecentOrders NVARCHAR(MAX) = N'SELECT TOP(50) d.MaDonHang,'+@OrderUserCol+N' MaNguoiDung,
 d.SoVideoDang,d.SoVideoDich,d.SoTien,d.LoaiTien,d.TrangThai,
 CASE WHEN EXISTS(SELECT 1 FROM dbo.GiaoDich g WHERE g.MaDonHang=d.MaDonHang AND g.TrangThai=''success'') THEN N''Co giao dich success'' ELSE N''Chua co success'' END TinhTrangGiaoDich,
 DATEADD(HOUR,7,d.NgayTao) NgayTaoVN
 FROM dbo.DonHang d ORDER BY d.NgayTao DESC,d.MaDonHang DESC';
EXEC sys.sp_executesql @SqlRecentOrders;

-- 4) Hang doi: mot ket qua gom phan hoi, lien he, video chua hoan tat.
SELECT TOP(60) q.Loai,q.MaBanGhi,q.TrangThai,q.MoTa,DATEADD(HOUR,7,q.NgayTao) NgayTaoVN
FROM (
 SELECT N'Phản hồi' Loai,CONVERT(VARCHAR(30),p.MaPhanHoi) MaBanGhi,p.TrangThai,LEFT(p.NoiDung,100) MoTa,p.NgayTao FROM dbo.PhanHoi p WHERE p.TrangThai<>'resolved'
 UNION ALL SELECT N'Liên hệ',CONVERT(VARCHAR(30),c.MaLienHe),c.TrangThai,LEFT(c.NoiDung,100),c.NgayTao FROM dbo.LienHe c WHERE c.TrangThai NOT IN ('resolved','closed')
 UNION ALL SELECT N'Video',CONVERT(VARCHAR(30),v.MaVideo),v.TrangThai,LEFT(v.TieuDe,100),v.NgayTaiLen FROM dbo.Video v WHERE v.TrangThai IN ('uploaded','processing','failed')
) q ORDER BY q.NgayTao DESC,q.Loai,q.MaBanGhi;

-- 5) Doanh thu 30 ngay theo NGAY VIET NAM va TUNG LOAI TIEN, khong quy doi chong cheo.
SELECT CAST(DATEADD(HOUR,7,NgayThanhToan) AS DATE) NgayVN,LoaiTien,
 COUNT_BIG(*) SoGiaoDich,COUNT(DISTINCT MaDonHang) SoDonCoGiaoDichThanhCong,
 SUM(CONVERT(BIGINT,SoTien)) TongTienThanhCong
FROM dbo.GiaoDich WHERE TrangThai='success' AND NgayThanhToan>=DATEADD(DAY,-30,SYSUTCDATETIME())
GROUP BY CAST(DATEADD(HOUR,7,NgayThanhToan) AS DATE),LoaiTien
ORDER BY NgayVN DESC,LoaiTien;
