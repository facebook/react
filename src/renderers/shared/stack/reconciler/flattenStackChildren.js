/**
 * Copyright 2013-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @providesModule flattenStackChildren
 * @flow
 */

'use strict';

var KeyEscapeUtils = require('KeyEscapeUtils');
var traverseStackChildren = require('traverseStackChildren');
var warning = require('fbjs/lib/warning');

var ReactComponentTreeHook;

if (
  typeof process !== 'undefined' &&
  process.env &&
  process.env.NODE_ENV === 'test'
) {
  // Temporary hack.
  // Inline requires don't work well with Jest:
  // https://github.com/facebook/react/issues/7240
  // Remove the inline requires when we don't need them anymore:
  // https://github.com/facebook/react/pull/7178
  ReactComponentTreeHook = require('ReactGlobalSharedState')
    .ReactComponentTreeHook;
}

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
      if (!ReactComponentTreeHook) {
        ReactComponentTreeHook = require('ReactGlobalSharedState')
          .ReactComponentTreeHook;
      }
      if (!keyUnique) {
        warning(
          false,
          'flattenChildren(...): Encountered two children with the same key, ' +
            '`%s`. Child keys must be unique; when two children share a key, only ' +
            'the first child will be used.%s',
          KeyEscapeUtils.unescapeInDev(name),
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
function flattenStackChildren(
  children: ReactElement<any>,
  selfDebugID?: number,
): ?{[name: string]: ReactElement<any>} {
  if (children == null) {
    return children;
  }
  var result = {};

  if (__DEV__) {
    traverseStackChildren(
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
    traverseStackChildren(children, flattenSingleChildIntoContext, result);
  }
  return result;
}

module.exports = flattenStackChildren;
