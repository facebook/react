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

var { createFiberRoot } = require('ReactFiberRoot');
var ReactFiberScheduler = require('ReactFiberScheduler');

var {
  LowPriority,
} = require('ReactPriorityLevel');

type ReactHostElement<T, P> = {
  type: T,
  props: P
};

type Deadline = {
  timeRemaining : () => number
};

export type HostConfig<T, P, I> = {

  createHostInstance(element : ReactHostElement<T, P>) : I,
  scheduleHighPriCallback(callback : () => void) : void,
  scheduleLowPriCallback(callback : (deadline : Deadline) => void) : void

};

type OpaqueNode = Fiber;

export type Reconciler = {
  mountContainer(element : ReactElement<any>, containerInfo : ?Object) : OpaqueNode,
  updateContainer(element : ReactElement<any>, container : OpaqueNode) : void,
  unmountContainer(container : OpaqueNode) : void,

  // Used to extract the return value from the initial render. Legacy API.
  getPublicRootInstance(container : OpaqueNode) : ?Object,
};

module.exports = function<T, P, I>(config : HostConfig<T, P, I>) : Reconciler {

  var { scheduleLowPriWork } = ReactFiberScheduler(config);

  return {

    mountContainer(element : ReactElement<any>, containerInfo : ?Object) : OpaqueNode {
      const root = createFiberRoot(containerInfo);
      const container = root.current;
      // TODO: Use pending work/state instead of props.
      container.pendingProps = element;
      container.pendingWorkPriority = LowPriority;

      scheduleLowPriWork(root);

      // It may seem strange that we don't return the root here, but that will
      // allow us to have containers that are in the middle of the tree instead
      // of being roots.
      return container;
    },

    updateContainer(element : ReactElement<any>, container : OpaqueNode) : void {
      // TODO: If this is a nested container, this won't be the root.
      const root : FiberRoot = (container.stateNode : any);
      // TODO: Use pending work/state instead of props.
      root.current.pendingProps = element;
      root.current.pendingWorkPriority = LowPriority;

      scheduleLowPriWork(root);
    },

    unmountContainer(container : OpaqueNode) : void {
      // TODO: If this is a nested container, this won't be the root.
      const root : FiberRoot = (container.stateNode : any);
      // TODO: Use pending work/state instead of props.
      root.current.pendingProps = [];
      root.current.pendingWorkPriority = LowPriority;

      scheduleLowPriWork(root);
    },

    getPublicRootInstance(container : OpaqueNode) : ?Object {
      return null;
    },

  };

};
