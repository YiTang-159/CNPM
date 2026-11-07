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

-- 04 / CHAM SOC KHACH HANG: KH co tai khoan + khach chua dang nhap.
IF OBJECT_ID(N'dbo.PhanHoi',N'U') IS NULL OR OBJECT_ID(N'dbo.LienHe',N'U') IS NULL
BEGIN SELECT N'Thieu bang PhanHoi/LienHe' AS ThongBao; RETURN; END;
-- UU TIEN SU DUNG VIEW quan tri neu da cai migration 07.
IF OBJECT_ID(N'dbo.vw_QuanTriPhanHoi',N'V') IS NOT NULL
 EXEC sys.sp_executesql N'SELECT TOP(200) MaYeuCau,Nguon,HoTen,Email,TrangThai,UuTien,
 LEFT(NoiDung,250) NoiDungTomTat,LEFT(TraLoi,250) TraLoiTomTat,NguoiXuLy,
 DATEADD(HOUR,7,NgayTao) NgayTaoVN,DATEADD(HOUR,7,NgayGiaiQuyet) NgayGiaiQuyetVN
 FROM dbo.vw_QuanTriPhanHoi ORDER BY
 CASE WHEN TrangThai IN (''resolved'',''closed'') THEN 1 ELSE 0 END,
 CASE WHEN UuTien=''high'' THEN 0 ELSE 1 END,NgayTao DESC';
ELSE
 EXEC sys.sp_executesql N'
 SELECT TOP(200) q.MaYeuCau,q.Nguon,q.HoTen,q.Email,q.TrangThai,q.NoiDungTomTat,q.TraLoiTomTat,
 DATEADD(HOUR,7,q.NgayTao) NgayTaoVN
 FROM (SELECT CONCAT(''f-'',p.MaPhanHoi) MaYeuCau,N''Phan hoi'' Nguon,u.HoTen,u.Email,p.TrangThai,
 LEFT(p.NoiDung,250) NoiDungTomTat,LEFT(p.TraLoi,250) TraLoiTomTat,p.NgayTao
 FROM dbo.PhanHoi p JOIN dbo.NguoiDung u ON u.MaNguoiDung=p.MaNguoiDung
 UNION ALL SELECT CONCAT(''c-'',c.MaLienHe),N''Lien he'',c.HoTen,c.Email,c.TrangThai,
 LEFT(c.NoiDung,250),LEFT(c.TraLoi,250),c.NgayTao FROM dbo.LienHe c) q
 ORDER BY CASE WHEN q.TrangThai IN (''resolved'',''closed'') THEN 1 ELSE 0 END,q.NgayTao DESC';

-- Dem yeu cau theo nguon/trang thai, khong hien email lan nua.
SELECT N'Phản hồi' Nguon,TrangThai,COUNT_BIG(*) SoYeuCau FROM dbo.PhanHoi GROUP BY TrangThai
UNION ALL
SELECT N'Liên hệ',TrangThai,COUNT_BIG(*) FROM dbo.LienHe GROUP BY TrangThai
ORDER BY Nguon,TrangThai;
