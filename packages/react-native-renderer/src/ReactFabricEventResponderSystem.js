/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import {HostComponent, ScopeComponent} from 'shared/ReactWorkTags';
import type {Fiber} from 'react-reconciler/src/ReactFiber';
import {
  batchedEventUpdates,
  discreteUpdates,
  flushDiscreteUpdatesIfNeeded,
  executeUserEventHandler,
} from 'legacy-events/ReactGenericBatching';
import type {
  ReactEventResponder,
  ReactEventResponderInstance,
} from 'shared/ReactTypes';
import type {
  ReactNativeResponderContext,
  ReactNativeResponderEvent,
  EventPriority,
  ReactNativeEventTarget,
  ReactFaricEvent,
} from './ReactNativeTypes';
import {
  ContinuousEvent,
  UserBlockingEvent,
  DiscreteEvent,
} from './ReactNativeTypes';
import {enableUserBlockingEvents} from 'shared/ReactFeatureFlags';
import warning from 'shared/warning';
import invariant from 'shared/invariant';

// Intentionally not named imports because Rollup would use dynamic dispatch for
// CommonJS interop named imports.
import * as Scheduler from 'scheduler';
const {
  unstable_UserBlockingPriority: UserBlockingPriority,
  unstable_runWithPriority: runWithPriority,
} = Scheduler;

type ResponderTimeout = {|
  id: TimeoutID,
  timers: Map<number, ResponderTimer>,
|};

type ResponderTimer = {|
  instance: ReactNativeEventResponderInstance,
  func: () => void,
  id: number,
  timeStamp: number,
|};

type ReactNativeEventResponder = ReactEventResponder<
  ReactNativeResponderEvent,
  ReactNativeResponderContext,
>;

type ReactNativeEventResponderInstance = ReactEventResponderInstance<
  ReactNativeResponderEvent,
  ReactNativeResponderContext,
>;

const {measureInWindow} = nativeFabricUIManager;

const activeTimeouts: Map<number, ResponderTimeout> = new Map();
const rootEventTypesToEventResponderInstances: Map<
  string,
  Set<ReactNativeEventResponderInstance>,
> = new Map();

let currentTimeStamp = 0;
let currentTimers = new Map();
let currentInstance: null | ReactNativeEventResponderInstance = null;
let currentTimerIDCounter = 0;

