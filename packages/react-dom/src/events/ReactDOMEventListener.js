/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import type {AnyNativeEvent} from 'legacy-events/PluginModuleType';
import type {EventPriority} from 'shared/ReactTypes';
import type {FiberRoot} from 'react-reconciler/src/ReactFiberRoot';
import type {Container, SuspenseInstance} from '../client/ReactDOMHostConfig';
import type {DOMTopLevelEventType} from 'legacy-events/TopLevelEventTypes';

// Intentionally not named imports because Rollup would use dynamic dispatch for
// CommonJS interop named imports.
import * as Scheduler from 'scheduler';

import {
  discreteUpdates,
  flushDiscreteUpdatesIfNeeded,
} from 'legacy-events/ReactGenericBatching';
import {DEPRECATED_dispatchEventForResponderEventSystem} from './DeprecatedDOMEventResponderSystem';
import {
  isReplayableDiscreteEvent,
  queueDiscreteEvent,
  hasQueuedDiscreteEvents,
  clearIfContinuousEvent,
  queueIfContinuousEvent,
} from './ReactDOMEventReplaying';
import {
  getNearestMountedFiber,
  getContainerFromFiber,
  getSuspenseInstanceFromFiber,
} from 'react-reconciler/src/ReactFiberTreeReflection';
import {HostRoot, SuspenseComponent} from 'react-reconciler/src/ReactWorkTags';
import {
  type EventSystemFlags,
  LEGACY_FB_SUPPORT,
  PLUGIN_EVENT_SYSTEM,
  RESPONDER_EVENT_SYSTEM,
  IS_PASSIVE,
  PASSIVE_NOT_SUPPORTED,
} from './EventSystemFlags';

import {
  addEventBubbleListener,
  addEventCaptureListener,
  addEventCaptureListenerWithPassiveFlag,
  addEventBubbleListenerWithPassiveFlag,
  removeEventListener,
} from './EventListener';
import getEventTarget from './getEventTarget';
import {getClosestInstanceFromNode} from '../client/ReactDOMComponentTree';
import {getRawEventName} from './DOMTopLevelEventTypes';
import {passiveBrowserEventsSupported} from './checkPassiveEvents';

import {
  enableDeprecatedFlareAPI,
  enableModernEventSystem,
  enableLegacyFBSupport,
  enableUseEventAPI,
} from 'shared/ReactFeatureFlags';
import {
  UserBlockingEvent,
  ContinuousEvent,
  DiscreteEvent,
} from 'shared/ReactTypes';
import {getEventPriorityForPluginSystem} from './DOMEventProperties';
import {dispatchEventForLegacyPluginEventSystem} from './DOMLegacyEventPluginSystem';
import {dispatchEventForPluginEventSystem} from './DOMModernPluginEventSystem';

const {
  unstable_UserBlockingPriority: UserBlockingPriority,
  unstable_runWithPriority: runWithPriority,
} = Scheduler;

// TODO: can we stop exporting these?
export let _enabled = true;

export function setEnabled(enabled: ?boolean) {
  _enabled = !!enabled;
}

export function isEnabled() {
  return _enabled;
}

export function addResponderEventSystemEvent(
  document: Document,
  topLevelType: string,
  passive: boolean,
): any => void {
  let eventFlags = RESPONDER_EVENT_SYSTEM;

  // If passive option is not supported, then the event will be
  // active and not passive, but we flag it as using not being
  // supported too. This way the responder event plugins know,
  // and can provide polyfills if needed.
  if (passive) {
    if (passiveBrowserEventsSupported) {
      eventFlags |= IS_PASSIVE;
    } else {
      eventFlags |= PASSIVE_NOT_SUPPORTED;
      passive = false;
    }
  }
  // Check if interactive and wrap in discreteUpdates
  const listener = dispatchEvent.bind(
    null,
    ((topLevelType: any): DOMTopLevelEventType),
    eventFlags,
    document,
  );
  if (passiveBrowserEventsSupported) {
    return addEventCaptureListenerWithPassiveFlag(
      document,
      topLevelType,
      listener,
      passive,
    );
  } else {
    return addEventCaptureListener(document, topLevelType, listener);
  }
}

