/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

// Types migrated from shared/ReactTypes.js
export type ReactCallSite = [
  string, // function name
  string, // file name
  number, // line number
  number, // column number
];

export type ReactStackTrace = Array<ReactCallSite>;

export type ReactComponentInfo = {
  name: string;
  env?: string;
  key?: null | string;
  owner?: null | ReactComponentInfo;
  stack?: null | ReactStackTrace;
  props?: null | {[name: string]: any};
  // Stashed Data for the Specific Execution Environment. Not part of the transport protocol
  debugStack?: null | Error;
  debugTask?: null | any;
};

export type ReactDebugInfo = Array<
  ReactComponentInfo | any // Simplified from the original which included other types
>;

// Types migrated from react-reconciler/src/ReactInternalTypes.js
export type WorkTag = number;
export type Lanes = number;
export type Lane = number;
export type TypeOfMode = number;
export type Flags = number;

// Migrated from react-devtools-shared/src/backend/types.js
export type WorkTagMap = {
  CacheComponent: WorkTag;
  ClassComponent: WorkTag;
  ContextConsumer: WorkTag;
  ContextProvider: WorkTag;
  CoroutineComponent: WorkTag;
  CoroutineHandlerPhase: WorkTag;
  DehydratedSuspenseComponent: WorkTag;
  ForwardRef: WorkTag;
  Fragment: WorkTag;
  FunctionComponent: WorkTag;
  HostComponent: WorkTag;
  HostPortal: WorkTag;
  HostRoot: WorkTag;
  HostHoistable: WorkTag;
  HostSingleton: WorkTag;
  HostText: WorkTag;
  IncompleteClassComponent: WorkTag;
  IncompleteFunctionComponent: WorkTag;
  IndeterminateComponent: WorkTag;
  LazyComponent: WorkTag;
  LegacyHiddenComponent: WorkTag;
  MemoComponent: WorkTag;
  Mode: WorkTag;
  OffscreenComponent: WorkTag;
  Profiler: WorkTag;
  ScopeComponent: WorkTag;
  SimpleMemoComponent: WorkTag;
  SuspenseComponent: WorkTag;
  SuspenseListComponent: WorkTag;
  TracingMarkerComponent: WorkTag;
  YieldComponent: WorkTag;
  Throw: WorkTag;
  ViewTransitionComponent: WorkTag;
  ActivityComponent: WorkTag;
};

// Dependencies for Fiber
export type Dependencies = {
  lanes: Lanes;
  firstContext: any | null;
};

// A simplified version of the Fiber type from react-reconciler/src/ReactInternalTypes.js
export type Fiber = {
  // Tag identifying the type of fiber.
  tag: WorkTag;
  // Unique identifier of this child.
  key: null | string;
  // The value of element.type which is used to preserve the identity during
  // reconciliation of this child.
  elementType: any;
  // The resolved function/class/ associated with this fiber.
  type: any;
  // The local state associated with this fiber.
  stateNode: any;
  // Remaining fields belong to Fiber
  // The Fiber to return to after finishing processing this one.
  return: Fiber | null;
  // Singly Linked List Tree Structure.
  child: Fiber | null;
  sibling: Fiber | null;
  index: number;
  // The ref last used to attach this node.
  ref: any;
  refCleanup: null | (() => void);
  // Input is the data coming into process this fiber. Arguments. Props.
  pendingProps: any;
  memoizedProps: any;
  // A queue of state updates and callbacks.
  updateQueue: any;
  // The state used to create the output
  memoizedState: any;
  // Dependencies (contexts, events) for this fiber, if it has any
  dependencies: Dependencies | null;
  // Bitfield that describes properties about the fiber and its subtree.
  mode: TypeOfMode;
  // Effect
  flags: Flags;
  subtreeFlags: Flags;
  deletions: Array<Fiber> | null;
  lanes: Lanes;
  childLanes: Lanes;
  // This is a pooled version of a Fiber. Every fiber that gets updated will
  // eventually have a pair. There are cases when we can clean up pairs to save
  // memory if we need to.
  alternate: Fiber | null;
  // Time spent rendering this Fiber and its descendants for the current update.
  actualDuration?: number;
  // If the Fiber is currently active in the "render" phase,
  // This marks the time at which the work began.
  actualStartTime?: number;
  // Duration of the most recent render time for this Fiber.
  selfBaseDuration?: number;
  // Sum of base times for all descendants of this Fiber.
  treeBaseDuration?: number;
  // DEV only fields
  _debugInfo?: ReactDebugInfo | null;
  _debugOwner?: ReactComponentInfo | Fiber | null;
  _debugStack?: string | Error | null;
  _debugTask?: any | null;
  _debugNeedsRemount?: boolean;
  _debugHookTypes?: Array<string> | null;
};

