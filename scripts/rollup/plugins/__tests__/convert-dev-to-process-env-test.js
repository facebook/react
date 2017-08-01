/**
 * Copyright (c) 2013-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */
/* eslint-disable quotes */
'use strict';

let babel = require('babel-core');
let convertDevToProcessEnv = require('../convert-dev-to-process-env');

function transform(input) {
  return babel.transform(input, {
    plugins: [convertDevToProcessEnv],
  }).code;
}

function compare(input, output) {
  var compiled = transform(input);
  expect(compiled).toEqual(output);
}

var oldEnv;

describe('convert-dev-to-process-env', () => {
  beforeEach(() => {
    oldEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = '';
  });

  afterEach(() => {
    process.env.NODE_ENV = oldEnv;
  });

  it('should convert __DEV__ expressions', () => {
    compare(
      '__DEV__ ? 1 : 0;',
      'process.env.NODE_ENV !== "production" ? 1 : 0;'
    );
  });

  it('should not modify process.env expressions', () => {
    compare(
      'process.env.NODE_ENV !== "production" ? 1 : 0;',
      'process.env.NODE_ENV !== "production" ? 1 : 0;'
    );
  });

  it('should replace __DEV__ in if', () => {
    compare(
      `
if (__DEV__) {
  console.log('foo')
}`,
      `
if (process.env.NODE_ENV !== 'production') {
  console.log('foo');
}`
    );
  });
});
