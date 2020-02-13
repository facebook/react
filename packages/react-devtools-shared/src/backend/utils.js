/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import {copy} from 'clipboard-js';
import {dehydrate} from '../hydration';

import type {DehydratedData} from 'react-devtools-shared/src/devtools/views/Components/types';

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

export function copyToClipboard(value: any): void {
  const safeToCopy = serializeToString(value);
  const text = safeToCopy === undefined ? 'undefined' : safeToCopy;
  const {clipboardCopyText} = window.__REACT_DEVTOOLS_GLOBAL_HOOK__;

  // On Firefox navigator.clipboard.writeText has to be called from
  // the content script js code (because it requires the clipboardWrite
  // permission to be allowed out of a "user handling" callback),
  // clipboardCopyText is an helper injected into the page from.
  // injectGlobalHook.
  if (typeof clipboardCopyText === 'function') {
    clipboardCopyText(text).catch(err => {});
  } else {
    copy(text);
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

export function serializeToString(data: any): string {
  const cache = new Set();
  // Use a custom replacer function to protect against circular references.
  return JSON.stringify(data, (key, value) => {
    if (typeof value === 'object' && value !== null) {
      if (cache.has(value)) {
        return;
      }
      cache.add(value);
    }
    // $FlowFixMe
    if (typeof value === 'bigint') {
      return value.toString() + 'n';
    }
    return value;
  });
}
