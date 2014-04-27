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
 * @providesModule getObjectDiff
 */

"use strict";

/**
 * Given: prev = {a: 1, b: 2, c: 3} and next = {b: 4, c: 3, d: 5}, return
 * {a: null, b: 4, d: 5}
 *
 * @param {?object} prev
 * @param {?object} next
 * @return {?object} The diff with values to update, add delete (indicated by
 * null). We accept null as input/output to save allocation.
 */

function getObjectDiff(prev, next) {
  var diff;
  var key;
  if (!prev) {
    return next;
  }
  if (!next) {
    diff = {};
    for (key in prev) {
      if (!prev.hasOwnProperty(key)) {
        continue;
      }
      diff[key] = null;
    }
    return diff;
  }
  for (key in prev) {
    if (!prev.hasOwnProperty(key) || next.hasOwnProperty(key)) {
      continue;
    }
    diff = diff || {};
    diff[key] = null;
  }
  for (key in next) {
    if (!next.hasOwnProperty(key) || prev[key] === next[key]) {
      continue;
    }
    diff = diff || {};
    diff[key] = next[key];
  }

  return diff;
}

module.exports = getObjectDiff;
