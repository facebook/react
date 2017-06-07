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

var emptyFunction = require('fbjs/lib/emptyFunction');
var warning = require('fbjs/lib/warning');

import type {Fiber} from 'ReactFiber';
import type {FiberRoot} from 'ReactFiberRoot';

declare var __REACT_DEVTOOLS_GLOBAL_HOOK__: Object | void;

let didCatchErrors = false;
function tryCall(fn, rendererID, arg) {
  try {
    fn(rendererID, arg);
  } catch (err) {
    // Catch all errors from DevTools because throwing might be unsafe
    if (__DEV__) {
      warning(!didCatchErrors, 'React DevTools encountered an error: %s', err);
      didCatchErrors = true;
    }
  }
}

let rendererID = null;
let injectInternals = null;
let onRender = null;
let onCommitRoot = null;
let onCommitUnmount = null;
if (
  typeof __REACT_DEVTOOLS_GLOBAL_HOOK__ !== 'undefined' &&
  __REACT_DEVTOOLS_GLOBAL_HOOK__.supportsFiber
) {
  let {
    inject,
    onRenderFiber = emptyFunction, // Does not exist in DevTools 2.1.x and earlier
    onCommitFiberRoot,
    onCommitFiberUnmount,
  } = __REACT_DEVTOOLS_GLOBAL_HOOK__;

  injectInternals = function(internals: Object) {
    warning(rendererID == null, 'Cannot inject into DevTools twice.');
    rendererID = inject(internals);
  };

  onRender = function(root: Fiber) {
    if (rendererID == null) {
      return;
    }
    tryCall(onRenderFiber, rendererID, root);
  };

  onCommitRoot = function(root: FiberRoot) {
    if (rendererID == null) {
      return;
    }
    tryCall(onCommitFiberRoot, rendererID, root);
  };

  onCommitUnmount = function(fiber: Fiber) {
    if (rendererID == null) {
      return;
    }
    tryCall(onCommitFiberUnmount, rendererID, fiber);
  };
}

exports.injectInternals = injectInternals;
exports.onRender = onRender;
exports.onCommitRoot = onCommitRoot;
exports.onCommitUnmount = onCommitUnmount;
