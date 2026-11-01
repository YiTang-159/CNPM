/* ============================================================================
  DUBCHEF – TRUY VẤN KIỂM TRA USER + ADMIN TRONG SQL SERVER (SSMS)
  Phiên bản: 2026-11-01

  CÁCH DÙNG: SSMS -> kết nối ĐÚNG máy chủ chứa dữ liệu của website ->
  File > Open > File -> mở queries.sql -> Ctrl+A -> Execute / F5 -> Results.

  Mỗi SELECT trả về MỘT BẢNG KẾT QUẢ RIÊNG, như ảnh mẫu SSMS.
  Chỉ đọc dữ liệu: KHÔNG INSERT/UPDATE/DELETE/ALTER/DROP/TRUNCATE.
  Không hiển thị MatKhauBam, mã phiên đăng nhập hoặc thông tin nhạy cảm.
  Bảng mới chưa được tạo -> Results hiện thông báo, KHÔNG tạo dữ liệu mẫu.

  QUAN TRỌNG:
  - File SQL không thể tự sửa lỗi ERR_EMPTY_RESPONSE tại localhost:3000.
  - SSMS ở 127.0.0.1,14330 và Docker mặc định 1433 có thể trỏ tới
    HAI SQL SERVER KHÁC NHAU. Phải kiểm tra đúng server chứa dữ liệu mới.
  ============================================================================ */

USE DubchefDB;
GO
SET NOCOUNT ON;

PRINT N'Đang đọc dữ liệu thật của DubchefDB (không thay đổi dữ liệu).';
PRINT N'Server: ' + CAST(@@SERVERNAME AS NVARCHAR(128)) + N'; Database: ' + DB_NAME();

/* 1. ĐƠN HÀNG MỚI NHẤT + GIAO DỊCH THÀNH CÔNG – ảnh mẫu dòng 1 */
SELECT TOP (20)
       o.MaDonHang, o.EmailKhachHang, o.SoVideoDich,
       o.LoaiTien, o.SoTien, o.TrangThai,
       g.PhuongThuc, g.MaThamChieu
FROM dbo.DonHang AS o
OUTER APPLY (
    SELECT TOP (1) p.PhuongThuc, p.MaThamChieu
    FROM dbo.GiaoDich AS p
    WHERE p.MaDonHang = o.MaDonHang AND p.TrangThai = 'success'
    ORDER BY p.NgayThanhToan DESC, p.MaGiaoDich DESC
) AS g
ORDER BY o.NgayTao DESC, o.MaDonHang DESC;

/* 2. DOANH THU THEO NGÀY – ảnh mẫu dòng 2 */
IF OBJECT_ID(N'dbo.vw_DoanhThuNgay', N'V') IS NOT NULL
    EXEC sys.sp_executesql N'SELECT Ngay, LoaiTien, SoGiaoDich, TongSoTien FROM dbo.vw_DoanhThuNgay ORDER BY Ngay DESC, LoaiTien;';
ELSE
    SELECT CAST(g.NgayThanhToan AS DATE) AS Ngay,
           g.LoaiTien, COUNT(*) AS SoGiaoDich, SUM(g.SoTien) AS TongSoTien
    FROM dbo.GiaoDich AS g
    WHERE g.TrangThai = 'success'
    GROUP BY CAST(g.NgayThanhToan AS DATE), g.LoaiTien
    ORDER BY Ngay DESC, g.LoaiTien;

/* 3. KHÁCH HÀNG CHI TIÊU NHIỀU NHẤT – ảnh mẫu dòng 3 */
SELECT TOP (10) EmailKhachHang, LoaiTien, SUM(SoTien) AS Tong
FROM dbo.DonHang
WHERE TrangThai = 'paid'
GROUP BY EmailKhachHang, LoaiTien
ORDER BY Tong DESC, EmailKhachHang;

