/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import type {ReactContext} from 'shared/ReactTypes';
import type {Fiber} from './ReactFiber';
import type {StackCursor} from './ReactFiberStack';
import type {ExpirationTime} from './ReactFiberExpirationTime';
import {ReifiedWorkMode} from './ReactTypeOfMode';

export type ContextDependency<T> = {
  context: ReactContext<T>,
  observedBits: number,
  next: ContextDependency<mixed> | null,
  ...
};

import {isPrimaryRenderer} from './ReactFiberHostConfig';
import {createCursor, push, pop} from './ReactFiberStack';
import MAX_SIGNED_31_BIT_INT from './maxSigned31BitInt';
import {
  ContextProvider,
  ClassComponent,
  DehydratedFragment,
} from 'shared/ReactWorkTags';

import invariant from 'shared/invariant';
import is from 'shared/objectIs';
import {
  createUpdate,
  enqueueUpdate,
  ForceUpdate,
} from 'react-reconciler/src/ReactUpdateQueue';
import {NoWork} from './ReactFiberExpirationTime';
import {markWorkInProgressReceivedUpdate} from './ReactFiberBeginWork';
import {
  enableSuspenseServerRenderer,
  enableContextReaderPropagation,
  enableReifyNextWork,
} from 'shared/ReactFeatureFlags';

const valueCursor: StackCursor<mixed> = createCursor(null);

let rendererSigil;
if (__DEV__) {
  // Use this to detect multiple renderers using the same context
  rendererSigil = {};
}

let currentlyRenderingFiber: Fiber | null = null;
let lastContextDependency: ContextDependency<mixed> | null = null;
let lastContextWithAllBitsObserved: ReactContext<any> | null = null;
let lastPreviousContextDependency: ContextDependency<mixed> | null;
if (enableContextReaderPropagation) {
  // this module global tracks the context dependency in the same slot as the
  // lastContextDependency from the previously committed render
  lastPreviousContextDependency = null;
}

let isDisallowedContextReadInDEV: boolean = false;

export function resetContextDependencies(): void {
  // This is called right before React yields execution, to ensure `readContext`
  // cannot be called outside the render phase.
  currentlyRenderingFiber = null;
  lastContextDependency = null;
  lastContextWithAllBitsObserved = null;
  if (__DEV__) {
    isDisallowedContextReadInDEV = false;
  }
}

export function enterDisallowedContextReadInDEV(): void {
  if (__DEV__) {
    isDisallowedContextReadInDEV = true;
  }
}

export function exitDisallowedContextReadInDEV(): void {
  if (__DEV__) {
    isDisallowedContextReadInDEV = false;
  }
}

let pushedCount = 0;

export function pushProvider<T>(providerFiber: Fiber, nextValue: T): void {
  const context: ReactContext<T> = providerFiber.type._context;

  // console.log(`<====PUSH========= ${++pushedCount} pushed providers`);

  if (enableContextReaderPropagation) {
    // push the previousReaders onto the stack
    push(valueCursor, context._currentReaders, providerFiber);
    context._currentReaders = providerFiber.memoizedState;
  }

  if (isPrimaryRenderer) {
    push(valueCursor, context._currentValue, providerFiber);

    context._currentValue = nextValue;
    if (__DEV__) {
      if (
        context._currentRenderer !== undefined &&
        context._currentRenderer !== null &&
        context._currentRenderer !== rendererSigil
      ) {
        console.error(
          'Detected multiple renderers concurrently rendering the ' +
            'same context provider. This is currently unsupported.',
        );
      }
      context._currentRenderer = rendererSigil;
    }
  } else {
    push(valueCursor, context._currentValue2, providerFiber);

    context._currentValue2 = nextValue;
    if (__DEV__) {
      if (
        context._currentRenderer2 !== undefined &&
        context._currentRenderer2 !== null &&
        context._currentRenderer2 !== rendererSigil
      ) {
        console.error(
          'Detected multiple renderers concurrently rendering the ' +
            'same context provider. This is currently unsupported.',
        );
      }
      context._currentRenderer2 = rendererSigil;
    }
  }
}

