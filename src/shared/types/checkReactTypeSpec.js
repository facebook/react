/**
 * Copyright 2013-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @providesModule checkReactTypeSpec
 */

'use strict';

var checkPropTypes = require('checkPropTypes');

var ReactComponentTreeHook;

if (
  typeof process !== 'undefined' &&
  process.env &&
  process.env.NODE_ENV === 'test'
) {
  // Temporary hack.
  // Inline requires don't work well with Jest:
  // https://github.com/facebook/react/issues/7240
  // Remove the inline requires when we don't need them anymore:
  // https://github.com/facebook/react/pull/7178
  ReactComponentTreeHook = require('ReactComponentTreeHook');
}

function checkReactTypeSpec(
  typeSpecs,
  values,
  location: string,
  componentName,
  element,
  // It is only safe to pass fiber if it is the work-in-progress version, and
  // only during reconciliation (begin and complete phase).
  workInProgressOrDebugID
) {
  function formatMessage(message) {
    if (__DEV__) {
      let componentStackInfo = '';
      if (!ReactComponentTreeHook) {
        ReactComponentTreeHook = require('ReactComponentTreeHook');
      }
      if (workInProgressOrDebugID != null) {
        if (typeof workInProgressOrDebugID === 'number') {
          // DebugID from Stack.
          const debugID = workInProgressOrDebugID;
          componentStackInfo = ReactComponentTreeHook.getStackAddendumByID(debugID);
        } else if (typeof workInProgressOrDebugID.tag === 'number') {
          // This is a Fiber.
          // The stack will only be correct if this is a work in progress
          // version and we're calling it during reconciliation.
          const workInProgress = workInProgressOrDebugID;
          componentStackInfo = ReactComponentTreeHook.getStackAddendumByWorkInProgressFiber(workInProgress);
        }
      } else if (element !== null) {
        componentStackInfo = ReactComponentTreeHook.getCurrentStackAddendum(element);
      }
      message += componentStackInfo;
    }
    return message;
  }

  checkPropTypes(typeSpecs, values, location, componentName, formatMessage);
}

module.exports = checkReactTypeSpec;
