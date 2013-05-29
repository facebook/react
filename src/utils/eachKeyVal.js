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
