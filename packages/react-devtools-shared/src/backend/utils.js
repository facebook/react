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
  isPathAllowed: (path: Array<string | number>) => boolean,
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
      isPathAllowed,
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

export function copyWithDelete(
  obj: Object | Array<any>,
  path: Array<string | number>,
  index: number = 0,
): Object | Array<any> {
  const key = path[index];
  const updated = Array.isArray(obj) ? obj.slice() : {...obj};
  if (index + 1 === path.length) {
    if (Array.isArray(updated)) {
      updated.splice(((key: any): number), 1);
    } else {
      delete updated[key];
    }
  } else {
    // $FlowFixMe number or string is fine here
    updated[key] = copyWithDelete(obj[key], path, index + 1);
  }
  return updated;
}

// This function expects paths to be the same except for the final value.
// e.g. ['path', 'to', 'foo'] and ['path', 'to', 'bar']
export function copyWithRename(
  obj: Object | Array<any>,
  oldPath: Array<string | number>,
  newPath: Array<string | number>,
  index: number = 0,
): Object | Array<any> {
  const oldKey = oldPath[index];
  const updated = Array.isArray(obj) ? obj.slice() : {...obj};
  if (index + 1 === oldPath.length) {
    const newKey = newPath[index];
    // $FlowFixMe number or string is fine here
    updated[newKey] = updated[oldKey];
    if (Array.isArray(updated)) {
      updated.splice(((oldKey: any): number), 1);
    } else {
      delete updated[oldKey];
    }
  } else {
    // $FlowFixMe number or string is fine here
    updated[oldKey] = copyWithRename(obj[oldKey], oldPath, newPath, index + 1);
  }
  return updated;
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

// based on https://github.com/tmpfs/format-util/blob/0e62d430efb0a1c51448709abd3e2406c14d8401/format.js#L1
// based on https://developer.mozilla.org/en-US/docs/Web/API/console#Using_string_substitutions
// Implements s, d, i and f placeholders
export function format(
  maybeMessage: any,
  ...inputArgs: $ReadOnlyArray<any>
): string {
  if (typeof maybeMessage !== 'string') {
    return [maybeMessage, ...inputArgs].join(' ');
  }

  const re = /(%?)(%([jds]))/g;
  const args = inputArgs.slice();
  let formatted: string = maybeMessage;

  if (args.length) {
    formatted = formatted.replace(re, (match, escaped, ptn, flag) => {
      let arg = args.shift();
      switch (flag) {
        case 's':
          arg += '';
          break;
        case 'd':
        case 'i':
          arg = parseInt(arg, 10).toString();
          break;
        case 'f':
          arg = parseFloat(arg).toString();
          break;
      }
      if (!escaped) {
        return arg;
      }
      args.unshift(arg);
      return match;
    });
  }

  // arguments remain after formatting
  if (args.length) {
    formatted += ' ' + args.join(' ');
  }

  // update escaped %% values
  formatted = formatted.replace(/%{2,2}/g, '%');

  return '' + formatted;
}

export function isSynchronousXHRSupported(): boolean {
  return !!(
    window.document &&
    window.document.featurePolicy &&
    window.document.featurePolicy.allowsFeature('sync-xhr')
  );
}
