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
import type {EventTypes, PluginModule} from 'events/PluginModuleType';

import {accumulateTwoPhaseDispatches} from 'events/EventPropagators';
import SyntheticEvent from 'events/SyntheticEvent';
import * as TopLevelEventTypes from 'events/TopLevelEventTypes';
import warning from 'fbjs/lib/warning';

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

const shortTypes = [
  [TopLevelEventTypes.TOP_ABORT, 'onAbort'],
  [TopLevelEventTypes.TOP_ANIMATION_END, 'onAnimationEnd'],
  [TopLevelEventTypes.TOP_ANIMATION_ITERATION, 'onAnimationIteration'],
  [TopLevelEventTypes.TOP_ANIMATION_START, 'onAnimationStart'],
  [TopLevelEventTypes.TOP_BLUR, 'onBlur'],
  [TopLevelEventTypes.TOP_CANCEL, 'onCancel'],
  [TopLevelEventTypes.TOP_CAN_PLAY, 'onCanPlay'],
  [TopLevelEventTypes.TOP_CAN_PLAY_THROUGH, 'onCanPlayThrough'],
  [TopLevelEventTypes.TOP_CLICK, 'onClick'],
  [TopLevelEventTypes.TOP_CLOSE, 'onClose'],
  [TopLevelEventTypes.TOP_CONTEXT_MENU, 'onContextMenu'],
  [TopLevelEventTypes.TOP_COPY, 'onCopy'],
  [TopLevelEventTypes.TOP_CUT, 'onCut'],
  [TopLevelEventTypes.TOP_DOUBLE_CLICK, 'onDoubleClick'],
  [TopLevelEventTypes.TOP_DRAG, 'onDrag'],
  [TopLevelEventTypes.TOP_DRAG_END, 'onDragEnd'],
  [TopLevelEventTypes.TOP_DRAG_ENTER, 'onDragEnter'],
  [TopLevelEventTypes.TOP_DRAG_EXIT, 'onDragExit'],
  [TopLevelEventTypes.TOP_DRAG_LEAVE, 'onDragLeave'],
  [TopLevelEventTypes.TOP_DRAG_OVER, 'onDragOver'],
  [TopLevelEventTypes.TOP_DRAG_START, 'onDragStart'],
  [TopLevelEventTypes.TOP_DROP, 'onDrop'],
  [TopLevelEventTypes.TOP_DURATION_CHANGE, 'onDurationChange'],
  [TopLevelEventTypes.TOP_EMPTIED, 'onEmptied'],
  [TopLevelEventTypes.TOP_ENCRYPTED, 'onEncrypted'],
  [TopLevelEventTypes.TOP_ENDED, 'onEnded'],
  [TopLevelEventTypes.TOP_ERROR, 'onError'],
  [TopLevelEventTypes.TOP_FOCUS, 'onFocus'],
  [TopLevelEventTypes.TOP_INPUT, 'onInput'],
  [TopLevelEventTypes.TOP_INVALID, 'onInvalid'],
  [TopLevelEventTypes.TOP_KEY_DOWN, 'onKeyDown'],
  [TopLevelEventTypes.TOP_KEY_PRESS, 'onKeyPress'],
  [TopLevelEventTypes.TOP_KEY_UP, 'onKeyUp'],
  [TopLevelEventTypes.TOP_LOAD, 'onLoad'],
  [TopLevelEventTypes.TOP_LOADED_DATA, 'onLoadedData'],
  [TopLevelEventTypes.TOP_LOADED_METADATA, 'onLoadedMetadata'],
  [TopLevelEventTypes.TOP_LOAD_START, 'onLoadStart'],
  [TopLevelEventTypes.TOP_MOUSE_DOWN, 'onMouseDown'],
  [TopLevelEventTypes.TOP_MOUSE_MOVE, 'onMouseMove'],
  [TopLevelEventTypes.TOP_MOUSE_OUT, 'onMouseOut'],
  [TopLevelEventTypes.TOP_MOUSE_OVER, 'onMouseOver'],
  [TopLevelEventTypes.TOP_MOUSE_UP, 'onMouseUp'],
  [TopLevelEventTypes.TOP_PASTE, 'onPaste'],
  [TopLevelEventTypes.TOP_PAUSE, 'onPause'],
  [TopLevelEventTypes.TOP_PLAY, 'onPlay'],
  [TopLevelEventTypes.TOP_PLAYING, 'onPlaying'],
  [TopLevelEventTypes.TOP_PROGRESS, 'onProgress'],
  [TopLevelEventTypes.TOP_RATE_CHANGE, 'onRateChange'],
  [TopLevelEventTypes.TOP_RESET, 'onReset'],
  [TopLevelEventTypes.TOP_SCROLL, 'onScroll'],
  [TopLevelEventTypes.TOP_SEEKED, 'onSeeked'],
  [TopLevelEventTypes.TOP_SEEKING, 'onSeeking'],
  [TopLevelEventTypes.TOP_STALLED, 'onStalled'],
  [TopLevelEventTypes.TOP_SUBMIT, 'onSubmit'],
  [TopLevelEventTypes.TOP_SUSPEND, 'onSuspend'],
  [TopLevelEventTypes.TOP_TIME_UPDATE, 'onTimeUpdate'],
  [TopLevelEventTypes.TOP_TOUCH_CANCEL, 'onTouchCancel'],
  [TopLevelEventTypes.TOP_TOUCH_END, 'onTouchEnd'],
  [TopLevelEventTypes.TOP_TOUCH_MOVE, 'onTouchMove'],
  [TopLevelEventTypes.TOP_TOUCH_START, 'onTouchStart'],
  [TopLevelEventTypes.TOP_TRANSITION_END, 'onTransitionEnd'],
  [TopLevelEventTypes.TOP_VOLUME_CHANGE, 'onVolumeChange'],
  [TopLevelEventTypes.TOP_WAITING, 'onWaiting'],
  [TopLevelEventTypes.TOP_WHEEL, 'onWheel'],
];

