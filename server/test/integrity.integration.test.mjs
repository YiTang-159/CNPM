import test from 'node:test';
import assert from 'node:assert/strict';
import { randomBytes } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import sql from 'mssql';
import { runMigrations } from '../src/migrations.mjs';
import { MIGRATIONS } from '../src/migrationPlan.mjs';
const name=`DubchefIntegrity_${process.pid}_${randomBytes(5).toString('hex')}`;
const cfg=db=>({server:process.env.DB_HOST||'127.0.0.1',port:Number(process.env.DB_PORT||1433),
 user:process.env.DB_USER||'sa',password:process.env.DB_PASSWORD,database:db,
 options:{encrypt:true,trustServerCertificate:true}});
async function outputId(pool,q){return (await pool.request().query(q)).recordset[0].id;}
test('Real SQL: blank DB, migrate twice, audit, and reject invalid data (never skip)',{timeout:240000},async()=>{
 assert.ok(process.env.DB_PASSWORD,'DB_PASSWORD required; use CI SQL Server service');
 const master=await new sql.ConnectionPool(cfg('master')).connect();
 let db;
 try{
  await master.request().batch(`CREATE DATABASE [${name}]`);
  db=await new sql.ConnectionPool(cfg(name)).connect();
  await runMigrations(db);
  const applied=await db.request().query('SELECT COUNT(*) AS n FROM dbo.SchemaMigrations WHERE ChecksumSha256 IS NOT NULL');
  assert.equal(applied.recordset[0].n,MIGRATIONS.length);
  const prior=(await db.request().query('SELECT COUNT(*) AS n FROM dbo.SchemaMigrations')).recordset[0].n;
  const repeated=await runMigrations(db);
  assert.ok(repeated.every(s=>s.includes('ALREADY APPLIED')));
  assert.equal((await db.request().query('SELECT COUNT(*) AS n FROM dbo.SchemaMigrations')).recordset[0].n,prior);
  const uid=await outputId(db,`INSERT dbo.NguoiDung(HoTen,Email,MatKhauBam) OUTPUT inserted.MaNguoiDung AS id
     VALUES(N'Fixture owner',N'owner@integrity.invalid','temporary-test-only-not-a-login')`);
  const other=await outputId(db,`INSERT dbo.NguoiDung(HoTen,Email,MatKhauBam) OUTPUT inserted.MaNguoiDung AS id
     VALUES(N'Fixture other',N'other@integrity.invalid','temporary-test-only-not-a-login')`);
  const video=await outputId(db,`INSERT dbo.Video(MaNguoiDung,TieuDe,TenTep,DungLuong,DinhDang,NgonNguGoc)
    OUTPUT inserted.MaVideo AS id VALUES(${uid},N'Fixture sample',N'sample.mp4',5,'video/mp4','vi')`);
  const video2=await outputId(db,`INSERT dbo.Video(MaNguoiDung,TieuDe,TenTep,DungLuong,DinhDang,NgonNguGoc)
    OUTPUT inserted.MaVideo AS id VALUES(${uid},N'Fixture next',N'next.mp4',5,'video/mp4','vi')`);
  const otherVideo=await outputId(db,`INSERT dbo.Video(MaNguoiDung,TieuDe,TenTep,DungLuong,DinhDang,NgonNguGoc)
    OUTPUT inserted.MaVideo AS id VALUES(${other},N'Fixture чуж',N'other.mp4',5,'video/mp4','vi')`);
  const order=await outputId(db,`INSERT dbo.DonHang(MaNguoiDung,TenKhachHang,EmailKhachHang,
    SoVideoDang,SoVideoDich,LoaiTien,SoTien,DonGiaDangSnapshot,DonGiaDichSnapshot,PhienBanGiaSnapshot,GiamGiaSnapshotPct)
    OUTPUT inserted.MaDonHang AS id VALUES(${uid},N'Fixture owner',N'owner@integrity.invalid',1,1,'VND',30000,20000,10000,1,20)`,/CK_DonHang_SoTien/);
  await db.request().query(`UPDATE dbo.DonHang SET TrangThai='paid' WHERE MaDonHang=${order}`);
  await db.request().query(`INSERT dbo.GiaoDich(MaDonHang,PhuongThuc,SoTien,LoaiTien,TrangThai,MaThamChieu,NguonXacNhan)
     VALUES(${order},'qr',30000,'VND','success','INTEGRITY-0001','demo')`);
  const grant=await outputId(db,`INSERT dbo.QuyenLoiGoi(MaDonHang,MaNguoiDung,SoVideoDang,SoVideoDich,NguonXacNhan)
    OUTPUT inserted.MaQuyenLoi AS id VALUES(${order},${uid},1,1,'demo')`);
  const rejects=async(label,q,constraint)=>{
    await assert.rejects(()=>db.request().query(q),err=>{
      // Reject only if the EXPECTED database constraint/trigger blocked this write;
      // a typo, missing table or connection failure must not count as a PASS.
      assert.match(err.message,constraint,`${label}: wrong rejection reason`);
      return true;
    },`${label}: database must reject invalid write`);
    console.log(`DB_REJECTED_BY_CONSTRAINT: ${label} (${constraint})`);
  };
  await rejects('negative money',`INSERT dbo.DonHang(MaNguoiDung,TenKhachHang,EmailKhachHang,SoVideoDang,SoVideoDich,LoaiTien,SoTien,DonGiaDangSnapshot,DonGiaDichSnapshot,PhienBanGiaSnapshot,GiamGiaSnapshotPct)
    VALUES(${uid},N'Invalid',N'owner@integrity.invalid',1,1,'VND',-1,20000,10000,1,20)`,/CK_DonHang_SoTien/);
  await rejects('unknown language',`INSERT dbo.Video(MaNguoiDung,TieuDe,TenTep,DungLuong,DinhDang,NgonNguGoc)
    VALUES(${uid},N'Invalid',N'x.mp4',1,'video/mp4','xx')`,/FK_Video_NgonNgu/);
  await rejects('payment mismatch',`INSERT dbo.GiaoDich(MaDonHang,PhuongThuc,SoTien,LoaiTien,TrangThai,MaThamChieu,NguonXacNhan)
    VALUES(${order},'qr',1,'VND','failed','INTEGRITY-0002','demo')`,/FK_GiaoDich_DonHang_SoTien/);
  await rejects('second success',`INSERT dbo.GiaoDich(MaDonHang,PhuongThuc,SoTien,LoaiTien,TrangThai,MaThamChieu,NguonXacNhan)
    VALUES(${order},'qr',30000,'VND','success','INTEGRITY-0003','demo')`,/UX_GiaoDich_MotThanhCong/);
  await rejects('malformed JSON',`INSERT dbo.ThuyetMinh(MaVideo,NgonNgu,NoiDung) VALUES(${video},'vi',N'not-json')`,/CK_ThuyetMinh_Json/);
  await rejects('other-user video charge',`INSERT dbo.SuDungQuyenLoi(MaQuyenLoi,MaVideo,Loai,NgonNgu)
    VALUES(${grant},${otherVideo},'upload',NULL)`,/Video owner differs from entitlement owner/);
  await db.request().query(`INSERT dbo.SuDungQuyenLoi(MaQuyenLoi,MaVideo,Loai,NgonNgu)
    VALUES(${grant},${video},'upload',NULL)`);
  const used=(await db.request().query(`SELECT DaDungVideoDang AS used FROM dbo.QuyenLoiGoi WHERE MaQuyenLoi=${grant}`)).recordset[0].used;
  assert.equal(used,1,'DB trigger must update counters');
  await rejects('quota above one',`INSERT dbo.SuDungQuyenLoi(MaQuyenLoi,MaVideo,Loai,NgonNgu)
    VALUES(${grant},${video2},'upload',NULL)`,/CK_QuyenLoiGoi_Uploads/);
  await rejects('unknown usage language',`INSERT dbo.SuDungQuyenLoi(MaQuyenLoi,MaVideo,Loai,NgonNgu)
    VALUES(${grant},${video},'translation','xx')`,/FK_SuDungQuyenLoi_NgonNgu/);
  const audit=await readFile(new URL('../../db/tests/integrity-audit.sql',import.meta.url),'utf8');
  await db.request().batch(audit.replace(/^\s*GO\s*$/gim,''));
  console.log('DB_AUDIT: executed without FAIL');
 }finally{
   if(db) await db.close();
   assert.match(name,/^DubchefIntegrity_\d+_[a-f0-9]{10}$/);
   await master.request().batch(`IF DB_ID(N'${name}') IS NOT NULL BEGIN
     ALTER DATABASE [${name}] SET SINGLE_USER WITH ROLLBACK IMMEDIATE;
     DROP DATABASE [${name}]; END`);
   await master.close();
 }
});
