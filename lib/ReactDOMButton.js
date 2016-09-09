/**
 * Copyright 2013-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @providesModule ReactDOMButton
 */

'use strict';

var DisabledInputUtils = require('./DisabledInputUtils');

/**
 * Implements a <button> host component that does not receive mouse events
 * when `disabled` is set.
 */
var ReactDOMButton = {
  getHostProps: DisabledInputUtils.getHostProps
};

module.exports = ReactDOMButton;