export function addTrappedEventListener(
  targetContainer: EventTarget,
  topLevelType: DOMTopLevelEventType,
  eventSystemFlags: EventSystemFlags,
  capture: boolean,
  isDeferredListenerForLegacyFBSupport?: boolean,
  passive?: boolean,
  priority?: EventPriority,
): any => void {
  const eventPriority =
    priority === undefined
      ? getEventPriorityForPluginSystem(topLevelType)
      : priority;
  let listener;
  let listenerWrapper;
  switch (eventPriority) {
    case DiscreteEvent:
      listenerWrapper = dispatchDiscreteEvent;
      break;
    case UserBlockingEvent:
      listenerWrapper = dispatchUserBlockingUpdate;
      break;
    case ContinuousEvent:
    default:
      listenerWrapper = dispatchEvent;
      break;
  }
  // If passive option is not supported, then the event will be
  // active and not passive.
  if (passive === true && !passiveBrowserEventsSupported) {
    passive = false;
  }

  listener = listenerWrapper.bind(
    null,
    topLevelType,
    eventSystemFlags,
    targetContainer,
  );

  targetContainer =
    enableLegacyFBSupport && isDeferredListenerForLegacyFBSupport
      ? (targetContainer: any).ownerDocument
      : targetContainer;

  const rawEventName = getRawEventName(topLevelType);

  let unsubscribeListener;
  // When legacyFBSupport is enabled, it's for when we
  // want to add a one time event listener to a container.
  // This should only be used with enableLegacyFBSupport
  // due to requirement to provide compatibility with
  // internal FB www event tooling. This works by removing
  // the event listener as soon as it is invoked. We could
  // also attempt to use the {once: true} param on
  // addEventListener, but that requires support and some
  // browsers do not support this today, and given this is
  // to support legacy code patterns, it's likely they'll
  // need support for such browsers.
  if (enableLegacyFBSupport && isDeferredListenerForLegacyFBSupport) {
    const originalListener = listener;
    listener = function(...p) {
      try {
        return originalListener.apply(this, p);
      } finally {
        removeEventListener(
          targetContainer,
          rawEventName,
          unsubscribeListener,
          capture,
        );
      }
    };
  }
  if (capture) {
    if (enableUseEventAPI && passive !== undefined) {
      // This is only used with passive is either true or false.
      unsubscribeListener = addEventCaptureListenerWithPassiveFlag(
        targetContainer,
        rawEventName,
        listener,
        passive,
      );
    } else {
      unsubscribeListener = addEventCaptureListener(
        targetContainer,
        rawEventName,
        listener,
      );
    }
  } else {
    if (enableUseEventAPI && passive !== undefined) {
      // This is only used with passive is either true or false.
      unsubscribeListener = addEventBubbleListenerWithPassiveFlag(
        targetContainer,
        rawEventName,
        listener,
        passive,
      );
    } else {
      unsubscribeListener = addEventBubbleListener(
        targetContainer,
        rawEventName,
        listener,
      );
    }
  }
  return unsubscribeListener;
}

export function removeTrappedEventListener(
  targetContainer: EventTarget,
  topLevelType: DOMTopLevelEventType,
  capture: boolean,
  listener: any => void,
): void {
  const rawEventName = getRawEventName(topLevelType);
  removeEventListener(targetContainer, rawEventName, listener, capture);
}

function dispatchDiscreteEvent(
  topLevelType,
  eventSystemFlags,
  container,
  nativeEvent,
) {
  if (
    !enableLegacyFBSupport ||
    // If we have Legacy FB support, it means we've already
    // flushed for this event and we don't need to do it again.
    (eventSystemFlags & LEGACY_FB_SUPPORT) === 0
  ) {
    flushDiscreteUpdatesIfNeeded(nativeEvent.timeStamp);
  }
  discreteUpdates(
    dispatchEvent,
    topLevelType,
    eventSystemFlags,
    container,
    nativeEvent,
  );
}

function dispatchUserBlockingUpdate(
  topLevelType,
  eventSystemFlags,
  container,
  nativeEvent,
) {
  runWithPriority(
    UserBlockingPriority,
    dispatchEvent.bind(
      null,
      topLevelType,
      eventSystemFlags,
      container,
      nativeEvent,
    ),
  );
}

