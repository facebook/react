/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import type {
  Destination,
  Chunk,
  PrecomputedChunk,
} from './ReactServerStreamConfig';
import type {
  ReactNodeList,
  ReactContext,
  ReactProviderType,
} from 'shared/ReactTypes';
import type {LazyComponent as LazyComponentType} from 'react/src/ReactLazy';
import type {
  SuspenseBoundaryID,
  ResponseState,
  FormatContext,
} from './ReactServerFormatConfig';
import type {ContextSnapshot} from './ReactFizzNewContext';
import type {ComponentStackNode} from './ReactFizzComponentStack';
import type {TreeContext} from './ReactFizzTreeContext';

import {
  scheduleWork,
  beginWriting,
  writeChunk,
  writeChunkAndReturn,
  completeWriting,
  flushBuffered,
  close,
  closeWithError,
} from './ReactServerStreamConfig';
import {
  writeCompletedRoot,
  writePlaceholder,
  writeStartCompletedSuspenseBoundary,
  writeStartPendingSuspenseBoundary,
  writeStartClientRenderedSuspenseBoundary,
  writeEndCompletedSuspenseBoundary,
  writeEndPendingSuspenseBoundary,
  writeEndClientRenderedSuspenseBoundary,
  writeStartSegment,
  writeEndSegment,
  writeClientRenderBoundaryInstruction,
  writeCompletedBoundaryInstruction,
  writeCompletedSegmentInstruction,
  pushTextInstance,
  pushStartInstance,
  pushEndInstance,
  pushStartCompletedSuspenseBoundary,
  pushEndCompletedSuspenseBoundary,
  UNINITIALIZED_SUSPENSE_BOUNDARY_ID,
  assignSuspenseBoundaryID,
  getChildFormatContext,
} from './ReactServerFormatConfig';
import {
  constructClassInstance,
  mountClassInstance,
} from './ReactFizzClassComponent';
import {
  getMaskedContext,
  processChildContext,
  emptyContextObject,
} from './ReactFizzContext';
import {
  readContext,
  rootContextSnapshot,
  switchContext,
  getActiveContext,
  pushProvider,
  popProvider,
} from './ReactFizzNewContext';
import {
  prepareToUseHooks,
  finishHooks,
  checkDidRenderIdHook,
  resetHooksState,
  Dispatcher,
  currentResponseState,
  setCurrentResponseState,
} from './ReactFizzHooks';
import {getStackByComponentStackNode} from './ReactFizzComponentStack';
import {emptyTreeContext, pushTreeContext} from './ReactFizzTreeContext';

import {
  getIteratorFn,
  REACT_ELEMENT_TYPE,
  REACT_PORTAL_TYPE,
  REACT_LAZY_TYPE,
  REACT_SUSPENSE_TYPE,
  REACT_LEGACY_HIDDEN_TYPE,
  REACT_DEBUG_TRACING_MODE_TYPE,
  REACT_STRICT_MODE_TYPE,
  REACT_PROFILER_TYPE,
  REACT_SUSPENSE_LIST_TYPE,
  REACT_FRAGMENT_TYPE,
  REACT_FORWARD_REF_TYPE,
  REACT_MEMO_TYPE,
  REACT_PROVIDER_TYPE,
  REACT_CONTEXT_TYPE,
  REACT_SCOPE_TYPE,
} from 'shared/ReactSymbols';
import ReactSharedInternals from 'shared/ReactSharedInternals';
import {
  disableLegacyContext,
  disableModulePatternComponents,
  warnAboutDefaultPropsOnFunctionComponents,
  enableScopeAPI,
  enableSuspenseAvoidThisFallbackFizz,
} from 'shared/ReactFeatureFlags';

import assign from 'shared/assign';
import getComponentNameFromType from 'shared/getComponentNameFromType';
import isArray from 'shared/isArray';

const ReactCurrentDispatcher = ReactSharedInternals.ReactCurrentDispatcher;
const ReactDebugCurrentFrame = ReactSharedInternals.ReactDebugCurrentFrame;

type LegacyContext = {
  [key: string]: any,
};

type SuspenseBoundary = {
  id: SuspenseBoundaryID,
  rootSegmentID: number,
  forceClientRender: boolean, // if it errors or infinitely suspends
  parentFlushed: boolean,
  pendingTasks: number, // when it reaches zero we can show this boundary's content
  completedSegments: Array<Segment>, // completed but not yet flushed segments.
  byteSize: number, // used to determine whether to inline children boundaries.
  fallbackAbortableTasks: Set<Task>, // used to cancel task on the fallback if the boundary completes or gets canceled.
};

export type Task = {
  node: ReactNodeList,
  ping: () => void,
  blockedBoundary: Root | SuspenseBoundary,
  blockedSegment: Segment, // the segment we'll write to
  abortSet: Set<Task>, // the abortable set that this task belongs to
  legacyContext: LegacyContext, // the current legacy context that this task is executing in
  context: ContextSnapshot, // the current new context that this task is executing in
  treeContext: TreeContext, // the current tree context that this task is executing in
  componentStack: null | ComponentStackNode, // DEV-only component stack
};

const PENDING = 0;
const COMPLETED = 1;
const FLUSHED = 2;
const ABORTED = 3;
const ERRORED = 4;

type Root = null;

type Segment = {
  status: 0 | 1 | 2 | 3 | 4,
  parentFlushed: boolean, // typically a segment will be flushed by its parent, except if its parent was already flushed
  id: number, // starts as 0 and is lazily assigned if the parent flushes early
  +index: number, // the index within the parent's chunks or 0 at the root
  +chunks: Array<Chunk | PrecomputedChunk>,
  +children: Array<Segment>,
  // The context that this segment was created in.
  formatContext: FormatContext,
  // If this segment represents a fallback, this is the content that will replace that fallback.
  +boundary: null | SuspenseBoundary,
};

const OPEN = 0;
const CLOSING = 1;
const CLOSED = 2;

export opaque type Request = {
  destination: null | Destination,
  +responseState: ResponseState,
  +progressiveChunkSize: number,
  status: 0 | 1 | 2,
  fatalError: mixed,
  nextSegmentId: number,
  allPendingTasks: number, // when it reaches zero, we can close the connection.
  pendingRootTasks: number, // when this reaches zero, we've finished at least the root boundary.
  completedRootSegment: null | Segment, // Completed but not yet flushed root segments.
  abortableTasks: Set<Task>,
  pingedTasks: Array<Task>,
  // Queues to flush in order of priority
  clientRenderedBoundaries: Array<SuspenseBoundary>, // Errored or client rendered but not yet flushed.
  completedBoundaries: Array<SuspenseBoundary>, // Completed but not yet fully flushed boundaries to show.
  partialBoundaries: Array<SuspenseBoundary>, // Partially completed boundaries that can flush its segments early.
  // onError is called when an error happens anywhere in the tree. It might recover.
  onError: (error: mixed) => void,
  // onAllReady is called when all pending task is done but it may not have flushed yet.
  // This is a good time to start writing if you want only HTML and no intermediate steps.
  onAllReady: () => void,
  // onShellReady is called when there is at least a root fallback ready to show.
  // Typically you don't need this callback because it's best practice to always have a
  // root fallback ready so there's no need to wait.
  onShellReady: () => void,
  // onShellError is called when the shell didn't complete. That means you probably want to
  // emit a different response to the stream instead.
  onShellError: (error: mixed) => void,
  onFatalError: (error: mixed) => void,
};

