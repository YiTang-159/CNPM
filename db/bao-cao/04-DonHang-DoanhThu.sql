-- BÁO CÁO DUBCHEF / CHỈ ĐỌC / TỪ SSMS CHỌN localhost,1433.
-- Mở trực tiếp file này -> Execute (F5); không INSERT/UPDATE/DELETE.
-- Cần chạy db/00-CAI-DAT-KHONG-XOA.sql nếu thiếu bảng.
USE DubchefDB;
GO
SET NOCOUNT ON;

-- Đơn hàng và thanh toán
IF OBJECT_ID(N'dbo.DonHang',N'U') IS NOT NULL AND OBJECT_ID(N'dbo.GiaoDich',N'U') IS NOT NULL
  EXEC sys.sp_executesql N'SELECT TOP (50) d.MaDonHang,d.TenKhachHang,d.EmailKhachHang,d.SoVideoDang,d.SoVideoDich,d.LoaiTien,d.SoTien,d.TrangThai,g.PhuongThuc,g.MaThamChieu,d.NgayTao FROM dbo.DonHang d OUTER APPLY (SELECT TOP (1) PhuongThuc,MaThamChieu FROM dbo.GiaoDich WHERE MaDonHang=d.MaDonHang AND TrangThai=''success'' ORDER BY NgayThanhToan DESC) g ORDER BY d.MaDonHang DESC';
ELSE
  SELECT N'Chưa đủ bảng cho báo cáo: DonHang, GiaoDich. Kiểm tra file 00-CAI-DAT-KHONG-XOA.sql' AS ThongBao;


-- Tổng đơn và tiền (không cộng VND USD CNY)
IF OBJECT_ID(N'dbo.DonHang',N'U') IS NOT NULL
  EXEC sys.sp_executesql N'SELECT TrangThai,LoaiTien,COUNT(*) AS SoDon,SUM(SoTien) AS TongSoTien FROM dbo.DonHang GROUP BY TrangThai,LoaiTien ORDER BY TrangThai,LoaiTien';
ELSE
  SELECT N'Chưa đủ bảng cho báo cáo: DonHang. Kiểm tra file 00-CAI-DAT-KHONG-XOA.sql' AS ThongBao;


-- Doanh thu ghi nhận ở giao dịch thành công (đang mô phỏng)
IF OBJECT_ID(N'dbo.GiaoDich',N'U') IS NOT NULL
  EXEC sys.sp_executesql N'SELECT CAST(DATEADD(HOUR,7,NgayThanhToan) AS DATE) AS NgayVN,LoaiTien,COUNT(*) AS SoGiaoDich,SUM(SoTien) AS Tong FROM dbo.GiaoDich WHERE TrangThai=''success'' GROUP BY CAST(DATEADD(HOUR,7,NgayThanhToan) AS DATE),LoaiTien ORDER BY NgayVN DESC,LoaiTien';
ELSE
  SELECT N'Chưa đủ bảng cho báo cáo: GiaoDich. Kiểm tra file 00-CAI-DAT-KHONG-XOA.sql' AS ThongBao;
