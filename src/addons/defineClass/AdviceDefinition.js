/**
 * Copyright 2013 Facebook, Inc.
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
 * @providesModule AdviceDefinition
 */

'use strict';

// For more information on some of the terminology/variable names used in this
// file, see the Wikipedia page on aspect-oriented programming.
// http://en.wikipedia.org/wiki/Aspect-oriented_programming 

var Advice = require('Advice');
var ReactCompositeComponent = require('ReactCompositeComponent');
var SpecPolicy = ReactCompositeComponent.SpecPolicy;
var ReactCompositeComponentInterface = ReactCompositeComponent.Interface;

var invariant = require('invariant');
var mergeMethod = require('mergeMethod');

/**
 * These are shims to simulate pointcuts on ReactCompositeComponent which
 * correspond to its lifecycle. @see ReactCompositeComponent#LifeCycle.
 * Refactoring ReactCompositeComponent to actually use these methods names is
 * left as an exercise for the reader.
 * I apologize for the repetition. I apologize.
 */
var RESERVED_ADVICE_KEYS = {
  mount: function(joinPoint, callback) {
    invariant(
      joinPoint === 'before' ||
      joinPoint === 'after',
      'AdviceDefinition: The %s method is not supported for "mount"',
      joinPoint
    );
    switch (joinPoint) {
      case 'before':
        mergeMethod(this, 'componentWillMount', callback);
        break;
      case 'after':
        mergeMethod(this, 'componentDidMount', callback);
        break;
      default:
        break;
    }
  },

  receiveProps: function(joinPoint, callback) {
    invariant(
      joinPoint === 'before',
      'AdviceDefinition: The %s method is not supported for "receiveProps"',
      joinPoint
    );
    switch (joinPoint) {
      case 'before':
        mergeMethod(this, 'componentWillReceiveProps', callback);
        break;
      default:
        break;
    }
  },

  update: function(joinPoint, callback) {
    invariant(
      joinPoint === 'before' ||
      joinPoint === 'after' ||
      joinPoint === 'filter',
      'AdviceDefinition: The %s method is not supported for "update"',
      joinPoint
    );
    switch (joinPoint) {
      case 'before':
        mergeMethod(this, 'componentWillUpdate', callback);
        break;
      case 'after':
        mergeMethod(this, 'componentDidUpdate', callback);
        break;
      case 'filter':
        mergeMethod(this, 'shouldComponentUpdate', callback);
        break;
      default:
        break;
    }
  },

  unmount: function(joinPoint, callback) {
    invariant(
      joinPoint === 'before',
      'AdviceDefinition: The % method is not supported for "unmount"',
      joinPoint
    );
    switch (joinPoint) {
      case 'before':
        mergeMethod(this, 'componentWillUnmount', callback);
      default:
        break;
    }
  }
};

function validateAdvice(spec, joinPoint, methodName) {
  invariant(
    typeof spec[methodName] === 'function',
    'AdviceDefinition: You are attempting to use advice methods on %s, when ' +
    'its type is %s. Advice methods can only work on spec properties which' +
    'are functions.',
    methodName, typeof spec[methodName]
  );

  // We should not use around and filter with DEFINE_ONCE methods because they
  // might modify the method in unacceptable ways (e.g. modify the return value,
  // turn the method into a no-op).
  var specPolicy = ReactCompositeComponentInterface[methodName];
  if (specPolicy === SpecPolicy.DEFINE_ONCE) {
    invariant(
      joinPoint === 'before' ||
      joinPoint === 'after',
      'AdviceDefinition: You may not use the %s method to override %s. ' +
      'Use the before or after methods instead.',
      joinPoint,
      methodName
    );
  }
}

function wrapMethod(joinPoint, methodName, callback) {
  if (RESERVED_ADVICE_KEYS.hasOwnProperty(methodName)) {
    RESERVED_ADVICE_KEYS[methodName].call(this, joinPoint, callback);
  } else {
    validateAdvice(this, joinPoint, methodName);
    this[methodName] = Advice[joinPoint](this[methodName], callback);
  }
}

function AdviceDefinition() {
  'before after around filter'.split(' ').forEach(function(joinPoint) {
    this[joinPoint] = function(methodName, callback) {
      wrapMethod.call(this, joinPoint, methodName, callback);
    };
  }.bind(this));
}

module.exports = AdviceDefinition;
