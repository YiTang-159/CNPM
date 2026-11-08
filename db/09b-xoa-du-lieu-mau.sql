/* =====================================================================
   DUBCHEF - XÓA DỮ LIỆU MẪU
   Chỉ xóa dữ liệu mẫu: email @demo.dubchef.local và mã khách bắt đầu bằng 'demo-'.
   Dữ liệu thật không bị ảnh hưởng.
   ===================================================================== */
USE DubchefDB;
GO
SET NOCOUNT ON;
SET XACT_ABORT ON;
BEGIN TRY
BEGIN TRANSACTION;

DELETE g FROM dbo.GiaoDich g JOIN dbo.DonHang d ON d.MaDonHang = g.MaDonHang WHERE d.EmailKhachHang LIKE N'%@demo.dubchef.local';
DELETE FROM dbo.DonHang WHERE EmailKhachHang LIKE N'%@demo.dubchef.local';
DELETE FROM dbo.LienHe WHERE Email LIKE N'%@demo.dubchef.local';
DELETE p FROM dbo.PhanHoi p JOIN dbo.NguoiDung u ON u.MaNguoiDung = p.MaNguoiDung WHERE u.Email LIKE N'%@demo.dubchef.local';
DELETE v FROM dbo.Video v JOIN dbo.NguoiDung u ON u.MaNguoiDung = v.MaNguoiDung WHERE u.Email LIKE N'%@demo.dubchef.local';
DELETE FROM dbo.NguoiDung WHERE Email LIKE N'%@demo.dubchef.local';
DELETE FROM dbo.LuotTruyCap WHERE MaKhach LIKE 'demo-%';
DELETE FROM dbo.LuotQuetQR WHERE MaKhach LIKE 'demo-%';

COMMIT TRANSACTION;
PRINT N'Đã xóa dữ liệu mẫu.';
END TRY
BEGIN CATCH
    IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION;
    PRINT N'Không xóa được (đã hoàn tác). Lỗi: ' + ERROR_MESSAGE();
END CATCH;
