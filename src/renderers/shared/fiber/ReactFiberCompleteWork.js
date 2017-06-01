/**
 * Copyright 2013-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @providesModule ReactFiberCompleteWork
 * @flow
 */

'use strict';

import type {ReactCoroutine} from 'ReactTypes';
import type {Fiber} from 'ReactFiber';
import type {HostContext} from 'ReactFiberHostContext';
import type {HydrationContext} from 'ReactFiberHydrationContext';
import type {FiberRoot} from 'ReactFiberRoot';
import type {HostConfig} from 'ReactFiberReconciler';
import type {PriorityLevel} from 'ReactPriorityLevel';

var {largerPriority, transferEffectsToParent} = require('ReactFiber');
var {reconcile} = require('ReactFiberBeginWork');
var {getUpdatePriority} = require('ReactFiberUpdateQueue');
var {popContextProvider} = require('ReactFiberContext');
var {
  IndeterminateComponent,
  FunctionalComponent,
  ClassComponent,
  HostRoot,
  HostComponent,
  HostText,
  HostPortal,
  CoroutineComponent,
  CoroutineHandlerPhase,
  YieldComponent,
  Fragment,
} = require('ReactTypeOfWork');
var {Placement, Update} = require('ReactTypeOfSideEffect');
var {NoWork} = require('ReactPriorityLevel');

if (__DEV__) {
  var ReactDebugCurrentFiber = require('ReactDebugCurrentFiber');
}

var invariant = require('fbjs/lib/invariant');