const eventResponderContext: ReactNativeResponderContext = {
  dispatchEvent(
    eventValue: any,
    eventListener: any => void,
    eventPriority: EventPriority,
  ): void {
    validateResponderContext();
    validateEventValue(eventValue);
    switch (eventPriority) {
      case DiscreteEvent: {
        flushDiscreteUpdatesIfNeeded(currentTimeStamp);
        discreteUpdates(() =>
          executeUserEventHandler(eventListener, eventValue),
        );
        break;
      }
      case UserBlockingEvent: {
        if (enableUserBlockingEvents) {
          runWithPriority(UserBlockingPriority, () =>
            executeUserEventHandler(eventListener, eventValue),
          );
        } else {
          executeUserEventHandler(eventListener, eventValue);
        }
        break;
      }
      case ContinuousEvent: {
        executeUserEventHandler(eventListener, eventValue);
        break;
      }
    }
  },
  isTargetWithinNode(
    childTarget: ReactNativeEventTarget,
    parentTarget: ReactNativeEventTarget,
  ) {
    validateResponderContext();
    const childFiber = getFiberFromTarget(childTarget);
    const parentFiber = getFiberFromTarget(parentTarget);

    let node = childFiber;
    while (node !== null) {
      if (node === parentFiber) {
        return true;
      }
      node = node.return;
    }
    return false;
  },
  getTargetBoundingRect(
    target: ReactNativeEventTarget,
    callback: ({
      left: number,
      right: number,
      top: number,
      bottom: number,
    }) => void,
  ) {
    measureInWindow(target.node, (x, y, width, height) => {
      callback({
        left: x,
        right: x + width,
        top: y,
        bottom: y + height,
      });
    });
  },
  addRootEventTypes(rootEventTypes: Array<string>): void {
    validateResponderContext();
    for (let i = 0; i < rootEventTypes.length; i++) {
      const rootEventType = rootEventTypes[i];
      const eventResponderInstance = ((currentInstance: any): ReactNativeEventResponderInstance);
      registerRootEventType(rootEventType, eventResponderInstance);
    }
  },
  removeRootEventTypes(rootEventTypes: Array<string>): void {
    validateResponderContext();
    for (let i = 0; i < rootEventTypes.length; i++) {
      const rootEventType = rootEventTypes[i];

      let rootEventResponders = rootEventTypesToEventResponderInstances.get(
        rootEventType,
      );
      let rootEventTypesSet = ((currentInstance: any): ReactNativeEventResponderInstance)
        .rootEventTypes;
      if (rootEventTypesSet !== null) {
        rootEventTypesSet.delete(rootEventType);
      }
      if (rootEventResponders !== undefined) {
        rootEventResponders.delete(
          ((currentInstance: any): ReactNativeEventResponderInstance),
        );
      }
    }
  },
  setTimeout(func: () => void, delay): number {
    validateResponderContext();
    if (currentTimers === null) {
      currentTimers = new Map();
    }
    let timeout = currentTimers.get(delay);

    const timerId = currentTimerIDCounter++;
    if (timeout === undefined) {
      const timers = new Map();
      const id = setTimeout(() => {
        processTimers(timers, delay);
      }, delay);
      timeout = {
        id,
        timers,
      };
      currentTimers.set(delay, timeout);
    }
    timeout.timers.set(timerId, {
      instance: ((currentInstance: any): ReactNativeEventResponderInstance),
      func,
      id: timerId,
      timeStamp: currentTimeStamp,
    });
    activeTimeouts.set(timerId, timeout);
    return timerId;
  },
  clearTimeout(timerId: number): void {
    validateResponderContext();
    const timeout = activeTimeouts.get(timerId);

    if (timeout !== undefined) {
      const timers = timeout.timers;
      timers.delete(timerId);
      if (timers.size === 0) {
        clearTimeout(timeout.id);
      }
    }
  },
  getTimeStamp(): number {
    validateResponderContext();
    return currentTimeStamp;
  },
  getResponderNode(): ReactNativeEventTarget | null {
    validateResponderContext();
    const responderFiber = ((currentInstance: any): ReactNativeEventResponderInstance)
      .fiber;
    if (responderFiber.tag === ScopeComponent) {
      return null;
    }
    return responderFiber.stateNode;
  },
};

function validateEventValue(eventValue: any): void {
  if (typeof eventValue === 'object' && eventValue !== null) {
    const {target, type, timeStamp} = eventValue;

    if (target == null || type == null || timeStamp == null) {
      throw new Error(
        'context.dispatchEvent: "target", "timeStamp", and "type" fields on event object are required.',
      );
    }
    const showWarning = name => {
      if (__DEV__) {
        warning(
          false,
          '%s is not available on event objects created from event responder modules (React Flare). ' +
            'Try wrapping in a conditional, i.e. `if (event.type !== "press") { event.%s }`',
          name,
          name,
        );
      }
    };
    eventValue.preventDefault = () => {
      if (__DEV__) {
        showWarning('preventDefault()');
      }
    };
    eventValue.stopPropagation = () => {
      if (__DEV__) {
        showWarning('stopPropagation()');
      }
    };
    eventValue.isDefaultPrevented = () => {
      if (__DEV__) {
        showWarning('isDefaultPrevented()');
      }
    };
    eventValue.isPropagationStopped = () => {
      if (__DEV__) {
        showWarning('isPropagationStopped()');
      }
    };
    // $FlowFixMe: we don't need value, Flow thinks we do
    Object.defineProperty(eventValue, 'nativeEvent', {
      get() {
        if (__DEV__) {
          showWarning('nativeEvent');
        }
      },
    });
  }
}

