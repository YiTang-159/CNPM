/* READ-ONLY checks BEFORE running migration against an existing DubchefDB.
   Works on older versions without newer tables. Does not expose row contents. */
SET NOCOUNT ON;
SELECT DB_NAME() AS TargetDatabase, DATABASEPROPERTYEX(DB_NAME(),'Collation') AS Collation,
       SYSUTCDATETIME() AS CheckedUtc;
SELECT s.name AS SchemaName,t.name AS TableName,
       SUM(p.rows) AS ApproxRows
FROM sys.tables t JOIN sys.schemas s ON s.schema_id=t.schema_id
JOIN sys.partitions p ON p.object_id=t.object_id AND p.index_id IN (0,1)
WHERE t.is_ms_shipped=0 GROUP BY s.name,t.name ORDER BY s.name,t.name;
IF OBJECT_ID('dbo.DonHang','U') IS NOT NULL AND OBJECT_ID('dbo.GiaoDich','U') IS NOT NULL
BEGIN
 EXEC sys.sp_executesql N'SELECT N''Payment/order mismatch'' AS CheckName, COUNT_BIG(*) AS IssueCount
    FROM dbo.GiaoDich g JOIN dbo.DonHang d ON d.MaDonHang=g.MaDonHang
    WHERE g.SoTien<>d.SoTien OR g.LoaiTien<>d.LoaiTien;
    SELECT N''Multiple successes per order'' AS CheckName, COUNT_BIG(*) AS IssueCount
    FROM (SELECT MaDonHang FROM dbo.GiaoDich WHERE TrangThai=''success'' GROUP BY MaDonHang HAVING COUNT_BIG(*)>1) x;
    SELECT N''Paid order without success'' AS CheckName, COUNT_BIG(*) AS IssueCount
    FROM dbo.DonHang d WHERE d.TrangThai=''paid'' AND NOT EXISTS
      (SELECT 1 FROM dbo.GiaoDich g WHERE g.MaDonHang=d.MaDonHang AND g.TrangThai=''success'');';
END;
IF OBJECT_ID('dbo.QuyenLoiGoi','U') IS NOT NULL AND OBJECT_ID('dbo.SuDungQuyenLoi','U') IS NOT NULL
BEGIN
 EXEC sys.sp_executesql N'SELECT N''Entitlement counter mismatch'' AS CheckName,COUNT_BIG(*) AS IssueCount
   FROM dbo.QuyenLoiGoi q OUTER APPLY (
    SELECT SUM(CASE WHEN Loai=''upload'' AND TrangThai=''used'' THEN 1 ELSE 0 END) uploads,
           SUM(CASE WHEN Loai=''translation'' AND TrangThai=''used'' THEN 1 ELSE 0 END) translations
    FROM dbo.SuDungQuyenLoi s WHERE s.MaQuyenLoi=q.MaQuyenLoi) a
   WHERE q.DaDungVideoDang<>ISNULL(a.uploads,0) OR q.DaDungVideoDich<>ISNULL(a.translations,0);';
END;
SELECT fk.name AS ForeignKeyName,OBJECT_NAME(fk.parent_object_id) AS ChildTable,
       fk.is_disabled,fk.is_not_trusted
FROM sys.foreign_keys fk WHERE fk.is_disabled=1 OR fk.is_not_trusted=1;
PRINT N'PRE-FLIGHT READ ONLY: review results; this script does not change data.';
