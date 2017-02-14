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

var ReactPropTypesSecret = require('ReactPropTypesSecret');

var invariant = require('invariant');
var warning = require('warning');

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

var loggedTypeFailures = {};

/**
 * Assert that the values match with the type specs.
 * Error messages are memorized and will only be shown once.
 *
 * @param {object} typeSpecs Map of name to a ReactPropType
 * @param {object} values Runtime values that need to be type-checked
 * @param {string} location e.g. "prop", "context", "child context"
 * @param {string} componentName Name of the component for error messages.
 * @param {?object} element The React element that is being type-checked
 * @param {?number} workInProgressOrDebugID The React component instance that is being type-checked
 * @private
 */
function checkReactTypeSpec(
  typeSpecs,
  values,
  location: string,
  componentName,
  element,
  // It is only safe to pass fiber if it is the work-in-progress version, and
  // only during reconciliation (begin and complete phase).
  workInProgressOrDebugID,
) {
  for (var typeSpecName in typeSpecs) {
    if (typeSpecs.hasOwnProperty(typeSpecName)) {
      var error;
      // Prop type validation may throw. In case they do, we don't want to
      // fail the render phase where it didn't fail before. So we log it.
      // After these have been cleaned up, we'll let them throw.
      try {
        // This is intentionally an invariant that gets caught. It's the same
        // behavior as without this statement except with a better message.
        invariant(
          typeof typeSpecs[typeSpecName] === 'function',
          '%s: %s type `%s` is invalid; it must be a function, usually from ' +
          'React.PropTypes.',
          componentName || 'React class',
          location,
          typeSpecName
        );
        error = typeSpecs[typeSpecName](values, typeSpecName, componentName, location, null, ReactPropTypesSecret);
      } catch (ex) {
        error = ex;
      }
      warning(
        !error || error instanceof Error,
        '%s: type specification of %s `%s` is invalid; the type checker ' +
        'function must return `null` or an `Error` but returned a %s. ' +
        'You may have forgotten to pass an argument to the type checker ' +
        'creator (arrayOf, instanceOf, objectOf, oneOf, oneOfType, and ' +
        'shape all require an argument).',
        componentName || 'React class',
        location,
        typeSpecName,
        typeof error
      );
      if (error instanceof Error && !(error.message in loggedTypeFailures)) {
        // Only monitor this failure once because there tends to be a lot of the
        // same error.
        loggedTypeFailures[error.message] = true;

        var componentStackInfo = '';

        if (__DEV__) {
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
        }

        warning(
          false,
          'Failed %s type: %s%s',
          location,
          error.message,
          componentStackInfo
        );
      }
    }
  }
}

module.exports = checkReactTypeSpec;
