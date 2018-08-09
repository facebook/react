/**
 * Copyright (c) 2016-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

export default function(
  name: null | string,
  source: any,
  ownerName: null | string,
) {
  let sourceInfo = '';
  if (source) {
    sourceInfo =
      ' (at ' +
      source.fileName.replace(/^.*[\\\/]/, '') +
      ':' +
      source.lineNumber +
      ')';
  } else if (ownerName) {
    sourceInfo = ' (created by ' + ownerName + ')';
  }

  return '\n    in ' + (name || 'Unknown') + sourceInfo;
}