export function popProvider(providerFiber: Fiber): void {
  const currentValue = valueCursor.current;
  // console.log(`======POP========> ${--pushedCount} pushed providers`);

  pop(valueCursor, providerFiber);

  const context: ReactContext<any> = providerFiber.type._context;
  if (isPrimaryRenderer) {
    context._currentValue = currentValue;
  } else {
    context._currentValue2 = currentValue;
  }

  if (enableContextReaderPropagation) {
    // pop the previousReaders off the stack and restore
    let previousReaders = pop(valueCursor, providerFiber);
    context._currentReaders = previousReaders;
  }
}

export function calculateChangedBits<T>(
  context: ReactContext<T>,
  newValue: T,
  oldValue: T,
) {
  if (is(oldValue, newValue)) {
    // No change
    return 0;
  } else {
    const changedBits =
      typeof context._calculateChangedBits === 'function'
        ? context._calculateChangedBits(oldValue, newValue)
        : MAX_SIGNED_31_BIT_INT;

    if (__DEV__) {
      if ((changedBits & MAX_SIGNED_31_BIT_INT) !== changedBits) {
        console.error(
          'calculateChangedBits: Expected the return value to be a ' +
            '31-bit integer. Instead received: %s',
          changedBits,
        );
      }
    }
    return changedBits | 0;
  }
}

export function scheduleWorkOnParentPath(
  parent: Fiber | null,
  renderExpirationTime: ExpirationTime,
) {
  // Update the child expiration time of all the ancestors, including
  // the alternates.
  let node = parent;
  while (node !== null) {
    let alternate = node.alternate;
    if (node.childExpirationTime < renderExpirationTime) {
      node.childExpirationTime = renderExpirationTime;
      if (enableReifyNextWork) {
        node.mode &= ~ReifiedWorkMode;
      }
      if (
        alternate !== null &&
        alternate.childExpirationTime < renderExpirationTime
      ) {
        alternate.childExpirationTime = renderExpirationTime;
        if (enableReifyNextWork) {
          alternate.mode &= ~ReifiedWorkMode;
        }
      }
    } else if (
      alternate !== null &&
      alternate.childExpirationTime < renderExpirationTime
    ) {
      alternate.childExpirationTime = renderExpirationTime;
      if (enableReifyNextWork) {
        alternate.mode &= ~ReifiedWorkMode;
      }
    } else {
      // Neither alternate was updated, which means the rest of the
      // ancestor path already has sufficient priority.
      break;
    }
    node = node.return;
  }
}

