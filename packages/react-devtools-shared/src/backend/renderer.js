/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import {gt, gte} from 'semver';
import {
  ComponentFilterDisplayName,
  ComponentFilterElementType,
  ComponentFilterHOC,
  ComponentFilterLocation,
  ElementTypeClass,
  ElementTypeContext,
  ElementTypeFunction,
  ElementTypeForwardRef,
  ElementTypeHostComponent,
  ElementTypeMemo,
  ElementTypeOtherOrUnknown,
  ElementTypeProfiler,
  ElementTypeRoot,
  ElementTypeSuspense,
  ElementTypeSuspenseList,
  ElementTypeTracingMarker,
  StrictMode,
} from 'react-devtools-shared/src/types';
import {
  deletePathInObject,
  getDisplayName,
  getDefaultComponentFilters,
  getInObject,
  getUID,
  renamePathInObject,
  setInObject,
  utfEncodeString,
} from 'react-devtools-shared/src/utils';
import {sessionStorageGetItem} from 'react-devtools-shared/src/storage';
import {
  cleanForBridge,
  copyToClipboard,
  copyWithDelete,
  copyWithRename,
  copyWithSet,
  getEffectDurations,
} from './utils';
import {
  __DEBUG__,
  PROFILING_FLAG_BASIC_SUPPORT,
  PROFILING_FLAG_TIMELINE_SUPPORT,
  SESSION_STORAGE_RELOAD_AND_PROFILE_KEY,
  SESSION_STORAGE_RECORD_CHANGE_DESCRIPTIONS_KEY,
  TREE_OPERATION_ADD,
  TREE_OPERATION_REMOVE,
  TREE_OPERATION_REMOVE_ROOT,
  TREE_OPERATION_REORDER_CHILDREN,
  TREE_OPERATION_SET_SUBTREE_MODE,
  TREE_OPERATION_UPDATE_ERRORS_OR_WARNINGS,
  TREE_OPERATION_UPDATE_TREE_BASE_DURATION,
} from '../constants';
import {inspectHooksOfFiber} from 'react-debug-tools';
import {
  patch as patchConsole,
  registerRenderer as registerRendererWithConsole,
  patchForStrictMode as patchConsoleForStrictMode,
  unpatchForStrictMode as unpatchConsoleForStrictMode,
} from './console';
import {
  CONCURRENT_MODE_NUMBER,
  CONCURRENT_MODE_SYMBOL_STRING,
  DEPRECATED_ASYNC_MODE_SYMBOL_STRING,
  PROVIDER_NUMBER,
  PROVIDER_SYMBOL_STRING,
  CONTEXT_NUMBER,
  CONTEXT_SYMBOL_STRING,
  STRICT_MODE_NUMBER,
  STRICT_MODE_SYMBOL_STRING,
  PROFILER_NUMBER,
  PROFILER_SYMBOL_STRING,
  SCOPE_NUMBER,
  SCOPE_SYMBOL_STRING,
  FORWARD_REF_NUMBER,
  FORWARD_REF_SYMBOL_STRING,
  MEMO_NUMBER,
  MEMO_SYMBOL_STRING,
  SERVER_CONTEXT_SYMBOL_STRING,
} from './ReactSymbols';
import {format} from './utils';
import {
  enableProfilerChangedHookIndices,
  enableStyleXFeatures,
} from 'react-devtools-feature-flags';
import is from 'shared/objectIs';
import hasOwnProperty from 'shared/hasOwnProperty';
import {getStyleXData} from './StyleX/utils';
import {createProfilingHooks} from './profilingHooks';

import type {GetTimelineData, ToggleProfilingStatus} from './profilingHooks';
import type {Fiber} from 'react-reconciler/src/ReactInternalTypes';
import type {
  ChangeDescription,
  CommitDataBackend,
  DevToolsHook,
  InspectedElement,
  InspectedElementPayload,
  InstanceAndStyle,
  NativeType,
  PathFrame,
  PathMatch,
  ProfilingDataBackend,
  ProfilingDataForRootBackend,
  ReactRenderer,
  RendererInterface,
  SerializedElement,
  WorkTagMap,
} from './types';
import type {
  ComponentFilter,
  ElementType,
  Plugins,
} from 'react-devtools-shared/src/types';

type getDisplayNameForFiberType = (fiber: Fiber) => string | null;
type getTypeSymbolType = (type: any) => Symbol | number;

type ReactPriorityLevelsType = {|
  ImmediatePriority: number,
  UserBlockingPriority: number,
  NormalPriority: number,
  LowPriority: number,
  IdlePriority: number,
  NoPriority: number,
|};

type ReactTypeOfSideEffectType = {|
  DidCapture: number,
  NoFlags: number,
  PerformedWork: number,
  Placement: number,
  Incomplete: number,
  Hydrating: number,
|};

function getFiberFlags(fiber: Fiber): number {
  // The name of this field changed from "effectTag" to "flags"
  return fiber.flags !== undefined ? fiber.flags : (fiber: any).effectTag;
}

// Some environments (e.g. React Native / Hermes) don't support the performance API yet.
const getCurrentTime =
  typeof performance === 'object' && typeof performance.now === 'function'
    ? () => performance.now()
    : () => Date.now();

export function getInternalReactConstants(
  version: string,
): {|
  getDisplayNameForFiber: getDisplayNameForFiberType,
  getTypeSymbol: getTypeSymbolType,
  ReactPriorityLevels: ReactPriorityLevelsType,
  ReactTypeOfSideEffect: ReactTypeOfSideEffectType,
  ReactTypeOfWork: WorkTagMap,
  StrictModeBits: number,
|} {
  const ReactTypeOfSideEffect: ReactTypeOfSideEffectType = {
    DidCapture: 0b10000000,
    NoFlags: 0b00,
    PerformedWork: 0b01,
    Placement: 0b10,
    Incomplete: 0b10000000000000,
    Hydrating: 0b1000000000000,
  };

  // **********************************************************
  // The section below is copied from files in React repo.
  // Keep it in sync, and add version guards if it changes.
  //
  // Technically these priority levels are invalid for versions before 16.9,
  // but 16.9 is the first version to report priority level to DevTools,
  // so we can avoid checking for earlier versions and support pre-16.9 canary releases in the process.
  let ReactPriorityLevels: ReactPriorityLevelsType = {
    ImmediatePriority: 99,
    UserBlockingPriority: 98,
    NormalPriority: 97,
    LowPriority: 96,
    IdlePriority: 95,
    NoPriority: 90,
  };

  if (gt(version, '17.0.2')) {
    ReactPriorityLevels = {
      ImmediatePriority: 1,
      UserBlockingPriority: 2,
      NormalPriority: 3,
      LowPriority: 4,
      IdlePriority: 5,
      NoPriority: 0,
    };
  }

  let StrictModeBits = 0;
  if (gte(version, '18.0.0-alpha')) {
    // 18+
    StrictModeBits = 0b011000;
  } else if (gte(version, '16.9.0')) {
    // 16.9 - 17
    StrictModeBits = 0b1;
  } else if (gte(version, '16.3.0')) {
    // 16.3 - 16.8
    StrictModeBits = 0b10;
  }

  let ReactTypeOfWork: WorkTagMap = ((null: any): WorkTagMap);

  // **********************************************************
  // The section below is copied from files in React repo.
  // Keep it in sync, and add version guards if it changes.
  //
  // TODO Update the gt() check below to be gte() whichever the next version number is.
  // Currently the version in Git is 17.0.2 (but that version has not been/may not end up being released).
  if (gt(version, '17.0.1')) {
    ReactTypeOfWork = {
      CacheComponent: 24, // Experimental
      ClassComponent: 1,
      ContextConsumer: 9,
      ContextProvider: 10,
      CoroutineComponent: -1, // Removed
      CoroutineHandlerPhase: -1, // Removed
      DehydratedSuspenseComponent: 18, // Behind a flag
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
      LegacyHiddenComponent: 23,
      MemoComponent: 14,
      Mode: 8,
      OffscreenComponent: 22, // Experimental
      Profiler: 12,
      ScopeComponent: 21, // Experimental
      SimpleMemoComponent: 15,
      SuspenseComponent: 13,
      SuspenseListComponent: 19, // Experimental
      TracingMarkerComponent: 25, // Experimental - This is technically in 18 but we don't
      // want to fork again so we're adding it here instead
      YieldComponent: -1, // Removed
    };
  } else if (gte(version, '17.0.0-alpha')) {
    ReactTypeOfWork = {
      CacheComponent: -1, // Doesn't exist yet
      ClassComponent: 1,
      ContextConsumer: 9,
      ContextProvider: 10,
      CoroutineComponent: -1, // Removed
      CoroutineHandlerPhase: -1, // Removed
      DehydratedSuspenseComponent: 18, // Behind a flag
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
      LegacyHiddenComponent: 24,
      MemoComponent: 14,
      Mode: 8,
      OffscreenComponent: 23, // Experimental
      Profiler: 12,
      ScopeComponent: 21, // Experimental
      SimpleMemoComponent: 15,
      SuspenseComponent: 13,
      SuspenseListComponent: 19, // Experimental
      TracingMarkerComponent: -1, // Doesn't exist yet
      YieldComponent: -1, // Removed
    };
  } else if (gte(version, '16.6.0-beta.0')) {
    ReactTypeOfWork = {
      CacheComponent: -1, // Doesn't exist yet
      ClassComponent: 1,
      ContextConsumer: 9,
      ContextProvider: 10,
      CoroutineComponent: -1, // Removed
      CoroutineHandlerPhase: -1, // Removed
      DehydratedSuspenseComponent: 18, // Behind a flag
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
      LegacyHiddenComponent: -1,
      MemoComponent: 14,
      Mode: 8,
      OffscreenComponent: -1, // Experimental
      Profiler: 12,
      ScopeComponent: -1, // Experimental
      SimpleMemoComponent: 15,
      SuspenseComponent: 13,
      SuspenseListComponent: 19, // Experimental
      TracingMarkerComponent: -1, // Doesn't exist yet
      YieldComponent: -1, // Removed
    };
  } else if (gte(version, '16.4.3-alpha')) {
    ReactTypeOfWork = {
      CacheComponent: -1, // Doesn't exist yet
      ClassComponent: 2,
      ContextConsumer: 11,
      ContextProvider: 12,
      CoroutineComponent: -1, // Removed
      CoroutineHandlerPhase: -1, // Removed
      DehydratedSuspenseComponent: -1, // Doesn't exist yet
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
      LegacyHiddenComponent: -1,
      MemoComponent: -1, // Doesn't exist yet
      Mode: 10,
      OffscreenComponent: -1, // Experimental
      Profiler: 15,
      ScopeComponent: -1, // Experimental
      SimpleMemoComponent: -1, // Doesn't exist yet
      SuspenseComponent: 16,
      SuspenseListComponent: -1, // Doesn't exist yet
      TracingMarkerComponent: -1, // Doesn't exist yet
      YieldComponent: -1, // Removed
    };
  } else {
    ReactTypeOfWork = {
      CacheComponent: -1, // Doesn't exist yet
      ClassComponent: 2,
      ContextConsumer: 12,
      ContextProvider: 13,
      CoroutineComponent: 7,
      CoroutineHandlerPhase: 8,
      DehydratedSuspenseComponent: -1, // Doesn't exist yet
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
      LegacyHiddenComponent: -1,
      MemoComponent: -1, // Doesn't exist yet
      Mode: 11,
      OffscreenComponent: -1, // Experimental
      Profiler: 15,
      ScopeComponent: -1, // Experimental
      SimpleMemoComponent: -1, // Doesn't exist yet
      SuspenseComponent: 16,
      SuspenseListComponent: -1, // Doesn't exist yet
      TracingMarkerComponent: -1, // Doesn't exist yet
      YieldComponent: 9,
    };
  }
  // **********************************************************
  // End of copied code.
  // **********************************************************

  function getTypeSymbol(type: any): Symbol | number {
    const symbolOrNumber =
      typeof type === 'object' && type !== null ? type.$$typeof : type;

    // $FlowFixMe Flow doesn't know about typeof "symbol"
    return typeof symbolOrNumber === 'symbol'
      ? symbolOrNumber.toString()
      : symbolOrNumber;
  }

  const {
    CacheComponent,
    ClassComponent,
    IncompleteClassComponent,
    FunctionComponent,
    IndeterminateComponent,
    ForwardRef,
    HostRoot,
    HostComponent,
    HostPortal,
    HostText,
    Fragment,
    LazyComponent,
    LegacyHiddenComponent,
    MemoComponent,
    OffscreenComponent,
    Profiler,
    ScopeComponent,
    SimpleMemoComponent,
    SuspenseComponent,
    SuspenseListComponent,
    TracingMarkerComponent,
  } = ReactTypeOfWork;

  function resolveFiberType(type: any) {
    const typeSymbol = getTypeSymbol(type);
    switch (typeSymbol) {
      case MEMO_NUMBER:
      case MEMO_SYMBOL_STRING:
        // recursively resolving memo type in case of memo(forwardRef(Component))
        return resolveFiberType(type.type);
      case FORWARD_REF_NUMBER:
      case FORWARD_REF_SYMBOL_STRING:
        return type.render;
      default:
        return type;
    }
  }

  // NOTICE Keep in sync with shouldFilterFiber() and other get*ForFiber methods
  function getDisplayNameForFiber(fiber: Fiber): string | null {
    const {elementType, type, tag} = fiber;

    let resolvedType = type;
    if (typeof type === 'object' && type !== null) {
      resolvedType = resolveFiberType(type);
    }

    let resolvedContext: any = null;

    switch (tag) {
      case CacheComponent:
        return 'Cache';
      case ClassComponent:
      case IncompleteClassComponent:
        return getDisplayName(resolvedType);
      case FunctionComponent:
      case IndeterminateComponent:
        return getDisplayName(resolvedType);
      case ForwardRef:
        // Mirror https://github.com/facebook/react/blob/7c21bf72ace77094fd1910cc350a548287ef8350/packages/shared/getComponentName.js#L27-L37
        return (
          (type && type.displayName) ||
          getDisplayName(resolvedType, 'Anonymous')
        );
      case HostRoot:
        const fiberRoot = fiber.stateNode;
        if (fiberRoot != null && fiberRoot._debugRootType !== null) {
          return fiberRoot._debugRootType;
        }
        return null;
      case HostComponent:
        return type;
      case HostPortal:
      case HostText:
      case Fragment:
        return null;
      case LazyComponent:
        // This display name will not be user visible.
        // Once a Lazy component loads its inner component, React replaces the tag and type.
        // This display name will only show up in console logs when DevTools DEBUG mode is on.
        return 'Lazy';
      case MemoComponent:
      case SimpleMemoComponent:
        return (
          (elementType && elementType.displayName) ||
          (type && type.displayName) ||
          getDisplayName(resolvedType, 'Anonymous')
        );
      case SuspenseComponent:
        return 'Suspense';
      case LegacyHiddenComponent:
        return 'LegacyHidden';
      case OffscreenComponent:
        return 'Offscreen';
      case ScopeComponent:
        return 'Scope';
      case SuspenseListComponent:
        return 'SuspenseList';
      case Profiler:
        return 'Profiler';
      case TracingMarkerComponent:
        return 'TracingMarker';
      default:
        const typeSymbol = getTypeSymbol(type);

        switch (typeSymbol) {
          case CONCURRENT_MODE_NUMBER:
          case CONCURRENT_MODE_SYMBOL_STRING:
          case DEPRECATED_ASYNC_MODE_SYMBOL_STRING:
            return null;
          case PROVIDER_NUMBER:
          case PROVIDER_SYMBOL_STRING:
            // 16.3.0 exposed the context object as "context"
            // PR #12501 changed it to "_context" for 16.3.1+
            // NOTE Keep in sync with inspectElementRaw()
            resolvedContext = fiber.type._context || fiber.type.context;
            return `${resolvedContext.displayName || 'Context'}.Provider`;
          case CONTEXT_NUMBER:
          case CONTEXT_SYMBOL_STRING:
          case SERVER_CONTEXT_SYMBOL_STRING:
            // 16.3-16.5 read from "type" because the Consumer is the actual context object.
            // 16.6+ should read from "type._context" because Consumer can be different (in DEV).
            // NOTE Keep in sync with inspectElementRaw()
            resolvedContext = fiber.type._context || fiber.type;

            // NOTE: TraceUpdatesBackendManager depends on the name ending in '.Consumer'
            // If you change the name, figure out a more resilient way to detect it.
            return `${resolvedContext.displayName || 'Context'}.Consumer`;
          case STRICT_MODE_NUMBER:
          case STRICT_MODE_SYMBOL_STRING:
            return null;
          case PROFILER_NUMBER:
          case PROFILER_SYMBOL_STRING:
            return `Profiler(${fiber.memoizedProps.id})`;
          case SCOPE_NUMBER:
          case SCOPE_SYMBOL_STRING:
            return 'Scope';
          default:
            // Unknown element type.
            // This may mean a new element type that has not yet been added to DevTools.
            return null;
        }
    }
  }

  return {
    getDisplayNameForFiber,
    getTypeSymbol,
    ReactPriorityLevels,
    ReactTypeOfWork,
    ReactTypeOfSideEffect,
    StrictModeBits,
  };
}

