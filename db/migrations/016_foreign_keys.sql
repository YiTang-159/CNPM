/* 016: Strict FK / JSON / workflow integrity. Existing bad rows cause THROW,
   never disable constraint checks and never delete orphan rows automatically. */
IF EXISTS(SELECT 1 FROM dbo.ThuyetMinh WHERE ISJSON(NoiDung)<>1)
 THROW 51601,N'Bad JSON in ThuyetMinh; correct data under change control.',1;
IF EXISTS(SELECT 1 FROM dbo.PhuDe WHERE ISJSON(NoiDung)<>1)
 THROW 51602,N'Bad JSON in PhuDe; correct data under change control.',1;
IF EXISTS(SELECT 1 FROM dbo.LichSuNoiDung WHERE ISJSON(NoiDung)<>1)
 THROW 51603,N'Bad JSON in LichSuNoiDung.',1;
GO
IF NOT EXISTS(SELECT 1 FROM sys.check_constraints WHERE name='CK_ThuyetMinh_Json' AND parent_object_id=OBJECT_ID('dbo.ThuyetMinh'))
 ALTER TABLE dbo.ThuyetMinh WITH CHECK ADD CONSTRAINT CK_ThuyetMinh_Json CHECK (ISJSON(NoiDung)=1);
IF NOT EXISTS(SELECT 1 FROM sys.check_constraints WHERE name='CK_PhuDe_Json' AND parent_object_id=OBJECT_ID('dbo.PhuDe'))
 ALTER TABLE dbo.PhuDe WITH CHECK ADD CONSTRAINT CK_PhuDe_Json CHECK (ISJSON(NoiDung)=1);
IF NOT EXISTS(SELECT 1 FROM sys.check_constraints WHERE name='CK_LichSuNoiDung_Json' AND parent_object_id=OBJECT_ID('dbo.LichSuNoiDung'))
 ALTER TABLE dbo.LichSuNoiDung WITH CHECK ADD CONSTRAINT CK_LichSuNoiDung_Json CHECK (ISJSON(NoiDung)=1);
GO
IF NOT EXISTS(SELECT 1 FROM sys.foreign_keys WHERE name='FK_Video_NgonNgu' AND parent_object_id=OBJECT_ID('dbo.Video'))
 ALTER TABLE dbo.Video WITH CHECK ADD CONSTRAINT FK_Video_NgonNgu FOREIGN KEY(NgonNguGoc) REFERENCES dbo.NgonNgu(MaNgonNgu);
IF NOT EXISTS(SELECT 1 FROM sys.foreign_keys WHERE name='FK_ThuyetMinh_NgonNgu' AND parent_object_id=OBJECT_ID('dbo.ThuyetMinh'))
 ALTER TABLE dbo.ThuyetMinh WITH CHECK ADD CONSTRAINT FK_ThuyetMinh_NgonNgu FOREIGN KEY(NgonNgu) REFERENCES dbo.NgonNgu(MaNgonNgu);
IF NOT EXISTS(SELECT 1 FROM sys.foreign_keys WHERE name='FK_PhuDe_NgonNgu' AND parent_object_id=OBJECT_ID('dbo.PhuDe'))
 ALTER TABLE dbo.PhuDe WITH CHECK ADD CONSTRAINT FK_PhuDe_NgonNgu FOREIGN KEY(NgonNgu) REFERENCES dbo.NgonNgu(MaNgonNgu);
IF NOT EXISTS(SELECT 1 FROM sys.foreign_keys WHERE name='FK_LuotTruyCap_NgonNgu' AND parent_object_id=OBJECT_ID('dbo.LuotTruyCap'))
 ALTER TABLE dbo.LuotTruyCap WITH CHECK ADD CONSTRAINT FK_LuotTruyCap_NgonNgu FOREIGN KEY(NgonNgu) REFERENCES dbo.NgonNgu(MaNgonNgu);
IF NOT EXISTS(SELECT 1 FROM sys.foreign_keys WHERE name='FK_LuotQuetQR_NgonNgu' AND parent_object_id=OBJECT_ID('dbo.LuotQuetQR'))
 ALTER TABLE dbo.LuotQuetQR WITH CHECK ADD CONSTRAINT FK_LuotQuetQR_NgonNgu FOREIGN KEY(NgonNgu) REFERENCES dbo.NgonNgu(MaNgonNgu);
IF NOT EXISTS(SELECT 1 FROM sys.foreign_keys WHERE name='FK_LichSuNoiDung_NgonNgu' AND parent_object_id=OBJECT_ID('dbo.LichSuNoiDung'))
 ALTER TABLE dbo.LichSuNoiDung WITH CHECK ADD CONSTRAINT FK_LichSuNoiDung_NgonNgu FOREIGN KEY(NgonNgu) REFERENCES dbo.NgonNgu(MaNgonNgu);
