-- Run ONLY against a disposable test database after migrations+seed.
-- Read-only checks; always verify DB_NAME before executing.
SELECT DB_NAME() AS CurrentDatabase;
SELECT Version, FileName, AppliedAt FROM dbo.SchemaMigrations WHERE Version=14;
SELECT LoaiTien, DonGiaDangMinor, DonGiaDichMinor, GioiHanVideo, GioiHanBanDich,
 GiamGiaNamPct, PhienBan FROM dbo.BangGia ORDER BY LoaiTien;
SELECT TOP(20) MaDonHang, LoaiTien, SoTien, DonGiaDangSnapshot,
 DonGiaDichSnapshot, PhienBanGiaSnapshot FROM dbo.DonHang ORDER BY MaDonHang DESC;
SELECT TOP(20) MaLichSu, LoaiTien, PhienBanCu, PhienBanMoi, LyDo FROM dbo.LichSuBangGia ORDER BY MaLichSu DESC;
