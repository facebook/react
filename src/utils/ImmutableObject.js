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
 * @providesModule ImmutableObject
 */

"use strict";

var keyMirror = require('keyMirror');
var merge = require('merge');
var mergeInto = require('mergeInto');
var mergeHelpers = require('mergeHelpers');
var throwIf = require('throwIf');

var checkMergeObjectArgs = mergeHelpers.checkMergeObjectArgs;
var isTerminal = mergeHelpers.isTerminal;

/**
 * Simple wrapper around javascript key/value objects that provide a dev time
 * guarantee of immutability (assuming all modules that may potentially mutate
 * include a "use strict" declaration). Retaining immutability requires CPU
 * cycles (in order to perform the freeze), but this computation can be avoided
 * in production. The fact that mutation attempts in __DEV__ will be caught,
 * allows us to reasonably assume that mutation on those objects won't even be
 * attempted in production. This means that an object being an instanceof
 * `ImmutableObject` implies that the object may never change.
 *
 * TODO: Require strict mode in source files that use ImmutableObject (lint
 * rule).
 *
 * @class ImmutableObject
 */

var ERRORS;
var ImmutableObject;

if (__DEV__) {
  ERRORS = {
    INVALID_MAP_SET_ARG: 'You have attempted to set fields on an object that ' +
      'is not an instance of ImmutableObject'
  };

  /**
   * Constructs an instance of `ImmutableObject`.
   *
   * @param {!Object} initMap The initial set of properties.
   * @constructor
   */
  ImmutableObject = function(initMap) {
    mergeInto(this, initMap);
    deepFreeze(this, initMap);
  };

  /**
   * Objects that are instances of `ImmutableObject` are assumed to be deep
   * frozen.
   * @param {!Object} o The object to deep freeze.
   * @return {!boolean} Whether or not deep freeze is needed.
   */
  var shouldRecurseFreeze = function(o) {
    return (typeof o) === 'object' &&
        !(o instanceof ImmutableObject) && o !== null;
  };

  /**
   * Freezes an object `o` deeply. Invokes `shouldRecurseFreeze` to determine if
   * further freezing is needed.
   *
   * @param {!Object} o The object to freeze.
   */
  var deepFreeze = function(o) {
    var prop;
    Object.freeze(o); // First freeze the object.
    for (prop in o) {
      var field = o[prop];
      if (o.hasOwnProperty(prop) && shouldRecurseFreeze(field)) {
        deepFreeze(field);
      }
    }
  };

  /**
   * Returns a new ImmutableObject that is that is the same as the parameter
   * `immutableObject` but with the differences specified in `put`.
   * @param {!ImmutableObject} ImmutableObject The ImmutableObject object to set
   * fields on.
   * @param {!Object} put Subset of fields to merge into the returned result.
   * @return {!ImmutableObject} The result of merging in `put` fields.
   */
  ImmutableObject.set = function(immutableObject, put) {
    throwIf(
      !(immutableObject instanceof ImmutableObject),
      ERRORS.INVALID_MAP_SET_ARG
    );
    var totalNewFields = merge(immutableObject, put);
    return new ImmutableObject(totalNewFields);
  };

} else {
  ERRORS = keyMirror({INVALID_MAP_SET_ARG: null});

  ImmutableObject = function(initMap) {
    mergeInto(this, initMap);
  };

  ImmutableObject.set = function(immutableObject, put) {
    throwIf(
      !(immutableObject instanceof ImmutableObject),
      ERRORS.INVALID_MAP_SET_ARG
    );
    var newMap = new ImmutableObject(immutableObject);
    mergeInto(newMap, put);
    return newMap;
  };
}

/**
 * Sugar for `ImmutableObject.set(ImmutableObject, {fieldName: putField})`
 * @see ImmutableObject.set
 */
ImmutableObject.setField = function(immutableObject, fieldName, putField) {
  var put = {};
  put[fieldName] = putField;
  return ImmutableObject.set(immutableObject, put);
};

/**
 * Returns a new ImmutableObject that is that is the same as the parameter
 * `immutableObject` but with the differences specified in `put` recursively
 * applied.
 */
ImmutableObject.setDeep = function(immutableObject, put) {
  throwIf(
    !(immutableObject instanceof ImmutableObject),
    ERRORS.INVALID_MAP_SET_ARG
  );
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

  return (object instanceof ImmutableObject || put instanceof ImmutableObject) ?
    new ImmutableObject(totalNewFields) :
    totalNewFields;
}

module.exports = ImmutableObject;
