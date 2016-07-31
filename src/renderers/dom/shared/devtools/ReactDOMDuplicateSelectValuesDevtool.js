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
var REACT_ELEMENT_TYPE = require('ReactElement').REACT_ELEMENT_TYPE;

var didWarnDupeSelectValues = false;
let values = null;
let debugId = null;

function handleElement(debugID, element) {
  
  if (didWarnDupeSelectValues) {
    return;
  }

  if (element == null) {
    return;
  }

  if (element.type !== 'select') {
    return;
  }

  if ((element.props == null) || (element.props.children == null)) {
    return;
  }

  // Only process controlled elements.
  if (element.props.hasOwnProperty('value') === false) {
    return;
  }

  values = {};
  debugId = debugID;

  checkOptions(element.props.children);
}

function checkOptions(options) {
  //  If options is not iterable make it an array.
  if (typeof options[Symbol.iterator] !== 'function') {
    options = [options];
  }

  for (const option of options) {
    if (didWarnDupeSelectValues) {
      continue;
    }
    // Check that option is a ReactElement.
    if ((option == null) || (option.$$typeof == null) || (option.$$typeof !== REACT_ELEMENT_TYPE)) {
      continue;
    }
    
    if ((option.type === 'optGroup') && (option.props != null) && (option.props.children != null)) {
      checkOptions(option.props.children);
    }
    
    if ((option.type === 'option') && (option.props != null) && (option.props.value != null)) {
      const value = option.props.value;
      if (!values.hasOwnProperty(value)) {
        values[value] = value;
      } else {
        warning(
          false,
          'Select element contains duplicate option value `%s`.%s',
          value,
          ReactComponentTreeDevtool.getStackAddendumByID(debugId)
          );
        didWarnDupeSelectValues = true;
      }
    }
  }
}

var ReactDOMDuplicateSelectValuesDevtool = {
  onBeforeMountComponent(debugID, element) {
    handleElement(debugID, element);
  },
  onBeforeUpdateComponent(debugID, element) {
    handleElement(debugID, element);
  },
};

module.exports = ReactDOMDuplicateSelectValuesDevtool;
