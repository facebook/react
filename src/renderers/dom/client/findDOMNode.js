/**
 * Copyright 2013-2015, Facebook, Inc.
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

var ReactPureFunction = require('ReactPureFunction');
var ReactInstanceMap = require('ReactInstanceMap');
var ReactMount = require('ReactMount');

var invariant = require('invariant');
var warning = require('warning');

/**
 * Returns the DOM node rendered by this element.
 *
 * @param {ReactComponent|DOMElement} componentOrElement
 * @return {?DOMElement} The root node of this element.
 */
function findDOMNode(componentOrElement) {
  if (__DEV__) {
    ReactPureFunction.assertSideEffect(
      'Do not access getDOMNode or findDOMNode inside of render(). ' +
      'render() should be a pure function of props and state. It should ' +
      'never access something that requires stale data from the previous ' +
      'render, such as refs. Move this logic to componentDidMount and ' +
      'componentDidUpdate instead.'
    );
  }
  if (componentOrElement == null) {
    return null;
  }
  if (componentOrElement.nodeType === 1) {
    return componentOrElement;
  }
  if (ReactInstanceMap.has(componentOrElement)) {
    return ReactMount.getNodeFromInstance(componentOrElement);
  }
  invariant(
    componentOrElement.render == null ||
    typeof componentOrElement.render !== 'function',
    'Component (with keys: %s) contains `render` method ' +
    'but is not mounted in the DOM',
    Object.keys(componentOrElement)
  );
  invariant(
    false,
    'Element appears to be neither ReactComponent nor DOMNode (keys: %s)',
    Object.keys(componentOrElement)
  );
}

module.exports = findDOMNode;
