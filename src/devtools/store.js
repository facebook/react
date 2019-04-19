// @flow

import EventEmitter from 'events';
import memoize from 'memoize-one';
import throttle from 'lodash.throttle';
import {
  TREE_OPERATION_ADD,
  TREE_OPERATION_REMOVE,
  TREE_OPERATION_REORDER_CHILDREN,
  TREE_OPERATION_UPDATE_TREE_BASE_DURATION,
} from '../constants';
import { ElementTypeRoot } from './types';
import { utfDecodeString } from '../utils';
import { __DEBUG__ } from '../constants';
import ProfilingCache from './ProfilingCache';

import type { ElementType } from './types';
import type { Element } from './views/Components/types';
import type {
  ImportedProfilingData,
  ProfilingSnapshotNode,
} from './views/Profiler/types';
import type { Bridge } from '../types';

const debug = (methodName, ...args) => {
  if (__DEBUG__) {
    console.log(
      `%cStore %c${methodName}`,
      'color: green; font-weight: bold;',
      'font-weight: bold;',
      ...args
    );
  }
};

const LOCAL_STORAGE_CAPTURE_SCREENSHOTS_KEY =
  'React::DevTools::captureScreenshots';
const LOCAL_STORAGE_COLLAPSE_ROOTS_BY_DEFAULT_KEY =
  'React::DevTools::collapseNodesByDefault';

const THROTTLE_CAPTURE_SCREENSHOT_DURATION = 500;

type Config = {|
  isProfiling?: boolean,
  supportsCaptureScreenshots?: boolean,
  supportsFileDownloads?: boolean,
  supportsReloadAndProfile?: boolean,
  supportsProfiling?: boolean,
|};

export type Capabilities = {|
  hasOwnerMetadata: boolean,
  supportsProfiling: boolean,
|};

/**
 * The store is the single source of truth for updates from the backend.
 * ContextProviders can subscribe to the Store for specific things they want to provide.
 */
export default class Store extends EventEmitter {
  _bridge: Bridge;

  _captureScreenshots: boolean = false;

  // Should new nodes be collapsed by default when added to the tree?
  _collapseNodesByDefault: boolean = true;

  // At least one of the injected renderers contains (DEV only) owner metadata.
  _hasOwnerMetadata: boolean = false;

  // Map of ID to Element.
  // Elements are mutable (for now) to avoid excessive cloning during tree updates.
  _idToElement: Map<number, Element> = new Map();

  // The user has imported a previously exported profiling session.
  _importedProfilingData: ImportedProfilingData | null = null;

  // The backend is currently profiling.
  // When profiling is in progress, operations are stored so that we can later reconstruct past commit trees.
  _isProfiling: boolean = false;

  // Suspense cache for reading profilign data.
  _profilingCache: ProfilingCache;

  // Map of root (id) to a list of tree mutation that occur during profiling.
  // Once profiling is finished, these mutations can be used, along with the initial tree snapshots,
  // to reconstruct the state of each root for each commit.
  _profilingOperations: Map<number, Array<Uint32Array>> = new Map();

  // Stores screenshots for each commit (when profiling).
  _profilingScreenshots: Map<number, string> = new Map();

  // Snapshot of the state of the main Store (including all roots) when profiling started.
  // Once profiling is finished, this snapshot can be used along with "operations" messages emitted during profiling,
  // to reconstruct the state of each root for each commit.
  // It's okay to use a single root to store this information because node IDs are unique across all roots.
  _profilingSnapshot: Map<number, ProfilingSnapshotNode> = new Map();

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
  // In the case of "supportsProfiling", the option may be updated based on the injected renderers.
  _supportsCaptureScreenshots: boolean = false;
  _supportsFileDownloads: boolean = false;
  _supportsProfiling: boolean = false;
  _supportsReloadAndProfile: boolean = false;

  // Total number of visible elements (within all roots).
  // Used for windowing purposes.
  _weightAcrossRoots: number = 0;

