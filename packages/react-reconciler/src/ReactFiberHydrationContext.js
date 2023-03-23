/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import type {Fiber} from './ReactInternalTypes';
import {NoMode, ConcurrentMode} from './ReactTypeOfMode';
import type {
  Instance,
  TextInstance,
  HydratableInstance,
  SuspenseInstance,
  Container,
  HostContext,
} from './ReactFiberHostConfig';
import type {SuspenseState} from './ReactFiberSuspenseComponent';
import type {TreeContext} from './ReactFiberTreeContext';
import type {CapturedValue} from './ReactCapturedValue';

import {
  HostComponent,
  HostSingleton,
  HostText,
  HostRoot,
  SuspenseComponent,
} from './ReactWorkTags';
import {
  ChildDeletion,
  Placement,
  Hydrating,
  NoFlags,
  DidCapture,
} from './ReactFiberFlags';
import {
  enableHostSingletons,
  enableFloat,
  enableClientRenderFallbackOnTextMismatch,
} from 'shared/ReactFeatureFlags';

import {
  createFiberFromHostInstanceForDeletion,
  createFiberFromDehydratedFragment,
} from './ReactFiber';
import {
  shouldSetTextContent,
  supportsHydration,
  supportsSingletons,
  getNextHydratableSibling,
  getFirstHydratableChild,
  getFirstHydratableChildWithinContainer,
  getFirstHydratableChildWithinSuspenseInstance,
  hydrateInstance,
  hydrateTextInstance,
  hydrateSuspenseInstance,
  getNextHydratableInstanceAfterSuspenseInstance,
  shouldDeleteUnhydratedTailInstances,
  didNotMatchHydratedContainerTextInstance,
  didNotMatchHydratedTextInstance,
  didNotHydrateInstanceWithinContainer,
  didNotHydrateInstanceWithinSuspenseInstance,
  didNotHydrateInstance,
  didNotFindHydratableInstanceWithinContainer,
  didNotFindHydratableTextInstanceWithinContainer,
  didNotFindHydratableSuspenseInstanceWithinContainer,
  didNotFindHydratableInstanceWithinSuspenseInstance,
  didNotFindHydratableTextInstanceWithinSuspenseInstance,
  didNotFindHydratableSuspenseInstanceWithinSuspenseInstance,
  didNotFindHydratableInstance,
  didNotFindHydratableTextInstance,
  didNotFindHydratableSuspenseInstance,
  resolveSingletonInstance,
  shouldSkipHydratableForInstance,
  shouldSkipHydratableForTextInstance,
  shouldSkipHydratableForSuspenseInstance,
  canHydrateInstance,
  canHydrateTextInstance,
  canHydrateSuspenseInstance,
  isHydratableType,
  isHydratableText,
} from './ReactFiberHostConfig';
import {OffscreenLane} from './ReactFiberLane';
import {
  getSuspendedTreeContext,
  restoreSuspendedTreeContext,
} from './ReactFiberTreeContext';
import {queueRecoverableErrors} from './ReactFiberWorkLoop';
import {getRootHostContainer, getHostContext} from './ReactFiberHostContext';

// The deepest Fiber on the stack involved in a hydration context.
// This may have been an insertion or a hydration.
let hydrationParentFiber: null | Fiber = null;
let nextHydratableInstance: null | HydratableInstance = null;
let isHydrating: boolean = false;

// This flag allows for warning supression when we expect there to be mismatches
// due to earlier mismatches or a suspended fiber.
let didSuspendOrErrorDEV: boolean = false;

// Hydration errors that were thrown inside this boundary
let hydrationErrors: Array<CapturedValue<mixed>> | null = null;

let rootOrSingletonContext = false;

function warnIfHydrating() {
  if (__DEV__) {
    if (isHydrating) {
      console.error(
        'We should not be hydrating here. This is a bug in React. Please file a bug.',
      );
    }
  }
}

