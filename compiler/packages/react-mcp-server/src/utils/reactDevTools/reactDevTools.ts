/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import {
  ReactRenderer,
  ChangeDescription,
  SerializedElement,
  PathFrame,
  Source,
  ReactComponentInfo,
  ReactDebugInfo,
  Fiber,
  FiberRoot,
  ElementType,
  ElementTypeActivity,
  ElementTypeClass,
  ElementTypeContext,
  ElementTypeForwardRef,
  ElementTypeFunction,
  ElementTypeHostComponent,
  ElementTypeMemo,
  ElementTypeOtherOrUnknown,
  ElementTypeProfiler,
  ElementTypeRoot,
  ElementTypeSuspense,
  ElementTypeSuspenseList,
  ElementTypeTracingMarker,
  ElementTypeViewTransition,
  ElementTypeVirtual,
  StrictMode,
} from './reactDevToolsTypes';

import {
  __DEBUG__,
  PROFILING_FLAG_BASIC_SUPPORT,
  PROFILING_FLAG_TIMELINE_SUPPORT,
  TREE_OPERATION_ADD,
  TREE_OPERATION_SET_SUBTREE_MODE,
  TREE_OPERATION_UPDATE_ERRORS_OR_WARNINGS,
  TREE_OPERATION_UPDATE_TREE_BASE_DURATION,
} from './reactDevToolsConstants';

import {
  getInternalReactConstants,
  getUID,
  utfEncodeString,
  componentInfoToComponentLogsMap,
  is,
  hasOwnProperty,
} from './reactDevToolsUtils';
import {
  CONCURRENT_MODE_NUMBER,
  CONCURRENT_MODE_SYMBOL_STRING,
  CONTEXT_NUMBER,
  CONTEXT_SYMBOL_STRING,
  DEPRECATED_ASYNC_MODE_SYMBOL_STRING,
  PROFILER_NUMBER,
  PROFILER_SYMBOL_STRING,
  PROVIDER_NUMBER,
  PROVIDER_SYMBOL_STRING,
  STRICT_MODE_NUMBER,
  STRICT_MODE_SYMBOL_STRING,
} from './reactDevToolsSymbols';
import {injectProfilingHooks} from './reactDevToolsUtils';

// Kinds
const FIBER_INSTANCE = 0;
const VIRTUAL_INSTANCE = 1;
const FILTERED_FIBER_INSTANCE = 2;

// This type represents a stateful instance of a Client Component i.e. a Fiber pair.
// These instances also let us track stateful DevTools meta data like id and warnings.
type FiberInstance = {
  kind: 0;
  id: number;
  parent: null | DevToolsInstance;
  firstChild: null | DevToolsInstance;
  nextSibling: null | DevToolsInstance;
  source: null | string | Error | Source; // source location of this component function, or owned child stack
  logCount: number; // total number of errors/warnings last seen
  treeBaseDuration: number; // the profiled time of the last render of this subtree
  data: Fiber; // one of a Fiber pair
};

// This type represents a stateful instance of a Server Component or a Component
// that gets optimized away - e.g. call-through without creating a Fiber.
// It's basically a virtual Fiber. This is not a semantic concept in React.
// It only exists as a virtual concept to let the same Element in the DevTools
// persist. To be selectable separately from all ReactComponentInfo and overtime.
type VirtualInstance = {
  kind: 1;
  id: number;
  parent: null | DevToolsInstance;
  firstChild: null | DevToolsInstance;
  nextSibling: null | DevToolsInstance;
  source: null | string | Error | Source; // source location of this server component, or owned child stack
  logCount: number; // total number of errors/warnings last seen
  treeBaseDuration: number; // the profiled time of the last render of this subtree
  // The latest info for this instance. This can be updated over time and the
  // same info can appear in more than once ServerComponentInstance.
  data: ReactComponentInfo;
};

type FilteredFiberInstance = {
  kind: 2;
  // We exclude id from the type to get errors if we try to access it.
  // However it is still in the object to preserve hidden class.
  // id: number,
  parent: null | DevToolsInstance;
  firstChild: null | DevToolsInstance;
  nextSibling: null | DevToolsInstance;
  source: null | string | Error | Source; // always null here.
  logCount: number; // total number of errors/warnings last seen
  treeBaseDuration: number; // the profiled time of the last render of this subtree
  data: Fiber; // one of a Fiber pair
};

