/**
 * Copyright 2013-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @providesModule ReactFiberHydrationContext
 * @flow
 */

'use strict';

import type {Fiber} from 'ReactFiber';
import type {HostConfig} from 'ReactFiberReconciler';

var invariant = require('fbjs/lib/invariant');

const {HostComponent} = require('ReactTypeOfWork');
const {Deletion, Placement} = require('ReactTypeOfSideEffect');

const {createFiberFromHostInstanceForDeletion} = require('ReactFiber');

export type HydrationContext<I, TI> = {
  enterHydrationState(fiber: Fiber): void,
  resetHydrationState(): void,
  tryToClaimNextHydratableInstance(fiber: Fiber): void,
  wasHydrated(fiber: Fiber): boolean,
  hydrateHostInstance(fiber: Fiber): I,
  hydrateHostTextInstance(fiber: Fiber): TI,
  popHydrationState(): void,
};

module.exports = function<T, P, I, TI, PI, C, CX, PL>(
  config: HostConfig<T, P, I, TI, PI, C, CX, PL>,
): HydrationContext<I, TI> {
  const {
    shouldSetTextContent,
    canHydrateInstance,
    canHydrateTextInstance,
    getNextHydratableSibling,
    getFirstHydratableChild,
    hydrateInstance,
    hydrateTextInstance,
  } = config;

  // If this doesn't have hydration mode.
  if (
    !(canHydrateInstance &&
      canHydrateTextInstance &&
      getNextHydratableSibling &&
      getFirstHydratableChild &&
      hydrateInstance &&
      hydrateTextInstance)
  ) {
    return {
      enterHydrationState() {},
      resetHydrationState() {},
      tryToClaimNextHydratableInstance() {},
      wasHydrated() {
        return false;
      },
      hydrateHostInstance() {
        invariant(false, 'React bug.');
      },
      hydrateHostTextInstance() {
        invariant(false, 'React bug.');
      },
      popHydrationState() {},
    };
  }

  let hydrationParentFiber: null | Fiber = null;
  let nextHydratableInstance: null | I | TI = null;

  function enterHydrationState(fiber: Fiber) {
    const parentInstance = fiber.stateNode.containerInfo;
    nextHydratableInstance = getFirstHydratableChild(parentInstance);
    hydrationParentFiber = fiber;
  }

  function deleteHydratableInstance(returnFiber: Fiber, instance: I | TI) {
    const childToDelete = createFiberFromHostInstanceForDeletion();
    childToDelete.stateNode = instance;
    childToDelete.return = returnFiber;
    // Deletions are added in reversed order so we add it to the front.
    const last = returnFiber.progressedLastDeletion;
    if (last !== null) {
      last.nextEffect = childToDelete;
      returnFiber.progressedLastDeletion = childToDelete;
    } else {
      returnFiber.progressedFirstDeletion = returnFiber.progressedLastDeletion = childToDelete;
    }
    childToDelete.effectTag = Deletion;

    if (returnFiber.lastEffect !== null) {
      returnFiber.lastEffect.nextEffect = childToDelete;
      returnFiber.lastEffect = childToDelete;
    } else {
      returnFiber.firstEffect = returnFiber.lastEffect = childToDelete;
    }
  }

  function tryToClaimNextHydratableInstance(fiber: Fiber) {
    let nextInstance = nextHydratableInstance;
    if (!nextInstance) {
      // Nothing to hydrate. Make it an insertion.
      if (fiber.return === hydrationParentFiber) {
        fiber.effectTag |= Placement;
      }
      return;
    }
    const type = fiber.type;
    const props = fiber.memoizedProps;
    if (!canHydrateInstance(nextInstance, type, props)) {
      // If we can't hydrate this instance let's try the next one.
      // We use this as a heuristic. It's based on intuition and not data so it
      // might be flawed or unnecessary.
      nextInstance = getNextHydratableSibling(nextInstance);
      if (!nextInstance || !canHydrateInstance(nextInstance, type, props)) {
        // Nothing to hydrate. Make it an insertion.
        if (fiber.return === hydrationParentFiber) {
          fiber.effectTag |= Placement;
        }
        return;
      }
      // We matched the next one, we'll now assume that the first one was
      // superfluous and we'll delete it. Since we can't eagerly delete it
      // we'll have to schedule a deletion. To do that, this node needs a dummy
      // fiber associated with it.
      deleteHydratableInstance(
        (hydrationParentFiber: any),
        nextHydratableInstance,
      );
    }
    // If this Fiber was considered an insertion, drop that side-effect,
    // since it is already inserted.
    // TODO: Do something smarter. This is slow.
    let f = fiber;
    do {
      f.effectTag &= ~Placement;
      f = f.return;
    } while (f);
    fiber.stateNode = nextInstance;
    hydrationParentFiber = fiber;
    nextHydratableInstance = getFirstHydratableChild(nextInstance);
  }

  function wasHydrated(fiber: Fiber): boolean {
    return fiber === hydrationParentFiber;
  }

  function hydrateHostInstance(fiber: Fiber, rootContainerInstance: any): I {
    const instance: I = fiber.stateNode;
    hydrateInstance(
      instance,
      fiber.type,
      fiber.memoizedProps,
      rootContainerInstance,
      fiber,
    );
    return instance;
  }

  function hydrateHostTextInstance(fiber: Fiber): TI {
    const textInstance: TI = fiber.stateNode;
    hydrateTextInstance(textInstance, fiber);
    return textInstance;
  }

  function popHydrationState() {
    // We know we have one here.
    const fiber: Fiber = (hydrationParentFiber: any);
    // If we have any remaining hydratable nodes, we need to delete them now.
    // We only do this deeper than head and body since they tend to have random
    // other nodes in them. We also ignore components with pure text content in
    // side of them.
    // TODO: Better heuristic.
    if (
      fiber.tag !== HostComponent ||
      (fiber.type !== 'head' &&
        fiber.type !== 'body' &&
        !shouldSetTextContent(fiber.memoizedProps))
    ) {
      let nextInstance = nextHydratableInstance;
      while (nextInstance) {
        deleteHydratableInstance(fiber, nextInstance);
        nextInstance = getNextHydratableSibling(nextInstance);
      }
    }

    let parent = fiber.return;
    while (parent && parent.tag !== HostComponent) {
      parent = parent.return;
    }
    nextHydratableInstance = parent
      ? getNextHydratableSibling(fiber.stateNode)
      : null;
    hydrationParentFiber = parent;
  }

  function resetHydrationState() {
    hydrationParentFiber = null;
    nextHydratableInstance = null;
  }

  return {
    enterHydrationState,
    resetHydrationState,
    tryToClaimNextHydratableInstance,
    wasHydrated,
    hydrateHostInstance,
    hydrateHostTextInstance,
    popHydrationState,
  };
};
