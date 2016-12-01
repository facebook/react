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

var invariant = require('invariant');

var {
  HostContainer,
  HostComponent,
  HostText,
} = require('ReactTypeOfWork');

var {
  NoEffect,
  Placement,
} = require('ReactTypeOfSideEffect');

var MOUNTING = 1;
var MOUNTED = 2;
var UNMOUNTED = 3;

function isFiberMountedImpl(fiber : Fiber) : number {
  let node = fiber;
  if (!fiber.alternate) {
    // If there is no alternate, this might be a new tree that isn't inserted
    // yet. If it is, then it will have a pending insertion effect on it.
    if ((node.effectTag & Placement) !== NoEffect) {
      return MOUNTING;
    }
    while (node.return) {
      node = node.return;
      if ((node.effectTag & Placement) !== NoEffect) {
        return MOUNTING;
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
    return MOUNTED;
  }
  // If we didn't hit the root, that means that we're in an disconnected tree
  // that has been unmounted.
  return UNMOUNTED;
}
exports.isFiberMounted = function(fiber : Fiber) : boolean {
  return isFiberMountedImpl(fiber) === MOUNTED;
};

exports.isMounted = function(component : ReactComponent<any, any, any>) : boolean {
  var fiber : ?Fiber = ReactInstanceMap.get(component);
  if (!fiber) {
    return false;
  }
  return isFiberMountedImpl(fiber) === MOUNTED;
};

exports.findCurrentHostFiber = function(parent : Fiber) : Fiber | null {
  // First check if this node itself is mounted.
  const state = isFiberMountedImpl(parent, true);
  if (state === UNMOUNTED) {
    invariant(
      false,
      'Unable to find node on an unmounted component.'
    );
  } else if (state === MOUNTING) {
    return null;
  }

  let didTryOtherTree = false;

  // If the component doesn't have a child we first check the alternate to see
  // if it has any and if so, if those were just recently inserted.
  if (!parent.child && parent.alternate) {
    parent = parent.alternate;
  }

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
  // Flow needs the return null here, but ESLint complains about it.
  // eslint-disable-next-line no-unreachable
  return null;
};

exports.getComponentName = function(fiber: Fiber): string {
  const type = fiber.type;
  const instance = fiber.stateNode;
  const constructor = instance && instance.constructor;
  return (
    type.displayName || (constructor && constructor.displayName) ||
    type.name || (constructor && constructor.name) ||
    'A Component'
  );
};
