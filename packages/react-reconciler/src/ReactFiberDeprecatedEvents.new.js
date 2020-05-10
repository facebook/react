/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import type {Fiber} from './ReactInternalTypes';
import type {Container, Instance} from './ReactFiberHostConfig';
import type {
  ReactEventResponder,
  ReactEventResponderInstance,
  ReactEventResponderListener,
} from 'shared/ReactTypes';

import {
  DEPRECATED_mountResponderInstance,
  DEPRECATED_unmountResponderInstance,
} from './ReactFiberHostConfig';
import {NoLanes} from './ReactFiberLane';

import {REACT_RESPONDER_TYPE} from 'shared/ReactSymbols';

import invariant from 'shared/invariant';
import {HostComponent, HostRoot} from './ReactWorkTags';

const emptyObject = {};
const isArray = Array.isArray;

export function createResponderInstance(
  responder: ReactEventResponder<any, any>,
  responderProps: Object,
  responderState: Object,
  fiber: Fiber,
): ReactEventResponderInstance<any, any> {
  return {
    fiber,
    props: responderProps,
    responder,
    rootEventTypes: null,
    state: responderState,
  };
}

function mountEventResponder(
  responder: ReactEventResponder<any, any>,
  responderProps: Object,
  fiber: Fiber,
  respondersMap: Map<
    ReactEventResponder<any, any>,
    ReactEventResponderInstance<any, any>,
  >,
  rootContainerInstance: null | Container,
) {
  let responderState = emptyObject;
  const getInitialState = responder.getInitialState;
  if (getInitialState !== null) {
    responderState = getInitialState(responderProps);
  }
  const responderInstance = createResponderInstance(
    responder,
    responderProps,
    responderState,
    fiber,
  );

  if (!rootContainerInstance) {
    let node = fiber;
    while (node !== null) {
      const tag = node.tag;
      if (tag === HostComponent) {
        rootContainerInstance = node.stateNode;
        break;
      } else if (tag === HostRoot) {
        rootContainerInstance = node.stateNode.containerInfo;
        break;
      }
      node = node.return;
    }
  }

  DEPRECATED_mountResponderInstance(
    responder,
    responderInstance,
    responderProps,
    responderState,
    ((rootContainerInstance: any): Instance),
  );
  respondersMap.set(responder, responderInstance);
}

function updateEventListener(
  listener: ReactEventResponderListener<any, any>,
  fiber: Fiber,
  visistedResponders: Set<ReactEventResponder<any, any>>,
  respondersMap: Map<
    ReactEventResponder<any, any>,
    ReactEventResponderInstance<any, any>,
  >,
  rootContainerInstance: null | Container,
): void {
  let responder;
  let props;

  if (listener) {
    responder = listener.responder;
    props = listener.props;
  }
  invariant(
    responder && responder.$$typeof === REACT_RESPONDER_TYPE,
    'An invalid value was used as an event listener. Expect one or many event ' +
      'listeners created via React.unstable_useResponder().',
  );
  const listenerProps = ((props: any): Object);
  if (visistedResponders.has(responder)) {
    // show warning
    if (__DEV__) {
      console.error(
        'Duplicate event responder "%s" found in event listeners. ' +
          'Event listeners passed to elements cannot use the same event responder more than once.',
        responder.displayName,
      );
    }
    return;
  }
  visistedResponders.add(responder);
  const responderInstance = respondersMap.get(responder);

  if (responderInstance === undefined) {
    // Mount (happens in either complete or commit phase)
    mountEventResponder(
      responder,
      listenerProps,
      fiber,
      respondersMap,
      rootContainerInstance,
    );
  } else {
    // Update (happens during commit phase only)
    responderInstance.props = listenerProps;
    responderInstance.fiber = fiber;
  }
}

export function updateDeprecatedEventListeners(
  listeners: any,
  fiber: Fiber,
  rootContainerInstance: null | Container,
): void {
  const visistedResponders = new Set();
  let dependencies = fiber.dependencies_new;
  if (listeners != null) {
    if (dependencies === null) {
      dependencies = fiber.dependencies_new = {
        lanes: NoLanes,
        firstContext: null,
        responders: new Map(),
      };
    }
    let respondersMap = dependencies.responders;
    if (respondersMap === null) {
      dependencies.responders = respondersMap = new Map();
    }
    if (isArray(listeners)) {
      for (let i = 0, length = listeners.length; i < length; i++) {
        const listener = listeners[i];
        updateEventListener(
          listener,
          fiber,
          visistedResponders,
          respondersMap,
          rootContainerInstance,
        );
      }
    } else {
      updateEventListener(
        listeners,
        fiber,
        visistedResponders,
        respondersMap,
        rootContainerInstance,
      );
    }
  }
  if (dependencies !== null) {
    const respondersMap = dependencies.responders;
    if (respondersMap !== null) {
      // Unmount
      const mountedResponders = Array.from(respondersMap.keys());
      for (let i = 0, length = mountedResponders.length; i < length; i++) {
        const mountedResponder = mountedResponders[i];
        if (!visistedResponders.has(mountedResponder)) {
          const responderInstance = ((respondersMap.get(
            mountedResponder,
          ): any): ReactEventResponderInstance<any, any>);
          DEPRECATED_unmountResponderInstance(responderInstance);
          respondersMap.delete(mountedResponder);
        }
      }
    }
  }
}

export function createDeprecatedResponderListener(
  responder: ReactEventResponder<any, any>,
  props: Object,
): ReactEventResponderListener<any, any> {
  const eventResponderListener = {
    responder,
    props,
  };
  if (__DEV__) {
    Object.freeze(eventResponderListener);
  }
  return eventResponderListener;
}

export function unmountDeprecatedResponderListeners(fiber: Fiber) {
  const dependencies = fiber.dependencies_new;

  if (dependencies !== null) {
    const respondersMap = dependencies.responders;
    if (respondersMap !== null) {
      const responderInstances = Array.from(respondersMap.values());
      for (let i = 0, length = responderInstances.length; i < length; i++) {
        const responderInstance = responderInstances[i];
        DEPRECATED_unmountResponderInstance(responderInstance);
      }
      dependencies.responders = null;
    }
  }
}
