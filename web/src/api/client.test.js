import { describe, expect, it } from 'vitest';
import { api, errorKey, session } from './client.js';

describe('api (chế độ lưu tạm trong trình duyệt)', () => {
  it('đăng ký rồi đăng nhập được', async () => {
    await api.register({ name: 'An', email: 'An@Example.com', password: 'matkhau123' });
    const res = await api.login({ email: 'an@example.com', password: 'matkhau123' });
    expect(res.user.name).toBe('An');
  });

  it('không cho đăng ký trùng email', async () => {
    await api.register({ name: 'An', email: 'an@example.com', password: 'matkhau123' });
    await expect(api.register({ name: 'B', email: 'AN@example.com', password: 'khac12345' })).rejects.toMatchObject({ code: 'exists' });
  });

  it('sai mật khẩu bị từ chối', async () => {
    await api.register({ name: 'An', email: 'an@example.com', password: 'matkhau123' });
    await expect(api.login({ email: 'an@example.com', password: 'saimatkhau' })).rejects.toMatchObject({ code: 'invalid' });
  });

  it('lưu tin nhắn liên hệ và phiên đăng nhập', async () => {
    expect((await api.contact({ name: 'An', email: 'an@example.com', message: 'Xin chào' })).ok).toBe(true);
    session.save({ name: 'An', email: 'an@example.com' });
    expect(session.load().name).toBe('An');
    session.clear();
    expect(session.load()).toBeNull();
  });

  it('đổi mã lỗi thành khóa dịch', () => {
    expect(errorKey({ code: 'exists' })).toBe('e_exists');
    expect(errorKey({ code: 'invalid' })).toBe('e_login');
    expect(errorKey({ code: 'net' })).toBe('e_net');
  });
});
