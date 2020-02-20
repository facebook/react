/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import type {AnyNativeEvent} from 'legacy-events/PluginModuleType';
import type {DOMTopLevelEventType} from 'legacy-events/TopLevelEventTypes';
import type {EventSystemFlags} from 'legacy-events/EventSystemFlags';
import type {Fiber} from 'react-reconciler/src/ReactFiber';
import type {PluginModule} from 'legacy-events/PluginModuleType';
import type {ReactSyntheticEvent} from 'legacy-events/ReactSyntheticEventType';
import type {TopLevelType} from 'legacy-events/TopLevelEventTypes';

import {HostRoot, HostComponent, HostText} from 'shared/ReactWorkTags';
import {IS_FIRST_ANCESTOR} from 'legacy-events/EventSystemFlags';
import {batchedEventUpdates} from 'legacy-events/ReactGenericBatching';
import {runEventsInBatch} from 'legacy-events/EventBatching';
import {plugins} from 'legacy-events/EventPluginRegistry';
import accumulateInto from 'legacy-events/accumulateInto';
import {registrationNameDependencies} from 'legacy-events/EventPluginRegistry';

import getEventTarget from './getEventTarget';
import {getClosestInstanceFromNode} from '../client/ReactDOMComponentTree';
import {trapCapturedEvent, trapBubbledEvent} from './ReactDOMEventListener';
import {getListenerMapForElement} from './DOMEventListenerMap';
import isEventSupported from './isEventSupported';
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

/**
 * Summary of `DOMEventPluginSystem` event handling:
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
 *    trap it) to `EventPluginRegistry`, which in turn will ask plugins if they want
 *    to extract any synthetic events.
 *
 *  - The `EventPluginRegistry` will then process each event by annotating them with
 *    "dispatches", a sequence of listeners and IDs that care about that event.
 *
 *  - The `EventPluginRegistry` then dispatches the events.
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
 * |     +-----------.--->|PluginRegistry|                    |    Event   |
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

const CALLBACK_BOOKKEEPING_POOL_SIZE = 10;
const callbackBookkeepingPool = [];

type BookKeepingInstance = {|
  topLevelType: DOMTopLevelEventType | null,
  eventSystemFlags: EventSystemFlags,
  nativeEvent: AnyNativeEvent | null,
  targetInst: Fiber | null,
  ancestors: Array<Fiber | null>,
|};

function releaseTopLevelCallbackBookKeeping(
  instance: BookKeepingInstance,
): void {
  instance.topLevelType = null;
  instance.nativeEvent = null;
  instance.targetInst = null;
  instance.ancestors.length = 0;
  if (callbackBookkeepingPool.length < CALLBACK_BOOKKEEPING_POOL_SIZE) {
    callbackBookkeepingPool.push(instance);
  }
}

// Used to store ancestor hierarchy in top level callback
function getTopLevelCallbackBookKeeping(
  topLevelType: DOMTopLevelEventType,
  nativeEvent: AnyNativeEvent,
  targetInst: Fiber | null,
  eventSystemFlags: EventSystemFlags,
): BookKeepingInstance {
  if (callbackBookkeepingPool.length) {
    const instance = callbackBookkeepingPool.pop();
    instance.topLevelType = topLevelType;
    instance.eventSystemFlags = eventSystemFlags;
    instance.nativeEvent = nativeEvent;
    instance.targetInst = targetInst;
    return instance;
  }
  return {
    topLevelType,
    eventSystemFlags,
    nativeEvent,
    targetInst,
    ancestors: [],
  };
}

/**
 * Find the deepest React component completely containing the root of the
 * passed-in instance (for use when entire React trees are nested within each
 * other). If React trees are not nested, returns null.
 */
function findRootContainerNode(inst) {
  if (inst.tag === HostRoot) {
    return inst.stateNode.containerInfo;
  }
  // TODO: It may be a good idea to cache this to prevent unnecessary DOM
  // traversal, but caching is difficult to do correctly without using a
  // mutation observer to listen for all DOM changes.
  while (inst.return) {
    inst = inst.return;
  }
  if (inst.tag !== HostRoot) {
    // This can happen if we're in a detached tree.
    return null;
  }
  return inst.stateNode.containerInfo;
}

/**
 * Allows registered plugins an opportunity to extract events from top-level
 * native browser events.
 *
 * @return {*} An accumulation of synthetic events.
 * @internal
 */
function extractPluginEvents(
  topLevelType: TopLevelType,
  targetInst: null | Fiber,
  nativeEvent: AnyNativeEvent,
  nativeEventTarget: null | EventTarget,
  eventSystemFlags: EventSystemFlags,
): Array<ReactSyntheticEvent> | ReactSyntheticEvent | null {
  let events = null;
  for (let i = 0; i < plugins.length; i++) {
    // Not every plugin in the ordering may be loaded at runtime.
    const possiblePlugin: PluginModule<AnyNativeEvent> = plugins[i];
    if (possiblePlugin) {
      const extractedEvents = possiblePlugin.extractEvents(
        topLevelType,
        targetInst,
        nativeEvent,
        nativeEventTarget,
        eventSystemFlags,
      );
      if (extractedEvents) {
        events = accumulateInto(events, extractedEvents);
      }
    }
  }
  return events;
}

