/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 * @flow
 */

import {
  type EventSystemFlags,
  IS_PASSIVE,
  PASSIVE_NOT_SUPPORTED,
} from 'legacy-events/EventSystemFlags';
import type {AnyNativeEvent} from 'legacy-events/PluginModuleType';
import {HostComponent, ScopeComponent, HostPortal} from 'shared/ReactWorkTags';
import type {EventPriority} from 'shared/ReactTypes';
import type {
  ReactDOMEventResponder,
  ReactDOMEventResponderInstance,
  ReactDOMResponderContext,
  ReactDOMResponderEvent,
} from 'shared/ReactDOMTypes';
import type {DOMTopLevelEventType} from 'legacy-events/TopLevelEventTypes';
import {
  batchedEventUpdates,
  discreteUpdates,
  flushDiscreteUpdatesIfNeeded,
  executeUserEventHandler,
} from 'legacy-events/ReactGenericBatching';
import {enqueueStateRestore} from 'legacy-events/ReactControlledComponent';
import type {Fiber} from 'react-reconciler/src/ReactFiber';
import {enableDeprecatedFlareAPI} from 'shared/ReactFeatureFlags';
import invariant from 'shared/invariant';

import {getClosestInstanceFromNode} from '../client/ReactDOMComponentTree';
import {
  ContinuousEvent,
  UserBlockingEvent,
  DiscreteEvent,
} from 'shared/ReactTypes';

// Intentionally not named imports because Rollup would use dynamic dispatch for
// CommonJS interop named imports.
import * as Scheduler from 'scheduler';
const {
  unstable_UserBlockingPriority: UserBlockingPriority,
  unstable_runWithPriority: runWithPriority,
} = Scheduler;

export let listenToResponderEventTypesImpl;

export function setListenToResponderEventTypes(
  _listenToResponderEventTypesImpl: Function,
) {
  listenToResponderEventTypesImpl = _listenToResponderEventTypesImpl;
}

const rootEventTypesToEventResponderInstances: Map<
  DOMTopLevelEventType | string,
  Set<ReactDOMEventResponderInstance>,
> = new Map();

type PropagationBehavior = 0 | 1;

const DoNotPropagateToNextResponder = 0;
const PropagateToNextResponder = 1;

let currentTimeStamp = 0;
let currentInstance: null | ReactDOMEventResponderInstance = null;
let currentDocument: null | Document = null;
let currentPropagationBehavior: PropagationBehavior = DoNotPropagateToNextResponder;

