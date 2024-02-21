/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

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
      // eslint-disable-next-line react-internal/no-production-logging
      console.assert.apply(console, args);
      return;
    }
    default: {
      // eslint-disable-next-line react-internal/no-production-logging
      console[methodName].apply(console, args);
      return;
    }
  }
}
