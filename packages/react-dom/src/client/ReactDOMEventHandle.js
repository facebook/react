/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import type {DOMTopLevelEventType} from '../events/TopLevelEventTypes';
import type {EventPriority, ReactScopeInstance} from 'shared/ReactTypes';
import type {
  ReactDOMEventHandle,
  ReactDOMEventHandleListener,
} from '../shared/ReactDOMTypes';

import {getEventPriorityForListenerSystem} from '../events/DOMEventProperties';
import {
  getClosestInstanceFromNode,
  getEventHandlerListeners,
  setEventHandlerListeners,
  getEventListenerMap,
  getFiberFromScopeInstance,
} from './ReactDOMComponentTree';
import {ELEMENT_NODE} from '../shared/HTMLNodeType';
import {
  listenToTopLevelEvent,
  addEventTypeToDispatchConfig,
} from '../events/DOMModernPluginEventSystem';

import {HostRoot, HostPortal} from 'react-reconciler/src/ReactWorkTags';
import {
  PLUGIN_EVENT_SYSTEM,
  IS_TARGET_PHASE_ONLY,
} from '../events/EventSystemFlags';

import {
  enableScopeAPI,
  enableCreateEventHandleAPI,
} from 'shared/ReactFeatureFlags';
import invariant from 'shared/invariant';

type EventHandleOptions = {|
  capture?: boolean,
  passive?: boolean,
  priority?: EventPriority,
|};

const PossiblyWeakSet = typeof WeakSet === 'function' ? WeakSet : Set;

function getNearestRootOrPortalContainer(node: Fiber): null | Element {
  while (node !== null) {
    const tag = node.tag;
    // Once we encounter a host container or root container
    // we can return their DOM instance.
    if (tag === HostRoot || tag === HostPortal) {
      return node.stateNode.containerInfo;
    }
    node = node.return;
  }
  return null;
}

function isValidEventTarget(target: EventTarget | ReactScopeInstance): boolean {
  return typeof (target: Object).addEventListener === 'function';
}

function isReactScope(target: EventTarget | ReactScopeInstance): boolean {
  return typeof (target: Object).getChildContextValues === 'function';
}

function createEventHandleListener(
  type: DOMTopLevelEventType,
  capture: boolean,
  callback: (SyntheticEvent<EventTarget>) => void,
): ReactDOMEventHandleListener {
  return {
    callback,
    capture,
    type,
  };
}

function registerEventOnNearestTargetContainer(
  targetFiber: Fiber,
  topLevelType: DOMTopLevelEventType,
  passive: boolean | void,
  priority: EventPriority | void,
  capture: boolean,
): void {
  // If it is, find the nearest root or portal and make it
  // our event handle target container.
  const targetContainer = getNearestRootOrPortalContainer(targetFiber);
  if (targetContainer === null) {
    invariant(
      false,
      'ReactDOM.createEventHandle: setListener called on an target ' +
        'that did not have a corresponding root. This is likely a bug in React.',
    );
  }
  const listenerMap = getEventListenerMap(targetContainer);
  listenToTopLevelEvent(
    topLevelType,
    targetContainer,
    listenerMap,
    PLUGIN_EVENT_SYSTEM,
    capture,
    passive,
    priority,
  );
}

function registerReactDOMEvent(
  target: EventTarget | ReactScopeInstance,
  topLevelType: DOMTopLevelEventType,
  passive: boolean | void,
  capture: boolean,
  priority: EventPriority | void,
): void {
  // Check if the target is a DOM element.
  if ((target: any).nodeType === ELEMENT_NODE) {
    const targetElement = ((target: any): Element);
    // Check if the DOM element is managed by React.
    const targetFiber = getClosestInstanceFromNode(targetElement);
    if (targetFiber === null) {
      invariant(
        false,
        'ReactDOM.createEventHandle: setListener called on an element ' +
          'target that is not managed by React. Ensure React rendered the DOM element.',
      );
    }
    registerEventOnNearestTargetContainer(
      targetFiber,
      topLevelType,
      passive,
      priority,
      capture,
    );
  } else if (enableScopeAPI && isReactScope(target)) {
    const scopeTarget = ((target: any): ReactScopeInstance);
    const targetFiber = getFiberFromScopeInstance(scopeTarget);
    if (targetFiber === null) {
      // Scope is unmounted, do not proceed.
      return;
    }
    registerEventOnNearestTargetContainer(
      targetFiber,
      topLevelType,
      passive,
      priority,
      capture,
    );
  } else if (isValidEventTarget(target)) {
    const eventTarget = ((target: any): EventTarget);
    const listenerMap = getEventListenerMap(eventTarget);
    listenToTopLevelEvent(
      topLevelType,
      eventTarget,
      listenerMap,
      PLUGIN_EVENT_SYSTEM | IS_TARGET_PHASE_ONLY,
      capture,
      passive,
      priority,
    );
  } else {
    invariant(
      false,
      'ReactDOM.createEventHandle: setter called on an invalid ' +
        'target. Provide a valid EventTarget or an element managed by React.',
    );
  }
}

export function createEventHandle(
  type: string,
  options?: EventHandleOptions,
): ReactDOMEventHandle {
  if (enableCreateEventHandleAPI) {
    const topLevelType = ((type: any): DOMTopLevelEventType);
    let capture = false;
    let passive = undefined; // Undefined means to use the browser default
    let priority;

    if (options != null) {
      const optionsCapture = options.capture;
      const optionsPassive = options.passive;
      const optionsPriority = options.priority;

      if (typeof optionsCapture === 'boolean') {
        capture = optionsCapture;
      }
      if (typeof optionsPassive === 'boolean') {
        passive = optionsPassive;
      }
      if (typeof optionsPriority === 'number') {
        priority = optionsPriority;
      }
    }
    if (priority === undefined) {
      priority = getEventPriorityForListenerSystem(topLevelType);
    }

    const registeredReactDOMEvents = new PossiblyWeakSet();

    return (
      target: EventTarget | ReactScopeInstance,
      callback: (SyntheticEvent<EventTarget>) => void,
    ) => {
      invariant(
        typeof callback === 'function',
        'ReactDOM.createEventHandle: setter called with an invalid ' +
          'callback. The callback must be a function.',
      );
      if (!registeredReactDOMEvents.has(target)) {
        registeredReactDOMEvents.add(target);
        registerReactDOMEvent(target, topLevelType, passive, capture, priority);
        // Add the event to our known event types list.
        addEventTypeToDispatchConfig(topLevelType);
      }
      const listener = createEventHandleListener(
        topLevelType,
        capture,
        callback,
      );
      let targetListeners = getEventHandlerListeners(target);
      if (targetListeners === null) {
        targetListeners = new Set();
        setEventHandlerListeners(target, targetListeners);
      }
      targetListeners.add(listener);
      return () => {
        ((targetListeners: any): Set<ReactDOMEventHandleListener>).delete(
          listener,
        );
      };
    };
  }
  return (null: any);
}
