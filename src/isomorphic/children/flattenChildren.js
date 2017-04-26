/**
 * Copyright 2013-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @providesModule flattenChildren
 * @flow
 */

'use strict';

var KeyEscapeUtils = require('KeyEscapeUtils');
var traverseAllChildren = require('traverseAllChildren');
var warning = require('fbjs/lib/warning');
var ReactComponentTreeHook = require('ReactComponentTreeHook');

/**
 * @param {function} traverseContext Context passed through traversal.
 * @param {?ReactComponent} child React child component.
 * @param {!string} name String name of key path to child.
 * @param {number=} selfDebugID Optional debugID of the current internal instance.
 */
function flattenSingleChildIntoContext(
  traverseContext: mixed,
  child: ReactElement<any>,
  name: string,
  selfDebugID?: number,
): void {
  // We found a component instance.
  if (traverseContext && typeof traverseContext === 'object') {
    const result = traverseContext;
    const keyUnique = result[name] === undefined;
    if (__DEV__) {
      if (!keyUnique) {
        warning(
          false,
          'flattenChildren(...): Encountered two children with the same key, ' +
            '`%s`. Child keys must be unique; when two children share a key, only ' +
            'the first child will be used.%s',
          KeyEscapeUtils.unescape(name),
          ReactComponentTreeHook.getStackAddendumByID(selfDebugID),
        );
      }
    }
    if (keyUnique && child != null) {
      result[name] = child;
    }
  }
}

/**
 * Flattens children that are typically specified as `props.children`. Any null
 * children will not be included in the resulting object.
 * @return {!object} flattened children keyed by name.
 */
function flattenChildren(
  children: ReactElement<any>,
  selfDebugID?: number,
): ?{[name: string]: ReactElement<any>} {
  if (children == null) {
    return children;
  }
  var result = {};

  if (__DEV__) {
    traverseAllChildren(
      children,
      (traverseContext, child, name) =>
        flattenSingleChildIntoContext(
          traverseContext,
          child,
          name,
          selfDebugID,
        ),
      result,
    );
  } else {
    traverseAllChildren(children, flattenSingleChildIntoContext, result);
  }
  return result;
}

module.exports = flattenChildren;
