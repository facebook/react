/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

const badgeFormat = '[%s] ';
const pad = ' ';

export function printToConsole(
  methodName: string,
  args: Array<any>,
  badgeName: string,
): void {
  let offset = 0;
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
      offset = 1;
    }
  }

  const newArgs = args.slice(0);
  if (typeof newArgs[offset] === 'string') {
    newArgs.splice(
      offset,
      1,
      badgeFormat + newArgs[offset],
      pad + badgeName + pad,
    );
  } else {
    newArgs.splice(offset, 0, badgeFormat, pad + badgeName + pad);
  }

  // $FlowFixMe[invalid-computed-prop]
  console[methodName].apply(console, newArgs); // eslint-disable-line react-internal/no-production-logging
}