// This is a default heuristic for how to split up the HTML content into progressive
// loading. Our goal is to be able to display additional new content about every 500ms.
// Faster than that is unnecessary and should be throttled on the client. It also
// adds unnecessary overhead to do more splits. We don't know if it's a higher or lower
// end device but higher end suffer less from the overhead than lower end does from
// not getting small enough pieces. We error on the side of low end.
// We base this on low end 3G speeds which is about 500kbits per second. We assume
// that there can be a reasonable drop off from max bandwidth which leaves you with
// as little as 80%. We can receive half of that each 500ms - at best. In practice,
// a little bandwidth is lost to processing and contention - e.g. CSS and images that
// are downloaded along with the main content. So we estimate about half of that to be
// the lower end throughput. In other words, we expect that you can at least show
// about 12.5kb of content per 500ms. Not counting starting latency for the first
// paint.
// 500 * 1024 / 8 * .8 * 0.5 / 2
const DEFAULT_PROGRESSIVE_CHUNK_SIZE = 12800;

function defaultErrorHandler(error: mixed) {
  console['error'](error); // Don't transform to our wrapper
}

function noop(): void {}

export function createRequest(
  children: ReactNodeList,
  responseState: ResponseState,
  rootFormatContext: FormatContext,
  progressiveChunkSize: void | number,
  onError: void | ((error: mixed) => void),
  onAllReady: void | (() => void),
  onShellReady: void | (() => void),
  onShellError: void | ((error: mixed) => void),
  onFatalError: void | ((error: mixed) => void),
): Request {
  const pingedTasks = [];
  const abortSet: Set<Task> = new Set();
  const request = {
    destination: null,
    responseState,
    progressiveChunkSize:
      progressiveChunkSize === undefined
        ? DEFAULT_PROGRESSIVE_CHUNK_SIZE
        : progressiveChunkSize,
    status: OPEN,
    fatalError: null,
    nextSegmentId: 0,
    allPendingTasks: 0,
    pendingRootTasks: 0,
    completedRootSegment: null,
    abortableTasks: abortSet,
    pingedTasks: pingedTasks,
    clientRenderedBoundaries: [],
    completedBoundaries: [],
    partialBoundaries: [],
    onError: onError === undefined ? defaultErrorHandler : onError,
    onAllReady: onAllReady === undefined ? noop : onAllReady,
    onShellReady: onShellReady === undefined ? noop : onShellReady,
    onShellError: onShellError === undefined ? noop : onShellError,
    onFatalError: onFatalError === undefined ? noop : onFatalError,
  };
  // This segment represents the root fallback.
  const rootSegment = createPendingSegment(request, 0, null, rootFormatContext);
  // There is no parent so conceptually, we're unblocked to flush this segment.
  rootSegment.parentFlushed = true;
  const rootTask = createTask(
    request,
    children,
    null,
    rootSegment,
    abortSet,
    emptyContextObject,
    rootContextSnapshot,
    emptyTreeContext,
  );
  pingedTasks.push(rootTask);
  return request;
}

function pingTask(request: Request, task: Task): void {
  const pingedTasks = request.pingedTasks;
  pingedTasks.push(task);
  if (pingedTasks.length === 1) {
    scheduleWork(() => performWork(request));
  }
}

function createSuspenseBoundary(
  request: Request,
  fallbackAbortableTasks: Set<Task>,
): SuspenseBoundary {
  return {
    id: UNINITIALIZED_SUSPENSE_BOUNDARY_ID,
    rootSegmentID: -1,
    parentFlushed: false,
    pendingTasks: 0,
    forceClientRender: false,
    completedSegments: [],
    byteSize: 0,
    fallbackAbortableTasks,
  };
}

function createTask(
  request: Request,
  node: ReactNodeList,
  blockedBoundary: Root | SuspenseBoundary,
  blockedSegment: Segment,
  abortSet: Set<Task>,
  legacyContext: LegacyContext,
  context: ContextSnapshot,
  treeContext: TreeContext,
): Task {
  request.allPendingTasks++;
  if (blockedBoundary === null) {
    request.pendingRootTasks++;
  } else {
    blockedBoundary.pendingTasks++;
  }
  const task: Task = ({
    node,
    ping: () => pingTask(request, task),
    blockedBoundary,
    blockedSegment,
    abortSet,
    legacyContext,
    context,
    treeContext,
  }: any);
  if (__DEV__) {
    task.componentStack = null;
  }
  abortSet.add(task);
  return task;
}

function createPendingSegment(
  request: Request,
  index: number,
  boundary: null | SuspenseBoundary,
  formatContext: FormatContext,
): Segment {
  return {
    status: PENDING,
    id: -1, // lazily assigned later
    index,
    parentFlushed: false,
    chunks: [],
    children: [],
    formatContext,
    boundary,
  };
}

// DEV-only global reference to the currently executing task
let currentTaskInDEV: null | Task = null;
function getCurrentStackInDEV(): string {
  if (__DEV__) {
    if (currentTaskInDEV === null || currentTaskInDEV.componentStack === null) {
      return '';
    }
    return getStackByComponentStackNode(currentTaskInDEV.componentStack);
  }
  return '';
}

function pushBuiltInComponentStackInDEV(task: Task, type: string): void {
  if (__DEV__) {
    task.componentStack = {
      tag: 0,
      parent: task.componentStack,
      type,
    };
  }
}
function pushFunctionComponentStackInDEV(task: Task, type: Function): void {
  if (__DEV__) {
    task.componentStack = {
      tag: 1,
      parent: task.componentStack,
      type,
    };
  }
}
function pushClassComponentStackInDEV(task: Task, type: Function): void {
  if (__DEV__) {
    task.componentStack = {
      tag: 2,
      parent: task.componentStack,
      type,
    };
  }
}
function popComponentStackInDEV(task: Task): void {
  if (__DEV__) {
    if (task.componentStack === null) {
      console.error(
        'Unexpectedly popped too many stack frames. This is a bug in React.',
      );
    } else {
      task.componentStack = task.componentStack.parent;
    }
  }
}

function logRecoverableError(request: Request, error: mixed): void {
  // If this callback errors, we intentionally let that error bubble up to become a fatal error
  // so that someone fixes the error reporting instead of hiding it.
  const onError = request.onError;
  onError(error);
}

function fatalError(request: Request, error: mixed): void {
  // This is called outside error handling code such as if the root errors outside
  // a suspense boundary or if the root suspense boundary's fallback errors.
  // It's also called if React itself or its host configs errors.
  const onShellError = request.onShellError;
  onShellError(error);
  const onFatalError = request.onFatalError;
  onFatalError(error);
  if (request.destination !== null) {
    request.status = CLOSED;
    closeWithError(request.destination, error);
  } else {
    request.status = CLOSING;
    request.fatalError = error;
  }
}

