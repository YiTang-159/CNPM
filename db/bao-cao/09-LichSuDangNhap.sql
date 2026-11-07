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

-- 09 / LICH SU DANG NHAP, khong co mat khau/token.
IF OBJECT_ID(N'dbo.LichSuDangNhap',N'U') IS NULL OR OBJECT_ID(N'dbo.NguoiDung',N'U') IS NULL
BEGIN SELECT N'Thieu LichSuDangNhap/NguoiDung' AS ThongBao; RETURN; END;
-- Neu bang trong, khong co nghia la dang nhap that bai; can xem backend co ghi log hay chua.
SELECT TOP(200) l.MaLichSu,u.MaNguoiDung,u.HoTen,u.VaiTro,
 DATEADD(HOUR,7,l.ThoiGian) ThoiGianVN,l.DiaChiIP
FROM dbo.LichSuDangNhap l JOIN dbo.NguoiDung u ON u.MaNguoiDung=l.MaNguoiDung
ORDER BY l.MaLichSu DESC;
SELECT CAST(DATEADD(HOUR,7,l.ThoiGian) AS DATE) NgayVN,COUNT_BIG(*) SoLuotDangNhap,
 COUNT(DISTINCT l.MaNguoiDung) SoTaiKhoan
FROM dbo.LichSuDangNhap l GROUP BY CAST(DATEADD(HOUR,7,l.ThoiGian) AS DATE) ORDER BY NgayVN DESC;
