USE DubchefDB;
GO
-- Chỉ đọc: kiểm tra nguồn xác nhận giao dịch, không sửa dữ liệu.
SELECT
  d.MaDonHang,
  d.MaNguoiDung,
  d.EmailKhachHang,
  d.TrangThai AS TrangThaiDon,
  d.SoTien AS SoTienDon,
  RTRIM(d.LoaiTien) AS LoaiTien,
  g.MaGiaoDich,
  g.PhuongThuc,
  g.MaThamChieu,
  g.NguonXacNhan,
  g.TrangThai AS TrangThaiGiaoDich,
  g.NgayThanhToan
FROM dbo.DonHang d
LEFT JOIN dbo.GiaoDich g ON g.MaDonHang=d.MaDonHang
ORDER BY d.MaDonHang DESC, g.MaGiaoDich DESC;
GO
SELECT
  COALESCE(g.NguonXacNhan, 'no_transaction') AS NguonXacNhan,
  COUNT_BIG(*) AS SoGiaoDich,
  RTRIM(g.LoaiTien) AS LoaiTien,
  SUM(CASE WHEN g.TrangThai='success' THEN g.SoTien ELSE 0 END) AS TongTien
FROM dbo.GiaoDich g
GROUP BY g.NguonXacNhan,g.LoaiTien
ORDER BY NguonXacNhan, LoaiTien;
GO
-- Chỉ tổng hợp nguồn payOS đã xác minh chữ ký (không cộng chung USD/CNY).
SELECT COUNT_BIG(*) AS SoGiaoDichPayOS, ISNULL(SUM(SoTien), 0) AS TongVND_PayOS
FROM dbo.GiaoDich
WHERE TrangThai='success' AND NguonXacNhan='payos' AND LoaiTien='VND';
GO
