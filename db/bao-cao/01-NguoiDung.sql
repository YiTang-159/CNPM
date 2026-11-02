-- BÁO CÁO DUBCHEF / CHỈ ĐỌC / TỪ SSMS CHỌN localhost,1433.
-- Mở trực tiếp file này -> Execute (F5); không INSERT/UPDATE/DELETE.
-- Cần chạy db/00-CAI-DAT-KHONG-XOA.sql nếu thiếu bảng.
USE DubchefDB;
GO
SET NOCOUNT ON;

-- Người dùng mới
IF OBJECT_ID(N'dbo.NguoiDung',N'U') IS NOT NULL
  EXEC sys.sp_executesql N'SELECT TOP (50) MaNguoiDung, HoTen, Email, VaiTro, TrangThai, NgayTao AS NgayTaoUTC FROM dbo.NguoiDung ORDER BY NgayTao DESC, MaNguoiDung DESC';
ELSE
  SELECT N'Chưa đủ bảng cho báo cáo: NguoiDung. Kiểm tra file 00-CAI-DAT-KHONG-XOA.sql' AS ThongBao;


-- Người dùng + số video + số đơn
IF OBJECT_ID(N'dbo.NguoiDung',N'U') IS NOT NULL AND OBJECT_ID(N'dbo.Video',N'U') IS NOT NULL AND OBJECT_ID(N'dbo.DonHang',N'U') IS NOT NULL
  EXEC sys.sp_executesql N'SELECT n.MaNguoiDung,n.HoTen,n.Email,n.TrangThai, (SELECT COUNT(*) FROM dbo.Video v WHERE v.MaNguoiDung=n.MaNguoiDung) AS TongVideo, (SELECT COUNT(*) FROM dbo.DonHang o WHERE o.EmailKhachHang=n.Email) AS TongDon FROM dbo.NguoiDung n WHERE n.VaiTro=''user'' ORDER BY n.MaNguoiDung DESC';
ELSE
  SELECT N'Chưa đủ bảng cho báo cáo: NguoiDung, Video, DonHang. Kiểm tra file 00-CAI-DAT-KHONG-XOA.sql' AS ThongBao;


-- Lịch sử đăng nhập thành công
IF OBJECT_ID(N'dbo.NguoiDung',N'U') IS NOT NULL AND OBJECT_ID(N'dbo.LichSuDangNhap',N'U') IS NOT NULL
  EXEC sys.sp_executesql N'SELECT TOP (50) l.MaLichSu,u.Email,u.VaiTro,l.ThoiGian AT TIME ZONE ''UTC'' AT TIME ZONE ''SE Asia Standard Time'' AS ThoiGianVN,l.DiaChiIP FROM dbo.LichSuDangNhap l JOIN dbo.NguoiDung u ON u.MaNguoiDung=l.MaNguoiDung ORDER BY l.MaLichSu DESC';
ELSE
  SELECT N'Chưa đủ bảng cho báo cáo: NguoiDung, LichSuDangNhap. Kiểm tra file 00-CAI-DAT-KHONG-XOA.sql' AS ThongBao;
