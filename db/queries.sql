-- Một vài câu truy vấn mẫu (mở bằng Azure Data Studio hoặc SSMS, kết nối localhost,1433, user sa)
USE DubchefDB;
GO

-- 1. Các đơn mới nhất kèm mã giao dịch
SELECT TOP (20) o.OrderId, o.CustomerEmail, o.OutVideos, o.Currency, o.AmountMinor, o.Status, p.Method, p.TransactionRef
FROM dbo.Orders o
LEFT JOIN dbo.Payments p ON p.OrderId = o.OrderId AND p.Status = 'success'
ORDER BY o.CreatedAt DESC;

-- 2. Doanh thu theo ngày
SELECT * FROM dbo.vw_DoanhThuNgay ORDER BY Ngay DESC;

-- 3. Người dùng trả nhiều nhất (theo từng loại tiền)
SELECT TOP (10) CustomerEmail, Currency, SUM(AmountMinor) AS Tong
FROM dbo.Orders
WHERE Status = 'paid'
GROUP BY CustomerEmail, Currency
ORDER BY Tong DESC;
GO

-- Số người quét mã QR của khách theo ngày (người không trùng và số lượt quét)
SELECT CAST(ScannedAt AS DATE) AS Ngay,
       COUNT(DISTINCT VisitorId) AS NguoiQuet,
       COUNT(*)                  AS LuotQuet
FROM dbo.QrScans
GROUP BY CAST(ScannedAt AS DATE)
ORDER BY Ngay DESC;