// A simplified version of the FiberRoot type from react-reconciler/src/ReactInternalTypes.js
export type FiberRoot = {
  // The type of root (legacy, batched, concurrent, etc.)
  tag: number;
  // Any additional information from the host associated with this root.
  containerInfo: any;
  // Used only by persistent updates.
  pendingChildren: any;
  // The currently active root fiber. This is the mutable root of the tree.
  current: Fiber;
  // A linked list of all roots that have pending work scheduled on them.
  next: FiberRoot | null;
  // Other fields omitted for simplicity
};

// Types migrated from react-devtools-shared/src/backend/types.js
export type BundleType = 0 | 1; // 0 = PROD, 1 = DEV

export type HostInstance = any;

export type Source = {
  fileName: string;
  lineNumber: number;
  columnNumber?: number;
};

export type ReactRenderer = {
  version: string;
  rendererPackageName: string;
  bundleType: BundleType;
  // 16.0+ - To be removed in future versions.
  findFiberByHostInstance?: (hostInstance: HostInstance) => any | null;
  // 16.9+
  overrideHookState?: (
    fiber: any,
    id: number,
    path: Array<string | number>,
    value: any,
  ) => void;
  // 17+
  overrideHookStateDeletePath?: (
    fiber: any,
    id: number,
    path: Array<string | number>,
  ) => void;
  // 17+
  overrideHookStateRenamePath?: (
    fiber: any,
    id: number,
    oldPath: Array<string | number>,
    newPath: Array<string | number>,
  ) => void;
  // 16.7+
  overrideProps?: (
    fiber: any,
    path: Array<string | number>,
    value: any,
  ) => void;
  // 17+
  overridePropsDeletePath?: (fiber: any, path: Array<string | number>) => void;
  // 17+
  overridePropsRenamePath?: (
    fiber: any,
    oldPath: Array<string | number>,
    newPath: Array<string | number>,
  ) => void;
  // 16.9+
  scheduleUpdate?: (fiber: any) => void;
  setSuspenseHandler?: (shouldSuspend: (fiber: any) => boolean) => void;
  // Only injected by React v16.8+ in order to support hooks inspection.
  currentDispatcherRef?: any;
  // Only injected by React v16.9+ in DEV mode.
  // Enables DevTools to append owners-only component stack to error messages.
  getCurrentFiber?: (() => any | null) | null;
  // Only injected by React Flight Clients in DEV mode.
  // Enables DevTools to append owners-only component stack to error messages from Server Components.
  getCurrentComponentInfo?: () => any | null;
  // 17.0.2+
  reconcilerVersion?: string;
  // Uniquely identifies React DOM v15.
  ComponentTree?: any;
  // Present for React DOM v12 (possibly earlier) through v15.
  Mount?: any;
  // Only injected by React v17.0.3+ in DEV mode
  setErrorHandler?: (shouldError: (fiber: any) => boolean | undefined) => void;
  // Intentionally opaque type to avoid coupling DevTools to different Fast Refresh versions.
  scheduleRefresh?: Function;
  // 18.0+
  injectProfilingHooks?: (profilingHooks: any) => void;
  getLaneLabelMap?: () => Map<number, string> | null;
};

export type ChangeDescription = {
  context: Array<string> | boolean | null;
  didHooksChange: boolean;
  isFirstMount: boolean;
  props: Array<string> | null;
  state: Array<string> | null;
  hooks?: Array<number> | null;
};

export type PathFrame = {
  key: string | null;
  index: number;
  displayName: string | null;
};

export type SerializedElement = {
  displayName: string | null;
  id: number;
  key: number | string | null;
  type: ElementType;
};

// WARNING
// The values below are referenced by ComponentFilters (which are saved via localStorage).
// Do not change them or it will break previously saved user customizations.
// If new element types are added, use new numbers rather than re-ordering existing ones.
//
// Changing these types is also a backwards breaking change for the standalone shell,
// since the frontend and backend must share the same values-
// and the backend is embedded in certain environments (like React Native).
export const ElementTypeClass = 1;
export const ElementTypeContext = 2;
export const ElementTypeFunction = 5;
export const ElementTypeForwardRef = 6;
export const ElementTypeHostComponent = 7;
export const ElementTypeMemo = 8;
export const ElementTypeOtherOrUnknown = 9;
export const ElementTypeProfiler = 10;
export const ElementTypeRoot = 11;
export const ElementTypeSuspense = 12;
export const ElementTypeSuspenseList = 13;
export const ElementTypeTracingMarker = 14;
export const ElementTypeVirtual = 15;
export const ElementTypeViewTransition = 16;
export const ElementTypeActivity = 17;

// Different types of elements displayed in the Elements tree.
// These types may be used to visually distinguish types,
// or to enable/disable certain functionality.
export type ElementType =
  | 1
  | 2
  | 5
  | 6
  | 7
  | 8
  | 9
  | 10
  | 11
  | 12
  | 13
  | 14
  | 15
  | 16
  | 17;

export const StrictMode = 1;
