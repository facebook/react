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
      `if (condition) {
  warning('a %s b', 'c');
}`,
      `if (__DEV__ && condition) {
  warning('a %s b', 'c');
}`
    );
    compare(
      "warning('a %s b', 'c');",
      "__DEV__ ? warning('a %s b', 'c') : void 0;"
    );
  });

  it('should wrap warningWithoutStack calls', () => {
    compare(
      `if (condition) {
  warningWithoutStack('a %s b', 'c');
}`,
      `if (__DEV__ && condition) {
  warningWithoutStack('a %s b', 'c');
}`
    );
    compare(
      "warningWithoutStack('a %s b', 'c');",
      "__DEV__ ? warningWithoutStack('a %s b', 'c') : void 0;"
    );
  });

  it('should wrap lowPriorityWarning calls', () => {
    compare(
      `if (condition) {
  lowPriorityWarning('a %s b', 'c');
}`,
      `if (__DEV__ && condition) {
  lowPriorityWarning('a %s b', 'c');
}`
    );
    compare(
      "lowPriorityWarning('a %s b', 'c');",
      "__DEV__ ? lowPriorityWarning('a %s b', 'c') : void 0;"
    );
  });

  it('should wrap lowPriorityWarningWithoutStack calls', () => {
    compare(
      `if (condition) {
  lowPriorityWarningWithoutStack('a %s b', 'c');
}`,
      `if (__DEV__ && condition) {
  lowPriorityWarningWithoutStack('a %s b', 'c');
}`
    );
    compare(
      "lowPriorityWarningWithoutStack('a %s b', 'c');",
      "__DEV__ ? lowPriorityWarningWithoutStack('a %s b', 'c') : void 0;"
    );
  });

  it('should not wrap invariant calls', () => {
    compare(
      `if (condition) {
  invariant('a %s b', 'c');
}`,
      `if (condition) {
  invariant('a %s b', 'c');
}`
    );
  });
});