GO
-- Preserve entitlement charges and content history even if source video is deleted.
IF EXISTS(SELECT 1 FROM sys.indexes WHERE object_id=OBJECT_ID('dbo.SuDungQuyenLoi') AND name='UX_SuDungQuyenLoi_Active')
 DROP INDEX UX_SuDungQuyenLoi_Active ON dbo.SuDungQuyenLoi;
IF EXISTS(SELECT 1 FROM sys.indexes WHERE object_id=OBJECT_ID('dbo.LichSuNoiDung') AND name='IX_LichSuNoiDung_KeToan')
 DROP INDEX IX_LichSuNoiDung_KeToan ON dbo.LichSuNoiDung;
IF COL_LENGTH('dbo.SuDungQuyenLoi','MaVideo') IS NOT NULL
 ALTER TABLE dbo.SuDungQuyenLoi ALTER COLUMN MaVideo INT NULL;
IF COL_LENGTH('dbo.LichSuNoiDung','MaVideo') IS NOT NULL
 ALTER TABLE dbo.LichSuNoiDung ALTER COLUMN MaVideo INT NULL;
IF NOT EXISTS(SELECT 1 FROM sys.indexes WHERE object_id=OBJECT_ID('dbo.LichSuNoiDung') AND name='IX_LichSuNoiDung_KeToan')
 CREATE INDEX IX_LichSuNoiDung_KeToan ON dbo.LichSuNoiDung(Loai,MaVideo,NgonNgu,MaLichSu DESC);
IF NOT EXISTS(SELECT 1 FROM sys.foreign_keys WHERE name='FK_SuDungQuyenLoi_Video')
 ALTER TABLE dbo.SuDungQuyenLoi WITH CHECK ADD CONSTRAINT FK_SuDungQuyenLoi_Video
 FOREIGN KEY(MaVideo) REFERENCES dbo.Video(MaVideo) ON DELETE SET NULL;
IF NOT EXISTS(SELECT 1 FROM sys.foreign_keys WHERE name='FK_LichSuNoiDung_Video')
 ALTER TABLE dbo.LichSuNoiDung WITH CHECK ADD CONSTRAINT FK_LichSuNoiDung_Video
 FOREIGN KEY(MaVideo) REFERENCES dbo.Video(MaVideo) ON DELETE SET NULL;
GO
-- Uploads have no target translation language: use SQL NULL instead of fake ''.
IF EXISTS(SELECT 1 FROM sys.check_constraints WHERE name='CK_SuDungQuyenLoi_NgonNgu' AND parent_object_id=OBJECT_ID('dbo.SuDungQuyenLoi'))
 ALTER TABLE dbo.SuDungQuyenLoi DROP CONSTRAINT CK_SuDungQuyenLoi_NgonNgu;
IF EXISTS(SELECT 1 FROM sys.default_constraints WHERE name='DF_SuDungQuyenLoi_NgonNgu' AND parent_object_id=OBJECT_ID('dbo.SuDungQuyenLoi'))
 ALTER TABLE dbo.SuDungQuyenLoi DROP CONSTRAINT DF_SuDungQuyenLoi_NgonNgu;
ALTER TABLE dbo.SuDungQuyenLoi ALTER COLUMN NgonNgu VARCHAR(8) NULL;
UPDATE dbo.SuDungQuyenLoi SET NgonNgu=NULL WHERE Loai='upload' AND NgonNgu='';
IF EXISTS(SELECT 1 FROM dbo.SuDungQuyenLoi WHERE (Loai='upload' AND NgonNgu IS NOT NULL)
   OR (Loai='translation' AND NgonNgu IS NULL))
 THROW 51604,N'Invalid entitlement language for the consumption type.',1;
ALTER TABLE dbo.SuDungQuyenLoi WITH CHECK ADD CONSTRAINT CK_SuDungQuyenLoi_NgonNgu
 CHECK ((Loai='upload' AND NgonNgu IS NULL) OR (Loai='translation' AND NgonNgu IS NOT NULL));
IF NOT EXISTS(SELECT 1 FROM sys.indexes WHERE object_id=OBJECT_ID('dbo.SuDungQuyenLoi') AND name='UX_SuDungQuyenLoi_Active')
 CREATE UNIQUE INDEX UX_SuDungQuyenLoi_Active ON dbo.SuDungQuyenLoi(MaVideo,Loai,NgonNgu) WHERE TrangThai='used' AND MaVideo IS NOT NULL;
