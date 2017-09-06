/**
 * Copyright (c) 2013-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @providesModule ReactFiberReconciler
 * @flow
 */

'use strict';

import type {Fiber} from 'ReactFiber';
import type {FiberRoot} from 'ReactFiberRoot';
import type {PriorityLevel} from 'ReactPriorityLevel';
import type {ExpirationTime} from 'ReactFiberExpirationTime';
import type {ReactNodeList} from 'ReactTypes';

var ReactFeatureFlags = require('ReactFeatureFlags');

var {
  insertUpdateIntoFiber,
  insertUpdateIntoQueue,
  createUpdateQueue,
  processUpdateQueue,
} = require('ReactFiberUpdateQueue');

var {
  findCurrentUnmaskedContext,
  isContextProvider,
  processChildContext,
} = require('ReactFiberContext');
var {createFiberRoot} = require('ReactFiberRoot');
var ReactFiberScheduler = require('ReactFiberScheduler');
var ReactInstanceMap = require('ReactInstanceMap');
var {HostComponent} = require('ReactTypeOfWork');
var emptyObject = require('fbjs/lib/emptyObject');

if (__DEV__) {
  var warning = require('fbjs/lib/warning');
  var ReactFiberInstrumentation = require('ReactFiberInstrumentation');
  var ReactDebugCurrentFiber = require('ReactDebugCurrentFiber');
  var getComponentName = require('getComponentName');
  var didWarnAboutNestedUpdates = false;
}

var {
  findCurrentHostFiber,
  findCurrentHostFiberWithNoPortals,
} = require('ReactFiberTreeReflection');

export type Deadline = {
  timeRemaining: () => number,
};

type OpaqueHandle = Fiber;
type OpaqueRoot = FiberRoot;

type Awaitable<T> = {
  then(resolve: (result: T) => mixed): void,
};

export type Work = Awaitable<void> & {
  commit(): void,

  _reactRootContainer: *,
  _expirationTime: ExpirationTime,
};

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

  now(): number,

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
    hostContext: CX,
    internalInstanceHandle: OpaqueHandle,
  ) => null | PL,
  hydrateTextInstance?: (
    textInstance: TI,
    text: string,
    internalInstanceHandle: OpaqueHandle,
  ) => boolean,
  didNotMatchHydratedContainerTextInstance?: (
    parentContainer: C,
    textInstance: TI,
    text: string,
  ) => void,
  didNotMatchHydratedTextInstance?: (
    parentType: T,
    parentProps: P,
    parentInstance: I,
    textInstance: TI,
    text: string,
  ) => void,
  didNotHydrateContainerInstance?: (
    parentContainer: C,
    instance: I | TI,
  ) => void,
  didNotHydrateInstance?: (
    parentType: T,
    parentProps: P,
    parentInstance: I,
    instance: I | TI,
  ) => void,
  didNotFindHydratableContainerInstance?: (
    parentContainer: C,
    type: T,
    props: P,
  ) => void,
  didNotFindHydratableContainerTextInstance?: (
    parentContainer: C,
    text: string,
  ) => void,
  didNotFindHydratableInstance?: (
    parentType: T,
    parentProps: P,
    parentInstance: I,
    type: T,
    props: P,
  ) => void,
  didNotFindHydratableTextInstance?: (
    parentType: T,
    parentProps: P,
    parentInstance: I,
    text: string,
  ) => void,

  useSyncScheduling?: boolean,
};

export type Reconciler<C, I, TI> = {
  createContainer(containerInfo: C): OpaqueRoot,
  updateRoot(
    element: ReactNodeList,
    container: OpaqueRoot,
    parentComponent: ?React$Component<any, any>,
  ): Work,
  updateContainer(
    element: ReactNodeList,
    container: OpaqueRoot,
    parentComponent: ?React$Component<any, any>,
    callback: ?Function,
  ): void,
  batchedUpdates<A>(fn: () => A): A,
  unbatchedUpdates<A>(fn: () => A): A,
  flushSync<A>(fn: () => A): A,
  deferredUpdates<A>(fn: () => A): A,

  // Used to extract the return value from the initial render. Legacy API.
  getPublicRootInstance(
    container: OpaqueRoot,
  ): React$Component<any, any> | TI | I | null,

  // Use for findDOMNode/findHostNode. Legacy API.
  findHostInstance(component: Fiber): I | TI | null,

  // Used internally for filtering out portals. Legacy API.
  findHostInstanceWithNoPortals(component: Fiber): I | TI | null,
};

function getContextForSubtree(
  parentComponent: ?React$Component<any, any>,
): Object {
  if (!parentComponent) {
    return emptyObject;
  }

  const fiber = ReactInstanceMap.get(parentComponent);
  const parentContext = findCurrentUnmaskedContext(fiber);
  return isContextProvider(fiber)
    ? processChildContext(fiber, parentContext)
    : parentContext;
}

