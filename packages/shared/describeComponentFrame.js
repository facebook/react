/**
 * Copyright (c) 2016-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

'use strict';

export default function(
  name: null | string,
  source: any,
  ownerName: null | string,
) {
  return (
    '\n    in ' +
    (name || 'Unknown') +
    (source
      ? ' (at ' +
          source.fileName.replace(/^.*[\\\/]/, '') +
          ':' +
          source.lineNumber +
          ')'
      : ownerName ? ' (created by ' + ownerName + ')' : '')
  );
}
