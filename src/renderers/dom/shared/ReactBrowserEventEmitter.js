/**
 * Copyright (c) 2013-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @providesModule ReactBrowserEventEmitter
 */

'use strict';

var EventPluginRegistry = require('EventPluginRegistry');
var ReactDOMEventListener = require('ReactDOMEventListener');
var ReactEventEmitterMixin = require('ReactEventEmitterMixin');

var isEventSupported = require('isEventSupported');
var {topLevelTypes} = require('BrowserEventConstants');

/**
 * Summary of `ReactBrowserEventEmitter` event handling:
 *
 *  - Top-level delegation is used to trap most native browser events. This
 *    may only occur in the main thread and is the responsibility of
 *    ReactDOMEventListener, which is injected and can therefore support
 *    pluggable event sources. This is the only work that occurs in the main
 *    thread.
 *
 *  - We normalize and de-duplicate events to account for browser quirks. This
 *    may be done in the worker thread.
 *
 *  - Forward these native events (with the associated top-level type used to
 *    trap it) to `EventPluginHub`, which in turn will ask plugins if they want
 *    to extract any synthetic events.
 *
 *  - The `EventPluginHub` will then process each event by annotating them with
 *    "dispatches", a sequence of listeners and IDs that care about that event.
 *
 *  - The `EventPluginHub` then dispatches the events.
 *
 * Overview of React and the event system:
 *
 * +------------+    .
 * |    DOM     |    .
 * +------------+    .
 *       |           .
 *       v           .
 * +------------+    .
 * | ReactEvent |    .
 * |  Listener  |    .
 * +------------+    .                         +-----------+
 *       |           .               +--------+|SimpleEvent|
 *       |           .               |         |Plugin     |
 * +-----|------+    .               v         +-----------+
 * |     |      |    .    +--------------+                    +------------+
 * |     +-----------.--->|EventPluginHub|                    |    Event   |
 * |            |    .    |              |     +-----------+  | Propagators|
 * | ReactEvent |    .    |              |     |TapEvent   |  |------------|
 * |  Emitter   |    .    |              |<---+|Plugin     |  |other plugin|
 * |            |    .    |              |     +-----------+  |  utilities |
 * |     +-----------.--->|              |                    +------------+
 * |     |      |    .    +--------------+
 * +-----|------+    .                ^        +-----------+
 *       |           .                |        |Enter/Leave|
 *       +           .                +-------+|Plugin     |
 * +-------------+   .                         +-----------+
 * | application |   .
 * |-------------|   .
 * |             |   .
 * |             |   .
 * +-------------+   .
 *                   .
 *    React Core     .  General Purpose Event Plugin System
 */

var alreadyListeningTo = {};
var reactTopListenersCounter = 0;

/**
 * To ensure no conflicts with other potential React instances on the page
 */
var topListenersIDKey = '_reactListenersID' + ('' + Math.random()).slice(2);

function getListeningForDocument(mountAt) {
  // In IE8, `mountAt` is a host object and doesn't have `hasOwnProperty`
  // directly.
  if (!Object.prototype.hasOwnProperty.call(mountAt, topListenersIDKey)) {
    mountAt[topListenersIDKey] = reactTopListenersCounter++;
    alreadyListeningTo[mountAt[topListenersIDKey]] = {};
  }
  return alreadyListeningTo[mountAt[topListenersIDKey]];
}

