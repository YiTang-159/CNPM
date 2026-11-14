/* Read-only integrity audit. SQL Server 2022. Never repair data or grant privileges.
   FAIL causes THROW at end so CI actually fails; WARN requires manual triage. */
SET NOCOUNT ON;
DECLARE @Audit TABLE(TestName NVARCHAR(100),IssueCount BIGINT,Severity VARCHAR(8),Details NVARCHAR(300));
INSERT @Audit SELECT N'Tables without primary key',COUNT_BIG(*),'FAIL',N'All user tables need a PK'
FROM sys.tables t WHERE t.is_ms_shipped=0 AND NOT EXISTS(SELECT 1 FROM sys.key_constraints k WHERE k.parent_object_id=t.object_id AND k.type='PK');
INSERT @Audit SELECT N'Disabled/untrusted FK',COUNT_BIG(*),'FAIL',N'FK must have WITH CHECK and be enabled'
FROM sys.foreign_keys WHERE is_disabled=1 OR is_not_trusted=1;
INSERT @Audit SELECT N'Disabled/untrusted CHECK',COUNT_BIG(*),'FAIL',N'CHECK must be trusted'
FROM sys.check_constraints WHERE is_disabled=1 OR is_not_trusted=1;
INSERT @Audit SELECT N'Payment amount/currency differs from order',COUNT_BIG(*),'FAIL',N'Compare immutable order snapshot to each transaction'
FROM dbo.GiaoDich g JOIN dbo.DonHang d ON d.MaDonHang=g.MaDonHang
WHERE g.SoTien<>d.SoTien OR g.LoaiTien<>d.LoaiTien;
INSERT @Audit SELECT N'Paid order without success',COUNT_BIG(*),'FAIL',N'Existing old paid orders may need manual reconciliation'
FROM dbo.DonHang d WHERE TrangThai='paid' AND NOT EXISTS
 (SELECT 1 FROM dbo.GiaoDich g WHERE g.MaDonHang=d.MaDonHang AND g.TrangThai='success');
INSERT @Audit SELECT N'Success transaction with un-paid order',COUNT_BIG(*),'FAIL',N'Payment and order status mismatch'
FROM dbo.GiaoDich g JOIN dbo.DonHang d ON d.MaDonHang=g.MaDonHang
WHERE g.TrangThai='success' AND d.TrangThai<>'paid';
INSERT @Audit SELECT N'More than one successful transaction per order',COUNT_BIG(*),'FAIL',N'Should be blocked by filtered unique index'
FROM (SELECT MaDonHang FROM dbo.GiaoDich WHERE TrangThai='success' GROUP BY MaDonHang HAVING COUNT_BIG(*)>1) z;
INSERT @Audit SELECT N'Entitlements consumed beyond grant',COUNT_BIG(*),'FAIL',N'Quota hard limit violation'
FROM dbo.QuyenLoiGoi WHERE DaDungVideoDang>SoVideoDang OR DaDungVideoDich>SoVideoDich OR DaDungVideoDang<0 OR DaDungVideoDich<0;
INSERT @Audit SELECT N'Entitlement counters differ from usage',COUNT_BIG(*),'FAIL',N'Count active uses; refunded not counted'
FROM dbo.QuyenLoiGoi q OUTER APPLY(
  SELECT SUM(CASE WHEN Loai='upload' AND TrangThai='used' THEN 1 ELSE 0 END) Ups,
         SUM(CASE WHEN Loai='translation' AND TrangThai='used' THEN 1 ELSE 0 END) Outs
  FROM dbo.SuDungQuyenLoi WHERE MaQuyenLoi=q.MaQuyenLoi) a
WHERE q.DaDungVideoDang<>ISNULL(a.Ups,0) OR q.DaDungVideoDich<>ISNULL(a.Outs,0);
INSERT @Audit SELECT N'Foreign-owner quota consumption',COUNT_BIG(*),'FAIL',N'Video and grant must have same MaNguoiDung'
FROM dbo.SuDungQuyenLoi s JOIN dbo.Video v ON v.MaVideo=s.MaVideo
JOIN dbo.QuyenLoiGoi q ON q.MaQuyenLoi=s.MaQuyenLoi WHERE v.MaNguoiDung<>q.MaNguoiDung;
INSERT @Audit SELECT N'Entitlement order owner mismatch',COUNT_BIG(*),'FAIL',N'Grant must match paid order owner'
FROM dbo.QuyenLoiGoi q JOIN dbo.DonHang d ON d.MaDonHang=q.MaDonHang
WHERE d.MaNguoiDung IS NULL OR d.MaNguoiDung<>q.MaNguoiDung;
INSERT @Audit SELECT N'New orders without verified owner or price snapshot',COUNT_BIG(*),'FAIL',N'DonCu=0 must have complete snapshot'
FROM dbo.DonHang WHERE DonCu=0 AND (MaNguoiDung IS NULL OR DonGiaDangSnapshot IS NULL
 OR DonGiaDichSnapshot IS NULL OR PhienBanGiaSnapshot IS NULL OR GiamGiaSnapshotPct IS NULL);
