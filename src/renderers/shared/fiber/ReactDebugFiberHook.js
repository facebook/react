/**
 * Copyright 2013-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @providesModule ReactDebugFiberHook
 * @flow
 */

/* globals __REACT_DEVTOOLS_GLOBAL_HOOK__ */

'use strict';

if (__DEV__) {
  var warning = require('warning');

  const supportsDevTools = (
    typeof __REACT_DEVTOOLS_GLOBAL_HOOK__ !== 'undefined' &&
    typeof __REACT_DEVTOOLS_GLOBAL_HOOK__.onCommitFiberRoot === 'function'
  );
  let rendererID = null;

  exports.injectInternals = function(internals) {
    if (!supportsDevTools) {
      return;
    }
    warning(rendererID == null, 'Cannot inject into DevTools twice.');
    rendererID = __REACT_DEVTOOLS_GLOBAL_HOOK__.inject({
      isFiber: true,
      ...internals,
    });
  };

  exports.onCommitUnmount = function(fiber) {
    if (!supportsDevTools || rendererID == null) {
      return;
    }
    try {
      __REACT_DEVTOOLS_GLOBAL_HOOK__.onCommitFiberUnmount(rendererID, fiber);
    } catch (err) {
      // Catch all errors because it is unsafe to throw in the commit phase.
      warning(false, 'React DevTools encountered an error: %s', err);
    }
  }

  exports.onCommitRoot = function(root) {
    if (!supportsDevTools || rendererID == null) {
      return;
    }
    try {
      __REACT_DEVTOOLS_GLOBAL_HOOK__.onCommitFiberRoot(rendererID, root);
    } catch (err) {
      // Catch all errors because it is unsafe to throw in the commit phase.
      warning(false, 'React DevTools encountered an error: %s', err);
    }
  };
}
