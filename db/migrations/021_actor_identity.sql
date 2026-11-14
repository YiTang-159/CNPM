/* Existing text-based actor emails are retained as immutable presentation snapshots.
   New nullable ID links reference accounts; unknown historic actors stay NULL for review. */
IF COL_LENGTH('dbo.ThuyetMinh','NguoiSuaId') IS NULL ALTER TABLE dbo.ThuyetMinh ADD NguoiSuaId INT NULL;
IF COL_LENGTH('dbo.PhuDe','NguoiSuaId') IS NULL ALTER TABLE dbo.PhuDe ADD NguoiSuaId INT NULL;
IF COL_LENGTH('dbo.LichSuNoiDung','NguoiSuaId') IS NULL ALTER TABLE dbo.LichSuNoiDung ADD NguoiSuaId INT NULL;
IF COL_LENGTH('dbo.PhanHoi','NguoiXuLyId') IS NULL ALTER TABLE dbo.PhanHoi ADD NguoiXuLyId INT NULL;
IF COL_LENGTH('dbo.LienHe','NguoiXuLyId') IS NULL ALTER TABLE dbo.LienHe ADD NguoiXuLyId INT NULL;
IF COL_LENGTH('dbo.LichSuXuLyPhanHoi','NguoiXuLyId') IS NULL ALTER TABLE dbo.LichSuXuLyPhanHoi ADD NguoiXuLyId INT NULL;
IF COL_LENGTH('dbo.NhatKyQuanTri','NguoiThucHienId') IS NULL ALTER TABLE dbo.NhatKyQuanTri ADD NguoiThucHienId INT NULL;
IF COL_LENGTH('dbo.XacMinhChuDonHang','NguoiXacMinhId') IS NULL ALTER TABLE dbo.XacMinhChuDonHang ADD NguoiXacMinhId INT NULL;
GO
UPDATE t SET NguoiSuaId=u.MaNguoiDung FROM dbo.ThuyetMinh t JOIN dbo.NguoiDung u ON t.NguoiSua=u.Email WHERE t.NguoiSuaId IS NULL;
UPDATE t SET NguoiSuaId=u.MaNguoiDung FROM dbo.PhuDe t JOIN dbo.NguoiDung u ON t.NguoiSua=u.Email WHERE t.NguoiSuaId IS NULL;
UPDATE t SET NguoiSuaId=u.MaNguoiDung FROM dbo.LichSuNoiDung t JOIN dbo.NguoiDung u ON t.NguoiSua=u.Email WHERE t.NguoiSuaId IS NULL;
UPDATE t SET NguoiXuLyId=u.MaNguoiDung FROM dbo.PhanHoi t JOIN dbo.NguoiDung u ON t.NguoiXuLy=u.Email WHERE t.NguoiXuLyId IS NULL;
UPDATE t SET NguoiXuLyId=u.MaNguoiDung FROM dbo.LienHe t JOIN dbo.NguoiDung u ON t.NguoiXuLy=u.Email WHERE t.NguoiXuLyId IS NULL;
UPDATE t SET NguoiXuLyId=u.MaNguoiDung FROM dbo.LichSuXuLyPhanHoi t JOIN dbo.NguoiDung u ON t.NguoiXuLy=u.Email WHERE t.NguoiXuLyId IS NULL;
UPDATE t SET NguoiThucHienId=u.MaNguoiDung FROM dbo.NhatKyQuanTri t JOIN dbo.NguoiDung u ON t.NguoiThucHien=u.Email WHERE t.NguoiThucHienId IS NULL;
UPDATE t SET NguoiXacMinhId=u.MaNguoiDung FROM dbo.XacMinhChuDonHang t JOIN dbo.NguoiDung u ON t.NguoiXacMinh=u.Email WHERE t.NguoiXacMinhId IS NULL;
GO
IF NOT EXISTS(SELECT 1 FROM sys.foreign_keys WHERE name='FK_ThuyetMinh_NguoiSua')
 ALTER TABLE dbo.ThuyetMinh WITH CHECK ADD CONSTRAINT FK_ThuyetMinh_NguoiSua FOREIGN KEY(NguoiSuaId) REFERENCES dbo.NguoiDung(MaNguoiDung);
IF NOT EXISTS(SELECT 1 FROM sys.foreign_keys WHERE name='FK_PhuDe_NguoiSua')
 ALTER TABLE dbo.PhuDe WITH CHECK ADD CONSTRAINT FK_PhuDe_NguoiSua FOREIGN KEY(NguoiSuaId) REFERENCES dbo.NguoiDung(MaNguoiDung);
IF NOT EXISTS(SELECT 1 FROM sys.foreign_keys WHERE name='FK_LichSuNoiDung_NguoiSua')
 ALTER TABLE dbo.LichSuNoiDung WITH CHECK ADD CONSTRAINT FK_LichSuNoiDung_NguoiSua FOREIGN KEY(NguoiSuaId) REFERENCES dbo.NguoiDung(MaNguoiDung);
IF NOT EXISTS(SELECT 1 FROM sys.foreign_keys WHERE name='FK_PhanHoi_NguoiXuLy')
 ALTER TABLE dbo.PhanHoi WITH CHECK ADD CONSTRAINT FK_PhanHoi_NguoiXuLy FOREIGN KEY(NguoiXuLyId) REFERENCES dbo.NguoiDung(MaNguoiDung);
IF NOT EXISTS(SELECT 1 FROM sys.foreign_keys WHERE name='FK_LienHe_NguoiXuLy')
 ALTER TABLE dbo.LienHe WITH CHECK ADD CONSTRAINT FK_LienHe_NguoiXuLy FOREIGN KEY(NguoiXuLyId) REFERENCES dbo.NguoiDung(MaNguoiDung);
IF NOT EXISTS(SELECT 1 FROM sys.foreign_keys WHERE name='FK_LichSuXuLyPhanHoi_NguoiXuLy')
 ALTER TABLE dbo.LichSuXuLyPhanHoi WITH CHECK ADD CONSTRAINT FK_LichSuXuLyPhanHoi_NguoiXuLy FOREIGN KEY(NguoiXuLyId) REFERENCES dbo.NguoiDung(MaNguoiDung);
IF NOT EXISTS(SELECT 1 FROM sys.foreign_keys WHERE name='FK_NhatKyQuanTri_NguoiThucHien')
 ALTER TABLE dbo.NhatKyQuanTri WITH CHECK ADD CONSTRAINT FK_NhatKyQuanTri_NguoiThucHien FOREIGN KEY(NguoiThucHienId) REFERENCES dbo.NguoiDung(MaNguoiDung);
IF NOT EXISTS(SELECT 1 FROM sys.foreign_keys WHERE name='FK_XacMinhChuDonHang_NguoiXacMinh')
 ALTER TABLE dbo.XacMinhChuDonHang WITH CHECK ADD CONSTRAINT FK_XacMinhChuDonHang_NguoiXacMinh FOREIGN KEY(NguoiXacMinhId) REFERENCES dbo.NguoiDung(MaNguoiDung);
GO
