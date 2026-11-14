-- Migration 12: quyen su dung dich vu gan voi DON DA THANH TOAN.
-- Co the chay nhieu lan. Khong cap luot cho don cu (legacy_unknown), don pending
-- hay don khong lien ket MaNguoiDung. Khong xoa du lieu cu.
IF OBJECT_ID(N'dbo.QuyenLoiGoi', N'U') IS NULL
BEGIN
  CREATE TABLE dbo.QuyenLoiGoi (
    MaQuyenLoi BIGINT IDENTITY(1,1) NOT NULL CONSTRAINT PK_QuyenLoiGoi PRIMARY KEY,
    MaDonHang INT NOT NULL,
    MaNguoiDung INT NOT NULL,
    SoVideoDang INT NOT NULL,
    SoVideoDich INT NOT NULL,
    DaDungVideoDang INT NOT NULL CONSTRAINT DF_QuyenLoiGoi_DungDang DEFAULT (0),
    DaDungVideoDich INT NOT NULL CONSTRAINT DF_QuyenLoiGoi_DungDich DEFAULT (0),
    NguonXacNhan VARCHAR(20) NOT NULL,
    NgayCap DATETIME2(0) NOT NULL CONSTRAINT DF_QuyenLoiGoi_NgayCap DEFAULT SYSUTCDATETIME(),
    CONSTRAINT UQ_QuyenLoiGoi_MaDonHang UNIQUE(MaDonHang),
    CONSTRAINT FK_QuyenLoiGoi_DonHang FOREIGN KEY(MaDonHang) REFERENCES dbo.DonHang(MaDonHang),
    CONSTRAINT FK_QuyenLoiGoi_NguoiDung FOREIGN KEY(MaNguoiDung) REFERENCES dbo.NguoiDung(MaNguoiDung),
    CONSTRAINT CK_QuyenLoiGoi_Uploads CHECK(SoVideoDang>=0 AND DaDungVideoDang>=0 AND DaDungVideoDang<=SoVideoDang),
    CONSTRAINT CK_QuyenLoiGoi_Translations CHECK(SoVideoDich>=0 AND DaDungVideoDich>=0 AND DaDungVideoDich<=SoVideoDich),
    CONSTRAINT CK_QuyenLoiGoi_Source CHECK(NguonXacNhan IN ('demo','payos'))
  );
END;
GO
IF OBJECT_ID(N'dbo.SuDungQuyenLoi', N'U') IS NULL
BEGIN
  CREATE TABLE dbo.SuDungQuyenLoi (
    MaSuDung BIGINT IDENTITY(1,1) NOT NULL CONSTRAINT PK_SuDungQuyenLoi PRIMARY KEY,
    MaQuyenLoi BIGINT NOT NULL,
    MaVideo INT NOT NULL,
    Loai VARCHAR(12) NOT NULL,
    NgonNgu VARCHAR(8) NOT NULL CONSTRAINT DF_SuDungQuyenLoi_NgonNgu DEFAULT (''),
    TrangThai VARCHAR(12) NOT NULL CONSTRAINT DF_SuDungQuyenLoi_TrangThai DEFAULT ('used'),
    NgaySuDung DATETIME2(0) NOT NULL CONSTRAINT DF_SuDungQuyenLoi_NgaySuDung DEFAULT SYSUTCDATETIME(),
    CONSTRAINT FK_SuDungQuyenLoi_Goi FOREIGN KEY(MaQuyenLoi) REFERENCES dbo.QuyenLoiGoi(MaQuyenLoi),
    CONSTRAINT CK_SuDungQuyenLoi_Loai CHECK(Loai IN ('upload','translation')),
    CONSTRAINT CK_SuDungQuyenLoi_TrangThai CHECK(TrangThai IN ('used','refunded')),
    CONSTRAINT CK_SuDungQuyenLoi_NgonNgu CHECK((Loai='upload' AND NgonNgu='') OR (Loai='translation' AND LEN(NgonNgu)>=2))
  );
END;
GO
IF NOT EXISTS(SELECT 1 FROM sys.indexes WHERE object_id=OBJECT_ID('dbo.QuyenLoiGoi') AND name='IX_QuyenLoiGoi_Account')
  CREATE INDEX IX_QuyenLoiGoi_Account ON dbo.QuyenLoiGoi(MaNguoiDung,NgayCap,MaQuyenLoi);
GO
IF NOT EXISTS(SELECT 1 FROM sys.indexes WHERE object_id=OBJECT_ID('dbo.SuDungQuyenLoi') AND name='UX_SuDungQuyenLoi_Active')
  CREATE UNIQUE INDEX UX_SuDungQuyenLoi_Active
    ON dbo.SuDungQuyenLoi(MaVideo,Loai,NgonNgu) WHERE TrangThai='used';
GO
PRINT N'Migration 12 OK. Quyen loi chi phat sinh voi don moi duoc xac nhan. Giao dich cu khong tu dong duoc cap luot.';
GO
-- Khong tru luot 2 lan neu frontend gui lai cung X-Idempotency-Key sau loi mang.
IF COL_LENGTH('dbo.Video','MaYeuCauTaiLen') IS NULL
  ALTER TABLE dbo.Video ADD MaYeuCauTaiLen VARCHAR(36) NULL;
GO
IF NOT EXISTS(SELECT 1 FROM sys.indexes WHERE object_id=OBJECT_ID('dbo.Video') AND name='UX_Video_MaYeuCauTaiLen')
  CREATE UNIQUE INDEX UX_Video_MaYeuCauTaiLen
    ON dbo.Video(MaNguoiDung,MaYeuCauTaiLen) WHERE MaYeuCauTaiLen IS NOT NULL;
GO