function renderSuspenseBoundary(
  request: Request,
  task: Task,
  props: Object,
): void {
  pushBuiltInComponentStackInDEV(task, 'Suspense');
  const parentBoundary = task.blockedBoundary;
  const parentSegment = task.blockedSegment;

  // Each time we enter a suspense boundary, we split out into a new segment for
  // the fallback so that we can later replace that segment with the content.
  // This also lets us split out the main content even if it doesn't suspend,
  // in case it ends up generating a large subtree of content.
  const fallback: ReactNodeList = props.fallback;
  const content: ReactNodeList = props.children;

  const fallbackAbortSet: Set<Task> = new Set();
  const newBoundary = createSuspenseBoundary(request, fallbackAbortSet);
  const insertionIndex = parentSegment.chunks.length;
  // The children of the boundary segment is actually the fallback.
  const boundarySegment = createPendingSegment(
    request,
    insertionIndex,
    newBoundary,
    parentSegment.formatContext,
  );
  parentSegment.children.push(boundarySegment);

  // This segment is the actual child content. We can start rendering that immediately.
  const contentRootSegment = createPendingSegment(
    request,
    0,
    null,
    parentSegment.formatContext,
  );
  // We mark the root segment as having its parent flushed. It's not really flushed but there is
  // no parent segment so there's nothing to wait on.
  contentRootSegment.parentFlushed = true;

  // Currently this is running synchronously. We could instead schedule this to pingedTasks.
  // I suspect that there might be some efficiency benefits from not creating the suspended task
  // and instead just using the stack if possible.
  // TODO: Call this directly instead of messing with saving and restoring contexts.

  // We can reuse the current context and task to render the content immediately without
  // context switching. We just need to temporarily switch which boundary and which segment
  // we're writing to. If something suspends, it'll spawn new suspended task with that context.
  task.blockedBoundary = newBoundary;
  task.blockedSegment = contentRootSegment;
  try {
    // We use the safe form because we don't handle suspending here. Only error handling.
    renderNode(request, task, content);
    contentRootSegment.status = COMPLETED;
    queueCompletedSegment(newBoundary, contentRootSegment);
    if (newBoundary.pendingTasks === 0) {
      // This must have been the last segment we were waiting on. This boundary is now complete.
      // Therefore we won't need the fallback. We early return so that we don't have to create
      // the fallback.
      popComponentStackInDEV(task);
      return;
    }
  } catch (error) {
    contentRootSegment.status = ERRORED;
    logRecoverableError(request, error);
    newBoundary.forceClientRender = true;
    // We don't need to decrement any task numbers because we didn't spawn any new task.
    // We don't need to schedule any task because we know the parent has written yet.
    // We do need to fallthrough to create the fallback though.
  } finally {
    task.blockedBoundary = parentBoundary;
    task.blockedSegment = parentSegment;
  }

  // We create suspended task for the fallback because we don't want to actually work
  // on it yet in case we finish the main content, so we queue for later.
  const suspendedFallbackTask = createTask(
    request,
    fallback,
    parentBoundary,
    boundarySegment,
    fallbackAbortSet,
    task.legacyContext,
    task.context,
    task.treeContext,
  );
  if (__DEV__) {
    suspendedFallbackTask.componentStack = task.componentStack;
  }
  // TODO: This should be queued at a separate lower priority queue so that we only work
  // on preparing fallbacks if we don't have any more main content to task on.
  request.pingedTasks.push(suspendedFallbackTask);

  popComponentStackInDEV(task);
}

function renderBackupSuspenseBoundary(
  request: Request,
  task: Task,
  props: Object,
) {
  pushBuiltInComponentStackInDEV(task, 'Suspense');

  const content = props.children;
  const segment = task.blockedSegment;

  pushStartCompletedSuspenseBoundary(segment.chunks);
  renderNode(request, task, content);
  pushEndCompletedSuspenseBoundary(segment.chunks);

  popComponentStackInDEV(task);
}

function renderHostElement(
  request: Request,
  task: Task,
  type: string,
  props: Object,
): void {
  pushBuiltInComponentStackInDEV(task, type);
  const segment = task.blockedSegment;
  const children = pushStartInstance(
    segment.chunks,
    type,
    props,
    request.responseState,
    segment.formatContext,
  );
  const prevContext = segment.formatContext;
  segment.formatContext = getChildFormatContext(prevContext, type, props);
  // We use the non-destructive form because if something suspends, we still
  // need to pop back up and finish this subtree of HTML.
  renderNode(request, task, children);
  // We expect that errors will fatal the whole task and that we don't need
  // the correct context. Therefore this is not in a finally.
  segment.formatContext = prevContext;
  pushEndInstance(segment.chunks, type, props);
  popComponentStackInDEV(task);
}

function shouldConstruct(Component) {
  return Component.prototype && Component.prototype.isReactComponent;
}

function renderWithHooks<Props, SecondArg>(
  request: Request,
  task: Task,
  Component: (p: Props, arg: SecondArg) => any,
  props: Props,
  secondArg: SecondArg,
): any {
  const componentIdentity = {};
  prepareToUseHooks(task, componentIdentity);
  const result = Component(props, secondArg);
  return finishHooks(Component, props, result, secondArg);
}

function finishClassComponent(
  request: Request,
  task: Task,
  instance: any,
  Component: any,
  props: any,
): ReactNodeList {
  const nextChildren = instance.render();

  if (__DEV__) {
    if (instance.props !== props) {
      if (!didWarnAboutReassigningProps) {
        console.error(
          'It looks like %s is reassigning its own `this.props` while rendering. ' +
            'This is not supported and can lead to confusing bugs.',
          getComponentNameFromType(Component) || 'a component',
        );
      }
      didWarnAboutReassigningProps = true;
    }
  }

  if (!disableLegacyContext) {
    const childContextTypes = Component.childContextTypes;
    if (childContextTypes !== null && childContextTypes !== undefined) {
      const previousContext = task.legacyContext;
      const mergedContext = processChildContext(
        instance,
        Component,
        previousContext,
        childContextTypes,
      );
      task.legacyContext = mergedContext;
      renderNodeDestructive(request, task, nextChildren);
      task.legacyContext = previousContext;
      return;
    }
  }

  renderNodeDestructive(request, task, nextChildren);
}

function renderClassComponent(
  request: Request,
  task: Task,
  Component: any,
  props: any,
): void {
  pushClassComponentStackInDEV(task, Component);
  const maskedContext = !disableLegacyContext
    ? getMaskedContext(Component, task.legacyContext)
    : undefined;
  const instance = constructClassInstance(Component, props, maskedContext);
  mountClassInstance(instance, Component, props, maskedContext);
  finishClassComponent(request, task, instance, Component, props);
  popComponentStackInDEV(task);
}

const didWarnAboutBadClass = {};
const didWarnAboutModulePatternComponent = {};
const didWarnAboutContextTypeOnFunctionComponent = {};
const didWarnAboutGetDerivedStateOnFunctionComponent = {};
let didWarnAboutReassigningProps = false;
const didWarnAboutDefaultPropsOnFunctionComponent = {};
let didWarnAboutGenerators = false;
let didWarnAboutMaps = false;
let hasWarnedAboutUsingContextAsConsumer = false;

