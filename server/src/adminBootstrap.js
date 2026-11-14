import { isConfiguredAdminPassword } from './securityConfig.js';

/** Respect accounts that already exist in SQL; fail closed only on fresh installations. */
export async function bootstrapAdmin(repo, email, password) {
  const current = await repo.findUser(email);
  if (current) {
    if (current.role !== 'admin') throw new Error('ADMIN_EMAIL đã thuộc tài khoản không phải quản trị.');
    if (current.status !== 'active') throw new Error('Tài khoản Admin đã bị khóa; cần xử lý trong SQL/luồng quản trị.');
    return { ready: true, created: false, existing: true };
  }
  if (!isConfiguredAdminPassword(password)) {
    throw new Error('CSDL chưa có Admin: chạy npm run setup:local để tạo ADMIN_PASSWORD >= 12 ký tự rồi khởi động lại API.');
  }
  const created = await repo.ensureAdmin(email, password);
  const after = await repo.findUser(email);
  if (!after || after.role !== 'admin' || after.status !== 'active') {
    throw new Error('Không khởi tạo được tài khoản quản trị trên SQL Server.');
  }
  return { ready: true, created: Boolean(created), existing: false };
}
