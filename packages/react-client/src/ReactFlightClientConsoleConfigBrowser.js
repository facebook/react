/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import normalizeConsoleFormat from 'shared/normalizeConsoleFormat';

const badgeFormat = ' %c%s%c';
// Same badge styling as DevTools.
const badgeStyle =
  // We use a fixed background if light-dark is not supported, otherwise
  // we use a transparent background.
  'background: #e6e6e6;' +
  'background: light-dark(rgba(0,0,0,0.1), rgba(255,255,255,0.25));' +
  'color: #000000; ' +
  'color: light-dark(#000000, #ffffff); ' +
  'border-radius: 2px';
const pad = ' ';

export function printToConsole(
  methodName: string,
  args: Array<any>,
  badgeName: string,
): void {
  switch (methodName) {
    case 'dir':
    case 'dirxml':
    case 'groupEnd':
    case 'table': {
      // These methods cannot be colorized because they don't take a formatting string.
      // eslint-disable-next-line react-internal/no-production-logging
      console[methodName].apply(console, args);
      return;
    }
    case 'assert': {
      // assert takes formatting options as the second argument.
      const newArgs = args.slice(0);

      if (typeof args[1] === 'string') {
        newArgs[1] = normalizeConsoleFormat(args[1], args, 2) + badgeFormat;
      } else {
        newArgs.splice(1, 0, normalizeConsoleFormat('', args, 1) + badgeFormat);
      }

      newArgs.push(badgeStyle, pad + badgeName + pad, '');

      // eslint-disable-next-line react-internal/no-production-logging
      console.assert.apply(console, args);
      return;
    }
    default: {
      const newArgs = args.slice(0);
      if (typeof args[0] === 'string') {
        newArgs[0] = normalizeConsoleFormat(args[0], args, 1) + badgeFormat;
      } else {
        newArgs.unshift(normalizeConsoleFormat('', args, 0) + badgeFormat);
      }

      newArgs.push(badgeStyle, pad + badgeName + pad, '');

      // eslint-disable-next-line react-internal/no-production-logging
      console[methodName].apply(console, args);
      return;
    }
  }
}
