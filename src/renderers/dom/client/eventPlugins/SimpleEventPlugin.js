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

var eventTypes = {
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
  // Note: We do not allow listening to mouseOver events. Instead, use the
  // onMouseEnter/onMouseLeave created by `EnterLeaveEventPlugin`.
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
    if (registrationName === 'onClick') {
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
    if (registrationName === 'onClick') {
      var key = getDictionaryKey(inst);
      onClickListeners[key].remove();
      delete onClickListeners[key];
    }
  },

};

module.exports = SimpleEventPlugin;
