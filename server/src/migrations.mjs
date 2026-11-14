import sql from 'mssql';
import { readFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { MIGRATIONS, splitBatches, versionFor } from './migrationPlan.mjs';
const migrationDir = join(dirname(fileURLToPath(import.meta.url)), '../../db/migrations');

export async function runMigrations(pool) {
  // Only deployment/migration principal may execute this function (not app runtime in prod).
  await pool.request().batch(`IF OBJECT_ID(N'dbo.SchemaMigrations',N'U') IS NULL
    CREATE TABLE dbo.SchemaMigrations(Version INT NOT NULL CONSTRAINT PK_SchemaMigrations PRIMARY KEY,
      FileName NVARCHAR(100) NOT NULL,
      AppliedAt DATETIME2(0) NOT NULL CONSTRAINT DF_SchemaMigrations_AppliedAt DEFAULT SYSUTCDATETIME(),
      ChecksumSha256 CHAR(64) NULL,
      AppliedBy NVARCHAR(128) NULL);
    IF COL_LENGTH('dbo.SchemaMigrations','ChecksumSha256') IS NULL
      ALTER TABLE dbo.SchemaMigrations ADD ChecksumSha256 CHAR(64) NULL;
    IF COL_LENGTH('dbo.SchemaMigrations','AppliedBy') IS NULL
      ALTER TABLE dbo.SchemaMigrations ADD AppliedBy NVARCHAR(128) NULL;`);
  const summary = [];
  for (const name of MIGRATIONS) {
    const ver = versionFor(name);
    const fileText = await readFile(join(migrationDir,name),'utf8');
    const hash = createHash('sha256').update(fileText).digest('hex');
    const tx = new sql.Transaction(pool);
    await tx.begin(sql.ISOLATION_LEVEL.SERIALIZABLE);
    try {
      const lock = await new sql.Request(tx).input('resource',sql.NVarChar(255),'DubchefDB:SchemaMigrations')
        .query(`DECLARE @r INT; EXEC @r = sys.sp_getapplock @Resource=@resource,
         @LockMode='Exclusive',@LockOwner='Transaction',@LockTimeout=30000;
         SELECT @r AS result;`);
      if (lock.recordset[0].result < 0) throw new Error('Cannot acquire migration lock');
      const prior = (await new sql.Request(tx).input('v',sql.Int,ver)
        .query('SELECT FileName,ChecksumSha256 FROM dbo.SchemaMigrations WITH (UPDLOCK,HOLDLOCK) WHERE Version=@v')).recordset[0];
      if (prior?.ChecksumSha256) {
        if (prior.ChecksumSha256.trim() !== hash) throw new Error(`Migration ${ver} checksum mismatch; never edit applied migrations`);
        await tx.commit();
        summary.push(`${name}: ALREADY APPLIED`); continue;
      }
      // Special adoption of legacy 014, previously recorded with no checksum.
      // Re-run idempotently, then stamp only once verified.
      if (prior && !(ver===14 && prior.FileName === '014_pricing.sql'))
        throw new Error(`Migration ${ver} has an unverified legacy ledger entry: ${prior.FileName}`);
      for (const batch of splitBatches(fileText)) await new sql.Request(tx).batch(batch);
      await new sql.Request(tx).input('v',sql.Int,ver).input('f',sql.NVarChar(100),name)
        .input('h',sql.Char(64),hash).input('by',sql.NVarChar(128),process.env.DB_MIGRATION_ACTOR || 'node-migration-runner')
        .query(`IF EXISTS(SELECT 1 FROM dbo.SchemaMigrations WHERE Version=@v)
          UPDATE dbo.SchemaMigrations SET FileName=@f,ChecksumSha256=@h,AppliedBy=@by WHERE Version=@v;
          ELSE INSERT dbo.SchemaMigrations(Version,FileName,ChecksumSha256,AppliedBy) VALUES(@v,@f,@h,@by)`);
      await tx.commit();
      summary.push(`${name}: APPLIED`);
    } catch(e) { await tx.rollback().catch(()=>{}); throw new Error(`Migration ${name}: ${e.message}`,{cause:e}); }
  }
  return summary;
}
