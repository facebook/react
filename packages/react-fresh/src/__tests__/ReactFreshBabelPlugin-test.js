/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

'use strict';

let babel = require('babel-core');
let freshPlugin = require('react-fresh/babel');

function transform(input, options = {}) {
  return babel.transform(input, {
    plugins: [[freshPlugin]],
  }).code;
}

describe('ReactFreshBabelPlugin', () => {
  it('hello world', () => {
    expect(transform(`hello()`)).toMatchSnapshot();
  });
});
