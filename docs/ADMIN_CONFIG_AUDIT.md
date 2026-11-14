# Rà soát cấu hình Admin (15/11/2026)

| Giá trị | Nguồn thực tế hiện tại | Admin sửa được? | Trạng thái |
|---|---|---|---|
| Giá tải lên 20.000 VND | `shared/pricing.js` (và bản copy `web/src/shared`, `mobile`) | Không | **Chưa sửa — rủi ro nhất quán doanh thu** |
| Giá dịch 10.000 VND | `shared/pricing.js` và bản copy | Không | Chưa sửa |
| Giá USD/CNY | `shared/pricing.js` | Không | Chưa sửa; chưa có cơ chế tỷ giá do Admin quản lý |
| 500 video/lượt | `shared/pricing.js`, thông điệp `shared/i18n.js` | Không | Chưa sửa |
| 3 bản dịch/video | `shared/pricing.js` | Không | Chưa sửa |
| Bảng giá gói định kỳ | `shared/i18n.js` hằng `PRICES` | Không | Chưa sửa; mang tính giới thiệu, không phải gói thanh toán thực |
| Quyền gói được mua | `server/src/entitlements.js`, SQL Server | Không thông qua trang Quản lý giá | Cần đối chiếu |
| Email liên hệ | `VITE_CONTACT_EMAIL` (browser public config) | Không | Đã cho cấu hình khi build; chưa chỉnh được trực tiếp Admin |
| Địa chỉ QR công khai | `VITE_PUBLIC_BASE_URL` | Không | Đã thêm kiểm tra HTTPS trước khi hiển thị; chưa cấu hình URL thật |
| Giới hạn thuyết minh/video tải | `server/src/app.js`, `server/src/audioExport.js` | Không | Cần quản trị trong SQL |
| Nội dung Điều khoản/Chính sách | `web/src/pages/Legal.jsx` | Không | Cần đánh giá quy trình duyệt, phiên bản và pháp lý |
| Lượt miễn phí/khuyến mại | Luồng quyền sử dụng / SQL | Chưa xác nhận | Cần kiểm tra nghiệp vụ |

## Rủi ro khiến không thể triển khai giá Admin ngay

- Backend `server/src/orders.js` tính giá từ module tĩnh `shared/pricing.js`; user `web/src/pages/Pricing.jsx` cũng tính từ bản copy.
- Nếu chỉ thêm form sửa giá vào Admin mà không chuyển *toàn bộ* create-order/checkout sang giao dịch SQL nhất quán, giá màn hình và tiền thanh toán có thể lệch.
- Cần migration có rowversion, lịch sử giá, snapshot đơn hàng, API đọc công khai và cập nhật Admin, invalidate cache, kiểm thử 2 trình duyệt, kiểm thử webhook. Chưa tạo chức năng nửa vời gây sai tiền.