// This would typically be a function component but we still support module pattern
// components for some reason.
function renderIndeterminateComponent(
  request: Request,
  task: Task,
  Component: any,
  props: any,
): void {
  let legacyContext;
  if (!disableLegacyContext) {
    legacyContext = getMaskedContext(Component, task.legacyContext);
  }
  pushFunctionComponentStackInDEV(task, Component);

  if (__DEV__) {
    if (
      Component.prototype &&
      typeof Component.prototype.render === 'function'
    ) {
      const componentName = getComponentNameFromType(Component) || 'Unknown';

      if (!didWarnAboutBadClass[componentName]) {
        console.error(
          "The <%s /> component appears to have a render method, but doesn't extend React.Component. " +
            'This is likely to cause errors. Change %s to extend React.Component instead.',
          componentName,
          componentName,
        );
        didWarnAboutBadClass[componentName] = true;
      }
    }
  }

  const value = renderWithHooks(request, task, Component, props, legacyContext);
  const hasId = checkDidRenderIdHook();

  if (__DEV__) {
    // Support for module components is deprecated and is removed behind a flag.
    // Whether or not it would crash later, we want to show a good message in DEV first.
    if (
      typeof value === 'object' &&
      value !== null &&
      typeof value.render === 'function' &&
      value.$$typeof === undefined
    ) {
      const componentName = getComponentNameFromType(Component) || 'Unknown';
      if (!didWarnAboutModulePatternComponent[componentName]) {
        console.error(
          'The <%s /> component appears to be a function component that returns a class instance. ' +
            'Change %s to a class that extends React.Component instead. ' +
            "If you can't use a class try assigning the prototype on the function as a workaround. " +
            "`%s.prototype = React.Component.prototype`. Don't use an arrow function since it " +
            'cannot be called with `new` by React.',
          componentName,
          componentName,
          componentName,
        );
        didWarnAboutModulePatternComponent[componentName] = true;
      }
    }
  }

  if (
    // Run these checks in production only if the flag is off.
    // Eventually we'll delete this branch altogether.
    !disableModulePatternComponents &&
    typeof value === 'object' &&
    value !== null &&
    typeof value.render === 'function' &&
    value.$$typeof === undefined
  ) {
    if (__DEV__) {
      const componentName = getComponentNameFromType(Component) || 'Unknown';
      if (!didWarnAboutModulePatternComponent[componentName]) {
        console.error(
          'The <%s /> component appears to be a function component that returns a class instance. ' +
            'Change %s to a class that extends React.Component instead. ' +
            "If you can't use a class try assigning the prototype on the function as a workaround. " +
            "`%s.prototype = React.Component.prototype`. Don't use an arrow function since it " +
            'cannot be called with `new` by React.',
          componentName,
          componentName,
          componentName,
        );
        didWarnAboutModulePatternComponent[componentName] = true;
      }
    }

    mountClassInstance(value, Component, props, legacyContext);
    finishClassComponent(request, task, value, Component, props);
  } else {
    // Proceed under the assumption that this is a function component
    if (__DEV__) {
      if (disableLegacyContext && Component.contextTypes) {
        console.error(
          '%s uses the legacy contextTypes API which is no longer supported. ' +
            'Use React.createContext() with React.useContext() instead.',
          getComponentNameFromType(Component) || 'Unknown',
        );
      }
    }
    if (__DEV__) {
      validateFunctionComponentInDev(Component);
    }
    // We're now successfully past this task, and we don't have to pop back to
    // the previous task every again, so we can use the destructive recursive form.
    if (hasId) {
      // This component materialized an id. We treat this as its own level, with
      // a single "child" slot.
      const prevTreeContext = task.treeContext;
      const totalChildren = 1;
      const index = 0;
      task.treeContext = pushTreeContext(prevTreeContext, totalChildren, index);
      try {
        renderNodeDestructive(request, task, value);
      } finally {
        task.treeContext = prevTreeContext;
      }
    } else {
      renderNodeDestructive(request, task, value);
    }
  }
  popComponentStackInDEV(task);
}

function validateFunctionComponentInDev(Component: any): void {
  if (__DEV__) {
    if (Component) {
      if (Component.childContextTypes) {
        console.error(
          '%s(...): childContextTypes cannot be defined on a function component.',
          Component.displayName || Component.name || 'Component',
        );
      }
    }

    if (
      warnAboutDefaultPropsOnFunctionComponents &&
      Component.defaultProps !== undefined
    ) {
      const componentName = getComponentNameFromType(Component) || 'Unknown';

      if (!didWarnAboutDefaultPropsOnFunctionComponent[componentName]) {
        console.error(
          '%s: Support for defaultProps will be removed from function components ' +
            'in a future major release. Use JavaScript default parameters instead.',
          componentName,
        );
        didWarnAboutDefaultPropsOnFunctionComponent[componentName] = true;
      }
    }

    if (typeof Component.getDerivedStateFromProps === 'function') {
      const componentName = getComponentNameFromType(Component) || 'Unknown';

      if (!didWarnAboutGetDerivedStateOnFunctionComponent[componentName]) {
        console.error(
          '%s: Function components do not support getDerivedStateFromProps.',
          componentName,
        );
        didWarnAboutGetDerivedStateOnFunctionComponent[componentName] = true;
      }
    }

    if (
      typeof Component.contextType === 'object' &&
      Component.contextType !== null
    ) {
      const componentName = getComponentNameFromType(Component) || 'Unknown';

      if (!didWarnAboutContextTypeOnFunctionComponent[componentName]) {
        console.error(
          '%s: Function components do not support contextType.',
          componentName,
        );
        didWarnAboutContextTypeOnFunctionComponent[componentName] = true;
      }
    }
  }
}

function resolveDefaultProps(Component: any, baseProps: Object): Object {
  if (Component && Component.defaultProps) {
    // Resolve default props. Taken from ReactElement
    const props = assign({}, baseProps);
    const defaultProps = Component.defaultProps;
    for (const propName in defaultProps) {
      if (props[propName] === undefined) {
        props[propName] = defaultProps[propName];
      }
    }
    return props;
  }
  return baseProps;
}

function renderForwardRef(
  request: Request,
  task: Task,
  type: any,
  props: Object,
  ref: any,
): void {
  pushFunctionComponentStackInDEV(task, type.render);
  const children = renderWithHooks(request, task, type.render, props, ref);
  const hasId = checkDidRenderIdHook();
  if (hasId) {
    // This component materialized an id. We treat this as its own level, with
    // a single "child" slot.
    const prevTreeContext = task.treeContext;
    const totalChildren = 1;
    const index = 0;
    task.treeContext = pushTreeContext(prevTreeContext, totalChildren, index);
    try {
      renderNodeDestructive(request, task, children);
    } finally {
      task.treeContext = prevTreeContext;
    }
  } else {
    renderNodeDestructive(request, task, children);
  }
  popComponentStackInDEV(task);
}

function renderMemo(
  request: Request,
  task: Task,
  type: any,
  props: Object,
  ref: any,
): void {
  const innerType = type.type;
  const resolvedProps = resolveDefaultProps(innerType, props);
  renderElement(request, task, innerType, resolvedProps, ref);
}

function renderContextConsumer(
  request: Request,
  task: Task,
  context: ReactContext<any>,
  props: Object,
): void {
  // The logic below for Context differs depending on PROD or DEV mode. In
  // DEV mode, we create a separate object for Context.Consumer that acts
  // like a proxy to Context. This proxy object adds unnecessary code in PROD
  // so we use the old behaviour (Context.Consumer references Context) to
  // reduce size and overhead. The separate object references context via
  // a property called "_context", which also gives us the ability to check
  // in DEV mode if this property exists or not and warn if it does not.
  if (__DEV__) {
    if ((context: any)._context === undefined) {
      // This may be because it's a Context (rather than a Consumer).
      // Or it may be because it's older React where they're the same thing.
      // We only want to warn if we're sure it's a new React.
      if (context !== context.Consumer) {
        if (!hasWarnedAboutUsingContextAsConsumer) {
          hasWarnedAboutUsingContextAsConsumer = true;
          console.error(
            'Rendering <Context> directly is not supported and will be removed in ' +
              'a future major release. Did you mean to render <Context.Consumer> instead?',
          );
        }
      }
    } else {
      context = (context: any)._context;
    }
  }
  const render = props.children;

  if (__DEV__) {
    if (typeof render !== 'function') {
      console.error(
        'A context consumer was rendered with multiple children, or a child ' +
          "that isn't a function. A context consumer expects a single child " +
          'that is a function. If you did pass a function, make sure there ' +
          'is no trailing or leading whitespace around it.',
      );
    }
  }

  const newValue = readContext(context);
  const newChildren = render(newValue);

  renderNodeDestructive(request, task, newChildren);
}

function renderContextProvider(
  request: Request,
  task: Task,
  type: ReactProviderType<any>,
  props: Object,
): void {
  const context = type._context;
  const value = props.value;
  const children = props.children;
  let prevSnapshot;
  if (__DEV__) {
    prevSnapshot = task.context;
  }
  task.context = pushProvider(context, value);
  renderNodeDestructive(request, task, children);
  task.context = popProvider(context);
  if (__DEV__) {
    if (prevSnapshot !== task.context) {
      console.error(
        'Popping the context provider did not return back to the original snapshot. This is a bug in React.',
      );
    }
  }
}

function renderLazyComponent(
  request: Request,
  task: Task,
  lazyComponent: LazyComponentType<any, any>,
  props: Object,
  ref: any,
): void {
  pushBuiltInComponentStackInDEV(task, 'Lazy');
  const payload = lazyComponent._payload;
  const init = lazyComponent._init;
  const Component = init(payload);
  const resolvedProps = resolveDefaultProps(Component, props);
  renderElement(request, task, Component, resolvedProps, ref);
  popComponentStackInDEV(task);
}

