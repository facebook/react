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
  .dontMock('Object.create');

var create;

describe('Object.create', function() {

  beforeEach(function() {
    create = require('Object.create');
  });

  it('should throw when the prototype is null', function() {
    expect(function() {
      create(null);
    }).toThrow(
      'This create() implementation cannot create empty objects with create(null)'
    );
  });

  it('should throw when the prototype is not an object', function() {
    expect(function() {
      create(1);
    }).toThrow(
      'Object prototype may only be an Object'
    );
  });

  it('should throw when properties are given', function() {
    expect(function() {
      create({}, {});
    }).toThrow(
      'This create() implementation does not support assigning properties'
    );
  });

  it('should create an object that inherits from prototype', function() {
    var proto = {};
    var object = create(proto);

    proto.foo = 'bar';
    expect(object.foo).toBe('bar');
  });

});
