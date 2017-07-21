/**
 * Copyright 2013-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @providesModule ReactFiberReconciler
 * @flow
 */

'use strict';

import type {Fiber} from 'ReactFiber';
import type {FiberRoot} from 'ReactFiberRoot';
import type {PriorityLevel} from 'ReactPriorityLevel';
import type {ReactNodeList} from 'ReactTypes';

var ReactFeatureFlags = require('ReactFeatureFlags');

var {addTopLevelUpdate} = require('ReactFiberUpdateQueue');

var {
  findCurrentUnmaskedContext,
  isContextProvider,
  processChildContext,
} = require('ReactFiberContext');
var {createFiberRoot} = require('ReactFiberRoot');
var ReactFiberScheduler = require('ReactFiberScheduler');
var {HostComponent} = require('ReactTypeOfWork');

if (__DEV__) {
  var warning = require('fbjs/lib/warning');
  var ReactFiberInstrumentation = require('ReactFiberInstrumentation');
  var ReactDebugCurrentFiber = require('ReactDebugCurrentFiber');
  var getComponentName = require('getComponentName');
}

var {
  findCurrentHostFiber,
  findCurrentHostFiberWithNoPortals,
} = require('ReactFiberTreeReflection');

var getContextForSubtree = require('getContextForSubtree');

export type Deadline = {
  timeRemaining: () => number,
};

type OpaqueHandle = Fiber;
type OpaqueRoot = FiberRoot;

export type HostConfig<T, P, I, TI, PI, C, CX, PL> = {
  getRootHostContext(rootContainerInstance: C): CX,
  getChildHostContext(parentHostContext: CX, type: T, instance: C): CX,
  getPublicInstance(instance: I | TI): PI,

  createInstance(
    type: T,
    props: P,
    rootContainerInstance: C,
    hostContext: CX,
    internalInstanceHandle: OpaqueHandle,
  ): I,
  appendInitialChild(parentInstance: I, child: I | TI): void,
  finalizeInitialChildren(
    parentInstance: I,
    type: T,
    props: P,
    rootContainerInstance: C,
  ): boolean,

  prepareUpdate(
    instance: I,
    type: T,
    oldProps: P,
    newProps: P,
    rootContainerInstance: C,
    hostContext: CX,
  ): null | PL,
  commitUpdate(
    instance: I,
    updatePayload: PL,
    type: T,
    oldProps: P,
    newProps: P,
    internalInstanceHandle: OpaqueHandle,
  ): void,
  commitMount(
    instance: I,
    type: T,
    newProps: P,
    internalInstanceHandle: OpaqueHandle,
  ): void,

  shouldSetTextContent(type: T, props: P): boolean,
  resetTextContent(instance: I): void,
  shouldDeprioritizeSubtree(type: T, props: P): boolean,

  createTextInstance(
    text: string,
    rootContainerInstance: C,
    hostContext: CX,
    internalInstanceHandle: OpaqueHandle,
  ): TI,
  commitTextUpdate(textInstance: TI, oldText: string, newText: string): void,

  appendChild(parentInstance: I, child: I | TI): void,
  appendChildToContainer(container: C, child: I | TI): void,
  insertBefore(parentInstance: I, child: I | TI, beforeChild: I | TI): void,
  insertInContainerBefore(
    container: C,
    child: I | TI,
    beforeChild: I | TI,
  ): void,
  removeChild(parentInstance: I, child: I | TI): void,
  removeChildFromContainer(container: C, child: I | TI): void,

  scheduleDeferredCallback(
    callback: (deadline: Deadline) => void,
  ): number | void,

  prepareForCommit(): void,
  resetAfterCommit(): void,

  // Optional hydration
  canHydrateInstance?: (instance: I | TI, type: T, props: P) => boolean,
  canHydrateTextInstance?: (instance: I | TI, text: string) => boolean,
  getNextHydratableSibling?: (instance: I | TI) => null | I | TI,
  getFirstHydratableChild?: (parentInstance: I | C) => null | I | TI,
  hydrateInstance?: (
    instance: I,
    type: T,
    props: P,
    rootContainerInstance: C,
    internalInstanceHandle: OpaqueHandle,
  ) => null | PL,
  hydrateTextInstance?: (
    textInstance: TI,
    text: string,
    internalInstanceHandle: OpaqueHandle,
  ) => boolean,
  didNotHydrateInstance?: (parentInstance: I | C, instance: I | TI) => void,
  didNotFindHydratableInstance?: (
    parentInstance: I | C,
    type: T,
    props: P,
  ) => void,
  didNotFindHydratableTextInstance?: (
    parentInstance: I | C,
    text: string,
  ) => void,

  useSyncScheduling?: boolean,
};

