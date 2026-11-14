/* Single source of daily revenue: Vietnamese calendar date, verified payOS only.
   Demo and unverified legacy amounts are separate; cross-currency totals forbidden. */
CREATE OR ALTER VIEW dbo.vw_DoanhThuNgay AS
SELECT CAST(DATEADD(HOUR,7,g.NgayThanhToan) AS DATE) AS Ngay,
 g.LoaiTien,
 COUNT_BIG(CASE WHEN g.NguonXacNhan='payos' THEN 1 END) AS SoGiaoDich,
 COALESCE(SUM(CASE WHEN g.NguonXacNhan='payos' THEN CONVERT(BIGINT,g.SoTien) ELSE 0 END),0) AS TongSoTien,
 COUNT_BIG(CASE WHEN g.NguonXacNhan='demo' THEN 1 END) AS SoGiaoDichMoPhong,
 COALESCE(SUM(CASE WHEN g.NguonXacNhan='demo' THEN CONVERT(BIGINT,g.SoTien) ELSE 0 END),0) AS TongTienMoPhong,
 COUNT_BIG(CASE WHEN g.NguonXacNhan='legacy_unknown' THEN 1 END) AS SoGiaoDichChuaXacMinh,
 COALESCE(SUM(CASE WHEN g.NguonXacNhan='legacy_unknown' THEN CONVERT(BIGINT,g.SoTien) ELSE 0 END),0) AS TongTienChuaXacMinh
FROM dbo.GiaoDich g WHERE g.TrangThai='success'
GROUP BY CAST(DATEADD(HOUR,7,g.NgayThanhToan) AS DATE),g.LoaiTien;
GO
CREATE OR ALTER VIEW dbo.vw_KiemTraDoanhThu AS
SELECT Ngay,LoaiTien,SoGiaoDich,TongSoTien,
 SoGiaoDichMoPhong,TongTienMoPhong,SoGiaoDichChuaXacMinh,TongTienChuaXacMinh
FROM dbo.vw_DoanhThuNgay;
GO
