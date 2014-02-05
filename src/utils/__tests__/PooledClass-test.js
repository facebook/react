/**
 * Copyright 2014 Facebook, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
 * @emails react-core
 */

"use strict";

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
