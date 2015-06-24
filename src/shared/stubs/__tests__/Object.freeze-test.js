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

require('mock-modules')
  .dontMock('Object.freeze');

var freeze;

var runnerCanFreeze = false;
try {
  var obj = {foo: 'bar'};
  Object.freeze(obj);
  try {
    obj.foo = 'baz';
    runnerCanFreeze = obj.foo === 'bar';
  } catch (e) {
    if (e instanceof TypeError) {
      runnerCanFreeze = true;
    }
  }
} catch (x) {}

describe('Object.freeze', function() {

  beforeEach(function() {
    freeze = require('Object.freeze');
  });

  it('should not throw when the argument is an object', function() {
    expect(function() {
      freeze({});
    }).not.toThrow();
  });

  it('throws if the argument is not an object', function() {
    expect(function() {
      freeze(1);
    }).toThrow(
      'freeze can only be called an Object'
    );
  });

  it('should return the same object it is given', function() {
    var obj = {};

    var returnValue = freeze(obj);

    expect(returnValue).toBe(obj);
  });

  it('should freeze the object if the native Object.freeze can', function() {
    if ( !runnerCanFreeze ) {
      pending();
      return;
    }

    var obj = {foo: 'bar'};
    freeze(obj);
    try {
      obj.foo = 'baz';
    } catch (x) {}

    expect(obj.foo).toBe('bar');
  })

});
