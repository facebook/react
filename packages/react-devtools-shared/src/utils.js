/**
 * Utils tối ưu hóa cho React DevTools
 * - Cache mạnh hơn
 * - Giảm loop dư thừa
 * - Safe access nhanh hơn
 * - Preview formatter tối ưu
 * - Unicode encoder nhanh hơn
 * - Tree operation parser sạch hơn
 *
 * Author: Optimized Edition
 */

/* eslint-disable */

import LRU from 'lru-cache';

const hasOwn = Object.prototype.hasOwnProperty;

/* =========================================
 * CACHE
 * =======================================*/

const displayNameCache = new WeakMap();

const encodedStringCache = new LRU({
  max: 2000,
});

/* =========================================
 * CONSTANTS
 * =======================================*/

export const MAX_PREVIEW_STRING_LENGTH = 50;

/* =========================================
 * UID
 * =======================================*/

let uid = 0;

export function getUID() {
  return ++uid;
}

/* =========================================
 * SORT
 * =======================================*/

export function alphaSortKeys(a, b) {
  const aStr = String(a);
  const bStr = String(b);

  if (aStr > bStr) return 1;
  if (aStr < bStr) return -1;

  return 0;
}

/* =========================================
 * DISPLAY NAME
 * =======================================*/

export function getDisplayName(
  type,
  fallbackName = 'Anonymous',
) {
  if (displayNameCache.has(type)) {
    return displayNameCache.get(type);
  }

  let name = fallbackName;

  if (typeof type?.displayName === 'string') {
    name = type.displayName;
  } else if (typeof type?.name === 'string' && type.name !== '') {
    name = type.name;
  }

  displayNameCache.set(type, name);

  return name;
}

export function getWrappedDisplayName(
  outerType,
  innerType,
  wrapperName,
  fallbackName,
) {
  return (
    outerType?.displayName ||
    `${wrapperName}(${getDisplayName(innerType, fallbackName)})`
  );
}

/* =========================================
 * ENUMERABLE KEYS
 * =======================================*/

export function getAllEnumerableKeys(obj) {
  const keys = new Set();

  let current = obj;

  while (current != null) {
    const descriptors = Object.getOwnPropertyDescriptors(current);

    for (const key of Reflect.ownKeys(descriptors)) {
      if (descriptors[key]?.enumerable) {
        keys.add(key);
      }
    }

    current = Object.getPrototypeOf(current);
  }

  return keys;
}

/* =========================================
 * UTF ENCODE / DECODE
 * =======================================*/

function surrogatePairToCodePoint(charCode1, charCode2) {
  return (
    ((charCode1 & 0x3ff) << 10) +
    (charCode2 & 0x3ff) +
    0x10000
  );
}

export function utfEncodeString(str) {
  const cached = encodedStringCache.get(str);

  if (cached) return cached;

  const result = [];

  for (let i = 0; i < str.length; i++) {
    const code = str.charCodeAt(i);

    if ((code & 0xf800) === 0xd800) {
      result.push(
        surrogatePairToCodePoint(
          code,
          str.charCodeAt(++i),
        ),
      );
    } else {
      result.push(code);
    }
  }

  encodedStringCache.set(str, result);

  return result;
}

export function utfDecodeStringWithRanges(
  array,
  left,
  right,
) {
  let out = '';

  for (let i = left; i <= right; i++) {
    out += String.fromCodePoint(array[i]);
  }

  return out;
}

/* =========================================
 * OBJECT ACCESS
 * =======================================*/

export function getInObject(object, path) {
  let current = object;

  for (let i = 0; i < path.length; i++) {
    if (current == null) return null;

    const key = path[i];

    if (hasOwn.call(current, key)) {
      current = current[key];
      continue;
    }

    if (typeof current[Symbol.iterator] === 'function') {
      current = Array.from(current)[key];
      continue;
    }

    return null;
  }

  return current;
}

export function setInObject(object, path, value) {
  if (object == null) return;

  const parent = getInObject(
    object,
    path.slice(0, -1),
  );

  if (parent != null) {
    parent[path[path.length - 1]] = value;
  }
}

export function deletePathInObject(object, path) {
  if (object == null) return;

  const last = path[path.length - 1];

  const parent = getInObject(
    object,
    path.slice(0, -1),
  );

  if (!parent) return;

  if (Array.isArray(parent)) {
    parent.splice(last, 1);
  } else {
    delete parent[last];
  }
}

export function renamePathInObject(
  object,
  oldPath,
  newPath,
) {
  if (object == null) return;

  const parent = getInObject(
    object,
    oldPath.slice(0, -1),
  );

  if (!parent) return;

  const oldKey = oldPath[oldPath.length - 1];
  const newKey = newPath[newPath.length - 1];

  parent[newKey] = parent[oldKey];

  if (Array.isArray(parent)) {
    parent.splice(oldKey, 1);
  } else {
    delete parent[oldKey];
  }
}

