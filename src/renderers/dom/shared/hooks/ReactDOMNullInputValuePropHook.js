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

var ReactComponentTreeHook = require('ReactComponentTreeHook');

var warning = require('warning');

var didWarnValueNull = false;

function handleElement(debugID, element) {
  if (element == null) {
    return;
  }
  if (
    element.type !== 'input' &&
    element.type !== 'textarea' &&
    element.type !== 'select'
  ) {
    return;
  }
  if (
    element.props != null &&
    element.props.value === null &&
    !didWarnValueNull
  ) {
    warning(
      false,
      '`value` prop on `%s` should not be null. ' +
        'Consider using the empty string to clear the component or `undefined` ' +
        'for uncontrolled components.%s',
      element.type,
      ReactComponentTreeHook.getStackAddendumByID(debugID),
    );

    didWarnValueNull = true;
  }
}

var ReactDOMNullInputValuePropHook = {
  onBeforeMountComponent(debugID, element) {
    handleElement(debugID, element);
  },
  onBeforeUpdateComponent(debugID, element) {
    handleElement(debugID, element);
  },
};

module.exports = ReactDOMNullInputValuePropHook;