const eventTypes = shortTypes.map(t => ({
  dependencies: [t[0]],
  phasedRegistrationNames: {
    bubbled: t[1],
    captured: t[1] + 'Capture',
  },
}));

export const topLevelEventsToDispatchConfig = new Map();

for (let i = 0; i < eventTypes.length; i++) {
  topLevelEventsToDispatchConfig.set(
    eventTypes[i].dependencies[0],
    eventTypes[i],
  );
}

// Only used in DEV for exhaustiveness validation.
const knownHTMLTopLevelTypes = [
  TopLevelEventTypes.TOP_ABORT,
  TopLevelEventTypes.TOP_CANCEL,
  TopLevelEventTypes.TOP_CAN_PLAY,
  TopLevelEventTypes.TOP_CAN_PLAY_THROUGH,
  TopLevelEventTypes.TOP_CLOSE,
  TopLevelEventTypes.TOP_DURATION_CHANGE,
  TopLevelEventTypes.TOP_EMPTIED,
  TopLevelEventTypes.TOP_ENCRYPTED,
  TopLevelEventTypes.TOP_ENDED,
  TopLevelEventTypes.TOP_ERROR,
  TopLevelEventTypes.TOP_INPUT,
  TopLevelEventTypes.TOP_INVALID,
  TopLevelEventTypes.TOP_LOAD,
  TopLevelEventTypes.TOP_LOADED_DATA,
  TopLevelEventTypes.TOP_LOADED_METADATA,
  TopLevelEventTypes.TOP_LOAD_START,
  TopLevelEventTypes.TOP_PAUSE,
  TopLevelEventTypes.TOP_PLAY,
  TopLevelEventTypes.TOP_PLAYING,
  TopLevelEventTypes.TOP_PROGRESS,
  TopLevelEventTypes.TOP_RATE_CHANGE,
  TopLevelEventTypes.TOP_RESET,
  TopLevelEventTypes.TOP_SEEKED,
  TopLevelEventTypes.TOP_SEEKING,
  TopLevelEventTypes.TOP_STALLED,
  TopLevelEventTypes.TOP_SUBMIT,
  TopLevelEventTypes.TOP_SUSPEND,
  TopLevelEventTypes.TOP_TIME_UPDATE,
  TopLevelEventTypes.TOP_TOGGLE,
  TopLevelEventTypes.TOP_VOLUME_CHANGE,
  TopLevelEventTypes.TOP_WAITING,
];