IF NOT EXISTS(SELECT 1 FROM sys.foreign_keys WHERE name='FK_SuDungQuyenLoi_NgonNgu')
 ALTER TABLE dbo.SuDungQuyenLoi WITH CHECK ADD CONSTRAINT FK_SuDungQuyenLoi_NgonNgu FOREIGN KEY(NgonNgu) REFERENCES dbo.NgonNgu(MaNgonNgu);
GO
-- Entitlement owner must be the exact owner of the paid order.
IF NOT EXISTS(SELECT 1 FROM sys.indexes WHERE object_id=OBJECT_ID('dbo.DonHang') AND name='UQ_DonHang_NguoiDung')
 ALTER TABLE dbo.DonHang ADD CONSTRAINT UQ_DonHang_NguoiDung UNIQUE(MaDonHang,MaNguoiDung);
IF NOT EXISTS(SELECT 1 FROM sys.foreign_keys WHERE name='FK_QuyenLoiGoi_DonHang_Chu')
 ALTER TABLE dbo.QuyenLoiGoi WITH CHECK ADD CONSTRAINT FK_QuyenLoiGoi_DonHang_Chu
  FOREIGN KEY(MaDonHang,MaNguoiDung) REFERENCES dbo.DonHang(MaDonHang,MaNguoiDung);
GO
IF EXISTS (SELECT 1 FROM dbo.SuDungQuyenLoi s JOIN dbo.QuyenLoiGoi q ON q.MaQuyenLoi=s.MaQuyenLoi
 JOIN dbo.Video v ON v.MaVideo=s.MaVideo WHERE v.MaNguoiDung<>q.MaNguoiDung)
 THROW 51605,N'PRECHECK: entitlement charged to video belonging to another user.',1;
GO
CREATE OR ALTER TRIGGER dbo.TR_SuDungQuyenLoi_ChuVideo ON dbo.SuDungQuyenLoi
 AFTER INSERT,UPDATE AS
BEGIN
 SET NOCOUNT ON;
 IF EXISTS(SELECT 1 FROM inserted i JOIN dbo.QuyenLoiGoi q ON q.MaQuyenLoi=i.MaQuyenLoi
   JOIN dbo.Video v ON v.MaVideo=i.MaVideo WHERE v.MaNguoiDung<>q.MaNguoiDung)
  THROW 51606,N'Video owner differs from entitlement owner.',1;
END;
GO
CREATE OR ALTER TRIGGER dbo.TR_Video_KhongDoiChuDaTinhLuot ON dbo.Video
 AFTER UPDATE AS
BEGIN
 SET NOCOUNT ON;
 IF UPDATE(MaNguoiDung) AND EXISTS(SELECT 1 FROM inserted i JOIN deleted d ON d.MaVideo=i.MaVideo
  JOIN dbo.SuDungQuyenLoi s ON s.MaVideo=i.MaVideo WHERE i.MaNguoiDung<>d.MaNguoiDung)
  THROW 51607,N'Cannot change the owner of a charged video.',1;
END;
GO
-- Contact workflow histories retain original legacy lookup columns, plus actual FKs.
IF COL_LENGTH('dbo.LichSuXuLyPhanHoi','MaPhanHoi') IS NULL
 ALTER TABLE dbo.LichSuXuLyPhanHoi ADD MaPhanHoi INT NULL;
IF COL_LENGTH('dbo.LichSuXuLyPhanHoi','MaLienHe') IS NULL
 ALTER TABLE dbo.LichSuXuLyPhanHoi ADD MaLienHe INT NULL;
UPDATE dbo.LichSuXuLyPhanHoi SET
 MaPhanHoi=CASE WHEN Nguon='user' THEN MaBanGhi ELSE NULL END,
 MaLienHe=CASE WHEN Nguon='contact' THEN MaBanGhi ELSE NULL END
WHERE MaPhanHoi IS NULL AND MaLienHe IS NULL;
IF NOT EXISTS(SELECT 1 FROM sys.foreign_keys WHERE name='FK_LichSuXuLyPhanHoi_PhanHoi')
 ALTER TABLE dbo.LichSuXuLyPhanHoi WITH CHECK ADD CONSTRAINT FK_LichSuXuLyPhanHoi_PhanHoi FOREIGN KEY(MaPhanHoi) REFERENCES dbo.PhanHoi(MaPhanHoi);