export function markDidThrowWhileHydratingDEV() {
  if (__DEV__) {
    didSuspendOrErrorDEV = true;
  }
}

export function didSuspendOrErrorWhileHydratingDEV(): boolean {
  if (__DEV__) {
    return didSuspendOrErrorDEV;
  }
  return false;
}

function enterHydrationState(fiber: Fiber): boolean {
  if (!supportsHydration) {
    return false;
  }

  const parentInstance: Container = fiber.stateNode.containerInfo;
  nextHydratableInstance =
    getFirstHydratableChildWithinContainer(parentInstance);
  hydrationParentFiber = fiber;
  isHydrating = true;
  hydrationErrors = null;
  didSuspendOrErrorDEV = false;
  rootOrSingletonContext = true;
  return true;
}

function reenterHydrationStateFromDehydratedSuspenseInstance(
  fiber: Fiber,
  suspenseInstance: SuspenseInstance,
  treeContext: TreeContext | null,
): boolean {
  if (!supportsHydration) {
    return false;
  }
  nextHydratableInstance =
    getFirstHydratableChildWithinSuspenseInstance(suspenseInstance);
  hydrationParentFiber = fiber;
  isHydrating = true;
  hydrationErrors = null;
  didSuspendOrErrorDEV = false;
  rootOrSingletonContext = false;
  if (treeContext !== null) {
    restoreSuspendedTreeContext(fiber, treeContext);
  }
  return true;
}

function warnUnhydratedInstance(
  returnFiber: Fiber,
  instance: HydratableInstance,
) {
  if (__DEV__) {
    switch (returnFiber.tag) {
      case HostRoot: {
        didNotHydrateInstanceWithinContainer(
          returnFiber.stateNode.containerInfo,
          instance,
        );
        break;
      }
      case HostSingleton:
      case HostComponent: {
        const isConcurrentMode = (returnFiber.mode & ConcurrentMode) !== NoMode;
        didNotHydrateInstance(
          returnFiber.type,
          returnFiber.memoizedProps,
          returnFiber.stateNode,
          instance,
          // TODO: Delete this argument when we remove the legacy root API.
          isConcurrentMode,
        );
        break;
      }
      case SuspenseComponent: {
        const suspenseState: SuspenseState = returnFiber.memoizedState;
        if (suspenseState.dehydrated !== null)
          didNotHydrateInstanceWithinSuspenseInstance(
            suspenseState.dehydrated,
            instance,
          );
        break;
      }
    }
  }
}

function deleteHydratableInstance(
  returnFiber: Fiber,
  instance: HydratableInstance,
) {
  warnUnhydratedInstance(returnFiber, instance);
  const childToDelete = createFiberFromHostInstanceForDeletion();
  childToDelete.stateNode = instance;
  childToDelete.return = returnFiber;

  const deletions = returnFiber.deletions;
  if (deletions === null) {
    returnFiber.deletions = [childToDelete];
    returnFiber.flags |= ChildDeletion;
  } else {
    deletions.push(childToDelete);
  }
}

