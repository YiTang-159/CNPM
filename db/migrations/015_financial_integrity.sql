/* 015: no deletion/backfill of financial amounts. Any incompatible historical data
   ABORTS the transaction; reconcile in a separate approved migration. */
IF EXISTS (SELECT 1 FROM dbo.DonHang WHERE SoVideoDich > CONVERT(BIGINT,SoVideoDang)*3)
 THROW 51501,N'PRECHECK: DonHang violates 3 translations per upload; reconcile, do not delete.',1;
IF EXISTS (SELECT 1 FROM dbo.GiaoDich g JOIN dbo.DonHang d ON d.MaDonHang=g.MaDonHang
           WHERE g.SoTien<>d.SoTien OR g.LoaiTien<>d.LoaiTien)
 THROW 51502,N'PRECHECK: payment amount/currency differs from order; investigate originals.',1;
IF EXISTS (SELECT MaDonHang FROM dbo.GiaoDich WHERE TrangThai='success'
           GROUP BY MaDonHang HAVING COUNT_BIG(*)>1)
 THROW 51503,N'PRECHECK: multiple successful transactions on one order.',1;
IF EXISTS (SELECT 1 FROM dbo.DonHang d WHERE d.TrangThai='paid'
           AND NOT EXISTS(SELECT 1 FROM dbo.GiaoDich g WHERE g.MaDonHang=d.MaDonHang AND g.TrangThai='success'))
 THROW 51504,N'PRECHECK: paid order without successful transaction. Manual reconciliation needed.',1;
GO
IF NOT EXISTS(SELECT 1 FROM sys.check_constraints WHERE parent_object_id=OBJECT_ID(N'dbo.DonHang') AND name=N'CK_DonHang_DichTheoDang')
 ALTER TABLE dbo.DonHang WITH CHECK ADD CONSTRAINT CK_DonHang_DichTheoDang
   CHECK (SoVideoDich<=CONVERT(BIGINT,SoVideoDang)*3);
GO
-- Existing orders are explicitly marked as legacy. All future INSERTs default to 0.
IF COL_LENGTH('dbo.DonHang','DonCu') IS NULL
BEGIN
 ALTER TABLE dbo.DonHang ADD DonCu BIT NULL;
 UPDATE dbo.DonHang SET DonCu=1 WHERE DonCu IS NULL;
 ALTER TABLE dbo.DonHang ALTER COLUMN DonCu BIT NOT NULL;
END;
IF NOT EXISTS(SELECT 1 FROM sys.default_constraints WHERE parent_object_id=OBJECT_ID('dbo.DonHang') AND parent_column_id=COLUMNPROPERTY(OBJECT_ID('dbo.DonHang'),'DonCu','ColumnId'))
 ALTER TABLE dbo.DonHang ADD CONSTRAINT DF_DonHang_DonCu DEFAULT (0) FOR DonCu;
IF COL_LENGTH('dbo.DonHang','GiamGiaSnapshotPct') IS NULL
 ALTER TABLE dbo.DonHang ADD GiamGiaSnapshotPct INT NULL;
IF COL_LENGTH('dbo.DonHang','ThoiHanSnapshotNgay') IS NULL
 ALTER TABLE dbo.DonHang ADD ThoiHanSnapshotNgay INT NULL;
IF NOT EXISTS(SELECT 1 FROM sys.check_constraints WHERE parent_object_id=OBJECT_ID('dbo.DonHang') AND name='CK_DonHang_ChuVaGiaMoi')
 ALTER TABLE dbo.DonHang WITH CHECK ADD CONSTRAINT CK_DonHang_ChuVaGiaMoi CHECK
  (DonCu=1 OR (MaNguoiDung IS NOT NULL AND DonGiaDangSnapshot IS NOT NULL
             AND DonGiaDichSnapshot IS NOT NULL AND PhienBanGiaSnapshot IS NOT NULL
             AND GiamGiaSnapshotPct IS NOT NULL));
GO
-- Keep `paid` for existing Node.js/API compatibility; permit full payment lifecycle.
IF EXISTS(SELECT 1 FROM sys.check_constraints WHERE parent_object_id=OBJECT_ID(N'dbo.DonHang') AND name=N'CK_DonHang_TrangThai')
 ALTER TABLE dbo.DonHang DROP CONSTRAINT CK_DonHang_TrangThai;
ALTER TABLE dbo.DonHang WITH CHECK ADD CONSTRAINT CK_DonHang_TrangThai
 CHECK (TrangThai IN ('pending','paid','failed','cancelled','expired','refunded'));
GO
-- Order and successful transaction agree on BOTH money and currency, enforced by FK.
IF NOT EXISTS(SELECT 1 FROM sys.indexes WHERE object_id=OBJECT_ID('dbo.DonHang') AND name='UQ_DonHang_ThanhToan')
 ALTER TABLE dbo.DonHang ADD CONSTRAINT UQ_DonHang_ThanhToan UNIQUE(MaDonHang,LoaiTien,SoTien);
IF NOT EXISTS(SELECT 1 FROM sys.foreign_keys WHERE parent_object_id=OBJECT_ID('dbo.GiaoDich') AND name='FK_GiaoDich_DonHang_SoTien')
 ALTER TABLE dbo.GiaoDich WITH CHECK ADD CONSTRAINT FK_GiaoDich_DonHang_SoTien
   FOREIGN KEY(MaDonHang,LoaiTien,SoTien) REFERENCES dbo.DonHang(MaDonHang,LoaiTien,SoTien);
