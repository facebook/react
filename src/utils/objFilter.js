/**
 * @providesModule objFilter
 */

"use strict";

/**
 * For each key/value pair, invokes callback func and constructs a resulting
 * object which contains each key/value pair which produces a truthy result
 * from invoking the function:
 *
 *   func(value, key, iteration)
 *
 * @param {?object} obj Object to map keys over
 * @param {function} func Invoked for each key/val pair.
 * @param {?*} context
 * @return {?object} Result of filtering or null if obj is falsey
 */
function objFilter(obj, func, context) {
  if (!obj) {
    return null;
  }
  var i = 0;
  var ret = {};
  for (var key in obj) {
    if (obj.hasOwnProperty(key) &&
        func.call(context, obj[key], key, i++)) {
      ret[key] = obj[key];
    }
  }
  return ret;
}

module.exports = objFilter;
