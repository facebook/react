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

import type {Fiber, ProgressedWork} from 'ReactFiber';
import type {FiberRoot} from 'ReactFiberRoot';
import type {HostContext} from 'ReactFiberHostContext';
import type {HydrationContext} from 'ReactFiberHydrationContext';
import type {HostConfig} from 'ReactFiberReconciler';
import type {PriorityLevel} from 'ReactPriorityLevel';

var {createWorkInProgress, createProgressedWork} = require('ReactFiber');
var {
  mountChildFibersInPlace,
  reconcileChildFibers,
  reconcileChildFibersInPlace,
} = require('ReactChildFiber');
var {beginUpdateQueue} = require('ReactFiberUpdateQueue');
var {transferEffectsToParent} = require('ReactFiberCompleteWork');
var ReactTypeOfWork = require('ReactTypeOfWork');
var {
  getMaskedContext,
  getUnmaskedContext,
  hasContextChanged,
  // pushContextProvider,
  pushTopLevelContextObject,
  // invalidateContextProvider,
} = require('ReactFiberContext');
var {
  HostRoot,
  HostComponent,
  HostText,
  IndeterminateComponent,
  FunctionalComponent,
  ClassComponent,
} = ReactTypeOfWork;
var {
  NoWork,
  OffscreenPriority,
} = require('ReactPriorityLevel');
var {
  Placement,
  ContentReset,
  Err,
} = require('ReactTypeOfSideEffect');
var {ReactCurrentOwner} = require('ReactGlobalSharedState');
var invariant = require('fbjs/lib/invariant');

if (__DEV__) {
  var ReactDebugCurrentFiber = require('ReactDebugCurrentFiber');
  var warning = require('fbjs/lib/warning');

  var warnedAboutStatelessRefs = {};
}

