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
import type {PriorityLevel} from 'ReactPriorityLevel';
import type {HostContext} from 'ReactFiberHostContext';
import type {HydrationContext} from 'ReactFiberHydrationContext';
import type {FiberRoot} from 'ReactFiberRoot';
import type {HostConfig} from 'ReactFiberReconciler';

var {reconcileChildFibers} = require('ReactChildFiber');
var {popContextProvider} = require('ReactFiberContext');
var ReactTypeOfWork = require('ReactTypeOfWork');
var ReactTypeOfSideEffect = require('ReactTypeOfSideEffect');
var ReactPriorityLevel = require('ReactPriorityLevel');
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
} = ReactTypeOfWork;
var {Placement, Ref, Update} = ReactTypeOfSideEffect;
var {OffscreenPriority} = ReactPriorityLevel;

if (__DEV__) {
  var ReactDebugCurrentFiber = require('ReactDebugCurrentFiber');
}

var invariant = require('fbjs/lib/invariant');

module.exports = function<T, P, I, TI, PI, C, CX, PL>(
  config: HostConfig<T, P, I, TI, PI, C, CX, PL>,
  hostContext: HostContext<C, CX>,
  hydrationContext: HydrationContext<C>,
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
    prepareToHydrateHostInstance,
    prepareToHydrateHostTextInstance,
    popHydrationState,
  } = hydrationContext;

  function markUpdate(workInProgress: Fiber) {
    // Tag the fiber with an update effect. This turns a Placement into
    // an UpdateAndPlacement.
    workInProgress.effectTag |= Update;
  }

  function markRef(workInProgress: Fiber) {
    workInProgress.effectTag |= Ref;
  }

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
  ) {
    var coroutine = (workInProgress.memoizedProps: ?ReactCoroutine);
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
    var yields: Array<mixed> = [];
    appendAllYields(yields, workInProgress);
    var fn = coroutine.handler;
    var props = coroutine.props;
    var nextChildren = fn(props, yields);

    var currentFirstChild = current !== null ? current.child : null;
    // Inherit the priority of the returnFiber.
    const priority = workInProgress.pendingWorkPriority;
    workInProgress.child = reconcileChildFibers(
      workInProgress,
      currentFirstChild,
      nextChildren,
      priority,
    );
    return workInProgress.child;
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
      ReactDebugCurrentFiber.setCurrentFiber(workInProgress, null);
    }

    // Get the latest props.
    let newProps = workInProgress.pendingProps;
    if (newProps === null) {
      newProps = workInProgress.memoizedProps;
    } else if (
      workInProgress.pendingWorkPriority !== OffscreenPriority ||
      renderPriority === OffscreenPriority
    ) {
      // Reset the pending props, unless this was a down-prioritization.
      workInProgress.pendingProps = null;
    }

    switch (workInProgress.tag) {
      case FunctionalComponent:
        return null;
      case ClassComponent: {
        // We are leaving this subtree, so pop context if any.
        popContextProvider(workInProgress);
        return null;
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
        return null;
      }
      case HostComponent: {
        popHostContext(workInProgress);
        const rootContainerInstance = getRootHostContainer();
        const type = workInProgress.type;
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
            markUpdate(workInProgress);
          }
          if (current.ref !== workInProgress.ref) {
            markRef(workInProgress);
          }
        } else {
          if (!newProps) {
            invariant(
              workInProgress.stateNode !== null,
              'We must have new props for new mounts. This error is likely ' +
                'caused by a bug in React. Please file an issue.',
            );
            // This can happen when we abort work.
            return null;
          }

          const currentHostContext = getHostContext();
          // TODO: Move createInstance to beginWork and keep it on a context
          // "stack" as the parent. Then append children as we go in beginWork
          // or completeWork depending on we want to add then top->down or
          // bottom->up. Top->down is faster in IE11.
          let wasHydrated = popHydrationState(workInProgress);
          if (wasHydrated) {
            // TOOD: Move this and createInstance step into the beginPhase
            // to consolidate.
            if (
              prepareToHydrateHostInstance(
                workInProgress,
                rootContainerInstance,
              )
            ) {
              // If changes to the hydrated node needs to be applied at the
              // commit-phase we mark this as such.
              markUpdate(workInProgress);
            }
          } else {
            let instance = createInstance(
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
              markUpdate(workInProgress);
            }
            workInProgress.stateNode = instance;
          }

          if (workInProgress.ref !== null) {
            // If there is a ref on a host node we need to schedule a callback
            markRef(workInProgress);
          }
        }
        return null;
      }
      case HostText: {
        let newText = newProps;
        if (current && workInProgress.stateNode != null) {
          const oldText = current.memoizedProps;
          // If we have an alternate, that means this is an update and we need
          // to schedule a side-effect to do the updates.
          if (oldText !== newText) {
            markUpdate(workInProgress);
          }
        } else {
          if (typeof newText !== 'string') {
            invariant(
              workInProgress.stateNode !== null,
              'We must have new props for new mounts. This error is likely ' +
                'caused by a bug in React. Please file an issue.',
            );
            // This can happen when we abort work.
            return null;
          }
          const rootContainerInstance = getRootHostContainer();
          const currentHostContext = getHostContext();
          let wasHydrated = popHydrationState(workInProgress);
          if (wasHydrated) {
            if (prepareToHydrateHostTextInstance(workInProgress)) {
              markUpdate(workInProgress);
            }
          } else {
            workInProgress.stateNode = createTextInstance(
              newText,
              rootContainerInstance,
              currentHostContext,
              workInProgress,
            );
          }
        }
        return null;
      }
      case CoroutineComponent:
        return moveCoroutineToHandlerPhase(current, workInProgress);
      case CoroutineHandlerPhase:
        // Reset the tag to now be a first phase coroutine.
        workInProgress.tag = CoroutineComponent;
        return null;
      case YieldComponent:
        // Does nothing.
        return null;
      case Fragment:
        return null;
      case HostPortal:
        // TODO: Only mark this as an update if we have any pending callbacks.
        markUpdate(workInProgress);
        popHostContainer(workInProgress);
        return null;
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
  }

  return {
    completeWork,
  };
};
