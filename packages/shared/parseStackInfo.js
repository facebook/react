/**
 * Copyright (c) 2013-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 *
 */

function commonSubstring(strings) {
  const sorted = strings.sort();
  const first = sorted[0];
  const last = sorted[sorted.length - 1];
  const diffIndex = Array.from(last).findIndex(
    (char, index) => first[index] !== char,
  );
  return last.substring(0, diffIndex);
}

function parseStackInfo(info) {
  const grepFilePathsMatches = info.match(/ \/.+:/g);
  if (!grepFilePathsMatches || grepFilePathsMatches.length <= 1) {
    return info;
  }
  const commonAncestorPath = commonSubstring(grepFilePathsMatches);
  const commonAncestorPathRegex = new RegExp(commonAncestorPath, 'g');
  return info.replace(commonAncestorPathRegex, ' ');
}

export default parseStackInfo;
