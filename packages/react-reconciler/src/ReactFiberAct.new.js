/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import type {Fiber} from './ReactFiber.new';
import {warnsIfNotActing} from './ReactFiberHostConfig';

import ReactSharedInternals from 'shared/ReactSharedInternals';

const {ReactCurrentActQueue} = ReactSharedInternals;

export function isActEnvironment(fiber: Fiber) {
  if (__DEV__) {
    const disableActWarning = ReactCurrentActQueue.disableActWarning;
    // $FlowExpectedError - Flow doesn't know about jest
    const jestIsDefined = typeof jest !== 'undefined';
    return warnsIfNotActing && jestIsDefined && !disableActWarning;
  }
  return false;
}
