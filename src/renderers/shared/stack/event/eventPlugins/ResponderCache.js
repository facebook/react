/**
 * Copyright 2013-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @providesModule ResponderCache
 */

'use strict';

const EventPluginUtils = require('EventPluginUtils');

const emptyFunction = require('emptyFunction');

// Each active responder (by its react tag).
const activeResponders = Object.create(null);

// Set this to handle responder grant/release/terminate events.
exports.globalHandler = {onChange: emptyFunction};

exports.hasResponder = function(responderInst) {
  const nodeTag = EventPluginUtils.getNodeFromInstance(responderInst);
  return activeResponders[nodeTag] != null;
};

exports.onResponderGrant = function(responderInst, blockHostResponder) {
  const nodeTag = EventPluginUtils.getNodeFromInstance(responderInst);
  activeResponders[nodeTag] = responderInst;
  this.globalHandler.onChange(null, responderInst, blockHostResponder);
};

exports.onResponderEnd = function(responderInst) {
  const nodeTag = EventPluginUtils.getNodeFromInstance(responderInst);
  delete activeResponders[nodeTag];
  this.globalHandler.onChange(responderInst, null);
};

exports.findAncestor = function(targetInst) {
  let parentInst = typeof targetInst === 'number' ?
    EventPluginUtils.getInstanceFromNode(targetInst) :
    targetInst;

  while (parentInst != null) {
    let parentTag = EventPluginUtils.getNodeFromInstance(parentInst);
    if (activeResponders[parentTag]) {
      return activeResponders[parentTag];
    }
    parentInst = EventPluginUtils.getParentInstance(parentInst);
  }

  return null;
};