  constructor(bridge: Bridge, config?: Config) {
    super();

    if (__DEBUG__) {
      debug('constructor', 'subscribing to Bridge');
    }

    // Default this setting to true unless otherwise specified.
    this._collapseNodesByDefault =
      localStorage.getItem(LOCAL_STORAGE_COLLAPSE_ROOTS_BY_DEFAULT_KEY) !==
      'false';

    if (config != null) {
      const {
        isProfiling,
        supportsCaptureScreenshots,
        supportsFileDownloads,
        supportsProfiling,
        supportsReloadAndProfile,
      } = config;
      if (isProfiling) {
        this._isProfiling = true;
      }
      if (supportsCaptureScreenshots) {
        this._supportsCaptureScreenshots = true;
        this._captureScreenshots =
          localStorage.getItem(LOCAL_STORAGE_CAPTURE_SCREENSHOTS_KEY) ===
          'true';
      }
      if (supportsFileDownloads) {
        this._supportsFileDownloads = true;
      }
      if (supportsProfiling) {
        this._supportsProfiling = true;
      }
      if (supportsReloadAndProfile) {
        this._supportsReloadAndProfile = true;
      }
    }

    this._bridge = bridge;
    bridge.addListener('operations', this.onBridgeOperations);
    bridge.addListener('profilingStatus', this.onProfilingStatus);
    bridge.addListener('screenshotCaptured', this.onScreenshotCaptured);
    bridge.addListener('shutdown', this.onBridgeShutdown);

    // It's possible that profiling has already started (e.g. "reload and start profiling")
    // so the frontend needs to ask the backend for its status after mounting.
    bridge.send('getProfilingStatus');

    this._profilingCache = new ProfilingCache(bridge, this);
  }

  get captureScreenshots(): boolean {
    return this._captureScreenshots;
  }
  set captureScreenshots(value: boolean): void {
    this._captureScreenshots = value;

    localStorage.setItem(
      LOCAL_STORAGE_CAPTURE_SCREENSHOTS_KEY,
      value ? 'true' : 'false'
    );

    this.emit('captureScreenshots');
  }

  get collapseNodesByDefault(): boolean {
    return this._collapseNodesByDefault;
  }
  set collapseNodesByDefault(value: boolean): void {
    this._collapseNodesByDefault = value;

    localStorage.setItem(
      LOCAL_STORAGE_COLLAPSE_ROOTS_BY_DEFAULT_KEY,
      value ? 'true' : 'false'
    );

    this.emit('collapseNodesByDefault');
  }

  get hasOwnerMetadata(): boolean {
    return this._hasOwnerMetadata;
  }

  // Profiling data has been recorded for at least one root.
  get hasProfilingData(): boolean {
    return (
      this._importedProfilingData !== null || this._profilingOperations.size > 0
    );
  }

  get importedProfilingData(): ImportedProfilingData | null {
    return this._importedProfilingData;
  }
  set importedProfilingData(value: ImportedProfilingData | null): void {
    this._importedProfilingData = value;
    this._profilingOperations = new Map();
    this._profilingSnapshot = new Map();
    this._profilingCache.invalidate();

    this.emit('importedProfilingData');
  }

  get isProfiling(): boolean {
    return this._isProfiling;
  }

  get numElements(): number {
    return this._weightAcrossRoots;
  }

  get profilingCache(): ProfilingCache {
    return this._profilingCache;
  }

  get profilingOperations(): Map<number, Array<Uint32Array>> {
    return this._profilingOperations;
  }

  get profilingScreenshots(): Map<number, string> {
    return this._profilingScreenshots;
  }

  get profilingSnapshot(): Map<number, ProfilingSnapshotNode> {
    return this._profilingSnapshot;
  }

  get revision(): number {
    return this._revision;
  }

  get roots(): $ReadOnlyArray<number> {
    return this._roots;
  }

