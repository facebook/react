/**
 * Copyright (c) 2013-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

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

export default ReactDebugCurrentFrame;
