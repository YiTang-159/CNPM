import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { createHash } from 'node:crypto';
import { MIGRATIONS, splitBatches, versionFor } from '../src/migrationPlan.mjs';
const root=new URL('../../db/migrations/',import.meta.url);
test('Canonical migrations have unique ascending versions and executable batches',async()=>{
 const versions=MIGRATIONS.map(versionFor);
 assert.deepEqual([...new Set(versions)],versions);
 assert.deepEqual([...versions].sort((a,b)=>a-b),versions);
 for(const name of MIGRATIONS){
  assert.match(name,/^\d{3}_[\w-]+\.sql$/);
  const content=await readFile(new URL(name,root),'utf8');
  assert.ok(splitBatches(content).every(b=>b.trim().length>0),name);
  assert.doesNotMatch(content,/\bDROP\s+(?:TABLE|DATABASE)\b/i,`Destructive action in ${name}`);
  assert.doesNotMatch(content,/\bWITH\s+NOCHECK\b/i,`Untrusted FK in ${name}`);
 }
});
test('SSMS generated script contains exact SHA256 hashes of canonical sources',async()=>{
 const ssms=await readFile(new URL('RUN_ALL_IN_SSMS.sql',root),'utf8');
 for(const name of MIGRATIONS){
  const hash=createHash('sha256').update(await readFile(new URL(name,root),'utf8')).digest('hex');
  assert.ok(ssms.includes(`-- ${name} SHA256 ${hash}`),name);
 }
 assert.match(ssms,/sp_getapplock/);
});
test('Runtime uses canonical runner, not independent hardcoded legacy scripts',async()=>{
 const db=await readFile(new URL('../src/db.js',import.meta.url),'utf8');
 assert.match(db,/await runMigrations\(pool\)/);
 assert.doesNotMatch(db,/runScript\(pool,/);
 const entitlement=await readFile(new URL('../src/entitlements.js',import.meta.url),'utf8');
 assert.doesNotMatch(entitlement,/UPDATE dbo\.QuyenLoiGoi SET DaDungVideoDang=/);
 assert.doesNotMatch(entitlement,/UPDATE dbo\.QuyenLoiGoi SET \$\{consumed\}=/);
});
