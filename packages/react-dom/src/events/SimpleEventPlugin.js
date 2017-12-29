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

/**
 * Turns
 * ['abort', ...]
 * into
 * eventTypes = {
 *   'abort': {
 *     phasedRegistrationNames: {
 *       bubbled: 'onAbort',
 *       captured: 'onAbortCapture',
 *     },
 *     dependencies: ['topAbort'],
 *   },
 *   ...
 * };
 * topLevelEventsToDispatchConfig = {
 *   'topAbort': { sameConfig }
 * };
 */
const eventTypes: EventTypes = {};
const topLevelEventsToDispatchConfig: {
  [key: TopLevelTypes]: DispatchConfig,
} = {};
[
  'abort',
  'animationEnd',
  'animationIteration',
  'animationStart',
  'blur',
  'cancel',
  'canPlay',
  'canPlayThrough',
  'click',
  'close',
  'contextMenu',
  'copy',
  'cut',
  'doubleClick',
  'drag',
  'dragEnd',
  'dragEnter',
  'dragExit',
  'dragLeave',
  'dragOver',
  'dragStart',
  'drop',
  'durationChange',
  'emptied',
  'encrypted',
  'ended',
  'error',
  'focus',
  'input',
  'invalid',
  'keyDown',
  'keyPress',
  'keyUp',
  'load',
  'loadedData',
  'loadedMetadata',
  'loadStart',
  'mouseDown',
  'mouseMove',
  'mouseOut',
  'mouseOver',
  'mouseUp',
  'paste',
  'pause',
  'play',
  'playing',
  'progress',
  'rateChange',
  'reset',
  'scroll',
  'seeked',
  'seeking',
  'stalled',
  'submit',
  'suspend',
  'timeUpdate',
  'toggle',
  'touchCancel',
  'touchEnd',
  'touchMove',
  'touchStart',
  'transitionEnd',
  'volumeChange',
  'waiting',
  'wheel',
].forEach(event => {
  const capitalizedEvent = event[0].toUpperCase() + event.slice(1);
  const onEvent = 'on' + capitalizedEvent;
  const topEvent = 'top' + capitalizedEvent;

  const type = {
    phasedRegistrationNames: {
      bubbled: onEvent,
      captured: onEvent + 'Capture',
    },
    dependencies: [topEvent],
  };
  eventTypes[event] = type;
  topLevelEventsToDispatchConfig[topEvent] = type;
});

// Only used in DEV for exhaustiveness validation.
const knownHTMLTopLevelTypes = [
  'topAbort',
  'topCancel',
  'topCanPlay',
  'topCanPlayThrough',
  'topClose',
  'topDurationChange',
  'topEmptied',
  'topEncrypted',
  'topEnded',
  'topError',
  'topInput',
  'topInvalid',
  'topLoad',
  'topLoadedData',
  'topLoadedMetadata',
  'topLoadStart',
  'topPause',
  'topPlay',
  'topPlaying',
  'topProgress',
  'topRateChange',
  'topReset',
  'topSeeked',
  'topSeeking',
  'topStalled',
  'topSubmit',
  'topSuspend',
  'topTimeUpdate',
  'topToggle',
  'topVolumeChange',
  'topWaiting',
];

const SimpleEventPlugin: PluginModule<MouseEvent> = {
  eventTypes: eventTypes,

  extractEvents: function(
    topLevelType: TopLevelTypes,
    targetInst: Fiber,
    nativeEvent: MouseEvent,
    nativeEventTarget: EventTarget,
  ): null | ReactSyntheticEvent {
    const dispatchConfig = topLevelEventsToDispatchConfig[topLevelType];
    if (!dispatchConfig) {
      return null;
    }
    let EventConstructor;
    switch (topLevelType) {
      case 'topKeyPress':
        // Firefox creates a keypress event for function keys too. This removes
        // the unwanted keypress events. Enter is however both printable and
        // non-printable. One would expect Tab to be as well (but it isn't).
        if (getEventCharCode(nativeEvent) === 0) {
          return null;
        }
      /* falls through */
      case 'topKeyDown':
      case 'topKeyUp':
        EventConstructor = SyntheticKeyboardEvent;
        break;
      case 'topBlur':
      case 'topFocus':
        EventConstructor = SyntheticFocusEvent;
        break;
      case 'topClick':
        // Firefox creates a click event on right mouse clicks. This removes the
        // unwanted click events.
        if (nativeEvent.button === 2) {
          return null;
        }
      /* falls through */
      case 'topDoubleClick':
      case 'topMouseDown':
      case 'topMouseMove':
      case 'topMouseUp':
      // TODO: Disabled elements should not respond to mouse events
      /* falls through */
      case 'topMouseOut':
      case 'topMouseOver':
      case 'topContextMenu':
        EventConstructor = SyntheticMouseEvent;
        break;
      case 'topDrag':
      case 'topDragEnd':
      case 'topDragEnter':
      case 'topDragExit':
      case 'topDragLeave':
      case 'topDragOver':
      case 'topDragStart':
      case 'topDrop':
        EventConstructor = SyntheticDragEvent;
        break;
      case 'topTouchCancel':
      case 'topTouchEnd':
      case 'topTouchMove':
      case 'topTouchStart':
        EventConstructor = SyntheticTouchEvent;
        break;
      case 'topAnimationEnd':
      case 'topAnimationIteration':
      case 'topAnimationStart':
        EventConstructor = SyntheticAnimationEvent;
        break;
      case 'topTransitionEnd':
        EventConstructor = SyntheticTransitionEvent;
        break;
      case 'topScroll':
        EventConstructor = SyntheticUIEvent;
        break;
      case 'topWheel':
        EventConstructor = SyntheticWheelEvent;
        break;
      case 'topCopy':
      case 'topCut':
      case 'topPaste':
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
