/**
 * @providesModule eachKeyVal
 */

"use strict";

/**
 * Invokes fun for each own property in obj. Invokes `fun(key, val, obj, i)`.
 * @param {?Object} obj The object to iterate over.
 * @param {?Function} fun The function to invoke.
 * @param {?context=} context The context to call from.
 */
function eachKeyVal(obj, fun, context) {
  if (!obj || !fun) {
    return;
  }
  // Object.keys only returns the "own" properties.
  var objKeys = Object.keys(obj);
  var i;
  for (i=0; i < objKeys.length; i++) {
    fun.call(context, objKeys[i], obj[objKeys[i]], obj, i);
  }
}

module.exports = eachKeyVal;