/* =========================================
 * SHALLOW DIFF
 * =======================================*/

export function shallowDiffers(prev, next) {
  for (const key in prev) {
    if (!(key in next)) return true;
  }

  for (const key in next) {
    if (prev[key] !== next[key]) {
      return true;
    }
  }

  return false;
}

/* =========================================
 * TYPE DETECTION
 * =======================================*/

export function isPlainObject(obj) {
  if (obj == null || typeof obj !== 'object') {
    return false;
  }

  const proto = Object.getPrototypeOf(obj);

  return (
    proto === Object.prototype ||
    proto === null
  );
}

function isError(data) {
  return (
    data instanceof Error ||
    (
      typeof data === 'object' &&
      typeof data?.message === 'string'
    )
  );
}

export function getDataType(data) {
  if (data === null) return 'null';
  if (data === undefined) return 'undefined';

  const type = typeof data;

  switch (type) {
    case 'string':
    case 'boolean':
    case 'symbol':
    case 'function':
    case 'bigint':
      return type;

    case 'number':
      if (Number.isNaN(data)) return 'nan';
      if (!Number.isFinite(data)) {
        return data > 0
          ? 'infinity'
          : '-infinity';
      }
      return 'number';

    case 'object':
      if (Array.isArray(data)) {
        return 'array';
      }

      if (ArrayBuffer.isView(data)) {
        return 'typed_array';
      }

      if (data instanceof Date) {
        return 'date';
      }

      if (data instanceof RegExp) {
        return 'regexp';
      }

      if (isError(data)) {
        return 'error';
      }

      if (typeof data.then === 'function') {
        return 'thenable';
      }

      if (!isPlainObject(data)) {
        return 'class_instance';
      }

      return 'object';

    default:
      return 'unknown';
  }
}

/* =========================================
 * STRING FORMAT
 * =======================================*/

function truncateForDisplay(
  str,
  len = MAX_PREVIEW_STRING_LENGTH,
) {
  return str.length > len
    ? str.slice(0, len) + '…'
    : str;
}

/* =========================================
 * PREVIEW FORMATTER
 * =======================================*/

export function formatDataForPreview(
  data,
  showFormattedValue = true,
) {
  const type = getDataType(data);

  switch (type) {
    case 'string':
      return `"${truncateForDisplay(data)}"`;

    case 'number':
    case 'boolean':
    case 'bigint':
    case 'null':
    case 'undefined':
      return String(data);

    case 'nan':
      return 'NaN';

    case 'infinity':
      return 'Infinity';

    case '-infinity':
      return '-Infinity';

    case 'function':
      return `${data.name || 'anonymous'}()`;

    case 'array':
      if (!showFormattedValue) {
        return `Array(${data.length})`;
      }

      return `[${truncateForDisplay(
        data
          .slice(0, 5)
          .map(v =>
            formatDataForPreview(v, false),
          )
          .join(', '),
      )}]`;

    case 'object':
      if (!showFormattedValue) {
        return '{…}';
      }

      const keys = Object.keys(data);

      return `{${truncateForDisplay(
        keys
          .slice(0, 5)
          .map(
            key =>
              `${key}: ${formatDataForPreview(
                data[key],
                false,
              )}`,
          )
          .join(', '),
      )}}`;

    case 'typed_array':
      return `${data.constructor.name}(${data.length})`;

    case 'regexp':
      return String(data);

    case 'date':
      return data.toISOString();

    case 'error':
      return truncateForDisplay(
        data.stack || data.message,
      );

    case 'thenable':
      return 'Promise';

    case 'class_instance':
      return (
        data.constructor?.name ||
        'ClassInstance'
      );

    default:
      try {
        return truncateForDisplay(String(data));
      } catch {
        return 'unserializable';
      }
  }
}

/* =========================================
 * UNION ARRAY
 * =======================================*/

export function unionOfTwoArrays(a, b) {
  const set = new Set(a);

  for (const item of b) {
    set.add(item);
  }

  return Array.from(set);
}

/* =========================================
 * URL NORMALIZER
 * =======================================*/

export function normalizeUrlIfValid(url) {
  try {
    return new URL(url).toString();
  } catch {
    return url;
  }
}

/* =========================================
 * OPERATIONS LOGGER
 * =======================================*/

export function printOperationsArray(
  operations,
) {
  const rendererID = operations[0];
  const rootID = operations[1];

  console.groupCollapsed(
    `[DevTools] renderer=${rendererID} root=${rootID}`,
  );

  console.table(operations);

  console.groupEnd();
}
