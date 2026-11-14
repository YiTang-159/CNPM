# Dubchef - quy trình an toàn secret & lịch sử Git

## Trạng thái và nguyên tắc

- `.env`, `web/.env`, Android `*.keystore`, `backups/`, `node_modules/`, video/upload/database/log chỉ được giữ trên máy hoặc secret store. Git ignore không xóa nội dung đã commit trước đây.
- File ZIP an toàn không chứa `.git`, môi trường cá nhân và dữ liệu khách hàng.
- Sau khi thay tệp, **không xóa volume SQL**. Không chạy `docker compose down -v` khi có dữ liệu thật.
- Không dán mật khẩu vào issue, PR, log, ảnh chụp hoặc báo cáo kiểm thử.

## Secret đã từng commit phải được xem là bị lộ (bắt buộc xoay vòng)

| Hạng mục | Thao tác cần thiết | Người chịu trách nhiệm |
|---|---|---|
| `DB_PASSWORD` / SQL login `sa` | Đổi mật khẩu **trong SQL Server** trước, cập nhật `.env` sau; giữ nguyên volume | Chủ DB |
| `ADMIN_PASSWORD`, mọi tài khoản dùng mật khẩu mẫu | Đặt mật khẩu mới ngẫu nhiên >=12 ký tự; đổi hash trong database/qua luồng đổi mật khẩu | Chủ ứng dụng |
| `TOKEN_SECRET`, JWT ký hiện tại | Đặt khóa mới ngẫu nhiên >=32 bytes, sẽ hết hạn toàn bộ phiên cũ | Chủ backend |
| `PAYOS_CLIENT_ID`, `PAYOS_API_KEY`, `PAYOS_CHECKSUM_KEY` | Thu hồi/cấp lại trong dashboard payOS; cập nhật secret store và webhook | Chủ tài khoản payOS |
| `METRICS_TOKEN`, OAuth/tunnel/Expo/cloud tokens nếu từng xuất hiện | Thu hồi token cũ, tạo token mới, cập nhật cấu hình host | Chủ dịch vụ |
| `mobile/android/app/debug.keystore`, release signing key nếu liên quan | Sinh debug key mới tại máy; với release key cần quy trình đổi khóa Play App Signing | Chủ bản build |

**Thứ tự an toàn khi giữ SQL cũ**: sao lưu DB ra kho riêng -> thử phục hồi -> mở SSMS bằng tài khoản có quyền -> thay đổi `ALTER LOGIN sa WITH PASSWORD = ...` bằng nhập giá trị mới trực tiếp trong SSMS, KHÔNG đưa vào Git -> cập nhật `DB_PASSWORD` trong `.env` trên máy -> `docker compose up -d --build` -> kiểm tra SSMS/API. Không tự ý chỉ thay `.env` vì SQL Server giữ mật khẩu trong volume. Nếu host công khai cần khóa cổng SQL bằng firewall hoặc bind loopback/VPN.

## Gỡ secret khỏi Git (thực hiện có quyền quản trị, vào thời gian bảo trì)

`git rm --cached` chỉ gỡ file khỏi commit **tiếp theo**; không gỡ lịch sử. Sau khi cả nhóm đồng ý và đã thay secret, từ **mirror clone mới** của repo được phép truy cập (không dùng trên repo đang có thay đổi chưa commit):

```bash
python -m pip install git-filter-repo
# THAY <repo-url> bằng URL repo của chính bạn (không ghi credential trong URL)
git clone --mirror <repo-url> dubchef-clean.git
cd dubchef-clean.git
# Bước rewrite xóa nội dung có khả năng chứa secret cũ, không xoá SQL trên máy
 git filter-repo --force \
   --path .env --path web/.env --path mobile/android/app/debug.keystore \
   --path backups/ --path db/data/ \
   --path-glob '**/.env' --path-glob '**/*.keystore' \
   --path-glob '**/*.bak' --path-glob '**/*.mdf' --path-glob '**/*.ldf' \
   --path-glob '**/node_modules/**' --invert-paths
# filter-repo thường xóa remote origin vì an toàn; kiểm tra trước khi push
git remote add origin <repo-url>
git show-ref
# CHỈ nếu chủ repo đã đồng ý cập nhật lịch sử toàn bộ nhánh và tag
git push --force --mirror origin
```

CẢNH BÁO: `--force --mirror` ghi lại toàn bộ refs và có thể xóa các refs không có trong bản mirror; phải sao lưu repo/GitHub và phối hợp cả nhóm trước khi thực hiện. Bật lại branch protection sau bảo trì, yêu cầu tất cả thành viên xóa clone cũ và clone lại. Rà soát PR, forks, artifact CI, release ZIP, GitHub cache và các bản backup Git; rewrite không thay thế xoay vòng secret. Không dùng chính bản ZIP trước đó để force-push vì `.git` có dữ liệu cũ và thay đổi local chưa commit.

## Cài chặn leak trước commit

```bash
git config core.hooksPath .githooks
# Cài gitleaks CLI từ https://github.com/gitleaks/gitleaks/releases và đưa vào PATH
python scripts/package-share.py --check
```

Hook fail nếu thiếu gitleaks hoặc scanner phát hiện secret. CI có bước quét độc lập; thất bại là lỗi cần xử lý, không được bỏ bước. Không đặt khóa thật vào `VITE_*` vì biến frontend được công khai trong bundle.

## Sinh debug keystore mới cục bộ (không commit)

Trong máy có JDK `keytool`, chạy `scripts/new-debug-keystore.sh` trong Git Bash/WSL (hoặc áp dụng câu lệnh keytool tương đương trên Windows). Script dừng nếu khóa tồn tại, không tự ghi đè; hãy sao lưu key cũ nếu cần dùng để nâng cấp ứng dụng debug cũ. Không thay khóa ký release bằng debug key.