function warnNonhydratedInstance(returnFiber: Fiber, fiber: Fiber) {
  if (__DEV__) {
    if (didSuspendOrErrorDEV) {
      // Inside a boundary that already suspended. We're currently rendering the
      // siblings of a suspended node. The mismatch may be due to the missing
      // data, so it's probably a false positive.
      return;
    }

    switch (returnFiber.tag) {
      case HostRoot: {
        const parentContainer = returnFiber.stateNode.containerInfo;
        switch (fiber.tag) {
          case HostSingleton:
          case HostComponent:
            const type = fiber.type;
            const props = fiber.pendingProps;
            didNotFindHydratableInstanceWithinContainer(
              parentContainer,
              type,
              props,
            );
            break;
          case HostText:
            const text = fiber.pendingProps;
            didNotFindHydratableTextInstanceWithinContainer(
              parentContainer,
              text,
            );
            break;
          case SuspenseComponent:
            didNotFindHydratableSuspenseInstanceWithinContainer(
              parentContainer,
            );
            break;
        }
        break;
      }
      case HostSingleton:
      case HostComponent: {
        const parentType = returnFiber.type;
        const parentProps = returnFiber.memoizedProps;
        const parentInstance = returnFiber.stateNode;
        switch (fiber.tag) {
          case HostSingleton:
          case HostComponent: {
            const type = fiber.type;
            const props = fiber.pendingProps;
            const isConcurrentMode =
              (returnFiber.mode & ConcurrentMode) !== NoMode;
            didNotFindHydratableInstance(
              parentType,
              parentProps,
              parentInstance,
              type,
              props,
              // TODO: Delete this argument when we remove the legacy root API.
              isConcurrentMode,
            );
            break;
          }
          case HostText: {
            const text = fiber.pendingProps;
            const isConcurrentMode =
              (returnFiber.mode & ConcurrentMode) !== NoMode;
            didNotFindHydratableTextInstance(
              parentType,
              parentProps,
              parentInstance,
              text,
              // TODO: Delete this argument when we remove the legacy root API.
              isConcurrentMode,
            );
            break;
          }
          case SuspenseComponent: {
            didNotFindHydratableSuspenseInstance(
              parentType,
              parentProps,
              parentInstance,
            );
            break;
          }
        }
        break;
      }
      case SuspenseComponent: {
        const suspenseState: SuspenseState = returnFiber.memoizedState;
        const parentInstance = suspenseState.dehydrated;
        if (parentInstance !== null)
          switch (fiber.tag) {
            case HostSingleton:
            case HostComponent:
              const type = fiber.type;
              const props = fiber.pendingProps;
              didNotFindHydratableInstanceWithinSuspenseInstance(
                parentInstance,
                type,
                props,
              );
              break;
            case HostText:
              const text = fiber.pendingProps;
              didNotFindHydratableTextInstanceWithinSuspenseInstance(
                parentInstance,
                text,
              );
              break;
            case SuspenseComponent:
              didNotFindHydratableSuspenseInstanceWithinSuspenseInstance(
                parentInstance,
              );
              break;
          }
        break;
      }
      default:
        return;
    }
  }
}
function insertNonHydratedInstance(returnFiber: Fiber, fiber: Fiber) {
  fiber.flags = (fiber.flags & ~Hydrating) | Placement;
  warnNonhydratedInstance(returnFiber, fiber);
}

function tryHydrateInstance(fiber: Fiber, nextInstance: any) {
  // fiber is a HostComponent Fiber
  const instance = canHydrateInstance(
    nextInstance,
    fiber.type,
    fiber.pendingProps,
  );
  if (instance !== null) {
    fiber.stateNode = (instance: Instance);
    hydrationParentFiber = fiber;
    nextHydratableInstance = getFirstHydratableChild(instance);
    rootOrSingletonContext = false;
    return true;
  }
  return false;
}

function tryHydrateText(fiber: Fiber, nextInstance: any) {
  // fiber is a HostText Fiber
  const text = fiber.pendingProps;
  const textInstance = canHydrateTextInstance(nextInstance, text);
  if (textInstance !== null) {
    fiber.stateNode = (textInstance: TextInstance);
    hydrationParentFiber = fiber;
    // Text Instances don't have children so there's nothing to hydrate.
    nextHydratableInstance = null;
    return true;
  }
  return false;
}

