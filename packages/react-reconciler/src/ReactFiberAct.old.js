/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import type {Fiber} from './ReactFiber.old';

import ReactSharedInternals from 'shared/ReactSharedInternals';

import {warnsIfNotActing} from './ReactFiberHostConfig';
import {ConcurrentMode} from './ReactTypeOfMode';

const {ReactCurrentActQueue} = ReactSharedInternals;

export function isActEnvironment(fiber: Fiber) {
  if (__DEV__) {
    const isReactActEnvironmentGlobal =
      // $FlowExpectedError – Flow doesn't know about IS_REACT_ACT_ENVIRONMENT global
      typeof IS_REACT_ACT_ENVIRONMENT !== 'undefined'
        ? IS_REACT_ACT_ENVIRONMENT
        : undefined;

    if (fiber.mode & ConcurrentMode) {
      if (
        !isReactActEnvironmentGlobal &&
        ReactCurrentActQueue.current !== null
      ) {
        // TODO: Include link to relevant documentation page.
        console.error(
          'The current testing environment is not configured to support ' +
            'act(...)',
        );
      }
      return isReactActEnvironmentGlobal;
    } else {
      // Legacy mode. We preserve the behavior of React 17's act. It assumes an
      // act environment whenever `jest` is defined, but you can still turn off
      // spurious warnings by setting IS_REACT_ACT_ENVIRONMENT explicitly
      // to false.
      // $FlowExpectedError - Flow doesn't know about jest
      const jestIsDefined = typeof jest !== 'undefined';
      return (
        warnsIfNotActing &&
        jestIsDefined &&
        isReactActEnvironmentGlobal !== false
      );
    }
  }
  return false;
}
