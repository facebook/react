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

const {HostComponent, HostText, HostRoot} = require('ReactTypeOfWork');
const {Deletion, Placement} = require('ReactTypeOfSideEffect');

const {createFiberFromHostInstanceForDeletion} = require('ReactFiber');

export type HydrationContext<C> = {
  enterHydrationState(fiber: Fiber): boolean,
  resetHydrationState(): void,
  tryToClaimNextHydratableInstance(fiber: Fiber): void,
  prepareToHydrateHostInstance(fiber: Fiber, rootContainerInstance: C): boolean,
  prepareToHydrateHostTextInstance(fiber: Fiber): boolean,
  popHydrationState(fiber: Fiber): boolean,
};

module.exports = function<T, P, I, TI, PI, C, CX, PL>(
  config: HostConfig<T, P, I, TI, PI, C, CX, PL>,
): HydrationContext<C> {
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
      prepareToHydrateHostInstance() {
        invariant(false, 'React bug.');
      },
      prepareToHydrateHostTextInstance() {
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
    childToDelete.effectTag = Deletion;

    // This might seem like it belongs on progressedFirstDeletion. However,
    // these children are not part of the reconciliation list of children.
    // Even if we abort and rereconcile the children, that will try to hydrate
    // again and the nodes are still in the host tree so these will be
    // recreated.
    if (returnFiber.lastEffect !== null) {
      returnFiber.lastEffect.nextEffect = childToDelete;
      returnFiber.lastEffect = childToDelete;
    } else {
      returnFiber.firstEffect = returnFiber.lastEffect = childToDelete;
    }
  }

  function canHydrate(fiber, nextInstance) {
    switch (fiber.tag) {
      case HostComponent: {
        const type = fiber.type;
        const props = fiber.pendingProps;
        return canHydrateInstance(nextInstance, type, props);
      }
      case HostText: {
        const text = fiber.pendingProps;
        return canHydrateTextInstance(nextInstance, text);
      }
      default:
        return false;
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
    if (!canHydrate(fiber, nextInstance)) {
      // If we can't hydrate this instance let's try the next one.
      // We use this as a heuristic. It's based on intuition and not data so it
      // might be flawed or unnecessary.
      nextInstance = getNextHydratableSibling(nextInstance);
      if (!nextInstance || !canHydrate(fiber, nextInstance)) {
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

  function prepareToHydrateHostInstance(
    fiber: Fiber,
    rootContainerInstance: C,
  ): boolean {
    const instance: I = fiber.stateNode;
    const updatePayload = hydrateInstance(
      instance,
      fiber.type,
      fiber.memoizedProps,
      rootContainerInstance,
      fiber,
    );
    // TODO: Type this specific to this type of component.
    fiber.updateQueue = (updatePayload: any);
    // If the update payload indicates that there is a change or if there
    // is a new ref we mark this as an update.
    if (updatePayload !== null) {
      return true;
    }
    return false;
  }

  function prepareToHydrateHostTextInstance(fiber: Fiber): boolean {
    const textInstance: TI = fiber.stateNode;
    const shouldUpdate = hydrateTextInstance(
      textInstance,
      fiber.memoizedProps,
      fiber,
    );
    return shouldUpdate;
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
    prepareToHydrateHostInstance,
    prepareToHydrateHostTextInstance,
    popHydrationState,
  };
};
