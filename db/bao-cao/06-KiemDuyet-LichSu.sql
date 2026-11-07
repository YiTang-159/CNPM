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

-- 06 / KIEM DUYET NOI DUNG - LICH SU XU LY (migration 07 tuy chon).
IF OBJECT_ID(N'dbo.vw_QuanTriNoiDung',N'V') IS NOT NULL
BEGIN
 EXEC sys.sp_executesql N'SELECT TOP(200) Loai,MaBanGhi,MaVideo,TieuDe,NgonNgu,TrangThaiDuyet,PhienBan,NguoiSua,
 DATEADD(HOUR,7,NgayCapNhat) NgayCapNhatVN
 FROM dbo.vw_QuanTriNoiDung ORDER BY NgayCapNhat DESC,MaBanGhi DESC';
 EXEC sys.sp_executesql N'SELECT Loai,TrangThaiDuyet,COUNT_BIG(*) SoBan FROM dbo.vw_QuanTriNoiDung
 GROUP BY Loai,TrangThaiDuyet ORDER BY Loai,TrangThaiDuyet';
END
ELSE SELECT N'Chua co vw_QuanTriNoiDung. Kiem tra migration 07, khong can chay migration neu chi xem bao cao co ban.' AS ThongBao;
IF OBJECT_ID(N'dbo.LichSuNoiDung',N'U') IS NOT NULL
 EXEC sys.sp_executesql N'SELECT TOP(200) MaLichSu,Loai,MaVideo,NgonNgu,PhienBan,TrangThai,NguoiSua,
 LEN(NoiDung) SoKyTu,DATEADD(HOUR,7,ThoiGian) ThoiGianVN FROM dbo.LichSuNoiDung ORDER BY MaLichSu DESC';
ELSE SELECT N'Chua co LichSuNoiDung' AS ThongBao;
IF OBJECT_ID(N'dbo.LichSuXuLyPhanHoi',N'U') IS NOT NULL
 EXEC sys.sp_executesql N'SELECT TOP(200) MaLichSu,Nguon,MaBanGhi,TrangThai,UuTien,NguoiXuLy,
 LEFT(TraLoi,160) TraLoiTomTat,DATEADD(HOUR,7,ThoiGian) ThoiGianVN
 FROM dbo.LichSuXuLyPhanHoi ORDER BY MaLichSu DESC';
ELSE SELECT N'Chua co LichSuXuLyPhanHoi' AS ThongBao;
