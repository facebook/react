// @flow

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
import { getDisplayName } from './utils';

export const meta = {
  name: Symbol('name'),
  type: Symbol('type'),
  inspected: Symbol('inspected'),
  meta: Symbol('meta'),
  proto: Symbol('proto'),
};

// This threshold determines the depth at which the bridge "dehydrates" nested data.
// Dehydration means that we don't serialize the data for e.g. postMessage or stringify,
// unless the frontend explicitly requests it (e.g. a user clicks to expand a props object).
// We tried reducing this value from 2 to 1 to improve performance:
// https://github.com/facebook/react-devtools/issues/1200
// But this caused problems with the Profiler's interaction tracing output.
// Because React mutates Fibers, profiling data that is dehydrated for old commits–
// will not be available later from within the Profiler.
// This impacts props/state as well as Interactions.
// https://github.com/facebook/react-devtools/issues/1262
const LEVEL_THRESHOLD = 6;

/**
 * Get a enhanced/artificial type string based on the object instance
 */
function getPropType(data: Object): string | null {
  if (!data) {
    return null;
  }

  if (isElement(data)) {
    return 'react_element';
  }

  const type = typeof data;
  if (type === 'object') {
    if (Array.isArray(data)) {
      return 'array';
    }
    if (ArrayBuffer.isView(data)) {
      if (data instanceof DataView) {
        return 'data_view';
      }
      return 'typed_array';
    }
    if (data instanceof ArrayBuffer) {
      return 'array_buffer';
    }
    if (typeof data[Symbol.iterator] === 'function') {
      return 'iterator';
    }
    if (Object.prototype.toString.call(data) === '[object Date]') {
      return 'date';
    }
  }

  return type;
}

/**
 * Generate the dehydrated metadata for complex object instances
 */
function createDehydrated(
  type: string,
  data: Object,
  cleaned: Array<Array<string>>,
  path: Array<string>
): Object {
  const meta = {};

  if (type === 'array' || type === 'typed_array') {
    meta.length = data.length;
  }
  if (type === 'iterator' || type === 'typed_array') {
    meta.readOnly = true;
  }

  cleaned.push(path);

  return {
    type,
    meta,
    name:
      !data.constructor || data.constructor.name === 'Object'
        ? ''
        : data.constructor.name,
  };
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
  cleaned: Array<Array<string>>,
  path?: Array<string> = [],
  level?: number = 0
): string | Object {
  const type = getPropType(data);

  switch (type) {
    case 'function':
      cleaned.push(path);
      return {
        name: data.name,
        type: 'function',
      };

    case 'string':
      return data.length <= 500 ? data : data.slice(0, 500) + '...';

    // We have to do this assignment b/c Flow doesn't think "symbol" is
    // something typeof would return. Error 'unexpected predicate "symbol"'
    case 'symbol':
      cleaned.push(path);
      return {
        type: 'symbol',
        name: data.toString(),
      };

    // React Elements aren't very inspector-friendly,
    // and often contain private fields or circular references.
    case 'react_element':
      cleaned.push(path);
      return {
        name: getDisplayNameForReactElement(data),
        type: 'react_element',
      };

    // ArrayBuffers error if you try to inspect them.
    case 'array_buffer':
    case 'data_view':
      cleaned.push(path);
      return {
        type,
        name: type === 'data_view' ? 'DataView' : 'ArrayBuffer',
        meta: {
          length: data.byteLength,
          uninspectable: true,
        },
      };

    case 'array':
      if (level > LEVEL_THRESHOLD) {
        return createDehydrated(type, data, cleaned, path);
      }
      return data.map((item, i) =>
        dehydrate(item, cleaned, path.concat([i]), level + 1)
      );

    case 'typed_array':
    case 'iterator':
      return createDehydrated(type, data, cleaned, path);
    case 'date':
      cleaned.push(path);
      return {
        name: data.toString(),
        type: 'date',
        meta: {
          uninspectable: true,
        },
      };
    case 'object':
      if (
        level > LEVEL_THRESHOLD ||
        (data.constructor &&
          typeof data.constructor === 'function' &&
          data.constructor.name !== 'Object')
      ) {
        return createDehydrated(type, data, cleaned, path);
      } else {
        const res = {};
        for (let name in data) {
          res[name] = dehydrate(
            data[name],
            cleaned,
            path.concat([name]),
            level + 1
          );
        }
        return res;
      }

    default:
      return data;
  }
}

export function hydrate(data: Object, cleaned: Array<Array<string>>): Object {
  cleaned.forEach((path: Array<string>) => {
    const last = path.pop();
    const reduced: Object = path.reduce(
      (object: Object, attr: string) => (object ? object[attr] : (null: any)),
      data
    );
    if (!reduced || !reduced[last]) {
      return;
    }
    const replace: { [key: Symbol]: boolean | string } = {};
    replace[meta.name] = reduced[last].name;
    replace[meta.type] = reduced[last].type;
    replace[meta.meta] = reduced[last].meta;
    replace[meta.inspected] = false;
    reduced[last] = replace;
  });
  return data;
}

export function getDisplayNameForReactElement(
  element: React$Element<any>
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
      const { type } = element;
      if (typeof type === 'string') {
        return type;
      } else if (type != null) {
        return getDisplayName(type, 'Anonymous');
      } else {
        return 'Element';
      }
  }
}
