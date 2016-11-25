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

export type HostContext<I, C> = {
  getHostParentOnStack() : I | null,
  pushHostParent(instance : I) : void,
  popHostParent() : void,

  getHostContainerOnStack() : I | C | null,
  getRootHostContainerOnStack() : C | null,
  pushHostContainer(instance : I | C) : void,
  popHostContainer() : void,

  resetHostStacks() : void,
};

module.exports = function<I, C>() : HostContext<I, C> {
  // Host instances currently on the stack that have not yet been committed.
  const parentStack : Array<I | null> = [];
  let parentIndex = -1;

  // Container instances currently on the stack (e.g. DOM uses this for SVG).
  const containerStack : Array<C | I | null> = [];
  let containerIndex = -1;

  // TODO: this is all likely broken with portals.

  function getHostParentOnStack() : I | null {
    if (parentIndex === -1) {
      return null;
    }
    return parentStack[parentIndex];
  }

  function pushHostParent(instance : I) : void {
    parentIndex++;
    parentStack[parentIndex] = instance;
  }

  function popHostParent() : void {
    parentStack[parentIndex] = null;
    parentIndex--;
  }

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

  function resetHostStacks() : void {
    parentIndex = -1;
    containerIndex = -1;
  }

  return {
    getHostParentOnStack,
    pushHostParent,
    popHostParent,

    getHostContainerOnStack,
    getRootHostContainerOnStack,
    pushHostContainer,
    popHostContainer,

    resetHostStacks,
  };
};
