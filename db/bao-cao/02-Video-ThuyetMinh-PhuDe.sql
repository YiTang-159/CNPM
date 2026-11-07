/*
 DUBCHEF - BO BAO CAO QUAN TRI V3 / SQL SERVER 2022 / DubchefDB
 CHI DOC: KHONG INSERT, UPDATE, DELETE, MERGE, CREATE, ALTER, DROP.
 Khong can doi .env, docker-compose.yml, API hoac ket noi SSMS.
 Thoi gian du lieu luu UTC; hien thi Viet Nam bang DATEADD(HOUR,7,...).
 Giao dich 'success' la thanh toan duoc DB ghi nhan; neu website dang mo phong thanh toan,
 KHONG hieu rang tien da duoc doi soat voi ngan hang.
*/
USE [DubchefDB];
GO
SET NOCOUNT ON;

-- 03 / VIDEO, THUYET MINH, PHU DE: chay duoc voi cot MaNgonNgu hoac NgonNgu (2 phien ban schema).
IF OBJECT_ID(N'dbo.Video',N'U') IS NULL OR OBJECT_ID(N'dbo.ThuyetMinh',N'U') IS NULL OR OBJECT_ID(N'dbo.PhuDe',N'U') IS NULL
BEGIN SELECT N'Thieu bang Video/ThuyetMinh/PhuDe' AS ThongBao; RETURN; END;
-- Video moi nhat: ID nguoi dung thay email; bao ve thong tin khach hang.
SELECT TOP(200) v.MaVideo,v.MaNguoiDung,v.TieuDe,v.NgonNguGoc,v.TrangThai,
 DATEADD(HOUR,7,v.NgayTaiLen) NgayTaiLenVN
FROM dbo.Video v ORDER BY v.MaVideo DESC;

-- Thuyet minh: 1 ban ghi / video-ngon ngu, chi hien tom tat 140 ky tu.
DECLARE @langTM NVARCHAR(50)=CASE WHEN COL_LENGTH('dbo.ThuyetMinh','MaNgonNgu') IS NOT NULL THEN N't.MaNgonNgu'
                                   WHEN COL_LENGTH('dbo.ThuyetMinh','NgonNgu') IS NOT NULL THEN N't.NgonNgu' ELSE N'CAST(NULL AS VARCHAR(8))' END;
DECLARE @duyetTM NVARCHAR(50)=CASE WHEN COL_LENGTH('dbo.ThuyetMinh','TrangThaiDuyet') IS NOT NULL THEN N't.TrangThaiDuyet' ELSE N'CAST(NULL AS VARCHAR(12))' END;
DECLARE @SqlTM NVARCHAR(MAX) = N'SELECT TOP(200) t.MaThuyetMinh,t.MaVideo,v.TieuDe,'+@langTM+N' NgonNgu,'+@duyetTM+N' TrangThaiDuyet,
 LEFT(CONVERT(NVARCHAR(MAX),t.NoiDung),140) NoiDungTomTat,DATEADD(HOUR,7,t.NgayTao) NgayTaoVN
FROM dbo.ThuyetMinh t LEFT JOIN dbo.Video v ON v.MaVideo=t.MaVideo ORDER BY t.MaThuyetMinh DESC';
EXEC sys.sp_executesql @SqlTM;

-- Phu de: neu co ThuTu/BatDau/KetThuc thi hien theo tung doan; neu khong thi 1 ban ghi JSON/1 dong.
DECLARE @langPD NVARCHAR(50)=CASE WHEN COL_LENGTH('dbo.PhuDe','MaNgonNgu') IS NOT NULL THEN N'p.MaNgonNgu'
                                   WHEN COL_LENGTH('dbo.PhuDe','NgonNgu') IS NOT NULL THEN N'p.NgonNgu' ELSE N'CAST(NULL AS VARCHAR(8))' END;
DECLARE @thuTu NVARCHAR(70)=CASE WHEN COL_LENGTH('dbo.PhuDe','ThuTu') IS NOT NULL THEN N'p.ThuTu' ELSE N'CAST(NULL AS INT)' END;
DECLARE @batDau NVARCHAR(70)=CASE WHEN COL_LENGTH('dbo.PhuDe','BatDau') IS NOT NULL THEN N'p.BatDau' ELSE N'CAST(NULL AS DECIMAL(12,3))' END;
DECLARE @ketThuc NVARCHAR(70)=CASE WHEN COL_LENGTH('dbo.PhuDe','KetThuc') IS NOT NULL THEN N'p.KetThuc' ELSE N'CAST(NULL AS DECIMAL(12,3))' END;
DECLARE @SqlPD NVARCHAR(MAX) = N'SELECT TOP(200) p.MaPhuDe,p.MaVideo,'+@langPD+N' NgonNgu,'+@thuTu+N' ThuTu,'+@batDau+N' BatDau,'+@ketThuc+N' KetThuc,
 LEFT(CONVERT(NVARCHAR(MAX),p.NoiDung),140) NoiDungTomTat,DATEADD(HOUR,7,p.NgayTao) NgayTaoVN
FROM dbo.PhuDe p ORDER BY p.MaPhuDe DESC';
EXEC sys.sp_executesql @SqlPD;

-- Neu he thong dung JSON mang cau cho phu de/thuyet minh, hien noi dung theo thoi gian.
IF COL_LENGTH('dbo.PhuDe','ThuTu') IS NULL
 EXEC sys.sp_executesql N'SELECT TOP(100) p.MaVideo,j.[key] ThuTu,
 TRY_CONVERT(FLOAT,JSON_VALUE(j.value,''$.start'')) BatDauGiay,
 TRY_CONVERT(FLOAT,JSON_VALUE(j.value,''$.end'')) KetThucGiay,
 JSON_VALUE(j.value,''$.text'') NoiDung
 FROM dbo.PhuDe p CROSS APPLY OPENJSON(CASE WHEN ISJSON(p.NoiDung)=1 THEN p.NoiDung ELSE N''[]'' END) j
 ORDER BY p.MaVideo DESC,TRY_CONVERT(INT,j.[key])';
-- Chi co thong tin thoi gian neu JSON thuc te co truong start/end/text.
EXEC sys.sp_executesql N'SELECT TOP(100) t.MaVideo,j.[key] ThuTu,
 TRY_CONVERT(FLOAT,JSON_VALUE(j.value,''$.start'')) BatDauGiay,
 TRY_CONVERT(FLOAT,JSON_VALUE(j.value,''$.end'')) KetThucGiay,
 JSON_VALUE(j.value,''$.text'') NoiDung
 FROM dbo.ThuyetMinh t CROSS APPLY OPENJSON(CASE WHEN ISJSON(t.NoiDung)=1 THEN t.NoiDung ELSE N''[]'' END) j
 WHERE JSON_VALUE(j.value,''$.text'') IS NOT NULL
 ORDER BY t.MaVideo DESC,TRY_CONVERT(INT,j.[key])';
