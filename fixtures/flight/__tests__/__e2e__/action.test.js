// @ts-check

import {test, expect} from '@playwright/test';

test('action returning client component with deduped references', async ({
  page,
}) => {
  const pageErrors = [];

  page.on('pageerror', error => {
    pageErrors.push(error.stack);
  });

  await page.goto('/');

  const button = await page.getByRole('button', {
    name: 'Return element from action',
  });

  await button.click();

  await expect(
    page.getByTestId('temporary-references-action-result')
  ).toHaveText('Hello');

  // Click the button one more time to send the previous result (i.e. the
  // returned element) back to the server.
  await button.click();

  await expect(pageErrors).toEqual([]);

  await expect(
    page.getByTestId('temporary-references-action-result')
  ).toHaveText('HelloHello');
});
