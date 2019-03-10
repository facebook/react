// @flow

import { dehydrate } from '../hydration';

import type { DehydratedData } from 'src/devtools/views/elements/types';

export function cleanForBridge(data: Object | null): DehydratedData | null {
  if (data !== null) {
    const cleaned = [];

    return {
      data: dehydrate(data, cleaned),
      cleaned,
    };
  } else {
    return null;
  }
}

export function copyWithSet(
  obj: Object | Array<any>,
  path: Array<string | number>,
  value: any,
  index: number = 0
): Object | Array<any> {
  if (index >= path.length) {
    return value;
  }
  const key = path[index];
  const updated = Array.isArray(obj) ? obj.slice() : { ...obj };
  // $FlowFixMe number or string is fine here
  updated[key] = copyWithSet(obj[key], path, value, index + 1);
  return updated;
}

export function setInObject(
  object: Object,
  path: Array<string | number>,
  value: any
) {
  const last = path.pop();
  if (object != null) {
    const parent: Object = path.reduce(
      // $FlowFixMe
      (reduced, attribute) => reduced[attribute],
      object
    );
    if (parent) {
      parent[last] = value;
    }
  }
}
