/**
 * Copyright 2013-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * Flow type for SyntheticEvent class that includes private properties
 *
 * @providesModule ReactSyntheticEventType
 * @flow
 */

'use strict';

import type {ReactInstance} from 'ReactInstanceType';

export type DispatchConfig = {
  dependencies: Array<string>,
  phasedRegistrationNames?: {
    bubbled: string,
    captured: string,
  },
  registrationName?: string,
};

export type ReactSyntheticEvent =
  & {
    dispatchConfig: DispatchConfig,
    getPooled: (
      dispatchConfig: DispatchConfig,
      targetInst: ReactInstance,
      nativeTarget: Event,
      nativeEventTarget: EventTarget,
    ) => ReactSyntheticEvent,
  }
  & SyntheticEvent;
