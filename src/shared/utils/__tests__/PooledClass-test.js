/**
 * Copyright 2014-present, Facebook, Inc.
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

describe('Pooled class', () => {
  beforeEach(() => {
    PooledClass = require('PooledClass');
    PoolableClass = function() {};
    PoolableClass.prototype.destructor = function() {};
    PooledClass.addPoolingTo(PoolableClass);
  });

  it('should initialize a pool correctly', () => {
    expect(PoolableClass.instancePool).toBeDefined();
  });

  it('should return a new instance when the pool is empty', () => {
    var instance = PoolableClass.getPooled();
    expect(instance instanceof PoolableClass).toBe(true);
  });

  it('should return the instance back into the pool when it gets released',
    () => {
      var instance = PoolableClass.getPooled();
      PoolableClass.release(instance);
      expect(PoolableClass.instancePool.length).toBe(1);
      expect(PoolableClass.instancePool[0]).toBe(instance);
    }
  );

  it('should return an old instance if available in the pool', () => {
    var instance = PoolableClass.getPooled();
    PoolableClass.release(instance);
    var instance2 = PoolableClass.getPooled();
    expect(instance).toBe(instance2);
  });

  it('should call the destructor when instance gets released', () => {
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

  it('should accept poolers with different arguments', () => {
    var log = [];
    var PoolableClassWithMultiArguments = function(a, b) {
      log.push(a, b);
    };
    PoolableClassWithMultiArguments.prototype.destructor = function() {};
    PooledClass.addPoolingTo(
      PoolableClassWithMultiArguments,
      PooledClass.twoArgumentPooler
    );
    PoolableClassWithMultiArguments.getPooled('a', 'b', 'c');
    expect(log).toEqual(['a', 'b']);
  });

  it('should call a new constructor with arguments', () => {
    var log = [];
    var PoolableClassWithOneArgument = function(a) {
      log.push(a);
    };
    PoolableClassWithOneArgument.prototype.destructor = function() {};
    PooledClass.addPoolingTo(
      PoolableClassWithOneArgument
    );
    PoolableClassWithOneArgument.getPooled('new');
    expect(log).toEqual(['new']);
  });

  it('should call an old constructor with arguments', () => {
    var log = [];
    var PoolableClassWithOneArgument = function(a) {
      log.push(a);
    };
    PoolableClassWithOneArgument.prototype.destructor = function() {};
    PooledClass.addPoolingTo(
      PoolableClassWithOneArgument
    );
    var instance = PoolableClassWithOneArgument.getPooled('new');
    PoolableClassWithOneArgument.release(instance);
    PoolableClassWithOneArgument.getPooled('old');
    expect(log).toEqual(['new', 'old']);
  });

  it('should throw when the class releases an instance of a different type',
    () => {
      var RandomClass = function() {};
      RandomClass.prototype.destructor = function() {};
      PooledClass.addPoolingTo(RandomClass);
      var randomInstance = RandomClass.getPooled();
      PoolableClass.getPooled();
      expect(function() {
        PoolableClass.release(randomInstance);
      }).toThrowError(
        'Trying to release an instance into a pool of a different type.'
      );
    }
  );

  it('should throw if no destructor is defined', () => {
    var ImmortalClass = function() {};
    PooledClass.addPoolingTo(ImmortalClass);
    var inst = ImmortalClass.getPooled();
    expect(function() {
      ImmortalClass.release(inst);
    }).toThrow();
  });
});
