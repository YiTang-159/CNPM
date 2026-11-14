-- Inspection ONLY, never delete. Review possible test accounts manually.
SELECT TOP(200) MaNguoiDung, HoTen, Email, VaiTro, TrangThai, NgayTao
FROM dbo.NguoiDung
WHERE Email LIKE '%test%' OR Email LIKE '%.invalid' OR LEN(LTRIM(RTRIM(HoTen))) < 3
ORDER BY NgayTao DESC;
SELECT TOP(100) MaDonHang, EmailKhachHang, SoTien, TrangThai, NgayTao
FROM dbo.DonHang WHERE EmailKhachHang LIKE '%test%'
ORDER BY MaDonHang DESC;
SELECT TOP(100) MaLienHe, HoTen, Email, NgayTao
FROM dbo.LienHe WHERE Email LIKE '%test%'
ORDER BY MaLienHe DESC;