export function dispatchEvent(
  topLevelType: DOMTopLevelEventType,
  eventSystemFlags: EventSystemFlags,
  targetContainer: EventTarget,
  nativeEvent: AnyNativeEvent,
): void {
  if (!_enabled) {
    return;
  }
  if (hasQueuedDiscreteEvents() && isReplayableDiscreteEvent(topLevelType)) {
    // If we already have a queue of discrete events, and this is another discrete
    // event, then we can't dispatch it regardless of its target, since they
    // need to dispatch in order.
    queueDiscreteEvent(
      null, // Flags that we're not actually blocked on anything as far as we know.
      topLevelType,
      eventSystemFlags,
      targetContainer,
      nativeEvent,
    );
    return;
  }

  const blockedOn = attemptToDispatchEvent(
    topLevelType,
    eventSystemFlags,
    targetContainer,
    nativeEvent,
  );

  if (blockedOn === null) {
    // We successfully dispatched this event.
    clearIfContinuousEvent(topLevelType, nativeEvent);
    return;
  }

  if (isReplayableDiscreteEvent(topLevelType)) {
    // This this to be replayed later once the target is available.
    queueDiscreteEvent(
      blockedOn,
      topLevelType,
      eventSystemFlags,
      targetContainer,
      nativeEvent,
    );
    return;
  }

  if (
    queueIfContinuousEvent(
      blockedOn,
      topLevelType,
      eventSystemFlags,
      targetContainer,
      nativeEvent,
    )
  ) {
    return;
  }

  // We need to clear only if we didn't queue because
  // queueing is accummulative.
  clearIfContinuousEvent(topLevelType, nativeEvent);

  // This is not replayable so we'll invoke it but without a target,
  // in case the event system needs to trace it.
  if (enableDeprecatedFlareAPI) {
    if (eventSystemFlags & PLUGIN_EVENT_SYSTEM) {
      if (enableModernEventSystem) {
        dispatchEventForPluginEventSystem(
          topLevelType,
          eventSystemFlags,
          nativeEvent,
          null,
          targetContainer,
        );
      } else {
        dispatchEventForLegacyPluginEventSystem(
          topLevelType,
          eventSystemFlags,
          nativeEvent,
          null,
        );
      }
    }
    if (eventSystemFlags & RESPONDER_EVENT_SYSTEM) {
      // React Flare event system
      DEPRECATED_dispatchEventForResponderEventSystem(
        (topLevelType: any),
        null,
        nativeEvent,
        getEventTarget(nativeEvent),
        eventSystemFlags,
      );
    }
  } else {
    if (enableModernEventSystem) {
      dispatchEventForPluginEventSystem(
        topLevelType,
        eventSystemFlags,
        nativeEvent,
        null,
        targetContainer,
      );
    } else {
      dispatchEventForLegacyPluginEventSystem(
        topLevelType,
        eventSystemFlags,
        nativeEvent,
        null,
      );
    }
  }
}

// Attempt dispatching an event. Returns a SuspenseInstance or Container if it's blocked.
export function attemptToDispatchEvent(
  topLevelType: DOMTopLevelEventType,
  eventSystemFlags: EventSystemFlags,
  targetContainer: EventTarget,
  nativeEvent: AnyNativeEvent,
): null | Container | SuspenseInstance {
  // TODO: Warn if _enabled is false.

  const nativeEventTarget = getEventTarget(nativeEvent);
  let targetInst = getClosestInstanceFromNode(nativeEventTarget);

  if (targetInst !== null) {
    const nearestMounted = getNearestMountedFiber(targetInst);
    if (nearestMounted === null) {
      // This tree has been unmounted already. Dispatch without a target.
      targetInst = null;
    } else {
      const tag = nearestMounted.tag;
      if (tag === SuspenseComponent) {
        const instance = getSuspenseInstanceFromFiber(nearestMounted);
        if (instance !== null) {
          // Queue the event to be replayed later. Abort dispatching since we
          // don't want this event dispatched twice through the event system.
          // TODO: If this is the first discrete event in the queue. Schedule an increased
          // priority for this boundary.
          return instance;
        }
        // This shouldn't happen, something went wrong but to avoid blocking
        // the whole system, dispatch the event without a target.
        // TODO: Warn.
        targetInst = null;
      } else if (tag === HostRoot) {
        const root: FiberRoot = nearestMounted.stateNode;
        if (root.hydrate) {
          // If this happens during a replay something went wrong and it might block
          // the whole system.
          return getContainerFromFiber(nearestMounted);
        }
        targetInst = null;
      } else if (nearestMounted !== targetInst) {
        // If we get an event (ex: img onload) before committing that
        // component's mount, ignore it for now (that is, treat it as if it was an
        // event on a non-React tree). We might also consider queueing events and
        // dispatching them after the mount.
        targetInst = null;
      }
    }
  }

  if (enableDeprecatedFlareAPI) {
    if (eventSystemFlags & PLUGIN_EVENT_SYSTEM) {
      if (enableModernEventSystem) {
        dispatchEventForPluginEventSystem(
          topLevelType,
          eventSystemFlags,
          nativeEvent,
          targetInst,
          targetContainer,
        );
      } else {
        dispatchEventForLegacyPluginEventSystem(
          topLevelType,
          eventSystemFlags,
          nativeEvent,
          targetInst,
        );
      }
    }
    if (eventSystemFlags & RESPONDER_EVENT_SYSTEM) {
      // React Flare event system
      DEPRECATED_dispatchEventForResponderEventSystem(
        (topLevelType: any),
        targetInst,
        nativeEvent,
        nativeEventTarget,
        eventSystemFlags,
      );
    }
  } else {
    if (enableModernEventSystem) {
      dispatchEventForPluginEventSystem(
        topLevelType,
        eventSystemFlags,
        nativeEvent,
        targetInst,
        targetContainer,
      );
    } else {
      dispatchEventForLegacyPluginEventSystem(
        topLevelType,
        eventSystemFlags,
        nativeEvent,
        targetInst,
      );
    }
  }
  // We're not blocked on anything.
  return null;
}
