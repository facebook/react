/**
 * Copyright 2013 Facebook, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
 * @providesModule ReactEventEmitter
 * @typechecks
 */

"use strict";

var BrowserEnv = require('BrowserEnv');
var EventConstants = require('EventConstants');
var EventListener = require('EventListener');
var EventPluginHub = require('EventPluginHub');
var ExecutionEnvironment = require('ExecutionEnvironment');

var invariant = require('invariant');
var isEventSupported = require('isEventSupported');

/**
 * Summary of `ReactEventEmitter` event handling:
 *
 *  - We trap low level 'top-level' events.
 *
 *  - We dedupe cross-browser event names into these 'top-level types' (e.g. so
 *    that `wheel`, `mousewheel`, and `DOMMouseScroll` fire one event).
 *
 *  - At this point we have native browser events with the top-level type that
 *    was used to catch it at the top-level.
 *
 *  - We continuously stream these native events (and their respective top-level
 *    types) to the event plugin system `EventPluginHub` and ask the plugin
 *    system if it was able to extract `AbstractEvent` objects. `AbstractEvent`
 *    objects are the events that applications actually deal with - they are not
 *    native browser events but cross-browser wrappers.
 *
 *  - When returning the `AbstractEvent` objects, `EventPluginHub` will make
 *    sure each abstract event is annotated with "dispatches", which are the
 *    sequence of listeners (and IDs) that care about the event.
 *
 *  - These `AbstractEvent` objects are fed back into the event plugin system,
 *    which in turn executes these dispatches.
 *
 * Overview of React and the event system:
 *
 *                   .
 * +------------+    .
 * |    DOM     |    .
 * +------------+    .                         +-----------+
 *       +           .               +--------+|SimpleEvent|
 *       |           .               |         |Plugin     |
 * +-----|------+    .               v         +-----------+
 * |     |      |    .    +--------------+                    +------------+
 * |     +-----------.--->|EventPluginHub|                    |    Event   |
 * |            |    .    |              |     +-----------+  | Propagators|
 * | ReactEvent |    .    |              |     |TapEvent   |  |------------|
 * |  Emitter   |    .    |              |<---+|Plugin     |  |other plugin|
 * |            |    .    |              |     +-----------+  |  utilities |
 * |     +-----------.---------+         |                    +------------+
 * |     |      |    .    +----|---------+
 * +-----|------+    .         |      ^        +-----------+
 *       |           .         |      |        |Enter/Leave|
 *       +           .         |      +-------+|Plugin     |
 * +-------------+   .         v               +-----------+
 * | application |   .    +----------+
 * |-------------|   .    | callback |
 * |             |   .    | registry |
 * |             |   .    +----------+
 * +-------------+   .
 *                   .
 *    React Core     .  General Purpose Event Plugin System
 */

/**
 * Whether or not `ensureListening` has been invoked.
 * @type {boolean}
 * @private
 */
var _isListening = false;

/**
 * Traps top-level events by using event bubbling.
 *
 * @param {string} topLevelType Record from `EventConstants`.
 * @param {string} handlerBaseName Event name (e.g. "click").
 * @param {DOMEventTarget} element Element on which to attach listener.
 * @internal
 */
function trapBubbledEvent(topLevelType, handlerBaseName, element) {
  EventListener.listen(
    element,
    handlerBaseName,
    ReactEventEmitter.TopLevelCallbackCreator.createTopLevelCallback(
      topLevelType
    )
  );
}

/**
 * Traps a top-level event by using event capturing.
 *
 * @param {string} topLevelType Record from `EventConstants`.
 * @param {string} handlerBaseName Event name (e.g. "click").
 * @param {DOMEventTarget} element Element on which to attach listener.
 * @internal
 */
function trapCapturedEvent(topLevelType, handlerBaseName, element) {
  EventListener.capture(
    element,
    handlerBaseName,
    ReactEventEmitter.TopLevelCallbackCreator.createTopLevelCallback(
      topLevelType
    )
  );
}

/**
 * Listens to window scroll and resize events. We cache scroll values so that
 * application code can access them without triggering reflows.
 *
 * NOTE: Scroll events do not bubble.
 *
 * @private
 * @see http://www.quirksmode.org/dom/events/scroll.html
 */
function registerScrollValueMonitoring() {
  var refresh = BrowserEnv.refreshAuthoritativeScrollValues;
  EventListener.listen(window, 'scroll', refresh);
  EventListener.listen(window, 'resize', refresh);
}