IF NOT EXISTS(SELECT 1 FROM sys.foreign_keys WHERE name='FK_LichSuXuLyPhanHoi_LienHe')
 ALTER TABLE dbo.LichSuXuLyPhanHoi WITH CHECK ADD CONSTRAINT FK_LichSuXuLyPhanHoi_LienHe FOREIGN KEY(MaLienHe) REFERENCES dbo.LienHe(MaLienHe);
IF NOT EXISTS(SELECT 1 FROM sys.check_constraints WHERE name='CK_LichSuXuLyPhanHoi_ExactlyOne')
 ALTER TABLE dbo.LichSuXuLyPhanHoi WITH CHECK ADD CONSTRAINT CK_LichSuXuLyPhanHoi_ExactlyOne CHECK
  ((Nguon='user' AND MaPhanHoi=MaBanGhi AND MaLienHe IS NULL) OR
   (Nguon='contact' AND MaLienHe=MaBanGhi AND MaPhanHoi IS NULL));
GO
-- Workflow value checks are strong constraints, not frontend-only validation.
IF NOT EXISTS(SELECT 1 FROM sys.check_constraints WHERE name='CK_ThuyetMinh_Duyet')
 ALTER TABLE dbo.ThuyetMinh WITH CHECK ADD CONSTRAINT CK_ThuyetMinh_Duyet CHECK (TrangThaiDuyet IN ('draft','reviewing','published'));
IF NOT EXISTS(SELECT 1 FROM sys.check_constraints WHERE name='CK_PhuDe_Duyet')
 ALTER TABLE dbo.PhuDe WITH CHECK ADD CONSTRAINT CK_PhuDe_Duyet CHECK (TrangThaiDuyet IN ('draft','reviewing','published'));
IF NOT EXISTS(SELECT 1 FROM sys.check_constraints WHERE name='CK_PhanHoi_UuTien')
 ALTER TABLE dbo.PhanHoi WITH CHECK ADD CONSTRAINT CK_PhanHoi_UuTien CHECK (UuTien IN ('low','normal','high'));
IF NOT EXISTS(SELECT 1 FROM sys.check_constraints WHERE name='CK_LienHe_UuTien')
 ALTER TABLE dbo.LienHe WITH CHECK ADD CONSTRAINT CK_LienHe_UuTien CHECK (UuTien IN ('low','normal','high'));
IF NOT EXISTS(SELECT 1 FROM sys.check_constraints WHERE name='CK_LienHe_TrangThai')
 ALTER TABLE dbo.LienHe WITH CHECK ADD CONSTRAINT CK_LienHe_TrangThai CHECK (TrangThai IN ('new','reviewing','resolved','closed'));
GO
IF COL_LENGTH('dbo.NhatKyQuanTri','GiaTriCu') IS NOT NULL ALTER TABLE dbo.NhatKyQuanTri ALTER COLUMN GiaTriCu NVARCHAR(MAX) NULL;
IF COL_LENGTH('dbo.NhatKyQuanTri','GiaTriMoi') IS NOT NULL ALTER TABLE dbo.NhatKyQuanTri ALTER COLUMN GiaTriMoi NVARCHAR(MAX) NULL;
IF COL_LENGTH('dbo.NguoiDung','NgayCapNhat') IS NULL ALTER TABLE dbo.NguoiDung ADD NgayCapNhat DATETIME2(0) NULL;
IF COL_LENGTH('dbo.NguoiDung','NgayXoa') IS NULL ALTER TABLE dbo.NguoiDung ADD NgayXoa DATETIME2(0) NULL;
IF COL_LENGTH('dbo.QuyenLoiGoi','NgayHetHan') IS NULL ALTER TABLE dbo.QuyenLoiGoi ADD NgayHetHan DATETIME2(0) NULL;
GO
-- Reconcile before installing counter trigger. No silent arithmetic rewrite.
IF EXISTS (
 SELECT 1 FROM dbo.QuyenLoiGoi q OUTER APPLY (
   SELECT SUM(CASE WHEN Loai='upload' AND TrangThai='used' THEN 1 ELSE 0 END) AS Ups,
     SUM(CASE WHEN Loai='translation' AND TrangThai='used' THEN 1 ELSE 0 END) AS Outs
   FROM dbo.SuDungQuyenLoi WHERE MaQuyenLoi=q.MaQuyenLoi
 ) a WHERE q.DaDungVideoDang<>ISNULL(a.Ups,0) OR q.DaDungVideoDich<>ISNULL(a.Outs,0)
) THROW 51608,N'PRECHECK: QuyenLoiGoi counters disagree with usage ledger; reconcile first.',1;
GO
CREATE OR ALTER TRIGGER dbo.TR_SuDungQuyenLoi_BoDem ON dbo.SuDungQuyenLoi
 AFTER INSERT,UPDATE,DELETE AS
