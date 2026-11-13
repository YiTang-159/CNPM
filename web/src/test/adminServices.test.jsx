import { beforeEach, afterEach, describe, expect, it, vi } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import { renderAdminComponent } from './adminTestUtils.jsx';
import userEvent from '@testing-library/user-event';
import AdminNarrations from '../pages/AdminNarrations.jsx';
import AdminSubtitles from '../pages/AdminSubtitles.jsx';
import AdminFeedback from '../pages/AdminFeedback.jsx';
import AdminVideos from '../pages/AdminVideo.jsx';

vi.hoisted(() => { vi.stubEnv('VITE_API_URL', 'https://api.example.test'); });
beforeEach(() => localStorage.setItem('dubchef-session', JSON.stringify(adminUser)));

const { adminUser } = vi.hoisted(() => ({ adminUser: { email: 'admin@example.com', token: 'signed-admin-token', role: 'admin' } }));
vi.mock('../context/AuthContext.jsx', () => ({ useAuth: () => ({ user: adminUser }) }));
const ok = (data) => Promise.resolve({ ok: true, status: 200, json: async () => data });
afterEach(() => vi.unstubAllGlobals());

describe('quản trị dịch vụ dùng API SQL', () => {
  it('chỉnh kịch bản thuyết minh, gửi token và hiển thị bản đã lưu', async () => {
    const record = { id: 4, projectId: 2, title: 'Bánh mì', userEmail: 'an@example.com', language: 'vi', text: 'Lời cũ', status: 'draft' };
    const fetchMock = vi.fn((url, options) => options.method === 'PATCH'
      ? ok({ narration: { ...record, ...JSON.parse(options.body) } }) : ok({ narrations: [record] }));
    vi.stubGlobal('fetch', fetchMock);
    renderAdminComponent(<AdminNarrations />);
    const user = userEvent.setup();
    await user.click(await screen.findByRole('button', { name: 'Chỉnh sửa thuyết minh' }));
    await user.clear(screen.getByLabelText('Nội dung thuyết minh'));
    await user.type(screen.getByLabelText('Nội dung thuyết minh'), 'Nướng bánh vàng đều.');
    await user.selectOptions(screen.getByLabelText('Trạng thái'), 'ready');
    await user.click(screen.getByRole('button', { name: 'Lưu thuyết minh' }));
    expect(await screen.findByRole('status')).toHaveTextContent('Đã lưu nội dung');
    expect(screen.getByText('Nướng bánh vàng đều.')).toBeInTheDocument();
    expect(fetchMock).toHaveBeenLastCalledWith(expect.stringContaining('/api/admin/narrations/4'), expect.objectContaining({
      method: 'PATCH', headers: expect.objectContaining({ Authorization: 'Bearer signed-admin-token' }),
      body: JSON.stringify({ text: 'Nướng bánh vàng đều.', status: 'ready' }),
    }));
  });

  it('không lưu phụ đề có mốc thời gian đảo ngược và lưu lại khi đã sửa', async () => {
    const record = { id: 7, title: 'Món canh', userEmail: 'an@example.com', language: 'en', text: 'Add water.', start: 0, end: 2 };
    const fetchMock = vi.fn((url, options) => options.method === 'PATCH'
      ? ok({ subtitle: { ...record, ...JSON.parse(options.body) } }) : ok({ subtitles: [record] }));
    vi.stubGlobal('fetch', fetchMock);
    renderAdminComponent(<AdminSubtitles />);
    const user = userEvent.setup();
    await user.click(await screen.findByRole('button', { name: 'Chỉnh sửa phụ đề' }));
    await user.clear(screen.getByLabelText('Bắt đầu (giây)'));
    await user.type(screen.getByLabelText('Bắt đầu (giây)'), '5');
    await user.click(screen.getByRole('button', { name: 'Lưu phụ đề' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('kết thúc phải lớn hơn');
    expect(fetchMock).toHaveBeenCalledTimes(1);
    await user.clear(screen.getByLabelText('Kết thúc (giây)'));
    await user.type(screen.getByLabelText('Kết thúc (giây)'), '8.5');
    await user.click(screen.getByRole('button', { name: 'Lưu phụ đề' }));
    expect(await screen.findByRole('status')).toHaveTextContent('Đã lưu phụ đề');
    expect(fetchMock).toHaveBeenLastCalledWith(expect.stringContaining('/api/admin/subtitles/7'), expect.objectContaining({ body: JSON.stringify({ text: 'Add water.', start: 5, end: 8.5 }) }));
  });

  it('yêu cầu nội dung trả lời và lưu phản hồi vào API', async () => {
    const record = { id: 3, name: 'Khách An', email: 'an@example.com', message: 'Tôi cần sửa phụ đề.', status: 'new', priority: 'normal', reply: '' };
    let saved = record;
    const fetchMock = vi.fn((_url, options) => {
      if (options.method === 'PATCH') {
        saved = { ...saved, ...JSON.parse(options.body) };
        return ok({ feedback: saved });
      }
      return ok({ feedback: [saved] });
    });
    vi.stubGlobal('fetch', fetchMock);
    renderAdminComponent(<AdminFeedback />);
    const user = userEvent.setup();
    await screen.findByText('Tôi cần sửa phụ đề.');
    await user.selectOptions(screen.getByRole('combobox', { name: 'Trạng thái 3' }), 'resolved');
    await user.click(screen.getByRole('button', { name: 'Lưu xử lý' }));
    expect(await screen.findByRole('status')).toHaveTextContent('Cần nhập câu trả lời');
    expect(fetchMock).toHaveBeenCalledTimes(1);
    await user.type(screen.getByLabelText('Trả lời của Admin'), 'Phụ đề đã được cập nhật.');
    await user.click(screen.getByRole('button', { name: 'Lưu xử lý' }));
    await waitFor(() => expect(screen.getByRole('status')).toHaveTextContent('Đã lưu và ghi lịch sử'));
    expect(fetchMock).toHaveBeenCalledWith(expect.stringContaining('/api/admin/feedback/3'), expect.objectContaining({
      method: 'PATCH', headers: expect.objectContaining({ Authorization: 'Bearer signed-admin-token' }),
      body: JSON.stringify({ status: 'resolved', priority: 'normal', reply: 'Phụ đề đã được cập nhật.' }),
    }));
  });

  it('hiển thị lỗi quyền truy cập và cho phép tải lại từ máy chủ', async () => {
    const fetchMock = vi.fn().mockResolvedValueOnce({ ok: false, status: 403, json: async () => ({ code: 'forbidden' }) }).mockImplementation(() => ok({ videos: [] }));
    vi.stubGlobal('fetch', fetchMock);
    renderAdminComponent(<AdminVideos />);
    // A pending request uses role=status; an API error uses role=alert.
    // Wait for the actual 403 error rather than matching the loading indicator.
    expect(await screen.findByRole('alert')).toHaveTextContent('forbidden');
    await userEvent.click(screen.getByRole('button', { name: 'Làm mới' }));
    await waitFor(() => expect(screen.queryByRole('alert')).not.toBeInTheDocument());
    expect(await screen.findByText('Chưa có video tải lên trong SQL Server.')).toBeInTheDocument();
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(localStorage.getItem('dubchef-users')).toBeNull();
  });
});
