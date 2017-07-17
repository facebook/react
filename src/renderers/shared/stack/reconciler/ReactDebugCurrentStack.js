/**
 * Copyright 2013-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @providesModule ReactDebugCurrentStack
 * @flow
 */

'use strict';

import type {DebugID} from 'ReactInstanceType';

const ReactDebugCurrentStack = {};

if (__DEV__) {
  var {ReactComponentTreeHook} = require('ReactGlobalSharedState');
  var {getStackAddendumByID, getCurrentStackAddendum} = ReactComponentTreeHook;

  // Component that is being worked on
  ReactDebugCurrentStack.current = (null: DebugID | null);

  ReactDebugCurrentStack.getStackAddendum = function(): string | null {
    let stack = null;
    const current = ReactDebugCurrentStack.current;
    if (current !== null) {
      stack = getStackAddendumByID(current);
    } else {
      stack = getCurrentStackAddendum();
    }
    return stack;
  };
}

module.exports = ReactDebugCurrentStack;
