/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import {registrationNameDependencies} from 'events/EventPluginRegistry';
import type {DOMTopLevelEventType} from 'events/TopLevelEventTypes';
import {
  TOP_BLUR,
  TOP_CANCEL,
  TOP_CLOSE,
  TOP_FOCUS,
  TOP_INVALID,
  TOP_RESET,
  TOP_SCROLL,
  TOP_SUBMIT,
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

const PossiblyWeakMap = typeof WeakMap === 'function' ? WeakMap : Map;
const elementListeningObjects:
  | WeakMap
  | Map<
      Document | Element | Node,
      ElementListeningObject,
    > = new PossiblyWeakMap();

// This object will contain both legacy and non legacy events.
// In the case of legacy events, we register an event listener
// without passing an object with { passive, capture } etc to
// third argument of the addEventListener call (we use a boolean).
// For non legacy events, we register an event listener with
// an object (third argument) with the passive property. We also
// double listen for the event on the element, as we need to check
// both paths (where passive is both true and false) so we can
// handle logic in either case.
export type ElementListeningObject = {
  legacy: Set<DOMTopLevelEventType>,
  nonLegacy: Set<DOMTopLevelEventType>,
};

function createElementListeningObject(): ElementListeningObject {
  return {
    legacy: new Set(),
    nonLegacy: new Set(),
  };
}

function getListeningSetForElement(
  element: Document | Element | Node,
  isLegacy: boolean,
): Set<DOMTopLevelEventType> {
  let listeningObject = elementListeningObjects.get(element);
  if (listeningObject === undefined) {
    listeningObject = createElementListeningObject();
    elementListeningObjects.set(element, listeningObject);
  }
  return isLegacy ? listeningObject.legacy : listeningObject.nonLegacy;
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
  mountAt: Document | Element | Node,
  isLegacy: boolean,
): void {
  const listeningSet = getListeningSetForElement(mountAt, isLegacy);
  const dependencies = registrationNameDependencies[registrationName];

  for (let i = 0; i < dependencies.length; i++) {
    const dependency = dependencies[i];
    listenToDependency(dependency, listeningSet, mountAt, isLegacy);
  }
}

function listenToDependency(
  dependency: DOMTopLevelEventType,
  listeningSet: Set<DOMTopLevelEventType>,
  mountAt: Document | Element | Node,
  isLegacy: boolean,
): void {
  if (!listeningSet.has(dependency)) {
    switch (dependency) {
      case TOP_SCROLL:
        trapCapturedEvent(TOP_SCROLL, mountAt, isLegacy);
        break;
      case TOP_FOCUS:
      case TOP_BLUR:
        trapCapturedEvent(TOP_FOCUS, mountAt, isLegacy);
        trapCapturedEvent(TOP_BLUR, mountAt, isLegacy);
        // We set the flag for a single dependency later in this function,
        // but this ensures we mark both as attached rather than just one.
        listeningSet.add(TOP_BLUR);
        listeningSet.add(TOP_FOCUS);
        break;
      case TOP_CANCEL:
      case TOP_CLOSE:
        if (isEventSupported(getRawEventName(dependency))) {
          trapCapturedEvent(dependency, mountAt, isLegacy);
        }
        break;
      case TOP_INVALID:
      case TOP_SUBMIT:
      case TOP_RESET:
        // We listen to them on the target DOM elements.
        // Some of them bubble so we don't want them to fire twice.
        break;
      default:
        // By default, listen on the top level to all non-media events.
        // Media events don't bubble so adding the listener wouldn't do anything.
        const isMediaEvent = mediaEventTypes.indexOf(dependency) !== -1;
        if (!isMediaEvent) {
          trapBubbledEvent(dependency, mountAt, isLegacy);
        }
        break;
    }
    listeningSet.add(dependency);
  }
}

export function isListeningToAllDependencies(
  registrationName: string,
  mountAt: Document | Element,
  isLegacy: boolean,
): boolean {
  const listeningSet = getListeningSetForElement(mountAt, isLegacy);
  const dependencies = registrationNameDependencies[registrationName];

  for (let i = 0; i < dependencies.length; i++) {
    const dependency = dependencies[i];
    if (!listeningSet.has(dependency)) {
      return false;
    }
  }
  return true;
}

export {setEnabled, isEnabled, trapBubbledEvent, trapCapturedEvent};
