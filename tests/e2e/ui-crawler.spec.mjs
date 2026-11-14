// Browser-based smoke crawler. Run against an isolated TEST database, never production.
// Requires npm package @playwright/test in test runner and DUBCHEF_E2E_BASE_URL.
import { test, expect } from '@playwright/test';

const BASE = process.env.DUBCHEF_E2E_BASE_URL;
if (!BASE) throw new Error('DUBCHEF_E2E_BASE_URL is required; refusing to record a synthetic PASS');
const routes = ['/', '/features', '/demo', '/pricing', '/about', '/faq', '/contact',
  '/login', '/register', '/terms', '/privacy', '/guest', '/does-not-exist'];
const privateRoutes = ['/admin/dashboard', '/admin/users', '/admin/videos', '/admin/languages',
  '/admin/narrations', '/admin/subtitles', '/admin/feedback', '/admin/orders',
  '/admin/payments', '/admin/pricing', '/admin/qr', '/admin/audit', '/admin/profile'];
const placeholder = /(?:lorem ipsum|coming soon|hello@dubchef\.example|\bTODO\b)/i;

async function login(page, prefix) {
  const email = process.env[`${prefix}_EMAIL`];
  const password = process.env[`${prefix}_PASSWORD`];
  if (!email || !password) throw new Error(`${prefix}_EMAIL and ${prefix}_PASSWORD are required`);
  await page.goto(`${BASE}/#/login`);
  await page.locator('input[type="email"]').fill(email);
  await page.locator('input[type="password"]').first().fill(password);
  await page.locator('button[type="submit"]').click();
  await expect(page).not.toHaveURL(/#\/login(?:$|\?)/);
}

for (const role of ['guest','customer','admin']) {
  test.describe(`${role} route smoke`, () => {
    test(`all permitted routes have one h1 and no broken images (${role})`, async ({ page }) => {
      const consoleErrors = [];
      page.on('pageerror', error => consoleErrors.push(error.message));
      if (role !== 'guest') await login(page, role.toUpperCase());
      for (const route of routes) {
        await page.goto(`${BASE}/#${route}`);
        await expect(page.locator('main')).toHaveCount(1);
        await expect(page.locator('h1')).toHaveCount(1);
        const broken = await page.locator('img').evaluateAll(imgs => imgs.filter(i => i.complete && i.naturalWidth === 0).map(i => i.src));
        expect(broken, `${role} ${route} broken images`).toEqual([]);
        const badLinks = await page.locator('a').evaluateAll(links => links.filter(l => !l.getAttribute('href') || l.getAttribute('href') === '#').map(l => l.outerHTML));
        expect(badLinks, `${role} ${route} empty link`).toEqual([]);
        const text = await page.locator('body').innerText();
        expect(text, `${role} ${route} placeholder`).not.toMatch(placeholder);
      }
      expect(consoleErrors).toEqual([]);
    });
    test(`${role}: admin routes enforce access`, async ({ page }) => {
      if (role !== 'guest') await login(page, role.toUpperCase());
      for (const route of privateRoutes) {
        await page.goto(`${BASE}/#${route}`);
        await expect(page.locator('main')).toHaveCount(1);
        if (role !== 'admin') await expect(page.locator('.adm-gate')).toBeVisible();
        else await expect(page.locator('.adm-unified')).toBeVisible();
      }
    });
  });
}
