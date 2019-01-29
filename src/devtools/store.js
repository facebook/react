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
  // TODO Should items in this map be read-only for easier props comparison?
  _idToElement: Map<number, Element> = new Map();

  // Total number of visible elements (within all roots).
  // Used for windowing purposes.
  _numElements: number = 0;

  // This Array must be treated as immutable!
  // Passive effects will check it for changes between render and mount.
  _roots: $ReadOnlyArray<number> = [];

  constructor(bridge: Bridge) {
    super();

    bridge.on('operations', this.onBridgeOperations);
    bridge.on('rootCommitted', this.onBridgeRootCommitted);
  }

  get numElements(): number {
    return this._numElements;
  }

  get roots(): $ReadOnlyArray<number> {
    return this._roots;
  }

  getElementAtIndex(index: number): Element {
    if (index < 0 || index >= this.numElements) {
      throw Error(`Invalid index ${index} specified`);
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

    // Crawl the tree to find the correct root...
    let currentElement = ((root: any): Element);
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

  getElementByID(id: number): Element {
    const element = this._idToElement.get(id);

    if (element == null) {
      throw Error(`No element found with id "${id}`);
    }

    return ((element: any): Element);
  }

  onBridgeOperations = (operations: Uint32Array) => {
    if (!(operations instanceof Uint32Array)) {
      // $FlowFixMe TODO HACK Temporary workaround for the fact that Chrome is not transferring the typed array.
      operations = Uint32Array.from(Object.values(operations));
    }

    debug('onBridgeOperations', operations);

    let haveRootsChanged = false;

    let i = 0;
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

            this._idToElement.set(id, {
              children: [],
              depth: 0,
              displayName: null,
              id,
              key: null,
              parentID: 0,
              type,
              weight: 1,
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

            debug('Add', `fiber ${id}, type ${type}, as child of ${parentID}`);

            // TODO Fix this; there should not be duplicate "ADD" operations for a given element.
            if (this._idToElement.has(id)) {
              console.warn(
                `fiber ${id}, type ${type}, already added as child of ${parentID}`
              );
            } else {
              parentElement = ((this._idToElement.get(parentID): any): Element);
              parentElement.children = parentElement.children.concat(id);

              this._idToElement.set(id, {
                children: [],
                depth: parentElement.depth + 1,
                displayName,
                id,
                key,
                parentID: parentElement.id,
                type,
                weight: 1,
              });

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
          if (parentElement != null) {
            parentElement.children = parentElement.children.filter(
              childID => childID !== id
            );
          }
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
          element.children = children;

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
        `${'  '.repeat(element.depth)}${element.id}:${element.displayName ||
          ''}${element.key ? `key:"${element.key}"` : ''} (${element.weight})`
      );
      element.children.forEach(printElement);
    };
    const root = ((this._idToElement.get(rootID): any): Element);
    console.log('printing root:', rootID);
    root.children.forEach(printElement);
  };
}