/* 4. SỐ NGƯỜI VÀ LƯỢT QUÉT QR THEO NGÀY – ảnh mẫu dòng 4 */
IF OBJECT_ID(N'dbo.LuotQuetQR', N'U') IS NOT NULL
    EXEC sys.sp_executesql N'
      SELECT CAST(DATEADD(HOUR,7,NgayQuet) AS DATE) AS Ngay,
             COUNT(DISTINCT MaKhach) AS NguoiQuet, COUNT(*) AS LuotQuet
      FROM dbo.LuotQuetQR
      GROUP BY CAST(DATEADD(HOUR,7,NgayQuet) AS DATE)
      ORDER BY Ngay DESC;';
ELSE
    SELECT N'Chưa có bảng dbo.LuotQuetQR' AS ThongBao;

/* 5. VIDEO / DỰ ÁN CỦA KHÁCH – hỗ trợ cả dự án SQL cũ và SQL mới.
   Bản mới: SoBanPhuDe là số BẢN phụ đề, KHÔNG phải số đoạn trong JSON. */
IF OBJECT_ID(N'dbo.Video', N'U') IS NOT NULL
BEGIN
    IF OBJECT_ID(N'dbo.PhuDe', N'U') IS NOT NULL AND COL_LENGTH(N'dbo.PhuDe', N'MaVideo') IS NOT NULL
        EXEC sys.sp_executesql N'
          SELECT TOP (20) n.Email, v.MaVideo, v.TieuDe, v.NgonNguGoc,
                 v.TrangThai, COUNT(p.MaPhuDe) AS SoBanPhuDe, v.NgayTaiLen AS NgayTao
          FROM dbo.Video AS v
          JOIN dbo.NguoiDung AS n ON n.MaNguoiDung = v.MaNguoiDung
          LEFT JOIN dbo.PhuDe AS p ON p.MaVideo = v.MaVideo
          GROUP BY n.Email, v.MaVideo, v.TieuDe, v.NgonNguGoc, v.TrangThai, v.NgayTaiLen
          ORDER BY v.NgayTaiLen DESC, v.MaVideo DESC;';
    ELSE
        EXEC sys.sp_executesql N'
          SELECT TOP (20) n.Email, v.MaVideo, v.TieuDe, v.NgonNguGoc,
                 v.TrangThai, v.NgayTaiLen AS NgayTao
          FROM dbo.Video v JOIN dbo.NguoiDung n ON n.MaNguoiDung = v.MaNguoiDung
          ORDER BY v.NgayTaiLen DESC, v.MaVideo DESC;';
END
ELSE IF OBJECT_ID(N'dbo.DuAnVideo', N'U') IS NOT NULL
BEGIN
    IF OBJECT_ID(N'dbo.PhuDe', N'U') IS NOT NULL AND COL_LENGTH(N'dbo.PhuDe', N'MaDuAn') IS NOT NULL
        EXEC sys.sp_executesql N'
          SELECT TOP (20) n.Email, d.MaDuAn, d.TieuDe, d.NgonNguGoc,
                 d.CoDich, COUNT(p.MaPhuDe) AS SoDoan, d.NgayTao
          FROM dbo.DuAnVideo d
          JOIN dbo.NguoiDung n ON n.MaNguoiDung = d.MaNguoiDung
          LEFT JOIN dbo.PhuDe p ON p.MaDuAn = d.MaDuAn
          GROUP BY n.Email, d.MaDuAn, d.TieuDe, d.NgonNguGoc, d.CoDich, d.NgayTao
          ORDER BY d.NgayTao DESC;';
    ELSE
        EXEC sys.sp_executesql N'
          SELECT TOP (20) n.Email, d.MaDuAn, d.TieuDe, d.NgonNguGoc,
                 d.CoDich, d.NgayTao
          FROM dbo.DuAnVideo d
          JOIN dbo.NguoiDung n ON n.MaNguoiDung = d.MaNguoiDung
          ORDER BY d.NgayTao DESC;';
END
ELSE
    SELECT N'Chưa có bảng dbo.Video hoặc dbo.DuAnVideo. Cần kiểm tra migration SQL/API.' AS ThongBao;

