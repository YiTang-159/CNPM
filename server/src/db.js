// Kết nối SQL Server, tạo CSDL và bảng khi khởi động, và các câu lệnh cho đơn hàng / thanh toán.
import sql from 'mssql';
import { readFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const DB_DIR = join(dirname(fileURLToPath(import.meta.url)), '..', '..', 'db');

function config(database) {
  return {
    server: process.env.DB_HOST || 'localhost',
    port: Number(process.env.DB_PORT || 1433),
    user: process.env.DB_USER || 'sa',
    password: process.env.DB_PASSWORD || 'Dubchef@12345',
    database,
    options: { encrypt: true, trustServerCertificate: true }, // chứng chỉ tự ký của container
    pool: { max: 10, min: 0, idleTimeoutMillis: 30000 },
  };
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/** SQL Server cần vài chục giây để khởi động, nên thử lại cho đến khi kết nối được. */
async function connect(database, tries = 60) {
  for (let n = 1; ; n++) {
    try {
      return await new sql.ConnectionPool(config(database)).connect();
    } catch (e) {
      if (n >= tries) throw e;
      console.log(`Chờ SQL Server (${n}/${tries}): ${e.message}`);
      await sleep(2000);
    }
  }
}

/** Chạy một file .sql, tách các lô bằng dòng GO. */
async function runScript(pool, file) {
  const text = await readFile(join(DB_DIR, file), 'utf8');
  for (const batch of text.split(/^\s*GO\s*$/im)) {
    if (batch.trim()) await pool.request().batch(batch);
  }
}

const mapOrder = (r) => ({
  id: r.OrderId,
  name: r.CustomerName,
  email: r.CustomerEmail,
  uploads: r.UploadVideos,
  outs: r.OutVideos,
  currency: r.Currency.trim(),
  amountMinor: Number(r.AmountMinor), // BIGINT trả về dạng chuỗi
  status: r.Status,
  createdAt: new Date(r.CreatedAt).toISOString(),
  ref: r.TransactionRef || null,
});

/** Tạo CSDL + bảng (nếu chưa có) rồi trả về các hàm thao tác dữ liệu. */
export async function openRepo() {
  const master = await connect('master');
  await runScript(master, '01-create-database.sql');
  await master.close();

  const pool = await connect(process.env.DB_NAME || 'DubchefDB');
  await runScript(pool, '02-schema.sql');
  console.log('SQL Server sẵn sàng.');

  return {
    async ping() {
      await pool.request().query('SELECT 1 AS ok');
    },

    async createOrder(o) {
      const r = await pool.request()
        .input('name', sql.NVarChar(100), o.name)
        .input('email', sql.NVarChar(254), o.email)
        .input('up', sql.Int, o.uploads)
        .input('out', sql.Int, o.outs)
        .input('cur', sql.Char(3), o.currency)
        .input('amt', sql.BigInt, o.amountMinor)
        .query(`INSERT INTO dbo.Orders (CustomerName, CustomerEmail, UploadVideos, OutVideos, Currency, AmountMinor)
                OUTPUT inserted.*
                VALUES (@name, @email, @up, @out, @cur, @amt)`);
      return mapOrder(r.recordset[0]);
    },

    /** Đánh dấu đơn đã trả và ghi giao dịch trong cùng một transaction. Trả null nếu đơn không tồn tại hoặc đã trả. */
    async payOrder(id, { method, ref }) {
      const tx = new sql.Transaction(pool);
      await tx.begin();
      try {
        const upd = await new sql.Request(tx)
          .input('id', sql.Int, id)
          .query(`UPDATE dbo.Orders SET Status = 'paid' OUTPUT inserted.* WHERE OrderId = @id AND Status = 'pending'`);
        if (!upd.recordset.length) {
          await tx.rollback();
          return null;
        }
        const order = upd.recordset[0];
        await new sql.Request(tx)
          .input('id', sql.Int, id)
          .input('method', sql.VarChar(10), method)
          .input('amt', sql.BigInt, order.AmountMinor)
          .input('cur', sql.Char(3), order.Currency)
          .input('ref', sql.VarChar(40), ref)
          .query(`INSERT INTO dbo.Payments (OrderId, Method, AmountMinor, Currency, Status, TransactionRef)
                  VALUES (@id, @method, @amt, @cur, 'success', @ref)`);
        await tx.commit();
        return { order: mapOrder({ ...order, TransactionRef: ref }), payment: { method, ref } };
      } catch (e) {
        await tx.rollback().catch(() => {});
        throw e;
      }
    },

    async listOrders(email, limit = 20) {
      const r = await pool.request()
        .input('email', sql.NVarChar(254), email)
        .input('n', sql.Int, limit)
        .query(`SELECT TOP (@n) o.*, p.TransactionRef
                FROM dbo.Orders o
                LEFT JOIN dbo.Payments p ON p.OrderId = o.OrderId AND p.Status = 'success'
                WHERE o.CustomerEmail = @email
                ORDER BY o.CreatedAt DESC, o.OrderId DESC`);
      return r.recordset.map(mapOrder);
    },
  };
}
