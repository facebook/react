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
  getHostContext() : CX,

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
    getRootHostContext,
  } = config;

  // Context stack is reused across the subtrees.
  // We use a null sentinel on the fiber stack to separate them.
  let contextFibers : Array<Fiber | null> = [];
  let contextValues : Array<CX | null> = [];
  let contextDepth : number = -1;
  // Current context for fast access.
  let currentContextValue : CX | null = null;
  // Current root instance for fast access.
  let rootInstance : C | null = null;
  // A stack of outer root instances if we're in a portal.
  let portalStack : Array<C | null> = [];
  let portalDepth : number = -1;

  function getRootHostContainer() : C {
    if (rootInstance == null) {
      throw new Error('Expected root container to exist.');
    }
    return rootInstance;
  }

  function pushHostContainer(nextRootInstance : C) {
    const nextRootContext = getRootHostContext(nextRootInstance);
    if (rootInstance == null) {
      // We're entering a root.
      rootInstance = nextRootInstance;
    } else {
      // We're entering a portal.
      // Save the current root to the portal stack.
      portalDepth++;
      portalStack[portalDepth] = rootInstance;
      rootInstance = nextRootInstance;
    }
    // Push the next root or portal context.
    contextDepth++;
    contextFibers[contextDepth] = null;
    contextValues[contextDepth] = nextRootContext;
    currentContextValue = nextRootContext;
  }

  function popHostContainer() {
    if (portalDepth === -1) {
      // We're popping the root.
      rootInstance = null;
      currentContextValue = null;
      contextDepth = -1;
    } else {
      // We're popping a portal.
      // Restore the root instance.
      rootInstance = portalStack[portalDepth];
      portalStack[portalDepth] = null;
      portalDepth--;
      // If we pushed any context while in a portal, we need to roll it back.
      if (contextDepth > -1) {
        contextDepth--;
        if (contextDepth > -1) {
          currentContextValue = contextValues[contextDepth];
        } else {
          currentContextValue = null;
        }
      }
    }
  }

  function getHostContext() : CX {
    if (currentContextValue == null) {
      throw new Error('Expected host context to exist.');
    }
    return currentContextValue;
  }

  function pushHostContext(fiber : Fiber) : void {
    if (currentContextValue == null) {
      throw new Error('Expected root host context to exist.');
    }
    const nextContextValue = getChildHostContext(currentContextValue, fiber.type, rootInstance);
    if (currentContextValue === nextContextValue) {
      return;
    }
    contextDepth++;
    contextFibers[contextDepth] = fiber;
    contextValues[contextDepth] = nextContextValue;
    currentContextValue = nextContextValue;
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
    if (contextDepth > -1) {
      currentContextValue = contextValues[contextDepth];
    } else {
      currentContextValue = null;
    }
  }

  function resetHostContainer() {
    // Reset portal stack pointer because we're starting from the very top.
    portalDepth = -1;
    // Reset current container state.
    rootInstance = null;
    contextDepth = -1;
    currentContextValue = null;
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
