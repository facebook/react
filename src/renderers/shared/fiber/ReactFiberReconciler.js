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

import type { Fiber } from 'ReactFiber';
import type { FiberRoot } from 'ReactFiberRoot';
import type { TypeOfWork } from 'ReactTypeOfWork';
import type { PriorityLevel } from 'ReactPriorityLevel';

var {
  findCurrentUnmaskedContext,
  isContextProvider,
  processChildContext,
} = require('ReactFiberContext');
var { createFiberRoot } = require('ReactFiberRoot');
var ReactFiberScheduler = require('ReactFiberScheduler');

var { createUpdateQueue, addCallbackToQueue } = require('ReactFiberUpdateQueue');

if (__DEV__) {
  var ReactFiberInstrumentation = require('ReactFiberInstrumentation');
}

var { findCurrentHostFiber } = require('ReactFiberTreeReflection');

var getContextForSubtree = require('getContextForSubtree');

export type Deadline = {
  timeRemaining : () => number
};

type HostChildNode<I> = { tag: TypeOfWork, output: HostChildren<I>, sibling: any };

export type HostChildren<I> = null | void | I | HostChildNode<I>;

type OpaqueNode = Fiber;

export type HostConfig<T, P, I, TI, C> = {

  // TODO: We don't currently have a quick way to detect that children didn't
  // reorder so we host will always need to check the set. We should make a flag
  // or something so that it can bailout easily.

  updateContainer(containerInfo : C, children : HostChildren<I | TI>) : void,

  createInstance(type : T, props : P, children : HostChildren<I | TI>, internalInstanceHandle : OpaqueNode) : I,
  prepareUpdate(instance : I, oldProps : P, newProps : P) : boolean,
  commitUpdate(instance : I, oldProps : P, newProps : P, internalInstanceHandle : OpaqueNode) : void,

  createTextInstance(text : string, internalInstanceHandle : OpaqueNode) : TI,
  commitTextUpdate(textInstance : TI, oldText : string, newText : string) : void,

  appendChild(parentInstance : I, child : I | TI) : void,
  insertBefore(parentInstance : I, child : I | TI, beforeChild : I | TI) : void,
  removeChild(parentInstance : I, child : I | TI) : void,

  scheduleAnimationCallback(callback : () => void) : void,
  scheduleDeferredCallback(callback : (deadline : Deadline) => void) : void,

  prepareForCommit() : void,
  resetAfterCommit() : void,

  useSyncScheduling ?: boolean,
};

export type Reconciler<C, I, TI> = {
  mountContainer(element : ReactElement<any>, containerInfo : C, parentComponent : ?ReactComponent<any, any, any>) : OpaqueNode,
  updateContainer(element : ReactElement<any>, container : OpaqueNode, parentComponent : ?ReactComponent<any, any, any>) : void,
  unmountContainer(container : OpaqueNode) : void,
  performWithPriority(priorityLevel : PriorityLevel, fn : Function) : void,
  /* eslint-disable no-undef */
  // FIXME: ESLint complains about type parameter
  batchedUpdates<A>(fn : () => A) : A,
  syncUpdates<A>(fn : () => A) : A,
  /* eslint-enable no-undef */

  // Used to extract the return value from the initial render. Legacy API.
  getPublicRootInstance(container : OpaqueNode) : (ReactComponent<any, any, any> | TI | I | null),

  // Use for findDOMNode/findHostNode. Legacy API.
  findHostInstance(component : Fiber) : I | TI | null,
};

getContextForSubtree._injectFiber(function(fiber : Fiber) {
  const parentContext = findCurrentUnmaskedContext(fiber);
  return isContextProvider(fiber) ?
    processChildContext(fiber, parentContext) :
    parentContext;
});

module.exports = function<T, P, I, TI, C>(config : HostConfig<T, P, I, TI, C>) : Reconciler<C, I, TI> {

  var {
    scheduleWork,
    performWithPriority,
    batchedUpdates,
    syncUpdates,
  } = ReactFiberScheduler(config);

  return {

    mountContainer(element : ReactElement<any>, containerInfo : C, parentComponent : ?ReactComponent<any, any, any>, callback: ?Function) : OpaqueNode {
      const context = getContextForSubtree(parentComponent);
      const root = createFiberRoot(containerInfo, context);
      const container = root.current;
      if (callback) {
        const queue = createUpdateQueue(null);
        addCallbackToQueue(queue, callback);
        root.callbackList = queue;
      }
      // TODO: Use pending work/state instead of props.
      // TODO: This should not override the pendingWorkPriority if there is
      // higher priority work in the subtree.
      container.pendingProps = element;

      scheduleWork(root);

      if (__DEV__ && ReactFiberInstrumentation.debugTool) {
        ReactFiberInstrumentation.debugTool.onMountContainer(root);
      }

      // It may seem strange that we don't return the root here, but that will
      // allow us to have containers that are in the middle of the tree instead
      // of being roots.
      return container;
    },

    updateContainer(element : ReactElement<any>, container : OpaqueNode, parentComponent : ?ReactComponent<any, any, any>, callback: ?Function) : void {
      // TODO: If this is a nested container, this won't be the root.
      const root : FiberRoot = (container.stateNode : any);
      if (callback) {
        const queue = root.callbackList ?
          root.callbackList :
          createUpdateQueue(null);
        addCallbackToQueue(queue, callback);
        root.callbackList = queue;
      }
      root.pendingContext = getContextForSubtree(parentComponent);
      // TODO: Use pending work/state instead of props.
      root.current.pendingProps = element;

      scheduleWork(root);

      if (__DEV__ && ReactFiberInstrumentation.debugTool) {
        ReactFiberInstrumentation.debugTool.onUpdateContainer(root);
      }
    },

    unmountContainer(container : OpaqueNode) : void {
      // TODO: If this is a nested container, this won't be the root.
      const root : FiberRoot = (container.stateNode : any);
      // TODO: Use pending work/state instead of props.
      root.current.pendingProps = [];

      scheduleWork(root);

      if (__DEV__ && ReactFiberInstrumentation.debugTool) {
        ReactFiberInstrumentation.debugTool.onUnmountContainer(root);
      }
    },

    performWithPriority,

    batchedUpdates,

    syncUpdates,

    getPublicRootInstance(container : OpaqueNode) : (ReactComponent<any, any, any> | I | TI | null) {
      const root : FiberRoot = (container.stateNode : any);
      const containerFiber = root.current;
      if (!containerFiber.child) {
        return null;
      }
      return containerFiber.child.stateNode;
    },

    findHostInstance(fiber : Fiber) : I | TI | null {
      const hostFiber = findCurrentHostFiber(fiber);
      if (!hostFiber) {
        return null;
      }
      return hostFiber.stateNode;
    },

  };

};
