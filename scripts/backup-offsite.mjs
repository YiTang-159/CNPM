/** Copies an already RESTORE-VERIFIED backup to a different physical drive or network share.
 * Never overwrites an existing backup, never accesses or changes production SQL.
 * Usage: node scripts/backup-offsite.mjs --source backups/dubchef_... --dest E:\DubchefBackups
 */
import { createHash } from 'node:crypto';
import { createReadStream, existsSync, mkdirSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { copyFile, mkdir, open, rm } from 'node:fs/promises';
import { basename, dirname, isAbsolute, join, parse, resolve, relative, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const project = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const required = ['database.bak', 'uploads.tar.gz', 'manifest.json', 'verification.json'];
const dirInside = (parent, child) => { const rel = relative(parent, child); return rel === '' || (rel !== '..' && !rel.startsWith('..'+sep) && !isAbsolute(rel)); };
async function checksum(path) {
  const hash = createHash('sha256');
  for await (const chunk of createReadStream(path)) hash.update(chunk);
  return hash.digest('hex');
}
export async function copyVerifiedBackup(source, targetDir, {requireDifferentDrive = true} = {}) {
  const src = resolve(source), dest = resolve(targetDir);
  const name = basename(src);
  if (!/^dubchef_[A-Za-z0-9_-]+$/.test(name)) throw new Error('Tên thư mục backup không đúng định dạng');
  if (dirInside(src, dest) || dirInside(dest, src) || dirInside(project, dest)) throw new Error('Đích phải là ổ ngoài/NAS độc lập, không nằm trong dự án');
  if (!existsSync(src) || !statSync(src).isDirectory()) throw new Error('Thiếu bản sao lưu nguồn');
  if (!existsSync(dest) || !statSync(dest).isDirectory()) throw new Error('Hãy kết nối và tạo trước thư mục ổ ngoài/NAS đích');
  if (requireDifferentDrive) {
    // Different device is required. On Windows, drive/UNC root distinguishes physical destinations.
    if (process.platform === 'win32' ? parse(src).root.toLowerCase() === parse(dest).root.toLowerCase()
      : statSync(src).dev === statSync(dest).dev)
      throw new Error('Ổ đích trùng ổ nguồn. Dùng ổ USB khác/NAS thật, không dùng thư mục cùng ổ đĩa.');
  }
  const m=JSON.parse(readFileSync(join(src,'manifest.json'),'utf8'));
  const verified=JSON.parse(readFileSync(join(src,'verification.json'),'utf8'));
  if (m.version !== 1 || m.database !== 'DubchefDB' ||
      !['databaseRestore','integrityCheck','uploadsArchive','sha256'].every(k=>verified[k]==='PASS'))
    throw new Error('Chỉ chuyển bản sao lưu đã RESTORE/DBCC CHECKDB thành công');
  const fileSpecs=[['database.bak',m.databaseBak],['uploads.tar.gz',m.uploadsTar]];
  for (const [name,entry] of fileSpecs) {
    if (!entry || !/^[a-f0-9]{64}$/i.test(entry.sha256) || !Number.isSafeInteger(entry.size) || entry.size<1 ||
        !existsSync(join(src,name)) || statSync(join(src,name)).size !== entry.size || await checksum(join(src,name)) !== entry.sha256)
      throw new Error(`${name}: nguồn thiếu/sai checksum`);
  }
  const output=join(dest,basename(src));
  await mkdir(output); // fails if already there; never overwrite an earlier backup.
  try {
    for (const name of required) await copyFile(join(src,name),join(output,name));
    for (const [name,entry] of fileSpecs)
      if (statSync(join(output,name)).size!==entry.size || await checksum(join(output,name))!==entry.sha256)
        throw new Error(`Checksum đích không khớp: ${name}`);
    return output;
  } catch (error) { await rm(output,{recursive:true,force:true}); throw error; }
}
if (process.argv[1] && resolve(process.argv[1])===fileURLToPath(import.meta.url)) {
  const value = k => process.argv[process.argv.indexOf(k)+1];
  const has = k=> process.argv.includes(k) && Boolean(value(k)) && !String(value(k)).startsWith('--');
  if (!has('--source') || !has('--dest')) {
    console.error('Cú pháp: node scripts/backup-offsite.mjs --source backups/dubchef_... --dest E:\DubchefBackups');
    process.exitCode=2;
  } else {
    const source = resolve(project,value('--source'));
    copyVerifiedBackup(source,value('--dest')).then(path=>console.log('OFFSITE_BACKUP_VERIFIED:',path)).catch(e=>{ console.error('OFFSITE_BACKUP_FAILED:',e.message);process.exitCode=1; });
  }
}
