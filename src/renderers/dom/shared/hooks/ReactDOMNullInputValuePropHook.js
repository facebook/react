/**
 * Copyright 2013-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @providesModule ReactDOMNullInputValuePropHook
 */

'use strict';

var ReactDebugCurrentFiber = require('ReactDebugCurrentFiber');
var warning = require('fbjs/lib/warning');

if (__DEV__) {
  var {
    getStackAddendumByID,
  } = require('react/lib/ReactComponentTreeHook');
}

var didWarnValueNull = false;

function getStackAddendum(debugID) {
  if (debugID != null) {
    // This can only happen on Stack
    return getStackAddendumByID && getStackAddendumByID(debugID);
  } else {
    // This can only happen on Fiber
    return ReactDebugCurrentFiber.getCurrentFiberStackAddendum();
  }
}

function validateProperties(type, props, debugID /* Stack only */) {
  if (type !== 'input' && type !== 'textarea' && type !== 'select') {
    return;
  }
  if (props != null && props.value === null && !didWarnValueNull) {
    warning(
      false,
      '`value` prop on `%s` should not be null. ' +
      'Consider using the empty string to clear the component or `undefined` ' +
      'for uncontrolled components.%s',
      type,
      getStackAddendum(debugID)
    );

    didWarnValueNull = true;
  }
}

var ReactDOMNullInputValuePropHook = {
  // Fiber
  validateProperties,
  // Stack
  onBeforeMountComponent(debugID, element) {
    if (__DEV__ && element != null && typeof element.type === 'string') {
      validateProperties(element.type, element.props, debugID);
    }
  },
  onBeforeUpdateComponent(debugID, element) {
    if (__DEV__ && element != null && typeof element.type === 'string') {
      validateProperties(element.type, element.props, debugID);
    }
  },
};

module.exports = ReactDOMNullInputValuePropHook;
