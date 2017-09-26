/**
 * Copyright (c) 2013-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
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
