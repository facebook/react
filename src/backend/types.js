// @flow

import type { ComponentFilter, ElementType } from 'src/types';
import type { Interaction } from 'src/devtools/views/Profiler/types';

type BundleType =
  | 0 // PROD
  | 1; // DEV

export type WorkTag = number;
export type SideEffectTag = number;
export type ExpirationTime = number;
export type RefObject = {|
  current: any,
|};
export type Source = {
  fileName: string,
  lineNumber: number,
};
export type HookType =
  | 'useState'
  | 'useReducer'
  | 'useContext'
  | 'useRef'
  | 'useEffect'
  | 'useLayoutEffect'
  | 'useCallback'
  | 'useMemo'
  | 'useImperativeHandle'
  | 'useDebugValue';

// The Fiber type is copied from React and should be kept in sync:
// https://github.com/facebook/react/blob/master/packages/react-reconciler/src/ReactFiber.js
// The properties we don't use in DevTools are omitted.
export type Fiber = {|
  tag: WorkTag,

  key: null | string,

  elementType: any,

  type: any,

  stateNode: any,

  return: Fiber | null,

  child: Fiber | null,
  sibling: Fiber | null,
  index: number,

  ref: null | (((handle: mixed) => void) & { _stringRef: ?string }) | RefObject,

  pendingProps: any, // This type will be more specific once we overload the tag.
  memoizedProps: any, // The props used to create the output.

  memoizedState: any,

  effectTag: SideEffectTag,

  alternate: Fiber | null,

  actualDuration?: number,

  actualStartTime?: number,

  treeBaseDuration?: number,

  _debugSource?: Source | null,
  _debugOwner?: Fiber | null,
|};

// TODO: If it's useful for the frontend to know which types of data an Element has
// (e.g. props, state, context, hooks) then we could add a bitmask field for this
// to keep the number of attributes small.
export type FiberData = {|
  key: string | null,
  displayName: string | null,
  type: ElementType,
|};

export type NativeType = {};
export type RendererID = number;

type Dispatcher = any;

export type ReactRenderer = {
  findFiberByHostInstance: (hostInstance: NativeType) => ?Fiber,
  version: string,
  bundleType: BundleType,

  // 16.9+
  overrideHookState?: ?(
    fiber: Object,
    id: number,
    path: Array<string | number>,
    value: any
  ) => void,

  // 16.7+
  overrideProps?: ?(
    fiber: Object,
    path: Array<string | number>,
    value: any
  ) => void,

  // 16.9+
  scheduleUpdate?: ?(fiber: Object) => void,
  setSuspenseHandler?: ?(shouldSuspend: (fiber: Object) => boolean) => void,

  // Only injected by React v16.8+ in order to support hooks inspection.
  currentDispatcherRef?: {| current: null | Dispatcher |},
};

// TODO (change descriptions) Should we report changed hooks keys?
export type ChangeDescription = {|
  context: Array<string> | boolean | null,
  didHooksChange: boolean,
  isFirstMount: boolean,
  props: Array<string> | null,
  state: Array<string> | null,
|};

export type CommitDataBackend = {|
  // Tuple of fiber ID and change description
  changeDescriptions: Array<[number, ChangeDescription]> | null,
  duration: number,
  // Tuple of fiber ID and actual duration
  fiberActualDurations: Array<[number, number]>,
  // Tuple of fiber ID and computed "self" duration
  fiberSelfDurations: Array<[number, number]>,
  interactionIDs: Array<number>,
  priorityLevel: string | null,
  timestamp: number,
|};

export type ProfilingDataForRootBackend = {|
  commitData: Array<CommitDataBackend>,
  displayName: string,
  // Tuple of Fiber ID and base duration
  initialTreeBaseDurations: Array<[number, number]>,
  // Tuple of Interaction ID and commit indices
  interactionCommits: Array<[number, Array<number>]>,
  interactions: Array<[number, Interaction]>,
  rootID: number,
|};