export type Reconciler<C, I, TI> = {
  createContainer(containerInfo: C): OpaqueRoot,
  updateContainer(
    element: ReactNodeList,
    container: OpaqueRoot,
    parentComponent: ?ReactComponent<any, any, any>,
    callback: ?Function,
  ): void,
  performWithPriority(priorityLevel: PriorityLevel, fn: Function): void,
  batchedUpdates<A>(fn: () => A): A,
  unbatchedUpdates<A>(fn: () => A): A,
  syncUpdates<A>(fn: () => A): A,
  deferredUpdates<A>(fn: () => A): A,

  // Used to extract the return value from the initial render. Legacy API.
  getPublicRootInstance(
    container: OpaqueRoot,
  ): ReactComponent<any, any, any> | TI | I | null,

  // Use for findDOMNode/findHostNode. Legacy API.
  findHostInstance(component: Fiber): I | TI | null,

  // Used internally for filtering out portals. Legacy API.
  findHostInstanceWithNoPortals(component: Fiber): I | TI | null,
};

getContextForSubtree._injectFiber(function(fiber: Fiber) {
  const parentContext = findCurrentUnmaskedContext(fiber);
  return isContextProvider(fiber)
    ? processChildContext(fiber, parentContext, false)
    : parentContext;
});

module.exports = function<T, P, I, TI, PI, C, CX, PL>(
  config: HostConfig<T, P, I, TI, PI, C, CX, PL>,
): Reconciler<C, I, TI> {
  var {getPublicInstance} = config;

  var {
    scheduleUpdate,
    getPriorityContext,
    performWithPriority,
    batchedUpdates,
    unbatchedUpdates,
    syncUpdates,
    deferredUpdates,
  } = ReactFiberScheduler(config);

  function scheduleTopLevelUpdate(
    current: Fiber,
    element: ReactNodeList,
    callback: ?Function,
  ) {
    if (__DEV__) {
      if (
        ReactDebugCurrentFiber.phase === 'render' &&
        ReactDebugCurrentFiber.current !== null
      ) {
        warning(
          false,
          'Render methods should be a pure function of props and state; ' +
            'triggering nested component updates from render is not allowed. ' +
            'If necessary, trigger nested updates in componentDidUpdate.\n\n' +
            'Check the render method of %s.',
          getComponentName(ReactDebugCurrentFiber.current) || 'Unknown',
        );
      }
    }

    // Check if the top-level element is an async wrapper component. If so, treat
    // updates to the root as async. This is a bit weird but lets us avoid a separate
    // `renderAsync` API.
    const forceAsync =
      ReactFeatureFlags.enableAsyncSubtreeAPI &&
      element != null &&
      element.type != null &&
      element.type.prototype != null &&
      (element.type.prototype: any).unstable_isAsyncReactComponent === true;
    const priorityLevel = getPriorityContext(current, forceAsync);
    const nextState = {element};
    callback = callback === undefined ? null : callback;
    if (__DEV__) {
      warning(
        callback === null || typeof callback === 'function',
        'render(...): Expected the last optional `callback` argument to be a ' +
          'function. Instead received: %s.',
        callback,
      );
    }
    addTopLevelUpdate(current, nextState, callback, priorityLevel);
    scheduleUpdate(current, priorityLevel);
  }

  return {
    createContainer(containerInfo: C): OpaqueRoot {
      return createFiberRoot(containerInfo);
    },

    updateContainer(
      element: ReactNodeList,
      container: OpaqueRoot,
      parentComponent: ?ReactComponent<any, any, any>,
      callback: ?Function,
    ): void {
      // TODO: If this is a nested container, this won't be the root.
      const current = container.current;

      if (__DEV__) {
        if (ReactFiberInstrumentation.debugTool) {
          if (current.alternate === null) {
            ReactFiberInstrumentation.debugTool.onMountContainer(container);
          } else if (element === null) {
            ReactFiberInstrumentation.debugTool.onUnmountContainer(container);
          } else {
            ReactFiberInstrumentation.debugTool.onUpdateContainer(container);
          }
        }
      }

      const context = getContextForSubtree(parentComponent);
      if (container.context === null) {
        container.context = context;
      } else {
        container.pendingContext = context;
      }

      scheduleTopLevelUpdate(current, element, callback);
    },

    performWithPriority,

    batchedUpdates,

    unbatchedUpdates,

    syncUpdates,

    deferredUpdates,

    getPublicRootInstance(
      container: OpaqueRoot,
    ): ReactComponent<any, any, any> | PI | null {
      const containerFiber = container.current;
      if (!containerFiber.child) {
        return null;
      }
      switch (containerFiber.child.tag) {
        case HostComponent:
          return getPublicInstance(containerFiber.child.stateNode);
        default:
          return containerFiber.child.stateNode;
      }
    },

    findHostInstance(fiber: Fiber): PI | null {
      const hostFiber = findCurrentHostFiber(fiber);
      if (hostFiber === null) {
        return null;
      }
      return hostFiber.stateNode;
    },

    findHostInstanceWithNoPortals(fiber: Fiber): PI | null {
      const hostFiber = findCurrentHostFiberWithNoPortals(fiber);
      if (hostFiber === null) {
        return null;
      }
      return hostFiber.stateNode;
    },
  };
};