function tryHydrateSuspense(fiber: Fiber, nextInstance: any) {
  // fiber is a SuspenseComponent Fiber
  const suspenseInstance = canHydrateSuspenseInstance(nextInstance);
  if (suspenseInstance !== null) {
    const suspenseState: SuspenseState = {
      dehydrated: suspenseInstance,
      treeContext: getSuspendedTreeContext(),
      retryLane: OffscreenLane,
    };
    fiber.memoizedState = suspenseState;
    // Store the dehydrated fragment as a child fiber.
    // This simplifies the code for getHostSibling and deleting nodes,
    // since it doesn't have to consider all Suspense boundaries and
    // check if they're dehydrated ones or not.
    const dehydratedFragment =
      createFiberFromDehydratedFragment(suspenseInstance);
    dehydratedFragment.return = fiber;
    fiber.child = dehydratedFragment;
    hydrationParentFiber = fiber;
    // While a Suspense Instance does have children, we won't step into
    // it during the first pass. Instead, we'll reenter it later.
    nextHydratableInstance = null;
    return true;
  }
  return false;
}

function shouldClientRenderOnMismatch(fiber: Fiber) {
  return (
    (fiber.mode & ConcurrentMode) !== NoMode &&
    (fiber.flags & DidCapture) === NoFlags
  );
}

function throwOnHydrationMismatch(fiber: Fiber) {
  throw new Error(
    'Hydration failed because the initial UI does not match what was ' +
      'rendered on the server.',
  );
}

function claimHydratableSingleton(fiber: Fiber): void {
  if (enableHostSingletons && supportsSingletons) {
    if (!isHydrating) {
      return;
    }
    const currentRootContainer = getRootHostContainer();
    const currentHostContext = getHostContext();
    const instance = (fiber.stateNode = resolveSingletonInstance(
      fiber.type,
      fiber.pendingProps,
      currentRootContainer,
      currentHostContext,
      false,
    ));
    hydrationParentFiber = fiber;
    rootOrSingletonContext = true;
    nextHydratableInstance = getFirstHydratableChild(instance);
  }
}

function advanceToFirstAttemptableInstance(fiber: Fiber) {
  // fiber is HostComponent Fiber
  while (
    nextHydratableInstance &&
    shouldSkipHydratableForInstance(
      nextHydratableInstance,
      fiber.type,
      fiber.pendingProps,
    )
  ) {
    // Flow doesn't understand that inside this block nextHydratableInstance is not null
    const instance: HydratableInstance = (nextHydratableInstance: any);
    nextHydratableInstance = getNextHydratableSibling(instance);
  }
}

function advanceToFirstAttemptableTextInstance() {
  while (
    nextHydratableInstance &&
    shouldSkipHydratableForTextInstance(nextHydratableInstance)
  ) {
    // Flow doesn't understand that inside this block nextHydratableInstance is not null
    const instance: HydratableInstance = (nextHydratableInstance: any);
    nextHydratableInstance = getNextHydratableSibling(instance);
  }
}

function advanceToFirstAttemptableSuspenseInstance() {
  while (
    nextHydratableInstance &&
    shouldSkipHydratableForSuspenseInstance(nextHydratableInstance)
  ) {
    // Flow doesn't understand that inside this block nextHydratableInstance is not null
    const instance: HydratableInstance = (nextHydratableInstance: any);
    nextHydratableInstance = getNextHydratableSibling(instance);
  }
}

