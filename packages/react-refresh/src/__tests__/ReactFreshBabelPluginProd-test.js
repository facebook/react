/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

'use strict';

let babel = require('@babel/core');
let {wrap} = require('jest-snapshot-serializer-raw');
let freshPlugin = require('react-refresh/babel');

function transform(input, options = {}) {
  return wrap(
    babel.transform(input, {
      babelrc: false,
      configFile: false,
      plugins: [
        '@babel/syntax-jsx',
        '@babel/syntax-dynamic-import',
        freshPlugin,
        ...(options.plugins || []),
      ],
    }).code,
  );
}

describe('ReactFreshBabelPlugin Prod', () => {
  it('thorw error if environment is not development', () => {
    let error;
    try {
      transform(`function Hello() {}`);
    } catch (transformError) {
      error = transformError;
    }
    expect(error).toEqual(
      new Error(
        '[BABEL] unknown: React Refresh Babel transform should only be enabled ' +
          'in development environment. Instead, the environment is: "' +
          process.env.NODE_ENV +
          '". (While processing: "base$2")',
      ),
    );
  });
});
