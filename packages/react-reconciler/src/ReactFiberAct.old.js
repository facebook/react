/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import type {Fiber} from './ReactFiber.old';
import {warnsIfNotActing} from './ReactFiberHostConfig';

export function isActEnvironment(fiber: Fiber) {
  if (__DEV__) {
    const isReactActEnvironmentGlobal =
      // $FlowExpectedError – Flow doesn't know about IS_REACT_ACT_ENVIRONMENT global
      typeof IS_REACT_ACT_ENVIRONMENT !== 'undefined'
        ? IS_REACT_ACT_ENVIRONMENT
        : undefined;

    // TODO: Only check `jest` in legacy mode. In concurrent mode, this
    // heuristic is replaced by IS_REACT_ACT_ENVIRONMENT.
    // $FlowExpectedError - Flow doesn't know about jest
    const jestIsDefined = typeof jest !== 'undefined';
    return (
      warnsIfNotActing &&
      jestIsDefined &&
      // Legacy mode assumes an act environment whenever `jest` is defined, but
      // you can still turn off spurious warnings by setting
      // IS_REACT_ACT_ENVIRONMENT explicitly to false.
      isReactActEnvironmentGlobal !== false
    );
  }
  return false;
}
