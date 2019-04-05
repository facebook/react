// @flow

import EventEmitter from 'events';
import {
  TREE_OPERATION_ADD,
  TREE_OPERATION_RECURSIVE_REMOVE_CHILDREN,
  TREE_OPERATION_REMOVE,
  TREE_OPERATION_RESET_CHILDREN,
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

type Config = {|
  isProfiling?: boolean,
  supportsCaptureScreenshots?: boolean,
  supportsFileDownloads?: boolean,
  supportsReloadAndProfile?: boolean,
  supportsProfiling?: boolean,
|};

export type Capabilities = {|
  supportsProfiling: boolean,
|};

/**
 * The store is the single source of truth for updates from the backend.
 * ContextProviders can subscribe to the Store for specific things they want to provide.
 */
export default class Store extends EventEmitter {
  _bridge: Bridge;

  _captureScreenshots: boolean = false;

  // Map of ID to Element.
  // Elements are mutable (for now) to avoid excessive cloning during tree updates.
  _idToElement: Map<number, Element> = new Map();

  // The user has imported a previously exported profiling session.
  _importedProfilingData: ImportedProfilingData | null = null;

  // The backend is currently profiling.
  // When profiling is in progress, operations are stored so that we can later reconstruct past commit trees.
  _isProfiling: boolean = false;

  // Total number of visible elements (within all roots).
  // Used for windowing purposes.
  _numElements: number = 0;

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

  constructor(bridge: Bridge, config?: Config) {
    super();

    if (__DEBUG__) {
      debug('constructor', 'subscribing to Bridge');
    }

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
          localStorage.getItem(LOCAL_STORAGE_CAPTURE_SCREENSHOTS_KEY) !==
          'false';
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
    return this._numElements;
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
    const firstChildID = ((root: any): Element).children[0];
    let currentElement = ((this._idToElement.get(firstChildID): any): Element);
    let currentWeight = rootWeight;
    while (index !== currentWeight) {
      for (let i = 0; i < currentElement.children.length; i++) {
        const childID = currentElement.children[i];
        const child = ((this._idToElement.get(childID): any): Element);
        const { weight } = child;
        if (index <= currentWeight + weight) {
          currentWeight++;
          currentElement = child;
          break;
        } else {
          currentWeight += weight;
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
        index += child.weight;
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

    // Invalidate suspense cache if profiling data is being (re-)recorded.
    // Note that we clear now because any existing data is "stale".
    this._profilingCache.invalidate();

    this._isProfiling = false;
    this.emit('isProfiling');
  }

  stopProfiling(): void {
    this._bridge.send('stopProfiling');

    // Invalidate suspense cache if profiling data is being (re-)recorded.
    // Note that we clear again, in case any views read from the cache while profiling.
    // (That would have resolved a now-stale value without any profiling data.)
    this._profilingCache.invalidate();

    this._isProfiling = false;
    this.emit('isProfiling');
  }

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

  onBridgeOperations = (operations: Uint32Array) => {
    if (!(operations instanceof Uint32Array)) {
      // $FlowFixMe TODO HACK Temporary workaround for the fact that Chrome is not transferring the typed array.
      operations = Uint32Array.from(Object.values(operations));
    }

    if (__DEBUG__) {
      debug('onBridgeOperations', operations);
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

      const commitIndex = profilingOperations.length - 1;

      if (this._captureScreenshots) {
        this._bridge.send('captureScreenshot', { commitIndex });
      }
    }

    let addedElementIDs: Uint32Array = new Uint32Array(0);
    let removedElementIDs: Uint32Array = new Uint32Array(0);

    let i = 2;
    while (i < operations.length) {
      let id: number = ((null: any): number);
      let element: Element = ((null: any): Element);
      let ownerID: number = 0;
      let parentID: number = ((null: any): number);
      let parentElement: Element = ((null: any): Element);
      let type: ElementType = ((null: any): ElementType);
      let weightDelta: number = 0;

      const operation = operations[i];

      switch (operation) {
        case TREE_OPERATION_ADD:
          id = ((operations[i + 1]: any): number);
          type = ((operations[i + 2]: any): ElementType);

          i = i + 3;

          if (this._idToElement.has(id)) {
            throw new Error(
              'Store already contains fiber ' +
                id +
                '. This is a bug in React DevTools.'
            );
          }

          if (type === ElementTypeRoot) {
            if (__DEBUG__) {
              debug('Add', `new root fiber ${id}`);
            }

            const supportsProfiling = operations[i] > 0;
            i++;

            this._roots = this._roots.concat(id);
            this._rootIDToRendererID.set(id, rendererID);
            this._rootIDToCapabilities.set(id, { supportsProfiling });

            this._idToElement.set(id, {
              children: [],
              depth: -1,
              displayName: null,
              id,
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
                `fiber ${id} (${displayName || 'null'}) as child of ${parentID}`
              );
            }

            parentElement = ((this._idToElement.get(parentID): any): Element);
            parentElement.children = parentElement.children.concat(id);

            const element: Element = {
              children: [],
              depth: parentElement.depth + 1,
              displayName,
              id,
              key,
              ownerID,
              parentID: parentElement.id,
              type,
              weight: 1,
            };

            this._idToElement.set(id, element);

            const oldAddedElementIDs = addedElementIDs;
            addedElementIDs = new Uint32Array(addedElementIDs.length + 1);
            addedElementIDs.set(oldAddedElementIDs);
            addedElementIDs[oldAddedElementIDs.length] = id;

            weightDelta = 1;
          }
          break;
        case TREE_OPERATION_RECURSIVE_REMOVE_CHILDREN: {
          id = ((operations[i + 1]: any): number);

          if (!this._idToElement.has(id)) {
            throw new Error(
              'Store does not contain fiber ' +
                id +
                '. This is a bug in React DevTools.'
            );
          }

          i = i + 2;

          let justRemovedIDs = [];
          const recursivelyRemove = childID => {
            justRemovedIDs.push(childID);
            const child = this._idToElement.get(childID);
            if (!child) {
              throw new Error(
                'Store does not contain fiber ' +
                  childID +
                  '. This is a bug in React DevTools.'
              );
            }
            this._idToElement.delete(childID);
            child.children.forEach(recursivelyRemove);
          };

          // Track removed items so search results can be updated
          const oldRemovedElementIDs = removedElementIDs;
          removedElementIDs = new Uint32Array(
            removedElementIDs.length + justRemovedIDs.length
          );
          removedElementIDs.set(oldRemovedElementIDs);
          let startIndex = oldRemovedElementIDs.length;
          for (let j = 0; j < justRemovedIDs.length; j++) {
            removedElementIDs[startIndex + j] = oldRemovedElementIDs[j];
          }

          parentElement = ((this._idToElement.get(id): any): Element);
          parentElement.children.forEach(recursivelyRemove);
          parentElement.children = [];
          weightDelta = -parentElement.weight + 1;
          break;
        }
        case TREE_OPERATION_REMOVE: {
          id = ((operations[i + 1]: any): number);

          if (!this._idToElement.has(id)) {
            throw new Error(
              'Store does not contain fiber ' +
                id +
                '. This is a bug in React DevTools.'
            );
          }

          i = i + 2;

          element = ((this._idToElement.get(id): any): Element);
          parentID = element.parentID;

          weightDelta = -element.weight;

          this._idToElement.delete(id);

          parentElement = ((this._idToElement.get(parentID): any): Element);
          if (parentElement == null) {
            if (__DEBUG__) {
              debug('Remove', `fiber ${id} root`);
            }

            this._roots = this._roots.filter(rootID => rootID !== id);
            this._rootIDToRendererID.delete(id);
            this._rootIDToCapabilities.delete(id);

            haveRootsChanged = true;
          } else {
            if (__DEBUG__) {
              debug('Remove', `fiber ${id} from parent ${parentID}`);
            }

            parentElement.children = parentElement.children.filter(
              childID => childID !== id
            );
          }

          // Track removed items so search results can be updated
          const oldRemovedElementIDs = removedElementIDs;
          removedElementIDs = new Uint32Array(removedElementIDs.length + 1);
          removedElementIDs.set(oldRemovedElementIDs);
          removedElementIDs[oldRemovedElementIDs.length] = id;
          break;
        }
        case TREE_OPERATION_RESET_CHILDREN:
          id = ((operations[i + 1]: any): number);
          const numChildren = ((operations[i + 2]: any): number);
          const children = ((operations.slice(
            i + 3,
            i + 3 + numChildren
          ): any): Array<number>);

          i = i + 3 + numChildren;

          if (__DEBUG__) {
            debug('Re-order', `fiber ${id} children ${children.join(',')}`);
          }

          element = ((this._idToElement.get(id): any): Element);
          element.children = Array.from(children);

          const prevWeight = element.weight;
          let childWeight = 0;

          children.forEach(childID => {
            const child = ((this._idToElement.get(childID): any): Element);
            childWeight += child.weight;
          });

          element.weight = childWeight + 1;

          weightDelta = childWeight + 1 - prevWeight;
          break;
        case TREE_OPERATION_UPDATE_TREE_BASE_DURATION:
          // Base duration updates are only sent while profiling is in progress.
          // We can ignore them at this point.
          // The profiler UI uses them lazily in order to generate the tree.
          i = i + 3;
          break;
        default:
          throw Error(`Unsupported Bridge operation ${operation}`);
      }

      this._numElements += weightDelta;

      while (parentElement != null) {
        parentElement.weight += weightDelta;
        parentElement = ((this._idToElement.get(
          parentElement.parentID
        ): any): Element);
      }
    }

    this._revision++;

    if (haveRootsChanged) {
      this._supportsProfiling = false;
      this._rootIDToCapabilities.forEach(({ supportsProfiling }) => {
        if (supportsProfiling) {
          this._supportsProfiling = true;
        }
      });

      this.emit('roots');
    }

    this.emit('mutated', [addedElementIDs, removedElementIDs]);
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

  // DEBUG
  __printTree = () => {
    if (__DEBUG__) {
      console.group('__printTree()');
      this._roots.forEach((rootID: number) => {
        const printElement = (id: number) => {
          const element = ((this._idToElement.get(id): any): Element);
          console.log(
            `${'•'.repeat(element.depth)}${element.id}:${element.displayName ||
              ''} ${element.key ? `key:"${element.key}"` : ''} (${
              element.weight
            })`
          );
          element.children.forEach(printElement);
        };
        const root = ((this._idToElement.get(rootID): any): Element);
        console.group(`${rootID}:root (${root.weight})`);
        root.children.forEach(printElement);
        console.groupEnd();
      });
      console.group(`List of ${this.numElements} elements`);
      for (let i = 0; i < this.numElements; i++) {
        //if (i === 4) { debugger }
        const element = this.getElementAtIndex(i);
        if (element != null) {
          console.log(
            `${'•'.repeat(element.depth)}${i}: ${element.displayName ||
              'Unknown'}`
          );
        }
      }
      console.groupEnd();
      console.groupEnd();
    }
  };
}
