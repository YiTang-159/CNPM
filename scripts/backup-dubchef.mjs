/**
 * Dubchef backup + REAL restore verification for Windows 11 / Docker Desktop.
 * No extra npm packages. Run from the CNPM root:
 *   node scripts/backup-dubchef.mjs backup
 *   node scripts/backup-dubchef.mjs verify backups/<folder>
 *   node scripts/backup-dubchef.mjs restore backups/<folder> RESTORE_DUBCHEF
 *
 * SQL stays online. API is paused during backup/restore to avoid inconsistent
 * DB + video files. Never uses `docker compose down -v`.
 */
import { spawnSync } from 'node:child_process';
import { createHash, randomBytes } from 'node:crypto';
import { closeSync, existsSync, mkdirSync, openSync, readFileSync, readSync, statSync, writeFileSync } from 'node:fs';
import { dirname, isAbsolute, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
// New backups are stored outside the Git worktree by default.
const backupRoot = resolve(process.env.BACKUP_ROOT || join(root, '..', 'DubchefBackups'));
if (backupRoot === root || backupRoot.startsWith(root + '/')) throw new Error('BACKUP_ROOT must not be inside the Git project');
const cli = process.argv[2];
const selected = process.argv[3];
const confirm = process.argv[4];
const dbContainer = 'dubchef-db';
const apiContainer = 'dubchef-api';
const uploadsVolume = 'dubchef_dubchef-uploads';
const sqlFolder = '/var/opt/mssql/backup';
const mediaArchive = 'uploads.tar.gz';
const dbArchive = 'database.bak';
const manifestFile = 'manifest.json';

function fail(message) { throw new Error(message); }
export function sha256(file) {
  // Streaming-sized reads prevent running out of RAM on large video archives.
  const digest = createHash('sha256');
  const fd = openSync(file, 'r');
  const buf = Buffer.allocUnsafe(1024 * 1024);
  try {
    for (;;) {
      const count = readSync(fd, buf, 0, buf.length, null);
      if (!count) break;
      digest.update(buf.subarray(0, count));
    }
    return digest.digest('hex');
  } finally { closeSync(fd); }
}
export function validManifest(m) {
  return m && m.version === 1 && m.database === 'DubchefDB' &&
    /^dubchef_[A-Za-z0-9_-]{8,90}\.bak$/.test(m.sqlContainerFile) &&
    [m.databaseBak, m.uploadsTar].every((f) => f && /^[0-9a-f]{64}$/i.test(f.sha256) && Number.isSafeInteger(f.size) && f.size > 0);
}
function cmd(command, args, { capture = false, silent = false } = {}) {
  const result = spawnSync(command, args, { cwd: root, encoding: capture ? 'utf8' : undefined,
    stdio: capture ? ['ignore','pipe','pipe'] : silent ? 'ignore' : 'inherit',
    maxBuffer: 50 * 1024 * 1024 });
  if (result.error) fail(`Không chạy được ${command}: ${result.error.message}`);
  if (result.status !== 0) fail(`${command} ${args.slice(0, 3).join(' ')} thất bại (exit ${result.status}). ${capture ? String(result.stderr || '').slice(-1000) : 'Xem lỗi Docker ở trên.'}`);
  return capture ? String(result.stdout || '').trim() : '';
}
function docker(...args) { return cmd('docker', args); }
function compose(...args) { return docker('compose', ...args); }
function dockerCheck() {
  cmd('docker',['info'],{capture:true});
  const state = cmd('docker',['inspect','--format','{{.State.Running}}',dbContainer],{capture:true});
  if (state !== 'true') fail('SQL Server dubchef-db không chạy. Khởi động docker compose up -d db trước.');
  cmd('docker',['volume','inspect',uploadsVolume],{capture:true});
  // Do not resolve API to its image SHA: `compose images -q api` can return
  // a stale digest after Docker rebuilds / prunes old images. Media helpers use
  // `docker compose run api` so Docker Compose selects the current service image.
}
function apiWasRunning() {
  const r = spawnSync('docker',['inspect','--format','{{.State.Running}}',apiContainer],{cwd:root,encoding:'utf8',stdio:['ignore','pipe','ignore']});
  return r.status === 0 && r.stdout.trim() === 'true';
}
function pauseApi(fn) {
  const wasRunning = apiWasRunning();
  if (wasRunning) {
    console.log('Tạm dừng API để ngăn dữ liệu thay đổi trong lúc sao lưu/khôi phục...');
    compose('stop','api');
  }
  try { return fn(); }
  finally {
    if (wasRunning) {
      console.log('Khởi động lại API (giữ nguyên cấu hình và volume)...');
      compose('start','api');
    }
  }
}
function sqlDir() {
  docker('exec','--user','0',dbContainer,'sh','-c',
    'mkdir -p /var/opt/mssql/backup && chown 10001:0 /var/opt/mssql/backup && chmod 770 /var/opt/mssql/backup');
}
function runMaintenance(operation, filename) {
  compose('run','--rm','-T','--no-deps','--entrypoint','node','api',
    '/app/server/scripts/db-maintenance.mjs',operation,filename);
}
// Use a temporary Compose service container rather than a Docker image SHA.
// The api service already mounts the SAME named uploads volume as production.
// `-v` binds the host backup directory; on Windows Docker Compose handles C:\ paths.
export function mediaComposeArgs(outputDir, mode, command) {
  if (!['ro', 'rw'].includes(mode)) fail('Chế độ backup media không hợp lệ.');
  const host = resolve(outputDir);
  if (host.includes('\n') || host.includes('\r')) fail('Đường dẫn sao lưu không hợp lệ.');
  return ['run', '--rm', '-T', '--no-deps', '--entrypoint', 'sh',
    '-v', `${host}:/backup:${mode}`, 'api', '-c', command];
}
function mediaRun(outputDir, mode, script) {
  compose(...mediaComposeArgs(outputDir, mode, script));
}
function mediaCopy(outputDir) {
  console.log('Sao lưu Docker volume chứa video/tệp tải lên...');
  mediaRun(outputDir, 'rw',
    'set -eu; test -d /app/server/uploads; tar -C /app/server/uploads -czf /backup/uploads.tar.gz .');
}
function validateArchive(outputDir) {
  console.log('Kiểm tra cấu trúc archive video...');
  mediaRun(outputDir, 'ro', 'set -eu; tar -tzf /backup/uploads.tar.gz >/dev/null');
}
function restoreMedia(outputDir) {
  // WARNING: DESTRUCTIVE. Only invoked after explicit restore confirmation.
  console.log('Khôi phục video từ archive (thay thế nội dung volume uploads)...');
  mediaRun(outputDir, 'ro',
    'set -eu; test -d /app/server/uploads; find /app/server/uploads -mindepth 1 -maxdepth 1 -exec rm -rf -- {} \\; ; tar -xzf /backup/uploads.tar.gz -C /app/server/uploads');
}
function uniqueId() {
  const date = new Date().toISOString().replace(/[-:]/g,'').replace(/\..+$/,'').replace('T','_');
  return `${date}_${randomBytes(4).toString('hex')}`;
}
function fromFolder(value) {
  if (!value) fail('Thiếu đường dẫn backup. Ví dụ: node scripts/backup-dubchef.mjs verify backups/dubchef_...');
  const dir = isAbsolute(value) ? resolve(value) : resolve(root, value);
  const manifestPath = join(dir,manifestFile);
  if (!existsSync(manifestPath)) fail(`Không có ${manifestPath}`);
  const m = JSON.parse(readFileSync(manifestPath,'utf8'));
  if (!validManifest(m)) fail('Manifest không hợp lệ hoặc không thuộc backup Dubchef');
  for (const [name, expected] of [[dbArchive,m.databaseBak],[mediaArchive,m.uploadsTar]]) {
    const path = join(dir,name);
    if (!existsSync(path)) fail(`Thiếu file: ${path}`);
    const size = statSync(path).size;
    if (size !== expected.size || sha256(path) !== expected.sha256) fail(`Sai checksum/kích thước của ${name}; không thể khôi phục.`);
  }
  return { dir, m };
}
function prepareCopyIn(file, containerFilename) {
  sqlDir();
  docker('cp',file,`${dbContainer}:${sqlFolder}/${containerFilename}`);
  // Docker cp can create root-owned files; make SQL Server the owner.
  docker('exec','--user','0',dbContainer,'chown','10001:0',`${sqlFolder}/${containerFilename}`);
  docker('exec','--user','0',dbContainer,'chmod','640',`${sqlFolder}/${containerFilename}`);
}
function deleteCopyIn(containerFilename) {
  try { docker('exec','--user','0',dbContainer,'rm','-f',`${sqlFolder}/${containerFilename}`); }
  catch (e) { console.warn(`Không dọn được file SQL tạm: ${e.message}`); }
}
function testRestore({dir,m}) {
  validateArchive(dir);
  // Unique filename avoids collision with any backup work in progress.
  const tmpFilename = `dubchef_${uniqueId()}.bak`;
  prepareCopyIn(join(dir,dbArchive),tmpFilename);
  try {
    console.log('RESTORE VERIFYONLY + khôi phục vào DB tạm + DBCC CHECKDB...');
    runMaintenance('verify',tmpFilename);
  } finally { deleteCopyIn(tmpFilename); }
  const report = { verifiedAt: new Date().toISOString(), databaseRestore: 'PASS',
    integrityCheck: 'PASS', uploadsArchive: 'PASS', sha256: 'PASS',
    database: m.database, originalBackupUtc: m.createdAt };
  writeFileSync(join(dir,'verification.json'),JSON.stringify(report,null,2)+'\n');
  console.log(`ĐÃ XÁC MINH: ${join(dir,'verification.json')} (đã khôi phục thử vào DB riêng và xóa DB thử).`);
}
function performBackup() {
  dockerCheck();
  const id = uniqueId();
  const basename = `dubchef_${id}.bak`;
  const dir = join(backupRoot,`dubchef_${id}`);
  mkdirSync(dir,{recursive:true});
  try {
    pauseApi(() => {
      sqlDir();
      try {
        runMaintenance('backup',basename);
        docker('cp',`${dbContainer}:${sqlFolder}/${basename}`,join(dir,dbArchive));
      } finally { deleteCopyIn(basename); }
      mediaCopy(dir);
    });
    const bak = join(dir,dbArchive), archive = join(dir,mediaArchive);
    if (!existsSync(bak) || !existsSync(archive)) fail('Thiếu database.bak hoặc uploads.tar.gz');
    const manifest = {
      version:1, createdAt:new Date().toISOString(), database:'DubchefDB',
      sqlContainerFile:basename, backupMethod:'SQL Server BACKUP DATABASE COPY_ONLY WITH CHECKSUM',
      dataScope:['SQL Server DubchefDB','Docker volume dubchef_dubchef-uploads'],
      databaseBak:{size:statSync(bak).size,sha256:sha256(bak)},
      uploadsTar:{size:statSync(archive).size,sha256:sha256(archive)},
      warning:'No .env, secrets or Ollama model weights included; store secrets securely and pull AI model again as needed.',
    };
    writeFileSync(join(dir,manifestFile),JSON.stringify(manifest,null,2)+'\n');
    console.log(`Bản sao lưu đã tạo: ${dir}`);
    testRestore({dir,m:manifest});
    console.log('BACKUP_AND_RESTORE_VERIFICATION_PASSED');
  } catch (e) {
    writeFileSync(join(dir,'BACKUP_FAILED.txt'), `${new Date().toISOString()}\n${e.message}\n`);
    throw e;
  }
}
function performVerify() {
  const {dir,m} = fromFolder(selected);
  dockerCheck();
  testRestore({dir,m});
}
function performRestore() {
  if (confirm !== 'RESTORE_DUBCHEF') fail('KHÔNG KHÔI PHỤC: Cần nhập chính xác RESTORE_DUBCHEF sau thư mục backup.');
  const {dir,m} = fromFolder(selected);
  dockerCheck();
  // A fresh restore test must succeed immediately before the destructive restore.
  testRestore({dir,m});
  console.warn('CẢNH BÁO: thao tác tiếp theo sẽ GHI ĐÈ DubchefDB và TOÀN BỘ video hiện có.');
  pauseApi(() => {
    const copiedName = `dubchef_${uniqueId()}.bak`;
    prepareCopyIn(join(dir,dbArchive),copiedName);
    try {
      runMaintenance('restore',copiedName);
      restoreMedia(dir);
    } finally { deleteCopyIn(copiedName); }
  });
  writeFileSync(join(dir,`restore-production-${Date.now()}.txt`),
    `RESTORE PRODUCTION requested at ${new Date().toISOString()}\nBackup: ${dir}\nDB: DubchefDB; Upload volume: ${uploadsVolume}\n`);
  console.log('PRODUCTION_RESTORE_COMPLETED. Kiểm tra /api/health và số liệu trên SSMS.');
}

if (process.argv[1]?.endsWith('backup-dubchef.mjs')) {
  try {
    if (cli === 'backup') performBackup();
    else if (cli === 'verify') performVerify();
    else if (cli === 'restore') performRestore();
    else fail('Sử dụng: backup | verify <đường dẫn> | restore <đường dẫn> RESTORE_DUBCHEF');
  } catch (err) {
    console.error(`SAO_LUU_KHOI_PHUC_LOI: ${err.message}`);
    process.exitCode = 1;
  }
}
