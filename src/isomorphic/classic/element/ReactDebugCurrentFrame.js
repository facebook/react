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

let getCurrentStack: null | (() => string | null) = null;

export function setCurrentStackImplementation(
  impl: null | (() => string | null),
) {
  if (__DEV__) {
    getCurrentStack = impl;
  }
}

export function getStackAddendum(): string | null {
  if (__DEV__) {
    if (getCurrentStack) {
      return getCurrentStack();
    }
  }
  return null;
}
