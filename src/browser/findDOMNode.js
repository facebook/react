/**
 * Copyright 2013-2014, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @providesModule findDOMNode
 * @typechecks static-only
 */

'use strict';
var ReactInstanceMap = require('ReactInstanceMap');
var ReactMount = require('ReactMount');

var invariant = require('invariant');
var isNode = require('isNode');

/**
 * Returns the DOM node rendered by this element.
 *
 * @param {ReactComponent|DOMElement} componentOrElement
 * @return {DOMElement} The root node of this element.
 */
function findDOMNode(componentOrElement) {
  if (componentOrElement == null) {
    return null;
  }
  if (isNode(componentOrElement)) {
    return componentOrElement;
  }
  if (ReactInstanceMap.has(componentOrElement)) {
    return ReactMount.getNodeFromInstance(componentOrElement);
  }
  invariant(
    componentOrElement.render == null ||
    typeof(componentOrElement.render) !== 'function',
    'Component (with keys: %s) contains `render` method '
    +'but is not mounted in the DOM',
    Object.keys(componentOrElement)
  );
  invariant(
    false,
    'Element appears to be neither ReactComponent nor DOMNode (keys: %s)',
    Object.keys(componentOrElement)
  );
}

module.exports = findDOMNode;
