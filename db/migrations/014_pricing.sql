-- Additive and repeatable migration: old paid orders and user data remain untouched.
IF OBJECT_ID(N'dbo.SchemaMigrations',N'U') IS NULL
  CREATE TABLE dbo.SchemaMigrations(Version INT NOT NULL PRIMARY KEY, FileName NVARCHAR(100) NOT NULL,
    AppliedAt DATETIME2(0) NOT NULL DEFAULT SYSUTCDATETIME());
GO
IF OBJECT_ID(N'dbo.BangGia',N'U') IS NULL
  CREATE TABLE dbo.BangGia(
    LoaiTien CHAR(3) NOT NULL CONSTRAINT PK_BangGia PRIMARY KEY,
    DonGiaDangMinor BIGINT NOT NULL CHECK (DonGiaDangMinor BETWEEN 0 AND 100000000),
    DonGiaDichMinor BIGINT NOT NULL CHECK (DonGiaDichMinor BETWEEN 0 AND 100000000),
    GioiHanVideo INT NOT NULL CHECK (GioiHanVideo BETWEEN 1 AND 5000),
    GioiHanBanDich INT NOT NULL CHECK (GioiHanBanDich BETWEEN 1 AND 3),
    GiamGiaNamPct INT NOT NULL CHECK (GiamGiaNamPct BETWEEN 0 AND 90),
    PhienBan BIGINT NOT NULL CONSTRAINT DF_BangGia_PhienBan DEFAULT (1),
    NguoiSua NVARCHAR(254) NULL,
    NgayCapNhat DATETIME2(0) NOT NULL DEFAULT SYSUTCDATETIME()
  );
GO
IF OBJECT_ID(N'dbo.LichSuBangGia',N'U') IS NULL
  CREATE TABLE dbo.LichSuBangGia(
    MaLichSu BIGINT IDENTITY(1,1) NOT NULL PRIMARY KEY,
    LoaiTien CHAR(3) NOT NULL,
    GiaCu NVARCHAR(MAX) NOT NULL, GiaMoi NVARCHAR(MAX) NOT NULL,
    PhienBanCu BIGINT NOT NULL, PhienBanMoi BIGINT NOT NULL,
    NguoiSua NVARCHAR(254) NOT NULL, LyDo NVARCHAR(500) NOT NULL,
    NgaySua DATETIME2(0) NOT NULL DEFAULT SYSUTCDATETIME(),
    CONSTRAINT FK_LichSuBangGia_BangGia FOREIGN KEY (LoaiTien) REFERENCES dbo.BangGia(LoaiTien)
  );
GO
IF OBJECT_ID(N'dbo.GoiDichVu',N'U') IS NULL
  CREATE TABLE dbo.GoiDichVu(
    MaGoi INT NOT NULL PRIMARY KEY, TenGoi NVARCHAR(100) NOT NULL,
    SoVideoDang INT NOT NULL CHECK (SoVideoDang > 0),
    SoVideoDich INT NOT NULL CHECK (SoVideoDich > 0),
    ThoiHanNgay INT NULL CHECK (ThoiHanNgay > 0),
    HienThi BIT NOT NULL DEFAULT(1), ThuTu INT NOT NULL DEFAULT(0),
    NgayCapNhat DATETIME2(0) NOT NULL DEFAULT SYSUTCDATETIME()
  );
GO
IF EXISTS (SELECT 1 FROM sys.check_constraints WHERE name=N'CK_DonHang_Dang' AND parent_object_id=OBJECT_ID(N'dbo.DonHang'))
 ALTER TABLE dbo.DonHang DROP CONSTRAINT CK_DonHang_Dang;
IF NOT EXISTS (SELECT 1 FROM sys.check_constraints WHERE name=N'CK_DonHang_Dang' AND parent_object_id=OBJECT_ID(N'dbo.DonHang'))
 ALTER TABLE dbo.DonHang WITH CHECK ADD CONSTRAINT CK_DonHang_Dang CHECK (SoVideoDang BETWEEN 0 AND 5000);
GO
IF EXISTS (SELECT 1 FROM sys.check_constraints WHERE name=N'CK_DonHang_Dich' AND parent_object_id=OBJECT_ID(N'dbo.DonHang'))
 ALTER TABLE dbo.DonHang DROP CONSTRAINT CK_DonHang_Dich;
IF NOT EXISTS (SELECT 1 FROM sys.check_constraints WHERE name=N'CK_DonHang_Dich' AND parent_object_id=OBJECT_ID(N'dbo.DonHang'))
 ALTER TABLE dbo.DonHang WITH CHECK ADD CONSTRAINT CK_DonHang_Dich CHECK (SoVideoDich BETWEEN 0 AND 15000);
GO
IF COL_LENGTH(N'dbo.DonHang',N'DonGiaDangSnapshot') IS NULL
 ALTER TABLE dbo.DonHang ADD DonGiaDangSnapshot BIGINT NULL;
IF COL_LENGTH(N'dbo.DonHang',N'DonGiaDichSnapshot') IS NULL
 ALTER TABLE dbo.DonHang ADD DonGiaDichSnapshot BIGINT NULL;
IF COL_LENGTH(N'dbo.DonHang',N'PhienBanGiaSnapshot') IS NULL
 ALTER TABLE dbo.DonHang ADD PhienBanGiaSnapshot BIGINT NULL;
GO
-- Migration versioning is handled by scripts/run-migrations.mjs and server/src/migrations.mjs.
