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

if (__DEV__) {
  var warning = require('fbjs/lib/warning');
  var {ReactDebugCurrentFrame} = require('ReactGlobalSharedState');
}

var didWarnValueNull = false;

function getStackAddendum() {
  var stack = ReactDebugCurrentFrame.getStackAddendum();
  return stack != null ? stack : '';
}

function validateProperties(type, props) {
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
      getStackAddendum(),
    );

    didWarnValueNull = true;
  }
}

var ReactDOMNullInputValuePropHook = {
  validateProperties,
};

module.exports = ReactDOMNullInputValuePropHook;
