/**
 * Copyright 2016-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @flow
 * @providesModule describeComponentFrame
 */

'use strict';

module.exports = function(
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
};
