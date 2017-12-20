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

const eventTypes: EventTypes = {
  abort: {
    phasedRegistrationNames: {
      bubbled: 'onAbort',
      captured: 'onAbortCapture',
    },
  },
  animationEnd: {
    phasedRegistrationNames: {
      bubbled: 'onAnimationEnd',
      captured: 'onAnimationEndCapture',
    },
  },
  animationIteration: {
    phasedRegistrationNames: {
      bubbled: 'onAnimationIteration',
      captured: 'onAnimationIterationCapture',
    },
  },
  animationStart: {
    phasedRegistrationNames: {
      bubbled: 'onAnimationStart',
      captured: 'onAnimationStartCapture',
    },
  },
  blur: {
    phasedRegistrationNames: {
      bubbled: 'onBlur',
      captured: 'onBlurCapture',
    },
  },
  cancel: {
    phasedRegistrationNames: {
      bubbled: 'onCancel',
      captured: 'onCancelCapture',
    },
  },
  canPlay: {
    phasedRegistrationNames: {
      bubbled: 'onCanPlay',
      captured: 'onCanPlayCapture',
    },
  },
  canPlayThrough: {
    phasedRegistrationNames: {
      bubbled: 'onCanPlayThrough',
      captured: 'onCanPlayThroughCapture',
    },
  },
  click: {
    phasedRegistrationNames: {
      bubbled: 'onClick',
      captured: 'onClickCapture',
    },
  },
  close: {
    phasedRegistrationNames: {
      bubbled: 'onClose',
      captured: 'onCloseCapture',
    },
  },
  contextMenu: {
    phasedRegistrationNames: {
      bubbled: 'onContextMenu',
      captured: 'onContextMenuCapture',
    },
  },
  copy: {
    phasedRegistrationNames: {
      bubbled: 'onCopy',
      captured: 'onCopyCapture',
    },
  },
  cut: {
    phasedRegistrationNames: {
      bubbled: 'onCut',
      captured: 'onCutCapture',
    },
  },
  doubleClick: {
    phasedRegistrationNames: {
      bubbled: 'onDoubleClick',
      captured: 'onDoubleClickCapture',
    },
  },
  drag: {
    phasedRegistrationNames: {
      bubbled: 'onDrag',
      captured: 'onDragCapture',
    },
  },
  dragEnd: {
    phasedRegistrationNames: {
      bubbled: 'onDragEnd',
      captured: 'onDragEndCapture',
    },
  },
  dragEnter: {
    phasedRegistrationNames: {
      bubbled: 'onDragEnter',
      captured: 'onDragEnterCapture',
    },
  },
  dragExit: {
    phasedRegistrationNames: {
      bubbled: 'onDragExit',
      captured: 'onDragExitCapture',
    },
  },
  dragLeave: {
    phasedRegistrationNames: {
      bubbled: 'onDragLeave',
      captured: 'onDragLeaveCapture',
    },
  },
  dragOver: {
    phasedRegistrationNames: {
      bubbled: 'onDragOver',
      captured: 'onDragOverCapture',
    },
  },
  dragStart: {
    phasedRegistrationNames: {
      bubbled: 'onDragStart',
      captured: 'onDragStartCapture',
    },
  },
  drop: {
    phasedRegistrationNames: {
      bubbled: 'onDrop',
      captured: 'onDropCapture',
    },
  },
  durationChange: {
    phasedRegistrationNames: {
      bubbled: 'onDurationChange',
      captured: 'onDurationChangeCapture',
    },
  },
  emptied: {
    phasedRegistrationNames: {
      bubbled: 'onEmptied',
      captured: 'onEmptiedCapture',
    },
  },
  encrypted: {
    phasedRegistrationNames: {
      bubbled: 'onEncrypted',
      captured: 'onEncryptedCapture',
    },
  },
  ended: {
    phasedRegistrationNames: {
      bubbled: 'onEnded',
      captured: 'onEndedCapture',
    },
  },
  error: {
    phasedRegistrationNames: {
      bubbled: 'onError',
      captured: 'onErrorCapture',
    },
  },
  focus: {
    phasedRegistrationNames: {
      bubbled: 'onFocus',
      captured: 'onFocusCapture',
    },
  },
  input: {
    phasedRegistrationNames: {
      bubbled: 'onInput',
      captured: 'onInputCapture',
    },
  },
  invalid: {
    phasedRegistrationNames: {
      bubbled: 'onInvalid',
      captured: 'onInvalidCapture',
    },
  },
  keyDown: {
    phasedRegistrationNames: {
      bubbled: 'onKeyDown',
      captured: 'onKeyDownCapture',
    },
  },
  keyPress: {
    phasedRegistrationNames: {
      bubbled: 'onKeyPress',
      captured: 'onKeyPressCapture',
    },
  },
  keyUp: {
    phasedRegistrationNames: {
      bubbled: 'onKeyUp',
      captured: 'onKeyUpCapture',
    },
  },
  load: {
    phasedRegistrationNames: {
      bubbled: 'onLoad',
      captured: 'onLoadCapture',
    },
  },
  loadedData: {
    phasedRegistrationNames: {
      bubbled: 'onLoadedData',
      captured: 'onLoadedDataCapture',
    },
  },
  loadedMetadata: {
    phasedRegistrationNames: {
      bubbled: 'onLoadedMetadata',
      captured: 'onLoadedMetadataCapture',
    },
  },
  loadStart: {
    phasedRegistrationNames: {
      bubbled: 'onLoadStart',
      captured: 'onLoadStartCapture',
    },
  },
  mouseDown: {
    phasedRegistrationNames: {
      bubbled: 'onMouseDown',
      captured: 'onMouseDownCapture',
    },
  },
  mouseMove: {
    phasedRegistrationNames: {
      bubbled: 'onMouseMove',
      captured: 'onMouseMoveCapture',
    },
  },
  mouseOut: {
    phasedRegistrationNames: {
      bubbled: 'onMouseOut',
      captured: 'onMouseOutCapture',
    },
  },
  mouseOver: {
    phasedRegistrationNames: {
      bubbled: 'onMouseOver',
      captured: 'onMouseOverCapture',
    },
  },
  mouseUp: {
    phasedRegistrationNames: {
      bubbled: 'onMouseUp',
      captured: 'onMouseUpCapture',
    },
  },
  paste: {
    phasedRegistrationNames: {
      bubbled: 'onPaste',
      captured: 'onPasteCapture',
    },
  },
  pause: {
    phasedRegistrationNames: {
      bubbled: 'onPause',
      captured: 'onPauseCapture',
    },
  },
  play: {
    phasedRegistrationNames: {
      bubbled: 'onPlay',
      captured: 'onPlayCapture',
    },
  },
  playing: {
    phasedRegistrationNames: {
      bubbled: 'onPlaying',
      captured: 'onPlayingCapture',
    },
  },
  progress: {
    phasedRegistrationNames: {
      bubbled: 'onProgress',
      captured: 'onProgressCapture',
    },
  },
  rateChange: {
    phasedRegistrationNames: {
      bubbled: 'onRateChange',
      captured: 'onRateChangeCapture',
    },
  },
  reset: {
    phasedRegistrationNames: {
      bubbled: 'onReset',
      captured: 'onResetCapture',
    },
  },
  scroll: {
    phasedRegistrationNames: {
      bubbled: 'onScroll',
      captured: 'onScrollCapture',
    },
  },
  seeked: {
    phasedRegistrationNames: {
      bubbled: 'onSeeked',
      captured: 'onSeekedCapture',
    },
  },
  seeking: {
    phasedRegistrationNames: {
      bubbled: 'onSeeking',
      captured: 'onSeekingCapture',
    },
  },
  stalled: {
    phasedRegistrationNames: {
      bubbled: 'onStalled',
      captured: 'onStalledCapture',
    },
  },
  submit: {
    phasedRegistrationNames: {
      bubbled: 'onSubmit',
      captured: 'onSubmitCapture',
    },
  },
  suspend: {
    phasedRegistrationNames: {
      bubbled: 'onSuspend',
      captured: 'onSuspendCapture',
    },
  },
  timeUpdate: {
    phasedRegistrationNames: {
      bubbled: 'onTimeUpdate',
      captured: 'onTimeUpdateCapture',
    },
  },
  touchCancel: {
    phasedRegistrationNames: {
      bubbled: 'onTouchCancel',
      captured: 'onTouchCancelCapture',
    },
  },
  touchEnd: {
    phasedRegistrationNames: {
      bubbled: 'onTouchEnd',
      captured: 'onTouchEndCapture',
    },
  },
  touchMove: {
    phasedRegistrationNames: {
      bubbled: 'onTouchMove',
      captured: 'onTouchMoveCapture',
    },
  },
  touchStart: {
    phasedRegistrationNames: {
      bubbled: 'onTouchStart',
      captured: 'onTouchStartCapture',
    },
  },
  transitionEnd: {
    phasedRegistrationNames: {
      bubbled: 'onTransitionEnd',
      captured: 'onTransitionEndCapture',
    },
  },
  volumeChange: {
    phasedRegistrationNames: {
      bubbled: 'onVolumeChange',
      captured: 'onVolumeChangeCapture',
    },
  },
  waiting: {
    phasedRegistrationNames: {
      bubbled: 'onWaiting',
      captured: 'onWaitingCapture',
    },
  },
  wheel: {
    phasedRegistrationNames: {
      bubbled: 'onWheel',
      captured: 'onWheelCapture',
    },
  },
};

