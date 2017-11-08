/**
 * Copyright (c) 2013-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import type {Fiber} from './ReactFiber';
import type {FiberRoot} from './ReactFiberRoot';
import type {ReactNodeList} from 'shared/ReactTypes';

import {enableAsyncSubtreeAPI} from 'shared/ReactFeatureFlags';
import {
  findCurrentHostFiber,
  findCurrentHostFiberWithNoPortals,
} from 'shared/ReactFiberTreeReflection';
import * as ReactInstanceMap from 'shared/ReactInstanceMap';
import {HostComponent} from 'shared/ReactTypeOfWork';
import emptyObject from 'fbjs/lib/emptyObject';
import getComponentName from 'shared/getComponentName';
import warning from 'fbjs/lib/warning';

import {
  findCurrentUnmaskedContext,
  isContextProvider,
  processChildContext,
} from './ReactFiberContext';
import {createFiberRoot} from './ReactFiberRoot';
import * as ReactFiberDevToolsHook from './ReactFiberDevToolsHook';
import ReactFiberScheduler from './ReactFiberScheduler';
import {insertUpdateIntoFiber} from './ReactFiberUpdateQueue';
import ReactFiberInstrumentation from './ReactFiberInstrumentation';
import ReactDebugCurrentFiber from './ReactDebugCurrentFiber';

if (__DEV__) {
  var didWarnAboutNestedUpdates = false;
}

export type Deadline = {
  timeRemaining: () => number,
};

type OpaqueHandle = Fiber;
type OpaqueRoot = FiberRoot;

export type HostConfig<T, P, I, TI, HI, PI, C, CC, CX, PL> = {
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

  shouldSetTextContent(type: T, props: P): boolean,
  shouldDeprioritizeSubtree(type: T, props: P): boolean,

  createTextInstance(
    text: string,
    rootContainerInstance: C,
    hostContext: CX,
    internalInstanceHandle: OpaqueHandle,
  ): TI,

  scheduleDeferredCallback(
    callback: (deadline: Deadline) => void,
  ): number | void,

  prepareForCommit(): void,
  resetAfterCommit(): void,

  now(): number,

  useSyncScheduling?: boolean,

  +hydration?: HydrationHostConfig<T, P, I, TI, HI, C, CX, PL>,

  +mutation?: MutableUpdatesHostConfig<T, P, I, TI, C, PL>,
  +persistence?: PersistentUpdatesHostConfig<T, P, I, TI, C, CC, PL>,
};

type MutableUpdatesHostConfig<T, P, I, TI, C, PL> = {
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
  commitTextUpdate(textInstance: TI, oldText: string, newText: string): void,
  resetTextContent(instance: I): void,
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
};

type PersistentUpdatesHostConfig<T, P, I, TI, C, CC, PL> = {
  cloneInstance(
    instance: I,
    updatePayload: null | PL,
    type: T,
    oldProps: P,
    newProps: P,
    internalInstanceHandle: OpaqueHandle,
    keepChildren: boolean,
    recyclableInstance: I,
  ): I,

  createContainerChildSet(container: C): CC,

  appendChildToContainerChildSet(childSet: CC, child: I | TI): void,
  finalizeContainerChildren(container: C, newChildren: CC): void,

  replaceContainerChildren(container: C, newChildren: CC): void,
};

type HydrationHostConfig<T, P, I, TI, HI, C, CX, PL> = {
  // Optional hydration
  canHydrateInstance(instance: HI, type: T, props: P): null | I,
  canHydrateTextInstance(instance: HI, text: string): null | TI,
  getNextHydratableSibling(instance: I | TI | HI): null | HI,
  getFirstHydratableChild(parentInstance: I | C): null | HI,
  hydrateInstance(
    instance: I,
    type: T,
    props: P,
    rootContainerInstance: C,
    hostContext: CX,
    internalInstanceHandle: OpaqueHandle,
  ): null | PL,
  hydrateTextInstance(
    textInstance: TI,
    text: string,
    internalInstanceHandle: OpaqueHandle,
  ): boolean,
  didNotMatchHydratedContainerTextInstance(
    parentContainer: C,
    textInstance: TI,
    text: string,
  ): void,
  didNotMatchHydratedTextInstance(
    parentType: T,
    parentProps: P,
    parentInstance: I,
    textInstance: TI,
    text: string,
  ): void,
  didNotHydrateContainerInstance(parentContainer: C, instance: I | TI): void,
  didNotHydrateInstance(
    parentType: T,
    parentProps: P,
    parentInstance: I,
    instance: I | TI,
  ): void,
  didNotFindHydratableContainerInstance(
    parentContainer: C,
    type: T,
    props: P,
  ): void,
  didNotFindHydratableContainerTextInstance(
    parentContainer: C,
    text: string,
  ): void,
  didNotFindHydratableInstance(
    parentType: T,
    parentProps: P,
    parentInstance: I,
    type: T,
    props: P,
  ): void,
  didNotFindHydratableTextInstance(
    parentType: T,
    parentProps: P,
    parentInstance: I,
    text: string,
  ): void,
};

// 0 is PROD, 1 is DEV.
// Might add PROFILE later.
type BundleType = 0 | 1;

type DevToolsConfig<I, TI> = {|
  bundleType: BundleType,
  version: string,
  rendererPackageName: string,
  // Note: this actually *does* depend on Fiber internal fields.
  // Used by "inspect clicked DOM element" in React DevTools.
  findFiberByHostInstance?: (instance: I | TI) => Fiber,
  // Used by RN in-app inspector.
  // This API is unfortunately RN-specific.
  // TODO: Change it to accept Fiber instead and type it properly.
  getInspectorDataForViewTag?: (tag: number) => Object,
|};

export type Reconciler<C, I, TI> = {
  createContainer(containerInfo: C, hydrate: boolean): OpaqueRoot,
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
  injectIntoDevTools(devToolsConfig: DevToolsConfig<I, TI>): boolean,

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

export default function<T, P, I, TI, HI, PI, C, CC, CX, PL>(
  config: HostConfig<T, P, I, TI, HI, PI, C, CC, CX, PL>,
): Reconciler<C, I, TI> {
  var {getPublicInstance} = config;

  var {
    computeAsyncExpiration,
    computeExpirationForFiber,
    scheduleWork,
    batchedUpdates,
    unbatchedUpdates,
    flushSync,
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

    callback = callback === undefined ? null : callback;
    if (__DEV__) {
      warning(
        callback === null || typeof callback === 'function',
        'render(...): Expected the last optional `callback` argument to be a ' +
          'function. Instead received: %s.',
        callback,
      );
    }

    let expirationTime;
    // Check if the top-level element is an async wrapper component. If so,
    // treat updates to the root as async. This is a bit weird but lets us
    // avoid a separate `renderAsync` API.
    if (
      enableAsyncSubtreeAPI &&
      element != null &&
      (element: any).type != null &&
      (element: any).type.prototype != null &&
      (element: any).type.prototype.unstable_isAsyncReactComponent === true
    ) {
      expirationTime = computeAsyncExpiration();
    } else {
      expirationTime = computeExpirationForFiber(current);
    }

    const update = {
      expirationTime,
      partialState: {element},
      callback,
      isReplace: false,
      isForced: false,
      nextCallback: null,
      next: null,
    };
    insertUpdateIntoFiber(current, update);
    scheduleWork(current, expirationTime);
  }

  function findHostInstance(fiber: Fiber): PI | null {
    const hostFiber = findCurrentHostFiber(fiber);
    if (hostFiber === null) {
      return null;
    }
    return hostFiber.stateNode;
  }

  return {
    createContainer(containerInfo: C, hydrate: boolean): OpaqueRoot {
      return createFiberRoot(containerInfo, hydrate);
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

      scheduleTopLevelUpdate(current, element, callback);
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

    findHostInstance,

    findHostInstanceWithNoPortals(fiber: Fiber): PI | null {
      const hostFiber = findCurrentHostFiberWithNoPortals(fiber);
      if (hostFiber === null) {
        return null;
      }
      return hostFiber.stateNode;
    },

    injectIntoDevTools(devToolsConfig: DevToolsConfig<I, TI>): boolean {
      const {findFiberByHostInstance} = devToolsConfig;
      return ReactFiberDevToolsHook.injectInternals({
        ...devToolsConfig,
        findHostInstanceByFiber(fiber: Fiber): I | TI | null {
          return findHostInstance(fiber);
        },
        findFiberByHostInstance(instance: I | TI): Fiber | null {
          if (!findFiberByHostInstance) {
            // Might not be implemented by the renderer.
            return null;
          }
          return findFiberByHostInstance(instance);
        },
      });
    },
  };
}
