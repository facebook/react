/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import {expect, test} from '@playwright/test';
import {encodeStore, type Store} from '../../lib/stores';
import {format} from 'prettier';

function isMonacoLoaded(): boolean {
  return (
    typeof window['MonacoEnvironment'] !== 'undefined' &&
    window['__MONACO_LOADED__'] === true
  );
}

function formatPrint(data: Array<string>): Promise<string> {
  return format(data.join(''), {parser: 'babel'});
}

const TEST_CASE_INPUTS = [
  {
    name: 'module-scope-use-memo',
    input: `
'use memo';
export default function TestComponent({ x }) {
  return <Button>{x}</Button>;
}`,
  },
  {
    name: 'module-scope-use-no-memo',
    input: `
'use no memo';
export default function TestComponent({ x }) {
  return <Button>{x}</Button>;
}`,
  },
  {
    name: 'use-memo',
    input: `
function TestComponent({ x }) {
  'use memo';
  return <Button>{x}</Button>;
}
const TestComponent2 = ({ x }) => {
  'use memo';
  return <Button>{x}</Button>;
};`,
  },
  {
    name: 'use-no-memo',
    input: `
const TestComponent = function() {
  'use no memo';
  return <Button>{x}</Button>;
};
const TestComponent2 = ({ x }) => {
  'use no memo';
  return <Button>{x}</Button>;
};`,
  },
  {
    name: 'todo-function-scope-does-not-beat-module-scope',
    input: `
'use no memo';
function TestComponent({ x }) {
  'use memo';
  return <Button>{x}</Button>;
}`,
  },
  {
    name: 'parse-typescript',
    input: `
function Foo() {
  const x = foo() as number;
  return <div>{x}</div>;
}
`,
    noFormat: true,
  },
  {
    name: 'parse-flow',
    input: `
// @flow
function useFoo(propVal: {+baz: number}) {
  return <div>{(propVal.baz as number)}</div>;
}
    `,
    noFormat: true,
  },
  {
    name: 'compilationMode-infer',
    input: `// @compilationMode:"infer"
function nonReactFn() {
  return {};
}
    `,
    noFormat: true,
  },
  {
    name: 'compilationMode-all',
    input: `// @compilationMode:"all"
function nonReactFn() {
  return {};
}
    `,
    noFormat: true,
  },
];

test('editor should open successfully', async ({page}) => {
  await page.goto(`/`, {waitUntil: 'networkidle'});
  await page.waitForFunction(isMonacoLoaded);
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
  await page.waitForFunction(isMonacoLoaded);

  // User input from hash compiles
  await page.screenshot({
    fullPage: true,
    path: 'test-results/01-compiles-from-hash.png',
  });
  const text =
    (await page.locator('.monaco-editor').nth(1).allInnerTexts()) ?? [];
  const output = await formatPrint(text);

  expect(output).not.toEqual('');
  expect(output).toMatchSnapshot('01-user-output.txt');
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
  await page.waitForFunction(isMonacoLoaded);

  // Reset button works
  page.on('dialog', dialog => dialog.accept());
  await page.getByRole('button', {name: 'Reset'}).click();
  await page.screenshot({
    fullPage: true,
    path: 'test-results/02-reset-button-works.png',
  });
  const text =
    (await page.locator('.monaco-editor').nth(1).allInnerTexts()) ?? [];
  const output = await formatPrint(text);

  expect(output).not.toEqual('');
  expect(output).toMatchSnapshot('02-default-output.txt');
});

TEST_CASE_INPUTS.forEach((t, idx) =>
  test(`playground compiles: ${t.name}`, async ({page}) => {
    const store: Store = {
      source: t.input,
    };
    const hash = encodeStore(store);
    await page.goto(`/#${hash}`, {waitUntil: 'networkidle'});
    await page.waitForFunction(isMonacoLoaded);
    await page.screenshot({
      fullPage: true,
      path: `test-results/03-0${idx}-${t.name}.png`,
    });

    const text =
      (await page.locator('.monaco-editor').nth(1).allInnerTexts()) ?? [];
    let output: string;
    if (t.noFormat) {
      output = text.join('');
    } else {
      output = await formatPrint(text);
    }

    expect(output).not.toEqual('');
    expect(output).toMatchSnapshot(`${t.name}-output.txt`);
  }),
);