const topLevelEventsToDispatchConfig: {
  [key: TopLevelTypes]: DispatchConfig,
} = {
  topAbort: eventTypes.abort,
  topAnimationEnd: eventTypes.animationEnd,
  topAnimationIteration: eventTypes.animationIteration,
  topAnimationStart: eventTypes.animationStart,
  topBlur: eventTypes.blur,
  topCancel: eventTypes.cancel,
  topCanPlay: eventTypes.canPlay,
  topCanPlayThrough: eventTypes.canPlayThrough,
  topClick: eventTypes.click,
  topClose: eventTypes.close,
  topContextMenu: eventTypes.contextMenu,
  topCopy: eventTypes.copy,
  topCut: eventTypes.cut,
  topDoubleClick: eventTypes.doubleClick,
  topDrag: eventTypes.drag,
  topDragEnd: eventTypes.dragEnd,
  topDragEnter: eventTypes.dragEnter,
  topDragExit: eventTypes.dragExit,
  topDragLeave: eventTypes.dragLeave,
  topDragOver: eventTypes.dragOver,
  topDragStart: eventTypes.dragStart,
  topDrop: eventTypes.drop,
  topDurationChange: eventTypes.durationChange,
  topEmptied: eventTypes.emptied,
  topEncrypted: eventTypes.encrypted,
  topEnded: eventTypes.ended,
  topError: eventTypes.error,
  topFocus: eventTypes.focus,
  topInput: eventTypes.input,
  topInvalid: eventTypes.invalid,
  topKeyDown: eventTypes.keyDown,
  topKeyPress: eventTypes.keyPress,
  topKeyUp: eventTypes.keyUp,
  topLoad: eventTypes.load,
  topLoadedData: eventTypes.loadedData,
  topLoadedMetadata: eventTypes.loadedMetadata,
  topLoadStart: eventTypes.loadStart,
  topMouseDown: eventTypes.mouseDown,
  topMouseMove: eventTypes.mouseMove,
  topMouseOut: eventTypes.mouseOut,
  topMouseOver: eventTypes.mouseOver,
  topMouseUp: eventTypes.mouseUp,
  topPaste: eventTypes.paste,
  topPause: eventTypes.pause,
  topPlay: eventTypes.play,
  topPlaying: eventTypes.playing,
  topProgress: eventTypes.progress,
  topRateChange: eventTypes.rateChange,
  topReset: eventTypes.reset,
  topScroll: eventTypes.scroll,
  topSeeked: eventTypes.seeked,
  topSeeking: eventTypes.seeking,
  topStalled: eventTypes.stalled,
  topSubmit: eventTypes.submit,
  topSuspend: eventTypes.suspend,
  topTimeUpdate: eventTypes.timeUpdate,
  topTouchCancel: eventTypes.touchCancel,
  topTouchEnd: eventTypes.touchEnd,
  topTouchMove: eventTypes.touchMove,
  topTouchStart: eventTypes.touchStart,
  topTransitionEnd: eventTypes.transitionEnd,
  topVolumeChange: eventTypes.volumeChange,
  topWaiting: eventTypes.waiting,
  topWheel: eventTypes.wheel,
};

for (var type in topLevelEventsToDispatchConfig) {
  topLevelEventsToDispatchConfig[type].dependencies = [type];
}

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
