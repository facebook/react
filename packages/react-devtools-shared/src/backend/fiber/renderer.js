/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import type {ReactComponentInfo, ReactDebugInfo} from 'shared/ReactTypes';

import {
  ComponentFilterDisplayName,
  ComponentFilterElementType,
  ComponentFilterHOC,
  ComponentFilterLocation,
  ComponentFilterEnvironmentName,
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
  ElementTypeVirtual,
  StrictMode,
} from 'react-devtools-shared/src/frontend/types';
import {
  deletePathInObject,
  getDisplayName,
  getWrappedDisplayName,
  getDefaultComponentFilters,
  getInObject,
  getUID,
  renamePathInObject,
  setInObject,
  utfEncodeString,
  filterOutLocationComponentFilters,
} from 'react-devtools-shared/src/utils';
import {sessionStorageGetItem} from 'react-devtools-shared/src/storage';
import {
  formatConsoleArgumentsToSingleString,
  gt,
  gte,
  parseSourceFromComponentStack,
  serializeToString,
} from 'react-devtools-shared/src/backend/utils';
import {
  cleanForBridge,
  copyWithDelete,
  copyWithRename,
  copyWithSet,
  getEffectDurations,
} from '../utils';
import {
  __DEBUG__,
  PROFILING_FLAG_BASIC_SUPPORT,
  PROFILING_FLAG_TIMELINE_SUPPORT,
  SESSION_STORAGE_RELOAD_AND_PROFILE_KEY,
  SESSION_STORAGE_RECORD_CHANGE_DESCRIPTIONS_KEY,
  TREE_OPERATION_ADD,
  TREE_OPERATION_REMOVE,
  TREE_OPERATION_REORDER_CHILDREN,
  TREE_OPERATION_SET_SUBTREE_MODE,
  TREE_OPERATION_UPDATE_ERRORS_OR_WARNINGS,
  TREE_OPERATION_UPDATE_TREE_BASE_DURATION,
} from '../../constants';
import {inspectHooksOfFiber} from 'react-debug-tools';
import {
  patchConsoleUsingWindowValues,
  registerRenderer as registerRendererWithConsole,
  patchForStrictMode as patchConsoleForStrictMode,
  unpatchForStrictMode as unpatchConsoleForStrictMode,
} from '../console';
import {
  CONCURRENT_MODE_NUMBER,
  CONCURRENT_MODE_SYMBOL_STRING,
  DEPRECATED_ASYNC_MODE_SYMBOL_STRING,
  PROVIDER_NUMBER,
  PROVIDER_SYMBOL_STRING,
  CONTEXT_NUMBER,
  CONTEXT_SYMBOL_STRING,
  CONSUMER_SYMBOL_STRING,
  STRICT_MODE_NUMBER,
  STRICT_MODE_SYMBOL_STRING,
  PROFILER_NUMBER,
  PROFILER_SYMBOL_STRING,
  REACT_MEMO_CACHE_SENTINEL,
  SCOPE_NUMBER,
  SCOPE_SYMBOL_STRING,
  FORWARD_REF_NUMBER,
  FORWARD_REF_SYMBOL_STRING,
  MEMO_NUMBER,
  MEMO_SYMBOL_STRING,
  SERVER_CONTEXT_SYMBOL_STRING,
} from '../shared/ReactSymbols';
import {enableStyleXFeatures} from 'react-devtools-feature-flags';
import is from 'shared/objectIs';
import hasOwnProperty from 'shared/hasOwnProperty';

// $FlowFixMe[method-unbinding]
const toString = Object.prototype.toString;

function isError(object: mixed) {
  return toString.call(object) === '[object Error]';
}

import {getStyleXData} from '../StyleX/utils';
import {createProfilingHooks} from '../profilingHooks';

import type {GetTimelineData, ToggleProfilingStatus} from '../profilingHooks';
import type {Fiber, FiberRoot} from 'react-reconciler/src/ReactInternalTypes';
import type {
  ChangeDescription,
  CommitDataBackend,
  DevToolsHook,
  InspectedElement,
  InspectedElementPayload,
  InstanceAndStyle,
  HostInstance,
  PathFrame,
  PathMatch,
  ProfilingDataBackend,
  ProfilingDataForRootBackend,
  ReactRenderer,
  RendererInterface,
  SerializedElement,
  WorkTagMap,
  CurrentDispatcherRef,
  LegacyDispatcherRef,
} from '../types';
import type {
  ComponentFilter,
  ElementType,
  Plugins,
} from 'react-devtools-shared/src/frontend/types';
import type {Source} from 'react-devtools-shared/src/shared/types';
import {getSourceLocationByFiber} from './DevToolsFiberComponentStack';
import {formatOwnerStack} from '../shared/DevToolsOwnerStack';

// Kinds
const FIBER_INSTANCE = 0;
const VIRTUAL_INSTANCE = 1;

// Flags
const FORCE_SUSPENSE_FALLBACK = /*    */ 0b001;
const FORCE_ERROR = /*                */ 0b010;
const FORCE_ERROR_RESET = /*          */ 0b100;

// This type represents a stateful instance of a Client Component i.e. a Fiber pair.
// These instances also let us track stateful DevTools meta data like id and warnings.
type FiberInstance = {
  kind: 0,
  id: number,
  parent: null | DevToolsInstance, // filtered parent, including virtual
  firstChild: null | DevToolsInstance, // filtered first child, including virtual
  nextSibling: null | DevToolsInstance, // filtered next sibling, including virtual
  flags: number, // Force Error/Suspense
  source: null | string | Error | Source, // source location of this component function, or owned child stack
  errors: null | Map<string, number>, // error messages and count
  warnings: null | Map<string, number>, // warning messages and count
  treeBaseDuration: number, // the profiled time of the last render of this subtree
  data: Fiber, // one of a Fiber pair
};

function createFiberInstance(fiber: Fiber): FiberInstance {
  return {
    kind: FIBER_INSTANCE,
    id: getUID(),
    parent: null,
    firstChild: null,
    nextSibling: null,
    flags: 0,
    source: null,
    errors: null,
    warnings: null,
    treeBaseDuration: 0,
    data: fiber,
  };
}

// This type represents a stateful instance of a Server Component or a Component
// that gets optimized away - e.g. call-through without creating a Fiber.
// It's basically a virtual Fiber. This is not a semantic concept in React.
// It only exists as a virtual concept to let the same Element in the DevTools
// persist. To be selectable separately from all ReactComponentInfo and overtime.
type VirtualInstance = {
  kind: 1,
  id: number,
  parent: null | DevToolsInstance, // filtered parent, including virtual
  firstChild: null | DevToolsInstance, // filtered first child, including virtual
  nextSibling: null | DevToolsInstance, // filtered next sibling, including virtual
  flags: number,
  source: null | string | Error | Source, // source location of this server component, or owned child stack
  // Errors and Warnings happen per ReactComponentInfo which can appear in
  // multiple places but we track them per stateful VirtualInstance so
  // that old errors/warnings don't disappear when the instance is refreshed.
  errors: null | Map<string, number>, // error messages and count
  warnings: null | Map<string, number>, // warning messages and count
  treeBaseDuration: number, // the profiled time of the last render of this subtree
  // The latest info for this instance. This can be updated over time and the
  // same info can appear in more than once ServerComponentInstance.
  data: ReactComponentInfo,
};

function createVirtualInstance(
  debugEntry: ReactComponentInfo,
): VirtualInstance {
  return {
    kind: VIRTUAL_INSTANCE,
    id: getUID(),
    parent: null,
    firstChild: null,
    nextSibling: null,
    flags: 0,
    source: null,
    errors: null,
    warnings: null,
    treeBaseDuration: 0,
    data: debugEntry,
  };
}

type DevToolsInstance = FiberInstance | VirtualInstance;

type getDisplayNameForFiberType = (fiber: Fiber) => string | null;
type getTypeSymbolType = (type: any) => symbol | number;

type ReactPriorityLevelsType = {
  ImmediatePriority: number,
  UserBlockingPriority: number,
  NormalPriority: number,
  LowPriority: number,
  IdlePriority: number,
  NoPriority: number,
};

export function getDispatcherRef(renderer: {
  +currentDispatcherRef?: LegacyDispatcherRef | CurrentDispatcherRef,
  ...
}): void | CurrentDispatcherRef {
  if (renderer.currentDispatcherRef === undefined) {
    return undefined;
  }
  const injectedRef = renderer.currentDispatcherRef;
  if (
    typeof injectedRef.H === 'undefined' &&
    typeof injectedRef.current !== 'undefined'
  ) {
    // We got a legacy dispatcher injected, let's create a wrapper proxy to translate.
    return {
      get H() {
        return (injectedRef: any).current;
      },
      set H(value) {
        (injectedRef: any).current = value;
      },
    };
  }
  return (injectedRef: any);
}

function getFiberFlags(fiber: Fiber): number {
  // The name of this field changed from "effectTag" to "flags"
  return fiber.flags !== undefined ? fiber.flags : (fiber: any).effectTag;
}

// Some environments (e.g. React Native / Hermes) don't support the performance API yet.
const getCurrentTime =
  // $FlowFixMe[method-unbinding]
  typeof performance === 'object' && typeof performance.now === 'function'
    ? () => performance.now()
    : () => Date.now();

