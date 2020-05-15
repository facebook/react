/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import type {DOMTopLevelEventType} from 'legacy-events/TopLevelEventTypes';
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
  destroy: (target: EventTarget | ReactScopeInstance) => void,
): ReactDOMEventHandleListener {
  return {
    callback,
    capture,
    destroy,
    type,
  };
}

function registerEventOnNearestTargetContainer(
  targetFiber: Fiber,
  topLevelType: DOMTopLevelEventType,
  passive: boolean | void,
  priority: EventPriority | void,
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
    passive,
    priority,
  );
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

    const listeners = new Map();

    const destroy = (target: EventTarget | ReactScopeInstance): void => {
      const listener = listeners.get(target);
      if (listener !== undefined) {
        listeners.delete(target);
        const targetListeners = getEventHandlerListeners(target);
        if (targetListeners !== null) {
          targetListeners.delete(listener);
        }
      }
    };

    const clear = (): void => {
      const eventTargetsArr = Array.from(listeners.keys());
      for (let i = 0; i < eventTargetsArr.length; i++) {
        destroy(eventTargetsArr[i]);
      }
    };

    return {
      setListener(
        target: EventTarget | ReactScopeInstance,
        callback: null | ((SyntheticEvent<EventTarget>) => void),
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
          );
        } else if (isValidEventTarget(target)) {
          const eventTarget = ((target: any): EventTarget);
          const listenerMap = getEventListenerMap(eventTarget);
          listenToTopLevelEvent(
            topLevelType,
            eventTarget,
            listenerMap,
            PLUGIN_EVENT_SYSTEM | IS_TARGET_PHASE_ONLY,
            passive,
            priority,
            capture,
          );
        } else {
          invariant(
            false,
            'ReactDOM.createEventHandle: setListener called on an invalid ' +
              'target. Provide a vaid EventTarget or an element managed by React.',
          );
        }
        let listener = listeners.get(target);
        if (listener === undefined) {
          if (callback === null) {
            return;
          }
          listener = createEventHandleListener(
            topLevelType,
            capture,
            callback,
            destroy,
          );
          listeners.set(target, listener);

          let targetListeners = getEventHandlerListeners(target);
          if (targetListeners === null) {
            targetListeners = new Set();
            setEventHandlerListeners(target, targetListeners);
          }
          targetListeners.add(listener);
          // Finally, add the event to our known event types list.
          addEventTypeToDispatchConfig(topLevelType);
        } else if (callback !== null) {
          listener.callback = callback;
        } else {
          // Remove listener
          destroy(target);
        }
      },
      clear,
    };
  }
  return (null: any);
}
