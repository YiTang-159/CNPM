/* READ-ONLY SQL Server 2022 catalog of tables, every column, defaults, keys and FKs.
   Run against the database chosen in the SSMS database dropdown; export grid to CSV.
   Never substitutes for runtime verification of the data integrity audit. */
SET NOCOUNT ON;
SELECT DB_NAME() AS DatabaseName, DATABASEPROPERTYEX(DB_NAME(),'Collation') AS Collation,
       SYSUTCDATETIME() AS InspectedUtc;
SELECT SCHEMA_NAME(t.schema_id) AS SchemaName,t.name AS TableName,
       c.column_id AS ColumnOrdinal,c.name AS ColumnName,ty.name AS SqlType,
       c.max_length,c.precision,c.scale,c.is_nullable,c.is_identity,
       CASE WHEN c.system_type_id=189 THEN 1 ELSE 0 END AS IsRowVersion,
       dc.name AS DefaultConstraint,dc.definition AS DefaultDefinition
FROM sys.tables t JOIN sys.columns c ON c.object_id=t.object_id
JOIN sys.types ty ON c.user_type_id=ty.user_type_id
LEFT JOIN sys.default_constraints dc ON dc.object_id=c.default_object_id
WHERE t.is_ms_shipped=0 ORDER BY SchemaName,TableName,ColumnOrdinal;
SELECT OBJECT_SCHEMA_NAME(k.parent_object_id) AS SchemaName,
       OBJECT_NAME(k.parent_object_id) AS TableName,k.name AS KeyName,k.type_desc,
       STRING_AGG(QUOTENAME(c.name),N',') WITHIN GROUP (ORDER BY ic.key_ordinal) AS Columns
FROM sys.key_constraints k JOIN sys.index_columns ic ON ic.object_id=k.parent_object_id AND ic.index_id=k.unique_index_id AND ic.key_ordinal>0
JOIN sys.columns c ON c.object_id=ic.object_id AND c.column_id=ic.column_id
GROUP BY k.parent_object_id,k.name,k.type_desc ORDER BY SchemaName,TableName;
SELECT fk.name AS ForeignKeyName,OBJECT_SCHEMA_NAME(fk.parent_object_id) AS ChildSchema,
       OBJECT_NAME(fk.parent_object_id) AS ChildTable, cc.name AS ChildColumn,
       OBJECT_SCHEMA_NAME(fk.referenced_object_id) AS ParentSchema,
       OBJECT_NAME(fk.referenced_object_id) AS ParentTable,pc.name AS ParentColumn,
       fk.delete_referential_action_desc AS OnDelete,fk.update_referential_action_desc AS OnUpdate,
       fk.is_disabled,fk.is_not_trusted
FROM sys.foreign_keys fk JOIN sys.foreign_key_columns fkc ON fkc.constraint_object_id=fk.object_id
JOIN sys.columns cc ON cc.object_id=fkc.parent_object_id AND cc.column_id=fkc.parent_column_id
JOIN sys.columns pc ON pc.object_id=fkc.referenced_object_id AND pc.column_id=fkc.referenced_column_id
ORDER BY ChildSchema,ChildTable,ForeignKeyName,fkc.constraint_column_id;
SELECT OBJECT_SCHEMA_NAME(cc.parent_object_id) AS SchemaName,
       OBJECT_NAME(cc.parent_object_id) AS TableName,cc.name AS CheckName,
       cc.definition,cc.is_disabled,cc.is_not_trusted
FROM sys.check_constraints cc ORDER BY SchemaName,TableName,CheckName;
SELECT OBJECT_SCHEMA_NAME(i.object_id) AS SchemaName,
       OBJECT_NAME(i.object_id) AS TableName,i.name AS IndexName,i.type_desc,i.is_unique,
       i.filter_definition,STRING_AGG(CASE WHEN ic.key_ordinal>0 THEN QUOTENAME(c.name) END,N',')
           WITHIN GROUP (ORDER BY ic.key_ordinal) AS KeyColumns
FROM sys.indexes i LEFT JOIN sys.index_columns ic ON ic.object_id=i.object_id AND ic.index_id=i.index_id
LEFT JOIN sys.columns c ON c.object_id=ic.object_id AND c.column_id=ic.column_id
WHERE i.object_id IN (SELECT object_id FROM sys.tables WHERE is_ms_shipped=0) AND i.index_id>0
GROUP BY i.object_id,i.index_id,i.name,i.type_desc,i.is_unique,i.filter_definition
ORDER BY SchemaName,TableName,IndexName;
SELECT Version,FileName,ChecksumSha256,AppliedAt,AppliedBy
FROM dbo.SchemaMigrations ORDER BY Version;