function renderElement(
  request: Request,
  task: Task,
  type: any,
  props: Object,
  ref: any,
): void {
  if (typeof type === 'function') {
    if (shouldConstruct(type)) {
      renderClassComponent(request, task, type, props);
      return;
    } else {
      renderIndeterminateComponent(request, task, type, props);
      return;
    }
  }
  if (typeof type === 'string') {
    renderHostElement(request, task, type, props);
    return;
  }

  switch (type) {
    // TODO: LegacyHidden acts the same as a fragment. This only works
    // because we currently assume that every instance of LegacyHidden is
    // accompanied by a host component wrapper. In the hidden mode, the host
    // component is given a `hidden` attribute, which ensures that the
    // initial HTML is not visible. To support the use of LegacyHidden as a
    // true fragment, without an extra DOM node, we would have to hide the
    // initial HTML in some other way.
    // TODO: Add REACT_OFFSCREEN_TYPE here too with the same capability.
    case REACT_LEGACY_HIDDEN_TYPE:
    case REACT_DEBUG_TRACING_MODE_TYPE:
    case REACT_STRICT_MODE_TYPE:
    case REACT_PROFILER_TYPE:
    case REACT_FRAGMENT_TYPE: {
      renderNodeDestructive(request, task, props.children);
      return;
    }
    case REACT_SUSPENSE_LIST_TYPE: {
      pushBuiltInComponentStackInDEV(task, 'SuspenseList');
      // TODO: SuspenseList should control the boundaries.
      renderNodeDestructive(request, task, props.children);
      popComponentStackInDEV(task);
      return;
    }
    case REACT_SCOPE_TYPE: {
      if (enableScopeAPI) {
        renderNodeDestructive(request, task, props.children);
        return;
      }
      throw new Error('ReactDOMServer does not yet support scope components.');
    }
    // eslint-disable-next-line-no-fallthrough
    case REACT_SUSPENSE_TYPE: {
      if (
        enableSuspenseAvoidThisFallbackFizz &&
        props.unstable_avoidThisFallback === true
      ) {
        renderBackupSuspenseBoundary(request, task, props);
      } else {
        renderSuspenseBoundary(request, task, props);
      }
      return;
    }
  }

  if (typeof type === 'object' && type !== null) {
    switch (type.$$typeof) {
      case REACT_FORWARD_REF_TYPE: {
        renderForwardRef(request, task, type, props, ref);
        return;
      }
      case REACT_MEMO_TYPE: {
        renderMemo(request, task, type, props, ref);
        return;
      }
      case REACT_PROVIDER_TYPE: {
        renderContextProvider(request, task, type, props);
        return;
      }
      case REACT_CONTEXT_TYPE: {
        renderContextConsumer(request, task, type, props);
        return;
      }
      case REACT_LAZY_TYPE: {
        renderLazyComponent(request, task, type, props);
        return;
      }
    }
  }

  let info = '';
  if (__DEV__) {
    if (
      type === undefined ||
      (typeof type === 'object' &&
        type !== null &&
        Object.keys(type).length === 0)
    ) {
      info +=
        ' You likely forgot to export your component from the file ' +
        "it's defined in, or you might have mixed up default and " +
        'named imports.';
    }
  }

  throw new Error(
    'Element type is invalid: expected a string (for built-in ' +
      'components) or a class/function (for composite components) ' +
      `but got: ${type == null ? type : typeof type}.${info}`,
  );
}

function validateIterable(iterable, iteratorFn: Function): void {
  if (__DEV__) {
    // We don't support rendering Generators because it's a mutation.
    // See https://github.com/facebook/react/issues/12995
    if (
      typeof Symbol === 'function' &&
      // $FlowFixMe Flow doesn't know about toStringTag
      iterable[Symbol.toStringTag] === 'Generator'
    ) {
      if (!didWarnAboutGenerators) {
        console.error(
          'Using Generators as children is unsupported and will likely yield ' +
            'unexpected results because enumerating a generator mutates it. ' +
            'You may convert it to an array with `Array.from()` or the ' +
            '`[...spread]` operator before rendering. Keep in mind ' +
            'you might need to polyfill these features for older browsers.',
        );
      }
      didWarnAboutGenerators = true;
    }

    // Warn about using Maps as children
    if ((iterable: any).entries === iteratorFn) {
      if (!didWarnAboutMaps) {
        console.error(
          'Using Maps as children is not supported. ' +
            'Use an array of keyed ReactElements instead.',
        );
      }
      didWarnAboutMaps = true;
    }
  }
}

// This function by it self renders a node and consumes the task by mutating it
// to update the current execution state.
function renderNodeDestructive(
  request: Request,
  task: Task,
  node: ReactNodeList,
): void {
  // Stash the node we're working on. We'll pick up from this task in case
  // something suspends.
  task.node = node;

  // Handle object types
  if (typeof node === 'object' && node !== null) {
    switch ((node: any).$$typeof) {
      case REACT_ELEMENT_TYPE: {
        const element: React$Element<any> = (node: any);
        const type = element.type;
        const props = element.props;
        const ref = element.ref;
        renderElement(request, task, type, props, ref);
        return;
      }
      case REACT_PORTAL_TYPE:
        throw new Error(
          'Portals are not currently supported by the server renderer. ' +
            'Render them conditionally so that they only appear on the client render.',
        );
      // eslint-disable-next-line-no-fallthrough
      case REACT_LAZY_TYPE: {
        const lazyNode: LazyComponentType<any, any> = (node: any);
        const payload = lazyNode._payload;
        const init = lazyNode._init;
        const resolvedNode = init(payload);
        renderNodeDestructive(request, task, resolvedNode);
        return;
      }
    }

    if (isArray(node)) {
      renderChildrenArray(request, task, node);
      return;
    }

    const iteratorFn = getIteratorFn(node);
    if (iteratorFn) {
      if (__DEV__) {
        validateIterable(node, iteratorFn);
      }
      const iterator = iteratorFn.call(node);
      if (iterator) {
        // We need to know how many total children are in this set, so that we
        // can allocate enough id slots to acommodate them. So we must exhaust
        // the iterator before we start recursively rendering the children.
        // TODO: This is not great but I think it's inherent to the id
        // generation algorithm.
        let step = iterator.next();
        // If there are not entries, we need to push an empty so we start by checking that.
        if (!step.done) {
          const children = [];
          do {
            children.push(step.value);
            step = iterator.next();
          } while (!step.done);
          renderChildrenArray(request, task, children);
          return;
        }
        return;
      }
    }

    const childString = Object.prototype.toString.call(node);

    throw new Error(
      `Objects are not valid as a React child (found: ${
        childString === '[object Object]'
          ? 'object with keys {' + Object.keys(node).join(', ') + '}'
          : childString
      }). ` +
        'If you meant to render a collection of children, use an array ' +
        'instead.',
    );
  }

  if (typeof node === 'string') {
    pushTextInstance(task.blockedSegment.chunks, node, request.responseState);
    return;
  }

  if (typeof node === 'number') {
    pushTextInstance(
      task.blockedSegment.chunks,
      '' + node,
      request.responseState,
    );
    return;
  }

  if (__DEV__) {
    if (typeof node === 'function') {
      console.error(
        'Functions are not valid as a React child. This may happen if ' +
          'you return a Component instead of <Component /> from render. ' +
          'Or maybe you meant to call this function rather than return it.',
      );
    }
  }
}

