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
 * @providesModule ReactEvent
 */

"use strict";

var BrowserEnv = require("./BrowserEnv");
var EventConstants = require("./EventConstants");
var EventPluginHub = require("./EventPluginHub");
var ExecutionEnvironment = require("./ExecutionEnvironment");
var NormalizedEventListener = require("./NormalizedEventListener");

var invariant = require("./invariant");
var isEventSupported = require("./isEventSupported");

var registrationNames = EventPluginHub.registrationNames;
var topLevelTypes = EventConstants.topLevelTypes;
var listen = NormalizedEventListener.listen;
var capture = NormalizedEventListener.capture;

/**
 * `ReactEvent` is used to attach top-level event listeners. For example:
 *
 *   ReactEvent.putListener('myID', 'onClick', myFunction);
 *
 * This would allocate a "registration" of `('onClick', myFunction)` on 'myID'.
 */

/**
 * Overview of React and the event system:
 *
 *                    .
 * +-------------+    .
 * |    DOM      |    .
 * +-------------+    .                          +-----------+
 *       +            .                +--------+|SimpleEvent|
 *       |            .                |         |Plugin     |
 * +-----|-------+    .                v         +-----------+
 * |     |       |    .     +--------------+                    +------------+
 * |     +------------.---->|EventPluginHub|                    |    Event   |
 * |             |    .     |              |     +-----------+  | Propagators|
 * | ReactEvent  |    .     |              |     |TapEvent   |  |------------|
 * |             |    .     |              |<---+|Plugin     |  |other plugin|
 * |     +------------.---------+          |     +-----------+  |  utilities |
 * |     |       |    .     |   |          |                    +------------+
 * |     |       |    .     +---|----------+
 * |     |       |    .         |       ^        +-----------+
 * |     |       |    .         |       |        |Enter/Leave|
 * +-----| ------+    .         |       +-------+|Plugin     |
 *       |            .         v                +-----------+
 *       +            .      +--------+
 * +-------------+    .      |callback|
 * | application |    .      |registry|
 * |-------------|    .      +--------+
 * |             |    .
 * |             |    .
 * |             |    .
 * |             |    .
 * +-------------+    .
 *                    .
 *    React Core      .  General Purpose Event Plugin System
 */

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
 * @see http://www.quirksmode.org/dom/events/keys.html.
 */

var _isListening = false;

var EVENT_LISTEN_MISUSE;
var WORKER_DISABLE;

if (true) {
  EVENT_LISTEN_MISUSE =
    'You must register listeners at the top of the document, only once - ' +
    'and only in the main UI thread of a browser - if you are attempting ' +
    'listen in a worker, the framework is probably doing something wrong ' +
    'and you should report this immediately.';
  WORKER_DISABLE =
    'Cannot disable event listening in Worker thread. This is likely a ' +
    'bug in the framework. Please report immediately.';
}


/**
 * Traps top-level events that bubble. Delegates to the main dispatcher
 * `handleTopLevel` after performing some basic normalization via
 * `TopLevelCallbackCreator.createTopLevelCallback`.
 */
function trapBubbledEvent(topLevelType, handlerBaseName, onWhat) {
  listen(
    onWhat,
    handlerBaseName,
    ReactEvent.TopLevelCallbackCreator.createTopLevelCallback(topLevelType)
  );
}

/**
 * Traps a top-level event by using event capturing.
 */
function trapCapturedEvent(topLevelType, handlerBaseName, onWhat) {
  capture(
    onWhat,
    handlerBaseName,
    ReactEvent.TopLevelCallbackCreator.createTopLevelCallback(topLevelType)
  );
}

/**
 * Listens to document scroll and window resize events that may change the
 * document scroll values. We store those results so as to discourage
 * application code from asking the DOM itself which could trigger additional
 * reflows.
 */
function registerDocumentScrollListener() {
  listen(window, 'scroll', function(nativeEvent) {
    if (nativeEvent.target === window) {
      BrowserEnv.refreshAuthoritativeScrollValues();
    }
  });
}

function registerDocumentResizeListener() {
  listen(window, 'resize', function(nativeEvent) {
    if (nativeEvent.target === window) {
      BrowserEnv.refreshAuthoritativeScrollValues();
    }
  });
}

/**
 * Summary of `ReactEvent` event handling:
 *
 *  - We trap low level 'top-level' events.
 *
 *  - We dedupe cross-browser event names into these 'top-level types' so that
 *    `DOMMouseScroll` or `mouseWheel` both become `topMouseWheel`.
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
 * @private
 */
