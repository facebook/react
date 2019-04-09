/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
/* eslint-disable quotes */
'use strict';

let babel = require('babel-core');
let devExpressionWithCodes = require('../transform-error-messages');

function transform(input, options = {}) {
  return babel.transform(input, {
    plugins: [[devExpressionWithCodes, options]],
  }).code;
}

let oldEnv;

describe('error transform', () => {
  beforeEach(() => {
    oldEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = '';
  });

  afterEach(() => {
    process.env.NODE_ENV = oldEnv;
  });

  it('should replace simple invariant calls', () => {
    expect(
      transform(`
import invariant from 'shared/invariant';
invariant(condition, 'Do not override existing functions.');
`)
    ).toMatchSnapshot();
  });

  it('should only add `ReactError` and `ReactErrorProd` once each', () => {
    expect(
      transform(`
import invariant from 'shared/invariant';
invariant(condition, 'Do not override existing functions.');
invariant(condition, 'Do not override existing functions.');
`)
    ).toMatchSnapshot();
  });

  it('should support invariant calls with args', () => {
    expect(
      transform(`
import invariant from 'shared/invariant';
invariant(condition, 'Expected %s target to be an array; got %s', foo, bar);
`)
    ).toMatchSnapshot();
  });

  it('should support invariant calls with a concatenated template string and args', () => {
    expect(
      transform(`
import invariant from 'shared/invariant';
invariant(condition, 'Expected a component class, ' + 'got %s.' + '%s', Foo, Bar);
`)
    ).toMatchSnapshot();
  });

  it('should correctly transform invariants that are not in the error codes map', () => {
    expect(
      transform(`
import invariant from 'shared/invariant';
invariant(condition, 'This is not a real error message.');
`)
    ).toMatchSnapshot();
  });

  it('should handle escaped characters', () => {
    expect(
      transform(`
import invariant from 'shared/invariant';
invariant(condition, 'What\\'s up?');
`)
    ).toMatchSnapshot();
  });

  it('should support noMinify option', () => {
    expect(
      transform(
        `
import invariant from 'shared/invariant';
invariant(condition, 'Do not override existing functions.');
`,
        {noMinify: true}
      )
    ).toMatchSnapshot();
  });
});