function renderChildrenArray(request, task, children) {
  const totalChildren = children.length;
  for (let i = 0; i < totalChildren; i++) {
    const prevTreeContext = task.treeContext;
    task.treeContext = pushTreeContext(prevTreeContext, totalChildren, i);
    try {
      // We need to use the non-destructive form so that we can safely pop back
      // up and render the sibling if something suspends.
      renderNode(request, task, children[i]);
    } finally {
      task.treeContext = prevTreeContext;
    }
  }
}

function spawnNewSuspendedTask(
  request: Request,
  task: Task,
  x: Promise<any>,
): void {
  // Something suspended, we'll need to create a new segment and resolve it later.
  const segment = task.blockedSegment;
  const insertionIndex = segment.chunks.length;
  const newSegment = createPendingSegment(
    request,
    insertionIndex,
    null,
    segment.formatContext,
  );
  segment.children.push(newSegment);
  const newTask = createTask(
    request,
    task.node,
    task.blockedBoundary,
    newSegment,
    task.abortSet,
    task.legacyContext,
    task.context,
    task.treeContext,
  );
  if (__DEV__) {
    if (task.componentStack !== null) {
      // We pop one task off the stack because the node that suspended will be tried again,
      // which will add it back onto the stack.
      newTask.componentStack = task.componentStack.parent;
    }
  }
  const ping = newTask.ping;
  x.then(ping, ping);
}

// This is a non-destructive form of rendering a node. If it suspends it spawns
// a new task and restores the context of this task to what it was before.
function renderNode(request: Request, task: Task, node: ReactNodeList): void {
  // TODO: Store segment.children.length here and reset it in case something
  // suspended partially through writing something.

  // Snapshot the current context in case something throws to interrupt the
  // process.
  const previousFormatContext = task.blockedSegment.formatContext;
  const previousLegacyContext = task.legacyContext;
  const previousContext = task.context;
  let previousComponentStack = null;
  if (__DEV__) {
    previousComponentStack = task.componentStack;
  }
  try {
    return renderNodeDestructive(request, task, node);
  } catch (x) {
    resetHooksState();
    if (typeof x === 'object' && x !== null && typeof x.then === 'function') {
      spawnNewSuspendedTask(request, task, x);
      // Restore the context. We assume that this will be restored by the inner
      // functions in case nothing throws so we don't use "finally" here.
      task.blockedSegment.formatContext = previousFormatContext;
      task.legacyContext = previousLegacyContext;
      task.context = previousContext;
      // Restore all active ReactContexts to what they were before.
      switchContext(previousContext);
      if (__DEV__) {
        task.componentStack = previousComponentStack;
      }
      return;
    } else {
      // Restore the context. We assume that this will be restored by the inner
      // functions in case nothing throws so we don't use "finally" here.
      task.blockedSegment.formatContext = previousFormatContext;
      task.legacyContext = previousLegacyContext;
      task.context = previousContext;
      // Restore all active ReactContexts to what they were before.
      switchContext(previousContext);
      if (__DEV__) {
        task.componentStack = previousComponentStack;
      }
      // We assume that we don't need the correct context.
      // Let's terminate the rest of the tree and don't render any siblings.
      throw x;
    }
  }
}

function erroredTask(
  request: Request,
  boundary: Root | SuspenseBoundary,
  segment: Segment,
  error: mixed,
) {
  // Report the error to a global handler.
  logRecoverableError(request, error);
  if (boundary === null) {
    fatalError(request, error);
  } else {
    boundary.pendingTasks--;
    if (!boundary.forceClientRender) {
      boundary.forceClientRender = true;

      // Regardless of what happens next, this boundary won't be displayed,
      // so we can flush it, if the parent already flushed.
      if (boundary.parentFlushed) {
        // We don't have a preference where in the queue this goes since it's likely
        // to error on the client anyway. However, intentionally client-rendered
        // boundaries should be flushed earlier so that they can start on the client.
        // We reuse the same queue for errors.
        request.clientRenderedBoundaries.push(boundary);
      }
    }
  }

  request.allPendingTasks--;
  if (request.allPendingTasks === 0) {
    const onAllReady = request.onAllReady;
    onAllReady();
  }
}

function abortTaskSoft(task: Task): void {
  // This aborts task without aborting the parent boundary that it blocks.
  // It's used for when we didn't need this task to complete the tree.
  // If task was needed, then it should use abortTask instead.
  const request: Request = this;
  const boundary = task.blockedBoundary;
  const segment = task.blockedSegment;
  segment.status = ABORTED;
  finishedTask(request, boundary, segment);
}

function abortTask(task: Task): void {
  // This aborts the task and aborts the parent that it blocks, putting it into
  // client rendered mode.
  const request: Request = this;
  const boundary = task.blockedBoundary;
  const segment = task.blockedSegment;
  segment.status = ABORTED;

  if (boundary === null) {
    request.allPendingTasks--;
    // We didn't complete the root so we have nothing to show. We can close
    // the request;
    if (request.status !== CLOSED) {
      request.status = CLOSED;
      if (request.destination !== null) {
        close(request.destination);
      }
    }
  } else {
    boundary.pendingTasks--;

    if (!boundary.forceClientRender) {
      boundary.forceClientRender = true;
      if (boundary.parentFlushed) {
        request.clientRenderedBoundaries.push(boundary);
      }
    }

    // If this boundary was still pending then we haven't already cancelled its fallbacks.
    // We'll need to abort the fallbacks, which will also error that parent boundary.
    boundary.fallbackAbortableTasks.forEach(abortTask, request);
    boundary.fallbackAbortableTasks.clear();

    request.allPendingTasks--;
    if (request.allPendingTasks === 0) {
      const onAllReady = request.onAllReady;
      onAllReady();
    }
  }
}

function queueCompletedSegment(
  boundary: SuspenseBoundary,
  segment: Segment,
): void {
  if (
    segment.chunks.length === 0 &&
    segment.children.length === 1 &&
    segment.children[0].boundary === null
  ) {
    // This is an empty segment. There's nothing to write, so we can instead transfer the ID
    // to the child. That way any existing references point to the child.
    const childSegment = segment.children[0];
    childSegment.id = segment.id;
    childSegment.parentFlushed = true;
    if (childSegment.status === COMPLETED) {
      queueCompletedSegment(boundary, childSegment);
    }
  } else {
    const completedSegments = boundary.completedSegments;
    completedSegments.push(segment);
  }
}

function finishedTask(
  request: Request,
  boundary: Root | SuspenseBoundary,
  segment: Segment,
) {
  if (boundary === null) {
    if (segment.parentFlushed) {
      if (request.completedRootSegment !== null) {
        throw new Error(
          'There can only be one root segment. This is a bug in React.',
        );
      }

      request.completedRootSegment = segment;
    }
    request.pendingRootTasks--;
    if (request.pendingRootTasks === 0) {
      // We have completed the shell so the shell can't error anymore.
      request.onShellError = noop;
      const onShellReady = request.onShellReady;
      onShellReady();
    }
  } else {
    boundary.pendingTasks--;
    if (boundary.forceClientRender) {
      // This already errored.
    } else if (boundary.pendingTasks === 0) {
      // This must have been the last segment we were waiting on. This boundary is now complete.
      if (segment.parentFlushed) {
        // Our parent segment already flushed, so we need to schedule this segment to be emitted.
        // If it is a segment that was aborted, we'll write other content instead so we don't need
        // to emit it.
        if (segment.status === COMPLETED) {
          queueCompletedSegment(boundary, segment);
        }
      }
      if (boundary.parentFlushed) {
        // The segment might be part of a segment that didn't flush yet, but if the boundary's
        // parent flushed, we need to schedule the boundary to be emitted.
        request.completedBoundaries.push(boundary);
      }
      // We can now cancel any pending task on the fallback since we won't need to show it anymore.
      // This needs to happen after we read the parentFlushed flags because aborting can finish
      // work which can trigger user code, which can start flushing, which can change those flags.
      boundary.fallbackAbortableTasks.forEach(abortTaskSoft, request);
      boundary.fallbackAbortableTasks.clear();
    } else {
      if (segment.parentFlushed) {
        // Our parent already flushed, so we need to schedule this segment to be emitted.
        // If it is a segment that was aborted, we'll write other content instead so we don't need
        // to emit it.
        if (segment.status === COMPLETED) {
          queueCompletedSegment(boundary, segment);
          const completedSegments = boundary.completedSegments;
          if (completedSegments.length === 1) {
            // This is the first time since we last flushed that we completed anything.
            // We can schedule this boundary to emit its partially completed segments early
            // in case the parent has already been flushed.
            if (boundary.parentFlushed) {
              request.partialBoundaries.push(boundary);
            }
          }
        }
      }
    }
  }

  request.allPendingTasks--;
  if (request.allPendingTasks === 0) {
    // This needs to be called at the very end so that we can synchronously write the result
    // in the callback if needed.
    const onAllReady = request.onAllReady;
    onAllReady();
  }
}

