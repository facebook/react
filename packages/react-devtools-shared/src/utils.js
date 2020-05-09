/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import LRU from 'lru-cache';
import {
  isElement,
  typeOf,
  ContextConsumer,
  ContextProvider,
  ForwardRef,
  Fragment,
  Lazy,
  Memo,
  Portal,
  Profiler,
  StrictMode,
  Suspense,
} from 'react-is';
import {
  TREE_OPERATION_ADD,
  TREE_OPERATION_REMOVE,
  TREE_OPERATION_REORDER_CHILDREN,
  TREE_OPERATION_UPDATE_TREE_BASE_DURATION,
} from './constants';
import {ElementTypeRoot} from 'react-devtools-shared/src/types';
import {
  LOCAL_STORAGE_FILTER_PREFERENCES_KEY,
  LOCAL_STORAGE_SHOULD_PATCH_CONSOLE_KEY,
} from './constants';
import {ComponentFilterElementType, ElementTypeHostComponent} from './types';
import {
  ElementTypeClass,
  ElementTypeForwardRef,
  ElementTypeFunction,
  ElementTypeMemo,
} from 'react-devtools-shared/src/types';
import {localStorageGetItem, localStorageSetItem} from './storage';
import {meta} from './hydration';

import type {ComponentFilter, ElementType} from './types';

const cachedDisplayNames: WeakMap<Function, string> = new WeakMap();

// On large trees, encoding takes significant time.
// Try to reuse the already encoded strings.
const encodedStringCache = new LRU({max: 1000});

export function alphaSortKeys(a: string, b: string): number {
  if (a > b) {
    return 1;
  } else if (b > a) {
    return -1;
  } else {
    return 0;
  }
}

export function getDisplayName(
  type: Function,
  fallbackName: string = 'Anonymous',
): string {
  const nameFromCache = cachedDisplayNames.get(type);
  if (nameFromCache != null) {
    return nameFromCache;
  }

  let displayName = fallbackName;

  // The displayName property is not guaranteed to be a string.
  // It's only safe to use for our purposes if it's a string.
  // github.com/facebook/react-devtools/issues/803
  if (typeof type.displayName === 'string') {
    displayName = type.displayName;
  } else if (typeof type.name === 'string' && type.name !== '') {
    displayName = type.name;
  }

  cachedDisplayNames.set(type, displayName);
  return displayName;
}

let uidCounter: number = 0;

export function getUID(): number {
  return ++uidCounter;
}

export function utfDecodeString(array: Array<number>): string {
  return String.fromCodePoint(...array);
}

export function utfEncodeString(string: string): Array<number> {
  const cached = encodedStringCache.get(string);
  if (cached !== undefined) {
    return cached;
  }

  const encoded = new Array(string.length);
  for (let i = 0; i < string.length; i++) {
    encoded[i] = string.codePointAt(i);
  }
  encodedStringCache.set(string, encoded);
  return encoded;
}

export function printOperationsArray(operations: Array<number>) {
  // The first two values are always rendererID and rootID
  const rendererID = operations[0];
  const rootID = operations[1];

  const logs = [`operations for renderer:${rendererID} and root:${rootID}`];

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
            `Add node ${id} (${displayName || 'null'}) as child of ${parentID}`,
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
    const raw = localStorageGetItem(LOCAL_STORAGE_FILTER_PREFERENCES_KEY);
    if (raw != null) {
      return JSON.parse(raw);
    }
  } catch (error) {}
  return getDefaultComponentFilters();
}

export function saveComponentFilters(
  componentFilters: Array<ComponentFilter>,
): void {
  localStorageSetItem(
    LOCAL_STORAGE_FILTER_PREFERENCES_KEY,
    JSON.stringify(componentFilters),
  );
}

export function getAppendComponentStack(): boolean {
  try {
    const raw = localStorageGetItem(LOCAL_STORAGE_SHOULD_PATCH_CONSOLE_KEY);
    if (raw != null) {
      return JSON.parse(raw);
    }
  } catch (error) {}
  return true;
}

export function setAppendComponentStack(value: boolean): void {
  localStorageSetItem(
    LOCAL_STORAGE_SHOULD_PATCH_CONSOLE_KEY,
    JSON.stringify(value),
  );
}

export function separateDisplayNameAndHOCs(
  displayName: string | null,
  type: ElementType,
): [string | null, Array<string> | null] {
  if (displayName === null) {
    return [null, null];
  }

  let hocDisplayNames = null;

  switch (type) {
    case ElementTypeClass:
    case ElementTypeForwardRef:
    case ElementTypeFunction:
    case ElementTypeMemo:
      if (displayName.indexOf('(') >= 0) {
        const matches = displayName.match(/[^()]+/g);
        if (matches != null) {
          displayName = matches.pop();
          hocDisplayNames = matches;
        }
      }
      break;
    default:
      break;
  }

  if (type === ElementTypeMemo) {
    if (hocDisplayNames === null) {
      hocDisplayNames = ['Memo'];
    } else {
      hocDisplayNames.unshift('Memo');
    }
  } else if (type === ElementTypeForwardRef) {
    if (hocDisplayNames === null) {
      hocDisplayNames = ['ForwardRef'];
    } else {
      hocDisplayNames.unshift('ForwardRef');
    }
  }

  return [displayName, hocDisplayNames];
}

