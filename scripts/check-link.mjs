#!/usr/bin/env node
// Kiểm tra từng mắt xích: web/.env -> API -> SQL Server -> CORS, rồi nói rõ chỗ nào đứt.
// Chạy ở thư mục gốc dự án:   npm run check:link
// Tuỳ chọn:  node scripts/check-link.mjs --api http://localhost:3000 --origin http://localhost:5173
// Chỉ ĐỌC: không tạo dữ liệu, không sửa file nào.
import { readFile } from 'node:fs/promises';
import { request } from 'node:http';
import { networkInterfaces } from 'node:os';

const arg = (name) => {
  const i = process.argv.indexOf('--' + name);
  return i > 0 ? process.argv[i + 1] : undefined;
};

async function readEnv(url) {
  try {
    const text = await readFile(url, 'utf8');
    const env = {};
    for (const line of text.split(/\r?\n/)) {
      const m = /^\s*([A-Z0-9_]+)\s*=\s*(.*?)\s*$/.exec(line);
      if (m) env[m[1]] = m[2].replace(/^["']|["']$/g, '');
    }
    return env;
  } catch {
    return null;
  }
}

const strip = (u) => (u || '').replace(/\/+$/, '');
const results = [];
const report = (ok, title, hint) => {
  results.push(ok);
  console.log(`${ok === true ? '[ OK ]' : ok === 'warn' ? '[ ?? ]' : '[LỖI ]'} ${title}`);
  if (hint) for (const line of [].concat(hint)) console.log('        ' + line);
};

/** Đổi lỗi mạng của fetch thành câu dễ hiểu. */
function networkHint(error, host) {
  const code = error?.cause?.code || error?.code || error?.name;
  if (code === 'ECONNREFUSED') {
    return ['Máy này tồn tại nhưng KHÔNG có chương trình nào nghe ở cổng đó: API chưa chạy hoặc đang khởi động lại.',
      'Kiểm tra:  docker compose ps   rồi   docker compose logs api --tail=50'];
  }
  if (code === 'ENOTFOUND') return ['Không phân giải được tên máy "' + host + '". Kiểm tra lại địa chỉ trong web/.env.'];
  if (code === 'TimeoutError' || code === 'ETIMEDOUT' || code === 'UND_ERR_CONNECT_TIMEOUT' || code === 'EHOSTUNREACH') {
    return ['Không tới được địa chỉ này (quá thời gian chờ). Thường do: sai IP, IP của máy đã đổi, tường lửa Windows chặn cổng 3000, hoặc khác mạng Wi-Fi.'];
  }
  return ['Lỗi mạng: ' + (code || String(error))];
}

async function call(url, options = {}) {
  try {
    const res = await fetch(url, { ...options, signal: AbortSignal.timeout(6000) });
    return { status: res.status, body: await res.json().catch(() => null) };
  } catch (error) {
    return { error };
  }
}

/** Gửi yêu cầu preflight như trình duyệt làm trước khi gọi API từ một địa chỉ web khác. */
function preflight(apiUrl, origin) {
  return new Promise((resolve) => {
    const u = new URL(apiUrl + '/api/auth/login');
    const req = request({
      hostname: u.hostname, port: u.port || 80, path: u.pathname, method: 'OPTIONS', timeout: 6000,
      headers: { Origin: origin, 'Access-Control-Request-Method': 'POST', 'Access-Control-Request-Headers': 'content-type,authorization' },
    }, (res) => { res.resume(); resolve({ status: res.statusCode, allow: res.headers['access-control-allow-origin'] }); });
    req.on('timeout', () => { req.destroy(); resolve({ error: 'timeout' }); });
    req.on('error', (error) => resolve({ error }));
    req.end();
  });
}

console.log('Dubchef: kiểm tra liên kết Web -> API -> SQL Server\n');

// 1) web/.env
const webEnv = await readEnv(new URL('../web/.env', import.meta.url));
const api = strip(arg('api') || webEnv?.VITE_API_URL);
if (!api) {
  report(false, 'web/.env chưa có VITE_API_URL',
    ['Khi thiếu biến này, web không gọi API và báo lỗi mạng.',
      'Tạo/sửa web/.env:  VITE_API_URL=http://localhost:3000   rồi TẮT và chạy lại "npm run dev" (Vite chỉ đọc .env lúc khởi động).']);
  process.exit(1);
}
report(true, 'web/.env trỏ tới API: ' + api + (arg('api') ? '  (lấy từ --api)' : ''));

let host;
try { host = new URL(api).hostname; } catch { report(false, 'VITE_API_URL không phải địa chỉ hợp lệ: ' + api); process.exit(1); }

// IP riêng không còn thuộc máy này (hay gặp khi router cấp IP mới)
const mine = Object.values(networkInterfaces()).flat().filter((i) => i && i.family === 'IPv4' && !i.internal).map((i) => i.address);
if (/^(10\.|192\.168\.|172\.(1[6-9]|2\d|3[01])\.)/.test(host) && mine.length && !mine.includes(host)) {
  report('warn', `Địa chỉ ${host} không phải IP hiện tại của máy này (IP hiện tại: ${mine.join(', ')})`,
    ['Nếu API chạy trên máy này thì IP đã đổi: sửa web/.env (và CORS_ORIGIN trong docker-compose.yml) sang IP mới,',
      'hoặc dùng http://localhost:3000 khi chỉ chạy trên một máy. Bỏ qua cảnh báo này nếu API nằm ở máy khác.']);
}

// 2) API sống?
const health = await call(api + '/api/health');
let apiUp = false;
if (health.error) {
  report(false, 'Không gọi được ' + api + '/api/health', networkHint(health.error, host));
} else if (health.status === 200 && health.body?.ok && health.body?.db) {
  apiUp = true;
  report(true, 'API đang chạy và báo đã nối được SQL Server (/api/health -> ok, db:true)');
} else if (health.status === 503 || health.body?.db === false) {
  apiUp = true;
  report(false, 'API chạy nhưng KHÔNG nối được SQL Server (/api/health -> 503)',
    ['Xem nguyên nhân:  docker compose logs db --tail=50   và   docker compose logs api --tail=50',
      'Hay gặp: "Login failed for user sa" (DB_PASSWORD không khớp mật khẩu đã tạo trong volume), SQL Server chưa khởi động xong.']);
} else {
  report(false, `/api/health trả về HTTP ${health.status} (không phải API Dubchef?)`,
    ['Có thể cổng 3000 đang bị chương trình khác chiếm. Kiểm tra:  docker compose ps']);
}

// 3) API đọc được dữ liệu SQL? (đăng nhập với tài khoản không tồn tại: phải ra 401, tuyệt đối không tạo dữ liệu)
if (apiUp) {
  const probe = await call(api + '/api/auth/login', {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'kiem-tra@lien-ket.invalid', password: 'khong-ton-tai' }),
  });
  if (probe.status === 401 && probe.body?.code === 'invalid') {
    report(true, 'API truy vấn được bảng NguoiDung trong SQL (đăng nhập thử bị từ chối đúng 401)');
  } else if (probe.status === 500) {
    report(false, 'API nhận request nhưng truy vấn SQL bị lỗi (HTTP 500)',
      ['Mở:  docker compose logs api --tail=50  và tìm "Invalid object name" / "Invalid column name" (cấu trúc bảng chưa khớp).']);
  } else {
    report('warn', `Đăng nhập thử trả về HTTP ${probe.status} ${JSON.stringify(probe.body)}`);
  }
}