function retryTask(request: Request, task: Task): void {
  const segment = task.blockedSegment;
  if (segment.status !== PENDING) {
    // We completed this by other means before we had a chance to retry it.
    return;
  }
  // We restore the context to what it was when we suspended.
  // We don't restore it after we leave because it's likely that we'll end up
  // needing a very similar context soon again.
  switchContext(task.context);
  let prevTaskInDEV = null;
  if (__DEV__) {
    prevTaskInDEV = currentTaskInDEV;
    currentTaskInDEV = task;
  }
  try {
    // We call the destructive form that mutates this task. That way if something
    // suspends again, we can reuse the same task instead of spawning a new one.
    renderNodeDestructive(request, task, task.node);

    task.abortSet.delete(task);
    segment.status = COMPLETED;
    finishedTask(request, task.blockedBoundary, segment);
  } catch (x) {
    resetHooksState();
    if (typeof x === 'object' && x !== null && typeof x.then === 'function') {
      // Something suspended again, let's pick it back up later.
      const ping = task.ping;
      x.then(ping, ping);
    } else {
      task.abortSet.delete(task);
      segment.status = ERRORED;
      erroredTask(request, task.blockedBoundary, segment, x);
    }
  } finally {
    if (__DEV__) {
      currentTaskInDEV = prevTaskInDEV;
    }
  }
}

export function performWork(request: Request): void {
  if (request.status === CLOSED) {
    return;
  }
  const prevContext = getActiveContext();
  const prevDispatcher = ReactCurrentDispatcher.current;
  ReactCurrentDispatcher.current = Dispatcher;
  let prevGetCurrentStackImpl;
  if (__DEV__) {
    prevGetCurrentStackImpl = ReactDebugCurrentFrame.getCurrentStack;
    ReactDebugCurrentFrame.getCurrentStack = getCurrentStackInDEV;
  }
  const prevResponseState = currentResponseState;
  setCurrentResponseState(request.responseState);
  try {
    const pingedTasks = request.pingedTasks;
    let i;
    for (i = 0; i < pingedTasks.length; i++) {
      const task = pingedTasks[i];
      retryTask(request, task);
    }
    pingedTasks.splice(0, i);
    if (request.destination !== null) {
      flushCompletedQueues(request, request.destination);
    }
  } catch (error) {
    logRecoverableError(request, error);
    fatalError(request, error);
  } finally {
    setCurrentResponseState(prevResponseState);
    ReactCurrentDispatcher.current = prevDispatcher;
    if (__DEV__) {
      ReactDebugCurrentFrame.getCurrentStack = prevGetCurrentStackImpl;
    }
    if (prevDispatcher === Dispatcher) {
      // This means that we were in a reentrant work loop. This could happen
      // in a renderer that supports synchronous work like renderToString,
      // when it's called from within another renderer.
      // Normally we don't bother switching the contexts to their root/default
      // values when leaving because we'll likely need the same or similar
      // context again. However, when we're inside a synchronous loop like this
      // we'll to restore the context to what it was before returning.
      switchContext(prevContext);
    }
  }
}

function flushSubtree(
  request: Request,
  destination: Destination,
  segment: Segment,
): boolean {
  segment.parentFlushed = true;
  switch (segment.status) {
    case PENDING: {
      // We're emitting a placeholder for this segment to be filled in later.
      // Therefore we'll need to assign it an ID - to refer to it by.
      const segmentID = (segment.id = request.nextSegmentId++);
      return writePlaceholder(destination, request.responseState, segmentID);
    }
    case COMPLETED: {
      segment.status = FLUSHED;
      let r = true;
      const chunks = segment.chunks;
      let chunkIdx = 0;
      const children = segment.children;
      for (let childIdx = 0; childIdx < children.length; childIdx++) {
        const nextChild = children[childIdx];
        // Write all the chunks up until the next child.
        for (; chunkIdx < nextChild.index; chunkIdx++) {
          writeChunk(destination, chunks[chunkIdx]);
        }
        r = flushSegment(request, destination, nextChild);
      }
      // Finally just write all the remaining chunks
      for (; chunkIdx < chunks.length - 1; chunkIdx++) {
        writeChunk(destination, chunks[chunkIdx]);
      }
      if (chunkIdx < chunks.length) {
        r = writeChunkAndReturn(destination, chunks[chunkIdx]);
      }
      return r;
    }
    default: {
      throw new Error(
        'Aborted, errored or already flushed boundaries should not be flushed again. This is a bug in React.',
      );
    }
  }
}

function flushSegment(
  request: Request,
  destination,
  segment: Segment,
): boolean {
  const boundary = segment.boundary;
  if (boundary === null) {
    // Not a suspense boundary.
    return flushSubtree(request, destination, segment);
  }
  boundary.parentFlushed = true;
  // This segment is a Suspense boundary. We need to decide whether to
  // emit the content or the fallback now.
  if (boundary.forceClientRender) {
    // Emit a client rendered suspense boundary wrapper.
    // We never queue the inner boundary so we'll never emit its content or partial segments.

    writeStartClientRenderedSuspenseBoundary(
      destination,
      request.responseState,
    );

    // Flush the fallback.
    flushSubtree(request, destination, segment);

    return writeEndClientRenderedSuspenseBoundary(
      destination,
      request.responseState,
    );
  } else if (boundary.pendingTasks > 0) {
    // This boundary is still loading. Emit a pending suspense boundary wrapper.

    // Assign an ID to refer to the future content by.
    boundary.rootSegmentID = request.nextSegmentId++;
    if (boundary.completedSegments.length > 0) {
      // If this is at least partially complete, we can queue it to be partially emitted early.
      request.partialBoundaries.push(boundary);
    }

    /// This is the first time we should have referenced this ID.
    const id = (boundary.id = assignSuspenseBoundaryID(request.responseState));

    writeStartPendingSuspenseBoundary(destination, request.responseState, id);

    // Flush the fallback.
    flushSubtree(request, destination, segment);

    return writeEndPendingSuspenseBoundary(destination, request.responseState);
  } else if (boundary.byteSize > request.progressiveChunkSize) {
    // This boundary is large and will be emitted separately so that we can progressively show
    // other content. We add it to the queue during the flush because we have to ensure that
    // the parent flushes first so that there's something to inject it into.
    // We also have to make sure that it's emitted into the queue in a deterministic slot.
    // I.e. we can't insert it here when it completes.

    // Assign an ID to refer to the future content by.
    boundary.rootSegmentID = request.nextSegmentId++;

    request.completedBoundaries.push(boundary);
    // Emit a pending rendered suspense boundary wrapper.
    writeStartPendingSuspenseBoundary(
      destination,
      request.responseState,
      boundary.id,
    );

    // Flush the fallback.
    flushSubtree(request, destination, segment);

    return writeEndPendingSuspenseBoundary(destination, request.responseState);
  } else {
    // We can inline this boundary's content as a complete boundary.
    writeStartCompletedSuspenseBoundary(destination, request.responseState);

    const completedSegments = boundary.completedSegments;

    if (completedSegments.length !== 1) {
      throw new Error(
        'A previously unvisited boundary must have exactly one root segment. This is a bug in React.',
      );
    }

    const contentSegment = completedSegments[0];
    flushSegment(request, destination, contentSegment);

    return writeEndCompletedSuspenseBoundary(
      destination,
      request.responseState,
    );
  }
}