// Map of one or more Fibers in a pair to their unique id number.
// We track both Fibers to support Fast Refresh,
// which may forcefully replace one of the pair as part of hot reloading.
// In that case it's still important to be able to locate the previous ID during subsequent renders.
const fiberToIDMap: Map<Fiber, number> = new Map();

// Map of id to one (arbitrary) Fiber in a pair.
// This Map is used to e.g. get the display name for a Fiber or schedule an update,
// operations that should be the same whether the current and work-in-progress Fiber is used.
const idToArbitraryFiberMap: Map<number, Fiber> = new Map();

export function attach(
  hook: DevToolsHook,
  rendererID: number,
  renderer: ReactRenderer,
  global: Object,
): RendererInterface {
  // Newer versions of the reconciler package also specific reconciler version.
  // If that version number is present, use it.
  // Third party renderer versions may not match the reconciler version,
  // and the latter is what's important in terms of tags and symbols.
  const version = renderer.reconcilerVersion || renderer.version;

  const {
    getDisplayNameForFiber,
    getTypeSymbol,
    ReactPriorityLevels,
    ReactTypeOfWork,
    ReactTypeOfSideEffect,
    StrictModeBits,
  } = getInternalReactConstants(version);
  const {
    DidCapture,
    Hydrating,
    NoFlags,
    PerformedWork,
    Placement,
  } = ReactTypeOfSideEffect;
  const {
    CacheComponent,
    ClassComponent,
    ContextConsumer,
    DehydratedSuspenseComponent,
    ForwardRef,
    Fragment,
    FunctionComponent,
    HostRoot,
    HostPortal,
    HostComponent,
    HostText,
    IncompleteClassComponent,
    IndeterminateComponent,
    LegacyHiddenComponent,
    MemoComponent,
    OffscreenComponent,
    SimpleMemoComponent,
    SuspenseComponent,
    SuspenseListComponent,
    TracingMarkerComponent,
  } = ReactTypeOfWork;
  const {
    ImmediatePriority,
    UserBlockingPriority,
    NormalPriority,
    LowPriority,
    IdlePriority,
    NoPriority,
  } = ReactPriorityLevels;

  const {
    getLaneLabelMap,
    injectProfilingHooks,
    overrideHookState,
    overrideHookStateDeletePath,
    overrideHookStateRenamePath,
    overrideProps,
    overridePropsDeletePath,
    overridePropsRenamePath,
    scheduleRefresh,
    setErrorHandler,
    setSuspenseHandler,
    scheduleUpdate,
  } = renderer;
  const supportsTogglingError =
    typeof setErrorHandler === 'function' &&
    typeof scheduleUpdate === 'function';
  const supportsTogglingSuspense =
    typeof setSuspenseHandler === 'function' &&
    typeof scheduleUpdate === 'function';

  if (typeof scheduleRefresh === 'function') {
    // When Fast Refresh updates a component, the frontend may need to purge cached information.
    // For example, ASTs cached for the component (for named hooks) may no longer be valid.
    // Send a signal to the frontend to purge this cached information.
    // The "fastRefreshScheduled" dispatched is global (not Fiber or even Renderer specific).
    // This is less effecient since it means the front-end will need to purge the entire cache,
    // but this is probably an okay trade off in order to reduce coupling between the DevTools and Fast Refresh.
    renderer.scheduleRefresh = (...args) => {
      try {
        hook.emit('fastRefreshScheduled');
      } finally {
        return scheduleRefresh(...args);
      }
    };
  }

  let getTimelineData: null | GetTimelineData = null;
  let toggleProfilingStatus: null | ToggleProfilingStatus = null;
  if (typeof injectProfilingHooks === 'function') {
    const response = createProfilingHooks({
      getDisplayNameForFiber,
      getIsProfiling: () => isProfiling,
      getLaneLabelMap,
      reactVersion: version,
    });

    // Pass the Profiling hooks to the reconciler for it to call during render.
    injectProfilingHooks(response.profilingHooks);

    // Hang onto this toggle so we can notify the external methods of profiling status changes.
    getTimelineData = response.getTimelineData;
    toggleProfilingStatus = response.toggleProfilingStatus;
  }

  // Tracks Fibers with recently changed number of error/warning messages.
  // These collections store the Fiber rather than the ID,
  // in order to avoid generating an ID for Fibers that never get mounted
  // (due to e.g. Suspense or error boundaries).
  // onErrorOrWarning() adds Fibers and recordPendingErrorsAndWarnings() later clears them.
  const fibersWithChangedErrorOrWarningCounts: Set<Fiber> = new Set();
  const pendingFiberToErrorsMap: Map<Fiber, Map<string, number>> = new Map();
  const pendingFiberToWarningsMap: Map<Fiber, Map<string, number>> = new Map();

  // Mapping of fiber IDs to error/warning messages and counts.
  const fiberIDToErrorsMap: Map<number, Map<string, number>> = new Map();
  const fiberIDToWarningsMap: Map<number, Map<string, number>> = new Map();

  function clearErrorsAndWarnings() {
    // eslint-disable-next-line no-for-of-loops/no-for-of-loops
    for (const id of fiberIDToErrorsMap.keys()) {
      const fiber = idToArbitraryFiberMap.get(id);
      if (fiber != null) {
        fibersWithChangedErrorOrWarningCounts.add(fiber);
        updateMostRecentlyInspectedElementIfNecessary(id);
      }
    }

    // eslint-disable-next-line no-for-of-loops/no-for-of-loops
    for (const id of fiberIDToWarningsMap.keys()) {
      const fiber = idToArbitraryFiberMap.get(id);
      if (fiber != null) {
        fibersWithChangedErrorOrWarningCounts.add(fiber);
        updateMostRecentlyInspectedElementIfNecessary(id);
      }
    }

    fiberIDToErrorsMap.clear();
    fiberIDToWarningsMap.clear();

    flushPendingEvents();
  }

  function clearMessageCountHelper(
    fiberID: number,
    pendingFiberToMessageCountMap: Map<Fiber, Map<string, number>>,
    fiberIDToMessageCountMap: Map<number, Map<string, number>>,
  ) {
    const fiber = idToArbitraryFiberMap.get(fiberID);
    if (fiber != null) {
      // Throw out any pending changes.
      pendingFiberToErrorsMap.delete(fiber);

      if (fiberIDToMessageCountMap.has(fiberID)) {
        fiberIDToMessageCountMap.delete(fiberID);

        // If previous flushed counts have changed, schedule an update too.
        fibersWithChangedErrorOrWarningCounts.add(fiber);
        flushPendingEvents();

        updateMostRecentlyInspectedElementIfNecessary(fiberID);
      } else {
        fibersWithChangedErrorOrWarningCounts.delete(fiber);
      }
    }
  }

  function clearErrorsForFiberID(fiberID: number) {
    clearMessageCountHelper(
      fiberID,
      pendingFiberToErrorsMap,
      fiberIDToErrorsMap,
    );
  }

  function clearWarningsForFiberID(fiberID: number) {
    clearMessageCountHelper(
      fiberID,
      pendingFiberToWarningsMap,
      fiberIDToWarningsMap,
    );
  }

  function updateMostRecentlyInspectedElementIfNecessary(
    fiberID: number,
  ): void {
    if (
      mostRecentlyInspectedElement !== null &&
      mostRecentlyInspectedElement.id === fiberID
    ) {
      hasElementUpdatedSinceLastInspected = true;
    }
  }

  // Called when an error or warning is logged during render, commit, or passive (including unmount functions).
  function onErrorOrWarning(
    fiber: Fiber,
    type: 'error' | 'warn',
    args: $ReadOnlyArray<any>,
  ): void {
    if (type === 'error') {
      const maybeID = getFiberIDUnsafe(fiber);
      // if this is an error simulated by us to trigger error boundary, ignore
      if (maybeID != null && forceErrorForFiberIDs.get(maybeID) === true) {
        return;
      }
    }
    const message = format(...args);
    if (__DEBUG__) {
      debug('onErrorOrWarning', fiber, null, `${type}: "${message}"`);
    }

    // Mark this Fiber as needed its warning/error count updated during the next flush.
    fibersWithChangedErrorOrWarningCounts.add(fiber);

    // Track the warning/error for later.
    const fiberMap =
      type === 'error' ? pendingFiberToErrorsMap : pendingFiberToWarningsMap;
    const messageMap = fiberMap.get(fiber);
    if (messageMap != null) {
      const count = messageMap.get(message) || 0;
      messageMap.set(message, count + 1);
    } else {
      fiberMap.set(fiber, new Map([[message, 1]]));
    }

    // Passive effects may trigger errors or warnings too;
    // In this case, we should wait until the rest of the passive effects have run,
    // but we shouldn't wait until the next commit because that might be a long time.
    // This would also cause "tearing" between an inspected Component and the tree view.
    // Then again we don't want to flush too soon because this could be an error during async rendering.
    // Use a debounce technique to ensure that we'll eventually flush.
    flushPendingErrorsAndWarningsAfterDelay();
  }

  // Patching the console enables DevTools to do a few useful things:
  // * Append component stacks to warnings and error messages
  // * Disable logging during re-renders to inspect hooks (see inspectHooksOfFiber)
  //
  // Don't patch in test environments because we don't want to interfere with Jest's own console overrides.
  if (process.env.NODE_ENV !== 'test') {
    registerRendererWithConsole(renderer, onErrorOrWarning);

    // The renderer interface can't read these preferences directly,
    // because it is stored in localStorage within the context of the extension.
    // It relies on the extension to pass the preference through via the global.
    const appendComponentStack =
      window.__REACT_DEVTOOLS_APPEND_COMPONENT_STACK__ !== false;
    const breakOnConsoleErrors =
      window.__REACT_DEVTOOLS_BREAK_ON_CONSOLE_ERRORS__ === true;
    const showInlineWarningsAndErrors =
      window.__REACT_DEVTOOLS_SHOW_INLINE_WARNINGS_AND_ERRORS__ !== false;
    const hideConsoleLogsInStrictMode =
      window.__REACT_DEVTOOLS_HIDE_CONSOLE_LOGS_IN_STRICT_MODE__ === true;
    const browserTheme = window.__REACT_DEVTOOLS_BROWSER_THEME__;

    patchConsole({
      appendComponentStack,
      breakOnConsoleErrors,
      showInlineWarningsAndErrors,
      hideConsoleLogsInStrictMode,
      browserTheme,
    });
  }

  const debug = (
    name: string,
    fiber: Fiber,
    parentFiber: ?Fiber,
    extraString?: string = '',
  ): void => {
    if (__DEBUG__) {
      const displayName =
        fiber.tag + ':' + (getDisplayNameForFiber(fiber) || 'null');

      const maybeID = getFiberIDUnsafe(fiber) || '<no id>';
      const parentDisplayName = parentFiber
        ? parentFiber.tag +
          ':' +
          (getDisplayNameForFiber(parentFiber) || 'null')
        : '';
      const maybeParentID = parentFiber
        ? getFiberIDUnsafe(parentFiber) || '<no-id>'
        : '';

      console.groupCollapsed(
        `[renderer] %c${name} %c${displayName} (${maybeID}) %c${
          parentFiber ? `${parentDisplayName} (${maybeParentID})` : ''
        } %c${extraString}`,
        'color: red; font-weight: bold;',
        'color: blue;',
        'color: purple;',
        'color: black;',
      );
      console.log(
        new Error().stack
          .split('\n')
          .slice(1)
          .join('\n'),
      );
      console.groupEnd();
    }
  };

  // Configurable Components tree filters.
  const hideElementsWithDisplayNames: Set<RegExp> = new Set();
  const hideElementsWithPaths: Set<RegExp> = new Set();
  const hideElementsWithTypes: Set<ElementType> = new Set();

  // Highlight updates
  let traceUpdatesEnabled: boolean = false;
  const traceUpdatesForNodes: Set<NativeType> = new Set();

  function applyComponentFilters(componentFilters: Array<ComponentFilter>) {
    hideElementsWithTypes.clear();
    hideElementsWithDisplayNames.clear();
    hideElementsWithPaths.clear();

    componentFilters.forEach(componentFilter => {
      if (!componentFilter.isEnabled) {
        return;
      }

      switch (componentFilter.type) {
        case ComponentFilterDisplayName:
          if (componentFilter.isValid && componentFilter.value !== '') {
            hideElementsWithDisplayNames.add(
              new RegExp(componentFilter.value, 'i'),
            );
          }
          break;
        case ComponentFilterElementType:
          hideElementsWithTypes.add(componentFilter.value);
          break;
        case ComponentFilterLocation:
          if (componentFilter.isValid && componentFilter.value !== '') {
            hideElementsWithPaths.add(new RegExp(componentFilter.value, 'i'));
          }
          break;
        case ComponentFilterHOC:
          hideElementsWithDisplayNames.add(new RegExp('\\('));
          break;
        default:
          console.warn(
            `Invalid component filter type "${componentFilter.type}"`,
          );
          break;
      }
    });
  }

  // The renderer interface can't read saved component filters directly,
  // because they are stored in localStorage within the context of the extension.
  // Instead it relies on the extension to pass filters through.
  if (window.__REACT_DEVTOOLS_COMPONENT_FILTERS__ != null) {
    applyComponentFilters(window.__REACT_DEVTOOLS_COMPONENT_FILTERS__);
  } else {
    // Unfortunately this feature is not expected to work for React Native for now.
    // It would be annoying for us to spam YellowBox warnings with unactionable stuff,
    // so for now just skip this message...
    //console.warn('⚛️ DevTools: Could not locate saved component filters');

    // Fallback to assuming the default filters in this case.
    applyComponentFilters(getDefaultComponentFilters());
  }

  // If necessary, we can revisit optimizing this operation.
  // For example, we could add a new recursive unmount tree operation.
  // The unmount operations are already significantly smaller than mount operations though.
  // This is something to keep in mind for later.
  function updateComponentFilters(componentFilters: Array<ComponentFilter>) {
    if (isProfiling) {
      // Re-mounting a tree while profiling is in progress might break a lot of assumptions.
      // If necessary, we could support this- but it doesn't seem like a necessary use case.
      throw Error('Cannot modify filter preferences while profiling');
    }

    // Recursively unmount all roots.
    hook.getFiberRoots(rendererID).forEach(root => {
      currentRootID = getOrGenerateFiberID(root.current);
      // The TREE_OPERATION_REMOVE_ROOT operation serves two purposes:
      // 1. It avoids sending unnecessary bridge traffic to clear a root.
      // 2. It preserves Fiber IDs when remounting (below) which in turn ID to error/warning mapping.
      pushOperation(TREE_OPERATION_REMOVE_ROOT);
      flushPendingEvents(root);
      currentRootID = -1;
    });

    applyComponentFilters(componentFilters);

    // Reset pseudo counters so that new path selections will be persisted.
    rootDisplayNameCounter.clear();

    // Recursively re-mount all roots with new filter criteria applied.
    hook.getFiberRoots(rendererID).forEach(root => {
      currentRootID = getOrGenerateFiberID(root.current);
      setRootPseudoKey(currentRootID, root.current);
      mountFiberRecursively(root.current, null, false, false);
      flushPendingEvents(root);
      currentRootID = -1;
    });

    // Also re-evaluate all error and warning counts given the new filters.
    reevaluateErrorsAndWarnings();
    flushPendingEvents();
  }

  // NOTICE Keep in sync with get*ForFiber methods
  function shouldFilterFiber(fiber: Fiber): boolean {
    const {_debugSource, tag, type} = fiber;

    switch (tag) {
      case DehydratedSuspenseComponent:
        // TODO: ideally we would show dehydrated Suspense immediately.
        // However, it has some special behavior (like disconnecting
        // an alternate and turning into real Suspense) which breaks DevTools.
        // For now, ignore it, and only show it once it gets hydrated.
        // https://github.com/bvaughn/react-devtools-experimental/issues/197
        return true;
      case HostPortal:
      case HostText:
      case Fragment:
      case LegacyHiddenComponent:
      case OffscreenComponent:
        return true;
      case HostRoot:
        // It is never valid to filter the root element.
        return false;
      default:
        const typeSymbol = getTypeSymbol(type);

        switch (typeSymbol) {
          case CONCURRENT_MODE_NUMBER:
          case CONCURRENT_MODE_SYMBOL_STRING:
          case DEPRECATED_ASYNC_MODE_SYMBOL_STRING:
          case STRICT_MODE_NUMBER:
          case STRICT_MODE_SYMBOL_STRING:
            return true;
          default:
            break;
        }
    }

    const elementType = getElementTypeForFiber(fiber);
    if (hideElementsWithTypes.has(elementType)) {
      return true;
    }

    if (hideElementsWithDisplayNames.size > 0) {
      const displayName = getDisplayNameForFiber(fiber);
      if (displayName != null) {
        // eslint-disable-next-line no-for-of-loops/no-for-of-loops
        for (const displayNameRegExp of hideElementsWithDisplayNames) {
          if (displayNameRegExp.test(displayName)) {
            return true;
          }
        }
      }
    }

    if (_debugSource != null && hideElementsWithPaths.size > 0) {
      const {fileName} = _debugSource;
      // eslint-disable-next-line no-for-of-loops/no-for-of-loops
      for (const pathRegExp of hideElementsWithPaths) {
        if (pathRegExp.test(fileName)) {
          return true;
        }
      }
    }

    return false;
  }

  // NOTICE Keep in sync with shouldFilterFiber() and other get*ForFiber methods
  function getElementTypeForFiber(fiber: Fiber): ElementType {
    const {type, tag} = fiber;

    switch (tag) {
      case ClassComponent:
      case IncompleteClassComponent:
        return ElementTypeClass;
      case FunctionComponent:
      case IndeterminateComponent:
        return ElementTypeFunction;
      case ForwardRef:
        return ElementTypeForwardRef;
      case HostRoot:
        return ElementTypeRoot;
      case HostComponent:
        return ElementTypeHostComponent;
      case HostPortal:
      case HostText:
      case Fragment:
        return ElementTypeOtherOrUnknown;
      case MemoComponent:
      case SimpleMemoComponent:
        return ElementTypeMemo;
      case SuspenseComponent:
        return ElementTypeSuspense;
      case SuspenseListComponent:
        return ElementTypeSuspenseList;
      case TracingMarkerComponent:
        return ElementTypeTracingMarker;
      default:
        const typeSymbol = getTypeSymbol(type);

        switch (typeSymbol) {
          case CONCURRENT_MODE_NUMBER:
          case CONCURRENT_MODE_SYMBOL_STRING:
          case DEPRECATED_ASYNC_MODE_SYMBOL_STRING:
            return ElementTypeOtherOrUnknown;
          case PROVIDER_NUMBER:
          case PROVIDER_SYMBOL_STRING:
            return ElementTypeContext;
          case CONTEXT_NUMBER:
          case CONTEXT_SYMBOL_STRING:
            return ElementTypeContext;
          case STRICT_MODE_NUMBER:
          case STRICT_MODE_SYMBOL_STRING:
            return ElementTypeOtherOrUnknown;
          case PROFILER_NUMBER:
          case PROFILER_SYMBOL_STRING:
            return ElementTypeProfiler;
          default:
            return ElementTypeOtherOrUnknown;
        }
    }
  }

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

  // Returns the unique ID for a Fiber or generates and caches a new one if the Fiber hasn't been seen before.
  // Once this method has been called for a Fiber, untrackFiberID() should always be called later to avoid leaking.
  function getOrGenerateFiberID(fiber: Fiber): number {
    let id = null;
    if (fiberToIDMap.has(fiber)) {
      id = fiberToIDMap.get(fiber);
    } else {
      const {alternate} = fiber;
      if (alternate !== null && fiberToIDMap.has(alternate)) {
        id = fiberToIDMap.get(alternate);
      }
    }

    let didGenerateID = false;
    if (id === null) {
      didGenerateID = true;
      id = getUID();
    }

    // This refinement is for Flow purposes only.
    const refinedID = ((id: any): number);

    // Make sure we're tracking this Fiber
    // e.g. if it just mounted or an error was logged during initial render.
    if (!fiberToIDMap.has(fiber)) {
      fiberToIDMap.set(fiber, refinedID);
      idToArbitraryFiberMap.set(refinedID, fiber);
    }

    // Also make sure we're tracking its alternate,
    // e.g. in case this is the first update after mount.
    const {alternate} = fiber;
    if (alternate !== null) {
      if (!fiberToIDMap.has(alternate)) {
        fiberToIDMap.set(alternate, refinedID);
      }
    }

    if (__DEBUG__) {
      if (didGenerateID) {
        debug(
          'getOrGenerateFiberID()',
          fiber,
          fiber.return,
          'Generated a new UID',
        );
      }
    }

    return refinedID;
  }

  // Returns an ID if one has already been generated for the Fiber or throws.
  function getFiberIDThrows(fiber: Fiber): number {
    const maybeID = getFiberIDUnsafe(fiber);
    if (maybeID !== null) {
      return maybeID;
    }
    throw Error(
      `Could not find ID for Fiber "${getDisplayNameForFiber(fiber) || ''}"`,
    );
  }

  // Returns an ID if one has already been generated for the Fiber or null if one has not been generated.
  // Use this method while e.g. logging to avoid over-retaining Fibers.
  function getFiberIDUnsafe(fiber: Fiber): number | null {
    if (fiberToIDMap.has(fiber)) {
      return ((fiberToIDMap.get(fiber): any): number);
    } else {
      const {alternate} = fiber;
      if (alternate !== null && fiberToIDMap.has(alternate)) {
        return ((fiberToIDMap.get(alternate): any): number);
      }
    }
    return null;
  }

  // Removes a Fiber (and its alternate) from the Maps used to track their id.
  // This method should always be called when a Fiber is unmounting.
  function untrackFiberID(fiber: Fiber) {
    if (__DEBUG__) {
      debug('untrackFiberID()', fiber, fiber.return, 'schedule after delay');
    }

    // Untrack Fibers after a slight delay in order to support a Fast Refresh edge case:
    // 1. Component type is updated and Fast Refresh schedules an update+remount.
    // 2. flushPendingErrorsAndWarningsAfterDelay() runs, sees the old Fiber is no longer mounted
    //    (it's been disconnected by Fast Refresh), and calls untrackFiberID() to clear it from the Map.
    // 3. React flushes pending passive effects before it runs the next render,
    //    which logs an error or warning, which causes a new ID to be generated for this Fiber.
    // 4. DevTools now tries to unmount the old Component with the new ID.
    //
    // The underlying problem here is the premature clearing of the Fiber ID,
    // but DevTools has no way to detect that a given Fiber has been scheduled for Fast Refresh.
    // (The "_debugNeedsRemount" flag won't necessarily be set.)
    //
    // The best we can do is to delay untracking by a small amount,
    // and give React time to process the Fast Refresh delay.

    untrackFibersSet.add(fiber);

    // React may detach alternate pointers during unmount;
    // Since our untracking code is async, we should explicily track the pending alternate here as well.
    const alternate = fiber.alternate;
    if (alternate !== null) {
      untrackFibersSet.add(alternate);
    }

    if (untrackFibersTimeoutID === null) {
      untrackFibersTimeoutID = setTimeout(untrackFibers, 1000);
    }
  }

  const untrackFibersSet: Set<Fiber> = new Set();
  let untrackFibersTimeoutID: TimeoutID | null = null;

  function untrackFibers() {
    if (untrackFibersTimeoutID !== null) {
      clearTimeout(untrackFibersTimeoutID);
      untrackFibersTimeoutID = null;
    }

    untrackFibersSet.forEach(fiber => {
      const fiberID = getFiberIDUnsafe(fiber);
      if (fiberID !== null) {
        idToArbitraryFiberMap.delete(fiberID);

        // Also clear any errors/warnings associated with this fiber.
        clearErrorsForFiberID(fiberID);
        clearWarningsForFiberID(fiberID);
      }

      fiberToIDMap.delete(fiber);

      const {alternate} = fiber;
      if (alternate !== null) {
        fiberToIDMap.delete(alternate);
      }

      if (forceErrorForFiberIDs.has(fiberID)) {
        forceErrorForFiberIDs.delete(fiberID);
        if (forceErrorForFiberIDs.size === 0 && setErrorHandler != null) {
          setErrorHandler(shouldErrorFiberAlwaysNull);
        }
      }
    });
    untrackFibersSet.clear();
  }

  function getChangeDescription(
    prevFiber: Fiber | null,
    nextFiber: Fiber,
  ): ChangeDescription | null {
    switch (getElementTypeForFiber(nextFiber)) {
      case ElementTypeClass:
      case ElementTypeFunction:
      case ElementTypeMemo:
      case ElementTypeForwardRef:
        if (prevFiber === null) {
          return {
            context: null,
            didHooksChange: false,
            isFirstMount: true,
            props: null,
            state: null,
          };
        } else {
          const data: ChangeDescription = {
            context: getContextChangedKeys(nextFiber),
            didHooksChange: false,
            isFirstMount: false,
            props: getChangedKeys(
              prevFiber.memoizedProps,
              nextFiber.memoizedProps,
            ),
            state: getChangedKeys(
              prevFiber.memoizedState,
              nextFiber.memoizedState,
            ),
          };

          // Only traverse the hooks list once, depending on what info we're returning.
          if (enableProfilerChangedHookIndices) {
            const indices = getChangedHooksIndices(
              prevFiber.memoizedState,
              nextFiber.memoizedState,
            );
            data.hooks = indices;
            data.didHooksChange = indices !== null && indices.length > 0;
          } else {
            data.didHooksChange = didHooksChange(
              prevFiber.memoizedState,
              nextFiber.memoizedState,
            );
          }

          return data;
        }
      default:
        return null;
    }
  }

  function updateContextsForFiber(fiber: Fiber) {
    switch (getElementTypeForFiber(fiber)) {
      case ElementTypeClass:
      case ElementTypeForwardRef:
      case ElementTypeFunction:
      case ElementTypeMemo:
        if (idToContextsMap !== null) {
          const id = getFiberIDThrows(fiber);
          const contexts = getContextsForFiber(fiber);
          if (contexts !== null) {
            idToContextsMap.set(id, contexts);
          }
        }
        break;
      default:
        break;
    }
  }

  // Differentiates between a null context value and no context.
  const NO_CONTEXT = {};

  function getContextsForFiber(fiber: Fiber): [Object, any] | null {
    let legacyContext = NO_CONTEXT;
    let modernContext = NO_CONTEXT;

    switch (getElementTypeForFiber(fiber)) {
      case ElementTypeClass:
        const instance = fiber.stateNode;
        if (instance != null) {
          if (
            instance.constructor &&
            instance.constructor.contextType != null
          ) {
            modernContext = instance.context;
          } else {
            legacyContext = instance.context;
            if (legacyContext && Object.keys(legacyContext).length === 0) {
              legacyContext = NO_CONTEXT;
            }
          }
        }
        return [legacyContext, modernContext];
      case ElementTypeForwardRef:
      case ElementTypeFunction:
      case ElementTypeMemo:
        const dependencies = fiber.dependencies;
        if (dependencies && dependencies.firstContext) {
          modernContext = dependencies.firstContext;
        }

        return [legacyContext, modernContext];
      default:
        return null;
    }
  }

  // Record all contexts at the time profiling is started.
  // Fibers only store the current context value,
  // so we need to track them separately in order to determine changed keys.
  function crawlToInitializeContextsMap(fiber: Fiber) {
    const id = getFiberIDUnsafe(fiber);

    // Not all Fibers in the subtree have mounted yet.
    // For example, Offscreen (hidden) or Suspense (suspended) subtrees won't yet be tracked.
    // We can safely skip these subtrees.
    if (id !== null) {
      updateContextsForFiber(fiber);

      let current = fiber.child;
      while (current !== null) {
        crawlToInitializeContextsMap(current);
        current = current.sibling;
      }
    }
  }

  function getContextChangedKeys(fiber: Fiber): null | boolean | Array<string> {
    if (idToContextsMap !== null) {
      const id = getFiberIDThrows(fiber);
      const prevContexts = idToContextsMap.has(id)
        ? idToContextsMap.get(id)
        : null;
      const nextContexts = getContextsForFiber(fiber);

      if (prevContexts == null || nextContexts == null) {
        return null;
      }

      const [prevLegacyContext, prevModernContext] = prevContexts;
      const [nextLegacyContext, nextModernContext] = nextContexts;

      switch (getElementTypeForFiber(fiber)) {
        case ElementTypeClass:
          if (prevContexts && nextContexts) {
            if (nextLegacyContext !== NO_CONTEXT) {
              return getChangedKeys(prevLegacyContext, nextLegacyContext);
            } else if (nextModernContext !== NO_CONTEXT) {
              return prevModernContext !== nextModernContext;
            }
          }
          break;
        case ElementTypeForwardRef:
        case ElementTypeFunction:
        case ElementTypeMemo:
          if (nextModernContext !== NO_CONTEXT) {
            let prevContext = prevModernContext;
            let nextContext = nextModernContext;

            while (prevContext && nextContext) {
              // Note this only works for versions of React that support this key (e.v. 18+)
              // For older versions, there's no good way to read the current context value after render has completed.
              // This is because React maintains a stack of context values during render,
              // but by the time DevTools is called, render has finished and the stack is empty.
              if (!is(prevContext.memoizedValue, nextContext.memoizedValue)) {
                return true;
              }

              prevContext = prevContext.next;
              nextContext = nextContext.next;
            }

            return false;
          }
          break;
        default:
          break;
      }
    }
    return null;
  }

  function isHookThatCanScheduleUpdate(hookObject: any) {
    const queue = hookObject.queue;
    if (!queue) {
      return false;
    }

    const boundHasOwnProperty = hasOwnProperty.bind(queue);

    // Detect the shape of useState() or useReducer()
    // using the attributes that are unique to these hooks
    // but also stable (e.g. not tied to current Lanes implementation)
    const isStateOrReducer =
      boundHasOwnProperty('pending') &&
      boundHasOwnProperty('dispatch') &&
      typeof queue.dispatch === 'function';

    // Detect useSyncExternalStore()
    const isSyncExternalStore =
      boundHasOwnProperty('value') &&
      boundHasOwnProperty('getSnapshot') &&
      typeof queue.getSnapshot === 'function';

    // These are the only types of hooks that can schedule an update.
    return isStateOrReducer || isSyncExternalStore;
  }

  function didStatefulHookChange(prev: any, next: any): boolean {
    const prevMemoizedState = prev.memoizedState;
    const nextMemoizedState = next.memoizedState;

    if (isHookThatCanScheduleUpdate(prev)) {
      return prevMemoizedState !== nextMemoizedState;
    }

    return false;
  }

  function didHooksChange(prev: any, next: any): boolean {
    if (prev == null || next == null) {
      return false;
    }

    // We can't report anything meaningful for hooks changes.
    if (
      next.hasOwnProperty('baseState') &&
      next.hasOwnProperty('memoizedState') &&
      next.hasOwnProperty('next') &&
      next.hasOwnProperty('queue')
    ) {
      while (next !== null) {
        if (didStatefulHookChange(prev, next)) {
          return true;
        } else {
          next = next.next;
          prev = prev.next;
        }
      }
    }

    return false;
  }

  function getChangedHooksIndices(prev: any, next: any): null | Array<number> {
    if (enableProfilerChangedHookIndices) {
      if (prev == null || next == null) {
        return null;
      }

      const indices = [];
      let index = 0;
      if (
        next.hasOwnProperty('baseState') &&
        next.hasOwnProperty('memoizedState') &&
        next.hasOwnProperty('next') &&
        next.hasOwnProperty('queue')
      ) {
        while (next !== null) {
          if (didStatefulHookChange(prev, next)) {
            indices.push(index);
          }
          next = next.next;
          prev = prev.next;
          index++;
        }
      }

      return indices;
    }

    return null;
  }

  function getChangedKeys(prev: any, next: any): null | Array<string> {
    if (prev == null || next == null) {
      return null;
    }

    // We can't report anything meaningful for hooks changes.
    if (
      next.hasOwnProperty('baseState') &&
      next.hasOwnProperty('memoizedState') &&
      next.hasOwnProperty('next') &&
      next.hasOwnProperty('queue')
    ) {
      return null;
    }

    const keys = new Set([...Object.keys(prev), ...Object.keys(next)]);
    const changedKeys = [];
    // eslint-disable-next-line no-for-of-loops/no-for-of-loops
    for (const key of keys) {
      if (prev[key] !== next[key]) {
        changedKeys.push(key);
      }
    }

    return changedKeys;
  }

  // eslint-disable-next-line no-unused-vars
  function didFiberRender(prevFiber: Fiber, nextFiber: Fiber): boolean {
    switch (nextFiber.tag) {
      case ClassComponent:
      case FunctionComponent:
      case ContextConsumer:
      case MemoComponent:
      case SimpleMemoComponent:
      case ForwardRef:
        // For types that execute user code, we check PerformedWork effect.
        // We don't reflect bailouts (either referential or sCU) in DevTools.
        // eslint-disable-next-line no-bitwise
        return (getFiberFlags(nextFiber) & PerformedWork) === PerformedWork;
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

  type OperationsArray = Array<number>;

  type StringTableEntry = {|
    encodedString: Array<number>,
    id: number,
  |};

  const pendingOperations: OperationsArray = [];
  const pendingRealUnmountedIDs: Array<number> = [];
  const pendingSimulatedUnmountedIDs: Array<number> = [];
  let pendingOperationsQueue: Array<OperationsArray> | null = [];
  const pendingStringTable: Map<string, StringTableEntry> = new Map();
  let pendingStringTableLength: number = 0;
  let pendingUnmountedRootID: number | null = null;

  function pushOperation(op: number): void {
    if (__DEV__) {
      if (!Number.isInteger(op)) {
        console.error(
          'pushOperation() was called but the value is not an integer.',
          op,
        );
      }
    }
    pendingOperations.push(op);
  }

  function shouldBailoutWithPendingOperations() {
    if (isProfiling) {
      if (
        currentCommitProfilingMetadata != null &&
        currentCommitProfilingMetadata.durations.length > 0
      ) {
        return false;
      }
    }

    return (
      pendingOperations.length === 0 &&
      pendingRealUnmountedIDs.length === 0 &&
      pendingSimulatedUnmountedIDs.length === 0 &&
      pendingUnmountedRootID === null
    );
  }

  function flushOrQueueOperations(operations: OperationsArray): void {
    if (shouldBailoutWithPendingOperations()) {
      return;
    }

    if (pendingOperationsQueue !== null) {
      pendingOperationsQueue.push(operations);
    } else {
      hook.emit('operations', operations);
    }
  }

  let flushPendingErrorsAndWarningsAfterDelayTimeoutID = null;

  function clearPendingErrorsAndWarningsAfterDelay() {
    if (flushPendingErrorsAndWarningsAfterDelayTimeoutID !== null) {
      clearTimeout(flushPendingErrorsAndWarningsAfterDelayTimeoutID);
      flushPendingErrorsAndWarningsAfterDelayTimeoutID = null;
    }
  }

  function flushPendingErrorsAndWarningsAfterDelay() {
    clearPendingErrorsAndWarningsAfterDelay();

    flushPendingErrorsAndWarningsAfterDelayTimeoutID = setTimeout(() => {
      flushPendingErrorsAndWarningsAfterDelayTimeoutID = null;

      if (pendingOperations.length > 0) {
        // On the off chance that something else has pushed pending operations,
        // we should bail on warnings; it's probably not safe to push midway.
        return;
      }

      recordPendingErrorsAndWarnings();

      if (shouldBailoutWithPendingOperations()) {
        // No warnings or errors to flush; we can bail out early here too.
        return;
      }

      // We can create a smaller operations array than flushPendingEvents()
      // because we only need to flush warning and error counts.
      // Only a few pieces of fixed information are required up front.
      const operations: OperationsArray = new Array(
        3 + pendingOperations.length,
      );
      operations[0] = rendererID;
      operations[1] = currentRootID;
      operations[2] = 0; // String table size
      for (let j = 0; j < pendingOperations.length; j++) {
        operations[3 + j] = pendingOperations[j];
      }

      flushOrQueueOperations(operations);

      pendingOperations.length = 0;
    }, 1000);
  }

  function reevaluateErrorsAndWarnings() {
    fibersWithChangedErrorOrWarningCounts.clear();
    fiberIDToErrorsMap.forEach((countMap, fiberID) => {
      const fiber = idToArbitraryFiberMap.get(fiberID);
      if (fiber != null) {
        fibersWithChangedErrorOrWarningCounts.add(fiber);
      }
    });
    fiberIDToWarningsMap.forEach((countMap, fiberID) => {
      const fiber = idToArbitraryFiberMap.get(fiberID);
      if (fiber != null) {
        fibersWithChangedErrorOrWarningCounts.add(fiber);
      }
    });
    recordPendingErrorsAndWarnings();
  }

  function mergeMapsAndGetCountHelper(
    fiber: Fiber,
    fiberID: number,
    pendingFiberToMessageCountMap: Map<Fiber, Map<string, number>>,
    fiberIDToMessageCountMap: Map<number, Map<string, number>>,
  ): number {
    let newCount = 0;

    let messageCountMap = fiberIDToMessageCountMap.get(fiberID);

    const pendingMessageCountMap = pendingFiberToMessageCountMap.get(fiber);
    if (pendingMessageCountMap != null) {
      if (messageCountMap == null) {
        messageCountMap = pendingMessageCountMap;

        fiberIDToMessageCountMap.set(fiberID, pendingMessageCountMap);
      } else {
        // This Flow refinement should not be necessary and yet...
        const refinedMessageCountMap = ((messageCountMap: any): Map<
          string,
          number,
        >);

        pendingMessageCountMap.forEach((pendingCount, message) => {
          const previousCount = refinedMessageCountMap.get(message) || 0;
          refinedMessageCountMap.set(message, previousCount + pendingCount);
        });
      }
    }

    if (!shouldFilterFiber(fiber)) {
      if (messageCountMap != null) {
        messageCountMap.forEach(count => {
          newCount += count;
        });
      }
    }

    pendingFiberToMessageCountMap.delete(fiber);

    return newCount;
  }

  function recordPendingErrorsAndWarnings() {
    clearPendingErrorsAndWarningsAfterDelay();

    fibersWithChangedErrorOrWarningCounts.forEach(fiber => {
      const fiberID = getFiberIDUnsafe(fiber);
      if (fiberID === null) {
        // Don't send updates for Fibers that didn't mount due to e.g. Suspense or an error boundary.
      } else {
        const errorCount = mergeMapsAndGetCountHelper(
          fiber,
          fiberID,
          pendingFiberToErrorsMap,
          fiberIDToErrorsMap,
        );
        const warningCount = mergeMapsAndGetCountHelper(
          fiber,
          fiberID,
          pendingFiberToWarningsMap,
          fiberIDToWarningsMap,
        );

        pushOperation(TREE_OPERATION_UPDATE_ERRORS_OR_WARNINGS);
        pushOperation(fiberID);
        pushOperation(errorCount);
        pushOperation(warningCount);
      }

      // Always clean up so that we don't leak.
      pendingFiberToErrorsMap.delete(fiber);
      pendingFiberToWarningsMap.delete(fiber);
    });
    fibersWithChangedErrorOrWarningCounts.clear();
  }

  function flushPendingEvents(root: Object): void {
    // Add any pending errors and warnings to the operations array.
    // We do this just before flushing, so we can ignore errors for no-longer-mounted Fibers.
    recordPendingErrorsAndWarnings();

    if (shouldBailoutWithPendingOperations()) {
      // If we aren't profiling, we can just bail out here.
      // No use sending an empty update over the bridge.
      //
      // The Profiler stores metadata for each commit and reconstructs the app tree per commit using:
      // (1) an initial tree snapshot and
      // (2) the operations array for each commit
      // Because of this, it's important that the operations and metadata arrays align,
      // So it's important not to omit even empty operations while profiling is active.
      return;
    }

    const numUnmountIDs =
      pendingRealUnmountedIDs.length +
      pendingSimulatedUnmountedIDs.length +
      (pendingUnmountedRootID === null ? 0 : 1);

    const operations = new Array(
      // Identify which renderer this update is coming from.
      2 + // [rendererID, rootFiberID]
      // How big is the string table?
      1 + // [stringTableLength]
        // Then goes the actual string table.
        pendingStringTableLength +
        // All unmounts are batched in a single message.
        // [TREE_OPERATION_REMOVE, removedIDLength, ...ids]
        (numUnmountIDs > 0 ? 2 + numUnmountIDs : 0) +
        // Regular operations
        pendingOperations.length,
    );

    // Identify which renderer this update is coming from.
    // This enables roots to be mapped to renderers,
    // Which in turn enables fiber props, states, and hooks to be inspected.
    let i = 0;
    operations[i++] = rendererID;
    operations[i++] = currentRootID;

    // Now fill in the string table.
    // [stringTableLength, str1Length, ...str1, str2Length, ...str2, ...]
    operations[i++] = pendingStringTableLength;
    pendingStringTable.forEach((entry, stringKey) => {
      const encodedString = entry.encodedString;

      // Don't use the string length.
      // It won't work for multibyte characters (like emoji).
      const length = encodedString.length;

      operations[i++] = length;
      for (let j = 0; j < length; j++) {
        operations[i + j] = encodedString[j];
      }

      i += length;
    });

    if (numUnmountIDs > 0) {
      // All unmounts except roots are batched in a single message.
      operations[i++] = TREE_OPERATION_REMOVE;
      // The first number is how many unmounted IDs we're gonna send.
      operations[i++] = numUnmountIDs;
      // Fill in the real unmounts in the reverse order.
      // They were inserted parents-first by React, but we want children-first.
      // So we traverse our array backwards.
      for (let j = pendingRealUnmountedIDs.length - 1; j >= 0; j--) {
        operations[i++] = pendingRealUnmountedIDs[j];
      }
      // Fill in the simulated unmounts (hidden Suspense subtrees) in their order.
      // (We want children to go before parents.)
      // They go *after* the real unmounts because we know for sure they won't be
      // children of already pushed "real" IDs. If they were, we wouldn't be able
      // to discover them during the traversal, as they would have been deleted.
      for (let j = 0; j < pendingSimulatedUnmountedIDs.length; j++) {
        operations[i + j] = pendingSimulatedUnmountedIDs[j];
      }
      i += pendingSimulatedUnmountedIDs.length;
      // The root ID should always be unmounted last.
      if (pendingUnmountedRootID !== null) {
        operations[i] = pendingUnmountedRootID;
        i++;
      }
    }
    // Fill in the rest of the operations.
    for (let j = 0; j < pendingOperations.length; j++) {
      operations[i + j] = pendingOperations[j];
    }
    i += pendingOperations.length;

    // Let the frontend know about tree operations.
    flushOrQueueOperations(operations);

    // Reset all of the pending state now that we've told the frontend about it.
    pendingOperations.length = 0;
    pendingRealUnmountedIDs.length = 0;
    pendingSimulatedUnmountedIDs.length = 0;
    pendingUnmountedRootID = null;
    pendingStringTable.clear();
    pendingStringTableLength = 0;
  }

  function getStringID(string: string | null): number {
    if (string === null) {
      return 0;
    }
    const existingEntry = pendingStringTable.get(string);
    if (existingEntry !== undefined) {
      return existingEntry.id;
    }

    const id = pendingStringTable.size + 1;
    const encodedString = utfEncodeString(string);

    pendingStringTable.set(string, {
      encodedString,
      id,
    });

    // The string table total length needs to account both for the string length,
    // and for the array item that contains the length itself.
    //
    // Don't use string length for this table.
    // It won't work for multibyte characters (like emoji).
    pendingStringTableLength += encodedString.length + 1;

    return id;
  }

  function recordMount(fiber: Fiber, parentFiber: Fiber | null) {
    const isRoot = fiber.tag === HostRoot;
    const id = getOrGenerateFiberID(fiber);

    if (__DEBUG__) {
      debug('recordMount()', fiber, parentFiber);
    }

    const hasOwnerMetadata = fiber.hasOwnProperty('_debugOwner');
    const isProfilingSupported = fiber.hasOwnProperty('treeBaseDuration');

    // Adding a new field here would require a bridge protocol version bump (a backwads breaking change).
    // Instead let's re-purpose a pre-existing field to carry more information.
    let profilingFlags = 0;
    if (isProfilingSupported) {
      profilingFlags = PROFILING_FLAG_BASIC_SUPPORT;
      if (typeof injectProfilingHooks === 'function') {
        profilingFlags |= PROFILING_FLAG_TIMELINE_SUPPORT;
      }
    }

    if (isRoot) {
      pushOperation(TREE_OPERATION_ADD);
      pushOperation(id);
      pushOperation(ElementTypeRoot);
      pushOperation((fiber.mode & StrictModeBits) !== 0 ? 1 : 0);
      pushOperation(profilingFlags);
      pushOperation(StrictModeBits !== 0 ? 1 : 0);
      pushOperation(hasOwnerMetadata ? 1 : 0);

      if (isProfiling) {
        if (displayNamesByRootID !== null) {
          displayNamesByRootID.set(id, getDisplayNameForRoot(fiber));
        }
      }
    } else {
      const {key} = fiber;
      const displayName = getDisplayNameForFiber(fiber);
      const elementType = getElementTypeForFiber(fiber);
      const {_debugOwner} = fiber;

      // Ideally we should call getFiberIDThrows() for _debugOwner,
      // since owners are almost always higher in the tree (and so have already been processed),
      // but in some (rare) instances reported in open source, a descendant mounts before an owner.
      // Since this is a DEV only field it's probably okay to also just lazily generate and ID here if needed.
      // See https://github.com/facebook/react/issues/21445
      const ownerID =
        _debugOwner != null ? getOrGenerateFiberID(_debugOwner) : 0;
      const parentID = parentFiber ? getFiberIDThrows(parentFiber) : 0;

      const displayNameStringID = getStringID(displayName);

      // This check is a guard to handle a React element that has been modified
      // in such a way as to bypass the default stringification of the "key" property.
      const keyString = key === null ? null : String(key);
      const keyStringID = getStringID(keyString);

      pushOperation(TREE_OPERATION_ADD);
      pushOperation(id);
      pushOperation(elementType);
      pushOperation(parentID);
      pushOperation(ownerID);
      pushOperation(displayNameStringID);
      pushOperation(keyStringID);

      // If this subtree has a new mode, let the frontend know.
      if (
        (fiber.mode & StrictModeBits) !== 0 &&
        (((parentFiber: any): Fiber).mode & StrictModeBits) === 0
      ) {
        pushOperation(TREE_OPERATION_SET_SUBTREE_MODE);
        pushOperation(id);
        pushOperation(StrictMode);
      }
    }

    if (isProfilingSupported) {
      idToRootMap.set(id, currentRootID);

      recordProfilingDurations(fiber);
    }
  }

  function recordUnmount(fiber: Fiber, isSimulated: boolean) {
    if (__DEBUG__) {
      debug(
        'recordUnmount()',
        fiber,
        null,
        isSimulated ? 'unmount is simulated' : '',
      );
    }

    if (trackedPathMatchFiber !== null) {
      // We're in the process of trying to restore previous selection.
      // If this fiber matched but is being unmounted, there's no use trying.
      // Reset the state so we don't keep holding onto it.
      if (
        fiber === trackedPathMatchFiber ||
        fiber === trackedPathMatchFiber.alternate
      ) {
        setTrackedPath(null);
      }
    }

    const unsafeID = getFiberIDUnsafe(fiber);
    if (unsafeID === null) {
      // If we've never seen this Fiber, it might be inside of a legacy render Suspense fragment (so the store is not even aware of it).
      // In that case we can just ignore it or it will cause errors later on.
      // One example of this is a Lazy component that never resolves before being unmounted.
      //
      // This also might indicate a Fast Refresh force-remount scenario.
      //
      // TODO: This is fragile and can obscure actual bugs.
      return;
    }

    // Flow refinement.
    const id = ((unsafeID: any): number);
    const isRoot = fiber.tag === HostRoot;
    if (isRoot) {
      // Roots must be removed only after all children (pending and simulated) have been removed.
      // So we track it separately.
      pendingUnmountedRootID = id;
    } else if (!shouldFilterFiber(fiber)) {
      // To maintain child-first ordering,
      // we'll push it into one of these queues,
      // and later arrange them in the correct order.
      if (isSimulated) {
        pendingSimulatedUnmountedIDs.push(id);
      } else {
        pendingRealUnmountedIDs.push(id);
      }
    }

    if (!fiber._debugNeedsRemount) {
      untrackFiberID(fiber);

      const isProfilingSupported = fiber.hasOwnProperty('treeBaseDuration');
      if (isProfilingSupported) {
        idToRootMap.delete(id);
        idToTreeBaseDurationMap.delete(id);
      }
    }
  }

  function mountFiberRecursively(
    firstChild: Fiber,
    parentFiber: Fiber | null,
    traverseSiblings: boolean,
    traceNearestHostComponentUpdate: boolean,
  ) {
    // Iterate over siblings rather than recursing.
    // This reduces the chance of stack overflow for wide trees (e.g. lists with many items).
    let fiber: Fiber | null = firstChild;
    while (fiber !== null) {
      // Generate an ID even for filtered Fibers, in case it's needed later (e.g. for Profiling).
      getOrGenerateFiberID(fiber);

      if (__DEBUG__) {
        debug('mountFiberRecursively()', fiber, parentFiber);
      }

      // If we have the tree selection from previous reload, try to match this Fiber.
      // Also remember whether to do the same for siblings.
      const mightSiblingsBeOnTrackedPath = updateTrackedPathStateBeforeMount(
        fiber,
      );

      const shouldIncludeInTree = !shouldFilterFiber(fiber);
      if (shouldIncludeInTree) {
        recordMount(fiber, parentFiber);
      }

      if (traceUpdatesEnabled) {
        if (traceNearestHostComponentUpdate) {
          const elementType = getElementTypeForFiber(fiber);
          // If an ancestor updated, we should mark the nearest host nodes for highlighting.
          if (elementType === ElementTypeHostComponent) {
            traceUpdatesForNodes.add(fiber.stateNode);
            traceNearestHostComponentUpdate = false;
          }
        }

        // We intentionally do not re-enable the traceNearestHostComponentUpdate flag in this branch,
        // because we don't want to highlight every host node inside of a newly mounted subtree.
      }

      const isSuspense = fiber.tag === ReactTypeOfWork.SuspenseComponent;
      if (isSuspense) {
        const isTimedOut = fiber.memoizedState !== null;
        if (isTimedOut) {
          // Special case: if Suspense mounts in a timed-out state,
          // get the fallback child from the inner fragment and mount
          // it as if it was our own child. Updates handle this too.
          const primaryChildFragment = fiber.child;
          const fallbackChildFragment = primaryChildFragment
            ? primaryChildFragment.sibling
            : null;
          const fallbackChild = fallbackChildFragment
            ? fallbackChildFragment.child
            : null;
          if (fallbackChild !== null) {
            mountFiberRecursively(
              fallbackChild,
              shouldIncludeInTree ? fiber : parentFiber,
              true,
              traceNearestHostComponentUpdate,
            );
          }
        } else {
          let primaryChild: Fiber | null = null;
          const areSuspenseChildrenConditionallyWrapped =
            OffscreenComponent === -1;
          if (areSuspenseChildrenConditionallyWrapped) {
            primaryChild = fiber.child;
          } else if (fiber.child !== null) {
            primaryChild = fiber.child.child;
          }
          if (primaryChild !== null) {
            mountFiberRecursively(
              primaryChild,
              shouldIncludeInTree ? fiber : parentFiber,
              true,
              traceNearestHostComponentUpdate,
            );
          }
        }
      } else {
        if (fiber.child !== null) {
          mountFiberRecursively(
            fiber.child,
            shouldIncludeInTree ? fiber : parentFiber,
            true,
            traceNearestHostComponentUpdate,
          );
        }
      }

      // We're exiting this Fiber now, and entering its siblings.
      // If we have selection to restore, we might need to re-activate tracking.
      updateTrackedPathStateAfterMount(mightSiblingsBeOnTrackedPath);

      fiber = traverseSiblings ? fiber.sibling : null;
    }
  }

  // We use this to simulate unmounting for Suspense trees
  // when we switch from primary to fallback.
  function unmountFiberChildrenRecursively(fiber: Fiber) {
    if (__DEBUG__) {
      debug('unmountFiberChildrenRecursively()', fiber);
    }

    // We might meet a nested Suspense on our way.
    const isTimedOutSuspense =
      fiber.tag === ReactTypeOfWork.SuspenseComponent &&
      fiber.memoizedState !== null;

    let child = fiber.child;
    if (isTimedOutSuspense) {
      // If it's showing fallback tree, let's traverse it instead.
      const primaryChildFragment = fiber.child;
      const fallbackChildFragment = primaryChildFragment
        ? primaryChildFragment.sibling
        : null;
      // Skip over to the real Fiber child.
      child = fallbackChildFragment ? fallbackChildFragment.child : null;
    }

    while (child !== null) {
      // Record simulated unmounts children-first.
      // We skip nodes without return because those are real unmounts.
      if (child.return !== null) {
        unmountFiberChildrenRecursively(child);
        recordUnmount(child, true);
      }
      child = child.sibling;
    }
  }

  function recordProfilingDurations(fiber: Fiber) {
    const id = getFiberIDThrows(fiber);
    const {actualDuration, treeBaseDuration} = fiber;

    idToTreeBaseDurationMap.set(id, treeBaseDuration || 0);

    if (isProfiling) {
      const {alternate} = fiber;

      // It's important to update treeBaseDuration even if the current Fiber did not render,
      // because it's possible that one of its descendants did.
      if (
        alternate == null ||
        treeBaseDuration !== alternate.treeBaseDuration
      ) {
        // Tree base duration updates are included in the operations typed array.
        // So we have to convert them from milliseconds to microseconds so we can send them as ints.
        const convertedTreeBaseDuration = Math.floor(
          (treeBaseDuration || 0) * 1000,
        );
        pushOperation(TREE_OPERATION_UPDATE_TREE_BASE_DURATION);
        pushOperation(id);
        pushOperation(convertedTreeBaseDuration);
      }

      if (alternate == null || didFiberRender(alternate, fiber)) {
        if (actualDuration != null) {
          // The actual duration reported by React includes time spent working on children.
          // This is useful information, but it's also useful to be able to exclude child durations.
          // The frontend can't compute this, since the immediate children may have been filtered out.
          // So we need to do this on the backend.
          // Note that this calculated self duration is not the same thing as the base duration.
          // The two are calculated differently (tree duration does not accumulate).
          let selfDuration = actualDuration;
          let child = fiber.child;
          while (child !== null) {
            selfDuration -= child.actualDuration || 0;
            child = child.sibling;
          }

          // If profiling is active, store durations for elements that were rendered during the commit.
          // Note that we should do this for any fiber we performed work on, regardless of its actualDuration value.
          // In some cases actualDuration might be 0 for fibers we worked on (particularly if we're using Date.now)
          // In other cases (e.g. Memo) actualDuration might be greater than 0 even if we "bailed out".
          const metadata = ((currentCommitProfilingMetadata: any): CommitProfilingData);
          metadata.durations.push(id, actualDuration, selfDuration);
          metadata.maxActualDuration = Math.max(
            metadata.maxActualDuration,
            actualDuration,
          );

          if (recordChangeDescriptions) {
            const changeDescription = getChangeDescription(alternate, fiber);
            if (changeDescription !== null) {
              if (metadata.changeDescriptions !== null) {
                metadata.changeDescriptions.set(id, changeDescription);
              }
            }

            updateContextsForFiber(fiber);
          }
        }
      }
    }
  }

  function recordResetChildren(fiber: Fiber, childSet: Fiber) {
    if (__DEBUG__) {
      debug('recordResetChildren()', childSet, fiber);
    }
    // The frontend only really cares about the displayName, key, and children.
    // The first two don't really change, so we are only concerned with the order of children here.
    // This is trickier than a simple comparison though, since certain types of fibers are filtered.
    const nextChildren: Array<number> = [];

    // This is a naive implementation that shallowly recourses children.
    // We might want to revisit this if it proves to be too inefficient.
    let child = childSet;
    while (child !== null) {
      findReorderedChildrenRecursively(child, nextChildren);
      child = child.sibling;
    }

    const numChildren = nextChildren.length;
    if (numChildren < 2) {
      // No need to reorder.
      return;
    }
    pushOperation(TREE_OPERATION_REORDER_CHILDREN);
    pushOperation(getFiberIDThrows(fiber));
    pushOperation(numChildren);
    for (let i = 0; i < nextChildren.length; i++) {
      pushOperation(nextChildren[i]);
    }
  }

  function findReorderedChildrenRecursively(
    fiber: Fiber,
    nextChildren: Array<number>,
  ) {
    if (!shouldFilterFiber(fiber)) {
      nextChildren.push(getFiberIDThrows(fiber));
    } else {
      let child = fiber.child;
      const isTimedOutSuspense =
        fiber.tag === SuspenseComponent && fiber.memoizedState !== null;
      if (isTimedOutSuspense) {
        // Special case: if Suspense mounts in a timed-out state,
        // get the fallback child from the inner fragment,
        // and skip over the primary child.
        const primaryChildFragment = fiber.child;
        const fallbackChildFragment = primaryChildFragment
          ? primaryChildFragment.sibling
          : null;
        const fallbackChild = fallbackChildFragment
          ? fallbackChildFragment.child
          : null;
        if (fallbackChild !== null) {
          child = fallbackChild;
        }
      }
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
    parentFiber: Fiber | null,
    traceNearestHostComponentUpdate: boolean,
  ): boolean {
    const id = getOrGenerateFiberID(nextFiber);

    if (__DEBUG__) {
      debug('updateFiberRecursively()', nextFiber, parentFiber);
    }

    if (traceUpdatesEnabled) {
      const elementType = getElementTypeForFiber(nextFiber);
      if (traceNearestHostComponentUpdate) {
        // If an ancestor updated, we should mark the nearest host nodes for highlighting.
        if (elementType === ElementTypeHostComponent) {
          traceUpdatesForNodes.add(nextFiber.stateNode);
          traceNearestHostComponentUpdate = false;
        }
      } else {
        if (
          elementType === ElementTypeFunction ||
          elementType === ElementTypeClass ||
          elementType === ElementTypeContext ||
          elementType === ElementTypeMemo ||
          elementType === ElementTypeForwardRef
        ) {
          // Otherwise if this is a traced ancestor, flag for the nearest host descendant(s).
          traceNearestHostComponentUpdate = didFiberRender(
            prevFiber,
            nextFiber,
          );
        }
      }
    }

    if (
      mostRecentlyInspectedElement !== null &&
      mostRecentlyInspectedElement.id === id &&
      didFiberRender(prevFiber, nextFiber)
    ) {
      // If this Fiber has updated, clear cached inspected data.
      // If it is inspected again, it may need to be re-run to obtain updated hooks values.
      hasElementUpdatedSinceLastInspected = true;
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
    // The logic below is inspired by the code paths in updateSuspenseComponent()
    // inside ReactFiberBeginWork in the React source code.
    if (prevDidTimeout && nextDidTimeOut) {
      // Fallback -> Fallback:
      // 1. Reconcile fallback set.
      const nextFiberChild = nextFiber.child;
      const nextFallbackChildSet = nextFiberChild
        ? nextFiberChild.sibling
        : null;
      // Note: We can't use nextFiber.child.sibling.alternate
      // because the set is special and alternate may not exist.
      const prevFiberChild = prevFiber.child;
      const prevFallbackChildSet = prevFiberChild
        ? prevFiberChild.sibling
        : null;
      if (
        nextFallbackChildSet != null &&
        prevFallbackChildSet != null &&
        updateFiberRecursively(
          nextFallbackChildSet,
          prevFallbackChildSet,
          nextFiber,
          traceNearestHostComponentUpdate,
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
        mountFiberRecursively(
          nextPrimaryChildSet,
          shouldIncludeInTree ? nextFiber : parentFiber,
          true,
          traceNearestHostComponentUpdate,
        );
      }
      shouldResetChildren = true;
    } else if (!prevDidTimeout && nextDidTimeOut) {
      // Primary -> Fallback:
      // 1. Hide primary set
      // This is not a real unmount, so it won't get reported by React.
      // We need to manually walk the previous tree and record unmounts.
      unmountFiberChildrenRecursively(prevFiber);
      // 2. Mount fallback set
      const nextFiberChild = nextFiber.child;
      const nextFallbackChildSet = nextFiberChild
        ? nextFiberChild.sibling
        : null;
      if (nextFallbackChildSet != null) {
        mountFiberRecursively(
          nextFallbackChildSet,
          shouldIncludeInTree ? nextFiber : parentFiber,
          true,
          traceNearestHostComponentUpdate,
        );
        shouldResetChildren = true;
      }
    } else {
      // Common case: Primary -> Primary.
      // This is the same code path as for non-Suspense fibers.
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
                shouldIncludeInTree ? nextFiber : parentFiber,
                traceNearestHostComponentUpdate,
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
              shouldIncludeInTree ? nextFiber : parentFiber,
              false,
              traceNearestHostComponentUpdate,
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
      } else {
        if (traceUpdatesEnabled) {
          // If we're tracing updates and we've bailed out before reaching a host node,
          // we should fall back to recursively marking the nearest host descendants for highlight.
          if (traceNearestHostComponentUpdate) {
            const hostFibers = findAllCurrentHostFibers(
              getFiberIDThrows(nextFiber),
            );
            hostFibers.forEach(hostFiber => {
              traceUpdatesForNodes.add(hostFiber.stateNode);
            });
          }
        }
      }
    }

    if (shouldIncludeInTree) {
      const isProfilingSupported = nextFiber.hasOwnProperty('treeBaseDuration');
      if (isProfilingSupported) {
        recordProfilingDurations(nextFiber);
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
          const nextFiberChild = nextFiber.child;
          nextChildSet = nextFiberChild ? nextFiberChild.sibling : null;
        }
        if (nextChildSet != null) {
          recordResetChildren(nextFiber, nextChildSet);
        }
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

  function rootSupportsProfiling(root) {
    if (root.memoizedInteractions != null) {
      // v16 builds include this field for the scheduler/tracing API.
      return true;
    } else if (
      root.current != null &&
      root.current.hasOwnProperty('treeBaseDuration')
    ) {
      // The scheduler/tracing API was removed in v17 though
      // so we need to check a non-root Fiber.
      return true;
    } else {
      return false;
    }
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
      localPendingOperationsQueue.forEach(operations => {
        hook.emit('operations', operations);
      });
    } else {
      // Before the traversals, remember to start tracking
      // our path in case we have selection to restore.
      if (trackedPath !== null) {
        mightBeOnTrackedPath = true;
      }
      // If we have not been profiling, then we can just walk the tree and build up its current state as-is.
      hook.getFiberRoots(rendererID).forEach(root => {
        currentRootID = getOrGenerateFiberID(root.current);
        setRootPseudoKey(currentRootID, root.current);

        // Handle multi-renderer edge-case where only some v16 renderers support profiling.
        if (isProfiling && rootSupportsProfiling(root)) {
          // If profiling is active, store commit time and duration.
          // The frontend may request this information after profiling has stopped.
          currentCommitProfilingMetadata = {
            changeDescriptions: recordChangeDescriptions ? new Map() : null,
            durations: [],
            commitTime: getCurrentTime() - profilingStartTime,
            maxActualDuration: 0,
            priorityLevel: null,
            updaters: getUpdatersList(root),
            effectDuration: null,
            passiveEffectDuration: null,
          };
        }

        mountFiberRecursively(root.current, null, false, false);
        flushPendingEvents(root);
        currentRootID = -1;
      });
    }
  }

  function getUpdatersList(root): Array<SerializedElement> | null {
    return root.memoizedUpdaters != null
      ? Array.from(root.memoizedUpdaters)
          .filter(fiber => getFiberIDUnsafe(fiber) !== null)
          .map(fiberToSerializedElement)
      : null;
  }

  function handleCommitFiberUnmount(fiber) {
    // Flush any pending Fibers that we are untracking before processing the new commit.
    // If we don't do this, we might end up double-deleting Fibers in some cases (like Legacy Suspense).
    untrackFibers();

    // This is not recursive.
    // We can't traverse fibers after unmounting so instead
    // we rely on React telling us about each unmount.
    recordUnmount(fiber, false);
  }

  function handlePostCommitFiberRoot(root) {
    if (isProfiling && rootSupportsProfiling(root)) {
      if (currentCommitProfilingMetadata !== null) {
        const {effectDuration, passiveEffectDuration} = getEffectDurations(
          root,
        );
        currentCommitProfilingMetadata.effectDuration = effectDuration;
        currentCommitProfilingMetadata.passiveEffectDuration = passiveEffectDuration;
      }
    }
  }

  function handleCommitFiberRoot(root, priorityLevel) {
    const current = root.current;
    const alternate = current.alternate;

    // Flush any pending Fibers that we are untracking before processing the new commit.
    // If we don't do this, we might end up double-deleting Fibers in some cases (like Legacy Suspense).
    untrackFibers();

    currentRootID = getOrGenerateFiberID(current);

    // Before the traversals, remember to start tracking
    // our path in case we have selection to restore.
    if (trackedPath !== null) {
      mightBeOnTrackedPath = true;
    }

    if (traceUpdatesEnabled) {
      traceUpdatesForNodes.clear();
    }

    // Handle multi-renderer edge-case where only some v16 renderers support profiling.
    const isProfilingSupported = rootSupportsProfiling(root);

    if (isProfiling && isProfilingSupported) {
      // If profiling is active, store commit time and duration.
      // The frontend may request this information after profiling has stopped.
      currentCommitProfilingMetadata = {
        changeDescriptions: recordChangeDescriptions ? new Map() : null,
        durations: [],
        commitTime: getCurrentTime() - profilingStartTime,
        maxActualDuration: 0,
        priorityLevel:
          priorityLevel == null ? null : formatPriorityLevel(priorityLevel),

        updaters: getUpdatersList(root),

        // Initialize to null; if new enough React version is running,
        // these values will be read during separate handlePostCommitFiberRoot() call.
        effectDuration: null,
        passiveEffectDuration: null,
      };
    }

    if (alternate) {
      // TODO: relying on this seems a bit fishy.
      const wasMounted =
        alternate.memoizedState != null &&
        alternate.memoizedState.element != null &&
        // A dehydrated root is not considered mounted
        alternate.memoizedState.isDehydrated !== true;
      const isMounted =
        current.memoizedState != null &&
        current.memoizedState.element != null &&
        // A dehydrated root is not considered mounted
        current.memoizedState.isDehydrated !== true;
      if (!wasMounted && isMounted) {
        // Mount a new root.
        setRootPseudoKey(currentRootID, current);
        mountFiberRecursively(current, null, false, false);
      } else if (wasMounted && isMounted) {
        // Update an existing root.
        updateFiberRecursively(current, alternate, null, false);
      } else if (wasMounted && !isMounted) {
        // Unmount an existing root.
        removeRootPseudoKey(currentRootID);
        recordUnmount(current, false);
      }
    } else {
      // Mount a new root.
      setRootPseudoKey(currentRootID, current);
      mountFiberRecursively(current, null, false, false);
    }

    if (isProfiling && isProfilingSupported) {
      if (!shouldBailoutWithPendingOperations()) {
        const commitProfilingMetadata = ((rootToCommitProfilingMetadataMap: any): CommitProfilingMetadataMap).get(
          currentRootID,
        );

        if (commitProfilingMetadata != null) {
          commitProfilingMetadata.push(
            ((currentCommitProfilingMetadata: any): CommitProfilingData),
          );
        } else {
          ((rootToCommitProfilingMetadataMap: any): CommitProfilingMetadataMap).set(
            currentRootID,
            [((currentCommitProfilingMetadata: any): CommitProfilingData)],
          );
        }
      }
    }

    // We're done here.
    flushPendingEvents(root);

    if (traceUpdatesEnabled) {
      hook.emit('traceUpdates', traceUpdatesForNodes);
    }

    currentRootID = -1;
  }

  function findAllCurrentHostFibers(id: number): $ReadOnlyArray<Fiber> {
    const fibers = [];
    const fiber = findCurrentFiberUsingSlowPathById(id);
    if (!fiber) {
      return fibers;
    }

    // Next we'll drill down this component to find all HostComponent/Text.
    let node: Fiber = fiber;
    while (true) {
      if (node.tag === HostComponent || node.tag === HostText) {
        fibers.push(node);
      } else if (node.child) {
        node.child.return = node;
        node = node.child;
        continue;
      }
      if (node === fiber) {
        return fibers;
      }
      while (!node.sibling) {
        if (!node.return || node.return === fiber) {
          return fibers;
        }
        node = node.return;
      }
      node.sibling.return = node.return;
      node = node.sibling;
    }
    // Flow needs the return here, but ESLint complains about it.
    // eslint-disable-next-line no-unreachable
    return fibers;
  }

  function findNativeNodesForFiberID(id: number) {
    try {
      let fiber = findCurrentFiberUsingSlowPathById(id);
      if (fiber === null) {
        return null;
      }
      // Special case for a timed-out Suspense.
      const isTimedOutSuspense =
        fiber.tag === SuspenseComponent && fiber.memoizedState !== null;
      if (isTimedOutSuspense) {
        // A timed-out Suspense's findDOMNode is useless.
        // Try our best to find the fallback directly.
        const maybeFallbackFiber = fiber.child && fiber.child.sibling;
        if (maybeFallbackFiber != null) {
          fiber = maybeFallbackFiber;
        }
      }
      const hostFibers = findAllCurrentHostFibers(id);
      return hostFibers.map(hostFiber => hostFiber.stateNode).filter(Boolean);
    } catch (err) {
      // The fiber might have unmounted by now.
      return null;
    }
  }

  function getDisplayNameForFiberID(id) {
    const fiber = idToArbitraryFiberMap.get(id);
    return fiber != null ? getDisplayNameForFiber(((fiber: any): Fiber)) : null;
  }

  function getFiberIDForNative(
    hostInstance,
    findNearestUnfilteredAncestor = false,
  ) {
    let fiber = renderer.findFiberByHostInstance(hostInstance);
    if (fiber != null) {
      if (findNearestUnfilteredAncestor) {
        while (fiber !== null && shouldFilterFiber(fiber)) {
          fiber = fiber.return;
        }
      }
      return getFiberIDThrows(((fiber: any): Fiber));
    }
    return null;
  }

  // This function is copied from React and should be kept in sync:
  // https://github.com/facebook/react/blob/main/packages/react-reconciler/src/ReactFiberTreeReflection.js
  function assertIsMounted(fiber) {
    if (getNearestMountedFiber(fiber) !== fiber) {
      throw new Error('Unable to find node on an unmounted component.');
    }
  }

  // This function is copied from React and should be kept in sync:
  // https://github.com/facebook/react/blob/main/packages/react-reconciler/src/ReactFiberTreeReflection.js
  function getNearestMountedFiber(fiber: Fiber): null | Fiber {
    let node = fiber;
    let nearestMounted = fiber;
    if (!fiber.alternate) {
      // If there is no alternate, this might be a new tree that isn't inserted
      // yet. If it is, then it will have a pending insertion effect on it.
      let nextNode = node;
      do {
        node = nextNode;
        if ((node.flags & (Placement | Hydrating)) !== NoFlags) {
          // This is an insertion or in-progress hydration. The nearest possible
          // mounted fiber is the parent but we need to continue to figure out
          // if that one is still mounted.
          nearestMounted = node.return;
        }
        nextNode = node.return;
      } while (nextNode);
    } else {
      while (node.return) {
        node = node.return;
      }
    }
    if (node.tag === HostRoot) {
      // TODO: Check if this was a nested HostRoot when used with
      // renderContainerIntoSubtree.
      return nearestMounted;
    }
    // If we didn't hit the root, that means that we're in an disconnected tree
    // that has been unmounted.
    return null;
  }

  // This function is copied from React and should be kept in sync:
  // https://github.com/facebook/react/blob/main/packages/react-reconciler/src/ReactFiberTreeReflection.js
  // It would be nice if we updated React to inject this function directly (vs just indirectly via findDOMNode).
  // BEGIN copied code
  function findCurrentFiberUsingSlowPathById(id: number): Fiber | null {
    const fiber = idToArbitraryFiberMap.get(id);
    if (fiber == null) {
      console.warn(`Could not find Fiber with id "${id}"`);
      return null;
    }

    const alternate = fiber.alternate;
    if (!alternate) {
      // If there is no alternate, then we only need to check if it is mounted.
      const nearestMounted = getNearestMountedFiber(fiber);

      if (nearestMounted === null) {
        throw new Error('Unable to find node on an unmounted component.');
      }

      if (nearestMounted !== fiber) {
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
      const parentA = a.return;
      if (parentA === null) {
        // We're at the root.
        break;
      }
      const parentB = parentA.alternate;
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
            assertIsMounted(parentA);
            return fiber;
          }
          if (child === b) {
            // We've determined that B is the current branch.
            assertIsMounted(parentA);
            return alternate;
          }
          child = child.sibling;
        }

        // We should never have an alternate for any mounting node. So the only
        // way this could possibly happen is if this was unmounted, if at all.
        throw new Error('Unable to find node on an unmounted component.');
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
            throw new Error(
              'Child was not found in either parent set. This indicates a bug ' +
                'in React related to the return pointer. Please file an issue.',
            );
          }
        }
      }

      if (a.alternate !== b) {
        throw new Error(
          "Return fibers should always be each others' alternates. " +
            'This error is likely caused by a bug in React. Please file an issue.',
        );
      }
    }

    // If the root is not a host container, we're in a disconnected tree. I.e.
    // unmounted.
    if (a.tag !== HostRoot) {
      throw new Error('Unable to find node on an unmounted component.');
    }

    if (a.stateNode.current === a) {
      // We've determined that A is the current branch.
      return fiber;
    }
    // Otherwise B has to be current branch.
    return alternate;
  }

  // END copied code

  function prepareViewAttributeSource(
    id: number,
    path: Array<string | number>,
  ): void {
    if (isMostRecentlyInspectedElement(id)) {
      window.$attribute = getInObject(
        ((mostRecentlyInspectedElement: any): InspectedElement),
        path,
      );
    }
  }

  function prepareViewElementSource(id: number): void {
    const fiber = idToArbitraryFiberMap.get(id);
    if (fiber == null) {
      console.warn(`Could not find Fiber with id "${id}"`);
      return;
    }

    const {elementType, tag, type} = fiber;

    switch (tag) {
      case ClassComponent:
      case IncompleteClassComponent:
      case IndeterminateComponent:
      case FunctionComponent:
        global.$type = type;
        break;
      case ForwardRef:
        global.$type = type.render;
        break;
      case MemoComponent:
      case SimpleMemoComponent:
        global.$type =
          elementType != null && elementType.type != null
            ? elementType.type
            : type;
        break;
      default:
        global.$type = null;
        break;
    }
  }

  function fiberToSerializedElement(fiber: Fiber): SerializedElement {
    return {
      displayName: getDisplayNameForFiber(fiber) || 'Anonymous',
      id: getFiberIDThrows(fiber),
      key: fiber.key,
      type: getElementTypeForFiber(fiber),
    };
  }

  function getOwnersList(id: number): Array<SerializedElement> | null {
    const fiber = findCurrentFiberUsingSlowPathById(id);
    if (fiber == null) {
      return null;
    }

    const {_debugOwner} = fiber;

    const owners: Array<SerializedElement> = [fiberToSerializedElement(fiber)];

    if (_debugOwner) {
      let owner = _debugOwner;
      while (owner !== null) {
        owners.unshift(fiberToSerializedElement(owner));
        owner = owner._debugOwner || null;
      }
    }

    return owners;
  }

  // Fast path props lookup for React Native style editor.
  // Could use inspectElementRaw() but that would require shallow rendering hooks components,
  // and could also mess with memoization.
  function getInstanceAndStyle(id: number): InstanceAndStyle {
    let instance = null;
    let style = null;

    const fiber = findCurrentFiberUsingSlowPathById(id);
    if (fiber !== null) {
      instance = fiber.stateNode;

      if (fiber.memoizedProps !== null) {
        style = fiber.memoizedProps.style;
      }
    }

    return {instance, style};
  }

  function isErrorBoundary(fiber: Fiber): boolean {
    const {tag, type} = fiber;

    switch (tag) {
      case ClassComponent:
      case IncompleteClassComponent:
        const instance = fiber.stateNode;
        return (
          typeof type.getDerivedStateFromError === 'function' ||
          (instance !== null &&
            typeof instance.componentDidCatch === 'function')
        );
      default:
        return false;
    }
  }

  function getNearestErrorBoundaryID(fiber: Fiber): number | null {
    let parent = fiber.return;
    while (parent !== null) {
      if (isErrorBoundary(parent)) {
        return getFiberIDUnsafe(parent);
      }
      parent = parent.return;
    }
    return null;
  }

  function inspectElementRaw(id: number): InspectedElement | null {
    const fiber = findCurrentFiberUsingSlowPathById(id);
    if (fiber == null) {
      return null;
    }

    const {
      _debugOwner,
      _debugSource,
      stateNode,
      key,
      memoizedProps,
      memoizedState,
      dependencies,
      tag,
      type,
    } = fiber;

    const elementType = getElementTypeForFiber(fiber);

    const usesHooks =
      (tag === FunctionComponent ||
        tag === SimpleMemoComponent ||
        tag === ForwardRef) &&
      (!!memoizedState || !!dependencies);

    // TODO Show custom UI for Cache like we do for Suspense
    // For now, just hide state data entirely since it's not meant to be inspected.
    const showState = !usesHooks && tag !== CacheComponent;

    const typeSymbol = getTypeSymbol(type);

    let canViewSource = false;
    let context = null;
    if (
      tag === ClassComponent ||
      tag === FunctionComponent ||
      tag === IncompleteClassComponent ||
      tag === IndeterminateComponent ||
      tag === MemoComponent ||
      tag === ForwardRef ||
      tag === SimpleMemoComponent
    ) {
      canViewSource = true;
      if (stateNode && stateNode.context != null) {
        // Don't show an empty context object for class components that don't use the context API.
        const shouldHideContext =
          elementType === ElementTypeClass &&
          !(type.contextTypes || type.contextType);

        if (!shouldHideContext) {
          context = stateNode.context;
        }
      }
    } else if (
      typeSymbol === CONTEXT_NUMBER ||
      typeSymbol === CONTEXT_SYMBOL_STRING
    ) {
      // 16.3-16.5 read from "type" because the Consumer is the actual context object.
      // 16.6+ should read from "type._context" because Consumer can be different (in DEV).
      // NOTE Keep in sync with getDisplayNameForFiber()
      const consumerResolvedContext = type._context || type;

      // Global context value.
      context = consumerResolvedContext._currentValue || null;

      // Look for overridden value.
      let current = ((fiber: any): Fiber).return;
      while (current !== null) {
        const currentType = current.type;
        const currentTypeSymbol = getTypeSymbol(currentType);
        if (
          currentTypeSymbol === PROVIDER_NUMBER ||
          currentTypeSymbol === PROVIDER_SYMBOL_STRING
        ) {
          // 16.3.0 exposed the context object as "context"
          // PR #12501 changed it to "_context" for 16.3.1+
          // NOTE Keep in sync with getDisplayNameForFiber()
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

    let hasLegacyContext = false;
    if (context !== null) {
      hasLegacyContext = !!type.contextTypes;

      // To simplify hydration and display logic for context, wrap in a value object.
      // Otherwise simple values (e.g. strings, booleans) become harder to handle.
      context = {value: context};
    }

    let owners = null;
    if (_debugOwner) {
      owners = [];
      let owner = _debugOwner;
      while (owner !== null) {
        owners.push(fiberToSerializedElement(owner));
        owner = owner._debugOwner || null;
      }
    }

    const isTimedOutSuspense =
      tag === SuspenseComponent && memoizedState !== null;

    let hooks = null;
    if (usesHooks) {
      const originalConsoleMethods = {};

      // Temporarily disable all console logging before re-running the hook.
      for (const method in console) {
        try {
          originalConsoleMethods[method] = console[method];
          // $FlowFixMe property error|warn is not writable.
          console[method] = () => {};
        } catch (error) {}
      }

      try {
        hooks = inspectHooksOfFiber(
          fiber,
          (renderer.currentDispatcherRef: any),
          true, // Include source location info for hooks
        );
      } finally {
        // Restore original console functionality.
        for (const method in originalConsoleMethods) {
          try {
            // $FlowFixMe property error|warn is not writable.
            console[method] = originalConsoleMethods[method];
          } catch (error) {}
        }
      }
    }

    let rootType = null;
    let current = fiber;
    while (current.return !== null) {
      current = current.return;
    }
    const fiberRoot = current.stateNode;
    if (fiberRoot != null && fiberRoot._debugRootType !== null) {
      rootType = fiberRoot._debugRootType;
    }

    const errors = fiberIDToErrorsMap.get(id) || new Map();
    const warnings = fiberIDToWarningsMap.get(id) || new Map();

    const isErrored =
      (fiber.flags & DidCapture) !== NoFlags ||
      forceErrorForFiberIDs.get(id) === true;

    let targetErrorBoundaryID;
    if (isErrorBoundary(fiber)) {
      // if the current inspected element is an error boundary,
      // either that we want to use it to toggle off error state
      // or that we allow to force error state on it if it's within another
      // error boundary
      targetErrorBoundaryID = isErrored ? id : getNearestErrorBoundaryID(fiber);
    } else {
      targetErrorBoundaryID = getNearestErrorBoundaryID(fiber);
    }

    const plugins: Plugins = {
      stylex: null,
    };

    if (enableStyleXFeatures) {
      if (memoizedProps.hasOwnProperty('xstyle')) {
        plugins.stylex = getStyleXData(memoizedProps.xstyle);
      }
    }

    return {
      id,

      // Does the current renderer support editable hooks and function props?
      canEditHooks: typeof overrideHookState === 'function',
      canEditFunctionProps: typeof overrideProps === 'function',

      // Does the current renderer support advanced editing interface?
      canEditHooksAndDeletePaths:
        typeof overrideHookStateDeletePath === 'function',
      canEditHooksAndRenamePaths:
        typeof overrideHookStateRenamePath === 'function',
      canEditFunctionPropsDeletePaths:
        typeof overridePropsDeletePath === 'function',
      canEditFunctionPropsRenamePaths:
        typeof overridePropsRenamePath === 'function',

      canToggleError: supportsTogglingError && targetErrorBoundaryID != null,
      // Is this error boundary in error state.
      isErrored,
      targetErrorBoundaryID,

      canToggleSuspense:
        supportsTogglingSuspense &&
        // If it's showing the real content, we can always flip fallback.
        (!isTimedOutSuspense ||
          // If it's showing fallback because we previously forced it to,
          // allow toggling it back to remove the fallback override.
          forceFallbackForSuspenseIDs.has(id)),

      // Can view component source location.
      canViewSource,

      // Does the component have legacy context attached to it.
      hasLegacyContext,

      key: key != null ? key : null,

      displayName: getDisplayNameForFiber(fiber),
      type: elementType,

      // Inspectable properties.
      // TODO Review sanitization approach for the below inspectable values.
      context,
      hooks,
      props: memoizedProps,
      state: showState ? memoizedState : null,
      errors: Array.from(errors.entries()),
      warnings: Array.from(warnings.entries()),

      // List of owners
      owners,

      // Location of component in source code.
      source: _debugSource || null,

      rootType,
      rendererPackageName: renderer.rendererPackageName,
      rendererVersion: renderer.version,

      plugins,
    };
  }

  let mostRecentlyInspectedElement: InspectedElement | null = null;
  let hasElementUpdatedSinceLastInspected: boolean = false;
  let currentlyInspectedPaths: Object = {};

  function isMostRecentlyInspectedElement(id: number): boolean {
    return (
      mostRecentlyInspectedElement !== null &&
      mostRecentlyInspectedElement.id === id
    );
  }

  function isMostRecentlyInspectedElementCurrent(id: number): boolean {
    return (
      isMostRecentlyInspectedElement(id) && !hasElementUpdatedSinceLastInspected
    );
  }

  // Track the intersection of currently inspected paths,
  // so that we can send their data along if the element is re-rendered.
  function mergeInspectedPaths(path: Array<string | number>) {
    let current = currentlyInspectedPaths;
    path.forEach(key => {
      if (!current[key]) {
        current[key] = {};
      }
      current = current[key];
    });
  }

  function createIsPathAllowed(
    key: string | null,
    secondaryCategory: 'hooks' | null,
  ) {
    // This function helps prevent previously-inspected paths from being dehydrated in updates.
    // This is important to avoid a bad user experience where expanded toggles collapse on update.
    return function isPathAllowed(path: Array<string | number>): boolean {
      switch (secondaryCategory) {
        case 'hooks':
          if (path.length === 1) {
            // Never dehydrate the "hooks" object at the top levels.
            return true;
          }

          if (
            path[path.length - 2] === 'hookSource' &&
            path[path.length - 1] === 'fileName'
          ) {
            // It's important to preserve the full file name (URL) for hook sources
            // in case the user has enabled the named hooks feature.
            // Otherwise the frontend may end up with a partial URL which it can't load.
            return true;
          }

          if (
            path[path.length - 1] === 'subHooks' ||
            path[path.length - 2] === 'subHooks'
          ) {
            // Dehydrating the 'subHooks' property makes the HooksTree UI a lot more complicated,
            // so it's easiest for now if we just don't break on this boundary.
            // We can always dehydrate a level deeper (in the value object).
            return true;
          }
          break;
        default:
          break;
      }

      let current =
        key === null ? currentlyInspectedPaths : currentlyInspectedPaths[key];
      if (!current) {
        return false;
      }
      for (let i = 0; i < path.length; i++) {
        current = current[path[i]];
        if (!current) {
          return false;
        }
      }
      return true;
    };
  }

  function updateSelectedElement(inspectedElement: InspectedElement): void {
    const {hooks, id, props} = inspectedElement;

    const fiber = idToArbitraryFiberMap.get(id);
    if (fiber == null) {
      console.warn(`Could not find Fiber with id "${id}"`);
      return;
    }

    const {elementType, stateNode, tag, type} = fiber;

    switch (tag) {
      case ClassComponent:
      case IncompleteClassComponent:
      case IndeterminateComponent:
        global.$r = stateNode;
        break;
      case FunctionComponent:
        global.$r = {
          hooks,
          props,
          type,
        };
        break;
      case ForwardRef:
        global.$r = {
          hooks,
          props,
          type: type.render,
        };
        break;
      case MemoComponent:
      case SimpleMemoComponent:
        global.$r = {
          hooks,
          props,
          type:
            elementType != null && elementType.type != null
              ? elementType.type
              : type,
        };
        break;
      default:
        global.$r = null;
        break;
    }
  }

  function storeAsGlobal(
    id: number,
    path: Array<string | number>,
    count: number,
  ): void {
    if (isMostRecentlyInspectedElement(id)) {
      const value = getInObject(
        ((mostRecentlyInspectedElement: any): InspectedElement),
        path,
      );
      const key = `$reactTemp${count}`;

      window[key] = value;

      console.log(key);
      console.log(value);
    }
  }

  function copyElementPath(id: number, path: Array<string | number>): void {
    if (isMostRecentlyInspectedElement(id)) {
      copyToClipboard(
        getInObject(
          ((mostRecentlyInspectedElement: any): InspectedElement),
          path,
        ),
      );
    }
  }

  function inspectElement(
    requestID: number,
    id: number,
    path: Array<string | number> | null,
    forceFullData: boolean,
  ): InspectedElementPayload {
    if (path !== null) {
      mergeInspectedPaths(path);
    }

    if (isMostRecentlyInspectedElement(id) && !forceFullData) {
      if (!hasElementUpdatedSinceLastInspected) {
        if (path !== null) {
          let secondaryCategory = null;
          if (path[0] === 'hooks') {
            secondaryCategory = 'hooks';
          }

          // If this element has not been updated since it was last inspected,
          // we can just return the subset of data in the newly-inspected path.
          return {
            id,
            responseID: requestID,
            type: 'hydrated-path',
            path,
            value: cleanForBridge(
              getInObject(
                ((mostRecentlyInspectedElement: any): InspectedElement),
                path,
              ),
              createIsPathAllowed(null, secondaryCategory),
              path,
            ),
          };
        } else {
          // If this element has not been updated since it was last inspected, we don't need to return it.
          // Instead we can just return the ID to indicate that it has not changed.
          return {
            id,
            responseID: requestID,
            type: 'no-change',
          };
        }
      }
    } else {
      currentlyInspectedPaths = {};
    }

    hasElementUpdatedSinceLastInspected = false;

    try {
      mostRecentlyInspectedElement = inspectElementRaw(id);
    } catch (error) {
      // the error name is synced with ReactDebugHooks
      if (error.name === 'ReactDebugToolsRenderError') {
        let message = 'Error rendering inspected element.';
        let stack;
        // Log error & cause for user to debug
        console.error(message + '\n\n', error);
        if (error.cause != null) {
          const fiber = findCurrentFiberUsingSlowPathById(id);
          const componentName =
            fiber != null ? getDisplayNameForFiber(fiber) : null;
          console.error(
            'React DevTools encountered an error while trying to inspect hooks. ' +
              'This is most likely caused by an error in current inspected component' +
              (componentName != null ? `: "${componentName}".` : '.') +
              '\nThe error thrown in the component is: \n\n',
            error.cause,
          );
          if (error.cause instanceof Error) {
            message = error.cause.message || message;
            stack = error.cause.stack;
          }
        }

        return {
          type: 'error',
          errorType: 'user',
          id,
          responseID: requestID,
          message,
          stack,
        };
      }

      // the error name is synced with ReactDebugHooks
      if (error.name === 'ReactDebugToolsUnsupportedHookError') {
        return {
          type: 'error',
          errorType: 'unknown-hook',
          id,
          responseID: requestID,
          message:
            'Unsupported hook in the react-debug-tools package: ' +
            error.message,
        };
      }

      // Log Uncaught Error
      console.error('Error inspecting element.\n\n', error);

      return {
        type: 'error',
        errorType: 'uncaught',
        id,
        responseID: requestID,
        message: error.message,
        stack: error.stack,
      };
    }

    if (mostRecentlyInspectedElement === null) {
      return {
        id,
        responseID: requestID,
        type: 'not-found',
      };
    }

    // Any time an inspected element has an update,
    // we should update the selected $r value as wel.
    // Do this before dehydration (cleanForBridge).
    updateSelectedElement(mostRecentlyInspectedElement);

    // Clone before cleaning so that we preserve the full data.
    // This will enable us to send patches without re-inspecting if hydrated paths are requested.
    // (Reducing how often we shallow-render is a better DX for function components that use hooks.)
    const cleanedInspectedElement = {...mostRecentlyInspectedElement};
    cleanedInspectedElement.context = cleanForBridge(
      cleanedInspectedElement.context,
      createIsPathAllowed('context', null),
    );
    cleanedInspectedElement.hooks = cleanForBridge(
      cleanedInspectedElement.hooks,
      createIsPathAllowed('hooks', 'hooks'),
    );
    cleanedInspectedElement.props = cleanForBridge(
      cleanedInspectedElement.props,
      createIsPathAllowed('props', null),
    );
    cleanedInspectedElement.state = cleanForBridge(
      cleanedInspectedElement.state,
      createIsPathAllowed('state', null),
    );

    return {
      id,
      responseID: requestID,
      type: 'full-data',
      value: cleanedInspectedElement,
    };
  }

  function logElementToConsole(id) {
    const result = isMostRecentlyInspectedElementCurrent(id)
      ? mostRecentlyInspectedElement
      : inspectElementRaw(id);
    if (result === null) {
      console.warn(`Could not find Fiber with id "${id}"`);
      return;
    }

    const supportsGroup = typeof console.groupCollapsed === 'function';
    if (supportsGroup) {
      console.groupCollapsed(
        `[Click to expand] %c<${result.displayName || 'Component'} />`,
        // --dom-tag-name-color is the CSS variable Chrome styles HTML elements with in the console.
        'color: var(--dom-tag-name-color); font-weight: normal;',
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
    const nativeNodes = findNativeNodesForFiberID(id);
    if (nativeNodes !== null) {
      console.log('Nodes:', nativeNodes);
    }
    if (result.source !== null) {
      console.log('Location:', result.source);
    }
    if (window.chrome || /firefox/i.test(navigator.userAgent)) {
      console.log(
        'Right-click any value to save it as a global variable for further inspection.',
      );
    }
    if (supportsGroup) {
      console.groupEnd();
    }
  }

  function deletePath(
    type: 'context' | 'hooks' | 'props' | 'state',
    id: number,
    hookID: ?number,
    path: Array<string | number>,
  ): void {
    const fiber = findCurrentFiberUsingSlowPathById(id);
    if (fiber !== null) {
      const instance = fiber.stateNode;

      switch (type) {
        case 'context':
          // To simplify hydration and display of primitive context values (e.g. number, string)
          // the inspectElement() method wraps context in a {value: ...} object.
          // We need to remove the first part of the path (the "value") before continuing.
          path = path.slice(1);

          switch (fiber.tag) {
            case ClassComponent:
              if (path.length === 0) {
                // Simple context value (noop)
              } else {
                deletePathInObject(instance.context, path);
              }
              instance.forceUpdate();
              break;
            case FunctionComponent:
              // Function components using legacy context are not editable
              // because there's no instance on which to create a cloned, mutated context.
              break;
          }
          break;
        case 'hooks':
          if (typeof overrideHookStateDeletePath === 'function') {
            overrideHookStateDeletePath(fiber, ((hookID: any): number), path);
          }
          break;
        case 'props':
          if (instance === null) {
            if (typeof overridePropsDeletePath === 'function') {
              overridePropsDeletePath(fiber, path);
            }
          } else {
            fiber.pendingProps = copyWithDelete(instance.props, path);
            instance.forceUpdate();
          }
          break;
        case 'state':
          deletePathInObject(instance.state, path);
          instance.forceUpdate();
          break;
      }
    }
  }

  function renamePath(
    type: 'context' | 'hooks' | 'props' | 'state',
    id: number,
    hookID: ?number,
    oldPath: Array<string | number>,
    newPath: Array<string | number>,
  ): void {
    const fiber = findCurrentFiberUsingSlowPathById(id);
    if (fiber !== null) {
      const instance = fiber.stateNode;

      switch (type) {
        case 'context':
          // To simplify hydration and display of primitive context values (e.g. number, string)
          // the inspectElement() method wraps context in a {value: ...} object.
          // We need to remove the first part of the path (the "value") before continuing.
          oldPath = oldPath.slice(1);
          newPath = newPath.slice(1);

          switch (fiber.tag) {
            case ClassComponent:
              if (oldPath.length === 0) {
                // Simple context value (noop)
              } else {
                renamePathInObject(instance.context, oldPath, newPath);
              }
              instance.forceUpdate();
              break;
            case FunctionComponent:
              // Function components using legacy context are not editable
              // because there's no instance on which to create a cloned, mutated context.
              break;
          }
          break;
        case 'hooks':
          if (typeof overrideHookStateRenamePath === 'function') {
            overrideHookStateRenamePath(
              fiber,
              ((hookID: any): number),
              oldPath,
              newPath,
            );
          }
          break;
        case 'props':
          if (instance === null) {
            if (typeof overridePropsRenamePath === 'function') {
              overridePropsRenamePath(fiber, oldPath, newPath);
            }
          } else {
            fiber.pendingProps = copyWithRename(
              instance.props,
              oldPath,
              newPath,
            );
            instance.forceUpdate();
          }
          break;
        case 'state':
          renamePathInObject(instance.state, oldPath, newPath);
          instance.forceUpdate();
          break;
      }
    }
  }

  function overrideValueAtPath(
    type: 'context' | 'hooks' | 'props' | 'state',
    id: number,
    hookID: ?number,
    path: Array<string | number>,
    value: any,
  ): void {
    const fiber = findCurrentFiberUsingSlowPathById(id);
    if (fiber !== null) {
      const instance = fiber.stateNode;

      switch (type) {
        case 'context':
          // To simplify hydration and display of primitive context values (e.g. number, string)
          // the inspectElement() method wraps context in a {value: ...} object.
          // We need to remove the first part of the path (the "value") before continuing.
          path = path.slice(1);

          switch (fiber.tag) {
            case ClassComponent:
              if (path.length === 0) {
                // Simple context value
                instance.context = value;
              } else {
                setInObject(instance.context, path, value);
              }
              instance.forceUpdate();
              break;
            case FunctionComponent:
              // Function components using legacy context are not editable
              // because there's no instance on which to create a cloned, mutated context.
              break;
          }
          break;
        case 'hooks':
          if (typeof overrideHookState === 'function') {
            overrideHookState(fiber, ((hookID: any): number), path, value);
          }
          break;
        case 'props':
          switch (fiber.tag) {
            case ClassComponent:
              fiber.pendingProps = copyWithSet(instance.props, path, value);
              instance.forceUpdate();
              break;
            default:
              if (typeof overrideProps === 'function') {
                overrideProps(fiber, path, value);
              }
              break;
          }
          break;
        case 'state':
          switch (fiber.tag) {
            case ClassComponent:
              setInObject(instance.state, path, value);
              instance.forceUpdate();
              break;
          }
          break;
      }
    }
  }

  type CommitProfilingData = {|
    changeDescriptions: Map<number, ChangeDescription> | null,
    commitTime: number,
    durations: Array<number>,
    effectDuration: number | null,
    maxActualDuration: number,
    passiveEffectDuration: number | null,
    priorityLevel: string | null,
    updaters: Array<SerializedElement> | null,
  |};

  type CommitProfilingMetadataMap = Map<number, Array<CommitProfilingData>>;
  type DisplayNamesByRootID = Map<number, string>;

  let currentCommitProfilingMetadata: CommitProfilingData | null = null;
  let displayNamesByRootID: DisplayNamesByRootID | null = null;
  let idToContextsMap: Map<number, any> | null = null;
  let initialTreeBaseDurationsMap: Map<number, number> | null = null;
  let initialIDToRootMap: Map<number, number> | null = null;
  let isProfiling: boolean = false;
  let profilingStartTime: number = 0;
  let recordChangeDescriptions: boolean = false;
  let rootToCommitProfilingMetadataMap: CommitProfilingMetadataMap | null = null;

  function getProfilingData(): ProfilingDataBackend {
    const dataForRoots: Array<ProfilingDataForRootBackend> = [];

    if (rootToCommitProfilingMetadataMap === null) {
      throw Error(
        'getProfilingData() called before any profiling data was recorded',
      );
    }

    rootToCommitProfilingMetadataMap.forEach(
      (commitProfilingMetadata, rootID) => {
        const commitData: Array<CommitDataBackend> = [];
        const initialTreeBaseDurations: Array<[number, number]> = [];

        const displayName =
          (displayNamesByRootID !== null && displayNamesByRootID.get(rootID)) ||
          'Unknown';

        if (initialTreeBaseDurationsMap != null) {
          initialTreeBaseDurationsMap.forEach((treeBaseDuration, id) => {
            if (
              initialIDToRootMap != null &&
              initialIDToRootMap.get(id) === rootID
            ) {
              // We don't need to convert milliseconds to microseconds in this case,
              // because the profiling summary is JSON serialized.
              initialTreeBaseDurations.push([id, treeBaseDuration]);
            }
          });
        }

        commitProfilingMetadata.forEach((commitProfilingData, commitIndex) => {
          const {
            changeDescriptions,
            durations,
            effectDuration,
            maxActualDuration,
            passiveEffectDuration,
            priorityLevel,
            commitTime,
            updaters,
          } = commitProfilingData;

          const fiberActualDurations: Array<[number, number]> = [];
          const fiberSelfDurations: Array<[number, number]> = [];
          for (let i = 0; i < durations.length; i += 3) {
            const fiberID = durations[i];
            fiberActualDurations.push([fiberID, durations[i + 1]]);
            fiberSelfDurations.push([fiberID, durations[i + 2]]);
          }

          commitData.push({
            changeDescriptions:
              changeDescriptions !== null
                ? Array.from(changeDescriptions.entries())
                : null,
            duration: maxActualDuration,
            effectDuration,
            fiberActualDurations,
            fiberSelfDurations,
            passiveEffectDuration,
            priorityLevel,
            timestamp: commitTime,
            updaters,
          });
        });

        dataForRoots.push({
          commitData,
          displayName,
          initialTreeBaseDurations,
          rootID,
        });
      },
    );

    let timelineData = null;
    if (typeof getTimelineData === 'function') {
      const currentTimelineData = getTimelineData();
      if (currentTimelineData) {
        const {
          batchUIDToMeasuresMap,
          internalModuleSourceToRanges,
          laneToLabelMap,
          laneToReactMeasureMap,
          ...rest
        } = currentTimelineData;

        timelineData = {
          ...rest,

          // Most of the data is safe to parse as-is,
          // but we need to convert the nested Arrays back to Maps.
          // Most of the data is safe to serialize as-is,
          // but we need to convert the Maps to nested Arrays.
          batchUIDToMeasuresKeyValueArray: Array.from(
            batchUIDToMeasuresMap.entries(),
          ),
          internalModuleSourceToRanges: Array.from(
            internalModuleSourceToRanges.entries(),
          ),
          laneToLabelKeyValueArray: Array.from(laneToLabelMap.entries()),
          laneToReactMeasureKeyValueArray: Array.from(
            laneToReactMeasureMap.entries(),
          ),
        };
      }
    }

    return {
      dataForRoots,
      rendererID,
      timelineData,
    };
  }

  function startProfiling(shouldRecordChangeDescriptions: boolean) {
    if (isProfiling) {
      return;
    }

    recordChangeDescriptions = shouldRecordChangeDescriptions;

    // Capture initial values as of the time profiling starts.
    // It's important we snapshot both the durations and the id-to-root map,
    // since either of these may change during the profiling session
    // (e.g. when a fiber is re-rendered or when a fiber gets removed).
    displayNamesByRootID = new Map();
    initialTreeBaseDurationsMap = new Map(idToTreeBaseDurationMap);
    initialIDToRootMap = new Map(idToRootMap);
    idToContextsMap = new Map();

    hook.getFiberRoots(rendererID).forEach(root => {
      const rootID = getFiberIDThrows(root.current);
      ((displayNamesByRootID: any): DisplayNamesByRootID).set(
        rootID,
        getDisplayNameForRoot(root.current),
      );

      if (shouldRecordChangeDescriptions) {
        // Record all contexts at the time profiling is started.
        // Fibers only store the current context value,
        // so we need to track them separately in order to determine changed keys.
        crawlToInitializeContextsMap(root.current);
      }
    });

    isProfiling = true;
    profilingStartTime = getCurrentTime();
    rootToCommitProfilingMetadataMap = new Map();

    if (toggleProfilingStatus !== null) {
      toggleProfilingStatus(true);
    }
  }

  function stopProfiling() {
    isProfiling = false;
    recordChangeDescriptions = false;

    if (toggleProfilingStatus !== null) {
      toggleProfilingStatus(false);
    }
  }

  // Automatically start profiling so that we don't miss timing info from initial "mount".
  if (
    sessionStorageGetItem(SESSION_STORAGE_RELOAD_AND_PROFILE_KEY) === 'true'
  ) {
    startProfiling(
      sessionStorageGetItem(SESSION_STORAGE_RECORD_CHANGE_DESCRIPTIONS_KEY) ===
        'true',
    );
  }

  // React will switch between these implementations depending on whether
  // we have any manually suspended/errored-out Fibers or not.
  function shouldErrorFiberAlwaysNull() {
    return null;
  }

  // Map of id and its force error status: true (error), false (toggled off),
  // null (do nothing)
  const forceErrorForFiberIDs = new Map();

  function shouldErrorFiberAccordingToMap(fiber) {
    if (typeof setErrorHandler !== 'function') {
      throw new Error(
        'Expected overrideError() to not get called for earlier React versions.',
      );
    }

    const id = getFiberIDUnsafe(fiber);
    if (id === null) {
      return null;
    }

    let status = null;
    if (forceErrorForFiberIDs.has(id)) {
      status = forceErrorForFiberIDs.get(id);
      if (status === false) {
        // TRICKY overrideError adds entries to this Map,
        // so ideally it would be the method that clears them too,
        // but that would break the functionality of the feature,
        // since DevTools needs to tell React to act differently than it normally would
        // (don't just re-render the failed boundary, but reset its errored state too).
        // So we can only clear it after telling React to reset the state.
        // Technically this is premature and we should schedule it for later,
        // since the render could always fail without committing the updated error boundary,
        // but since this is a DEV-only feature, the simplicity is worth the trade off.
        forceErrorForFiberIDs.delete(id);

        if (forceErrorForFiberIDs.size === 0) {
          // Last override is gone. Switch React back to fast path.
          setErrorHandler(shouldErrorFiberAlwaysNull);
        }
      }
    }
    return status;
  }

  function overrideError(id, forceError) {
    if (
      typeof setErrorHandler !== 'function' ||
      typeof scheduleUpdate !== 'function'
    ) {
      throw new Error(
        'Expected overrideError() to not get called for earlier React versions.',
      );
    }

    forceErrorForFiberIDs.set(id, forceError);

    if (forceErrorForFiberIDs.size === 1) {
      // First override is added. Switch React to slower path.
      setErrorHandler(shouldErrorFiberAccordingToMap);
    }

    const fiber = idToArbitraryFiberMap.get(id);
    if (fiber != null) {
      scheduleUpdate(fiber);
    }
  }

  function shouldSuspendFiberAlwaysFalse() {
    return false;
  }

  const forceFallbackForSuspenseIDs = new Set();

  function shouldSuspendFiberAccordingToSet(fiber) {
    const maybeID = getFiberIDUnsafe(((fiber: any): Fiber));
    return maybeID !== null && forceFallbackForSuspenseIDs.has(maybeID);
  }

  function overrideSuspense(id, forceFallback) {
    if (
      typeof setSuspenseHandler !== 'function' ||
      typeof scheduleUpdate !== 'function'
    ) {
      throw new Error(
        'Expected overrideSuspense() to not get called for earlier React versions.',
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
    const fiber = idToArbitraryFiberMap.get(id);
    if (fiber != null) {
      scheduleUpdate(fiber);
    }
  }

  // Remember if we're trying to restore the selection after reload.
  // In that case, we'll do some extra checks for matching mounts.
  let trackedPath: Array<PathFrame> | null = null;
  let trackedPathMatchFiber: Fiber | null = null;
  let trackedPathMatchDepth = -1;
  let mightBeOnTrackedPath = false;

  function setTrackedPath(path: Array<PathFrame> | null) {
    if (path === null) {
      trackedPathMatchFiber = null;
      trackedPathMatchDepth = -1;
      mightBeOnTrackedPath = false;
    }
    trackedPath = path;
  }

  // We call this before traversing a new mount.
  // It remembers whether this Fiber is the next best match for tracked path.
  // The return value signals whether we should keep matching siblings or not.
  function updateTrackedPathStateBeforeMount(fiber: Fiber): boolean {
    if (trackedPath === null || !mightBeOnTrackedPath) {
      // Fast path: there's nothing to track so do nothing and ignore siblings.
      return false;
    }
    const returnFiber = fiber.return;
    const returnAlternate = returnFiber !== null ? returnFiber.alternate : null;
    // By now we know there's some selection to restore, and this is a new Fiber.
    // Is this newly mounted Fiber a direct child of the current best match?
    // (This will also be true for new roots if we haven't matched anything yet.)
    if (
      trackedPathMatchFiber === returnFiber ||
      (trackedPathMatchFiber === returnAlternate && returnAlternate !== null)
    ) {
      // Is this the next Fiber we should select? Let's compare the frames.
      const actualFrame = getPathFrame(fiber);
      const expectedFrame = trackedPath[trackedPathMatchDepth + 1];
      if (expectedFrame === undefined) {
        throw new Error('Expected to see a frame at the next depth.');
      }
      if (
        actualFrame.index === expectedFrame.index &&
        actualFrame.key === expectedFrame.key &&
        actualFrame.displayName === expectedFrame.displayName
      ) {
        // We have our next match.
        trackedPathMatchFiber = fiber;
        trackedPathMatchDepth++;
        // Are we out of frames to match?
        if (trackedPathMatchDepth === trackedPath.length - 1) {
          // There's nothing that can possibly match afterwards.
          // Don't check the children.
          mightBeOnTrackedPath = false;
        } else {
          // Check the children, as they might reveal the next match.
          mightBeOnTrackedPath = true;
        }
        // In either case, since we have a match, we don't need
        // to check the siblings. They'll never match.
        return false;
      }
    }
    // This Fiber's parent is on the path, but this Fiber itself isn't.
    // There's no need to check its children--they won't be on the path either.
    mightBeOnTrackedPath = false;
    // However, one of its siblings may be on the path so keep searching.
    return true;
  }

  function updateTrackedPathStateAfterMount(mightSiblingsBeOnTrackedPath) {
    // updateTrackedPathStateBeforeMount() told us whether to match siblings.
    // Now that we're entering siblings, let's use that information.
    mightBeOnTrackedPath = mightSiblingsBeOnTrackedPath;
  }

  // Roots don't have a real persistent identity.
  // A root's "pseudo key" is "childDisplayName:indexWithThatName".
  // For example, "App:0" or, in case of similar roots, "Story:0", "Story:1", etc.
  // We will use this to try to disambiguate roots when restoring selection between reloads.
  const rootPseudoKeys: Map<number, string> = new Map();
  const rootDisplayNameCounter: Map<string, number> = new Map();

  function setRootPseudoKey(id: number, fiber: Fiber) {
    const name = getDisplayNameForRoot(fiber);
    const counter = rootDisplayNameCounter.get(name) || 0;
    rootDisplayNameCounter.set(name, counter + 1);
    const pseudoKey = `${name}:${counter}`;
    rootPseudoKeys.set(id, pseudoKey);
  }

  function removeRootPseudoKey(id: number) {
    const pseudoKey = rootPseudoKeys.get(id);
    if (pseudoKey === undefined) {
      throw new Error('Expected root pseudo key to be known.');
    }
    const name = pseudoKey.substring(0, pseudoKey.lastIndexOf(':'));
    const counter = rootDisplayNameCounter.get(name);
    if (counter === undefined) {
      throw new Error('Expected counter to be known.');
    }
    if (counter > 1) {
      rootDisplayNameCounter.set(name, counter - 1);
    } else {
      rootDisplayNameCounter.delete(name);
    }
    rootPseudoKeys.delete(id);
  }

  function getDisplayNameForRoot(fiber: Fiber): string {
    let preferredDisplayName = null;
    let fallbackDisplayName = null;
    let child = fiber.child;
    // Go at most three levels deep into direct children
    // while searching for a child that has a displayName.
    for (let i = 0; i < 3; i++) {
      if (child === null) {
        break;
      }
      const displayName = getDisplayNameForFiber(child);
      if (displayName !== null) {
        // Prefer display names that we get from user-defined components.
        // We want to avoid using e.g. 'Suspense' unless we find nothing else.
        if (typeof child.type === 'function') {
          // There's a few user-defined tags, but we'll prefer the ones
          // that are usually explicitly named (function or class components).
          preferredDisplayName = displayName;
        } else if (fallbackDisplayName === null) {
          fallbackDisplayName = displayName;
        }
      }
      if (preferredDisplayName !== null) {
        break;
      }
      child = child.child;
    }
    return preferredDisplayName || fallbackDisplayName || 'Anonymous';
  }

  function getPathFrame(fiber: Fiber): PathFrame {
    const {key} = fiber;
    let displayName = getDisplayNameForFiber(fiber);
    const index = fiber.index;
    switch (fiber.tag) {
      case HostRoot:
        // Roots don't have a real displayName, index, or key.
        // Instead, we'll use the pseudo key (childDisplayName:indexWithThatName).
        const id = getFiberIDThrows(fiber);
        const pseudoKey = rootPseudoKeys.get(id);
        if (pseudoKey === undefined) {
          throw new Error('Expected mounted root to have known pseudo key.');
        }
        displayName = pseudoKey;
        break;
      case HostComponent:
        displayName = fiber.type;
        break;
      default:
        break;
    }
    return {
      displayName,
      key,
      index,
    };
  }

  // Produces a serializable representation that does a best effort
  // of identifying a particular Fiber between page reloads.
  // The return path will contain Fibers that are "invisible" to the store
  // because their keys and indexes are important to restoring the selection.
  function getPathForElement(id: number): Array<PathFrame> | null {
    let fiber = idToArbitraryFiberMap.get(id);
    if (fiber == null) {
      return null;
    }
    const keyPath = [];
    while (fiber !== null) {
      keyPath.push(getPathFrame(fiber));
      fiber = fiber.return;
    }
    keyPath.reverse();
    return keyPath;
  }

  function getBestMatchForTrackedPath(): PathMatch | null {
    if (trackedPath === null) {
      // Nothing to match.
      return null;
    }
    if (trackedPathMatchFiber === null) {
      // We didn't find anything.
      return null;
    }
    // Find the closest Fiber store is aware of.
    let fiber = trackedPathMatchFiber;
    while (fiber !== null && shouldFilterFiber(fiber)) {
      fiber = fiber.return;
    }
    if (fiber === null) {
      return null;
    }
    return {
      id: getFiberIDThrows(fiber),
      isFullMatch: trackedPathMatchDepth === trackedPath.length - 1,
    };
  }

  const formatPriorityLevel = (priorityLevel: ?number) => {
    if (priorityLevel == null) {
      return 'Unknown';
    }

    switch (priorityLevel) {
      case ImmediatePriority:
        return 'Immediate';
      case UserBlockingPriority:
        return 'User-Blocking';
      case NormalPriority:
        return 'Normal';
      case LowPriority:
        return 'Low';
      case IdlePriority:
        return 'Idle';
      case NoPriority:
      default:
        return 'Unknown';
    }
  };

  function setTraceUpdatesEnabled(isEnabled: boolean): void {
    traceUpdatesEnabled = isEnabled;
  }

  return {
    cleanup,
    clearErrorsAndWarnings,
    clearErrorsForFiberID,
    clearWarningsForFiberID,
    copyElementPath,
    deletePath,
    findNativeNodesForFiberID,
    flushInitialOperations,
    getBestMatchForTrackedPath,
    getDisplayNameForFiberID,
    getFiberIDForNative,
    getInstanceAndStyle,
    getOwnersList,
    getPathForElement,
    getProfilingData,
    handleCommitFiberRoot,
    handleCommitFiberUnmount,
    handlePostCommitFiberRoot,
    inspectElement,
    logElementToConsole,
    patchConsoleForStrictMode,
    prepareViewAttributeSource,
    prepareViewElementSource,
    overrideError,
    overrideSuspense,
    overrideValueAtPath,
    renamePath,
    renderer,
    setTraceUpdatesEnabled,
    setTrackedPath,
    startProfiling,
    stopProfiling,
    storeAsGlobal,
    unpatchConsoleForStrictMode,
    updateComponentFilters,
  };
}
