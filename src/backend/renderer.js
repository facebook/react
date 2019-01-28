// @flow

import { gte } from 'semver';
import {
  ElementTypeClassOrFunction,
  ElementTypeContext,
  ElementTypeForwardRef,
  ElementTypeMemo,
  ElementTypeOtherOrUnknown,
  ElementTypeProfiler,
  ElementTypeRoot,
  ElementTypeSuspense,
} from 'src/devtools/types';
import { utfEncodeString } from '../utils';
import { getDisplayName } from './utils';
import {
  TREE_OPERATION_ADD,
  TREE_OPERATION_REMOVE,
  TREE_OPERATION_RESET_CHILDREN,
} from '../constants';

import type {
  Fiber,
  Hook,
  ReactRenderer,
  FiberData,
  RendererInterface,
} from './types';

function getInternalReactConstants(version) {
  const ReactSymbols = {
    CONCURRENT_MODE_NUMBER: 0xeacf,
    CONCURRENT_MODE_SYMBOL_STRING: 'Symbol(react.concurrent_mode)',
    DEPRECATED_ASYNC_MODE_SYMBOL_STRING: 'Symbol(react.async_mode)',
    CONTEXT_CONSUMER_NUMBER: 0xeace,
    CONTEXT_CONSUMER_SYMBOL_STRING: 'Symbol(react.context)',
    CONTEXT_PROVIDER_NUMBER: 0xeacd,
    CONTEXT_PROVIDER_SYMBOL_STRING: 'Symbol(react.provider)',
    FORWARD_REF_NUMBER: 0xead0,
    FORWARD_REF_SYMBOL_STRING: 'Symbol(react.forward_ref)',
    MEMO_NUMBER: 0xead3,
    MEMO_SYMBOL_STRING: 'Symbol(react.memo)',
    PROFILER_NUMBER: 0xead2,
    PROFILER_SYMBOL_STRING: 'Symbol(react.profiler)',
    STRICT_MODE_NUMBER: 0xeacc,
    STRICT_MODE_SYMBOL_STRING: 'Symbol(react.strict_mode)',
    SUSPENSE_NUMBER: 0xead1,
    SUSPENSE_SYMBOL_STRING: 'Symbol(react.suspense)',
    DEPRECATED_PLACEHOLDER_SYMBOL_STRING: 'Symbol(react.placeholder)',
  };

  const ReactTypeOfSideEffect = {
    PerformedWork: 1,
  };

  let ReactTypeOfWork;

  // **********************************************************
  // The section below is copied from files in React repo.
  // Keep it in sync, and add version guards if it changes.
  // **********************************************************
  if (gte(version, '16.6.0-beta.0')) {
    ReactTypeOfWork = {
      ClassComponent: 1,
      ContextConsumer: 9,
      ContextProvider: 10,
      CoroutineComponent: -1, // Removed
      CoroutineHandlerPhase: -1, // Removed
      ForwardRef: 11,
      Fragment: 7,
      FunctionComponent: 0,
      HostComponent: 5,
      HostPortal: 4,
      HostRoot: 3,
      HostText: 6,
      IncompleteClassComponent: 17,
      IndeterminateComponent: 2,
      LazyComponent: 16,
      MemoComponent: 14,
      Mode: 8,
      Profiler: 12,
      SimpleMemoComponent: 15,
      SuspenseComponent: 13,
      YieldComponent: -1, // Removed
    };
  } else if (gte(version, '16.4.3-alpha')) {
    ReactTypeOfWork = {
      ClassComponent: 2,
      ContextConsumer: 11,
      ContextProvider: 12,
      CoroutineComponent: -1, // Removed
      CoroutineHandlerPhase: -1, // Removed
      ForwardRef: 13,
      Fragment: 9,
      FunctionComponent: 0,
      HostComponent: 7,
      HostPortal: 6,
      HostRoot: 5,
      HostText: 8,
      IncompleteClassComponent: -1, // Doesn't exist yet
      IndeterminateComponent: 4,
      LazyComponent: -1, // Doesn't exist yet
      MemoComponent: -1, // Doesn't exist yet
      Mode: 10,
      Profiler: 15,
      SimpleMemoComponent: -1, // Doesn't exist yet
      SuspenseComponent: 16,
      YieldComponent: -1, // Removed
    };
  } else {
    ReactTypeOfWork = {
      ClassComponent: 2,
      ContextConsumer: 12,
      ContextProvider: 13,
      CoroutineComponent: 7,
      CoroutineHandlerPhase: 8,
      ForwardRef: 14,
      Fragment: 10,
      FunctionComponent: 1,
      HostComponent: 5,
      HostPortal: 4,
      HostRoot: 3,
      HostText: 6,
      IncompleteClassComponent: -1, // Doesn't exist yet
      IndeterminateComponent: 0,
      LazyComponent: -1, // Doesn't exist yet
      MemoComponent: -1, // Doesn't exist yet
      Mode: 11,
      Profiler: 15,
      SimpleMemoComponent: -1, // Doesn't exist yet
      SuspenseComponent: 16,
      YieldComponent: 9,
    };
  }
  // **********************************************************
  // End of copied code.
  // **********************************************************

  return {
    ReactTypeOfWork,
    ReactSymbols,
    ReactTypeOfSideEffect,
  };
}

