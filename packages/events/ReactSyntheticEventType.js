/**
 * Copyright (c) 2013-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * Flow type for SyntheticEvent class that includes private properties
 * @flow
 */

import type {Fiber} from 'react-reconciler/src/ReactFiber';

export type DispatchConfig = {
  dependencies: Array<string>,
  phasedRegistrationNames?: {
    bubbled: string,
    captured: string,
  },
  registrationName?: string,
  isInteractive?: boolean,
};

export type ReactSyntheticEvent = {
  dispatchConfig: DispatchConfig,
  getPooled: (
    dispatchConfig: DispatchConfig,
    targetInst: Fiber,
    nativeTarget: Event,
    nativeEventTarget: EventTarget,
  ) => ReactSyntheticEvent,
  isPersistent: () => boolean,
} & SyntheticEvent<>;