export function propagateContextChange(
  workInProgress: Fiber,
  context: ReactContext<mixed>,
  changedBits: number,
  renderExpirationTime: ExpirationTime,
): void {
  if (enableContextReaderPropagation) {
    // instead of the traditional propagation we are going to use
    // readers exclusively to fast path to dependent fibers
    return propagateContextChangeToReaders(
      workInProgress,
      context,
      changedBits,
      renderExpirationTime,
    );
  }
  let fiber = workInProgress.child;
  if (fiber !== null) {
    // Set the return pointer of the child to the work-in-progress fiber.
    fiber.return = workInProgress;
  }
  while (fiber !== null) {
    let nextFiber;

    // Visit this fiber.
    const list = fiber.dependencies;
    if (list !== null) {
      nextFiber = fiber.child;

      let dependency = list.firstContext;
      while (dependency !== null) {
        // Check if the context matches.
        if (
          dependency.context === context &&
          (dependency.observedBits & changedBits) !== 0
        ) {
          // Match! Schedule an update on this fiber.

          if (fiber.tag === ClassComponent) {
            // Schedule a force update on the work-in-progress.
            const update = createUpdate(renderExpirationTime, null);
            update.tag = ForceUpdate;
            // TODO: Because we don't have a work-in-progress, this will add the
            // update to the current fiber, too, which means it will persist even if
            // this render is thrown away. Since it's a race condition, not sure it's
            // worth fixing.
            enqueueUpdate(fiber, update);
          }

          if (fiber.expirationTime < renderExpirationTime) {
            fiber.expirationTime = renderExpirationTime;
            if (enableReifyNextWork) {
              fiber.mode &= ~ReifiedWorkMode;
            }
          }
          let alternate = fiber.alternate;
          if (
            alternate !== null &&
            alternate.expirationTime < renderExpirationTime
          ) {
            alternate.expirationTime = renderExpirationTime;
            if (enableReifyNextWork) {
              alternate.mode &= ~ReifiedWorkMode;
            }
          }

          scheduleWorkOnParentPath(fiber.return, renderExpirationTime);

          // Mark the expiration time on the list, too.
          if (list.expirationTime < renderExpirationTime) {
            list.expirationTime = renderExpirationTime;
          }

          // Since we already found a match, we can stop traversing the
          // dependency list.
          break;
        }
        dependency = dependency.next;
      }
    } else if (fiber.tag === ContextProvider) {
      // Don't scan deeper if this is a matching provider
      nextFiber = fiber.type === workInProgress.type ? null : fiber.child;
    } else if (
      enableSuspenseServerRenderer &&
      fiber.tag === DehydratedFragment
    ) {
      // If a dehydrated suspense bounudary is in this subtree, we don't know
      // if it will have any context consumers in it. The best we can do is
      // mark it as having updates.
      let parentSuspense = fiber.return;
      invariant(
        parentSuspense !== null,
        'We just came from a parent so we must have had a parent. This is a bug in React.',
      );
      if (parentSuspense.expirationTime < renderExpirationTime) {
        parentSuspense.expirationTime = renderExpirationTime;
      }
      let alternate = parentSuspense.alternate;
      if (
        alternate !== null &&
        alternate.expirationTime < renderExpirationTime
      ) {
        alternate.expirationTime = renderExpirationTime;
      }
      // This is intentionally passing this fiber as the parent
      // because we want to schedule this fiber as having work
      // on its children. We'll use the childExpirationTime on
      // this fiber to indicate that a context has changed.
      scheduleWorkOnParentPath(parentSuspense, renderExpirationTime);
      nextFiber = fiber.sibling;
    } else {
      // Traverse down.
      nextFiber = fiber.child;
    }

    if (nextFiber !== null) {
      // Set the return pointer of the child to the work-in-progress fiber.
      nextFiber.return = fiber;
    } else {
      // No child. Traverse to next sibling.
      nextFiber = fiber;
      while (nextFiber !== null) {
        if (nextFiber === workInProgress) {
          // We're back to the root of this subtree. Exit.
          nextFiber = null;
          break;
        }
        let sibling = nextFiber.sibling;
        if (sibling !== null) {
          // Set the return pointer of the sibling to the work-in-progress fiber.
          sibling.return = nextFiber.return;
          nextFiber = sibling;
          break;
        }
        // No more siblings. Traverse up.
        nextFiber = nextFiber.return;
      }
    }
    fiber = nextFiber;
  }
}

export function prepareToReadContext(
  workInProgress: Fiber,
  renderExpirationTime: ExpirationTime,
): void {
  currentlyRenderingFiber = workInProgress;
  lastContextDependency = null;
  lastContextWithAllBitsObserved = null;
  if (enableContextReaderPropagation) {
    lastPreviousContextDependency = null;
  }

  const dependencies = workInProgress.dependencies;
  if (dependencies !== null) {
    const firstContext = dependencies.firstContext;
    if (enableContextReaderPropagation) {
      dependencies.previousFirstContext = firstContext;
      lastPreviousContextDependency = dependencies.previousFirstContext;
    }
    if (firstContext !== null) {
      if (dependencies.expirationTime >= renderExpirationTime) {
        // Context list has a pending update. Mark that this fiber performed work.
        markWorkInProgressReceivedUpdate();
      }
      // Reset the work-in-progress list
      dependencies.firstContext = null;
    }
  }
}

export function peekContext<T>(context: ReactContext<T>): T {
  return isPrimaryRenderer ? context._currentValue : context._currentValue2;
}

function propagateContextChangeToReaders(
  workInProgress: Fiber,
  context: ReactContext<mixed>,
  changedBits: number,
  renderExpirationTime: ExpirationTime,
) {
  let state = workInProgress.memoizedState;
  if (state === null) {
    // this Provider has no readers to propagate to
    return;
  } else {
    let reader = state.firstReader;
    while (reader !== null) {
      // notify each read of the context change
      reader.notify(context, changedBits, renderExpirationTime);
      reader = reader.next;
    }
  }
}

