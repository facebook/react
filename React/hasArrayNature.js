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
 * @providesModule hasArrayNature
 */

/**
 *  Perform a heuristic test to determine if an object is "array-like".
 *
 *    A monk asked Joshu, a Zen master, "Has a dog Buddha nature?"
 *    Joshu replied: "Mu."
 *
 *  This function determines if its argument has "array nature": it returns
 *  true if the argument is an actual array, an `arguments' object, or an
 *  HTMLCollection (e.g. node.childNodes or node.getElementsByTagName()).
 *
 *  @param  obj   An object to test.
 *  @return bool  True if the object is array-like.
 */
function hasArrayNature(obj) {
  return (
    // not null/false
    !!obj &&
    // arrays are objects, NodeLists are functions in Safari
    (typeof obj == 'object' || typeof obj == 'function') &&
    // quacks like an array
    ('length' in obj) &&
    // not window
    !('setInterval' in obj) &&
    (
      // a real array
      (Object.prototype.toString.call(obj) === "[object Array]" ||
      // arguments
      ('callee' in obj) || // HTMLCollection/NodeList
      'item' in obj)
    )
  );
}

module.exports = hasArrayNature;
