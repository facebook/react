/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import type {Fiber} from './ReactInternalTypes';
import type {
  Instance,
  TextInstance,
  HydratableInstance,
  SuspenseInstance,
  Container,
  HostContext,
} from './ReactFiberConfig';
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

import {createFiberFromDehydratedFragment} from './ReactFiber';
import {
  shouldSetTextContent,
  supportsHydration,
  supportsSingletons,
  getNextHydratableSibling,
  getFirstHydratableChild,
  getFirstHydratableChildWithinContainer,
  getFirstHydratableChildWithinSuspenseInstance,
  hydrateInstance,
  diffHydratedPropsForDevWarnings,
  describeHydratableInstanceForDevWarnings,
  hydrateTextInstance,
  diffHydratedTextForDevWarnings,
  hydrateSuspenseInstance,
  getNextHydratableInstanceAfterSuspenseInstance,
  shouldDeleteUnhydratedTailInstances,
  resolveSingletonInstance,
  canHydrateInstance,
  canHydrateTextInstance,
  canHydrateSuspenseInstance,
  canHydrateFormStateMarker,
  isFormStateMarkerMatching,
  validateHydratableInstance,
  validateHydratableTextInstance,
} from './ReactFiberConfig';
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

function warnForDeletedHydratableInstance(
  parentType: string,
  child: HydratableInstance,
) {
  if (__DEV__) {
    const description = describeHydratableInstanceForDevWarnings(child);
    if (typeof description === 'string') {
      console.error(
        'Did not expect server HTML to contain the text node "%s" in <%s>.',
        description,
        parentType,
      );
    } else {
      console.error(
        'Did not expect server HTML to contain a <%s> in <%s>.',
        description.type,
        parentType,
      );
    }
  }
}

function warnForInsertedHydratedElement(parentType: string, tag: string) {
  if (__DEV__) {
    console.error(
      'Expected server HTML to contain a matching <%s> in <%s>.',
      tag,
      parentType,
    );
  }
}

function warnForInsertedHydratedText(parentType: string, text: string) {
  if (__DEV__) {
    console.error(
      'Expected server HTML to contain a matching text node for "%s" in <%s>.',
      text,
      parentType,
    );
  }
}

function warnForInsertedHydratedSuspense(parentType: string) {
  if (__DEV__) {
    console.error(
      'Expected server HTML to contain a matching <%s> in <%s>.',
      'Suspense',
      parentType,
    );
  }
}

export function errorHydratingContainer(parentContainer: Container): void {
  if (__DEV__) {
    // TODO: This gets logged by onRecoverableError, too, so we should be
    // able to remove it.
    console.error(
      'An error occurred during hydration. The server HTML was replaced with client content.',
    );
  }
}

function warnUnhydratedInstance(
  returnFiber: Fiber,
  instance: HydratableInstance,
) {
  if (__DEV__) {
    if (didWarnInvalidHydration) {
      return;
    }
    didWarnInvalidHydration = true;

    switch (returnFiber.tag) {
      case HostRoot: {
        const description = describeHydratableInstanceForDevWarnings(instance);
        if (typeof description === 'string') {
          console.error(
            'Did not expect server HTML to contain the text node "%s" in the root.',
            description,
          );
        } else {
          console.error(
            'Did not expect server HTML to contain a <%s> in the root.',
            description.type,
          );
        }
        break;
      }
      case HostSingleton:
      case HostComponent: {
        warnForDeletedHydratableInstance(returnFiber.type, instance);
        break;
      }
      case SuspenseComponent: {
        const suspenseState: SuspenseState = returnFiber.memoizedState;
        if (suspenseState.dehydrated !== null)
          warnForDeletedHydratableInstance('Suspense', instance);
        break;
      }
    }
  }
}

