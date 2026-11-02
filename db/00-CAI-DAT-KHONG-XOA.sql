/* BẮT ĐẦU TẠI ĐÂY NẾU CÒN THIẾU BẢNG.
   Chọn SSMS kết nối localhost,1433 bằng sa và Execute/F5.
   Chạy lặp lại được: chỉ tạo các bảng còn thiếu và cập nhật view/procedure.
   KHÔNG xóa dữ liệu, KHÔNG đặt lại mật khẩu hoặc tạo tài khoản mẫu.
   NẾU DB cũ có bảng trùng tên nhưng khác cột thì cần migration riêng;
   KHÔNG tự động sửa cấu trúc đã tồn tại để tránh mất dữ liệu.
   Không chạy thủ tục SQL auth cũ của 05, bởi Node.js đang dùng scrypt.
*/

-- ========= FILE NGUỒN: 01-create-database.sql =========
-- Chạy trên database master: tạo CSDL DubchefDB nếu chưa có.
IF DB_ID(N'DubchefDB') IS NULL
    CREATE DATABASE DubchefDB;
GO

GO

-- ========= FILE NGUỒN: 02-schema.sql =========
-- Chạy trong SSMS: tự chọn đúng database DubchefDB. Không xóa dữ liệu.
USE DubchefDB;
GO

-- Chạy trên DubchefDB. Chạy lại nhiều lần vẫn an toàn (chỉ tạo khi chưa có).
-- Tên bảng và tên cột đều bằng tiếng Việt không dấu. Giá trị trạng thái ('pending', 'paid', 'admin', 'card'...) giữ nguyên
-- vì web và API đang dùng đúng các giá trị đó.
-- Tiền lưu theo đơn vị nhỏ nhất (đồng, cent, xu) bằng số nguyên để không sai số.

-- Đơn hàng: một lần người dùng chọn số video ở trang Bảng giá
IF OBJECT_ID(N'dbo.DonHang', N'U') IS NULL
CREATE TABLE dbo.DonHang (
    MaDonHang      INT IDENTITY(1,1) NOT NULL CONSTRAINT PK_DonHang PRIMARY KEY,
    TenKhachHang   NVARCHAR(100) NOT NULL,
    EmailKhachHang NVARCHAR(254) NOT NULL,
    SoVideoDang    INT           NOT NULL CONSTRAINT CK_DonHang_Dang CHECK (SoVideoDang BETWEEN 0 AND 500),
    SoVideoDich    INT           NOT NULL CONSTRAINT CK_DonHang_Dich CHECK (SoVideoDich BETWEEN 0 AND 500),
    LoaiTien       CHAR(3)       NOT NULL CONSTRAINT CK_DonHang_LoaiTien CHECK (LoaiTien IN ('VND', 'USD', 'CNY')),
    SoTien         BIGINT        NOT NULL CONSTRAINT CK_DonHang_SoTien CHECK (SoTien >= 0),
    TrangThai      VARCHAR(10)   NOT NULL CONSTRAINT DF_DonHang_TrangThai DEFAULT 'pending'
                                 CONSTRAINT CK_DonHang_TrangThai CHECK (TrangThai IN ('pending', 'paid', 'cancelled')),
    NgayTao        DATETIME2(0)  NOT NULL CONSTRAINT DF_DonHang_NgayTao DEFAULT SYSUTCDATETIME()
);
GO

