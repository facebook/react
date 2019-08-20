// @flow

import { dehydrate } from '../hydration';

import type { DehydratedData } from 'src/devtools/views/Components/types';

export function cleanForBridge(
  data: Object | null,
  isPathWhitelisted: (path: Array<string | number>) => boolean,
  path?: Array<string | number> = []
): DehydratedData | null {
  if (data !== null) {
    const cleanedPaths = [];
    const unserializablePaths = [];
    const cleanedData = dehydrate(
      data,
      cleanedPaths,
      unserializablePaths,
      path,
      isPathWhitelisted
    );

    return {
      data: cleanedData,
      cleaned: cleanedPaths,
      unserializable: unserializablePaths,
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
  console.log('[utils] copyWithSet()', obj, path, index, value);
  if (index >= path.length) {
    return value;
  }
  const key = path[index];
  const updated = Array.isArray(obj) ? obj.slice() : { ...obj };
  // $FlowFixMe number or string is fine here
  updated[key] = copyWithSet(obj[key], path, value, index + 1);
  return updated;
}
