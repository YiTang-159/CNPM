/*
 DUBCHEF | KIEM TRA CHAT LUONG SAU NANG CAP - CHI DOC
 KHONG thay doi/bom/xoa du lieu. Chay trong SSMS: New Query -> Execute.
 Ket qua danh cho demo va doi soat; 0 dong bat thuong la mong doi.
 Nen chay sau khi khoi dong API moi (tu dong chay migration 10).
*/
USE DubchefDB;
GO
SET NOCOUNT ON;

-- 1) Kiem tra co so va rang buoc lien ket
SELECT N'Cot DonHang.MaNguoiDung' AS KiemTra,
  CASE WHEN COL_LENGTH('dbo.DonHang','MaNguoiDung') IS NULL THEN N'THIEU' ELSE N'CO' END KetQua
UNION ALL SELECT N'FK DonHang -> NguoiDung',
  CASE WHEN EXISTS(SELECT 1 FROM sys.foreign_keys WHERE name='FK_DonHang_NguoiDung'
     AND parent_object_id=OBJECT_ID(N'dbo.DonHang') AND is_disabled=0 AND is_not_trusted=0)
  THEN N'CO' ELSE N'CHUA CO/CHUA HOP LE' END
UNION ALL SELECT N'Chi 1 giao dich success/don',
  CASE WHEN EXISTS (SELECT 1 FROM sys.indexes WHERE name='UX_GiaoDich_MotThanhCong'
     AND object_id=OBJECT_ID(N'dbo.GiaoDich') AND is_disabled=0)
  THEN N'CO' ELSE N'CHUA CO' END
UNION ALL SELECT N'Bang nhat ky quan tri',
  CASE WHEN OBJECT_ID(N'dbo.NhatKyQuanTri',N'U') IS NULL THEN N'THIEU' ELSE N'CO' END;

-- 2) Danh sach don CHUA lien ket (lich su cu khong duoc tu gan theo email)
IF COL_LENGTH('dbo.DonHang','MaNguoiDung') IS NOT NULL
EXEC sys.sp_executesql N'SELECT MaDonHang,EmailKhachHang,TrangThai,SoTien,LoaiTien,
  DATEADD(HOUR,7,NgayTao) AS NgayTaoVN FROM dbo.DonHang
  WHERE MaNguoiDung IS NULL ORDER BY MaDonHang DESC';

-- 3) Kiem tra lien ket sai, co user ID nhung khong khop user
IF COL_LENGTH('dbo.DonHang','MaNguoiDung') IS NOT NULL
EXEC sys.sp_executesql N'SELECT d.MaDonHang,d.MaNguoiDung,d.EmailKhachHang,
  u.Email AS EmailTaiKhoan FROM dbo.DonHang d LEFT JOIN dbo.NguoiDung u
  ON u.MaNguoiDung=d.MaNguoiDung WHERE d.MaNguoiDung IS NOT NULL
  AND (u.MaNguoiDung IS NULL OR LOWER(LTRIM(RTRIM(d.EmailKhachHang))) <> LOWER(LTRIM(RTRIM(u.Email))))';

-- 4) Don hang co tinh trang giao dich bat thuong (KHONG nham 'success' voi tien nhan duoc)
SELECT d.MaDonHang,d.TrangThai, d.SoTien AS SoTienDon, d.LoaiTien,
       SUM(CASE WHEN g.TrangThai='success' THEN 1 ELSE 0 END) SoSuccess,
       SUM(CASE WHEN g.TrangThai='success' AND g.LoaiTien=d.LoaiTien THEN g.SoTien ELSE 0 END) SoTienSuccessCungTien
FROM dbo.DonHang d LEFT JOIN dbo.GiaoDich g ON g.MaDonHang=d.MaDonHang
GROUP BY d.MaDonHang,d.TrangThai,d.SoTien,d.LoaiTien
HAVING (d.TrangThai='paid' AND SUM(CASE WHEN g.TrangThai='success' THEN 1 ELSE 0 END) <> 1)
    OR (d.TrangThai<>'paid' AND SUM(CASE WHEN g.TrangThai='success' THEN 1 ELSE 0 END)>0)
    OR (SUM(CASE WHEN g.TrangThai='success' AND g.LoaiTien=d.LoaiTien THEN g.SoTien ELSE 0 END)>
        d.SoTien)
    OR (SUM(CASE WHEN g.TrangThai='success' THEN 1 ELSE 0 END)>0 AND
        SUM(CASE WHEN g.TrangThai='success' AND g.LoaiTien=d.LoaiTien THEN g.SoTien ELSE 0 END)<>d.SoTien);

-- 5) Tong hop theo DON VI TIEN RIENG; khong cong VND/USD/CNY voi nhau
SELECT g.LoaiTien,COUNT_BIG(*) AS SoGiaoDichMoPhongThanhCong,
  SUM(CONVERT(BIGINT,g.SoTien)) TongGiaTriTheoLoaiTien
FROM dbo.GiaoDich g WHERE g.TrangThai='success' GROUP BY g.LoaiTien ORDER BY g.LoaiTien;

-- 6) Doi soat danh muc ngon ngu voi pham vi backend hien tai
SELECT MaNgonNgu,TenNgonNgu,TrangThai,
  CASE WHEN MaNgonNgu IN ('vi','en','zh') THEN N'Co bo xu ly'
       ELSE N'Chi trong danh muc; chua co bo xu ly' END AS NangLuc
FROM dbo.NgonNgu ORDER BY MaNgonNgu;

-- 7) Lich su quan tri vua thay doi
IF OBJECT_ID(N'dbo.NhatKyQuanTri',N'U') IS NOT NULL
  EXEC sys.sp_executesql N'SELECT TOP(50) MaNhatKy,Loai,DoiTuong,NguoiThucHien,
  GiaTriCu,GiaTriMoi,DATEADD(HOUR,7,ThoiGian) AS ThoiGianVN
  FROM dbo.NhatKyQuanTri ORDER BY MaNhatKy DESC';

-- 8) Tinh trang cong viec tren Admin
SELECT (SELECT COUNT_BIG(*) FROM dbo.DonHang WHERE TrangThai='pending') AS DonChoThanhToan,
  (SELECT COUNT_BIG(*) FROM dbo.Video WHERE TrangThai='failed') AS VideoLoi,
  (SELECT COUNT_BIG(*) FROM dbo.PhanHoi WHERE TrangThai<>'resolved')+
  (SELECT COUNT_BIG(*) FROM dbo.LienHe WHERE TrangThai<>'resolved') AS YeuCauChuaGiaiQuyet,
  (SELECT COUNT_BIG(*) FROM dbo.ThuyetMinh WHERE TrangThaiDuyet='reviewing')+
  (SELECT COUNT_BIG(*) FROM dbo.PhuDe WHERE TrangThaiDuyet='reviewing') AS NoiDungChoDuyet;
GO
