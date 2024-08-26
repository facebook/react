/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import LRU from 'lru-cache';
import {
  REACT_CONSUMER_TYPE,
  REACT_CONTEXT_TYPE,
  REACT_FORWARD_REF_TYPE,
  REACT_FRAGMENT_TYPE,
  REACT_LAZY_TYPE,
  REACT_ELEMENT_TYPE,
  REACT_LEGACY_ELEMENT_TYPE,
  REACT_MEMO_TYPE,
  REACT_PORTAL_TYPE,
  REACT_PROFILER_TYPE,
  REACT_PROVIDER_TYPE,
  REACT_STRICT_MODE_TYPE,
  REACT_SUSPENSE_LIST_TYPE,
  REACT_SUSPENSE_TYPE,
  REACT_TRACING_MARKER_TYPE,
} from 'shared/ReactSymbols';
import {enableRenderableContext} from 'shared/ReactFeatureFlags';
import {
  TREE_OPERATION_ADD,
  TREE_OPERATION_REMOVE,
  TREE_OPERATION_REMOVE_ROOT,
  TREE_OPERATION_REORDER_CHILDREN,
  TREE_OPERATION_SET_SUBTREE_MODE,
  TREE_OPERATION_UPDATE_ERRORS_OR_WARNINGS,
  TREE_OPERATION_UPDATE_TREE_BASE_DURATION,
  LOCAL_STORAGE_COMPONENT_FILTER_PREFERENCES_KEY,
  LOCAL_STORAGE_OPEN_IN_EDITOR_URL,
  LOCAL_STORAGE_SHOULD_BREAK_ON_CONSOLE_ERRORS,
  LOCAL_STORAGE_SHOULD_APPEND_COMPONENT_STACK_KEY,
  LOCAL_STORAGE_SHOW_INLINE_WARNINGS_AND_ERRORS_KEY,
  LOCAL_STORAGE_HIDE_CONSOLE_LOGS_IN_STRICT_MODE,
} from './constants';
import {
  ComponentFilterElementType,
  ComponentFilterLocation,
  ElementTypeHostComponent,
} from './frontend/types';
import {
  ElementTypeRoot,
  ElementTypeClass,
  ElementTypeForwardRef,
  ElementTypeFunction,
  ElementTypeMemo,
  ElementTypeVirtual,
} from 'react-devtools-shared/src/frontend/types';
import {localStorageGetItem, localStorageSetItem} from './storage';
import {meta} from './hydration';
import isArray from './isArray';

import type {
  ComponentFilter,
  ElementType,
  BrowserTheme,
  SerializedElement as SerializedElementFrontend,
  LRUCache,
} from 'react-devtools-shared/src/frontend/types';
import type {SerializedElement as SerializedElementBackend} from 'react-devtools-shared/src/backend/types';

// $FlowFixMe[method-unbinding]
const hasOwnProperty = Object.prototype.hasOwnProperty;

const cachedDisplayNames: WeakMap<Function, string> = new WeakMap();

// On large trees, encoding takes significant time.
// Try to reuse the already encoded strings.
const encodedStringCache: LRUCache<string, Array<number>> = new LRU({
  max: 1000,
});

export function alphaSortKeys(
  a: string | number | symbol,
  b: string | number | symbol,
): number {
  if (a.toString() > b.toString()) {
    return 1;
  } else if (b.toString() > a.toString()) {
    return -1;
  } else {
    return 0;
  }
}

export function getAllEnumerableKeys(
  obj: Object,
): Set<string | number | symbol> {
  const keys = new Set<string | number | symbol>();
  let current = obj;
  while (current != null) {
    const currentKeys = [
      ...Object.keys(current),
      ...Object.getOwnPropertySymbols(current),
    ];
    const descriptors = Object.getOwnPropertyDescriptors(current);
    currentKeys.forEach(key => {
      // $FlowFixMe[incompatible-type]: key can be a Symbol https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object/getOwnPropertyDescriptor
      if (descriptors[key].enumerable) {
        keys.add(key);
      }
    });
    current = Object.getPrototypeOf(current);
  }
  return keys;
}

