/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

// Keep in sync with ReactClientConsoleConfig
const badgeFormat = '[%s] ';
const padLength = 1;
const pad = ' ';

// This mutates the args to remove any badges that was added by a FlightClient and
// returns the name in the badge. This is used when a FlightClient replays inside
// a FlightServer and we capture those replays.
export function unbadgeConsole(
  methodName: string,
  args: Array<any>,
): null | string {
  let offset = 0;
  switch (methodName) {
    case 'dir':
    case 'dirxml':
    case 'groupEnd':
    case 'table': {
      // These methods cannot be colorized because they don't take a formatting string.
      // So we wouldn't have added any badge in the first place.
      // $FlowFixMe
      return null;
    }
    case 'assert': {
      // assert takes formatting options as the second argument.
      offset = 1;
    }
  }
  const format = args[offset];
  const badge = args[offset + 1];
  if (
    typeof format === 'string' &&
    format.startsWith(badgeFormat) &&
    typeof badge === 'string' &&
    badge.startsWith(pad) &&
    badge.endsWith(pad)
  ) {
    // Remove our badging from the arguments.
    args.splice(offset, 2, format.slice(badgeFormat.length));
    return badge.slice(padLength, badge.length - padLength);
  }
  return null;
}