function getFiberFromTarget(
  target: null | ReactNativeEventTarget,
): Fiber | null {
  if (target === null) {
    return null;
  }
  return ((target.canonical._internalInstanceHandle: any): Fiber) || null;
}

function processTimers(
  timers: Map<number, ResponderTimer>,
  delay: number,
): void {
  const timersArr = Array.from(timers.values());
  try {
    batchedEventUpdates(() => {
      for (let i = 0; i < timersArr.length; i++) {
        const {instance, func, id, timeStamp} = timersArr[i];
        currentInstance = instance;
        currentTimeStamp = timeStamp + delay;
        try {
          func();
        } finally {
          activeTimeouts.delete(id);
        }
      }
    });
  } finally {
    currentTimers = null;
    currentInstance = null;
    currentTimeStamp = 0;
  }
}

function createFabricResponderEvent(
  topLevelType: string,
  nativeEvent: ReactFaricEvent,
  target: null | ReactNativeEventTarget,
): ReactNativeResponderEvent {
  return {
    nativeEvent,
    target,
    type: topLevelType,
  };
}

function validateResponderContext(): void {
  invariant(
    currentInstance,
    'An event responder context was used outside of an event cycle. ' +
      'Use context.setTimeout() to use asynchronous responder context outside of event cycle .',
  );
}

// TODO this function is almost an exact copy of the DOM version, we should
// somehow share the logic
function responderEventTypesContainType(
  eventTypes: Array<string>,
  type: string,
): boolean {
  for (let i = 0, len = eventTypes.length; i < len; i++) {
    if (eventTypes[i] === type) {
      return true;
    }
  }
  return false;
}

function validateResponderTargetEventTypes(
  eventType: string,
  responder: ReactNativeEventResponder,
): boolean {
  const {targetEventTypes} = responder;
  // Validate the target event type exists on the responder
  if (targetEventTypes !== null) {
    return responderEventTypesContainType(targetEventTypes, eventType);
  }
  return false;
}

// TODO this function is almost an exact copy of the DOM version, we should
// somehow share the logic
function traverseAndHandleEventResponderInstances(
  eventType: string,
  targetFiber: null | Fiber,
  nativeEvent: ReactFaricEvent,
): void {
  // Trigger event responders in this order:
  // - Bubble target responder phase
  // - Root responder phase

  const responderEvent = createFabricResponderEvent(
    eventType,
    nativeEvent,
    targetFiber !== null
      ? ((targetFiber.stateNode: any): ReactNativeEventTarget)
      : null,
  );
  const visitedResponders = new Set();
  let node = targetFiber;
  while (node !== null) {
    const {dependencies, tag} = node;
    if (
      (tag === HostComponent || tag === ScopeComponent) &&
      dependencies !== null
    ) {
      const respondersMap = dependencies.responders;
      if (respondersMap !== null) {
        const responderInstances = Array.from(respondersMap.values());
        for (let i = 0, length = responderInstances.length; i < length; i++) {
          const responderInstance = responderInstances[i];
          const {props, responder, state} = responderInstance;
          if (
            !visitedResponders.has(responder) &&
            validateResponderTargetEventTypes(eventType, responder)
          ) {
            const onEvent = responder.onEvent;
            visitedResponders.add(responder);
            if (onEvent !== null) {
              currentInstance = responderInstance;
              onEvent(responderEvent, eventResponderContext, props, state);
            }
          }
        }
      }
    }
    node = node.return;
  }
  // Root phase
  const rootEventResponderInstances = rootEventTypesToEventResponderInstances.get(
    eventType,
  );
  if (rootEventResponderInstances !== undefined) {
    const responderInstances = Array.from(rootEventResponderInstances);

    for (let i = 0; i < responderInstances.length; i++) {
      const responderInstance = responderInstances[i];
      const {props, responder, state} = responderInstance;
      const onRootEvent = responder.onRootEvent;
      if (onRootEvent !== null) {
        currentInstance = responderInstance;
        onRootEvent(responderEvent, eventResponderContext, props, state);
      }
    }
  }
}

