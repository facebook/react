/**
 * Copyright (c) 2013-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import warning from 'shared/warning';
import ReactSharedInternals from 'shared/ReactSharedInternals';

let warningWithStack = warning;

if (__DEV__) {
  // TODO: wrap calls to it with a transform
  warningWithStack = function(condition, format, ...args) {
    if (!condition) {
      const ReactDebugCurrentFrame =
        ReactSharedInternals.ReactDebugCurrentFrame;
      const stack = ReactDebugCurrentFrame.getStackAddendum();
      warning(false, format + '%s', ...args, stack);
    }
  };
}

export default warningWithStack;
