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

export type HostContext<I, C> = {
  getHostContainerOnStack() : I | C | null,
  getRootHostContainerOnStack() : C | null,
  pushHostContainer(instance : I | C) : void,
  popHostContainer() : void,

  resetHostContext() : void,
  saveHostContextToPortal(portal : Fiber): void,
  restoreHostContextFromPortal(portal : Fiber): void,
};

module.exports = function<I, C>() : HostContext<I, C> {
  // Container instances currently on the stack (e.g. DOM uses this for SVG).
  let containerStack : Array<C | I | null> = [];
  let containerIndex = -1;

  function getHostContainerOnStack() : I | C | null {
    if (containerIndex === -1) {
      return null;
    }
    return containerStack[containerIndex];
  }

  function getRootHostContainerOnStack() : C | null {
    if (containerIndex === -1) {
      return null;
    }
    return containerStack[0];
  }

  function pushHostContainer(instance : I | C) : void {
    containerIndex++;
    containerStack[containerIndex] = instance;
  }

  function popHostContainer() : void {
    containerStack[containerIndex] = null;
    containerIndex--;
  }

  function resetHostContext() : void {
    containerIndex = -1;
  }

  function saveHostContextToPortal(portal : Fiber) {
    const stateNode = portal.stateNode;
    // We don't throw if it already exists here because it might exist
    // if something inside threw, and we started from the top.
    // TODO: add tests for error boundaries inside portals when both are stable.
    stateNode.savedHostContext = {
      containerStack,
      containerIndex,
    };
    containerStack = [];
    containerIndex = -1;
    pushHostContainer(stateNode.containerInfo);
  }

  function restoreHostContextFromPortal(portal : Fiber) {
    const stateNode = portal.stateNode;
    const savedHostContext = stateNode.savedHostContext;
    stateNode.savedHostContext = null;
    if (savedHostContext == null) {
      throw new Error('A portal has no host context saved on it.');
    }
    containerStack = savedHostContext.containerStack;
    containerIndex = savedHostContext.containerIndex;
  }

  return {
    getHostContainerOnStack,
    getRootHostContainerOnStack,
    pushHostContainer,
    popHostContainer,

    resetHostContext,
    saveHostContextToPortal,
    restoreHostContextFromPortal,
  };
};
