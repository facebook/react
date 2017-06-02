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

const {HostComponent, HostRoot} = require('ReactTypeOfWork');
const {Deletion, Placement} = require('ReactTypeOfSideEffect');

const {createFiberFromHostInstanceForDeletion} = require('ReactFiber');

export type HydrationContext<I, TI, C> = {
  enterHydrationState(fiber: Fiber): boolean,
  resetHydrationState(): void,
  tryToClaimNextHydratableInstance(fiber: Fiber): void,
  hydrateHostInstance(fiber: Fiber, rootContainerInstance: C): I,
  hydrateHostTextInstance(fiber: Fiber): TI,
  popHydrationState(fiber: Fiber): boolean,
};

module.exports = function<T, P, I, TI, PI, C, CX, PL>(
  config: HostConfig<T, P, I, TI, PI, C, CX, PL>,
): HydrationContext<I, TI, C> {
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
      enterHydrationState() {
        return false;
      },
      resetHydrationState() {},
      tryToClaimNextHydratableInstance() {},
      hydrateHostInstance() {
        invariant(false, 'React bug.');
      },
      hydrateHostTextInstance() {
        invariant(false, 'React bug.');
      },
      popHydrationState(fiber: Fiber) {
        return false;
      },
    };
  }

  // The deepest Fiber on the stack involved in a hydration context.
  // This may have been an insertion or a hydration.
  let hydrationParentFiber: null | Fiber = null;
  let nextHydratableInstance: null | I | TI = null;
  let isHydrating: boolean = false;

  function enterHydrationState(fiber: Fiber) {
    const parentInstance = fiber.stateNode.containerInfo;
    nextHydratableInstance = getFirstHydratableChild(parentInstance);
    hydrationParentFiber = fiber;
    isHydrating = true;
    return true;
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
    if (!isHydrating) {
      return;
    }
    let nextInstance = nextHydratableInstance;
    if (!nextInstance) {
      // Nothing to hydrate. Make it an insertion.
      fiber.effectTag |= Placement;
      isHydrating = false;
      hydrationParentFiber = fiber;
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
        fiber.effectTag |= Placement;
        isHydrating = false;
        hydrationParentFiber = fiber;
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
    fiber.stateNode = nextInstance;
    hydrationParentFiber = fiber;
    nextHydratableInstance = getFirstHydratableChild(nextInstance);
  }

  function hydrateHostInstance(fiber: Fiber, rootContainerInstance: C): I {
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

  function popToNextHostParent(fiber: Fiber): void {
    let parent = fiber.return;
    while (
      parent !== null &&
      parent.tag !== HostComponent &&
      parent.tag !== HostRoot
    ) {
      parent = parent.return;
    }
    hydrationParentFiber = parent;
  }

  function popHydrationState(fiber: Fiber): boolean {
    if (fiber !== hydrationParentFiber) {
      // We're deeper than the current hydration context, inside an inserted
      // tree.
      return false;
    }
    if (!isHydrating) {
      // If we're not currently hydrating but we're in a hydration context, then
      // we were an insertion and now need to pop up reenter hydration of our
      // siblings.
      popToNextHostParent(fiber);
      isHydrating = true;
      return false;
    }

    const type = fiber.type;

    // If we have any remaining hydratable nodes, we need to delete them now.
    // We only do this deeper than head and body since they tend to have random
    // other nodes in them. We also ignore components with pure text content in
    // side of them.
    // TODO: Better heuristic.
    if (
      fiber.tag !== HostComponent ||
      (type !== 'head' &&
        type !== 'body' &&
        !shouldSetTextContent(type, fiber.memoizedProps))
    ) {
      let nextInstance = nextHydratableInstance;
      while (nextInstance) {
        deleteHydratableInstance(fiber, nextInstance);
        nextInstance = getNextHydratableSibling(nextInstance);
      }
    }

    popToNextHostParent(fiber);
    nextHydratableInstance = hydrationParentFiber
      ? getNextHydratableSibling(fiber.stateNode)
      : null;
    return true;
  }

  function resetHydrationState() {
    hydrationParentFiber = null;
    nextHydratableInstance = null;
    isHydrating = false;
  }

  return {
    enterHydrationState,
    resetHydrationState,
    tryToClaimNextHydratableInstance,
    hydrateHostInstance,
    hydrateHostTextInstance,
    popHydrationState,
  };
};
