/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

// Flip this flag to true to enable verbose console debug logging.
export const __DEBUG__ = false;

export const TREE_OPERATION_ADD = 1;
export const TREE_OPERATION_REMOVE = 2;
export const TREE_OPERATION_REORDER_CHILDREN = 3;
export const TREE_OPERATION_UPDATE_TREE_BASE_DURATION = 4;

export const LOCAL_STORAGE_FILTER_PREFERENCES_KEY =
  'React::DevTools::componentFilters';

export const SESSION_STORAGE_LAST_SELECTION_KEY =
  'React::DevTools::lastSelection';

export const SESSION_STORAGE_RECORD_CHANGE_DESCRIPTIONS_KEY =
  'React::DevTools::recordChangeDescriptions';

export const SESSION_STORAGE_RELOAD_AND_PROFILE_KEY =
  'React::DevTools::reloadAndProfile';

export const LOCAL_STORAGE_SHOULD_PATCH_CONSOLE_KEY =
  'React::DevTools::appendComponentStack';

export const PROFILER_EXPORT_VERSION = 4;

export const CHANGE_LOG_URL =
  'https://github.com/facebook/react/blob/master/packages/react-devtools/CHANGELOG.md';

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