export function attachReader(contextItem) {
  if (enableContextReaderPropagation) {
    let context = contextItem.context;
    // consider using bind on detachReader (the cleanup function) to avoid having to keep the closure alive
    // for now we can just capture the currently rendering fiber for use in notify and cleanup
    let readerFiber = currentlyRenderingFiber;
    let currentReaders = context._currentReaders;
    if (currentReaders == null) {
      currentReaders = {firstReader: null};
      context._currentReaders = currentReaders;
    }
    let initialFirstReader = currentReaders.firstReader;
    // readers are a doubly linked list of notify functions. the provide providers with direct access
    // to fibers which currently do or have in the past read from this provider to allow avoiding the
    // tree walk involved with propagation. This allows the time complexity of propagation to match the
    // number of readers rather than the tree size
    // it is doubly linked to allow for O(1) insert and removal. we could do singly
    // and get O(1) insert and O(n) removal but for providers with many readers this felt more prudent
    let reader = {
      // @TODO switch to bind over using a closure
      notify: (notifyingContext, changedBits, renderExpirationTime) => {
        let list = readerFiber.dependencies;
        let alternate = readerFiber.alternate;
        let alternateList = alternate !== null ? alternate.dependencies : null;
        // if the list already has the necessary expriation on it AND the alternate if it exists
        // then we can bail out of notification
        if (
          list.expirationTime >= renderExpirationTime &&
          readerFiber.expirationTime >= renderExpirationTime &&
          (alternate === null ||
            (alternateList !== null &&
              alternateList.expirationTime >= renderExpirationTime &&
              alternate.expriationTime >= renderExpirationTime))
        ) {
          return;
        }
        let dependency = list.firstContext;
        while (dependency !== null) {
          // Check if the context matches.
          if (
            dependency.context === notifyingContext &&
            (dependency.observedBits & changedBits) !== 0
          ) {
            // Match! Schedule an update on this fiber.

            if (readerFiber.tag === ClassComponent) {
              // Schedule a force update on the work-in-progress.
              const update = createUpdate(renderExpirationTime, null);
              update.tag = ForceUpdate;
              // TODO: Because we don't have a work-in-progress, this will add the
              // update to the current fiber, too, which means it will persist even if
              // this render is thrown away. Since it's a race condition, not sure it's
              // worth fixing.
              enqueueUpdate(readerFiber, update);
            }

            if (readerFiber.expirationTime < renderExpirationTime) {
              readerFiber.expirationTime = renderExpirationTime;
              if (enableReifyNextWork) {
                readerFiber.mode &= ~ReifiedWorkMode;
              }
            }
            if (
              alternate !== null &&
              alternate.expirationTime < renderExpirationTime
            ) {
              alternate.expirationTime = renderExpirationTime;
              if (enableReifyNextWork) {
                alternate.mode &= ~ReifiedWorkMode;
              }
            }

            scheduleWorkOnParentPath(readerFiber.return, renderExpirationTime);

            // Mark the expiration time on the list and if it exists the alternate's list
            if (list.expirationTime < renderExpirationTime) {
              list.expirationTime = renderExpirationTime;
            }
            if (alternateList !== null) {
              if (alternateList.expirationTime < renderExpirationTime) {
                alternateList.expirationTime = renderExpirationTime;
              }
            }

            // Since we already found a match, we can stop traversing the
            // dependency list.
            break;
          }
          dependency = dependency.next;
        }
      },
      next: null,
      prev: null,
    };
    if (__DEV__) {
      // can be useful in distinguishing readers during debugging
      // @TODO remove in the future
      reader._tag = Math.random()
        .toString(36)
        .substring(2, 6);
      reader._currentReaders = currentReaders;
    }
    currentReaders.firstReader = reader;
    if (initialFirstReader !== null) {
      reader.next = initialFirstReader;
      initialFirstReader.prev = reader;
    }
    // return the cleanup function
    // @TODO switch to bind instead of closure capture
    return () => {
      detachReader(currentReaders, reader);
    };
  }
}

