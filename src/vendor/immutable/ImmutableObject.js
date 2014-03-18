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
 * @providesModule ImmutableObject
 */

"use strict";

var Immutable = require('Immutable');

var invariant = require('invariant');
var keyOf = require('keyOf');
var mergeHelpers = require('mergeHelpers');

var checkMergeObjectArgs = mergeHelpers.checkMergeObjectArgs;
var isTerminal = mergeHelpers.isTerminal;

var SECRET_KEY = keyOf({_DONT_EVER_TYPE_THIS_SECRET_KEY: null});

/**
 * Static methods creating and operating on instances of `Immutable`.
 */
function assertImmutable(immutable) {
  invariant(
    immutable instanceof Immutable,
    'ImmutableObject: Attempted to set fields on an object that is not an ' +
    'instance of Immutable.'
  );
}

/**
 * Static methods for reasoning about instances of `ImmutableObject`. Execute
 * the freeze commands in `__DEV__` mode to alert the programmer that something
 * is attempting to mutate. Since freezing is very expensive, we avoid doing it
 * at all in production.
 */
class ImmutableObject extends Immutable {
  /**
   * @arguments {array<object>} The arguments is an array of objects that, when
   * merged together, will form the immutable objects.
   */
  constructor() {
    super(Immutable[SECRET_KEY]);
    Immutable.mergeAllPropertiesInto(this, arguments);
    if (__DEV__) {
      Immutable.deepFreezeRootNode(this);
    }
  }

  /**
   * DEPRECATED - prefer to instantiate with new ImmutableObject().
   *
   * @arguments {array<object>} The arguments is an array of objects that, when
   * merged together, will form the immutable objects.
   */
  static create() {
    var obj = Object.create(ImmutableObject.prototype);
    ImmutableObject.apply(obj, arguments);
    return obj;
  }

  /**
   * Returns a new `Immutable` that is identical to the supplied `Immutable`
   * but with the specified changes, `put`. Any keys that are in the
   * intersection of `immutable` and `put` retain the ordering of `immutable.
   * New keys are placed after keys that exist in `immutable`.
   *
   * @param {Immutable} immutable Starting object.
   * @param {?object} put Fields to merge into the object.
   * @return {Immutable} The result of merging in `put` fields.
   */
  static set(immutable, put) {
    assertImmutable(immutable);
    invariant(
      typeof put === 'object' && put !== undefined && !Array.isArray(put),
      'Invalid ImmutableMap.set argument `put`'
    );
    return new ImmutableObject(immutable, put);
  }

  /**
   * Sugar for `ImmutableObject.set(ImmutableObject, {fieldName: putField})`.
   * Look out for key crushing: Use `keyOf()` to guard against it.
   *
   * @param {Immutable} immutable Object on which to set properties.
   * @param {string} fieldName Name of the field to set.
   * @param {*} putField Value of the field to set.
   * @return {Immutable} new Immutable as described in `set`.
   */
  static setProperty(immutableObject, fieldName, putField) {
    var put = {};
    put[fieldName] = putField;
    return ImmutableObject.set(immutableObject, put);
  }

  /**
   * Returns a new `Immutable` that is identical to the supplied object but
   * with the supplied changes recursively applied.
   *
   * Experimental. Likely does not handle `Arrays` correctly.
   *
   * @param {Immutable} immutable Object on which to set fields.
   * @param {object} put Fields to merge into the object.
   * @return {Immutable} The result of merging in `put` fields.
   */
  static setDeep(immutable, put) {
    assertImmutable(immutable);
    return _setDeep(immutable, put);
  }
}

function _setDeep(obj, put) {
  checkMergeObjectArgs(obj, put);
  var totalNewFields = {};

  // To maintain the order of the keys, copy the base object's entries first.
  var keys = Object.keys(obj);
  for (var ii = 0; ii < keys.length; ii++) {
    var key = keys[ii];
    if (!put.hasOwnProperty(key)) {
      totalNewFields[key] = obj[key];
    } else if (isTerminal(obj[key]) || isTerminal(put[key])) {
      totalNewFields[key] = put[key];
    } else {
      totalNewFields[key] = _setDeep(obj[key], put[key]);
    }
  }

  // Apply any new keys that the base obj didn't have.
  var newKeys = Object.keys(put);
  for (ii = 0; ii < newKeys.length; ii++) {
    var newKey = newKeys[ii];
    if (obj.hasOwnProperty(newKey)) {
      continue;
    }
    totalNewFields[newKey] = put[newKey];
  }

  return (
    obj instanceof Immutable ? new ImmutableObject(totalNewFields) :
    put instanceof Immutable ? new ImmutableObject(totalNewFields) :
    totalNewFields
  );
}

module.exports = ImmutableObject;
