/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
/* eslint-disable quotes */
'use strict';

let babel = require('@babel/core');
let wrapWarningWithEnvCheck = require('../wrap-warning-with-env-check');

function transform(input) {
  return babel.transform(input, {
    plugins: [wrapWarningWithEnvCheck],
  }).code;
}

function compare(input, output) {
  const compiled = transform(input);
  expect(compiled).toEqual(output);
}

let oldEnv;

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
      "__DEV__ ? !condition ? warning(false, 'a %s b', 'c') : void 0 : void 0;"
    );
  });

  it('should wrap warningWithoutStack calls', () => {
    compare(
      "warningWithoutStack(condition, 'a %s b', 'c');",
      "__DEV__ ? !condition ? warningWithoutStack(false, 'a %s b', 'c') : void 0 : void 0;"
    );
  });

  it('should not wrap invariant calls', () => {
    compare(
      "invariant(condition, 'a %s b', 'c');",
      "invariant(condition, 'a %s b', 'c');"
    );
  });
});
