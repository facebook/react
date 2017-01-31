/**
 * Copyright 2013-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @providesModule findDOMNode
 * @flow
 */

var ReactCurrentOwner = require('ReactCurrentOwner');
var ReactInstanceMap = require('ReactInstanceMap');

var getComponentName = require('getComponentName');
var invariant = require('invariant');
var warning = require('warning');

let findFiber = function(arg) {
  invariant(false, 'Missing injection for fiber findDOMNode');
};
let findStack = function(arg) {
  invariant(false, 'Missing injection for stack findDOMNode');
};

const findDOMNode = function(componentOrElement : Element | ?ReactComponent<any, any, any>) : null | Element | Text {
  if (__DEV__) {
    var owner = ReactCurrentOwner.current;
    if (owner !== null && '_warnedAboutRefsInRender' in owner) {
      warning(
        (owner: any)._warnedAboutRefsInRender,
        '%s is accessing findDOMNode inside its render(). ' +
        'render() should be a pure function of props and state. It should ' +
        'never access something that requires stale data from the previous ' +
        'render, such as refs. Move this logic to componentDidMount and ' +
        'componentDidUpdate instead.',
        getComponentName(owner) || 'A component'
      );
      (owner: any)._warnedAboutRefsInRender = true;
    }
  }
  if (componentOrElement == null) {
    return null;
  }
  if ((componentOrElement: any).nodeType === 1) {
    return (componentOrElement: any);
  }

  var inst = ReactInstanceMap.get(componentOrElement);
  if (inst) {
    if (typeof inst.tag === 'number') {
      return findFiber(inst);
    } else {
      return findStack(inst);
    }
  }

  if (typeof componentOrElement.render === 'function') {
    invariant(
      false,
      'Unable to find node on an unmounted component.'
    );
  } else {
    invariant(
      false,
      'Element appears to be neither ReactComponent nor DOMNode. Keys: %s',
      Object.keys(componentOrElement)
    );
  }
};

findDOMNode._injectFiber = function(fn) {
  findFiber = fn;
};
findDOMNode._injectStack = function(fn) {
  findStack = fn;
};

module.exports = findDOMNode;
