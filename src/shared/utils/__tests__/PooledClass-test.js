/**
 * Copyright 2014-2015, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @emails react-core
 */

'use strict';

var PooledClass;
var PoolableClass;

describe('Pooled class', function() {
  beforeEach(function() {
    PooledClass = require('PooledClass');
    PoolableClass = function() {};
    PooledClass.addPoolingTo(PoolableClass);
  });

  it('should initialize a pool correctly', function() {
    expect(PoolableClass.instancePool).toBeDefined();
  });

  it('should return a new instance when the pool is empty', function() {
    var instance = PoolableClass.getPooled();
    expect(instance instanceof PoolableClass).toBe(true);
  });

  it('should return the instance back into the pool when it gets released',
    function() {
      var instance = PoolableClass.getPooled();
      PoolableClass.release(instance);
      expect(PoolableClass.instancePool.length).toBe(1);
      expect(PoolableClass.instancePool[0]).toBe(instance);
    }
  );

  it('should return an old instance if available in the pool', function() {
    var instance = PoolableClass.getPooled();
    PoolableClass.release(instance);
    var instance2 = PoolableClass.getPooled();
    expect(instance).toBe(instance2);
  });

  it('should call the destructor when instance gets released', function() {
    var log = [];
    var PoolableClassWithDestructor = function() {};
    PoolableClassWithDestructor.prototype.destructor = function() {
      log.push('released');
    };
    PooledClass.addPoolingTo(PoolableClassWithDestructor);
    var instance = PoolableClassWithDestructor.getPooled();
    PoolableClassWithDestructor.release(instance);
    expect(log).toEqual(['released']);
  });

  it('should accept poolers with different arguments', function() {
    var log = [];
    var PoolableClassWithMultiArguments = function(a, b) {
      log.push(a, b);
    };
    PooledClass.addPoolingTo(
      PoolableClassWithMultiArguments,
      PooledClass.twoArgumentPooler
    );
    PoolableClassWithMultiArguments.getPooled('a', 'b', 'c');
    expect(log).toEqual(['a', 'b']);
  });

  it('should call a new constructor with arguments', function() {
    var log = [];
    var PoolableClassWithOneArgument = function(a) {
      log.push(a);
    };
    PooledClass.addPoolingTo(
      PoolableClassWithOneArgument
    );
    PoolableClassWithOneArgument.getPooled('new');
    expect(log).toEqual(['new']);
  });

  it('should call an old constructor with arguments', function() {
    var log = [];
    var PoolableClassWithOneArgument = function(a) {
      log.push(a);
    };
    PooledClass.addPoolingTo(
      PoolableClassWithOneArgument
    );
    var instance = PoolableClassWithOneArgument.getPooled('new');
    PoolableClassWithOneArgument.release(instance);
    PoolableClassWithOneArgument.getPooled('old');
    expect(log).toEqual(['new', 'old']);
  });

  it('should throw when the class releases an instance of a different type',
    function() {
      var RandomClass = function() {};
      PooledClass.addPoolingTo(RandomClass);
      var randomInstance = RandomClass.getPooled();
      PoolableClass.getPooled();
      expect(function() {
        PoolableClass.release(randomInstance);
      }).toThrow(
        'Invariant Violation: Trying to release an instance into a pool ' +
        'of a different type.'
      );
    }
  );
});
