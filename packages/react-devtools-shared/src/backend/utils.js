/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import {dehydrate, getDisplayNameForReactElement} from '../hydration';

import type {DehydratedData} from 'react-devtools-shared/src/devtools/views/Components/types';
import {isElement} from 'react-is';

export function cleanForBridge(
  data: Object | null,
  isPathWhitelisted: (path: Array<string | number>) => boolean,
  path?: Array<string | number> = [],
): DehydratedData | null {
  if (data !== null) {
    const cleanedPaths = [];
    const unserializablePaths = [];
    const cleanedData = dehydrate(
      data,
      cleanedPaths,
      unserializablePaths,
      path,
      isPathWhitelisted,
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
  index: number = 0,
): Object | Array<any> {
  if (index >= path.length) {
    return value;
  }
  const key = path[index];
  const updated = Array.isArray(obj) ? obj.slice() : {...obj};
  // $FlowFixMe number or string is fine here
  updated[key] = copyWithSet(obj[key], path, value, index + 1);
  return updated;
}

function getSanitizedValue(value: Object) {
  if (typeof value === 'function') {
    return `${value.name}()`;
  }

  if (isElement(value)) {
    return `<${getDisplayNameForReactElement(value) || ''} />`;
  }

  if (typeof HTMLElement !== 'undefined' && value instanceof HTMLElement) {
    return `<${value.tagName} />`;
  }

  if (typeof value !== 'object') {
    return value;
  }

  return null;
}

function sanitize(data: Object) {
  for (const key in data) {
    const value = data[key];
    const sanitizedValue = getSanitizedValue(value);

    if (sanitizedValue === null && typeof value === 'object') {
      sanitize(value);
    } else {
      data[key] = sanitizedValue;
    }
  }
}

export function sanitizeForCopy(data: Object) {
  const clone = Object.assign({}, data);
  if (clone.hasOwnProperty('children')) {
    delete clone.children;
  }

  sanitize(clone);
  return clone;
}
