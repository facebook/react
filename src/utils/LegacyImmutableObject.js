/**
 * Copyright 2013-2014, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @providesModule LegacyImmutableObject
 * @typechecks
 */

"use strict";

var assign = require('Object.assign');
var invariant = require('invariant');
var isNode = require('isNode');
var mergeHelpers = require('mergeHelpers');

var checkMergeObjectArgs = mergeHelpers.checkMergeObjectArgs;
var isTerminal = mergeHelpers.isTerminal;

/**
 * Wrapper around JavaScript objects that provide a guarantee of immutability at
 * developer time when strict mode is used. The extra computations required to
 * enforce immutability is stripped out in production for performance reasons.
 */
var LegacyImmutableObject;

function assertLegacyImmutableObject(immutableObject) {
  invariant(
    immutableObject instanceof LegacyImmutableObject,
    'LegacyImmutableObject: Attempted to set fields on an object that is not ' +
    'an instance of LegacyImmutableObject.'
  );
}

if (__DEV__) {
  /**
   * Constructs an instance of `LegacyImmutableObject`.
   *
   * @param {?object} initialProperties The initial set of properties.
   * @constructor
   */
  LegacyImmutableObject = function LegacyImmutableObject(initialProperties) {
    assign(this, initialProperties);
    deepFreeze(this);
  };

  /**
   * Checks if an object should be deep frozen. Instances of
   * `LegacyImmutableObject` are assumed to have already been deep frozen.
   *
   * @param {*} object The object to check.
   * @return {boolean} Whether or not deep freeze is needed.
   */
  var shouldRecurseFreeze = function(object) {
    return (
      typeof object === 'object' &&
      !(object instanceof LegacyImmutableObject) &&
      object !== null
    );
  };

  /**
   * Freezes the supplied object deeply.
   *
   * @param {*} object The object to freeze.
   */
  var deepFreeze = function(object) {
    if (isNode(object)) {
      return; // Don't try to freeze DOM nodes.
    }
    Object.freeze(object); // First freeze the object.
    for (var prop in object) {
      if (object.hasOwnProperty(prop)) {
        var field = object[prop];
        if (shouldRecurseFreeze(field)) {
          deepFreeze(field);
        }
      }
    }
  };

  /**
   * Returns a new LegacyImmutableObject that is identical to the supplied
   * object but with the supplied changes, `put`.
   *
   * @param {LegacyImmutableObject} immutableObject Starting object.
   * @param {?object} put Fields to merge into the object.
   * @return {LegacyImmutableObject} The result of merging in `put` fields.
   */
  LegacyImmutableObject.set = function(immutableObject, put) {
    assertLegacyImmutableObject(immutableObject);
    var totalNewFields = assign({}, immutableObject, put);
    return new LegacyImmutableObject(totalNewFields);
  };

} else {
  /**
   * Constructs an instance of `LegacyImmutableObject`.
   *
   * @param {?object} initialProperties The initial set of properties.
   * @constructor
   */
  LegacyImmutableObject = function LegacyImmutableObject(initialProperties) {
    assign(this, initialProperties);
  };

  /**
   * Returns a new LegacyImmutableObject that is identical to the supplied
   * object but with the supplied changes, `put`.
   *
   * @param {LegacyImmutableObject} immutableObject Starting object.
   * @param {?object} put Fields to merge into the object.
   * @return {LegacyImmutableObject} The result of merging in `put` fields.
   */
  LegacyImmutableObject.set = function(immutableObject, put) {
    assertLegacyImmutableObject(immutableObject);
    var newMap = new LegacyImmutableObject(immutableObject);
    assign(newMap, put);
    return newMap;
  };
}

/**
 * Sugar for:
 * `LegacyImmutableObject.set(LegacyImmutableObject, {fieldName: putField})`.
 *
 * @param {LegacyImmutableObject} immutableObject Object on which to set field.
 * @param {string} fieldName Name of the field to set.
 * @param {*} putField Value of the field to set.
 * @return {LegacyImmutableObject} [description]
 */
LegacyImmutableObject.setField = function(immutableObject, fieldName, putField) {
  var put = {};
  put[fieldName] = putField;
  return LegacyImmutableObject.set(immutableObject, put);
};

/**
 * Returns a new LegacyImmutableObject that is identical to the supplied object
 * but with the supplied changes recursively applied.
 *
 * @param {LegacyImmutableObject} immutableObject Object on which to set fields.
 * @param {object} put Fields to merge into the object.
 * @return {LegacyImmutableObject} The result of merging in `put` fields.
 */
LegacyImmutableObject.setDeep = function(immutableObject, put) {
  assertLegacyImmutableObject(immutableObject);
  return _setDeep(immutableObject, put);
};

function _setDeep(object, put) {
  checkMergeObjectArgs(object, put);
  var totalNewFields = {};

  // To maintain the order of the keys, copy the base object's entries first.
  var keys = Object.keys(object);
  for (var ii = 0; ii < keys.length; ii++) {
    var key = keys[ii];
    if (!put.hasOwnProperty(key)) {
      totalNewFields[key] = object[key];
    } else if (isTerminal(object[key]) || isTerminal(put[key])) {
      totalNewFields[key] = put[key];
    } else {
      totalNewFields[key] = _setDeep(object[key], put[key]);
    }
  }

  // Apply any new keys that the base object didn't have.
  var newKeys = Object.keys(put);
  for (ii = 0; ii < newKeys.length; ii++) {
    var newKey = newKeys[ii];
    if (object.hasOwnProperty(newKey)) {
      continue;
    }
    totalNewFields[newKey] = put[newKey];
  }

  return (object instanceof LegacyImmutableObject ||
          put instanceof LegacyImmutableObject) ?
    new LegacyImmutableObject(totalNewFields) :
    totalNewFields;
}

module.exports = LegacyImmutableObject;
