// @flow

import type { ComponentFilter, ElementType } from 'src/types';
import type {
  InspectedElement,
  Owner,
} from 'src/devtools/views/Components/types';

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

export type InteractionBackend = {|
  id: number,
  name: string,
  timestamp: number,
|};

export type CommitDetailsBackend = {|
  commitIndex: number,
  // Tuple of id, actual duration, and (computed) self duration
  durations: Array<number>,
  interactions: Array<InteractionBackend>,
  rootID: number,
|};

export type FiberCommitsBackend = {|
  commitDurations: Array<number>,
  fiberID: number,
  rootID: number,
|};

export type InteractionWithCommitsBackend = {|
  ...InteractionBackend,
  commits: Array<number>,
|};

export type InteractionsBackend = {|
  interactions: Array<InteractionWithCommitsBackend>,
  rootID: number,
|};

export type ProfilingSummaryBackend = {|
  commitDurations: Array<number>,
  commitTimes: Array<number>,
  initialTreeBaseDurations: Array<number>,
  interactionCount: number,
  rootID: number,
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

export type RendererInterface = {
  cleanup: () => void,
  findNativeByFiberID: (id: number) => ?Array<NativeType>,
  flushInitialOperations: () => void,
  getBestMatchForTrackedPath: () => PathMatch | null,
  getCommitDetails: (
    rootID: number,
    commitIndex: number
  ) => CommitDetailsBackend,
  getFiberIDFromNative: (
    component: NativeType,
    findNearestUnfilteredAncestor?: boolean
  ) => number | null,
  getFiberCommits: (rootID: number, fiberID: number) => FiberCommitsBackend,
  getInteractions: (rootID: number) => InteractionsBackend,
  getOwnersList: (id: number) => Array<Owner> | null,
  getProfilingDataForDownload: (rootID: number) => Object,
  getProfilingSummary: (rootID: number) => ProfilingSummaryBackend,
  getPathForElement: (id: number) => Array<PathFrame> | null,
  handleCommitFiberRoot: (fiber: Object) => void,
  handleCommitFiberUnmount: (fiber: Object) => void,
  inspectElement: (id: number) => InspectedElement | null,
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
  startProfiling: () => void,
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
  onCommitFiberRoot: (rendererID: RendererID, fiber: Object) => void,
};

export type HooksNode = {
  id: number,
  isStateEditable: boolean,
  name: string,
  value: mixed,
  subHooks: Array<HooksNode>,
};
export type HooksTree = Array<HooksNode>;