  get supportsCaptureScreenshots(): boolean {
    return this._supportsCaptureScreenshots;
  }

  get supportsFileDownloads(): boolean {
    return this._supportsFileDownloads;
  }

  get supportsProfiling(): boolean {
    return this._supportsProfiling;
  }

  get supportsReloadAndProfile(): boolean {
    return this._supportsReloadAndProfile;
  }

  clearProfilingData(): void {
    this._importedProfilingData = null;
    this._profilingOperations = new Map();
    this._profilingScreenshots = new Map();
    this._profilingSnapshot = new Map();

    // Invalidate suspense cache if profiling data is being (re-)recorded.
    // Note that we clear now because any existing data is "stale".
    this._profilingCache.invalidate();

    this.emit('isProfiling');
  }

  getElementAtIndex(index: number): Element | null {
    if (index < 0 || index >= this.numElements) {
      console.warn(
        `Invalid index ${index} specified; store contains ${
          this.numElements
        } items.`
      );

      return null;
    }

    // Find wich root this element is in...
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
      if (current.parentID === 0) {
        // We found the root; stop crawling.
        break;
      }

      index++;

      const { children } = current;
      for (let i = 0; i < children.length; i++) {
        const childID = children[i];
        if (childID === previousID) {
          break;
        }
        const child = ((this._idToElement.get(childID): any): Element);
        index += child.isCollapsed ? 1 : child.weight;
      }

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

  getRendererIDForElement(id: number): number | null {
    let current = this._idToElement.get(id);
    while (current != null) {
      if (current.parentID === 0) {
        const rendererID = this._rootIDToRendererID.get(current.id);
        return rendererID == null ? null : ((rendererID: any): number);
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

  startProfiling(): void {
    this._bridge.send('startProfiling');

    // Don't actually update the local profiling boolean yet!
    // Wait for onProfilingStatus() to confirm the status has changed.
    // This ensures the frontend and backend are in sync wrt which commits were profiled.
    // We do this to avoid mismatches on e.g. CommitTreeBuilder that would cause errors.
  }

  stopProfiling(): void {
    this._bridge.send('stopProfiling');

    // Don't actually update the local profiling boolean yet!
    // Wait for onProfilingStatus() to confirm the status has changed.
    // This ensures the frontend and backend are in sync wrt which commits were profiled.
    // We do this to avoid mismatches on e.g. CommitTreeBuilder that would cause errors.
  }

  // TODO Maybe split this into two methods: expand() and collapse()
  toggleIsCollapsed(id: number, isCollapsed: boolean): void {
    const element = this.getElementByID(id);
    if (element !== null) {
      if (isCollapsed) {
        if (element.type === ElementTypeRoot) {
          throw Error('Root nodes cannot be collapsed');
        }

        if (element.isCollapsed) {
          // There's nothing to change in this case.
          // We can exit early (without even emiting a "mutated" event).
          return;
        }

        element.isCollapsed = true;

        const weightDelta = 1 - element.weight;

        let parentElement = ((this._idToElement.get(
          element.parentID
        ): any): Element);
        while (parentElement != null) {
          // We don't need to break on a collapsed parent in the same way as the expand case below.
          // That's because collapsing a node doesn't "bubble" and affect its parents.
          parentElement.weight += weightDelta;
          parentElement = this._idToElement.get(parentElement.parentID);
        }
      } else {
        let currentElement = element;
        while (currentElement != null) {
          const oldWeight = currentElement.isCollapsed
            ? 1
            : currentElement.weight;
          currentElement.isCollapsed = false;
          const newWeight = currentElement.isCollapsed
            ? 1
            : currentElement.weight;
          const weightDelta = newWeight - oldWeight;

          let parentElement = ((this._idToElement.get(
            currentElement.parentID
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

          currentElement =
            currentElement.parentID !== 0
              ? this.getElementByID(currentElement.parentID)
              : null;
        }
      }

      let weightAcrossRoots = 0;
      this._roots.forEach(rootID => {
        const { weight } = ((this.getElementByID(rootID): any): Element);
        weightAcrossRoots += weight;
      });
      this._weightAcrossRoots = weightAcrossRoots;

      // The Tree context's search reducer expects an explicit list of ids for nodes that were added or removed.
      // In this  case, we can pass it empty arrays since nodes in a collapsed tree are still there (just hidden).
      // Updating the selected search index later may require auto-expanding a collapsed subtree though.
      this.emit('mutated', [[], []]);
    }
  }

  _captureScreenshot = throttle(
    memoize((commitIndex: number) => {
      this._bridge.send('captureScreenshot', { commitIndex });
    }),
    THROTTLE_CAPTURE_SCREENSHOT_DURATION
  );

  _takeProfilingSnapshotRecursive = (id: number) => {
    const element = this.getElementByID(id);
    if (element !== null) {
      this._profilingSnapshot.set(id, {
        id,
        children: element.children.slice(0),
        displayName: element.displayName,
        key: element.key,
      });

      element.children.forEach(this._takeProfilingSnapshotRecursive);
    }
  };

  _adjustParentTreeWeight = (
    parentElement: Element | null,
    weightDelta: number
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
        parentElement.parentID
      ): any): Element);
    }

    // Additions and deletions within a collapsed subtree should not affect the overall number of elements.
    if (!isInsideCollapsedSubTree) {
      this._weightAcrossRoots += weightDelta;
    }
  };

  onBridgeOperations = (operations: Uint32Array) => {
    if (!(operations instanceof Uint32Array)) {
      // $FlowFixMe TODO HACK Temporary workaround for the fact that Chrome is not transferring the typed array.
      operations = Uint32Array.from(Object.values(operations));
    }

    if (__DEBUG__) {
      console.groupCollapsed('onBridgeOperations');
      debug('onBridgeOperations', operations.join(','));
    }

    let haveRootsChanged = false;

    const rendererID = operations[0];
    const rootID = operations[1];

    if (this._isProfiling) {
      let profilingOperations = this._profilingOperations.get(rootID);
      if (profilingOperations == null) {
        profilingOperations = [operations];
        this._profilingOperations.set(rootID, profilingOperations);
      } else {
        profilingOperations.push(operations);
      }

      if (this._captureScreenshots) {
        const commitIndex = profilingOperations.length - 1;
        this._captureScreenshot(commitIndex);
      }
    }

    let addedElementIDs: Array<number> = [];
    let removedElementIDs: Array<number> = [];

    let i = 2;
    while (i < operations.length) {
      const operation = operations[i];
      switch (operation) {
        case TREE_OPERATION_ADD: {
          const id = ((operations[i + 1]: any): number);
          const type = ((operations[i + 2]: any): ElementType);

          i = i + 3;

          if (this._idToElement.has(id)) {
            throw Error(
              `Cannot add node ${id} because a node with that id is already in the Store.`
            );
          }

          let ownerID: number = 0;
          let parentID: number = ((null: any): number);
          if (type === ElementTypeRoot) {
            if (__DEBUG__) {
              debug('Add', `new root node ${id}`);
            }

            const supportsProfiling = operations[i] > 0;
            i++;

            const hasOwnerMetadata = operations[i] > 0;
            i++;

            this._roots = this._roots.concat(id);
            this._rootIDToRendererID.set(id, rendererID);
            this._rootIDToCapabilities.set(id, {
              hasOwnerMetadata,
              supportsProfiling,
            });

            this._idToElement.set(id, {
              children: [],
              depth: -1,
              displayName: null,
              id,
              isCollapsed: false, // Never collapse roots; it would hide the entire tree.
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

            const displayNameLength = operations[i];
            i++;
            const displayName =
              displayNameLength === 0
                ? null
                : utfDecodeString(
                    (operations.slice(i, i + displayNameLength): any)
                  );
            i += displayNameLength;

            const keyLength = operations[i];
            i++;
            const key =
              keyLength === 0
                ? null
                : utfDecodeString((operations.slice(i, i + keyLength): any));
            i += +keyLength;

            if (__DEBUG__) {
              debug(
                'Add',
                `node ${id} (${displayName || 'null'}) as child of ${parentID}`
              );
            }

            if (!this._idToElement.has(parentID)) {
              throw Error(
                `Cannot add child ${id} to parent ${parentID} because parent node was not found in the Store.`
              );
            }

            const parentElement = ((this._idToElement.get(
              parentID
            ): any): Element);
            parentElement.children = parentElement.children.concat(id);

            const element: Element = {
              children: [],
              depth: parentElement.depth + 1,
              displayName,
              id,
              isCollapsed: this._collapseNodesByDefault,
              key,
              ownerID,
              parentID: parentElement.id,
              type,
              weight: 1,
            };

            this._idToElement.set(id, element);
            addedElementIDs.push(id);
            this._adjustParentTreeWeight(parentElement, 1);
          }
          break;
        }
        case TREE_OPERATION_REMOVE: {
          const removeLength = ((operations[i + 1]: any): number);
          i = i + 2;

          for (let removeIndex = 0; removeIndex < removeLength; removeIndex++) {
            const id = ((operations[i]: any): number);

            if (!this._idToElement.has(id)) {
              throw Error(
                `Cannot remove node ${id} because no matching node was found in the Store.`
              );
            }

            i = i + 1;

            const element = ((this._idToElement.get(id): any): Element);
            if (element.children.length > 0) {
              throw new Error(`Node ${id} was removed before its children.`);
            }

            this._idToElement.delete(id);

            const parentID = element.parentID;
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
                throw Error(
                  `Cannot remove node ${id} from parent ${parentID} because no matching node was found in the Store.`
                );
              }
              parentElement.children = parentElement.children.filter(
                childID => childID !== id
              );
            }

            this._adjustParentTreeWeight(parentElement, -element.weight);
            removedElementIDs.push(id);
          }
          break;
        }
        case TREE_OPERATION_REORDER_CHILDREN: {
          const id = ((operations[i + 1]: any): number);
          const numChildren = ((operations[i + 2]: any): number);
          const nextChildren = ((operations.slice(
            i + 3,
            i + 3 + numChildren
          ): any): Array<number>);

          i = i + 3 + numChildren;

          if (__DEBUG__) {
            debug('Re-order', `Node ${id} children ${nextChildren.join(',')}`);
          }

          if (!this._idToElement.has(id)) {
            throw Error(
              `Cannot reorder children for node ${id} because no matching node was found in the Store.`
            );
          }

          const element = ((this._idToElement.get(id): any): Element);
          const prevChildren = element.children;
          if (nextChildren.length !== prevChildren.length) {
            throw Error(
              `Children cannot be added or removed during a reorder operation.`
            );
          }
          // This check is more expensive so it's gated
          if (__DEV__) {
            if (
              nextChildren.find(childID => {
                const childElement = this._idToElement.get(childID);
                return childElement == null || childElement.parentID !== id;
              }) != null
            ) {
              console.error(
                `Children cannot be added or removed during a reorder operation.`
              );
            }
          }
          element.children = Array.from(nextChildren);

          if (!element.isCollapsed) {
            const prevWeight = element.weight;

            let nextWeight = element.type === ElementTypeRoot ? 0 : 1;

            nextChildren.forEach(childID => {
              const child = ((this._idToElement.get(childID): any): Element);
              nextWeight += child.isCollapsed ? 1 : child.weight;
            });

            element.weight = nextWeight;
            // TODO: passing null here is suspicious, but it's existing behavior.
            // It is suspicious because either we shouldn't need a delta at all--
            // or we should apply it to all parents, and not just this item.
            this._adjustParentTreeWeight(null, nextWeight - prevWeight);
          }
          break;
        }
        case TREE_OPERATION_UPDATE_TREE_BASE_DURATION:
          // Base duration updates are only sent while profiling is in progress.
          // We can ignore them at this point.
          // The profiler UI uses them lazily in order to generate the tree.
          i = i + 3;
          break;
        default:
          throw Error(`Unsupported Bridge operation ${operation}`);
      }
    }

    this._revision++;

    if (haveRootsChanged) {
      this._hasOwnerMetadata = false;
      this._supportsProfiling = false;
      this._rootIDToCapabilities.forEach(
        ({ hasOwnerMetadata, supportsProfiling }) => {
          if (hasOwnerMetadata) {
            this._hasOwnerMetadata = true;
          }
          if (supportsProfiling) {
            this._supportsProfiling = true;
          }
        }
      );

      this.emit('roots');
    }

    if (__DEBUG__) {
      console.log(this.__toSnapshot(true));
      console.groupEnd();
    }

    this.emit('mutated', [
      new Uint32Array(addedElementIDs),
      new Uint32Array(removedElementIDs),
    ]);
  };

  onProfilingStatus = (isProfiling: boolean) => {
    if (isProfiling) {
      this._importedProfilingData = null;
      this._profilingOperations = new Map();
      this._profilingScreenshots = new Map();
      this._profilingSnapshot = new Map();
      this.roots.forEach(this._takeProfilingSnapshotRecursive);
    }

    if (this._isProfiling !== isProfiling) {
      this._isProfiling = isProfiling;

      // Invalidate suspense cache if profiling data is being (re-)recorded.
      // Note that we clear again, in case any views read from the cache while profiling.
      // (That would have resolved a now-stale value without any profiling data.)
      this._profilingCache.invalidate();

      this.emit('isProfiling');
    }
  };

  onScreenshotCaptured = ({
    commitIndex,
    dataURL,
  }: {|
    commitIndex: number,
    dataURL: string,
  |}) => {
    this._profilingScreenshots.set(commitIndex, dataURL);
  };

  onBridgeShutdown = () => {
    if (__DEBUG__) {
      debug('onBridgeShutdown', 'unsubscribing from Bridge');
    }

    this._bridge.removeListener('operations', this.onBridgeOperations);
    this._bridge.removeListener('profilingStatus', this.onProfilingStatus);
    this._bridge.removeListener('shutdown', this.onBridgeShutdown);
  };

  // Used for Jest snapshot testing.
  // May also be useful for visually debugging the tree, so it lives on the Store.
  __toSnapshot = (includeWeight: boolean = false) => {
    const snapshotLines = [];

    let rootWeight = 0;

    this._roots.forEach(rootID => {
      const { weight } = ((this.getElementByID(rootID): any): Element);

      snapshotLines.push('[root]' + (includeWeight ? ` (${weight})` : ''));

      for (let i = rootWeight; i < rootWeight + weight; i++) {
        const element = ((this.getElementAtIndex(i): any): Element);

        if (element == null) {
          throw Error(`Could not find element at index ${i}`);
        }

        let prefix = ' ';
        if (element.children.length > 0) {
          prefix = element.isCollapsed ? '▸' : '▾';
        }

        let key = '';
        if (element.key !== null) {
          key = ` key="${element.key}"`;
        }

        let suffix = '';
        if (includeWeight) {
          suffix = ` (${element.isCollapsed ? 1 : element.weight})`;
        }

        snapshotLines.push(
          `${'  '.repeat(element.depth + 1)}${prefix} <${element.displayName ||
            'null'}${key}>${suffix}`
        );
      }

      rootWeight += weight;
    });

    // Make sure the pretty-printed test align with the Store's reported number of total rows.
    if (rootWeight !== this._weightAcrossRoots) {
      throw Error(
        `Inconsistent Store state. Individual root weights (${rootWeight}) do not match total weight (${
          this._weightAcrossRoots
        })`
      );
    }

    return snapshotLines.join('\n');
  };
}