/**
 * We listen for bubbled touch events on the document object.
 *
 * Firefox v8.01 (and possibly others) exhibited strange behavior when mounting
 * `onmousemove` events at some node that was not the document element. The
 * symptoms were that if your mouse is not moving over something contained
 * within that mount point (for example on the background) the top-level
 * listeners for `onmousemove` won't be called. However, if you register the
 * `mousemove` on the document object, then it will of course catch all
 * `mousemove`s. This along with iOS quirks, justifies restricting top-level
 * listeners to the document object only, at least for these movement types of
 * events and possibly all events.
 *
 * @see http://www.quirksmode.org/blog/archives/2010/09/click_event_del.html
 *
 * Also, `keyup`/`keypress`/`keydown` do not bubble to the window on IE, but
 * they bubble to document.
 *
 * @param {boolean} touchNotMouse Listen to touch events instead of mouse.
 * @private
 * @see http://www.quirksmode.org/dom/events/keys.html.
 */
function listenAtTopLevel(touchNotMouse) {
  invariant(
    !_isListening,
    'listenAtTopLevel(...): Cannot setup top-level listener more than once.'
  );
  var topLevelTypes = EventConstants.topLevelTypes;
  var mountAt = document;

  registerScrollValueMonitoring();
  trapBubbledEvent(topLevelTypes.topMouseOver, 'mouseover', mountAt);
  trapBubbledEvent(topLevelTypes.topMouseDown, 'mousedown', mountAt);
  trapBubbledEvent(topLevelTypes.topMouseUp, 'mouseup', mountAt);
  trapBubbledEvent(topLevelTypes.topMouseMove, 'mousemove', mountAt);
  trapBubbledEvent(topLevelTypes.topMouseOut, 'mouseout', mountAt);
  trapBubbledEvent(topLevelTypes.topClick, 'click', mountAt);
  trapBubbledEvent(topLevelTypes.topDoubleClick, 'dblclick', mountAt);
  if (touchNotMouse) {
    trapBubbledEvent(topLevelTypes.topTouchStart, 'touchstart', mountAt);
    trapBubbledEvent(topLevelTypes.topTouchEnd, 'touchend', mountAt);
    trapBubbledEvent(topLevelTypes.topTouchMove, 'touchmove', mountAt);
    trapBubbledEvent(topLevelTypes.topTouchCancel, 'touchcancel', mountAt);
  }
  trapBubbledEvent(topLevelTypes.topKeyUp, 'keyup', mountAt);
  trapBubbledEvent(topLevelTypes.topKeyPress, 'keypress', mountAt);
  trapBubbledEvent(topLevelTypes.topKeyDown, 'keydown', mountAt);
  trapBubbledEvent(topLevelTypes.topInput, 'input', mountAt);
  trapBubbledEvent(topLevelTypes.topChange, 'change', mountAt);
  trapBubbledEvent(
    topLevelTypes.topSelectionChange,
    'selectionchange',
    mountAt
  );
  trapBubbledEvent(
    topLevelTypes.topDOMCharacterDataModified,
    'DOMCharacterDataModified',
    mountAt
  );

  if (isEventSupported('drag')) {
    trapBubbledEvent(topLevelTypes.topDrag, 'drag', mountAt);
    trapBubbledEvent(topLevelTypes.topDragEnd, 'dragend', mountAt);
    trapBubbledEvent(topLevelTypes.topDragEnter, 'dragenter', mountAt);
    trapBubbledEvent(topLevelTypes.topDragExit, 'dragexit', mountAt);
    trapBubbledEvent(topLevelTypes.topDragLeave, 'dragleave', mountAt);
    trapBubbledEvent(topLevelTypes.topDragOver, 'dragover', mountAt);
    trapBubbledEvent(topLevelTypes.topDragStart, 'dragstart', mountAt);
    trapBubbledEvent(topLevelTypes.topDrop, 'drop', mountAt);
  }

  if (isEventSupported('wheel')) {
    trapBubbledEvent(topLevelTypes.topWheel, 'wheel', mountAt);
  } else if (isEventSupported('mousewheel')) {
    trapBubbledEvent(topLevelTypes.topWheel, 'mousewheel', mountAt);
  } else {
    // Firefox needs to capture a different mouse scroll event.
    // @see http://www.quirksmode.org/dom/events/tests/scroll.html
    trapBubbledEvent(topLevelTypes.topWheel, 'DOMMouseScroll', mountAt);
  }

  // IE<9 does not support capturing so just trap the bubbled event there.
  if (isEventSupported('scroll', true)) {
    trapCapturedEvent(topLevelTypes.topScroll, 'scroll', mountAt);
  } else {
    trapBubbledEvent(topLevelTypes.topScroll, 'scroll', window);
  }

  if (isEventSupported('focus', true)) {
    trapCapturedEvent(topLevelTypes.topFocus, 'focus', mountAt);
    trapCapturedEvent(topLevelTypes.topBlur, 'blur', mountAt);
  } else if (isEventSupported('focusin')) {
    // IE has `focusin` and `focusout` events which bubble.
    // @see http://www.quirksmode.org/blog/archives/2008/04/delegating_the.html
    trapBubbledEvent(topLevelTypes.topFocus, 'focusin', mountAt);
    trapBubbledEvent(topLevelTypes.topBlur, 'focusout', mountAt);
  }
}