module.exports = function<T, P, I, TI, PI, C, CX, PL>(
  config: HostConfig<T, P, I, TI, PI, C, CX, PL>,
): Reconciler<C, I, TI> {
  var {getPublicInstance} = config;

  var {
    scheduleUpdate,
    getPriorityContext,
    getExpirationTimeForPriority,
    recalculateCurrentTime,
    expireWork,
    batchedUpdates,
    unbatchedUpdates,
    flushSync,
    deferredUpdates,
  } = ReactFiberScheduler(config);

  function scheduleTopLevelUpdate(
    root: FiberRoot,
    element: ReactNodeList,
    currentTime: ExpirationTime,
    isPrerender: boolean,
    callback: ?Function,
  ): ExpirationTime {
    if (__DEV__) {
      if (
        ReactDebugCurrentFiber.phase === 'render' &&
        ReactDebugCurrentFiber.current !== null &&
        !didWarnAboutNestedUpdates
      ) {
        didWarnAboutNestedUpdates = true;
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

    const current = root.current;

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
    const expirationTime = getExpirationTimeForPriority(
      currentTime,
      priorityLevel,
    );
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
    const isTopLevelUnmount = nextState.element === null;
    const update = {
      priorityLevel,
      expirationTime,
      partialState: nextState,
      callback,
      isReplace: false,
      isForced: false,
      isTopLevelUnmount,
      next: null,
    };
    const update2 = insertUpdateIntoFiber(current, update, currentTime);

    if (isTopLevelUnmount) {
      // TODO: Redesign the top-level mount/update/unmount API to avoid this
      // special case.
      const queue1 = current.updateQueue;
      const queue2 = current.alternate !== null
        ? current.alternate.updateQueue
        : null;

      // Drop all updates that are lower-priority, so that the tree is not
      // remounted. We need to do this for both queues.
      if (queue1 !== null && update.next !== null) {
        update.next = null;
        queue1.last = update;
      }
      if (queue2 !== null && update2 !== null && update2.next !== null) {
        update2.next = null;
        queue2.last = update;
      }
    }

    if (isPrerender) {
      // Block the root from committing at this expiration time.
      if (root.blockers === null) {
        root.blockers = createUpdateQueue();
      }
      const blockUpdate = {
        priorityLevel: null,
        expirationTime,
        partialState: null,
        callback: null,
        isReplace: false,
        isForced: false,
        isTopLevelUnmount: false,
        next: null,
      };
      insertUpdateIntoQueue(root.blockers, blockUpdate, currentTime);
    }

    scheduleUpdate(current, expirationTime);
    return expirationTime;
  }

  function WorkNode(root: OpaqueRoot, expirationTime: ExpirationTime) {
    this._reactRootContainer = root;
    this._expirationTime = expirationTime;
  }
  WorkNode.prototype.commit = function() {
    const root = this._reactRootContainer;
    const expirationTime = this._expirationTime;
    const blockers = root.blockers;
    if (blockers === null) {
      return;
    }
    processUpdateQueue(blockers, null, null, null, expirationTime);
    expireWork(expirationTime);
  };
  WorkNode.prototype.then = function(callback) {
    const root = this._reactRootContainer;
    const expirationTime = this._expirationTime;

    // Add callback to queue of callbacks on the root. It will be called once
    // the root completes at the corresponding expiration time.
    const update = {
      priorityLevel: null,
      expirationTime,
      partialState: null,
      callback,
      isReplace: false,
      isForced: false,
      isTopLevelUnmount: false,
      next: null,
    };
    const currentTime = recalculateCurrentTime();
    if (root.completionCallbacks === null) {
      root.completionCallbacks = createUpdateQueue();
    }
    insertUpdateIntoQueue(root.completionCallbacks, update, currentTime);
    scheduleUpdate(root.current, expirationTime);
  };

  return {
    createContainer(containerInfo: C): OpaqueRoot {
      return createFiberRoot(containerInfo);
    },

    updateRoot(
      element: ReactNodeList,
      container: OpaqueRoot,
      parentComponent: ?React$Component<any, any>,
    ): Work {
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

      const currentTime = recalculateCurrentTime();
      const expirationTime = scheduleTopLevelUpdate(
        container,
        element,
        currentTime,
        true,
        null,
      );

      let completionCallbacks = container.completionCallbacks;
      if (completionCallbacks === null) {
        completionCallbacks = createUpdateQueue();
      }

      return new WorkNode(container, expirationTime);
    },

    updateContainer(
      element: ReactNodeList,
      container: OpaqueRoot,
      parentComponent: ?React$Component<any, any>,
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

      const currentTime = recalculateCurrentTime();
      scheduleTopLevelUpdate(container, element, currentTime, false, callback);
    },

    batchedUpdates,

    unbatchedUpdates,

    deferredUpdates,

    flushSync,

    getPublicRootInstance(
      container: OpaqueRoot,
    ): React$Component<any, any> | PI | null {
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
