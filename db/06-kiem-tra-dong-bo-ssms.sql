-- TRUY VẤN KIỂM TRA TỪNG PHÂN HỆ - ĐỌC DỮ LIỆU THẬT
-- Chạy được trực tiếp trong SSMS. Không thêm, sửa, xóa dữ liệu.
-- Nếu chưa có bảng -> trả thông báo thay vì lỗi Invalid object name.


-- =============== 00-TONG-HOP.sql ===============
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

GO

-- =============== 01-NguoiDung.sql ===============
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

GO

-- =============== 02-Video-ThuyetMinh-PhuDe.sql ===============
-- BÁO CÁO DUBCHEF / CHỈ ĐỌC / TỪ SSMS CHỌN localhost,1433.
-- Mở trực tiếp file này -> Execute (F5); không INSERT/UPDATE/DELETE.
-- Cần chạy db/00-CAI-DAT-KHONG-XOA.sql nếu thiếu bảng.
USE DubchefDB;
GO
SET NOCOUNT ON;

-- Video và chủ sở hữu
IF OBJECT_ID(N'dbo.Video',N'U') IS NOT NULL AND OBJECT_ID(N'dbo.NguoiDung',N'U') IS NOT NULL
  EXEC sys.sp_executesql N'SELECT TOP (50) v.MaVideo,u.Email,v.TieuDe,v.TenTep,v.NgonNguGoc,v.TrangThai,v.NgayTaiLen FROM dbo.Video v JOIN dbo.NguoiDung u ON u.MaNguoiDung=v.MaNguoiDung ORDER BY v.MaVideo DESC';
ELSE
  SELECT N'Chưa đủ bảng cho báo cáo: Video, NguoiDung. Kiểm tra file 00-CAI-DAT-KHONG-XOA.sql' AS ThongBao;


-- Thuyết minh
IF OBJECT_ID(N'dbo.ThuyetMinh',N'U') IS NOT NULL AND OBJECT_ID(N'dbo.Video',N'U') IS NOT NULL
  EXEC sys.sp_executesql N'SELECT TOP (50) t.MaThuyetMinh,t.MaVideo,v.TieuDe,t.NgonNgu,LEFT(t.NoiDung,250) AS NoiDungTomTat,t.NgayTao FROM dbo.ThuyetMinh t JOIN dbo.Video v ON v.MaVideo=t.MaVideo ORDER BY t.MaThuyetMinh DESC';
ELSE
  SELECT N'Chưa đủ bảng cho báo cáo: ThuyetMinh, Video. Kiểm tra file 00-CAI-DAT-KHONG-XOA.sql' AS ThongBao;


-- Phụ đề
IF OBJECT_ID(N'dbo.PhuDe',N'U') IS NOT NULL AND OBJECT_ID(N'dbo.Video',N'U') IS NOT NULL
  EXEC sys.sp_executesql N'SELECT TOP (50) p.MaPhuDe,p.MaVideo,v.TieuDe,p.NgonNgu,LEFT(p.NoiDung,250) AS NoiDungTomTat,p.NgayTao FROM dbo.PhuDe p JOIN dbo.Video v ON v.MaVideo=p.MaVideo ORDER BY p.MaPhuDe DESC';
ELSE
  SELECT N'Chưa đủ bảng cho báo cáo: PhuDe, Video. Kiểm tra file 00-CAI-DAT-KHONG-XOA.sql' AS ThongBao;

GO

-- =============== 03-PhanHoi-LienHe.sql ===============
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

GO

-- =============== 04-DonHang-DoanhThu.sql ===============
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

GO

-- =============== 05-NgonNgu-QR.sql ===============
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

GO
