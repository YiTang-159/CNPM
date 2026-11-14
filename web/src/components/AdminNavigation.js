// Một nguồn thông tin chung cho menu, trang hiện tại và tìm nhanh Ctrl+K.
// Chức năng mua dịch vụ thuộc khách hàng; khu vực Admin chỉ giám sát đơn, giá và giao dịch.
export const ADMIN_GROUPS = [
  { title: 'ĐIỀU HÀNH', links: [
    { to: '/admin/dashboard', name: 'Tổng quan', icon: 'dashboard', hint: 'Toàn cảnh hoạt động và cảnh báo' },
    { to: '/admin/queue', name: 'Việc cần xử lý', icon: 'tasks', hint: 'Danh sách công việc theo mức ưu tiên' },
  ] },
  { title: 'KHÁCH HÀNG', links: [
    { to: '/admin/users', name: 'Người dùng', icon: 'users', hint: 'Tài khoản, trạng thái và hoạt động liên quan' },
    { to: '/admin/feedback', name: 'Phản hồi & hỗ trợ', icon: 'message', hint: 'Tiếp nhận, phản hồi, xử lý yêu cầu' },
  ] },
  { title: 'KINH DOANH', links: [
    { to: '/admin/pricing', name: 'Gói dịch vụ & bảng giá', icon: 'tag', hint: 'Cập nhật giá và theo dõi lịch sử trên SQL Server' },
    { to: '/admin/orders', name: 'Đơn hàng', icon: 'orders', hint: 'Đơn mua, khách hàng và trạng thái' },
    { to: '/admin/payments', name: 'Đối soát thanh toán', icon: 'card', hint: 'Kiểm tra dấu hiệu thanh toán mô phỏng, không xác nhận ngân hàng' },
  ] },
  { title: 'SẢN XUẤT NỘI DUNG', links: [
    { to: '/admin/videos', name: 'Video', icon: 'video', hint: 'Video theo khách hàng và trạng thái' },
    { to: '/admin/subtitles', name: 'Phụ đề', icon: 'captions', hint: 'Chỉnh mốc thời gian, văn bản, duyệt phụ đề' },
    { to: '/admin/narrations', name: 'Thuyết minh', icon: 'microphone', hint: 'Kịch bản lời đọc, nghe thử và kiểm duyệt' },
    { to: '/admin/languages', name: 'Ngôn ngữ', icon: 'globe', hint: 'Danh mục ngôn ngữ và khả năng hỗ trợ' },
  ] },
  { title: 'BÁO CÁO & HỆ THỐNG', links: [
    { to: '/admin', name: 'Thống kê truy cập', icon: 'chart', hint: 'Khách truy cập và biểu đồ theo thời gian', end: true },
    { to: '/admin/qr', name: 'Báo cáo lượt quét QR', icon: 'qr', hint: 'Số liệu quét mã QR' },
    { to: '/admin/audit', name: 'Nhật ký quản trị', icon: 'history', hint: 'Ai đổi trạng thái người dùng và video' },
  ] },
];
export const ADMIN_LINKS = ADMIN_GROUPS.flatMap(group => group.links);
export function currentAdminLink(pathname) {
  return ADMIN_LINKS.find(link => link.to === pathname)
    || ADMIN_LINKS.find(link => !link.end && pathname.startsWith(link.to + '/'))
    || ADMIN_LINKS[0];
}
