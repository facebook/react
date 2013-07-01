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
 * @providesModule mapChildren
 */

"use strict";

var flattenChildren = require('flattenChildren');

/**
 * Maps children that are typically specified as `props.children`.
 *
 * The provided mapFunction(child, key, index) will be called for each
 * leaf child.
 *
 * @param {array} children
 * @param {function(*, string, int)} mapFunction
 * @param {*} context
 * @return {array} mirrored array with mapped children
 */
function mapChildren(children, mapFunction, context) {
  if (children == null) {
    return children;
  }
  var mappedChildren = [];
  var flattenedMap = flattenChildren(children);
  var ii = 0;
  for (var key in flattenedMap) {
    if (!flattenedMap.hasOwnProperty(key)) {
      continue;
    }
    var child = flattenedMap[key];
    // In this version of map children we ignore empty children.
    if (child !== null) {
      var mappedChild = mapFunction.call(context, child, key, ii);
      mappedChild.props.key = key;
      mappedChildren.push(mappedChild);
      ii++;
    }
  }
  return mappedChildren;
}

module.exports = mapChildren;
