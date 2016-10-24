/**
 * Copyright 2013-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @providesModule ReactFiberTreeReflection
 * @flow
 */

'use strict';

import type { Fiber } from 'ReactFiber';

var ReactInstanceMap = require('ReactInstanceMap');

var {
  HostContainer,
  HostComponent,
  HostText,
} = require('ReactTypeOfWork');

var {
  NoEffect,
  Placement,
} = require('ReactTypeOfSideEffect');

function isFiberMounted(fiber : Fiber) : boolean {
  let node = fiber;
  if (!fiber.alternate) {
    // If there is no alternate, this might be a new tree that isn't inserted
    // yet. If it is, then it will have a pending insertion effect on it.
    if ((node.effectTag & Placement) !== NoEffect) {
      return false;
    }
    while (node.return) {
      node = node.return;
      if ((node.effectTag & Placement) !== NoEffect) {
        return false;
      }
    }
  } else {
    while (node.return) {
      node = node.return;
    }
  }
  if (node.tag === HostContainer) {
    // TODO: Check if this was a nested HostContainer when used with
    // renderContainerIntoSubtree.
    return true;
  }
  // If we didn't hit the root, that means that we're in an disconnected tree.
  return false;
}

exports.isMounted = function(component : ReactComponent<any, any, any>) : boolean {
  var fiber : ?Fiber = ReactInstanceMap.get(component);
  if (!fiber) {
    return false;
  }
  return isFiberMounted(fiber);
};

exports.findCurrentHostFiber = function(component : ReactComponent<any, any, any>) : Fiber | null {
  let parent = ReactInstanceMap.get(component);
  if (!parent) {
    return null;
  }

  if (!isFiberMounted(parent)) {
    // First check if this node itself is mounted.
    return null;
  }

  let didTryOtherTree = false;

  // Next we'll drill down this component to find the first HostComponent/Text.
  let node : Fiber = parent;
  while (true) {
    if ((node.effectTag & Placement) !== NoEffect || !node.return) {
      // If any node along the way was deleted, or is an insertion, that means
      // that we're actually in a work in progress to update this component with
      // a different component. We need to look in the "current" fiber instead.
      if (!parent.alternate) {
        return null;
      }
      if (didTryOtherTree) {
        // Safety, to avoid an infinite loop if something goes wrong.
        throw new Error('This should never hit this infinite loop.');
      }
      didTryOtherTree = true;
      node = parent = parent.alternate;
      continue;
    }
    if (node.tag === HostComponent || node.tag === HostText) {
      return node;
    } else if (node.child) {
      // TODO: Coroutines need to visit the stateNode.
      node = node.child;
      continue;
    }
    if (node === parent) {
      return null;
    }
    while (!node.sibling) {
      if (!node.return || node.return === parent) {
        return null;
      }
      node = node.return;
    }
    node = node.sibling;
  }
  return null;
};