/* 6. ĐƠN HÀNG LIÊN KẾT TÀI KHOẢN – ảnh mẫu dòng 6.
   Nếu cột MaNguoiDung chưa có ở DonHang: đối chiếu bằng email;
   KHÔNG tự thêm cột, KHÔNG tự gán sai người dùng. */
IF COL_LENGTH(N'dbo.DonHang', N'MaNguoiDung') IS NOT NULL
    EXEC sys.sp_executesql N'
      SELECT TOP (20) o.MaDonHang, o.EmailKhachHang, o.MaNguoiDung,
             o.SoTien, o.LoaiTien, o.TrangThai
      FROM dbo.DonHang o ORDER BY o.NgayTao DESC, o.MaDonHang DESC;';
ELSE
    SELECT TOP (20) o.MaDonHang, o.EmailKhachHang,
           n.MaNguoiDung, o.SoTien, o.LoaiTien, o.TrangThai
    FROM dbo.DonHang AS o
    LEFT JOIN dbo.NguoiDung AS n ON LOWER(n.Email) = LOWER(o.EmailKhachHang)
    ORDER BY o.NgayTao DESC, o.MaDonHang DESC;

/* 7. BÁO CÁO NGƯỜI DÙNG – ảnh mẫu dòng 7; không đọc mật khẩu. */
DECLARE @userReport NVARCHAR(MAX) = N'
  SELECT n.MaNguoiDung, n.HoTen, n.Email, n.VaiTro, n.TrangThai,
         n.NgayTao AS NgayTaoUTC,
         n.NgayTao AT TIME ZONE ''UTC'' AT TIME ZONE ''SE Asia Standard Time'' AS NgayTaoVietNam,
         (SELECT COUNT(*) FROM dbo.DonHang d
           WHERE LOWER(d.EmailKhachHang) = LOWER(n.Email)) AS TongDon, ';
IF OBJECT_ID(N'dbo.Video', N'U') IS NOT NULL
    SET @userReport += N'(SELECT COUNT(*) FROM dbo.Video v WHERE v.MaNguoiDung = n.MaNguoiDung) AS TongDuAn ';
ELSE IF OBJECT_ID(N'dbo.DuAnVideo', N'U') IS NOT NULL
    SET @userReport += N'(SELECT COUNT(*) FROM dbo.DuAnVideo v WHERE v.MaNguoiDung = n.MaNguoiDung) AS TongDuAn ';
ELSE
    SET @userReport += N'CAST(NULL AS INT) AS TongDuAn ';
SET @userReport += N'
  FROM dbo.NguoiDung n WHERE n.VaiTro = ''user''
  ORDER BY n.NgayTao DESC, n.MaNguoiDung DESC;';
EXEC sys.sp_executesql @userReport;

/* 8. ĐƠN HÀNG + EMAIL HIỂN THỊ + THỜI GIAN VIỆT NAM – ảnh mẫu dòng 8. */
DECLARE @orderReport NVARCHAR(MAX) = N'
 SELECT TOP (100)
        d.MaDonHang, ';
IF COL_LENGTH(N'dbo.DonHang', N'MaNguoiDung') IS NOT NULL
    SET @orderReport += N'd.MaNguoiDung, ';
ELSE
    SET @orderReport += N'n.MaNguoiDung, ';
SET @orderReport += N'
        d.TenKhachHang, COALESCE(n.Email, d.EmailKhachHang) AS EmailHienThi,
        d.SoVideoDang, d.SoVideoDich, d.SoTien, d.LoaiTien, d.TrangThai,
        g.PhuongThuc, g.MaThamChieu,
        d.NgayTao AT TIME ZONE ''UTC'' AT TIME ZONE ''SE Asia Standard Time'' AS NgayDatGioVN,
        g.NgayThanhToan AT TIME ZONE ''UTC'' AT TIME ZONE ''SE Asia Standard Time'' AS GioThanhToanVN
 FROM dbo.DonHang AS d
 LEFT JOIN dbo.NguoiDung AS n ON ';
IF COL_LENGTH(N'dbo.DonHang', N'MaNguoiDung') IS NOT NULL
    SET @orderReport += N'n.MaNguoiDung = d.MaNguoiDung ';