-- Giao dịch thanh toán của một đơn (không lưu số thẻ)
IF OBJECT_ID(N'dbo.GiaoDich', N'U') IS NULL
CREATE TABLE dbo.GiaoDich (
    MaGiaoDich    INT IDENTITY(1,1) NOT NULL CONSTRAINT PK_GiaoDich PRIMARY KEY,
    MaDonHang     INT           NOT NULL CONSTRAINT FK_GiaoDich_DonHang REFERENCES dbo.DonHang(MaDonHang),
    PhuongThuc    VARCHAR(10)   NOT NULL CONSTRAINT CK_GiaoDich_PhuongThuc CHECK (PhuongThuc IN ('card', 'momo', 'bank', 'qr')),
    SoTien        BIGINT        NOT NULL CONSTRAINT CK_GiaoDich_SoTien CHECK (SoTien >= 0),
    LoaiTien      CHAR(3)       NOT NULL,
    TrangThai     VARCHAR(10)   NOT NULL CONSTRAINT CK_GiaoDich_TrangThai CHECK (TrangThai IN ('success', 'failed')),
    MaThamChieu   VARCHAR(40)   NOT NULL CONSTRAINT UQ_GiaoDich_MaThamChieu UNIQUE,
    NgayThanhToan DATETIME2(0)  NOT NULL CONSTRAINT DF_GiaoDich_NgayThanhToan DEFAULT SYSUTCDATETIME()
);
GO

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'IX_DonHang_Email' AND object_id = OBJECT_ID(N'dbo.DonHang'))
    CREATE INDEX IX_DonHang_Email ON dbo.DonHang (EmailKhachHang, NgayTao DESC);
GO

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'IX_GiaoDich_DonHang' AND object_id = OBJECT_ID(N'dbo.GiaoDich'))
    CREATE INDEX IX_GiaoDich_DonHang ON dbo.GiaoDich (MaDonHang);
GO

-- Doanh thu theo ngày và loại tiền (chỉ tính giao dịch thành công)
CREATE OR ALTER VIEW dbo.vw_DoanhThuNgay AS
SELECT CAST(NgayThanhToan AS DATE) AS Ngay,
       LoaiTien,
       COUNT(*)      AS SoGiaoDich,
       SUM(SoTien)   AS TongSoTien
FROM dbo.GiaoDich
WHERE TrangThai = 'success'
GROUP BY CAST(NgayThanhToan AS DATE), LoaiTien;
GO

-- Tài khoản người dùng. Mật khẩu lưu dạng băm (scrypt), không lưu mật khẩu gốc.
IF OBJECT_ID(N'dbo.NguoiDung', N'U') IS NULL
CREATE TABLE dbo.NguoiDung (
    MaNguoiDung INT IDENTITY(1,1) NOT NULL CONSTRAINT PK_NguoiDung PRIMARY KEY,
    HoTen       NVARCHAR(100) NOT NULL,
    Email       NVARCHAR(254) NOT NULL CONSTRAINT UQ_NguoiDung_Email UNIQUE,
    MatKhauBam  VARCHAR(200)  NOT NULL,
    VaiTro      VARCHAR(10)   NOT NULL CONSTRAINT DF_NguoiDung_VaiTro DEFAULT 'user'
                              CONSTRAINT CK_NguoiDung_VaiTro CHECK (VaiTro IN ('user', 'admin')),
    TrangThai   VARCHAR(10)   NOT NULL CONSTRAINT DF_NguoiDung_TrangThai DEFAULT 'active'
                              CONSTRAINT CK_NguoiDung_TrangThai CHECK (TrangThai IN ('active', 'locked')),
    NgayTao     DATETIME2(0)  NOT NULL CONSTRAINT DF_NguoiDung_NgayTao DEFAULT SYSUTCDATETIME()
);
GO

-- Mỗi lượt mở một trang là một dòng (trang admin không ghi)
IF OBJECT_ID(N'dbo.LuotTruyCap', N'U') IS NULL
CREATE TABLE dbo.LuotTruyCap (
    MaLuot       BIGINT IDENTITY(1,1) NOT NULL CONSTRAINT PK_LuotTruyCap PRIMARY KEY,
    MaKhach      VARCHAR(64)   NOT NULL,
    DuongDan     NVARCHAR(200) NOT NULL,
    NgonNgu      VARCHAR(8)    NOT NULL,
    NgayTruyCap  DATETIME2(0)  NOT NULL CONSTRAINT DF_LuotTruyCap_Ngay DEFAULT SYSUTCDATETIME()
);
GO

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'IX_LuotTruyCap_Ngay' AND object_id = OBJECT_ID(N'dbo.LuotTruyCap'))
    CREATE INDEX IX_LuotTruyCap_Ngay ON dbo.LuotTruyCap (NgayTruyCap) INCLUDE (MaKhach);
