/* eslint-disable */
type Source = {fileName: string, lineNumber: number};
type ReactElement = {
  $$typeof: any,
  type: any,
  key: any,
  ref: any,
  props: any,
  _owner: any, // ReactInstance or ReactFiber
  // __DEV__
  _store: {validated: boolean},
  _self: React$Element<any>,
  _shadowChildren: any,
  _source: Source,
};
type ReactNode =
  | React$Element<any>
  | ReactCall<any>
  | ReactReturn<any>
  | ReactPortal
  | ReactText
  | ReactFragment;
type ReactFragment = ReactEmpty | Iterable<React$Node>;
type ReactNodeList = ReactEmpty | React$Node;
type ReactText = string | number;
type ReactEmpty = null | void | boolean;
type ReactCall<V> = {
  $$typeof: Symbol | number,
  type: Symbol | number,
  key: null | string,
  ref: null,
  props: {
    props: any, // This should be a more specific CallHandler
    handler: (props: any, returns: Array<V>) => ReactNodeList,
    children?: ReactNodeList,
  },
};
type ReactReturn<V> = {
  $$typeof: Symbol | number,
  type: Symbol | number,
  key: null,
  ref: null,
  props: {value: V},
};
type ReactPortal = {
  $$typeof: Symbol | number,
  key: null | string,
  containerInfo: any,
  children: ReactNodeList, // TODO: figure out the API for cross-renderer implementation.
  implementation: any,
};
type TypeOfWork = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10;
type TypeOfInternalContext = number;
type ExpirationTime = number;
type TypeOfSideEffect = number;
type Fiber = {|
  // These first fields are conceptually members of an Instance. This used to
  // be split into a separate type and intersected with the other Fiber fields,
  // but until Flow fixes its intersection bugs, we've merged them into a
  // single type.
  // An Instance is shared between all versions of a component. We can easily
  // break this out into a separate object to avoid copying so much to the
  // alternate versions of the tree. We put this on a single object for now to
  // minimize the number of objects created during the initial render.
  // Tag identifying the type of fiber.
  tag: TypeOfWork, // Unique identifier of this child.
  key: null | string, // The function/class/module associated with this fiber.
  type: any, // The local state associated with this fiber.
  stateNode: any, // Conceptual aliases
  // parent : Instance -> return The parent happens to be the same as the
  // return fiber since we've merged the fiber and instance.
  // Remaining fields belong to Fiber
  // The Fiber to return to after finishing processing this one.
  // This is effectively the parent, but there can be multiple parents (two)
  // so this is only the parent of the thing we're currently processing.
  // It is conceptually the same as the return address of a stack frame.
  return: Fiber | null, // Singly Linked List Tree Structure.
  child: Fiber | null,
  sibling: Fiber | null,
  index: number, // The ref last used to attach this node.
  // I'll avoid adding an owner field for prod and model that as functions.
  ref: null | ((handle: mixed) => void & {_stringRef: ?string}), // Input is the data coming into process this fiber. Arguments. Props.
  pendingProps: any, // This type will be more specific once we overload the tag.
  memoizedProps: any, // The props used to create the output.
  // A queue of state updates and callbacks.
  updateQueue: UpdateQueue<any> | null, // The state used to create the output
  memoizedState: any, // Bitfield that describes properties about the fiber and its subtree. E.g.
  // the AsyncUpdates flag indicates whether the subtree should be async-by-
  // default. When a fiber is created, it inherits the internalContextTag of its
  // parent. Additional flags can be set at creation time, but after than the
  // value should remain unchanged throughout the fiber's lifetime, particularly
  // before its child fibers are created.
  internalContextTag: TypeOfInternalContext, // Effect
  effectTag: TypeOfSideEffect, // Singly linked list fast path to the next fiber with side-effects.
  nextEffect: Fiber | null, // The first and last fiber with side-effect within this subtree. This allows
  // us to reuse a slice of the linked list when we reuse the work done within
  // this fiber.
  firstEffect: Fiber | null,
  lastEffect: Fiber | null, // Represents a time in the future by which this work should be completed.
  // This is also used to quickly determine if a subtree has no pending changes.
  expirationTime: ExpirationTime, // This is a pooled version of a Fiber. Every fiber that gets updated will
  // eventually have a pair. There are cases when we can clean up pairs to save
  // memory if we need to.
  alternate: Fiber | null, // Conceptual aliases
  // workInProgress : Fiber ->  alternate The alternate used for reuse happens
  // to be the same as work in progress.
  // __DEV__ only
  _debugID?: number,
  _debugSource?: Source | null,
  _debugOwner?: Fiber | null,
  _debugIsCurrentlyTiming?: boolean,
|};
type PartialState<State, Props> =
  | $Subtype<State>
  | ((prevState: State, props: Props) => $Subtype<State>); // Callbacks are not validated until invocation
