/**
 * Copyright 2016-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @providesModule ReactInvalidSetStateWarningHook
 * @flow
 */

'use strict';

var warning = require('fbjs/lib/warning');

var ReactInvalidSetStateWarningHook = {};

if (__DEV__) {
  var processingChildContext = false;

  var warnInvalidSetState = function() {
    warning(
      !processingChildContext,
      'setState(...): Cannot call setState() inside getChildContext()',
    );
  };

  ReactInvalidSetStateWarningHook = {
    onBeginProcessingChildContext(): void {
      processingChildContext = true;
    },
    onEndProcessingChildContext(): void {
      processingChildContext = false;
    },
    onSetState(): void {
      warnInvalidSetState();
    },
  };
}

module.exports = ReactInvalidSetStateWarningHook;