function flushClientRenderedBoundary(
  request: Request,
  destination: Destination,
  boundary: SuspenseBoundary,
): boolean {
  return writeClientRenderBoundaryInstruction(
    destination,
    request.responseState,
    boundary.id,
  );
}

function flushSegmentContainer(
  request: Request,
  destination: Destination,
  segment: Segment,
): boolean {
  writeStartSegment(
    destination,
    request.responseState,
    segment.formatContext,
    segment.id,
  );
  flushSegment(request, destination, segment);
  return writeEndSegment(destination, segment.formatContext);
}

function flushCompletedBoundary(
  request: Request,
  destination: Destination,
  boundary: SuspenseBoundary,
): boolean {
  const completedSegments = boundary.completedSegments;
  let i = 0;
  for (; i < completedSegments.length; i++) {
    const segment = completedSegments[i];
    flushPartiallyCompletedSegment(request, destination, boundary, segment);
  }
  completedSegments.length = 0;

  return writeCompletedBoundaryInstruction(
    destination,
    request.responseState,
    boundary.id,
    boundary.rootSegmentID,
  );
}

function flushPartialBoundary(
  request: Request,
  destination: Destination,
  boundary: SuspenseBoundary,
): boolean {
  const completedSegments = boundary.completedSegments;
  let i = 0;
  for (; i < completedSegments.length; i++) {
    const segment = completedSegments[i];
    if (
      !flushPartiallyCompletedSegment(request, destination, boundary, segment)
    ) {
      i++;
      completedSegments.splice(0, i);
      // Only write as much as the buffer wants. Something higher priority
      // might want to write later.
      return false;
    }
  }
  completedSegments.splice(0, i);
  return true;
}

function flushPartiallyCompletedSegment(
  request: Request,
  destination: Destination,
  boundary: SuspenseBoundary,
  segment: Segment,
): boolean {
  if (segment.status === FLUSHED) {
    // We've already flushed this inline.
    return true;
  }

  const segmentID = segment.id;
  if (segmentID === -1) {
    // This segment wasn't previously referred to. This happens at the root of
    // a boundary. We make kind of a leap here and assume this is the root.
    const rootSegmentID = (segment.id = boundary.rootSegmentID);

    if (rootSegmentID === -1) {
      throw new Error(
        'A root segment ID must have been assigned by now. This is a bug in React.',
      );
    }

    return flushSegmentContainer(request, destination, segment);
  } else {
    flushSegmentContainer(request, destination, segment);
    return writeCompletedSegmentInstruction(
      destination,
      request.responseState,
      segmentID,
    );
  }
}

function flushCompletedQueues(
  request: Request,
  destination: Destination,
): void {
  beginWriting(destination);
  try {
    // The structure of this is to go through each queue one by one and write
    // until the sink tells us to stop. When we should stop, we still finish writing
    // that item fully and then yield. At that point we remove the already completed
    // items up until the point we completed them.

    // TODO: Emit preloading.

    // TODO: It's kind of unfortunate to keep checking this array after we've already
    // emitted the root.
    const completedRootSegment = request.completedRootSegment;
    if (completedRootSegment !== null && request.pendingRootTasks === 0) {
      flushSegment(request, destination, completedRootSegment);
      request.completedRootSegment = null;
      writeCompletedRoot(destination, request.responseState);
    }

    // We emit client rendering instructions for already emitted boundaries first.
    // This is so that we can signal to the client to start client rendering them as
    // soon as possible.
    const clientRenderedBoundaries = request.clientRenderedBoundaries;
    let i;
    for (i = 0; i < clientRenderedBoundaries.length; i++) {
      const boundary = clientRenderedBoundaries[i];
      if (!flushClientRenderedBoundary(request, destination, boundary)) {
        request.destination = null;
        i++;
        clientRenderedBoundaries.splice(0, i);
        return;
      }
    }
    clientRenderedBoundaries.splice(0, i);

    // Next we emit any complete boundaries. It's better to favor boundaries
    // that are completely done since we can actually show them, than it is to emit
    // any individual segments from a partially complete boundary.
    const completedBoundaries = request.completedBoundaries;
    for (i = 0; i < completedBoundaries.length; i++) {
      const boundary = completedBoundaries[i];
      if (!flushCompletedBoundary(request, destination, boundary)) {
        request.destination = null;
        i++;
        completedBoundaries.splice(0, i);
        return;
      }
    }
    completedBoundaries.splice(0, i);

    // Allow anything written so far to flush to the underlying sink before
    // we continue with lower priorities.
    completeWriting(destination);
    beginWriting(destination);

    // TODO: Here we'll emit data used by hydration.

    // Next we emit any segments of any boundaries that are partially complete
    // but not deeply complete.
    const partialBoundaries = request.partialBoundaries;
    for (i = 0; i < partialBoundaries.length; i++) {
      const boundary = partialBoundaries[i];
      if (!flushPartialBoundary(request, destination, boundary)) {
        request.destination = null;
        i++;
        partialBoundaries.splice(0, i);
        return;
      }
    }
    partialBoundaries.splice(0, i);

    // Next we check the completed boundaries again. This may have had
    // boundaries added to it in case they were too larged to be inlined.
    // New ones might be added in this loop.
    const largeBoundaries = request.completedBoundaries;
    for (i = 0; i < largeBoundaries.length; i++) {
      const boundary = largeBoundaries[i];
      if (!flushCompletedBoundary(request, destination, boundary)) {
        request.destination = null;
        i++;
        largeBoundaries.splice(0, i);
        return;
      }
    }
    largeBoundaries.splice(0, i);
  } finally {
    completeWriting(destination);
    flushBuffered(destination);
    if (
      request.allPendingTasks === 0 &&
      request.pingedTasks.length === 0 &&
      request.clientRenderedBoundaries.length === 0 &&
      request.completedBoundaries.length === 0
      // We don't need to check any partially completed segments because
      // either they have pending task or they're complete.
    ) {
      if (__DEV__) {
        if (request.abortableTasks.size !== 0) {
          console.error(
            'There was still abortable task at the root when we closed. This is a bug in React.',
          );
        }
      }
      // We're done.
      close(destination);
    }
  }
}

export function startWork(request: Request): void {
  scheduleWork(() => performWork(request));
}

export function startFlowing(request: Request, destination: Destination): void {
  if (request.status === CLOSING) {
    request.status = CLOSED;
    closeWithError(destination, request.fatalError);
    return;
  }
  if (request.status === CLOSED) {
    return;
  }
  if (request.destination !== null) {
    // We're already flowing.
    return;
  }
  request.destination = destination;
  try {
    flushCompletedQueues(request, destination);
  } catch (error) {
    logRecoverableError(request, error);
    fatalError(request, error);
  }
}

// This is called to early terminate a request. It puts all pending boundaries in client rendered state.
export function abort(request: Request): void {
  try {
    const abortableTasks = request.abortableTasks;
    abortableTasks.forEach(abortTask, request);
    abortableTasks.clear();
    if (request.destination !== null) {
      flushCompletedQueues(request, request.destination);
    }
  } catch (error) {
    logRecoverableError(request, error);
    fatalError(request, error);
  }
}
