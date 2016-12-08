/**
 * Copyright 2013-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @providesModule ReactFiberHostContext
 * @flow
 */

'use strict';

import type { Fiber } from 'ReactFiber';
import type { HostConfig } from 'ReactFiberReconciler';

export type HostContext<C, CX> = {
  getRootHostContainer() : C,
  getHostContext() : CX | null,

  pushHostContext(fiber : Fiber) : void,
  popHostContext(fiber : Fiber) : void,

  pushHostContainer(container : C) : void,
  popHostContainer() : void,
  resetHostContainer() : void,
};

module.exports = function<T, P, I, TI, C, CX>(
  config : HostConfig<T, P, I, TI, C, CX>
) : HostContext<C, CX> {
  const {
    getChildHostContext,
  } = config;

  type ContainerState = {
    rootInstance : C,
    contextFibers : Array<Fiber | null> | null,
    contextValues : Array<CX | null> | null,
    contextDepth: number
  };

  function createContainerState(rootInstance) {
    return {
      rootInstance,
      contextFibers: null,
      contextValues: null,
      contextDepth: -1,
    };
  }

  // If we meet any portals, we'll go deeper.
  let containerStack : Array<ContainerState> = [];
  let containerDepth : number = -1;

  function getRootHostContainer() : C {
    if (containerDepth === -1) {
      throw new Error('Expected to find a root container.');
    }
    const containerState = containerStack[containerDepth];
    const {rootInstance} = containerState;
    return rootInstance;
  }

  function pushHostContainer(portalHostContainer) {
    containerDepth++;
    if (containerDepth === containerStack.length) {
      containerStack[containerDepth] = createContainerState(portalHostContainer);
    } else {
      const containerState = containerStack[containerDepth];
      containerState.rootInstance = portalHostContainer;
      containerState.contextFibers = null;
      containerState.contextValues = null;
      containerState.contextDepth = -1;
    }
  }

  function popHostContainer() {
    if (containerDepth === -1) {
      throw new Error('Already reached the root.');
    }
    containerDepth--;
  }

  function getHostContext() : CX | null {
    if (containerDepth == null) {
      throw new Error('Expected to find a root container.');
    }
    const containerState = containerStack[containerDepth];
    const {contextDepth, contextValues} = containerState;
    if (contextDepth === -1) {
      return null;
    }
    if (contextValues == null) {
      throw new Error('Expected context values to exist.');
    }
    return contextValues[contextDepth];
  }

  function pushHostContext(fiber : Fiber) : void {
    const parentHostContext = getHostContext();
    const currentHostContext = getChildHostContext(parentHostContext, fiber.type);
    if (parentHostContext === currentHostContext) {
      return;
    }
    const containerState = containerStack[containerDepth];
    let {contextDepth, contextFibers, contextValues} = containerState;
    if (contextFibers == null) {
      contextFibers = [];
      containerState.contextFibers = contextFibers;
    }
    if (contextValues == null) {
      contextValues = [];
      containerState.contextValues = contextValues;
    }
    contextDepth++;
    containerState.contextDepth = contextDepth;
    contextFibers[contextDepth] = fiber;
    contextValues[contextDepth] = currentHostContext;
  }

  function popHostContext(fiber : Fiber) : void {
    const containerState = containerStack[containerDepth];
    let {contextDepth} = containerState;
    if (contextDepth === -1) {
      return;
    }
    const {contextFibers, contextValues} = containerState;
    if (contextFibers == null || contextValues == null) {
      throw new Error('Expected host context stacks to exist when index is more than -1.');
    }
    if (fiber !== contextFibers[contextDepth]) {
      return;
    }
    contextFibers[contextDepth] = null;
    contextValues[contextDepth] = null;
    contextDepth--;
    containerState.contextDepth = contextDepth;
  }

  function resetHostContainer() {
    containerDepth = -1;
  }

  return {
    getRootHostContainer,
    getHostContext,

    pushHostContext,
    popHostContext,

    pushHostContainer,
    popHostContainer,
    resetHostContainer,
  };
};
