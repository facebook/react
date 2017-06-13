/**
 * Copyright 2013-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @providesModule findDOMNode
 */

'use strict';

var ReactCurrentOwner = require('ReactCurrentOwner');
var ReactDOMComponentTree = require('ReactDOMComponentTree');
var ReactInstanceMap = require('ReactInstanceMap');

var getHostComponentFromComposite = require('getHostComponentFromComposite');
var invariant = require('invariant');
var warning = require('warning');

/**
 * Returns the DOM node rendered by this element.
 *
 * See https://facebook.github.io/react/docs/top-level-api.html#reactdom.finddomnode
 *
 * @param {ReactComponent|DOMElement} componentOrElement
 * @return {?DOMElement} The root node of this element.
 */
function findDOMNode(componentOrElement) {
  if (__DEV__) {
    var owner = ReactCurrentOwner.current;
    if (owner !== null) {
      warning(
        owner._warnedAboutRefsInRender,
        '%s is accessing findDOMNode inside its render(). ' +
          'render() should be a pure function of props and state. It should ' +
          'never access something that requires stale data from the previous ' +
          'render, such as refs. Move this logic to componentDidMount and ' +
          'componentDidUpdate instead.',
        owner.getName() || 'A component',
      );
      owner._warnedAboutRefsInRender = true;
    }
  }
  if (componentOrElement == null) {
    return null;
  }
  if (componentOrElement.nodeType === 1) {
    return componentOrElement;
  }

  var inst = ReactInstanceMap.get(componentOrElement);
  if (inst) {
    inst = getHostComponentFromComposite(inst);
    return inst ? ReactDOMComponentTree.getNodeFromInstance(inst) : null;
  }

  if (typeof componentOrElement.render === 'function') {
    invariant(false, 'findDOMNode was called on an unmounted component.');
  } else {
    invariant(
      false,
      'Element appears to be neither ReactComponent nor DOMNode (keys: %s)',
      Object.keys(componentOrElement),
    );
  }
}

module.exports = findDOMNode;