// Pulled from react-compat
// https://github.com/developit/preact-compat/blob/7c5de00e7c85e2ffd011bf3af02899b63f699d3a/src/index.js#L349
export function shallowDiffers(prev: Object, next: Object): boolean {
  for (const attribute in prev) {
    if (!(attribute in next)) {
      return true;
    }
  }
  for (const attribute in next) {
    if (prev[attribute] !== next[attribute]) {
      return true;
    }
  }
  return false;
}

export function getInObject(object: Object, path: Array<string | number>): any {
  return path.reduce((reduced: Object, attr: any): any => {
    if (reduced) {
      if (hasOwnProperty.call(reduced, attr)) {
        return reduced[attr];
      }
      if (typeof reduced[Symbol.iterator] === 'function') {
        // Convert iterable to array and return array[index]
        //
        // TRICKY
        // Don't use [...spread] syntax for this purpose.
        // This project uses @babel/plugin-transform-spread in "loose" mode which only works with Array values.
        // Other types (e.g. typed arrays, Sets) will not spread correctly.
        return Array.from(reduced)[attr];
      }
    }

    return null;
  }, object);
}

export function setInObject(
  object: Object,
  path: Array<string | number>,
  value: any,
) {
  const length = path.length;
  const last = path[length - 1];
  if (object != null) {
    const parent = getInObject(object, path.slice(0, length - 1));
    if (parent) {
      parent[last] = value;
    }
  }
}

export type DataType =
  | 'array'
  | 'array_buffer'
  | 'bigint'
  | 'boolean'
  | 'data_view'
  | 'date'
  | 'function'
  | 'html_element'
  | 'infinity'
  | 'iterator'
  | 'nan'
  | 'null'
  | 'number'
  | 'object'
  | 'react_element'
  | 'regexp'
  | 'string'
  | 'symbol'
  | 'typed_array'
  | 'undefined'
  | 'unknown';

/**
 * Get a enhanced/artificial type string based on the object instance
 */
export function getDataType(data: Object): DataType {
  if (data === null) {
    return 'null';
  } else if (data === undefined) {
    return 'undefined';
  }

  if (isElement(data)) {
    return 'react_element';
  }

  if (typeof HTMLElement !== 'undefined' && data instanceof HTMLElement) {
    return 'html_element';
  }

  const type = typeof data;
  switch (type) {
    case 'bigint':
      return 'bigint';
    case 'boolean':
      return 'boolean';
    case 'function':
      return 'function';
    case 'number':
      if (Number.isNaN(data)) {
        return 'nan';
      } else if (!Number.isFinite(data)) {
        return 'infinity';
      } else {
        return 'number';
      }
    case 'object':
      if (Array.isArray(data)) {
        return 'array';
      } else if (ArrayBuffer.isView(data)) {
        return hasOwnProperty.call(data.constructor, 'BYTES_PER_ELEMENT')
          ? 'typed_array'
          : 'data_view';
      } else if (data.constructor && data.constructor.name === 'ArrayBuffer') {
        // HACK This ArrayBuffer check is gross; is there a better way?
        // We could try to create a new DataView with the value.
        // If it doesn't error, we know it's an ArrayBuffer,
        // but this seems kind of awkward and expensive.
        return 'array_buffer';
      } else if (typeof data[Symbol.iterator] === 'function') {
        return 'iterator';
      } else if (data.constructor && data.constructor.name === 'RegExp') {
        return 'regexp';
      } else if (Object.prototype.toString.call(data) === '[object Date]') {
        return 'date';
      }
      return 'object';
    case 'string':
      return 'string';
    case 'symbol':
      return 'symbol';
    default:
      return 'unknown';
  }
}

export function getDisplayNameForReactElement(
  element: React$Element<any>,
): string | null {
  const elementType = typeOf(element);
  switch (elementType) {
    case ContextConsumer:
      return 'ContextConsumer';
    case ContextProvider:
      return 'ContextProvider';
    case ForwardRef:
      return 'ForwardRef';
    case Fragment:
      return 'Fragment';
    case Lazy:
      return 'Lazy';
    case Memo:
      return 'Memo';
    case Portal:
      return 'Portal';
    case Profiler:
      return 'Profiler';
    case StrictMode:
      return 'StrictMode';
    case Suspense:
      return 'Suspense';
    default:
      const {type} = element;
      if (typeof type === 'string') {
        return type;
      } else if (type != null) {
        return getDisplayName(type, 'Anonymous');
      } else {
        return 'Element';
      }
  }
}

const MAX_PREVIEW_STRING_LENGTH = 50;

function truncateForDisplay(
  string: string,
  length: number = MAX_PREVIEW_STRING_LENGTH,
) {
  if (string.length > length) {
    return string.substr(0, length) + '…';
  } else {
    return string;
  }
}

