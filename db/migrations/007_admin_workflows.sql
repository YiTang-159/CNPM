/* DUBCHEF - MIGRATION 07 / QUẢN TRỊ NỘI DUNG VÀ CHĂM SÓC KHÁCH HÀNG
   CHẠY SAU 02-schema.sql + 04-workflows.sql, trên database DubchefDB.
   Có thể chạy lại; chỉ bổ sung cột/bảng còn thiếu. Không xóa hay thay đổi dữ liệu cũ.
   Sao lưu dữ liệu trước khi chạy trên hệ thống đang hoạt động.
*/
USE DubchefDB;
GO
-- Nội dung đầu ra: bản nháp -> đang duyệt -> đã xuất bản. Phiên bản bảo vệ ghi đè đồng thời.
IF COL_LENGTH('dbo.ThuyetMinh','TrangThaiDuyet') IS NULL
  ALTER TABLE dbo.ThuyetMinh ADD TrangThaiDuyet VARCHAR(12) NOT NULL CONSTRAINT DF_TM_Duyet DEFAULT 'draft';
IF COL_LENGTH('dbo.ThuyetMinh','PhienBan') IS NULL
  ALTER TABLE dbo.ThuyetMinh ADD PhienBan INT NOT NULL CONSTRAINT DF_TM_PhienBan DEFAULT 1;
IF COL_LENGTH('dbo.ThuyetMinh','NguoiSua') IS NULL
  ALTER TABLE dbo.ThuyetMinh ADD NguoiSua NVARCHAR(254) NULL;
IF COL_LENGTH('dbo.ThuyetMinh','NgayCapNhat') IS NULL
  ALTER TABLE dbo.ThuyetMinh ADD NgayCapNhat DATETIME2(0) NOT NULL CONSTRAINT DF_TM_NgayCapNhat DEFAULT SYSUTCDATETIME();
GO
IF COL_LENGTH('dbo.PhuDe','TrangThaiDuyet') IS NULL
  ALTER TABLE dbo.PhuDe ADD TrangThaiDuyet VARCHAR(12) NOT NULL CONSTRAINT DF_PD_Duyet DEFAULT 'draft';
IF COL_LENGTH('dbo.PhuDe','PhienBan') IS NULL
  ALTER TABLE dbo.PhuDe ADD PhienBan INT NOT NULL CONSTRAINT DF_PD_PhienBan DEFAULT 1;
IF COL_LENGTH('dbo.PhuDe','NguoiSua') IS NULL
  ALTER TABLE dbo.PhuDe ADD NguoiSua NVARCHAR(254) NULL;
IF COL_LENGTH('dbo.PhuDe','NgayCapNhat') IS NULL
  ALTER TABLE dbo.PhuDe ADD NgayCapNhat DATETIME2(0) NOT NULL CONSTRAINT DF_PD_NgayCapNhat DEFAULT SYSUTCDATETIME();
GO
IF OBJECT_ID(N'dbo.LichSuNoiDung', N'U') IS NULL
BEGIN
  CREATE TABLE dbo.LichSuNoiDung (
    MaLichSu BIGINT IDENTITY(1,1) PRIMARY KEY,
    Loai VARCHAR(12) NOT NULL CHECK(Loai IN ('narrations','subtitles')),
    MaVideo INT NOT NULL,
    NgonNgu VARCHAR(8) NOT NULL,
    PhienBan INT NOT NULL,
    TrangThai VARCHAR(12) NOT NULL,
    NoiDung NVARCHAR(MAX) NOT NULL,
    NguoiSua NVARCHAR(254) NOT NULL,
    ThoiGian DATETIME2(0) NOT NULL DEFAULT SYSUTCDATETIME()
  );
END;
GO
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE object_id=OBJECT_ID('dbo.LichSuNoiDung') AND name='IX_LichSuNoiDung_KeToan')
  CREATE INDEX IX_LichSuNoiDung_KeToan ON dbo.LichSuNoiDung(Loai, MaVideo, NgonNgu, MaLichSu DESC);
GO
-- Hàng đợi phản hồi: ưu tiên, người xử lý, thời điểm cập nhật.
IF COL_LENGTH('dbo.PhanHoi','UuTien') IS NULL
  ALTER TABLE dbo.PhanHoi ADD UuTien VARCHAR(8) NOT NULL CONSTRAINT DF_PH_UuTien DEFAULT 'normal';
IF COL_LENGTH('dbo.PhanHoi','NguoiXuLy') IS NULL
  ALTER TABLE dbo.PhanHoi ADD NguoiXuLy NVARCHAR(254) NULL;
IF COL_LENGTH('dbo.PhanHoi','NgayCapNhat') IS NULL
  ALTER TABLE dbo.PhanHoi ADD NgayCapNhat DATETIME2(0) NOT NULL CONSTRAINT DF_PH_NgayCN DEFAULT SYSUTCDATETIME();
