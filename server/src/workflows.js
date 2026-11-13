// Các truy vấn quản lý hồ sơ, video, thuyết minh, phụ đề, phản hồi, ngôn ngữ.
// Tất cả giá trị người dùng đều là SQL parameters, tuyệt đối không ghép vào câu SQL.
import sql from 'mssql';
import { lockAccount, charge, refundUnfinishedUpload } from './entitlements.js';

const videoColumns = `v.MaVideo AS id, v.MaNguoiDung AS userId, v.TieuDe AS title,
  v.TenTep AS fileName, v.DungLuong AS size, v.DinhDang AS mimeType,
  v.DuongDan AS videoUrl, v.NgonNguGoc AS originalLanguage,
  v.TrangThai AS status, v.NgayTaiLen AS createdAt,
  u.HoTen AS userName, u.Email AS userEmail`;
const feedbackColumns = `p.MaPhanHoi AS id, p.MaNguoiDung AS userId, p.MaVideo AS videoId,
  u.HoTen AS name, u.Email AS email, p.NoiDung AS message,
  p.TrangThai AS status, p.TraLoi AS reply, p.UuTien AS priority,
  p.NguoiXuLy AS assignedTo, p.NgayCapNhat AS updatedAt, p.NgayTao AS createdAt`;

export function attachWorkflows(pool, repo) {
  Object.assign(repo, {
    async adminOrders() {
      const r = await pool.request().query(`SELECT TOP (500) o.MaDonHang AS id,o.TenKhachHang AS name,
        o.EmailKhachHang AS email,o.MaNguoiDung AS userId,o.SoTien AS amount,o.LoaiTien AS currency,
        o.TrangThai AS status,o.NgayTao AS createdAt,p.PhuongThuc AS method,p.MaThamChieu AS paymentRef,p.NguonXacNhan AS paymentSource
        FROM dbo.DonHang o LEFT JOIN dbo.GiaoDich p ON p.MaDonHang=o.MaDonHang AND p.TrangThai='success'
        ORDER BY o.MaDonHang DESC`);
      return r.recordset;
    },
    async updateProfile(email, name) {
      const r = await pool.request().input('email', sql.NVarChar(254), email).input('name', sql.NVarChar(100), name)
        .query('UPDATE dbo.NguoiDung SET HoTen=@name OUTPUT inserted.* WHERE Email=@email AND TrangThai=\'active\'');
      return r.recordset[0] ? { id: r.recordset[0].MaNguoiDung, name: r.recordset[0].HoTen, email: r.recordset[0].Email, role: r.recordset[0].VaiTro } : null;
    },
    /** Nâng cấp băm cũ lên scrypt; chỉ ghi nếu băm hiện tại vẫn là băm cũ đã kiểm tra. */
    async updatePasswordHash(email, newHash, oldHash) {
      const r = await pool.request().input('email', sql.NVarChar(254), email)
        .input('newHash', sql.VarChar(200), newHash).input('oldHash', sql.VarChar(200), oldHash)
        .query('UPDATE dbo.NguoiDung SET MatKhauBam=@newHash WHERE Email=@email AND MatKhauBam=@oldHash');
      return r.rowsAffected[0] > 0;
    },
    async updatePassword(email, hash) {
      const r = await pool.request().input('email', sql.NVarChar(254), email).input('hash', sql.VarChar(200), hash)
        .query('UPDATE dbo.NguoiDung SET MatKhauBam=@hash WHERE Email=@email AND TrangThai=\'active\'');
      return r.rowsAffected[0] > 0;
    },
    async createVideo(email, data) {
      const tx = new sql.Transaction(pool);
      await tx.begin();
      try {
        const u = await new sql.Request(tx).input('email',sql.NVarChar(254),email)
          .query("SELECT MaNguoiDung AS id FROM dbo.NguoiDung WHERE Email=@email AND TrangThai='active' AND VaiTro='user'");
        const uid = u.recordset[0]?.id;
        if (!uid || !await lockAccount(tx,uid)) { await tx.rollback(); return null; }
        if (data.requestId) {
          const prev = await new sql.Request(tx).input('uid',sql.Int,uid)
            .input('requestId',sql.VarChar(36),data.requestId)
            .query(`SELECT TOP(1) MaVideo AS id,TieuDe AS title,TenTep AS fileName,
              DungLuong AS size,DinhDang AS mimeType,NgonNguGoc AS originalLanguage
              FROM dbo.Video WHERE MaNguoiDung=@uid AND MaYeuCauTaiLen=@requestId`);
          if (prev.recordset.length) {
            const old=prev.recordset[0];
            if (old.title!==data.title || old.fileName!==data.fileName || Number(old.size)!==data.size ||
              old.mimeType!==data.mimeType || old.originalLanguage!==data.originalLanguage) {
              throw Object.assign(new Error('idempotency_conflict'),{code:'idempotency_conflict'});
            }
            await tx.commit();return {id:old.id,reused:true};
          }
        }
        const r = await new sql.Request(tx).input('uid',sql.Int,uid)
          .input('requestId',sql.VarChar(36),data.requestId || null)
          .input('title',sql.NVarChar(200),data.title)
          .input('fileName',sql.NVarChar(255),data.fileName)
          .input('size',sql.BigInt,data.size)
          .input('mime',sql.VarChar(80),data.mimeType)
          .input('lang',sql.VarChar(8),data.originalLanguage)
          .query(`INSERT INTO dbo.Video (MaNguoiDung,TieuDe,TenTep,DungLuong,DinhDang,NgonNguGoc,MaYeuCauTaiLen)
            OUTPUT inserted.MaVideo AS id VALUES (@uid,@title,@fileName,@size,@mime,@lang,@requestId)`);
        const video = r.recordset[0];
        await charge(tx,uid,video.id,'upload');
        await tx.commit();
        return video;
      } catch(error) { await tx.rollback().catch(()=>{}); throw error; }
    },
    async cancelUnfinishedVideo(id, userId) {
      const tx = new sql.Transaction(pool);
      await tx.begin();
      try {
        if (!await lockAccount(tx,userId)) { await tx.rollback(); return false; }
        const r = await new sql.Request(tx).input('id',sql.Int,id).input('uid',sql.Int,userId)
          .query(`DELETE dbo.Video OUTPUT deleted.MaVideo AS id
            WHERE MaVideo=@id AND MaNguoiDung=@uid AND DuongDan IS NULL AND TrangThai='uploaded'`);
        if (!r.recordset.length) { await tx.rollback(); return false; }
        await refundUnfinishedUpload(tx,id);
        await tx.commit(); return true;
      } catch(e) { await tx.rollback().catch(()=>{}); throw e; }
    },
    async getVideo(id) {
      const r = await pool.request().input('id', sql.Int, id)
        .query(`SELECT ${videoColumns} FROM dbo.Video v INNER JOIN dbo.NguoiDung u ON v.MaNguoiDung=u.MaNguoiDung WHERE v.MaVideo=@id`);
      return r.recordset[0] || null;
    },
    async userVideos(email) {
      const r = await pool.request().input('email', sql.NVarChar(254), email)
        .query(`SELECT ${videoColumns} FROM dbo.Video v INNER JOIN dbo.NguoiDung u ON v.MaNguoiDung=u.MaNguoiDung WHERE u.Email=@email ORDER BY v.NgayTaiLen DESC,v.MaVideo DESC`);
      return r.recordset;
    },
    async setVideoFile(id, filePath) {
      const r = await pool.request().input('id', sql.Int, id).input('path', sql.NVarChar(500), filePath)
        .query('UPDATE dbo.Video SET DuongDan=@path WHERE MaVideo=@id');
      return r.rowsAffected[0] > 0;
    },
    async setVideoStatus(id, status, actor = 'system') {
      const tx = new sql.Transaction(pool);
      await tx.begin();
      try {
        const r = await new sql.Request(tx).input('id', sql.Int, id)
          .input('status', sql.VarChar(20), status)
          .query(`UPDATE dbo.Video SET TrangThai=@status
            OUTPUT deleted.TrangThai AS beforeStatus, inserted.TrangThai AS afterStatus
            WHERE MaVideo=@id`);
        if (!r.recordset.length) { await tx.rollback(); return false; }
        if (r.recordset[0].beforeStatus === status) { await tx.rollback(); return true; }
        await new sql.Request(tx).input('actor', sql.NVarChar(254), actor)
          .input('target', sql.NVarChar(254), String(id))
          .input('before', sql.NVarChar(40), r.recordset[0].beforeStatus)
          .input('after', sql.NVarChar(40), status)
          .query(`INSERT dbo.NhatKyQuanTri(Loai,DoiTuong,NguoiThucHien,GiaTriCu,GiaTriMoi)
                  VALUES('video_status',@target,@actor,@before,@after)`);
        await tx.commit();
        return true;
      } catch(e) { await tx.rollback().catch(()=>{}); throw e; }
    },
    async deleteVideo(id) {
      const tx = new sql.Transaction(pool);
      await tx.begin();
      try {
        const info = await new sql.Request(tx).input('id',sql.Int,id)
          .query('SELECT MaNguoiDung AS uid,DuongDan AS filePath,TrangThai AS status FROM dbo.Video WITH(UPDLOCK,HOLDLOCK) WHERE MaVideo=@id');
        if (!info.recordset.length) { await tx.rollback(); return null; }
        const v=info.recordset[0];
        const d=await new sql.Request(tx).input('id',sql.Int,id)
          .query('DELETE dbo.Video OUTPUT deleted.DuongDan AS filePath WHERE MaVideo=@id');
        // A fully uploaded video consumes its credit even if Admin deletes it later.
        if (!v.filePath && v.status==='uploaded') await refundUnfinishedUpload(tx,id);
        await tx.commit();return d.recordset[0] || null;
      } catch(e) { await tx.rollback().catch(()=>{}); throw e; }
    },
    async saveVideoResult(id, status, results, actor = 'system', originalLanguage = null) {
      const tx = new sql.Transaction(pool);
      await tx.begin();
      try {
        const owner = await new sql.Request(tx).input('id',sql.Int,id)
          .query('SELECT MaNguoiDung AS userId FROM dbo.Video WHERE MaVideo=@id');
        const uid = owner.recordset[0]?.userId;
        if (!uid || !await lockAccount(tx,uid)) throw new Error('not_found');
        const video = await new sql.Request(tx).input('id',sql.Int,id)
          .query('SELECT MaNguoiDung AS userId,NgonNguGoc AS originalLanguage FROM dbo.Video WITH (UPDLOCK,HOLDLOCK) WHERE MaVideo=@id');
        const v = video.recordset[0];
        if (!v || v.userId!==uid) throw new Error('not_found');
        // Charge once per NEW target language, not once per segment/redo/subtitle+narration.
        // Always trust the source language recorded in SQL, never client input.
        for (const language of new Set(Object.keys(results.subtitles || {}))) {
          if (language === v.originalLanguage) continue;
          // A translation already stored before migration 12 is grandfathered:
          // re-editing old content cannot spend a newly purchased credit.
          const existing = await new sql.Request(tx).input('id',sql.Int,id)
            .input('language',sql.VarChar(8),language)
            .query(`SELECT TOP(1) MaPhuDe FROM dbo.PhuDe WITH(UPDLOCK,HOLDLOCK)
              WHERE MaVideo=@id AND NgonNgu=@language`);
          if (!existing.recordset.length) await charge(tx,v.userId,id,'translation',language);
        }
        for (const kind of ['narrations','subtitles']) {
          const table = kind === 'narrations' ? 'dbo.ThuyetMinh' : 'dbo.PhuDe';
          for (const [lang, text] of Object.entries(results[kind] || {})) {
            // MERGE tránh tạo dòng trùng khi người dùng xử lý video lại.
            const changed = await new sql.Request(tx).input('id', sql.Int, id).input('lang', sql.VarChar(8), lang)
              .input('content', sql.NVarChar(sql.MAX), text)
              .input('actor', sql.NVarChar(254), actor)
              .query(`MERGE ${table} WITH (HOLDLOCK) AS t
                USING (SELECT @id AS MaVideo, @lang AS NgonNgu) AS s
                ON t.MaVideo=s.MaVideo AND t.NgonNgu=s.NgonNgu
                WHEN MATCHED AND t.TrangThaiDuyet <> 'published' THEN UPDATE SET
                  NoiDung=@content,TrangThaiDuyet='draft',PhienBan=t.PhienBan+1,
                  NguoiSua=@actor,NgayCapNhat=SYSUTCDATETIME()
                WHEN NOT MATCHED THEN INSERT (MaVideo,NgonNgu,NoiDung,NguoiSua)
                  VALUES (@id,@lang,@content,@actor)
                OUTPUT inserted.PhienBan AS version,inserted.TrangThaiDuyet AS status,
                  inserted.NoiDung AS content;`);
            // Xử lý lại video không được ghi đè bản đã xuất bản.
            for (const row of changed.recordset || []) {
              await new sql.Request(tx).input('kind', sql.VarChar(12), kind)
                .input('id', sql.Int, id).input('lang', sql.VarChar(8), lang)
                .input('version', sql.Int, row.version).input('status', sql.VarChar(12), row.status)
                .input('content', sql.NVarChar(sql.MAX), row.content).input('editor', sql.NVarChar(254), actor)
                .query(`INSERT dbo.LichSuNoiDung(Loai,MaVideo,NgonNgu,PhienBan,TrangThai,NoiDung,NguoiSua)
                  VALUES(@kind,@id,@lang,@version,@status,@content,@editor)`);
            }
          }
        }
        await new sql.Request(tx).input('id', sql.Int, id).input('status', sql.VarChar(20), status)
          .input('language',sql.VarChar(8),v.originalLanguage)
          .query('UPDATE dbo.Video SET TrangThai=@status,NgonNguGoc=COALESCE(@language,NgonNguGoc) WHERE MaVideo=@id');
        await tx.commit();
      } catch (err) {
        await tx.rollback().catch(() => {});
        throw err;
      }
    },
    async videoResults(id) {
      const [n, s] = await Promise.all([
        pool.request().input('id', sql.Int, id).query('SELECT NgonNgu AS language,NoiDung AS content,NgayTao AS createdAt FROM dbo.ThuyetMinh WHERE MaVideo=@id ORDER BY NgonNgu'),
        pool.request().input('id', sql.Int, id).query('SELECT NgonNgu AS language,NoiDung AS content,NgayTao AS createdAt FROM dbo.PhuDe WHERE MaVideo=@id ORDER BY NgonNgu'),
      ]);
      return { narrations: n.recordset, subtitles: s.recordset };
    },
    async languages() {
      const r = await pool.request().query('SELECT MaNgonNgu AS code,TenNgonNgu AS name,TenTiengAnh AS englishName,TrangThai AS status,NgayTao AS createdAt FROM dbo.NgonNgu ORDER BY MaNgonNgu');
      return r.recordset;
    },
    async createLanguage({ code, name, englishName, status = 'inactive' }) {
      try {
        await pool.request().input('code', sql.VarChar(8), code).input('name', sql.NVarChar(80), name)
          .input('en', sql.NVarChar(80), englishName)
          .input('status', sql.VarChar(10), status)
          .query('INSERT INTO dbo.NgonNgu (MaNgonNgu,TenNgonNgu,TenTiengAnh,TrangThai) VALUES (@code,@name,@en,@status)');
        return true;
      } catch (e) { if ([2601,2627].includes(e.number)) return false; throw e; }
    },
    async updateLanguage(code, { name, englishName, status }) {
      const r = await pool.request().input('code', sql.VarChar(8), code).input('name', sql.NVarChar(80), name)
        .input('en', sql.NVarChar(80), englishName).input('status', sql.VarChar(10), status)
        .query('UPDATE dbo.NgonNgu SET TenNgonNgu=@name,TenTiengAnh=@en,TrangThai=@status WHERE MaNgonNgu=@code');
      return r.rowsAffected[0] > 0;
    },
    async addFeedback(email, message, videoId = null) {
      const r = await pool.request().input('email', sql.NVarChar(254), email)
        .input('msg', sql.NVarChar(2000), message).input('video', sql.Int, videoId)
        .query(`INSERT dbo.PhanHoi (MaNguoiDung,MaVideo,NoiDung)
          OUTPUT inserted.MaPhanHoi AS id
          SELECT MaNguoiDung,@video,@msg FROM dbo.NguoiDung WHERE Email=@email AND TrangThai='active'`);
      return r.recordset[0] || null;
    },
    async userFeedback(email) {
      const r = await pool.request().input('email', sql.NVarChar(254), email)
        .query(`SELECT ${feedbackColumns} FROM dbo.PhanHoi p INNER JOIN dbo.NguoiDung u ON p.MaNguoiDung=u.MaNguoiDung
          WHERE u.Email=@email ORDER BY p.NgayTao DESC`);
      return r.recordset;
    },
    async allFeedback() {
      const [f, contacts] = await Promise.all([
        pool.request().query(`SELECT ${feedbackColumns} FROM dbo.PhanHoi p INNER JOIN dbo.NguoiDung u ON p.MaNguoiDung=u.MaNguoiDung ORDER BY p.NgayTao DESC`),
        pool.request().query('SELECT MaLienHe AS id,HoTen AS name,Email AS email,NoiDung AS message,TrangThai AS status,TraLoi AS reply,UuTien AS priority,NguoiXuLy AS assignedTo,NgayCapNhat AS updatedAt,NgayTao AS createdAt FROM dbo.LienHe ORDER BY NgayTao DESC')
      ]);
      return [...f.recordset.map((x) => ({ ...x, id: 'f-' + x.id, source: 'user' })),
        ...contacts.recordset.map((x) => ({ ...x, id: 'c-' + x.id, source: 'contact' }))]
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    },
    async updateFeedback(key, status, reply) {
      const contact = key.startsWith('c-');
      const id = Number(key.slice(2));
      const table = contact ? 'dbo.LienHe' : 'dbo.PhanHoi';
      const primary = contact ? 'MaLienHe' : 'MaPhanHoi';
      const r = await pool.request().input('id', sql.Int, id)
        .input('status', sql.VarChar(15), status).input('reply', sql.NVarChar(2000), reply)
        .query(`UPDATE ${table} SET TrangThai=@status,TraLoi=@reply WHERE ${primary}=@id`);
      return r.rowsAffected[0] > 0;
    },
  });
}
