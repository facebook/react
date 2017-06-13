/**
 * Copyright 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @emails react-core
 */

'use strict';

// Catch stray warnings
var env = jasmine.getEnv();
var callCount = 0;
var oldError = console.error;
var newError = function() {
  callCount++;
  oldError.apply(this, arguments);
};
console.error = newError;
env.beforeEach(() => {
  callCount = 0;
  jasmine.addMatchers({
    toBeReset() {
      return {
        compare(actual) {
          if (actual !== newError && !jasmine.isSpy(actual)) {
            return {
              pass: false,
              message: 'Test did not tear down console.error mock properly.',
            };
          }
          return {pass: true};
        },
      };
    },
    toNotHaveBeenCalled() {
      return {
        compare(actual) {
          return {
            pass: callCount === 0,
            message: 'Expected test not to warn. If the warning is expected, mock ' +
              "it out using spyOn(console, 'error'); and test that the " +
              'warning occurs.',
          };
        },
      };
    },
  });
});
env.afterEach(() => {
  expect(console.error).toBeReset();
  expect(console.error).toNotHaveBeenCalled();
});

const update = require(process.env.TEST_ENTRY);

describe('update', () => {
  // https://facebook.github.io/react/docs/update.html#simple-push
  it('should support simple push', () => {
    const array = [1, 2, 3];

    const newArray = update(array, {$push: [4]});
    expect(array).toEqual([1, 2, 3]);

    expect(newArray).toEqual([1, 2, 3, 4]);
  });

  // https://facebook.github.io/react/docs/update.html#nested-collections
  it('should support nested collections', () => {
    const collection = [1, 2, {a: [12, 17, 15]}];

    const newCollection = update(collection, {
      2: {a: {$splice: [[1, 1, 13, 14]]}},
    });
    expect(collection).toEqual([1, 2, {a: [12, 17, 15]}]);

    expect(newCollection).toEqual([1, 2, {a: [12, 13, 14, 15]}]);
  });

  // https://facebook.github.io/react/docs/update.html#updating-a-value-based-on-its-current-one
  it('should support updating a value based on its current one', () => {
    const obj = {a: 5, b: 3};

    const newObj = update(obj, {
      b: {
        $apply: function(x) {
          return x * 2;
        },
      },
    });
    expect(newObj).toEqual({a: 5, b: 6});

    const newObj2 = update(obj, {b: {$set: obj.b * 2}});
    expect(newObj2).toEqual({a: 5, b: 6});

    expect(obj).toEqual({a: 5, b: 3});
  });

  // https://facebook.github.io/react/docs/update.html#shallow-merge
  it('should support shallow merge', () => {
    const obj = {a: 5, b: 3};

    const newObj = update(obj, {$merge: {b: 6, c: 7}});
    expect(newObj).toEqual({a: 5, b: 6, c: 7});

    expect(obj).toEqual({a: 5, b: 3});
  });
});
