/**
 * Copyright 2013-2014, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @providesModule keyMirror
 * @typechecks static-only
 */

"use strict";

/**
 * Constructs an object with keys equal to their value.
 *
 * For example:
 *
 *   var COLORS = enum('blue', 'red');
 *   var myColor = COLORS.blue;
 *   var isColorValid = !!COLORS[myColor];
 *
 * The last line could not be performed if the values of the generated enum were
 * not equal to their keys.
 *
 *   Input:  'key1', 'key2', ..., 'keyN'
 *   Output: {key1: 'key1', key2: 'key2', ..., keyN: 'keyN'}
 *
 * @param string(s)
 * @return {object}
 */
var enum = function(...values) {
  var keyMirror = require('keyMirror');
  return Object.freeze(keyMirror(asKeys(values)));

  function asKeys(values) {
    var o = {};

    values.forEach(function (key) {
      o[key] = null;
    });

    return o;
  }
};

module.exports = enum;
