/**
 * Copyright 2013-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @providesModule ReactDOMUnknownComponentDevtool
 */

'use strict';

var ReactComponentTreeDevtool = require('ReactComponentTreeDevtool');
var warning = require('warning');
var ReactDOMFactories = require('ReactDOMFactories');
var didWarnAboutCase = false;

function handleElement(debugID, element) {
  if (element == null || typeof element.type !== 'string' ||
    element.type.match(/\-|\s+/) !== null ||
    ReactDOMFactories.hasOwnProperty(element.type)) {
    return;
  }

  var invalidElement = document.createElement(element.type) instanceof
    HTMLUnknownElement;

  if (!didWarnAboutCase && invalidElement) {
    warning(false,
      'Unknown element %s. Did you miss-spell an HTML tag name? ' +
      'If you are using a custom component, make sure your custom component ' +
      'starts with an upper-case letter.%s',
      element.type,
      ReactComponentTreeDevtool.getStackAddendumByID(debugID)
    );
    didWarnAboutCase = true;
  }
}

var ReactDOMUnknownComponentDevtool = {
  onBeforeMountComponent(debugID, element) {
    handleElement(debugID, element);
  },
  onBeforeUpdateComponent(debugID, element) {
    handleElement(debugID, element);
  },
};
module.exports = ReactDOMUnknownComponentDevtool;
