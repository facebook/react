/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import EventEmitter from '../events';
import {inspect} from 'util';
import {
  PROFILING_FLAG_BASIC_SUPPORT,
  PROFILING_FLAG_TIMELINE_SUPPORT,
  TREE_OPERATION_ADD,
  TREE_OPERATION_REMOVE,
  TREE_OPERATION_REMOVE_ROOT,
  TREE_OPERATION_REORDER_CHILDREN,
  TREE_OPERATION_SET_SUBTREE_MODE,
  TREE_OPERATION_UPDATE_ERRORS_OR_WARNINGS,
  TREE_OPERATION_UPDATE_TREE_BASE_DURATION,
} from '../constants';
import {ElementTypeRoot} from '../types';
import {
  getSavedComponentFilters,
  saveComponentFilters,
  separateDisplayNameAndHOCs,
  shallowDiffers,
  utfDecodeString,
} from '../utils';
import {localStorageGetItem, localStorageSetItem} from '../storage';
import {__DEBUG__} from '../constants';
import {printStore} from './utils';
import ProfilerStore from './ProfilerStore';
import {
  BRIDGE_PROTOCOL,
  currentBridgeProtocol,
} from 'react-devtools-shared/src/bridge';
import {StrictMode} from 'react-devtools-shared/src/types';

import type {Element} from './views/Components/types';
import type {ComponentFilter, ElementType} from '../types';
import type {
  FrontendBridge,
  BridgeProtocol,
} from 'react-devtools-shared/src/bridge';
import UnsupportedBridgeOperationError from 'react-devtools-shared/src/UnsupportedBridgeOperationError';

const debug = (methodName, ...args) => {
  if (__DEBUG__) {
    console.log(
      `%cStore %c${methodName}`,
      'color: green; font-weight: bold;',
      'font-weight: bold;',
      ...args,
    );
  }
};

const LOCAL_STORAGE_COLLAPSE_ROOTS_BY_DEFAULT_KEY =
  'React::DevTools::collapseNodesByDefault';
const LOCAL_STORAGE_RECORD_CHANGE_DESCRIPTIONS_KEY =
  'React::DevTools::recordChangeDescriptions';

type ErrorAndWarningTuples = Array<{|id: number, index: number|}>;

type Config = {|
  checkBridgeProtocolCompatibility?: boolean,
  isProfiling?: boolean,
  supportsNativeInspection?: boolean,
  supportsProfiling?: boolean,
  supportsReloadAndProfile?: boolean,
  supportsTimeline?: boolean,
  supportsTraceUpdates?: boolean,
|};

export type Capabilities = {|
  supportsBasicProfiling: boolean,
  hasOwnerMetadata: boolean,
  supportsStrictMode: boolean,
  supportsTimeline: boolean,
|};

/**
 * The store is the single source of truth for updates from the backend.
 * ContextProviders can subscribe to the Store for specific things they want to provide.
 */
