/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * Flow type for SyntheticEvent class that includes private properties
 * @flow
 */

import type {Fiber} from 'react-reconciler/src/ReactFiber';
import type {EventPriority} from 'shared/ReactTypes';
import type {TopLevelType} from './TopLevelEventTypes';

export type DispatchConfig = {|
  dependencies: Array<TopLevelType>,
  phasedRegistrationNames?: {|
    bubbled: string,
    captured: string,
  |},
  registrationName?: string,
  eventPriority: EventPriority,
|};

export type ReactSyntheticEvent = {|
  dispatchConfig: DispatchConfig,
  getPooled: (
    dispatchConfig: DispatchConfig,
    targetInst: Fiber,
    nativeTarget: Event,
    nativeEventTarget: EventTarget,
  ) => ReactSyntheticEvent,
  isPersistent: () => boolean,
|};
