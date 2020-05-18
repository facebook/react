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
import type {ElementListenerMap} from '../client/ReactDOMComponentTree';
import type {EventSystemFlags} from './EventSystemFlags';
import type {Fiber} from 'react-reconciler/src/ReactInternalTypes';
import type {LegacyPluginModule} from 'legacy-events/PluginModuleType';
import type {ReactSyntheticEvent} from 'legacy-events/ReactSyntheticEventType';
import type {TopLevelType} from 'legacy-events/TopLevelEventTypes';
import forEachAccumulated from 'legacy-events/forEachAccumulated';

import {
  HostRoot,
  HostComponent,
  HostText,
} from 'react-reconciler/src/ReactWorkTags';
import {IS_FIRST_ANCESTOR, PLUGIN_EVENT_SYSTEM} from './EventSystemFlags';
import {runEventsInBatch} from 'legacy-events/EventBatching';
import {plugins} from 'legacy-events/EventPluginRegistry';
import accumulateInto from 'legacy-events/accumulateInto';
import {registrationNameDependencies} from 'legacy-events/EventPluginRegistry';

import getEventTarget from './getEventTarget';
import {
  getClosestInstanceFromNode,
  getEventListenerMap,
} from '../client/ReactDOMComponentTree';
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
import {createEventListenerWrapperWithPriority} from './ReactDOMEventListener';
import {batchedEventUpdates} from './ReactDOMUpdateBatching';
import getListener from './getListener';
import {addEventCaptureListener, addEventBubbleListener} from './EventListener';

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
  const legacyPlugins = ((plugins: any): Array<LegacyPluginModule<Event>>);
  for (let i = 0; i < legacyPlugins.length; i++) {
    // Not every plugin in the ordering may be loaded at runtime.
    const possiblePlugin = legacyPlugins[i];
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
  mountAt: Document | Element,
): void {
  const listenerMap = getEventListenerMap(mountAt);
  const dependencies = registrationNameDependencies[registrationName];

  for (let i = 0; i < dependencies.length; i++) {
    const dependency = dependencies[i];
    legacyListenToTopLevelEvent(dependency, mountAt, listenerMap);
  }
}

export function legacyListenToTopLevelEvent(
  topLevelType: DOMTopLevelEventType,
  mountAt: Document | Element,
  listenerMap: ElementListenerMap,
): void {
  if (!listenerMap.has(topLevelType)) {
    switch (topLevelType) {
      case TOP_SCROLL: {
        legacyTrapCapturedEvent(TOP_SCROLL, mountAt, listenerMap);
        break;
      }
      case TOP_FOCUS:
      case TOP_BLUR:
        legacyTrapCapturedEvent(TOP_FOCUS, mountAt, listenerMap);
        legacyTrapCapturedEvent(TOP_BLUR, mountAt, listenerMap);
        break;
      case TOP_CANCEL:
      case TOP_CLOSE: {
        if (isEventSupported(getRawEventName(topLevelType))) {
          legacyTrapCapturedEvent(topLevelType, mountAt, listenerMap);
        }
        break;
      }
      case TOP_INVALID:
      case TOP_SUBMIT:
      case TOP_RESET:
        // We listen to them on the target DOM elements.
        // Some of them bubble so we don't want them to fire twice.
        break;
      default: {
        // By default, listen on the top level to all non-media events.
        // Media events don't bubble so adding the listener wouldn't do anything.
        const isMediaEvent = mediaEventTypes.indexOf(topLevelType) !== -1;
        if (!isMediaEvent) {
          legacyTrapBubbledEvent(topLevelType, mountAt, listenerMap);
        }
        break;
      }
    }
  }
}

export function legacyTrapBubbledEvent(
  topLevelType: DOMTopLevelEventType,
  element: Document | Element,
  listenerMap?: ElementListenerMap,
): void {
  const listener = addTrappedEventListener(
    element,
    topLevelType,
    PLUGIN_EVENT_SYSTEM,
    false,
  );
  if (listenerMap) {
    listenerMap.set(topLevelType, {passive: undefined, listener});
  }
}

export function legacyTrapCapturedEvent(
  topLevelType: DOMTopLevelEventType,
  element: Document | Element,
  listenerMap: ElementListenerMap,
): void {
  const listener = addTrappedEventListener(
    element,
    topLevelType,
    PLUGIN_EVENT_SYSTEM,
    true,
  );
  listenerMap.set(topLevelType, {passive: undefined, listener});
}

function addTrappedEventListener(
  targetContainer: EventTarget,
  topLevelType: DOMTopLevelEventType,
  eventSystemFlags: EventSystemFlags,
  capture: boolean,
): any => void {
  const rawEventName = getRawEventName(topLevelType);
  const listener = createEventListenerWrapperWithPriority(
    targetContainer,
    topLevelType,
    eventSystemFlags,
  );
  const unsubscribeListener = capture
    ? addEventCaptureListener(targetContainer, rawEventName, listener)
    : addEventBubbleListener(targetContainer, rawEventName, listener);
  return unsubscribeListener;
}

