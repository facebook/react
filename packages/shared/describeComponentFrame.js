/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import getComponentLocation from 'shared/getComponentLocation';

const BEFORE_SLASH_RE = /^(.*)[\\\/]/;

export default function describeComponentFrame(
  name: null | string,
  source: any,
  ownerName: null | string,
  type: Function,
) {
  let sourceInfo = '';
  if (source) {
    const path = source.fileName;
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
            fileName = folderName + '/' + fileName;
          }
        }
      }
    }
    sourceInfo = ' (at ' + fileName + ':' + source.lineNumber + ')';
  } else if (ownerName) {
    sourceInfo = ' (created by ' + ownerName + ')';
  }
  let extraData = '';
  const componentLocation = getComponentLocation(type);
  if (componentLocation) {
    extraData = ' ' + JSON.stringify({location: componentLocation});
  }
  return '\n    in ' + (name || 'Unknown') + extraData + sourceInfo;
}
