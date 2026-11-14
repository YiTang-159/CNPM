#!/usr/bin/env node
// One-time, interactive-free provisioning; credentials from environment only.
// NEVER log passwords. Does not modify existing login passwords.
import sql from 'mssql';
const appPass=process.env.DB_APP_PASSWORD, migrationPass=process.env.DB_MIGRATION_PASSWORD;
const check=x=>typeof x==='string' && x.length>=16 && x.length<=128 && /[A-Z]/.test(x) && /[a-z]/.test(x) && /\d/.test(x) && /[^a-zA-Z0-9]/.test(x);
if(!check(appPass)||!check(migrationPass)||appPass===migrationPass)
  throw new Error('DB_APP_PASSWORD and DB_MIGRATION_PASSWORD must be two different 16-128 char strong secrets');
if(!process.env.DB_PASSWORD) throw new Error('DB_PASSWORD needed for privileged one-time provisioning');
const database=process.env.DB_NAME||'DubchefDB';
if(!/^[A-Za-z][A-Za-z0-9_]{0,127}$/.test(database)) throw new Error('Invalid DB_NAME');
const common={server:process.env.DB_HOST||'127.0.0.1',port:Number(process.env.DB_PORT||1433),
 user:process.env.DB_USER||'sa',password:process.env.DB_PASSWORD,
 options:{encrypt:true,trustServerCertificate:process.env.DB_TRUST_SERVER_CERTIFICATE==='true'}};
const master=await new sql.ConnectionPool({...common,database:'master'}).connect();
try {
 for(const [name,password] of [['dubchef_app',appPass],['dubchef_migrator',migrationPass]]) {
   await master.request().input('password',sql.NVarChar(128),password).query(`
     IF NOT EXISTS(SELECT 1 FROM sys.server_principals WHERE name=N'${name}')
     BEGIN
       DECLARE @ddl NVARCHAR(MAX)=N'CREATE LOGIN [${name}] WITH PASSWORD = '
         + QUOTENAME(@password,CHAR(39))+N', CHECK_POLICY = ON, CHECK_EXPIRATION = OFF';
       EXEC sys.sp_executesql @ddl;
     END`);
   console.log(`${name}: login exists/created (existing password NOT rotated)`);
 }
} finally {await master.close();}
const db=await new sql.ConnectionPool({...common,database}).connect();
try {
 await db.request().batch(`
 IF USER_ID('dubchef_app') IS NULL CREATE USER dubchef_app FOR LOGIN dubchef_app;
 IF USER_ID('dubchef_migrator') IS NULL CREATE USER dubchef_migrator FOR LOGIN dubchef_migrator;
 IF IS_ROLEMEMBER('db_datareader','dubchef_app')<>1 ALTER ROLE db_datareader ADD MEMBER dubchef_app;
 IF IS_ROLEMEMBER('db_datawriter','dubchef_app')<>1 ALTER ROLE db_datawriter ADD MEMBER dubchef_app;
 GRANT EXECUTE ON SCHEMA::dbo TO dubchef_app;
 IF IS_ROLEMEMBER('db_datareader','dubchef_migrator')<>1 ALTER ROLE db_datareader ADD MEMBER dubchef_migrator;
 IF IS_ROLEMEMBER('db_datawriter','dubchef_migrator')<>1 ALTER ROLE db_datawriter ADD MEMBER dubchef_migrator;
 IF IS_ROLEMEMBER('db_ddladmin','dubchef_migrator')<>1 ALTER ROLE db_ddladmin ADD MEMBER dubchef_migrator;
 GRANT EXECUTE ON SCHEMA::dbo TO dubchef_migrator;`);
 console.log('Database users/roles provisioned: app read/write/execute; migrator ddl/read/write/execute.');
}finally{await db.close();}
