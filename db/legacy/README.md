# Legacy SQL archive — DO NOT EXECUTE

- `03-admin.sql` and `05-sqlserver-tai-khoan.sql` contain obsolete SHA2_256 authentication procedures. Passwords are managed by the Node application using scrypt; **never run these**.
- `supabase-*` are PostgreSQL scripts, not compatible with SQL Server 2022.
- `00-CAI-DAT-KHONG-XOA.sql` omits security/financial migrations. The compatibility stub at its former location throws on purpose.
- Older copies of dashboard queries are retained for historical comparison only. The single supported SSMS dashboard is `db/queries.sql`.
- Historical version numbers 003, 005, 006, 008, 009 were not executed in the API canonical schema sequence, and no fake migration ledger rows were created for them.
