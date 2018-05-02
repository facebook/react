/**
 * Copyright (c) 2013-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import type {HostConfig} from 'react-reconciler';
import type {ReactProviderType, ReactContext} from 'shared/ReactTypes';
import type {Fiber} from 'react-reconciler/src/ReactFiber';
import type {HostContext} from './ReactFiberHostContext';
import type {LegacyContext} from './ReactFiberContext';
import type {NewContext} from './ReactFiberNewContext';
import type {HydrationContext} from './ReactFiberHydrationContext';
import type {FiberRoot} from './ReactFiberRoot';
import type {ExpirationTime} from './ReactFiberExpirationTime';
import checkPropTypes from 'prop-types/checkPropTypes';

import {
  IndeterminateComponent,
  FunctionalComponent,
  ClassComponent,
  HostRoot,
  HostComponent,
  HostText,
  HostPortal,
  CallComponent,
  CallHandlerPhase,
  ReturnComponent,
  ForwardRef,
  Fragment,
  Mode,
  ContextProvider,
  ContextConsumer,
} from 'shared/ReactTypeOfWork';
import {
  NoEffect,
  PerformedWork,
  Placement,
  ContentReset,
  Ref,
  DidCapture,
} from 'shared/ReactTypeOfSideEffect';
import {ReactCurrentOwner} from 'shared/ReactGlobalSharedState';
import {
  enableGetDerivedStateFromCatch,
  debugRenderPhaseSideEffects,
  debugRenderPhaseSideEffectsForStrictMode,
} from 'shared/ReactFeatureFlags';
import invariant from 'fbjs/lib/invariant';
import getComponentName from 'shared/getComponentName';
import warning from 'fbjs/lib/warning';
import ReactDebugCurrentFiber from './ReactDebugCurrentFiber';
import {cancelWorkTimer} from './ReactDebugFiberPerf';

import ReactFiberClassComponent, {
  applyDerivedStateFromProps,
} from './ReactFiberClassComponent';
import {
  mountChildFibers,
  reconcileChildFibers,
  cloneChildFibers,
} from './ReactChildFiber';
import {processUpdateQueue} from './ReactUpdateQueue';
import {NoWork, Never} from './ReactFiberExpirationTime';
import {AsyncMode, StrictMode} from './ReactTypeOfMode';
import MAX_SIGNED_31_BIT_INT from './maxSigned31BitInt';

const {getCurrentFiberStackAddendum} = ReactDebugCurrentFiber;

let didWarnAboutBadClass;
let didWarnAboutGetDerivedStateOnFunctionalComponent;
let didWarnAboutStatelessRefs;

if (__DEV__) {
  didWarnAboutBadClass = {};
  didWarnAboutGetDerivedStateOnFunctionalComponent = {};
  didWarnAboutStatelessRefs = {};
}

export default function<T, P, I, TI, HI, PI, C, CC, CX, PL>(
  config: HostConfig<T, P, I, TI, HI, PI, C, CC, CX, PL>,
  hostContext: HostContext<C, CX>,
  legacyContext: LegacyContext,
  newContext: NewContext,
  hydrationContext: HydrationContext<C, CX>,
  scheduleWork: (fiber: Fiber, expirationTime: ExpirationTime) => void,
  computeExpirationForFiber: (fiber: Fiber) => ExpirationTime,
) {
  const {shouldSetTextContent, shouldDeprioritizeSubtree} = config;

  const {pushHostContext, pushHostContainer} = hostContext;

  const {pushProvider} = newContext;

  const {
    getMaskedContext,
    getUnmaskedContext,
    hasContextChanged: hasLegacyContextChanged,
    pushContextProvider: pushLegacyContextProvider,
    pushTopLevelContextObject,
    invalidateContextProvider,
  } = legacyContext;

  const {
    enterHydrationState,
    resetHydrationState,
    tryToClaimNextHydratableInstance,
  } = hydrationContext;

  const {
    adoptClassInstance,
    constructClassInstance,
    mountClassInstance,
    resumeMountClassInstance,
    updateClassInstance,
  } = ReactFiberClassComponent(
    legacyContext,
    scheduleWork,
    computeExpirationForFiber,
    memoizeProps,
    memoizeState,
  );

  // TODO: Remove this and use reconcileChildrenAtExpirationTime directly.
  function reconcileChildren(current, workInProgress, nextChildren) {
    reconcileChildrenAtExpirationTime(
      current,
      workInProgress,
      nextChildren,
      workInProgress.expirationTime,
    );
  }

  function reconcileChildrenAtExpirationTime(
    current,
    workInProgress,
    nextChildren,
    renderExpirationTime,
  ) {
    if (current === null) {
      // If this is a fresh new component that hasn't been rendered yet, we
      // won't update its child set by applying minimal side-effects. Instead,
      // we will add them all to the child before it gets rendered. That means
      // we can optimize this reconciliation pass by not tracking side-effects.
      workInProgress.child = mountChildFibers(
        workInProgress,
        null,
        nextChildren,
        renderExpirationTime,
      );
    } else {
      // If the current child is the same as the work in progress, it means that
      // we haven't yet started any work on these children. Therefore, we use
      // the clone algorithm to create a copy of all the current children.

      // If we had any progressed work already, that is invalid at this point so
      // let's throw it out.
      workInProgress.child = reconcileChildFibers(
        workInProgress,
        current.child,
        nextChildren,
        renderExpirationTime,
      );
    }
  }

  function updateForwardRef(current, workInProgress) {
    const render = workInProgress.type.render;
    const nextProps = workInProgress.pendingProps;
    const ref = workInProgress.ref;
    if (hasLegacyContextChanged()) {
      // Normally we can bail out on props equality but if context has changed
      // we don't do the bailout and we have to reuse existing props instead.
    } else if (workInProgress.memoizedProps === nextProps) {
      const currentRef = current !== null ? current.ref : null;
      if (ref === currentRef) {
        return bailoutOnAlreadyFinishedWork(current, workInProgress);
      }
    }
    const nextChildren = render(nextProps, ref);
    reconcileChildren(current, workInProgress, nextChildren);
    memoizeProps(workInProgress, nextProps);
    return workInProgress.child;
  }

  function updateFragment(current, workInProgress) {
    const nextChildren = workInProgress.pendingProps;
    if (hasLegacyContextChanged()) {
      // Normally we can bail out on props equality but if context has changed
      // we don't do the bailout and we have to reuse existing props instead.
    } else if (workInProgress.memoizedProps === nextChildren) {
      return bailoutOnAlreadyFinishedWork(current, workInProgress);
    }
    reconcileChildren(current, workInProgress, nextChildren);
    memoizeProps(workInProgress, nextChildren);
    return workInProgress.child;
  }

  function updateMode(current, workInProgress) {
    const nextChildren = workInProgress.pendingProps.children;
    if (hasLegacyContextChanged()) {
      // Normally we can bail out on props equality but if context has changed
      // we don't do the bailout and we have to reuse existing props instead.
    } else if (
      nextChildren === null ||
      workInProgress.memoizedProps === nextChildren
    ) {
      return bailoutOnAlreadyFinishedWork(current, workInProgress);
    }
    reconcileChildren(current, workInProgress, nextChildren);
    memoizeProps(workInProgress, nextChildren);
    return workInProgress.child;
  }

  function markRef(current: Fiber | null, workInProgress: Fiber) {
    const ref = workInProgress.ref;
    if (
      (current === null && ref !== null) ||
      (current !== null && current.ref !== ref)
    ) {
      // Schedule a Ref effect
      workInProgress.effectTag |= Ref;
    }
  }

  function updateFunctionalComponent(current, workInProgress) {
    const fn = workInProgress.type;
    const nextProps = workInProgress.pendingProps;

    if (hasLegacyContextChanged()) {
      // Normally we can bail out on props equality but if context has changed
      // we don't do the bailout and we have to reuse existing props instead.
    } else {
      if (workInProgress.memoizedProps === nextProps) {
        return bailoutOnAlreadyFinishedWork(current, workInProgress);
      }
      // TODO: consider bringing fn.shouldComponentUpdate() back.
      // It used to be here.
    }

    const unmaskedContext = getUnmaskedContext(workInProgress);
    const context = getMaskedContext(workInProgress, unmaskedContext);

    let nextChildren;

    if (__DEV__) {
      ReactCurrentOwner.current = workInProgress;
      ReactDebugCurrentFiber.setCurrentPhase('render');
      nextChildren = fn(nextProps, context);
      ReactDebugCurrentFiber.setCurrentPhase(null);
    } else {
      nextChildren = fn(nextProps, context);
    }
    // React DevTools reads this flag.
    workInProgress.effectTag |= PerformedWork;
    reconcileChildren(current, workInProgress, nextChildren);
    memoizeProps(workInProgress, nextProps);
    return workInProgress.child;
  }

  function updateClassComponent(
    current: Fiber | null,
    workInProgress: Fiber,
    renderExpirationTime: ExpirationTime,
  ) {
    // Push context providers early to prevent context stack mismatches.
    // During mounting we don't know the child context yet as the instance doesn't exist.
    // We will invalidate the child context in finishClassComponent() right after rendering.
    const hasContext = pushLegacyContextProvider(workInProgress);
    let shouldUpdate;
    if (current === null) {
      if (workInProgress.stateNode === null) {
        // In the initial pass we might need to construct the instance.
        constructClassInstance(
          workInProgress,
          workInProgress.pendingProps,
          renderExpirationTime,
        );
        mountClassInstance(workInProgress, renderExpirationTime);

        shouldUpdate = true;
      } else {
        // In a resume, we'll already have an instance we can reuse.
        shouldUpdate = resumeMountClassInstance(
          workInProgress,
          renderExpirationTime,
        );
      }
    } else {
      shouldUpdate = updateClassInstance(
        current,
        workInProgress,
        renderExpirationTime,
      );
    }
    return finishClassComponent(
      current,
      workInProgress,
      shouldUpdate,
      hasContext,
      renderExpirationTime,
    );
  }

  function finishClassComponent(
    current: Fiber | null,
    workInProgress: Fiber,
    shouldUpdate: boolean,
    hasContext: boolean,
    renderExpirationTime: ExpirationTime,
  ) {
    // Refs should update even if shouldComponentUpdate returns false
    markRef(current, workInProgress);

    const didCaptureError =
      (workInProgress.effectTag & DidCapture) !== NoEffect;

    if (!shouldUpdate && !didCaptureError) {
      // Context providers should defer to sCU for rendering
      if (hasContext) {
        invalidateContextProvider(workInProgress, false);
      }

      return bailoutOnAlreadyFinishedWork(current, workInProgress);
    }

    const ctor = workInProgress.type;
    const instance = workInProgress.stateNode;

    // Rerender
    ReactCurrentOwner.current = workInProgress;
    let nextChildren;
    if (
      didCaptureError &&
      (!enableGetDerivedStateFromCatch ||
        typeof ctor.getDerivedStateFromCatch !== 'function')
    ) {
      // If we captured an error, but getDerivedStateFrom catch is not defined,
      // unmount all the children. componentDidCatch will schedule an update to
      // re-render a fallback. This is temporary until we migrate everyone to
      // the new API.
      // TODO: Warn in a future release.
      nextChildren = null;
    } else {
      if (__DEV__) {
        ReactDebugCurrentFiber.setCurrentPhase('render');
        nextChildren = instance.render();
        if (
          debugRenderPhaseSideEffects ||
          (debugRenderPhaseSideEffectsForStrictMode &&
            workInProgress.mode & StrictMode)
        ) {
          instance.render();
        }
        ReactDebugCurrentFiber.setCurrentPhase(null);
      } else {
        nextChildren = instance.render();
      }
    }

    // React DevTools reads this flag.
    workInProgress.effectTag |= PerformedWork;
    if (didCaptureError) {
      // If we're recovering from an error, reconcile twice: first to delete
      // all the existing children.
      reconcileChildrenAtExpirationTime(
        current,
        workInProgress,
        null,
        renderExpirationTime,
      );
      workInProgress.child = null;
      // Now we can continue reconciling like normal. This has the effect of
      // remounting all children regardless of whether their their
      // identity matches.
    }
    reconcileChildrenAtExpirationTime(
      current,
      workInProgress,
      nextChildren,
      renderExpirationTime,
    );
    // Memoize props and state using the values we just used to render.
    // TODO: Restructure so we never read values from the instance.
    memoizeState(workInProgress, instance.state);
    memoizeProps(workInProgress, instance.props);

    // The context might have changed so we need to recalculate it.
    if (hasContext) {
      invalidateContextProvider(workInProgress, true);
    }

    return workInProgress.child;
  }

  function pushHostRootContext(workInProgress) {
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
  }

  function updateHostRoot(current, workInProgress, renderExpirationTime) {
    pushHostRootContext(workInProgress);
    let updateQueue = workInProgress.updateQueue;
    if (updateQueue !== null) {
      const nextProps = workInProgress.pendingProps;
      const prevState = workInProgress.memoizedState;
      const prevChildren = prevState !== null ? prevState.element : null;
      processUpdateQueue(
        workInProgress,
        updateQueue,
        nextProps,
        null,
        renderExpirationTime,
      );
      const nextState = workInProgress.memoizedState;
      // Caution: React DevTools currently depends on this property
      // being called "element".
      const nextChildren = nextState.element;

      if (nextChildren === prevChildren) {
        // If the state is the same as before, that's a bailout because we had
        // no work that expires at this time.
        resetHydrationState();
        return bailoutOnAlreadyFinishedWork(current, workInProgress);
      }
      const root: FiberRoot = workInProgress.stateNode;
      if (
        (current === null || current.child === null) &&
        root.hydrate &&
        enterHydrationState(workInProgress)
      ) {
        // If we don't have any current children this might be the first pass.
        // We always try to hydrate. If this isn't a hydration pass there won't
        // be any children to hydrate which is effectively the same thing as
        // not hydrating.

        // This is a bit of a hack. We track the host root as a placement to
        // know that we're currently in a mounting state. That way isMounted
        // works as expected. We must reset this before committing.
        // TODO: Delete this when we delete isMounted and findDOMNode.
        workInProgress.effectTag |= Placement;

        // Ensure that children mount into this root without tracking
        // side-effects. This ensures that we don't store Placement effects on
        // nodes that will be hydrated.
        workInProgress.child = mountChildFibers(
          workInProgress,
          null,
          nextChildren,
          renderExpirationTime,
        );
      } else {
        // Otherwise reset hydration state in case we aborted and resumed another
        // root.
        resetHydrationState();
        reconcileChildren(current, workInProgress, nextChildren);
      }
      return workInProgress.child;
    }
    resetHydrationState();
    // If there is no update queue, that's a bailout because the root has no props.
    return bailoutOnAlreadyFinishedWork(current, workInProgress);
  }

  function updateHostComponent(current, workInProgress, renderExpirationTime) {
    pushHostContext(workInProgress);

    if (current === null) {
      tryToClaimNextHydratableInstance(workInProgress);
    }

    const type = workInProgress.type;
    const memoizedProps = workInProgress.memoizedProps;
    const nextProps = workInProgress.pendingProps;
    const prevProps = current !== null ? current.memoizedProps : null;

    if (hasLegacyContextChanged()) {
      // Normally we can bail out on props equality but if context has changed
      // we don't do the bailout and we have to reuse existing props instead.
    } else if (memoizedProps === nextProps) {
      const isHidden =
        workInProgress.mode & AsyncMode &&
        shouldDeprioritizeSubtree(type, nextProps);
      if (isHidden) {
        // Before bailing out, make sure we've deprioritized a hidden component.
        workInProgress.expirationTime = Never;
      }
      if (!isHidden || renderExpirationTime !== Never) {
        return bailoutOnAlreadyFinishedWork(current, workInProgress);
      }
      // If we're rendering a hidden node at hidden priority, don't bailout. The
      // parent is complete, but the children may not be.
    }

    let nextChildren = nextProps.children;
    const isDirectTextChild = shouldSetTextContent(type, nextProps);

    if (isDirectTextChild) {
      // We special case a direct text child of a host node. This is a common
      // case. We won't handle it as a reified child. We will instead handle
      // this in the host environment that also have access to this prop. That
      // avoids allocating another HostText fiber and traversing it.
      nextChildren = null;
    } else if (prevProps && shouldSetTextContent(type, prevProps)) {
      // If we're switching from a direct text child to a normal child, or to
      // empty, we need to schedule the text content to be reset.
      workInProgress.effectTag |= ContentReset;
    }

    markRef(current, workInProgress);

    // Check the host config to see if the children are offscreen/hidden.
    if (
      renderExpirationTime !== Never &&
      workInProgress.mode & AsyncMode &&
      shouldDeprioritizeSubtree(type, nextProps)
    ) {
      // Down-prioritize the children.
      workInProgress.expirationTime = Never;
      // Bailout and come back to this fiber later.
      workInProgress.memoizedProps = nextProps;
      return null;
    }

    reconcileChildren(current, workInProgress, nextChildren);
    memoizeProps(workInProgress, nextProps);
    return workInProgress.child;
  }

  function updateHostText(current, workInProgress) {
    if (current === null) {
      tryToClaimNextHydratableInstance(workInProgress);
    }
    const nextProps = workInProgress.pendingProps;
    memoizeProps(workInProgress, nextProps);
    // Nothing to do here. This is terminal. We'll do the completion step
    // immediately after.
    return null;
  }

  function mountIndeterminateComponent(
    current,
    workInProgress,
    renderExpirationTime,
  ) {
    invariant(
      current === null,
      'An indeterminate component should never have mounted. This error is ' +
        'likely caused by a bug in React. Please file an issue.',
    );
    const fn = workInProgress.type;
    const props = workInProgress.pendingProps;
    const unmaskedContext = getUnmaskedContext(workInProgress);
    const context = getMaskedContext(workInProgress, unmaskedContext);

    let value;

    if (__DEV__) {
      if (fn.prototype && typeof fn.prototype.render === 'function') {
        const componentName = getComponentName(workInProgress) || 'Unknown';

        if (!didWarnAboutBadClass[componentName]) {
          warning(
            false,
            "The <%s /> component appears to have a render method, but doesn't extend React.Component. " +
              'This is likely to cause errors. Change %s to extend React.Component instead.',
            componentName,
            componentName,
          );
          didWarnAboutBadClass[componentName] = true;
        }
      }
      ReactCurrentOwner.current = workInProgress;
      value = fn(props, context);
    } else {
      value = fn(props, context);
    }
    // React DevTools reads this flag.
    workInProgress.effectTag |= PerformedWork;

    if (
      typeof value === 'object' &&
      value !== null &&
      typeof value.render === 'function' &&
      value.$$typeof === undefined
    ) {
      const Component = workInProgress.type;

      // Proceed under the assumption that this is a class instance
      workInProgress.tag = ClassComponent;

      workInProgress.memoizedState =
        value.state !== null && value.state !== undefined ? value.state : null;

      const getDerivedStateFromProps = Component.getDerivedStateFromProps;
      if (typeof getDerivedStateFromProps === 'function') {
        applyDerivedStateFromProps(
          workInProgress,
          getDerivedStateFromProps,
          props,
        );
      }

      // Push context providers early to prevent context stack mismatches.
      // During mounting we don't know the child context yet as the instance doesn't exist.
      // We will invalidate the child context in finishClassComponent() right after rendering.
      const hasContext = pushLegacyContextProvider(workInProgress);
      adoptClassInstance(workInProgress, value);
      mountClassInstance(workInProgress, renderExpirationTime);
      return finishClassComponent(
        current,
        workInProgress,
        true,
        hasContext,
        renderExpirationTime,
      );
    } else {
      // Proceed under the assumption that this is a functional component
      workInProgress.tag = FunctionalComponent;
      if (__DEV__) {
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
          if (!didWarnAboutStatelessRefs[warningKey]) {
            didWarnAboutStatelessRefs[warningKey] = true;
            warning(
              false,
              'Stateless function components cannot be given refs. ' +
                'Attempts to access this ref will fail.%s%s',
              info,
              ReactDebugCurrentFiber.getCurrentFiberStackAddendum(),
            );
          }
        }

        if (typeof fn.getDerivedStateFromProps === 'function') {
          const componentName = getComponentName(workInProgress) || 'Unknown';

          if (
            !didWarnAboutGetDerivedStateOnFunctionalComponent[componentName]
          ) {
            warning(
              false,
              '%s: Stateless functional components do not support getDerivedStateFromProps.',
              componentName,
            );
            didWarnAboutGetDerivedStateOnFunctionalComponent[
              componentName
            ] = true;
          }
        }
      }
      reconcileChildren(current, workInProgress, value);
      memoizeProps(workInProgress, props);
      return workInProgress.child;
    }
  }

  function updateCallComponent(current, workInProgress, renderExpirationTime) {
    let nextProps = workInProgress.pendingProps;
    if (hasLegacyContextChanged()) {
      // Normally we can bail out on props equality but if context has changed
      // we don't do the bailout and we have to reuse existing props instead.
    } else if (workInProgress.memoizedProps === nextProps) {
      nextProps = workInProgress.memoizedProps;
      // TODO: When bailing out, we might need to return the stateNode instead
      // of the child. To check it for work.
      // return bailoutOnAlreadyFinishedWork(current, workInProgress);
    }

    const nextChildren = nextProps.children;

    // The following is a fork of reconcileChildrenAtExpirationTime but using
    // stateNode to store the child.
    if (current === null) {
      workInProgress.stateNode = mountChildFibers(
        workInProgress,
        workInProgress.stateNode,
        nextChildren,
        renderExpirationTime,
      );
    } else {
      workInProgress.stateNode = reconcileChildFibers(
        workInProgress,
        current.stateNode,
        nextChildren,
        renderExpirationTime,
      );
    }

    memoizeProps(workInProgress, nextProps);
    // This doesn't take arbitrary time so we could synchronously just begin
    // eagerly do the work of workInProgress.child as an optimization.
    return workInProgress.stateNode;
  }

  function updatePortalComponent(
    current,
    workInProgress,
    renderExpirationTime,
  ) {
    pushHostContainer(workInProgress, workInProgress.stateNode.containerInfo);
    const nextChildren = workInProgress.pendingProps;
    if (hasLegacyContextChanged()) {
      // Normally we can bail out on props equality but if context has changed
      // we don't do the bailout and we have to reuse existing props instead.
    } else if (workInProgress.memoizedProps === nextChildren) {
      return bailoutOnAlreadyFinishedWork(current, workInProgress);
    }

    if (current === null) {
      // Portals are special because we don't append the children during mount
      // but at commit. Therefore we need to track insertions which the normal
      // flow doesn't do during mount. This doesn't happen at the root because
      // the root always starts with a "current" with a null child.
      // TODO: Consider unifying this with how the root works.
      workInProgress.child = reconcileChildFibers(
        workInProgress,
        null,
        nextChildren,
        renderExpirationTime,
      );
      memoizeProps(workInProgress, nextChildren);
    } else {
      reconcileChildren(current, workInProgress, nextChildren);
      memoizeProps(workInProgress, nextChildren);
    }
    return workInProgress.child;
  }

  function propagateContextChange<V>(
    workInProgress: Fiber,
    context: ReactContext<V>,
    changedBits: number,
    renderExpirationTime: ExpirationTime,
  ): void {
    let fiber = workInProgress.child;
    if (fiber !== null) {
      // Set the return pointer of the child to the work-in-progress fiber.
      fiber.return = workInProgress;
    }
    while (fiber !== null) {
      let nextFiber;
      // Visit this fiber.
      switch (fiber.tag) {
        case ContextConsumer:
          // Check if the context matches.
          const observedBits: number = fiber.stateNode | 0;
          if (fiber.type === context && (observedBits & changedBits) !== 0) {
            // Update the expiration time of all the ancestors, including
            // the alternates.
            let node = fiber;
            while (node !== null) {
              const alternate = node.alternate;
              if (
                node.expirationTime === NoWork ||
                node.expirationTime > renderExpirationTime
              ) {
                node.expirationTime = renderExpirationTime;
                if (
                  alternate !== null &&
                  (alternate.expirationTime === NoWork ||
                    alternate.expirationTime > renderExpirationTime)
                ) {
                  alternate.expirationTime = renderExpirationTime;
                }
              } else if (
                alternate !== null &&
                (alternate.expirationTime === NoWork ||
                  alternate.expirationTime > renderExpirationTime)
              ) {
                alternate.expirationTime = renderExpirationTime;
              } else {
                // Neither alternate was updated, which means the rest of the
                // ancestor path already has sufficient priority.
                break;
              }
              node = node.return;
            }
            // Don't scan deeper than a matching consumer. When we render the
            // consumer, we'll continue scanning from that point. This way the
            // scanning work is time-sliced.
            nextFiber = null;
          } else {
            // Traverse down.
            nextFiber = fiber.child;
          }
          break;
        case ContextProvider:
          // Don't scan deeper if this is a matching provider
          nextFiber = fiber.type === workInProgress.type ? null : fiber.child;
          break;
        default:
          // Traverse down.
          nextFiber = fiber.child;
          break;
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

  function updateContextProvider(
    current,
    workInProgress,
    renderExpirationTime,
  ) {
    const providerType: ReactProviderType<any> = workInProgress.type;
    const context: ReactContext<any> = providerType._context;

    const newProps = workInProgress.pendingProps;
    const oldProps = workInProgress.memoizedProps;
    let canBailOnProps = true;

    if (hasLegacyContextChanged()) {
      canBailOnProps = false;
      // Normally we can bail out on props equality but if context has changed
      // we don't do the bailout and we have to reuse existing props instead.
    } else if (oldProps === newProps) {
      workInProgress.stateNode = 0;
      pushProvider(workInProgress);
      return bailoutOnAlreadyFinishedWork(current, workInProgress);
    }

    const newValue = newProps.value;
    workInProgress.memoizedProps = newProps;

    if (__DEV__) {
      const providerPropTypes = workInProgress.type.propTypes;

      if (providerPropTypes) {
        checkPropTypes(
          providerPropTypes,
          newProps,
          'prop',
          'Context.Provider',
          getCurrentFiberStackAddendum,
        );
      }
    }

    let changedBits: number;
    if (oldProps === null) {
      // Initial render
      changedBits = MAX_SIGNED_31_BIT_INT;
    } else {
      if (oldProps.value === newProps.value) {
        // No change. Bailout early if children are the same.
        if (oldProps.children === newProps.children && canBailOnProps) {
          workInProgress.stateNode = 0;
          pushProvider(workInProgress);
          return bailoutOnAlreadyFinishedWork(current, workInProgress);
        }
        changedBits = 0;
      } else {
        const oldValue = oldProps.value;
        // Use Object.is to compare the new context value to the old value.
        // Inlined Object.is polyfill.
        // https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object/is
        if (
          (oldValue === newValue &&
            (oldValue !== 0 || 1 / oldValue === 1 / newValue)) ||
          (oldValue !== oldValue && newValue !== newValue) // eslint-disable-line no-self-compare
        ) {
          // No change. Bailout early if children are the same.
          if (oldProps.children === newProps.children && canBailOnProps) {
            workInProgress.stateNode = 0;
            pushProvider(workInProgress);
            return bailoutOnAlreadyFinishedWork(current, workInProgress);
          }
          changedBits = 0;
        } else {
          changedBits =
            typeof context._calculateChangedBits === 'function'
              ? context._calculateChangedBits(oldValue, newValue)
              : MAX_SIGNED_31_BIT_INT;
          if (__DEV__) {
            warning(
              (changedBits & MAX_SIGNED_31_BIT_INT) === changedBits,
              'calculateChangedBits: Expected the return value to be a ' +
                '31-bit integer. Instead received: %s',
              changedBits,
            );
          }
          changedBits |= 0;

          if (changedBits === 0) {
            // No change. Bailout early if children are the same.
            if (oldProps.children === newProps.children && canBailOnProps) {
              workInProgress.stateNode = 0;
              pushProvider(workInProgress);
              return bailoutOnAlreadyFinishedWork(current, workInProgress);
            }
          } else {
            propagateContextChange(
              workInProgress,
              context,
              changedBits,
              renderExpirationTime,
            );
          }
        }
      }
    }

    workInProgress.stateNode = changedBits;
    pushProvider(workInProgress);

    const newChildren = newProps.children;
    reconcileChildren(current, workInProgress, newChildren);
    return workInProgress.child;
  }

  function updateContextConsumer(
    current,
    workInProgress,
    renderExpirationTime,
  ) {
    const context: ReactContext<any> = workInProgress.type;
    const newProps = workInProgress.pendingProps;
    const oldProps = workInProgress.memoizedProps;

    const newValue = context._currentValue;
    const changedBits = context._changedBits;

    if (hasLegacyContextChanged()) {
      // Normally we can bail out on props equality but if context has changed
      // we don't do the bailout and we have to reuse existing props instead.
    } else if (changedBits === 0 && oldProps === newProps) {
      return bailoutOnAlreadyFinishedWork(current, workInProgress);
    }
    workInProgress.memoizedProps = newProps;

    let observedBits = newProps.unstable_observedBits;
    if (observedBits === undefined || observedBits === null) {
      // Subscribe to all changes by default
      observedBits = MAX_SIGNED_31_BIT_INT;
    }
    // Store the observedBits on the fiber's stateNode for quick access.
    workInProgress.stateNode = observedBits;

    if ((changedBits & observedBits) !== 0) {
      // Context change propagation stops at matching consumers, for time-
      // slicing. Continue the propagation here.
      propagateContextChange(
        workInProgress,
        context,
        changedBits,
        renderExpirationTime,
      );
    } else if (oldProps === newProps) {
      // Skip over a memoized parent with a bitmask bailout even
      // if we began working on it because of a deeper matching child.
      return bailoutOnAlreadyFinishedWork(current, workInProgress);
    }
    // There is no bailout on `children` equality because we expect people
    // to often pass a bound method as a child, but it may reference
    // `this.state` or `this.props` (and thus needs to re-render on `setState`).

    const render = newProps.children;

    if (__DEV__) {
      warning(
        typeof render === 'function',
        'A context consumer was rendered with multiple children, or a child ' +
          "that isn't a function. A context consumer expects a single child " +
          'that is a function. If you did pass a function, make sure there ' +
          'is no trailing or leading whitespace around it.',
      );
    }

    const newChildren = render(newValue);
    // React DevTools reads this flag.
    workInProgress.effectTag |= PerformedWork;
    reconcileChildren(current, workInProgress, newChildren);
    return workInProgress.child;
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

  function bailoutOnAlreadyFinishedWork(
    current,
    workInProgress: Fiber,
  ): Fiber | null {
    cancelWorkTimer(workInProgress);

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

    cloneChildFibers(current, workInProgress);
    return workInProgress.child;
  }

  function bailoutOnLowPriority(current, workInProgress) {
    cancelWorkTimer(workInProgress);

    // TODO: Handle HostComponent tags here as well and call pushHostContext()?
    // See PR 8590 discussion for context
    switch (workInProgress.tag) {
      case HostRoot:
        pushHostRootContext(workInProgress);
        break;
      case ClassComponent:
        pushLegacyContextProvider(workInProgress);
        break;
      case HostPortal:
        pushHostContainer(
          workInProgress,
          workInProgress.stateNode.containerInfo,
        );
        break;
      case ContextProvider:
        pushProvider(workInProgress);
        break;
    }
    // TODO: What if this is currently in progress?
    // How can that happen? How is this not being cloned?
    return null;
  }

  // TODO: Delete memoizeProps/State and move to reconcile/bailout instead
  function memoizeProps(workInProgress: Fiber, nextProps: any) {
    workInProgress.memoizedProps = nextProps;
  }

  function memoizeState(workInProgress: Fiber, nextState: any) {
    workInProgress.memoizedState = nextState;
    // Don't reset the updateQueue, in case there are pending updates. Resetting
    // is handled by processUpdateQueue.
  }

  function beginWork(
    current: Fiber | null,
    workInProgress: Fiber,
    renderExpirationTime: ExpirationTime,
  ): Fiber | null {
    if (
      workInProgress.expirationTime === NoWork ||
      workInProgress.expirationTime > renderExpirationTime
    ) {
      return bailoutOnLowPriority(current, workInProgress);
    }

    switch (workInProgress.tag) {
      case IndeterminateComponent:
        return mountIndeterminateComponent(
          current,
          workInProgress,
          renderExpirationTime,
        );
      case FunctionalComponent:
        return updateFunctionalComponent(current, workInProgress);
      case ClassComponent:
        return updateClassComponent(
          current,
          workInProgress,
          renderExpirationTime,
        );
      case HostRoot:
        return updateHostRoot(current, workInProgress, renderExpirationTime);
      case HostComponent:
        return updateHostComponent(
          current,
          workInProgress,
          renderExpirationTime,
        );
      case HostText:
        return updateHostText(current, workInProgress);
      case CallHandlerPhase:
        // This is a restart. Reset the tag to the initial phase.
        workInProgress.tag = CallComponent;
      // Intentionally fall through since this is now the same.
      case CallComponent:
        return updateCallComponent(
          current,
          workInProgress,
          renderExpirationTime,
        );
      case ReturnComponent:
        // A return component is just a placeholder, we can just run through the
        // next one immediately.
        return null;
      case HostPortal:
        return updatePortalComponent(
          current,
          workInProgress,
          renderExpirationTime,
        );
      case ForwardRef:
        return updateForwardRef(current, workInProgress);
      case Fragment:
        return updateFragment(current, workInProgress);
      case Mode:
        return updateMode(current, workInProgress);
      case ContextProvider:
        return updateContextProvider(
          current,
          workInProgress,
          renderExpirationTime,
        );
      case ContextConsumer:
        return updateContextConsumer(
          current,
          workInProgress,
          renderExpirationTime,
        );
      default:
        invariant(
          false,
          'Unknown unit of work tag. This error is likely caused by a bug in ' +
            'React. Please file an issue.',
        );
    }
  }

  return {
    beginWork,
  };
}
