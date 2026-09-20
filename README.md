# Dubchef: thuyết minh tự động đa ngôn ngữ (Việt, Anh, Trung) cho video nấu ăn

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
├─ shared/            Nội dung 3 ngôn ngữ, giá, hàm định dạng (NGUỒN DUY NHẤT) + test
├─ scripts/           sync-shared.mjs: chép shared/ vào web và mobile
├─ web/               React.js: 12 trang (Trang chủ, Tính năng, Trải nghiệm, Bảng giá,
│                     Giới thiệu, FAQ, Liên hệ, Đăng nhập, Đăng ký, Điều khoản, Bảo mật, 404)
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
- Trang Trải nghiệm: tải video, quy trình mô phỏng 4 bước, trình phát video mẫu có **giọng đọc thật** (web: Web Speech API, mobile: `expo-speech`), bật/tắt phụ đề từng ngôn ngữ, chỉnh tốc độ.
- Đăng ký, đăng nhập, gửi liên hệ có kiểm tra dữ liệu, báo lỗi theo ngôn ngữ, giữ phiên đăng nhập.
- Hỗ trợ chế độ sáng/tối, bàn phím, trình đọc màn hình, giảm chuyển động.

## Kết nối Backend (yêu cầu 2 và 3)

Lớp gọi API nằm ở `web/src/api/client.js` và `mobile/src/api/client.js`.

- **Chưa đặt địa chỉ Backend:** dữ liệu đăng ký, đăng nhập, liên hệ được lưu tạm ngay trên thiết bị (chỉ để demo).
- **Đã đặt địa chỉ Backend:** tạo `web/.env` với `VITE_API_URL=http://localhost:3000` (mobile dùng `EXPO_PUBLIC_API_URL`). Giao diện sẽ gọi:

| Phương thức | Đường dẫn | Gửi lên | Trả về khi thành công |
|---|---|---|---|
| POST | `/api/auth/register` | `{ name, email, password }` | `{ user: { name, email } }` |
| POST | `/api/auth/login` | `{ email, password }` | `{ user: { name, email } }` |
| POST | `/api/contact` | `{ name, email, message }` | `{ ok: true }` |

Khi lỗi, trả mã HTTP 4xx/5xx kèm `{ "code": "exists" }` (email đã đăng ký) hoặc `{ "code": "invalid" }` (sai email/mật khẩu).

## Kiểm thử và ESLint

| Nơi | Công cụ | Nội dung kiểm tra |
|---|---|---|
| `shared/` | `node --test` | Mọi khóa đều có đủ 3 bản dịch, giá, định dạng tiền |
| `web/` | **ESLint 9** (React + React Hooks) | Lỗi cú pháp, biến thừa, sai quy tắc Hooks, thiếu `key` |
| `web/` | **Vitest + Testing Library** (giả lập trình duyệt jsdom) | Test API; test **giao diện**: đổi ngôn ngữ, điều hướng, tiêu đề trang, bảng giá theo năm, mọi trang có đúng 1 `h1` và không lộ khóa dịch ở cả 3 ngôn ngữ, biểu mẫu Đăng ký / Đăng nhập / Liên hệ, trang Trải nghiệm |
| `mobile/` | **ESLint 9** | Như web |
| `mobile/` | **Jest + React Native Testing Library** (`jest-expo`) | Test giao diện: trang chủ, đổi ngôn ngữ, bảng giá, trang Trải nghiệm, đăng ký |

Test giao diện thao tác như người dùng thật (bấm nút, gõ chữ, tìm phần tử theo vai trò và nhãn) chứ không chỉ kiểm tra hàm, nên cũng kiểm tra được khả năng truy cập (nhãn ô nhập, tên nút, vùng điều hướng).

Các cảnh báo (warning) của ESLint chỉ hiện ra, không làm CI đỏ. Chỉ **lỗi (error)** mới làm CI thất bại.

## CI/CD

- **CI** (`ci.yml`) chạy khi đẩy code hoặc mở Pull Request: test nội dung dùng chung, kiểm tra đã đồng bộ; với web: **ESLint, test API + giao diện, build**; với mobile: **ESLint, test giao diện, đóng gói JavaScript**.
- **CD web** (`cd-web.yml`): khi có commit vào `main`, lint, test, build rồi đưa lên GitHub Pages. Bật trước: Settings, Pages, Source chọn **GitHub Actions**. Web dùng `HashRouter` nên chạy được ở địa chỉ con của GitHub Pages.
- **CD mobile** (`cd-mobile.yml`): khi gắn tag `mobile-v1.0.0` (hoặc bấm chạy tay), build APK bằng EAS. Cần tài khoản Expo, secret `EXPO_TOKEN`, và chạy `npx eas init` một lần trong `mobile/`.

## Lưu ý phiên bản

Dự án mobile ghim theo Expo SDK 51. Nếu muốn dùng SDK mới hơn, chạy `npx expo install --fix` trong `mobile/` để Expo tự chỉnh phiên bản các thư viện cho khớp.
