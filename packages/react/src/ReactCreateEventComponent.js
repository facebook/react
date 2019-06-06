/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 * @flow
 */

import type {ReactEventComponent, ReactEventResponder} from 'shared/ReactTypes';
import {enableEventAPI} from 'shared/ReactFeatureFlags';

import {REACT_EVENT_COMPONENT_TYPE} from 'shared/ReactSymbols';

let hasBadMapPolyfill;

if (__DEV__) {
  hasBadMapPolyfill = false;
  try {
    const frozenObject = Object.freeze({});
    const testMap = new Map([[frozenObject, null]]);
    const testSet = new Set([frozenObject]);
    // This is necessary for Rollup to not consider these unused.
    // https://github.com/rollup/rollup/issues/1771
    // TODO: we can remove these if Rollup fixes the bug.
    testMap.set(0, 0);
    testSet.add(0);
  } catch (e) {
    // TODO: Consider warning about bad polyfills
    hasBadMapPolyfill = true;
  }
}

export function createEventComponent(
  responder: ReactEventResponder,
  displayName: string,
): ?ReactEventComponent {
  if (enableEventAPI) {
    // We use responder as a Map key later on. When we have a bad
    // polyfill, then we can't use it as a key as the polyfill tries
    // to add a property to the object.
    if (__DEV__ && !hasBadMapPolyfill) {
      Object.freeze(responder);
    }
    const eventComponent = {
      $$typeof: REACT_EVENT_COMPONENT_TYPE,
      displayName: displayName,
      props: null,
      responder: responder,
    };
    if (__DEV__) {
      Object.freeze(eventComponent);
    }
    return eventComponent;
  }
}
