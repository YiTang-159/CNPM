#!/usr/bin/env node
// Run on trusted DB only after a full backup: node scripts/run-migrations.mjs
// Does not display connection credentials.
import sql from 'mssql';
import { runMigrations } from '../src/migrations.mjs';
const name=process.env.DB_NAME || 'DubchefDB';
if(!/^[A-Za-z][A-Za-z0-9_]{0,127}$/.test(name)) throw new Error('Invalid DB_NAME');
if (!process.env.DB_PASSWORD) throw new Error('DB_PASSWORD must be provided privately by environment');
const shared={
  server:process.env.DB_HOST||'127.0.0.1',port:Number(process.env.DB_PORT||1433),
  user:process.env.DB_MIGRATION_USER||process.env.DB_USER||'sa',
  password:process.env.DB_MIGRATION_PASSWORD||process.env.DB_PASSWORD,
  options:{encrypt:true,trustServerCertificate:process.env.DB_TRUST_SERVER_CERTIFICATE==='true'}
};
if(process.env.DB_CREATE_IF_MISSING==='true') {
  const master=await new sql.ConnectionPool({...shared,database:'master'}).connect();
  try { await master.request().batch(`IF DB_ID(N'${name}') IS NULL CREATE DATABASE [${name}]`); }
  finally { await master.close(); }
}
const pool = await new sql.ConnectionPool({
  ...shared,database:name
}).connect();
try {
  for (const line of await runMigrations(pool)) console.log(line);
  if (process.env.SEED_INITIAL_PRICING === 'true') {
    const { readFile }=await import('node:fs/promises');
    const { dirname, join }=await import('node:path');
    const { fileURLToPath }=await import('node:url');
    const source=await readFile(join(dirname(fileURLToPath(import.meta.url)), '../../db/seed/001_pricing_defaults.sql'),'utf8');
    for(const b of source.split(/^\s*GO\s*$/im)) if(b.trim()) await pool.request().batch(b);
    console.log('Initial pricing seed: COMPLETED (existing records untouched)');
  }
}
finally { await pool.close(); }