// TODO this function is almost an exact copy of the DOM version, we should
// somehow share the logic
export function dispatchEventForResponderEventSystem(
  topLevelType: string,
  targetFiber: null | Fiber,
  nativeEvent: ReactFaricEvent,
): void {
  const previousInstance = currentInstance;
  const previousTimers = currentTimers;
  const previousTimeStamp = currentTimeStamp;
  currentTimers = null;
  // We might want to control timeStamp another way here
  currentTimeStamp = Date.now();
  try {
    batchedEventUpdates(() => {
      traverseAndHandleEventResponderInstances(
        topLevelType,
        targetFiber,
        nativeEvent,
      );
    });
  } finally {
    currentTimers = previousTimers;
    currentInstance = previousInstance;
    currentTimeStamp = previousTimeStamp;
  }
}

// TODO this function is almost an exact copy of the DOM version, we should
// somehow share the logic
export function mountEventResponder(
  responder: ReactNativeEventResponder,
  responderInstance: ReactNativeEventResponderInstance,
  props: Object,
  state: Object,
) {
  const onMount = responder.onMount;
  if (onMount !== null) {
    currentInstance = responderInstance;
    try {
      batchedEventUpdates(() => {
        onMount(eventResponderContext, props, state);
      });
    } finally {
      currentInstance = null;
      currentTimers = null;
    }
  }
}

// TODO this function is almost an exact copy of the DOM version, we should
// somehow share the logic
export function unmountEventResponder(
  responderInstance: ReactNativeEventResponderInstance,
): void {
  const responder = ((responderInstance.responder: any): ReactNativeEventResponder);
  const onUnmount = responder.onUnmount;
  if (onUnmount !== null) {
    let {props, state} = responderInstance;
    currentInstance = responderInstance;
    try {
      batchedEventUpdates(() => {
        onUnmount(eventResponderContext, props, state);
      });
    } finally {
      currentInstance = null;
      currentTimers = null;
    }
  }
  const rootEventTypesSet = responderInstance.rootEventTypes;
  if (rootEventTypesSet !== null) {
    const rootEventTypes = Array.from(rootEventTypesSet);

    for (let i = 0; i < rootEventTypes.length; i++) {
      const topLevelEventType = rootEventTypes[i];
      let rootEventResponderInstances = rootEventTypesToEventResponderInstances.get(
        topLevelEventType,
      );
      if (rootEventResponderInstances !== undefined) {
        rootEventResponderInstances.delete(responderInstance);
      }
    }
  }
}

function registerRootEventType(
  rootEventType: string,
  responderInstance: ReactNativeEventResponderInstance,
) {
  let rootEventResponderInstances = rootEventTypesToEventResponderInstances.get(
    rootEventType,
  );
  if (rootEventResponderInstances === undefined) {
    rootEventResponderInstances = new Set();
    rootEventTypesToEventResponderInstances.set(
      rootEventType,
      rootEventResponderInstances,
    );
  }
  let rootEventTypesSet = responderInstance.rootEventTypes;
  if (rootEventTypesSet === null) {
    rootEventTypesSet = responderInstance.rootEventTypes = new Set();
  }
  invariant(
    !rootEventTypesSet.has(rootEventType),
    'addRootEventTypes() found a duplicate root event ' +
      'type of "%s". This might be because the event type exists in the event responder "rootEventTypes" ' +
      'array or because of a previous addRootEventTypes() using this root event type.',
    rootEventType,
  );
  rootEventTypesSet.add(rootEventType);
  rootEventResponderInstances.add(responderInstance);
}

export function addRootEventTypesForResponderInstance(
  responderInstance: ReactNativeEventResponderInstance,
  rootEventTypes: Array<string>,
): void {
  for (let i = 0; i < rootEventTypes.length; i++) {
    const rootEventType = rootEventTypes[i];
    registerRootEventType(rootEventType, responderInstance);
  }
}