GO

-- Tin nhắn từ trang Liên hệ
IF OBJECT_ID(N'dbo.LienHe', N'U') IS NULL
CREATE TABLE dbo.LienHe (
    MaLienHe  INT IDENTITY(1,1) NOT NULL CONSTRAINT PK_LienHe PRIMARY KEY,
    HoTen     NVARCHAR(100)  NOT NULL,
    Email     NVARCHAR(254)  NOT NULL,
    NoiDung   NVARCHAR(2000) NOT NULL,
    NgayTao   DATETIME2(0)   NOT NULL CONSTRAINT DF_LienHe_NgayTao DEFAULT SYSUTCDATETIME()
);
GO

-- Mỗi lần khách quét mã QR "trải nghiệm với tư cách khách" là một dòng (MaKhach trùng với bảng LuotTruyCap)
IF OBJECT_ID(N'dbo.LuotQuetQR', N'U') IS NULL
CREATE TABLE dbo.LuotQuetQR (
    MaLuotQuet BIGINT IDENTITY(1,1) NOT NULL CONSTRAINT PK_LuotQuetQR PRIMARY KEY,
    MaKhach    VARCHAR(64)  NOT NULL,
    NgonNgu    VARCHAR(8)   NOT NULL,
    NgayQuet   DATETIME2(0) NOT NULL CONSTRAINT DF_LuotQuetQR_Ngay DEFAULT SYSUTCDATETIME()
);
GO

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'IX_LuotQuetQR_Ngay' AND object_id = OBJECT_ID(N'dbo.LuotQuetQR'))
    CREATE INDEX IX_LuotQuetQR_Ngay ON dbo.LuotQuetQR (NgayQuet) INCLUDE (MaKhach);
GO

