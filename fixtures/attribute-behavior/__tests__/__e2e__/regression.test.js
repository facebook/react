import {test, expect} from '@playwright/test';

test(
  'AttributeTableSnapshot is unchanged',
  async ({page}) => {
    test.setTimeout(1 * 60_000);
    await page.goto('/');

    await expect(page).toHaveTitle('Ready', {timeout: 1 * 60_000});

    const downloadPromise = page.waitForEvent('download');
    await page.getByText('Save latest results to a file').click();
    const download = await downloadPromise;

    await download.saveAs('AttributeTableSnapshot.md');
  },
  {timeout: 6 * 60_000}
);
