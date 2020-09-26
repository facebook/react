/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

'use strict';

const babel = require('@babel/core');
const {wrap} = require('jest-snapshot-serializer-raw');
const freshPlugin = require('react-refresh/babel');
const sharedTests = require('./testcases');

function transform(input, options = {}) {
  return wrap(
    babel.transform(input, {
      babelrc: false,
      configFile: false,
      envName: options.envName,
      plugins: [
        '@babel/syntax-jsx',
        '@babel/syntax-dynamic-import',
        [
          freshPlugin,
          {
            skipEnvCheck:
              options.skipEnvCheck === undefined ? true : options.skipEnvCheck,
            // To simplify debugging tests:
            emitFullSignatures: true,
            ...options.freshOptions,
          },
        ],
        ...(options.plugins || []),
      ],
    }).code,
  );
}

describe('ReactFreshBabelPlugin', () => {
  for (const item of sharedTests) {
    it(item.name, () => {
      const cases = typeof item.cases === 'string' ? [item.cases] : item.cases;
      for (const code of cases) {
        expect(
          transform(code, item.options && item.options.babel),
        ).toMatchSnapshot();
      }
    });
  }
  // This test is babel only so leave it here
  it("respects Babel's envName option", () => {
    const envName = 'random';
    expect(() =>
      transform(`export default function BabelEnv () { return null };`, {
        envName,
        skipEnvCheck: false,
      }),
    ).toThrowError(
      'React Refresh Babel transform should only be enabled in development environment. ' +
        'Instead, the environment is: "' +
        envName +
        '". If you want to override this check, pass {skipEnvCheck: true} as plugin options.',
    );
  });
});
