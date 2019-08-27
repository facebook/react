/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import Symbol from 'es6-symbol';
import {
  isElement,
  typeOf,
  AsyncMode,
  ConcurrentMode,
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
import {getDisplayName, getInObject, setInObject} from './utils';

import type {DehydratedData} from 'react-devtools-shared/src/devtools/views/Components/types';

export const meta = {
  inspectable: Symbol('inspectable'),
  inspected: Symbol('inspected'),
  name: Symbol('name'),
  readonly: Symbol('readonly'),
  size: Symbol('size'),
  type: Symbol('type'),
  unserializable: Symbol('unserializable'),
};

export type Dehydrated = {|
  inspectable: boolean,
  name: string | null,
  readonly?: boolean,
  size?: number,
  type: string,
|};

// Typed arrays and other complex iteratable objects (e.g. Map, Set, ImmutableJS) need special handling.
// These objects can't be serialized without losing type information,
// so a "Unserializable" type wrapper is used (with meta-data keys) to send nested values-
// while preserving the original type and name.
export type Unserializable = {
  name: string | null,
  readonly?: boolean,
  size?: number,
  type: string,
  unserializable: boolean,
};

// This threshold determines the depth at which the bridge "dehydrates" nested data.
// Dehydration means that we don't serialize the data for e.g. postMessage or stringify,
// unless the frontend explicitly requests it (e.g. a user clicks to expand a props object).
//
// Reducing this threshold will improve the speed of initial component inspection,
// but may decrease the responsiveness of expanding objects/arrays to inspect further.
const LEVEL_THRESHOLD = 2;

type PropType =
  | 'array'
  | 'array_buffer'
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
  | 'string'
  | 'symbol'
  | 'typed_array'
  | 'undefined'
  | 'unknown';

/**
 * Get a enhanced/artificial type string based on the object instance
 */
function getDataType(data: Object): PropType {
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
        return data instanceof DataView ? 'data_view' : 'typed_array';
      } else if (data instanceof ArrayBuffer) {
        return 'array_buffer';
      } else if (typeof data[Symbol.iterator] === 'function') {
        return 'iterator';
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

/**
 * Generate the dehydrated metadata for complex object instances
 */
function createDehydrated(
  type: string,
  inspectable: boolean,
  data: Object,
  cleaned: Array<Array<string | number>>,
  path: Array<string | number>,
): Dehydrated {
  cleaned.push(path);

  const dehydrated: Dehydrated = {
    inspectable,
    type,
    name:
      !data.constructor || data.constructor.name === 'Object'
        ? ''
        : data.constructor.name,
  };

  if (type === 'array' || type === 'typed_array') {
    dehydrated.size = data.length;
  } else if (type === 'object') {
    dehydrated.size = Object.keys(data).length;
  }

  if (type === 'iterator' || type === 'typed_array') {
    dehydrated.readonly = true;
  }

  return dehydrated;
}

/**
 * Strip out complex data (instances, functions, and data nested > LEVEL_THRESHOLD levels deep).
 * The paths of the stripped out objects are appended to the `cleaned` list.
 * On the other side of the barrier, the cleaned list is used to "re-hydrate" the cleaned representation into
 * an object with symbols as attributes, so that a sanitized object can be distinguished from a normal object.
 *
 * Input: {"some": {"attr": fn()}, "other": AnInstance}
 * Output: {
 *   "some": {
 *     "attr": {"name": the fn.name, type: "function"}
 *   },
 *   "other": {
 *     "name": "AnInstance",
 *     "type": "object",
 *   },
 * }
 * and cleaned = [["some", "attr"], ["other"]]
 */
export function dehydrate(
  data: Object,
  cleaned: Array<Array<string | number>>,
  unserializable: Array<Array<string | number>>,
  path: Array<string | number>,
  isPathWhitelisted: (path: Array<string | number>) => boolean,
  level?: number = 0,
):
  | string
  | Dehydrated
  | Unserializable
  | Array<Dehydrated>
  | Array<Unserializable>
  | {[key: string]: string | Dehydrated | Unserializable} {
  const type = getDataType(data);

  let isPathWhitelistedCheck;

  switch (type) {
    case 'html_element':
      cleaned.push(path);
      return {
        inspectable: false,
        name: data.tagName,
        type,
      };

    case 'function':
      cleaned.push(path);
      return {
        inspectable: false,
        name: data.name,
        type,
      };

    case 'string':
      return data.length <= 500 ? data : data.slice(0, 500) + '...';

    case 'symbol':
      cleaned.push(path);
      return {
        inspectable: false,
        name: data.toString(),
        type,
      };

    // React Elements aren't very inspector-friendly,
    // and often contain private fields or circular references.
    case 'react_element':
      cleaned.push(path);
      return {
        inspectable: false,
        name: getDisplayNameForReactElement(data),
        type,
      };

    // ArrayBuffers error if you try to inspect them.
    case 'array_buffer':
    case 'data_view':
      cleaned.push(path);
      return {
        inspectable: false,
        name: type === 'data_view' ? 'DataView' : 'ArrayBuffer',
        size: data.byteLength,
        type,
      };

    case 'array':
      isPathWhitelistedCheck = isPathWhitelisted(path);
      if (level >= LEVEL_THRESHOLD && !isPathWhitelistedCheck) {
        return createDehydrated(type, true, data, cleaned, path);
      }
      return data.map((item, i) =>
        dehydrate(
          item,
          cleaned,
          unserializable,
          path.concat([i]),
          isPathWhitelisted,
          isPathWhitelistedCheck ? 1 : level + 1,
        ),
      );

    case 'typed_array':
    case 'iterator':
      isPathWhitelistedCheck = isPathWhitelisted(path);
      if (level >= LEVEL_THRESHOLD && !isPathWhitelistedCheck) {
        return createDehydrated(type, true, data, cleaned, path);
      } else {
        const unserializableValue: Unserializable = {
          unserializable: true,
          type: type,
          readonly: true,
          size: type === 'typed_array' ? data.length : undefined,
          name:
            !data.constructor || data.constructor.name === 'Object'
              ? ''
              : data.constructor.name,
        };

        if (typeof data[Symbol.iterator]) {
          // TRICKY
          // Don't use [...spread] syntax for this purpose.
          // This project uses @babel/plugin-transform-spread in "loose" mode which only works with Array values.
          // Other types (e.g. typed arrays, Sets) will not spread correctly.
          Array.from(data).forEach(
            (item, i) =>
              (unserializableValue[i] = dehydrate(
                item,
                cleaned,
                unserializable,
                path.concat([i]),
                isPathWhitelisted,
                isPathWhitelistedCheck ? 1 : level + 1,
              )),
          );
        }

        unserializable.push(path);

        return unserializableValue;
      }

    case 'date':
      cleaned.push(path);
      return {
        inspectable: false,
        name: data.toString(),
        type,
      };

    case 'object':
      isPathWhitelistedCheck = isPathWhitelisted(path);
      if (level >= LEVEL_THRESHOLD && !isPathWhitelistedCheck) {
        return createDehydrated(type, true, data, cleaned, path);
      } else {
        const object = {};
        for (let name in data) {
          object[name] = dehydrate(
            data[name],
            cleaned,
            unserializable,
            path.concat([name]),
            isPathWhitelisted,
            isPathWhitelistedCheck ? 1 : level + 1,
          );
        }
        return object;
      }

    case 'infinity':
    case 'nan':
    case 'undefined':
      // Some values are lossy when sent through a WebSocket.
      // We dehydrate+rehydrate them to preserve their type.
      cleaned.push(path);
      return {
        type,
      };

    default:
      return data;
  }
}

export function fillInPath(
  object: Object,
  data: DehydratedData,
  path: Array<string | number>,
  value: any,
) {
  const target = getInObject(object, path);
  if (target != null) {
    if (!target[meta.unserializable]) {
      delete target[meta.inspectable];
      delete target[meta.inspected];
      delete target[meta.name];
      delete target[meta.readonly];
      delete target[meta.size];
      delete target[meta.type];
    }
  }

  if (value !== null && data.unserializable.length > 0) {
    const unserializablePath = data.unserializable[0];
    let isMatch = unserializablePath.length === path.length;
    for (let i = 0; i < path.length; i++) {
      if (path[i] !== unserializablePath[i]) {
        isMatch = false;
        break;
      }
    }
    if (isMatch) {
      upgradeUnserializable(value, value);
    }
  }

  setInObject(object, path, value);
}

export function hydrate(
  object: any,
  cleaned: Array<Array<string | number>>,
  unserializable: Array<Array<string | number>>,
): Object {
  cleaned.forEach((path: Array<string | number>) => {
    const length = path.length;
    const last = path[length - 1];
    const parent = getInObject(object, path.slice(0, length - 1));
    if (!parent || !parent.hasOwnProperty(last)) {
      return;
    }

    const value = parent[last];

    if (value.type === 'infinity') {
      parent[last] = Infinity;
    } else if (value.type === 'nan') {
      parent[last] = NaN;
    } else if (value.type === 'undefined') {
      parent[last] = undefined;
    } else {
      // Replace the string keys with Symbols so they're non-enumerable.
      const replaced: {[key: Symbol]: boolean | string} = {};
      replaced[meta.inspectable] = !!value.inspectable;
      replaced[meta.inspected] = false;
      replaced[meta.name] = value.name;
      replaced[meta.size] = value.size;
      replaced[meta.readonly] = !!value.readonly;
      replaced[meta.type] = value.type;

      parent[last] = replaced;
    }
  });
  unserializable.forEach((path: Array<string | number>) => {
    const length = path.length;
    const last = path[length - 1];
    const parent = getInObject(object, path.slice(0, length - 1));
    if (!parent || !parent.hasOwnProperty(last)) {
      return;
    }

    const node = parent[last];

    const replacement = {
      ...node,
    };

    upgradeUnserializable(replacement, node);

    parent[last] = replacement;
  });
  return object;
}

function upgradeUnserializable(destination: Object, source: Object) {
  Object.defineProperties(destination, {
    [meta.inspected]: {
      configurable: true,
      enumerable: false,
      value: !!source.inspected,
    },
    [meta.name]: {
      configurable: true,
      enumerable: false,
      value: source.name,
    },
    [meta.size]: {
      configurable: true,
      enumerable: false,
      value: source.size,
    },
    [meta.readonly]: {
      configurable: true,
      enumerable: false,
      value: !!source.readonly,
    },
    [meta.type]: {
      configurable: true,
      enumerable: false,
      value: source.type,
    },
    [meta.unserializable]: {
      configurable: true,
      enumerable: false,
      value: !!source.unserializable,
    },
  });

  delete destination.inspected;
  delete destination.name;
  delete destination.size;
  delete destination.readonly;
  delete destination.type;
  delete destination.unserializable;
}

export function getDisplayNameForReactElement(
  element: React$Element<any>,
): string | null {
  const elementType = typeOf(element);
  switch (elementType) {
    case AsyncMode:
    case ConcurrentMode:
      return 'ConcurrentMode';
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
