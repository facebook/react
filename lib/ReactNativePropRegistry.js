/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @providesModule ReactNativePropRegistry
 * 
 */
'use strict';

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var objects = {};
var uniqueID = 1;
var emptyObject = {};

var ReactNativePropRegistry = function () {
  function ReactNativePropRegistry() {
    _classCallCheck(this, ReactNativePropRegistry);
  }

  ReactNativePropRegistry.register = function register(object) {
    var id = ++uniqueID;
    if (process.env.NODE_ENV !== 'production') {
      Object.freeze(object);
    }
    objects[id] = object;
    return id;
  };

  ReactNativePropRegistry.getByID = function getByID(id) {
    if (!id) {
      // Used in the style={[condition && id]} pattern,
      // we want it to be a no-op when the value is false or null
      return emptyObject;
    }

    var object = objects[id];
    if (!object) {
      console.warn('Invalid style with id `' + id + '`. Skipping ...');
      return emptyObject;
    }
    return object;
  };

  return ReactNativePropRegistry;
}();

module.exports = ReactNativePropRegistry;