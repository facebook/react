/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import {gte} from 'semver';
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
} from 'react-devtools-shared/src/types';
import {
  getDisplayName,
  getDefaultComponentFilters,
  getInObject,
  getUID,
  setInObject,
  utfEncodeString,
} from 'react-devtools-shared/src/utils';
import {sessionStorageGetItem} from 'react-devtools-shared/src/storage';
import {cleanForBridge, copyToClipboard, copyWithSet} from './utils';
import {
  __DEBUG__,
  SESSION_STORAGE_RELOAD_AND_PROFILE_KEY,
  SESSION_STORAGE_RECORD_CHANGE_DESCRIPTIONS_KEY,
  TREE_OPERATION_ADD,
  TREE_OPERATION_REMOVE,
  TREE_OPERATION_REORDER_CHILDREN,
  TREE_OPERATION_UPDATE_TREE_BASE_DURATION,
} from '../constants';
import {inspectHooksOfFiber} from 'react-debug-tools';
import {
  patch as patchConsole,
  registerRenderer as registerRendererWithConsole,
} from './console';

import type {Fiber} from 'react-reconciler/src/ReactFiber';
import type {
  ChangeDescription,
  CommitDataBackend,
  DevToolsHook,
  InspectedElement,
  InspectedElementPayload,
  InstanceAndStyle,
  NativeType,
  Owner,
  PathFrame,
  PathMatch,
  ProfilingDataBackend,
  ProfilingDataForRootBackend,
  ReactRenderer,
  RendererInterface,
} from './types';
import type {Interaction} from 'react-devtools-shared/src/devtools/views/Profiler/types';
import type {
  ComponentFilter,
  ElementType,
} from 'react-devtools-shared/src/types';

type getDisplayNameForFiberType = (fiber: Fiber) => string | null;
type getTypeSymbolType = (type: any) => Symbol | number;

type ReactSymbolsType = {|
  CONCURRENT_MODE_NUMBER: number,
  CONCURRENT_MODE_SYMBOL_STRING: string,
  DEPRECATED_ASYNC_MODE_SYMBOL_STRING: string,
  CONTEXT_CONSUMER_NUMBER: number,
  CONTEXT_CONSUMER_SYMBOL_STRING: string,
  CONTEXT_PROVIDER_NUMBER: number,
  CONTEXT_PROVIDER_SYMBOL_STRING: string,
  FORWARD_REF_NUMBER: number,
  FORWARD_REF_SYMBOL_STRING: string,
  MEMO_NUMBER: number,
  MEMO_SYMBOL_STRING: string,
  PROFILER_NUMBER: number,
  PROFILER_SYMBOL_STRING: string,
  STRICT_MODE_NUMBER: number,
  STRICT_MODE_SYMBOL_STRING: string,
  SCOPE_NUMBER: number,
  SCOPE_SYMBOL_STRING: string,
|};

type ReactPriorityLevelsType = {|
  ImmediatePriority: number,
  UserBlockingPriority: number,
  NormalPriority: number,
  LowPriority: number,
  IdlePriority: number,
  NoPriority: number,
|};

type ReactTypeOfWorkType = {|
  ClassComponent: number,
  ContextConsumer: number,
  ContextProvider: number,
  CoroutineComponent: number,
  CoroutineHandlerPhase: number,
  DehydratedSuspenseComponent: number,
  ForwardRef: number,
  Fragment: number,
  FunctionComponent: number,
  HostComponent: number,
  HostPortal: number,
  HostRoot: number,
  HostText: number,
  IncompleteClassComponent: number,
  IndeterminateComponent: number,
  LazyComponent: number,
  MemoComponent: number,
  Mode: number,
  Profiler: number,
  SimpleMemoComponent: number,
  SuspenseComponent: number,
  SuspenseListComponent: number,
  YieldComponent: number,
|};

type ReactTypeOfSideEffectType = {|
  NoEffect: number,
  PerformedWork: number,
  Placement: number,
|};

// Some environments (e.g. React Native / Hermes) don't support the performace API yet.
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
  ReactSymbols: ReactSymbolsType,
  ReactTypeOfSideEffect: ReactTypeOfSideEffectType,
  ReactTypeOfWork: ReactTypeOfWorkType,
