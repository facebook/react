/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import type {Fiber, ListenersObject, Dependencies} from './ReactFiber';
import type {Container, ReactListenerType} from './ReactFiberHostConfig';
import type {ReactListenerInstance} from 'shared/ReactTypes';

import {NoWork} from './ReactFiberExpirationTime';
import {
  diffListeners,
  prepareListener,
  commitListenerInstance,
  unmountListenerInstance,
} from './ReactFiberHostConfig';

import {HostComponent, HostRoot} from 'shared/ReactWorkTags';
import {Update} from 'shared/ReactSideEffectTags';

const isArray = Array.isArray;

function isListener(possibleListener: any) {
  return (
    possibleListener != null &&
    typeof possibleListener.type === 'string' &&
    typeof possibleListener.callback === 'function'
  );
}

function markUpdate(workInProgress: Fiber) {
  // Tag the fiber with an update effect. This turns a Placement into
  // a PlacementAndUpdate.
  workInProgress.effectTag |= Update;
}

function getRootContainerInstance(
  rootContainerInstance: null | Container,
  fiber: Fiber,
): Container {
  let rootInstance = rootContainerInstance;

  if (!rootInstance) {
    let node = fiber;
    while (node !== null) {
      const tag = node.tag;
      if (tag === HostComponent) {
        rootInstance = node.stateNode;
        break;
      } else if (tag === HostRoot) {
        rootInstance = node.stateNode.containerInfo;
        break;
      }
      node = node.return;
    }
  }

  return ((rootInstance: any): Container);
}

function createListenerInstance(
  listener: ReactListenerType,
): ReactListenerInstance<ReactListenerType> {
  return {
    currentTarget: null,
    listener,
    next: null,
    propagationDepth: 0,
  };
}

function recursivelyNormalizeListenerValues(
  values: any,
  normalizedListeners: Array<ReactListenerType>,
): void {
  for (let i = 0; i < values.length; i++) {
    const value = values[i];

    if (isArray(value)) {
      recursivelyNormalizeListenerValues(value, normalizedListeners);
    } else if (isListener(value)) {
      normalizedListeners.push(((value: any): ReactListenerType));
    }
  }
}

function normalizeListenerValues(values: any): Array<ReactListenerType> | null {
  if (values == null) {
    return null;
  } else if (isListener(values)) {
    return [((values: any): ReactListenerType)];
  }
  const normalizedListeners = [];
  recursivelyNormalizeListenerValues(values, normalizedListeners);
  if (normalizedListeners.length === 0) {
    return null;
  }
  return normalizedListeners;
}

function getListenersObjectFromFiber(
  fiber: Fiber,
  writeIfNotExist: boolean,
): ListenersObject | null {
  let dependencies = fiber.dependencies;
  if (dependencies === null) {
    if (!writeIfNotExist) {
      return null;
    }
    if (dependencies === null) {
      dependencies = fiber.dependencies = {
        expirationTime: NoWork,
        firstContext: null,
        responders: null,
        listeners: {
          firstInstance: null,
          memoized: null,
          pending: null,
        },
      };
    }
  }
  let listenersObject = dependencies.listeners;
  if (listenersObject === null) {
    if (!writeIfNotExist) {
      return null;
    }
    dependencies.listeners = listenersObject = {
      firstInstance: null,
      memoized: null,
      pending: null,
    };
  }
  return listenersObject;
}

export function reconcileListeners(
  current: null | Fiber,
  workInProgress: Fiber,
  possibleRootContainerInstance: null | Container,
): void {
  const prevtListeners =
    current === null ? null : current.memoizedProps.listeners;
  const nextListeners = workInProgress.pendingProps.listeners;

  if (prevtListeners === nextListeners) {
    return;
  }
  // We then normalize the listeners – flattening any
  // nested arrays and removing non-listeners entirely.
  // Note: this is a new array, we don't mutate the original.
  const pendingListeners = normalizeListenerValues(nextListeners);

  // First, we get the listeners object from the Fiber.
  // If we don't have one, we create one by passing true
  // as the second argument.
  const listenersObject = ((getListenersObjectFromFiber(
    workInProgress,
    true,
  ): any): ListenersObject);
  const memoizedListeners = listenersObject.memoized;

  if (memoizedListeners === pendingListeners) {
    return;
  }
  const memoizedListenersLength =
    memoizedListeners === null ? 0 : memoizedListeners.length;

  // We need the container instance so that we can
  // pass this to the render upon calling out to a
  // renderer upon mounting a listener instance.
  const rootContainerInstance = getRootContainerInstance(
    possibleRootContainerInstance,
    workInProgress,
  );

  // We use the needsUpdate flag to mark the fiber as needing
  // to create the listener instances in the commit phase.
  let needsUpdate = false;

  if (pendingListeners === null) {
    if (memoizedListenersLength > 0) {
      needsUpdate = true;
    }
  } else {
    const pendingListenersLength = pendingListeners.length;

    // If we have more memoized listeners than we have pending,
    // then we need to unmount some of them in the commit phase,
    // so we mark this as needing an update.
    if (memoizedListenersLength > pendingListenersLength) {
      needsUpdate = true;
    }
    for (let i = 0; i < pendingListenersLength; i++) {
      const pendingListener = pendingListeners[i];
      // If the current index is equal or more than the length of the
      // memoized listeners, then that means we need to mount this
      // listener. If we are on initial render, then we can optimize
      // things and skip the commit phase if the listener is not a root.
      // We do this in prepareListener (which returns true/false).
      if (i >= memoizedListenersLength) {
        const requiresUpdate = prepareListener(
          pendingListener,
          rootContainerInstance,
        );
        if (requiresUpdate || current !== null) {
          needsUpdate = true;
        }
      } else if (
        diffListeners(
          pendingListener,
          ((memoizedListeners: any): Array<ReactListenerType>)[i],
        )
      ) {
        prepareListener(pendingListener, rootContainerInstance);
        needsUpdate = true;
      }
    }
  }

  if (needsUpdate) {
    // We need to complete the listener reconcilation in the commit phase.
    listenersObject.pending = pendingListeners;
    markUpdate(workInProgress);
  } else if (pendingListeners !== null) {
    // If we have no updates and we are the initial completion
    // phase, we can apply a fast path that doesn't require
    // an additional commit phase to complete the reconcilation.
    const skipCommitCallbacks = true;
    mountAllPendingListeners(
      listenersObject,
      pendingListeners,
      skipCommitCallbacks,
    );
  }
}

