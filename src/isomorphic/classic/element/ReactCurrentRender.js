/**
 * Copyright 2013-2015, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @providesModule ReactCurrentRender
 */

'use strict';

/**
 * Keeps track of the currently rendering component. Not always the same as
 * the current owner, which is also set on component initialization.
 */
var ReactCurrentRender = {

  /**
   * @internal
   * @type {ReactComponent}
   */
  current: null,

};

module.exports = ReactCurrentRender;
