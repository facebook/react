/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

'use strict';

const ts = require('typescript');
const {wrap} = require('jest-snapshot-serializer-raw');
const tsTransformer = require('react-refresh/typescript').default;
const sharedTests = require('./testcases');

/**
 * @param {string} input
 */
function transform(input, options, co) {
  return wrap(
    ts.transpileModule(input, {
      compilerOptions: {
        target: ts.ScriptTarget.ESNext,
        jsx: ts.JsxEmit.Preserve,
        ...(co || {}),
      },
      fileName: 'test.jsx',
      transformers: {before: [tsTransformer(options)]},
    }).outputText,
  );
}

describe('ReactFreshTypeScriptTransformer', () => {
  for (const item of sharedTests) {
    it(item.name, () => {
      const cases = typeof item.cases === 'string' ? [item.cases] : item.cases;
      for (const code of cases) {
        expect(
          transform(code, {
            emitFullSignatures: true,
            ...(item.options && item.options.typescript),
          }),
        ).toMatchSnapshot();
      }
    });
  }
  it('should correctly compile when downgrade', () => {
    expect(
      transform(
        `
    import { useT } from 'path'
export function useA() {
    const data = useT()
    return data?.address ?? ''
}
`,
        {},
        {target: ts.ScriptTarget.ES2015},
      ),
    ).toMatchSnapshot();
  });
});
