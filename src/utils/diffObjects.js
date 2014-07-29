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
 * @providesModule diffObjects
 */

"use strict";

/**
 * Compare two objects, calling deleteFunc for each key in prevObj missing from
 * nextObj and updateFunc for each key with a different value in nextObj.
 *
 * @param {object?} prevObj
 * @param {object?} nextObj
 * @param {function} deleteFunc
 * @param {function} updateFunc
 */
function diffObjects(prevObj, nextObj, deleteFunc, updateFunc, a, b) {
  if (prevObj == null && nextObj == null) {
    return;
  }

  var key;
  if (prevObj == null) {
    for (key in nextObj) {
      if (!nextObj.hasOwnProperty(key)) {
        continue;
      }
      updateFunc(key, prevObj, nextObj, a, b);
    }
    return;
  }

  if (nextObj == null) {
    for (key in prevObj) {
      if (!prevObj.hasOwnProperty(key)) {
        continue;
      }
      deleteFunc(key, prevObj, nextObj, a, b);
    }
    return;
  }

  for (key in prevObj) {
    if (!prevObj.hasOwnProperty(key)) {
      continue;
    }
    if (!nextObj.hasOwnProperty(key)) {
      deleteFunc(key, prevObj, nextObj, a, b);
    } else if (prevObj[key] !== nextObj[key]) {
      updateFunc(key, prevObj, nextObj, a, b);
    }
  }

  for (key in nextObj) {
    if (!nextObj.hasOwnProperty(key)) {
      continue;
    }
    if (!prevObj.hasOwnProperty(key)) {
      updateFunc(key, prevObj, nextObj, a, b);
    }
  }
}

module.exports = diffObjects;
