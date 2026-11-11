# Kết quả kiểm tra bản sửa

Ngày kiểm tra: 11 tháng 11 năm 2026. Bộ code dùng chung API videos/feedback/admin-media và SQL JSON; không còn sử dụng bộ serviceRoutes/serviceRepo cũ.

| Hạng mục đã thực thi | Kết quả |
|---|---|
| Backend node --test server/test/*.test.mjs | 29 đạt, 0 lỗi; 1 test SQL tích hợp bỏ qua do không có SQL Server |
| Shared node --test shared/*.test.mjs | 22 đạt, 0 lỗi |
| Web Vitest | 99 đạt, 0 lỗi |
| Mobile Jest | 14 đạt, 0 lỗi |
| ESLint Web và Mobile | Không lỗi |
| Vite build production | Thành công |
| Expo export Android JavaScript/Hermes | Thành công; đây không phải build APK native |
| Word phân tích hệ thống | Đã render và kiểm tra bố cục 45 trang |
| Sơ đồ | 20 UC và Activity; DFD ngữ cảnh mức 1 mức 2; mức 2 một canvas; ERD miền dữ liệu kiến trúc |

Các test API dùng repository giả xác minh hợp đồng, quyền, chủ sở hữu, cập nhật nội dung, xung đột phiên bản, mô phỏng thanh toán, tải tệp và dọn tệp khi lỗi. Các test giao diện dùng mock API/dịch/Whisper. Test Mobile mới kiểm tra thứ tự metadata → binary upload → results, không lưu kết quả khi upload lỗi, từ chối khách và video quá lớn. Test Shared mới xác nhận không gọi dịch sang ngôn ngữ đã tắt.

Test SQL tích hợp đã được cập nhật theo API/bảng thực và đưa vào job CI riêng với SQL Server 2022. Nó kiểm tra migration lặp lại đúng database, đăng ký/đăng nhập, video, nội dung và lịch sử, phản hồi/trả lời, danh mục, đơn/giao dịch, thống kê, quyền, dữ liệu sau mở lại pool và xóa video. Test chỉ dùng database ngẫu nhiên do nó tạo.

## Phần chưa thể xác nhận từ môi trường kiểm tra

- Môi trường không có Docker hoặc SQL Server đang chạy; localhost:1433 từ chối kết nối. Vì vậy chưa tuyên bố test SQL thật đã đạt hoặc máy SSMS của người dùng đã kết nối thành công.
- Chưa chạy APK trên điện thoại hoặc build native Kotlin/Gradle bằng EAS. Expo export Android chỉ kiểm tra import và đóng gói JavaScript.
- Chưa chạy workflow trên tài khoản GitHub/Expo của nhóm; cần biến URL Backend HTTPS, Expo project/token và Pages.
- Nhận diện Whisper và dịch MyMemory trong test được mock; cần mạng/model/giọng thiết bị khi demo thật.
- Chưa có cổng thanh toán hoặc xác minh tiền ngân hàng; paid chỉ là mô phỏng được bật rõ ràng. Chưa xuất file video đã ghép giọng hoặc file audio TTS.
- Không thực hiện kiểm thử trình duyệt thật end-to-end: Chromium của môi trường không khởi động được do giới hạn quyền socket. Kiểm thử giao diện ở trên là Vitest/jsdom, không được gọi là E2E trình duyệt.

Các cảnh báo thư viện React Router, Animated trong Jest, onnxruntime eval và Expo phiên bản cũ không làm các lệnh kiểm tra trên thất bại. Không nâng hàng loạt phiên bản thư viện để tránh thay đổi ngoài phạm vi sửa lỗi.

## Cách xác nhận hoàn thành trên máy thật

Làm theo README và docs/KIEM_THU.md. Khi /api/health trả db=true, từng thao tác tạo/sửa đã đối chiếu bằng SELECT trong SSMS, test SQL integration đạt, APK chạy trên máy thật và Actions thành công cho đúng commit thì mới chốt toàn bộ triển khai đã hoạt động.

Đã bổ sung kiểm thử định dạng đơn vị tiền: SQL lưu VND theo đồng và USD/CNY theo cent/xu; Admin/Tài khoản Web/Mobile quy đổi đúng khi hiển thị.