// Profiling data collected by the renderer interface.
// This information will be passed to the frontend and combined with info it collects.
export type ProfilingDataBackend = {|
  dataForRoots: Array<ProfilingDataForRootBackend>,
  rendererID: number,
|};

export type PathFrame = {|
  key: string | null,
  index: number,
  displayName: string | null,
|};

export type PathMatch = {|
  id: number,
  isFullMatch: boolean,
|};

export type Owner = {|
  displayName: string | null,
  id: number,
  type: ElementType,
|};

export type OwnersList = {|
  id: number,
  owners: Array<Owner> | null,
|};

export type InspectedElement = {|
  id: number,

  displayName: string | null,

  // Does the current renderer support editable hooks?
  canEditHooks: boolean,

  // Does the current renderer support editable function props?
  canEditFunctionProps: boolean,

  // Is this Suspense, and can its value be overriden now?
  canToggleSuspense: boolean,

  // Can view component source location.
  canViewSource: boolean,

  // Inspectable properties.
  context: Object | null,
  events: Object | null,
  hooks: Object | null,
  props: Object | null,
  state: Object | null,

  // List of owners
  owners: Array<Owner> | null,

  // Location of component in source coude.
  source: Source | null,

  type: ElementType,
|};

export type RendererInterface = {
  cleanup: () => void,
  findNativeNodesForFiberID: (id: number) => ?Array<NativeType>,
  flushInitialOperations: () => void,
  getBestMatchForTrackedPath: () => PathMatch | null,
  getFiberIDForNative: (
    component: NativeType,
    findNearestUnfilteredAncestor?: boolean
  ) => number | null,
  getProfilingData(): ProfilingDataBackend,
  getOwnersList: (id: number) => Array<Owner> | null,
  getPathForElement: (id: number) => Array<PathFrame> | null,
  handleCommitFiberRoot: (fiber: Object, commitPriority?: number) => void,
  handleCommitFiberUnmount: (fiber: Object) => void,
  inspectElement: (id: number) => InspectedElement | number | null,
  logElementToConsole: (id: number) => void,
  overrideSuspense: (id: number, forceFallback: boolean) => void,
  prepareViewElementSource: (id: number) => void,
  renderer: ReactRenderer | null,
  selectElement: (id: number) => void,
  setInContext: (id: number, path: Array<string | number>, value: any) => void,
  setInHook: (
    id: number,
    index: number,
    path: Array<string | number>,
    value: any
  ) => void,
  setInProps: (id: number, path: Array<string | number>, value: any) => void,
  setInState: (id: number, path: Array<string | number>, value: any) => void,
  setTrackedPath: (path: Array<PathFrame> | null) => void,
  startProfiling: (recordChangeDescriptions: boolean) => void,
  stopProfiling: () => void,
  updateComponentFilters: (somponentFilters: Array<ComponentFilter>) => void,
};

export type Handler = (data: any) => void;

export type DevToolsHook = {
  listeners: { [key: string]: Array<Handler> },
  rendererInterfaces: Map<RendererID, RendererInterface>,
  renderers: Map<RendererID, ReactRenderer>,

  emit: (event: string, data: any) => void,
  getFiberRoots: (rendererID: RendererID) => Set<Object>,
  inject: (renderer: ReactRenderer) => number | null,
  on: (event: string, handler: Handler) => void,
  off: (event: string, handler: Handler) => void,
  reactDevtoolsAgent?: ?Object,
  sub: (event: string, handler: Handler) => () => void,

  // React uses these methods.
  checkDCE: (fn: Function) => void,
  onCommitFiberUnmount: (rendererID: RendererID, fiber: Object) => void,
  onCommitFiberRoot: (
    rendererID: RendererID,
    fiber: Object,
    commitPriority?: number
  ) => void,
};

export type HooksNode = {
  id: number,
  isStateEditable: boolean,
  name: string,
  value: mixed,
  subHooks: Array<HooksNode>,
};
export type HooksTree = Array<HooksNode>;
