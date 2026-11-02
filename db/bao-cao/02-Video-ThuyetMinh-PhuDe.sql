-- BÁO CÁO DUBCHEF / CHỈ ĐỌC / TỪ SSMS CHỌN localhost,1433.
-- Mở trực tiếp file này -> Execute (F5); không INSERT/UPDATE/DELETE.
-- Cần chạy db/00-CAI-DAT-KHONG-XOA.sql nếu thiếu bảng.
USE DubchefDB;
GO
SET NOCOUNT ON;

-- Video và chủ sở hữu
IF OBJECT_ID(N'dbo.Video',N'U') IS NOT NULL AND OBJECT_ID(N'dbo.NguoiDung',N'U') IS NOT NULL
  EXEC sys.sp_executesql N'SELECT TOP (50) v.MaVideo,u.Email,v.TieuDe,v.TenTep,v.NgonNguGoc,v.TrangThai,v.NgayTaiLen FROM dbo.Video v JOIN dbo.NguoiDung u ON u.MaNguoiDung=v.MaNguoiDung ORDER BY v.MaVideo DESC';
ELSE
  SELECT N'Chưa đủ bảng cho báo cáo: Video, NguoiDung. Kiểm tra file 00-CAI-DAT-KHONG-XOA.sql' AS ThongBao;


-- Thuyết minh
IF OBJECT_ID(N'dbo.ThuyetMinh',N'U') IS NOT NULL AND OBJECT_ID(N'dbo.Video',N'U') IS NOT NULL
  EXEC sys.sp_executesql N'SELECT TOP (50) t.MaThuyetMinh,t.MaVideo,v.TieuDe,t.NgonNgu,LEFT(t.NoiDung,250) AS NoiDungTomTat,t.NgayTao FROM dbo.ThuyetMinh t JOIN dbo.Video v ON v.MaVideo=t.MaVideo ORDER BY t.MaThuyetMinh DESC';
ELSE
  SELECT N'Chưa đủ bảng cho báo cáo: ThuyetMinh, Video. Kiểm tra file 00-CAI-DAT-KHONG-XOA.sql' AS ThongBao;


-- Phụ đề
IF OBJECT_ID(N'dbo.PhuDe',N'U') IS NOT NULL AND OBJECT_ID(N'dbo.Video',N'U') IS NOT NULL
  EXEC sys.sp_executesql N'SELECT TOP (50) p.MaPhuDe,p.MaVideo,v.TieuDe,p.NgonNgu,LEFT(p.NoiDung,250) AS NoiDungTomTat,p.NgayTao FROM dbo.PhuDe p JOIN dbo.Video v ON v.MaVideo=p.MaVideo ORDER BY p.MaPhuDe DESC';
ELSE
  SELECT N'Chưa đủ bảng cho báo cáo: PhuDe, Video. Kiểm tra file 00-CAI-DAT-KHONG-XOA.sql' AS ThongBao;


-- Mỗi câu phụ đề/thuyết minh ra một dòng SSMS: đọc JSON theo mốc thời gian.
IF OBJECT_ID(N'dbo.ThuyetMinh', N'U') IS NOT NULL
 EXEC sys.sp_executesql N'SELECT TOP(100) t.MaVideo,t.NgonNgu,j.[key] AS ThuTu,TRY_CONVERT(FLOAT,JSON_VALUE(j.value,''$.start'')) AS BatDauGiay,TRY_CONVERT(FLOAT,JSON_VALUE(j.value,''$.end'')) AS KetThucGiay,JSON_VALUE(j.value,''$.text'') AS NoiDung FROM dbo.ThuyetMinh t CROSS APPLY OPENJSON(CASE WHEN ISJSON(t.NoiDung)=1 THEN t.NoiDung ELSE ''[]'' END) j ORDER BY t.MaVideo DESC, t.NgonNgu, TRY_CONVERT(INT,j.[key])';
ELSE SELECT N''Chưa có bảng ThuyetMinh'' AS ThongBao;
IF OBJECT_ID(N'dbo.PhuDe', N'U') IS NOT NULL
 EXEC sys.sp_executesql N'SELECT TOP(100) p.MaVideo,p.NgonNgu,j.[key] AS ThuTu,TRY_CONVERT(FLOAT,JSON_VALUE(j.value,''$.start'')) AS BatDauGiay,TRY_CONVERT(FLOAT,JSON_VALUE(j.value,''$.end'')) AS KetThucGiay,JSON_VALUE(j.value,''$.text'') AS NoiDung FROM dbo.PhuDe p CROSS APPLY OPENJSON(CASE WHEN ISJSON(p.NoiDung)=1 THEN p.NoiDung ELSE ''[]'' END) j ORDER BY p.MaVideo DESC,p.NgonNgu,TRY_CONVERT(INT,j.[key])';
ELSE SELECT N''Chưa có bảng PhuDe'' AS ThongBao;
