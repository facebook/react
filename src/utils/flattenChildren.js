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
 * @providesModule flattenChildren
 */

"use strict";

var ReactComponent = require('ReactComponent');
var ReactTextComponent = require('ReactTextComponent');

var throwIf = require('throwIf');

/**
 * @polyFill Array.isArray
 */


var INVALID_CHILD = 'INVALID_CHILD';
if (__DEV__) {
  INVALID_CHILD =
    'You may not pass a child of that type to a React component. It ' +
    'is a common mistake to try to pass a standard browser DOM element ' +
    'as a child of a React component.';
}

var DUPLICATE_KEY_ERROR =
    'You have two children with identical keys. Make sure that you set the ' +
    '"key" property to a unique value such as a row ID.';

var flattenChildrenImpl = function(res, children, nameSoFar) {
  if (Array.isArray(children)) {
    for (var i = 0; i < children.length; i++) {
      var child = children[i];
      flattenChildrenImpl(
        res,
        child,
        nameSoFar + '[' + ReactComponent.getKey(child, i) + ']'
      );
    }
  } else {
    var type = typeof children;
    var isOnlyChild = nameSoFar === '';
    // If it's the only child, treat the name as if it was wrapped in an array
    // so that it's consistent if the number of children grows
    var storageName = isOnlyChild ?
                      '[' + ReactComponent.getKey(children, 0) + ']' :
                      nameSoFar;
    if (children === null || children === undefined || type === 'boolean') {
      res[storageName] = null;
    } else if (children.mountComponentIntoNode) {
      /* We found a component instance */
      if (__DEV__) {
        throwIf(res.hasOwnProperty(storageName), DUPLICATE_KEY_ERROR);
      }
      res[storageName] = children;
    } else {
      if (type === 'object') {
        throwIf(children && children.nodeType === 1, INVALID_CHILD);
        for (var key in children) {
          if (children.hasOwnProperty(key)) {
            flattenChildrenImpl(
              res,
              children[key],
              nameSoFar + '{' + key + '}'
            );
          }
        }
      } else if (type === 'string') {
        res[storageName] = new ReactTextComponent(children);
      } else if (type === 'number') {
        res[storageName] = new ReactTextComponent('' + children);
      }
    }
  }
};

/**
 * Flattens children that are typically specified as `props.children`.
 * @return {!Object} flattened children keyed by name.
 */
function flattenChildren(children) {
  if (children === null || children === undefined) {
    return children;
  }
  var result = {};
  flattenChildrenImpl(result, children, '');
  return result;
}

module.exports = flattenChildren;
