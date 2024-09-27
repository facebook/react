/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import {expect, test} from '@playwright/test';
import {encodeStore, type Store} from '../../lib/stores';

const STORE: Store = {
  source: `export default function TestComponent({ x }) {
  return <Button>{x}</Button>;
}
`,
};
const HASH = encodeStore(STORE);

function concat(data: Array<string>): string {
  return data.join('');
}

test('editor should compile successfully', async ({page}) => {
  await page.goto(`/#${HASH}`, {waitUntil: 'networkidle'});
  await page.screenshot({
    fullPage: true,
    path: 'test-results/00-on-networkidle.png',
  });

  // User input from hash compiles
  await page.screenshot({
    fullPage: true,
    path: 'test-results/01-show-js-before.png',
  });
  const userInput =
    (await page.locator('.monaco-editor').nth(2).allInnerTexts()) ?? [];
  expect(concat(userInput)).toMatchSnapshot('user-input.txt');

  // Reset button works
  page.on('dialog', dialog => dialog.accept());
  await page.getByRole('button', {name: 'Reset'}).click();
  await page.screenshot({
    fullPage: true,
    path: 'test-results/02-show-js-after.png',
  });
  const defaultInput =
    (await page.locator('.monaco-editor').nth(2).allInnerTexts()) ?? [];
  expect(concat(defaultInput)).toMatchSnapshot('default-input.txt');
});
