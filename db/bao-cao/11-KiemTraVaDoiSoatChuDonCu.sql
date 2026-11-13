-- DUBCHEF: READ ONLY. Execute in SSMS, no data changes.
USE DubchefDB;
GO
-- 1. All orders still missing an owner (historical unlinked records).
SELECT d.MaDonHang,d.EmailKhachHang,d.TenKhachHang,d.TrangThai,d.SoTien,d.LoaiTien,
  p.NguonXacNhan,d.NgayTao,
  (SELECT COUNT(*) FROM dbo.NguoiDung u WHERE u.VaiTro='user'
    AND LOWER(LTRIM(RTRIM(u.Email)))=LOWER(LTRIM(RTRIM(d.EmailKhachHang)))) AS SoTaiKhoanGoiY
FROM dbo.DonHang d
OUTER APPLY (SELECT TOP(1) NguonXacNhan FROM dbo.GiaoDich g
             WHERE g.MaDonHang=d.MaDonHang AND g.TrangThai='success' ORDER BY g.MaGiaoDich DESC) p
WHERE d.MaNguoiDung IS NULL
ORDER BY d.MaDonHang DESC;
GO
-- 2. Audit of manually linked legacy orders. Not a statement of bank payment verification.
IF OBJECT_ID('dbo.XacMinhChuDonHang','U') IS NOT NULL
  SELECT TOP(100) x.MaDonHang,x.MaNguoiDung,u.Email,x.LoaiBangChung,
      x.MaBangChung,x.LyDo,x.NguoiXacMinh,x.ThoiGian
  FROM dbo.XacMinhChuDonHang x JOIN dbo.NguoiDung u ON u.MaNguoiDung=x.MaNguoiDung
  ORDER BY x.MaXacMinh DESC;
GO
-- 3. Unlinked count and linked record count. Historical transactions remain unchanged.
SELECT SUM(CASE WHEN MaNguoiDung IS NULL THEN 1 ELSE 0 END) AS DonChuaLienKet,
       SUM(CASE WHEN MaNguoiDung IS NOT NULL THEN 1 ELSE 0 END) AS DonDaLienKet
FROM dbo.DonHang;
GO