function mountPendingListener(
  listenersObject: ListenersObject,
  pendingListener: ReactListenerType,
  prevInstance: null | ReactListenerInstance<ReactListenerType>,
  skipCommitCallbacks?: boolean,
): ReactListenerInstance<ReactListenerType> {
  const listenerInstance = createListenerInstance(pendingListener);
  if (!skipCommitCallbacks) {
    commitListenerInstance(listenerInstance);
  }
  if (prevInstance === null) {
    listenersObject.firstInstance = listenerInstance;
  } else {
    prevInstance.next = listenerInstance;
  }
  return listenerInstance;
}

function mountAllPendingListeners(
  listenersObject: ListenersObject,
  pendingListeners: Array<ReactListenerType>,
  skipCommitCallbacks?: boolean,
): void {
  let currentInstance = null;
  for (let i = 0; i < pendingListeners.length; i++) {
    currentInstance = mountPendingListener(
      listenersObject,
      pendingListeners[i],
      currentInstance,
      skipCommitCallbacks,
    );
  }
  listenersObject.memoized = pendingListeners;
}

export function commitListeners(finishedWork: Fiber): void {
  const listenersObject = getListenersObjectFromFiber(finishedWork, false);

  if (listenersObject !== null) {
    const pendingListeners = listenersObject.pending;
    let firstInstance = listenersObject.firstInstance;
    let currentInstance = null;
    let prevInstance = null;
    let visitedInstances = null;
    listenersObject.pending = null;

    if (pendingListeners !== null) {
      if (firstInstance === null) {
        mountAllPendingListeners(listenersObject, pendingListeners);
        return;
      }
      visitedInstances = new Set();
      currentInstance = firstInstance;

      // Diff the pending listeners with the memoized listeners on the
      // existing instances. In this phase, we only update and add
      // instances, we don't remove any instances. We mark all instances
      // we visit along the way, so we know what instances to remove
      // in the next phase.
      listenersObject.memoized = pendingListeners;
      for (let i = 0; i < pendingListeners.length; i++) {
        const pendingListener = pendingListeners[i];

        // If the current instance is null, we need to mount
        // a new instance
        if (currentInstance === null) {
          const newInstance = mountPendingListener(
            listenersObject,
            pendingListener,
            prevInstance,
          );
          visitedInstances.add(newInstance);
          prevInstance = currentInstance;
          currentInstance = newInstance;
        } else {
          const memoizedListener = currentInstance.listener;

          if (diffListeners(pendingListener, memoizedListener)) {
            unmountListenerInstance(currentInstance);
            // Rather than create a new listener instance, we just
            // replace the properties of the instance.
            currentInstance.listener = pendingListener;
            // We then commit the update instance
            commitListenerInstance(currentInstance);
          }
          visitedInstances.add(currentInstance);
          prevInstance = currentInstance;
          currentInstance = currentInstance.next;
        }
      }
    }
    // Now we handle the removal of any instances that were removed
    // as a delta of the memoized and pending listeners.
    currentInstance = listenersObject.firstInstance;
    prevInstance = null;

    // We iterate through all the existing instances and see if they
    // were marked as visited in the previous phase.
    while (currentInstance !== null) {
      if (visitedInstances === null || !visitedInstances.has(currentInstance)) {
        unmountListenerInstance(currentInstance);
        if (prevInstance === null) {
          listenersObject.firstInstance = currentInstance.next;
        } else {
          prevInstance.next = currentInstance.next;
        }
      } else {
        prevInstance = currentInstance;
      }
      currentInstance = currentInstance.next;
    }
  }
}

export function unmountListeners(fiber: Fiber): void {
  const listenersObject = getListenersObjectFromFiber(fiber, false);

  if (listenersObject !== null) {
    let instance = listenersObject.firstInstance;
    while (instance !== null) {
      unmountListenerInstance(instance);
      instance = instance.next;
    }
    ((fiber.dependencies: any): Dependencies).listeners = null;
  }
}
