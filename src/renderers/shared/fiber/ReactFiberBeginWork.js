/**
 * Copyright 2013-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @providesModule ReactFiberBeginWork
 * @flow
 */

'use strict';

import type { ReactCoroutine } from 'ReactCoroutine';
import type { Fiber } from 'ReactFiber';
import type { FiberRoot } from 'ReactFiberRoot';
import type { HostConfig } from 'ReactFiberReconciler';
import type { PriorityLevel } from 'ReactPriorityLevel';

var {
  mountChildFibersInPlace,
  reconcileChildFibers,
  reconcileChildFibersInPlace,
  cloneChildFibers,
} = require('ReactChildFiber');

var ReactTypeOfWork = require('ReactTypeOfWork');
var {
  getMaskedContext,
  isContextProvider,
  hasContextChanged,
  pushContextProvider,
  pushTopLevelContextObject,
  resetContext,
} = require('ReactFiberContext');
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
  NoWork,
  OffscreenPriority,
} = require('ReactPriorityLevel');
var {
  Placement,
  ContentReset,
} = require('ReactTypeOfSideEffect');
var ReactCurrentOwner = require('ReactCurrentOwner');
var ReactFiberClassComponent = require('ReactFiberClassComponent');

module.exports = function<T, P, I, TI, C>(
  config : HostConfig<T, P, I, TI, C>,
  scheduleUpdate : (fiber: Fiber) => void
) {

  const { shouldSetTextContent } = config;

  const {
    adoptClassInstance,
    constructClassInstance,
    mountClassInstance,
    resumeMountClassInstance,
    updateClassInstance,
  } = ReactFiberClassComponent(scheduleUpdate);

  function markChildAsProgressed(current, workInProgress, priorityLevel) {
    // We now have clones. Let's store them as the currently progressed work.
    workInProgress.progressedChild = workInProgress.child;
    workInProgress.progressedPriority = priorityLevel;
    if (current) {
      // We also store it on the current. When the alternate swaps in we can
      // continue from this point.
      current.progressedChild = workInProgress.progressedChild;
      current.progressedPriority = workInProgress.progressedPriority;
    }
  }

  function clearDeletions(workInProgress) {
    workInProgress.progressedFirstDeletion =
      workInProgress.progressedLastDeletion =
        null;
  }

  function transferDeletions(workInProgress) {
    // Any deletions get added first into the effect list.
    workInProgress.firstEffect = workInProgress.progressedFirstDeletion;
    workInProgress.lastEffect = workInProgress.progressedLastDeletion;
  }

  function reconcileChildren(current, workInProgress, nextChildren) {
    const priorityLevel = workInProgress.pendingWorkPriority;
    reconcileChildrenAtPriority(current, workInProgress, nextChildren, priorityLevel);
  }

  function reconcileChildrenAtPriority(current, workInProgress, nextChildren, priorityLevel) {
    // At this point any memoization is no longer valid since we'll have changed
    // the children.
    workInProgress.memoizedProps = null;
    if (!current) {
      // If this is a fresh new component that hasn't been rendered yet, we
      // won't update its child set by applying minimal side-effects. Instead,
      // we will add them all to the child before it gets rendered. That means
      // we can optimize this reconciliation pass by not tracking side-effects.
      workInProgress.child = mountChildFibersInPlace(
        workInProgress,
        workInProgress.child,
        nextChildren,
        priorityLevel
      );
    } else if (current.child === workInProgress.child) {
      // If the current child is the same as the work in progress, it means that
      // we haven't yet started any work on these children. Therefore, we use
      // the clone algorithm to create a copy of all the current children.

      // If we had any progressed work already, that is invalid at this point so
      // let's throw it out.
      clearDeletions(workInProgress);

      workInProgress.child = reconcileChildFibers(
        workInProgress,
        workInProgress.child,
        nextChildren,
        priorityLevel
      );

      transferDeletions(workInProgress);
    } else {
      // If, on the other hand, it is already using a clone, that means we've
      // already begun some work on this tree and we can continue where we left
      // off by reconciling against the existing children.
      workInProgress.child = reconcileChildFibersInPlace(
        workInProgress,
        workInProgress.child,
        nextChildren,
        priorityLevel
      );

      transferDeletions(workInProgress);
    }
    markChildAsProgressed(current, workInProgress, priorityLevel);
  }

  function updateFragment(current, workInProgress) {
    var nextChildren = workInProgress.pendingProps;
    reconcileChildren(current, workInProgress, nextChildren);
  }

  function updateFunctionalComponent(current, workInProgress) {
    var fn = workInProgress.type;
    var props = workInProgress.pendingProps;
    var context = getMaskedContext(workInProgress);

    // TODO: Disable this before release, since it is not part of the public API
    // I use this for testing to compare the relative overhead of classes.
    if (typeof fn.shouldComponentUpdate === 'function') {
      if (workInProgress.memoizedProps !== null) {
        if (!fn.shouldComponentUpdate(workInProgress.memoizedProps, props)) {
          return bailoutOnAlreadyFinishedWork(current, workInProgress);
        }
      }
    }

    var nextChildren;

    if (__DEV__) {
      ReactCurrentOwner.current = workInProgress;
      nextChildren = fn(props, context);
    } else {
      nextChildren = fn(props, context);
    }
    reconcileChildren(current, workInProgress, nextChildren);
    return workInProgress.child;
  }

  function updateClassComponent(current : ?Fiber, workInProgress : Fiber) {
    let shouldUpdate;
    if (!current) {
      if (!workInProgress.stateNode) {
        // In the initial pass we might need to construct the instance.
        constructClassInstance(workInProgress);
        mountClassInstance(workInProgress);
        shouldUpdate = true;
      } else {
        // In a resume, we'll already have an instance we can reuse.
        shouldUpdate = resumeMountClassInstance(workInProgress);
      }
    } else {
      shouldUpdate = updateClassInstance(current, workInProgress);
    }
    if (!shouldUpdate) {
      return bailoutOnAlreadyFinishedWork(current, workInProgress);
    }
    // Rerender
    const instance = workInProgress.stateNode;
    ReactCurrentOwner.current = workInProgress;
    const nextChildren = instance.render();
    reconcileChildren(current, workInProgress, nextChildren);
    // Put context on the stack because we will work on children
    if (isContextProvider(workInProgress)) {
      pushContextProvider(workInProgress, true);
    }
    return workInProgress.child;
  }

  function updateHostComponent(current, workInProgress) {
    const nextProps = workInProgress.pendingProps;
    const prevProps = current ? current.memoizedProps : null;
    let nextChildren = nextProps.children;
    const isDirectTextChild = shouldSetTextContent(nextProps);
    if (isDirectTextChild) {
      // We special case a direct text child of a host node. This is a common
      // case. We won't handle it as a reified child. We will instead handle
      // this in the host environment that also have access to this prop. That
      // avoids allocating another HostText fiber and traversing it.
      nextChildren = null;
    } else if (prevProps && (
      shouldSetTextContent(prevProps) ||
      prevProps.children === null ||
      typeof prevProps.children === 'undefined' ||
      typeof prevProps.children === 'boolean'
    )) {
      // If we're switching from a direct text child to a normal child, or to
      // empty, we need to schedule the text content to be reset.
      workInProgress.effectTag |= ContentReset;
    }

    if (nextProps.hidden &&
        workInProgress.pendingWorkPriority !== OffscreenPriority) {
      // If this host component is hidden, we can bail out on the children.
      // We'll rerender the children later at the lower priority.

      // It is unfortunate that we have to do the reconciliation of these
      // children already since that will add them to the tree even though
      // they are not actually done yet. If this is a large set it is also
      // confusing that this takes time to do right now instead of later.

      if (workInProgress.progressedPriority === OffscreenPriority) {
        // If we already made some progress on the offscreen priority before,
        // then we should continue from where we left off.
        workInProgress.child = workInProgress.progressedChild;
      }

      // Reconcile the children and stash them for later work.
      reconcileChildrenAtPriority(current, workInProgress, nextChildren, OffscreenPriority);
      workInProgress.child = current ? current.child : null;

      if (!current) {
        // If this doesn't have a current we won't track it for placement
        // effects. However, when we come back around to this we have already
        // inserted the parent which means that we'll infact need to make this a
        // placement.
        // TODO: There has to be a better solution to this problem.
        let child = workInProgress.progressedChild;
        while (child) {
          child.effectTag = Placement;
          child = child.sibling;
        }
      }

      // Abort and don't process children yet.
      return null;
    } else {
      reconcileChildren(current, workInProgress, nextChildren);
      return workInProgress.child;
    }
  }

  function mountIndeterminateComponent(current, workInProgress) {
    if (current) {
      throw new Error('An indeterminate component should never have mounted.');
    }
    var fn = workInProgress.type;
    var props = workInProgress.pendingProps;
    var context = getMaskedContext(workInProgress);

    var value;

    if (__DEV__) {
      ReactCurrentOwner.current = workInProgress;
      value = fn(props, context);
    } else {
      value = fn(props, context);
    }

    if (typeof value === 'object' && value && typeof value.render === 'function') {
      // Proceed under the assumption that this is a class instance
      workInProgress.tag = ClassComponent;
      adoptClassInstance(workInProgress, value);
      mountClassInstance(workInProgress);
      ReactCurrentOwner.current = workInProgress;
      value = value.render();
    } else {
      // Proceed under the assumption that this is a functional component
      workInProgress.tag = FunctionalComponent;
    }
    reconcileChildren(current, workInProgress, value);
    return workInProgress.child;
  }

  function updateCoroutineComponent(current, workInProgress) {
    var coroutine = (workInProgress.pendingProps : ?ReactCoroutine);
    if (!coroutine) {
      throw new Error('Should be resolved by now');
    }
    reconcileChildren(current, workInProgress, coroutine.children);
  }

  function updatePortalComponent(current, workInProgress) {
    const priorityLevel = workInProgress.pendingWorkPriority;
    const nextChildren = workInProgress.pendingProps;
    if (!current) {
      // Portals are special because we don't append the children during mount
      // but at commit. Therefore we need to track insertions which the normal
      // flow doesn't do during mount. This doesn't happen at the root because
      // the root always starts with a "current" with a null child.
      // TODO: Consider unifying this with how the root works.
      workInProgress.child = reconcileChildFibersInPlace(
        workInProgress,
        workInProgress.child,
        nextChildren,
        priorityLevel
      );
      markChildAsProgressed(current, workInProgress, priorityLevel);
    } else {
      reconcileChildren(current, workInProgress, nextChildren);
    }
  }

  /*
  function reuseChildrenEffects(returnFiber : Fiber, firstChild : Fiber) {
    let child = firstChild;
    do {
      // Ensure that the first and last effect of the parent corresponds
      // to the children's first and last effect.
      if (!returnFiber.firstEffect) {
        returnFiber.firstEffect = child.firstEffect;
      }
      if (child.lastEffect) {
        if (returnFiber.lastEffect) {
          returnFiber.lastEffect.nextEffect = child.firstEffect;
        }
        returnFiber.lastEffect = child.lastEffect;
      }
    } while (child = child.sibling);
  }
  */

  function bailoutOnAlreadyFinishedWork(current, workInProgress : Fiber) : ?Fiber {
    const priorityLevel = workInProgress.pendingWorkPriority;

    if (workInProgress.tag === HostComponent &&
        workInProgress.memoizedProps.hidden &&
        workInProgress.pendingWorkPriority !== OffscreenPriority) {
      // This subtree still has work, but it should be deprioritized so we need
      // to bail out and not do any work yet.
      // TODO: It would be better if this tree got its correct priority set
      // during scheduleUpdate instead because otherwise we'll start a higher
      // priority reconciliation first before we can get down here. However,
      // that is a bit tricky since workInProgress and current can have
      // different "hidden" settings.
      let child = workInProgress.progressedChild;
      while (child) {
        // To ensure that this subtree gets its priority reset, the children
        // need to be reset.
        child.pendingWorkPriority = OffscreenPriority;
        child = child.sibling;
      }
      return null;
    }

    // TODO: We should ideally be able to bail out early if the children have no
    // more work to do. However, since we don't have a separation of this
    // Fiber's priority and its children yet - we don't know without doing lots
    // of the same work we do anyway. Once we have that separation we can just
    // bail out here if the children has no more work at this priority level.
    // if (workInProgress.priorityOfChildren <= priorityLevel) {
    //   // If there are side-effects in these children that have not yet been
    //   // committed we need to ensure that they get properly transferred up.
    //   if (current && current.child !== workInProgress.child) {
    //     reuseChildrenEffects(workInProgress, child);
    //   }
    //   return null;
    // }

    if (current && workInProgress.child === current.child) {
      // If we had any progressed work already, that is invalid at this point so
      // let's throw it out.
      clearDeletions(workInProgress);
    }

    cloneChildFibers(current, workInProgress);
    markChildAsProgressed(current, workInProgress, priorityLevel);
    // Put context on the stack because we will work on children
    if (isContextProvider(workInProgress)) {
      pushContextProvider(workInProgress, false);
    }
    return workInProgress.child;
  }

  function bailoutOnLowPriority(current, workInProgress) {
    // TODO: What if this is currently in progress?
    // How can that happen? How is this not being cloned?
    return null;
  }

  function beginWork(current : ?Fiber, workInProgress : Fiber, priorityLevel : PriorityLevel) : ?Fiber {
    if (!workInProgress.return) {
      // Don't start new work with context on the stack.
      resetContext();
    }

    if (workInProgress.pendingWorkPriority === NoWork ||
        workInProgress.pendingWorkPriority > priorityLevel) {
      return bailoutOnLowPriority(current, workInProgress);
    }

    // If we don't bail out, we're going be recomputing our children so we need
    // to drop our effect list.
    workInProgress.firstEffect = null;
    workInProgress.lastEffect = null;

    if (workInProgress.progressedPriority === priorityLevel) {
      // If we have progressed work on this priority level already, we can
      // proceed this that as the child.
      workInProgress.child = workInProgress.progressedChild;
    }

    if ((workInProgress.pendingProps === null || (
      workInProgress.memoizedProps !== null &&
      workInProgress.pendingProps === workInProgress.memoizedProps
      )) &&
      workInProgress.updateQueue === null &&
      !hasContextChanged()) {
      return bailoutOnAlreadyFinishedWork(current, workInProgress);
    }

    switch (workInProgress.tag) {
      case IndeterminateComponent:
        return mountIndeterminateComponent(current, workInProgress);
      case FunctionalComponent:
        return updateFunctionalComponent(current, workInProgress);
      case ClassComponent:
        return updateClassComponent(current, workInProgress);
      case HostRoot: {
        const root = (workInProgress.stateNode : FiberRoot);
        if (root.pendingContext) {
          pushTopLevelContextObject(
            root.pendingContext,
            root.pendingContext !== root.context
          );
        } else {
          pushTopLevelContextObject(root.context, false);
        }
        reconcileChildren(current, workInProgress, workInProgress.pendingProps);
        // A yield component is just a placeholder, we can just run through the
        // next one immediately.
        return workInProgress.child;
      }
      case HostComponent:
        return updateHostComponent(current, workInProgress);
      case HostText:
        // Nothing to do here. This is terminal. We'll do the completion step
        // immediately after.
        return null;
      case CoroutineHandlerPhase:
        // This is a restart. Reset the tag to the initial phase.
        workInProgress.tag = CoroutineComponent;
        // Intentionally fall through since this is now the same.
      case CoroutineComponent:
        updateCoroutineComponent(current, workInProgress);
        // This doesn't take arbitrary time so we could synchronously just begin
        // eagerly do the work of workInProgress.child as an optimization.
        return workInProgress.child;
      case YieldComponent:
        // A yield component is just a placeholder, we can just run through the
        // next one immediately.
        return null;
      case HostPortal:
        updatePortalComponent(current, workInProgress);
        // TODO: is this right?
        return workInProgress.child;
      case Fragment:
        updateFragment(current, workInProgress);
        return workInProgress.child;
      default:
        throw new Error('Unknown unit of work tag');
    }
  }

  function beginFailedWork(current : ?Fiber, workInProgress : Fiber, priorityLevel : PriorityLevel) {
    if (workInProgress.tag !== ClassComponent &&
        workInProgress.tag !== HostRoot) {
      throw new Error('Invalid type of work');
    }

    if (workInProgress.pendingWorkPriority === NoWork ||
        workInProgress.pendingWorkPriority > priorityLevel) {
      return bailoutOnLowPriority(current, workInProgress);
    }

    // If we don't bail out, we're going be recomputing our children so we need
    // to drop our effect list.
    workInProgress.firstEffect = null;
    workInProgress.lastEffect = null;

    // Unmount the current children as if the component rendered null
    const nextChildren = null;
    reconcileChildren(current, workInProgress, nextChildren);
    return workInProgress.child;
  }

  return {
    beginWork,
    beginFailedWork,
  };

};
