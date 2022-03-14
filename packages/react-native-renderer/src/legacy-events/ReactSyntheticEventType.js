/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * Flow type for SyntheticEvent class that includes private properties
 * @flow
 */

import type {Fiber} from 'react-reconciler/src/ReactInternalTypes';
import type {TopLevelType} from './TopLevelEventTypes';

export type DispatchConfig = {|
  dependencies?: Array<TopLevelType>,
  phasedRegistrationNames: {|
    bubbled: null | string,
    captured: null | string,
    skipBubbling?: ?boolean,
  |},
  registrationName?: string,
|};

export type CustomDispatchConfig = {|
  phasedRegistrationNames: {|
    bubbled: null,
    captured: null,
    skipBubbling?: ?boolean,
  |},
  registrationName?: string,
  customEvent: true,
|};

export type ReactSyntheticEvent = {|
  dispatchConfig: DispatchConfig | CustomDispatchConfig,
  getPooled: (
    dispatchConfig: DispatchConfig | CustomDispatchConfig,
    targetInst: Fiber,
    nativeTarget: Event,
    nativeEventTarget: EventTarget,
  ) => ReactSyntheticEvent,
  isPersistent: () => boolean,
  isPropagationStopped: () => boolean,
  _dispatchInstances?: null | Array<Fiber | null> | Fiber,
  _dispatchListeners?: null | Array<Function> | Function,
  _targetInst: Fiber,
  type: string,
  currentTarget: null | EventTarget,
|};
