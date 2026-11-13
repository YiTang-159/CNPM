-- Migration an toàn, chạy lại được; KHÔNG gắn nhãn giao dịch cũ là ngân hàng thật.
-- payos: đã xác minh webhook bằng checksum key; demo: mô phỏng; legacy_unknown: dữ liệu lịch sử chưa thể chứng minh.
IF COL_LENGTH(N'dbo.GiaoDich', N'NguonXacNhan') IS NULL
BEGIN
  ALTER TABLE dbo.GiaoDich ADD NguonXacNhan VARCHAR(20) NOT NULL
    CONSTRAINT DF_GiaoDich_NguonXacNhan DEFAULT ('legacy_unknown') WITH VALUES;
END;
GO
IF NOT EXISTS (
  SELECT 1 FROM sys.check_constraints WHERE parent_object_id=OBJECT_ID(N'dbo.GiaoDich')
    AND name=N'CK_GiaoDich_NguonXacNhan'
)
BEGIN
  ALTER TABLE dbo.GiaoDich WITH CHECK ADD CONSTRAINT CK_GiaoDich_NguonXacNhan
    CHECK (NguonXacNhan IN ('demo','payos','legacy_unknown'));
END;
GO
