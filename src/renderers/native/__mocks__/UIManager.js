/**
 * Copyright 2013-2015, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

'use strict';

// Mock of the Native Hooks

var RCTUIManager = {
  createView: jest.fn(),
  setChildren: jest.fn(),
  manageChildren: jest.fn(),
  updateView: jest.fn(),
  removeSubviewsFromContainerWithID: jest.fn(),
  replaceExistingNonRootView: jest.fn(),
};

module.exports = RCTUIManager;
