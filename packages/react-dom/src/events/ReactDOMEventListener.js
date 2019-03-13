/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import type {AnyNativeEvent} from 'events/PluginModuleType';
import type {Fiber} from 'react-reconciler/src/ReactFiber';
import type {DOMTopLevelEventType} from 'events/TopLevelEventTypes';

import {batchedUpdates, interactiveUpdates} from 'events/ReactGenericBatching';
import {runExtractedEventsInBatch} from 'events/EventPluginHub';
import {isFiberMounted} from 'react-reconciler/reflection';
import {HostRoot} from 'shared/ReactWorkTags';
import {
  type ListenerType,
  PASSIVE_DISABLED,
  PASSIVE_FALLBACK,
  PASSIVE_TRUE,
  PASSIVE_FALSE,
} from 'events/ListenerTypes';

import {addEventBubbleListener, addEventCaptureListener} from './EventListener';
import getEventTarget from './getEventTarget';
import {getClosestInstanceFromNode} from '../client/ReactDOMComponentTree';
import SimpleEventPlugin from './SimpleEventPlugin';
import {getRawEventName} from './DOMTopLevelEventTypes';
import {passiveBrowserEventsSupported} from './checkPassiveEvents';

const {isInteractiveTopLevelEventType} = SimpleEventPlugin;

const CALLBACK_BOOKKEEPING_POOL_SIZE = 10;
const callbackBookkeepingPool = [];

type BookKeepingInstance = {
  topLevelType: DOMTopLevelEventType | null,
  nativeEvent: AnyNativeEvent | null,
  targetInst: Fiber | null,
  ancestors: Array<Fiber | null>,
  listenerType: null | ListenerType,
};

/**
 * Find the deepest React component completely containing the root of the
 * passed-in instance (for use when entire React trees are nested within each
 * other). If React trees are not nested, returns null.
 */
function findRootContainerNode(inst) {
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

// Used to store ancestor hierarchy in top level callback
function getTopLevelCallbackBookKeeping(
  topLevelType: DOMTopLevelEventType,
  nativeEvent: AnyNativeEvent,
  targetInst: Fiber | null,
  listenerType: ListenerType,
): BookKeepingInstance {
  if (callbackBookkeepingPool.length) {
    const instance = callbackBookkeepingPool.pop();
    instance.topLevelType = topLevelType;
    instance.nativeEvent = nativeEvent;
    instance.targetInst = targetInst;
    instance.listenerType = listenerType;
    return instance;
  }
  return {
    topLevelType,
    nativeEvent,
    targetInst,
    ancestors: [],
    listenerType,
  };
}

function releaseTopLevelCallbackBookKeeping(
  instance: BookKeepingInstance,
): void {
  instance.topLevelType = null;
  instance.nativeEvent = null;
  instance.targetInst = null;
  instance.ancestors.length = 0;
  instance.listenerType = null;
  if (callbackBookkeepingPool.length < CALLBACK_BOOKKEEPING_POOL_SIZE) {
    callbackBookkeepingPool.push(instance);
  }
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
    bookKeeping.ancestors.push(ancestor);
    ancestor = getClosestInstanceFromNode(root);
  } while (ancestor);

  for (let i = 0; i < bookKeeping.ancestors.length; i++) {
    targetInst = bookKeeping.ancestors[i];
    runExtractedEventsInBatch(
      ((bookKeeping.topLevelType: any): DOMTopLevelEventType),
      targetInst,
      ((bookKeeping.nativeEvent: any): AnyNativeEvent),
      getEventTarget(bookKeeping.nativeEvent),
      ((bookKeeping.listenerType: any): ListenerType),
    );
  }
}

// TODO: can we stop exporting these?
export let _enabled = true;

export function setEnabled(enabled: ?boolean) {
  _enabled = !!enabled;
}

export function isEnabled() {
  return _enabled;
}

