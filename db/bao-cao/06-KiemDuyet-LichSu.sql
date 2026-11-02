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