type Callback = mixed;
type Update<State> = {
  expirationTime: ExpirationTime,
  partialState: PartialState<any, any>,
  callback: Callback | null,
  isReplace: boolean,
  isForced: boolean,
  next: Update<State> | null,
};
type UpdateQueue<State> = {
  // A processed update is not removed from the queue if there are any
  // unprocessed updates that came before it. In that case, we need to keep
  // track of the base state, which represents the base state of the first
  // unprocessed update, which is the same as the first update in the list.
  baseState: State, // For the same reason, we keep track of the remaining expiration time.
  expirationTime: ExpirationTime,
  first: Update<State> | null,
  last: Update<State> | null,
  callbackList: Array<Update<State>> | null,
  hasForceUpdate: boolean,
  isInitialized: boolean, // Dev only
  isProcessing?: boolean,
};
type Batch = {
  _defer: boolean,
  _expirationTime: ExpirationTime,
  _onComplete: () => mixed,
  _next: Batch | null,
};
type FiberRoot = {
  containerInfo: any, // Used only by persistent updates.
  pendingChildren: any, // The currently active root fiber. This is the mutable root of the tree.
  current: Fiber,
  remainingExpirationTime: ExpirationTime, // Determines if this root can be committed.
  isReadyForCommit: boolean, // A finished work-in-progress HostRoot that's ready to be committed.
  // TODO: The reason this is separate from isReadyForCommit is because the
  // FiberRoot concept will likely be lifted out of the reconciler and into
  // the renderer.
  finishedWork: Fiber | null, // Top context object, used by renderSubtreeIntoContainer
  context: Object | null,
  pendingContext: Object | null, // Determines if we should attempt to hydrate on the initial mount
  +hydrate: boolean, // List of top-level batches. This list indicates whether a commit should be
  // deferred. Also contains completion callbacks.
  // TODO: Lift this into the renderer
  firstBatch: Batch | null, // Linked-list of roots
  nextScheduledRoot: FiberRoot | null,
};
export type Deadline = {timeRemaining: () => number};
type OpaqueHandle = Fiber;
type OpaqueRoot = FiberRoot;
export type HostConfig<T, P, I, TI, HI, PI, C, CC, CX, PL> = {
  getRootHostContext: (rootContainerInstance: C) => CX,
  getChildHostContext: (parentHostContext: CX, type: T, instance: C) => CX,
  getPublicInstance: (instance: I | TI) => PI,
  createInstance: (
    type: T,
    props: P,
    rootContainerInstance: C,
    hostContext: CX,
    internalInstanceHandle: OpaqueHandle,
  ) => I,
  appendInitialChild: (parentInstance: I, child: I | TI) => void,
  finalizeInitialChildren: (
    parentInstance: I,
    type: T,
    props: P,
    rootContainerInstance: C,
  ) => boolean,
  prepareUpdate: (
    instance: I,
    type: T,
    oldProps: P,
    newProps: P,
    rootContainerInstance: C,
    hostContext: CX,
  ) => null | PL,
  shouldSetTextContent: (type: T, props: P) => boolean,
  shouldDeprioritizeSubtree: (type: T, props: P) => boolean,
  createTextInstance: (
    text: string,
    rootContainerInstance: C,
    hostContext: CX,
    internalInstanceHandle: OpaqueHandle,
  ) => TI,
  scheduleDeferredCallback: (
    callback: (deadline: Deadline) => void,
    options?: {timeout: number},
  ) => number,
  cancelDeferredCallback: (callbackID: number) => void,
  prepareForCommit: () => void,
  resetAfterCommit: () => void,
  now: () => number,
  useSyncScheduling?: boolean,
  +hydration?: HydrationHostConfig<T, P, I, TI, HI, C, CX, PL>,
  +mutation?: MutableUpdatesHostConfig<T, P, I, TI, C, PL>,
  +persistence?: PersistentUpdatesHostConfig<T, P, I, TI, C, CC, PL>,
};
type MutableUpdatesHostConfig<T, P, I, TI, C, PL> = {
  commitUpdate: (
    instance: I,
    updatePayload: PL,
    type: T,
    oldProps: P,
    newProps: P,
    internalInstanceHandle: OpaqueHandle,
  ) => void,
  commitMount: (
    instance: I,
    type: T,
    newProps: P,
    internalInstanceHandle: OpaqueHandle,
  ) => void,
  commitTextUpdate: (
    textInstance: TI,
    oldText: string,
    newText: string,
  ) => void,
  resetTextContent: (instance: I) => void,
  appendChild: (parentInstance: I, child: I | TI) => void,
  appendChildToContainer: (container: C, child: I | TI) => void,
  insertBefore: (parentInstance: I, child: I | TI, beforeChild: I | TI) => void,
  insertInContainerBefore: (
    container: C,
    child: I | TI,
    beforeChild: I | TI,
  ) => void,
  removeChild: (parentInstance: I, child: I | TI) => void,
  removeChildFromContainer: (container: C, child: I | TI) => void,
};
type PersistentUpdatesHostConfig<T, P, I, TI, C, CC, PL> = {
  cloneInstance: (
    instance: I,
    updatePayload: null | PL,
    type: T,
    oldProps: P,
    newProps: P,
    internalInstanceHandle: OpaqueHandle,
    keepChildren: boolean,
    recyclableInstance: I,
  ) => I,
  createContainerChildSet: (container: C) => CC,
  appendChildToContainerChildSet: (childSet: CC, child: I | TI) => void,
  finalizeContainerChildren: (container: C, newChildren: CC) => void,
  replaceContainerChildren: (container: C, newChildren: CC) => void,
};
type HydrationHostConfig<T, P, I, TI, HI, C, CX, PL> = {
  // Optional hydration
  canHydrateInstance: (instance: HI, type: T, props: P) => null | I,
  canHydrateTextInstance: (instance: HI, text: string) => null | TI,
  getNextHydratableSibling: (instance: I | TI | HI) => null | HI,
  getFirstHydratableChild: (parentInstance: I | C) => null | HI,
  hydrateInstance: (
    instance: I,
    type: T,
    props: P,
    rootContainerInstance: C,
    hostContext: CX,
    internalInstanceHandle: OpaqueHandle,
  ) => null | PL,
  hydrateTextInstance: (
    textInstance: TI,
    text: string,
    internalInstanceHandle: OpaqueHandle,
  ) => boolean,
  didNotMatchHydratedContainerTextInstance: (
    parentContainer: C,
    textInstance: TI,
    text: string,
  ) => void,
  didNotMatchHydratedTextInstance: (
    parentType: T,
    parentProps: P,
    parentInstance: I,
    textInstance: TI,
    text: string,
  ) => void,
  didNotHydrateContainerInstance: (
    parentContainer: C,
    instance: I | TI,
  ) => void,
  didNotHydrateInstance: (
    parentType: T,
    parentProps: P,
    parentInstance: I,
    instance: I | TI,
  ) => void,
  didNotFindHydratableContainerInstance: (
    parentContainer: C,
    type: T,
    props: P,
  ) => void,
  didNotFindHydratableContainerTextInstance: (
    parentContainer: C,
    text: string,
  ) => void,
  didNotFindHydratableInstance: (
    parentType: T,
    parentProps: P,
    parentInstance: I,
    type: T,
    props: P,
  ) => void,
  didNotFindHydratableTextInstance: (
    parentType: T,
    parentProps: P,
    parentInstance: I,
    text: string,
  ) => void,
}; // 0 is PROD, 1 is DEV.
// Might add PROFILE later.
type BundleType = 0 | 1;
type DevToolsConfig<I, TI> = {|
  bundleType: BundleType,
  version: string,
  rendererPackageName: string, // Note: this actually *does* depend on Fiber internal fields.
  // Used by "inspect clicked DOM element" in React DevTools.
  findFiberByHostInstance?: (instance: I | TI) => Fiber, // Used by RN in-app inspector.
  // This API is unfortunately RN-specific.
  // TODO: Change it to accept Fiber instead and type it properly.
  getInspectorDataForViewTag?: (tag: number) => Object,
|};
export type Reconciler<C, I, TI> = {
  createContainer: (
    containerInfo: C,
    isAsync: boolean,
    hydrate: boolean,
  ) => OpaqueRoot,
  updateContainer: (
    element: ReactNodeList,
    container: OpaqueRoot,
    parentComponent: ?React$Component<any, any>,
    callback: ?Function,
  ) => ExpirationTime,
  updateContainerAtExpirationTime: (
    element: ReactNodeList,
    container: OpaqueRoot,
    parentComponent: ?React$Component<any, any>,
    expirationTime: ExpirationTime,
    callback: ?Function,
  ) => ExpirationTime,
  flushRoot: (root: OpaqueRoot, expirationTime: ExpirationTime) => void,
  requestWork: (root: OpaqueRoot, expirationTime: ExpirationTime) => void,
  batchedUpdates: <A>(fn: () => A) => A,
  unbatchedUpdates: <A>(fn: () => A) => A,
  flushSync: <A>(fn: () => A) => A,
  deferredUpdates: <A>(fn: () => A) => A,
  injectIntoDevTools: (devToolsConfig: DevToolsConfig<I, TI>) => boolean,
  computeUniqueAsyncExpiration: () => ExpirationTime, // Used to extract the return value from the initial render. Legacy API.
  getPublicRootInstance: (
    container: OpaqueRoot,
  ) => React$Component<any, any> | TI | I | null, // Use for findDOMNode/findHostNode. Legacy API.
  findHostInstance: (component: Fiber) => I | TI | null, // Used internally for filtering out portals. Legacy API.
  findHostInstanceWithNoPortals: (component: Fiber) => I | TI | null,
};