export function trapBubbledEvent(
  topLevelType: DOMTopLevelEventType,
  element: Document | Element | Node,
  isLegacy: boolean,
): void {
  const dispatch = isInteractiveTopLevelEventType(topLevelType)
    ? dispatchInteractiveEvent
    : dispatchEvent;
  const rawEventName = getRawEventName(topLevelType);

  trapEvent(
    addEventBubbleListener,
    element,
    topLevelType,
    dispatch,
    rawEventName,
    isLegacy,
  );
}

export function trapCapturedEvent(
  topLevelType: DOMTopLevelEventType,
  element: Document | Element | Node,
  isLegacy: boolean,
): void {
  const dispatch = isInteractiveTopLevelEventType(topLevelType)
    ? dispatchInteractiveEvent
    : dispatchEvent;
  const rawEventName = getRawEventName(topLevelType);

  trapEvent(
    addEventCaptureListener,
    element,
    topLevelType,
    dispatch,
    rawEventName,
    isLegacy,
  );
}

type Dispatcher = (
  topLevelType: DOMTopLevelEventType,
  listenerType: ListenerType,
  nativeEvent: AnyNativeEvent,
) => void;

// A helper function to remove bytes
function bindDispatch(
  dispatch: Dispatcher,
  topLevelType: DOMTopLevelEventType,
  listenerType: ListenerType,
) {
  return dispatch.bind(null, topLevelType, listenerType);
}

function trapEvent(
  eventListener: (
    element: Document | Element | Node,
    eventName: string,
    listener: (event: AnyNativeEvent) => void,
    listenerType: ListenerType,
  ) => void,
  element: Document | Element | Node,
  topLevelType: DOMTopLevelEventType,
  dispatch: Dispatcher,
  rawEventName: string,
  isLegacy: boolean,
) {
  if (isLegacy) {
    // Check if interactive and wrap in interactiveUpdates
    const listener = bindDispatch(dispatch, topLevelType, PASSIVE_DISABLED);
    // We don't listen for passive/non-passive
    eventListener(element, rawEventName, listener, PASSIVE_DISABLED);
  } else {
    if (passiveBrowserEventsSupported) {
      // Check if interactive and wrap in interactiveUpdates
      const activeListener = bindDispatch(
        dispatch,
        topLevelType,
        PASSIVE_FALSE,
      );
      const passiveListener = bindDispatch(
        dispatch,
        topLevelType,
        PASSIVE_TRUE,
      );
      // We listen to the same event for both passive/non-passive
      eventListener(element, rawEventName, passiveListener, PASSIVE_FALSE);
      eventListener(element, rawEventName, activeListener, PASSIVE_TRUE);
    } else {
      const fallbackListener = bindDispatch(
        dispatch,
        topLevelType,
        PASSIVE_FALLBACK,
      );
      eventListener(element, rawEventName, fallbackListener, PASSIVE_FALLBACK);
    }
  }
}

function dispatchInteractiveEvent(topLevelType, listenerType, nativeEvent) {
  interactiveUpdates(dispatchEvent, topLevelType, listenerType, nativeEvent);
}

export function dispatchEvent(
  topLevelType: DOMTopLevelEventType,
  listenerType: ListenerType,
  nativeEvent: AnyNativeEvent,
): void {
  if (!_enabled) {
    return;
  }

  const nativeEventTarget = getEventTarget(nativeEvent);
  let targetInst = getClosestInstanceFromNode(nativeEventTarget);
  if (
    targetInst !== null &&
    typeof targetInst.tag === 'number' &&
    !isFiberMounted(targetInst)
  ) {
    // If we get an event (ex: img onload) before committing that
    // component's mount, ignore it for now (that is, treat it as if it was an
    // event on a non-React tree). We might also consider queueing events and
    // dispatching them after the mount.
    targetInst = null;
  }

  const bookKeeping = getTopLevelCallbackBookKeeping(
    topLevelType,
    nativeEvent,
    targetInst,
    listenerType,
  );

  try {
    // Event queue being processed in the same cycle allows
    // `preventDefault`.
    batchedUpdates(handleTopLevel, bookKeeping);
  } finally {
    releaseTopLevelCallbackBookKeeping(bookKeeping);
  }
}
