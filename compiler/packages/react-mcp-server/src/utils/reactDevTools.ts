/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

// Define ReactComponentInfo type directly to avoid import issues
type ReactComponentInfo = {
  name: string;
  [key: string]: any;
};

// Constants for instance types
const FIBER_INSTANCE = 0;
const FILTERED_FIBER_INSTANCE = 2;
const VIRTUAL_INSTANCE = 1;

// Only keeping the constants needed for tree traversal

// Fiber tags - only keeping the ones used in getDisplayNameForFiber
const FunctionComponent = 0;
const ClassComponent = 1;
const IndeterminateComponent = 2;
const HostRoot = 3;
const HostPortal = 4;
const HostComponent = 5;
const HostText = 6;
const Fragment = 7;
const ForwardRef = 11;
const Profiler = 12;
const SuspenseComponent = 13;
const MemoComponent = 14;
const SimpleMemoComponent = 15;
const LazyComponent = 16;
const IncompleteClassComponent = 17;
const SuspenseListComponent = 19;
const ScopeComponent = 21;
const OffscreenComponent = 22;
const LegacyHiddenComponent = 23;
const CacheComponent = 24;
const TracingMarkerComponent = 25;
const HostHoistable = 26;
const HostSingleton = 27;
const IncompleteFunctionComponent = 28;
const Throw = 29;
const ViewTransitionComponent = 30;
const ActivityComponent = 31;

// Symbol constants
const CONCURRENT_MODE_NUMBER = 0xeacf;
const CONCURRENT_MODE_SYMBOL_STRING = 'Symbol(react.concurrent_mode)';
const DEPRECATED_ASYNC_MODE_SYMBOL_STRING = 'Symbol(react.async_mode)';
const PROVIDER_NUMBER = 0xeacd;
const PROVIDER_SYMBOL_STRING = 'Symbol(react.provider)';
const CONTEXT_NUMBER = 0xeace;
const CONTEXT_SYMBOL_STRING = 'Symbol(react.context)';
const SERVER_CONTEXT_SYMBOL_STRING = 'Symbol(react.server_context)';
const CONSUMER_SYMBOL_STRING = 'Symbol(react.consumer)';
const STRICT_MODE_NUMBER = 0xeacc;
const STRICT_MODE_SYMBOL_STRING = 'Symbol(react.strict_mode)';
const PROFILER_NUMBER = 0xead2;
const PROFILER_SYMBOL_STRING = 'Symbol(react.profiler)';
const SCOPE_NUMBER = 0xead7;
const SCOPE_SYMBOL_STRING = 'Symbol(react.scope)';
// Define a string key for REACT_MEMO_CACHE_SENTINEL to fix type issues
const REACT_MEMO_CACHE_SENTINEL = 'REACT_MEMO_CACHE_SENTINEL';

// Type definitions
type Fiber = {
  tag: number;
  elementType: any;
  type: any;
  stateNode: any;
  memoizedProps: any;
  memoizedState: any;
  updateQueue: any;
  key: string | null;
  _debugID?: number;
  _debugOwner?: any;
  _debugStack?: any;
  child: Fiber | null;
  sibling: Fiber | null;
};

type Source = {
  fileName: string;
  lineNumber: number;
  columnNumber?: number;
};

type FiberInstance = {
  kind: 0;
  id: number;
  parent: null | DevToolsInstance;
  firstChild: null | DevToolsInstance;
  nextSibling: null | DevToolsInstance;
  source: null | string | Error | Source;
  logCount: number;
  treeBaseDuration: number;
  data: Fiber;
};

type FilteredFiberInstance = {
  kind: 2;
  id: number;
  parent: null | DevToolsInstance;
  firstChild: null | DevToolsInstance;
  nextSibling: null | DevToolsInstance;
  source: null | string | Error | Source;
  logCount: number;
  treeBaseDuration: number;
  data: Fiber;
};

type VirtualInstance = {
  kind: 1;
  id: number;
  parent: null | DevToolsInstance;
  firstChild: null | DevToolsInstance;
  nextSibling: null | DevToolsInstance;
  source: null | string | Error | Source;
  logCount: number;
  treeBaseDuration: number;
  data: ReactComponentInfo;
};

type DevToolsInstance = FiberInstance | FilteredFiberInstance | VirtualInstance;

// Helper functions
function getUID(): number {
  return Math.floor(Math.random() * 1000000);
}

function getTypeSymbol(type: any): symbol | number | string | null {
  const symbolOrNumber =
    typeof type === 'object' && type !== null ? type.$$typeof : null;
  return symbolOrNumber;
}

function resolveFiberType(type: any): any {
  return type.type || type;
}

