/**
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
    mappedChild._key = key;
    mappedChildren.push(mappedChild);
  }
  return mappedChildren;
}

module.exports = mapChildren;
