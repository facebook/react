/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import type {DOMEventName} from '../events/DOMEventNames';
import type {ReactScopeInstance} from 'shared/ReactTypes';
import type {
  ReactDOMEventHandle,
  ReactDOMEventHandleListener,
} from '../shared/ReactDOMTypes';

import {allNativeEvents} from '../events/EventRegistry';
import {
  getClosestInstanceFromNode,
  getEventHandlerListeners,
  setEventHandlerListeners,
  getFiberFromScopeInstance,
  doesTargetHaveEventHandle,
  addEventHandleToTarget,
} from './ReactDOMComponentTree';
import {ELEMENT_NODE, COMMENT_NODE} from '../shared/HTMLNodeType';
import {listenToNativeEvent} from '../events/DOMPluginEventSystem';

import {HostRoot, HostPortal} from 'react-reconciler/src/ReactWorkTags';
import {IS_EVENT_HANDLE_NON_MANAGED_NODE} from '../events/EventSystemFlags';

import {
  enableScopeAPI,
  enableCreateEventHandleAPI,
  enableEagerRootListeners,
} from 'shared/ReactFeatureFlags';
import invariant from 'shared/invariant';

type EventHandleOptions = {|
  capture?: boolean,
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
  type: DOMEventName,
  isCapturePhaseListener: boolean,
  callback: (SyntheticEvent<EventTarget>) => void,
): ReactDOMEventHandleListener {
  return {
    callback,
    capture: isCapturePhaseListener,
    type,
  };
}

function registerEventOnNearestTargetContainer(
  targetFiber: Fiber,
  domEventName: DOMEventName,
  isCapturePhaseListener: boolean,
  targetElement: Element | null,
): void {
  if (!enableEagerRootListeners) {
    // If it is, find the nearest root or portal and make it
    // our event handle target container.
    let targetContainer = getNearestRootOrPortalContainer(targetFiber);
    if (targetContainer === null) {
      if (__DEV__) {
        console.error(
          'ReactDOM.createEventHandle: setListener called on an target ' +
            'that did not have a corresponding root. This is likely a bug in React.',
        );
      }
      return;
    }
    if (targetContainer.nodeType === COMMENT_NODE) {
      targetContainer = ((targetContainer.parentNode: any): Element);
    }
    listenToNativeEvent(
      domEventName,
      isCapturePhaseListener,
      targetContainer,
      targetElement,
    );
  }
}

function registerReactDOMEvent(
  target: EventTarget | ReactScopeInstance,
  domEventName: DOMEventName,
  isCapturePhaseListener: boolean,
): void {
  // Check if the target is a DOM element.
  if ((target: any).nodeType === ELEMENT_NODE) {
    if (!enableEagerRootListeners) {
      const targetElement = ((target: any): Element);
      // Check if the DOM element is managed by React.
      const targetFiber = getClosestInstanceFromNode(targetElement);
      if (targetFiber === null) {
        if (__DEV__) {
          console.error(
            'ReactDOM.createEventHandle: setListener called on an element ' +
              'target that is not managed by React. Ensure React rendered the DOM element.',
          );
        }
        return;
      }
      registerEventOnNearestTargetContainer(
        targetFiber,
        domEventName,
        isCapturePhaseListener,
        targetElement,
      );
    }
  } else if (enableScopeAPI && isReactScope(target)) {
    if (!enableEagerRootListeners) {
      const scopeTarget = ((target: any): ReactScopeInstance);
      const targetFiber = getFiberFromScopeInstance(scopeTarget);
      if (targetFiber === null) {
        // Scope is unmounted, do not proceed.
        return;
      }
      registerEventOnNearestTargetContainer(
        targetFiber,
        domEventName,
        isCapturePhaseListener,
        null,
      );
    }
  } else if (isValidEventTarget(target)) {
    const eventTarget = ((target: any): EventTarget);
    // These are valid event targets, but they are also
    // non-managed React nodes.
    listenToNativeEvent(
      domEventName,
      isCapturePhaseListener,
      eventTarget,
      null,
      IS_EVENT_HANDLE_NON_MANAGED_NODE,
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
    const domEventName = ((type: any): DOMEventName);

    // We cannot support arbitrary native events with eager root listeners
    // because the eager strategy relies on knowing the whole list ahead of time.
    // If we wanted to support this, we'd have to add code to keep track
    // (or search) for all portal and root containers, and lazily add listeners
    // to them whenever we see a previously unknown event. This seems like a lot
    // of complexity for something we don't even have a particular use case for.
    // Unfortunately, the downside of this invariant is that *removing* a native
    // event from the list of known events has now become a breaking change for
    // any code relying on the createEventHandle API.
    invariant(
      allNativeEvents.has(domEventName),
      'Cannot call unstable_createEventHandle with "%s", as it is not an event known to React.',
      domEventName,
    );

    let isCapturePhaseListener = false;
    if (options != null) {
      const optionsCapture = options.capture;
      if (typeof optionsCapture === 'boolean') {
        isCapturePhaseListener = optionsCapture;
      }
    }

    const eventHandle = (
      target: EventTarget | ReactScopeInstance,
      callback: (SyntheticEvent<EventTarget>) => void,
    ) => {
      invariant(
        typeof callback === 'function',
        'ReactDOM.createEventHandle: setter called with an invalid ' +
          'callback. The callback must be a function.',
      );
      if (!doesTargetHaveEventHandle(target, eventHandle)) {
        addEventHandleToTarget(target, eventHandle);
        registerReactDOMEvent(target, domEventName, isCapturePhaseListener);
      }
      const listener = createEventHandleListener(
        domEventName,
        isCapturePhaseListener,
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

    return eventHandle;
  }
  return (null: any);
}
