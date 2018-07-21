/**
 * Copyright (c) 2013-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import type {ReactProviderType, ReactContext} from 'shared/ReactTypes';
import type {Fiber} from 'react-reconciler/src/ReactFiber';
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
  ForwardRef,
  Fragment,
  Mode,
  ContextProvider,
  ContextConsumer,
  Profiler,
  PlaceholderComponent,
} from 'shared/ReactTypeOfWork';
import {
  NoEffect,
  PerformedWork,
  Placement,
  ContentReset,
  DidCapture,
  Update,
  Ref,
} from 'shared/ReactTypeOfSideEffect';
import ReactSharedInternals from 'shared/ReactSharedInternals';
import {
  enableGetDerivedStateFromCatch,
  enableSuspense,
  debugRenderPhaseSideEffects,
  debugRenderPhaseSideEffectsForStrictMode,
  enableProfilerTimer,
} from 'shared/ReactFeatureFlags';
import invariant from 'shared/invariant';
import getComponentName from 'shared/getComponentName';
import ReactStrictModeWarnings from './ReactStrictModeWarnings';
import warning from 'shared/warning';
import warningWithoutStack from 'shared/warningWithoutStack';
import * as ReactCurrentFiber from './ReactCurrentFiber';
import {cancelWorkTimer} from './ReactDebugFiberPerf';

import {applyDerivedStateFromProps} from './ReactFiberClassComponent';
import {
  mountChildFibers,
  reconcileChildFibers,
  cloneChildFibers,
} from './ReactChildFiber';
import {processUpdateQueue} from './ReactUpdateQueue';
import {NoWork, Never} from './ReactFiberExpirationTime';
import {AsyncMode, ProfileMode, StrictMode} from './ReactTypeOfMode';
import {
  shouldSetTextContent,
  shouldDeprioritizeSubtree,
} from './ReactFiberHostConfig';
import {pushHostContext, pushHostContainer} from './ReactFiberHostContext';
import {
  pushProvider,
  propagateContextChange,
  readContext,
  prepareToReadContext,
} from './ReactFiberNewContext';
import {
  markActualRenderTimeStarted,
  stopBaseRenderTimerIfRunning,
} from './ReactProfilerTimer';
import {
  getMaskedContext,
  getUnmaskedContext,
  hasContextChanged as hasLegacyContextChanged,
  pushContextProvider as pushLegacyContextProvider,
  pushTopLevelContextObject,
  invalidateContextProvider,
} from './ReactFiberContext';
import {
  enterHydrationState,
  resetHydrationState,
  tryToClaimNextHydratableInstance,
} from './ReactFiberHydrationContext';
import {
  adoptClassInstance,
  constructClassInstance,
  mountClassInstance,
  resumeMountClassInstance,
  updateClassInstance,
} from './ReactFiberClassComponent';
import MAX_SIGNED_31_BIT_INT from './maxSigned31BitInt';

const ReactCurrentOwner = ReactSharedInternals.ReactCurrentOwner;

let didWarnAboutBadClass;
let didWarnAboutGetDerivedStateOnFunctionalComponent;
let didWarnAboutStatelessRefs;

if (__DEV__) {
  didWarnAboutBadClass = {};
  didWarnAboutGetDerivedStateOnFunctionalComponent = {};
  didWarnAboutStatelessRefs = {};
}

export function reconcileChildren(
  current: Fiber | null,
  workInProgress: Fiber,
  nextChildren: any,
  renderExpirationTime: ExpirationTime,
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

function updateForwardRef(current, workInProgress, renderExpirationTime) {
  const render = workInProgress.type.render;
  const nextProps = workInProgress.pendingProps;
  const ref = workInProgress.ref;
  if (hasLegacyContextChanged()) {
    // Normally we can bail out on props equality but if context has changed
    // we don't do the bailout and we have to reuse existing props instead.
  } else if (workInProgress.memoizedProps === nextProps) {
    const currentRef = current !== null ? current.ref : null;
    if (ref === currentRef) {
      return bailoutOnAlreadyFinishedWork(
        current,
        workInProgress,
        renderExpirationTime,
      );
    }
  }

  let nextChildren;
  if (__DEV__) {
    ReactCurrentOwner.current = workInProgress;
    ReactCurrentFiber.setCurrentPhase('render');
    nextChildren = render(nextProps, ref);
    ReactCurrentFiber.setCurrentPhase(null);
  } else {
    nextChildren = render(nextProps, ref);
  }

  reconcileChildren(
    current,
    workInProgress,
    nextChildren,
    renderExpirationTime,
  );
  memoizeProps(workInProgress, nextProps);
  return workInProgress.child;
}

function updateFragment(current, workInProgress, renderExpirationTime) {
  const nextChildren = workInProgress.pendingProps;
  reconcileChildren(
    current,
    workInProgress,
    nextChildren,
    renderExpirationTime,
  );
  memoizeProps(workInProgress, nextChildren);
  return workInProgress.child;
}

function updateMode(current, workInProgress, renderExpirationTime) {
  const nextChildren = workInProgress.pendingProps.children;
  reconcileChildren(
    current,
    workInProgress,
    nextChildren,
    renderExpirationTime,
  );
  memoizeProps(workInProgress, nextChildren);
  return workInProgress.child;
}

function updateProfiler(current, workInProgress, renderExpirationTime) {
  if (enableProfilerTimer) {
    workInProgress.effectTag |= Update;
  }
  const nextProps = workInProgress.pendingProps;
  const nextChildren = nextProps.children;
  reconcileChildren(
    current,
    workInProgress,
    nextChildren,
    renderExpirationTime,
  );
  memoizeProps(workInProgress, nextProps);
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

function updateFunctionalComponent(
  current,
  workInProgress,
  renderExpirationTime,
) {
  const fn = workInProgress.type;
  const nextProps = workInProgress.pendingProps;
  const unmaskedContext = getUnmaskedContext(workInProgress);
  const context = getMaskedContext(workInProgress, unmaskedContext);

  let nextChildren;
  prepareToReadContext(workInProgress, renderExpirationTime);
  if (__DEV__) {
    ReactCurrentOwner.current = workInProgress;
    ReactCurrentFiber.setCurrentPhase('render');
    nextChildren = fn(nextProps, context);
    ReactCurrentFiber.setCurrentPhase(null);
  } else {
    nextChildren = fn(nextProps, context);
  }

  // React DevTools reads this flag.
  workInProgress.effectTag |= PerformedWork;
  reconcileChildren(
    current,
    workInProgress,
    nextChildren,
    renderExpirationTime,
  );
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
  const hasPendingNewContext = prepareToReadContext(
    workInProgress,
    renderExpirationTime,
  );

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
        hasPendingNewContext,
        renderExpirationTime,
      );
    }
  } else {
    shouldUpdate = updateClassInstance(
      current,
      workInProgress,
      hasPendingNewContext,
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

  const didCaptureError = (workInProgress.effectTag & DidCapture) !== NoEffect;

  if (!shouldUpdate && !didCaptureError) {
    // Context providers should defer to sCU for rendering
    if (hasContext) {
      invalidateContextProvider(workInProgress, false);
    }

    return bailoutOnAlreadyFinishedWork(
      current,
      workInProgress,
      renderExpirationTime,
    );
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

    if (enableProfilerTimer) {
      stopBaseRenderTimerIfRunning();
    }
  } else {
    if (__DEV__) {
      ReactCurrentFiber.setCurrentPhase('render');
      nextChildren = instance.render();
      if (
        debugRenderPhaseSideEffects ||
        (debugRenderPhaseSideEffectsForStrictMode &&
          workInProgress.mode & StrictMode)
      ) {
        instance.render();
      }
      ReactCurrentFiber.setCurrentPhase(null);
    } else {
      nextChildren = instance.render();
    }
  }

  // React DevTools reads this flag.
  workInProgress.effectTag |= PerformedWork;
  if (current !== null && didCaptureError) {
    // If we're recovering from an error, reconcile twice: first to delete
    // all the existing children.
    reconcileChildren(current, workInProgress, null, renderExpirationTime);
    workInProgress.child = null;
    // Now we can continue reconciling like normal. This has the effect of
    // remounting all children regardless of whether their their
    // identity matches.
  }
  reconcileChildren(
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
  const updateQueue = workInProgress.updateQueue;
  invariant(
    updateQueue !== null,
    'If the root does not have an updateQueue, we should have already ' +
      'bailed out. This error is likely caused by a bug in React. Please ' +
      'file an issue.',
  );
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
    return bailoutOnAlreadyFinishedWork(
      current,
      workInProgress,
      renderExpirationTime,
    );
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
    reconcileChildren(
      current,
      workInProgress,
      nextChildren,
      renderExpirationTime,
    );
    resetHydrationState();
  }
  return workInProgress.child;
}

function updateHostComponent(current, workInProgress, renderExpirationTime) {
  pushHostContext(workInProgress);

  if (current === null) {
    tryToClaimNextHydratableInstance(workInProgress);
  }

  const type = workInProgress.type;
  const nextProps = workInProgress.pendingProps;
  const prevProps = current !== null ? current.memoizedProps : null;

  let nextChildren = nextProps.children;
  const isDirectTextChild = shouldSetTextContent(type, nextProps);

  if (isDirectTextChild) {
    // We special case a direct text child of a host node. This is a common
    // case. We won't handle it as a reified child. We will instead handle
    // this in the host environment that also have access to this prop. That
    // avoids allocating another HostText fiber and traversing it.
    nextChildren = null;
  } else if (prevProps !== null && shouldSetTextContent(type, prevProps)) {
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
    // Schedule this fiber to re-render at offscreen priority. Then bailout.
    workInProgress.expirationTime = Never;
    workInProgress.memoizedProps = nextProps;
    return null;
  }

  reconcileChildren(
    current,
    workInProgress,
    nextChildren,
    renderExpirationTime,
  );
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

  prepareToReadContext(workInProgress, renderExpirationTime);

  let value;

  if (__DEV__) {
    if (fn.prototype && typeof fn.prototype.render === 'function') {
      const componentName = getComponentName(fn) || 'Unknown';

      if (!didWarnAboutBadClass[componentName]) {
        warningWithoutStack(
          false,
          "The <%s /> component appears to have a render method, but doesn't extend React.Component. " +
            'This is likely to cause errors. Change %s to extend React.Component instead.',
          componentName,
          componentName,
        );
        didWarnAboutBadClass[componentName] = true;
      }
    }

    if (workInProgress.mode & StrictMode) {
      ReactStrictModeWarnings.recordLegacyContextWarning(workInProgress, null);
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
        warningWithoutStack(
          !Component.childContextTypes,
          '%s(...): childContextTypes cannot be defined on a functional component.',
          Component.displayName || Component.name || 'Component',
        );
      }
      if (workInProgress.ref !== null) {
        let info = '';
        const ownerName = ReactCurrentFiber.getCurrentFiberOwnerNameInDevOrNull();
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
              'Attempts to access this ref will fail.%s',
            info,
          );
        }
      }

      if (typeof fn.getDerivedStateFromProps === 'function') {
        const componentName = getComponentName(fn) || 'Unknown';

        if (!didWarnAboutGetDerivedStateOnFunctionalComponent[componentName]) {
          warningWithoutStack(
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
    reconcileChildren(current, workInProgress, value, renderExpirationTime);
    memoizeProps(workInProgress, props);
    return workInProgress.child;
  }
}

function updatePlaceholderComponent(
  current,
  workInProgress,
  renderExpirationTime,
) {
  if (enableSuspense) {
    const nextProps = workInProgress.pendingProps;

    // Check if we already attempted to render the normal state. If we did,
    // and we timed out, render the placeholder state.
    const alreadyCaptured =
      (workInProgress.effectTag & DidCapture) === NoEffect;

    let nextDidTimeout;
    if (current !== null && workInProgress.updateQueue !== null) {
      // We're outside strict mode. Something inside this Placeholder boundary
      // suspended during the last commit. Switch to the placholder.
      workInProgress.updateQueue = null;
      nextDidTimeout = true;
      // If we're recovering from an error, reconcile twice: first to delete
      // all the existing children.
      reconcileChildren(current, workInProgress, null, renderExpirationTime);
      current.child = null;
      // Now we can continue reconciling like normal. This has the effect of
      // remounting all children regardless of whether their their
      // identity matches.
    } else {
      nextDidTimeout = !alreadyCaptured;
    }

    if ((workInProgress.mode & StrictMode) !== NoEffect) {
      if (nextDidTimeout) {
        // If the timed-out view commits, schedule an update effect to record
        // the committed time.
        workInProgress.effectTag |= Update;
      } else {
        // The state node points to the time at which placeholder timed out.
        // We can clear it once we switch back to the normal children.
        workInProgress.stateNode = null;
      }
    }

    // If the `children` prop is a function, treat it like a render prop.
    // TODO: This is temporary until we finalize a lower level API.
    const children = nextProps.children;
    let nextChildren;
    if (typeof children === 'function') {
      nextChildren = children(nextDidTimeout);
    } else {
      nextChildren = nextDidTimeout ? nextProps.fallback : children;
    }

    workInProgress.memoizedProps = nextProps;
    workInProgress.memoizedState = nextDidTimeout;
    reconcileChildren(
      current,
      workInProgress,
      nextChildren,
      renderExpirationTime,
    );
    return workInProgress.child;
  } else {
    return null;
  }
}

function updatePortalComponent(current, workInProgress, renderExpirationTime) {
  pushHostContainer(workInProgress, workInProgress.stateNode.containerInfo);
  const nextChildren = workInProgress.pendingProps;
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
    reconcileChildren(
      current,
      workInProgress,
      nextChildren,
      renderExpirationTime,
    );
    memoizeProps(workInProgress, nextChildren);
  }
  return workInProgress.child;
}

function updateContextProvider(current, workInProgress, renderExpirationTime) {
  const providerType: ReactProviderType<any> = workInProgress.type;
  const context: ReactContext<any> = providerType._context;

  const newProps = workInProgress.pendingProps;
  const oldProps = workInProgress.memoizedProps;

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
        ReactCurrentFiber.getCurrentFiberStackInDev,
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
      if (
        oldProps.children === newProps.children &&
        !hasLegacyContextChanged()
      ) {
        workInProgress.stateNode = 0;
        pushProvider(workInProgress);
        return bailoutOnAlreadyFinishedWork(
          current,
          workInProgress,
          renderExpirationTime,
        );
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
        if (
          oldProps.children === newProps.children &&
          !hasLegacyContextChanged()
        ) {
          workInProgress.stateNode = 0;
          pushProvider(workInProgress);
          return bailoutOnAlreadyFinishedWork(
            current,
            workInProgress,
            renderExpirationTime,
          );
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
          if (
            oldProps.children === newProps.children &&
            !hasLegacyContextChanged()
          ) {
            workInProgress.stateNode = 0;
            pushProvider(workInProgress);
            return bailoutOnAlreadyFinishedWork(
              current,
              workInProgress,
              renderExpirationTime,
            );
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
  reconcileChildren(current, workInProgress, newChildren, renderExpirationTime);
  return workInProgress.child;
}

function updateContextConsumer(current, workInProgress, renderExpirationTime) {
  const context: ReactContext<any> = workInProgress.type;
  const newProps = workInProgress.pendingProps;
  const render = newProps.children;

  if (__DEV__) {
    warningWithoutStack(
      typeof render === 'function',
      'A context consumer was rendered with multiple children, or a child ' +
        "that isn't a function. A context consumer expects a single child " +
        'that is a function. If you did pass a function, make sure there ' +
        'is no trailing or leading whitespace around it.',
    );
  }

  prepareToReadContext(workInProgress, renderExpirationTime);
  const newValue = readContext(context, newProps.unstable_observedBits);
  let newChildren;
  if (__DEV__) {
    ReactCurrentOwner.current = workInProgress;
    ReactCurrentFiber.setCurrentPhase('render');
    newChildren = render(newValue);
    ReactCurrentFiber.setCurrentPhase(null);
  } else {
    newChildren = render(newValue);
  }

  // React DevTools reads this flag.
  workInProgress.effectTag |= PerformedWork;
  reconcileChildren(current, workInProgress, newChildren, renderExpirationTime);
  workInProgress.memoizedProps = newProps;
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
  current: Fiber | null,
  workInProgress: Fiber,
  renderExpirationTime: ExpirationTime,
): Fiber | null {
  cancelWorkTimer(workInProgress);

  if (current !== null) {
    // Reuse previous context list
    workInProgress.firstContextDependency = current.firstContextDependency;
  }

  if (enableProfilerTimer) {
    // Don't update "base" render times for bailouts.
    stopBaseRenderTimerIfRunning();
  }

  // Check if the children have any pending work.
  const childExpirationTime = workInProgress.childExpirationTime;
  if (
    childExpirationTime === NoWork ||
    childExpirationTime > renderExpirationTime
  ) {
    // The children don't have any work either. We can skip them.
    // TODO: Once we add back resuming, we should check if the children are
    // a work-in-progress set. If so, we need to transfer their effects.
    return null;
  } else {
    // This fiber doesn't have work, but its subtree does. Clone the child
    // fibers and continue.
    cloneChildFibers(current, workInProgress);
    return workInProgress.child;
  }
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
  if (enableProfilerTimer) {
    if (workInProgress.mode & ProfileMode) {
      markActualRenderTimeStarted(workInProgress);
    }
  }

  const updateExpirationTime = workInProgress.expirationTime;
  if (
    !hasLegacyContextChanged() &&
    (updateExpirationTime === NoWork ||
      updateExpirationTime > renderExpirationTime)
  ) {
    // This fiber does not have any pending work. Bailout without entering
    // the begin phase. There's still some bookkeeping we that needs to be done
    // in this optimized path, mostly pushing stuff onto the stack.
    switch (workInProgress.tag) {
      case HostRoot:
        pushHostRootContext(workInProgress);
        resetHydrationState();
        break;
      case HostComponent:
        pushHostContext(workInProgress);
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
        workInProgress.stateNode = 0;
        pushProvider(workInProgress);
        break;
      case Profiler:
        if (enableProfilerTimer) {
          workInProgress.effectTag |= Update;
        }
        break;
    }
    return bailoutOnAlreadyFinishedWork(
      current,
      workInProgress,
      renderExpirationTime,
    );
  }

  // Before entering the begin phase, clear the expiration time.
  workInProgress.expirationTime = NoWork;

  switch (workInProgress.tag) {
    case IndeterminateComponent:
      return mountIndeterminateComponent(
        current,
        workInProgress,
        renderExpirationTime,
      );
    case FunctionalComponent:
      return updateFunctionalComponent(
        current,
        workInProgress,
        renderExpirationTime,
      );
    case ClassComponent:
      return updateClassComponent(
        current,
        workInProgress,
        renderExpirationTime,
      );
    case HostRoot:
      return updateHostRoot(current, workInProgress, renderExpirationTime);
    case HostComponent:
      return updateHostComponent(current, workInProgress, renderExpirationTime);
    case HostText:
      return updateHostText(current, workInProgress);
    case PlaceholderComponent:
      return updatePlaceholderComponent(
        current,
        workInProgress,
        renderExpirationTime,
      );
    case HostPortal:
      return updatePortalComponent(
        current,
        workInProgress,
        renderExpirationTime,
      );
    case ForwardRef:
      return updateForwardRef(current, workInProgress, renderExpirationTime);
    case Fragment:
      return updateFragment(current, workInProgress, renderExpirationTime);
    case Mode:
      return updateMode(current, workInProgress, renderExpirationTime);
    case Profiler:
      return updateProfiler(current, workInProgress, renderExpirationTime);
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

export {beginWork};
