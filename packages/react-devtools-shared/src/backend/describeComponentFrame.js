/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

// This file was forked from the React GitHub repo:
// https://raw.githubusercontent.com/facebook/react/master/packages/shared/describeComponentFrame.js
//
// It has been modified slightly to add a zero width space as commented below.

const BEFORE_SLASH_RE = /^(.*)[\\/]/;

export default function describeComponentFrame(
  name: null | string,
  source: any,
  ownerName: null | string,
) {
  let sourceInfo = '';
  if (source) {
    let path = source.fileName;
    let fileName = path.replace(BEFORE_SLASH_RE, '');
    if (__DEV__) {
      // In DEV, include code for a common special case:
      // prefer "folder/index.js" instead of just "index.js".
      if (/^index\./.test(fileName)) {
        const match = path.match(BEFORE_SLASH_RE);
        if (match) {
          const pathBeforeSlash = match[1];
          if (pathBeforeSlash) {
            const folderName = pathBeforeSlash.replace(BEFORE_SLASH_RE, '');
            // Note the below string contains a zero width space after the "/" character.
            // This is to prevent browsers like Chrome from formatting the file name as a link.
            // (Since this is a source link, it would not work to open the source file anyway.)
            fileName = folderName + '/​' + fileName;
          }
        }
      }
    }
    sourceInfo = ' (at ' + fileName + ':' + source.lineNumber + ')';
  } else if (ownerName) {
    sourceInfo = ' (created by ' + ownerName + ')';
  }
  return '\n    in ' + (name || 'Unknown') + sourceInfo;
}
