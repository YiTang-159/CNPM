-- Chạy trong SSMS: tự chọn đúng database DubchefDB. Không xóa dữ liệu.
USE DubchefDB;
GO

-- Bổ sung quy trình User -> SQL Server -> Admin. Không xóa/đặt lại bảng hay dữ liệu hiện có.
-- File video vật lý nằm ở Docker volume; các thông tin, phụ đề, nội dung thuyết minh ở SQL Server.
IF OBJECT_ID(N'dbo.Video', N'U') IS NULL
CREATE TABLE dbo.Video (
  MaVideo INT IDENTITY(1,1) NOT NULL CONSTRAINT PK_Video PRIMARY KEY,
  MaNguoiDung INT NOT NULL CONSTRAINT FK_Video_NguoiDung REFERENCES dbo.NguoiDung(MaNguoiDung),
  TieuDe NVARCHAR(200) NOT NULL,
  TenTep NVARCHAR(255) NOT NULL,
  DungLuong BIGINT NOT NULL CONSTRAINT CK_Video_DungLuong CHECK (DungLuong BETWEEN 0 AND 157286400),
  DinhDang VARCHAR(80) NOT NULL,
  DuongDan NVARCHAR(500) NULL,
  NgonNguGoc VARCHAR(8) NOT NULL,
  TrangThai VARCHAR(20) NOT NULL CONSTRAINT DF_Video_TrangThai DEFAULT 'uploaded'
    CONSTRAINT CK_Video_TrangThai CHECK (TrangThai IN ('uploaded','processing','completed','failed','hidden')),
  NgayTaiLen DATETIME2(0) NOT NULL CONSTRAINT DF_Video_Ngay DEFAULT SYSUTCDATETIME()
);
GO
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'IX_Video_User' AND object_id = OBJECT_ID(N'dbo.Video'))
  CREATE INDEX IX_Video_User ON dbo.Video (MaNguoiDung, NgayTaiLen DESC);
GO
IF OBJECT_ID(N'dbo.ThuyetMinh', N'U') IS NULL
CREATE TABLE dbo.ThuyetMinh (
  MaThuyetMinh INT IDENTITY(1,1) NOT NULL CONSTRAINT PK_ThuyetMinh PRIMARY KEY,
  MaVideo INT NOT NULL CONSTRAINT FK_ThuyetMinh_Video REFERENCES dbo.Video(MaVideo) ON DELETE CASCADE,
  NgonNgu VARCHAR(8) NOT NULL,
  NoiDung NVARCHAR(MAX) NOT NULL, -- JSON danh sách câu và mốc thời gian; không phải file tiếng nói
  NgayTao DATETIME2(0) NOT NULL CONSTRAINT DF_ThuyetMinh_Ngay DEFAULT SYSUTCDATETIME(),
  CONSTRAINT UQ_ThuyetMinh_VideoNgonNgu UNIQUE (MaVideo, NgonNgu)
);
GO
IF OBJECT_ID(N'dbo.PhuDe', N'U') IS NULL
CREATE TABLE dbo.PhuDe (
  MaPhuDe INT IDENTITY(1,1) NOT NULL CONSTRAINT PK_PhuDe PRIMARY KEY,
  MaVideo INT NOT NULL CONSTRAINT FK_PhuDe_Video REFERENCES dbo.Video(MaVideo) ON DELETE CASCADE,
  NgonNgu VARCHAR(8) NOT NULL,
  NoiDung NVARCHAR(MAX) NOT NULL, -- JSON có mốc thời gian
  NgayTao DATETIME2(0) NOT NULL CONSTRAINT DF_PhuDe_Ngay DEFAULT SYSUTCDATETIME(),
  CONSTRAINT UQ_PhuDe_VideoNgonNgu UNIQUE (MaVideo, NgonNgu)
);
GO
IF OBJECT_ID(N'dbo.PhanHoi', N'U') IS NULL
CREATE TABLE dbo.PhanHoi (
  MaPhanHoi INT IDENTITY(1,1) NOT NULL CONSTRAINT PK_PhanHoi PRIMARY KEY,
  MaNguoiDung INT NOT NULL CONSTRAINT FK_PhanHoi_NguoiDung REFERENCES dbo.NguoiDung(MaNguoiDung),
  MaVideo INT NULL CONSTRAINT FK_PhanHoi_Video REFERENCES dbo.Video(MaVideo) ON DELETE SET NULL,
  NoiDung NVARCHAR(2000) NOT NULL,
  TrangThai VARCHAR(15) NOT NULL CONSTRAINT DF_PhanHoi_TrangThai DEFAULT 'new'
    CONSTRAINT CK_PhanHoi_TrangThai CHECK (TrangThai IN ('new','reviewing','resolved')),
  TraLoi NVARCHAR(2000) NULL,
  NgayTao DATETIME2(0) NOT NULL CONSTRAINT DF_PhanHoi_Ngay DEFAULT SYSUTCDATETIME()
);
GO
-- Cùng giao diện Admin quản lý cả liên hệ từ khách chưa đăng nhập.
IF COL_LENGTH('dbo.LienHe','TrangThai') IS NULL
  ALTER TABLE dbo.LienHe ADD TrangThai VARCHAR(15) NOT NULL CONSTRAINT DF_LienHe_TrangThai DEFAULT 'new';
GO
IF COL_LENGTH('dbo.LienHe','TraLoi') IS NULL
  ALTER TABLE dbo.LienHe ADD TraLoi NVARCHAR(2000) NULL;
GO

-- Lịch sử đăng nhập thành công, được Backend ghi khi User/Admin đăng nhập.
IF OBJECT_ID(N'dbo.LichSuDangNhap', N'U') IS NULL
CREATE TABLE dbo.LichSuDangNhap (
 MaLichSu BIGINT IDENTITY(1,1) NOT NULL CONSTRAINT PK_LichSuDangNhap PRIMARY KEY,
 MaNguoiDung INT NOT NULL CONSTRAINT FK_LSDN_NguoiDung REFERENCES dbo.NguoiDung(MaNguoiDung) ON DELETE CASCADE,
 ThoiGian DATETIME2(0) NOT NULL CONSTRAINT DF_LSDN_ThoiGian DEFAULT SYSUTCDATETIME(),
 DiaChiIP NVARCHAR(64) NULL
);
GO
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name=N'IX_LSDN_UserTime' AND object_id=OBJECT_ID(N'dbo.LichSuDangNhap'))
 CREATE INDEX IX_LSDN_UserTime ON dbo.LichSuDangNhap(MaNguoiDung, ThoiGian DESC);
GO
