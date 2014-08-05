/**
 * Copyright 2014 Facebook, Inc.
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
 * @providesModule Object.es6
 * @polyfill
 */

// https://people.mozilla.org/~jorendorff/es6-draft.html#sec-object.assign

var hasEnumBug = !(
  Object.prototype.propertyIsEnumerable.call(
    { constructor : null },
    "constructor"
  )
);
var enumBuggyProperties = [
  "constructor",
  "hasOwnProperty",
  "isPrototypeOf",
  "propertyIsEnumerable",
  "toLocaleString",
  "toString",
  "valueOf"
];

if (!Object.assign) {
  Object.assign = function(target, sources) {
    if (target == null) {
      throw new TypeError('Object.assign target cannot be null or undefined');
    }
    var to = Object(target);

    var hasOwnProperty = Object.prototype.hasOwnProperty;

    for (var nextIndex = 1; nextIndex < arguments.length; nextIndex++) {
      var nextSource = arguments[nextIndex];
      if (nextSource == null) {
        throw new TypeError('Object.assign source cannot be null or undefined');
      }

      var from = Object(nextSource);

      // We don't currently support accessors nor proxies. Therefore this copy
      // cannot throw. If we ever supported this then we must handle
      // exceptions and side-effects.

      for (var key in from) {
        if (hasOwnProperty.call(from, key)) {
          to[key] = from[key];
        }
      }

      // IE8 has a buggy behaviour with the properties contained
      // in `enumBuggyProperties`. Even if they are manually defined,
      // the browser makes them non-enumerable by default

      if(hasEnumBug) {
        var index = -1;
        var length = enumBuggyProperties.length;
        var enumKey;

        while(++index < length) {
          enumKey = enumBuggyProperties[index];
          if(!hasOwnProperty.call(from, enumKey)) {
            continue;
          }
          to[enumKey] = from[enumKey];
        }
      }
    }

    return to;
  };
}