INSERT @Audit SELECT N'Old orders without owner',COUNT_BIG(*),'WARN',N'Legacy orders intentionally retain NULL until verified by evidence'
FROM dbo.DonHang WHERE DonCu=1 AND MaNguoiDung IS NULL;
INSERT @Audit SELECT N'Old orders without price snapshot',COUNT_BIG(*),'WARN',N'Cannot reconstruct historical prices reliably'
FROM dbo.DonHang WHERE DonCu=1 AND (DonGiaDangSnapshot IS NULL OR DonGiaDichSnapshot IS NULL);
INSERT @Audit SELECT N'JSON corruption in content',COUNT_BIG(*),'FAIL',N'No malformed narration, subtitle, or content revision'
FROM (
 SELECT MaThuyetMinh Id FROM dbo.ThuyetMinh WHERE ISJSON(NoiDung)<>1
 UNION ALL SELECT MaPhuDe FROM dbo.PhuDe WHERE ISJSON(NoiDung)<>1
 UNION ALL SELECT MaLichSu FROM dbo.LichSuNoiDung WHERE ISJSON(NoiDung)<>1) z;
INSERT @Audit SELECT N'Unknown languages referenced',COUNT_BIG(*),'FAIL',N'Look for unknown or removed codes'
FROM (
 SELECT NgonNguGoc Lang FROM dbo.Video UNION ALL SELECT NgonNgu FROM dbo.ThuyetMinh
 UNION ALL SELECT NgonNgu FROM dbo.PhuDe UNION ALL SELECT NgonNgu FROM dbo.LuotTruyCap
 UNION ALL SELECT NgonNgu FROM dbo.LuotQuetQR UNION ALL SELECT NgonNgu FROM dbo.LichSuNoiDung
 UNION ALL SELECT NgonNgu FROM dbo.SuDungQuyenLoi WHERE NgonNgu IS NOT NULL
) a LEFT JOIN dbo.NgonNgu n ON n.MaNgonNgu=a.Lang WHERE n.MaNgonNgu IS NULL;
INSERT @Audit SELECT N'Unlinked video usage',COUNT_BIG(*),'FAIL',N'Non-deleted video id without row'
FROM dbo.SuDungQuyenLoi s LEFT JOIN dbo.Video v ON v.MaVideo=s.MaVideo
WHERE s.MaVideo IS NOT NULL AND v.MaVideo IS NULL;
INSERT @Audit SELECT N'History feedback without linked source',COUNT_BIG(*),'FAIL',N'Exactly one PhanHoi or LienHe FK required'
FROM dbo.LichSuXuLyPhanHoi h WHERE
 (h.Nguon='user' AND (h.MaPhanHoi IS NULL OR h.MaPhanHoi<>h.MaBanGhi OR h.MaLienHe IS NOT NULL)) OR
 (h.Nguon='contact' AND (h.MaLienHe IS NULL OR h.MaLienHe<>h.MaBanGhi OR h.MaPhanHoi IS NOT NULL));
INSERT @Audit SELECT N'Unexpected payment status/method',COUNT_BIG(*),'FAIL',N'GiaoDich allowed states and methods'
FROM dbo.GiaoDich WHERE TrangThai NOT IN ('pending','success','failed','cancelled','expired','refunded')
 OR PhuongThuc NOT IN ('card','momo','bank','qr','payos','demo');
INSERT @Audit SELECT N'Unexpected contact priority/state',COUNT_BIG(*),'FAIL',N'Admin workflow reference'
FROM dbo.LienHe WHERE TrangThai NOT IN ('new','reviewing','resolved','closed') OR UuTien NOT IN ('low','normal','high');
INSERT @Audit SELECT N'Unverified/demo counted as real revenue',COUNT_BIG(*),'FAIL',N'Income must come from payOS success only'
FROM dbo.vw_DoanhThuNgay v WHERE v.TongSoTien <> ISNULL((SELECT SUM(CONVERT(BIGINT,g.SoTien))
  FROM dbo.GiaoDich g WHERE g.TrangThai='success' AND g.NguonXacNhan='payos' AND g.LoaiTien=v.LoaiTien
  AND CAST(DATEADD(HOUR,7,g.NgayThanhToan) AS DATE)=v.Ngay),0);
