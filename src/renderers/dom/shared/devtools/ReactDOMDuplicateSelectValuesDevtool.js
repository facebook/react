/**
 * Copyright 2013-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @providesModule ReactDOMDuplicateSelectValuesDevtool
 */

'use strict';

var ReactComponentTreeDevtool = require('ReactComponentTreeDevtool');

var warning = require('warning');

var didWarnDupeSelectValues = false;

function handleElement(debugID, element) {
  if (element == null) {
    return;
  }
  if (element.type !== 'select') {
    return;
  }

  if (element.props != null && element.props.value === null && !didWarnDupeSelectValues) {

    console.log('TEST');

    /*
    warning(
      false,
      '`value` prop on `%s` should not be null. ' +
      'Consider using the empty string to clear the component or `undefined` ' +
      'for uncontrolled components.%s',
      element.type,
      ReactComponentTreeDevtool.getStackAddendumByID(debugID)
    );
    */
    didWarnDupeSelectValues = true;
  }
}


//  *** see if need different events in here
// Look at old version of the DOMInput and see what events it listened to before refactoring.
// * Did not use in an event. Just moved code. Check 7040 updates.
// Need to remove my updates to ReactDOMSelect.js. Move stuff to Devtools.
// Look for an example of using this module.

var ReactDOMDuplicateSelectValuesDevtool = {
  onBeforeMountComponent(debugID, element) {
    handleElement(debugID, element);
  },
  onBeforeUpdateComponent(debugID, element) {
    handleElement(debugID, element);
  },
};

module.exports = ReactDOMDuplicateSelectValuesDevtool;