var ReactBrowserEventEmitter = Object.assign({}, ReactEventEmitterMixin, {
  /**
   * Sets whether or not any created callbacks should be enabled.
   *
   * @param {boolean} enabled True if callbacks should be enabled.
   */
  setEnabled: function(enabled) {
    if (ReactDOMEventListener) {
      ReactDOMEventListener.setEnabled(enabled);
    }
  },

  /**
   * @return {boolean} True if callbacks are enabled.
   */
  isEnabled: function() {
    return !!(ReactDOMEventListener && ReactDOMEventListener.isEnabled());
  },

  /**
   * We listen for bubbled touch events on the document object.
   *
   * Firefox v8.01 (and possibly others) exhibited strange behavior when
   * mounting `onmousemove` events at some node that was not the document
   * element. The symptoms were that if your mouse is not moving over something
   * contained within that mount point (for example on the background) the
   * top-level listeners for `onmousemove` won't be called. However, if you
   * register the `mousemove` on the document object, then it will of course
   * catch all `mousemove`s. This along with iOS quirks, justifies restricting
   * top-level listeners to the document object only, at least for these
   * movement types of events and possibly all events.
   *
   * @see http://www.quirksmode.org/blog/archives/2010/09/click_event_del.html
   *
   * Also, `keyup`/`keypress`/`keydown` do not bubble to the window on IE, but
   * they bubble to document.
   *
   * @param {string} registrationName Name of listener (e.g. `onClick`).
   * @param {object} contentDocumentHandle Document which owns the container
   */
  listenTo: function(registrationName, contentDocumentHandle) {
    var mountAt = contentDocumentHandle;
    var isListening = getListeningForDocument(mountAt);
    var dependencies =
      EventPluginRegistry.registrationNameDependencies[registrationName];

    for (var i = 0; i < dependencies.length; i++) {
      var dependency = dependencies[i];
      if (
        !(isListening.hasOwnProperty(dependency) && isListening[dependency])
      ) {
        if (dependency === 'topWheel') {
          if (isEventSupported('wheel')) {
            ReactDOMEventListener.trapBubbledEvent(
              'topWheel',
              'wheel',
              mountAt,
            );
          } else if (isEventSupported('mousewheel')) {
            ReactDOMEventListener.trapBubbledEvent(
              'topWheel',
              'mousewheel',
              mountAt,
            );
          } else {
            // Firefox needs to capture a different mouse scroll event.
            // @see http://www.quirksmode.org/dom/events/tests/scroll.html
            ReactDOMEventListener.trapBubbledEvent(
              'topWheel',
              'DOMMouseScroll',
              mountAt,
            );
          }
        } else if (dependency === 'topScroll') {
          ReactDOMEventListener.trapCapturedEvent(
            'topScroll',
            'scroll',
            mountAt,
          );
        } else if (dependency === 'topFocus' || dependency === 'topBlur') {
          ReactDOMEventListener.trapCapturedEvent('topFocus', 'focus', mountAt);
          ReactDOMEventListener.trapCapturedEvent('topBlur', 'blur', mountAt);

          // to make sure blur and focus event listeners are only attached once
          isListening.topBlur = true;
          isListening.topFocus = true;
        } else if (dependency === 'topCancel') {
          if (isEventSupported('cancel', true)) {
            ReactDOMEventListener.trapCapturedEvent(
              'topCancel',
              'cancel',
              mountAt,
            );
          }
          isListening.topCancel = true;
        } else if (dependency === 'topClose') {
          if (isEventSupported('close', true)) {
            ReactDOMEventListener.trapCapturedEvent(
              'topClose',
              'close',
              mountAt,
            );
          }
          isListening.topClose = true;
        } else if (topLevelTypes.hasOwnProperty(dependency)) {
          ReactDOMEventListener.trapBubbledEvent(
            dependency,
            topLevelTypes[dependency],
            mountAt,
          );
        }

        isListening[dependency] = true;
      }
    }
  },

  isListeningToAllDependencies: function(registrationName, mountAt) {
    var isListening = getListeningForDocument(mountAt);
    var dependencies =
      EventPluginRegistry.registrationNameDependencies[registrationName];
    for (var i = 0; i < dependencies.length; i++) {
      var dependency = dependencies[i];
      if (
        !(isListening.hasOwnProperty(dependency) && isListening[dependency])
      ) {
        return false;
      }
    }
    return true;
  },

  trapBubbledEvent: function(topLevelType, handlerBaseName, handle) {
    return ReactDOMEventListener.trapBubbledEvent(
      topLevelType,
      handlerBaseName,
      handle,
    );
  },

  trapCapturedEvent: function(topLevelType, handlerBaseName, handle) {
    return ReactDOMEventListener.trapCapturedEvent(
      topLevelType,
      handlerBaseName,
      handle,
    );
  },
});

module.exports = ReactBrowserEventEmitter;
