/**
 * @providesModule reactKeys
 */

"use strict";

/**
 * Similar to Object.keys() but does not fail on empty parameter.
 */
var keys = function(obj) {
  var ret = [], aKey;
  for (aKey in obj) {
    if (obj.hasOwnProperty(aKey)) {
      ret.push(aKey);
    }
  }
  return ret;
};

module.exports = keys;
