/**
 * Copyright (c) 2013-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

export type ReactDebugCurrentFrameDev = {|
  getCurrentStack: null | (() => string),
  getStackAddendum: () => string,
|};

const ReactDebugCurrentFrame = {};

if (__DEV__) {
  // Component that is being worked on
  ((ReactDebugCurrentFrame: any): ReactDebugCurrentFrameDev).getCurrentStack = null;
  ((ReactDebugCurrentFrame: any): ReactDebugCurrentFrameDev).getStackAddendum = function() {
    const impl = ReactDebugCurrentFrame.getCurrentStack;
    if (impl) {
      return impl() || '';
    }
    return '';
  };
}

export default ReactDebugCurrentFrame;
