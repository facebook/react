// @flow

import { gte } from 'semver';
import {
  ElementTypeClass,
  ElementTypeFunction,
  ElementTypeContext,
  ElementTypeEventComponent,
  ElementTypeEventTarget,
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
  LOCAL_STORAGE_RELOAD_AND_PROFILE_KEY,
  TREE_OPERATION_ADD,
  TREE_OPERATION_REMOVE,
  TREE_OPERATION_RESET_CHILDREN,
  TREE_OPERATION_UPDATE_TREE_BASE_DURATION,
} from '../constants';
import { getUID } from '../utils';
import { inspectHooksOfFiber } from './ReactDebugHooks';

import type {
  CommitDetails,
  DevToolsHook,
  Fiber,
  FiberCommits,
  FiberData,
  Interaction,
  Interactions,
  InteractionWithCommits,
  ProfilingSummary,
  ReactRenderer,
  RendererInterface,
} from './types';
import type { InspectedElement } from 'src/devtools/views/Components/types';

function getInternalReactConstants(version) {
  const ReactSymbols = {
    CONCURRENT_MODE_NUMBER: 0xeacf,
    CONCURRENT_MODE_SYMBOL_STRING: 'Symbol(react.concurrent_mode)',
    DEPRECATED_ASYNC_MODE_SYMBOL_STRING: 'Symbol(react.async_mode)',
    CONTEXT_CONSUMER_NUMBER: 0xeace,
    CONTEXT_CONSUMER_SYMBOL_STRING: 'Symbol(react.context)',
    CONTEXT_PROVIDER_NUMBER: 0xeacd,
    CONTEXT_PROVIDER_SYMBOL_STRING: 'Symbol(react.provider)',
    EVENT_COMPONENT_NUMBER: 0xead5,
    EVENT_COMPONENT_STRING: 'Symbol(react.event_component)',
    EVENT_TARGET_NUMBER: 0xead6,
    EVENT_TARGET_STRING: 'Symbol(react.event_target)',
    EVENT_TARGET_TOUCH_HIT_NUMBER: 0xead7,
    EVENT_TARGET_TOUCH_HIT_STRING: 'Symbol(react.event_target.touch_hit)',
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
      EventComponent: 19, // Added in 16.9
      EventTarget: 20, // Added in 16.9
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
      EventComponent: -1, // Doesn't exist yet
      EventTarget: -1, // Doesn't exist yet
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
      EventComponent: -1, // Doesn't exist yet
      EventTarget: -1, // Doesn't exist yet
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
    EventComponent,
    EventTarget,
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
    SuspenseComponent,
  } = ReactTypeOfWork;
  const {
    CONCURRENT_MODE_NUMBER,
    CONCURRENT_MODE_SYMBOL_STRING,
    DEPRECATED_ASYNC_MODE_SYMBOL_STRING,
    CONTEXT_CONSUMER_NUMBER,
    CONTEXT_CONSUMER_SYMBOL_STRING,
    CONTEXT_PROVIDER_NUMBER,
    CONTEXT_PROVIDER_SYMBOL_STRING,
    EVENT_TARGET_TOUCH_HIT_NUMBER,
    EVENT_TARGET_TOUCH_HIT_STRING,
    PROFILER_NUMBER,
    PROFILER_SYMBOL_STRING,
    STRICT_MODE_NUMBER,
    STRICT_MODE_SYMBOL_STRING,
    SUSPENSE_NUMBER,
    SUSPENSE_SYMBOL_STRING,
    DEPRECATED_PLACEHOLDER_SYMBOL_STRING,
  } = ReactSymbols;

  const {
    overrideHookState,
    overrideProps,
    setSuspenseHandler,
    scheduleUpdate,
  } = renderer;
  const supportsTogglingSuspense =
    typeof setSuspenseHandler === 'function' &&
    typeof scheduleUpdate === 'function';

  const debug = (name: string, fiber: Fiber, parentFiber: ?Fiber): void => {
    if (__DEBUG__) {
      const fiberData = getDataForFiber(fiber);
      const fiberDisplayName = (fiberData && fiberData.displayName) || 'null';
      const parentFiberData =
        parentFiber == null ? null : getDataForFiber(parentFiber);
      const parentFiberDisplayName =
        (parentFiberData && parentFiberData.displayName) || 'null';
      // NOTE: calling getFiberID or getPrimaryFiber is unsafe here
      // because it will put them in the map. For now, we'll omit them.
      // TODO: better debugging story for this.
      console.log(
        `[renderer] %c${name} %c${fiberDisplayName} %c${
          parentFiber ? parentFiberDisplayName : ''
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
      case EventComponent:
      case HostPortal:
      case HostComponent:
      case HostText:
      case Fragment:
        return true;
      default:
        const typeSymbol = getTypeSymbol(fiber.type);

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

  function getTypeSymbol(type: any): Symbol | number {
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
      case EventComponent:
        fiberData = {
          displayName: null,
          key,
          type: ElementTypeEventComponent,
        };
        break;
      case EventTarget:
        switch (getTypeSymbol(elementType.type)) {
          case EVENT_TARGET_TOUCH_HIT_NUMBER:
          case EVENT_TARGET_TOUCH_HIT_STRING:
            displayName = 'TouchHitTarget';
            break;
          default:
            displayName = 'EventTarget';
            break;
        }
        fiberData = {
          displayName,
          key,
          type: ElementTypeEventTarget,
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
          key,
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
        const typeSymbol = getTypeSymbol(type);

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

  // When profiling is supported, we store the latest tree base durations for each Fiber.
  // This is so that we can quickly capture a snapshot of those values if profiling starts.
  // If we didn't store these values, we'd have to crawl the tree when profiling started,
  // and use a slow path to find each of the current Fibers.
  const idToTreeBaseDurationMap: Map<number, number> = new Map();

  // When profiling is supported, we store the latest tree base durations for each Fiber.
  // This map enables us to filter these times by root when sending them to the frontend.
  const idToRootMap: Map<number, number> = new Map();

  // When a mount or update is in progress, this value tracks the root that is being operated on.
  let currentRootID: number = -1;

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

  let pendingOperations: Array<number> = [];
  let pendingOperationsQueue: Array<Array<number>> | null = [];

  let nextOperation: Array<number> = [];
  function beginNextOperation(size: number): void {
    nextOperation.length = size;
  }
  function endNextOperation(addToStartOfQueue: boolean): void {
    if (__DEV__) {
      for (let i = 0; i < nextOperation.length; i++) {
        if (!Number.isInteger(nextOperation[i])) {
          console.error(
            'endNextOperation() was called but some values are not integers.',
            nextOperation
          );
        }
      }
    }

    if (addToStartOfQueue) {
      pendingOperations.splice.apply(
        pendingOperations,
        [0, 0].concat(nextOperation)
      );
    } else {
      pendingOperations.push.apply(pendingOperations, nextOperation);
    }
    nextOperation.length = 0;
  }

  function flushPendingEvents(root: Object): void {
    if (pendingOperations.length === 0) {
      // If we're currently profiling, send an "operations" method even if there are no mutations to the tree.
      // The frontend needs this no-op info to know how to reconstruct the tree for each commit,
      // even if a particular commit didn't change the shape of the tree.
      if (!isProfiling) {
        return;
      }
    }

    // Identify which renderer this update is coming from.
    // This enables roots to be mapped to renderers,
    // Which in turn enables fiber props, states, and hooks to be inspected.
    beginNextOperation(2);
    nextOperation[0] = rendererID;
    nextOperation[1] = getFiberID(getPrimaryFiber(root.current));
    endNextOperation(true);

    // Let the frontend know about tree operations.
    // The first value in this array will identify which root it corresponds to,
    // so we do no longer need to dispatch a separate root-committed event.
    if (pendingOperationsQueue !== null) {
      // Until the frontend has been connected, store the tree operations.
      // This will let us avoid walking the tree later when the frontend connects,
      // and it enables the Profiler's reload-and-profile functionality to work as well.
      pendingOperationsQueue.push(pendingOperations);
    } else {
      // If we've already connected to the frontend, just pass the operations through.
      hook.emit('operations', Uint32Array.from(pendingOperations));
    }

    pendingOperations = [];
  }

  function recordMount(fiber: Fiber, parentFiber: Fiber | null) {
    const isRoot = fiber.tag === HostRoot;
    const id = getFiberID(getPrimaryFiber(fiber));

    const isProfilingSupported = fiber.hasOwnProperty('treeBaseDuration');
    if (isProfilingSupported) {
      idToRootMap.set(id, currentRootID);
      idToTreeBaseDurationMap.set(id, fiber.treeBaseDuration);
    }

    const hasOwnerMetadata = fiber.hasOwnProperty('_debugOwner');

    if (isRoot) {
      beginNextOperation(5);
      nextOperation[0] = TREE_OPERATION_ADD;
      nextOperation[1] = id;
      nextOperation[2] = ElementTypeRoot;
      nextOperation[3] = isProfilingSupported ? 1 : 0;
      nextOperation[4] = hasOwnerMetadata ? 1 : 0;
      endNextOperation(false);
    } else {
      const { displayName, key, type } = getDataForFiber(fiber);
      const { _debugOwner } = fiber;

      const ownerID =
        _debugOwner != null ? getFiberID(getPrimaryFiber(_debugOwner)) : 0;
      const parentID = getFiberID(getPrimaryFiber(parentFiber));

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

      beginNextOperation(7 + encodedDisplayNameSize + encodedKeySize);
      nextOperation[0] = TREE_OPERATION_ADD;
      nextOperation[1] = id;
      nextOperation[2] = type;
      nextOperation[3] = parentID;
      nextOperation[4] = ownerID;
      nextOperation[5] = encodedDisplayNameSize;
      if (displayName !== null) {
        for (let i = 0; i < encodedDisplayName.length; i++) {
          nextOperation[6 + i] = encodedDisplayName[i];
        }
      }
      nextOperation[6 + encodedDisplayNameSize] = encodedKeySize;
      if (key !== null) {
        for (let i = 0; i < encodedKey.length; i++) {
          nextOperation[6 + encodedDisplayNameSize + 1 + i] = encodedKey[i];
        }
      }
      endNextOperation(false);
    }

    if (isProfiling) {
      // Tree base duration updates are included in the operations typed array.
      // So we have to convert them from milliseconds to microseconds so we can send them as ints.
      const treeBaseDuration = Math.floor(fiber.treeBaseDuration * 1000);

      beginNextOperation(3);
      nextOperation[0] = TREE_OPERATION_UPDATE_TREE_BASE_DURATION;
      nextOperation[1] = id;
      nextOperation[2] = treeBaseDuration;
      endNextOperation(false);

      const { actualDuration } = fiber;
      if (actualDuration > 0) {
        // If profiling is active, store durations for elements that were rendered during the commit.
        const metadata = ((currentCommitProfilingMetadata: any): CommitProfilingData);
        metadata.actualDurations.push(id, actualDuration);
        metadata.maxActualDuration = Math.max(
          metadata.maxActualDuration,
          actualDuration
        );
      }
    }
  }

  function recordUnmount(fiber: Fiber) {
    const isRoot = fiber.tag === HostRoot;
    const primaryFiber = getPrimaryFiber(fiber);
    if (!fiberToIDMap.has(primaryFiber)) {
      // If we've never seen this Fiber, it might be because
      // it is inside a non-current Suspense fragment tree,
      // and so the store is not even aware of it.
      // In that case we can just ignore it, or otherwise
      // there will be errors later on.
      primaryFibers.delete(primaryFiber);
      // TODO: this is fragile and can obscure actual bugs.
      return;
    }
    const id = getFiberID(primaryFiber);
    if (isRoot) {
      beginNextOperation(2);
      nextOperation[0] = TREE_OPERATION_REMOVE;
      nextOperation[1] = id;
      endNextOperation(false);
    } else if (!shouldFilterFiber(fiber)) {
      beginNextOperation(2);
      nextOperation[0] = TREE_OPERATION_REMOVE;
      nextOperation[1] = id;
      // Non-root fibers are deleted during the commit phase.
      // They are deleted in the parent-first order. However
      // DevTools currently expects deletions to be child-first.
      // This is why we prepend the delete operation to the queue.
      endNextOperation(true);
    }
    fiberToIDMap.delete(primaryFiber);
    idToFiberMap.delete(id);
    primaryFibers.delete(primaryFiber);

    const isProfilingSupported = fiber.hasOwnProperty('treeBaseDuration');
    if (isProfilingSupported) {
      idToRootMap.delete(id);
      idToTreeBaseDurationMap.delete(id);
    }
  }

  function mountFiberRecursively(
    fiber: Fiber,
    parentFiber: Fiber | null,
    traverseSiblings = false
  ) {
    if (__DEBUG__) {
      debug('mountFiberRecursively()', fiber, parentFiber);
    }

    const shouldIncludeInTree = !shouldFilterFiber(fiber);
    if (shouldIncludeInTree) {
      recordMount(fiber, parentFiber);
    }

    const isTimedOutSuspense =
      fiber.tag === ReactTypeOfWork.SuspenseComponent &&
      fiber.memoizedState !== null;

    if (isTimedOutSuspense) {
      // Special case: if Suspense mounts in a timed-out state,
      // get the fallback child from the inner fragment and mount
      // it as if it was our own child. Updates handle this too.
      const primaryChildFragment = fiber.child;
      const fallbackChildFragment = primaryChildFragment.sibling;
      const fallbackChild = fallbackChildFragment.child;
      if (fallbackChild !== null) {
        mountFiberRecursively(
          fallbackChild,
          shouldIncludeInTree ? fiber : parentFiber,
          true
        );
      }
    } else {
      if (fiber.child !== null) {
        mountFiberRecursively(
          fiber.child,
          shouldIncludeInTree ? fiber : parentFiber,
          true
        );
      }
    }

    if (traverseSiblings && fiber.sibling !== null) {
      mountFiberRecursively(fiber.sibling, parentFiber, true);
    }
  }

  function unmountFiberChildrenRecursively(fiber: Fiber) {
    if (__DEBUG__) {
      debug('unmountFiberChildrenRecursively()', fiber);
    }
    let child = fiber.child;
    while (child !== null) {
      recordUnmount(child);
      unmountFiberChildrenRecursively(child);
      child = child.sibling;
    }
  }

  function recordTreeDuration(fiber: Fiber) {
    const id = getFiberID(getPrimaryFiber(fiber));
    const { actualDuration, treeBaseDuration } = fiber;

    idToTreeBaseDurationMap.set(id, fiber.treeBaseDuration);

    if (isProfiling) {
      if (treeBaseDuration !== fiber.alternate.treeBaseDuration) {
        // Tree base duration updates are included in the operations typed array.
        // So we have to convert them from milliseconds to microseconds so we can send them as ints.
        const treeBaseDuration = Math.floor(fiber.treeBaseDuration * 1000);

        beginNextOperation(3);
        nextOperation[0] = TREE_OPERATION_UPDATE_TREE_BASE_DURATION;
        nextOperation[1] = getFiberID(getPrimaryFiber(fiber));
        nextOperation[2] = treeBaseDuration;
        endNextOperation(false);
      }

      if (haveProfilerTimesChanged(fiber.alternate, fiber)) {
        if (actualDuration > 0) {
          // If profiling is active, store durations for elements that were rendered during the commit.
          const metadata = ((currentCommitProfilingMetadata: any): CommitProfilingData);
          metadata.actualDurations.push(id, actualDuration);
          metadata.maxActualDuration = Math.max(
            metadata.maxActualDuration,
            actualDuration
          );
        }
      }
    }
  }

  function recordResetChildren(fiber: Fiber, childSet: Fiber) {
    // The frontend only really cares about the displayName, key, and children.
    // The first two don't really change, so we are only concerned with the order of children here.
    // This is trickier than a simple comparison though, since certain types of fibers are filtered.
    const nextChildren: Array<number> = [];

    // This is a naive implimentation that shallowly recurses children.
    // We might want to revisit this if it proves to be too inefficient.
    let child = childSet;
    while (child !== null) {
      findReorderedChildrenRecursively(child, nextChildren);
      child = child.sibling;
    }

    const numChildren = nextChildren.length;
    beginNextOperation(3 + numChildren);
    nextOperation[0] = TREE_OPERATION_RESET_CHILDREN;
    nextOperation[1] = getFiberID(getPrimaryFiber(fiber));
    nextOperation[2] = numChildren;
    for (let i = 0; i < nextChildren.length; i++) {
      nextOperation[3 + i] = nextChildren[i];
    }
    endNextOperation(false);
  }

  function findReorderedChildrenRecursively(
    fiber: Fiber,
    nextChildren: Array<number>
  ) {
    if (!shouldFilterFiber(fiber)) {
      nextChildren.push(getFiberID(getPrimaryFiber(fiber)));
    } else {
      let child = fiber.child;
      while (child !== null) {
        findReorderedChildrenRecursively(child, nextChildren);
        child = child.sibling;
      }
    }
  }

  // Returns whether closest unfiltered fiber parent needs to reset its child list.
  function updateFiberRecursively(
    nextFiber: Fiber,
    prevFiber: Fiber,
    parentFiber: Fiber | null
  ): boolean {
    if (__DEBUG__) {
      debug('updateFiberRecursively()', nextFiber, parentFiber);
    }
    const shouldIncludeInTree = !shouldFilterFiber(nextFiber);
    const isSuspense = nextFiber.tag === SuspenseComponent;
    let shouldResetChildren = false;
    // The behavior of timed-out Suspense trees is unique.
    // Rather than unmount the timed out content (and possibly lose important state),
    // React re-parents this content within a hidden Fragment while the fallback is showing.
    // This behavior doesn't need to be observable in the DevTools though.
    // It might even result in a bad user experience for e.g. node selection in the Elements panel.
    // The easiest fix is to strip out the intermediate Fragment fibers,
    // so the Elements panel and Profiler don't need to special case them.
    // Suspense components only have a non-null memoizedState if they're timed-out.
    const prevDidTimeout = isSuspense && prevFiber.memoizedState !== null;
    const nextDidTimeOut = isSuspense && nextFiber.memoizedState !== null;
    // The logic below is inspired by the codepaths in updateSuspenseComponent()
    // inside ReactFiberBeginWork in the React source code.
    if (prevDidTimeout && nextDidTimeOut) {
      // Fallback -> Fallback:
      // 1. Reconcile fallback set.
      const nextFallbackChildSet = nextFiber.child.sibling;
      // Note: We can't use nextFiber.child.sibling.alternate
      // because the set is special and alternate may not exist.
      const prevFallbackChildSet = prevFiber.child.sibling;
      if (
        updateFiberRecursively(
          nextFallbackChildSet,
          prevFallbackChildSet,
          nextFiber
        )
      ) {
        shouldResetChildren = true;
      }
    } else if (prevDidTimeout && !nextDidTimeOut) {
      // Fallback -> Primary:
      // 1. Unmount fallback set
      // Note: don't emulate fallback unmount because React actually did it.
      // 2. Mount primary set
      const nextPrimaryChildSet = nextFiber.child;
      if (nextPrimaryChildSet !== null) {
        mountFiberRecursively(nextPrimaryChildSet, nextFiber, true);
      }
      shouldResetChildren = true;
    } else if (!prevDidTimeout && nextDidTimeOut) {
      // Primary -> Fallback:
      // 1. Hide primary set
      // This is not a real unmount, so it won't get reported by React.
      // We need to manually walk the previous tree and record unmounts.
      unmountFiberChildrenRecursively(prevFiber);
      // 2. Mount fallback set
      const nextFallbackChildSet = nextFiber.child.sibling;
      mountFiberRecursively(nextFallbackChildSet, nextFiber, true);
      shouldResetChildren = true;
    } else {
      // Common case: Primary -> Primary.
      // This is the same codepath as for non-Suspense fibers.
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
            if (
              updateFiberRecursively(
                nextChild,
                prevChild,
                shouldIncludeInTree ? nextFiber : parentFiber
              )
            ) {
              // If a nested tree child order changed but it can't handle its own
              // child order invalidation (e.g. because it's filtered out like host nodes),
              // propagate the need to reset child order upwards to this Fiber.
              shouldResetChildren = true;
            }
            // However we also keep track if the order of the children matches
            // the previous order. They are always different referentially, but
            // if the instances line up conceptually we'll want to know that.
            if (prevChild !== prevChildAtSameIndex) {
              shouldResetChildren = true;
            }
          } else {
            mountFiberRecursively(
              nextChild,
              shouldIncludeInTree ? nextFiber : parentFiber
            );
            shouldResetChildren = true;
          }
          // Try the next child.
          nextChild = nextChild.sibling;
          // Advance the pointer in the previous list so that we can
          // keep comparing if they line up.
          if (!shouldResetChildren && prevChildAtSameIndex !== null) {
            prevChildAtSameIndex = prevChildAtSameIndex.sibling;
          }
        }
        // If we have no more children, but used to, they don't line up.
        if (prevChildAtSameIndex !== null) {
          shouldResetChildren = true;
        }
      }
    }
    if (shouldIncludeInTree) {
      const isProfilingSupported = nextFiber.hasOwnProperty('treeBaseDuration');
      if (isProfilingSupported) {
        recordTreeDuration(nextFiber);
      }
    }
    if (shouldResetChildren) {
      // We need to crawl the subtree for closest non-filtered Fibers
      // so that we can display them in a flat children set.
      if (shouldIncludeInTree) {
        // Normally, search for children from the rendered child.
        let nextChildSet = nextFiber.child;
        if (nextDidTimeOut) {
          // Special case: timed-out Suspense renders the fallback set.
          nextChildSet = nextFiber.child.sibling;
        }
        recordResetChildren(nextFiber, nextChildSet);
        // We've handled the child order change for this Fiber.
        // Since it's included, there's no need to invalidate parent child order.
        return false;
      } else {
        // Let the closest unfiltered parent Fiber reset its child order instead.
        return true;
      }
    } else {
      return false;
    }
  }

  function cleanup() {
    // We don't patch any methods so there is no cleanup.
  }

  function flushInitialOperations() {
    const localPendingOperationsQueue = pendingOperationsQueue;

    pendingOperationsQueue = null;

    if (
      localPendingOperationsQueue !== null &&
      localPendingOperationsQueue.length > 0
    ) {
      // We may have already queued up some operations before the frontend connected
      // If so, let the frontend know about them.
      localPendingOperationsQueue.forEach(pendingOperations => {
        hook.emit('operations', Uint32Array.from(pendingOperations));
      });
    } else {
      // If we have not been profiling, then we can just walk the tree and build up its current state as-is.
      hook.getFiberRoots(rendererID).forEach(root => {
        currentRootID = getFiberID(getPrimaryFiber(root.current));

        if (isProfiling) {
          // If profiling is active, store commit time and duration, and the current interactions.
          // The frontend may request this information after profiling has stopped.
          currentCommitProfilingMetadata = {
            actualDurations: [],
            commitTime: performance.now() - profilingStartTime,
            interactions: Array.from(root.memoizedInteractions).map(
              (interaction: Interaction) => ({
                ...interaction,
                timestamp: interaction.timestamp - profilingStartTime,
              })
            ),
            maxActualDuration: 0,
          };
        }

        mountFiberRecursively(root.current, null);
        flushPendingEvents(root);
        currentRootID = -1;
      });
    }
  }

  function handleCommitFiberUnmount(fiber) {
    // This is not recursive.
    // We can't traverse fibers after unmounting so instead
    // we rely on React telling us about each unmount.
    recordUnmount(fiber);
  }

  function handleCommitFiberRoot(root) {
    const current = root.current;
    const alternate = current.alternate;

    currentRootID = getFiberID(getPrimaryFiber(current));

    if (isProfiling) {
      // If profiling is active, store commit time and duration, and the current interactions.
      // The frontend may request this information after profiling has stopped.
      currentCommitProfilingMetadata = {
        actualDurations: [],
        commitTime: performance.now() - profilingStartTime,
        interactions: Array.from(root.memoizedInteractions).map(
          (interaction: Interaction) => ({
            ...interaction,
            timestamp: interaction.timestamp - profilingStartTime,
          })
        ),
        maxActualDuration: 0,
      };
    }

    if (alternate) {
      // TODO: relying on this seems a bit fishy.
      const wasMounted =
        alternate.memoizedState != null &&
        alternate.memoizedState.element != null;
      const isMounted =
        current.memoizedState != null && current.memoizedState.element != null;
      if (!wasMounted && isMounted) {
        // Mount a new root.
        mountFiberRecursively(current, null);
      } else if (wasMounted && isMounted) {
        // Update an existing root.
        updateFiberRecursively(current, alternate, null);
      } else if (wasMounted && !isMounted) {
        // Unmount an existing root.
        recordUnmount(current);
      }
    } else {
      // Mount a new root.
      mountFiberRecursively(current, null);
    }

    if (isProfiling) {
      const commitProfilingMetadata = ((rootToCommitProfilingMetadataMap: any): CommitProfilingMetadataMap).get(
        currentRootID
      );
      if (commitProfilingMetadata != null) {
        commitProfilingMetadata.push(
          ((currentCommitProfilingMetadata: any): CommitProfilingData)
        );
      } else {
        ((rootToCommitProfilingMetadataMap: any): CommitProfilingMetadataMap).set(
          currentRootID,
          [((currentCommitProfilingMetadata: any): CommitProfilingData)]
        );
      }
    }

    // We're done here.
    flushPendingEvents(root);

    currentRootID = -1;
  }

  function findNativeByFiberID(id: number) {
    try {
      const fiber = findCurrentFiberUsingSlowPath(idToFiberMap.get(id));
      if (fiber === null) {
        return null;
      }
      const isTimedOutSuspense =
        fiber.tag === SuspenseComponent && fiber.memoizedState !== null;
      if (!isTimedOutSuspense) {
        // Normal case.
        return renderer.findHostInstanceByFiber(fiber);
      } else {
        // A timed-out Suspense's findDOMNode is useless.
        // Try our best to find the fallback directly.
        const maybeFallbackFiber =
          (fiber.child && fiber.child.sibling) || fiber;
        return renderer.findHostInstanceByFiber(maybeFallbackFiber);
      }
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
  // BEGIN copied code
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
    let a: Fiber = fiber;
    let b: Fiber = alternate;
    while (true) {
      let parentA = a.return;
      if (parentA === null) {
        // We're at the root.
        break;
      }
      let parentB = parentA.alternate;
      if (parentB === null) {
        // There is no alternate. This is an unusual case. Currently, it only
        // happens when a Suspense component is hidden. An extra fragment fiber
        // is inserted in between the Suspense fiber and its children. Skip
        // over this extra fragment fiber and proceed to the next parent.
        const nextParent = parentA.return;
        if (nextParent !== null) {
          a = b = nextParent;
          continue;
        }
        // If there's no parent, we're at the root.
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
  // END copied code

  function selectElement(id: number): void {
    let fiber = idToFiberMap.get(id);

    if (fiber == null) {
      console.warn(`Could not find Fiber with id "${id}"`);
      return;
    }

    const { memoizedProps, stateNode, tag, type } = fiber;

    switch (tag) {
      case ClassComponent:
      case IncompleteClassComponent:
      case IndeterminateComponent:
        global.$r = stateNode;
        break;
      case FunctionComponent:
        global.$r = {
          props: memoizedProps,
          type,
        };
        break;
      case ForwardRef:
        global.$r = {
          props: memoizedProps,
          type: type.render,
        };
        break;
      default:
        global.$r = null;
        break;
    }
  }

  function prepareViewElementSource(id: number): void {
    let fiber = idToFiberMap.get(id);

    if (fiber == null) {
      console.warn(`Could not find Fiber with id "${id}"`);
      return;
    }

    switch (fiber.tag) {
      case ClassComponent:
      case IncompleteClassComponent:
      case IndeterminateComponent:
      case FunctionComponent:
        global.$type = fiber.type;
        break;
      case ForwardRef:
        global.$type = fiber.type.render;
        break;
      default:
        global.$type = null;
        break;
    }
  }

  function inspectElementRaw(id: number): InspectedElement | null {
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

    const typeSymbol = getTypeSymbol(type);

    let canViewSource = false;
    let context = null;
    if (
      tag === ClassComponent ||
      tag === FunctionComponent ||
      tag === IncompleteClassComponent ||
      tag === IndeterminateComponent ||
      tag === ForwardRef
    ) {
      canViewSource = true;
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
        const currentType = current.type;
        const currentTypeSymbol = getTypeSymbol(currentType);
        if (
          currentTypeSymbol === CONTEXT_PROVIDER_NUMBER ||
          currentTypeSymbol === CONTEXT_PROVIDER_SYMBOL_STRING
        ) {
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
      context = { value: context };
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

    const isTimedOutSuspense =
      tag === SuspenseComponent && memoizedState !== null;

    return {
      id,

      // Does the current renderer support editable hooks?
      canEditHooks: typeof overrideHookState === 'function',

      // Does the current renderer support editable function props?
      canEditFunctionProps: typeof overrideProps === 'function',

      canToggleSuspense:
        supportsTogglingSuspense &&
        // If it's showing the real content, we can always flip fallback.
        (!isTimedOutSuspense ||
          // If it's showing fallback because we previously forced it to,
          // allow toggling it back to remove the fallback override.
          forceFallbackForSuspenseIDs.has(id)),

      // Can view component source location.
      canViewSource,

      displayName: getDataForFiber(fiber).displayName,

      // Inspectable properties.
      // TODO Review sanitization approach for the below inspectable values.
      context,
      hooks: usesHooks
        ? inspectHooksOfFiber(fiber, (renderer.currentDispatcherRef: any))
        : null,
      props: memoizedProps,
      state: usesHooks ? null : memoizedState,

      // List of owners
      owners,

      // Location of component in source coude.
      source: _debugSource,
    };
  }

  function inspectElement(id: number): InspectedElement | null {
    let result = inspectElementRaw(id);
    if (result === null) {
      return null;
    }
    // TODO Review sanitization approach for the below inspectable values.
    result.context = cleanForBridge(result.context);
    result.hooks = cleanForBridge(result.hooks);
    result.props = cleanForBridge(result.props);
    result.state = cleanForBridge(result.state);
    return result;
  }

  function logElementToConsole(id) {
    const result = inspectElementRaw(id);
    if (result === null) {
      console.warn(`Could not find Fiber with id "${id}"`);
      return;
    }

    const supportsGroup = typeof console.groupCollapsed === 'function';
    if (supportsGroup) {
      console.groupCollapsed(
        `[Click to expand] %c<${result.displayName || 'Component'} />`,
        // --dom-tag-name-color is the CSS variable Chrome styles HTML elements with in the console.
        'color: var(--dom-tag-name-color); font-weight: normal;'
      );
    }
    if (result.props !== null) {
      console.log('Props:', result.props);
    }
    if (result.state !== null) {
      console.log('State:', result.state);
    }
    if (result.hooks !== null) {
      console.log('Hooks:', result.hooks);
    }
    const nativeNode = findNativeByFiberID(id);
    if (nativeNode !== null) {
      console.log('Node:', nativeNode);
    }
    if (window.chrome || /firefox/i.test(navigator.userAgent)) {
      console.log(
        'Right-click any value to save it as a global variable for further inspection.'
      );
    }
    if (supportsGroup) {
      console.groupEnd();
    }
  }

  function setInHook(
    id: number,
    index: number,
    path: Array<string | number>,
    value: any
  ) {
    const fiber = findCurrentFiberUsingSlowPath(idToFiberMap.get(id));
    if (fiber !== null) {
      if (typeof overrideHookState === 'function') {
        overrideHookState(fiber, index, path, value);
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

  type CommitProfilingData = {|
    actualDurations: Array<number>,
    commitTime: number,
    interactions: Array<Interaction>,
    maxActualDuration: number,
  |};

  type CommitProfilingMetadataMap = Map<number, Array<CommitProfilingData>>;

  let currentCommitProfilingMetadata: CommitProfilingData | null = null;
  let initialTreeBaseDurationsMap: Map<number, number> | null = null;
  let initialIDToRootMap: Map<number, number> | null = null;
  let isProfiling: boolean = false;
  let profilingStartTime: number = 0;
  let rootToCommitProfilingMetadataMap: CommitProfilingMetadataMap | null = null;

  function getCommitDetails(
    rootID: number,
    commitIndex: number
  ): CommitDetails {
    const commitProfilingMetadata = ((rootToCommitProfilingMetadataMap: any): CommitProfilingMetadataMap).get(
      rootID
    );
    if (commitProfilingMetadata != null) {
      const commitProfilingData = commitProfilingMetadata[commitIndex];
      if (commitProfilingData != null) {
        return {
          commitIndex,
          interactions: commitProfilingData.interactions,
          actualDurations: commitProfilingData.actualDurations,
          rootID,
        };
      }
    }

    console.warn(
      `getCommitDetails(): No profiling info recorded for root "${rootID}" and commit ${commitIndex}`
    );

    return {
      commitIndex,
      interactions: [],
      actualDurations: [],
      rootID,
    };
  }

  function getFiberCommits(rootID: number, fiberID: number): FiberCommits {
    const commitProfilingMetadata = ((rootToCommitProfilingMetadataMap: any): CommitProfilingMetadataMap).get(
      rootID
    );
    if (commitProfilingMetadata != null) {
      const commitDurations = [];
      commitProfilingMetadata.forEach(({ actualDurations }, commitIndex) => {
        for (let i = 0; i < actualDurations.length; i += 2) {
          if (actualDurations[i] === fiberID) {
            commitDurations.push(commitIndex, actualDurations[i + 1]);
            break;
          }
        }
      });

      return {
        commitDurations,
        fiberID,
        rootID,
      };
    }

    console.warn(
      `getFiberCommits(): No profiling info recorded for root "${rootID}"`
    );

    return {
      commitDurations: [],
      fiberID,
      rootID,
    };
  }

  function getInteractions(rootID: number): Interactions {
    const commitProfilingMetadata = ((rootToCommitProfilingMetadataMap: any): CommitProfilingMetadataMap).get(
      rootID
    );
    if (commitProfilingMetadata != null) {
      const interactionsMap: Map<number, InteractionWithCommits> = new Map();

      commitProfilingMetadata.forEach((commitProfilingData, commitIndex) => {
        commitProfilingData.interactions.forEach(interaction => {
          const interactionWithCommits = interactionsMap.get(interaction.id);
          if (interactionWithCommits != null) {
            interactionWithCommits.commits.push(commitIndex);
          } else {
            interactionsMap.set(interaction.id, {
              ...interaction,
              commits: [commitIndex],
            });
          }
        });
      });

      return {
        interactions: Array.from(interactionsMap.values()),
        rootID,
      };
    }

    console.warn(
      `getInteractions(): No interactions recorded for root "${rootID}"`
    );

    return {
      interactions: [],
      rootID,
    };
  }

  function getProfilingDataForDownload(rootID: number): Object {
    const commitDetails = [];
    const commitProfilingMetadata = ((rootToCommitProfilingMetadataMap: any): CommitProfilingMetadataMap).get(
      rootID
    );
    if (commitProfilingMetadata != null) {
      for (let index = 0; index < commitProfilingMetadata.length; index++) {
        commitDetails.push(getCommitDetails(rootID, index));
      }
    }
    return {
      version: 1,
      profilingSummary: getProfilingSummary(rootID),
      commitDetails,
      interactions: getInteractions(rootID),
    };
  }

  function getProfilingSummary(rootID: number): ProfilingSummary {
    const interactions = new Set();
    const commitDurations = [];
    const commitTimes = [];

    const commitProfilingMetadata = ((rootToCommitProfilingMetadataMap: any): CommitProfilingMetadataMap).get(
      rootID
    );
    if (commitProfilingMetadata != null) {
      commitProfilingMetadata.forEach(metadata => {
        commitDurations.push(metadata.maxActualDuration);
        commitTimes.push(metadata.commitTime);
        metadata.interactions.forEach(({ name, timestamp }) => {
          interactions.add(`${timestamp}:${name}`);
        });
      });
    }

    const initialTreeBaseDurations = [];
    ((initialTreeBaseDurationsMap: any): Map<number, number>).forEach(
      (treeBaseDuration, id) => {
        if (
          ((initialIDToRootMap: any): Map<number, number>).get(id) === rootID
        ) {
          // We don't need to convert milliseconds to microseconds in this case,
          // because the profiling summary is JSON serialized.
          initialTreeBaseDurations.push(id, treeBaseDuration);
        }
      }
    );

    return {
      commitDurations,
      commitTimes,
      initialTreeBaseDurations,
      interactionCount: interactions.size,
      rootID,
    };
  }

  function startProfiling() {
    if (isProfiling) {
      return;
    }

    // Capture initial values as of the time profiling starts.
    // It's important we snapshot both the durations and the id-to-root map,
    // since either of these may change during the profiling session
    // (e.g. when a fiber is re-rendered or when a fiber gets removed).
    initialTreeBaseDurationsMap = new Map(idToTreeBaseDurationMap);
    initialIDToRootMap = new Map(idToRootMap);

    isProfiling = true;
    profilingStartTime = performance.now();
    rootToCommitProfilingMetadataMap = new Map();
  }

  function stopProfiling() {
    isProfiling = false;
  }

  // Automatically start profiling so that we don't miss timing info from initial "mount".
  if (localStorage.getItem(LOCAL_STORAGE_RELOAD_AND_PROFILE_KEY) === 'true') {
    startProfiling();
  }

  // React will switch between these implementations depending on whether
  // we have any manually suspended Fibers or not.

  function shouldSuspendFiberAlwaysFalse() {
    return false;
  }

  let forceFallbackForSuspenseIDs = new Set();
  function shouldSuspendFiberAccordingToSet(fiber) {
    const id = getFiberID(getPrimaryFiber(((fiber: any): Fiber)));
    return forceFallbackForSuspenseIDs.has(id);
  }

  function overrideSuspense(id, forceFallback) {
    if (
      typeof setSuspenseHandler !== 'function' ||
      typeof scheduleUpdate !== 'function'
    ) {
      throw new Error(
        'Expected overrideSuspense() to not get called for earlier React versions.'
      );
    }
    if (forceFallback) {
      forceFallbackForSuspenseIDs.add(id);
      if (forceFallbackForSuspenseIDs.size === 1) {
        // First override is added. Switch React to slower path.
        setSuspenseHandler(shouldSuspendFiberAccordingToSet);
      }
    } else {
      forceFallbackForSuspenseIDs.delete(id);
      if (forceFallbackForSuspenseIDs.size === 0) {
        // Last override is gone. Switch React back to fast path.
        setSuspenseHandler(shouldSuspendFiberAlwaysFalse);
      }
    }
    const fiber = idToFiberMap.get(id);
    scheduleUpdate(fiber);
  }

  return {
    cleanup,
    flushInitialOperations,
    getCommitDetails,
    getFiberIDFromNative,
    getFiberCommits,
    getInteractions,
    findNativeByFiberID,
    getProfilingDataForDownload,
    getProfilingSummary,
    handleCommitFiberRoot,
    handleCommitFiberUnmount,
    inspectElement,
    logElementToConsole,
    prepareViewElementSource,
    overrideSuspense,
    renderer,
    selectElement,
    setInContext,
    setInHook,
    setInProps,
    setInState,
    startProfiling,
    stopProfiling,
  };
}
