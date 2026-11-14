/* Canonical read-only SSMS dashboard: SQL Server 2022, UTC+7.
   Requires canonical migrations 001..020; DO NOT treat demo or legacy as revenue. */
USE [DubchefDB];
GO
SET NOCOUNT ON;
IF OBJECT_ID('dbo.SchemaMigrations','U') IS NULL OR
   OBJECT_ID('dbo.WebhookNhan','U') IS NULL OR
   OBJECT_ID('dbo.QuyenLoiGoi','U') IS NULL OR
   OBJECT_ID('dbo.SuDungQuyenLoi','U') IS NULL OR
   OBJECT_ID('dbo.CauHinhHeThong','U') IS NULL OR
   OBJECT_ID('dbo.CongViecXuLy','U') IS NULL OR
   OBJECT_ID('dbo.vw_DoanhThuNgay','V') IS NULL
 THROW 51940,N'Incomplete database. Apply db/migrations/RUN_ALL_IN_SSMS.sql first.',1;
GO
-- 1) Single-row KPI; all amounts in VND minor units and only authenticated payOS.
SELECT
 (SELECT COUNT_BIG(*) FROM dbo.NguoiDung WHERE VaiTro='user' AND NgayXoa IS NULL) AS NguoiDung,
 (SELECT COUNT_BIG(*) FROM dbo.Video) AS SoVideo,
 (SELECT COUNT_BIG(*) FROM dbo.DonHang WHERE TrangThai='pending') AS DonDangCho,
 (SELECT COUNT_BIG(*) FROM dbo.GiaoDich WHERE TrangThai='success' AND NguonXacNhan='payos' AND LoaiTien='VND') AS GiaoDichPayOSXacMinh,
 (SELECT COALESCE(SUM(TongSoTien),0) FROM dbo.vw_DoanhThuNgay WHERE LoaiTien='VND') AS DoanhThuThucVND,
 (SELECT COALESCE(SUM(TongTienMoPhong),0) FROM dbo.vw_DoanhThuNgay WHERE LoaiTien='VND') AS MoPhongVND,
 (SELECT COALESCE(SUM(TongTienChuaXacMinh),0) FROM dbo.vw_DoanhThuNgay WHERE LoaiTien='VND') AS ChuaXacMinhVND,
 (SELECT COUNT_BIG(*) FROM dbo.LienHe WHERE TrangThai NOT IN ('resolved','closed')) AS LienHeDangXuLy,
 (SELECT COUNT_BIG(*) FROM dbo.QuyenLoiGoi WHERE NgayHetHan IS NULL OR NgayHetHan>SYSUTCDATETIME()) AS GoiConHan;
GO
-- 2) Users and explicitly linked orders only. Email is NOT used as ownership key.
SELECT TOP(100) u.MaNguoiDung,u.HoTen,u.Email,u.TrangThai,u.NgayXoa,
 COUNT(DISTINCT d.MaDonHang) AS SoDonLienKet,
 (SELECT COUNT_BIG(*) FROM dbo.Video v WHERE v.MaNguoiDung=u.MaNguoiDung) AS SoVideo
FROM dbo.NguoiDung u LEFT JOIN dbo.DonHang d ON d.MaNguoiDung=u.MaNguoiDung
WHERE u.VaiTro='user'
GROUP BY u.MaNguoiDung,u.HoTen,u.Email,u.TrangThai,u.NgayXoa
ORDER BY u.MaNguoiDung DESC;
GO
-- 3) Recent orders: new records must have MaNguoiDung and price snapshot.
SELECT TOP(100) d.MaDonHang,d.MaNguoiDung,d.DonCu,d.TenKhachHang,
 d.SoVideoDang,d.SoVideoDich,d.LoaiTien,d.SoTien,d.TrangThai,
 d.DonGiaDangSnapshot,d.DonGiaDichSnapshot,d.PhienBanGiaSnapshot,
 DATEADD(HOUR,7,d.NgayTao) AS NgayTaoVN
FROM dbo.DonHang d ORDER BY d.NgayTao DESC,d.MaDonHang DESC;
GO
-- 4) Usage/remaining quotas, from ledger-consistent DB counters.
SELECT TOP(100) q.MaQuyenLoi,q.MaNguoiDung,q.MaDonHang,
 q.SoVideoDang,q.DaDungVideoDang,q.SoVideoDang-q.DaDungVideoDang AS VideoConLai,
 q.SoVideoDich,q.DaDungVideoDich,q.SoVideoDich-q.DaDungVideoDich AS BanDichConLai,
 q.NgayHetHan,q.NguonXacNhan
FROM dbo.QuyenLoiGoi q ORDER BY q.NgayCap DESC,q.MaQuyenLoi DESC;
GO
-- 5) Vietnamese-calendar daily revenues; demo and unknown are strictly separate.
SELECT Ngay AS NgayVN,LoaiTien,SoGiaoDich,TongSoTien,
 SoGiaoDichMoPhong,TongTienMoPhong,SoGiaoDichChuaXacMinh,TongTienChuaXacMinh
FROM dbo.vw_DoanhThuNgay
WHERE Ngay>=CONVERT(DATE,DATEADD(DAY,-30,DATEADD(HOUR,7,SYSUTCDATETIME())))
ORDER BY Ngay DESC,LoaiTien;
GO
-- 6) Payment and webhook integrity summary.
SELECT (SELECT COUNT_BIG(*) FROM dbo.WebhookNhan WHERE ChuKyHopLe=1 AND KetQua='processed') AS WebhookDaXacMinh,
 (SELECT COUNT_BIG(*) FROM dbo.WebhookNhan WHERE KetQua='rejected') AS WebhookBiTuChoi,
 (SELECT COUNT_BIG(*) FROM dbo.DonHang WHERE DonCu=1 AND MaNguoiDung IS NULL) AS DonCuChuaXacMinhChu;
GO