// Attempts to mimic Chrome's inline preview for values.
// For example, the following value...
//   {
//      foo: 123,
//      bar: "abc",
//      baz: [true, false],
//      qux: { ab: 1, cd: 2 }
//   };
//
// Would show a preview of...
//   {foo: 123, bar: "abc", baz: Array(2), qux: {…}}
//
// And the following value...
//   [
//     123,
//     "abc",
//     [true, false],
//     { foo: 123, bar: "abc" }
//   ];
//
// Would show a preview of...
//   [123, "abc", Array(2), {…}]
export function formatDataForPreview(
  data: any,
  showFormattedValue: boolean,
): string {
  if (data != null && hasOwnProperty.call(data, meta.type)) {
    return showFormattedValue
      ? data[meta.preview_long]
      : data[meta.preview_short];
  }

  const type = getDataType(data);

  switch (type) {
    case 'html_element':
      return `<${truncateForDisplay(data.tagName.toLowerCase())} />`;
    case 'function':
      return truncateForDisplay(`ƒ ${data.name}() {}`);
    case 'string':
      return `"${data}"`;
    case 'bigint':
      return truncateForDisplay(data.toString() + 'n');
    case 'regexp':
      return truncateForDisplay(data.toString());
    case 'symbol':
      return truncateForDisplay(data.toString());
    case 'react_element':
      return `<${truncateForDisplay(
        getDisplayNameForReactElement(data) || 'Unknown',
      )} />`;
    case 'array_buffer':
      return `ArrayBuffer(${data.byteLength})`;
    case 'data_view':
      return `DataView(${data.buffer.byteLength})`;
    case 'array':
      if (showFormattedValue) {
        let formatted = '';
        for (let i = 0; i < data.length; i++) {
          if (i > 0) {
            formatted += ', ';
          }
          formatted += formatDataForPreview(data[i], false);
          if (formatted.length > MAX_PREVIEW_STRING_LENGTH) {
            // Prevent doing a lot of unnecessary iteration...
            break;
          }
        }
        return `[${truncateForDisplay(formatted)}]`;
      } else {
        const length = hasOwnProperty.call(data, meta.size)
          ? data[meta.size]
          : data.length;
        return `Array(${length})`;
      }
    case 'typed_array':
      const shortName = `${data.constructor.name}(${data.length})`;
      if (showFormattedValue) {
        let formatted = '';
        for (let i = 0; i < data.length; i++) {
          if (i > 0) {
            formatted += ', ';
          }
          formatted += data[i];
          if (formatted.length > MAX_PREVIEW_STRING_LENGTH) {
            // Prevent doing a lot of unnecessary iteration...
            break;
          }
        }
        return `${shortName} [${truncateForDisplay(formatted)}]`;
      } else {
        return shortName;
      }
    case 'iterator':
      const name = data.constructor.name;
      if (showFormattedValue) {
        // TRICKY
        // Don't use [...spread] syntax for this purpose.
        // This project uses @babel/plugin-transform-spread in "loose" mode which only works with Array values.
        // Other types (e.g. typed arrays, Sets) will not spread correctly.
        const array = Array.from(data);

        let formatted = '';
        for (let i = 0; i < array.length; i++) {
          const entryOrEntries = array[i];

          if (i > 0) {
            formatted += ', ';
          }

          // TRICKY
          // Browsers display Maps and Sets differently.
          // To mimic their behavior, detect if we've been given an entries tuple.
          //   Map(2) {"abc" => 123, "def" => 123}
          //   Set(2) {"abc", 123}
          if (Array.isArray(entryOrEntries)) {
            const key = formatDataForPreview(entryOrEntries[0], true);
            const value = formatDataForPreview(entryOrEntries[1], false);
            formatted += `${key} => ${value}`;
          } else {
            formatted += formatDataForPreview(entryOrEntries, false);
          }

          if (formatted.length > MAX_PREVIEW_STRING_LENGTH) {
            // Prevent doing a lot of unnecessary iteration...
            break;
          }
        }

        return `${name}(${data.size}) {${truncateForDisplay(formatted)}}`;
      } else {
        return `${name}(${data.size})`;
      }
    case 'date':
      return data.toString();
    case 'object':
      if (showFormattedValue) {
        const keys = Object.keys(data).sort(alphaSortKeys);

        let formatted = '';
        for (let i = 0; i < keys.length; i++) {
          const key = keys[i];
          if (i > 0) {
            formatted += ', ';
          }
          formatted += `${key}: ${formatDataForPreview(data[key], false)}`;
          if (formatted.length > MAX_PREVIEW_STRING_LENGTH) {
            // Prevent doing a lot of unnecessary iteration...
            break;
          }
        }
        return `{${truncateForDisplay(formatted)}}`;
      } else {
        return '{…}';
      }
    case 'boolean':
    case 'number':
    case 'infinity':
    case 'nan':
    case 'null':
    case 'undefined':
      return data;
    default:
      try {
        return truncateForDisplay('' + data);
      } catch (error) {
        return 'unserializable';
      }
  }
}
