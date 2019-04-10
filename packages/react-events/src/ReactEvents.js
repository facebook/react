/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import {
  REACT_EVENT_TARGET_TYPE,
  REACT_EVENT_TARGET_TOUCH_HIT,
  REACT_EVENT_FOCUS_TARGET,
  REACT_EVENT_PRESS_TARGET,
} from 'shared/ReactSymbols';
import type {ReactEventTarget} from 'shared/ReactTypes';

export const TouchHitTarget: ReactEventTarget = {
  $$typeof: REACT_EVENT_TARGET_TYPE,
  type: REACT_EVENT_TARGET_TOUCH_HIT,
};

export const FocusTarget: ReactEventTarget = {
  $$typeof: REACT_EVENT_TARGET_TYPE,
  type: REACT_EVENT_FOCUS_TARGET,
};

export const PressTarget: ReactEventTarget = {
  $$typeof: REACT_EVENT_TARGET_TYPE,
  type: REACT_EVENT_PRESS_TARGET,
};