function tryToClaimNextHydratableInstance(fiber: Fiber): void {
  if (!isHydrating) {
    return;
  }
  if (enableFloat) {
    if (!isHydratableType(fiber.type, fiber.pendingProps)) {
      // This fiber never hydrates from the DOM and always does an insert
      fiber.flags = (fiber.flags & ~Hydrating) | Placement;
      isHydrating = false;
      hydrationParentFiber = fiber;
      return;
    }
  }
  const initialInstance = nextHydratableInstance;
  if (rootOrSingletonContext) {
    // We may need to skip past certain nodes in these contexts
    advanceToFirstAttemptableInstance(fiber);
  }
  const nextInstance = nextHydratableInstance;
  if (!nextInstance) {
    if (shouldClientRenderOnMismatch(fiber)) {
      warnNonhydratedInstance((hydrationParentFiber: any), fiber);
      throwOnHydrationMismatch(fiber);
    }
    // Nothing to hydrate. Make it an insertion.
    insertNonHydratedInstance((hydrationParentFiber: any), fiber);
    isHydrating = false;
    hydrationParentFiber = fiber;
    nextHydratableInstance = initialInstance;
    return;
  }
  const firstAttemptedInstance = nextInstance;
  if (!tryHydrateInstance(fiber, nextInstance)) {
    if (shouldClientRenderOnMismatch(fiber)) {
      warnNonhydratedInstance((hydrationParentFiber: any), fiber);
      throwOnHydrationMismatch(fiber);
    }
    // If we can't hydrate this instance let's try the next one.
    // We use this as a heuristic. It's based on intuition and not data so it
    // might be flawed or unnecessary.
    nextHydratableInstance = getNextHydratableSibling(nextInstance);
    const prevHydrationParentFiber: Fiber = (hydrationParentFiber: any);
    if (rootOrSingletonContext) {
      // We may need to skip past certain nodes in these contexts
      advanceToFirstAttemptableInstance(fiber);
    }
    if (
      !nextHydratableInstance ||
      !tryHydrateInstance(fiber, nextHydratableInstance)
    ) {
      // Nothing to hydrate. Make it an insertion.
      insertNonHydratedInstance((hydrationParentFiber: any), fiber);
      isHydrating = false;
      hydrationParentFiber = fiber;
      nextHydratableInstance = initialInstance;
      return;
    }
    // We matched the next one, we'll now assume that the first one was
    // superfluous and we'll delete it. Since we can't eagerly delete it
    // we'll have to schedule a deletion. To do that, this node needs a dummy
    // fiber associated with it.
    deleteHydratableInstance(prevHydrationParentFiber, firstAttemptedInstance);
  }
}

function tryToClaimNextHydratableTextInstance(fiber: Fiber): void {
  if (!isHydrating) {
    return;
  }
  const text = fiber.pendingProps;
  const isHydratable = isHydratableText(text);

  const initialInstance = nextHydratableInstance;
  if (rootOrSingletonContext && isHydratable) {
    // We may need to skip past certain nodes in these contexts.
    // We don't skip if the text is not hydratable because we know no hydratables
    // exist which could match this Fiber
    advanceToFirstAttemptableTextInstance();
  }
  const nextInstance = nextHydratableInstance;
  if (!nextInstance || !isHydratable) {
    // We exclude non hydrabable text because we know there are no matching hydratables.
    // We either throw or insert depending on the render mode.
    if (shouldClientRenderOnMismatch(fiber)) {
      warnNonhydratedInstance((hydrationParentFiber: any), fiber);
      throwOnHydrationMismatch(fiber);
    }
    // Nothing to hydrate. Make it an insertion.
    insertNonHydratedInstance((hydrationParentFiber: any), fiber);
    isHydrating = false;
    hydrationParentFiber = fiber;
    nextHydratableInstance = initialInstance;
    return;
  }
  const firstAttemptedInstance = nextInstance;
  if (!tryHydrateText(fiber, nextInstance)) {
    if (shouldClientRenderOnMismatch(fiber)) {
      warnNonhydratedInstance((hydrationParentFiber: any), fiber);
      throwOnHydrationMismatch(fiber);
    }
    // If we can't hydrate this instance let's try the next one.
    // We use this as a heuristic. It's based on intuition and not data so it
    // might be flawed or unnecessary.
    nextHydratableInstance = getNextHydratableSibling(nextInstance);
    const prevHydrationParentFiber: Fiber = (hydrationParentFiber: any);

    if (rootOrSingletonContext && isHydratable) {
      // We may need to skip past certain nodes in these contexts
      advanceToFirstAttemptableTextInstance();
    }

    if (
      !nextHydratableInstance ||
      !tryHydrateText(fiber, nextHydratableInstance)
    ) {
      // Nothing to hydrate. Make it an insertion.
      insertNonHydratedInstance((hydrationParentFiber: any), fiber);
      isHydrating = false;
      hydrationParentFiber = fiber;
      nextHydratableInstance = initialInstance;
      return;
    }
    // We matched the next one, we'll now assume that the first one was
    // superfluous and we'll delete it. Since we can't eagerly delete it
    // we'll have to schedule a deletion. To do that, this node needs a dummy
    // fiber associated with it.
    deleteHydratableInstance(prevHydrationParentFiber, firstAttemptedInstance);
  }
}

