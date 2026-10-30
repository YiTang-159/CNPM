import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import { usePageTitle } from '../utils/usePageTitle.js';
import { videoAdminApi } from '../api/adminVideos.js';

export default function AdminVideos() {
  const { user } = useAuth();

  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadVideos = useCallback(async () => {
    if (!user?.token) {
      setError('Vui lòng đăng nhập Admin');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError('');

      const data = await videoAdminApi.getVideos(user.token);
      setVideos(data.videos || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [user?.token]);

  useEffect(() => {
    loadVideos();
  }, [loadVideos]);

  if (loading) return <p>Đang tải video...</p>;
  if (error) return <p>Lỗi: {error}</p>;

  return (
    <section>
      <h1>Quản lý video đã dịch</h1>

      <button onClick={loadVideos}>
        Làm mới danh sách
      </button>

      <table>
        <thead>
          <tr>
            <th>ID</th>
            <th>Tên video</th>
            <th>Trạng thái</th>
          </tr>
        </thead>

        <tbody>
          {videos.map(video => (
            <tr key={video.id}>
              <td>{video.id}</td>
              <td>{video.title}</td>
              <td>{video.status}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}