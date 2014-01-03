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
 * @providesModule joinClasses
 * @typechecks static-only
 */

"use strict";

/**
 * Combines multiple className strings into one.
 * http://jsperf.com/joinclasses-args-vs-array/8
 *
 * @param {?string} className1
 * @param {?string} className2
 * @return {string}
 */
function joinClasses(className1, className2) {
  if (className1 && className2) {
    return className1 + ' ' + className2;
  } else if (className1) {
    return className1;
  } else if (className2) {
    return className2;
  } else {
    return '';
  }
}

module.exports = joinClasses;
