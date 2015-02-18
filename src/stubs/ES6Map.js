/**
 * Copyright 2015, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @providesModule ES6Map
 */

'use strict';

function cloneWithoutKey(obj, notKey) {
  var newObj = {};
  var keys = Object.keys(obj);
  for (var i = 0, l = keys.length; i < l; i++) {
    var key = keys[i];
    if (key !== notKey) {
      newObj[key] = obj[key];
    }
  }
  return newObj;
}

if (typeof Map !== 'undefined') {
  var _Map = Map;
   _Map.remove = _Map.delete;
  module.exports = _Map;
}
else {
  var ES6Map = function ES6Map() {
    this.values = {};
  };
  ES6Map.prototype = {

    remove: function(key) {
      this.values = cloneWithoutKey(this.values, key);
    },

    get: function(key) {
      return this.values[key];
    },

    has: function(key) {
      return this.values[key] !== undefined;
    },

    set: function(key, value) {
      this.values[key] = value;
    }
  };

  module.exports = ES6Map;
}