ELSE
    SET @orderReport += N'LOWER(n.Email) = LOWER(d.EmailKhachHang) ';
SET @orderReport += N'
 OUTER APPLY (
   SELECT TOP (1) x.PhuongThuc, x.MaThamChieu, x.NgayThanhToan
   FROM dbo.GiaoDich AS x
   WHERE x.MaDonHang = d.MaDonHang AND x.TrangThai = ''success''
   ORDER BY x.NgayThanhToan DESC, x.MaGiaoDich DESC
 ) AS g
 ORDER BY d.NgayTao DESC, d.MaDonHang DESC;';
EXEC sys.sp_executesql @orderReport;

/* 9. THỐNG KÊ ĐƠN HÀNG THEO TRẠNG THÁI – ảnh mẫu dòng cuối. */
SELECT TrangThai, LoaiTien, COUNT(*) AS SoDon, SUM(SoTien) AS TongTien
FROM dbo.DonHang
GROUP BY TrangThai, LoaiTien
ORDER BY TrangThai, LoaiTien;

/* 10. VIDEO: dữ liệu User -> Admin (bảng mới). */
IF OBJECT_ID(N'dbo.Video', N'U') IS NOT NULL
    EXEC sys.sp_executesql N'
      SELECT TOP (50) v.MaVideo, v.MaNguoiDung, n.HoTen, n.Email,
             v.TieuDe, v.TenTep, v.DungLuong, v.NgonNguGoc, v.TrangThai,
             v.NgayTaiLen AT TIME ZONE ''UTC'' AT TIME ZONE ''SE Asia Standard Time'' AS NgayTaiLenVN
      FROM dbo.Video v JOIN dbo.NguoiDung n ON n.MaNguoiDung = v.MaNguoiDung
      ORDER BY v.NgayTaiLen DESC, v.MaVideo DESC;';
ELSE
    SELECT N'Chưa có bảng dbo.Video (chưa chạy db/04-workflows.sql trên SQL Server này).' AS ThongBao;

/* 11. THUYẾT MINH: dữ liệu lưu trong DB là nội dung văn bản/timeline. */
IF OBJECT_ID(N'dbo.ThuyetMinh', N'U') IS NOT NULL AND COL_LENGTH(N'dbo.ThuyetMinh', N'MaVideo') IS NOT NULL AND OBJECT_ID(N'dbo.Video', N'U') IS NOT NULL
    EXEC sys.sp_executesql N'
      SELECT TOP (50) t.MaThuyetMinh, t.MaVideo, v.TieuDe,
             t.NgonNgu, LEFT(t.NoiDung, 500) AS NoiDungXemTruoc, t.NgayTao
      FROM dbo.ThuyetMinh t JOIN dbo.Video v ON v.MaVideo=t.MaVideo
      ORDER BY t.MaThuyetMinh DESC;';
ELSE IF OBJECT_ID(N'dbo.ThuyetMinh', N'U') IS NOT NULL
    EXEC sys.sp_executesql N'SELECT TOP (50) * FROM dbo.ThuyetMinh;';
ELSE
    SELECT N'Chưa có bảng dbo.ThuyetMinh trên SQL Server này.' AS ThongBao;

/* 12. PHỤ ĐỀ: hỗ trợ cả cấu trúc MaVideo mới và MaDuAn cũ. */
IF OBJECT_ID(N'dbo.PhuDe', N'U') IS NOT NULL AND COL_LENGTH(N'dbo.PhuDe', N'MaVideo') IS NOT NULL AND OBJECT_ID(N'dbo.Video', N'U') IS NOT NULL
    EXEC sys.sp_executesql N'
      SELECT TOP (50) p.MaPhuDe, p.MaVideo, v.TieuDe,
             p.NgonNgu, LEFT(p.NoiDung, 500) AS NoiDungXemTruoc, p.NgayTao
      FROM dbo.PhuDe p JOIN dbo.Video v ON v.MaVideo=p.MaVideo
      ORDER BY p.MaPhuDe DESC;';
