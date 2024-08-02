import {test, expect} from '@playwright/test';

test('action returning client component with deduped references', async ({
  page,
}) => {
  const errors = [];

  page.on('console', msg => {
    if (msg.type() === 'error') {
      errors.push(msg.text());
    }
  });

  page.on('pageerror', error => {
    errors.push(error.stack);
  });

  await page.goto('/');

  const button = await page.getByRole('button', {
    name: 'Return element from action',
  });

  await button.click();

  await expect(page.getByTestId('form')).toContainText('Hello');

  // Click the button one more time to send the previous result (i.e. the
  // returned element) back to the server.
  await button.click();

  await expect(errors).toEqual([]);

  await expect(page.getByTestId('form')).toContainText('HelloHello');
});
