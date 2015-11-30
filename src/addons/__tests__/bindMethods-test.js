/**
 * Copyright 2013-2015, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @emails react-core
 */

'use strict';

var bindMethods = require('bindMethods');

describe('#bindMethods', function () {
  beforeEach(function () {
    this.object = {
      count: 1,

      increment() {
        this.count++;
      },

      decrement() {
        this.count--;
      }
    };
  });

  it('craches without binding', function () {
    const {increment, decrement} = this.object;

    expect(() => increment()).toThrow("Cannot read property 'count' of undefined");
    expect(() => decrement()).toThrow("Cannot read property 'count' of undefined");
  });

  it('binds the object correctly', function () {
    bindMethods(this.object, ['increment', 'decrement']);
    const {increment, decrement} = this.object;

    increment(); // +1
    expect(this.object.count).toBe(2);

    decrement(); // -1
    expect(this.object.count).toBe(1);
  });
});
