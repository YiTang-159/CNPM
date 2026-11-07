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

-- 05 / NGON NGU, QR, LUOT TRUY CAP. Khong co thong tin ca nhan nhay cam.
IF OBJECT_ID(N'dbo.NgonNgu',N'U') IS NULL OR OBJECT_ID(N'dbo.LuotQuetQR',N'U') IS NULL OR OBJECT_ID(N'dbo.LuotTruyCap',N'U') IS NULL
BEGIN SELECT N'Thieu bang NgonNgu/LuotQuetQR/LuotTruyCap' AS ThongBao; RETURN; END;
SELECT MaNgonNgu,TenNgonNgu,TenTiengAnh,TrangThai,DATEADD(HOUR,7,NgayTao) NgayTaoVN
FROM dbo.NgonNgu ORDER BY TrangThai,MaNgonNgu;
SELECT CAST(DATEADD(HOUR,7,NgayQuet) AS DATE) NgayVN,NgonNgu,COUNT_BIG(*) SoLuotQuet,COUNT(DISTINCT MaKhach) SoMaKhach
FROM dbo.LuotQuetQR GROUP BY CAST(DATEADD(HOUR,7,NgayQuet) AS DATE),NgonNgu ORDER BY NgayVN DESC,NgonNgu;
SELECT CAST(DATEADD(HOUR,7,NgayTruyCap) AS DATE) NgayVN,COUNT_BIG(*) SoLuotXem,COUNT(DISTINCT MaKhach) SoMaKhach
FROM dbo.LuotTruyCap GROUP BY CAST(DATEADD(HOUR,7,NgayTruyCap) AS DATE) ORDER BY NgayVN DESC;
-- 20 duong dan duoc xem nhieu nhat trong 30 ngay.
SELECT TOP(20) DuongDan,COUNT_BIG(*) SoLuotXem,COUNT(DISTINCT MaKhach) SoMaKhach
FROM dbo.LuotTruyCap WHERE NgayTruyCap>=DATEADD(DAY,-30,SYSUTCDATETIME())
GROUP BY DuongDan ORDER BY SoLuotXem DESC,DuongDan;
