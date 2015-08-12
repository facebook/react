/**
 * Copyright 2013-2015, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @providesModule processProps
 * @typechecks static-only
 */

'use strict';

var assign = require('Object.assign');

/**
 * Processes props by setting default values for unspecified props. Does not mutate its argument; returns
 * a new props object with defaults merged in.
 *
 * @param {ReactElement} element
 * @return {object}
 */
function processProps(element) {
  var props = element.props;
  var type = element.type;
  var defaultProps = type && type.defaultProps;
  // Resolve default props
  if (defaultProps) {
    var propName;
    var originalProps = props;
    for (propName in defaultProps) {
      if (typeof props[propName] === 'undefined') {
        if (props === originalProps) {
          props = assign({}, originalProps);
        }
        props[propName] = defaultProps[propName];
      }
    }
  }
  return props;
}

module.exports = processProps;
