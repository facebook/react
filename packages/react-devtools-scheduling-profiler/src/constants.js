/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

export const REACT_TOTAL_NUM_LANES = 31;

// Forked from react-devtools-shared/src/constants.js:
// HACK
//
// Extracting during build time avoids a temporarily invalid state for the inline target.
// Sometimes the inline target is rendered before root styles are applied,
// which would result in e.g. NaN itemSize being passed to react-window list.
//
let COMFORTABLE_LINE_HEIGHT;
let COMPACT_LINE_HEIGHT;

try {
  // $FlowFixMe
  const rawStyleString = require('!!raw-loader!react-devtools-shared/src/devtools/views/root.css')
    .default;

  const extractVar = varName => {
    const regExp = new RegExp(`${varName}: ([0-9]+)`);
    const match = rawStyleString.match(regExp);
    return parseInt(match[1], 10);
  };

  COMFORTABLE_LINE_HEIGHT = extractVar('comfortable-line-height-data');
  COMPACT_LINE_HEIGHT = extractVar('compact-line-height-data');
} catch (error) {
  // We can't use the Webpack loader syntax in the context of Jest,
  // so tests need some reasonably meaningful fallback value.
  COMFORTABLE_LINE_HEIGHT = 15;
  COMPACT_LINE_HEIGHT = 10;
}

export {COMFORTABLE_LINE_HEIGHT, COMPACT_LINE_HEIGHT};
