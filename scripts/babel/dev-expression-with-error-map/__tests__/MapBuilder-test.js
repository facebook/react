/**
 * Copyright (c) 2013-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */
'use strict';

var MapBuilder = require('../MapBuilder');

describe('MapBuilder', () => {
  it('should generate an empty map if nothing has happened', () => {
    var mb = new MapBuilder();
    expect(mb.generate()).toEqual({});
  });

  it('should reset correctly', () => {
    var mb = new MapBuilder();
    mb.add('foo');
    mb.add('bar');
    mb.reset();
    mb.add('so wrong');

    expect(mb.generate()).toEqual({
      0: 'so wrong',
    });
  });

  it('should generate maps correctly', () => {
    var mb = new MapBuilder();
    var testCases = [
      'foo is wrong',
      'bar is also wrong',
      'everything is wrong',
    ];

    testCases.forEach((errorMsg) => {
      mb.add(errorMsg);
    });

    expect(mb.generate()).toEqual({
      0: 'foo is wrong',
      1: 'bar is also wrong',
      2: 'everything is wrong',
    });
  });

  it('should establish an one-to-one mapping', () => {
    var mb = new MapBuilder();
    var testCases = [
      'foo is wrong',
      'foo is wrong',
      'foo is wrong',
      'bar is also wrong',
      'foo is wrong',
      'bar is also wrong',
      'bar is also wrong',
      'foo is wrong',
      'everything is wrong',
      'bar is also wrong',
      'everything is wrong',
      'everything is wrong',
      'foo is wrong',
      'bar is also wrong',
    ];

    testCases.forEach((errorMsg) => {
      mb.add(errorMsg);
    });

    expect(mb.generate()).toEqual({
      0: 'foo is wrong',
      1: 'bar is also wrong',
      2: 'everything is wrong',
    });
  });

  it('should return correct ids while adding items', () => {
    var mb = new MapBuilder();
    var testCases = [
      'foo is wrong',
      'foo is wrong',
      'foo is wrong',
      'bar is also wrong',
      'foo is wrong',
      'bar is also wrong',
      'bar is also wrong',
      'foo is wrong',
      'everything is wrong',
      'bar is also wrong',
      'everything is wrong',
      'everything is wrong',
      'foo is wrong',
      'bar is also wrong',
    ];

    var expectedStrToIdMapping = {
      'foo is wrong': '0',
      'bar is also wrong': '1',
      'everything is wrong': '2',
    };

    testCases.forEach((errorMsg) => {
      expect(mb.add(errorMsg)).toBe(expectedStrToIdMapping[errorMsg]);
    });
  });
});
