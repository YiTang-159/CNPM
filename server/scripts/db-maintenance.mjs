/**
 * Offline database maintenance, executed in a short-lived api image container.
 * The connection is to master (not the production DB) so RESTORE can take an
 * exclusive lock. This script is NOT an HTTP endpoint and never runs at startup.
 *
 * Usage inside compose:
 *   node /app/server/scripts/db-maintenance.mjs backup dubchef_YYYY....bak
 *   node /app/server/scripts/db-maintenance.mjs verify dubchef_YYYY....bak
 *   node /app/server/scripts/db-maintenance.mjs restore dubchef_YYYY....bak
 */
import sql from 'mssql';

const task = process.argv[2];
const backupFile = process.argv[3];
const dbName = process.env.DB_NAME || 'DubchefDB';
const backupDir = '/var/opt/mssql/backup';
const dataDir = '/var/opt/mssql/data';
const qIdent = (x) => `[${String(x).replace(/]/g, ']]')}]`;
const qString = (x) => `N'${String(x).replace(/'/g, "''")}'`;

export function validateBackupFilename(value) {
  if (!/^dubchef_[A-Za-z0-9_-]{8,90}\.bak$/.test(String(value || ''))) {
    throw new Error('Tên bản sao lưu không hợp lệ');
  }
  return value;
}
export function validateDatabaseName(value) {
  if (!/^[A-Za-z][A-Za-z0-9_]{0,127}$/.test(value)) throw new Error('DB_NAME không hợp lệ');
  return value;
}
export function restoreMoves(fileList, targetName) {
  const files = fileList.filter((r) => ['D', 'L'].includes(r.Type));
  if (!files.some((f) => f.Type === 'D') || !files.some((f) => f.Type === 'L') || files.length !== fileList.length) {
    throw new Error('Backup có loại file SQL không được hỗ trợ hoặc thiếu data/log');
  }
  let dataIndex = 0;
  let logIndex = 0;
  return files.map((file) => {
    const isLog = file.Type === 'L';
    const suffix = isLog ? `_log_${logIndex++}.ldf` : `${dataIndex++ === 0 ? '' : `_data_${dataIndex - 1}`}.mdf`;
    return `MOVE ${qString(file.LogicalName)} TO ${qString(`${dataDir}/${targetName}${suffix}`)}`;
  }).join(',\n  ');
}

async function main() {
  if (!['backup', 'verify', 'restore'].includes(task)) throw new Error('Chỉ hỗ trợ backup, verify, restore');
  validateBackupFilename(backupFile);
  validateDatabaseName(dbName);
  if (!process.env.DB_PASSWORD) throw new Error('Thiếu DB_PASSWORD trong cấu hình Docker Compose');
  const filePath = `${backupDir}/${backupFile}`;
  const pool = await new sql.ConnectionPool({
    server: process.env.DB_HOST || 'db',
    port: Number(process.env.DB_PORT || '1433'),
    database: 'master',
    user: process.env.DB_USER || 'sa',
    password: process.env.DB_PASSWORD,
    options: { encrypt: true, trustServerCertificate: true },
    requestTimeout: 30 * 60 * 1000,
    pool: { min: 0, max: 1, idleTimeoutMillis: 30000 },
  }).connect();
  const query = async (text) => pool.request().query(text);
  const existsQuery = `SELECT DB_ID(${qString(dbName)}) AS db_id`;

  async function inspectBackup() {
    await query(`RESTORE VERIFYONLY FROM DISK = ${qString(filePath)} WITH CHECKSUM`);
    const { recordset } = await query(`RESTORE FILELISTONLY FROM DISK = ${qString(filePath)}`);
    if (!recordset?.length) throw new Error('Không đọc được danh sách data/log của backup');
    return recordset;
  }
  async function databaseCheck(name) {
    await query(`DBCC CHECKDB (${qIdent(name)}) WITH NO_INFOMSGS, ALL_ERRORMSGS`);
    const { recordset } = await query(`SELECT COUNT_BIG(*) AS table_count FROM ${qIdent(name)}.sys.tables WHERE is_ms_shipped = 0`);
    const count = Number(recordset?.[0]?.table_count || 0);
    if (count < 1) throw new Error('Database khôi phục không có bảng nghiệp vụ');
    console.log(`DBCC_CHECKDB_OK: ${name}; tables=${count}`);
  }
  async function cleanup(name) {
    const exists = (await query(`SELECT DB_ID(${qString(name)}) AS id`)).recordset?.[0]?.id;
    if (exists !== null && exists !== undefined) {
      await query(`ALTER DATABASE ${qIdent(name)} SET SINGLE_USER WITH ROLLBACK IMMEDIATE`);
      await query(`DROP DATABASE ${qIdent(name)}`);
      console.log(`Đã xóa database kiểm thử tạm: ${name}`);
    }
  }

  try {
    if (task === 'backup') {
      const id = (await query(existsQuery)).recordset?.[0]?.db_id;
      if (id === null || id === undefined) throw new Error(`Database ${dbName} không tồn tại`);
      await query(`BACKUP DATABASE ${qIdent(dbName)} TO DISK = ${qString(filePath)} WITH COPY_ONLY, INIT, COMPRESSION, CHECKSUM, STATS = 10`);
      console.log(`SQL_BACKUP_OK: ${dbName}`);
      return;
    }

    const fileList = await inspectBackup();
    const restoreDb = task === 'verify'
      ? `DubchefRestoreCheck_${Date.now()}_${Math.floor(Math.random() * 100000)}`
      : dbName;
    validateDatabaseName(restoreDb);
    const moves = restoreMoves(fileList, restoreDb);
    if (task === 'verify') {
      let restored = false;
      try {
        await query(`RESTORE DATABASE ${qIdent(restoreDb)} FROM DISK = ${qString(filePath)} WITH ${moves}, RECOVERY, CHECKSUM, STATS = 10`);
        restored = true;
        await databaseCheck(restoreDb);
        console.log('RESTORE_TEST_OK: backup can restore into an isolated database');
      } finally {
        // If RESTORE partly created the DB, clean it up too.
        await cleanup(restoreDb).catch((e) => {
          console.error(`CẢNH BÁO: Không xóa được DB kiểm thử ${restoreDb}: ${e.message}`);
          throw e;
        });
      }
      return;
    }

    // Protected restore: the host script requires a confirmation phrase and stops API.
    // Running this maintenance command directly is an administrator-level operation.
    const exists = (await query(existsQuery)).recordset?.[0]?.db_id;
    if (exists !== null && exists !== undefined) {
      await query(`ALTER DATABASE ${qIdent(dbName)} SET SINGLE_USER WITH ROLLBACK IMMEDIATE`);
    }
    try {
      await query(`RESTORE DATABASE ${qIdent(dbName)} FROM DISK = ${qString(filePath)} WITH ${moves}, REPLACE, RECOVERY, CHECKSUM, STATS = 10`);
      await databaseCheck(dbName);
      console.log(`PRODUCTION_RESTORE_OK: ${dbName}`);
    } catch (e) {
      // Restore failures can leave the original database SINGLE_USER; try to recover.
      await query(`IF DB_ID(${qString(dbName)}) IS NOT NULL ALTER DATABASE ${qIdent(dbName)} SET MULTI_USER`).catch(() => {});
      throw e;
    }
    await query(`ALTER DATABASE ${qIdent(dbName)} SET MULTI_USER`);
  } finally {
    await pool.close();
  }
}

if (process.argv[1]?.endsWith('db-maintenance.mjs')) {
  main().catch((err) => { console.error('DATABASE_MAINTENANCE_FAILED:', err.message); process.exitCode = 1; });
}