|} {
  const ReactSymbols: ReactSymbolsType = {
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
    SCOPE_NUMBER: 0xead7,
    SCOPE_SYMBOL_STRING: 'Symbol(react.scope)',
  };

  const ReactTypeOfSideEffect: ReactTypeOfSideEffectType = {
    NoEffect: 0b00,
    PerformedWork: 0b01,
    Placement: 0b10,
  };

  // **********************************************************
  // The section below is copied from files in React repo.
  // Keep it in sync, and add version guards if it changes.
  //
  // Technically these priority levels are invalid for versions before 16.9,
  // but 16.9 is the first version to report priority level to DevTools,
  // so we can avoid checking for earlier versions and support pre-16.9 canary releases in the process.
  const ReactPriorityLevels: ReactPriorityLevelsType = {
    ImmediatePriority: 99,
    UserBlockingPriority: 98,
    NormalPriority: 97,
    LowPriority: 96,
    IdlePriority: 95,
    NoPriority: 90,
  };

  let ReactTypeOfWork: ReactTypeOfWorkType = ((null: any): ReactTypeOfWorkType);

  // **********************************************************
  // The section below is copied from files in React repo.
  // Keep it in sync, and add version guards if it changes.
  if (gte(version, '16.6.0-beta.0')) {
    ReactTypeOfWork = {
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
      MemoComponent: 14,
      Mode: 8,
      Profiler: 12,
      SimpleMemoComponent: 15,
      SuspenseComponent: 13,
      SuspenseListComponent: 19, // Experimental
      YieldComponent: -1, // Removed
    };
  } else if (gte(version, '16.4.3-alpha')) {
    ReactTypeOfWork = {
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
      MemoComponent: -1, // Doesn't exist yet
      Mode: 10,
      Profiler: 15,
      SimpleMemoComponent: -1, // Doesn't exist yet
      SuspenseComponent: 16,
      SuspenseListComponent: -1, // Doesn't exist yet
      YieldComponent: -1, // Removed
    };
  } else {
    ReactTypeOfWork = {
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
      MemoComponent: -1, // Doesn't exist yet
      Mode: 11,
      Profiler: 15,
      SimpleMemoComponent: -1, // Doesn't exist yet
      SuspenseComponent: 16,
      SuspenseListComponent: -1, // Doesn't exist yet
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
    MemoComponent,
    SimpleMemoComponent,
    SuspenseComponent,
    SuspenseListComponent,
  } = ReactTypeOfWork;

  const {
    CONCURRENT_MODE_NUMBER,
    CONCURRENT_MODE_SYMBOL_STRING,
    DEPRECATED_ASYNC_MODE_SYMBOL_STRING,
    CONTEXT_PROVIDER_NUMBER,
    CONTEXT_PROVIDER_SYMBOL_STRING,
    CONTEXT_CONSUMER_NUMBER,
    CONTEXT_CONSUMER_SYMBOL_STRING,
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
  } = ReactSymbols;

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
    const {type, tag} = fiber;

    let resolvedType = type;
    if (typeof type === 'object' && type !== null) {
      resolvedType = resolveFiberType(type);
    }

    let resolvedContext: any = null;

    switch (tag) {
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
        return null;
      case HostComponent:
        return type;
      case HostPortal:
      case HostText:
      case Fragment:
        return null;
      case MemoComponent:
      case SimpleMemoComponent:
        return getDisplayName(resolvedType, 'Anonymous');
      case SuspenseComponent:
        return 'Suspense';
      case SuspenseListComponent:
        return 'SuspenseList';
      default:
        const typeSymbol = getTypeSymbol(type);

        switch (typeSymbol) {
          case CONCURRENT_MODE_NUMBER:
          case CONCURRENT_MODE_SYMBOL_STRING:
          case DEPRECATED_ASYNC_MODE_SYMBOL_STRING:
            return null;
          case CONTEXT_PROVIDER_NUMBER:
          case CONTEXT_PROVIDER_SYMBOL_STRING:
            // 16.3.0 exposed the context object as "context"
            // PR #12501 changed it to "_context" for 16.3.1+
            // NOTE Keep in sync with inspectElementRaw()
            resolvedContext = fiber.type._context || fiber.type.context;
            return `${resolvedContext.displayName || 'Context'}.Provider`;
          case CONTEXT_CONSUMER_NUMBER:
          case CONTEXT_CONSUMER_SYMBOL_STRING:
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
    ReactSymbols,
    ReactTypeOfSideEffect,
  };
}

export function attach(
  hook: DevToolsHook,
  rendererID: number,
  renderer: ReactRenderer,
  global: Object,
): RendererInterface {
  const {
    getDisplayNameForFiber,
    getTypeSymbol,
    ReactPriorityLevels,
    ReactTypeOfWork,
    ReactSymbols,
    ReactTypeOfSideEffect,
  } = getInternalReactConstants(renderer.version);
  const {NoEffect, PerformedWork, Placement} = ReactTypeOfSideEffect;
  const {
    FunctionComponent,
    ClassComponent,
    ContextConsumer,
    DehydratedSuspenseComponent,
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
    SuspenseListComponent,
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

  // Patching the console enables DevTools to do a few useful things:
  // * Append component stacks to warnings and error messages
  // * Disable logging during re-renders to inspect hooks (see inspectHooksOfFiber)
  //
  // Don't patch in test environments because we don't want to interfere with Jest's own console overrides.
  if (process.env.NODE_ENV !== 'test') {
    registerRendererWithConsole(renderer);

    // The renderer interface can't read this preference directly,
    // because it is stored in localStorage within the context of the extension.
    // It relies on the extension to pass the preference through via the global.
    if (window.__REACT_DEVTOOLS_APPEND_COMPONENT_STACK__ !== false) {
      patchConsole();
    }
  }

  const debug = (name: string, fiber: Fiber, parentFiber: ?Fiber): void => {
    if (__DEBUG__) {
      const displayName = getDisplayNameForFiber(fiber) || 'null';
      const parentDisplayName =
        (parentFiber != null && getDisplayNameForFiber(parentFiber)) || 'null';
      // NOTE: calling getFiberID or getPrimaryFiber is unsafe here
      // because it will put them in the map. For now, we'll omit them.
      // TODO: better debugging story for this.
      console.log(
        `[renderer] %c${name} %c${displayName} %c${
          parentFiber ? parentDisplayName : ''
        }`,
        'color: red; font-weight: bold;',
        'color: blue;',
        'color: purple;',
      );
    }
  };

  // Configurable Components tree filters.
  const hideElementsWithDisplayNames: Set<RegExp> = new Set();
  const hideElementsWithPaths: Set<RegExp> = new Set();
  const hideElementsWithTypes: Set<ElementType> = new Set();

  // Highlight updates
  let traceUpdatesEnabled: boolean = false;
  let traceUpdatesForNodes: Set<NativeType> = new Set();

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
  // The unmount operations are already significantly smaller than mount opreations though.
  // This is something to keep in mind for later.
  function updateComponentFilters(componentFilters: Array<ComponentFilter>) {
    if (isProfiling) {
      // Re-mounting a tree while profiling is in progress might break a lot of assumptions.
      // If necessary, we could support this- but it doesn't seem like a necessary use case.
      throw Error('Cannot modify filter preferences while profiling');
    }

    // Recursively unmount all roots.
    hook.getFiberRoots(rendererID).forEach(root => {
      currentRootID = getFiberID(getPrimaryFiber(root.current));
      unmountFiberChildrenRecursively(root.current);
      recordUnmount(root.current, false);
      currentRootID = -1;
    });

    applyComponentFilters(componentFilters);

    // Reset psuedo counters so that new path selections will be persisted.
    rootDisplayNameCounter.clear();

    // Recursively re-mount all roots with new filter criteria applied.
    hook.getFiberRoots(rendererID).forEach(root => {
      currentRootID = getFiberID(getPrimaryFiber(root.current));
      setRootPseudoKey(currentRootID, root.current);
      mountFiberRecursively(root.current, null, false, false);
      flushPendingEvents(root);
      currentRootID = -1;
    });
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
        for (let displayNameRegExp of hideElementsWithDisplayNames) {
          if (displayNameRegExp.test(displayName)) {
            return true;
          }
        }
      }
    }

    if (_debugSource != null && hideElementsWithPaths.size > 0) {
      const {fileName} = _debugSource;
      // eslint-disable-next-line no-for-of-loops/no-for-of-loops
      for (let pathRegExp of hideElementsWithPaths) {
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
      default:
        const typeSymbol = getTypeSymbol(type);

        switch (typeSymbol) {
          case CONCURRENT_MODE_NUMBER:
          case CONCURRENT_MODE_SYMBOL_STRING:
          case DEPRECATED_ASYNC_MODE_SYMBOL_STRING:
            return ElementTypeOtherOrUnknown;
          case CONTEXT_PROVIDER_NUMBER:
          case CONTEXT_PROVIDER_SYMBOL_STRING:
            return ElementTypeContext;
          case CONTEXT_CONSUMER_NUMBER:
          case CONTEXT_CONSUMER_SYMBOL_STRING:
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

  // This is a slightly annoying indirection.
  // It is currently necessary because DevTools wants to use unique objects as keys for instances.
  // However fibers have two versions.
  // We use this set to remember first encountered fiber for each conceptual instance.
  function getPrimaryFiber(fiber: Fiber): Fiber {
    if (primaryFibers.has(fiber)) {
      return fiber;
    }
    const {alternate} = fiber;
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
          return {
            context: getContextChangedKeys(nextFiber),
            didHooksChange: didHooksChange(
              prevFiber.memoizedState,
              nextFiber.memoizedState,
            ),
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
        }
      default:
        return null;
    }
  }

  function updateContextsForFiber(fiber: Fiber) {
    switch (getElementTypeForFiber(fiber)) {
      case ElementTypeClass:
        if (idToContextsMap !== null) {
          const id = getFiberID(getPrimaryFiber(fiber));
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
    switch (getElementTypeForFiber(fiber)) {
      case ElementTypeClass:
        const instance = fiber.stateNode;
        let legacyContext = NO_CONTEXT;
        let modernContext = NO_CONTEXT;
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
      default:
        return null;
    }
  }

  // Record all contexts at the time profiling is started.
  // Fibers only store the current context value,
  // so we need to track them separatenly in order to determine changed keys.
  function crawlToInitializeContextsMap(fiber: Fiber) {
    updateContextsForFiber(fiber);
    let current = fiber.child;
    while (current !== null) {
      crawlToInitializeContextsMap(current);
      current = current.sibling;
    }
  }

  function getContextChangedKeys(fiber: Fiber): null | boolean | Array<string> {
    switch (getElementTypeForFiber(fiber)) {
      case ElementTypeClass:
        if (idToContextsMap !== null) {
          const id = getFiberID(getPrimaryFiber(fiber));
          const prevContexts = idToContextsMap.has(id)
            ? idToContextsMap.get(id)
            : null;
          const nextContexts = getContextsForFiber(fiber);

          if (prevContexts == null || nextContexts == null) {
            return null;
          }

          const [prevLegacyContext, prevModernContext] = prevContexts;
          const [nextLegacyContext, nextModernContext] = nextContexts;

          if (nextLegacyContext !== NO_CONTEXT) {
            return getChangedKeys(prevLegacyContext, nextLegacyContext);
          } else if (nextModernContext !== NO_CONTEXT) {
            return prevModernContext !== nextModernContext;
          }
        }
        break;
      default:
        break;
    }
    return null;
  }

  function didHooksChange(prev: any, next: any): boolean {
    if (next == null) {
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
        if (next.memoizedState !== prev.memoizedState) {
          return true;
        } else {
          next = next.next;
          prev = prev.next;
        }
      }
    }

    return false;
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
    for (let key of keys) {
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

  let pendingOperations: Array<number> = [];
  let pendingRealUnmountedIDs: Array<number> = [];
  let pendingSimulatedUnmountedIDs: Array<number> = [];
  let pendingOperationsQueue: Array<Array<number>> | null = [];
  let pendingStringTable: Map<string, number> = new Map();
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

  function flushPendingEvents(root: Object): void {
    if (
      pendingOperations.length === 0 &&
      pendingRealUnmountedIDs.length === 0 &&
      pendingSimulatedUnmountedIDs.length === 0 &&
      pendingUnmountedRootID === null
    ) {
      // If we aren't profiling, we can just bail out here.
      // No use sending an empty update over the bridge.
      //
      // The Profiler stores metadata for each commit and reconstructs the app tree per commit using:
      // (1) an initial tree snapshot and
      // (2) the operations array for each commit
      // Because of this, it's important that the operations and metadata arrays align,
      // So it's important not to ommit even empty operations while profiing is active.
      if (!isProfiling) {
        return;
      }
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
    operations[i++] = currentRootID; // Use this ID in case the root was unmounted!

    // Now fill in the string table.
    // [stringTableLength, str1Length, ...str1, str2Length, ...str2, ...]
    operations[i++] = pendingStringTableLength;
    pendingStringTable.forEach((value, key) => {
      operations[i++] = key.length;
      const encodedKey = utfEncodeString(key);
      for (let j = 0; j < encodedKey.length; j++) {
        operations[i + j] = encodedKey[j];
      }
      i += key.length;
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
    // The first value in this array will identify which root it corresponds to,
    // so we do no longer need to dispatch a separate root-committed event.
    if (pendingOperationsQueue !== null) {
      // Until the frontend has been connected, store the tree operations.
      // This will let us avoid walking the tree later when the frontend connects,
      // and it enables the Profiler's reload-and-profile functionality to work as well.
      pendingOperationsQueue.push(operations);
    } else {
      // If we've already connected to the frontend, just pass the operations through.
      hook.emit('operations', operations);
    }

    pendingOperations.length = 0;
    pendingRealUnmountedIDs.length = 0;
    pendingSimulatedUnmountedIDs.length = 0;
    pendingUnmountedRootID = null;
    pendingStringTable.clear();
    pendingStringTableLength = 0;
  }

  function getStringID(str: string | null): number {
    if (str === null) {
      return 0;
    }
    const existingID = pendingStringTable.get(str);
    if (existingID !== undefined) {
      return existingID;
    }
    const stringID = pendingStringTable.size + 1;
    pendingStringTable.set(str, stringID);
    // The string table total length needs to account
    // both for the string length, and for the array item
    // that contains the length itself. Hence + 1.
    pendingStringTableLength += str.length + 1;
    return stringID;
  }

  function recordMount(fiber: Fiber, parentFiber: Fiber | null) {
    const isRoot = fiber.tag === HostRoot;
    const id = getFiberID(getPrimaryFiber(fiber));

    const hasOwnerMetadata = fiber.hasOwnProperty('_debugOwner');
    const isProfilingSupported = fiber.hasOwnProperty('treeBaseDuration');

    if (isRoot) {
      pushOperation(TREE_OPERATION_ADD);
      pushOperation(id);
      pushOperation(ElementTypeRoot);
      pushOperation(isProfilingSupported ? 1 : 0);
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

      const ownerID =
        _debugOwner != null ? getFiberID(getPrimaryFiber(_debugOwner)) : 0;
      const parentID = parentFiber
        ? getFiberID(getPrimaryFiber(parentFiber))
        : 0;

      let displayNameStringID = getStringID(displayName);

      // This check is a guard to handle a React element that has been modified
      // in such a way as to bypass the default stringification of the "key" property.
      let keyString = key === null ? null : '' + key;
      let keyStringID = getStringID(keyString);

      pushOperation(TREE_OPERATION_ADD);
      pushOperation(id);
      pushOperation(elementType);
      pushOperation(parentID);
      pushOperation(ownerID);
      pushOperation(displayNameStringID);
      pushOperation(keyStringID);
    }

    if (isProfilingSupported) {
      idToRootMap.set(id, currentRootID);

      recordProfilingDurations(fiber);
    }
  }

  function recordUnmount(fiber: Fiber, isSimulated: boolean) {
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
      // Roots must be removed only after all children (pending and simultated) have been removed.
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
    traverseSiblings: boolean,
    traceNearestHostComponentUpdate: boolean,
  ) {
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

    const isTimedOutSuspense =
      fiber.tag === ReactTypeOfWork.SuspenseComponent &&
      fiber.memoizedState !== null;

    if (isTimedOutSuspense) {
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

    if (traverseSiblings && fiber.sibling !== null) {
      mountFiberRecursively(
        fiber.sibling,
        parentFiber,
        true,
        traceNearestHostComponentUpdate,
      );
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
    const id = getFiberID(getPrimaryFiber(fiber));
    const {actualDuration, treeBaseDuration} = fiber;

    idToTreeBaseDurationMap.set(id, treeBaseDuration || 0);

    if (isProfiling) {
      const {alternate} = fiber;

      // It's important to update treeBaseDuration even if the current Fiber did not render,
      // becuase it's possible that one of its descednants did.
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
    if (numChildren < 2) {
      // No need to reorder.
      return;
    }
    pushOperation(TREE_OPERATION_REORDER_CHILDREN);
    pushOperation(getFiberID(getPrimaryFiber(fiber)));
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
    parentFiber: Fiber | null,
    traceNearestHostComponentUpdate: boolean,
  ): boolean {
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
          elementType === ElementTypeContext
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
      mostRecentlyInspectedElement.id ===
        getFiberID(getPrimaryFiber(nextFiber)) &&
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
    // The logic below is inspired by the codepaths in updateSuspenseComponent()
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
          nextFiber,
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
          nextFiber,
          true,
          traceNearestHostComponentUpdate,
        );
        shouldResetChildren = true;
      }
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
          // we should fall back to recursively marking the nearest host descendates for highlight.
          if (traceNearestHostComponentUpdate) {
            const hostFibers = findAllCurrentHostFibers(
              getFiberID(getPrimaryFiber(nextFiber)),
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
        currentRootID = getFiberID(getPrimaryFiber(root.current));
        setRootPseudoKey(currentRootID, root.current);

        // Checking root.memoizedInteractions handles multi-renderer edge-case-
        // where some v16 renderers support profiling and others don't.
        if (isProfiling && root.memoizedInteractions != null) {
          // If profiling is active, store commit time and duration, and the current interactions.
          // The frontend may request this information after profiling has stopped.
          currentCommitProfilingMetadata = {
            changeDescriptions: recordChangeDescriptions ? new Map() : null,
            durations: [],
            commitTime: getCurrentTime() - profilingStartTime,
            interactions: Array.from(root.memoizedInteractions).map(
              (interaction: Interaction) => ({
                ...interaction,
                timestamp: interaction.timestamp - profilingStartTime,
              }),
            ),
            maxActualDuration: 0,
            priorityLevel: null,
          };
        }

        mountFiberRecursively(root.current, null, false, false);
        flushPendingEvents(root);
        currentRootID = -1;
      });
    }
  }

  function handleCommitFiberUnmount(fiber) {
    // This is not recursive.
    // We can't traverse fibers after unmounting so instead
    // we rely on React telling us about each unmount.
    recordUnmount(fiber, false);
  }

  function handleCommitFiberRoot(root, priorityLevel) {
    const current = root.current;
    const alternate = current.alternate;

    currentRootID = getFiberID(getPrimaryFiber(current));

    // Before the traversals, remember to start tracking
    // our path in case we have selection to restore.
    if (trackedPath !== null) {
      mightBeOnTrackedPath = true;
    }

    if (traceUpdatesEnabled) {
      traceUpdatesForNodes.clear();
    }

    // Checking root.memoizedInteractions handles multi-renderer edge-case-
    // where some v16 renderers support profiling and others don't.
    const isProfilingSupported = root.memoizedInteractions != null;

    if (isProfiling && isProfilingSupported) {
      // If profiling is active, store commit time and duration, and the current interactions.
      // The frontend may request this information after profiling has stopped.
      currentCommitProfilingMetadata = {
        changeDescriptions: recordChangeDescriptions ? new Map() : null,
        durations: [],
        commitTime: getCurrentTime() - profilingStartTime,
        interactions: Array.from(root.memoizedInteractions).map(
          (interaction: Interaction) => ({
            ...interaction,
            timestamp: interaction.timestamp - profilingStartTime,
          }),
        ),
        maxActualDuration: 0,
        priorityLevel:
          priorityLevel == null ? null : formatPriorityLevel(priorityLevel),
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
    const fiber = idToFiberMap.get(id);
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
  function findCurrentFiberUsingSlowPathById(id: number): Fiber | null {
    const fiber = idToFiberMap.get(id);
    if (fiber == null) {
      console.warn(`Could not find Fiber with id "${id}"`);
      return null;
    }

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
                'in React related to the return pointer. Please file an issue.',
            );
          }
        }
      }

      if (a.alternate !== b) {
        throw Error(
          "Return fibers should always be each others' alternates. " +
            'This error is likely caused by a bug in React. Please file an issue.',
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

  function prepareViewAttributeSource(
    id: number,
    path: Array<string | number>,
  ): void {
    const isCurrent = isMostRecentlyInspectedElementCurrent(id);
    if (isCurrent) {
      window.$attribute = getInObject(
        ((mostRecentlyInspectedElement: any): InspectedElement),
        path,
      );
    }
  }

  function prepareViewElementSource(id: number): void {
    let fiber = idToFiberMap.get(id);
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

  function getOwnersList(id: number): Array<Owner> | null {
    let fiber = findCurrentFiberUsingSlowPathById(id);
    if (fiber == null) {
      return null;
    }

    const {_debugOwner} = fiber;

    const owners = [
      {
        displayName: getDisplayNameForFiber(fiber) || 'Anonymous',
        id,
        type: getElementTypeForFiber(fiber),
      },
    ];

    if (_debugOwner) {
      let owner = _debugOwner;
      while (owner !== null) {
        owners.unshift({
          displayName: getDisplayNameForFiber(owner) || 'Anonymous',
          id: getFiberID(getPrimaryFiber(owner)),
          type: getElementTypeForFiber(owner),
        });
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

    let fiber = findCurrentFiberUsingSlowPathById(id);
    if (fiber !== null) {
      instance = fiber.stateNode;

      if (fiber.memoizedProps !== null) {
        style = fiber.memoizedProps.style;
      }
    }

    return {instance, style};
  }

  function inspectElementRaw(id: number): InspectedElement | null {
    let fiber = findCurrentFiberUsingSlowPathById(id);
    if (fiber == null) {
      return null;
    }

    const {
      _debugOwner,
      _debugSource,
      dependencies,
      stateNode,
      memoizedProps,
      memoizedState,
      tag,
      type,
    } = fiber;

    const elementType = getElementTypeForFiber(fiber);

    const usesHooks =
      (tag === FunctionComponent ||
        tag === SimpleMemoComponent ||
        tag === ForwardRef) &&
      (!!memoizedState || !!dependencies);

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
      typeSymbol === CONTEXT_CONSUMER_NUMBER ||
      typeSymbol === CONTEXT_CONSUMER_SYMBOL_STRING
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
          currentTypeSymbol === CONTEXT_PROVIDER_NUMBER ||
          currentTypeSymbol === CONTEXT_PROVIDER_SYMBOL_STRING
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
        owners.push({
          displayName: getDisplayNameForFiber(owner) || 'Anonymous',
          id: getFiberID(getPrimaryFiber(owner)),
          type: getElementTypeForFiber(owner),
        });
        owner = owner._debugOwner || null;
      }
    }

    const isTimedOutSuspense =
      tag === SuspenseComponent && memoizedState !== null;

    let hooks = null;
    if (usesHooks) {
      const originalConsoleMethods = {};

      // Temporarily disable all console logging before re-running the hook.
      for (let method in console) {
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
        );
      } finally {
        // Restore original console functionality.
        for (let method in originalConsoleMethods) {
          try {
            // $FlowFixMe property error|warn is not writable.
            console[method] = originalConsoleMethods[method];
          } catch (error) {}
        }
      }
    }

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

      // Does the component have legacy context attached to it.
      hasLegacyContext,

      displayName: getDisplayNameForFiber(fiber),
      type: elementType,

      // Inspectable properties.
      // TODO Review sanitization approach for the below inspectable values.
      context,
      hooks,
      props: memoizedProps,
      state: usesHooks ? null : memoizedState,

      // List of owners
      owners,

      // Location of component in source coude.
      source: _debugSource || null,
    };
  }

  let mostRecentlyInspectedElement: InspectedElement | null = null;
  let hasElementUpdatedSinceLastInspected: boolean = false;
  let currentlyInspectedPaths: Object = {};

  function isMostRecentlyInspectedElementCurrent(id: number): boolean {
    return (
      mostRecentlyInspectedElement !== null &&
      mostRecentlyInspectedElement.id === id &&
      !hasElementUpdatedSinceLastInspected
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

  function createIsPathWhitelisted(
    key: string | null,
    secondaryCategory: 'hooks' | null,
  ) {
    // This function helps prevent previously-inspected paths from being dehydrated in updates.
    // This is important to avoid a bad user experience where expanded toggles collapse on update.
    return function isPathWhitelisted(path: Array<string | number>): boolean {
      switch (secondaryCategory) {
        case 'hooks':
          if (path.length === 1) {
            // Never dehydrate the "hooks" object at the top levels.
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

    let fiber = idToFiberMap.get(id);
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
          props,
          type: type.render,
        };
        break;
      case MemoComponent:
      case SimpleMemoComponent:
        global.$r = {
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
    const isCurrent = isMostRecentlyInspectedElementCurrent(id);

    if (isCurrent) {
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
    const isCurrent = isMostRecentlyInspectedElementCurrent(id);

    if (isCurrent) {
      copyToClipboard(
        getInObject(
          ((mostRecentlyInspectedElement: any): InspectedElement),
          path,
        ),
      );
    }
  }

  function inspectElement(
    id: number,
    path?: Array<string | number>,
  ): InspectedElementPayload {
    const isCurrent = isMostRecentlyInspectedElementCurrent(id);

    if (isCurrent) {
      if (path != null) {
        mergeInspectedPaths(path);

        let secondaryCategory = null;
        if (path[0] === 'hooks') {
          secondaryCategory = 'hooks';
        }

        // If this element has not been updated since it was last inspected,
        // we can just return the subset of data in the newly-inspected path.
        return {
          id,
          type: 'hydrated-path',
          path,
          value: cleanForBridge(
            getInObject(
              ((mostRecentlyInspectedElement: any): InspectedElement),
              path,
            ),
            createIsPathWhitelisted(null, secondaryCategory),
            path,
          ),
        };
      } else {
        // If this element has not been updated since it was last inspected, we don't need to re-run it.
        // Instead we can just return the ID to indicate that it has not changed.
        return {
          id,
          type: 'no-change',
        };
      }
    } else {
      hasElementUpdatedSinceLastInspected = false;

      if (
        mostRecentlyInspectedElement === null ||
        mostRecentlyInspectedElement.id !== id
      ) {
        currentlyInspectedPaths = {};
      }

      mostRecentlyInspectedElement = inspectElementRaw(id);
      if (mostRecentlyInspectedElement === null) {
        return {
          id,
          type: 'not-found',
        };
      }

      if (path != null) {
        mergeInspectedPaths(path);
      }

      // Any time an inspected element has an update,
      // we should update the selected $r value as wel.
      // Do this before dehyration (cleanForBridge).
      updateSelectedElement(mostRecentlyInspectedElement);

      // Clone before cleaning so that we preserve the full data.
      // This will enable us to send patches without re-inspecting if hydrated paths are requested.
      // (Reducing how often we shallow-render is a better DX for function components that use hooks.)
      const cleanedInspectedElement = {...mostRecentlyInspectedElement};
      cleanedInspectedElement.context = cleanForBridge(
        cleanedInspectedElement.context,
        createIsPathWhitelisted('context', null),
      );
      cleanedInspectedElement.hooks = cleanForBridge(
        cleanedInspectedElement.hooks,
        createIsPathWhitelisted('hooks', 'hooks'),
      );
      cleanedInspectedElement.props = cleanForBridge(
        cleanedInspectedElement.props,
        createIsPathWhitelisted('props', null),
      );
      cleanedInspectedElement.state = cleanForBridge(
        cleanedInspectedElement.state,
        createIsPathWhitelisted('state', null),
      );

      return {
        id,
        type: 'full-data',
        value: cleanedInspectedElement,
      };
    }
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

  function setInHook(
    id: number,
    index: number,
    path: Array<string | number>,
    value: any,
  ) {
    const fiber = findCurrentFiberUsingSlowPathById(id);
    if (fiber !== null) {
      if (typeof overrideHookState === 'function') {
        overrideHookState(fiber, index, path, value);
      }
    }
  }

  function setInProps(id: number, path: Array<string | number>, value: any) {
    const fiber = findCurrentFiberUsingSlowPathById(id);
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
    const fiber = findCurrentFiberUsingSlowPathById(id);
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

    const fiber = findCurrentFiberUsingSlowPathById(id);
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
    changeDescriptions: Map<number, ChangeDescription> | null,
    commitTime: number,
    durations: Array<number>,
    interactions: Array<Interaction>,
    maxActualDuration: number,
    priorityLevel: string | null,
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
        const allInteractions: Map<number, Interaction> = new Map();
        const interactionCommits: Map<number, Array<number>> = new Map();

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
            interactions,
            maxActualDuration,
            priorityLevel,
            commitTime,
          } = commitProfilingData;

          const interactionIDs: Array<number> = [];

          interactions.forEach(interaction => {
            if (!allInteractions.has(interaction.id)) {
              allInteractions.set(interaction.id, interaction);
            }

            interactionIDs.push(interaction.id);

            const commitIndices = interactionCommits.get(interaction.id);
            if (commitIndices != null) {
              commitIndices.push(commitIndex);
            } else {
              interactionCommits.set(interaction.id, [commitIndex]);
            }
          });

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
            fiberActualDurations,
            fiberSelfDurations,
            interactionIDs,
            priorityLevel,
            timestamp: commitTime,
          });
        });

        dataForRoots.push({
          commitData,
          displayName,
          initialTreeBaseDurations,
          interactionCommits: Array.from(interactionCommits.entries()),
          interactions: Array.from(allInteractions.entries()),
          rootID,
        });
      },
    );

    return {
      dataForRoots,
      rendererID,
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
      const rootID = getFiberID(getPrimaryFiber(root.current));
      ((displayNamesByRootID: any): DisplayNamesByRootID).set(
        rootID,
        getDisplayNameForRoot(root.current),
      );

      if (shouldRecordChangeDescriptions) {
        // Record all contexts at the time profiling is started.
        // Fibers only store the current context value,
        // so we need to track them separatenly in order to determine changed keys.
        crawlToInitializeContextsMap(root.current);
      }
    });

    isProfiling = true;
    profilingStartTime = getCurrentTime();
    rootToCommitProfilingMetadataMap = new Map();
  }

  function stopProfiling() {
    isProfiling = false;
    recordChangeDescriptions = false;
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
    const fiber = idToFiberMap.get(id);
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
        const id = getFiberID(getPrimaryFiber(fiber));
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
    let fiber = idToFiberMap.get(id);
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
      id: getFiberID(getPrimaryFiber(fiber)),
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
    copyElementPath,
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
    inspectElement,
    logElementToConsole,
    prepareViewAttributeSource,
    prepareViewElementSource,
    overrideSuspense,
    renderer,
    setInContext,
    setInHook,
    setInProps,
    setInState,
    setTraceUpdatesEnabled,
    setTrackedPath,
    startProfiling,
    stopProfiling,
    storeAsGlobal,
    updateComponentFilters,
  };
}