export function attach(
  hook: Hook,
  rendererID: string,
  renderer: ReactRenderer
): RendererInterface {
  const {
    ReactTypeOfWork,
    ReactSymbols,
    ReactTypeOfSideEffect,
  } = getInternalReactConstants(renderer.version);
  const { PerformedWork } = ReactTypeOfSideEffect;
  const {
    FunctionComponent,
    ClassComponent,
    ContextConsumer,
    Fragment,
    ForwardRef,
    HostRoot,
    HostPortal,
    HostComponent,
    HostText,
    IncompleteClassComponent,
    IndeterminateComponent,
    MemoComponent,
    SimpleMemoComponent,
  } = ReactTypeOfWork;
  const {
    CONCURRENT_MODE_NUMBER,
    CONCURRENT_MODE_SYMBOL_STRING,
    DEPRECATED_ASYNC_MODE_SYMBOL_STRING,
    CONTEXT_CONSUMER_NUMBER,
    CONTEXT_CONSUMER_SYMBOL_STRING,
    CONTEXT_PROVIDER_NUMBER,
    CONTEXT_PROVIDER_SYMBOL_STRING,
    PROFILER_NUMBER,
    PROFILER_SYMBOL_STRING,
    STRICT_MODE_NUMBER,
    STRICT_MODE_SYMBOL_STRING,
    SUSPENSE_NUMBER,
    SUSPENSE_SYMBOL_STRING,
    DEPRECATED_PLACEHOLDER_SYMBOL_STRING,
  } = ReactSymbols;

  const primaryFibers: WeakSet<Fiber> = new WeakSet();

  // Keep this function in sync with getDataForFiber()
  function shouldFilterFiber(fiber: Fiber): boolean {
    const { type, tag } = fiber;

    switch (tag) {
      case ClassComponent:
      case FunctionComponent:
      case IncompleteClassComponent:
      case IndeterminateComponent:
      case ForwardRef:
      case HostRoot:
      case MemoComponent:
      case SimpleMemoComponent:
        return false;
      case HostPortal:
      case HostComponent:
      case HostText:
      case Fragment:
        return true;
      default:
        const symbolOrNumber =
          typeof type === 'object' && type !== null ? type.$$typeof : type;

        const switchValue =
          // $FlowFixMe facebook/flow/issues/2362
          typeof symbolOrNumber === 'symbol'
            ? symbolOrNumber.toString()
            : symbolOrNumber;

        switch (switchValue) {
          case CONCURRENT_MODE_NUMBER:
          case CONCURRENT_MODE_SYMBOL_STRING:
          case DEPRECATED_ASYNC_MODE_SYMBOL_STRING:
          case STRICT_MODE_NUMBER:
          case STRICT_MODE_SYMBOL_STRING:
            return true;
          case CONTEXT_PROVIDER_NUMBER:
          case CONTEXT_PROVIDER_SYMBOL_STRING:
          case CONTEXT_CONSUMER_NUMBER:
          case CONTEXT_CONSUMER_SYMBOL_STRING:
          case SUSPENSE_NUMBER:
          case SUSPENSE_SYMBOL_STRING:
          case DEPRECATED_PLACEHOLDER_SYMBOL_STRING:
          case PROFILER_NUMBER:
          case PROFILER_SYMBOL_STRING:
            return false;
          default:
            return false;
        }
    }
  }

  // TODO: we might want to change the data structure once we no longer suppport Stack versions of `getData`.
  // TODO: Keep in sync with getElementType()
  function getDataForFiber(fiber: Fiber): FiberData {
    const { elementType, type, key, tag } = fiber;

    // This is to support lazy components with a Promise as the type.
    // see https://github.com/facebook/react/pull/13397
    let resolvedType = type;
    if (typeof type === 'object' && type !== null) {
      if (typeof type.then === 'function') {
        resolvedType = type._reactResult;
      }
    }

    let fiberData: FiberData = ((null: any): FiberData);
    let displayName: string = ((null: any): string);
    let resolvedContext: any = null;

    switch (tag) {
      case ClassComponent:
      case FunctionComponent:
      case IncompleteClassComponent:
      case IndeterminateComponent:
        fiberData = {
          displayName: getDisplayName(resolvedType),
          key,
          type: ElementTypeClassOrFunction,
        };
        break;
      case ForwardRef:
        const functionName = getDisplayName(resolvedType.render, '');
        displayName =
          resolvedType.displayName ||
          (functionName !== '' ? `ForwardRef(${functionName})` : 'ForwardRef');

        fiberData = {
          displayName,
          key,
          type: ElementTypeForwardRef,
        };
        break;
      case HostRoot:
        return {
          displayName: null,
          key: null,
          type: ElementTypeRoot,
        };
      case HostPortal:
      case HostComponent:
      case HostText:
      case Fragment:
        return {
          displayName: null,
          key: null,
          type: ElementTypeOtherOrUnknown,
        };
      case MemoComponent:
      case SimpleMemoComponent:
        if (elementType.displayName) {
          displayName = elementType.displayName;
        } else {
          displayName = type.displayName || type.name;
          displayName = displayName ? `Memo(${displayName})` : 'Memo';
        }
        fiberData = {
          displayName,
          key,
          type: ElementTypeMemo,
        };
        break;
      default:
        const symbolOrNumber =
          typeof type === 'object' && type !== null ? type.$$typeof : type;

        const switchValue =
          // $FlowFixMe facebook/flow/issues/2362
          typeof symbolOrNumber === 'symbol'
            ? symbolOrNumber.toString()
            : symbolOrNumber;

        switch (switchValue) {
          case CONCURRENT_MODE_NUMBER:
          case CONCURRENT_MODE_SYMBOL_STRING:
          case DEPRECATED_ASYNC_MODE_SYMBOL_STRING:
            return {
              displayName: null,
              key: null,
              type: ElementTypeOtherOrUnknown,
            };
          case CONTEXT_PROVIDER_NUMBER:
          case CONTEXT_PROVIDER_SYMBOL_STRING:
            // 16.3.0 exposed the context object as "context"
            // PR #12501 changed it to "_context" for 16.3.1+
            resolvedContext = fiber.type._context || fiber.type.context;
            displayName = `${resolvedContext.displayName ||
              'Context'}.Provider`;

            fiberData = {
              displayName,
              key,
              type: ElementTypeContext,
            };
            break;
          case CONTEXT_CONSUMER_NUMBER:
          case CONTEXT_CONSUMER_SYMBOL_STRING:
            // 16.3-16.5 read from "type" because the Consumer is the actual context object.
            // 16.6+ should read from "type._context" because Consumer can be different (in DEV).
            resolvedContext = fiber.type._context || fiber.type;

            // NOTE: TraceUpdatesBackendManager depends on the name ending in '.Consumer'
            // If you change the name, figure out a more resilient way to detect it.
            displayName = `${resolvedContext.displayName ||
              'Context'}.Consumer`;

            fiberData = {
              displayName,
              key,
              type: ElementTypeContext,
            };
            break;
          case STRICT_MODE_NUMBER:
          case STRICT_MODE_SYMBOL_STRING:
            fiberData = {
              displayName: null,
              key,
              type: ElementTypeOtherOrUnknown,
            };
            break;
          case SUSPENSE_NUMBER:
          case SUSPENSE_SYMBOL_STRING:
          case DEPRECATED_PLACEHOLDER_SYMBOL_STRING:
            fiberData = {
              displayName: 'Suspense',
              key,
              type: ElementTypeSuspense,
            };
            break;
          case PROFILER_NUMBER:
          case PROFILER_SYMBOL_STRING:
            fiberData = {
              displayName: `Profiler(${fiber.memoizedProps.id})`,
              key,
              type: ElementTypeProfiler,
            };
            break;
          default:
            // Unknown element type.
            // This may mean a new element type that has not yet been added to DevTools.
            fiberData = {
              displayName: null,
              key,
              type: ElementTypeOtherOrUnknown,
            };
            break;
        }
        break;
    }

    return fiberData;
  }

  // This is a slightly annoying indirection.
  // It is currently necessary because DevTools wants to use unique objects as keys for instances.
  // However fibers have two versions.
  // We use this set to remember first encountered fiber for each conceptual instance.
  function getPrimaryFiber(fiber: Fiber): Fiber {
    if (primaryFibers.has(fiber)) {
      return fiber;
    }
    const { alternate } = fiber;
    if (alternate != null && primaryFibers.has(alternate)) {
      return alternate;
    }
    primaryFibers.add(fiber);
    return fiber;
  }

  let uidCounter: number = 0;
  const fiberToIDMap: WeakMap<Fiber, number> = new WeakMap();

  function getFiberID(primaryFiber: Fiber): number {
    if (!fiberToIDMap.has(primaryFiber)) {
      fiberToIDMap.set(primaryFiber, ++uidCounter);
    }
    return ((fiberToIDMap.get(primaryFiber): any): number);
  }

  // eslint-disable-next-line no-unused-vars
  function hasDataChanged(prevFiber: Fiber, nextFiber: Fiber): boolean {
    switch (nextFiber.tag) {
      case ClassComponent:
      case FunctionComponent:
      case ContextConsumer:
      case MemoComponent:
      case SimpleMemoComponent:
        // For types that execute user code, we check PerformedWork effect.
        // We don't reflect bailouts (either referential or sCU) in DevTools.
        // eslint-disable-next-line no-bitwise
        return (nextFiber.effectTag & PerformedWork) === PerformedWork;
      // Note: ContextConsumer only gets PerformedWork effect in 16.3.3+
      // so it won't get highlighted with React 16.3.0 to 16.3.2.
      default:
        // For host components and other types, we compare inputs
        // to determine whether something is an update.
        return (
          prevFiber.memoizedProps !== nextFiber.memoizedProps ||
          prevFiber.memoizedState !== nextFiber.memoizedState ||
          prevFiber.ref !== nextFiber.ref
        );
    }
  }

  // eslint-disable-next-line no-unused-vars
  function haveProfilerTimesChanged(
    prevFiber: Fiber,
    nextFiber: Fiber
  ): boolean {
    return (
      prevFiber.actualDuration !== undefined && // Short-circuit check for non-profiling builds
      (prevFiber.actualDuration !== nextFiber.actualDuration ||
        prevFiber.actualStartTime !== nextFiber.actualStartTime ||
        prevFiber.treeBaseDuration !== nextFiber.treeBaseDuration)
    );
  }

  let pendingOperations: Uint32Array = new Uint32Array(0);

  function addOperation(
    newAction: Uint32Array,
    addToStartOfQueue: boolean = false
  ): void {
    const oldActions = pendingOperations;
    pendingOperations = new Uint32Array(oldActions.length + newAction.length);
    if (addToStartOfQueue) {
      pendingOperations.set(newAction);
      pendingOperations.set(oldActions, newAction.length);
    } else {
      pendingOperations.set(oldActions);
      pendingOperations.set(newAction, oldActions.length);
    }
  }

  function flushPendingEvents(root: Object): void {
    // Let the frontend know about tree operations.
    hook.emit('operations', pendingOperations);
    pendingOperations = new Uint32Array(0);

    // Let the frontend know that we're done working on this root.
    // Technically this could be inferred, but it's better to explicitly do this for the case of multi roots.
    // Else the frontend would need to traverse the tree to identify which updates corresponded to which roots.
    hook.emit('rootCommitted', getFiberID(getPrimaryFiber(root.current)));
  }

  function enqueueMount(fiber: Fiber, parentFiber: Fiber | null) {
    const isRoot = fiber.tag === HostRoot;
    const id = getFiberID(getPrimaryFiber(fiber));

    if (isRoot) {
      const operation = new Uint32Array(4);
      operation[0] = TREE_OPERATION_ADD;
      operation[1] = id;
      operation[2] = ElementTypeRoot;
      operation[3] = 0; // Identifies this fiber as a root
      addOperation(operation);
    } else {
      const { displayName, key, type } = getDataForFiber(fiber);

      let encodedDisplayName = ((null: any): Uint8Array);
      let encodedKey = ((null: any): Uint8Array);

      if (displayName !== null) {
        encodedDisplayName = utfEncodeString(displayName);
      }

      if (key !== null) {
        if (typeof key === 'number') {
          encodedKey = new Uint8Array(1);
          encodedKey[0] = key;
        } else {
          encodedKey = utfEncodeString(key);
        }
      }

      const encodedDisplayNameSize =
        displayName === null ? 0 : encodedDisplayName.length;
      const encodedKeySize = key === null ? 0 : encodedKey.length;

      const operation = new Uint32Array(
        6 + encodedDisplayNameSize + encodedKeySize
      );
      operation[0] = TREE_OPERATION_ADD;
      operation[1] = id;
      operation[2] = type;
      operation[3] = getFiberID(getPrimaryFiber(parentFiber));
      operation[4] = encodedDisplayNameSize;
      if (displayName !== null) {
        operation.set(encodedDisplayName, 5);
      }
      operation[5 + encodedDisplayNameSize] = encodedKeySize;
      if (key !== null) {
        operation.set(encodedKey, 5 + encodedDisplayNameSize + 1);
      }
      addOperation(operation);
    }
  }

  function enqueueUnmount(fiber) {
    const isRoot = fiber.tag === HostRoot;
    const primaryFiber = getPrimaryFiber(fiber);
    if (isRoot) {
      const id = getFiberID(getPrimaryFiber(fiber));
      const operation = new Uint32Array(2);
      operation[0] = TREE_OPERATION_REMOVE;
      operation[1] = id;
      addOperation(operation);
    } else if (!shouldFilterFiber(fiber)) {
      // Non-root fibers are deleted during the commit phase.
      // They are deleted in the child-first order. However
      // DevTools currently expects deletions to be parent-first.
      // This is why we unshift deletions rather than push them.
      const id = getFiberID(getPrimaryFiber(fiber));
      const operation = new Uint32Array(2);
      operation[0] = TREE_OPERATION_REMOVE;
      operation[1] = id;
      addOperation(operation, true);
    }
    primaryFibers.delete(primaryFiber);
    fiberToIDMap.delete(primaryFiber);
  }

  function mountFiber(fiber: Fiber, parentFiber: Fiber | null) {
    const shouldEnqueueMount = !shouldFilterFiber(fiber);

    if (shouldEnqueueMount) {
      enqueueMount(fiber, parentFiber);
    }

    if (fiber.child !== null) {
      mountFiber(fiber.child, shouldEnqueueMount ? fiber : parentFiber);
    }

    if (fiber.sibling) {
      mountFiber(fiber.sibling, parentFiber);
    }
  }

  function enqueueUpdateIfNecessary(
    fiber: Fiber,
    hasChildOrderChanged: boolean
  ) {
    // The frontend only really cares about the displayName, key, and children.
    // The first two don't really change, so we are only concerned with the order of children here.
    // This is trickier than a simple comparison though, since certain types of fibers are filtered.
    if (hasChildOrderChanged) {
      const nextChildren: Array<number> = [];

      // This is a naive implimentation that shallowly recurses children.
      // We might want to revisit this if it proves to be too inefficient.
      let child = fiber.child;
      while (child !== null) {
        findReorderedChildren(child, nextChildren);
        child = child.sibling;
      }

      const numChildren = nextChildren.length;
      const operation = new Uint32Array(3 + numChildren);
      operation[0] = TREE_OPERATION_RESET_CHILDREN;
      operation[1] = getFiberID(getPrimaryFiber(fiber));
      operation[2] = numChildren;
      operation.set(nextChildren, 3);
      addOperation(operation);
    }

    // TODO (profiling) If we're profiling, also check to see if that data has changed.
  }

  function findReorderedChildren(fiber: Fiber, nextChildren: Array<number>) {
    if (!shouldFilterFiber(fiber)) {
      nextChildren.push(getFiberID(getPrimaryFiber(fiber)));
    } else {
      let child = fiber.child;
      while (child !== null) {
        findReorderedChildren(child, nextChildren);
        child = child.sibling;
      }
    }
  }

  function updateFiber(
    nextFiber: Fiber,
    prevFiber: Fiber,
    parentFiber: Fiber | null
  ) {
    const shouldEnqueueUpdate = !shouldFilterFiber(nextFiber);

    // Suspense components only have a non-null memoizedState if they're timed-out.
    const isTimedOutSuspense =
      nextFiber.tag === ReactTypeOfWork.SuspenseComponent &&
      nextFiber.memoizedState !== null;

    if (isTimedOutSuspense) {
      // The behavior of timed-out Suspense trees is unique.
      // Rather than unmount the timed out content (and possibly lose important state),
      // React re-parents this content within a hidden Fragment while the fallback is showing.
      // This behavior doesn't need to be observable in the DevTools though.
      // It might even result in a bad user experience for e.g. node selection in the Elements panel.
      // The easiest fix is to strip out the intermediate Fragment fibers,
      // so the Elements panel and Profiler don't need to special case them.
      const primaryChildFragment = nextFiber.child;
      const fallbackChildFragment = primaryChildFragment.sibling;
      const fallbackChild = fallbackChildFragment.child;

      // The primary, hidden child is never actually updated in this case,
      // so we can skip any updates to its tree.
      // We only need to track updates to the Fallback UI for now.
      if (fallbackChild.alternate) {
        updateFiber(fallbackChild, fallbackChild.alternate, nextFiber);
      } else {
        mountFiber(fallbackChild, nextFiber);
      }

      if (shouldEnqueueUpdate) {
        enqueueUpdateIfNecessary(nextFiber, false);
      }
    } else {
      let hasChildOrderChanged = false;
      if (nextFiber.child !== prevFiber.child) {
        // If the first child is different, we need to traverse them.
        // Each next child will be either a new child (mount) or an alternate (update).
        let nextChild = nextFiber.child;
        let prevChildAtSameIndex = prevFiber.child;
        while (nextChild) {
          // We already know children will be referentially different because
          // they are either new mounts or alternates of previous children.
          // Schedule updates and mounts depending on whether alternates exist.
          // We don't track deletions here because they are reported separately.
          if (nextChild.alternate) {
            const prevChild = nextChild.alternate;
            updateFiber(
              nextChild,
              prevChild,
              shouldEnqueueUpdate ? nextFiber : parentFiber
            );
            // However we also keep track if the order of the children matches
            // the previous order. They are always different referentially, but
            // if the instances line up conceptually we'll want to know that.
            if (!hasChildOrderChanged && prevChild !== prevChildAtSameIndex) {
              hasChildOrderChanged = true;
            }
          } else {
            mountFiber(
              nextChild,
              shouldEnqueueUpdate ? nextFiber : parentFiber
            );
            if (!hasChildOrderChanged) {
              hasChildOrderChanged = true;
            }
          }
          // Try the next child.
          nextChild = nextChild.sibling;
          // Advance the pointer in the previous list so that we can
          // keep comparing if they line up.
          if (!hasChildOrderChanged && prevChildAtSameIndex != null) {
            prevChildAtSameIndex = prevChildAtSameIndex.sibling;
          }
        }
        // If we have no more children, but used to, they don't line up.
        if (!hasChildOrderChanged && prevChildAtSameIndex != null) {
          hasChildOrderChanged = true;
        }
      }

      if (shouldEnqueueUpdate) {
        enqueueUpdateIfNecessary(nextFiber, hasChildOrderChanged);
      }
    }
  }

  function cleanup() {
    // We don't patch any methods so there is no cleanup.
  }

  function walkTree() {
    // Hydrate all the roots for the first time.
    hook.getFiberRoots(rendererID).forEach(root => {
      mountFiber(root.current, null);
      flushPendingEvents(root);
    });
  }

  function handleCommitFiberUnmount(fiber) {
    // This is not recursive.
    // We can't traverse fibers after unmounting so instead
    // we rely on React telling us about each unmount.
    enqueueUnmount(fiber);
  }

  function handleCommitFiberRoot(root) {
    const current = root.current;
    const alternate = current.alternate;

    if (alternate) {
      // TODO: relying on this seems a bit fishy.
      const wasMounted =
        alternate.memoizedState != null &&
        alternate.memoizedState.element != null;
      const isMounted =
        current.memoizedState != null && current.memoizedState.element != null;
      if (!wasMounted && isMounted) {
        // Mount a new root.
        mountFiber(current, null);
      } else if (wasMounted && isMounted) {
        // Update an existing root.
        updateFiber(current, alternate, null);
      } else if (wasMounted && !isMounted) {
        // Unmount an existing root.
        enqueueUnmount(current);
      }
    } else {
      // Mount a new root.
      mountFiber(current, null);
    }
    // We're done here.
    flushPendingEvents(root);
  }

  // The naming is confusing.
  // They deal with opaque nodes (fibers), not elements.
  function getNativeFromReactElement(fiber) {
    try {
      const primaryFiber = fiber;
      const hostInstance = renderer.findHostInstanceByFiber(primaryFiber);
      return hostInstance;
    } catch (err) {
      // The fiber might have unmounted by now.
      return null;
    }
  }
  function getReactElementFromNative(hostInstance) {
    const fiber = renderer.findFiberByHostInstance(hostInstance);
    if (fiber != null) {
      // TODO: type fibers.
      const primaryFiber = getPrimaryFiber((fiber: any));
      return primaryFiber;
    }
    return null;
  }

  return {
    getNativeFromReactElement,
    getReactElementFromNative,
    handleCommitFiberRoot,
    handleCommitFiberUnmount,
    cleanup,
    walkTree,
    renderer,
  };
}
