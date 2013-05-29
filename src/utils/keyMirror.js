/**
 * @providesModule keyMirror
 */

"use strict";

var throwIf = require('throwIf');

var NOT_OBJECT_ERROR = 'NOT_OBJECT_ERROR';
if (__DEV__) {
  NOT_OBJECT_ERROR = 'keyMirror only works on objects';
}

/**
 * Utility for constructing enums with keys being equal to the associated
 * values, even when using advanced key crushing. This is useful for debugging,
 * but also for using the values themselves as lookups into the enum.
 * Example:
 * var COLORS = keyMirror({blue: null, red: null});
 * var myColor = COLORS.blue;
 * var isColorValid = !!COLORS[myColor]
 * The last line could not be performed if the values of the generated enum were
 * not equal to their keys.
 * Input:  {key1: val1, key2: val2}
 * Output: {key1: key1, key2: key2}
 */
var keyMirror = function(obj) {
  var ret = {};
  var key;

  throwIf(!(obj instanceof Object) || Array.isArray(obj), NOT_OBJECT_ERROR);

  for (key in obj) {
    if (!obj.hasOwnProperty(key)) {
      continue;
    }
    ret[key] = key;
  }
  return ret;
};

module.exports = keyMirror;
