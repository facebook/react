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
import type {EventPriority} from 'shared/ReactTypes';
import type {DOMEventName} from './DOMEventNames';

export type DispatchConfig = {|
  dependencies?: Array<DOMEventName>,
  phasedRegistrationNames: {|
    bubbled: null | string,
    captured: null | string,
  |},
  registrationName?: string,
  eventPriority?: EventPriority,
|};

export type ReactSyntheticEvent = {|
  isPersistent: () => boolean,
  isPropagationStopped: () => boolean,
  _dispatchInstances?: null | Array<Fiber | null> | Fiber,
  _dispatchListeners?: null | Array<Function> | Function,
  _reactName: string | null,
  _targetInst: Fiber,
  nativeEvent: Event,
  type: string,
  currentTarget: null | EventTarget,
|};
