-- BÁO CÁO DUBCHEF / CHỈ ĐỌC / TỪ SSMS CHỌN localhost,1433.
-- Mở trực tiếp file này -> Execute (F5); không INSERT/UPDATE/DELETE.
-- Cần chạy db/00-CAI-DAT-KHONG-XOA.sql nếu thiếu bảng.
USE DubchefDB;
GO
SET NOCOUNT ON;

-- Danh mục ngôn ngữ
IF OBJECT_ID(N'dbo.NgonNgu',N'U') IS NOT NULL
  EXEC sys.sp_executesql N'SELECT MaNgonNgu,TenNgonNgu,TenTiengAnh,TrangThai,NgayTao FROM dbo.NgonNgu ORDER BY MaNgonNgu';
ELSE
  SELECT N'Chưa đủ bảng cho báo cáo: NgonNgu. Kiểm tra file 00-CAI-DAT-KHONG-XOA.sql' AS ThongBao;


-- Thống kê QR theo ngày giờ Việt Nam
IF OBJECT_ID(N'dbo.LuotQuetQR',N'U') IS NOT NULL
  EXEC sys.sp_executesql N'SELECT CAST(DATEADD(HOUR,7,NgayQuet) AS DATE) AS NgayVN,COUNT(*) AS LuotQuet,COUNT(DISTINCT MaKhach) AS NguoiQuet FROM dbo.LuotQuetQR GROUP BY CAST(DATEADD(HOUR,7,NgayQuet) AS DATE) ORDER BY NgayVN DESC';
ELSE
  SELECT N'Chưa đủ bảng cho báo cáo: LuotQuetQR. Kiểm tra file 00-CAI-DAT-KHONG-XOA.sql' AS ThongBao;


-- Truy cập website theo ngày giờ Việt Nam
IF OBJECT_ID(N'dbo.LuotTruyCap',N'U') IS NOT NULL
  EXEC sys.sp_executesql N'SELECT CAST(DATEADD(HOUR,7,NgayTruyCap) AS DATE) AS NgayVN,COUNT(*) AS LuotXem,COUNT(DISTINCT MaKhach) AS KhachKhacNhau FROM dbo.LuotTruyCap GROUP BY CAST(DATEADD(HOUR,7,NgayTruyCap) AS DATE) ORDER BY NgayVN DESC';
ELSE
  SELECT N'Chưa đủ bảng cho báo cáo: LuotTruyCap. Kiểm tra file 00-CAI-DAT-KHONG-XOA.sql' AS ThongBao;
