/**
/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import {copy} from 'clipboard-js';
import {compareVersions} from 'compare-versions';
import {dehydrate} from '../hydration';
import isArray from 'shared/isArray';

import type {DehydratedData} from 'react-devtools-shared/src/devtools/views/Components/types';

export function cleanForBridge(
  data: Object | null,
  isPathAllowed: (path: Array<string | number>) => boolean,
  path?: Array<string | number> = [],
): DehydratedData | null {
  if (data !== null) {
    const cleanedPaths: Array<Array<string | number>> = [];
    const unserializablePaths: Array<Array<string | number>> = [];
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
  const updated = isArray(obj) ? obj.slice() : {...obj};
  if (index + 1 === path.length) {
    if (isArray(updated)) {
      updated.splice(((key: any): number), 1);
    } else {
      delete updated[key];
    }
  } else {
    // $FlowFixMe[incompatible-use] number or string is fine here
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
  const updated = isArray(obj) ? obj.slice() : {...obj};
  if (index + 1 === oldPath.length) {
    const newKey = newPath[index];
    // $FlowFixMe[incompatible-use] number or string is fine here
    updated[newKey] = updated[oldKey];
    if (isArray(updated)) {
      updated.splice(((oldKey: any): number), 1);
    } else {
      delete updated[oldKey];
    }
  } else {
    // $FlowFixMe[incompatible-use] number or string is fine here
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
  const updated = isArray(obj) ? obj.slice() : {...obj};
  // $FlowFixMe[incompatible-use] number or string is fine here
  updated[key] = copyWithSet(obj[key], path, value, index + 1);
  return updated;
}

export function getEffectDurations(root: Object): {
  effectDuration: any | null,
  passiveEffectDuration: any | null,
} {
  // Profiling durations are only available for certain builds.
  // If available, they'll be stored on the HostRoot.
  let effectDuration = null;
  let passiveEffectDuration = null;
  const hostRoot = root.current;
  if (hostRoot != null) {
    const stateNode = hostRoot.stateNode;
    if (stateNode != null) {
      effectDuration =
        stateNode.effectDuration != null ? stateNode.effectDuration : null;
      passiveEffectDuration =
        stateNode.passiveEffectDuration != null
          ? stateNode.passiveEffectDuration
          : null;
    }
  }
  return {effectDuration, passiveEffectDuration};
}

export function serializeToString(data: any): string {
  const cache = new Set<mixed>();
  // Use a custom replacer function to protect against circular references.
  return JSON.stringify(data, (key, value) => {
    if (typeof value === 'object' && value !== null) {
      if (cache.has(value)) {
        return;
      }
      cache.add(value);
    }
    if (typeof value === 'bigint') {
      return value.toString() + 'n';
    }
    return value;
  });
}

// Formats an array of args with a style for console methods, using
// the following algorithm:
//     1. The first param is a string that contains %c
//          - Bail out and return the args without modifying the styles.
//            We don't want to affect styles that the developer deliberately set.
//     2. The first param is a string that doesn't contain %c but contains
//        string formatting
//          - [`%c${args[0]}`, style, ...args.slice(1)]
//          - Note: we assume that the string formatting that the developer uses
//            is correct.
//     3. The first param is a string that doesn't contain string formatting
//        OR is not a string
//          - Create a formatting string where:
//                 boolean, string, symbol -> %s
//                 number -> %f OR %i depending on if it's an int or float
//                 default -> %o
export function formatWithStyles(
  inputArgs: $ReadOnlyArray<any>,
  style?: string,
): $ReadOnlyArray<any> {
  if (
    inputArgs === undefined ||
    inputArgs === null ||
    inputArgs.length === 0 ||
    // Matches any of %c but not %%c
    (typeof inputArgs[0] === 'string' && inputArgs[0].match(/([^%]|^)(%c)/g)) ||
    style === undefined
  ) {
    return inputArgs;
  }

  // Matches any of %(o|O|d|i|s|f), but not %%(o|O|d|i|s|f)
  const REGEXP = /([^%]|^)((%%)*)(%([oOdisf]))/g;
  if (typeof inputArgs[0] === 'string' && inputArgs[0].match(REGEXP)) {
    return [`%c${inputArgs[0]}`, style, ...inputArgs.slice(1)];
  } else {
    const firstArg = inputArgs.reduce((formatStr, elem, i) => {
      if (i > 0) {
        formatStr += ' ';
      }
      switch (typeof elem) {
        case 'string':
        case 'boolean':
        case 'symbol':
          return (formatStr += '%s');
        case 'number':
          const formatting = Number.isInteger(elem) ? '%i' : '%f';
          return (formatStr += formatting);
        default:
          return (formatStr += '%o');
      }
    }, '%c');
    return [firstArg, style, ...inputArgs];
  }
}

// based on https://github.com/tmpfs/format-util/blob/0e62d430efb0a1c51448709abd3e2406c14d8401/format.js#L1
// based on https://developer.mozilla.org/en-US/docs/Web/API/console#Using_string_substitutions
// Implements s, d, i and f placeholders
// NOTE: KEEP IN SYNC with src/hook.js
export function format(
  maybeMessage: any,
  ...inputArgs: $ReadOnlyArray<any>
): string {
  const args = inputArgs.slice();

  let formatted: string = String(maybeMessage);

  // If the first argument is a string, check for substitutions.
  if (typeof maybeMessage === 'string') {
    if (args.length) {
      const REGEXP = /(%?)(%([jds]))/g;

      formatted = formatted.replace(REGEXP, (match, escaped, ptn, flag) => {
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
  }

  // Arguments that remain after formatting.
  if (args.length) {
    for (let i = 0; i < args.length; i++) {
      formatted += ' ' + String(args[i]);
    }
  }

  // Update escaped %% values.
  formatted = formatted.replace(/%{2,2}/g, '%');

  return String(formatted);
}

export function isSynchronousXHRSupported(): boolean {
  return !!(
    window.document &&
    window.document.featurePolicy &&
    window.document.featurePolicy.allowsFeature('sync-xhr')
  );
}

export function gt(a: string = '', b: string = ''): boolean {
  return compareVersions(a, b) === 1;
}

export function gte(a: string = '', b: string = ''): boolean {
  return compareVersions(a, b) > -1;
}
