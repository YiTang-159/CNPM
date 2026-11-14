/** Destructive price edit restricted to a disposable dedicated QA database. */
import { test, expect } from '@playwright/test';
const BASE=process.env.DUBCHEF_E2E_BASE_URL;
if (!BASE) throw new Error('DUBCHEF_E2E_BASE_URL required.');
if (process.env.DUBCHEF_E2E_ISOLATED !== '1')
  throw new Error('Price-write test requires DUBCHEF_E2E_ISOLATED=1 and a disposable SQL database.');
async function login(page,role) {
  const email=process.env[role+'_EMAIL'],password=process.env[role+'_PASSWORD'];
  if (!email || !password) throw new Error(`${role}_EMAIL and ${role}_PASSWORD are required`);
  await page.goto(BASE+'/#/login');
  await page.locator('#l-email').fill(email);
  await page.locator('#l-pass').fill(password);
  await page.locator('button[type="submit"]').click();
  await expect(page).not.toHaveURL(/#\/login/);
}
test('SQL price update reaches another logged-in browser without manual reload',async ({browser})=>{
 const admin=await browser.newContext(); const customer=await browser.newContext();
 const a=await admin.newPage(),u=await customer.newPage();
 try {
  await login(a,'ADMIN');await login(u,'CUSTOMER');
  await u.goto(BASE+'/#/pricing');
  await u.locator('#pc-up').fill('1'); await u.locator('#pc-out').fill('1');
  await expect(u.locator('[data-testid="pc-total"]')).toBeVisible();
  const initial=await u.locator('[data-testid="pc-total"]').innerText();
  await a.goto(BASE+'/#/admin/pricing');
  const input=a.getByLabel('Giá / video tải lên (đơn vị nhỏ nhất)');
  await expect(input).toBeVisible();
  const original=Number(await input.inputValue());
  if(original!==20000) throw new Error('Dedicated test DB needs VND seed at 20000; refusing to change other pricing.');
  a.on('dialog',d=>d.accept());
  try {
   await input.fill('25000');
   await a.getByLabel('Lý do thay đổi giá').fill('QA test: kiểm tra đồng bộ hai phiên');
   await a.getByRole('button',{name:'Lưu giá'}).click();
   await expect(a.getByText('Đã cập nhật SQL Server.',{exact:false})).toBeVisible();
   // The existing customer tab is neither reloaded nor navigated; polling refreshes every 10s.
   await expect.poll(()=>u.locator('[data-testid="pc-total"]').innerText(),{timeout:20000})
     .not.toBe(initial);
   await expect(u.getByText('Giá đã được cập nhật.',{exact:false})).toBeVisible();
  } finally {
   // Revert only in the isolated QA DB; do not leave the price changed by a test.
   if (await input.isVisible().catch(()=>false)) {
    await input.fill(String(original));
    await a.getByLabel('Lý do thay đổi giá').fill('QA rollback giá về seed');
    await a.getByRole('button',{name:'Lưu giá'}).click();
   }
  }
 } finally {await admin.close();await customer.close();}
});
