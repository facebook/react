/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import type {ReactScopeInstance} from 'shared/ReactTypes';
import type {DOMEventName} from '../events/DOMEventNames';

export type ReactDOMEventHandle = (
  target: EventTarget | ReactScopeInstance,
  callback: (SyntheticEvent<EventTarget>) => void,
) => () => void;

export type ReactDOMEventHandleListener = {
  callback: (SyntheticEvent<EventTarget>) => void,
  capture: boolean,
  type: DOMEventName,
};
