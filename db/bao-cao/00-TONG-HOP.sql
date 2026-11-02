-- BÁO CÁO DUBCHEF / CHỈ ĐỌC / TỪ SSMS CHỌN localhost,1433.
-- Mở trực tiếp file này -> Execute (F5); không INSERT/UPDATE/DELETE.
-- Cần chạy db/00-CAI-DAT-KHONG-XOA.sql nếu thiếu bảng.
USE DubchefDB;
GO
SET NOCOUNT ON;
-- Bảng 1: 11 chỉ số tổng hợp; số NULL nghĩa là bảng chưa được tạo, không phải 0.
DECLARE @sql NVARCHAR(MAX) = N'SELECT ';
SET @sql += CASE WHEN OBJECT_ID(N'dbo.NguoiDung',N'U') IS NOT NULL THEN N'(SELECT COUNT(*) FROM dbo.NguoiDung) AS TongNguoiDung' ELSE N'CAST(NULL AS INT) AS TongNguoiDung' END + N',';
SET @sql += CASE WHEN OBJECT_ID(N'dbo.Video',N'U') IS NOT NULL THEN N'(SELECT COUNT(*) FROM dbo.Video) AS TongVideo' ELSE N'CAST(NULL AS INT) AS TongVideo' END + N',';
SET @sql += CASE WHEN OBJECT_ID(N'dbo.ThuyetMinh',N'U') IS NOT NULL THEN N'(SELECT COUNT(*) FROM dbo.ThuyetMinh) AS TongThuyetMinh' ELSE N'CAST(NULL AS INT) AS TongThuyetMinh' END + N',';
SET @sql += CASE WHEN OBJECT_ID(N'dbo.PhuDe',N'U') IS NOT NULL THEN N'(SELECT COUNT(*) FROM dbo.PhuDe) AS TongPhuDe' ELSE N'CAST(NULL AS INT) AS TongPhuDe' END + N',';
SET @sql += CASE WHEN OBJECT_ID(N'dbo.NgonNgu',N'U') IS NOT NULL THEN N'(SELECT COUNT(*) FROM dbo.NgonNgu) AS TongNgonNgu' ELSE N'CAST(NULL AS INT) AS TongNgonNgu' END + N',';
SET @sql += CASE WHEN OBJECT_ID(N'dbo.PhanHoi',N'U') IS NOT NULL THEN N'(SELECT COUNT(*) FROM dbo.PhanHoi) AS TongPhanHoi' ELSE N'CAST(NULL AS INT) AS TongPhanHoi' END + N',';
SET @sql += CASE WHEN OBJECT_ID(N'dbo.LienHe',N'U') IS NOT NULL THEN N'(SELECT COUNT(*) FROM dbo.LienHe) AS TongLienHe' ELSE N'CAST(NULL AS INT) AS TongLienHe' END + N',';
SET @sql += CASE WHEN OBJECT_ID(N'dbo.DonHang',N'U') IS NOT NULL THEN N'(SELECT COUNT(*) FROM dbo.DonHang) AS TongDonHang' ELSE N'CAST(NULL AS INT) AS TongDonHang' END + N',';
SET @sql += CASE WHEN OBJECT_ID(N'dbo.LuotQuetQR',N'U') IS NOT NULL THEN N'(SELECT COUNT(*) FROM dbo.LuotQuetQR) AS TongLuotQuetQR' ELSE N'CAST(NULL AS INT) AS TongLuotQuetQR' END + N',';
SET @sql += CASE WHEN OBJECT_ID(N'dbo.LuotTruyCap',N'U') IS NOT NULL THEN N'(SELECT COUNT(*) FROM dbo.LuotTruyCap) AS TongTruyCap' ELSE N'CAST(NULL AS INT) AS TongTruyCap' END + N',';
SET @sql += CASE WHEN OBJECT_ID(N'dbo.LichSuDangNhap',N'U') IS NOT NULL THEN N'(SELECT COUNT(*) FROM dbo.LichSuDangNhap) AS TongDangNhap' ELSE N'CAST(NULL AS INT) AS TongDangNhap' END + N'';
EXEC sys.sp_executesql @sql;

-- Bảng 2: đơn hàng theo trạng thái/loại tiền
IF OBJECT_ID(N'dbo.DonHang',N'U') IS NOT NULL
  EXEC sys.sp_executesql N'SELECT TrangThai,LoaiTien,COUNT(*) AS SoDon,SUM(SoTien) AS TongSoTien FROM dbo.DonHang GROUP BY TrangThai,LoaiTien ORDER BY TrangThai,LoaiTien';
ELSE
  SELECT N'Chưa đủ bảng cho báo cáo: DonHang. Kiểm tra file 00-CAI-DAT-KHONG-XOA.sql' AS ThongBao;

-- Bảng 3: phản hồi chưa giải quyết
IF OBJECT_ID(N'dbo.PhanHoi',N'U') IS NOT NULL AND OBJECT_ID(N'dbo.NguoiDung',N'U') IS NOT NULL
  EXEC sys.sp_executesql N'SELECT TOP (20) p.MaPhanHoi,u.Email,p.TrangThai,p.NoiDung,p.NgayTao FROM dbo.PhanHoi p JOIN dbo.NguoiDung u ON u.MaNguoiDung=p.MaNguoiDung WHERE p.TrangThai <> ''resolved'' ORDER BY p.MaPhanHoi DESC';
ELSE
  SELECT N'Chưa đủ bảng cho báo cáo: PhanHoi, NguoiDung. Kiểm tra file 00-CAI-DAT-KHONG-XOA.sql' AS ThongBao;

-- Bảng 4: video đang xử lý
IF OBJECT_ID(N'dbo.Video',N'U') IS NOT NULL AND OBJECT_ID(N'dbo.NguoiDung',N'U') IS NOT NULL
  EXEC sys.sp_executesql N'SELECT TOP (20) v.MaVideo,n.Email,v.TieuDe,v.TrangThai,v.NgayTaiLen FROM dbo.Video v JOIN dbo.NguoiDung n ON n.MaNguoiDung=v.MaNguoiDung WHERE v.TrangThai=''processing'' ORDER BY v.MaVideo DESC';
ELSE
  SELECT N'Chưa đủ bảng cho báo cáo: Video, NguoiDung. Kiểm tra file 00-CAI-DAT-KHONG-XOA.sql' AS ThongBao;
