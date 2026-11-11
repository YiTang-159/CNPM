# CI và CD của bản thống nhất

CI có năm job: Shared, Web, Mobile, Backend và SQL integration. Backend chạy toàn bộ server/test/*.test.mjs. SQL integration khởi động SQL Server 2022 tạm, tạo database ngẫu nhiên riêng và kiểm tra đọc ghi/quyền/lịch sử sau mở lại kết nối.

CD Web chạy sau CI thành công trên main hoặc chạy tay; đặt GitHub Variables VITE_API_URL là Backend HTTPS công khai, VITE_PAYMENT_API_URL tùy chọn dùng cùng Backend, VITE_PUBLIC_URL nếu cần địa chỉ QR công khai. Bật Settings → Pages → GitHub Actions. Pages chỉ phục vụ Web tĩnh, không chạy SQL/API và không có Vite proxy /backend.

CD Mobile chạy khi tag mobile-v* hoặc chạy tay; cấu hình EXPO_TOKEN trong Secrets và EXPO_PUBLIC_API_URL trong Variables. Chạy eas init trong mobile và liên kết dự án Expo trước. Workflow ghi URL vào .env của job build và chờ EAS build kết thúc. Chỉ kết luận có APK khi EAS trả kết quả thành công.

Kiểm tra tab Actions trên GitHub cho đúng commit. Bộ ZIP không chứa bằng chứng lần chạy trên GitHub hoặc thông tin đăng nhập Expo. Không commit .env thật, DB_PASSWORD, ADMIN_PASSWORD, TOKEN_SECRET hoặc EXPO_TOKEN. Nếu .env đã bị Git theo dõi từ trước, thêm .gitignore chưa đủ: dùng git rm --cached .env rồi commit việc bỏ theo dõi và giữ file tại máy.

Chạy test cục bộ theo README và docs/KIEM_THU.md trước khi push. Không sửa test để bỏ qua lỗi nghiệp vụ; bộ API cũ projects/uploads đã được thay bằng videos, media và feedback thống nhất, nên các test được cập nhật tương ứng và bổ sung kiểm tra quyền/phiên bản/thời gian.