BEGIN
 SET NOCOUNT ON;
 ;WITH Delta AS (
   SELECT MaQuyenLoi,
     SUM(CASE WHEN Loai='upload' AND TrangThai='used' THEN D ELSE 0 END) AS Du,
     SUM(CASE WHEN Loai='translation' AND TrangThai='used' THEN D ELSE 0 END) AS Dt
   FROM (
     SELECT MaQuyenLoi,Loai,TrangThai,1 AS D FROM inserted
     UNION ALL
     SELECT MaQuyenLoi,Loai,TrangThai,-1 AS D FROM deleted
   ) x GROUP BY MaQuyenLoi
 )
 UPDATE q SET DaDungVideoDang=q.DaDungVideoDang+d.Du,
  DaDungVideoDich=q.DaDungVideoDich+d.Dt
 FROM dbo.QuyenLoiGoi q JOIN Delta d ON d.MaQuyenLoi=q.MaQuyenLoi;
 -- CK_QuyenLoiGoi_Uploads / Translations rejects over-consumption atomically.
END;
GO
IF NOT EXISTS(SELECT 1 FROM sys.indexes WHERE object_id=OBJECT_ID('dbo.PhanHoi') AND name='IX_PhanHoi_NguoiDung')
 CREATE INDEX IX_PhanHoi_NguoiDung ON dbo.PhanHoi(MaNguoiDung);
IF NOT EXISTS(SELECT 1 FROM sys.indexes WHERE object_id=OBJECT_ID('dbo.PhanHoi') AND name='IX_PhanHoi_MaVideo')
 CREATE INDEX IX_PhanHoi_MaVideo ON dbo.PhanHoi(MaVideo) WHERE MaVideo IS NOT NULL;
IF NOT EXISTS(SELECT 1 FROM sys.indexes WHERE object_id=OBJECT_ID('dbo.PhanHoi') AND name='IX_PhanHoi_TrangThai_NgayTao')
 CREATE INDEX IX_PhanHoi_TrangThai_NgayTao ON dbo.PhanHoi(TrangThai,NgayTao DESC);
IF NOT EXISTS(SELECT 1 FROM sys.indexes WHERE object_id=OBJECT_ID('dbo.LienHe') AND name='IX_LienHe_TrangThai_NgayTao')
 CREATE INDEX IX_LienHe_TrangThai_NgayTao ON dbo.LienHe(TrangThai,NgayTao DESC);
IF NOT EXISTS(SELECT 1 FROM sys.indexes WHERE object_id=OBJECT_ID('dbo.SuDungQuyenLoi') AND name='IX_SuDungQuyenLoi_MaQuyenLoi')
 CREATE INDEX IX_SuDungQuyenLoi_MaQuyenLoi ON dbo.SuDungQuyenLoi(MaQuyenLoi,NgaySuDung DESC);
IF NOT EXISTS(SELECT 1 FROM sys.indexes WHERE object_id=OBJECT_ID('dbo.Video') AND name='IX_Video_TrangThai')
 CREATE INDEX IX_Video_TrangThai ON dbo.Video(TrangThai,NgayTaiLen DESC);
IF NOT EXISTS(SELECT 1 FROM sys.indexes WHERE object_id=OBJECT_ID('dbo.XacMinhChuDonHang') AND name='IX_XacMinhChuDonHang_MaNguoiDung')
 CREATE INDEX IX_XacMinhChuDonHang_MaNguoiDung ON dbo.XacMinhChuDonHang(MaNguoiDung);
GO
-- Even a direct UPDATE to denormalized counters must match the immutable usage ledger.
CREATE OR ALTER TRIGGER dbo.TR_QuyenLoiGoi_DemHopLe ON dbo.QuyenLoiGoi
 AFTER INSERT,UPDATE AS
BEGIN
 SET NOCOUNT ON;
 IF EXISTS(SELECT 1 FROM inserted i OUTER APPLY(
     SELECT SUM(CASE WHEN Loai='upload' AND TrangThai='used' THEN 1 ELSE 0 END) AS Ups,
       SUM(CASE WHEN Loai='translation' AND TrangThai='used' THEN 1 ELSE 0 END) AS Outs
     FROM dbo.SuDungQuyenLoi s WHERE s.MaQuyenLoi=i.MaQuyenLoi
   ) a WHERE i.DaDungVideoDang<>ISNULL(a.Ups,0) OR i.DaDungVideoDich<>ISNULL(a.Outs,0))
   THROW 51609,N'Grant counters must equal active usage records.',1;
END;
GO
