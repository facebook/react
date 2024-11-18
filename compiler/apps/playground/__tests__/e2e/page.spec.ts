/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import {expect, test} from '@playwright/test';
import {encodeStore, type Store} from '../../lib/stores';
import {format} from 'prettier';

test.describe.configure({mode: 'parallel'});

function print(data: Array<string>): Promise<string> {
  return format(data.join(''), {parser: 'babel'});
}
const DIRECTIVE_TEST_CASES = [
  {
    name: 'module-scope-use-memo',
    input: `'use memo';

export default function TestComponent({ x }) {
  return <Button>{x}</Button>;
}`,
  },
  {
    name: 'module-scope-use-no-memo',
    input: `'use no memo';

export default function TestComponent({ x }) {
  return <Button>{x}</Button>;
}`,
  },
  {
    name: 'function-scope-use-memo-function-declaration',
    input: `function TestComponent({ x }) {
  'use memo';
  return <Button>{x}</Button>;
}`,
  },
  {
    name: 'function-scope-use-no-memo-function-expression',
    input: `const TestComponent = function() {
  'use no memo';
  return <Button>{x}</Button>;
};`,
  },
  {
    name: 'function-scope-use-memo-arrow-function-expression',
    input: `const TestComponent = ({ x }) => {
  'use memo';
  return <Button>{x}</Button>;
};`,
  },
  {
    name: 'module-scope-use-no-memo-function-expression',
    input: `'use no memo';

const TestComponent = function({ x }) {
  return <Button>{x}</Button>;
};`,
  },
  {
    name: 'function-scope-no-directive-arrow-function-expression',
    input: `
const TestComponent = ({ x }) => {
'use no memo';
  return <Button>{x}</Button>;
};`,
  },
  {
    name: 'function-scope-use-no-memo-function-declaration',
    input: `'use no memo';

function TestComponent({ x}) {
  'use memo';
  return <Button>{x}</Button>;
}`,
  },
];
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
  expect(await print(userInput)).toMatchSnapshot('01-user-output.txt');
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
  expect(await print(defaultInput)).toMatchSnapshot('02-default-output.txt');
});
DIRECTIVE_TEST_CASES.forEach((t, idx) =>
  test(`directives work: ${t.name}`, async ({page}) => {
    const store: Store = {
      source: t.input,
    };
    const hash = encodeStore(store);
    await page.goto(`/#${hash}`, {waitUntil: 'networkidle'});
    await page.screenshot({
      fullPage: true,
      path: `test-results/03-0${idx}-${t.name}.png`,
    });

    const useMemoOutput =
      (await page.locator('.monaco-editor').nth(1).allInnerTexts()) ?? [];
    expect(await print(useMemoOutput)).toMatchSnapshot(`${t.name}-output.txt`);
  }),
);