const eventResponderContext: ReactDOMResponderContext = {
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
        runWithPriority(UserBlockingPriority, () =>
          executeUserEventHandler(eventListener, eventValue),
        );
        break;
      }
      case ContinuousEvent: {
        executeUserEventHandler(eventListener, eventValue);
        break;
      }
    }
  },
  isTargetWithinResponder(target: null | Element | Document): boolean {
    validateResponderContext();
    if (target != null) {
      let fiber = getClosestInstanceFromNode(target);
      const responderFiber = ((currentInstance: any): ReactDOMEventResponderInstance)
        .fiber;

      while (fiber !== null) {
        if (fiber === responderFiber || fiber.alternate === responderFiber) {
          return true;
        }
        fiber = fiber.return;
      }
    }
    return false;
  },
  isTargetWithinResponderScope(target: null | Element | Document): boolean {
    validateResponderContext();
    const componentInstance = ((currentInstance: any): ReactDOMEventResponderInstance);
    const responder = componentInstance.responder;

    if (target != null) {
      let fiber = getClosestInstanceFromNode(target);
      const responderFiber = ((currentInstance: any): ReactDOMEventResponderInstance)
        .fiber;

      while (fiber !== null) {
        if (fiber === responderFiber || fiber.alternate === responderFiber) {
          return true;
        }
        if (doesFiberHaveResponder(fiber, responder)) {
          return false;
        }
        fiber = fiber.return;
      }
    }
    return false;
  },
  isTargetWithinNode(
    childTarget: Element | Document,
    parentTarget: Element | Document,
  ): boolean {
    validateResponderContext();
    const childFiber = getClosestInstanceFromNode(childTarget);
    const parentFiber = getClosestInstanceFromNode(parentTarget);

    if (childFiber != null && parentFiber != null) {
      const parentAlternateFiber = parentFiber.alternate;
      let node = childFiber;
      while (node !== null) {
        if (node === parentFiber || node === parentAlternateFiber) {
          return true;
        }
        node = node.return;
      }
      return false;
    }
    // Fallback to DOM APIs
    return parentTarget.contains(childTarget);
  },
  addRootEventTypes(rootEventTypes: Array<string>): void {
    validateResponderContext();
    listenToResponderEventTypesImpl(rootEventTypes, currentDocument);
    for (let i = 0; i < rootEventTypes.length; i++) {
      const rootEventType = rootEventTypes[i];
      const eventResponderInstance = ((currentInstance: any): ReactDOMEventResponderInstance);
      DEPRECATED_registerRootEventType(rootEventType, eventResponderInstance);
    }
  },
  removeRootEventTypes(rootEventTypes: Array<string>): void {
    validateResponderContext();
    for (let i = 0; i < rootEventTypes.length; i++) {
      const rootEventType = rootEventTypes[i];
      let rootEventResponders = rootEventTypesToEventResponderInstances.get(
        rootEventType,
      );
      let rootEventTypesSet = ((currentInstance: any): ReactDOMEventResponderInstance)
        .rootEventTypes;
      if (rootEventTypesSet !== null) {
        rootEventTypesSet.delete(rootEventType);
      }
      if (rootEventResponders !== undefined) {
        rootEventResponders.delete(
          ((currentInstance: any): ReactDOMEventResponderInstance),
        );
      }
    }
  },
  getActiveDocument,
  objectAssign: Object.assign,
  getTimeStamp(): number {
    validateResponderContext();
    return currentTimeStamp;
  },
  isTargetWithinHostComponent(
    target: Element | Document,
    elementType: string,
  ): boolean {
    validateResponderContext();
    let fiber = getClosestInstanceFromNode(target);

    while (fiber !== null) {
      if (fiber.tag === HostComponent && fiber.type === elementType) {
        return true;
      }
      fiber = fiber.return;
    }
    return false;
  },
  continuePropagation() {
    currentPropagationBehavior = PropagateToNextResponder;
  },
  enqueueStateRestore,
  getResponderNode(): Element | null {
    validateResponderContext();
    const responderFiber = ((currentInstance: any): ReactDOMEventResponderInstance)
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
        console.error(
          '%s is not available on event objects created from event responder modules (React Flare). ' +
            'Try wrapping in a conditional, i.e. `if (event.type !== "press") { event.%s }`',
          name,
          name,
        );
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

function doesFiberHaveResponder(
  fiber: Fiber,
  responder: ReactDOMEventResponder,
): boolean {
  const tag = fiber.tag;
  if (tag === HostComponent || tag === ScopeComponent) {
    const dependencies = fiber.dependencies;
    if (dependencies !== null) {
      const respondersMap = dependencies.responders;
      if (respondersMap !== null && respondersMap.has(responder)) {
        return true;
      }
    }
  }
  return false;
}

function getActiveDocument(): Document {
  return ((currentDocument: any): Document);
}

function createDOMResponderEvent(
  topLevelType: string,
  nativeEvent: AnyNativeEvent,
  nativeEventTarget: Element | Document,
  passive: boolean,
): ReactDOMResponderEvent {
  const {buttons, pointerType} = (nativeEvent: any);
  let eventPointerType = '';

  if (pointerType !== undefined) {
    eventPointerType = pointerType;
  } else if (nativeEvent.key !== undefined) {
    eventPointerType = 'keyboard';
  } else if (buttons !== undefined) {
    eventPointerType = 'mouse';
  } else if ((nativeEvent: any).changedTouches !== undefined) {
    eventPointerType = 'touch';
  }

  return {
    nativeEvent: nativeEvent,
    passive,
    pointerType: eventPointerType,
    target: nativeEventTarget,
    type: topLevelType,
  };
}

function responderEventTypesContainType(
  eventTypes: Array<string>,
  type: string,
  isPassive: boolean,
): boolean {
  for (let i = 0, len = eventTypes.length; i < len; i++) {
    const eventType = eventTypes[i];
    if (eventType === type || (!isPassive && eventType === type + '_active')) {
      return true;
    }
  }
  return false;
}

function validateResponderTargetEventTypes(
  eventType: string,
  responder: ReactDOMEventResponder,
  isPassive: boolean,
): boolean {
  const {targetEventTypes} = responder;
  // Validate the target event type exists on the responder
  if (targetEventTypes !== null) {
    return responderEventTypesContainType(
      targetEventTypes,
      eventType,
      isPassive,
    );
  }
  return false;
}

function traverseAndHandleEventResponderInstances(
  topLevelType: string,
  targetFiber: null | Fiber,
  nativeEvent: AnyNativeEvent,
  nativeEventTarget: Document | Element,
  eventSystemFlags: EventSystemFlags,
): void {
  const isPassiveEvent = (eventSystemFlags & IS_PASSIVE) !== 0;
  const isPassiveSupported = (eventSystemFlags & PASSIVE_NOT_SUPPORTED) === 0;
  const isPassive = isPassiveEvent || !isPassiveSupported;

  // Trigger event responders in this order:
  // - Bubble target responder phase
  // - Root responder phase

  const visitedResponders = new Set();
  const responderEvent = createDOMResponderEvent(
    topLevelType,
    nativeEvent,
    nativeEventTarget,
    isPassiveEvent,
  );
  let node = targetFiber;
  let insidePortal = false;
  while (node !== null) {
    const {dependencies, tag} = node;
    if (tag === HostPortal) {
      insidePortal = true;
    } else if (
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
            validateResponderTargetEventTypes(
              topLevelType,
              responder,
              isPassive,
            ) &&
            (!insidePortal || responder.targetPortalPropagation)
          ) {
            visitedResponders.add(responder);
            const onEvent = responder.onEvent;
            if (onEvent !== null) {
              currentInstance = responderInstance;
              onEvent(responderEvent, eventResponderContext, props, state);
              if (currentPropagationBehavior === PropagateToNextResponder) {
                visitedResponders.delete(responder);
                currentPropagationBehavior = DoNotPropagateToNextResponder;
              }
            }
          }
        }
      }
    }
    node = node.return;
  }
  // Root phase
  const passive = rootEventTypesToEventResponderInstances.get(topLevelType);
  const rootEventResponderInstances = [];
  if (passive !== undefined) {
    rootEventResponderInstances.push(...Array.from(passive));
  }
  if (!isPassive) {
    const active = rootEventTypesToEventResponderInstances.get(
      topLevelType + '_active',
    );
    if (active !== undefined) {
      rootEventResponderInstances.push(...Array.from(active));
    }
  }
  if (rootEventResponderInstances.length > 0) {
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

export function mountEventResponder(
  responder: ReactDOMEventResponder,
  responderInstance: ReactDOMEventResponderInstance,
  props: Object,
  state: Object,
) {
  const onMount = responder.onMount;
  if (onMount !== null) {
    const previousInstance = currentInstance;
    currentInstance = responderInstance;
    try {
      onMount(eventResponderContext, props, state);
    } finally {
      currentInstance = previousInstance;
    }
  }
}

export function unmountEventResponder(
  responderInstance: ReactDOMEventResponderInstance,
): void {
  const responder = ((responderInstance.responder: any): ReactDOMEventResponder);
  const onUnmount = responder.onUnmount;
  if (onUnmount !== null) {
    let {props, state} = responderInstance;
    const previousInstance = currentInstance;
    currentInstance = responderInstance;
    try {
      onUnmount(eventResponderContext, props, state);
    } finally {
      currentInstance = previousInstance;
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

function validateResponderContext(): void {
  invariant(
    currentInstance !== null,
    'An event responder context was used outside of an event cycle.',
  );
}

export function DEPRECATED_dispatchEventForResponderEventSystem(
  topLevelType: string,
  targetFiber: null | Fiber,
  nativeEvent: AnyNativeEvent,
  nativeEventTarget: Document | Element,
  eventSystemFlags: EventSystemFlags,
): void {
  if (enableDeprecatedFlareAPI) {
    const previousInstance = currentInstance;
    const previousTimeStamp = currentTimeStamp;
    const previousDocument = currentDocument;
    const previousPropagationBehavior = currentPropagationBehavior;
    currentPropagationBehavior = DoNotPropagateToNextResponder;
    // nodeType 9 is DOCUMENT_NODE
    currentDocument =
      (nativeEventTarget: any).nodeType === 9
        ? ((nativeEventTarget: any): Document)
        : (nativeEventTarget: any).ownerDocument;
    // We might want to control timeStamp another way here
    currentTimeStamp = (nativeEvent: any).timeStamp;
    try {
      batchedEventUpdates(() => {
        traverseAndHandleEventResponderInstances(
          topLevelType,
          targetFiber,
          nativeEvent,
          nativeEventTarget,
          eventSystemFlags,
        );
      });
    } finally {
      currentInstance = previousInstance;
      currentTimeStamp = previousTimeStamp;
      currentDocument = previousDocument;
      currentPropagationBehavior = previousPropagationBehavior;
    }
  }
}

export function addRootEventTypesForResponderInstance(
  responderInstance: ReactDOMEventResponderInstance,
  rootEventTypes: Array<string>,
): void {
  for (let i = 0; i < rootEventTypes.length; i++) {
    const rootEventType = rootEventTypes[i];
    DEPRECATED_registerRootEventType(rootEventType, responderInstance);
  }
}

function DEPRECATED_registerRootEventType(
  rootEventType: string,
  eventResponderInstance: ReactDOMEventResponderInstance,
): void {
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
  let rootEventTypesSet = eventResponderInstance.rootEventTypes;
  if (rootEventTypesSet === null) {
    rootEventTypesSet = eventResponderInstance.rootEventTypes = new Set();
  }
  invariant(
    !rootEventTypesSet.has(rootEventType),
    'addRootEventTypes() found a duplicate root event ' +
      'type of "%s". This might be because the event type exists in the event responder "rootEventTypes" ' +
      'array or because of a previous addRootEventTypes() using this root event type.',
    rootEventType,
  );
  rootEventTypesSet.add(rootEventType);
  rootEventResponderInstances.add(eventResponderInstance);
}
