/**
 * Copyright (c) 2013-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import {registrationNameDependencies} from 'events/EventPluginRegistry';
import {
  setEnabled,
  isEnabled,
  trapBubbledEvent,
  trapCapturedEvent,
} from './ReactDOMEventListener';
import isEventSupported from './isEventSupported';
import BrowserEventConstants from './BrowserEventConstants';
import invariant from 'fbjs/lib/invariant';

export * from 'events/ReactEventEmitterMixin';

const {topLevelTypes} = BrowserEventConstants;

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

function getListenerTrackingFor(node) {
  // In IE8, `node` is a host object and doesn't have `hasOwnProperty`
  // directly.
  if (!Object.prototype.hasOwnProperty.call(node, topListenersIDKey)) {
    node[topListenersIDKey] = reactTopListenersCounter++;
    alreadyListeningTo[node[topListenersIDKey]] = {};
  }
  return alreadyListeningTo[node[topListenersIDKey]];
}

const BUBBLE = 0;
const CAPTURE = 1;

const localEvents = {
  topAbort: CAPTURE,
  topCanPlay: CAPTURE,
  topCanPlayThrough: CAPTURE,
  topDurationChange: CAPTURE,
  topEmptied: CAPTURE,
  topEncrypted: CAPTURE,
  topEnded: CAPTURE,
  topError: CAPTURE,
  topLoad: CAPTURE,
  topLoadStart: CAPTURE,
  topLoadedData: CAPTURE,
  topLoadedMetadata: CAPTURE,
  topPause: CAPTURE,
  topPlay: CAPTURE,
  topPlaying: CAPTURE,
  topProgress: CAPTURE,
  topRateChange: CAPTURE,
  topScroll: CAPTURE,
  topSeeked: CAPTURE,
  topSeeking: CAPTURE,
  topStalled: CAPTURE,
  topSuspend: CAPTURE,
  topTimeUpdate: CAPTURE,
  topTouchCancel: BUBBLE,
  topTouchEnd: BUBBLE,
  topTouchMove: BUBBLE,
  topTouchStart: BUBBLE,
  topVolumeChange: CAPTURE,
  topWaiting: CAPTURE,
  topWheel: CAPTURE,
  topReset: CAPTURE,
  topSubmit: CAPTURE,
  topToggle: CAPTURE,
  topInvalid: CAPTURE,
};

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
export function listenTo(registrationName, mountAt, domElement) {
  const isListening = getListenerTrackingFor(mountAt);
  const dependencies = registrationNameDependencies[registrationName];

  for (let i = 0; i < dependencies.length; i++) {
    const dependency = dependencies[i];

    if (localEvents.hasOwnProperty(dependency)) {
      const isLocallyListening = getListenerTrackingFor(domElement);

      if (!isLocallyListening.hasOwnProperty(dependency)) {
        if (localEvents[dependency] === CAPTURE) {
          trapCapturedEvent(dependency, topLevelTypes[dependency], domElement);
        } else {
          trapBubbledEvent(dependency, topLevelTypes[dependency], domElement);
        }

        isLocallyListening[dependency] = true;
      }
    } else if (!isListening.hasOwnProperty(dependency)) {
      if (dependency === 'topFocus' || dependency === 'topBlur') {
        trapCapturedEvent('topFocus', 'focus', mountAt);
        trapCapturedEvent('topBlur', 'blur', mountAt);

        // to make sure blur and focus event listeners are only attached once
        isListening.topBlur = true;
        isListening.topFocus = true;
      } else if (dependency === 'topCancel') {
        if (isEventSupported('cancel', true)) {
          trapCapturedEvent('topCancel', 'cancel', mountAt);
        }
        isListening.topCancel = true;
      } else if (dependency === 'topClose') {
        if (isEventSupported('close', true)) {
          trapCapturedEvent('topClose', 'close', mountAt);
        }
        isListening.topClose = true;
      } else if (topLevelTypes.hasOwnProperty(dependency)) {
        trapBubbledEvent(dependency, topLevelTypes[dependency], mountAt);
        isListening[dependency] = true;
      } else {
        invariant(false, 'Unexpected event dependency %s', dependency);
      }
    }
  }
}

export function isListeningToAllDependencies(registrationName, mountAt) {
  const isListening = getListenerTrackingFor(mountAt);
  const dependencies = registrationNameDependencies[registrationName];
  for (let i = 0; i < dependencies.length; i++) {
    const dependency = dependencies[i];
    if (!(isListening.hasOwnProperty(dependency) && isListening[dependency])) {
      return false;
    }
  }
  return true;
}

export {setEnabled, isEnabled, trapBubbledEvent, trapCapturedEvent};
