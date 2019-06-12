// @flow

import {
  ElementTypeClass,
  ElementTypeFunction,
  ElementTypeRoot,
  ElementTypeHostComponent,
  ElementTypeOtherOrUnknown,
} from 'src/types';
import { getUID, utfEncodeString, printOperationsArray } from '../../utils';
import { cleanForBridge, copyWithSet } from '../utils';
import {
  __DEBUG__,
  TREE_OPERATION_ADD,
  TREE_OPERATION_REMOVE,
  TREE_OPERATION_REORDER_CHILDREN,
} from '../../constants';
import getData from './getData';
import { decorateMany, forceUpdate, restoreMany } from './utils';

import type {
  DevToolsHook,
  GetFiberIDForNative,
  NativeType,
  PathFrame,
  PathMatch,
  RendererInterface,
} from '../types';
import type { ComponentFilter, ElementType } from 'src/types';
import type { Owner, InspectedElement } from '../types';

export type InternalInstance = Object;
type LegacyRenderer = Object;

function getElementType(internalInstance: InternalInstance): ElementType {
  // != used deliberately here to catch undefined and null
  if (internalInstance._currentElement != null) {
    const elementType = internalInstance._currentElement.type;
    if (typeof elementType === 'function') {
      return ElementTypeClass;
    } else if (typeof elementType === 'string') {
      return ElementTypeHostComponent;
    }
  }
  return ElementTypeOtherOrUnknown;
}

function getChildren(internalInstance: Object): Array<any> {
  let children = [];

  // If the parent is a native node without rendered children, but with
  // multiple string children, then the `element` that gets passed in here is
  // a plain value -- a string or number.
  if (typeof internalInstance !== 'object') {
    // No children
  } else if (
    internalInstance._currentElement === null ||
    internalInstance._currentElement === false
  ) {
    // No children
  } else if (internalInstance._renderedComponent) {
    const child = internalInstance._renderedComponent;
    if (getElementType(child) !== ElementTypeOtherOrUnknown) {
      children.push(child);
    }
  } else if (internalInstance._renderedChildren) {
    const renderedChildren = internalInstance._renderedChildren;
    for (let name in renderedChildren) {
      const child = renderedChildren[name];
      if (getElementType(child) !== ElementTypeOtherOrUnknown) {
        children.push(child);
      }
    }
  }
  // Note: we skip the case where children are just strings or numbers
  // because the new DevTools skips over host text nodes anyway.
  return children;
}

