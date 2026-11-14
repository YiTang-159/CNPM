# Quyết định triển khai staging Dubchef (15/11/2026)

**Chưa triển khai public. Không có URL staging, uptime hoặc chứng nhận giao dịch.**

- SQL Server 2022 Linux yêu cầu tối thiểu **2 GB RAM, 6 GB đĩa** theo Microsoft; mức tối thiểu để khởi động không có nghĩa đủ cho tải demo thật: https://learn.microsoft.com/en-us/sql/linux/install-upgrade/setup?view=sql-server-ver16
- Ollama model `qwen2.5:3b` bản đang dùng chiếm **1,9 GB chỉ riêng tệp model** (đã thấy trên máy thử). Suy luận kỹ thuật: bộ nhớ khi suy luận còn có KV cache/runtime và tăng theo concurrency. Không nên ghép SQL Server + Ollama + web/API vào container 512 MB miễn phí.
- Render công bố mức **8 GB RAM khoảng 135 USD/tháng** cho cấu hình 2 CPU và ổ đĩa tính riêng (thông tin tham khảo, phải kiểm tra lại lúc mua): https://render.com/pricing

**Quyết định:** giữ kiến trúc SQL Server/API/Ollama trên laptop Docker cho demo tại lớp; triển khai HTTPS staging riêng chỉ sau khi có tài khoản host/VPS, bí mật, thử restore và xác nhận ngân sách. Phương án tiết kiệm để trình chiếu xa: tunnel HTTPS tới web trên laptop đang chạy và giới hạn quyền truy cập; KHÔNG giả là dịch vụ uptime 24/7. Khi staging lâu dài: VPS đủ RAM/SSD, volume DB persistent ngoài Git, API không mở SQL public, reverse proxy TLS, Ollama nội bộ hoặc endpoint inference riêng. Không đưa demo payments/credential production lên staging công khai.

Trước khi đánh giá 10/10: đo RAM CPU thời gian dịch MP3/MP4, thử bằng điện thoại thật, load test, backup/restore, secret scan và uptime được ghi nhận độc lập.
