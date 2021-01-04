/**
 * Copyright 2013-2014 Facebook, Inc.
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
 * @providesModule Immutable
 */

var invariant = require('invariant');
var isNode = require('isNode');
var keyOf = require('keyOf');
var mergeInto = require('mergeInto');

var SECRET_KEY = keyOf({_DONT_EVER_TYPE_THIS_SECRET_KEY: null});

/**
 * `Immutable` provides a guarantee of immutability at developer time when
 * strict mode is used. The extra computations required to enforce immutability
 * are stripped out in production for performance reasons. `Immutable`
 * guarantees to enforce immutability for enumerable, own properties. This
 * allows easy wrapping of `Immutable` with the ability to store non-enumerable
 * properties on the instance that only your static methods reason about. In
 * order to achieve IE8 compatibility (which doesn't have the ability to define
 * non-enumerable properties), modules that want to build their own reasoning
 * of `Immutable`s and store computations can define their non-enumerable
 * properties under the name `toString`, and in IE8 only define a standard
 * property called `toString` which will mistakenly be considered not
 * enumerable due to its name (but only in IE8). The only limitation is that no
 * one can store their own `toString` property.
 * https://developer.mozilla.org/en-US/docs/ECMAScript_DontEnum_attribute#JScript_DontEnum_Bug
 */
class Immutable {
  /**
   * An instance of `Immutable` appears to be a plain JavaScript object, except
   * `instanceof Immutable` evaluates to `true`, and it is deeply frozen in
   * development mode.
   *
   * @param {number} secret Ensures this isn't accidentally constructed outside
   * of convenience constructors. If created outside of a convenience
   * constructor, may not be frozen. Forbidding that use case for now until we
   * have a better API.
   */
  constructor(secret) {
    invariant(
      secret === Immutable[SECRET_KEY],
      'Only certain classes should create instances of `Immutable`.' +
      'You probably want something like ImmutableObject.create.'
    );
  }

  /**
   * Helper method for classes that make use of `Immutable`.
   * @param {Immutable} immutable Object to merge properties into.
   * @param {array<object>} propertyObjects List of objects to merge into
   * `destination`.
   */
  static mergeAllPropertiesInto(destination, propertyObjects) {
    var argLength = propertyObjects.length;
    for (var i = 0; i < argLength; i++) {
      mergeInto(destination, propertyObjects[i]);
    }
  }


  /**
   * Freezes the supplied object deeply. Other classes may implement their own
   * version based on this.
   *
   * @param {*} object The object to freeze.
   */
  static deepFreezeRootNode(object) {
    if (isNode(object)) {
      return; // Don't try to freeze DOM nodes.
    }
    Object.freeze(object); // First freeze the object.
    for (var prop in object) {
      if (object.hasOwnProperty(prop)) {
        Immutable.recurseDeepFreeze(object[prop]);
      }
    }
    Object.seal(object);
  }

  /**
   * Differs from `deepFreezeRootNode`, in that we first check if this is a
   * necessary recursion. If the object is already an `Immutable`, then the
   * recursion is unnecessary as it is already frozen. That check obviously
   * wouldn't work for the root node version `deepFreezeRootNode`!
   */
  static recurseDeepFreeze(object) {
    if (isNode(object) || !Immutable.shouldRecurseFreeze(object)) {
      return; // Don't try to freeze DOM nodes.
    }
    Object.freeze(object); // First freeze the object.
    for (var prop in object) {
      if (object.hasOwnProperty(prop)) {
        Immutable.recurseDeepFreeze(object[prop]);
      }
    }
    Object.seal(object);
  }

  /**
   * Checks if an object should be deep frozen. Instances of `Immutable` are
   * assumed to have already been deep frozen, so we can have large `__DEV__`
   * time savings by skipping freezing of them.
   *
   * @param {*} object The object to check.
   * @return {boolean} Whether or not deep freeze is needed.
   */
  static shouldRecurseFreeze(object) {
    return (
      typeof object === 'object' &&
      !(object instanceof Immutable) &&
      object !== null
    );
  }
}

Immutable._DONT_EVER_TYPE_THIS_SECRET_KEY = Math.random();

module.exports = Immutable;
