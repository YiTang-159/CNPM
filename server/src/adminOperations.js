// Quản trị sản phẩm: nội dung có phiên bản/kiểm duyệt, phản hồi có mức ưu tiên và nhật ký.
// Mọi giá trị từ request dùng SQL parameters. Tên bảng chỉ lấy từ whitelist nội bộ.
import sql from 'mssql';
import { mediaTransitionError } from './adminPolicy.js';
const sourceFor = kind => kind === 'narrations'
  ? { table: 'dbo.ThuyetMinh', pk: 'MaThuyetMinh' }
  : kind === 'subtitles' ? { table: 'dbo.PhuDe', pk: 'MaPhuDe' } : null;
const issue = code => Object.assign(new Error(code), { code });

export function attachAdminOperations(pool, repo) {
  Object.assign(repo, {
    async mediaIndex(kind) {
      const t = sourceFor(kind);
      if (!t) throw issue('invalid');
      const r = await pool.request().query(`SELECT TOP (500) m.${t.pk} AS id, m.MaVideo AS videoId,
        v.TieuDe AS title, u.Email AS userEmail, m.NgonNgu AS language,
        m.TrangThaiDuyet AS status, m.PhienBan AS version, m.NgayCapNhat AS updatedAt,
        m.NguoiSua AS updatedBy, DATALENGTH(m.NoiDung)/2 AS chars
        FROM ${t.table} m JOIN dbo.Video v ON v.MaVideo=m.MaVideo
        JOIN dbo.NguoiDung u ON u.MaNguoiDung=v.MaNguoiDung
        ORDER BY m.NgayCapNhat DESC, m.${t.pk} DESC`);
      return r.recordset;
    },
    async mediaDetail(kind, videoId, language) {
      const t = sourceFor(kind);
      if (!t) throw issue('invalid');
      const r = await pool.request().input('videoId', sql.Int, videoId)
        .input('language', sql.VarChar(8), language)
        .query(`SELECT m.${t.pk} AS id, m.MaVideo AS videoId, m.NgonNgu AS language,
          m.NoiDung AS content, m.TrangThaiDuyet AS status, m.PhienBan AS version,
          m.NgayCapNhat AS updatedAt, m.NguoiSua AS updatedBy
          FROM ${t.table} m WHERE m.MaVideo=@videoId AND m.NgonNgu=@language`);
      return r.recordset[0] || null;
    },
    async mediaHistory(kind, videoId, language) {
      if (!sourceFor(kind)) throw issue('invalid');
      const r = await pool.request().input('kind', sql.VarChar(12), kind)
        .input('videoId', sql.Int, videoId).input('language', sql.VarChar(8), language)
        .query(`SELECT TOP(30) MaLichSu AS id, PhienBan AS version, TrangThai AS status,
          NguoiSua AS editor, ThoiGian AS changedAt
          FROM dbo.LichSuNoiDung WHERE Loai=@kind AND MaVideo=@videoId AND NgonNgu=@language
          ORDER BY MaLichSu DESC`);
      return r.recordset;
    },
    async saveManagedMedia({ kind, videoId, language, lines, status, version, editor }) {
      const t = sourceFor(kind);
      if (!t) throw issue('invalid');
      const content = JSON.stringify(lines);
      const tx = new sql.Transaction(pool);
      await tx.begin();
      try {
        const base = () => new sql.Request(tx).input('videoId', sql.Int, videoId)
          .input('language', sql.VarChar(8), language);
        const existing = (await base().query(`SELECT m.${t.pk} AS id, m.PhienBan AS version,
          m.TrangThaiDuyet AS status, m.NoiDung AS content
          FROM ${t.table} m WITH (UPDLOCK,HOLDLOCK)
          WHERE m.MaVideo=@videoId AND m.NgonNgu=@language`)).recordset[0];
        if (Number(existing?.version || 0) !== version) throw issue('conflict');
        const transitionError = mediaTransitionError(existing, status, content);
        if (transitionError) throw issue(transitionError);
        const nextVersion = version + 1;
        const update = base().input('content', sql.NVarChar(sql.MAX), content)
          .input('status', sql.VarChar(12), status).input('editor', sql.NVarChar(254), editor)
          .input('version', sql.Int, nextVersion);
        if (existing) await update.query(`UPDATE ${t.table} SET NoiDung=@content,
          TrangThaiDuyet=@status, NguoiSua=@editor, PhienBan=@version, NgayCapNhat=SYSUTCDATETIME()
          WHERE MaVideo=@videoId AND NgonNgu=@language`);
        else await update.query(`INSERT ${t.table}
          (MaVideo,NgonNgu,NoiDung,TrangThaiDuyet,NguoiSua,PhienBan)
          VALUES(@videoId,@language,@content,@status,@editor,@version)`);
        await base().input('kind', sql.VarChar(12), kind).input('version', sql.Int, nextVersion)
          .input('status', sql.VarChar(12), status).input('content', sql.NVarChar(sql.MAX), content)
          .input('editor', sql.NVarChar(254), editor)
          .query(`INSERT dbo.LichSuNoiDung(Loai,MaVideo,NgonNgu,PhienBan,TrangThai,NoiDung,NguoiSua)
            VALUES(@kind,@videoId,@language,@version,@status,@content,@editor)`);
        await tx.commit();
        return { version: nextVersion, status };
      } catch (e) { await tx.rollback().catch(() => {}); throw e; }
    },
    async feedbackHistory(key) {
      const contact = key.startsWith('c-');
      const id = Number(key.slice(2));
      const r = await pool.request().input('type', sql.VarChar(8), contact ? 'contact' : 'user')
        .input('id', sql.Int, id)
        .query(`SELECT TOP(30) MaLichSu AS id, TrangThai AS status, UuTien AS priority,
          TraLoi AS reply, NguoiXuLy AS editor, ThoiGian AS changedAt
          FROM dbo.LichSuXuLyPhanHoi WHERE Nguon=@type AND MaBanGhi=@id ORDER BY MaLichSu DESC`);
      return r.recordset;
    },
    async handleFeedback(key, { status, reply, priority, editor }) {
      const contact = key.startsWith('c-');
      const id = Number(key.slice(2));
      const table = contact ? 'dbo.LienHe' : 'dbo.PhanHoi';
      const pk = contact ? 'MaLienHe' : 'MaPhanHoi';
      const tx = new sql.Transaction(pool);
      await tx.begin();
      try {
        const r = await new sql.Request(tx).input('id', sql.Int, id)
          .input('status', sql.VarChar(15), status)
          .input('reply', sql.NVarChar(2000), reply)
          .input('priority', sql.VarChar(8), priority)
          .input('editor', sql.NVarChar(254), editor)
          .query(`UPDATE ${table} SET TrangThai=@status, TraLoi=@reply, UuTien=@priority,
            NguoiXuLy=@editor, NgayCapNhat=SYSUTCDATETIME(),
            NgayGiaiQuyet=CASE WHEN @status='resolved' THEN SYSUTCDATETIME() ELSE NULL END
            WHERE ${pk}=@id`);
        if (!r.rowsAffected[0]) { await tx.rollback(); return false; }
        await new sql.Request(tx).input('id', sql.Int, id)
          .input('type', sql.VarChar(8), contact ? 'contact' : 'user')
          .input('status', sql.VarChar(15), status)
          .input('reply', sql.NVarChar(2000), reply)
          .input('priority', sql.VarChar(8), priority)
          .input('editor', sql.NVarChar(254), editor)
          .query(`INSERT dbo.LichSuXuLyPhanHoi(Nguon,MaBanGhi,TrangThai,UuTien,TraLoi,NguoiXuLy)
            VALUES(@type,@id,@status,@priority,@reply,@editor)`);
        await tx.commit();
        return true;
      } catch (e) { await tx.rollback().catch(() => {}); throw e; }
    },
  });
}