IF COL_LENGTH('dbo.PhanHoi','NgayGiaiQuyet') IS NULL
  ALTER TABLE dbo.PhanHoi ADD NgayGiaiQuyet DATETIME2(0) NULL;
GO
IF COL_LENGTH('dbo.LienHe','UuTien') IS NULL
  ALTER TABLE dbo.LienHe ADD UuTien VARCHAR(8) NOT NULL CONSTRAINT DF_LH_UuTien DEFAULT 'normal';
IF COL_LENGTH('dbo.LienHe','NguoiXuLy') IS NULL
  ALTER TABLE dbo.LienHe ADD NguoiXuLy NVARCHAR(254) NULL;
IF COL_LENGTH('dbo.LienHe','NgayCapNhat') IS NULL
  ALTER TABLE dbo.LienHe ADD NgayCapNhat DATETIME2(0) NOT NULL CONSTRAINT DF_LH_NgayCN DEFAULT SYSUTCDATETIME();
IF COL_LENGTH('dbo.LienHe','NgayGiaiQuyet') IS NULL
  ALTER TABLE dbo.LienHe ADD NgayGiaiQuyet DATETIME2(0) NULL;
GO
IF OBJECT_ID(N'dbo.LichSuXuLyPhanHoi', N'U') IS NULL
BEGIN
  CREATE TABLE dbo.LichSuXuLyPhanHoi (
    MaLichSu BIGINT IDENTITY(1,1) PRIMARY KEY,
    Nguon VARCHAR(8) NOT NULL CHECK(Nguon IN ('user','contact')),
    MaBanGhi INT NOT NULL,
    TrangThai VARCHAR(15) NOT NULL,
    UuTien VARCHAR(8) NOT NULL,
    TraLoi NVARCHAR(2000) NULL,
    NguoiXuLy NVARCHAR(254) NOT NULL,
    ThoiGian DATETIME2(0) NOT NULL DEFAULT SYSUTCDATETIME()
  );
END;
GO
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE object_id=OBJECT_ID('dbo.LichSuXuLyPhanHoi') AND name='IX_LichSuPhanHoi_BanGhi')
  CREATE INDEX IX_LichSuPhanHoi_BanGhi ON dbo.LichSuXuLyPhanHoi(Nguon, MaBanGhi, MaLichSu DESC);
GO
-- View chỉ đọc: dữ liệu thật, tách quản lý theo nguồn rõ ràng.
CREATE OR ALTER VIEW dbo.vw_QuanTriNoiDung AS
SELECT 'narrations' AS Loai, t.MaThuyetMinh AS MaBanGhi, t.MaVideo, v.TieuDe,
  n.Email AS EmailKhachHang, t.NgonNgu, t.TrangThaiDuyet, t.PhienBan,
  t.NguoiSua, t.NgayCapNhat, t.NgayTao
FROM dbo.ThuyetMinh t JOIN dbo.Video v ON v.MaVideo=t.MaVideo
JOIN dbo.NguoiDung n ON n.MaNguoiDung=v.MaNguoiDung
UNION ALL
SELECT 'subtitles', p.MaPhuDe, p.MaVideo, v.TieuDe,
  n.Email, p.NgonNgu, p.TrangThaiDuyet, p.PhienBan,
  p.NguoiSua, p.NgayCapNhat, p.NgayTao
FROM dbo.PhuDe p JOIN dbo.Video v ON v.MaVideo=p.MaVideo
JOIN dbo.NguoiDung n ON n.MaNguoiDung=v.MaNguoiDung;
GO
CREATE OR ALTER VIEW dbo.vw_QuanTriPhanHoi AS
SELECT CAST('f-' + CAST(p.MaPhanHoi AS VARCHAR(20)) AS VARCHAR(25)) AS MaYeuCau,
  CAST('user' AS VARCHAR(8)) AS Nguon, n.HoTen, n.Email, p.NoiDung,
  p.TrangThai, p.UuTien, p.TraLoi, p.NguoiXuLy, p.NgayTao, p.NgayCapNhat, p.NgayGiaiQuyet
FROM dbo.PhanHoi p JOIN dbo.NguoiDung n ON n.MaNguoiDung=p.MaNguoiDung
UNION ALL
SELECT 'c-' + CAST(c.MaLienHe AS VARCHAR(20)), 'contact', c.HoTen,c.Email,c.NoiDung,
  c.TrangThai,c.UuTien,c.TraLoi,c.NguoiXuLy,c.NgayTao,c.NgayCapNhat,c.NgayGiaiQuyet
FROM dbo.LienHe c;
GO
PRINT N'Đã kiểm tra migration 07: quản trị nội dung và phản hồi, không xóa bản ghi.';
GO