IF OBJECT_ID(N'dbo.NgonNgu', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.NgonNgu (
        MaNgonNgu VARCHAR(8) NOT NULL
            CONSTRAINT PK_NgonNgu PRIMARY KEY,

        TenNgonNgu NVARCHAR(80) NOT NULL,

        TenTiengAnh NVARCHAR(80) NOT NULL,

        TrangThai VARCHAR(10) NOT NULL
            CONSTRAINT DF_NgonNgu_TrangThai
            DEFAULT 'active'
            CONSTRAINT CK_NgonNgu_TrangThai
            CHECK (TrangThai IN ('active', 'inactive')),

        NgayTao DATETIME2(0) NOT NULL
            CONSTRAINT DF_NgonNgu_NgayTao
            DEFAULT SYSUTCDATETIME()
    );

    INSERT INTO dbo.NgonNgu
        (MaNgonNgu, TenNgonNgu, TenTiengAnh, TrangThai)
    VALUES
        ('vi', N'Tiếng Việt', N'Vietnamese', 'active'),
        ('en', N'Tiếng Anh', N'English', 'active'),
        ('zh', N'Tiếng Trung', N'Chinese', 'active');
END;
GO

GO

-- ========= FILE NGUỒN: 04-workflows.sql =========
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

GO

-- ========= FILE NGUỒN: 03-admin.sql =========
-- Dubchef - SQL cho khu Quản trị (3 trang: Tổng quan, Người dùng, Mã QR khách)
-- Chạy trên DubchefDB, SAU KHI đã chạy 01-create-database.sql và 02-schema.sql.
-- Chạy lại nhiều lần vẫn an toàn (CREATE OR ALTER).
-- Ngày tính theo múi giờ lệch @TzHours so với UTC (Việt Nam = 7), giống STATS_TZ_HOURS của API.
USE DubchefDB;
GO

/* =====================================================================
   TRANG 1 + TRANG 3: Tổng quan truy cập (UC10) và Người quét mã QR (UC13)
   Hai trang cùng một cách tính, chỉ khác bảng nguồn:
     @Nguon = 'visits' -> dbo.LuotTruyCap   (trang Tổng quan)
     @Nguon = 'qr'     -> dbo.LuotQuetQR  (trang Mã QR khách)
   visitors = số MaKhach không trùng, views = số dòng (lượt xem / lượt quét)
   Trả về 3 kết quả: (1) các ô số liệu, (2) chuỗi theo ngày cho biểu đồ, (3) ngày cao nhất.
   ===================================================================== */
CREATE OR ALTER PROCEDURE dbo.usp_Admin_ThongKe
    @Nguon   VARCHAR(10) = 'visits',
    @Days    INT = 7,          -- chỉ nhận 7, 14, 30
    @TzHours INT = 7
AS
BEGIN
    SET NOCOUNT ON;
    IF @Days NOT IN (7, 14, 30) SET @Days = 7;
    IF @Nguon NOT IN ('visits', 'qr') SET @Nguon = 'visits';

    DECLARE @Now   DATETIME2(0) = SYSUTCDATETIME();
    DECLARE @Today DATE = CAST(DATEADD(HOUR, @TzHours, @Now) AS DATE);
    DECLARE @C0 DATE = DATEADD(DAY, -(@Days - 1),     @Today);  -- đầu kỳ này
    DECLARE @P0 DATE = DATEADD(DAY, -(@Days * 2 - 1), @Today);  -- đầu kỳ trước
    DECLARE @P1 DATE = DATEADD(DAY, -@Days,           @Today);  -- cuối kỳ trước
    DECLARE @From DATETIME2(0) = DATEADD(DAY, -(@Days * 2 + 1), @Now);
    DECLARE @TongNguoi INT, @TongLuot INT, @DangHoatDong INT;

    CREATE TABLE #v (MaKhach VARCHAR(64) NOT NULL, d DATE NOT NULL);

    IF @Nguon = 'visits'
    BEGIN
        INSERT #v SELECT MaKhach, CAST(DATEADD(HOUR, @TzHours, NgayTruyCap) AS DATE)
                  FROM dbo.LuotTruyCap WHERE NgayTruyCap >= @From;
        SELECT @TongNguoi = COUNT(DISTINCT MaKhach), @TongLuot = COUNT(*) FROM dbo.LuotTruyCap;
        SELECT @DangHoatDong = COUNT(DISTINCT MaKhach) FROM dbo.LuotTruyCap
         WHERE NgayTruyCap >= DATEADD(MINUTE, -5, @Now);
    END
    ELSE
    BEGIN
        INSERT #v SELECT MaKhach, CAST(DATEADD(HOUR, @TzHours, NgayQuet) AS DATE)
                  FROM dbo.LuotQuetQR WHERE NgayQuet >= @From;
        SELECT @TongNguoi = COUNT(DISTINCT MaKhach), @TongLuot = COUNT(*) FROM dbo.LuotQuetQR;
        SELECT @DangHoatDong = COUNT(DISTINCT MaKhach) FROM dbo.LuotQuetQR
         WHERE NgayQuet >= DATEADD(MINUTE, -5, @Now);
    END

    -- (1) Các ô số liệu: đang hoạt động, hôm nay / hôm qua, kỳ này / kỳ trước, tổng cộng
    SELECT
        @DangHoatDong AS DangHoatDong,                                   -- trong 5 phút gần nhất
        COUNT(DISTINCT CASE WHEN d = @Today THEN MaKhach END)                 AS HomNay_Nguoi,
        ISNULL(SUM(CASE WHEN d = @Today THEN 1 END), 0)                         AS HomNay_Luot,
        COUNT(DISTINCT CASE WHEN d = DATEADD(DAY, -1, @Today) THEN MaKhach END) AS HomQua_Nguoi,
        ISNULL(SUM(CASE WHEN d = DATEADD(DAY, -1, @Today) THEN 1 END), 0)       AS HomQua_Luot,
        COUNT(DISTINCT CASE WHEN d BETWEEN @C0 AND @Today THEN MaKhach END)   AS KyNay_Nguoi,
        ISNULL(SUM(CASE WHEN d BETWEEN @C0 AND @Today THEN 1 END), 0)           AS KyNay_Luot,
        COUNT(DISTINCT CASE WHEN d BETWEEN @P0 AND @P1 THEN MaKhach END)      AS KyTruoc_Nguoi,
        ISNULL(SUM(CASE WHEN d BETWEEN @P0 AND @P1 THEN 1 END), 0)              AS KyTruoc_Luot,
        @TongNguoi AS TongCong_Nguoi,
        @TongLuot  AS TongCong_Luot
    FROM #v;

    -- (2) Biểu đồ theo ngày (ngày không có dữ liệu = 0)
    CREATE TABLE #s (Ngay DATE NOT NULL, NguoiTruyCap INT NOT NULL, LuotXem INT NOT NULL);
    ;WITH n AS (
        SELECT 0 AS i
        UNION ALL SELECT i + 1 FROM n WHERE i < @Days - 1
    )
    INSERT #s
    SELECT DATEADD(DAY, -n.i, @Today), COUNT(DISTINCT v.MaKhach), COUNT(v.MaKhach)
    FROM n
    LEFT JOIN #v v ON v.d = DATEADD(DAY, -n.i, @Today)
    GROUP BY n.i;

    SELECT Ngay, NguoiTruyCap, LuotXem FROM #s ORDER BY Ngay;

    -- (3) Ngày cao nhất (nhiều người nhất; hòa thì lấy ngày gần đây hơn)
    SELECT TOP (1) Ngay, NguoiTruyCap FROM #s ORDER BY NguoiTruyCap DESC, Ngay DESC;

    DROP TABLE #s;
    DROP TABLE #v;
END;
GO

/* =====================================================================
   TRANG 2: Quản lý người dùng (UC11) - chỉ người dùng vai trò 'user'
   ===================================================================== */

-- Ba ô trên cùng: Tổng người dùng / Hoạt động / Đã khóa
CREATE OR ALTER PROCEDURE dbo.usp_Admin_NguoiDung_ThongKe
AS
BEGIN
    SET NOCOUNT ON;
    SELECT COUNT(*)                                          AS TongNguoiDung,
           ISNULL(SUM(CASE WHEN TrangThai = 'active' THEN 1 END), 0) AS HoatDong,
           ISNULL(SUM(CASE WHEN TrangThai = 'locked' THEN 1 END), 0) AS DaKhoa
    FROM dbo.NguoiDung
    WHERE VaiTro = 'user';
END;
GO

-- Bảng danh sách: tìm theo tên/email, sắp xếp, phân trang 8 người/trang
--   @Sort: 'newest' (Mới nhất, mặc định) | 'oldest' | 'name'
-- Kết quả 1: tổng số dòng sau khi lọc (để chia trang). Kết quả 2: các dòng của trang.
CREATE OR ALTER PROCEDURE dbo.usp_Admin_NguoiDung_DanhSach
    @Search   NVARCHAR(100) = NULL,
    @Sort     VARCHAR(10)   = 'newest',
    @Page     INT           = 1,
    @PageSize INT           = 8
AS
BEGIN
    SET NOCOUNT ON;
    IF @Page < 1 SET @Page = 1;
    IF @PageSize < 1 SET @PageSize = 8;
    DECLARE @Kw NVARCHAR(102) = N'%' + ISNULL(LTRIM(RTRIM(@Search)), N'') + N'%';

    SELECT COUNT(*) AS TongSauLoc
    FROM dbo.NguoiDung
    WHERE VaiTro = 'user' AND (HoTen LIKE @Kw OR Email LIKE @Kw);

    SELECT MaNguoiDung, HoTen, Email, TrangThai, NgayTao
    FROM dbo.NguoiDung
    WHERE VaiTro = 'user' AND (HoTen LIKE @Kw OR Email LIKE @Kw)
    ORDER BY CASE WHEN @Sort = 'name'   THEN HoTen      END ASC,
             CASE WHEN @Sort = 'oldest' THEN NgayTao END ASC,
             CASE WHEN @Sort NOT IN ('name', 'oldest') THEN NgayTao END DESC,
             MaNguoiDung DESC
    OFFSET (@Page - 1) * @PageSize ROWS FETCH NEXT @PageSize ROWS ONLY;
END;
GO

-- Khóa / mở khóa (@TrangThai = 'locked' | 'active'). Không đụng tới quản trị viên.
CREATE OR ALTER PROCEDURE dbo.usp_Admin_NguoiDung_DoiTrangThai
    @Email  NVARCHAR(254),
    @TrangThai VARCHAR(10)
AS
BEGIN
    SET NOCOUNT ON;
    IF @TrangThai NOT IN ('active', 'locked')
    BEGIN
        RAISERROR(N'Trạng thái chỉ nhận active hoặc locked.', 16, 1);
        RETURN;
    END
    UPDATE dbo.NguoiDung SET TrangThai = @TrangThai WHERE Email = @Email AND VaiTro = 'user';
    SELECT @@ROWCOUNT AS SoDongDoi;   -- 0 nghĩa là không tìm thấy (API trả 404)
END;
GO

-- Xóa tài khoản (UI đã hỏi xác nhận trước khi gọi). Không xóa được quản trị viên.
CREATE OR ALTER PROCEDURE dbo.usp_Admin_NguoiDung_Xoa
    @Email NVARCHAR(254)
AS
BEGIN
    SET NOCOUNT ON;
    DELETE FROM dbo.NguoiDung WHERE Email = @Email AND VaiTro = 'user';
    SELECT @@ROWCOUNT AS SoDongXoa;
END;
GO

-- Nút "Xuất CSV": toàn bộ danh sách (không phân trang), có thể lọc giống danh sách
CREATE OR ALTER PROCEDURE dbo.usp_Admin_NguoiDung_XuatCsv
    @Search NVARCHAR(100) = NULL
AS
BEGIN
    SET NOCOUNT ON;
    DECLARE @Kw NVARCHAR(102) = N'%' + ISNULL(LTRIM(RTRIM(@Search)), N'') + N'%';
    SELECT HoTen, Email, TrangThai, NgayTao
    FROM dbo.NguoiDung
    WHERE VaiTro = 'user' AND (HoTen LIKE @Kw OR Email LIKE @Kw)
    ORDER BY NgayTao DESC, MaNguoiDung DESC;
END;
GO

GO

-- ========= FILE NGUỒN: 07-quan-tri-nghiep-vu.sql =========
/* DUBCHEF - MIGRATION 07 / QUẢN TRỊ NỘI DUNG VÀ CHĂM SÓC KHÁCH HÀNG
   CHẠY SAU 02-schema.sql + 04-workflows.sql, trên database DubchefDB.
   Có thể chạy lại; chỉ bổ sung cột/bảng còn thiếu. Không xóa hay thay đổi dữ liệu cũ.
   Sao lưu dữ liệu trước khi chạy trên hệ thống đang hoạt động.
*/
USE DubchefDB;
GO
-- Nội dung đầu ra: bản nháp -> đang duyệt -> đã xuất bản. Phiên bản bảo vệ ghi đè đồng thời.
IF COL_LENGTH('dbo.ThuyetMinh','TrangThaiDuyet') IS NULL
  ALTER TABLE dbo.ThuyetMinh ADD TrangThaiDuyet VARCHAR(12) NOT NULL CONSTRAINT DF_TM_Duyet DEFAULT 'draft';
IF COL_LENGTH('dbo.ThuyetMinh','PhienBan') IS NULL
  ALTER TABLE dbo.ThuyetMinh ADD PhienBan INT NOT NULL CONSTRAINT DF_TM_PhienBan DEFAULT 1;
IF COL_LENGTH('dbo.ThuyetMinh','NguoiSua') IS NULL
  ALTER TABLE dbo.ThuyetMinh ADD NguoiSua NVARCHAR(254) NULL;
IF COL_LENGTH('dbo.ThuyetMinh','NgayCapNhat') IS NULL
  ALTER TABLE dbo.ThuyetMinh ADD NgayCapNhat DATETIME2(0) NOT NULL CONSTRAINT DF_TM_NgayCapNhat DEFAULT SYSUTCDATETIME();
GO
IF COL_LENGTH('dbo.PhuDe','TrangThaiDuyet') IS NULL
  ALTER TABLE dbo.PhuDe ADD TrangThaiDuyet VARCHAR(12) NOT NULL CONSTRAINT DF_PD_Duyet DEFAULT 'draft';
IF COL_LENGTH('dbo.PhuDe','PhienBan') IS NULL
  ALTER TABLE dbo.PhuDe ADD PhienBan INT NOT NULL CONSTRAINT DF_PD_PhienBan DEFAULT 1;
IF COL_LENGTH('dbo.PhuDe','NguoiSua') IS NULL
  ALTER TABLE dbo.PhuDe ADD NguoiSua NVARCHAR(254) NULL;
IF COL_LENGTH('dbo.PhuDe','NgayCapNhat') IS NULL
  ALTER TABLE dbo.PhuDe ADD NgayCapNhat DATETIME2(0) NOT NULL CONSTRAINT DF_PD_NgayCapNhat DEFAULT SYSUTCDATETIME();
GO
IF OBJECT_ID(N'dbo.LichSuNoiDung', N'U') IS NULL
BEGIN
  CREATE TABLE dbo.LichSuNoiDung (
    MaLichSu BIGINT IDENTITY(1,1) PRIMARY KEY,
    Loai VARCHAR(12) NOT NULL CHECK(Loai IN ('narrations','subtitles')),
    MaVideo INT NOT NULL,
    NgonNgu VARCHAR(8) NOT NULL,
    PhienBan INT NOT NULL,
    TrangThai VARCHAR(12) NOT NULL,
    NoiDung NVARCHAR(MAX) NOT NULL,
    NguoiSua NVARCHAR(254) NOT NULL,
    ThoiGian DATETIME2(0) NOT NULL DEFAULT SYSUTCDATETIME()
  );
END;
GO
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE object_id=OBJECT_ID('dbo.LichSuNoiDung') AND name='IX_LichSuNoiDung_KeToan')
  CREATE INDEX IX_LichSuNoiDung_KeToan ON dbo.LichSuNoiDung(Loai, MaVideo, NgonNgu, MaLichSu DESC);
