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
 * @providesModule keyMirror
 */

"use strict";

var throwIf = require("./throwIf");

var NOT_OBJECT_ERROR = 'NOT_OBJECT_ERROR';
if (true) {
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
