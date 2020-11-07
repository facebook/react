/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import {
  getDataType,
  getDisplayNameForReactElement,
  getAllEnumerableKeys,
  getInObject,
  formatDataForPreview,
  setInObject,
} from './utils';

import type {DehydratedData} from 'react-devtools-shared/src/devtools/views/Components/types';

export const meta = {
  inspectable: Symbol('inspectable'),
  inspected: Symbol('inspected'),
  name: Symbol('name'),
  preview_long: Symbol('preview_long'),
  preview_short: Symbol('preview_short'),
  readonly: Symbol('readonly'),
  size: Symbol('size'),
  type: Symbol('type'),
  unserializable: Symbol('unserializable'),
};

export type Dehydrated = {|
  inspectable: boolean,
  name: string | null,
  preview_long: string | null,
  preview_short: string | null,
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
  preview_long: string | null,
  preview_short: string | null,
  readonly?: boolean,
  size?: number,
  type: string,
  unserializable: boolean,
  ...
};

// This threshold determines the depth at which the bridge "dehydrates" nested data.
// Dehydration means that we don't serialize the data for e.g. postMessage or stringify,
// unless the frontend explicitly requests it (e.g. a user clicks to expand a props object).
//
// Reducing this threshold will improve the speed of initial component inspection,
// but may decrease the responsiveness of expanding objects/arrays to inspect further.
const LEVEL_THRESHOLD = 2;

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
    preview_long: formatDataForPreview(data, true),
    preview_short: formatDataForPreview(data, false),
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
  isPathAllowed: (path: Array<string | number>) => boolean,
  level?: number = 0,
):
  | string
  | Dehydrated
  | Unserializable
  | Array<Dehydrated>
  | Array<Unserializable>
  | {[key: string]: string | Dehydrated | Unserializable, ...} {
  const type = getDataType(data);

  let isPathAllowedCheck;

  switch (type) {
    case 'html_element':
      cleaned.push(path);
      return {
        inspectable: false,
        preview_short: formatDataForPreview(data, false),
        preview_long: formatDataForPreview(data, true),
        name: data.tagName,
        type,
      };

    case 'function':
      cleaned.push(path);
      return {
        inspectable: false,
        preview_short: formatDataForPreview(data, false),
        preview_long: formatDataForPreview(data, true),
        name:
          typeof data.name === 'function' || !data.name
            ? 'function'
            : data.name,
        type,
      };

    case 'string':
      return data.length <= 500 ? data : data.slice(0, 500) + '...';

    case 'bigint':
      cleaned.push(path);
      return {
        inspectable: false,
        preview_short: formatDataForPreview(data, false),
        preview_long: formatDataForPreview(data, true),
        name: data.toString(),
        type,
      };

    case 'symbol':
      cleaned.push(path);
      return {
        inspectable: false,
        preview_short: formatDataForPreview(data, false),
        preview_long: formatDataForPreview(data, true),
        name: data.toString(),
        type,
      };

    // React Elements aren't very inspector-friendly,
    // and often contain private fields or circular references.
    case 'react_element':
      cleaned.push(path);
      return {
        inspectable: false,
        preview_short: formatDataForPreview(data, false),
        preview_long: formatDataForPreview(data, true),
        name: getDisplayNameForReactElement(data) || 'Unknown',
        type,
      };

    // ArrayBuffers error if you try to inspect them.
    case 'array_buffer':
    case 'data_view':
      cleaned.push(path);
      return {
        inspectable: false,
        preview_short: formatDataForPreview(data, false),
        preview_long: formatDataForPreview(data, true),
        name: type === 'data_view' ? 'DataView' : 'ArrayBuffer',
        size: data.byteLength,
        type,
      };

    case 'array':
      isPathAllowedCheck = isPathAllowed(path);
      if (level >= LEVEL_THRESHOLD && !isPathAllowedCheck) {
        return createDehydrated(type, true, data, cleaned, path);
      }
      return data.map((item, i) =>
        dehydrate(
          item,
          cleaned,
          unserializable,
          path.concat([i]),
          isPathAllowed,
          isPathAllowedCheck ? 1 : level + 1,
        ),
      );

    case 'html_all_collection':
    case 'typed_array':
    case 'iterator':
      isPathAllowedCheck = isPathAllowed(path);
      if (level >= LEVEL_THRESHOLD && !isPathAllowedCheck) {
        return createDehydrated(type, true, data, cleaned, path);
      } else {
        const unserializableValue: Unserializable = {
          unserializable: true,
          type: type,
          readonly: true,
          size: type === 'typed_array' ? data.length : undefined,
          preview_short: formatDataForPreview(data, false),
          preview_long: formatDataForPreview(data, true),
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
                isPathAllowed,
                isPathAllowedCheck ? 1 : level + 1,
              )),
          );
        }

        unserializable.push(path);

        return unserializableValue;
      }

    case 'opaque_iterator':
      cleaned.push(path);
      return {
        inspectable: false,
        preview_short: formatDataForPreview(data, false),
        preview_long: formatDataForPreview(data, true),
        name: data[Symbol.toStringTag],
        type,
      };

    case 'date':
      cleaned.push(path);
      return {
        inspectable: false,
        preview_short: formatDataForPreview(data, false),
        preview_long: formatDataForPreview(data, true),
        name: data.toString(),
        type,
      };

    case 'regexp':
      cleaned.push(path);
      return {
        inspectable: false,
        preview_short: formatDataForPreview(data, false),
        preview_long: formatDataForPreview(data, true),
        name: data.toString(),
        type,
      };

    case 'object':
      isPathAllowedCheck = isPathAllowed(path);
      if (level >= LEVEL_THRESHOLD && !isPathAllowedCheck) {
        return createDehydrated(type, true, data, cleaned, path);
      } else {
        const object = {};
        getAllEnumerableKeys(data).forEach(key => {
          const name = key.toString();
          object[name] = dehydrate(
            data[key],
            cleaned,
            unserializable,
            path.concat([name]),
            isPathAllowed,
            isPathAllowedCheck ? 1 : level + 1,
          );
        });
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
      delete target[meta.preview_long];
      delete target[meta.preview_short];
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
      const replaced: {[key: Symbol]: boolean | string, ...} = {};
      replaced[meta.inspectable] = !!value.inspectable;
      replaced[meta.inspected] = false;
      replaced[meta.name] = value.name;
      replaced[meta.preview_long] = value.preview_long;
      replaced[meta.preview_short] = value.preview_short;
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
    [meta.preview_long]: {
      configurable: true,
      enumerable: false,
      value: source.preview_long,
    },
    [meta.preview_short]: {
      configurable: true,
      enumerable: false,
      value: source.preview_short,
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
  delete destination.preview_long;
  delete destination.preview_short;
  delete destination.size;
  delete destination.readonly;
  delete destination.type;
  delete destination.unserializable;
}