GO
-- Hàng đợi phản hồi: ưu tiên, người xử lý, thời điểm cập nhật.
IF COL_LENGTH('dbo.PhanHoi','UuTien') IS NULL
  ALTER TABLE dbo.PhanHoi ADD UuTien VARCHAR(8) NOT NULL CONSTRAINT DF_PH_UuTien DEFAULT 'normal';
IF COL_LENGTH('dbo.PhanHoi','NguoiXuLy') IS NULL
  ALTER TABLE dbo.PhanHoi ADD NguoiXuLy NVARCHAR(254) NULL;
IF COL_LENGTH('dbo.PhanHoi','NgayCapNhat') IS NULL
  ALTER TABLE dbo.PhanHoi ADD NgayCapNhat DATETIME2(0) NOT NULL CONSTRAINT DF_PH_NgayCN DEFAULT SYSUTCDATETIME();
IF COL_LENGTH('dbo.PhanHoi','NgayGiaiQuyet') IS NULL
  ALTER TABLE dbo.PhanHoi ADD NgayGiaiQuyet DATETIME2(0) NULL;
GO
IF COL_LENGTH('dbo.LienHe','UuTien') IS NULL
  ALTER TABLE dbo.LienHe ADD UuTien VARCHAR(8) NOT NULL CONSTRAINT DF_LH_UuTien DEFAULT 'normal';
