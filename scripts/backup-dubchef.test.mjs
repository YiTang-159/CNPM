import test from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdtempSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { sha256, validManifest } from './backup-dubchef.mjs';

const script = fileURLToPath(new URL('./backup-dubchef.mjs',import.meta.url));

test('SHA-256 detects changes to binary backup data', () => {
  const dir = mkdtempSync(join(tmpdir(),'dubchef-backup-check-'));
  try {
    const f = join(dir,'test.bak');
    writeFileSync(f,Buffer.alloc(2*1024*1024,0x61));
    const h = sha256(f);
    assert.match(h,/^[a-f0-9]{64}$/);
    writeFileSync(f,Buffer.alloc(2*1024*1024,0x62));
    assert.notEqual(sha256(f),h);
  } finally {rmSync(dir,{recursive:true,force:true});}
});

test('manifest requires both SQL backup and media archive checksums', () => {
  const good = {version:1,database:'DubchefDB',sqlContainerFile:'dubchef_20261114_102030_aabbccdd.bak',
    databaseBak:{sha256:'a'.repeat(64),size:2048}, uploadsTar:{sha256:'b'.repeat(64),size:100}};
  assert.ok(validManifest(good));
  assert.ok(!validManifest({...good,uploadsTar:null}));
  assert.ok(!validManifest({...good,databaseBak:{sha256:'abc',size:1}}));
  assert.ok(!validManifest({...good,sqlContainerFile:'../malicious.bak'}));
});

test('production restore is rejected without an explicit confirmation, before Docker is accessed', () => {
  const r=spawnSync(process.execPath,[script,'restore','backups/fake'],{encoding:'utf8'});
  assert.notEqual(r.status,0);
  assert.match(r.stderr,/RESTORE_DUBCHEF/);
});
