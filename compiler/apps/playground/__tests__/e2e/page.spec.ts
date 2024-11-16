/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import {expect, test} from '@playwright/test';
import {encodeStore, type Store} from '../../lib/stores';

function concat(data: Array<string>): string {
  return data.join('');
}

test('editor should open successfully', async ({page}) => {
  await page.goto(`/`, {waitUntil: 'networkidle'});
  await page.screenshot({
    fullPage: true,
    path: 'test-results/00-fresh-page.png',
  });
});
test('editor should compile from hash successfully', async ({page}) => {
  const store: Store = {
    source: `export default function TestComponent({ x }) {
      return <Button>{x}</Button>;
    }
    `,
  };
  const hash = encodeStore(store);
  await page.goto(`/#${hash}`, {waitUntil: 'networkidle'});

  // User input from hash compiles
  await page.screenshot({
    fullPage: true,
    path: 'test-results/01-compiles-from-hash.png',
  });
  const userInput =
    (await page.locator('.monaco-editor').nth(1).allInnerTexts()) ?? [];
  expect(concat(userInput)).toMatchSnapshot('user-output.txt');
});
test('reset button works', async ({page}) => {
  const store: Store = {
    source: `export default function TestComponent({ x }) {
      return <Button>{x}</Button>;
    }
    `,
  };
  const hash = encodeStore(store);
  await page.goto(`/#${hash}`, {waitUntil: 'networkidle'});

  // Reset button works
  page.on('dialog', dialog => dialog.accept());
  await page.getByRole('button', {name: 'Reset'}).click();
  await page.screenshot({
    fullPage: true,
    path: 'test-results/02-reset-button-works.png',
  });
  const defaultInput =
    (await page.locator('.monaco-editor').nth(1).allInnerTexts()) ?? [];
  expect(concat(defaultInput)).toMatchSnapshot('default-output.txt');
});
test('directives work', async ({page}) => {
  const store: Store = {
    source: `function useFoo(props) {
              'use no memo';
              const x = () => { };
              const y = function (a) { };
              return foo(props.x, x);
            }
            function Component() {
              const x = useFoo();
              return <div>{x}</div>;
            }
    `,
  };
  const hash = encodeStore(store);
  await page.goto(`/#${hash}`, {waitUntil: 'networkidle'});
  await page.screenshot({
    fullPage: true,
    path: 'test-results/03-simple-use-memo.png',
  });

  const useMemoOutput =
    (await page.locator('.monaco-editor').nth(1).allInnerTexts()) ?? [];
  expect(concat(useMemoOutput)).toMatchSnapshot('simple-use-memo-output.txt');
});
