/**
 * Copyright (c) 2013-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
'use strict';

const babelCore = require('babel-core');
const removeGetters = require('../remove-getters');

const babelOptions = {
  ast: false,
  babelrc: false,
  compact: false,
  plugins: [removeGetters],
};

function transform(input) {
  return babelCore.transform(input, babelOptions).code;
}

function compare(input, output) {
  const compiled = transform(input);
  expect(compiled).toEqual(output);
}

describe('remove-getters', () => {
  it('should remove getters', () => {
    compare(
      `const object = {
  get prop() {
    return variable;
  }
};`,
      `const object = {
  prop: variable
};`
    );
  });

  it('should not remove other methods or properties', () => {
    compare(
      `const object = {
  prop: 'foo',
  method() {
    return 'bar';
  }
};`,
      `const object = {
  prop: 'foo',
  method() {
    return 'bar';
  }
};`
    );
  });
});

it('should throw when finding getters in object property', () => {
  expect(() => {
    transform(
      `const object = {
get prop() {
  const foo = 'foo';
  return foo;
}
};`
    );
  }).toThrow();
});

it('should throw when finding getters in object property', () => {
  expect(() => {
    transform(
      `const obj = {
        log: ['a', 'b', 'c'],
        get latest() {
          if (this.log.length == 0) {
            return undefined;
          }
          return this.log[this.log.length - 1];
        }
      };`
    );
  }).toThrow();
});