function tryToClaimNextHydratableSuspenseInstance(fiber: Fiber): void {
  if (!isHydrating) {
    return;
  }
  const initialInstance = nextHydratableInstance;
  if (rootOrSingletonContext) {
    // We may need to skip past certain nodes in these contexts
    advanceToFirstAttemptableSuspenseInstance();
  }
  const nextInstance = nextHydratableInstance;
  if (!nextInstance) {
    if (shouldClientRenderOnMismatch(fiber)) {
      warnNonhydratedInstance((hydrationParentFiber: any), fiber);
      throwOnHydrationMismatch(fiber);
    }
    // Nothing to hydrate. Make it an insertion.
    insertNonHydratedInstance((hydrationParentFiber: any), fiber);
    isHydrating = false;
    hydrationParentFiber = fiber;
    nextHydratableInstance = initialInstance;
    return;
  }
  const firstAttemptedInstance = nextInstance;
  if (!tryHydrateSuspense(fiber, nextInstance)) {
    if (shouldClientRenderOnMismatch(fiber)) {
      warnNonhydratedInstance((hydrationParentFiber: any), fiber);
      throwOnHydrationMismatch(fiber);
    }
    // If we can't hydrate this instance let's try the next one.
    // We use this as a heuristic. It's based on intuition and not data so it
    // might be flawed or unnecessary.
    nextHydratableInstance = getNextHydratableSibling(nextInstance);
    const prevHydrationParentFiber: Fiber = (hydrationParentFiber: any);

    if (rootOrSingletonContext) {
      // We may need to skip past certain nodes in these contexts
      advanceToFirstAttemptableSuspenseInstance();
    }

    if (
      !nextHydratableInstance ||
      !tryHydrateSuspense(fiber, nextHydratableInstance)
    ) {
      // Nothing to hydrate. Make it an insertion.
      insertNonHydratedInstance((hydrationParentFiber: any), fiber);
      isHydrating = false;
      hydrationParentFiber = fiber;
      nextHydratableInstance = initialInstance;
      return;
    }
    // We matched the next one, we'll now assume that the first one was
    // superfluous and we'll delete it. Since we can't eagerly delete it
    // we'll have to schedule a deletion. To do that, this node needs a dummy
    // fiber associated with it.
    deleteHydratableInstance(prevHydrationParentFiber, firstAttemptedInstance);
  }
}

