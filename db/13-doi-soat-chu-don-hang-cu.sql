-- DUBCHEF migration 13: audit of manual association of legacy orders.
-- Does NOT backfill ownership or mark payments as bank-verified.
-- Can be run repeatedly. Run after migration 10.
USE DubchefDB;
GO
IF OBJECT_ID(N'dbo.XacMinhChuDonHang', N'U') IS NULL
BEGIN
  CREATE TABLE dbo.XacMinhChuDonHang (
    MaXacMinh BIGINT IDENTITY(1,1) NOT NULL CONSTRAINT PK_XacMinhChuDonHang PRIMARY KEY,
    MaDonHang INT NOT NULL CONSTRAINT UQ_XacMinhChuDonHang_Don UNIQUE,
    MaNguoiDung INT NOT NULL,
    LoaiBangChung VARCHAR(30) NOT NULL,
    MaBangChung NVARCHAR(120) NOT NULL,
    LyDo NVARCHAR(500) NOT NULL,
    NguoiXacMinh NVARCHAR(254) NOT NULL,
    ThoiGian DATETIME2(0) NOT NULL CONSTRAINT DF_XacMinhChuDonHang_ThoiGian DEFAULT SYSUTCDATETIME(),
    CONSTRAINT FK_XacMinhChuDonHang_Don FOREIGN KEY (MaDonHang) REFERENCES dbo.DonHang(MaDonHang),
    CONSTRAINT FK_XacMinhChuDonHang_User FOREIGN KEY (MaNguoiDung) REFERENCES dbo.NguoiDung(MaNguoiDung),
    CONSTRAINT CK_XacMinhChuDonHang_BangChung CHECK (LoaiBangChung IN ('payment_reference','signed_receipt','support_ticket')),
    CONSTRAINT CK_XacMinhChuDonHang_MaBangChung CHECK (LEN(LTRIM(RTRIM(MaBangChung))) >= 4),
    CONSTRAINT CK_XacMinhChuDonHang_LyDo CHECK (LEN(LTRIM(RTRIM(LyDo))) >= 15)
  );
END;
GO
IF NOT EXISTS (
  SELECT 1 FROM sys.indexes WHERE object_id = OBJECT_ID(N'dbo.XacMinhChuDonHang') AND name = N'IX_XacMinhChuDonHang_Ngay'
)
  CREATE INDEX IX_XacMinhChuDonHang_Ngay ON dbo.XacMinhChuDonHang(ThoiGian DESC);
GO
PRINT N'Migration 13 hoàn tất. Không tự động liên kết đơn cũ và không cấp quyền lợi.';
GO
