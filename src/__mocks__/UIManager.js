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
  clearJSResponder: jest.fn(),
  createView: jest.fn(),
  setJSResponder: jest.fn(),
  setChildren: jest.fn(),
  manageChildren: jest.fn(),
  updateView: jest.fn(),
  removeSubviewsFromContainerWithID: jest.fn(),
  replaceExistingNonRootView: jest.fn(),
  __takeSnapshot: jest.fn(),
  customBubblingEventTypes: {
    topBlur: {
      phasedRegistrationNames: {
        bubbled: 'onBlur',
        captured: 'onBlurCapture',
      },
    },
    topFocus: {
      phasedRegistrationNames: {
        bubbled: 'onFocus',
        captured: 'onFocusCapture',
      },
    },
    topTouchCancel: {
      phasedRegistrationNames: {
        bubbled: 'onTouchCancel',
        captured: 'onTouchCancelCapture',
      },
    },
    topTouchEnd: {
      phasedRegistrationNames: {
        bubbled: 'onTouchEnd',
        captured: 'onTouchEndCapture',
      },
    },
    topTouchMove: {
      phasedRegistrationNames: {
        bubbled: 'onTouchMove',
        captured: 'onTouchMoveCapture',
      },
    },
    topTouchStart: {
      phasedRegistrationNames: {
        bubbled: 'onTouchStart',
        captured: 'onTouchStartCapture',
      },
    },
  },
  customDirectEventTypes: {
    topAccessibilityTap: {
      registrationName: 'onAccessibilityTap',
    },
    topTextLayout: {
      registrationName: 'onTextLayout',
    },
  },
};

module.exports = RCTUIManager;
