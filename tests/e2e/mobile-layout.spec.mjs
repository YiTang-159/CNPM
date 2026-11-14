/** Real browser tests; intentionally require a live environment. Never mock successful backend calls. */
import { test, expect, devices } from '@playwright/test';
const BASE = process.env.DUBCHEF_E2E_BASE_URL;
if (!BASE) throw new Error('Set DUBCHEF_E2E_BASE_URL to a running TEST deployment (no simulated PASS).');
const viewports = [
  ['iPhone-390', devices['iPhone 13'].viewport, true],
  ['Pixel-393', devices['Pixel 7'].viewport, true],
  ['small-360', {width:360,height:640}, true],
  ['tablet-768', {width:768,height:1024}, false],
];
for (const [name,viewport,mobile] of viewports) {
  test(`${name}: navigation and content never overflow browser`, async ({browser}) => {
    const context = await browser.newContext({viewport, isMobile:mobile, hasTouch:mobile});
    const page=await context.newPage();
    try {
      for (const route of ['/', '/demo', '/pricing', '/contact', '/guest']) {
        await page.goto(`${BASE}/#${route}`);
        await expect(page.locator('main')).toBeVisible();
        const overflow = await page.evaluate(() => ({
          scroll:document.documentElement.scrollWidth, viewport:innerWidth,
        }));
        expect(overflow.scroll, `${name} ${route} horizontal overflow`).toBeLessThanOrEqual(overflow.viewport+2);
        if (mobile) {
          const tabs=page.locator('.mobile-bottom-tabs');
          await expect(tabs).toBeVisible();
          const bounds=await tabs.boundingBox();
          expect(bounds, `${name} ${route}: tabs missing`).not.toBeNull();
          expect(bounds.y+bounds.height, `${name} ${route}: tabs beyond viewport`).toBeLessThanOrEqual(viewport.height+2);
        }
      }
      if (mobile) {
        await page.locator('.mobile-bottom-tabs a[href$="/pricing"]').click();
        await expect(page).toHaveURL(/#\/pricing/);
      }
    } finally { await context.close(); }
  });
}
