/**
 * Copyright (c) 2013-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import type {TopLevelTypes} from './BrowserEventConstants';
import type {
  DispatchConfig,
  ReactSyntheticEvent,
} from 'events/ReactSyntheticEventType';
import type {Fiber} from 'react-reconciler/src/ReactFiber';
import type {PluginModule} from 'events/PluginModuleType';

import {accumulateTwoPhaseDispatches} from 'events/EventPropagators';
import SyntheticEvent from 'events/SyntheticEvent';

import SyntheticAnimationEvent from './SyntheticAnimationEvent';
import SyntheticClipboardEvent from './SyntheticClipboardEvent';
import SyntheticFocusEvent from './SyntheticFocusEvent';
import SyntheticKeyboardEvent from './SyntheticKeyboardEvent';
import SyntheticMouseEvent from './SyntheticMouseEvent';
import SyntheticDragEvent from './SyntheticDragEvent';
import SyntheticTouchEvent from './SyntheticTouchEvent';
import SyntheticTransitionEvent from './SyntheticTransitionEvent';
import SyntheticUIEvent from './SyntheticUIEvent';
import SyntheticWheelEvent from './SyntheticWheelEvent';
import getEventCharCode from './getEventCharCode';

const topLevelEventsToDispatchConfig: {
  [key: TopLevelTypes]: DispatchConfig,
} = {};

function getDispatchConfig(topLevelType) {
  if (!topLevelEventsToDispatchConfig[topLevelType]) {
    const onEvent = `on${topLevelType.slice(3)}`;
    topLevelEventsToDispatchConfig[topLevelType] = {
      phasedRegistrationNames: {
        bubbled: onEvent,
        captured: `${onEvent}Capture`,
      },
      dependencies: [topLevelType],
    };
  }
  return topLevelEventsToDispatchConfig[topLevelType];
}

const SimpleEventPlugin: PluginModule<MouseEvent> = {
  extractEvents(
    topLevelType: TopLevelTypes,
    targetInst: Fiber,
    nativeEvent: MouseEvent,
    nativeEventTarget: EventTarget,
  ): null | ReactSyntheticEvent {
    let EventConstructor;
    let nativeCtor = nativeEvent.constructor.name;

    switch (nativeCtor) {
      case 'MouseEvent':
        EventConstructor = SyntheticMouseEvent;
        break;
      case 'FocusEvent':
        EventConstructor = SyntheticFocusEvent;
        break;
      case 'KeyboardEvent':
        EventConstructor = SyntheticKeyboardEvent;
        break;
      case 'TransitionEvent':
        EventConstructor = SyntheticTransitionEvent;
        break;
      case 'AnimationEvent':
        EventConstructor = SyntheticAnimationEvent;
        break;
      case 'DragEvent':
        EventConstructor = SyntheticDragEvent;
        break;
      case 'UIEvent':
        EventConstructor = SyntheticUIEvent;
        break;
      case 'ClipboardEvent':
        EventConstructor = SyntheticClipboardEvent;
        break;
      case 'TouchEvent':
        EventConstructor = SyntheticTouchEvent;
        break;
      case 'WheelEvent':
        EventConstructor = SyntheticWheelEvent;
        break;
      default:
        EventConstructor = SyntheticEvent;
    }

    // Firefox creates a keypress event for function keys too. This removes
    // the unwanted keypress events. Enter is however both printable and
    // non-printable. One would expect Tab to be as well (but it isn't).
    if (topLevelType === 'topKeyPress' && getEventCharCode(nativeEvent) === 0) {
      return null;
    }
    // Firefox creates a click event on right mouse clicks. This removes the
    // unwanted click events.
    if (topLevelType === 'topKeyPress' && nativeEvent.button === 2) {
      return null;
    }

    const event = EventConstructor.getPooled(
      getDispatchConfig(topLevelType),
      targetInst,
      nativeEvent,
      nativeEventTarget,
    );
    accumulateTwoPhaseDispatches(event);
    return event;
  },
};

export default SimpleEventPlugin;