const SimpleEventPlugin: PluginModule<MouseEvent> = {
  eventTypes: eventTypes,

  extractEvents: function(
    topLevelType: TopLevelTypes,
    targetInst: Fiber,
    nativeEvent: MouseEvent,
    nativeEventTarget: EventTarget,
  ): null | ReactSyntheticEvent {
    const dispatchConfig = topLevelEventsToDispatchConfig.get(topLevelType);
    if (!dispatchConfig) {
      return null;
    }
    let EventConstructor;
    switch (topLevelType) {
      case TopLevelEventTypes.TOP_KEY_PRESS:
        // Firefox creates a keypress event for function keys too. This removes
        // the unwanted keypress events. Enter is however both printable and
        // non-printable. One would expect Tab to be as well (but it isn't).
        if (getEventCharCode(nativeEvent) === 0) {
          return null;
        }
      /* falls through */
      case TopLevelEventTypes.TOP_KEY_DOWN:
      case TopLevelEventTypes.TOP_KEY_UP:
        EventConstructor = SyntheticKeyboardEvent;
        break;
      case TopLevelEventTypes.TOP_BLUR:
      case TopLevelEventTypes.TOP_FOCUS:
        EventConstructor = SyntheticFocusEvent;
        break;
      case TopLevelEventTypes.TOP_CLICK:
        // Firefox creates a click event on right mouse clicks. This removes the
        // unwanted click events.
        if (nativeEvent.button === 2) {
          return null;
        }
      /* falls through */
      case TopLevelEventTypes.TOP_DOUBLE_CLICK:
      case TopLevelEventTypes.TOP_MOUSE_DOWN:
      case TopLevelEventTypes.TOP_MOUSE_MOVE:
      case TopLevelEventTypes.TOP_MOUSE_UP:
      // TODO: Disabled elements should not respond to mouse events
      /* falls through */
      case TopLevelEventTypes.TOP_MOUSE_OUT:
      case TopLevelEventTypes.TOP_MOUSE_OVER:
      case TopLevelEventTypes.TOP_CONTEXT_MENU:
        EventConstructor = SyntheticMouseEvent;
        break;
      case TopLevelEventTypes.TOP_DRAG:
      case TopLevelEventTypes.TOP_DRAG_END:
      case TopLevelEventTypes.TOP_DRAG_ENTER:
      case TopLevelEventTypes.TOP_DRAG_EXIT:
      case TopLevelEventTypes.TOP_DRAG_LEAVE:
      case TopLevelEventTypes.TOP_DRAG_OVER:
      case TopLevelEventTypes.TOP_DRAG_START:
      case TopLevelEventTypes.TOP_DROP:
        EventConstructor = SyntheticDragEvent;
        break;
      case TopLevelEventTypes.TOP_TOUCH_CANCEL:
      case TopLevelEventTypes.TOP_TOUCH_END:
      case TopLevelEventTypes.TOP_TOUCH_MOVE:
      case TopLevelEventTypes.TOP_TOUCH_START:
        EventConstructor = SyntheticTouchEvent;
        break;
      case TopLevelEventTypes.TOP_ANIMATION_END:
      case TopLevelEventTypes.TOP_ANIMATION_ITERATION:
      case TopLevelEventTypes.TOP_ANIMATION_START:
        EventConstructor = SyntheticAnimationEvent;
        break;
      case TopLevelEventTypes.TOP_TRANSITION_END:
        EventConstructor = SyntheticTransitionEvent;
        break;
      case TopLevelEventTypes.TOP_SCROLL:
        EventConstructor = SyntheticUIEvent;
        break;
      case TopLevelEventTypes.TOP_WHEEL:
        EventConstructor = SyntheticWheelEvent;
        break;
      case TopLevelEventTypes.TOP_COPY:
      case TopLevelEventTypes.TOP_CUT:
      case TopLevelEventTypes.TOP_PASTE:
        EventConstructor = SyntheticClipboardEvent;
        break;
      default:
        if (__DEV__) {
          if (knownHTMLTopLevelTypes.indexOf(topLevelType) === -1) {
            warning(
              false,
              'SimpleEventPlugin: Unhandled event type, `%s`. This warning ' +
                'is likely caused by a bug in React. Please file an issue.',
              topLevelType,
            );
          }
        }
        // HTML Events
        // @see http://www.w3.org/TR/html5/index.html#events-0
        EventConstructor = SyntheticEvent;
        break;
    }
    const event = EventConstructor.getPooled(
      dispatchConfig,
      targetInst,
      nativeEvent,
      nativeEventTarget,
    );
    accumulateTwoPhaseDispatches(event);
    return event;
  },
};

export default SimpleEventPlugin;