exports.CompleteWork = function<T, P, I, TI, PI, C, CX, PL>(
  config: HostConfig<T, P, I, TI, PI, C, CX, PL>,
  hostContext: HostContext<C, CX>,
  hydrationContext: HydrationContext<I, TI, C>,
) {
  const {
    createInstance,
    createTextInstance,
    appendInitialChild,
    finalizeInitialChildren,
    prepareUpdate,
  } = config;

  const {
    getRootHostContainer,
    popHostContext,
    getHostContext,
    popHostContainer,
  } = hostContext;

  const {
    hydrateHostInstance,
    hydrateHostTextInstance,
    popHydrationState,
  } = hydrationContext;

  function appendAllYields(yields: Array<mixed>, workInProgress: Fiber) {
    let node = workInProgress.stateNode;
    if (node) {
      node.return = workInProgress;
    }
    while (node !== null) {
      if (
        node.tag === HostComponent ||
        node.tag === HostText ||
        node.tag === HostPortal
      ) {
        invariant(false, 'A coroutine cannot have host component children.');
      } else if (node.tag === YieldComponent) {
        yields.push(node.type);
      } else if (node.child !== null) {
        node.child.return = node;
        node = node.child;
        continue;
      }
      while (node.sibling === null) {
        if (node.return === null || node.return === workInProgress) {
          return;
        }
        node = node.return;
      }
      node.sibling.return = node.return;
      node = node.sibling;
    }
  }

  function moveCoroutineToHandlerPhase(
    current: Fiber | null,
    workInProgress: Fiber,
    renderPriority: PriorityLevel,
  ): Fiber | null {
    const coroutine = (workInProgress.memoizedProps: ?ReactCoroutine);
    invariant(
      coroutine,
      'Should be resolved by now. This error is likely caused by a bug in ' +
        'React. Please file an issue.',
    );

    // First step of the coroutine has completed. Now we need to do the second.
    // TODO: It would be nice to have a multi stage coroutine represented by a
    // single component, or at least tail call optimize nested ones. Currently
    // that requires additional fields that we don't want to add to the fiber.
    // So this requires nested handlers.
    // Note: This doesn't mutate the alternate node. I don't think it needs to
    // since this stage is reset for every pass.
    workInProgress.tag = CoroutineHandlerPhase;

    // Build up the yields.
    // TODO: Compare this to a generator or opaque helpers like Children.
    const yields: Array<mixed> = [];
    appendAllYields(yields, workInProgress);
    const fn = coroutine.handler;
    const props = coroutine.props;
    const nextChildren = fn(props, yields);

    return reconcile(
      current,
      workInProgress,
      nextChildren,
      coroutine,
      null,
      renderPriority,
    );
  }

  function appendAllChildren(parent: I, workInProgress: Fiber) {
    // We only have the top Fiber that was created but we need recurse down its
    // children to find all the terminal nodes.
    let node = workInProgress.child;
    while (node !== null) {
      if (node.tag === HostComponent || node.tag === HostText) {
        appendInitialChild(parent, node.stateNode);
      } else if (node.tag === HostPortal) {
        // If we have a portal child, then we don't want to traverse
        // down its children. Instead, we'll get insertions from each child in
        // the portal directly.
      } else if (node.child !== null) {
        node = node.child;
        continue;
      }
      if (node === workInProgress) {
        return;
      }
      while (node.sibling === null) {
        if (node.return === null || node.return === workInProgress) {
          return;
        }
        node = node.return;
      }
      node = node.sibling;
    }
  }

  function completeWork(
    current: Fiber | null,
    workInProgress: Fiber,
    renderPriority: PriorityLevel,
  ): Fiber | null {
    if (__DEV__) {
      ReactDebugCurrentFiber.current = workInProgress;
    }

    let next = null;

    switch (workInProgress.tag) {
      case FunctionalComponent:
        break;
      case ClassComponent: {
        // We are leaving this subtree, so pop context if any.
        popContextProvider(workInProgress);
        break;
      }
      case HostRoot: {
        // TODO: Pop the host container after #8607 lands.
        const fiberRoot = (workInProgress.stateNode: FiberRoot);
        if (fiberRoot.pendingContext) {
          fiberRoot.context = fiberRoot.pendingContext;
          fiberRoot.pendingContext = null;
        }
        if (current === null || current.child === null) {
          // If we hydrated, pop so that we can delete any remaining children
          // that weren't hydrated.
          popHydrationState(workInProgress);
          // This resets the hacky state to fix isMounted before committing.
          // TODO: Delete this when we delete isMounted and findDOMNode.
          workInProgress.effectTag &= ~Placement;
        }
        break;
      }
      case HostComponent: {
        popHostContext(workInProgress);
        const rootContainerInstance = getRootHostContainer();
        const type = workInProgress.type;
        const newProps = workInProgress.memoizedProps;
        if (current !== null && workInProgress.stateNode != null) {
          // If we have an alternate, that means this is an update and we need to
          // schedule a side-effect to do the updates.
          const oldProps = current.memoizedProps;
          // If we get updated because one of our children updated, we don't
          // have newProps so we'll have to reuse them.
          // TODO: Split the update API as separate for the props vs. children.
          // Even better would be if children weren't special cased at all tho.
          const instance: I = workInProgress.stateNode;
          const currentHostContext = getHostContext();
          const updatePayload = prepareUpdate(
            instance,
            type,
            oldProps,
            newProps,
            rootContainerInstance,
            currentHostContext,
          );

          // TODO: Type this specific to this type of component.
          workInProgress.updateQueue = (updatePayload: any);
          // If the update payload indicates that there is a change or if there
          // is a new ref we mark this as an update.
          if (updatePayload) {
            workInProgress.effectTag |= Update;
          }
        } else {
          if (newProps === null) {
            invariant(
              workInProgress.stateNode !== null,
              'We must have new props for new mounts. This error is likely ' +
                'caused by a bug in React. Please file an issue.',
            );
            // This can happen when we abort work.
            break;
          }

          const currentHostContext = getHostContext();
          // TODO: Move createInstance to beginWork and keep it on a context
          // "stack" as the parent. Then append children as we go in beginWork
          // or completeWork depending on we want to add then top->down or
          // bottom->up. Top->down is faster in IE11.
          let instance;
          let wasHydrated = popHydrationState(workInProgress);
          if (wasHydrated) {
            instance = hydrateHostInstance(
              workInProgress,
              rootContainerInstance,
            );
          } else {
            instance = createInstance(
              type,
              newProps,
              rootContainerInstance,
              currentHostContext,
              workInProgress,
            );

            appendAllChildren(instance, workInProgress);

            // Certain renderers require commit-time effects for initial mount.
            // (eg DOM renderer supports auto-focus for certain elements).
            // Make sure such renderers get scheduled for later work.
            if (
              finalizeInitialChildren(
                instance,
                type,
                newProps,
                rootContainerInstance,
              )
            ) {
              workInProgress.effectTag |= Update;
            }
          }

          workInProgress.stateNode = instance;
        }
        break;
      }
      case HostText: {
        let newText = workInProgress.memoizedProps;
        if (current && workInProgress.stateNode != null) {
          const oldText = current.memoizedProps;
          // If we have an alternate, that means this is an update and we need
          // to schedule a side-effect to do the updates.
          if (oldText !== newText) {
            workInProgress.effectTag |= Update;
          }
        } else {
          if (typeof newText !== 'string') {
            invariant(
              workInProgress.stateNode !== null,
              'We must have new props for new mounts. This error is likely ' +
                'caused by a bug in React. Please file an issue.',
            );
            // This can happen when we abort work.
            break;
          }
          const rootContainerInstance = getRootHostContainer();
          const currentHostContext = getHostContext();
          let textInstance;
          let wasHydrated = popHydrationState(workInProgress);
          if (wasHydrated) {
            textInstance = hydrateHostTextInstance(workInProgress);
          } else {
            textInstance = createTextInstance(
              newText,
              rootContainerInstance,
              currentHostContext,
              workInProgress,
            );
          }
          workInProgress.stateNode = textInstance;
        }
        break;
      }
      case CoroutineComponent:
        next = moveCoroutineToHandlerPhase(
          current,
          workInProgress,
          renderPriority,
        );
        break;
      case CoroutineHandlerPhase:
        // Reset the tag to now be a first phase coroutine.
        workInProgress.tag = CoroutineComponent;
        break;
      case YieldComponent:
        // Does nothing.
        break;
      case Fragment:
        break;
      case HostPortal:
        // TODO: Only mark this as an update if we have any pending callbacks.
        workInProgress.effectTag |= Update;
        popHostContainer(workInProgress);
        break;
      // Error cases
      case IndeterminateComponent:
        invariant(
          false,
          'An indeterminate component should have become determinate before ' +
            'completing. This error is likely caused by a bug in React. Please ' +
            'file an issue.',
        );
      // eslint-disable-next-line no-fallthrough
      default:
        invariant(
          false,
          'Unknown unit of work tag. This error is likely caused by a bug in ' +
            'React. Please file an issue.',
        );
    }

    // Work in this tree was just completed. There may be lower priority
    // remaining. Reset the work priority by bubbling it up from the children.
    let remainingWorkPriority = workInProgress.pendingWorkPriority !==
      renderPriority
      ? // If the work priority is lower than the render priority, this must
        // have been a bailout. Keep the existing priority so that we can come
        // back to it later.
        workInProgress.pendingWorkPriority
      : // Otherwise, there's no more work on this fiber. There may be work
        // in the children, though, which we'll handle below.
        NoWork;

    const childrenAreDeprioritized =
      remainingWorkPriority === NoWork ||
      remainingWorkPriority < workInProgress.pendingWorkPriority;

    // Bubble priority from the children, unless they were deprioritized.
    if (childrenAreDeprioritized) {
      let child = workInProgress.child;
      if (current === null || child !== current.child) {
        // The children are a work-in-progress set. Bubble up both the work
        // priority and the update priority.
        while (child !== null) {
          remainingWorkPriority = largerPriority(
            remainingWorkPriority,
            child.pendingWorkPriority,
          );
          remainingWorkPriority = largerPriority(
            remainingWorkPriority,
            getUpdatePriority(child),
          );
          child = child.sibling;
        }
      } else {
        // The children are the current children. That means this was a bailout.
        // Work priority should only be bubbled up from the work-in-progress
        // tree, so don't bubble it up here. But update priority should be
        // bubbled up regardless, in case there are low priority updates in
        // the children.
        while (child !== null) {
          remainingWorkPriority = largerPriority(
            remainingWorkPriority,
            getUpdatePriority(child),
          );
          child = child.sibling;
        }
      }
    }
    workInProgress.pendingWorkPriority = remainingWorkPriority;

    // Transfer effects list to the parent
    if (workInProgress.return !== null) {
      transferEffectsToParent(workInProgress.return, workInProgress);
    }

    return next;
  }

  return {
    completeWork,
  };
};
