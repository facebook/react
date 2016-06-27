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
var areEqual = require('areEqual');

var didWarnDupeSelectValues = false;

function handleElement(debugID, element) {
  if (element == null) {
    return;
  }

  if (element.type !== 'select') {
    return;
  }

  if ((element.props == null) || (element.props.children == null)) {
    return;
  }

  // Uncontrolled select elements can have duplicate values.
  if (element.props.hasOwnProperty('defaultValue')) {
    return;
  }

  if (!didWarnDupeSelectValues) {
    let values = [];
    let options = element.props.children;

    //  If options is not iterable make it an array.
    if (typeof options[Symbol.iterator] !== 'function') {
      options = [options];
    }

    // Combine the values from all options into a single array.
    for (const option of options) {
      if (option.type === 'optGroup') {
        if ((option.props != null) && (option.props.children != null)) {
          let groupOptions = option.props.children;
          //  If groupOptions is not iterable make it an array.
          if (typeof groupOptions[Symbol.iterator] !== 'function') {
            groupOptions = [groupOptions];
          }
          for (const groupOption of groupOptions) {
            if ((groupOption.props != null) && (groupOption.props.value != null)) {
              values.push(groupOption.props.value);
            }
          }
        }
      }

      if (option.type === 'option') {
        if ((option.props != null) && (option.props.value)) {
          values.push(option.props.value);
        }
      }
    }

    if (values.length <= 1) {
      return;
    }

    // Check the array for duplicate values.
    for (var i = 0; i < values.length-1; i++) {
      for (var j = i + 1; j < values.length; j++) {
        if (areEqual(values[i], values[j])) {
          warning(
              false,
              'Select element contains duplicate option value `%s` in options #%s & #%s.%s',
              values[i], i, j,
              ReactComponentTreeDevtool.getStackAddendumByID(debugID)
            );
          didWarnDupeSelectValues = true;
          return;
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
