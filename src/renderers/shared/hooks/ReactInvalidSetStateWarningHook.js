/**
 * Copyright (c) 2016-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @providesModule ReactInvalidSetStateWarningHook
 * @flow
 */

'use strict';

var warning = require('warning');

if (__DEV__) {
  var processingChildContext = false;

  var warnInvalidSetState = function() {
    warning(
      !processingChildContext,
      'setState(...): Cannot call setState() inside getChildContext()',
    );
  };
}

var ReactInvalidSetStateWarningHook = {
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

module.exports = ReactInvalidSetStateWarningHook;
