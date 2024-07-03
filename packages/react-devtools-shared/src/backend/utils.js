/**
/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import {compareVersions} from 'compare-versions';
import {dehydrate} from '../hydration';
import isArray from 'shared/isArray';

import type {Source} from 'react-devtools-shared/src/shared/types';
import type {DehydratedData} from 'react-devtools-shared/src/frontend/types';

// TODO: update this to the first React version that has a corresponding DevTools backend
const FIRST_DEVTOOLS_BACKEND_LOCKSTEP_VER = '999.9.9';
export function hasAssignedBackend(version?: string): boolean {
  if (version == null || version === '') {
    return false;
  }
  return gte(version, FIRST_DEVTOOLS_BACKEND_LOCKSTEP_VER);
}

export function cleanForBridge(
  data: Object | null,
  isPathAllowed: (path: Array<string | number>) => boolean,
  path: Array<string | number> = [],
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
  if (data === undefined) {
    return 'undefined';
  }

  if (typeof data === 'function') {
    return data.toString();
  }

  const cache = new Set<mixed>();
  // Use a custom replacer function to protect against circular references.
  return JSON.stringify(
    data,
    (key: string, value: any) => {
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
    },
    2,
  );
}

// NOTE: KEEP IN SYNC with src/hook.js
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

// NOTE: KEEP IN SYNC with src/hook.js
// Skips CSS and object arguments, inlines other in the first argument as a template string
export function formatConsoleArguments(
  maybeMessage: any,
  ...inputArgs: $ReadOnlyArray<any>
): $ReadOnlyArray<any> {
  if (inputArgs.length === 0 || typeof maybeMessage !== 'string') {
    return [maybeMessage, ...inputArgs];
  }

  const args = inputArgs.slice();

  let template = '';
  let argumentsPointer = 0;
  for (let i = 0; i < maybeMessage.length; ++i) {
    const currentChar = maybeMessage[i];
    if (currentChar !== '%') {
      template += currentChar;
      continue;
    }

    const nextChar = maybeMessage[i + 1];
    ++i;

    // Only keep CSS and objects, inline other arguments
    switch (nextChar) {
      case 'c':
      case 'O':
      case 'o': {
        ++argumentsPointer;
        template += `%${nextChar}`;

        break;
      }
      case 'd':
      case 'i': {
        const [arg] = args.splice(argumentsPointer, 1);
        template += parseInt(arg, 10).toString();

        break;
      }
      case 'f': {
        const [arg] = args.splice(argumentsPointer, 1);
        template += parseFloat(arg).toString();

        break;
      }
      case 's': {
        const [arg] = args.splice(argumentsPointer, 1);
        template += arg.toString();

        break;
      }

      default:
        template += `%${nextChar}`;
    }
  }

  return [template, ...args];
}

// based on https://github.com/tmpfs/format-util/blob/0e62d430efb0a1c51448709abd3e2406c14d8401/format.js#L1
// based on https://developer.mozilla.org/en-US/docs/Web/API/console#Using_string_substitutions
// Implements s, d, i and f placeholders
export function formatConsoleArgumentsToSingleString(
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

export const isReactNativeEnvironment = (): boolean => {
  // We've been relying on this for such a long time
  // We should probably define the client for DevTools on the backend side and share it with the frontend
  return window.document == null;
};

function extractLocation(
  url: string,
): null | {sourceURL: string, line?: string, column?: string} {
  if (url.indexOf(':') === -1) {
    return null;
  }

  // remove any parentheses from start and end
  const withoutParentheses = url.replace(/^\(+/, '').replace(/\)+$/, '');
  const locationParts = /(at )?(.+?)(?::(\d+))?(?::(\d+))?$/.exec(
    withoutParentheses,
  );

  if (locationParts == null) {
    return null;
  }

  const [, , sourceURL, line, column] = locationParts;
  return {sourceURL, line, column};
}

const CHROME_STACK_REGEXP = /^\s*at .*(\S+:\d+|\(native\))/m;
function parseSourceFromChromeStack(stack: string): Source | null {
  const frames = stack.split('\n');
  // eslint-disable-next-line no-for-of-loops/no-for-of-loops
  for (const frame of frames) {
    const sanitizedFrame = frame.trim();

    const locationInParenthesesMatch = sanitizedFrame.match(/ (\(.+\)$)/);
    const possibleLocation = locationInParenthesesMatch
      ? locationInParenthesesMatch[1]
      : sanitizedFrame;

    const location = extractLocation(possibleLocation);
    // Continue the search until at least sourceURL is found
    if (location == null) {
      continue;
    }

    const {sourceURL, line = '1', column = '1'} = location;

    return {
      sourceURL,
      line: parseInt(line, 10),
      column: parseInt(column, 10),
    };
  }

  return null;
}

function parseSourceFromFirefoxStack(stack: string): Source | null {
  const frames = stack.split('\n');
  // eslint-disable-next-line no-for-of-loops/no-for-of-loops
  for (const frame of frames) {
    const sanitizedFrame = frame.trim();
    const frameWithoutFunctionName = sanitizedFrame.replace(
      /((.*".+"[^@]*)?[^@]*)(?:@)/,
      '',
    );

    const location = extractLocation(frameWithoutFunctionName);
    // Continue the search until at least sourceURL is found
    if (location == null) {
      continue;
    }

    const {sourceURL, line = '1', column = '1'} = location;

    return {
      sourceURL,
      line: parseInt(line, 10),
      column: parseInt(column, 10),
    };
  }

  return null;
}

export function parseSourceFromComponentStack(
  componentStack: string,
): Source | null {
  if (componentStack.match(CHROME_STACK_REGEXP)) {
    return parseSourceFromChromeStack(componentStack);
  }

  return parseSourceFromFirefoxStack(componentStack);
}
