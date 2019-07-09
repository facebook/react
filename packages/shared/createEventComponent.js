/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 * @flow
 */

import type {ReactEventResponder, ReactEventComponent} from 'shared/ReactTypes';
import {REACT_EVENT_COMPONENT_TYPE} from 'shared/ReactSymbols';
import {hasBadMapPolyfill} from './hasBadMapPolyfill';

export default function createEventComponent<E, C>(
  responder: ReactEventResponder<E, C>,
): ReactEventComponent<E, C> {
  // We use responder as a Map key later on. When we have a bad
  // polyfill, then we can't use it as a key as the polyfill tries
  // to add a property to the object.
  if (__DEV__ && !hasBadMapPolyfill) {
    Object.freeze(responder);
  }
  const eventComponent = {
    $$typeof: REACT_EVENT_COMPONENT_TYPE,
    responder,
  };
  if (__DEV__) {
    Object.freeze(eventComponent);
  }
  return eventComponent;
}
