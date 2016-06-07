/**
 * Copyright (c) 2013-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */
'use strict';

var evalToString = require('../evalToString');
var babel = require('babel-core');

var parse = (source) => babel.transform(
  `invariant(${source});`
).ast.program.body[0].expression.arguments[0]; // quick way to get an exp node

var parseAndEval = (source) => evalToString(parse(source));

describe('evalToString', () => {
  it('should support StringLiteral', () => {
    expect(parseAndEval(`'foobar'`)).toBe('foobar');
    expect(parseAndEval(`'yowassup'`)).toBe('yowassup');
  });

  it('should support string concat (`+`)', () => {
    expect(parseAndEval(`'foo ' + 'bar'`)).toBe('foo bar');
  });

  it('should support string concat (`+`) with implicit casting', () => {
    expect(parseAndEval(`'foo ' + true`)).toBe('foo true');
    expect(parseAndEval(`'foo ' + 3`)).toBe('foo 3');
    expect(parseAndEval(`'foo ' + null`)).toBe('foo null');
    expect(parseAndEval(`'foo ' + undefined`)).toBe('foo undefined');
  });
});
