-- BÁO CÁO DUBCHEF / CHỈ ĐỌC / TỪ SSMS CHỌN localhost,1433.
-- Mở trực tiếp file này -> Execute (F5); không INSERT/UPDATE/DELETE.
-- Cần chạy db/00-CAI-DAT-KHONG-XOA.sql nếu thiếu bảng.
USE DubchefDB;
GO
SET NOCOUNT ON;

-- Phản hồi của khách có tài khoản
IF OBJECT_ID(N'dbo.PhanHoi',N'U') IS NOT NULL AND OBJECT_ID(N'dbo.NguoiDung',N'U') IS NOT NULL
  EXEC sys.sp_executesql N'SELECT TOP (50) p.MaPhanHoi,u.HoTen,u.Email,p.MaVideo,p.NoiDung,p.TrangThai,p.TraLoi,p.NgayTao FROM dbo.PhanHoi p JOIN dbo.NguoiDung u ON u.MaNguoiDung=p.MaNguoiDung ORDER BY p.MaPhanHoi DESC';
ELSE
  SELECT N'Chưa đủ bảng cho báo cáo: PhanHoi, NguoiDung. Kiểm tra file 00-CAI-DAT-KHONG-XOA.sql' AS ThongBao;


-- Tin nhắn liên hệ của khách
IF OBJECT_ID(N'dbo.LienHe',N'U') IS NOT NULL
  EXEC sys.sp_executesql N'SELECT TOP (50) MaLienHe,HoTen,Email,NoiDung,TrangThai,TraLoi,NgayTao FROM dbo.LienHe ORDER BY MaLienHe DESC';
ELSE
  SELECT N'Chưa đủ bảng cho báo cáo: LienHe. Kiểm tra file 00-CAI-DAT-KHONG-XOA.sql' AS ThongBao;


-- Số phản hồi theo trạng thái
IF OBJECT_ID(N'dbo.PhanHoi',N'U') IS NOT NULL
  EXEC sys.sp_executesql N'SELECT TrangThai,COUNT(*) AS SoPhanHoi FROM dbo.PhanHoi GROUP BY TrangThai ORDER BY TrangThai';
ELSE
  SELECT N'Chưa đủ bảng cho báo cáo: PhanHoi. Kiểm tra file 00-CAI-DAT-KHONG-XOA.sql' AS ThongBao;

-- Hàng đợi phản hồi có độ ưu tiên và người xử lý (sau migration 07).
IF OBJECT_ID(N'dbo.vw_QuanTriPhanHoi',N'V') IS NOT NULL
 EXEC sys.sp_executesql N'SELECT TOP(100) * FROM dbo.vw_QuanTriPhanHoi ORDER BY NgayTao DESC';