export function getInternalReactConstants(version: string): {
  getDisplayNameForFiber: getDisplayNameForFiberType,
  getTypeSymbol: getTypeSymbolType,
  ReactPriorityLevels: ReactPriorityLevelsType,
  ReactTypeOfWork: WorkTagMap,
  StrictModeBits: number,
} {
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
      HostHoistable: 26, // In reality, 18.2+. But doesn't hurt to include it here
      HostSingleton: 27, // Same as above
      HostText: 6,
      IncompleteClassComponent: 17,
      IncompleteFunctionComponent: 28,
      IndeterminateComponent: 2, // removed in 19.0.0
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
      Throw: 29,
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
      HostHoistable: -1, // Doesn't exist yet
      HostSingleton: -1, // Doesn't exist yet
      HostText: 6,
      IncompleteClassComponent: 17,
      IncompleteFunctionComponent: -1, // Doesn't exist yet
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
      Throw: -1, // Doesn't exist yet
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
      HostHoistable: -1, // Doesn't exist yet
      HostSingleton: -1, // Doesn't exist yet
      HostText: 6,
      IncompleteClassComponent: 17,
      IncompleteFunctionComponent: -1, // Doesn't exist yet
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
      Throw: -1, // Doesn't exist yet
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
      HostHoistable: -1, // Doesn't exist yet
      HostSingleton: -1, // Doesn't exist yet
      HostText: 8,
      IncompleteClassComponent: -1, // Doesn't exist yet
      IncompleteFunctionComponent: -1, // Doesn't exist yet
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
      Throw: -1, // Doesn't exist yet
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
      HostHoistable: -1, // Doesn't exist yet
      HostSingleton: -1, // Doesn't exist yet
      HostText: 6,
      IncompleteClassComponent: -1, // Doesn't exist yet
      IncompleteFunctionComponent: -1, // Doesn't exist yet
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
      Throw: -1, // Doesn't exist yet
    };
  }
  // **********************************************************
  // End of copied code.
  // **********************************************************

  function getTypeSymbol(type: any): symbol | number {
    const symbolOrNumber =
      typeof type === 'object' && type !== null ? type.$$typeof : type;

    return typeof symbolOrNumber === 'symbol'
      ? // $FlowFixMe[incompatible-return] `toString()` doesn't match the type signature?
        symbolOrNumber.toString()
      : symbolOrNumber;
  }

  const {
    CacheComponent,
    ClassComponent,
    IncompleteClassComponent,
    IncompleteFunctionComponent,
    FunctionComponent,
    IndeterminateComponent,
    ForwardRef,
    HostRoot,
    HostHoistable,
    HostSingleton,
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
    Throw,
  } = ReactTypeOfWork;

  function resolveFiberType(type: any): $FlowFixMe {
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
  function getDisplayNameForFiber(
    fiber: Fiber,
    shouldSkipForgetCheck: boolean = false,
  ): string | null {
    const {elementType, type, tag} = fiber;

    let resolvedType = type;
    if (typeof type === 'object' && type !== null) {
      resolvedType = resolveFiberType(type);
    }

    let resolvedContext: any = null;
    if (
      !shouldSkipForgetCheck &&
      // $FlowFixMe[incompatible-type] fiber.updateQueue is mixed
      (fiber.updateQueue?.memoCache != null ||
        fiber.memoizedState?.memoizedState?.[REACT_MEMO_CACHE_SENTINEL])
    ) {
      const displayNameWithoutForgetWrapper = getDisplayNameForFiber(
        fiber,
        true,
      );
      if (displayNameWithoutForgetWrapper == null) {
        return null;
      }

      return `Forget(${displayNameWithoutForgetWrapper})`;
    }

    switch (tag) {
      case CacheComponent:
        return 'Cache';
      case ClassComponent:
      case IncompleteClassComponent:
      case IncompleteFunctionComponent:
      case FunctionComponent:
      case IndeterminateComponent:
        return getDisplayName(resolvedType);
      case ForwardRef:
        return getWrappedDisplayName(
          elementType,
          resolvedType,
          'ForwardRef',
          'Anonymous',
        );
      case HostRoot:
        const fiberRoot = fiber.stateNode;
        if (fiberRoot != null && fiberRoot._debugRootType !== null) {
          return fiberRoot._debugRootType;
        }
        return null;
      case HostComponent:
      case HostSingleton:
      case HostHoistable:
        return type;
      case HostPortal:
      case HostText:
        return null;
      case Fragment:
        return 'Fragment';
      case LazyComponent:
        // This display name will not be user visible.
        // Once a Lazy component loads its inner component, React replaces the tag and type.
        // This display name will only show up in console logs when DevTools DEBUG mode is on.
        return 'Lazy';
      case MemoComponent:
      case SimpleMemoComponent:
        // Display name in React does not use `Memo` as a wrapper but fallback name.
        return getWrappedDisplayName(
          elementType,
          resolvedType,
          'Memo',
          'Anonymous',
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
      case Throw:
        // This should really never be visible.
        return 'Error';
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
            if (
              fiber.type._context === undefined &&
              fiber.type.Provider === fiber.type
            ) {
              // In 19+, Context.Provider === Context, so this is a provider.
              resolvedContext = fiber.type;
              return `${resolvedContext.displayName || 'Context'}.Provider`;
            }

            // 16.3-16.5 read from "type" because the Consumer is the actual context object.
            // 16.6+ should read from "type._context" because Consumer can be different (in DEV).
            // NOTE Keep in sync with inspectElementRaw()
            resolvedContext = fiber.type._context || fiber.type;

            // NOTE: TraceUpdatesBackendManager depends on the name ending in '.Consumer'
            // If you change the name, figure out a more resilient way to detect it.
            return `${resolvedContext.displayName || 'Context'}.Consumer`;
          case CONSUMER_SYMBOL_STRING:
            // 19+
            resolvedContext = fiber.type._context;
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
    StrictModeBits,
  };
}

// All environment names we've seen so far. This lets us create a list of filters to apply.
// This should ideally include env of filtered Components too so that you can add those as
// filters at the same time as removing some other filter.
const knownEnvironmentNames: Set<string> = new Set();

// Map of FiberRoot to their root FiberInstance.
const rootToFiberInstanceMap: Map<FiberRoot, FiberInstance> = new Map();

// Map of one or more Fibers in a pair to their unique id number.
// We track both Fibers to support Fast Refresh,
// which may forcefully replace one of the pair as part of hot reloading.
// In that case it's still important to be able to locate the previous ID during subsequent renders.
const fiberToFiberInstanceMap: Map<Fiber, FiberInstance> = new Map();

// Map of id to one (arbitrary) Fiber in a pair.
// This Map is used to e.g. get the display name for a Fiber or schedule an update,
// operations that should be the same whether the current and work-in-progress Fiber is used.
const idToDevToolsInstanceMap: Map<number, DevToolsInstance> = new Map();

// Map of canonical HostInstances to the nearest parent DevToolsInstance.
const publicInstanceToDevToolsInstanceMap: Map<HostInstance, DevToolsInstance> =
  new Map();
// Map of resource DOM nodes to all the nearest DevToolsInstances that depend on it.
const hostResourceToDevToolsInstanceMap: Map<
  HostInstance,
  Set<DevToolsInstance>,
> = new Map();

function getPublicInstance(instance: HostInstance): HostInstance {
  // Typically the PublicInstance and HostInstance is the same thing but not in Fabric.
  // So we need to detect this and use that as the public instance.
  return typeof instance === 'object' &&
    instance !== null &&
    typeof instance.canonical === 'object'
    ? (instance.canonical: any)
    : typeof instance._nativeTag === 'number'
      ? instance._nativeTag
      : instance;
}

function aquireHostInstance(
  nearestInstance: DevToolsInstance,
  hostInstance: HostInstance,
): void {
  const publicInstance = getPublicInstance(hostInstance);
  publicInstanceToDevToolsInstanceMap.set(publicInstance, nearestInstance);
}

function releaseHostInstance(
  nearestInstance: DevToolsInstance,
  hostInstance: HostInstance,
): void {
  const publicInstance = getPublicInstance(hostInstance);
  if (
    publicInstanceToDevToolsInstanceMap.get(publicInstance) === nearestInstance
  ) {
    publicInstanceToDevToolsInstanceMap.delete(publicInstance);
  }
}

function aquireHostResource(
  nearestInstance: DevToolsInstance,
  resource: ?{instance?: HostInstance},
): void {
  const hostInstance = resource && resource.instance;
  if (hostInstance) {
    const publicInstance = getPublicInstance(hostInstance);
    let resourceInstances =
      hostResourceToDevToolsInstanceMap.get(publicInstance);
    if (resourceInstances === undefined) {
      resourceInstances = new Set();
      hostResourceToDevToolsInstanceMap.set(publicInstance, resourceInstances);
      // Store the first match in the main map for quick access when selecting DOM node.
      publicInstanceToDevToolsInstanceMap.set(publicInstance, nearestInstance);
    }
    resourceInstances.add(nearestInstance);
  }
}

function releaseHostResource(
  nearestInstance: DevToolsInstance,
  resource: ?{instance?: HostInstance},
): void {
  const hostInstance = resource && resource.instance;
  if (hostInstance) {
    const publicInstance = getPublicInstance(hostInstance);
    const resourceInstances =
      hostResourceToDevToolsInstanceMap.get(publicInstance);
    if (resourceInstances !== undefined) {
      resourceInstances.delete(nearestInstance);
      if (resourceInstances.size === 0) {
        hostResourceToDevToolsInstanceMap.delete(publicInstance);
        publicInstanceToDevToolsInstanceMap.delete(publicInstance);
      } else if (
        publicInstanceToDevToolsInstanceMap.get(publicInstance) ===
        nearestInstance
      ) {
        // This was the first one. Store the next first one in the main map for easy access.
        // eslint-disable-next-line no-for-of-loops/no-for-of-loops
        for (const firstInstance of resourceInstances) {
          publicInstanceToDevToolsInstanceMap.set(
            firstInstance,
            nearestInstance,
          );
          break;
        }
      }
    }
  }
}

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
    StrictModeBits,
  } = getInternalReactConstants(version);
  const {
    CacheComponent,
    ClassComponent,
    ContextConsumer,
    DehydratedSuspenseComponent,
    ForwardRef,
    Fragment,
    FunctionComponent,
    HostRoot,
    HostHoistable,
    HostSingleton,
    HostPortal,
    HostComponent,
    HostText,
    IncompleteClassComponent,
    IncompleteFunctionComponent,
    IndeterminateComponent,
    LegacyHiddenComponent,
    MemoComponent,
    OffscreenComponent,
    SimpleMemoComponent,
    SuspenseComponent,
    SuspenseListComponent,
    TracingMarkerComponent,
    Throw,
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
      currentDispatcherRef: getDispatcherRef(renderer),
      workTagMap: ReactTypeOfWork,
      reactVersion: version,
    });

    // Pass the Profiling hooks to the reconciler for it to call during render.
    injectProfilingHooks(response.profilingHooks);

    // Hang onto this toggle so we can notify the external methods of profiling status changes.
    getTimelineData = response.getTimelineData;
    toggleProfilingStatus = response.toggleProfilingStatus;
  }

  // Tracks Fibers with recently changed number of error/warning messages.
  // These collections store the Fiber rather than the DevToolsInstance,
  // in order to avoid generating an DevToolsInstance for Fibers that never get mounted
  // (due to e.g. Suspense or error boundaries).
  // onErrorOrWarning() adds Fibers and recordPendingErrorsAndWarnings() later clears them.
  const fibersWithChangedErrorOrWarningCounts: Set<Fiber> = new Set();
  const pendingFiberToErrorsMap: WeakMap<
    Fiber,
    Map<string, number>,
  > = new WeakMap();
  const pendingFiberToWarningsMap: WeakMap<
    Fiber,
    Map<string, number>,
  > = new WeakMap();

  function clearErrorsAndWarnings() {
    // eslint-disable-next-line no-for-of-loops/no-for-of-loops
    for (const devtoolsInstance of idToDevToolsInstanceMap.values()) {
      devtoolsInstance.errors = null;
      devtoolsInstance.warnings = null;
      if (devtoolsInstance.kind === FIBER_INSTANCE) {
        fibersWithChangedErrorOrWarningCounts.add(devtoolsInstance.data);
      } else {
        // TODO: Handle VirtualInstance.
      }
      updateMostRecentlyInspectedElementIfNecessary(devtoolsInstance.id);
    }
    flushPendingEvents();
  }

  function clearMessageCountHelper(
    instanceID: number,
    pendingFiberToMessageCountMap: WeakMap<Fiber, Map<string, number>>,
    forError: boolean,
  ) {
    const devtoolsInstance = idToDevToolsInstanceMap.get(instanceID);
    if (devtoolsInstance !== undefined) {
      let changed = false;
      if (forError) {
        if (
          devtoolsInstance.errors !== null &&
          devtoolsInstance.errors.size > 0
        ) {
          changed = true;
        }
        devtoolsInstance.errors = null;
      } else {
        if (
          devtoolsInstance.warnings !== null &&
          devtoolsInstance.warnings.size > 0
        ) {
          changed = true;
        }
        devtoolsInstance.warnings = null;
      }
      if (devtoolsInstance.kind === FIBER_INSTANCE) {
        const fiber = devtoolsInstance.data;
        // Throw out any pending changes.
        pendingFiberToMessageCountMap.delete(fiber);

        if (changed) {
          // If previous flushed counts have changed, schedule an update too.
          fibersWithChangedErrorOrWarningCounts.add(fiber);
          flushPendingEvents();

          updateMostRecentlyInspectedElementIfNecessary(instanceID);
        } else {
          fibersWithChangedErrorOrWarningCounts.delete(fiber);
        }
      } else {
        // TODO: Handle VirtualInstance.
      }
    }
  }

  function clearErrorsForElementID(instanceID: number) {
    clearMessageCountHelper(instanceID, pendingFiberToErrorsMap, true);
  }

  function clearWarningsForElementID(instanceID: number) {
    clearMessageCountHelper(instanceID, pendingFiberToWarningsMap, false);
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
      let fiberInstance = fiberToFiberInstanceMap.get(fiber);
      if (fiberInstance === undefined && fiber.alternate !== null) {
        fiberInstance = fiberToFiberInstanceMap.get(fiber.alternate);
      }
      // if this is an error simulated by us to trigger error boundary, ignore
      if (fiberInstance !== undefined && fiberInstance.flags & FORCE_ERROR) {
        return;
      }
    }

    // We can't really use this message as a unique key, since we can't distinguish
    // different objects in this implementation. We have to delegate displaying of the objects
    // to the environment, the browser console, for example, so this is why this should be kept
    // as an array of arguments, instead of the plain string.
    // [Warning: %o, {...}] and [Warning: %o, {...}] will be considered as the same message,
    // even if objects are different
    const message = formatConsoleArgumentsToSingleString(...args);
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
  registerRendererWithConsole(renderer, onErrorOrWarning);

  // The renderer interface can't read these preferences directly,
  // because it is stored in localStorage within the context of the extension.
  // It relies on the extension to pass the preference through via the global.
  patchConsoleUsingWindowValues();

  const debug = (
    name: string,
    fiber: Fiber,
    parentInstance: null | DevToolsInstance,
    extraString: string = '',
  ): void => {
    if (__DEBUG__) {
      const displayName =
        fiber.tag + ':' + (getDisplayNameForFiber(fiber) || 'null');

      const maybeID = getFiberIDUnsafe(fiber) || '<no id>';

      let parentDisplayName;
      let maybeParentID;
      if (parentInstance !== null && parentInstance.kind === FIBER_INSTANCE) {
        const parentFiber = parentInstance.data;
        parentDisplayName =
          parentFiber.tag +
          ':' +
          (getDisplayNameForFiber(parentFiber) || 'null');
        maybeParentID = String(parentInstance.id);
      } else {
        // TODO: Handle VirtualInstance
        parentDisplayName = '';
        maybeParentID = '<no-id>';
      }

      console.groupCollapsed(
        `[renderer] %c${name} %c${displayName} (${maybeID}) %c${
          parentInstance ? `${parentDisplayName} (${maybeParentID})` : ''
        } %c${extraString}`,
        'color: red; font-weight: bold;',
        'color: blue;',
        'color: purple;',
        'color: black;',
      );
      console.log(new Error().stack.split('\n').slice(1).join('\n'));
      console.groupEnd();
    }
  };

  // eslint-disable-next-line no-unused-vars
  function debugTree(instance: DevToolsInstance, indent: number = 0) {
    if (__DEBUG__) {
      const name =
        (instance.kind === FIBER_INSTANCE
          ? getDisplayNameForFiber(instance.data)
          : instance.data.name) || '';
      console.log(
        '  '.repeat(indent) + '- ' + instance.id + ' (' + name + ')',
        'parent',
        instance.parent === null ? ' ' : instance.parent.id,
        'next',
        instance.nextSibling === null ? ' ' : instance.nextSibling.id,
      );
      let child = instance.firstChild;
      while (child !== null) {
        debugTree(child, indent + 1);
        child = child.nextSibling;
      }
    }
  }

  // Configurable Components tree filters.
  const hideElementsWithDisplayNames: Set<RegExp> = new Set();
  const hideElementsWithPaths: Set<RegExp> = new Set();
  const hideElementsWithTypes: Set<ElementType> = new Set();
  const hideElementsWithEnvs: Set<string> = new Set();

  // Highlight updates
  let traceUpdatesEnabled: boolean = false;
  const traceUpdatesForNodes: Set<HostInstance> = new Set();

  function applyComponentFilters(componentFilters: Array<ComponentFilter>) {
    hideElementsWithTypes.clear();
    hideElementsWithDisplayNames.clear();
    hideElementsWithPaths.clear();
    hideElementsWithEnvs.clear();

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
        case ComponentFilterEnvironmentName:
          hideElementsWithEnvs.add(componentFilter.value);
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
    const componentFiltersWithoutLocationBasedOnes =
      filterOutLocationComponentFilters(
        window.__REACT_DEVTOOLS_COMPONENT_FILTERS__,
      );
    applyComponentFilters(componentFiltersWithoutLocationBasedOnes);
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
      const rootInstance = rootToFiberInstanceMap.get(root);
      if (rootInstance === undefined) {
        throw new Error(
          'Expected the root instance to already exist when applying filters',
        );
      }
      currentRootID = rootInstance.id;
      unmountInstanceRecursively(rootInstance);
      rootToFiberInstanceMap.delete(root);
      flushPendingEvents(root);
      currentRootID = -1;
    });

    applyComponentFilters(componentFilters);

    // Reset pseudo counters so that new path selections will be persisted.
    rootDisplayNameCounter.clear();

    // Recursively re-mount all roots with new filter criteria applied.
    hook.getFiberRoots(rendererID).forEach(root => {
      const current = root.current;
      const alternate = current.alternate;
      const newRoot = createFiberInstance(current);
      rootToFiberInstanceMap.set(root, newRoot);
      idToDevToolsInstanceMap.set(newRoot.id, newRoot);
      fiberToFiberInstanceMap.set(current, newRoot);
      if (alternate) {
        fiberToFiberInstanceMap.set(alternate, newRoot);
      }

      // Before the traversals, remember to start tracking
      // our path in case we have selection to restore.
      if (trackedPath !== null) {
        mightBeOnTrackedPath = true;
      }

      currentRootID = newRoot.id;
      setRootPseudoKey(currentRootID, root.current);
      mountFiberRecursively(root.current, false);
      flushPendingEvents(root);
      currentRootID = -1;
    });

    // Also re-evaluate all error and warning counts given the new filters.
    reevaluateErrorsAndWarnings();
    flushPendingEvents();
  }

  function getEnvironmentNames(): Array<string> {
    return Array.from(knownEnvironmentNames);
  }

  function shouldFilterVirtual(
    data: ReactComponentInfo,
    secondaryEnv: null | string,
  ): boolean {
    // For purposes of filtering Server Components are always Function Components.
    // Environment will be used to filter Server vs Client.
    // Technically they can be forwardRef and memo too but those filters will go away
    // as those become just plain user space function components like any HoC.
    if (hideElementsWithTypes.has(ElementTypeFunction)) {
      return true;
    }

    if (hideElementsWithDisplayNames.size > 0) {
      const displayName = data.name;
      if (displayName != null) {
        // eslint-disable-next-line no-for-of-loops/no-for-of-loops
        for (const displayNameRegExp of hideElementsWithDisplayNames) {
          if (displayNameRegExp.test(displayName)) {
            return true;
          }
        }
      }
    }

    if (
      (data.env == null || hideElementsWithEnvs.has(data.env)) &&
      (secondaryEnv === null || hideElementsWithEnvs.has(secondaryEnv))
    ) {
      // If a Component has two environments, you have to filter both for it not to appear.
      return true;
    }

    return false;
  }

  // NOTICE Keep in sync with get*ForFiber methods
  function shouldFilterFiber(fiber: Fiber): boolean {
    const {tag, type, key} = fiber;

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
      case LegacyHiddenComponent:
      case OffscreenComponent:
      case Throw:
        return true;
      case HostRoot:
        // It is never valid to filter the root element.
        return false;
      case Fragment:
        return key === null;
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

    if (hideElementsWithEnvs.has('Client')) {
      // If we're filtering out the Client environment we should filter out all
      // "Client Components". Technically that also includes the built-ins but
      // since that doesn't actually include any additional code loading it's
      // useful to not filter out the built-ins. Those can be filtered separately.
      // There's no other way to filter out just Function components on the Client.
      // Therefore, this only filters Class and Function components.
      switch (tag) {
        case ClassComponent:
        case IncompleteClassComponent:
        case IncompleteFunctionComponent:
        case FunctionComponent:
        case IndeterminateComponent:
        case ForwardRef:
        case MemoComponent:
        case SimpleMemoComponent:
          return true;
      }
    }

    /* DISABLED: https://github.com/facebook/react/pull/28417
    if (hideElementsWithPaths.size > 0) {
      const source = getSourceForFiber(fiber);

      if (source != null) {
        const {fileName} = source;
        // eslint-disable-next-line no-for-of-loops/no-for-of-loops
        for (const pathRegExp of hideElementsWithPaths) {
          if (pathRegExp.test(fileName)) {
            return true;
          }
        }
      }
    }
    */

    return false;
  }

  // NOTICE Keep in sync with shouldFilterFiber() and other get*ForFiber methods
  function getElementTypeForFiber(fiber: Fiber): ElementType {
    const {type, tag} = fiber;

    switch (tag) {
      case ClassComponent:
      case IncompleteClassComponent:
        return ElementTypeClass;
      case IncompleteFunctionComponent:
      case FunctionComponent:
      case IndeterminateComponent:
        return ElementTypeFunction;
      case ForwardRef:
        return ElementTypeForwardRef;
      case HostRoot:
        return ElementTypeRoot;
      case HostComponent:
      case HostHoistable:
      case HostSingleton:
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

  // When a mount or update is in progress, this value tracks the root that is being operated on.
  let currentRootID: number = -1;

  function getFiberIDThrows(fiber: Fiber): number {
    const fiberInstance = getFiberInstanceUnsafe(fiber);
    if (fiberInstance !== null) {
      return fiberInstance.id;
    }
    throw Error(
      `Could not find ID for Fiber "${getDisplayNameForFiber(fiber) || ''}"`,
    );
  }

  // Returns a FiberInstance if one has already been generated for the Fiber or null if one has not been generated.
  // Use this method while e.g. logging to avoid over-retaining Fibers.
  function getFiberInstanceUnsafe(fiber: Fiber): FiberInstance | null {
    const fiberInstance = fiberToFiberInstanceMap.get(fiber);
    if (fiberInstance !== undefined) {
      return fiberInstance;
    } else {
      const {alternate} = fiber;
      if (alternate !== null) {
        const alternateInstance = fiberToFiberInstanceMap.get(alternate);
        if (alternateInstance !== undefined) {
          return alternateInstance;
        }
      }
    }
    return null;
  }

  function getFiberIDUnsafe(fiber: Fiber): number | null {
    const fiberInstance = getFiberInstanceUnsafe(fiber);
    return fiberInstance === null ? null : fiberInstance.id;
  }

  // Removes a Fiber (and its alternate) from the Maps used to track their id.
  // This method should always be called when a Fiber is unmounting.
  function untrackFiber(nearestInstance: DevToolsInstance, fiber: Fiber) {
    if (__DEBUG__) {
      debug('untrackFiber()', fiber, null);
    }
    // TODO: Consider using a WeakMap instead. The only thing where that doesn't work
    // is React Native Paper which tracks tags but that support is eventually going away
    // and can use the old findFiberByHostInstance strategy.

    if (fiber.tag === HostHoistable) {
      releaseHostResource(nearestInstance, fiber.memoizedState);
    } else if (
      fiber.tag === HostComponent ||
      fiber.tag === HostText ||
      fiber.tag === HostSingleton
    ) {
      releaseHostInstance(nearestInstance, fiber.stateNode);
    }

    // Recursively clean up any filtered Fibers below this one as well since
    // we won't recordUnmount on those.
    for (let child = fiber.child; child !== null; child = child.sibling) {
      if (shouldFilterFiber(child)) {
        untrackFiber(nearestInstance, child);
      }
    }
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
          const indices = getChangedHooksIndices(
            prevFiber.memoizedState,
            nextFiber.memoizedState,
          );
          data.hooks = indices;
          data.didHooksChange = indices !== null && indices.length > 0;

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
            // $FlowFixMe[incompatible-use] found when upgrading Flow
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
      // $FlowFixMe[incompatible-use] found when upgrading Flow
      const prevContexts = idToContextsMap.has(id)
        ? // $FlowFixMe[incompatible-use] found when upgrading Flow
          idToContextsMap.get(id)
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

    // Detect the shape of useState() / useReducer() / useTransition()
    // using the attributes that are unique to these hooks
    // but also stable (e.g. not tied to current Lanes implementation)
    // We don't check for dispatch property, because useTransition doesn't have it
    if (boundHasOwnProperty('pending')) {
      return true;
    }

    // Detect useSyncExternalStore()
    return (
      boundHasOwnProperty('value') &&
      boundHasOwnProperty('getSnapshot') &&
      typeof queue.getSnapshot === 'function'
    );
  }

  function didStatefulHookChange(prev: any, next: any): boolean {
    const prevMemoizedState = prev.memoizedState;
    const nextMemoizedState = next.memoizedState;

    if (isHookThatCanScheduleUpdate(prev)) {
      return prevMemoizedState !== nextMemoizedState;
    }

    return false;
  }

  function getChangedHooksIndices(prev: any, next: any): null | Array<number> {
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
        // TODO: This flag is a leaked implementation detail. Once we start
        // releasing DevTools in lockstep with React, we should import a
        // function from the reconciler instead.
        const PerformedWork = 0b000000000000000000000000001;
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

  type StringTableEntry = {
    encodedString: Array<number>,
    id: number,
  };

  const pendingOperations: OperationsArray = [];
  const pendingRealUnmountedIDs: Array<number> = [];
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

  let flushPendingErrorsAndWarningsAfterDelayTimeoutID: null | TimeoutID = null;

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
    // eslint-disable-next-line no-for-of-loops/no-for-of-loops
    for (const devtoolsInstance of idToDevToolsInstanceMap.values()) {
      if (devtoolsInstance.kind === FIBER_INSTANCE) {
        fibersWithChangedErrorOrWarningCounts.add(devtoolsInstance.data);
      } else {
        // TODO: Handle VirtualInstance.
      }
    }
    recordPendingErrorsAndWarnings();
  }

  function mergeMapsAndGetCountHelper(
    fiber: Fiber,
    fiberID: number,
    pendingFiberToMessageCountMap: WeakMap<Fiber, Map<string, number>>,
    forError: boolean,
  ): number {
    let newCount = 0;

    const devtoolsInstance = idToDevToolsInstanceMap.get(fiberID);

    if (devtoolsInstance === undefined) {
      return 0;
    }

    let messageCountMap = forError
      ? devtoolsInstance.errors
      : devtoolsInstance.warnings;

    const pendingMessageCountMap = pendingFiberToMessageCountMap.get(fiber);
    if (pendingMessageCountMap != null) {
      if (messageCountMap === null) {
        messageCountMap = pendingMessageCountMap;
        if (forError) {
          devtoolsInstance.errors = pendingMessageCountMap;
        } else {
          devtoolsInstance.warnings = pendingMessageCountMap;
        }
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
          true,
        );
        const warningCount = mergeMapsAndGetCountHelper(
          fiber,
          fiberID,
          pendingFiberToWarningsMap,
          false,
        );

        pushOperation(TREE_OPERATION_UPDATE_ERRORS_OR_WARNINGS);
        pushOperation(fiberID);
        pushOperation(errorCount);
        pushOperation(warningCount);

        // Only clear the ones that we've already shown. Leave others in case
        // they mount later.
        pendingFiberToErrorsMap.delete(fiber);
        pendingFiberToWarningsMap.delete(fiber);
      }
    });
    fibersWithChangedErrorOrWarningCounts.clear();
  }

  function flushPendingEvents(root: Object): void {
    // Add any pending errors and warnings to the operations array.
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
      (pendingUnmountedRootID === null ? 0 : 1);

    const operations = new Array<number>(
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
      for (let j = 0; j < pendingRealUnmountedIDs.length; j++) {
        operations[i++] = pendingRealUnmountedIDs[j];
      }
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

  function recordMount(
    fiber: Fiber,
    parentInstance: DevToolsInstance | null,
  ): FiberInstance {
    const isRoot = fiber.tag === HostRoot;
    let fiberInstance;
    if (isRoot) {
      const entry = rootToFiberInstanceMap.get(fiber.stateNode);
      if (entry === undefined) {
        throw new Error('The root should have been registered at this point');
      }
      fiberInstance = entry;
    } else {
      fiberInstance = createFiberInstance(fiber);
    }
    // If this already exists behind a different FiberInstance, we intentionally
    // override it here to claim the fiber as part of this new instance.
    // E.g. if it was part of a reparenting.
    fiberToFiberInstanceMap.set(fiber, fiberInstance);
    const alternate = fiber.alternate;
    if (alternate !== null && fiberToFiberInstanceMap.has(alternate)) {
      fiberToFiberInstanceMap.set(alternate, fiberInstance);
    }
    idToDevToolsInstanceMap.set(fiberInstance.id, fiberInstance);

    const id = fiberInstance.id;

    if (__DEBUG__) {
      debug('recordMount()', fiber, parentInstance);
    }

    const isProfilingSupported = fiber.hasOwnProperty('treeBaseDuration');

    if (isRoot) {
      const hasOwnerMetadata = fiber.hasOwnProperty('_debugOwner');

      // Adding a new field here would require a bridge protocol version bump (a backwads breaking change).
      // Instead let's re-purpose a pre-existing field to carry more information.
      let profilingFlags = 0;
      if (isProfilingSupported) {
        profilingFlags = PROFILING_FLAG_BASIC_SUPPORT;
        if (typeof injectProfilingHooks === 'function') {
          profilingFlags |= PROFILING_FLAG_TIMELINE_SUPPORT;
        }
      }

      // Set supportsStrictMode to false for production renderer builds
      const isProductionBuildOfRenderer = renderer.bundleType === 0;

      pushOperation(TREE_OPERATION_ADD);
      pushOperation(id);
      pushOperation(ElementTypeRoot);
      pushOperation((fiber.mode & StrictModeBits) !== 0 ? 1 : 0);
      pushOperation(profilingFlags);
      pushOperation(
        !isProductionBuildOfRenderer && StrictModeBits !== 0 ? 1 : 0,
      );
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

      // Finding the owner instance might require traversing the whole parent path which
      // doesn't have great big O notation. Ideally we'd lazily fetch the owner when we
      // need it but we have some synchronous operations in the front end like Alt+Left
      // which selects the owner immediately. Typically most owners are only a few parents
      // away so maybe it's not so bad.
      const debugOwner = getUnfilteredOwner(fiber);
      const ownerInstance = findNearestOwnerInstance(
        parentInstance,
        debugOwner,
      );
      if (
        ownerInstance !== null &&
        debugOwner === fiber._debugOwner &&
        fiber._debugStack != null &&
        ownerInstance.source === null
      ) {
        // The new Fiber is directly owned by the ownerInstance. Therefore somewhere on
        // the debugStack will be a stack frame inside the ownerInstance's source.
        ownerInstance.source = fiber._debugStack;
      }
      const ownerID = ownerInstance === null ? 0 : ownerInstance.id;
      const parentID = parentInstance ? parentInstance.id : 0;

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
      if ((fiber.mode & StrictModeBits) !== 0) {
        let parentFiber = null;
        let parentFiberInstance = parentInstance;
        while (parentFiberInstance !== null) {
          if (parentFiberInstance.kind === FIBER_INSTANCE) {
            parentFiber = parentFiberInstance.data;
            break;
          }
          parentFiberInstance = parentFiberInstance.parent;
        }
        if (parentFiber === null || (parentFiber.mode & StrictModeBits) === 0) {
          pushOperation(TREE_OPERATION_SET_SUBTREE_MODE);
          pushOperation(id);
          pushOperation(StrictMode);
        }
      }
    }

    if (isProfilingSupported) {
      recordProfilingDurations(fiberInstance);
    }
    return fiberInstance;
  }

  function recordVirtualMount(
    instance: VirtualInstance,
    parentInstance: DevToolsInstance | null,
    secondaryEnv: null | string,
  ): void {
    const id = instance.id;

    idToDevToolsInstanceMap.set(id, instance);

    const componentInfo = instance.data;

    const key =
      typeof componentInfo.key === 'string' ? componentInfo.key : null;
    const env = componentInfo.env;
    let displayName = componentInfo.name || '';
    if (typeof env === 'string') {
      // We model environment as an HoC name for now.
      if (secondaryEnv !== null) {
        displayName = secondaryEnv + '(' + displayName + ')';
      }
      displayName = env + '(' + displayName + ')';
    }
    const elementType = ElementTypeVirtual;

    // Finding the owner instance might require traversing the whole parent path which
    // doesn't have great big O notation. Ideally we'd lazily fetch the owner when we
    // need it but we have some synchronous operations in the front end like Alt+Left
    // which selects the owner immediately. Typically most owners are only a few parents
    // away so maybe it's not so bad.
    const debugOwner = getUnfilteredOwner(componentInfo);
    const ownerInstance = findNearestOwnerInstance(parentInstance, debugOwner);
    if (
      ownerInstance !== null &&
      debugOwner === componentInfo.owner &&
      componentInfo.debugStack != null &&
      ownerInstance.source === null
    ) {
      // The new Fiber is directly owned by the ownerInstance. Therefore somewhere on
      // the debugStack will be a stack frame inside the ownerInstance's source.
      ownerInstance.source = componentInfo.debugStack;
    }
    const ownerID = ownerInstance === null ? 0 : ownerInstance.id;
    const parentID = parentInstance ? parentInstance.id : 0;

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
  }

  function recordUnmount(fiberInstance: FiberInstance): void {
    const fiber = fiberInstance.data;
    if (__DEBUG__) {
      debug('recordUnmount()', fiber, null);
    }

    if (trackedPathMatchInstance === fiberInstance) {
      // We're in the process of trying to restore previous selection.
      // If this fiber matched but is being unmounted, there's no use trying.
      // Reset the state so we don't keep holding onto it.
      setTrackedPath(null);
    }

    const id = fiberInstance.id;
    const isRoot = fiber.tag === HostRoot;
    if (isRoot) {
      // Roots must be removed only after all children have been removed.
      // So we track it separately.
      pendingUnmountedRootID = id;
    } else {
      // To maintain child-first ordering,
      // we'll push it into one of these queues,
      // and later arrange them in the correct order.
      pendingRealUnmountedIDs.push(id);
    }

    idToDevToolsInstanceMap.delete(fiberInstance.id);

    // Restore any errors/warnings associated with this fiber to the pending
    // map. I.e. treat it as before we tracked the instances. This lets us
    // restore them if we remount the same Fibers later. Otherwise we rely
    // on the GC of the Fibers to clean them up.
    if (fiberInstance.errors !== null) {
      pendingFiberToErrorsMap.set(fiber, fiberInstance.errors);
      fiberInstance.errors = null;
    }
    if (fiberInstance.warnings !== null) {
      pendingFiberToWarningsMap.set(fiber, fiberInstance.warnings);
      fiberInstance.warnings = null;
    }

    if (fiberInstance.flags & FORCE_ERROR) {
      fiberInstance.flags &= ~FORCE_ERROR;
      forceErrorCount--;
      if (forceErrorCount === 0 && setErrorHandler != null) {
        setErrorHandler(shouldErrorFiberAlwaysNull);
      }
    }
    if (fiberInstance.flags & FORCE_SUSPENSE_FALLBACK) {
      fiberInstance.flags &= ~FORCE_SUSPENSE_FALLBACK;
      forceFallbackCount--;
      if (forceFallbackCount === 0 && setSuspenseHandler != null) {
        setSuspenseHandler(shouldSuspendFiberAlwaysFalse);
      }
    }

    if (fiberToFiberInstanceMap.get(fiber) === fiberInstance) {
      fiberToFiberInstanceMap.delete(fiber);
    }
    const {alternate} = fiber;
    if (alternate !== null) {
      if (fiberToFiberInstanceMap.get(alternate) === fiberInstance) {
        fiberToFiberInstanceMap.delete(alternate);
      }
    }

    untrackFiber(fiberInstance, fiber);
  }

  // Running state of the remaining children from the previous version of this parent that
  // we haven't yet added back. This should be reset anytime we change parent.
  // Any remaining ones at the end will be deleted.
  let remainingReconcilingChildren: null | DevToolsInstance = null;
  // The previously placed child.
  let previouslyReconciledSibling: null | DevToolsInstance = null;
  // To save on stack allocation and ensure that they are updated as a pair, we also store
  // the current parent here as well.
  let reconcilingParent: null | DevToolsInstance = null;

  function insertChild(instance: DevToolsInstance): void {
    const parentInstance = reconcilingParent;
    if (parentInstance === null) {
      // This instance is at the root.
      return;
    }
    // Place it in the parent.
    instance.parent = parentInstance;
    if (previouslyReconciledSibling === null) {
      previouslyReconciledSibling = instance;
      parentInstance.firstChild = instance;
    } else {
      previouslyReconciledSibling.nextSibling = instance;
      previouslyReconciledSibling = instance;
    }
    instance.nextSibling = null;
  }

  function moveChild(
    instance: DevToolsInstance,
    previousSibling: null | DevToolsInstance,
  ): void {
    removeChild(instance, previousSibling);
    insertChild(instance);
  }

  function removeChild(
    instance: DevToolsInstance,
    previousSibling: null | DevToolsInstance,
  ): void {
    if (instance.parent === null) {
      if (remainingReconcilingChildren === instance) {
        throw new Error(
          'Remaining children should not have items with no parent',
        );
      } else if (instance.nextSibling !== null) {
        throw new Error('A deleted instance should not have next siblings');
      }
      // Already deleted.
      return;
    }
    const parentInstance = reconcilingParent;
    if (parentInstance === null) {
      throw new Error('Should not have a parent if we are at the root');
    }
    if (instance.parent !== parentInstance) {
      throw new Error(
        'Cannot remove a node from a different parent than is being reconciled.',
      );
    }
    // Remove an existing child from its current position, which we assume is in the
    // remainingReconcilingChildren set.
    if (previousSibling === null) {
      // We're first in the remaining set. Remove us.
      if (remainingReconcilingChildren !== instance) {
        throw new Error(
          'Expected a placed child to be moved from the remaining set.',
        );
      }
      remainingReconcilingChildren = instance.nextSibling;
    } else {
      previousSibling.nextSibling = instance.nextSibling;
    }
    instance.nextSibling = null;
    instance.parent = null;
  }

  function unmountRemainingChildren() {
    let child = remainingReconcilingChildren;
    while (child !== null) {
      unmountInstanceRecursively(child);
      child = remainingReconcilingChildren;
    }
  }

  function mountVirtualInstanceRecursively(
    virtualInstance: VirtualInstance,
    firstChild: Fiber,
    lastChild: null | Fiber, // non-inclusive
    traceNearestHostComponentUpdate: boolean,
    virtualLevel: number, // the nth level of virtual instances
  ): void {
    // If we have the tree selection from previous reload, try to match this Instance.
    // Also remember whether to do the same for siblings.
    const mightSiblingsBeOnTrackedPath =
      updateVirtualTrackedPathStateBeforeMount(
        virtualInstance,
        reconcilingParent,
      );

    const stashedParent = reconcilingParent;
    const stashedPrevious = previouslyReconciledSibling;
    const stashedRemaining = remainingReconcilingChildren;
    // Push a new DevTools instance parent while reconciling this subtree.
    reconcilingParent = virtualInstance;
    previouslyReconciledSibling = null;
    remainingReconcilingChildren = null;
    try {
      mountVirtualChildrenRecursively(
        firstChild,
        lastChild,
        traceNearestHostComponentUpdate,
        virtualLevel + 1,
      );
      // Must be called after all children have been appended.
      recordVirtualProfilingDurations(virtualInstance);
    } finally {
      reconcilingParent = stashedParent;
      previouslyReconciledSibling = stashedPrevious;
      remainingReconcilingChildren = stashedRemaining;
      updateTrackedPathStateAfterMount(mightSiblingsBeOnTrackedPath);
    }
  }

  function recordVirtualUnmount(instance: VirtualInstance) {
    if (trackedPathMatchInstance === instance) {
      // We're in the process of trying to restore previous selection.
      // If this fiber matched but is being unmounted, there's no use trying.
      // Reset the state so we don't keep holding onto it.
      setTrackedPath(null);
    }

    const id = instance.id;
    pendingRealUnmountedIDs.push(id);
  }

  function getSecondaryEnvironmentName(
    debugInfo: ?ReactDebugInfo,
    index: number,
  ): null | string {
    if (debugInfo != null) {
      const componentInfo: ReactComponentInfo = (debugInfo[index]: any);
      for (let i = index + 1; i < debugInfo.length; i++) {
        const debugEntry = debugInfo[i];
        if (typeof debugEntry.env === 'string') {
          // If the next environment is different then this component was the boundary
          // and it changed before entering the next component. So we assign this
          // component a secondary environment.
          return componentInfo.env !== debugEntry.env ? debugEntry.env : null;
        }
      }
    }
    return null;
  }

  function mountVirtualChildrenRecursively(
    firstChild: Fiber,
    lastChild: null | Fiber, // non-inclusive
    traceNearestHostComponentUpdate: boolean,
    virtualLevel: number, // the nth level of virtual instances
  ): void {
    // Iterate over siblings rather than recursing.
    // This reduces the chance of stack overflow for wide trees (e.g. lists with many items).
    let fiber: Fiber | null = firstChild;
    let previousVirtualInstance: null | VirtualInstance = null;
    let previousVirtualInstanceFirstFiber: Fiber = firstChild;
    while (fiber !== null && fiber !== lastChild) {
      let level = 0;
      if (fiber._debugInfo) {
        for (let i = 0; i < fiber._debugInfo.length; i++) {
          const debugEntry = fiber._debugInfo[i];
          if (typeof debugEntry.name !== 'string') {
            // Not a Component. Some other Debug Info.
            continue;
          }
          // Scan up until the next Component to see if this component changed environment.
          const componentInfo: ReactComponentInfo = (debugEntry: any);
          const secondaryEnv = getSecondaryEnvironmentName(fiber._debugInfo, i);
          if (componentInfo.env != null) {
            knownEnvironmentNames.add(componentInfo.env);
          }
          if (secondaryEnv !== null) {
            knownEnvironmentNames.add(secondaryEnv);
          }
          if (shouldFilterVirtual(componentInfo, secondaryEnv)) {
            // Skip.
            continue;
          }
          if (level === virtualLevel) {
            if (
              previousVirtualInstance === null ||
              // Consecutive children with the same debug entry as a parent gets
              // treated as if they share the same virtual instance.
              previousVirtualInstance.data !== debugEntry
            ) {
              if (previousVirtualInstance !== null) {
                // Mount any previous children that should go into the previous parent.
                mountVirtualInstanceRecursively(
                  previousVirtualInstance,
                  previousVirtualInstanceFirstFiber,
                  fiber,
                  traceNearestHostComponentUpdate,
                  virtualLevel,
                );
              }
              previousVirtualInstance = createVirtualInstance(componentInfo);
              recordVirtualMount(
                previousVirtualInstance,
                reconcilingParent,
                secondaryEnv,
              );
              insertChild(previousVirtualInstance);
              previousVirtualInstanceFirstFiber = fiber;
            }
            level++;
            break;
          } else {
            level++;
          }
        }
      }
      if (level === virtualLevel) {
        if (previousVirtualInstance !== null) {
          // If we were working on a virtual instance and this is not a virtual
          // instance, then we end the sequence and mount any previous children
          // that should go into the previous virtual instance.
          mountVirtualInstanceRecursively(
            previousVirtualInstance,
            previousVirtualInstanceFirstFiber,
            fiber,
            traceNearestHostComponentUpdate,
            virtualLevel,
          );
          previousVirtualInstance = null;
        }
        // We've reached the end of the virtual levels, but not beyond,
        // and now continue with the regular fiber.
        mountFiberRecursively(fiber, traceNearestHostComponentUpdate);
      }
      fiber = fiber.sibling;
    }
    if (previousVirtualInstance !== null) {
      // Mount any previous children that should go into the previous parent.
      mountVirtualInstanceRecursively(
        previousVirtualInstance,
        previousVirtualInstanceFirstFiber,
        null,
        traceNearestHostComponentUpdate,
        virtualLevel,
      );
    }
  }

  function mountChildrenRecursively(
    firstChild: Fiber,
    traceNearestHostComponentUpdate: boolean,
  ): void {
    mountVirtualChildrenRecursively(
      firstChild,
      null,
      traceNearestHostComponentUpdate,
      0, // first level
    );
  }

  function mountFiberRecursively(
    fiber: Fiber,
    traceNearestHostComponentUpdate: boolean,
  ): void {
    if (__DEBUG__) {
      debug('mountFiberRecursively()', fiber, reconcilingParent);
    }

    const shouldIncludeInTree = !shouldFilterFiber(fiber);
    let newInstance = null;
    if (shouldIncludeInTree) {
      newInstance = recordMount(fiber, reconcilingParent);
      insertChild(newInstance);
    }

    // If we have the tree selection from previous reload, try to match this Fiber.
    // Also remember whether to do the same for siblings.
    const mightSiblingsBeOnTrackedPath = updateTrackedPathStateBeforeMount(
      fiber,
      newInstance,
    );

    const stashedParent = reconcilingParent;
    const stashedPrevious = previouslyReconciledSibling;
    const stashedRemaining = remainingReconcilingChildren;
    if (shouldIncludeInTree) {
      // Push a new DevTools instance parent while reconciling this subtree.
      reconcilingParent = newInstance;
      previouslyReconciledSibling = null;
      remainingReconcilingChildren = null;
    }
    try {
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

      if (fiber.tag === HostHoistable) {
        const nearestInstance = reconcilingParent;
        if (nearestInstance === null) {
          throw new Error('Did not expect a host hoistable to be the root');
        }
        aquireHostResource(nearestInstance, fiber.memoizedState);
      } else if (
        fiber.tag === HostComponent ||
        fiber.tag === HostText ||
        fiber.tag === HostSingleton
      ) {
        const nearestInstance = reconcilingParent;
        if (nearestInstance === null) {
          throw new Error('Did not expect a host hoistable to be the root');
        }
        aquireHostInstance(nearestInstance, fiber.stateNode);
      }

      if (fiber.tag === SuspenseComponent) {
        const isTimedOut = fiber.memoizedState !== null;
        if (isTimedOut) {
          // Special case: if Suspense mounts in a timed-out state,
          // get the fallback child from the inner fragment and mount
          // it as if it was our own child. Updates handle this too.
          const primaryChildFragment = fiber.child;
          const fallbackChildFragment = primaryChildFragment
            ? primaryChildFragment.sibling
            : null;
          if (fallbackChildFragment) {
            const fallbackChild = fallbackChildFragment.child;
            if (fallbackChild !== null) {
              updateTrackedPathStateBeforeMount(fallbackChildFragment, null);
              mountChildrenRecursively(
                fallbackChild,
                traceNearestHostComponentUpdate,
              );
            }
          }
        } else {
          let primaryChild: Fiber | null = null;
          const areSuspenseChildrenConditionallyWrapped =
            OffscreenComponent === -1;
          if (areSuspenseChildrenConditionallyWrapped) {
            primaryChild = fiber.child;
          } else if (fiber.child !== null) {
            primaryChild = fiber.child.child;
            updateTrackedPathStateBeforeMount(fiber.child, null);
          }
          if (primaryChild !== null) {
            mountChildrenRecursively(
              primaryChild,
              traceNearestHostComponentUpdate,
            );
          }
        }
      } else {
        if (fiber.child !== null) {
          mountChildrenRecursively(
            fiber.child,
            traceNearestHostComponentUpdate,
          );
        }
      }
    } finally {
      if (shouldIncludeInTree) {
        reconcilingParent = stashedParent;
        previouslyReconciledSibling = stashedPrevious;
        remainingReconcilingChildren = stashedRemaining;
      }
    }

    // We're exiting this Fiber now, and entering its siblings.
    // If we have selection to restore, we might need to re-activate tracking.
    updateTrackedPathStateAfterMount(mightSiblingsBeOnTrackedPath);
  }

  // We use this to simulate unmounting for Suspense trees
  // when we switch from primary to fallback, or deleting a subtree.
  function unmountInstanceRecursively(instance: DevToolsInstance) {
    if (__DEBUG__) {
      if (instance.kind === FIBER_INSTANCE) {
        debug('unmountInstanceRecursively()', instance.data, null);
      }
    }

    const stashedParent = reconcilingParent;
    const stashedPrevious = previouslyReconciledSibling;
    const stashedRemaining = remainingReconcilingChildren;
    // Push a new DevTools instance parent while reconciling this subtree.
    reconcilingParent = instance;
    previouslyReconciledSibling = null;
    // Move all the children of this instance to the remaining set.
    remainingReconcilingChildren = instance.firstChild;
    instance.firstChild = null;
    try {
      // Unmount the remaining set.
      unmountRemainingChildren();
    } finally {
      reconcilingParent = stashedParent;
      previouslyReconciledSibling = stashedPrevious;
      remainingReconcilingChildren = stashedRemaining;
    }
    if (instance.kind === FIBER_INSTANCE) {
      recordUnmount(instance);
    } else {
      recordVirtualUnmount(instance);
    }
    removeChild(instance, null);
  }

  function recordProfilingDurations(fiberInstance: FiberInstance) {
    const id = fiberInstance.id;
    const fiber = fiberInstance.data;
    const {actualDuration, treeBaseDuration} = fiber;

    fiberInstance.treeBaseDuration = treeBaseDuration || 0;

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
          const metadata =
            ((currentCommitProfilingMetadata: any): CommitProfilingData);
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

  function recordVirtualProfilingDurations(virtualInstance: VirtualInstance) {
    const id = virtualInstance.id;

    let treeBaseDuration = 0;
    // Add up the base duration of the child instances. The virtual base duration
    // will be the same as children's duration since we don't take up any render
    // time in the virtual instance.
    for (
      let child = virtualInstance.firstChild;
      child !== null;
      child = child.nextSibling
    ) {
      treeBaseDuration += child.treeBaseDuration;
    }

    if (isProfiling) {
      const previousTreeBaseDuration = virtualInstance.treeBaseDuration;
      if (treeBaseDuration !== previousTreeBaseDuration) {
        // Tree base duration updates are included in the operations typed array.
        // So we have to convert them from milliseconds to microseconds so we can send them as ints.
        const convertedTreeBaseDuration = Math.floor(
          (treeBaseDuration || 0) * 1000,
        );
        pushOperation(TREE_OPERATION_UPDATE_TREE_BASE_DURATION);
        pushOperation(id);
        pushOperation(convertedTreeBaseDuration);
      }
    }

    virtualInstance.treeBaseDuration = treeBaseDuration;
  }

  function recordResetChildren(parentInstance: DevToolsInstance) {
    if (__DEBUG__) {
      if (
        parentInstance.firstChild !== null &&
        parentInstance.firstChild.kind === FIBER_INSTANCE
      ) {
        debug(
          'recordResetChildren()',
          parentInstance.firstChild.data,
          parentInstance,
        );
      }
    }
    // The frontend only really cares about the displayName, key, and children.
    // The first two don't really change, so we are only concerned with the order of children here.
    // This is trickier than a simple comparison though, since certain types of fibers are filtered.
    const nextChildren: Array<number> = [];

    let child: null | DevToolsInstance = parentInstance.firstChild;
    while (child !== null) {
      nextChildren.push(child.id);
      child = child.nextSibling;
    }

    const numChildren = nextChildren.length;
    if (numChildren < 2) {
      // No need to reorder.
      return;
    }
    pushOperation(TREE_OPERATION_REORDER_CHILDREN);
    pushOperation(parentInstance.id);
    pushOperation(numChildren);
    for (let i = 0; i < nextChildren.length; i++) {
      pushOperation(nextChildren[i]);
    }
  }

  function updateVirtualInstanceRecursively(
    virtualInstance: VirtualInstance,
    nextFirstChild: Fiber,
    nextLastChild: null | Fiber, // non-inclusive
    prevFirstChild: null | Fiber,
    traceNearestHostComponentUpdate: boolean,
    virtualLevel: number, // the nth level of virtual instances
  ): void {
    const stashedParent = reconcilingParent;
    const stashedPrevious = previouslyReconciledSibling;
    const stashedRemaining = remainingReconcilingChildren;
    // Push a new DevTools instance parent while reconciling this subtree.
    reconcilingParent = virtualInstance;
    previouslyReconciledSibling = null;
    // Move all the children of this instance to the remaining set.
    // We'll move them back one by one, and anything that remains is deleted.
    remainingReconcilingChildren = virtualInstance.firstChild;
    virtualInstance.firstChild = null;
    try {
      if (
        updateVirtualChildrenRecursively(
          nextFirstChild,
          nextLastChild,
          prevFirstChild,
          traceNearestHostComponentUpdate,
          virtualLevel + 1,
        )
      ) {
        recordResetChildren(virtualInstance);
      }
      // Must be called after all children have been appended.
      recordVirtualProfilingDurations(virtualInstance);
    } finally {
      unmountRemainingChildren();
      reconcilingParent = stashedParent;
      previouslyReconciledSibling = stashedPrevious;
      remainingReconcilingChildren = stashedRemaining;
    }
  }

  function updateVirtualChildrenRecursively(
    nextFirstChild: Fiber,
    nextLastChild: null | Fiber, // non-inclusive
    prevFirstChild: null | Fiber,
    traceNearestHostComponentUpdate: boolean,
    virtualLevel: number, // the nth level of virtual instances
  ): boolean {
    let shouldResetChildren = false;
    // If the first child is different, we need to traverse them.
    // Each next child will be either a new child (mount) or an alternate (update).
    let nextChild: null | Fiber = nextFirstChild;
    let prevChildAtSameIndex = prevFirstChild;
    let previousVirtualInstance: null | VirtualInstance = null;
    let previousVirtualInstanceWasMount: boolean = false;
    let previousVirtualInstanceNextFirstFiber: Fiber = nextFirstChild;
    let previousVirtualInstancePrevFirstFiber: null | Fiber = prevFirstChild;
    while (nextChild !== null && nextChild !== nextLastChild) {
      let level = 0;
      if (nextChild._debugInfo) {
        for (let i = 0; i < nextChild._debugInfo.length; i++) {
          const debugEntry = nextChild._debugInfo[i];
          if (typeof debugEntry.name !== 'string') {
            // Not a Component. Some other Debug Info.
            continue;
          }
          const componentInfo: ReactComponentInfo = (debugEntry: any);
          const secondaryEnv = getSecondaryEnvironmentName(
            nextChild._debugInfo,
            i,
          );
          if (componentInfo.env != null) {
            knownEnvironmentNames.add(componentInfo.env);
          }
          if (secondaryEnv !== null) {
            knownEnvironmentNames.add(secondaryEnv);
          }
          if (shouldFilterVirtual(componentInfo, secondaryEnv)) {
            continue;
          }
          if (level === virtualLevel) {
            if (
              previousVirtualInstance === null ||
              // Consecutive children with the same debug entry as a parent gets
              // treated as if they share the same virtual instance.
              previousVirtualInstance.data !== componentInfo
            ) {
              if (previousVirtualInstance !== null) {
                // Mount any previous children that should go into the previous parent.
                if (previousVirtualInstanceWasMount) {
                  mountVirtualInstanceRecursively(
                    previousVirtualInstance,
                    previousVirtualInstanceNextFirstFiber,
                    nextChild,
                    traceNearestHostComponentUpdate,
                    virtualLevel,
                  );
                } else {
                  updateVirtualInstanceRecursively(
                    previousVirtualInstance,
                    previousVirtualInstanceNextFirstFiber,
                    nextChild,
                    previousVirtualInstancePrevFirstFiber,
                    traceNearestHostComponentUpdate,
                    virtualLevel,
                  );
                }
              }
              let previousSiblingOfBestMatch = null;
              let bestMatch = remainingReconcilingChildren;
              if (componentInfo.key != null) {
                // If there is a key try to find a matching key in the set.
                bestMatch = remainingReconcilingChildren;
                while (bestMatch !== null) {
                  if (
                    bestMatch.kind === VIRTUAL_INSTANCE &&
                    bestMatch.data.key === componentInfo.key
                  ) {
                    break;
                  }
                  previousSiblingOfBestMatch = bestMatch;
                  bestMatch = bestMatch.nextSibling;
                }
              }
              if (
                bestMatch !== null &&
                bestMatch.kind === VIRTUAL_INSTANCE &&
                bestMatch.data.name === componentInfo.name &&
                bestMatch.data.env === componentInfo.env &&
                bestMatch.data.key === componentInfo.key
              ) {
                // If the previous children had a virtual instance in the same slot
                // with the same name, then we claim it and reuse it for this update.
                // Update it with the latest entry.
                bestMatch.data = componentInfo;
                moveChild(bestMatch, previousSiblingOfBestMatch);
                previousVirtualInstance = bestMatch;
                previousVirtualInstanceWasMount = false;
              } else {
                // Otherwise we create a new instance.
                const newVirtualInstance = createVirtualInstance(componentInfo);
                recordVirtualMount(
                  newVirtualInstance,
                  reconcilingParent,
                  secondaryEnv,
                );
                insertChild(newVirtualInstance);
                previousVirtualInstance = newVirtualInstance;
                previousVirtualInstanceWasMount = true;
                shouldResetChildren = true;
              }
              // Existing children might be reparented into this new virtual instance.
              // TODO: This will cause the front end to error which needs to be fixed.
              previousVirtualInstanceNextFirstFiber = nextChild;
              previousVirtualInstancePrevFirstFiber = prevChildAtSameIndex;
            }
            level++;
            break;
          } else {
            level++;
          }
        }
      }
      if (level === virtualLevel) {
        if (previousVirtualInstance !== null) {
          // If we were working on a virtual instance and this is not a virtual
          // instance, then we end the sequence and update any previous children
          // that should go into the previous virtual instance.
          if (previousVirtualInstanceWasMount) {
            mountVirtualInstanceRecursively(
              previousVirtualInstance,
              previousVirtualInstanceNextFirstFiber,
              nextChild,
              traceNearestHostComponentUpdate,
              virtualLevel,
            );
          } else {
            updateVirtualInstanceRecursively(
              previousVirtualInstance,
              previousVirtualInstanceNextFirstFiber,
              nextChild,
              previousVirtualInstancePrevFirstFiber,
              traceNearestHostComponentUpdate,
              virtualLevel,
            );
          }
          previousVirtualInstance = null;
        }

        // We've reached the end of the virtual levels, but not beyond,
        // and now continue with the regular fiber.

        // Do a fast pass over the remaining children to find the previous instance.
        // TODO: This doesn't have the best O(n) for a large set of children that are
        // reordered. Consider using a temporary map if it's not the very next one.
        let prevChild;
        if (prevChildAtSameIndex === nextChild) {
          // This set is unchanged. We're just going through it to place all the
          // children again.
          prevChild = nextChild;
        } else {
          // We don't actually need to rely on the alternate here. We could also
          // reconcile against stateNode, key or whatever. Doesn't have to be same
          // Fiber pair.
          prevChild = nextChild.alternate;
        }
        let previousSiblingOfExistingInstance = null;
        let existingInstance = null;
        if (prevChild !== null) {
          existingInstance = remainingReconcilingChildren;
          while (existingInstance !== null) {
            if (existingInstance.data === prevChild) {
              break;
            }
            previousSiblingOfExistingInstance = existingInstance;
            existingInstance = existingInstance.nextSibling;
          }
        }
        if (existingInstance !== null) {
          // Common case. Match in the same parent.
          const fiberInstance: FiberInstance = (existingInstance: any); // Only matches if it's a Fiber.

          // We keep track if the order of the children matches the previous order.
          // They are always different referentially, but if the instances line up
          // conceptually we'll want to know that.
          if (prevChild !== prevChildAtSameIndex) {
            shouldResetChildren = true;
          }

          // Register the new alternate in case it's not already in.
          fiberToFiberInstanceMap.set(nextChild, fiberInstance);

          // Update the Fiber so we that we always keep the current Fiber on the data.
          fiberInstance.data = nextChild;
          moveChild(fiberInstance, previousSiblingOfExistingInstance);

          if (
            updateFiberRecursively(
              fiberInstance,
              nextChild,
              (prevChild: any),
              traceNearestHostComponentUpdate,
            )
          ) {
            // If a nested tree child order changed but it can't handle its own
            // child order invalidation (e.g. because it's filtered out like host nodes),
            // propagate the need to reset child order upwards to this Fiber.
            shouldResetChildren = true;
          }
        } else if (prevChild !== null && shouldFilterFiber(nextChild)) {
          // If this Fiber should be filtered, we need to still update its children.
          // This relies on an alternate since we don't have an Instance with the previous
          // child on it. Ideally, the reconciliation wouldn't need previous Fibers that
          // are filtered from the tree.
          if (
            updateFiberRecursively(
              null,
              nextChild,
              prevChild,
              traceNearestHostComponentUpdate,
            )
          ) {
            shouldResetChildren = true;
          }
        } else {
          // It's possible for a FiberInstance to be reparented when virtual parents
          // get their sequence split or change structure with the same render result.
          // In this case we unmount the and remount the FiberInstances.
          // This might cause us to lose the selection but it's an edge case.

          // We let the previous instance remain in the "remaining queue" it is
          // in to be deleted at the end since it'll have no match.

          mountFiberRecursively(nextChild, traceNearestHostComponentUpdate);
          // Need to mark the parent set to remount the new instance.
          shouldResetChildren = true;
        }
      }
      // Try the next child.
      nextChild = nextChild.sibling;
      // Advance the pointer in the previous list so that we can
      // keep comparing if they line up.
      if (!shouldResetChildren && prevChildAtSameIndex !== null) {
        prevChildAtSameIndex = prevChildAtSameIndex.sibling;
      }
    }
    if (previousVirtualInstance !== null) {
      if (previousVirtualInstanceWasMount) {
        mountVirtualInstanceRecursively(
          previousVirtualInstance,
          previousVirtualInstanceNextFirstFiber,
          null,
          traceNearestHostComponentUpdate,
          virtualLevel,
        );
      } else {
        updateVirtualInstanceRecursively(
          previousVirtualInstance,
          previousVirtualInstanceNextFirstFiber,
          null,
          previousVirtualInstancePrevFirstFiber,
          traceNearestHostComponentUpdate,
          virtualLevel,
        );
      }
    }
    // If we have no more children, but used to, they don't line up.
    if (prevChildAtSameIndex !== null) {
      shouldResetChildren = true;
    }
    return shouldResetChildren;
  }

  // Returns whether closest unfiltered fiber parent needs to reset its child list.
  function updateChildrenRecursively(
    nextFirstChild: null | Fiber,
    prevFirstChild: null | Fiber,
    traceNearestHostComponentUpdate: boolean,
  ): boolean {
    if (nextFirstChild === null) {
      return prevFirstChild !== null;
    }
    return updateVirtualChildrenRecursively(
      nextFirstChild,
      null,
      prevFirstChild,
      traceNearestHostComponentUpdate,
      0,
    );
  }

  // Returns whether closest unfiltered fiber parent needs to reset its child list.
  function updateFiberRecursively(
    fiberInstance: null | FiberInstance, // null if this should be filtered
    nextFiber: Fiber,
    prevFiber: Fiber,
    traceNearestHostComponentUpdate: boolean,
  ): boolean {
    if (__DEBUG__) {
      debug('updateFiberRecursively()', nextFiber, reconcilingParent);
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

    const stashedParent = reconcilingParent;
    const stashedPrevious = previouslyReconciledSibling;
    const stashedRemaining = remainingReconcilingChildren;
    if (fiberInstance !== null) {
      if (
        mostRecentlyInspectedElement !== null &&
        mostRecentlyInspectedElement.id === fiberInstance.id &&
        didFiberRender(prevFiber, nextFiber)
      ) {
        // If this Fiber has updated, clear cached inspected data.
        // If it is inspected again, it may need to be re-run to obtain updated hooks values.
        hasElementUpdatedSinceLastInspected = true;
      }
      // Push a new DevTools instance parent while reconciling this subtree.
      reconcilingParent = fiberInstance;
      previouslyReconciledSibling = null;
      // Move all the children of this instance to the remaining set.
      // We'll move them back one by one, and anything that remains is deleted.
      remainingReconcilingChildren = fiberInstance.firstChild;
      fiberInstance.firstChild = null;
    }
    try {
      if (nextFiber.tag === HostHoistable) {
        const nearestInstance = reconcilingParent;
        if (nearestInstance === null) {
          throw new Error('Did not expect a host hoistable to be the root');
        }
        releaseHostResource(nearestInstance, prevFiber.memoizedState);
        aquireHostResource(nearestInstance, nextFiber.memoizedState);
      }

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

        if (prevFallbackChildSet == null && nextFallbackChildSet != null) {
          mountChildrenRecursively(
            nextFallbackChildSet,
            traceNearestHostComponentUpdate,
          );

          shouldResetChildren = true;
        }

        if (
          nextFallbackChildSet != null &&
          prevFallbackChildSet != null &&
          updateChildrenRecursively(
            nextFallbackChildSet,
            prevFallbackChildSet,
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
          mountChildrenRecursively(
            nextPrimaryChildSet,
            traceNearestHostComponentUpdate,
          );
        }
        shouldResetChildren = true;
      } else if (!prevDidTimeout && nextDidTimeOut) {
        // Primary -> Fallback:
        // 1. Hide primary set
        // We simply don't re-add the fallback children and let
        // unmountRemainingChildren() handle it.
        // 2. Mount fallback set
        const nextFiberChild = nextFiber.child;
        const nextFallbackChildSet = nextFiberChild
          ? nextFiberChild.sibling
          : null;
        if (nextFallbackChildSet != null) {
          mountChildrenRecursively(
            nextFallbackChildSet,
            traceNearestHostComponentUpdate,
          );
          shouldResetChildren = true;
        }
      } else {
        // Common case: Primary -> Primary.
        // This is the same code path as for non-Suspense fibers.
        if (nextFiber.child !== prevFiber.child) {
          if (
            updateChildrenRecursively(
              nextFiber.child,
              prevFiber.child,
              traceNearestHostComponentUpdate,
            )
          ) {
            shouldResetChildren = true;
          }
        } else {
          // Children are unchanged.
          if (fiberInstance !== null) {
            // All the remaining children will be children of this same fiber so we can just reuse them.
            // I.e. we just restore them by undoing what we did above.
            fiberInstance.firstChild = remainingReconcilingChildren;
            remainingReconcilingChildren = null;

            if (traceUpdatesEnabled) {
              // If we're tracing updates and we've bailed out before reaching a host node,
              // we should fall back to recursively marking the nearest host descendants for highlight.
              if (traceNearestHostComponentUpdate) {
                const hostInstances =
                  findAllCurrentHostInstances(fiberInstance);
                hostInstances.forEach(hostInstance => {
                  traceUpdatesForNodes.add(hostInstance);
                });
              }
            }
          } else {
            // If this fiber is filtered there might be changes to this set elsewhere so we have
            // to visit each child to place it back in the set. We let the child bail out instead.
            if (
              updateChildrenRecursively(nextFiber.child, prevFiber.child, false)
            ) {
              throw new Error(
                'The children should not have changed if we pass in the same set.',
              );
            }
          }
        }
      }

      if (fiberInstance !== null) {
        const isProfilingSupported =
          nextFiber.hasOwnProperty('treeBaseDuration');
        if (isProfilingSupported) {
          recordProfilingDurations(fiberInstance);
        }
      }
      if (shouldResetChildren) {
        // We need to crawl the subtree for closest non-filtered Fibers
        // so that we can display them in a flat children set.
        if (fiberInstance !== null) {
          recordResetChildren(fiberInstance);
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
    } finally {
      if (fiberInstance !== null) {
        unmountRemainingChildren();
        reconcilingParent = stashedParent;
        previouslyReconciledSibling = stashedPrevious;
        remainingReconcilingChildren = stashedRemaining;
      }
    }
  }

  function cleanup() {
    // We don't patch any methods so there is no cleanup.
  }

  function rootSupportsProfiling(root: any) {
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
        const current = root.current;
        const alternate = current.alternate;
        const newRoot = createFiberInstance(current);
        rootToFiberInstanceMap.set(root, newRoot);
        idToDevToolsInstanceMap.set(newRoot.id, newRoot);
        fiberToFiberInstanceMap.set(current, newRoot);
        if (alternate) {
          fiberToFiberInstanceMap.set(alternate, newRoot);
        }
        currentRootID = newRoot.id;
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

        mountFiberRecursively(root.current, false);
        flushPendingEvents(root);
        currentRootID = -1;
      });
    }
  }

  function getUpdatersList(root: any): Array<SerializedElement> | null {
    const updaters = root.memoizedUpdaters;
    if (updaters == null) {
      return null;
    }
    const result = [];
    // eslint-disable-next-line no-for-of-loops/no-for-of-loops
    for (const updater of updaters) {
      const inst = getFiberInstanceUnsafe(updater);
      if (inst !== null) {
        result.push(instanceToSerializedElement(inst));
      }
    }
    return result;
  }

  function handleCommitFiberUnmount(fiber: any) {
    // This Hook is no longer used. After having shipped DevTools everywhere it is
    // safe to stop calling it from Fiber.
  }

  function handlePostCommitFiberRoot(root: any) {
    if (isProfiling && rootSupportsProfiling(root)) {
      if (currentCommitProfilingMetadata !== null) {
        const {effectDuration, passiveEffectDuration} =
          getEffectDurations(root);
        // $FlowFixMe[incompatible-use] found when upgrading Flow
        currentCommitProfilingMetadata.effectDuration = effectDuration;
        // $FlowFixMe[incompatible-use] found when upgrading Flow
        currentCommitProfilingMetadata.passiveEffectDuration =
          passiveEffectDuration;
      }
    }
  }

  function handleCommitFiberRoot(
    root: FiberRoot,
    priorityLevel: void | number,
  ) {
    const current = root.current;
    const alternate = current.alternate;

    let rootInstance = rootToFiberInstanceMap.get(root);
    if (!rootInstance) {
      rootInstance = createFiberInstance(current);
      rootToFiberInstanceMap.set(root, rootInstance);
      idToDevToolsInstanceMap.set(rootInstance.id, rootInstance);
      fiberToFiberInstanceMap.set(current, rootInstance);
      if (alternate) {
        fiberToFiberInstanceMap.set(alternate, rootInstance);
      }
      currentRootID = rootInstance.id;
    } else {
      currentRootID = rootInstance.id;
    }

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
        mountFiberRecursively(current, false);
      } else if (wasMounted && isMounted) {
        // Update an existing root.
        updateFiberRecursively(rootInstance, current, alternate, false);
      } else if (wasMounted && !isMounted) {
        // Unmount an existing root.
        unmountInstanceRecursively(rootInstance);
        removeRootPseudoKey(currentRootID);
        rootToFiberInstanceMap.delete(root);
      }
    } else {
      // Mount a new root.
      setRootPseudoKey(currentRootID, current);
      mountFiberRecursively(current, false);
    }

    if (isProfiling && isProfilingSupported) {
      if (!shouldBailoutWithPendingOperations()) {
        const commitProfilingMetadata =
          ((rootToCommitProfilingMetadataMap: any): CommitProfilingMetadataMap).get(
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

  function getResourceInstance(fiber: Fiber): HostInstance | null {
    if (fiber.tag === HostHoistable) {
      const resource = fiber.memoizedState;
      // Feature Detect a DOM Specific Instance of a Resource
      if (
        typeof resource === 'object' &&
        resource !== null &&
        resource.instance != null
      ) {
        return resource.instance;
      }
    }
    return null;
  }

  function appendHostInstancesByDevToolsInstance(
    devtoolsInstance: DevToolsInstance,
    hostInstances: Array<HostInstance>,
  ) {
    if (devtoolsInstance.kind === FIBER_INSTANCE) {
      const fiber = devtoolsInstance.data;
      appendHostInstancesByFiber(fiber, hostInstances);
      return;
    }
    // Search the tree for the nearest child Fiber and add all its host instances.
    // TODO: If the true nearest Fiber is filtered, we might skip it and instead include all
    // the children below it. In the extreme case, searching the whole tree.
    for (
      let child = devtoolsInstance.firstChild;
      child !== null;
      child = child.nextSibling
    ) {
      appendHostInstancesByDevToolsInstance(child, hostInstances);
    }
  }

  function appendHostInstancesByFiber(
    fiber: Fiber,
    hostInstances: Array<HostInstance>,
  ): void {
    // Next we'll drill down this component to find all HostComponent/Text.
    let node: Fiber = fiber;
    while (true) {
      if (
        node.tag === HostComponent ||
        node.tag === HostText ||
        node.tag === HostSingleton ||
        node.tag === HostHoistable
      ) {
        const hostInstance = node.stateNode || getResourceInstance(node);
        if (hostInstance) {
          hostInstances.push(hostInstance);
        }
      } else if (node.child) {
        node.child.return = node;
        node = node.child;
        continue;
      }
      if (node === fiber) {
        return;
      }
      while (!node.sibling) {
        if (!node.return || node.return === fiber) {
          return;
        }
        node = node.return;
      }
      node.sibling.return = node.return;
      node = node.sibling;
    }
  }

  function findAllCurrentHostInstances(
    devtoolsInstance: DevToolsInstance,
  ): $ReadOnlyArray<HostInstance> {
    const hostInstances: Array<HostInstance> = [];
    appendHostInstancesByDevToolsInstance(devtoolsInstance, hostInstances);
    return hostInstances;
  }

  function findHostInstancesForElementID(id: number) {
    try {
      const devtoolsInstance = idToDevToolsInstanceMap.get(id);
      if (devtoolsInstance === undefined) {
        console.warn(`Could not find DevToolsInstance with id "${id}"`);
        return null;
      }
      return findAllCurrentHostInstances(devtoolsInstance);
    } catch (err) {
      // The fiber might have unmounted by now.
      return null;
    }
  }

  function getDisplayNameForElementID(id: number): null | string {
    const devtoolsInstance = idToDevToolsInstanceMap.get(id);
    if (devtoolsInstance === undefined) {
      return null;
    }
    if (devtoolsInstance.kind === FIBER_INSTANCE) {
      return getDisplayNameForFiber(devtoolsInstance.data);
    } else {
      return devtoolsInstance.data.name || '';
    }
  }

  function getNearestMountedDOMNode(publicInstance: Element): null | Element {
    let domNode: null | Element = publicInstance;
    while (domNode && !publicInstanceToDevToolsInstanceMap.has(domNode)) {
      // $FlowFixMe: In practice this is either null or Element.
      domNode = domNode.parentNode;
    }
    return domNode;
  }

  function getElementIDForHostInstance(
    publicInstance: HostInstance,
  ): number | null {
    const instance = publicInstanceToDevToolsInstanceMap.get(publicInstance);
    if (instance !== undefined) {
      return instance.id;
    }
    return null;
  }

  function getElementAttributeByPath(
    id: number,
    path: Array<string | number>,
  ): mixed {
    if (isMostRecentlyInspectedElement(id)) {
      return getInObject(
        ((mostRecentlyInspectedElement: any): InspectedElement),
        path,
      );
    }
    return undefined;
  }

  function getElementSourceFunctionById(id: number): null | Function {
    const devtoolsInstance = idToDevToolsInstanceMap.get(id);
    if (devtoolsInstance === undefined) {
      console.warn(`Could not find DevToolsInstance with id "${id}"`);
      return null;
    }
    if (devtoolsInstance.kind !== FIBER_INSTANCE) {
      // TODO: Handle VirtualInstance.
      return null;
    }
    const fiber = devtoolsInstance.data;

    const {elementType, tag, type} = fiber;

    switch (tag) {
      case ClassComponent:
      case IncompleteClassComponent:
      case IncompleteFunctionComponent:
      case IndeterminateComponent:
      case FunctionComponent:
        return type;
      case ForwardRef:
        return type.render;
      case MemoComponent:
      case SimpleMemoComponent:
        return elementType != null && elementType.type != null
          ? elementType.type
          : type;
      default:
        return null;
    }
  }

  function instanceToSerializedElement(
    instance: DevToolsInstance,
  ): SerializedElement {
    if (instance.kind === FIBER_INSTANCE) {
      const fiber = instance.data;
      return {
        displayName: getDisplayNameForFiber(fiber) || 'Anonymous',
        id: instance.id,
        key: fiber.key,
        type: getElementTypeForFiber(fiber),
      };
    } else {
      const componentInfo = instance.data;
      return {
        displayName: componentInfo.name || 'Anonymous',
        id: instance.id,
        key: componentInfo.key == null ? null : componentInfo.key,
        type: ElementTypeVirtual,
      };
    }
  }

  function getOwnersList(id: number): Array<SerializedElement> | null {
    const devtoolsInstance = idToDevToolsInstanceMap.get(id);
    if (devtoolsInstance === undefined) {
      console.warn(`Could not find DevToolsInstance with id "${id}"`);
      return null;
    }
    const self = instanceToSerializedElement(devtoolsInstance);
    const owners = getOwnersListFromInstance(devtoolsInstance);
    // This is particular API is prefixed with the current instance too for some reason.
    if (owners === null) {
      return [self];
    }
    owners.unshift(self);
    owners.reverse();
    return owners;
  }

  function getOwnersListFromInstance(
    instance: DevToolsInstance,
  ): Array<SerializedElement> | null {
    let owner = getUnfilteredOwner(instance.data);
    if (owner === null) {
      return null;
    }
    const owners: Array<SerializedElement> = [];
    let parentInstance: null | DevToolsInstance = instance.parent;
    while (parentInstance !== null && owner !== null) {
      const ownerInstance = findNearestOwnerInstance(parentInstance, owner);
      if (ownerInstance !== null) {
        owners.push(instanceToSerializedElement(ownerInstance));
        // Get the next owner and keep searching from the previous match.
        owner = getUnfilteredOwner(owner);
        parentInstance = ownerInstance.parent;
      } else {
        break;
      }
    }
    return owners;
  }

  function getUnfilteredOwner(
    owner: ReactComponentInfo | Fiber | null | void,
  ): ReactComponentInfo | Fiber | null {
    if (owner == null) {
      return null;
    }
    if (typeof owner.tag === 'number') {
      const ownerFiber: Fiber = (owner: any); // Refined
      owner = ownerFiber._debugOwner;
    } else {
      const ownerInfo: ReactComponentInfo = (owner: any); // Refined
      owner = ownerInfo.owner;
    }
    while (owner) {
      if (typeof owner.tag === 'number') {
        const ownerFiber: Fiber = (owner: any); // Refined
        if (!shouldFilterFiber(ownerFiber)) {
          return ownerFiber;
        }
        owner = ownerFiber._debugOwner;
      } else {
        const ownerInfo: ReactComponentInfo = (owner: any); // Refined
        if (!shouldFilterVirtual(ownerInfo, null)) {
          return ownerInfo;
        }
        owner = ownerInfo.owner;
      }
    }
    return null;
  }

  function findNearestOwnerInstance(
    parentInstance: null | DevToolsInstance,
    owner: void | null | ReactComponentInfo | Fiber,
  ): null | DevToolsInstance {
    if (owner == null) {
      return null;
    }
    // Search the parent path for any instance that matches this kind of owner.
    while (parentInstance !== null) {
      if (
        parentInstance.data === owner ||
        // Typically both owner and instance.data would refer to the current version of a Fiber
        // but it is possible for memoization to ignore the owner on the JSX. Then the new Fiber
        // isn't propagated down as the new owner. In that case we might match the alternate
        // instead. This is a bit hacky but the fastest check since type casting owner to a Fiber
        // needs a duck type check anyway.
        parentInstance.data === (owner: any).alternate
      ) {
        return parentInstance;
      }
      parentInstance = parentInstance.parent;
    }
    // It is technically possible to create an element and render it in a different parent
    // but this is a weird edge case and it is worth not having to scan the tree or keep
    // a register for every fiber/component info.
    return null;
  }

  // Fast path props lookup for React Native style editor.
  // Could use inspectElementRaw() but that would require shallow rendering hooks components,
  // and could also mess with memoization.
  function getInstanceAndStyle(id: number): InstanceAndStyle {
    let instance = null;
    let style = null;

    const devtoolsInstance = idToDevToolsInstanceMap.get(id);
    if (devtoolsInstance === undefined) {
      console.warn(`Could not find DevToolsInstance with id "${id}"`);
      return {instance, style};
    }
    if (devtoolsInstance.kind !== FIBER_INSTANCE) {
      // TODO: Handle VirtualInstance.
      return {instance, style};
    }

    const fiber = devtoolsInstance.data;
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
        // TODO: If this boundary is filtered it won't have an ID.
        return getFiberIDUnsafe(parent);
      }
      parent = parent.return;
    }
    return null;
  }

  function inspectElementRaw(id: number): InspectedElement | null {
    const devtoolsInstance = idToDevToolsInstanceMap.get(id);
    if (devtoolsInstance === undefined) {
      console.warn(`Could not find DevToolsInstance with id "${id}"`);
      return null;
    }
    if (devtoolsInstance.kind === VIRTUAL_INSTANCE) {
      return inspectVirtualInstanceRaw(devtoolsInstance);
    }
    return inspectFiberInstanceRaw(devtoolsInstance);
  }

  function inspectFiberInstanceRaw(
    fiberInstance: FiberInstance,
  ): InspectedElement | null {
    const fiber = fiberInstance.data;
    if (fiber == null) {
      return null;
    }

    const {
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
      tag === IncompleteFunctionComponent ||
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
      // Detect pre-19 Context Consumers
      (typeSymbol === CONTEXT_NUMBER || typeSymbol === CONTEXT_SYMBOL_STRING) &&
      !(
        // In 19+, CONTEXT_SYMBOL_STRING means a Provider instead.
        // It will be handled in a different branch below.
        // Eventually, this entire branch can be removed.
        (type._context === undefined && type.Provider === type)
      )
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
    } else if (
      // Detect 19+ Context Consumers
      typeSymbol === CONSUMER_SYMBOL_STRING
    ) {
      // This branch is 19+ only, where Context.Provider === Context.
      // NOTE Keep in sync with getDisplayNameForFiber()
      const consumerResolvedContext = type._context;

      // Global context value.
      context = consumerResolvedContext._currentValue || null;

      // Look for overridden value.
      let current = ((fiber: any): Fiber).return;
      while (current !== null) {
        const currentType = current.type;
        const currentTypeSymbol = getTypeSymbol(currentType);
        if (
          // In 19+, these are Context Providers
          currentTypeSymbol === CONTEXT_SYMBOL_STRING
        ) {
          const providerResolvedContext = currentType;
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

    const owners: null | Array<SerializedElement> =
      getOwnersListFromInstance(fiberInstance);

    const isTimedOutSuspense =
      tag === SuspenseComponent && memoizedState !== null;

    let hooks = null;
    if (usesHooks) {
      const originalConsoleMethods: {[string]: $FlowFixMe} = {};

      // Temporarily disable all console logging before re-running the hook.
      for (const method in console) {
        try {
          // $FlowFixMe[invalid-computed-prop]
          originalConsoleMethods[method] = console[method];
          // $FlowFixMe[prop-missing]
          console[method] = () => {};
        } catch (error) {}
      }

      try {
        hooks = inspectHooksOfFiber(fiber, getDispatcherRef(renderer));
      } finally {
        // Restore original console functionality.
        for (const method in originalConsoleMethods) {
          try {
            // $FlowFixMe[prop-missing]
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

    let isErrored = false;
    let targetErrorBoundaryID;
    if (isErrorBoundary(fiber)) {
      // if the current inspected element is an error boundary,
      // either that we want to use it to toggle off error state
      // or that we allow to force error state on it if it's within another
      // error boundary
      //
      // TODO: This flag is a leaked implementation detail. Once we start
      // releasing DevTools in lockstep with React, we should import a function
      // from the reconciler instead.
      const DidCapture = 0b000000000000000000010000000;
      isErrored =
        (fiber.flags & DidCapture) !== 0 ||
        (fiberInstance.flags & FORCE_ERROR) !== 0;
      targetErrorBoundaryID = isErrored
        ? fiberInstance.id
        : getNearestErrorBoundaryID(fiber);
    } else {
      targetErrorBoundaryID = getNearestErrorBoundaryID(fiber);
    }

    const plugins: Plugins = {
      stylex: null,
    };

    if (enableStyleXFeatures) {
      if (memoizedProps != null && memoizedProps.hasOwnProperty('xstyle')) {
        plugins.stylex = getStyleXData(memoizedProps.xstyle);
      }
    }

    let source = null;
    if (canViewSource) {
      source = getSourceForFiberInstance(fiberInstance);
    }

    return {
      id: fiberInstance.id,

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
          (fiberInstance.flags & FORCE_SUSPENSE_FALLBACK) !== 0),

      // Can view component source location.
      canViewSource,
      source,

      // Does the component have legacy context attached to it.
      hasLegacyContext,

      key: key != null ? key : null,

      type: elementType,

      // Inspectable properties.
      // TODO Review sanitization approach for the below inspectable values.
      context,
      hooks,
      props: memoizedProps,
      state: showState ? memoizedState : null,
      errors:
        fiberInstance.errors === null
          ? []
          : Array.from(fiberInstance.errors.entries()),
      warnings:
        fiberInstance.warnings === null
          ? []
          : Array.from(fiberInstance.warnings.entries()),

      // List of owners
      owners,

      rootType,
      rendererPackageName: renderer.rendererPackageName,
      rendererVersion: renderer.version,

      plugins,
    };
  }

  function inspectVirtualInstanceRaw(
    virtualInstance: VirtualInstance,
  ): InspectedElement | null {
    const canViewSource = true;
    const source = getSourceForInstance(virtualInstance);

    const componentInfo = virtualInstance.data;
    const key =
      typeof componentInfo.key === 'string' ? componentInfo.key : null;
    const props = null; // TODO: Track props on ReactComponentInfo;

    const owners: null | Array<SerializedElement> =
      getOwnersListFromInstance(virtualInstance);

    let rootType = null;
    let targetErrorBoundaryID = null;
    let parent = virtualInstance.parent;
    while (parent !== null) {
      if (parent.kind === FIBER_INSTANCE) {
        targetErrorBoundaryID = getNearestErrorBoundaryID(parent.data);
        let current = parent.data;
        while (current.return !== null) {
          current = current.return;
        }
        const fiberRoot = current.stateNode;
        if (fiberRoot != null && fiberRoot._debugRootType !== null) {
          rootType = fiberRoot._debugRootType;
        }
        break;
      }
      parent = parent.parent;
    }

    const plugins: Plugins = {
      stylex: null,
    };

    return {
      id: virtualInstance.id,

      canEditHooks: false,
      canEditFunctionProps: false,

      canEditHooksAndDeletePaths: false,
      canEditHooksAndRenamePaths: false,
      canEditFunctionPropsDeletePaths: false,
      canEditFunctionPropsRenamePaths: false,

      canToggleError: supportsTogglingError && targetErrorBoundaryID != null,
      isErrored: false,
      targetErrorBoundaryID,

      canToggleSuspense: supportsTogglingSuspense,

      // Can view component source location.
      canViewSource,
      source,

      // Does the component have legacy context attached to it.
      hasLegacyContext: false,

      key: key,

      type: ElementTypeVirtual,

      // Inspectable properties.
      // TODO Review sanitization approach for the below inspectable values.
      context: null,
      hooks: null,
      props: props,
      state: null,
      errors:
        virtualInstance.errors === null
          ? []
          : Array.from(virtualInstance.errors.entries()),
      warnings:
        virtualInstance.warnings === null
          ? []
          : Array.from(virtualInstance.warnings.entries()),

      // List of owners
      owners,

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

    const devtoolsInstance = idToDevToolsInstanceMap.get(id);
    if (devtoolsInstance === undefined) {
      console.warn(`Could not find DevToolsInstance with id "${id}"`);
      return;
    }
    if (devtoolsInstance.kind !== FIBER_INSTANCE) {
      // TODO: Handle VirtualInstance.
      return;
    }

    const fiber = devtoolsInstance.data;
    const {elementType, stateNode, tag, type} = fiber;

    switch (tag) {
      case ClassComponent:
      case IncompleteClassComponent:
      case IndeterminateComponent:
        global.$r = stateNode;
        break;
      case IncompleteFunctionComponent:
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

  function getSerializedElementValueByPath(
    id: number,
    path: Array<string | number>,
  ): ?string {
    if (isMostRecentlyInspectedElement(id)) {
      const valueToCopy = getInObject(
        ((mostRecentlyInspectedElement: any): InspectedElement),
        path,
      );

      return serializeToString(valueToCopy);
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
          const componentName = getDisplayNameForElementID(id);
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
    // $FlowFixMe[prop-missing] found when upgrading Flow
    cleanedInspectedElement.context = cleanForBridge(
      cleanedInspectedElement.context,
      createIsPathAllowed('context', null),
    );
    // $FlowFixMe[prop-missing] found when upgrading Flow
    cleanedInspectedElement.hooks = cleanForBridge(
      cleanedInspectedElement.hooks,
      createIsPathAllowed('hooks', 'hooks'),
    );
    // $FlowFixMe[prop-missing] found when upgrading Flow
    cleanedInspectedElement.props = cleanForBridge(
      cleanedInspectedElement.props,
      createIsPathAllowed('props', null),
    );
    // $FlowFixMe[prop-missing] found when upgrading Flow
    cleanedInspectedElement.state = cleanForBridge(
      cleanedInspectedElement.state,
      createIsPathAllowed('state', null),
    );

    return {
      id,
      responseID: requestID,
      type: 'full-data',
      // $FlowFixMe[prop-missing] found when upgrading Flow
      value: cleanedInspectedElement,
    };
  }

  function logElementToConsole(id: number) {
    const result = isMostRecentlyInspectedElementCurrent(id)
      ? mostRecentlyInspectedElement
      : inspectElementRaw(id);
    if (result === null) {
      console.warn(`Could not find DevToolsInstance with id "${id}"`);
      return;
    }

    const displayName = getDisplayNameForElementID(id);

    const supportsGroup = typeof console.groupCollapsed === 'function';
    if (supportsGroup) {
      console.groupCollapsed(
        `[Click to expand] %c<${displayName || 'Component'} />`,
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
    const hostInstances = findHostInstancesForElementID(id);
    if (hostInstances !== null) {
      console.log('Nodes:', hostInstances);
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
    const devtoolsInstance = idToDevToolsInstanceMap.get(id);
    if (devtoolsInstance === undefined) {
      console.warn(`Could not find DevToolsInstance with id "${id}"`);
      return;
    }
    if (devtoolsInstance.kind !== FIBER_INSTANCE) {
      // TODO: Handle VirtualInstance.
      return;
    }
    const fiber = devtoolsInstance.data;
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
    const devtoolsInstance = idToDevToolsInstanceMap.get(id);
    if (devtoolsInstance === undefined) {
      console.warn(`Could not find DevToolsInstance with id "${id}"`);
      return;
    }
    if (devtoolsInstance.kind !== FIBER_INSTANCE) {
      // TODO: Handle VirtualInstance.
      return;
    }
    const fiber = devtoolsInstance.data;
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
    const devtoolsInstance = idToDevToolsInstanceMap.get(id);
    if (devtoolsInstance === undefined) {
      console.warn(`Could not find DevToolsInstance with id "${id}"`);
      return;
    }
    if (devtoolsInstance.kind !== FIBER_INSTANCE) {
      // TODO: Handle VirtualInstance.
      return;
    }
    const fiber = devtoolsInstance.data;
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

  type CommitProfilingData = {
    changeDescriptions: Map<number, ChangeDescription> | null,
    commitTime: number,
    durations: Array<number>,
    effectDuration: number | null,
    maxActualDuration: number,
    passiveEffectDuration: number | null,
    priorityLevel: string | null,
    updaters: Array<SerializedElement> | null,
  };

  type CommitProfilingMetadataMap = Map<number, Array<CommitProfilingData>>;
  type DisplayNamesByRootID = Map<number, string>;

  let currentCommitProfilingMetadata: CommitProfilingData | null = null;
  let displayNamesByRootID: DisplayNamesByRootID | null = null;
  let idToContextsMap: Map<number, any> | null = null;
  let initialTreeBaseDurationsMap: Map<number, Array<[number, number]>> | null =
    null;
  let isProfiling: boolean = false;
  let profilingStartTime: number = 0;
  let recordChangeDescriptions: boolean = false;
  let rootToCommitProfilingMetadataMap: CommitProfilingMetadataMap | null =
    null;

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

        const displayName =
          (displayNamesByRootID !== null && displayNamesByRootID.get(rootID)) ||
          'Unknown';

        const initialTreeBaseDurations: Array<[number, number]> =
          (initialTreeBaseDurationsMap !== null &&
            initialTreeBaseDurationsMap.get(rootID)) ||
          [];

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

  function snapshotTreeBaseDurations(
    instance: DevToolsInstance,
    target: Array<[number, number]>,
  ) {
    // We don't need to convert milliseconds to microseconds in this case,
    // because the profiling summary is JSON serialized.
    target.push([instance.id, instance.treeBaseDuration]);
    for (
      let child = instance.firstChild;
      child !== null;
      child = child.nextSibling
    ) {
      snapshotTreeBaseDurations(child, target);
    }
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
    initialTreeBaseDurationsMap = new Map();
    idToContextsMap = new Map();

    hook.getFiberRoots(rendererID).forEach(root => {
      const rootInstance = rootToFiberInstanceMap.get(root);
      if (rootInstance === undefined) {
        throw new Error(
          'Expected the root instance to already exist when starting profiling',
        );
      }
      const rootID = rootInstance.id;
      ((displayNamesByRootID: any): DisplayNamesByRootID).set(
        rootID,
        getDisplayNameForRoot(root.current),
      );
      const initialTreeBaseDurations: Array<[number, number]> = [];
      snapshotTreeBaseDurations(rootInstance, initialTreeBaseDurations);
      (initialTreeBaseDurationsMap: any).set(rootID, initialTreeBaseDurations);

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

  let forceErrorCount = 0;

  function shouldErrorFiberAccordingToMap(fiber: any): null | boolean {
    if (typeof setErrorHandler !== 'function') {
      throw new Error(
        'Expected overrideError() to not get called for earlier React versions.',
      );
    }

    let fiberInstance = fiberToFiberInstanceMap.get(fiber);
    if (fiberInstance === undefined && fiber.alternate !== null) {
      fiberInstance = fiberToFiberInstanceMap.get(fiber.alternate);
    }
    if (fiberInstance === undefined) {
      return null;
    }

    if (fiberInstance.flags & FORCE_ERROR_RESET) {
      // TRICKY overrideError adds entries to this Map,
      // so ideally it would be the method that clears them too,
      // but that would break the functionality of the feature,
      // since DevTools needs to tell React to act differently than it normally would
      // (don't just re-render the failed boundary, but reset its errored state too).
      // So we can only clear it after telling React to reset the state.
      // Technically this is premature and we should schedule it for later,
      // since the render could always fail without committing the updated error boundary,
      // but since this is a DEV-only feature, the simplicity is worth the trade off.
      forceErrorCount--;
      fiberInstance.flags &= ~FORCE_ERROR_RESET;
      if (forceErrorCount === 0) {
        // Last override is gone. Switch React back to fast path.
        setErrorHandler(shouldErrorFiberAlwaysNull);
      }
      return false;
    } else if (fiberInstance.flags & FORCE_ERROR) {
      return true;
    } else {
      return null;
    }
  }

  function overrideError(id: number, forceError: boolean) {
    if (
      typeof setErrorHandler !== 'function' ||
      typeof scheduleUpdate !== 'function'
    ) {
      throw new Error(
        'Expected overrideError() to not get called for earlier React versions.',
      );
    }

    const devtoolsInstance = idToDevToolsInstanceMap.get(id);
    if (devtoolsInstance === undefined) {
      return;
    }
    if ((devtoolsInstance.flags & (FORCE_ERROR | FORCE_ERROR_RESET)) === 0) {
      forceErrorCount++;
      if (forceErrorCount === 1) {
        // First override is added. Switch React to slower path.
        setErrorHandler(shouldErrorFiberAccordingToMap);
      }
    }
    devtoolsInstance.flags &= forceError ? ~FORCE_ERROR_RESET : ~FORCE_ERROR;
    devtoolsInstance.flags |= forceError ? FORCE_ERROR : FORCE_ERROR_RESET;

    if (devtoolsInstance.kind === FIBER_INSTANCE) {
      const fiber = devtoolsInstance.data;
      scheduleUpdate(fiber);
    } else {
      // TODO: Handle VirtualInstance.
    }
  }

  function shouldSuspendFiberAlwaysFalse() {
    return false;
  }

  let forceFallbackCount = 0;

  function shouldSuspendFiberAccordingToSet(fiber: any) {
    let fiberInstance = fiberToFiberInstanceMap.get(fiber);
    if (fiberInstance === undefined && fiber.alternate !== null) {
      fiberInstance = fiberToFiberInstanceMap.get(fiber.alternate);
    }
    return (
      fiberInstance !== undefined &&
      (fiberInstance.flags & FORCE_SUSPENSE_FALLBACK) !== 0
    );
  }

  function overrideSuspense(id: number, forceFallback: boolean) {
    if (
      typeof setSuspenseHandler !== 'function' ||
      typeof scheduleUpdate !== 'function'
    ) {
      throw new Error(
        'Expected overrideSuspense() to not get called for earlier React versions.',
      );
    }
    const devtoolsInstance = idToDevToolsInstanceMap.get(id);
    if (devtoolsInstance === undefined) {
      return;
    }

    if (forceFallback) {
      if ((devtoolsInstance.flags & FORCE_SUSPENSE_FALLBACK) === 0) {
        devtoolsInstance.flags |= FORCE_SUSPENSE_FALLBACK;
        forceFallbackCount++;
        if (forceFallbackCount === 1) {
          // First override is added. Switch React to slower path.
          setSuspenseHandler(shouldSuspendFiberAccordingToSet);
        }
      }
    } else {
      if ((devtoolsInstance.flags & FORCE_SUSPENSE_FALLBACK) !== 0) {
        devtoolsInstance.flags &= ~FORCE_SUSPENSE_FALLBACK;
        forceFallbackCount--;
        if (forceFallbackCount === 0) {
          // Last override is gone. Switch React back to fast path.
          setSuspenseHandler(shouldSuspendFiberAlwaysFalse);
        }
      }
    }

    if (devtoolsInstance.kind === FIBER_INSTANCE) {
      const fiber = devtoolsInstance.data;
      scheduleUpdate(fiber);
    } else {
      // TODO: Handle VirtualInstance.
    }
  }

  // Remember if we're trying to restore the selection after reload.
  // In that case, we'll do some extra checks for matching mounts.
  let trackedPath: Array<PathFrame> | null = null;
  let trackedPathMatchFiber: Fiber | null = null; // This is the deepest unfiltered match of a Fiber.
  let trackedPathMatchInstance: DevToolsInstance | null = null; // This is the deepest matched filtered Instance.
  let trackedPathMatchDepth = -1;
  let mightBeOnTrackedPath = false;

  function setTrackedPath(path: Array<PathFrame> | null) {
    if (path === null) {
      trackedPathMatchFiber = null;
      trackedPathMatchInstance = null;
      trackedPathMatchDepth = -1;
      mightBeOnTrackedPath = false;
    }
    trackedPath = path;
  }

  // We call this before traversing a new mount.
  // It remembers whether this Fiber is the next best match for tracked path.
  // The return value signals whether we should keep matching siblings or not.
  function updateTrackedPathStateBeforeMount(
    fiber: Fiber,
    fiberInstance: null | FiberInstance,
  ): boolean {
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
      // $FlowFixMe[incompatible-use] found when upgrading Flow
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
        if (fiberInstance !== null) {
          trackedPathMatchInstance = fiberInstance;
        }
        trackedPathMatchDepth++;
        // Are we out of frames to match?
        // $FlowFixMe[incompatible-use] found when upgrading Flow
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
    if (trackedPathMatchFiber === null && fiberInstance === null) {
      // We're now looking for a Virtual Instance. It might be inside filtered Fibers
      // so we keep looking below.
      return true;
    }
    // This Fiber's parent is on the path, but this Fiber itself isn't.
    // There's no need to check its children--they won't be on the path either.
    mightBeOnTrackedPath = false;
    // However, one of its siblings may be on the path so keep searching.
    return true;
  }

  function updateVirtualTrackedPathStateBeforeMount(
    virtualInstance: VirtualInstance,
    parentInstance: null | DevToolsInstance,
  ): boolean {
    if (trackedPath === null || !mightBeOnTrackedPath) {
      // Fast path: there's nothing to track so do nothing and ignore siblings.
      return false;
    }
    // Check if we've matched our nearest unfiltered parent so far.
    if (trackedPathMatchInstance === parentInstance) {
      const actualFrame = getVirtualPathFrame(virtualInstance);
      // $FlowFixMe[incompatible-use] found when upgrading Flow
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
        trackedPathMatchFiber = null; // Don't bother looking in Fibers anymore. We're deeper now.
        trackedPathMatchInstance = virtualInstance;
        trackedPathMatchDepth++;
        // Are we out of frames to match?
        // $FlowFixMe[incompatible-use] found when upgrading Flow
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
    if (trackedPathMatchFiber !== null) {
      // We're still looking for a Fiber which might be underneath this instance.
      return true;
    }
    // This Instance's parent is on the path, but this Instance itself isn't.
    // There's no need to check its children--they won't be on the path either.
    mightBeOnTrackedPath = false;
    // However, one of its siblings may be on the path so keep searching.
    return true;
  }

  function updateTrackedPathStateAfterMount(
    mightSiblingsBeOnTrackedPath: boolean,
  ) {
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
    const name = pseudoKey.slice(0, pseudoKey.lastIndexOf(':'));
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
        const rootInstance = rootToFiberInstanceMap.get(fiber.stateNode);
        if (rootInstance === undefined) {
          throw new Error(
            'Expected the root instance to exist when computing a path',
          );
        }
        const pseudoKey = rootPseudoKeys.get(rootInstance.id);
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

  function getVirtualPathFrame(virtualInstance: VirtualInstance): PathFrame {
    return {
      displayName: virtualInstance.data.name || '',
      key: virtualInstance.data.key == null ? null : virtualInstance.data.key,
      index: -1, // We use -1 to indicate that this is a virtual path frame.
    };
  }

  // Produces a serializable representation that does a best effort
  // of identifying a particular Fiber between page reloads.
  // The return path will contain Fibers that are "invisible" to the store
  // because their keys and indexes are important to restoring the selection.
  function getPathForElement(id: number): Array<PathFrame> | null {
    const devtoolsInstance = idToDevToolsInstanceMap.get(id);
    if (devtoolsInstance === undefined) {
      return null;
    }

    const keyPath = [];

    let inst: DevToolsInstance = devtoolsInstance;
    while (inst.kind === VIRTUAL_INSTANCE) {
      keyPath.push(getVirtualPathFrame(inst));
      if (inst.parent === null) {
        // This is a bug but non-essential. We should've found a root instance.
        return null;
      }
      inst = inst.parent;
    }

    let fiber: null | Fiber = inst.data;
    while (fiber !== null) {
      // $FlowFixMe[incompatible-call] found when upgrading Flow
      keyPath.push(getPathFrame(fiber));
      // $FlowFixMe[incompatible-use] found when upgrading Flow
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
    if (trackedPathMatchInstance === null) {
      // We didn't find anything.
      return null;
    }
    return {
      id: trackedPathMatchInstance.id,
      // $FlowFixMe[incompatible-use] found when upgrading Flow
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

  function hasElementWithId(id: number): boolean {
    return idToDevToolsInstanceMap.has(id);
  }

  function getSourceForFiberInstance(
    fiberInstance: FiberInstance,
  ): Source | null {
    const unresolvedSource = fiberInstance.source;
    if (
      unresolvedSource !== null &&
      typeof unresolvedSource === 'object' &&
      !isError(unresolvedSource)
    ) {
      // $FlowFixMe: isError should have refined it.
      return unresolvedSource;
    }
    const dispatcherRef = getDispatcherRef(renderer);
    const stackFrame =
      dispatcherRef == null
        ? null
        : getSourceLocationByFiber(
            ReactTypeOfWork,
            fiberInstance.data,
            dispatcherRef,
          );
    if (stackFrame === null) {
      // If we don't find a source location by throwing, try to get one
      // from an owned child if possible. This is the same branch as
      // for virtual instances.
      return getSourceForInstance(fiberInstance);
    }
    const source = parseSourceFromComponentStack(stackFrame);
    fiberInstance.source = source;
    return source;
  }

  function getSourceForInstance(instance: DevToolsInstance): Source | null {
    let unresolvedSource = instance.source;
    if (unresolvedSource === null) {
      // We don't have any source yet. We can try again later in case an owned child mounts later.
      // TODO: We won't have any information here if the child is filtered.
      return null;
    }

    // If we have the debug stack (the creation stack of the JSX) for any owned child of this
    // component, then at the bottom of that stack will be a stack frame that is somewhere within
    // the component's function body. Typically it would be the callsite of the JSX unless there's
    // any intermediate utility functions. This won't point to the top of the component function
    // but it's at least somewhere within it.
    if (isError(unresolvedSource)) {
      unresolvedSource = formatOwnerStack((unresolvedSource: any));
    }
    if (typeof unresolvedSource === 'string') {
      const idx = unresolvedSource.lastIndexOf('\n');
      const lastLine =
        idx === -1 ? unresolvedSource : unresolvedSource.slice(idx + 1);
      return (instance.source = parseSourceFromComponentStack(lastLine));
    }

    // $FlowFixMe: refined.
    return unresolvedSource;
  }

  return {
    cleanup,
    clearErrorsAndWarnings,
    clearErrorsForElementID,
    clearWarningsForElementID,
    getSerializedElementValueByPath,
    deletePath,
    findHostInstancesForElementID,
    flushInitialOperations,
    getBestMatchForTrackedPath,
    getDisplayNameForElementID,
    getNearestMountedDOMNode,
    getElementIDForHostInstance,
    getInstanceAndStyle,
    getOwnersList,
    getPathForElement,
    getProfilingData,
    handleCommitFiberRoot,
    handleCommitFiberUnmount,
    handlePostCommitFiberRoot,
    hasElementWithId,
    inspectElement,
    logElementToConsole,
    patchConsoleForStrictMode,
    getElementAttributeByPath,
    getElementSourceFunctionById,
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
    getEnvironmentNames,
  };
}