IF NOT EXISTS(SELECT 1 FROM sys.indexes WHERE object_id=OBJECT_ID('dbo.GiaoDich') AND name='UX_GiaoDich_MotThanhCong')
 CREATE UNIQUE INDEX UX_GiaoDich_MotThanhCong ON dbo.GiaoDich(MaDonHang) WHERE TrangThai='success';
GO
IF EXISTS(SELECT 1 FROM sys.check_constraints WHERE parent_object_id=OBJECT_ID('dbo.GiaoDich') AND name='CK_GiaoDich_TrangThai')
 ALTER TABLE dbo.GiaoDich DROP CONSTRAINT CK_GiaoDich_TrangThai;
ALTER TABLE dbo.GiaoDich WITH CHECK ADD CONSTRAINT CK_GiaoDich_TrangThai
 CHECK (TrangThai IN ('pending','success','failed','cancelled','expired','refunded'));
IF EXISTS(SELECT 1 FROM sys.check_constraints WHERE parent_object_id=OBJECT_ID('dbo.GiaoDich') AND name='CK_GiaoDich_PhuongThuc')
 ALTER TABLE dbo.GiaoDich DROP CONSTRAINT CK_GiaoDich_PhuongThuc;
ALTER TABLE dbo.GiaoDich WITH CHECK ADD CONSTRAINT CK_GiaoDich_PhuongThuc
 CHECK (PhuongThuc IN ('card','momo','bank','qr','payos','demo'));
IF NOT EXISTS(SELECT 1 FROM sys.check_constraints WHERE parent_object_id=OBJECT_ID('dbo.GiaoDich') AND name='CK_GiaoDich_LoaiTien')
 ALTER TABLE dbo.GiaoDich WITH CHECK ADD CONSTRAINT CK_GiaoDich_LoaiTien CHECK(LoaiTien IN ('VND','USD','CNY'));
IF COL_LENGTH('dbo.GiaoDich','NhaCungCap') IS NULL ALTER TABLE dbo.GiaoDich ADD NhaCungCap VARCHAR(32) NULL;
IF COL_LENGTH('dbo.GiaoDich','PayOSOrderCode') IS NULL ALTER TABLE dbo.GiaoDich ADD PayOSOrderCode BIGINT NULL;
IF COL_LENGTH('dbo.GiaoDich','PaymentLinkId') IS NULL ALTER TABLE dbo.GiaoDich ADD PaymentLinkId VARCHAR(80) NULL;
IF COL_LENGTH('dbo.GiaoDich','NgayHetHan') IS NULL ALTER TABLE dbo.GiaoDich ADD NgayHetHan DATETIME2(0) NULL;
IF NOT EXISTS(SELECT 1 FROM sys.indexes WHERE object_id=OBJECT_ID('dbo.GiaoDich') AND name='UX_GiaoDich_PayOSOrderCode')
 CREATE UNIQUE INDEX UX_GiaoDich_PayOSOrderCode ON dbo.GiaoDich(PayOSOrderCode) WHERE PayOSOrderCode IS NOT NULL;
GO
IF OBJECT_ID('dbo.WebhookNhan','U') IS NULL
CREATE TABLE dbo.WebhookNhan (
 MaWebhook BIGINT IDENTITY(1,1) NOT NULL CONSTRAINT PK_WebhookNhan PRIMARY KEY,
 EventId VARCHAR(128) NOT NULL CONSTRAINT UQ_WebhookNhan_EventId UNIQUE,
 NhaCungCap VARCHAR(32) NOT NULL,
 MaDonHang INT NULL CONSTRAINT FK_WebhookNhan_DonHang REFERENCES dbo.DonHang(MaDonHang),
 ChuKyHopLe BIT NOT NULL,
 PayloadSha256 CHAR(64) NOT NULL,
 KetQua VARCHAR(24) NOT NULL CONSTRAINT CK_WebhookNhan_KetQua
  CHECK(KetQua IN ('received','processed','duplicate','rejected','failed')),
 NgayNhan DATETIME2(0) NOT NULL CONSTRAINT DF_WebhookNhan_NgayNhan DEFAULT SYSUTCDATETIME(),
 NgayCapNhat DATETIME2(0) NOT NULL CONSTRAINT DF_WebhookNhan_NgayCapNhat DEFAULT SYSUTCDATETIME()
);
GO
IF NOT EXISTS(SELECT 1 FROM sys.indexes WHERE object_id=OBJECT_ID('dbo.DonHang') AND name='IX_DonHang_TrangThai_NgayTao')
 CREATE INDEX IX_DonHang_TrangThai_NgayTao ON dbo.DonHang(TrangThai,NgayTao DESC);
IF NOT EXISTS(SELECT 1 FROM sys.indexes WHERE object_id=OBJECT_ID('dbo.GiaoDich') AND name='IX_GiaoDich_TrangThai_NgayThanhToan')
 CREATE INDEX IX_GiaoDich_TrangThai_NgayThanhToan ON dbo.GiaoDich(TrangThai,NgayThanhToan DESC) INCLUDE (NguonXacNhan,SoTien,LoaiTien);
GO
