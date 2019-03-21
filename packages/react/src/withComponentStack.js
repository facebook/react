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

  error = (...args) => {
    const stack = ReactDebugCurrentFrame.getStackAddendum();
    if (stack !== '') {
      console.error(...args, stack);
    } else {
      console.error(...args);
    }
  };

  warn = (...args) => {
    const stack = ReactDebugCurrentFrame.getStackAddendum();
    if (stack !== '') {
      console.warn(...args, stack);
    } else {
      console.warn(...args);
    }
  };
}

export {error, warn};
