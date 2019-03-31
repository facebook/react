/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import type {EventResponderContext} from 'events/EventTypes';
import {REACT_EVENT_COMPONENT_TYPE} from 'shared/ReactSymbols';

const targetEventTypes = [
  {name: 'focus', passive: true, capture: true},
  {name: 'blur', passive: true, capture: true},
];

type FocusState = {
  isFocused: boolean,
};

function dispatchFocusInEvents(context: EventResponderContext, props: Object) {
  const {event, eventTarget} = context;
  if (context.isTargetWithinEventComponent((event: any).relatedTarget)) {
    return;
  }
  if (props.onFocus) {
    context.dispatchEvent('focus', props.onFocus, eventTarget, true);
  }
  if (props.onFocusChange) {
    const focusChangeEventListener = () => {
      props.onFocusChange(true);
    };
    context.dispatchEvent(
      'focuschange',
      focusChangeEventListener,
      eventTarget,
      true,
    );
  }
}

function dispatchFocusOutEvents(context: EventResponderContext, props: Object) {
  const {event, eventTarget} = context;
  if (context.isTargetWithinEventComponent((event: any).relatedTarget)) {
    return;
  }
  if (props.onBlur) {
    context.dispatchEvent('blur', props.onBlur, eventTarget, true);
  }
  if (props.onFocusChange) {
    const focusChangeEventListener = () => {
      props.onFocusChange(false);
    };
    context.dispatchEvent(
      'focuschange',
      focusChangeEventListener,
      eventTarget,
      true,
    );
  }
}

const FocusResponder = {
  targetEventTypes,
  createInitialState(): FocusState {
    return {
      isFocused: false,
    };
  },
  handleEvent(
    context: EventResponderContext,
    props: Object,
    state: FocusState,
  ): void {
    const {eventTarget, eventType} = context;

    switch (eventType) {
      case 'focus': {
        if (!state.isFocused && !context.isTargetOwned(eventTarget)) {
          dispatchFocusInEvents(context, props);
          state.isFocused = true;
        }
        break;
      }
      case 'blur': {
        if (state.isFocused) {
          dispatchFocusOutEvents(context, props);
          state.isFocused = false;
        }
        break;
      }
    }
  },
};

export default {
  $$typeof: REACT_EVENT_COMPONENT_TYPE,
  props: null,
  responder: FocusResponder,
};