export function attach(
  hook: DevToolsHook,
  rendererID: number,
  renderer: LegacyRenderer,
  global: Object
): RendererInterface {
  const idToInternalInstanceMap: Map<number, InternalInstance> = new Map();
  const internalInstanceToIDMap: WeakMap<
    InternalInstance,
    number
  > = new WeakMap();
  const internalInstanceToRootIDMap: WeakMap<
    InternalInstance,
    number
  > = new WeakMap();

  let getInternalIDForNative: GetFiberIDForNative = ((null: any): GetFiberIDForNative);
  let findNativeNodeForInternalID: (id: number) => ?NativeType;

  if (renderer.ComponentTree) {
    getInternalIDForNative = (node, findNearestUnfilteredAncestor) => {
      const internalInstance = renderer.ComponentTree.getClosestInstanceFromNode(
        node
      );
      return internalInstanceToIDMap.get(internalInstance) || null;
    };
    findNativeNodeForInternalID = (id: number) => {
      const internalInstance = idToInternalInstanceMap.get(id);
      return renderer.ComponentTree.getNodeFromInstance(internalInstance);
    };
  } else if (renderer.Mount.getID && renderer.Mount.getNode) {
    getInternalIDForNative = (node, findNearestUnfilteredAncestor) => {
      // Not implemented.
      return null;
    };
    findNativeNodeForInternalID = (id: number) => {
      // Not implemented.
      return null;
    };
  }

  function getID(internalInstance: InternalInstance): number {
    if (typeof internalInstance !== 'object') {
      throw new Error('Invalid internal instance: ' + internalInstance);
    }
    if (!internalInstanceToIDMap.has(internalInstance)) {
      const id = getUID();
      internalInstanceToIDMap.set(internalInstance, id);
      idToInternalInstanceMap.set(id, internalInstance);
    }
    return ((internalInstanceToIDMap.get(internalInstance): any): number);
  }

  function areEqualArrays(a, b) {
    if (a.length !== b.length) {
      return false;
    }
    for (let i = 0; i < a.length; i++) {
      if (a[i] !== b[i]) {
        return false;
      }
    }
    return true;
  }

  // This is shared mutable state that lets us keep track of where we are.
  let parentIDStack = [];

  let oldReconcilerMethods = null;
  if (renderer.Reconciler) {
    // React 15
    oldReconcilerMethods = decorateMany(renderer.Reconciler, {
      mountComponent(fn, args) {
        const internalInstance = args[0];
        const hostContainerInfo = args[3];
        if (getElementType(internalInstance) === ElementTypeOtherOrUnknown) {
          return fn.apply(this, args);
        }
        if (hostContainerInfo._topLevelWrapper === undefined) {
          // SSR
          return fn.apply(this, args);
        }

        const id = getID(internalInstance);
        // Push the operation.
        const parentID =
          parentIDStack.length > 0
            ? parentIDStack[parentIDStack.length - 1]
            : 0;
        recordMount(internalInstance, id, parentID);
        parentIDStack.push(id);

        // Remember the root.
        internalInstanceToRootIDMap.set(
          internalInstance,
          getID(hostContainerInfo._topLevelWrapper)
        );

        try {
          const result = fn.apply(this, args);
          parentIDStack.pop();
          return result;
        } catch (err) {
          parentIDStack = [];
          throw err;
        } finally {
          if (parentIDStack.length === 0) {
            const rootID = internalInstanceToRootIDMap.get(internalInstance);
            if (rootID === undefined) {
              throw new Error('Expected to find root ID.');
            }
            flushPendingEvents(rootID);
          }
        }
      },
      performUpdateIfNecessary(fn, args) {
        const internalInstance = args[0];
        if (getElementType(internalInstance) === ElementTypeOtherOrUnknown) {
          return fn.apply(this, args);
        }

        const id = getID(internalInstance);
        parentIDStack.push(id);

        const prevChildren = getChildren(internalInstance);
        try {
          const result = fn.apply(this, args);

          const nextChildren = getChildren(internalInstance);
          if (!areEqualArrays(prevChildren, nextChildren)) {
            // Push the operation
            recordReorder(internalInstance, id, nextChildren);
          }

          parentIDStack.pop();
          return result;
        } catch (err) {
          parentIDStack = [];
          throw err;
        } finally {
          if (parentIDStack.length === 0) {
            const rootID = internalInstanceToRootIDMap.get(internalInstance);
            if (rootID === undefined) {
              throw new Error('Expected to find root ID.');
            }
            flushPendingEvents(rootID);
          }
        }
      },
      receiveComponent(fn, args) {
        const internalInstance = args[0];
        if (getElementType(internalInstance) === ElementTypeOtherOrUnknown) {
          return fn.apply(this, args);
        }

        const id = getID(internalInstance);
        parentIDStack.push(id);

        const prevChildren = getChildren(internalInstance);
        try {
          const result = fn.apply(this, args);

          const nextChildren = getChildren(internalInstance);
          if (!areEqualArrays(prevChildren, nextChildren)) {
            // Push the operation
            recordReorder(internalInstance, id, nextChildren);
          }

          parentIDStack.pop();
          return result;
        } catch (err) {
          parentIDStack = [];
          throw err;
        } finally {
          if (parentIDStack.length === 0) {
            const rootID = internalInstanceToRootIDMap.get(internalInstance);
            if (rootID === undefined) {
              throw new Error('Expected to find root ID.');
            }
            flushPendingEvents(rootID);
          }
        }
      },
      unmountComponent(fn, args) {
        const internalInstance = args[0];
        if (getElementType(internalInstance) === ElementTypeOtherOrUnknown) {
          return fn.apply(this, args);
        }

        const id = getID(internalInstance);
        parentIDStack.push(id);
        try {
          const result = fn.apply(this, args);
          parentIDStack.pop();

          // Push the operation.
          recordUnmount(internalInstance, id);

          return result;
        } catch (err) {
          parentIDStack = [];
          throw err;
        } finally {
          if (parentIDStack.length === 0) {
            const rootID = internalInstanceToRootIDMap.get(internalInstance);
            if (rootID === undefined) {
              throw new Error('Expected to find root ID.');
            }
            flushPendingEvents(rootID);
          }
        }
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
    oldReconcilerMethods = null;
  }

  function recordMount(
    internalInstance: InternalInstance,
    id: number,
    parentID: number
  ) {
    const isRoot = parentID === 0;

    if (__DEBUG__) {
      console.log(
        '%crecordMount()',
        'color: green; font-weight: bold;',
        id,
        getData(internalInstance).displayName
      );
    }

    if (isRoot) {
      // TODO Is this right? For all versions?
      const hasOwnerMetadata =
        internalInstance._currentElement != null &&
        internalInstance._currentElement._owner != null;

      pushOperation(TREE_OPERATION_ADD);
      pushOperation(id);
      pushOperation(ElementTypeRoot);
      pushOperation(0); // isProfilingSupported?
      pushOperation(hasOwnerMetadata ? 1 : 0);
    } else {
      const { displayName, key, type } = getData(internalInstance);

      const ownerID =
        internalInstance._currentElement != null &&
        internalInstance._currentElement._owner != null
          ? getID(internalInstance._currentElement._owner)
          : 0;

      let displayNameStringID = getStringID(displayName);
      let keyStringID = getStringID(key);
      pushOperation(TREE_OPERATION_ADD);
      pushOperation(id);
      pushOperation(type);
      pushOperation(parentID);
      pushOperation(ownerID);
      pushOperation(displayNameStringID);
      pushOperation(keyStringID);
    }
  }

  function recordReorder(
    internalInstance: InternalInstance,
    id: number,
    nextChildren: Array<InternalInstance>
  ) {
    pushOperation(TREE_OPERATION_REORDER_CHILDREN);
    pushOperation(id);
    const nextChildIDs = nextChildren.map(getID);
    pushOperation(nextChildIDs.length);
    for (let i = 0; i < nextChildIDs.length; i++) {
      pushOperation(nextChildIDs[i]);
    }
  }

  function recordUnmount(internalInstance: InternalInstance, id: number) {
    pendingUnmountedIDs.push(id);
    idToInternalInstanceMap.delete(id);
  }

  function crawlAndRecordInitialMounts(id: number, parentID: number) {
    const internalInstance = idToInternalInstanceMap.get(id);

    if (__DEBUG__) {
      console.group('crawlAndRecordInitialMounts() id:', id);
    }

    recordMount(internalInstance, id, parentID);
    getChildren(internalInstance).forEach(child =>
      crawlAndRecordInitialMounts(getID(child), id)
    );

    if (__DEBUG__) {
      console.groupEnd();
    }
  }

  function flushInitialOperations() {
    // Crawl roots though and register any nodes that mounted before we were injected.

    const roots =
      renderer.Mount._instancesByReactRootID ||
      renderer.Mount._instancesByContainerID;

    for (let key in roots) {
      const internalInstance = roots[key];
      const id = getID(internalInstance);
      crawlAndRecordInitialMounts(id, 0);
      flushPendingEvents(id);
    }
  }

  let pendingOperations: Array<number> = [];
  let pendingStringTable: Map<string, number> = new Map();
  let pendingUnmountedIDs: Array<number> = [];
  let pendingStringTableLength: number = 0;
  let pendingUnmountedRootID: number | null = null;

  function flushPendingEvents(rootID: number) {
    if (
      pendingOperations.length === 0 &&
      pendingUnmountedIDs.length === 0 &&
      pendingUnmountedRootID === null
    ) {
      return;
    }

    const numUnmountIDs =
      pendingUnmountedIDs.length + (pendingUnmountedRootID === null ? 0 : 1);

    const operations = new Uint32Array(
      // Identify which renderer this update is coming from.
      2 + // [rendererID, rootFiberID]
      // How big is the string table?
      1 + // [stringTableLength]
        // Then goes the actual string table.
        pendingStringTableLength +
        // All unmounts are batched in a single message.
        // [TREE_OPERATION_REMOVE, removedIDLength, ...ids]
        (numUnmountIDs > 0 ? 2 + numUnmountIDs : 0) +
        // Mount operations
        pendingOperations.length
    );

    // Identify which renderer this update is coming from.
    // This enables roots to be mapped to renderers,
    // Which in turn enables fiber properations, states, and hooks to be inspected.
    let i = 0;
    operations[i++] = rendererID;
    operations[i++] = rootID;

    // Now fill in the string table.
    // [stringTableLength, str1Length, ...str1, str2Length, ...str2, ...]
    operations[i++] = pendingStringTableLength;
    pendingStringTable.forEach((value, key) => {
      operations[i++] = key.length;
      operations.set(utfEncodeString(key), i);
      i += key.length;
    });

    if (numUnmountIDs > 0) {
      // All unmounts except roots are batched in a single message.
      operations[i++] = TREE_OPERATION_REMOVE;
      // The first number is how many unmounted IDs we're gonna send.
      operations[i++] = numUnmountIDs;
      // Fill in the unmounts
      for (let j = 0; j < pendingUnmountedIDs.length; j++) {
        operations[i++] = pendingUnmountedIDs[j];
      }
      // The root ID should always be unmounted last.
      if (pendingUnmountedRootID !== null) {
        operations[i] = pendingUnmountedRootID;
        i++;
      }
    }

    // Fill in the rest of the operations.
    operations.set(pendingOperations, i);
    i += pendingOperations.length;

    if (__DEBUG__) {
      printOperationsArray(operations);
    }

    // If we've already connected to the frontend, just pass the operations through.
    hook.emit('operations', operations);

    pendingOperations.length = 0;
    pendingUnmountedIDs = [];
    pendingUnmountedRootID = null;
    pendingStringTable.clear();
    pendingStringTableLength = 0;
  }

  function pushOperation(op: number): void {
    if (__DEV__) {
      if (!Number.isInteger(op)) {
        console.error(
          'pushOperation() was called but the value is not an integer.',
          op
        );
      }
    }
    pendingOperations.push(op);
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
            const ownerData = getData(owner);
            owners.push({
              displayName: ownerData.displayName || 'Unknown',
              id: getID(owner),
              type: ownerData.type,
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

      type: data.type,

      // New events system did not exist in legacy versions
      events: null,

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
    const nativeNode = findNativeNodeForInternalID(id);
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
  const getProfilingData = () => {
    throw new Error('getProfilingData not supported by this renderer');
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

  function getBestMatchForTrackedPath(): PathMatch | null {
    // Not implemented.
    return null;
  }

  function getPathForElement(id: number): Array<PathFrame> | null {
    // Not implemented.
    return null;
  }

  function updateComponentFilters(componentFilters: Array<ComponentFilter>) {
    // Not implemented.
  }

  function setTrackedPath(path: Array<PathFrame> | null) {
    // Not implemented.
  }

  function getOwnersList(id: number): Array<Owner> | null {
    // Not implemented.
    return null;
  }

  return {
    cleanup,
    flushInitialOperations,
    getBestMatchForTrackedPath,
    getFiberIDForNative: getInternalIDForNative,
    findNativeNodesForFiberID: (id: number) => {
      const nativeNode = findNativeNodeForInternalID(id);
      return nativeNode == null ? null : [nativeNode];
    },
    getOwnersList,
    getPathForElement,
    getProfilingData,
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
    setTrackedPath,
    startProfiling,
    stopProfiling,
    updateComponentFilters,
  };
}
