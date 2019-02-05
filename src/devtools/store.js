// @flow

import EventEmitter from 'events';
import {
  TREE_OPERATION_ADD,
  TREE_OPERATION_REMOVE,
  TREE_OPERATION_RESET_CHILDREN,
} from '../constants';
import { utfDecodeString } from '../utils';
import { __DEBUG__ } from '../constants';

import type { Element, ElementType } from './types';
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

/**
 * The store is the single source of truth for updates from the backend.
 * ContextProviders can subscribe to the Store for specific things they want to provide.
 */
export default class Store extends EventEmitter {
  // TODO Should items in this map be read-only/immutable for easier props comparison?
  //      We currently mutate "children" and "weight" props.
  _idToElement: Map<number, Element> = new Map();

  // Total number of visible elements (within all roots).
  // Used for windowing purposes.
  _numElements: number = 0;

  // This Array must be treated as immutable!
  // Passive effects will check it for changes between render and mount.
  _roots: $ReadOnlyArray<number> = [];

  // Renderer ID is needed to support inspection fiber props, state, and hooks.
  _rootIDToRendererID: Map<number, number> = new Map();

  constructor(bridge: Bridge) {
    super();

    debug('constructor', 'subscribing to Bridge');

    bridge.on('operations', this.onBridgeOperations);
    bridge.on('rootCommitted', this.onBridgeRootCommitted);
  }

  get numElements(): number {
    return this._numElements;
  }

  get roots(): $ReadOnlyArray<number> {
    return this._roots;
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
      if (rootWeight + root.weight > index) {
        break;
      } else {
        rootWeight += root.weight;
      }
    }

    // Find the element in the tree using the weight of each node...
    // Skip over the root itself, because roots aren't visible in the Elements tree.
    const firstChildID = ((root: any): Element).children[0];
    let currentElement = ((this._idToElement.get(firstChildID): any): Element);
    let currentWeight = 0;
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

    return ((currentElement: any): Element);
  }

  getElementByID(id: number): Element | null {
    const element = this._idToElement.get(id);

    if (element == null) {
      console.warn(`No element found with id "${id}`);

      return null;
    }

    return element;
  }

  getIndexOfElementID(id: number): number | null {
    const element = this.getElementByID(id);

    if (element === null) {
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

  onBridgeOperations = (operations: Uint32Array) => {
    if (!(operations instanceof Uint32Array)) {
      // $FlowFixMe TODO HACK Temporary workaround for the fact that Chrome is not transferring the typed array.
      operations = Uint32Array.from(Object.values(operations));
    }

    debug('onBridgeOperations', operations);

    let haveRootsChanged = false;

    const rendererID = operations[0];

    let i = 1;
    while (i < operations.length) {
      let id: number = ((null: any): number);
      let element: Element = ((null: any): Element);
      let parentID: number = ((null: any): number);
      let parentElement: Element = ((null: any): Element);
      let type: ElementType = ((null: any): ElementType);
      let weightDelta: number = 0;

      const operation = operations[i];

      switch (operation) {
        case TREE_OPERATION_ADD:
          id = ((operations[i + 1]: any): number);
          type = ((operations[i + 2]: any): ElementType);
          parentID = ((operations[i + 3]: any): number);

          i = i + 4;

          if (parentID === 0) {
            debug('Add', `new root fiber ${id}`);

            this._roots = this._roots.concat(id);
            this._rootIDToRendererID.set(id, rendererID);

            this._idToElement.set(id, {
              children: [],
              depth: -1,
              displayName: null,
              id,
              key: null,
              parentID: 0,
              type,
              weight: 0,
            });

            haveRootsChanged = true;
          } else {
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

            debug(
              'Add',
              `fiber ${id} (${displayName || 'null'}) as child of ${parentID}`
            );

            if (this._idToElement.has(id)) {
              // The renderer's tree walking approach sometimes mounts the same Fiber twice with Suspense and Lazy.
              // For now, we avoid adding it to the tree twice by checking if it's already been mounted.
              // Maybe in the future we'll revisit this.
            } else {
              parentElement = ((this._idToElement.get(parentID): any): Element);
              parentElement.children = parentElement.children.concat(id);

              const element: Element = {
                children: [],
                depth: parentElement.depth + 1,
                displayName,
                id,
                key,
                parentID: parentElement.id,
                type,
                weight: 1,
              };

              this._idToElement.set(id, element);

              this.emit('elementAdded', element);

              weightDelta = 1;
            }
          }
          break;
        case TREE_OPERATION_REMOVE:
          id = ((operations[i + 1]: any): number);

          i = i + 2;

          debug('Remove', `fiber ${id} from tree`);

          element = ((this._idToElement.get(id): any): Element);
          parentID = element.parentID;

          weightDelta = -element.weight;

          this._idToElement.delete(id);

          parentElement = ((this._idToElement.get(parentID): any): Element);
          if (parentElement == null) {
            this._roots = this._roots.filter(rootID => rootID !== id);
            this._rootIDToRendererID.delete(id);
          } else {
            parentElement.children = parentElement.children.filter(
              childID => childID !== id
            );
          }

          this.emit('elementRemoved', element);
          break;
        case TREE_OPERATION_RESET_CHILDREN:
          id = ((operations[i + 1]: any): number);
          const numChildren = ((operations[i + 2]: any): number);
          const children = ((operations.slice(
            i + 3,
            i + 3 + numChildren
          ): any): Array<number>);

          i = i + 3 + numChildren;

          debug('Re-order', `fiber ${id} children ${children.join(',')}`);

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

    if (haveRootsChanged) {
      this.emit('roots');
    }
  };

  onBridgeRootCommitted = (rootID: number) => {
    debug('onBridgeRootCommitted', rootID);

    this.emit('rootCommitted');

    // this.__printTree(rootID);
  };

  // DEBUG
  __printTree = (rootID: number) => {
    const printElement = (id: number) => {
      const element = ((this._idToElement.get(id): any): Element);
      console.log(
        `${'•'.repeat(element.depth)}${element.id}:${element.displayName ||
          ''}${element.key ? `key:"${element.key}"` : ''} (${element.weight})`
      );
      element.children.forEach(printElement);
    };
    const root = ((this._idToElement.get(rootID): any): Element);
    console.log('printing root:', rootID);
    root.children.forEach(printElement);
  };
}