function runExtractedPluginEventsInBatch(
  topLevelType: TopLevelType,
  targetInst: null | Fiber,
  nativeEvent: AnyNativeEvent,
  nativeEventTarget: null | EventTarget,
  eventSystemFlags: EventSystemFlags,
) {
  const events = extractPluginEvents(
    topLevelType,
    targetInst,
    nativeEvent,
    nativeEventTarget,
    eventSystemFlags,
  );
  runEventsInBatch(events);
}

function handleTopLevel(bookKeeping: BookKeepingInstance) {
  let targetInst = bookKeeping.targetInst;

  // Loop through the hierarchy, in case there's any nested components.
  // It's important that we build the array of ancestors before calling any
  // event handlers, because event handlers can modify the DOM, leading to
  // inconsistencies with ReactMount's node cache. See #1105.
  let ancestor = targetInst;
  do {
    if (!ancestor) {
      const ancestors = bookKeeping.ancestors;
      ((ancestors: any): Array<Fiber | null>).push(ancestor);
      break;
    }
    const root = findRootContainerNode(ancestor);
    if (!root) {
      break;
    }
    const tag = ancestor.tag;
    if (tag === HostComponent || tag === HostText) {
      bookKeeping.ancestors.push(ancestor);
    }
    ancestor = getClosestInstanceFromNode(root);
  } while (ancestor);

  for (let i = 0; i < bookKeeping.ancestors.length; i++) {
    targetInst = bookKeeping.ancestors[i];
    const eventTarget = getEventTarget(bookKeeping.nativeEvent);
    const topLevelType = ((bookKeeping.topLevelType: any): DOMTopLevelEventType);
    const nativeEvent = ((bookKeeping.nativeEvent: any): AnyNativeEvent);
    let eventSystemFlags = bookKeeping.eventSystemFlags;

    // If this is the first ancestor, we mark it on the system flags
    if (i === 0) {
      eventSystemFlags |= IS_FIRST_ANCESTOR;
    }

    runExtractedPluginEventsInBatch(
      topLevelType,
      targetInst,
      nativeEvent,
      eventTarget,
      eventSystemFlags,
    );
  }
}

export function dispatchEventForLegacyPluginEventSystem(
  topLevelType: DOMTopLevelEventType,
  eventSystemFlags: EventSystemFlags,
  nativeEvent: AnyNativeEvent,
  targetInst: null | Fiber,
): void {
  const bookKeeping = getTopLevelCallbackBookKeeping(
    topLevelType,
    nativeEvent,
    targetInst,
    eventSystemFlags,
  );

  try {
    // Event queue being processed in the same cycle allows
    // `preventDefault`.
    batchedEventUpdates(handleTopLevel, bookKeeping);
  } finally {
    releaseTopLevelCallbackBookKeeping(bookKeeping);
  }
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
export function legacyListenToEvent(
  registrationName: string,
  mountAt: Document | Element | Node,
): void {
  const listenerMap = getListenerMapForElement(mountAt);
  const dependencies = registrationNameDependencies[registrationName];

  for (let i = 0; i < dependencies.length; i++) {
    const dependency = dependencies[i];
    legacyListenToTopLevelEvent(dependency, mountAt, listenerMap);
  }
}

export function legacyListenToTopLevelEvent(
  topLevelType: DOMTopLevelEventType,
  mountAt: Document | Element | Node,
  listenerMap: Map<DOMTopLevelEventType | string, null | (any => void)>,
): void {
  if (!listenerMap.has(topLevelType)) {
    switch (topLevelType) {
      case TOP_SCROLL:
        trapCapturedEvent(TOP_SCROLL, mountAt);
        break;
      case TOP_FOCUS:
      case TOP_BLUR:
        trapCapturedEvent(TOP_FOCUS, mountAt);
        trapCapturedEvent(TOP_BLUR, mountAt);
        // We set the flag for a single dependency later in this function,
        // but this ensures we mark both as attached rather than just one.
        listenerMap.set(TOP_BLUR, null);
        listenerMap.set(TOP_FOCUS, null);
        break;
      case TOP_CANCEL:
      case TOP_CLOSE:
        if (isEventSupported(getRawEventName(topLevelType))) {
          trapCapturedEvent(topLevelType, mountAt);
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
        const isMediaEvent = mediaEventTypes.indexOf(topLevelType) !== -1;
        if (!isMediaEvent) {
          trapBubbledEvent(topLevelType, mountAt);
        }
        break;
    }
    listenerMap.set(topLevelType, null);
  }
}

export function isListeningToAllDependencies(
  registrationName: string,
  mountAt: Document | Element,
): boolean {
  const listenerMap = getListenerMapForElement(mountAt);
  const dependencies = registrationNameDependencies[registrationName];

  for (let i = 0; i < dependencies.length; i++) {
    const dependency = dependencies[i];
    if (!listenerMap.has(dependency)) {
      return false;
    }
  }
  return true;
}