function warnNonHydratedInstance(returnFiber: Fiber, fiber: Fiber) {
  if (__DEV__) {
    if (didSuspendOrErrorDEV) {
      // Inside a boundary that already suspended. We're currently rendering the
      // siblings of a suspended node. The mismatch may be due to the missing
      // data, so it's probably a false positive.
      return;
    }

    if (didWarnInvalidHydration) {
      return;
    }
    didWarnInvalidHydration = true;

    switch (returnFiber.tag) {
      case HostRoot: {
        // const parentContainer = returnFiber.stateNode.containerInfo;
        switch (fiber.tag) {
          case HostSingleton:
          case HostComponent:
            console.error(
              'Expected server HTML to contain a matching <%s> in the root.',
              fiber.type,
            );
            break;
          case HostText:
            const text = fiber.pendingProps;
            console.error(
              'Expected server HTML to contain a matching text node for "%s" in the root.',
              text,
            );
            break;
          case SuspenseComponent:
            console.error(
              'Expected server HTML to contain a matching <%s> in the root.',
              'Suspense',
            );
            break;
        }
        break;
      }
      case HostSingleton:
      case HostComponent: {
        const parentType = returnFiber.type;
        // const parentProps = returnFiber.memoizedProps;
        // const parentInstance = returnFiber.stateNode;
        switch (fiber.tag) {
          case HostSingleton:
          case HostComponent: {
            const type = fiber.type;
            warnForInsertedHydratedElement(parentType, type);
            break;
          }
          case HostText: {
            const text = fiber.pendingProps;
            warnForInsertedHydratedText(parentType, text);
            break;
          }
          case SuspenseComponent: {
            warnForInsertedHydratedSuspense(parentType);
            break;
          }
        }
        break;
      }
      case SuspenseComponent: {
        // const suspenseState: SuspenseState = returnFiber.memoizedState;
        // const parentInstance = suspenseState.dehydrated;
        switch (fiber.tag) {
          case HostSingleton:
          case HostComponent:
            const type = fiber.type;
            warnForInsertedHydratedElement('Suspense', type);
            break;
          case HostText:
            const text = fiber.pendingProps;
            warnForInsertedHydratedText('Suspense', text);
            break;
          case SuspenseComponent:
            warnForInsertedHydratedSuspense('Suspense');
            break;
        }
        break;
      }
      default:
        return;
    }
  }
}

