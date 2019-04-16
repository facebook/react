// @flow

import LRU from 'lru-cache';
import {
  TREE_OPERATION_ADD,
  TREE_OPERATION_REMOVE,
  TREE_OPERATION_RESET_CHILDREN,
  TREE_OPERATION_RECURSIVE_REMOVE_CHILDREN,
  TREE_OPERATION_UPDATE_TREE_BASE_DURATION,
} from './constants';
import { ElementTypeRoot } from 'src/devtools/types';

import type { ElementType } from 'src/devtools/types';

const FB_MODULE_RE = /^(.*) \[from (.*)\]$/;
const cachedDisplayNames: WeakMap<Function, string> = new WeakMap();

// On large trees, encoding takes significant time.
// Try to reuse the already encoded strings.
let encodedStringCache = new LRU({ max: 1000 });

export function getDisplayName(
  type: Function,
  fallbackName: string = 'Unknown'
): string {
  const nameFromCache = cachedDisplayNames.get(type);
  if (nameFromCache != null) {
    return nameFromCache;
  }

  let displayName;

  // The displayName property is not guaranteed to be a string.
  // It's only safe to use for our purposes if it's a string.
  // github.com/facebook/react-devtools/issues/803
  if (typeof type.displayName === 'string') {
    displayName = type.displayName;
  }

  if (!displayName) {
    displayName = type.name || fallbackName;
  }

  // Facebook-specific hack to turn "Image [from Image.react]" into just "Image".
  // We need displayName with module name for error reports but it clutters the DevTools.
  const match = displayName.match(FB_MODULE_RE);
  if (match) {
    const componentName = match[1];
    const moduleName = match[2];
    if (componentName && moduleName) {
      if (
        moduleName === componentName ||
        moduleName.startsWith(componentName + '.')
      ) {
        displayName = componentName;
      }
    }
  }

  cachedDisplayNames.set(type, displayName);
  return displayName;
}

let uidCounter: number = 0;

export function getUID(): number {
  return ++uidCounter;
}

export function utfDecodeString(array: Uint32Array): string {
  return String.fromCodePoint(...array);
}

export function utfEncodeString(string: string): Uint32Array {
  let cached = encodedStringCache.get(string);
  if (cached !== undefined) {
    return cached;
  }

  // $FlowFixMe Flow's Uint32Array.from's type definition is wrong; first argument of mapFn will be string
  const encoded = Uint32Array.from(string, toCodePoint);
  encodedStringCache.set(string, encoded);
  return encoded;
}

function toCodePoint(string: string) {
  return string.codePointAt(0);
}

export function operationsArrayToString(operations: Uint32Array) {
  const rendererID = operations[0];
  const rootID = operations[1];

  console.group('rendererID:', rendererID, 'rootID:', rootID);

  let i = 2;
  while (i < operations.length) {
    let id: number = ((null: any): number);
    let parentID: number = ((null: any): number);
    let type: ElementType = ((null: any): ElementType);

    const operation = operations[i];

    switch (operation) {
      case TREE_OPERATION_ADD:
        id = ((operations[i + 1]: any): number);
        type = ((operations[i + 2]: any): ElementType);

        i = i + 3;

        if (type === ElementTypeRoot) {
          console.log(`Add root fiber ${id}`);

          i++; // supportsProfiling
          i++; // hasOwnerMetadata
        } else {
          parentID = ((operations[i]: any): number);
          i++;

          i++; // ownerID

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
          i += +keyLength;

          console.log(
            `Add fiber ${id} (${displayName || 'null'}) as child of ${parentID}`
          );
        }
        break;
      case TREE_OPERATION_RECURSIVE_REMOVE_CHILDREN: {
        id = ((operations[i + 1]: any): number);

        i = i + 2;

        console.log(`Recursively remove children from fiber ${id}`);
        break;
      }
      case TREE_OPERATION_REMOVE: {
        id = ((operations[i + 1]: any): number);

        i = i + 2;

        console.log(`Remove fiber ${id}`);
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

        console.log(`Re-order fiber ${id} children ${children.join(',')}`);
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
  }

  console.groupEnd();
}
