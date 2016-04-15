/**
 * Copyright 2013-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @providesModule ReactDebugToolEventForwarderDevTool
 */

'use strict';

var ReactDOMDebugTool = require('ReactDOMDebugTool');

var ReactDebugToolEventForwarderDevTool = {
  onBeginProcessingChildContext() {
    ReactDOMDebugTool.onBeginProcessingChildContext();
  },
  onEndProcessingChildContext() {
    ReactDOMDebugTool.onEndProcessingChildContext();
  },
  onSetState() {
    ReactDOMDebugTool.onSetState();
  },
  onMountRootComponent(internalInstance) {
    ReactDOMDebugTool.onMountRootComponent(internalInstance);
  },
  onMountComponent(internalInstance) {
    ReactDOMDebugTool.onMountComponent(internalInstance);
  },
  onUpdateComponent(internalInstance) {
    ReactDOMDebugTool.onUpdateComponent(internalInstance);
  },
  onUnmountComponent(internalInstance) {
    ReactDOMDebugTool.onUnmountComponent(internalInstance);
  },
};

module.exports = ReactDebugToolEventForwarderDevTool;
