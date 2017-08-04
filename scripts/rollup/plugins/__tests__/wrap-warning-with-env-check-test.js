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
let wrapWarningWithEnvCheck = require('../wrap-warning-with-env-check');

function transform(input) {
  return babel.transform(input, {
    plugins: [wrapWarningWithEnvCheck],
  }).code;
}

function compare(input, output) {
  var compiled = transform(input);
  expect(compiled).toEqual(output);
}

var oldEnv;

describe('wrap-warning-with-env-check', () => {
  beforeEach(() => {
    oldEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = '';
  });

  afterEach(() => {
    process.env.NODE_ENV = oldEnv;
  });

  it('should wrap warning calls', () => {
    compare(
      "warning(condition, 'a %s b', 'c');",
      "__DEV__ ? warning(condition, 'a %s b', 'c') : void 0;"
    );
  });

  it('should not wrap invariant calls', () => {
    compare(
      "invariant(condition, 'a %s b', 'c');",
      "invariant(condition, 'a %s b', 'c');"
    );
  });
});
