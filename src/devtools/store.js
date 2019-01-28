// @flow

import EventEmitter from 'events';

import type { Element, ElementTreeMetadata } from './types';
import type { Bridge } from '../types';

const debug = (methodName, ...args) => {
  console.log(`%cStore %c${methodName}`, 'color: red; font-weight: bold;', 'font-weight: bold;', ...args);
};

/**
 * The store is the single source of truth for updates from the backend.
 * ContextProviders can subscribe to the Store for specific things they want to provide.
 */
class Store extends EventEmitter {
  _elementToElementTreeMetadata: WeakMap<
    Element,
    ElementTreeMetadata
  > = new WeakMap();
  _idToElement: Map<string, Element> = new Map();
  _idToParentID: Map<string, string> = new Map();
  _pendingDeletions: Set<string> = new Set();

  // Total number of visible elements (within all roots).
  // Used for windowing purposes.
  numElements: number = 0;

  // This Array must be treated as immutable!
  // Passive effects will check it for changes between render and mount.
  roots: $ReadOnlyArray<string> = [];

  constructor(bridge: Bridge) {
    super();

    bridge.on('root', this.onBridgeRoot);
    bridge.on('rootCommitted', this.onBridgeRootCommitted);

    bridge.on('mount', this.onBridgeMount);
    bridge.on('update', this.onBridgeUpdated);
    bridge.on('unmount', this.onBridgeUnmounted);
  }

  getElementAtIndex(index: number): Element | null {
    if (index < 0 || index >= this.numElements) {
      return null;
    }

    let rootID;
    let root;

    let rootWeight = 0;
    for (let i = 0; i < this.roots.length; i++) {
      rootID = this.roots[i];
      root = this._idToElement.get(rootID);
      const { weight } = this._elementToElementTreeMetadata.get(root);

      if (rootWeight + weight > index) {
        break;
      }
    }

    let currentElement = root;
    let currentWeight = 0;

    while (index !== currentWeight) {
      for (let i = 0; i < currentElement.children.length; i++) {
        const childID = currentElement.children[i];
        const child = this._idToElement.get(childID);
        const { weight } = this._elementToElementTreeMetadata.get(child);
        if (index <= currentWeight + weight) {
          currentWeight++;
          currentElement = child;
          break;
        } else {
          currentWeight += weight;
        }
      }
    }

    return currentElement;
  }

  getElementByID(id: string) {
    return this._idToElement.get(id);
  }

  geParent(id: string) {
    return this._idToParentID.get(id);
  }

  getTreeMetadataForElement(element: Element) {
    return this._elementToElementTreeMetadata.get(element);
  }

  _crawlForTreeMetadata(id: string, depth: number = 0): number {
    let weight = 1;

    const element = this._idToElement.get(id);

    // TODO: Figure out why sometimes items aren't being sent across the bridge.
    // It always seems to be one of the ListItems...
    if (element == null) {
      console.log(`%cNo element found for id "${id}"`, 'background-color: yellow; font-weight: bold;');
      return 0;
    }

    element.children.forEach(childID => {
      weight += this._crawlForTreeMetadata(childID, depth + 1);
    });

    this._elementToElementTreeMetadata.set(element, {
      depth,
      weight,
    });

    return weight;
  }

  _updateElementTreeMetadata(prevElement: Element, element: Element): void {
    if (prevElement.children === element.children) {
      return;
    }

    // Compare children in case they have changed.
    // For each child that was removed, we need to shrink the list by this many elements.
    // For each child that was added, we need to grow the list by this many elements.

    const prevChildren = prevElement.children;
    const prevNumChildren = prevChildren.length;

    const children = element.children;
    const numChildren = children.length;

    // TODO: The below diffing could be optimized more.

    // Scan for deletions
    for (let i = 0; i < prevNumChildren; i++) {
      const childID = prevChildren[i];
      if (!children.includes(childID)) {
        const child = this._idToElement.get(childID);
        const { weight } = this._elementToElementTreeMetadata.get(child);

        this.numElements -= weight;

        let current = element;
        while (current !== null) {
          const datum = this._elementToElementTreeMetadata.get(current);
          datum.weight -= weight;

          const parent = this._idToElement.get(datum.parentID);
          current =
            parent != null
              ? this._elementToElementTreeMetadata.get(parent)
              : null;
        }
      }
    }

    // Scan for additions
    for (let i = 0; i < numChildren; i++) {
      const childID = children[i];
      if (!prevChildren.includes(childID)) {
        const child = this._idToElement.get(childID);
        const { depth } = this._elementToElementTreeMetadata.get(element);
        const weight = this._crawlForTreeMetadata(
          childID,
          depth + 1
        );

        this.numElements += weight;

        let current = element;
        while (current !== null) {
          const datum = this._elementToElementTreeMetadata.get(current);
          datum.weight += weight;

          const parent = this._idToElement.get(datum.parentID);
          current =
            parent != null
              ? this._elementToElementTreeMetadata.get(parent)
              : null;
        }
      }
    }
  }

__printTree() {
  let i = 0;
  this.roots.forEach(rootID => {
    const root = this._idToElement.get(rootID);
    const { weight } = this._elementToElementTreeMetadata.get(root);
    for (let j = i; j < i  + weight; j++) {
      const element = this.getElementAtIndex(j)
      const { depth } = this._elementToElementTreeMetadata.get(element);

      console.log('  '.repeat(depth) + element.displayName);
    }
    i += weight;
  });
}

  onBridgeMount = (element: Element) => {
    const { id } = element;
    debug('onBridgeMount()', element);
    this._idToElement.set(id, element);

    element.children.forEach(childID => {
      this._idToParentID.set(childID, id);
    });

    this.emit(id);
  };

  onBridgeRoot = (id: string) => {
    debug('onBridgeRoot()', id);
    if (!this.roots.includes(id)) {
      this.roots = this.roots.concat(id);

      // Generate tree metadata used for windowing.
      this.numElements += this._crawlForTreeMetadata(id);

      this.emit('roots');
    }
  };

  onBridgeRootCommitted = (rootID: string) => {
    this._pendingDeletions.forEach(id => {
      this._idToElement.delete(id);

      if (this._idToParentID.has(id)) {
        this._idToParentID.delete(id);
      }
    });
    this._pendingDeletions.clear();

    debug('onBridgeRootCommitted()', rootID);
    this.emit('rootCommitted', rootID);

this.__printTree();
  };

  // TODO: Unmounting removes id-to-element before crawling, which breaks it.
  // Should I just ditch the idea of a WeakMap in favor of an explicit it-to-metadata mapping like with parents?
  onBridgeUnmounted = (id: string) => {
    debug('onBridgeUnmounted()', id);
    this._pendingDeletions.add(id);

    const index = this.roots.indexOf(id);
    if (index >= 0) {
      this.roots = this.roots
        .slice(0, index)
        .concat(this.roots.slice(index + 1));

      const root = this._idToElement.get(id);
      const {weight} = this._elementToElementTreeMetadata.get(root);

      this.numElements -= weight;

      this.emit('roots');
    }
  };

  onBridgeUpdated = (element: Element) => {
    const { id } = element;
    debug('onBridgeUpdated()', element);

    const prevElement = ((this._idToElement.get(id): any): Element);
    const prevElementTreeMetadata = ((this._elementToElementTreeMetadata.get(prevElement): any): ElementTreeMetadata);

    this._idToElement.set(id, element);
    this._elementToElementTreeMetadata.set(
      element,
      prevElementTreeMetadata
    );

    // Update tree metadata used for windowing.
    this._updateElementTreeMetadata(prevElement, element);

    this.emit(id);
  };
}

export default Store;