function listenAtTopLevel(touchNotMouse) {
  invariant(
    !_isListening,
    'listenAtTopLevel(...): Cannot setup top-level listener more than once.'
  );
  var mountAt = document;

  registerDocumentScrollListener();
  registerDocumentResizeListener();
  trapBubbledEvent(topLevelTypes.topMouseOver, 'mouseover', mountAt);
  trapBubbledEvent(topLevelTypes.topMouseDown, 'mousedown', mountAt);
  trapBubbledEvent(topLevelTypes.topMouseUp, 'mouseup', mountAt);
  trapBubbledEvent(topLevelTypes.topMouseMove, 'mousemove', mountAt);
  trapBubbledEvent(topLevelTypes.topMouseOut, 'mouseout', mountAt);
  trapBubbledEvent(topLevelTypes.topClick, 'click', mountAt);
  trapBubbledEvent(topLevelTypes.topDoubleClick, 'dblclick', mountAt);
  trapBubbledEvent(topLevelTypes.topMouseWheel, 'mousewheel', mountAt);
  if (touchNotMouse) {
    trapBubbledEvent(topLevelTypes.topTouchStart, 'touchstart', mountAt);
    trapBubbledEvent(topLevelTypes.topTouchEnd, 'touchend', mountAt);
    trapBubbledEvent(topLevelTypes.topTouchMove, 'touchmove', mountAt);
    trapBubbledEvent(topLevelTypes.topTouchCancel, 'touchcancel', mountAt);
  }
  trapBubbledEvent(topLevelTypes.topKeyUp, 'keyup', mountAt);
  trapBubbledEvent(topLevelTypes.topKeyPress, 'keypress', mountAt);
  trapBubbledEvent(topLevelTypes.topKeyDown, 'keydown', mountAt);
  trapBubbledEvent(topLevelTypes.topChange, 'change', mountAt);
  trapBubbledEvent(
    topLevelTypes.topDOMCharacterDataModified,
    'DOMCharacterDataModified',
    mountAt
  );

  // Firefox needs to capture a different mouse scroll event.
  // @see http://www.quirksmode.org/dom/events/tests/scroll.html
  trapBubbledEvent(topLevelTypes.topMouseWheel, 'DOMMouseScroll', mountAt);
  // IE < 9 doesn't support capturing so just trap the bubbled event there.
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
 * This is the heart of `ReactEvent`. It simply streams the top-level native
 * events to `EventPluginHub`.
 *
 * @param {object} topLevelType Record from `EventConstants`.
 * @param {Event} nativeEvent A Standard Event with fixed `target` property.
 * @param {DOMElement} renderedTarget Element of interest to the framework.
 * @param {string} renderedTargetID string ID of `renderedTarget`.
 * @internal
 */
function handleTopLevel(
    topLevelType,
    nativeEvent,
    renderedTargetID,
    renderedTarget) {
  var abstractEvents = EventPluginHub.extractAbstractEvents(
    topLevelType,
    nativeEvent,
    renderedTargetID,
    renderedTarget
  );

  // The event queue being processed in the same cycle allows preventDefault.
  EventPluginHub.enqueueAbstractEvents(abstractEvents);
  EventPluginHub.processAbstractEventQueue();
}

function setEnabled(enabled) {
  invariant(
    ExecutionEnvironment.canUseDOM,
    'setEnabled(...): Cannot toggle event listening in a Worker thread. This ' +
    'is likely a bug in the framework. Please report immediately.'
  );
  ReactEvent.TopLevelCallbackCreator.setEnabled(enabled);
}

function isEnabled() {
  return ReactEvent.TopLevelCallbackCreator.isEnabled();
}

/**
 * Ensures that top-level event delegation listeners are listening at `mountAt`.
 * There are issues with listening to both touch events and mouse events on the
 * top-level, so we make the caller choose which one to listen to. (If there's a
 * touch top-level listeners, anchors don't receive clicks for some reason, and
 * only in some cases).
 *
 * @param {boolean} touchNotMouse Listen to touch events instead of mouse.
 * @param {object} TopLevelCallbackCreator Module that can create top-level
 *   callback handlers.
 * @internal
 */
function ensureListening(touchNotMouse, TopLevelCallbackCreator) {
  invariant(
    ExecutionEnvironment.canUseDOM,
    'ensureListening(...): Cannot toggle event listening in a Worker thread. ' +
    'This is likely a bug in the framework. Please report immediately.'
  );
  if (!_isListening) {
    ReactEvent.TopLevelCallbackCreator = TopLevelCallbackCreator;
    listenAtTopLevel(touchNotMouse);
    _isListening = true;
  }
}

var ReactEvent = {
  TopLevelCallbackCreator: null, // Injectable callback creator.
  handleTopLevel: handleTopLevel,
  setEnabled: setEnabled,
  isEnabled: isEnabled,
  ensureListening: ensureListening,
  registrationNames: registrationNames,
  putListener: EventPluginHub.putListener,
  getListener: EventPluginHub.getListener,
  deleteAllListeners: EventPluginHub.deleteAllListeners,
  trapBubbledEvent: trapBubbledEvent,
  trapCapturedEvent: trapCapturedEvent
};

module.exports = ReactEvent;