function getDisplayName(type: any): string | null {
  if (type == null) {
    return null;
  }

  let displayName = null;
  if (typeof type.displayName === 'string') {
    displayName = type.displayName;
  } else if (typeof type.name === 'string' && type.name !== '') {
    displayName = type.name;
  }

  return displayName || 'Anonymous';
}

function getWrappedDisplayName(
  outerType: any,
  innerType: any,
  wrapperName: string,
  fallbackName: string,
): string {
  const displayName = getDisplayName(innerType);
  return displayName ? `${wrapperName}(${displayName})` : fallbackName;
}

// Instance creation functions
function createFiberInstance(fiber: Fiber): FiberInstance {
  return {
    kind: FIBER_INSTANCE,
    id: getUID(),
    parent: null,
    firstChild: null,
    nextSibling: null,
    source: null,
    logCount: 0,
    treeBaseDuration: 0,
    data: fiber,
  };
}

function createFilteredFiberInstance(fiber: Fiber): FilteredFiberInstance {
  return {
    kind: FILTERED_FIBER_INSTANCE,
    id: 0,
    parent: null,
    firstChild: null,
    nextSibling: null,
    source: null,
    logCount: 0,
    treeBaseDuration: 0,
    data: fiber,
  };
}

function createVirtualInstance(
  debugEntry: ReactComponentInfo,
): VirtualInstance {
  return {
    kind: VIRTUAL_INSTANCE,
    id: getUID(),
    parent: null,
    firstChild: null,
    nextSibling: null,
    source: null,
    logCount: 0,
    treeBaseDuration: 0,
    data: debugEntry,
  };
}

// Main functions for tree traversal
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
    (fiber.updateQueue?.memoCache != null ||
      (Array.isArray(fiber.memoizedState?.memoizedState) &&
        fiber.memoizedState.memoizedState[0]?.[REACT_MEMO_CACHE_SENTINEL]) ||
      fiber.memoizedState?.memoizedState?.[REACT_MEMO_CACHE_SENTINEL])
  ) {
    const displayNameWithoutForgetWrapper = getDisplayNameForFiber(fiber, true);
    if (displayNameWithoutForgetWrapper == null) {
      return null;
    }

    return `Forget(${displayNameWithoutForgetWrapper})`;
  }

  switch (tag) {
    case ActivityComponent:
      return 'Activity';
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
      return 'Lazy';
    case MemoComponent:
    case SimpleMemoComponent:
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
    case ViewTransitionComponent:
      return 'ViewTransition';
    case Throw:
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
          resolvedContext = fiber.type._context || fiber.type.context;
          return `${resolvedContext.displayName || 'Context'}.Provider`;
        case CONTEXT_NUMBER:
        case CONTEXT_SYMBOL_STRING:
        case SERVER_CONTEXT_SYMBOL_STRING:
          if (
            fiber.type._context === undefined &&
            fiber.type.Provider === fiber.type
          ) {
            resolvedContext = fiber.type;
            return `${resolvedContext.displayName || 'Context'}.Provider`;
          }
          resolvedContext = fiber.type._context || fiber.type;
          return `${resolvedContext.displayName || 'Context'}.Consumer`;
        case CONSUMER_SYMBOL_STRING:
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
          return null;
      }
  }
}

function debugTree(instance: DevToolsInstance, indent: number = 0) {
  const name =
    (instance.kind !== VIRTUAL_INSTANCE
      ? getDisplayNameForFiber(instance.data)
      : instance.data.name) || '';
  console.log(
    '  '.repeat(indent) +
      '- ' +
      (instance.kind === FILTERED_FIBER_INSTANCE ? 0 : instance.id) +
      ' (' +
      name +
      ')',
    'parent',
    instance.parent === null
      ? ' '
      : instance.parent.kind === FILTERED_FIBER_INSTANCE
        ? 0
        : instance.parent.id,
    'next',
    instance.nextSibling === null ? ' ' : instance.nextSibling.id,
  );
  let child = instance.firstChild;
  while (child !== null) {
    debugTree(child, indent + 1);
    child = child.nextSibling;
  }
}

// Function to insert a child into the tree
function insertChild(child: DevToolsInstance) {
  if (child.parent !== null) {
    throw new Error('Child already has a parent');
  }

  child.parent = null;
  child.nextSibling = null;

  return child;
}

// Export the functions needed for tree traversal
export {
  debugTree,
  getDisplayNameForFiber,
  createFiberInstance,
  createFilteredFiberInstance,
  createVirtualInstance,
  insertChild,
  FIBER_INSTANCE,
  FILTERED_FIBER_INSTANCE,
  VIRTUAL_INSTANCE,
};
