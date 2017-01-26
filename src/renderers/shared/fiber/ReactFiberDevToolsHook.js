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

import type { Fiber } from 'ReactFiber';
import type { FiberRoot } from 'ReactFiberRoot';

var warning = require('warning');

let rendererID = null;
if (
  typeof __REACT_DEVTOOLS_GLOBAL_HOOK__ !== 'undefined' &&
  typeof __REACT_DEVTOOLS_GLOBAL_HOOK__.supportsFiber
) {
  exports.injectInternals = function(internals : Object) {
    warning(rendererID == null, 'Cannot inject into DevTools twice.');
    rendererID = __REACT_DEVTOOLS_GLOBAL_HOOK__.inject({
      ...internals,
      // Increment when internals become incompatible with DevTools.
      // This way older DevTools can ignore newer Fiber versions.
      version: 1,
    });
  };
  exports.onCommitRoot = function(root : FiberRoot) {
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
  exports.onCommitUnmount = function(fiber : Fiber) {
    if (rendererID == null) {
      return;
    }
    try {
      __REACT_DEVTOOLS_GLOBAL_HOOK__.onCommitFiberUnmount(rendererID, fiber);
    } catch (err) {
      // Catch all errors because it is unsafe to throw in the commit phase.
      warning(false, 'React DevTools encountered an error: %s', err);
    }
  };
} else {
  exports.injectInternals = null;
  exports.onCommitRoot = null;
  exports.onCommitUnmount = null;
}
