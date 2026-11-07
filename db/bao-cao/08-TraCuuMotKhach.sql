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

-- 08 / TRA CUU MOT KHACH HANG - sua DUY NHAT 1 trong 2 tham so ben duoi.
-- Vi du: DECLARE @MaNguoiDung INT = 3; DECLARE @Email NVARCHAR(254) = NULL;
DECLARE @MaNguoiDung INT = NULL;
DECLARE @Email NVARCHAR(254) = NULL;

IF @MaNguoiDung IS NULL AND NULLIF(LTRIM(RTRIM(@Email)),N'') IS NULL
BEGIN SELECT N'Hay nhap MaNguoiDung hoac Email o hai dong DECLARE dau tien de tra cuu.' AS HuongDan; RETURN; END;
IF OBJECT_ID(N'dbo.NguoiDung',N'U') IS NULL BEGIN SELECT N'Thieu bang NguoiDung' AS ThongBao; RETURN; END;
DECLARE @ID INT;
SELECT TOP(1) @ID=MaNguoiDung FROM dbo.NguoiDung
WHERE (@MaNguoiDung IS NOT NULL AND MaNguoiDung=@MaNguoiDung)
   OR (@MaNguoiDung IS NULL AND Email=LTRIM(RTRIM(@Email))) ORDER BY MaNguoiDung;
IF @ID IS NULL BEGIN SELECT N'Khong tim thay tai khoan.' AS ThongBao; RETURN; END;

-- 1) Ho so tai khoan.
SELECT MaNguoiDung,HoTen,Email,VaiTro,TrangThai,DATEADD(HOUR,7,NgayTao) NgayTaoVN
FROM dbo.NguoiDung WHERE MaNguoiDung=@ID;
-- 2) Don hang chi xem neu backend da gan MaNguoiDung (khong gan bang email).
IF COL_LENGTH('dbo.DonHang','MaNguoiDung') IS NOT NULL
 EXEC sys.sp_executesql N'SELECT MaDonHang,SoVideoDang,SoVideoDich,LoaiTien,SoTien,TrangThai,
 DATEADD(HOUR,7,NgayTao) NgayTaoVN FROM dbo.DonHang WHERE MaNguoiDung=@id ORDER BY MaDonHang DESC',N'@id INT',@id=@ID;
ELSE SELECT N'Chua co DonHang.MaNguoiDung; xem don theo ma dinh danh qua bao cao don hang, khong tu gan theo email.' ThongBao;
-- 3) Video cua tai khoan.
IF OBJECT_ID(N'dbo.Video',N'U') IS NOT NULL
 EXEC sys.sp_executesql N'SELECT MaVideo,TieuDe,NgonNguGoc,TrangThai,DATEADD(HOUR,7,NgayTaiLen) NgayTaiLenVN
 FROM dbo.Video WHERE MaNguoiDung=@id ORDER BY MaVideo DESC',N'@id INT',@id=@ID;
-- 4) Phan hoi cua tai khoan.
IF OBJECT_ID(N'dbo.PhanHoi',N'U') IS NOT NULL
 EXEC sys.sp_executesql N'SELECT MaPhanHoi,MaVideo,TrangThai,LEFT(NoiDung,200) NoiDungTomTat,
 DATEADD(HOUR,7,NgayTao) NgayTaoVN FROM dbo.PhanHoi WHERE MaNguoiDung=@id ORDER BY MaPhanHoi DESC',N'@id INT',@id=@ID;
-- 5) Lich su dang nhap (cuoi 50 luot).
IF OBJECT_ID(N'dbo.LichSuDangNhap',N'U') IS NOT NULL
 EXEC sys.sp_executesql N'SELECT TOP(50) MaLichSu,DATEADD(HOUR,7,ThoiGian) ThoiGianVN,DiaChiIP
 FROM dbo.LichSuDangNhap WHERE MaNguoiDung=@id ORDER BY MaLichSu DESC',N'@id INT',@id=@ID;
