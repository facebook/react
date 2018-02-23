/**
 * Copyright (c) 2013-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import type {HostConfig} from 'react-reconciler';
import type {Fiber} from './ReactFiber';
import type {FiberRoot} from './ReactFiber';
import type {ExpirationTime} from './ReactFiberExpirationTime';
import type {CapturedValue, CapturedError} from './ReactCapturedValue';

import {
  enableMutatingReconciler,
  enableNoopReconciler,
  enablePersistentReconciler,
} from 'shared/ReactFeatureFlags';
import {
  ClassComponent,
  HostRoot,
  HostComponent,
  HostText,
  HostPortal,
  CallComponent,
  LoadingComponent,
  TimeoutComponent,
} from 'shared/ReactTypeOfWork';
import ReactErrorUtils from 'shared/ReactErrorUtils';
import {Placement, Update, ContentReset} from 'shared/ReactTypeOfSideEffect';
import invariant from 'fbjs/lib/invariant';

import {commitCallbacks} from './ReactFiberUpdateQueue';
import {onCommitUnmount} from './ReactFiberDevToolsHook';
import {startPhaseTimer, stopPhaseTimer} from './ReactDebugFiberPerf';
import {insertUpdateIntoFiber} from './ReactFiberUpdateQueue';
import {logCapturedError} from './ReactFiberErrorLogger';
import getComponentName from 'shared/getComponentName';
import {getStackAddendumByWorkInProgressFiber} from 'shared/ReactFiberComponentTreeHook';

const {
  invokeGuardedCallback,
  hasCaughtError,
  clearCaughtError,
} = ReactErrorUtils;

function logError(boundary: Fiber, errorInfo: CapturedValue<mixed>) {
  const source = errorInfo.source;
  let stack = errorInfo.stack;
  if (stack === null) {
    stack = getStackAddendumByWorkInProgressFiber(source);
  }

  const capturedError: CapturedError = {
    componentName: source !== null ? getComponentName(source) : null,
    error: errorInfo.value,
    errorBoundary: boundary,
    componentStack: stack !== null ? stack : '',
    errorBoundaryName: null,
    errorBoundaryFound: false,
    willRetry: false,
  };

  if (boundary !== null) {
    capturedError.errorBoundaryName = getComponentName(boundary);
    capturedError.errorBoundaryFound = capturedError.willRetry =
      boundary.tag === ClassComponent;
  } else {
    capturedError.errorBoundaryName = null;
    capturedError.errorBoundaryFound = capturedError.willRetry = false;
  }

  try {
    logCapturedError(capturedError);
  } catch (e) {
    // Prevent cycle if logCapturedError() throws.
    // A cycle may still occur if logCapturedError renders a component that throws.
    const suppressLogging = e && e.suppressReactErrorLogging;
    if (!suppressLogging) {
      console.error(e);
    }
  }
}

export default function<T, P, I, TI, HI, PI, C, CC, CX, PL>(
  config: HostConfig<T, P, I, TI, HI, PI, C, CC, CX, PL>,
  captureError: (failedFiber: Fiber, error: mixed) => Fiber | null,
  scheduleWork: (
    fiber: Fiber,
    startTime: ExpirationTime,
    expirationTime: ExpirationTime,
  ) => void,
  computeExpirationForFiber: (
    startTime: ExpirationTime,
    fiber: Fiber,
  ) => ExpirationTime,
  markLegacyErrorBoundaryAsFailed: (instance: mixed) => void,
  recalculateCurrentTime: () => ExpirationTime,
) {
  const {getPublicInstance, mutation, persistence} = config;

  const callComponentWillUnmountWithTimer = function(current, instance) {
    startPhaseTimer(current, 'componentWillUnmount');
    instance.props = current.memoizedProps;
    instance.state = current.memoizedState;
    instance.componentWillUnmount();
    stopPhaseTimer();
  };

  // Capture errors so they don't interrupt unmounting.
  function safelyCallComponentWillUnmount(current, instance) {
    if (__DEV__) {
      invokeGuardedCallback(
        null,
        callComponentWillUnmountWithTimer,
        null,
        current,
        instance,
      );
      if (hasCaughtError()) {
        const unmountError = clearCaughtError();
        captureError(current, unmountError);
      }
    } else {
      try {
        callComponentWillUnmountWithTimer(current, instance);
      } catch (unmountError) {
        captureError(current, unmountError);
      }
    }
  }

  function safelyDetachRef(current: Fiber) {
    const ref = current.ref;
    if (ref !== null) {
      if (typeof ref === 'function') {
        if (__DEV__) {
          invokeGuardedCallback(null, ref, null, null);
          if (hasCaughtError()) {
            const refError = clearCaughtError();
            captureError(current, refError);
          }
        } else {
          try {
            ref(null);
          } catch (refError) {
            captureError(current, refError);
          }
        }
      } else {
        ref.value = null;
      }
    }
  }

  function scheduleExpirationBoundaryRecovery(fiber) {
    const currentTime = recalculateCurrentTime();
    const expirationTime = computeExpirationForFiber(currentTime, fiber);
    const update = {
      expirationTime,
      partialState: false,
      callback: null,
      isReplace: true,
      isForced: false,
      capturedValue: null,
      next: null,
    };
    insertUpdateIntoFiber(fiber, update);
    scheduleWork(fiber, currentTime, expirationTime);
  }

  function commitLifeCycles(
    finishedRoot: FiberRoot,
    current: Fiber | null,
    finishedWork: Fiber,
    currentTime: ExpirationTime,
    committedExpirationTime: ExpirationTime,
  ): void {
    switch (finishedWork.tag) {
      case ClassComponent: {
        const instance = finishedWork.stateNode;
        if (finishedWork.effectTag & Update) {
          if (current === null) {
            startPhaseTimer(finishedWork, 'componentDidMount');
            instance.props = finishedWork.memoizedProps;
            instance.state = finishedWork.memoizedState;
            instance.componentDidMount();
            stopPhaseTimer();
          } else {
            const prevProps = current.memoizedProps;
            const prevState = current.memoizedState;
            startPhaseTimer(finishedWork, 'componentDidUpdate');
            instance.props = finishedWork.memoizedProps;
            instance.state = finishedWork.memoizedState;
            instance.componentDidUpdate(prevProps, prevState);
            stopPhaseTimer();
          }
        }
        const updateQueue = finishedWork.updateQueue;
        if (updateQueue !== null) {
          commitCallbacks(updateQueue, instance);
        }
        return;
      }
      case HostRoot: {
        const updateQueue = finishedWork.updateQueue;
        if (updateQueue !== null) {
          let instance = null;
          if (finishedWork.child !== null) {
            switch (finishedWork.child.tag) {
              case HostComponent:
                instance = getPublicInstance(finishedWork.child.stateNode);
                break;
              case ClassComponent:
                instance = finishedWork.child.stateNode;
                break;
            }
          }
          commitCallbacks(updateQueue, instance);
        }
        return;
      }
      case HostComponent: {
        const instance: I = finishedWork.stateNode;

        // Renderers may schedule work to be done after host components are mounted
        // (eg DOM renderer may schedule auto-focus for inputs and form controls).
        // These effects should only be committed when components are first mounted,
        // aka when there is no current/alternate.
        if (current === null && finishedWork.effectTag & Update) {
          const type = finishedWork.type;
          const props = finishedWork.memoizedProps;
          commitMount(instance, type, props, finishedWork);
        }

        return;
      }
      case HostText: {
        // We have no life-cycles associated with text.
        return;
      }
      case HostPortal: {
        // We have no life-cycles associated with portals.
        return;
      }
      case LoadingComponent: {
        return;
      }
      case TimeoutComponent: {
        const updateQueue = finishedWork.updateQueue;
        if (updateQueue !== null) {
          const promises = updateQueue.capturedValues;
          if (promises !== null) {
            // TODO: Remove dependency on Promise.race
            // eslint-disable-next-line no-undef
            Promise.race(promises).then(() =>
              scheduleExpirationBoundaryRecovery(finishedWork),
            );
          }
        }
        return;
      }
      default: {
        invariant(
          false,
          'This unit of work tag should not have side-effects. This error is ' +
            'likely caused by a bug in React. Please file an issue.',
        );
      }
    }
  }

  function commitErrorLogging(
    finishedWork: Fiber,
    onUncaughtError: (error: Error) => void,
  ) {
    switch (finishedWork.tag) {
      case ClassComponent:
        {
          const ctor = finishedWork.type;
          const instance = finishedWork.stateNode;
          const updateQueue = finishedWork.updateQueue;
          invariant(
            updateQueue !== null && updateQueue.capturedValues !== null,
            'An error logging effect should not have been scheduled if no errors ' +
              'were captured. This error is likely caused by a bug in React. ' +
              'Please file an issue.',
          );
          const capturedErrors = updateQueue.capturedValues;
          updateQueue.capturedValues = null;

          if (typeof ctor.getDerivedStateFromCatch !== 'function') {
            // To preserve the preexisting retry behavior of error boundaries,
            // we keep track of which ones already failed during this batch.
            // This gets reset before we yield back to the browser.
            // TODO: Warn in strict mode if getDerivedStateFromCatch is
            // not defined.
            markLegacyErrorBoundaryAsFailed(instance);
          }

          instance.props = finishedWork.memoizedProps;
          instance.state = finishedWork.memoizedState;
          for (let i = 0; i < capturedErrors.length; i++) {
            const errorInfo = capturedErrors[i];
            const error = errorInfo.value;
            logError(finishedWork, errorInfo);
            instance.componentDidCatch(error);
          }
        }
        break;
      case HostRoot: {
        const updateQueue = finishedWork.updateQueue;
        invariant(
          updateQueue !== null && updateQueue.capturedValues !== null,
          'An error logging effect should not have been scheduled if no errors ' +
            'were captured. This error is likely caused by a bug in React. ' +
            'Please file an issue.',
        );
        const capturedErrors = updateQueue.capturedValues;
        updateQueue.capturedValues = null;
        for (let i = 0; i < capturedErrors.length; i++) {
          const errorInfo = capturedErrors[i];
          logError(finishedWork, errorInfo);
          onUncaughtError(errorInfo.value);
        }
        break;
      }
      default:
        invariant(
          false,
          'This unit of work tag cannot capture errors.  This error is ' +
            'likely caused by a bug in React. Please file an issue.',
        );
    }
  }

  function commitAttachRef(finishedWork: Fiber) {
    const ref = finishedWork.ref;
    if (ref !== null) {
      const instance = finishedWork.stateNode;
      let instanceToUse;
      switch (finishedWork.tag) {
        case HostComponent:
          instanceToUse = getPublicInstance(instance);
          break;
        default:
          instanceToUse = instance;
      }
      if (typeof ref === 'function') {
        ref(instanceToUse);
      } else {
        ref.value = instanceToUse;
      }
    }
  }

  function commitDetachRef(current: Fiber) {
    const currentRef = current.ref;
    if (currentRef !== null) {
      if (typeof currentRef === 'function') {
        currentRef(null);
      } else {
        currentRef.value = null;
      }
    }
  }

  // User-originating errors (lifecycles and refs) should not interrupt
  // deletion, so don't let them throw. Host-originating errors should
  // interrupt deletion, so it's okay
  function commitUnmount(current: Fiber): void {
    if (typeof onCommitUnmount === 'function') {
      onCommitUnmount(current);
    }

    switch (current.tag) {
      case ClassComponent: {
        safelyDetachRef(current);
        const instance = current.stateNode;
        if (typeof instance.componentWillUnmount === 'function') {
          safelyCallComponentWillUnmount(current, instance);
        }
        return;
      }
      case HostComponent: {
        safelyDetachRef(current);
        return;
      }
      case CallComponent: {
        commitNestedUnmounts(current.stateNode);
        return;
      }
      case HostPortal: {
        // TODO: this is recursive.
        // We are also not using this parent because
        // the portal will get pushed immediately.
        if (enableMutatingReconciler && mutation) {
          unmountHostComponents(current);
        } else if (enablePersistentReconciler && persistence) {
          emptyPortalContainer(current);
        }
        return;
      }
    }
  }

  function commitNestedUnmounts(root: Fiber): void {
    // While we're inside a removed host node we don't want to call
    // removeChild on the inner nodes because they're removed by the top
    // call anyway. We also want to call componentWillUnmount on all
    // composites before this host node is removed from the tree. Therefore
    // we do an inner loop while we're still inside the host node.
    let node: Fiber = root;
    while (true) {
      commitUnmount(node);
      // Visit children because they may contain more composite or host nodes.
      // Skip portals because commitUnmount() currently visits them recursively.
      if (
        node.child !== null &&
        // If we use mutation we drill down into portals using commitUnmount above.
        // If we don't use mutation we drill down into portals here instead.
        (!mutation || node.tag !== HostPortal)
      ) {
        node.child.return = node;
        node = node.child;
        continue;
      }
      if (node === root) {
        return;
      }
      while (node.sibling === null) {
        if (node.return === null || node.return === root) {
          return;
        }
        node = node.return;
      }
      node.sibling.return = node.return;
      node = node.sibling;
    }
  }

  function detachFiber(current: Fiber) {
    // Cut off the return pointers to disconnect it from the tree. Ideally, we
    // should clear the child pointer of the parent alternate to let this
    // get GC:ed but we don't know which for sure which parent is the current
    // one so we'll settle for GC:ing the subtree of this child. This child
    // itself will be GC:ed when the parent updates the next time.
    current.return = null;
    current.child = null;
    if (current.alternate) {
      current.alternate.child = null;
      current.alternate.return = null;
    }
  }

  let emptyPortalContainer;

  if (!mutation) {
    let commitContainer;
    if (persistence) {
      const {replaceContainerChildren, createContainerChildSet} = persistence;
      emptyPortalContainer = function(current: Fiber) {
        const portal: {containerInfo: C, pendingChildren: CC} =
          current.stateNode;
        const {containerInfo} = portal;
        const emptyChildSet = createContainerChildSet(containerInfo);
        replaceContainerChildren(containerInfo, emptyChildSet);
      };
      commitContainer = function(finishedWork: Fiber) {
        switch (finishedWork.tag) {
          case ClassComponent: {
            return;
          }
          case HostComponent: {
            return;
          }
          case HostText: {
            return;
          }
          case HostRoot:
          case HostPortal: {
            const portalOrRoot: {containerInfo: C, pendingChildren: CC} =
              finishedWork.stateNode;
            const {containerInfo, pendingChildren} = portalOrRoot;
            replaceContainerChildren(containerInfo, pendingChildren);
            return;
          }
          default: {
            invariant(
              false,
              'This unit of work tag should not have side-effects. This error is ' +
                'likely caused by a bug in React. Please file an issue.',
            );
          }
        }
      };
    } else {
      commitContainer = function(finishedWork: Fiber) {
        // Noop
      };
    }
    if (enablePersistentReconciler || enableNoopReconciler) {
      return {
        commitResetTextContent(finishedWork: Fiber) {},
        commitPlacement(finishedWork: Fiber) {},
        commitDeletion(current: Fiber) {
          // Detach refs and call componentWillUnmount() on the whole subtree.
          commitNestedUnmounts(current);
          detachFiber(current);
        },
        commitWork(current: Fiber | null, finishedWork: Fiber) {
          commitContainer(finishedWork);
        },
        commitLifeCycles,
        commitErrorLogging,
        commitAttachRef,
        commitDetachRef,
      };
    } else if (persistence) {
      invariant(false, 'Persistent reconciler is disabled.');
    } else {
      invariant(false, 'Noop reconciler is disabled.');
    }
  }
  const {
    commitMount,
    commitUpdate,
    resetTextContent,
    commitTextUpdate,
    appendChild,
    appendChildToContainer,
    insertBefore,
    insertInContainerBefore,
    removeChild,
    removeChildFromContainer,
  } = mutation;

  function getHostParentFiber(fiber: Fiber): Fiber {
    let parent = fiber.return;
    while (parent !== null) {
      if (isHostParent(parent)) {
        return parent;
      }
      parent = parent.return;
    }
    invariant(
      false,
      'Expected to find a host parent. This error is likely caused by a bug ' +
        'in React. Please file an issue.',
    );
  }

  function isHostParent(fiber: Fiber): boolean {
    return (
      fiber.tag === HostComponent ||
      fiber.tag === HostRoot ||
      fiber.tag === HostPortal
    );
  }

  function getHostSibling(fiber: Fiber): ?I {
    // We're going to search forward into the tree until we find a sibling host
    // node. Unfortunately, if multiple insertions are done in a row we have to
    // search past them. This leads to exponential search for the next sibling.
    // TODO: Find a more efficient way to do this.
    let node: Fiber = fiber;
    siblings: while (true) {
      // If we didn't find anything, let's try the next sibling.
      while (node.sibling === null) {
        if (node.return === null || isHostParent(node.return)) {
          // If we pop out of the root or hit the parent the fiber we are the
          // last sibling.
          return null;
        }
        node = node.return;
      }
      node.sibling.return = node.return;
      node = node.sibling;
      while (node.tag !== HostComponent && node.tag !== HostText) {
        // If it is not host node and, we might have a host node inside it.
        // Try to search down until we find one.
        if (node.effectTag & Placement) {
          // If we don't have a child, try the siblings instead.
          continue siblings;
        }
        // If we don't have a child, try the siblings instead.
        // We also skip portals because they are not part of this host tree.
        if (node.child === null || node.tag === HostPortal) {
          continue siblings;
        } else {
          node.child.return = node;
          node = node.child;
        }
      }
      // Check if this host node is stable or about to be placed.
      if (!(node.effectTag & Placement)) {
        // Found it!
        return node.stateNode;
      }
    }
  }

  function commitPlacement(finishedWork: Fiber): void {
    // Recursively insert all host nodes into the parent.
    const parentFiber = getHostParentFiber(finishedWork);
    let parent;
    let isContainer;
    switch (parentFiber.tag) {
      case HostComponent:
        parent = parentFiber.stateNode;
        isContainer = false;
        break;
      case HostRoot:
        parent = parentFiber.stateNode.containerInfo;
        isContainer = true;
        break;
      case HostPortal:
        parent = parentFiber.stateNode.containerInfo;
        isContainer = true;
        break;
      default:
        invariant(
          false,
          'Invalid host parent fiber. This error is likely caused by a bug ' +
            'in React. Please file an issue.',
        );
    }
    if (parentFiber.effectTag & ContentReset) {
      // Reset the text content of the parent before doing any insertions
      resetTextContent(parent);
      // Clear ContentReset from the effect tag
      parentFiber.effectTag &= ~ContentReset;
    }

    const before = getHostSibling(finishedWork);
    // We only have the top Fiber that was inserted but we need recurse down its
    // children to find all the terminal nodes.
    let node: Fiber = finishedWork;
    while (true) {
      if (node.tag === HostComponent || node.tag === HostText) {
        if (before) {
          if (isContainer) {
            insertInContainerBefore(parent, node.stateNode, before);
          } else {
            insertBefore(parent, node.stateNode, before);
          }
        } else {
          if (isContainer) {
            appendChildToContainer(parent, node.stateNode);
          } else {
            appendChild(parent, node.stateNode);
          }
        }
      } else if (node.tag === HostPortal) {
        // If the insertion itself is a portal, then we don't want to traverse
        // down its children. Instead, we'll get insertions from each child in
        // the portal directly.
      } else if (node.child !== null) {
        node.child.return = node;
        node = node.child;
        continue;
      }
      if (node === finishedWork) {
        return;
      }
      while (node.sibling === null) {
        if (node.return === null || node.return === finishedWork) {
          return;
        }
        node = node.return;
      }
      node.sibling.return = node.return;
      node = node.sibling;
    }
  }

  function unmountHostComponents(current): void {
    // We only have the top Fiber that was inserted but we need recurse down its
    // children to find all the terminal nodes.
    let node: Fiber = current;

    // Each iteration, currentParent is populated with node's host parent if not
    // currentParentIsValid.
    let currentParentIsValid = false;
    let currentParent;
    let currentParentIsContainer;

    while (true) {
      if (!currentParentIsValid) {
        let parent = node.return;
        findParent: while (true) {
          invariant(
            parent !== null,
            'Expected to find a host parent. This error is likely caused by ' +
              'a bug in React. Please file an issue.',
          );
          switch (parent.tag) {
            case HostComponent:
              currentParent = parent.stateNode;
              currentParentIsContainer = false;
              break findParent;
            case HostRoot:
              currentParent = parent.stateNode.containerInfo;
              currentParentIsContainer = true;
              break findParent;
            case HostPortal:
              currentParent = parent.stateNode.containerInfo;
              currentParentIsContainer = true;
              break findParent;
          }
          parent = parent.return;
        }
        currentParentIsValid = true;
      }

      if (node.tag === HostComponent || node.tag === HostText) {
        commitNestedUnmounts(node);
        // After all the children have unmounted, it is now safe to remove the
        // node from the tree.
        if (currentParentIsContainer) {
          removeChildFromContainer((currentParent: any), node.stateNode);
        } else {
          removeChild((currentParent: any), node.stateNode);
        }
        // Don't visit children because we already visited them.
      } else if (node.tag === HostPortal) {
        // When we go into a portal, it becomes the parent to remove from.
        // We will reassign it back when we pop the portal on the way up.
        currentParent = node.stateNode.containerInfo;
        // Visit children because portals might contain host components.
        if (node.child !== null) {
          node.child.return = node;
          node = node.child;
          continue;
        }
      } else {
        commitUnmount(node);
        // Visit children because we may find more host components below.
        if (node.child !== null) {
          node.child.return = node;
          node = node.child;
          continue;
        }
      }
      if (node === current) {
        return;
      }
      while (node.sibling === null) {
        if (node.return === null || node.return === current) {
          return;
        }
        node = node.return;
        if (node.tag === HostPortal) {
          // When we go out of the portal, we need to restore the parent.
          // Since we don't keep a stack of them, we will search for it.
          currentParentIsValid = false;
        }
      }
      node.sibling.return = node.return;
      node = node.sibling;
    }
  }

  function commitDeletion(current: Fiber): void {
    // Recursively delete all host nodes from the parent.
    // Detach refs and call componentWillUnmount() on the whole subtree.
    unmountHostComponents(current);
    detachFiber(current);
  }

  function commitWork(current: Fiber | null, finishedWork: Fiber): void {
    switch (finishedWork.tag) {
      case ClassComponent: {
        return;
      }
      case HostComponent: {
        const instance: I = finishedWork.stateNode;
        if (instance != null) {
          // Commit the work prepared earlier.
          const newProps = finishedWork.memoizedProps;
          // For hydration we reuse the update path but we treat the oldProps
          // as the newProps. The updatePayload will contain the real change in
          // this case.
          const oldProps = current !== null ? current.memoizedProps : newProps;
          const type = finishedWork.type;
          // TODO: Type the updateQueue to be specific to host components.
          const updatePayload: null | PL = (finishedWork.updateQueue: any);
          finishedWork.updateQueue = null;
          if (updatePayload !== null) {
            commitUpdate(
              instance,
              updatePayload,
              type,
              oldProps,
              newProps,
              finishedWork,
            );
          }
        }
        return;
      }
      case HostText: {
        invariant(
          finishedWork.stateNode !== null,
          'This should have a text node initialized. This error is likely ' +
            'caused by a bug in React. Please file an issue.',
        );
        const textInstance: TI = finishedWork.stateNode;
        const newText: string = finishedWork.memoizedProps;
        // For hydration we reuse the update path but we treat the oldProps
        // as the newProps. The updatePayload will contain the real change in
        // this case.
        const oldText: string =
          current !== null ? current.memoizedProps : newText;
        commitTextUpdate(textInstance, oldText, newText);
        return;
      }
      case HostRoot: {
        return;
      }
      case LoadingComponent: {
        return;
      }
      case TimeoutComponent: {
        return;
      }
      default: {
        invariant(
          false,
          'This unit of work tag should not have side-effects. This error is ' +
            'likely caused by a bug in React. Please file an issue.',
        );
      }
    }
  }

  function commitResetTextContent(current: Fiber) {
    resetTextContent(current.stateNode);
  }

  if (enableMutatingReconciler) {
    return {
      commitResetTextContent,
      commitPlacement,
      commitDeletion,
      commitWork,
      commitLifeCycles,
      commitErrorLogging,
      commitAttachRef,
      commitDetachRef,
    };
  } else {
    invariant(false, 'Mutating reconciler is disabled.');
  }
}
