-- BÁO CÁO DUBCHEF / CHỈ ĐỌC / TỪ SSMS CHỌN localhost,1433.
-- Mở trực tiếp file này -> Execute (F5); không INSERT/UPDATE/DELETE.
-- Cần chạy db/00-CAI-DAT-KHONG-XOA.sql nếu thiếu bảng.
USE DubchefDB;
GO
SET NOCOUNT ON;
SELECT @@SERVERNAME AS TenServer, DB_NAME() AS TenDatabase,
  SYSTEM_USER AS TaiKhoanSQL, SYSDATETIMEOFFSET() AS GioMayChu;
SELECT x.TenBang, CASE WHEN OBJECT_ID(N'dbo.'+x.TenBang,N'U') IS NULL
  THEN N'CHƯA CÓ' ELSE N'ĐÃ CÓ' END AS TrangThai,
  (SELECT COUNT(*) FROM sys.columns c WHERE c.object_id=OBJECT_ID(N'dbo.'+x.TenBang,N'U')) AS SoCot
FROM (VALUES (N'NguoiDung'),(N'Video'),(N'ThuyetMinh'),(N'PhuDe'),
 (N'PhanHoi'),(N'LienHe'),(N'NgonNgu'),(N'DonHang'),(N'GiaoDich'),
 (N'LuotTruyCap'),(N'LuotQuetQR'),(N'LichSuDangNhap')) x(TenBang);
