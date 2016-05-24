/**
 * Copyright 2013-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
* @providesModule getCssClassFromProps
*/

'use strict';

var warning = require('warning');

/**
 * Takes in an props (or an element) and returns the CSS class prop.
 */
function getCssClassFromProps(props) {
  if (__DEV__) {
    getCssClassFromProps.isExecuting = true;
    warning(
      props.className == null || props.class == null || props.class === props.className,
      'props.className and props.class should have the same values'
    );
  }
  var cls = props.className || props.class;
  if (__DEV__) {
    getCssClassFromProps.isExecuting = false;
  }
  return cls;
}

getCssClassFromProps.isExecuting = false;

module.exports = getCssClassFromProps;