function prepareToHydrateHostInstance(
  fiber: Fiber,
  hostContext: HostContext,
): boolean {
  if (!supportsHydration) {
    throw new Error(
      'Expected prepareToHydrateHostInstance() to never be called. ' +
        'This error is likely caused by a bug in React. Please file an issue.',
    );
  }

  const instance: Instance = fiber.stateNode;
  const shouldWarnIfMismatchDev = !didSuspendOrErrorDEV;
  const updatePayload = hydrateInstance(
    instance,
    fiber.type,
    fiber.memoizedProps,
    hostContext,
    fiber,
    shouldWarnIfMismatchDev,
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
  if (!supportsHydration) {
    throw new Error(
      'Expected prepareToHydrateHostTextInstance() to never be called. ' +
        'This error is likely caused by a bug in React. Please file an issue.',
    );
  }

  const textInstance: TextInstance = fiber.stateNode;
  const textContent: string = fiber.memoizedProps;
  const shouldWarnIfMismatchDev = !didSuspendOrErrorDEV;
  const shouldUpdate = hydrateTextInstance(
    textInstance,
    textContent,
    fiber,
    shouldWarnIfMismatchDev,
  );
  if (shouldUpdate) {
    // We assume that prepareToHydrateHostTextInstance is called in a context where the
    // hydration parent is the parent host component of this host text.
    const returnFiber = hydrationParentFiber;
    if (returnFiber !== null) {
      switch (returnFiber.tag) {
        case HostRoot: {
          const parentContainer = returnFiber.stateNode.containerInfo;
          const isConcurrentMode =
            (returnFiber.mode & ConcurrentMode) !== NoMode;
          didNotMatchHydratedContainerTextInstance(
            parentContainer,
            textInstance,
            textContent,
            // TODO: Delete this argument when we remove the legacy root API.
            isConcurrentMode,
            shouldWarnIfMismatchDev,
          );
          if (isConcurrentMode && enableClientRenderFallbackOnTextMismatch) {
            // In concurrent mode we never update the mismatched text,
            // even if the error was ignored.
            return false;
          }
          break;
        }
        case HostSingleton:
        case HostComponent: {
          const parentType = returnFiber.type;
          const parentProps = returnFiber.memoizedProps;
          const parentInstance = returnFiber.stateNode;
          const isConcurrentMode =
            (returnFiber.mode & ConcurrentMode) !== NoMode;
          didNotMatchHydratedTextInstance(
            parentType,
            parentProps,
            parentInstance,
            textInstance,
            textContent,
            // TODO: Delete this argument when we remove the legacy root API.
            isConcurrentMode,
            shouldWarnIfMismatchDev,
          );
          if (isConcurrentMode && enableClientRenderFallbackOnTextMismatch) {
            // In concurrent mode we never update the mismatched text,
            // even if the error was ignored.
            return false;
          }
          break;
        }
      }
    }
  }
  return shouldUpdate;
}

function prepareToHydrateHostSuspenseInstance(fiber: Fiber): void {
  if (!supportsHydration) {
    throw new Error(
      'Expected prepareToHydrateHostSuspenseInstance() to never be called. ' +
        'This error is likely caused by a bug in React. Please file an issue.',
    );
  }

  const suspenseState: null | SuspenseState = fiber.memoizedState;
  const suspenseInstance: null | SuspenseInstance =
    suspenseState !== null ? suspenseState.dehydrated : null;

  if (!suspenseInstance) {
    throw new Error(
      'Expected to have a hydrated suspense instance. ' +
        'This error is likely caused by a bug in React. Please file an issue.',
    );
  }

  hydrateSuspenseInstance(suspenseInstance, fiber);
}

function skipPastDehydratedSuspenseInstance(
  fiber: Fiber,
): null | HydratableInstance {
  if (!supportsHydration) {
    throw new Error(
      'Expected skipPastDehydratedSuspenseInstance() to never be called. ' +
        'This error is likely caused by a bug in React. Please file an issue.',
    );
  }
  const suspenseState: null | SuspenseState = fiber.memoizedState;
  const suspenseInstance: null | SuspenseInstance =
    suspenseState !== null ? suspenseState.dehydrated : null;

  if (!suspenseInstance) {
    throw new Error(
      'Expected to have a hydrated suspense instance. ' +
        'This error is likely caused by a bug in React. Please file an issue.',
    );
  }

  return getNextHydratableInstanceAfterSuspenseInstance(suspenseInstance);
}

function popToNextHostParent(fiber: Fiber): void {
  hydrationParentFiber = fiber.return;
  while (hydrationParentFiber) {
    switch (hydrationParentFiber.tag) {
      case HostRoot:
      case HostSingleton:
        rootOrSingletonContext = true;
        return;
      case HostComponent:
      case SuspenseComponent:
        rootOrSingletonContext = false;
        return;
      default:
        hydrationParentFiber = hydrationParentFiber.return;
    }
  }
}

function popHydrationState(fiber: Fiber): boolean {
  if (!supportsHydration) {
    return false;
  }
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

  let shouldClear = false;
  if (enableHostSingletons && supportsSingletons) {
    // With float we never clear the Root, or Singleton instances. We also do not clear Instances
    // that have singleton text content
    if (
      fiber.tag !== HostRoot &&
      fiber.tag !== HostSingleton &&
      !(
        fiber.tag === HostComponent &&
        shouldSetTextContent(fiber.type, fiber.memoizedProps)
      )
    ) {
      shouldClear = true;
    }
  } else {
    // If we have any remaining hydratable nodes, we need to delete them now.
    // We only do this deeper than head and body since they tend to have random
    // other nodes in them. We also ignore components with pure text content in
    // side of them. We also don't delete anything inside the root container.
    if (
      fiber.tag !== HostRoot &&
      (fiber.tag !== HostComponent ||
        (shouldDeleteUnhydratedTailInstances(fiber.type) &&
          !shouldSetTextContent(fiber.type, fiber.memoizedProps)))
    ) {
      shouldClear = true;
    }
  }
  if (shouldClear) {
    let nextInstance = nextHydratableInstance;
    if (nextInstance) {
      if (shouldClientRenderOnMismatch(fiber)) {
        warnIfUnhydratedTailNodes(fiber);
        throwOnHydrationMismatch(fiber);
      } else {
        while (nextInstance) {
          deleteHydratableInstance(fiber, nextInstance);
          nextInstance = getNextHydratableSibling(nextInstance);
        }
      }
    }
  }
  popToNextHostParent(fiber);
  if (fiber.tag === SuspenseComponent) {
    nextHydratableInstance = skipPastDehydratedSuspenseInstance(fiber);
  } else {
    nextHydratableInstance = hydrationParentFiber
      ? getNextHydratableSibling(fiber.stateNode)
      : null;
  }
  return true;
}

function hasUnhydratedTailNodes(): boolean {
  return isHydrating && nextHydratableInstance !== null;
}

function warnIfUnhydratedTailNodes(fiber: Fiber) {
  let nextInstance = nextHydratableInstance;
  while (nextInstance) {
    warnUnhydratedInstance(fiber, nextInstance);
    nextInstance = getNextHydratableSibling(nextInstance);
  }
}

function resetHydrationState(): void {
  if (!supportsHydration) {
    return;
  }

  hydrationParentFiber = null;
  nextHydratableInstance = null;
  isHydrating = false;
  didSuspendOrErrorDEV = false;
}

export function upgradeHydrationErrorsToRecoverable(): void {
  if (hydrationErrors !== null) {
    // Successfully completed a forced client render. The errors that occurred
    // during the hydration attempt are now recovered. We will log them in
    // commit phase, once the entire tree has finished.
    queueRecoverableErrors(hydrationErrors);
    hydrationErrors = null;
  }
}

function getIsHydrating(): boolean {
  return isHydrating;
}

export function queueHydrationError(error: CapturedValue<mixed>): void {
  if (hydrationErrors === null) {
    hydrationErrors = [error];
  } else {
    hydrationErrors.push(error);
  }
}

export {
  warnIfHydrating,
  enterHydrationState,
  getIsHydrating,
  reenterHydrationStateFromDehydratedSuspenseInstance,
  resetHydrationState,
  claimHydratableSingleton,
  tryToClaimNextHydratableInstance,
  tryToClaimNextHydratableTextInstance,
  tryToClaimNextHydratableSuspenseInstance,
  prepareToHydrateHostInstance,
  prepareToHydrateHostTextInstance,
  prepareToHydrateHostSuspenseInstance,
  popHydrationState,
  hasUnhydratedTailNodes,
  warnIfUnhydratedTailNodes,
};
