/**
 * Copyright 2013-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @providesModule SimpleEventPlugin
 */

'use strict';

var EventListener = require('EventListener');
var EventPropagators = require('EventPropagators');
var ReactDOMComponentTree = require('ReactDOMComponentTree');
var SyntheticAnimationEvent = require('SyntheticAnimationEvent');
var SyntheticClipboardEvent = require('SyntheticClipboardEvent');
var SyntheticEvent = require('SyntheticEvent');
var SyntheticFocusEvent = require('SyntheticFocusEvent');
var SyntheticKeyboardEvent = require('SyntheticKeyboardEvent');
var SyntheticMouseEvent = require('SyntheticMouseEvent');
var SyntheticDragEvent = require('SyntheticDragEvent');
var SyntheticTouchEvent = require('SyntheticTouchEvent');
var SyntheticTransitionEvent = require('SyntheticTransitionEvent');
var SyntheticUIEvent = require('SyntheticUIEvent');
var SyntheticWheelEvent = require('SyntheticWheelEvent');

var emptyFunction = require('emptyFunction');
var getEventCharCode = require('getEventCharCode');
var invariant = require('invariant');
var keyOf = require('keyOf');

var eventTypes = {
  abort: {
    phasedRegistrationNames: {
      bubbled: keyOf({onAbort: true}),
      captured: keyOf({onAbortCapture: true}),
    },
  },
  animationEnd: {
    phasedRegistrationNames: {
      bubbled: keyOf({onAnimationEnd: true}),
      captured: keyOf({onAnimationEndCapture: true}),
    },
  },
  animationIteration: {
    phasedRegistrationNames: {
      bubbled: keyOf({onAnimationIteration: true}),
      captured: keyOf({onAnimationIterationCapture: true}),
    },
  },
  animationStart: {
    phasedRegistrationNames: {
      bubbled: keyOf({onAnimationStart: true}),
      captured: keyOf({onAnimationStartCapture: true}),
    },
  },
  blur: {
    phasedRegistrationNames: {
      bubbled: keyOf({onBlur: true}),
      captured: keyOf({onBlurCapture: true}),
    },
  },
  canPlay: {
    phasedRegistrationNames: {
      bubbled: keyOf({onCanPlay: true}),
      captured: keyOf({onCanPlayCapture: true}),
    },
  },
  canPlayThrough: {
    phasedRegistrationNames: {
      bubbled: keyOf({onCanPlayThrough: true}),
      captured: keyOf({onCanPlayThroughCapture: true}),
    },
  },
  click: {
    phasedRegistrationNames: {
      bubbled: keyOf({onClick: true}),
      captured: keyOf({onClickCapture: true}),
    },
  },
  contextMenu: {
    phasedRegistrationNames: {
      bubbled: keyOf({onContextMenu: true}),
      captured: keyOf({onContextMenuCapture: true}),
    },
  },
  copy: {
    phasedRegistrationNames: {
      bubbled: keyOf({onCopy: true}),
      captured: keyOf({onCopyCapture: true}),
    },
  },
  cut: {
    phasedRegistrationNames: {
      bubbled: keyOf({onCut: true}),
      captured: keyOf({onCutCapture: true}),
    },
  },
  doubleClick: {
    phasedRegistrationNames: {
      bubbled: keyOf({onDoubleClick: true}),
      captured: keyOf({onDoubleClickCapture: true}),
    },
  },
  drag: {
    phasedRegistrationNames: {
      bubbled: keyOf({onDrag: true}),
      captured: keyOf({onDragCapture: true}),
    },
  },
  dragEnd: {
    phasedRegistrationNames: {
      bubbled: keyOf({onDragEnd: true}),
      captured: keyOf({onDragEndCapture: true}),
    },
  },
  dragEnter: {
    phasedRegistrationNames: {
      bubbled: keyOf({onDragEnter: true}),
      captured: keyOf({onDragEnterCapture: true}),
    },
  },
  dragExit: {
    phasedRegistrationNames: {
      bubbled: keyOf({onDragExit: true}),
      captured: keyOf({onDragExitCapture: true}),
    },
  },
  dragLeave: {
    phasedRegistrationNames: {
      bubbled: keyOf({onDragLeave: true}),
      captured: keyOf({onDragLeaveCapture: true}),
    },
  },
  dragOver: {
    phasedRegistrationNames: {
      bubbled: keyOf({onDragOver: true}),
      captured: keyOf({onDragOverCapture: true}),
    },
  },
  dragStart: {
    phasedRegistrationNames: {
      bubbled: keyOf({onDragStart: true}),
      captured: keyOf({onDragStartCapture: true}),
    },
  },
  drop: {
    phasedRegistrationNames: {
      bubbled: keyOf({onDrop: true}),
      captured: keyOf({onDropCapture: true}),
    },
  },
  durationChange: {
    phasedRegistrationNames: {
      bubbled: keyOf({onDurationChange: true}),
      captured: keyOf({onDurationChangeCapture: true}),
    },
  },
  emptied: {
    phasedRegistrationNames: {
      bubbled: keyOf({onEmptied: true}),
      captured: keyOf({onEmptiedCapture: true}),
    },
  },
  encrypted: {
    phasedRegistrationNames: {
      bubbled: keyOf({onEncrypted: true}),
      captured: keyOf({onEncryptedCapture: true}),
    },
  },
  ended: {
    phasedRegistrationNames: {
      bubbled: keyOf({onEnded: true}),
      captured: keyOf({onEndedCapture: true}),
    },
  },
  error: {
    phasedRegistrationNames: {
      bubbled: keyOf({onError: true}),
      captured: keyOf({onErrorCapture: true}),
    },
  },
  focus: {
    phasedRegistrationNames: {
      bubbled: keyOf({onFocus: true}),
      captured: keyOf({onFocusCapture: true}),
    },
  },
  input: {
    phasedRegistrationNames: {
      bubbled: keyOf({onInput: true}),
      captured: keyOf({onInputCapture: true}),
    },
  },
  invalid: {
    phasedRegistrationNames: {
      bubbled: keyOf({onInvalid: true}),
      captured: keyOf({onInvalidCapture: true}),
    },
  },
  keyDown: {
    phasedRegistrationNames: {
      bubbled: keyOf({onKeyDown: true}),
      captured: keyOf({onKeyDownCapture: true}),
    },
  },
  keyPress: {
    phasedRegistrationNames: {
      bubbled: keyOf({onKeyPress: true}),
      captured: keyOf({onKeyPressCapture: true}),
    },
  },
  keyUp: {
    phasedRegistrationNames: {
      bubbled: keyOf({onKeyUp: true}),
      captured: keyOf({onKeyUpCapture: true}),
    },
  },
  load: {
    phasedRegistrationNames: {
      bubbled: keyOf({onLoad: true}),
      captured: keyOf({onLoadCapture: true}),
    },
  },
  loadedData: {
    phasedRegistrationNames: {
      bubbled: keyOf({onLoadedData: true}),
      captured: keyOf({onLoadedDataCapture: true}),
    },
  },
  loadedMetadata: {
    phasedRegistrationNames: {
      bubbled: keyOf({onLoadedMetadata: true}),
      captured: keyOf({onLoadedMetadataCapture: true}),
    },
  },
  loadStart: {
    phasedRegistrationNames: {
      bubbled: keyOf({onLoadStart: true}),
      captured: keyOf({onLoadStartCapture: true}),
    },
  },
  // Note: We do not allow listening to mouseOver events. Instead, use the
  // onMouseEnter/onMouseLeave created by `EnterLeaveEventPlugin`.
  mouseDown: {
    phasedRegistrationNames: {
      bubbled: keyOf({onMouseDown: true}),
      captured: keyOf({onMouseDownCapture: true}),
    },
  },
  mouseMove: {
    phasedRegistrationNames: {
      bubbled: keyOf({onMouseMove: true}),
      captured: keyOf({onMouseMoveCapture: true}),
    },
  },
  mouseOut: {
    phasedRegistrationNames: {
      bubbled: keyOf({onMouseOut: true}),
      captured: keyOf({onMouseOutCapture: true}),
    },
  },
  mouseOver: {
    phasedRegistrationNames: {
      bubbled: keyOf({onMouseOver: true}),
      captured: keyOf({onMouseOverCapture: true}),
    },
  },
  mouseUp: {
    phasedRegistrationNames: {
      bubbled: keyOf({onMouseUp: true}),
      captured: keyOf({onMouseUpCapture: true}),
    },
  },
  paste: {
    phasedRegistrationNames: {
      bubbled: keyOf({onPaste: true}),
      captured: keyOf({onPasteCapture: true}),
    },
  },
  pause: {
    phasedRegistrationNames: {
      bubbled: keyOf({onPause: true}),
      captured: keyOf({onPauseCapture: true}),
    },
  },
  play: {
    phasedRegistrationNames: {
      bubbled: keyOf({onPlay: true}),
      captured: keyOf({onPlayCapture: true}),
    },
  },
  playing: {
    phasedRegistrationNames: {
      bubbled: keyOf({onPlaying: true}),
      captured: keyOf({onPlayingCapture: true}),
    },
  },
  progress: {
    phasedRegistrationNames: {
      bubbled: keyOf({onProgress: true}),
      captured: keyOf({onProgressCapture: true}),
    },
  },
  rateChange: {
    phasedRegistrationNames: {
      bubbled: keyOf({onRateChange: true}),
      captured: keyOf({onRateChangeCapture: true}),
    },
  },
  reset: {
    phasedRegistrationNames: {
      bubbled: keyOf({onReset: true}),
      captured: keyOf({onResetCapture: true}),
    },
  },
  scroll: {
    phasedRegistrationNames: {
      bubbled: keyOf({onScroll: true}),
      captured: keyOf({onScrollCapture: true}),
    },
  },
  seeked: {
    phasedRegistrationNames: {
      bubbled: keyOf({onSeeked: true}),
      captured: keyOf({onSeekedCapture: true}),
    },
  },
  seeking: {
    phasedRegistrationNames: {
      bubbled: keyOf({onSeeking: true}),
      captured: keyOf({onSeekingCapture: true}),
    },
  },
  stalled: {
    phasedRegistrationNames: {
      bubbled: keyOf({onStalled: true}),
      captured: keyOf({onStalledCapture: true}),
    },
  },
  submit: {
    phasedRegistrationNames: {
      bubbled: keyOf({onSubmit: true}),
      captured: keyOf({onSubmitCapture: true}),
    },
  },
  suspend: {
    phasedRegistrationNames: {
      bubbled: keyOf({onSuspend: true}),
      captured: keyOf({onSuspendCapture: true}),
    },
  },
  timeUpdate: {
    phasedRegistrationNames: {
      bubbled: keyOf({onTimeUpdate: true}),
      captured: keyOf({onTimeUpdateCapture: true}),
    },
  },
  touchCancel: {
    phasedRegistrationNames: {
      bubbled: keyOf({onTouchCancel: true}),
      captured: keyOf({onTouchCancelCapture: true}),
    },
  },
  touchEnd: {
    phasedRegistrationNames: {
      bubbled: keyOf({onTouchEnd: true}),
      captured: keyOf({onTouchEndCapture: true}),
    },
  },
  touchMove: {
    phasedRegistrationNames: {
      bubbled: keyOf({onTouchMove: true}),
      captured: keyOf({onTouchMoveCapture: true}),
    },
  },
  touchStart: {
    phasedRegistrationNames: {
      bubbled: keyOf({onTouchStart: true}),
      captured: keyOf({onTouchStartCapture: true}),
    },
  },
  transitionEnd: {
    phasedRegistrationNames: {
      bubbled: keyOf({onTransitionEnd: true}),
      captured: keyOf({onTransitionEndCapture: true}),
    },
  },
  volumeChange: {
    phasedRegistrationNames: {
      bubbled: keyOf({onVolumeChange: true}),
      captured: keyOf({onVolumeChangeCapture: true}),
    },
  },
  waiting: {
    phasedRegistrationNames: {
      bubbled: keyOf({onWaiting: true}),
      captured: keyOf({onWaitingCapture: true}),
    },
  },
  wheel: {
    phasedRegistrationNames: {
      bubbled: keyOf({onWheel: true}),
      captured: keyOf({onWheelCapture: true}),
    },
  },
};

