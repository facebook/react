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

const eventTypes: EventTypes = [
  {
    dependencies: [TopLevelEventTypes.TOP_ABORT],
    phasedRegistrationNames: {
      bubbled: 'onAbort',
      captured: 'onAbortCapture',
    },
  },
  {
    dependencies: [TopLevelEventTypes.TOP_ANIMATION_END],
    phasedRegistrationNames: {
      bubbled: 'onAnimationEnd',
      captured: 'onAnimationEndCapture',
    },
  },
  {
    dependencies: [TopLevelEventTypes.TOP_ANIMATION_ITERATION],
    phasedRegistrationNames: {
      bubbled: 'onAnimationIteration',
      captured: 'onAnimationIterationCapture',
    },
  },
  {
    dependencies: [TopLevelEventTypes.TOP_ANIMATION_START],
    phasedRegistrationNames: {
      bubbled: 'onAnimationStart',
      captured: 'onAnimationStartCapture',
    },
  },
  {
    dependencies: [TopLevelEventTypes.TOP_BLUR],
    phasedRegistrationNames: {
      bubbled: 'onBlur',
      captured: 'onBlurCapture',
    },
  },
  {
    dependencies: [TopLevelEventTypes.TOP_CANCEL],
    phasedRegistrationNames: {
      bubbled: 'onCancel',
      captured: 'onCancelCapture',
    },
  },
  {
    dependencies: [TopLevelEventTypes.TOP_CAN_PLAY],
    phasedRegistrationNames: {
      bubbled: 'onCanPlay',
      captured: 'onCanPlayCapture',
    },
  },
  {
    dependencies: [TopLevelEventTypes.TOP_CAN_PLAY_THROUGH],
    phasedRegistrationNames: {
      bubbled: 'onCanPlayThrough',
      captured: 'onCanPlayThroughCapture',
    },
  },
  {
    dependencies: [TopLevelEventTypes.TOP_CLICK],
    phasedRegistrationNames: {
      bubbled: 'onClick',
      captured: 'onClickCapture',
    },
  },
  {
    dependencies: [TopLevelEventTypes.TOP_CLOSE],
    phasedRegistrationNames: {
      bubbled: 'onClose',
      captured: 'onCloseCapture',
    },
  },
  {
    dependencies: [TopLevelEventTypes.TOP_CONTEXT_MENU],
    phasedRegistrationNames: {
      bubbled: 'onContextMenu',
      captured: 'onContextMenuCapture',
    },
  },
  {
    dependencies: [TopLevelEventTypes.TOP_COPY],
    phasedRegistrationNames: {
      bubbled: 'onCopy',
      captured: 'onCopyCapture',
    },
  },
  {
    dependencies: [TopLevelEventTypes.TOP_CUT],
    phasedRegistrationNames: {
      bubbled: 'onCut',
      captured: 'onCutCapture',
    },
  },
  {
    dependencies: [TopLevelEventTypes.TOP_DOUBLE_CLICK],
    phasedRegistrationNames: {
      bubbled: 'onDoubleClick',
      captured: 'onDoubleClickCapture',
    },
  },
  {
    dependencies: [TopLevelEventTypes.TOP_DRAG],
    phasedRegistrationNames: {
      bubbled: 'onDrag',
      captured: 'onDragCapture',
    },
  },
  {
    dependencies: [TopLevelEventTypes.TOP_DRAG_END],
    phasedRegistrationNames: {
      bubbled: 'onDragEnd',
      captured: 'onDragEndCapture',
    },
  },
  {
    dependencies: [TopLevelEventTypes.TOP_DRAG_ENTER],
    phasedRegistrationNames: {
      bubbled: 'onDragEnter',
      captured: 'onDragEnterCapture',
    },
  },
  {
    dependencies: [TopLevelEventTypes.TOP_DRAG_EXIT],
    phasedRegistrationNames: {
      bubbled: 'onDragExit',
      captured: 'onDragExitCapture',
    },
  },
  {
    dependencies: [TopLevelEventTypes.TOP_DRAG_LEAVE],
    phasedRegistrationNames: {
      bubbled: 'onDragLeave',
      captured: 'onDragLeaveCapture',
    },
  },
  {
    dependencies: [TopLevelEventTypes.TOP_DRAG_OVER],
    phasedRegistrationNames: {
      bubbled: 'onDragOver',
      captured: 'onDragOverCapture',
    },
  },
  {
    dependencies: [TopLevelEventTypes.TOP_DRAG_START],
    phasedRegistrationNames: {
      bubbled: 'onDragStart',
      captured: 'onDragStartCapture',
    },
  },
  {
    dependencies: [TopLevelEventTypes.TOP_DROP],
    phasedRegistrationNames: {
      bubbled: 'onDrop',
      captured: 'onDropCapture',
    },
  },
  {
    dependencies: [TopLevelEventTypes.TOP_DURATION_CHANGE],
    phasedRegistrationNames: {
      bubbled: 'onDurationChange',
      captured: 'onDurationChangeCapture',
    },
  },
  {
    dependencies: [TopLevelEventTypes.TOP_EMPTIED],
    phasedRegistrationNames: {
      bubbled: 'onEmptied',
      captured: 'onEmptiedCapture',
    },
  },
  {
    dependencies: [TopLevelEventTypes.TOP_ENCRYPTED],
    phasedRegistrationNames: {
      bubbled: 'onEncrypted',
      captured: 'onEncryptedCapture',
    },
  },
  {
    dependencies: [TopLevelEventTypes.TOP_ENDED],
    phasedRegistrationNames: {
      bubbled: 'onEnded',
      captured: 'onEndedCapture',
    },
  },
  {
    dependencies: [TopLevelEventTypes.TOP_ERROR],
    phasedRegistrationNames: {
      bubbled: 'onError',
      captured: 'onErrorCapture',
    },
  },
  {
    dependencies: [TopLevelEventTypes.TOP_FOCUS],
    phasedRegistrationNames: {
      bubbled: 'onFocus',
      captured: 'onFocusCapture',
    },
  },
  {
    dependencies: [TopLevelEventTypes.TOP_INPUT],
    phasedRegistrationNames: {
      bubbled: 'onInput',
      captured: 'onInputCapture',
    },
  },
  {
    dependencies: [TopLevelEventTypes.TOP_INVALID],
    phasedRegistrationNames: {
      bubbled: 'onInvalid',
      captured: 'onInvalidCapture',
    },
  },
  {
    dependencies: [TopLevelEventTypes.TOP_KEY_DOWN],
    phasedRegistrationNames: {
      bubbled: 'onKeyDown',
      captured: 'onKeyDownCapture',
    },
  },
  {
    dependencies: [TopLevelEventTypes.TOP_KEY_PRESS],
    phasedRegistrationNames: {
      bubbled: 'onKeyPress',
      captured: 'onKeyPressCapture',
    },
  },
  {
    dependencies: [TopLevelEventTypes.TOP_KEY_UP],
    phasedRegistrationNames: {
      bubbled: 'onKeyUp',
      captured: 'onKeyUpCapture',
    },
  },
  {
    dependencies: [TopLevelEventTypes.TOP_LOAD],
    phasedRegistrationNames: {
      bubbled: 'onLoad',
      captured: 'onLoadCapture',
    },
  },
  {
    dependencies: [TopLevelEventTypes.TOP_LOADED_DATA],
    phasedRegistrationNames: {
      bubbled: 'onLoadedData',
      captured: 'onLoadedDataCapture',
    },
  },
  {
    dependencies: [TopLevelEventTypes.TOP_LOADED_METADATA],
    phasedRegistrationNames: {
      bubbled: 'onLoadedMetadata',
      captured: 'onLoadedMetadataCapture',
    },
  },
  {
    dependencies: [TopLevelEventTypes.TOP_LOAD_START],
    phasedRegistrationNames: {
      bubbled: 'onLoadStart',
      captured: 'onLoadStartCapture',
    },
  },
  {
    dependencies: [TopLevelEventTypes.TOP_MOUSE_DOWN],
    phasedRegistrationNames: {
      bubbled: 'onMouseDown',
      captured: 'onMouseDownCapture',
    },
  },
  {
    dependencies: [TopLevelEventTypes.TOP_MOUSE_MOVE],
    phasedRegistrationNames: {
      bubbled: 'onMouseMove',
      captured: 'onMouseMoveCapture',
    },
  },
  {
    dependencies: [TopLevelEventTypes.TOP_MOUSE_OUT],
    phasedRegistrationNames: {
      bubbled: 'onMouseOut',
      captured: 'onMouseOutCapture',
    },
  },
  {
    dependencies: [TopLevelEventTypes.TOP_MOUSE_OVER],
    phasedRegistrationNames: {
      bubbled: 'onMouseOver',
      captured: 'onMouseOverCapture',
    },
  },
  {
    dependencies: [TopLevelEventTypes.TOP_MOUSE_UP],
    phasedRegistrationNames: {
      bubbled: 'onMouseUp',
      captured: 'onMouseUpCapture',
    },
  },
  {
    dependencies: [TopLevelEventTypes.TOP_PASTE],
    phasedRegistrationNames: {
      bubbled: 'onPaste',
      captured: 'onPasteCapture',
    },
  },
  {
    dependencies: [TopLevelEventTypes.TOP_PAUSE],
    phasedRegistrationNames: {
      bubbled: 'onPause',
      captured: 'onPauseCapture',
    },
  },
  {
    dependencies: [TopLevelEventTypes.TOP_PLAY],
    phasedRegistrationNames: {
      bubbled: 'onPlay',
      captured: 'onPlayCapture',
    },
  },
  {
    dependencies: [TopLevelEventTypes.TOP_PLAYING],
    phasedRegistrationNames: {
      bubbled: 'onPlaying',
      captured: 'onPlayingCapture',
    },
  },
  {
    dependencies: [TopLevelEventTypes.TOP_PROGRESS],
    phasedRegistrationNames: {
      bubbled: 'onProgress',
      captured: 'onProgressCapture',
    },
  },
  {
    dependencies: [TopLevelEventTypes.TOP_RATE_CHANGE],
    phasedRegistrationNames: {
      bubbled: 'onRateChange',
      captured: 'onRateChangeCapture',
    },
  },
  {
    dependencies: [TopLevelEventTypes.TOP_RESET],
    phasedRegistrationNames: {
      bubbled: 'onReset',
      captured: 'onResetCapture',
    },
  },
  {
    dependencies: [TopLevelEventTypes.TOP_SCROLL],
    phasedRegistrationNames: {
      bubbled: 'onScroll',
      captured: 'onScrollCapture',
    },
  },
  {
    dependencies: [TopLevelEventTypes.TOP_SEEKED],
    phasedRegistrationNames: {
      bubbled: 'onSeeked',
      captured: 'onSeekedCapture',
    },
  },
  {
    dependencies: [TopLevelEventTypes.TOP_SEEKING],
    phasedRegistrationNames: {
      bubbled: 'onSeeking',
      captured: 'onSeekingCapture',
    },
  },
  {
    dependencies: [TopLevelEventTypes.TOP_STALLED],
    phasedRegistrationNames: {
      bubbled: 'onStalled',
      captured: 'onStalledCapture',
    },
  },
  {
    dependencies: [TopLevelEventTypes.TOP_SUBMIT],
    phasedRegistrationNames: {
      bubbled: 'onSubmit',
      captured: 'onSubmitCapture',
    },
  },
  {
    dependencies: [TopLevelEventTypes.TOP_SUSPEND],
    phasedRegistrationNames: {
      bubbled: 'onSuspend',
      captured: 'onSuspendCapture',
    },
  },
  {
    dependencies: [TopLevelEventTypes.TOP_TIME_UPDATE],
    phasedRegistrationNames: {
      bubbled: 'onTimeUpdate',
      captured: 'onTimeUpdateCapture',
    },
  },
  {
    dependencies: [TopLevelEventTypes.TOP_TOUCH_CANCEL],
    phasedRegistrationNames: {
      bubbled: 'onTouchCancel',
      captured: 'onTouchCancelCapture',
    },
  },
  {
    dependencies: [TopLevelEventTypes.TOP_TOUCH_END],
    phasedRegistrationNames: {
      bubbled: 'onTouchEnd',
      captured: 'onTouchEndCapture',
    },
  },
  {
    dependencies: [TopLevelEventTypes.TOP_TOUCH_MOVE],
    phasedRegistrationNames: {
      bubbled: 'onTouchMove',
      captured: 'onTouchMoveCapture',
    },
  },
  {
    dependencies: [TopLevelEventTypes.TOP_TOUCH_START],
    phasedRegistrationNames: {
      bubbled: 'onTouchStart',
      captured: 'onTouchStartCapture',
    },
  },
  {
    dependencies: [TopLevelEventTypes.TOP_TRANSITION_END],
    phasedRegistrationNames: {
      bubbled: 'onTransitionEnd',
      captured: 'onTransitionEndCapture',
    },
  },
  {
    dependencies: [TopLevelEventTypes.TOP_VOLUME_CHANGE],
    phasedRegistrationNames: {
      bubbled: 'onVolumeChange',
      captured: 'onVolumeChangeCapture',
    },
  },
  {
    dependencies: [TopLevelEventTypes.TOP_WAITING],
    phasedRegistrationNames: {
      bubbled: 'onWaiting',
      captured: 'onWaitingCapture',
    },
  },
  {
    dependencies: [TopLevelEventTypes.TOP_WHEEL],
    phasedRegistrationNames: {
      bubbled: 'onWheel',
      captured: 'onWheelCapture',
    },
  },
];

const topLevelEventsToDispatchConfig = new Map();

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
