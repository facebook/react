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
  setRootHostContainer(container : C) : void,

  getHostContext() : CX | null,
  maybePushHostContext(fiber : Fiber) : void,
  maybePopHostContext(fiber : Fiber) : void,

  resetHostContext() : void,
  saveHostContextToPortal(portal : Fiber): void,
  restoreHostContextFromPortal(portal : Fiber): void,
};

module.exports = function<T, P, I, TI, C, CX>(
  config : HostConfig<T, P, I, TI, C, CX>
) : HostContext<C, CX> {
  const {
    getChildHostContext,
  } = config;

  let rootHostContainer : C | null = null;
  let hostContextFiberStack : Array<Fiber | null> | null = null;
  let hostContextValueStack : Array<CX | null> | null = null;
  let hostContextIndex = -1;

  function getRootHostContainer() : C {
    if (rootHostContainer === null) {
      throw new Error('Expected to find a root container instance.');
    }
    return rootHostContainer;
  }

  function setRootHostContainer(instance : C) : void {
    rootHostContainer = instance;
  }

  function getHostContext() : CX | null {
    if (hostContextIndex === -1) {
      return null;
    }
    if (hostContextValueStack == null) {
      throw new Error('Expected host context stacks to exist when index is more than -1.');
    }
    return hostContextValueStack[hostContextIndex];
  }

  function maybePushHostContext(fiber : Fiber) : void {
    const parentHostContext = getHostContext();
    const currentHostContext = getChildHostContext(parentHostContext, fiber.type);
    if (parentHostContext === currentHostContext) {
      return;
    }
    hostContextIndex++;
    hostContextFiberStack = hostContextFiberStack || [];
    hostContextFiberStack[hostContextIndex] = fiber;
    hostContextValueStack = hostContextValueStack || [];
    hostContextValueStack[hostContextIndex] = currentHostContext;
  }

  function maybePopHostContext(fiber : Fiber) : void {
    if (hostContextIndex === -1) {
      return;
    }
    if (hostContextFiberStack == null || hostContextValueStack == null) {
      throw new Error('Expected host context stacks to exist when index is more than -1.');
    }
    if (fiber !== hostContextFiberStack[hostContextIndex]) {
      return;
    }
    hostContextFiberStack[hostContextIndex] = null;
    hostContextValueStack[hostContextIndex] = null;
    hostContextIndex--;
  }

  function resetHostContext() {
    rootHostContainer = null;
    hostContextIndex = -1;
  }

  function saveHostContextToPortal(portal : Fiber) {
    // TODO: add tests for error boundaries inside portals when both are stable.
    const stateNode = portal.stateNode;
    if (!stateNode.savedHostContext) {
      // We assume host context never changes between passes so store it once lazily.
      stateNode.savedHostContext = {
        rootHostContainer,
        hostContextFiberStack,
        hostContextValueStack,
        hostContextIndex,
      };
    }
    rootHostContainer = stateNode.containerInfo;
    hostContextFiberStack = null;
    hostContextValueStack = null;
    hostContextIndex = -1;
  }

  function restoreHostContextFromPortal(portal : Fiber) {
    const stateNode = portal.stateNode;
    const savedHostContext = stateNode.savedHostContext;
    if (savedHostContext == null) {
      throw new Error('A portal has no host context saved on it.');
    }
    rootHostContainer = savedHostContext.rootHostContainer;
    hostContextFiberStack = savedHostContext.hostContextFiberStack;
    hostContextValueStack = savedHostContext.hostContextValueStack;
    hostContextIndex = savedHostContext.hostContextIndex;
  }

  return {
    getRootHostContainer,
    setRootHostContainer,

    maybePushHostContext,
    maybePopHostContext,
    getHostContext,

    resetHostContext,
    saveHostContextToPortal,
    restoreHostContextFromPortal,
  };
};
