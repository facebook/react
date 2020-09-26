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
function transform(input, options) {
  return wrap(
    ts.transpileModule(input, {
      compilerOptions: {
        target: ts.ScriptTarget.ESNext,
        jsx: ts.JsxEmit.Preserve,
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
          transform(code, item.options && item.options.typescript),
        ).toMatchSnapshot();
      }
    });
  }
});
