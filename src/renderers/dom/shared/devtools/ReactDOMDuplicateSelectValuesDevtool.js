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

  // Uncontrolled select elements can have duplicate values.
  if (element.props.hasOwnProperty('defaultValue')) {
    return;
  }

  let values = {};
  let options = element.props.children;

  //  If options is not iterable make it an array.
  if (typeof options[Symbol.iterator] !== 'function') {
    options = [options];
  }

  for (const option of options) {
    if (option.type === 'optGroup') {
      if ((option.props != null) && (option.props.children != null)) {
        let groupOptions = option.props.children;
        if (typeof groupOptions[Symbol.iterator] !== 'function') {
          groupOptions = [groupOptions];
        }
        for (const groupOption of groupOptions) {
          if ((groupOption.props != null) && (groupOption.props.value != null)) {
            const value = groupOption.props.value;
            if (!values[value]) {
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

    if (option.type === 'option') {
      if ((option.props != null) && (option.props.value)) {
        const value = option.props.value;
        if (!values[value]) {
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
