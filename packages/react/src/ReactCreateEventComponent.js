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

type EventComponentConfig = {
  displayName: string,
  props: null | Object,
  responder: ReactEventResponder,
};

export function createEventComponent({
  displayName,
  responder,
}: EventComponentConfig): ?ReactEventComponent {
  if (enableEventAPI) {
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
