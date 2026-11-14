// payOS adapter: no secret is sent to browsers. All provider responses and callbacks
// are authenticated with the channel checksum key before changing a SQL order.
import { createHmac, timingSafeEqual } from 'node:crypto';

const PAYMENT_HOST = 'https://api-merchant.payos.vn';
const PAY_URL = /^https:\/\/pay\.payos\.vn\//;

function dataString(data) {
  return Object.keys(data).sort().map((key) => {
    let v = data[key];
    if (v == null || v === 'undefined' || v === 'null') v = '';
    if (Array.isArray(v)) v = JSON.stringify(v.map(item => {
      if (!item || typeof item !== 'object' || Array.isArray(item)) return item;
      return Object.fromEntries(Object.entries(item).sort(([a],[b]) => a.localeCompare(b)));
    }));
    return `${key}=${v}`;
  }).join('&');
}

export function signPayosData(data, key) {
  return createHmac('sha256', key).update(dataString(data)).digest('hex');
}
export function verifyPayosData(data, signature, key) {
  if (!data || typeof data !== 'object' || Array.isArray(data) || !/^[a-f0-9]{64}$/i.test(String(signature || ''))) return false;
  const actual = Buffer.from(signPayosData(data, key), 'hex');
  const received = Buffer.from(signature, 'hex');
  return actual.length === received.length && timingSafeEqual(actual, received);
}
export function signPaymentRequest({ amount, cancelUrl, description, orderCode, returnUrl }, key) {
  return signPayosData({ amount, cancelUrl, description, orderCode, returnUrl }, key);
}

function urlAllowed(value, local = false) {
  try {
    const u = new URL(value);
    return !u.username && !u.password && (u.protocol === 'https:' || (local && u.protocol === 'http:' && ['localhost', '127.0.0.1'].includes(u.hostname)));
  } catch { return false; }
}

export function createPayosGateway(config = process.env, transport = fetch) {
  const clientId = config.PAYOS_CLIENT_ID;
  const apiKey = config.PAYOS_API_KEY;
  const checksumKey = config.PAYOS_CHECKSUM_KEY;
  const returnUrl = config.PAYOS_RETURN_URL;
  const cancelUrl = config.PAYOS_CANCEL_URL;
  const local = config.NODE_ENV !== 'production';
  if (![clientId, apiKey, checksumKey].every(x => typeof x === 'string' && x.trim().length >= 8) ||
      !urlAllowed(returnUrl, local) || !urlAllowed(cancelUrl, local)) {
    throw new Error('payos_not_configured');
  }
  async function request(path, init = {}) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 12000);
    try {
      const response = await transport(PAYMENT_HOST + path, {
        ...init, signal: controller.signal,
        headers: {
          'Content-Type': 'application/json',
          'x-client-id': clientId,
          'x-api-key': apiKey,
        },
      });
      if (!response.ok) throw new Error([400, 409].includes(response.status) ? 'payment_request_rejected' : 'payment_gateway_unavailable');
      const data = await response.json();
      if (data.code !== '00' || !verifyPayosData(data.data, data.signature, checksumKey)) throw new Error('payment_gateway_invalid_response');
      return data.data;
    } finally { clearTimeout(timer); }
  }
  return {
    async createCheckout(order) {
      const amount = order.amountMinor;
      if (order.currency !== 'VND' || !Number.isSafeInteger(amount) || amount <= 0 || amount > 2000000000 ||
          !Number.isSafeInteger(order.id) || order.id < 1) throw new Error('payment_unsupported');
      const body = {
        orderCode: order.id,
        amount,
        description: `DC${order.id}`.slice(0, 9),
        returnUrl, cancelUrl,
      };
      body.signature = signPaymentRequest(body, checksumKey);
      let result;
      try { result = await request('/v2/payment-requests', { method: 'POST', body: JSON.stringify(body) }); }
      catch (error) {
        // Nếu khách tải lại trang, payOS có thể từ chối tạo lại cùng orderCode.
        // Chỉ tái sử dụng link trước đó sau khi GET từ payOS và kiểm tra chữ ký, số tiền và trạng thái.
        if (!['payment_gateway_unavailable', 'payment_request_rejected'].includes(error.message)) throw error;
        const old = await request(`/v2/payment-requests/${order.id}`);
        if (Number(old.orderCode) !== order.id || Number(old.amount) !== amount ||
            old.status !== 'PENDING' || !/^[a-zA-Z0-9]{8,80}$/.test(String(old.id || '')))
          throw new Error('payment_gateway_invalid_response');
        result = { orderCode:old.orderCode, amount:old.amount,
          checkoutUrl:`https://pay.payos.vn/web/${old.id}` };
      }
      if (Number(result.orderCode) !== order.id || Number(result.amount) !== amount || !PAY_URL.test(String(result.checkoutUrl))) {
        throw new Error('payment_gateway_invalid_response');
      }
      return { checkoutUrl: result.checkoutUrl, provider: 'payos', orderId: order.id };
    },
    verifyWebhook(body) {
      if (!body || !verifyPayosData(body.data, body.signature, checksumKey)) throw new Error('invalid_signature');
      return {
        success: body.success === true && body.code === '00' && body.data?.code === '00',
        orderCode: Number(body.data?.orderCode), amount: Number(body.data?.amount),
        currency: body.data?.currency,
        reference: String(body.data?.reference || ''),
      };
    },
  };
}
