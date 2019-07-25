/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 * @flow
 */

import type {ReactEventResponder} from 'shared/ReactTypes';
import {REACT_RESPONDER_TYPE} from 'shared/ReactSymbols';

export default function createEventResponder<E, C>(
  displayName: string,
  responderConfig: Object,
): ReactEventResponder<E, C> {
  const {
    getInitialState,
    onEvent,
    onMount,
    onUnmount,
    onOwnershipChange,
    onRootEvent,
    rootEventTypes,
    targetEventTypes,
  } = responderConfig;
  const eventResponder = {
    $$typeof: REACT_RESPONDER_TYPE,
    displayName,
    getInitialState: getInitialState || null,
    onEvent: onEvent || null,
    onMount: onMount || null,
    onOwnershipChange: onOwnershipChange || null,
    onRootEvent: onRootEvent || null,
    onUnmount: onUnmount || null,
    rootEventTypes: rootEventTypes || null,
    targetEventTypes: targetEventTypes || null,
  };
  if (__DEV__) {
    Object.freeze(eventResponder);
  }
  return eventResponder;
}
