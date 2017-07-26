/**
 * Copyright 2013-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @providesModule ReactDebugCurrentFrame
 * @flow
 */

'use strict';

const ReactDebugCurrentFrame = {};

if (__DEV__) {
  // Component that is being worked on
  ReactDebugCurrentFrame.getCurrentStack = (null: null | (() => string | null));

  ReactDebugCurrentFrame.getStackAddendum = function(): string | null {
    const impl = ReactDebugCurrentFrame.getCurrentStack;
    if (impl) {
      return impl();
    }
    return null;
  };
}

module.exports = ReactDebugCurrentFrame;
