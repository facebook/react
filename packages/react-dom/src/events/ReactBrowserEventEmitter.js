/**
 * Copyright (c) 2013-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import {registrationNameDependencies} from 'events/EventPluginRegistry';
import {
  TOP_BLUR,
  TOP_CANCEL,
  TOP_CLOSE,
  TOP_FOCUS,
  TOP_INVALID,
  TOP_RESET,
  TOP_SCROLL,
  TOP_SUBMIT,
  TOP_WHEEL,
  TOP_TOUCH_START,
  TOP_TOUCH_END,
  TOP_TOUCH_MOVE,
  TOP_TOUCH_CANCEL,
  getRawEventName,
  mediaEventTypes,
} from './DOMTopLevelEventTypes';
import {
  setEnabled,
  isEnabled,
  trapBubbledEvent,
  trapCapturedEvent,
} from './ReactDOMEventListener';
import isEventSupported from './isEventSupported';

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

const alreadyListeningTo = {};
let reactTopListenersCounter = 0;

/**
 * To ensure no conflicts with other potential React instances on the page
 */
const topListenersIDKey = '_reactListenersID' + ('' + Math.random()).slice(2);

function getListenerTrackingFor(node: any) {
  // In IE8, `node` is a host object and doesn't have `hasOwnProperty`
  // directly.
  if (!Object.prototype.hasOwnProperty.call(node, topListenersIDKey)) {
    node[topListenersIDKey] = reactTopListenersCounter++;
    alreadyListeningTo[node[topListenersIDKey]] = {};
  }
  return alreadyListeningTo[node[topListenersIDKey]];
}

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
 * @param {object} mountAt Container where to mount the listener
 */
export function listenTo(
  registrationName: string,
  mountAt: Document | Element,
  element: Element,
) {
  const mountAtListeners = getListenerTrackingFor(mountAt);
  const dependencies = registrationNameDependencies[registrationName];
  let elementListeners;

  for (let i = 0; i < dependencies.length; i++) {
    const dependency = dependencies[i];

    switch (dependency) {
      case TOP_SCROLL:
      case TOP_WHEEL:
        elementListeners = getListenerTrackingFor(element);
        if (!elementListeners.hasOwnProperty(dependency)) {
          trapCapturedEvent(dependency, element);
          elementListeners[dependency] = true;
        }
        break;
      case TOP_TOUCH_START:
      case TOP_TOUCH_END:
      case TOP_TOUCH_MOVE:
      case TOP_TOUCH_CANCEL:
        elementListeners = getListenerTrackingFor(element);
        if (!elementListeners.hasOwnProperty(dependency)) {
          trapBubbledEvent(dependency, element);
          elementListeners[dependency] = true;
        }
        break;
      case TOP_FOCUS:
      case TOP_BLUR:
        if (!mountAtListeners.hasOwnProperty(dependency)) {
          trapCapturedEvent(TOP_FOCUS, mountAt);
          trapCapturedEvent(TOP_BLUR, mountAt);
          // We set the flag for a single dependency later in this function,
          // but this ensures we mark both as attached rather than just one.
          mountAtListeners[TOP_BLUR] = true;
          mountAtListeners[TOP_FOCUS] = true;
        }
        break;
      case TOP_CANCEL:
      case TOP_CLOSE:
        if (!mountAtListeners.hasOwnProperty(dependency)) {
          if (isEventSupported(getRawEventName(dependency))) {
            trapCapturedEvent(dependency, mountAt);
          }
        }
        break;
      case TOP_INVALID:
      case TOP_SUBMIT:
      case TOP_RESET:
        // We listen to them on the target DOM elements.
        // Some of them bubble so we don't want them to fire twice.
        break;
      default:
        if (!mountAtListeners.hasOwnProperty(dependency)) {
          // By default, listen on the top level to all non-media events.
          // Media events don't bubble so adding the listener wouldn't do anything.
          const isMediaEvent = mediaEventTypes.indexOf(dependency) !== -1;
          if (!isMediaEvent) {
            trapBubbledEvent(dependency, mountAt);
          }
        }
    }

    mountAtListeners[dependency] = true;
  }
}

export function isListeningToAllDependencies(
  registrationName: string,
  mountAt: Document | Element,
) {
  const isListeningListeners = getListenerTrackingFor(mountAt);
  const dependencies = registrationNameDependencies[registrationName];
  for (let i = 0; i < dependencies.length; i++) {
    const dependency = dependencies[i];
    if (!isListeningListeners.hasOwnProperty(dependency)) {
      return false;
    }
  }
  return true;
}

export {setEnabled, isEnabled, trapBubbledEvent, trapCapturedEvent};
