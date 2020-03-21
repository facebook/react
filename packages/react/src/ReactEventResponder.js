/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 * @flow
 */

import type {ReactEventResponder} from 'shared/ReactTypes';
import {REACT_RESPONDER_TYPE} from 'shared/ReactSymbols';
import {hasBadMapPolyfill} from './BadMapPolyfill';

export function createEventResponder<E, C>(
  displayName: string,
  responderConfig: Object,
): ReactEventResponder<E, C> {
  const {
    getInitialState,
    onEvent,
    onMount,
    onUnmount,
    onRootEvent,
    rootEventTypes,
    targetEventTypes,
    targetPortalPropagation,
  } = responderConfig;
  const eventResponder = {
    $$typeof: REACT_RESPONDER_TYPE,
    displayName,
    getInitialState: getInitialState || null,
    onEvent: onEvent || null,
    onMount: onMount || null,
    onRootEvent: onRootEvent || null,
    onUnmount: onUnmount || null,
    rootEventTypes: rootEventTypes || null,
    targetEventTypes: targetEventTypes || null,
    targetPortalPropagation: targetPortalPropagation || false,
  };
  // We use responder as a Map key later on. When we have a bad
  // polyfill, then we can't use it as a key as the polyfill tries
  // to add a property to the object.
  if (__DEV__ && !hasBadMapPolyfill) {
    Object.freeze(eventResponder);
  }
  return eventResponder;
}
