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

import type { ReactCoroutine } from 'ReactCoroutine';
import type { Fiber } from 'ReactFiber';
import type { HostContext } from 'ReactFiberHostContext';
import type { FiberRoot } from 'ReactFiberRoot';
import type { HostConfig } from 'ReactFiberReconciler';
import type { ReifiedYield } from 'ReactReifiedYield';

var { reconcileChildFibers } = require('ReactChildFiber');
var {
  isContextProvider,
  popContextProvider,
} = require('ReactFiberContext');
var ReactTypeOfWork = require('ReactTypeOfWork');
var ReactTypeOfSideEffect = require('ReactTypeOfSideEffect');
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
var {
  Update,
} = ReactTypeOfSideEffect;

if (__DEV__) {
  var ReactDebugCurrentFiber = require('ReactDebugCurrentFiber');
}

module.exports = function<T, P, I, TI, C, CX>(
  config : HostConfig<T, P, I, TI, C, CX>,
  hostContext : HostContext<C, CX>,
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

  function markUpdate(workInProgress : Fiber) {
    // Tag the fiber with an update effect. This turns a Placement into
    // an UpdateAndPlacement.
    workInProgress.effectTag |= Update;
  }

  function appendAllYields(yields : Array<ReifiedYield>, workInProgress : Fiber) {
    let node = workInProgress.child;
    while (node) {
      if (node.tag === HostComponent || node.tag === HostText ||
          node.tag === HostPortal) {
        throw new Error('A coroutine cannot have host component children.');
      } else if (node.tag === YieldComponent) {
        yields.push(node.type);
      } else if (node.child) {
        // TODO: Coroutines need to visit the stateNode.
        node.child.return = node;
        node = node.child;
        continue;
      }
      if (node === workInProgress) {
        return;
      }
      while (!node.sibling) {
        if (!node.return || node.return === workInProgress) {
          return;
        }
        node = node.return;
      }
      node.sibling.return = node.return;
      node = node.sibling;
    }
  }

  function moveCoroutineToHandlerPhase(current : ?Fiber, workInProgress : Fiber) {
    var coroutine = (workInProgress.pendingProps : ?ReactCoroutine);
    if (!coroutine) {
      throw new Error('Should be resolved by now');
    }

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
    var yields : Array<ReifiedYield> = [];
    appendAllYields(yields, workInProgress);
    var fn = coroutine.handler;
    var props = coroutine.props;
    var nextChildren = fn(props, yields);

    var currentFirstChild = current ? current.stateNode : null;
    // Inherit the priority of the returnFiber.
    const priority = workInProgress.pendingWorkPriority;
    workInProgress.stateNode = reconcileChildFibers(
      workInProgress,
      currentFirstChild,
      nextChildren,
      priority
    );
    return workInProgress.stateNode;
  }

  function appendAllChildren(parent : I, workInProgress : Fiber) {
    // We only have the top Fiber that was created but we need recurse down its
    // children to find all the terminal nodes.
    let node = workInProgress.child;
    while (node) {
      if (node.tag === HostComponent || node.tag === HostText) {
        appendInitialChild(parent, node.stateNode);
      } else if (node.tag === HostPortal) {
        // If we have a portal child, then we don't want to traverse
        // down its children. Instead, we'll get insertions from each child in
        // the portal directly.
      } else if (node.child) {
        // TODO: Coroutines need to visit the stateNode.
        node = node.child;
        continue;
      }
      if (node === workInProgress) {
        return;
      }
      while (!node.sibling) {
        if (!node.return || node.return === workInProgress) {
          return;
        }
        node = node.return;
      }
      node = node.sibling;
    }
  }

  function completeWork(current : ?Fiber, workInProgress : Fiber) : ?Fiber {
    if (__DEV__) {
      ReactDebugCurrentFiber.current = workInProgress;
    }

    switch (workInProgress.tag) {
      case FunctionalComponent:
        workInProgress.memoizedProps = workInProgress.pendingProps;
        return null;
      case ClassComponent: {
        // We are leaving this subtree, so pop context if any.
        if (isContextProvider(workInProgress)) {
          popContextProvider(workInProgress);
        }
        // Don't use the state queue to compute the memoized state. We already
        // merged it and assigned it to the instance. Transfer it from there.
        // Also need to transfer the props, because pendingProps will be null
        // in the case of an update.
        const instance = workInProgress.stateNode;
        workInProgress.memoizedState = instance.state;
        workInProgress.memoizedProps = instance.props;

        return null;
      }
      case HostRoot: {
        // TODO: Pop the host container after #8607 lands.
        workInProgress.memoizedProps = workInProgress.pendingProps;
        const fiberRoot = (workInProgress.stateNode : FiberRoot);
        if (fiberRoot.pendingContext) {
          fiberRoot.context = fiberRoot.pendingContext;
          fiberRoot.pendingContext = null;
        }
        return null;
      }
      case HostComponent:
        popHostContext(workInProgress);
        const type = workInProgress.type;
        let newProps = workInProgress.pendingProps;
        if (current && workInProgress.stateNode != null) {
          // If we have an alternate, that means this is an update and we need to
          // schedule a side-effect to do the updates.
          const oldProps = current.memoizedProps;
          // If we get updated because one of our children updated, we don't
          // have newProps so we'll have to reuse them.
          // TODO: Split the update API as separate for the props vs. children.
          // Even better would be if children weren't special cased at all tho.
          if (!newProps) {
            newProps = workInProgress.memoizedProps || oldProps;
          }
          const instance : I = workInProgress.stateNode;
          const currentHostContext = getHostContext();
          if (prepareUpdate(instance, type, oldProps, newProps, currentHostContext)) {
            // This returns true if there was something to update.
            markUpdate(workInProgress);
          }
        } else {
          if (!newProps) {
            if (workInProgress.stateNode === null) {
              throw new Error('We must have new props for new mounts.');
            } else {
              // This can happen when we abort work.
              return null;
            }
          }

          const rootContainerInstance = getRootHostContainer();
          const currentHostContext = getHostContext();
          // TODO: Move createInstance to beginWork and keep it on a context
          // "stack" as the parent. Then append children as we go in beginWork
          // or completeWork depending on we want to add then top->down or
          // bottom->up. Top->down is faster in IE11.
          const instance = createInstance(
            type,
            newProps,
            rootContainerInstance,
            currentHostContext,
            workInProgress
          );
          appendAllChildren(instance, workInProgress);
          finalizeInitialChildren(instance, type, newProps, rootContainerInstance);

          workInProgress.stateNode = instance;
          if (workInProgress.ref) {
            // If there is a ref on a host node we need to schedule a callback
            markUpdate(workInProgress);
          }
        }
        workInProgress.memoizedProps = newProps;
        return null;
      case HostText:
        let newText = workInProgress.pendingProps;
        if (current && workInProgress.stateNode != null) {
          const oldText = current.memoizedProps;
          if (newText === null) {
            // If this was a bail out we need to fall back to memoized text.
            // This works the same way as HostComponent.
            newText = workInProgress.memoizedProps;
            if (newText === null) {
              newText = oldText;
            }
          }
          // If we have an alternate, that means this is an update and we need
          // to schedule a side-effect to do the updates.
          if (oldText !== newText) {
            markUpdate(workInProgress);
          }
        } else {
          if (typeof newText !== 'string') {
            if (workInProgress.stateNode === null) {
              throw new Error('We must have new props for new mounts.');
            } else {
              // This can happen when we abort work.
              return null;
            }
          }
          const rootContainerInstance = getRootHostContainer();
          const currentHostContext = getHostContext();
          const textInstance = createTextInstance(newText, rootContainerInstance, currentHostContext, workInProgress);
          workInProgress.stateNode = textInstance;
        }
        workInProgress.memoizedProps = newText;
        return null;
      case CoroutineComponent:
        return moveCoroutineToHandlerPhase(current, workInProgress);
      case CoroutineHandlerPhase:
        workInProgress.memoizedProps = workInProgress.pendingProps;
        // Reset the tag to now be a first phase coroutine.
        workInProgress.tag = CoroutineComponent;
        return null;
      case YieldComponent:
        // Does nothing.
        return null;
      case Fragment:
        workInProgress.memoizedProps = workInProgress.pendingProps;
        return null;
      case HostPortal:
        // TODO: Only mark this as an update if we have any pending callbacks.
        markUpdate(workInProgress);
        workInProgress.memoizedProps = workInProgress.pendingProps;
        popHostContainer(workInProgress);
        return null;

      // Error cases
      case IndeterminateComponent:
        throw new Error('An indeterminate component should have become determinate before completing.');
      default:
        throw new Error('Unknown unit of work tag');
    }
  }

  return {
    completeWork,
  };

};