function detachReader(currentReaders, reader) {
  if (enableContextReaderPropagation) {
    if (currentReaders.firstReader === reader) {
      // if we are detaching the first item point our currentReaders
      // to the next item first
      currentReaders.firstReader = reader.next;
    }
    if (reader.next !== null) {
      reader.next.prev = reader.prev;
    }
    if (reader.prev !== null) {
      reader.prev.next = reader.next;
    }
    reader.prev = reader.next = null;
  }
}

export function cleanupReadersOnUnmount(fiber: Fiber) {
  if (enableContextReaderPropagation) {
    let dependencies = fiber.dependencies;
    if (dependencies !== null) {
      let {cleanupSet, firstContext} = dependencies;
      if (cleanupSet !== null) {
        // this fiber hosted a complex reader where cleanup functions were stored
        // in a set
        let iter = cleanupSet.values();
        for (let step = iter.next(); !step.done; step = iter.next()) {
          step.value();
        }
      } else if (firstContext !== null) {
        // this fiber hosted a simple reader list
        let contextItem = firstContext;
        while (contextItem !== null) {
          contextItem.cleanup();
          contextItem = contextItem.next;
        }
      }
    }
  }
}

export function readContext<T>(
  context: ReactContext<T>,
  observedBits: void | number | boolean,
): T {
  if (__DEV__) {
    // This warning would fire if you read context inside a Hook like useMemo.
    // Unlike the class check below, it's not enforced in production for perf.
    if (isDisallowedContextReadInDEV) {
      console.error(
        'Context can only be read while React is rendering. ' +
          'In classes, you can read it in the render method or getDerivedStateFromProps. ' +
          'In function components, you can read it directly in the function body, but not ' +
          'inside Hooks like useReducer() or useMemo().',
      );
    }
  }

  if (lastContextWithAllBitsObserved === context) {
    // Nothing to do. We already observe everything in this context.
  } else if (observedBits === false || observedBits === 0) {
    // Do not observe any updates.
  } else {
    let resolvedObservedBits; // Avoid deopting on observable arguments or heterogeneous types.
    if (
      typeof observedBits !== 'number' ||
      observedBits === MAX_SIGNED_31_BIT_INT
    ) {
      // Observe all updates.
      lastContextWithAllBitsObserved = ((context: any): ReactContext<mixed>);
      resolvedObservedBits = MAX_SIGNED_31_BIT_INT;
    } else {
      resolvedObservedBits = observedBits;
    }

    let contextItem = {
      context: ((context: any): ReactContext<mixed>),
      observedBits: resolvedObservedBits,
      next: null,
    };

    if (lastContextDependency === null) {
      invariant(
        currentlyRenderingFiber !== null,
        'Context can only be read while React is rendering. ' +
          'In classes, you can read it in the render method or getDerivedStateFromProps. ' +
          'In function components, you can read it directly in the function body, but not ' +
          'inside Hooks like useReducer() or useMemo().',
      );

      // This is the first dependency for this component. Create a new list.
      lastContextDependency = contextItem;

      if (enableContextReaderPropagation) {
        let existingContextSet = null;
        let existingCleanupSet = null;
        let previousFirstContext = null;

        let dependencies = currentlyRenderingFiber.dependencies;
        if (dependencies !== null) {
          existingContextSet = dependencies.contextSet;
          existingCleanupSet = dependencies.cleanupSet;
          previousFirstContext = dependencies.previousFirstContext;
        }

        currentlyRenderingFiber.dependencies = {
          expirationTime: NoWork,
          firstContext: contextItem,
          previousFirstContext: previousFirstContext,
          contextSet: existingContextSet,
          cleanupSet: existingCleanupSet,
          responders: null,
        };
      } else {
        currentlyRenderingFiber.dependencies = {
          expirationTime: NoWork,
          firstContext: contextItem,
          responders: null,
        };
      }
    } else {
      // Append a new context item.
      lastContextDependency = lastContextDependency.next = contextItem;
    }
    if (enableContextReaderPropagation) {
      // there are two methods of tracking context reader fibers. For most fibers that
      // read contexts the reads are stable over each render. ClassComponents, ContextConsumer,
      // most uses of useContext, etc... However if you use readContext, or you change observedBits
      // from render to render, or pass different contexts into useContext it is possible that the
      // contexts you read from and their order in the dependency list won't be stable across renders
      //
      // the main goal is to attach readers during render so that we are included in the set of
      // "fibers that need to know about new context values provided but they current provider"
      // it is ok if we don't end up depending on that context in the future, it is safe to still
      // be notified about future changes which is why this can be done during render phase
      //
      // cleaning up is trickier. we can only safely do that on umount because any given render could
      // be yielded / thrown and not complete and we need to be able to restart without having
      // a chance to restore the reader
      //
      // the algorithm here boils down to
      //
      // 1. if this is the first render we read from a context, attach readers for every context dependency. This may mean
      //     we have duplicates (especially in dev mode with useContext since the render function is called)
      //     twice
      //
      // 2. if this is not the first render on which we read from a context, check to see if each new
      //     dependency has the same context as the the dependency in this same slot of the list
      //     from the last committed render. if so we're in the stable case and can just copy the cleanup function
      //     over to the new contextItem; no need to call attach again.
      //
      // 3. instead if we find a conflicting context for this slot in the contextItem list
      //     we enter advanced tracking mode which creates a context Set and a cleanup Set
      //     these two sets will hold the maximal set of contexts attached to and cleanup
      //     functions related to said attachment gathered from the previous list, in addition
      //     to the current contextItem, attaching if necessary.
      //
      // 4. instead if we were already in advanced tracking mode we simply see if the current
      //     contextItem has a novel context and we attach it and store the cleanup function as necessary
      //
      // Note about memory leaks:
      // this implementation does allow for some leakage. in particular if you read from fewer contexts
      // on a second render we will 'lose' the initial cleanup functions since we do not activate advancedMode
      // in that case. for the time being I'm not tackling that but there are a few ways I can imagine we do
      // namely, move the list checking to the prepare step or calling a finalizer to complement the prepare
      // step after the render invocation is finished
      // additionally, it is technically not necessary to keep dead readers around (the reader for a context)
      // no longer read from, but cleaning that up would add more code complexity, possibly lengthen the commit phase
      // and leaving them is generally harmless since the nofication won't result in any work being scheduled
      //
      // @TODO the cleanupSet does not need to be a set, make it an array and simply push to it
      if (lastPreviousContextDependency !== null) {
        // previous list exists, we can see if we need to enter advanced
        let dependencies = currentlyRenderingFiber.dependencies;
        let {contextSet, cleanupSet} = dependencies;
        if (contextSet !== null) {
          // this fiber is already in complex tracking mode. let's attach if needed and add to sets
          if (!contextSet.has(context)) {
            cleanupSet.add(attachReader(contextItem));
            contextSet.add(context);
          }
        } else if (
          dependencies.contextSet === null &&
          lastContextDependency.context !==
            lastPreviousContextDependency.context
        ) {
          // this fiber needs to switch to advanced tracking mode
          contextSet = new Set();
          cleanupSet = new Set();

          // fill the sets with everything from the previous commit
          let currentDependency = dependencies.previousFirstContext;
          while (currentDependency !== null) {
            contextSet.add(currentDependency.context);
            cleanupSet.add(currentDependency.cleanup);
            currentDependency = currentDependency.next;
          }
          // attach and add this latest context if necessary
          if (!contextSet.has(context)) {
            cleanupSet.add(attachReader(contextItem));
            contextSet.add(context);
          }
          currentlyRenderingFiber.dependencies.contextSet = contextSet;
          currentlyRenderingFiber.dependencies.cleanupSet = cleanupSet;
        } else {
          // in quick mode and context dependency has not changed, copy cleanup over
          contextItem.cleanup = lastPreviousContextDependency.cleanup;
        }

        // advance the lastPreviousContextDependency pointer in conjunction with each new contextItem.
        // if it is null we don't advance it which means if another readContext happens in this pass
        // for a different context we will end up entering advanced mode
        if (lastPreviousContextDependency.next !== null) {
          lastPreviousContextDependency = lastPreviousContextDependency.next;
        }
      } else {
        // lastPreviousContextDependency does not exist so treating it like a mount and attaching readers
        contextItem.cleanup = attachReader(contextItem);
      }
    }
  }
  return isPrimaryRenderer ? context._currentValue : context._currentValue2;
}
