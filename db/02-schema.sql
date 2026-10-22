-- Chạy trên DubchefDB. Chạy lại nhiều lần vẫn an toàn (chỉ tạo khi chưa có).
-- Tiền lưu theo đơn vị nhỏ nhất (đồng, cent, xu) bằng số nguyên để không sai số.

-- Đơn hàng: một lần người dùng chọn số video ở trang Bảng giá
IF OBJECT_ID(N'dbo.Orders', N'U') IS NULL
CREATE TABLE dbo.Orders (
    OrderId       INT IDENTITY(1,1) NOT NULL CONSTRAINT PK_Orders PRIMARY KEY,
    CustomerName  NVARCHAR(100) NOT NULL,
    CustomerEmail NVARCHAR(254) NOT NULL,
    UploadVideos  INT           NOT NULL CONSTRAINT CK_Orders_Up  CHECK (UploadVideos BETWEEN 0 AND 500),
    OutVideos     INT           NOT NULL CONSTRAINT CK_Orders_Out CHECK (OutVideos BETWEEN 0 AND 500),
    Currency      CHAR(3)       NOT NULL CONSTRAINT CK_Orders_Cur CHECK (Currency IN ('VND', 'USD', 'CNY')),
    AmountMinor   BIGINT        NOT NULL CONSTRAINT CK_Orders_Amt CHECK (AmountMinor >= 0),
    Status        VARCHAR(10)   NOT NULL CONSTRAINT DF_Orders_Status DEFAULT 'pending'
                                CONSTRAINT CK_Orders_Status CHECK (Status IN ('pending', 'paid', 'cancelled')),
    CreatedAt     DATETIME2(0)  NOT NULL CONSTRAINT DF_Orders_Created DEFAULT SYSUTCDATETIME()
);
GO

-- Giao dịch thanh toán của một đơn (không lưu số thẻ)
IF OBJECT_ID(N'dbo.Payments', N'U') IS NULL
CREATE TABLE dbo.Payments (
    PaymentId      INT IDENTITY(1,1) NOT NULL CONSTRAINT PK_Payments PRIMARY KEY,
    OrderId        INT           NOT NULL CONSTRAINT FK_Payments_Orders REFERENCES dbo.Orders(OrderId),
    Method         VARCHAR(10)   NOT NULL CONSTRAINT CK_Payments_Method CHECK (Method IN ('card', 'momo', 'bank')),
    AmountMinor    BIGINT        NOT NULL CONSTRAINT CK_Payments_Amt CHECK (AmountMinor >= 0),
    Currency       CHAR(3)       NOT NULL,
    Status         VARCHAR(10)   NOT NULL CONSTRAINT CK_Payments_Status CHECK (Status IN ('success', 'failed')),
    TransactionRef VARCHAR(40)   NOT NULL CONSTRAINT UQ_Payments_Ref UNIQUE,
    PaidAt         DATETIME2(0)  NOT NULL CONSTRAINT DF_Payments_PaidAt DEFAULT SYSUTCDATETIME()
);
GO

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'IX_Orders_Email' AND object_id = OBJECT_ID(N'dbo.Orders'))
    CREATE INDEX IX_Orders_Email ON dbo.Orders (CustomerEmail, CreatedAt DESC);
GO

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'IX_Payments_Order' AND object_id = OBJECT_ID(N'dbo.Payments'))
    CREATE INDEX IX_Payments_Order ON dbo.Payments (OrderId);
GO

-- Doanh thu theo ngày và loại tiền (chỉ tính giao dịch thành công)
CREATE OR ALTER VIEW dbo.vw_DoanhThuNgay AS
SELECT CAST(PaidAt AS DATE) AS Ngay,
       Currency,
       COUNT(*)             AS SoGiaoDich,
       SUM(AmountMinor)     AS TongMinor
FROM dbo.Payments
WHERE Status = 'success'
GROUP BY CAST(PaidAt AS DATE), Currency;
GO