IF COL_LENGTH('dbo.LienHe','NguoiXuLy') IS NULL
  ALTER TABLE dbo.LienHe ADD NguoiXuLy NVARCHAR(254) NULL;
IF COL_LENGTH('dbo.LienHe','NgayCapNhat') IS NULL
  ALTER TABLE dbo.LienHe ADD NgayCapNhat DATETIME2(0) NOT NULL CONSTRAINT DF_LH_NgayCN DEFAULT SYSUTCDATETIME();
IF COL_LENGTH('dbo.LienHe','NgayGiaiQuyet') IS NULL
  ALTER TABLE dbo.LienHe ADD NgayGiaiQuyet DATETIME2(0) NULL;
GO
IF OBJECT_ID(N'dbo.LichSuXuLyPhanHoi', N'U') IS NULL
BEGIN
  CREATE TABLE dbo.LichSuXuLyPhanHoi (
    MaLichSu BIGINT IDENTITY(1,1) PRIMARY KEY,
    Nguon VARCHAR(8) NOT NULL CHECK(Nguon IN ('user','contact')),
    MaBanGhi INT NOT NULL,
    TrangThai VARCHAR(15) NOT NULL,
    UuTien VARCHAR(8) NOT NULL,
    TraLoi NVARCHAR(2000) NULL,
    NguoiXuLy NVARCHAR(254) NOT NULL,
    ThoiGian DATETIME2(0) NOT NULL DEFAULT SYSUTCDATETIME()
  );
