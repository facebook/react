/**
 * Copyright (c) 2013-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import type {HostConfig} from 'react-reconciler';
import type {ReactCall} from 'shared/ReactTypes';
import type {Fiber} from 'react-reconciler/src/ReactFiber';
import type {HostContext} from './ReactFiberHostContext';
import type {HydrationContext} from './ReactFiberHydrationContext';
import type {FiberRoot} from './ReactFiberRoot';
import type {ExpirationTime} from './ReactFiberExpirationTime';

import {enableAsyncSubtreeAPI} from 'shared/ReactFeatureFlags';
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
  Fragment,
} from 'shared/ReactTypeOfWork';
import {
  PerformedWork,
  Placement,
  Update,
  ContentReset,
  Err,
  Ref,
} from 'shared/ReactTypeOfSideEffect';
import {AsyncUpdates} from './ReactTypeOfInternalContext';
import {ReactCurrentOwner} from 'shared/ReactGlobalSharedState';
import {debugRenderPhaseSideEffects} from 'shared/ReactFeatureFlags';
import invariant from 'fbjs/lib/invariant';
import getComponentName from 'shared/getComponentName';
import warning from 'fbjs/lib/warning';
import shallowEqual from 'fbjs/lib/shallowEqual';
import ReactDebugCurrentFiber from './ReactDebugCurrentFiber';
import {cancelWorkTimer} from './ReactDebugFiberPerf';

import ReactFiberClassComponent from './ReactFiberClassComponent';
import {
  mountChildFibers,
  reconcileChildFibers,
  cloneChildFibers,
} from './ReactChildFiber';
import {processUpdateQueue} from './ReactFiberUpdateQueue';
import {
  isContextConsumer,
  getMaskedContext,
  getUnmaskedContext,
  hasContextChanged,
  pushContextProvider,
  pushTopLevelContextObject,
  invalidateContextProvider,
} from './ReactFiberContext';
import {NoWork, Never} from './ReactFiberExpirationTime';
import * as ReactInstanceMap from 'shared/ReactInstanceMap';
import emptyObject from 'fbjs/lib/emptyObject';

const fakeInternalInstance = {};

if (__DEV__) {
  var warnedAboutStatelessRefs = {};

  // This is so gross but it's at least non-critical and can be removed if
  // it causes problems. This is meant to give a nicer error message for
  // ReactDOM15.unstable_renderSubtreeIntoContainer(reactDOM16Component,
  // ...)) which otherwise throws a "_processChildContext is not a function"
  // exception.
  Object.defineProperty(fakeInternalInstance, '_processChildContext', {
    enumerable: false,
    value: function() {
      invariant(
        false,
        '_processChildContext is not available in React 16+. This likely ' +
          'means you have multiple copies of React and are attempting to nest ' +
          'a React 15 tree inside a React 16 tree using ' +
          "unstable_renderSubtreeIntoContainer, which isn't supported. Try " +
          'to make sure you have only one copy of React (and ideally, switch ' +
          'to ReactDOM.createPortal).',
      );
    },
  });
  Object.freeze(fakeInternalInstance);
}

export default function<T, P, I, TI, HI, PI, C, CC, CX, PL>(
  config: HostConfig<T, P, I, TI, HI, PI, C, CC, CX, PL>,
  hostContext: HostContext<C, CX>,
  hydrationContext: HydrationContext<C, CX>,
  scheduleWork: (fiber: Fiber, expirationTime: ExpirationTime) => void,
  computeExpirationForFiber: (fiber: Fiber) => ExpirationTime,
) {
  const {
    shouldSetTextContent,
    useSyncScheduling,
    shouldDeprioritizeSubtree,
  } = config;

  const {pushHostContext, pushHostContainer} = hostContext;

  const {
    enterHydrationState,
    resetHydrationState,
    tryToClaimNextHydratableInstance,
  } = hydrationContext;

  const {
    classUpdater,
    checkClassInstance,
    callComponentWillMount,
    callComponentWillReceiveProps,
    callShouldComponentUpdate,
    callComponentWillUpdate,
  } = ReactFiberClassComponent(scheduleWork, computeExpirationForFiber);

  function reconcileChildren(
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

  function updateFragment(current, workInProgress, renderExpirationTime) {
    const nextChildren = workInProgress.pendingProps;
    if (hasContextChanged()) {
      // Normally we can bail out on props equality but if context has changed
      // we don't do the bailout and we have to reuse existing props instead.
    } else if (
      nextChildren === null ||
      workInProgress.memoizedProps === nextChildren
    ) {
      return bailoutOnAlreadyFinishedWork(current, workInProgress);
    }
    reconcileChildren(
      current,
      workInProgress,
      nextChildren,
      renderExpirationTime,
    );
    memoizeProps(workInProgress, nextChildren);
    return workInProgress.child;
  }

  function markRef(current: Fiber | null, workInProgress: Fiber) {
    const ref = workInProgress.ref;
    if (ref !== null && (!current || current.ref !== ref)) {
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

    if (hasContextChanged()) {
      // Normally we can bail out on props equality but if context has changed
      // we don't do the bailout and we have to reuse existing props instead.
    } else {
      if (workInProgress.memoizedProps === nextProps) {
        return bailoutOnAlreadyFinishedWork(current, workInProgress);
      }
      // TODO: consider bringing fn.shouldComponentUpdate() back.
      // It used to be here.
    }

    var unmaskedContext = getUnmaskedContext(workInProgress);
    var context = getMaskedContext(workInProgress, unmaskedContext);

    var nextChildren;

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
    reconcileChildren(
      current,
      workInProgress,
      nextChildren,
      renderExpirationTime,
    );
    memoizeProps(workInProgress, nextProps);
    return workInProgress.child;
  }

  // ----------------- The Life-Cycle of a Composite Component -----------------
  // The render phase of a composite component is when we compute the next set
  // of children. If there are no changes to props, state, or context, then we
  // bail out and reuse the existing children. We may also bail out if
  // shouldComponentUpdate returns false. Otherwise, we'll call the render
  // method and reconcile the result against the existing set.
  //
  // The render phase is asynchronous, and may be interrupted or restarted.
  // Methods in this phase should contain no side-effects. For example,
  // componentWillMount may fire twice before the component actually mounts.
  //
  // Overview of the composite component render phase algorithm:
  //   - Do we have new props or context since the last render?
  //     -> componentWillReceiveProps(nextProps, nextContext).
  //   - Process the update queue to compute the next state.
  //   - Do we have new props, context, or state since the last render?
  //     - If they are unchanged -> bailout. Stop working and don't re-render.
  //     - If something did change, we may be able to bailout anyway:
  //       - Is this a forced update (caused by this.forceUpdate())?
  //         -> Can't bailout. Skip subsequent checks and continue rendering.
  //       - Is shouldComponentUpdate defined?
  //         -> shouldComponentUpdate(nextProps, nextState, nextContext)
  //           - If it returns false -> bailout.
  //       - Is this a PureComponent?
  //         -> Shallow compare props and state.
  //           - If they are the same -> bailout.
  //   - Proceed with rendering. Are we mounting a new component, or updating
  //     an existing one?
  //     - Mount -> componentWillMount()
  //     - Update -> componentWillUpdate(nextProps, nextState, nextContext)
  //   - Call render method to compute next children.
  //   - Reconcile next children against the previous set.
  //
  // componentDidMount, componentDidUpdate, and componentWillUnount are called
  // during the commit phase, along with other side-effects like refs,
  // callbacks, and host mutations (e.g. updating the DOM).
  // ---------------------------------------------------------------------------
  function beginClassComponent(
    current: Fiber | null,
    workInProgress: Fiber,
    renderExpirationTime: ExpirationTime,
  ) {
    // Push context providers early to prevent context stack mismatches.
    // During mounting we don't know the child context yet as the instance
    // doesn't exist. We will invalidate the child context right
    // after rendering.
    const hasContext = pushContextProvider(workInProgress);
    const nextProps = workInProgress.pendingProps;

    if (current === null) {
      if (workInProgress.stateNode === null) {
        const ctor = workInProgress.type;
        const unmaskedContext = getUnmaskedContext(workInProgress);
        const needsContext = isContextConsumer(workInProgress);
        const context = needsContext
          ? getMaskedContext(workInProgress, unmaskedContext)
          : emptyObject;
        const instance = (workInProgress.stateNode = new ctor(
          nextProps,
          context,
        ));
        return mountClassComponent(
          workInProgress,
          instance,
          nextProps,
          hasContext,
          needsContext,
          unmaskedContext,
          context,
          renderExpirationTime,
        );
      } else {
        // In a resume, we'll already have an instance we can reuse.
        invariant(false, 'Resuming work not yet implemented.');
      }
    } else {
      return updateClassComponent(
        current,
        workInProgress,
        hasContext,
        renderExpirationTime,
      );
    }
  }

  function mountClassComponent(
    workInProgress: Fiber,
    instance: any,
    nextProps: mixed,
    hasContext: boolean,
    needsContext: boolean,
    unmaskedContext: any,
    context: any,
    renderExpirationTime: ExpirationTime,
  ) {
    instance.updater = classUpdater;
    workInProgress.stateNode = instance;
    // The instance needs access to the fiber so that it can schedule updates
    ReactInstanceMap.set(instance, workInProgress);
    if (__DEV__) {
      instance._reactInternalInstance = fakeInternalInstance;
    }

    if (__DEV__) {
      checkClassInstance(workInProgress);
    }

    let nextState = instance.state || null;

    instance.props = nextProps;
    instance.state = workInProgress.memoizedState = nextState;
    instance.refs = emptyObject;
    const nextContext = (instance.context = getMaskedContext(
      workInProgress,
      unmaskedContext,
    ));

    if (
      enableAsyncSubtreeAPI &&
      workInProgress.type != null &&
      workInProgress.type.prototype != null &&
      workInProgress.type.prototype.unstable_isAsyncReactComponent === true
    ) {
      workInProgress.internalContextTag |= AsyncUpdates;
    }

    if (typeof instance.componentWillMount === 'function') {
      callComponentWillMount(workInProgress, instance);
      // If we had additional state updates during this life-cycle, let's
      // process them now.
      const updateQueue = workInProgress.updateQueue;
      if (updateQueue !== null) {
        instance.state = nextState = processUpdateQueue(
          null,
          workInProgress,
          updateQueue,
          instance,
          nextProps,
          renderExpirationTime,
        );
      }
    }
    if (typeof instance.componentDidMount === 'function') {
      workInProgress.effectTag |= Update;
    }

    return reconcileClassComponent(
      null,
      workInProgress,
      hasContext,
      nextProps,
      nextState,
      nextContext,
      renderExpirationTime,
    );
  }

  function updateClassComponent(
    current: Fiber,
    workInProgress: Fiber,
    hasContext: boolean,
    renderExpirationTime: ExpirationTime,
  ) {
    const ctor = workInProgress.type;
    const instance = workInProgress.stateNode;
    instance.props = workInProgress.memoizedProps;
    instance.state = workInProgress.memoizedState;

    const oldProps = workInProgress.memoizedProps;
    const newProps = workInProgress.pendingProps;
    const oldContext = instance.context;
    const newUnmaskedContext = getUnmaskedContext(workInProgress);
    const newContext = getMaskedContext(workInProgress, newUnmaskedContext);

    // Note: During these life-cycles, instance.props/instance.state are what
    // ever the previously attempted to render - not the "current". However,
    // during componentDidUpdate we pass the "current" props.

    if (
      typeof instance.componentWillReceiveProps === 'function' &&
      (oldProps !== newProps || oldContext !== newContext)
    ) {
      callComponentWillReceiveProps(
        workInProgress,
        instance,
        newProps,
        newContext,
      );
    }

    // Compute the next state using the memoized state and the update queue.
    const oldState = workInProgress.memoizedState;
    // TODO: Previous state can be null.
    let newState;
    if (workInProgress.updateQueue !== null) {
      newState = processUpdateQueue(
        current,
        workInProgress,
        workInProgress.updateQueue,
        instance,
        newProps,
        renderExpirationTime,
      );
    } else {
      newState = oldState;
    }

    let shouldUpdate;
    if (
      workInProgress.updateQueue !== null &&
      workInProgress.updateQueue.hasForceUpdate
    ) {
      shouldUpdate = true;
    } else if (
      !hasContextChanged() &&
      oldProps === newProps &&
      oldState === newState
    ) {
      shouldUpdate = false;
    } else if (typeof instance.shouldComponentUpdate === 'function') {
      shouldUpdate = callShouldComponentUpdate(
        workInProgress,
        instance,
        newProps,
        newState,
        newContext,
      );
    } else if (ctor.prototype && ctor.prototype.isPureReactComponent) {
      shouldUpdate =
        !shallowEqual(oldProps, newProps) || !shallowEqual(oldState, newState);
    } else {
      shouldUpdate = true;
    }

    if (!shouldUpdate) {
      // Bailout

      // If an update was already in progress, we should schedule an Update
      // effect even though we're bailing out, so that cWU/cDU are called.
      // TODO: Resuming not yet implemented
      // if (typeof instance.componentDidUpdate === 'function') {
      //   if (
      //     oldProps !== current.memoizedProps ||
      //     oldState !== current.memoizedState
      //   ) {
      //     workInProgress.effectTag |= Update;
      //   }
      // }

      return bailoutClassComponent(
        current,
        workInProgress,
        hasContext,
        newProps,
        newState,
        newContext,
        renderExpirationTime,
      );
    }

    // Re-render
    if (typeof instance.componentWillUpdate === 'function') {
      callComponentWillUpdate(
        workInProgress,
        instance,
        newProps,
        newState,
        newContext,
      );
    }
    if (typeof instance.componentDidUpdate === 'function') {
      workInProgress.effectTag |= Update;
    }
    return reconcileClassComponent(
      current,
      workInProgress,
      hasContext,
      newProps,
      newState,
      newContext,
      renderExpirationTime,
    );
  }

  function bailoutClassComponent(
    current: Fiber,
    workInProgress: Fiber,
    hasContext: boolean,
    nextProps: mixed,
    nextState: mixed,
    nextContext: mixed,
    renderExpirationTime: ExpirationTime,
  ): Fiber | null {
    // Update the existing instance's state, props, and context pointers even
    // if shouldComponentUpdate returns false.
    const instance = workInProgress.stateNode;
    instance.props = nextProps;
    instance.state = nextState;
    instance.context = nextContext;

    memoizeProps(workInProgress, nextProps);
    memoizeState(workInProgress, nextState);

    // Refs should update even if shouldComponentUpdate returns false
    markRef(current, workInProgress);
    // Context providers should defer to sCU for rendering
    if (hasContext) {
      invalidateContextProvider(workInProgress, false);
    }
    return bailoutOnAlreadyFinishedWork(current, workInProgress);
  }

  function reconcileClassComponent(
    current: Fiber | null,
    workInProgress: Fiber,
    hasContext: boolean,
    nextProps: mixed,
    nextState: mixed,
    nextContext: mixed,
    renderExpirationTime: ExpirationTime,
  ): Fiber | null {
    markRef(current, workInProgress);

    const instance = workInProgress.stateNode;
    instance.props = nextProps;
    instance.state = nextState;
    instance.context = nextContext;

    // Rerender
    ReactCurrentOwner.current = workInProgress;
    let nextChildren;
    if (__DEV__) {
      ReactDebugCurrentFiber.setCurrentPhase('render');
      nextChildren = instance.render();
      if (debugRenderPhaseSideEffects) {
        instance.render();
      }
      ReactDebugCurrentFiber.setCurrentPhase(null);
    } else {
      if (debugRenderPhaseSideEffects) {
        instance.render();
      }
      nextChildren = instance.render();
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
    memoizeState(workInProgress, nextState);

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
    if (updateQueue !== null) {
      const prevState = workInProgress.memoizedState;
      const state = processUpdateQueue(
        current,
        workInProgress,
        updateQueue,
        null,
        null,
        renderExpirationTime,
      );
      if (prevState === state) {
        // If the state is the same as before, that's a bailout because we had
        // no work that expires at this time.
        resetHydrationState();
        return bailoutOnAlreadyFinishedWork(current, workInProgress);
      }
      const element = state.element;
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
          element,
          renderExpirationTime,
        );
      } else {
        // Otherwise reset hydration state in case we aborted and resumed another
        // root.
        resetHydrationState();
        reconcileChildren(
          current,
          workInProgress,
          element,
          renderExpirationTime,
        );
      }
      memoizeState(workInProgress, state);
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

    if (hasContextChanged()) {
      // Normally we can bail out on props equality but if context has changed
      // we don't do the bailout and we have to reuse existing props instead.
    } else if (memoizedProps === nextProps) {
      return bailoutOnAlreadyFinishedWork(current, workInProgress);
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
      !useSyncScheduling &&
      shouldDeprioritizeSubtree(type, nextProps)
    ) {
      // Down-prioritize the children.
      workInProgress.expirationTime = Never;
      // Bailout and come back to this fiber later.
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
    var fn = workInProgress.type;
    var props = workInProgress.pendingProps;
    var unmaskedContext = getUnmaskedContext(workInProgress);
    var context = getMaskedContext(workInProgress, unmaskedContext);

    var value;

    if (__DEV__) {
      if (fn.prototype && typeof fn.prototype.render === 'function') {
        const componentName = getComponentName(workInProgress);
        warning(
          false,
          "The <%s /> component appears to have a render method, but doesn't extend React.Component. " +
            'This is likely to cause errors. Change %s to extend React.Component instead.',
          componentName,
          componentName,
        );
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
      typeof value.render === 'function'
    ) {
      // Proceed under the assumption that this is a class instance
      workInProgress.tag = ClassComponent;

      // Push context providers early to prevent context stack mismatches.
      // During mounting we don't know the child context yet as the instance doesn't exist.
      // We will invalidate the child context in finishClassComponent() right after rendering.
      const instance = value;
      const needsContext = isContextConsumer(workInProgress);
      const hasContext = pushContextProvider(workInProgress);
      return mountClassComponent(
        workInProgress,
        instance,
        props,
        hasContext,
        needsContext,
        unmaskedContext,
        context,
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
      reconcileChildren(current, workInProgress, value, renderExpirationTime);
      memoizeProps(workInProgress, props);
      return workInProgress.child;
    }
  }

  function updateCallComponent(current, workInProgress, renderExpirationTime) {
    var nextCall = (workInProgress.pendingProps: ReactCall);
    if (hasContextChanged()) {
      // Normally we can bail out on props equality but if context has changed
      // we don't do the bailout and we have to reuse existing props instead.
    } else if (workInProgress.memoizedProps === nextCall) {
      nextCall = workInProgress.memoizedProps;
      // TODO: When bailing out, we might need to return the stateNode instead
      // of the child. To check it for work.
      // return bailoutOnAlreadyFinishedWork(current, workInProgress);
    }

    const nextChildren = nextCall.children;

    // The following is a fork of reconcileChildren but using
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
        workInProgress.stateNode,
        nextChildren,
        renderExpirationTime,
      );
    }

    memoizeProps(workInProgress, nextCall);
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
    if (hasContextChanged()) {
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
        pushContextProvider(workInProgress);
        break;
      case HostPortal:
        pushHostContainer(
          workInProgress,
          workInProgress.stateNode.containerInfo,
        );
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
        return updateFunctionalComponent(
          current,
          workInProgress,
          renderExpirationTime,
        );
      case ClassComponent:
        return beginClassComponent(
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
      case Fragment:
        return updateFragment(current, workInProgress, renderExpirationTime);
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
    renderExpirationTime: ExpirationTime,
  ) {
    // Push context providers here to avoid a push/pop context mismatch.
    switch (workInProgress.tag) {
      case ClassComponent:
        pushContextProvider(workInProgress);
        break;
      case HostRoot:
        pushHostRootContext(workInProgress);
        break;
      default:
        invariant(
          false,
          'Invalid type of work. This error is likely caused by a bug in React. ' +
            'Please file an issue.',
        );
    }

    // Add an error effect so we can handle the error during the commit phase
    workInProgress.effectTag |= Err;

    // This is a weird case where we do "resume" work — work that failed on
    // our first attempt. Because we no longer have a notion of "progressed
    // deletions," reset the child to the current child to make sure we delete
    // it again. TODO: Find a better way to handle this, perhaps during a more
    // general overhaul of error handling.
    if (current === null) {
      workInProgress.child = null;
    } else if (workInProgress.child !== current.child) {
      workInProgress.child = current.child;
    }

    if (
      workInProgress.expirationTime === NoWork ||
      workInProgress.expirationTime > renderExpirationTime
    ) {
      return bailoutOnLowPriority(current, workInProgress);
    }

    // If we don't bail out, we're going be recomputing our children so we need
    // to drop our effect list.
    workInProgress.firstEffect = null;
    workInProgress.lastEffect = null;

    // Unmount the current children as if the component rendered null
    const nextChildren = null;
    reconcileChildren(
      current,
      workInProgress,
      nextChildren,
      renderExpirationTime,
    );

    if (workInProgress.tag === ClassComponent) {
      const instance = workInProgress.stateNode;
      workInProgress.memoizedProps = instance.props;
      workInProgress.memoizedState = instance.state;
    }

    return workInProgress.child;
  }

  return {
    beginWork,
    beginFailedWork,
  };
}
