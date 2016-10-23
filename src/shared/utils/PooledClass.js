/**
 * Copyright 2013-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @providesModule PooledClass
 * @flow
 */

'use strict';

var invariant = require('invariant');

/**
 * Static poolers. If Pooler has instance that recycle instance but
 * Pooler hasn`t instance that create instance.
 * The argumentsPooler handle instance regardless of arguments length.
 */

var slice = Array.prototype.slice;
var bind = Function.prototype.bind;
var argumentsPooler = function() {
  var Klass = this;
  if (Klass.instancePool.length) {
    var instance = Klass.instancePool.pop();
    Klass.apply(instance, arguments);
    return instance;
  } else {
    var param = slice.call(arguments);
    param.unshift(Klass);
    return new (bind.apply(Klass, param));
  }
};

var standardReleaser = function(instance) {
  var Klass = this;
  invariant(
    instance instanceof Klass,
    'Trying to release an instance into a pool of a different type.'
  );
  instance.destructor();
  if (Klass.instancePool.length < Klass.poolSize) {
    Klass.instancePool.push(instance);
  }
};

var DEFAULT_POOL_SIZE = 10;
var DEFAULT_POOLER = argumentsPooler;

type Pooler = any;

/**
 * Augments `CopyConstructor` to be a poolable class, augmenting only the class
 * itself (statically) not adding any prototypical fields. Any CopyConstructor
 * you give this may have a `poolSize` property, and will look for a
 * prototypical `destructor` on instances.
 *
 * @param {Function} CopyConstructor Constructor that can be used to reset.
 * @param {Function} pooler Customizable pooler.
 */
var addPoolingTo = function<T>(
  CopyConstructor: Class<T>,
  pooler: Pooler,
): Class<T> & {
  getPooled(/* arguments of the constructor */): T;
  release(): void;
} {
  // Casting as any so that flow ignores the actual implementation and trusts
  // it to match the type we declared
  var NewKlass = (CopyConstructor: any);
  NewKlass.instancePool = [];
  NewKlass.getPooled = pooler || DEFAULT_POOLER;
  if (!NewKlass.poolSize) {
    NewKlass.poolSize = DEFAULT_POOL_SIZE;
  }
  NewKlass.release = standardReleaser;
  return NewKlass;
};

var PooledClass = {
  addPoolingTo: addPoolingTo,
  argumentsPooler: (argumentsPooler: Pooler),
};

module.exports = PooledClass;
