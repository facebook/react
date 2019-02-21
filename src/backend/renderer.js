// @flow

import { gte } from 'semver';
import {
  ElementTypeClass,
  ElementTypeFunction,
  ElementTypeContext,
  ElementTypeForwardRef,
  ElementTypeMemo,
  ElementTypeOtherOrUnknown,
  ElementTypeProfiler,
  ElementTypeRoot,
  ElementTypeSuspense,
} from 'src/devtools/types';
import { getDisplayName, utfEncodeString } from '../utils';
import { cleanForBridge, copyWithSet, setInObject } from './utils';
import {
  __DEBUG__,
  TREE_OPERATION_ADD,
  TREE_OPERATION_REMOVE,
  TREE_OPERATION_RESET_CHILDREN,
} from '../constants';
import { getUID } from '../utils';
import { inspectHooksOfFiber } from './ReactDebugHooks';

import type {
  DevToolsHook,
  Fiber,
  ReactRenderer,
  FiberData,
  RendererInterface,
} from './types';
import type { InspectedElement } from 'src/devtools/types';

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
    NoEffect: 0b00,
    PerformedWork: 0b01,
    Placement: 0b10,
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
  hook: DevToolsHook,
  rendererID: number,
  renderer: ReactRenderer,
  global: Object
): RendererInterface {
  const {
    ReactTypeOfWork,
    ReactSymbols,
    ReactTypeOfSideEffect,
  } = getInternalReactConstants(renderer.version);
  const { NoEffect, PerformedWork, Placement } = ReactTypeOfSideEffect;
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

  const { overrideHook, overrideProps } = renderer;

  const debug = (name: string, fiber: Fiber, parentFiber: ?Fiber): void => {
    if (__DEBUG__) {
      const fiberData = getDataForFiber(fiber);
      const fiberDisplayName = (fiberData && fiberData.displayName) || 'null';
      const parentFiberData =
        parentFiber == null ? null : getDataForFiber(parentFiber);
      const parentFiberDisplayName =
        (parentFiberData && parentFiberData.displayName) || 'null';
      console.log(
        `[renderer] %c${name} %c${getFiberID(
          getPrimaryFiber(fiber)
        )}:${fiberDisplayName} %c${
          parentFiber
            ? getFiberID(getPrimaryFiber(parentFiber)) +
              ':' +
              parentFiberDisplayName
            : ''
        }`,
        'color: red; font-weight: bold;',
        'color: blue;',
        'color: purple;'
      );
    }
  };

  // Keep this function in sync with getDataForFiber()
  function shouldFilterFiber(fiber: Fiber): boolean {
    const { tag } = fiber;

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
        const typeSymbol = getTypeSymbol(fiber);

        switch (typeSymbol) {
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

  function getTypeSymbol(fiber: Fiber): Symbol | number {
    const { type } = fiber;

    const symbolOrNumber =
      typeof type === 'object' && type !== null ? type.$$typeof : type;

    return typeof symbolOrNumber === 'symbol'
      ? symbolOrNumber.toString()
      : symbolOrNumber;
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
      case IncompleteClassComponent:
        fiberData = {
          displayName: getDisplayName(resolvedType),
          key,
          type: ElementTypeClass,
        };
        break;
      case FunctionComponent:
      case IndeterminateComponent:
        fiberData = {
          displayName: getDisplayName(resolvedType),
          key,
          type: ElementTypeFunction,
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
        const typeSymbol = getTypeSymbol(fiber);

        switch (typeSymbol) {
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
            // NOTE Keep in sync with inspectElement()
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
            // NOTE Keep in sync with inspectElement()
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

  const fiberToIDMap: Map<Fiber, number> = new Map();
  const idToFiberMap: Map<number, Fiber> = new Map();
  const primaryFibers: Set<Fiber> = new Set();

  function getFiberID(primaryFiber: Fiber): number {
    if (!fiberToIDMap.has(primaryFiber)) {
      const id = getUID();
      fiberToIDMap.set(primaryFiber, id);
      idToFiberMap.set(id, primaryFiber);
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
    if (pendingOperations.length === 0) {
      return;
    }

    // Identify which renderer this update is coming from.
    // This enables roots to be mapped to renderers,
    // Which in turn enables fiber props, states, and hooks to be inspected.
    const idArray = new Uint32Array(1);
    idArray[0] = rendererID;
    addOperation(idArray, true);

    // Let the frontend know about tree operations.
    // The first value in this array will identify which root it corresponds to,
    // so we do no longer need to dispatch a separate root-committed event.
    hook.emit('operations', pendingOperations);
    pendingOperations = new Uint32Array(0);
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
      const { _debugOwner } = fiber;

      const ownerID =
        _debugOwner != null ? getFiberID(getPrimaryFiber(_debugOwner)) : 0;

      let encodedDisplayName = ((null: any): Uint8Array);
      let encodedKey = ((null: any): Uint8Array);

      if (displayName !== null) {
        encodedDisplayName = utfEncodeString(displayName);
      }

      if (key !== null) {
        // React$Key supports string and number types as inputs,
        // But React converts numeric keys to strings, so we only have to handle that type here.
        // https://github.com/facebook/react/blob/0e67969cb1ad8c27a72294662e68fa5d7c2c9783/packages/react/src/ReactElement.js#L187
        encodedKey = utfEncodeString(((key: any): string));
      }

      const encodedDisplayNameSize =
        displayName === null ? 0 : encodedDisplayName.length;
      const encodedKeySize = key === null ? 0 : encodedKey.length;

      const operation = new Uint32Array(
        7 + encodedDisplayNameSize + encodedKeySize
      );
      operation[0] = TREE_OPERATION_ADD;
      operation[1] = id;
      operation[2] = type;
      operation[3] = getFiberID(getPrimaryFiber(parentFiber));
      operation[4] = ownerID;
      operation[5] = encodedDisplayNameSize;
      if (displayName !== null) {
        operation.set(encodedDisplayName, 6);
      }
      operation[6 + encodedDisplayNameSize] = encodedKeySize;
      if (key !== null) {
        operation.set(encodedKey, 6 + encodedDisplayNameSize + 1);
      }
      addOperation(operation);
    }
  }

  function enqueueUnmount(fiber) {
    const isRoot = fiber.tag === HostRoot;
    const primaryFiber = getPrimaryFiber(fiber);
    const id = getFiberID(primaryFiber);
    if (isRoot) {
      const operation = new Uint32Array(2);
      operation[0] = TREE_OPERATION_REMOVE;
      operation[1] = id;
      addOperation(operation);
    } else if (!shouldFilterFiber(fiber)) {
      // Non-root fibers are deleted during the commit phase.
      // They are deleted in the child-first order. However
      // DevTools currently expects deletions to be parent-first.
      // This is why we unshift deletions rather tha
      const operation = new Uint32Array(2);
      operation[0] = TREE_OPERATION_REMOVE;
      operation[1] = id;
      addOperation(operation, true);
    }
    idToFiberMap.delete(id);
    fiberToIDMap.delete(primaryFiber);
    primaryFibers.delete(primaryFiber);
  }

  function mountFiber(fiber: Fiber, parentFiber: Fiber | null) {
    debug('mountFiber()', fiber, parentFiber);

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
    debug('enqueueUpdateIfNecessary()', fiber);

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
    debug('enqueueUpdateIfNecessary()', nextFiber, parentFiber);

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
  function getNativeFromReactElement(id: number) {
    try {
      const primaryFiber = getPrimaryFiber(idToFiberMap.get(id));
      const hostInstance = renderer.findHostInstanceByFiber(primaryFiber);
      return hostInstance;
    } catch (err) {
      // The fiber might have unmounted by now.
      return null;
    }
  }
  function getFiberIDFromNative(
    hostInstance,
    findNearestUnfilteredAncestor = false
  ) {
    let fiber = renderer.findFiberByHostInstance(hostInstance);
    if (fiber != null) {
      if (findNearestUnfilteredAncestor) {
        while (fiber !== null && shouldFilterFiber(fiber)) {
          fiber = fiber.return;
        }
      }
      return getFiberID(getPrimaryFiber(((fiber: any): Fiber)));
    }
    return null;
  }

  const MOUNTING = 1;
  const MOUNTED = 2;
  const UNMOUNTED = 3;

  // This function is copied from React and should be kept in sync:
  // https://github.com/facebook/react/blob/master/packages/react-reconciler/src/ReactFiberTreeReflection.js
  function isFiberMountedImpl(fiber: Fiber): number {
    let node = fiber;
    if (!fiber.alternate) {
      // If there is no alternate, this might be a new tree that isn't inserted
      // yet. If it is, then it will have a pending insertion effect on it.
      if ((node.effectTag & Placement) !== NoEffect) {
        return MOUNTING;
      }
      while (node.return) {
        node = node.return;
        if ((node.effectTag & Placement) !== NoEffect) {
          return MOUNTING;
        }
      }
    } else {
      while (node.return) {
        node = node.return;
      }
    }
    if (node.tag === HostRoot) {
      // TODO: Check if this was a nested HostRoot when used with
      // renderContainerIntoSubtree.
      return MOUNTED;
    }
    // If we didn't hit the root, that means that we're in an disconnected tree
    // that has been unmounted.
    return UNMOUNTED;
  }

  // This function is copied from React and should be kept in sync:
  // https://github.com/facebook/react/blob/master/packages/react-reconciler/src/ReactFiberTreeReflection.js
  // It would be nice if we updated React to inject this function directly (vs just indirectly via findDOMNode).
  function findCurrentFiberUsingSlowPath(fiber: Fiber): Fiber | null {
    let alternate = fiber.alternate;
    if (!alternate) {
      // If there is no alternate, then we only need to check if it is mounted.
      const state = isFiberMountedImpl(fiber);
      if (state === UNMOUNTED) {
        throw Error('Unable to find node on an unmounted component.');
      }
      if (state === MOUNTING) {
        return null;
      }
      return fiber;
    }
    // If we have two possible branches, we'll walk backwards up to the root
    // to see what path the root points to. On the way we may hit one of the
    // special cases and we'll deal with them.
    let a = fiber;
    let b = alternate;
    while (true) {
      let parentA = a.return;
      let parentB = parentA ? parentA.alternate : null;
      if (!parentA || !parentB) {
        // We're at the root.
        break;
      }

      // If both copies of the parent fiber point to the same child, we can
      // assume that the child is current. This happens when we bailout on low
      // priority: the bailed out fiber's child reuses the current child.
      if (parentA.child === parentB.child) {
        let child = parentA.child;
        while (child) {
          if (child === a) {
            // We've determined that A is the current branch.
            if (isFiberMountedImpl(parentA) !== MOUNTED) {
              throw Error('Unable to find node on an unmounted component.');
            }
            return fiber;
          }
          if (child === b) {
            // We've determined that B is the current branch.
            if (isFiberMountedImpl(parentA) !== MOUNTED) {
              throw Error('Unable to find node on an unmounted component.');
            }
            return alternate;
          }
          child = child.sibling;
        }
        // We should never have an alternate for any mounting node. So the only
        // way this could possibly happen is if this was unmounted, if at all.
        throw Error('Unable to find node on an unmounted component.');
      }

      if (a.return !== b.return) {
        // The return pointer of A and the return pointer of B point to different
        // fibers. We assume that return pointers never criss-cross, so A must
        // belong to the child set of A.return, and B must belong to the child
        // set of B.return.
        a = parentA;
        b = parentB;
      } else {
        // The return pointers point to the same fiber. We'll have to use the
        // default, slow path: scan the child sets of each parent alternate to see
        // which child belongs to which set.
        //
        // Search parent A's child set
        let didFindChild = false;
        let child = parentA.child;
        while (child) {
          if (child === a) {
            didFindChild = true;
            a = parentA;
            b = parentB;
            break;
          }
          if (child === b) {
            didFindChild = true;
            b = parentA;
            a = parentB;
            break;
          }
          child = child.sibling;
        }
        if (!didFindChild) {
          // Search parent B's child set
          child = parentB.child;
          while (child) {
            if (child === a) {
              didFindChild = true;
              a = parentB;
              b = parentA;
              break;
            }
            if (child === b) {
              didFindChild = true;
              b = parentB;
              a = parentA;
              break;
            }
            child = child.sibling;
          }
          if (!didFindChild) {
            throw Error(
              'Child was not found in either parent set. This indicates a bug ' +
                'in React related to the return pointer. Please file an issue.'
            );
          }
        }
      }

      if (a.alternate !== b) {
        throw Error(
          "Return fibers should always be each others' alternates. " +
            'This error is likely caused by a bug in React. Please file an issue.'
        );
      }
    }
    // If the root is not a host container, we're in a disconnected tree. I.e.
    // unmounted.
    if (a.tag !== HostRoot) {
      throw Error('Unable to find node on an unmounted component.');
    }
    if (a.stateNode.current === a) {
      // We've determined that A is the current branch.
      return fiber;
    }
    // Otherwise B has to be current branch.
    return alternate;
  }

  function selectElement(id: number): void {
    let fiber = idToFiberMap.get(id);

    if (fiber == null) {
      console.warn(`Could not find Fiber with id "${id}"`);
      return;
    }

    switch (fiber.tag) {
      case ClassComponent:
      case IncompleteClassComponent:
      case IndeterminateComponent:
        global.$r = fiber.stateNode;
        break;
      case FunctionComponent:
        global.$r = {
          props: fiber.memoizedProps,
          type: fiber.type,
        };
        break;
      default:
        global.$r = null;
        break;
    }
  }

  function inspectElement(id: number): InspectedElement | null {
    let fiber = idToFiberMap.get(id);

    if (fiber == null) {
      console.warn(`Could not find Fiber with id "${id}"`);
      return null;
    }

    // Find the currently mounted version of this fiber (so we don't show the wrong props and state).
    fiber = findCurrentFiberUsingSlowPath(fiber);

    const {
      _debugOwner,
      _debugSource,
      stateNode,
      memoizedProps,
      memoizedState,
      tag,
      type,
    } = ((fiber: any): Fiber);

    const usesHooks =
      (tag === FunctionComponent ||
        tag === SimpleMemoComponent ||
        tag === ForwardRef) &&
      !!memoizedState;

    const typeSymbol = getTypeSymbol(fiber);

    let context = null;
    if (
      tag === ClassComponent ||
      tag === FunctionComponent ||
      tag === IncompleteClassComponent ||
      tag === IndeterminateComponent
    ) {
      if (stateNode && stateNode.context != null) {
        context = stateNode.context;
      }
    } else if (
      typeSymbol === CONTEXT_CONSUMER_NUMBER ||
      typeSymbol === CONTEXT_CONSUMER_SYMBOL_STRING
    ) {
      // 16.3-16.5 read from "type" because the Consumer is the actual context object.
      // 16.6+ should read from "type._context" because Consumer can be different (in DEV).
      // NOTE Keep in sync with getDataForFiber()
      const consumerResolvedContext = type._context || type;

      // Global context value.
      context = consumerResolvedContext._currentValue || null;

      // Look for overridden value.
      let current = ((fiber: any): Fiber).return;
      while (current !== null) {
        const currentTypeSymbol = getTypeSymbol(current);
        if (
          currentTypeSymbol === CONTEXT_PROVIDER_NUMBER ||
          currentTypeSymbol === CONTEXT_PROVIDER_SYMBOL_STRING
        ) {
          const currentType = current.type;

          // 16.3.0 exposed the context object as "context"
          // PR #12501 changed it to "_context" for 16.3.1+
          // NOTE Keep in sync with getDataForFiber()
          const providerResolvedContext =
            currentType._context || currentType.context;
          if (providerResolvedContext === consumerResolvedContext) {
            context = current.memoizedProps.value;
            break;
          }
        }

        current = current.return;
      }
    }

    if (context !== null) {
      // To simplify hydration and display logic for context, wrap in a value object.
      // Otherwise simple values (e.g. strings, booleans) become harder to handle.
      context = cleanForBridge({ value: context });
    }

    let owners = null;
    if (_debugOwner) {
      owners = [];
      let owner = _debugOwner;
      while (owner !== null) {
        owners.push({
          displayName: getDataForFiber(owner).displayName || 'Unknown',
          id: getFiberID(getPrimaryFiber(owner)),
        });
        owner = owner._debugOwner;
      }
    }

    return {
      id,

      // Does the current renderer support editable hooks?
      canEditHooks: typeof overrideHook === 'function',

      // Does the current renderer support editable function props?
      canEditFunctionProps: typeof overrideProps === 'function',

      // Inspectable properties.
      // TODO Review sanitization approach for the below inspectable values.
      context,
      hooks: usesHooks
        ? cleanForBridge(
            inspectHooksOfFiber(fiber, (renderer.currentDispatcherRef: any))
          )
        : null,
      props: cleanForBridge(memoizedProps),
      state: usesHooks ? null : cleanForBridge(memoizedState),

      // List of owners
      owners,

      // Location of component in source coude.
      source: _debugSource,
    };
  }

  function setInHook(
    id: number,
    index: number,
    path: Array<string | number>,
    value: any
  ) {
    const fiber = findCurrentFiberUsingSlowPath(idToFiberMap.get(id));
    if (fiber !== null) {
      if (typeof overrideHook === 'function') {
        overrideHook(fiber, index, path, value);
      }
    }
  }

  function setInProps(id: number, path: Array<string | number>, value: any) {
    const fiber = findCurrentFiberUsingSlowPath(idToFiberMap.get(id));
    if (fiber !== null) {
      const instance = fiber.stateNode;
      if (instance === null) {
        if (typeof overrideProps === 'function') {
          overrideProps(fiber, path, value);
        }
      } else {
        fiber.pendingProps = copyWithSet(instance.props, path, value);
        instance.forceUpdate();
      }
    }
  }

  function setInState(id: number, path: Array<string | number>, value: any) {
    const fiber = findCurrentFiberUsingSlowPath(idToFiberMap.get(id));
    if (fiber !== null) {
      const instance = fiber.stateNode;
      setInObject(instance.state, path, value);
      instance.forceUpdate();
    }
  }

  function setInContext(id: number, path: Array<string | number>, value: any) {
    // To simplify hydration and display of primative context values (e.g. number, string)
    // the inspectElement() method wraps context in a {value: ...} object.
    // We need to remove the first part of the path (the "value") before continuing.
    path = path.slice(1);

    const fiber = findCurrentFiberUsingSlowPath(idToFiberMap.get(id));
    if (fiber !== null) {
      const instance = fiber.stateNode;
      if (path.length === 0) {
        // Simple context value
        instance.context = value;
      } else {
        setInObject(instance.context, path, value);
      }
      instance.forceUpdate();
    }
  }

  return {
    getFiberIDFromNative,
    getNativeFromReactElement,
    handleCommitFiberRoot,
    handleCommitFiberUnmount,
    inspectElement,
    selectElement,
    cleanup,
    renderer,
    setInContext,
    setInHook,
    setInProps,
    setInState,
    walkTree,
  };
}
