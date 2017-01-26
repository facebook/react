/**
 * Copyright 2013-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @providesModule ReactFiberDevToolsHook
 * @flow
 */

/* globals __REACT_DEVTOOLS_GLOBAL_HOOK__ */

'use strict';

var emptyFunction = require('emptyFunction');
var warning = require('warning');

let rendererID = null;
if (
  typeof __REACT_DEVTOOLS_GLOBAL_HOOK__ !== 'undefined' &&
  typeof __REACT_DEVTOOLS_GLOBAL_HOOK__.onCommitFiberRoot === 'function'
) {
  exports.injectInternals = function(internals) {
    warning(rendererID == null, 'Cannot inject into DevTools twice.');
    rendererID = __REACT_DEVTOOLS_GLOBAL_HOOK__.inject({
      isFiber: true,
      // TODO: pass a version number so we can change the internals more safely.
      // Currently DevTools just use duck typing.
      ...internals,
    });
  };
  exports.onCommitRoot = function(root) {
    if (rendererID == null) {
      return;
    }
    try {
      __REACT_DEVTOOLS_GLOBAL_HOOK__.onCommitFiberRoot(rendererID, root);
    } catch (err) {
      // Catch all errors because it is unsafe to throw in the commit phase.
      warning(false, 'React DevTools encountered an error: %s', err);
    }
  };
  exports.onCommitUnmount = function(fiber) {
    if (rendererID == null) {
      return;
    }
    try {
      __REACT_DEVTOOLS_GLOBAL_HOOK__.onCommitFiberUnmount(rendererID, fiber);
    } catch (err) {
      // Catch all errors because it is unsafe to throw in the commit phase.
      warning(false, 'React DevTools encountered an error: %s', err);
    }
  }
} else {
  exports.injectInternals = null;
  exports.onCommitRoot = null;
  exports.onCommitUnmount = null;
}
