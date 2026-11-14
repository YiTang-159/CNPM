import sql from 'mssql';
import { cleanPriceUpdate, calculateOrderSnapshot } from './pricingPolicy.js';
const format = r => ({ currency:r.LoaiTien.trim(), uploadMinor:Number(r.DonGiaDangMinor),
  translationMinor:Number(r.DonGiaDichMinor), maxVideos:r.GioiHanVideo,
  maxTranslations:r.GioiHanBanDich, annualDiscountPct:r.GiamGiaNamPct,
  version:Number(r.PhienBan), updatedAt:new Date(r.NgayCapNhat).toISOString() });
const conflict = Object.assign(new Error('price_changed'), {code:'price_changed'});

export function attachPricing(pool,repo) {
  Object.assign(repo, {
    async getPricing() {
      const [rows,packs]=await Promise.all([
        pool.request().query('SELECT * FROM dbo.BangGia ORDER BY LoaiTien'),
        pool.request().query('SELECT MaGoi AS id,TenGoi AS name,SoVideoDang AS uploads,SoVideoDich AS outs,ThoiHanNgay AS durationDays,HienThi AS enabled,ThuTu AS sortOrder FROM dbo.GoiDichVu ORDER BY ThuTu,MaGoi')]);
      return { currencies:rows.recordset.map(format), packs:packs.recordset.map(p=>({...p,enabled:Boolean(p.enabled)})) };
    },
    async getPricingHistory(limit=40) {
      const r=await pool.request().input('n',sql.Int,Math.min(Math.max(1,limit),100))
        .query('SELECT TOP (@n) MaLichSu AS id,LoaiTien AS currency,PhienBanCu AS previousVersion,PhienBanMoi AS version, NguoiSua AS changedBy,LyDo AS reason,NgaySua AS changedAt,GiaCu AS previous,GiaMoi AS next FROM dbo.LichSuBangGia ORDER BY MaLichSu DESC');
      return r.recordset.map(x=>({...x,previous:JSON.parse(x.previous),next:JSON.parse(x.next)}));
    },
    async updatePricing(input, actor) {
      const parsed=cleanPriceUpdate(input);
      if(parsed.error) throw Object.assign(new Error(parsed.error),{code:parsed.error});
      const v=parsed.value;
      const tx=new sql.Transaction(pool); await tx.begin();
      try {
        const current=(await new sql.Request(tx).input('currency',sql.Char(3),v.currency)
          .query('SELECT * FROM dbo.BangGia WITH (UPDLOCK,HOLDLOCK) WHERE LoaiTien=@currency')).recordset[0];
        if(!current) throw Object.assign(new Error('not_found'),{code:'not_found'});
        if(Number(current.PhienBan)!==v.version) throw conflict;
        const before=format(current), next={...before,uploadMinor:v.uploadMinor,translationMinor:v.translationMinor,
          maxVideos:v.maxVideos,maxTranslations:v.maxTranslations,annualDiscountPct:v.annualDiscountPct,version:v.version+1};
        await new sql.Request(tx).input('currency',sql.Char(3),v.currency)
          .input('up',sql.BigInt,v.uploadMinor).input('out',sql.BigInt,v.translationMinor)
          .input('maxUp',sql.Int,v.maxVideos).input('maxOut',sql.Int,v.maxTranslations)
          .input('annual',sql.Int,v.annualDiscountPct).input('editor',sql.NVarChar(254),actor)
          .query(`UPDATE dbo.BangGia SET DonGiaDangMinor=@up,DonGiaDichMinor=@out,
            GioiHanVideo=@maxUp,GioiHanBanDich=@maxOut,GiamGiaNamPct=@annual,
            PhienBan=PhienBan+1,NguoiSua=@editor,NgayCapNhat=SYSUTCDATETIME() WHERE LoaiTien=@currency`);
        await new sql.Request(tx).input('currency',sql.Char(3),v.currency)
          .input('before',sql.NVarChar(sql.MAX),JSON.stringify(before))
          .input('after',sql.NVarChar(sql.MAX),JSON.stringify(next))
          .input('old',sql.BigInt,v.version).input('new',sql.BigInt,next.version)
          .input('editor',sql.NVarChar(254),actor).input('reason',sql.NVarChar(500),v.reason)
          .query(`INSERT dbo.LichSuBangGia(LoaiTien,GiaCu,GiaMoi,PhienBanCu,PhienBanMoi,NguoiSua,LyDo)
            VALUES(@currency,@before,@after,@old,@new,@editor,@reason)`);
        await tx.commit();
        return next;
      } catch(e) { await tx.rollback().catch(()=>{}); throw e; }
    },
  });
}
