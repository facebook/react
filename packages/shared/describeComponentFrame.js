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
  return (
    '\n    in ' +
    (name || 'Unknown') +
    (source
      ? ' (at ' +
        // Extract filename, or folder/filename in the case of an
        // index file, e.g. "Foo.js", or "Bar/index.js"
        source.fileName.match(/[^\\\/]*([\\\/]index\.[^\\\/]+)?$/)[0] +
        ':' +
        source.lineNumber +
        ')'
      : ownerName
        ? ' (created by ' + ownerName + ')'
        : '')
  );
}
