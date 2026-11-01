-- Mở trong SSMS và chọn database DubchefDB. Không sửa/xóa dữ liệu.
USE DubchefDB;
GO
SELECT TOP (30) MaNguoiDung,HoTen,Email,VaiTro,TrangThai,NgayTao FROM dbo.NguoiDung ORDER BY MaNguoiDung DESC;
SELECT TOP (30) v.MaVideo,v.TieuDe,v.TenTep,v.TrangThai,v.NgonNguGoc,v.NgayTaiLen,u.Email
  FROM dbo.Video v JOIN dbo.NguoiDung u ON u.MaNguoiDung=v.MaNguoiDung ORDER BY v.MaVideo DESC;
SELECT TOP (30) p.MaPhuDe,p.MaVideo,p.NgonNgu,p.NoiDung,p.NgayTao FROM dbo.PhuDe p ORDER BY p.MaPhuDe DESC;
SELECT TOP (30) t.MaThuyetMinh,t.MaVideo,t.NgonNgu,t.NoiDung,t.NgayTao FROM dbo.ThuyetMinh t ORDER BY t.MaThuyetMinh DESC;
SELECT TOP (30) p.MaPhanHoi,u.Email,p.MaVideo,p.NoiDung,p.TrangThai,p.TraLoi
  FROM dbo.PhanHoi p JOIN dbo.NguoiDung u ON u.MaNguoiDung=p.MaNguoiDung ORDER BY p.MaPhanHoi DESC;
SELECT TOP (30) MaLienHe,HoTen,Email,NoiDung,TrangThai,TraLoi FROM dbo.LienHe ORDER BY MaLienHe DESC;
SELECT TOP (30) MaNgonNgu,TenNgonNgu,TenTiengAnh,TrangThai FROM dbo.NgonNgu ORDER BY MaNgonNgu;
SELECT TOP (30) MaDonHang,EmailKhachHang,SoTien,LoaiTien,TrangThai,NgayTao FROM dbo.DonHang ORDER BY MaDonHang DESC;
GO
