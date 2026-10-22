# Dubchef: thuyết minh tự động đa ngôn ngữ (Việt, Anh, Trung) cho video nấu ăn

[![CI](https://github.com/YiTang-159/CNPM/actions/workflows/ci.yml/badge.svg)](https://github.com/YiTang-159/CNPM/actions/workflows/ci.yml)
[![CD Web](https://github.com/YiTang-159/CNPM/actions/workflows/cd-web.yml/badge.svg)](https://github.com/YiTang-159/CNPM/actions/workflows/cd-web.yml)
[![CD Mobile](https://github.com/YiTang-159/CNPM/actions/workflows/cd-mobile.yml/badge.svg)](https://github.com/YiTang-159/CNPM/actions/workflows/cd-mobile.yml)

Đồ án Công nghệ phần mềm. Phần này thực hiện **yêu cầu 1: FE Dev (React.js + React Native) xử lý giao diện trên Web và Mobile, gồm CI/CD**.

| Yêu cầu 1 | Nằm ở đâu |
|---|---|
| Giao diện Web bằng **React.js** | `web/` (Vite + React 18 + React Router) |
| Giao diện Mobile bằng **React Native** | `mobile/` (Expo + React Navigation) |
| **CI** (test + build tự động) | `.github/workflows/ci.yml` |
| **CD** web (tự đưa lên GitHub Pages) | `.github/workflows/cd-web.yml` |
| **CD** mobile (build APK bằng EAS) | `.github/workflows/cd-mobile.yml` |

## Cấu trúc

```
dubchef/
├─ shared/            Nội dung 3 ngôn ngữ, giá, tính giá theo số video (pricing.js), hàm định dạng (NGUỒN DUY NHẤT) + test
├─ scripts/           sync-shared.mjs: chép shared/ vào web và mobile
├─ web/               React.js: Trang chủ, Tính năng, Trải nghiệm, Bảng giá, Giới thiệu, FAQ, Liên hệ,
│                     Đăng nhập, Đăng ký, Điều khoản, Bảo mật, 404
├─ mobile/            React Native: 5 tab (Trang chủ, Trải nghiệm, Bảng giá, Thông tin, Tài khoản)
└─ .github/workflows/ CI/CD
```

Web và mobile dùng **chung nội dung tiếng Việt / Anh / Trung**. Muốn sửa chữ, chỉ sửa `shared/i18n.js` rồi chạy `npm run sync`. CI sẽ báo lỗi nếu quên đồng bộ.

## Chạy thử

Cần Node.js 20 trở lên.

```bash
# Web
cd web
npm install
npm run dev          # mở địa chỉ hiện ra (thường là http://localhost:5173)

# Mobile
cd mobile
npm install
npm run start        # quét mã QR bằng ứng dụng Expo Go trên điện thoại

# Kiểm tra chất lượng (chạy ở thư mục web hoặc mobile)
npm run lint         # ESLint: tìm lỗi và code không sạch
npm test             # test tự động (xem mục bên dưới)
```

Sau lần `npm install` đầu tiên hãy commit các tệp `package-lock.json` được tạo ra (ở `web/` và `mobile/`).

## Tính năng giao diện

- Đổi ngôn ngữ giao diện Việt / Anh / Trung, nhớ lựa chọn cho lần sau.
- Trang Bảng giá (web: `/pricing`, mobile: tab Bảng giá): người đăng video nấu ăn nhập **số video đăng lên** và **số video dịch ra** để xem giá tạm tính, kèm 4 **gói mẫu** (Bếp nhà, Blogger ẩm thực, Kênh ẩm thực, Nhà hàng và thương hiệu) bấm vào là điền sẵn số lượng. Công thức (giá minh họa): `giá = số video đăng lên × phí đăng + số video dịch ra × phí dịch` — 20.000 ₫ / 0,8 USD / 6 ¥ mỗi video đăng lên và 10.000 ₫ / 0,4 USD / 3 ¥ mỗi video dịch ra. Mỗi video đăng lên được dịch ra tối đa 3 ngôn ngữ nên số video dịch ra không quá 3 lần số video đăng lên; mỗi ô nhập từ 0 đến 500. Logic ở `shared/pricing.js` (dùng chung web và mobile), các gói theo tháng cũ vẫn giữ bên dưới.
- Trang Trải nghiệm: tải video của bạn lên (hoặc dán liên kết), dịch **thật** sang 3 ngôn ngữ (dịch vụ MyMemory, miễn phí, không cần khóa API — xem `shared/translate.js`), rồi phát **chính video đó** kèm phụ đề và **giọng đọc thật** (web: Web Speech API, mobile: `expo-speech`), bật/tắt phụ đề từng ngôn ngữ, chỉnh tốc độ phát.
  - **Tự nhận diện giọng nói (Speech-to-Text) ngay trên web, không cần Backend:** nếu tải file video lên máy (không phải dán liên kết) và để trống ô lời thoại, hệ thống tự chạy model **Whisper** (`Xenova/whisper-base`) ngay trong trình duyệt bằng `@xenova/transformers` (WebAssembly) để nghe và tách lời thoại kèm mốc thời gian thật, rồi dịch + đọc như bình thường — không gửi video lên server nào. Xem `web/src/workers/whisper.worker.js`, `web/src/utils/audio.js`, `web/src/utils/whisper.js`.
  - Video dán bằng liên kết vẫn phải tự gõ lời thoại tay (trình duyệt không đọc được âm thanh của một trang khác vì lý do bảo mật CORS).
  - Lưu ý: model Whisper phải tải ~80–150MB ở lần chạy đầu (cần mạng, có cache lại cho lần sau), xử lý chậm hơn trên máy yếu. Đây là giải pháp AI chạy tại chỗ (client-side) để demo được ngay mà không cần chờ nhóm Backend làm API nhận dạng giọng nói riêng (yêu cầu 2/3) — khi nhóm Backend có API STT/AI mạnh hơn, có thể thay thế bằng cách gọi `web/src/api/client.js` thay vì chạy Whisper trong trình duyệt.
  - **Trên mobile**: cùng tính năng này được làm bằng thư viện native `whisper.rn` (tách âm thanh bằng `ffmpeg-kit-react-native`, model Whisper tải về máy). Đây là module native thật nên **không chạy được qua Expo Go** — phải `npx expo prebuild` rồi build app thật (xem `mobile/WHISPER_SETUP.md`). Nếu app mobile chưa được build theo cách này, màn Trải nghiệm vẫn hoạt động bình thường ở chế độ gõ tay lời thoại, chỉ riêng chế độ tự nhận diện sẽ báo "chưa khả dụng" thay vì chạy thật. Code: `mobile/src/utils/sttNative.js`.
- Đăng ký, đăng nhập, gửi liên hệ có kiểm tra dữ liệu, báo lỗi theo ngôn ngữ, giữ phiên đăng nhập.
- Hỗ trợ chế độ sáng/tối, bàn phím, trình đọc màn hình, giảm chuyển động.
## Kiểm thử và ESLint

| Nơi | Công cụ | Nội dung kiểm tra |
|---|---|---|
| `shared/` | `node --test` | Mọi khóa đều có đủ 3 bản dịch, giá, định dạng tiền, tính giá theo số video và các gói mẫu |
| `web/` | **ESLint 9** (React + React Hooks) | Lỗi cú pháp, biến thừa, sai quy tắc Hooks, thiếu `key` |
| `web/` | **Vitest + Testing Library** (giả lập trình duyệt jsdom) | Test API; test **giao diện**: đổi ngôn ngữ, điều hướng, tiêu đề trang, bảng giá theo năm, tính giá theo số video và gói mẫu, mọi trang có đúng 1 `h1` và không lộ khóa dịch ở cả 3 ngôn ngữ, biểu mẫu Đăng ký / Đăng nhập / Liên hệ, trang Trải nghiệm |
| `mobile/` | **ESLint 9** | Như web |
| `mobile/` | **Jest + React Native Testing Library** (`jest-expo`) | Test giao diện: trang chủ, đổi ngôn ngữ, bảng giá (gồm tính giá theo số video và gói mẫu), trang Trải nghiệm, đăng ký |

Test giao diện thao tác như người dùng thật (bấm nút, gõ chữ, tìm phần tử theo vai trò và nhãn) chứ không chỉ kiểm tra hàm, nên cũng kiểm tra được khả năng truy cập (nhãn ô nhập, tên nút, vùng điều hướng).

Các cảnh báo (warning) của ESLint chỉ hiện ra, không làm CI đỏ. Chỉ **lỗi (error)** mới làm CI thất bại.

## CI/CD

- **CI** (`ci.yml`) chạy khi đẩy code hoặc mở Pull Request: test nội dung dùng chung, kiểm tra đã đồng bộ; với web: **ESLint, test API + giao diện, build**; với mobile: **ESLint, test giao diện, đóng gói JavaScript**.
- **CD web** (`cd-web.yml`): khi có commit vào `main`, lint, test, build rồi đưa lên GitHub Pages. Bật trước: Settings, Pages, Source chọn **GitHub Actions**. Web dùng `HashRouter` nên chạy được ở địa chỉ con của GitHub Pages.
- **CD mobile** (`cd-mobile.yml`): khi gắn tag `mobile-v1.0.0` (hoặc bấm chạy tay), build APK bằng EAS. Cần tài khoản Expo, secret `EXPO_TOKEN`, và chạy `npx eas init` một lần trong `mobile/`.

## Lưu ý phiên bản

Dự án mobile ghim theo Expo SDK 51. Nếu muốn dùng SDK mới hơn, chạy `npx expo install --fix` trong `mobile/` để Expo tự chỉnh phiên bản các thư viện cho khớp.


## Quy trình làm việc nhóm

Xem `CONTRIBUTING.md` (nhánh, Pull Request, phát hành mobile, phân công) và mẫu PR trong `.github/pull_request_template.md`.

## Trang quản trị (`/#/admin`)

Bảng điều khiển riêng cho quản trị viên (có thanh bên, không dùng menu của trang chính), gồm 2 trang:

**Tổng quan (`/admin`)**
- 4 ô số liệu: đang truy cập (5 phút gần nhất), hôm nay (so với hôm qua), trong kỳ 7/14/30 ngày (so với kỳ trước), tổng cộng.
- Biểu đồ đường người truy cập và lượt xem theo ngày, rê chuột để xem từng ngày, có ngày cao nhất; có bảng ẩn cho trình đọc màn hình.

**Người dùng (`/admin/users`)**
- Tổng người dùng, đang hoạt động, đã khóa.
- Tìm theo tên hoặc email, sắp xếp, phân trang 8 người mỗi trang.
- Khóa / mở khóa (người bị khóa không đăng nhập được), xóa có hỏi xác nhận, xuất CSV.

**Cách vào:** bấm **Đăng nhập**, dùng tài khoản quản trị có sẵn (không cần đăng ký): email `admin@dubchef.vn`, mật khẩu `admin12345` (đổi bằng `VITE_ADMIN_EMAIL`, `VITE_ADMIN_PASSWORD` trong `web/.env`), rồi bấm **Quản trị** trên menu hoặc vào `/#/admin`. Tài khoản khác không vào được.

**Cách đếm:** mỗi lần mở một trang, `Layout` gọi `trackVisit` (`web/src/api/analytics.js`). Mỗi trình duyệt có một mã khách (`dubchef-vid`), nên một người mở nhiều trang vẫn chỉ tính là 1 người truy cập trong ngày. Trang admin không tự tính vào số liệu.

**Dữ liệu thật hay mẫu**
- Chưa có Backend (không đặt `VITE_API_URL`): số liệu lưu trong `localStorage`, chỉ đếm trình duyệt này. Nút **Nạp dữ liệu mẫu** thêm 60 ngày truy cập giả và 12 người dùng mẫu (email `demo-N@example.com`); nút xóa kế bên gỡ chúng đi.
- Có Backend: đặt `VITE_API_URL`, web gọi các API sau (đều gửi header `X-User-Email`; Backend phải tự kiểm tra quyền quản trị):

| API | Nội dung |
|---|---|
| `POST /api/track` | nhận `{visitorId, path, lang}`, lưu một lượt xem |
| `GET /api/admin/overview?days=7` | trả `{ stats }`, `stats` theo hàm `summarize` trong `analytics.js`: `span`, `today`, `yesterday`, `period`, `prev`, `total` (mỗi cái `{visitors, views}`), `activeNow`, `series` (`[{date, visitors, views}]`), `peak` |
| `GET /api/admin/users` | trả `{ users: [{name, email, at, status}] }`, `status` là `active` hoặc `locked` |
| `PATCH /api/admin/users` | nhận `{email, status}` để khóa / mở khóa |
| `DELETE /api/admin/users?email=...` | xóa người dùng |

## Thanh toán ở trang Bảng giá + SQL Server (Docker)

Ở phần **Tính giá theo số video**, khi số video hợp lệ sẽ có nút **Thanh toán**: chọn phương thức (thẻ, MoMo, chuyển khoản), xác nhận, nhận mã đơn và mã giao dịch. Đây là **thanh toán giả lập**: không nhập và không lưu số thẻ.

**Kiến trúc:** web (React) → API Node.js (`server/`) → SQL Server trong Docker (`db/`).

| Thư mục / file | Vai trò |
|---|---|
| `docker-compose.yml` | chạy 2 container: `db` (SQL Server 2022) và `api` (Node.js) |
| `db/01-create-database.sql`, `db/02-schema.sql` | tạo CSDL `DubchefDB`, bảng `Orders`, `Payments`, view `vw_DoanhThuNgay` (API tự chạy khi khởi động, chạy lại không sao) |
| `db/queries.sql` | vài câu truy vấn mẫu để xem dữ liệu |
| `server/src/orders.js` | luật đơn hàng, **giá tính lại ở máy chủ** bằng `shared/pricing.js` (không tin số tiền trình duyệt gửi) |
| `server/src/app.js`, `db.js` | các API và câu lệnh SQL |
| `web/src/components/Checkout.jsx`, `web/src/api/orders.js` | nút và khung thanh toán |

**Chạy:**
1. Cài Docker Desktop, mở lên và chờ nó báo Running.
2. Ở thư mục gốc dự án: `docker compose up -d --build` (lần đầu tải vài GB, chờ 3 đến 5 phút).
3. Kiểm tra: mở `http://localhost:3000/api/health`, thấy `{"ok":true,"db":true}` là xong.
4. Tạo file `web/.env` với dòng `VITE_PAYMENT_API_URL=http://localhost:3000`, rồi chạy lại `npm run dev` trong `web`.
5. Mở `/#/pricing`, đăng nhập, bấm **Thanh toán**. Xem dữ liệu bằng Azure Data Studio hoặc SSMS: server `localhost,1433`, user `sa`, mật khẩu `Dubchef@12345` (đổi bằng biến `DB_PASSWORD`), mở `db/queries.sql`.

Không đặt `VITE_PAYMENT_API_URL` thì thanh toán vẫn chạy nhưng đơn chỉ lưu trong trình duyệt.

**API:** `GET /api/health`, `POST /api/orders` (`{name,email,uploads,outs,L}`), `POST /api/orders/:id/pay` (`{method}`), `GET /api/orders?email=`. Bản demo chưa có xác thực; làm thật thì cần kiểm tra đăng nhập ở máy chủ.
