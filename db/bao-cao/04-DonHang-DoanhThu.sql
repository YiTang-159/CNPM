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

-- 02 / DON HANG + THANH TOAN: PHAI tach tung loai tien.
IF OBJECT_ID(N'dbo.DonHang',N'U') IS NULL OR OBJECT_ID(N'dbo.GiaoDich',N'U') IS NULL
BEGIN SELECT N'Thieu DonHang/GiaoDich' AS ThongBao; RETURN; END;
-- Chi tiet don hang: moi don 1 dong; tong thanh toan success tinh qua OUTER APPLY de khong bi nhan dong.
DECLARE @userColumn NVARCHAR(100)=CASE WHEN COL_LENGTH('dbo.DonHang','MaNguoiDung') IS NOT NULL THEN N'd.MaNguoiDung' ELSE N'CAST(NULL AS INT)' END;
DECLARE @SqlOrderDetails NVARCHAR(MAX) = N'SELECT TOP (200) d.MaDonHang,'+@userColumn+N' MaNguoiDung,
 d.TenKhachHang,d.EmailKhachHang,d.SoVideoDang,d.SoVideoDich,
 d.SoTien GiaTriDon,d.LoaiTien,d.TrangThai,
 COALESCE(t.SoLanSuccess,0) SoGiaoDichSuccess,COALESCE(t.DaThuCungTien,0) SoTienSuccessCungLoaiTien,
 CASE WHEN d.TrangThai=''paid'' AND COALESCE(t.SoLanSuccess,0)=0 THEN N''Can kiem tra: paid nhung khong co giao dich success''
      WHEN d.TrangThai<>''paid'' AND COALESCE(t.SoLanSuccess,0)>0 THEN N''Can kiem tra: co success nhung don chua paid''
      WHEN COALESCE(t.DaThuCungTien,0)>d.SoTien THEN N''Can kiem tra: thu vuot gia tri don''
      ELSE N''Binh thuong'' END CanhBao,
 DATEADD(HOUR,7,d.NgayTao) NgayTaoVN
 FROM dbo.DonHang d
 OUTER APPLY(SELECT COUNT_BIG(*) SoLanSuccess,SUM(CASE WHEN g.LoaiTien=d.LoaiTien THEN CONVERT(BIGINT,g.SoTien) ELSE CONVERT(BIGINT,0) END) DaThuCungTien
             FROM dbo.GiaoDich g WHERE g.MaDonHang=d.MaDonHang AND g.TrangThai=''success'') t
 ORDER BY d.MaDonHang DESC';
EXEC sys.sp_executesql @SqlOrderDetails;

-- Doanh thu thuc te DA GHI NHAN qua bang GiaoDich (neu website demo: mang tinh mo phong).
SELECT CAST(DATEADD(HOUR,7,NgayThanhToan) AS DATE) NgayVN,LoaiTien,
 COUNT_BIG(*) SoGiaoDichSuccess,SUM(CONVERT(BIGINT,SoTien)) DoanhThuSuccess
FROM dbo.GiaoDich WHERE TrangThai='success'
GROUP BY CAST(DATEADD(HOUR,7,NgayThanhToan) AS DATE),LoaiTien ORDER BY NgayVN DESC,LoaiTien;

-- Gia tri DON HANG khong dong nghia voi DOANH THU.
SELECT TrangThai,LoaiTien,COUNT_BIG(*) SoDon,SUM(CONVERT(BIGINT,SoTien)) GiaTriDonHang
FROM dbo.DonHang GROUP BY TrangThai,LoaiTien ORDER BY TrangThai,LoaiTien;

-- Nhat ky giao dich: giu MaThamChieu, KHONG co so the.
SELECT TOP(150) MaGiaoDich,MaDonHang,PhuongThuc,SoTien,LoaiTien,TrangThai,MaThamChieu,
 DATEADD(HOUR,7,NgayThanhToan) NgayThanhToanVN
FROM dbo.GiaoDich ORDER BY MaGiaoDich DESC;

-- Ty trong phuong thuc thanh toan, tach loai tien.
SELECT PhuongThuc,LoaiTien,TrangThai,COUNT_BIG(*) SoGiaoDich,
 SUM(CONVERT(BIGINT,SoTien)) TongTien
FROM dbo.GiaoDich GROUP BY PhuongThuc,LoaiTien,TrangThai ORDER BY LoaiTien,PhuongThuc,TrangThai;
