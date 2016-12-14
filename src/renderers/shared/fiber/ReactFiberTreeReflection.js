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
  HostRoot,
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
  if (node.tag === HostRoot) {
    // TODO: Check if this was a nested HostRoot when used with
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

function assertIsMounted(fiber) {
  invariant(
    isFiberMountedImpl(fiber) === MOUNTED,
    'Unable to find node on an unmounted component.'
  );
}

function findCurrentFiberUsingSlowPath(fiber : Fiber) : Fiber | null {
  let alternate = fiber.alternate;
  if (!alternate) {
    // If there is no alternate, then we only need to check if it is mounted.
    const state = isFiberMountedImpl(fiber);
    invariant(
      state !== UNMOUNTED,
      'Unable to find node on an unmounted component.'
    );
    if (state === MOUNTING) {
      return null;
    }
    return fiber;
  }
  // If we have two possible branches, we'll walk backwards up to the root
  // to see what path the root points to. On the way we may hit one of the
  // special cases and we'll deal with them.
  let a = fiber;
  let b = alternate;
  while (true) {
    let parentA = a.return;
    let parentB = b.return;
    if (!parentA || !parentB) {
      // We're at the root.
      break;
    }
    if (parentA.child === parentB.child) {
      // If both parents are the same, then that is the current parent. If
      // they're different but point to the same child, then it doesn't matter.
      // Regardless, whatever child they point to is the current child.
      // So we can now determine which child is current by scanning the child
      // list for either A or B.
      let child = parentA.child;
      while (child) {
        if (child === a) {
          // We've determined that A is the current branch.
          assertIsMounted(parentA);
          return fiber;
        }
        if (child === b) {
          // We've determined that B is the current branch.
          assertIsMounted(parentA);
          return alternate;
        }
        child = child.sibling;
      }
      // We should never have an alternate for any mounting node. So the only
      // way this could possibly happen is if this was unmounted, if at all.
      invariant(
        false,
        'Unable to find node on an unmounted component.'
      );
    }
    a = parentA;
    b = parentB;
    invariant(
      a.alternate === b,
      'Return fibers should always be each others\' alternates.'
    );
  }
  // If the root is not a host container, we're in a disconnected tree. I.e.
  // unmounted.
  invariant(
    a.tag === HostRoot,
    'Unable to find node on an unmounted component.'
  );
  if (a.stateNode.current === a) {
    // We've determined that A is the current branch.
    return fiber;
  }
  // Otherwise B has to be current branch.
  return alternate;
}
exports.findCurrentFiberUsingSlowPath = findCurrentFiberUsingSlowPath;

exports.findCurrentHostFiber = function(parent : Fiber) : Fiber | null {
  const currentParent = findCurrentFiberUsingSlowPath(parent);
  if (!currentParent) {
    return null;
  }

  // Next we'll drill down this component to find the first HostComponent/Text.
  let node : Fiber = currentParent;
  while (true) {
    if (node.tag === HostComponent || node.tag === HostText) {
      return node;
    } else if (node.child) {
      // TODO: If we hit a Portal, we're supposed to skip it.
      // TODO: Coroutines need to visit the stateNode.
      node.child.return = node;
      node = node.child;
      continue;
    }
    if (node === currentParent) {
      return null;
    }
    while (!node.sibling) {
      if (!node.return || node.return === currentParent) {
        return null;
      }
      node = node.return;
    }
    node.sibling.return = node.return;
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
