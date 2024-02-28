import {test, expect} from '@playwright/test';

test('smoke test', async ({page}) => {
  const consoleErrors = [];
  page.on('console', msg => {
    const type = msg.type();
    if (type === 'warn' || type === 'error') {
      consoleErrors.push({type: type, text: msg.text()});
    }
  });
  const pageErrors = [];
  page.on('pageerror', error => {
    pageErrors.push(error.stack);
  });
  await page.goto('/');
  await expect(page.locator('h1')).toHaveText('Hello World');

  await expect(consoleErrors).toEqual([]);
  await expect(pageErrors).toEqual([]);
});
