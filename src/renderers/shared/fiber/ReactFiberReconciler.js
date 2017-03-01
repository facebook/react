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
  addTopLevelUpdate,
} = require('ReactFiberUpdateQueue');

var {
  findCurrentUnmaskedContext,
  isContextProvider,
  processChildContext,
} = require('ReactFiberContext');
var { createFiberRoot } = require('ReactFiberRoot');
var ReactFiberScheduler = require('ReactFiberScheduler');

if (__DEV__) {
  var warning = require('fbjs/lib/warning');
  var ReactFiberInstrumentation = require('ReactFiberInstrumentation');
  var ReactDebugCurrentFiber = require('ReactDebugCurrentFiber');
  var { getComponentName } = require('ReactFiberTreeReflection');
}

var { findCurrentHostFiber } = require('ReactFiberTreeReflection');

var getContextForSubtree = require('getContextForSubtree');

export type Deadline = {
  timeRemaining : () => number
};

type OpaqueHandle = Fiber;
type OpaqueRoot = FiberRoot;

export type HostConfig<T, P, I, TI, PI, C, CX, PL> = {

  getRootHostContext(rootContainerInstance : C) : CX,
  getChildHostContext(parentHostContext : CX, type : T) : CX,
  getPublicInstance(instance : I | TI) : PI,

  createInstance(
    type : T,
    props : P,
    rootContainerInstance : C,
    hostContext : CX,
    internalInstanceHandle : OpaqueHandle
  ) : I,
  appendInitialChild(parentInstance : I, child : I | TI) : void,
  finalizeInitialChildren(parentInstance : I, type : T, props : P, rootContainerInstance : C) : boolean,

  prepareUpdate(
    instance : I,
    type : T,
    oldProps : P,
    newProps : P,
    rootContainerInstance : C,
    hostContext : CX
  ) : null | PL,
  commitUpdate(
    instance : I,
    updatePayload : PL,
    type : T,
    oldProps : P,
    newProps : P,
    internalInstanceHandle : OpaqueHandle
  ) : void,
  commitMount(instance : I, type : T, newProps : P, internalInstanceHandle : OpaqueHandle) : void,

  shouldSetTextContent(props : P) : boolean,
  resetTextContent(instance : I) : void,

  createTextInstance(
    text : string,
    rootContainerInstance : C,
    hostContext : CX,
    internalInstanceHandle : OpaqueHandle
  ) : TI,
  commitTextUpdate(textInstance : TI, oldText : string, newText : string) : void,

  appendChild(parentInstance : I | C, child : I | TI) : void,
  insertBefore(parentInstance : I | C, child : I | TI, beforeChild : I | TI) : void,
  removeChild(parentInstance : I | C, child : I | TI) : void,

  scheduleAnimationCallback(callback : () => void) : number | void,
  scheduleDeferredCallback(callback : (deadline : Deadline) => void) : number | void,

  prepareForCommit() : void,
  resetAfterCommit() : void,

  useSyncScheduling ?: boolean,
};

export type Reconciler<C, I, TI> = {
  createContainer(containerInfo : C) : OpaqueRoot,
  updateContainer(
    element : ReactNodeList,
    container : OpaqueRoot,
    parentComponent : ?ReactComponent<any, any, any>
  ) : void,
  performWithPriority(priorityLevel : PriorityLevel, fn : Function) : void,
  batchedUpdates<A>(fn : () => A) : A,
  unbatchedUpdates<A>(fn : () => A) : A,
  syncUpdates<A>(fn : () => A) : A,
  deferredUpdates<A>(fn : () => A) : A,

  // Used to extract the return value from the initial render. Legacy API.
  getPublicRootInstance(container : OpaqueRoot) : (ReactComponent<any, any, any> | TI | I | null),

  // Use for findDOMNode/findHostNode. Legacy API.
  findHostInstance(component : Fiber) : I | TI | null,
};

getContextForSubtree._injectFiber(function(fiber : Fiber) {
  const parentContext = findCurrentUnmaskedContext(fiber);
  return isContextProvider(fiber) ?
    processChildContext(fiber, parentContext, false) :
    parentContext;
});

module.exports = function<T, P, I, TI, PI, C, CX, PL>(
  config : HostConfig<T, P, I, TI, PI, C, CX, PL>
) : Reconciler<C, I, TI> {
  var {
    scheduleUpdate,
    getPriorityContext,
    performWithPriority,
    batchedUpdates,
    unbatchedUpdates,
    syncUpdates,
    deferredUpdates,
  } = ReactFiberScheduler(config);

  function scheduleTopLevelUpdate(current : Fiber, element : ReactNodeList, callback : ?Function) {
    if (__DEV__) {
      if (ReactDebugCurrentFiber.current !== null) {
        warning(
          ReactDebugCurrentFiber.phase !== 'render',
          'Render methods should be a pure function of props and state; ' +
          'triggering nested component updates from render is not allowed. ' +
          'If necessary, trigger nested updates in componentDidUpdate.\n\n' +
          'Check the render method of %s.',
          getComponentName(ReactDebugCurrentFiber.current)
        );
      }
    }

    const priorityLevel = getPriorityContext();
    const nextState = { element };
    callback = callback === undefined ? null : callback;
    if (__DEV__) {
      warning(
        callback === null || typeof callback === 'function',
        'render(...): Expected the last optional `callback` argument to be a ' +
        'function. Instead received: %s.',
        String(callback)
      );
    }
    addTopLevelUpdate(current, nextState, callback, priorityLevel);
    scheduleUpdate(current, priorityLevel);
  }

  return {

    createContainer(containerInfo : C) : OpaqueRoot {
      return createFiberRoot(containerInfo);
    },

    updateContainer(
      element : ReactNodeList,
      container : OpaqueRoot,
      parentComponent : ?ReactComponent<any, any, any>,
      callback: ?Function
    ) : void {
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

    getPublicRootInstance(container : OpaqueRoot) : (ReactComponent<any, any, any> | I | TI | null) {
      const containerFiber = container.current;
      if (!containerFiber.child) {
        return null;
      }
      return containerFiber.child.stateNode;
    },

    findHostInstance(fiber : Fiber) : I | TI | null {
      const hostFiber = findCurrentHostFiber(fiber);
      if (hostFiber === null) {
        return null;
      }
      return hostFiber.stateNode;
    },

  };

};
