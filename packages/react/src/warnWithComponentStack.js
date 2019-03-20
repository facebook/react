/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import ReactSharedInternals from 'shared/ReactSharedInternals';

let warnWithComponentStack = (...args) => console.error(...args);
if (__DEV__) {
  warnWithComponentStack = (...args) => {
    const ReactDebugCurrentFrame = ReactSharedInternals.ReactDebugCurrentFrame;
    const stack = ReactDebugCurrentFrame.getStackAddendum();
    if (stack !== '') {
      console.error(...args, stack);
    } else {
      console.error(...args);
    }
  };
}

export default warnWithComponentStack;
