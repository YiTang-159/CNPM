// Một nguồn thông tin chung cho menu, điều hướng nhanh và tiêu đề mỗi trang Admin.
export const ADMIN_GROUPS = [
  { title: 'ĐIỀU HÀNH', links: [
    { to: '/admin/dashboard', name: 'Tổng quan hệ thống', icon: 'dashboard', hint: 'Chỉ số, cảnh báo và hoạt động mới nhất' },
    { to: '/admin/queue', name: 'Việc cần xử lý', icon: 'tasks', hint: 'Đơn chờ, phản hồi và nội dung chờ duyệt' },
    { to: '/admin', name: 'Thống kê truy cập', icon: 'chart', hint: 'Biểu đồ truy cập theo thời gian', end: true },
  ] },
  { title: 'KHÁCH HÀNG & KINH DOANH', links: [
    { to: '/admin/users', name: 'Người dùng', icon: 'users', hint: 'Tài khoản và trạng thái truy cập' },
    { to: '/admin/orders', name: 'Đơn hàng & thanh toán', icon: 'orders', hint: 'Tra cứu đơn và đối soát thanh toán' },
    { to: '/admin/feedback', name: 'Phản hồi & hỗ trợ', icon: 'message', hint: 'Tiếp nhận và giải quyết yêu cầu' },
    { to: '/admin/qr', name: 'QR & lượt quét', icon: 'qr', hint: 'Mã truy cập và số liệu quét' },
  ] },
  { title: 'SẢN XUẤT NỘI DUNG', links: [
    { to: '/admin/videos', name: 'Thư viện video', icon: 'video', hint: 'Tệp video và trạng thái xử lý' },
    { to: '/admin/narrations', name: 'Thuyết minh', icon: 'microphone', hint: 'Kịch bản và kiểm duyệt nội dung đọc' },
    { to: '/admin/subtitles', name: 'Phụ đề', icon: 'captions', hint: 'Mốc thời gian và văn bản phụ đề' },
  ] },
  { title: 'CẤU HÌNH DANH MỤC', links: [
    { to: '/admin/languages', name: 'Ngôn ngữ', icon: 'globe', hint: 'Quản lý danh sách ngôn ngữ' },
    { to: '/admin/audit', name: 'Nhật ký thao tác', icon: 'history', hint: 'Xem lịch sử thay đổi tài khoản và video' },
  ] },
];
export const ADMIN_LINKS = ADMIN_GROUPS.flatMap(group => group.links);
export function currentAdminLink(pathname) {
  return ADMIN_LINKS.find(link => link.to === pathname) || ADMIN_LINKS.find(link => !link.end && pathname.startsWith(link.to + '/')) || ADMIN_LINKS[0];
}