END;
GO
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE object_id=OBJECT_ID('dbo.LichSuXuLyPhanHoi') AND name='IX_LichSuPhanHoi_BanGhi')
  CREATE INDEX IX_LichSuPhanHoi_BanGhi ON dbo.LichSuXuLyPhanHoi(Nguon, MaBanGhi, MaLichSu DESC);
GO
-- View chỉ đọc: dữ liệu thật, tách quản lý theo nguồn rõ ràng.
CREATE OR ALTER VIEW dbo.vw_QuanTriNoiDung AS
SELECT 'narrations' AS Loai, t.MaThuyetMinh AS MaBanGhi, t.MaVideo, v.TieuDe,
  n.Email AS EmailKhachHang, t.NgonNgu, t.TrangThaiDuyet, t.PhienBan,
  t.NguoiSua, t.NgayCapNhat, t.NgayTao
FROM dbo.ThuyetMinh t JOIN dbo.Video v ON v.MaVideo=t.MaVideo
JOIN dbo.NguoiDung n ON n.MaNguoiDung=v.MaNguoiDung
UNION ALL
SELECT 'subtitles', p.MaPhuDe, p.MaVideo, v.TieuDe,
  n.Email, p.NgonNgu, p.TrangThaiDuyet, p.PhienBan,
  p.NguoiSua, p.NgayCapNhat, p.NgayTao
