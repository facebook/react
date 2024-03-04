/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

const badgeFormat = '%c%s%c ';
const badgeStyle = `
  background: #e6e6e6;
  background: light-dark(rgba(0,0,0,0.1), rgba(255,255,255,0.25));
  color: #000;
  color: light-dark(#000, #fff);
  border-radius: 2px;
`.trim();

const resetStyle = '';
const padding = ' ';

/**
 * Prints a message to the console with a styled badge.
 * 
 * @param {string} methodName - The console method to use.
 * @param {Array} args - The arguments to pass to the console method.
 * @param {string} badgeName - The name to display on the badge.
 */
function printToConsole(methodName: string, args: Array<any>, badgeName: string): void {
  const nonColorizableMethods = new Set(['dir', 'dirxml', 'groupEnd', 'table']);

  if (nonColorizableMethods.has(methodName)) {
    // eslint-disable-next-line react-internal/no-production-logging
    console[methodName](...args);
    return;
  }

  const offset = methodName === 'assert' ? 1 : 0;
  const formattedArgs = args.slice(0);
  const badgeContent = badgeFormat + (offset ? formattedArgs[offset] : '');
  const badgeArgs = [badgeContent, badgeStyle, `${padding}${badgeName}${padding}`, resetStyle];

  formattedArgs.splice(offset, offset ? 1 : 0, ...badgeArgs);
  // eslint-disable-next-line react-internal/no-production-logging
  console[methodName](...formattedArgs);
  return;
}

export { printToConsole }
