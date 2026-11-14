/* Explicit naming, total quantity and configurable upload limit. */
IF EXISTS (SELECT 1 FROM dbo.DonHang WHERE SoVideoDang+SoVideoDich=0)
 THROW 51911,N'PRECHECK: old orders with no item; manual reconciliation needed.',1;
IF NOT EXISTS (SELECT 1 FROM sys.check_constraints WHERE name='CK_DonHang_TongDuong')
 ALTER TABLE dbo.DonHang WITH CHECK ADD CONSTRAINT CK_DonHang_TongDuong CHECK(SoVideoDang+SoVideoDich>0);
GO
IF COL_LENGTH('dbo.BangGia','RowVer') IS NULL ALTER TABLE dbo.BangGia ADD RowVer ROWVERSION;
GO
-- Configured limit enforced at DB boundary, not a hardcoded CHECK constant.
IF NOT EXISTS(SELECT 1 FROM dbo.CauHinhHeThong WHERE Khoa=N'video.maxBytes')
 INSERT dbo.CauHinhHeThong(Khoa,KieuGiaTri,GiaTri) VALUES(N'video.maxBytes','integer',N'157286400');
GO
IF EXISTS(SELECT 1 FROM sys.check_constraints WHERE name='CK_Video_DungLuong' AND parent_object_id=OBJECT_ID('dbo.Video'))
 ALTER TABLE dbo.Video DROP CONSTRAINT CK_Video_DungLuong;
GO
CREATE OR ALTER TRIGGER dbo.TR_Video_DungLuongCauHinh ON dbo.Video AFTER INSERT,UPDATE AS
BEGIN
 SET NOCOUNT ON;
 DECLARE @max BIGINT=(SELECT TRY_CONVERT(BIGINT,GiaTri) FROM dbo.CauHinhHeThong WHERE Khoa=N'video.maxBytes');
 IF @max IS NULL OR @max<1 THROW 51912,N'Invalid video.maxBytes configuration.',1;
 IF EXISTS(SELECT 1 FROM inserted WHERE DungLuong<0 OR DungLuong>@max)
   THROW 51913,N'Uploaded video size exceeds current configured limit.',1;
END;
GO
-- Preserve records; change only system-generated constraint names.
IF EXISTS(SELECT 1 FROM sys.key_constraints k WHERE k.parent_object_id=OBJECT_ID('dbo.LichSuNoiDung')
 AND k.type='PK' AND k.name<>'PK_LichSuNoiDung')
BEGIN
 DECLARE @oldPk SYSNAME=(SELECT name FROM sys.key_constraints WHERE parent_object_id=OBJECT_ID('dbo.LichSuNoiDung') AND type='PK');
 DECLARE @qualified NVARCHAR(300)=N'dbo.'+QUOTENAME(@oldPk);
 EXEC sys.sp_rename @objname=@qualified,@newname=N'PK_LichSuNoiDung',@objtype=N'OBJECT';
END;
IF EXISTS(SELECT 1 FROM sys.key_constraints k WHERE k.parent_object_id=OBJECT_ID('dbo.LichSuXuLyPhanHoi')
 AND k.type='PK' AND k.name<>'PK_LichSuXuLyPhanHoi')
BEGIN
 DECLARE @oldPk2 SYSNAME=(SELECT name FROM sys.key_constraints WHERE parent_object_id=OBJECT_ID('dbo.LichSuXuLyPhanHoi') AND type='PK');
 DECLARE @qualified2 NVARCHAR(300)=N'dbo.'+QUOTENAME(@oldPk2);
 EXEC sys.sp_rename @objname=@qualified2,@newname=N'PK_LichSuXuLyPhanHoi',@objtype=N'OBJECT';
END;
GO
