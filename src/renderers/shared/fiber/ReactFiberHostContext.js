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

  // Current container context on the stack.
  let rootInstance : C | null = null;
  let contextFibers : Array<Fiber | null> | null = null;
  let contextValues : Array<CX | null> | null = null;
  let contextDepth : number = -1;

  // If we meet any portals, we'll pack outer context in this array.
  let portalStack : Array<ContainerState> = [];
  let portalDepth : number = -1;

  function getRootHostContainer() : C {
    if (rootInstance == null) {
      throw new Error('Expected root container to exist.');
    }
    return rootInstance;
  }

  function pushPortal(portalRootInstance : C) {
    if (rootInstance == null) {
      throw new Error('Cannot push a portal when there is no root.');
    }
    // Only create a new item on the portal stack if necessary.
    if (portalDepth === portalStack.length) {
      portalStack[portalDepth] = {
        rootInstance,
        contextFibers,
        contextValues,
        contextDepth,
      };
    } else {
      // Write over the existing state since it's from the previous traversal.
      const stateOutsidePortal = portalStack[portalDepth];
      stateOutsidePortal.rootInstance = rootInstance;
      stateOutsidePortal.contextFibers = contextFibers;
      stateOutsidePortal.contextValues = contextValues;
      stateOutsidePortal.contextDepth = contextDepth;
    }
    // The local variables reflect the inner container now.
    rootInstance = portalRootInstance;
    contextFibers = null;
    contextValues = null;
    contextDepth = -1;
  }

  function pushHostContainer(nextRootInstance : C) {
    const isEnteringPortal = portalDepth > -1;
    if (isEnteringPortal) {
      pushPortal(nextRootInstance);
    } else {
      // Don't reset arrays because we reuse them.
      rootInstance = nextRootInstance;
      contextDepth = -1;
    }
    portalDepth++;
  }

  function popPortal() {
    // The local variables reflect the outer container now.
    const stateOutsidePortal = portalStack[portalDepth];
    rootInstance = stateOutsidePortal.rootInstance;
    contextFibers = stateOutsidePortal.contextFibers;
    contextValues = stateOutsidePortal.contextValues;
    contextDepth = stateOutsidePortal.contextDepth;
  }

  function popHostContainer() {
    if (portalDepth === -1) {
      throw new Error('Already reached the root.');
    }
    portalDepth--;

    const isLeavingPortal = portalDepth > -1;
    if (isLeavingPortal) {
      popPortal();
    } else {
      // Reset current container state.
      // Don't reset arrays because we reuse them.
      rootInstance = null;
      contextDepth = -1;
    }
  }

  function getHostContext() : CX | null {
    if (portalDepth === -1) {
      throw new Error('Expected to find a root container.');
    }
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
    if (contextFibers == null) {
      contextFibers = [];
    }
    if (contextValues == null) {
      contextValues = [];
    }
    contextDepth++;
    contextFibers[contextDepth] = fiber;
    contextValues[contextDepth] = currentHostContext;
  }

  function popHostContext(fiber : Fiber) : void {
    if (contextDepth === -1) {
      return;
    }
    if (contextFibers == null || contextValues == null) {
      throw new Error('Expected host context stacks to exist when index is more than -1.');
    }
    if (fiber !== contextFibers[contextDepth]) {
      return;
    }
    contextFibers[contextDepth] = null;
    contextValues[contextDepth] = null;
    contextDepth--;
  }

  function resetHostContainer() {
    // Reset portal stack pointer because we're starting from the very top.
    portalDepth = -1;
    // Reset current container state.
    // Don't reset arrays because we reuse them.
    rootInstance = null;
    contextDepth = -1;
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