export default class Store extends EventEmitter<{|
  backendVersion: [],
  collapseNodesByDefault: [],
  componentFilters: [],
  error: [Error],
  mutated: [[Array<number>, Map<number, number>]],
  recordChangeDescriptions: [],
  roots: [],
  rootSupportsBasicProfiling: [],
  rootSupportsTimelineProfiling: [],
  supportsNativeStyleEditor: [],
  supportsReloadAndProfile: [],
  unsupportedBridgeProtocolDetected: [],
  unsupportedRendererVersionDetected: [],
|}> {
  // If the backend version is new enough to report its (NPM) version, this is it.
  // This version may be displayed by the frontend for debugging purposes.
  _backendVersion: string | null = null;

  _bridge: FrontendBridge;

  // Computed whenever _errorsAndWarnings Map changes.
  _cachedErrorCount: number = 0;
  _cachedWarningCount: number = 0;
  _cachedErrorAndWarningTuples: ErrorAndWarningTuples | null = null;

  // Should new nodes be collapsed by default when added to the tree?
  _collapseNodesByDefault: boolean = true;

  _componentFilters: Array<ComponentFilter>;

  // Map of ID to number of recorded error and warning message IDs.
  _errorsAndWarnings: Map<
    number,
    {|errorCount: number, warningCount: number|},
  > = new Map();

  // At least one of the injected renderers contains (DEV only) owner metadata.
  _hasOwnerMetadata: boolean = false;

  // Map of ID to (mutable) Element.
  // Elements are mutated to avoid excessive cloning during tree updates.
  // The InspectedElement Suspense cache also relies on this mutability for its WeakMap usage.
  _idToElement: Map<number, Element> = new Map();

  // Should the React Native style editor panel be shown?
  _isNativeStyleEditorSupported: boolean = false;

  // Can the backend use the Storage API (e.g. localStorage)?
  // If not, features like reload-and-profile will not work correctly and must be disabled.
  _isBackendStorageAPISupported: boolean = false;

  // Can DevTools use sync XHR requests?
  // If not, features like reload-and-profile will not work correctly and must be disabled.
  // This current limitation applies only to web extension builds
  // and will need to be reconsidered in the future if we add support for reload to React Native.
  _isSynchronousXHRSupported: boolean = false;

  _nativeStyleEditorValidAttributes: $ReadOnlyArray<string> | null = null;

  // Older backends don't support an explicit bridge protocol,
  // so we should timeout eventually and show a downgrade message.
  _onBridgeProtocolTimeoutID: TimeoutID | null = null;

  // Map of element (id) to the set of elements (ids) it owns.
  // This map enables getOwnersListForElement() to avoid traversing the entire tree.
  _ownersMap: Map<number, Set<number>> = new Map();

  _profilerStore: ProfilerStore;

  _recordChangeDescriptions: boolean = false;

  // Incremented each time the store is mutated.
  // This enables a passive effect to detect a mutation between render and commit phase.
  _revision: number = 0;

  // This Array must be treated as immutable!
  // Passive effects will check it for changes between render and mount.
  _roots: $ReadOnlyArray<number> = [];

  _rootIDToCapabilities: Map<number, Capabilities> = new Map();

  // Renderer ID is needed to support inspection fiber props, state, and hooks.
  _rootIDToRendererID: Map<number, number> = new Map();

  // These options may be initially set by a confiugraiton option when constructing the Store.
  _supportsNativeInspection: boolean = true;
  _supportsProfiling: boolean = false;
  _supportsReloadAndProfile: boolean = false;
  _supportsTimeline: boolean = false;
  _supportsTraceUpdates: boolean = false;

  // These options default to false but may be updated as roots are added and removed.
  _rootSupportsBasicProfiling: boolean = false;
  _rootSupportsTimelineProfiling: boolean = false;

  _bridgeProtocol: BridgeProtocol | null = null;
  _unsupportedBridgeProtocolDetected: boolean = false;
  _unsupportedRendererVersionDetected: boolean = false;

  // Total number of visible elements (within all roots).
  // Used for windowing purposes.
  _weightAcrossRoots: number = 0;

  constructor(bridge: FrontendBridge, config?: Config) {
    super();

    if (__DEBUG__) {
      debug('constructor', 'subscribing to Bridge');
    }

    this._collapseNodesByDefault =
      localStorageGetItem(LOCAL_STORAGE_COLLAPSE_ROOTS_BY_DEFAULT_KEY) ===
      'true';

    this._recordChangeDescriptions =
      localStorageGetItem(LOCAL_STORAGE_RECORD_CHANGE_DESCRIPTIONS_KEY) ===
      'true';

    this._componentFilters = getSavedComponentFilters();

    let isProfiling = false;
    if (config != null) {
      isProfiling = config.isProfiling === true;

      const {
        supportsNativeInspection,
        supportsProfiling,
        supportsReloadAndProfile,
        supportsTimeline,
        supportsTraceUpdates,
      } = config;
      this._supportsNativeInspection = supportsNativeInspection !== false;
      if (supportsProfiling) {
        this._supportsProfiling = true;
      }
      if (supportsReloadAndProfile) {
        this._supportsReloadAndProfile = true;
      }
      if (supportsTimeline) {
        this._supportsTimeline = true;
      }
      if (supportsTraceUpdates) {
        this._supportsTraceUpdates = true;
      }
    }

    this._bridge = bridge;
    bridge.addListener('operations', this.onBridgeOperations);
    bridge.addListener(
      'overrideComponentFilters',
      this.onBridgeOverrideComponentFilters,
    );
    bridge.addListener('shutdown', this.onBridgeShutdown);
    bridge.addListener(
      'isBackendStorageAPISupported',
      this.onBackendStorageAPISupported,
    );
    bridge.addListener(
      'isNativeStyleEditorSupported',
      this.onBridgeNativeStyleEditorSupported,
    );
    bridge.addListener(
      'isSynchronousXHRSupported',
      this.onBridgeSynchronousXHRSupported,
    );
    bridge.addListener(
      'unsupportedRendererVersion',
      this.onBridgeUnsupportedRendererVersion,
    );

    this._profilerStore = new ProfilerStore(bridge, this, isProfiling);

    // Verify that the frontend version is compatible with the connected backend.
    // See github.com/facebook/react/issues/21326
    if (config != null && config.checkBridgeProtocolCompatibility) {
      // Older backends don't support an explicit bridge protocol,
      // so we should timeout eventually and show a downgrade message.
      this._onBridgeProtocolTimeoutID = setTimeout(
        this.onBridgeProtocolTimeout,
        10000,
      );

      bridge.addListener('bridgeProtocol', this.onBridgeProtocol);
      bridge.send('getBridgeProtocol');
    }

    bridge.addListener('backendVersion', this.onBridgeBackendVersion);
    bridge.send('getBackendVersion');
  }

  // This is only used in tests to avoid memory leaks.
  assertExpectedRootMapSizes() {
    if (this.roots.length === 0) {
      // The only safe time to assert these maps are empty is when the store is empty.
      this.assertMapSizeMatchesRootCount(this._idToElement, '_idToElement');
      this.assertMapSizeMatchesRootCount(this._ownersMap, '_ownersMap');
    }

    // These maps should always be the same size as the number of roots
    this.assertMapSizeMatchesRootCount(
      this._rootIDToCapabilities,
      '_rootIDToCapabilities',
    );
    this.assertMapSizeMatchesRootCount(
      this._rootIDToRendererID,
      '_rootIDToRendererID',
    );
  }

  // This is only used in tests to avoid memory leaks.
  assertMapSizeMatchesRootCount(map: Map<any, any>, mapName: string) {
    const expectedSize = this.roots.length;
    if (map.size !== expectedSize) {
      this._throwAndEmitError(
        Error(
          `Expected ${mapName} to contain ${expectedSize} items, but it contains ${
            map.size
          } items\n\n${inspect(map, {
            depth: 20,
          })}`,
        ),
      );
    }
  }

  get backendVersion(): string | null {
    return this._backendVersion;
  }

  get collapseNodesByDefault(): boolean {
    return this._collapseNodesByDefault;
  }
  set collapseNodesByDefault(value: boolean): void {
    this._collapseNodesByDefault = value;

    localStorageSetItem(
      LOCAL_STORAGE_COLLAPSE_ROOTS_BY_DEFAULT_KEY,
      value ? 'true' : 'false',
    );

    this.emit('collapseNodesByDefault');
  }

  get componentFilters(): Array<ComponentFilter> {
    return this._componentFilters;
  }
  set componentFilters(value: Array<ComponentFilter>): void {
    if (this._profilerStore.isProfiling) {
      // Re-mounting a tree while profiling is in progress might break a lot of assumptions.
      // If necessary, we could support this- but it doesn't seem like a necessary use case.
      this._throwAndEmitError(
        Error('Cannot modify filter preferences while profiling'),
      );
    }

    // Filter updates are expensive to apply (since they impact the entire tree).
    // Let's determine if they've changed and avoid doing this work if they haven't.
    const prevEnabledComponentFilters = this._componentFilters.filter(
      filter => filter.isEnabled,
    );
    const nextEnabledComponentFilters = value.filter(
      filter => filter.isEnabled,
    );
    let haveEnabledFiltersChanged =
      prevEnabledComponentFilters.length !== nextEnabledComponentFilters.length;
    if (!haveEnabledFiltersChanged) {
      for (let i = 0; i < nextEnabledComponentFilters.length; i++) {
        const prevFilter = prevEnabledComponentFilters[i];
        const nextFilter = nextEnabledComponentFilters[i];
        if (shallowDiffers(prevFilter, nextFilter)) {
          haveEnabledFiltersChanged = true;
          break;
        }
      }
    }

    this._componentFilters = value;

    // Update persisted filter preferences stored in localStorage.
    saveComponentFilters(value);

    // Notify the renderer that filter preferences have changed.
    // This is an expensive operation; it unmounts and remounts the entire tree,
    // so only do it if the set of enabled component filters has changed.
    if (haveEnabledFiltersChanged) {
      this._bridge.send('updateComponentFilters', value);
    }

    this.emit('componentFilters');
  }

  get bridgeProtocol(): BridgeProtocol | null {
    return this._bridgeProtocol;
  }

  get errorCount(): number {
    return this._cachedErrorCount;
  }

  get hasOwnerMetadata(): boolean {
    return this._hasOwnerMetadata;
  }

  get nativeStyleEditorValidAttributes(): $ReadOnlyArray<string> | null {
    return this._nativeStyleEditorValidAttributes;
  }

  get numElements(): number {
    return this._weightAcrossRoots;
  }

  get profilerStore(): ProfilerStore {
    return this._profilerStore;
  }

  get recordChangeDescriptions(): boolean {
    return this._recordChangeDescriptions;
  }
  set recordChangeDescriptions(value: boolean): void {
    this._recordChangeDescriptions = value;

    localStorageSetItem(
      LOCAL_STORAGE_RECORD_CHANGE_DESCRIPTIONS_KEY,
      value ? 'true' : 'false',
    );

    this.emit('recordChangeDescriptions');
  }

  get revision(): number {
    return this._revision;
  }

  get rootIDToRendererID(): Map<number, number> {
    return this._rootIDToRendererID;
  }

  get roots(): $ReadOnlyArray<number> {
    return this._roots;
  }

  // At least one of the currently mounted roots support the Legacy profiler.
  get rootSupportsBasicProfiling(): boolean {
    return this._rootSupportsBasicProfiling;
  }

  // At least one of the currently mounted roots support the Timeline profiler.
  get rootSupportsTimelineProfiling(): boolean {
    return this._rootSupportsTimelineProfiling;
  }

  get supportsNativeInspection(): boolean {
    return this._supportsNativeInspection;
  }

  get supportsNativeStyleEditor(): boolean {
    return this._isNativeStyleEditorSupported;
  }

  // This build of DevTools supports the legacy profiler.
  // This is a static flag, controled by the Store config.
  get supportsProfiling(): boolean {
    return this._supportsProfiling;
  }

  get supportsReloadAndProfile(): boolean {
    // Does the DevTools shell support reloading and eagerly injecting the renderer interface?
    // And if so, can the backend use the localStorage API and sync XHR?
    // All of these are currently required for the reload-and-profile feature to work.
    return (
      this._supportsReloadAndProfile &&
      this._isBackendStorageAPISupported &&
      this._isSynchronousXHRSupported
    );
  }

  // This build of DevTools supports the Timeline profiler.
  // This is a static flag, controled by the Store config.
  get supportsTimeline(): boolean {
    return this._supportsTimeline;
  }

  get supportsTraceUpdates(): boolean {
    return this._supportsTraceUpdates;
  }

  get unsupportedBridgeProtocolDetected(): boolean {
    return this._unsupportedBridgeProtocolDetected;
  }

  get unsupportedRendererVersionDetected(): boolean {
    return this._unsupportedRendererVersionDetected;
  }

  get warningCount(): number {
    return this._cachedWarningCount;
  }

  containsElement(id: number): boolean {
    return this._idToElement.get(id) != null;
  }

  getElementAtIndex(index: number): Element | null {
    if (index < 0 || index >= this.numElements) {
      console.warn(
        `Invalid index ${index} specified; store contains ${this.numElements} items.`,
      );

      return null;
    }

    // Find which root this element is in...
    let rootID;
    let root;
    let rootWeight = 0;
    for (let i = 0; i < this._roots.length; i++) {
      rootID = this._roots[i];
      root = ((this._idToElement.get(rootID): any): Element);
      if (root.children.length === 0) {
        continue;
      } else if (rootWeight + root.weight > index) {
        break;
      } else {
        rootWeight += root.weight;
      }
    }

    // Find the element in the tree using the weight of each node...
    // Skip over the root itself, because roots aren't visible in the Elements tree.
    let currentElement = ((root: any): Element);
    let currentWeight = rootWeight - 1;
    while (index !== currentWeight) {
      const numChildren = currentElement.children.length;
      for (let i = 0; i < numChildren; i++) {
        const childID = currentElement.children[i];
        const child = ((this._idToElement.get(childID): any): Element);
        const childWeight = child.isCollapsed ? 1 : child.weight;

        if (index <= currentWeight + childWeight) {
          currentWeight++;
          currentElement = child;
          break;
        } else {
          currentWeight += childWeight;
        }
      }
    }

    return ((currentElement: any): Element) || null;
  }

  getElementIDAtIndex(index: number): number | null {
    const element: Element | null = this.getElementAtIndex(index);
    return element === null ? null : element.id;
  }

  getElementByID(id: number): Element | null {
    const element = this._idToElement.get(id);
    if (element == null) {
      console.warn(`No element found with id "${id}"`);
      return null;
    }

    return element;
  }

  // Returns a tuple of [id, index]
  getElementsWithErrorsAndWarnings(): Array<{|id: number, index: number|}> {
    if (this._cachedErrorAndWarningTuples !== null) {
      return this._cachedErrorAndWarningTuples;
    } else {
      const errorAndWarningTuples: ErrorAndWarningTuples = [];

      this._errorsAndWarnings.forEach((_, id) => {
        const index = this.getIndexOfElementID(id);
        if (index !== null) {
          let low = 0;
          let high = errorAndWarningTuples.length;
          while (low < high) {
            const mid = (low + high) >> 1;
            if (errorAndWarningTuples[mid].index > index) {
              high = mid;
            } else {
              low = mid + 1;
            }
          }

          errorAndWarningTuples.splice(low, 0, {id, index});
        }
      });

      // Cache for later (at least until the tree changes again).
      this._cachedErrorAndWarningTuples = errorAndWarningTuples;

      return errorAndWarningTuples;
    }
  }

  getErrorAndWarningCountForElementID(
    id: number,
  ): {|errorCount: number, warningCount: number|} {
    return this._errorsAndWarnings.get(id) || {errorCount: 0, warningCount: 0};
  }

  getIndexOfElementID(id: number): number | null {
    const element = this.getElementByID(id);

    if (element === null || element.parentID === 0) {
      return null;
    }

    // Walk up the tree to the root.
    // Increment the index by one for each node we encounter,
    // and by the weight of all nodes to the left of the current one.
    // This should be a relatively fast way of determining the index of a node within the tree.
    let previousID = id;
    let currentID = element.parentID;
    let index = 0;
    while (true) {
      const current = ((this._idToElement.get(currentID): any): Element);

      const {children} = current;
      for (let i = 0; i < children.length; i++) {
        const childID = children[i];
        if (childID === previousID) {
          break;
        }
        const child = ((this._idToElement.get(childID): any): Element);
        index += child.isCollapsed ? 1 : child.weight;
      }

      if (current.parentID === 0) {
        // We found the root; stop crawling.
        break;
      }

      index++;

      previousID = current.id;
      currentID = current.parentID;
    }

    // At this point, the current ID is a root (from the previous loop).
    // We also need to offset the index by previous root weights.
    for (let i = 0; i < this._roots.length; i++) {
      const rootID = this._roots[i];
      if (rootID === currentID) {
        break;
      }
      const root = ((this._idToElement.get(rootID): any): Element);
      index += root.weight;
    }

    return index;
  }

  getOwnersListForElement(ownerID: number): Array<Element> {
    const list = [];
    const element = this._idToElement.get(ownerID);
    if (element != null) {
      list.push({
        ...element,
        depth: 0,
      });

      const unsortedIDs = this._ownersMap.get(ownerID);
      if (unsortedIDs !== undefined) {
        const depthMap: Map<number, number> = new Map([[ownerID, 0]]);

        // Items in a set are ordered based on insertion.
        // This does not correlate with their order in the tree.
        // So first we need to order them.
        // I wish we could avoid this sorting operation; we could sort at insertion time,
        // but then we'd have to pay sorting costs even if the owners list was never used.
        // Seems better to defer the cost, since the set of ids is probably pretty small.
        const sortedIDs = Array.from(unsortedIDs).sort(
          (idA, idB) =>
            ((this.getIndexOfElementID(idA): any): number) -
            ((this.getIndexOfElementID(idB): any): number),
        );

        // Next we need to determine the appropriate depth for each element in the list.
        // The depth in the list may not correspond to the depth in the tree,
        // because the list has been filtered to remove intermediate components.
        // Perhaps the easiest way to do this is to walk up the tree until we reach either:
        // (1) another node that's already in the tree, or (2) the root (owner)
        // at which point, our depth is just the depth of that node plus one.
        sortedIDs.forEach(id => {
          const innerElement = this._idToElement.get(id);
          if (innerElement != null) {
            let parentID = innerElement.parentID;

            let depth = 0;
            while (parentID > 0) {
              if (parentID === ownerID || unsortedIDs.has(parentID)) {
                depth = depthMap.get(parentID) + 1;
                depthMap.set(id, depth);
                break;
              }
              const parent = this._idToElement.get(parentID);
              if (parent == null) {
                break;
              }
              parentID = parent.parentID;
            }

            if (depth === 0) {
              this._throwAndEmitError(Error('Invalid owners list'));
            }

            list.push({...innerElement, depth});
          }
        });
      }
    }

    return list;
  }

  getRendererIDForElement(id: number): number | null {
    let current = this._idToElement.get(id);
    while (current != null) {
      if (current.parentID === 0) {
        const rendererID = this._rootIDToRendererID.get(current.id);
        return rendererID == null ? null : rendererID;
      } else {
        current = this._idToElement.get(current.parentID);
      }
    }
    return null;
  }

  getRootIDForElement(id: number): number | null {
    let current = this._idToElement.get(id);
    while (current != null) {
      if (current.parentID === 0) {
        return current.id;
      } else {
        current = this._idToElement.get(current.parentID);
      }
    }
    return null;
  }

  isInsideCollapsedSubTree(id: number): boolean {
    let current = this._idToElement.get(id);
    while (current != null) {
      if (current.parentID === 0) {
        return false;
      } else {
        current = this._idToElement.get(current.parentID);
        if (current != null && current.isCollapsed) {
          return true;
        }
      }
    }
    return false;
  }

  // TODO Maybe split this into two methods: expand() and collapse()
  toggleIsCollapsed(id: number, isCollapsed: boolean): void {
    let didMutate = false;

    const element = this.getElementByID(id);
    if (element !== null) {
      if (isCollapsed) {
        if (element.type === ElementTypeRoot) {
          this._throwAndEmitError(Error('Root nodes cannot be collapsed'));
        }

        if (!element.isCollapsed) {
          didMutate = true;
          element.isCollapsed = true;

          const weightDelta = 1 - element.weight;

          let parentElement = ((this._idToElement.get(
            element.parentID,
          ): any): Element);
          while (parentElement != null) {
            // We don't need to break on a collapsed parent in the same way as the expand case below.
            // That's because collapsing a node doesn't "bubble" and affect its parents.
            parentElement.weight += weightDelta;
            parentElement = this._idToElement.get(parentElement.parentID);
          }
        }
      } else {
        let currentElement = element;
        while (currentElement != null) {
          const oldWeight = currentElement.isCollapsed
            ? 1
            : currentElement.weight;

          if (currentElement.isCollapsed) {
            didMutate = true;
            currentElement.isCollapsed = false;

            const newWeight = currentElement.isCollapsed
              ? 1
              : currentElement.weight;
            const weightDelta = newWeight - oldWeight;

            let parentElement = ((this._idToElement.get(
              currentElement.parentID,
            ): any): Element);
            while (parentElement != null) {
              parentElement.weight += weightDelta;
              if (parentElement.isCollapsed) {
                // It's important to break on a collapsed parent when expanding nodes.
                // That's because expanding a node "bubbles" up and expands all parents as well.
                // Breaking in this case prevents us from over-incrementing the expanded weights.
                break;
              }
              parentElement = this._idToElement.get(parentElement.parentID);
            }
          }

          currentElement =
            currentElement.parentID !== 0
              ? this.getElementByID(currentElement.parentID)
              : null;
        }
      }

      // Only re-calculate weights and emit an "update" event if the store was mutated.
      if (didMutate) {
        let weightAcrossRoots = 0;
        this._roots.forEach(rootID => {
          const {weight} = ((this.getElementByID(rootID): any): Element);
          weightAcrossRoots += weight;
        });
        this._weightAcrossRoots = weightAcrossRoots;

        // The Tree context's search reducer expects an explicit list of ids for nodes that were added or removed.
        // In this  case, we can pass it empty arrays since nodes in a collapsed tree are still there (just hidden).
        // Updating the selected search index later may require auto-expanding a collapsed subtree though.
        this.emit('mutated', [[], new Map()]);
      }
    }
  }

  _adjustParentTreeWeight = (
    parentElement: Element | null,
    weightDelta: number,
  ) => {
    let isInsideCollapsedSubTree = false;

    while (parentElement != null) {
      parentElement.weight += weightDelta;

      // Additions and deletions within a collapsed subtree should not bubble beyond the collapsed parent.
      // Their weight will bubble up when the parent is expanded.
      if (parentElement.isCollapsed) {
        isInsideCollapsedSubTree = true;
        break;
      }

      parentElement = ((this._idToElement.get(
        parentElement.parentID,
      ): any): Element);
    }

    // Additions and deletions within a collapsed subtree should not affect the overall number of elements.
    if (!isInsideCollapsedSubTree) {
      this._weightAcrossRoots += weightDelta;
    }
  };

  _recursivelyUpdateSubtree(
    id: number,
    callback: (element: Element) => void,
  ): void {
    const element = this._idToElement.get(id);
    if (element) {
      callback(element);

      element.children.forEach(child =>
        this._recursivelyUpdateSubtree(child, callback),
      );
    }
  }

  onBridgeNativeStyleEditorSupported = ({
    isSupported,
    validAttributes,
  }: {|
    isSupported: boolean,
    validAttributes: ?$ReadOnlyArray<string>,
  |}) => {
    this._isNativeStyleEditorSupported = isSupported;
    this._nativeStyleEditorValidAttributes = validAttributes || null;

    this.emit('supportsNativeStyleEditor');
  };

  onBridgeOperations = (operations: Array<number>) => {
    if (__DEBUG__) {
      console.groupCollapsed('onBridgeOperations');
      debug('onBridgeOperations', operations.join(','));
    }

    let haveRootsChanged = false;
    let haveErrorsOrWarningsChanged = false;

    // The first two values are always rendererID and rootID
    const rendererID = operations[0];

    const addedElementIDs: Array<number> = [];
    // This is a mapping of removed ID -> parent ID:
    const removedElementIDs: Map<number, number> = new Map();
    // We'll use the parent ID to adjust selection if it gets deleted.

    let i = 2;

    // Reassemble the string table.
    const stringTable = [
      null, // ID = 0 corresponds to the null string.
    ];
    const stringTableSize = operations[i++];
    const stringTableEnd = i + stringTableSize;
    while (i < stringTableEnd) {
      const nextLength = operations[i++];
      const nextString = utfDecodeString(
        (operations.slice(i, i + nextLength): any),
      );
      stringTable.push(nextString);
      i += nextLength;
    }

    while (i < operations.length) {
      const operation = operations[i];
      switch (operation) {
        case TREE_OPERATION_ADD: {
          const id = ((operations[i + 1]: any): number);
          const type = ((operations[i + 2]: any): ElementType);

          i += 3;

          if (this._idToElement.has(id)) {
            this._throwAndEmitError(
              Error(
                `Cannot add node "${id}" because a node with that id is already in the Store.`,
              ),
            );
          }

          let ownerID: number = 0;
          let parentID: number = ((null: any): number);
          if (type === ElementTypeRoot) {
            if (__DEBUG__) {
              debug('Add', `new root node ${id}`);
            }

            const isStrictModeCompliant = operations[i] > 0;
            i++;

            const supportsBasicProfiling =
              (operations[i] & PROFILING_FLAG_BASIC_SUPPORT) !== 0;
            const supportsTimeline =
              (operations[i] & PROFILING_FLAG_TIMELINE_SUPPORT) !== 0;
            i++;

            let supportsStrictMode = false;
            let hasOwnerMetadata = false;

            // If we don't know the bridge protocol, guess that we're dealing with the latest.
            // If we do know it, we can take it into consideration when parsing operations.
            if (
              this._bridgeProtocol === null ||
              this._bridgeProtocol.version >= 2
            ) {
              supportsStrictMode = operations[i] > 0;
              i++;

              hasOwnerMetadata = operations[i] > 0;
              i++;
            }

            this._roots = this._roots.concat(id);
            this._rootIDToRendererID.set(id, rendererID);
            this._rootIDToCapabilities.set(id, {
              supportsBasicProfiling,
              hasOwnerMetadata,
              supportsStrictMode,
              supportsTimeline,
            });

            // Not all roots support StrictMode;
            // don't flag a root as non-compliant unless it also supports StrictMode.
            const isStrictModeNonCompliant =
              !isStrictModeCompliant && supportsStrictMode;

            this._idToElement.set(id, {
              children: [],
              depth: -1,
              displayName: null,
              hocDisplayNames: null,
              id,
              isCollapsed: false, // Never collapse roots; it would hide the entire tree.
              isStrictModeNonCompliant,
              key: null,
              ownerID: 0,
              parentID: 0,
              type,
              weight: 0,
            });

            haveRootsChanged = true;
          } else {
            parentID = ((operations[i]: any): number);
            i++;

            ownerID = ((operations[i]: any): number);
            i++;

            const displayNameStringID = operations[i];
            const displayName = stringTable[displayNameStringID];
            i++;

            const keyStringID = operations[i];
            const key = stringTable[keyStringID];
            i++;

            if (__DEBUG__) {
              debug(
                'Add',
                `node ${id} (${displayName || 'null'}) as child of ${parentID}`,
              );
            }

            if (!this._idToElement.has(parentID)) {
              this._throwAndEmitError(
                Error(
                  `Cannot add child "${id}" to parent "${parentID}" because parent node was not found in the Store.`,
                ),
              );
            }

            const parentElement = ((this._idToElement.get(
              parentID,
            ): any): Element);
            parentElement.children.push(id);

            const [
              displayNameWithoutHOCs,
              hocDisplayNames,
            ] = separateDisplayNameAndHOCs(displayName, type);

            const element: Element = {
              children: [],
              depth: parentElement.depth + 1,
              displayName: displayNameWithoutHOCs,
              hocDisplayNames,
              id,
              isCollapsed: this._collapseNodesByDefault,
              isStrictModeNonCompliant: parentElement.isStrictModeNonCompliant,
              key,
              ownerID,
              parentID,
              type,
              weight: 1,
            };

            this._idToElement.set(id, element);
            addedElementIDs.push(id);
            this._adjustParentTreeWeight(parentElement, 1);

            if (ownerID > 0) {
              let set = this._ownersMap.get(ownerID);
              if (set === undefined) {
                set = new Set();
                this._ownersMap.set(ownerID, set);
              }
              set.add(id);
            }
          }
          break;
        }
        case TREE_OPERATION_REMOVE: {
          const removeLength = ((operations[i + 1]: any): number);
          i += 2;

          for (let removeIndex = 0; removeIndex < removeLength; removeIndex++) {
            const id = ((operations[i]: any): number);

            if (!this._idToElement.has(id)) {
              this._throwAndEmitError(
                Error(
                  `Cannot remove node "${id}" because no matching node was found in the Store.`,
                ),
              );
            }

            i += 1;

            const element = ((this._idToElement.get(id): any): Element);
            const {children, ownerID, parentID, weight} = element;
            if (children.length > 0) {
              this._throwAndEmitError(
                Error(`Node "${id}" was removed before its children.`),
              );
            }

            this._idToElement.delete(id);

            let parentElement = null;
            if (parentID === 0) {
              if (__DEBUG__) {
                debug('Remove', `node ${id} root`);
              }

              this._roots = this._roots.filter(rootID => rootID !== id);
              this._rootIDToRendererID.delete(id);
              this._rootIDToCapabilities.delete(id);

              haveRootsChanged = true;
            } else {
              if (__DEBUG__) {
                debug('Remove', `node ${id} from parent ${parentID}`);
              }
              parentElement = ((this._idToElement.get(parentID): any): Element);
              if (parentElement === undefined) {
                this._throwAndEmitError(
                  Error(
                    `Cannot remove node "${id}" from parent "${parentID}" because no matching node was found in the Store.`,
                  ),
                );
              }
              const index = parentElement.children.indexOf(id);
              parentElement.children.splice(index, 1);
            }

            this._adjustParentTreeWeight(parentElement, -weight);
            removedElementIDs.set(id, parentID);

            this._ownersMap.delete(id);
            if (ownerID > 0) {
              const set = this._ownersMap.get(ownerID);
              if (set !== undefined) {
                set.delete(id);
              }
            }

            if (this._errorsAndWarnings.has(id)) {
              this._errorsAndWarnings.delete(id);
              haveErrorsOrWarningsChanged = true;
            }
          }

          break;
        }
        case TREE_OPERATION_REMOVE_ROOT: {
          i += 1;

          const id = operations[1];

          if (__DEBUG__) {
            debug(`Remove root ${id}`);
          }

          const recursivelyDeleteElements = elementID => {
            const element = this._idToElement.get(elementID);
            this._idToElement.delete(elementID);
            if (element) {
              // Mostly for Flow's sake
              for (let index = 0; index < element.children.length; index++) {
                recursivelyDeleteElements(element.children[index]);
              }
            }
          };

          const root = ((this._idToElement.get(id): any): Element);
          recursivelyDeleteElements(id);

          this._rootIDToCapabilities.delete(id);
          this._rootIDToRendererID.delete(id);
          this._roots = this._roots.filter(rootID => rootID !== id);
          this._weightAcrossRoots -= root.weight;
          break;
        }
        case TREE_OPERATION_REORDER_CHILDREN: {
          const id = ((operations[i + 1]: any): number);
          const numChildren = ((operations[i + 2]: any): number);
          i += 3;

          if (!this._idToElement.has(id)) {
            this._throwAndEmitError(
              Error(
                `Cannot reorder children for node "${id}" because no matching node was found in the Store.`,
              ),
            );
          }

          const element = ((this._idToElement.get(id): any): Element);
          const children = element.children;
          if (children.length !== numChildren) {
            this._throwAndEmitError(
              Error(
                `Children cannot be added or removed during a reorder operation.`,
              ),
            );
          }

          for (let j = 0; j < numChildren; j++) {
            const childID = operations[i + j];
            children[j] = childID;
            if (__DEV__) {
              // This check is more expensive so it's gated by __DEV__.
              const childElement = this._idToElement.get(childID);
              if (childElement == null || childElement.parentID !== id) {
                console.error(
                  `Children cannot be added or removed during a reorder operation.`,
                );
              }
            }
          }
          i += numChildren;

          if (__DEBUG__) {
            debug('Re-order', `Node ${id} children ${children.join(',')}`);
          }
          break;
        }
        case TREE_OPERATION_SET_SUBTREE_MODE: {
          const id = operations[i + 1];
          const mode = operations[i + 2];

          i += 3;

          // If elements have already been mounted in this subtree, update them.
          // (In practice, this likely only applies to the root element.)
          if (mode === StrictMode) {
            this._recursivelyUpdateSubtree(id, element => {
              element.isStrictModeNonCompliant = false;
            });
          }

          if (__DEBUG__) {
            debug(
              'Subtree mode',
              `Subtree with root ${id} set to mode ${mode}`,
            );
          }
          break;
        }
        case TREE_OPERATION_UPDATE_TREE_BASE_DURATION:
          // Base duration updates are only sent while profiling is in progress.
          // We can ignore them at this point.
          // The profiler UI uses them lazily in order to generate the tree.
          i += 3;
          break;
        case TREE_OPERATION_UPDATE_ERRORS_OR_WARNINGS:
          const id = operations[i + 1];
          const errorCount = operations[i + 2];
          const warningCount = operations[i + 3];

          i += 4;

          if (errorCount > 0 || warningCount > 0) {
            this._errorsAndWarnings.set(id, {errorCount, warningCount});
          } else if (this._errorsAndWarnings.has(id)) {
            this._errorsAndWarnings.delete(id);
          }
          haveErrorsOrWarningsChanged = true;
          break;
        default:
          this._throwAndEmitError(
            new UnsupportedBridgeOperationError(
              `Unsupported Bridge operation "${operation}"`,
            ),
          );
      }
    }

    this._revision++;

    // Any time the tree changes (e.g. elements added, removed, or reordered) cached inidices may be invalid.
    this._cachedErrorAndWarningTuples = null;

    if (haveErrorsOrWarningsChanged) {
      let errorCount = 0;
      let warningCount = 0;

      this._errorsAndWarnings.forEach(entry => {
        errorCount += entry.errorCount;
        warningCount += entry.warningCount;
      });

      this._cachedErrorCount = errorCount;
      this._cachedWarningCount = warningCount;
    }

    if (haveRootsChanged) {
      const prevRootSupportsProfiling = this._rootSupportsBasicProfiling;
      const prevRootSupportsTimelineProfiling = this
        ._rootSupportsTimelineProfiling;

      this._hasOwnerMetadata = false;
      this._rootSupportsBasicProfiling = false;
      this._rootSupportsTimelineProfiling = false;
      this._rootIDToCapabilities.forEach(
        ({supportsBasicProfiling, hasOwnerMetadata, supportsTimeline}) => {
          if (supportsBasicProfiling) {
            this._rootSupportsBasicProfiling = true;
          }
          if (hasOwnerMetadata) {
            this._hasOwnerMetadata = true;
          }
          if (supportsTimeline) {
            this._rootSupportsTimelineProfiling = true;
          }
        },
      );

      this.emit('roots');

      if (this._rootSupportsBasicProfiling !== prevRootSupportsProfiling) {
        this.emit('rootSupportsBasicProfiling');
      }

      if (
        this._rootSupportsTimelineProfiling !==
        prevRootSupportsTimelineProfiling
      ) {
        this.emit('rootSupportsTimelineProfiling');
      }
    }

    if (__DEBUG__) {
      console.log(printStore(this, true));
      console.groupEnd();
    }

    this.emit('mutated', [addedElementIDs, removedElementIDs]);
  };

  // Certain backends save filters on a per-domain basis.
  // In order to prevent filter preferences and applied filters from being out of sync,
  // this message enables the backend to override the frontend's current ("saved") filters.
  // This action should also override the saved filters too,
  // else reloading the frontend without reloading the backend would leave things out of sync.
  onBridgeOverrideComponentFilters = (
    componentFilters: Array<ComponentFilter>,
  ) => {
    this._componentFilters = componentFilters;

    saveComponentFilters(componentFilters);
  };

  onBridgeShutdown = () => {
    if (__DEBUG__) {
      debug('onBridgeShutdown', 'unsubscribing from Bridge');
    }

    const bridge = this._bridge;
    bridge.removeListener('operations', this.onBridgeOperations);
    bridge.removeListener(
      'overrideComponentFilters',
      this.onBridgeOverrideComponentFilters,
    );
    bridge.removeListener('shutdown', this.onBridgeShutdown);
    bridge.removeListener(
      'isBackendStorageAPISupported',
      this.onBackendStorageAPISupported,
    );
    bridge.removeListener(
      'isNativeStyleEditorSupported',
      this.onBridgeNativeStyleEditorSupported,
    );
    bridge.removeListener(
      'isSynchronousXHRSupported',
      this.onBridgeSynchronousXHRSupported,
    );
    bridge.removeListener(
      'unsupportedRendererVersion',
      this.onBridgeUnsupportedRendererVersion,
    );
    bridge.removeListener('backendVersion', this.onBridgeBackendVersion);
    bridge.removeListener('bridgeProtocol', this.onBridgeProtocol);

    if (this._onBridgeProtocolTimeoutID !== null) {
      clearTimeout(this._onBridgeProtocolTimeoutID);
      this._onBridgeProtocolTimeoutID = null;
    }
  };

  onBackendStorageAPISupported = (isBackendStorageAPISupported: boolean) => {
    this._isBackendStorageAPISupported = isBackendStorageAPISupported;

    this.emit('supportsReloadAndProfile');
  };

  onBridgeSynchronousXHRSupported = (isSynchronousXHRSupported: boolean) => {
    this._isSynchronousXHRSupported = isSynchronousXHRSupported;

    this.emit('supportsReloadAndProfile');
  };

  onBridgeUnsupportedRendererVersion = () => {
    this._unsupportedRendererVersionDetected = true;

    this.emit('unsupportedRendererVersionDetected');
  };

  onBridgeBackendVersion = (backendVersion: string) => {
    this._backendVersion = backendVersion;
    this.emit('backendVersion');
  };

  onBridgeProtocol = (bridgeProtocol: BridgeProtocol) => {
    if (this._onBridgeProtocolTimeoutID !== null) {
      clearTimeout(this._onBridgeProtocolTimeoutID);
      this._onBridgeProtocolTimeoutID = null;
    }

    this._bridgeProtocol = bridgeProtocol;

    if (bridgeProtocol.version !== currentBridgeProtocol.version) {
      // Technically newer versions of the frontend can, at least for now,
      // gracefully handle older versions of the backend protocol.
      // So for now we don't need to display the unsupported dialog.
    }
  };

  onBridgeProtocolTimeout = () => {
    this._onBridgeProtocolTimeoutID = null;

    // If we timed out, that indicates the backend predates the bridge protocol,
    // so we can set a fake version (0) to trigger the downgrade message.
    this._bridgeProtocol = BRIDGE_PROTOCOL[0];

    this.emit('unsupportedBridgeProtocolDetected');
  };

  // The Store should never throw an Error without also emitting an event.
  // Otherwise Store errors will be invisible to users,
  // but the downstream errors they cause will be reported as bugs.
  // For example, https://github.com/facebook/react/issues/21402
  // Emitting an error event allows the ErrorBoundary to show the original error.
  _throwAndEmitError(error: Error) {
    this.emit('error', error);

    // Throwing is still valuable for local development
    // and for unit testing the Store itself.
    throw error;
  }
}
