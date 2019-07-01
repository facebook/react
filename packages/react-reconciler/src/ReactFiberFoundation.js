/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

export function createFoundationInstance(currentFiber, props, impl, state) {
  return {
    currentFiber,
    impl,
    node: null,
    prevProps: null,
    props,
    rootEventTypes: null,
    state,
  };
}
