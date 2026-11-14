import test from 'node:test';
import assert from 'node:assert/strict';
import { bootstrapAdmin } from '../src/adminBootstrap.js';
import { verifyPassword, hashPassword } from '../src/auth.js';

test('Fresh DB requires strong Admin password, does not silently skip', async () => {
  const repo = { findUser: async () => null, ensureAdmin: async () => { throw Error('should not create'); } };
  await assert.rejects(bootstrapAdmin(repo, 'admin@example.org', ''), /CSDL chưa có Admin/);
});
test('Fresh DB creates Admin once and password hash verifies', async () => {
  let stored; let creates=0;
  const repo = { findUser: async () => stored || null,
    ensureAdmin: async (email, password) => { creates++; stored = { email, role:'admin', status:'active', hash: hashPassword(password) }; return true; } };
  const password='UniqueLocalSecret_2026!';
  const result=await bootstrapAdmin(repo,'admin@example.org',password);
  assert.equal(result.created,true);
  assert.equal(verifyPassword(password,stored.hash),true);
  await bootstrapAdmin(repo,'admin@example.org','');
  assert.equal(creates,1);
});
test('Existing Admin retains password when bootstrap ADMIN_PASSWORD blank', async () => {
  const repo={findUser:async()=>({role:'admin',status:'active'}),ensureAdmin:async()=>{throw Error('must not create');}};
  assert.deepEqual(await bootstrapAdmin(repo,'admin@example.org',''),{ready:true,created:false,existing:true});
});
test('Bootstrap rejects a non-admin occupying Admin email',async()=>{
 const repo={findUser:async()=>({role:'user',status:'active'})};
 await assert.rejects(bootstrapAdmin(repo,'admin@example.org','Password12!'),/không phải quản trị/);
});
