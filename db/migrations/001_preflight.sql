-- Kiểm tra trước khi bổ sung bảng. Không xóa hay chuyển đổi dữ liệu.
IF OBJECT_ID(N'dbo.Video',N'U') IS NOT NULL AND
 (COL_LENGTH('dbo.Video','TenTep') IS NULL OR COL_LENGTH('dbo.Video','DungLuong') IS NULL OR COL_LENGTH('dbo.Video','DinhDang') IS NULL)
 THROW 51006, N'Video thuộc cấu trúc cũ khác phiên bản. Sao lưu SQL và đối chiếu README-QUAN-LY-SQL.md; không xóa database.', 1;
GO
IF OBJECT_ID(N'dbo.ThuyetMinh',N'U') IS NOT NULL AND COL_LENGTH('dbo.ThuyetMinh','NgonNgu') IS NULL
 THROW 51006, N'ThuyetMinh thuộc cấu trúc MaNgonNgu cũ. Cần chuyển đổi có sao lưu trước khi dùng phiên bản JSON.', 1;
GO
IF OBJECT_ID(N'dbo.PhuDe',N'U') IS NOT NULL AND COL_LENGTH('dbo.PhuDe','NgonNgu') IS NULL
 THROW 51006, N'PhuDe thuộc cấu trúc MaNgonNgu cũ. Cần chuyển đổi có sao lưu trước khi dùng phiên bản JSON.', 1;
GO
