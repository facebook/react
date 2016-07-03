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

  const values = {};

  checkOptions(element.props.children, values, debugID);
}

function checkOptions(options, values, debugID) {
  //  If options is not iterable make it an array.
  if (typeof options[Symbol.iterator] !== 'function') {
    options = [options];
  }

  for (const option of options) {
    // Check that option is a React element.
    if ((option.$$typeof == null) || (option.$$typeof !== REACT_ELEMENT_TYPE)) {
      continue;
    }

    if (option.type === 'optGroup') {
      if ((option.props != null) && (option.props.children != null)) {
        checkOptions(option.props.children, values, debugID);
      }
    }
    
    if (option.type === 'option') {
      if ((option.props != null) && (option.props.value != null)) {
        const value = option.props.value;
        if (!values.hasOwnProperty(value)) {
          values[value] = value;
        } else {
          warning(
            false,
            'Select element contains duplicate option value `%s`.%s',
            value,
            ReactComponentTreeDevtool.getStackAddendumByID(debugID)
            );
          didWarnDupeSelectValues = true;
        }
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
