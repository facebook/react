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

/**
 * Maps children that are typically specified as `props.children`.
 *
 * The provided mapFunction(child, key, index) will be called for each
 * leaf child.
 *
 * Note: mapChildren assumes children have already been flattened.
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
  for (var ii = 0; ii < children.length; ii++) {
    var child = children[ii];
    var key = child._key;
    var mappedChild = mapFunction.call(context, child, key, ii);
    mappedChild.props.key = key;
    mappedChildren.push(mappedChild);
  }
  return mappedChildren;
}

module.exports = mapChildren;
