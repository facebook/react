// @flow

import LRU from 'lru-cache';
import {
  TREE_OPERATION_ADD,
  TREE_OPERATION_REMOVE,
  TREE_OPERATION_REORDER_CHILDREN,
  TREE_OPERATION_UPDATE_TREE_BASE_DURATION,
} from './constants';
import { ElementTypeRoot } from 'src/types';
import { LOCAL_STORAGE_FILTER_PREFERENCES_KEY } from './constants';
import { ComponentFilterElementType, ElementTypeHostComponent } from './types';

import type { ElementType } from 'src/types';
import type { ComponentFilter } from './types';

const FB_MODULE_RE = /^(.*) \[from (.*)\]$/;
const cachedDisplayNames: WeakMap<Function, string> = new WeakMap();

// On large trees, encoding takes significant time.
// Try to reuse the already encoded strings.
let encodedStringCache = new LRU({ max: 1000 });

export function getDisplayName(
  type: Function,
  fallbackName: string = 'Anonymous'
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

export function printOperationsArray(operations: Uint32Array) {
  // The first two values are always rendererID and rootID
  const rendererID = operations[0];
  const rootID = operations[1];

  const logs = [`opertions for renderer:${rendererID} and root:${rootID}`];

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
      (operations.slice(i, i + nextLength): any)
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

        if (type === ElementTypeRoot) {
          logs.push(`Add new root node ${id}`);

          i++; // supportsProfiling
          i++; // hasOwnerMetadata
        } else {
          const parentID = ((operations[i]: any): number);
          i++;

          i++; // ownerID

          const displayNameStringID = operations[i];
          const displayName = stringTable[displayNameStringID];
          i++;

          i++; // key

          logs.push(
            `Add node ${id} (${displayName || 'null'}) as child of ${parentID}`
          );
        }
        break;
      }
      case TREE_OPERATION_REMOVE: {
        const removeLength = ((operations[i + 1]: any): number);
        i += 2;

        for (let removeIndex = 0; removeIndex < removeLength; removeIndex++) {
          const id = ((operations[i]: any): number);
          i += 1;

          logs.push(`Remove node ${id}`);
        }
        break;
      }
      case TREE_OPERATION_REORDER_CHILDREN: {
        const id = ((operations[i + 1]: any): number);
        const numChildren = ((operations[i + 2]: any): number);
        i += 3;
        const children = operations.slice(i, i + numChildren);
        i += numChildren;

        logs.push(`Re-order node ${id} children ${children.join(',')}`);
        break;
      }
      case TREE_OPERATION_UPDATE_TREE_BASE_DURATION:
        // Base duration updates are only sent while profiling is in progress.
        // We can ignore them at this point.
        // The profiler UI uses them lazily in order to generate the tree.
        i += 3;
        break;
      default:
        throw Error(`Unsupported Bridge operation ${operation}`);
    }
  }

  console.log(logs.join('\n  '));
}

export function getDefaultComponentFilters(): Array<ComponentFilter> {
  return [
    {
      type: ComponentFilterElementType,
      value: ElementTypeHostComponent,
      isEnabled: true,
    },
  ];
}

export function getSavedComponentFilters(): Array<ComponentFilter> {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_FILTER_PREFERENCES_KEY);
    if (raw != null) {
      return JSON.parse(raw);
    }
  } catch (error) {}
  return getDefaultComponentFilters();
}

export function saveComponentFilters(
  componentFilters: Array<ComponentFilter>
): void {
  localStorage.setItem(
    LOCAL_STORAGE_FILTER_PREFERENCES_KEY,
    JSON.stringify(componentFilters)
  );
}