INSERT @Audit SELECT N'Revenue report differs from canonical view',COUNT_BIG(*),'FAIL',N'Queries must read vw_DoanhThuNgay'
FROM (SELECT Ngay,LoaiTien,TongSoTien FROM dbo.vw_DoanhThuNgay
 EXCEPT SELECT Ngay,LoaiTien,TongSoTien FROM dbo.vw_KiemTraDoanhThu) x;
INSERT @Audit SELECT N'Missing expected data tables',COUNT_BIG(*),'FAIL',N'Canonical schema migration incomplete'
FROM (VALUES('SchemaMigrations'),('BangGia'),('GoiDichVu'),('WebhookNhan'),('QuyenLoiGoi'),('SuDungQuyenLoi'),
('CongViecXuLy'),('TepXuat'),('MaDatLaiMatKhau'),('LanDangNhapSai'),('CauHinhHeThong'),('LichSuDoiGia')) n(Name)
WHERE OBJECT_ID(N'dbo.'+n.Name,'U') IS NULL;
;WITH FKColumns AS (
 SELECT fk.name FKName, fkc.parent_object_id ParentId, MIN(fkc.parent_column_id) AS FirstCol
 FROM sys.foreign_keys fk JOIN sys.foreign_key_columns fkc ON fkc.constraint_object_id=fk.object_id
 GROUP BY fk.name,fkc.parent_object_id
)
INSERT @Audit SELECT N'FK without leading-column index',COUNT_BIG(*),'WARN',N'Optimizer may scan child table; inspect composite FKs'
FROM FKColumns f WHERE NOT EXISTS (
 SELECT 1 FROM sys.index_columns ic JOIN sys.indexes ix ON ix.object_id=ic.object_id AND ix.index_id=ic.index_id
 WHERE ic.object_id=f.ParentId AND ic.column_id=f.FirstCol AND ic.key_ordinal=1 AND ix.is_disabled=0);
;WITH IndexKeys AS (
 SELECT ic.object_id,ic.index_id,
 STRING_AGG(CONVERT(VARCHAR(30),ic.column_id),',') WITHIN GROUP (ORDER BY ic.key_ordinal) KeyList
 FROM sys.index_columns ic WHERE ic.key_ordinal>0 GROUP BY ic.object_id,ic.index_id
)
INSERT @Audit SELECT N'Exact duplicate indexes',COUNT_BIG(*),'WARN',N'Duplicate key indexes (may differ on include/filter) require plan review'
FROM IndexKeys a JOIN IndexKeys b ON a.object_id=b.object_id AND a.index_id<b.index_id AND a.KeyList=b.KeyList
JOIN sys.indexes ia ON ia.object_id=a.object_id AND ia.index_id=a.index_id
JOIN sys.indexes ib ON ib.object_id=b.object_id AND ib.index_id=b.index_id
WHERE ISNULL(ia.filter_definition,'')=ISNULL(ib.filter_definition,'');
INSERT @Audit SELECT N'Application DB user missing',CASE WHEN USER_ID('dubchef_app') IS NULL THEN 1 ELSE 0 END,
 'WARN',N'Provision least-privilege user before production deployment';
INSERT @Audit SELECT N'Application has DDL grants or elevated roles',COUNT_BIG(*),'FAIL',N'No db_owner/db_ddladmin/CONTROL/ALTER for application'
FROM sys.database_permissions p WHERE p.grantee_principal_id=USER_ID('dubchef_app')
AND p.state IN ('G','W') AND p.permission_name IN ('ALTER','CONTROL','CREATE TABLE','CREATE VIEW','CREATE PROCEDURE','TAKE OWNERSHIP');
IF USER_ID('dubchef_app') IS NOT NULL AND (IS_ROLEMEMBER('db_owner','dubchef_app')=1 OR IS_ROLEMEMBER('db_ddladmin','dubchef_app')=1)
 INSERT @Audit VALUES(N'Application in privileged DB role',1,'FAIL',N'Immediately revoke elevated role');
SELECT TestName,
 CASE WHEN IssueCount=0 THEN 'PASS' WHEN Severity='WARN' THEN 'WARN' ELSE 'FAIL' END AS Result,
 IssueCount,Details FROM @Audit ORDER BY CASE WHEN IssueCount>0 AND Severity='FAIL' THEN 0 WHEN IssueCount>0 THEN 1 ELSE 2 END,TestName;
IF EXISTS(SELECT 1 FROM @Audit WHERE Severity='FAIL' AND IssueCount>0)
 THROW 51999,N'DUBCHEF INTEGRITY AUDIT FAIL: inspect result table; no data was modified.',1;
PRINT N'DUBCHEF INTEGRITY AUDIT PASS (WARN items may remain for historical data)';
GO
