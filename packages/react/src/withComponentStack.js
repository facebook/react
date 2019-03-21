/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import ReactSharedInternals from 'shared/ReactSharedInternals';

function noop() {}

let error = noop;
let warn = noop;
if (__DEV__) {
  const ReactDebugCurrentFrame = ReactSharedInternals.ReactDebugCurrentFrame;

  error = function() {
    const args = [];
    for (let i = 0; i < arguments.length; i++) {
      args[i] = arguments[i];
    }
    const stack = ReactDebugCurrentFrame.getStackAddendum();
    if (stack !== '') {
      console.error.apply(console, args.concat(stack));
    } else {
      console.error.apply(console, args);
    }
  };

  warn = function() {
    const args = [];
    for (let i = 0; i < arguments.length; i++) {
      args[i] = arguments[i];
    }
    const stack = ReactDebugCurrentFrame.getStackAddendum();
    if (stack !== '') {
      console.warn.apply(console, args.concat(stack));
    } else {
      console.warn.apply(console, args);
    }
  };
}

export {error, warn};
