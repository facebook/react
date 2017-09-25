/**
 * Copyright (c) 2013-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
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
