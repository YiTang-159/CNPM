/* BÁO CÁO TỔNG HỢP DUBCHEF - MỞ SSMS localhost,1433 / DubchefDB -> F5.
   CHỈ ĐỌC: KHÔNG XÓA / KHÔNG CHÈN / KHÔNG CẬP NHẬT.
   Mỗi SELECT trả một bảng Results riêng; dữ liệu được lấy từ các nghiệp vụ thực tế.
   Báo cáo có thể rỗng khi chưa có dữ liệu; không tạo dữ liệu mẫu.
   File này được tổng hợp từ db/bao-cao/00..06; có thể chạy từng file riêng.
*/


-- ============ NHÓM 1: 00-TONG-HOP.sql ============
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



-- ============ NHÓM 2: 01-NguoiDung.sql ============
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



-- ============ NHÓM 3: 02-Video-ThuyetMinh-PhuDe.sql ============
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


-- Mỗi câu phụ đề/thuyết minh ra một dòng SSMS: đọc JSON theo mốc thời gian.
IF OBJECT_ID(N'dbo.ThuyetMinh', N'U') IS NOT NULL
 EXEC sys.sp_executesql N'SELECT TOP(100) t.MaVideo,t.NgonNgu,j.[key] AS ThuTu,TRY_CONVERT(FLOAT,JSON_VALUE(j.value,''$.start'')) AS BatDauGiay,TRY_CONVERT(FLOAT,JSON_VALUE(j.value,''$.end'')) AS KetThucGiay,JSON_VALUE(j.value,''$.text'') AS NoiDung FROM dbo.ThuyetMinh t CROSS APPLY OPENJSON(CASE WHEN ISJSON(t.NoiDung)=1 THEN t.NoiDung ELSE ''[]'' END) j ORDER BY t.MaVideo DESC, t.NgonNgu, TRY_CONVERT(INT,j.[key])';
ELSE SELECT N''Chưa có bảng ThuyetMinh'' AS ThongBao;
IF OBJECT_ID(N'dbo.PhuDe', N'U') IS NOT NULL
 EXEC sys.sp_executesql N'SELECT TOP(100) p.MaVideo,p.NgonNgu,j.[key] AS ThuTu,TRY_CONVERT(FLOAT,JSON_VALUE(j.value,''$.start'')) AS BatDauGiay,TRY_CONVERT(FLOAT,JSON_VALUE(j.value,''$.end'')) AS KetThucGiay,JSON_VALUE(j.value,''$.text'') AS NoiDung FROM dbo.PhuDe p CROSS APPLY OPENJSON(CASE WHEN ISJSON(p.NoiDung)=1 THEN p.NoiDung ELSE ''[]'' END) j ORDER BY p.MaVideo DESC,p.NgonNgu,TRY_CONVERT(INT,j.[key])';
ELSE SELECT N''Chưa có bảng PhuDe'' AS ThongBao;



-- ============ NHÓM 4: 03-PhanHoi-LienHe.sql ============
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



-- ============ NHÓM 5: 04-DonHang-DoanhThu.sql ============
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



-- ============ NHÓM 6: 05-NgonNgu-QR.sql ============
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



-- ============ NHÓM 7: 06-KiemDuyet-LichSu.sql ============
-- BÁO CÁO 06: Kiểm duyệt nội dung, lịch sử chỉnh sửa và xử lý phản hồi.
-- CHỈ ĐỌC. Yêu cầu migration db/07-quan-tri-nghiep-vu.sql đã chạy.
USE DubchefDB;
GO
SET NOCOUNT ON;
-- Bảng 1: Các bản thuyết minh/phụ đề cần duyệt.
IF OBJECT_ID(N'dbo.vw_QuanTriNoiDung', N'V') IS NOT NULL
 EXEC sys.sp_executesql N'SELECT TOP(100) Loai, MaBanGhi, MaVideo, TieuDe, EmailKhachHang, NgonNgu, TrangThaiDuyet, PhienBan, NguoiSua, NgayCapNhat FROM dbo.vw_QuanTriNoiDung ORDER BY NgayCapNhat DESC, MaBanGhi DESC';
ELSE SELECT N'Chưa cài migration 07 - thiếu vw_QuanTriNoiDung' AS ThongBao;
-- Bảng 2: Số bản theo trạng thái kiểm duyệt.
IF OBJECT_ID(N'dbo.vw_QuanTriNoiDung', N'V') IS NOT NULL
 EXEC sys.sp_executesql N'SELECT Loai, TrangThaiDuyet, COUNT(*) AS SoBan FROM dbo.vw_QuanTriNoiDung GROUP BY Loai,TrangThaiDuyet ORDER BY Loai,TrangThaiDuyet';
ELSE SELECT N'Chưa cài migration 07' AS ThongBao;
-- Bảng 3: Nhật ký sửa nội dung, không hiển thị toàn bộ JSON vì có thể rất dài.
IF OBJECT_ID(N'dbo.LichSuNoiDung', N'U') IS NOT NULL
 EXEC sys.sp_executesql N'SELECT TOP(100) MaLichSu, Loai, MaVideo, NgonNgu, PhienBan, TrangThai, NguoiSua, ThoiGian, LEN(NoiDung) AS SoKyTu FROM dbo.LichSuNoiDung ORDER BY MaLichSu DESC';
ELSE SELECT N'Chưa cài migration 07' AS ThongBao;
-- Bảng 4: Hàng đợi phản hồi, xem cả người có tài khoản và liên hệ chưa đăng nhập.
IF OBJECT_ID(N'dbo.vw_QuanTriPhanHoi', N'V') IS NOT NULL
 EXEC sys.sp_executesql N'SELECT TOP(100) MaYeuCau, Nguon, HoTen, Email, TrangThai, UuTien, NoiDung, TraLoi, NguoiXuLy, NgayTao, NgayCapNhat, NgayGiaiQuyet FROM dbo.vw_QuanTriPhanHoi ORDER BY CASE UuTien WHEN ''high'' THEN 0 WHEN ''normal'' THEN 1 ELSE 2 END, NgayTao DESC';
ELSE SELECT N'Chưa cài migration 07' AS ThongBao;
-- Bảng 5: Lịch sử xử lý phản hồi.
IF OBJECT_ID(N'dbo.LichSuXuLyPhanHoi', N'U') IS NOT NULL
 EXEC sys.sp_executesql N'SELECT TOP(100) MaLichSu, Nguon, MaBanGhi, TrangThai, UuTien, TraLoi, NguoiXuLy, ThoiGian FROM dbo.LichSuXuLyPhanHoi ORDER BY MaLichSu DESC';
ELSE SELECT N'Chưa cài migration 07' AS ThongBao;

