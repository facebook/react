/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @providesModule ReactNativeGlobalInteractionHandler
 * @flow
 */
'use strict';

var InteractionManager = require('InteractionManager');

// Interaction handle is created/cleared when responder is granted or
// released/terminated.
var interactionHandle = null;

var ReactNativeGlobalInteractionHandler = {
  onChange: function(numberActiveTouches: number) {
    if (numberActiveTouches === 0) {
      if (interactionHandle) {
        InteractionManager.clearInteractionHandle(interactionHandle);
        interactionHandle = null;
      }
    } else if (!interactionHandle) {
      interactionHandle = InteractionManager.createInteractionHandle();
    }
  }
};

module.exports = ReactNativeGlobalInteractionHandler;