function getParent(inst: Object | null): Object | null {
  if (!inst) {
    return null;
  }
  do {
    inst = inst.return;
    // TODO: If this is a HostRoot we might want to bail out.
    // That is depending on if we want nested subtrees (layers) to bubble
    // events to their parent. We could also go through parentNode on the
    // host node but that wouldn't work for React Native and doesn't let us
    // do the portal feature.
  } while (inst && inst.tag !== HostComponent);
  if (inst) {
    return inst;
  }
  return null;
}

/**
 * Simulates the traversal of a two-phase, capture/bubble event dispatch.
 */
function traverseTwoPhase(
  inst: Object,
  fn: Function,
  arg: ReactSyntheticEvent,
) {
  const path = [];
  while (inst) {
    path.push(inst);
    inst = getParent(inst);
  }
  let i;
  for (i = path.length; i-- > 0; ) {
    fn(path[i], 'captured', arg);
  }
  for (i = 0; i < path.length; i++) {
    fn(path[i], 'bubbled', arg);
  }
}

function listenerAtPhase(inst, event, propagationPhase) {
  const registrationName =
    event.dispatchConfig.phasedRegistrationNames[propagationPhase];
  return getListener(inst, registrationName);
}

/**
 * Return the lowest common ancestor of A and B, or null if they are in
 * different trees.
 */
export function getLowestCommonAncestor(
  instA: Object,
  instB: Object,
): Object | null {
  let depthA = 0;
  for (let tempA = instA; tempA; tempA = getParent(tempA)) {
    depthA++;
  }
  let depthB = 0;
  for (let tempB = instB; tempB; tempB = getParent(tempB)) {
    depthB++;
  }

  // If A is deeper, crawl up.
  while (depthA - depthB > 0) {
    instA = getParent(instA);
    depthA--;
  }

  // If B is deeper, crawl up.
  while (depthB - depthA > 0) {
    instB = getParent(instB);
    depthB--;
  }

  // Walk in lockstep until we find a match.
  let depth = depthA;
  while (depth--) {
    if (instA === instB || instA === instB.alternate) {
      return instA;
    }
    instA = getParent(instA);
    instB = getParent(instB);
  }
  return null;
}

/**
 * Traverses the ID hierarchy and invokes the supplied `cb` on any IDs that
 * should would receive a `mouseEnter` or `mouseLeave` event.
 *
 * Does not invoke the callback on the nearest common ancestor because nothing
 * "entered" or "left" that element.
 */
export function traverseEnterLeave(
  from: Object,
  to: Object,
  fn: Function,
  argFrom: ReactSyntheticEvent,
  argTo: ReactSyntheticEvent,
) {
  const common = from && to ? getLowestCommonAncestor(from, to) : null;
  const pathFrom = [];
  while (true) {
    if (!from) {
      break;
    }
    if (from === common) {
      break;
    }
    const alternate = from.alternate;
    if (alternate !== null && alternate === common) {
      break;
    }
    pathFrom.push(from);
    from = getParent(from);
  }
  const pathTo = [];
  while (true) {
    if (!to) {
      break;
    }
    if (to === common) {
      break;
    }
    const alternate = to.alternate;
    if (alternate !== null && alternate === common) {
      break;
    }
    pathTo.push(to);
    to = getParent(to);
  }
  for (let i = 0; i < pathFrom.length; i++) {
    fn(pathFrom[i], 'bubbled', argFrom);
  }
  for (let i = pathTo.length; i-- > 0; ) {
    fn(pathTo[i], 'captured', argTo);
  }
}

function accumulateDirectionalDispatches(inst, phase, event) {
  if (__DEV__) {
    if (!inst) {
      console.error('Dispatching inst must not be null');
    }
  }
  const listener = listenerAtPhase(inst, event, phase);
  if (listener) {
    event._dispatchListeners = accumulateInto(
      event._dispatchListeners,
      listener,
    );
    event._dispatchInstances = accumulateInto(event._dispatchInstances, inst);
  }
}

function accumulateTwoPhaseDispatchesSingle(event) {
  if (event && event.dispatchConfig.phasedRegistrationNames) {
    traverseTwoPhase(event._targetInst, accumulateDirectionalDispatches, event);
  }
}

/**
 * Accumulates without regard to direction, does not look for phased
 * registration names. Same as `accumulateDirectDispatchesSingle` but without
 * requiring that the `dispatchMarker` be the same as the dispatched ID.
 */
function accumulateDispatches(
  inst: Object,
  ignoredDirection: ?boolean,
  event: Object,
): void {
  if (inst && event && event.dispatchConfig.registrationName) {
    const registrationName = event.dispatchConfig.registrationName;
    const listener = getListener(inst, registrationName);
    if (listener) {
      event._dispatchListeners = accumulateInto(
        event._dispatchListeners,
        listener,
      );
      event._dispatchInstances = accumulateInto(event._dispatchInstances, inst);
    }
  }
}

export function accumulateTwoPhaseDispatches(
  events: ReactSyntheticEvent | Array<ReactSyntheticEvent>,
): void {
  forEachAccumulated(events, accumulateTwoPhaseDispatchesSingle);
}

export function accumulateEnterLeaveDispatches(
  leave: ReactSyntheticEvent,
  enter: ReactSyntheticEvent,
  from: Fiber,
  to: Fiber,
) {
  traverseEnterLeave(from, to, accumulateDispatches, leave, enter);
}
