// All credit mutations run inside the same SQL transaction as the business action.
// Locks on the account row serialize concurrent consumption for one customer.
import sql from 'mssql';

export class QuotaError extends Error {
  constructor(type) {
    super(type === 'upload' ? 'quota_upload_exceeded' : 'quota_translation_exceeded');
    this.code = this.message;
  }
}

export async function lockAccount(tx, userId) {
  const r = await new sql.Request(tx).input('uid', sql.Int, userId)
    .query("SELECT MaNguoiDung FROM dbo.NguoiDung WITH (UPDLOCK,HOLDLOCK) WHERE MaNguoiDung=@uid AND TrangThai='active' AND VaiTro='user'");
  return r.recordset.length > 0;
}

// One row per newly paid order; do NOT auto-migrate old unknown/demo historical orders.
export async function grantPaidOrder(tx, order, source) {
  if (order.MaNguoiDung == null || !['payos','demo'].includes(source)) return;
  await new sql.Request(tx).input('oid', sql.Int, order.MaDonHang)
    .input('uid', sql.Int, order.MaNguoiDung)
    .input('uploads', sql.Int, order.SoVideoDang)
    .input('outs', sql.Int, order.SoVideoDich)
    .input('source', sql.VarChar(20), source)
    .query(`INSERT dbo.QuyenLoiGoi(MaDonHang,MaNguoiDung,SoVideoDang,SoVideoDich,NguonXacNhan)
      SELECT @oid,@uid,@uploads,@outs,@source
      WHERE NOT EXISTS (SELECT 1 FROM dbo.QuyenLoiGoi WITH (UPDLOCK,HOLDLOCK) WHERE MaDonHang=@oid)`);
}

/** Consume one item, or do nothing if this video+kind+language was already charged.
 * Must be called after lockAccount and inside a SQL transaction.
 */
export async function charge(tx, userId, videoId, kind, language = '') {
  const used = await new sql.Request(tx).input('video',sql.Int,videoId)
    .input('kind',sql.VarChar(12),kind).input('lang',sql.VarChar(8),language)
    .query(`SELECT TOP(1) MaSuDung FROM dbo.SuDungQuyenLoi WITH(UPDLOCK,HOLDLOCK)
      WHERE MaVideo=@video AND Loai=@kind AND NgonNgu=@lang AND TrangThai='used'`);
  if (used.recordset.length) return false;
  const up = kind === 'upload';
  const total = up ? 'SoVideoDang' : 'SoVideoDich';
  const consumed = up ? 'DaDungVideoDang' : 'DaDungVideoDich';
  const available = await new sql.Request(tx).input('uid',sql.Int,userId)
    .query(`SELECT TOP (1) MaQuyenLoi FROM dbo.QuyenLoiGoi WITH (UPDLOCK,HOLDLOCK)
      WHERE MaNguoiDung=@uid AND ${consumed}<${total}
      ORDER BY NgayCap,MaQuyenLoi`);
  const id = available.recordset[0]?.MaQuyenLoi;
  if (!id) throw new QuotaError(kind);
  await new sql.Request(tx).input('eid',sql.BigInt,id)
    .query(`UPDATE dbo.QuyenLoiGoi SET ${consumed}=${consumed}+1 WHERE MaQuyenLoi=@eid AND ${consumed}<${total}`);
  await new sql.Request(tx).input('eid',sql.BigInt,id).input('video',sql.Int,videoId)
    .input('kind',sql.VarChar(12),kind).input('lang',sql.VarChar(8),language)
    .query(`INSERT dbo.SuDungQuyenLoi(MaQuyenLoi,MaVideo,Loai,NgonNgu)
      VALUES(@eid,@video,@kind,@lang)`);
  return true;
}

// Refund only an unfinished upload reservation (metadata exists, no binary).
// Refunding a completed upload or an already used translation is intentionally forbidden.
export async function refundUnfinishedUpload(tx, videoId) {
  const r = await new sql.Request(tx).input('video',sql.Int,videoId).query(`UPDATE dbo.SuDungQuyenLoi
    SET TrangThai='refunded'
    OUTPUT inserted.MaQuyenLoi AS entitlementId
    WHERE MaVideo=@video AND Loai='upload' AND NgonNgu='' AND TrangThai='used'`);
  for (const row of r.recordset) {
    await new sql.Request(tx).input('eid',sql.BigInt,row.entitlementId)
      .query(`UPDATE dbo.QuyenLoiGoi SET DaDungVideoDang=DaDungVideoDang-1
        WHERE MaQuyenLoi=@eid AND DaDungVideoDang>0`);
  }
}

export async function balance(pool, userId) {
  const r = await pool.request().input('uid',sql.Int,userId).query(`
    SELECT MaQuyenLoi AS id, MaDonHang AS orderId, SoVideoDang AS uploads,
      DaDungVideoDang AS usedUploads, SoVideoDich AS translations,
      DaDungVideoDich AS usedTranslations, NguonXacNhan AS source, NgayCap AS grantedAt
    FROM dbo.QuyenLoiGoi WHERE MaNguoiDung=@uid ORDER BY NgayCap DESC,MaQuyenLoi DESC`);
  const grants = r.recordset.map(x => ({ ...x, uploads:Number(x.uploads),usedUploads:Number(x.usedUploads),
    translations:Number(x.translations),usedTranslations:Number(x.usedTranslations),
    grantedAt:new Date(x.grantedAt).toISOString() }));
  return { grants, uploadsRemaining:grants.reduce((n,x)=>n+x.uploads-x.usedUploads,0),
    translationsRemaining:grants.reduce((n,x)=>n+x.translations-x.usedTranslations,0) };
}
