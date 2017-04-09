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

'use strict';

var warning = require('fbjs/lib/warning');

import type {Fiber} from 'ReactFiber';
import type {FiberRoot} from 'ReactFiberRoot';

declare var __REACT_DEVTOOLS_GLOBAL_HOOK__: Object | void;

let rendererID = null;
let injectInternals = null;
let onCommitRoot = null;
let onCommitUnmount = null;
if (
  typeof __REACT_DEVTOOLS_GLOBAL_HOOK__ !== 'undefined' &&
  __REACT_DEVTOOLS_GLOBAL_HOOK__.supportsFiber
) {
  let {
    inject,
    onCommitFiberRoot,
    onCommitFiberUnmount,
  } = __REACT_DEVTOOLS_GLOBAL_HOOK__;

  injectInternals = function(internals: Object) {
    warning(rendererID == null, 'Cannot inject into DevTools twice.');
    rendererID = inject(internals);
  };

  onCommitRoot = function(root: FiberRoot) {
    if (rendererID == null) {
      return;
    }
    try {
      onCommitFiberRoot(rendererID, root);
    } catch (err) {
      // Catch all errors because it is unsafe to throw in the commit phase.
      if (__DEV__) {
        warning(false, 'React DevTools encountered an error: %s', err);
      }
    }
  };

  onCommitUnmount = function(fiber: Fiber) {
    if (rendererID == null) {
      return;
    }
    try {
      onCommitFiberUnmount(rendererID, fiber);
    } catch (err) {
      // Catch all errors because it is unsafe to throw in the commit phase.
      if (__DEV__) {
        warning(false, 'React DevTools encountered an error: %s', err);
      }
    }
  };
}

exports.injectInternals = injectInternals;
exports.onCommitRoot = onCommitRoot;
exports.onCommitUnmount = onCommitUnmount;
