/**
 * Copyright (c) 2016-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

const BEFORE_SLASH_RE = /^(.*)[\\\/]/;

export default function(
  name: null | string,
  source: any,
  ownerName: null | string,
) {
  let sourceInfo = '';
  if (source) {
    let path = source.fileName;
    let fileName = path.replace(BEFORE_SLASH_RE, '');
    if (/^index\./.test(fileName)) {
      // Special case: include closest folder name for `index.*` filenames.
      const match = path.match(BEFORE_SLASH_RE);
      if (match) {
        const pathBeforeSlash = match[1];
        if (pathBeforeSlash) {
          const folderName = pathBeforeSlash.replace(BEFORE_SLASH_RE, '');
          fileName = folderName + '/' + fileName;
        }
      }
    }
    sourceInfo = ' (at ' + fileName + ':' + source.lineNumber + ')';
  } else if (ownerName) {
    sourceInfo = ' (created by ' + ownerName + ')';
  }
  return '\n    in ' + (name || 'Unknown') + sourceInfo;
}