module.exports = function<T, P, I, TI, PI, C, CX, PL>(
  config: HostConfig<T, P, I, TI, PI, C, CX, PL>,
  hostContext: HostContext<C, CX>,
  hydrationContext: HydrationContext<I, TI, C>,
  scheduleUpdate: (fiber: Fiber, priorityLevel: PriorityLevel) => void,
  getPriorityContext: (fiber: Fiber, forceAsync: boolean) => PriorityLevel,
) {
  const {
    shouldSetTextContent,
    useSyncScheduling,
    shouldDeprioritizeSubtree,
  } = config;

  const {pushHostContext, pushHostContainer} = hostContext;

  function beginHostRoot(current, workInProgress, renderPriority) {
    const root = (workInProgress.stateNode: FiberRoot);
    if (root.pendingContext) {
      pushTopLevelContextObject(
        workInProgress,
        root.pendingContext,
        root.pendingContext !== root.context,
      );
    } else if (root.context) {
      // Should always be set
      pushTopLevelContextObject(workInProgress, root.context, false);
    }

    pushHostContainer(workInProgress, root.containerInfo);

    const memoizedState = workInProgress.memoizedState;
    const updateQueue = workInProgress.updateQueue;
    const nextState = updateQueue === null
      ? memoizedState
      : beginUpdateQueue(
          current,
          workInProgress,
          updateQueue,
          null,
          memoizedState,
          null,
          renderPriority,
        );

    if (nextState === memoizedState) {
      // No new state. The root doesn't have props. Bailout.
      // TODO: What about context?
      return bailout(
        current,
        workInProgress,
        null,
        memoizedState,
        renderPriority,
      );
    }

    // The state was updated. We have a new element.
    const nextChildren = nextState.element;
    // Reconcile the children.
    return reconcile(
      current,
      workInProgress,
      nextChildren,
      null,
      nextState,
      renderPriority,
    );
  }

  function beginHostComponent(current, workInProgress, renderPriority) {
    pushHostContext(workInProgress);

    const type = workInProgress.type;

    const memoizedProps = workInProgress.memoizedProps;
    let nextProps = workInProgress.pendingProps;
    if (nextProps === null) {
      nextProps = memoizedProps;
      invariant(nextProps !== null, 'Must have pending or memoized props.');
    }

    // Check the host config to see if the children are offscreen/hidden.
    const isHidden =
      !useSyncScheduling &&
      shouldDeprioritizeSubtree(type, nextProps);

    if (nextProps === memoizedProps && !hasContextChanged()) {
      // Neither props nor context changed. Bailout.
      if (isHidden) {
        return bailoutHiddenChildren(
          current,
          workInProgress,
          nextProps,
          null,
          renderPriority,
        );
      }
      return bailout(current, workInProgress, nextProps, null, renderPriority);
    }

    let nextChildren = nextProps.children;
    const isDirectTextChild = shouldSetTextContent(type, nextProps);

    if (isDirectTextChild) {
      // We special case a direct text child of a host node. This is a common
      // case. We won't handle it as a reified child. We will instead handle
      // this in the host environment that also have access to this prop. That
      // avoids allocating another HostText fiber and traversing it.
      nextChildren = null;
    } else if (memoizedProps != null && shouldSetTextContent(type, memoizedProps)) {
      // If we're switching from a direct text child to a normal child, or to
      // empty, we need to schedule the text content to be reset.
      workInProgress.effectTag |= ContentReset;
    }

    if (isHidden) {
      return reconcileHiddenChildren(
        current,
        workInProgress,
        nextChildren,
        nextProps,
        null,
        renderPriority,
      );
    }
    return reconcile(
      current,
      workInProgress,
      nextChildren,
      nextProps,
      null,
      renderPriority,
    );
  }

  function beginHostText(current, workInProgress, renderPriority) {
    const memoizedProps = workInProgress.memoizedProps;
    let nextProps = workInProgress.pendingProps;
    if (nextProps === null) {
      nextProps = memoizedProps;
      invariant(nextProps !== null, 'Must have pending or memoized props.');
    }
    if (nextProps === memoizedProps) {
      return bailout(current, workInProgress, nextProps, null, renderPriority);
    }
    // Text nodes don't actually have children, but we call reconcile anyway
    // so that the progressed work gets updated.
    return reconcile(
      current,
      workInProgress,
      null,
      nextProps,
      null,
      renderPriority,
    );
  }

  function beginIndeterminateComponent(current, workInProgress, renderPriority) {
    invariant(
      current === null,
      'An indeterminate component should never have mounted. This error is ' +
        'likely caused by a bug in React. Please file an issue.',
    );

    const fn = workInProgress.type;
    const nextProps = workInProgress.pendingProps;
    const unmaskedContext = getUnmaskedContext(workInProgress);
    const nextContext = getMaskedContext(workInProgress, unmaskedContext);

    invariant(
      nextProps !== null,
      'Must have pending props.',
    );

    // This is either a functional component or a module-style class component.
    let value;
    if (__DEV__) {
      ReactCurrentOwner.current = workInProgress;
      value = fn(nextProps, nextContext);
    } else {
      value = fn(nextProps, nextContext);
    }

    if (
      typeof value === 'object' &&
      value !== null &&
      typeof value.render === 'function'
    ) {
      // Proceed under the assumption that this is a class instance.
      throw new Error('TODO: class components');
    } else {
      // Proceed under the assumption that this is a functional component
      workInProgress.tag = FunctionalComponent;
      const nextChildren = value;

      if (__DEV__) {
        // Mount warnings for functional components
        const Component = workInProgress.type;

        if (Component) {
          warning(
            !Component.childContextTypes,
            '%s(...): childContextTypes cannot be defined on a functional component.',
            Component.displayName || Component.name || 'Component',
          );
        }
        if (workInProgress.ref !== null) {
          let info = '';
          const ownerName = ReactDebugCurrentFiber.getCurrentFiberOwnerName();
          if (ownerName) {
            info += '\n\nCheck the render method of `' + ownerName + '`.';
          }

          let warningKey = ownerName || workInProgress._debugID || '';
          const debugSource = workInProgress._debugSource;
          if (debugSource) {
            warningKey = debugSource.fileName + ':' + debugSource.lineNumber;
          }
          if (!warnedAboutStatelessRefs[warningKey]) {
            warnedAboutStatelessRefs[warningKey] = true;
            warning(
              false,
              'Stateless function components cannot be given refs. ' +
                'Attempts to access this ref will fail.%s%s',
              info,
              ReactDebugCurrentFiber.getCurrentFiberStackAddendum(),
            );
          }
        }
      }
      // Reconcile the children.
      return reconcile(
        current,
        workInProgress,
        nextChildren,
        nextProps,
        null,
        renderPriority,
      );
    }
  }

  function beginFunctionalComponent(current, workInProgress, renderPriority) {
    const fn = workInProgress.type;

    const memoizedProps = workInProgress.memoizedProps;
    let nextProps = workInProgress.pendingProps;
    if (nextProps === null) {
      nextProps = memoizedProps;
      invariant(nextProps !== null, 'Must have pending or memoized props.');
    }

    if (
      (nextProps === memoizedProps && !hasContextChanged()) ||
      // TODO: Disable this before release, since it is not part of the public
      // API. I use this for testing to compare the relative overhead
      // of classes.
      (typeof fn.shouldComponentUpdate === 'function' &&
        !fn.shouldComponentUpdate(memoizedProps, nextProps))
    ) {
      // No changes to props or context. Bailout.
      return bailout(current, workInProgress, nextProps, null, renderPriority);
    }

    // Compute the next children.
    const unmaskedContext = getUnmaskedContext(workInProgress);
    const nextContext = getMaskedContext(workInProgress, unmaskedContext);

    let nextChildren;
    if (__DEV__) {
      // In DEV, track the current owner for better stack traces
      ReactCurrentOwner.current = workInProgress;
      ReactDebugCurrentFiber.phase = 'render';
      nextChildren = fn(nextProps, nextContext);
      ReactDebugCurrentFiber.phase = null;
    } else {
      nextChildren = fn(nextProps, nextContext);
    }

    // Reconcile the children.
    return reconcile(
      current,
      workInProgress,
      nextChildren,
      nextProps,
      null,
      renderPriority,
    );
  }

  function bailoutHiddenChildren(
    current: Fiber | null,
    workInProgress: Fiber,
    nextProps: mixed | null,
    nextState: mixed | null,
    renderPriority: PriorityLevel,
  ): Fiber | null {
    // We didn't reconcile, but before bailing out, we still need to override
    // the priority of the children in case it's higher than
    // OffscreenPriority. This can happen when we switch from visible to
    // hidden, or if setState is called somewhere in the tree.
    // TODO: It would be better if this tree got its correct priority set
    // during scheduleUpdate instead because otherwise we'll start a higher
    // priority reconciliation first before we can get down here. However,
    // that is a bit tricky since workInProgress and current can have
    // different "hidden" settings.
    workInProgress.progressedPriority = OffscreenPriority;
    return bailout(current, workInProgress, nextProps, null, renderPriority);
  }

  function reconcileHiddenChildren(
    current: Fiber | null,
    workInProgress: Fiber,
    nextChildren: any,
    nextProps: mixed | null,
    nextState: mixed | null,
    renderPriority: PriorityLevel,
  ): Fiber | null {
    if (renderPriority !== OffscreenPriority) {
      // This is a special case where we're about to reconcile at a lower
      // priority than the render priority. We already called forkOrResumeChild
      // at the start of the begin phase, but we need to call it again with
      // OffscreenPriority so that if we have an offscreen child, we can
      // reuse it.
      forkOrResumeChild(
        current,
        workInProgress,
        OffscreenPriority,
        renderPriority,
      );
    }

    // Reconcile the children at OffscreenPriority. This may be lower than
    // the priority at which we're currently reconciling. This will store
    // the children on the progressed work so that we can come back to them
    // later if needed.
    reconcile(
      current,
      workInProgress,
      nextChildren,
      nextProps,
      nextState,
      OffscreenPriority,
    );

    // If we're rendering at OffscreenPriority, start working on the child.
    if (renderPriority === OffscreenPriority) {
      return workInProgress.child;
    }

    // Otherwise, bailout.
    if (current === null) {
      // If this doesn't have a current we won't track it for placement
      // effects. However, when we come back around to this we have already
      // inserted the parent which means that we'll infact need to make this a
      // placement.
      // TODO: There has to be a better solution to this problem.
      let child = workInProgress.child;
      while (child !== null) {
        child.effectTag = Placement;
        child = child.sibling;
      }
    }
    // This will stash the work-in-progress child as the progressed child.
    return bailout(
      current,
      workInProgress,
      nextProps,
      nextState,
      renderPriority,
    );
  }

  function bailout(
    current: Fiber | null,
    workInProgress: Fiber,
    nextProps: mixed | null,
    nextState: mixed | null,
    renderPriority: PriorityLevel,
  ): Fiber | null {
    // Reset the pending props. We don't need them anymore.
    workInProgress.pendingProps = null;

    // A bailout implies that the memoized props and state are equal to the next
    // props and state, but we should update them anyway because they might not
    // be referentially equal (shouldComponentUpdate -> false)
    workInProgress.memoizedProps = nextProps;
    workInProgress.memoizedState = nextState;

    // If the child is null, this is terminal. The work is done.
    if (workInProgress.child === null) {
      return null;
    }

    const progressedWork = workInProgress.progressedWork;

    // Should we continue working on the children? Check if the children have
    // work that matches the priority at which we're currently rendering.
    if (
      workInProgress.pendingWorkPriority === NoWork ||
      workInProgress.pendingWorkPriority > renderPriority
    ) {
      // The children do not have sufficient priority. We should skip the
      // children. If they have low-pri work, we'll come back to them later.

      // Before exiting, we need to check if we have progressed work.
      if (current === null || progressedWork.child !== current.child) {
        if (workInProgress.progressedPriority === renderPriority) {
          // We have progressed work that completed at this level. Because the
          // remaining priority (pendingWorkPriority) is less than the priority
          // at which it last rendered (progressedPriority), we know that it
          // must have completed at the progressedPriority. That means we can
          // use the progressed child during this commit.

          // We need to bubble up effects from the progressed children so that
          // they don't get dropped. Usually effects are transferred to the
          // parent during the complete phase, but we won't be completing these
          // children again.
          let child = workInProgress.child;
          while (child !== null) {
            transferEffectsToParent(workInProgress, child);
            child = child.sibling;
          }
        } else {
          invariant(
            workInProgress.progressedPriority === OffscreenPriority,
            'Progressed priority should only be less than work priority in ' +
              'case of an offscreen/hidden subtree.',
          );
          // Reset child to current. If we have progressed work, this will stash
          // it for later.
          forkCurrentChild(current, workInProgress);
        }
      }

      // Return null to skip the children and continue on the sibling. If
      // there's still work in the children, we'll come back to it later at a
      // lower priority.
      return null;
    }

    // The priority of the children matches the render priority. We'll
    // continue working on it.

    // Check to see if we have progressed work since the last commit.
    if (current === null || progressedWork.child !== current.child) {
      // We already have progressed work. We can reuse the children. But we
      // need to reset the return fiber since we'll traverse down into them.
      let child = workInProgress.child;
      while (child !== null) {
        child.return = workInProgress;
        child = child.sibling;
      }
    } else {
      // There is no progressed work. We need to create a new work in progress
      // for each child.
      let currentChild = workInProgress.child;
      let newChild = createWorkInProgress(currentChild, renderPriority);
      workInProgress.child = newChild;

      newChild.return = workInProgress;
      while (currentChild.sibling !== null) {
        currentChild = currentChild.sibling;
        newChild = newChild.sibling = createWorkInProgress(
          currentChild,
          renderPriority,
        );
        newChild.return = workInProgress;
      }
      newChild.sibling = null;

      // We mutated the child fiber. Mark it as progressed. If we had lower-
      // priority progressed work, it will be thrown out.
      markWorkAsProgressed(current, workInProgress, renderPriority);
    }
    // Continue working on child
    return workInProgress.child;
  }

  function reconcile(
    current: Fiber | null,
    workInProgress: Fiber,
    nextChildren: any,
    nextProps: mixed | null,
    nextState: mixed | null,
    renderPriority: PriorityLevel,
  ): Fiber | null {
    // Reset the pending props. We don't need them anymore.
    workInProgress.pendingProps = null;

    // We have new children. Update the child set.
    if (current === null) {
      // If this is a fresh new component that hasn't been rendered yet, we
      // won't update its child set by applying minimal side-effects. Instead,
      // we will add them all to the child before it gets rendered. That means
      // we can optimize this reconciliation pass by not tracking side-effects.
      workInProgress.child = mountChildFibersInPlace(
        workInProgress,
        workInProgress.child,
        nextChildren,
        renderPriority,
      );
    } else if (workInProgress.child === current.child) {
      // If the child is the same as the current child, it means that we haven't
      // yet started any work on these children. Therefore, we use the clone
      // algorithm to create a copy of all the current children.
      workInProgress.child = reconcileChildFibers(
        workInProgress,
        workInProgress.child,
        nextChildren,
        renderPriority,
      );
    } else {
      // If, on the other hand, it is already using a clone, that means we've
      // already begun some work on this tree and we can continue where we left
      // off by reconciling against the existing children.
      workInProgress.child = reconcileChildFibersInPlace(
        workInProgress,
        workInProgress.child,
        nextChildren,
        renderPriority,
      );
    }

    // Memoize this work.
    workInProgress.memoizedProps = nextProps;
    workInProgress.memoizedState = nextState;

    // The child is now the progressed child. Update the progressed work.
    markWorkAsProgressed(current, workInProgress, renderPriority);

    // We reconciled the children set. They now have pending work at whatever
    // priority we're currently rendering. This is true even if the render
    // priority is less than the existing work priority, since that should only
    // happen in the case of an intentional down-prioritization.
    workInProgress.pendingWorkPriority = renderPriority;

    // Continue working on the child.
    return workInProgress.child;
  }

  function markWorkAsProgressed(current, workInProgress, renderPriority) {
    // Keep track of the priority at which this work was performed.
    workInProgress.progressedPriority = renderPriority;
    workInProgress.progressedWork = workInProgress;
    if (current !== null) {
      // Set the progressed work on both fibers
      current.progressedPriority = renderPriority;
      current.progressedWork = workInProgress;
    }
  }

  function resumeProgressedChild(
    workInProgress: Fiber,
    progressedWork: ProgressedWork,
  ) {
    // Reuse the progressed work.
    workInProgress.child = progressedWork.child;
    workInProgress.firstDeletion = progressedWork.firstDeletion;
    workInProgress.lastDeletion = progressedWork.lastDeletion;
    workInProgress.memoizedProps = progressedWork.memoizedProps;
    workInProgress.memoizedState = progressedWork.memoizedState;
    workInProgress.updateQueue = progressedWork.updateQueue;
  }

  function forkCurrentChild(current: Fiber | null, workInProgress: Fiber) {
    let progressedWork = workInProgress.progressedWork;

    if (current === null || progressedWork.child !== current.child) {
      // We already performed work on this fiber. We don't want to lose it.
      // Stash it on the progressedWork so that we can come back to it later
      // at a lower priority. Conceptually, we're "forking" the child.

      // The progressedWork points either to current, workInProgress, or a
      // ProgressedWork object.
      if (progressedWork === current || progressedWork === workInProgress) {
        // Coerce to Fiber
        const progressedWorkFiber : Fiber = (progressedWork : any);
        // The progressed work is one of the fibers. Because this is a fork,
        // we need to stash the fields on a separate object instead, so that
        // it doesn't get overwritten.
        // TODO: This allocates a new object every time.
        progressedWork = createProgressedWork(progressedWorkFiber);
        workInProgress.progressedWork = progressedWork;
        if (current !== null) {
          // Set it on both fibers
          current.progressedWork = progressedWork;
        }
      }
    }

    if (current !== null) {
      // Clone child from current.
      workInProgress.child = current.child;
      // The deletion list on current is no longer valid.
      workInProgress.firstDeletion = null;
      workInProgress.lastDeletion = null;
      workInProgress.memoizedProps = current.memoizedProps;
      workInProgress.memoizedState = current.memoizedState;
      workInProgress.updateQueue = current.updateQueue;
    } else {
      // There is no current, so conceptually, the current fiber is null.
      workInProgress.child = null;
      workInProgress.firstDeletion = null;
      workInProgress.lastDeletion = null;
      workInProgress.memoizedProps = null;
      workInProgress.memoizedState = null;
      workInProgress.updateQueue = null;
    }
  }

  function forkOrResumeChild(
    current: Fiber | null,
    workInProgress: Fiber,
    // Pass this in explicitly in case we want to use a different priority than
    // the one stored on the work-in-progress. E.g. to resume offscreen work.
    progressedPriority: PriorityLevel,
    renderPriority: PriorityLevel,
  ): void {
    const progressedWork = workInProgress.progressedWork;
    if (
      progressedPriority === renderPriority &&
      (current === null || progressedWork.child !== current.child)
    ) {
      // We have progressed work at this priority. Reuse it.
      return resumeProgressedChild(workInProgress, progressedWork);
    }
    return forkCurrentChild(current, workInProgress);
  }

  function beginWork(
    current: Fiber | null,
    workInProgress: Fiber,
    renderPriority: PriorityLevel,
  ): Fiber | null {
    if (__DEV__) {
      // Keep track of the fiber we're currently working on.
      ReactDebugCurrentFiber.current = workInProgress;
    }

    forkOrResumeChild(
      current,
      workInProgress,
      workInProgress.progressedPriority,
      renderPriority,
    );

    // Clear the effect list, as it's no longer valid.
    workInProgress.firstEffect = null;
    workInProgress.lastEffect = null;

    switch (workInProgress.tag) {
      case HostRoot:
        return beginHostRoot(current, workInProgress, renderPriority);
      case HostComponent:
        return beginHostComponent(current, workInProgress, renderPriority);
      case HostText:
        return beginHostText(current, workInProgress, renderPriority);
      case IndeterminateComponent:
        return beginIndeterminateComponent(current, workInProgress, renderPriority);
      case FunctionalComponent:
        return beginFunctionalComponent(
          current,
          workInProgress,
          renderPriority,
        );
      default:
        invariant(
          false,
          'Unknown unit of work tag. This error is likely caused by a bug in ' +
            'React. Please file an issue.',
        );
    }
  }

  function beginFailedWork(
    current: Fiber | null,
    workInProgress: Fiber,
    renderPriority: PriorityLevel,
  ) {
    invariant(
      workInProgress.tag === ClassComponent || workInProgress.tag === HostRoot,
      'Invalid type of work. This error is likely caused by a bug in React. ' +
        'Please file an issue.',
    );

    // Clear the effect list, as it's no longer valid.
    workInProgress.firstEffect = null;
    workInProgress.lastEffect = null;

    // Add an error effect so we can handle the error during the commit phase
    workInProgress.effectTag |= Err;

    // Unmount the children
    const nextChildren = null;
    return reconcile(
      current,
      workInProgress,
      nextChildren,
      workInProgress.memoizedProps,
      workInProgress.memoizedState,
      renderPriority,
    );
  }

  return {
    beginWork,
    beginFailedWork,
  };
};