// 4) CORS cho địa chỉ web
if (apiUp || !health.error) {
  const origins = [...new Set([arg('origin'), webEnv?.VITE_PUBLIC_URL, 'http://localhost:5173'].filter(Boolean).map(strip))];
  for (const origin of origins) {
    const r = await preflight(api, origin);
    if (r.error) report('warn', `Không kiểm tra được CORS cho ${origin}: ${r.error?.code || r.error}`);
    else if (r.allow === origin || r.allow === '*') report(true, `CORS cho phép web mở ở ${origin}`);
    else {
      report(false, `CORS CHẶN web mở ở ${origin}  (trình duyệt sẽ báo "blocked by CORS policy" / lỗi mạng)`,
        ['Thêm địa chỉ này vào CORS_ORIGIN (docker-compose.yml, mục api -> environment), ví dụ:',
          `CORS_ORIGIN: "http://localhost:5173,${origin}"`,
          'rồi chạy:  docker compose up -d --no-deps --build api   (chỉ khi bạn thực sự mở web bằng địa chỉ đó)']);
    }
  }
}

const bad = results.filter((r) => r === false).length;
console.log(bad ? `\nCó ${bad} mắt xích bị đứt. Sửa theo gợi ý ở dòng [LỖI ] đầu tiên (mắt xích trước sửa xong thì các lỗi sau thường tự hết).`
  : '\nCác mắt xích đều thông. Nếu web vẫn báo lỗi, mở F12 > Console/Network của trình duyệt và gửi dòng lỗi đỏ đầu tiên.');
process.exit(bad ? 1 : 0);
