/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import ReactSharedInternals from 'shared/ReactSharedInternals';

let getComponentStack = function() {
  return '';
};

if (__DEV__) {
  const ReactDebugCurrentFrame = ReactSharedInternals.ReactDebugCurrentFrame;

  getComponentStack = function() {
    return ReactDebugCurrentFrame.getStackAddendum();
  };
}

export default getComponentStack;