FROM dbo.PhuDe p JOIN dbo.Video v ON v.MaVideo=p.MaVideo
JOIN dbo.NguoiDung n ON n.MaNguoiDung=v.MaNguoiDung;
GO
CREATE OR ALTER VIEW dbo.vw_QuanTriPhanHoi AS
SELECT CAST('f-' + CAST(p.MaPhanHoi AS VARCHAR(20)) AS VARCHAR(25)) AS MaYeuCau,
  CAST('user' AS VARCHAR(8)) AS Nguon, n.HoTen, n.Email, p.NoiDung,
  p.TrangThai, p.UuTien, p.TraLoi, p.NguoiXuLy, p.NgayTao, p.NgayCapNhat, p.NgayGiaiQuyet
FROM dbo.PhanHoi p JOIN dbo.NguoiDung n ON n.MaNguoiDung=p.MaNguoiDung
UNION ALL
SELECT 'c-' + CAST(c.MaLienHe AS VARCHAR(20)), 'contact', c.HoTen,c.Email,c.NoiDung,
  c.TrangThai,c.UuTien,c.TraLoi,c.NguoiXuLy,c.NgayTao,c.NgayCapNhat,c.NgayGiaiQuyet
FROM dbo.LienHe c;
GO
PRINT N'Đã kiểm tra migration 07: quản trị nội dung và phản hồi, không xóa bản ghi.';
GO
