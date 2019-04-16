// @flow

import {
  ElementTypeClass,
  ElementTypeFunction,
  ElementTypeRoot,
  ElementTypeOtherOrUnknown,
} from 'src/devtools/types';
import { getUID, utfEncodeString, operationsArrayToString } from '../../utils';
import { cleanForBridge, copyWithSet } from '../utils';
import {
  __DEBUG__,
  TREE_OPERATION_ADD,
  TREE_OPERATION_REMOVE,
} from '../../constants';
import getChildren from './getChildren';
import getData from './getData';
import getElementType from './getElementType';
import {
  decorateResult,
  decorateMany,
  forceUpdate,
  restoreMany,
} from './utils';

import type {
  DevToolsHook,
  GetInternalIDFromNative,
  GetNativeFromInternal,
  NativeType,
  RendererInterface,
} from '../types';
import type { InspectedElement } from 'src/devtools/views/Components/types';

export type InternalInstance = Object;
type LegacyRenderer = Object;

export function attach(
  hook: DevToolsHook,
  rendererID: number,
  renderer: LegacyRenderer,
  global: Object
): RendererInterface {
  const idToInternalInstanceMap: Map<number, InternalInstance> = new Map();
  const idToParentIDMap: Map<number, number> = new Map();
  const internalInstanceToIDMap: Map<InternalInstance, number> = new Map();
  const mountedIDs: Set<number> = new Set();
  const pendingMountIDs: Set<number> = new Set();
  const pendingUnmountIDs: Set<number> = new Set();
  const rootIDs: Set<number> = new Set();

  function getID(internalInstance: InternalInstance): number {
    if (!internalInstanceToIDMap.has(internalInstance)) {
      const id = getUID();
      internalInstanceToIDMap.set(internalInstance, id);
      idToInternalInstanceMap.set(id, internalInstance);
    }
    return ((internalInstanceToIDMap.get(internalInstance): any): number);
  }

  function getChildIDs(internalInstance: InternalInstance): Array<number> {
    return getChildren(internalInstance).map(getID);
  }

  //function getParentID(internalInstance: InternalInstance): number {
  //  return getID(internalInstance._hostParent);
  //}

  function findNearestAncestorInTree(
    internalInstance: InternalInstance
  ): number | null {
    let current = internalInstance;
    while (current != null) {
      const id = getID(current);
      if (
        rootIDs.has(id) ||
        getElementType(current) !== ElementTypeOtherOrUnknown
      ) {
        return id;
      }
      const parentID = idToParentIDMap.get(id);
      current = parentID != null ? idToInternalInstanceMap.get(parentID) : null;
    }
    return null;
  }

  let getInternalIDFromNative: GetInternalIDFromNative = ((null: any): GetInternalIDFromNative);
  let getNativeFromInternal: (
    id: number
  ) => ?NativeType = ((null: any): GetNativeFromInternal);

  // React Native
  if (renderer.Mount.findNodeHandle && renderer.Mount.nativeTagToRootNodeID) {
    getInternalIDFromNative = (nativeTag, findNearestUnfilteredAncestor) => {
      const internalInstance = renderer.Mount.nativeTagToRootNodeID(nativeTag);
      return findNearestAncestorInTree(internalInstance);
    };
    getNativeFromInternal = (id: number) => {
      const internalInstance = idToInternalInstanceMap.get(id);
      return renderer.Mount.findNodeHandle(internalInstance);
    };

    // React DOM 15+
  } else if (renderer.ComponentTree) {
    getInternalIDFromNative = (node, findNearestUnfilteredAncestor) => {
      const internalInstance = renderer.ComponentTree.getClosestInstanceFromNode(
        node
      );
      return findNearestAncestorInTree(internalInstance);
    };
    getNativeFromInternal = (id: number) => {
      const internalInstance = idToInternalInstanceMap.get(id);
      return renderer.ComponentTree.getNodeFromInstance(internalInstance);
    };

    // React DOM
  } else if (renderer.Mount.getID && renderer.Mount.getNode) {
    getInternalIDFromNative = (node, findNearestUnfilteredAncestor) => {
      let id = renderer.Mount.getID(node);
      while (node && node.parentNode && !id) {
        node = node.parentNode;
        id = renderer.Mount.getID(node);
      }
      return id;
    };

    getNativeFromInternal = (id: number) => {
      try {
        const internalInstance = idToInternalInstanceMap.get(id);
        if (internalInstance != null) {
          return renderer.Mount.getNode(internalInstance._rootNodeID);
        }
      } catch (e) {}

      return null;
    };
  } else {
    console.warn(
      'Unknown React version (does not have getID), probably an unshimmed React Native'
    );
  }

  let oldReconcilerMethods = null;
  let oldRenderComponent = null;
  let oldRenderRoot = null;

  // React DOM
  if (renderer.Mount._renderNewRootComponent) {
    oldRenderRoot = decorateResult(
      renderer.Mount,
      '_renderNewRootComponent',
      internalInstance => {
        const id = getID(internalInstance);

        rootIDs.add(id);

        if (__DEBUG__) {
          console.log('renderer.Mount._renderNewRootComponent()', id);
        }

        recordPendingMount(internalInstance);

        // If we're mounting a root, we've just finished a batch of work,
        // so it's safe to synchronously flush.
        flushPendingEvents(id);
      }
    );

    // React Native
  } else if (renderer.Mount.renderComponent) {
    oldRenderComponent = decorateResult(
      renderer.Mount,
      'renderComponent',
      internalInstance => {
        const id = getID(internalInstance);

        rootIDs.add(id);

        if (__DEBUG__) {
          console.log('renderer.Mount.renderComponent()', id);
        }

        recordPendingMount(internalInstance);

        // If we're mounting a root, we've just finished a batch of work,
        // so it's safe to synchronously flush.
        flushPendingEvents(id);
      }
    );
  }

  if (renderer.Reconciler) {
    oldReconcilerMethods = decorateMany(renderer.Reconciler, {
      mountComponent(internalInstance, rootID, transaction, context) {
        recordPendingMount(internalInstance);
      },
      performUpdateIfNecessary(
        internalInstance,
        nextChild,
        transaction,
        context
      ) {
        // TODO Check for change in order of children
      },
      receiveComponent(internalInstance, nextChild, transaction, context) {
        // TODO Check for change in order of children
      },
      unmountComponent(internalInstance) {
        recordPendingUnmount(internalInstance);
      },
    });
  }

  function cleanup() {
    if (oldReconcilerMethods !== null) {
      if (renderer.Component) {
        restoreMany(renderer.Component.Mixin, oldReconcilerMethods);
      } else {
        restoreMany(renderer.Reconciler, oldReconcilerMethods);
      }
    }
    if (oldRenderRoot !== null) {
      renderer.Mount._renderNewRootComponent = oldRenderRoot;
    }
    if (oldRenderComponent !== null) {
      renderer.Mount.renderComponent = oldRenderComponent;
    }
    oldReconcilerMethods = null;
    oldRenderRoot = null;
    oldRenderComponent = null;
  }

  let pendingOperations: Uint32Array = new Uint32Array(0);

  function addOperation(
    newAction: Uint32Array,
    addToStartOfQueue: boolean = false
  ): void {
    const oldActions = pendingOperations;
    pendingOperations = new Uint32Array(oldActions.length + newAction.length);
    if (addToStartOfQueue) {
      pendingOperations.set(newAction);
      pendingOperations.set(oldActions, newAction.length);
    } else {
      pendingOperations.set(oldActions);
      pendingOperations.set(newAction, oldActions.length);
    }
  }

  // TODO Rethink the below queueing mechanism.
  // Every mount is some parent's update (except for the root mount which we can explicitly handle)
  // So maybe we only need to call queueFlushPendingEvents() for updates,
  // and maybe we can rely on an id-to-root Map for this case, to limit the scope of what  we crawl.

  // Older React renderers did not have the concept of a commit.
  // The data structure was just ad-hoc mutated in place.
  // So except for the case of the root mounting the first time,
  // there is no event we can observe to signal that a render is finished.
  // However since older renderers were always synchronous,
  // we can use setTimeout to batch operations together.
  // In the case of a cascading update, we might batch multiple "commits"-
  // but that should be okay, since the batching is not strictly necessary.
  let flushPendingEventsTimeoutID: TimeoutID | null = null;
  function queueFlushPendingEvents() {
    if (flushPendingEventsTimeoutID === null) {
      flushPendingEventsTimeoutID = setTimeout(() => {
        flushPendingEventsTimeoutID = null;

        // If there are pending operations, walk the tree and find them.
        // Ideally we wouldjust pluck the pending operations out of the sets directly,
        // but without doing a full traversal, it would be hard for us to determine the filtered parent.
        // It should be possible to improve this though, by maintaining a map of id-to-parent,
        // and crawling upward to the first non-filtered node.
        // TODO Revisit this and think about it more...
        if (pendingMountIDs.size > 0 || pendingUnmountIDs.size > 0) {
          rootIDs.forEach(flushPendingEvents);
        }
      }, 0);
    }
  }

  function flushInitialOperations() {
    // Older versions of React do not support profiling mode, so there's nothing to flush.
    // Crawl roots though and register any nodes that mounted before we were injected.

    const roots =
      renderer.Mount._instancesByReactRootID ||
      renderer.Mount._instancesByContainerID;

    for (let key in roots) {
      const internalInstance = roots[key];
      const id = getID(internalInstance);

      rootIDs.add(id);

      crawlAndRecordMounts(id, 0, true);

      // It's safe to synchronously flush for the root we just crawled.
      flushPendingEvents(id);
    }
  }

  function crawlAndRecordMounts(
    id: number,
    parentID: number,
    isInitialMount: boolean
  ) {
    const internalInstance = idToInternalInstanceMap.get(id);
    const shouldIncludeInTree =
      parentID === 0 ||
      getElementType(internalInstance) !== ElementTypeOtherOrUnknown;

    // Not all nodes are mounted in the frontend DevTools tree,
    // but it's important to track parent info even for the unmounted ones.
    idToParentIDMap.set(id, parentID);

    if (__DEBUG__) {
      console.group(
        'crawlAndRecordMounts() id:',
        id,
        'shouldIncludeInTree?',
        shouldIncludeInTree
      );
    }

    if (shouldIncludeInTree) {
      const didMount = isInitialMount || pendingMountIDs.has(id);
      const didUnmount = pendingUnmountIDs.has(id);

      // If this node was both mounted and unmounted in the same batch,
      // just skip it and don't send any update.
      if (didMount && didUnmount) {
        pendingUnmountIDs.delete(id);
        return;
      } else if (didMount) {
        recordMount(id, parentID);
      }
    }

    getChildIDs(internalInstance).forEach(childID =>
      crawlAndRecordMounts(
        childID,
        shouldIncludeInTree ? id : parentID,
        isInitialMount
      )
    );

    if (__DEBUG__) {
      console.groupEnd();
    }
  }

  function flushPendingEvents(rootID: number): void {
    // Crawl tree and queue mounts/updates.
    crawlAndRecordMounts(rootID, 0, false);

    // Send pending deletions.
    pendingUnmountIDs.forEach(id => {
      if (mountedIDs.has(id)) {
        recordUnmount(id);
      }
    });

    // Identify which renderer this update is coming from.
    // This enables roots to be mapped to renderers,
    // Which in turn enables fiber props, states, and hooks to be inspected.
    const idArray = new Uint32Array(2);
    idArray[0] = rendererID;
    idArray[1] = rootID;
    addOperation(idArray, true);

    if (__DEBUG__) {
      operationsArrayToString(pendingOperations);
    }

    // If we've already connected to the frontend, just pass the operations through.
    hook.emit('operations', pendingOperations);

    pendingMountIDs.clear();
    pendingUnmountIDs.clear();
    pendingOperations = new Uint32Array(0);
  }

  function inspectElement(id: number): InspectedElement | null {
    let result = inspectElementRaw(id);
    if (result === null) {
      return null;
    }
    // TODO Review sanitization approach for the below inspectable values.
    result.context = cleanForBridge(result.context);
    result.props = cleanForBridge(result.props);
    result.state = cleanForBridge(result.state);
    return result;
  }

  function inspectElementRaw(id: number): InspectedElement | null {
    const internalInstance = idToInternalInstanceMap.get(id);
    const data = getData(internalInstance);

    let context = null;
    let owners = null;
    let props = null;
    let state = null;
    let source = null;

    if (internalInstance != null) {
      const element = internalInstance._currentElement;
      if (element !== null) {
        props = element.props;
        source = element._source != null ? element._source : null;

        let owner = element._owner;
        if (owner) {
          owners = [];
          while (owner != null) {
            owners.push({
              displayName: getData(owner).displayName || 'Unknown',
              id: getID(owner),
            });
            owner = owner.owner;
          }
        }
      }
      context = internalInstance.context || null;
      state = internalInstance.state || null;
    }

    return {
      id,

      // Hooks did not exist in legacy versions
      canEditHooks: false,

      // Does the current renderer support editable function props?
      canEditFunctionProps: true,

      // Suspense did not exist in legacy versions
      canToggleSuspense: false,

      // Can view component source location.
      canViewSource:
        data.type === ElementTypeClass || data.type === ElementTypeFunction,

      displayName: data.displayName,

      // Inspectable properties.
      context,
      hooks: null,
      props,
      state,

      // List of owners
      owners,

      // Location of component in source coude.
      source,
    };
  }

  function logElementToConsole(id: number): void {
    const result = inspectElementRaw(id);
    if (result === null) {
      console.warn(`Could not find element with id "${id}"`);
      return;
    }

    const supportsGroup = typeof console.groupCollapsed === 'function';
    if (supportsGroup) {
      console.groupCollapsed(
        `[Click to expand] %c<${result.displayName || 'Component'} />`,
        // --dom-tag-name-color is the CSS variable Chrome styles HTML elements with in the console.
        'color: var(--dom-tag-name-color); font-weight: normal;'
      );
    }
    if (result.props !== null) {
      console.log('Props:', result.props);
    }
    if (result.state !== null) {
      console.log('State:', result.state);
    }
    if (result.context !== null) {
      console.log('State:', result.context);
    }
    const nativeNode = getNativeFromInternal(id);
    if (nativeNode !== null) {
      console.log('Node:', nativeNode);
    }
    if (window.chrome || /firefox/i.test(navigator.userAgent)) {
      console.log(
        'Right-click any value to save it as a global variable for further inspection.'
      );
    }
    if (supportsGroup) {
      console.groupEnd();
    }
  }

  function prepareViewElementSource(id: number): void {
    const internalInstance = idToInternalInstanceMap.get(id);
    if (internalInstance == null) {
      console.warn(`Could not find instance with id "${id}"`);
      return;
    }

    const element = internalInstance._currentElement;
    if (element == null) {
      console.warn(`Could not find element with id "${id}"`);
      return;
    }

    global.$type = element.type;
  }

  function selectElement(id: number): void {
    const internalInstance = idToInternalInstanceMap.get(id);
    if (internalInstance == null) {
      console.warn(`Could not find instance with id "${id}"`);
      return;
    }

    switch (getElementType(internalInstance)) {
      case ElementTypeClass:
      case ElementTypeFunction:
        const element = internalInstance._currentElement;
        if (element == null) {
          console.warn(`Could not find element with id "${id}"`);
          return;
        }

        global.$r = {
          props: element.props,
          type: element.type,
        };
        break;
      default:
        break;
    }
  }

  function recordPendingMount(internalInstance: InternalInstance) {
    pendingMountIDs.add(getID(internalInstance));

    if (__DEBUG__) {
      console.log(
        '%crecordPendingMount()',
        'color: green',
        getID(internalInstance)
      );
    }

    queueFlushPendingEvents();
  }

  function recordPendingUnmount(internalInstance: InternalInstance) {
    const id = getID(internalInstance);

    pendingUnmountIDs.add(id);

    // Not all nodes are mounted (or unmounted) in the frontend DevTools tree,
    // so it's important to remove entries from this map on pending unmount.
    idToParentIDMap.delete(id);

    if (__DEBUG__) {
      console.log(
        '%crecordPendingUnmount()',
        'color: red',
        getID(internalInstance)
      );
    }

    queueFlushPendingEvents();
  }

  function recordMount(id: number, parentID: number) {
    const internalInstance = ((idToInternalInstanceMap.get(
      id
    ): any): InternalInstance);
    const isRoot = rootIDs.has(id);

    if (__DEBUG__) {
      console.log(
        '%crecordMount()',
        'color: green; font-weight: bold;',
        id,
        getData(internalInstance).displayName
      );
    }

    mountedIDs.add(id);

    if (isRoot) {
      // TODO Is this right? For all versions?
      const hasOwnerMetadata =
        internalInstance._currentElement != null &&
        internalInstance._currentElement._owner != null;

      const operation = new Uint32Array(5);
      operation[0] = TREE_OPERATION_ADD;
      operation[1] = id;
      operation[2] = ElementTypeRoot;
      operation[3] = 0; // isProfilingSupported?
      operation[4] = hasOwnerMetadata ? 1 : 0;
      addOperation(operation);
    } else {
      const { displayName, key, type } = getData(internalInstance);

      const ownerID =
        internalInstance._currentElement != null &&
        internalInstance._currentElement._owner != null
          ? getID(internalInstance._currentElement._owner)
          : 0;

      let encodedDisplayName = ((null: any): Uint8Array);
      let encodedKey = ((null: any): Uint8Array);

      if (displayName !== null) {
        encodedDisplayName = utfEncodeString(displayName);
      }

      if (key !== null) {
        // React$Key supports string and number types as inputs,
        // But React converts numeric keys to strings, so we only have to handle that type here.
        // https://github.com/facebook/react/blob/0e67969cb1ad8c27a72294662e68fa5d7c2c9783/packages/react/src/ReactElement.js#L187
        encodedKey = utfEncodeString(((key: any): string));
      }

      const encodedDisplayNameSize =
        displayName === null ? 0 : encodedDisplayName.length;
      const encodedKeySize = key === null ? 0 : encodedKey.length;

      const operation = new Uint32Array(
        7 + encodedDisplayNameSize + encodedKeySize
      );
      operation[0] = TREE_OPERATION_ADD;
      operation[1] = id;
      operation[2] = type;
      operation[3] = parentID;
      operation[4] = ownerID;
      operation[5] = encodedDisplayNameSize;
      if (displayName !== null) {
        operation.set(encodedDisplayName, 6);
      }
      operation[6 + encodedDisplayNameSize] = encodedKeySize;
      if (key !== null) {
        operation.set(encodedKey, 6 + encodedDisplayNameSize + 1);
      }
      addOperation(operation);
    }
  }

  function recordUnmount(id: number) {
    const internalInstance = idToInternalInstanceMap.get(id);
    const isRoot = rootIDs.has(id);

    if (__DEBUG__) {
      console.log(
        '%crecordUnmount()',
        'color: red; font-weight: bold;',
        id,
        getData(internalInstance).displayName
      );
    }

    if (isRoot) {
      const operation = new Uint32Array(2);
      operation[0] = TREE_OPERATION_REMOVE;
      operation[1] = id;
      addOperation(operation);

      rootIDs.delete(id);
    } else {
      const operation = new Uint32Array(2);
      operation[0] = TREE_OPERATION_REMOVE;
      operation[1] = id;
      addOperation(operation);
    }

    idToInternalInstanceMap.delete(id);
    internalInstanceToIDMap.delete(internalInstance);

    mountedIDs.delete(id);
  }

  function setInProps(id: number, path: Array<string | number>, value: any) {
    const internalInstance = idToInternalInstanceMap.get(id);
    if (internalInstance != null) {
      const element = internalInstance._currentElement;
      internalInstance._currentElement = {
        ...element,
        props: copyWithSet(element.props, path, value),
      };
      forceUpdate(internalInstance._instance);
    }
  }

  function setInState(id: number, path: Array<string | number>, value: any) {
    const internalInstance = idToInternalInstanceMap.get(id);
    if (internalInstance != null) {
      setIn(internalInstance.state, path, value);
      internalInstance.forceUpdate();
    }
  }

  function setInContext(id: number, path: Array<string | number>, value: any) {
    const internalInstance = idToInternalInstanceMap.get(id);
    if (internalInstance != null) {
      setIn(internalInstance.context, path, value);
      forceUpdate(internalInstance);
    }
  }

  function setIn(obj: Object, path: Array<string | number>, value: any) {
    const last = path.pop();
    const parent = path.reduce(
      // $FlowFixMe
      (reduced, attr) => (reduced ? reduced[attr] : null),
      obj
    );
    if (parent) {
      // $FlowFixMe
      parent[last] = value;
    }
  }

  // v16+ only features
  const getCommitDetails = () => {
    throw new Error('getCommitDetails not supported by this renderer');
  };
  const getFiberCommits = () => {
    throw new Error('getFiberCommits not supported by this renderer');
  };
  const getInteractions = () => {
    throw new Error('getInteractions not supported by this renderer');
  };
  const getProfilingDataForDownload = () => {
    throw new Error(
      'getProfilingDataForDownload not supported by this renderer'
    );
  };
  const getProfilingSummary = () => {
    throw new Error('getProfilingSummary not supported by this renderer');
  };
  const handleCommitFiberRoot = () => {
    throw new Error('handleCommitFiberRoot not supported by this renderer');
  };
  const handleCommitFiberUnmount = () => {
    throw new Error('handleCommitFiberUnmount not supported by this renderer');
  };
  const overrideSuspense = () => {
    throw new Error('overrideSuspense not supported by this renderer');
  };
  const setInHook = () => {
    throw new Error('setInHook not supported by this renderer');
  };
  const startProfiling = () => {
    throw new Error('startProfiling not supported by this renderer');
  };
  const stopProfiling = () => {
    throw new Error('stopProfiling not supported by this renderer');
  };

  return {
    cleanup,
    flushInitialOperations,
    getCommitDetails,
    getFiberCommits,
    getInteractions,
    getInternalIDFromNative,
    getNativeFromInternal,
    getProfilingDataForDownload,
    getProfilingSummary,
    handleCommitFiberRoot,
    handleCommitFiberUnmount,
    inspectElement,
    logElementToConsole,
    overrideSuspense,
    prepareViewElementSource,
    renderer,
    selectElement,
    setInContext,
    setInHook,
    setInProps,
    setInState,
    startProfiling,
    stopProfiling,
  };
}
