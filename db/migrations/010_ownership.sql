-- Migration 10 - Bo sung lien ket chu so huu don hang, rang buoc thanh toan
-- va nhat ky thay doi quan tri. AN TOAN VOI DU LIEU CU: khong xoa/backfill.
-- Server tu chay sau 02-schema, 04-workflows va 07-quan-tri-nghiep-vu.
-- Neu chay thu cong trong SSMS, chon dung database DubchefDB truoc.
USE DubchefDB;
GO
IF COL_LENGTH('dbo.DonHang', 'MaNguoiDung') IS NULL
  ALTER TABLE dbo.DonHang ADD MaNguoiDung INT NULL;
GO
IF NOT EXISTS (SELECT 1 FROM sys.indexes
               WHERE object_id=OBJECT_ID(N'dbo.DonHang') AND name='IX_DonHang_MaNguoiDung_NgayTao')
  CREATE INDEX IX_DonHang_MaNguoiDung_NgayTao
    ON dbo.DonHang(MaNguoiDung,NgayTao DESC) INCLUDE(TrangThai);
GO
-- Chi them FK neu cac ID da co la hop le. NULL hop le voi don cu chua xac minh.
IF NOT EXISTS (SELECT 1 FROM sys.foreign_keys
               WHERE parent_object_id=OBJECT_ID(N'dbo.DonHang') AND name='FK_DonHang_NguoiDung')
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM dbo.DonHang d
    LEFT JOIN dbo.NguoiDung u ON u.MaNguoiDung=d.MaNguoiDung
    WHERE d.MaNguoiDung IS NOT NULL AND u.MaNguoiDung IS NULL
  )
    ALTER TABLE dbo.DonHang WITH CHECK
      ADD CONSTRAINT FK_DonHang_NguoiDung FOREIGN KEY(MaNguoiDung)
      REFERENCES dbo.NguoiDung(MaNguoiDung);
  ELSE
    PRINT N'CANH BAO: DonHang co MaNguoiDung khong hop le; chua them FK. Xem bao cao doi soat.';
END;
GO
-- Moi don chi nen co mot giao dich success. Khong can thiệp lịch sử nếu đã sai.
IF NOT EXISTS (SELECT 1 FROM sys.indexes
               WHERE object_id=OBJECT_ID(N'dbo.GiaoDich') AND name='UX_GiaoDich_MotThanhCong')
BEGIN
  IF NOT EXISTS (SELECT MaDonHang FROM dbo.GiaoDich WHERE TrangThai='success'
                 GROUP BY MaDonHang HAVING COUNT_BIG(*)>1)
    CREATE UNIQUE INDEX UX_GiaoDich_MotThanhCong
      ON dbo.GiaoDich(MaDonHang) WHERE TrangThai='success';
  ELSE
    PRINT N'CANH BAO: Co don nhieu giao dich success; chua tao UNIQUE index.';
END;
GO
-- Lưu vết cho thay đổi tài khoản/video (không ghi mật khẩu hoặc token).
IF OBJECT_ID(N'dbo.NhatKyQuanTri', N'U') IS NULL
CREATE TABLE dbo.NhatKyQuanTri (
  MaNhatKy BIGINT IDENTITY(1,1) NOT NULL CONSTRAINT PK_NhatKyQuanTri PRIMARY KEY,
  Loai VARCHAR(30) NOT NULL,
  DoiTuong NVARCHAR(254) NOT NULL,
  NguoiThucHien NVARCHAR(254) NOT NULL,
  GiaTriCu NVARCHAR(40) NULL,
  GiaTriMoi NVARCHAR(40) NULL,
  ThoiGian DATETIME2(0) NOT NULL CONSTRAINT DF_NhatKyQuanTri_ThoiGian DEFAULT SYSUTCDATETIME()
);
GO
IF NOT EXISTS (SELECT 1 FROM sys.indexes
               WHERE object_id=OBJECT_ID(N'dbo.NhatKyQuanTri') AND name='IX_NhatKyQuanTri_ThoiGian')
  CREATE INDEX IX_NhatKyQuanTri_ThoiGian ON dbo.NhatKyQuanTri(ThoiGian DESC);
GO
PRINT N'Migration 10 hoan thanh: giu nguyen cac don cu khong co MaNguoiDung.';
GO