type DevToolsInstance = FiberInstance | VirtualInstance | FilteredFiberInstance;

export function generateComponentTree(
  renderer: ReactRenderer,
  fiber: Fiber,
  traceNearestHostComponentUpdate: boolean,
): {
  idToDevToolsInstanceMap: Map<number, FiberInstance | VirtualInstance>;
  currentRoot: FiberInstance;
  rootToFiberInstanceMap: Map<FiberRoot, FiberInstance>;
  getDisplayNameForFiber?: (fiber: Fiber) => string | null;
  getElementTypeForFiber?: (fiber: Fiber) => ElementType;
} {
  // Newer versions of the reconciler package also specific reconciler version.
  // If that version number is present, use it.
  // Third party renderer versions may not match the reconciler version,
  // and the latter is what's important in terms of tags and symbols.
  const version = renderer.reconcilerVersion || renderer.version;

  // VARIABLES ---------------------------------------------------------------
  // Running state of the remaining children from the previous version of this parent that
  // we haven't yet added back. This should be reset anytime we change parent.
  // Any remaining ones at the end will be deleted.
  let remainingReconcilingChildren: null | DevToolsInstance = null;
  // The previously placed child.
  let previouslyReconciledSibling: null | DevToolsInstance = null;
  // To save on stack allocation and ensure that they are updated as a pair, we also store
  // the current parent here as well.
  let reconcilingParent: null | DevToolsInstance = null;

  const {
    getDisplayNameForFiber,
    getTypeSymbol,
    ReactPriorityLevels,
    ReactTypeOfWork,
    StrictModeBits,
  } = getInternalReactConstants(version);

  const {
    ActivityComponent,
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
    ViewTransitionComponent,
  } = ReactTypeOfWork;

  type HostInstance = any;

  // Configurable Components tree filters.
  const hideElementsWithDisplayNames: Set<RegExp> = new Set();
  const hideElementsWithPaths: Set<RegExp> = new Set();
  const hideElementsWithTypes: Set<ElementType> = new Set();
  const hideElementsWithEnvs: Set<string> = new Set();

  // Highlight updates
  let traceUpdatesEnabled: boolean = false;
  const traceUpdatesForNodes: Set<HostInstance> = new Set();

  const pendingOperations: OperationsArray = [];
  const pendingRealUnmountedIDs: Array<number> = [];
  let pendingOperationsQueue: Array<OperationsArray> | null = [];
  const pendingStringTable: Map<string, StringTableEntry> = new Map();
  let pendingStringTableLength: number = 0;
  let pendingUnmountedRootID: number | null = null;

  // Tracks Errors/Warnings logs added to a Fiber. They are added before the commit and get
  // picked up a FiberInstance. This keeps it around as long as the Fiber is alive which
  // lets the Fiber get reparented/remounted and still observe the previous errors/warnings.
  // Unless we explicitly clear the logs from a Fiber.
  const fiberToComponentLogsMap: WeakMap<Fiber, ComponentLogs> = new WeakMap();
  let isProfiling: boolean = false;

  let currentCommitProfilingMetadata: CommitProfilingData | null = null;
  let recordChangeDescriptions: boolean = false;

  let currentRoot: FiberInstance = null as any;

  // Map of FiberRoot to their root FiberInstance.
  const rootToFiberInstanceMap: Map<FiberRoot, FiberInstance> = new Map();

  // Map of id to FiberInstance or VirtualInstance.
  // This Map is used to e.g. get the display name for a Fiber or schedule an update,
  // operations that should be the same whether the current and work-in-progress Fiber is used.
  const idToDevToolsInstanceMap: Map<number, FiberInstance | VirtualInstance> =
    new Map();

  let displayNamesByRootID: DisplayNamesByRootID | null = null;

  // Remember if we're trying to restore the selection after reload.
  // In that case, we'll do some extra checks for matching mounts.
  let trackedPath: Array<PathFrame> | null = null;
  let trackedPathMatchFiber: Fiber | null = null; // This is the deepest unfiltered match of a Fiber.
  let trackedPathMatchInstance: FiberInstance | VirtualInstance | null = null; // This is the deepest matched filtered Instance.
  let trackedPathMatchDepth = -1;
  let mightBeOnTrackedPath = false;

  const rootPseudoKeys: Map<number, string> = new Map();

  // Map of canonical HostInstances to the nearest parent DevToolsInstance.
  const publicInstanceToDevToolsInstanceMap: Map<
    HostInstance,
    DevToolsInstance
  > = new Map();

  // All environment names we've seen so far. This lets us create a list of filters to apply.
  // This should ideally include env of filtered Components too so that you can add those as
  // filters at the same time as removing some other filter.
  const knownEnvironmentNames: Set<string> = new Set();

  // Map of resource DOM nodes to all the nearest DevToolsInstances that depend on it.
  const hostResourceToDevToolsInstanceMap: Map<
    HostInstance,
    Set<DevToolsInstance>
  > = new Map();
  // --------------------------------------------------------------------------
  // INLINE TYPES -------------------------------------------------------------
  type OperationsArray = Array<number>;

  type StringTableEntry = {
    encodedString: Array<number>;
    id: number;
  };

  type ComponentLogs = {
    errors: Map<string, number>;
    errorsCount: number;
    warnings: Map<string, number>;
    warningsCount: number;
  };

  type CommitProfilingData = {
    changeDescriptions: Map<number, ChangeDescription> | null;
    commitTime: number;
    durations: Array<number>;
    effectDuration: number | null;
    maxActualDuration: number;
    passiveEffectDuration: number | null;
    priorityLevel: string | null;
    updaters: Array<SerializedElement> | null;
  };

  type DisplayNamesByRootID = Map<number, string>;
  // --------------------------------------------------------------------------

  function mountFiberRecursively(
    fiber: Fiber,
    traceNearestHostComponentUpdate: boolean,
  ): void {
    const shouldIncludeInTree = !shouldFilterFiber(fiber);
    let newInstance = null;
    if (shouldIncludeInTree) {
      newInstance = recordMount(fiber, reconcilingParent);
      insertChild(newInstance);
      // if (__DEBUG__) {
      //   debug('mountFiberRecursively()', newInstance, reconcilingParent);
      // }
    } else if (
      reconcilingParent !== null &&
      reconcilingParent.kind === VIRTUAL_INSTANCE
    ) {
      // If the parent is a Virtual Instance and we filtered this Fiber we include a
      // hidden node.

      if (
        reconcilingParent.data === fiber._debugOwner &&
        fiber._debugStack != null &&
        reconcilingParent.source === null
      ) {
        // The new Fiber is directly owned by the parent. Therefore somewhere on the
        // debugStack will be a stack frame inside parent that we can use as its soruce.
        reconcilingParent.source = fiber._debugStack;
      }

      newInstance = createFilteredFiberInstance(fiber);
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
    if (newInstance !== null) {
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
      if (newInstance !== null) {
        reconcilingParent = stashedParent;
        previouslyReconciledSibling = stashedPrevious;
        remainingReconcilingChildren = stashedRemaining;
      }
    }

    // We're exiting this Fiber now, and entering its siblings.
    // If we have selection to restore, we might need to re-activate tracking.
    updateTrackedPathStateAfterMount(mightSiblingsBeOnTrackedPath);
  }

  function aquireHostResource(
    nearestInstance: DevToolsInstance,
    resource: {instance?: HostInstance} | null | undefined,
  ): void {
    const hostInstance = resource && resource.instance;
    if (hostInstance) {
      const publicInstance = getPublicInstance(hostInstance);
      let resourceInstances =
        hostResourceToDevToolsInstanceMap.get(publicInstance);
      if (resourceInstances === undefined) {
        resourceInstances = new Set();
        hostResourceToDevToolsInstanceMap.set(
          publicInstance,
          resourceInstances,
        );
        // Store the first match in the main map for quick access when selecting DOM node.
        publicInstanceToDevToolsInstanceMap.set(
          publicInstance,
          nearestInstance,
        );
      }
      resourceInstances.add(nearestInstance);
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
          const debugEntry: any = fiber._debugInfo[i];
          if (typeof debugEntry.name !== 'string') {
            // Not a Component. Some other Debug Info.
            continue;
          }
          // Scan up until the next Component to see if this component changed environment.
          const componentInfo: any = debugEntry as any;
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

  function recordVirtualMount(
    instance: VirtualInstance,
    parentInstance: DevToolsInstance | null,
    secondaryEnv: null | string,
  ): void {
    const id = instance.id;

    idToDevToolsInstanceMap.set(id, instance);

    const componentInfo: any = instance.data;

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
    const parentID = parentInstance
      ? parentInstance.kind === FILTERED_FIBER_INSTANCE
        ? // A Filtered Fiber Instance will always have a Virtual Instance as a parent.
          (parentInstance.parent as VirtualInstance).id
        : parentInstance.id
      : 0;

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

    const componentLogsEntry =
      componentInfoToComponentLogsMap.get(componentInfo);
    recordConsoleLogs(instance, componentLogsEntry);
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

  function getVirtualPathFrame(virtualInstance: any): PathFrame {
    return {
      displayName: virtualInstance.data.name || '',
      key: virtualInstance.data.key == null ? null : virtualInstance.data.key,
      index: -1, // We use -1 to indicate that this is a virtual path frame.
    };
  }

  function getSecondaryEnvironmentName(
    debugInfo: ReactDebugInfo | null | undefined,
    index: number,
  ): null | string {
    if (debugInfo != null) {
      const componentInfo: any = debugInfo[index] as any;
      for (let i = index + 1; i < debugInfo.length; i++) {
        const debugEntry: any = debugInfo[i] as any;
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

  function updateTrackedPathStateAfterMount(
    mightSiblingsBeOnTrackedPath: boolean,
  ) {
    // updateTrackedPathStateBeforeMount() told us whether to match siblings.
    // Now that we're entering siblings, let's use that information.
    mightBeOnTrackedPath = mightSiblingsBeOnTrackedPath;
  }

  function aquireHostInstance(
    nearestInstance: DevToolsInstance,
    hostInstance: HostInstance,
  ): void {
    const publicInstance = getPublicInstance(hostInstance);
    publicInstanceToDevToolsInstanceMap.set(publicInstance, nearestInstance);
  }

  // Ideally, this should be injected from Reconciler config
  function getPublicInstance(instance: any): HostInstance {
    // Typically the PublicInstance and HostInstance is the same thing but not in Fabric.
    // So we need to detect this and use that as the public instance.

    // React Native. Modern. Fabric.
    if (instance !== null) {
      if (
        typeof instance.canonical === 'object' &&
        instance.canonical !== null
      ) {
        if (
          typeof instance.canonical.publicInstance === 'object' &&
          instance.canonical.publicInstance !== null
        ) {
          return instance.canonical.publicInstance;
        }
      }

      // React Native. Legacy. Paper.
      if (typeof instance._nativeTag === 'number') {
        return instance._nativeTag;
      }
    }

    // React Web. Usually a DOM element.
    return instance;
  }

  function updateTrackedPathStateBeforeMount(
    fiber: Fiber,
    fiberInstance: null | FiberInstance | FilteredFiberInstance,
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
        if (fiberInstance !== null && fiberInstance.kind === FIBER_INSTANCE) {
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
    } as any;
  }

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

  function getElementTypeForFiber(fiber: Fiber): ElementType {
    const {type, tag} = fiber;

    switch (tag) {
      case ActivityComponent:
        return ElementTypeActivity;
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
      case ViewTransitionComponent:
        return ElementTypeViewTransition;
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
    idToDevToolsInstanceMap.set(fiberInstance.id, fiberInstance);

    const id = fiberInstance.id;

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
      const parentID = parentInstance
        ? parentInstance.kind === FILTERED_FIBER_INSTANCE
          ? // A Filtered Fiber Instance will always have a Virtual Instance as a parent.
            (parentInstance.parent as VirtualInstance).id
          : parentInstance.id
        : 0;

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

    let componentLogsEntry = fiberToComponentLogsMap.get(fiber);
    if (componentLogsEntry === undefined && fiber.alternate !== null) {
      componentLogsEntry = fiberToComponentLogsMap.get(fiber.alternate);
    }
    recordConsoleLogs(fiberInstance, componentLogsEntry);

    if (isProfilingSupported) {
      recordProfilingDurations(fiberInstance, null);
    }
    return fiberInstance;
  }

  function findNearestOwnerInstance(
    parentInstance: null | DevToolsInstance,
    owner: void | null | ReactComponentInfo | Fiber,
  ): null | FiberInstance | VirtualInstance {
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
        parentInstance.data === (owner as any).alternate
      ) {
        if (parentInstance.kind === FILTERED_FIBER_INSTANCE) {
          return null;
        }
        return parentInstance;
      }
      parentInstance = parentInstance.parent;
    }
    // It is technically possible to create an element and render it in a different parent
    // but this is a weird edge case and it is worth not having to scan the tree or keep
    // a register for every fiber/component info.
    return null;
  }

  function getUnfilteredOwner(
    owner: ReactComponentInfo | Fiber | null | void,
  ): ReactComponentInfo | Fiber | null {
    if (owner == null) {
      return null;
    }
    if ('tag' in owner && typeof owner.tag === 'number') {
      const ownerFiber: Fiber = owner as Fiber; // Refined
      owner = ownerFiber._debugOwner;
    } else {
      const ownerInfo: any = owner as ReactComponentInfo; // Refined
      owner = ownerInfo.owner;
    }
    while (owner) {
      if ('tag' in owner && typeof owner.tag === 'number') {
        const ownerFiber: Fiber = owner as any; // Refined
        if (!shouldFilterFiber(ownerFiber)) {
          return ownerFiber;
        }
        owner = ownerFiber._debugOwner;
      } else {
        const ownerInfo: any = owner as any; // Refined
        if (!shouldFilterVirtual(ownerInfo, null)) {
          return ownerInfo;
        }
        owner = ownerInfo.owner;
      }
    }
    return null;
  }

  function shouldFilterVirtual(
    data: any,
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

  function recordProfilingDurations(
    fiberInstance: FiberInstance,
    prevFiber: null | Fiber,
  ) {
    const id = fiberInstance.id;
    const fiber = fiberInstance.data;
    const {actualDuration, treeBaseDuration} = fiber;

    fiberInstance.treeBaseDuration = treeBaseDuration || 0;

    if (isProfiling) {
      // It's important to update treeBaseDuration even if the current Fiber did not render,
      // because it's possible that one of its descendants did.
      if (
        prevFiber == null ||
        treeBaseDuration !== prevFiber.treeBaseDuration
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

      if (prevFiber == null || didFiberRender(prevFiber, fiber)) {
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
            currentCommitProfilingMetadata as CommitProfilingData;
          metadata.durations.push(id, actualDuration, selfDuration);
          metadata.maxActualDuration = Math.max(
            metadata.maxActualDuration,
            actualDuration,
          );

          if (recordChangeDescriptions) {
            const changeDescription = getChangeDescription(prevFiber, fiber);
            if (changeDescription !== null) {
              if (metadata.changeDescriptions !== null) {
                metadata.changeDescriptions.set(id, changeDescription);
              }
            }
          }
        }
      }

      // If this Fiber was in the set of memoizedUpdaters we need to record
      // it to be included in the description of the commit.
      const fiberRoot: any = currentRoot.data.stateNode;
      const updaters = fiberRoot.memoizedUpdaters;
      if (
        updaters != null &&
        (updaters.has(fiber) ||
          // We check the alternate here because we're matching identity and
          // prevFiber might be same as fiber.
          (fiber.alternate !== null && updaters.has(fiber.alternate)))
      ) {
        const metadata = currentCommitProfilingMetadata as CommitProfilingData;
        if (metadata.updaters === null) {
          metadata.updaters = [];
        }
        metadata.updaters.push(instanceToSerializedElement(fiberInstance));
      }
    }
  }

  function instanceToSerializedElement(
    instance: FiberInstance | VirtualInstance,
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
      const componentInfo: any = instance.data;
      return {
        displayName: componentInfo.name || 'Anonymous',
        id: instance.id,
        key: componentInfo.key == null ? null : componentInfo.key,
        type: ElementTypeVirtual,
      };
    }
  }

  function getChangeDescription(
    prevFiber: Fiber | null,
    nextFiber: Fiber,
  ): ChangeDescription | null {
    switch (nextFiber.tag) {
      case ClassComponent:
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
            context: getContextChanged(prevFiber, nextFiber),
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
          return data;
        }
      case IncompleteFunctionComponent:
      case FunctionComponent:
      case IndeterminateComponent:
      case ForwardRef:
      case MemoComponent:
      case SimpleMemoComponent:
        if (prevFiber === null) {
          return {
            context: null,
            didHooksChange: false,
            isFirstMount: true,
            props: null,
            state: null,
          };
        } else {
          const indices = getChangedHooksIndices(
            prevFiber.memoizedState,
            nextFiber.memoizedState,
          );
          const data: ChangeDescription = {
            context: getContextChanged(prevFiber, nextFiber),
            didHooksChange: indices !== null && indices.length > 0,
            isFirstMount: false,
            props: getChangedKeys(
              prevFiber.memoizedProps,
              nextFiber.memoizedProps,
            ),
            state: null,
            hooks: indices,
          };
          // Only traverse the hooks list once, depending on what info we're returning.
          return data;
        }
      default:
        return null;
    }
  }

  function getChangedHooksIndices(prev: any, next: any): null | Array<number> {
    if (prev == null || next == null) {
      return null;
    }

    const indices = [];
    let index = 0;
    while (next !== null) {
      if (didStatefulHookChange(prev, next)) {
        indices.push(index);
      }
      next = next.next;
      prev = prev.next;
      index++;
    }

    return indices;
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

  function getChangedKeys(prev: any, next: any): null | Array<string> {
    if (prev == null || next == null) {
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

  function getContextChanged(prevFiber: Fiber, nextFiber: Fiber): boolean {
    let prevContext =
      prevFiber.dependencies && prevFiber.dependencies.firstContext;
    let nextContext =
      nextFiber.dependencies && nextFiber.dependencies.firstContext;

    while (prevContext && nextContext) {
      // Note this only works for versions of React that support this key (e.v. 18+)
      // For older versions, there's no good way to read the current context value after render has completed.
      // This is because React maintains a stack of context values during render,
      // but by the time DevTools is called, render has finished and the stack is empty.
      if (prevContext.context !== nextContext.context) {
        // If the order of context has changed, then the later context values might have
        // changed too but the main reason it rerendered was earlier. Either an earlier
        // context changed value but then we would have exited already. If we end up here
        // it's because a state or props change caused the order of contexts used to change.
        // So the main cause is not the contexts themselves.
        return false;
      }
      if (!is(prevContext.memoizedValue, nextContext.memoizedValue)) {
        return true;
      }

      prevContext = prevContext.next;
      nextContext = nextContext.next;
    }
    return false;
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

  function getFiberFlags(fiber: Fiber): number {
    // The name of this field changed from "effectTag" to "flags"
    return fiber.flags !== undefined ? fiber.flags : (fiber as any).effectTag;
  }

  function recordConsoleLogs(
    instance: FiberInstance | VirtualInstance,
    componentLogsEntry: void | ComponentLogs,
  ): boolean {
    if (componentLogsEntry === undefined) {
      if (instance.logCount === 0) {
        // Nothing has changed.
        return false;
      }
      // Reset to zero.
      instance.logCount = 0;
      pushOperation(TREE_OPERATION_UPDATE_ERRORS_OR_WARNINGS);
      pushOperation(instance.id);
      pushOperation(0);
      pushOperation(0);
      return true;
    } else {
      const totalCount =
        componentLogsEntry.errorsCount + componentLogsEntry.warningsCount;
      if (instance.logCount === totalCount) {
        // Nothing has changed.
        return false;
      }
      // Update counts.
      instance.logCount = totalCount;
      pushOperation(TREE_OPERATION_UPDATE_ERRORS_OR_WARNINGS);
      pushOperation(instance.id);
      pushOperation(componentLogsEntry.errorsCount);
      pushOperation(componentLogsEntry.warningsCount);
      return true;
    }
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

  function pushOperation(op: number): void {
    // if (__DEV__) {
    //   if (!Number.isInteger(op)) {
    //     console.error(
    //       'pushOperation() was called but the value is not an integer.',
    //       op,
    //     );
    //   }
    // }
    pendingOperations.push(op);
  }

  mountFiberRecursively(fiber, traceNearestHostComponentUpdate);

  return {
    idToDevToolsInstanceMap,
    currentRoot,
    rootToFiberInstanceMap,
    getDisplayNameForFiber,
    getElementTypeForFiber,
  };
}
