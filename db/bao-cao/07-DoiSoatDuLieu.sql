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

-- 07 / DOI SOAT DU LIEU (CHI DOC): canh bao, KHONG tu sua hay xoa.
-- 1) Kiem tra cau truc 12 bang nghiep vu. Missing phan biet voi bang rong.
SELECT x.TenBang,
 CASE WHEN OBJECT_ID(N'dbo.'+x.TenBang,N'U') IS NULL THEN N'THIEU BANG' ELSE N'Co bang' END TrangThai
FROM (VALUES(N'NguoiDung'),(N'DonHang'),(N'GiaoDich'),(N'Video'),(N'ThuyetMinh'),(N'PhuDe'),
 (N'PhanHoi'),(N'LienHe'),(N'LichSuDangNhap'),(N'NgonNgu'),(N'LuotTruyCap'),(N'LuotQuetQR')) x(TenBang)
ORDER BY x.TenBang;
-- 2) Email chuan hoa bi trung neu co (khong hien MatKhauBam).
IF OBJECT_ID(N'dbo.NguoiDung',N'U') IS NOT NULL
 EXEC sys.sp_executesql N'SELECT LOWER(LTRIM(RTRIM(Email))) EmailChuanHoa,COUNT_BIG(*) SoTaiKhoan
 FROM dbo.NguoiDung GROUP BY LOWER(LTRIM(RTRIM(Email))) HAVING COUNT_BIG(*)>1 ORDER BY SoTaiKhoan DESC';
-- 3) Don hang chua co MaNguoiDung (khong tu lien ket bang email).
IF OBJECT_ID(N'dbo.DonHang',N'U') IS NOT NULL
BEGIN
 IF COL_LENGTH('dbo.DonHang','MaNguoiDung') IS NOT NULL
  EXEC sys.sp_executesql N'SELECT TOP(200) MaDonHang,EmailKhachHang,TrangThai,SoTien,LoaiTien,
  DATEADD(HOUR,7,NgayTao) NgayTaoVN FROM dbo.DonHang WHERE MaNguoiDung IS NULL ORDER BY MaDonHang DESC';
 ELSE SELECT N'DonHang chua co cot MaNguoiDung: khong the xac minh quyen so huu don.' ThongBao;
END;
-- 4) Thanh toan/TrangThai don khong khop.
IF OBJECT_ID(N'dbo.DonHang',N'U') IS NOT NULL AND OBJECT_ID(N'dbo.GiaoDich',N'U') IS NOT NULL
 EXEC sys.sp_executesql N'
 SELECT d.MaDonHang,d.TrangThai TrangThaiDon,d.SoTien GiaTriDon,d.LoaiTien,
 COALESCE(g.SoSuccess,0) SoGiaoDichSuccess,COALESCE(g.DaThu,0) DaThuCungLoaiTien,
 CASE WHEN d.TrangThai=''paid'' AND COALESCE(g.SoSuccess,0)=0 THEN N''Don paid nhung khong co success''
      WHEN d.TrangThai<>''paid'' AND COALESCE(g.SoSuccess,0)>0 THEN N''Giao dich success nhung don khong paid''
      WHEN COALESCE(g.DaThu,0)>d.SoTien THEN N''Tien thu cao hon gia tri don''
      ELSE N''Tien thanh toan khac gia tri don'' END LyDo
 FROM dbo.DonHang d OUTER APPLY
 (SELECT COUNT_BIG(*) SoSuccess,
  SUM(CASE WHEN t.LoaiTien=d.LoaiTien THEN CONVERT(BIGINT,t.SoTien) ELSE CONVERT(BIGINT,0) END) DaThu
  FROM dbo.GiaoDich t WHERE t.MaDonHang=d.MaDonHang AND t.TrangThai=''success'') g
 WHERE (d.TrangThai=''paid'' AND COALESCE(g.SoSuccess,0)=0)
 OR (d.TrangThai<>''paid'' AND COALESCE(g.SoSuccess,0)>0)
 OR (COALESCE(g.DaThu,0)>d.SoTien)
 ORDER BY d.MaDonHang DESC';
-- 5) Giao dich success khac loai tien so voi don (khong quy doi).
IF OBJECT_ID(N'dbo.GiaoDich',N'U') IS NOT NULL AND OBJECT_ID(N'dbo.DonHang',N'U') IS NOT NULL
 EXEC sys.sp_executesql N'SELECT TOP(200) g.MaGiaoDich,g.MaDonHang,g.LoaiTien TienGiaoDich,d.LoaiTien TienDon,g.SoTien
 FROM dbo.GiaoDich g JOIN dbo.DonHang d ON d.MaDonHang=g.MaDonHang
 WHERE g.TrangThai=''success'' AND g.LoaiTien<>d.LoaiTien ORDER BY g.MaGiaoDich DESC';
-- 6) Nguoi dung chua co du lieu dang nhap da ghi (co the la tinh nang log chua hoat dong).
IF OBJECT_ID(N'dbo.LichSuDangNhap',N'U') IS NOT NULL
 EXEC sys.sp_executesql N'SELECT COUNT_BIG(*) SoLuotDangNhapDuocGhi FROM dbo.LichSuDangNhap';
