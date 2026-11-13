USE DubchefDB;
GO
-- 1. Moi don moi da duoc xac nhan tao mot goi quyent loi duy nhat.
SELECT q.MaQuyenLoi, q.MaDonHang, u.HoTen, u.Email,
 q.NguonXacNhan, q.SoVideoDang, q.DaDungVideoDang,
 q.SoVideoDang-q.DaDungVideoDang AS ConTaiLen,
 q.SoVideoDich, q.DaDungVideoDich,
 q.SoVideoDich-q.DaDungVideoDich AS ConDich, q.NgayCap
FROM dbo.QuyenLoiGoi q
JOIN dbo.NguoiDung u ON u.MaNguoiDung=q.MaNguoiDung
ORDER BY q.MaQuyenLoi DESC;
GO
-- 2. Cac su dung/hoan luot (giu lich su ke ca khi video bi xoa).
SELECT TOP(100) s.MaSuDung, s.MaVideo, s.Loai, s.NgonNgu,
 s.TrangThai, s.NgaySuDung, q.MaDonHang, u.Email
FROM dbo.SuDungQuyenLoi s JOIN dbo.QuyenLoiGoi q ON q.MaQuyenLoi=s.MaQuyenLoi
JOIN dbo.NguoiDung u ON u.MaNguoiDung=q.MaNguoiDung
ORDER BY s.MaSuDung DESC;
GO
-- 3. Don paid KHONG duoc cap luot: can xem xet, khong tu dong backfill.
SELECT d.MaDonHang,d.MaNguoiDung,d.EmailKhachHang,d.TrangThai,
 p.NguonXacNhan,d.SoVideoDang,d.SoVideoDich
FROM dbo.DonHang d
OUTER APPLY (SELECT TOP(1) NguonXacNhan FROM dbo.GiaoDich
             WHERE MaDonHang=d.MaDonHang AND TrangThai='success'
             ORDER BY MaGiaoDich DESC) p
LEFT JOIN dbo.QuyenLoiGoi q ON q.MaDonHang=d.MaDonHang
WHERE d.TrangThai='paid' AND q.MaQuyenLoi IS NULL
ORDER BY d.MaDonHang DESC;
GO
-- 4. Bat thuong ve doi soat: du lieu khong duoc vuot han muc.
SELECT q.MaQuyenLoi, q.MaDonHang, q.SoVideoDang, q.DaDungVideoDang,
 q.SoVideoDich, q.DaDungVideoDich,
 (SELECT COUNT(*) FROM dbo.SuDungQuyenLoi s WHERE s.MaQuyenLoi=q.MaQuyenLoi
   AND s.Loai='upload' AND s.TrangThai='used') AS SoUploadCoLichSu,
 (SELECT COUNT(*) FROM dbo.SuDungQuyenLoi s WHERE s.MaQuyenLoi=q.MaQuyenLoi
   AND s.Loai='translation' AND s.TrangThai='used') AS SoBanDichCoLichSu
FROM dbo.QuyenLoiGoi q
WHERE q.DaDungVideoDang<> (SELECT COUNT(*) FROM dbo.SuDungQuyenLoi s WHERE s.MaQuyenLoi=q.MaQuyenLoi AND s.Loai='upload' AND s.TrangThai='used')
   OR q.DaDungVideoDich<> (SELECT COUNT(*) FROM dbo.SuDungQuyenLoi s WHERE s.MaQuyenLoi=q.MaQuyenLoi AND s.Loai='translation' AND s.TrangThai='used');
GO
