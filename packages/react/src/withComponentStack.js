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
    const stack = ReactDebugCurrentFrame.getStackAddendum();
    if (stack !== '') {
      const length = arguments.length;
      const args = new Array(length + 1);
      for (let i = 0; i < length; i++) {
        args[i] = arguments[i];
      }
      args[length] = stack;
      console.error.apply(console, args);
    } else {
      console.error.apply(console, arguments);
    }
  };

  warn = function() {
    const stack = ReactDebugCurrentFrame.getStackAddendum();
    if (stack !== '') {
      const length = arguments.length;
      const args = new Array(length + 1);
      for (let i = 0; i < length; i++) {
        args[i] = arguments[i];
      }
      args[length] = stack;
      console.warn.apply(console, args);
    } else {
      console.warn.apply(console, arguments);
    }
  };
}

export {error, warn};
