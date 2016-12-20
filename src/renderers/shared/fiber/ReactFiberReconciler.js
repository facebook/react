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
import type { PriorityLevel } from 'ReactPriorityLevel';
import type { ReactNodeList } from 'ReactTypes';

var {
  findCurrentUnmaskedContext,
  isContextProvider,
  processChildContext,
} = require('ReactFiberContext');
var { createFiberRoot } = require('ReactFiberRoot');
var ReactFiberScheduler = require('ReactFiberScheduler');

if (__DEV__) {
  var ReactFiberInstrumentation = require('ReactFiberInstrumentation');
}

var { findCurrentHostFiber } = require('ReactFiberTreeReflection');

var getContextForSubtree = require('getContextForSubtree');

export type Deadline = {
  timeRemaining : () => number
};

type OpaqueNode = Fiber;

export type HostConfig<T, P, I, TI, C, CX> = {

  getRootHostContext(rootContainerInstance : C) : CX,
  getChildHostContext(parentHostContext : CX, type : T) : CX,

  createInstance(type : T, props : P, rootContainerInstance : C, hostContext : CX, internalInstanceHandle : OpaqueNode) : I,
  appendInitialChild(parentInstance : I, child : I | TI) : void,
  finalizeInitialChildren(parentInstance : I, type : T, props : P, rootContainerInstance : C) : void,

  prepareUpdate(instance : I, type : T, oldProps : P, newProps : P, hostContext : CX) : boolean,
  commitUpdate(instance : I, type : T, oldProps : P, newProps : P, rootContainerInstance : C, internalInstanceHandle : OpaqueNode) : void,

  shouldSetTextContent(props : P) : boolean,
  resetTextContent(instance : I) : void,

  createTextInstance(text : string, rootContainerInstance : C, hostContext : CX, internalInstanceHandle : OpaqueNode) : TI,
  commitTextUpdate(textInstance : TI, oldText : string, newText : string) : void,

  appendChild(parentInstance : I | C, child : I | TI) : void,
  insertBefore(parentInstance : I | C, child : I | TI, beforeChild : I | TI) : void,
  removeChild(parentInstance : I | C, child : I | TI) : void,

  scheduleAnimationCallback(callback : () => void) : void,
  scheduleDeferredCallback(callback : (deadline : Deadline) => void) : void,

  prepareForCommit() : void,
  resetAfterCommit() : void,

  useSyncScheduling ?: boolean,
};

export type Reconciler<C, I, TI> = {
  mountContainer(element : ReactNodeList, containerInfo : C, parentComponent : ?ReactComponent<any, any, any>) : OpaqueNode,
  updateContainer(element : ReactNodeList, container : OpaqueNode, parentComponent : ?ReactComponent<any, any, any>) : void,
  performWithPriority(priorityLevel : PriorityLevel, fn : Function) : void,
  /* eslint-disable no-undef */
  // FIXME: ESLint complains about type parameter
  batchedUpdates<A>(fn : () => A) : A,
  syncUpdates<A>(fn : () => A) : A,
  deferredUpdates<A>(fn : () => A) : A,
  /* eslint-enable no-undef */

  // Used to extract the return value from the initial render. Legacy API.
  getPublicRootInstance(container : OpaqueNode) : (ReactComponent<any, any, any> | TI | I | null),

  // Use for findDOMNode/findHostNode. Legacy API.
  findHostInstance(component : Fiber) : I | TI | null,
};

getContextForSubtree._injectFiber(function(fiber : Fiber) {
  const parentContext = findCurrentUnmaskedContext(fiber);
  return isContextProvider(fiber) ?
    processChildContext(fiber, parentContext, false) :
    parentContext;
});

module.exports = function<T, P, I, TI, C, CX>(config : HostConfig<T, P, I, TI, C, CX>) : Reconciler<C, I, TI> {

  var {
    scheduleTopLevelSetState,
    scheduleUpdateCallback,
    performWithPriority,
    batchedUpdates,
    syncUpdates,
    deferredUpdates,
  } = ReactFiberScheduler(config);

  return {

    mountContainer(element : ReactNodeList, containerInfo : C, parentComponent : ?ReactComponent<any, any, any>, callback: ?Function) : OpaqueNode {
      const context = getContextForSubtree(parentComponent);
      const root = createFiberRoot(containerInfo, context);
      const current = root.current;

      scheduleTopLevelSetState(current, { element });
      if (callback) {
        scheduleUpdateCallback(current, callback);
      }

      if (__DEV__ && ReactFiberInstrumentation.debugTool) {
        ReactFiberInstrumentation.debugTool.onMountContainer(root);
      }

      // It may seem strange that we don't return the root here, but that will
      // allow us to have containers that are in the middle of the tree instead
      // of being roots.
      return current;
    },

    updateContainer(element : ReactNodeList, container : OpaqueNode, parentComponent : ?ReactComponent<any, any, any>, callback: ?Function) : void {
      // TODO: If this is a nested container, this won't be the root.
      const root : FiberRoot = (container.stateNode : any);
      const current = root.current;

      root.pendingContext = getContextForSubtree(parentComponent);

      scheduleTopLevelSetState(current, { element });
      if (callback) {
        scheduleUpdateCallback(current, callback);
      }

      if (__DEV__) {
        if (ReactFiberInstrumentation.debugTool) {
          if (element === null) {
            ReactFiberInstrumentation.debugTool.onUnmountContainer(root);
          } else {
            ReactFiberInstrumentation.debugTool.onUpdateContainer(root);
          }
        }
      }
    },

    performWithPriority,

    batchedUpdates,

    syncUpdates,

    deferredUpdates,

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