ELSE IF OBJECT_ID(N'dbo.PhuDe', N'U') IS NOT NULL AND COL_LENGTH(N'dbo.PhuDe', N'MaDuAn') IS NOT NULL
    EXEC sys.sp_executesql N'
      SELECT TOP (50) * FROM dbo.PhuDe ORDER BY MaPhuDe DESC;';
ELSE IF OBJECT_ID(N'dbo.PhuDe', N'U') IS NOT NULL
    EXEC sys.sp_executesql N'SELECT TOP (50) * FROM dbo.PhuDe;';
ELSE
    SELECT N'Chưa có bảng dbo.PhuDe có cấu trúc phù hợp.' AS ThongBao;

/* 13. PHẢN HỒI: người gửi, nội dung, trạng thái, trả lời Admin. */
IF OBJECT_ID(N'dbo.PhanHoi', N'U') IS NOT NULL AND COL_LENGTH(N'dbo.PhanHoi', N'TraLoi') IS NOT NULL
    EXEC sys.sp_executesql N'
      SELECT TOP (50) p.MaPhanHoi, p.MaNguoiDung, n.Email,
             p.MaVideo, p.NoiDung, p.TrangThai, p.TraLoi,
             p.NgayTao AT TIME ZONE ''UTC'' AT TIME ZONE ''SE Asia Standard Time'' AS NgayGuiVN
      FROM dbo.PhanHoi p JOIN dbo.NguoiDung n ON n.MaNguoiDung=p.MaNguoiDung
      ORDER BY p.MaPhanHoi DESC;';
ELSE IF OBJECT_ID(N'dbo.PhanHoi', N'U') IS NOT NULL
    EXEC sys.sp_executesql N'SELECT TOP (50) * FROM dbo.PhanHoi;';
ELSE
    SELECT N'Chưa có bảng dbo.PhanHoi (chưa chạy db/04-workflows.sql trên SQL Server này).' AS ThongBao;

/* 14. NGÔN NGỮ: các ngôn ngữ hiện đang được quản trị. */
IF OBJECT_ID(N'dbo.NgonNgu', N'U') IS NOT NULL AND COL_LENGTH(N'dbo.NgonNgu', N'TenTiengAnh') IS NOT NULL AND COL_LENGTH(N'dbo.NgonNgu', N'NgayTao') IS NOT NULL
    EXEC sys.sp_executesql N'
      SELECT MaNgonNgu, TenNgonNgu, TenTiengAnh, TrangThai, NgayTao
      FROM dbo.NgonNgu ORDER BY MaNgonNgu;';
ELSE IF OBJECT_ID(N'dbo.NgonNgu', N'U') IS NOT NULL
    EXEC sys.sp_executesql N'SELECT TOP (50) * FROM dbo.NgonNgu;';
ELSE
    SELECT N'Chưa có bảng dbo.NgonNgu trên SQL Server này.' AS ThongBao;

/* 15. LIÊN HỆ: người dùng gửi qua form liên hệ. */
IF OBJECT_ID(N'dbo.LienHe', N'U') IS NOT NULL
BEGIN
    IF COL_LENGTH(N'dbo.LienHe', N'TrangThai') IS NOT NULL AND COL_LENGTH(N'dbo.LienHe', N'TraLoi') IS NOT NULL
        EXEC sys.sp_executesql N'
          SELECT TOP (50) MaLienHe, HoTen, Email, NoiDung, TrangThai, TraLoi, NgayTao
          FROM dbo.LienHe ORDER BY MaLienHe DESC;';
    ELSE
        EXEC sys.sp_executesql N'
          SELECT TOP (50) MaLienHe, HoTen, Email, NoiDung, NgayTao
          FROM dbo.LienHe ORDER BY MaLienHe DESC;';
END
ELSE
    SELECT N'Chưa có bảng dbo.LienHe trên SQL Server này.' AS ThongBao;

PRINT N'Đã hoàn tất 15 nhóm truy vấn chỉ đọc. Các bảng trống nghĩa là chưa có bản ghi ở server này.';
GO
