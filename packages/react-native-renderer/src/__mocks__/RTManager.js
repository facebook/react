/**
 * Copyright (c) 2013-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

'use strict';

// Mock of the Native Hooks

const RCTRTManager = {
  createNode: jest.fn(function createView(tag, classType, props) {}),
  beginUpdates: jest.fn(function beginUpdates() {}),
  appendChildToContext: jest.fn(function appendChildToContext(
    contextTag,
    childTag,
  ) {}),
  appendChild: jest.fn(function appendChild(parentTag, childTag) {}),
  prependChild: jest.fn(function prependChild(childTag, beforeTag) {}),
  deleteChild: jest.fn(function deleteChild(childTag) {}),
  updateNode: jest.fn(function updateNode(tag, props) {}),
  completeUpdates: jest.fn(function completeUpdates() {}),
};

module.exports = RCTRTManager;