// Mirror https://github.com/facebook/react/blob/7c21bf72ace77094fd1910cc350a548287ef8350/packages/shared/getComponentName.js#L27-L37
export function getWrappedDisplayName(
  outerType: mixed,
  innerType: any,
  wrapperName: string,
  fallbackName?: string,
): string {
  const displayName = (outerType: any)?.displayName;
  return (
    displayName || `${wrapperName}(${getDisplayName(innerType, fallbackName)})`
  );
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

export function utfDecodeStringWithRanges(
  array: Array<number>,
  left: number,
  right: number,
): string {
  let string = '';
  for (let i = left; i <= right; i++) {
    string += String.fromCodePoint(array[i]);
  }
  return string;
}

function surrogatePairToCodePoint(
  charCode1: number,
  charCode2: number,
): number {
  return ((charCode1 & 0x3ff) << 10) + (charCode2 & 0x3ff) + 0x10000;
}

// Credit for this encoding approach goes to Tim Down:
// https://stackoverflow.com/questions/4877326/how-can-i-tell-if-a-string-contains-multibyte-characters-in-javascript
export function utfEncodeString(string: string): Array<number> {
  const cached = encodedStringCache.get(string);
  if (cached !== undefined) {
    return cached;
  }

  const encoded = [];
  let i = 0;
  let charCode;
  while (i < string.length) {
    charCode = string.charCodeAt(i);
    // Handle multibyte unicode characters (like emoji).
    if ((charCode & 0xf800) === 0xd800) {
      encoded.push(surrogatePairToCodePoint(charCode, string.charCodeAt(++i)));
    } else {
      encoded.push(charCode);
    }
    ++i;
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
  const stringTable: Array<null | string> = [
    null, // ID = 0 corresponds to the null string.
  ];
  const stringTableSize = operations[i++];
  const stringTableEnd = i + stringTableSize;
  while (i < stringTableEnd) {
    const nextLength = operations[i++];
    const nextString = utfDecodeStringWithRanges(
      operations,
      i,
      i + nextLength - 1,
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

          i++; // isStrictModeCompliant
          i++; // supportsProfiling
          i++; // supportsStrictMode
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
      case TREE_OPERATION_REMOVE_ROOT: {
        i += 1;

        logs.push(`Remove root ${rootID}`);
        break;
      }
      case TREE_OPERATION_SET_SUBTREE_MODE: {
        const id = operations[i + 1];
        const mode = operations[i + 1];

        i += 3;

        logs.push(`Mode ${mode} set for subtree with root ${id}`);
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
      case TREE_OPERATION_UPDATE_ERRORS_OR_WARNINGS:
        const id = operations[i + 1];
        const numErrors = operations[i + 2];
        const numWarnings = operations[i + 3];

        i += 4;

        logs.push(
          `Node ${id} has ${numErrors} errors and ${numWarnings} warnings`,
        );
        break;
      default:
        throw Error(`Unsupported Bridge operation "${operation}"`);
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
    const raw = localStorageGetItem(
      LOCAL_STORAGE_COMPONENT_FILTER_PREFERENCES_KEY,
    );
    if (raw != null) {
      const parsedFilters: Array<ComponentFilter> = JSON.parse(raw);
      return filterOutLocationComponentFilters(parsedFilters);
    }
  } catch (error) {}
  return getDefaultComponentFilters();
}

export function setSavedComponentFilters(
  componentFilters: Array<ComponentFilter>,
): void {
  localStorageSetItem(
    LOCAL_STORAGE_COMPONENT_FILTER_PREFERENCES_KEY,
    JSON.stringify(filterOutLocationComponentFilters(componentFilters)),
  );
}

// Following __debugSource removal from Fiber, the new approach for finding the source location
// of a component, represented by the Fiber, is based on lazily generating and parsing component stack frames
// To find the original location, React DevTools will perform symbolication, source maps are required for that.
// In order to start filtering Fibers, we need to find location for all of them, which can't be done lazily.
// Eager symbolication can become quite expensive for large applications.
export function filterOutLocationComponentFilters(
  componentFilters: Array<ComponentFilter>,
): Array<ComponentFilter> {
  // This is just an additional check to preserve the previous state
  // Filters can be stored on the backend side or in user land (in a window object)
  if (!Array.isArray(componentFilters)) {
    return componentFilters;
  }

  return componentFilters.filter(f => f.type !== ComponentFilterLocation);
}

function parseBool(s: ?string): ?boolean {
  if (s === 'true') {
    return true;
  }
  if (s === 'false') {
    return false;
  }
}

export function castBool(v: any): ?boolean {
  if (v === true || v === false) {
    return v;
  }
}

export function castBrowserTheme(v: any): ?BrowserTheme {
  if (v === 'light' || v === 'dark' || v === 'auto') {
    return v;
  }
}

export function getAppendComponentStack(): boolean {
  const raw = localStorageGetItem(
    LOCAL_STORAGE_SHOULD_APPEND_COMPONENT_STACK_KEY,
  );
  return parseBool(raw) ?? true;
}

export function getBreakOnConsoleErrors(): boolean {
  const raw = localStorageGetItem(LOCAL_STORAGE_SHOULD_BREAK_ON_CONSOLE_ERRORS);
  return parseBool(raw) ?? false;
}

export function getHideConsoleLogsInStrictMode(): boolean {
  const raw = localStorageGetItem(
    LOCAL_STORAGE_HIDE_CONSOLE_LOGS_IN_STRICT_MODE,
  );
  return parseBool(raw) ?? false;
}

export function getShowInlineWarningsAndErrors(): boolean {
  const raw = localStorageGetItem(
    LOCAL_STORAGE_SHOW_INLINE_WARNINGS_AND_ERRORS_KEY,
  );
  return parseBool(raw) ?? true;
}

export function getDefaultOpenInEditorURL(): string {
  return typeof process.env.EDITOR_URL === 'string'
    ? process.env.EDITOR_URL
    : '';
}

export function getOpenInEditorURL(): string {
  try {
    const raw = localStorageGetItem(LOCAL_STORAGE_OPEN_IN_EDITOR_URL);
    if (raw != null) {
      return JSON.parse(raw);
    }
  } catch (error) {}
  return getDefaultOpenInEditorURL();
}

type ParseElementDisplayNameFromBackendReturn = {
  formattedDisplayName: string | null,
  hocDisplayNames: Array<string> | null,
  compiledWithForget: boolean,
};
export function parseElementDisplayNameFromBackend(
  displayName: string | null,
  type: ElementType,
): ParseElementDisplayNameFromBackendReturn {
  if (displayName === null) {
    return {
      formattedDisplayName: null,
      hocDisplayNames: null,
      compiledWithForget: false,
    };
  }

  if (displayName.startsWith('Forget(')) {
    const displayNameWithoutForgetWrapper = displayName.slice(
      7,
      displayName.length - 1,
    );

    const {formattedDisplayName, hocDisplayNames} =
      parseElementDisplayNameFromBackend(displayNameWithoutForgetWrapper, type);
    return {formattedDisplayName, hocDisplayNames, compiledWithForget: true};
  }

  let hocDisplayNames = null;
  switch (type) {
    case ElementTypeClass:
    case ElementTypeForwardRef:
    case ElementTypeFunction:
    case ElementTypeMemo:
    case ElementTypeVirtual:
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

  return {
    formattedDisplayName: displayName,
    hocDisplayNames,
    compiledWithForget: false,
  };
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

export function deletePathInObject(
  object: Object,
  path: Array<string | number>,
) {
  const length = path.length;
  const last = path[length - 1];
  if (object != null) {
    const parent = getInObject(object, path.slice(0, length - 1));
    if (parent) {
      if (isArray(parent)) {
        parent.splice(((last: any): number), 1);
      } else {
        delete parent[last];
      }
    }
  }
}

export function renamePathInObject(
  object: Object,
  oldPath: Array<string | number>,
  newPath: Array<string | number>,
) {
  const length = oldPath.length;
  if (object != null) {
    const parent = getInObject(object, oldPath.slice(0, length - 1));
    if (parent) {
      const lastOld = oldPath[length - 1];
      const lastNew = newPath[length - 1];
      parent[lastNew] = parent[lastOld];
      if (isArray(parent)) {
        parent.splice(((lastOld: any): number), 1);
      } else {
        delete parent[lastOld];
      }
    }
  }
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
  | 'class_instance'
  | 'data_view'
  | 'date'
  | 'function'
  | 'html_all_collection'
  | 'html_element'
  | 'infinity'
  | 'iterator'
  | 'opaque_iterator'
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
      if (
        data.$$typeof === REACT_ELEMENT_TYPE ||
        data.$$typeof === REACT_LEGACY_ELEMENT_TYPE
      ) {
        return 'react_element';
      }
      if (isArray(data)) {
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
        const iterator = data[Symbol.iterator]();
        if (!iterator) {
          // Proxies might break assumptoins about iterators.
          // See github.com/facebook/react/issues/21654
        } else {
          return iterator === data ? 'opaque_iterator' : 'iterator';
        }
      } else if (data.constructor && data.constructor.name === 'RegExp') {
        return 'regexp';
      } else {
        // $FlowFixMe[method-unbinding]
        const toStringValue = Object.prototype.toString.call(data);
        if (toStringValue === '[object Date]') {
          return 'date';
        } else if (toStringValue === '[object HTMLAllCollection]') {
          return 'html_all_collection';
        }
      }

      if (!isPlainObject(data)) {
        return 'class_instance';
      }

      return 'object';
    case 'string':
      return 'string';
    case 'symbol':
      return 'symbol';
    case 'undefined':
      if (
        // $FlowFixMe[method-unbinding]
        Object.prototype.toString.call(data) === '[object HTMLAllCollection]'
      ) {
        return 'html_all_collection';
      }
      return 'undefined';
    default:
      return 'unknown';
  }
}

// Fork of packages/react-is/src/ReactIs.js:30, but with legacy element type
// Which has been changed in https://github.com/facebook/react/pull/28813
function typeOfWithLegacyElementSymbol(object: any): mixed {
  if (typeof object === 'object' && object !== null) {
    const $$typeof = object.$$typeof;
    switch ($$typeof) {
      case REACT_ELEMENT_TYPE:
      case REACT_LEGACY_ELEMENT_TYPE:
        const type = object.type;

        switch (type) {
          case REACT_FRAGMENT_TYPE:
          case REACT_PROFILER_TYPE:
          case REACT_STRICT_MODE_TYPE:
          case REACT_SUSPENSE_TYPE:
          case REACT_SUSPENSE_LIST_TYPE:
            return type;
          default:
            const $$typeofType = type && type.$$typeof;

            switch ($$typeofType) {
              case REACT_CONTEXT_TYPE:
              case REACT_FORWARD_REF_TYPE:
              case REACT_LAZY_TYPE:
              case REACT_MEMO_TYPE:
                return $$typeofType;
              case REACT_CONSUMER_TYPE:
                if (enableRenderableContext) {
                  return $$typeofType;
                }
              // Fall through
              case REACT_PROVIDER_TYPE:
                if (!enableRenderableContext) {
                  return $$typeofType;
                }
              // Fall through
              default:
                return $$typeof;
            }
        }
      case REACT_PORTAL_TYPE:
        return $$typeof;
    }
  }

  return undefined;
}

export function getDisplayNameForReactElement(
  element: React$Element<any>,
): string | null {
  const elementType = typeOfWithLegacyElementSymbol(element);
  switch (elementType) {
    case REACT_CONSUMER_TYPE:
      return 'ContextConsumer';
    case REACT_PROVIDER_TYPE:
      return 'ContextProvider';
    case REACT_CONTEXT_TYPE:
      return 'Context';
    case REACT_FORWARD_REF_TYPE:
      return 'ForwardRef';
    case REACT_FRAGMENT_TYPE:
      return 'Fragment';
    case REACT_LAZY_TYPE:
      return 'Lazy';
    case REACT_MEMO_TYPE:
      return 'Memo';
    case REACT_PORTAL_TYPE:
      return 'Portal';
    case REACT_PROFILER_TYPE:
      return 'Profiler';
    case REACT_STRICT_MODE_TYPE:
      return 'StrictMode';
    case REACT_SUSPENSE_TYPE:
      return 'Suspense';
    case REACT_SUSPENSE_LIST_TYPE:
      return 'SuspenseList';
    case REACT_TRACING_MARKER_TYPE:
      return 'TracingMarker';
    default:
      const {type} = element;
      if (typeof type === 'string') {
        return type;
      } else if (typeof type === 'function') {
        return getDisplayName(type, 'Anonymous');
      } else if (type != null) {
        return 'NotImplementedInDevtools';
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
    return string.slice(0, length) + '…';
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
      if (typeof data.name === 'function' || data.name === '') {
        return '() => {}';
      }
      return `${truncateForDisplay(data.name)}() {}`;
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
          if (isArray(entryOrEntries)) {
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
    case 'opaque_iterator': {
      return data[Symbol.toStringTag];
    }
    case 'date':
      return data.toString();
    case 'class_instance':
      return data.constructor.name;
    case 'object':
      if (showFormattedValue) {
        const keys = Array.from(getAllEnumerableKeys(data)).sort(alphaSortKeys);

        let formatted = '';
        for (let i = 0; i < keys.length; i++) {
          const key = keys[i];
          if (i > 0) {
            formatted += ', ';
          }
          formatted += `${key.toString()}: ${formatDataForPreview(
            data[key],
            false,
          )}`;
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
        return truncateForDisplay(String(data));
      } catch (error) {
        return 'unserializable';
      }
  }
}

// Basically checking that the object only has Object in its prototype chain
export const isPlainObject = (object: Object): boolean => {
  const objectPrototype = Object.getPrototypeOf(object);
  if (!objectPrototype) return true;

  const objectParentPrototype = Object.getPrototypeOf(objectPrototype);
  return !objectParentPrototype;
};

export function backendToFrontendSerializedElementMapper(
  element: SerializedElementBackend,
): SerializedElementFrontend {
  const {formattedDisplayName, hocDisplayNames, compiledWithForget} =
    parseElementDisplayNameFromBackend(element.displayName, element.type);

  return {
    ...element,
    displayName: formattedDisplayName,
    hocDisplayNames,
    compiledWithForget,
  };
}

// Chrome normalizes urls like webpack-internals:// but new URL don't, so cannot use new URL here.
export function normalizeUrl(url: string): string {
  return url.replace('/./', '/');
}
