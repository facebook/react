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
 * @providesModule curryOnly
 */

"use strict";

/**
 * When the function who's first parameter you are currying accepts only a
 * single argument, and you want to curry it, use this function for performance
 * reasons, as it will never access 'arguments'. It would be an interesting
 * project to detect at static analysis time, calls to F.curry that could be
 * transformed to one of the two optimized versions seen here.
 */
var curryOnly = function(func, val, context) {
  if (!func) {
    return null;
  }
  return function() {
    return func.call(context, val);
  };
};

module.exports = curryOnly;
