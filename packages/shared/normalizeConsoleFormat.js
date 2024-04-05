/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

// Takes a format string (first argument to console) and returns a normalized
// string that has the exact number of arguments as the args. That way it's safe
// to prepend or append to it.
export default function normalizeConsoleFormat(
  formatString: string,
  args: $ReadOnlyArray<mixed>,
  firstArg: number,
): string {
  let j = firstArg;
  let normalizedString = '';
  let last = 0;
  const formatLength = formatString.length;
  
  for (let i = 0; i < formatLength - 1; i++) {
    if (formatString[i] !== '%') {
      continue;
    }
    const specifier = formatString[i + 1];
    if (specifier === 'O' || specifier === 'c' || specifier === 'd' ||
        specifier === 'f' || specifier === 'i' || specifier === 'o' ||
        specifier === 's') {
      if (j < args.length) {
        // We have a matching argument.
        j++;
      } else {
        // We have more format specifiers than arguments.
        // So we need to escape this to print the literal.
        normalizedString += formatString.slice(last, i) + '%';
        last = i;
      }
    }
  }
  normalizedString += formatString.slice(last, formatLength);
  // Pad with extra format specifiers for the rest.
  while (j < args.length) {
    // Not every environment has the same default.
    // This is what Chrome DevTools defaults to.
    normalizedString += (normalizedString ? ' ' : '') +
                        (typeof args[j] === 'string' ? '%s' : '%o');
    j++;
  }
  
  return normalizedString;
}