var topLevelEventsToDispatchConfig = {
  topAbort:           eventTypes.abort,
  topAnimationEnd:    eventTypes.animationEnd,
  topAnimationIteration: eventTypes.animationIteration,
  topAnimationStart:  eventTypes.animationStart,
  topBlur:            eventTypes.blur,
  topCanPlay:         eventTypes.canPlay,
  topCanPlayThrough:  eventTypes.canPlayThrough,
  topClick:           eventTypes.click,
  topContextMenu:     eventTypes.contextMenu,
  topCopy:            eventTypes.copy,
  topCut:             eventTypes.cut,
  topDoubleClick:     eventTypes.doubleClick,
  topDrag:            eventTypes.drag,
  topDragEnd:         eventTypes.dragEnd,
  topDragEnter:       eventTypes.dragEnter,
  topDragExit:        eventTypes.dragExit,
  topDragLeave:       eventTypes.dragLeave,
  topDragOver:        eventTypes.dragOver,
  topDragStart:       eventTypes.dragStart,
  topDrop:            eventTypes.drop,
  topDurationChange:  eventTypes.durationChange,
  topEmptied:         eventTypes.emptied,
  topEncrypted:       eventTypes.encrypted,
  topEnded:           eventTypes.ended,
  topError:           eventTypes.error,
  topFocus:           eventTypes.focus,
  topInput:           eventTypes.input,
  topInvalid:         eventTypes.invalid,
  topKeyDown:         eventTypes.keyDown,
  topKeyPress:        eventTypes.keyPress,
  topKeyUp:           eventTypes.keyUp,
  topLoad:            eventTypes.load,
  topLoadedData:      eventTypes.loadedData,
  topLoadedMetadata:  eventTypes.loadedMetadata,
  topLoadStart:       eventTypes.loadStart,
  topMouseDown:       eventTypes.mouseDown,
  topMouseMove:       eventTypes.mouseMove,
  topMouseOut:        eventTypes.mouseOut,
  topMouseOver:       eventTypes.mouseOver,
  topMouseUp:         eventTypes.mouseUp,
  topPaste:           eventTypes.paste,
  topPause:           eventTypes.pause,
  topPlay:            eventTypes.play,
  topPlaying:         eventTypes.playing,
  topProgress:        eventTypes.progress,
  topRateChange:      eventTypes.rateChange,
  topReset:           eventTypes.reset,
  topScroll:          eventTypes.scroll,
  topSeeked:          eventTypes.seeked,
  topSeeking:         eventTypes.seeking,
  topStalled:         eventTypes.stalled,
  topSubmit:          eventTypes.submit,
  topSuspend:         eventTypes.suspend,
  topTimeUpdate:      eventTypes.timeUpdate,
  topTouchCancel:     eventTypes.touchCancel,
  topTouchEnd:        eventTypes.touchEnd,
  topTouchMove:       eventTypes.touchMove,
  topTouchStart:      eventTypes.touchStart,
  topTransitionEnd:   eventTypes.transitionEnd,
  topVolumeChange:    eventTypes.volumeChange,
  topWaiting:         eventTypes.waiting,
  topWheel:           eventTypes.wheel,
};

