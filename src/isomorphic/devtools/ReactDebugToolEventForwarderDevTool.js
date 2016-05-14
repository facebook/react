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
  onNativeOperation(debugID, type, payload) {
    ReactDOMDebugTool.onNativeOperation(debugID, type, payload);
  },
  onSetState() {
    ReactDOMDebugTool.onSetState();
  },
  onSetDisplayName(debugID, displayName) {
    ReactDOMDebugTool.onSetDisplayName(debugID, displayName);
  },
  onSetChildren(debugID, childDebugIDs) {
    ReactDOMDebugTool.onSetChildren(debugID, childDebugIDs);
  },
  onSetOwner(debugID, ownerDebugID) {
    ReactDOMDebugTool.onSetOwner(debugID, ownerDebugID);
  },
  onSetText(debugID, text) {
    ReactDOMDebugTool.onSetText(debugID, text);
  },
  onMountRootComponent(debugID) {
    ReactDOMDebugTool.onMountRootComponent(debugID);
  },
  onMountComponent(debugID) {
    ReactDOMDebugTool.onMountComponent(debugID);
  },
  onUpdateComponent(debugID) {
    ReactDOMDebugTool.onUpdateComponent(debugID);
  },
  onUnmountComponent(debugID) {
    ReactDOMDebugTool.onUnmountComponent(debugID);
  },
};

module.exports = ReactDebugToolEventForwarderDevTool;