/**
 * `ReactEventEmitter` is used to attach top-level event listeners. For example:
 *
 *   ReactEventEmitter.putListener('myID', 'onClick', myFunction);
 *
 * This would allocate a "registration" of `('onClick', myFunction)` on 'myID'.
 *
 * @internal
 */
var ReactEventEmitter = {

  /**
   * React references `ReactEventTopLevelCallback` using this property in order
   * to allow dependency injection via `ensureListening`.
   */
  TopLevelCallbackCreator: null,

  /**
   * Ensures that top-level event delegation listeners are installed.
   *
   * There are issues with listening to both touch events and mouse events on
   * the top-level, so we make the caller choose which one to listen to. (If
   * there's a touch top-level listeners, anchors don't receive clicks for some
   * reason, and only in some cases).
   *
   * @param {boolean} touchNotMouse Listen to touch events instead of mouse.
   * @param {object} TopLevelCallbackCreator
   */
  ensureListening: function(touchNotMouse, TopLevelCallbackCreator) {
    invariant(
      ExecutionEnvironment.canUseDOM,
      'ensureListening(...): Cannot toggle event listening in a Worker ' +
      'thread. This is likely a bug in the framework. Please report ' +
      'immediately.'
    );
    if (!_isListening) {
      ReactEventEmitter.TopLevelCallbackCreator = TopLevelCallbackCreator;
      listenAtTopLevel(touchNotMouse);
      _isListening = true;
    }
  },

  /**
   * Sets whether or not any created callbacks should be enabled.
   *
   * @param {boolean} enabled True if callbacks should be enabled.
   */
  setEnabled: function(enabled) {
    invariant(
      ExecutionEnvironment.canUseDOM,
      'setEnabled(...): Cannot toggle event listening in a Worker thread. ' +
      'This is likely a bug in the framework. Please report immediately.'
    );
    if (ReactEventEmitter.TopLevelCallbackCreator) {
      ReactEventEmitter.TopLevelCallbackCreator.setEnabled(enabled);
    }
  },

  /**
   * @return {boolean} True if callbacks are enabled.
   */
  isEnabled: function() {
    return !!(
      ReactEventEmitter.TopLevelCallbackCreator &&
      ReactEventEmitter.TopLevelCallbackCreator.isEnabled()
    );
  },

  /**
   * Streams a fired top-level event to `EventPluginHub` where plugins have the
   * opportunity to create `ReactEvent`s to be dispatched.
   *
   * @param {string} topLevelType Record from `EventConstants`.
   * @param {DOMEventTarget} topLevelTarget The listening component root node.
   * @param {string} topLevelTargetID ID of `topLevelTarget`.
   * @param {object} nativeEvent Native browser event.
   */
  handleTopLevel: function(
      topLevelType,
      topLevelTarget,
      topLevelTargetID,
      nativeEvent) {
    var abstractEvents = EventPluginHub.extractAbstractEvents(
      topLevelType,
      topLevelTarget,
      topLevelTargetID,
      nativeEvent
    );

    // Event queue being processed in the same cycle allows `preventDefault`.
    EventPluginHub.enqueueAbstractEvents(abstractEvents);
    EventPluginHub.processAbstractEventQueue();
  },

  registrationNames: EventPluginHub.registrationNames,

  putListener: EventPluginHub.putListener,

  getListener: EventPluginHub.getListener,

  deleteListener: EventPluginHub.deleteListener,

  deleteAllListeners: EventPluginHub.deleteAllListeners,

  trapBubbledEvent: trapBubbledEvent,

  trapCapturedEvent: trapCapturedEvent

};

module.exports = ReactEventEmitter;