for (var type in topLevelEventsToDispatchConfig) {
  topLevelEventsToDispatchConfig[type].dependencies = [type];
}

var ON_CLICK_KEY = keyOf({onClick: null});
var onClickListeners = {};

function getDictionaryKey(inst) {
  // Prevents V8 performance issue:
  // https://github.com/facebook/react/pull/7232
  return '.' + inst._rootNodeID;
}

var SimpleEventPlugin = {

  eventTypes: eventTypes,

  extractEvents: function(
    topLevelType,
    targetInst,
    nativeEvent,
    nativeEventTarget
  ) {
    var dispatchConfig = topLevelEventsToDispatchConfig[topLevelType];
    if (!dispatchConfig) {
      return null;
    }
    var EventConstructor;
    switch (topLevelType) {
      case 'topAbort':
      case 'topCanPlay':
      case 'topCanPlayThrough':
      case 'topDurationChange':
      case 'topEmptied':
      case 'topEncrypted':
      case 'topEnded':
      case 'topError':
      case 'topInput':
      case 'topInvalid':
      case 'topLoad':
      case 'topLoadedData':
      case 'topLoadedMetadata':
      case 'topLoadStart':
      case 'topPause':
      case 'topPlay':
      case 'topPlaying':
      case 'topProgress':
      case 'topRateChange':
      case 'topReset':
      case 'topSeeked':
      case 'topSeeking':
      case 'topStalled':
      case 'topSubmit':
      case 'topSuspend':
      case 'topTimeUpdate':
      case 'topVolumeChange':
      case 'topWaiting':
        // HTML Events
        // @see http://www.w3.org/TR/html5/index.html#events-0
        EventConstructor = SyntheticEvent;
        break;
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
      case 'topContextMenu':
      case 'topDoubleClick':
      case 'topMouseDown':
      case 'topMouseMove':
      case 'topMouseOut':
      case 'topMouseOver':
      case 'topMouseUp':
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
    }
    invariant(
      EventConstructor,
      'SimpleEventPlugin: Unhandled event type, `%s`.',
      topLevelType
    );
    var event = EventConstructor.getPooled(
      dispatchConfig,
      targetInst,
      nativeEvent,
      nativeEventTarget
    );
    EventPropagators.accumulateTwoPhaseDispatches(event);
    return event;
  },

  didPutListener: function(inst, registrationName, listener) {
    // Mobile Safari does not fire properly bubble click events on
    // non-interactive elements, which means delegated click listeners do not
    // fire. The workaround for this bug involves attaching an empty click
    // listener on the target node.
    if (registrationName === ON_CLICK_KEY) {
      var key = getDictionaryKey(inst);
      var node = ReactDOMComponentTree.getNodeFromInstance(inst);
      if (!onClickListeners[key]) {
        onClickListeners[key] = EventListener.listen(
          node,
          'click',
          emptyFunction
        );
      }
    }
  },

  willDeleteListener: function(inst, registrationName) {
    if (registrationName === ON_CLICK_KEY) {
      var key = getDictionaryKey(inst);
      onClickListeners[key].remove();
      delete onClickListeners[key];
    }
  },

};

module.exports = SimpleEventPlugin;