function tryHydrateInstance(fiber: Fiber, nextInstance: any) {
  // fiber is a HostComponent Fiber
  const instance = canHydrateInstance(
    nextInstance,
    fiber.type,
    fiber.pendingProps,
    rootOrSingletonContext,
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
  const textInstance = canHydrateTextInstance(
    nextInstance,
    text,
    rootOrSingletonContext,
  );
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
  const suspenseInstance = canHydrateSuspenseInstance(
    nextInstance,
    rootOrSingletonContext,
  );
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

function throwOnHydrationMismatch(fiber: Fiber) {
  throw new Error(
    'Hydration failed because the initial UI does not match what was ' +
      'rendered on the server.',
  );
}

function claimHydratableSingleton(fiber: Fiber): void {
  if (supportsSingletons) {
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

function tryToClaimNextHydratableInstance(fiber: Fiber): void {
  if (!isHydrating) {
    return;
  }

  // Validate that this is ok to render here before any mismatches.
  const currentHostContext = getHostContext();
  const shouldKeepWarning = validateHydratableInstance(
    fiber.type,
    fiber.pendingProps,
    currentHostContext,
  );

  const nextInstance = nextHydratableInstance;
  if (!nextInstance || !tryHydrateInstance(fiber, nextInstance)) {
    if (shouldKeepWarning) {
      warnNonHydratedInstance((hydrationParentFiber: any), fiber);
    }
    throwOnHydrationMismatch(fiber);
  }
}

function tryToClaimNextHydratableTextInstance(fiber: Fiber): void {
  if (!isHydrating) {
    return;
  }
  const text = fiber.pendingProps;

  let shouldKeepWarning = true;
  // Validate that this is ok to render here before any mismatches.
  const currentHostContext = getHostContext();
  shouldKeepWarning = validateHydratableTextInstance(text, currentHostContext);

  const nextInstance = nextHydratableInstance;
  if (!nextInstance || !tryHydrateText(fiber, nextInstance)) {
    if (shouldKeepWarning) {
      warnNonHydratedInstance((hydrationParentFiber: any), fiber);
    }
    throwOnHydrationMismatch(fiber);
  }
}

function tryToClaimNextHydratableSuspenseInstance(fiber: Fiber): void {
  if (!isHydrating) {
    return;
  }
  const nextInstance = nextHydratableInstance;
  if (!nextInstance || !tryHydrateSuspense(fiber, nextInstance)) {
    warnNonHydratedInstance((hydrationParentFiber: any), fiber);
    throwOnHydrationMismatch(fiber);
  }
}

export function tryToClaimNextHydratableFormMarkerInstance(
  fiber: Fiber,
): boolean {
  if (!isHydrating) {
    return false;
  }
  if (nextHydratableInstance) {
    const markerInstance = canHydrateFormStateMarker(
      nextHydratableInstance,
      rootOrSingletonContext,
    );
    if (markerInstance) {
      // Found the marker instance.
      nextHydratableInstance = getNextHydratableSibling(markerInstance);
      // Return true if this marker instance should use the state passed
      // to hydrateRoot.
      // TODO: As an optimization, Fizz should only emit these markers if form
      // state is passed at the root.
      return isFormStateMarkerMatching(markerInstance);
    }
  }
  // Should have found a marker instance. Throw an error to trigger client
  // rendering. We don't bother to check if we're in a concurrent root because
  // useFormState is a new API, so backwards compat is not an issue.
  throwOnHydrationMismatch(fiber);
  return false;
}

// Temp
let didWarnInvalidHydration = false;

function prepareToHydrateHostInstance(
  fiber: Fiber,
  hostContext: HostContext,
): void {
  if (!supportsHydration) {
    throw new Error(
      'Expected prepareToHydrateHostInstance() to never be called. ' +
        'This error is likely caused by a bug in React. Please file an issue.',
    );
  }

  const instance: Instance = fiber.stateNode;
  if (__DEV__) {
    const shouldWarnIfMismatchDev = !didSuspendOrErrorDEV;
    if (shouldWarnIfMismatchDev) {
      const differences = diffHydratedPropsForDevWarnings(
        instance,
        fiber.type,
        fiber.memoizedProps,
        hostContext,
      );
      if (differences !== null) {
        if (differences.children != null && !didWarnInvalidHydration) {
          didWarnInvalidHydration = true;
          const serverValue = differences.children;
          const clientValue = fiber.memoizedProps.children;
          console.error(
            'Text content did not match. Server: "%s" Client: "%s"',
            serverValue,
            clientValue,
          );
        }
        for (const propName in differences) {
          if (!differences.hasOwnProperty(propName)) {
            continue;
          }
          if (didWarnInvalidHydration) {
            break;
          }
          didWarnInvalidHydration = true;
          const serverValue = differences[propName];
          const clientValue = fiber.memoizedProps[propName];
          if (propName === 'children') {
            // Already handled above
          } else if (clientValue != null) {
            console.error(
              'Prop `%s` did not match. Server: %s Client: %s',
              propName,
              JSON.stringify(serverValue),
              JSON.stringify(clientValue),
            );
          } else {
            console.error('Extra attribute from the server: %s', propName);
          }
        }
      }
    }
  }

  const didHydrate = hydrateInstance(
    instance,
    fiber.type,
    fiber.memoizedProps,
    hostContext,
    fiber,
  );
  if (!didHydrate) {
    throw new Error('Text content does not match server-rendered HTML.');
  }
}

function prepareToHydrateHostTextInstance(fiber: Fiber): void {
  if (!supportsHydration) {
    throw new Error(
      'Expected prepareToHydrateHostTextInstance() to never be called. ' +
        'This error is likely caused by a bug in React. Please file an issue.',
    );
  }

  const textInstance: TextInstance = fiber.stateNode;
  const textContent: string = fiber.memoizedProps;
  const shouldWarnIfMismatchDev = !didSuspendOrErrorDEV;
  let parentProps = null;
  // We assume that prepareToHydrateHostTextInstance is called in a context where the
  // hydration parent is the parent host component of this host text.
  const returnFiber = hydrationParentFiber;
  if (returnFiber !== null) {
    switch (returnFiber.tag) {
      case HostRoot: {
        if (__DEV__) {
          if (shouldWarnIfMismatchDev) {
            const difference = diffHydratedTextForDevWarnings(
              textInstance,
              textContent,
              parentProps,
            );
            if (difference !== null && !didWarnInvalidHydration) {
              didWarnInvalidHydration = true;
              console.error(
                'Text content did not match. Server: "%s" Client: "%s"',
                difference,
                textContent,
              );
            }
          }
        }
        break;
      }
      case HostSingleton:
      case HostComponent: {
        parentProps = returnFiber.memoizedProps;
        if (__DEV__) {
          if (shouldWarnIfMismatchDev) {
            const difference = diffHydratedTextForDevWarnings(
              textInstance,
              textContent,
              parentProps,
            );
            if (difference !== null && !didWarnInvalidHydration) {
              didWarnInvalidHydration = true;
              console.error(
                'Text content did not match. Server: "%s" Client: "%s"',
                difference,
                textContent,
              );
            }
          }
        }
        break;
      }
    }
    // TODO: What if it's a SuspenseInstance?
  }

  const didHydrate = hydrateTextInstance(
    textInstance,
    textContent,
    fiber,
    parentProps,
  );
  if (!didHydrate) {
    throw new Error('Text content does not match server-rendered HTML.');
  }
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
  if (supportsSingletons) {
    // With float we never clear the Root, or Singleton instances. We also do not clear Instances
    // that have singleton text content
    if (
      fiber.tag !== HostRoot &&
      fiber.tag !== HostSingleton &&
      !(
        fiber.tag === HostComponent &&
        (!shouldDeleteUnhydratedTailInstances(fiber.type) ||
          shouldSetTextContent(fiber.type, fiber.memoizedProps))
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
    const nextInstance = nextHydratableInstance;
    if (nextInstance) {
      warnIfUnhydratedTailNodes(fiber);
      throwOnHydrationMismatch(fiber);
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
};
